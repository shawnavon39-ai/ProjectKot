import { useState } from 'react';

interface Props {
  variant?: 'inline' | 'banner';
}

export default function EmailSignup({ variant = 'inline' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'duplicate' | 'error'>('idle');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');

    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    if (res.ok) {
      setStatus('success');
      setEmail('');
    } else if (res.status === 409) {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-violet-700 font-medium">
        ✓ You're in! We'll let you know when new shops are added.
      </p>
    );
  }

  if (variant === 'banner') {
    return (
      <div className="bg-violet-50 border border-violet-100 rounded-xl p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-1">Get notified of new shops</h3>
        <p className="text-sm text-slate-600 mb-4">We'll email you when new creator shops are added. No spam, unsubscribe anytime.</p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60"
          >
            {status === 'loading' ? '...' : 'Notify me'}
          </button>
        </form>
        {status === 'duplicate' && <p className="text-xs text-slate-500 mt-2">You're already subscribed!</p>}
        {status === 'error' && <p className="text-xs text-red-500 mt-2">Something went wrong — try again.</p>}
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition disabled:opacity-60"
        >
          {status === 'loading' ? '...' : 'Notify me'}
        </button>
      </form>
      {status === 'duplicate' && <p className="text-xs text-slate-500 mt-2">You're already subscribed!</p>}
      {status === 'error' && <p className="text-xs text-red-500 mt-2">Something went wrong — try again.</p>}
    </div>
  );
}
