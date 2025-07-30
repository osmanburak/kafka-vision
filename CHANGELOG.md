# Changelog

All notable changes to the Kafka Status Monitor project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Feature] - 2025-07-30

### Added
- **Admin Message Producer Feature for Kafka Topics**
  - Admin users can now send messages directly to Kafka topics from the topic list
  - New MessageComposer modal component with JSON validation and partition selection
  - Backend endpoint `/api/admin/produce-message` with admin-only access control
  - Features include:
    - Message key (optional) and value (required) input fields
    - Automatic partition selection or manual partition specification
    - JSON syntax validation when content appears to be JSON
    - Success feedback showing partition and offset details
    - Error handling with detailed error messages
  - Integrates directly into topic list with Send button for quick access
  - Complete bilingual support (English/Turkish) for all UI elements

### Fixed
- **TypeScript Build Error from Duplicate Translation Keys**
  - Fixed duplicate 'offset' key in translations file at lines 67/77 (English) and 234/244 (Turkish)
  - Removed redundant translation keys to resolve compilation error
  - Build now completes successfully without TypeScript errors

- **Message Viewer Eye Icon Missing for Unconsumed Partitions**
  - Fixed issue where eye icon to view messages was not shown for partitions with "No msgs" current offset
  - Changed condition from `lag > 0` to `!isEmptyPartition` to show eye icon whenever partition has messages
  - Now allows viewing messages even when consumer has never consumed from partition (offset = -1)
  - Enables viewing all available messages in partitions regardless of consumer state

- **Incorrect Lag Calculation for Unconsumed Partitions**
  - Fixed lag showing as 0 for partitions where consumer has never consumed but messages exist
  - Added proper detection of never-consumed partitions (offset = -1)
  - Lag now correctly shows total available messages when consumer has never consumed
  - Example: Partition with 1 message and no consumption now shows lag = 1 (not 0)

- **Security: Restricted Connection Manager Access to Admins Only**
  - Fixed issue where LDAP users with "user" role could access Connection Manager
  - Connection Manager is now restricted to admin users only (admin role + auth enabled)
  - Regular users can only access Settings panel for language/refresh rate changes
  - Maintains proper role-based access control in authenticated environments

**Files Modified:**
- `frontend/src/components/MessageComposer.tsx` (NEW) - Complete modal for message composition
- `backend/server.js` - Added admin message producer endpoint with KafkaJS integration
- `frontend/src/lib/i18n.ts` - Added message producer translations and fixed duplicate keys
- `frontend/src/components/TopicDetails.tsx` - Integrated Send button and MessageComposer
- `frontend/src/app/page.tsx` - Updated to pass authentication props

**Impact:** Admin users can now produce messages to Kafka topics directly from the monitoring interface, providing comprehensive Kafka management capabilities

## [Feature] - 2025-07-29

### Added
- **Topic Search/Filter Functionality**:
  - Added search box in Topics panel to filter topics by name
  - Real-time filtering as user types
  - Clear button (X) to reset search
  - Search icon for better UX
  - Updates topic count to show filtered results
  - Works in combination with "Show Behind Only" filter
  - Bilingual support (English: "Search topics...", Turkish: "Topic ara...")
  
**Files Modified:**
- `frontend/src/app/page.tsx` - Added search state, filtering logic, and search UI
- `frontend/src/lib/i18n.ts` - Added translations for searchTopics and filtered

**Impact:** Users can now quickly find specific topics in large Kafka clusters

## [Documentation] - 2025-07-29

### Added
- **New Critical Rule in CLAUDE.md**: MANDATORY BUILD & CI/CD VERIFICATION
  - Added rule to always verify `npm run build` succeeds after code changes
  - Ensures TypeScript compilation and ESLint checks pass
  - Verifies Docker images build successfully
  - Confirms CI/CD pipeline readiness
  - Prevents deployment failures by catching issues early

- **Screenshot Documentation**:
  - Created `docs/images/` directory for screenshots
  - Added screenshot guide (`docs/SCREENSHOT_GUIDE.md`) with detailed instructions
  - Updated README.md with proper screenshot placeholders and upload instructions
  - Specified requirements for dashboard (light/dark) and admin settings screenshots
  - Fixed 404 errors by linking to actual screenshot images in docs/images/
  - Screenshots show: dashboard light mode, dashboard dark mode, and admin settings panel
  
**Files Modified:**
- `CLAUDE.md` - Added new mandatory rule section for build and CI/CD verification
- `README.md` - Updated screenshot section with proper placeholders and instructions
- `docs/images/README.md` - Created with screenshot requirements
- `docs/SCREENSHOT_GUIDE.md` - Created comprehensive screenshot guide

**Impact:** 
- All future development sessions must verify build success before considering work complete
- Contributors now have clear guidance on how to add professional screenshots

## [GitHub Ready] - 2025-07-29

### Added
- **Project Renamed to KafkaVision**
  - Updated project name from "Kafka Status Monitor" to "KafkaVision"
  - Tagline: "Complete visibility into your Kafka clusters"
  - Updated all references across README.md, package.json files, translations, and scripts
  - Professional branding suitable for GitHub community and enterprise adoption
  - Files modified: README.md, package.json (both), i18n.ts, CLAUDE.md, LICENSE, ecosystem.config.js, CI workflows, start scripts
  - Repository will be created as `kafka-vision` instead of `kafka-status-monitor`

- **GitHub Repository Preparation**
  - Created comprehensive `.gitignore` file excluding sensitive data (sessions, logs, user data, .env files)
  - Updated README.md with professional GitHub formatting, badges, and complete documentation
  - Added MIT License for open source distribution
  - Created PM2 ecosystem configuration for production deployment
  - Added Docker support with multi-stage builds and health checks
  - Created GitHub Actions CI/CD pipeline with testing, security scans, and Docker builds
  - Added issue templates for bug reports and feature requests
  - Created pull request template with comprehensive checklist
  - Files added:
    - `.gitignore`, `LICENSE`, `ecosystem.config.js`, `docker-compose.yml`
    - `backend/Dockerfile`, `frontend/Dockerfile`
    - `.github/workflows/ci.yml`, `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`
  - Impact: Project is now ready for public GitHub repository with professional setup

## [BugFix] - 2025-07-29

### Fixed
- **LDAP Admin Users Can Now Access Admin Settings**
  - Fixed 403 "Admin privileges required" error for LDAP users with admin role
  - Root cause: Admin settings routes were using `isLocalAdmin` middleware (local admin only)
  - **Solution**: Changed admin settings routes to use `isAdmin` middleware (both local and LDAP admin)
  - LDAP users with admin role can now access LDAP configuration, user management, and all admin features
  - Files modified:
    - `backend/server.js`: Updated `/api/admin/settings` (GET/POST) and `/api/admin/test-ldap` routes
  - Routes changed: GET/POST `/api/admin/settings`, POST `/api/admin/test-ldap`
  - Impact: LDAP administrators now have full admin access as intended

## [Feature] - 2025-07-28

### Added
- **Optional Authentication Mode**
  - Authentication can now be completely disabled for internal/development deployments
  - Set `AUTH_ENABLED=false` in `.env` file to disable authentication
  - When disabled, system automatically logs in as "Development User" with full admin access
  - Perfect for internal monitoring tools that don't need authentication
  - Production deployments can still use full authentication (LDAP + local admin)
  - Files modified:
    - `backend/server.js`: Updated `/api/auth/check` endpoint to handle auth-disabled mode
    - `frontend/src/contexts/AuthContext.tsx`: Modified to auto-login when auth is disabled
    - `backend/.env.example`: Created example configuration file showing how to disable auth
  - Usage: Simply set `AUTH_ENABLED=false` in your `.env` file for no-auth mode
  
- **Enhanced No-Auth Mode User Experience**
  - Logout button is now hidden when authentication is disabled
  - Admin Settings button is now hidden when authentication is disabled
  - Connection Manager remains available for switching Kafka clusters (useful in no-auth mode)
  - Development user in no-auth mode sees only monitoring features, no auth-related options
  - Clean profile menu without authentication management options
  - Files modified:
    - `frontend/src/contexts/AuthContext.tsx`: Added authEnabled state tracking
    - `frontend/src/components/ProfileMenu.tsx`: Conditionally hide logout and admin settings based on authEnabled
    - `frontend/src/app/page.tsx`: Pass authEnabled prop to ProfileMenu
  - Impact: Cleaner UI in no-auth mode without confusing authentication options


## [BugFix] - 2025-07-28

### Fixed
- **Nodemon Auto-Restart Issue Causing Port Conflicts**
  - Fixed "EADDRINUSE" errors where backend server couldn't restart due to port 4001 conflicts
  - Root cause: Nodemon auto-restart was causing multiple processes to compete for the same port
  - **Solution**: Stopped all conflicting processes (PIDs 97880, 20140) and restarted in production mode
  - Changed startup mode from `npm run dev` (nodemon) to `npm start` (production) to prevent auto-restarts
  - Server now runs stably without file-watching restart conflicts
  - Files affected: Backend startup process, eliminated nodemon file watching
  - Impact: Backend server no longer restarts automatically on file changes, preventing port conflicts

- **Critical Session Persistence Issue**
  - Fixed 401 authentication errors after changing user status or role
  - Root cause: Server restarts (due to nodemon file watching) were destroying in-memory sessions
  - **Solution**: Implemented persistent file-based session storage using `session-file-store`
  - Sessions now survive server restarts, preventing authentication loss during admin operations
  - Added `.gitignore` for session files to prevent committing sensitive session data
  - This completely resolves the 401 errors that occurred when refreshing after user management operations
  - Files modified: `backend/server.js` (session configuration), `backend/.gitignore` (new file)

