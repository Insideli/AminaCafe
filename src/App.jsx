// src/App.jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import GuestApp from './GuestApp.jsx';
import StaffApp from './StaffApp.jsx';

// Инициализация Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Функция отправки заказа в Paloma
const sendToPaloma = async (orderData) => {
  try {
    const response = await fetch('https://api.paloma365.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_PALOMA_API_KEY}`
      },
      body: JSON.stringify(orderData)
    });
    if (!response.ok) throw new Error('Paloma error');
    console.log('✅ Заказ отправлен в Paloma:', orderData);
  } catch (error) {
    console.error('❌ Ошибка Paloma:', error);
  }
};

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          const newUser = { role: "guest", name: "Гость", phone: firebaseUser.email, bonuses: 500, totalSpent: 0 };
          await setDoc(docRef, newUser);
          setUserData(newUser);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const logout = () => {
    signOut(auth);
    setShowLogin(false);
  };

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center',
        backgroundColor: '#fff', flexDirection: 'column', zIndex: 99999, overflow: 'hidden'
      }}>
        <div style={{ width: '240px', height: '240px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginBottom: '20px', overflow: 'hidden' }}>
          <img src="/amina-logo.png.jpg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/amina-logo.png'; }} />
        </div>
        <h2 style={{ color: '#ea580c' }}>Загрузка...</h2>
      </div>
    );
  }

  // Если не авторизован, но кнопка входа не нажата — показываем гостевой экран
  if (!user) {
    return (
      <div>
        {/* Простой хедер с кнопкой входа */}
        <div style={{ padding: '15px 20px', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '900', color: '#111827' }}>АМИНА<span style={{ color: '#ea580c' }}>.</span></h1>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setShowLogin(true)} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Войти</button>
          </div>
        </div>
        
        {/* Гостевой контент (гость без регистрации) */}
        <GuestApp currentUser={{ role: 'guest', phone: '', name: 'Гость', isAnonymous: true }} logout={logout} sendToPaloma={sendToPaloma} />

        {/* Модальное окно входа */}
        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      </div>
    );
  }

  // Если авторизован — показываем полное приложение
  return userData?.role === 'guest' ? (
    <GuestApp currentUser={userData} logout={logout} sendToPaloma={sendToPaloma} />
  ) : (
    <StaffApp currentUser={userData} logout={logout} sendToPaloma={sendToPaloma} />
  );
}

// Модальное окно входа
function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onClose();
    } catch (error) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.8)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 99999, backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div style={{ background: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>Вход</h2>
        {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center' }}>{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
          <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} required style={{ padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px', width: '100%', boxSizing: 'border-box' }} />
          <button type="submit" style={{ padding: '16px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', width: '100%' }}>Войти</button>
        </form>
      </div>
    </div>
  );
}

export default App;
