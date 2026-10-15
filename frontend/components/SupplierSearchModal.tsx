'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/lib/store';
import { api, SupplierSearchResultItem } from '@/lib/api';
import { supplierSearchRequestSchema } from '@/lib/validations';
import { Search, ExternalLink, ShieldCheck, Check, AlertCircle, RefreshCw, X, Tag, Store } from 'lucide-react';

export default function SupplierSearchModal() {
  const {
    supplierModalOpen,
    activeSearchIngredient,
    closeSupplierSearch,
    comparisonItems,
    toggleComparisonItem,
    clearComparison,
  } = useUIStore();

  const [ingredientName, setIngredientName] = useState(activeSearchIngredient || '');
  const [packageQty, setPackageQty] = useState('');
  const [packageUnit, setPackageUnit] = useState('kg');
  const [location, setLocation] = useState('India');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SupplierSearchResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [confirmItem, setConfirmItem] = useState<SupplierSearchResultItem | null>(null);

  // Sync active ingredient when opened
  React.useEffect(() => {
    if (activeSearchIngredient) {
      setIngredientName(activeSearchIngredient);
      handleSearch(activeSearchIngredient);
    }
  }, [activeSearchIngredient]);

  const handleSearch = async (queryName?: string) => {
    const qName = queryName || ingredientName;
    if (!qName.trim()) return;

    setError(null);
    setSaveSuccess(null);
    setLoading(true);

    try {
      const parsed = supplierSearchRequestSchema.parse({
        ingredient_name: qName.trim(),
        package_quantity: packageQty ? parseFloat(packageQty) : undefined,
        package_unit: packageQty ? packageUnit : undefined,
        location: location.trim() || undefined,
      });

      const res = await api.searchSuppliers(parsed);
      if (res.error) {
        setError(res.error);
        setResults([]);
      } else {
        setResults(res.results || []);
        setCached(res.cached || false);
        setRetrievedAt(res.retrieved_at || new Date().toISOString());
      }
    } catch (err: any) {
      setError(err.message || 'Validation or search error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSnapshot = async (item: SupplierSearchResultItem) => {
    setSavingItem(item.title);
    setError(null);
    try {
      await api.savePriceSnapshot({
        ingredient_name: ingredientName,
        source_name: item.source_name,
        product_title: item.title,
        price_numeric: item.price_numeric,
        currency: item.currency || 'INR',
        original_price_text: item.price_text,
        source_url: item.url,
        query_text: `${ingredientName} supplier price`,
      });
      setSaveSuccess(`Recorded price snapshot for "${item.title.slice(0, 30)}..." in Tiger Data!`);
      setConfirmItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save snapshot to Tiger Data');
    } finally {
      setSavingItem(null);
    }
  };

  if (!supplierModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Find Suppliers & Live Market Prices</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Powered by SerpAPI
            </span>
          </div>
          <button
            onClick={closeSupplierSearch}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search controls */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/40">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <div className="md:col-span-5">
              <label className="block text-xs font-medium text-slate-400 mb-1">Ingredient Name</label>
              <input
                type="text"
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                placeholder="e.g. Toor Dal, Basmati Rice"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Package Size</label>
              <input
                type="number"
                step="any"
                value={packageQty}
                onChange={(e) => setPackageQty(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Unit</label>
              <select
                value={packageUnit}
                onChange={(e) => setPackageUnit(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="ml">ml</option>
                <option value="pieces">pieces</option>
              </select>
            </div>
            <div className="md:col-span-3 flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-900/20 text-sm"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Searching...' : 'Search Prices'}
              </button>
            </div>
          </form>

          {/* Feedback messages */}
          {error && (
            <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2 text-xs text-emerald-300">
              <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}
          {cached && (
            <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
              <span>Results served from local cache (retrieved at {retrievedAt ? new Date(retrievedAt).toLocaleTimeString() : 'recently'})</span>
            </div>
          )}
        </div>

        {/* Comparison tray if active */}
        {comparisonItems.length > 0 && (
          <div className="px-6 py-3 bg-indigo-950/40 border-b border-indigo-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300">
                Comparing {comparisonItems.length} selected item{comparisonItems.length > 1 ? 's' : ''}:
              </span>
              <div className="flex gap-2">
                {comparisonItems.map((c, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-indigo-900/60 text-indigo-200 px-2 py-0.5 rounded border border-indigo-700/50 flex items-center gap-1"
                  >
                    {c.source_name}: {c.price_text || (c.price_numeric ? `₹${c.price_numeric}` : 'N/A')}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={clearComparison}
              className="text-xs text-indigo-400 hover:text-indigo-200 underline"
            >
              Clear Comparison
            </button>
          </div>
        )}

        {/* Results list */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-slate-500">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Enter an ingredient name and search to view live supplier offers.</p>
              <p className="text-xs text-slate-600 mt-1">Live market data helps benchmark supplier quotes.</p>
            </div>
          )}

          {results.map((item, idx) => {
            const isCompared = comparisonItems.some((c) => c.url === item.url && c.title === item.title);

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isCompared
                    ? 'bg-indigo-950/20 border-indigo-600/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded-lg bg-slate-800 border border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Tag className="w-5 h-5 text-slate-500" />
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-semibold text-white line-clamp-1">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.source_name}
                      </span>
                      {item.price_text && (
                        <span className="text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded">
                          {item.price_text}
                        </span>
                      )}
                      {item.rating && (
                        <span className="text-xs text-amber-400">★ {item.rating}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  {/* Compare toggle */}
                  <button
                    onClick={() => toggleComparisonItem(item)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition ${
                      isCompared
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {isCompared ? '✓ Selected' : 'Compare'}
                  </button>

                  {/* External link */}
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      title="View supplier offer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Save to Tiger Data button */}
                  <button
                    onClick={() => setConfirmItem(item)}
                    className="text-xs bg-slate-800 hover:bg-emerald-600 text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 transition font-medium"
                  >
                    Save Snapshot
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirmation Modal */}
        {confirmItem && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-emerald-400">Confirm Price Snapshot:</span> Record observed price of{' '}
              <strong className="text-white">{confirmItem.price_text || `₹${confirmItem.price_numeric}`}</strong> from{' '}
              <span className="text-white">{confirmItem.source_name}</span> into Tiger Data hypertable?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-3 py-1 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSnapshot(confirmItem)}
                disabled={savingItem === confirmItem.title}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow"
              >
                {savingItem === confirmItem.title ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Notice */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Supplier prices are benchmarks. Inventory unit costs are not updated without explicit confirmation.</span>
          <span className="text-slate-600">DabbaIQ • Hacktoberfest 2026</span>
        </div>
      </div>
    </div>
  );
}
