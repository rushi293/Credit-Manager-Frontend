import { useState, useEffect } from "react";
import { useAppEvent } from '@/hooks/useAppEvent';
import { Activity, LogOut } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { adminService } from "@/services/admin";
import type { LoginSession } from "@/services/admin";
import { useAuth } from "@/context/AuthContext";


export default function UserLoginActivity() {
  const toast = useToast();
  const { user } = useAuth();
  
  const [sessions, setSessions] = useState<LoginSession[]>([]);
  const [loggingOutSession, setLoggingOutSession] = useState<LoginSession | null>(null);

  const fetchSessions = async () => {
    try {
      const data = await adminService.getLoginSessions();
      if (data) setSessions(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchSessions();
    }
  }, [user]);

  useAppEvent(
    ['USER_LOGIN', 'USER_LOGOUT', 'USER_UPDATED', 'USER_DELETED', 'RECONNECTED'],
    () => {
      if (user?.role === "ADMIN") {
        fetchSessions();
      }
    }
  );

  const onLogout = async () => {
    if (!loggingOutSession) return;
    try {
      await adminService.logoutSession(loggingOutSession.id);
      toast.success("Session revoked successfully.");
      setLoggingOutSession(null);
      fetchSessions();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to logout session.");
    }
  };

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-6">
      <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" /> User Login Activity
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Track active and recent login sessions.
          </p>
        </div>
      </div>
      
      {sessions.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Login Time</th>
                <th className="px-6 py-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map((s) => {
                // Calculate if session is realistically active based on 18h limit + revocation
                const is18hPassed = (new Date().getTime() - new Date(s.loginAt).getTime()) > 18 * 60 * 60 * 1000;
                const is8hStale = (new Date().getTime() - new Date(s.lastActivityAt || s.loginAt).getTime()) > 8 * 60 * 60 * 1000;
                const isOnline = s.isValid && !s.revokedAt && !is18hPassed && !is8hStale;

                return (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 whitespace-nowrap text-gray-900">{s.user.email}</td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">{s.user.role === 'STAFF' ? 'NON_ADMIN' : s.user.role}</td>
                    <td className="px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                        {isOnline ? 'Online' : 'Offline'}
                      </span>
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-gray-500">
                      {new Date(s.loginAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-6 py-3 whitespace-nowrap text-right">
                      {isOnline && s.user.role !== 'ADMIN' && (
                        <button onClick={() => setLoggingOutSession(s)} className="text-red-600 hover:text-red-900 inline-flex items-center gap-1">
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-gray-500">No login activity found.</div>
      )}

      {/* Logout Modal */}
      {loggingOutSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Are you sure you want to log out this user?</h2>
            <p className="text-sm text-gray-600 mb-6">{loggingOutSession.user.email}</p>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setLoggingOutSession(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="button" onClick={onLogout} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">Logout User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}