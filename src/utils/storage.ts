import {
  CompanyRecord,
  Employee,
  AttendanceRecord,
  TaxInvoice,
  InvoicePayment,
  JobWorkRecord,
  PayrollRecord,
  ExpenseRecord,
  JobDetailMaster,
  InterviewCandidate,
  PendingApprovalRequest,
  FundTransaction,
  SystemUser,
  SystemNotification,
} from '../types';
import {
  INITIAL_COMPANIES,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PAYROLL,
  INITIAL_EXPENSES,
  INITIAL_JOBS,
  INITIAL_JOBWORK,
  INITIAL_FUNDS,
  INITIAL_INTERVIEWS,
  INITIAL_APPROVALS,
  INITIAL_USERS,
  INITIAL_NOTIFICATIONS,
} from '../data/initialData';

const STORAGE_KEYS = {
  COMPANIES: 'nexxus_companies',
  EMPLOYEES: 'nexxus_employees',
  ATTENDANCE: 'nexxus_attendance',
  INVOICES: 'nexxus_invoices',
  PAYMENTS: 'nexxus_payments',
  PAYROLL: 'nexxus_payroll',
  EXPENSES: 'nexxus_expenses',
  EXPENSE_CATEGORIES: 'nexxus_expense_categories',
  JOBS: 'nexxus_jobs',
  JOBWORK: 'nexxus_jobwork',
  FUNDS: 'nexxus_funds',
  INTERVIEWS: 'nexxus_interviews',
  APPROVALS: 'nexxus_approvals',
  USERS: 'nexxus_users',
  NOTIFICATIONS: 'nexxus_notifications',
  LOGGED_USER: 'nexxus_logged_user',
  THEME: 'nexxus_theme',
};

function sanitizeLegacyText(raw: string): string {
  if (!raw || !raw.toLowerCase().includes('sanaswadi')) return raw;
  return raw
    .replace(/At Post Sanaswadi, Tal\. Shirur, Dist\. Pune - 412208/gi, 'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013')
    .replace(/Gat No\. 345, Sanaswadi Industrial Area, Tal\. Shirur, Pune - 412208/gi, 'Plot No. 18, Bhosari MIDC, Pune, Maharashtra - 411026')
    .replace(/Gat No\. 120, Sanaswadi, Tal\. Shirur, Dist\. Pune - 412208/gi, 'Plot No. 120, Kharadi, Pune, Maharashtra - 411014')
    .replace(/Sanaswadi Plant/gi, 'Pune Plant')
    .replace(/Sanaswadi Unit 2/gi, 'Pune Unit 2')
    .replace(/Sanaswadi, Pune/gi, 'Pune, Maharashtra')
    .replace(/Sanaswadi/gi, 'Pune');
}

function getFromStorage<T>(key: string, fallback: T): T {
  try {
    let raw = localStorage.getItem(key);
    if (!raw) return fallback;
    if (raw.toLowerCase().includes('sanaswadi')) {
      raw = sanitizeLegacyText(raw);
      localStorage.setItem(key, raw);
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('nexxus_storage_updated'));
  } catch (e) {
    console.error('Storage write error:', e);
  }
}

