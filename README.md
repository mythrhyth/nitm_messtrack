# NITM MessTrack Portal

An industry-standard, secure, database-backed web application built for **NIT Meghalaya (NITM)** to track student mess fees, manage leaves, and automate meal refund calculations. This system replaces Excel sheets and manual paperwork with a centralized digital ledger.

---

## 🚀 Key Features

### 🏢 Panel Separation & Role-based Access
- **Admin Dashboard**: Overview of system statistics (active/leave students, net revenue, total refunds) with comprehensive search, filters, visual charts, and settings.
- **Student Portal**: Locked access allowing students to view their profile, mess fee payments, refund history, and apply for leaves.

### 📝 Mess & Leave Lifecycle Management
- **Student CRUD**: Complete management for adding, editing, deleting, and searching student records.
- **Leave CRUD & Math**: Missed meals (Breakfast, Lunch, Dinner) are tracked. Leave refunds are automatically calculated in real-time based on customizable meal rates and semesters.
- **History Logs**: Automated database triggers to adjust student `refundEarned` balance on leave creation, modification, or cancellation.

### ⚡ Smart UI Automations
- **Email Autofill**: Typing a student's roll number (e.g., `B24CS038`) automatically generates their institutional email (`b24cs038@nitm.ac.in`) in lowercase.
- **Fee Mirroring**: The paid fee amount is mirrored automatically from the mess fee during manual student addition.
- **DOB Password Mapping**: Date of Birth is a required field; the student portal password dynamically hashes the DOB, so changing the DOB updates their login password.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Packages |
|---|---|---|
| **Frontend** | React, Vite, TS | `@tanstack/react-query`, `axios`, `recharts`, `lucide-react` |
| **Backend** | Node.js, Express.js | `prisma`, `bcrypt`, `jsonwebtoken`, `zod`, `morgan`, `helmet` |
| **Database** | SQLite (Embedded) | SQLite via Prisma Client ORM |

---

## 📂 Project Architecture

```text
NITM MessTrack Web App/
├── backend/                  # REST Express API Server
│   ├── prisma/               # Database models, migrations, and seed script
│   │   ├── schema.prisma     # Prisma data models
│   │   └── seed.ts           # Seeding default settings and credentials
│   ├── src/
│   │   ├── config/           # Database configurations
│   │   ├── controllers/      # Route controllers (request/response formatters)
│   │   ├── middleware/       # Auth (JWT), request logging, and validations
│   │   ├── models/           # Zod validation schemas
│   │   ├── repositories/     # Data Access Layer (Prisma queries)
│   │   ├── routes/           # REST endpoints definition
│   │   └── services/         # Core business logic
│   └── tsconfig.json         # Backend TypeScript compiler configuration
├── src/                      # Frontend SPA application
│   ├── app/
│   │   ├── App.tsx           # Main Single Page Application UI view
│   │   └── components/       # UI layouts & icons
│   ├── services/             # Axios API integration service handlers
│   └── main.tsx              # Application entry point with React Query client wrapper
├
├── package.json              # Frontend package definitions
└── vite.config.ts            # Vite assets compiler configurations
```

---

## ⚙️ Local Development Setup

### Prerequisites
Ensure you have **Node.js** (v18+) and **npm** installed.

---

### Step 1: Clone & Install Dependencies
1. Install root (frontend) dependencies:
   ```bash
   npm install
   ```
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

---

### Step 2: Configure Environment Variables
Create a `.env` file in the **backend** folder:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="super-secret-key-12345-nitm-messtrack-app-production-key"
```

---

### Step 3: Initialize the Database
1. Run Prisma database migrations to create local SQLite tables:
   ```bash
   npx prisma migrate dev --name init
   ```
2. Seed settings, default hostels, and initial student profiles:
   ```bash
   npm run prisma:seed
   ```

---

### Step 4: Run the Application
1. **Start the Backend API Server**:
   Navigate to the `backend/` folder and run:
   ```bash
   npm start
   ```
   *The backend will boot up at `http://localhost:5000`.*

2. **Start the Frontend Client**:
   Navigate to the project root and run:
   ```bash
   npm run dev
   ```
   *Vite will start the client application (usually at `http://localhost:5173` or `http://localhost:5174`).*

---

## 🔑 Default Accounts for Testing

| Role | Username | Password / Credentials |
|---|---|---|
| **Admin** | `admin` | `admin123` |
| **Student** | `B22CS042` | `2003-06-15` (Format: `YYYY-MM-DD`) |

---

## 📖 API Documentation & Swagger
Once the backend server is running, you can explore, test, and query all REST API endpoints using the interactive Swagger UI panel:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**