import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, CheckCircle, Download, Loader2, Zap, Box } from "lucide-react";
import ModelPreview from "./ModelPreview"; // Ensure this file exists in /src

export default function App() {
  const [file, setFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, processing, completed
  const [result, setResult] = useState(null);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      setStatus("processing");
      // 1. Send to Dispatcher
      const res = await axios.post("http://localhost:5000/api/optimize", formData);
      setJobId(res.data.jobId);
    } catch (err) {
      alert("Upload failed. Is the server running?");
      setStatus("idle");
    }
  };

  // 2. The "Polling" Logic: Checks if the Worker is done
  useEffect(() => {
    if (!jobId || status !== "processing") return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/status/${jobId}`);
        if (res.data.state === "completed") {
          setResult(res.data.result);
          setStatus("completed");
          clearInterval(interval);
        } else if (res.data.state === "failed") {
          alert("Optimization failed in the worker.");
          setStatus("idle");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 selection:bg-cyan-500/30">
      {/* Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="max-w-2xl w-full text-center relative z-10"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-xs font-bold mb-6 uppercase tracking-widest">
          <Zap size={14} /> 2026 Engine Online
        </div>
        
        <h1 className="text-6xl font-black mb-4 tracking-tighter uppercase italic">
          Mesh<span className="text-cyan-500">Tools</span>
        </h1>
        <p className="text-gray-400 mb-10 text-lg">Next-gen Draco compression for 3D assets.</p>

        <div className="bg-[#141414] border border-white/10 rounded-[32px] p-8 shadow-2xl shadow-black/50 overflow-hidden">
          <AnimatePresence mode="wait">
            {status === "idle" && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="group relative border-2 border-dashed border-white/10 rounded-2xl p-12 hover:border-cyan-500/50 transition-all cursor-pointer mb-6">
                  <Upload className="w-12 h-12 text-gray-600 mb-4 mx-auto group-hover:text-cyan-500 transition-colors" />
                  <input 
                    type="file" 
                    accept=".glb" 
                    onChange={(e) => setFile(e.target.files[0])} 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <p className="text-gray-300 font-medium">{file ? file.name : "Select or Drop GLB"}</p>
                  <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">Supports .glb only</p>
                </div>
                <button 
                  onClick={handleUpload}
                  disabled={!file}
                  className="w-full bg-white text-black py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-cyan-500 hover:text-white transition-all disabled:opacity-20"
                >
                  Optimize Mesh
                </button>
              </motion.div>
            )}

            {status === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-12">
                <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-6" />
                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Analyzing Geometry</h2>
                <p className="text-gray-500 text-sm">Processing through Redis Optimization Queue...</p>
              </motion.div>
            )}

            {status === "completed" && result && (
              <motion.div key="completed" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-left">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/20 rounded-lg text-green-500">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase italic tracking-tight">Optimization Success</h2>
                        <p className="text-xs text-gray-500">{result.name}</p>
                    </div>
                </div>

                {/* --- 3D PREVIEW BLOCK --- */}
                <div className="mb-6 rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                  <div className="p-3 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                        <Box size={12} /> 3D Viewport
                    </span>
                    <span className="text-[10px] font-bold text-cyan-500 uppercase italic">Interactive Preview</span>
                  </div>
                  <ModelPreview url={result.download} />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Compression</p>
                    <p className="text-2xl font-black text-cyan-400">{result.reduction}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Engine</p>
                    <p className="text-2xl font-black text-white">DRACO v7</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                    <a 
                      href={result.download} 
                      className="inline-flex items-center justify-center gap-3 w-full bg-cyan-600 py-4 rounded-xl font-black uppercase tracking-tighter hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-500/20"
                    >
                      <Download size={20} /> Download Asset
                    </a>
                    <button 
                      onClick={() => { setStatus("idle"); setFile(null); }}
                      className="text-gray-500 hover:text-white text-xs uppercase font-bold tracking-widest transition-colors py-2"
                    >
                      Optimize Another
                    </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}