# PharmaCare - Execution & Run Guide

This document provides step-by-step instructions to run both the **Backend** and **Frontend** services.

---

## 1. Prerequisites

- **Node.js**: v18 or higher installed
- **MongoDB**: Installed and running on `mongodb://127.0.0.1:27017`

### If MongoDB is Stopped (`ECONNREFUSED 127.0.0.1:27017`):
Start the Windows MongoDB service using one of the following:

**Option 1: In an Administrator PowerShell terminal**
```powershell
net start MongoDB
# or
Start-Service MongoDB
```

**Option 2: Via Windows Services GUI**
1. Press `Win + R`, type `services.msc`, and press **Enter**.
2. Find **MongoDB Server (MongoDB)**.
3. Right-click it and click **Start** (set to **Automatic** so it starts on boot).

**Option 3: Run directly from command line**
```powershell
& "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --config "C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg"
```

---

## 2. Quick Start (Step-by-Step)

### Option A: Open Two Separate Terminal Windows (Recommended)

#### Terminal 1 — Backend Server
```powershell
# Navigate to the backend directory
cd backend

# Install dependencies (if not already installed)
npm install

# (Optional / First-time setup) Seed the database with sample data & default users
npm run seed

# Start the backend server (runs on http://localhost:5000)
npm run dev
```

#### Terminal 2 — Frontend Application
```powershell
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Vite development server (runs on http://localhost:3000)
npm run dev
```

---

### Option B: Single Command from Root (PowerShell)

If you are running in PowerShell from the project root directory `OOASE`:

```powershell
# Start Backend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# Start Frontend in a new terminal window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

---

## 3. URLs & Ports

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:3000](http://localhost:3000) | Vite dev server |
| **Backend API** | [http://localhost:5000](http://localhost:5000) | Express + MongoDB API |
| **API Health Check** | [http://localhost:5000/api/health](http://localhost:5000/api/health) | Verifies server and DB status |

> Vite frontend is preconfigured to proxy `/api` calls directly to `http://127.0.0.1:5000`.

---

## 4. Default Login Credentials (After Running `npm run seed`)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `priya.sharma@pharmacare.in` | `RxShield#2024` |
| **Billing / POS Cashier** | `cashier.dispense@pharmacare.in` | `PosKey#9931` |
| **Inventory Manager** | `rajesh.verma@pharmacare.in` | `Stock#2024` |
| **Pharmacist** | `arun.kumar@pharmacare.in` | `Pharma#2024` |

---

## 5. Environment Configuration

### Backend (`backend/.env`):
```env
MONGODB_URI=mongodb://127.0.0.1:27017/pharmacare
PORT=5000
SESSION_SECRET=pharmacare_secure_jwt_and_session_secret_key_2026_xyz
NODE_ENV=development
```
