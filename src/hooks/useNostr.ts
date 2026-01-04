import { useCallback, useEffect, useRef, useState } from 'react';
import { SimplePool, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import type { NostrEvent, NostrFilter } from '../types/battle';
import { NOSTR_RELAYS } from '../constants/nostr';

export interface UseNostrReturn {
  isConnected: boolean;
  publicKey: string;
  publish: (event: Omit<NostrEvent, 'id' | 'pubkey' | 'created_at' | 'sig'>) => Promise<void>;
  subscribe: (filters: NostrFilter[], onEvent: (event: NostrEvent) => void) => () => void;
}

export function useNostr(relays: readonly string[] = NOSTR_RELAYS): UseNostrReturn {
  const [isConnected, setIsConnected] = useState(false);
  const poolRef = useRef<SimplePool | null>(null);
  const secretKeyRef = useRef<Uint8Array | null>(null);
  const publicKeyRef = useRef<string>('');

  // Initialize pool and keys
  useEffect(() => {
    // Generate or retrieve key pair
    const storedKey = localStorage.getItem('sasso-nostr-key');
    if (storedKey) {
      secretKeyRef.current = new Uint8Array(JSON.parse(storedKey));
    } else {
      secretKeyRef.current = generateSecretKey();
      localStorage.setItem('sasso-nostr-key', JSON.stringify(Array.from(secretKeyRef.current)));
    }
    publicKeyRef.current = getPublicKey(secretKeyRef.current);

    // Create pool
    poolRef.current = new SimplePool();
    setIsConnected(true);

    return () => {
      if (poolRef.current) {
        poolRef.current.close(relays as string[]);
      }
    };
  }, [relays]);

  // Publish event to relays
  const publish = useCallback(
    async (eventTemplate: Omit<NostrEvent, 'id' | 'pubkey' | 'created_at' | 'sig'>) => {
      if (!poolRef.current || !secretKeyRef.current) {
        throw new Error('Nostr not initialized');
      }

      const event = finalizeEvent(
        {
          kind: eventTemplate.kind,
          tags: eventTemplate.tags,
          content: eventTemplate.content,
          created_at: Math.floor(Date.now() / 1000),
        },
        secretKeyRef.current
      );

      await Promise.any(poolRef.current.publish(relays as string[], event));
    },
    [relays]
  );

  // Subscribe to events
  const subscribe = useCallback(
    (filters: NostrFilter[], onEvent: (event: NostrEvent) => void) => {
      if (!poolRef.current) {
        return () => {};
      }

      const sub = poolRef.current.subscribeMany(relays as string[], filters, {
        onevent(event) {
          onEvent(event as NostrEvent);
        },
      });

      return () => {
        sub.close();
      };
    },
    [relays]
  );

  return {
    isConnected,
    publicKey: publicKeyRef.current,
    publish,
    subscribe,
  };
}
