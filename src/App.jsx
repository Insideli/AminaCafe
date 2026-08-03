import React, { useState, useEffect, Component } from 'react';
import GuestApp from './GuestApp.jsx';
import StaffApp from './StaffApp.jsx';
import { INITIAL_CUSTOMERS, useLocalStorage } from './data.js';

// 🔥 ИМПОРТ FIREBASE ДЛЯ GOOGLE AUTH
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

// 🔥 ТВОИ КЛЮЧИ FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCayZ8gSclC24Y9ORgJuUOM6y-PXgp9wDE",
  authDomain: "amina-c7864.firebaseapp.com",
  projectId: "amina-c7864",
  storageBucket: "amina-c7864.firebasestorage.app",
  messagingSenderId: "216648759773",
  appId: "1:216648759773:web:93584a988e605f86a91e34",
  measurementId: "G-5X5RGCRY2H"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', minHeight: '100vh', fontFamily: 'monospace' }}>
          <h2>🚨 Ошибка:</h2>
          <p>{this.state.error?.toString()}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} style={{ padding: '12px 20px', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Сбросить кэш</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function useDeviceStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; } 
    catch (error) { return initialValue; }
  });
  useEffect(() => { 
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch(e){} 
  }, [key, value]);
  return [value, setValue];
}