- **StatusCache Race Condition Fix**
  - Fixed dashboard getting stuck on "connecting" for all users
  - Root cause: Race condition between HTTP and WebSocket requests accessing empty statusCache
  - WebSocket connections were getting uninitialized cache while HTTP requests populated it
  - **Solution**: WebSocket connections now detect empty cache and fetch fresh data immediately
  - Restored proper WebSocket authentication after identifying the real issue
  - Added comprehensive logging to track cache state and data flow
  - Files modified: `backend/server.js` (WebSocket cache handling and authentication)

- **Local Admin Role Property Fix**  
  - Added missing `role: 'admin'` property to local user authentication object
  - Files modified: `backend/auth/ldapConfig.js` (authenticateLocal function)

- **WebSocket Connection Stability**
  - Enhanced WebSocket authentication flow with session loading delays
  - Added 100ms delay for WebSocket authentication to allow file-based session loading
  - Enhanced frontend WebSocket event handling with reconnection status tracking
  - Files modified: `backend/server.js` (WebSocket auth timing), `frontend/src/app/page.tsx` (reconnection handling)

- **User Role Update Session Persistence**
  - Added session role update for currently logged-in users when their role is changed
  - When an admin changes a user's role and that user is currently logged in, their session is immediately updated
  - Prevents need for re-login after role changes (secondary fix to complement persistent sessions)
  - Files modified: `backend/server.js` (role update endpoint)

## [BugFix] - 2025-07-27

### Fixed
- **WebSocket Authentication Issues**
  - Fixed WebSocket session authentication failing after successful HTTP login
  - Added proper Passport.js initialization for WebSocket connections
  - Enhanced session sharing between HTTP requests and WebSocket connections
  - Added detailed debugging for WebSocket session troubleshooting
  - Increased WebSocket connection delay to ensure session establishment
  - Added better error handling and logging for connection failures
  
- **Session Management Improvements**
  - Added explicit session saving after successful login for both local and LDAP users
  - Enhanced debugging for HTTP authentication middleware
  - Added detailed session state logging for troubleshooting
  - Improved session persistence across authentication flows

- **Critical Encryption Fix**
  - Fixed "Session secret is missing or empty for encryption operations" error
  - Updated userManager.js to properly pass SESSION_SECRET to encryption functions
  - All user data encryption/decryption now works correctly
  - Prevents authentication failures during LDAP user login

- **Session Cookie Configuration Fix**
  - Fixed session cookies not being preserved between login and API calls
  - Changed `secure: false` to allow cookies over HTTP (was blocking in development)
  - Set `sameSite: false` to allow cross-origin cookies between localhost:3000 and localhost:4001
  - Resolves "Authentication required" errors after successful LDAP login
  - Ensures session persistence across all API and WebSocket connections
  - Critical fix for cross-origin cookie sharing in development environment
  
- **Next.js Proxy Configuration**
  - Added API proxy configuration to avoid cross-origin cookie issues
  - All API calls now go through Next.js server, eliminating CORS problems
  - Updated all frontend API calls to use relative URLs instead of absolute
  - Fixed Socket.io connection to use proxied path
  - This ensures session cookies work properly between frontend and backend
  
### Technical Details
- Files modified: `backend/server.js`, `frontend/src/app/page.tsx`, `backend/utils/userManager.js`, `backend/auth/ldapConfig.js`, `frontend/next.config.js`, `frontend/src/contexts/AuthContext.tsx`, `frontend/src/lib/socket.ts`
- Added passport middleware to Socket.io session chain
- Fixed userManager encryption functions to properly use SESSION_SECRET environment variable
- Enhanced authentication debugging throughout the system
- Implemented Next.js rewrites to proxy API requests
- Enhanced WebSocket debugging with session object inspection
- Improved frontend connection timing and error handling

## [Feature] - 2025-01-27

### Added
- **LDAP User Permission System**
  - New user approval workflow for LDAP authentication
  - Users must be approved by local admin before accessing the dashboard
  - Pending approval screen with clear messaging in both English and Turkish
  - User management interface in Admin Settings
  - Complete bilingual support for all permission features

- **User Management Features**
  - User list with status indicators (Pending, Active, Rejected)
  - Admin can approve, reject, or delete users
  - Role management (User/Admin) for active users
  - Last login tracking
  - Encrypted storage of user information

- **Pending Approval UX Enhancement**
  - Added "Check Status" refresh button on pending approval screen
  - Users can check if they've been approved without logging out/in
  - Automatic login when status changes from pending to active
  - Real-time status updates with loading indicators
  - Bilingual support for all refresh functionality

- **Language Selection on Login Screen**
  - Added language selector in top-right corner of login screen
  - Users can switch between English and Turkish before logging in
  - Language preference is stored in localStorage and persists across sessions
  - Also available on pending approval screen for consistency
  - Clean, accessible design with globe icon and native language names

- **Enhanced Security**
  - Permission-based access control after LDAP authentication
  - Automatic user record creation on first login attempt
  - Status tracking (pending → active/rejected)
  - Audit trail with approvedBy and approvedAt timestamps

### Technical Implementation
- Created `backend/utils/userManager.js` for user data management
- Added `backend/data/users.json` for encrypted user storage
- Updated authentication flow in `backend/server.js` to check permissions
- Implemented session-based pending user storage for seamless status refresh
- Added user management API endpoints:
  - GET `/api/admin/users` - List all users
  - POST `/api/admin/users/:username/approve` - Approve user
  - POST `/api/admin/users/:username/reject` - Reject user
  - DELETE `/api/admin/users/:username` - Delete user
  - PUT `/api/admin/users/:username/role` - Update user role
  - GET `/api/auth/check-approval` - Check pending user status and auto-login if approved
- Created `frontend/src/components/PendingApproval.tsx` component
- Enhanced `AdminSettings.tsx` with user management tab
- Updated `AuthContext` to handle pending approval states and status refresh
- Enhanced `PendingApproval.tsx` with refresh button and auto-login capability
- Added language selector to `Login.tsx` and `PendingApproval.tsx` components
- Implemented persistent language storage using localStorage
- Added comprehensive Turkish translations for all new features

### Fixed
- **Dark Mode Styling Issues**
  - Fixed text visibility in Admin Settings modal headers and labels
  - Improved contrast for User Management table headers and cells
  - Enhanced dark mode colors for form inputs and buttons
  - Fixed icon colors to be visible in dark mode
  - Updated status badges and action buttons for better visibility
  - Ensured all text elements have proper dark mode text colors
  - Fixed language selector dropdown visibility in dark mode on login and pending approval screens
  - Enhanced dropdown option contrast and background colors for better readability
  - Fixed missing dark mode styling for pending approval screen title and buttons
  - Added missing Turkish translation for accessibility labels
  - Enhanced button contrast and hover states for dark mode

- **LDAP Authentication Improvements**
  - Fixed deprecated `.vals` property warning by using `.values` with fallback compatibility
  - Enhanced DN format handling with better error logging
  - Improved error messages for failed authentication attempts
  - Added connection error handling for LDAP bind operations
  - Enhanced logging with detailed DN format attempts and failures

### Fixed - 2025-01-27 (Latest)

- **MessageViewer Authentication & Dark Mode Fixes**
  - Fixed "Failed to fetch messages" error by adding missing credentials to API call
  - Added `credentials: 'include'` to MessageViewer fetch request for proper authentication
  - Enhanced error logging in backend message fetching endpoint
  - Added try-catch around consumer seek operation to handle seek failures gracefully
  - Fixed dark mode styling for MessageViewer footer border and text colors
  - Fixed dark mode styling for Eye icon button in TopicDetails (hover state and icon color)
  - Files affected:
    - `frontend/src/components/MessageViewer.tsx`: Added credentials to fetch request, fixed dark mode footer
    - `frontend/src/components/TopicDetails.tsx`: Fixed dark mode styling for view messages button
    - `backend/server.js`: Enhanced error handling and logging for message fetching API

- **Authentication Flow Fix**
  - Fixed admin user attempting LDAP authentication when it should use local auth
  - Reordered authentication flow to check local users first before trying LDAP
  - Added LDAP_ENABLED environment variable check to skip LDAP when disabled
  - Eliminated unnecessary LDAP DN format attempts for local admin user
  - Improved logging to distinguish between local and LDAP authentication attempts
  - Files affected:
    - `backend/server.js`: Reordered authentication flow and added LDAP_ENABLED check

- **Backend Server Syntax Fixes**
  - Fixed syntax errors that were preventing backend server startup
  - Corrected missing parentheses in `req.logIn` callback functions
  - Fixed indentation and closing braces in LDAP authentication block
  - Resolved "Unexpected token 'catch'" and "missing ) after argument list" errors
  - Backend server now starts correctly without syntax errors
  - Files affected:
    - `backend/server.js`: Fixed syntax errors and proper code block structure

- **Connection Manager Test Fix**
  - Fixed Connection Manager test connection feature failing due to missing authentication
  - Added `credentials: 'include'` to test connection API calls for proper session handling
  - Enhanced error handling with specific authentication error messages
  - Fixed backend test connection endpoint to return proper HTTP status codes on failure
  - Added detailed logging for test connection attempts and failures
  - Improved error messages to distinguish between authentication and connection issues
  - Files affected:
    - `frontend/src/components/ConnectionManager.tsx`: Added credentials and better error handling
    - `backend/server.js`: Enhanced logging and proper HTTP status codes for test connection

- **Login Password Visibility Toggle**
  - Added password visibility toggle feature to login form for better user experience
  - Users can now click eye icon to show/hide password while typing
  - Improved accessibility with proper ARIA labels in both English and Turkish
  - Fully responsive design with proper dark mode support
  - Toggle button disabled during login process to prevent interference
  - Enhanced password input with proper right padding for toggle button
  - Files affected:
    - `frontend/src/components/Login.tsx`: Added password visibility toggle with Eye/EyeOff icons
    - `frontend/src/lib/i18n.ts`: Added translations for "Show password" and "Hide password" features

