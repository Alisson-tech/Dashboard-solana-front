# Plan: SolCuts — Role-Based Dashboard & Wallet-Only Auth

## Summary

Restructure authentication to use only Solana wallet, add role selection on first login (Creator / Editor), translate all UI to English, and implement role-specific dashboards.

---

## 1. Auth: Remove Email, Wallet-Only

### Current
- Uses **Dynamic Labs SDK** (`@dynamic-labs/sdk-react-core`, `@dynamic-labs/solana`)
- Supports email, social (Google, Discord), and wallet login
- `SolanaProvider` wraps both Dynamic + Solana wallet adapter

### Target
- Strip out **Dynamic Labs entirely**
- Use only `@solana/wallet-adapter-react` + `@solana/wallet-adapter-react-ui` (already in `package.json`)
- Wallet connectors: **Phantom**, **Backpack**, **Solflare**, **Glow**, **Toruk** (or all standard Solana wallets)
- Connect via a modal (e.g., `WalletModalProvider` from `@solana/wallet-adapter-react-ui`)

**Files to modify:**
| File | Change |
|---|---|
| `components/providers/solana-provider.tsx` | Remove Dynamic; add `WalletProvider`, `WalletModalProvider`, `ConnectionProvider` |
| `app/layout.tsx` | Remove Dynamic imports, keep `SolanaProvider` |
| `components/layout/header.tsx` | Replace `DynamicWidget` with `WalletMultiButton` + wallet display |
| `components/layout/sidebar.tsx` | Remove Dynamic deps; get wallet from `useWallet()` |
| `components/layout/main-layout.tsx` | Remove Dynamic debug panel |
| `app/page.tsx` (landing) | Replace `DynamicWidget` with wallet connect button |
| `app/create/page.tsx` | Use `useWallet()` instead of `useDynamicContext()` |
| `app/bounties/[id]/page.tsx` | Same |
| `app/profile/page.tsx` | Same |
| `app/dashboard/page.tsx` | Same |
| `app/settings/page.tsx` | Same |
| `hooks/use-burner-wallet.ts` | Remove (no longer needed — user brings own wallet) |

---

## 2. Role Selection on First Login

### Flow
1. User connects Solana wallet
2. App checks backend API (`GET /users/:wallet`) for existing role:
   - **Found** → route to appropriate dashboard based on stored role
   - **Not found** → show **Role Selection Screen**
3. Role Selection Screen:
   - **Creator Button**: "I want to create pools and bounties"
   - **Editor Button**: "I want to participate in pools and earn SOL"
   - On selection → call `POST /users` with `{ wallet, role }` → persist to backend
   - Then redirect to role-specific dashboard

### New Files
| File | Purpose |
|---|---|
| `context/auth-context.tsx` | React context for wallet address + role |
| `app/onboarding/page.tsx` | Role selection screen (shown once after first wallet connect) |

### Modified Files
| File | Change |
|---|---|
| `components/providers/solana-provider.tsx` | Wrap with `AuthProvider` |
| `app/layout.tsx` | Add auth guard / onboarding redirect logic |

---

## 3. Translation: Full English UI

### Current state
- `app/layout.tsx`: `<html lang="pt-BR">`
- Landing page (`app/page.tsx`): Portuguese text ("Transforme Visualizações em SOL", "Como Funciona", etc.)
- Dashboard: "Creator Hub" (English, keep)
- Create page: Mixed (English forms, Portuguese helper text)
- Bounties page: Mixed (English headings, Portuguese body text)
- Settings/Profile pages: Mostly English

### Changes needed
| File | Change |
|---|---|
| `app/layout.tsx` | `lang="pt-BR"` → `lang="en"`, update title/description |
| `app/page.tsx` | All hero text, section titles, CTA, stats labels |
| `app/bounties/page.tsx` | Headers, descriptions, table labels |
| `app/create/page.tsx` | Helper text, labels |
| `components/layout/sidebar.tsx` | "Not connected", "Abstracted Mode" → plain wallet status |
| `components/layout/header.tsx` | Notification messages, menu labels |

---

## 4. Role-Based Dashboards

### 4a. Creator Dashboard (`/dashboard`)
Current dashboard page repurposed for **creators only**:
- "Create New Pool" CTA (already exists)
- Stats cards showing their pools (total SOL locked, active pools, submissions)
- Table of **their created pools** (status, entries, time left)
- Activity feed of submissions to their pools
- Rename header from "Creator Hub" to "Creator Dashboard"

### 4b. Editor Dashboard (`/editor-dashboard`)
New page for **editors/clippers**:
- **Open Pools Section**: List of available pools to join (with prize, time left, participants)
- **My Participation Section**: Table of pools the editor has joined, with:
  - Pool name, status, their submission link, their current score/rank
  - Claim status if pool has ended
- Stats: total earned, pools participated, best rank

### Modified Files
| File | Change |
|---|---|
| `app/dashboard/page.tsx` | Add role guard; if role == "editor", redirect to `/editor-dashboard` |
| `app/editor-dashboard/page.tsx` | **New file** |
| `app/create/page.tsx` | Add role guard (only creators can access) |
| `components/layout/sidebar.tsx` | Update nav links based on role (Creator sees "Create Pool", Editor sees "Explore Pools") |
| `types/bounty.ts` | Add `Role` type (`'creator' | 'editor'`) |

### Route Protection Summary
| Route | Allowed Roles |
|---|---|
| `/dashboard` | Creator only (redirect Editor to `/editor-dashboard`) |
| `/editor-dashboard` | Editor only |
| `/create` | Creator only (redirect Editor) |
| `/bounties` | All (public marketplace) |
| `/bounties/[id]` | All |
| `/analytics` | Creator only (for now) |
| `/settings` | All |
| `/profile` | All |
| `/support` | All |

---

## 5. Dependencies

### Remove (no longer needed)
- `@dynamic-labs/sdk-react-core`
- `@dynamic-labs/solana`
- `@dynamic-labs/ethereum`
- `@dynamic-labs/sdk-api-core`

### Keep / Ensure
- `@solana/wallet-adapter-react` (already installed)
- `@solana/wallet-adapter-react-ui` (already installed)
- `@solana/wallet-adapter-wallets` (already installed)

---

## 6. API Integration

### Backend endpoints needed
| Endpoint | Purpose |
|---|---|
| `GET /users/:walletAddress` | Check if user exists, return role |
| `POST /users` | Create user with `{ walletAddress, role: 'creator' \| 'editor' }` |
| `GET /users/:wallet/participations` | Get pools the user has joined (for Editor dashboard) |

These can be added to `lib/api.ts`.

---

## 7. Implementation Order

1. Strip Dynamic Labs, set up wallet-only auth via `@solana/wallet-adapter-react`
2. Create `AuthContext` and `onboarding` page for role selection
3. Translate all UI to English
4. Build Editor Dashboard (`/editor-dashboard`)
5. Add role guards to existing routes
6. Update sidebar/header navigation based on role
7. Update `lib/api.ts` with user role endpoints
8. Clean up unused code (burner wallet, debug panels)
9. Test end-to-end flow: connect wallet → select role → dashboard
