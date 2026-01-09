
export interface NotificationSetting {
  soundUrl: string;
  vibrationPattern: number[];
  enabled: boolean;
}

export interface UserStats {
  steps: number;
  coins: number;
  calories: number;
  distance: number;
  level: number;
  stepGoal: number;
  activeMinutes: number;
  referralCode: string;
  referralsCount: number;
  hasUsedReferralCode?: boolean;
  isPaypalLinked?: boolean;
  paypalEmail?: string;
  isGoogleLinked?: boolean;
  googleEmail?: string;
  isFacebookLinked?: boolean;
  facebookName?: string;
  soundEnabled: boolean;
  reminderInterval: number; // in minutes
  remindersEnabled: boolean;
  autoPauseEnabled: boolean;
  autoPauseThreshold: number; // in seconds (for Pause)
  hardStopThreshold: number; // in minutes (for total Stop)
  adEarningsUSD: number; // الأرباح بالدولار من الإعلانات
  notifications: {
    goalAchieved: NotificationSetting;
    challengeAvailable: NotificationSetting;
    stepMilestone: NotificationSetting;
  };
}

export interface WalkingSession {
  id: string;
  startTime: number;
  endTime: number;
  steps: number;
  distance: number;
  calories: number;
}

export interface RedeemedReward {
  id: string;
  rewardId: string;
  name: string;
  price: number;
  date: number;
  image: string;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  currencyAmount?: string;
  method?: string;
  status: 'pending' | 'completed' | 'failed';
  date: number;
  type: 'withdrawal' | 'steps_bonus' | 'ad_reward' | 'reward_purchase' | 'coin_purchase' | 'referral_bonus' | 'ad_payout' | 'account_update';
  description: string;
}

export interface RewardItem {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'coupon' | 'crypto' | 'product' | 'limited';
  available: boolean;
  expiresAt?: number; // Timestamp for limited offers
}

export interface AdStatus {
  lastWatched: number;
  dailyLimit: number;
  watchedToday: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  type: 'steps' | 'distance' | 'streak';
  reward: number;
  status: 'available' | 'joined' | 'completed' | 'claimed';
  progress: number;
  isFavorite?: boolean;
}

export enum Page {
  Dashboard = 'dashboard',
  Ads = 'ads',
  Challenges = 'challenges',
  Store = 'store',
  Profile = 'profile',
  AI_Coach = 'ai_coach',
  RewardHistory = 'reward_history'
}
