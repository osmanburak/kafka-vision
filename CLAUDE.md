# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Critical Rules

### Turkish Language Support (MANDATORY)
- ALL user-facing text MUST have Turkish translations
- Add translations to `frontend/src/lib/i18n.ts` for both `en` and `tr` objects
- Use `t('key')` function from `useTranslation` hook, never hardcode strings
- For dynamic values use template syntax: `t('messagesSent', { count: '5' })`

### Changelog Documentation (MANDATORY)
- ALL changes MUST be documented in `CHANGELOG.md` immediately
- Format: `## [Type] - YYYY-MM-DD` with files affected and impact

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
npm run build        # Production build (TypeScript + Next.js)
npm run lint         # ESLint check
npm run dev          # Development server (port 3000)
```

### Backend (from `backend/` directory)
```bash
npm install          # Install dependencies
npm start            # Start server (port 4001)
npm run dev          # Development with nodemon (auto-restart)
```

### Docker
```bash
docker-compose up -d   # Start both services
docker-compose down    # Stop services
```

## Architecture

```
Frontend (Next.js 14, port 3000) ◄──WebSocket──► Backend (Express, port 4001) ◄──KafkaJS──► Kafka Cluster
                                                         │
                                                         ▼
                                                   LDAP/AD (optional)
```

**Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS, Socket.io-client, Lucide React, @dnd-kit (drag-and-drop)
**Backend**: Express.js (JavaScript), KafkaJS, Socket.io, Passport.js (LDAP auth), session-file-store

## Key Files

| Path | Purpose |
|------|---------|
| `backend/server.js` | Main backend: Kafka connection, REST endpoints, WebSocket events |
| `backend/auth/ldapConfig.js` | Authentication middleware and passport configuration |
| `frontend/src/app/page.tsx` | Main dashboard page with real-time data |
| `frontend/src/lib/i18n.ts` | All translations (EN/TR) - **add new text here first** |
| `frontend/src/lib/types.ts` | TypeScript interfaces: `Topic`, `ConsumerGroup`, `KafkaStatus` |
| `frontend/src/lib/socket.ts` | WebSocket client setup with auto-reconnect |
| `frontend/src/contexts/AuthContext.tsx` | Authentication state management |

## Environment Configuration

**Backend** (`backend/.env`):
```
KAFKA_BROKERS=localhost:9092
FRONTEND_URL=http://localhost:3000
PORT=4001
AUTH_ENABLED=true          # false for no-auth mode
SESSION_SECRET=your-secret
LDAP_ENABLED=true          # Enable LDAP authentication
LDAP_URL=ldap://dc:389
LDAP_BIND_DN=CN=user,DC=domain
LDAP_BIND_PASSWORD=password
LDAP_SEARCH_BASE=DC=domain
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## Data Flow

1. Backend connects to Kafka via KafkaJS with retry logic
2. `getClusterMetadata()` fetches brokers, topics, consumer groups
3. Calculates consumer lag per partition using offset APIs
4. Filters system topics (starting with `__`) and viewer groups
5. Caches results in `statusCache` object
6. Broadcasts `kafkaStatus` event to Socket.io clients
7. Frontend `useEffect` receives updates, renders with translations

## Special Business Logic

**Lag Calculation** (matches kafka-consumer-groups.sh):
```javascript
const lag = isEmptyPartition ? 0 : Math.max(0, Number(logEndOffset - currentOffset));
```

**Empty Partitions**: When `low === high`, partition has no messages, lag = 0

**Consumer Offsets**: `-1` offset means consumer hasn't consumed (shows "No msgs")

**Role-Based Access**:
- Connection Manager: Admin only when `AUTH_ENABLED=true`
- Admin Settings: Admin only
- Message Producer: Admin only

## API Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/auth/check` | No | Check auth status |
| POST | `/api/auth/login` | No | Login |
| POST | `/api/auth/logout` | Yes | Logout |
| GET | `/api/admin/settings` | Admin | Get LDAP settings |
| POST | `/api/admin/settings` | Admin | Save settings |
| POST | `/api/admin/produce-message` | Admin | Send message to topic |
| POST | `/api/topics/create` | Admin | Create new topic |
| DELETE | `/api/topics/:name` | Admin | Delete topic |

## WebSocket Events

| Event | Direction | Data |
|-------|-----------|------|
| `kafkaStatus` | Server→Client | Full cluster status |
| `changeRefreshRate` | Client→Server | New interval in ms |
| `changeBrokers` | Client→Server | New broker string |

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) on push to main/develop:
- Backend: npm ci, lint, test
- Frontend: npm ci, lint, type-check, build
- Docker build test
- Security scan (npm audit)