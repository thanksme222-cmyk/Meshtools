const { Worker } = require("bullmq");
const fs = require("fs-extra"); // Improved filesystem handling
const path = require("path");
const gltfPipeline = require("gltf-pipeline");

// The heavy lifting logic for GLB optimization
async function processFile(jobData) {
    const { filePath, fileName, dracoEnabled } = jobData;
    const outputFileName = `optimized-${Date.now()}-${fileName}`;
    const outputPath = path.join("uploads", outputFileName);

    // 1. Read the uploaded file buffer
    const inputBuffer = await fs.readFile(filePath);
    const originalSize = (await fs.stat(filePath)).size;

    console.log(`✨ Optimizing: ${fileName} (Draco: ${dracoEnabled})`);

    // 2. Optimization Logic - Matches Phase 1 & 2 Roadmap
    let processedBuffer = inputBuffer;
    
    // Only apply Draco if the user toggled it in the UI [cite: 1, 37]
    if (dracoEnabled) {
        const options = { 
            dracoOptions: { compressionLevel: 7 } 
        };
        const results = await gltfPipeline.processGlb(inputBuffer, options);
        processedBuffer = results.glb;
    }

    // 3. Write the optimized file to the uploads folder
    await fs.writeFile(outputPath, processedBuffer);
    const optimizedSize = processedBuffer.length;

    // 4. Cleanup: Remove the original raw upload to save disk space
    await fs.remove(filePath);

    // 5. Return Stats for the "Glowing Results Card" [cite: 1, 40, 114]
    const reductionPercent = (((originalSize - optimizedSize) / originalSize) * 100).toFixed(2);
    
    return {
        name: fileName,
        reduction: `${reductionPercent}%`,
        // Update this URL to your live domain in the Render Dashboard
        download: `${process.env.BACKEND_URL || 'http://localhost:5000'}/files/${outputFileName}`,
        stats: {
            oldSize: (originalSize / 1024).toFixed(2) + " KB",
            newSize: (optimizedSize / 1024).toFixed(2) + " KB"
        }
    };
}

// Connect to the same Redis queue as server.js [cite: 1, 17, 134]
const connection = process.env.REDIS_URL 
    ? { url: process.env.REDIS_URL } 
    : { host: "127.0.0.1", port: 6379 };

const worker = new Worker("optimization-queue", async (job) => {
    try {
        // processFile now receives the full job data object
        const result = await processFile(job.data);
        console.log(`✅ Job ${job.id} complete: ${result.reduction} reduction.`);
        return result; 
    } catch (err) {
        console.error(`❌ Job ${job.id} failed:`, err);
        throw err;
    }
}, { connection });

console.log("👷 Worker is online and watching the queue...");