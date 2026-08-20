'use client';

import { useState } from 'react';

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900 flex items-center justify-center">
        <span className="text-6xl">💎</span>
      </div>
    );
  }

  return (
    <div>
      <div className="aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-stone-100 to-amber-50 dark:from-stone-800 dark:to-stone-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={`${name} — view ${active + 1}`}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 mt-4">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActive(idx)}
              aria-label={`Show image ${idx + 1} of ${name}`}
              aria-pressed={active === idx}
              className={`aspect-square rounded-sm overflow-hidden border transition-colors cursor-pointer ${
                active === idx
                  ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
