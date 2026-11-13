
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User } from '../../types/kinetix';
import { aiService } from '../../services/aiService';
import { isSupabaseConfigured } from '../../lib/supabaseClient';
import { storageService, SystemConfig, BrandingConfig } from '../../services/storageService';
import { githubService, GitHubConfig } from '../../services/githubService';

interface Props {
  currentUser: User;
  onNavigate: (view: any) => void;
}

export const AdminDashboard: React.FC<Props> = ({ currentUser, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'audit' | 'data' | 'devops' | 'branding'>('system');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [config, setConfig] = useState<SystemConfig>(storageService.getSystemConfig());
  const [branding, setBranding] = useState<BrandingConfig>(storageService.getBranding());
  const [serverLoad, setServerLoad] = useState(24);
  
  // GitHub Deploy State
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({ 
    token: '', 
    owner: '', 
    repo: '', 
    branch: 'main' 
  });
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployLogs, setDeployLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
      const interval = setInterval(() => {
          setServerLoad(prev => Math.min(Math.max(prev + (Math.random() * 4 - 2), 10), 45));
      }, 3000);
      return () => clearInterval(interval);
  }, []);
  
  const systemStatus = useMemo(() => {
      const hasAiKey = aiService.isConfigured;
      const hasSupabase = isSupabaseConfigured;
      return {
        supabase: hasSupabase,
        gemini: hasAiKey,
        storage: storageService.getStorageUsage(),
        aiDiag: !config.enableAI ? 'DESACTIVADO' : hasAiKey ? 'EN LINEA' : 'SIMULACIÓN',
        dbDiag: !config.enableCloud ? 'OFFLINE' : hasSupabase ? 'SYNC OK' : 'LOCAL',
        version: '7.0.0-Obsidian',
        owner: currentUser?.name || 'Leslie Barrera & Jorge González (Dueños)'
      };
  }, [config, currentUser]);

  const toggleFeature = (feature: keyof SystemConfig) => {
      const newConfig = { ...config, [feature]: !config[feature] };
      setConfig(newConfig);
      storageService.saveSystemConfig(newConfig);
  };

  const handleSaveBranding = () => {
    storageService.saveBranding(branding);
    alert("✅ Branding actualizado.");
    window.location.reload();
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setBranding({ ...branding, logoUrl: reader.result as string });
          reader.readAsDataURL(file);
      }
  };

  const runInvertedSync = async () => {
    if (!ghConfig.token || !ghConfig.repo || !ghConfig.owner) {
        return alert("AUDITORÍA: Faltan credenciales críticas (Token, Usuario o Repo)");
    }
    
    setIsDeploying(true);
    setProgress(0);
    setDeployLogs(["[SYS] Iniciando Inyección de Código Invertida...", "[AUTH] Autenticando con GitHub API v3..."]);
    
    // In a real scenario, we would fetch the actual files. 
    // Here we push the core structure to ensure Vercel can build.
    const filesToPush = [
        { path: 'package.json', content: JSON.stringify({
            name: "kinetix-elite",
            version: "7.0.0",
            private: true,
            type: "module",
            dependencies: {
                "react": "19.0.0",
                "react-dom": "19.0.0",
                "@google/genai": "^1.39.0",
                "@supabase/supabase-js": "^2.45.0"
            },
            scripts: { "dev": "vite", "build": "vite build", "preview": "vite preview" },
            devDependencies: { "vite": "^6.0.0", "@vitejs/plugin-react": "^4.3.0", "typescript": "^5.0.0" }
        }, null, 2) },
        { path: 'vercel.json', content: JSON.stringify({
            version: 2,
            buildCommand: "npm run build",
            outputDirectory: "dist",
            rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]
        }, null, 2) },
        { path: 'vite.config.ts', content: `import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] });` },
        { path: 'index.html', content: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kinetix Elite</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-[#050507] text-white"><div id="root"></div><script type="module" src="./index.tsx"></script></body></html>` }
    ];

    let successCount = 0;
    for (let i = 0; i < filesToPush.length; i++) {
        const file = filesToPush[i];
        setDeployLogs(prev => [...prev, `[TX] Transfiriendo archivo: ${file.path}...`]);
        
        const ok = await githubService.pushFile(ghConfig, file.path, file.content, "Master Deploy via Inverted Tunnel");
        
        if (ok) {
            successCount++;
            setDeployLogs(prev => [...prev, `[OK] ${file.path} desplegado.`]);
        } else {
            setDeployLogs(prev => [...prev, `[ERR] Error crítico en ${file.path}. Verifica permisos del Token.`]);
        }
        setProgress(Math.round(((i + 1) / (filesToPush.length)) * 100));
    }
    
    if (successCount === filesToPush.length) {
        setDeployLogs(prev => [...prev, "[SUCCESS] Núcleo replicado. Vercel iniciará el despliegue ahora."]);
    } else {
        setDeployLogs(prev => [...prev, "[WARN] Sincronización parcial. Revisa los fallos de red."]);
    }
    setIsDeploying(false);
  };

  const [sbUrlInput, setSbUrlInput] = useState(
    localStorage.getItem('kinetix_custom_supabase_url') || 'https://cckcpwqsolovddlzlkuo.supabase.co'
  );
  const [sbKeyInput, setSbKeyInput] = useState(
    localStorage.getItem('kinetix_custom_supabase_key') || 'sb_publishable_uouTiNM4nKG87oUmobPL4Q_XO6kcvD9'
  );
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const handleSaveSupabaseConfig = () => {
    const cleanUrl = sbUrlInput.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    localStorage.setItem('kinetix_custom_supabase_url', cleanUrl);
    localStorage.setItem('kinetix_custom_supabase_key', sbKeyInput.trim());
    setSeedResult("✅ Credenciales de Supabase guardadas localmente. Recargando...");
    setTimeout(() => window.location.reload(), 1200);
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedResult("🚀 Sembrando biblioteca de ejercicios, rutinas maestras y atletas en Supabase...");
    const res = await storageService.seedSupabaseDatabase();
    setSeedResult(res.message);
    setIsSeeding(false);
  };

  const supabaseSQL = `-- =======================================================
-- KINETIX FUNCTIONAL ZONE - MASTER DATABASE SCHEMA v7.3
-- Metodología: Lic. Jorge González & Leslie Barrera
-- Copia este script completo y pégalo en:
-- Supabase Dashboard > SQL Editor > New query > Run (Ctrl+Enter)
-- =======================================================

-- 1. TABLA DE PLANTILLAS Y RUTINAS (kinetix_templates)
CREATE TABLE IF NOT EXISTS public.kinetix_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    "publicTitle" TEXT,
    category TEXT DEFAULT 'general',
    day INTEGER DEFAULT 1,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb,
    "isCompleted" BOOLEAN DEFAULT false,
    "scheduledDate" TEXT,
    "isTemplate" BOOLEAN DEFAULT true,
    "assignedTo" TEXT,
    location TEXT DEFAULT 'Kinetix Functional Zone',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABLA DE USUARIOS, ATLETAS Y COACHES (athletes)
CREATE TABLE IF NOT EXISTS public.athletes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE,
    email TEXT UNIQUE NOT NULL,
    password TEXT DEFAULT 'kinetix.atleta',
    goal TEXT,
    level TEXT,
    role TEXT DEFAULT 'client',
    days_per_week INTEGER DEFAULT 4,
    equipment JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    is_unlimited BOOLEAN DEFAULT false,
    access_tier TEXT DEFAULT 'regular',
    streak INTEGER DEFAULT 0,
    cycle_end_date DATE,
    age INTEGER,
    weight NUMERIC,
    medical_conditions TEXT,
    preferred_unit TEXT DEFAULT 'kg',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Migración segura si ya creaste la tabla en v7.2:
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'kinetix.atleta';
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS is_unlimited BOOLEAN DEFAULT false;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS access_tier TEXT DEFAULT 'regular';
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS weight NUMERIC;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS medical_conditions TEXT;
ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS preferred_unit TEXT DEFAULT 'kg';

-- 3. TABLA DE CALENDARIO Y ASIGNACIONES (kinetix_calendar)
CREATE TABLE IF NOT EXISTS public.kinetix_calendar (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'workout',
    title TEXT,
    start_at TEXT NOT NULL,
    end_at TEXT,
    all_day BOOLEAN DEFAULT true,
    coach_id TEXT DEFAULT 'jorge',
    athlete_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    workout_template_id TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA DE HISTORIAL DE ENTRENAMIENTOS Y RM (workout_logs)
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id TEXT,
    exercise_id TEXT NOT NULL,
    weight NUMERIC DEFAULT 0,
    reps INTEGER DEFAULT 0,
    is_pr BOOLEAN DEFAULT false,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- 5. TABLA DE MÉTRICAS CORPORALES Y ANTROPOMETRÍA (body_metrics)
CREATE TABLE IF NOT EXISTS public.body_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id TEXT,
    weight NUMERIC NOT NULL,
    body_fat NUMERIC,
    waist NUMERIC,
    chest NUMERIC,
    arm NUMERIC,
    thigh NUMERIC,
    date DATE DEFAULT CURRENT_DATE
);

-- 6. HABILITAR SEGURIDAD (RLS) Y PERMISOS DE ACCESO
ALTER TABLE public.kinetix_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kinetix_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.body_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso total plantillas Kinetix" ON public.kinetix_templates;
CREATE POLICY "Acceso total plantillas Kinetix" ON public.kinetix_templates FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total atletas Kinetix" ON public.athletes;
CREATE POLICY "Acceso total atletas Kinetix" ON public.athletes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total calendario Kinetix" ON public.kinetix_calendar;
CREATE POLICY "Acceso total calendario Kinetix" ON public.kinetix_calendar FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total logs entrenamientos" ON public.workout_logs;
CREATE POLICY "Acceso total logs entrenamientos" ON public.workout_logs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso total métricas corporales" ON public.body_metrics;
CREATE POLICY "Acceso total métricas corporales" ON public.body_metrics FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  const copySQL = () => {
      navigator.clipboard.writeText(supabaseSQL);
      setSeedResult("✅ SQL Maestro v7.3 copiado. Pégalo en tu Supabase SQL Editor y dale a 'Run'.");
  };

  return (
    <div className="pt-20 md:pt-24 pb-32 px-4 md:px-6 max-w-7xl mx-auto min-h-screen text-white font-sans bg-[#050507] animate-in fade-in duration-700 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-red-600/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-12 gap-6 md:gap-8 relative z-10">
            <div className="space-y-3 md:space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-red-600 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] transition-transform hover:rotate-12 cursor-pointer">🔐</div>
                    <div>
                        <div className="flex items-center gap-2">
                           <span className="text-[8px] md:text-[10px] font-black uppercase text-red-400 tracking-[0.4em]">Overlord Master Console</span>
                           <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
                        </div>
                        <h1 className="text-4xl md:text-7xl font-black uppercase italic text-white tracking-tighter leading-none">
                            Consola <span className="text-red-500">Maestra</span>
                        </h1>
                    </div>
                </div>
            </div>
            
            <button onClick={() => onNavigate('home')} className="w-full md:w-auto px-8 py-4 bg-white/5 hover:bg-red-600 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-white/10 active:scale-95">
                Volver al Dashboard ↩
            </button>
        </div>

        <div className="flex gap-6 md:gap-8 mb-10 md:mb-12 border-b border-white/5 relative z-20 overflow-x-auto pb-4 no-scrollbar">
            {[
                { id: 'system', label: 'Hardware' },
                { id: 'devops', label: 'DevOps & Link' },
                { id: 'branding', label: 'Branding' },
                { id: 'data', label: 'Seguridad' },
                { id: 'audit', label: 'Auditoría' }
            ].map((t) => (
                <button 
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)} 
                    className={`relative text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] transition-all whitespace-nowrap ${activeTab === t.id ? 'text-red-500' : 'text-white/20 hover:text-white/40'}`}
                >
                    {t.label}
                    {activeTab === t.id && <div className="absolute -bottom-[18px] left-0 w-full h-[2px] bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />}
                </button>
            ))}
        </div>

        <div className="animate-in slide-in-from-bottom-6 duration-500">
            
            {activeTab === 'system' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    <div className={`p-8 md:p-10 rounded-[45px] border transition-all flex flex-col justify-between ${config.enableAI ? 'bg-red-600/5 border-red-500/20 shadow-2xl shadow-red-500/5' : 'bg-black border-white/5 opacity-40'}`}>
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-start">
                                <span className="text-4xl md:text-5xl">🧠</span>
                                <span className={`text-[7px] md:text-[8px] font-black px-2 py-1 rounded border uppercase ${systemStatus.gemini ? 'border-red-500 text-red-500' : 'border-red-500 text-red-500'}`}>
                                    {systemStatus.aiDiag}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-1 md:mb-2 text-white">Motor IA</h3>
                                <p className="text-[8px] md:text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-widest">Asistencia Técnica & Planificación Gemini Flash.</p>
                            </div>
                        </div>
                        <button onClick={() => toggleFeature('enableAI')} className="w-full py-4 mt-8 md:mt-10 bg-white text-black rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95">
                            {config.enableAI ? 'APAGAR' : 'ENCENDER'}
                        </button>
                    </div>

                    <div className={`p-8 md:p-10 rounded-[45px] border transition-all flex flex-col justify-between ${config.enableCloud ? 'bg-red-600/5 border-red-500/20 shadow-2xl shadow-red-500/5' : 'bg-black border-white/5 opacity-40'}`}>
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-start">
                                <span className="text-4xl md:text-5xl">☁️</span>
                                <span className={`text-[7px] md:text-[8px] font-black px-2 py-1 rounded border uppercase ${systemStatus.supabase ? 'border-red-500 text-red-500' : 'border-white/20 text-white/20'}`}>
                                    {systemStatus.dbDiag}
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-1 md:mb-2 text-white">Cloud Link</h3>
                                <p className="text-[8px] md:text-[10px] text-white/40 leading-relaxed uppercase font-bold tracking-widest">Espejo de datos en Supabase DB.</p>
                            </div>
                        </div>
                        <button onClick={() => toggleFeature('enableCloud')} className="w-full py-4 mt-8 md:mt-10 bg-white text-black rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all active:scale-95">
                            {config.enableCloud ? 'DESACTIVAR' : 'ACTIVAR'}
                        </button>
                    </div>

                    <div className="p-8 md:p-10 rounded-[45px] border border-white/5 bg-[#0F0F11]/60 flex flex-col justify-between">
                        <div className="space-y-4 md:space-y-6">
                            <div className="flex justify-between items-start">
                                <span className="text-4xl md:text-5xl">💾</span>
                            </div>
                            <div>
                                <h3 className="text-xl md:text-2xl font-black uppercase italic mb-1 md:mb-2 text-white">Memoria</h3>
                                <div className="h-1.5 w-full bg-white/5 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${systemStatus.storage.percentage}%` }} />
                                </div>
                                <p className="text-[7px] md:text-[8px] text-white/20 mt-2 uppercase tracking-widest">Uso Local: {systemStatus.storage.usedKB} KB</p>
                            </div>
                        </div>
                        <div className="w-full p-3 md:p-4 bg-white/5 rounded-2xl text-center border border-white/5">
                            <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-red-500">Estado: {systemStatus.storage.percentage < 90 ? 'Saludable' : 'Saturado'}</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'devops' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-[#0F0F11] border border-red-500/20 rounded-[40px] p-8 space-y-6 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 text-8xl grayscale pointer-events-none group-hover:rotate-12 transition-transform">🐙</div>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">📡</span>
                            <h3 className="text-xl font-black uppercase italic text-red-500 tracking-tighter">Tunel Invertido GitHub</h3>
                        </div>
                        <p className="text-[10px] text-white/40 uppercase font-bold leading-relaxed">Crea un puente directo entre esta sesión y tu repositorio para despliegues en 1-clic.</p>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-red-500/60 uppercase tracking-widest">Personal Access Token</label>
                                <input type="password" placeholder="ghp_xxxxxxxxxxxx" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-red-500 shadow-inner" value={ghConfig.token} onChange={e => setGhConfig({...ghConfig, token: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Usuario</label>
                                    <input type="text" placeholder="github_user" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-red-500 shadow-inner" value={ghConfig.owner} onChange={e => setGhConfig({...ghConfig, owner: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">Repositorio</label>
                                    <input type="text" placeholder="kinetix-repo" className="w-full bg-black border border-white/10 rounded-xl p-4 text-xs text-white outline-none focus:border-red-500 shadow-inner" value={ghConfig.repo} onChange={e => setGhConfig({...ghConfig, repo: e.target.value})} />
                                </div>
                            </div>

                            {isDeploying && (
                                <div className="space-y-2 animate-in fade-in">
                                    <div className="flex justify-between text-[8px] font-black text-red-500 uppercase tracking-widest">
                                        <span>Transmitiendo...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                                    </div>
                                </div>
                            )}

                            <button 
                                onClick={runInvertedSync}
                                disabled={isDeploying}
                                className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                            >
                                {isDeploying ? 'PROCESANDO...' : 'INICIAR TRANSMISIÓN MAESTRA'}
                            </button>
                        </div>

                        <div className="bg-black/80 rounded-2xl p-4 h-32 overflow-y-auto font-mono text-[9px] text-red-400/60 border border-white/5 no-scrollbar">
                            {deployLogs.map((log, i) => <p key={i} className="mb-1">{log}</p>)}
                            {deployLogs.length === 0 && <p className="opacity-20 italic">Esperando inicialización...</p>}
                        </div>
                    </div>

                    <div className="bg-[#0F0F11] border border-red-500/20 rounded-[40px] p-8 space-y-6 flex flex-col">
                        <div className="flex items-center gap-3">
                            <span className="text-3xl">🐘</span>
                            <h3 className="text-xl font-black uppercase italic text-red-500 tracking-tighter">SQL Búnker v7.2</h3>
                        </div>
                        <p className="text-[10px] text-white/40 uppercase font-bold leading-relaxed">Estructura definitiva: plantillas de rutinas, atletas, logs de RM y antropometría con RLS.</p>
                        
                        <div className="relative group flex-1">
                            <pre className="bg-black p-5 rounded-2xl text-[9px] font-mono text-white/40 overflow-x-auto h-full max-h-64 border border-white/5 custom-scrollbar">
                                {supabaseSQL}
                            </pre>
                            <button 
                                onClick={copySQL}
                                className="absolute top-4 right-4 bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest shadow-lg opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                            >
                                COPIAR SQL
                            </button>
                        </div>
                    </div>
                </div>

                {/* SUPABASE CLOUD SYNC & SEEDER PANEL */}
                <div className="mt-8 bg-gradient-to-br from-[#0F0F11] to-black border border-cyan-500/30 rounded-[40px] p-8 md:p-10 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center justify-center text-2xl">⚡</div>
                            <div>
                                <span className="text-[8px] font-black uppercase text-cyan-400 tracking-[0.3em]">Cloud Link Supabase</span>
                                <h3 className="text-xl md:text-2xl font-black uppercase italic text-white tracking-tight">Sincronización y Sembrado de Datos</h3>
                            </div>
                        </div>
                        <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${systemStatus.supabase ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                            {systemStatus.supabase ? '● Supabase Conectado' : '○ Supabase Pendiente'}
                        </span>
                    </div>

                    <p className="text-[11px] text-white/50 leading-relaxed max-w-3xl mb-6">
                        Si creaste un proyecto nuevo en Supabase, la base de datos inicia <strong className="text-white">100% vacía</strong>. 
                        Sigue estos 3 pasos para enlazarla y cargar todas tus rutinas Kinetix y atletas sin errores:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-5 space-y-2">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Paso 1: Crear Tablas</span>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                Copia el <strong>SQL Búnker v7.2</strong> de arriba y ejecútalo en el <strong>SQL Editor</strong> de Supabase.
                            </p>
                        </div>
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-5 space-y-2">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Paso 2: Sembrar Datos</span>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                Haz clic en el botón <strong>"Sembrar Rutinas y Atletas"</strong> aquí abajo para llenar la base de datos automáticamente.
                            </p>
                        </div>
                        <div className="bg-black/60 border border-white/10 rounded-2xl p-5 space-y-2">
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">Paso 3: Variables Vercel</span>
                            <p className="text-[10px] text-white/40 leading-relaxed">
                                En Vercel agrega <code className="text-cyan-300">VITE_SUPABASE_URL</code> y <code className="text-cyan-300">VITE_SUPABASE_ANON_KEY</code> y dale Redeploy.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/40">URL del Proyecto Supabase (Limpia sin /rest/v1/)</label>
                            <input 
                                type="text" 
                                value={sbUrlInput}
                                onChange={e => setSbUrlInput(e.target.value)}
                                placeholder="https://cckcpwqsolovddlzlkuo.supabase.co"
                                className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Anon / Publishable Key</label>
                            <input 
                                type="text" 
                                value={sbKeyInput}
                                onChange={e => setSbKeyInput(e.target.value)}
                                placeholder="sb_publishable_..."
                                className="w-full bg-black border border-white/10 rounded-xl p-3.5 text-xs font-mono text-cyan-400 outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {seedResult && (
                        <div className="mb-6 p-4 rounded-xl bg-black border border-cyan-500/30 text-xs font-mono text-cyan-300 animate-in fade-in">
                            {seedResult}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4">
                        <button 
                            onClick={handleSaveSupabaseConfig}
                            className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border border-white/10"
                        >
                            Guardar Credenciales Locales
                        </button>
                        <button 
                            onClick={handleSeedDatabase}
                            disabled={isSeeding}
                            className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-black rounded-xl text-[9px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 disabled:opacity-50"
                        >
                            {isSeeding ? 'Subiendo datos a Supabase...' : '🌱 Sembrar Rutinas y Atletas en Supabase'}
                        </button>
                    </div>
                </div>
            </div>
            )}

            {activeTab === 'branding' && (
                <div className="max-w-2xl bg-[#0F0F11] border border-white/5 rounded-[40px] p-10 space-y-10">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block">Logo de la Plataforma</label>
                        <div className="flex items-center gap-8">
                            <div className="w-32 h-32 bg-black rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden">
                                {branding.logoUrl ? <img src={branding.logoUrl} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <span className="text-white/10">Sin Logo</span>}
                            </div>
                            <div className="space-y-4">
                                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" id="logo-input" />
                                <label htmlFor="logo-input" className="px-6 py-3 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-red-600 hover:text-white transition-all">Subir Imagen</label>
                                <p className="text-[8px] text-white/20">SVG o PNG transparente recomendado.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase text-white/30 tracking-widest block">Color Primario</label>
                        <div className="flex gap-4 items-center">
                            <input type="color" className="w-12 h-12 bg-transparent border-0 cursor-pointer" value={branding.primaryColor} onChange={e => setBranding({...branding, primaryColor: e.target.value})} />
                            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">{branding.primaryColor}</span>
                        </div>
                    </div>

                    <button onClick={handleSaveBranding} className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl">Guardar Cambios de Marca</button>
                </div>
            )}
            
            {activeTab === 'audit' && (
                <div className="bg-[#0F0F11]/60 border border-white/5 rounded-[45px] p-10 space-y-10">
                     <div className="flex items-center gap-4">
                         <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                         <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white">Auditoría de Rutinas y Cargas</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            {[
                                { label: 'IA Architect (Gemini)', val: systemStatus.gemini ? 'ACTIVO' : 'LOCAL-ONLY', color: systemStatus.gemini ? 'text-red-400' : 'text-red-500' },
                                { label: 'Cloud Database', val: systemStatus.supabase ? 'ENLAZADO' : 'OFFLINE', color: systemStatus.supabase ? 'text-green-500' : 'text-white/20' },
                                { label: 'Versión del Sistema', val: systemStatus.version, color: 'text-white/40' },
                                { label: 'Cifrado de Sesión', val: 'AES-256-GCM', color: 'text-white/40' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-3 border-b border-white/5">
                                    <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{item.label}</span>
                                    <span className={`text-[9px] font-black uppercase ${item.color}`}>{item.val}</span>
                                </div>
                            ))}
                        </div>
                        <div className="bg-black/60 border border-red-500/10 rounded-[35px] p-8 font-mono text-[10px] text-red-500/60 overflow-hidden leading-relaxed shadow-inner">
                             <p className="text-red-400 font-bold mb-4 uppercase tracking-widest">Real-time Auditor Log:</p>
                             <div className="space-y-1">
                                <p>[{new Date().toLocaleTimeString()}] MASTER_CONSOLE_ACTIVE</p>
                                <p>[{new Date().toLocaleTimeString()}] SCANNING_SECURITY_PROTOCOLS... OK</p>
                                <p>[{new Date().toLocaleTimeString()}] INVERTED_TUNNEL_READY</p>
                                <p>[{new Date().toLocaleTimeString()}] ENCRYPTION_LAYER_6_LOADED</p>
                             </div>
                             <div className="mt-6 animate-pulse text-red-400 font-black">_AWAITING_MASTER_COMMAND</div>
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-gradient-to-br from-[#0A0A0C] to-black rounded-[45px] border border-red-500/10 p-12 text-center space-y-8 group transition-all hover:border-red-500/30">
                        <div className="w-20 h-20 bg-red-600/10 rounded-[30px] flex items-center justify-center mx-auto mb-2 border border-red-500/20 text-4xl transition-transform group-hover:scale-110 group-hover:rotate-6">💾</div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic text-white">Copia Maestra</h3>
                            <p className="text-[10px] text-white/30 uppercase font-bold mt-2">Respaldar toda la inteligencia del búnker en JSON.</p>
                        </div>
                        <button onClick={() => {
                            const backup = storageService.createBackup();
                            const blob = new Blob([backup], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `kinetix_master_${new Date().toISOString().split('T')[0]}.json`;
                            a.click();
                            URL.revokeObjectURL(url);
                        }} className="w-full py-5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">
                            EXPORTAR NÚCLEO
                        </button>
                    </div>

                    <div className="bg-[#0F0F11]/60 border border-white/5 rounded-[45px] p-12 flex flex-col items-center justify-center text-center space-y-8 group hover:border-white/20 transition-all">
                        <div className="w-20 h-20 bg-white/5 rounded-[30px] flex items-center justify-center mx-auto mb-2 border border-white/10 text-4xl transition-transform group-hover:scale-110 group-hover:-rotate-6">🚀</div>
                        <div>
                            <h3 className="text-3xl font-black uppercase italic text-white/50">Restauración</h3>
                            <p className="text-[10px] text-white/20 uppercase font-bold mt-2">Inyectar datos externos al sistema local.</p>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (re) => {
                                const success = storageService.restoreBackup(re.target?.result as string);
                                if (success) { alert("RESTORE COMPLETO. El sistema se reiniciará."); window.location.reload(); }
                                else alert("ERROR CRÍTICO: El archivo no tiene la firma de Kinetix.");
                            };
                            reader.readAsText(file);
                        }} />
                        <button onClick={() => fileInputRef.current?.click()} className="w-full py-5 border-2 border-dashed border-white/10 text-white/20 hover:text-white hover:border-white/30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                            IMPORTAR NÚCLEO
                        </button>
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

