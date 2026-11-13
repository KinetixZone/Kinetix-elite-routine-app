import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { isInstallable: !!deferredPrompt, isInstalled, isIOS, install };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (isInstallable ? install() : setShowGuide(true))}
        className={
          compact
            ? 'px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap'
            : 'w-full py-3.5 px-4 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-black border border-cyan-500/30 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2'
        }
      >
        <span>📲</span>
        <span>{compact ? 'Instalar App' : 'Agregar Kinetix a Pantalla de Inicio'}</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-[2500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0F0F11] border border-cyan-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black uppercase italic text-white">Instalar en tu Celular</h3>
              <button type="button" onClick={() => setShowGuide(false)} className="text-white/50 hover:text-white text-sm px-2">✕</button>
            </div>
            {isIOS ? (
              <ol className="text-xs text-white/80 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>Abre este link en <strong>Safari</strong> (no dentro de WhatsApp).</li>
                <li>Toca el ícono de <strong>Compartir</strong> (cuadro con flecha hacia arriba) abajo en Safari.</li>
                <li>Desliza y selecciona <strong>"Agregar a pantalla de inicio"</strong>.</li>
              </ol>
            ) : (
              <ol className="text-xs text-white/80 space-y-2 list-decimal pl-4 leading-relaxed">
                <li>Abre este link en <strong>Chrome</strong> o <strong>Edge</strong>.</li>
                <li>Toca el menú de los <strong>3 puntos (⋮)</strong> arriba a la derecha.</li>
                <li>Selecciona <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
              </ol>
            )}
            <p className="text-[11px] text-cyan-300/80">
              Se abrirá en pantalla completa con el logo de Kinetix como una app nativa, gratis y sin tiendas.
            </p>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