- **Enhanced LDAP Authentication Flow**
  - Fixed authentication flow to ensure proper user routing: admin=local, all others=LDAP only
  - Added `LDAP_ENABLED=true` to environment configuration to enable LDAP authentication
  - Enhanced authentication logging with clear indicators (🔐 📋 🌐 ✅ ❌) for better debugging
  - Improved error messages to distinguish between LDAP disabled vs LDAP authentication failure
  - Added detailed authentication settings logging for troubleshooting
  - Fixed authentication flow logic to prevent unexpected behavior for non-admin users
  - Files affected:
    - `backend/.env`: Added LDAP_ENABLED=true to enable LDAP authentication
    - `backend/server.js`: Enhanced authentication flow with better logging and error handling

- **Fixed LDAP User Session and Encryption Issues**
  - Fixed "Authentication required" errors for LDAP users after successful login
  - Added missing `isLocal: false` property to LDAP user objects for proper frontend role detection
  - Fixed encryption error by improving session secret validation and error messages
  - Enhanced passport user serialization to include role and isLocal properties
  - Prevented LDAP users from accessing admin-only endpoints (properly restricted to local admin)
  - Improved error logging for encryption operations with better debugging information
  - Files affected:
    - `backend/server.js`: Added isLocal property to LDAP user response
    - `backend/auth/ldapConfig.js`: Enhanced user serialization with role and isLocal properties
    - `backend/utils/encryption.js`: Improved session secret validation and error handling

- **Fixed Session Persistence and Authentication Issues**
  - Fixed intermittent "Authentication required" errors after successful LDAP login
  - Added missing `credentials: 'include'` to connection change and status refresh API calls
  - Enhanced session configuration with rolling sessions and proper cookie settings
  - Improved WebSocket authentication logging for better debugging
  - Fixed session expiration issues by adding `rolling: true` and `sameSite: 'lax'` settings
  - Enhanced authentication middleware with detailed debugging information
  - Resolved WebSocket disconnection issues due to session authentication failures
  - Files affected:
    - `frontend/src/app/page.tsx`: Added missing credentials to API calls
    - `backend/server.js`: Enhanced session configuration for better persistence
    - `backend/auth/ldapConfig.js`: Improved authentication middleware logging

## [Feature] - 2025-01-26

### Added
- **Admin Settings Interface**
  - Web-based configuration panel for LDAP and application settings
  - Admin-only access control (requires local admin login)
  - Real-time LDAP connection testing before saving settings
  - Bilingual interface (English/Turkish) for all admin settings
  - Automatic .env file management through web interface

- **Enhanced Security with Encryption**
  - AES-256-GCM encryption for sensitive LDAP credentials in .env file
  - Encrypted storage of LDAP Bind DN, Bind Password, and Search Base
  - Session secret-based key derivation for consistent encryption/decryption
  - Automatic encryption/decryption handling with ENC: prefixed values
  - Security best practices: passwords never exposed to frontend

- **LDAP Configuration Management**
  - Enable/disable LDAP authentication toggle
  - LDAP server URL configuration
  - Encrypted bind DN and password settings
  - Encrypted search base configuration
  - Search filter customization
  - TLS rejection settings
  - Live connection testing with detailed error reporting

- **Application Settings Management**
  - Session secret configuration
  - Local admin password changes
  - Settings persistence with automatic restart prompts

### Fixed
- **LDAP Authentication Issues**
  - Fixed "TypeError: stringToWrite must be a string" error in Active Directory authentication
  - Improved LDAP entry parsing to handle different AD response formats
  - Added support for multiple DN formats (original DN, UPN format, DOMAIN\user format)
  - Enhanced error handling and debugging for LDAP authentication process
  - Fixed async/await syntax errors in LDAP authentication callback functions
  - Updated search filter for more specific user targeting: `(sAMAccountName={{username}})`

### Technical Details
- Created `AdminSettings.tsx` component with comprehensive settings interface
- Implemented `backend/utils/encryption.js` for AES-256-GCM encryption utilities
- Added admin-only API endpoints: `/api/admin/settings`, `/api/admin/test-ldap`
- Modified `backend/auth/ldapConfig.js` to handle encrypted environment variables
- Enhanced `backend/server.js` with encrypted settings management and role-based access control
- Added bilingual translations for all admin interface elements
- Implemented automatic .env file updates with encrypted sensitive values

## [Initial Release] - 2025-01-24

### Added
- **Real-time Kafka Monitoring System**
  - Next.js 14 frontend with TypeScript and Tailwind CSS
  - Node.js/Express backend with KafkaJS integration
  - WebSocket-based real-time updates using Socket.io

- **Core Monitoring Features**
  - Kafka cluster information display (brokers, controller)
  - Topic monitoring with message counts and partition details
  - Consumer group monitoring with member information
  - Real-time consumer lag calculation matching kafka-consumer-groups.sh behavior

- **Multilingual Support (i18n)**
  - English and Turkish language support
  - Complete UI translation coverage
  - Dynamic state translations for consumer group states
  - Persistent language preferences via localStorage

- **User Interface Components**
  - Responsive dashboard with expandable topic/consumer group details
  - Settings panel for language and refresh rate configuration
  - Statistics cards showing Total Messages, Consumed, Remaining, and Connection status
  - Clean, modern design with Lucide React icons

- **Configurable Refresh Rates**
  - User-selectable refresh intervals: 5s, 10s, 15s, 30s, 60s
  - Real-time synchronization across all connected clients
  - Backend dynamic interval adjustment via WebSocket

- **Data Processing Logic**
  - System topic filtering (removes __consumer_offsets and other __ prefixed topics)
  - Proper handling of empty partitions (low === high)
  - Accurate lag calculation for unconsumed partitions (offset = -1)
  - Performance optimization with topic/group limits (20/10 respectively)

- **Connection Management**
  - Automatic WebSocket reconnection
  - Connection status indicators
  - Graceful error handling and recovery
  - CORS configuration for cross-origin requests

### Technical Details
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Socket.io Client
- **Backend**: Node.js, Express.js, KafkaJS, Socket.io Server
- **Kafka Integration**: Remote Kafka cluster at 192.168.1.189:9092
- **Ports**: Backend (4001), Frontend (3000)
- **Environment**: Windows 11 development environment

### Configuration
- Environment-based configuration with .env files
- Configurable Kafka broker addresses
- Adjustable connection timeouts and retry logic

---

## [Documentation Update] - 2025-01-24

### Added
- **Comprehensive Unix Deployment Guide** in CLAUDE.md
  - Manual deployment steps with file transfer and setup
  - Production deployment with PM2 process manager
  - Nginx reverse proxy configuration with WebSocket support
  - Systemd service configuration as PM2 alternative
  - Docker deployment with Dockerfile and docker-compose.yml
  - Firewall configuration for Ubuntu and CentOS/RHEL
  - Monitoring, logging, and troubleshooting commands
  - Backup and update procedures
  - Security considerations and best practices

### Technical Details
- **8 deployment methods** covering different Unix environments
- **Complete configuration examples** for all components
- **Step-by-step commands** for each deployment approach
- **Service management** with PM2, systemd, and Docker
- **Nginx proxy setup** with proper WebSocket handling
- **Security guidelines** for production environments

---

## [Bug Fix] - 2025-01-24

### Fixed
- **Incorrect lag calculation for unconsumed partitions**
  - Issue: Partitions showing Current="No msgs" (offset -1) but having incorrect lag values
  - Root cause: Backend was calculating lag as LOG-END-OFFSET - (-1) instead of proper logic
  - Solution: Implemented correct lag calculation logic:
    1. Empty partition (low = high): lag = 0 (no messages to consume)
    2. Never consumed (offset = -1): lag = total messages in partition (high - low)
    3. Normal case: lag = LOG-END-OFFSET - CURRENT-OFFSET

### Technical Details
- **File affected**: `backend/server.js` - consumer lag calculation logic
- **Impact**: More accurate lag reporting for unconsumed partitions
- **Behavior**: Partitions with "No msgs" current offset now show correct lag values

---

## [Debug Enhancement] - 2025-01-24

### Added
- **Debug logging for lag calculation issues**  
  - Added console logs to trace consumer group lag calculations
  - Added final topic-level calculation logging
  - Helps diagnose cases where partition lag = 0 but topic shows total messages as "behind"

### Technical Details
- **File affected**: `backend/server.js` - added debugging console.log statements
- **Purpose**: Troubleshoot inconsistency between partition-level and topic-level lag display
- **Issue**: When diff(lag) = 0, topic summary incorrectly shows total messages as "behind"

---

## [Translation Fix] - 2025-01-24

### Fixed
- **Missing Turkish translation for "Status" label**
  - Issue: "Status" label in partition details summary was not translated
  - Added translation: "Status" → "Durum" (Turkish)
  - Location: Partition details summary line in TopicDetails component

### Technical Details
- **Files affected**: 
  - `frontend/src/lib/i18n.ts` - added 'status' translation key
  - `frontend/src/components/TopicDetails.tsx` - applied translation to status label
- **Translation**: English "Status" → Turkish "Durum"

---

## [UI Enhancement] - 2025-01-24

### Added
- **Alphabetical sorting for topics and consumer groups**
  - Topics are now displayed in alphabetical order for easier navigation
  - Consumer groups are also sorted alphabetically for consistency
  - Sorting applied after filtering out system topics (starting with __)

### Technical Details
- **File affected**: `backend/server.js` 
- **Implementation**: 
  - Topics: `topics.sort()` after filtering system topics
  - Consumer groups: `groups.sort((a, b) => a.groupId.localeCompare(b.groupId))`
- **Impact**: Improved user experience with predictable, sorted display order

---

## [Sorting Enhancement] - 2025-01-24