function MainApp() {
  const [showSplash, setShowSplash] = useState(true);
  const [customers, setCustomers] = useLocalStorage('amina_pinta_customers_v1', INITIAL_CUSTOMERS);
  const [analytics, setAnalytics] = useLocalStorage('amina_pinta_analytics_v1', { qr: 0, link: 0 });

  const [currentUser, setCurrentUser] = useDeviceStorage('amina_current_user_device', { role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null }); 
  const [lang, setLang] = useDeviceStorage('amina_lang_device', 'ru');
  const isAuthenticated = !!currentUser.phone;

  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login_guest'); 
  const [tempPhone, setTempPhone] = useState(''); 
  const [tempPassword, setTempPassword] = useState('');
  const [staffLoginLoading, setStaffLoginLoading] = useState(false);
  const [staffSessionChecked, setStaffSessionChecked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref === 'qr') { setAnalytics(prev => ({ ...prev, qr: (prev?.qr || 0) + 1 })); window.history.replaceState(null, '', window.location.pathname); } 
    else if (ref === 'link') { setAnalytics(prev => ({ ...prev, link: (prev?.link || 0) + 1 })); window.history.replaceState(null, '', window.location.pathname); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  useEffect(() => {
    if (showAuthModal) {
      document.body.style.overflow = 'hidden';
      document.body.style.overscrollBehavior = 'none';
    } else {
      document.body.style.overflow = 'auto';
      document.body.style.overscrollBehavior = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.overscrollBehavior = 'auto';
    };
  }, [showAuthModal]);


  // ================================================================
  // 🔐 ЗАЩИЩЁННЫЙ ВХОД ДЛЯ ПЕРСОНАЛА ЧЕРЕЗ VERCEL FUNCTION
  // ================================================================
  useEffect(() => {
    let cancelled = false;

    const restoreStaffSession = async () => {
      try {
        const response = await fetch('/api/auth?action=session', {
          method: 'GET',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) {
          if (!cancelled && currentUser.role !== 'guest') {
            setCurrentUser({ role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null });
          }
          return;
        }

        const data = await response.json();
        if (!cancelled && data?.user) {
          setCurrentUser({ ...data.user, sessionToken: null });
        }
      } catch (error) {
        console.warn('Не удалось проверить сессию сотрудника:', error);
        if (!cancelled && currentUser.role !== 'guest') {
          setCurrentUser({ role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null });
        }
      } finally {
        if (!cancelled) setStaffSessionChecked(true);
      }
    };

    void restoreStaffSession();
    return () => { cancelled = true; };
    // Проверяем серверную сессию один раз при запуске приложения.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStaffSubmit = async (e) => {
    e.preventDefault();
    if (staffLoginLoading) return;

    setStaffLoginLoading(true);
    try {
      const response = await fetch('/api/auth?action=login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ employeeId: tempPhone.trim(), password: tempPassword }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || (lang === 'ru' ? 'Не удалось войти.' : 'Кіру мүмкін болмады.'));
      }

      setCurrentUser({ ...data.user, sessionToken: null });
      setStaffSessionChecked(true);
      setTempPassword('');
      setShowAuthModal(false);
    } catch (error) {
      alert(`❌ ${error.message}`);
    } finally {
      setStaffLoginLoading(false);
    }
  };

  // ================================================================
  // 🔥 ВХОД ДЛЯ ГОСТЕЙ (GOOGLE AUTH)
  // ================================================================
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userId = user.email; // Используем email вместо телефона
      const userName = user.displayName || 'Гость';

      let updatedCustomers = { ...(customers || {}) };

      // Если это новый гость, создаем профиль и даем бонусы
      if (!updatedCustomers[userId]) {
        updatedCustomers[userId] = {
          phone: userId, // Сохраняем как phone для совместимости с заказами
          name: userName,
          bonuses: 500,
          sessionToken: null
        };
      }

      const newToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
      updatedCustomers[userId].sessionToken = newToken;
      setCustomers(updatedCustomers);

      setCurrentUser({
        role: 'guest',
        phone: userId,
        name: userName,
        station: null,
        sessionToken: newToken
      });
      setShowAuthModal(false);
    } catch (error) {
      console.error('Ошибка входа через Google:', error);
      alert(lang === 'ru' ? "❌ Ошибка входа: " + error.message : "❌ Кіру қатесі: " + error.message);
    }
  };

  const logoutOrLogin = async () => {
    if (!isAuthenticated) {
      setAuthMode('login_guest');
      setShowAuthModal(true);
      return;
    }

    if (currentUser.role !== 'guest') {
      try {
        await fetch('/api/auth?action=logout', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        });
      } catch (error) {
        console.warn('Не удалось завершить серверную сессию:', error);
      }
    }

    setCurrentUser({ role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null });
  };

  if (!staffSessionChecked && currentUser.role !== 'guest') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f4f5f7', color: '#374151', fontWeight: 'bold' }}>
        Проверяем защищённую сессию…
      </div>
    );
  }

  if (showSplash) {
    return (
      <div style={{position: 'fixed', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', flexDirection: 'column', zIndex: 99999, overflow: 'hidden'}}>
        <div style={{width: '240px', height: '240px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', marginBottom: '20px', overflow: 'hidden'}}>
           <img src="/amina-logo.png.jpg" alt="Logo" style={{width: '100%', height: '100%', objectFit: 'contain'}} onError={(e) => { e.target.src = '/amina-logo.png'; }} />
        </div>
      </div>
    );
  }

  const activeUser = isAuthenticated ? currentUser : { role: 'guest', phone: '', name: lang === 'ru' ? 'Войти / Рег.' : 'Кіру / Тіркелу', isAnonymous: true };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        :root { color-scheme: light only !important; }
        body, html { background-color: #f4f5f7; color: #111827; }
        input, select, textarea { background-color: #fff; color: #111827; border: 1px solid #d1d5db; }
        input::placeholder, textarea::placeholder { color: #9ca3af; }
      `}} />

      {activeUser.role === 'guest' ? 
        <GuestApp currentUser={activeUser} logout={logoutOrLogin} lang={lang} setLang={setLang} deferredPrompt={deferredPrompt} /> : 
        <StaffApp currentUser={activeUser} logout={logoutOrLogin} lang={lang} setLang={setLang} />
      }

      {showAuthModal && (
        <div style={{ position: 'fixed', inset: 0, height: '100dvh', overscrollBehavior: 'none', backgroundColor: 'rgba(17, 24, 39, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', zIndex: 99999, backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '400px', textAlign: 'center', position: 'relative', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>

            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563' }}>✕</button>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>
              {authMode === 'login_guest' ? (lang === 'ru' ? 'Вход для гостей' : 'Қонақтарға арналған кіру') : (lang === 'ru' ? 'Вход для персонала' : 'Қызметкерлер үшін')}
            </h2>

            {authMode === 'login_guest' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                  {lang === 'ru' ? 'Войдите через аккаунт Google, чтобы получать бонусы и оформлять заказы без СМС!' : 'Тапсырыс беріп, бонус алу үшін Google арқылы кіріңіз!'}
                </p>
                <button onClick={handleGoogleSignIn} style={{ width: '100%', padding: '14px', borderRadius: '14px', border: '2px solid #e5e7eb', backgroundColor: '#fff', color: '#111827', fontWeight: '900', fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: '0.2s' }}>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google" style={{width: '24px'}} />
                  {lang === 'ru' ? 'Войти через Google' : 'Google арқылы кіру'}
                </button>
                <div style={{ marginTop: '15px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  <button onClick={() => {setAuthMode('login_staff'); setTempPhone('');}} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>💼 {lang === 'ru' ? 'Я сотрудник' : 'Мен қызметкермін'}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{textAlign: 'left'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginLeft: '5px'}}>{lang === 'ru' ? 'Логин (Номер)' : 'Логин'}</label>
                  <input type="tel" placeholder="Например: 001002003" value={tempPhone} onChange={(e) => setTempPhone(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', fontSize: '18px', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box', fontWeight: 'bold', letterSpacing: '1px' }} />
                </div>
                <div style={{textAlign: 'left'}}>
                  <label style={{fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginLeft: '5px'}}>{lang === 'ru' ? 'Пароль' : 'Құпия сөз'}</label>
                  <input type="password" placeholder="***" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} />
                </div>

                <button type="submit" disabled={staffLoginLoading} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: staffLoginLoading ? 'wait' : 'pointer', marginTop: '5px', opacity: staffLoginLoading ? 0.7 : 1 }}>
                  {staffLoginLoading ? (lang === 'ru' ? 'Проверяем…' : 'Тексерілуде…') : (lang === 'ru' ? 'Войти' : 'Кіру')}
                </button>
                <div style={{ marginTop: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '15px' }}>
                  <button type="button" onClick={() => setAuthMode('login_guest')} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>← {lang === 'ru' ? 'Назад к гостям' : 'Артқа'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AppWrapper() {
  return <ErrorBoundary><MainApp /></ErrorBoundary>;
}
