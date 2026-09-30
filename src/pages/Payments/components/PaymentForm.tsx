import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

import { paymentService } from '@/services/payments';
import { customerService } from '@/services/customers';
import { billService } from '@/services/bills';
import type { Customer, CreditBill } from '@/types';
import { formatCurrency } from '@/lib/format';
import { useToast } from '@/components/ui/toast';


const paymentSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  creditBillId: z.string().min(1, 'Please select a bill'),
  amount: z.number().positive('Amount must be greater than zero'),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER']),
  paymentDate: z.string().min(1, 'Payment date is required'),
  notes: z.string().optional(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultBillId?: string; // If instantiated from a Bill details page
  defaultCustomerId?: string; // If instantiated from a Customer details page
}

export function PaymentForm({ open, onOpenChange, onSuccess, defaultBillId, defaultCustomerId }: PaymentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<CreditBill[]>([]);
  
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [loadingBills, setLoadingBills] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId: defaultCustomerId || '',
      creditBillId: defaultBillId || '',
      amount: undefined,
      paymentMethod: 'CASH',
      paymentDate: new Date().toISOString().slice(0, 10),
      notes: '',
    }
  });

  const selectedCustomerId = watch('customerId');
  const selectedBillId = watch('creditBillId');
  const currentAmount = watch('amount') || 0;

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (selectedCustomerId) {
      loadBills(selectedCustomerId);
    } else {
      setBills([]);
      setValue('creditBillId', '');
    }
  }, [selectedCustomerId, setValue]);

  useEffect(() => {
    if (open && defaultCustomerId && defaultBillId) {
      setValue('customerId', defaultCustomerId);
      setValue('creditBillId', defaultBillId);
    }
  }, [open, defaultCustomerId, defaultBillId, setValue]);

  const loadCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const data = await customerService.getCustomers();
      if (data) setCustomers(data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadBills = async (customerId: string) => {
    setLoadingBills(true);
    try {
      const data = await billService.getBills(customerId);
      if (data) {
        setBills(data.filter(b => b.status !== 'PAID'));
      }
    } catch (err) {
      console.error('Failed to fetch bills', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: PaymentFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        paymentDate: new Date(data.paymentDate).toISOString(),
      };

      await paymentService.createPayment(payload);
      toast.success("Payment recorded successfully.");
      reset();
      onSuccess();
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to record payment. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedBill = bills.find(b => b.id === selectedBillId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <h2 className="text-lg font-semibold text-gray-900">Record Payment</h2>
          <button 
            type="button"
            onClick={() => handleOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col overflow-hidden min-h-0">
          <div className="p-6 space-y-5 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="customerId"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm disabled:opacity-50 disabled:bg-gray-50"
                {...register('customerId')}
                disabled={loadingCustomers || !!defaultCustomerId}
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="creditBillId" className="block text-sm font-medium text-gray-700">
                Credit Bill <span className="text-red-500">*</span>
              </label>
              <select
                id="creditBillId"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm disabled:opacity-50 disabled:bg-gray-50"
                {...register('creditBillId')}
                disabled={!selectedCustomerId || loadingBills || !!defaultBillId}
              >
                <option value="">Select an unpaid bill</option>
                {bills.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.billNumber} (Remaining: {formatCurrency(b.remainingAmount)})
                  </option>
                ))}
              </select>
              {errors.creditBillId && <p className="text-xs text-red-500">{errors.creditBillId.message}</p>}
            </div>

            {selectedBill && (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bill Amount:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(selectedBill.totalAmount)}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Already Paid:</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(selectedBill.totalPaid)}</span>
                 </div>
                 <div className="flex justify-between text-sm border-t border-gray-200 pt-3">
                    <span className="font-medium text-gray-700">Remaining to Pay:</span>
                    <span className="font-bold text-red-600">{formatCurrency(selectedBill.remainingAmount)}</span>
                 </div>
                 {currentAmount > 0 && (
                   <div className="flex justify-between text-sm bg-indigo-50/50 p-2 rounded-lg mt-2 border border-indigo-100">
                      <span className="text-indigo-800">After this payment:</span>
                      <span className="font-bold text-indigo-700">
                        {formatCurrency(Math.max(0, Number(selectedBill.remainingAmount) - currentAmount))}
                      </span>
                   </div>
                 )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input 
                  id="amount" 
                  type="number" 
                  step="0.01" 
                  max={selectedBill ? Number(selectedBill.remainingAmount) : undefined}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('amount', { valueAsNumber: true })} 
                />
                {errors.amount && <p className="text-xs text-red-500">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                  Method <span className="text-red-500">*</span>
                </label>
                <select
                  id="paymentMethod"
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('paymentMethod')}
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="OTHER">Other</option>
                </select>
                {errors.paymentMethod && <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">
                  Date <span className="text-red-500">*</span>
                </label>
                <input 
                  id="paymentDate" 
                  type="date" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('paymentDate')} 
                />
                {errors.paymentDate && <p className="text-xs text-red-500">{errors.paymentDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Reference / Notes</label>
                <input 
                  id="notes" 
                  placeholder="Txn ID, Check #" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('notes')} 
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50">
            <button 
              type="button" 
              onClick={() => handleOpenChange(false)} 
              disabled={isSubmitting}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || !selectedBillId}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