### Changed
- **Updated sorting to be case-insensitive**
  - Topics now sorted case-insensitively (e.g., "Apple", "banana", "Cherry")
  - Consumer groups also sorted case-insensitively  
  - Ensures consistent alphabetical order regardless of capitalization

### Technical Details
- **File affected**: `backend/server.js`
- **Implementation**: 
  - Topics: `.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))`
  - Consumer groups: `.sort((a, b) => a.groupId.toLowerCase().localeCompare(b.groupId.toLowerCase()))`
- **Improvement**: More intuitive sorting that treats "Apple" and "apple" as adjacent items

---

## [Feature Addition] - 2025-01-24

### Added
- **Filter for topics with behind messages**
  - Toggle button to show only topics that have lag (behind messages)
  - Button displays "Show Behind Only" / "Show All" 
  - Orange styling when filter is active to indicate filtered view
  - Empty state message when no topics have behind messages
  - Filter state shows topic count and indication of filtered view

### Technical Details
- **Files affected**: 
  - `frontend/src/app/page.tsx` - added filter state and UI logic
  - `frontend/src/lib/i18n.ts` - added translations for filter options
- **Filter logic**: `topic.remainingMessages && topic.remainingMessages > 0`
- **Translations**: 
  - English: "Show All" / "Show Behind Only" / "No topics have behind messages"
  - Turkish: "Tümünü Göster" / "Sadece Geridekiler" / "Geride mesajı olan konu yok"
- **UI enhancement**: Helps users quickly identify topics that need attention

---

## [UI Enhancement] - 2025-01-24

### Changed
- **Filter button replaced with iPhone-style toggle switch**
  - Replaced text button with sleek iOS-style on/off switch
  - Label appears next to switch: "Show Behind Only" / "Sadece Geridekiler"
  - Orange color when active, gray when inactive
  - Smooth animation transition (300ms duration)
  - Focus ring for accessibility
  - White circle slides left/right to indicate state

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Implementation**: Custom toggle switch using Tailwind CSS
- **Colors**: Orange (active) / Gray (inactive)
- **Animation**: Transform and color transitions with 300ms duration
- **Accessibility**: Screen reader support with `sr-only` label and focus ring
- **Size**: 36px wide × 20px high (9×5 in Tailwind units)

---

## [UI Fix] - 2025-01-24

### Fixed
- **Matched height between Topics and Consumer Groups panels**
  - Consumer Groups panel now uses same max-height (600px) as Topics panel
  - Both panels now have consistent scrollable area heights
  - Added flex layout to Consumer Groups for better height management
  - Ensures visual balance in the dashboard layout

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Changes**: 
  - Changed `max-h-80` to `max-h-[600px]` for Consumer Groups
  - Added `h-full flex flex-col` and `flex-1` for proper height distribution
- **Result**: Both panels now have identical 600px max height with scroll

---

## [UI Enhancement] - 2025-01-24

### Changed
- **Set minimum height for Topics and Consumer Groups panels**
  - Both panels now have `min-h-[642px]` (642px minimum height)
  - Ensures consistent panel sizes even with minimal content
  - Prevents layout shift when content changes
  - Maintains visual balance in the dashboard

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Implementation**: Added `min-h-[642px]` to both panel containers
- **Layout**: Combined with `flex flex-col` and `flex-1` for proper content distribution
- **Result**: Both panels maintain 642px minimum height regardless of content

---

## [UI Adjustment] - 2025-01-24

### Changed
- **Adjusted minimum height for panels**
  - Changed from `min-h-[642px]` to `min-h-[600px]` 
  - Both Topics and Consumer Groups panels now have 600px minimum height
  - Matches the max-height for cleaner visual consistency

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Change**: `min-h-[642px]` → `min-h-[600px]` for both panels
- **Result**: min-height and max-height both set to 600px for perfect alignment

---

## [UI Optimization] - 2025-01-24

### Changed
- **Optimized panel heights to 550px**
  - Changed both min-height and max-height from 600px to 550px
  - Topics and Consumer Groups panels now use `min-h-[550px]` and `max-h-[550px]`
  - Better screen space utilization while maintaining visual balance

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Changes**: 
  - `min-h-[600px]` → `min-h-[550px]`
  - `max-h-[600px]` → `max-h-[550px]`
- **Result**: Both panels have consistent 550px height for min and max values

---

## [Feature Addition] - 2025-01-24

### Added
- **Message Viewing Capability**
  - New eye icon button in partition details for partitions with lag
  - View actual message content for messages that are behind
  - Backend API endpoint `/api/messages/:topic/:partition` to fetch messages
  - Modal viewer displays up to 20 behind messages
  - Shows message offset, timestamp, key, value, and size
  - JSON values are pretty-printed for readability
  - Full multilingual support (English/Turkish)

### Technical Details
- **Files added**: 
  - `frontend/src/components/MessageViewer.tsx` - Modal component for viewing messages
- **Files modified**:
  - `backend/server.js` - Added message fetching API endpoint
  - `frontend/src/components/TopicDetails.tsx` - Added view button and modal integration
  - `frontend/src/lib/i18n.ts` - Added translations for message viewer
- **Features**:
  - Fetches messages between current consumer offset and latest offset
  - Shows messages that haven't been consumed yet
  - Handles JSON formatting, empty messages, and various data types
  - 5-second timeout for message fetching
  - Grid updated from 7 to 8 columns to accommodate action button

---

## [Bug Fix] - 2025-01-24

### Fixed
- **Incorrect lag display in partition details**
  - Issue: When no consumer assigned, lag was showing as (latest - low) which represents total messages
  - Fix: Lag now shows 0 when no consumer is assigned
  - Logic: Lag only exists when there's an active consumer behind the latest offset
  - This matches the correct Kafka consumer group behavior

### Technical Details
- **File affected**: `frontend/src/components/TopicDetails.tsx`
- **Change**: `lag = consumerInfo ? consumerInfo[1].lag : 0` (instead of `parseInt(partition.high) - parseInt(partition.low)`)
- **Reasoning**: No consumer = no lag (lag represents consumer delay, not total messages)

---

## [Bug Fix] - 2025-01-24

### Fixed
- **Backend lag calculation for unconsumed partitions**
  - Issue: When consumer offset = -1 (never consumed), backend was calculating lag as total messages in partition
  - Fix: Changed to lag = 0 when consumer has never consumed from a partition
  - Now consistent with frontend display logic
  - Example: Partition with 15109 messages but no consumption now shows lag = 0 (not 15109)

### Technical Details
- **File affected**: `backend/server.js` - consumer lag calculation
- **Change**: `hasNeverConsumed` case now returns `lag = 0` instead of total messages
- **Impact**: Fixes "current: No msgs, lag: 15109" inconsistency
- **Reasoning**: Lag represents how far behind a consumer is; no consumption = no lag

---

## [Bug Fixes] - 2025-01-24

### Fixed
- **Topic-level behind count aggregation issue**
  - Issue: All partitions showing diff = 0 but topic showing large behind count (e.g., 18234)
  - Root cause: Backend was using minimum lag among consumer groups instead of calculating total unconsumed messages
  - Solution: Implemented proper topic-level aggregation that finds minimum consumer offset per partition across all groups and calculates total remaining messages
  - Files affected: `backend/server.js` - complete rewrite of consumer lag aggregation logic

- **Topic sorting not working**
  - Issue: Topics not displayed in alphabetical order despite backend sorting logic
  - Root cause: `Promise.all()` processing of topic metadata returned results in random order
  - Solution: Added explicit sorting of `topicMetadata` array before caching results
  - Files affected: `backend/server.js` - added final sort step after metadata processing

- **Consumer groups showing incorrect data**
  - Issue: Temporary `kafka-monitor-viewer-*` groups from message viewing feature appearing in consumer groups list
  - Solution: Added filtering to exclude all consumer groups starting with `kafka-monitor-viewer-`
  - Impact: Cleaner consumer groups display showing only actual application consumer groups
  - Files affected: `backend/server.js` - added group filtering logic

### Technical Details
- **New aggregation logic**: For topic-level behind count, backend now finds the most advanced (minimum lag) consumer per partition across all groups, then calculates total unconsumed messages
- **Improved sorting**: Both initial topic sorting and final metadata sorting ensure consistent alphabetical display
- **Group filtering**: Temporary viewer groups created by message viewing feature are now filtered out from both display and lag calculations

---

## [UI Enhancement] - 2025-01-25

### Changed
- **Default filter state for "Show Behind Only"**
  - Changed default state from `false` to `true` for the behind messages filter
  - Filter now starts in "Show Behind Only" mode by default
  - Users can toggle to "Show All" if they want to see all topics
  - Helps users immediately focus on topics that need attention

### Technical Details
- **File affected**: `frontend/src/app/page.tsx`
- **Change**: `useState(false)` → `useState(true)` for showBehindOnly state
- **Impact**: Dashboard loads with filtered view showing only topics with lag

---

## [Feature Addition] - 2025-01-25

### Added
- **IP Address display for Kafka brokers**
  - Brokers now display both hostname and resolved IP address
  - Format: `srv-streaming:9092 (192.168.1.189)`
  - Backend performs DNS resolution for each broker hostname
  - Graceful fallback if DNS resolution fails (shows hostname only)

### Technical Details
- **Files affected**:
  - `backend/server.js` - Added DNS resolution logic with dns.resolve4()
  - `frontend/src/app/page.tsx` - Updated display to show IP when available
  - `frontend/src/lib/types.ts` - Added optional `ip` field to Broker interface
- **Implementation**: DNS resolution happens during cluster metadata fetch
- **Display**: Shows `hostname:port (IP)` format when IP is available

---

## [UI Change] - 2025-01-25

### Changed
- **Simplified broker display to show KAFKA_BROKERS connection string**
  - Removed DNS resolution and manual IP mapping logic
  - Now displays the actual KAFKA_BROKERS value from environment configuration
  - Shows "192.168.1.189:9092" instead of trying to resolve hostnames
  - Simpler and more accurate representation of actual connection

