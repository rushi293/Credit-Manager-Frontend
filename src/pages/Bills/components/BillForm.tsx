import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UploadCloud, FileImage, Trash2 } from 'lucide-react';

import { billService } from '@/services/bills';
import { customerService } from '@/services/customers';
import type { Customer } from '@/types';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';

const billSchema = z.object({
  customerId: z.string().min(1, 'Please select a customer'),
  billNumber: z.string().min(1, 'Bill number is required'),
  billDate: z.string().min(1, 'Bill date is required'),
  dueDate: z.string().optional(),
  totalAmount: z.number().positive('Amount must be greater than zero'),
  notes: z.string().optional(),
});

type BillFormValues = z.infer<typeof billSchema>;

interface BillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
  defaultCustomerId?: string;
}

export function BillForm({ open, onOpenChange, onSuccess, initialData, defaultCustomerId }: BillFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { business } = useAuth();
  
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<BillFormValues>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      customerId: '',
      billNumber: '',
      billDate: new Date().toISOString().slice(0, 10),
      dueDate: '',
      totalAmount: undefined,
      notes: '',
    }
  });

  const watchBillDate = watch('billDate');

  useEffect(() => {
    if (open) {
        loadCustomers();
        setSelectedFile(null);
        
        if (initialData) {
          setValue('customerId', initialData.customerId || '');
          setValue('billNumber', initialData.billNumber || '');
          setValue('billDate', initialData.billDate ? new Date(initialData.billDate).toISOString().slice(0, 10) : '');
          setValue('dueDate', initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 10) : '');
          setValue('totalAmount', Number(initialData.totalAmount) || undefined as any);
          setValue('notes', initialData.notes || '');
        } else {
          reset({
            customerId: defaultCustomerId || '',
            billNumber: '',
            billDate: new Date().toISOString().slice(0, 10),
            dueDate: '',
            totalAmount: undefined,
            notes: '',
          });
          // Initial due date calculation when opening form
          if (business?.defaultDuePeriod !== undefined) {
            const bd = new Date();
            bd.setDate(bd.getDate() + business.defaultDuePeriod);
            setValue('dueDate', bd.toISOString().slice(0, 10));
          }
        }
      }
  }, [open, business, setValue, defaultCustomerId]);

  useEffect(() => {
    if (watchBillDate && business?.defaultDuePeriod !== undefined && !dirtyFields.dueDate) {
      const bd = new Date(watchBillDate);
      if (!isNaN(bd.getTime())) {
        bd.setDate(bd.getDate() + business.defaultDuePeriod);
        setValue('dueDate', bd.toISOString().slice(0, 10));
      }
    }
  }, [watchBillDate, business, dirtyFields.dueDate, setValue]);

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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setError(null);
      setSelectedFile(null);
    }
    onOpenChange(isOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.warning("File is too large. Maximum size is 5 MB.");
        e.target.value = '';
        return;
      }
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: BillFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        ...data,
        billDate: new Date(data.billDate).toISOString(),
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
      };

      let billId = '';
      if (initialData) {
        // Exclude billNumber on edit
        const { billNumber, ...updatePayload } = payload;
        const updatedBill = await billService.updateBill(initialData.id, updatePayload as any);
        billId = updatedBill?.id || '';
        toast.success("Bill updated successfully.");
      } else {
        const newBill = await billService.createBill(payload);
        billId = newBill?.id || '';
        toast.success("Bill created successfully.");
      }
      
      if (selectedFile && billId) {
        try {
          await billService.uploadAttachment(billId, selectedFile);
          toast.success("Image uploaded successfully.");
        } catch (uploadErr: any) {
          toast.error(uploadErr?.response?.data?.error || "Image upload failed.");
        }
      }

      reset();
      setSelectedFile(null);
      onSuccess();
    } catch (err: any) {
      if (err?.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError("Failed to " + (initialData ? "update" : "create") + " bill. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-full">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white rounded-t-xl">
          <h2 className="text-lg font-semibold text-gray-900">{initialData ? "Edit Credit Bill" : "Create Credit Bill"}</h2>
          <button 
            type="button"
            onClick={() => handleOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="px-6 py-5 space-y-4 overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label htmlFor="customerId" className="block text-sm font-medium text-gray-700">
                Customer <span className="text-red-500">*</span>
              </label>
              <select
                id="customerId"
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm disabled:opacity-50 disabled:bg-gray-50"
                {...register('customerId')}
                disabled={loadingCustomers}
              >
                <option value="">Select a customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.customerId && <p className="text-xs text-red-500">{errors.customerId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="billNumber" className="block text-sm font-medium text-gray-700">
                  Bill Ref <span className="text-red-500">*</span>
                </label>
                <input 
                  id="billNumber" 
                  placeholder="INV-001" disabled={!!initialData} 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('billNumber')} 
                />
                {errors.billNumber && <p className="text-xs text-red-500">{errors.billNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
                  Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input 
                  id="totalAmount" 
                  type="number" 
                  step="0.01" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('totalAmount', { valueAsNumber: true })} 
                />
                {errors.totalAmount && <p className="text-xs text-red-500">{errors.totalAmount.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="billDate" className="block text-sm font-medium text-gray-700">
                  Bill Date <span className="text-red-500">*</span>
                </label>
                <input 
                  id="billDate" 
                  type="date" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('billDate')} 
                />
                {errors.billDate && <p className="text-xs text-red-500">{errors.billDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
                <input 
                  id="dueDate" 
                  type="date" 
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                  {...register('dueDate')} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
              <input 
                id="notes" 
                placeholder="Optional notes" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                {...register('notes')} 
              />
            </div>

            {/* New Image Upload Section */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-700">Bill Image / Receipt (Optional)</label>
              
              {!selectedFile ? (
                <div 
                  className="mt-1 flex justify-center px-6 pt-4 pb-5 border-2 border-gray-300 border-dashed rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="space-y-1 text-center">
                    <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center">
                      <span className="relative rounded-md font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                        Upload a file
                      </span>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                  </div>
                </div>
              ) : (
                <div className="mt-1 flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <FileImage className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="ml-4 flex-shrink-0 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="px-6 py-5 flex items-center justify-end gap-3 shrink-0 border-t border-gray-100 bg-white rounded-b-xl">
            <button 
              type="button" 
              onClick={() => handleOpenChange(false)} 
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (initialData ? 'Saving...' : 'Creating...') : (initialData ? 'Save Changes' : 'Create Bill')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
