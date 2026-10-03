import { formatCurrency, formatDate } from '@/lib/format';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DailyBill } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Download, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/toast';

interface DailyBillsReportProps {
  bills: DailyBill[];
  selectedDate: string;
}

export function DailyBillsReport({ bills, selectedDate }: DailyBillsReportProps) {
  const { business } = useAuth();
  const toast = useToast();

  const generatePDF = () => {
    if (!bills.length) {
      toast.error('No Daily Bills found for this date.');
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const businessName = business?.name || 'DAILY BILL REPORT';
    const reportDate = formatDate(selectedDate).toUpperCase();
    
    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(businessName.toUpperCase(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('DAILY BILL REPORT', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(reportDate, pageWidth / 2, 40, { align: 'center' });

    // Table Data
    const tableData = bills.map(b => [
      b.customer?.name || '-',
      b.billNumber,
      formatCurrency(Number(b.billAmount)),
      b.status === 'PAID' ? 'Paid' : 'Unpaid',
      b.status === 'PAID' ? (b.paymentMethod || '-') : '-'
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['Customer Shop', 'Bill No.', 'Amount', 'Status', 'Payment']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30 },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 }
      }
    });

    // Total Amount
    const totalAmount = bills.reduce((sum, b) => sum + Number(b.billAmount), 0);
    const finalY = (doc as any).lastAutoTable.finalY || 50;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Total Bill Amount: ${formatCurrency(totalAmount)}`, 14, finalY + 15);

    doc.save(`daily-bills-${selectedDate}.pdf`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" /> Daily Bills Report
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Generate a PDF report for {formatDate(selectedDate)}
          </p>
        </div>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center min-h-[200px] bg-gray-50/50">
        {!bills.length ? (
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No Daily Bills found for this date.</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="bg-indigo-50 text-indigo-700 font-medium px-4 py-2 rounded-full mb-6 inline-block">
              {bills.length} Bills found for {formatDate(selectedDate)}
            </div>
            <div>
              <button
                onClick={generatePDF}
                className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                <Download className="mr-2 h-5 w-5" />
                Download PDF
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
