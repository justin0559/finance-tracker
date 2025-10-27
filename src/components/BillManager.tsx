import { useState, useEffect } from 'react';
import { supabase, Bill } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Receipt, Plus, Trash2, Edit2, X, Check } from 'lucide-react';

const CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Transportation', 'Subscriptions', 'Loan', 'Other'];

export function BillManager() {
  const { user } = useAuth();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency_type: 'monthly' as 'weekly' | 'fortnightly' | 'monthly' | 'custom',
    frequency_days: null as number | null,
    next_due_date: '',
    due_day: 1,
    category: 'Other',
    is_recurring: true,
  });

  useEffect(() => {
    if (user) {
      loadBills();
    }
  }, [user]);

  const loadBills = async () => {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('next_due_date', { ascending: true });

    if (!error && data) {
      setBills(data);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      frequency_type: 'monthly',
      frequency_days: null,
      next_due_date: '',
      due_day: 1,
      category: 'Other',
      is_recurring: true,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const billData = {
      user_id: user!.id,
      name: formData.name,
      amount: parseFloat(formData.amount),
      frequency_type: formData.frequency_type,
      frequency_days: formData.frequency_type === 'custom' ? formData.frequency_days : null,
      next_due_date: formData.next_due_date,
      due_day: formData.frequency_type === 'monthly' ? formData.due_day : null,
      category: formData.category,
      is_recurring: formData.is_recurring,
    };

    if (editingId) {
      const { error } = await supabase
        .from('bills')
        .update(billData)
        .eq('id', editingId);

      if (!error) {
        resetForm();
        loadBills();
      }
    } else {
      const { error } = await supabase.from('bills').insert([billData]);

      if (!error) {
        resetForm();
        loadBills();
      }
    }

    setLoading(false);
  };

  const handleEdit = (bill: Bill) => {
    setFormData({
      name: bill.name,
      amount: bill.amount.toString(),
      frequency_type: bill.frequency_type,
      frequency_days: bill.frequency_days,
      next_due_date: bill.next_due_date,
      due_day: bill.due_day || 1,
      category: bill.category,
      is_recurring: bill.is_recurring,
    });
    setEditingId(bill.id);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);

    if (!error) {
      loadBills();
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Housing: 'text-orange-400 bg-orange-500/20',
      Utilities: 'text-yellow-400 bg-yellow-500/20',
      Insurance: 'text-blue-400 bg-blue-500/20',
      Transportation: 'text-green-400 bg-green-500/20',
      Subscriptions: 'text-purple-400 bg-purple-500/20',
      Loan: 'text-red-400 bg-red-500/20',
      Other: 'text-slate-400 bg-slate-500/20',
    };
    return colors[category] || colors.Other;
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/20 p-2 rounded-lg">
            <Receipt className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Bills</h2>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Bill
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Bill Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Rent, Electric, Car Insurance"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                placeholder="0.00"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Payment Frequency
              </label>
              <select
                value={formData.frequency_type}
                onChange={(e) => setFormData({ ...formData, frequency_type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="weekly">Weekly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {formData.frequency_type === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Due Day (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.due_day}
                  onChange={(e) => setFormData({ ...formData, due_day: parseInt(e.target.value) })}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {formData.frequency_type === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Frequency (days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.frequency_days || ''}
                  onChange={(e) => setFormData({ ...formData, frequency_days: parseInt(e.target.value) || null })}
                  required
                  placeholder="e.g., 10 for every 10 days"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Next Due Date
              </label>
              <input
                type="date"
                value={formData.next_due_date}
                onChange={(e) => setFormData({ ...formData, next_due_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={formData.is_recurring}
                onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
                className="w-4 h-4 text-emerald-500 bg-slate-700 border-slate-600 rounded focus:ring-emerald-500"
              />
              <label htmlFor="recurring" className="text-sm text-slate-300">
                Recurring bill
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                {loading ? 'Saving...' : editingId ? 'Update Bill' : 'Add Bill'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {bills.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No bills added yet. Add your first bill to track expenses.
          </p>
        ) : (
          bills.map((bill) => (
            <div
              key={bill.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{bill.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getCategoryColor(bill.category)}`}>
                      {bill.category}
                    </span>
                    {!bill.is_recurring && (
                      <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300">
                        One-time
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="font-medium text-emerald-400">
                      ${bill.amount.toFixed(2)}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300 capitalize">
                      {bill.frequency_type}
                    </span>
                    <span>Next: {new Date(bill.next_due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(bill)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition"
                    title="Edit bill"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                    title="Delete bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
