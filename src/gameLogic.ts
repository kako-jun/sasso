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
 * 配牌アルゴリズム: 次の予告を生成
 */
export function generatePrediction(elapsedTime: number): Prediction {
  // 経過時間に応じて確率を調整
  const timeFactor = Math.min(elapsedTime / 300000, 1); // 5分で最大

  // 基本確率: +40%, -30%, *15%, /15%
  // 時間経過で掛け算の確率が上がる
  const addProb = 0.40 - timeFactor * 0.15;
  const subProb = 0.30 - timeFactor * 0.05;
  const mulProb = 0.15 + timeFactor * 0.15;
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

  // 数字の範囲（演算子別）
  let maxOperand: number;
  switch (operator) {
    case '+':
      maxOperand = 50 + Math.floor(timeFactor * 50); // 50-100
      break;
    case '-':
      maxOperand = 30 + Math.floor(timeFactor * 30); // 30-60
      break;
    case '*':
      maxOperand = 5 + Math.floor(timeFactor * 4); // 5-9
      break;
    case '/':
      maxOperand = 3 + Math.floor(timeFactor * 4); // 3-7
      break;
  }

  const operand = Math.floor(Math.random() * maxOperand) + 1;

  return { operator, operand };
}

/**
 * 攻撃発動条件の判定
 * - 3つ以上同時消し
 * - 2連鎖以上
 */
export function shouldTriggerAttack(eliminationResult: EliminationResult): boolean {
  return eliminationResult.eliminated >= 3 || eliminationResult.chains >= 2;
}
