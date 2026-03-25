export type CategorySummary = {
  id: string
  name: string
}

export type LocationSummary = {
  id: string
  name: string
}

export type UserSummary = {
  id: string
  name: string
  avatar: string | null
}

export type UserDetail = UserSummary & {
  email: string
}

export type ItemListEntry = {
  id: string
  type: 'lost' | 'found'
  title: string
  description: string
  category: CategorySummary
  location: LocationSummary
  date: string
  reward: string | null
  status: 'open' | 'claimed' | 'resolved' | 'closed'
  hasImage: boolean
  createdAt: string
  user: UserSummary | null
}

export type ItemDetail = Omit<ItemListEntry, 'user'> & {
  user: UserDetail | null
  claimCount: number
  alreadyClaimed: boolean
}

export type ClaimEntry = {
  id: string
  message: string
  contactInfo: string | null
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  claimer: UserDetail | null
}

export type DashboardItem = {
  id: string
  type: 'lost' | 'found'
  title: string
  category: string
  location: string
  date: string
  reward: string | null
  status: 'open' | 'claimed' | 'resolved' | 'closed'
  hasImage: boolean
  createdAt: string
  claimCount: number
}

export type DashboardClaim = {
  id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
  item: {
    id: string
    type: 'lost' | 'found'
    title: string
    status: 'open' | 'claimed' | 'resolved' | 'closed'
  } | null
}

export type AdminItem = {
  id: string
  type: 'lost' | 'found'
  title: string
  category: string
  location: string
  status: 'open' | 'claimed' | 'resolved' | 'closed'
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  } | null
  claimCount: number
}
