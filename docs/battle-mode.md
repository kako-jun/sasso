# Battle Mode Specification

## Overview

2-player online battle mode using Nostr protocol for real-time P2P communication.

---

## User-Facing Specification

### Battle Flow

```
1. Player A: メニューから "Battle" を選択
2. Player A: "Create Room" をクリック → URL生成
3. Player A: URLをコピーして相手に共有（LINE, Discord等）
4. Player A: 「Waiting for opponent...」画面で待機
5. Player B: 共有されたURLをクリック → 自動でルームに参加
6. 両者: 「Opponent found!」表示
7. 両者: 任意のキーを押すとゲーム開始
8. ゲーム終了: Victory/Defeat 画面表示
9. Leave ボタンで1人用モードに戻る
```

### Room URL

**形式:**

```
https://sasso.app/battle/{room-id}
```

**特性:**
| 項目 | 仕様 | 実装状況 |
| ----------------- | ----------------------------- | ---------- |
| 発行方法 | Create Room ボタン | ✓ 実装済 |
| 共有方法 | ユーザーが任意の方法で共有 | ✓ |
| 有効期限 | 10分（作成から） | ✓ 実装済 |
| 使用回数 | 1回のみ（対戦終了後は無効） | ✓ |
| ブラウザURL更新 | 作成/参加時に自動更新 | ✓ 実装済 |

### Waiting State (ルーム作成後)

| 操作          | 動作                                  | 実装状況 |
| ------------- | ------------------------------------- | -------- |
| 待機          | 「Waiting for opponent...」表示       | ✓        |
| キャンセル    | Cancelボタンでルーム破棄、1人用に戻る | ✓        |
| ページ離脱    | localStorageに保存、再接続可能        | ✓ 実装済 |
| ページ再読込  | 自動で再接続を試みる                  | ✓ 実装済 |
| 途中離脱→復帰 | 10分以内なら同じルームに再接続可能    | ✓ 実装済 |

### Game End (対戦終了後)

| 操作     | 動作                                  | 実装状況 |
| -------- | ------------------------------------- | -------- |
| 結果表示 | Victory/Defeat + 両者のスコア         | ✓        |
| Leave    | 1人用モードに戻る                     | ✓        |
| Rematch  | 両者がRematchを押すと同じルームで再戦 | ✓ 実装済 |

### Returning to Single-Player

1人用モードに戻る方法:

- **対戦中**: Surrender (C/Eキー or digit after =) → Leave
- **待機中**: Cancel ボタン
- **結果画面**: Leave ボタン

ブラウザを閉じる必要はありません。

---

## Implemented Features

### Rematch (実装済)

- 対戦終了後に両者がRematchボタンを押すと再戦
- 新しいシードを生成して同じルームで継続
- 相手がリマッチをリクエストすると「Opponent wants a rematch!」表示

### Reconnection (実装済)

- localStorageにルーム情報を保存
- ページ再読込時に自動で再接続を試みる
- タイムアウト: 10分（ルーム有効期限と同じ）

### Room Expiration (実装済)

- ルーム作成から10分経過で自動無効化
- 参加時に期限切れチェック

### Disconnect Detection (実装済)

- 相手の切断を検知してゲーム終了
- ハートビート間隔: 3秒
- 切断判定: 10秒無応答
- 切断時は相手の勝利として処理

---

## Technical Specification

### Technology Choice: Nostr

**Why Nostr?**

- No server required: Relays handle message passing
- No NAT traversal issues: Unlike WebRTC, relays bypass NAT problems
- No garbage data: Ephemeral events are not stored
- Real-time: WebSocket-based, ~50-200ms latency
- Built-in authentication: Nostr public keys serve as player IDs

### Nostr Event Types

#### Room Creation (Persistent - kind 30078)

```json
{
  "kind": 30078,
  "tags": [
    ["d", "sasso-room-{room-id}"],
    ["t", "sasso"]
  ],
  "content": {
    "type": "room",
    "status": "waiting",
    "seed": 123456789,
    "hostPubkey": "<pubkey>"
  }
}
```

#### Game State (Ephemeral - kind 25000)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "state",
    "display": "12345",
    "score": 150,
    "chains": 2,
    "calculationHistory": "12 + 3 = 15"
  }
}
```

#### Attack (Ephemeral - kind 25000)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "attack",
    "power": 250,
    "timestamp": 1704000000000
  }
}
```

#### Game Over (Ephemeral - kind 25000)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "gameover",
    "reason": "overflow",
    "finalScore": 890,
    "winner": "<opponent-pubkey>"
  }
}
```

### Prediction Synchronization

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

### Relay Configuration

```typescript
const NOSTR_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
```

### Timing Constants

| Constant             | Value    | Description                        |
| -------------------- | -------- | ---------------------------------- |
| COUNTDOWN_TIME       | 10000ms  | Prediction interval                |
| STATE_THROTTLE       | 100ms    | Min interval between state updates |
| HEARTBEAT_INTERVAL   | 3000ms   | Heartbeat sending interval         |
| DISCONNECT_THRESHOLD | 10000ms  | Time before considering disconnect |
| ROOM_EXPIRY          | 600000ms | Room expiration (10 minutes)       |

---

## Screen Layout

### Mobile (Portrait)

```
┌─────────────────────┐
│ [Prediction ×7]     │
├─────────────────────┤
│ Score: 150          │
│ Opponent: 89        │  ← Compact opponent display
├─────────────────────┤
│ ┌─────────────────┐ │
│ │     12345       │ │
│ │    [Keypad]     │ │
│ └─────────────────┘ │
├─────────────────────┤
│ 12 + 3 = 15         │
└─────────────────────┘
```

### Desktop (Wide)

```
┌─────────────────────────────────────────────────┐
│ [Prediction ×7]                                 │
├────────────────────────┬────────────────────────┤
│ Score: 150             │        Opponent        │
├────────────────────────┤ ┌────────────────────┐ │
│ ┌────────────────────┐ │ │       6789         │ │
│ │       12345        │ │ │   Score: 89        │ │
│ │      [Keypad]      │ │ │   Chains: 1        │ │
│ └────────────────────┘ │ │   67 × 2 = 134     │ │
├────────────────────────┤ └────────────────────┘ │
│ 12 + 3 = 15            │                        │
└────────────────────────┴────────────────────────┘
        YOU                      OPPONENT
```

---

## Attack System

When attacked, opponent's next prediction becomes harder:

- Higher operand values
- More multiplication/division
- Visual indicator: Grid overlay + "ATTACK!" label

Trigger conditions:

- 3+ digits eliminated simultaneously
- 2+ chain reactions

Attack power = score from that elimination.
