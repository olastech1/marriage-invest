export interface MarriageTypeOption {
  id: string
  label: string
  category: string
  certificateTitle: string
  covenantSubtitle: string
  sealBadgeText: string
  defaultRole1: string
  defaultRole2: string
  description: string
  badgeColor: string
}

export const MARRIAGE_TYPES: MarriageTypeOption[] = [
  {
    id: 'SAME_SEX_GAY',
    label: 'Same-Sex Marriage (Gay / Husbands)',
    category: 'Same-Sex Matrimony',
    certificateTitle: 'Certificate of Same-Sex Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Joint Wealth & Mutual Survivorship between Husbands',
    sealBadgeText: 'SAME-SEX COVENANT',
    defaultRole1: 'Husband',
    defaultRole2: 'Husband',
    description: 'Equal joint survivorship, 50/50 capital rights & mutual fiduciary protection for male spouses.',
    badgeColor: 'bg-indigo-50 border-indigo-200 text-indigo-700',
  },
  {
    id: 'SAME_SEX_LESBIAN',
    label: 'Same-Sex Marriage (Lesbian / Wives)',
    category: 'Same-Sex Matrimony',
    certificateTitle: 'Certificate of Same-Sex Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Joint Wealth & Mutual Survivorship between Wives',
    sealBadgeText: 'SAME-SEX COVENANT',
    defaultRole1: 'Wife',
    defaultRole2: 'Wife',
    description: 'Equal joint survivorship, 50/50 capital rights & mutual fiduciary protection for female spouses.',
    badgeColor: 'bg-rose-50 border-rose-200 text-rose-700',
  },
  {
    id: 'CIVIL_MARRIAGE',
    label: 'Civil Marriage (Husband & Wife)',
    category: 'Civil Matrimony',
    certificateTitle: 'Certificate of Marriage Investment',
    covenantSubtitle: 'Official Matrimonial Covenant of Shared Wealth & Mutual Survivorship',
    sealBadgeText: 'CIVIL MARRIAGE',
    defaultRole1: 'Husband',
    defaultRole2: 'Wife',
    description: 'Traditional civil marriage covenant under Union Verify fiduciary protocols.',
    badgeColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  },
  {
    id: 'CIVIL_UNION',
    label: 'Registered Civil Union / Legal Partnership',
    category: 'Registered Civil Union',
    certificateTitle: 'Certificate of Civil Union & Investment',
    covenantSubtitle: 'Official Registered Civil Union Covenant of Equal Capital Custody',
    sealBadgeText: 'CIVIL UNION SEAL',
    defaultRole1: 'Registered Partner',
    defaultRole2: 'Registered Partner',
    description: 'Statutory civil partnership enjoying identical financial rights and dual survivorship.',
    badgeColor: 'bg-blue-50 border-blue-200 text-blue-700',
  },
  {
    id: 'DOMESTIC_PARTNERSHIP',
    label: 'Domestic Partnership',
    category: 'Domestic Partnership',
    certificateTitle: 'Certificate of Domestic Partnership Investment',
    covenantSubtitle: 'Official Domestic Partnership Covenant of Shared Economic Assets',
    sealBadgeText: 'DOMESTIC PARTNERSHIP',
    defaultRole1: 'Domestic Partner',
    defaultRole2: 'Domestic Partner',
    description: 'Recognized domestic cohabitation partnership with co-beneficiary rights across all investment yields.',
    badgeColor: 'bg-amber-50 border-amber-200 text-amber-700',
  },
  {
    id: 'UNIVERSAL_COVENANT',
    label: 'Universal Life Partnership Covenant',
    category: 'Universal Life Union',
    certificateTitle: 'Certificate of Life Partnership Investment',
    covenantSubtitle: 'Universal Covenant of Mutual Capital Trust & Co-Beneficiary Entitlement',
    sealBadgeText: 'UNIVERSAL COVENANT',
    defaultRole1: 'Spouse',
    defaultRole2: 'Spouse',
    description: 'Universal fiduciary covenant applicable to all life partners with reciprocal inheritance.',
    badgeColor: 'bg-purple-50 border-purple-200 text-purple-700',
  },
]
