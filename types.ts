
export enum ClaimStatus {
  DRAFT = 'Draft',
  PENDING = 'Pending Approval',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export type UserRole = 'Employee' | 'Manager' | 'Finance' | 'Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  accessibleModules: string[]; // ['dashboard', 'new-claim', 'approvals', 'settings', 'export']
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  glCode: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
}

export interface ClaimItem {
  id: string;
  date: string;
  categoryId: string;
  description: string;
  taxAmount: number;
  baseAmount: number;
  expenseCurrency: string;
  exchangeRate: number;
  claimAmount: number;
}

export interface Signature {
  signerId: string;
  signerName: string;
  timestamp: number;
  action: 'Approved' | 'Rejected';
  remark: string;
  progress: string; // e.g., "1 of 2"
}

export interface ExpenseReport {
  id: string;
  userId: string;
  userName: string;
  title: string;
  items: ClaimItem[];
  totalClaimAmount: number;
  claimCurrency: string;
  attachments: Attachment[];
  approvers: string[]; // List of User IDs who MUST approve
  approvedBy: string[]; // List of User IDs who HAVE approved
  status: ClaimStatus;
  createdAt: number;
  rejectionComment?: string;
  signatureLog: Signature[];
}

export interface ApproverMatrix {
  id: string;
  minAmount: number;
  maxAmount: number;
  currency: string;
  requiredApproverRoles: UserRole[];
}
