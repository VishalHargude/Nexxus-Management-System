import React from 'react';
import { Employee } from '../../types';
import { formatToDDMMYYYY, toTitleCase } from '../../utils/formatters';

interface Props {
  employee: Employee;
  vendorName?: string;
  companyAddress?: string;
}

export const IdCardDocument: React.FC<Props> = ({
  employee,
  vendorName = 'NEXXUS FACILITY',
  companyAddress = 'Plot No. 45, Hadapsar Industrial Area, Pune, Maharashtra - 411013',
}) => {
  const cNameFull = employee.company || vendorName;
  const companyName = cNameFull.split('-')[0] ? cNameFull.split('-')[0].trim() : cNameFull;
  const isNexxus = companyName.toUpperCase().includes('NEXXUS') || companyName.toUpperCase().includes('NEX');

  const dojStr = employee.joinDate ? formatToDDMMYYYY(employee.joinDate) : '-';
  const eName = employee.fullName ? toTitleCase(employee.fullName) : '';

  return (
    <div
      id="idCardTemplate"
      className="id-card-wrapper"
      style={{
        width: '54mm',
        height: '85.6mm',
        border: '1px solid #ccc',
        background: '#ffffff',
        fontFamily: "'Josefin Sans', sans-serif",
        boxSizing: 'border-box',
        position: 'relative',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        overflow: 'hidden',
        borderRadius: '8px',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          background: '#ffffff',
          textAlign: 'center',
          padding: '10px 5px 4px 5px',
          borderBottom: '1px solid #bf360c',
        }}
      >
        <span
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 900,
            fontSize: '15px',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          {isNexxus ? (
            <>
              <span style={{ color: '#111' }}>NEX</span>
              <span style={{ color: '#ff8c00' }}>X</span>
              <span style={{ color: '#111' }}>US</span>
            </>
          ) : (
            <span style={{ color: '#111' }}>{companyName}</span>
          )}
        </span>
      </div>

      {/* Photo Frame */}
      <div style={{ textAlign: 'center', marginTop: '6px' }}>
        <div
          style={{
            width: '19mm',
            height: '24mm',
            margin: '0 auto',
            padding: '2px',
            border: '0.5px solid #bf360c',
            borderRadius: '6px',
            background: '#fdfdfd',
          }}
        >
          {employee.photo ? (
            <img
              src={employee.photo}
              alt="ID Photo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top center',
                borderRadius: '4px',
              }}
            />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#aaa',
                fontSize: '11px',
              }}
            >
              Photo
            </div>
          )}
        </div>
      </div>

      {/* Name and Designation */}
      <div style={{ textAlign: 'center', marginTop: '12px', padding: '0 5px' }}>
        <h4
          style={{
            margin: 0,
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '14.5px',
            fontWeight: 'bold',
            color: '#111',
            lineHeight: 1.1,
            textTransform: 'capitalize',
          }}
        >
          {eName}
        </h4>
        <p
          style={{
            margin: '3px 0 0 0',
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '10.5px',
            color: '#e65100',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {employee.designation || 'WORKER'}
        </p>
      </div>

      {/* Information Rows */}
      <div
        style={{
          margin: '12px 8px 0 8px',
          fontFamily: "'Josefin Sans', sans-serif",
          fontSize: '11px',
          lineHeight: 1.5,
          textAlign: 'center',
          padding: '2px 6px',
          color: '#000',
        }}
      >
        <div style={{ marginBottom: '4px' }}>
          <b style={{ color: '#000' }}>Emp ID:</b>{' '}
          <span style={{ fontWeight: 'bold', color: '#000' }}>{employee.empId}</span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <b style={{ color: '#000' }}>Joining Date:</b>{' '}
          <span style={{ fontWeight: 'bold', color: '#000' }}>{dojStr}</span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <b style={{ color: '#000' }}>Blood Group:</b>{' '}
          <span style={{ fontWeight: 'bold', color: '#000', textTransform: 'uppercase' }}>
            {employee.bloodGroup || '-'}
          </span>
        </div>
        <div style={{ marginBottom: '4px' }}>
          <b style={{ color: '#000' }}>Emergency No:</b>{' '}
          <span style={{ fontWeight: 'bold', color: '#000' }}>{employee.emgMobile || employee.mobile || '-'}</span>
        </div>
      </div>

      {/* Footer Address */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          background: '#ffffff',
          fontFamily: "'Josefin Sans', sans-serif",
          textAlign: 'center',
          padding: '3px 6px 4px 6px',
          borderTop: '1px solid #bf360c',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            fontSize: '8px',
            fontWeight: 900,
            color: '#111',
            textTransform: 'uppercase',
            marginBottom: '1px',
          }}
        >
          {companyName.toUpperCase()}
        </div>
        <div
          style={{
            fontSize: '7.5px',
            fontWeight: 500,
            color: '#666',
            lineHeight: 1.15,
            maxHeight: '3.4em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            textTransform: 'capitalize',
          }}
        >
          {toTitleCase(companyAddress)}
        </div>
      </div>
    </div>
  );
};
