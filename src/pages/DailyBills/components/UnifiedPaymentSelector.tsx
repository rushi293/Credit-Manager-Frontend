import { useState } from 'react';
import { dailyBillService } from '@/services/dailyBills';
import type { DailyBill, DailyBillStatus, DailyPaymentMethod } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Loader2, X, ChevronDown } from 'lucide-react';

interface UnifiedPaymentSelectorProps {
  bill: DailyBill;
  onSuccess: () => void;
}

export function UnifiedPaymentSelector({ bill, onSuccess }: UnifiedPaymentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleSelect = async (newStatus: DailyBillStatus, newMethod: DailyPaymentMethod | null) => {
    setIsUpdating(true);
    try {
      await dailyBillService.updateDailyBill(bill.id, {
        status: newStatus,
        paymentMethod: newMethod
      } as any);

      toast.success('Payment updated successfully');
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update payment');
    } finally {
      setIsUpdating(false);
    }
  };

  const getSelectStyle = () => {
    if (bill.status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (bill.status === 'CREDIT_BILL') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  const getDisplayText = () => {
    if (bill.status === 'UNPAID') return 'UNPAID';
    if (bill.status === 'CREDIT_BILL') return 'CREDIT BILL';
    if (bill.status === 'PAID' && bill.paymentMethod) return `PAID - ${bill.paymentMethod}`;
    return 'PAID';
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-between w-[120px] text-[11px] leading-tight font-semibold rounded-md shadow-sm py-1.5 px-2 transition-all border ${getSelectStyle()}`}
      >
        <span className="truncate">{getDisplayText()}</span>
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" 
            onClick={() => !isUpdating && setIsOpen(false)}
          />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xs overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-sm font-semibold text-gray-900">Update Payment</h3>
              <button 
                onClick={() => !isUpdating && setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-2 space-y-1 relative">
              {isUpdating && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-b-xl">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                </div>
              )}
              
              <button
                onClick={() => handleSelect('UNPAID', null)}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  bill.status === 'UNPAID' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-2"></span>
                UNPAID
              </button>
              
              <button
                onClick={() => handleSelect('PAID', 'Cash')}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  bill.status === 'PAID' && bill.paymentMethod === 'Cash' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                PAID - Cash
              </button>

              <button
                onClick={() => handleSelect('PAID', 'GPay')}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  bill.status === 'PAID' && bill.paymentMethod === 'GPay' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>
                PAID - GPay
              </button>

              <button
                onClick={() => handleSelect('CREDIT_BILL', null)}
                className={`w-full text-left px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  bill.status === 'CREDIT_BILL' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
                CREDIT BILL
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}