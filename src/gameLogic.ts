// Sasso Game Logic

export type GameMode = 'calculator' | 'practice' | 'endless';
export type Operator = '+' | '-' | '*' | '/';

export interface Prediction {
  operator: Operator;
  operand: number;
}

export interface EliminationResult {
  result: string;
  eliminated: number;
  chains: number;
}

/**
 * 消去される位置を特定する（アニメーション用）
 * 小数点は壁として機能し、消去対象にならない
 */
export function findEliminationIndices(displayStr: string): number[] {
  const isNegative = displayStr.startsWith('-');
  const workStr = isNegative ? displayStr.slice(1) : displayStr;
  const offset = isNegative ? 1 : 0;

  const indices: number[] = [];
  const parts = workStr.split('.');
  let currentIndex = 0;

  for (let partIdx = 0; partIdx < parts.length; partIdx++) {
    const part = parts[partIdx];
    let i = 0;

    while (i < part.length) {
      const char = part[i];
      let count = 1;

      while (i + count < part.length && part[i + count] === char) {
        count++;
      }

      if (count >= 2) {
        for (let j = 0; j < count; j++) {
          indices.push(currentIndex + i + j + offset);
        }
      }
      i += count;
    }

    currentIndex += part.length + 1; // +1 for the dot
  }

  return indices;
}

/**
 * 隣り合う同じ数字を消去する
 * 小数点は壁として機能し、消去対象にならない
 */
export function eliminateMatches(displayStr: string): { result: string; eliminated: number } {
  // マイナス記号を保持
  const isNegative = displayStr.startsWith('-');
  const workStr = isNegative ? displayStr.slice(1) : displayStr;

  // 小数点で分割して各部分を処理
  const parts = workStr.split('.');
  let totalEliminated = 0;

  const processedParts = parts.map(part => {
    if (part.length === 0) return part;

    let result = '';
    let i = 0;

    while (i < part.length) {
      const char = part[i];
      let count = 1;

      // 同じ文字が続く数をカウント
      while (i + count < part.length && part[i + count] === char) {
        count++;
      }

      if (count >= 2) {
        // 2つ以上連続していたら消去
        totalEliminated += count;
        i += count;
      } else {
        // 1つだけなら残す
        result += char;
        i++;
      }
    }

    return result;
  });

  let resultStr = processedParts.join('.');

  // 空になった場合は0にする
  if (resultStr === '' || resultStr === '.') {
    resultStr = '0';
  }

  // 先頭の不要な0を削除（小数点がある場合は保持）
  if (resultStr.includes('.')) {
    // 小数の場合: 整数部分の先頭0を削除
    const [intPart, decPart] = resultStr.split('.');
    const cleanInt = intPart.replace(/^0+/, '') || '0';
    resultStr = cleanInt + '.' + decPart;
  } else {
    // 整数の場合: 先頭0を削除
    resultStr = resultStr.replace(/^0+/, '') || '0';
  }

  // マイナス記号を戻す
  if (isNegative && resultStr !== '0') {
    resultStr = '-' + resultStr;
  }

  return { result: resultStr, eliminated: totalEliminated };
}

/**
 * 消去処理を連鎖が止まるまで繰り返す
 */
export function processElimination(displayStr: string): EliminationResult {
  let current = displayStr;
  let totalEliminated = 0;
  let chains = 0;

  while (true) {
    const { result, eliminated } = eliminateMatches(current);

    if (eliminated === 0) {
      break;
    }

    totalEliminated += eliminated;
    chains++;
    current = result;
  }

  return {
    result: current,
    eliminated: totalEliminated,
    chains
  };
}

/**
 * 桁溢れ（ゲームオーバー）判定
 * 10桁を超えたらゲームオーバー
 */
export function checkOverflow(displayStr: string): boolean {
  // マイナス記号と小数点を除いた桁数（数字のみをカウント）
  const digits = displayStr.replace(/[^0-9]/g, '').length;
  return digits > 10;
}

/**
 * 初期状態を時刻から生成
 */
