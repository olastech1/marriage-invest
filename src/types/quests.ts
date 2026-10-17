export interface DailyQuest {
  id: string
  dayIndex: number
  category: 'VISION' | 'BUDGET' | 'DREAM' | 'INVESTMENT' | 'INTIMACY'
  categoryLabel: string
  title: string
  question: string
  hint: string
  quickOptions?: string[]
}

export interface QuestResponse {
  questId: string
  partner1Response?: string
  partner1AnsweredAt?: string
  partner2Response?: string
  partner2AnsweredAt?: string
  bothRevealed: boolean
}

export interface CoupleStreakData {
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string
  totalQuestionsAnswered: number
  yieldBoostPercent: number // e.g. 0.25 for +0.25% APY
  nextRewardDays: number
}

export const DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'quest-day-1',
    dayIndex: 1,
    category: 'VISION',
    categoryLabel: 'Shared Horizon',
    title: 'The 3-Year Milestone',
    question: 'If our joint marriage vault hit $100,000 in three years, what is the very first dream purchase or investment you would want us to make together?',
    hint: 'Think about experiences, home ownership, or family security.',
    quickOptions: [
      'Put 100% into a home down payment',
      'Take a 3-week luxury world trip',
      'Reinvest into high-yield passive index funds',
      'Start our own family creative business',
    ],
  },
  {
    id: 'quest-day-2',
    dayIndex: 2,
    category: 'BUDGET',
    categoryLabel: 'Budget Harmony',
    title: 'The Guilt-Free Splurge',
    question: 'What is one recurring expense that brings you so much genuine joy that you never want us to cut it from our family budget?',
    hint: 'It could be weekly date-night dining, specialty coffee, gym memberships, or anniversary flowers.',
    quickOptions: [
      'Weekly fine dining date nights',
      'Travel & spontaneous weekend getaways',
      'Wellness, spas & fitness coaching',
      'Home decor & cozy living improvements',
    ],
  },
  {
    id: 'quest-day-3',
    dayIndex: 3,
    category: 'INVESTMENT',
    categoryLabel: 'Risk & Wealth',
    title: 'The Risk Appetite Check',
    question: 'How would you describe your personal financial risk appetite right now, and how should it influence our joint portfolio strategy?',
    hint: 'Steady conservative growth vs. opportunistic high-yield ventures.',
    quickOptions: [
      'Conservative: Protect capital with safe 6.8% vaults',
      'Balanced: 70% safe bonds / 30% growth syndicates',
      'Growth: High conviction in celebrity tour & fanbase syndicates',
      'Dynamic: Let my spouse lead investment selections',
    ],
  },
  {
    id: 'quest-day-4',
    dayIndex: 4,
    category: 'INTIMACY',
    categoryLabel: 'Love & Gratitude',
    title: 'The Generosity Echo',
    question: 'What is something financially generous or supportive your partner did for you that made you feel deeply cherished?',
    hint: 'A thoughtful surprise gift, paying off an unexpected bill, or planning an anniversary without stress.',
  },
  {
    id: 'quest-day-5',
    dayIndex: 5,
    category: 'DREAM',
    categoryLabel: 'Retirement & Legacy',
    title: 'Our Golden Sunset',
    question: 'When we retire together, what does our ideal Tuesday morning look like?',
    hint: 'Waking up by the ocean, tending an orchard, coffee on a European balcony, or playing with grandchildren?',
    quickOptions: [
      'Coffee on an Italian coastal balcony overlooking the sea',
      'Morning walk in a quiet countryside estate',
      'Active urban penthouse living in a cultural capital',
      'Cruising or traveling to a new country every month',
    ],
  },
  {
    id: 'quest-day-6',
    dayIndex: 6,
    category: 'BUDGET',
    categoryLabel: 'Financial Transparency',
    title: 'The Surprise Budget',
    question: 'Should we have a monthly "no-questions-asked" fun money allowance for each partner? If yes, what amount feels right?',
    hint: 'Having personal discretionary spending prevents money resentment.',
    quickOptions: [
      '$100 – $250 each per month',
      '$250 – $500 each per month',
      '$500 – $1,000 each per month',
      'No cap, as long as savings targets are hit first',
    ],
  },
  {
    id: 'quest-day-7',
    dayIndex: 7,
    category: 'VISION',
    categoryLabel: 'Spousal Synergy',
    title: 'The 7-Day Wealth Covenant',
    question: 'What is one promise you want to make to our joint marriage vault for the upcoming month?',
    hint: 'Automating monthly transfers, reviewing transactions without judgment, or celebrating milestones.',
    quickOptions: [
      'Automate an extra $200 deposit every payday',
      'Do a 15-minute monthly money date with champagne',
      'Zero impulse buying above $100 without a 24h pause',
      'Share compliments every time our balance grows',
    ],
  },
]
