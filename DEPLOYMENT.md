# Deployment Guide - Windows Server (Manual)

This guide covers deploying KafkaVision to a Windows server without Docker.

## Prerequisites

- **Node.js 18+** installed on the server
- **Network access** to Kafka cluster from the server
- **Firewall permissions** for ports 3000 and 4001

---

## Step 1: Copy Project Files

Copy the entire project folder to the server:

**Source:** Your local `kafka-status-monitor` folder
**Destination:** `C:\Program Files\Arvento\kafka-status-monitor`

### Files to Include (CRITICAL)

| File/Folder | Purpose |
|-------------|---------|
| `backend\` | All backend files |
| `backend\.env` | Configuration with SESSION_SECRET |
| `backend\data\users.json` | Encrypted user list |
| `frontend\` | All frontend files |

### Files to Exclude

| File/Folder | Reason |
|-------------|--------|
| `backend\node_modules\` | Will be reinstalled |
| `frontend\node_modules\` | Will be reinstalled |
| `frontend\.next\` | Will be rebuilt |

---

## Step 2: Configure Server IP

Replace `YOUR_SERVER_IP` with your actual server IP address (e.g., `192.168.1.50`).

### 2.1 Edit Backend Configuration

**File:** `C:\Program Files\Arvento\kafka-status-monitor\backend\.env`

Change this line:
```
FRONTEND_URL=http://localhost:3000
```

To:
```
FRONTEND_URL=http://YOUR_SERVER_IP:3000
```

### 2.2 Edit Frontend Configuration

**File:** `C:\Program Files\Arvento\kafka-status-monitor\frontend\.env.local`

Change this line:
```
NEXT_PUBLIC_API_URL=http://localhost:4001
```

To:
```
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:4001
```

---

## Step 3: Open Windows Firewall Ports

Run Command Prompt **as Administrator**:

```cmd
netsh advfirewall firewall add rule name="KafkaVision Frontend" dir=in action=allow protocol=tcp localport=3000

netsh advfirewall firewall add rule name="KafkaVision Backend" dir=in action=allow protocol=tcp localport=4001
```

---

## Step 4: Install Dependencies

Open Command Prompt and run:

```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\backend"
npm install

cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
npm install
```

---

## Step 5: Build Frontend

```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
npm run build
```

Wait for the build to complete successfully.

---

## Step 6: Start Services

### Option A: Manual Start (Two Terminals)

**Terminal 1 - Backend:**
```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\backend"
npm start
```

**Terminal 2 - Frontend:**
```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
npm start
```

### Option B: Using Start Scripts

**Terminal 1:**
```cmd
"C:\Program Files\Arvento\kafka-status-monitor\start-backend.bat"
```

**Terminal 2:**
```cmd
"C:\Program Files\Arvento\kafka-status-monitor\start-frontend.bat"
```

### Option C: start as a service 

  nssm install KafkaVision-Backend "C:\Program Files\nodejs\node.exe" "server.js"
  nssm set KafkaVision-Backend AppDirectory "C:\Program Files\Arvento\kafka-status-monitor\backend"
  nssm set KafkaVision-Backend DisplayName "KafkaVision Backend"
  nssm set KafkaVision-Backend Start SERVICE_AUTO_START

  Create Frontend Service

  nssm install KafkaVision-Frontend "C:\Program Files\nodejs\npm.cmd" "start"
  nssm set KafkaVision-Frontend AppDirectory "C:\Program Files\Arvento\kafka-status-monitor\frontend"
  nssm set KafkaVision-Frontend DisplayName "KafkaVision Frontend"
  nssm set KafkaVision-Frontend Start SERVICE_AUTO_START

  Start Services

  nssm start KafkaVision-Backend
  nssm start KafkaVision-Frontend

  Useful NSSM Commands

  | Command             | Purpose           |
  |---------------------|-------------------|
  | nssm start <name>   | Start service     |
  | nssm stop <name>    | Stop service      |
  | nssm restart <name> | Restart service   |
  | nssm status <name>  | Check status      |
  | nssm edit <name>    | Edit config (GUI) |
  | nssm remove <name>  | Delete service    |


---

## Step 7: Verify Deployment

1. Open Chrome on any computer in the network
2. Navigate to: `http://YOUR_SERVER_IP:3000`
3. Login with your credentials
4. Verify Kafka cluster connection is working

---

## Access URLs

| Service | URL |
|---------|-----|
| Dashboard | `http://YOUR_SERVER_IP:3000` |
| Backend API | `http://YOUR_SERVER_IP:4001` |

---

## Troubleshooting

### Cannot access from other computers

1. Verify firewall rules are added
2. Check Windows Defender Firewall is not blocking
3. Verify server IP is correct in both `.env` files

### Users not showing / Login fails

1. Ensure `backend\data\users.json` was copied
2. Ensure `SESSION_SECRET` in `.env` matches the original
3. User data is encrypted with SESSION_SECRET - must be identical

### Kafka connection fails

1. Verify `KAFKA_BROKERS` in `backend\.env` is accessible from server
2. Check network/firewall between server and Kafka cluster

### Build fails

```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
npm run lint
```

Fix any errors shown before rebuilding.

---

## Running as Windows Service (Optional)

To run as a background service, use PM2:

```cmd
npm install -g pm2
npm install -g pm2-windows-startup

cd "C:\Program Files\Arvento\kafka-status-monitor\backend"
pm2 start server.js --name kafka-backend

cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
pm2 start npm --name kafka-frontend -- start

pm2 save
pm2-startup install
```

---

## Quick Reference

### Start Services
```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\backend" && npm start
cd "C:\Program Files\Arvento\kafka-status-monitor\frontend" && npm start
```

### Stop Services
Press `Ctrl+C` in each terminal window.

### View Logs
Backend logs appear in the backend terminal window.

### Rebuild After Changes
```cmd
cd "C:\Program Files\Arvento\kafka-status-monitor\frontend"
npm run build
npm start
```
