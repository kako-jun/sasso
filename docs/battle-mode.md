# Battle Mode - Technical Design

## Overview

2-player online battle mode using Nostr protocol for real-time communication.

## Technology Choice: Nostr

### Why Nostr?

- **No server required**: Relays handle message passing
- **No NAT traversal issues**: Unlike WebRTC, relays bypass NAT problems
- **No garbage data**: Ephemeral events are not stored
- **Real-time**: WebSocket-based, ~50-200ms latency (sufficient for 10s prediction intervals)
- **Built-in authentication**: Nostr public keys serve as player IDs

### Alternatives Considered

| Option                  | Pros                             | Cons                          |
| ----------------------- | -------------------------------- | ----------------------------- |
| WebRTC (P2P)            | Lower latency (20-50ms)          | NAT issues, TURN server costs |
| Custom WebSocket server | Full control                     | Server hosting required       |
| **Nostr (chosen)**      | Simple, no server, no NAT issues | Slightly higher latency       |

## Matchmaking

### Flow

```
1. Player A creates battle room → Generates URL
2. Player A shares URL (via Nostr, LINE, Discord, etc.)
3. Player B clicks URL → Joins room
4. Battle starts
```

### URL Format

```
https://sasso.app/battle/{room-id}
```

The sharing method is user's choice - works with any platform.

## Communication Protocol

### Nostr Event Types

#### 1. Room Creation (Persistent)

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
    "seed": 123456789
  }
}
```

#### 2. Game State (Ephemeral - not stored)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "state",
    "display": "12345",
    "score": 150,
    "chains": 2
  }
}
```

#### 3. Key Input (Ephemeral)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "keypress",
    "key": "5"
  }
}
```

#### 4. Attack (Ephemeral)

```json
{
  "kind": 25000,
  "tags": [["d", "sasso-room-{room-id}"]],
  "content": {
    "type": "attack",
    "power": 250
  }
}
```

#### 5. Game Over (Persistent for history)

```json
{
  "kind": 30078,
  "tags": [
    ["d", "sasso-result-{room-id}"],
    ["t", "sasso"]
  ],
  "content": {
    "type": "result",
    "winner": "<pubkey>",
    "loser": "<pubkey>",
    "scores": {
      "winner": 1250,
      "loser": 890
    }
  }
}
```

## Prediction Synchronization

Both players must receive the same predictions. Solution:

1. Room creator generates a random seed
2. Seed is shared in room creation event
3. Both clients use seed for deterministic prediction generation

```typescript
// Seeded random for predictions
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}
```

## Implementation Phases

### Phase 1: Foundation

- [ ] Nostr connection (nostr-tools library)
- [ ] Room creation and joining
- [ ] Basic event send/receive

### Phase 2: Core Battle

- [ ] Prediction synchronization (shared seed)
- [ ] Real-time display sync
- [ ] Attack effect transmission

### Phase 3: UI

- [ ] Split-screen layout (left/right calculators)
- [ ] Opponent's calculator display
- [ ] Battle result screen

### Phase 4: Polish

- [ ] Reconnection handling
- [ ] Timeout/disconnect detection
- [ ] Match history (optional)

## Screen Layout (Battle Mode)

### Mobile (Portrait)

Same as single-player. Opponent score shown below your score:

```
┌─────────────────────┐
│ [Prediction ×7]     │
├─────────────────────┤
│ Score: 150          │
│ Opponent: 89        │  ← Added below your score
├─────────────────────┤
│ ┌─────────────────┐ │
│ │     12345       │ │
│ │    [Keypad]     │ │
│ └─────────────────┘ │
├─────────────────────┤
│ 12 + 3 = 15         │
└─────────────────────┘
```

### PC (Wide Screen)

Side-by-side. Right side shows opponent's full calculator (header/score only, no prediction):

```
┌──────────────────────────┬──────────────────────────┐
│ [Prediction ×7]          │                          │
├──────────────────────────┼──────────────────────────┤
│ Score: 150               │ Opponent: 89             │
├──────────────────────────┼──────────────────────────┤
│ ┌──────────────────────┐ │ ┌──────────────────────┐ │
│ │       12345          │ │ │       6789           │ │
│ │      [Keypad]        │ │ │      [Keypad]        │ │
│ └──────────────────────┘ │ └──────────────────────┘ │
├──────────────────────────┼──────────────────────────┤
│ 12 + 3 = 15              │ 67 × 2 = 134             │
└──────────────────────────┴──────────────────────────┘
        YOU                        OPPONENT
```

Opponent's keypad is display-only (shows their inputs in real-time).

## Attack Visual Effects

When attacked, the prediction display changes to indicate increased difficulty:

```
Normal:                    Under Attack:
┌─────────────┐            ┌─────────────┐
│    ×7       │            │ ░░░ ×23 ░░░ │  ← Gray grid overlay
│   ○○○○○     │            │ ░░ ○○○○○ ░░ │  ← Harder numbers
└─────────────┘            └─────────────┘
```

Effects:

- **Gray grid overlay**: Indicates prediction is "corrupted" by attack
- **Larger/harder numbers**: Attack effect visible in prediction value
- **Multiple predictions**: Stacked predictions if attack queues multiple

The overlay clears after the affected prediction(s) are resolved.

## Relay Selection

Default relays for Sasso battles:

```typescript
const BATTLE_RELAYS = ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band'];
```

Users can add custom relays if needed.

## Security Considerations

- **Cheating**: Client-side calculation is vulnerable to manipulation
  - Mitigation: Both clients verify each other's scores based on observed actions
  - Accept that casual cheating is possible (not a competitive esport)
- **Impersonation**: Nostr signatures prevent impersonation
- **Replay attacks**: Room IDs include timestamp to prevent replay
