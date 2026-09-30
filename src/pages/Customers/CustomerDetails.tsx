import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Phone, MapPin, AlertCircle, RefreshCw, FileText, ArrowUpRight, Plus, Edit, Trash2 } from 'lucide-react';

import { customerService } from '@/services/customers';
import type { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { CustomerForm } from './components/CustomerForm';
import { BillForm } from '@/pages/Bills/components/BillForm';
import { useToast } from '@/components/ui/toast';


export default function CustomerDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isBillFormOpen, setIsBillFormOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cannotDeleteAmount, setCannotDeleteAmount] = useState<number | null>(null);
  const toast = useToast();

  const fetchCustomer = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await customerService.getCustomerById(id);
      if (data) {
        setCustomer(data);
      } else {
        throw new Error('Customer not found');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load customer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await customerService.deleteCustomer(id);
      toast.success('Customer and all associated records were deleted successfully.');
      navigate('/customers');
    } catch (err: any) {
      const errorData = err?.response?.data;
      if (errorData?.error === 'CUSTOMER_HAS_BALANCE') {
        setCannotDeleteAmount(errorData.remainingAmount);
      } else {
        toast.error(errorData?.error || 'Unable to delete this customer. Please try again.');
      }
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-40 bg-white border border-gray-100 rounded-xl"></div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] bg-white border border-gray-100 rounded-xl"></div>
          <div className="h-[400px] bg-white border border-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-1">Failed to load customer details</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/customers')} 
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={fetchCustomer} 
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const hasOutstanding = Number(customer.outstandingBalance) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/customers')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Customer Profile</h1>
      </div>

      {/* Profile & Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 bg-indigo-50 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
                  {customer.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-gray-400" /> {customer.phone}
                    </span>
                  )}
                  {customer.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-gray-400" /> {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-4 w-full md:w-auto border-t border-gray-100 pt-6 md:border-0 md:pt-0">
              <div className="text-left md:text-right w-full md:w-auto">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Outstanding Balance</p>
                <p className={cn(
                  "text-3xl font-bold tracking-tight",
                  hasOutstanding ? "text-red-600" : "text-gray-900"
                )}>
                  {formatCurrency(customer.outstandingBalance)}
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <button
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Customer
                </button>
                <button 
                  onClick={() => setIsEditFormOpen(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center"
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Profile
                </button>
                <button 
                  onClick={() => setIsBillFormOpen(true)}
                  className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center shadow-sm"
                >
                  <Plus className="mr-2 h-4 w-4" /> Create Bill
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-gray-100">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Credit</p>
              <p className="mt-1 text-lg font-semibold text-gray-900">{formatCurrency(customer.totalCredit)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">{formatCurrency(customer.totalPaid)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ledger Splits: Bills & Payments */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Bills Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-400" /> Credit Bills
            </h3>
          </div>
          <div className="p-6">
            {(!customer.bills || customer.bills.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No bills recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.bills.map(bill => (
                  <div key={bill.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-900">Bill #{bill.billNumber}</div>
                      <div className="text-xs text-gray-500 mt-1">{formatDate(bill.billDate)}</div>
                    </div>
                    <div className="text-right font-medium text-gray-900">
                      {formatCurrency(bill.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payments Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-gray-400" /> Payment History
            </h3>
          </div>
          <div className="p-6">
            {(!customer.payments || customer.payments.length === 0) ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No payments recorded.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {customer.payments.map(payment => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border border-emerald-100 bg-emerald-50/50 rounded-xl">
                    <div>
                      <div className="font-medium text-sm text-emerald-700">Payment Received</div>
                      <div className="text-xs text-emerald-600/70 mt-1">
                        {formatDate(payment.paymentDate)} • {payment.paymentMethod}
                        {payment.creditBill && ` • Bill #${payment.creditBill.billNumber}`}
                      </div>
                    </div>
                    <div className="text-right font-semibold text-emerald-700">
                      +{formatCurrency(payment.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CustomerForm 
        open={isEditFormOpen} 
        onOpenChange={setIsEditFormOpen} 
        customer={customer}
        onSuccess={() => {
          setIsEditFormOpen(false);
          fetchCustomer();
        }} 
      />

      <BillForm
        open={isBillFormOpen}
        onOpenChange={setIsBillFormOpen}
        defaultCustomerId={customer?.id}
        onSuccess={() => {
          setIsBillFormOpen(false);
          fetchCustomer();
        }}
      />

      {/* ── Delete Confirmation Dialog ─────────────────────────────────── */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Delete Customer?</h2>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-600 leading-relaxed">
                This will permanently delete <span className="font-semibold text-gray-900">{customer?.name}</span> and all associated records, including credit bills, payments, and bill attachments.{' '}
                <span className="font-semibold text-red-600">This action cannot be undone.</span>
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-70 inline-flex items-center gap-2"
              >
                {isDeleting && (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                {isDeleting ? 'Deleting…' : 'Delete Customer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cannot Delete Notification Dialog ────────────────────────────── */}
      {cannotDeleteAmount !== null && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Cannot Delete Customer</h2>
            </div>
            <div className="px-6 py-5 text-center sm:text-left">
              <p className="text-sm text-gray-600 leading-relaxed">
                This customer has <span className="font-semibold text-gray-900">{formatCurrency(cannotDeleteAmount)}</span> in remaining payments. Please clear all outstanding bills before deleting this customer.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setCannotDeleteAmount(null)}
                className="px-6 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
