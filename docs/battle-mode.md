# Battle Mode Specification

## Overview

2-player online battle mode using [nostr-battle-room](../packages/nostr-battle-room/) for real-time P2P communication.

For generic battle room documentation, see:

- [packages/nostr-battle-room/docs/architecture.md](../packages/nostr-battle-room/docs/architecture.md)
- [packages/nostr-battle-room/docs/protocol.md](../packages/nostr-battle-room/docs/protocol.md)

---

## Sasso-Specific Implementation

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

**Trigger conditions:**

- 3+ digits eliminated simultaneously
- 2+ chain reactions

Attack power = score from that elimination.

---

## Implementation Files

| File                                      | Purpose                                          |
| ----------------------------------------- | ------------------------------------------------ |
| `src/hooks/useBattleMode.ts`              | Main battle mode orchestrator                    |
| `src/hooks/useBattleRoom.ts`              | Room management (uses nostr-battle-room pattern) |
| `src/hooks/useSeededPrediction.ts`        | Deterministic prediction with shared seed        |
| `src/components/battle/BattleApp.tsx`     | Battle mode UI                                   |
| `src/components/battle/BattleOverlay.tsx` | Waiting/Victory/Defeat overlays                  |
| `src/components/battle/OpponentPanel.tsx` | Opponent display                                 |
