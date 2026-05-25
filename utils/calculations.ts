
import { LocomoDegree, StandUpTest, TwoStepTest, Locomo25Answers, CalculationResult } from '../types';

/**
 * 立ち上がりテストのロコモ度判定
 *
 * 前提A: 「Min」は「成功した中で最も低い台」を指す。
 * 例: bothMin = '30cm' は「30cmは成功したが、20cmは失敗した（または未実施）」を意味する。
 *
 * 判定フロー:
 * Step 0: 左右とも片脚で40cmが可能（またはそれより低い台が可能）なら、ロコモ度0。
 * Step 1: 片脚が左右どちらか一方でも「不可(impossible)」または「未実施(untested)」の場合、両脚テストで判定。
 *   - 両脚10cm or 20cm 可能 -> ロコモ度1
 *   - 両脚30cm 可能 (20cm不可) -> ロコモ度2
 *   - 両脚40cm 可能 (30cm不可) -> ロコモ度3
 *   - 両脚40cm 不可 -> ロコモ度3
 */
export const calculateStandUpDegree = (test: StandUpTest): { degree: LocomoDegree; reason: string } => {
    const { bothMin, singleRightMin, singleLeftMin } = test;

    const formatInputValue = (val: string): string => {
        if (val === 'impossible') return '不可';
        if (val === 'untested') return '未実施';
        return `${val}起立可能`;
    };

    const formatInputDetail = (): string => {
        return [
            `両脚:${formatInputValue(bothMin)}`,
            `右:${formatInputValue(singleRightMin)}`,
            `左:${formatInputValue(singleLeftMin)}`,
        ].join(' / ');
    };

    const inputDetail = formatInputDetail();

    // 片脚テストの成功判定
    // '10cm'～'40cm' のいずれかが入っていれば「少なくとも40cmからは立てる」とみなして成功とする
    const isSingleSuccess = (val: string) => ['10cm', '20cm', '30cm', '40cm'].includes(val);

    const rightOk = isSingleSuccess(singleRightMin);
    const leftOk = isSingleSuccess(singleLeftMin);

    // --- Step 0: ロコモ度 0 の判定 ---
    // 左右とも片脚で成功している場合
    if (rightOk && leftOk) {
        return {
            degree: 0,
            reason: inputDetail
        };
    }

    // --- Step 1: 片脚NG（どちらか一方でも不可）の場合、両脚の結果で判定 ---

    // ロコモ度 3
    if (bothMin === 'impossible') {
        return { degree: 3, reason: inputDetail };
    }
    if (bothMin === '40cm') {
        return { degree: 3, reason: inputDetail };
    }

    // ロコモ度 2
    if (bothMin === '30cm') {
        return { degree: 2, reason: inputDetail };
    }

    // ロコモ度 1
    if (bothMin === '20cm' || bothMin === '10cm') {
        return { degree: 1, reason: inputDetail };
    }

    // フォールバック
    return { degree: 3, reason: inputDetail };
};

/**
 * 2ステップテストの計算と判定
 */
export const calculateTwoStepDegree = (test: TwoStepTest, heightCm: number): { value: number; degree: LocomoDegree } => {
    if (heightCm <= 0) return { value: 0, degree: 3 }; // エラー回避

    // 良い方の記録を採用
    const bestStepCm = Math.max(test.step1Cm, test.step2Cm);

    // 2ステップ値 = 良い2歩幅(cm) ÷ 身長(cm)
    const rawValue = bestStepCm / heightCm;

    // 画面表示用および判定用に値を丸める（小数点第3位を四捨五入して第2位までにする）
    const value = Math.round(rawValue * 100) / 100;

    let degree: LocomoDegree = 0;

    if (value < 0.9) {
        degree = 3;
    } else if (value >= 0.9 && value < 1.1) {
        degree = 2;
    } else if (value >= 1.1 && value < 1.3) {
        degree = 1;
    } else {
        degree = 0; // 1.3以上
    }

    return { value, degree };
};

/**
 * ロコモ25の計算と判定
 */
export const calculateLocomo25Degree = (answers: Locomo25Answers): { score: number; degree: LocomoDegree } => {
    // 未回答(null)は0点扱いとして計算
    const score = answers.reduce<number>((sum, val) => sum + (val ?? 0), 0);

    let degree: LocomoDegree = 0;
    if (score >= 24) {
        degree = 3;
    } else if (score >= 16) {
        degree = 2;
    } else if (score >= 7) {
        degree = 1;
    } else {
        degree = 0;
    }

    return { score, degree };
};

/**
 * 統合判定
 */
export const calculateFinalResult = (
    standUp: StandUpTest,
    twoStep: TwoStepTest,
    locomo25: Locomo25Answers,
    heightCm: number
): CalculationResult => {
    const standUpRes = calculateStandUpDegree(standUp);
    const twoStepRes = calculateTwoStepDegree(twoStep, heightCm);
    const locomo25Res = calculateLocomo25Degree(locomo25);

    // 最終ロコモ度 = 最大値
    const finalDegree = Math.max(
        standUpRes.degree,
        twoStepRes.degree,
        locomo25Res.degree
    ) as LocomoDegree;

    return {
        standUpDegree: standUpRes.degree,
        standUpReason: standUpRes.reason,
        twoStepValue: twoStepRes.value,
        twoStepDegree: twoStepRes.degree,
        locomo25Score: locomo25Res.score,
        locomo25Degree: locomo25Res.degree,
        finalDegree,
    };
};

/**
 * ロコモ度に応じた色とテキストを取得
 */
export const getLocomoColor = (degree: LocomoDegree) => {
    switch (degree) {
        case 0: return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-500', hex: '#22c55e', label: '緑' };
        case 1: return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-500', hex: '#eab308', label: '黄' };
        case 2: return { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-500', hex: '#f97316', label: '橙' };
        case 3: return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-500', hex: '#ef4444', label: '赤' };
    }
};