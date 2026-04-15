import type { Session, User } from '@supabase/supabase-js'

type AuthStateChangeHandler = (event: string, session: Session | null) => void
type AuthErrorLike = { message: string }

interface SignInWithPasswordParams {
  email: string
  password: string
}

interface SignUpParams {
  email: string
  password: string
  options?: {
    data?: Record<string, unknown>
  }
}

interface AuthCallHistory {
  getSession: unknown[]
  onAuthStateChange: AuthStateChangeHandler[]
  signUp: SignUpParams[]
  signInWithPassword: SignInWithPasswordParams[]
  signOut: unknown[]
}

interface AuthFakeState {
  session: Session | null
  user: User | null
}

interface SupabaseAuthFake {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }; error: AuthErrorLike | null }>
    onAuthStateChange: (
      callback: AuthStateChangeHandler,
    ) => { data: { subscription: { unsubscribe: () => void } } }
    signUp: (
      params: SignUpParams,
    ) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthErrorLike | null }>
    signInWithPassword: (
      params: SignInWithPasswordParams,
    ) => Promise<{ data: { session: Session | null; user: User | null }; error: AuthErrorLike | null }>
    signOut: () => Promise<{ data: Record<string, never>; error: AuthErrorLike | null }>
  }
  calls: AuthCallHistory
  state: AuthFakeState
  emitAuthStateChange: (event: string, session?: Session | null) => void
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
}

interface CreateSupabaseAuthFakeOptions {
  session?: Session | null
  user?: User | null
  signUp?: {
    returnsSession?: boolean
    error?: { message: string } | null
  }
  signInWithPassword?: {
    error?: { message: string } | null
  }
  signOut?: {
    error?: { message: string } | null
  }
  getSession?: {
    error?: { message: string } | null
  }
}

let authSequence = 0

function createFakeUser(email: string, userMetadata: Record<string, unknown> = {}): User {
  const now = new Date().toISOString()
  const id = `user_${++authSequence}`

  return {
    id,
    aud: 'authenticated',
    email,
    created_at: now,
    updated_at: now,
    app_metadata: {
      provider: 'email',
      providers: ['email'],
    },
    user_metadata: userMetadata,
    role: 'authenticated',
    identities: [],
  } as User
}

function createFakeSession(user: User): Session {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600

  return {
    access_token: `access_${user.id}`,
    refresh_token: `refresh_${user.id}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: expiresAt,
    provider_token: null,
    provider_refresh_token: null,
    user,
  } as Session
}

function cloneSession(session: Session | null, user: User | null) {
  if (!session) {
    return null
  }

  return {
    ...session,
    user: user ?? session.user,
  }
}

export function createAuthenticatedAuthState(options: {
  email: string
  userMetadata?: Record<string, unknown>
}): { session: Session; user: User } {
  const user = createFakeUser(options.email, options.userMetadata)
  const session = createFakeSession(user)

  return {
    session,
    user,
  }
}

export function createSupabaseAuthFake(
  options: CreateSupabaseAuthFakeOptions = {},
): SupabaseAuthFake {
  const calls: AuthCallHistory = {
    getSession: [],
    onAuthStateChange: [],
    signUp: [],
    signInWithPassword: [],
    signOut: [],
  }

  const state: AuthFakeState = {
    session: options.session ?? null,
    user: options.user ?? options.session?.user ?? null,
  }
  const signUpReturnsSession = options.signUp?.returnsSession ?? true

  const listeners = new Set<AuthStateChangeHandler>()

  function syncSession(nextSession: Session | null) {
    state.session = cloneSession(nextSession, state.user)
    state.user = state.session?.user ?? null
  }

  function resolveAuthenticatedState(
    email: string,
    userMetadata: Record<string, unknown> = {},
  ) {
    if (state.session && state.user) {
      state.user = {
        ...state.user,
        user_metadata: {
          ...state.user.user_metadata,
          ...userMetadata,
        },
      }
      state.session = cloneSession(state.session, state.user)

      return {
        session: state.session,
        user: state.user,
      }
    }

    const user = state.user ?? createFakeUser(email, userMetadata)
    const session = state.session ?? createFakeSession(user)

    user.user_metadata = {
      ...user.user_metadata,
      ...userMetadata,
    }

    state.user = user
    state.session = cloneSession(session, user)

    return {
      session: state.session,
      user: state.user,
    }
  }

  function emitAuthStateChange(event: string, session: Session | null = state.session) {
    syncSession(session)

    for (const listener of listeners) {
      listener(event, state.session)
    }
  }

  function setSession(session: Session | null) {
    syncSession(session)
  }

  function setUser(user: User | null) {
    state.user = user
    state.session = cloneSession(state.session, user)
  }

  return {
    auth: {
      async getSession() {
        calls.getSession.push(undefined)

        if (options.getSession?.error) {
          return {
            data: {
              session: null,
            },
            error: options.getSession.error,
          }
        }

        return {
          data: {
            session: state.session,
          },
          error: null,
        }
      },
      onAuthStateChange(callback) {
        calls.onAuthStateChange.push(callback)
        listeners.add(callback)

        return {
          data: {
            subscription: {
              unsubscribe: () => {
                listeners.delete(callback)
              },
            },
          },
        }
      },
      async signUp(params) {
        calls.signUp.push(params)
        if (options.signUp?.error) {
          return {
            data: {
              session: null,
              user: null,
            },
            error: options.signUp.error,
          }
        }

        const { session, user } = resolveAuthenticatedState(
          params.email,
          params.options?.data ?? {},
        )

        if (!signUpReturnsSession) {
          state.session = null
          emitAuthStateChange('SIGNED_UP', null)
          return {
            data: {
              session: null,
              user,
            },
            error: null,
          }
        }

        emitAuthStateChange('SIGNED_UP', session)

        return {
          data: {
            session,
            user,
          },
          error: null,
        }
      },
      async signInWithPassword(params) {
        calls.signInWithPassword.push(params)
        if (options.signInWithPassword?.error) {
          return {
            data: {
              session: null,
              user: null,
            },
            error: options.signInWithPassword.error,
          }
        }

        const { session, user } = resolveAuthenticatedState(params.email)
        emitAuthStateChange('SIGNED_IN')

        return {
          data: {
            session,
            user,
          },
          error: null,
        }
      },
      async signOut() {
        calls.signOut.push(undefined)
        if (options.signOut?.error) {
          return {
            data: {},
            error: options.signOut.error,
          }
        }

        emitAuthStateChange('SIGNED_OUT', null)

        return {
          data: {},
          error: null,
        }
      },
    },
    calls,
    state,
    emitAuthStateChange,
    setSession,
    setUser,
  }
}

export type { SupabaseAuthFake }