### Technical Details
- **Files affected**:
  - `backend/server.js` - Removed DNS resolution code, added connectionString to cluster info
  - `frontend/src/app/page.tsx` - Changed to display connectionString instead of broker list
  - `frontend/src/lib/types.ts` - Removed ip field from Broker, added connectionString to cluster
- **Rationale**: Shows what the application actually uses to connect, not what Kafka advertises

---

## [Feature Enhancement] - 2025-01-25

### Added
- **Display both connection string and advertised hostname**
  - Shows KAFKA_BROKERS value from environment (e.g., "192.168.1.189:9092")
  - Also displays Kafka's advertised hostname in parentheses (e.g., "(srv-streaming:9092)")
  - Only shows hostname if it differs from the connection string
  - Provides complete picture of both connection method and Kafka's self-identification

### Technical Details
- **Files affected**:
  - `backend/server.js` - Added `advertisedBrokers` field to cluster info
  - `frontend/src/app/page.tsx` - Updated to display both connection and advertised info
  - `frontend/src/lib/types.ts` - Added `advertisedBrokers` field to cluster type
- **Display format**: "192.168.1.189:9092 (srv-streaming:9092)"

---

## [Documentation] - 2025-01-25

### Added
- **FEATURES.md - Comprehensive roadmap document**
  - Created detailed feature roadmap with 10 major categories
  - Includes performance monitoring, alerting, management tools, analytics
  - Prioritized implementation phases (Phase 1, 2, 3)
  - Technical considerations and requirements
  - Over 100 potential features documented

### Categories Covered
1. Performance & Metrics - Real-time monitoring and trending
2. Monitoring & Alerting - Intelligent notification system
3. Management Features - Topic and consumer group operations
4. Data Exploration - Message browsing and schema support
5. Enhanced UI/UX - Themes, mobile, customization
6. Advanced Analytics - Business intelligence and predictions
7. Security & Compliance - Access control and audit
8. Integration & Extensibility - APIs and third-party tools
9. Performance Optimization - Scalability improvements
10. Developer Experience - Plugin system and SDKs

### Technical Details
- **File created**: `FEATURES.md`
- **Purpose**: Central location for feature planning and community input
- **Format**: Organized by category with implementation priorities

---

## [Feature Completion] - 2025-07-25

### Added
- **Complete Dark Mode Implementation**
  - Full dark theme support across all components and UI elements
  - Toggle switch in Settings panel with moon/sun icons
  - localStorage persistence for dark mode preference
  - Document class toggling for proper Tailwind dark mode activation
  - Smooth transitions between light and dark themes

- **Favorite Topics - Pin Important Topics to Top**
  - Star/unstar functionality for all topics with yellow star icons
  - Automatic sorting: favorite topics pinned to top, then alphabetical order
  - localStorage persistence for favorite topics list
  - Click star icon next to topic names to toggle favorite status
  - Visual feedback with filled (favorite) and empty (not favorite) star states

- **Enhanced Multilingual Support**
  - Added translations for favorite topics functionality
  - English: "Favorite", "Unfavorite", "Add to favorites", "Remove from favorites"
  - Turkish: "Favori", "Favori Değil", "Favorilere ekle", "Favorilerden çıkar"

### Fixed
- **Dark Mode Statistics Cards**
  - Added missing dark mode styling to bottom statistics cards
  - Fixed Total Messages, Consumed, Remaining, and Connection cards
  - Applied consistent dark theme: dark backgrounds, borders, text, and icon colors
  - Added smooth transitions for theme switching

- **TypeScript Compilation Issues**
  - Added missing KafkaConnector type definition with all required properties
  - Fixed TopicDetails null reference in message viewing functionality
  - Resolved build compilation errors for proper deployment

### Technical Details
- **Files modified**:
  - `frontend/src/app/page.tsx` - Added dark mode styling to statistics cards, favorite topics sorting
  - `frontend/src/components/MessageViewer.tsx` - Complete dark mode styling
  - `frontend/src/lib/i18n.ts` - Added favorite topics translations
  - `frontend/src/lib/types.ts` - Added KafkaConnector interface
  - `frontend/src/components/TopicDetails.tsx` - Fixed null reference issue
  - `start.bat` - Corrected backend port from 4000 to 4001

- **Dark Mode Components**:
  - StatusCard, TopicDetails, ConsumerGroupDetails, MessageViewer, Settings - all components now support dark theme
  - Statistics cards (Total Messages, Consumed, Remaining, Connection) with proper dark styling
  - Consistent color scheme: gray-800 backgrounds, gray-700 borders, appropriate text contrasts

- **Features**:
  - Settings persistence via localStorage for both dark mode and favorite topics
  - Real-time sorting and filtering with favorite topics always displayed first
  - Complete UI translation coverage in both English and Turkish
  - Build verification successful with no TypeScript errors

### User Experience Improvements
- **Instant Theme Switching**: Dark mode toggle provides immediate visual feedback
- **Persistent Preferences**: Both dark mode and favorite topics survive browser sessions
- **Intuitive Interactions**: Star icons provide clear visual indication of favorite status
- **Enhanced Navigation**: Important topics automatically pinned to top of list for quick access

---

## [Documentation Update] - 2025-07-25

### Changed
- **Enhanced CLAUDE.md with Critical Rule Reminder**
  - Added prominent warning section at the top of the documentation
  - Emphasized the mandatory requirement to document ALL changes in CHANGELOG.md
  - Made the rule more visible with emojis and bold formatting
  - Ensures the documentation rule is never forgotten across Claude sessions
  - Applies to all future modifications regardless of session restarts

### Technical Details
- **File modified**: `CLAUDE.md` - Added critical rule section at the beginning
- **Purpose**: Prevent forgetting to document changes in future sessions
- **Format**: Eye-catching warning with clear instructions
- **Impact**: Ensures project change tracking consistency

---

## [Feature Addition] - 2025-07-25

### Added
- **Customizable Dashboard - Drag & Drop Statistics Cards**
  - Implemented modern @dnd-kit library for drag and drop functionality
  - All 4 bottom statistics cards (Total Messages, Consumed, Remaining, Connection) are now draggable
  - Real-time reordering with visual feedback during drag operations
  - Smooth animations and hover effects with grip handle indicators
  - Complete localStorage persistence for custom card arrangements
  - Cross-session memory - card order persists after browser restart

- **Enhanced User Experience**
  - Hover to reveal drag handles (grip icons) on statistics cards
  - Visual feedback during dragging (opacity, scale, shadow effects)
  - Support for both mouse and keyboard accessibility (arrow keys + space/enter)
  - Responsive grid layout maintains functionality across all screen sizes
  - Dark mode compatibility with proper theming for drag handles

### Technical Implementation
- **New Component**: `DraggableStatsCard.tsx` - Reusable wrapper for draggable elements
- **Libraries Added**: 
  - `@dnd-kit/core` - Core drag and drop functionality
  - `@dnd-kit/sortable` - Sortable list management
  - `@dnd-kit/utilities` - CSS transform utilities
- **Architecture**: Converted static cards to data-driven approach with statsCards object
- **State Management**: Added cardOrder state with localStorage integration

### Files Modified
- `frontend/src/app/page.tsx` - Main implementation with DndContext and card reordering
- `frontend/src/components/DraggableStatsCard.tsx` - New draggable wrapper component
- `frontend/package.json` - Added @dnd-kit dependencies

### Features
- **Drag & Drop**: Click and drag grip handles to reorder statistics cards
- **Persistence**: Custom arrangements automatically saved and restored
- **Accessibility**: Full keyboard navigation support
- **Visual Polish**: Smooth transitions, hover states, and drag feedback
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices

### User Benefits
- **Personalization**: Arrange dashboard metrics according to individual workflow priorities
- **Modern UX**: Professional drag & drop interface matching industry standards
- **Efficiency**: Quick access to most important metrics through custom positioning
- **Consistency**: Settings persist across browser sessions and device restarts

---

## [Translation Fix] - 2025-07-25

### Fixed
- **Missing Turkish Translations for Drag & Drop Feature**
  - Added Turkish translation for drag and drop help text
  - English: "Hover over cards and drag the grip handles to reorder"
  - Turkish: "Kartların üzerine gelin ve sürükle tutamaklarını kullanarak yeniden sıralayın"
  - Added tooltip translations for grip handles
  - English: "Drag to reorder" 
  - Turkish: "Yeniden sıralamak için sürükleyin"

### Enhanced
- **Improved Drag & Drop Visual Feedback**
  - Enhanced grip handle visibility with better positioning and styling
  - Added consistent card heights (min-h-[100px]) for all statistics cards
  - Improved hover effects with blue border highlight
  - Added helpful instruction text above statistics cards
  - Enhanced drag feedback with scale and rotation effects

### Technical Details
- **Files modified**:
  - `frontend/src/lib/i18n.ts` - Added dragToReorder and dragTooltip translations
  - `frontend/src/app/page.tsx` - Updated to use translations, improved card styling
  - `frontend/src/components/DraggableStatsCard.tsx` - Enhanced visual feedback and tooltips
- **Translation Coverage**: Complete bilingual support for drag & drop functionality
- **UI Improvements**: Better visual indicators for interactive elements

### Compliance
- **Rule Adherence**: Fixed missing Turkish language support as per project requirements
- **Consistency**: All user-facing text now properly translated in both languages
- **Accessibility**: Improved tooltips and visual feedback for better user experience

---

## [Critical Documentation Update] - 2025-07-25

### Added
- **Permanent Turkish Language Support Mandate in CLAUDE.md**
  - Added prominent warning section ensuring Turkish translations are never forgotten
  - Created mandatory development workflow with 6-step process for new features
  - Added specific examples of correct translation implementation
  - Emphasized testing requirements for both English and Turkish languages

