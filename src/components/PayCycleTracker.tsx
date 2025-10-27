import { useState, useEffect } from 'react';
import { supabase, PayCycle, Bill } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { TrendingUp, Calendar, DollarSign, AlertCircle } from 'lucide-react';

type BillInCycle = Bill & {
  dueDate: Date;
  isPast: boolean;
};

export function PayCycleTracker() {
  const { user } = useAuth();
  const [payCycles, setPayCycles] = useState<PayCycle[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [cycleStart, setCycleStart] = useState<Date>(new Date());
  const [cycleEnd, setCycleEnd] = useState<Date>(new Date());
  const [billsInCycle, setBillsInCycle] = useState<BillInCycle[]>([]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCycleId && bills.length > 0) {
      calculateCycleBills();
    }
  }, [selectedCycleId, cycleStart, bills]);

  const loadData = async () => {
    const [cyclesRes, billsRes] = await Promise.all([
      supabase.from('pay_cycles').select('*').order('created_at', { ascending: false }),
      supabase.from('bills').select('*').eq('is_recurring', true),
    ]);

    if (cyclesRes.data) {
      setPayCycles(cyclesRes.data);
      if (cyclesRes.data.length > 0 && !selectedCycleId) {
        setSelectedCycleId(cyclesRes.data[0].id);
      }
    }

    if (billsRes.data) {
      setBills(billsRes.data);
    }
  };

  const calculateCycleBills = () => {
    const cycle = payCycles.find((c) => c.id === selectedCycleId);
    if (!cycle) return;

    const end = new Date(cycleStart);
    end.setDate(end.getDate() + cycle.frequency_days);
    setCycleEnd(end);

    const billsInRange: BillInCycle[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    bills.forEach((bill) => {
      let currentDueDate = new Date(bill.next_due_date);

      const getFrequencyDays = (bill: Bill): number => {
        switch (bill.frequency_type) {
          case 'weekly':
            return 7;
          case 'fortnightly':
            return 14;
          case 'monthly':
            return 30;
          case 'custom':
            return bill.frequency_days || 30;
          default:
            return 30;
        }
      };

      const frequencyDays = getFrequencyDays(bill);

      while (currentDueDate < cycleStart) {
        currentDueDate = new Date(currentDueDate);
        currentDueDate.setDate(currentDueDate.getDate() + frequencyDays);
      }

      while (currentDueDate < end) {
        if (currentDueDate >= cycleStart) {
          billsInRange.push({
            ...bill,
            dueDate: new Date(currentDueDate),
            isPast: currentDueDate < today,
          });
        }

        currentDueDate = new Date(currentDueDate);
        currentDueDate.setDate(currentDueDate.getDate() + frequencyDays);
      }
    });

    billsInRange.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    setBillsInCycle(billsInRange);
  };

  const handleCycleChange = (cycleId: string) => {
    setSelectedCycleId(cycleId);
    const cycle = payCycles.find((c) => c.id === cycleId);
    if (cycle) {
      const today = new Date();
      const start = new Date(cycle.start_date);

      while (start < today) {
        start.setDate(start.getDate() + cycle.frequency_days);
      }

      start.setDate(start.getDate() - cycle.frequency_days);
      setCycleStart(start);
    }
  };

  const adjustCycle = (direction: 'prev' | 'next') => {
    const cycle = payCycles.find((c) => c.id === selectedCycleId);
    if (!cycle) return;

    const newStart = new Date(cycleStart);
    const adjustment = direction === 'next' ? cycle.frequency_days : -cycle.frequency_days;
    newStart.setDate(newStart.getDate() + adjustment);
    setCycleStart(newStart);
  };

  const totalAmount = billsInCycle.reduce((sum, bill) => sum + bill.amount, 0);
  const paidAmount = billsInCycle
    .filter((bill) => bill.isPast)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const upcomingAmount = totalAmount - paidAmount;

  if (payCycles.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">No Pay Cycle Configured</h3>
        <p className="text-slate-400">
          Set up a pay cycle above to start tracking your bills.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-teal-500/20 p-2 rounded-lg">
          <TrendingUp className="w-5 h-5 text-teal-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Pay Cycle Tracker</h2>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Select Pay Cycle
        </label>
        <select
          value={selectedCycleId}
          onChange={(e) => handleCycleChange(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {payCycles.map((cycle) => (
            <option key={cycle.id} value={cycle.id}>
              {cycle.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => adjustCycle('prev')}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition"
          >
            Previous
          </button>
          <div className="text-center">
            <div className="flex items-center gap-2 justify-center text-white font-medium">
              <Calendar className="w-4 h-4" />
              <span>
                {cycleStart.toLocaleDateString()} - {cycleEnd.toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={() => adjustCycle('next')}
            className="px-3 py-1 bg-slate-600 hover:bg-slate-500 text-white rounded text-sm transition"
          >
            Next
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Total Bills</p>
            <p className="text-xl font-bold text-white">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Past Due</p>
            <p className="text-xl font-bold text-red-400">${paidAmount.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Upcoming</p>
            <p className="text-xl font-bold text-emerald-400">${upcomingAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Bills in This Cycle</h3>
        {billsInCycle.length === 0 ? (
          <p className="text-slate-400 text-center py-6 text-sm">
            No bills scheduled for this pay cycle.
          </p>
        ) : (
          billsInCycle.map((bill) => (
            <div
              key={`${bill.id}-${bill.dueDate.getTime()}`}
              className={`bg-slate-700/50 rounded-lg p-3 border ${
                bill.isPast ? 'border-red-500/30 bg-red-500/5' : 'border-slate-600'
              } flex items-center justify-between`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-2 h-2 rounded-full ${
                    bill.isPast ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                />
                <div>
                  <h4 className="font-medium text-white text-sm">{bill.name}</h4>
                  <p className="text-xs text-slate-400">
                    {bill.dueDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs px-2 py-1 rounded bg-slate-600 text-slate-300 capitalize">
                  {bill.frequency_type}
                </span>
                <span className={`text-sm px-2 py-1 rounded ${bill.isPast ? 'text-red-400 bg-red-500/20' : 'text-emerald-400 bg-emerald-500/20'}`}>
                  {bill.category}
                </span>
                <span className="font-semibold text-white">
                  ${bill.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
