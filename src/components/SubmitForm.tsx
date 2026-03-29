/*
  SubmitForm.tsx — a React island component.

  Now auth-aware: if the user is signed in, their user ID is attached
  to the submission (submitted_by). If not, it submits anonymously.
  Either way, the shop goes into 'pending' status for admin review.
*/
import { useState, useReducer, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import type { Shop } from '../lib/types';

interface SubmitFormProps {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

type FormState = {
  name: string;
  platform: Shop['platform'] | '';
  shop_url: string;
  category: string;
  description: string;
  followers: string;
};

type FormAction =
  | { type: 'setField'; field: keyof FormState; value: string }
  | { type: 'reset' };

const initialState: FormState = {
  name: '',
  platform: '',
  shop_url: '',
  category: '',
  description: '',
  followers: '',
};

function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'setField':
      return { ...state, [action.field]: action.value };
    case 'reset':
      return initialState;
  }
}

type SubmitStatus = 'idle' | 'submitting' | 'success' | 'error';

export default function SubmitForm({ supabaseUrl, supabaseAnonKey }: SubmitFormProps) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey);
  const supabase = supabaseRef.current;

  const [state, dispatch] = useReducer(formReducer, initialState);
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const isValid =
    state.name.trim() !== '' &&
    state.platform !== '' &&
    state.shop_url.trim() !== '' &&
    state.category !== '';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStatus('submitting');
    setErrorMessage('');

    const slug = state.name.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const { error } = await supabase.from('shops').insert({
      name: state.name.trim(),
      slug,
      platform: state.platform,
      shop_url: state.shop_url.trim(),
      category: state.category,
      description: state.description.trim() || null,
      followers: state.followers.trim() || null,
      status: 'pending',
      submitted_by: user?.id ?? null,
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
      return;
    }

    setStatus('success');
    dispatch({ type: 'reset' });
  }

  if (status === 'success') {
    const shareText = `I just submitted my shop to Pick Your Shop — the creator shop directory! Check it out:`;
    const shareUrl = 'https://pickyour.shop';

    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
        <h2 className="text-xl font-bold text-green-800 mb-2">Shop submitted!</h2>
        <p className="text-green-700 mb-4">We'll review it and add it to the directory shortly.</p>

        <p className="text-sm text-gray-600 mb-3">Share the news:</p>
        <div className="flex justify-center gap-3 mb-6">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition"
          >
            Share on X
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-700 text-white rounded-lg text-sm font-medium hover:bg-blue-800 transition"
          >
            Share on Facebook
          </a>
          <button
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              alert('Link copied!');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 transition"
          >
            Copy Link
          </button>
        </div>

        <button
          onClick={() => setStatus('idle')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="shop-name" className="block text-sm font-medium text-gray-700 mb-1">
          Shop Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="shop-name"
          value={state.name}
          onChange={e => dispatch({ type: 'setField', field: 'name', value: e.target.value })}
          placeholder="e.g. StyleByMia"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        />
      </div>

      <div>
        <label htmlFor="platform" className="block text-sm font-medium text-gray-700 mb-1">
          Platform <span className="text-red-500">*</span>
        </label>
        <select
          id="platform"
          value={state.platform}
          onChange={e => dispatch({ type: 'setField', field: 'platform', value: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        >
          <option value="">Select a platform</option>
          <option value="tiktok">TikTok Shop</option>
          <option value="instagram">Instagram Shopping</option>
          <option value="youtube">YouTube Shopping</option>
          <option value="pinterest">Pinterest Shopping</option>
          <option value="amazon">Amazon Influencer</option>
        </select>
      </div>

      <div>
        <label htmlFor="shop-url" className="block text-sm font-medium text-gray-700 mb-1">
          Shop URL <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          id="shop-url"
          value={state.shop_url}
          onChange={e => dispatch({ type: 'setField', field: 'shop_url', value: e.target.value })}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={state.category}
          onChange={e => dispatch({ type: 'setField', field: 'category', value: e.target.value })}
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
          required
        >
          <option value="">Select a category</option>
          <option value="Fashion">Fashion</option>
          <option value="Beauty">Beauty</option>
          <option value="Tech">Tech</option>
          <option value="Home">Home</option>
          <option value="Food & Drink">Food & Drink</option>
          <option value="Fitness">Fitness</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="followers" className="block text-sm font-medium text-gray-700 mb-1">
          Follower Count
        </label>
        <input
          type="text"
          id="followers"
          value={state.followers}
          onChange={e => dispatch({ type: 'setField', field: 'followers', value: e.target.value })}
          placeholder="e.g. 50K"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Short Description
        </label>
        <textarea
          id="description"
          rows={3}
          value={state.description}
          onChange={e => dispatch({ type: 'setField', field: 'description', value: e.target.value })}
          placeholder="What does your shop sell?"
          className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
      </div>

      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {errorMessage || 'Something went wrong. Please try again.'}
        </div>
      )}

      <button
        type="submit"
        disabled={!isValid || status === 'submitting'}
        className="w-full py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {status === 'submitting' ? 'Submitting...' : 'Submit for Review'}
      </button>
    </form>
  );
}
