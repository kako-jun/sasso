# Architecture

## Overview

nostr-battle-room provides a generic battle room system for 2-player online games using Nostr protocol.

```
┌─────────────────────────────────────────────────────────┐
│                      Your Game                          │
│  ┌─────────────────┐     ┌─────────────────────────┐   │
│  │   Game Logic    │────▶│  useBattleRoom (React)  │   │
│  │   (your code)   │     │  or BattleRoom (core)   │   │
│  └─────────────────┘     └───────────┬─────────────┘   │
└──────────────────────────────────────┼─────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────┐
│                   nostr-battle-room                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │                  BattleRoom                      │   │
│  │  - Room lifecycle (create/join/leave)           │   │
│  │  - State synchronization                        │   │
│  │  - Heartbeat / disconnect detection             │   │
│  │  - Rematch handling                             │   │
│  └───────────────────────┬─────────────────────────┘   │
│                          │                              │
│  ┌───────────────────────▼─────────────────────────┐   │
│  │                  NostrClient                     │   │
│  │  - Relay connection management                  │   │
│  │  - Event publishing                             │   │
│  │  - Event subscription                           │   │
│  └───────────────────────┬─────────────────────────┘   │
└──────────────────────────┼─────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Nostr Relays                         │
│         wss://relay.damus.io, wss://nos.lol, ...       │
└─────────────────────────────────────────────────────────┘
```

## Class Structure

### NostrClient

Low-level Nostr connection management.

```typescript
class NostrClient {
  // Connection
  connect(): void;
  disconnect(): void;

  // Properties
  get isConnected(): boolean;
  get publicKey(): string;

  // Operations
  publish(event): Promise<void>;
  subscribe(filters, onEvent): Unsubscribe;
  fetch(filter, timeout): Promise<NostrEvent[]>;
}
```

**Responsibilities:**

- Manage WebSocket connections to relays
- Generate/store Nostr key pair
- Sign and publish events
- Subscribe to event streams

### BattleRoom

Main class for room management.

```typescript
class BattleRoom<TGameState> {
  // Connection
  connect(): void;
  disconnect(): void;

  // Room lifecycle
  create(baseUrl?): Promise<string>;
  join(roomId): Promise<void>;
  leave(): void;
  reconnect(): Promise<boolean>;

  // Game state
  sendState(state: TGameState): void;
  sendGameOver(reason, score?): void;
  requestRematch(): void;
  acceptRematch(): void;

  // Event callbacks
  onOpponentJoin(callback): this;
  onOpponentState(callback): this;
  onOpponentDisconnect(callback): this;
  onOpponentGameOver(callback): this;
  onRematchRequested(callback): this;
  onRematchStart(callback): this;
  onError(callback): this;

  // Properties
  get roomState(): RoomState;
  get opponent(): OpponentState | null;
  get isConnected(): boolean;
  get publicKey(): string;
}
```

**Responsibilities:**

- Room creation and joining
- State synchronization with throttling
- Heartbeat sending (every 3s)
- Disconnect detection (10s threshold)
- localStorage persistence for reconnection
- Rematch coordination

### useBattleRoom (React Hook)

React wrapper for BattleRoom.

```typescript
function useBattleRoom<TGameState>(
  config: BattleRoomConfig,
  callbacks?: BattleRoomCallbacks<TGameState>
): UseBattleRoomReturn<TGameState>;
```

**Returns:**

- All BattleRoom functionality
- React state that updates on changes
- Memoized callbacks

## State Flow

```
┌─────────┐  create()   ┌─────────┐  opponent   ┌─────────┐
│  idle   │────────────▶│ waiting │────joins───▶│  ready  │
└─────────┘             └─────────┘             └────┬────┘
     ▲                                               │
     │                                          game starts
     │                                               │
     │                  ┌──────────┐             ┌───▼─────┐
     │◀────leave()──────│ finished │◀──gameover──│ playing │
     │                  └────┬─────┘             └─────────┘
     │                       │
     │                   rematch
     │                       │
     │                  ┌────▼────┐
     └──────────────────│  ready  │
                        └─────────┘
```

## Storage

### localStorage Keys

| Key             | Content                       | Expiry     |
| --------------- | ----------------------------- | ---------- |
| `{gameId}-key`  | Nostr secret key (JSON array) | Never      |
| `{gameId}-room` | Room data for reconnection    | 10 minutes |

### Stored Room Data

```typescript
interface StoredRoomData {
  roomId: string;
  isHost: boolean;
  seed: number;
  createdAt: number;
  opponentPubkey?: string;
}
```

## Timing

| Constant              | Default           | Description           |
| --------------------- | ----------------- | --------------------- |
| `roomExpiry`          | 600000ms (10 min) | Room expiration       |
| `heartbeatInterval`   | 3000ms            | Heartbeat sending     |
| `disconnectThreshold` | 10000ms           | Disconnect detection  |
| `stateThrottle`       | 100ms             | State update throttle |
| `joinTimeout`         | 30000ms           | Join timeout          |

## Error Handling

Errors are reported via `onError` callback:

```typescript
room.onError((error) => {
  console.error('Battle room error:', error.message);
});
```

Common errors:

- `"Room not found"` - Room doesn't exist or expired
- `"Room has expired"` - Room older than 10 minutes
- `"NostrClient not connected"` - Called method before connect()
