import type { Prediction } from '../types';
import { COUNTDOWN_TIME } from '../constants';
import { operatorToSymbol } from '../utils';

interface PredictionAreaProps {
  prediction: Prediction;
  countdown: number;
}

export function PredictionArea({ prediction, countdown }: PredictionAreaProps) {
  const countdownProgress = countdown / COUNTDOWN_TIME;

  return (
    <div className="prediction-area">
      <div className="prediction-clock">
        <svg viewBox="0 0 40 40" className="countdown-clock">
          <circle cx="20" cy="20" r="18" fill="none" stroke="#000" strokeWidth="2" />
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="#fff"
            strokeWidth="2"
            strokeDasharray={`${countdownProgress * 113} 113`}
            transform="rotate(-90 20 20)"
          />
        </svg>
      </div>
      <div className="prediction-operation">
        {operatorToSymbol(prediction.operator)}
        {prediction.operand}
      </div>
    </div>
  );
}
