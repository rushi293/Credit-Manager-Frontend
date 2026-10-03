import {  useState, useEffect, useRef  } from 'react';
import { useAppEvent } from '@/hooks/useAppEvent';
import { Download, TrendingUp, Users, FileText, AlertCircle, RefreshCw, ChevronDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { dashboardService } from '@/services/dashboard';
import { customerService } from '@/services/customers';
import type { DashboardData, Customer, CreditBill } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { useTheme } from '@/context/ThemeContext';

export default function ReportsPage() {
  const getLatestPaymentDate = (b: CreditBill) => {
    if (!b.payments || b.payments.length === 0) return '-';
    const latest = b.payments.reduce((latest, current) => {
      return new Date(latest.paymentDate) > new Date(current.paymentDate) ? latest : current;
    });
    return formatDate(latest.paymentDate);
  };

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bills, setBills] = useState<CreditBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReportData = async () => {
    if (!dashboard) setLoading(true);
    setError(null);
    try {
      const { billService } = await import('@/services/bills');
      const [dashData, custData, activeBills, archivedBills] = await Promise.all([
        dashboardService.getDashboardData(),
        customerService.getCustomers(),
        billService.getBills(),
        billService.getBills(undefined, true)
      ]);
      if (dashData) setDashboard(dashData);
      if (custData) setCustomers(custData);
      const allBills = [...(activeBills || []), ...(archivedBills || [])].sort((a, b) => new Date(b.billDate).getTime() - new Date(a.billDate).getTime());
      setBills(allBills);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  useAppEvent(
    ['METRICS_UPDATED', 'CREDIT_BILL_CREATED', 'CREDIT_BILL_UPDATED', 'CREDIT_BILL_DELETED', 'PAYMENT_CREATED', 'PAYMENT_DELETED', 'CUSTOMER_CREATED', 'CUSTOMER_UPDATED', 'CUSTOMER_DELETED', 'RECONNECTED'],
    () => {
      fetchReportData();
    }
  );

  const exportCustomersToCSV = async () => {
    try {
      if (!bills.length) {
        alert("No bill data available to export.");
        return;
      }
      
      const paidBills = bills.filter(b => b.status === 'PAID');
      const unpaidBills = bills.filter(b => b.status !== 'PAID');

      const headers = ['Customer', 'Bill #', 'Bill Date', 'Payment Date', 'Amount', 'Paid', 'Unpaid', 'Status'];
      
      const mapRow = (b: CreditBill) => {
        // Use backend-calculated values (accurate, includes all payments regardless of archive status)
        const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
        const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
        return [
          `"${b.customer?.name || 'Unknown'}"`,
          `"${b.billNumber}"`,
          new Date(b.billDate).toLocaleDateString(),
          `"${formatCurrency(b.totalAmount)}"`,
          `"${formatCurrency(paid)}"`,
          `"${formatCurrency(remaining)}"`,
          `"${b.status || (remaining <= 0 ? 'PAID' : 'UNPAID')}"`
        ];
      };

      let csvContent = '\uFEFF'; // BOM
      csvContent += 'Paid Bills\n';
      csvContent += headers.join(',') + '\n';
      csvContent += paidBills.map(mapRow).map(r => r.join(',')).join('\n') + '\n\n';
      
      csvContent += 'Unpaid / Partially Paid Bills\n';
      csvContent += headers.join(',') + '\n';
      csvContent += unpaidBills.map(mapRow).map(r => r.join(',')).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_bill_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('Failed to export CSV report.');
    }
  };

  const exportCustomersToPDF = async () => {
    try {
      if (!bills.length) {
        alert("No bill data available to export.");
        return;
      }
      
      const paidBills = bills.filter(b => b.status === 'PAID');
      const unpaidBills = bills.filter(b => b.status !== 'PAID');
      
      const doc = new jsPDF('landscape');
      
      try {
        const fontUrl = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf';
        const response = await fetch(fontUrl);
        const buffer = await response.arrayBuffer();
        
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64Font = btoa(binary);
        
        doc.addFileToVFS('Roboto-Regular.ttf', base64Font);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.setFont('Roboto');
      } catch (fontErr) {
        console.warn('Failed to load font for Rupee symbol, falling back to default', fontErr);
      }
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59);
      doc.text("Payment & Bill Report", 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Export Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 30);
      
      const tableHeaders = [['Customer', 'Bill #', 'Bill Date', 'Payment Date', 'Amount', 'Paid', 'Unpaid', 'Status']];
      const mapRow = (b: CreditBill) => {
        // Use backend-calculated values (accurate, includes all payments regardless of archive status)
        const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
        const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
        return [
          b.customer?.name || 'Unknown',
          b.billNumber,
          formatDate(b.billDate),
          getLatestPaymentDate(b),
          formatCurrency(b.totalAmount),
          formatCurrency(paid),
          formatCurrency(remaining),
          b.status || (remaining <= 0 ? 'PAID' : 'UNPAID')
        ];
      };
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Paid Bills", 14, 40);

      autoTable(doc, {
        startY: 45,
        head: tableHeaders,
        body: paidBills.map(mapRow),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { font: 'Roboto', fontSize: 8, cellPadding: 3 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        }
      });
      
      // @ts-ignore
      const nextY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text("Unpaid / Partially Paid Bills", 14, nextY);
      
      autoTable(doc, {
        startY: nextY + 5,
        head: tableHeaders,
        body: unpaidBills.map(mapRow),
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { font: 'Roboto', fontSize: 8, cellPadding: 3 },
        columnStyles: {
          3: { halign: 'right' },
          4: { halign: 'right' },
          5: { halign: 'right', fontStyle: 'bold' }
        }
      });
      
      doc.save(`payment_bill_report_${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-10 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white border border-gray-100 rounded-xl"></div>)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-[400px] bg-white border border-gray-100 rounded-xl"></div>
          <div className="h-[400px] bg-white border border-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="p-12 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-500" />
        </div>
        <p className="text-gray-900 font-medium mb-1">Failed to load reports</p>
        <p className="text-gray-500 text-sm mb-4">{error}</p>
        <button 
          onClick={fetchReportData}
          className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors inline-flex items-center"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const { metrics } = dashboard;
  
  // Overdue, Partial, Unpaid
  const COLORS = ['#F2B33D', '#3B5B8A', '#94a3b8'];
  const barColor = '#3B5B8A';
  
  const billStatusData = [
    { name: 'Overdue Bills', value: 0 }, 
    { name: 'Unpaid Bills', value: metrics.unpaidBillsCount },
    { name: 'Partially Paid', value: metrics.partiallyPaidBillsCount }
  ].filter(d => d.value > 0);

  const topDebtors = [...customers]
    .sort((a, b) => Number(b.outstandingBalance || 0) - Number(a.outstandingBalance || 0))
    .slice(0, 5)
    .map(c => ({
      name: c.name,
      amount: Number(c.outstandingBalance || 0)
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Note: Date-range filtering is not currently supported by the backend APIs.
          </p>
        </div>
        <div className="relative" ref={exportMenuRef}>
          <button 
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            disabled={bills.length === 0}
            className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="mr-2 h-4 w-4" /> Export Report <ChevronDown className="ml-2 h-4 w-4" />
          </button>
          
          {isExportMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-lg z-10 dark:bg-[#252221] dark:border-[#3C3633]">
              <div className="py-1">
                <button
                  onClick={() => { exportCustomersToCSV(); setIsExportMenuOpen(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-[#F5F2EA] dark:hover:bg-[#332E2C]"
                >
                  <FileText className="mr-2 h-4 w-4" /> Export as CSV
                </button>
                <button
                  onClick={() => { exportCustomersToPDF(); setIsExportMenuOpen(false); }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-[#F5F2EA] dark:hover:bg-[#332E2C]"
                >
                  <FileText className="mr-2 h-4 w-4" /> Export as PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Outstanding</h3>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalOutstandingCredit)}</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Overdue Amount</h3>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(metrics.overdueAmount)}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{metrics.totalCustomers}</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Active Bills</h3>
            <FileText className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {metrics.unpaidBillsCount + metrics.partiallyPaidBillsCount}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Debtors Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900">Top Outstanding Balances</h3>
          </div>
          <div className="h-[300px] w-full">
            {topDebtors.length > 0 && topDebtors.some(d => d.amount > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topDebtors} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#3C3633' : '#f3f4f6'} />
                  <XAxis type="number" tickFormatter={(v: any) => `₹${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{fill: isDark ? '#9E9685' : '#6b7280', fontSize: 12}} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} tick={{fill: isDark ? '#E0D8CA' : '#4b5563', fontSize: 12}} />
                  <Tooltip 
                    formatter={(value: any) => formatCurrency(value)}
                    cursor={{fill: isDark ? '#332E2C' : '#f9fafb'}}
                    contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: isDark ? '#252221' : '#fff', color: isDark ? '#F5F2EA' : '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{ color: isDark ? '#F5F2EA' : '#111827' }}
                  />
                  <Bar dataKey="amount" fill={barColor} radius={[0, 4, 4, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No outstanding balances found.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900">Active Bills Breakdown</h3>
          </div>
          <div className="h-[300px] w-full">
            {billStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={billStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    stroke="none"
                  >
                    {billStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: isDark ? '#252221' : '#fff', color: isDark ? '#F5F2EA' : '#111827', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    itemStyle={{ color: isDark ? '#F5F2EA' : '#111827' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">
                No active unpaid bills found.
              </div>
            )}
          </div>
        </div>
      </div>

      
      {/* Table 1: Paid Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Paid Bills</h3>
        </div>
        
        <div className="hidden md:block overflow-x-auto pb-1">
          <table className="w-full min-w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Bill #</th>
                <th className="px-6 py-4 font-medium">Bill Date</th>
                <th className="px-6 py-4 font-medium text-center">Payment Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Paid</th>
                <th className="px-6 py-4 font-medium text-right">Unpaid</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.filter(b => b.status === 'PAID').length > 0 ? (
                bills.filter(b => b.status === 'PAID').map(b => {
                  const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
                  const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{b.customer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">{b.billNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(b.billDate)}</td>
                        <td className="px-6 py-4 text-center text-gray-600">{getLatestPaymentDate(b)}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(paid)}</td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900">{formatCurrency(remaining)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          PAID
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No paid bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile View - Paid Bills */}
        <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
          {bills.filter(b => b.status === "PAID").length > 0 ? (
            bills.filter(b => b.status === "PAID").map(b => {
              const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
              const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
              return (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{b.customer?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Bill #</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{b.billNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Date</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(b.billDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Status</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                        PAID
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(b.totalAmount)}</p>
                  </div>

                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Unpaid</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              No paid bills found.
            </div>
          )}
        </div>

      </div>

      {/* Table 2: Unpaid / Partially Paid Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Unpaid / Partially Paid Bills</h3>
        </div>
        
        <div className="hidden md:block overflow-x-auto pb-1">
          <table className="w-full min-w-full text-sm text-left whitespace-nowrap">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Bill #</th>
                <th className="px-6 py-4 font-medium">Bill Date</th>
                <th className="px-6 py-4 font-medium text-center">Payment Date</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Paid</th>
                <th className="px-6 py-4 font-medium text-right">Unpaid</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.filter(b => b.status !== 'PAID').length > 0 ? (
                bills.filter(b => b.status !== 'PAID').map(b => {
                  const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
                  const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
                  const status = b.status || (remaining <= 0 ? 'PAID' : 'UNPAID');
                  
                  return (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{b.customer?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 text-gray-600">{b.billNumber}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(b.billDate)}</td>
                        <td className="px-6 py-4 text-center text-gray-600">{getLatestPaymentDate(b)}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(b.totalAmount)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(paid)}</td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(remaining)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'PARTIALLY_PAID' ? 'bg-amber-100 text-amber-800' :
                          status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                          'bg-indigo-100 text-indigo-800'
                        }`}>
                          {status === 'PARTIALLY_PAID' ? 'PARTIAL' : status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 text-sm">
                    No unpaid or partially paid bills found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Mobile View - Unpaid Bills */}
        <div className="md:hidden divide-y divide-gray-100 border-t border-gray-100">
          {bills.filter(b => b.status !== "PAID").length > 0 ? (
            bills.filter(b => b.status !== "PAID").map(b => {
              const paid = Number(b.totalPaid ?? (b.payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0));
              const remaining = Number(b.remainingAmount ?? (Number(b.totalAmount) - paid));
              const status = b.status || (remaining <= 0 ? "PAID" : "UNPAID");
              return (
                <div key={b.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{b.customer?.name || "Unknown"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Bill #</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{b.billNumber}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Date</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{formatDate(b.billDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Status</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${status === "PARTIALLY_PAID" ? "bg-amber-100 text-amber-800" : status === "OVERDUE" ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                        {status === "PARTIALLY_PAID" ? "PARTIAL" : status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
                    <p className="text-xs text-gray-500 mb-0.5">Amount</p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(b.totalAmount)}</p>
                  </div>

                  <div className="flex justify-between items-start pt-1">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Paid</p>
                      <p className="text-sm font-semibold text-emerald-600">{formatCurrency(paid)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-0.5">Unpaid</p>
                      <p className="text-sm font-bold text-red-600">{formatCurrency(remaining)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              No unpaid or partially paid bills found.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

