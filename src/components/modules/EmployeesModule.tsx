import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Users,
  Download,
  Upload,
  Plus,
  Pencil,
  Trash2,
  X,
  Camera,
  FileText,
  CheckCircle2,
  Eye,
  RefreshCw,
  ArrowUpDown,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import { Employee, CompanyRecord } from '../../types';
import { StorageService } from '../../utils/storage';
import { formatDateCustom } from '../../utils/formatters';

interface Props {
  companies: CompanyRecord[];
  theme: 'dark' | 'light';
}

export const EmployeesModule: React.FC<Props> = ({ companies, theme }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Filters & Sorting
  const [filterName, setFilterName] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterPlant, setFilterPlant] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'personal' | 'work' | 'salary' | 'statutory' | 'documents'>('personal');
  const [currentEmp, setCurrentEmp] = useState<Employee | null>(null);

  // Live Camera Capture Modal State
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraTargetField, setCameraTargetField] = useState<string>('photo');
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoPreview, setCapturedPhotoPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Full Image / Document View Modal State
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('');

  useEffect(() => {
    const load = () => setEmployees(StorageService.getEmployees());
    load();
    window.addEventListener('nexxus_storage_updated', load);
    return () => window.removeEventListener('nexxus_storage_updated', load);
  }, []);

  const totalCount = employees.length;
  const activeCount = employees.filter((e) => e.status.toLowerCase() === 'active').length;
  const inactiveCount = totalCount - activeCount;

  const filtered = employees.filter((e) => {
    if (filterName && !e.fullName.toLowerCase().includes(filterName.toLowerCase())) return false;
    if (filterCompany && !e.company.toLowerCase().includes(filterCompany.toLowerCase())) return false;
    if (filterPlant && !e.plant.toLowerCase().includes(filterPlant.toLowerCase())) return false;
    return true;
  });

  const handleOpenAdd = () => {
    const newId = String(1000 + employees.length + 1);
    setCurrentEmp({
      empId: newId,
      fullName: '',
      fatherName: '',
      motherName: '',
      dob: '1998-01-01',
      gender: 'Male',
      bloodGroup: 'B+',
      marital: 'Single',
      noOfChildren: '0',
      mobile: '',
      altMobile: '',
      email: '',
      photo: '',
      address: '',
      village: '',
      taluka: '',
      district: '',
      state: 'Maharashtra',
      pincode: '',
      aadhaar: '',
      pan: '',
      pfNo: '',
      uan: '',
      esic: '',
      esicIp: '',
      company: companies[0]?.companyName || 'NEXXUS FACILITY',
      plant: companies[0]?.plant || 'Main Plant',
      department: 'Operations',
      designation: 'Worker',
      empType: 'Permanent',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      leaveDate: '',
      leaveReason: '',
      bankName: '',
      accHolder: '',
      accNo: '',
      branchName: '',
      ifsc: '',
      payType: 'Bank Transfer',
      salType: 'Monthly Salary',
      basicRate: 20000,
      otRate: 90,
      payCycle: 'Monthly',
      emgName: '',
      emgRel: '',
      emgMobile: '',
      emgAddress: '',
      qualification: '10th (SSC)',
      experience: '1 Year',
      prevCompany: '',
      skillType: 'General Helper',
      uniformSize: 'M',
      shoesSize: '8',
      remark: 'New Employee',
    });
    setModalTab('personal');
    setModalOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setCurrentEmp({ ...emp });
    setModalTab('personal');
    setModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!currentEmp || !currentEmp.fullName.trim()) {
      alert('Full Name is required!');
      return;
    }
    if (!currentEmp.mobile || currentEmp.mobile.length !== 10) {
      alert('Mobile number must be exactly 10 digits!');
      return;
    }
    StorageService.saveOrUpdateEmployee(currentEmp);
    setEmployees(StorageService.getEmployees());
    setModalOpen(false);
    setCurrentEmp(null);
  };

  const handleDeleteModal = () => {
    if (!currentEmp) return;
    if (confirm(`Are you sure you want to delete ${currentEmp.fullName}?`)) {
      StorageService.deleteEmployee(currentEmp.empId);
      setEmployees(StorageService.getEmployees());
      setModalOpen(false);
      setCurrentEmp(null);
    }
  };

  // Camera Management Functions
  const startCamera = async (facing: 'user' | 'environment' = 'user') => {
    setCameraError(null);
    setCapturedPhotoPreview(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera access not supported by browser. Please use file upload instead.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(err.message || 'Unable to open camera. Please grant camera permissions or use upload.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraModalOpen(false);
    setCapturedPhotoPreview(null);
    setCameraError(null);
  };

  const openCameraForField = (fieldName: string) => {
    setCameraTargetField(fieldName);
    setCameraModalOpen(true);
    setCameraFacing('user');
    setTimeout(() => startCamera('user'), 100);
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      setCapturedPhotoPreview(dataUrl);
    }
  };

  const applyCapturedPhoto = () => {
    if (!capturedPhotoPreview || !currentEmp) return;
    setCurrentEmp({ ...currentEmp, [cameraTargetField]: capturedPhotoPreview });
    stopCamera();
  };

  const handleDocumentFileUpload = (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentEmp) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCurrentEmp({ ...currentEmp, [fieldName]: evt.target?.result as string });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const removeDocumentField = (fieldName: string) => {
    if (!currentEmp) return;
    setCurrentEmp({ ...currentEmp, [fieldName]: '' });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleDocumentFileUpload('photo', e);
  };

  const handlePincodeLookup = async (pin: string) => {
    if (!currentEmp || pin.length !== 6) return;
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        setCurrentEmp((prev) =>
          prev
            ? {
                ...prev,
                village: po.Name || prev.village,
                taluka: po.Block || po.Taluk || prev.taluka,
                district: po.District || prev.district,
                state: po.State || prev.state,
              }
            : null
        );
      }
    } catch (err) {
      console.log('Pincode fetch error:', err);
    }
  };

  const downloadSampleExcel = () => {
    const sample = [
      {
        'Employee ID': '1005',
        'Full Name': 'Sandeep Vitthal Jadhav',
        'Father Name': 'Vitthal',
        'Mother Name': 'Sunita',
        DOB: '1997-04-12',
        Gender: 'Male',
        'Blood Group': 'O+',
        'Marital Status': 'Single',
        'No. of Children': '0',
        Mobile: '9860123456',
        'Alternate Mobile': '',
        Email: 'sandeep@gmail.com',
        'Full Address': 'A/P Shikrapur, Tal. Shirur, Dist. Pune',
        Village: 'Shikrapur',
        Taluka: 'Shirur',
        District: 'Pune',
        State: 'Maharashtra',
        Pincode: '412208',
        'Aadhaar No': '654812369874',
        'PAN No': 'ABCDE1234F',
        Company: 'NEXXUS FACILITY',
        Plant: 'Pune Plant',
        Department: 'Operations',
        Designation: 'Assistant Supervisor',
        'Joining Date': '2024-01-10',
        'Employee Status': 'Active',
        'Bank Name': 'State Bank of India',
        'Account Holder': 'Sandeep Vitthal Jadhav',
        'Account No': '30981245789',
        IFSC: 'SBIN0001234',
        'Basic Salary/Daily Rate': 22000,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'EmployeeSample');
    XLSX.writeFile(wb, 'Employee_Master_Sample.xlsx');
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const rows: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        if (rows && rows.length > 0) {
          const parsed: Employee[] = rows.map((r, i) => ({
            empId: String(r['Employee ID'] || 1000 + employees.length + 1 + i),
            fullName: r['Full Name'] || 'New Employee',
            fatherName: r['Father Name'] || '',
            motherName: r['Mother Name'] || '',
            dob: r['DOB'] || '1995-01-01',
            gender: r['Gender'] || 'Male',
            bloodGroup: r['Blood Group'] || 'B+',
            marital: r['Marital Status'] || 'Single',
            noOfChildren: String(r['No. of Children'] || 0),
            mobile: String(r['Mobile'] || '9876543210'),
            altMobile: String(r['Alternate Mobile'] || ''),
            email: r['Email'] || '',
            photo: '',
            address: r['Full Address'] || 'Pune',
            village: r['Village'] || '',
            taluka: r['Taluka'] || '',
            district: r['District'] || 'Pune',
            state: r['State'] || 'Maharashtra',
            pincode: String(r['Pincode'] || '412208'),
            aadhaar: String(r['Aadhaar No'] || ''),
            pan: String(r['PAN No'] || ''),
            pfNo: '',
            uan: '',
            esic: '',
            esicIp: '',
            company: r['Company'] || 'NEXXUS FACILITY',
            plant: r['Plant'] || 'Pune Plant',
            department: r['Department'] || 'Operations',
            designation: r['Designation'] || 'Worker',
            empType: 'Permanent',
            joinDate: r['Joining Date'] || new Date().toISOString().split('T')[0],
            status: 'Active',
            leaveDate: '',
            leaveReason: '',
            bankName: r['Bank Name'] || 'State Bank of India',
            accHolder: r['Account Holder'] || r['Full Name'],
            accNo: String(r['Account No'] || ''),
            ifsc: r['IFSC'] || 'SBIN0001234',
            payType: 'Bank',
            salType: 'Monthly Salary',
            basicRate: parseFloat(r['Basic Salary/Daily Rate']) || 20000,
            otRate: 90,
            payCycle: 'Monthly',
            emgName: '',
            emgRel: '',
            emgMobile: '',
            emgAddress: '',
            qualification: '10th',
            experience: '1 Year',
            prevCompany: '',
            skillType: 'Helper',
            uniformSize: 'M',
            shoesSize: '8',
            remark: 'Imported',
          }));
          const existing = [...employees];
          parsed.forEach((emp) => existing.unshift(emp));
          StorageService.saveEmployees(existing);
          alert(`${parsed.length} employees imported into database!`);
        }
      } catch (err: any) {
        alert('Upload Error: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      alert('No data to export!');
      return;
    }
    const data = filtered.map((e, idx) => ({
      Sr: idx + 1,
      'Emp ID': e.empId,
      'Full Name': e.fullName,
      Mobile: e.mobile,
      Company: e.company,
      Plant: e.plant,
      Designation: e.designation,
      'Joining Date': e.joinDate,
      Status: e.status,
      'Salary Type': e.salType,
      'Basic Rate': e.basicRate,
      'Bank Name': e.bankName,
      'Account No': e.accNo,
      IFSC: e.ifsc,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employees');
    XLSX.writeFile(wb, `Employees_Directory_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isDark = theme === 'dark';
  const cardBg = isDark ? 'bg-[#111928] border-slate-800 text-slate-100 glow-card-dark' : 'bg-white border-slate-200 text-slate-900 glow-card-light';
  const subCardBg = isDark ? 'bg-[#0a0f1d] border-slate-800' : 'bg-slate-50 border-slate-200';
  const inputClass = isDark
    ? 'bg-[#0a0f1d] border-slate-700 text-white focus:border-[#FF8500]'
    : 'bg-white border-slate-300 text-slate-900 focus:border-[#FF8500]';
  const labelClass = isDark ? 'text-slate-400 font-bold mb-1' : 'text-slate-600 font-bold mb-1';

  const sortedEmployees = [...filtered].sort((a, b) => {
    const aId = parseInt(a.empId) || (a.srNo || 0);
    const bId = parseInt(b.empId) || (b.srNo || 0);
    return sortOrder === 'desc' ? bId - aId : aId - bId;
  });

  return (
    <div className="space-y-4">
      {/* Top Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-[#FF8500] flex items-center gap-2">
          <Users className="w-5 h-5" />
          <span>Employee Master Directory</span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
            title="Toggle Ascending / Descending sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#FF8500]" />
            <span>{sortOrder === 'desc' ? '↓ New Data On Top' : '↑ Old Data First'}</span>
          </button>
          <button
            onClick={downloadSampleExcel}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5 text-amber-500" />
            <span>Sample Excel</span>
          </button>
          <label className="btn-3d-emerald px-3 py-1.5 text-xs cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Bulk Upload</span>
            <input type="file" accept=".xlsx, .xls" onChange={handleBulkUpload} className="hidden" />
          </label>
          <button
            onClick={handleOpenAdd}
            className="btn-3d-orange px-4 py-1.5 text-xs"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add New Employee</span>
          </button>
          <button
            onClick={handleExport}
            className="btn-3d-secondary px-3 py-1.5 text-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* KPI Cards - Compact Uniform Sizing & Typography */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className={`p-2.5 px-3.5 rounded-xl border text-center transition-all flex flex-col justify-center items-center h-16 ${cardBg}`}>
          <span className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Total Registered Employees</span>
          <span className={`text-lg font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCount}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border border-emerald-500/30 text-center transition-all flex flex-col justify-center items-center h-16 ${cardBg}`}>
          <span className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Active Employees</span>
          <span className="text-lg font-bold text-emerald-500 font-mono">{activeCount}</span>
        </div>
        <div className={`p-2.5 px-3.5 rounded-xl border border-rose-500/30 text-center transition-all flex flex-col justify-center items-center h-16 ${cardBg}`}>
          <span className={`block text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Inactive / Left Employees</span>
          <span className="text-lg font-bold text-rose-500 font-mono">{inactiveCount}</span>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-3.5 rounded-xl border ${cardBg}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
          <div>
            <label className={`block ${labelClass}`}>Search by Name</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="Employee name"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block ${labelClass}`}>Company</label>
            <input
              type="text"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              placeholder="Filter company"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <label className={`block ${labelClass}`}>Plant</label>
            <input
              type="text"
              value={filterPlant}
              onChange={(e) => setFilterPlant(e.target.value)}
              placeholder="Filter plant"
              className={`w-full p-2 border rounded-lg ${inputClass}`}
            />
          </div>
          <div>
            <button
              onClick={() => {
                setFilterName('');
                setFilterCompany('');
                setFilterPlant('');
              }}
              className="btn-3d-secondary w-full py-2 text-xs"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table */}
      <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <table className="w-full min-w-[1200px] text-xs text-left">
          <thead className="bg-[#1A365D] text-white font-bold uppercase text-[10px]">
            <tr>
              <th className="py-1.5 px-2 text-center w-10">Sr</th>
              <th className="py-1.5 px-2 w-20">Emp ID</th>
              <th className="py-1.5 px-2 w-44">Full Name</th>
              <th className="py-1.5 px-2 w-28">Mobile</th>
              <th className="py-1.5 px-2 w-36">Company</th>
              <th className="py-1.5 px-2 w-28">Plant</th>
              <th className="py-1.5 px-2 w-32">Designation</th>
              <th className="py-1.5 px-2 w-24">Joining Date</th>
              <th className="py-1.5 px-2 text-center w-16">Status</th>
              <th className="py-1.5 px-2 text-right w-24">Daily/Basic</th>
              <th className="py-1.5 px-2 text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody className={isDark ? 'divide-y divide-slate-800 bg-[#0a0f1d]/60 text-slate-100' : 'divide-y divide-slate-200 bg-white text-slate-900'}>
            {sortedEmployees.length === 0 ? (
              <tr>
                <td colSpan={11} className={`py-6 text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  No employee records found.
                </td>
              </tr>
            ) : (
              sortedEmployees.map((e, idx) => (
                <tr key={idx} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-amber-50/50'}>
                  <td className={`py-1 px-2 text-center font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{idx + 1}</td>
                  <td className={`py-1 px-2 font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{e.empId}</td>
                  <td className="py-1 px-2 font-bold text-[#FF8500] capitalize flex items-center gap-1.5">
                    {e.photo ? (
                      <img src={e.photo} alt="Emp" className="w-5 h-5 rounded-full object-cover border border-amber-500/40" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-slate-700 text-[9px] text-white flex items-center justify-center font-bold">
                        {e.fullName.charAt(0) || 'E'}
                      </span>
                    )}
                    <span>{e.fullName}</span>
                  </td>
                  <td className="py-1 px-2 font-mono tabular-nums">{e.mobile}</td>
                  <td className="py-1 px-2 font-medium">{e.company}</td>
                  <td className={`py-1 px-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{e.plant}</td>
                  <td className="py-1 px-2">{e.designation}</td>
                  <td className="py-1 px-2 font-mono tabular-nums">{formatDateCustom(e.joinDate)}</td>
                  <td className="py-1 px-2 text-center">
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        e.status.toLowerCase() === 'active'
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="py-1 px-2 text-right font-mono font-bold text-emerald-500 tabular-nums">
                    ₹ {parseFloat(String(e.basicRate || 0)).toLocaleString('en-IN')}
                  </td>
                  <td className="py-1 px-2 text-center">
                    <button
                      onClick={() => handleOpenEdit(e)}
                      className="p-1 rounded text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                      title="Edit Profile"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 5-Tab Comprehensive Employee Modal */}
      {modalOpen && currentEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-xs overflow-y-auto">
          <div className={`w-full max-w-4xl border rounded-2xl p-6 shadow-2xl text-xs max-h-[92vh] overflow-y-auto transition-all ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <h4 className="font-bold text-base text-[#FF8500] flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>{currentEmp.fullName ? `Edit Profile: ${currentEmp.fullName}` : 'Register New Employee'}</span>
              </h4>
              <button
                onClick={() => setModalOpen(false)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className={`flex flex-wrap gap-2 border-b pb-3 mb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {[
                { id: 'personal', label: '1. Personal Info' },
                { id: 'work', label: '2. Work & Company' },
                { id: 'salary', label: '3. Salary & Bank' },
                { id: 'statutory', label: '4. Statutory & Other' },
                { id: 'documents', label: '5. Documents & Camera' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    modalTab === tab.id ? 'btn-3d-orange' : 'btn-3d-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab 1: Personal */}
            {modalTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Employee ID *</label>
                  <input
                    type="text"
                    value={currentEmp.empId}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, empId: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block mb-1 ${labelClass}`}>Full Name *</label>
                  <input
                    type="text"
                    value={currentEmp.fullName}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, fullName: e.target.value })}
                    placeholder="e.g. Ramesh Suresh Patil"
                    className={`w-full p-2 border rounded-lg font-bold capitalize text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Father Name</label>
                  <input
                    type="text"
                    value={currentEmp.fatherName}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, fatherName: e.target.value })}
                    className={`w-full p-2 border rounded-lg capitalize text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Mother Name</label>
                  <input
                    type="text"
                    value={currentEmp.motherName}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, motherName: e.target.value })}
                    className={`w-full p-2 border rounded-lg capitalize text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Date of Birth</label>
                  <input
                    type="date"
                    value={currentEmp.dob}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, dob: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Gender</label>
                  <select
                    value={currentEmp.gender}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, gender: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Blood Group</label>
                  <select
                    value={currentEmp.bloodGroup}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, bloodGroup: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Mobile *</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={currentEmp.mobile}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, mobile: e.target.value.replace(/\D/g, '') })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Alternate Mobile</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={currentEmp.altMobile}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, altMobile: e.target.value.replace(/\D/g, '') })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={`block mb-1 ${labelClass}`}>Email ID</label>
                  <input
                    type="email"
                    value={currentEmp.email}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, email: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-4 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <label className="block font-bold text-amber-500 mb-2">Employee Photo (Live Camera & File Upload)</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      onClick={() => openCameraForField('photo')}
                      className="btn-3d-orange px-3.5 py-1.5 text-xs"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Photo with Camera</span>
                    </button>
                    <label className="btn-3d-secondary px-3.5 py-1.5 text-xs cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo File</span>
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                    </label>
                    {currentEmp.photo && (
                      <div className="flex items-center gap-2 pl-2 border-l border-slate-700/40">
                        <img
                          src={currentEmp.photo}
                          alt="Emp"
                          className="w-12 h-14 object-cover rounded-lg border-2 border-[#FF8500] cursor-pointer shadow-md hover:scale-105 transition-transform"
                          onClick={() => {
                            setPreviewDocUrl(currentEmp.photo);
                            setPreviewDocTitle(`${currentEmp.fullName || 'Employee'} - Profile Photo`);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => removeDocumentField('photo')}
                          className="btn-3d-rose px-2 py-1 text-xs"
                          title="Remove Photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-4">
                  <label className={`block mb-1 ${labelClass}`}>Full Permanent Address</label>
                  <textarea
                    rows={2}
                    value={currentEmp.address}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, address: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Pincode (Auto-lookup)</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={currentEmp.pincode}
                    onChange={(e) => {
                      const pin = e.target.value.replace(/\D/g, '');
                      setCurrentEmp({ ...currentEmp, pincode: pin });
                      if (pin.length === 6) handlePincodeLookup(pin);
                    }}
                    placeholder="e.g. 412208"
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Village / Post Office</label>
                  <input
                    type="text"
                    value={currentEmp.village}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, village: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Taluka</label>
                  <input
                    type="text"
                    value={currentEmp.taluka}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, taluka: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>District</label>
                  <input
                    type="text"
                    value={currentEmp.district}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, district: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Work & Company */}
            {modalTab === 'work' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Company</label>
                  <input
                    type="text"
                    value={currentEmp.company}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, company: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-bold text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Plant</label>
                  <input
                    type="text"
                    value={currentEmp.plant}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, plant: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Department</label>
                  <input
                    type="text"
                    value={currentEmp.department}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, department: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Designation</label>
                  <input
                    type="text"
                    value={currentEmp.designation}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, designation: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-bold text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Employee Type</label>
                  <input
                    type="text"
                    value={currentEmp.empType}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, empType: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Joining Date</label>
                  <input
                    type="date"
                    value={currentEmp.joinDate}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, joinDate: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Status</label>
                  <select
                    value={currentEmp.status}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, status: e.target.value as any })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Left">Left</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Uniform Size</label>
                  <input
                    type="text"
                    value={currentEmp.uniformSize}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, uniformSize: e.target.value })}
                    placeholder="M, L, XL"
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Shoes Size</label>
                  <input
                    type="text"
                    value={currentEmp.shoesSize}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, shoesSize: e.target.value })}
                    placeholder="7, 8, 9"
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={`block mb-1 ${labelClass}`}>Skill / Work Type</label>
                  <input
                    type="text"
                    value={currentEmp.skillType}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, skillType: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {/* Tab 3: Salary & Bank */}
            {modalTab === 'salary' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Bank Name</label>
                  <input
                    type="text"
                    value={currentEmp.bankName}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, bankName: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-bold text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Account Holder</label>
                  <input
                    type="text"
                    value={currentEmp.accHolder}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, accHolder: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Account Number</label>
                  <input
                    type="text"
                    value={currentEmp.accNo}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, accNo: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>IFSC Code</label>
                  <input
                    type="text"
                    value={currentEmp.ifsc}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, ifsc: e.target.value.toUpperCase() })}
                    className={`w-full p-2 border rounded-lg font-mono uppercase text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Salary Type</label>
                  <select
                    value={currentEmp.salType}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, salType: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  >
                    <option value="Monthly Salary">Monthly Salary</option>
                    <option value="Daily Wage">Daily Wage</option>
                    <option value="Piece Rate">Piece Rate</option>
                  </select>
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Basic Salary / Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={currentEmp.basicRate}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, basicRate: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-2 border rounded-lg text-emerald-500 font-bold font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>OT Rate (₹ / Hr)</label>
                  <input
                    type="number"
                    value={currentEmp.otRate}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, otRate: parseFloat(e.target.value) || 0 })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Payment Mode</label>
                  <input
                    type="text"
                    value={currentEmp.payType}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, payType: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Payment Cycle</label>
                  <input
                    type="text"
                    value={currentEmp.payCycle}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, payCycle: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {/* Tab 4: Statutory */}
            {modalTab === 'statutory' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Aadhaar Number (12 Digits)</label>
                  <input
                    type="text"
                    maxLength={12}
                    value={currentEmp.aadhaar}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, aadhaar: e.target.value.replace(/\D/g, '') })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>PAN Card Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={currentEmp.pan}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, pan: e.target.value.toUpperCase() })}
                    className={`w-full p-2 border rounded-lg font-mono uppercase text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>UAN Number</label>
                  <input
                    type="text"
                    value={currentEmp.uan}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, uan: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>ESIC Number</label>
                  <input
                    type="text"
                    value={currentEmp.esic}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, esic: e.target.value })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Emergency Name</label>
                  <input
                    type="text"
                    value={currentEmp.emgName}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, emgName: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
                <div>
                  <label className={`block mb-1 ${labelClass}`}>Emergency Mobile</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={currentEmp.emgMobile}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, emgMobile: e.target.value.replace(/\D/g, '') })}
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={`block mb-1 ${labelClass}`}>Course Education String (Format: Course^Board^Year^Percentage|...)</label>
                  <input
                    type="text"
                    value={currentEmp.courseDetails || ''}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, courseDetails: e.target.value })}
                    placeholder="10th (SSC)^PUNE^2014^68.5%|12th (HSC)^PUNE^2016^71%"
                    className={`w-full p-2 border rounded-lg font-mono text-xs ${inputClass}`}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={`block mb-1 ${labelClass}`}>System Remark</label>
                  <input
                    type="text"
                    value={currentEmp.remark}
                    onChange={(e) => setCurrentEmp({ ...currentEmp, remark: e.target.value })}
                    className={`w-full p-2 border rounded-lg text-xs ${inputClass}`}
                  />
                </div>
              </div>
            )}

            {/* Tab 5: Documents & Camera Capture */}
            {modalTab === 'documents' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-amber-500 text-sm flex items-center gap-2">
                      <Camera className="w-4 h-4" />
                      <span>Employee Document Verification & Live Camera Capture</span>
                    </h5>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Capture live photos of employee documents (Aadhaar, PAN, Passbook, Certificate) using webcam/camera or upload file copies.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    {
                      key: 'photo',
                      title: 'Employee Profile Photo',
                      desc: 'Clear passport size face photo',
                      icon: <Users className="w-4 h-4 text-amber-500" />,
                      val: currentEmp.photo,
                    },
                    {
                      key: 'aadhaarFront',
                      title: 'Aadhaar Card (Front)',
                      desc: 'Front side with photo & Aadhaar number',
                      icon: <FileText className="w-4 h-4 text-sky-500" />,
                      val: currentEmp.aadhaarFront,
                    },
                    {
                      key: 'aadhaarBack',
                      title: 'Aadhaar Card (Back)',
                      desc: 'Back side with address & QR code',
                      icon: <FileText className="w-4 h-4 text-sky-500" />,
                      val: currentEmp.aadhaarBack,
                    },
                    {
                      key: 'panPhoto',
                      title: 'PAN Card',
                      desc: 'Permanent Account Number proof',
                      icon: <FileText className="w-4 h-4 text-emerald-500" />,
                      val: currentEmp.panPhoto,
                    },
                    {
                      key: 'passbookPhoto',
                      title: 'Bank Passbook / Cheque',
                      desc: 'Proof of account number & IFSC code',
                      icon: <FileText className="w-4 h-4 text-purple-500" />,
                      val: currentEmp.passbookPhoto,
                    },
                    {
                      key: 'leavingCert',
                      title: 'Leaving / Experience Cert',
                      desc: 'School leaving or past company letter',
                      icon: <FileText className="w-4 h-4 text-amber-500" />,
                      val: currentEmp.leavingCert,
                    },
                  ].map((doc) => (
                    <div
                      key={doc.key}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
                        doc.val
                          ? isDark
                            ? 'bg-[#0a0f1d] border-emerald-500/40'
                            : 'bg-emerald-50/40 border-emerald-300'
                          : subCardBg
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-bold text-xs flex items-center gap-1.5">
                            {doc.icon}
                            <span>{doc.title}</span>
                          </span>
                          {doc.val ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Attached
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-300'}`}>
                              Pending
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{doc.desc}</p>

                        {/* Document Thumbnail Preview */}
                        {doc.val && (
                          <div className="mb-3 relative group">
                            <img
                              src={doc.val}
                              alt={doc.title}
                              onClick={() => {
                                setPreviewDocUrl(doc.val || null);
                                setPreviewDocTitle(`${currentEmp.fullName} - ${doc.title}`);
                              }}
                              className="w-full h-32 object-contain bg-black/40 rounded-lg border border-slate-700/50 cursor-pointer group-hover:opacity-90 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              <span className="px-2.5 py-1 rounded bg-black/80 text-white text-[11px] font-bold flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> Click to View
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-700/30">
                        <button
                          type="button"
                          onClick={() => openCameraForField(doc.key)}
                          className="btn-3d-orange flex-1 py-1.5 text-[11px]"
                          title="Open camera to capture document"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{doc.val ? 'Retake' : 'Camera'}</span>
                        </button>
                        <label
                          className="btn-3d-secondary flex-1 py-1.5 text-[11px] cursor-pointer"
                          title="Upload image or PDF document"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => handleDocumentFileUpload(doc.key, e)}
                            className="hidden"
                          />
                        </label>
                        {doc.val && (
                          <button
                            type="button"
                            onClick={() => removeDocumentField(doc.key)}
                            className="btn-3d-rose px-2.5 py-1.5 text-[11px]"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className={`flex items-center justify-between pt-4 mt-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              {currentEmp.srNo ? (
                <button
                  onClick={handleDeleteModal}
                  className="btn-3d-rose px-4 py-2 text-xs"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Employee</span>
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setModalOpen(false)}
                  className="btn-3d-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveModal}
                  className="btn-3d-emerald px-6 py-2 text-xs"
                >
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Save Employee Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Capture Modal */}
      {cameraModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
          <div className={`w-full max-w-lg border rounded-2xl p-5 shadow-2xl transition-all ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="flex items-center gap-2 font-bold text-sm text-[#FF8500]">
                <Camera className="w-4.5 h-4.5" />
                <span>Live Camera Capture: {cameraTargetField.toUpperCase()}</span>
              </div>
              <button
                onClick={stopCamera}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Video Viewfinder / Captured Preview */}
            <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center border border-slate-700/60 shadow-inner mb-4">
              {cameraError ? (
                <div className="p-4 text-center text-rose-400 text-xs">
                  <p className="font-bold mb-1">Camera Notice</p>
                  <p>{cameraError}</p>
                </div>
              ) : capturedPhotoPreview ? (
                <img
                  src={capturedPhotoPreview}
                  alt="Captured"
                  className="w-full h-full object-contain"
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder crosshairs */}
                  <div className="absolute inset-4 border-2 border-dashed border-amber-400/40 rounded-lg pointer-events-none" />
                </>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleCameraFacing}
                className="btn-3d-secondary px-3 py-2 text-xs"
                title="Switch Front / Rear Camera"
              >
                <RefreshCw className="w-4 h-4 text-[#FF8500]" />
                <span>Switch Cam</span>
              </button>

              {capturedPhotoPreview ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCapturedPhotoPreview(null);
                      startCamera(cameraFacing);
                    }}
                    className="btn-3d-secondary px-3.5 py-2 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retake</span>
                  </button>
                  <button
                    type="button"
                    onClick={applyCapturedPhoto}
                    className="btn-3d-emerald px-5 py-2 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Attach Photo</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={captureCameraPhoto}
                  disabled={!!cameraError}
                  className="btn-3d-orange px-6 py-2.5 text-xs font-black shadow-lg"
                >
                  <Camera className="w-4.5 h-4.5" />
                  <span>Snap Photo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Document Image View Modal */}
      {previewDocUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 p-3 backdrop-blur-md">
          <div className={`w-full max-w-2xl border rounded-2xl p-5 shadow-2xl transition-all ${cardBg}`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className="font-bold text-sm text-[#FF8500] truncate">{previewDocTitle}</span>
              <button
                onClick={() => setPreviewDocUrl(null)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-black/60 flex items-center justify-center max-h-[70vh]">
              <img src={previewDocUrl} alt="Preview" className="max-h-[70vh] object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
