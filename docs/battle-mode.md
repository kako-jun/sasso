# Battle Mode Specification

## Overview

2-player online battle mode using [nostr-arena](../packages/nostr-arena/) for real-time P2P communication.

For generic battle room documentation, see:

- [packages/nostr-arena/docs/architecture.md](../packages/nostr-arena/docs/architecture.md)
- [packages/nostr-arena/docs/protocol.md](../packages/nostr-arena/docs/protocol.md)

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

### Room URL

**形式:**

```
https://sasso.app/battle/{room-id}
```

| 項目     | 仕様                        |
| -------- | --------------------------- |
| 発行方法 | Create Room ボタン          |
| 共有方法 | ユーザーが任意の方法で共有  |
| 有効期限 | 10分（作成から）            |
| 使用回数 | 1回のみ（対戦終了後は無効） |

### Returning to Single-Player

- **対戦中**: Surrender (C/Eキー or digit after =) → Leave
- **待機中**: Cancel ボタン
- **結果画面**: Leave ボタン

---

## Game State

Sassoのゲーム状態（`TGameState`として送信）:

```typescript
interface SassoGameState {
  display: string; // 現在の表示値
  score: number; // スコア
  chains: number; // 現在のチェーン数
  calculationHistory: string; // 直前の計算式
  attack?: { power: number; timestamp: number }; // 攻撃イベント
}
```

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

## Implementation Files

| File                                            | Purpose                                    |
| ----------------------------------------------- | ------------------------------------------ |
| `src/hooks/useBattleMode.ts`                    | Main battle mode orchestrator              |
| `src/hooks/useArena.ts`                         | Room management (uses nostr-arena pattern) |
| `src/hooks/useSeededPrediction.ts`              | Deterministic prediction with shared seed  |
| `src/hooks/usePredictionTimer.ts`               | Shared prediction countdown logic          |
| `src/hooks/useElimination.ts`                   | Shared chain elimination and scoring       |
| `src/components/battle/BattleApp.tsx`           | Battle mode UI and layout orchestration    |
| `src/components/battle/BattleLayout.tsx`        | Desktop/Mobile responsive layout           |
| `src/components/battle/BattleOverlay.tsx`       | Waiting/Victory/Defeat overlays            |
| `src/components/battle/MobileOpponentScore.tsx` | Mobile opponent score display              |
| `src/components/battle/OpponentHeader.tsx`      | Desktop opponent header bar                |
| `src/components/battle/RoomCreation.tsx`        | Room creation/join UI with QR code scanner |
| `src/components/battle/AttackIndicator.tsx`     | Attack visual indicator                    |
