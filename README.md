# Automated Student Library Usage Tracking System

This project is a software-centric, real-time occupancy monitoring and check-in system designed as a case study for the Federal University of Lafia (FULafia) Library. The system addresses common library overcrowding and administrative tracking inefficiencies by combining active QR code session management with passive computer vision (YOLOv8) occupancy tracking.

## System Architecture

The project consists of three distinct modules:

1. **Backend Server (Node.js + Express + Socket.IO + Prisma):**
   Manages REST API endpoints, user authentication, SQLite database operations, and real-time state broadcasts over WebSocket.
2. **Frontend client (React + Vite + Custom CSS):**
   Features a flat, responsive user interface styled with FULafia official brand colors (Forest Green and Gold) without unnecessary cards or shadows. Includes a live administrator dashboard, reporting exports, student directories, and a smartphone QR scanner.
3. **Computer Vision Service (Python + FastAPI + OpenCV + YOLOv8):**
   Analyzes library camera feeds in real time to count occupants and posts updates to the backend. Includes an automatic simulated fallback and an MJPEG video stream.

---

## Technical Stack

* **Backend:** Node.js, Express, Socket.IO, Prisma ORM, SQLite
* **Frontend:** React, Vite, Recharts (for charts), Lucide React (for icons)
* **Computer Vision:** Python, FastAPI, OpenCV, Ultralytics YOLOv8

---

## Installation & Setup

### Prerequisites
Make sure you have Node.js (v18+) and Python (v3.10+) installed on your system.

---

### Option A: Automated Installation (Recommended)
This method automatically configures environment files, installs dependencies for all three modules, sets up the SQLite database, and seeds it with fresh logs based on your current local date.

1. Locate and double-click the **`setup.bat`** file in the project root directory.
2. Wait for the terminal window to finish running all configuration tasks.
3. Once the setup has completed successfully, start all servers simultaneously by double-clicking **`run_all.bat`**.

---

### Option B: Manual Installation

#### 1. Database & Backend Setup
1. Open your terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Copy environment configuration file if not already present:
   ```bash
   copy .env.example .env
   ```
4. Run database migrations to initialize SQLite tables:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with library zones, administrator accounts, student profiles, and rich historical logs:
   ```bash
   npm run prisma:seed
   ```
6. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend server will run on [http://localhost:5000](http://localhost:5000).

#### 2. Frontend Setup
1. Navigate to the frontend folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies (bypassing peer-dependency conflicts with React 19):
   ```bash
   npm install --legacy-peer-deps
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open the displayed URL (typically [http://localhost:5173](http://localhost:5173)) in your web browser.

#### 3. Computer Vision Service Setup
1. Navigate to the cv-service folder:
   ```bash
   cd ../cv-service
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the CV service:
   ```bash
   python main.py
   ```
   The FastAPI server will run on [http://localhost:8000](http://localhost:8000). If PyTorch/YOLOv8 is not fully installed, the service will gracefully fall back to simulation mode.

---

## Testing Credentials

The database seeder configures the following testing accounts:

### Administrator Account
* **Username:** `admin`
* **Password:** `admin123`

### Student Accounts
Use any of the following matriculation numbers:
* `2021/CP/CSC/0054` (Audu Patrick - Project Author)
* `2021/CP/CSC/0001` (Abubakar Ibrahim)
* `2021/CP/CSC/0005` (Chioma Nwachukwu)
* `2021/CP/CSC/0018` (Fatima Bello)

* **Default Password for all Students:** `student123`

---

## Key Features

* **Hybrid Verification Matrix:** Compares real-time QR check-ins against YOLO camera counts to identify density variations.
* **Agile Sprints Structure:** Decoupled modules guarantee core QR functionality remains operational even during camera/power outages.
* **Instant Exports:** Generate and download visitor activity logs as CSV spreadsheets directly from the reports dashboard.
* **Real-time Synchronization:** Socket.IO pushes live occupancy percentages instantly to all connected dashboards when a student scans in or out.
