import { Volume2, VolumeX } from 'lucide-react';
import { useSoundStore } from '../../stores/soundStore';

export function SoundToggle() {
  const { soundEnabled, toggleSound, playSuccessSound } = useSoundStore();

  const handleToggle = () => {
    toggleSound();
    if (!soundEnabled) {
      setTimeout(() => playSuccessSound(), 50);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Ovozli signallar"
      className={`p-2.5 rounded-xl border transition-colors shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#FF5A1F] ${
        soundEnabled
          ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
          : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-400 dark:text-stone-500 hover:text-stone-700'
      }`}
      title={soundEnabled ? "Ovozli signallar yoqilgan" : "Ovozli signallar o'chirilgan"}
    >
      {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
    </button>
  );
}