export const StorageService = {
  getCompanies: (): CompanyRecord[] => getFromStorage(STORAGE_KEYS.COMPANIES, INITIAL_COMPANIES),
  saveCompanies: (data: CompanyRecord[]) => saveToStorage(STORAGE_KEYS.COMPANIES, data),
  addCompany: (comp: CompanyRecord) => {
    const list = StorageService.getCompanies();
    list.unshift(comp);
    StorageService.saveCompanies(list);
  },

  getEmployees: (): Employee[] => getFromStorage(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
  saveEmployees: (data: Employee[]) => saveToStorage(STORAGE_KEYS.EMPLOYEES, data),
  saveOrUpdateEmployee: (emp: Employee) => {
    const list = StorageService.getEmployees();
    const idx = list.findIndex(e => e.empId === emp.empId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...emp };
    } else {
      emp.srNo = list.length + 1;
      emp.rowIndex = list.length + 2;
      list.unshift(emp);
    }
    StorageService.saveEmployees(list);
  },
  deleteEmployee: (empId: string) => {
    const list = StorageService.getEmployees().filter(e => e.empId !== empId);
    StorageService.saveEmployees(list);
  },

  getAttendance: (): AttendanceRecord[] => getFromStorage(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
  saveAttendance: (data: AttendanceRecord[]) => saveToStorage(STORAGE_KEYS.ATTENDANCE, data),
  addAttendanceRows: (rows: AttendanceRecord[]) => {
    const list = StorageService.getAttendance();
    const startSr = list.length + 1;
    rows.forEach((r, idx) => {
      r.srNo = startSr + idx;
      list.unshift(r);
    });
    StorageService.saveAttendance(list);
  },

  getInvoices: (): TaxInvoice[] => getFromStorage(STORAGE_KEYS.INVOICES, INITIAL_INVOICES),
  saveInvoices: (data: TaxInvoice[]) => saveToStorage(STORAGE_KEYS.INVOICES, data),
  addInvoice: (inv: TaxInvoice) => {
    const list = StorageService.getInvoices();
    list.unshift(inv);
    StorageService.saveInvoices(list);
  },

  getPayments: (): InvoicePayment[] => getFromStorage(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS),
  savePayments: (data: InvoicePayment[]) => saveToStorage(STORAGE_KEYS.PAYMENTS, data),
  addPayment: (p: InvoicePayment) => {
    const list = StorageService.getPayments();
    list.unshift(p);
    StorageService.savePayments(list);
  },
  deletePayment: (paymentId: string) => {
    const list = StorageService.getPayments().filter(p => p.paymentId !== paymentId);
    StorageService.savePayments(list);
  },

  getPayroll: (): PayrollRecord[] => getFromStorage(STORAGE_KEYS.PAYROLL, INITIAL_PAYROLL),
  savePayroll: (data: PayrollRecord[]) => saveToStorage(STORAGE_KEYS.PAYROLL, data),
  saveOrUpdatePayroll: (rec: PayrollRecord) => {
    const list = StorageService.getPayroll();
    const idx = list.findIndex(r => r.eCode === rec.eCode && r.salaryMonth === rec.salaryMonth);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...rec };
    } else {
      rec.rowIndex = list.length + 2;
      rec.srNo = list.length + 1;
      list.unshift(rec);
    }
    StorageService.savePayroll(list);
  },
  deletePayroll: (rowIndex: number) => {
    const list = StorageService.getPayroll().filter(r => r.rowIndex !== rowIndex);
    StorageService.savePayroll(list);
  },

  getExpenses: (): ExpenseRecord[] => getFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (data: ExpenseRecord[]) => saveToStorage(STORAGE_KEYS.EXPENSES, data),
  addExpenses: (records: ExpenseRecord[]) => {
    const list = StorageService.getExpenses();
    records.forEach(r => list.unshift(r));
    StorageService.saveExpenses(list);
  },
  deleteExpense: (id: string | number) => {
    const list = StorageService.getExpenses().filter(e => String(e.id) !== String(id));
    StorageService.saveExpenses(list);
  },

  getExpenseCategories: (): string[] =>
    getFromStorage(STORAGE_KEYS.EXPENSE_CATEGORIES, [
      'Raw Material',
      'Labor/Wages',
      'Transportation',
      'Electricity Bill',
      'Maintenance',
      'Office Supplies',
      'Miscellaneous',
    ]),
  addExpenseCategory: (cat: string) => {
    const cats = StorageService.getExpenseCategories();
    if (!cats.includes(cat)) {
      cats.push(cat);
      saveToStorage(STORAGE_KEYS.EXPENSE_CATEGORIES, cats);
    }
  },

  getJobs: (): JobDetailMaster[] => getFromStorage(STORAGE_KEYS.JOBS, INITIAL_JOBS),
  addJob: (job: JobDetailMaster) => {
    const list = StorageService.getJobs();
    job.srNo = list.length + 1;
    list.unshift(job);
    saveToStorage(STORAGE_KEYS.JOBS, list);
  },

  getJobWork: (): JobWorkRecord[] => getFromStorage(STORAGE_KEYS.JOBWORK, INITIAL_JOBWORK),
  saveJobWork: (data: JobWorkRecord[]) => saveToStorage(STORAGE_KEYS.JOBWORK, data),
  addJobWork: (records: JobWorkRecord[]) => {
    const list = StorageService.getJobWork();
    records.forEach((r, idx) => {
      r.srNo = list.length + 1 + idx;
      r.rowIndex = list.length + 2 + idx;
      list.unshift(r);
    });
    StorageService.saveJobWork(list);
  },
  deleteJobWork: (rowIndex: number) => {
    const list = StorageService.getJobWork().filter(r => r.rowIndex !== rowIndex);
    StorageService.saveJobWork(list);
  },

  getFunds: (): FundTransaction[] => getFromStorage(STORAGE_KEYS.FUNDS, INITIAL_FUNDS),
  saveFunds: (data: FundTransaction[]) => saveToStorage(STORAGE_KEYS.FUNDS, data),
  addFundTransaction: (tx: FundTransaction) => {
    const list = StorageService.getFunds();
    list.unshift(tx);
    StorageService.saveFunds(list);
  },
  deleteFundTransaction: (txId: string) => {
    const list = StorageService.getFunds().filter(t => t.txId !== txId);
    StorageService.saveFunds(list);
  },

  getInterviews: (): InterviewCandidate[] => getFromStorage(STORAGE_KEYS.INTERVIEWS, INITIAL_INTERVIEWS),
  saveInterviews: (data: InterviewCandidate[]) => saveToStorage(STORAGE_KEYS.INTERVIEWS, data),
  addInterviews: (records: InterviewCandidate[]) => {
    const list = StorageService.getInterviews();
    records.forEach(r => list.unshift(r));
    StorageService.saveInterviews(list);
  },
  deleteInterview: (id: string) => {
    const list = StorageService.getInterviews().filter(c => c.id !== id);
    StorageService.saveInterviews(list);
  },

  getApprovals: (): PendingApprovalRequest[] => getFromStorage(STORAGE_KEYS.APPROVALS, INITIAL_APPROVALS),
  saveApprovals: (data: PendingApprovalRequest[]) => saveToStorage(STORAGE_KEYS.APPROVALS, data),
  addApproval: (req: PendingApprovalRequest) => {
    const list = StorageService.getApprovals();
    list.unshift(req);
    StorageService.saveApprovals(list);
  },

  getUsers: (): SystemUser[] => getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS),
  saveUsers: (data: SystemUser[]) => saveToStorage(STORAGE_KEYS.USERS, data),
  saveOrUpdateUser: (user: SystemUser) => {
    const list = StorageService.getUsers();
    const idx = list.findIndex(u => u.userId.toLowerCase() === user.userId.toLowerCase());
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...user };
    } else {
      user.srNo = list.length + 1;
      user.rowIndex = list.length + 2;
      list.unshift(user);
    }
    StorageService.saveUsers(list);
  },
  deleteUser: (userId: string) => {
    const list = StorageService.getUsers().filter(u => u.userId !== userId);
    StorageService.saveUsers(list);
  },

  getNotifications: (): SystemNotification[] => getFromStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
  addNotification: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const list = StorageService.getNotifications();
    list.unshift({
      id: 'NOTIF-' + Date.now(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      title,
      message,
      type,
      status: 'Unread',
    });
    saveToStorage(STORAGE_KEYS.NOTIFICATIONS, list);
  },

  // Auth & Session
  getLoggedUser: (): SystemUser | null => getFromStorage(STORAGE_KEYS.LOGGED_USER, null),
  setLoggedUser: (user: SystemUser | null) => {
    if (user) {
      saveToStorage(STORAGE_KEYS.LOGGED_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGGED_USER);
      window.dispatchEvent(new Event('nexxus_storage_updated'));
    }
  },

  getTheme: (): 'dark' | 'light' => (localStorage.getItem(STORAGE_KEYS.THEME) as 'dark' | 'light') || 'dark',
  setTheme: (theme: 'dark' | 'light') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    window.dispatchEvent(new Event('nexxus_storage_updated'));
  },

  // Database Backup & Restore
  exportFullBackup: () => {
    const backup = {
      companies: StorageService.getCompanies(),
      employees: StorageService.getEmployees(),
      attendance: StorageService.getAttendance(),
      invoices: StorageService.getInvoices(),
      payments: StorageService.getPayments(),
      payroll: StorageService.getPayroll(),
      expenses: StorageService.getExpenses(),
      expenseCategories: StorageService.getExpenseCategories(),
      jobs: StorageService.getJobs(),
      jobWork: StorageService.getJobWork(),
      funds: StorageService.getFunds(),
      interviews: StorageService.getInterviews(),
      approvals: StorageService.getApprovals(),
      users: StorageService.getUsers(),
      exportDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NEXXUS_Database_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  restoreBackup: (jsonData: any): boolean => {
    try {
      if (jsonData.companies) StorageService.saveCompanies(jsonData.companies);
      if (jsonData.employees) StorageService.saveEmployees(jsonData.employees);
      if (jsonData.attendance) StorageService.saveAttendance(jsonData.attendance);
      if (jsonData.invoices) StorageService.saveInvoices(jsonData.invoices);
      if (jsonData.payments) StorageService.savePayments(jsonData.payments);
      if (jsonData.payroll) StorageService.savePayroll(jsonData.payroll);
      if (jsonData.expenses) StorageService.saveExpenses(jsonData.expenses);
      if (jsonData.jobs) saveToStorage(STORAGE_KEYS.JOBS, jsonData.jobs);
      if (jsonData.jobWork) StorageService.saveJobWork(jsonData.jobWork);
      if (jsonData.funds) StorageService.saveFunds(jsonData.funds);
      if (jsonData.interviews) StorageService.saveInterviews(jsonData.interviews);
      if (jsonData.approvals) StorageService.saveApprovals(jsonData.approvals);
      if (jsonData.users) StorageService.saveUsers(jsonData.users);
      return true;
    } catch {
      return false;
    }
  },

  resetToDefaults: () => {
    localStorage.clear();
    window.location.reload();
  },
};
