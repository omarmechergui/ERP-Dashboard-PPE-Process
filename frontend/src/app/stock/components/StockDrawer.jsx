import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Package, MapPin, Building2, CreditCard, Activity, BarChart2, History } from "lucide-react";
import { formatCurrency, formatQuantity, formatDate } from "../utils/stockFormatters";
import { StockStatusBadge } from "./StockStatusBadge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useStockHistory } from "../hooks/useStockHistory";
import { useStockConsumption } from "../hooks/useStockConsumption";

export const StockDrawer = ({ article, isOpen, onClose }) => {
  const { data: history, loading: historyLoading, error: historyError } = useStockHistory(isOpen ? article?.id : null);
  const { data: consumption, loading: consumptionLoading, error: consumptionError, period, setPeriod } = useStockConsumption(isOpen ? article?.id : null);

  if (!isOpen || !article) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col border-l border-slate-200"
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 p-2.5 rounded-xl">
                <Package className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{article.nom_article}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span className="font-mono">{article.id}</span>
                  <span>•</span>
                  <StockStatusBadge article={article} />
                </div>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-8 flex-1">
            {/* Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Available</p>
                <p className="text-xl font-bold text-slate-900">{formatQuantity(article.quantite, article.id)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Reserved</p>
                <p className="text-xl font-bold text-slate-900">{formatQuantity(article.quantite_reservee, article.id)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Unit Price</p>
                <p className="text-xl font-bold text-slate-900">{formatCurrency(article.prix)}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 font-medium mb-1">Total Value</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(article.prix * ((article.quantite || 0) + (article.quantite_reservee || 0)))}</p>
              </div>
            </div>

            {/* Details Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-400" />
                Master Data
              </h3>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="flex px-4 py-3">
                  <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <Building2 className="h-4 w-4" /> Supplier
                  </div>
                  <div className="w-2/3 text-sm text-slate-900 font-medium">{article.fournisseur?.nom || "-"}</div>
                </div>
                <div className="flex px-4 py-3">
                  <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <MapPin className="h-4 w-4" /> Location
                  </div>
                  <div className="w-2/3 text-sm text-slate-900 font-mono">{article.address || "N/A"}</div>
                </div>
                <div className="flex px-4 py-3">
                  <div className="w-1/3 flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <CreditCard className="h-4 w-4" /> Min Stock Rule
                  </div>
                  <div className="w-2/3 text-sm text-slate-900">{article.min_stock || 10} units</div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-slate-400" />
                  Consumption Trend
                </h3>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  {['7d', '30d', '180d'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                        period === p 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p === '180d' ? '6m' : p}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 h-64 relative">
                {consumptionLoading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-sm rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                  </div>
                )}
                {consumptionError && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white rounded-xl">
                    <p className="text-sm text-rose-500 font-medium">{consumptionError}</p>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={consumption}>
                    <defs>
                      <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="consumption" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCons)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* History Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Recent Movements
              </h3>
              
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : historyError ? (
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                  <p className="text-sm text-rose-500 font-medium">{historyError}</p>
                </div>
              ) : history.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium">No recent movements</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-100 space-y-6">
                  {history.map((item, idx) => (
                    <div key={idx} className="relative">
                      <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-4 border-white ${
                        item.action === 'Entry' ? 'bg-emerald-500' :
                        item.action === 'Exit' ? 'bg-rose-500' :
                        'bg-blue-500'
                      }`} />
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-slate-900">{item.action}</h4>
                          <span className="text-xs text-slate-400">{formatDate(item.date)}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-semibold text-slate-900">{item.quantity} units</span> • {item.reason}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          By {item.user} ({item.id})
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
