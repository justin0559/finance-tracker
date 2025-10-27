import { useAuth } from '../contexts/AuthContext';
import { PayCycleSetup } from './PayCycleSetup';
import { BillManager } from './BillManager';
import { PayCycleTracker } from './PayCycleTracker';
import { LogOut } from 'lucide-react';

export function Dashboard() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Finance Tracker</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <PayCycleSetup />
          <BillManager />
        </div>

        <PayCycleTracker />
      </main>
    </div>
  );
}
