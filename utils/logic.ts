import { StandUpResultScore, TestData, LocomoLevel, AdviceData } from '../types';
import { IMAGE_IDS, getDriveImageUrl } from '../constants';

export const calculateTwoStepScore = (step1: number, step2: number, height: number): number => {
  if (height === 0) return 0;
  return (step1 + step2) / height;
};

export const calculateLocomoLevel = (data: TestData): LocomoLevel => {
  if (!data.standUpScore && data.standUpScore !== 0) return 0;
  if (!data.twoStep) return 0;
  if (!data.locomo25) return 0;

  // Values
  const su = data.standUpScore; // 0-8 (Lower is worse)
  const ts = data.twoStep.score; // Higher is better
  const l25 = data.locomo25.totalScore; // Lower is better

  // --- 判定基準 (Based on PDF Page 9) ---

  // 【ロコモ度3】 いずれか1つでも該当すれば判定
  // 1. 立ち上がり: 両脚30cm不可 (Score 0 or 1)
  //    - Score 2 is "Can do Both 30cm". So Score < 2 means Cannot do Both 30cm.
  // 2. 2ステップ: 0.9未満
  // 3. ロコモ25: 24点以上
  if (su < 2 || ts < 0.9 || l25 >= 24) {
    return 3;
  }

  // 【ロコモ度2】 いずれか1つでも該当すれば判定
  // 1. 立ち上がり: 両脚20cm不可 (Score 2)
  //    - Score 3 is "Can do Both 20cm". So Score < 3 means Cannot do Both 20cm.
  //    - Note: Since we already checked Level 3 (su < 2), this effectively catches su === 2.
  // 2. 2ステップ: 0.9以上 1.1未満 (Checked < 0.9 above, so this checks < 1.1)
  // 3. ロコモ25: 16点以上 24点未満 (Checked >= 24 above, so this checks >= 16)
  if (su < 3 || ts < 1.1 || l25 >= 16) {
    return 2;
  }

  // 【ロコモ度1】 いずれか1つでも該当すれば判定
  // 1. 立ち上がり: 片脚40cm不可 (Score 3 or 4)
  //    - Score 5 is "Can do One leg 40cm". So Score < 5 means Cannot do One leg 40cm.
  // 2. 2ステップ: 1.1以上 1.3未満 (Checks < 1.3)
  // 3. ロコモ25: 7点以上 16点未満 (Checks >= 7)
  if (su < 5 || ts < 1.3 || l25 >= 7) {
    return 1;
  }

  // ロコモではない
  return 0;
};

export const getAdvice = (level: LocomoLevel): AdviceData => {
  // 共通のロコトレ・食事アドバイス (PDF Page 10-13 based)
  const commonExercise = [
    {
      name: "① 片脚立ち (バランス能力UP)",
      goal: "左右 各1分 × 1日3セット",
      points: [
        "転倒しないよう、必ずつかまるもの（机や壁）を持つ",
        "床につかない程度に片足を上げる",
        "姿勢をまっすぐ保つ",
        "支えている脚の膝は少し曲げてもOK"
      ],
      imageUrl: getDriveImageUrl(IMAGE_IDS.ONE_LEG)
    },
    {
      name: "② スクワット (下肢筋力UP)",
      goal: "5〜6回 × 1日3セット",
      points: [
        "肩幅より少し広めに足を広げて立つ",
        "お尻を後ろに引くようにゆっくりしゃがむ",
        "膝がつま先より前に出ないように注意",
        "息を止めない（深呼吸をするペースで）"
      ],
      imageUrl: getDriveImageUrl(IMAGE_IDS.SQUAT)
    }
  ];

  const commonDiet = {
    title: "運動効果を高める「食」：骨と筋肉の素を摂る",
    nutrients: [
      "たんぱく質 (肉・魚・豆)",
      "カルシウム (乳製品・小魚)",
      "ビタミンD (きのこ・魚)",
      "ビタミンK (緑の野菜・納豆)"
    ],
    description: "運動だけでなく、体を作る栄養素も重要です。3食バランスよく食べることが基本ですが、特に高齢の方は「たんぱく質」が不足しないように意識しましょう。骨を強くするカルシウムやビタミン類も積極的に摂りましょう。",
    imageUrl: getDriveImageUrl(IMAGE_IDS.FOOD)
  };

  switch (level) {
    case 3:
      return {
        level: 3,
        summary: "ロコモ度3：社会参加に支障をきたしている状態です。",
        exercise: {
          title: "無理のない範囲から始めましょう",
          items: commonExercise
        },
        diet: commonDiet
      };
    case 2:
      return {
        level: 2,
        summary: "ロコモ度2：移動機能の低下が進行しています。",
        exercise: {
          title: "ロコトレを習慣にしましょう",
          items: commonExercise
        },
        diet: commonDiet
      };
    case 1:
      return {
        level: 1,
        summary: "ロコモ度1：移動機能の低下が始まっています。",
        exercise: {
          title: "予防のためにロコトレを開始しましょう",
          items: commonExercise
        },
        diet: commonDiet
      };
    default:
      return {
        level: 0,
        summary: "ロコモではありません。現在の機能を維持しましょう。",
        exercise: {
          title: "将来のために継続しましょう",
          items: commonExercise
        },
        diet: commonDiet
      };
  }
};