# KafkaVision Screenshot Guide

This guide helps you take professional screenshots for the GitHub README.

## Prerequisites
1. Start both backend and frontend servers
2. Ensure you have sample Kafka data (topics with messages, active consumer groups)
3. Login as admin to access all features

## Required Screenshots

### 1. Dashboard - Light Mode
**Filename**: `dashboard-light.png`

**Setup**:
- Ensure light mode is active (sun icon in header)
- Have at least 3-5 topics visible
- Show consumer groups with varying lag
- Statistics cards should show realistic numbers
- Language set to English
- Refresh rate visible (e.g., "Updates every 30s")

**Key elements to capture**:
- Header with KafkaVision logo and user menu
- Statistics cards (Total Messages, Consumed, Remaining, Connection)
- Topics section with expanded topic showing partitions
- Consumer Groups section
- Clean, professional appearance

### 2. Dashboard - Dark Mode
**Filename**: `dashboard-dark.png`

**Setup**:
- Switch to dark mode (moon icon in header)
- Same data as light mode screenshot
- Ensure dark theme is properly applied to all elements

**Key elements to capture**:
- Dark background with good contrast
- All the same elements as light mode
- Proper dark theme colors for cards and text

### 3. Admin Settings Panel
**Filename**: `admin-settings.png`

**Setup**:
- Click user menu → Admin Settings
- Show the "User Management" tab
- Have some users in different states (active, pending, rejected)
- Alternatively, show "LDAP Settings" tab with configuration

**Key elements to capture**:
- Admin settings modal/panel
- Tab navigation (LDAP Settings, User Management)
- User table with status indicators
- Action buttons (Approve, Reject, Delete)
- Professional form layout

## Screenshot Best Practices

### Resolution
- Minimum: 1280x720
- Recommended: 1920x1080
- Crop to focus on the application, remove browser chrome if needed

### Data
- Use realistic but non-sensitive data
- Show variety in states (some topics with lag, some without)
- Include both English and Turkish text where applicable
- Show connected state with green indicators

### Composition
- Center the application
- Remove any personal bookmarks or browser extensions from view
- Ensure no sensitive information is visible
- Use a clean desktop background if visible

## How to Upload to GitHub

### Method 1: Issue Upload (Recommended)
1. Go to https://github.com/osmanburak/kafka-vision/issues
2. Click "New Issue"
3. Drag and drop your screenshots into the issue body
4. GitHub will upload them and provide URLs
5. Copy the URLs (they look like: `https://github.com/user/repo/assets/...`)
6. Close the issue without submitting
7. Use these URLs in README.md

### Method 2: Wiki Upload
1. Go to repository Wiki
2. Create a page called "Screenshots"
3. Upload images there
4. Reference them in README

### Method 3: Direct Commit
1. Add images to `docs/images/` directory
2. Commit and push
3. Reference as `./docs/images/dashboard-light.png`

## Example Markdown

```markdown
### Dashboard (Light Mode)
Shows real-time Kafka cluster monitoring with topics, consumer groups, and statistics.
![Dashboard Light](https://github.com/osmanburak/kafka-vision/assets/12345678/abcd1234-5678-90ab-cdef-1234567890ab)

### Dashboard (Dark Mode)
Full dark theme support for comfortable viewing in low-light environments.
![Dashboard Dark](https://github.com/osmanburak/kafka-vision/assets/12345678/efgh5678-90ab-cdef-1234-567890abcdef)

### Admin Settings
Web-based configuration for LDAP settings and user management.
![Admin Settings](https://github.com/osmanburak/kafka-vision/assets/12345678/ijkl90ab-cdef-1234-5678-90abcdefghij)
```

## Tips for Great Screenshots

1. **Timing**: Take screenshots when data is actively updating to show real-time nature
2. **Consistency**: Use the same window size for all screenshots
3. **Focus**: Highlight the most important features
4. **Clean**: Remove any debugging tools or console logs
5. **Professional**: Ensure the UI looks polished and complete

Remember: These screenshots are often the first thing potential users see, so make them count!