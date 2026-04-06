# Phase 3b: Next.js Admin Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Google-authenticated admin section at `/admin/configs` in the existing Next.js app that lets an admin list, create, edit, and soft-delete configs via the .NET API using Server Actions.

**Architecture:** Auth.js v5 with Google provider protects all `/admin/*` routes via `middleware.ts`. The Google ID token is stored in the session JWT and forwarded from Server Actions to the .NET API as `Authorization: Bearer`. A Client Component (`ConfigsClient`) manages UI state; a Server Component (`configs/page.tsx`) fetches data server-side on every page load.

**Tech Stack:** Next.js 16 App Router, Auth.js v5 (`next-auth`), Tailwind CSS v4, React Testing Library, Jest

---

## File Map

```
web/
├── auth.ts                                          # Auth.js config — Google provider + JWT/session callbacks
├── middleware.ts                                    # Protects /admin/* — redirects to sign-in if unauthenticated
└── app/
    ├── api/auth/[...nextauth]/route.ts              # Auth.js GET + POST route handler
    └── admin/
        ├── layout.tsx                               # Auth guard + header (email + sign-out)
        ├── page.tsx                                 # Admin home — "Manage Configs →" link
        └── configs/
            ├── types.ts                             # ConfigDto type (shared, avoids importing "use server" file in tests)
            ├── actions.ts                           # Server Actions: getConfigs, createConfig, updateConfig, deleteConfig
            ├── page.tsx                             # Server Component — fetches configs, renders ConfigsClient
            └── components/
                ├── ConfigsClient.tsx                # Client Component — manages edit/add state, calls actions
                ├── ConfigTable.tsx                  # Client Component — table of config rows
                └── ConfigForm.tsx                   # Client Component — add/edit form with validation
web/app/__tests__/admin/
├── ConfigTable.test.tsx
└── ConfigForm.test.tsx
```

---

### Task 1: Install Auth.js v5 and configure Google provider

**Files:**
- Modify: `web/package.json` (via npm install)
- Create: `web/auth.ts`

- [ ] **Step 1: Install next-auth**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm install next-auth
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Create .env.local with required variables**

