// スプレッドシート送信用のユーティリティ

const GAS_SCRIPT_ID = [
    'AKfycbyzw2hMLhYDNYUS1KeyOZo30rfGvJozz80bFlAJd5cYl_',
    '-KXeKLbL8v6hTuoITV4eJF'
].join('');
const GAS_WEB_APP_URL = `https://script.google.com/macros/s/${GAS_SCRIPT_ID}/exec`;

export interface SpreadsheetData {
    date: string;           // 日時
    name: string;           // 氏名
    age: number | string;   // 年齢
    gender: string;         // 性別
    height: number;         // 身長
    standUpScore: number;   // 立ち上がりスコア（ロコモ度）
    standUpDetail?: string; // 立ち上がり詳細
    standUpReason?: string; // 立ち上がり判定理由
    twoStepScore: number;   // 2ステップスコア（値）
    locomo25Score: number;  // ロコモ25点数
    locomoLevel: number;    // 判定レベル（最終ロコモ度）
    locomo25Answers: (number | null)[]; // ロコモ25 Q1〜Q25の個別回答
}

/**
 * スプレッドシートにデータを送信する
 */
export const sendToSpreadsheet = async (data: SpreadsheetData): Promise<{ result: string; error?: string }> => {
    try {
        await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify(data),
        });

        // no-corsモードの場合、レスポンスは読み取れないため成功とみなす
        return { result: 'success' };
    } catch (error) {
        console.error('スプレッドシート送信エラー:', error);
        return {
            result: 'error',
            error: error instanceof Error ? error.message : '不明なエラー'
        };
    }
};

/**
 * 現在の日時を取得（フォーマット: YYYY/MM/DD HH:mm:ss）
 */
export const getCurrentDateTime = (): string => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};