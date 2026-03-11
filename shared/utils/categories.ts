export const CATEGORIES = [
  'Electronics',
  'Books',
  'Clothing',
  'Accessories',
  'ID Cards',
  'Keys',
  'Bags',
  'Stationery',
  'Other',
] as const

export type Category = typeof CATEGORIES[number]

export const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ label: c, value: c }))
