# KafkaVision - Technical Documentation

## 🚨 CRITICAL RULES - NEVER FORGET! 🚨

### 🌍 **MANDATORY TURKISH LANGUAGE SUPPORT**
**ALL USER-FACING TEXT MUST HAVE TURKISH TRANSLATIONS**
- Every new feature, UI text, help text, tooltip, or message MUST be bilingual
- Add translations to `frontend/src/lib/i18n.ts` for both English (en) and Turkish (tr)
- Test language switching to ensure all text translates properly
- This rule applies to ALL Claude sessions - no exceptions!

### 📝 **MANDATORY CHANGELOG DOCUMENTATION**
**ALL CHANGES MUST BE DOCUMENTED IN CHANGELOG.md**
- Every modification, bug fix, feature addition, or enhancement MUST be logged
- Update CHANGELOG.md immediately after making changes
- Use proper format: [Type] - YYYY-MM-DD with detailed descriptions
- Include files affected, reasoning, and impact
- This rule applies to ALL Claude sessions - no exceptions!

### 🚫 **MANUAL SERVER CONTROL ONLY**
**NEVER START SERVERS AUTOMATICALLY**
- DO NOT run `npm start`, `npm run dev`, or any server startup commands
- User will start frontend and backend manually when needed
- Only stop servers if explicitly asked by user
- Ask user to start servers when testing is required
- This rule applies to ALL Claude sessions - no exceptions!

### 📦 **AUTOMATIC DEPENDENCY INSTALLATION**
**ALWAYS ENSURE DEPENDENCIES ARE INSTALLED**
- When backend crashes due to missing modules, run `npm install` immediately
- Check for `node_modules` folder before starting servers
- Use `auto-install.bat` (Windows) or `auto-install.sh` (Linux) for complete setup
- Start scripts now automatically check and install missing dependencies
- This prevents "module not found" errors and ensures smooth operation

### 🏗️ **MANDATORY BUILD & CI/CD VERIFICATION**
**ALWAYS VERIFY BUILD SUCCESS AND CI/CD READINESS**
- After any code changes, run `npm run build` in frontend directory
- Ensure TypeScript compilation succeeds with no errors
- Verify ESLint passes with no errors (`npm run lint`)
- Check that all Docker images build successfully
- Confirm GitHub Actions workflows are present and valid
- Test that the application starts without errors
- This rule applies to ALL Claude sessions - no exceptions!

## Overview
KafkaVision provides complete visibility into your Kafka clusters. A modern, real-time monitoring application built with Next.js 14 and Node.js. Offers comprehensive monitoring of Kafka clusters, topics, consumer groups, and real-time metrics with multilingual support.

## Architecture

### Frontend (Next.js 14)
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Real-time**: Socket.io Client
- **Internationalization**: Custom i18n system (English/Turkish)

### Backend (Node.js)
- **Framework**: Express.js
- **Language**: JavaScript
- **Kafka Client**: KafkaJS
- **Real-time**: Socket.io Server
- **Environment**: dotenv for configuration

## Key Features

### 1. Real-time Monitoring
- WebSocket-based live updates
- Configurable refresh rates (5s, 10s, 15s, 30s, 60s)
- Automatic reconnection handling
- Connection status indicators

### 2. Kafka Metrics
- **Cluster Information**: Broker details, controller info
- **Topic Monitoring**: Message counts, partition details, consumer lag
- **Consumer Groups**: Member details, states, coordinator info
- **Partition-level Details**: Current/latest offsets, lag calculation

### 3. Multilingual Support
- English and Turkish language support
- Persistent language preferences
- Complete UI translation coverage
- Dynamic state translations (Stable → Kararlı, etc.)

### 4. User Interface
- Responsive design (mobile-first)
- Expandable topic/consumer group details
- Settings panel with language/refresh rate controls
- Statistics dashboard with 4 key metrics

## Technical Implementation

### Kafka Integration
```javascript
// Backend Kafka connection
const kafka = new Kafka({
  clientId: 'kafka-status-monitor',
  brokers: ['192.168.1.189:9092'],
  connectionTimeout: 30000,
  requestTimeout: 30000
});
```

### Lag Calculation Logic
```javascript
// Consumer lag calculation (matches kafka-consumer-groups.sh)
const lag = isEmptyPartition ? 0 : Math.max(0, Number(logEndOffset - currentOffset));
```

### Real-time Updates
```javascript
// WebSocket communication
socket.on('setRefreshRate', (newRate) => {
  startPeriodicUpdates(newRate * 1000);
});
```

### Internationalization
```typescript
// Translation system
export const translations = {
  en: { title: 'Kafka Monitor', ... },
  tr: { title: 'Kafka Monitör', ... }
};
```

