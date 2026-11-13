import React, { useState, useMemo } from 'react';
import { authService } from '../../services/authService';
import { storageService } from '../../services/storageService';
import { User } from '../../types/kinetix';

interface Props {
    onLoginSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<Props> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'sent'>('idle');
    const [error, setError] = useState<string | null>(null);

    const isAdminMode = useMemo(() => authService.isAdminEmail(email), [email]);
    const isLeslie = useMemo(() => {
        const e = email.trim().toLowerCase();
        return e === 'leslie23tr@gmail.com' || e === 'les_barrera@outlook.com';
    }, [email]);
    const isJorge = useMemo(() => {
        const e = email.trim().toLowerCase();
        return e === 'jorge02gonzalez@outlook.com' || e.includes('kinetixzone');
    }, [email]);

    const branding = storageService.getBranding();

    const executeLogin = async (targetEmail: string, targetPass: string) => {
        setStatus('loading');
        setError(null);

        const { success, error: authError } = await authService.requestAccess(targetEmail, targetPass);
        
        if (success) {
            const profile = await authService.finalizeLogin(targetEmail);
            if (profile) {
                setStatus('sent');
                setTimeout(() => onLoginSuccess(profile), 600);
            } else {
                setError("ERROR AL SINCRONIZAR PERFIL DE USUARIO");
                setStatus('idle');
            }
        } else {
            setError(authError?.toUpperCase() || "ACCESO DENEGADO");
            setStatus('idle');
        }
    };

