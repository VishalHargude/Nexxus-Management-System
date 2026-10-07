import React from 'react';
import {
  CalendarCheck,
  FileText,
  ListOrdered,
  ClipboardCheck,
  Receipt,
  Wallet,
  Wrench,
  BadgeIndianRupee,
  Users,
  CheckSquare,
  Coins,
  ShieldCheck,
  Landmark,
  FileCheck2,
  TrendingUp,
  Settings,
} from 'lucide-react';

export type TabId =
  | 'interviews'
  | 'hrforms'
  | 'supreq'
  | 'attendance'
  | 'invoice'
  | 'invoicemanagement'
  | 'jobwork'
  | 'payrollrecords'
  | 'empdirectory'
  | 'approvals'
  | 'expense'
  | 'users'
  | 'funds'
  | 'draft'
  | 'pl'
  | 'managedata';

interface SidebarProps {
  activeTab: TabId;
  onSelectTab: (tab: TabId) => void;
  collapsed: boolean;
  theme: 'dark' | 'light';
  pendingRequestsCount: number;
  userRole?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  theme,
  pendingRequestsCount,
  userRole = 'Admin',
}) => {
  const isAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase().includes('administrator');

  const navItems: { id: TabId; label: string; icon: React.ReactNode; badge?: number; adminOnly?: boolean }[] = [
    { id: 'interviews', label: 'Interviews', icon: <CalendarCheck className="w-4 h-4 text-[#FF8500]" /> },
    { id: 'hrforms', label: 'HR Forms', icon: <FileText className="w-4 h-4 text-sky-400" /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck className="w-4 h-4 text-emerald-400" /> },
    { id: 'invoice', label: 'Tax Invoice', icon: <Receipt className="w-4 h-4 text-[#FF8500]" /> },
    { id: 'invoicemanagement', label: 'Invoice Management', icon: <Wallet className="w-4 h-4 text-blue-400" /> },
    { id: 'jobwork', label: 'Job Work', icon: <Wrench className="w-4 h-4 text-[#FF8500]" /> },
    { id: 'payrollrecords', label: 'Payroll Records', icon: <BadgeIndianRupee className="w-4 h-4 text-amber-400" /> },
    { id: 'empdirectory', label: 'Employees Master', icon: <Users className="w-4 h-4 text-indigo-400" /> },
    {
      id: 'approvals',
      label: 'Approvals & Requests',
      icon: <CheckSquare className="w-4 h-4 text-rose-400" />,
      badge: pendingRequestsCount,
    },
    { id: 'expense', label: 'Expenses', icon: <Coins className="w-4 h-4 text-emerald-400" /> },
    { id: 'draft', label: 'Bank Salary Letter', icon: <FileCheck2 className="w-4 h-4 text-[#FF8500]" /> },
    { id: 'funds', label: 'Funds Ledger', icon: <Landmark className="w-4 h-4 text-amber-400" /> },
    { id: 'pl', label: 'P & L Statement', icon: <TrendingUp className="w-4 h-4 text-teal-400" />, adminOnly: true },
    { id: 'users', label: 'System Users', icon: <ShieldCheck className="w-4 h-4 text-purple-400" />, adminOnly: true },
    { id: 'managedata', label: 'Manage Masters', icon: <Settings className="w-4 h-4 text-slate-400" /> },
  ];

  return (
    <aside
      className={`fixed top-15 left-0 bottom-0 z-40 transition-all duration-300 border-r overflow-y-auto select-none ${
        collapsed ? 'w-18' : 'w-60'
      } ${
        theme === 'dark'
          ? 'bg-[#0d1424] border-slate-800 text-slate-200 shadow-xl'
          : 'bg-white border-slate-200/90 text-slate-800 shadow-[2px_0_12px_rgba(0,0,0,0.03)]'
      }`}
    >
      <div className="p-2 space-y-1">
        {!collapsed && (
          <div className="text-[11px] font-extrabold uppercase tracking-widest px-3 py-2 text-[#FF8500] opacity-95">
            Main Modules
          </div>
        )}

        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.label}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all cursor-pointer ${
                collapsed ? 'justify-center' : 'justify-start'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-[#FF8500] to-[#ffa333] text-black font-extrabold shadow-md scale-[1.02]'
                  : theme === 'dark'
                  ? 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-900'
              }`}
            >
              <span className={`shrink-0 ${isActive ? 'text-black' : ''}`}>{item.icon}</span>
              {!collapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-black text-[#FF8500]' : 'bg-[#FF8500] text-black'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
