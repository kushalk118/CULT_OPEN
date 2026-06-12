# CULT_OPEN | Smart Asset Management & Resource Allocation Platform

Smart, full-stack asset management and logistics allocation platform designed for organizations (modeled after the Cultural Council of IIT Roorkee) managing shared resources like cameras, studio lighting, audio systems, costumes, and props. 

This platform enables centralized inventory tracking, booking workflow pipelines, asset health logging, audit trails, and analytical visibility.

##Live deployment link:
https://cult-open.vercel.app/
---

## 🎨 Technology Stack
- **Backend API**: Node.js, Express, JSON Web Tokens (JWT) for secure authentication, and `sqlite3` for persistent storage.
- **Frontend Client**: React (Vite-based), Vanilla CSS (premium dark-theme, glassmorphism overlays, animations).
- **Database**: SQLite (100% self-contained, file-based, zero configuration required).
- **Containerization**: Docker & Docker Compose configuration.
- **Visualizations**: Interactive React-rendered custom inline SVG charts.

---

## ✨ Features
1. **User Authentication & Role-Based Access Control**:
   - Register and login as Consumers (council members/students) or Administrators (section in-charges).
   - JWT-token based secure session management.
2. **Inventory Management**:
   - Search, filter by category, and track availability pools.
   - Admin tools to Add, Edit, and Delete assets.
3. **Asset Discovery & Booking Pipeline**:
   - Interactive calendar request form.
   - Intelligent quantity checks to block over-booking.
4. **Approval & Issuance Workflow**:
   - Admins approve or reject pending requests.
   - Check out (Issue) and Check in (Return) assets with real-time inventory adjustments.
5. **Analytics Dashboard**:
   - Top utilized assets statistics, category allocations, and inventory health rates.
   - Premium responsive graphs.
6. **Asset Health & Maintenance Logs**:
   - Damage reporting system for broken gear.
   - Lock assets under repair from booking requests.
   - Resolution logs to bring items back online.
7. **Security Audit logs & In-App Notifications**:
   - Chronicled admin audit trails.
   - Alert notifications for booking status updates and deadlines.
8. **QR Code Operations Simulator**:
   - Custom dynamic QR code generator for asset tags.
   - Embedded QR scanner console simulator on the bookings manager tab.

---
## Default Demo Accounts

Admin Account

Email: [admin@example.com](mailto:admin@example.com)

Password: admin123

Consumer Account

Email: [consumer@example.com](mailto:consumer@example.com)

Password: consumer123

The application automatically initializes sample data when the database is empty to ensure a consistent demonstration environment.
---

## 🚀 Setup & Installation Instructions

Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and npm installed.

### Option A: Local Run (Recommended for Dev/Testing)

#### 1. Setup Backend
Open a terminal, navigate to the `backend` directory, install packages, and seed the database:
```bash
cd backend
npm install
npm run seed
```
This initializes the SQLite database schema and populates default user and equipment profiles:
- **Admin Login**: `admin@example.com` / Password: `admin123`
- **Consumer Login**: `consumer@example.com` / Password: `consumer123`

Start the Express API server:
```bash
npm run start
```
The server will boot on `https://cult-open.onrender.com`.

#### 2. Setup Frontend
Open a new terminal window, navigate to the `frontend` directory, install packages, and start Vite:
```bash
cd frontend
npm install
npm run dev
```
The frontend dev server will launch on `https://cult-open.vercel.app/`. Open your browser and navigate to this address.

---

### Option B: Docker Containerized Run

Run the entire full-stack application instantly in Docker container pods:
```bash
docker-compose up --build
```
This builds and launches the backend service container (exposed on port `5000`) and the frontend Vite web server container (exposed on port `5173`).

To stop and teardown containers:
```bash
docker-compose down
```
## Team Members
- Kattamuri Kushal
- Rishik Vodnala
