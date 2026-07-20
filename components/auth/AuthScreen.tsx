
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
    const branding = storageService.getBranding();

    const handleAccessRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) return setError("CREDENCIAL NO VÁLIDA");
        if (isAdminMode && !password) return setError("AUTORIZACIÓN ALPHA REQUERIDA");

        setStatus('loading');
        setError(null);

        const { success, error: authError } = await authService.requestAccess(email, isAdminMode ? password : undefined);
        
        if (success) {
            const profile = await authService.finalizeLogin(email);
            if (profile) {
                setTimeout(() => onLoginSuccess(profile), 1500);
                setStatus('sent');
            } else {
                setError("FALLO EN ENLACE DE DATOS");
                setStatus('idle');
            }
        } else {
            setError(authError?.toUpperCase() || "ACCESO DENEGADO");
            setStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden selection:bg-red-600">
            
            {/* Fondo Táctico Limpio */}
            <div className="absolute inset-0 bg-grid pointer-events-none opacity-20 z-0"></div>
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[180px] rounded-full transition-all duration-1000 z-0 ${isAdminMode ? 'bg-red-600/10' : 'bg-blue-600/5'}`}></div>

            <div className="relative z-10 w-full max-w-sm flex flex-col items-center space-y-12 animate-in fade-in duration-1000">
                
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-6">
                    <div className={`w-32 h-32 md:w-40 md:h-40 bg-black/40 backdrop-blur-xl border-2 rounded-[40px] flex items-center justify-center transition-all duration-500 shadow-2xl ${isAdminMode ? 'border-red-600 rotate-45' : 'border-white/10'}`}>
                        <div className={`transition-transform duration-500 ${isAdminMode ? '-rotate-45' : ''}`}>
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt="Kinetix Logo" className="w-20 h-20 object-contain" />
                            ) : (
                                <span className={`text-7xl font-black italic tracking-tighter ${isAdminMode ? 'text-red-600' : 'text-white'}`}>K</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="text-center">
                        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-[0.8] mb-2">
                            KINETIX<br/>
                            <span className={isAdminMode ? 'text-red-600' : 'text-white/40'}>ELITE OS</span>
                        </h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.6em] text-white/20 mt-4">Command & Control</p>
                    </div>
                </div>

                {/* Form Section */}
                <form onSubmit={handleAccessRequest} className="w-full space-y-4">
                    <div className="space-y-3">
                        <input 
                            type="email" 
                            placeholder="OPERATOR EMAIL" 
                            className={`w-full bg-white/5 border p-5 rounded-2xl font-black text-[10px] text-center uppercase tracking-[0.3em] outline-none transition-all placeholder-white/10 ${isAdminMode ? 'border-red-600/50 focus:border-red-600 text-red-500' : 'border-white/10 focus:border-white/40'}`}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            disabled={status !== 'idle'}
                        />

                        {isAdminMode && (
                            <input 
                                type="password" 
                                placeholder="MASTER KEY" 
                                className="w-full bg-red-950/20 border border-red-600/50 p-5 rounded-2xl font-black text-[10px] text-center uppercase tracking-[0.5em] outline-none focus:border-red-600 text-red-600 animate-in slide-in-from-top-2"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={status !== 'idle'}
                            />
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-red-950/40 border border-red-600/40 rounded-2xl animate-in zoom-in-95">
                            <p className="text-[9px] text-red-500 font-black uppercase text-center tracking-widest">{error}</p>
                        </div>
                    )}

                    <button 
                        disabled={status !== 'idle' || !email.trim() || (isAdminMode && !password.trim())}
                        className={`w-full py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.5em] transition-all relative overflow-hidden border shadow-2xl active:scale-[0.98] ${isAdminMode ? 'bg-red-600 text-white border-red-500' : 'bg-white text-black border-white'} `}
                    >
                        {status === 'loading' ? 'VERIFYING...' : status === 'sent' ? 'ACCESS GRANTED' : isAdminMode ? 'UNLOCK TERMINAL' : 'INITIALIZE SYSTEM'}
                    </button>
                </form>

                <div className="flex flex-col items-center gap-4 opacity-20">
                    <div className="h-[1px] w-12 bg-white"></div>
                    <p className="text-[8px] font-black uppercase tracking-widest">Lead by Jorge González</p>
                </div>
            </div>
        </div>
    );
};
