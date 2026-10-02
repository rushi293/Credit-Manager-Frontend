import { useState } from 'react';
import { Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { metricsService } from '@/services/metrics';
import { formatCurrency } from '@/lib/format';

interface ReportsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ReportsModal({ open, onClose }: ReportsModalProps) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!open) return null;

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates.');
      return;
    }

    setIsGenerating(true);
    try {
      const metrics = await metricsService.getMetrics(
        new Date(startDate).toISOString(), 
        new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString()
      );

      const doc = new jsPDF();
      
      // Fetch Roboto font for Rupee symbol support
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

      doc.setFontSize(18);
      doc.text('Business Metrics Report', 14, 22);
      
      doc.setFontSize(11);
      doc.text(`Period: ${startDate} to ${endDate}`, 14, 30);

      const tableData = metrics.map(m => [
        new Date(m.date).toLocaleDateString(),
        formatCurrency(m.totalSales),
        formatCurrency(m.totalExpense),
        formatCurrency(m.totalIphoneSales)
      ]);

      const totals = metrics.reduce((acc, m) => {
        acc.sales += Number(m.totalSales);
        acc.expense += Number(m.totalExpense);
        acc.iphone += Number(m.totalIphoneSales);
        return acc;
      }, { sales: 0, expense: 0, iphone: 0 });

      tableData.push([
        'TOTAL',
        formatCurrency(totals.sales),
        formatCurrency(totals.expense),
        formatCurrency(totals.iphone)
      ]);

      autoTable(doc, {
        startY: 36,
        head: [['Date', 'Total Sales', 'Total Expense', 'Ice Cream Sales']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        styles: { font: 'Roboto' },
        footStyles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' },
        willDrawCell: (data) => {
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [243, 244, 246];
            data.cell.styles.textColor = [17, 24, 39];
          }
        }
      });

      doc.save(`Business_Report_${startDate}_to_${endDate}.pdf`);
      onClose();
    } catch (e) {
      console.error(e);
      alert('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Generate Report</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Select a date range to generate a PDF report of your daily sales, expenses, and Ice Cream Sales.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm" 
              />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 bg-white border border-gray-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating || !startDate || !endDate}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors inline-flex items-center"
          >
            {isGenerating ? 'Generating...' : <><Download className="h-4 w-4 mr-2" /> Download PDF</>}
          </button>
        </div>
      </div>
    </div>
  );
}
