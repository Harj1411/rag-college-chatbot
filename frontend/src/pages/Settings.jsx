import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { healthAPI } from '../services/api';
import {
  Settings as SettingsIcon,
  User,
  ShieldCheck,
  Activity,
  LogOut,
  Database,
  Key,
  Server,
  Sparkles
} from 'lucide-react';

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [isHealthLoading, setIsHealthLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await healthAPI.check();
        setHealth(res.data);
      } catch (err) {
        setHealth({ status: 'offline', error: err.message });
      } finally {
        setIsHealthLoading(false);
      }
    };
    checkHealth();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-8">
        <SettingsIcon className="w-6 h-6 text-brand-400" />
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Account & System Settings</h1>
          <p className="text-xs text-slate-400">Manage your profile and verify connected AI system status</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-brand-400" />
            User Profile
          </h2>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-sky-400 flex items-center justify-center text-white font-bold text-lg shadow-md">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base">{user?.name || 'User'}</h3>
                <p className="text-xs text-slate-400">{user?.email || 'user@campusmind.edu'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  user?.role === 'admin'
                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                    : 'bg-brand-500/10 text-brand-300 border border-brand-500/20'
                }`}
              >
                {user?.role === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
                {user?.role || 'student'}
              </span>
            </div>
          </div>
        </div>

        {/* System Health Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-400" />
              Connected RAG Engine Status
            </h2>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Backend
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Backend Service */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Server className="w-4 h-4 text-brand-400" />
                <span>FastAPI Service</span>
              </div>
              <p className="text-sm font-bold text-slate-200">
                {isHealthLoading ? 'Checking...' : health?.status === 'ok' ? 'Online (v1.0.0)' : 'Offline'}
              </p>
            </div>

            {/* ChromaDB Vectors */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Database className="w-4 h-4 text-sky-400" />
                <span>ChromaDB Vectors</span>
              </div>
              <p className="text-sm font-bold text-slate-200">
                {isHealthLoading ? 'Counting...' : `${health?.chroma_vectors_count || 0} Chunks Indexed`}
              </p>
            </div>

            {/* Gemini API Key */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <Key className="w-4 h-4 text-amber-400" />
                <span>Gemini API Key</span>
              </div>
              <p className="text-sm font-bold text-slate-200">
                {isHealthLoading ? 'Checking...' : health?.gemini_api_configured ? 'Active (Pro/Flash)' : 'Not Configured (Demo Mode)'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Section */}
        <div className="p-6 rounded-3xl bg-rose-950/10 border border-rose-500/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-200">Sign Out</h3>
            <p className="text-xs text-slate-400">Clear active JWT session on this device</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