Create `web/.env.local` (if it doesn't exist). Add these keys — fill in real values from Google Cloud Console and your .NET API:

```bash
# Generate AUTH_SECRET with: openssl rand -base64 32
AUTH_SECRET=replace_with_32_char_random_string
AUTH_GOOGLE_ID=replace_with_google_client_id
AUTH_GOOGLE_SECRET=replace_with_google_client_secret
DOTNET_API_URL=http://localhost:5000
```

**Google Cloud steps (one-time manual):**
1. Go to console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID → `AUTH_GOOGLE_ID`, Client Secret → `AUTH_GOOGLE_SECRET`

- [ ] **Step 3: Create auth.ts**

Create `web/auth.ts`:

```ts
import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

declare module 'next-auth' {
  interface Session {
    idToken?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    idToken?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    jwt({ token, account }) {
      // account is only present on first sign-in — capture the Google ID token
      if (account?.id_token) {
        token.idToken = account.id_token
      }
      return token
    },
    session({ session, token }) {
      // Expose idToken to Server Actions via session
      session.idToken = token.idToken
      return session
    },
  },
})
```

- [ ] **Step 4: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/package.json web/package-lock.json web/auth.ts
git commit -m "feat: install next-auth and configure Google OAuth provider"
```

---

### Task 2: Middleware + Auth route handler

**Files:**
- Create: `web/middleware.ts`
- Create: `web/app/api/auth/[...nextauth]/route.ts`

- [ ] **Step 1: Create middleware**

Create `web/middleware.ts`:

```ts
export { auth as middleware } from '@/auth'

export const config = {
  // Protect all /admin routes
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: Create Auth.js route handler**

Create `web/app/api/auth/[...nextauth]/route.ts`:

```ts
import { handlers } from '@/auth'

export const { GET, POST } = handlers
```

- [ ] **Step 3: Verify the app still starts**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm run build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully` or similar. If there are TypeScript errors about missing env vars, that's OK — they're runtime values.

- [ ] **Step 4: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/middleware.ts web/app/api/
git commit -m "feat: add middleware to protect /admin/* and Auth.js route handler"
```

---

### Task 3: Admin layout + admin home page

**Files:**
- Create: `web/app/admin/layout.tsx`
- Create: `web/app/admin/page.tsx`

- [ ] **Step 1: Create admin layout with auth guard and header**

Create `web/app/admin/layout.tsx`:

```tsx
import { auth, signOut } from '@/auth'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/api/auth/signin')

  async function handleSignOut() {
    'use server'
    await signOut({ redirectTo: '/' })
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="flex justify-between items-center px-6 py-3 border-b border-gray-200">
        <span className="font-semibold text-gray-800">Wedding Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session.user?.email}</span>
          <form action={handleSignOut}>
            <button
              type="submit"
              className="text-sm text-red-600 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  )
}
```

- [ ] **Step 2: Create admin home page**

Create `web/app/admin/page.tsx`:

```tsx
import Link from 'next/link'

export default function AdminPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">
        Admin Dashboard
      </h1>
      <Link
        href="/admin/configs"
        className="inline-block px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
      >
        Manage Configs →
      </Link>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/admin/layout.tsx web/app/admin/page.tsx
git commit -m "feat: add admin layout with auth guard and admin home page"
```

---

### Task 4: Config types + Server Actions

**Files:**
- Create: `web/app/admin/configs/types.ts`
- Create: `web/app/admin/configs/actions.ts`

- [ ] **Step 1: Create shared ConfigDto type**

Create `web/app/admin/configs/types.ts`:

```ts
export type ConfigDto = {
  id: number
  key: string
  value: string
  type: string
  createdAt: string
  updatedAt: string
}
```

- [ ] **Step 2: Create Server Actions**

Create `web/app/admin/configs/actions.ts`:

```ts
'use server'

import { auth } from '@/auth'
import type { ConfigDto } from './types'

async function getIdToken(): Promise<string> {
  const session = await auth()
  if (!session?.idToken) throw new Error('Not authenticated')
  return session.idToken
}

const API = process.env.DOTNET_API_URL!

export async function getConfigs(): Promise<ConfigDto[]> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Failed to fetch configs: ${res.status}`)
  return res.json()
}

export async function createConfig(
  key: string,
  value: string,
  type: string,
): Promise<ConfigDto> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key, value, type }),
  })
  if (!res.ok) throw new Error(`Failed to create config: ${res.status}`)
  return res.json()
}

export async function updateConfig(
  id: number,
  key: string,
  value: string,
  type: string,
): Promise<ConfigDto> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key, value, type }),
  })
  if (!res.ok) throw new Error(`Failed to update config: ${res.status}`)
  return res.json()
}

