/**
 * nostr-battle-room - NostrClient
 * Framework-agnostic Nostr connection management
 */

import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import type { Filter } from 'nostr-tools';
import type { NostrEvent, Unsubscribe } from '../types';
import { DEFAULT_CONFIG } from '../types';

// Re-export Filter type for convenience
export type { Filter as NostrFilter } from 'nostr-tools';

/**
 * Options for NostrClient
 */
export interface NostrClientOptions {
  /** Nostr relay URLs */
  relays?: string[];
  /** Storage key prefix for persisting keys */
  storageKeyPrefix?: string;
  /** Custom storage (defaults to localStorage) */
  storage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
}

/**
 * NostrClient - Manages Nostr connection, publishing, and subscriptions
 *
 * @example
 * ```typescript
 * const client = new NostrClient({ relays: ['wss://relay.damus.io'] });
 * await client.connect();
 *
 * // Publish an event
 * await client.publish({
 *   kind: 25000,
 *   tags: [['d', 'my-room']],
 *   content: JSON.stringify({ type: 'state', data: {} }),
 * });
 *
 * // Subscribe to events
 * const unsubscribe = client.subscribe(
 *   [{ kinds: [25000], '#d': ['my-room'] }],
 *   (event) => console.log('Received:', event)
 * );
 *
 * // Later: cleanup
 * unsubscribe();
 * client.disconnect();
 * ```
 */
export class NostrClient {
  private pool: SimplePool | null = null;
  private secretKey: Uint8Array | null = null;
  private _publicKey: string = '';
  private _isConnected: boolean = false;
  private relays: string[];
  private storageKeyPrefix: string;
  private storage: NonNullable<NostrClientOptions['storage']>;

  constructor(options: NostrClientOptions = {}) {
    this.relays = options.relays ?? DEFAULT_CONFIG.relays;
    this.storageKeyPrefix = options.storageKeyPrefix ?? 'nostr-battle';
    this.storage = options.storage ?? {
      getItem: (key) => localStorage.getItem(key),
      setItem: (key, value) => localStorage.setItem(key, value),
    };
  }

  /**
   * Whether the client is connected to relays
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * The public key of this client (Nostr identity)
   */
  get publicKey(): string {
    return this._publicKey;
  }

  /**
   * Connect to Nostr relays
   * Generates or retrieves a key pair from storage
   */
  connect(): void {
    if (this._isConnected) return;

    // Generate or retrieve key pair
    const storageKey = `${this.storageKeyPrefix}-key`;
    const storedKey = this.storage.getItem(storageKey);

    if (storedKey) {
      try {
        this.secretKey = new Uint8Array(JSON.parse(storedKey));
      } catch {
        // Invalid stored key, generate new one
        this.secretKey = generateSecretKey();
        this.storage.setItem(storageKey, JSON.stringify(Array.from(this.secretKey)));
      }
    } else {
      this.secretKey = generateSecretKey();
      this.storage.setItem(storageKey, JSON.stringify(Array.from(this.secretKey)));
    }

    this._publicKey = getPublicKey(this.secretKey);
    this.pool = new SimplePool();
    this._isConnected = true;
  }

  /**
   * Disconnect from all relays
   */
  disconnect(): void {
    if (this.pool) {
      this.pool.close(this.relays);
      this.pool = null;
    }
    this._isConnected = false;
  }

  /**
   * Publish an event to all relays
   */
  async publish(
    eventTemplate: Omit<NostrEvent, 'id' | 'pubkey' | 'created_at' | 'sig'>
  ): Promise<void> {
    if (!this.pool || !this.secretKey) {
      throw new Error('NostrClient not connected. Call connect() first.');
    }

    const event = finalizeEvent(
      {
        kind: eventTemplate.kind,
        tags: eventTemplate.tags,
        content: eventTemplate.content,
        created_at: Math.floor(Date.now() / 1000),
      },
      this.secretKey
    );

    await Promise.any(this.pool.publish(this.relays, event));
  }

  /**
   * Subscribe to events matching the given filters
   * @returns Unsubscribe function
   */
  subscribe(filters: Filter[], onEvent: (event: NostrEvent) => void): Unsubscribe {
    if (!this.pool) {
      console.warn('NostrClient not connected. Call connect() first.');
      return () => {};
    }

    // nostr-tools types show Filter (singular) but implementation accepts Filter[]
    const sub = this.pool.subscribeMany(this.relays, filters as unknown as Filter, {
      onevent(event) {
        onEvent(event as NostrEvent);
      },
    });

    return () => {
      sub.close();
    };
  }

  /**
   * Fetch events matching the given filter (one-time query)
   */
  async fetch(filter: Filter, timeoutMs: number = 5000): Promise<NostrEvent[]> {
    if (!this.pool) {
      throw new Error('NostrClient not connected. Call connect() first.');
    }

    return new Promise((resolve) => {
      const events: NostrEvent[] = [];
      const unsubscribe = this.subscribe([filter], (event) => {
        events.push(event);
      });

      setTimeout(() => {
        unsubscribe();
        resolve(events);
      }, timeoutMs);
    });
  }
}
