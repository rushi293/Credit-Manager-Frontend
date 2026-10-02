import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User, AlertCircle, RefreshCw, ChevronRight } from 'lucide-react';

import { customerService } from '@/services/customers';
import type { Customer } from '@/types';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/utils';

import { CustomerForm } from './components/CustomerForm';

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchCustomers = async () => {
    if (customers.length === 0) setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomers();
      if (data) {
        setCustomers(data);
      } else {
        setCustomers([]);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.phone && c.phone.includes(search))
    );
  }, [customers, search]);

  const handleCustomerCreated = () => {
    setIsFormOpen(false);
    fetchCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customers</h1>
          <p className="text-sm text-gray-500 mt-1">Manage customers and track their outstanding credit.</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search by name or phone..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Content */}
        <div>
          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center space-x-4">
                     <div className="h-10 w-10 bg-gray-100 rounded-full"></div>
                     <div className="space-y-2">
                       <div className="h-4 bg-gray-100 rounded w-32"></div>
                       <div className="h-3 bg-gray-100 rounded w-24"></div>
                     </div>
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-24"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
              <p className="text-gray-900 font-medium mb-1">Failed to load</p>
              <p className="text-gray-500 text-sm mb-4">{error}</p>
              <button 
                onClick={fetchCustomers} 
                className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors inline-flex items-center"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Retry
              </button>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <User className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-base font-medium text-gray-900">No customers found</h3>
              <p className="text-sm text-gray-500 mt-1 max-w-sm">
                {search ? 'Try adjusting your search terms.' : 'Add your first customer to start tracking credit.'}
              </p>
              {!search && (
                <button 
                  onClick={() => setIsFormOpen(true)} 
                  className="mt-6 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors"
                >
                  Add Customer
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Customer</th>
                      <th className="px-6 py-4 font-medium">Contact</th>
                      <th className="px-6 py-4 font-medium text-right">Total Credit</th>
                      <th className="px-6 py-4 font-medium text-right">Paid</th>
                      <th className="px-6 py-4 font-medium text-right">Outstanding</th>
                      <th className="px-6 py-4 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCustomers.map((customer) => {
                       const hasOutstanding = Number(customer.outstandingBalance) > 0;
                       return (
                        <tr 
                          key={customer.id} 
                          onClick={() => navigate(`/customers/${customer.id}`)}
                          className="hover:bg-gray-50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{customer.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                            {customer.phone || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                            {formatCurrency(customer.totalCredit)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                            {formatCurrency(customer.totalPaid)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <span className={cn(
                              "font-semibold", 
                              hasOutstanding ? "text-red-600" : "text-gray-500"
                            )}>
                              {formatCurrency(customer.outstandingBalance)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-gray-500 ml-auto transition-colors" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredCustomers.map((customer) => {
                  const hasOutstanding = Number(customer.outstandingBalance) > 0;
                  return (
                    <div 
                      key={customer.id}
                      onClick={() => navigate(`/customers/${customer.id}`)}
                      className="p-4 active:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-gray-900">{customer.name}</h3>
                          <p className="text-xs text-gray-500 mt-0.5">{customer.phone || 'No phone'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-medium text-gray-500 uppercase">Outstanding</p>
                          <p className={cn(
                            "font-semibold text-sm", 
                            hasOutstanding ? "text-red-600" : "text-gray-500"
                          )}>
                            {formatCurrency(customer.outstandingBalance)}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-xs text-gray-500 bg-gray-50 rounded p-2 mt-3">
                        <div>
                          <span className="block text-[10px] uppercase">Total Credit</span>
                          <span className="font-medium">{formatCurrency(customer.totalCredit)}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] uppercase">Paid</span>
                          <span className="font-medium">{formatCurrency(customer.totalPaid)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <CustomerForm 
        open={isFormOpen} 
        onOpenChange={setIsFormOpen} 
        onSuccess={handleCustomerCreated} 
      />
    </div>
  );
}
