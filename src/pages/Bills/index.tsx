import { billService } from '@/services/bills';
import {  useState, useEffect, useMemo  } from 'react';
import { useAppEvent } from '@/hooks/useAppEvent';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Receipt, AlertCircle, RefreshCw, Filter, ChevronRight } from 'lucide-react';


import type { CreditBill, BillStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { BillForm } from './components/BillForm';

function BillStatusBadge({ status }: { status?: BillStatus }) {
  if (!status) return null;
  switch (status) {
    case 'PAID':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">PAID</span>;
    case 'PARTIALLY_PAID':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">PARTIAL</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">OVERDUE</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">UNPAID</span>;
  }
}

export default function BillsPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<CreditBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillStatus | 'ALL'>('ALL');
  const [showArchived, setShowArchived] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchBills = async () => {
    if (bills.length === 0) setLoading(true);
    setError(null);
    try {
      
      const data = await billService.getBills(undefined, showArchived, statusFilter !== 'ALL' ? statusFilter : undefined);
      if (data) {
        setBills(data);
      } else {
        setBills([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load bills.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [showArchived, statusFilter]);

  useAppEvent(
    ['CREDIT_BILL_CREATED', 'CREDIT_BILL_UPDATED', 'CREDIT_BILL_DELETED', 'PAYMENT_CREATED', 'PAYMENT_DELETED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'RECONNECTED'],
    () => {
      fetchBills();
    }
  );

  const filteredBills = useMemo(() => {
    return bills.filter(b => {
      const matchesSearch = 
        b.billNumber.toLowerCase().includes(search.toLowerCase()) || 
        (b.customer?.name && b.customer.name.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bills, search, statusFilter]);

  const handleBillCreated = () => {
    setIsFormOpen(false);
    fetchBills();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Credit Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Track credit sales, payments and outstanding balances.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Create Bill
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search bill # or customer..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              Show Archived Bills
            </label>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
              <select 
                className="w-full sm:w-auto py-2 pl-3 pr-8 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="ALL">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIALLY_PAID">Partially Paid</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
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
                       <div className="h-4 bg-gray-100 rounded w-24"></div>
                       <div className="h-3 bg-gray-100 rounded w-16"></div>
                     </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-20"></div>
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
                onClick={fetchBills} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors inline-flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </button>
            </div>
          ) : filteredBills.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900">No bills found</h3>
              <p className="text-gray-500 text-sm mt-1 max-w-sm">
                {search || statusFilter !== 'ALL' 
                  ? 'Try adjusting your filters or search terms.' 
                  : 'Get started by creating your first credit bill.'}
              </p>
              {!(search || statusFilter !== 'ALL') && (
                <button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Create Bill
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto pb-1">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Bill Ref</th>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Date / Due</th>
                      <th className="px-6 py-4 font-medium text-right">Total Amount</th>
                      <th className="px-6 py-4 font-medium text-right">Balance</th>
                      <th className="px-6 py-4 font-medium text-center">Status</th>
                      <th className="px-6 py-4 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBills.map((bill) => {
                      const isZero = Number(bill.remainingAmount) === 0;
                      return (
                        <tr 
                          key={bill.id} 
                          className="cursor-pointer hover:bg-gray-50 transition-colors group"
                          onClick={() => navigate(`/bills/${bill.id}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-indigo-600">#{bill.billNumber}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{bill.customer?.name || 'Unknown'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">{formatDate(bill.billDate)}</div>
                            {bill.dueDate && <div className="text-gray-500 text-[11px] mt-0.5">Due: {formatDate(bill.dueDate)}</div>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                            {formatCurrency(bill.totalAmount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={cn(
                              "font-semibold",
                              isZero ? "text-gray-400" : "text-gray-900"
                            )}>
                              {formatCurrency(bill.remainingAmount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <BillStatusBadge status={bill.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredBills.map((bill) => (
                  <div 
                    key={bill.id}
                    onClick={() => navigate(`/bills/${bill.id}`)}
                    className="p-4 active:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{bill.customer?.name}</h3>
                        <p className="text-xs font-medium text-indigo-600 mt-0.5">#{bill.billNumber}</p>
                      </div>
                      <BillStatusBadge status={bill.status} />
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div className="text-xs text-gray-500 space-y-0.5">
                        <p>Date: {formatDate(bill.billDate)}</p>
                        {bill.dueDate && <p>Due: {formatDate(bill.dueDate)}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-medium text-gray-500 uppercase">Balance</p>
                        <p className={cn(
                          "font-semibold text-sm",
                          Number(bill.remainingAmount) === 0 ? "text-gray-400" : "text-gray-900"
                        )}>
                          {formatCurrency(bill.remainingAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <BillForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={handleBillCreated} 
      />
    </div>
  );
}