### Enhanced Documentation Rules
- **🌍 Mandatory Turkish Support**: All user-facing text must be bilingual
- **📝 Translation Workflow**: Step-by-step process for adding translations
- **⚠️ Never Do List**: Clear warnings about what to avoid
- **🔧 Code Examples**: Practical examples of proper i18n implementation

### Technical Details
- **File modified**: `CLAUDE.md` - Enhanced critical rules section
- **Purpose**: Ensure Turkish language support survives ALL Claude session restarts
- **Impact**: Future development will automatically include bilingual support
- **Compliance**: Addresses recurring issue of missing Turkish translations

### Session Restart Protection
- **Prominent Positioning**: Turkish rule appears at the very top of documentation
- **Visual Emphasis**: Uses emojis and bold formatting for maximum visibility
- **Detailed Instructions**: Specific file paths and implementation examples provided
- **Integration**: Combined with existing changelog rule for comprehensive coverage

---

## [UI Fix] - 2025-07-25

### Fixed
- **Statistics Card Height Inconsistency**
  - Fixed Connection card being 106px tall while others were 100px
  - Issue was caused by optional subtitle text in Connection card only
  - Implemented consistent layout structure for all cards

### Technical Solution
- **Layout Structure**: Changed to flexbox with `justify-between` and fixed content areas
- **Content Area**: Added `min-h-[60px]` for consistent text content height
- **Subtitle Handling**: Created dedicated 16px high area (`h-4`) for optional subtitles
- **Result**: All cards now have exactly the same height regardless of content

### Files Modified
- `frontend/src/app/page.tsx` - Updated card layout structure in statistics cards section

### Visual Improvements
- **Consistent Heights**: All 4 statistics cards now have identical dimensions
- **Proper Spacing**: Subtitle area is reserved even when empty, preventing layout shifts
- **Better Alignment**: Main content (title/value) and subtitles properly positioned

### Turkish Language Support
- ✅ No new user-facing text added - existing translations remain intact
- ✅ Fix applies to both English and Turkish language modes

---

## [Feature Extension] - 2025-07-25

### Added
- **Extended Drag & Drop to Main Panels**
  - Topics and Consumer Groups panels are now fully draggable and reorderable
  - Created DraggablePanel component for larger content sections
  - Users can reorder main dashboard sections according to their preferences
  - Complete localStorage persistence for panel arrangements
  - Cross-session memory - panel order persists after browser restart

- **Enhanced Panel Management System**
  - Two-tier drag & drop system: statistics cards AND main panels
  - Independent reordering: cards maintain their order while panels can be rearranged
  - Visual feedback during dragging with grip handles, shadows, and scaling effects
  - Smooth animations and hover states for professional UX
  - Dark mode compatibility with proper theming for all drag elements

### Technical Implementation
- **New Component**: `DraggablePanel.tsx` - Specialized wrapper for large content sections
- **State Management**: Added panelOrder state with localStorage integration
- **Architecture**: Extended existing DndContext to handle both card and panel dragging
- **Collision Detection**: Smart collision detection separates card and panel drag operations

### Files Modified
- `frontend/src/app/page.tsx` - Extended DndContext, added panel ordering logic
- `frontend/src/components/DraggablePanel.tsx` - New draggable wrapper for main sections
- `frontend/src/lib/i18n.ts` - Added panel-specific drag & drop translations

### Multilingual Support
- **English Translations**:
  - "Hover over panels and drag the grip handles to reorder main sections"
  - "Drag to reorder panel"
- **Turkish Translations**:
  - "Panellerin üzerine gelin ve ana bölümleri yeniden sıralamak için sürükle tutamaklarını kullanın"
  - "Paneli yeniden sıralamak için sürükleyin"

### Features
- **Two-Level Customization**: Both statistics cards (bottom) and main panels (center) are draggable
- **Persistent Layouts**: Custom arrangements automatically saved and restored
- **Professional UX**: Industry-standard drag & drop with visual feedback
- **Accessibility**: Full keyboard navigation support for all draggable elements
- **Responsive Design**: Works seamlessly across all device sizes

### User Benefits
- **Maximum Personalization**: Complete control over dashboard layout and information priority
- **Workflow Optimization**: Arrange both detailed panels and summary cards for optimal productivity
- **Modern Interface**: Professional drag & drop functionality matching enterprise applications
- **Flexibility**: Independent control over different dashboard sections
- **Consistency**: All customizations persist across browser sessions and device restarts

### Technical Details
- **Drag System**: Uses @dnd-kit library with separate contexts for cards and panels
- **Visual Effects**: Scale, rotation, shadow, and opacity changes during drag operations
- **State Persistence**: localStorage saves both cardOrder and panelOrder arrays
- **Collision Detection**: Intelligent handling prevents interference between card and panel dragging
- **Performance**: Optimized rendering with proper React keys and efficient state updates

---

## [Development Scripts Enhancement] - 2025-07-25

### Added
- **Separate Start Scripts for Backend and Frontend**
  - Created individual startup scripts for independent server management
  - Cross-platform support with both Windows (.bat) and Linux (.sh) versions
  - Better development workflow with granular control over services
  - Clear instructions and port information in each script

### New Files Created
- **Windows Scripts**:
  - `start-backend.bat` - Starts only the backend server (port 4001)
  - `start-frontend.bat` - Starts only the frontend server (port 3000)
- **Linux Scripts**:
  - `start-backend.sh` - Starts only the backend server (port 4001)
  - `start-frontend.sh` - Starts only the frontend server (port 3000)

### Enhanced
- **Updated main start.bat**
  - Added instructions for separate script usage
  - Maintained existing functionality for starting both servers together
  - Improved user guidance with clear options display

### Benefits
- **Development Flexibility**: Start servers independently for debugging or development
- **Resource Management**: Run only needed components to save system resources
- **Cross-Platform**: Consistent experience across Windows and Linux environments
- **Debugging**: Easier isolation of frontend vs backend issues
- **Deployment**: Better suited for production environments with separate service management

### Usage Instructions
**Windows:**
```cmd
start-backend.bat    # Backend only
start-frontend.bat   # Frontend only
start.bat           # Both servers (existing behavior)
```

**Linux:**
```bash
chmod +x *.sh       # Make scripts executable
./start-backend.sh  # Backend only
./start-frontend.sh # Frontend only
```

### Technical Details
- **Port Configuration**: Backend (4001), Frontend (3000)
- **Dependencies**: Scripts assume npm is installed and dependencies are ready
- **Environment**: Works with existing .env configuration files
- **Process Management**: Each script runs in its own terminal/command window

---

## [UI Fix] - 2025-07-25

### Fixed
- **Grid Layout Mismatch for Topics and Consumer Groups Panels**
  - Fixed grid system having 3 columns but only 2 panels, causing empty space
  - Changed grid from `grid-cols-1 lg:grid-cols-3` to `grid-cols-1 lg:grid-cols-2`
  - Both panels now properly utilize available space without empty columns
  - Topics and Consumer Groups panels each take equal width on desktop (50/50 split)
  - Panels stack vertically on mobile for optimal readability

### Technical Details
- **File modified**: `frontend/src/app/page.tsx` - Updated grid classes and panel colSpan
- **Grid System Changes**: 
  - Mobile: `grid-cols-1` (single column, stacked)
  - Desktop: `grid-cols-2` (two equal columns)
  - Panel spans: Both panels use `col-span-1` for equal width distribution
- **Layout Logic**: 2 panels = 2 columns (no empty space)

### Impact
- **Mobile Experience**: Panels no longer overflow or appear cramped on small screens
- **Tablet Experience**: Better utilization of available screen space
- **Desktop Experience**: Maintains existing 2:1 ratio layout
- **Accessibility**: Improved readability across all device types

### Turkish Language Support
- ✅ No user-facing text changes - existing translations remain intact
- ✅ Fix applies to both English and Turkish language modes

---

## [UI Optimization] - 2025-07-25

### Changed
- **Fixed Panel Heights for Better UI Consistency**
  - Reverted from content-driven to fixed equal heights for both panels
  - Both Topics and Consumer Groups panels now have identical 400px height
  - Ensures visual balance and professional appearance across dashboard
  - Reduced from original 550px to more reasonable 400px height
  - Scrollable areas capped at 350px with proper overflow handling

### Technical Implementation
- **Height Strategy**: Fixed equal heights for visual consistency
- **Panel Height**: Both use `min-h-[400px]` for uniform appearance
- **Scrollable Area**: `max-h-[350px]` with `overflow-y-auto` for content overflow
- **Layout Balance**: Ensures Topics and Consumer Groups always match in height

### Benefits
- **Visual Consistency**: Both panels maintain identical height regardless of content
- **Professional Look**: Clean, balanced dashboard layout
- **Predictable UI**: Users know exactly how much space panels will occupy
- **Better Proportions**: 400px is more reasonable than previous 550px
- **Grid Alignment**: Panels align perfectly in the 2-column grid layout

### Impact
- **Desktop Experience**: Clean, balanced side-by-side panel layout
- **Mobile Experience**: Consistent stacked panel heights
- **Content Handling**: Scrolling when content exceeds available space
- **Visual Harmony**: Eliminates uneven panel heights that disrupted UI flow

### Technical Details
- **File modified**: `frontend/src/app/page.tsx` - Standardized panel heights
- **Panel Container**: `min-h-[400px]` for both Topics and Consumer Groups
- **Scrollable Content**: `max-h-[350px] overflow-y-auto` for content areas
- **Layout Strategy**: Fixed heights prioritize UI consistency over content-driven sizing

### Turkish Language Support
- ✅ No user-facing text changes - existing translations remain intact
- ✅ Optimization applies to both English and Turkish language modes

---

## [Major Feature] - 2025-07-25

