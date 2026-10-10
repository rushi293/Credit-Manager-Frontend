import { useState, useEffect } from 'react';
import { useAppEvent } from '@/hooks/useAppEvent';
import { 
  Plus, Calendar as CalendarIcon, Upload,
  Edit2, Trash2, 
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { dailyBillService } from '@/services/dailyBills';
import type { DailyBill } from '@/types';
import { DailyBillForm } from './components/DailyBillForm';
import { PdfImportModal } from './components/PdfImportModal';
import { DailyPaidBills } from './components/DailyPaidBills';
import { DailyBillsReport } from './components/DailyBillsReport';
import { DailyCreditBills } from './components/DailyCreditBills';
import { DailyUnpaidBills } from './components/DailyUnpaidBills';
import { UnifiedPaymentSelector } from './components/UnifiedPaymentSelector';

export default function DailyBillsPage() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [bills, setBills] = useState<DailyBill[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'ALL' | 'PAID' | 'CREDIT_BILL' | 'UNPAID' | 'REPORT'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<DailyBill | undefined>();
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<DailyBill | null>(null);

  const toast = useToast();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const data = await dailyBillService.getDailyBills(selectedDate);
      setBills(data);
    } catch (error) {
      console.error('Failed to fetch daily bills', error);
      toast.error('Failed to load daily bills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, [selectedDate]);

  useAppEvent(
    ['DAILY_BILL_CREATED', 'DAILY_BILL_UPDATED', 'DAILY_BILL_DELETED', 'RECONNECTED'],
    () => {
      dailyBillService.clearCache();
      fetchBills();
    }
  );

  const handleDelete = async () => {
    if (!billToDelete) return;
    try {
      await dailyBillService.deleteDailyBill(billToDelete.id);
      toast.success('Daily bill deleted successfully');
      setIsDeleteDialogOpen(false);
      setBillToDelete(null);
      // fetchBills is handled by SSE
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to delete daily bill');
    }
  };

  const totalAmount = bills.reduce((sum, b) => sum + Number(b.billAmount), 0);
  const paidCount = bills.filter(b => b.status === 'PAID').length;
  const unpaidCount = bills.filter(b => b.status === 'UNPAID').length;

  const filteredBills = bills.filter(b => statusFilter === 'ALL' ? true : b.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daily Bills</h1>
          <p className="text-sm text-gray-500 mt-1">Manage daily sales bills separately from credit accounts.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-auto">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <button 
            onClick={() => setIsPdfImportOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import PDF
          </button>
          <button 
            onClick={() => { setEditingBill(undefined); setIsFormOpen(true); }}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Daily Bill
          </button>
        </div>
      </div>

      <div className="flex overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 hide-scrollbar">
        <div className="flex space-x-2 border-b border-gray-200 min-w-full">
          <button
            onClick={() => setActiveTab('ALL')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
              activeTab === 'ALL'
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            All Daily Bills
          </button>
          <button
            onClick={() => setActiveTab('PAID')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
              activeTab === 'PAID'
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Daily Paid Bills
          </button>
          <button
            onClick={() => setActiveTab('CREDIT_BILL')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
              activeTab === 'CREDIT_BILL'
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Daily Credit Bills
          </button>
          <button
            onClick={() => setActiveTab('UNPAID')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
              activeTab === 'UNPAID'
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Daily Unpaid Bills
          </button>
          <button
            onClick={() => setActiveTab('REPORT')}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
              activeTab === 'REPORT'
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            Report
          </button>
        </div>
      </div>

      {activeTab === 'ALL' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500 font-medium">Total Bills</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{filteredBills.length}</p>
            </div>
            <div className="bg-indigo-50 p-4 rounded-xl shadow-sm border border-indigo-100">
              <p className="text-sm text-indigo-600 font-medium">Total Bill Amount</p>
              <p className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl shadow-sm border border-emerald-100">
              <p className="text-sm text-emerald-600 font-medium">Paid Bills</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{paidCount}</p>
            </div>
            <div className="bg-rose-50 p-4 rounded-xl shadow-sm border border-rose-100">
              <p className="text-sm text-rose-600 font-medium">Unpaid Bills</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{unpaidCount}</p>
            </div>
          </div>

          <div className="flex justify-end">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              <option value="ALL">All Statuses</option>
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
              <option value="CREDIT_BILL">Credit Bill</option>
            </select>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 font-medium">Bill No.</th>
                    <th className="px-6 py-3 font-medium">Customer Shop</th>
                    <th className="px-6 py-3 font-medium text-right">Amount</th>
                    <th className="px-6 py-3 font-medium text-center">Payment</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                  ) : filteredBills.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No daily bills found for {formatDate(selectedDate)}</td></tr>
                  ) : (
                    filteredBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{bill.billNumber}</td>
                        <td className="px-6 py-4 text-gray-600">{bill.customer?.name}</td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">{formatCurrency(Number(bill.billAmount))}</td>
                        <td className="px-6 py-4 text-center">
                          <UnifiedPaymentSelector bill={bill} onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingBill(bill); setIsFormOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setBillToDelete(bill); setIsDeleteDialogOpen(true); }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-gray-100">
              {loading ? (
                <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
              ) : filteredBills.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No daily bills found for {formatDate(selectedDate)}</div>
              ) : (
                filteredBills.map(bill => (
                  <div key={bill.id} className="p-4 bg-white space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">{bill.customer?.name}</p>
                        <p className="text-sm text-gray-500">Bill: {bill.billNumber}</p>
                      </div>
                      <p className="font-bold text-gray-900">{formatCurrency(Number(bill.billAmount))}</p>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3 text-sm">
                          <UnifiedPaymentSelector bill={bill} onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }} />
                        </div>
                        <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setEditingBill(bill); setIsFormOpen(true); }}
                          className="p-2 text-indigo-600 bg-indigo-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setBillToDelete(bill); setIsDeleteDialogOpen(true); }}
                          className="p-2 text-red-600 bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'PAID' && (
        <DailyPaidBills bills={bills} onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }} />
      )}

      {activeTab === 'CREDIT_BILL' && (
        <DailyCreditBills bills={bills} onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }} />
      )}

      {activeTab === 'UNPAID' && (
        <DailyUnpaidBills bills={bills} onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }} />
      )}

      {activeTab === 'REPORT' && (
        <DailyBillsReport bills={bills} selectedDate={selectedDate} />
      )}

      <DailyBillForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen}
        initialData={editingBill}
        defaultDate={selectedDate}
        onSuccess={() => { dailyBillService.clearCache(); fetchBills(); }}
      />

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        title="Delete this daily bill?"
        description="Are you sure you want to delete this daily bill? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
        danger={true}
      />

      <PdfImportModal
        isOpen={isPdfImportOpen}
        onClose={() => setIsPdfImportOpen(false)}
        onSuccess={() => {
          setIsPdfImportOpen(false);
          fetchBills(); // Refetch bills for selected date
        }}
      />
    </div>
  );
}