export function generateInitialState(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const second = now.getSeconds();

  // YYYYMMDDHHmmss形式だと14桁で長すぎるので、加工する
  // 例: 各要素を足し合わせたり、一部だけ使ったり
  // ここでは HHmmss (6桁) を使用
  const timeStr = `${hour}${minute}${second}`;
  return timeStr.replace(/^0+/, '') || '0';
}

/**
 * 攻撃効果の計算結果
 */
export interface AttackEffect {
  predictions: Prediction[];      // 生成された予告（複数の場合あり）
  difficultyLevel: string;        // 難易度レベル名
  operatorBias: number;           // 掛け算確率の上昇量
  operandMultiplier: number;      // 数字の大きさ倍率
}

/**
 * 攻撃力から難易度パラメータを計算
 *
 * 攻撃力の範囲と効果:
 * - 0-50:    通常 (効果なし)
 * - 51-150:  軽微 (掛け算+10%, 数字1.2倍)
 * - 151-300: 中程度 (掛け算+20%, 数字1.5倍)
 * - 301-500: 強力 (掛け算+30%, 数字1.8倍, 予告2つ)
 * - 501+:    壊滅的 (掛け算+40%, 数字2.0倍, 予告3つ)
 */
export function calculateAttackEffect(attackPower: number): {
  difficultyLevel: string;
  operatorBias: number;      // 掛け算確率の追加 (0-0.4)
  operandMultiplier: number; // 数字の倍率 (1.0-2.0)
  stackCount: number;        // 予告の数 (1-3)
} {
  if (attackPower <= 50) {
    return {
      difficultyLevel: '通常',
      operatorBias: 0,
      operandMultiplier: 1.0,
      stackCount: 1
    };
  } else if (attackPower <= 150) {
    return {
      difficultyLevel: '軽微',
      operatorBias: 0.10,
      operandMultiplier: 1.2,
      stackCount: 1
    };
  } else if (attackPower <= 300) {
    return {
      difficultyLevel: '中程度',
      operatorBias: 0.20,
      operandMultiplier: 1.5,
      stackCount: 1
    };
  } else if (attackPower <= 500) {
    return {
      difficultyLevel: '強力',
      operatorBias: 0.30,
      operandMultiplier: 1.8,
      stackCount: 2
    };
  } else {
    return {
      difficultyLevel: '壊滅的',
      operatorBias: 0.40,
      operandMultiplier: 2.0,
      stackCount: 3
    };
  }
}

/**
 * 配牌アルゴリズム: 次の予告を生成
 *
 * @param elapsedTime - ゲーム開始からの経過時間 (ms)
 * @param attackPower - 相手からの攻撃力 (0 = 攻撃なし)
 */
export function generatePrediction(elapsedTime: number, attackPower = 0): Prediction {
  // 経過時間に応じて確率を調整
  const timeFactor = Math.min(elapsedTime / 300000, 1); // 5分で最大

  // 攻撃効果を計算
  const attackEffect = calculateAttackEffect(attackPower);

  // 基本確率: +40%, -30%, *15%, /15%
  // 時間経過と攻撃で掛け算の確率が上がる
  const mulBoost = timeFactor * 0.15 + attackEffect.operatorBias;
  const addProb = Math.max(0.40 - timeFactor * 0.15 - attackEffect.operatorBias * 0.5, 0.10);
  const subProb = Math.max(0.30 - timeFactor * 0.05 - attackEffect.operatorBias * 0.3, 0.10);
  const mulProb = Math.min(0.15 + mulBoost, 0.60);
  // divProb = 残り

  const rand = Math.random();
  let operator: Operator;

  if (rand < addProb) {
    operator = '+';
  } else if (rand < addProb + subProb) {
    operator = '-';
  } else if (rand < addProb + subProb + mulProb) {
    operator = '*';
  } else {
    operator = '/';
  }

  // 数字の範囲（演算子別）× 攻撃による倍率
  let maxOperand: number;
  switch (operator) {
    case '+':
      maxOperand = Math.floor((50 + timeFactor * 50) * attackEffect.operandMultiplier); // 50-200
      break;
    case '-':
      maxOperand = Math.floor((30 + timeFactor * 30) * attackEffect.operandMultiplier); // 30-120
      break;
    case '*':
      maxOperand = Math.floor((5 + timeFactor * 4) * attackEffect.operandMultiplier); // 5-18
      break;
    case '/':
      maxOperand = Math.floor((3 + timeFactor * 4) * attackEffect.operandMultiplier); // 3-14
      break;
  }

  const operand = Math.floor(Math.random() * maxOperand) + 1;

  return { operator, operand };
}

