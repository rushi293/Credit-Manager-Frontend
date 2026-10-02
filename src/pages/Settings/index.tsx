import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Building2, Store } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/context/AuthContext';
import { settingsService } from '@/services/settings';
import AdminCredentials from './components/AdminCredentials';
import NonAdminUserManagement from './components/NonAdminUserManagement';
import UserLoginActivity from './components/UserLoginActivity';

const settingsSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  defaultDuePeriod: z.number().min(0, 'Must be 0 or greater'),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const { business, login, token, user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      defaultDuePeriod: 0,
    }
  });

  useEffect(() => {
    if (business) {
      reset({
        name: business.name || '',
        defaultDuePeriod: business.defaultDuePeriod || 0,
      });
    }
  }, [business, reset]);

  const onSubmit = async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      const updatedBusiness = await settingsService.updateSettings(data);
      if (token && user) {
        // Update the context with the new business settings
        login(token, user, updatedBusiness);
      }
      toast.success('Settings saved successfully.');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your business profile and preferences.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" /> Business Profile
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Update your core business information.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Business Name</label>
                <input 
                  id="name" 
                  {...register('name')}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                />
                {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Default Currency</label>
                <select 
                  id="currency"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg shadow-sm text-gray-500 cursor-not-allowed sm:text-sm"
                  disabled
                >
                  <option value="INR">â‚¹ INR (Indian Rupee)</option>
                </select>
                <p className="text-xs text-gray-500">Currency is fixed for this region.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-gray-400" /> Preferences
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Configure default application behaviors.
            </p>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="defaultDuePeriod" className="block text-sm font-medium text-gray-700">Default Bill Due Period (Days)</label>
                <input 
                  id="defaultDuePeriod" 
                  type="number"
                  {...register('defaultDuePeriod', { valueAsNumber: true })}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors sm:text-sm"
                />
                <p className="text-xs text-gray-500">Number of days from Bill Date until it becomes due. (0 = due immediately)</p>
                {errors.defaultDuePeriod && <p className="text-xs text-red-500">{errors.defaultDuePeriod.message}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={isSaving}
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <AdminCredentials />
      <UserLoginActivity />
      <NonAdminUserManagement />
    </div>
  );
}
