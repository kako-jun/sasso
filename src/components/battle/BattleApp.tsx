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
import { BattleOverlay, BattleFinishedOverlay } from './BattleOverlay';
import { RoomCreation } from './RoomCreation';
import { AttackIndicator } from './AttackIndicator';
import { MobileOpponentScore } from './MobileOpponentScore';
import { OpponentHeader } from './OpponentHeader';
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

  // Auto-join room if roomId provided
  useEffect(() => {
    if (!initialRoomId) return;
    if (battle.roomState.status !== 'idle') return;

    // Hide room creation UI and attempt to join
    setShowRoomCreation(false);
    battle.joinRoom(initialRoomId).catch(() => {
      setShowRoomCreation(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomId, battle.roomState.status]);

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

  // Get opponent state for display
  const opponentState = battle.opponent?.gameState;
  const opponentScore = opponentState?.score ?? 0;
  const opponentDisplay = opponentState?.display ?? '0';
  const opponentHistory = opponentState?.calculationHistory ?? '';
  const opponentConnected = battle.opponent?.isConnected ?? true;

  // Build headers and content for desktop layout
  const playerHeader = isDesktop ? (
    <MenuBar gameMode="battle" onChangeMode={onChangeMode} score={battle.score} />
  ) : undefined;

  const opponentHeader =
    battle.opponent && isDesktop ? (
      <OpponentHeader score={opponentScore} isConnected={opponentConnected} />
    ) : undefined;

  const opponentContent =
    battle.opponent && isDesktop ? (
      <>
        {/* Opponent Score Area */}
        <ScoreArea lastScoreBreakdown={null} />

        {/* Opponent Calculator Window */}
        <Window title="Opponent">
          <Display value={opponentDisplay} eliminatingIndices={[]} />
        </Window>

        {/* Opponent Calculation History */}
        <CalculationHistory text={opponentHistory} />
      </>
    ) : undefined;

  return (
    <div className="desktop">
      {/* Mobile: MenuBar at top */}
      {!isDesktop && <MenuBar gameMode="battle" onChangeMode={onChangeMode} score={battle.score} />}
      {!isDesktop && battle.opponent && (
        <MobileOpponentScore score={opponentScore} isConnected={opponentConnected} />
      )}

      <BattleLayout
        playerHeader={playerHeader}
        opponentHeader={opponentHeader}
        opponentContent={opponentContent}
        isDesktop={isDesktop}
      >
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
          {battle.roomState.status === 'finished' && (
            <BattleFinishedOverlay
              isWinner={battle.isWinner}
              isSurrender={battle.isSurrender}
              rematchRequested={battle.rematchRequested}
              opponentRematchRequested={battle.opponentRematchRequested}
              onRetry={battle.requestRematch}
              onLeave={handleLeave}
            />
          )}
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

      {/* Battle Overlays (waiting, ready, joining) */}
      <BattleOverlay
        status={battle.roomState.status}
        roomUrl={roomUrl}
        isGameStarted={battle.gameStarted}
        onStart={() => battle.handleKey('1')}
        onLeave={handleLeave}
      />
    </div>
  );
}
