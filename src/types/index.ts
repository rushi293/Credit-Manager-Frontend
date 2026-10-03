// Standard API Response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
}

// Decimal values from Prisma come as strings or numbers in JSON
export type Decimal = string | number;

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  alternatePhone: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Calculated fields from backend
  totalCredit?: Decimal;
  totalPaid?: Decimal;
  outstandingBalance?: Decimal;

  bills?: CreditBill[];
  payments?: Payment[];
}

export type BillStatus = 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';

export interface CreditBill {
  id: string;
  customerId: string;
  billNumber: string;
  billDate: string;
  dueDate?: string | null;
  totalAmount: number | string;
  notes?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;

  // Populated relations
  customer?: { name: string; phone: string | null };
  payments?: Payment[];
  attachments?: BillAttachment[];

  // Calculated fields from backend
  totalPaid?: Decimal;
  remainingAmount?: Decimal;
  status?: BillStatus;
}

export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export interface Payment {
  id: string;
  customerId: string;
  creditBillId: string;
  amount: Decimal;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  notes: string | null;
  createdAt: string;
  updatedAt: string;

  // Populated relations
  customer?: { name: string };
  creditBill?: { billNumber: string };
}

export interface BillAttachment {
  id: string;
  creditBillId: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalOutstandingCredit: Decimal;
  unpaidBillsCount: number;
  partiallyPaidBillsCount: number;
  overdueAmount: Decimal;
}

export interface DashboardData {
  metrics: DashboardMetrics;
  recentBills: CreditBill[];
  recentPayments: Payment[];
}

export type DailyBillStatus = 'PAID' | 'UNPAID' | 'CREDIT_BILL';
export type DailyPaymentMethod = 'GPay' | 'Cash';

export interface DailyBill {
  id: string;
  businessId: string;
  customerId: string;
  billNumber: string;
  billAmount: Decimal;
  status: DailyBillStatus;
  paymentMethod: DailyPaymentMethod | null;
  billDate: string;
  createdAt: string;
  updatedAt: string;

  customer?: { name: string };
}
