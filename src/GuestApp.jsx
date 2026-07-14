import React, { useState, useEffect } from 'react';
import { INITIAL_MENU, CATEGORIES, INITIAL_STORIES, INITIAL_TABLES, INITIAL_CUSTOMERS, INITIAL_ROLES, useLocalStorage } from './data.js';

export default function GuestApp({ currentUser, logout, lang, setLang, deferredPrompt, t }) {
  const [menu, setMenu] = useLocalStorage('amina_menu_v11', INITIAL_MENU);
  const [tables, setTables] = useLocalStorage('amina_tables_v11', INITIAL_TABLES);
  const [orders, setOrders] = useLocalStorage('amina_orders_v11', []);
  const [storiesDb, setStoriesDb] = useLocalStorage('amina_stories_v11', INITIAL_STORIES);
  const [customers, setCustomers] = useLocalStorage('amina_customers_v11', INITIAL_CUSTOMERS);
  const [roles, setRoles] = useLocalStorage('amina_roles_v11', INITIAL_ROLES);
  const [reviews, setReviews] = useLocalStorage('amina_reviews_v11', []); 

  const [selectedCategory, setSelectedCategory] = useState('all'); 
  const [activeGuestTab, setActiveGuestTab] = useState('menu'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [selectedTableGroup, setSelectedTableGroup] = useState('all'); 

  const [cart, setCart] = useState({});
  const [isPreOrderFlow, setIsPreOrderFlow] = useState(false); 
  const [preOrderTableId, setPreOrderTableId] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false); 
  const [bookingTime, setBookingTime] = useState('19:00');
  
  const [paymentStatus, setPaymentStatus] = useState('idle'); 
  const [pendingOrderId, setPendingOrderId] = useState(null); 
  
  const [orderType, setOrderType] = useState('in_hall'); 
  const [address, setAddress] = useState({ street: '', house: '', apt: '', comment: '' });

  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [activeStory, setActiveStory] = useState(null);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') { console.log('User accepted the install prompt'); }
      });
    } else {
      setShowIOSInstallGuide(true);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert(lang === 'ru' ? "Геолокация не поддерживается вашим устройством" : "Геолокация құрылғыңызда қолдау таппайды");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const link = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        setAddress(prev => ({ ...prev, street: link, comment: prev.comment || (lang === 'ru' ? 'Координаты по GPS' : 'GPS координаталары') }));
        alert(lang === 'ru' ? "📍 Местоположение успешно определено!" : "📍 Орналасқан жер сәтті анықталды!");
      },
      () => alert(lang === 'ru' ? "Не удалось получить геоданные. Разрешите доступ в настройках браузера." : "Геодеректерді алу мүмкін болмады.")
    );
  };

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
  }, []);

  useEffect(() => {
    if (pendingOrderId && (paymentStatus === 'processing' || paymentStatus === 'waiter_pending')) {
      const checkOrder = (orders || []).find(o => o.id === pendingOrderId);
      if (checkOrder) {
        if (checkOrder.status === 'new') { setPaymentStatus(checkOrder.payMethod === 'cash' ? 'cash_success' : 'success'); setPendingOrderId(null); } 
        else if (checkOrder.status === 'rejected') { setPaymentStatus('rejected'); setPendingOrderId(null); }
      }
    }
  }, [orders, pendingOrderId, paymentStatus]);

  useEffect(() => {
    const interval = setInterval(() => {
       if (currentUser?.isAnonymous || reviewOrder) return;
       const orderToReview = (orders || []).find(o => o.phone === currentUser?.phone && o.reviewUnlockTime && Date.now() >= o.reviewUnlockTime && !o.isReviewed);
       if (orderToReview) setReviewOrder(orderToReview);
    }, 30000);
    return () => clearInterval(interval);
  }, [orders, currentUser, reviewOrder]);

  const getTableIcon = (type) => type === 'cabin' ? '🚪' : type === 'tapchan' ? '🛋️' : '🪑';
  const initiateBooking = (id) => { setPreOrderTableId(id); setShowTimeModal(true); };
  const confirmBookingTime = () => { if (!bookingTime) return alert(lang === 'ru' ? "Выберите время!" : "Уақытты таңдаңыз!"); setIsPreOrderFlow(true); setOrderType('in_hall'); setShowTimeModal(false); setActiveGuestTab('menu'); alert(lang === 'ru' ? `Время: ${bookingTime} установлено!` : `Уақыт: ${bookingTime} орнатылды!`); };
  const bookTableNow = (id) => { setTables(prev => (prev || []).map(t => t.id === id ? { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: null, isCallingForBill: false, isCalling: false } : t)); setOrderType('in_hall'); };
  
  const callWaiterForAssistance = (id) => {
    setTables(prev => (prev || []).map(t => t.id === id ? { ...t, isCalling: true } : t));
    alert(lang === 'ru' ? "Официант уведомлен и скоро подойдет!" : "Даяшыға хабарланды, жақын арада келеді!");
  };
  
  const addToCart = (item) => setCart(prev => ({ ...(prev || {}), [item.id]: { ...item, quantity: ((prev || {})[item.id]?.quantity || 0) + 1 } }));
  const removeFromCart = (id) => setCart(prev => { const updated = { ...(prev || {}) }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; });

  const myCurrentTable = (tables || []).find(t => t.bookedBy === currentUser?.phone);
  const activeTable = (tables || []).find(t => t.id === preOrderTableId) || myCurrentTable;
  let activeTableName = orderType === 'delivery' ? t.delivery : (activeTable ? activeTable.name : t.takeaway);

  const cartItemsArray = Object.values(cart || {});
  const totalItemsCount = cartItemsArray.reduce((sum, item) => sum + item.quantity, 0);
  const baseSubtotal = cartItemsArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = isPreOrderFlow ? (baseSubtotal === 0 ? 1000 : Math.round(baseSubtotal / 2)) : baseSubtotal;
  const availableBonuses = customers[currentUser?.phone]?.bonuses || 0;

  const createOrderObject = (statusToSet, assignedWaiterPhone = null, assignedWaiterName = null, payMethod = 'kaspi') => {
    const text = cartItemsArray.length > 0 ? cartItemsArray.map(i => `${i.name[lang] || i.name.ru || i.name} (x${i.quantity})`).join(', ') : (lang === 'ru' ? "Бронь места" : "Орынды брондау");
    const fullAddress = orderType === 'delivery' ? `Ул/Гео: ${address.street}, д. ${address.house}, кв. ${address.apt}. Коммент: ${address.comment}` : '';
    
    // ЛОГИКА СМЕНЫ (УМНАЯ КАССА) - Смена до 6 утра считается "вчерашней"
    const now = new Date();
    const shiftDate = new Date(now);
    if (now.getHours() < 6) shiftDate.setDate(shiftDate.getDate() - 1);
    const shiftDateStr = shiftDate.toLocaleDateString('ru-RU');

    return { 
      id: `ORD-${Math.floor(Math.random() * 10000)}`, phone: currentUser.phone, tableId: activeTable?.id || orderType, tableName: activeTableName, cartItems: cartItemsArray, itemsText: text, total: totalAmount, tips: 0, isPreOrder: isPreOrderFlow, bookedTime: isPreOrderFlow ? bookingTime : null, orderType, deliveryAddress: fullAddress, 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      fullDate: shiftDateStr, 
      status: statusToSet, waiterPhone: assignedWaiterPhone, waiterName: assignedWaiterName, isReviewed: false, reviewUnlockTime: null, payMethod 
    };
  };

  const handlePayClick = () => {
    if (cartItemsArray.length === 0 && !isPreOrderFlow) return alert(lang === 'ru' ? "Выберите блюда!" : "Тағамды таңдаңыз!");
    if (orderType === 'delivery' && !address.street) return alert(lang === 'ru' ? "Укажите адрес доставки!" : "Жеткізу мекенжайын көрсетіңіз!");
    setPaymentStatus('select_method'); 
  };

  const confirmTransfer = () => {
    const newOrder = createOrderObject('transfer_pending', null, null, 'kaspi');
    setOrders(prev => [newOrder, ...(prev || [])]);
    if (isPreOrderFlow && preOrderTableId) setTables(prev => (prev || []).map(t => t.id === preOrderTableId ? { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: bookingTime } : t));
    setPendingOrderId(newOrder.id);
    setPaymentStatus('processing'); 
  };

  const confirmDirectPayment = (method) => {
    const newOrder = createOrderObject('new', null, null, method);
    setOrders(prev => [newOrder, ...(prev || [])]);
    if (isPreOrderFlow && preOrderTableId) setTables(prev => (prev || []).map(t => t.id === preOrderTableId ? { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: bookingTime } : t));
    setPaymentStatus('success');
  };

  const handleCashSelection = () => {
    if (orderType !== 'in_hall' || !activeTable) {
      return alert(lang === 'ru' ? 'Оплата наличными доступна только при заказе за столиком в заведении!' : 'Қолма-қол ақшамен төлеу тек залда отырғанда ғана мүмкін!');
    }
    setPaymentStatus('select_waiter');
  };

  const confirmCashWithWaiter = (waiterPhone, waiterName) => {
    const newOrder = createOrderObject('waiter_pending', waiterPhone, waiterName, 'cash');
    setOrders(prev => [newOrder, ...(prev || [])]);
    if (isPreOrderFlow && preOrderTableId) setTables(prev => (prev || []).map(t => t.id === preOrderTableId ? { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: bookingTime } : t));
    setPendingOrderId(newOrder.id);
    setPaymentStatus('waiter_pending');
  };

  const selectRandomWaiter = () => {
    const activeWaiters = Object.entries(roles || {}).filter(([p, data]) => data.role === 'waiter' && data.onShift);
    if (activeWaiters.length === 0) return alert(lang === 'ru' ? 'К сожалению, сейчас нет свободных официантов.' : 'Кешіріңіз, қазір бос даяшылар жоқ.');
    const randomW = activeWaiters[Math.floor(Math.random() * activeWaiters.length)];
    confirmCashWithWaiter(randomW[0], randomW[1].name);
  };

  const handleFinishAndClear = () => { setCart({}); setIsPreOrderFlow(false); setPreOrderTableId(null); setPaymentStatus('idle'); setPendingOrderId(null); setActiveGuestTab('profile'); };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert(lang === 'ru' ? 'Реквизиты скопированы!' : 'Деректемелер көшірілді!'); };

  const getWaiterRating = (phone) => {
     const wRevs = (reviews || []).filter(r => r.targetId === phone);
     if (wRevs.length === 0) return lang === 'ru' ? 'Новенький' : 'Жаңа';
     const avg = wRevs.reduce((sum, r) => sum + r.rating, 0) / wRevs.length;
     return `⭐️ ${avg.toFixed(1)} (${wRevs.length} отз.)`;
  };

  const submitReview = () => {
     if (reviewRating === 0) return alert(lang === 'ru' ? 'Выберите оценку в звездах!' : 'Жұлдызбен бағалаңыз!');
     if (reviewRating <= 3 && reviewText.trim().length === 0) return alert(lang === 'ru' ? 'Пожалуйста, напишите причину низкой оценки, чтобы мы стали лучше.' : 'Жақсаруымыз үшін төмен бағаның себебін жазыңыз.');
     
     const newReview = { id: `REV-${Date.now()}`, type: reviewOrder.waiterPhone ? 'waiter' : 'cafe', targetId: reviewOrder.waiterPhone || 'cafe', targetName: reviewOrder.waiterName || 'Кафе Амина', rating: reviewRating, text: reviewText, author: currentUser.name, date: new Date().toLocaleDateString('ru-RU') };
     setReviews(prev => [newReview, ...(prev || [])]);
     setOrders(prev => (prev || []).map(o => o.id === reviewOrder.id ? { ...o, isReviewed: true } : o));
     setReviewOrder(null); setReviewRating(0); setReviewText(''); alert(lang === 'ru' ? 'Спасибо за ваш отзыв!' : 'Пікіріңізге рахмет!');
  };

  const displayedMenu = selectedCategory === 'all' ? (menu || []) : (menu || []).filter(m => m.category === selectedCategory);
  
  const tableGroupsList = ['all', ...(Array.from(new Set((tables || []).map(t => t.group[lang] || t.group.ru || t.group))))];
  const filteredTableGroups = selectedTableGroup === 'all' ? tableGroupsList.filter(g => g !== 'all') : [selectedTableGroup];
  const availableWaitersList = Object.entries(roles || {}).filter(([p, data]) => data.role === 'waiter' && data.onShift);

  const myOrdersHistory = (orders || []).filter(o => o.phone === currentUser.phone);

  return (
    <div className="app-wrapper">
      <style dangerouslySetInnerHTML={{__html: `
        :root { --bg: #f4f5f7; --text: #111827; --gray: #6b7280; --orange: #ea580c; --green: #10b981; color-scheme: light; }
        *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { margin: 0; padding: 0; width: 100%; max-width: 100vw; overflow-x: hidden; background-color: var(--bg); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--text); }
        ::-webkit-scrollbar { display: none; }
        .app-wrapper { display: flex; flex-direction: column; width: 100%; min-height: 100vh; overflow-x: hidden; padding-bottom: 80px; position: relative; }
        
        .payment-overlay { position: fixed; inset: 0; background: rgba(17,24,39,0.7); z-index: 9999; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; backdrop-filter: blur(4px); }
        .payment-modal { background: #fff; width: 100%; max-width: 500px; border-radius: 28px 28px 0 0; padding: 30px 25px; animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box; max-height: 90vh; overflow-y: auto;}
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes spinPulse { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.1); } 100% { transform: rotate(360deg) scale(1); } }
        
        .pay-method-btn { display: flex; align-items: center; justify-content: space-between; padding: 18px; border-radius: 16px; border: 2px solid #f3f4f6; margin-bottom: 12px; cursor: pointer; transition: 0.2s; background: #fff; }
        .pay-method-btn:active { transform: scale(0.98); background: #f9fafb; border-color: #e5e7eb; }
        
        .star-btn { font-size: 35px; background: none; border: none; cursor: pointer; color: #d1d5db; transition: 0.2s; }
        .star-btn.active { color: #f59e0b; }
        
        .top-header { width: 100%; background: #fff; padding: 15px 20px; position: sticky; top: 0; z-index: 100; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 2px 10px rgba(0,0,0,0.03); }
        .logo-section { display: flex; align-items: center; gap: 12px; }
        .logo-title { margin: 0; font-size: 22px; font-weight: 900; color: var(--text); letter-spacing: 1px; }
        .hamburger-menu-trigger { display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid #e5e7eb; padding: 10px 14px; border-radius: 10px; font-weight: 800; font-size: 14px; cursor: pointer; color: var(--text); transition: 0.2s; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.02); }
        .desktop-nav { display: none; gap: 25px; }
        .desktop-nav button { background: none; border: none; font-size: 16px; font-weight: 800; cursor: pointer; color: var(--gray); transition: 0.2s; padding: 5px 0; }
        .desktop-nav button.active { color: var(--orange); border-bottom: 3px solid var(--orange); }
        .main-content { width: 100%; max-width: 1200px; margin: 0 auto; flex: 1; display: flex; flex-direction: column; position: relative; padding: 15px; box-sizing: border-box; }
        .sidebar-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: none; opacity: 0; transition: opacity 0.25s ease; }
        .sidebar-overlay.open { display: block; opacity: 1; }
        .categories-sidebar { position: fixed; left: -280px; top: 0; bottom: 0; width: 260px; background: #fff; z-index: 1001; padding: 25px 20px; transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); overflow-y: auto; overflow-x: hidden; box-shadow: 5px 0 25px rgba(0,0,0,0.1); display: flex; flex-direction: column; gap: 8px; }
        .categories-sidebar.open { transform: translateX(280px); }
        .close-sidebar-btn { display: flex; justify-content: space-between; align-items: center; background: none; border: none; font-size: 18px; font-weight: 900; color: var(--text); padding-bottom: 15px; border-bottom: 1px solid #e5e7eb; margin-bottom: 10px; cursor: pointer; width: 100%; }
        .desktop-sidebar { display: none; }
        .cat-button { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-radius: 14px; border: none; cursor: pointer; transition: 0.2s; width: 100%; text-align: left; }
        .cat-button .icon { font-size: 22px; }
        .cat-button .name { font-size: 15px; font-weight: 800; }
        .cat-button.active { background: var(--text); color: #fff; }
        .cat-button.inactive { background: #f9fafb; color: var(--gray); }
        .menu-layout { display: flex; flex-direction: column; width: 100%; }
        .content-area { flex: 1; width: 100%; }
        .stories-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 8px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; width: 100%; }
        .story-item { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; cursor: pointer; }
        .story-circle { width: 64px; height: 64px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; outline: 3px solid var(--orange); overflow: hidden; background: #e5e7eb; }
        .food-list { display: grid; grid-template-columns: 1fr; gap: 12px; width: 100%; }
        .food-card { background: #fff; padding: 12px; border-radius: 16px; display: flex; gap: 12px; align-items: center; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,0.03); box-sizing: border-box; }
        .food-pic { width: 65px; height: 65px; border-radius: 12px; background: #f9fafb; display: flex; align-items: center; justify-content: center; font-size: 35px; flex-shrink: 0; overflow: hidden; }
        .food-info { flex: 1; min-width: 0; }
        .food-name { margin: 0 0 4px 0; font-size: 14px; font-weight: 800; color: var(--text); line-height: 1.2; white-space: normal; word-wrap: break-word; }
        .food-ingr { margin: 0 0 8px 0; font-size: 11px; color: var(--gray); line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .food-price { background: #fff7ed; color: var(--orange); padding: 4px 8px; border-radius: 6px; font-weight: 900; font-size: 13px; display: inline-block; }
        .food-add { width: 40px; height: 40px; border-radius: 12px; background: var(--text); color: #fff; border: none; font-size: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .tables-filter-bar { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; width: 100%; }
        .filter-btn { padding: 10px 18px; border-radius: 12px; border: 1px solid #e5e7eb; background: #fff; color: var(--gray); font-weight: 800; font-size: 13px; white-space: nowrap; cursor: pointer; transition: 0.2s; }
        .filter-btn.active { background: var(--text); color: #fff; border-color: var(--text); }
        .tables-wrapper { width: 100%; box-sizing: border-box; }
        .tables-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; }
        .mobile-nav { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-around; padding: 10px 0 20px 0; z-index: 100; box-shadow: 0 -4px 20px rgba(0,0,0,0.05); width: 100%; }
        .nav-item { background: none; border: none; display: flex; flex-direction: column; align-items: center; gap: 4px; font-weight: bold; font-size: 11px; cursor: pointer; color: var(--gray); }
        .nav-item.active { color: var(--orange); }
        .nav-icon { font-size: 24px; filter: grayscale(1); }
        .nav-item.active .nav-icon { filter: none; }
        .page-container { width: 100%; max-width: 600px; margin: 0 auto; }

        @media (min-width: 850px) {
          .app-wrapper { padding-bottom: 0; }
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex; }
          .hamburger-menu-trigger { display: none !important; }
          .sidebar-overlay { display: none !important; }
          .main-content { padding: 30px 20px; }
          .menu-layout { flex-direction: row; gap: 30px; }
          .desktop-sidebar { display: flex; flex-direction: column; gap: 10px; width: 240px; flex-shrink: 0; }
          .categories-sidebar { display: none; } 
          .food-list { grid-template-columns: repeat(2, 1fr); gap: 20px; }
          .food-card { padding: 16px; gap: 16px; border-radius: 20px; }
          .food-pic { width: 80px; height: 80px; font-size: 40px; border-radius: 14px; }
          .food-name { font-size: 16px; margin-bottom: 6px; }
          .food-ingr { font-size: 13px; margin-bottom: 8px; }
          .tables-grid { grid-template-columns: repeat(4, 1fr); gap: 15px; }
          .payment-overlay { align-items: center; }
          .payment-modal { border-radius: 24px; }
        }
        @media (min-width: 1200px) { .tables-grid { grid-template-columns: repeat(5, 1fr); } }
      `}}/>

      {/* --- ПОЛНОЭКРАННАЯ СТОРИС --- */}
      {activeStory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} onClick={() => setActiveStory(null)}>
           <button onClick={() => setActiveStory(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', fontSize: '20px', cursor: 'pointer' }}>✕</button>
           <img src={activeStory.imgUrl} style={{ width: '100%', maxHeight: '80vh', objectFit: 'contain' }} alt="Story" />
           <h2 style={{ color: '#fff', marginTop: '20px', textAlign: 'center' }}>{activeStory.title[lang] || activeStory.title.ru || activeStory.title}</h2>
        </div>
      )}

      {/* --- ИНСТРУКЦИЯ ПО УСТАНОВКЕ ДЛЯ iPHONE/SAFARI --- */}
      {showIOSInstallGuide && (
         <div className="payment-overlay" onClick={() => setShowIOSInstallGuide(false)}>
           <div className="payment-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', padding: '40px 20px'}}>
              <h2 style={{margin: '0 0 15px 0', fontSize: '22px', color: '#111827'}}>{lang === 'ru' ? 'Как установить приложение?' : 'Қосымшаны қалай орнатуға болады?'}</h2>
              <p style={{color: '#6b7280', marginBottom: '25px', lineHeight: '1.5', fontSize: '15px'}}>
                 {lang === 'ru' ? 'Чтобы добавить Кафе Amina на главный экран телефона, нажмите внизу экрана на кнопку ' : 'Amina кафесін телефонның бас экранына қосу үшін, экранның төменгі жағындағы '} 
                 <b style={{color: '#3b82f6'}}>«Поделиться»</b> 
                 <span style={{fontSize: '20px', margin: '0 5px'}}>⎋</span> 
                 {lang === 'ru' ? 'и выберите пункт ' : 'түймесін басып, '}
                 <b style={{color: '#111827'}}>«На экран Домой» ➕</b>.
              </p>
              <button onClick={() => setShowIOSInstallGuide(false)} style={{width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>Понятно</button>
           </div>
         </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО ОТЗЫВА --- */}
      {reviewOrder && (
        <div className="payment-overlay">
          <div className="payment-modal" style={{textAlign: 'center'}}>
             <h2 style={{margin: '0 0 10px 0', color: '#111827'}}>{t.reviewPrompt}</h2>
             <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>{lang === 'ru' ? 'Оцените работу официанта' : 'Даяшы жұмысын бағалаңыз'} <b style={{color: '#111827'}}>{reviewOrder.waiterName || 'Кафе'}</b></p>
             
             <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px'}}>
               {[1,2,3,4,5].map(star => (
                 <button key={star} onClick={() => setReviewRating(star)} className={`star-btn ${reviewRating >= star ? 'active' : ''}`}>★</button>
               ))}
             </div>

             {reviewRating > 0 && reviewRating <= 3 && (
               <div style={{marginBottom: '20px', textAlign: 'left'}}>
                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#dc2626', fontWeight: 'bold'}}>* {lang === 'ru' ? 'Обязательно укажите причину низкой оценки' : 'Төмен бағаның себебін жазыңыз'}</p>
                 <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #dc2626', resize: 'none', background: '#fef2f2', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}
             
             {reviewRating > 3 && (
               <div style={{marginBottom: '20px'}}>
                 <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'none', background: '#f9fafb', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}

             <button onClick={submitReview} style={{width: '100%', padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>{t.sendReview}</button>
             <button onClick={() => {setOrders(prev => prev.map(o => o.id === reviewOrder.id ? { ...o, isReviewed: true } : o)); setReviewOrder(null);}} style={{background: 'none', border: 'none', color: '#6b7280', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline'}}>{t.later}</button>
          </div>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО ОПЛАТЫ --- */}
      {paymentStatus !== 'idle' && (
        <div className="payment-overlay">
          <div className="payment-modal">
            
            {/* ЭКРАН 1: ВЫБОР СПОСОБА */}
            {paymentStatus === 'select_method' && (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                  <h2 style={{margin: 0, fontSize: '22px', fontWeight: '900', color: '#111827'}}>{t.payMethod}</h2>
                  <button onClick={() => setPaymentStatus('idle')} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563'}}>✕</button>
                </div>

                <div className="pay-method-btn" onClick={() => confirmDirectPayment('apple_pay')} style={{background: '#111827', color: '#fff', borderColor: '#111827'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{fontSize: '24px'}}></div>
                    <div><p style={{margin: '0', fontWeight: '900', fontSize: '16px', color: '#fff'}}>{t.payApple}</p></div>
                  </div>
                </div>
                
                <div className="pay-method-btn" onClick={() => confirmDirectPayment('card')}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{background: '#eff6ff', padding: '10px', borderRadius: '12px', fontSize: '24px'}}>💳</div>
                    <div><p style={{margin: '0', fontWeight: '900', fontSize: '16px', color: '#111827'}}>{t.payCard}</p></div>
                  </div>
                </div>

                <div className="pay-method-btn" onClick={() => setPaymentStatus('kaspi_card')}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{background: '#fee2e2', padding: '10px', borderRadius: '12px', fontSize: '24px'}}>📱</div>
                    <div><p style={{margin: '0', fontWeight: '900', fontSize: '16px', color: '#111827'}}>{t.payKaspi}</p></div>
                  </div>
                </div>

                <div className="pay-method-btn" onClick={handleCashSelection}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{background: '#ecfdf5', padding: '10px', borderRadius: '12px', fontSize: '24px'}}>💵</div>
                    <div><p style={{margin: '0', fontWeight: '900', fontSize: '16px', color: '#111827'}}>{t.payCash}</p></div>
                  </div>
                </div>
              </>
            )}

            {/* ЭКРАН 1.5: ВЫБОР ОФИЦИАНТА */}
            {paymentStatus === 'select_waiter' && (
              <>
                 <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px'}}>
                  <button onClick={() => setPaymentStatus('select_method')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>←</button>
                  <h2 style={{margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827'}}>{lang === 'ru' ? 'Кто вас обслужит?' : 'Кім қызмет көрсетеді?'}</h2>
                </div>
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>{lang === 'ru' ? 'Выберите официанта для оплаты наличными.' : 'Қолма-қол төлеу үшін даяшыны таңдаңыз.'}</p>

                <button onClick={selectRandomWaiter} style={{width: '100%', padding: '16px', borderRadius: '14px', border: '2px dashed #111827', background: '#f9fafb', color: '#111827', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginBottom: '15px'}}>🎲 {lang === 'ru' ? 'Мне лень, выберите случайно' : 'Кездейсоқ таңдау'}</button>

                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {availableWaitersList.length === 0 ? <p style={{textAlign: 'center', color: '#dc2626'}}>{lang === 'ru' ? 'Нет свободных официантов.' : 'Бос даяшылар жоқ.'}</p> : 
                   availableWaitersList.map(([p, data]) => (
                     <div key={p} onClick={() => confirmCashWithWaiter(p, data.name)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer'}}>
                        <div>
                           <p style={{margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px', color: '#111827'}}>{data.name}</p>
                           <p style={{margin: 0, fontSize: '13px', color: '#f59e0b', fontWeight: 'bold'}}>{getWaiterRating(p)}</p>
                        </div>
                        <span style={{color: '#10b981', fontWeight: 'bold'}}>➔</span>
                     </div>
                   ))
                  }
                </div>
              </>
            )}

            {/* ЭКРАН 2: РЕКВИЗИТЫ ПЕРЕВОДА */}
            {paymentStatus === 'kaspi_card' && (
              <>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px'}}>
                  <button onClick={() => setPaymentStatus('select_method')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>←</button>
                  <h2 style={{margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827'}}>{lang === 'ru' ? 'Безопасный перевод' : 'Қауіпсіз аударым'}</h2>
                </div>
                
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4'}}>{lang === 'ru' ? 'Скопируйте номер карты и переведите точную сумму.' : 'Карта нөмірін көшіріп, дәл соманы аударыңыз.'}</p>
                
                <div style={{background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', marginBottom: '25px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>{lang === 'ru' ? 'К оплате' : 'Төлемге'}</p>
                  <p style={{margin: '0 0 20px 0', fontSize: '36px', fontWeight: '900', color: '#ea580c'}}>{totalAmount} ₸</p>
                  
                  <div style={{textAlign: 'left'}}>
                    <p style={{margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold'}}>Номер карты (Visa / Mastercard)</p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '14px', border: '2px dashed #d1d5db'}}>
                      <span style={{fontSize: '20px', fontWeight: '900', letterSpacing: '1px', color: '#111827'}}>4400 4302 5493 5945</span>
                      <button onClick={() => copyToClipboard('4400430254935945')} style={{background: '#111827', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff', fontSize: '13px'}}>{lang === 'ru' ? 'Копия' : 'Көшіру'}</button>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px'}}><span style={{color: '#10b981', fontSize: '18px'}}>✓</span><span style={{fontSize: '14px', color: '#111827', fontWeight: 'bold'}}>{lang === 'ru' ? 'Получатель: Эльвира А.' : 'Алушы: Эльвира А.'}</span></div>
                  </div>
                </div>
                <button onClick={confirmTransfer} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'}}>{lang === 'ru' ? 'Я перевел деньги' : 'Ақша аудардым'}</button>
              </>
            )}

            {/* ЭКРАН 3: ЗАГРУЗКА */}
            {paymentStatus === 'processing' && (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{fontSize: '60px', animation: 'spinPulse 2s infinite linear'}}>⏳</div>
                <h2 style={{marginTop: '20px', color: '#111827'}}>{t.payWait}</h2>
              </div>
            )}

            {/* ЭКРАН 3.5: ОЖИДАНИЕ ОФИЦИАНТА */}
            {paymentStatus === 'waiter_pending' && (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{fontSize: '60px', animation: 'spinPulse 2s infinite linear'}}>⏳</div>
                <h2 style={{marginTop: '20px', color: '#111827'}}>{lang === 'ru' ? 'Ожидаем официанта...' : 'Даяшыны күтудеміз...'}</h2>
              </div>
            )}

            {/* ЭКРАН 4: ОТКЛОНЕН */}
            {paymentStatus === 'rejected' && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '70px', marginBottom: '15px'}}>❌</div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '26px', color: '#dc2626'}}>{t.payReject}</h2>
                <button onClick={() => setPaymentStatus('kaspi_card')} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'}}>ОК</button>
              </div>
            )}

            {/* ЭКРАН 5/6: УСПЕХ */}
            {(paymentStatus === 'success' || paymentStatus === 'cash_success') && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '70px', color: '#10b981', marginBottom: '15px'}}>✅</div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '26px', color: '#111827'}}>{t.paySuccess}</h2>
                <button onClick={handleFinishAndClear} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'}}>OK</button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- ПЛАВАЮЩАЯ КОРЗИНА --- */}
      {activeGuestTab !== 'cart' && totalItemsCount > 0 && (
        <div style={{position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', zIndex: 99}}>
           <button onClick={() => setActiveGuestTab('cart')} style={{width: '100%', padding: '16px 20px', background: '#111827', color: '#fff', borderRadius: '18px', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(17,24,39,0.3)'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}><span style={{background: '#ea580c', padding: '4px 10px', borderRadius: '10px', color: '#fff'}}>{totalItemsCount}</span> {t.inCart}</span>
              <span>{baseSubtotal} ₸ ➔</span>
           </button>
        </div>
      )}

      {/* ШТОРКА ТЕЛЕФОНА */}
      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`categories-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-sidebar-btn" onClick={() => setIsMenuOpen(false)}><span>📂 {t.cats}</span> <span>✕</span></button>
        {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setIsMenuOpen(false); }} className={`cat-button ${selectedCategory === cat.id ? 'active' : 'inactive'}`}><span className="icon">{cat.icon}</span><span className="name">{cat.name[lang] || cat.name.ru || cat.name}</span></button>))}
      </div>

      <header className="top-header">
        <div className="logo-section"><h1 className="logo-title">АМИНА<span style={{ color: '#ea580c' }}>.</span></h1>
          <div className="desktop-nav">
            <button className={activeGuestTab === 'menu' ? 'active' : ''} onClick={() => setActiveGuestTab('menu')}>{t.menu}</button>
            <button className={activeGuestTab === 'table' ? 'active' : ''} onClick={() => setActiveGuestTab('table')}>{t.halls}</button>
            <button className={activeGuestTab === 'cart' ? 'active' : ''} onClick={() => setActiveGuestTab('cart')}>{t.cart} {totalItemsCount > 0 && <span style={{background: '#ea580c', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', marginLeft: '5px'}}>{totalItemsCount}</span>}</button>
          </div>
        </div>
        
        <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
          <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 10px', borderRadius: '10px', color: '#111827', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            {lang === 'ru' ? 'KZ' : 'RU'}
          </button>
          <button onClick={() => setActiveGuestTab('profile')} style={{ background: '#d1fae5', border: 'none', padding: '8px 15px', borderRadius: '12px', color: '#065f46', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            👤 {currentUser.isAnonymous ? t.login : currentUser.name}
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeGuestTab === 'menu' && (
          <div className="menu-layout">
            <div className="desktop-sidebar">
              <h3 style={{margin: '0 0 10px 0', fontSize: '16px', color: 'var(--text)'}}>{t.cats}</h3>
              {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`cat-button ${selectedCategory === cat.id ? 'active' : 'inactive'}`}><span className="icon">{cat.icon}</span><span className="name">{cat.name[lang] || cat.name.ru || cat.name}</span></button>))}
            </div>
            <div className="content-area">
              <button className="hamburger-menu-trigger" onClick={() => setIsMenuOpen(true)}><span>☰</span> {t.cats}</button>
              
              {/* СТОРИСЫ */}
              <div className="stories-row">
                {(storiesDb || []).filter(s => s.isActive).map(story => (
                  <div key={story.id} className="story-item" onClick={() => setActiveStory(story)}>
                    <div className="story-circle"><img src={story.imgUrl} style={{width:'100%', height:'100%', objectFit:'cover'}} alt=""/></div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827' }}>{story.title[lang] || story.title.ru || story.title}</span>
                  </div>
                ))}
              </div>
              
              <div className="food-list">
                {displayedMenu.map(item => (
                  <div key={item.id} className="food-card" style={{ opacity: item.isStop ? 0.6 : 1 }}>
                    <div className="food-pic">{item.imgUrl ? <img src={item.imgUrl} alt="" style={{width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover'}}/> : item.img}</div>
                    <div className="food-info">
                      <h3 className="food-name" style={{color: '#111827'}}>{item.name[lang] || item.name.ru || item.name}</h3>
                      <p className="food-ingr">{item.ingredients[lang] || item.ingredients.ru || item.ingredients}</p>
                      {item.isStop ? <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>Стоп</span> : <span className="food-price">{item.price} ₸</span>}
                    </div>
                    {cart[item.id] ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f3f4f6', borderRadius: '12px', padding: '4px', flexShrink: 0 }}>
                        <button onClick={() => removeFromCart(item.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#fff', color: '#111827', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>-</button>
                        <span style={{ fontWeight: '900', fontSize: '14px', minWidth: '16px', textAlign: 'center', color: '#111827' }}>{cart[item.id].quantity}</span>
                        <button onClick={() => addToCart(item)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#111827', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>+</button>
                      </div>
                    ) : (
                      <button disabled={item.isStop} onClick={() => addToCart(item)} className="food-add" style={{ backgroundColor: item.isStop ? '#d1d5db' : '#111827' }}>+</button>
                    )}
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

        {activeGuestTab === 'table' && (
          <div className="tables-wrapper">
            <div className="tables-filter-bar">{tableGroupsList.map(group => (<button key={group} onClick={() => setSelectedTableGroup(group)} className={`filter-btn ${selectedTableGroup === group ? 'active' : ''}`}>{group === 'all' ? t.allHalls : group}</button>))}</div>
            {filteredTableGroups.map(groupName => {
              const groupTables = (tables || []).filter(tab => (tab.group[lang] || tab.group.ru || tab.group) === groupName);
              if (groupTables.length === 0) return null;
              return (
                <div key={groupName} style={{ marginBottom: '25px', background: '#fff', padding: '15px', borderRadius: '20px', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '18px', color: '#111827', margin: "0 0 15px 0" }}>📍 {groupName}</h4>
                  <div className="tables-grid">
                    {groupTables.map(table => (
                      <div key={table.id} style={{ padding: '15px 10px', borderRadius: '14px', border: table.bookedBy === currentUser?.phone ? '2px solid #10b981' : '1px solid #e5e7eb', backgroundColor: table.status === 'free' ? '#f8fafc' : '#fff', textAlign: 'center', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '30px', marginBottom: '8px' }}>{table.imgUrl ? <img src={table.imgUrl} alt={table.name} style={{width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover'}}/> : getTableIcon(table.type)}</div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#111827', fontWeight: '800', lineHeight: '1.2' }}>{table.name}</h3>
                        
                        {table.bookedBy === currentUser?.phone && !currentUser.isAnonymous ? (
                          <div>
                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block', marginBottom: '8px' }}>{t.yourTable}</span>
                            <button onClick={() => callWaiterForAssistance(table.id)} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: table.isCalling ? '#f59e0b' : '#111827', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '12px' }}>{table.isCalling ? '...' : t.waiterCall}</button>
                          </div>
                        ) : table.status === 'free' && !myCurrentTable ? (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                            <button onClick={() => { if(currentUser.isAnonymous) return logout(); bookTableNow(table.id); }} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{t.sit}</button>
                            <button onClick={() => { if(currentUser.isAnonymous) return logout(); initiateBooking(table.id); }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>{t.book}</button>
                          </div>
                        ) : (
                          <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px' }}><span style={{ color: '#dc2626', fontWeight: '900', fontSize: '12px', display: 'block' }}>{t.occupied}</span></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeGuestTab === 'cart' && (
          <div className="page-container">
            <h2 style={{marginTop: 0, marginBottom: '20px', color: '#111827'}}>{t.cart}</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', backgroundColor: '#e5e7eb', padding: '5px', borderRadius: '12px' }}>
              <button onClick={() => setOrderType('in_hall')} style={{ flex: 1, padding: '10px 5px', borderRadius: '8px', border: 'none', backgroundColor: orderType === 'in_hall' ? '#111827' : 'transparent', color: orderType === 'in_hall' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>{t.inHall}</button>
              <button onClick={() => setOrderType('takeaway')} style={{ flex: 1, padding: '10px 5px', borderRadius: '8px', border: 'none', backgroundColor: orderType === 'takeaway' ? '#111827' : 'transparent', color: orderType === 'takeaway' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>{t.takeaway}</button>
              <button onClick={() => setOrderType('delivery')} style={{ flex: 1, padding: '10px 5px', borderRadius: '8px', border: 'none', backgroundColor: orderType === 'delivery' ? '#111827' : 'transparent', color: orderType === 'delivery' ? '#fff' : '#4b5563', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '13px' }}>{t.delivery}</button>
            </div>
            {orderType === 'delivery' && (
              <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '20px', marginBottom: '20px', border: '2px solid #ea580c', boxSizing: 'border-box' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
                   <h3 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>📍 {t.addressPrompt}</h3>
                   <button onClick={handleGetLocation} style={{background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'}}>🗺️ GPS</button>
                </div>
                <input type="text" placeholder={t.mapLink} value={address.street} onChange={e=>setAddress({...address, street: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', marginBottom: '10px', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input type="text" placeholder={t.house} value={address.house} onChange={e=>setAddress({...address, house: e.target.value})} style={{ flex: 1, minWidth: '0', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/><input type="text" placeholder={t.apt} value={address.apt} onChange={e=>setAddress({...address, apt: e.target.value})} style={{ flex: 1, minWidth: '0', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/></div>
                <input type="text" placeholder={t.comment} value={address.comment} onChange={e=>setAddress({...address, comment: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/>
              </div>
            )}
            <div style={{backgroundColor: '#fff', borderRadius: '20px', padding: '15px', boxSizing: 'border-box'}}>
              {cartItemsArray.length === 0 ? <p style={{textAlign: 'center', color: '#6b7280'}}>{t.emptyCart}</p> : cartItemsArray.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{flex: 1, minWidth: 0}}><p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name[lang] || item.name.ru || item.name}</p><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{item.price} ₸</p></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><button onClick={() => removeFromCart(item.id)} style={{ width: '32px', height: '32px', background: '#f3f4f6', color: '#111827', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>-</button><span style={{color: '#111827', fontWeight: 'bold'}}>{item.quantity}</span><button onClick={() => addToCart(item)} style={{ width: '32px', height: '32px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+</button></div>
                </div>
              ))}
              {cartItemsArray.length > 0 && <button onClick={() => { if(currentUser.isAnonymous) return logout(); handlePayClick(); }} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#ea580c', color: '#fff', fontWeight: '900', fontSize: '16px', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(234,88,12,0.3)' }}>{t.pay} ({totalAmount} ₸)</button>}
            </div>
          </div>
        )}

        {/* ПРОФИЛЬ */}
        {activeGuestTab === 'profile' && (
          <div className="page-container">
            {currentUser.isAnonymous ? (
              <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎁</div>
                <h2 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '22px' }}>{t.login}</h2>
                <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px', lineHeight: '1.4' }}>{t.noAuthMsg}</p>
                <button onClick={logout} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{t.login} / {t.register}</button>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '20px', color: '#fff', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#fff' }}>{currentUser.name}</h2>
                  <p style={{ color: '#10b981', fontSize: '24px', fontWeight: '900', margin: 0 }}>{t.cashback}: {availableBonuses} ₸</p>
                </div>

                <button onClick={handleInstallClick} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   📱 {t.installApp}
                </button>

                <h3 style={{color: '#111827', margin: '0 0 15px 0'}}>{t.orderHistory}:</h3>
                {myOrdersHistory.length === 0 ? <p style={{color: '#6b7280'}}>{t.noOrders}</p> : 
                  myOrdersHistory.map(o => (
                    <div key={o.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '16px', padding: '15px', marginBottom: '15px' }}>
                       <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                         <span style={{fontWeight: '900', color: '#111827'}}>{o.tableName}</span>
                         <span style={{fontWeight: '900', color: '#10b981', fontSize: '16px'}}>{o.total} ₸</span>
                       </div>
                       <p style={{margin: '0 0 10px 0', fontSize: '12px', fontWeight: 'bold', color: o.status === 'rejected' ? '#dc2626' : o.status === 'transfer_pending' ? '#f59e0b' : '#10b981'}}>
                         {o.status === 'rejected' ? (lang === 'ru' ? 'Оплата отменена' : 'Төлемнен бас тартылды') : 
                          o.status === 'transfer_pending' ? (lang === 'ru' ? 'Ожидание проверки' : 'Тексеру күтілуде') : 
                          (lang === 'ru' ? `Оплачено (${o.payMethod === 'kaspi' ? 'Kaspi' : o.payMethod === 'apple_pay' ? 'Apple Pay' : o.payMethod === 'card' ? 'Карта' : 'Наличные'})` : `Төленді (${o.payMethod === 'kaspi' ? 'Kaspi' : o.payMethod === 'apple_pay' ? 'Apple Pay' : o.payMethod === 'card' ? 'Карта' : 'Қолма-қол'})`)}
                       </p>
                       <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>{o.itemsText}</p>
                       <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px'}}>
                          <span>{o.date}</span>
                       </div>
                    </div>
                  ))
                }

                <button onClick={logout} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', background: '#fff', color: '#ef4444', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>{t.logout}</button>
              </>
            )}
          </div>
        )}
      </main>

      <nav className="mobile-nav">
        <button className={`nav-item ${activeGuestTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveGuestTab('menu')}><span className="nav-icon">🍔</span> {t.menu}</button>
        <button className={`nav-item ${activeGuestTab === 'table' ? 'active' : ''}`} onClick={() => setActiveGuestTab('table')}><span className="nav-icon">🪑</span> {t.halls}</button>
        <button className={`nav-item ${activeGuestTab === 'cart' ? 'active' : ''}`} onClick={() => setActiveGuestTab('cart')}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <span className="nav-icon">🛒</span>
            {totalItemsCount > 0 && (
              <span style={{ position: 'absolute', top: '-8px', right: '-12px', background: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 5px', minWidth: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '900', border: '2px solid #fff' }}>
                {totalItemsCount}
              </span>
            )}
          </div>
          {t.cart}
        </button>
        <button className={`nav-item ${activeGuestTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveGuestTab('profile')}><span className="nav-icon">👤</span> {t.profile}</button>
      </nav>
    </div>
  );
}
