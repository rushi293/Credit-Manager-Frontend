import { useState, useEffect } from 'react';
import { useAppEvent } from '@/hooks/useAppEvent';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Receipt, CreditCard, AlertCircle, RefreshCw, Calendar, FileText, UploadCloud, Trash2, Edit2, Image as ImageIcon, CheckCircle2, Eye } from 'lucide-react';

import { billService } from '@/services/bills';
import type { CreditBill, BillStatus } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { BillForm } from './components/BillForm';
import { PaymentForm } from '@/pages/Payments/components/PaymentForm';
import { useAuth } from '@/context/AuthContext';

function BillStatusBadge({ status }: { status?: BillStatus }) {
  if (!status) return null;
  switch (status) {
    case 'PAID':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-100 text-emerald-800">PAID</span>;
    case 'PARTIALLY_PAID':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800">PARTIAL</span>;
    case 'OVERDUE':
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800">OVERDUE</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-800">UNPAID</span>;
  }
}

export default function BillDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { token } = useAuth();
  
  const [bill, setBill] = useState<CreditBill | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // attachment id pending delete
  const [permanentDeleteConfirm, setPermanentDeleteConfirm] = useState(false);

  const handlePermanentDelete = async () => {
    if (!id) return;
    try {
      await billService.deleteBill(id);
      toast.success("Bill deleted successfully.");
      navigate('/bills', { replace: true });
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete bill permanently.");
    } finally {
      setPermanentDeleteConfirm(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("File is too large. Maximum size is 5 MB.");
      e.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      await billService.uploadAttachment(id, file);
      toast.success("Receipt uploaded successfully.");
      await fetchBill();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteAttachment = async () => {
    if (!deleteConfirm) return;
    try {
      await billService.deleteAttachment(deleteConfirm);
      toast.success("Attachment deleted.");
      await fetchBill();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Failed to delete attachment.");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const fetchBill = async () => {
    if (!id) return;
    if (!bill) setLoading(true);
    setError(null);
    try {
      const data = await billService.getBillById(id);
      if (data) {
        setBill(data);
      } else {
        throw new Error('Bill not found');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load bill details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBill();
  }, [id]);

  useAppEvent(
    [
      'CREDIT_BILL_UPDATED', 'CREDIT_BILL_DELETED',
      'PAYMENT_CREATED', 'PAYMENT_DELETED',
      'RECONNECTED'
    ],
    () => {
      fetchBill();
    }
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32"></div>
        <div className="h-40 bg-white border border-gray-100 rounded-xl"></div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="h-[300px] bg-white border border-gray-100 rounded-xl md:col-span-1"></div>
          <div className="h-[300px] bg-white border border-gray-100 rounded-xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-1">Failed to load bill</p>
        <p className="text-gray-500 text-sm mb-6">{error}</p>
        <div className="flex gap-4">
          <button 
            onClick={() => navigate('/bills')} 
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors"
          >
            Go Back
          </button>
          <button 
            onClick={fetchBill} 
            className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-sm font-medium transition-colors inline-flex items-center"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const isFullyPaid = Number(bill.remainingAmount) === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/bills')}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Bill Details {bill.isArchived && <span className="ml-2 text-sm font-semibold bg-gray-100 text-gray-500 px-2 py-1 rounded-full uppercase">Archived</span>}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!bill.isArchived && (
              <button
                onClick={() => setIsEditFormOpen(true)}
                className="px-4 py-2 bg-white text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-medium transition-colors border border-gray-200 shadow-sm flex items-center gap-2"
              >
                <Edit2 className="h-4 w-4" />
                Edit Bill
              </button>
            )}

            <button
              onClick={() => setPermanentDeleteConfirm(true)}
              className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-sm font-medium transition-colors border border-red-200 shadow-sm flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Bill
            </button>

            {isFullyPaid && !bill.isArchived && (
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to archive this fully paid bill? It will be removed from your active bills.')) {
                    try {
                      await billService.archiveBill(bill.id);
                      toast.success('Bill archived successfully');
                      fetchBill();
                    } catch (err: any) {
                      toast.error(err?.response?.data?.error || 'Failed to archive bill');
                    }
                  }
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl text-sm font-medium transition-colors border border-gray-200 shadow-sm"
              >
                Archive Bill
              </button>
            )}
          </div>
        </div>


      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">#{bill.billNumber}</h2>
                  <BillStatusBadge status={bill.status} />
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Customer:</span> {bill.customer?.name || 'Unknown'}
                  {bill.customer?.phone && ` (${bill.customer.phone})`}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-8 text-right w-full md:w-auto bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bill Date</p>
                <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(bill.billDate)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Due Date</p>
                <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-900">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {bill.dueDate ? formatDate(bill.dueDate) : '-'}
                </div>
              </div>
            </div>
          </div>
          
          {bill.notes && (
            <div className="mt-6 flex items-start gap-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <FileText className="h-4 w-4 shrink-0 text-gray-400 mt-0.5" />
              <p>{bill.notes}</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Financial Summary */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Financial Summary</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-between space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(bill.totalAmount)}</p>
            </div>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Total Paid</p>
              <p className="text-xl font-semibold text-emerald-600 mt-1">{formatCurrency(bill.totalPaid)}</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-sm font-medium text-gray-500">Outstanding Balance</p>
              {isFullyPaid ? (
                <div className="flex items-center gap-2 mt-2">
                   <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                   <p className="text-xl font-bold text-emerald-600">PAID IN FULL</p>
                </div>
              ) : (
                <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(bill.remainingAmount)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" /> Payment History
            </h3>
            {!isFullyPaid && (
              <button 
                onClick={() => setIsPaymentFormOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                Record Payment
              </button>
            )}
          </div>
          <div className="p-6 flex-1">
            {(!bill.payments || bill.payments.length === 0) ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-sm text-gray-500">No payments have been recorded for this bill.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bill.payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-semibold text-gray-900">Payment Received</div>
                      <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                        <span>{formatDate(payment.paymentDate)}</span>
                        <span></span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-700 uppercase tracking-wider">{payment.paymentMethod}</span>
                      </div>
                      {payment.notes && <div className="text-sm text-gray-400 mt-1">{payment.notes}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg text-emerald-600">
                        +{formatCurrency(payment.amount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attachments - Bill Images & Receipts */}
        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gray-400" /> Bill Images & Receipts
            </h3>
            {/* Top Right Upload Button (only show if there are already attachments, to avoid duplicate buttons) */}
            {bill.attachments && bill.attachments.length > 0 && (
              <div className="relative">
                <input 
                  type="file" 
                  id="file-upload-top" 
                  className="hidden" 
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload-top" className="cursor-pointer">
                  <span className={cn(
                    "px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center",
                    isUploading ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-50 shadow-sm"
                  )}>
                    <UploadCloud className="h-4 w-4 mr-2 text-gray-500" />
                    {isUploading ? 'Uploading...' : 'Upload Bill Image'}
                  </span>
                </label>
              </div>
            )}
          </div>
          <div className="p-6">
             {(!bill.attachments || bill.attachments.length === 0) ? (
               <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                 <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                 <p className="text-sm font-medium text-gray-900">No images or receipts yet</p>
                 <p className="text-xs text-gray-500 mt-1 mb-5">Upload JPEG, PNG, or WebP images up to 5MB.</p>
                 
                 <div className="relative">
                   <input 
                     type="file" 
                     id="file-upload-empty" 
                     className="hidden" 
                     accept="image/jpeg,image/png,image/webp"
                     disabled={isUploading}
                     onChange={handleFileUpload}
                   />
                   <label htmlFor="file-upload-empty" className="cursor-pointer">
                     <span className={cn(
                       "px-5 py-2.5 rounded-xl text-sm font-medium transition-colors inline-flex items-center justify-center shadow-sm",
                       isUploading ? "bg-indigo-400 text-white cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-700"
                     )}>
                       <UploadCloud className="h-4 w-4 mr-2" />
                       {isUploading ? 'Uploading...' : 'Upload Bill Image'}
                     </span>
                   </label>
                 </div>
               </div>
             ) : (
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                 {bill.attachments.map(att => {
                   const imageUrl = att.fileUrl.startsWith('http') ? att.fileUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/attachments/${att.id}?token=${token}`;
                   return (
                     <div key={att.id} className="group border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col h-48 hover:shadow-sm transition-shadow">
                       <a 
                         href={imageUrl} 
                         target="_blank" 
                         rel="noreferrer"
                         className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-white relative"
                       >
                         <img 
                           src={imageUrl} 
                           alt={att.fileName}
                           className="max-h-full max-w-full object-contain"
                            loading="lazy"
                         />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                           <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 drop-shadow-sm transition-opacity" />
                         </div>
                       </a>
                       <div className="bg-gray-50 border-t border-gray-200 p-2.5 flex justify-between items-center">
                         <span className="truncate text-xs font-medium text-gray-600 max-w-[100px]" title={att.fileName}>
                           {att.fileName}
                         </span>
                         <button 
                           onClick={() => setDeleteConfirm(att.id)}
                           className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded p-1.5 transition-colors"
                           title="Delete attachment"
                         >
                           <Trash2 className="h-3.5 w-3.5" />
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
          </div>
        </div>
      </div>


      {isEditFormOpen && (
        <BillForm 
          open={isEditFormOpen} 
          onOpenChange={setIsEditFormOpen} 
          onSuccess={() => { setIsEditFormOpen(false); fetchBill(); }} 
          initialData={bill}
        />
      )}
      <PaymentForm 
        open={isPaymentFormOpen}
        onOpenChange={setIsPaymentFormOpen}
        onSuccess={() => {
          setIsPaymentFormOpen(false);
          toast.success("Payment recorded successfully.");
          fetchBill();
        }}
        defaultBillId={bill.id}
        defaultCustomerId={bill.customerId}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete attachment?"
        description="This receipt will be permanently removed and cannot be recovered."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteAttachment}
        onCancel={() => setDeleteConfirm(null)}
        danger
      />

      <ConfirmDialog
        open={permanentDeleteConfirm}
        title="Delete this credit bill?"
        description={
          bill ? (
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg border border-gray-100 p-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Bill Number</span>
                  <span className="font-medium text-gray-900">#{bill.billNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="font-medium text-gray-900">{bill.customer?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bill Amount</span>
                  <span className="font-medium text-gray-900">{formatCurrency(bill.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paid Amount</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(bill.totalPaid)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-2">
                  <span className="text-gray-500">Remaining</span>
                  <span className="font-semibold text-red-600">{formatCurrency(bill.remainingAmount)}</span>
                </div>
              </div>
              <p className="text-xs text-red-600 font-medium">
                This action will permanently delete this credit bill and its related payment records. This cannot be undone.
              </p>
            </div>
          ) : "This action cannot be undone."
        }
        confirmLabel="Delete Bill"
        cancelLabel="Cancel"
        onConfirm={handlePermanentDelete}
        onCancel={() => setPermanentDeleteConfirm(false)}
        danger
      />
    </div>
  );
}
