# Student Database Management System

A minimal, production-ready, full-stack Student Records Management System with a **single-file Java REST Backend (`StudentServer.java`)** and a **React + Vite Frontend**.

Features complete end-to-end CRUD operations, live search, real-time feedback, JSON persistence, and a clean black-and-white monochrome design.

---

## 🚀 Key Features

1. **Single-File Java Backend (`StudentServer.java`)**:
   - Built entirely with standard **Java SE (`com.sun.net.httpserver.HttpServer`)**.
   - **Zero external dependencies** (no Maven/Gradle required, runs with standard `java StudentServer.java`).
   - Thread-safe in-memory store with automatic JSON disk persistence (`students_data.json`).
   - Full CORS preflight support and input validation.
2. **End-to-End Web CRUD**:
   - **Create**: Add student records (Register No, Name, Department, Year 1-4, Email) with duplicate prevention.
   - **Read**: Live data table showing all records sorted with newest first.
   - **Update**: Edit modal pre-filled with existing student details.
   - **Delete**: Confirmation modal to prevent accidental record loss.
3. **Live Search & Filter**:
   - Instant search across Register Number, Student Name, and Department with quick clear (`X`).
4. **Modern Monochrome Design**:
   - Clean black-and-white theme built with high contrast, responsive cards, and clean typography.

---

## 🛠️ Architecture & Tech Stack

```
   ┌───────────────────────────────┐
   │ React 18 + Vite Frontend      │
   │ Port: http://localhost:7000   │
   └───────────────┬───────────────┘
                   │
         REST API  │ (Proxied /api/*)
                   ▼
   ┌───────────────────────────────┐
   │ Single-File Java HTTP Server  │
   │ File: StudentServer.java      │
   │ Port: http://localhost:8080   │
   └───────────────┬───────────────┘
                   │
                   ▼
      [ students_data.json ]
```

- **Backend**: Java 11+ (`StudentServer.java`, Port `8080`)
- **Frontend**: React 18, Vite, Lucide Icons, Plain CSS (Port `7000`)
- **Storage**: `students_data.json` (auto-created on first run)

---

## ⚡ Quick Start

### 1. Run the Java Backend Server (Port 8080)

Using standard Java (no installation of third-party tools needed):

```bash
# Direct run with Java 11+ (single-file execution)
java StudentServer.java

# Or compile and run:
javac StudentServer.java
java StudentServer
```

The backend server starts immediately at **`http://localhost:8080`**.

### 2. Run the React Frontend (Port 7000)

In a separate terminal:

```bash
npm install
npm run dev
```

Open **`http://localhost:7000`** in your browser.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/students` | Get all student records |
| `GET` | `/api/students?search={q}` | Search students by register number, name, or department |
| `GET` | `/api/students/{id}` | Get a single student by ID |
| `POST` | `/api/students` | Create a new student record |
| `PUT` | `/api/students/{id}` | Update an existing student record |
| `DELETE` | `/api/students/{id}` | Delete a student record by ID |
| `GET` | `/api/health` | Health check endpoint |

### Sample JSON Payload (POST / PUT)
```json
{
  "register_no": "21CS101",
  "name": "Alice Johnson",
  "department": "Computer Science & Engineering",
  "year": 3,
  "email": "alice.j@school.edu"
}
```

---

## 🏗️ Production Build

```bash
npm run build
npm run preview
```

---

## 📄 License
MIT License.
