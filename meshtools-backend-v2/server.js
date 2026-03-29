const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs-extra"); // Use fs-extra for safer directory handling
const path = require("path");
const { Queue } = require("bullmq");

const app = express();

// 1. Dynamic CORS: Protects your $6,000/mo revenue projection [cite: 149]
// Locally, it allows everything; in Production, it locks to your domain.
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:3000"; 
app.use(cors({
    origin: allowedOrigin,
    credentials: true
}));

app.use(express.json());

// 2. Static File Serving for 3D Previews [cite: 52]
app.use("/files", express.static("uploads", {
    setHeaders: (res) => {
        res.set("Access-Control-Allow-Origin", allowedOrigin);
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
}));

// Ensure upload directory exists safely
const uploadDir = path.join(__currentDir, "uploads");
fs.ensureDirSync(uploadDir);

// 3. Robust Queue Connection [cite: 17, 134]
// This will NOT break your local setup if Redis isn't running; it will just log an error.
const connection = process.env.REDIS_URL 
    ? { url: process.env.REDIS_URL } 
    : { host: "127.0.0.1", port: 6379 };

const optimizationQueue = new Queue("optimization-queue", { connection });

optimizationQueue.on('error', (err) => console.error("Redis Connection Error: Check if Redis is running locally."));

const upload = multer({ dest: "uploads/" });

// --- ROUTES ---

// Single Optimization [cite: 11]
app.post("/api/optimize", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        // Captures the Draco toggle from your Phase 2 UI [cite: 37]
        const dracoEnabled = req.body.draco === 'true';

        const job = await optimizationQueue.add("optimize-job", { 
            filePath: req.file.path,
            fileName: req.file.originalname,
            dracoEnabled: dracoEnabled 
        });

        res.json({ jobId: job.id, status: "queued" });
    } catch (err) {
        res.status(500).json({ error: "Queueing failed. Is Redis running?" });
    }
});

// Status Route for the "Glowing Results Card" [cite: 40, 114]
app.get("/api/status/:id", async (req, res) => {
    try {
        const job = await optimizationQueue.getJob(req.params.id);
        if (!job) return res.status(404).json({ error: "Job not found" });

        const state = await job.getState(); 
        const result = job.returnvalue; 

        res.json({ id: job.id, state, result });
    } catch (err) {
        res.status(500).json({ error: "Could not fetch job status" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 MeshTools Dispatcher online on port ${PORT}`));