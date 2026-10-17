export type RegistryCategory =
  | 'HONEYMOON'
  | 'HOME_DOWNPAYMENT'
  | 'BABY_NEST_EGG'
  | 'ANNIVERSARY'
  | 'INVESTMENT_VAULT'
  | 'CUSTOM'

export interface RegistryFund {
  id: string
  title: string
  category: RegistryCategory
  targetAmount: number
  currentAmount: number
  icon: string
  description: string
}

export interface RegistryGift {
  id: string
  fundId?: string
  donorName: string
  donorEmail: string
  amount: number
  message: string
  createdAt: string
  isAnonymous?: boolean
  giftCardDesign?: 'GOLD_ELEGANCE' | 'ROSE_ROMANCE' | 'MIDNIGHT_ROYAL' | 'EMERALD_HARMONY'
}

export interface CoupleRegistry {
  id: string
  slug: string
  partner1Name: string
  partner2Name: string
  weddingDate: string // YYYY-MM-DD
  weddingLocation: string
  greeting: string
  story: string
  coverPhoto: string
  avatarPhoto?: string
  targetTotal: number
  currentTotal: number
  funds: RegistryFund[]
  gifts: RegistryGift[]
  createdById?: string
  vaultApy: number // e.g. 6.8
}

export const SEED_REGISTRIES: CoupleRegistry[] = [
  {
    id: 'reg-marcus-elena',
    slug: 'marcus-and-elena',
    partner1Name: 'Marcus Vance',
    partner2Name: 'Elena Rostova',
    weddingDate: '2026-09-18',
    weddingLocation: 'Amalfi Coast, Italy & New York City',
    greeting: 'Welcome to our wedding registry! Your presence at our celebration is the greatest gift of all. If you would like to help us celebrate with a gift, we have created dedicated milestone funds to help us build our life and family together.',
    story: 'We met on a rainy autumn evening in SoHo while both reaching for the same photography book. Six years, countless coffee dates, and three cross-country road trips later, Marcus proposed at sunset overlooking Positano. We are tying the knot in September 2026 and planting roots for our future.',
    coverPhoto: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80',
    targetTotal: 25000,
    currentTotal: 17450,
    vaultApy: 6.8,
    funds: [
      {
        id: 'fund-honeymoon',
        title: 'Amalfi Coast & Swiss Alps Honeymoon',
        category: 'HONEYMOON',
        targetAmount: 7500,
        currentAmount: 6200,
        icon: 'Plane',
        description: 'Sunset dinners overlooking the Mediterranean, Vespa day rentals, and mountain train tickets.',
      },
      {
        id: 'fund-home',
        title: 'First Home Down Payment Vault',
        category: 'HOME_DOWNPAYMENT',
        targetAmount: 12500,
        currentAmount: 8750,
        icon: 'Home',
        description: 'Growing our 50/50 joint real estate down payment vault earning 6.8% APY to secure our first family townhouse.',
      },
      {
        id: 'fund-nest-egg',
        title: 'Little One’s Nursery & Nest Egg',
        category: 'BABY_NEST_EGG',
        targetAmount: 5000,
        currentAmount: 2500,
        icon: 'Baby',
        description: 'Starting our family savings fund early so our future children have a debt-free start.',
      },
    ],
    gifts: [
      {
        id: 'gift-1',
        fundId: 'fund-honeymoon',
        donorName: 'Aunt Claudia & Uncle Viktor',
        donorEmail: 'claudia.v@example.com',
        amount: 500,
        message: 'Wishing you both a lifetime of Mediterranean sunsets and eternal happiness! Have a romantic glass of limoncello on us!',
        createdAt: '2026-10-15T14:32:00Z',
        giftCardDesign: 'GOLD_ELEGANCE',
      },
      {
        id: 'gift-2',
        fundId: 'fund-home',
        donorName: 'David & Sophia Sterling',
        donorEmail: 'david@sterling.io',
        amount: 1000,
        message: 'May your new home be filled with laughter, wealth, and boundless love. So proud of you both!',
        createdAt: '2026-10-14T09:15:00Z',
        giftCardDesign: 'EMERALD_HARMONY',
      },
      {
        id: 'gift-3',
        fundId: 'fund-honeymoon',
        donorName: 'Chloe Bennett',
        donorEmail: 'chloe@bennett.com',
        amount: 250,
        message: 'To the most beautiful couple! Enjoy every single second of the Amalfi coast!',
        createdAt: '2026-10-12T18:40:00Z',
        giftCardDesign: 'ROSE_ROMANCE',
      },
      {
        id: 'gift-4',
        fundId: 'fund-nest-egg',
        donorName: 'Grandma Maria Rostova',
        donorEmail: 'maria.rostova@example.com',
        amount: 500,
        message: 'Blessings on your sacred covenant. May your marriage be fruitful, peaceful, and blessed with joyful children.',
        createdAt: '2026-10-10T11:20:00Z',
        giftCardDesign: 'GOLD_ELEGANCE',
      },
    ],
  },
  {
    id: 'reg-david-jordan',
    slug: 'david-and-jordan',
    partner1Name: 'David Sterling',
    partner2Name: 'Jordan Hayes',
    weddingDate: '2026-11-05',
    weddingLocation: 'Napa Valley, California',
    greeting: 'Thank you for being part of our story! Instead of a traditional gift registry, we invite you to contribute to our marriage milestones as we step into this sacred chapter together.',
    story: 'Together since 2020, we survived pandemic sourdough experiments, marathon training, and building our design studio. In Napa Valley under the olive trees, we are celebrating our love with those who mean the most to us.',
    coverPhoto: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=80',
    targetTotal: 30000,
    currentTotal: 21800,
    vaultApy: 6.8,
    funds: [
      {
        id: 'fund-napa-honeymoon',
        title: 'New Zealand & Fiji Adventure',
        category: 'HONEYMOON',
        targetAmount: 10000,
        currentAmount: 8400,
        icon: 'Plane',
        description: 'Hiking Queenstown fjords and relaxing in overwater bungalows.',
      },
      {
        id: 'fund-victorian-renovation',
        title: 'Victorian Home Restoration Fund',
        category: 'HOME_DOWNPAYMENT',
        targetAmount: 15000,
        currentAmount: 10500,
        icon: 'Home',
        description: 'Preserving historical hardwood and creating our solar-powered dream kitchen.',
      },
      {
        id: 'fund-adoption-nest',
        title: 'Adoption & Family Welcoming Fund',
        category: 'BABY_NEST_EGG',
        targetAmount: 5000,
        currentAmount: 2900,
        icon: 'HeartHandshake',
        description: 'Funding legal adoption fees and home study preparations.',
      },
    ],
    gifts: [
      {
        id: 'gift-dj-1',
        fundId: 'fund-adoption-nest',
        donorName: 'Sarah & Liam K.',
        donorEmail: 'sarah.k@example.com',
        amount: 400,
        message: 'You two will be the most incredible parents in the world. So much love!',
        createdAt: '2026-10-16T10:00:00Z',
        giftCardDesign: 'GOLD_ELEGANCE',
      },
      {
        id: 'gift-dj-2',
        fundId: 'fund-napa-honeymoon',
        donorName: 'Michael Chen',
        donorEmail: 'mchen@example.com',
        amount: 300,
        message: 'Drink exceptional wine in New Zealand! Congratulations to two fantastic souls.',
        createdAt: '2026-10-15T19:30:00Z',
        giftCardDesign: 'MIDNIGHT_ROYAL',
      },
    ],
  },
]
