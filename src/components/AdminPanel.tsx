import { useState, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

interface Props {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

type Tab = 'shops' | 'reviews' | 'verified' | 'products';

export default function AdminPanel({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabaseRef = useRef<SupabaseClient | null>(null);
  if (!supabaseRef.current) supabaseRef.current = createClient(supabaseUrl, supabaseAnonKey);
  const supabase = supabaseRef.current;

  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>('shops');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // New product form state
  const [productForm, setProductForm] = useState({
    shopId: '', name: '', price: '', originalPrice: '', imageUrl: '', productUrl: '', onSale: false,
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setToken(session.access_token);
        fetchData(session.access_token);
      } else {
        setToken(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function fetchData(t: string) {
    setLoading(true);
    const res = await fetch('/api/admin', { headers: { Authorization: `Bearer ${t}` } });
    if (res.status === 401) { setAuthorized(false); setLoading(false); return; }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `Server error (${res.status})` }));
      setFetchError(err.error ?? `Server error (${res.status})`);
      setLoading(false);
      return;
    }
    const json = await res.json();
    setData(json);
    setAuthorized(true);
    setLoading(false);
  }

  async function action(payload: Record<string, any>) {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.error) {
      setMessage(json.error);
      setMessageType('error');
    } else {
      setMessage('Done!');
      setMessageType('success');
      fetchData(token!);
    }
    setTimeout(() => setMessage(''), 3000);
  }

  if (loading) return <div className="p-8 text-slate-500">Loading...</div>;

  if (!token) return (
    <div className="p-8 text-center">
      <p className="text-slate-600 mb-4">You need to be signed in to access admin.</p>
      <a href="/login" className="px-4 py-2 bg-violet-600 text-white rounded-lg font-medium hover:bg-violet-700 transition">Sign in</a>
    </div>
  );

  if (fetchError) return (
    <div className="p-8 text-center">
      <p className="text-red-600 font-medium mb-2">Error loading admin data</p>
      <p className="text-sm text-slate-500">{fetchError}</p>
    </div>
  );

  if (!authorized) return (
    <div className="p-8 text-center">
      <p className="text-red-600 font-medium">Not authorised.</p>
    </div>
  );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'shops', label: 'Pending Shops', count: data.pendingCount },
    { id: 'reviews', label: 'Pending Reviews', count: data.pendingReviews.length },
    { id: 'verified', label: 'Verified', count: data.approvedCount },
    { id: 'products', label: 'Products', count: data.products.length },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin</h1>
        <div className="flex gap-3 text-sm">
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-medium">{data.pendingCount} pending</span>
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-medium">{data.approvedCount} approved</span>
        </div>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${messageType === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-slate-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab.id ? 'border-violet-600 text-violet-600' : 'border-transparent text-slate-500 hover:text-slate-900'}`}
          >
            {tab.label} {tab.count !== undefined && <span className="ml-1 text-xs">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Pending Shops */}
      {activeTab === 'shops' && (
        <div>
          {data.pendingShops.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No shops waiting for review.</p>
          ) : (
            <div className="space-y-3">
              {data.pendingShops.map((shop: any) => (
                <div key={shop.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-start justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-slate-900">{shop.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{shop.platform}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">{shop.category}</span>
                    </div>
                    {shop.description && <p className="text-sm text-slate-500 truncate mb-1">{shop.description}</p>}
                    <a href={shop.shop_url} target="_blank" rel="noopener noreferrer" className="text-xs text-violet-600 hover:underline truncate block">{shop.shop_url}</a>
                    {shop.followers && <p className="text-xs text-slate-400 mt-1">{shop.followers} followers</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => action({ action: 'approve', shopId: shop.id })} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition">Approve</button>
                    <button onClick={() => action({ action: 'reject', shopId: shop.id })} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700 transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pending Reviews */}
      {activeTab === 'reviews' && (
        <div>
          {data.pendingReviews.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">No reviews waiting for moderation.</p>
          ) : (
            <div className="space-y-3">
              {data.pendingReviews.map((review: any) => (
                <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-medium text-sm text-slate-900">{review.display_name}</span>
                      <span className="text-amber-500 text-sm ml-2">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                      <span className="text-xs text-slate-400 ml-2">on {review.shops?.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{review.body}</p>
                  <div className="flex gap-2">
                    <button onClick={() => action({ action: 'approve_review', reviewId: review.id })} className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700 transition">Approve</button>
                    <button onClick={() => action({ action: 'reject_review', reviewId: review.id })} className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg font-medium hover:bg-red-700 transition">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified toggle */}
      {activeTab === 'verified' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-3 pr-4">Shop</th>
                <th className="pb-3 pr-4">Followers</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.approvedShops.map((shop: any) => (
                <tr key={shop.id} className="hover:bg-slate-50">
                  <td className="py-2.5 pr-4">
                    <a href={`/shops/${shop.slug}`} target="_blank" className="font-medium text-slate-900 hover:text-violet-600 transition">{shop.name}</a>
                  </td>
                  <td className="py-2.5 pr-4 text-slate-400 text-xs">{shop.followers ?? '—'}</td>
                  <td className="py-2.5 pr-4">
                    {shop.verified
                      ? <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">✓ Verified</span>
                      : <span className="text-xs text-slate-400">Unverified</span>
                    }
                  </td>
                  <td className="py-2.5 text-right">
                    <button
                      onClick={() => action({ action: 'toggle_verified', shopId: shop.id, verified: !shop.verified })}
                      className={`px-3 py-1 text-xs rounded-lg font-medium transition ${shop.verified ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-violet-600 text-white hover:bg-violet-700'}`}
                    >
                      {shop.verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Products */}
      {activeTab === 'products' && (
        <div>
          {/* Add product form */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 mb-6">
            <h3 className="font-semibold text-slate-900 mb-4 text-sm">Add Product</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Shop</label>
                <select
                  value={productForm.shopId}
                  onChange={e => setProductForm(f => ({ ...f, shopId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <option value="">Select shop...</option>
                  {data.approvedShops.map((shop: any) => (
                    <option key={shop.id} value={shop.id}>{shop.name} ({shop.platform})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Product name</label>
                <input
                  type="text"
                  value={productForm.name}
                  onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Product name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Product URL</label>
                <input
                  type="url"
                  value={productForm.productUrl}
                  onChange={e => setProductForm(f => ({ ...f, productUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  value={productForm.imageUrl}
                  onChange={e => setProductForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Price (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.price}
                  onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Original price £ (if on sale)</label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.originalPrice}
                  onChange={e => setProductForm(f => ({ ...f, originalPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.onSale}
                  onChange={e => setProductForm(f => ({ ...f, onSale: e.target.checked }))}
                  className="rounded"
                />
                Mark as on sale
              </label>
              <button
                onClick={async () => {
                  if (!productForm.shopId || !productForm.name || !productForm.productUrl) {
                    setMessage('Shop, name and product URL are required.');
                    setMessageType('error');
                    return;
                  }
                  await action({ action: 'add_product', ...productForm });
                  setProductForm({ shopId: '', name: '', price: '', originalPrice: '', imageUrl: '', productUrl: '', onSale: false });
                }}
                className="ml-auto px-4 py-2 bg-violet-600 text-white text-sm rounded-lg font-medium hover:bg-violet-700 transition"
              >
                Add product
              </button>
            </div>
          </div>

          {/* Products list */}
          {data.products.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">No products yet.</p>
          ) : (
            <div className="space-y-2">
              {data.products.map((product: any) => (
                <div key={product.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex-grow min-w-0">
                    <span className="font-medium text-sm text-slate-900">{product.name}</span>
                    <span className="text-xs text-slate-400 ml-2">via {product.shop?.name}</span>
                    {product.price && <span className="text-xs text-slate-500 ml-2">£{product.price}</span>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => action({ action: 'toggle_product_sale', productId: product.id, onSale: !product.on_sale })}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition ${product.on_sale ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {product.on_sale ? 'On sale ✓' : 'Mark sale'}
                    </button>
                    <button
                      onClick={() => action({ action: 'delete_product', productId: product.id })}
                      className="px-2.5 py-1 text-xs rounded-lg font-medium bg-slate-100 text-slate-600 hover:bg-red-100 hover:text-red-700 transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
