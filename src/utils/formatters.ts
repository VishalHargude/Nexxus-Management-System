// Utility formatters and calculations

export function safeEvalMath(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = String(val).replace(/[^0-9+\-*/.()]/g, '');
  if (!clean) return 0;
  try {
    const result = new Function('return ' + clean)();
    return isNaN(result) ? 0 : Number(result);
  } catch {
    return parseFloat(String(val)) || 0;
  }
}

export function toTitleCase(str: string): string {
  if (!str) return '';
  return String(str).toLowerCase().replace(/(^\w{1})|(\s+\w{1})/g, (l) => l.toUpperCase());
}

export function formatDateCustom(dateVal: any): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string' && /[0-9]{2}\.[0-9]{2}\.[0-9]{4}/.test(dateVal)) return dateVal;
  if (typeof dateVal === 'string' && /[0-9]{2} [A-Za-z]{3} [0-9]{4}/.test(dateVal)) return dateVal;
  
  let d: Date;
  if (typeof dateVal === 'number' && dateVal > 25000) {
    const utc_days = Math.floor(dateVal - 25569);
    const utc_value = utc_days * 86400;
    d = new Date(utc_value * 1000);
  } else {
    d = new Date(dateVal);
  }

  if (isNaN(d.getTime())) return String(dateVal).trim();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function formatDateForDisplayMonth(dateVal: any): string {
  if (!dateVal) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateForInput(dateVal: any): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) {
    if (typeof dateVal === 'string' && dateVal.includes('-') && dateVal.length === 10) return dateVal;
    return new Date().toISOString().split('T')[0];
  }
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatToDDMMYYYY(dateVal: string): string {
  if (!dateVal || dateVal === 'null') return '-';
  if (dateVal.includes('-') && dateVal.split('-')[0].length === 4) {
    const p = dateVal.split('-');
    return `${p[2]}.${p[1]}.${p[0]}`;
  }
  return dateVal;
}

export function formatCurrencyINR(num: number): string {
  return '₹ ' + (parseFloat(String(num)) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function convertNumberToWords(num: number): string {
  if (isNaN(num)) return '';
  if (num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen ',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const numRounded = Math.round(num);
  let str = '';
  const numStr = ('000000000' + numRounded).slice(-9);
  const crore = parseInt(numStr.substring(0, 2), 10);
  const lakh = parseInt(numStr.substring(2, 4), 10);
  const thousand = parseInt(numStr.substring(4, 6), 10);
  const hundred = parseInt(numStr.substring(6, 7), 10);
  const rest = parseInt(numStr.substring(7, 9), 10);

  if (crore > 0) str += (crore < 20 ? a[crore] : b[Math.floor(crore / 10)] + ' ' + a[crore % 10]) + 'Crore ';
  if (lakh > 0) str += (lakh < 20 ? a[lakh] : b[Math.floor(lakh / 10)] + ' ' + a[lakh % 10]) + 'Lakh ';
  if (thousand > 0) str += (thousand < 20 ? a[thousand] : b[Math.floor(thousand / 10)] + ' ' + a[thousand % 10]) + 'Thousand ';
  if (hundred > 0) str += a[hundred] + 'Hundred ';
  if (rest > 0) str += (str !== '' ? 'and ' : '') + (rest < 20 ? a[rest] : b[Math.floor(rest / 10)] + ' ' + a[rest % 10]);

  return 'Rupees ' + str.trim() + ' Only';
}

export function cleanTimeFormat(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
  const str = String(val).trim();
  const exactMatch = str.match(/(\d{2}):(\d{2}):\d{2}/);
  if (exactMatch && (str.includes('GMT') || str.includes('1899'))) {
    return `${exactMatch[1]}:${exactMatch[2]}`;
  }
  const match = str.match(/(\d{1,2}):(\d{2})/);
  if (match) {
    return `${String(match[1]).padStart(2, '0')}:${String(match[2])}`;
  }
  return str;
}
