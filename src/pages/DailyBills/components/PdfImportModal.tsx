import { useState, useRef, useEffect } from 'react';
import { Upload, X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { dailyBillService } from '@/services/dailyBills';
import { customerService } from '@/services/customers';
import type { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/toast';

interface PdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PdfImportModal({ isOpen, onClose, onSuccess }: PdfImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedBills, setParsedBills] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setParsedBills([]);
      fetchCustomers();
    }
  }, [isOpen]);

  const fetchCustomers = async () => {
    try {
      const data = await customerService.getCustomers();
      setCustomers(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const normalizeString = (str: string) => {
    return str.replace(/\s+/g, ' ').trim().toLowerCase();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (selected.type !== 'application/pdf') {
      toast.error('Please select a valid PDF file');
      return;
    }
    setFile(selected);
    setIsParsing(true);
    try {
      const bills = await dailyBillService.parsePdf(selected);
      
      // Attempt to match customers
      const processed = bills.map(bill => {
        const normalizedRetailer = normalizeString(bill.retailerName);
        const matches = customers.filter(c => normalizeString(c.name) === normalizedRetailer);
        
        let customerId = undefined;
        let newCustomerName = bill.retailerName;
        let isAmbiguous = matches.length > 1;

        if (matches.length === 1) {
          customerId = matches[0].id;
          newCustomerName = undefined;
        }

        return {
          ...bill,
          selected: true,
          customerId,
          newCustomerName,
          isAmbiguous
        };
      });

      setParsedBills(processed);
      if (processed.length === 0) {
        toast.error('No valid bills could be extracted from this PDF');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to parse PDF');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const toImport = parsedBills.filter(b => b.selected);
    if (toImport.length === 0) return;

    // Validation
    const invalid = toImport.some(b => b.isAmbiguous && !b.customerId);
    if (invalid) {
      toast.error('Please resolve ambiguous customers before importing');
      return;
    }

    setIsImporting(true);
    try {
      const payload = toImport.map(b => ({
        billDate: b.billDate,
        billNumber: b.billNumber,
        billAmount: b.netAmount,
        customerId: b.customerId,
        newCustomerName: b.customerId ? undefined : (b.newCustomerName || b.retailerName)
      }));
      
      await dailyBillService.importBills(payload);
      toast.success('Successfully imported ' + payload.length + ' bills');
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to import bills');
    } finally {
      setIsImporting(false);
    }
  };

  const toggleSelect = (index: number) => {
    const newBills = [...parsedBills];
    newBills[index].selected = !newBills[index].selected;
    setParsedBills(newBills);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Import Daily Bills from PDF</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          {!file ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Select PDF File
                </button>
              </div>
            </div>
          ) : isParsing ? (
            <div className="text-center py-12">
              <Loader2 className="mx-auto h-8 w-8 text-indigo-600 animate-spin" />
              <p className="mt-2 text-sm text-gray-500">Parsing PDF and matching customers...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Found {parsedBills.length} valid bills.</p>
                <div className="flex space-x-2">
                   <button onClick={() => setFile(null)} className="text-sm text-indigo-600 hover:text-indigo-800">
                     Upload a different file
                   </button>
                </div>
              </div>
              
              <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input 
                          type="checkbox" 
                          checked={parsedBills.length > 0 && parsedBills.every(b => b.selected)}
                          onChange={(e) => setParsedBills(parsedBills.map(b => ({ ...b, selected: e.target.checked })))}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retailer / Customer Match</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedBills.map((bill, index) => (
                      <tr key={index} className={!bill.selected ? 'opacity-50 bg-gray-50' : ''}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={bill.selected}
                            onChange={() => toggleSelect(index)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(bill.billDate)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{bill.billNumber}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatCurrency(bill.netAmount)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                          <div className="flex flex-col space-y-1">
                            <span className="text-xs text-gray-500">PDF: {bill.retailerName}</span>
                            {bill.customerId ? (
                              <span className="text-xs font-medium text-green-600 flex items-center">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Matched: {customers.find(c => c.id === bill.customerId)?.name}
                              </span>
                            ) : bill.isAmbiguous ? (
                              <span className="text-xs font-medium text-amber-600 flex items-center">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Ambiguous Match (Please resolve)
                              </span>
                            ) : (
                              <span className="text-xs font-medium text-blue-600">
                                Will create new customer
                              </span>
                            )}
                            <select 
                               value={bill.customerId || ''}
                               onChange={(e) => {
                                 const val = e.target.value;
                                 const newBills = [...parsedBills];
                                 if (val) {
                                   newBills[index].customerId = val;
                                   newBills[index].isAmbiguous = false;
                                 } else {
                                   newBills[index].customerId = undefined;
                                 }
                                 setParsedBills(newBills);
                               }}
                               className="mt-1 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-xs rounded-md"
                            >
                               <option value="">-- Create New --</option>
                               {customers.map(c => (
                                 <option key={c.id} value={c.id}>{c.name}</option>
                               ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {parsedBills.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 bg-gray-50 rounded-b-lg">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting || !parsedBills.some(b => b.selected)}
              className="inline-flex justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  Importing...
                </>
              ) : (
                'Import ' + parsedBills.filter(b => b.selected).length + ' Bills'
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}




