import React, { useState, useEffect } from 'react';
import { LocomoState, CalculationResult } from './types';
import { calculateFinalResult } from './utils/calculations';
import { sendToSpreadsheet, getCurrentDateTime, SpreadsheetData } from './utils/spreadsheet';
import { InputSection } from './components/InputSection';
import { ResultReport } from './components/ResultReport';
import { Eye, Download, Loader2, ArrowRight, ArrowLeft, CheckCircle, FileText, Send } from 'lucide-react';

// html2pdfはindex.htmlのscriptタグで読み込まれるため、型定義を行う
declare var html2pdf: any;

const initialState: LocomoState = {
  basicInfo: {
    companyName: '',
    userName: '',
    age: 0,
    gender: 'male',
    heightCm: 0,
  },
  standUpTest: {
    bothMin: 'untested' as any,
    singleRightMin: 'untested',
    singleLeftMin: 'untested',
  },
  twoStepTest: {
    step1Cm: 0,
    step2Cm: 0,
  },
  locomo25Answers: Array(25).fill(null),
};

const STEPS = [
  { id: 1, label: '基本情報' },
  { id: 2, label: '立ち上がり' },
  { id: 3, label: '2ステップ' },
  { id: 4, label: 'ロコモ25' },
  { id: 5, label: '結果・PDF' },
];

