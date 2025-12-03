import React, { useState, useEffect } from 'react';
import { TestData, UserProfile, StandUpResultScore, TwoStepResult, Locomo25Result } from './types';
import { ProfileInput, StandUpTest, TwoStepTest, Locomo25Test } from './components/Tests';
import { Report } from './components/Report';
import { ClipboardList, Clock } from 'lucide-react';

// Steps definition
enum Step {
  INTRO = 0,
  PROFILE = 1,
  STAND_UP = 2,
  TWO_STEP = 3,
  LOCOMO_25 = 4,
  RESULT = 5
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(Step.INTRO);
  const [data, setData] = useState<TestData>({
    profile: null,
    standUpScore: null,
    twoStep: null,
    locomo25: null
  });

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const nextStep = () => setCurrentStep((prev) => prev + 1);

  const handleProfileSave = (profile: UserProfile) => {
    setData((prev) => ({ ...prev, profile }));
    nextStep();
  };

  const handleStandUpSave = (score: StandUpResultScore) => {
    setData((prev) => ({ ...prev, standUpScore: score }));
    nextStep();
  };

  const handleTwoStepSave = (result: TwoStepResult) => {
    setData((prev) => ({ ...prev, twoStep: result }));
    nextStep();
  };

  const handleLocomo25Save = (result: Locomo25Result) => {
    setData((prev) => ({ ...prev, locomo25: result }));
    nextStep();
  };

  const handleRestart = () => {
    setData({
      profile: null,
      standUpScore: null,
      twoStep: null,
      locomo25: null
    });
    setCurrentStep(Step.INTRO);
  };

  // Progress calculation
  const progress = Math.min(100, (currentStep / 5) * 100);

  return (
    <div className="min-h-screen pb-20 font-sans bg-slate-50 print:bg-white print:pb-0 print:h-auto print:min-h-0 print:block print:overflow-visible">
      {/* Header (Hidden on Print) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-3xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">ロコモチェックアプリ</h1>
          <div className="text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Locomotive Syndrome Check
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className="h-full bg-blue-600 transition-all duration-700 ease-in-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-6 py-10 print:max-w-none print:w-full print:p-0 print:m-0 print:block print:overflow-visible print:h-auto">
        {currentStep === Step.INTRO && (
          <div className="text-center py-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 text-blue-600 rounded-2xl mb-8 shadow-sm">
              <ClipboardList className="w-10 h-10" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-900 mb-6 leading-tight">
              移動機能の状態を<br/>チェックしましょう
            </h2>
            
            <p className="text-slate-600 max-w-md mx-auto mb-10 leading-loose">
              ロコモティブシンドローム（運動器症候群）の可能性を判定するために、以下の3つのテストを行います。
            </p>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 max-w-lg mx-auto mb-10 text-left">
              <div className="flex items-center gap-2 text-slate-500 mb-6 font-medium">
                <Clock className="w-5 h-5" />
                所要時間：約 5〜10 分
              </div>
              
              <ul className="space-y-6">
                <li className="flex items-start gap-4">
                  <div className="bg-pink-100 text-pink-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm mt-0.5">1</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">立ち上がりテスト</h3>
                    <p className="text-sm text-slate-500 mt-1">下肢筋力を測定します</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-green-100 text-green-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm mt-0.5">2</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">2ステップテスト</h3>
                    <p className="text-sm text-slate-500 mt-1">歩幅から歩行能力を測定します</p>
                  </div>
                </li>
                <li className="flex items-start gap-4">
                  <div className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm mt-0.5">3</div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">ロコモ25</h3>
                    <p className="text-sm text-slate-500 mt-1">25の質問で生活状況を確認します</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-4 max-w-xs mx-auto">
              <button 
                onClick={nextStep}
                className="w-full px-8 py-4 bg-blue-600 text-white text-lg font-bold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                検査を開始する
              </button>
            </div>
          </div>
        )}

        {currentStep === Step.PROFILE && (
          <ProfileInput data={data.profile} onSave={handleProfileSave} />
        )}

        {currentStep === Step.STAND_UP && (
          <StandUpTest onSave={handleStandUpSave} />
        )}

        {currentStep === Step.TWO_STEP && data.profile && (
          <TwoStepTest height={data.profile.height} onSave={handleTwoStepSave} />
        )}

        {currentStep === Step.LOCOMO_25 && (
          <Locomo25Test onSave={handleLocomo25Save} />
        )}

        {currentStep === Step.RESULT && (
          <Report data={data} onRestart={handleRestart} />
        )}
      </main>
      
      {/* Footer (Hidden on Print) */}
      <footer className="text-center text-slate-400 text-xs py-8 border-t border-slate-100 mt-12 print:hidden">
        <p>監修：日本整形外科学会 ロコモティブシンドローム予防啓発公式サイト</p>
        <p className="mt-1">Copyright © LocomoCheck Pro</p>
      </footer>
    </div>
  );
};

export default App;