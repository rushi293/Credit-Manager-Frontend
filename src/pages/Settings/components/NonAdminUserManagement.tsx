
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Eye, EyeOff, UserPlus } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/services/auth";
import { useAuth } from "@/context/AuthContext";

const staffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type StaffFormValues = z.infer<typeof staffSchema>;

export default function NonAdminUserManagement() {
  const toast = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema)
  });

  const onSubmit = async (data: StaffFormValues) => {
    setIsSaving(true);
    try {
      await authService.createStaff({
        email: data.email,
        password: data.password
      });
      toast.success("Non-Admin user created successfully.");
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create Non-Admin user.");
    } finally {
      setIsSaving(false);
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" /> Non-Admin User Management
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Create an additional staff account for this business.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Non-Admin Email</label>
            <input 
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm"
              placeholder="employee@example.com"
            />
            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input 
                  type={showNew ? "text" : "password"}
                  {...register("password")}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-colors sm:text-sm pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
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
            <UserPlus className="mr-2 h-4 w-4" />
            {isSaving ? "Creating..." : "Create Non-Admin User"}
          </button>
        </div>
      </form>
    </div>
  );
}

