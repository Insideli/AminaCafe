import React, { useState, useEffect, Component } from 'react';
import GuestApp from './GuestApp.jsx';
import StaffApp from './StaffApp.jsx';
import { INITIAL_CUSTOMERS, INITIAL_ROLES, useLocalStorage } from './data.js';

// 🔥 ИМПОРТ FIREBASE
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier } from "firebase/auth";

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

// 🔥 ВКЛЮЧАЕМ ТЕСТОВЫЙ РЕЖИМ (УБРАТЬ ПЕРЕД ЗАПУСКОМ!)
auth.settings.appVerificationDisabledForTesting = true;

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
  const [customers, setCustomers] = useLocalStorage('amina_customers_v12', INITIAL_CUSTOMERS);
  const [roles, setRoles] = useLocalStorage('amina_roles_v12', INITIAL_ROLES);
  const [analytics, setAnalytics] = useLocalStorage('amina_analytics_v12', { qr: 0, link: 0 });
  
  const [currentUser, setCurrentUser] = useDeviceStorage('amina_current_user_device', { role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null }); 
  const [lang, setLang] = useDeviceStorage('amina_lang_device', 'ru');
  const isAuthenticated = !!currentUser.phone;

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login_guest'); 
  const [authStep, setAuthStep] = useState('phone'); 
  const [tempPhone, setTempPhone] = useState('+7'); 
  const [tempCode, setTempCode] = useState('');
  const [tempName, setTempName] = useState(''); 
  const [tempPassword, setTempPassword] = useState('');

  const [isSending, setIsSending] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated && currentUser.phone) {
      let dbToken = null;
      if (currentUser.role === 'guest') {
        dbToken = (customers || {})[currentUser.phone]?.sessionToken;
      } else {
        dbToken = (roles || {})[currentUser.phone]?.sessionToken;
      }

      if (dbToken && currentUser.sessionToken && dbToken !== currentUser.sessionToken) {
        alert(lang === 'ru' ? "⚠️ Ваш аккаунт открыт на другом устройстве! Сессия завершена." : "⚠️ Аккаунтыңыз басқа құрылғыда ашылды! Сессия аяқталды.");
        setCurrentUser({ role: 'guest', phone: '', name: '', station: null, isSenior: false, sessionToken: null });
        window.location.reload();
      }
    }
  }, [roles, customers, currentUser, isAuthenticated, lang, setCurrentUser]);

  const handlePhoneChange = (e) => {
    let val = e.target.value;
    if (authMode === 'login_staff') { setTempPhone(val); } 
    else { val = val.replace(/[^\d+]/g, ''); if (!val.startsWith('+7')) { val = '+7' + val.replace(/^\+?7?/, ''); } if (val.length > 12) val = val.slice(0, 12); setTempPhone(val); }
  };

  // ================================================================
  // 🔥 ОТПРАВКА КОДА ЧЕРЕЗ FIREBASE
  // ================================================================
  const sendSmsCode = async () => {
    setIsSending(true);

    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': () => {},
          'expired-callback': () => {}
        });
      }
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, tempPhone, appVerifier);
      window.confirmationResult = confirmationResult;
      setIsSending(false);
      return true;
    } catch (error) {
      setIsSending(false);
      alert(lang === 'ru' ? `❌ Ошибка отправки СМС: ${error.message}` : `❌ СМС жіберу қатесі: ${error.message}`);
      return false;
    }
  };

  const handlePhoneSubmit = async (e) => { 
    e.preventDefault(); 
    if (isSending) return; 
    if (!tempPhone) return; 
    
    if (authMode === 'login_staff') {
      const staffMember = (roles || {})[tempPhone];
      if (!staffMember) return alert(lang === 'ru' ? "❌ Неверный логин сотрудника!" : "❌ Қызметкердің логині қате!");
      if (staffMember.password !== tempPassword) return alert(lang === 'ru' ? "❌ Неверный пароль!" : "❌ Құпия сөз қате!");
      if (!staffMember.onShift && staffMember.role !== 'admin' && staffMember.role !== 'developer') return alert(lang === 'ru' ? "❌ Сегодня не ваша смена!" : "❌ Бүгін сіздің ауысымыңыз емес!");
      
      const newToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
      const updatedRoles = { ...roles, [tempPhone]: { ...staffMember, sessionToken: newToken } };
      setRoles(updatedRoles);
      
      setCurrentUser({ role: staffMember.role, phone: tempPhone, name: staffMember.name, station: staffMember.station || null, isSenior: staffMember.isSenior || false, sessionToken: newToken });
      setShowAuthModal(false);
    } else {
      if (tempPhone.length !== 12) return alert(lang === 'ru' ? "❌ Введите полный номер: +7XXXXXXXXXX" : "❌ Толық нөмірді енгізіңіз: +7XXXXXXXXXX");
      if (authMode === 'login_guest' && !customers[tempPhone]) return alert(lang === 'ru' ? "❌ Номер не найден! Создайте карту лояльности." : "❌ Нөмір табылмады! Тіркеліңіз.");
      if (authMode === 'register_guest' && customers[tempPhone]) return alert(lang === 'ru' ? "❌ Этот номер уже есть в базе! Войдите как гость." : "❌ Бұл нөмір базада бар! Кіріңіз.");

      const success = await sendSmsCode();
      if (success) setAuthStep('sms');
    }
  };

  const handleResendCode = async () => {
    if (isSending) return;
    await sendSmsCode();
  };

  const handleSmsSubmit = async (e) => { 
    e.preventDefault(); 
    if (!tempCode) return;

    try {
      await window.confirmationResult.confirm(tempCode);
    } catch (error) {
      return alert(lang === 'ru' ? "❌ Неверный код подтверждения!" : "❌ Қате растау коды!");
    }

    const newToken = Date.now().toString(36) + Math.random().toString(36).substr(2);

    if (authMode === 'login_guest') { 
      const updatedCustomers = { ...customers, [tempPhone]: { ...customers[tempPhone], sessionToken: newToken } };
      setCustomers(updatedCustomers);
      setCurrentUser({ role: 'guest', phone: tempPhone, name: customers[tempPhone].name || 'Гость', station: null, sessionToken: newToken }); 
      setShowAuthModal(false); 
    } else { 
      setAuthStep('details'); 
    } 
  };

  const handleDetailsSubmit = (e) => { 
    e.preventDefault(); 
    if (!tempName.trim()) return alert(lang === 'ru' ? "Введите имя!" : "Атыңызды енгізіңіз!");

    const nameRegex = /^[А-Яа-яЁёӘәІіҢңҒғҮүҰұҚқӨөҺһ\s\-]+$/i;
    if (!nameRegex.test(tempName)) {
      return alert(lang === 'ru' ? "❌ Имя должно содержать только русские или казахские буквы! Без цифр и спецсимволов." : "❌ Есімде тек орыс немесе қазақ әріптері болуы керек! Сандар мен белгілерсіз.");
    }

    const nameExists = Object.values(customers || {}).some(c => c.name.toLowerCase() === tempName.toLowerCase().trim() && c.phone !== tempPhone);
    if (nameExists) {
      return alert(lang === 'ru' ? "❌ Это имя уже занято другим готем. Пожалуйста, добавьте фамилию или начальную букву (например, Аруым Б.)." : "❌ Бұл есім бос емес. Тегіңізді немесе бас әріпті қосыңыз.");
    }

    const newToken = Date.now().toString(36) + Math.random().toString(36).substr(2);
    setCustomers(prev => ({ ...(prev || {}), [tempPhone]: { phone: tempPhone, name: tempName.trim(), bonuses: 500, sessionToken: newToken } })); 
    setCurrentUser({ role: 'guest', phone: tempPhone, name: tempName.trim(), station: null, sessionToken: newToken }); 
    setShowAuthModal(false);
    alert(lang === 'ru' ? "🎉 Успешно! Вам начислено 500 приветственных бонусов!" : "🎉 Сәтті өтті! Сізге 500 бонус берілді!");
  };

  const logoutOrLogin = () => { 
    if (!isAuthenticated) { setAuthMode('login_guest'); setAuthStep('phone'); setTempPhone('+7'); setShowAuthModal(true); } 
    else { setCurrentUser({role: 'guest', phone: '', name: '', station: null, sessionToken: null}); }
  };

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
            
            <div id="recaptcha-container"></div>

            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563' }}>✕</button>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '22px', fontWeight: '900', color: '#111827' }}>
              {authMode === 'login_guest' ? (lang === 'ru' ? 'Вход' : 'Кіру') : authMode === 'register_guest' ? (lang === 'ru' ? 'Регистрация' : 'Тіркелу') : (lang === 'ru' ? 'Сотрудники' : 'Қызметкерлер')}
            </h2>
            
            {authStep === 'phone' && (
              <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{textAlign: 'left'}}><label style={{fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginLeft: '5px'}}>{lang === 'ru' ? 'Номер телефона' : 'Телефон нөмірі'}</label><input type="tel" placeholder={authMode === 'login_staff' ? "Логин" : "+7"} value={tempPhone} onChange={handlePhoneChange} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', fontSize: '18px', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box', fontWeight: 'bold', letterSpacing: '1px' }} /></div>
                {authMode === 'login_staff' && (<div style={{textAlign: 'left'}}><label style={{fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginLeft: '5px'}}>{lang === 'ru' ? 'Пароль' : 'Құпия сөз'}</label><input type="password" placeholder="***" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box' }} /></div>)}

                <button 
                  type="submit" 
                  disabled={isSending} 
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: '14px', 
                    border: 'none', 
                    backgroundColor: isSending ? '#9ca3af' : (authMode === 'login_staff' ? '#111827' : '#ea580c'), 
                    color: '#fff', 
                    fontWeight: '900', 
                    fontSize: '16px', 
                    cursor: isSending ? 'not-allowed' : 'pointer', 
                    marginTop: '5px',
                    transition: '0.2s'
                  }}
                >
                  {isSending ? '⏳ Отправка...' : (lang === 'ru' ? 'Далее' : 'Жалғастыру')}
                </button>
              </form>
            )}
            
            {authStep === 'sms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', textAlign: 'center' }}>
                <p style={{margin: 0, fontSize: '13px', color: '#6b7280', fontWeight: 'bold'}}>{lang === 'ru' ? 'Код отправлен на' : 'Код жіберілді'} {tempPhone}</p>
                
                <form onSubmit={handleSmsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                  <input type="number" placeholder="СМС" value={tempCode} onChange={(e) => setTempCode(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', textAlign: 'center', fontSize: '20px', fontWeight: 'bold', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box', letterSpacing: '3px' }} />
                  <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginTop: '5px' }}>{lang === 'ru' ? 'Подтвердить' : 'Растау'}</button>
                </form>

                <button 
                  onClick={handleResendCode} 
                  disabled={isSending}
                  style={{
                    marginTop: '15px',
                    background: 'none',
                    border: 'none',
                    color: isSending ? '#9ca3af' : '#ea580c',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: isSending ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  {isSending ? '⏳ Отправка...' : (lang === 'ru' ? 'Отправить код еще раз' : 'Кодты қайта жіберу')}
                </button>
              </div>
            )}
            
            {authStep === 'details' && (
              <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{textAlign: 'left'}}><label style={{fontSize: '12px', fontWeight: 'bold', color: '#6b7280', marginLeft: '5px'}}>{lang === 'ru' ? 'Как к вам обращаться?' : 'Сіздің атыңыз?'}</label><input type="text" placeholder={lang === 'ru' ? "Ваше Имя" : "Атыңыз"} value={tempName} onChange={(e) => setTempName(e.target.value)} required style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #e5e7eb', fontSize: '16px', color: '#111827', backgroundColor: '#f9fafb', boxSizing: 'border-box', fontWeight: 'bold' }} /></div>
                <button type="submit" style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', backgroundColor: '#ea580c', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}>{lang === 'ru' ? 'Создать аккаунт' : 'Аккаунт құру'}</button>
              </form>
            )}

            <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
              {authMode !== 'login_guest' && authStep === 'phone' && <button onClick={() => {setAuthMode('login_guest'); setTempPhone('+7');}} style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'ru' ? 'Уже есть аккаунт? Войти' : 'Аккаунтыңыз бар ма? Кіру'}</button>}
              {authMode !== 'register_guest' && authStep === 'phone' && <button onClick={() => {setAuthMode('register_guest'); setTempPhone('+7');}} style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: '15px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'ru' ? 'Создать карту лояльности' : 'Тіркелу'}</button>}
              {authMode !== 'login_staff' && authStep === 'phone' && <button onClick={() => {setAuthMode('login_staff'); setTempPhone('');}} style={{ padding: '12px', borderRadius: '12px', border: '2px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>💼 {lang === 'ru' ? 'Вход для персонала' : 'Қызметкерлер үшін'}</button>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function AppWrapper() {
  return <ErrorBoundary><MainApp /></ErrorBoundary>;
}
