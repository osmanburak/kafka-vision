# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### Turkish Language Support (MANDATORY)
- ALL user-facing text MUST have Turkish translations
- Add translations to `frontend/src/lib/i18n.ts` for both `en` and `tr` objects
- Use `t('key')` function from `useTranslation` hook, never hardcode strings
- For dynamic values use template syntax: `t('messagesSent', { count: '5' })`
- State translations use `translateState()`, user statuses use `getUserStatusText()`
- Translation values must be flat strings (not nested objects) to satisfy the `TranslationKeys` type

### Changelog Documentation (MANDATORY)
- ALL changes MUST be documented in `CHANGELOG.md` immediately
- Format: `## [Type] - YYYY-MM-DD` where Type is Feature, Fix, Docs, Security, etc.
- Include: description of changes, files modified/added, and impact summary

### Server Control
- NEVER start servers automatically (`npm start`, `npm run dev`)
- User starts frontend/backend manually; ask when testing is needed

### Build Verification (MANDATORY)
- After code changes, run `npm run build` in frontend directory
- Verify TypeScript compiles and ESLint passes (`npm run lint`)

### API Endpoint Rules
- Frontend API calls use: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}`
- NEVER call frontend port (3000) for API
- Include `credentials: 'include'` for authenticated endpoints
- Admin-only endpoints should check `user.role === 'admin'` and `authEnabled`

## Common Commands

### Frontend (from `frontend/` directory)
```bash
npm install          # Install dependencies
npm run build        # Production build (TypeScript + Next.js) — also serves as type-check
npm run lint         # ESLint check
npm run dev          # Development server (port 3000)
```

### Backend (from `backend/` directory)
```bash
npm install          # Install dependencies
npm start            # Start server (port 4001) — runs node server.js
npm run dev          # Development with nodemon (auto-restart)
```

### Docker
```bash
docker-compose up -d   # Start both services
docker-compose down    # Stop services
```

**Note:** There is no test framework configured in either frontend or backend. CI runs `npm test --if-present` with `continue-on-error: true`.

## Architecture

```
Frontend (Next.js 14, port 3000) ◄──WebSocket──► Backend (Express, port 4001) ◄──KafkaJS──► Kafka Cluster
                                                         │
                                                         ▼
                                                   LDAP/AD (optional)
```

**Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Socket.io-client, Lucide React, @dnd-kit (drag-and-drop)
**Backend**: Express.js (JavaScript — not TypeScript), KafkaJS, Socket.io, Passport.js (LDAP auth), session-file-store

### Backend is a monolith
`backend/server.js` (~1850 lines) contains all REST endpoints, WebSocket handlers, and Kafka operations in a single file. There is no router separation. The Kafka admin client is created per-request rather than being reused.

### Real-time data flow
1. Backend connects to Kafka via KafkaJS with retry logic
2. `getClusterMetadata()` fetches brokers, topics, consumer groups on a configurable interval
3. Calculates consumer lag per partition using offset APIs
4. Filters system topics (starting with `__`) and internal viewer groups (starting with `kafka-monitor-viewer-`)
5. Caches results in `statusCache` object
6. Broadcasts `kafkaStatus` event to all Socket.io clients
7. Frontend `useEffect` receives updates, renders with translations

### WebSocket (Socket.io)
- Client uses a singleton pattern in `frontend/src/lib/socket.ts` (`getSocket()` / `disconnectSocket()`)
- Server emits: `kafkaStatus` (full cluster status), `refreshRateChanged`
- Client sends: `changeRefreshRate` (interval in ms), `changeBrokers` (broker string)
- Reconnection: 5 attempts, 1s delay, `withCredentials: true`

### Authentication flow
- `AuthContext.tsx` manages auth state with `useAuth()` hook
- Login response can have `pendingApproval`, `rejected`, or `success` flags
- LDAP users require admin approval before accessing the dashboard
- `checkApprovalStatus()` polls and triggers page reload on approval
- Socket disconnects on logout
- Backend middleware: `isAuthenticated` (session check), `isAdmin` (role + authEnabled check)
- Sessions stored as files in `./sessions` directory (important for deployment persistence)

## Key Files

| Path | Purpose |
|------|---------|
| `backend/server.js` | Main backend: all Kafka operations, REST endpoints, WebSocket events |
| `backend/auth/ldapConfig.js` | Passport.js config with LDAP strategy + local admin fallback |
| `backend/utils/encryption.js` | Encrypt/decrypt LDAP settings using session secret |
| `backend/utils/userManager.js` | User data persistence and approval workflow |
| `backend/utils/logger.js` | Centralized backend logging |
| `backend/utils/replaceConsoleLogs.js` | One-shot migration script that rewrites `console.*` calls to use the logger |
| `backend/debug-ldap.js`, `backend/test-ldap.js` | Standalone LDAP troubleshooting scripts — useful when auth fails |
| `frontend/src/app/page.tsx` | Main dashboard — state management, socket listeners, drag-and-drop |
| `frontend/src/lib/i18n.ts` | All translations (EN/TR ~200 keys per language) — **add new text here first** |
| `frontend/src/lib/types.ts` | TypeScript interfaces: `Broker`, `Topic`, `ConsumerGroup`, `KafkaStatus` |
| `frontend/src/lib/socket.ts` | Socket.io singleton with auto-reconnect |
| `frontend/src/lib/logger.ts` | Frontend logging counterpart |
| `frontend/src/contexts/AuthContext.tsx` | Auth state, login/logout, approval polling |

### Admin-only components
Gated behind `user.role === 'admin'` (enforced only when `AUTH_ENABLED=true`):
`AdminSettings.tsx`, `ConnectionManager.tsx`, `TopicCreator.tsx`, `DeleteTopicConfirmation.tsx`, `MessageComposer.tsx`.

## Special Business Logic

**Lag Calculation** (matches kafka-consumer-groups.sh):
```javascript
const lag = isEmptyPartition ? 0 : Math.max(0, Number(logEndOffset - currentOffset));
```

- **Empty Partitions**: When `low === high`, partition has no messages, lag = 0
- **Consumer Offsets**: `-1` offset means consumer hasn't consumed (shows "No msgs")
- **Partition details**: `consumerOffsets` is typed as `Record<string, { currentOffset: string; lag: number }>`

**Role-Based Access** (only enforced when `AUTH_ENABLED=true`):
- Connection Manager, Admin Settings, Message Producer, Topic Creator/Deleter: Admin only

**Dashboard state persistence**: Favorite topics, card order, panel order, dark mode, and language are stored in the page component state (currently not persisted across sessions).

## Environment Configuration

**Backend** (`backend/.env`, see `backend/.env.example`):
```
KAFKA_BROKERS=localhost:9092
FRONTEND_URL=http://localhost:3000
PORT=4001
AUTH_ENABLED=true
SESSION_SECRET=your-secret
LDAP_ENABLED=true
LDAP_URL=ldap://dc:389
LDAP_BIND_DN=CN=user,DC=domain
LDAP_BIND_PASSWORD=password
LDAP_SEARCH_BASE=DC=domain
LDAP_SEARCH_FILTER=(sAMAccountName={{username}})
LOCAL_ADMIN_PASSWORD=your-admin-password
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## API Endpoints

