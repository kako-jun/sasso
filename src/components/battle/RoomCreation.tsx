import { useState } from 'react';

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
    if (!joinInput.trim()) {
      setError('Please enter a room URL or ID');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      // Extract room ID from URL or use as-is
      const roomId = joinInput.includes('/battle/') ? joinInput.split('/battle/')[1] : joinInput;
      await onJoinRoom(roomId);
    } catch {
      setError('Room not found');
      setIsLoading(false);
    }
  };

  if (mode === 'select') {
    return (
      <div className="room-creation">
        <div className="room-creation-title">Battle Mode</div>
        <div className="room-creation-buttons">
          <button className="room-button" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Room'}
          </button>
          <button className="room-button" onClick={() => setMode('join')} disabled={isLoading}>
            Join Room
          </button>
        </div>
        <button className="cancel-button" onClick={onCancel}>
          Back
        </button>
        {error && <div className="room-error">{error}</div>}
      </div>
    );
  }

  if (mode === 'join') {
    return (
      <div className="room-creation">
        <div className="room-creation-title">Join Room</div>
        <input
          type="text"
          className="room-input"
          placeholder="Enter room URL or ID"
          value={joinInput}
          onChange={(e) => setJoinInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
        />
        <div className="room-creation-buttons">
          <button className="room-button" onClick={handleJoin} disabled={isLoading}>
            {isLoading ? 'Joining...' : 'Join'}
          </button>
          <button className="cancel-button" onClick={() => setMode('select')} disabled={isLoading}>
            Back
          </button>
        </div>
        {error && <div className="room-error">{error}</div>}
      </div>
    );
  }

  // Create mode - show URL to share
  return (
    <div className="room-creation">
      <div className="room-creation-title">Room Created</div>
      <div className="room-url-container">
        <input
          type="text"
          className="room-url-input"
          value={roomUrl}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <button className="copy-button" onClick={() => navigator.clipboard.writeText(roomUrl)}>
          Copy
        </button>
      </div>
      <div className="room-hint">Share this URL with your opponent</div>
      <button className="cancel-button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