### Added
- **Connection Manager - Dynamic Kafka Cluster Management**
  - Full-featured connection management UI for switching between Kafka clusters
  - Save multiple Kafka cluster configurations with custom names and labels
  - Test connection functionality with real-time validation
  - Quick connection switching without server restart
  - Persistent connection profiles saved in localStorage
  - Visual connection status indicators and environment labels
  - Modal-based connection management interface

### Features
- **Connection Profiles**
  - Save unlimited Kafka cluster configurations
  - Custom naming for easy identification
  - Environment labels (Production, Staging, Development, Test, Default)
  - Broker addresses configuration (supports multiple brokers)
  - Active connection indicator
  - Last connected timestamp tracking

- **Connection Testing**
  - Test connections before switching
  - Real-time connection validation
  - Success/failure feedback with detailed messages
  - Shows number of brokers and controller information

- **Dynamic Switching**
  - Change active connection without restarting servers
  - Automatic status refresh after connection change
  - Cache clearing for immediate data update
  - Maintains refresh rate settings across connections

- **User Interface**
  - Clean modal design with dark mode support
  - Server icon button in header showing current connection
  - Add/Edit/Delete connection management
  - Color-coded environment labels
  - Loading states and error handling

### Technical Implementation
- **Frontend Components**
  - `ConnectionManager.tsx` - Main modal component
  - Connection form with validation
  - Test connection integration
  - LocalStorage persistence

- **Backend API Endpoints**
  - `POST /api/test-connection` - Test Kafka broker connectivity
  - `POST /api/change-connection` - Switch active connection
  - `GET /api/current-connection` - Get current connection info

- **State Management**
  - Dynamic Kafka instance creation
  - Connection string updates in status cache
  - Automatic periodic update restart on connection change

### Multilingual Support
- **English Translations**
  - Connection Manager, Add Connection, Connection Name
  - Broker Addresses, Environment labels (Production, Staging, etc.)
  - Save, Cancel, Active, Test Connection, Connect
  - Success/failure messages

- **Turkish Translations**
  - Bağlantı Yöneticisi, Bağlantı Ekle, Bağlantı Adı
  - Broker Adresleri, Ortam etiketleri (Üretim, Hazırlık, vb.)
  - Kaydet, İptal, Aktif, Bağlantıyı Test Et, Bağlan
  - Başarı/hata mesajları

### Files Added/Modified
- **Added**:
  - `frontend/src/components/ConnectionManager.tsx`
  - `frontend/.env.local.example`
- **Modified**:
  - `backend/server.js` - Added connection management endpoints
  - `frontend/src/app/page.tsx` - Integrated ConnectionManager
  - `frontend/src/lib/i18n.ts` - Added translations

### Benefits
- **Multi-Environment Support**: Easy switching between dev/staging/prod
- **Team Collaboration**: Share connection profiles
- **No Downtime**: Dynamic switching without restart
- **Demo-Friendly**: Quick cluster switching for presentations
- **Enhanced Security**: No need to expose connection strings in code

---

## [UI Fix] - 2025-07-25

### Fixed
- **Dark Mode Server Icon Visibility**
  - Fixed server icon not visible in dark mode in connection button
  - Added proper dark mode text color classes to Server icon
  - Icon now uses `text-gray-600 dark:text-gray-300` for proper contrast

### Technical Details
- **File modified**: `frontend/src/app/page.tsx`
- **Component**: Connection button server icon
- **Fix**: Added `className="text-gray-600 dark:text-gray-300"` to Server icon

### Turkish Language Support
- ✅ No user-facing text changes - visual fix only
- ✅ Fix applies to both English and Turkish language modes

---

## [UI Enhancement] - 2025-07-25

### Changed
- **Language Selection Display**
  - Language options now display in their native language
  - English shows as "English" (not translated)
  - Turkish shows as "Türkçe" (not translated)
  - Better UX - users can identify their language regardless of current selection

### Technical Details
- **File modified**: `frontend/src/components/Settings.tsx`
- **Change**: Hardcoded language names instead of using translations
- **Before**: `{t('english')}` and `{t('turkish')}`
- **After**: `English` and `Türkçe`

### Impact
- **User Experience**: More intuitive language selection
- **International Users**: Can find their language even if UI is in unknown language
- **Standard Practice**: Follows common UX pattern for language selectors

---

## [LDAP Password Type Error Fix] - 2025-07-25

### Fixed
- **TypeError: stringToWrite must be a string**
  - Fixed LDAP authentication error where password wasn't being handled as string
  - Added input validation to ensure username and password are valid strings
  - Added explicit string conversion for password before LDAP bind
  - Enhanced debugging to show password type and existence

### Technical Details
- **Issue**: LDAP bind was receiving non-string password value causing TypeError
- **Solution**: Added validation and string conversion: `const userPassword = String(password || '')`
- **Files modified**:
  - `backend/auth/ldapConfig.js` - Added password validation and string conversion
  - `backend/server.js` - Added request body debugging
- **Debugging**: Added comprehensive logging to track password handling through auth flow

---

## [LDAP Authentication Troubleshooting] - 2025-07-25

### Added
- **Enhanced LDAP Debugging and Alternative Authentication**
  - Added comprehensive LDAP connection debugging with detailed error logging
  - Created manual LDAP authentication using ldapjs library as alternative to passport-ldapauth
  - Added LDAP test script (`backend/test-ldap.js`) for connection troubleshooting
  - Enhanced error messages to identify specific LDAP connection issues

### Debugging Features
- **Console Logging**: Detailed logs for LDAP configuration, connection attempts, and errors
- **Manual Authentication**: Direct ldapjs implementation with step-by-step error handling
- **Connection Test**: Standalone script to test LDAP connectivity without authentication flow
- **Fallback System**: Graceful fallback to local admin when LDAP fails

### Troubleshooting Tools
- **Test Script**: Run `node backend/test-ldap.js` to test LDAP connection
- **Alternative Configs**: 5 different AD configuration patterns in `.env.ad-options`
- **Detailed Logs**: Backend console shows exact LDAP errors and configuration used
- **Step-by-Step Auth**: Manual authentication process with detailed error reporting

### Files Added/Modified
- **Added**:
  - `backend/test-ldap.js` - LDAP connection test script
- **Modified**:
  - `backend/server.js` - Enhanced authentication with manual LDAP and debugging
  - `backend/auth/ldapConfig.js` - Added manual LDAP authentication and detailed logging

### Usage for Debugging
1. Check backend console for detailed LDAP configuration and error messages
2. Run `node backend/test-ldap.js` to test basic LDAP connectivity
3. Try alternative configurations from `.env.ad-options`
4. System will show exactly where LDAP authentication fails (bind, search, or user auth)

---

## [Active Directory Configuration Fix] - 2025-07-25

### Fixed
- **Active Directory Authentication Configuration**
  - Fixed incorrect LDAP search filter: `(objectCategory=Group)` → `(sAMAccountName={{username}})`
  - Changed TLS setting to `false` to avoid certificate validation issues
  - Added AD-specific search attributes: `sAMAccountName`, `userPrincipalName`
  - Created alternative configuration options file for different AD setups

### Configuration Options
- **Current Configuration**: Uses `sAMAccountName` for user lookup
- **Alternative Options**: Created `.env.ad-options` with 5 different AD configuration patterns:
  1. Current setup with domain\username bind
  2. Full DN format for bind account
  3. UPN format for bind account  
  4. Search in specific Users container
  5. Alternative search using userPrincipalName

### Technical Details
- **Files modified**:
  - `backend/.env` - Fixed search filter and TLS settings
  - `backend/auth/ldapConfig.js` - Added AD-specific search attributes
- **Files added**:
  - `backend/.env.ad-options` - Alternative configuration examples
- **Issue**: Search filter was looking for groups instead of users
- **Solution**: Changed to proper user search with `(sAMAccountName={{username}})`

---

## [Bug Fix] - 2025-07-25

### Fixed
- **TypeError: Cannot read properties of undefined (reading 'filter')**
  - Fixed frontend crash when authentication blocks API calls
  - Added null safety checks for `status.topics` and `status.consumerGroups`
  - Used `(array || [])` pattern to prevent undefined array operations
  - Fixed statistics calculations with proper null checking
  - Application now gracefully handles authentication loading states

- **TypeError: t is not a function**
  - Fixed Login component translation function usage
  - Changed from `const t = useTranslation(language)` to `const { t } = useTranslation(language)`
  - Login page now displays properly with correct translations

- **Dashboard not showing after successful login**
  - Fixed API calls missing credentials after authentication
  - Added session middleware sharing between HTTP and WebSocket connections
  - Implemented socket.io authentication check
  - Added automatic page reload after login to reinitialize authenticated connections

### Technical Details
- **Files modified**: 
  - `frontend/src/app/page.tsx` - Added null safety checks, fixed initial API call with credentials
  - `frontend/src/components/Login.tsx` - Fixed translation hook destructuring
  - `frontend/src/contexts/AuthContext.tsx` - Added page reload after login
  - `backend/server.js` - Added session middleware sharing with socket.io, implemented socket authentication
- **Issues**: 
  - Frontend was trying to filter/map undefined arrays when API calls failed due to authentication
  - Login component was incorrectly using the useTranslation hook
  - Dashboard not loading after successful login due to unauthenticated API/socket calls
- **Solutions**: 
  - Added null safety checks using `(status.topics || [])` pattern
  - Properly destructured the translation function: `const { t } = useTranslation(language)`
  - Implemented session-based socket authentication and automatic page reload after login
- **Impact**: Application loads properly and shows login screen without JavaScript errors

### Components Fixed
- Topic filtering and sorting logic
- Consumer groups display
- Statistics card calculations (Total Messages, Consumed, Remaining)
- Login component translation usage
- All array operations now have null safety

---

## [Dependency Management Enhancement] - 2025-07-25

