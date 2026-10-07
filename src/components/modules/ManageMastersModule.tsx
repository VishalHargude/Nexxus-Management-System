import React, { useState } from 'react';
import { Settings, UserPlus, Building, ShieldPlus, Wrench, X } from 'lucide-react';
import { CompanyRecord, JobDetailMaster } from '../../types';
import { StorageService } from '../../utils/storage';

interface Props {
  onNavigateToTab: (tabId: string) => void;
  theme: 'dark' | 'light';
}

export const ManageMastersModule: React.FC<Props> = ({ onNavigateToTab, theme }) => {
  // Modal states
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [compType, setCompType] = useState<'company' | 'vendor'>('company');

  // New Company Form State
  const [newComp, setNewComp] = useState<CompanyRecord>({
    companyName: '',
    plant: '',
    address: '',
    mobile: '',
    email: '',
    shopAct: '',
    udyam: '',
    esic: '',
    pf: '',
    pan: '',
    gst: '',
    bankName: '',
    accountNo: '',
    ifsc: '',
  });

  // New Job Form State
  const [jobName, setJobName] = useState('');
  const [jobWeight, setJobWeight] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComp.companyName.trim()) {
      alert('Company Name is required!');
      return;
    }
    StorageService.addCompany(newComp);
    alert(`Organization "${newComp.companyName}" added successfully!`);
    setShowCompanyModal(false);
    setNewComp({
      companyName: '',
      plant: '',
      address: '',
      mobile: '',
      email: '',
      shopAct: '',
      udyam: '',
      esic: '',
      pf: '',
      pan: '',
      gst: '',
      bankName: '',
      accountNo: '',
      ifsc: '',
    });
  };

  const handleSaveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) {
      alert('Job Name is required!');
      return;
    }
    const wt = parseFloat(jobWeight) || 0;
    const newJob: JobDetailMaster = {
      srNo: 0,
      jobName: jobName.trim(),
      weight: wt,
    };
    StorageService.addJob(newJob);
    alert(`Job Type "${jobName}" with weight ${wt} KG saved!`);
    setShowJobModal(false);
    setJobName('');
    setJobWeight('');
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500] shadow-2xs';
  const labelClass = isDark ? 'text-slate-300 font-semibold' : 'text-slate-700 font-bold';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <span>Manage System Master Data & Configurations</span>
        </h3>
      </div>

      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        Choose what system master records you want to register or configure across the NEXXUS ERP database:
      </p>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Register New Employee */}
        <div
          onClick={() => onNavigateToTab('hrforms')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
            isDark
              ? 'bg-[#111928] border-slate-800 hover:border-[#FF8500]'
              : 'bg-white border-slate-200 hover:border-[#FF8500] shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF8500] mb-3">
            <UserPlus className="w-5 h-5" />
          </div>
          <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+ Register Employee</h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Fill 56-point employee master details, KYC, bank account, and joining forms.
          </p>
        </div>

        {/* Add Our Company / Branch */}
        <div
          onClick={() => {
            setCompType('company');
            setShowCompanyModal(true);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
            isDark
              ? 'bg-[#111928] border-slate-800 hover:border-emerald-400'
              : 'bg-white border-slate-200 hover:border-emerald-400 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-3">
            <Building className="w-5 h-5" />
          </div>
          <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+ Add Company (Our Org)</h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Add our new company, branch, plant (e.g. NEXXUS FACILITY Unit 2) with bank & GSTIN.
          </p>
        </div>

        {/* Add Vendor / Client (Customer) */}
        <div
          onClick={() => {
            setCompType('vendor');
            setShowCompanyModal(true);
          }}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
            isDark
              ? 'bg-[#111928] border-slate-800 hover:border-sky-400'
              : 'bg-white border-slate-200 hover:border-sky-400 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500 mb-3">
            <Building className="w-5 h-5" />
          </div>
          <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+ Add Vendor / Client</h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Register customer companies, client factories (Zepto, Supreme, Tata) for job work.
          </p>
        </div>

        {/* Add System User */}
        <div
          onClick={() => onNavigateToTab('users')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
            isDark
              ? 'bg-[#111928] border-slate-800 hover:border-purple-400'
              : 'bg-white border-slate-200 hover:border-purple-400 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-3">
            <ShieldPlus className="w-5 h-5" />
          </div>
          <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+ Add System User</h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Provision admin, manager, accountant, or supervisor login credentials.
          </p>
        </div>

        {/* Add Job Type */}
        <div
          onClick={() => setShowJobModal(true)}
          className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 hover:shadow-xl ${
            isDark
              ? 'bg-[#111928] border-slate-800 hover:border-amber-400'
              : 'bg-white border-slate-200 hover:border-amber-400 shadow-sm'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-3">
            <Wrench className="w-5 h-5" />
          </div>
          <h4 className={`font-bold text-xs mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>+ Add Job Type</h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Create engineering production jobs with preset unit weight (KG) for auto-calculation.
          </p>
        </div>
      </div>

      {/* Add Organization Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl text-xs max-h-[90vh] overflow-y-auto transition-colors ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className="font-bold text-sm text-[#FF8500] flex items-center gap-1.5">
                <Building className="w-4 h-4" />
                <span>
                  {compType === 'company'
                    ? 'Add Our Company / Branch (NEXXUS Org)'
                    : 'Add Vendor / Client Master (Customer / Grahak)'}
                </span>
              </h4>
              <button onClick={() => setShowCompanyModal(false)} className={`p-1 rounded cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Switcher */}
            <div className="flex items-center gap-2 mb-4 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <button
                type="button"
                onClick={() => setCompType('company')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  compType === 'company'
                    ? 'bg-emerald-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Our Company / Branch (Apan)
              </button>
              <button
                type="button"
                onClick={() => setCompType('vendor')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  compType === 'vendor'
                    ? 'bg-sky-500 text-black shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vendor / Client (Customer / Grahak)
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={`block mb-1 ${labelClass}`}>
                  {compType === 'company' ? 'Our Company / Branch Name *' : 'Vendor / Client Company Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={newComp.companyName}
                  onChange={(e) => setNewComp({ ...newComp, companyName: e.target.value })}
                  placeholder={compType === 'company' ? 'e.g. NEXXUS FACILITY - Pune Plant 2' : 'e.g. TATA AUTOCOMP SYSTEMS LTD'}
                  className={`w-full p-2 border rounded-lg font-bold uppercase ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Plant / Location</label>
                <input
                  type="text"
                  value={newComp.plant}
                  onChange={(e) => setNewComp({ ...newComp, plant: e.target.value })}
                  placeholder="e.g. Chakan Plant 2"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Contact Mobile</label>
                <input
                  type="text"
                  value={newComp.mobile}
                  onChange={(e) => setNewComp({ ...newComp, mobile: e.target.value })}
                  placeholder="10 Digits"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Email Address</label>
                <input
                  type="email"
                  value={newComp.email}
                  onChange={(e) => setNewComp({ ...newComp, email: e.target.value })}
                  placeholder="billing@company.com"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>GSTIN Number</label>
                <input
                  type="text"
                  value={newComp.gst}
                  onChange={(e) => setNewComp({ ...newComp, gst: e.target.value.toUpperCase() })}
                  placeholder="27AABC..."
                  className={`w-full p-2 border rounded-lg uppercase font-mono ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>PAN Number</label>
                <input
                  type="text"
                  value={newComp.pan}
                  onChange={(e) => setNewComp({ ...newComp, pan: e.target.value.toUpperCase() })}
                  placeholder="AABC..."
                  className={`w-full p-2 border rounded-lg uppercase font-mono ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Bank Name</label>
                <input
                  type="text"
                  value={newComp.bankName}
                  onChange={(e) => setNewComp({ ...newComp, bankName: e.target.value })}
                  placeholder="Bank of Maharashtra"
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Account Number</label>
                <input
                  type="text"
                  value={newComp.accountNo}
                  onChange={(e) => setNewComp({ ...newComp, accountNo: e.target.value })}
                  placeholder="Bank A/C No"
                  className={`w-full p-2 border rounded-lg font-mono ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>IFSC Code</label>
                <input
                  type="text"
                  value={newComp.ifsc}
                  onChange={(e) => setNewComp({ ...newComp, ifsc: e.target.value.toUpperCase() })}
                  placeholder="MAHB..."
                  className={`w-full p-2 border rounded-lg uppercase font-mono ${inputClass}`}
                />
              </div>
              <div className="col-span-2">
                <label className={`block mb-1 ${labelClass}`}>Full Registered Address</label>
                <textarea
                  rows={2}
                  value={newComp.address}
                  onChange={(e) => setNewComp({ ...newComp, address: e.target.value })}
                  placeholder="Plot No, MIDC Industrial Area..."
                  className={`w-full p-2 border rounded-lg ${inputClass}`}
                />
              </div>

              <div className={`col-span-2 flex justify-end gap-2.5 pt-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-orange px-6 py-2 text-xs font-black"
                >
                  Save Organization
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Job Type Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className={`w-full max-w-sm border rounded-2xl p-6 shadow-2xl text-xs transition-colors ${cardBg}`}>
            <h4 className="font-bold text-sm text-[#FF8500] mb-3 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> Add New Job Type & Weight
            </h4>

            <form onSubmit={handleSaveJob} className="space-y-3">
              <div>
                <label className={`block mb-1 ${labelClass}`}>Job Name / Description *</label>
                <input
                  type="text"
                  required
                  value={jobName}
                  onChange={(e) => setJobName(e.target.value)}
                  placeholder="e.g. 6CYL Cylinder Engine Block"
                  className={`w-full p-2 border rounded-lg font-bold ${inputClass}`}
                />
              </div>
              <div>
                <label className={`block mb-1 ${labelClass}`}>Standard Weight (KG per Unit) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={jobWeight}
                  onChange={(e) => setJobWeight(e.target.value)}
                  placeholder="e.g. 45.5"
                  className={`w-full p-2 border rounded-lg text-amber-500 font-mono font-bold ${inputClass}`}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-700/30">
                <button
                  type="button"
                  onClick={() => setShowJobModal(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-3d-orange px-6 py-2 text-xs font-black"
                >
                  Save Job Type
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
