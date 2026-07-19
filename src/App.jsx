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

// Функция отправки заказа в Paloma (ключ берется из .env)
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Загружаем данные пользователя из Firestore
        const docRef = doc(db, "users", firebaseUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          // Если новый пользователь — создаём запись с ролью guest
          const newUser = {
            role: "guest",
            name: "Гость",
            phone: firebaseUser.email,
            bonuses: 500,
            totalSpent: 0
          };
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

  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f4f5f7' }}>
        <div style={{ fontSize: '30px' }}>⏳ Загрузка...</div>
      </div>
    );
  }

  // Если не авторизован — показываем страницу входа
  if (!user) {
    return <LoginPage />;
  }

  // Если авторизован — передаём sendToPaloma в дочерние компоненты
  return userData?.role === 'guest' ? (
    <GuestApp currentUser={userData} logout={logout} sendToPaloma={sendToPaloma} />
  ) : (
    <StaffApp currentUser={userData} logout={logout} sendToPaloma={sendToPaloma} />
  );
}

// Страница входа
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7', fontFamily: '-apple-system, sans-serif' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
        <h2 style={{ textAlign: 'center', margin: '0 0 30px 0', fontSize: '24px', color: '#111827' }}>Вход в систему</h2>
        {error && (
          <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="email"
            placeholder="Email (например, admin@amina.kz)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '16px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            style={{ padding: '16px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', width: '100%' }}
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
