# Battle Mode Specification

## Overview

2-player online battle mode using the external [`nostr-arena`](https://www.npmjs.com/package/nostr-arena) npm package for real-time P2P communication over Nostr relays.

For generic battle room documentation, see the `nostr-arena` package README/docs.

---

## Sasso-Specific Implementation

### Battle Flow

```
1. Player A: メニューから "Battle" を選択
2. Player A: "Create Room" をクリック → URL生成
3. Player A: URLをコピーして相手に共有（LINE, Discord等）
4. Player A: 「Waiting for opponent...」画面で待機
5. Player B: 共有されたURLをクリック → 自動でルームに参加
   または: "Join Room" → QRコードをスキャン / Room IDを手入力
6. 両者: 「Opponent found!」表示
7. 両者: 任意のキーを押すとゲーム開始
8. ゲーム終了: Victory/Defeat 画面表示
9. Leave ボタンで1人用モードに戻る
```

#### ディープリンク参加のリトライ（冷たいリレー対策）

招待URL（`/battle/<id>`）をコールドな状態で開くと、4つのリレーへの WebSocket ハンドシェイクが
`nostr-arena` の 5秒 fetch 窓に間に合わず、最初の join が "Room not found" /
"No relay response: timeout" で失敗しがちだった。join 失敗ではクライアントは切断されない
（切断は `leave()` のみ）ため、ウォームになった接続を使い回す **2回目以降は即座に成功する**。

そこで sasso 側で `joinRoom` を `nostr-arena` の `withRetry` でリトライする
（`{ maxAttempts: 3, initialDelay: 800 }`）。指数バックオフ（×2）で、最初の試行は即実行・
失敗時は 800ms → 1600ms 待機して最大 3 回試みる。ディープリンク自動参加・手動 "Join Room" の
両方に効く。全試行が失敗した場合は、従来のように黙って空の Create/Join 画面へ落とすのではなく、
**最後のエラー理由を Create/Join 画面（select モード）に表示する**（`RoomCreation` の
`initialError`）。

#### 対戦中の一時的なエラー表示（接続インジケータ）

対戦中に発生する一過性のリレー/配信エラー（publish 失敗・room イベントのパース失敗・
"not connected" 等）は、これまで `useArena` の `onError` で `console.error` するだけで
ユーザーには見えなかった。これらを `BATTLE_EVENTS.ERROR` カスタムイベントとして window に
dispatch し、`useConnectionError` フックが受信して、**電卓ウィンドウの内側**に小さく目立たない
**非ブロッキングのインジケータ**（"Reconnecting…"）を表示する。

トースト（画面に浮く通知）はデザインシステムで禁止されているため、これはフロート通知ではなく、
ゲームオーバー表示（`BattleFinishedOverlay`）と同じく**ウィンドウ内に収まる**要素として、
電卓ウィンドウ本体の上端に貼り付く黒帯（System 7 風の白文字）で出す。`pointer-events: none`
かつ `z-index: 9`（ゲームオーバーオーバーレイの `z-index: 10` より下）なので、クリック・キー入力を
一切奪わず、ゲームオーバー時はオーバーレイに覆われる。最後のエラーから一定時間
（既定 4 秒 = `BANNER_DISMISS_MS`）で自動的に消え、連続してエラーが来た場合はタイマーが
再設定されるため、不安定なリレーでも 1 本の安定したインジケータにまとまる。

### Room URL

**形式:** `<deployed-origin>/battle/{room-id}`（例: `https://sasso.llll-ll.com/battle/<id>`）。URL は `window.location.origin` から構築するので、ローカル開発・本番どちらでも自動追従する。

| 項目     | 仕様                        |
| -------- | --------------------------- |
| 発行方法 | Create Room ボタン          |
| 共有方法 | ユーザーが任意の方法で共有  |
| 有効期限 | 10分（作成から）            |
| 使用回数 | 1回のみ（対戦終了後は無効） |

#### ホストの待機画面の挙動（タイムアウト/期限）

nostr-arena は `roomExpiry`（既定 10分）を join 側でしか検査しないため、ホストの待機画面は `roomState.createdAt` を使って sasso 側で経過時間を表示・判定する。

- **作成〜60秒**: 通常の "Waiting for opponent..."（QR・URL・Copy・Cancel）。
- **60秒〜10分**: 上記に加えて "Still waiting — try re-sharing the link with your opponent." の再共有を促すヒントを表示する。QR・URL・Copy は引き続き有効。
- **10分以降（期限切れ）**: リンクが無効なため QR・URL は隠し、"This room has expired." と **New Room** ボタンを表示する。New Room を押すと `leaveRoom()` で部屋を idle に戻して Create/Join 画面へ戻る（自動遷移はせず、ユーザーのクリックを待つ）。

### Returning to Single-Player

- **対戦中**: Surrender (C/Eキー or digit after =) → Leave
- **待機中**: Cancel ボタン
- **結果画面**: Leave ボタン

#### 相手の切断による決着（"OPPONENT LEFT" / "DISCONNECTED"）

`nostr-arena` は約10秒のハートビート喪失で相手の切断を検出し、
`BATTLE_EVENTS.OPPONENT_DISCONNECT` を dispatch する。これを `useBattleLifecycle` が受け、
**ゲームが進行中（`gameStarted && !isGameOver`）のときだけ**処理する:

- 検出した側を**勝者**にする（`isWinner = true` / `isDisconnectEnd = true`）。結果画面には
  通常の "VICTORY" ではなく **"OPPONENT LEFT"** を表示する。
- 同時に `room.sendGameOver('disconnect', score)` で**権威的な gameover 通知**を送る。これは
  一時的に切れて戻ってくる相手（再接続するクライアント）に「あなたは切断負けです」と伝え、
  両者が「自分が勝った」と食い違うのを防ぐためのもの。

切断負けの通知を受け取った側（`OPPONENT_GAMEOVER` の `detail.reason === 'disconnect'`）は、
通常の相手ゲームオーバー（=自分の勝ち）と区別し、**敗者**として扱う
（`isWinner = false` / `isDisconnectEnd = true`）。結果画面には **"DISCONNECTED"** を表示する。
それ以外の理由（overflow / surrender 等）の `OPPONENT_GAMEOVER` は従来どおり自分の勝ち
（`isWinner = true`）。

**一過性イベントの限界**: `sendGameOver('disconnect')` は ephemeral なイベントなので、
完全に離脱してしまった（二度と戻らない）クライアントはこれを受け取れない。あくまで
ベストエフォートで、再接続してきた相手との合意を取るための仕組み。`isDisconnectEnd` は
`resetGameState` / `startGame` / rematch でクリアされる。

---

## Game State

Sassoのゲーム状態（`TGameState`として送信。実体は `src/types/battle.ts` を参照）:

```typescript
interface SassoGameState {
  display: string; // 現在の表示値
  score: number; // スコア
  chains: number; // 現在のチェーン数
  calculationHistory: string; // 直前の計算式
  attack?: { power: number; timestamp: number }; // 攻撃イベント（timestamp で新規判定）
  prediction?: Prediction | null; // 相手側に表示する予測
  countdown?: number; // 相手側カウントダウン（ms）
  lastScoreBreakdown?: ScoreResult | null; // 相手のスコア内訳ポップアップ用
  isUnderAttack?: boolean; // 相手が被攻撃中か（演出用）
  lastKey?: string | null; // 直前のキー（Keypad ハイライト演出用）
}
```

`attack` は `useBattleAttack` が `queueOutgoingAttack`（旧 `onAttack`）で `outgoingAttack` に
セットし、`useBattleMode` が次の state 送信時にゲーム状態へ埋め込んでから `clearOutgoingAttack`
する。受信側は `useArena.onOpponentState` 内で `timestamp` を見て新着判定し、
`BATTLE_EVENTS.ATTACK` カスタムイベントを window に dispatch する。`useBattleAttack` がこれを
受信して `pendingAttackPower` / `isUnderAttack` をセットする。

#### 送信の駆動条件（ローカルのゲームライフサイクル）

state の送信（`room.sendState`）は **`room.status` ではなく、自分のローカルな
`gameStarted && !isGameOver`** で駆動する。`nostr-arena` は room を `'ready'` のままにし、
`'playing'` ステータスを**一度もセットしない**ため、旧来の `room.status === 'playing'` 分岐は
到達しないデッドコードだった。送信はローカルのゲーム進行（任意キーで開始〜ゲームオーバー）に
追従させる。

なお、送信は `isGameOver` で止まるため、敗着の手（`isGameOver = true` にする最後の操作）の
state は送られず、**相手に表示されるスコアはゲーム終了時に最大1手ぶん古くなりうる**。
勝敗の結果には影響しない（表示のみ）。

---

## Prediction Synchronization

Both players receive identical predictions via shared seed:

```typescript
// LCG-based seeded random (same as glibc)
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}
```

Difficulty scaling uses `predictionCount` (not time) for deterministic sync.

---

## Screen Layout

### Mobile (Portrait)

```
┌─────────────────────────┐
│ Menu  Game  About   150 │  ← MenuBar with player score
│                   vs 89 │  ← Opponent score (right-aligned)
├─────────────────────────┤
│ [Prediction ×7]         │
├─────────────────────────┤
│ Score: +30 = ...        │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │       12345         │ │
│ │      [Keypad]       │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ 12 + 3 = 15             │
└─────────────────────────┘
```

### Desktop (Wide) - 50/50 Split

```
┌─────────────────────────┬─────────────────────────┐
│ Menu Game About     150 │                      89 │  ← Player MenuBar / Opponent score bar
├─────────────────────────┼─────────────────────────┤
│                         │                         │
│ [Prediction ×7]         │                         │
│                         │                         │
│ Score: +30 = ...        │ Score: ...              │
│                         │                         │
│ ┌─────────────────────┐ │ ┌─────────────────────┐ │
│ │       12345         │ │ │        6789         │ │
│ │      [Keypad]       │ │ │    (display only)   │ │
│ └─────────────────────┘ │ └─────────────────────┘ │
│                         │                         │
│ 12 + 3 = 15             │ 67 × 2 = 134            │
│                         │                         │
├─────────────────────────┼─────────────────────────┤
│          YOU            │        OPPONENT         │
└─────────────────────────┴─────────────────────────┘
```

- Player side: Full MenuBar with all menus
- Opponent side: Simple score bar (score + Disconnected status if applicable)
- Opponent's calculator shows display only (no keypad)

---

## Attack System

Any elimination triggers an attack. Opponent's next prediction becomes harder:

- Higher operand values (1.2x - 2.5x based on attack power)
- More multiplication/division (+10% - +50% based on attack power)
- Visual indicator: Prediction area pulses + "!" mark

Attack power = score from that elimination.

---

## 既知の無害なログ

対戦から離脱（Cancel / Leave）すると、コンソールに
`WebSocket is already in CLOSING or CLOSED state.` が数件（接続リレー数ぶん）出ることがある。

- 原因: `nostr-arena` / `nostr-tools`（SimplePool）が teardown 時に、すでに閉じかけたソケットへ
  購読 CLOSE を送るため。**ブラウザが直接出力する native ログ**で、`console.error` を上書きしても
  消せない（アプリ側からは抑制不可能。実機で検証済み）。
- 影響: 機能影響なし。離脱は正常に完了し、リスナー/タイマーのリークも無い（監査で確認済み）。
- 恒久対応: 送信前に `readyState === OPEN` をガードする修正は `nostr-arena` / `nostr-tools` 側に属する。
  将来パッケージを更新／fork できる時に対応する。それまでは静観（参照: issue #23）。

---

## Implementation Files

| File                                            | Purpose                                         |
| ----------------------------------------------- | ----------------------------------------------- |
| `src/hooks/useBattleMode.ts`                    | Main battle mode orchestrator                   |
| `src/hooks/useBattleAttack.ts`                  | Attack I/O (incoming receive + outgoing queue)  |
| `src/hooks/useBattleLifecycle.ts`               | Lifecycle FSM (start/surrender/game over/reset) |
| `src/hooks/useArena.ts`                         | Room management (uses nostr-arena pattern)      |
| `src/hooks/useSeededPrediction.ts`              | Deterministic prediction with shared seed       |
| `src/hooks/usePredictionTimer.ts`               | Shared prediction countdown logic               |
| `src/hooks/useElimination.ts`                   | Shared chain elimination and scoring            |
| `src/components/battle/BattleApp.tsx`           | Battle mode UI and layout orchestration         |
| `src/components/battle/BattleLayout.tsx`        | Desktop/Mobile responsive layout                |
| `src/components/battle/BattleOverlay.tsx`       | Waiting/Victory/Defeat overlays                 |
| `src/components/battle/MobileOpponentScore.tsx` | Mobile opponent score display                   |
| `src/components/battle/OpponentHeader.tsx`      | Desktop opponent header bar                     |
| `src/components/battle/RoomCreation.tsx`        | Room creation/join UI with QR code scanner      |

被攻撃中の演出は専用コンポーネントではなく `PredictionArea` が `isUnderAttack` prop を
受け取って自前で描画する（パルス + "!"）。
