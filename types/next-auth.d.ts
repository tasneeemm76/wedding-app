import 'next-auth'

declare module 'next-auth' {
  interface User {
    role: string
    id: string
  }

  interface Session {
    user: {
      id: string
      email: string
      role: string
      name: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string
    id: string
  }
}

