'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/lib/store';
import { api, SupplierSearchResultItem } from '@/lib/api';
import { supplierSearchRequestSchema } from '@/lib/validations';
import { Search, ExternalLink, ShieldCheck, AlertCircle, RefreshCw, X, Tag, Store } from 'lucide-react';

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

  const handleSearch = useCallback(async (queryName?: string) => {
    const qName = queryName || ingredientName;
    if (!qName.trim()) return;

    setError(null);
    setSaveSuccess(null);
    setLoading(true);

    try {
      const parsed = supplierSearchRequestSchema.parse({
        ingredient_name: qName.trim(),
        package_quantity: packageQty ? parseFloat(packageQty) : undefined,
        package_unit: packageUnit || undefined,
        location: location || undefined,
      });

      const res = await api.searchSuppliers(parsed);

      if (res.error) {
        setError(res.error);
      } else {
        setResults(res.results || []);
        setCached(res.cached);
        setRetrievedAt(res.retrieved_at || null);
      }
    } catch (err: any) {
      setError(err.message || 'Error searching wholesale suppliers');
    } finally {
      setLoading(false);
    }
  }, [ingredientName, packageQty, packageUnit, location]);

  useEffect(() => {
    if (activeSearchIngredient) {
      setIngredientName(activeSearchIngredient);
      handleSearch(activeSearchIngredient);
    }
  }, [activeSearchIngredient, handleSearch]);

  const handleSaveSnapshot = async (item: SupplierSearchResultItem) => {
    setSavingItem(item.title);
    setError(null);
    setSaveSuccess(null);

    try {
      const res = await api.savePriceSnapshot({
        ingredient_name: ingredientName.toLowerCase(),
        source_name: item.source_name,
        product_title: item.title,
        price_numeric: item.price_numeric,
        currency: item.currency || 'INR',
        original_price_text: item.price_text,
        source_url: item.url,
      });

      setSaveSuccess(
        `Recorded ₹${item.price_numeric || item.price_text} from ${item.source_name} to Tiger Data hypertable!`
      );
      setConfirmItem(null);
    } catch (err: any) {
      setError(err.message || 'Failed to save price snapshot to Tiger Data');
    } finally {
      setSavingItem(null);
    }
  };

  if (!supplierModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border-2 border-primary/30 rounded-2xl w-full max-w-4xl shadow-[0_8px_0_0_#18542a] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Store className="w-5 h-5 text-tertiary-fixed" />
            <h2 className="font-headline font-bold text-base sm:text-lg text-white">
              Wholesale Market Prices &amp; Supplier Search
            </h2>
            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-tertiary-fixed text-on-tertiary-fixed font-bold">
              SERPAPI LIVE
            </span>
          </div>
          <button
            onClick={closeSupplierSearch}
            className="text-white/80 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search controls */}
        <div className="p-5 border-b border-outline-variant/60 bg-surface-container-low">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="grid grid-cols-1 md:grid-cols-12 gap-3"
          >
            <div className="md:col-span-5">
              <label className="block font-mono text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Raw Ingredient
              </label>
              <input
                type="text"
                value={ingredientName}
                onChange={(e) => setIngredientName(e.target.value)}
                placeholder="e.g. Toor Dal, Basmati Rice, Mustard Seeds"
                className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Wholesale Size
              </label>
              <input
                type="number"
                step="any"
                value={packageQty}
                onChange={(e) => setPackageQty(e.target.value)}
                placeholder="e.g. 25"
                className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-mono text-[11px] font-bold uppercase text-on-surface-variant mb-1">
                Unit
              </label>
              <select
                value={packageUnit}
                onChange={(e) => setPackageUnit(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded-lg px-3 py-2 text-xs font-mono font-bold text-on-surface outline-none focus:border-primary"
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
                className="w-full btn-secondary text-xs font-mono"
              >
                {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>{loading ? 'Searching...' : 'Search Prices'}</span>
              </button>
            </div>
          </form>

          {/* Feedback messages */}
          {error && (
            <div className="mt-3 p-3 bg-error-container border border-error/30 rounded-lg flex items-center gap-2 text-xs font-mono text-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="mt-3 p-3 bg-primary-fixed/40 border border-primary/30 rounded-lg flex items-center gap-2 text-xs font-mono text-primary font-bold">
              <ShieldCheck className="w-4 h-4 shrink-0 text-primary" />
              <span>{saveSuccess}</span>
            </div>
          )}
          {cached && (
            <div className="mt-2 font-mono text-[11px] text-on-surface-variant flex items-center gap-1">
              <span>Results served from local cache (retrieved at {retrievedAt ? new Date(retrievedAt).toLocaleTimeString() : 'recently'})</span>
            </div>
          )}
        </div>

        {/* Comparison tray if active */}
        {comparisonItems.length > 0 && (
          <div className="px-5 py-2.5 bg-tertiary-fixed/30 border-b border-tertiary-fixed/60 flex items-center justify-between font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-on-tertiary-fixed">
                Comparing {comparisonItems.length} supplier offer{comparisonItems.length > 1 ? 's' : ''}:
              </span>
              <div className="flex gap-1.5 flex-wrap">
                {comparisonItems.map((c, idx) => (
                  <span
                    key={idx}
                    className="bg-white text-on-surface px-2 py-0.5 rounded border border-outline-variant/60 font-semibold"
                  >
                    {c.source_name}: {c.price_text || (c.price_numeric ? `₹${c.price_numeric}` : 'N/A')}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={clearComparison}
              className="text-secondary hover:underline font-bold text-xs"
            >
              Clear Comparison
            </button>
          </div>
        )}

        {/* Results list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1 font-body text-xs">
          {results.length === 0 && !loading && (
            <div className="text-center py-12 text-on-surface-variant space-y-2">
              <Store className="w-10 h-10 mx-auto text-outline" />
              <p className="font-semibold text-on-surface">Enter an ingredient name and search to query live wholesale supplier quotes.</p>
              <p className="font-mono text-[11px] text-on-surface-variant">Live market data benchmarks procurement quotes against open suppliers.</p>
            </div>
          )}

          {results.map((item, idx) => {
            const isCompared = comparisonItems.some((c) => c.url === item.url && c.title === item.title);

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isCompared
                    ? 'bg-primary-fixed/20 border-primary shadow-xs'
                    : 'bg-white border-outline-variant hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-12 h-12 object-cover rounded-lg bg-surface-container border border-outline-variant/60 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-container border border-outline-variant/60 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5 text-outline" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <h4 className="font-headline font-bold text-sm text-on-surface line-clamp-1">{item.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[11px]">
                      <span className="font-bold text-primary bg-primary-fixed/30 px-2 py-0.5 rounded border border-primary/20">
                        {item.source_name}
                      </span>
                      {item.price_text && (
                        <span className="font-bold text-on-surface bg-surface-container px-2 py-0.5 rounded">
                          {item.price_text}
                        </span>
                      )}
                      {item.rating && (
                        <span className="text-secondary font-bold">★ {item.rating}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end font-mono">
                  {/* Compare toggle */}
                  <button
                    onClick={() => toggleComparisonItem(item)}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border transition font-bold ${
                      isCompared
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-on-surface border-outline-variant hover:bg-surface-container'
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
                      className="p-1.5 rounded-lg bg-white hover:bg-surface-container text-on-surface border border-outline-variant transition"
                      title="View supplier offer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  {/* Save to Tiger Data button */}
                  <button
                    onClick={() => setConfirmItem(item)}
                    className="btn-surface text-xs font-mono font-bold"
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
          <div className="p-4 bg-surface-container-low border-t border-outline-variant flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
            <div className="text-on-surface">
              <span className="font-bold text-primary">Confirm Price Snapshot: </span> Record observed price of{' '}
              <strong className="text-secondary">{confirmItem.price_text || `₹${confirmItem.price_numeric}`}</strong> from{' '}
              <span className="font-bold text-primary">{confirmItem.source_name}</span> into Tiger Data hypertable?
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmItem(null)}
                className="px-3 py-1 text-xs text-on-surface-variant hover:text-on-surface"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveSnapshot(confirmItem)}
                disabled={savingItem === confirmItem.title}
                className="btn-primary text-xs py-1 px-3 shadow-xs"
              >
                {savingItem === confirmItem.title ? 'Saving...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Notice */}
        <div className="px-5 py-2.5 bg-surface-container-high border-t border-outline-variant/60 font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
          <span>Supplier prices are benchmarks. Inventory unit costs are not updated without explicit chef confirmation.</span>
          <span className="text-primary font-bold">DabbaIQ • Inside the Dabba</span>
        </div>
      </div>
    </div>
  );
}
