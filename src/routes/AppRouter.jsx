import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { useAuth } from '../hooks/useAuth';

// 🔥 ОПТИМИЗАЦИЯ: Ленивая загрузка. 
// Эти файлы скачаются только тогда, когда пользователь перейдет на их страницу.
const GuestApp = lazy(() => import('../pages/Guest/GuestApp'));
const StaffApp = lazy(() => import('../pages/Staff/StaffApp'));
const Registration = lazy(() => import('../pages/Register/Registration'));
const Auth = lazy(() => import('../pages/Login/Auth'));

const AppRouter = () => {
  const { currentUser, isAuthenticated, lang, setLang, logout } = useAuth();
  
  const activeUser = isAuthenticated ? currentUser : { 
    role: 'guest', 
    phone: '', 
    name: lang === 'ru' ? 'Войти / Рег.' : 'Кіру / Тіркелу', 
    isAnonymous: true 
  };

  // Красивый индикатор загрузки, пока скачивается нужный экран
  const Loader = () => (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '15px' }}>
      <div style={{ width: '50px', height: '50px', border: '5px solid var(--secondary)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <h3 style={{ color: 'var(--text-muted)' }}>{lang === 'ru' ? 'Загрузка...' : 'Жүктелуде...'}</h3>
    </div>
  );

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path={ROUTES.HOME} element={<GuestApp currentUser={activeUser} lang={lang} setLang={setLang} logout={logout} />} />
        <Route path={ROUTES.GUEST} element={<GuestApp currentUser={activeUser} lang={lang} setLang={setLang} logout={logout} />} />
        <Route path={ROUTES.STAFF} element={<StaffApp currentUser={activeUser} lang={lang} setLang={setLang} logout={logout} />} />
        <Route path={ROUTES.REGISTER} element={<Registration />} />
        <Route path={ROUTES.LOGIN} element={<Auth />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;

