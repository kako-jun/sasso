import { useCallback, useEffect } from 'react';
import './App.css';
import { useCalculator, useGame, useKeyboard } from './hooks';
import {
  MenuBar,
  Display,
  Keypad,
  ScoreArea,
  PredictionArea,
  CalculationHistory,
  GameOverOverlay,
  StartPrompt,
} from './components';

function App() {
  const calculator = useCalculator();
  const game = useGame();

  // Sync display with game for endless mode predictions
  useEffect(() => {
    game.syncDisplay(calculator.display);
  }, [calculator.display, game]);

  const resetAll = useCallback(() => {
    calculator.resetCalculator();
    game.resetGame();
  }, [calculator, game]);

  const handleModeChange = useCallback(
    (mode: Parameters<typeof game.changeGameMode>[0]) => {
      calculator.resetCalculator();
      game.changeGameMode(mode);
    },
    [calculator, game]
  );

  const handleKey = useCallback(
    (key: string) => {
      if (game.isGameOver) return;

      // Start game on first key press in game modes
      if (game.gameMode !== 'calculator' && !game.gameStarted) {
        const initialState = game.startGame();
        calculator.setDisplay(initialState);
      }

      // Surrender on digit after =
      if (game.gameMode !== 'calculator' && game.gameStarted && game.justPressedEqual) {
        if (/^\d$/.test(key)) {
          game.surrender();
          return;
        }
      }

      game.setJustPressedEqual(false);

      if (/^\d$/.test(key)) {
        calculator.inputDigit(key);
        return;
      }

      switch (key) {
        case 'C':
          if (game.gameMode !== 'calculator' && game.gameStarted) {
            game.surrender();
          } else {
            calculator.clearAll();
          }
          break;
        case 'E':
          if (game.gameMode !== 'calculator' && game.gameStarted) {
            game.surrender();
          } else {
            calculator.clearEntry();
          }
          break;
        case '.':
          calculator.inputDecimal();
          break;
        case '=': {
          const result = calculator.handleEqual();
          if (result) {
            game.incrementCalculationCount();
            game.setCalculationHistory(
              `${result.left} ${result.op} ${result.right} = ${result.newDisplay}`
            );
            game.setJustPressedEqual(true);

            if (game.gameMode === 'practice' && game.gameStarted) {
              const afterElimination = game.applyElimination(result.newDisplay, (newDisplay) => {
                calculator.setDisplay(newDisplay);
              });
              game.checkGameOverState(afterElimination);
            }
          }
          break;
        }
        case '+':
        case '-':
        case '*':
        case '/': {
          const result = calculator.performOperation(key);
          if (result) {
            game.incrementCalculationCount();

            if (game.gameMode === 'practice' && game.gameStarted) {
              const afterElimination = game.applyElimination(result.newDisplay, (newDisplay) => {
                calculator.setDisplay(newDisplay);
              });
              game.checkGameOverState(afterElimination);
            }
          }
          break;
        }
      }
    },
    [calculator, game]
  );

  useKeyboard(handleKey);

  return (
    <div className="desktop">
      <MenuBar gameMode={game.gameMode} onChangeMode={handleModeChange} />

      {game.gameMode === 'endless' && game.gameStarted && !game.isGameOver && game.prediction && (
        <PredictionArea prediction={game.prediction} countdown={game.countdown} />
      )}

      {game.gameMode !== 'calculator' && (
        <ScoreArea
          score={game.score}
          chains={game.chains}
          lastScoreBreakdown={game.lastScoreBreakdown}
        />
      )}

      <main className="window">
        <div className="title-bar">
          <div className="close-box" onClick={() => handleModeChange('calculator')} />
          <span className="title">Sasso</span>
        </div>

        <div className="window-content">
          {game.isGameOver && <GameOverOverlay isSurrender={game.isSurrender} onRetry={resetAll} />}

          <Display value={calculator.display} eliminatingIndices={game.eliminatingIndices} />
          <Keypad onKey={handleKey} />
        </div>
      </main>

      {game.gameMode !== 'calculator' && <CalculationHistory text={game.calculationHistory} />}

      {game.gameMode !== 'calculator' && !game.gameStarted && <StartPrompt />}
    </div>
  );
}

export default App;
