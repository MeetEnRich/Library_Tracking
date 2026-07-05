# Project Defense Presentation Guide & Cheat Sheet

This guide prepares you for your BSc project defense. It contains architectural definitions, system flow explanations, and strategies to address common examiner questions.

---

## 1. Key Definitions & Vocabulary to Use
During your presentation, use these formal academic and technical terms to demonstrate depth:
* **BYOD (Bring Your Own Device) Model:** Reuses student-owned smartphones as scanning hardware, reducing university capital expenditures.
* **Soft Sensors:** The concept of using existing device capabilities (like smartphone camera viewfinders and browser video streams) to act as check-in registers instead of buying physical biometric/card readers.
* **Hybrid Verification:** The core innovation of comparing active session logs (QR check-ins) against passive surveillance counts (YOLOv8 camera counts) to measure seating occupancy and spot security anomalies (Discrepancies).
* **Decoupled Architecture:** The three system modules (Frontend, Backend, CV Service) run independently. If the camera service goes down, students can still scan in; if the backend crashes, the CV service can hold local counts.

---

## 2. Walkthrough of the System Flow
If asked to trace a student checking into the library:
1. **Scan:** The student opens the React app on their mobile browser and scans the QR code sign displayed on a tablet at the e-Library entrance.
2. **Verification (Backend):** The camera decodes `ZONE_ELIBRARY_FULAFIA` and sends it to the Node.js API (`/api/qr/scan`). The server verifies the matric number, notes that there is no active log, and opens a new session log with `entryTime = current_timestamp()`.
3. **Database Write:** The log is saved securely to the SQLite database via Prisma ORM.
4. **WebSocket Broadcast:** The backend uses **Socket.IO** to broadcast the updated seating count to all active dashboards.
5. **Real-time Re-render:** The admin dashboard receives the websocket event and instantly slides the capacity gauge.
6. **AI verification:** Meanwhile, the camera feed monitors the room. The Python FastAPI service processes frames, detects humans using YOLO, and sends camera updates every 3 seconds to `/api/cv/occupancy` which updates the AI count gauge.

---

## 3. Anticipated Examiner Questions & Answers

### Q1: "Why did you use SQLite instead of MySQL/PostgreSQL?"
* **Answer:** *"SQLite is a serverless, zero-configuration relational database. It stores the entire database in a single, lightweight file (`dev.db`). This makes the system highly portable and easy to run locally on any computer—such as during this project demonstration—without requiring local installation and configuration of a separate database server. It implements full SQL relations and ACID transactions, which fits the library logs database schema perfectly. For a production cloud deployment, we can switch the Prisma DB connector to PostgreSQL with a single line of config."*

### Q2: "How do you prevent a student from taking a photo of the QR code and checking in from their hostel?"
* **Answer:** *"We addressed this by implementing the **Library Digital QR Signs** page. Instead of using static paper prints (which can be photographed and shared), the QR codes are designed to be displayed on active tablet/monitor screens mounted physically at the entrance desks. In a production environment, we can set these digital signs to regenerate the QR code with a secure rotating token every 30 seconds, making copied photos obsolete."*

### Q3: "What is the role of YOLOv8 here? Why not just use QR codes?"
* **Answer:** *"QR codes only track students who actively scan in. If a student forgets to scan out, or if a guest walks in without scanning, the database logs become inaccurate. YOLOv8 provides a **passive verification layer**. By counting actual bodies in the room, it computes a 'Discrepancy Variance'. If the camera counts 30 people but only 10 are scanned in, the admin dashboard alerts staff of a variance of 20 people, indicating that either students forgot to scan or unauthorized guests entered the unit."*

### Q4: "How does the system handle students who forget to check out?"
* **Answer:** *"We implemented an **Automated Session Cleanup Engine** in the Node.js backend. Every hour, a background timer scans the logs table for active sessions that have been open for more than 8 hours. It automatically closes those forgotten sessions and sets their exit time to an estimated 2 hours from entry to prevent analytics distortions."*

### Q5: "How does the system handle strict lighting and camera angles?"
* **Answer:** *"The YOLO module uses the pre-trained `yolov8n.pt` weights, which are highly robust under variable lighting. In situations where lighting is poor or physical cameras are unavailable, the CV service automatically switches to simulated occupancy data, maintaining system stability without interrupting the admin interface."*
