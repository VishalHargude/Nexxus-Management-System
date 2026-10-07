import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  X,
  FileCheck,
} from 'lucide-react';
import { PendingApprovalRequest, Employee } from '../../types';
import { StorageService } from '../../utils/storage';

interface Props {
  theme: 'dark' | 'light';
  onApprovalsUpdated: () => void;
}

export const ApprovalsModule: React.FC<Props> = ({ theme, onApprovalsUpdated }) => {
  const [approvals, setApprovals] = useState<PendingApprovalRequest[]>([]);
  const [reviewReq, setReviewReq] = useState<PendingApprovalRequest | null>(null);

  useEffect(() => {
    const load = () => setApprovals(StorageService.getApprovals());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const pendingList = approvals.filter((a) => a.status === 'Pending');

  const handleApprove = (req: PendingApprovalRequest) => {
    if (!confirm(`Are you sure you want to approve changes for ${req.name}? This will update the main Employee Master database.`)) {
      return;
    }

    // Update in Approvals list
    const updated = approvals.map((a) =>
      a.rowIndex === req.rowIndex ? { ...a, status: 'Approved' as const } : a
    );
    StorageService.saveApprovals(updated);

    // Sync into Employee Master
    const raw = req.fullData || [];
    const newEmp: Employee = {
      empId: req.empId || String(raw[1] || '1000'),
      fullName: req.name || String(raw[2] || ''),
      fatherName: String(raw[3] || ''),
      motherName: String(raw[4] || ''),
      dob: String(raw[5] || '1998-01-01'),
      gender: String(raw[6] || 'Male'),
      bloodGroup: String(raw[7] || 'B+'),
      marital: String(raw[8] || 'Single'),
      noOfChildren: String(raw[9] || '0'),
      mobile: String(raw[10] || '9876543210'),
      altMobile: String(raw[11] || ''),
      email: String(raw[12] || ''),
      photo: String(raw[13] || ''),
      address: String(raw[14] || ''),
      village: String(raw[15] || ''),
      taluka: String(raw[16] || ''),
      district: String(raw[17] || ''),
      state: String(raw[18] || 'Maharashtra'),
      pincode: String(raw[19] || ''),
      aadhaar: String(raw[20] || ''),
      pan: String(raw[21] || ''),
      pfNo: String(raw[22] || ''),
      uan: String(raw[23] || ''),
      esic: String(raw[24] || ''),
      esicIp: String(raw[25] || ''),
      company: String(raw[26] || 'NEXXUS FACILITY'),
      plant: String(raw[27] || 'Main Plant'),
      department: String(raw[28] || 'Operations'),
      designation: String(raw[29] || 'Worker'),
      empType: String(raw[30] || 'Permanent'),
      joinDate: String(raw[31] || new Date().toISOString().split('T')[0]),
      status: 'Active',
      leaveDate: String(raw[33] || ''),
      leaveReason: String(raw[34] || ''),
      bankName: String(raw[35] || 'State Bank of India'),
      accHolder: String(raw[36] || req.name),
      accNo: String(raw[37] || ''),
      branchName: String(raw[38] || ''),
      ifsc: String(raw[39] || 'SBIN0001234'),
      payType: String(raw[40] || 'Bank Transfer'),
      salType: String(raw[41] || 'Monthly Salary'),
      basicRate: parseFloat(String(raw[42] || 20000)),
      otRate: parseFloat(String(raw[43] || 90)),
      payCycle: String(raw[44] || 'Monthly'),
      emgName: String(raw[45] || ''),
      emgRel: String(raw[46] || ''),
      emgMobile: String(raw[47] || ''),
      emgAddress: String(raw[48] || ''),
      qualification: String(raw[49] || ''),
      experience: String(raw[50] || ''),
      prevCompany: String(raw[51] || ''),
      skillType: String(raw[52] || ''),
      uniformSize: String(raw[53] || 'M'),
      shoesSize: String(raw[54] || '8'),
      remark: String(raw[55] || 'Approved by HR'),
    };

    StorageService.saveOrUpdateEmployee(newEmp);
    StorageService.addNotification(
      'Form Approved',
      `Employee registration for ${req.name} (${req.empId}) approved by HR and synced into Employee Master.`,
      'success'
    );

    setReviewReq(null);
    onApprovalsUpdated();
    alert(`Form approved successfully! ${req.name} is now in Employee Master.`);
  };

  const handleReject = (req: PendingApprovalRequest) => {
    const reason = prompt('Please enter decline / rejection reason:');
    if (reason === null) return;

    const updated = approvals.map((a) =>
      a.rowIndex === req.rowIndex
        ? { ...a, status: 'Rejected' as const, rejectReason: reason }
        : a
    );
    StorageService.saveApprovals(updated);
    StorageService.addNotification(
      'Form Rejected / Sent Back',
      `Registration request for ${req.name} rejected with reason: ${reason}`,
      'warning'
    );
    setReviewReq(null);
    onApprovalsUpdated();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          <span>Pending Approvals & Verification Queue</span>
        </h3>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-xs text-left min-w-[900px]">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-1.5 px-2 text-center w-10">Sr</th>
              <th className="py-1.5 px-2 w-28">Emp ID</th>
              <th className="py-1.5 px-2 w-48">Employee Name</th>
              <th className="py-1.5 px-2 text-center w-20">Action</th>
              <th className="py-1.5 px-2 w-32">Requested By</th>
              <th className="py-1.5 px-2 w-32">Timestamp</th>
              <th className="py-1.5 px-2 text-center w-40">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800 bg-neutral-900/40">
            {pendingList.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-80" />
                  <span>No Pending Approvals! All clear.</span>
                </td>
              </tr>
            ) : (
              pendingList.map((req, idx) => (
                <tr key={req.rowIndex} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="py-1 px-2 text-center text-neutral-400 font-bold">{idx + 1}</td>
                  <td className="py-1 px-2 font-mono font-bold text-white">{req.empId}</td>
                  <td className="py-1 px-2 font-bold text-sky-400 capitalize">{req.name}</td>
                  <td className="py-1 px-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        req.action === 'New'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {req.action}
                    </span>
                  </td>
                  <td className="py-1 px-2 font-semibold text-neutral-300">{req.requestedBy}</td>
                  <td className="py-1 px-2 font-mono text-neutral-400">{req.timestamp}</td>
                  <td className="py-1 px-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setReviewReq(req)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-sky-800 hover:bg-sky-700 text-white font-bold cursor-pointer"
                        title="Review Submitted Form Data"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>
                      <button
                        onClick={() => handleApprove(req)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer"
                        title="Approve Form"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(req)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 text-white font-bold cursor-pointer"
                        title="Decline / Reject"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Full Form Review Modal */}
      {reviewReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-4xl bg-[#1e1e1e] border border-neutral-700 rounded-2xl p-6 shadow-2xl text-white text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <h4 className="font-bold text-base text-[#FF8500] flex items-center gap-2">
                <FileCheck className="w-5 h-5" />
                <span>Review Submitted Employee Form: {reviewReq.name} ({reviewReq.empId})</span>
              </h4>
              <button onClick={() => setReviewReq(null)} className="p-1 rounded text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
              {[
                { label: 'Employee ID', val: reviewReq.fullData?.[1] },
                { label: 'Full Name', val: reviewReq.fullData?.[2] },
                { label: 'Father Name', val: reviewReq.fullData?.[3] },
                { label: 'Mother Name', val: reviewReq.fullData?.[4] },
                { label: 'Date of Birth', val: reviewReq.fullData?.[5] },
                { label: 'Gender', val: reviewReq.fullData?.[6] },
                { label: 'Blood Group', val: reviewReq.fullData?.[7] },
                { label: 'Marital Status', val: reviewReq.fullData?.[8] },
                { label: 'Children Count', val: reviewReq.fullData?.[9] },
                { label: 'Mobile Number', val: reviewReq.fullData?.[10] },
                { label: 'Alt Mobile', val: reviewReq.fullData?.[11] },
                { label: 'Email Address', val: reviewReq.fullData?.[12] },
                { label: 'Permanent Address', val: reviewReq.fullData?.[14] },
                { label: 'Village', val: reviewReq.fullData?.[15] },
                { label: 'Taluka', val: reviewReq.fullData?.[16] },
                { label: 'District', val: reviewReq.fullData?.[17] },
                { label: 'State', val: reviewReq.fullData?.[18] },
                { label: 'Pincode', val: reviewReq.fullData?.[19] },
                { label: 'Aadhaar No', val: reviewReq.fullData?.[20] },
                { label: 'PAN Card No', val: reviewReq.fullData?.[21] },
                { label: 'UAN No', val: reviewReq.fullData?.[23] },
                { label: 'ESIC No', val: reviewReq.fullData?.[24] },
                { label: 'Company Name', val: reviewReq.fullData?.[26] },
                { label: 'Company Plant', val: reviewReq.fullData?.[27] },
                { label: 'Department', val: reviewReq.fullData?.[28] },
                { label: 'Designation', val: reviewReq.fullData?.[29] },
                { label: 'Employee Type', val: reviewReq.fullData?.[30] },
                { label: 'Joining Date', val: reviewReq.fullData?.[31] },
                { label: 'Bank Name', val: reviewReq.fullData?.[35] },
                { label: 'Account Holder', val: reviewReq.fullData?.[36] },
                { label: 'Account Number', val: reviewReq.fullData?.[37] },
                { label: 'IFSC Code', val: reviewReq.fullData?.[39] },
                { label: 'Salary Type', val: reviewReq.fullData?.[41] },
                { label: 'Basic Rate (₹)', val: reviewReq.fullData?.[42] },
                { label: 'OT Rate (₹/Hr)', val: reviewReq.fullData?.[43] },
                { label: 'Emergency Contact Name', val: reviewReq.fullData?.[45] },
                { label: 'Relationship', val: reviewReq.fullData?.[46] },
                { label: 'Emergency Mobile', val: reviewReq.fullData?.[47] },
                { label: 'Experience', val: reviewReq.fullData?.[50] },
                { label: 'Remark', val: reviewReq.fullData?.[55] },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800">
                  <span className="block text-[10px] text-[#FF8500] font-bold uppercase mb-0.5">
                    {item.label}
                  </span>
                  <span className="font-semibold text-white break-words">
                    {item.val ? String(item.val) : '-'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-neutral-800">
              <button
                onClick={() => setReviewReq(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 font-semibold cursor-pointer"
              >
                Close
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReject(reviewReq)}
                  className="px-5 py-2 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  Reject & Send Back
                </button>
                <button
                  onClick={() => handleApprove(reviewReq)}
                  className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold cursor-pointer"
                >
                  Approve & Sync To Master
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
