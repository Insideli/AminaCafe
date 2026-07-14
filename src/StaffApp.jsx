import React, { useState, useEffect } from 'react';
import { INITIAL_MENU, CATEGORIES, INITIAL_STORIES, INITIAL_TABLES, STATION_MAP, INITIAL_ROLES, INITIAL_CUSTOMERS, useLocalStorage } from './data.js';

export default function StaffApp({ currentUser, logout, lang, setLang }) {
  const [menu, setMenu] = useLocalStorage('amina_menu_v11', INITIAL_MENU);
  const [tables, setTables] = useLocalStorage('amina_tables_v11', INITIAL_TABLES);
  const [orders, setOrders] = useLocalStorage('amina_orders_v11', []);
  const [roles, setRoles] = useLocalStorage('amina_roles_v11', INITIAL_ROLES);
  const [storiesDb, setStoriesDb] = useLocalStorage('amina_stories_v11', INITIAL_STORIES);
  const [customers, setCustomers] = useLocalStorage('amina_customers_v11', INITIAL_CUSTOMERS);
  const [reviews, setReviews] = useLocalStorage('amina_reviews_v11', []);
  const [analytics, setAnalytics] = useLocalStorage('amina_analytics_v11', { qr: 0, link: 0 });

  const [adminTab, setAdminTab] = useState('stats'); 
  const [reviewFilter, setReviewFilter] = useState('all');
  const [selectedTableGroup, setSelectedTableGroup] = useState('all');
  
  // Словарь для перевода интерфейса персонала
  const t = {
    logout: lang === 'ru' ? 'Выйти' : 'Шығу'
  };
  
  // УМНАЯ КАССА (Определение смены с учетом ночи)
  // Если сейчас меньше 06:00 утра, значит смена еще "вчерашняя"
  const now = new Date();
  const currentShiftDate = new Date(now);
  if (now.getHours() < 6) {
    currentShiftDate.setDate(currentShiftDate.getDate() - 1);
  }
  const todayDateStr = currentShiftDate.toLocaleDateString('ru-RU');
  
  const [reportDate, setReportDate] = useState(todayDateStr);
  
  // Собираем все уникальные даты смен из базы
  const allDates = [...new Set((orders || []).map(o => o.fullDate))].sort().reverse();
  if (!allDates.includes(todayDateStr)) allDates.unshift(todayDateStr);

  // СИРЕНА ДЛЯ ПЕРСОНАЛА (Кто просит счет или зовет)
  const callingTables = (tables || []).filter(tab => tab.isCalling || tab.isCallingForBill);
  const notifyBanner = callingTables.length > 0 ? (
    <div style={{ background: '#ef4444', color: '#fff', padding: '15px', textAlign: 'center', fontWeight: '900', fontSize: '16px', position: 'sticky', top: 0, zIndex: 9999, boxShadow: '0 4px 10px rgba(239,68,68,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
      <span>🚨 ВНИМАНИЕ! Столы: {callingTables.map(tab => tab.name).join(', ')}</span>
      <button onClick={() => setTables(prev => prev.map(tab => ({...tab, isCalling: false, isCallingForBill: false})))} style={{ background: '#fff', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '5px 15px', fontWeight: 'bold', cursor: 'pointer' }}>Понял</button>
    </div>
  ) : null;

  // ФИНАНСОВЫЕ РАСЧЕТЫ ПО СМЕНЕ
  const validOrders = (orders || []).filter(o => o.status !== 'rejected' && o.status !== 'transfer_pending' && o.status !== 'waiter_pending' && o.fullDate === reportDate);
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total, 0);
  const kaspiRevenue = validOrders.filter(o => o.payMethod === 'kaspi').reduce((sum, o) => sum + o.total, 0);
  const cashRevenue = validOrders.filter(o => o.payMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const cardRevenue = validOrders.filter(o => o.payMethod === 'card').reduce((sum, o) => sum + o.total, 0);
  const appleRevenue = validOrders.filter(o => o.payMethod === 'apple_pay').reduce((sum, o) => sum + o.total, 0);

  const HeaderControls = () => (
    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
      <button onClick={logout} style={{ background: '#ef4444', border: 'none', color: '#fff', borderRadius: '8px', padding: '8px 16px', fontWeight: 'bold', cursor: 'pointer' }}>{t.logout}</button>
    </div>
  );

  // --- СОСТОЯНИЯ АДМИНА И ПЕРСОНАЛА ---
  const [newItem, setNewItem] = useState({ name: '', price: '', category: 'hot', ingredients: '', img: '🍔' });
  const [editStaffModal, setEditStaffModal] = useState(false);
  const [editStaffOriginalPhone, setEditStaffOriginalPhone] = useState('');
  const [editStaffData, setEditStaffData] = useState({ phone: '', name: '', schedule: '', role: 'waiter', password: '', station: 'hot', isSenior: false, onShift: true });
  const [newWaiter, setNewWaiter] = useState({ phone: '', name: '', schedule: '', role: 'waiter', password: '', station: 'hot', isSenior: false });
  
  // --- СОСТОЯНИЯ ОФИЦИАНТА ---
  const [showPosModal, setShowPosModal] = useState(false); 
  const [posTableId, setPosTableId] = useState(null);
  const [posCart, setPosCart] = useState({});

  // --- СОСТОЯНИЯ КАССИРА ---
  const [cashierTab, setCashierTab] = useState('orders'); 
  const [cashierCart, setCashierCart] = useState({});
  const [cashierOrderType, setCashierOrderType] = useState('takeaway');

  // ФУНКЦИИ АДМИНА
  const handleAddWaiter = () => { 
    if(!newWaiter.phone || !newWaiter.name || !newWaiter.password) return alert("Заполните логин и пароль!"); 
    setRoles(prev => ({ ...(prev || {}), [newWaiter.phone]: { ...newWaiter, onShift: true, sessionToken: null }})); 
    setNewWaiter({ phone: '', name: '', schedule: '', role: 'waiter', password: '', station: 'hot', isSenior: false }); 
    alert("Сотрудник добавлен!"); 
  };
  
  const openEditStaffModal = (phone, data) => {
    setEditStaffOriginalPhone(phone);
    setEditStaffData({ ...data, phone: phone });
    setEditStaffModal(true);
  };

  const handleSaveStaff = () => {
    setRoles(prev => {
      const updated = { ...(prev || {}) };
      if (editStaffOriginalPhone !== editStaffData.phone) delete updated[editStaffOriginalPhone];
      updated[editStaffData.phone] = { ...editStaffData, sessionToken: updated[editStaffOriginalPhone]?.sessionToken || null };
      return updated;
    });
    setEditStaffModal(false);
    alert("Изменения сохранены!");
  };

  const toggleStopList = (id) => {
    const item = (menu || []).find(m => m.id === id);
    if (!item) return;
    if (item.isStop) { 
      setMenu(prev => (prev || []).map(m => m.id === id ? { ...m, isStop: false, stopReason: "" } : m)); 
    } else { 
      const reason = prompt(`Укажите причину стопа:`, "Закончились ингредиенты"); 
      if (reason !== null) setMenu(prev => (prev || []).map(m => m.id === id ? { ...m, isStop: true, stopReason: reason } : m)); 
    }
  };

  const handleAddMenuItem = () => { 
    if(!newItem.name || !newItem.price) return alert("Заполните поля!"); 
    setMenu(prev => [{ ...newItem, id: 'm' + Date.now(), price: Number(newItem.price), imgUrl: "", isStop: false, stopReason: "" }, ...(prev || [])]); 
    setNewItem({ name: '', price: '', category: 'hot', ingredients: '', img: '🍔' }); 
    alert("Блюдо добавлено!"); 
  };
  
  const handlePhotoUpload = (e, id) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => { 
      setMenu(prev => (prev || []).map(m => m.id === id ? { ...m, imgUrl: event.target.result } : m)); 
      alert("Фотография успешно загружена!"); 
    };
    reader.readAsDataURL(file);
  };

  // ФУНКЦИИ СТАТУСОВ И ОПЛАТ
  const changeOrderStatus = (id, status, payMethod = null) => {
    setOrders(prev => (prev || []).map(o => o.id === id ? { ...o, status, payMethod: payMethod || o.payMethod } : o));
  };

  const getTableIcon = (type) => type === 'cabin' ? '🚪' : type === 'tapchan' ? '🛋️' : '🪑';

  // --- ЛОГИКА ОФИЦИАНТА (POS-ТЕРМИНАЛ) ---
  const addToPosCart = (item) => setPosCart(prev => ({ ...(prev || {}), [item.id]: { ...item, quantity: ((prev || {})[item.id]?.quantity || 0) + 1 } }));
  const removeFromPosCart = (id) => setPosCart(prev => { const updated = { ...(prev || {}) }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; });
  
  const applySeniorDiscount = () => {
    const cartArray = Object.values(posCart || {});
    const currentTotal = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    if (currentTotal <= 0) return;
    const discountAmount = Math.round(currentTotal * 0.1);
    setPosCart(prev => ({ ...prev, 'discount_10': { id: 'discount_10', name: 'Скидка Старшего (-10%)', price: -discountAmount, quantity: 1, isStop: false, imgUrl: '' } }));
  };

  const submitPosOrder = () => {
    const cartArray = Object.values(posCart || {}); if (cartArray.length === 0) return alert("Корзина пуста");
    const table = (tables || []).find(t => t.id === posTableId); 
    const total = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const text = cartArray.map(i => `${i.name} (x${i.quantity})`).join(', ');
    
    // ЗАГЛУШКА ДЛЯ PALOMA365 (Отправка чека на кухню)
    console.log("SENDING TO PALOMA365 (KITCHEN PRINTER):", { table: table?.name, items: text, total });

    const newOrder = { 
      id: `ORD-${Math.floor(Math.random() * 10000)}`, phone: 'waiter-' + currentUser.phone, 
      tableId: table?.id, tableName: table?.name, cartItems: cartArray, itemsText: text, 
      total: total, tips: 0, isPreOrder: false, bookedTime: null, orderType: 'in_hall', 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      fullDate: todayDateStr, status: 'new', waiterPhone: currentUser.phone, waiterName: currentUser.name, payMethod: 'cash' 
    }; 
    setOrders(prev => [newOrder, ...(prev || [])]); 
    setTables(prev => (prev || []).map(t => t.id === table?.id ? { ...t, status: 'occupied', bookedBy: t.bookedBy || 'Гость', servedBy: currentUser.phone, isCalling: false } : t));
    setShowPosModal(false); setPosCart({}); alert('Заказ отправлен на принтер кухни!');
  };

  const renderWaiterPosModal = () => {
    if (!showPosModal) return null; 
    const posTotal = Object.values(posCart || {}).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const table = (tables || []).find(t => t.id === posTableId);
    
    return (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: '#f3f4f6', zIndex: 9999, display: 'flex', flexDirection: 'column' }}>
         <div style={{ padding: '20px', backgroundColor: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{margin: 0, fontSize: '18px'}}>📱 Касса: {table?.name}</h2><button onClick={() => setShowPosModal(false)} style={{background: 'none', border: 'none', color: '#fff', fontSize: '24px', cursor: 'pointer'}}>✖</button>
         </div>
         <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
            {currentUser.isSenior && <button onClick={applySeniorDiscount} style={{width: '100%', padding: '10px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer'}}>🎁 Применить скидку -10%</button>}
            {(menu || []).map(item => (
              <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isStop ? 0.5 : 1 }}>
                 <div style={{ flex: 1, paddingRight: '10px' }}><div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>{item.imgUrl ? <img src={item.imgUrl} alt="" style={{width: '30px', height: '30px', borderRadius: '8px', objectFit: 'cover'}}/> : <span>{item.img}</span>}<p style={{margin: 0, fontWeight: 'bold', fontSize: '14px', color: '#111827'}}>{item.name}</p></div><p style={{margin: '5px 0 0 0', color: '#6b7280', fontSize: '14px'}}>{item.price} ₸</p></div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexShrink: 0 }}><button onClick={() => removeFromPosCart(item.id)} style={{ padding: '8px 15px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', cursor: 'pointer' }}>-</button><span style={{fontWeight: 'bold', fontSize: '16px', color: '#111827'}}>{(posCart || {})[item.id]?.quantity || 0}</span><button disabled={item.isStop} onClick={() => addToPosCart(item)} style={{ padding: '8px 15px', borderRadius: '10px', background: item.isStop ? '#9ca3af' : '#111827', color: '#fff', cursor: 'pointer' }}>+</button></div>
              </div>
            ))}
         </div>
         <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb' }}><p style={{ margin: '0 0 15px 0', fontWeight: '900', fontSize: '20px', display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Итого:</span> <span>{posTotal} ₸</span></p><button onClick={submitPosOrder} style={{ width: '100%', padding: '18px', borderRadius: '14px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>Отправить на кухню</button></div>
      </div>
    );
  };

  // --- ЛОГИКА КАССИРА ---
  const addToCashierCart = (item) => setCashierCart(prev => ({ ...prev, [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 } }));
  const removeFromCashierCart = (id) => { setCashierCart(prev => { const updated = { ...prev }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; }); };
  
  const submitCashierOrder = (payMethod) => {
    const cartArray = Object.values(cashierCart || {}); 
    if (cartArray.length === 0) return alert('Выберите блюда!');
    const total = cartArray.reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
    const text = cartArray.map(i => `${i.name} (x${i.quantity})`).join(', ');
    
    // ЗАГЛУШКА ДЛЯ PALOMA365 (Отправка чека на кухню)
    console.log("SENDING TO PALOMA365 (KITCHEN PRINTER):", { table: cashierOrderType, items: text, total });

    const newOrder = { 
      id: `ORD-${Math.floor(Math.random() * 10000)}`, phone: 'cashier-' + currentUser.phone, tableId: 'cashier', 
      tableName: cashierOrderType === 'takeaway' ? 'Навынос (Касса)' : 'Доставка (Касса)', 
      cartItems: cartArray, itemsText: text, total: total, tips: 0, 
      isPreOrder: false, bookedTime: null, orderType: cashierOrderType, 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      fullDate: todayDateStr, status: 'new', waiterPhone: currentUser.phone, waiterName: currentUser.name, payMethod: payMethod 
    };
    setOrders(prev => [newOrder, ...(prev || [])]); setCashierCart({}); alert('Заказ оплачен и отправлен на принтер кухни!');
  };

  // Вспомогательная функция для рендера ссылок
  const renderTextWithLinks = (text) => {
    if (!text) return null; const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) => part.match(/https?:\/\/[^\s]+/) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{color: '#3b82f6', textDecoration: 'underline', fontWeight: 'bold'}}>📍 Открыть карту</a> : <span key={i}>{part}</span>);
  };

  const tableGroupsList = ['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'];
  const filteredTableGroups = selectedTableGroup === 'all' ? tableGroupsList.filter(g => g !== 'all') : [selectedTableGroup];

  // ==========================================
  // ЭКРАН 1: АДМИНИСТРАТОР (ДИРЕКТОР)
  // ==========================================
  if (currentUser.role === 'admin') {
    const displayedReviews = reviewFilter === 'all' ? (reviews || []) : (reviews || []).filter(r => r.rating === parseInt(reviewFilter));
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial', paddingBottom: '80px' }}>
        {notifyBanner}
        
        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>💼 Директор</h2>
          <HeaderControls />
        </header>

        <div style={{ display: 'flex', gap: '10px', padding: '20px', overflowX: 'auto' }}>
          <button onClick={() => setAdminTab('stats')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'stats' ? '#10b981' : '#e5e7eb', color: adminTab === 'stats' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📊 Выручка</button>
          <button onClick={() => setAdminTab('stories')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'stories' ? '#f59e0b' : '#e5e7eb', color: adminTab === 'stories' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📸 Сторисы</button>
          <button onClick={() => setAdminTab('menu')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'menu' ? '#3b82f6' : '#e5e7eb', color: adminTab === 'menu' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📝 Меню</button>
          <button onClick={() => setAdminTab('staff')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'staff' ? '#8b5cf6' : '#e5e7eb', color: adminTab === 'staff' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>👥 Персонал</button>
          <button onClick={() => setAdminTab('tables')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'tables' ? '#ec4899' : '#e5e7eb', color: adminTab === 'tables' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🪑 Залы</button>
          <button onClick={() => setAdminTab('reviews')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: adminTab === 'reviews' ? '#14b8a6' : '#e5e7eb', color: adminTab === 'reviews' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>⭐️ Отзывы</button>
        </div>
        
        {/* АРХИВ СМЕН И ВЫРУЧКА */}
        {adminTab === 'stats' && (
          <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{color: '#111827', margin: 0}}>Смена:</h3>
              <select value={reportDate} onChange={e => setReportDate(e.target.value)} style={{ padding: '10px', borderRadius: '10px', border: '2px solid #111827', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer' }}>
                 {allDates.map(d => <option key={d} value={d}>{d === todayDateStr ? 'Сегодня (' + d + ')' : d}</option>)}
              </select>
            </div>

            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center', marginBottom: '20px' }}>
               <p style={{margin: '0 0 10px 0', color: '#6b7280', fontWeight: 'bold'}}>Общая Касса ({reportDate})</p>
               <h1 style={{ color: '#10b981', fontSize: '40px', margin: '10px 0' }}>{totalRevenue} ₸</h1>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}><p style={{margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px'}}>Kaspi</p><p style={{margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827'}}>{kaspiRevenue} ₸</p></div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}><p style={{margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px'}}>Наличные</p><p style={{margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827'}}>{cashRevenue} ₸</p></div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}><p style={{margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px'}}>Карта</p><p style={{margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827'}}>{cardRevenue} ₸</p></div>
              <div style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb', textAlign: 'center' }}><p style={{margin: '0 0 5px 0', color: '#6b7280', fontSize: '13px'}}>Apple Pay</p><p style={{margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827'}}>{appleRevenue} ₸</p></div>
            </div>

            <h3 style={{color: '#111827', margin: '0 0 15px 0'}}>🧾 История закрытых заказов (Смена {reportDate}):</h3>
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
                      <span>Метод: {o.payMethod === 'kaspi' ? 'Kaspi' : o.payMethod === 'card' ? 'Карта' : o.payMethod === 'apple_pay' ? 'Apple Pay' : 'Наличные'}</span>
                      <span>Обслужил: {o.waiterName || 'Сайт/Онлайн'}</span>
                      <span>{o.date}</span>
                   </div>
                </div>
              ))
            }
          </div>
        )}

        {/* УПРАВЛЕНИЕ СТОРИСАМИ */}
        {adminTab === 'stories' && (
          <div style={{ padding: '0 20px', maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{color: '#111827', marginBottom: '15px'}}>Актуальные акции (Сторисы):</h3>
            <p style={{color: '#6b7280', fontSize: '13px', marginBottom: '20px'}}>Включайте или отключайте сторисы, которые видят гости на главном экране.</p>
            <div style={{ display: 'grid', gap: '15px' }}>
              {(storiesDb || []).map(s => (
                <div key={s.id} style={{ background: '#fff', padding: '15px', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '15px', opacity: s.isActive ? 1 : 0.5 }}>
                  <img src={s.imgUrl} style={{width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover'}} alt="" />
                  <div style={{flex: 1}}>
                    <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>{s.title}</p>
                    <button onClick={() => setStoriesDb(prev => prev.map(st => st.id === s.id ? {...st, isActive: !st.isActive} : st))} style={{padding: '6px 12px', borderRadius: '8px', border: 'none', background: s.isActive ? '#fee2e2' : '#d1fae5', color: s.isActive ? '#dc2626' : '#065f46', fontWeight: 'bold', cursor: 'pointer'}}>
                       {s.isActive ? 'Скрыть у гостей' : 'Показать гостям'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* УПРАВЛЕНИЕ МЕНЮ */}
        {adminTab === 'menu' && (
          <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #d1d5db' }}>
              <h4 style={{color: '#111827', margin: '0 0 15px 0'}}>➕ Добавить блюдо:</h4>
              <input type="text" placeholder="Название" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} style={{ width: '100%', padding: '12px', margin: '0 0 10px 0', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
              <div style={{display: 'flex', gap: '10px'}}>
                 <input type="number" placeholder="Цена" value={newItem.price} onChange={e => setNewItem({...newItem, price: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                 <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}>{CATEGORIES.filter(c=>c.id!=='all').map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}</select>
              </div>
              <button onClick={handleAddMenuItem} style={{ width: '100%', padding: '14px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Опубликовать</button>
            </div>

            <h3 style={{color: '#111827', marginBottom: '15px'}}>Управление меню:</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(menu || []).map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '16px', display: 'grid', gridTemplateColumns: '40px 1fr auto auto', gap: '10px', alignItems: 'center', border: item.isStop ? '2px solid #dc2626' : '1px solid #e5e7eb' }}>
                  <div style={{fontSize: '25px', display: 'flex', justifyContent: 'center'}}>
                    {item.imgUrl ? <img src={item.imgUrl} style={{width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover'}} alt="" /> : item.img}
                  </div>
                  <div style={{minWidth: 0}}>
                    <p style={{ margin: 0, fontWeight: 'bold', color: item.isStop ? '#dc2626' : '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold' }}>{item.price} ₸</p>
                  </div>
                  <label style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', fontSize: '12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    📷 Фото
                    <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={(e) => handlePhotoUpload(e, item.id)} />
                  </label>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                     <button onClick={() => toggleStopList(item.id)} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: item.isStop ? '#d1fae5' : '#fee2e2', color: item.isStop ? '#065f46' : '#dc2626', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px', whiteSpace: 'nowrap' }}>{item.isStop ? 'Включить' : 'В стоп'}</button>
                     <button onClick={() => setMenu((menu || []).filter(m => m.id !== item.id))} style={{ padding: '6px 10px', borderRadius: '6px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '11px' }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* УПРАВЛЕНИЕ ПЕРСОНАЛОМ */}
        {adminTab === 'staff' && (
          <div style={{ padding: '0 20px', maxWidth: '700px', margin: '0 auto' }}>
            {editStaffModal && (
              <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(17, 24, 39, 0.8)', zIndex: 99999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '24px', width: '100%', maxWidth: '400px', position: 'relative' }}>
                  <button onClick={() => setEditStaffModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                  <h3 style={{ margin: '0 0 20px 0', color: '#111827' }}>✏️ Редактировать профиль</h3>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                    <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Имя Фамилия</label><input type="text" value={editStaffData.name} onChange={e => setEditStaffData({...editStaffData, name: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box'}} /></div>
                    <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Логин (Номер телефона)</label><input type="text" value={editStaffData.phone} onChange={e => setEditStaffData({...editStaffData, phone: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box'}} /></div>
                    <div><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Пароль</label><input type="text" value={editStaffData.password} onChange={e => setEditStaffData({...editStaffData, password: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box'}} /></div>
                    <div style={{display: 'flex', gap: '10px'}}>
                      <div style={{flex: 1}}><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Должность</label><select value={editStaffData.role} onChange={e => setEditStaffData({...editStaffData, role: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}}><option value="waiter">Официант</option><option value="cook">Повар</option><option value="chef">Шеф Повар</option><option value="cashier">Кассир</option></select></div>
                      {editStaffData.role === 'cook' && (
                        <div style={{flex: 1}}><label style={{fontSize:'12px', fontWeight:'bold', color:'#6b7280'}}>Цех</label><select value={editStaffData.station} onChange={e => setEditStaffData({...editStaffData, station: e.target.value})} style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid #d1d5db', boxSizing: 'border-box', color: '#111827'}}><option value="hot">Горячий</option><option value="cold">Холодный</option><option value="bar">Бар</option><option value="mangal">Мангал</option></select></div>
                      )}
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

            <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '1px solid #8b5cf6' }}>
              <h4 style={{color: '#111827', margin: '0 0 15px 0'}}>➕ Новый сотрудник:</h4>
              <input type="text" placeholder="Имя Фамилия" value={newWaiter.name} onChange={e => setNewWaiter({...newWaiter, name: e.target.value})} style={{ width: '100%', padding: '12px', margin: '0 0 10px 0', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                 <input type="tel" placeholder="Логин (номер)" value={newWaiter.phone} onChange={e => setNewWaiter({...newWaiter, phone: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
                 <input type="text" placeholder="Пароль" value={newWaiter.password} onChange={e => setNewWaiter({...newWaiter, password: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
              </div>
              <div style={{display: 'flex', gap: '10px', marginBottom: '10px'}}>
                <select value={newWaiter.role} onChange={e => setNewWaiter({...newWaiter, role: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}><option value="waiter">Официант</option><option value="cook">Повар</option><option value="chef">Шеф Повар</option><option value="cashier">Кассир</option></select>
                {newWaiter.role === 'cook' && (
                   <select value={newWaiter.station} onChange={e => setNewWaiter({...newWaiter, station: e.target.value})} style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}>
                     <option value="hot">Горячий цех</option><option value="cold">Холодный цех</option><option value="bar">Бар</option><option value="mangal">Мангал</option>
                   </select>
                )}
              </div>
              <input type="text" placeholder="График (напр. 2/2 или ПН-ПТ)" value={newWaiter.schedule} onChange={e => setNewWaiter({...newWaiter, schedule: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ccc', boxSizing: 'border-box' }}/>
              {newWaiter.role === 'waiter' && (
                <label style={{display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', color: '#111827', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={newWaiter.isSenior} onChange={e => setNewWaiter({...newWaiter, isSenior: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                  👑 Назначить Старшим
                </label>
              )}
              <button onClick={handleAddWaiter} style={{ width: '100%', padding: '14px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: '10px', marginTop: '15px', fontWeight: 'bold', cursor: 'pointer' }}>Добавить сотрудника</button>
            </div>

            {Object.entries(roles || {}).filter(([phone, data]) => data.role !== 'admin').map(([phone, data]) => (
              <div key={phone} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #e5e7eb', marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '900', color: '#111827', fontSize: '16px' }}>{data.name} {data.isSenior ? '👑' : ''}</p>
                    <p style={{ margin: '4px 0', fontSize: '13px', color: '#6b7280' }}>Логин: <b>{phone}</b> | Роль: {data.role === 'cook' ? `Повар (${data.station})` : data.role === 'waiter' ? 'Официант' : data.role === 'cashier' ? 'Кассир' : 'Шеф'}</p>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                     <button onClick={() => openEditStaffModal(phone, data)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>✏️ Изменить</button>
                     <button onClick={() => setRoles(prev => ({...prev, [phone]: {...data, onShift: !data.onShift}}))} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: data.onShift ? '#fee2e2' : '#d1fae5', color: data.onShift ? '#dc2626' : '#065f46', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{data.onShift ? 'Заблокировать' : 'Разблокировать'}</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* УПРАВЛЕНИЕ ЗАЛАМИ */}
        {adminTab === 'tables' && (
          <div style={{ padding: '0 20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{color: '#111827', margin: '0 0 15px 0'}}>🗺 Контроль залов</h2>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px', borderBottom: '1px solid #d1d5db' }}>
              {['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'].map(group => (<button key={group} onClick={() => setSelectedTableGroup(group)} style={{ padding: '10px 15px', borderRadius: '12px', border: '1px solid #d1d5db', background: selectedTableGroup === group ? '#111827' : '#fff', color: selectedTableGroup === group ? '#fff' : '#4b5563', fontWeight: 'bold', whiteSpace: 'nowrap', cursor: 'pointer' }}>{group === 'all' ? 'Все залы' : group}</button>))}
            </div>

            {(selectedTableGroup === 'all' ? ['Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'] : [selectedTableGroup]).map(groupName => {
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
                                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#065f46', fontWeight: 'bold'}}>📅 Бронь: {t.bookedTime}</p>
                                 <p style={{margin: 0, fontSize: '12px', color: '#111827'}}>{bookingCust?.name || 'Гость'}<br/>{t.bookedBy}</p>
                               </div>
                            )}
                            {t.status !== 'free' && (
                               <button onClick={() => setTables(prev => (prev || []).map(tab => tab.id === t.id ? { ...tab, status: 'free', bookedBy: null, servedBy: null, isCalling: false, isCallingForBill: false } : tab))} style={{ width: '100%', marginTop: '15px', padding: '8px', background: '#f3f4f6', color: '#ef4444', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Освободить стол</button>
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

        {/* ОТЗЫВЫ */}
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
      </div>
    );
  }

  // ==========================================
  // ЭКРАН 2: КАССИР
  // ==========================================
  if (currentUser.role === 'cashier') {
    const cashPendingTables = (tables || []).filter(t => t.isCallingForBill);
    const posTotal = Object.values(cashierCart || {}).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial', paddingBottom: '80px' }}>
        {notifyBanner}
        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>👩‍💻 Касса: {currentUser.name}</h2>
          <HeaderControls />
        </header>
        
        <div style={{ display: 'flex', gap: '10px', padding: '20px', justifyContent: 'flex-start', overflowX: 'auto', backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb' }}>
          <button onClick={() => setCashierTab('orders')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'orders' ? '#10b981' : '#f3f4f6', color: cashierTab === 'orders' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🔔 Оплаты столов</button>
          <button onClick={() => setCashierTab('pos')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'pos' ? '#3b82f6' : '#f3f4f6', color: cashierTab === 'pos' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>🛒 Терминал кассы</button>
          <button onClick={() => setCashierTab('report')} style={{ whiteSpace: 'nowrap', padding: '10px 20px', borderRadius: '12px', border: 'none', backgroundColor: cashierTab === 'report' ? '#8b5cf6' : '#f3f4f6', color: cashierTab === 'report' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer' }}>📊 Отчет смены</button>
        </div>

        {cashierTab === 'orders' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* ПЕРЕВОДЫ KASPI КОТОРЫЕ НАДО ПОДТВЕРДИТЬ */}
            {(() => {
              const pendingTransfers = (orders || []).filter(o => o.status === 'transfer_pending');
              if (pendingTransfers.length === 0) return null;
              return (
                 <div style={{ backgroundColor: '#fff', border: '4px solid #f59e0b', padding: '20px', borderRadius: '24px', marginBottom: '25px', boxShadow: '0 10px 25px rgba(245, 158, 11, 0.2)' }}>
                    <h2 style={{color: '#d97706', margin: '0 0 15px 0', fontSize: '18px'}}>💳 Ожидают подтверждения перевода!</h2>
                    {pendingTransfers.map(o => (
                       <div key={o.id} style={{ background: '#fef3c7', padding: '15px', borderRadius: '12px', marginBottom: '10px' }}>
                          <p style={{margin: '0 0 10px 0', fontSize: '15px', color: '#111827'}}>Заказ: <b>{o.tableName}</b> перевел(а) <b style={{fontSize: '18px', color: '#b45309'}}>{o.total} ₸</b>.<br/>Проверьте поступление на карту <b>4400 4302 5493 5945</b></p>
                          <div style={{display: 'flex', gap: '10px'}}>
                             <button onClick={() => changeOrderStatus(o.id, 'new', 'kaspi')} style={{flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>✅ Подтвердить</button>
                             <button onClick={() => changeOrderStatus(o.id, 'rejected')} style={{flex: 1, padding: '12px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer'}}>❌ Денег нет</button>
                          </div>
                       </div>
                    ))}
                 </div>
              );
            })()}

            {/* ЗАПРОСЫ СЧЕТА ОТ СТОЛОВ */}
            {cashPendingTables.map(table => {
              const orderForTable = (orders || []).find(o => o.tableId === table.id && (o.status === 'cash_pending' || o.status === 'cooking' || o.status === 'new'));
              return (
                <div key={table.id} style={{ backgroundColor: '#fee2e2', border: '2px solid #dc2626', padding: '20px', borderRadius: '16px', marginBottom: '15px' }}>
                  <h3 style={{ color: '#991b1b', margin: '0 0 10px 0' }}>🏃 Гость подошел к кассе ({table.name})</h3>
                  <p style={{ margin: '0 0 15px 0', fontSize: '18px', color: '#111827', fontWeight: 'bold' }}>К оплате: {orderForTable?.total || '?'} ₸</p>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={() => { setTables(prev => prev.map(t => t.id === table.id ? { ...t, isCallingForBill: false, status: 'free', bookedBy: null, servedBy: null } : t)); if(orderForTable) changeOrderStatus(orderForTable.id, 'delivered', 'kaspi'); }} style={{ flex: 1, padding: '12px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Оплата Kaspi</button>
                    <button onClick={() => { setTables(prev => prev.map(t => t.id === table.id ? { ...t, isCallingForBill: false, status: 'free', bookedBy: null, servedBy: null } : t)); if(orderForTable) changeOrderStatus(orderForTable.id, 'delivered', 'cash'); }} style={{ flex: 1, padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Наличными</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {cashierTab === 'pos' && (
          <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ padding: '15px', background: '#fff', display: 'flex', gap: '10px' }}>
               <button onClick={() => setCashierOrderType('takeaway')} style={{flex:1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: cashierOrderType === 'takeaway' ? '#111827' : '#fff', color: cashierOrderType === 'takeaway' ? '#fff' : '#111827', fontWeight: 'bold', cursor: 'pointer'}}>🛍 Навынос</button>
               <button onClick={() => setCashierOrderType('delivery')} style={{flex:1, padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', background: cashierOrderType === 'delivery' ? '#111827' : '#fff', color: cashierOrderType === 'delivery' ? '#fff' : '#111827', fontWeight: 'bold', cursor: 'pointer'}}>🛵 Доставка</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
              {(menu || []).map(item => (
                <div key={item.id} style={{ backgroundColor: '#fff', padding: '12px', borderRadius: '12px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: item.isStop ? 0.5 : 1 }}>
                   <div style={{ flex: 1 }}><p style={{margin: 0, fontWeight: 'bold', color: '#111827'}}>{item.name}</p><p style={{margin: '2px 0 0 0', color: '#6b7280', fontSize: '13px'}}>{item.price} ₸</p></div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <button onClick={() => setCashierCart(prev => { const updated = { ...prev }; if (!updated[item.id]) return prev; if (updated[item.id].quantity === 1) delete updated[item.id]; else updated[item.id].quantity -= 1; return updated; })} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', color: '#111827', cursor: 'pointer' }}>-</button>
                     <span style={{fontWeight: 'bold', color: '#111827'}}>{(cashierCart || {})[item.id]?.quantity || 0}</span>
                     <button disabled={item.isStop} onClick={() => setCashierCart(prev => ({ ...prev, [item.id]: { ...item, quantity: (prev[item.id]?.quantity || 0) + 1 } }))} style={{ padding: '6px 12px', borderRadius: '8px', background: item.isStop ? '#9ca3af' : '#111827', color: '#fff', cursor: 'pointer' }}>+</button>
                   </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '20px', backgroundColor: '#fff', borderTop: '2px solid #e5e7eb' }}>
               <p style={{ margin: '0 0 15px 0', fontWeight: '900', fontSize: '22px', display: 'flex', justifyContent: 'space-between', color: '#111827' }}><span>Итого:</span> <span>{posTotal} ₸</span></p>
               <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={() => {
                    if (Object.keys(cashierCart).length === 0) return alert('Выберите блюда!');
                    const total = Object.values(cashierCart).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
                    const text = Object.values(cashierCart).map(i => `${i.name} (x${i.quantity})`).join(', ');
                    const newOrder = { id: `ORD-${Math.floor(Math.random() * 10000)}`, phone: 'cashier-' + currentUser.phone, tableId: 'cashier', tableName: cashierOrderType === 'takeaway' ? 'Навынос (Касса)' : 'Доставка (Касса)', cartItems: Object.values(cashierCart), itemsText: text, total: total, tips: 0, isPreOrder: false, bookedTime: null, orderType: cashierOrderType, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), fullDate: todayDateStr, status: 'new', waiterPhone: currentUser.phone, waiterName: currentUser.name, payMethod: 'kaspi' };
                    setOrders(prev => [newOrder, ...(prev || [])]); setCashierCart({}); alert('Заказ оплачен (Kaspi) и отправлен на кухню!');
                  }} style={{ flex: 1, padding: '16px', borderRadius: '12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Оплата Kaspi</button>
                  <button onClick={() => {
                    if (Object.keys(cashierCart).length === 0) return alert('Выберите блюда!');
                    const total = Object.values(cashierCart).reduce((acc, i) => acc + (Number(i.price) * Number(i.quantity)), 0);
                    const text = Object.values(cashierCart).map(i => `${i.name} (x${i.quantity})`).join(', ');
                    const newOrder = { id: `ORD-${Math.floor(Math.random() * 10000)}`, phone: 'cashier-' + currentUser.phone, tableId: 'cashier', tableName: cashierOrderType === 'takeaway' ? 'Навынос (Касса)' : 'Доставка (Касса)', cartItems: Object.values(cashierCart), itemsText: text, total: total, tips: 0, isPreOrder: false, bookedTime: null, orderType: cashierOrderType, date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), fullDate: todayDateStr, status: 'new', waiterPhone: currentUser.phone, waiterName: currentUser.name, payMethod: 'cash' };
                    setOrders(prev => [newOrder, ...(prev || [])]); setCashierCart({}); alert('Заказ оплачен (Наличные) и отправлен на кухню!');
                  }} style={{ flex: 1, padding: '16px', borderRadius: '12px', backgroundColor: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>Наличными</button>
               </div>
            </div>
          </div>
        )}

        {cashierTab === 'report' && (
          <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{color: '#111827', margin: '0 0 15px 0'}}>📊 Финансовый отчет смены</h2>
            <div style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
               <p style={{margin: '0 0 10px 0', color: '#6b7280', fontWeight: 'bold'}}>Выручка за сегодня ({todayDateStr})</p>
               <h1 style={{ color: '#10b981', fontSize: '40px', margin: '0 0 20px 0' }}>{totalRevenue} ₸</h1>
               <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f3f4f6', paddingTop: '15px'}}>
                  <div><p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>Kaspi / Карта / Apple</p><p style={{margin: '5px 0 0 0', color: '#111827', fontWeight: 'bold', fontSize: '18px'}}>{kaspiRevenue + cardRevenue + appleRevenue} ₸</p></div>
                  <div style={{textAlign: 'right'}}><p style={{margin: 0, color: '#6b7280', fontSize: '14px'}}>Наличные (В ящике)</p><p style={{margin: '5px 0 0 0', color: '#111827', fontWeight: 'bold', fontSize: '18px'}}>{cashRevenue} ₸</p></div>
               </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // ЭКРАН 3: ОФИЦИАНТ
  // ==========================================
  if (currentUser.role === 'waiter') {
    const myTables = (tables || []).filter(t => t.servedBy === currentUser.phone);
    const otherTables = (tables || []).filter(t => t.servedBy !== currentUser.phone);

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', fontFamily: 'Arial', paddingBottom: '50px' }}>
        {showPosModal && renderWaiterPosModal()}
        {notifyBanner}
        <header style={{ backgroundColor: '#10b981', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{margin: 0}}>{currentUser.isSenior ? '👑' : '🏃‍♂️'} {currentUser.name}</h2>
          <HeaderControls />
        </header>

        <div style={{padding: '20px', maxWidth: '600px', margin: '0 auto'}}>
          
          <h3 style={{color: '#065f46', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px'}}>🛎 Мои активные столы</h3>
          {myTables.length === 0 ? <p style={{color: '#6b7280', marginBottom: '30px'}}>У вас пока нет активных столов.</p> : (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '30px'}}>
              {myTables.map(t => (
                <div key={t.id} style={{ background: t.isCalling ? '#fef3c7' : '#fff', border: '2px solid #10b981', borderRadius: '16px', padding: '15px', textAlign: 'center', position: 'relative' }}>
                  {t.isCalling && <span style={{position: 'absolute', top: '-10px', right: '-10px', fontSize: '24px'}}>🚨</span>}
                  <h4 style={{margin: '0 0 10px 0', fontSize: '16px', color: '#111827'}}>{t.name}</h4>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button onClick={() => { setPosTableId(t.id); setShowPosModal(true); }} style={{ flex: 1, padding: '10px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+ Чек</button>
                    <button onClick={() => setTables(prev => prev.map(tab => tab.id === t.id ? {...tab, status: 'free', bookedBy: null, servedBy: null, isCalling: false, isCallingForBill: false} : tab))} style={{ padding: '10px', background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 style={{color: '#111827', marginBottom: '15px'}}>Все свободные столы:</h3>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px'}}>
            {otherTables.filter(t => t.status === 'free').map(t => (
              <div key={t.id} onClick={() => { setPosTableId(t.id); setShowPosModal(true); }} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '15px 10px', textAlign: 'center', cursor: 'pointer' }}>
                <p style={{margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '14px', color: '#111827'}}>{t.name}</p>
                <span style={{fontSize: '11px', color: '#6b7280'}}>Занять</span>
              </div>
            ))}
          </div>
          
        </div>
      </div>
    );
  }

  // ==========================================
  // ЭКРАН 4: ШЕФ-ПОВАР (Управление фото и стоп-листом)
  // ==========================================
  if (currentUser.role === 'chef') {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: 'Arial' }}>
        <header style={{ backgroundColor: '#111827', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>👨‍🍳 Шеф: {currentUser.name}</h2>
          <HeaderControls />
        </header>
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{color: '#111827'}}>Управление стоп-листом и Фото:</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
            {(menu || []).map(item => (
              <div key={item.id} style={{ backgroundColor: '#fff', padding: '15px', borderRadius: '12px', display: 'grid', gridTemplateColumns: '50px 1fr auto auto', gap: '15px', alignItems: 'center', border: item.isStop ? '2px solid #dc2626' : '1px solid #e5e7eb' }}>
                <div style={{fontSize: '30px', textAlign: 'center'}}>{item.imgUrl ? <img src={item.imgUrl} style={{width:'40px', height:'40px', borderRadius:'8px', objectFit:'cover'}} alt="" /> : item.img}</div>
                <div><p style={{ margin: 0, fontWeight: 'bold', color: item.isStop ? '#dc2626' : '#111827' }}>{item.name}</p>{item.isStop && <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#dc2626' }}>Стоп: {item.stopReason}</p>}</div>
                
                <label style={{ cursor: 'pointer', padding: '8px 12px', borderRadius: '8px', backgroundColor: '#e0f2fe', color: '#0369a1', fontWeight: 'bold', textAlign: 'center' }}>
                  📷 Фото
                  <input type="file" accept="image/*" capture="environment" style={{display: 'none'}} onChange={(e) => handlePhotoUpload(e, item.id)} />
                </label>

                <button onClick={() => toggleStopList(item.id)} style={{ padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: item.isStop ? '#d1fae5' : '#fee2e2', color: item.isStop ? '#065f46' : '#dc2626', fontWeight: 'bold', cursor: 'pointer' }}>{item.isStop ? 'Включить' : 'В стоп'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // ЭКРАН 5: ПОВАР (Цех и приготовление)
  // ==========================================
  if (currentUser.role === 'cook') {
    const myCats = STATION_MAP[currentUser.station] || [];
    const myOrders = (orders || []).filter(o => (o.status === 'new' || o.status === 'cooking' || o.status === 'cash_pending') && o.cartItems?.some(i => myCats.includes(i.category)));
    const stationNames = { 'hot': 'Горячий цех', 'cold': 'Холодный цех', 'bar': 'Бар', 'mangal': 'Мангал' };
    const myStationName = stationNames[currentUser.station] || 'Кухня';

    // Вспомогательная функция для кухонного чека (Доставка)
    const renderTextWithLinks = (text) => {
      if (!text) return null; const parts = text.split(/(https?:\/\/[^\s]+)/g);
      return parts.map((part, i) => part.match(/https?:\/\/[^\s]+/) ? <a key={i} href={part} target="_blank" rel="noreferrer" style={{color: '#3b82f6', textDecoration: 'underline', fontWeight: 'bold'}}>📍 Карта</a> : <span key={i}>{part}</span>);
    };

    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#fffbeb', fontFamily: 'Arial' }}>
        <header style={{ backgroundColor: '#f59e0b', padding: '20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>👨‍🍳 {currentUser.name} ({myStationName})</h2>
          <HeaderControls />
        </header>
        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {myOrders.length === 0 ? <p style={{marginTop: '20px', color: '#6b7280'}}>Пока нет активных чеков 🙌</p> : 
          myOrders.map(order => {
            const items = (order.cartItems || []).filter(i => myCats.includes(i.category));
            if (items.length === 0) return null;
            return (
              <div key={order.id} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', borderTop: '8px solid #3b82f6', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h4 style={{color: '#111827', margin: '0 0 10px 0'}}>Стол: {order.tableName}</h4>
                {order.deliveryAddress && <p style={{fontSize: '13px', color: '#4b5563', padding: '8px', background: '#f3f4f6', borderRadius: '8px'}}>{renderTextWithLinks(order.deliveryAddress)}</p>}
                <div style={{ backgroundColor: '#f9fafb', padding: '10px', borderRadius: '8px', margin: '10px 0', color: '#111827' }}>
                  {items.map((item, idx) => (
                    <div key={idx} style={{ padding: '5px 0', fontSize: '16px', fontWeight: 'bold', borderBottom: idx !== items.length -1 ? '1px solid #e5e7eb' : 'none' }}>
                      {item.img} {item.name} — <span style={{color: '#dc2626'}}>x{item.quantity}</span>
                    </div>
                  ))}
                </div>
                {order.status === 'new' ? (
                  <button onClick={() => changeOrderStatus(order.id, 'cooking')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Начать готовить</button>
                ) : (
                  <button onClick={() => changeOrderStatus(order.id, 'ready_for_pickup')} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>Готово / Отдать</button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Если роль неизвестна или загружается
  return <div style={{padding: '20px', fontFamily: 'monospace'}}>Загрузка интерфейса персонала...</div>;
}
