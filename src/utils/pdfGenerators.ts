import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaxInvoice, InvoiceItem, PayrollRecord } from '../types';
import { formatDateCustom, convertNumberToWords } from './formatters';

// Extend jsPDF interface for autoTable properties
interface ExtendedJsPDF extends jsPDF {
  lastAutoTable?: {
    finalY: number;
  };
}

export function renderSingleInvoicePage(
  doc: jsPDF,
  data: TaxInvoice,
  unitTitle: string = 'Qty',
  startPageNum: number = 1
) {
  const extDoc = doc as ExtendedJsPDF;
  const supplierName = (data.fromCompany || 'NEXXUS FACILITY').toUpperCase();
  const supplierAddress = data.fromAddress || '';
  const supplierGst = data.fromGst || '';
  const supplierPan = data.fromPan || '';
  const supplierEmail = data.fromEmail || '';
  const customerName = (data.toCompany || '').toUpperCase();
  const customerAddress = data.toAddress || '';
  const customerGst = data.toGst || '';
  const customerPan = data.toPan || '';
  const customerEmail = data.toEmail || '';
  const startY = 24;

  doc.setFont('helvetica', 'bold');
  if (supplierName === 'NEXXUS FACILITY' || supplierName.includes('NEXXUS')) {
    doc.setFontSize(29.5);
    const nexWidth = doc.getTextWidth('NEX');
    const xWidth = doc.getTextWidth('X');
    const usWidth = doc.getTextWidth('US ');
    const facilityWidth = doc.getTextWidth('FACILITY');
    const totalWidth = nexWidth + xWidth + usWidth + facilityWidth;
    const startX = (210 - totalWidth) / 2;
    doc.setTextColor(15, 23, 42);
    doc.text('NEX', startX, startY);
    doc.setTextColor(255, 133, 0); // Orange
    doc.text('X', startX + nexWidth, startY);
    doc.setTextColor(15, 23, 42);
    doc.text('US ', startX + nexWidth + xWidth, startY);
    doc.text('FACILITY', startX + nexWidth + xWidth + usWidth, startY);
  } else {
    doc.setFontSize(30.5);
    doc.setTextColor(220, 38, 38);
    doc.text(supplierName, 105, startY, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11.5);
  doc.setTextColor(55, 65, 81);
  const topAddrLines = doc.splitTextToSize(supplierAddress, 178);
  let topAddrY = startY + 7.5;
  topAddrLines.slice(0, 2).forEach((line: string) => {
    doc.text(line, 105, topAddrY, { align: 'center' });
    topAddrY += 5.2;
  });

  const lineUnderAddrY = Math.max(topAddrY + 2.5, startY + 18);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, lineUnderAddrY, 196, lineUnderAddrY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14.5);
  doc.setTextColor(0, 0, 0);
  doc.text('TAX INVOICE', 105, lineUnderAddrY + 7, { align: 'center' });
  doc.setDrawColor(200, 200, 200);
  doc.line(14, lineUnderAddrY + 10, 196, lineUnderAddrY + 10);

  const metaY = lineUnderAddrY + 15;
  const invNoText = 'Invoice No.: ' + (data.invoiceNo || '');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  const invNoWidth = doc.getTextWidth(invNoText);
  let rightXPos = 196;
  if (invNoWidth > 55) {
    rightXPos = 196 - (invNoWidth - 55);
  }
  doc.setTextColor(0, 0, 0);
  doc.text('Invoice Date: ' + formatDateCustom(data.date || ''), 14, metaY);
  doc.text(invNoText, rightXPos, metaY, { align: 'right' });

  const boxY = metaY + 4;
  let splitFromAddr = doc.splitTextToSize(supplierAddress, 82);
  let splitToAddr = doc.splitTextToSize(customerAddress, 82);
  if (splitFromAddr.length > 3) splitFromAddr = splitFromAddr.slice(0, 3);
  if (splitToAddr.length > 3) splitToAddr = splitToAddr.slice(0, 3);

  const addrStartY = boxY + 16.0;
  const lineSpacing = 3.9;
  const gstLabelY = addrStartY + 3 * lineSpacing + 1.5;
  const gstValY = gstLabelY + 4.2;
  const emailY = gstValY + 4.8;
  const boxHeight = emailY + 4.2 - boxY;

  doc.setDrawColor(150, 150, 150);
  doc.rect(14, boxY, 182, boxHeight);
  doc.line(105, boxY, 105, boxY + boxHeight);

  // Supplier Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(85, 85, 85);
  doc.text('FROM / SUPPLIER', 17, boxY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(supplierName, 17, boxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  let fCurY = addrStartY;
  splitFromAddr.forEach((l: string) => {
    doc.text(l, 17, fCurY);
    fCurY += lineSpacing;
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(85, 85, 85);
  doc.text('GSTIN:', 17, gstLabelY);
  doc.text('PAN:', 65, gstLabelY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(supplierGst, 17, gstValY);
  doc.text(supplierPan, 65, gstValY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(85, 85, 85);
  doc.text('Email ID: ', 17, emailY);
  const sEmailLabelW = doc.getTextWidth('Email ID: ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(supplierEmail, 17 + sEmailLabelW, emailY);

  // Customer Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(85, 85, 85);
  doc.text('BILL TO / CUSTOMER', 108, boxY + 5.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text(customerName, 108, boxY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(50, 50, 50);
  let tCurY = addrStartY;
  splitToAddr.forEach((l: string) => {
    doc.text(l, 108, tCurY);
    tCurY += lineSpacing;
  });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(85, 85, 85);
  doc.text('GSTIN:', 108, gstLabelY);
  doc.text('PAN:', 155, gstLabelY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text(customerGst, 108, gstValY);
  doc.text(customerPan, 155, gstValY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(85, 85, 85);
  doc.text('Email ID: ', 108, emailY);
  const cEmailLabelW = doc.getTextWidth('Email ID: ');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(0, 0, 0);
  doc.text(customerEmail, 108 + cEmailLabelW, emailY);

  let periodBoxY = boxY + boxHeight + 5;
  if (data.invoicePeriod && data.invoicePeriod.trim() !== 'To') {
    doc.setDrawColor(234, 88, 12);
    doc.setFillColor(255, 247, 237);
    doc.roundedRect(35, periodBoxY, 140, 9.5, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(0, 0, 0);
    doc.text('Invoice for the Period of: ' + data.invoicePeriod, 105, periodBoxY + 6.5, { align: 'center' });
    periodBoxY += 13.5;
  } else {
    periodBoxY += 3;
  }

  const tableItems = data.items || [];
  const tableRows = tableItems.map((i) => [
    { content: i.sr || 1, styles: { halign: 'center' as const } },
    { content: i.name || '', styles: { halign: 'left' as const } },
    { content: i.hsn || '', styles: { halign: 'center' as const } },
    { content: i.qtyVal !== undefined ? i.qtyVal : 1, styles: { halign: 'center' as const } },
    { content: parseFloat(String(i.rate || 0)).toFixed(2), styles: { halign: 'right' as const } },
    { content: parseFloat(String(i.total || 0)).toFixed(2), styles: { halign: 'right' as const } },
  ]);

  autoTable(doc, {
    startY: periodBoxY,
    margin: { top: 20, bottom: 25, left: 14, right: 14 },
    head: [
      [
        { content: 'Sr', styles: { halign: 'center' } },
        { content: 'Name of Product / Service', styles: { halign: 'left' } },
        { content: 'HSN / SAC', styles: { halign: 'center' } },
        { content: 'Qty (' + unitTitle + ')', styles: { halign: 'center' } },
        { content: 'Rate', styles: { halign: 'right' } },
        { content: 'Total Amount', styles: { halign: 'right' } },
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [234, 88, 12],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      font: 'helvetica',
    },
    styles: {
      fontSize: 8.5,
      fontStyle: 'normal',
      textColor: [0, 0, 0],
      lineWidth: 0.2,
      lineColor: [100, 100, 100],
      font: 'helvetica',
    },
    tableLineColor: [100, 100, 100],
    tableLineWidth: 0.2,
    showHead: 'everyPage',
  });

  let finalY = extDoc.lastAutoTable ? extDoc.lastAutoTable.finalY + 5 : periodBoxY + 30;
  const hasTds = data.tdsAmount && parseFloat(String(data.tdsAmount)) > 0;
  const spaceNeeded = hasTds ? 35 : 30;
  if (finalY + spaceNeeded > 275) {
    doc.addPage();
    finalY = 25;
  }

  const subTotalVal = parseFloat(String(data.subTotal || 0));
  const finalTotalGst = Math.round(parseFloat(String(data.totalGst || 0)));
  const cgstValPdf = parseFloat(String(data.centralTax || 0)).toFixed(2);
  const sgstValPdf = parseFloat(String(data.stateTax || 0)).toFixed(2);
  const tdsValPdf = hasTds ? parseFloat(String(data.tdsAmount)) : 0;
  const finalGrandTotal = Math.round(subTotalVal + finalTotalGst - tdsValPdf);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(0, 0, 0);
  doc.text('Taxable Value:', 130, finalY);
  doc.text(subTotalVal.toFixed(2), 196, finalY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('CGST Rs:', 130, finalY + 5.5);
  doc.text(cgstValPdf, 196, finalY + 5.5, { align: 'right' });
  doc.text('SGST Rs:', 130, finalY + 11);
  doc.text(sgstValPdf, 196, finalY + 11, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Total GST:', 130, finalY + 16.5);
  doc.text(String(finalTotalGst), 196, finalY + 16.5, { align: 'right' });

  let currentYOffset = 19.5;
  if (hasTds) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Less: TDS @ 0.85%:', 130, finalY + 22);
    doc.text('-' + tdsValPdf.toFixed(2), 196, finalY + 22, { align: 'right' });
    currentYOffset = 25;
  }
  doc.setDrawColor(180, 180, 180);
  doc.line(130, finalY + currentYOffset, 196, finalY + currentYOffset);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GRAND TOTAL:', 130, finalY + currentYOffset + 7);
  doc.text(String(finalGrandTotal), 196, finalY + currentYOffset + 7, { align: 'right' });

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(10.5);
  doc.text('Amount in Words: ', 14, finalY + currentYOffset + 19.5);
  const prefixWidth = doc.getTextWidth('Amount in Words: ');
  doc.setFont('helvetica', 'italic');
  doc.text(convertNumberToWords(finalGrandTotal), 14 + prefixWidth, finalY + currentYOffset + 19.5);

  const signY = finalY + currentYOffset + 32.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('For ' + supplierName, 196, signY, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Authorised Signatory', 196, signY + 34, { align: 'right' });

  const totalPages = doc.getNumberOfPages();
  for (let p = startPageNum; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(130, 130, 130);
    doc.text('THIS IS A SYSTEM GENERATED TAX INVOICE', 105, 291, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(170, 170, 170);
    doc.text(supplierName, 105, 295, { align: 'center' });
  }
}

export function generateInvoicePDF(
  data: TaxInvoice,
  items: InvoiceItem[],
  unitTitle: string = 'Qty',
  isPreviewOnly: boolean = false
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  renderSingleInvoicePage(doc, { ...data, items }, unitTitle, 1);
  const filename = (data.invoiceNo || 'Invoice').replace(/\//g, '_') + '_Invoice.pdf';
  if (isPreviewOnly) {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    window.open(blobUrl, '_blank');
  } else {
    doc.save(filename);
  }
}

export function printBulkInvoices(invoices: TaxInvoice[]) {
  if (!invoices || invoices.length === 0) return;
  const doc = new jsPDF('p', 'mm', 'a4');
  invoices.forEach((invData, idx) => {
    if (idx > 0) doc.addPage();
    renderSingleInvoicePage(doc, invData, 'Qty', idx + 1);
  });
  const pdfBlob = doc.output('blob');
  const blobUrl = URL.createObjectURL(pdfBlob);
  window.open(blobUrl, '_blank');
}

// -------------------------------------------------------------
// EXACT NATIVE PRINT ENGINE (For Joining Form & ID Card)
// -------------------------------------------------------------
export function printNativeDocument(contentHtml: string, title: string, isIDCard: boolean = false) {
  const cssRules = isIDCard
    ? `@page { size: 54mm 85.6mm; margin: 0; }
       body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; background: #fff; font-family: "Josefin Sans", sans-serif !important; text-transform: capitalize; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .id-card-wrapper { display: block !important; position: static !important; width: 54mm !important; height: 85.6mm !important; border: none !important; box-shadow: none !important; margin: 0 !important; }`
    : `@page { size: A4 portrait; margin: 12mm 15mm 10mm 15mm; }
       body { margin: 0; padding: 0; background: #fff; font-family: "Josefin Sans", sans-serif !important; text-transform: capitalize; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
       .joining-form-wrapper { display: block !important; position: static !important; width: 100% !important; margin: 0 auto !important; border: none !important; box-shadow: none !important; padding: 0 !important; }`;

  const printWindow = window.open('', '_blank', isIDCard ? 'width=450,height=650' : 'width=950,height=900');
  if (!printWindow) {
    alert('Pop-up was blocked. Please allow pop-ups for this site to print/download documents.');
    return;
  }

  printWindow.document.open();
  printWindow.document.write(`<!DOCTYPE html><html><head><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>${cssRules}</style>
  </head><body>${contentHtml}</body></html>`);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 700);
}

// -------------------------------------------------------------
// EXACT PAYSLIP PDF & PRINT ENGINE
// -------------------------------------------------------------
export function printSinglePayslip(r: PayrollRecord) {
  const html = generateSinglePayslipHtml(r);
  const fullDoc = `<!DOCTYPE html><html><head><title>Payslip_${r.employeeName}</title>
    <style>@media print { @page { size: landscape; margin: 5mm; } body { -webkit-print-color-adjust: exact; margin: 0; font-family: Arial, sans-serif; } }</style>
  </head><body>${html}</body></html>`;
  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) {
    alert('Please allow pop-ups to print payslips.');
    return;
  }
  win.document.open();
  win.document.write(fullDoc);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 500);
}

export function printBulkPayslips(records: PayrollRecord[]) {
  let combinedHtml = '';
  records.forEach((r, index) => {
    combinedHtml += generateSinglePayslipHtml(r);
    if (index < records.length - 1) {
      combinedHtml += `<div style="page-break-after: always; height: 10px;"></div>`;
    }
  });

  const fullDoc = `<!DOCTYPE html><html><head><title>Bulk_Payslips</title>
    <style>@media print { @page { size: landscape; margin: 5mm; } body { -webkit-print-color-adjust: exact; margin: 0; font-family: Arial, sans-serif; } div { page-break-inside: avoid; } }</style>
  </head><body>${combinedHtml}</body></html>`;
  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) {
    alert('Please allow pop-ups to print payslips.');
    return;
  }
  win.document.open();
  win.document.write(fullDoc);
  win.document.close();
  setTimeout(() => {
    win.focus();
    win.print();
  }, 800);
}

export function generateSinglePayslipHtml(r: PayrollRecord): string {
  const rawCompany = (r.vendor || r.company || 'NEXXUS FACILITY').toUpperCase();
  let vendorHeader: string;
  if (rawCompany.includes('NEXXUS') || rawCompany.includes('NEX')) {
    vendorHeader = `<span style="color:#0a1e3f;">NEX</span><span style="color:#f36523;">X</span><span style="color:#0a1e3f;">US FACILITY</span>`;
  } else {
    vendorHeader = `<span style="color:#ff0000;">${rawCompany}</span>`;
  }

  const payPeriod = r.salaryMonth.toUpperCase();
  const formatAmt = (amt: any) =>
    parseFloat(amt || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const basic = r.basicDa || 0;
  const hra = r.hra || 0;
  const conv = r.conv || 0;
  const gradeAllow = (r.attInc1 || 0) + (r.attInc2 || 0);
  const otherInc = r.otAmt || 0;
  const bonusEarn = r.bonusEarn || 0;
  const totalEarn =
    (r.totalEarnings || 0) > 0 ? r.totalEarnings! : basic + hra + conv + gradeAllow + otherInc + bonusEarn;

  const pf = r.pf12 || 0;
  const pt = r.profTax || 0;
  const esi = r.esic || 0;
  const lwf = r.lwf || 0;
  const totalDed = (r.grossDeduction || 0) > 0 ? r.grossDeduction : pf + pt + esi + lwf;
  const net = r.netSalary || 0;

  return `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #fff; color: #000; width: 100%; max-width: 950px; margin: 0 auto; box-sizing: border-box;">
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 0.5px;">${vendorHeader}</div>
        <div style="font-size: 16px; margin-top: 10px; font-weight: bold; color: #000;">
          PAY SLIP FOR THE PERIOD OF ${payPeriod}
        </div>
      </div>

      <div style="border: 1px solid #000; border-radius: 8px; padding: 10px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; font-size: 11.5px;">
        <table style="width: 32%; border-collapse: collapse; font-size: 11.5px;">
          <tr><td style="padding: 3px 0; width: 65px;">Name</td><td style="width: 15px; text-align:center;">:</td><td> ${r.employeeName || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">Emp. ID</td><td style="text-align:center;">:</td><td> ${r.eCode || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">A/C No</td><td style="text-align:center;">:</td><td> ${r.acNo || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">EPF No</td><td style="text-align:center;">:</td><td> ${r.epfNo || '-'}</td></tr>
        </table>
        <table style="width: 32%; border-collapse: collapse; font-size: 11.5px;">
          <tr><td style="padding: 3px 0; width: 85px;">Department</td><td style="width: 15px; text-align:center;">:</td><td> ${r.department || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">Designation</td><td style="text-align:center;">:</td><td> ${r.designation || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">PAN No</td><td style="text-align:center;">:</td><td> ${r.panNo || '-'}</td></tr>
          <tr><td style="padding: 3px 0;"></td><td></td><td></td></tr>
        </table>
        <table style="width: 32%; border-collapse: collapse; font-size: 11.5px;">
          <tr><td style="padding: 3px 0; width: 90px;">Payable Days</td><td style="width: 15px; text-align:center;">:</td><td> ${formatAmt(r.actualPayDay || 0)}</td></tr>
          <tr><td style="padding: 3px 0;">Bank</td><td style="text-align:center;">:</td><td> ${r.bank || '-'}</td></tr>
          <tr><td style="padding: 3px 0;">PF UAN</td><td style="text-align:center;">:</td><td> ${r.pfUan || '-'}</td></tr>
          <tr><td style="padding: 3px 0;"></td><td></td><td></td></tr>
        </table>
      </div>

      <div style="border: 1px solid #000; border-radius: 8px; overflow: hidden; margin-bottom: 15px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: center;">
          <tr style="font-weight: bold; background-color: #f9f9f9;">
            <td style="border: 1px solid #000; border-top: none; border-left: none; padding: 6px;">Total Days</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">Present Days</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">HD</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">OD</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">Weekly off</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">CL</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">SL</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">PL</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">PH</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">AB</td>
            <td style="border: 1px solid #000; border-top: none; padding: 6px;">COFF</td>
            <td style="border: 1px solid #000; border-top: none; border-right: none; padding: 6px;">Assum.Days</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; border-bottom: none; border-left: none; padding: 6px;">${r.monthDays || '30'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">${r.presentDays || '0'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">${r.hd || '0'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">0</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">${r.weeklyOff || '0'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">0</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">0</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">${r.pl || '0'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">${r.ph || '0'}</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">0</td>
            <td style="border: 1px solid #000; border-bottom: none; padding: 6px;">0</td>
            <td style="border: 1px solid #000; border-bottom: none; border-right: none; padding: 6px;">0</td>
          </tr>
        </table>
      </div>

      <div style="border: 1px solid #000; border-radius: 8px; display: flex; overflow: hidden; margin-bottom: 15px;">
        <div style="width: 50%; border-right: 1px solid #000;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="font-weight: bold; border-bottom: 1px solid #000;">
              <td style="padding: 8px 12px; text-align: left;">Particulars</td>
              <td style="padding: 8px 12px; text-align: right;">Earnings (Rs.)</td>
            </tr>
            <tr><td style="padding: 5px 12px; border: none;">Basic Salary</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(basic)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">House Rent Allowance</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(hra)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">Conveyance Allowance</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(conv)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">Grade Allowance</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(gradeAllow)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">Other Incentives</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(otherInc)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">Statutory Bonus Monthly</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(bonusEarn)}</td></tr>
            <tr style="font-weight: bold; border-top: 1px solid #000;">
              <td style="padding: 8px 12px;">Total</td>
              <td style="padding: 8px 12px; text-align: right;">${formatAmt(totalEarn)}</td>
            </tr>
          </table>
        </div>

        <div style="width: 50%;">
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr style="font-weight: bold; border-bottom: 1px solid #000;">
              <td style="padding: 8px 12px; text-align: left; padding-left: 10px;">Particulars</td>
              <td style="padding: 8px 12px; text-align: right;">Deductions (Rs.)</td>
            </tr>
            <tr><td style="padding: 5px 12px; border: none; padding-left: 10px;">Provident Fund Contribution</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(pf)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none; padding-left: 10px;">Professional Tax</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(pt)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none; padding-left: 10px;">ESIC</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(esi)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none; padding-left: 10px;">LWF</td><td style="padding: 5px 12px; text-align: right; border: none;">${formatAmt(lwf)}</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">&nbsp;</td><td style="padding: 5px 12px; text-align: right; border: none;">&nbsp;</td></tr>
            <tr><td style="padding: 5px 12px; border: none;">&nbsp;</td><td style="padding: 5px 12px; text-align: right; border: none;">&nbsp;</td></tr>
            <tr style="font-weight: bold; border-top: 1px solid #000;">
              <td style="padding: 8px 12px; padding-left: 10px;">Total</td>
              <td style="padding: 8px 12px; text-align: right;">${formatAmt(totalDed)}</td>
            </tr>
          </table>
        </div>
      </div>

      <div style="border: 1px solid #000; border-radius: 8px; padding: 12px 15px; font-size: 14px; margin-bottom: 20px;">
        <div style="font-weight: bold; font-size: 15px; margin-bottom: 6px;">Net Pay (Rs.): ${net.toLocaleString('en-IN')}</div>
        <div><i><b>Amount In Words:</b> Rupees ${convertNumberToWords(Math.round(net))}</i></div>
      </div>

      <!-- Stamp and Signature Area (110px) -->
      <div style="height: 110px;"></div>

      <!-- Company Name on Right -->
      <div style="text-align: right; font-weight: bold; font-size: 15px; text-transform: uppercase; padding-right: 15px;">
        ${vendorHeader}
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; border-top: 1px dashed #ccc; padding-top: 10px; text-align: center; color: #888; font-size: 12px;">
        This is a system generated Payslip.
      </div>
    </div>
  `;
}
