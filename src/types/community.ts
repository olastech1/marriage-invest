export type CommunityCategory =
  | 'LGBTQ_YOUTH'
  | 'MARRIAGE_EQUALITY'
  | 'INCLUSIVE_FAMILY'
  | 'TRANS_HEALTH'
  | 'ELDER_CARE'
  | 'GLOBAL_REFUGEE'

export interface ImpactMetric {
  label: string
  value: string
  iconName: string
}

export interface DonorStory {
  quote: string
  author: string
  role: string
  avatar?: string
}

export interface CommunityCause {
  id: string
  slug: string
  title: string
  category: CommunityCategory
  categoryLabel: string
  tagline: string
  description: string
  longDescription: string
  targetAmount: number
  raisedAmount: number
  donorsCount: number
  taxDeductible: boolean
  ein: string
  partnerOrg: string
  partnerUrl?: string
  impactMetrics: ImpactMetric[]
  stories: DonorStory[]
  badge: string
  accentColor: string // tailwind or hex
  urgent?: boolean
}

export interface CommunityDonationInput {
  causeId: string
  amount: number
  donorName: string
  donorEmail: string
  isAnonymous?: boolean
  dedicationType?: 'NONE' | 'MARRIAGE_HONOR' | 'IN_MEMORY' | 'COMMUNITY_PRIDE'
  dedicationText?: string
  isRecurring?: boolean
  recurringFrequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL'
  paymentMethod?: 'BALANCE' | 'CARD'
}

export interface DonationReceipt {
  receiptNumber: string
  causeTitle: string
  partnerOrg: string
  ein: string
  donorName: string
  donorEmail: string
  amount: number
  isAnonymous: boolean
  dedicationText?: string
  date: string
  taxDeductible: boolean
  digitalSignature: string
}