### Authentication
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/auth/check` | No | Check auth status |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/auth/check-approval` | No | Check if pending user is approved |

### Admin - Settings & Users
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/admin/settings` | Admin | Get LDAP settings |
| POST | `/api/admin/settings` | Admin | Save settings |
| POST | `/api/admin/test-ldap` | Admin | Test LDAP connection |
| GET | `/api/admin/users` | Admin | List all users |
| POST | `/api/admin/users/:username/approve` | Admin | Approve pending user |
| POST | `/api/admin/users/:username/reject` | Admin | Reject pending user |
| DELETE | `/api/admin/users/:username` | Admin | Delete user |
| PUT | `/api/admin/users/:username/role` | Admin | Change user role |

### Admin - Kafka Operations
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/admin/produce-message` | Admin | Send single message to topic |
| POST | `/api/admin/produce-messages` | Admin | Send batch messages to topic |
| POST | `/api/admin/create-topic` | Admin | Create new topic |
| DELETE | `/api/admin/delete-topic` | Admin | Delete topic |

### Kafka Data
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/status` | Yes | Get full Kafka status |
| GET | `/api/topics/:topicName` | Yes | Get topic details |
| GET | `/api/messages/:topicName/:partition` | Yes | Read messages from partition |
| GET | `/api/current-connection` | Yes | Get current broker connection |
| POST | `/api/change-connection` | Yes | Switch Kafka broker |
| POST | `/api/test-connection` | Yes | Test broker connectivity |
| GET | `/api/health` | No | Health check endpoint |

## Deployment Artifacts

Several deployment helpers live at the repo root — know they exist before adding new ones:
- `ecosystem.config.js` — PM2 process config (production)
- `docker-compose.yml` + `backend/Dockerfile` — containerized deployment
- `start*.bat` / `stop*.bat` (Windows) and `start*.sh` / `stop*.sh` (Linux) — per-service and combined launchers
- `auto-install.bat` / `auto-install.sh` — one-shot install scripts
- `DEPLOYMENT.md` — deployment walkthroughs; `FEATURES.md` — user-facing feature catalog

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) on push to main/develop or PR to main:
- **test-backend**: `npm ci`, lint (if-present), test (if-present)
- **test-frontend**: `npm ci`, lint (if-present), type-check (if-present), `npm run build`
- **docker-build**: Builds both Docker images (requires test jobs to pass)
- **security-scan**: `npm audit` on both (continues on error)
- Node.js version: 18
