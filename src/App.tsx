import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, TabId } from './components/Sidebar';
import { LoginView } from './components/LoginView';
import { AttendanceModule } from './components/modules/AttendanceModule';
import { TaxInvoiceModule } from './components/modules/TaxInvoiceModule';
import { InvoiceManagementModule } from './components/modules/InvoiceManagementModule';
import { JobWorkModule } from './components/modules/JobWorkModule';
import { PayrollModule } from './components/modules/PayrollModule';
import { EmployeesModule } from './components/modules/EmployeesModule';
import { HRFormsAndJoiningModule } from './components/modules/HRFormsAndJoiningModule';
import { InterviewsModule } from './components/modules/InterviewsModule';
import { ApprovalsModule } from './components/modules/ApprovalsModule';
import { ExpensesModule } from './components/modules/ExpensesModule';
import { FundsModule } from './components/modules/FundsModule';
import { BankDraftModule } from './components/modules/BankDraftModule';
import { ProfitLossModule } from './components/modules/ProfitLossModule';
import { UsersModule } from './components/modules/UsersModule';
import { ManageMastersModule } from './components/modules/ManageMastersModule';
import { SystemUser, CompanyRecord, Employee } from './types';
import { StorageService } from './utils/storage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    return StorageService.getLoggedUser();
  });

  const [activeTab, setActiveTab] = useState<TabId>(() => {
    return (localStorage.getItem('nexxus_active_tab') as TabId) || 'attendance';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return StorageService.getTheme();
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Live collections
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const loadData = () => {
    setCompanies(StorageService.getCompanies());
    setEmployees(StorageService.getEmployees());
    const approvals = StorageService.getApprovals();
    setPendingApprovalsCount(approvals.filter((a) => a.status === 'Pending').length);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('nexxus_storage_updated', loadData);
    return () => window.removeEventListener('nexxus_storage_updated', loadData);
  }, []);

  // Update theme on document root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#0b0f17';
      document.body.style.color = '#f1f5f9';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
      document.body.style.color = '#0f172a';
    }
  }, [theme]);

  // Save active tab in local storage
  const handleSelectTab = (tab: TabId) => {
    setActiveTab(tab);
    localStorage.setItem('nexxus_active_tab', tab);
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    StorageService.setTheme(next);
  };

  const handleLogout = () => {
    StorageService.setLoggedUser(null);
    setCurrentUser(null);
  };

  const tabTitleMap: Record<TabId, string> = {
    interviews: 'Interviews',
    hrforms: 'HR Forms',
    supreq: 'Pending Requests',
    attendance: 'Attendance',
    invoice: 'Tax Invoice',
    invoicemanagement: 'Invoice Management',
    jobwork: 'Job Work',
    payrollrecords: 'Payroll Records',
    empdirectory: 'Employees Master',
    approvals: 'Approvals',
    expense: 'Expenses',
    users: 'System Users',
    funds: 'Funds Ledger',
    draft: 'Bank Salary Letter',
    pl: 'P & L Statement',
    managedata: 'Manage Masters',
  };

  // If not logged in, show Login Screen
  if (!currentUser) {
    return <LoginView onLoginSuccess={(u) => setCurrentUser(u)} theme={theme} />;
  }

  const activeEmployeesCount = employees.filter((e) => e.status.toLowerCase() === 'active').length;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        theme === 'dark' ? 'bg-[#0a0f1d] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Top Fixed Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTabTitle={tabTitleMap[activeTab] || 'Dashboard'}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className="flex pt-15">
        {/* Fixed Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          collapsed={sidebarCollapsed}
          theme={theme}
          pendingRequestsCount={pendingApprovalsCount}
          userRole={currentUser.role}
        />

        {/* Main Content Viewport */}
        <main
          className={`flex-1 transition-all duration-300 p-4 md:p-6 min-h-[calc(100vh-60px)] ${
            sidebarCollapsed ? 'ml-18' : 'ml-60'
          }`}
        >
          {activeTab === 'attendance' && (
            <AttendanceModule
              companies={companies}
              employees={employees}
              theme={theme}
              currentUsername={currentUser.userName}
            />
          )}

          {activeTab === 'invoice' && (
            <TaxInvoiceModule companies={companies} theme={theme} />
          )}

          {activeTab === 'invoicemanagement' && (
            <InvoiceManagementModule theme={theme} />
          )}

          {activeTab === 'jobwork' && (
            <JobWorkModule
              companies={companies}
              employees={employees}
              theme={theme}
            />
          )}

          {activeTab === 'payrollrecords' && (
            <PayrollModule
              companies={companies}
              employees={employees}
              theme={theme}
            />
          )}

          {activeTab === 'empdirectory' && (
            <EmployeesModule companies={companies} theme={theme} />
          )}

          {activeTab === 'hrforms' && (
            <HRFormsAndJoiningModule
              companies={companies}
              employees={employees}
              theme={theme}
              currentUsername={currentUser.userName}
            />
          )}

          {activeTab === 'supreq' && (
            <ApprovalsModule
              theme={theme}
              onApprovalsUpdated={loadData}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsModule
              theme={theme}
              onApprovalsUpdated={loadData}
            />
          )}

          {activeTab === 'interviews' && (
            <InterviewsModule
              theme={theme}
              totalActiveEmployees={activeEmployeesCount}
            />
          )}

          {activeTab === 'expense' && (
            <ExpensesModule
              companies={companies}
              theme={theme}
              currentUsername={currentUser.userName}
            />
          )}

          {activeTab === 'funds' && <FundsModule theme={theme} />}

          {activeTab === 'draft' && (
            <BankDraftModule
              companies={companies}
              employees={employees}
              theme={theme}
            />
          )}

          {activeTab === 'pl' && <ProfitLossModule theme={theme} />}

          {activeTab === 'users' && (
            <UsersModule companies={companies} theme={theme} />
          )}

          {activeTab === 'managedata' && (
            <ManageMastersModule
              onNavigateToTab={(t) => handleSelectTab(t as TabId)}
              theme={theme}
            />
          )}
        </main>
      </div>

      {/* Global Auto-Complete Datalists */}
      <datalist id="companyDataList">
        {companies.map((c, i) => (
          <option key={i} value={c.companyName} />
        ))}
      </datalist>
      <datalist id="plantDataList">
        {Array.from(new Set(companies.map((c) => c.plant).filter(Boolean))).map((p, i) => (
          <option key={i} value={p} />
        ))}
      </datalist>
      <datalist id="employeeNamesList">
        {employees.map((e, i) => (
          <option key={i} value={e.fullName} />
        ))}
      </datalist>
    </div>
  );
}