export const COMMUNITY_CAUSES: CommunityCause[] = [
  {
    id: 'cause-youth-shelter',
    slug: 'lgbtq-youth-shelters',
    title: 'The Stonewall Legacy · LGBTQ+ Youth Emergency Housing & Crisis Counseling',
    category: 'LGBTQ_YOUTH',
    categoryLabel: 'Youth Shelter & Crisis',
    tagline: 'Safe beds, emergency sanctuary, and suicide prevention hotline for displaced queer youths.',
    description:
      'Over 28% of LGBTQ+ youth experience homelessness due to family rejection. This fund directly secures emergency housing vouchers, transitional living shelter beds, and 24/7 licensed crisis interventions.',
    longDescription:
      'Every night, thousands of LGBTQ+ teenagers find themselves on the streets after coming out to hostile environments. Our partnership with accredited municipal shelter alliances provides zero-barrier emergency beds, nutritious hot meals, winter clothing kits, and specialized trauma-informed psychological therapy. 100% of donations are deployed directly into immediate bedding subsidies and licensed suicide-prevention counselor salaries.',
    targetAmount: 250000,
    raisedAmount: 198450,
    donorsCount: 1420,
    taxDeductible: true,
    ein: 'EIN-84-3928174 (501c3 Certified)',
    partnerOrg: 'Allied Youth Housing Alliance & Crisis Lifeline',
    partnerUrl: 'https://alliedyouthhousing.org',
    badge: 'High Urgent Need',
    accentColor: '#3B82F6',
    urgent: true,
    impactMetrics: [
      { label: 'Emergency Nights Provided', value: '2,840+', iconName: 'Home' },
      { label: 'Hot Meals Distributed', value: '9,120', iconName: 'Utensils' },
      { label: 'Crisis Calls Answered', value: '4,500+', iconName: 'PhoneCall' },
    ],
    stories: [
      {
        quote:
          'When my parents cast me out at 17, this sanctuary gave me a secure bed and helped me finish high school. Today I am graduating college.',
        author: 'Jordan M.',
        role: 'Shelter Alum & Community Ambassador',
      },
    ],
  },
  {
    id: 'cause-marriage-defense',
    slug: 'marriage-equality-defense',
    title: 'Equal Love Sanctuary · Matrimonial Legal Defense & Civil Rights Trust',
    category: 'MARRIAGE_EQUALITY',
    categoryLabel: 'Marriage Defense & Civil Rights',
    tagline: 'Defending same-sex marriage validity, parental rights, and anti-discrimination protections.',
    description:
      'Pro-bono legal defense funds safeguarding marriage certificates, joint spousal estates, hospital visitation rights, and parental custody for married LGBTQ+ couples facing discriminatory state challenges.',
    longDescription:
      'Legal equality is an ongoing vigilance. As statutes and appellate challenges threaten spousal property transfers, interstate marriage recognition, and parental guardianship, our legal defense trust funds top-tier appellate civil rights attorneys. We ensure no couple is denied the rights, tax recognitions, or dignity codified in their sacred marriage covenant.',
    targetAmount: 300000,
    raisedAmount: 256800,
    donorsCount: 2040,
    taxDeductible: true,
    ein: 'EIN-92-4819205 (501c3 Certified)',
    partnerOrg: 'Freedom to Marry Legal Defense Trust',
    partnerUrl: 'https://freedomtomarrytrust.org',
    badge: 'National Impact',
    accentColor: '#C9A84C',
    impactMetrics: [
      { label: 'Cases Defended Pro-Bono', value: '480+', iconName: 'Scale' },
      { label: 'Legal Consultations', value: '2,150', iconName: 'ShieldCheck' },
      { label: 'States Protected', value: '50/50', iconName: 'MapPin' },
    ],
    stories: [
      {
        quote:
          'When an out-of-state hospital initially refused spousal access during my emergency surgery, this legal team intervened within 30 minutes.',
        author: 'Elena & Sophia',
        role: 'Married Investors since 2023',
      },
    ],
  },
  {
    id: 'cause-family-grants',
    slug: 'inclusive-family-adoption-grants',
    title: 'Rainbow Nest · Inclusive Family Building, IVF & Adoption Grants',
    category: 'INCLUSIVE_FAMILY',
    categoryLabel: 'Family Building & Adoption',
    tagline: 'Direct financial grants for gay and lesbian couples pursuing reciprocal IVF, surrogacy, or foster adoption.',
    description:
      'Fertility treatments and international adoptions frequently exceed $40,000–$90,000, presenting insurmountable barriers for loving couples. We provide $5,000 to $15,000 non-repayable grants to help aspiring parents build families.',
    longDescription:
      'Every loving couple deserves the opportunity to welcome children into a stable, nurturing home. Due to systemic insurance gaps and excessive adoption administrative fees, queer couples disproportionately struggle with initial capital. Rainbow Nest pairs prospective parents with grants that cover attorney adoption filings, reciprocal IVF rounds, and home-study qualification expenses.',
    targetAmount: 200000,
    raisedAmount: 147500,
    donorsCount: 1120,
    taxDeductible: true,
    ein: 'EIN-47-5928103 (501c3 Certified)',
    partnerOrg: 'Family Equality Collaborative Foundation',
    partnerUrl: 'https://familyequalitycollab.org',
    badge: 'Life Changing',
    accentColor: '#10B981',
    impactMetrics: [
      { label: 'Family Grants Awarded', value: '72 Couples', iconName: 'Baby' },
      { label: 'Babies Welcomed', value: '64 Newborns', iconName: 'Heart' },
      { label: 'Avg Grant Size', value: '$8,500', iconName: 'Sparkles' },
    ],
    stories: [
      {
        quote:
          'After 4 years of heartbreak and depleted savings, the grant made our final IVF transfer possible. Our twin girls just turned one.',
        author: 'Marcus & David',
        role: 'Union Verify Couple',
      },
    ],
  },
  {
    id: 'cause-trans-healthcare',
    slug: 'transgender-healthcare-mutual-aid',
    title: 'Trans Vitality · Urgent Healthcare, Affirmation & Emergency Relief Fund',
    category: 'TRANS_HEALTH',
    categoryLabel: 'Healthcare & Mutual Aid',
    tagline: 'Life-saving medical micro-grants, emergency relocation aid, and affirming mental wellness.',
    description:
      'Providing direct micro-grants for essential gender-affirming hormone replacement therapy (HRT), preventive medical exams, and emergency travel aid for individuals fleeing anti-trans healthcare restrictions.',
    longDescription:
      'With numerous jurisdictions enacting criminalizing bans on vital healthcare, transgender adults and youths face unprecedented disruption. The Trans Vitality Fund operates with lightning-fast vetting to disburse direct pharmacy vouchers, travel assistance to licensed clinics in sanctuary states, and continuous telehealth mental wellness sessions.',
    targetAmount: 175000,
    raisedAmount: 139200,
    donorsCount: 1290,
    taxDeductible: true,
    ein: 'EIN-61-9038291 (501c3 Certified)',
    partnerOrg: 'National Transgender Mutual Aid Network',
    partnerUrl: 'https://transmutualaid.org',
    badge: 'Immediate Relief',
    accentColor: '#8B5CF6',
    urgent: true,
    impactMetrics: [
      { label: 'Prescriptions Funded', value: '3,400+', iconName: 'Pill' },
      { label: 'Safe Relocation Grants', value: '210', iconName: 'Navigation' },
      { label: 'Telehealth Hours', value: '1,800', iconName: 'Stethoscope' },
    ],
    stories: [
      {
        quote:
          'When state legislation suddenly outlawed my pharmacy care, an emergency grant kept my care continuous while I safely relocated.',
        author: 'Kai R.',
        role: 'Community Recipient',
      },
    ],
  },
  {
    id: 'cause-elder-pride',
    slug: 'elder-lgbtq-pioneers',
    title: 'Silver Rainbow · Elderly LGBTQ+ Pioneer Dignity & Companion Care',
    category: 'ELDER_CARE',
    categoryLabel: 'Senior Pioneer Care',
    tagline: 'Assisted living subsidies, meal deliveries, and companion care for elder LGBTQ+ trail-blazers.',
    description:
      'Honoring the pioneering generation who fought for our freedom. LGBTQ+ seniors are twice as likely to live alone and face isolation. We provide daily meals, in-home aid, and affirmative senior living.',
    longDescription:
      'The brave elders who marched at Stonewall and survived the HIV epidemic are now in their 70s, 80s, and 90s. Many have no surviving family or biological descendants to advocate for their care. Silver Rainbow partners with elder healthcare providers to provide home visitations, warm meals, and subsidized affirmative nursing home care where they never have to retreat back into the closet.',
    targetAmount: 150000,
    raisedAmount: 112300,
    donorsCount: 880,
    taxDeductible: true,
    ein: 'EIN-13-8472910 (501c3 Certified)',
    partnerOrg: 'SAGE Elder Pride Alliance',
    partnerUrl: 'https://sageelderpride.org',
    badge: 'Honoring Pioneers',
    accentColor: '#EC4899',
    impactMetrics: [
      { label: 'Meals Delivered', value: '14,200', iconName: 'Soup' },
      { label: 'Elder Companionship Visits', value: '4,100 hrs', iconName: 'Users' },
      { label: 'Assisted Living Subsidies', value: '88 Seniors', iconName: 'HeartHandshake' },
    ],
    stories: [
      {
        quote:
          'Having young volunteers from our community come by each week makes me feel that everything we fought for 50 years ago was worth it.',
        author: 'Harold B., 79',
        role: 'Stonewall Veteran',
      },
    ],
  },
  {
    id: 'cause-global-refugees',
    slug: 'global-lgbtq-refugee-sanctuary',
    title: 'Sanctuary Global · International LGBTQ+ Human Rights & Asylum Rescue',
    category: 'GLOBAL_REFUGEE',
    categoryLabel: 'Refugee Asylum & Rescue',
    tagline: 'Emergency extraction, legal asylum passage, and shelter for queer people facing death penalties abroad.',
    description:
      'Over 60 countries still criminalize same-sex love, with several imposing death penalties. This fund coordinates international emergency transit, safe house lodging, and humanitarian asylum legal filings.',
    longDescription:
      'Around the world, state-sponsored violence and draconian criminal codes place LGBTQ+ people in mortal danger every day. Working closely with vetted human rights corridors, Sanctuary Global provides plane tickets, temporary clandestine safe houses, and international human rights asylum representation to rescue persecuted individuals and place them safely into free democratic nations.',
    targetAmount: 350000,
    raisedAmount: 312000,
    donorsCount: 2480,
    taxDeductible: true,
    ein: 'EIN-98-3729104 (501c3 Certified)',
    partnerOrg: 'Rainbow Railroad Global Relief Foundation',
    partnerUrl: 'https://rainbowrailroadglobal.org',
    badge: 'International Sanctuary',
    accentColor: '#F59E0B',
    impactMetrics: [
      { label: 'Asylum Passages Secured', value: '94 Lives', iconName: 'Plane' },
      { label: 'Safe Houses Maintained', value: '18 Locations', iconName: 'Shield' },
      { label: 'Asylum Approval Rate', value: '99.2%', iconName: 'Award' },
    ],
    stories: [
      {
        quote:
          'In my home country, discovery meant life in prison. Today, my husband and I are legally married and living safely thanks to this rescue fund.',
        author: 'Kofi & Tariq',
        role: 'Resettled Asylum Recipients',
      },
    ],
  },
]
