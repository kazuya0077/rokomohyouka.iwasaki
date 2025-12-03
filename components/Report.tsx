
import React, { useState } from "react";
import type { CSSProperties } from "react";
import { TestData } from "../types";
import { calculateLocomoLevel, getAdvice } from "../utils/logic";
import { sendDataToGAS } from "../services/gasService";
import { STAND_UP_OPTIONS } from "../constants";
import { RotateCcw, UploadCloud, CheckCircle, Loader2, Download, Eye } from "lucide-react";
// @ts-ignore
import html2canvas from "html2canvas";
// @ts-ignore
import { jsPDF } from "jspdf";

interface ReportProps {
  data: TestData;
  onRestart: () => void;
}

// 解説動画のURL設定（PDFにのみ表示）
const YOUTUBE_URL = "https://www.youtube.com/watch?v=lGlh4LhFWjs";
// QRコード生成API (外部サービスを使用)
const QR_CODE_API = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=ffffff&data=${encodeURIComponent(YOUTUBE_URL)}`;

export const Report: React.FC<ReportProps> = ({ data, onRestart }) => {
  const level = calculateLocomoLevel(data);
  const advice = getAdvice(level);

  // 保存状態管理
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // PDF生成状態管理
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- GAS保存ハンドラ ---
  const handleSave = async () => {
    if (isSaved || isSaving) return;

    setIsSaving(true);
    try {
      const success = await sendDataToGAS(data);
      if (success) {
        setIsSaved(true);
      } else {
        throw new Error("保存処理が失敗しました");
      }
    } catch (error) {
      console.error("Failed to save data:", error);
      alert("保存に失敗しました。ネットワーク状況を確認して、もう一度お試しください。");
      setIsSaved(false);
    } finally {
      setIsSaving(false);
    }
  };

  // --- PDF生成共通ロジック ---
  const generatePdfBlob = async (): Promise<any> => {
    const input = document.getElementById("print-template");
    if (!input) {
      throw new Error("テンプレートが見つかりませんでした");
    }

    // 1. 隠しテンプレートを画像化
    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true, 
      allowTaint: true,
      logging: false,
      windowWidth: 1200,
    });

    const imgData = canvas.toDataURL("image/png");

    // 2. A4 PDF 作成
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, imgHeight);

    // 3. ハイパーリンク領域の追加
    // 画像化されたPDFの上に、透明なリンクボタンを重ねます。
    // A4 (210mm x 297mm) の下部、URLテキストが表示されているあたりを指定
    // X: 15mm (左マージン), Y: 268mm (下から約3cm), W: 110mm (幅), H: 10mm (高さ)
    pdf.link(15, 268, 110, 10, { url: YOUTUBE_URL });

    return pdf;
  };

  // --- PDF保存 (PC用) ---
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generatePdfBlob();
      // 日付入りファイル名で保存
      const todayStr = new Date().toISOString().split('T')[0];
      const fileName = `ロコモ評価結果_${data.profile?.name || "user"}_${todayStr}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("PDFの作成に失敗しました。");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // --- PDFプレビュー (スマホ用) ---
  const handlePreviewPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generatePdfBlob();
      // Blob URLを生成して別タブで開く
      const blobUrl = pdf.output("bloburl");
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("PDF preview failed:", error);
      alert("プレビューの表示に失敗しました。ポップアップブロックの設定を確認してください。");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 立ち上がりテスト（画面側）の表示テキスト
  const getStandUpText = () => {
    if (data.standUpScore === null) return "未実施";
    const opt = STAND_UP_OPTIONS.find((o) => o.score === data.standUpScore);
    return opt ? opt.label : `Score ${data.standUpScore}`;
  };

  // ===========================
  // 画面表示用ビュー（スマホ・LINEプレビュー用）
  // ===========================
  const ScreenView = () => (
    <div className="max-w-4xl mx-auto pb-24">
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 mb-12 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">判定結果</h2>

        {/* ロコモ度のバッジ（画面用） */}
        <div className="inline-block relative mb-8">
          <div
            className={`w-40 h-40 rounded-full flex flex-col items-center justify-center text-white shadow-xl ${
              level === 0
                ? "bg-green-600"
                : level === 1
                ? "bg-yellow-500"
                : level === 2
                ? "bg-orange-500"
                : "bg-red-600"
            }`}
          >
            <span className="text-lg font-medium opacity-90">ロコモ度</span>
            <span className="text-6xl font-black">{level}</span>
          </div>
        </div>

        <p className="text-xl text-slate-700 font-bold mb-8 max-w-xl mx-auto leading-relaxed">
          {advice.summary}
        </p>

        {/* 操作ボタンエリア */}
        <div className="flex flex-col gap-4 max-w-2xl mx-auto">
          
          {/* 1. クラウド保存 (GAS) */}
          <button
            onClick={handleSave}
            disabled={isSaving || isSaved}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl transition-all font-bold shadow-md transform active:scale-95 ${
              isSaved
                ? "bg-green-600 text-white cursor-default shadow-none border-2 border-green-600"
                : "bg-indigo-600 text-white hover:bg-indigo-700 hover:-translate-y-0.5"
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>保存中...</span>
              </>
            ) : isSaved ? (
              <>
                <CheckCircle size={20} />
                <span>保存完了</span>
              </>
            ) : (
              <>
                <UploadCloud size={20} />
                <span>結果を保存する</span>
              </>
            )}
          </button>

          {/* 2. PDF操作ボタン群 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* PDFプレビュー (スマホ用) */}
            <button
              onClick={handlePreviewPdf}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-bold shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            >
              {isGeneratingPdf ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Eye size={20} />
              )}
              <span>PDFプレビュー (スマホ)</span>
            </button>

            {/* PDF保存 (PC/印刷用) */}
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition font-bold shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-wait"
            >
              {isGeneratingPdf ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Download size={20} />
              )}
              <span>PDF保存 (PC用)</span>
            </button>
          </div>

          {/* 最初に戻る */}
          <button
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition font-bold mt-2"
          >
            <RotateCcw size={18} />
            最初に戻る
          </button>
        </div>
      </div>

      {/* 結果詳細（画面用） */}
      <div className="bg-white p-8 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800 mb-4">結果詳細</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-500">立ち上がり</div>
            <div className="font-bold text-lg">{getStandUpText()}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-500">2ステップ</div>
            <div className="font-bold text-lg">
              {data.twoStep?.score != null ? data.twoStep.score.toFixed(2) : "-"}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-500">ロコモ25</div>
            <div className="font-bold text-lg">{data.locomo25?.totalScore ?? "-"} 点</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ===========================
  // PDF用 Hidden Template (印刷・PC保存用)
  // ===========================
  const HiddenTemplate = () => {
    const standUpLabel =
      data.standUpScore !== null && data.standUpScore !== undefined
        ? STAND_UP_OPTIONS.find((o) => o.score === data.standUpScore)?.label || "-"
        : "未実施";

    const getLocomoLevelColor = (lvl: number): string => {
      if (lvl >= 3) return "#DC2626"; // 赤
      if (lvl === 2) return "#F97316"; // オレンジ
      return "#1D4ED8"; // 青
    };
    const levelColor = getLocomoLevelColor(level);

    // 総合判定ブロック
    const summaryBlockStyle: React.CSSProperties = {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      margin: "16px 0 24px",
      textAlign: "center",
    };

    const adviceCardStyle: CSSProperties = {
      borderRadius: 12,
      border: "1px solid #E5E7EB",
      padding: 10,
      display: "flex",
      flexDirection: "column",
      gap: 4,
      backgroundColor: "#F9FAFB",
      breakInside: "avoid",
      fontSize: 10,
      lineHeight: 1.4,
    };

    return (
      <div
        id="print-template"
        className="fixed top-0 left-[-10000px] bg-white text-slate-900"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "15mm",
          boxSizing: "border-box",
          fontFamily: '"Noto Sans JP", sans-serif',
          lineHeight: "1.5",
        }}
      >
        {/* ヘッダー */}
        <div className="border-b-2 border-slate-800 pb-4 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">ロコモチェック結果レポート</h1>
            <p className="text-sm text-slate-500 mt-1">Locomotive Syndrome Check Report</p>
          </div>
          <div className="text-right text-sm">
            <p>作成日: {new Date().toLocaleDateString("ja-JP")}</p>
            <p className="font-bold mt-1 text-base">{data.profile?.name || "未入力"} 様</p>
          </div>
        </div>

        {/* 基本情報 */}
        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex justify-around text-sm">
          <div>
            <span className="text-slate-500 block text-xs">年齢</span>
            <span className="font-bold">{data.profile?.age ?? "-"} 歳</span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">性別</span>
            <span className="font-bold">
              {data.profile?.gender === "male"
                ? "男性"
                : data.profile?.gender === "female"
                ? "女性"
                : "―"}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-xs">身長</span>
            <span className="font-bold">
              {data.profile?.height != null ? `${data.profile.height} cm` : "―"}
            </span>
          </div>
        </div>

        {/* 総合判定 */}
        <div style={summaryBlockStyle}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "4px 18px",
              borderRadius: 9999,
              backgroundColor: "#111827",
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            総合判定
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 700,
              color: levelColor,
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            ロコモ度 {level}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "#4B5563",
              lineHeight: 1.5,
              maxWidth: 480,
            }}
          >
            {advice.summary}
          </div>
        </div>

        {/* 検査結果詳細 */}
        <div className="mb-6">
          <h3 className="text-lg font-bold border-l-4 border-slate-800 pl-3 mb-2">
            検査結果詳細
          </h3>
          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 p-2 text-left w-1/3 border-r border-slate-300 font-semibold">
                  立ち上がりテスト
                </th>
                <td className="p-2">
                  <div className="font-bold text-base">{standUpLabel}</div>
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 p-2 text-left w-1/3 border-r border-slate-300 font-semibold">
                  2ステップテスト
                </th>
                <td className="p-2">
                  <div className="font-bold text-base">
                    {data.twoStep?.score != null ? data.twoStep.score.toFixed(2) : "-"}
                  </div>
                  <div className="text-slate-600 text-xs mt-1">スコア（最大2歩幅 ÷ 身長）</div>
                </td>
              </tr>
              <tr className="border-b border-slate-300">
                <th className="bg-slate-100 p-2 text-left w-1/3 border-r border-slate-300 font-semibold">
                  ロコモ25
                </th>
                <td className="p-2">
                  <div className="font-bold text-base">{data.locomo25?.totalScore ?? "-"} 点</div>
                  <div className="text-slate-600 text-xs mt-1">25項目の質問票合計</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ロコトレ・アドバイス */}
        <div style={{ marginTop: 20 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 8,
              borderLeft: "4px solid #1f2937",
              paddingLeft: 12,
            }}
          >
            今日からできるロコトレと「食」
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 10,
              marginBottom: 10,
            }}
          >
            {/* ロコトレ① */}
            <div style={adviceCardStyle}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>① 片脚立ち</div>
              <div style={{ fontSize: 10 }}>
                <span style={{ fontWeight: "bold" }}>目標：</span>
                左右 各1分 × 1日3セット
              </div>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                <span style={{ fontWeight: "bold" }}>POINT：</span>
                つかまるものを持つ。
              </div>
            </div>

            {/* ロコトレ② */}
            <div style={adviceCardStyle}>
              <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>② スクワット</div>
              <div style={{ fontSize: 10 }}>
                <span style={{ fontWeight: "bold" }}>目標：</span>
                5〜6回 × 1日3セット
              </div>
              <div style={{ fontSize: 10, marginTop: 2 }}>
                <span style={{ fontWeight: "bold" }}>POINT：</span>
                膝がつま先より前に出ないように。
              </div>
            </div>
          </div>

          {/* 食事アドバイス */}
          <div style={adviceCardStyle}>
            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 2 }}>
              運動効果を高める「食」
            </div>
            <p style={{ fontSize: 10 }}>
              たんぱく質（肉・魚・豆）とカルシウム（乳製品）を積極的に摂りましょう。
            </p>
          </div>
        </div>

        {/* --- PDF用 QRコード & リンクエリア --- */}
        <div style={{ 
          marginTop: 20, 
          paddingTop: 15, 
          borderTop: "2px dashed #CBD5E1",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
           <div style={{ flex: 1, paddingRight: 20 }}>
              <div style={{ fontWeight: "bold", fontSize: 14, color: "#DC2626", marginBottom: 4 }}>
                🎥 動画で解説を見る
              </div>
              <div style={{ fontSize: 10, color: "#475569", lineHeight: 1.4, marginBottom: 4 }}>
                右のQRコードをスマートフォンで読み取ると、理学療法士による詳しい解説動画をご覧いただけます。
              </div>
              <div style={{ fontSize: 9, color: "#94A3B8", fontFamily: "monospace" }}>
                {YOUTUBE_URL}
              </div>
           </div>
           
           <div style={{ 
             width: 80, 
             height: 80, 
             border: "1px solid #E2E8F0", 
             padding: 4, 
             borderRadius: 4,
             backgroundColor: "white" 
           }}>
             {/* 
                crossOrigin="anonymous" は html2canvas で外部画像を描画するために必須。
                APIサーバーがCORSヘッダーを返してくれるため動作します。
             */}
             <img 
               src={QR_CODE_API} 
               alt="QR Code" 
               width="100%" 
               height="100%"
               crossOrigin="anonymous"
               style={{ display: "block" }}
             />
           </div>
        </div>

        {/* フッター */}
        <div className="mt-auto pt-4 border-t border-slate-300 text-center text-xs text-slate-400">
          <p>※ 本結果は簡易スクリーニングであり、医師の診断に代わるものではありません。</p>
          <p>LocomoCheck Pro</p>
        </div>
      </div>
    );
  };

  return (
    <>
      <ScreenView />
      <HiddenTemplate />
    </>
  );
};
