import { useEffect, useRef, useState } from 'react';

export default function AdSlot({ label = 'AdSense Slot', className = '' }) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={`min-h-[140px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/90 p-4 dark:border-slate-700 dark:bg-slate-900/80 ${className}`}>
      <div className="flex h-full min-h-[108px] items-center justify-center rounded-xl bg-white/70 text-center text-xs text-slate-500 dark:bg-slate-950/70 dark:text-slate-400">
        {isVisible ? `${label} · lazy ready · ${process.env.NEXT_PUBLIC_ADSENSE_CLIENT || 'ca-pub-xxxxxxxxxxxxxxxx'}` : 'Loading sponsor slot…'}
      </div>
    </div>
  );
}
