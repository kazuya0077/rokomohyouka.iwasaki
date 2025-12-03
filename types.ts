export type Gender = 'male' | 'female';

export interface UserProfile {
  name: string; // Added Name field
  age: number;
  gender: Gender;
  height: number; // cm
}

// Stand-up test result representation
// 0: Cannot do both legs 40cm
// 1: Both legs 40cm
// 2: Both legs 30cm
// 3: Both legs 20cm
// 4: Both legs 10cm
// 5: One leg 40cm
// 6: One leg 30cm
// 7: One leg 20cm
// 8: One leg 10cm
export type StandUpResultScore = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface TwoStepResult {
  step1: number; // cm
  step2: number; // cm
  score: number; // (step1+step2)/height
}

export interface Locomo25Result {
  answers: number[]; // Array of 0-4 values for 25 questions
  totalScore: number;
}

export interface TestData {
  profile: UserProfile | null;
  standUpScore: StandUpResultScore | null;
  twoStep: TwoStepResult | null;
  locomo25: Locomo25Result | null;
}

export type LocomoLevel = 0 | 1 | 2 | 3;

export interface AdviceData {
  level: LocomoLevel;
  exercise: {
    title: string;
    items: {
      name: string;
      goal: string;
      points: string[];
      imageUrl: string; // Changed from imagePage to imageUrl
    }[];
  };
  diet: {
    title: string;
    nutrients: string[];
    description: string;
    imageUrl: string; // Added imageUrl
  };
  summary: string;
}