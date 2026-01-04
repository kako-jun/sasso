import './App.css';
import { useGameController, useKeyboard } from './hooks';
import {
  MenuBar,
  Window,
  Display,
  Keypad,
  ScoreArea,
  PredictionArea,
  CalculationHistory,
  GameOverOverlay,
  StartPrompt,
  MultiplicationHelper,
} from './components';

function App() {
  const controller = useGameController();

  useKeyboard(controller.handleKey);

  const isPlaying = controller.gameMode !== 'calculator';
  const isEndlessActive =
    controller.gameMode === 'endless' && controller.gameStarted && !controller.isGameOver;

  return (
    <div className="desktop">
      <MenuBar gameMode={controller.gameMode} onChangeMode={controller.handleModeChange} />

      {isEndlessActive && controller.prediction && (
        <PredictionArea prediction={controller.prediction} countdown={controller.countdown} />
      )}

      {isPlaying && (
        <ScoreArea
          score={controller.score}
          chains={controller.chains}
          lastScoreBreakdown={controller.lastScoreBreakdown}
        />
      )}

      <Window title="Sasso" onClose={() => controller.handleModeChange('calculator')}>
        {controller.isGameOver && (
          <GameOverOverlay isSurrender={controller.isSurrender} onRetry={controller.resetAll} />
        )}
        <Display value={controller.display} eliminatingIndices={controller.eliminatingIndices} />
        <Keypad onKey={controller.handleKey} />
      </Window>

      {isPlaying && <CalculationHistory text={controller.calculationHistory} />}

      {isEndlessActive && controller.prediction?.operator === '*' && (
        <MultiplicationHelper
          displayValue={controller.display}
          multiplier={controller.prediction.operand}
        />
      )}

      {isPlaying && !controller.gameStarted && <StartPrompt />}
    </div>
  );
}

export default App;
