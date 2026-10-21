export interface MarriageTypeOption {
  id: string
  label: string
  description: string
}

export const MARRIAGE_TYPES: MarriageTypeOption[] = [
  { id: 'CIVIL_MARRIAGE', label: 'Marriage', description: 'A married couple.' },
  { id: 'SAME_SEX_MARRIAGE', label: 'Same-sex marriage', description: 'A married same-sex couple.' },
  { id: 'CIVIL_UNION', label: 'Civil union / registered partnership', description: 'A couple in a civil union or registered partnership.' },
  { id: 'DOMESTIC_PARTNERSHIP', label: 'Domestic partnership', description: 'A couple living together as domestic partners.' },
]
