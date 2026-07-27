import React, { useState } from 'react';

export default function Registration() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e) => {
    e.preventDefault(); 
    
    if (name.trim() === '') {
      setError('Пожалуйста, введите имя!');
      return;
    }

    setError('');
    console.log('Пользователь зарегистрирован:', name);
    // Здесь будет код перехода в профиль
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center' }}>Регистрация</h2>
      
      <form onSubmit={handleRegister}>
        <input 
          type="text" 
          placeholder="Например: Абылайхан" 
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(''); 
          }}
          style={{ 
            width: '100%', 
            padding: '12px', 
            borderRadius: '8px',
            border: error ? '2px solid red' : '1px solid #ccc',
            marginBottom: '10px',
            boxSizing: 'border-box'
          }}
        />
        
        {error && <div style={{ color: 'red', marginBottom: '10px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <button 
          type="submit" 
          style={{ width: '100%', padding: '15px', backgroundColor: '#900', color: '#fff', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}
        >
          Завершить
        </button>
      </form>
    </div>
  );
}