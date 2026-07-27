import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  fullWidth = false, 
  type = 'button',
  style = {},
  ...props 
}) => {
  // Базовые стили для всех кнопок
  const baseStyle = {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    fontWeight: 'bold',
    fontSize: '16px',
    cursor: 'pointer',
    border: 'none',
    transition: 'var(--transition)',
    width: fullWidth ? '100%' : 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px'
  };

  // Варианты дизайна
  const variants = {
    primary: { backgroundColor: 'var(--primary)', color: '#ffffff' },
    secondary: { backgroundColor: 'var(--secondary)', color: 'var(--text-main)' },
    danger: { backgroundColor: 'var(--danger)', color: '#ffffff' },
    ghost: { backgroundColor: 'transparent', color: 'var(--text-muted)', padding: '8px' }
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      style={{ ...baseStyle, ...variants[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;

