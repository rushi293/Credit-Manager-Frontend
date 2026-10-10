import { useState } from 'react';
import { dailyBillService } from '@/services/dailyBills';
import type { DailyBill, DailyBillStatus, DailyPaymentMethod } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface UnifiedPaymentSelectorProps {
  bill: DailyBill;
  onSuccess: () => void;
}

export function UnifiedPaymentSelector({ bill, onSuccess }: UnifiedPaymentSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    let newStatus: DailyBillStatus = 'UNPAID';
    let newMethod: DailyPaymentMethod | null = null;

    if (val === 'UNPAID' || val === 'CREDIT_BILL') {
      newStatus = val as DailyBillStatus;
    } else if (val.startsWith('PAID_')) {
      newStatus = 'PAID';
      newMethod = val.split('_')[1] as DailyPaymentMethod;
    }

    setIsUpdating(true);
    try {
      await dailyBillService.updateDailyBill(bill.id, {
        status: newStatus,
        paymentMethod: newMethod
      } as any);

      toast.success('Payment updated successfully');
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.error || 'Failed to update payment');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentValue = bill.status === 'PAID' && bill.paymentMethod 
    ? `PAID_${bill.paymentMethod}` 
    : bill.status;

  const getSelectStyle = () => {
    if (bill.status === 'PAID') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (bill.status === 'CREDIT_BILL') return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  return (
    <div className="flex items-center justify-center gap-1">
      <select
        value={currentValue}
        onChange={handleChange}
        disabled={isUpdating}
        className={`w-[100px] text-[11px] leading-tight font-semibold rounded-md shadow-sm py-1 px-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer border ${getSelectStyle()}`}
      >
        <option value="UNPAID">UNPAID</option>
        <option value="PAID_Cash">PAID - Cash</option>
        <option value="PAID_GPay">PAID - GPay</option>
        <option value="CREDIT_BILL">CREDIT BILL</option>
      </select>
      {isUpdating && <Loader2 className="h-3 w-3 animate-spin text-indigo-600 shrink-0" />}
    </div>
  );
}