## File Structure
```
kafka-status-monitor/
├── backend/
│   ├── server.js              # Main backend server
│   ├── .env                   # Environment configuration
│   └── package.json           # Backend dependencies
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   └── page.tsx       # Main dashboard page
│   │   ├── components/
│   │   │   ├── TopicDetails.tsx
│   │   │   ├── ConsumerGroupDetails.tsx
│   │   │   ├── StatusCard.tsx
│   │   │   └── Settings.tsx
│   │   └── lib/
│   │       ├── types.ts       # TypeScript definitions
│   │       ├── i18n.ts        # Internationalization
│   │       └── socket.ts      # WebSocket client
│   └── package.json           # Frontend dependencies
├── CLAUDE.md                  # This documentation
└── CHANGELOG.md               # Modification log
```

## Environment Configuration

### Backend (.env)
```
KAFKA_BROKERS=192.168.1.189:9092
FRONTEND_URL=http://localhost:3000
PORT=4001

# Authentication (Set to false for internal deployments without login)
AUTH_ENABLED=true
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## Key Components

### 1. TopicDetails Component
- Displays topic summary (partitions, total messages, consumed, lag status)
- Expandable partition-level details
- Real-time lag calculation with proper empty partition handling
- Consumer group assignment display

### 2. ConsumerGroupDetails Component
- Shows consumer group state (Stable, Rebalancing, etc.)
- Member information (Client ID, Host, Assignments)
- Coordinator details
- Multilingual state translations

### 3. Settings Component
- Language switching (persistent via localStorage)
- Refresh rate configuration (real-time via WebSocket)
- Clean dropdown interface

### 4. Statistics Dashboard
- **Total Messages**: Sum across all topics
- **Consumed**: Total consumed messages
- **Remaining**: Total lag/remaining messages
- **Connection**: Real-time status with refresh rate display

## Data Flow

1. **Backend** connects to Kafka cluster every X seconds (configurable)
2. **Fetches** cluster metadata, topics, and consumer groups
3. **Calculates** consumer lag using Kafka offset APIs
4. **Filters** system topics (starting with `__`)
5. **Broadcasts** data to all connected clients via WebSocket
6. **Frontend** receives updates and renders UI with translations

## Special Handling

### Empty Partitions
- When `low === high`: partition has no messages
- Lag is set to 0 (cannot lag on empty partition)
- UI displays "No msgs" / "Mesaj yok"

### Consumer Offsets
- `-1` offset means consumer hasn't consumed from partition
- UI displays "No msgs" / "Mesaj yok" for clarity
- Proper lag calculation accounts for unconsumed partitions

### System Topics
- Filters out `__consumer_offsets` and other system topics
- Only displays user-created topics
- Maintains accurate topic counts

## Performance Optimizations

- Limits to first 20 topics for processing
- Limits to first 10 consumer groups
- Efficient WebSocket updates (only when data changes)
- Lazy loading of partition details (expandable sections)
- Proper error handling and connection recovery

## Browser Compatibility
- Modern browsers supporting ES6+
- WebSocket support required
- LocalStorage for settings persistence

## Deployment Notes
- Backend runs on port 4001 (configurable)
- Frontend runs on port 3000 (Next.js default)
- Requires network access to Kafka brokers
- CORS configured for cross-origin requests

## Monitoring Capabilities
- Real-time cluster health
- Topic-level message flow monitoring
- Consumer group performance tracking
- Partition-level lag analysis
- Connection status monitoring

## Unix Deployment Guide

### Prerequisites
```bash
# Install Node.js (version 18+ recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Or using yum (CentOS/RHEL)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# Verify installation
node --version
npm --version
```

### 1. Manual Deployment

#### Step 1: Transfer Files
```bash
# Create project directory
mkdir -p /opt/kafka-monitor
cd /opt/kafka-monitor

