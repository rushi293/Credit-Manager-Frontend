
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { KeyRound, Eye, EyeOff, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

const adminCredsSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  confirmPassword: z.string().optional().or(z.literal(""))
}).refine((data) => {
  if (data.newPassword && data.newPassword !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type AdminCredsFormValues = z.infer<typeof adminCredsSchema>;

export default function AdminCredentials() {
  const toast = useToast();
  const { user, token, business, login } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<AdminCredsFormValues>({
    resolver: zodResolver(adminCredsSchema),
    defaultValues: {
      email: user?.email || ""
    }
  });

  useEffect(() => {
    if (user?.email) {
      reset({ email: user.email });
    }
  }, [user, reset]);

  const onSubmit = async (data: AdminCredsFormValues) => {
    setIsSaving(true);
    try {
      await authService.updateCredentials({
        email: data.email,
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      toast.success("Admin credentials updated successfully");
      
      // Keep session alive with new details by getting Me again
      if (token && business) {
          login(token, { ...user!, email: data.email }, business);
      }
      reset({ email: data.email, currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update credentials");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-gray-400" /> Admin Account
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Manage your administrator email and password.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Admin Email</label>
            <input 
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <div className="relative">
              <input 
                type={showCurrent ? "text" : "password"}
                {...register("currentPassword")}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm pr-10"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">New Password (optional)</label>
              <div className="relative">
                <input 
                  type={showNew ? "text" : "password"}
                  {...register("newPassword")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
              <input 
                type="password"
                {...register("confirmPassword")}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm"
              />
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-2">
          <button 
            type="submit" 
            disabled={isSaving}
            className="inline-flex items-center justify-center px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Updating..." : "Update Credentials"}
          </button>
        </div>
      </form>
    </div>
  );
}

