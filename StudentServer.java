import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * ==============================================================================
 * Student Database Management System - Standalone Single-File Java Backend
 * File: StudentServer.java
 *
 * Requirements: JDK 11+ (Uses built-in com.sun.net.httpserver, ZERO external dependencies)
 * Run: java StudentServer.java
 * Port: http://localhost:8080
 * ==============================================================================
 */
public class StudentServer {

    private static final int PORT = 8080;
    private static final String DATA_FILE = "students_data.json";

    // In-memory data store with atomic ID counter
    private static final Map<Long, Student> studentMap = new ConcurrentHashMap<>();
    private static final AtomicLong idSequence = new AtomicLong(1);

    public static void main(String[] args) throws IOException {
        // 1. Load existing data or initialize with sample records
        loadDataFromFile();

        // 2. Start HTTP server on port 8080
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor()); // Virtual threads in Java 21+ or fixed pool

        // Register handlers
        server.createContext("/api/students", new StudentsHandler());
        server.createContext("/api/health", new HealthHandler());

        server.start();
        System.out.println("==========================================================");
        System.out.println("🚀 Student Database Java Backend Server running on port " + PORT);
        System.out.println("👉 API Base URL:  http://localhost:" + PORT + "/api/students");
        System.out.println("👉 Health Check:  http://localhost:" + PORT + "/api/health");
        System.out.println("👉 Data Storage:  " + new File(DATA_FILE).getAbsolutePath());
        System.out.println("==========================================================");
    }

    // ==============================================================================
    // Model: Student Entity
    // ==============================================================================
    public static class Student {
        public long id;
        public String registerNo;
        public String name;
        public String department;
        public int year;
        public String email;
        public String createdAt;

        public Student(long id, String registerNo, String name, String department, int year, String email, String createdAt) {
            this.id = id;
            this.registerNo = registerNo;
            this.name = name;
            this.department = department;
            this.year = year;
            this.email = email;
            this.createdAt = createdAt != null ? createdAt : Instant.now().toString();
        }

        public String toJson() {
            return "{"
                + "\"id\":" + id + ","
                + "\"register_no\":" + escapeJson(registerNo) + ","
                + "\"name\":" + escapeJson(name) + ","
                + "\"department\":" + escapeJson(department) + ","
                + "\"year\":" + year + ","
                + "\"email\":" + escapeJson(email) + ","
                + "\"created_at\":" + escapeJson(createdAt)
                + "}";
        }
    }

    // ==============================================================================
    // HTTP Handler: /api/students & /api/students/{id}
    // ==============================================================================
    static class StudentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            // Apply CORS headers to all responses
            setCorsHeaders(exchange);

            String method = exchange.getRequestMethod();

            // Handle Preflight OPTIONS
            if ("OPTIONS".equalsIgnoreCase(method)) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String path = exchange.getRequestURI().getPath();
            // Path can be /api/students or /api/students/{id}
            String[] segments = path.split("/");

            try {
                if (segments.length == 3 && "students".equals(segments[2])) {
                    // /api/students
                    if ("GET".equalsIgnoreCase(method)) {
                        handleGetStudents(exchange);
                    } else if ("POST".equalsIgnoreCase(method)) {
                        handleCreateStudent(exchange);
                    } else {
                        sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                    }
                } else if (segments.length == 4 && "students".equals(segments[2])) {
                    // /api/students/{id}
                    long id = Long.parseLong(segments[3]);
                    if ("GET".equalsIgnoreCase(method)) {
                        handleGetStudentById(exchange, id);
                    } else if ("PUT".equalsIgnoreCase(method)) {
                        handleUpdateStudent(exchange, id);
                    } else if ("DELETE".equalsIgnoreCase(method)) {
                        handleDeleteStudent(exchange, id);
                    } else {
                        sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                    }
                } else {
                    sendResponse(exchange, 404, "{\"error\":\"Endpoint not found\"}");
                }
            } catch (NumberFormatException e) {
                sendResponse(exchange, 400, "{\"error\":\"Invalid ID format\"}");
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"Internal server error: " + escapeJsonString(e.getMessage()) + "\"}");
            }
        }

        // GET /api/students (optional ?search=...)
        private void handleGetStudents(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String searchTerm = "";
            if (query != null && query.contains("search=")) {
                String[] params = query.split("&");
                for (String param : params) {
                    if (param.startsWith("search=")) {
                        searchTerm = URLDecoder.decode(param.substring(7), StandardCharsets.UTF_8).trim().toLowerCase();
                        break;
                    }
                }
            }

            List<Student> list = new ArrayList<>(studentMap.values());
            // Sort by id descending (most recently created first)
            list.sort((a, b) -> Long.compare(b.id, a.id));

            List<String> jsonItems = new ArrayList<>();
            for (Student s : list) {
                if (searchTerm.isEmpty() ||
                    s.registerNo.toLowerCase().contains(searchTerm) ||
                    s.name.toLowerCase().contains(searchTerm) ||
                    s.department.toLowerCase().contains(searchTerm)) {
                    jsonItems.add(s.toJson());
                }
            }

            String response = "[" + String.join(",", jsonItems) + "]";
            sendResponse(exchange, 200, response);
        }

        // GET /api/students/{id}
        private void handleGetStudentById(HttpExchange exchange, long id) throws IOException {
            Student s = studentMap.get(id);
            if (s == null) {
                sendResponse(exchange, 404, "{\"error\":\"Student not found\"}");
                return;
            }
            sendResponse(exchange, 200, s.toJson());
        }

        // POST /api/students
        private void handleCreateStudent(HttpExchange exchange) throws IOException {
            String body = readRequestBody(exchange);
            Map<String, String> data = parseJson(body);

            String regNo = data.getOrDefault("register_no", "").trim().toUpperCase();
            String name = data.getOrDefault("name", "").trim();
            String department = data.getOrDefault("department", "").trim();
            String email = data.getOrDefault("email", "").trim().toLowerCase();
            String yearStr = data.getOrDefault("year", "1").trim();

            int year = 1;
            try {
                year = Integer.parseInt(yearStr);
            } catch (NumberFormatException ignored) {}

            // Validation
            if (regNo.isEmpty() || name.isEmpty() || department.isEmpty() || email.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"All fields (register_no, name, department, year, email) are required.\"}");
                return;
            }

            if (year < 1 || year > 4) {
                sendResponse(exchange, 400, "{\"error\":\"Year must be between 1 and 4.\"}");
                return;
            }

            // Check unique register number
            for (Student existing : studentMap.values()) {
                if (existing.registerNo.equalsIgnoreCase(regNo)) {
                    sendResponse(exchange, 409, "{\"error\":\"A student with Register No '" + regNo + "' already exists in database.\"}");
                    return;
                }
            }

            long newId = idSequence.getAndIncrement();
            Student newStudent = new Student(newId, regNo, name, department, year, email, Instant.now().toString());
            studentMap.put(newId, newStudent);
            saveDataToFile();

            sendResponse(exchange, 201, newStudent.toJson());
        }

        // PUT /api/students/{id}
        private void handleUpdateStudent(HttpExchange exchange, long id) throws IOException {
            Student existing = studentMap.get(id);
            if (existing == null) {
                sendResponse(exchange, 404, "{\"error\":\"Student with ID " + id + " not found.\"}");
                return;
            }

            String body = readRequestBody(exchange);
            Map<String, String> data = parseJson(body);

            String regNo = data.getOrDefault("register_no", existing.registerNo).trim().toUpperCase();
            String name = data.getOrDefault("name", existing.name).trim();
            String department = data.getOrDefault("department", existing.department).trim();
            String email = data.getOrDefault("email", existing.email).trim().toLowerCase();
            String yearStr = data.getOrDefault("year", String.valueOf(existing.year)).trim();

            int year = existing.year;
            try {
                year = Integer.parseInt(yearStr);
            } catch (NumberFormatException ignored) {}

            if (regNo.isEmpty() || name.isEmpty() || department.isEmpty() || email.isEmpty()) {
                sendResponse(exchange, 400, "{\"error\":\"All fields are required.\"}");
                return;
            }

            if (year < 1 || year > 4) {
                sendResponse(exchange, 400, "{\"error\":\"Year must be between 1 and 4.\"}");
                return;
            }

            // Check unique register number conflict with other students
            for (Student s : studentMap.values()) {
                if (s.id != id && s.registerNo.equalsIgnoreCase(regNo)) {
                    sendResponse(exchange, 409, "{\"error\":\"A student with Register No '" + regNo + "' already exists.\"}");
                    return;
                }
            }

            existing.registerNo = regNo;
            existing.name = name;
            existing.department = department;
            existing.year = year;
            existing.email = email;

            saveDataToFile();
            sendResponse(exchange, 200, existing.toJson());
        }

        // DELETE /api/students/{id}
        private void handleDeleteStudent(HttpExchange exchange, long id) throws IOException {
            Student removed = studentMap.remove(id);
            if (removed == null) {
                sendResponse(exchange, 404, "{\"error\":\"Student not found.\"}");
                return;
            }
            saveDataToFile();
            sendResponse(exchange, 200, "{\"message\":\"Student deleted successfully\",\"id\":" + id + "}");
        }
    }

    // ==============================================================================
    // HTTP Handler: /api/health
    // ==============================================================================
    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            setCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            String json = "{\"status\":\"UP\",\"records\":" + studentMap.size() + ",\"port\":" + PORT + "}";
            sendResponse(exchange, 200, json);
        }
    }

    // ==============================================================================
    // Persistence & Utilities
    // ==============================================================================
    private static synchronized void loadDataFromFile() {
        File file = new File(DATA_FILE);
        if (!file.exists()) {
            // Seed initial records if file does not exist
            seedInitialData();
            saveDataToFile();
            return;
        }

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(new FileInputStream(file), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String content = sb.toString().trim();
            if (content.startsWith("[") && content.endsWith("]")) {
                content = content.substring(1, content.length() - 1).trim();
                if (!content.isEmpty()) {
                    List<String> items = splitJsonObjects(content);
                    long maxId = 0;
                    for (String item : items) {
                        Map<String, String> map = parseJson(item);
                        long id = Long.parseLong(map.getOrDefault("id", "0"));
                        String regNo = map.getOrDefault("register_no", "");
                        String name = map.getOrDefault("name", "");
                        String dept = map.getOrDefault("department", "");
                        int year = Integer.parseInt(map.getOrDefault("year", "1"));
                        String email = map.getOrDefault("email", "");
                        String createdAt = map.getOrDefault("created_at", Instant.now().toString());

                        if (id > 0 && !regNo.isEmpty()) {
                            studentMap.put(id, new Student(id, regNo, name, dept, year, email, createdAt));
                            if (id > maxId) maxId = id;
                        }
                    }
                    idSequence.set(maxId + 1);
                    System.out.println("Loaded " + studentMap.size() + " records from " + DATA_FILE);
                    return;
                }
            }
            seedInitialData();
            saveDataToFile();
        } catch (Exception e) {
            System.err.println("Could not read " + DATA_FILE + ", initializing sample records: " + e.getMessage());
            seedInitialData();
            saveDataToFile();
        }
    }

    private static synchronized void saveDataToFile() {
        try (BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(new FileOutputStream(DATA_FILE), StandardCharsets.UTF_8))) {
            List<String> items = new ArrayList<>();
            for (Student s : studentMap.values()) {
                items.add(s.toJson());
            }
            writer.write("[\n  " + String.join(",\n  ", items) + "\n]");
        } catch (IOException e) {
            System.err.println("Failed to save data: " + e.getMessage());
        }
    }

    private static void seedInitialData() {
        studentMap.clear();
        studentMap.put(1L, new Student(1L, "21CS101", "Alice Johnson", "Computer Science & Engineering", 3, "alice.j@school.edu", "2026-09-01T09:00:00Z"));
        studentMap.put(2L, new Student(2L, "22IT104", "Bob Smith", "Information Technology", 2, "bob.smith@school.edu", "2026-09-02T10:30:00Z"));
        studentMap.put(3L, new Student(3L, "20EC205", "Clara Oswald", "Electronics & Communication Engineering", 4, "clara.o@school.edu", "2026-09-03T11:15:00Z"));
        idSequence.set(4);
    }

    private static void setCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseText) throws IOException {
        byte[] bytes = responseText.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(statusCode, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8))) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            return sb.toString();
        }
    }

    // Lightweight regex-based JSON parser for standard flat JSON objects
    public static Map<String, String> parseJson(String json) {
        Map<String, String> map = new HashMap<>();
        if (json == null || json.trim().isEmpty()) return map;

        Pattern pattern = Pattern.compile("\"([^\"]+)\"\\s*:\\s*(?:\"((?:\\\\\"|[^\"])*)\"|([0-9]+|true|false|null))");
        Matcher matcher = pattern.matcher(json);
        while (matcher.find()) {
            String key = matcher.group(1);
            String strVal = matcher.group(2);
            String rawVal = matcher.group(3);

            if (strVal != null) {
                map.put(key, unescapeJson(strVal));
            } else if (rawVal != null) {
                map.put(key, rawVal);
            }
        }
        return map;
    }

    private static List<String> splitJsonObjects(String content) {
        List<String> list = new ArrayList<>();
        int braceCount = 0;
        int startIndex = -1;
        boolean inQuote = false;

        for (int i = 0; i < content.length(); i++) {
            char c = content.charAt(i);
            if (c == '\"' && (i == 0 || content.charAt(i - 1) != '\\')) {
                inQuote = !inQuote;
            } else if (!inQuote) {
                if (c == '{') {
                    if (braceCount == 0) startIndex = i;
                    braceCount++;
                } else if (c == '}') {
                    braceCount--;
                    if (braceCount == 0 && startIndex != -1) {
                        list.add(content.substring(startIndex, i + 1));
                        startIndex = -1;
                    }
                }
            }
        }
        return list;
    }

    public static String escapeJson(String s) {
        if (s == null) return "null";
        return "\"" + escapeJsonString(s) + "\"";
    }

    private static String escapeJsonString(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static String unescapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\\"", "\"")
                .replace("\\\\", "\\")
                .replace("\\n", "\n")
                .replace("\\r", "\r")
                .replace("\\t", "\t");
    }
}
