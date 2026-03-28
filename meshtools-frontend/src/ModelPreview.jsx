import React, { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Stage, PresentationControls, PerspectiveCamera } from "@react-three/drei";
import { Maximize2, Box } from "lucide-react";

function Model({ url, wireframe }) {
  const { scene } = useGLTF(url);
  
  // This logic traverses the 3D model and turns wireframe on/off for every part
  scene.traverse((obj) => {
    if (obj.isMesh) {
      obj.material.wireframe = wireframe;
    }
  });

  return <primitive object={scene} />;
}

export default function ModelPreview({ url }) {
  const [wireframe, setWireframe] = useState(false);

  return (
    <div className="group relative w-full h-[400px] bg-black/40 rounded-2xl overflow-hidden border border-white/5">
      {/* --- WIREFRAME TOGGLE BUTTON --- */}
      <button 
        onClick={() => setWireframe(!wireframe)}
        className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all shadow-xl"
      >
        {wireframe ? <Box size={14} /> : <Maximize2 size={14} />}
        {wireframe ? "Solid Mode" : "View Wireframe"}
      </button>

      <Suspense fallback={
        <div className="flex items-center justify-center h-full text-gray-600 font-mono text-xs uppercase tracking-widest animate-pulse">
          Initializing Viewport...
        </div>
      }>
        <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
          <color attach="background" args={["#0d0d0d"]} />
          <PresentationControls 
            speed={1.5} 
            global 
            zoom={0.8} 
            polar={[-0.1, Math.PI / 4]}
          >
            <Stage environment="city" intensity={0.5} contactShadow={true}>
              <Model url={url} wireframe={wireframe} />
            </Stage>
          </PresentationControls>
        </Canvas>
      </Suspense>

      {/* Control Hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          Drag to Rotate • Scroll to Zoom
        </p>
      </div>
    </div>
  );
}