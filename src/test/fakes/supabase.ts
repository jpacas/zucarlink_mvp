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

interface ProfileRow {
  id: string
  account_type: 'technician' | 'provider'
  full_name: string
  country: string | null
  role_title: string | null
  current_company_id: string | null
  years_experience: number | null
  short_bio: string | null
  avatar_path: string | null
  phone: string | null
  whatsapp: string | null
  linkedin_url: string | null
  profile_status: 'incomplete' | 'complete'
  verification_status: 'unverified' | 'pending' | 'verified'
}

interface CompanyRow {
  id: string
  name: string
  country: string | null
}

interface SpecialtyRow {
  id: string
  name: string
  slug: string
}

interface ProfileSpecialtyRow {
  profile_id: string
  specialty_id: string
}

interface ExperienceRow {
  id: string
  profile_id: string
  company_id: string | null
  role_title: string
  start_date: string
  end_date: string | null
  is_current: boolean
  description: string | null
  achievements: string | null
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
  data?: {
    profiles?: ProfileRow[]
    companies?: CompanyRow[]
    specialties?: SpecialtyRow[]
    profileSpecialties?: ProfileSpecialtyRow[]
    experiences?: ExperienceRow[]
  }
}

type TableName =
  | 'profiles'
  | 'companies'
  | 'specialties'
  | 'profile_specialties'
  | 'experiences'

type BaseRow =
  | ProfileRow
  | CompanyRow
  | SpecialtyRow
  | ProfileSpecialtyRow
  | ExperienceRow
  | Record<string, unknown>

interface StorageObject {
  path: string
  file: File | Blob
}

interface SupabaseAuthFake {
  auth: {
    getSession: () => Promise<{ data: { session: Session | null }; error: AuthErrorLike | null }>
    getUser: () => Promise<{ data: { user: User | null }; error: AuthErrorLike | null }>
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
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File | Blob,
      ) => Promise<{ data: { path: string } | null; error: AuthErrorLike | null }>
      remove: (paths: string[]) => Promise<{ data: null; error: AuthErrorLike | null }>
      createSignedUrl: (
        path: string,
        expiresIn: number,
      ) => Promise<{ data: { signedUrl: string } | null; error: AuthErrorLike | null }>
    }
  }
  from: (table: TableName) => QueryBuilder
  calls: AuthCallHistory
  state: AuthFakeState
  emitAuthStateChange: (event: string, session?: Session | null) => void
  setSession: (session: Session | null) => void
  setUser: (user: User | null) => void
}

type Filter = {
  type: 'eq' | 'in'
  field: string
  value: unknown
}

type SelectMode = 'many' | 'maybeSingle' | 'single'

class QueryBuilder {
  private filters: Filter[] = []
  private selectedColumns: string[] | null = null
  private insertedRows: Partial<BaseRow>[] | null = null
  private updatedFields: Partial<BaseRow> | null = null
  private deleted = false
  private orderField: string | null = null
  private orderAscending = true
  private mode: SelectMode = 'many'

  constructor(
    private readonly tableName: TableName,
    private readonly getTable: (table: TableName) => BaseRow[],
    private readonly setTable: (table: TableName, rows: BaseRow[]) => void,
  ) {}

  select(columns?: string) {
    if (columns) {
      this.selectedColumns = columns.split(',').map((column) => column.trim())
    }

    return this
  }

  insert(rows: Partial<BaseRow> | Partial<BaseRow>[]) {
    this.insertedRows = Array.isArray(rows) ? rows : [rows]
    return this
  }

  update(fields: Partial<BaseRow>) {
    this.updatedFields = fields
    return this
  }