# Transfer files from Windows (using scp)
scp -r user@windows-machine:/path/to/kafka-status-monitor/* .

# Or clone from git repository
git clone <your-repo-url> .
```

#### Step 2: Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Create production environment file
cp .env.example .env
nano .env
```

Edit .env file:
```bash
KAFKA_BROKERS=192.168.1.189:9092
FRONTEND_URL=http://your-unix-server:3000
PORT=4001
NODE_ENV=production
```

#### Step 3: Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Create production environment file
echo "NEXT_PUBLIC_API_URL=http://your-unix-server:4001" > .env.local

# Build for production
npm run build
```

#### Step 4: Start Services
```bash
# Start backend (in background)
cd ../backend
nohup npm start > backend.log 2>&1 &

# Start frontend (in background)
cd ../frontend
nohup npm start > frontend.log 2>&1 &
```

### 2. Production Deployment with PM2

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Create PM2 Configuration
```bash
# Create ecosystem.config.js in project root
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'kafka-monitor-backend',
      cwd: './backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    },
    {
      name: 'kafka-monitor-frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/frontend-err.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log'
    }
  ]
};
EOF

# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

#### PM2 Management Commands
```bash
# Check status
pm2 status

# View logs
pm2 logs kafka-monitor-backend
pm2 logs kafka-monitor-frontend

# Restart services
pm2 restart all

# Stop services
pm2 stop all

# Monitor resources
pm2 monit
```

### 3. Nginx Reverse Proxy (Recommended)

#### Install Nginx
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### Configure Nginx
```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/kafka-monitor

# Add configuration:
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or IP

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable the site
sudo ln -s /etc/nginx/sites-available/kafka-monitor /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 4. Systemd Service (Alternative to PM2)

#### Create Backend Service
```bash
sudo nano /etc/systemd/system/kafka-monitor-backend.service

[Unit]
Description=Kafka Monitor Backend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/kafka-monitor/backend
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=4001

[Install]
WantedBy=multi-user.target
```

#### Create Frontend Service
```bash
sudo nano /etc/systemd/system/kafka-monitor-frontend.service

[Unit]
Description=Kafka Monitor Frontend
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/opt/kafka-monitor/frontend
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

#### Enable and Start Services
```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable kafka-monitor-backend
sudo systemctl enable kafka-monitor-frontend

# Start services
sudo systemctl start kafka-monitor-backend
sudo systemctl start kafka-monitor-frontend

# Check status
sudo systemctl status kafka-monitor-backend
sudo systemctl status kafka-monitor-frontend
```

### 5. Docker Deployment (Advanced)

#### Create Dockerfiles
```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 4001
CMD ["node", "server.js"]

# frontend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Docker Compose
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "4001:4001"
    environment:
      - KAFKA_BROKERS=192.168.1.189:9092
      - FRONTEND_URL=http://localhost:3000
      - PORT=4001
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4001
    depends_on:
      - backend
    restart: unless-stopped
```

#### Deploy with Docker
```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 6. Firewall Configuration
```bash
# Ubuntu (UFW)
sudo ufw allow 3000/tcp
sudo ufw allow 4001/tcp
sudo ufw allow 80/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --permanent --add-port=4001/tcp
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

### 7. Monitoring and Logs
```bash
# View application logs
tail -f /opt/kafka-monitor/logs/*.log

# System resource monitoring
htop
df -h
free -h

# Network connectivity
netstat -tlnp | grep -E "(3000|4001)"
ss -tlnp | grep -E "(3000|4001)"

# Test Kafka connectivity
telnet 192.168.1.189 9092
```

### 8. Backup and Updates
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backup/kafka-monitor-$(date +%Y%m%d-%H%M%S)"
mkdir -p $BACKUP_DIR
cp -r /opt/kafka-monitor $BACKUP_DIR/
tar -czf $BACKUP_DIR.tar.gz -C /backup kafka-monitor-*
rm -rf $BACKUP_DIR

# Update deployment
cd /opt/kafka-monitor
git pull origin main
cd backend && npm install
cd ../frontend && npm install && npm run build
pm2 restart all
```

### Security Considerations
- Run services as non-root user
- Configure firewall rules
- Use HTTPS in production (Let's Encrypt)
- Regular security updates
- Monitor application logs
- Implement rate limiting
- Use environment variables for sensitive data

## 🔄 **DEVELOPMENT WORKFLOW - MANDATORY STEPS**

### ⚠️ **Before Adding ANY New Feature:**
1. **🌍 Plan Turkish Translations**: Identify all user-facing text that will need translation
2. **📝 Check i18n.ts**: Verify translation keys don't already exist
3. **🔧 Implement Feature**: Add functionality with translation placeholders
4. **🌍 Add Translations**: Update both English and Turkish in `frontend/src/lib/i18n.ts`
5. **🧪 Test Both Languages**: Verify text displays correctly in both EN and TR
6. **📝 Document in CHANGELOG.md**: Log all changes with translation details

### 🌍 **Turkish Translation Examples:**
```typescript
// CORRECT - Always add both languages
export const translations = {
  en: {
    newFeature: 'New Feature',
    helpText: 'Click here for help'
  },
  tr: {
    newFeature: 'Yeni Özellik', 
    helpText: 'Yardım için buraya tıklayın'
  }
};
```

### ❌ **NEVER DO:**
- Add English-only text without Turkish translation
- Hardcode strings in components instead of using `t('key')`
- Forget to test language switching
- Skip documenting translation additions in CHANGELOG.md

## Future Enhancement Possibilities
- Additional language support (beyond EN/TR)
- Historical data trends
- Alerting system
- Kafka Connect monitoring
- Producer metrics
- Schema registry integration