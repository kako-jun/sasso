import { useState, useRef, useEffect } from 'react';
import QrScanner from 'qr-scanner';
import styles from './RoomCreation.module.css';

interface RoomCreationProps {
  onCreateRoom: () => Promise<string>;
  onJoinRoom: (roomId: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Room creation/joining UI.
 * Allows creating a new room or joining an existing one.
 */
export function RoomCreation({ onCreateRoom, onJoinRoom, onCancel }: RoomCreationProps) {
  const [mode, setMode] = useState<'select' | 'create' | 'join'>('select');
  const [roomUrl, setRoomUrl] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannerError, setScannerError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  // Start QR scanner when entering join mode
  useEffect(() => {
    if (mode !== 'join' || !videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      (result) => {
        // Extract room ID from scanned URL
        let roomId = result.data.trim();
        if (roomId.includes('/battle/')) {
          roomId = roomId.split('/battle/')[1];
        } else if (roomId.startsWith('battle/')) {
          roomId = roomId.slice(7);
        }
        roomId = roomId.split(/[?#/]/)[0];

        // Stop scanner and trigger join
        scanner.stop();
        setJoinInput(roomId);
        handleJoinWithId(roomId);
      },
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    scannerRef.current = scanner;
    scanner.start().catch((err) => {
      console.warn('QR Scanner failed to start:', err);
      setScannerError('カメラを起動できません');
    });

    return () => {
      scanner.stop();
      scannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleJoinWithId = async (roomId: string) => {
    if (!roomId.trim()) {
      setError('Please enter a room URL or ID');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await onJoinRoom(roomId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to join room';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setError('');
    try {
      const url = await onCreateRoom();
      setRoomUrl(url);
      setMode('create');
    } catch {
      setError('Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    // Extract room ID from various formats
    let roomId = joinInput.trim();
    if (roomId.includes('/battle/')) {
      roomId = roomId.split('/battle/')[1];
    } else if (roomId.startsWith('battle/')) {
      roomId = roomId.slice(7);
    }
    roomId = roomId.split(/[?#/]/)[0];
    await handleJoinWithId(roomId);
  };

  if (mode === 'select') {
    return (
      <div className={styles.roomCreation}>
        <div className={styles.roomCreationTitle}>Battle Mode</div>
        <div className={styles.roomCreationButtons}>
          <button className={styles.roomButton} onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Room'}
          </button>
          <button
            className={styles.roomButton}
            onClick={() => setMode('join')}
            disabled={isLoading}
          >
            Join Room
          </button>
          <button className={styles.cancelButton} onClick={onCancel}>
            Cancel
          </button>
        </div>
        {error && <div className={styles.roomError}>{error}</div>}
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className={styles.roomCreation}>
        <div className={styles.roomCreationTitle}>Join Room</div>
        <div className={styles.scannerContainer}>
          <video ref={videoRef} className={styles.scannerVideo} />
          {scannerError && <div className={styles.scannerError}>{scannerError}</div>}
        </div>
        <input
          type="text"
          className={styles.roomInput}
          placeholder="Room ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <div className={styles.roomCreationButtons}>
          <button className={styles.roomButton} onClick={handleJoin} disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join'}
          </button>
          <button
            className={styles.cancelButton}
            onClick={() => setMode('select')}
            disabled={isLoading}
          >
            Cancel
          </button>
        </div>
        {error && <div className={styles.roomError}>{error}</div>}
      </div>
    );
  }

  // Create mode - show URL to share
  return (
    <div className={styles.roomCreation}>
      <div className={styles.roomCreationTitle}>Room Created</div>
      <div className={styles.roomUrlContainer}>
        <input
          type="text"
          className={styles.roomUrlInput}
          value={roomUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button
          className={styles.copyButton}
          onClick={() => navigator.clipboard.writeText(roomUrl)}
        >
          Copy
        </button>
      </div>
      <div className={styles.roomHint}>Share this URL with your opponent</div>
      <button className={styles.cancelButton} onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
