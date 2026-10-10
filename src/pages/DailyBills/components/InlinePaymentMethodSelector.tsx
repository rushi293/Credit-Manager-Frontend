import { useState } from 'react';
import { dailyBillService } from '@/services/dailyBills';
import type { DailyBill } from '@/types';
import { useToast } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';

interface InlinePaymentMethodSelectorProps {
  bill: DailyBill;
  onUpdate: (id: string, newMethod: any) => void;
}

export function InlinePaymentMethodSelector({ bill, onUpdate }: InlinePaymentMethodSelectorProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const toast = useToast();

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value;
    
    setIsUpdating(true);
    try {
      // API call to update the payment method independently
      await dailyBillService.updateDailyBill(bill.id, {
        paymentMethod: newMethod === '' ? null : newMethod
      } as any);
      
      onUpdate(bill.id, newMethod === '' ? null : newMethod as any);
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update payment method.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <select
        value={bill.paymentMethod || ''}
        onChange={handleChange}
        disabled={isUpdating}
        className="w-28 text-sm bg-white border border-gray-300 text-gray-900 font-medium rounded-lg shadow-sm py-1.5 px-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 transition-all cursor-pointer hover:bg-gray-50"
      >
        <option value="">None</option>
        <option value="Cash">Cash ??</option>
        <option value="GPay">GPay ??</option>
      </select>
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />}
    </div>
  );
}
