const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

async function optimizeFile(inputPath, outputDir) {
  const fileName = path.basename(inputPath, ".glb");
  const outputPath = path.join(outputDir, `${fileName}-optimized.glb`);

  // Ensure gltf-pipeline CLI is installed globally
  // npm install -g gltf-pipeline
  try {
    execSync(`gltf-pipeline -i "${inputPath}" -o "${outputPath}" -d`, { stdio: "ignore" });
  } catch (err) {
    console.error("Error running gltf-pipeline:", err);
    throw new Error("GLB optimization failed");
  }

  const originalSize = fs.statSync(inputPath).size;
  const optimizedSize = fs.statSync(outputPath).size;
  const reduction = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1) + "%";

  return { outputPath, originalSize, optimizedSize, reduction };
}

module.exports = { optimizeFile };