import React, { useState, useRef } from 'react';
import {
  FileText,
  UserPlus,
  Edit,
  Search,
  Camera,
  Upload,
  Download,
  IdCard,
  Plus,
  Trash2,
  CheckCircle2,
  Send,
  Loader2,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { Employee, CompanyRecord, PendingApprovalRequest } from '../../types';
import { StorageService } from '../../utils/storage';
import { printNativeDocument } from '../../utils/pdfGenerators';
import { JoiningFormDocument } from '../pdf/JoiningFormDocument';
import { IdCardDocument } from '../pdf/IdCardDocument';

interface Props {
  companies: CompanyRecord[];
  employees: Employee[];
  theme: 'dark' | 'light';
  currentUsername: string;
}

export const HRFormsAndJoiningModule: React.FC<Props> = ({
  companies,
  employees,
  theme,
  currentUsername,
}) => {
  const [mode, setMode] = useState<'add' | 'edit' | 'search'>('add');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitToast, setSubmitToast] = useState<{ title: string; message: string } | null>(null);

  // Search State for Edit Mode
  const [searchId, setSearchId] = useState('');
  const [searchMobile, setSearchMobile] = useState('');
  const [searchName, setSearchName] = useState('');
  const [searchedEmp, setSearchedEmp] = useState<Employee | null>(null);

  // Form Fields
  const [empId, setEmpId] = useState('');
  const [fullName, setFullName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dob, setDob] = useState('1998-01-01');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('B+');
  const [marital, setMarital] = useState('Single');
  const [children, setChildren] = useState('0');
  const [photo, setPhoto] = useState('');

  const [mobile, setMobile] = useState('');
  const [altMobile, setAltMobile] = useState('');
  const [email, setEmail] = useState('');
  const [pincode, setPincode] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [district, setDistrict] = useState('Pune');
  const [taluka, setTaluka] = useState('Haveli');
  const [village, setVillage] = useState('Pune');
  const [address, setAddress] = useState('Plot No. 45, Hadapsar, Pune, Maharashtra - 411013');
  const [currentAddress, setCurrentAddress] = useState('Plot No. 45, Hadapsar, Pune, Maharashtra - 411013');
  const [sameAddress, setSameAddress] = useState(true);

  // KYC
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [pan, setPan] = useState('');
  const [panPhoto, setPanPhoto] = useState('');
  const [uan, setUan] = useState('');
  const [esic, setEsic] = useState('');

  // Work
  const [company, setCompany] = useState(companies[0]?.companyName || 'NEXXUS FACILITY');
  const [companyPlant, setCompanyPlant] = useState(companies[0]?.plant || 'Pune Plant');
  const [vendorName, setVendorName] = useState('NEXXUS FACILITY');
  const [vendorPlant, setVendorPlant] = useState('Pune Plant');
  const [department, setDepartment] = useState('Operations');
  const [designation, setDesignation] = useState('Worker');
  const [empType, setEmpType] = useState('Permanent');
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [empStatus, setEmpStatus] = useState<'Active' | 'Inactive' | 'Left'>('Active');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Bank
  const [bankName, setBankName] = useState('Bank of Maharashtra');
  const [branchName, setBranchName] = useState('Pune');
  const [accNo, setAccNo] = useState('');
  const [ifsc, setIfsc] = useState('MAHB0000456');
  const [passbookPhoto, setPassbookPhoto] = useState('');

  // Emergency
  const [emgName, setEmgName] = useState('');
  const [emgRel, setEmgRel] = useState('Father');
  const [emgMobile, setEmgMobile] = useState('');
  const [emgAddress, setEmgAddress] = useState('');

  // Salary
  const [paymentType, setPaymentType] = useState('Bank Transfer');
  const [salaryType, setSalaryType] = useState('Monthly Salary');
  const [basicSalary, setBasicSalary] = useState<number>(20000);
  const [otRate, setOtRate] = useState<number>(90);
  const [paymentCycle, setPaymentCycle] = useState('Monthly');

  // Experience & Others
  const [experience, setExperience] = useState('1 Year');
  const [prevCompany, setPrevCompany] = useState('');
  const [skill, setSkill] = useState('General Worker');
  const [uniformSize, setUniformSize] = useState('M');
  const [shoesSize, setShoesSize] = useState('8');
  const [remark, setRemark] = useState('Good Candidate');
  const [leavingCert, setLeavingCert] = useState('');

  // Education Rows
  const [eduRows, setEduRows] = useState<[string, string, string, string][]>([
    ['10th (SSC)', 'PUNE', '2014', '68.50%'],
  ]);

  // Hidden DOM ref containers for exact printing
  const joiningPrintRef = useRef<HTMLDivElement>(null);
  const idCardPrintRef = useRef<HTMLDivElement>(null);

  const handlePincodeChange = async (pin: string) => {
    setPincode(pin);
    if (pin.length === 6) {
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        if (data && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setVillage(po.Name || village);
          setTaluka(po.Block || po.Taluk || taluka);
          setDistrict(po.District || district);
          setState(po.State || state);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const addEduRow = () => {
    if (eduRows.length >= 5) return;
    setEduRows([...eduRows, ['', '', '', '']]);
  };

  const removeEduRow = (index: number) => {
    setEduRows(eduRows.filter((_, i) => i !== index));
  };

  const updateEduRow = (index: number, col: number, val: string) => {
    const updated = [...eduRows];
    updated[index][col] = val;
    setEduRows(updated);
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (b64: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      setter(evt.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Search existing employee
  const handleSearch = () => {
    if (!searchId && !searchMobile && !searchName) {
      alert('Please enter Employee ID, Mobile, or Name to search!');
      return;
    }
    const cleanId = searchId.trim().toLowerCase();
    const cleanMob = searchMobile.trim();
    const cleanNm = searchName.trim().toLowerCase();

    const found = employees.find((e) => {
      if (cleanId && e.empId.toLowerCase().includes(cleanId)) return true;
      if (cleanMob && e.mobile.includes(cleanMob)) return true;
      if (cleanNm && e.fullName.toLowerCase().includes(cleanNm)) return true;
      return false;
    });

    if (found) {
      populateFormFromEmployee(found);
      setSearchedEmp(found);
      alert(`Found: ${found.fullName}! Form populated.`);
    } else {
      alert('Employee not found in records.');
    }
  };

  const populateFormFromEmployee = (emp: Employee) => {
    setEmpId(emp.empId);
    setFullName(emp.fullName);
    setFatherName(emp.fatherName);
    setMotherName(emp.motherName);
    setDob(emp.dob || '1998-01-01');
    setGender(emp.gender || 'Male');
    setBloodGroup(emp.bloodGroup || 'B+');
    setMarital(emp.marital || 'Single');
    setChildren(emp.noOfChildren || '0');
    setMobile(emp.mobile);
    setAltMobile(emp.altMobile || '');
    setEmail(emp.email || '');
    setPhoto(emp.photo || '');
    setAddress(emp.address || '');
    setCurrentAddress(emp.address || '');
    setVillage(emp.village || '');
    setTaluka(emp.taluka || '');
    setDistrict(emp.district || '');
    setState(emp.state || 'Maharashtra');
    setPincode(emp.pincode || '');
    setAadhaar(emp.aadhaar || '');
    setPan(emp.pan || '');
    setUan(emp.uan || '');
    setEsic(emp.esic || '');
    setCompany(emp.company || '');
    setCompanyPlant(emp.plant || '');
    setDepartment(emp.department || '');
    setDesignation(emp.designation || '');
    setEmpType(emp.empType || 'Permanent');
    setJoinDate(emp.joinDate || '');
    setEmpStatus(emp.status || 'Active');
    setBankName(emp.bankName || '');
    setBranchName(emp.branchName || '');
    setAccNo(emp.accNo || '');
    setIfsc(emp.ifsc || '');
    setEmgName(emp.emgName || '');
    setEmgRel(emp.emgRel || '');
    setEmgMobile(emp.emgMobile || '');
    setEmgAddress(emp.emgAddress || '');
    setBasicSalary(emp.basicRate || 20000);
    setOtRate(emp.otRate || 90);
    setExperience(emp.experience || '');
    setPrevCompany(emp.prevCompany || '');
    setSkill(emp.skillType || '');
    setUniformSize(emp.uniformSize || 'M');
    setShoesSize(emp.shoesSize || '8');
    setRemark(emp.remark || '');

    if (emp.courseDetails) {
      const parsed: [string, string, string, string][] = [];
      emp.courseDetails.split('|').forEach((r) => {
        if (r.trim()) {
          const parts = r.split('^');
          parsed.push([parts[0] || '', parts[1] || '', parts[2] || '', parts[3] || '']);
        }
      });
      if (parsed.length > 0) setEduRows(parsed);
    }
  };

  // Build current employee object from form
  const getCompiledEmployeeObject = (): Employee => {
    const courseDetails = eduRows.map((r) => r.join('^')).join('|');
    return {
      empId: empId || String(1000 + employees.length + 1),
      fullName,
      fatherName,
      motherName,
      dob,
      gender,
      bloodGroup,
      marital,
      noOfChildren: children,
      mobile,
      altMobile,
      email,
      photo,
      address,
      village,
      taluka,
      district,
      state,
      pincode,
      aadhaar,
      pan,
      pfNo: '',
      uan,
      esic,
      esicIp: '',
      company,
      plant: companyPlant,
      department,
      designation,
      empType,
      joinDate,
      status: empStatus,
      leaveDate,
      leaveReason,
      bankName,
      accHolder: fullName,
      accNo,
      branchName,
      ifsc,
      payType: paymentType,
      salType: salaryType,
      basicRate: basicSalary,
      otRate,
      payCycle: paymentCycle,
      emgName,
      emgRel,
      emgMobile,
      emgAddress,
      qualification: eduRows[0]?.[0] || '10th',
      experience,
      prevCompany,
      skillType: skill,
      uniformSize,
      shoesSize,
      remark,
      courseDetails,
    };
  };

  // Submit to HR (Pending Approvals Queue)
  const handleSubmitToHR = () => {
    if (!fullName.trim()) {
      alert('Full Name is required!');
      return;
    }
    if (!mobile || mobile.length !== 10) {
      alert('Mobile number must be exactly 10 digits!');
      return;
    }

    setIsSubmitting(true);
    const compiledEmp = getCompiledEmployeeObject();
    const actionType = mode === 'add' ? 'New' : 'Edit';

    const reqObj: PendingApprovalRequest = {
      rowIndex: Date.now(),
      empId: compiledEmp.empId,
      name: compiledEmp.fullName,
      action: actionType,
      status: 'Pending',
      requestedBy: currentUsername,
      timestamp:
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
        ' ' +
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fullData: [
        1,
        compiledEmp.empId,
        compiledEmp.fullName,
        compiledEmp.fatherName,
        compiledEmp.motherName,
        compiledEmp.dob,
        compiledEmp.gender,
        compiledEmp.bloodGroup,
        compiledEmp.marital,
        compiledEmp.noOfChildren,
        compiledEmp.mobile,
        compiledEmp.altMobile,
        compiledEmp.email,
        compiledEmp.photo,
        compiledEmp.address,
        compiledEmp.village,
        compiledEmp.taluka,
        compiledEmp.district,
        compiledEmp.state,
        compiledEmp.pincode,
        compiledEmp.aadhaar,
        compiledEmp.pan,
        '',
        compiledEmp.uan,
        compiledEmp.esic,
        '',
        compiledEmp.company,
        compiledEmp.plant,
        compiledEmp.department,
        compiledEmp.designation,
        compiledEmp.empType,
        compiledEmp.joinDate,
        compiledEmp.status,
        compiledEmp.leaveDate,
        compiledEmp.leaveReason,
        compiledEmp.bankName,
        compiledEmp.accHolder,
        compiledEmp.accNo,
        compiledEmp.branchName,
        compiledEmp.ifsc,
        compiledEmp.payType,
        compiledEmp.salType,
        compiledEmp.basicRate,
        compiledEmp.otRate,
        compiledEmp.payCycle,
        compiledEmp.emgName,
        compiledEmp.emgRel,
        compiledEmp.emgMobile,
        compiledEmp.emgAddress,
        compiledEmp.courseDetails,
        compiledEmp.experience,
        compiledEmp.prevCompany,
        compiledEmp.skillType,
        compiledEmp.uniformSize,
        compiledEmp.shoesSize,
        compiledEmp.remark,
      ],
    };

    setTimeout(() => {
      StorageService.addApproval(reqObj);
      StorageService.addNotification(
        `HR Form Submitted (${actionType})`,
        `Form for ${compiledEmp.fullName} (${compiledEmp.empId}) submitted by ${currentUsername} to HR Approvals.`,
        'info'
      );
      setIsSubmitting(false);
      setSubmitToast({
        title: 'Form Submitted Successfully!',
        message: `Employee details for ${compiledEmp.fullName} (${compiledEmp.empId}) submitted to HR Approvals queue.`,
      });
      setTimeout(() => setSubmitToast(null), 5000);
    }, 400);
  };

  // Instant Download Joining Form PDF
  const handleDownloadJoiningForm = () => {
    if (!fullName) {
      alert('Please fill employee details first!');
      return;
    }
    if (joiningPrintRef.current) {
      printNativeDocument(
        joiningPrintRef.current.innerHTML,
        `${fullName.replace(/\s+/g, '_')}_Joining_Form`,
        false
      );
    }
  };

  // Instant Download ID Card
  const handleDownloadIdCard = () => {
    if (!fullName) {
      alert('Please fill employee details first!');
      return;
    }
    if (idCardPrintRef.current) {
      printNativeDocument(
        idCardPrintRef.current.innerHTML,
        `${fullName.replace(/\s+/g, '_')}_ID_Card`,
        true
      );
    }
  };

  const compiledCurrent = getCompiledEmployeeObject();

  return (
    <div className="space-y-4">
      {/* Toast Notification Banner on Submission */}
      {submitToast && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-between shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold text-sm text-emerald-300">{submitToast.title}</p>
              <p className="text-xs text-emerald-200/90">{submitToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setSubmitToast(null)}
            className="p-1 rounded hover:bg-emerald-500/20 text-emerald-300 cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Mode Selector Tabs */}
      <div
        className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3 shadow-sm ${
          theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setMode('add');
              setSearchedEmp(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'add'
                ? 'bg-[#FF8500] text-black shadow-md'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New Employee</span>
          </button>
          <button
            onClick={() => {
              setMode('edit');
              setSearchedEmp(null);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'edit'
                ? 'bg-amber-500 text-black shadow-md'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Edit className="w-4 h-4" />
            <span>Edit Existing Employee</span>
          </button>
          <button
            onClick={() => setMode('search')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'search'
                ? 'bg-sky-500 text-black shadow-md'
                : 'bg-neutral-800 text-neutral-300 hover:text-white'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search Employee Database</span>
          </button>
        </div>
      </div>

      {/* ---------------- MODE: SEARCH EMPLOYEE DATABASE ---------------- */}
      {mode === 'search' && (
        <div
          className={`p-6 rounded-2xl border shadow-sm space-y-5 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="border-b border-neutral-700/60 pb-3">
            <h4 className="font-bold text-base text-sky-400 flex items-center gap-2">
              <Search className="w-5 h-5" /> Search Employee Database & Download Documents
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              Search any registered staff by ID, Mobile, or Name to instantly generate official Joining Form and ID Card.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Search by Employee ID (e.g. 1001)"
              className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono"
            />
            <input
              type="text"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              placeholder="Search by Mobile (10 digits)"
              className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white font-mono"
            />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Search by Employee Name"
              className="p-2.5 bg-neutral-900 border border-neutral-700 rounded-lg text-white"
            />
            <button
              onClick={handleSearch}
              className="py-2.5 bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-colors"
            >
              <Search className="w-4 h-4 stroke-[2.5]" />
              <span>SEARCH RECORD</span>
            </button>
          </div>

          {searchedEmp ? (
            <div className="p-5 rounded-xl border border-neutral-700 bg-neutral-900/80 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-lg border border-sky-500/30">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-base text-white">{searchedEmp.fullName}</h5>
                    <p className="text-xs text-neutral-400">
                      ID: <span className="font-mono text-[#FF8500]">{searchedEmp.empId}</span> | Designation: <span className="text-neutral-300">{searchedEmp.designation}</span> | Company: <span className="text-neutral-300">{searchedEmp.company}</span>
                    </p>
                  </div>
                </div>

                {/* Exclusive Download Buttons ONLY in Search Tab */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    onClick={handleDownloadJoiningForm}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg"
                    title="Download Official Joining Form PDF"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Joining Form</span>
                  </button>
                  <button
                    onClick={handleDownloadIdCard}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-lg"
                    title="Download Standard 54x85.6mm ID Card"
                  >
                    <IdCard className="w-4 h-4" />
                    <span>Download ID Card</span>
                  </button>
                  <button
                    onClick={() => {
                      populateFormFromEmployee(searchedEmp);
                      setMode('edit');
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-colors cursor-pointer shadow-lg"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit Details</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-neutral-300">
                <div>
                  <span className="text-neutral-500 block">Mobile Number</span>
                  <span className="font-mono font-bold text-white">{searchedEmp.mobile}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Aadhaar Number</span>
                  <span className="font-mono font-bold text-white">{searchedEmp.aadhaar || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">PAN Number</span>
                  <span className="font-mono font-bold text-white">{searchedEmp.pan || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Status</span>
                  <span className="font-bold text-emerald-400">{searchedEmp.status}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 block">Address</span>
                  <span>{searchedEmp.address}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-neutral-500 block">Bank Account & IFSC</span>
                  <span className="font-mono">{searchedEmp.bankName} - {searchedEmp.accNo} ({searchedEmp.ifsc})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-400 border border-dashed border-neutral-800 rounded-xl">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50 text-sky-400" />
              <p className="font-semibold text-xs">Enter Employee ID, Mobile, or Name above to preview records and download documents.</p>
            </div>
          )}
        </div>
      )}

      {/* Edit Mode Search Box (When in Edit Mode) */}
      {mode === 'edit' && (
        <div
          className={`p-4 rounded-xl border shadow-sm ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
          }`}
        >
          <h4 className="text-xs font-bold text-amber-400 uppercase mb-2">Search Employee to Load for Editing</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Employee ID (e.g. 1001)"
              className="p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
            />
            <input
              type="text"
              value={searchMobile}
              onChange={(e) => setSearchMobile(e.target.value)}
              placeholder="Mobile Number"
              className="p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
            />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder="Name"
              className="p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
            />
            <button
              onClick={handleSearch}
              className="py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Load Employee</span>
            </button>
          </div>
        </div>
      )}

      {/* Master Form: Rendered only in Add or Edit Mode (NOT in search mode) */}
      {(mode === 'add' || mode === 'edit') && (
        <div
          className={`p-6 rounded-2xl border shadow-sm space-y-6 ${
            theme === 'dark' ? 'bg-[#1e1e1e] border-neutral-800' : 'bg-white border-slate-200'
          }`}
        >
        {/* Section 1: Personal Details */}
        <div>
          <h4 className="text-sm font-bold text-[#FF8500] uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            1. Personal Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">E Code</label>
              <input
                type="text"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                placeholder="1001"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Ramesh Suresh Patil"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold capitalize"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Father Name</label>
              <input
                type="text"
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                placeholder="Suresh"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white capitalize"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Mother Name</label>
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder="Kavita"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white capitalize"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">DOB</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Blood Group</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold"
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
              <label className="block text-neutral-400 mb-1">Marital Status</label>
              <select
                value={marital}
                onChange={(e) => setMarital(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Children Count</label>
              <input
                type="number"
                value={children}
                onChange={(e) => setChildren(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Employee Photo</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-xs font-semibold cursor-pointer">
                  <Camera className="w-4 h-4 text-[#FF8500]" />
                  <span>Capture / Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, setPhoto)}
                    className="hidden"
                  />
                </label>
                {photo && (
                  <img
                    src={photo}
                    alt="Preview"
                    className="w-10 h-12 object-cover rounded border border-neutral-700"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div>
          <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            2. Contact & Address
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Mobile *</label>
              <input
                type="text"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Alt Mobile</label>
              <input
                type="text"
                maxLength={10}
                value={altMobile}
                onChange={(e) => setAltMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Email ID</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Pincode *</label>
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => handlePincodeChange(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Taluka</label>
              <input
                type="text"
                value={taluka}
                onChange={(e) => setTaluka(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Permanent Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  if (sameAddress) setCurrentAddress(e.target.value);
                }}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-neutral-400">Current Address</label>
                <label className="flex items-center gap-1 text-[11px] text-[#FF8500] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => {
                      setSameAddress(e.target.checked);
                      if (e.target.checked) setCurrentAddress(address);
                    }}
                    className="rounded accent-[#FF8500]"
                  />
                  <span>Same as Perm</span>
                </label>
              </div>
              <input
                type="text"
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                readOnly={sameAddress}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: KYC */}
        <div>
          <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            3. Identifications (KYC)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <label className="block text-neutral-400 mb-1">Aadhaar No</label>
              <input
                type="text"
                maxLength={12}
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                placeholder="12 digits"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">PAN Card No</label>
              <input
                type="text"
                maxLength={10}
                value={pan}
                onChange={(e) => setPan(e.target.value.toUpperCase())}
                placeholder="ABCDE1234F"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">UAN No</label>
              <input
                type="text"
                value={uan}
                onChange={(e) => setUan(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">ESIC No</label>
              <input
                type="text"
                value={esic}
                onChange={(e) => setEsic(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
          </div>

          {/* KYC Documents: Aadhaar & PAN Card Uploads with Camera & Upload buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
            {/* Aadhaar Card Document */}
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                Aadhaar Card Document / Photo (Front & Back)
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-[#FF8500]" />
                  <span>Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, setAadhaarFront)}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, setAadhaarFront)}
                    className="hidden"
                  />
                </label>
                {aadhaarFront && (
                  <div className="flex items-center gap-2">
                    <img
                      src={aadhaarFront}
                      alt="Aadhaar"
                      className="w-10 h-7 object-cover rounded border border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => setAadhaarFront('')}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* PAN Card Document */}
            <div>
              <label className="block text-neutral-300 font-semibold mb-1.5">
                PAN Card Document / Photo
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                  <Camera className="w-3.5 h-3.5 text-[#FF8500]" />
                  <span>Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, setPanPhoto)}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span>Upload File</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileUpload(e, setPanPhoto)}
                    className="hidden"
                  />
                </label>
                {panPhoto && (
                  <div className="flex items-center gap-2">
                    <img
                      src={panPhoto}
                      alt="PAN"
                      className="w-10 h-7 object-cover rounded border border-neutral-700"
                    />
                    <button
                      type="button"
                      onClick={() => setPanPhoto('')}
                      className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Work Details */}
        <div>
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            4. Work Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Company</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Plant</label>
              <input
                type="text"
                value={companyPlant}
                onChange={(e) => setCompanyPlant(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Designation</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Joining Date</label>
              <input
                type="date"
                value={joinDate}
                onChange={(e) => setJoinDate(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Employee Status</label>
              <select
                value={empStatus}
                onChange={(e) => setEmpStatus(e.target.value as any)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Left">Left</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Bank Details */}
        <div>
          <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            5. Bank Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Bank Name</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Bank of Maharashtra"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-bold"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Branch Name</label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="Branch"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Account Number</label>
              <input
                type="text"
                value={accNo}
                onChange={(e) => setAccNo(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">IFSC Code</label>
              <input
                type="text"
                value={ifsc}
                onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                placeholder="MAHB0000456"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono uppercase"
              />
            </div>
          </div>
        </div>

        {/* Section 6: Emergency Information */}
        <div>
          <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            6. Emergency Info
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Emergency Name</label>
              <input
                type="text"
                value={emgName}
                onChange={(e) => setEmgName(e.target.value)}
                placeholder="Relative name"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Relationship</label>
              <input
                type="text"
                value={emgRel}
                onChange={(e) => setEmgRel(e.target.value)}
                placeholder="Father, Brother, Wife"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Emergency Mobile</label>
              <input
                type="text"
                maxLength={10}
                value={emgMobile}
                onChange={(e) => setEmgMobile(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Emergency Address</label>
              <input
                type="text"
                value={emgAddress}
                onChange={(e) => setEmgAddress(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 7: Educational Details */}
        <div>
          <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800 mb-3">
            <h4 className="text-sm font-bold text-purple-400 uppercase tracking-wider">
              7. Educational Details
            </h4>
            <button
              type="button"
              onClick={addEduRow}
              className="flex items-center gap-1 text-xs text-[#FF8500] hover:underline cursor-pointer font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Course Row</span>
            </button>
          </div>

          <div className="space-y-2">
            {eduRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-2 text-xs items-center">
                <div>
                  <select
                    value={row[0]}
                    onChange={(e) => updateEduRow(idx, 0, e.target.value)}
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                  >
                    <option value="">Course</option>
                    <option value="10th (SSC)">10th (SSC)</option>
                    <option value="12th (HSC)">12th (HSC)</option>
                    <option value="ITI">ITI</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Degree">Degree</option>
                    <option value="PG">PG / Master</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <input
                    type="text"
                    value={row[1]}
                    onChange={(e) => updateEduRow(idx, 1, e.target.value)}
                    placeholder="University / Board / City"
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={row[2]}
                    onChange={(e) => updateEduRow(idx, 2, e.target.value)}
                    placeholder="Year (e.g. 2014)"
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row[3]}
                    onChange={(e) => updateEduRow(idx, 3, e.target.value)}
                    placeholder="65.50%"
                    className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white font-mono"
                  />
                  {eduRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeEduRow(idx)}
                      className="p-1.5 rounded text-rose-400 hover:bg-neutral-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 8: Experience & Skills */}
        <div>
          <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            8. Experience & Skills
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-neutral-400 mb-1">Experience</label>
              <input
                type="text"
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                placeholder="Fresher / 1 Year / 2 Years"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Previous Company</label>
              <input
                type="text"
                value={prevCompany}
                onChange={(e) => setPrevCompany(e.target.value)}
                placeholder="Old Tech Ltd / None"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Skill / Work Type</label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Management / Operator / Helper"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 9: Other Details & Documents */}
        <div>
          <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider pb-1.5 border-b border-neutral-800 mb-3">
            9. Other Details & Documents
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs mb-3">
            <div>
              <label className="block text-neutral-400 mb-1">Uniform Size</label>
              <select
                value={uniformSize}
                onChange={(e) => setUniformSize(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              >
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
                <option value="XXL">XXL</option>
              </select>
            </div>
            <div>
              <label className="block text-neutral-400 mb-1">Shoes Size</label>
              <select
                value={shoesSize}
                onChange={(e) => setShoesSize(e.target.value)}
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              >
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                <option value="11">11</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-neutral-400 mb-1">Remark</label>
              <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="Good Worker / Active"
                className="w-full p-2 bg-neutral-900 border border-neutral-700 rounded text-white"
              />
            </div>
          </div>

          {/* Leaving Certificate Photo */}
          <div className="p-3.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
            <label className="block text-neutral-300 font-semibold mb-1.5">
              Leaving Certificate Photo / Document
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                <Camera className="w-3.5 h-3.5 text-[#FF8500]" />
                <span>Camera</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleFileUpload(e, setLeavingCert)}
                  className="hidden"
                />
              </label>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => handleFileUpload(e, setLeavingCert)}
                  className="hidden"
                />
              </label>
              {leavingCert && (
                <div className="flex items-center gap-2">
                  <img
                    src={leavingCert}
                    alt="Leaving Cert"
                    className="w-10 h-7 object-cover rounded border border-neutral-700"
                  />
                  <button
                    type="button"
                    onClick={() => setLeavingCert('')}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit to HR Action */}
        <div className="pt-4 border-t border-neutral-800 flex justify-end items-center gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitToHR}
            className={`btn-3d-orange flex items-center gap-2 px-8 py-3 rounded-xl bg-[#FF8500] hover:bg-[#e07500] text-black font-extrabold text-sm transition-all shadow-xl cursor-pointer ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>PROCESSING SUBMISSION...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>SUBMIT DETAILS TO HR APPROVAL</span>
              </>
            )}
          </button>
        </div>
      </div>
      )}

      {/* Hidden PDF/Printable Document Containers with EXACT Styles */}
      <div style={{ display: 'none' }}>
        <div ref={joiningPrintRef}>
          <JoiningFormDocument
            employee={compiledCurrent}
            vendorName={company}
            companyAddress={address}
          />
        </div>
        <div ref={idCardPrintRef}>
          <IdCardDocument
            employee={compiledCurrent}
            vendorName={company}
            companyAddress={address}
          />
        </div>
      </div>
    </div>
  );
};
