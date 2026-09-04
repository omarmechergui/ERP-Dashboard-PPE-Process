import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Building2 } from "lucide-react";

export const ArticleModal = ({
  isOpen,
  onClose,
  isEdit,
  formData,
  handleInputChange,
  onSubmit,
  error,
  suppliers,
  isAddingSupplier,
  onAddSupplier
}) => {
  const [newSupplierName, setNewSupplierName] = React.useState("");

  if (!isOpen) return null;

  const handleAddSupplierClick = async () => {
    if (!newSupplierName.trim()) return;
    try {
      const newSupplier = await onAddSupplier(newSupplierName);
      if (newSupplier && newSupplier.id) {
        // Automatically select the new supplier
        handleInputChange({ target: { name: 'fournisseur_id', value: newSupplier.id } });
      }
      setNewSupplierName("");
    } catch (e) {
      // Error handled by hook/parent if needed, or logged.
      console.error(e);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          onClick={onClose}
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        >
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-900">
              {isEdit ? "Edit Article Details" : "Create New Article"}
            </h2>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm flex items-start gap-3">
                <X className="h-5 w-5 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form id="article-form" onSubmit={onSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Article ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    required
                    placeholder="e.g. A006"
                    value={formData.id}
                    onChange={handleInputChange}
                    disabled={isEdit}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Name Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Article Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nom_article"
                    required
                    placeholder="e.g. Wire AWG 22 Black"
                    value={formData.nom_article}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Price */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Unit Price (TND) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="prix"
                    step="0.01"
                    min="0"
                    required
                    value={formData.prix}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Quantity */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Current Stock
                  </label>
                  <input
                    type="number"
                    name="quantite"
                    min="0"
                    value={formData.quantite}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Min Stock */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Min Stock
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    min="0"
                    value={formData.min_stock}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Warehouse Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  placeholder="e.g. Rack A-01-B"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                />
              </div>

              {/* Supplier */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Supplier <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-3">
                  <select
                    name="fournisseur_id"
                    required
                    value={formData.fournisseur_id}
                    onChange={handleInputChange}
                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  >
                    <option value="" disabled>Select a supplier</option>
                    {suppliers.map((f) => (
                      <option key={f.id} value={f.id}>{f.nom}</option>
                    ))}
                  </select>
                </div>
                
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Quick add new supplier..."
                    value={newSupplierName}
                    onChange={(e) => setNewSupplierName(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm p-0 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddSupplierClick}
                    disabled={isAddingSupplier || !newSupplierName.trim()}
                    className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-300 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              </div>

            </form>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="article-form"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {isEdit ? "Save Changes" : "Create Article"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
