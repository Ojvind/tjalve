'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const CHECK_SVG = (
  <svg viewBox="0 0 20 20" aria-hidden="true" width={18} height={18}>
    <path d="M4.5 10.5l3.5 3.5 7.5-8" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function CheckButton({
  planId,
  sessionId,
  initialDone,
  variant = 'round',
  label,
}: {
  planId: string;
  sessionId: string;
  initialDone: boolean;
  variant?: 'round' | 'big';
  label: string;
}) {
  const [done, setDone] = useState(initialDone);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function toggle() {
    setPending(true);
    const next = !done;
    setDone(next); // optimistic
    try {
      const res = await fetch('/api/progress/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, sessionId }),
      });
      if (!res.ok) throw new Error('failed');
      router.refresh();
    } catch {
      setDone(!next); // revert on failure
    } finally {
      setPending(false);
    }
  }

  if (variant === 'big') {
    return (
      <button className={`big-check${done ? ' done' : ''}`} onClick={toggle} disabled={pending} aria-pressed={done}>
        {done ? CHECK_SVG : null}
        {done ? 'Klart' : 'Markera som klart'}
      </button>
    );
  }

  return (
    <button className={`check${done ? ' done' : ''}`} onClick={toggle} disabled={pending} aria-pressed={done} aria-label={label}>
      {done ? CHECK_SVG : null}
    </button>
  );
}
