import React, { useState, useEffect } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Clock,
  User,
  LogOut,
  Bell,
  Database,
  CheckCircle,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SystemUser, SystemNotification } from '../types';
import { StorageService } from '../utils/storage';

interface NavbarProps {
  currentUser: SystemUser;
  activeTabTitle: string;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTabTitle,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onLogout,
}) => {
  const [timeString, setTimeString] = useState('');
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const str =
        now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' +
        now.toLocaleTimeString();
      setTimeString(str);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNotifications(StorageService.getNotifications());
    const handler = () => setNotifications(StorageService.getNotifications());
    window.addEventListener('nexxus_storage_updated', handler);
    return () => window.removeEventListener('nexxus_storage_updated', handler);
  }, []);

  const unreadCount = notifications.filter((n) => n.status === 'Unread').length;

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = StorageService.restoreBackup(json);
        if (ok) {
          setRestoreStatus('Database restored successfully! Reloading...');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          setRestoreStatus('Failed to restore: Invalid backup structure.');
        }
      } catch {
        setRestoreStatus('Invalid JSON backup file.');
      }
    };
    reader.readAsText(file);
  };

  const isDark = theme === 'dark';

  return (
    <>
      <header
        className={`h-15 fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 md:px-5 border-b transition-colors ${
          isDark
            ? 'bg-[#0d1424] border-slate-800 text-white shadow-lg'
            : 'bg-white border-slate-200 text-slate-800 shadow-xs'
        }`}
      >
        {/* Left Section: Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg transition-colors focus:outline-none cursor-pointer ${
              isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'
            }`}
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 select-none">
            <span className="font-extrabold text-2xl tracking-wider flex items-center">
              <span className={`brand-nex ${isDark ? 'text-white drop-shadow' : 'text-[#0a1e3f] font-black'}`}>NEX</span>
              <span className="text-[#FF8500] mx-0.5 drop-shadow-[0_0_14px_rgba(255,133,0,0.85)] font-black">X</span>
              <span className={`brand-nex ${isDark ? 'text-white drop-shadow' : 'text-[#0a1e3f] font-black'}`}>US</span>
            </span>
            <span className={`text-[11px] uppercase font-bold hidden sm:inline tracking-widest pl-2.5 border-l ${
              isDark ? 'text-slate-300 border-white/20' : 'text-slate-500 border-slate-300'
            }`}>
              MANAGEMENT SYSTEM
            </span>
            <span className={`text-xs font-bold hidden md:inline ml-1 px-2.5 py-0.5 rounded-full border shadow-inner ${
              isDark
                ? 'text-[#FF8500] bg-black/40 border-white/10'
                : 'text-[#FF8500] bg-amber-500/10 border-amber-500/20'
            }`}>
              {activeTabTitle}
            </span>
          </div>
        </div>

        {/* Right Section: Theme Toggle, Clock, Notifications, Profile, Logout */}
        <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm">
          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border font-medium transition-colors cursor-pointer ${
              isDark
                ? 'border-white/20 hover:bg-white/10 text-white'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
            <span className="hidden sm:inline capitalize">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          {/* Database Backup / Restore button */}
          <button
            onClick={() => setShowBackupModal(true)}
            className={`hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
              isDark
                ? 'border-white/20 hover:bg-white/10 text-white'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
            title="Backup & Restore System Data"
          >
            <Database className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>Data</span>
          </button>

          {/* Live Clock */}
          <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full border font-mono text-xs tabular-nums shadow-inner ${
            isDark
              ? 'bg-black/40 border-white/10 text-amber-400'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <Clock className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{timeString}</span>
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(!showNotif)}
              className={`p-1.5 rounded-full relative transition-colors cursor-pointer ${
                isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-100 text-slate-700'
              }`}
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF8500] text-black font-bold text-[10px] flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotif && (
              <div
                className={`absolute right-0 mt-2 w-80 md:w-96 rounded-xl border p-3 shadow-2xl z-50 transition-colors ${
                  isDark
                    ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark'
                    : 'bg-white border-slate-200 text-slate-900 glow-card-light'
                }`}
              >
                <div className={`flex items-center justify-between pb-2 border-b mb-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex items-center gap-2 font-bold text-sm text-[#FF8500]">
                    <Bell className="w-4 h-4" />
                    <span>System Alerts & Notifications</span>
                  </div>
                  <button
                    onClick={() => setShowNotif(false)}
                    className={`p-1 rounded transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 text-xs">
                  {notifications.length === 0 ? (
                    <div className={`py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No new notifications</div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg border text-left transition-colors ${
                          isDark
                            ? 'bg-[#0a0f1d] border-slate-800/80 text-slate-200'
                            : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold mb-1">
                          <span className="text-[#FF8500] font-bold">{n.title}</span>
                          <span className={`text-[10px] tabular-nums ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{n.date}</span>
                        </div>
                        <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs ${
            isDark
              ? 'bg-black/40 border-white/10 text-white'
              : 'bg-slate-100 border-slate-200 text-slate-800'
          }`}>
            <User className="w-3.5 h-3.5 text-[#FF8500]" />
            <span className="max-w-[120px] md:max-w-[160px] truncate font-medium">
              {currentUser.userName}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-600/20 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white font-semibold transition-colors cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Database Backup & Restore Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
              theme === 'dark' ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${theme === 'dark' ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 font-bold text-lg text-[#FF8500]">
                <Database className="w-5 h-5" />
                <span>Backup & Restore System Data</span>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className={`p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs mb-4 leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Export your full NEXXUS database (Employees, Attendance, Invoices, Payroll, Expenses, Funds, Job Work) into
              a standalone JSON backup file, or restore data from an existing backup.
            </p>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                theme === 'dark' ? 'border-slate-800 bg-[#0a0f1d]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Export Full Database</h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Download all tables into a single JSON file</p>
                </div>
                <button
                  onClick={() => StorageService.exportFullBackup()}
                  className="px-4 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black font-bold text-xs transition-colors cursor-pointer"
                >
                  Download Backup
                </button>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                theme === 'dark' ? 'border-slate-800 bg-[#0a0f1d]' : 'border-slate-200 bg-slate-50'
              }`}>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Restore Database</h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Import records from JSON file</p>
                </div>
                <label className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors cursor-pointer">
                  Import File
                  <input type="file" accept=".json" onChange={handleRestoreFile} className="d-none hidden" />
                </label>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                theme === 'dark' ? 'border-rose-900/40 bg-rose-950/20' : 'border-rose-200 bg-rose-50/50'
              }`}>
                <div>
                  <h4 className="font-semibold text-sm text-rose-500 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Reset To Initial Data
                  </h4>
                  <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Clear all modifications and reload defaults</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all data to default demo state?')) {
                      StorageService.resetToDefaults();
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Reset Defaults
                </button>
              </div>

              {restoreStatus && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  theme === 'dark' ? 'bg-slate-800 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}>
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{restoreStatus}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
