export interface ArtistPerkTier {
  id: string
  name: string
  minInvestment: number
  targetCapacity?: number
  claimedCount: number
  projectedReturnRate: number // e.g. 0.115 for 11.5% APY
  royaltyShareText: string
  badge: string
  badgeColor: string
  perks: string[]
  recommended?: boolean
}

export interface CelebrityArtist {
  id: string
  slug: string
  name: string
  stageName: string
  title: string
  tagline: string
  bio: string
  detailedStory: string
  genre: string
  origin: string
  label: string
  verified: boolean
  isPrivate: boolean
  accessCode: string
  heroImage: string
  avatarImage: string
  bannerGradient: string
  stats: {
    monthlyListeners: string
    youtubeViews: string
    instagramFollowers: string
    tiktokFollowers: string
    tourGrossToDate: string
    catalogStreams: string
  }
  topTracks: {
    title: string
    streams: string
    year: string
    duration: string
  }[]
  tourDates: {
    venue: string
    city: string
    date: string
    status: string
  }[]
  offering: {
    title: string
    roundType: string
    targetAmount: number
    fundedAmount: number
    minInvestment: number
    termMonths: number
    projectedAPY: number
    distributionType: string
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
    useOfFunds: string[]
    fiduciaryProtection: string
  }
  tiers: ArtistPerkTier[]
  managementContact: {
    managerName: string
    agency: string
    bookingEmail: string
    pressEmail: string
    fiduciaryCounsel: string
    headquarters: string
  }
}

export interface FriendsSyndicateMember {
  name: string
  email: string
  amount: number
  contributedAt: string
  isHost: boolean
}

export interface FriendsSyndicate {
  id: string
  name: string
  creatorName: string
  creatorEmail: string
  targetAmount: number
  totalContributed: number
  currency: string
  targetTierId?: string
  targetOpportunitySlug?: string
  members: FriendsSyndicateMember[]
  inviteCode: string
  createdAt: string
}

