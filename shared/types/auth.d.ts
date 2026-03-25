declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar: string | null
    phone?: string | null
    isAdmin: boolean
  }

  interface UserSession {
    user: User
  }
}

export {}
