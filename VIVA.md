# DBMS & Software Architecture Viva Guide

This guide is designed for laboratory viva examinations, technical evaluations, and software architecture questions covering the **Student Database Management System with Single-File Java Backend**.

---

## 🎯 1. Core Concepts & Architecture

### 1.1 Single-File Java Backend Architecture (`StudentServer.java`)
- **Zero Third-Party Dependencies**: Uses `com.sun.net.httpserver.HttpServer` included in the standard Java SE JDK runtime.
- **RESTful Endpoints**: Adheres to REST principles mapping HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`) to CRUD operations.
- **Thread Safety**: Uses `ConcurrentHashMap<Long, Student>` and `AtomicLong` for atomic ID generation and lock-free thread-safe concurrent access.
- **Virtual Thread Concurrency**: Uses `Executors.newVirtualThreadPerTaskExecutor()` (Java 21+) to serve concurrent HTTP requests with minimal overhead.
- **Data Persistence**: Maintains an in-memory database and writes asynchronously to disk in `students_data.json` upon any mutation.

### 1.2 Data Integrity & Validation
- **Uniqueness Constraint**: The backend checks for existing duplicate register numbers before inserting or updating, returning `HTTP 409 Conflict`.
- **Domain Validation**: Validates `year` between 1 and 4, and ensures non-empty strings for all mandatory fields. If invalid, returns `HTTP 400 Bad Request`.
- **CORS Support**: Implements preflight `OPTIONS` handling with `Access-Control-Allow-Origin: *` to enable cross-origin requests from any frontend client.

---

## 💻 2. API Endpoints Cheatsheet

```bash
# 1. Health Check
curl http://localhost:8080/api/health

# 2. Get All Students
curl http://localhost:8080/api/students

# 3. Create Student
curl -X POST http://localhost:8080/api/students \
  -H "Content-Type: application/json" \
  -d '{"register_no":"21CS101","name":"Alice Johnson","department":"Computer Science & Engineering","year":3,"email":"alice@school.edu"}'

# 4. Update Student
curl -X PUT http://localhost:8080/api/students/1 \
  -H "Content-Type: application/json" \
  -d '{"register_no":"21CS101","name":"Alice Johnson","department":"AI & DS","year":4,"email":"alice@school.edu"}'

# 5. Delete Student
curl -X DELETE http://localhost:8080/api/students/1
```

---

## ⏱️ 3. 2-Minute Exam Demonstration Script

| Timestamp | Action | What to Say / Demonstrate |
| :--- | :--- | :--- |
| **0:00 - 0:25** | **Architecture Overview** | "Good morning/afternoon. Today I present our complete full-stack Student Database Management System. The entire backend is consolidated into a single, highly-optimized Java source file (`StudentServer.java`) using built-in Java HTTP server APIs with zero external dependencies, paired with a React and Vite frontend." |
| **0:25 - 0:50** | **Backend Execution & Persistence** | "The Java backend runs on port 8080 using `java StudentServer.java`. It manages student records with thread-safe `ConcurrentHashMap` and `AtomicLong`, automatically persisting records to `students_data.json` on disk across restarts." |
| **0:50 - 1:20** | **Live CRUD Operations** | 1. **Create**: "Clicking '+ Add Student', let's register student `21CS101`, 'Alice Johnson', 3rd Year CSE. Validation ensures all fields and year between 1-4 are valid."<br>2. **Read & Search**: "The student is instantly created and displayed in the table. Using the search bar, typing `CS` filters matching records instantaneously."<br>3. **Update**: "Clicking edit, let's update Alice's year to 4th Year. The change persists in our Java backend immediately."<br>4. **Delete**: "Clicking delete prompts a confirmation dialog preventing accidental data loss." |
| **1:20 - 1:45** | **API & Proxy Integration** | "The React frontend at port 7000 communicates with our Java backend at port 8080 via a Vite reverse proxy `/api/*`, eliminating CORS friction and decoupling client and server architecture." |
| **1:45 - 2:00** | **Conclusion** | "The system demonstrates high performance, clean REST API design, thread-safe persistence, and a modern monochrome user experience. Thank you!" |

---

## ❓ 4. Frequently Asked Viva Questions

### Q1: Why use `ConcurrentHashMap` instead of a standard `HashMap`?
**Answer**: `HashMap` is not thread-safe. When multiple HTTP requests are handled concurrently across different threads, concurrent read/write operations on a plain `HashMap` can cause race conditions or corrupt internal bucket pointers. `ConcurrentHashMap` uses segment locking/CAS operations to provide high-throughput, thread-safe concurrent access.

### Q2: What is the benefit of `AtomicLong` for ID generation?
**Answer**: Standard `long` increments (`count++`) are not atomic (they involve read, modify, and write). In a multi-threaded web server, two concurrent `POST` requests could read the same ID value, causing duplicate primary keys. `AtomicLong.getAndIncrement()` uses hardware-level Compare-And-Swap (CAS) to guarantee unique IDs.

### Q3: How does the server handle CORS?
**Answer**: The Java HTTP server injects CORS headers (`Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`, `Access-Control-Allow-Headers: Content-Type`) into every response and immediately replies with `204 No Content` for preflight `OPTIONS` requests.
