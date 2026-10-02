import { useState, useEffect } from "react";
import { useAppEvent } from '@/hooks/useAppEvent';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Users, Eye, EyeOff, UserPlus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authService } from "@/services/auth";
import { adminService } from "@/services/admin";
import { useAuth } from "@/context/AuthContext";

const staffSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const updateSchema = z.object({
  email: z.string().email(),
  newPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal('')),
});

export default function NonAdminUserManagement() {
  const toast = useToast();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema)
  });

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema)
  });

  const fetchUsers = async () => {
    try {
      const data = await adminService.getNonAdmins();
      if (data) setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchUsers();
    }
  }, [user]);

  useAppEvent(
    ['USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'RECONNECTED'],
    () => {
      if (user?.role === "ADMIN") {
        fetchUsers();
      }
    }
  );

  const onSubmit = async (data: z.infer<typeof staffSchema>) => {
    setIsSaving(true);
    try {
      await authService.createStaff({
        email: data.email,
        password: data.password
      });
      toast.success("Non-Admin user created successfully.");
      reset();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to create Non-Admin user.");
    } finally {
      setIsSaving(false);
    }
  };

  const onEdit = async (data: z.infer<typeof updateSchema>) => {
    if (!editingUser) return;
    try {
      await adminService.updateNonAdmin(editingUser.id, data);
      toast.success("User updated successfully.");
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to update user.");
    }
  };

  const onDelete = async () => {
    if (!deletingUser) return;
    try {
      await adminService.deleteNonAdmin(deletingUser.id);
      toast.success("User deleted successfully.");
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete user.");
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5 text-gray-400" /> Non-Admin Users
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Manage credentials for non-admin accounts.
          </p>
        </div>
      </div>
      
      {/* List existing users */}
      {users.length > 0 && (
        <div className="border-b border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-900">{u.email}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">Active</td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      <button onClick={() => {
                        setEditingUser(u);
                        resetEdit({ email: u.email, newPassword: "" });
                      }} className="text-indigo-600 hover:text-indigo-900 mr-4 inline-flex items-center gap-1">
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button onClick={() => setDeletingUser(u)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add New User Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
        <h4 className="font-medium text-gray-900">Add New Non-Admin User</h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Email</label>
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
            {isSaving ? "Creating..." : "Add User"}
          </button>
        </div>
      </form>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit User</h2>
            <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input 
                  type="email"
                  {...registerEdit("email")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {editErrors.email && <p className="text-xs text-red-500">{editErrors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
                <input 
                  type="password"
                  {...registerEdit("newPassword")}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="***************"
                />
                {editErrors.newPassword && <p className="text-xs text-red-500">{editErrors.newPassword.message}</p>}
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Delete this user?</h2>
            <p className="text-sm text-gray-600 mb-6">{deletingUser.email} will no longer be able to log in. Their business data will not be deleted.</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setDeletingUser(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={onDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Delete User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}