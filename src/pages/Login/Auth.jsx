import React, { useState } from 'react';

export default function Auth({ onClose, customers, setCustomers, roles, onLogin }) {
  const [authMode, setAuthMode] = useState('login_guest'); // login_guest, register_guest, login_staff
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (authMode === 'login_staff') {
      const staffMember = roles[phone];
      if (!staffMember) return alert("Сотрудник с таким номером не найден!");
      if (staffMember.password !== password) return alert("Неверный пароль!");
      
      onLogin({ role: staffMember.role, phone, name: staffMember.name, station: staffMember.station });
      return;
    }

    if (authMode === 'login_guest') {
      const client = customers[phone];
      if (!client) return alert("Номер не зарегистрирован. Создайте профиль.");
      alert(`Код отправлен на ${phone}. Введите 1234`);
      // Для прототипа пускаем сразу, в реале тут проверка СМС
      onLogin({ role: 'guest', phone, name: client.name });
      return;
    }

    if (authMode === 'register_guest') {
      if (!name) return alert("Введите имя!");
      setCustomers(prev => ({ ...prev, [phone]: { phone, name, bonuses: 0, totalSpent: 0 } }));
      onLogin({ role: 'guest', phone, name });
      alert("Профиль успешно создан!");
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ backgroundColor: '#fff', padding: '40px', borderRadius: '24px', width: '90%', maxWidth: '400px', textAlign: 'center', position: 'relative' }}>
        {onClose && <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '20px' }}>✖</button>}
        
        <h2 style={{ margin: '0 0 20px 0' }}>
          {authMode === 'login_guest' ? 'Вход для гостей' : authMode === 'register_guest' ? 'Создать профиль' : 'Вход для персонала'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="tel" placeholder={authMode === 'login_staff' ? "Номер сотрудника (напр. 001002003)" : "Номер телефона (напр. 7707...)"} value={phone} onChange={(e) => setPhone(e.target.value)} required style={{ padding: '16px', borderRadius: '14px', border: '1px solid #d1d5db' }} />
          
          {authMode === 'login_staff' && (
            <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '16px', borderRadius: '14px', border: '1px solid #d1d5db' }} />
          )}

          {authMode === 'register_guest' && (
            <input type="text" placeholder="Ваше Имя" value={name} onChange={(e) => setName(e.target.value)} required style={{ padding: '16px', borderRadius: '14px', border: '1px solid #d1d5db' }} />
          )}

          <button type="submit" style={{ padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: authMode === 'login_staff' ? '#3b82f6' : '#10b981', color: '#fff', fontWeight: 'bold' }}>
            {authMode === 'register_guest' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {authMode !== 'login_guest' && <button onClick={() => setAuthMode('login_guest')} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline' }}>Войти как гость</button>}
          {authMode !== 'register_guest' && <button onClick={() => setAuthMode('register_guest')} style={{ background: 'none', border: 'none', color: '#6b7280', textDecoration: 'underline' }}>Создать профиль</button>}
          {authMode !== 'login_staff' && <button onClick={() => setAuthMode('login_staff')} style={{ marginTop: '10px', padding: '10px', borderRadius: '10px', border: '2px solid #111827', background: 'transparent', color: '#111827', fontWeight: 'bold' }}>👔 Войти как персонал</button>}
        </div>
      </div>
    </div>
  );
}