### Added
- **Automatic Dependency Installation**
  - Created `auto-install.bat` and `auto-install.sh` scripts for manual dependency installation
  - Enhanced `start.bat` to automatically check and install missing dependencies
  - Added automatic npm install when node_modules folders are missing
  - Prevents "module not found" crashes on first run or after fresh clone

### Enhanced
- **All Start Scripts Now Auto-Install Dependencies**
  - `start.bat` - Checks and installs both backend/frontend dependencies
  - `start-backend.bat` - Auto-installs backend dependencies if missing
  - `start-frontend.bat` - Auto-installs frontend dependencies if missing
  - `start-backend.sh` - Linux version with backend auto-install
  - `start-frontend.sh` - Linux version with frontend auto-install
  - Provides clear feedback during dependency installation
  - Ensures smooth startup without manual intervention

### Files Created
- `auto-install.bat` - Windows script for complete dependency installation
- `auto-install.sh` - Linux script for complete dependency installation

### Files Modified
- `start.bat` - Added automatic dependency checking and installation for both backend/frontend
- `start-backend.bat` - Added backend dependency auto-install
- `start-frontend.bat` - Added frontend dependency auto-install
- `start-backend.sh` - Added backend dependency auto-install (Linux)
- `start-frontend.sh` - Added frontend dependency auto-install (Linux)
- `CLAUDE.md` - Added critical rule for automatic dependency management

### Developer Experience
- No more crashes due to missing modules
- Fresh clones work immediately without manual npm install
- Automatic recovery from deleted node_modules
- Clear feedback during installation process

### Critical Rule Added
- **Automatic Dependency Installation** now mandatory for all sessions
- Ensures application stability and prevents module-related crashes
- Part of the core development workflow

---

## [Configuration Update] - 2025-07-25

### Added
- **Production-Ready Authentication Configuration**
  - Generated cryptographically secure SESSION_SECRET (96 characters)
  - Configured Active Directory settings for enterprise environment
  - Set strong local admin password with complexity requirements
  
### Security Configuration
- **SESSION_SECRET**: 96-character hex string for maximum security
- **Active Directory Settings**:
  - LDAP URL: `ldap://dc.company.local:389`
  - Service Account: `CN=kafka-monitor-service,CN=Service Accounts,DC=company,DC=local`
  - Search Filter: `(sAMAccountName={{username}})` for AD username lookup
  - TLS verification enabled for secure connections
  
- **Local Admin Security**:
  - Strong password with special characters, numbers, and mixed case
  - Follows enterprise password complexity requirements
  - Provides fallback access when AD is unavailable

### Configuration Details
- **File modified**: `backend/.env`
- **Security level**: Production-ready with strong encryption
- **Authentication**: Configured for Active Directory integration
- **Note**: Remember to update AD-specific values (domain, service account) for your environment

---

## [Major Feature: LDAP Authentication] - 2025-07-25

### Added
- **Complete LDAP/Active Directory Authentication System**
  - Enterprise-grade authentication with LDAP/AD integration
  - Session-based authentication with secure cookies
  - Local admin user fallback when LDAP is unavailable
  - Automatic session persistence (24-hour duration)
  - Protected API endpoints requiring authentication
  
- **Login Interface**
  - Professional login page with bilingual support
  - Username/password form with icons and validation
  - Loading states and error handling
  - Dark mode compatible login screen
  - Auto-redirect to login when session expires

- **User Session Management**
  - User display showing logged-in user's name
  - Logout functionality with confirmation
  - Session check on app initialization
  - Persistent authentication across page refreshes
  - Secure session cookies with httpOnly flag

- **Backend Authentication Infrastructure**
  - Passport.js integration with LDAP strategy
  - Express session middleware configuration
  - LDAP connection with configurable parameters
  - Authentication middleware for all API routes
  - Graceful fallback to local authentication

### Technical Implementation
- **Backend Dependencies Added**:
  - `passport` - Authentication middleware
  - `passport-ldapauth` - LDAP authentication strategy
  - `express-session` - Session management
  - `ldapjs` - LDAP client library
  - `bcryptjs` - Password hashing (future use)

- **Frontend Components**:
  - `Login.tsx` - Login page component
  - `AuthContext.tsx` - Authentication context provider
  - Authentication state management with React Context

- **Configuration Options**:
  - `AUTH_ENABLED` - Enable/disable authentication
  - `SESSION_SECRET` - Secret key for session encryption
  - `LDAP_URL` - LDAP server URL
  - `LDAP_BIND_DN` - Bind DN for LDAP queries
  - `LDAP_BIND_PASSWORD` - Bind password
  - `LDAP_SEARCH_BASE` - Base DN for user search
  - `LDAP_SEARCH_FILTER` - User search filter
  - `LOCAL_ADMIN_PASSWORD` - Fallback admin password

### Security Features
- All API endpoints protected with authentication
- Session cookies with secure flags in production
- CORS configured for credential support
- Password field properly masked in UI
- Session timeout after 24 hours
- LDAP over TLS support

### Multilingual Support
- **English**: Login, Logout, Username, Password, Welcome
- **Turkish**: Giriş, Çıkış, Kullanıcı Adı, Şifre, Hoş geldiniz
- Complete translation coverage for all auth-related text

### Files Added/Modified
- **Added**:
  - `backend/auth/ldapConfig.js` - LDAP configuration
  - `frontend/src/components/Login.tsx` - Login component
  - `frontend/src/contexts/AuthContext.tsx` - Auth context
- **Modified**:
  - `backend/server.js` - Added auth middleware and routes
  - `backend/package.json` - Added auth dependencies
  - `frontend/src/app/page.tsx` - Added auth checks
  - `frontend/src/app/layout.tsx` - Added AuthProvider
  - `frontend/src/lib/i18n.ts` - Added auth translations
  - `backend/.env.example` - Added auth configuration

### Usage
1. Configure LDAP settings in `.env` file
2. Set `AUTH_ENABLED=true` to enable authentication
3. Users log in with LDAP credentials
4. Falls back to local admin if LDAP unavailable
5. Session persists for 24 hours

---

## [Translation Update] - 2025-07-25

### Changed
- **Updated Application Titles in Both Languages**
  - English: Changed from "Kafka Monitor" to "Kafka Monitoring System"
  - Turkish: Changed from "Kafka Monitör" to "Kafka İzleme Sistemi" (Kafka Monitoring System)
  - Both languages now use the full "Monitoring System" designation
  - Turkish title now uses proper Turkish words instead of English-Turkish mix

### Technical Details
- **File modified**: `frontend/src/lib/i18n.ts`
- **Changes**: 
  - English: `title: 'Kafka Monitor'` → `title: 'Kafka Monitoring System'`
  - Turkish: `title: 'Kafka Monitör'` → `title: 'Kafka İzleme Sistemi'`
- **Impact**: Both languages display consistent "Monitoring System" titles

---

## [Service Management Enhancement] - 2025-07-25

### Added
- **Granular Service Stop Scripts**
  - Created individual stop scripts for more precise service management
  - Allows stopping backend or frontend independently without affecting other Node.js processes
  - Cross-platform support with both Windows (.bat) and Linux (.sh) versions
  - Port-specific process termination (Backend: 4001, Frontend: 3000)

### New Files Created
- **Windows Scripts**:
  - `stop-backend.bat` - Stops only the backend server on port 4001
  - `stop-frontend.bat` - Stops only the frontend server on port 3000
- **Linux Scripts**:
  - `stop-backend.sh` - Stops only the backend server on port 4001
  - `stop-frontend.sh` - Stops only the frontend server on port 3000

### Changed
- **Enhanced stop-windows.bat**
  - Added interactive menu with 4 options for service management
  - Option 1: Stop Backend only (safe, port-specific)
  - Option 2: Stop Frontend only (safe, port-specific)
  - Option 3: Stop ALL Node.js processes (dangerous, with warning)
  - Option 4: Exit without stopping anything
  - Clear warnings about option 3's system-wide impact

### Benefits
- **Precise Control**: Stop specific services without affecting other Node.js applications
- **Development Friendly**: Can restart individual services during development
- **System Safety**: Avoids accidentally terminating unrelated Node.js processes
- **Better Debugging**: Isolate frontend/backend issues by stopping one at a time
- **Production Ready**: Port-specific termination suitable for production environments

### Technical Implementation
- **Port Detection**: Uses `netstat` (Windows) and `lsof` (Linux) to find processes by port
- **Process Termination**: Kills only the specific PID listening on target port
- **Error Handling**: Graceful messages for missing processes or permission issues
- **Cross-Platform**: Consistent behavior across Windows and Linux environments

### Usage
**Windows:**
```cmd
stop-backend.bat     # Stop backend only
stop-frontend.bat    # Stop frontend only  
stop-windows.bat     # Interactive menu with options
```

**Linux:**
```bash
./stop-backend.sh    # Stop backend only
./stop-frontend.sh   # Stop frontend only
```

---

## Instructions for Future Changes

**IMPORTANT**: All modifications to this project must be logged in this CHANGELOG.md file.

### Format for New Entries
```markdown
## [Version] - YYYY-MM-DD

### Added
- New features or functionality

### Changed  
- Changes in existing functionality

### Deprecated
- Soon-to-be removed features

### Removed
- Now removed features

### Fixed
- Bug fixes

### Security
- Security improvements
```

### Required Information for Each Entry
1. **Date** of the change (YYYY-MM-DD format)
2. **Type** of change (Added/Changed/Fixed/etc.)
3. **Detailed description** of what was modified
4. **Files affected** (if significant)
5. **Reason** for the change (if not obvious)
6. **Impact** on users or system behavior

### Examples of Changes to Log
- UI improvements or modifications
- New features or functionality
- Bug fixes and patches
- Performance optimizations
- Configuration changes
- Dependency updates
- Security updates
- Translation additions/modifications
- API changes
- Database schema changes

### Commit Message Correlation
Each entry should correspond to git commits where possible, maintaining traceability between changelog and code changes.