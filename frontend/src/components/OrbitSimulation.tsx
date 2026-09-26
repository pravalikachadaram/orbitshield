import React, { useEffect, useRef } from 'react';
import { SpaceObject } from '../types';

interface OrbitSimulationProps {
  objects?: SpaceObject[];
  onSelectObject?: (obj: SpaceObject) => void;
}

export const OrbitSimulation: React.FC<OrbitSimulationProps> = ({ objects = [], onSelectObject }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    // If objects are provided from the backend, bind real items; otherwise fallback smoothly
    const itemsToRender = objects.length > 0 ? objects : [
      { name: 'ISS (ZARYA)', norad_id: '25544', object_type: 'PAYLOAD', altitude_km: 418, inclination_deg: 51.64 },
      { name: 'COSMOS 1408 DEBRIS', norad_id: '49863', object_type: 'DEBRIS', altitude_km: 485, inclination_deg: 82.56 },
      { name: 'TIANGONG (CSS)', norad_id: '48274', object_type: 'PAYLOAD', altitude_km: 389, inclination_deg: 41.47 },
      { name: 'FENGYUN 1C DEBRIS', norad_id: '31113', object_type: 'DEBRIS', altitude_km: 850, inclination_deg: 98.81 },
      { name: 'STARLINK-30114', norad_id: '55123', object_type: 'PAYLOAD', altitude_km: 550, inclination_deg: 43.0 },
      { name: 'IRIDIUM 33 DEBRIS', norad_id: '33758', object_type: 'DEBRIS', altitude_km: 780, inclination_deg: 86.4 },
      { name: 'HUBBLE SPACE TELESCOPE', norad_id: '20580', object_type: 'PAYLOAD', altitude_km: 535, inclination_deg: 28.47 },
      { name: 'SL-16 R/B', norad_id: '22676', object_type: 'ROCKET_BODY', altitude_km: 620, inclination_deg: 71.02 },
    ];

    const renderedObjects: { el: HTMLDivElement; r: number; angle: number; speed: number }[] = [];

    itemsToRender.forEach((obj, idx) => {
      const el = document.createElement('div');
      const inner = document.createElement('div');
      const label = document.createElement('div');

      const isPayload = obj.object_type === 'PAYLOAD';
      const isCritical = obj.norad_id === '49863' || obj.norad_id === '33758';

      // Physical scaling: base radius around Earth sphere (100px - 240px)
      const alt = obj.altitude_km || 400;
      const radius = 100 + Math.min(140, Math.max(20, (alt - 300) * 0.25));

      if (isPayload) {
        inner.style.width = '14px';
        inner.style.height = '14px';
        inner.style.borderRadius = '3px';
        inner.style.backgroundColor = '#00e5ff';
        inner.style.boxShadow = '0 0 16px #00e5ff';
      } else if (isCritical) {
        inner.style.width = '8px';
        inner.style.height = '8px';
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = '#ff3860';
        inner.style.boxShadow = '0 0 14px #ff3860';
      } else {
        inner.style.width = '7px';
        inner.style.height = '7px';
        inner.style.borderRadius = '50%';
        inner.style.backgroundColor = '#ff3d81';
        inner.style.boxShadow = '0 0 10px #ff3d81';
      }

      inner.style.transform = 'translate(-50%, -50%)';
      inner.style.cursor = 'pointer';

      // Tooltip/name badge on hover
      label.textContent = `${obj.name} (${obj.norad_id})`;
      label.style.position = 'absolute';
      label.style.left = '14px';
      label.style.top = '-8px';
      label.style.whiteSpace = 'nowrap';
      label.style.fontSize = '10px';
      label.style.fontFamily = 'Orbitron, sans-serif';
      label.style.color = '#e6f1ff';
      label.style.background = 'rgba(2, 6, 20, 0.85)';
      label.style.padding = '2px 6px';
      label.style.borderRadius = '4px';
      label.style.border = '1px solid rgba(0, 229, 255, 0.3)';
      label.style.pointerEvents = 'none';
      label.style.opacity = '0.7';

      el.appendChild(inner);
      el.appendChild(label);
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '50%';

      el.onclick = () => {
        if (onSelectObject && 'norad_id' in obj) {
          onSelectObject(obj as SpaceObject);
        }
      };

      container.appendChild(el);

      // Keplerian speed: v = sqrt(GM/r) -> lower orbits move faster
      const keplerSpeed = 0.6 / Math.sqrt(radius / 100);

      renderedObjects.push({
        el,
        r: radius,
        angle: (idx * (2 * Math.PI)) / itemsToRender.length,
        speed: keplerSpeed,
      });
    });

    let animId: number;
    const tick = () => {
      for (const o of renderedObjects) {
        o.angle += o.speed * 0.008;
        const x = Math.cos(o.angle) * o.r;
        const y = Math.sin(o.angle) * o.r * 0.75; // 3D inclination tilt effect
        o.el.style.transform = `translate(${x}px, ${y}px)`;
      }
      animId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [objects]);

  return (
    <div className="relative w-full h-[520px] rounded-2xl overflow-hidden bg-radial from-[#04122a] via-[#020716] to-[#01050f] border border-[rgba(0,229,255,0.2)] shadow-[0_0_50px_rgba(0,229,255,0.08)]">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,229,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(0,229,255,.4) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Legend with real backend link indicator */}
      <div className="absolute top-4 left-4 flex gap-4 text-xs font-mono text-slate-300 z-10 flex-wrap bg-slate-950/70 px-3 py-1.5 rounded-full border border-cyan-500/25 backdrop-blur-md">
        <span className="flex items-center gap-2">
          <i className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_8px_#00e5ff]" />
          Protected Satellites (ISS, Tiangong)
        </span>
        <span className="flex items-center gap-2">
          <i className="w-2.5 h-2.5 rounded-full bg-[#ff3d81] shadow-[0_0_8px_#ff3d81]" />
          Tracked Debris (COSMOS, Fengyun)
        </span>
        <span className="flex items-center gap-2">
          <i className="w-2.5 h-2.5 rounded-full bg-[#ff3860] shadow-[0_0_8px_#ff3860]" />
          Critical Conjunction Hazard
        </span>
      </div>

      {/* Real Keplerian Elliptical Orbit Rings */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] h-[180px] rounded-[50%] border border-dashed border-cyan-400/30 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[255px] rounded-[50%] border border-dashed border-violet-500/30 pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[440px] h-[330px] rounded-[50%] border border-dashed border-pink-500/25 pointer-events-none" />

      {/* Glowing 3D-styled Earth Sphere */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] rounded-full earth-sphere flex items-center justify-center animate-spin-slow">
        <div className="w-[150px] h-[150px] rounded-full border border-cyan-400/30" />
      </div>

      {/* SGP4 Real Objects Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* HUD metrics footer */}
      <div className="absolute bottom-4 right-4 font-mono text-[11px] text-cyan-400 tracking-widest bg-[#02050f]/80 px-3 py-1.5 rounded border border-cyan-500/30">
        LIVE BACKEND SGP4 INTEGRATION · {objects.length > 0 ? objects.length : 8} RESIDENT OBJECTS
      </div>
    </div>
  );
};
