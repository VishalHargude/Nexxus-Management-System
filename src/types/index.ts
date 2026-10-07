export interface Employee {
  rowIndex?: number;
  srNo?: number;
  empId: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  marital: string;
  noOfChildren: string;
  mobile: string;
  altMobile: string;
  email: string;
  photo: string;
  address: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  pincode: string;
  aadhaar: string;
  pan: string;
  pfNo: string;
  uan: string;
  esic: string;
  esicIp: string;
  company: string;
  plant: string;
  department: string;
  designation: string;
  empType: string;
  joinDate: string;
  status: 'Active' | 'Inactive' | 'Left';
  leaveDate: string;
  leaveReason: string;
  bankName: string;
  accHolder: string;
  accNo: string;
  branchName?: string;
  ifsc: string;
  payType: string;
  salType: string;
  basicRate: number;
  otRate: number;
  payCycle: string;
  emgName: string;
  emgRel: string;
  emgMobile: string;
  emgAddress: string;
  qualification: string;
  experience: string;
  prevCompany: string;
  skillType: string;
  uniformSize: string;
  shoesSize: string;
  remark: string;
  // Documents base64
  aadhaarFront?: string;
  aadhaarBack?: string;
  panPhoto?: string;
  passbookPhoto?: string;
  leavingCert?: string;
  courseDetails?: string; // Format: "10th^PUNE^2014^68.5%|12th^PUNE^2016^71%"
}

export interface AttendanceRecord {
  srNo: number;
  company: string;
  plant: string;
  date: string;
  shift: string;
  empName: string;
  contact: string;
  inTime: string;
  outTime: string;
  totalHours: string;
  extraHours: string;
  payment: number;
  paymentStatus: 'Pending' | 'Paid';
  payer: string;
  extraPayment: number;
  type: string;
  remark: string;
}

export interface InvoiceItem {
  sr: number;
  name: string;
  hsn: string;
  qtyVal: number;
  rate: number;
  total: number;
}

export interface TaxInvoice {
  invoiceNo: string;
  date: string;
  invoicePeriod: string;
  fromCompany: string;
  fromAddress: string;
  fromGst: string;
  fromPan: string;
  fromEmail: string;
  toCompany: string;
  toAddress: string;
  toGst: string;
  toPan: string;
  toEmail: string;
  subTotal: number;
  centralTax: number;
  stateTax: number;
  totalGst: number;
  tdsAmount?: number;
  grandTotal: number;
  items: InvoiceItem[];
}

export interface InvoicePayment {
  paymentId: string;
  invoiceNo: string;
  paymentDate: string;
  receivedAmount: number;
  paymentMode: string;
  utr: string;
  remark: string;
}

export interface JobWorkRecord {
  rowIndex?: number;
  srNo: number;
  date: string;
  company: string;
  plant: string;
  empName: string;
  contact: string;
  jobDetails: string;
  jobWeight: number;
  qty: number;
  inKg: number;
  inTon: number;
  remark: string;
}

export interface PayrollRecord {
  rowIndex: number;
  srNo: number;
  salaryMonth: string;
  company: string;
  vendor?: string;
  plant: string;
  eCode: string;
  employeeName: string;
  status: string;
  acNo?: string;
  bank?: string;
  epfNo?: string;
  panNo?: string;
  pfUan?: string;
  department?: string;
  designation?: string;
  monthDays?: number;
  presentDays?: number;
  actualPayDay: number;
  hd?: number;
  weeklyOff?: number;
  pl?: number;
  ph?: number;
  basicDa?: number;
  hra?: number;
  conv?: number;
  bonusEarn?: number;
  otAmt?: number;
  attInc1?: number;
  attInc2?: number;
  totalEarnings?: number;
  pf12?: number;
  esic?: number;
  profTax?: number;
  lwf?: number;
  grossDeduction: number;
  subTotalEmp?: number;
  netSalary: number;
  gst?: number;
  serviceCharge?: number;
  totalOtHrs?: number;
  ctcPostGst?: number;
  ctc: number;
  doj?: string;
}

export interface ExpenseRecord {
  id: string | number;
  srNo?: number;
  date: string;
  company: string;
  plant: string;
  category: string;
  transactionDetails: string;
  amount: number;
  gstRate: number;
  gst: number;
  totalExpense: number;
  totalAmountPaid: number;
  paymentStatus: 'Paid' | 'Pending' | 'Partial';
  paymentType: string;
  payer: string;
  remark: string;
}

export interface CompanyRecord {
  companyName: string;
  plant: string;
  address: string;
  mobile: string;
  email: string;
  shopAct: string;
  udyam: string;
  esic: string;
  pf: string;
  pan: string;
  gst: string;
  bankName: string;
  accountNo: string;
  ifsc: string;
}

export interface JobDetailMaster {
  srNo: number;
  jobName: string;
  weight: number;
}

export interface InterviewCandidate {
  id: string;
  name: string;
  mobile: string;
  position: string;
  address: string;
  date: string;
  time: string;
  status: 'Scheduled' | 'Completed' | 'Selected' | 'Rejected' | 'Not Present' | 'Rescheduled' | 'Joined';
  joinDate: string;
  remark: string;
}

export interface PendingApprovalRequest {
  rowIndex: number;
  empId: string;
  name: string;
  action: 'New' | 'Edit';
  status: 'Pending' | 'Approved' | 'Rejected' | 'Rechecked';
  requestedBy: string;
  timestamp: string;
  fullData: any[];
  headers?: string[];
  rejectReason?: string;
}

export interface FundTransaction {
  txId: string;
  date: string;
  rawDate: string;
  from: string;
  to: string;
  amount: number;
  purpose: string;
  fundId: string;
  remark: string;
}

export interface InvestmentBalance {
  name: string;
  current: number;
}

export interface SystemUser {
  rowIndex?: number;
  srNo: number;
  userId: string;
  password?: string;
  userName: string;
  mobile: string;
  email: string;
  role: string;
  department: string;
  accessLevel: string;
  assignedPlant: string;
  status: 'Active' | 'Inactive';
  createdDate?: string;
  lastLogin?: string;
  remark?: string;
}

export interface SystemNotification {
  id: string;
  date: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  status: 'Unread' | 'Read';
}
