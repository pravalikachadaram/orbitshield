import React, { useEffect, useRef } from 'react';

export const TrajectoryForecastChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.clientWidth * (window.devicePixelRatio || 1);
      canvas.height = canvas.clientHeight * (window.devicePixelRatio || 1);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resize();

    const lines = [
      { color: '#00e5ff', data: Array.from({ length: 40 }, () => Math.random()) },
      { color: '#7c4dff', data: Array.from({ length: 40 }, () => Math.random()) },
      { color: '#ff3d81', data: Array.from({ length: 40 }, () => Math.random()) },
    ];

    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,229,255,.08)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 6; i++) {
        const y = (h / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      for (let i = 0; i < 10; i++) {
        const x = (w / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Plot curves
      lines.forEach((l) => {
        ctx.beginPath();
        l.data.forEach((v, i) => {
          const x = (i / (l.data.length - 1)) * w;
          const y = h - v * h * 0.8 - h * 0.1;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = l.color;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
    };

    const step = () => {
      lines.forEach((l) => {
        l.data.shift();
        const last = l.data[l.data.length - 1];
        l.data.push(Math.max(0.05, Math.min(0.95, last + (Math.random() - 0.5) * 0.25)));
      });
      draw();
    };

    draw();
    const interval = setInterval(step, 600);
    window.addEventListener('resize', resize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[260px] block rounded-xl border border-cyan-500/20 bg-radial from-[#04122a] to-[#01050f]"
    />
  );
};
