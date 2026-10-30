/** What two linked partners are to each other (safe to use in the browser) */
export const RELATIONS = {
  spouse: 'Spouse',
  partner: 'Partner',
  friend: 'Friend',
  family: 'Family',
  business: 'Business partner',
  other: 'Other',
} as const
export type Relation = keyof typeof RELATIONS
export const cleanRelation = (value: unknown): Relation =>
  typeof value === 'string' && value in RELATIONS ? (value as Relation) : 'partner'
