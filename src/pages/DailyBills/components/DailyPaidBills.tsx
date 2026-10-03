import { useState, useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import type { DailyBill } from '@/types';
import { CreditCard, Banknote, Filter } from 'lucide-react';

interface DailyPaidBillsProps {
  bills: DailyBill[];
}

export function DailyPaidBills({ bills }: DailyPaidBillsProps) {
  const [filter, setFilter] = useState<'All' | 'GPay' | 'Cash'>('All');

  const paidBills = useMemo(() => bills.filter(b => b.status === 'PAID'), [bills]);
  const filteredBills = useMemo(() => 
    filter === 'All' ? paidBills : paidBills.filter(b => b.paymentMethod === filter)
  , [paidBills, filter]);

  const totalPaid = paidBills.reduce((sum, b) => sum + Number(b.billAmount), 0);
  const totalGPay = paidBills.filter(b => b.paymentMethod === 'GPay').reduce((sum, b) => sum + Number(b.billAmount), 0);
  const totalCash = paidBills.filter(b => b.paymentMethod === 'Cash').reduce((sum, b) => sum + Number(b.billAmount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Paid Bills</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{paidBills.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
          <p className="text-sm text-emerald-600 font-medium">Total Paid Amount</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
          <div className="flex items-center gap-2 text-indigo-600 mb-1">
            <CreditCard className="h-4 w-4" />
            <p className="text-sm font-medium">GPay</p>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{formatCurrency(totalGPay)}</p>
          <p className="text-xs text-indigo-500 mt-1">{paidBills.filter(b => b.paymentMethod === 'GPay').length} bills</p>
        </div>
        <div className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-100">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Banknote className="h-4 w-4" />
            <p className="text-sm font-medium">Cash</p>
          </div>
          <p className="text-2xl font-bold text-amber-700">{formatCurrency(totalCash)}</p>
          <p className="text-xs text-amber-500 mt-1">{paidBills.filter(b => b.paymentMethod === 'Cash').length} bills</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Paid Bills Listing</h3>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="text-sm border-gray-200 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="All">All Methods</option>
              <option value="GPay">GPay Only</option>
              <option value="Cash">Cash Only</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium">Bill No.</th>
                <th className="px-6 py-3 font-medium">Customer Shop</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredBills.length > 0 ? (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{bill.billNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{bill.customer?.name}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(Number(bill.billAmount))}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        bill.paymentMethod === 'GPay' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {bill.paymentMethod}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No paid bills found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
