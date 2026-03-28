const { Worker } = require("bullmq");
const fs = require("fs");
const path = require("path");
const gltfPipeline = require("gltf-pipeline");

// The heavy lifting logic
async function processFile(file) {
    const inputPath = file.path;
    const outputPath = path.join("uploads", `optimized-${file.filename}.glb`);
    const inputBuffer = fs.readFileSync(inputPath);

    console.log(`✨ Optimizing: ${file.originalname}`);

    const results = await gltfPipeline.processGlb(inputBuffer, {
        dracoOptions: { compressionLevel: 7 }
    });

    fs.writeFileSync(outputPath, results.glb);

    const originalSize = fs.statSync(inputPath).size;
    const optimizedSize = fs.statSync(outputPath).size;

    return {
        name: file.originalname,
        reduction: (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2) + "%",
        download: `http://localhost:5000/files/${path.basename(outputPath)}`
    };
}

// Connect to the same Redis queue as server.js
const worker = new Worker("optimization-queue", async (job) => {
    try {
        const result = await processFile(job.data.file);
        return result; // This value goes to job.returnvalue for the Dispatcher to see
    } catch (err) {
        console.error(`❌ Job ${job.id} failed:`, err);
        throw err;
    }
}, {
    connection: { host: "127.0.0.1", port: 6379 }
});

console.log("👷 Worker is online and watching the queue...");