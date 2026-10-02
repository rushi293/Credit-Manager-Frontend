import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, CreditCard, AlertCircle, RefreshCw, Filter } from 'lucide-react';

import { paymentService } from '@/services/payments';
import type { Payment, PaymentMethod } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { PaymentForm } from './components/PaymentForm';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchPayments = async () => {
    if (payments.length === 0) setLoading(true);
    setError(null);
    try {
      const data = await paymentService.getPayments();
      if (data) {
        setPayments(data);
      } else {
        setPayments([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load payments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      const matchesSearch = 
        (p.customer?.name && p.customer.name.toLowerCase().includes(search.toLowerCase())) ||
        (p.creditBill?.billNumber && p.creditBill.billNumber.toLowerCase().includes(search.toLowerCase()));
      const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  const handlePaymentRecorded = () => {
    setIsFormOpen(false);
    fetchPayments();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-1">Record and track payments received against credit bills.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Record Payment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by customer or bill #..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
            <select 
              className="w-full sm:w-auto py-2 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as any)}
            >
              <option value="ALL">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
        
        {/* Content */}
        <div>
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-4">
                     <div className="space-y-2">
                       <div className="h-4 bg-gray-100 rounded w-32"></div>
                       <div className="h-3 bg-gray-100 rounded w-20"></div>
                     </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Failed to load</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchPayments} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors inline-flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </button>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-6 w-6 text-emerald-500" />
              </div>
              <h3 className="text-base font-medium text-gray-900">No payments found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {search || methodFilter !== 'ALL' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'Record your first payment to get started.'}
              </p>
              {!(search || methodFilter !== 'ALL') && (
                <button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Record Payment
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Bill Ref</th>
                      <th className="px-6 py-4 font-medium">Method</th>
                      <th className="px-6 py-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                          {formatDate(payment.paymentDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {payment.customer?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-indigo-600 font-medium">
                          #{payment.creditBill?.billNumber || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-gray-100 text-gray-700 uppercase tracking-wider">
                            {payment.paymentMethod}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-emerald-600 font-bold">
                          +{formatCurrency(payment.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-white">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-gray-900">{payment.customer?.name}</h3>
                        <p className="text-xs font-medium text-indigo-600 mt-0.5">#{payment.creditBill?.billNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600 text-sm">+{formatCurrency(payment.amount)}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs mt-3">
                      <span className="text-gray-500">{formatDate(payment.paymentDate)}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 uppercase tracking-wider">
                        {payment.paymentMethod}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <PaymentForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={handlePaymentRecorded} 
      />
    </div>
  );
}
