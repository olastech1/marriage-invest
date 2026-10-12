import { PrismaClient, UserRole, OpportunityStatus, RiskLevel, DistributionType, DocumentType } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean existing data in dev
  if (process.env.NODE_ENV !== 'production') {
    await prisma.auditLog.deleteMany()
    await prisma.notification.deleteMany()
    await prisma.documentAcknowledgment.deleteMany()
    await prisma.distribution.deleteMany()
    await prisma.withdrawalRequest.deleteMany()
    await prisma.transaction.deleteMany()
    await prisma.investment.deleteMany()
    await prisma.document.deleteMany()
    await prisma.investmentOpportunity.deleteMany()
    await prisma.loginActivity.deleteMany()
    await prisma.user.deleteMany()
  }

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123!', 12)
  const admin = await prisma.user.create({
    data: {
      email: 'admin@unioninvest.com',
      name: 'Platform Administrator',
      passwordHash: adminPassword,
      emailVerified: new Date(),
      role: UserRole.ADMIN,
      identityVerified: true,
      identityVerifiedAt: new Date(),
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Finance user
  const financePassword = await bcrypt.hash('Finance@123!', 12)
  await prisma.user.create({
    data: {
      email: 'finance@unioninvest.com',
      name: 'Finance Officer',
      passwordHash: financePassword,
      emailVerified: new Date(),
      role: UserRole.FINANCE,
    },
  })

  // Sample investor
  const investorPassword = await bcrypt.hash('Investor@123!', 12)
  const investor = await prisma.user.create({
    data: {
      email: 'investor@example.com',
      name: 'Jane Doe',
      phone: '+1-555-0100',
      passwordHash: investorPassword,
      emailVerified: new Date(),
      role: UserRole.INVESTOR,
      identityVerified: true,
      identityVerifiedAt: new Date(),
    },
  })
  console.log('✅ Sample investor created:', investor.email)

  // Investment opportunities
  const opportunity1 = await prisma.investmentOpportunity.create({
    data: {
      title: 'Union Growth Fund — Series A',
      slug: 'union-growth-fund-series-a',
      description:
        'The Union Growth Fund Series A is a structured investment vehicle designed for married couples seeking to build long-term wealth together. Funds are deployed into a diversified portfolio of income-generating assets with quarterly distributions. This is a projected return — actual results may vary and are not guaranteed.',
      shortDescription: 'A diversified growth fund with quarterly distributions for married investors.',
      minAmount: 1000,
      maxAmount: 50000,
      targetAmount: 500000,
      fundedAmount: 320000,
      termMonths: 24,
      annualReturnRate: 0.0850,
      distributionType: DistributionType.QUARTERLY,
      status: OpportunityStatus.ACTIVE,
      openDate: new Date('2024-01-01'),
      closeDate: new Date('2024-12-31'),
      maturityDate: new Date('2026-12-31'),
      riskLevel: RiskLevel.MEDIUM,
    },
  })

  const opportunity2 = await prisma.investmentOpportunity.create({
    data: {
      title: 'Union Stable Income Bond',
      slug: 'union-stable-income-bond',
      description:
        'The Union Stable Income Bond provides fixed monthly income distributions to investors. Capital is allocated to secured lending arrangements with contractually defined repayment schedules. Projected annual income rate of 6.5% is not guaranteed and depends on underlying borrower performance.',
      shortDescription: 'Monthly income bond with secured lending backing.',
      minAmount: 2500,
      maxAmount: 100000,
      targetAmount: 750000,
      fundedAmount: 610000,
      termMonths: 36,
      annualReturnRate: 0.0650,
      distributionType: DistributionType.MONTHLY,
      status: OpportunityStatus.ACTIVE,
      openDate: new Date('2024-03-01'),
      closeDate: new Date('2025-03-01'),
      maturityDate: new Date('2027-03-01'),
      riskLevel: RiskLevel.LOW,
    },
  })

  const opportunity3 = await prisma.investmentOpportunity.create({
    data: {
      title: 'Union Premium Real Assets Fund',
      slug: 'union-premium-real-assets-fund',
      description:
        'The Union Premium Real Assets Fund targets higher projected returns through investment in real asset-backed opportunities. This fund carries a higher risk profile and is suitable only for investors who understand and can accept the possibility of losing some or all of their principal.',
      shortDescription: 'High-yield real asset fund with annual distributions.',
      minAmount: 5000,
      maxAmount: null,
      targetAmount: 1000000,
      fundedAmount: 125000,
      termMonths: 48,
      annualReturnRate: 0.1200,
      distributionType: DistributionType.ANNUAL,
      status: OpportunityStatus.ACTIVE,
      openDate: new Date('2024-06-01'),
      closeDate: new Date('2025-06-01'),
      maturityDate: new Date('2028-06-01'),
      riskLevel: RiskLevel.HIGH,
    },
  })
  console.log('✅ Investment opportunities created')

  // Offer documents
  const doc1 = await prisma.document.create({
    data: {
      name: 'Union Growth Fund Series A — Offer Document',
      description: 'Official offer document for the Union Growth Fund Series A investment opportunity.',
      type: DocumentType.OFFER_DOCUMENT,
      version: '1.0',
      fileUrl: '/documents/sample-offer-document.pdf',
      fileSize: 524288,
      mimeType: 'application/pdf',
      opportunityId: opportunity1.id,
      isPublic: true,
    },
  })

  const doc2 = await prisma.document.create({
    data: {
      name: 'Union Stable Income Bond — Offer Document',
      description: 'Official offer document for the Union Stable Income Bond.',
      type: DocumentType.OFFER_DOCUMENT,
      version: '1.2',
      fileUrl: '/documents/sample-bond-offer.pdf',
      fileSize: 638976,
      mimeType: 'application/pdf',
      opportunityId: opportunity2.id,
      isPublic: true,
    },
  })

  await prisma.document.create({
    data: {
      name: 'Investor Terms and Conditions',
      description: 'General terms and conditions governing investor accounts on the Union Invest platform.',
      type: DocumentType.NOTICE,
      version: '2.1',
      fileUrl: '/documents/terms-and-conditions.pdf',
      fileSize: 204800,
      mimeType: 'application/pdf',
      isPublic: true,
    },
  })

  await prisma.document.create({
    data: {
      name: 'Privacy Policy',
      description: 'How Union Invest collects, uses, and protects your personal information.',
      type: DocumentType.NOTICE,
      version: '1.5',
      fileUrl: '/documents/privacy-policy.pdf',
      fileSize: 102400,
      mimeType: 'application/pdf',
      isPublic: true,
    },
  })
  console.log('✅ Documents created')

  // Sample investment and transactions for investor
  const investment1 = await prisma.investment.create({
    data: {
      userId: investor.id,
      opportunityId: opportunity1.id,
      referenceNumber: 'MI-2024-DEMO01',
      amount: 5000,
      status: 'ACTIVE',
      confirmedAt: new Date('2024-03-15'),
      maturityDate: new Date('2026-12-31'),
    },
  })

  await prisma.transaction.create({
    data: {
      userId: investor.id,
      investmentId: investment1.id,
      type: 'DEPOSIT',
      amount: 5000,
      fee: 0,
      netAmount: 5000,
      status: 'COMPLETED',
      reference: 'TXN-2024-DEMO01',
      description: 'Initial investment — Union Growth Fund Series A',
      processedAt: new Date('2024-03-15'),
    },
  })

  // Quarterly distribution
  await prisma.transaction.create({
    data: {
      userId: investor.id,
      investmentId: investment1.id,
      type: 'DISTRIBUTION',
      amount: 106.25,
      fee: 0,
      netAmount: 106.25,
      status: 'COMPLETED',
      reference: 'DIST-2024-Q1-DEMO01',
      description: 'Q1 2024 quarterly distribution — Union Growth Fund Series A',
      processedAt: new Date('2024-03-31'),
    },
  })

  await prisma.transaction.create({
    data: {
      userId: investor.id,
      investmentId: investment1.id,
      type: 'DISTRIBUTION',
      amount: 106.25,
      fee: 0,
      netAmount: 106.25,
      status: 'COMPLETED',
      reference: 'DIST-2024-Q2-DEMO01',
      description: 'Q2 2024 quarterly distribution — Union Growth Fund Series A',
      processedAt: new Date('2024-06-30'),
    },
  })

  // Document acknowledgment
  await prisma.documentAcknowledgment.create({
    data: {
      userId: investor.id,
      documentId: doc1.id,
      signedAt: new Date('2024-03-14'),
      ipAddress: '192.0.2.1',
    },
  })

  // Notification for investor
  await prisma.notification.create({
    data: {
      userId: investor.id,
      title: 'Welcome to Union Invest',
      message:
        'Thank you for joining Union Invest. Please review our offer documents before making any investment decisions.',
      type: 'INFO',
      link: '/documents',
    },
  })

  await prisma.notification.create({
    data: {
      userId: investor.id,
      title: 'Q2 Distribution Processed',
      message:
        'Your Q2 2024 distribution of $106.25 has been credited to your account.',
      type: 'SUCCESS',
      link: '/transactions',
    },
  })

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: investor.id,
      action: 'INVESTMENT_CREATED',
      entity: 'Investment',
      entityId: investment1.id,
      after: { amount: 5000, opportunityId: opportunity1.id },
      ipAddress: '192.0.2.1',
    },
  })

  console.log('✅ Sample transactions and notifications created')
  console.log('')
  console.log('🎉 Seeding complete!')
  console.log('')
  console.log('Default credentials:')
  console.log('  Admin:    admin@unioninvest.com / Admin@123!')
  console.log('  Finance:  finance@unioninvest.com / Finance@123!')
  console.log('  Investor: investor@example.com / Investor@123!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
