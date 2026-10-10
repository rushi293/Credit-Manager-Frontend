import { useState, useRef, useEffect } from 'react';
import { dailyBillService } from '@/services/dailyBills';
import type { DailyBill, DailyBillStatus, DailyPaymentMethod } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Loader2, Circle, CheckCircle2, ChevronDown } from 'lucide-react';

interface PaymentManagementPopoverProps {
  bill: DailyBill;
  onSuccess: () => void;
}

export function PaymentManagementPopover({ bill, onSuccess }: PaymentManagementPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<DailyBillStatus>(bill.status);
  const [method, setMethod] = useState<DailyPaymentMethod | ''>(bill.paymentMethod || '');
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    setStatus(bill.status);
    setMethod(bill.paymentMethod || '');
  }, [bill, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (status === 'PAID' && !method) {
        toast.error('Payment method is required for PAID bills');
        setIsSaving(false);
        return;
      }

      await dailyBillService.updateDailyBill(bill.id, {
        status,
        paymentMethod: method === '' ? null : method
      } as any);

      toast.success('Payment details updated');
      setIsOpen(false);
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update payment details');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = () => {
    if (bill.status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
    if (bill.status === 'CREDIT_BILL') return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
    return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
  };

  const Icon = bill.status === 'PAID' ? CheckCircle2 : Circle;

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium border rounded-md transition-colors w-32 ${getStatusColor()}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="flex-1 text-left truncate">
          {bill.status === 'CREDIT_BILL' ? 'CREDIT' : bill.status}
          {bill.paymentMethod && ` â€¢ ${bill.paymentMethod}`}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 right-0 md:left-1/2 md:-translate-x-1/2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 focus:outline-none">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Manage Payment</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DailyBillStatus)}
                className="w-full text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="UNPAID">UNPAID</option>
                <option value="PAID">PAID</option>
                <option value="CREDIT_BILL">CREDIT BILL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Method</label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as DailyPaymentMethod | '')}
                className="w-full text-sm bg-gray-50 border border-gray-300 text-gray-900 rounded-lg py-1.5 px-2 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                <option value="Cash">Cash</option>
                <option value="GPay">GPay</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
