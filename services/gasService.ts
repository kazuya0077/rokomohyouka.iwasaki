
import { TestData } from "../types";
import { calculateLocomoLevel } from "../utils/logic";
import { STAND_UP_OPTIONS } from "../constants";

// Google Apps Script Web App URL
// Vite環境では import.meta.env.VITE_GAS_URL を使用します
const GAS_URL = import.meta.env?.VITE_GAS_URL || "https://script.google.com/macros/s/AKfycbxdcAHOT7FS_Cip5p0lugTbv2oTXMzvnv-4KJysna_ibx9K19_10xn85rO4R2LFXH00/exec";

// --- Helper Functions for Risk/Severity ---

const getStandUpRisk = (score: number | null): string => {
  if (score === null) return '―';
  if (score <= 1) return '高リスク (ロコモ度3相当)'; 
  if (score === 2) return '中等度リスク (ロコモ度2相当)'; 
  if (score <= 4) return '軽度リスク (ロコモ度1相当)'; 
  return '低リスク (良好)'; 
};

const getTwoStepRisk = (score: number | null): string => {
  if (score === null) return '―';
  if (score < 0.9) return '高リスク (ロコモ度3相当)';
  if (score < 1.1) return '中等度リスク (ロコモ度2相当)';
  if (score < 1.3) return '軽度リスク (ロコモ度1相当)';
  return '低リスク (良好)'; 
};

const getLocomo25Severity = (score: number | null): string => {
  if (score === null) return '―';
  if (score >= 24) return '重度 (ロコモ度3相当)';
  if (score >= 16) return '中等度 (ロコモ度2相当)';
  if (score >= 7) return '軽度 (ロコモ度1相当)';
  return 'なし (良好)';
};

export const sendDataToGAS = async (data: TestData): Promise<boolean> => {
  if (!GAS_URL) {
    console.warn("GAS URL is not set. Skipping data transmission.");
    return false;
  }

  const level = calculateLocomoLevel(data);
  
  // 立ち上がり情報の整形
  let standUpLabel = '未実施';
  if (data.standUpScore !== null) {
    const option = STAND_UP_OPTIONS.find(opt => opt.score === data.standUpScore);
    if (option) {
      standUpLabel = option.label;
    }
  }

  // 日付のフォーマット (YYYY/MM/DD HH:mm)
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

  // ---------------------------------------------------------
  // GAS送信用のペイロード (互換性重視の全部入り構成)
  // ---------------------------------------------------------
  // GAS側が「ネストされたオブジェクト(data.twoStep.score)」を参照していても、
  // 「フラットなキー(data.twoStepScore)」を参照していても動くように両方送ります。
  const payload = {
    // 1. 基本情報
    date: dateStr,
    timestamp: dateStr,
    name: data.profile?.name || '未入力',
    username: data.profile?.name || '未入力',
    age: data.profile?.age ?? '',
    gender: data.profile?.gender === 'male' ? '男性' : '女性',
    sex: data.profile?.gender === 'male' ? '男性' : '女性',
    height: data.profile?.height ?? '',
    
    // 2. 立ち上がりテスト
    // ユーザー要望：点数(0-8)ではなく「片脚で10cmから立てる」などの日本語ラベルをメインの値として送信
    standUpScore: standUpLabel,     
    standUpScoreValue: data.standUpScore ?? '', // 数値データが必要な場合のために別名で保持
    standUpLabel: standUpLabel,
    
    // 3. 2ステップテスト
    // フラット形式
    twoStepScore: data.twoStep?.score ? data.twoStep.score.toFixed(2) : '',
    step1: data.twoStep?.step1 ?? '',
    step2: data.twoStep?.step2 ?? '',
    // ネスト形式 (GASが旧仕様の場合用)
    twoStep: data.twoStep ? {
      score: data.twoStep.score,
      step1: data.twoStep.step1,
      step2: data.twoStep.step2
    } : null,

    // 4. ロコモ25
    // フラット形式
    locomo25Score: data.locomo25?.totalScore ?? '',
    locomo25Total: data.locomo25?.totalScore ?? '',
    // ネスト形式
    locomo25: data.locomo25 ? {
      totalScore: data.locomo25.totalScore,
      answers: data.locomo25.answers
    } : null,
    
    // 5. 判定レベル
    locomoLevel: `ロコモ度${level}`,
    level: level, // 数値のみのバージョン

    // 6. リスク評価等の詳細
    details: {
        standUpLabel: standUpLabel,
        standUpRisk: getStandUpRisk(data.standUpScore),
        twoStepRisk: getTwoStepRisk(data.twoStep?.score ?? null),
        locomo25Severity: getLocomo25Severity(data.locomo25?.totalScore ?? null)
    }
  };

  console.log("📤 Sending payload to GAS (Hybrid Format):", payload);

  try {
    // no-cors モードのため、レスポンスの中身は確認できませんが、送信は行われます。
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    console.log("✅ Data sent request completed (no-cors mode)");
    return true;
  } catch (error) {
    console.error("❌ Failed to send data to GAS:", error);
    return false;
  }
};