export async function deleteConfig(id: number): Promise<void> {
  const token = await getIdToken()
  const res = await fetch(`${API}/api/configs/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Failed to delete config: ${res.status}`)
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/admin/configs/types.ts web/app/admin/configs/actions.ts
git commit -m "feat: add ConfigDto type and Server Actions for Config CRUD"
```

---

### Task 5: Unit tests for ConfigTable — write failing tests (TDD red)

**Files:**
- Create: `web/app/__tests__/admin/ConfigTable.test.tsx`

- [ ] **Step 1: Create the test directory and test file**

```bash
mkdir -p /Users/asol3/thanwap/claude/thanwa-meena-wedding/web/app/__tests__/admin
```

Create `web/app/__tests__/admin/ConfigTable.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ConfigTable from '../../admin/configs/components/ConfigTable'
import type { ConfigDto } from '../../admin/configs/types'

const mockConfigs: ConfigDto[] = [
  {
    id: 1,
    key: 'marry_date',
    value: '2026-12-26',
    type: 'date',
    createdAt: '2026-04-06T00:00:00Z',
    updatedAt: '2026-04-06T00:00:00Z',
  },
  {
    id: 2,
    key: 'venue_name',
    value: 'The Cop Seminar and Resort, Pattaya',
    type: 'location',
    createdAt: '2026-04-06T00:00:00Z',
    updatedAt: '2026-04-06T00:00:00Z',
  },
]

describe('ConfigTable', () => {
  it('renders all config rows', () => {
    render(
      <ConfigTable configs={mockConfigs} onEdit={jest.fn()} onDelete={jest.fn()} />,
    )
    expect(screen.getByText('marry_date')).toBeInTheDocument()
    expect(screen.getByText('2026-12-26')).toBeInTheDocument()
    expect(screen.getByText('venue_name')).toBeInTheDocument()
  })

  it('calls onEdit with the correct config when Edit is clicked', () => {
    const onEdit = jest.fn()
    render(
      <ConfigTable configs={mockConfigs} onEdit={onEdit} onDelete={jest.fn()} />,
    )
    fireEvent.click(screen.getAllByText('Edit')[0])
    expect(onEdit).toHaveBeenCalledWith(mockConfigs[0])
  })

  it('calls onDelete with the correct id when Delete is clicked', () => {
    const onDelete = jest.fn()
    render(
      <ConfigTable configs={mockConfigs} onEdit={jest.fn()} onDelete={onDelete} />,
    )
    fireEvent.click(screen.getAllByText('Delete')[0])
    expect(onDelete).toHaveBeenCalledWith(1)
  })

  it('shows empty message when configs list is empty', () => {
    render(<ConfigTable configs={[]} onEdit={jest.fn()} onDelete={jest.fn()} />)
    expect(screen.getByText('No configs yet.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests — expect failure (component not created yet)**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --testPathPattern="admin/ConfigTable" --no-coverage 2>&1 | tail -15
```

Expected: `Cannot find module '../../admin/configs/components/ConfigTable'` — correct TDD red phase.

- [ ] **Step 3: Commit the failing tests**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/__tests__/admin/ConfigTable.test.tsx
git commit -m "test: add failing unit tests for ConfigTable (TDD red)"
```

---

### Task 6: ConfigTable component — make tests pass (TDD green)

**Files:**
- Create: `web/app/admin/configs/components/ConfigTable.tsx`

- [ ] **Step 1: Create ConfigTable**

Create `web/app/admin/configs/components/ConfigTable.tsx`:

```tsx
'use client'

import type { ConfigDto } from '../types'

interface Props {
  configs: ConfigDto[]
  onEdit: (config: ConfigDto) => void
  onDelete: (id: number) => void
}

export default function ConfigTable({ configs, onEdit, onDelete }: Props) {
  if (configs.length === 0) {
    return <p className="text-gray-500 text-sm">No configs yet.</p>
  }

  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-gray-200">
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Key</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Value</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Type</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Updated At</th>
          <th className="text-left py-2 px-3 text-gray-600 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {configs.map((config) => (
          <tr key={config.id} className="border-b border-gray-100 hover:bg-gray-50">
            <td className="py-2 px-3 font-mono">{config.key}</td>
            <td className="py-2 px-3">{config.value}</td>
            <td className="py-2 px-3 text-gray-500">{config.type}</td>
            <td className="py-2 px-3 text-gray-400 text-xs">
              {new Date(config.updatedAt).toLocaleString()}
            </td>
            <td className="py-2 px-3">
              <div className="flex gap-3">
                <button
                  onClick={() => onEdit(config)}
                  className="text-blue-600 hover:underline text-xs"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(config.id)}
                  className="text-red-600 hover:underline text-xs"
                >
                  Delete
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

- [ ] **Step 2: Run ConfigTable tests — all 4 should pass**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --testPathPattern="admin/ConfigTable" --no-coverage
```

Expected:
```
PASS  app/__tests__/admin/ConfigTable.test.tsx
  ConfigTable
    ✓ renders all config rows
    ✓ calls onEdit with the correct config when Edit is clicked
    ✓ calls onDelete with the correct id when Delete is clicked
    ✓ shows empty message when configs list is empty

Tests: 4 passed, 4 total
```

- [ ] **Step 3: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/admin/configs/components/ConfigTable.tsx
git commit -m "feat: add ConfigTable component — unit tests passing (TDD green)"
```

---

### Task 7: Unit tests for ConfigForm — write failing tests (TDD red)

**Files:**
- Create: `web/app/__tests__/admin/ConfigForm.test.tsx`

- [ ] **Step 1: Create the test file**

Create `web/app/__tests__/admin/ConfigForm.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import ConfigForm from '../../admin/configs/components/ConfigForm'
import type { ConfigDto } from '../../admin/configs/types'

describe('ConfigForm', () => {
  it('renders empty fields in add mode (no initial prop)', () => {
    render(<ConfigForm onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText('Key')).toHaveValue('')
    expect(screen.getByLabelText('Value')).toHaveValue('')
    expect(screen.getByLabelText('Type')).toHaveValue('')
  })

  it('pre-fills fields in edit mode (initial prop provided)', () => {
    const initial: ConfigDto = {
      id: 1,
      key: 'marry_date',
      value: '2026-12-26',
      type: 'date',
      createdAt: '',
      updatedAt: '',
    }
    render(<ConfigForm initial={initial} onSave={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getByLabelText('Key')).toHaveValue('marry_date')
    expect(screen.getByLabelText('Value')).toHaveValue('2026-12-26')
    expect(screen.getByLabelText('Type')).toHaveValue('date')
  })

  it('calls onSave with trimmed field values when form is submitted', () => {
    const onSave = jest.fn()
    render(<ConfigForm onSave={onSave} onCancel={jest.fn()} />)
    fireEvent.change(screen.getByLabelText('Key'), { target: { value: '  test_key  ' } })
    fireEvent.change(screen.getByLabelText('Value'), { target: { value: '  test_value  ' } })
    fireEvent.change(screen.getByLabelText('Type'), { target: { value: '  string  ' } })
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalledWith('test_key', 'test_value', 'string')
  })

  it('shows validation error and does not call onSave when fields are empty', () => {
    const onSave = jest.fn()
    render(<ConfigForm onSave={onSave} onCancel={jest.fn()} />)
    fireEvent.click(screen.getByText('Save'))
    expect(screen.getByText('All fields are required')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = jest.fn()
    render(<ConfigForm onSave={jest.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('Cancel'))
    expect(onCancel).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run tests — expect failure**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --testPathPattern="admin/ConfigForm" --no-coverage 2>&1 | tail -10
```

Expected: `Cannot find module '../../admin/configs/components/ConfigForm'` — correct TDD red.

- [ ] **Step 3: Commit the failing tests**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/__tests__/admin/ConfigForm.test.tsx
git commit -m "test: add failing unit tests for ConfigForm (TDD red)"
```

---

### Task 8: ConfigForm component — make tests pass (TDD green)

**Files:**
- Create: `web/app/admin/configs/components/ConfigForm.tsx`

- [ ] **Step 1: Create ConfigForm**

Create `web/app/admin/configs/components/ConfigForm.tsx`:

```tsx
'use client'

import { useState } from 'react'
import type { ConfigDto } from '../types'

interface Props {
  initial?: ConfigDto
  onSave: (key: string, value: string, type: string) => void
  onCancel: () => void
}

export default function ConfigForm({ initial, onSave, onCancel }: Props) {
  const [key, setKey] = useState(initial?.key ?? '')
  const [value, setValue] = useState(initial?.value ?? '')
  const [type, setType] = useState(initial?.type ?? '')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!key.trim() || !value.trim() || !type.trim()) {
      setError('All fields are required')
      return
    }
    setError('')
    onSave(key.trim(), value.trim(), type.trim())
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 p-4 border border-gray-200 rounded bg-gray-50"
    >
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label
            htmlFor="key"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Key
          </label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. marry_date"
          />
        </div>
        <div>
          <label
            htmlFor="value"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Value
          </label>
          <input
            id="value"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. 2026-12-26"
          />
        </div>
        <div>
          <label
            htmlFor="type"
            className="block text-xs font-medium text-gray-600 mb-1"
          >
            Type
          </label>
          <input
            id="type"
            type="text"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
            placeholder="e.g. date"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-xs mb-3">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 border border-gray-300 text-sm rounded hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Run ConfigForm tests — all 5 should pass**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --testPathPattern="admin/ConfigForm" --no-coverage
```

Expected:
```
PASS  app/__tests__/admin/ConfigForm.test.tsx
  ConfigForm
    ✓ renders empty fields in add mode (no initial prop)
    ✓ pre-fills fields in edit mode (initial prop provided)
    ✓ calls onSave with trimmed field values when form is submitted
    ✓ shows validation error and does not call onSave when fields are empty
    ✓ calls onCancel when Cancel is clicked

Tests: 5 passed, 5 total
```

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --no-coverage
```

Expected: all tests pass (existing page tests + 4 ConfigTable + 5 ConfigForm = 11+ total).

- [ ] **Step 4: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/admin/configs/components/ConfigForm.tsx
git commit -m "feat: add ConfigForm component — unit tests passing (TDD green)"
```

---

### Task 9: ConfigsClient + configs page — wire everything together

**Files:**
- Create: `web/app/admin/configs/components/ConfigsClient.tsx`
- Create: `web/app/admin/configs/page.tsx`

- [ ] **Step 1: Create ConfigsClient (state manager)**

Create `web/app/admin/configs/components/ConfigsClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ConfigTable from './ConfigTable'
import ConfigForm from './ConfigForm'
import { createConfig, updateConfig, deleteConfig } from '../actions'
import type { ConfigDto } from '../types'

interface Props {
  initialConfigs: ConfigDto[]
}

export default function ConfigsClient({ initialConfigs }: Props) {
  const router = useRouter()
  const [editingConfig, setEditingConfig] = useState<ConfigDto | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this config?')) return
    await deleteConfig(id)
    router.refresh()
  }

  const handleSave = async (key: string, value: string, type: string) => {
    if (editingConfig) {
      await updateConfig(editingConfig.id, key, value, type)
    } else {
      await createConfig(key, value, type)
    }
    setEditingConfig(null)
    setIsAdding(false)
    router.refresh()
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingConfig(null)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold text-gray-800">Configs</h1>
        {!isAdding && !editingConfig && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 bg-gray-800 text-white text-sm rounded hover:bg-gray-700"
          >
            Add Config
          </button>
        )}
      </div>
      {(isAdding || editingConfig) && (
        <ConfigForm
          initial={editingConfig ?? undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
      <ConfigTable
        configs={initialConfigs}
        onEdit={(config) => {
          setEditingConfig(config)
          setIsAdding(false)
        }}
        onDelete={handleDelete}
      />
    </div>
  )
}
```

- [ ] **Step 2: Create configs page**

Create `web/app/admin/configs/page.tsx`:

```tsx
import { getConfigs } from './actions'
import ConfigsClient from './components/ConfigsClient'

export default async function ConfigsPage() {
  const configs = await getConfigs()
  return <ConfigsClient initialConfigs={configs} />
}
```

- [ ] **Step 3: Verify build passes**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm run build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully` with no TypeScript errors.

- [ ] **Step 4: Run the full test suite one final time**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding/web
npm test -- --no-coverage
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
cd /Users/asol3/thanwap/claude/thanwa-meena-wedding
git add web/app/admin/configs/components/ConfigsClient.tsx web/app/admin/configs/page.tsx
git commit -m "feat: add ConfigsClient and configs page — Phase 3b complete"
```

---

## Manual Smoke Test Checklist

Before declaring Phase 3b done, verify manually (requires .NET API from Phase 3a running on port 5000):

- [ ] `npm run dev` starts without errors
- [ ] Visit `http://localhost:3000/admin` without a session → redirected to Google sign-in
- [ ] Sign in with Google → lands on `http://localhost:3000/admin`
- [ ] Click "Manage Configs →" → navigates to `/admin/configs`
- [ ] Config list loads from .NET API
- [ ] Click "Add Config" → form appears → fill fields → Save → config appears in table
- [ ] Click "Edit" on a row → form pre-fills → change value → Save → table updates
- [ ] Click "Delete" on a row → confirm dialog → config removed from table
- [ ] Click "Sign out" → redirected to `/`

---

## Done

Phase 3b is complete. `web/` now has:
- Google OAuth login gating all `/admin/*` routes
- `/admin/configs` with full Create/Read/Update/Delete via .NET API Server Actions
- 9 passing unit tests (4 ConfigTable + 5 ConfigForm)
