import { useState } from 'react';
import { Info } from 'lucide-react';

export default function SectionHeader({ icon: Icon, eyebrow, title, description }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-[var(--accent-primary)]">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] text-[var(--accent-primary)]">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
          )}
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">{title}</h2>
            {description && (
              <div className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onClick={() => setShowTooltip(prev => !prev)}
              >
                <Info size={16} className="cursor-pointer text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] transition-colors" aria-label={description} />
                {showTooltip && (
                  <div className="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))] px-3 py-2 text-xs font-normal text-[var(--text-secondary)] shadow-lg">
                    <div className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-l border-t border-[var(--border-default)] bg-[var(--bg-elevated,var(--bg-card))]" />
                    {description}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
