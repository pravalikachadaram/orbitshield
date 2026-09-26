import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Activity,
  Radio,
  Crosshair,
  Globe2,
  Bell,
  Clock,
  Cpu,
  LogOut,
  Menu,
  X,
  Shield,
  Layers,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';
import { Starfield } from '../components/Starfield';

export const MainLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [systemStatus, setSystemStatus] = useState<'Operational' | 'Degraded' | 'Unavailable'>('Operational');
  const [dataMode, setDataMode] = useState<'live' | 'demo'>('demo');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api.getSystemStatus()
      .then((res) => {
        setSystemStatus(res.status);
        setDataMode(res.data_mode);
      })
      .catch(() => setSystemStatus('Degraded'));

    api.getAlerts('ACTIVE')
      .then((res) => setAlertCount(res.length))
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('orbitshield_token');
    localStorage.removeItem('orbitshield_user');
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Activity },
    { name: 'Tracking & Orbits', path: '/map', icon: Globe2 },
    { name: 'Satellite Monitor', path: '/monitor', icon: Radio },
    { name: 'Collision Engine', path: '/analysis', icon: Crosshair },
    { name: 'Active Alerts', path: '/alerts', icon: Bell, badge: alertCount > 0 ? alertCount : undefined },
    { name: 'History Archive', path: '/history', icon: Clock },
    { name: 'System Status', path: '/system', icon: Cpu },
  ];

  return (
    <div className="min-h-screen bg-[#02040a] text-[#e6f1ff] font-sans relative selection:bg-cyan-500/30 selection:text-white">
      {/* 3D Canvas Starfield background */}
      <Starfield />

      {/* TOP GLOWING MISSION CONTROL BAR */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3.5 flex-wrap gap-4 bg-gradient-to-b from-[#02050e]/95 via-[#02050e]/80 to-transparent backdrop-blur-xl border-b border-[rgba(0,229,255,0.18)] shadow-[0_4px_30px_rgba(0,229,255,0.05)]">
        {/* Brand with orbiting glow */}
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-full bg-radial from-[#00e5ff] via-[#004b7a] to-[#001b30] shadow-[0_0_20px_rgba(0,229,255,0.6)] flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
            <div className="absolute -inset-1 border border-cyan-400/40 rounded-full rotate-45 border-r-transparent border-l-transparent group-hover:rotate-180 transition-transform duration-700" />
          </div>
          <div className="font-orbitron font-extrabold text-base tracking-widest text-white">
            ORBIT<span className="text-[#00e5ff] drop-shadow-[0_0_12px_rgba(0,229,255,0.8)]">SHIELD</span>
          </div>
        </div>

        {/* TOP TABS NAVIGATION */}
        <div className="hidden lg:flex items-center gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg font-orbitron text-xs tracking-wider uppercase font-semibold transition-all duration-300 flex items-center gap-2 ${
                  isActive
                    ? 'text-[#00e5ff] bg-[rgba(0,229,255,0.08)] border border-[rgba(0,229,255,0.35)] shadow-[0_0_24px_rgba(0,229,255,0.25)]'
                    : 'text-[#8ba0c7] hover:text-[#00e5ff] hover:bg-[rgba(0,229,255,0.05)]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#00e5ff]' : 'text-slate-400'}`} />
                <span>{item.name}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* RIGHT STATUS PILL & QUICK ACTIONS */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-[rgba(34,255,183,0.35)] bg-[rgba(34,255,183,0.08)] text-[11px] font-orbitron font-semibold text-[#22ffb7] tracking-wider uppercase shadow-[0_0_15px_rgba(34,255,183,0.2)]">
            <span className="w-2 h-2 rounded-full bg-[#22ffb7] shadow-[0_0_10px_#22ffb7] animate-ping" />
            <span>SYSTEM ONLINE</span>
          </div>

          <button
            onClick={() => navigate('/analysis')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-[#00e5ff] to-[#22ffb7] hover:from-[#4dd0ff] hover:to-[#22ffb7] text-slate-950 font-orbitron text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 shadow-[0_0_20px_rgba(0,229,255,0.4)] transition-all hover:-translate-y-0.5"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LAUNCH ANALYSIS</span>
          </button>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-lg border border-transparent hover:border-rose-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0a1226]/95 border-b border-[rgba(0,229,255,0.2)] p-4 space-y-1 backdrop-blur-2xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-2.5 rounded-md font-orbitron text-xs text-slate-200 hover:bg-cyan-950/40"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] bg-rose-500/20 text-rose-300 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>
      )}

      {/* MAIN VIEWPORT */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-8 py-8">
        <Outlet />
      </main>

      {/* FOOTER */}
      <footer className="mt-16 py-8 border-t border-[rgba(0,229,255,0.15)] text-center text-xs font-orbitron tracking-widest text-[#8ba0c7] uppercase">
        ORBITSHIELD · Space Situational Awareness & Avoidance System · © 2026 Deep Space Operations
      </footer>
    </div>
  );
};
