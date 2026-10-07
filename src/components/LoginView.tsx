import React, { useState } from 'react';
import { User, KeyRound, ArrowRight, ShieldCheck, Mail, Phone } from 'lucide-react';
import { SystemUser } from '../types';
import { StorageService } from '../utils/storage';

interface LoginViewProps {
  onLoginSuccess: (user: SystemUser) => void;
  theme: 'dark' | 'light';
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess, theme }) => {
  const [userId, setUserId] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password & reset password modals
  const [showForgot, setShowForgot] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const [fpUserId, setFpUserId] = useState('');
  const [fpMobile, setFpMobile] = useState('');
  const [fpEmail, setFpEmail] = useState('');
  const [fpSuccessMsg, setFpSuccessMsg] = useState('');

  const [rpUserId, setRpUserId] = useState('');
  const [rpOldPass, setRpOldPass] = useState('');
  const [rpNewPass, setRpNewPass] = useState('');
  const [rpConfirmPass, setRpConfirmPass] = useState('');
  const [rpSuccessMsg, setRpSuccessMsg] = useState('');
  const [rpErrorMsg, setRpErrorMsg] = useState('');

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const cleanId = userId.trim().toLowerCase();
      const cleanPass = password.trim();

      if (!cleanId || !cleanPass) {
        setErrorMsg('Please enter both User ID and Password.');
        return;
      }

      // Check users database
      const users = StorageService.getUsers();
      const found = users.find(
        (u) =>
          u.userId.toLowerCase() === cleanId &&
          (u.password === cleanPass || (cleanId === 'admin' && cleanPass === 'admin'))
      );

      if (found) {
        if (found.status === 'Inactive') {
          setErrorMsg('This account is currently inactive. Please contact administration.');
          return;
        }
        StorageService.setLoggedUser(found);
        onLoginSuccess(found);
      } else if (cleanId === 'admin' && cleanPass === 'admin') {
        const defaultAdmin: SystemUser = {
          srNo: 1,
          userId: 'admin',
          userName: 'System Administrator',
          role: 'Admin',
          department: 'Management',
          accessLevel: 'Full Access',
          assignedPlant: 'All Plants',
          status: 'Active',
          mobile: '9876543210',
          email: 'admin@nexxus.com',
        };
        StorageService.setLoggedUser(defaultAdmin);
        onLoginSuccess(defaultAdmin);
      } else {
        setErrorMsg('Invalid User ID or Password. (Hint: use admin / admin)');
      }
    }, 400);
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const users = StorageService.getUsers();
    const cleanId = fpUserId.trim().toLowerCase();
    const cleanMob = fpMobile.replace(/\D/g, '');
    const cleanMail = fpEmail.trim().toLowerCase();

    const matched = users.find(
      (u) =>
        u.userId.toLowerCase() === cleanId &&
        u.mobile.replace(/\D/g, '') === cleanMob &&
        u.email.toLowerCase() === cleanMail
    );

    if (matched) {
      setFpSuccessMsg(`Password reset instructions sent to ${matched.email}! (Your current pass: ${matched.password || 'admin'})`);
    } else {
      setFpSuccessMsg('Details match verification failed. Check ID, Mobile & Email.');
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRpErrorMsg('');
    if (rpNewPass !== rpConfirmPass) {
      setRpErrorMsg('New passwords do not match!');
      return;
    }
    if (rpNewPass.length < 4) {
      setRpErrorMsg('Password must be at least 4 characters long.');
      return;
    }
    const users = StorageService.getUsers();
    const cleanId = rpUserId.trim().toLowerCase();
    const idx = users.findIndex((u) => u.userId.toLowerCase() === cleanId);
    if (idx !== -1) {
      users[idx].password = rpNewPass;
      StorageService.saveUsers(users);
      setRpSuccessMsg('Password updated successfully! You can now sign in.');
    } else {
      setRpErrorMsg('User ID not found in system.');
    }
  };

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors ${
        theme === 'dark' ? 'bg-[#0b0f17] text-white' : 'bg-[#f1f5f9] text-slate-900'
      }`}
    >
      <div
        className={`w-full max-w-md border rounded-2xl p-8 shadow-2xl relative overflow-hidden transition-all ${
          theme === 'dark'
            ? 'bg-[#131b26] border-neutral-700/80'
            : 'bg-white border-slate-200'
        }`}
      >
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1A365D] via-[#FF8500] to-[#1A365D]" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-wide mb-1 select-none flex items-center justify-center">
            <span className={theme === 'dark' ? 'text-white drop-shadow' : 'text-[#1A365D]'}>NEX</span>
            <span className="text-[#FF8500] mx-0.5 drop-shadow-[0_0_12px_rgba(255,133,0,0.85)] font-black text-4xl">X</span>
            <span className={theme === 'dark' ? 'text-white drop-shadow' : 'text-[#1A365D]'}>US</span>
          </h1>
          <p
            className={`text-xs font-bold tracking-widest uppercase mt-1 ${
              theme === 'dark' ? 'text-neutral-400' : 'text-slate-600'
            }`}
          >
            Management System Dashboard
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs text-center font-bold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                theme === 'dark' ? 'text-neutral-300' : 'text-slate-700'
              }`}
            >
              User ID
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="e.g. admin or 1001"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#FF8500] focus:ring-1 focus:ring-[#FF8500] transition-colors ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
                autoFocus
              />
            </div>
          </div>

          <div>
            <label
              className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${
                theme === 'dark' ? 'text-neutral-300' : 'text-slate-700'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:border-[#FF8500] focus:ring-1 focus:ring-[#FF8500] transition-colors ${
                  theme === 'dark'
                    ? 'bg-neutral-900 border-neutral-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-1">
            <button
              type="button"
              onClick={() => {
                setShowReset(true);
                setRpSuccessMsg('');
                setRpErrorMsg('');
              }}
              className={`hover:text-[#FF8500] transition-colors cursor-pointer ${
                theme === 'dark' ? 'text-neutral-400' : 'text-slate-500'
              }`}
            >
              Reset Password
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForgot(true);
                setFpSuccessMsg('');
              }}
              className="text-[#FF8500] hover:underline cursor-pointer font-bold"
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-[#FF8500]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full" />
            ) : (
              <>
                <span>SIGN IN</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Fill */}
        <div
          className={`mt-8 pt-5 border-t text-center ${
            theme === 'dark' ? 'border-neutral-800' : 'border-slate-200'
          }`}
        >
          <p className="text-[11px] text-neutral-400 mb-2 font-semibold">Quick Demo Login:</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setUserId('admin');
                setPassword('admin');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              admin / admin
            </button>
            <button
              onClick={() => {
                setUserId('1001');
                setPassword('1234');
              }}
              className={`px-3 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              1001 (Supervisor)
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl transition-all ${
              theme === 'dark' ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light'
            }`}
          >
            <h3 className="font-bold text-lg text-[#FF8500] mb-2 flex items-center gap-2">
              <Mail className="w-5 h-5" /> Forgot Password
            </h3>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter registered details to verify your account and retrieve password instructions.
            </p>

            {fpSuccessMsg ? (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs leading-relaxed font-semibold">
                {fpSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>User ID</label>
                  <input
                    type="text"
                    required
                    value={fpUserId}
                    onChange={(e) => setFpUserId(e.target.value)}
                    placeholder="e.g. admin or 1001"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Registered Mobile Number</label>
                  <input
                    type="text"
                    required
                    value={fpMobile}
                    onChange={(e) => setFpMobile(e.target.value)}
                    placeholder="10 digit mobile"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Registered Email ID</label>
                  <input
                    type="email"
                    required
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    placeholder="e.g. user@example.com"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black text-xs font-bold cursor-pointer"
                  >
                    Verify & Send
                  </button>
                </div>
              </form>
            )}

            {fpSuccessMsg && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowForgot(false)}
                  className="px-4 py-2 rounded-lg bg-[#FF8500] text-black text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-md border rounded-2xl p-6 shadow-2xl transition-all ${
              theme === 'dark' ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light'
            }`}
          >
            <h3 className="font-bold text-lg text-[#FF8500] mb-2 flex items-center gap-2">
              <KeyRound className="w-5 h-5" /> Reset / Change Password
            </h3>
            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              Enter your user ID, current password, and your desired new password.
            </p>

            {rpErrorMsg && (
              <div className="p-2.5 mb-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold">
                {rpErrorMsg}
              </div>
            )}

            {rpSuccessMsg ? (
              <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                {rpSuccessMsg}
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>User ID</label>
                  <input
                    type="text"
                    required
                    value={rpUserId}
                    onChange={(e) => setRpUserId(e.target.value)}
                    placeholder="Enter User ID"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Old Password</label>
                  <input
                    type="password"
                    required
                    value={rpOldPass}
                    onChange={(e) => setRpOldPass(e.target.value)}
                    placeholder="Enter old password"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>New Password</label>
                  <input
                    type="password"
                    required
                    value={rpNewPass}
                    onChange={(e) => setRpNewPass(e.target.value)}
                    placeholder="Enter new password"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={rpConfirmPass}
                    onChange={(e) => setRpConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    className={`w-full px-3 py-2 border rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-[#0a0f1d] border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReset(false)}
                    className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                      theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[#FF8500] hover:bg-[#e07500] text-black text-xs font-bold cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            )}

            {rpSuccessMsg && (
              <div className="mt-4 text-right">
                <button
                  onClick={() => setShowReset(false)}
                  className="px-4 py-2 rounded-lg bg-[#FF8500] text-black text-xs font-bold cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
