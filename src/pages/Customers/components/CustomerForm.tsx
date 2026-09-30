import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

import { customerService } from '@/services/customers';
import type { Customer } from '@/types';
import { useToast } from '@/components/ui/toast';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  customer?: Customer; 
}

export function CustomerForm({ open, onOpenChange, onSuccess, customer }: CustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: customer?.name || '',
      phone: customer?.phone || '',
      alternatePhone: customer?.alternatePhone || '',
      address: customer?.address || '',
      notes: customer?.notes || '',
    }
  });

  useEffect(() => {
    if (open) {
      reset({
        name: customer?.name || '',
        phone: customer?.phone || '',
        alternatePhone: customer?.alternatePhone || '',
        address: customer?.address || '',
        notes: customer?.notes || '',
      });
      setError(null);
    }
  }, [open, customer, reset]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset();
      setError(null);
    }
    onOpenChange(isOpen);
  };

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (customer) {
        await customerService.updateCustomer(customer.id, data);
        toast.success("Customer updated successfully.");
      } else {
        await customerService.createCustomer(data);
        toast.success("Customer added successfully.");
      }
      reset();
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-all">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button 
            onClick={() => handleOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}
          
          <div className="space-y-1.5">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              id="name" 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              {...register('name')} 
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input 
                id="phone" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                {...register('phone')} 
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="alternatePhone" className="block text-sm font-medium text-gray-700">Alternate Phone</label>
              <input 
                id="alternatePhone" 
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                {...register('alternatePhone')} 
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
            <input 
              id="address" 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              {...register('address')} 
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
            <input 
              id="notes" 
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
              {...register('notes')} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-100">
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
