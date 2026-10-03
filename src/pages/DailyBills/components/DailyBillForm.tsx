import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Search } from 'lucide-react';
import { dailyBillService } from '@/services/dailyBills';
import { customerService } from '@/services/customers';
import type { Customer, DailyBill } from '@/types';
import { useToast } from '@/components/ui/toast';

const dailyBillSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  billNumber: z.string().min(1, 'Bill number is required'),
  billAmount: z.number().positive('Amount must be greater than zero'),
  status: z.enum(['PAID', 'UNPAID', 'CREDIT_BILL']),
  paymentMethod: z.string().optional().nullable(),
  billDate: z.string().min(1, 'Bill date is required'),
}).refine(data => {
  if (data.status === 'PAID' && (!data.paymentMethod || data.paymentMethod === '')) {
    return false;
  }
  return true;
}, {
  message: "Payment method is required for PAID bills",
  path: ["paymentMethod"]
});

type DailyBillFormValues = z.infer<typeof dailyBillSchema>;

interface DailyBillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: DailyBill;
  defaultDate?: string;
}

export function DailyBillForm({ open, onOpenChange, onSuccess, initialData, defaultDate }: DailyBillFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Custom searchable dropdown state
  const [search, setSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DailyBillFormValues>({
    resolver: zodResolver(dailyBillSchema),
    defaultValues: {
      customerId: '',
      billNumber: '',
      billAmount: undefined,
      status: 'UNPAID',
      paymentMethod: '',
      billDate: defaultDate || new Date().toISOString().slice(0, 10),
    }
  });

  const watchStatus = watch('status');
  const watchCustomerId = watch('customerId');

  useEffect(() => {
    if (open) {
      loadCustomers();
      if (initialData) {
        setValue('customerId', initialData.customerId || '');
        setValue('billNumber', initialData.billNumber || '');
        setValue('billAmount', Number(initialData.billAmount) || undefined as any);
        setValue('status', initialData.status || 'UNPAID');
        setValue('paymentMethod', initialData.paymentMethod || '');
        setValue('billDate', initialData.billDate ? new Date(initialData.billDate).toISOString().slice(0, 10) : (defaultDate || new Date().toISOString().slice(0, 10)));
      } else {
        reset({
          customerId: '',
          billNumber: '',
          billAmount: undefined,
          status: 'UNPAID',
          paymentMethod: '',
          billDate: defaultDate || new Date().toISOString().slice(0, 10),
        });
        setSearch('');
      }
    }
  }, [open, initialData, setValue, reset, defaultDate]);

  useEffect(() => {
    // Update search input text if customer is selected programmatically
    if (watchCustomerId && customers.length > 0) {
      const selected = customers.find(c => c.id === watchCustomerId);
      if (selected && search !== selected.name) {
        setSearch(selected.name);
      }
    }
  }, [watchCustomerId, customers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: DailyBillFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        billDate: new Date(data.billDate).toISOString(),
        paymentMethod: (data.paymentMethod === '' ? null : data.paymentMethod) as any
      };
      
      if (initialData?.id) {
        await dailyBillService.updateDailyBill(initialData.id, payload);
        toast.success('Daily bill updated successfully.');
      } else {
        await dailyBillService.createDailyBill(payload);
        toast.success('Daily bill created successfully.');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity" 
        onClick={() => onOpenChange(false)}
      />
      
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">
            {initialData ? 'Edit Daily Bill' : 'Add Daily Bill'}
          </h2>
          <button 
            onClick={() => onOpenChange(false)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="px-6 py-3 bg-red-50 border-b border-red-100 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          <div className="space-y-1.5" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              Customer Shop Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setIsDropdownOpen(true);
                  if (watchCustomerId) setValue('customerId', ''); // clear selection if they type
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
                  {loadingCustomers ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Loading...</div>
                  ) : filteredCustomers.length > 0 ? (
                    filteredCustomers.map(c => (
                      <div
                        key={c.id}
                        className="px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                        onClick={() => {
                          setValue('customerId', c.id, { shouldValidate: true });
                          setSearch(c.name);
                          setIsDropdownOpen(false);
                        }}
                      >
                        {c.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">No customers found.</div>
                  )}
                </div>
              )}
            </div>
            {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700">
                Bill Number <span className="text-red-500">*</span>
              </label>
              <input 
                id="billNumber" 
                placeholder="Ex: 1021" 
                {...register('billNumber')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              />
              {errors.billNumber && <p className="text-xs text-red-500">{errors.billNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="billDate" className="block text-sm font-medium text-gray-700">
                Bill Date <span className="text-red-500">*</span>
              </label>
              <input 
                id="billDate" 
                type="date"
                {...register('billDate')}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              />
              {errors.billDate && <p className="text-xs text-red-500">{errors.billDate.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="billAmount" className="block text-sm font-medium text-gray-700">
              Bill Amount <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">₹</span>
              </div>
              <input 
                id="billAmount" 
                type="number" 
                step="0.01"
                placeholder="0.00"
                {...register('billAmount', { valueAsNumber: true })}
                className="w-full pl-7 pr-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              />
            </div>
            {errors.billAmount && <p className="text-xs text-red-500">{errors.billAmount.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Payment Status <span className="text-red-500">*</span>
            </label>
            <select 
              id="status" 
              {...register('status')}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
            >
              <option value="UNPAID">UNPAID</option>
              <option value="PAID">PAID</option>
              <option value="CREDIT_BILL">CREDIT BILL</option>
            </select>
          </div>

          {watchStatus === 'PAID' && (
            <div className="space-y-1.5">
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="GPay" {...register('paymentMethod')} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">GPay</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" value="Cash" {...register('paymentMethod')} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4" />
                  <span className="text-sm font-medium text-gray-700">Cash</span>
                </label>
              </div>
              {errors.paymentMethod && <p className="text-xs text-red-500">{errors.paymentMethod.message}</p>}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Save Daily Bill'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
