
import { User, ExpenseCategory, ApproverMatrix } from './types';

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'SGD', 'MYR', 'AUD', 'CAD'];

export const DEFAULT_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Alex Rivera', 
    email: 'alex@finance.com', 
    role: 'Employee',
    accessibleModules: ['dashboard', 'new-claim'],
    isActive: true
  },
  { 
    id: 'u2', 
    name: 'Sarah Chen', 
    email: 'sarah@finance.com', 
    role: 'Manager',
    accessibleModules: ['dashboard', 'new-claim', 'approvals'],
    isActive: true
  },
  { 
    id: 'u3', 
    name: 'Marcus Thorne', 
    email: 'marcus@finance.com', 
    role: 'Finance',
    accessibleModules: ['dashboard', 'approvals', 'export'],
    isActive: true
  },
  { 
    id: 'u4', 
    name: 'System Admin', 
    email: 'admin@finance.com', 
    role: 'Admin',
    accessibleModules: ['dashboard', 'new-claim', 'approvals', 'export', 'settings'],
    isActive: true
  },
];

export const DEFAULT_CATEGORIES: ExpenseCategory[] = [
  { id: 'c1', name: 'Airfare & Travel', glCode: '60110' },
  { id: 'c2', name: 'Hotel & Lodging', glCode: '60120' },
  { id: 'c3', name: 'Business Meals', glCode: '60210' },
  { id: 'c4', name: 'Client Entertainment', glCode: '60220' },
  { id: 'c5', name: 'Office Equipment', glCode: '60310' },
  { id: 'c6', name: 'SaaS Subscriptions', glCode: '60410' },
];

export const INITIAL_APPROVER_MATRIX: ApproverMatrix[] = [
  { id: 'm1', minAmount: 0, maxAmount: 500, currency: 'USD', requiredApproverRoles: ['Manager'] },
  { id: 'm2', minAmount: 501, maxAmount: 5000, currency: 'USD', requiredApproverRoles: ['Manager', 'Finance'] },
  { id: 'm3', minAmount: 5001, maxAmount: Infinity, currency: 'USD', requiredApproverRoles: ['Manager', 'Finance'] },
];
