import { UnifiedPaymentSelector } from './UnifiedPaymentSelector';

import { useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import type { DailyBill } from '@/types';


interface DailyUnpaidBillsProps {
  bills: DailyBill[];
  onSuccess?: () => void;
}

export function DailyUnpaidBills({ bills, onSuccess }: DailyUnpaidBillsProps) {
  const unpaidBills = useMemo(() => bills.filter(b => b.status === 'UNPAID'), [bills]);
  const totalAmount = unpaidBills.reduce((sum, b) => sum + Number(b.billAmount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 font-medium">Total Unpaid Bills</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{unpaidBills.length}</p>
        </div>
        <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100">
          <p className="text-sm text-rose-600 font-medium">Total Unpaid Amount</p>
          <p className="text-2xl font-bold text-rose-700 mt-1">{formatCurrency(totalAmount)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Unpaid Bills Listing</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium">Bill No.</th>
                <th className="px-6 py-3 font-medium">Customer Shop</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-center">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {unpaidBills.length > 0 ? (
                unpaidBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">{bill.billNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{bill.customer?.name}</td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(Number(bill.billAmount))}</td>
                    <td className="px-6 py-4 text-center">
                      <UnifiedPaymentSelector bill={bill} onSuccess={() => { if(onSuccess) onSuccess(); else window.location.reload(); }} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No unpaid bills found for this selection.
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






