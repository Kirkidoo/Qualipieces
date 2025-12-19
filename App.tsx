
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Settings,
  RefreshCw,
  Package,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Database,
  ShoppingBag
} from 'lucide-react';
import { OrchestraItem, AppConfig, SyncStatus, SyncRecord } from './types';
import { OrchestraService } from './services/orchestra';
import { ShopifyService } from './services/shopify';

const DEFAULT_CONFIG: AppConfig = {
  orchestraClientId: import.meta.env.VITE_ORCHESTRA_CLIENT_ID || '',
  orchestraClientSecret: import.meta.env.VITE_ORCHESTRA_CLIENT_SECRET || '',
  orchestraBaseUrl: import.meta.env.VITE_ORCHESTRA_BASE_URL || 'https://erp.ecopak.ca/OrchestraQualipiecesApiTest',
  orchestraIdentityUrl: import.meta.env.VITE_ORCHESTRA_IDENTITY_URL || 'https://erp.ecopak.ca/Identity/connect/token',
  shopifyStoreUrl: import.meta.env.VITE_SHOPIFY_STORE_URL || '',
  shopifyAccessToken: import.meta.env.VITE_SHOPIFY_ACCESS_TOKEN || ''
};

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('app_config');
    const initial = saved ? JSON.parse(saved) : DEFAULT_CONFIG;

    // Migration: Force update from legacy absolute URL to proxy URL
    if (initial.orchestraBaseUrl?.includes('https://erp.ecopak.ca')) {
      initial.orchestraBaseUrl = DEFAULT_CONFIG.orchestraBaseUrl;
    }
    // Migration: Fix incorrect endpoint name in cached config
    if (initial.orchestraBaseUrl?.includes('OrchestraQualipiecesTest')) {
      initial.orchestraBaseUrl = initial.orchestraBaseUrl.replace('OrchestraQualipiecesTest', 'OrchestraQualipiecesApiTest');
    }
    if (initial.orchestraIdentityUrl?.includes('https://erp.ecopak.ca')) {
      initial.orchestraIdentityUrl = DEFAULT_CONFIG.orchestraIdentityUrl;
    }

    return initial;
  });

  const [showSettings, setShowSettings] = useState(!config.orchestraClientId);
  const [items, setItems] = useState<OrchestraItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    localStorage.setItem('app_config', JSON.stringify(config));
  }, [config]);

  const orchestra = useMemo(() => new OrchestraService(config), [config]);
  const shopify = useMemo(() => new ShopifyService(config), [config]);

  const loadItems = useCallback(async () => {
    if (!config.orchestraClientId || !config.orchestraClientSecret) return;
    setLoading(true);
    try {
      const filter = searchQuery ? `description=*${searchQuery}` : undefined;
      const data = await orchestra.fetchItems({ filter, pageSize: 50 });
      setItems(data);
    } catch (err: any) {
      alert(`Error fetching items: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [orchestra, searchQuery, config.orchestraClientId, config.orchestraClientSecret]);

  const toggleSelection = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleSync = async () => {
    if (selectedIds.size === 0) return;
    setIsSyncing(true);
    const toSync = items.filter(i => selectedIds.has(i.id));

    for (const item of toSync) {
      setSyncLogs(prev => [{
        itemId: item.id,
        itemNumber: item.itemNumber,
        status: SyncStatus.PENDING
      }, ...prev]);

      try {
        const result = await shopify.createProduct(item);

        setSyncLogs(prev => prev.map(log =>
          log.itemId === item.id
            ? { ...log, status: SyncStatus.SUCCESS, shopifyProductId: result.product.id }
            : log
        ));
      } catch (err: any) {
        setSyncLogs(prev => prev.map(log =>
          log.itemId === item.id
            ? { ...log, status: SyncStatus.ERROR, message: err.message }
            : log
        ));
      }
    }
    setIsSyncing(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <RefreshCw size={24} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">Orchestra Sync</h1>
              <p className="text-xs text-slate-500 font-medium">ERP TO SHOPIFY BRIDGE</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
            >
              <Settings size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Items List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <h2 className="font-semibold flex items-center gap-2">
                <Database size={18} className="text-slate-400" />
                Orchestra ERP Items
              </h2>
              <div className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadItems()}
                />
              </div>
              <button
                onClick={loadItems}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(new Set(items.map(i => i.id)));
                          else setSelectedIds(new Set());
                        }}
                      />
                    </th>
                    <th className="px-4 py-3">Product Info</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.length === 0 && !loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 italic">
                        No items found. Connect to Orchestra and search.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-indigo-50/30 transition-colors cursor-pointer ${selectedIds.has(item.id) ? 'bg-indigo-50' : ''}`}
                        onClick={() => toggleSelection(item.id)}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => { }} // Handled by tr click
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 overflow-hidden border border-slate-200">
                              {item.photo ? <img src={item.photo} alt="" className="object-cover w-full h-full" /> : <Package size={20} />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">{item.descriptionEN || item.description}</p>
                              <p className="text-xs text-slate-500 font-mono mt-0.5">{item.itemNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {item.category || '--'}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          ${item.retail.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.stock} {item.unitOfMeasure || 'units'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Sync Queue & Actions */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col gap-4 sticky top-24">
            <h2 className="font-semibold flex items-center gap-2 text-slate-800">
              <ShoppingBag size={18} className="text-indigo-500" />
              Shopify Sync Actions
            </h2>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Selected Items:</span>
                <span className="font-bold text-indigo-600">{selectedIds.size}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Target Store:</span>
                <span className="font-medium truncate max-w-[150px]">{config.shopifyStoreUrl || 'Not configured'}</span>
              </div>
            </div>

            <button
              onClick={handleSync}
              disabled={selectedIds.size === 0 || isSyncing || !config.shopifyAccessToken}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-100"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Syncing to Shopify...
                </>
              ) : (
                <>
                  <ChevronRight size={18} />
                  Sync Selection
                </>
              )}
            </button>

            {/* Sync Activity Logs */}
            <div className="mt-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Recent Activity</h3>
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {syncLogs.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4 italic">No sync activity yet.</p>
                ) : (
                  syncLogs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-slate-100 rounded-lg shadow-sm">
                      {log.status === SyncStatus.PENDING && <Loader2 className="animate-spin text-indigo-500 mt-0.5" size={16} />}
                      {log.status === SyncStatus.SUCCESS && <CheckCircle2 className="text-green-500 mt-0.5" size={16} />}
                      {log.status === SyncStatus.ERROR && <AlertCircle className="text-red-500 mt-0.5" size={16} />}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{log.itemNumber}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {log.status === SyncStatus.PENDING ? 'Preparing data...' :
                            log.status === SyncStatus.SUCCESS ? 'Created successfully' :
                              log.message || 'Unknown error'}
                        </p>
                      </div>

                      {log.shopifyProductId && (
                        <a
                          href={`https://${config.shopifyStoreUrl}/admin/products/${log.shopifyProductId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal Overlay */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-xl flex items-center gap-2">
                <Settings className="text-indigo-600" />
                Connection Settings
              </h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600">
                <RefreshCw size={20} className="rotate-45" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Orchestra API (ERP)</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Identity URL</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.orchestraIdentityUrl}
                    onChange={(e) => setConfig({ ...config, orchestraIdentityUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Base Endpoint</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.orchestraBaseUrl}
                    onChange={(e) => setConfig({ ...config, orchestraBaseUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Client ID</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.orchestraClientId}
                    onChange={(e) => setConfig({ ...config, orchestraClientId: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Client Secret</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.orchestraClientSecret}
                    onChange={(e) => setConfig({ ...config, orchestraClientSecret: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Shopify Admin API</h3>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Store URL (e.g. my-shop.myshopify.com)</label>
                  <input
                    type="text"
                    placeholder="mystore.myshopify.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.shopifyStoreUrl}
                    onChange={(e) => setConfig({ ...config, shopifyStoreUrl: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Access Token</label>
                  <input
                    type="password"
                    placeholder="shpat_..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
                    value={config.shopifyAccessToken}
                    onChange={(e) => setConfig({ ...config, shopifyAccessToken: e.target.value })}
                  />
                </div>
                <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 mt-4">
                  <p className="text-xs text-amber-800 leading-relaxed">
                    <strong>Note:</strong> Shopify Admin API requires a <code>X-Shopify-Access-Token</code> header. Ensure your browser extension or proxy allows these cross-origin requests.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => {
                  setShowSettings(false);
                  loadItems();
                }}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Save & Continue
              </button>
            </div>
            <div className="px-6 pb-4 flex justify-center">
              <button
                onClick={() => setConfig(DEFAULT_CONFIG)}
                className="text-xs text-slate-400 hover:text-indigo-600 underline"
              >
                Reset to API Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