export const CELEBRITY_ARTISTS: CelebrityArtist[] = [
  {
    id: 'art-davido',
    slug: 'davido-timeless-tour',
    name: 'David Adeleke',
    stageName: 'Davido',
    title: 'Grammy-Nominated Global Icon & DMW Founder',
    tagline: 'Timeless World Arena Tour & Masters Royalty Syndicate',
    bio: 'Multi-platinum recording superstar, 3x Grammy-nominee, and global arena-selling performer. Through Union Invest, Davido is opening an unlisted, exclusive private syndicate offering verified fans equity-aligned streaming master royalties and global arena tour revenues.',
    detailedStory:
      'Following sold-out performances at State Farm Arena Atlanta, Madison Square Garden New York, and The O2 Arena London, the Timeless Syndicate establishes an unprecedented financial bridge between an international music titan and his most dedicated supporters. Investors participate in contractual streaming revenue waterfalls and live tour merchandising.',
    genre: 'Afrobeats · Global Pop · Highlife Fusion',
    origin: 'Lagos, Nigeria & Atlanta, GA',
    label: 'DMW (Davido Music Worldwide) / Columbia Records',
    verified: true,
    isPrivate: true,
    accessCode: 'TIMELESS2026',
    heroImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    bannerGradient: 'from-[#0F1C3F] via-[#241738] to-[#1a0e1c]',
    stats: {
      monthlyListeners: '14.8M+',
      youtubeViews: '1.9 Billion+',
      instagramFollowers: '30.4M',
      tiktokFollowers: '12.1M',
      tourGrossToDate: '$48.5M+',
      catalogStreams: '4.2 Billion+',
    },
    topTracks: [
      { title: 'Unavailable (feat. Musa Keys)', streams: '210M+', year: '2023', duration: '2:50' },
      { title: 'Feel', streams: '165M+', year: '2023', duration: '2:55' },
      { title: 'Fall', streams: '380M+', year: '2017', duration: '4:00' },
      { title: 'If', streams: '310M+', year: '2017', duration: '3:58' },
    ],
    tourDates: [
      { venue: 'The O2 Arena', city: 'London, UK', date: 'Dec 12, 2026', status: 'Sold Out' },
      { venue: 'Accor Arena', city: 'Paris, France', date: 'Dec 18, 2026', status: 'Few Seats' },
      { venue: 'Madison Square Garden', city: 'New York, USA', date: 'Jan 22, 2027', status: 'Reserved' },
      { venue: 'Eko Convention Centre', city: 'Lagos, Nigeria', date: 'Jan 30, 2027', status: 'Private Access' },
    ],
    offering: {
      title: 'Timeless World Tour & Masters Royalty Syndicate',
      roundType: 'Private Fanbase Equity & Tour Revenue Share',
      targetAmount: 2000000,
      fundedAmount: 1420000,
      minInvestment: 250,
      termMonths: 24,
      projectedAPY: 0.118, // 11.8% APY
      distributionType: 'QUARTERLY_ROYALTIES',
      riskLevel: 'LOW',
      useOfFunds: [
        'Global Arena Production, Lighting & Audio Engineering',
        'Physical Vinyl & Limited Edition Boxset Manufacturing',
        'Streaming Masters Marketing & International Sync Licensing',
        'Direct Fan Return Escrow Reserve (Zurich Custody)',
      ],
      fiduciaryProtection:
        'All syndicate capital is held in bankruptcy-remote Zurich fiduciary custody. Tour ticketing revenues and streaming sync royalties flow directly to an automated distribution waterfall managed by Union Invest Fiduciary Trustees.',
    },
    tiers: [
      {
        id: 'tier-patron',
        name: 'Fanbase Patron',
        minInvestment: 250,
        claimedCount: 420,
        projectedReturnRate: 0.105,
        royaltyShareText: 'Pro-rata share of catalog streaming royalties',
        badge: 'Official Supporter',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        perks: [
          'Pro-rata quarterly royalty distributions',
          'Digital Golden Patron Certificate with unique serial number',
          'Name listed on official Timeless World Tour digital credits',
          'Early-bird concert ticket pre-sale access',
        ],
      },
      {
        id: 'tier-vip',
        name: 'Backstage VIP Circle',
        minInvestment: 1000,
        claimedCount: 184,
        projectedReturnRate: 0.118,
        royaltyShareText: 'Pro-rata streaming royalties + 2% tour merchandise gross',
        badge: 'VIP Access Pass',
        badgeColor: 'bg-[#C9A84C]/20 text-[#0F1C3F] border-[#C9A84C]',
        recommended: true,
        perks: [
          '2x VIP Golden Circle World Tour Concert Tickets (Any City)',
          'Exclusive Soundcheck & Backstage Meet-and-Greet pass',
          'Limited 24K Gold-Embossed Signed Tour Vinyl Edition',
          'Quarterly executive earnings conference call with management',
        ],
      },
      {
        id: 'tier-executive',
        name: 'Executive Co-Producer',
        minInvestment: 5000,
        claimedCount: 48,
        projectedReturnRate: 0.126,
        royaltyShareText: 'Pro-rata streaming + tour gross + sync licensing royalties',
        badge: 'Executive Producer',
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
        perks: [
          'Official Executive Co-Producer credit on next single release',
          'All-access backstage laminate for two tour stops worldwide',
          'Private pre-listening session with Davido and production team',
          'Priority liquidity and quarterly direct USD dividend distributions',
        ],
      },
      {
        id: 'tier-sovereign',
        name: 'Sovereign Circle Partner',
        minInvestment: 25000,
        claimedCount: 12,
        projectedReturnRate: 0.142,
        royaltyShareText: 'Full institutional catalog master rights & tour equity',
        badge: 'Sovereign Partner',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        perks: [
          'Private intimate dinner with Davido & executive management team',
          'Lifetime VIP Guest Pass to all future headlining concerts',
          'Direct revenue share contract recorded on Swiss fiduciary register',
          'Statutory 50/50 survivorship rights for joint spouses or named heirs',
        ],
      },
    ],
    managementContact: {
      managerName: 'Asa Asika / DMW Executive Management',
      agency: 'Davido Music Worldwide / Sony Music Entertainment',
      bookingEmail: 'management@davido-syndicate.unioninvest.com',
      pressEmail: 'press@davido-syndicate.unioninvest.com',
      fiduciaryCounsel: 'Zurich Fiduciary Trustees & London Entertainment Counsel',
      headquarters: 'Lagos, Nigeria · London, UK · Atlanta, GA',
    },
  },
  {
    id: 'art-burna',
    slug: 'burna-boy-spaceships',
    name: 'Damini Ogulu',
    stageName: 'Burna Boy',
    title: 'Grammy Award Winner & African Giant',
    tagline: 'Spaceship International Tour & Catalog Royalty Syndicate',
    bio: 'Grammy Award-winning visionary, the first African artist to sell out London Stadium (80,000 capacity) and Citi Field New York. The Spaceship Syndicate invites private patrons and friends to co-invest in his groundbreaking international touring productions.',
    detailedStory:
      'With global anthems like "Last Last", "Ye", and "City Boys", Burna Boy commands global arena stages. This exclusive link grants select investors direct participation in high-margin tour ticketing and global sync deals.',
    genre: 'Afro-Fusion · Dancehall · Reggae · Global Pop',
    origin: 'Port Harcourt, Nigeria & London, UK',
    label: 'Spaceship Entertainment / Atlantic Records',
    verified: true,
    isPrivate: true,
    accessCode: 'SPACESHIP2026',
    heroImage: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80',
    avatarImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    bannerGradient: 'from-[#0F1C3F] via-[#10243d] to-[#0a1829]',
    stats: {
      monthlyListeners: '18.4M+',
      youtubeViews: '2.4 Billion+',
      instagramFollowers: '18.2M',
      tiktokFollowers: '9.6M',
      tourGrossToDate: '$62.0M+',
      catalogStreams: '5.8 Billion+',
    },
    topTracks: [
      { title: 'Last Last', streams: '420M+', year: '2022', duration: '2:52' },
      { title: 'City Boys', streams: '280M+', year: '2023', duration: '2:33' },
      { title: 'Ye', streams: '490M+', year: '2018', duration: '3:51' },
      { title: 'On The Low', streams: '360M+', year: '2018', duration: '3:05' },
    ],
    tourDates: [
      { venue: 'London Stadium', city: 'London, UK', date: 'Jul 15, 2026', status: 'Sold Out' },
      { venue: 'Johan Cruyff Arena', city: 'Amsterdam, Netherlands', date: 'Jul 22, 2026', status: 'Few Seats' },
      { venue: 'Citi Field', city: 'New York, USA', date: 'Aug 08, 2026', status: 'Reserved' },
    ],
    offering: {
      title: 'Spaceship International Tour & Catalog Syndicate',
      roundType: 'Private Tour Equity & Sync Licensing Syndicate',
      targetAmount: 3000000,
      fundedAmount: 2150000,
      minInvestment: 500,
      termMonths: 24,
      projectedAPY: 0.124,
      distributionType: 'QUARTERLY_ROYALTIES',
      riskLevel: 'LOW',
      useOfFunds: [
        'Stadium Scale Production & Pyrotechnic Engineering',
        'Global Live Album Audio Recording & Spatial Mix Distribution',
        'Global Streaming Sync & Brand Partnership Escrow',
      ],
      fiduciaryProtection:
        'Secured against contractual global live promoter advances and Atlantic Records sync royalties.',
    },
    tiers: [
      {
        id: 'burna-tier-patron',
        name: 'Spaceship Patron',
        minInvestment: 500,
        claimedCount: 310,
        projectedReturnRate: 0.112,
        royaltyShareText: 'Pro-rata streaming & catalog return share',
        badge: 'Certified Patron',
        badgeColor: 'bg-teal-100 text-teal-900 border-teal-200',
        perks: [
          'Quarterly dividend payouts in USD',
          'Digital certificate of participation with blockchain hash',
          'Early pre-sale link for all stadium tour dates',
        ],
      },
      {
        id: 'burna-tier-vip',
        name: 'African Giant VIP Circle',
        minInvestment: 2500,
        claimedCount: 92,
        projectedReturnRate: 0.124,
        royaltyShareText: 'Streaming royalties + 2.5% Stadium Tour Merch Share',
        badge: 'VIP Stadium Circle',
        badgeColor: 'bg-[#C9A84C]/20 text-[#0F1C3F] border-[#C9A84C]',
        recommended: true,
        perks: [
          '2x Golden Circle VIP Tickets at London Stadium or Citi Field',
          'Limited Edition Spaceship Vinyl signed by Burna Boy',
          'VIP Hospitality Lounge Access before showtime',
        ],
      },
      {
        id: 'burna-tier-sovereign',
        name: 'Spaceship Sovereign Syndicate',
        minInvestment: 15000,
        claimedCount: 16,
        projectedReturnRate: 0.138,
        royaltyShareText: 'Direct gross touring revenue & masters sync participation',
        badge: 'Sovereign Syndicate',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        perks: [
          'Direct dinner meeting with Burna Boy and Spaceship management',
          'All-access backstage laminates for entire European/US tour leg',
          'Quarterly statutory audited distributions to your bank account',
        ],
      },
    ],
    managementContact: {
      managerName: 'Bose Ogulu (Mama Burna) / Spaceship Collective',
      agency: 'Spaceship Entertainment / United Talent Agency',
      bookingEmail: 'management@burnaboy-syndicate.unioninvest.com',
      pressEmail: 'press@burnaboy-syndicate.unioninvest.com',
      fiduciaryCounsel: 'London & Swiss Fiduciary Legal Council',
      headquarters: 'Lagos · London · Los Angeles',
    },
  },
]
