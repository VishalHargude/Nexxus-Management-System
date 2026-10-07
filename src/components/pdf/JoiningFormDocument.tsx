import React from 'react';
import { Employee } from '../../types';
import { formatToDDMMYYYY, toTitleCase } from '../../utils/formatters';

interface Props {
  employee: Employee;
  vendorName?: string;
  companyAddress?: string;
}

export const JoiningFormDocument: React.FC<Props> = ({
  employee,
  vendorName = 'NEXXUS FACILITY',
  companyAddress = 'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013',
}) => {
  const cNameFull = employee.company || vendorName;
  const cName = cNameFull.split('-')[0] ? cNameFull.split('-')[0].trim() : cNameFull;
  const vPlantStr = employee.plant || '';
  const vName = vPlantStr.split('-')[0] ? vPlantStr.split('-')[0].trim() : (cName || 'NEXXUS FACILITY');

  const eName = employee.fullName ? toTitleCase(employee.fullName) : '';
  const dojStr = employee.joinDate ? formatToDDMMYYYY(employee.joinDate) : '-';
  const dobStr = employee.dob ? formatToDDMMYYYY(employee.dob) : '-';
  const desig = employee.designation ? toTitleCase(employee.designation) : 'Worker';
  const empGender = employee.gender || 'Male';

  let ageVal = '';
  if (employee.dob) {
    const diff = Date.now() - new Date(employee.dob).getTime();
    if (!isNaN(diff)) {
      ageVal = String(Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)));
    }
  }

  // Parse educational courses
  const eduRows: [string, string, string, string][] = [];
  if (employee.courseDetails) {
    const rows = employee.courseDetails.split('|');
    rows.forEach((r) => {
      if (r.trim()) {
        const parts = r.split('^');
        eduRows.push([parts[0] || '', parts[1] || '', parts[2] || '', parts[3] || '']);
      }
    });
  }
  if (eduRows.length === 0) {
    eduRows.push(['10th (SSC)', 'Maharashtra Board', '2014', '64.50%']);
    eduRows.push(['12th (HSC)', 'Maharashtra Board', '2016', '68.00%']);
  }

  const jhaloStr = empGender === 'Female' ? 'झाले' : 'झालो';
  const shaktoStr = empGender === 'Female' ? 'शकते' : 'शकतो';

  const isNexxus = cName.toUpperCase().includes('NEXXUS') || cName.toUpperCase().includes('NEX');

  // Extract city from address
  let cityPlace = 'Pune';
  const distMatch = companyAddress.match(/dist(?:rict)?[\s\-_:\.]*([a-zA-Z]+)/i);
  if (distMatch && distMatch[1]) {
    cityPlace = distMatch[1].trim();
  }

  return (
    <div
      id="pdfTemplate"
      className="joining-form-wrapper"
      style={{
        background: '#fff',
        color: '#000',
        width: '794px',
        maxHeight: '1110px',
        border: 'none',
        padding: '20px 35px 15px 35px',
        boxSizing: 'border-box',
        fontFamily: "'Josefin Sans', sans-serif",
        margin: '0 auto',
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        pageBreakAfter: 'avoid',
        pageBreakInside: 'avoid',
        textTransform: 'capitalize',
      }}
    >
      <h2
        style={{
          textAlign: 'center',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 800,
          marginTop: '5px',
          marginBottom: '2px',
          fontSize: '24px',
          textTransform: 'uppercase',
          color: '#111',
          letterSpacing: '0px',
        }}
      >
        {isNexxus ? (
          <>
            <span style={{ color: '#111' }}>NEX</span>
            <span style={{ color: '#ff8c00' }}>X</span>
            <span style={{ color: '#111' }}>US FACILITY</span>
          </>
        ) : (
          <span style={{ color: '#111' }}>{cName.toUpperCase()}</span>
        )}
      </h2>

      <h4
        style={{
          textAlign: 'center',
          fontFamily: "'Josefin Sans', sans-serif",
          marginTop: '0',
          marginBottom: '12px',
          fontSize: '18px',
          textDecoration: 'underline',
          textTransform: 'uppercase',
        }}
      >
        JOINING FORM
      </h4>

      <h4
        style={{
          background: '#f4f4f4',
          fontFamily: "'Josefin Sans', sans-serif",
          padding: '5px 8px',
          fontSize: '15px',
          marginBottom: '6px',
          fontWeight: 'bold',
          border: '1px solid #000',
          textTransform: 'none',
        }}
      >
        Employee Personal Information
      </h4>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          marginBottom: '6px',
          fontFamily: "'Josefin Sans', sans-serif",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '76%', verticalAlign: 'top', padding: 0 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', tableLayout: 'fixed' }}>
                <tbody>
                  <tr>
                    <td style={{ width: '155px', padding: '6px 0' }}>Name:</td>
                    <td colSpan={3}>
                      <span style={{ fontWeight: 'bold' }}>{eName || '-'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Father Name:</td>
                    <td colSpan={3}>
                      <span style={{ fontWeight: 'bold' }}>{employee.fatherName ? toTitleCase(employee.fatherName) : '-'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Mother Name:</td>
                    <td colSpan={3}>
                      <span style={{ fontWeight: 'bold' }}>{employee.motherName ? toTitleCase(employee.motherName) : '-'}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ width: '155px', padding: '6px 0' }}>Date of Birth:</td>
                    <td style={{ width: '175px', padding: '6px 0' }}>
                      <span style={{ fontWeight: 'bold' }}>{dobStr}</span>
                    </td>
                    <td style={{ width: '125px', padding: '6px 0' }}>Date of Joining:</td>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ fontWeight: 'bold' }}>{dojStr}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 0' }}>Blood Group:</td>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{employee.bloodGroup || '-'}</span>
                    </td>
                    <td style={{ padding: '6px 0' }}>Age:</td>
                    <td style={{ padding: '6px 0' }}>
                      <span style={{ fontWeight: 'bold' }}>{ageVal || '-'}</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: '24%', verticalAlign: 'top', textAlign: 'right', padding: 0 }}>
              <div
                style={{
                  width: '110px',
                  height: '130px',
                  border: '1px solid #000',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  float: 'right',
                  background: '#fdfdfd',
                  marginTop: '2px',
                }}
              >
                {employee.photo ? (
                  <img
                    src={employee.photo}
                    alt="Photo"
                    style={{ width: '110px', height: '130px', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ color: '#666', fontSize: '13px', textTransform: 'none' }}>Photo</span>
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          marginBottom: '6px',
          tableLayout: 'fixed',
          fontFamily: "'Josefin Sans', sans-serif",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '155px', padding: '6px 0' }}>Permanent Address:</td>
            <td>
              <span style={{ fontWeight: 'bold' }}>{employee.address ? toTitleCase(employee.address) : '-'}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}>Current Address:</td>
            <td>
              <span style={{ fontWeight: 'bold' }}>
                {employee.address ? toTitleCase(employee.address) : '-'}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          marginBottom: '6px',
          tableLayout: 'fixed',
          fontFamily: "'Josefin Sans', sans-serif",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '155px', padding: '6px 0' }}>Gender:</td>
            <td style={{ width: '175px', padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{empGender}</span>
            </td>
            <td style={{ width: '125px', padding: '6px 0' }}>Marital Status:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.marital || 'Single'}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}>Contact No:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.mobile || '-'}</span>
            </td>
            <td style={{ padding: '6px 0' }}>Emergency No:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.emgMobile || '-'}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}>Aadhaar No:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.aadhaar || '-'}</span>
            </td>
            <td style={{ padding: '6px 0' }}>PAN No:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{employee.pan || '-'}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}>UAN No:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.uan || '-'}</span>
            </td>
            <td style={{ padding: '6px 0' }}>ESIC Number:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.esic || '-'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Educational Details */}
      <div style={{ marginTop: '6px' }}>
        <h4
          style={{
            background: '#f4f4f4',
            fontFamily: "'Josefin Sans', sans-serif",
            padding: '4px 8px',
            fontSize: '15px',
            margin: 0,
            fontWeight: 'bold',
            border: '1px solid #000',
            borderBottom: 'none',
            textTransform: 'none',
          }}
        >
          Educational Details
        </h4>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '13.5px',
            textAlign: 'center',
            border: '1px solid #000',
            fontFamily: "'Josefin Sans', sans-serif",
          }}
        >
          <thead>
            <tr style={{ fontWeight: 'bold', background: '#fdfdfd', textTransform: 'none' }}>
              <td style={{ padding: '4px', border: '1px solid #000', width: '8%' }}>Sr. No.</td>
              <td style={{ padding: '4px', border: '1px solid #000', width: '32%' }}>Course</td>
              <td style={{ padding: '4px', border: '1px solid #000', width: '30%' }}>University / Board</td>
              <td style={{ padding: '4px', border: '1px solid #000', width: '15%' }}>Year</td>
              <td style={{ padding: '4px', border: '1px solid #000', width: '15%' }}>Percentage</td>
            </tr>
          </thead>
          <tbody>
            {eduRows.map((r, idx) => (
              <tr key={idx}>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{idx + 1}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{r[0]}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textTransform: 'capitalize' }}>
                  {toTitleCase(r[1])}
                </td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{r[2]}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ height: '18px' }} />

      {/* Bank Details */}
      <h4
        style={{
          background: '#f4f4f4',
          fontFamily: "'Josefin Sans', sans-serif",
          padding: '4px 8px',
          fontSize: '15px',
          marginTop: '0px',
          marginBottom: '6px',
          fontWeight: 'bold',
          border: '1px solid #000',
          textTransform: 'none',
        }}
      >
        Bank Details
      </h4>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          textAlign: 'left',
          tableLayout: 'fixed',
          fontFamily: "'Josefin Sans', sans-serif",
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '155px', padding: '6px 0' }}>Bank Name:</td>
            <td style={{ width: '175px', padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.bankName ? toTitleCase(employee.bankName) : '-'}</span>
            </td>
            <td style={{ width: '125px', padding: '6px 0' }}>Account No.:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>{employee.accNo || '-'}</span>
            </td>
          </tr>
          <tr>
            <td style={{ padding: '6px 0' }}>Branch Name:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold' }}>
                {employee.branchName ? toTitleCase(employee.branchName) : '-'}
              </span>
            </td>
            <td style={{ padding: '6px 0' }}>IFSC No.:</td>
            <td style={{ padding: '6px 0' }}>
              <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{employee.ifsc || '-'}</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Notice Section with exact original Marathi copy */}
      <h4
        style={{
          textAlign: 'left',
          fontFamily: "'Josefin Sans', sans-serif",
          marginTop: '10px',
          marginBottom: '3px',
          fontWeight: 'bold',
          fontSize: '15px',
          textTransform: 'none',
        }}
      >
        Notice
      </h4>
      <div
        style={{
          fontSize: '13.5px',
          fontFamily: "'Josefin Sans', sans-serif",
          lineHeight: 1.45,
          textAlign: 'justify',
          marginLeft: '3px',
          marginBottom: '4px',
          textIndent: '30px',
          textTransform: 'none',
        }}
      >
        मी <b>{eName}</b>, <b>{cName}</b> यांचेकडून दिनांक <b>{dojStr}</b> ला <b>{vName}</b> कंपनीमध्ये{' '}
        <b>{desig}</b> या पदनामावर रुजू {jhaloStr} आहे. कंपनीच्या नियमानुसार मी 15 दिवस सूचना कालावधी देऊन काम सोडू{' '}
        {shaktoStr} तसे न केल्यास कंपनी माझा पगार थांबवू शकते याला माझी काहीच हरकत नसेल. तसेच खालील अटी आणि नियम मला मान्य
        आहेत.
      </div>

      <ol
        style={{
          fontSize: '13px',
          fontFamily: "'Josefin Sans', sans-serif",
          lineHeight: 1.45,
          marginTop: '2px',
          paddingLeft: '20px',
          marginBottom: '6px',
          textTransform: 'none',
        }}
      >
        <li style={{ marginBottom: '1px' }}>न सांगता सुट्टी घेतली तर कंपनी 2 दिवसांचा पगार कमी करू शकते.</li>
        <li style={{ marginBottom: '1px' }}>
          कंपनी मध्ये साठवणूक केलेली वस्तु पदार्थ चोरतांना किंवा खाताना पकडले गेल्यावर कामावरून काढून टाकण्यात येईल तसेच
          पगार मिळणार नाही.
        </li>
        <li style={{ marginBottom: '1px' }}>
          कंपनीत बंद असणारे वस्तु पदार्थ आणणे तसेच खाणे मनाई आहे. तसे आढळल्यास कंपनी त्वरित कार्यवाही करू शकते.
        </li>
        <li style={{ marginBottom: '1px' }}>
          कंपनीमध्ये सुपरवायझर / स्टाफ यांनी दिलेली कामे कोणतीही सबब न सांगता पूर्ण करण्यात येईल तसे न केल्यास कंपनीच्या
          कार्यवाहीस सामोरे जावे लागेल.
        </li>
        <li style={{ marginBottom: '1px' }}>
          कंपनीमध्ये रुजू झाल्यानंतर ७ दिवस सतत हजर राहणे बंधनकारक आहे, जॉईन झाल्यानंतर ७ दिवस हजर न झाल्यास पगार मिळणार
          नाही.
        </li>
      </ol>
      <div
        style={{
          fontSize: '13.5px',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 'bold',
          marginLeft: '3px',
          marginTop: '4px',
          textTransform: 'none',
        }}
      >
        वरील सर्व नियम मी वाचले आहेत आणि मला मान्य आहेत.
      </div>

      <div style={{ height: '18px' }} />

      {/* Signature Section */}
      <table
        style={{
          width: '100%',
          fontSize: '13.5px',
          tableLayout: 'fixed',
          fontFamily: "'Josefin Sans', sans-serif",
          textTransform: 'none',
        }}
      >
        <tbody>
          <tr>
            <td style={{ width: '20%', textAlign: 'left', verticalAlign: 'bottom', paddingBottom: '4px', whiteSpace: 'nowrap' }}>
              Date: <span style={{ fontWeight: 'bold' }}>{dojStr}</span>
            </td>
            <td style={{ width: '40%', textAlign: 'left', verticalAlign: 'bottom', paddingBottom: '4px', fontWeight: 'normal', paddingLeft: '10px', whiteSpace: 'nowrap' }}>
              Emp Signature
            </td>
            <td style={{ width: '40%', textAlign: 'left', verticalAlign: 'bottom', paddingBottom: '4px', fontWeight: 'normal', paddingLeft: '10px', whiteSpace: 'nowrap' }}>
              Company Signature
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '4px', whiteSpace: 'nowrap' }}>
              Place: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{cityPlace}</span>
            </td>
            <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '4px', paddingLeft: '10px', wordBreak: 'break-word', lineHeight: 1.3 }}>
              Emp Name: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{eName}</span>
            </td>
            <td style={{ textAlign: 'left', verticalAlign: 'top', paddingTop: '4px', paddingLeft: '10px', wordBreak: 'break-word', lineHeight: 1.3 }}>
              Company Name: <span style={{ fontWeight: 'bold', textTransform: 'uppercase' }}>{cName}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <div
        id="pdfFooterVendor"
        style={{
          position: 'absolute',
          bottom: '6px',
          left: 0,
          right: 0,
          paddingBottom: '4px',
          margin: '0 auto',
          textAlign: 'center',
          fontSize: '11px',
          fontFamily: "'Josefin Sans', sans-serif",
          fontWeight: 'bold',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: '#b0b0b0',
        }}
      >
        {isNexxus ? 'NEXXUS FACILITY' : cName.toUpperCase()}
      </div>
    </div>
  );
};
