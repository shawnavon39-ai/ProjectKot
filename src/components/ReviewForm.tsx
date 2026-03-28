/*
  ReviewForm.tsx — React island for submitting shop reviews.

  Only visible to logged-in users. Uses client:only="react"
  because it needs the Supabase client (import.meta.env).
*/
import { useState, useRef, useEffect } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';

interface Props {
  shopId: string;
}

function getSupabase() {
  return createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default function ReviewForm({ shopId }: Props) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = getSupabase();
  const supabase = supabaseRef.current;

  const [user, setUser] = useState<User | null>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  if (!user) {
    return (
      <div className="text-center py-6 text-sm text-gray-500">
        <a href="/login" className="text-violet-600 hover:underline font-medium">Sign in</a> to leave a review.
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="text-center py-6 text-sm text-green-700 bg-green-50 rounded-lg">
        Thanks for your review!
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }
    if (body.trim().length < 10) {
      setError('Review must be at least 10 characters.');
      return;
    }

    setSubmitting(true);

    const displayName = user!.user_metadata?.display_name || user!.email?.split('@')[0] || 'Anonymous';

    const { error: insertError } = await supabase.from('reviews').insert({
      shop_id: shopId,
      user_id: user!.id,
      display_name: displayName,
      rating,
      body: body.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-2xl focus:outline-none"
            >
              {star <= (hoverRating || rating) ? '★' : '☆'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-gray-700 mb-1">Your review</label>
        <textarea
          id="review-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={3}
          placeholder="What did you like about this shop?"
          className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition disabled:opacity-50 shadow-sm"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
