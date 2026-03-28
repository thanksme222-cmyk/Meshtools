const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { Queue } = require("bullmq");

const app = express();

// 1. Standard CORS for API routes
app.use(cors());

// 2. UPDATED: Static Files with Headers for 3D Previews
// This allows the 3D engine in the frontend to "fetch" the model files
app.use("/files", express.static("uploads", {
    setHeaders: (res) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
}));

if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

// 3. Initialize the Queue (Connects to Redis)
const optimizationQueue = new Queue("optimization-queue", {
    connection: { host: "127.0.0.1", port: 6379 }
});

const upload = multer({ dest: "uploads/" });

// --- ROUTES ---

// Sanity Check
app.get("/api/test", (req, res) => {
    res.json({ status: "Dispatcher is online and CORS-ready! 🚀" });
});

// Single Optimization (Adds to Queue)
app.post("/api/optimize", upload.single("file"), async (req, res) => {
    console.log("Adding to queue:", req.file?.originalname);
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const job = await optimizationQueue.add("optimize-job", { 
            file: req.file 
        });

        res.json({ jobId: job.id, status: "queued" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to queue job" });
    }
});

// Batch Optimization (Adds multiple to Queue)
app.post("/api/optimize-batch", upload.array("files"), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: "No files uploaded" });

        const jobs = await Promise.all(req.files.map(file => 
            optimizationQueue.add("optimize-job", { file })
        ));

        res.json({ 
            message: "Batch queued 🚀", 
            jobIds: jobs.map(j => j.id) 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to queue batch" });
    }
});

// Status Route
app.get("/api/status/:id", async (req, res) => {
    const job = await optimizationQueue.getJob(req.params.id);
    
    if (!job) return res.status(404).json({ error: "Job not found" });

    const state = await job.getState(); 
    const result = job.returnvalue; 

    res.json({ id: job.id, state, result });
});

app.listen(5000, () => console.log("✅ Dispatcher running on http://localhost:5000"));