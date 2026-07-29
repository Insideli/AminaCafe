// StaffApp.js
import React, { useState, useEffect } from 'react';
import { INITIAL_MENU, CATEGORIES as DEFAULT_CATEGORIES, INITIAL_TABLES, INITIAL_ROLES, INITIAL_CUSTOMERS, INITIAL_SUPPORT, useLocalStorage } from './data.js';
import { submitOrderToPaloma, syncPalomaCatalog, testPalomaConnection } from './paloma.js';
import { createOrderId } from './utils/orderId.js';

export default function StaffApp({ currentUser, logout, lang, setLang }) {
  const [menu, setMenu] = useLocalStorage('amina_menu_v12', INITIAL_MENU);
  const [categories, setCategories] = useLocalStorage('amina_categories_v12', DEFAULT_CATEGORIES); 
  const [tables, setTables] = useLocalStorage('amina_tables_v12', INITIAL_TABLES);
  const [orders, setOrders] = useLocalStorage('amina_orders_v12', []);
  const [roles, setRoles] = useLocalStorage('amina_staff_profiles_v13', INITIAL_ROLES);
  const [reviews, setReviews] = useLocalStorage('amina_reviews_v12', []);
  const [analytics, setAnalytics] = useLocalStorage('amina_analytics_v12', { qr: 0, link: 0 });
  const [customers, setCustomers] = useLocalStorage('amina_customers_v12', INITIAL_CUSTOMERS);

  const [supportChat, setSupportChat] = useLocalStorage('amina_support_v12', INITIAL_SUPPORT);
  const [activeSupportPhone, setActiveSupportPhone] = useState(null);
  const [supportAdminText, setSupportAdminText] = useState('');

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [palomaStatus, setPalomaStatus] = useState({ state: 'idle', message: 'Связь ещё не проверялась' });

  const [adminTab, setAdminTab] = useState('stats'); 
  const [adminMenuCategory, setAdminMenuCategory] = useState('all');
  const [adminStaffRole, setAdminStaffRole] = useState('all');
  
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [editStaffOriginalPhone, setEditStaffOriginalPhone] = useState('');
  const [editStaffData, setEditStaffData] = useState({ phone: '', name: '', schedule: '', role: 'waiter', isSenior: false, onShift: true });

  const [newWaiter, setNewWaiter] = useState({ phone: '', name: '', schedule: '', role: 'waiter', isSenior: false });
  
  const [showPosModal, setShowPosModal] = useState(false); 
  const [posTableId, setPosTableId] = useState(null);
  const [posCart, setPosCart] = useState({});
  // 🔥 ДОБАВЛЕНЫ ПОИСК И КАТЕГОРИИ ДЛЯ КАССЫ ОФИЦИАНТА
  const [waiterPosSearch, setWaiterPosSearch] = useState('');
  const [waiterPosCategory, setWaiterPosCategory] = useState('all');
  
  const [selectedTableGroup, setSelectedTableGroup] = useState('all'); 
  const [reviewFilter, setReviewFilter] = useState('all');

  const [showWaiterMenu, setShowWaiterMenu] = useState(false);
  const [waiterMenuCategory, setWaiterMenuCategory] = useState('all');
  
  const [activeOrdersList, setActiveOrdersList] = useState(null); 
  
  const [cashierTab, setCashierTab] = useState('orders'); 
  const [cashierCart, setCashierCart] = useState({});
  const [cashierOrderType, setCashierOrderType] = useState('takeaway');
  // 🔥 ДОБАВЛЕНЫ ПОИСК И КАТЕГОРИИ ДЛЯ КАССИРА
  const [cashierPosSearch, setCashierPosSearch] = useState('');
  const [cashierPosCategory, setCashierPosCategory] = useState('all');

  const tableGroupsList = ['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'];
  const filteredTableGroups = selectedTableGroup === 'all' ? tableGroupsList.filter(g => g !== 'all') : [selectedTableGroup];

  useEffect(() => {
    if (currentUser && currentUser.phone) {
      const hasSeen = localStorage.getItem(`onboarding_seen_${currentUser.phone}`);
      if (!hasSeen) {
        setShowInfoModal(true);
        localStorage.setItem(`onboarding_seen_${currentUser.phone}`, 'true');
      }
    }
  }, [currentUser]);

  useEffect(() => {
    const isAnyModalOpen = editStaffModal || showPosModal || showWaiterMenu || showInfoModal || !!activeOrdersList;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [editStaffModal, showPosModal, showWaiterMenu, showInfoModal, activeOrdersList]);

  useEffect(() => {
    const sync = (e) => {
      try {
        if (!e.newValue) return; const parsed = JSON.parse(e.newValue);
        if (e.key === 'amina_orders_v12') setOrders(parsed || []); if (e.key === 'amina_tables_v12') setTables(parsed || []);
        if (e.key === 'amina_menu_v12') setMenu(parsed || []); if (e.key === 'amina_staff_profiles_v13') setRoles(parsed || {});
        if (e.key === 'amina_reviews_v12') setReviews(parsed || []); if (e.key === 'amina_analytics_v12') setAnalytics(parsed || { qr:0, link:0 });
        if (e.key === 'amina_customers_v12') setCustomers(parsed || {});
        if (e.key === 'amina_support_v12') setSupportChat(parsed || []);
        if (e.key === 'amina_categories_v12') setCategories(parsed || DEFAULT_CATEGORIES);
      } catch (err) {}
    };
    window.addEventListener('storage', sync); return () => window.removeEventListener('storage', sync);
  }, []);

  const changeOrderStatus = (id, status, payMethod = null) => setOrders(prev => (prev || []).map(o => o.id === id ? { ...o, status, payMethod: payMethod || o.payMethod } : o));

  const syncOrderWithPaloma = async (order, sourceLabel) => {
    try {
      const result = await submitOrderToPaloma(order);
      setOrders(prev => (prev || []).map(item => item.id === order.id ? {
        ...item,
        palomaSync: {
          status: 'synced',
          palomaOrderId: result?.paloma_order_id || null,
          receiptId: result?.receipt_id || null,
          syncedAt: new Date().toISOString(),
        },
      } : item));
      console.log(`✅ ${sourceLabel} отправлен в Paloma365`, result);
    } catch (error) {
      setOrders(prev => (prev || []).map(item => item.id === order.id ? {
        ...item,
        palomaSync: {
          status: 'failed',
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      } : item));
      console.error(`❌ ${sourceLabel} не отправлен в Paloma365:`, error);
      alert(`⚠️ Заказ сохранён в AminaCafe, но не попал в Paloma365. Причина: ${error.message}`);
    }
  };
  const getTableIcon = (type) => type === 'cabin' ? '🚪' : type === 'tapchan' ? '🛋️' : '🪑';

  const handleTestPaloma = async () => {
    setPalomaStatus({ state: 'loading', message: 'Проверяем соединение…' });
    try {
      const result = await testPalomaConnection();
      const pointsCount = Array.isArray(result?.points) ? result.points.length : 0;
      setPalomaStatus({ state: 'success', message: `Paloma365 доступна. Торговых точек: ${pointsCount}` });
    } catch (error) {
      setPalomaStatus({ state: 'error', message: error.message });
    }
  };

  const handleSyncPaloma = async () => {
    setPalomaStatus({ state: 'loading', message: 'Загружаем меню и стоп-лист…' });
    try {
      const result = await syncPalomaCatalog();

      if (result.menu.length === 0) {
        setPalomaStatus({ state: 'error', message: 'Активные блюда с ценой не найдены' });
        return alert('❌ Paloma365 ответила, но активных блюд с ценой не найдено. Проверьте выбранное меню во внешнем сервисе Tester.');
      }

      setCategories(result.categories);
      setMenu(result.menu);
      setPalomaStatus({ state: 'success', message: `${result.menu.length} блюд, стоп-лист: ${result.stopCount}` });
      alert(`✅ Синхронизация завершена: ${result.categories.length} категорий, ${result.menu.length} блюд, ${result.stopCount} позиций в стоп-листе.`);
    } catch (error) {
      console.error('Ошибка синхронизации с Paloma365:', error);
      setPalomaStatus({ state: 'error', message: error.message });
      alert(`❌ Не удалось синхронизировать Paloma365: ${error.message}`);
    }
  };

  const handleAddWaiter = () => { 
    if(!newWaiter.phone || !newWaiter.name) return; 
    setRoles(prev => ({ ...(prev || {}), [newWaiter.phone]: { role: newWaiter.role, name: newWaiter.name, schedule: newWaiter.schedule, onShift: true, isSenior: newWaiter.role === 'waiter' ? newWaiter.isSenior : false }})); 
    setNewWaiter({ phone: '', name: '', schedule: '', role: 'waiter', isSenior: false });
    alert('Профиль сотрудника добавлен. Для входа создайте или обновите его защищённый аккаунт через tools/staff-config.html и переменную STAFF_ACCOUNTS_JSON в Vercel.'); 
  };
  
  const openEditStaffModal = (phone, data) => {
    setEditStaffOriginalPhone(phone);
    setEditStaffData({ ...data, phone: phone });
    setEditStaffModal(true);
  };

  const handleSaveStaff = () => {
    if(!editStaffData.phone || !editStaffData.name) return;
    setRoles(prev => {
      const updated = { ...(prev || {}) };
      if (editStaffOriginalPhone !== editStaffData.phone) { delete updated[editStaffOriginalPhone]; }
      updated[editStaffData.phone] = { 
         role: editStaffData.role, name: editStaffData.name, schedule: editStaffData.schedule, 
         onShift: editStaffData.onShift,
         isSenior: editStaffData.role === 'waiter' ? editStaffData.isSenior : false,
         kaspi: updated[editStaffOriginalPhone]?.kaspi || null
      };
      return updated;
    });
    setEditStaffModal(false);
  };

  const toggleWaiterShift = (phone) => setRoles(prev => ({ ...(prev || {}), [phone]: { ...(prev || {})[phone], onShift: !(prev || {})[phone]?.onShift } }));

  const addToPosCart = (item) => setPosCart(prev => ({ ...(prev || {}), [item.id]: { ...item, quantity: ((prev || {})[item.id]?.quantity || 0) + 1 } }));
  const removeFromPosCart = (id) => { setPosCart(prev => { const updated = { ...(prev || {}) }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; }); };
  
  const submitPosOrder = () => {
    const cartArray = Object.values(posCart || {}); 
    if (cartArray.length === 0) return;
    const table = (tables || []).find(t => t.id === posTableId); 
    const subtotal = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const serviceFee = Math.round(subtotal * 0.15);
    const total = subtotal + serviceFee;
    const text = cartArray.map(i => `${i.name} (x${i.quantity})`).join(', ');
    const newOrder = { 
      id: createOrderId('ORD'), 
      phone: 'waiter-' + currentUser.phone,
      customerName: currentUser.name, 
      tableId: table?.id, 
      tableName: table?.name, 
      cartItems: cartArray.map(item => ({ ...item, isServed: false })), 
      itemsText: text, 
      subtotal: subtotal,
      serviceFee: serviceFee,
      total: total, 
      remaining: total, 
      tips: 0, 
      isPreOrder: false, 
      bookedTime: null, 
      orderType: 'in_hall', 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      status: 'new', 
      waiterPhone: currentUser.phone, 
      waiterName: currentUser.name, 
      payMethod: 'cash' 
    }; 
    setOrders(prev => [newOrder, ...(prev || [])]); 
    setTables(prev => (prev || []).map(t => t.id === table?.id ? { ...t, status: 'occupied', bookedBy: t.bookedBy, bookedTime: t.bookedTime, servedBy: currentUser.phone, isCalling: false, calledWaiter: null } : t));
    
    void syncOrderWithPaloma(newOrder, 'Заказ официанта');
    setShowPosModal(false); setPosCart({}); setWaiterPosSearch(''); setWaiterPosCategory('all');
  };

  const addToCashierCart = (item) => setCashierCart(prev => ({ ...prev, [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 } }));
  const removeFromCashierCart = (id) => { setCashierCart(prev => { const updated = { ...prev }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; }); };
  
  const submitCashierOrder = (payMethod) => {
    const cartArray = Object.values(cashierCart || {}); 
    if (cartArray.length === 0) return;
    const subtotal = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const serviceFee = Math.round(subtotal * 0.15);
    const total = subtotal + serviceFee;
    const text = cartArray.map(i => `${i.name} (x${i.quantity})`).join(', ');
    const newOrder = { 
      id: createOrderId('ORD'), 
      phone: 'cashier-' + currentUser.phone,
      customerName: currentUser.name, 
      tableId: 'cashier', 
      tableName: cashierOrderType === 'takeaway' ? 'Навынос (Касса)' : 'Доставка (Касса)', 
      cartItems: cartArray.map(item => ({ ...item, isServed: false })), 
      itemsText: text, 
      subtotal: subtotal,
      serviceFee: serviceFee,
      total: total, 
      remaining: total, 
      tips: 0, 
      isPreOrder: false, 
      bookedTime: null, 
      orderType: cashierOrderType, 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      status: 'new', 
      waiterPhone: currentUser.phone, 
      waiterName: currentUser.name, 
      payMethod: payMethod 
    };
    setOrders(prev => [newOrder, ...(prev || [])]); 
    
    void syncOrderWithPaloma(newOrder, 'Заказ кассира');
    setCashierCart({}); setCashierPosSearch(''); setCashierPosCategory('all');
  };

  const applySeniorDiscount = () => {
    const cartArray = Object.values(posCart || {});
    const currentTotal = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    if (currentTotal <= 0) return;
    const discountAmount = Math.round(currentTotal * 0.1);
    setPosCart(prev => ({ ...prev, 'discount_10': { id: 'discount_10', name: 'Скидка Старшего (-10%)', price: -discountAmount, quantity: 1, isStop: false, imgUrl: '' } }));
  };

  const validOrders = (orders || []).filter(o => o.status !== 'rejected' && o.status !== 'declined' && o.status !== 'transfer_pending' && o.status !== 'waiter_pending');
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const kaspiRevenue = validOrders.filter(o => o.payMethod === 'kaspi').reduce((sum, o) => sum + o.total, 0);
  const cashRevenue = validOrders.filter(o => o.payMethod === 'cash').reduce((sum, o) => sum + o.total, 0);

  const HeaderControls = () => (
    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
      <button onClick={() => setShowInfoModal(true)} style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '6px 8px', borderRadius: '8px', color: '#b45309', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        ℹ️
      </button>
      <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '6px 8px', borderRadius: '8px', color: '#111827', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
        {lang === 'ru' ? 'KZ' : 'RU'}
      </button>
      <button onClick={logout} style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: 'bold' }}>{lang === 'ru' ? 'Выход' : 'Шығу'}</button>
    </div>
  );

  const renderInfoModal = () => {
    if (!showInfoModal) return null;
    let roleTitle = 'Сотрудник';
    let instructions = (
      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
         <div style={{background: '#f9fafb', padding: '12px', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
            <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>🛎 Добро пожаловать!</p>
            <p style={{margin: 0, fontSize: '13px', color: '#4b5563'}}>Выберите нужный раздел для начала работы.</p>
         </div>
      </div>
    );

    return (
      <div style={{ position: 'fixed', inset: 0, height: '100%', background: 'rgba(17,24,39,0.7)', zIndex: 9999, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setShowInfoModal(false)}>
        <div style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '28px 28px 0 0', padding: '30px 25px', boxSizing: 'border-box', maxHeight: '90vh', display: 'flex', flexDirection: 'column', textAlign: 'left', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
            <h2 style={{margin: '0', fontSize: '20px', color: '#111827'}}>ℹ️ Обучение</h2>
            <button onClick={() => setShowInfoModal(false)} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
          </div>
          <h3 style={{margin: '0 0 10px 0', color: '#111827', fontSize: '18px'}}>📖 Инструкция ({roleTitle}):</h3>
          {instructions}
          <button onClick={() => setShowInfoModal(false)} style={{width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '15px'}}>Приступить к работе</button>
        </div>
      </div>
    );
  };

  const PendingTransfersBlock = () => {
    const pendingTransfers = (orders || []).filter(o => o.status === 'transfer_pending');
    if (pendingTransfers.length === 0) return null;
    return (
       <div style={{ backgroundColor: '#fff', border: '4px solid #f59e0b', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)' }}>
          <h2 style={{color: '#d97706', margin: '0 0 15px 0', fontSize: '18px'}}>💳 Ожидают подтверждения!</h2>
          {pendingTransfers.map(o => {
             const guestInfo = customers[o.phone] || { name: 'Гость' };
             return (
             <div key={o.id} style={{ background: '#fef3c7', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                <p style={{margin: '0 0 5px 0', fontSize: '15px', color: '#111827'}}>Заказ/Бронь: <b>{o.tableName}</b></p>
                <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#4b5563'}}>Гость: <b>{guestInfo.name} ({o.phone})</b></p>
                {o.waiterName && <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#4b5563'}}>Официант: <b>{o.waiterName}</b></p>}
                <p style={{margin: '0 0 10px 0', fontSize: '15px', color: '#111827'}}>К оплате: <b style={{fontSize: '18px', color: '#b45309'}}>{o.total} ₸</b></p>
                <div style={{display: 'flex', gap: '10px'}}>
                   <button onClick={() => {
                       changeOrderStatus(o.id, 'new', 'kaspi');
                       if (o.orderType === 'booking_deposit') {
                           setTables(prev => (prev || []).map(t => t.id === o.tableId ? { ...t, bookedBy: o.phone, bookedTime: o.bookedTime, status: 'free' } : t));
                       } else {
                           void syncOrderWithPaloma({ ...o, customerName: guestInfo.name, payMethod: 'kaspi' }, 'Подтверждённый заказ гостя');
                       }
                   }} style={{flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>✅ Подтвердить</button>
                   <button onClick={() => changeOrderStatus(o.id, 'rejected')} style={{flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>❌ Деньги не поступили</button>
                </div>
             </div>
          )})}
       </div>
    );
  };

  const renderWaiterPosModal = () => {
    if (!showPosModal) return null; 
    const table = (tables || []).find(t => t.id === posTableId); 
    const posTotal = Object.values(posCart || {}).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    
    // 🔥 ФИЛЬТР МЕНЮ ДЛЯ КАССЫ ОФИЦИАНТА (ПОИСК И КАТЕГОРИИ)
    const filteredPosMenu = (menu || []).filter(item => {
      const matchSearch = item.name.toLowerCase().includes(waiterPosSearch.toLowerCase());
      const matchCat = waiterPosCategory === 'all' || item.category === waiterPosCategory;
      return matchSearch && matchCat;
    });

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' }} onClick={() => { setShowPosModal(false); setWaiterPosSearch(''); setWaiterPosCategory('all'); }}>
         <div style={{ backgroundColor: '#f3f4f6', borderRadius: '24px', width: '100%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }} onClick={e => e.stopPropagation()}>
           <div style={{ padding: '20px', backgroundColor: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{margin: 0, fontSize: '18px'}}>📱 Касса: {table?.name}</h2><button onClick={() => { setShowPosModal(false); setWaiterPosSearch(''); setWaiterPosCategory('all'); }} style={{background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer'}}>✖</button>
           </div>
           
           {/* БЛОК ПОИСКА И КАТЕГОРИЙ */}
           <div style={{ padding: '15px 15px 0 15px', background: '#fff', borderBottom: '1px solid #e5e7eb' }}>
             <input type="text" placeholder="🔍 Поиск блюда (например: Пепперони)..." value={waiterPosSearch} onChange={e => setWaiterPosSearch(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', marginBottom: '10px', fontSize: '16px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827'}} />
             <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px' }}>
                <button onClick={() => setWaiterPosCategory('all')} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: waiterPosCategory === 'all' ? '#111827' : '#f3f4f6', color: waiterPosCategory === 'all' ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>🍽️ Все</button>
                {(categories || []).map(cat => (
                   <button key={cat.id} onClick={() => setWaiterPosCategory(cat.id)} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: waiterPosCategory === cat.id ? '#111827' : '#f3f4f6', color: waiterPosCategory === cat.id ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat.icon} {cat.name}</button>
                ))}
             </div>
           </div>

           <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {currentUser.isSenior && <button onClick={applySeniorDiscount} style={{width: '100%', padding: '10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer'}}>🎁 Применить скидку -10%</button>}
              {filteredPosMenu.map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isStop ? 0.5 : 1 }}>
                   <div style={{ flex: 1, paddingRight: '10px' }}>
                     <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                        {item.imgUrl ? <img src={item.imgUrl} alt={item.name} style={{width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover'}}/> : <span style={{fontSize: '24px'}}>{categories.find(c => c.id === item.category)?.icon || '🍲'}</span>}
                        <div>
                          <p style={{margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#111827'}}>{item.name}</p>
                          <p style={{margin: '2px 0 0 0', fontSize: '11px', color: '#6b7280'}}>Категория: {categories.find(c => c.id === item.category)?.name || 'Неизвестно'}</p>
                        </div>
                     </div>
                     <p style={{margin: '8px 0 0 0', color: '#ea580c', fontSize: '14px', fontWeight: 'bold'}}>{item.price} ₸</p>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}><button onClick={() => removeFromPosCart(item.id)} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#f9fafb', color: '#111827', fontWeight: 'bold', fontSize: '16px' }}>-</button><span style={{fontWeight: '900', fontSize: '16px', color: '#111827'}}>{(posCart || {})[item.id]?.quantity || 0}</span><button disabled={item.isStop} onClick={() => addToPosCart(item)} style={{ padding: '8px 15px', borderRadius: '10px', background: item.isStop ? '#9ca3af' : '#111827', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>+</button></div>
                </div>
              ))}
              {filteredPosMenu.length === 0 && <p style={{textAlign: 'center', color: '#6b7280', marginTop: '20px'}}>Блюда не найдены</p>}
           </div>
           <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', zIndex: 10 }}>
               <p style={{ margin: '0 0 15px 0', fontWeight: '900', fontSize: '20px', display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Итого чек:</span> <span>{posTotal} ₸</span></p>
               <button onClick={submitPosOrder} style={{ width: '100%', padding: '18px', borderRadius: '14px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }}>Отправить на кухню</button>
           </div>
         </div>
      </div>
    );
  };

  const renderWaiterMenuModal = () => {
    if (!showWaiterMenu) return null;
    const displayedMenu = waiterMenuCategory === 'all' ? (menu || []) : (menu || []).filter(m => m.category === waiterMenuCategory);
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#f4f5f7', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', backgroundColor: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{margin: 0, fontSize: '18px'}}>📖 Меню заведения</h2><button onClick={() => setShowWaiterMenu(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer'}}>✖</button>
        </div>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '15px', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setWaiterMenuCategory('all')} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: waiterMenuCategory === 'all' ? '#111827' : '#f3f4f6', color: waiterMenuCategory === 'all' ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>🍽️ Все</button>
          {(categories || []).map(cat => (<button key={cat.id} onClick={() => setWaiterMenuCategory(cat.id)} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: waiterMenuCategory === cat.id ? '#111827' : '#f3f4f6', color: waiterMenuCategory === cat.id ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat.icon} {cat.name}</button>))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
          {displayedMenu.map(item => (
            <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isStop ? 0.6 : 1 }}>
              <div style={{flex: 1}}>
                <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
                   {item.imgUrl ? <img src={item.imgUrl} style={{width:'40px', height:'40px', borderRadius:'10px', objectFit:'cover'}} alt="" /> : <span style={{fontSize:'24px'}}>{categories.find(c => c.id === item.category)?.icon || '🍲'}</span>}
                   <div>
                     <p style={{margin: 0, fontWeight: 'bold', color: '#111827'}}>{item.name}</p>
                     <p style={{margin: '2px 0 0 0', fontSize: '14px', color: '#ea580c', fontWeight: 'bold'}}>{item.price} ₸</p>
                   </div>
                </div>
                <p style={{margin: '8px 0 0 0', fontSize: '12px', color: '#6b7280'}}>{item.ingredients}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderWaiterNotebookModal = () => {
    if (!activeOrdersList) return null;
    const { tableId, orders: tableOrders } = activeOrdersList;
    const table = (tables || []).find(t => t.id === tableId);
    
    const activeOrders = tableOrders.filter(o => o.status !== 'delivered' && o.status !== 'rejected');

    const toggleItemServed = (orderId, itemId) => {
      setOrders(prev => (prev || []).map(o => {
        if (o.id === orderId) {
          const updatedItems = (o.cartItems || []).map(item => {
            if (item.id === itemId) {
              return { ...item, isServed: !item.isServed };
            }
            return item;
          });
          const allServed = updatedItems.every(item => item.isServed === true);
          if (allServed && updatedItems.length > 0) {
            return { ...o, cartItems: updatedItems, status: 'delivered' };
          }
          return { ...o, cartItems: updatedItems };
        }
        return o;
      }));
    };

    const closeBillAndPrint = () => {
      if (!table) return;

      let allItems = [];
      let subtotal = 0;
      activeOrders.forEach(order => {
        (order.cartItems || []).forEach(item => {
          subtotal += (item.price * item.quantity);
          allItems.push({ ...item }); 
        });
      });

      if (allItems.length === 0) {
        alert('Нет блюд для закрытия счёта');
        return;
      }

      const serviceFee = Math.round(subtotal * 0.15);
      const grandTotal = subtotal + serviceFee;

      // Заказы уже отправлены в Paloma365 при создании/подтверждении.
      // Повторная отправка при закрытии стола создавала бы дубликат.

      setOrders(prev => (prev || []).map(o => {
        if (o.tableId === tableId && o.status !== 'delivered' && o.status !== 'rejected') {
          return { ...o, status: 'delivered' };
        }
        return o;
      }));

      setTables(prev => (prev || []).map(t => t.id === tableId ? { ...t, status: 'free', servedBy: null, isCalling: false, calledWaiter: null, isCallingForBill: false } : t));
      setActiveOrdersList(null);
    };

    let subtotal = 0;
    activeOrders.forEach(order => {
      (order.cartItems || []).forEach(item => {
        subtotal += (item.price * item.quantity);
      });
    });
    const serviceFee = Math.round(subtotal * 0.15);
    const grandTotal = subtotal + serviceFee;

    const totalUnserved = tableOrders.reduce((sum, o) => {
      if (o.status === 'delivered' || o.status === 'rejected') return sum;
      return sum + (o.cartItems || []).filter(item => !item.isServed).length;
    }, 0);

    const canCloseBill = currentUser.isSenior || table?.servedBy === currentUser.phone;

    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
        <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '500px', position: 'relative', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setActiveOrdersList(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563' }}>✕</button>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', paddingRight: '40px' }}>
            <h3 style={{ margin: '0', color: '#111827', fontSize: '18px' }}>📋 Блокнот: {table?.name || 'Стол'}</h3>
            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>Осталось: {totalUnserved} блюд</span>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {activeOrders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px 0' }}>Все заказы выполнены ✅</p>
            ) : (
              activeOrders.map(order => {
                const unservedItems = (order.cartItems || []).filter(item => !item.isServed);
                if (unservedItems.length === 0) return null;
                
                return (
                  <div key={order.id} style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '12px', borderLeft: '4px solid #3b82f6' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827' }}>{order.date}</span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>Заказ #{order.id.slice(-4)}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {unservedItems.map((item, idx) => {
                        return (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0', cursor: 'pointer' }} onClick={() => toggleItemServed(order.id, item.id)}>
                            <span style={{ fontSize: '20px', color: item.isServed ? '#10b981' : '#6b7280' }}>
                              {item.isServed ? '✅' : '□'}
                            </span>
                            <span style={{ fontSize: '14px', color: '#111827', flex: 1 }}>{item.img} {item.name}</span>
                            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 'bold' }}>x{item.quantity}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ marginTop: '15px', borderTop: '2px solid #f3f4f6', paddingTop: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4b5563' }}>
              <span>Блюда:</span>
              <span>{subtotal} ₸</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4b5563' }}>
              <span>Обслуживание (15%):</span>
              <span>{serviceFee} ₸</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: '900', color: '#111827', marginTop: '8px' }}>
              <span>💳 ИТОГО:</span>
              <span>{grandTotal} ₸</span>
            </div>

            {canCloseBill && grandTotal > 0 && (
              <button 
                onClick={closeBillAndPrint}
                style={{ 
                  width: '100%', 
                  padding: '14px', 
                  marginTop: '15px', 
                  background: '#10b981', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: 'bold', 
                  fontSize: '16px', 
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(16,185,129,0.3)'
                }}
              >
                🧾 Закрыть счёт и распечатать
              </button>
            )}
            {!canCloseBill && grandTotal > 0 && (
              <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '13px', marginTop: '10px' }}>
                ⚠️ Только Старший официант может закрыть этот счёт
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSupportPanel = () => {
    const chatUsersMap = new Map();
    (supportChat || []).forEach(msg => { chatUsersMap.set(msg.phone, { phone: msg.phone, name: msg.name, lastTime: msg.time }); });
    const chatUsersList = Array.from(chatUsersMap.values()).reverse(); 

    return (
      <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
        {activeSupportPhone ? (
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #d1d5db', display: 'flex', flexDirection: 'column', height: '75vh' }}>
            <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '15px', background: '#f9fafb', borderRadius: '20px 20px 0 0' }}>
               <button onClick={() => setActiveSupportPhone(null)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', background: '#e5e7eb', cursor: 'pointer', fontWeight: 'bold' }}>← Назад</button>
               <div>
                 <h3 style={{margin: 0, color: '#111827'}}>{chatUsersMap.get(activeSupportPhone)?.name}</h3>
                 <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280'}}>{activeSupportPhone}</p>
               </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
               {(supportChat || []).filter(m => m.phone === activeSupportPhone).map(m => (
                  <div key={m.id} style={{alignSelf: m.sender === 'support' ? 'flex-end' : 'flex-start', background: m.sender === 'support' ? '#3b82f6' : '#f3f4f6', color: m.sender === 'support' ? '#fff' : '#111827', padding: '12px', borderRadius: '14px', maxWidth: '85%'}}>
                     <p style={{margin: 0, fontSize: '14px'}}>{m.text}</p>
                     <p style={{margin: '5px 0 0 0', fontSize: '10px', opacity: 0.7, textAlign: 'right'}}>{m.time}</p>
                  </div>
               ))}
            </div>

            <div style={{ padding: '15px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px' }}>
              <input type="text" value={supportAdminText} onChange={e=>setSupportAdminText(e.target.value)} placeholder="Написать гостю..." style={{flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', boxSizing: 'border-box'}} />
              <button onClick={() => {
                 if(!supportAdminText.trim()) return;
                 setSupportChat(prev => [...(prev||[]), {id: Date.now(), phone: activeSupportPhone, name: chatUsersMap.get(activeSupportPhone)?.name, sender: 'support', text: supportAdminText, time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}]);
                 setSupportAdminText('');
              }} style={{background: '#3b82f6', color: '#fff', border: 'none', padding: '0 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'}}>➤</button>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: '#fff', borderRadius: '20px', border: '1px solid #d1d5db', overflow: 'hidden' }}>
            <h3 style={{ margin: 0, padding: '15px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', color: '#111827' }}>Входящие обращения</h3>
            {chatUsersList.length === 0 ? <p style={{padding: '20px', color: '#6b7280', textAlign: 'center'}}>Тикетов пока нет.</p> : 
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {chatUsersList.map(u => (
                  <div key={u.phone} onClick={() => setActiveSupportPhone(u.phone)} style={{ padding: '15px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                    <div>
                      <p style={{margin: 0, fontWeight: 'bold', color: '#111827', fontSize: '16px'}}>{u.name}</p>
                      <p style={{margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280'}}>{u.phone}</p>
                    </div>
                    <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>Открыть ➔</span>
                  </div>
                ))}
              </div>
            }
          </div>
        )}
      </div>
    );
  };

  if (currentUser.role === 'developer') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', fontFamily: 'Arial', paddingBottom: '80px' }}>
        {renderInfoModal()}
        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>👨‍💻 Техподдержка</h2>
          <HeaderControls />
        </header>
        {renderSupportPanel()}
      </div>
    );
  }

  if (currentUser.role === 'cashier') {
    const cashPendingTables = (tables || []).filter(t => t.isCallingForBill);
    const posTotal = Object.values(cashierCart || {}).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);

    const waitersCashMap = {};
    validOrders.filter(o => o.payMethod === 'cash').forEach(o => {
        if (o.waiterPhone) {
            if (!waitersCashMap[o.waiterPhone]) {
                waitersCashMap[o.waiterPhone] = { name: o.waiterName || 'Официант', total: 0 };
            }
            waitersCashMap[o.waiterPhone].total += o.total;
        }
    });

    // 🔥 ФИЛЬТР МЕНЮ ДЛЯ ТЕРМИНАЛА КАССИРА (ПОИСК И КАТЕГОРИИ)
    const filteredCashierPosMenu = (menu || []).filter(item => {
      const matchSearch = item.name.toLowerCase().includes(cashierPosSearch.toLowerCase());
      const matchCat = cashierPosCategory === 'all' || item.category === cashierPosCategory;
      return matchSearch && matchCat;
    });

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial', paddingBottom: '80px' }}>
        {renderInfoModal()}
        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>👩‍💻 Касса: {currentUser.name}</h2>
          <HeaderControls />
        </header>
        
        <div style={{ display: 'flex', gap: '10px', padding: '20px', justifyContent: 'flex-start', overflowX: 'auto', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setCashierTab('orders')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'orders' ? '#10b981' : '#f3f4f6', color: cashierTab === 'orders' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🔔 Оплаты</button>
          <button onClick={() => setCashierTab('tables')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'tables' ? '#ec4899' : '#f3f4f6', color: cashierTab === 'tables' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🪑 Залы</button>
          <button onClick={() => setCashierTab('pos')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'pos' ? '#3b82f6' : '#f3f4f6', color: cashierTab === 'pos' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🛒 Терминал</button>
          <button onClick={() => setCashierTab('report')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'report' ? '#8b5cf6' : '#f3f4f6', color: cashierTab === 'report' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📊 X-Отчет</button>
        </div>

        {cashierTab === 'orders' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <PendingTransfersBlock />
            {cashPendingTables.map(table => {
               const orderForTable = (orders || []).find(o => o.tableId === table.id && (o.status === 'cash_pending' || o.status === 'new'));
               const guestPhone = table.bookedBy || orderForTable?.phone;
               const guestInfo = customers[guestPhone] || { name: 'Гость' };
               const waiterName = table.servedBy ? roles[table.servedBy]?.name : (orderForTable?.waiterName || 'Неизвестно');
               return (
                 <div key={`c-bill-${table.id}`} style={{ backgroundColor: '#fee2e2', border: '2px solid #dc2626', padding: '20px', borderRadius: '16px', marginBottom: '15px' }}>
                    <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>🏃 Просят счет (Наличные / Kaspi)</h3>
                    <p style={{margin: '0 0 5px 0', fontSize: '15px', color: '#111827'}}>Стол: <b>{table.name}</b></p>
                    <p style={{margin: '0 0 5px 0', fontSize: '14px', color: '#4b5563'}}>Гость: <b>{guestInfo.name} {guestPhone ? `(${guestPhone})` : ''}</b></p>
                    <p style={{margin: '0 0 10px 0', fontSize: '14px', color: '#4b5563'}}>Официант: <b>{waiterName}</b></p>
                    <p style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#111827', fontWeight: 'bold' }}>К оплате: {orderForTable?.total || '?'} ₸</p>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <button onClick={() => { 
                         setTables(prev => (prev || []).map(t => t.id === table.id ? { ...t, isCallingForBill: false, status: 'free', bookedBy: null, servedBy: null, isCalling: false, calledWaiter: null } : t)); 
                         if(orderForTable) { 
                           changeOrderStatus(orderForTable.id, 'delivered', 'kaspi');
                         } 
                      }} style={{ flex: 1, minWidth: 0, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Оплата Kaspi</button>
                      <button onClick={() => { 
                         setTables(prev => (prev || []).map(t => t.id === table.id ? { ...t, isCallingForBill: false, status: 'free', bookedBy: null, servedBy: null, isCalling: false, calledWaiter: null } : t)); 
                         if(orderForTable) { 
                           changeOrderStatus(orderForTable.id, 'delivered', 'cash');
                         }
                      }} style={{ flex: 1, minWidth: 0, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Наличными</button>
                    </div>
                 </div>
               )
            })}
          </div>
        )}

        {cashierTab === 'tables' && (
          <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{color: '#111827', margin: '0 0 15px 0'}}>🗺 Контроль залов (Касса)</h2>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px solid #d1d5db' }}>
              {tableGroupsList.map(group => (<button key={group} onClick={() => setSelectedTableGroup(group)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #d1d5db', background: selectedTableGroup === group ? '#111827' : '#fff', color: selectedTableGroup === group ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{group === 'all' ? 'Все залы' : group}</button>))}
            </div>
            {filteredTableGroups.map(groupName => {
              const groupTables = (tables || []).filter(t => t.group === groupName);
              if(groupTables.length === 0) return null;
              return (
                <div key={groupName} style={{ marginTop: '20px' }}>
                  <h3 style={{ paddingBottom: '5px', borderBottom: '2px solid #d1d5db', marginBottom: '10px', color: '#111827' }}>{groupName}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {groupTables.map(t => {
                       const bookingCust = t.bookedBy ? customers[t.bookedBy] : null;
                       return (
                         <div key={t.id} style={{ padding: '15px', borderRadius: '12px', backgroundColor: '#fff', border: t.status === 'free' ? '1px solid #e5e7eb' : '2px solid #111827' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                               <p style={{ margin: 0, fontWeight: '900', fontSize: '15px', color: '#111827' }}>{t.name}</p>
                               <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', background: t.status === 'free' ? '#f3f4f6' : '#fef3c7', color: t.status === 'free' ? '#6b7280' : '#b45309' }}>{t.status === 'free' ? 'Свободен' : 'Занят'}</span>
                            </div>
                            {t.servedBy && <p style={{fontSize: '13px', color: '#4b5563', margin: '8px 0 0 0'}}>🏃‍♂️ Официант: <b>{roles[t.servedBy]?.name || 'Неизвестно'}</b></p>}
                            {t.bookedBy && (
                               <div style={{marginTop: '10px', padding: '10px', background: '#ecfdf5', borderRadius: '8px', border: '1px dashed #10b981'}}>
                                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#065f46', fontWeight: 'bold'}}>📅 Бронь: {t.bookedTime || 'Сейчас'}</p>
                                 <p style={{margin: 0, fontSize: '12px', color: '#111827'}}>{bookingCust?.name || 'Гость'}<br/>{t.bookedBy}</p>
                               </div>
                            )}
                            {t.status !== 'free' && (
                               <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, status: 'free', bookedBy: null, servedBy: null, isCalling: false, calledWaiter: null, isCallingForBill: false } : tab))} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#f3f4f6', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Освободить стол</button>
                            )}
                         </div>
                       )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {cashierTab === 'pos' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ padding: '15px', background: '#fff', display: 'flex', gap: '10px' }}>
               <button onClick={() => setCashierOrderType('takeaway')} style={{flex:1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: cashierOrderType === 'takeaway' ? '#111827' : '#fff', color: cashierOrderType === 'takeaway' ? '#fff' : '#111827', fontWeight: 'bold', cursor: 'pointer'}}>🛍 Навынос</button>
               <button onClick={() => setCashierOrderType('delivery')} style={{flex:1, minWidth: 0, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: cashierOrderType === 'delivery' ? '#111827' : '#fff', color: cashierOrderType === 'delivery' ? '#fff' : '#111827', fontWeight: 'bold', cursor: 'pointer'}}>🛵 Доставка</button>
            </div>
            
            <div style={{ padding: '0 15px' }}>
               <input type="text" placeholder="🔍 Поиск блюда (например: Бургер)..." value={cashierPosSearch} onChange={e => setCashierPosSearch(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1d5db', marginBottom: '10px', fontSize: '16px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827'}} />
               <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', borderBottom: '1px solid #e5e7eb' }}>
                  <button onClick={() => setCashierPosCategory('all')} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: cashierPosCategory === 'all' ? '#111827' : '#f3f4f6', color: cashierPosCategory === 'all' ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>🍽️ Все</button>
                  {(categories || []).map(cat => (
                     <button key={cat.id} onClick={() => setCashierPosCategory(cat.id)} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: cashierPosCategory === cat.id ? '#111827' : '#f3f4f6', color: cashierPosCategory === cat.id ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat.icon} {cat.name}</button>
                  ))}
               </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {filteredCashierPosMenu.map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isStop ? 0.5 : 1 }}>
                   <div style={{ flex: 1 }}>
                      <p style={{margin: 0, fontWeight: 'bold', color: '#111827'}}>{item.name}</p>
                      <p style={{margin: '2px 0 0 0', color: '#6b7280', fontSize: '13px'}}>{item.price} ₸</p>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><button onClick={() => removeFromCashierCart(item.id)} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', fontWeight: 'bold', fontSize: '16px' }}>-</button><span style={{fontWeight: '900', color: '#111827', fontSize: '16px'}}>{(cashierCart || {})[item.id]?.quantity || 0}</span><button disabled={item.isStop} onClick={() => addToCashierCart(item)} style={{ padding: '6px 12px', borderRadius: '8px', background: item.isStop ? '#9ca3af' : '#111827', color: '#fff', fontWeight: 'bold', fontSize: '16px' }}>+</button></div>
                </div>
              ))}
              {filteredCashierPosMenu.length === 0 && <p style={{textAlign: 'center', color: '#6b7280', marginTop: '20px'}}>Блюда не найдены</p>}
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '2px solid #e5e7eb' }}>
               <p style={{ margin: '0 0 15px 0', fontWeight: '900', fontSize: '22px', display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Итого:</span> <span>{posTotal} ₸</span></p>
               <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={() => submitCashierOrder('kaspi')} style={{ flex: 1, minWidth: 0, padding: '16px', borderRadius: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Оплата Kaspi</button>
                  <button onClick={() => submitCashierOrder('cash')} style={{ flex: 1, minWidth: 0, padding: '16px', borderRadius: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Наличными</button>
               </div>
            </div>
          </div>
        )}

        {cashierTab === 'report' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{color: '#111827', margin: '0 0 15px 0'}}>📊 Финансовый отчет (Смена)</h2>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
               <p style={{margin: '0 0 10px 0', color: '#6b7280', fontWeight: 'bold'}}>Общая выручка за сегодня</p>
               <h1 style={{ color: '#10b981', fontSize: '40px', margin: '0 0 20px 0' }}>{totalRevenue} ₸</h1>
               <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '15px'}}>
                  <div><p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>Kaspi (Переводы)</p><p style={{margin: '5px 0 0 0', color: '#111827', fontWeight: 'bold', fontSize: '18px'}}>{kaspiRevenue} ₸</p></div>
                  <div style={{textAlign: 'right'}}><p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>Наличные (В ящике)</p><p style={{margin: '5px 0 0 0', color: '#111827', fontWeight: 'bold', fontSize: '18px'}}>{cashRevenue} ₸</p></div>
               </div>
            </div>
            {Object.keys(waitersCashMap).length > 0 && (
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#111827' }}>💵 Наличные у официантов:</h3>
                    {Object.entries(waitersCashMap).map(([phone, data]) => (
                        <div key={phone} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f3f4f6', paddingBottom: '10px', marginBottom: '10px' }}>
                            <span style={{ color: '#4b5563', fontWeight: 'bold' }}>{data.name}</span>
                            <span style={{ color: '#10b981', fontWeight: '900' }}>{data.total} ₸</span>
                        </div>
                    ))}
                </div>
            )}
            <h3 style={{color: '#111827', margin: '0 0 15px 0'}}>🧾 Лента чеков:</h3>
            {validOrders.length === 0 ? <p style={{color: '#6b7280'}}>Чеков пока нет.</p> : 
              validOrders.map(o => (
                <div key={o.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '15px', marginBottom: '15px' }}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                     <span style={{fontWeight: '900', color: '#111827'}}>{o.tableName}</span>
                     <span style={{fontWeight: '900', color: '#10b981', fontSize: '16px'}}>{o.total} ₸</span>
                   </div>
                   <p style={{margin: '0 0 10px 0', fontSize: '12px', color: '#3b82f6', fontWeight: 'bold'}}>{o.payMethod === 'kaspi' ? 'Kaspi Перевод' : o.payMethod === 'cash' ? 'Наличные' : 'Оплачено'}</p>
                   <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>{o.itemsText}</p>
                   <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px'}}>
                      <span>Обслужил(а): {o.waiterName || 'Сайт'}</span>
                      <span>{o.date}</span>
                   </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    );
  }

  if (currentUser.role === 'waiter') {
    const myTableIds = (tables || []).filter(t => t.servedBy === currentUser.phone).map(t => t.id);
    const myActiveOrders = (orders || []).filter(o => 
       myTableIds.includes(o.tableId) && 
       (o.status === 'new' || o.status === 'cash_pending')
    );

    const cashPending = myActiveOrders.filter(o => o.status === 'cash_pending');
    const tableGroupsList = ['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'];
    const filteredTableGroups = selectedTableGroup === 'all' ? tableGroupsList.filter(g => g !== 'all') : [selectedTableGroup];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', fontFamily: 'Arial', paddingBottom: '50px' }}>
        {showPosModal && renderWaiterPosModal()}
        {renderWaiterMenuModal()}
        {renderInfoModal()}
        {renderWaiterNotebookModal()} 

        <header style={{ backgroundColor: '#10b981', padding: '20px', color: '#fff', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{margin: 0}}>{currentUser.isSenior ? '👑' : '🏃‍♂️'} {currentUser.name}</h2>
            <HeaderControls />
          </div>
          <button onClick={() => setShowWaiterMenu(true)} style={{ width: '100%', padding: '12px', borderRadius: '10px', background: '#fff', color: '#10b981', fontWeight: '900', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>📖 Посмотреть Меню</button>
        </header>

        <div style={{ padding: '20px' }}>
          <div style={{ backgroundColor: '#fff', border: '4px solid #10b981', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)', display: (orders || []).filter(o => o.status === 'waiter_pending' && o.waiterPhone === currentUser.phone).length === 0 ? 'none' : 'block' }}>
            <h2 style={{color: '#065f46', margin: '0 0 15px 0', fontSize: '18px'}}>🏃‍♂️ Вас вызвали для оплаты!</h2>
            {(orders || []).filter(o => o.status === 'waiter_pending' && o.waiterPhone === currentUser.phone).map(o => (
               <div key={o.id} style={{ background: '#ecfdf5', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                  <p style={{margin: '0 0 10px 0', fontSize: '15px', color: '#111827'}}><b>{o.tableName}</b> выбрал вас. К оплате: <b style={{fontSize: '18px', color: '#047857'}}>{o.total} ₸</b> (Наличные)</p>
                  <button onClick={() => { 
                     const updatedOrder = {...o, status: 'new', payMethod: 'cash'};
                     changeOrderStatus(o.id, 'new', 'cash'); 
                     setTables(prev => (prev || []).map(t => t.id === o.tableId ? { ...t, servedBy: currentUser.phone } : t)); 
                     void syncOrderWithPaloma({ ...updatedOrder, customerName: currentUser.name }, 'Заказ гостя через официанта');
                  }} style={{width: '100%', padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>✅ Оплату принял (Отправить на кухню)</button>
               </div>
            ))}
          </div>

          {(tables || []).filter(t => t.isCallingForBill && (t.servedBy === currentUser.phone || currentUser.isSenior)).map(table => {
             const ro = cashPending.find(o => o.tableId === table.id);
             return (<div key={`bill-${table.id}`} style={{ backgroundColor: '#fee2e2', border: '4px solid #dc2626', padding: '20px', borderRadius: '24px', marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}><div><h2 style={{ color: '#991b1b', margin: '0 0 5px 0' }}>💸 СТОЛ ПРОСИТ СЧЕТ</h2><p style={{ margin: 0, fontWeight: 'bold', fontSize: '18px', color: '#111827' }}>{table.name} — К оплате: {ro?.total || '?'} ₸</p></div><button onClick={() => { setTables(prev => (prev || []).map(t => t.id === table.id ? { ...t, isCallingForBill: false, status: 'free', bookedBy: null, servedBy: null, isCalling: false, calledWaiter: null } : t)); if(ro) { changeOrderStatus(ro.id, 'delivered'); } }} style={{ padding: '15px', borderRadius: '12px', border: 'none', backgroundColor: '#dc2626', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>✅ Стол рассчитан</button></div>)
          })}
          
          <h2 style={{color: '#111827'}}>Интерактивная карта залов:</h2>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px solid #d1d5db' }}>
            {tableGroupsList.map(group => (<button key={group} onClick={() => setSelectedTableGroup(group)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #d1d5db', background: selectedTableGroup === group ? '#111827' : '#fff', color: selectedTableGroup === group ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{group === 'all' ? 'Все залы' : group}</button>))}
          </div>

          {filteredTableGroups.map(groupName => {
            const groupTables = (tables || []).filter(t => t.group === groupName);
            if(groupTables.length === 0) return null;
            return (
              <div key={groupName} style={{ marginTop: '20px' }}>
                <h3 style={{ paddingBottom: '5px', borderBottom: '2px solid #d1d5db', marginBottom: '10px', color: '#111827' }}>{groupName}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                  {groupTables.map(t => {
                    const isMyTable = t.servedBy === currentUser.phone || t.status === 'free';
                    const canManage = currentUser.isSenior || isMyTable;
                    
                    const isCallingMe = t.isCalling && t.calledWaiter === currentUser.phone;
                    const isCallingSomeoneElse = t.isCalling && t.calledWaiter && t.calledWaiter !== currentUser.phone;
                    const isGeneralCall = t.isCalling && !t.calledWaiter;

                    const tableActiveOrders = (orders || []).filter(o => 
                       o.tableId === t.id && 
                       o.status !== 'delivered' && 
                       o.status !== 'rejected'
                    );
                    const unservedCount = tableActiveOrders.reduce((sum, o) => {
                      return sum + (o.cartItems || []).filter(item => !item.isServed).length;
                    }, 0);

                    return (
                      <div key={t.id} style={{ padding: '15px', borderRadius: '12px', backgroundColor: isCallingMe || isGeneralCall ? '#fef3c7' : '#fff', border: isCallingMe || isGeneralCall ? '2px solid #f59e0b' : '1px solid #cbd5e1', textAlign: 'center', opacity: canManage ? 1 : 0.6 }}>
                        <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#111827' }}>{t.name}</p>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>{t.status === 'free' ? 'Свободен' : 'Занят'}</span>
                        {t.status !== 'free' && t.servedBy && <p style={{fontSize: '11px', color: '#f59e0b', margin: '4px 0 0 0', fontWeight: 'bold'}}>{roles[t.servedBy]?.name || 'Официант'}</p>}
                        
                        {t.bookedBy && (
                          <div style={{background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '6px', marginTop: '8px'}}>
                             <p style={{margin: 0, fontWeight: 'bold', fontSize: '12px', color: '#b45309'}}>📅 Бронь на {t.bookedTime || 'Сейчас'}</p>
                             <p style={{margin: '2px 0 0 0', fontSize: '11px', color: '#111827'}}>{customers[t.bookedBy]?.name || 'Гость'}</p>
                             {t.status === 'free' ? (
                                 <div style={{display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '5px'}}>
                                   <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? {...tab, status: 'occupied', servedBy: currentUser.phone} : tab))} style={{width: '100%', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer'}}>👥 Посадить гостей</button>
                                 </div>
                             ) : null}
                          </div>
                        )}

                        {(isCallingMe || isGeneralCall) && (
                          <div style={{background: t.callType === 'arrival' ? '#10b981' : '#f59e0b', color: '#fff', padding: '8px', borderRadius: '8px', marginTop: '10px', fontSize: '12px', fontWeight: 'bold'}}>
                            {t.callType === 'arrival' ? '🙋‍♂️ Гость пришел (Бронь)!' : '🛎 Вас вызывают!'}
                            {t.callType === 'arrival' ? (
                               <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, isCalling: false, calledWaiter: null, callType: null, status: 'occupied', servedBy: currentUser.phone } : tab))} style={{marginTop: '5px', padding: '5px', width: '100%', background: '#fff', color: '#10b981', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>✅ Подтвердить посадку</button>
                            ) : (
                               <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, isCalling: false, calledWaiter: null, callType: null } : tab))} style={{marginTop: '5px', padding: '5px', width: '100%', background: '#fff', color: '#f59e0b', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'}}>✅ Подошел</button>
                            )}
                          </div>
                        )}

                        {isCallingSomeoneElse && (
                          <div style={{background: '#f3f4f6', color: '#4b5563', padding: '6px', borderRadius: '6px', marginTop: '10px', fontSize: '11px', fontWeight: 'bold'}}>
                            Вызывает: {roles[t.calledWaiter]?.name || 'Официанта'}
                          </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                          <button disabled={!canManage} onClick={() => { setPosTableId(t.id); setShowPosModal(true); }} style={{ flex: 1, minWidth: '100%', padding: '8px', background: canManage ? '#111827' : '#9ca3af', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: canManage ? 'pointer' : 'not-allowed' }}>+ Чек</button>
                          
                          {unservedCount > 0 && canManage && (
                            <button onClick={() => setActiveOrdersList({ tableId: t.id, orders: tableActiveOrders })} style={{ flex: 1, minWidth: '100%', padding: '8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
                              📋 Заказы ({unservedCount})
                            </button>
                          )}
                          
                          {t.status !== 'free' && canManage && (
                                <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, status: 'free', bookedBy: null, bookedTime: null, servedBy: null, isCalling: false, calledWaiter: null, isCallingForBill: false } : tab))} style={{ width: '100%', padding: '8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>❌ Освободить стол</button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (currentUser.role === 'admin') {
    const displayedReviews = reviewFilter === 'all' ? (reviews || []) : (reviews || []).filter(r => r.rating === parseInt(reviewFilter));
    const tableGroupsList = ['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'];
    const filteredTableGroups = selectedTableGroup === 'all' ? tableGroupsList.filter(g => g !== 'all') : [selectedTableGroup];

    const displayedAdminMenu = adminMenuCategory === 'all' ? (menu || []) : (menu || []).filter(m => m.category === adminMenuCategory);
    const staffRolesList = [ { id: 'all', name: 'Все' }, { id: 'waiter', name: 'Официанты' }, { id: 'cashier', name: 'Кассиры' } ];

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial', paddingBottom: '80px' }}>
        {renderInfoModal()}
        {editStaffModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '400px', position: 'relative' }}>
              <button onClick={() => setEditStaffModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563' }}>✕</button>
              <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>✏️ Редактировать профиль</h3>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Имя Фамилия</label><input type="text" value={editStaffData.name} onChange={e => setEditStaffData({...editStaffData, name: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}} /></div>
                <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Логин (Номер телефона)</label><input type="text" value={editStaffData.phone} onChange={e => setEditStaffData({...editStaffData, phone: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}} /></div>
                
                <div style={{display: 'flex', gap: '10px'}}>
                  <div style={{flex: 1, minWidth: 0}}><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Должность</label><select value={editStaffData.role} onChange={e => setEditStaffData({...editStaffData, role: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}}><option value="waiter">Официант</option><option value="cashier">Кассир</option></select></div>
                </div>

                <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>График работы</label><input type="text" value={editStaffData.schedule} onChange={e => setEditStaffData({...editStaffData, schedule: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}} /></div>

                {editStaffData.role === 'waiter' && (
                  <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: '#111827', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'}}>
                    <input type="checkbox" checked={editStaffData.isSenior} onChange={e => setEditStaffData({...editStaffData, isSenior: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                    👑 Назначить Старшим официантом
                  </label>
                )}

                <button onClick={handleSaveStaff} style={{ width: '100%', padding: '16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '12px', marginTop: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>Сохранить изменения</button>
              </div>
            </div>
          </div>
        )}

        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>💼 Директор</h2>
          <HeaderControls />
        </header>
        <div style={{ display: 'flex', gap: '10px', padding: '20px', justifyContent: 'flex-start', overflowX: 'auto' }}>
          <button onClick={() => setAdminTab('stats')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'stats' ? '#10b981' : '#e5e7eb', color: adminTab === 'stats' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📊 Выручка</button>
          <button onClick={() => setAdminTab('reviews')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'reviews' ? '#f59e0b' : '#e5e7eb', color: adminTab === 'reviews' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>⭐️ Отзывы</button>
          <button onClick={() => setAdminTab('menu')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'menu' ? '#3b82f6' : '#e5e7eb', color: adminTab === 'menu' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📝 Меню</button>
          <button onClick={() => setAdminTab('staff')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'staff' ? '#8b5cf6' : '#e5e7eb', color: adminTab === 'staff' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>👥 Персонал</button>
          <button onClick={() => setAdminTab('tables')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'tables' ? '#ec4899' : '#e5e7eb', color: adminTab === 'tables' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🪑 Залы</button>
          <button onClick={() => setAdminTab('support')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'support' ? '#3b82f6' : '#e5e7eb', color: adminTab === 'support' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>💬 Поддержка</button>
        </div>
        
        {adminTab === 'support' && renderSupportPanel()}

        {adminTab === 'stats' && (
          <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center', marginBottom: '20px' }}><h2>Общая Касса:</h2><h1 style={{ color: '#10b981', fontSize: '40px', margin: '10px 0' }}>{totalRevenue} ₸</h1></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{margin: '0 0 10px 0', color: '#6b7280', fontWeight: 'bold'}}>По QR</p><p style={{margin: 0, fontSize: '24px', fontWeight: '900', color: '#111827'}}>{analytics?.qr || 0}</p>
              </div>
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                <p style={{margin: '0 0 10px 0', color: '#6b7280', fontWeight: 'bold'}}>По Ссылке</p><p style={{margin: 0, fontSize: '24px', fontWeight: '900', color: '#111827'}}>{analytics?.link || 0}</p>
              </div>
            </div>
            <h3 style={{color: '#111827', margin: '0 0 15px 0'}}>🧾 История закрытых заказов:</h3>
            {validOrders.length === 0 ? <p style={{color: '#6b7280'}}>Заказов пока нет.</p> : 
              validOrders.map(o => (
                <div key={o.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '15px', marginBottom: '15px' }}>
                   <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
                     <div>
                       <span style={{fontWeight: '900', color: '#111827'}}>{o.tableName}</span>
                       <span style={{background: o.orderType === 'in_hall' ? '#f3f4f6' : '#fff7ed', color: o.orderType === 'in_hall' ? '#4b5563' : '#ea580c', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', marginLeft: '10px', fontWeight: 'bold'}}>{o.orderType === 'in_hall' ? 'В зале' : o.orderType === 'delivery' ? 'Доставка' : 'Навынос'}</span>
                     </div>
                     <span style={{fontWeight: '900', color: '#10b981', fontSize: '16px'}}>+ {o.total} ₸</span>
                   </div>
                   <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}><b>Заказ:</b> {o.itemsText}</p>
                   <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px'}}>
                      <span>Обслужил(а): {o.waiterName || 'Сайт/Онлайн'}</span>
                      <span>{o.date}</span>
                   </div>
                </div>
              ))
            }
          </div>
        )}

        {adminTab === 'tables' && (
          <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{color: '#111827', margin: '0 0 15px 0'}}>🗺 Контроль залов</h2>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px solid #d1d5db' }}>
              {tableGroupsList.map(group => (<button key={group} onClick={() => setSelectedTableGroup(group)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #d1d5db', background: selectedTableGroup === group ? '#111827' : '#fff', color: selectedTableGroup === group ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{group === 'all' ? 'Все залы' : group}</button>))}
            </div>
            {filteredTableGroups.map(groupName => {
              const groupTables = (tables || []).filter(t => t.group === groupName);
              if(groupTables.length === 0) return null;
              return (
                <div key={groupName} style={{ marginTop: '20px' }}>
                  <h3 style={{ paddingBottom: '5px', borderBottom: '2px solid #d1d5db', marginBottom: '10px', color: '#111827' }}>{groupName}</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {groupTables.map(t => {
                       const bookingCust = t.bookedBy ? customers[t.bookedBy] : null;
                       return (
                         <div key={t.id} style={{ padding: '15px', borderRadius: '12px', backgroundColor: '#fff', border: t.status === 'free' ? '1px solid #e5e7eb' : '2px solid #111827' }}>
                            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                               <p style={{ margin: 0, fontWeight: '900', fontSize: '15px', color: '#111827' }}>{t.name}</p>
                               <span style={{ fontSize: '11px', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', background: t.status === 'free' ? '#f3f4f6' : '#fef3c7', color: t.status === 'free' ? '#6b7280' : '#b45309' }}>{t.status === 'free' ? 'Свободен' : 'Занят'}</span>
                            </div>
                            {t.servedBy && <p style={{fontSize: '13px', color: '#4b5563', margin: '8px 0 0 0'}}>🏃‍♂️ Официант: <b>{roles[t.servedBy]?.name || 'Неизвестно'}</b></p>}
                            {t.bookedBy && (
                               <div style={{marginTop: '10px', padding: '10px', background: '#ecfdf5', borderRadius: '8px', border: '1px dashed #10b981'}}>
                                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#065f46', fontWeight: 'bold'}}>📅 Бронь: {t.bookedTime || 'Сейчас'}</p>
                                 <p style={{margin: 0, fontSize: '12px', color: '#111827'}}>{bookingCust?.name || 'Гость'}<br/>{t.bookedBy}</p>
                               </div>
                            )}
                            {t.status !== 'free' && (
                               <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, status: 'free', bookedBy: null, servedBy: null, isCalling: false, calledWaiter: null, isCallingForBill: false } : tab))} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#f3f4f6', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Освободить стол</button>
                            )}
                         </div>
                       )
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {adminTab === 'reviews' && (
          <div style={{ padding: '0 20px', maxWidth: '700px', margin: '0 auto' }}>
             <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '10px' }}>
               {['all', '5', '4', '3', '2', '1'].map(star => (
                 <button key={star} onClick={() => setReviewFilter(star)} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #d1d5db', background: reviewFilter === star ? '#111827' : '#fff', color: reviewFilter === star ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>
                   {star === 'all' ? 'Все' : `${star} ⭐️`}
                 </button>
               ))}
             </div>
             {displayedReviews.length === 0 ? <p style={{textAlign: 'center', color: '#6b7280'}}>Отзывов пока нет.</p> : 
               displayedReviews.map(rev => (
                 <div key={rev.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '15px' }}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px'}}>
                       <div>
                          <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>{rev.author}</p>
                          <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>Обслуживал: {rev.targetName}</p>
                       </div>
                       <div style={{textAlign: 'right'}}>
                          <p style={{margin: '0 0 5px 0', color: '#f59e0b', fontSize: '18px'}}>{'★'.repeat(rev.rating)}{'☆'.repeat(5-rev.rating)}</p>
                          <p style={{margin: 0, fontSize: '12px', color: '#9ca3af'}}>{rev.date}</p>
                       </div>
                    </div>
                    {rev.text && <p style={{margin: '10px 0 0 0', padding: '12px', background: '#f9fafb', borderRadius: '8px', fontSize: '14px', color: '#4b5563'}}>{rev.text}</p>}
                 </div>
               ))
             }
          </div>
        )}

        {adminTab === 'menu' && (
          <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h3 style={{color: '#111827', margin: 0}}>Меню заведения:</h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={handleTestPaloma} disabled={palomaStatus.state === 'loading'} style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', padding: '10px 13px', borderRadius: '12px', fontWeight: 'bold', cursor: palomaStatus.state === 'loading' ? 'wait' : 'pointer' }}>
                    🔌 Проверить связь
                  </button>
                  <button onClick={handleSyncPaloma} disabled={palomaStatus.state === 'loading'} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '12px', fontWeight: 'bold', cursor: palomaStatus.state === 'loading' ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(16,185,129,0.2)', opacity: palomaStatus.state === 'loading' ? 0.7 : 1 }}>
                    🔄 Синхронизировать
                  </button>
                </div>
              </div>
              <div style={{ marginTop: '10px', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', fontWeight: 'bold', background: palomaStatus.state === 'success' ? '#ecfdf5' : palomaStatus.state === 'error' ? '#fef2f2' : palomaStatus.state === 'loading' ? '#eff6ff' : '#f9fafb', color: palomaStatus.state === 'success' ? '#047857' : palomaStatus.state === 'error' ? '#b91c1c' : palomaStatus.state === 'loading' ? '#1d4ed8' : '#6b7280', border: `1px solid ${palomaStatus.state === 'success' ? '#a7f3d0' : palomaStatus.state === 'error' ? '#fecaca' : palomaStatus.state === 'loading' ? '#bfdbfe' : '#e5e7eb'}` }}>
                {palomaStatus.state === 'success' ? '✅ ' : palomaStatus.state === 'error' ? '❌ ' : palomaStatus.state === 'loading' ? '⏳ ' : 'ℹ️ '}{palomaStatus.message}
              </div>
            </div>

            <p style={{color: '#6b7280', fontSize: '13px', marginBottom: '20px'}}>💡 Ручное редактирование отключено. Меню, цены и стоп-лист загружаются из Paloma365. Гостям показывается последняя успешно сохранённая версия, поэтому временный сбой Paloma не оставит сайт без меню.</p>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #d1d5db' }}>
              <button onClick={() => setAdminMenuCategory('all')} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: adminMenuCategory === 'all' ? '#3b82f6' : '#f3f4f6', color: adminMenuCategory === 'all' ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>🍽️ Все</button>
              {(categories || []).map(cat => (<button key={cat.id} onClick={() => setAdminMenuCategory(cat.id)} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: adminMenuCategory === cat.id ? '#3b82f6' : '#f3f4f6', color: adminMenuCategory === cat.id ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{cat.icon} {cat.name}</button>))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {displayedAdminMenu.map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', display: 'grid', gridTemplateColumns: '40px 1fr', gap: '10px', alignItems: 'center', border: item.isStop ? '2px solid #dc2626' : '1px solid #e5e7eb', opacity: item.isStop ? 0.6 : 1 }}>
                  <div style={{fontSize: '25px', display: 'flex', justifyContent: 'center'}}>
                    {item.imgUrl ? <img src={item.imgUrl} style={{width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover'}} alt="" /> : <span style={{fontSize: '24px'}}>{categories.find(c => c.id === item.category)?.icon || '🍲'}</span>}
                  </div>
                  <div style={{minWidth: 0}}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: item.isStop ? '#dc2626' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>{item.price} ₸</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {adminTab === 'staff' && (
          <div style={{ padding: '0 20px', maxWidth: '700px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #8b5cf6' }}>
              <h4 style={{color: '#111827', margin: '0 0 15px 0'}}>➕ Новый сотрудник:</h4>
              <input type="text" placeholder="Имя Фамилия" value={newWaiter.name} onChange={e => setNewWaiter({...newWaiter, name: e.target.value})} style={{ width: '100%', padding: '12px', margin: '0 0 10px 0', borderRadius: '10px', border: '1px solid #ccc', color: '#111827', boxSizing: 'border-box' }}/>
              <div style={{ marginBottom: '10px' }}>
                 <input type="tel" placeholder="Логин (номер)" value={newWaiter.phone} onChange={e => setNewWaiter({...newWaiter, phone: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ccc', color: '#111827', boxSizing: 'border-box' }}/>
              </div>
              <p style={{ margin: '0 0 10px 0', padding: '10px 12px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '10px', color: '#92400e', fontSize: '12px', lineHeight: 1.5 }}>
                🔐 Пароли больше не хранятся в сайте или Firestore. Данные для входа создаются локально через <b>tools/staff-config.html</b> и сохраняются только в Vercel.
              </p>
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <select value={newWaiter.role} onChange={e => setNewWaiter({...newWaiter, role: e.target.value})} style={{ flex: 1, minWidth: 0, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', color: '#111827', boxSizing: 'border-box' }}><option value="waiter">Официант</option><option value="cashier">Кассир</option></select>
              </div>
              <input type="text" placeholder="График (напр. 2/2 или ПН-ПТ)" value={newWaiter.schedule} onChange={e => setNewWaiter({...newWaiter, schedule: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ccc', color: '#111827', boxSizing: 'border-box' }}/>
              {newWaiter.role === 'waiter' && (
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: '#111827', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={newWaiter.isSenior} onChange={e => setNewWaiter({...newWaiter, isSenior: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                  👑 Назначить Старшим официантом
                </label>
              )}
              <button onClick={handleAddWaiter} style={{ width: '100%', padding: '14px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Добавить сотрудника</button>
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #d1d5db' }}>
              {staffRolesList.map(role => (<button key={role.id} onClick={() => setAdminStaffRole(role.id)} style={{ padding: '8px 15px', borderRadius: '12px', border: 'none', background: adminStaffRole === role.id ? '#8b5cf6' : '#f3f4f6', color: adminStaffRole === role.id ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{role.name}</button>))}
            </div>
            {Object.entries(roles || {}).filter(([phone, data]) => data.role !== 'admin' && data.role !== 'developer' && (adminStaffRole === 'all' || data.role === adminStaffRole)).map(([phone, data]) => (
              <div key={phone} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '16px' }}>{data.name} {data.isSenior ? '👑' : ''}</p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>Логин: <b>{phone}</b> | Роль: {data.role === 'waiter' ? 'Официант' : data.role === 'cashier' ? 'Кассир' : 'Шеф'}</p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>График: <b>{data.schedule || 'Не указан'}</b> | Доступ: {data.onShift ? '✅ Открыт' : '❌ Закрыт'}</p>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                     <button onClick={() => openEditStaffModal(phone, data)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✏️ Изменить</button>
                     <button onClick={() => toggleWaiterShift(phone)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: data.onShift ? '#fee2e2' : '#d1fae5', color: data.onShift ? '#dc2626' : '#065f46', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{data.onShift ? 'Снять со смены' : 'Поставить на смену'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
