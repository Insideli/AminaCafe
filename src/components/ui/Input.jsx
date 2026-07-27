import React from 'react';

const Input = ({ label, type = 'text', value, onChange, placeholder, required = false }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%', textAlign: 'left' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', marginLeft: '4px' }}>
          {label}
        </label>
      )}
      <input 
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '2px solid var(--secondary)',
          backgroundColor: 'var(--surface)',
          fontSize: '16px',
          color: 'var(--text-main)',
          boxSizing: 'border-box',
          outline: 'none',
          transition: 'var(--transition)'
        }}
        // Эффект при клике
        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--secondary)'}
      />
    </div>
  );
};

export default Input;

