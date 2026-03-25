// Deprecated: prefer fetching categories from /api/categories.
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

// Deprecated: use DB-backed categories for form options.
export const CATEGORY_OPTIONS = CATEGORIES.map(c => ({ label: c, value: c }))
