// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import Student from "./models/Student.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Connect to MongoDB Atlas
const mongoUri = process.env.MONGO_URI;
if (!mongoUri) {
  console.error("MONGO_URI not set in .env");
  process.exit(1);
}

mongoose.connect(mongoUri, {
  // options are automatically set by modern mongoose versions; add any if needed
})
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Simple health route
app.get("/api/health", (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Register student
app.post("/api/students", async (req, res) => {
  try {
    const { name, email, password, course } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }

    // Check duplicate email
    const existing = await Student.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);

    const student = new Student({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      course: course ? course.trim() : undefined
    });

    await student.save();

    // Return success (don't return password)
    res.status(201).json({
      message: "Student registered",
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        course: student.course,
        createdAt: student.createdAt
      }
    });
  } catch (err) {
    console.error("Error in POST /api/students:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Fallback to index.html for client-side routes (if any)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