const App: React.FC = () => {
  const [state, setState] = useState<LocomoState>(initialState);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingData, setIsSendingData] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // 計算処理
  useEffect(() => {
    const calc = calculateFinalResult(
      state.standUpTest,
      state.twoStepTest,
      state.locomo25Answers,
      state.basicInfo.heightCm
    );
    setResult(calc);
  }, [state]);

  const handleStateChange = (key: string, value: any) => {
    setState(prev => ({ ...prev, [key]: value }));
  };

  // バリデーション関数
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // 基本情報
        if (!state.basicInfo.userName.trim()) {
          alert('氏名を入力してください。');
          return false;
        }
        if (!state.basicInfo.heightCm || state.basicInfo.heightCm <= 0) {
          alert('身長を正しく入力してください（計算に必須です）。');
          return false;
        }
        return true;
      case 2: // 立ち上がり
        if (!state.standUpTest.bothMin || state.standUpTest.bothMin === ('untested' as any)) {
          alert('両脚でのテスト結果を選択してください。');
          return false;
        }
        return true;
      case 3: // 2ステップ
        if (!state.twoStepTest.step1Cm || state.twoStepTest.step1Cm <= 0) {
          alert('1回目の数値を入力してください。');
          return false;
        }
        if (!state.twoStepTest.step2Cm || state.twoStepTest.step2Cm <= 0) {
          alert('2回目の数値を入力してください。');
          return false;
        }
        return true;
      case 4: // ロコモ25
        const unansweredCount = state.locomo25Answers.filter(a => a === null).length;
        if (unansweredCount > 0) {
          alert(`未回答の項目が ${unansweredCount} 問あります。全ての質問に回答してください。`);
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length) {
        setCurrentStep(prev => prev + 1);
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const jumpToStep = (stepId: number) => {
    // 修正: ユーザー要望により、いつでもクリックでステップ移動可能にする（修正・確認用）
    setCurrentStep(stepId);
    window.scrollTo(0, 0);
  };

  // A4サイズ (210mm x 297mm) 
  const getPdfOptions = (userName: string) => ({
    margin: 0,
    filename: `Locomo_${userName || 'result'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    enableLinks: true,
    html2canvas: {
      scale: 2,
      useCORS: true,
      logging: false,
      scrollY: 0,
      // windowWidth/widthを指定すると、要素のCSS幅(210mm)と競合してレイアウト崩れの原因になるため削除
      // 自動的に要素の幅を取得させる
    },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
  });

  const handleDownloadPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    setIsGeneratingPdf(true);
    const opt = getPdfOptions(state.basicInfo.userName);

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("PDF generation failed", error);
      alert("PDF生成に失敗しました。ブラウザの印刷機能をお試しください。");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePreviewPDF = async () => {
    const element = document.getElementById('report-content');
    if (!element) return;

    setIsGeneratingPdf(true);
    const opt = getPdfOptions(state.basicInfo.userName);

    try {
      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('bloburl');
      window.open(pdfBlob, '_blank');
    } catch (error) {
      console.error("PDF preview failed", error);
      alert("PDFプレビューの生成に失敗しました。");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // スプレッドシートにデータを送信
  const handleSendToSpreadsheet = async () => {
    if (!result) {
      alert('結果が計算されていません。');
      return;
    }

    setIsSendingData(true);
    setSendResult(null);

    try {
      const data: SpreadsheetData = {
        date: getCurrentDateTime(),
        name: state.basicInfo.userName,
        age: state.basicInfo.age || '',
        gender: state.basicInfo.gender === 'male' ? '男性' : '女性',
        height: state.basicInfo.heightCm,
        standUpScore: result.standUpDegree,
        twoStepScore: result.twoStepValue,
        locomo25Score: result.locomo25Score,
        locomoLevel: result.finalDegree,
        locomo25Answers: state.locomo25Answers,
      };

      const response = await sendToSpreadsheet(data);

      if (response.result === 'success') {
        setSendResult({ success: true, message: 'スプレッドシートに保存しました！' });
        alert('スプレッドシートに保存しました！');
      } else {
        setSendResult({ success: false, message: response.error || '送信に失敗しました' });
        alert('送信に失敗しました: ' + (response.error || '不明なエラー'));
      }
    } catch (error) {
      console.error('スプレッドシート送信エラー:', error);
      setSendResult({ success: false, message: 'ネットワークエラーが発生しました' });
      alert('ネットワークエラーが発生しました。');
    } finally {
      setIsSendingData(false);
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">

      {/* ナビゲーションバー */}
      <nav className="no-print sticky top-0 z-50 bg-white shadow-md border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-xl font-bold text-blue-600">ロコモチェック</span>
              </div>
              <span className="text-xs text-gray-500 mt-0.5">PDFレポート作成ツール</span>
            </div>

            <div className="hidden md:flex space-x-2">
              {STEPS.map((s) => {
                const isActive = s.id === currentStep;
                const isCompleted = s.id < currentStep;
                return (
                  <div key={s.id} className="flex items-center cursor-pointer group" onClick={() => jumpToStep(s.id)}>
                    <div
                      className={`
                        flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-colors
                        ${isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' : 'bg-gray-200 text-gray-500 group-hover:bg-gray-300'}
                      `}
                    >
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : s.id}
                    </div>
                    {s.id !== STEPS.length && (
                      <div className={`w-8 h-0.5 mx-2 ${isCompleted ? 'bg-blue-200' : 'bg-gray-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="md:hidden text-sm font-bold text-gray-600">
              Step <span className="text-blue-600 text-lg">{currentStep}</span> / {STEPS.length}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto mt-6 px-4 sm:px-6">

        {/* 入力フォーム (Step 1-4) */}
        <div className={currentStep < 5 ? 'block no-print' : 'hidden'}>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">{STEPS[currentStep - 1].label}を入力してください</h1>
            <p className="text-gray-500 mt-2 text-sm">
              <span className="text-red-500 font-bold">* 必須項目</span> です。全てのデータを入力してください。
            </p>
          </div>

          <InputSection step={currentStep} state={state} onChange={handleStateChange} />

          {/* ナビゲーションボタン */}
          <div className="mt-8 flex justify-between max-w-4xl mx-auto pb-4 px-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`flex items-center px-6 py-3 rounded-lg font-bold transition-colors ${currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm'
                }`}
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              戻る
            </button>

            <button
              onClick={handleNext}
              className="flex items-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-105"
            >
              {currentStep === 4 ? (
                <>
                  <Eye className="w-5 h-5 mr-2" />
                  結果確認・PDF作成へ
                </>
              ) : (
                <>
                  次へ
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* プレビュー・印刷モード (Step 5) */}
        <div className={currentStep === 5 ? 'block' : 'hidden print-only'}>
          <div className="no-print mb-6 flex flex-col items-center bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm space-y-4">
            <div className="w-full text-center sm:text-left sm:flex sm:justify-between sm:items-center">
              <div>
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2 justify-center sm:justify-start">
                  <CheckCircle className="text-green-500 w-6 h-6" />
                  チェック完了
                </h2>
                <p className="text-sm text-blue-700 mt-1">
                  結果シートが作成されました。
                </p>
              </div>

              <div className="mt-6 sm:mt-0 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 justify-center items-center w-full sm:w-auto">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    window.scrollTo(0, 0);
                  }}
                  className="w-full sm:w-auto px-4 py-3 bg-white text-gray-700 font-bold rounded-lg border border-gray-300 shadow hover:bg-gray-50"
                  disabled={isGeneratingPdf}
                >
                  修正する
                </button>

                <button
                  onClick={handlePreviewPDF}
                  className="w-full sm:w-auto flex items-center justify-center px-4 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isGeneratingPdf}
                >
                  {isGeneratingPdf ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-5 h-5 mr-2" />
                      PDFプレビュー
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all"
                  disabled={isGeneratingPdf || isSendingData}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      PDFを保存する
                    </>
                  )}
                </button>

                <button
                  onClick={handleSendToSpreadsheet}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-green-600 text-white font-bold rounded-lg shadow-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] transition-all"
                  disabled={isGeneratingPdf || isSendingData}
                >
                  {isSendingData ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      スプシに保存
                    </>
                  )}
                </button>

                {sendResult && (
                  <div className={`w-full text-center text-sm mt-2 ${sendResult.success ? 'text-green-600' : 'text-red-600'}`}>
                    {sendResult.message}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800 flex items-start">
              <span className="text-lg mr-2">⚠️</span>
              <div>
                <p className="font-bold">iPhone / Androidでうまく保存できない場合：</p>
                <p>LINE等のアプリ内ブラウザではダウンロードがブロックされることがあります。右上のメニュー等から<strong>「ブラウザで開く（Safari/Chrome）」</strong>を選択して再試行してください。</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-300 p-2 sm:p-8 rounded-xl print:p-0 print:bg-white overflow-hidden flex justify-center flex-col items-center">
            <p className="text-center text-gray-600 text-sm mb-4 no-print font-bold">▼ プレビュー (実際のPDFイメージ) ▼</p>
            {/* 
                プレビュー表示用コンテナ
                A4サイズ (210mm) を画面に収めるため、レスポンシブにscaleを適用。
                スクロール可能にし、下部が見切れないようにpaddingを追加。
             */}
            <div className="w-full overflow-x-auto flex justify-center bg-gray-500/10 rounded-lg py-8">
              {/* ラッパー: 画面幅に応じて縮小率を変えるが、PDF生成時はこの影響を受けないようにIDは内側に配置 */}
              <div className="origin-top transform scale-[0.45] sm:scale-[0.6] md:scale-[0.8] lg:scale-100 transition-transform duration-300"
                style={{ marginBottom: '-50%' /* 縮小時の余白調整 */ }}>
                <div id="report-content" className="mx-auto shadow-2xl bg-white">
                  {result && (
                    <ResultReport
                      basicInfo={state.basicInfo}
                      result={result}
                      twoStepTest={state.twoStepTest}
                    />
                  )}
                </div>
              </div>
            </div>
            <p className="text-center text-gray-500 text-xs mt-2 no-print">※画面サイズに合わせて縮小表示しています</p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;