    const handleAccessRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes('@')) {
            return setError("INGRESA UN EMAIL VÁLIDO");
        }
        if (!password.trim()) {
            return setError("INGRESA TU CLAVE DE ACCESO");
        }
        await executeLogin(email, password);
    };

    const handleQuickLogin = (quickEmail: string, quickPass: string, autoSubmit = false) => {
        setEmail(quickEmail);
        setPassword(quickPass);
        setError(null);
        if (autoSubmit) {
            executeLogin(quickEmail, quickPass);
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-4 md:p-6 text-white relative overflow-hidden selection:bg-red-600">
            
            {/* Fondo Táctico Limpio */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-20 z-0"></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[180px] rounded-full transition-all duration-1000 z-0 ${isAdminMode ? 'bg-red-600/20' : 'bg-red-900/10'}`}></div>

            <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-6 animate-in fade-in duration-700">
                
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-3">
                    <div className="relative group">
                        <div className="absolute -inset-1.5 bg-gradient-to-r from-red-600 via-cyan-400 to-red-600 rounded-[32px] blur-lg opacity-50 group-hover:opacity-90 transition duration-1000 animate-pulse"></div>
                        <div className="relative w-28 h-28 md:w-32 md:h-32 bg-black border border-white/10 rounded-[28px] overflow-hidden flex items-center justify-center p-2 shadow-2xl">
                            <img 
                                src={branding.logoUrl || '/assets/aistudio/1759185151992_02f8a860.jpg'} 
                                alt="Kinetix Functional Zone" 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                    </div>
                    
                    <div className="text-center space-y-1">
                        {isLeslie ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-600/20 border border-red-500/50 rounded-full mb-1 animate-pulse">
                                <span className="text-xs">👑</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Dueña & Coach Leslie</span>
                            </div>
                        ) : isJorge ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-cyan-600/20 border border-cyan-500/50 rounded-full mb-1 animate-pulse">
                                <span className="text-xs">👑</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-cyan-300">Dueño & Head Coach Jorge</span>
                            </div>
                        ) : isAdminMode ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-red-600/20 border border-red-500/50 rounded-full mb-1">
                                <span className="text-xs">🛡️</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Mando Central de Coach</span>
                            </div>
                        ) : null}

                        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                            <span className="text-[#FF2A2A] drop-shadow-[0_0_20px_rgba(255,42,42,0.5)]">KINETIX</span><br/>
                            <span className="text-[#00F0FF] text-lg md:text-2xl tracking-[0.22em] font-black drop-shadow-[0_0_15px_rgba(0,240,255,0.5)]">FUNCTIONAL ZONE</span>
                        </h1>
                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.35em] text-white/40 pt-1">
                            {isAdminMode ? 'Centro de Mando • Leslie & Jorge' : 'Ecosistema de Alto Rendimiento & Atletas'}
                        </p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleAccessRequest} className="w-full bg-[#0F0F11]/90 backdrop-blur-md border border-white/10 p-6 md:p-8 rounded-[36px] space-y-4 shadow-2xl">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em] block pl-1">
                                Correo Electrónico
                            </label>
                            <input 
                                type="email" 
                                placeholder="tu-email@kinetix.com" 
                                className={`w-full bg-black/70 border p-4 rounded-2xl font-bold text-xs text-white tracking-wider outline-none transition-all placeholder-white/20 ${isAdminMode ? 'border-red-600/80 focus:border-red-500 text-red-300' : 'border-white/10 focus:border-white/40'}`}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={status !== 'idle'}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center pl-1">
                                <label className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em]">
                                    {isAdminMode ? 'Clave Maestra de Staff' : 'Clave de Acceso Asignada'}
                                </label>
                                <span className="text-[7px] text-white/30 font-bold uppercase">
                                    {isAdminMode ? 'Acceso Privado' : 'Asignada por tu coach'}
                                </span>
                            </div>
                            <input 
                                type="password" 
                                placeholder={isAdminMode ? "Ingresa tu clave maestra" : "Ingresa tu clave de atleta"} 
                                className={`w-full bg-black/70 border p-4 rounded-2xl font-bold text-xs text-white tracking-wider outline-none transition-all placeholder-white/20 ${isAdminMode ? 'border-red-600/80 focus:border-red-500 text-red-300' : 'border-white/10 focus:border-white/40'}`}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={status !== 'idle'}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/60 border border-red-600/60 rounded-2xl animate-in zoom-in-95">
                            <p className="text-[9px] text-red-300 font-black uppercase text-center tracking-wider">{error}</p>
                        </div>
                    )}

                    <button 
                        type="submit"
                        disabled={status !== 'idle' || !email.trim() || !password.trim()}
                        className={`w-full py-4 md:py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all relative overflow-hidden border shadow-2xl active:scale-[0.98] cursor-pointer ${isAdminMode ? 'bg-red-600 text-white border-red-500 hover:bg-red-500 shadow-[0_0_30px_rgba(220,38,38,0.4)]' : 'bg-white text-black border-white hover:bg-white/90'}`}
                    >
                        {status === 'loading' ? 'VERIFICANDO CREDENCIALES...' : status === 'sent' ? 'ACCESO AUTORIZADO ✓' : isLeslie ? 'INGRESAR COMO DUEÑA & COACH (LESLIE)' : isJorge ? 'INGRESAR COMO HEAD COACH (JORGE)' : isAdminMode ? 'INGRESAR COMO COACH / DUEÑO' : 'INGRESAR AL SISTEMA'}
                    </button>
                </form>

                {/* Acceso Demo Atletas (Sin exponer llaves ni accesos internos de dueños/pagos) */}
                <div className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-4 space-y-2.5 shadow-xl">
                    <div className="flex items-center justify-between">
                        <p className="text-[8px] font-black uppercase tracking-[0.25em] text-white/40">
                            Prueba Vista de Atleta
                        </p>
                        <span className="text-[7px] text-cyan-400 font-bold uppercase tracking-wider">Acceso Demo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            type="button"
                            onClick={() => handleQuickLogin('carlos@kinetix.com', 'kinetix.atleta', true)}
                            className="bg-white/5 hover:bg-white text-white/70 hover:text-black border border-white/10 p-2.5 rounded-xl text-[8px] font-black uppercase tracking-wider text-center transition-all active:scale-95"
                        >
                            🏃 Atleta Carlos
                        </button>
                        <button 
                            type="button"
                            onClick={() => handleQuickLogin('ana@kinetix.com', 'kinetix.atleta', true)}
                            className="bg-white/5 hover:bg-white text-white/70 hover:text-black border border-white/10 p-2.5 rounded-xl text-[8px] font-black uppercase tracking-wider text-center transition-all active:scale-95"
                        >
                            🏃 Atleta Ana
                        </button>
                    </div>
                </div>

                {/* Instrucciones limpias sin filtrar contraseñas internas */}
                <div className="w-full bg-black/40 border border-white/5 rounded-2xl p-3.5 space-y-1 text-left">
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">
                        🔒 Metodología Exclusiva Lic. Jorge González • Kinetix Functional Zone
                    </p>
                    <p className="text-[8px] text-white/40 leading-relaxed">
                        Ingresa con el correo y clave asignados por tu entrenador para acceder a tu sesión del día.
                    </p>
                </div>

                <div className="flex flex-col items-center gap-2 opacity-30 text-center pt-2">
                    <div className="h-[1px] w-12 bg-white/40"></div>
                    <p className="text-[8px] font-black uppercase tracking-widest text-white/50">
                        Kinetix Functional Zone & Athlete Hub • v7.0
                    </p>
                </div>
            </div>
        </div>
    );
};
