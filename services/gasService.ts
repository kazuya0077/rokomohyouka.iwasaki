import { TestData } from "../types";
import { calculateLocomoLevel } from "../utils/logic";
import { STAND_UP_OPTIONS } from "../constants";

// Google Apps Script Web App URL
// 安全な環境変数アクセス：processが未定義の環境(ブラウザ直接実行など)でもクラッシュしないようにする
const GAS_URL = (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GAS_URL) || "https://script.google.com/macros/s/AKfycbxdcAHOT7FS_Cip5p0lugTbv2oTXMzvnv-4KJysna_ibx9K19_10xn85rO4R2LFXH00/exec";

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

  // 自動判定ロジック：注意が必要な項目 (attentionItems)
  const attentionItems: string[] = [];
  if (data.standUpScore !== null && data.standUpScore < 5) {
    attentionItems.push("① 立ち上がり筋力 (下肢筋力低下の疑い)");
  }
  if (data.twoStep && data.twoStep.score < 1.3) {
    attentionItems.push("② 歩幅・バランス能力 (移動機能低下の疑い)");
  }
  if (data.locomo25 && data.locomo25.totalScore >= 7) {
    attentionItems.push("③ 生活動作の困難感 (自覚症状あり)");
  }

  // 日付のフォーマット (YYYY年M月D日) - プロンプトの要求に合わせる
  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

  // 1. AI Studio のプロンプト変数 {{locomo_json}} に渡すための厳密な構造を作成
  const locomoJson = {
    profile: {
      name: data.profile?.name || '未入力',
      age: data.profile?.age || null,
      gender: data.profile?.gender === 'male' ? '男性' : '女性',
      heightCm: data.profile?.height || null
    },
    measurementDate: dateStr,
    locomoLevel: `ロコモ度${level}`,
    standUp: {
      score: data.standUpScore,
      condition: standUpLabel,
      riskLevel: getStandUpRisk(data.standUpScore)
    },
    twoStep: {
      score: data.twoStep?.score || null,
      riskLevel: getTwoStepRisk(data.twoStep?.score ?? null)
    },
    locomo25: {
      totalScore: data.locomo25?.totalScore ?? null,
      severity: getLocomo25Severity(data.locomo25?.totalScore ?? null)
    },
    riskPattern: "―", // AI側で特に指定がない場合はダッシュで埋める
    attentionItems: attentionItems.length > 0 ? attentionItems : null,
    notes: data.standUpScore === null ? "一部テスト未実施" : ""
  };

  // 【デバッグ用】AI Studio にコピペするためのログ出力
  console.log("📋 【AI Studio プロンプト用 JSON】 下記をコピーして locomo_json に貼り付けてください:");
  console.log(JSON.stringify(locomoJson, null, 2));

  // 2. GASへの送信ペイロード
  // AI Studio用JSONをベースに、GAS記録用のタイムスタンプなどを付与
  const payload = {
    ...locomoJson,
    timestamp: new Date().toISOString(),
    app_version: "v5.1-ai-studio-json-formatted"
  };

  try {
    await fetch(GAS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    console.log("✅ Data sent successfully (no-cors mode)");
    return true;
  } catch (error) {
    console.error("❌ Failed to send data to GAS:", error);
    return false;
  }
};