  delete() {
    this.deleted = true
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ type: 'eq', field, value })
    return this
  }

  in(field: string, value: unknown[]) {
    this.filters.push({ type: 'in', field, value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orderField = field
    this.orderAscending = options?.ascending ?? true
    return this
  }

  maybeSingle() {
    this.mode = 'maybeSingle'
    return this.execute()
  }

  single() {
    this.mode = 'single'
    return this.execute()
  }

  then<TResult1 = unknown, TResult2 = never>(
    onfulfilled?:
      | ((
          value: { data: BaseRow[] | BaseRow | null; error: AuthErrorLike | null },
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute() {
    const rows = [...this.getTable(this.tableName)]

    if (this.insertedRows) {
      const inserted = this.insertedRows.map((row) => this.withGeneratedFields(row))
      this.setTable(this.tableName, [...rows, ...inserted])
      const data = inserted.length === 1 ? inserted[0] : inserted
      return { data, error: null }
    }

    if (this.updatedFields) {
      const updatedRows = rows.map((row) =>
        this.matches(row) ? { ...row, ...this.updatedFields } : row,
      )
      this.setTable(this.tableName, updatedRows)
      return { data: null, error: null }
    }

    if (this.deleted) {
      const nextRows = rows.filter((row) => !this.matches(row))
      this.setTable(this.tableName, nextRows)
      return { data: null, error: null }
    }

    let selected = rows.filter((row) => this.matches(row))

    if (this.orderField) {
      const orderField = this.orderField
      selected = selected.sort((left, right) => {
        const leftValue = (left as Record<string, unknown>)[orderField]
        const rightValue = (right as Record<string, unknown>)[orderField]

        if (leftValue === rightValue) {
          return 0
        }

        if (leftValue === null || leftValue === undefined) {
          return 1
        }

        if (rightValue === null || rightValue === undefined) {
          return -1
        }

        if (leftValue < rightValue) {
          return this.orderAscending ? -1 : 1
        }

        return this.orderAscending ? 1 : -1
      })
    }

    const projected = selected.map((row) => this.project(row))

    if (this.mode === 'many') {
      return { data: projected, error: null }
    }

    const firstRow = projected[0] ?? null

    if (this.mode === 'single' && !firstRow) {
      return { data: null, error: { message: 'No rows found.' } }
    }

    return { data: firstRow, error: null }
  }

  private matches(row: BaseRow) {
    return this.filters.every((filter) => {
      const comparable = (row as Record<string, unknown>)[filter.field]

      if (filter.type === 'eq') {
        return comparable === filter.value
      }

      return Array.isArray(filter.value) && filter.value.includes(comparable)
    })
  }

  private project(row: BaseRow) {
    if (!this.selectedColumns) {
      return row
    }

    const selectedEntries = Object.entries(row).filter(([key]) =>
      this.selectedColumns?.includes(key),
    )

    return Object.fromEntries(selectedEntries)
  }

  private withGeneratedFields(row: Partial<BaseRow>) {
    if (this.tableName === 'companies') {
      return {
        id: nextId('company'),
        country: null,
        ...row,
      }
    }

    if (this.tableName === 'experiences') {
      return {
        id: nextId('experience'),
        company_id: null,
        end_date: null,
        is_current: false,
        description: null,
        achievements: null,
        ...row,
      }
    }

    return row
  }
}

let authSequence = 0
let tableSequence = 0

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

function nextId(prefix: string) {
  tableSequence += 1
  return `${prefix}_${tableSequence}`
}

function createProfileRow(user: User): ProfileRow {
  const accountType =
    (user.user_metadata.account_type as 'technician' | 'provider' | undefined) ?? 'technician'
  const fullName =
    (user.user_metadata.full_name as string | undefined) ?? user.email ?? 'Usuario Zucarlink'

  return {
    id: user.id,
    account_type: accountType,
    full_name: fullName,
    country: null,
    role_title: null,
    current_company_id: null,
    years_experience: null,
    short_bio: null,
    avatar_path: null,
    phone: null,
    whatsapp: null,
    linkedin_url: null,
    profile_status: 'incomplete',
    verification_status: 'unverified',
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

  const tables: Record<TableName, BaseRow[]> = {
    profiles: [...(options.data?.profiles ?? [])],
    companies: [...(options.data?.companies ?? [])],
    specialties: [...(options.data?.specialties ?? [])],
    profile_specialties: [...(options.data?.profileSpecialties ?? [])],
    experiences: [...(options.data?.experiences ?? [])],
  }
  const storage = new Map<string, StorageObject>()

  function ensureProfileForUser(user: User) {
    const profiles = tables.profiles as ProfileRow[]

    if (!profiles.some((profile) => profile.id === user.id)) {
      profiles.push(createProfileRow(user))
    }
  }

  if (state.user) {
    ensureProfileForUser(state.user)
  }

  function syncSession(nextSession: Session | null) {
    state.session = cloneSession(nextSession, state.user)
    state.user = state.session?.user ?? null

    if (state.user) {
      ensureProfileForUser(state.user)
    }
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
      ensureProfileForUser(state.user)

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
    ensureProfileForUser(user)

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

    if (user) {
      ensureProfileForUser(user)
    }
  }

  function getTable(table: TableName): BaseRow[] {
    return tables[table]
  }

  function setTable(table: TableName, rows: BaseRow[]) {
    tables[table] = rows
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
      async getUser() {
        return {
          data: {
            user: state.user,
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
        emitAuthStateChange('SIGNED_IN', session)

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
    storage: {
      from() {
        return {
          async upload(path, file) {
            storage.set(path, { path, file })
            return {
              data: { path },
              error: null,
            }
          },
          async remove(paths) {
            for (const path of paths) {
              storage.delete(path)
            }

            return {
              data: null,
              error: null,
            }
          },
          async createSignedUrl(path, expiresIn) {
            if (!storage.has(path)) {
              storage.set(path, { path, file: new Blob([]) })
            }

            return {
              data: {
                signedUrl: `https://signed.example/${path}?expiresIn=${expiresIn}`,
              },
              error: null,
            }
          },
        }
      },
    },
    from(table) {
      return new QueryBuilder(table, getTable, setTable)
    },
    calls,
    state,
    emitAuthStateChange,
    setSession,
    setUser,
  }
}

export type { SupabaseAuthFake }