/**
 * 攻撃を受けた際の予告を生成（複数予告対応）
 *
 * @param elapsedTime - ゲーム開始からの経過時間 (ms)
 * @param attackPower - 相手からの攻撃力
 * @returns 生成された予告の配列と効果情報
 */
export function generateAttackPredictions(elapsedTime: number, attackPower: number): AttackEffect {
  const effect = calculateAttackEffect(attackPower);

  const predictions: Prediction[] = [];
  for (let i = 0; i < effect.stackCount; i++) {
    predictions.push(generatePrediction(elapsedTime, attackPower));
  }

  return {
    predictions,
    difficultyLevel: effect.difficultyLevel,
    operatorBias: effect.operatorBias,
    operandMultiplier: effect.operandMultiplier
  };
}

/**
 * 攻撃発動条件の判定
 * - 3つ以上同時消し
 * - 2連鎖以上
 */
export function shouldTriggerAttack(eliminationResult: EliminationResult): boolean {
  return eliminationResult.eliminated >= 3 || eliminationResult.chains >= 2;
}

/**
 * スコア計算パラメータ
 */
export interface ScoreParams {
  eliminated: number;      // 消去された桁数
  chains: number;          // 連鎖数
  calculationsSinceLastElimination: number;  // 前回消去からの計算回数（準備ボーナス）
  digitCountBeforeElimination: number;       // 消去前の桁数（リスクボーナス）
}

/**
 * スコア計算結果
 */
export interface ScoreResult {
  totalScore: number;      // 合計スコア
  baseScore: number;       // 基礎スコア
  chainMultiplier: number; // 連鎖倍率
  prepBonus: number;       // 準備ボーナス倍率
  riskBonus: number;       // リスクボーナス倍率
  attackPower: number;     // 攻撃力（= totalScore）
}

/**
 * スコアと攻撃力を計算
 *
 * スコア = 消去数 × 10 × 連鎖倍率 × 準備ボーナス × リスクボーナス
 *
 * - 連鎖倍率: 連鎖数 (1連鎖=1.0, 2連鎖=2.0, ...)
 * - 準備ボーナス: 1 + (前回消去からの計算回数 × 0.2), 最大3.0
 * - リスクボーナス: 1 + (現在の桁数 ÷ 10), 最大2.0
 */
export function calculateScore(params: ScoreParams): ScoreResult {
  const { eliminated, chains, calculationsSinceLastElimination, digitCountBeforeElimination } = params;

  // 基礎スコア: 消去数 × 10
  const baseScore = eliminated * 10;

  // 連鎖倍率: 連鎖数そのもの（最低1）
  const chainMultiplier = Math.max(chains, 1);

  // 準備ボーナス: 計算回数に応じて増加（最大3.0倍）
  const prepBonus = Math.min(1 + calculationsSinceLastElimination * 0.2, 3.0);

  // リスクボーナス: 桁数が多いほど高い（最大2.0倍）
  // 数字のみの桁数を使用（マイナス記号や小数点は除く）
  const riskBonus = Math.min(1 + digitCountBeforeElimination / 10, 2.0);

  // 合計スコア（小数点以下切り捨て）
  const totalScore = Math.floor(baseScore * chainMultiplier * prepBonus * riskBonus);

  // 攻撃力 = スコアと同じ
  const attackPower = totalScore;

  return {
    totalScore,
    baseScore,
    chainMultiplier,
    prepBonus,
    riskBonus,
    attackPower
  };
}

/**
 * 数字のみの桁数を取得（マイナス記号と小数点は除く）
 */
export function getDigitCount(displayStr: string): number {
  return displayStr.replace(/[^0-9]/g, '').length;
}
