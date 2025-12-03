
import React, { useState } from 'react';
import { UserProfile, StandUpResultScore, TwoStepResult, Locomo25Result } from '../types';
import { STAND_UP_OPTIONS, LOCOMO_25_QUESTIONS, LOCOMO_25_OPTIONS, IMAGE_IDS, getDriveImageUrl } from '../constants';
import { calculateTwoStepScore } from '../utils/logic';
import { User, Ruler, Activity, CheckSquare } from 'lucide-react';

// --- Shared Components ---

// 画像表示用コンポーネント
// referrerPolicy="no-referrer" added to prevent Google Drive 403 errors
const TestImage: React.FC<{ url: string; alt: string; color?: string }> = ({ url, alt, color = "slate" }) => (
  <div className={`w-full overflow-hidden rounded-xl border-2 border-${color}-100 shadow-sm my-8 bg-white`}>
    <img 
      src={url} 
      alt={alt} 
      referrerPolicy="no-referrer"
      className="w-full h-auto object-contain max-h-[400px] mx-auto"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = 'none';
        console.error("Image failed to load:", url);
      }}
    />
  </div>
);

// --- Profile Input ---
interface ProfileInputProps {
  data: UserProfile | null;
  onSave: (data: UserProfile) => void;
}

export const ProfileInput: React.FC<ProfileInputProps> = ({ data, onSave }) => {
  const [name, setName] = useState(data?.name || '');
  const [age, setAge] = useState(data?.age || '');
  const [gender, setGender] = useState<'male' | 'female'>(data?.gender || 'female');
  const [height, setHeight] = useState(data?.height || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && age && height) {
      onSave({ name, age: Number(age), gender, height: Number(height) });
    }
  };

  // ホイール操作での数値変更を防ぐ
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">基本情報を入力してください</h2>
        <p className="text-slate-500">正確な判定のために必要です</p>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 氏名 */}
          <div>
            <label className="block text-base font-bold text-slate-700 mb-2">氏名</label>
            <input
              type="text"
              required
              placeholder="山田 太郎"
              className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-lg transition-all"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 年齢と身長 */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">年齢</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="10"
                  max="120"
                  placeholder="65"
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-lg transition-all"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onWheel={handleWheel}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">歳</span>
              </div>
            </div>
            <div>
              <label className="block text-base font-bold text-slate-700 mb-2">身長</label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="50"
                  max="250"
                  placeholder="160"
                  className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-lg transition-all"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  onWheel={handleWheel}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">cm</span>
              </div>
            </div>
          </div>

          {/* 性別 (色分け改善) */}
          <div>
            <label className="block text-base font-bold text-slate-700 mb-4">性別</label>
            <div className="grid grid-cols-2 gap-4">
              <label 
                className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                  gender === 'male' 
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={() => setGender('male')}
                  className="hidden"
                />
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                  {gender === 'male' && <span className="w-2 h-2 rounded-full bg-current" />}
                </span>
                <span className="font-bold text-lg">男性</span>
              </label>

              <label 
                className={`cursor-pointer p-4 rounded-xl border-2 flex items-center justify-center gap-3 transition-all ${
                  gender === 'female' 
                    ? 'bg-pink-50 border-pink-500 text-pink-700 ring-1 ring-pink-500' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={() => setGender('female')}
                  className="hidden"
                />
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center">
                  {gender === 'female' && <span className="w-2 h-2 rounded-full bg-current" />}
                </span>
                <span className="font-bold text-lg">女性</span>
              </label>
            </div>
          </div>

          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition shadow-md mt-6">
            次へ進む
          </button>
        </form>
      </div>
    </div>
  );
};

// --- Stand Up Test ---
interface StandUpTestProps {
  onSave: (score: StandUpResultScore) => void;
}

export const StandUpTest: React.FC<StandUpTestProps> = ({ onSave }) => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-4">
          <div className="bg-pink-100 p-2 rounded-lg">
            <Activity className="text-pink-600 w-6 h-6" />
          </div>
          立ち上がりテスト
        </h2>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm leading-loose text-slate-700">
          <p className="mb-4">
            <strong>方法：</strong><br/>
            40cmの台に腰掛け、両手は胸の前で組みます。
            反動をつけずに立ち上がり、そのまま3秒間保持できるかを確認します。
          </p>
          <p className="text-pink-700 font-bold bg-pink-50 p-3 rounded-lg border border-pink-100">
            ※ あなたが「できた」中で、最も難易度の高い（点数が高い）項目を1つ選んでください。
          </p>
        </div>
      </div>
      
      {/* 立ち上がりテストの画像を表示 */}
      <TestImage url={getDriveImageUrl(IMAGE_IDS.STAND_UP)} alt="立ち上がりテストのイラスト" color="pink" />

      <div className="space-y-3 mt-8">
        {STAND_UP_OPTIONS.map((opt) => (
          <button
            key={opt.score}
            onClick={() => onSave(opt.score as StandUpResultScore)}
            className="w-full text-left p-5 border-2 border-slate-100 rounded-xl hover:bg-pink-50 hover:border-pink-300 transition flex justify-between items-center group bg-white shadow-sm"
          >
            <div>
              <div className="font-bold text-slate-800 text-lg mb-1">{opt.label}</div>
              <div className="text-sm text-slate-500">{opt.description}</div>
            </div>
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-pink-500 group-hover:bg-pink-500 transition-colors"></div>
          </button>
        ))}
      </div>
    </div>
  );
};

// --- Two Step Test ---
interface TwoStepTestProps {
  height: number;
  onSave: (result: TwoStepResult) => void;
}

export const TwoStepTest: React.FC<TwoStepTestProps> = ({ height, onSave }) => {
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s1 = Number(step1);
    const s2 = Number(step2);
    if (s1 && s2) {
      const score = calculateTwoStepScore(s1, s2, height);
      onSave({ step1: s1, step2: s2, score });
    }
  };

  // ホイール操作での数値変更を防ぐ
  const handleWheel = (e: React.WheelEvent<HTMLInputElement>) => {
    e.currentTarget.blur();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-lg">
            <Ruler className="text-green-600 w-6 h-6" />
          </div>
          2ステップテスト
        </h2>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm leading-loose text-slate-700">
          <p>
            <strong>方法：</strong><br/>
            スタートラインにつま先を合わせ、できるだけ大股で2歩歩きます。
            2歩目のつま先までの距離を測定してください。<br/>
            （2回行い、良い方の記録を入力してください）
          </p>
        </div>
      </div>

      <TestImage url={getDriveImageUrl(IMAGE_IDS.TWO_STEP)} alt="2ステップテストのイラスト" color="green" />

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-base font-bold text-slate-700 mb-3">1歩目の長さ (cm)</label>
            <input
              type="number"
              required
              step="0.1"
              className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-lg"
              placeholder="例: 80"
              value={step1}
              onChange={(e) => setStep1(e.target.value)}
              onWheel={handleWheel}
            />
          </div>
          <div>
            <label className="block text-base font-bold text-slate-700 mb-3">2歩目の長さ (cm)</label>
            <input
              type="number"
              required
              step="0.1"
              className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none bg-white text-slate-900 placeholder:text-slate-400 text-lg"
              placeholder="例: 75"
              value={step2}
              onChange={(e) => setStep2(e.target.value)}
              onWheel={handleWheel}
            />
          </div>
        </div>
        
        <div className="bg-green-50 p-5 rounded-xl text-green-900 border border-green-200 mb-8">
          <p className="font-bold flex items-center gap-2">
            <User className="w-5 h-5" />
            あなたの身長: <span className="text-xl">{height} cm</span>
          </p>
          <p className="mt-2 text-sm opacity-80">※ この身長を用いて自動的にスコアを計算します。</p>
        </div>

        <button type="submit" className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-md">
          次へ進む
        </button>
      </form>
    </div>
  );
};

// --- Locomo 25 ---
interface Locomo25TestProps {
  onSave: (result: Locomo25Result) => void;
}

export const Locomo25Test: React.FC<Locomo25TestProps> = ({ onSave }) => {
  const [answers, setAnswers] = useState<number[]>(new Array(25).fill(-1));

  const handleSelect = (questionIndex: number, value: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = value;
    setAnswers(newAnswers);
  };

  const setAll = (value: number) => {
    setAnswers(new Array(25).fill(value));
  };

  const isComplete = answers.every(a => a !== -1);
  const answeredCount = answers.filter(a => a !== -1).length;

  const handleSubmit = () => {
    if (!isComplete) return;
    const totalScore = answers.reduce((a, b) => a + b, 0);
    onSave({ answers, totalScore });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-4">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <CheckSquare className="text-indigo-600 w-6 h-6" />
          </div>
          ロコモ25
        </h2>
        <p className="text-slate-600 leading-relaxed bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-4">
          この1ヶ月のあなたの身体の状態について、25の質問にお答えください。<br/>
          最も当てはまるものを1つ選んでください。
        </p>
        
        {/* 一括選択ボタン */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-3 items-center">
            <span className="text-sm font-bold text-slate-500">一括選択：</span>
            <button type="button" onClick={() => setAll(0)} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-100">全て「困難でない」</button>
            <button type="button" onClick={() => setAll(1)} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-100">全て「少し困難」</button>
            <button type="button" onClick={() => setAll(2)} className="px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded hover:bg-slate-100">全て「かなり困難」</button>
        </div>
      </div>

      <div className="space-y-12">
        {LOCOMO_25_QUESTIONS.map((q, idx) => (
          <div key={idx} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <p className="font-bold text-slate-800 mb-6 text-lg border-l-4 border-indigo-500 pl-4 py-1 bg-slate-50 rounded-r">
              {q}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {LOCOMO_25_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(idx, opt.value)}
                  className={`py-4 px-2 text-sm rounded-lg border-2 transition-all font-bold ${
                    answers[idx] === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-105 z-10'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:border-indigo-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 p-4 shadow-2xl z-50 print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="hidden sm:block">
            <span className="text-sm font-bold text-slate-500 block">回答状況</span>
            <span className={`text-2xl font-black ${isComplete ? 'text-indigo-600' : 'text-slate-400'}`}>
              {answeredCount} <span className="text-sm text-slate-400 font-normal">/ 25</span>
            </span>
          </div>
          
          {/* Mobile progress display */}
          <div className="sm:hidden text-sm font-bold text-slate-500">
             {answeredCount} / 25
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isComplete}
            className={`flex-1 max-w-md py-4 rounded-xl font-bold text-lg transition-all shadow-md ${
              isComplete
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-1'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {isComplete ? '判定結果を見る' : '全ての質問に答えてください'}
          </button>
        </div>
      </div>
    </div>
  );
};
