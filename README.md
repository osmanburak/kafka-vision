# 🚀 KafkaVision

Complete visibility into your Kafka clusters - A modern, real-time web application for monitoring Apache Kafka with comprehensive authentication and multilingual support.

![KafkaVision](https://img.shields.io/badge/KafkaVision-Monitoring-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript)

## ✨ Features

### 🔍 **Real-time Monitoring**
- Live Kafka cluster status updates via WebSocket
- Topic monitoring with message counts and partition details
- Consumer group tracking with lag calculation
- Configurable refresh rates (5s, 10s, 15s, 30s, 60s)

### 🌍 **Multilingual Support**
- Complete English and Turkish language support
- Persistent language preferences
- Dynamic UI translations

### 🔐 **Flexible Authentication**
- **Optional Authentication**: Disable for internal deployments
- **LDAP/Active Directory**: Enterprise authentication integration
- **Local Admin**: Fallback authentication method
- **User Management**: Admin approval workflow for LDAP users

### 🎨 **Modern UI Features**
- **Dark Mode**: Full dark theme support
- **Drag & Drop**: Customizable dashboard layout
- **Responsive Design**: Mobile-first approach
- **Favorite Topics**: Pin important topics to top

### ⚙️ **Advanced Features**
- **Connection Manager**: Switch between multiple Kafka clusters
- **Message Viewer**: Inspect actual message content
- **Admin Settings**: Web-based LDAP configuration
- **Statistics Dashboard**: Real-time metrics overview

## 🏗️ Architecture

```
┌─────────────────┐    WebSocket    ┌─────────────────┐    KafkaJS    ┌─────────────────┐
│   Frontend      │◄──────────────►│   Backend       │◄─────────────►│   Kafka Cluster │
│   (Next.js 14)  │                │   (Node.js)     │               │                 │
│   Port: 3000    │    HTTP API     │   Port: 4001    │               │   Port: 9092    │
└─────────────────┘◄──────────────►└─────────────────┘               └─────────────────┘
                                           │
                                           ▼
                                  ┌─────────────────┐
                                  │ LDAP/AD Server  │
                                  │ (Optional)      │
                                  └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **Apache Kafka** (local or remote)
- **LDAP Server** (optional, for authentication)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/kafka-vision.git
cd kafka-vision
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env file with your configuration
npm start
```

### 3. Frontend Setup
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:4001" > .env.local
npm run build
npm start
```

### 4. Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4001

## ⚙️ Configuration

### Environment Variables

**Backend (.env)**
```bash
# Kafka Configuration
KAFKA_BROKERS=localhost:9092
FRONTEND_URL=http://localhost:3000
PORT=4001

# Authentication (Set to false for no-auth mode)
AUTH_ENABLED=true
SESSION_SECRET=your-secure-session-secret

# LDAP Configuration (when AUTH_ENABLED=true)
LDAP_ENABLED=true
LDAP_URL=ldap://your-domain-controller:389
LDAP_BIND_DN=CN=service-account,CN=Users,DC=domain,DC=com
LDAP_BIND_PASSWORD=service-account-password
LDAP_SEARCH_BASE=DC=domain,DC=com
LDAP_SEARCH_FILTER=(sAMAccountName={{username}})

# Local Admin Fallback
LOCAL_ADMIN_PASSWORD=your-admin-password
```

**Frontend (.env.local)**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4001
```

## 🔒 Authentication Modes

### 1. **No Authentication** (Internal/Development)
```bash
AUTH_ENABLED=false
```
- Direct dashboard access
- No login required
- Perfect for internal monitoring

### 2. **Full Authentication** (Production)
```bash
AUTH_ENABLED=true
```
- LDAP/Active Directory integration
- User approval workflow
- Admin settings management

## 📱 Deployment Options

### Development
```bash
# Start both services
./start.bat          # Windows
./start.sh           # Linux

# Or separately
./start-backend.bat  # Backend only
./start-frontend.bat # Frontend only
```

### Production with PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Docker
```bash
docker-compose up -d
```

### Complete deployment guides available in [CLAUDE.md](./CLAUDE.md)

## 🛠️ Development

### Tech Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Socket.io-client
- **Backend**: Node.js, Express, KafkaJS, Socket.io
- **Authentication**: Passport.js, LDAP
- **Session Storage**: File-based sessions
- **Real-time**: WebSocket connections

### Project Structure
```
kafka-vision/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities
├── backend/              # Node.js server
│   ├── auth/            # Authentication logic
│   ├── utils/           # Utilities
│   └── server.js        # Main server file
├── CLAUDE.md            # Comprehensive documentation
├── CHANGELOG.md         # Version history
└── deployment scripts  # Start/stop scripts
```

## 🌐 Supported Languages

- 🇺🇸 **English** - Complete support
- 🇹🇷 **Turkish** - Full translation

## 📊 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x600/1f2937/white?text=Kafka+Dashboard)

### Dark Mode
![Dark Mode](https://via.placeholder.com/800x600/0f172a/white?text=Dark+Mode+Dashboard)

### Admin Settings
![Admin Settings](https://via.placeholder.com/800x600/374151/white?text=Admin+Settings)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 **Documentation**: [CLAUDE.md](./CLAUDE.md)
- 📝 **Changelog**: [CHANGELOG.md](./CHANGELOG.md)
- 🚀 **Features**: [FEATURES.md](./FEATURES.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/kafka-vision/issues)

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

**Made with ❤️ for the Apache Kafka community**