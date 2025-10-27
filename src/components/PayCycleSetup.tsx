import { useState, useEffect } from 'react';
import { supabase, PayCycle } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Save, Trash2 } from 'lucide-react';

export function PayCycleSetup() {
  const { user } = useAuth();
  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    frequency_days: 14,
  });

  useEffect(() => {
    if (user) {
      loadPayCycles();
    }
  }, [user]);

  const loadPayCycles = async () => {
    const { data, error } = await supabase
      .from('pay_cycles')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayCycles(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('pay_cycles').insert([
      {
        user_id: user!.id,
        ...formData,
      },
    ]);

    if (!error) {
      setFormData({ name: '', start_date: '', frequency_days: 14 });
      setIsCreating(false);
      loadPayCycles();
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('pay_cycles').delete().eq('id', id);

    if (!error) {
      loadPayCycles();
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/20 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Pay Cycles</h2>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition text-sm font-medium"
          >
            Add Pay Cycle
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="mb-6 bg-slate-700/50 rounded-lg p-4 border border-slate-600">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Cycle Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g., Bi-weekly, Monthly"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                required
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Frequency (days)
              </label>
              <select
                value={formData.frequency_days}
                onChange={(e) => setFormData({ ...formData, frequency_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">Weekly (7 days)</option>
                <option value="14">Bi-weekly (14 days)</option>
                <option value="15">Semi-monthly (15 days)</option>
                <option value="30">Monthly (30 days)</option>
                <option value="custom">Custom</option>
              </select>
              {formData.frequency_days === 0 && (
                <input
                  type="number"
                  min="1"
                  placeholder="Enter custom days"
                  onChange={(e) => setFormData({ ...formData, frequency_days: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Cycle'}
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {payCycles.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            No pay cycles configured. Add one to get started.
          </p>
        ) : (
          payCycles.map((cycle) => (
            <div
              key={cycle.id}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 flex items-center justify-between hover:border-slate-500 transition"
            >
              <div>
                <h3 className="font-semibold text-white">{cycle.name}</h3>
                <p className="text-sm text-slate-400">
                  Starts: {new Date(cycle.start_date).toLocaleDateString()} • Every {cycle.frequency_days} days
                </p>
              </div>
              <button
                onClick={() => handleDelete(cycle.id)}
                className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition"
                title="Delete pay cycle"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
