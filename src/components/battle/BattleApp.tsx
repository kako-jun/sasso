import { useState, useEffect } from 'react';
import { useBattleMode, useKeyboard, useIsDesktop } from '../../hooks';
import {
  MenuBar,
  Window,
  Display,
  Keypad,
  ScoreArea,
  PredictionArea,
  CalculationHistory,
  MultiplicationHelper,
} from '../';
import { BattleLayout } from './BattleLayout';
import { BattleOverlay } from './BattleOverlay';
import { RoomCreation } from './RoomCreation';
import { AttackIndicator } from './AttackIndicator';
import type { GameMode } from '../../types';

interface BattleAppProps {
  initialRoomId?: string;
  onChangeMode: (mode: GameMode) => void;
}

/**
 * Battle mode application component.
 * Handles the complete battle flow: room creation, gameplay, and results.
 */
export function BattleApp({ initialRoomId, onChangeMode }: BattleAppProps) {
  const battle = useBattleMode();
  const [showRoomCreation, setShowRoomCreation] = useState(!initialRoomId);
  const [roomUrl, setRoomUrl] = useState('');
  const isDesktop = useIsDesktop();

  // Handle keyboard input
  useKeyboard(battle.handleKey);

  // Auto-join room if roomId provided (only once on mount)
  useEffect(() => {
    if (initialRoomId && battle.roomState.status === 'idle') {
      battle.joinRoom(initialRoomId).catch(() => {
        setShowRoomCreation(true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomId]);

  // Handle room creation
  const handleCreateRoom = async () => {
    const url = await battle.createRoom();
    setRoomUrl(url);
    setShowRoomCreation(false);
    // Update browser URL so users can copy it from address bar
    const roomId = url.split('/battle/')[1];
    window.history.pushState(null, '', `/battle/${roomId}`);
    return url;
  };

  // Handle room join
  const handleJoinRoom = async (roomId: string) => {
    await battle.joinRoom(roomId);
    setShowRoomCreation(false);
    // Update browser URL
    window.history.pushState(null, '', `/battle/${roomId}`);
  };

  // Handle leaving battle mode
  const handleLeave = () => {
    battle.leaveRoom();
    onChangeMode('calculator');
  };

  // Show room creation UI
  if (showRoomCreation && battle.roomState.status === 'idle') {
    return (
      <div className="desktop">
        <MenuBar gameMode="battle" onChangeMode={onChangeMode} score={0} />
        <RoomCreation
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onCancel={() => onChangeMode('calculator')}
        />
      </div>
    );
  }

  const isPredictionMode = battle.gameStarted && !battle.isGameOver;

  return (
    <div className="desktop">
      <MenuBar gameMode="battle" onChangeMode={onChangeMode} score={battle.score} />

      <BattleLayout opponent={battle.opponent} isDesktop={isDesktop}>
        {/* Prediction Area with Attack Indicator */}
        {isPredictionMode && battle.prediction && (
          <div className="prediction-wrapper">
            <PredictionArea prediction={battle.prediction} countdown={battle.countdown} />
            {battle.isUnderAttack && <AttackIndicator isUnderAttack={true} />}
          </div>
        )}

        {/* Score Area */}
        <ScoreArea lastScoreBreakdown={battle.lastScoreBreakdown} />

        {/* Calculator Window */}
        <Window title="Sasso" onClose={handleLeave}>
          <Display value={battle.display} eliminatingIndices={battle.eliminatingIndices} />
          <Keypad onKey={battle.handleKey} />
        </Window>

        {/* Calculation History */}
        <CalculationHistory text={battle.calculationHistory} />

        {/* Multiplication Helper */}
        {isPredictionMode && battle.prediction?.operator === '*' && (
          <MultiplicationHelper
            displayValue={battle.display}
            multiplier={battle.prediction.operand}
          />
        )}
      </BattleLayout>

      {/* Battle Overlays */}
      <BattleOverlay
        status={battle.roomState.status}
        roomUrl={roomUrl}
        isWinner={battle.isWinner}
        isSurrender={battle.isSurrender}
        isGameStarted={battle.gameStarted}
        playerScore={battle.score}
        opponentScore={battle.opponent?.score}
        rematchRequested={battle.rematchRequested}
        opponentRematchRequested={battle.opponentRematchRequested}
        onRetry={battle.requestRematch}
        onLeave={handleLeave}
      />
    </div>
  );
}
