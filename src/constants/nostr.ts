// Nostr Relay URLs
export const NOSTR_RELAYS = [
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
] as const;

// Nostr Event Kinds
export const NOSTR_EVENT_KINDS = {
  ROOM: 30078, // Replaceable event (for room state)
  EPHEMERAL: 25000, // Ephemeral (not stored by relays)
} as const;

// Timing Constants
export const NOSTR_TIMEOUTS = {
  ROOM_EXPIRY: 600000, // 10 minutes
  JOIN_TIMEOUT: 30000, // 30 seconds
  DISCONNECT_THRESHOLD: 10000, // 10 seconds without heartbeat
  HEARTBEAT_INTERVAL: 3000, // 3 seconds
  STATE_THROTTLE: 100, // Max 10 updates per second
} as const;

// Room ID prefix for Nostr tags
export const SASSO_TAG_PREFIX = 'sasso-room-' as const;

// Battle-specific prediction interval (same as single player)
export const BATTLE_PREDICTION_INTERVAL = 10000; // 10 seconds
