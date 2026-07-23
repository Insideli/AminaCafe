// GuestApp.js
import React, { useState, useEffect } from 'react';
import { INITIAL_MENU, CATEGORIES, STORIES, INITIAL_TABLES, INITIAL_CUSTOMERS, INITIAL_ROLES, INITIAL_SUPPORT, useLocalStorage } from './data.js';

export default function GuestApp({ currentUser, logout, lang, setLang, deferredPrompt }) {
  const [menu, setMenu] = useLocalStorage('amina_menu_v12', INITIAL_MENU);
  const [tables, setTables] = useLocalStorage('amina_tables_v12', INITIAL_TABLES);
  const [orders, setOrders] = useLocalStorage('amina_orders_v12', []);
  const [customers, setCustomers] = useLocalStorage('amina_customers_v12', INITIAL_CUSTOMERS);
  const [roles, setRoles] = useLocalStorage('amina_roles_v12', INITIAL_ROLES);
  const [reviews, setReviews] = useLocalStorage('amina_reviews_v12', []); 
  
  const [supportChat, setSupportChat] = useLocalStorage('amina_support_v12', INITIAL_SUPPORT);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportText, setSupportText] = useState('');

  const [showInfoModal, setShowInfoModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('all'); 
  const [activeGuestTab, setActiveGuestTab] = useState('menu'); 
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [selectedTableGroup, setSelectedTableGroup] = useState('all'); 

  const [cart, setCart] = useState({});
  const [isPreOrderFlow, setIsPreOrderFlow] = useState(false); 
  const [preOrderTableId, setPreOrderTableId] = useState(null);
  const [showTimeModal, setShowTimeModal] = useState(false); 
  const [bookingTime, setBookingTime] = useState('19:00');
  
  const [isChangingTable, setIsChangingTable] = useState(false);
  const [changingFromTableId, setChangingFromTableId] = useState(null);
  const [waiterCallTableId, setWaiterCallTableId] = useState(null);
  const [isArrivalCall, setIsArrivalCall] = useState(false);

  const [paymentStatus, setPaymentStatus] = useState('idle'); 
  const [pendingOrderId, setPendingOrderId] = useState(null); 
  
  const [orderType, setOrderType] = useState('in_hall'); 
  const [address, setAddress] = useState({ street: '', house: '', apt: '', comment: '' });

  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Новые состояния для отзывов из профиля
  const [showReviewFromProfile, setShowReviewFromProfile] = useState(false);
  const [profileReviewRating, setProfileReviewRating] = useState(0);
  const [profileReviewText, setProfileReviewText] = useState('');

  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  const t = {
    menu: lang === 'ru' ? 'Меню' : 'Мәзір',
    halls: lang === 'ru' ? 'Залы' : 'Залдар',
    cart: lang === 'ru' ? 'Корзина' : 'Себет',
    profile: lang === 'ru' ? 'Профиль' : 'Профиль',
    inCart: lang === 'ru' ? 'В корзине' : 'Себетте',
    pay: lang === 'ru' ? 'Оплатить' : 'Төлеу',
    inHall: lang === 'ru' ? 'В зале' : 'Залда',
    takeaway: lang === 'ru' ? 'Навынос' : 'Өзімен алып кету',
    delivery: lang === 'ru' ? 'Доставка' : 'Жеткізу',
    cats: lang === 'ru' ? 'Категории' : 'Санаттар',
    allHalls: lang === 'ru' ? 'Все залы' : 'Барлық залдар',
    emptyCart: lang === 'ru' ? 'Корзина пуста' : 'Себет бос',
    orderHistory: lang === 'ru' ? 'История заказов' : 'Тапсырыстар тарихы',
    noOrders: lang === 'ru' ? 'У вас пока нет заказов.' : 'Сізде әзірге тапсырыстар жоқ.'
  };

  // ================================================================
  // 🔥 ИНТЕГРАЦИЯ PALOMA POS (РАСКОММЕНТИРОВАНО)
  // ================================================================
  const sendToPaloma = async (orderData) => {
    console.log("Заказ успешно отправлен в Paloma365:", orderData);
    try {
      // 👇 КОГДА ПОЛУЧИШЬ КЛЮЧ, ЗАМЕНИ ЭТУ СТРОКУ НА:
      // 'Bearer ТВОЙ_API_КЛЮЧ_PALOMA'
      await fetch('https://api.paloma365.com/v1/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'bd83f267a42bcdcf05e1e9de4cfcc65ccafeamina9675' 
        },
        body: JSON.stringify(orderData)
      });
      console.log('Печать на кухне запущена!');
    } catch (e) {
      console.error('Ошибка Paloma365:', e);
    }
  };

  // АВТО-ОТКРЫТИЕ ИНСТРУКЦИИ ПРИ ПЕРВОМ ВХОДЕ
  useEffect(() => {
    if (!currentUser.isAnonymous && currentUser.phone) {
      const hasSeen = localStorage.getItem(`onboarding_seen_${currentUser.phone}`);
      if (!hasSeen) {
        setShowInfoModal(true);
        localStorage.setItem(`onboarding_seen_${currentUser.phone}`, 'true');
      }
    }
  }, [currentUser]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {});
    } else {
      setShowIOSInstallGuide(true);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Геолокация не поддерживается вашим устройством");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const link = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
        setAddress(prev => ({ ...prev, street: link, comment: prev.comment || 'Координаты по GPS' }));
        alert("📍 Местоположение успешно определено!");
      },
      () => alert("Не удалось получить геоданные. Разрешите доступ в настройках браузера.")
    );
  };

  const isAnyModalOpen = paymentStatus !== 'idle' || showTimeModal || waiterCallTableId !== null || reviewOrder !== null || showIOSInstallGuide || showSupportModal || showInfoModal || showReviewFromProfile;

  useEffect(() => {
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isAnyModalOpen]);

  useEffect(() => {
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) { meta = document.createElement('meta'); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.content = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0";
  }, []);

  // ================================================================
  // 🔥 ИСПРАВЛЕННАЯ ЛОГИКА — Ошибка брони не зависает, ловит удаление
  // ================================================================
  useEffect(() => {
    if (pendingOrderId && paymentStatus === 'processing') {
      const checkOrder = (orders || []).find(o => o.id === pendingOrderId);
      
      if (checkOrder) {
        // ✅ Кассир подтвердил — статус 'new'
        if (checkOrder.status === 'new') { 
          sendToPaloma(checkOrder);
          if (checkOrder.orderType === 'booking_deposit') {
             setTables(prev => (prev || []).map(t => t.id === checkOrder.tableId ? { ...t, bookedBy: currentUser.phone, bookedTime: checkOrder.bookedTime, status: 'free' } : t));
             setPaymentStatus('booking_success');
          } else {
             setPaymentStatus('success'); 
          }
          setPendingOrderId(null); 
        } 
        // ✅ Кассир отклонил — статус 'rejected' (не сбрасываем pendingOrderId!)
        else if (checkOrder.status === 'rejected' || checkOrder.status === 'declined' || checkOrder.status === 'cancelled') { 
          setPaymentStatus('rejected'); 
          // ❗ НЕ СБРАСЫВАЕМ pendingOrderId — оставляем для повторной попытки!
        }
      } else {
        // ❌ Если заказ на бронь был УДАЛЕН кассиром из списка
        setPaymentStatus('rejected');
        // ❗ Тоже не сбрасываем
      }
    }
  }, [orders, pendingOrderId, paymentStatus, currentUser.phone]);

  useEffect(() => {
    const interval = setInterval(() => {
       if (currentUser?.isAnonymous || reviewOrder) return;
       const orderToReview = (orders || []).find(o => o.phone === currentUser?.phone && o.reviewUnlockTime && Date.now() >= o.reviewUnlockTime && !o.isReviewed);
       if (orderToReview) setReviewOrder(orderToReview);
    }, 30000);
    return () => clearInterval(interval);
  }, [orders, currentUser, reviewOrder]);

  const getTableIcon = (type) => type === 'cabin' ? '🚪' : type === 'tapchan' ? '🛋️' : '🪑';
  
  const checkIsBlocked = (timeStr) => {
    if (!timeStr) return false;
    const now = new Date();
    const [h, m] = timeStr.split(':').map(Number);
    const bDate = new Date();
    bDate.setHours(h, m, 0, 0);
    const diffMs = bDate.getTime() - now.getTime();
    return diffMs > 0 && diffMs <= 7200000; 
  };

  const getEvictionTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(); d.setHours(h, m - 30, 0, 0);
    return d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
  };

  const initiateBooking = (id) => { setPreOrderTableId(id); setShowTimeModal(true); };
  
  const confirmBookingTime = () => { 
    if (!bookingTime) return alert("Выберите время!"); 
    setPaymentStatus('kaspi_card_booking');
    setShowTimeModal(false); 
  };

  // ================================================================
  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ БРОНИ
  // ================================================================
  const confirmBookingTransfer = () => {
    // Если есть pendingOrderId и он в статусе rejected — обновляем существующий заказ
    if (pendingOrderId && paymentStatus === 'rejected') {
      const existingOrder = (orders || []).find(o => o.id === pendingOrderId);
      if (existingOrder && existingOrder.orderType === 'booking_deposit') {
        setOrders(prev => (prev || []).map(o => 
          o.id === pendingOrderId ? { ...o, status: 'transfer_pending' } : o
        ));
        setPaymentStatus('processing');
        // Кассиру снова придет уведомление
        return;
      }
    }

    // Создаем новый заказ на бронь
    const newOrder = {
       id: `BKG-${Math.floor(Math.random() * 10000)}`,
       phone: currentUser.phone, tableId: preOrderTableId, tableName: 'Залог за стол',
       cartItems: [], itemsText: `Залог за бронь на ${bookingTime}`,
       total: 1000, orderType: 'booking_deposit',
       date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
       status: 'transfer_pending', payMethod: 'kaspi', bookedTime: bookingTime
    };
    setOrders(prev => [newOrder, ...(prev || [])]);
    setPendingOrderId(newOrder.id);
    setPaymentStatus('processing');
  };

  const bookTableNow = (id) => { setTables(prev => (prev || []).map(t => t.id === id ? { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: null, isCallingForBill: false, isCalling: false, calledWaiter: null } : t)); setOrderType('in_hall'); };
  
  const handleFreeTable = (id) => {
    setTables(prev => (prev || []).map(t => t.id === id ? { ...t, status: 'free', bookedBy: null, bookedTime: null, isCalling: false, calledWaiter: null } : t));
  };

  const handleChangeTableStart = (id) => {
    setIsChangingTable(true);
    setChangingFromTableId(id);
    alert(lang === 'ru' ? "Выберите новый свободный столик из списка." : "Жаңа бос үстелді таңдаңыз.");
  };

  const handleChangeTableConfirm = (newId) => {
    const newTable = (tables || []).find(t => t.id === newId);
    setTables(prev => (prev || []).map(t => {
        if (t.id === changingFromTableId) return { ...t, status: 'free', bookedBy: null, bookedTime: null, isCalling: false, calledWaiter: null };
        if (t.id === newId) return { ...t, status: 'occupied', bookedBy: currentUser.phone, bookedTime: null, isCalling: false, calledWaiter: null };
        return t;
    }));
    setOrders(prev => (prev || []).map(o => {
        if (o.tableId === changingFromTableId && o.phone === currentUser.phone && o.status !== 'delivered' && o.status !== 'rejected') return { ...o, tableId: newId, tableName: newTable.name };
        return o;
    }));
    setIsChangingTable(false);
    setChangingFromTableId(null);
    alert(lang === 'ru' ? "Вы успешно пересели за " + newTable.name + "!" : "Сіз " + newTable.name + " үстеліне ауыстыңыз!");
  };

  const addToCart = (item) => setCart(prev => ({ ...(prev || {}), [item.id]: { ...item, quantity: ((prev || {})[item.id]?.quantity || 0) + 1 } }));
  const removeFromCart = (id) => setCart(prev => { const updated = { ...(prev || {}) }; if (!updated[id]) return prev; if (updated[id].quantity === 1) delete updated[id]; else updated[id].quantity -= 1; return updated; });

  const myCurrentTable = (tables || []).find(t => t.bookedBy === currentUser?.phone);
  const activeTable = (tables || []).find(t => t.id === preOrderTableId) || myCurrentTable;
  let activeTableName = orderType === 'delivery' ? t.delivery : (activeTable ? activeTable.name : t.takeaway);

  const cartItemsArray = Object.values(cart || {});
  const totalItemsCount = cartItemsArray.reduce((sum, item) => sum + item.quantity, 0);
  const baseSubtotal = cartItemsArray.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  // 🔥 ДОБАВЛЯЕМ 15%
  const serviceFee = Math.round(baseSubtotal * 0.15);
  const totalAmount = isPreOrderFlow ? (baseSubtotal === 0 ? 1000 : Math.round((baseSubtotal + serviceFee) / 2)) : (baseSubtotal + serviceFee);
  const availableBonuses = customers[currentUser?.phone]?.bonuses || 0;

  const createOrderObject = (statusToSet, assignedWaiterPhone = null, assignedWaiterName = null, payMethod = 'kaspi') => {
    const text = cartItemsArray.length > 0 ? cartItemsArray.map(i => `${i.name} (x${i.quantity})`).join(', ') : "Обычный заказ";
    const fullAddress = orderType === 'delivery' ? `Ул/Гео: ${address.street}, д. ${address.house}, кв. ${address.apt}. Коммент: ${address.comment}` : '';
    return { 
      id: `ORD-${Math.floor(Math.random() * 10000)}`, 
      phone: currentUser.phone, 
      tableId: activeTable?.id || orderType, 
      tableName: activeTableName, 
      cartItems: cartItemsArray, 
      itemsText: text, 
      subtotal: baseSubtotal,
      serviceFee: serviceFee,
      total: totalAmount, 
      tips: 0, 
      isPreOrder: isPreOrderFlow, 
      bookedTime: isPreOrderFlow ? bookingTime : null, 
      orderType, 
      deliveryAddress: fullAddress, 
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), 
      status: statusToSet, 
      waiterPhone: assignedWaiterPhone, 
      waiterName: assignedWaiterName, 
      isReviewed: false, 
      reviewUnlockTime: null, 
      payMethod 
    };
  };

  const handlePayClick = () => {
    if (cartItemsArray.length === 0 && !isPreOrderFlow) return alert("Выберите блюда!");
    if (orderType === 'delivery' && !address.street) return alert("Укажите адрес доставки или используйте геоданные!");
    if (orderType === 'in_hall' && !activeTable) return alert(lang === 'ru' ? 'Оплата в зале доступна только при заказе за столиком в заведении!' : 'Залда төлеу тек залда отырғанда ғана мүмкін!');

    if (orderType === 'in_hall') {
      setPaymentStatus('select_waiter');
    } else {
      setPaymentStatus('select_method'); 
    }
  };

  // ================================================================
  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОДТВЕРЖДЕНИЯ ПЕРЕВОДА (для заказов)
  // ================================================================
  const confirmTransfer = () => {
    // Если есть pendingOrderId и он в статусе rejected — обновляем существующий заказ
    if (pendingOrderId && paymentStatus === 'rejected') {
      const existingOrder = (orders || []).find(o => o.id === pendingOrderId);
      if (existingOrder && existingOrder.orderType !== 'booking_deposit') {
        setOrders(prev => (prev || []).map(o => 
          o.id === pendingOrderId ? { ...o, status: 'transfer_pending' } : o
        ));
        setPaymentStatus('processing');
        return;
      }
    }

    // Если нет pendingOrderId — создаем новый заказ
    const newOrder = createOrderObject('transfer_pending', null, null, 'kaspi');
    setOrders(prev => [newOrder, ...(prev || [])]);
    setPendingOrderId(newOrder.id);
    setPaymentStatus('processing'); 
  };

  const handleCashSelection = () => {
    if (orderType !== 'in_hall' || !activeTable) return alert(lang === 'ru' ? 'Оплата наличными доступна только при заказе за столиком в заведении!' : 'Қолма-қол ақшамен төлеу тек залда отырғанда ғана мүмкін!');
    setPaymentStatus('select_waiter');
  };

  const confirmCashWithWaiter = (waiterPhone, waiterName) => {
    const newOrder = createOrderObject('waiter_pending', waiterPhone, waiterName, 'cash');
    setOrders(prev => [newOrder, ...(prev || [])]);
    setPendingOrderId(newOrder.id);
    setPaymentStatus('processing');
  };

  const selectRandomWaiter = () => {
    const activeWaiters = Object.entries(roles || {}).filter(([p, data]) => data.role === 'waiter' && data.onShift);
    if (activeWaiters.length === 0) return alert(lang === 'ru' ? 'К сожалению, сейчас нет свободных официантов.' : 'Кешіріңіз, қазір бос даяшылар жоқ.');
    const randomW = activeWaiters[Math.floor(Math.random() * activeWaiters.length)];
    confirmCashWithWaiter(randomW[0], randomW[1].name);
  };

  const handleFinishAndClear = () => { setCart({}); setIsPreOrderFlow(false); setPreOrderTableId(null); setPaymentStatus('idle'); setPendingOrderId(null); setActiveGuestTab('profile'); };
  const copyToClipboard = (text) => { navigator.clipboard.writeText(text); alert('Реквизиты скопированы!'); };

  const getWaiterRating = (phone) => {
     const wRevs = (reviews || []).filter(r => r.targetId === phone);
     if (wRevs.length === 0) return lang === 'ru' ? 'Новенький' : 'Жаңа';
     const avg = wRevs.reduce((sum, r) => sum + r.rating, 0) / wRevs.length;
     return `⭐️ ${avg.toFixed(1)} (${wRevs.length} отз.)`;
  };

  const submitReview = () => {
     if (reviewRating === 0) return alert('Выберите оценку в звездах!');
     if (reviewRating <= 3 && reviewText.trim().length === 0) return alert('Пожалуйста, напишите причину низкой оценки, чтобы мы стали лучше.');
     const newReview = { id: `REV-${Date.now()}`, type: reviewOrder.waiterPhone ? 'waiter' : 'cafe', targetId: reviewOrder.waiterPhone || 'cafe', targetName: reviewOrder.waiterName || 'Кафе Амина', rating: reviewRating, text: reviewText, author: currentUser.name, date: new Date().toLocaleDateString('ru-RU') };
     setReviews(prev => [newReview, ...(prev || [])]);
     setOrders(prev => (prev || []).map(o => o.id === reviewOrder.id ? { ...o, isReviewed: true } : o));
     setReviewOrder(null); setReviewRating(0); setReviewText(''); alert('Спасибо за ваш отзыв!');
  };

  // Функция для отправки отзыва из профиля
  const submitProfileReview = () => {
     if (profileReviewRating === 0) return alert('Выберите оценку в звездах!');
     if (profileReviewRating <= 3 && profileReviewText.trim().length === 0) return alert('Пожалуйста, напишите причину низкой оценки, чтобы мы стали лучше.');
     const newReview = { id: `REV-${Date.now()}`, type: 'cafe', targetId: 'cafe', targetName: 'Кафе Амина', rating: profileReviewRating, text: profileReviewText, author: currentUser.name, date: new Date().toLocaleDateString('ru-RU') };
     setReviews(prev => [newReview, ...(prev || [])]);
     setShowReviewFromProfile(false);
     setProfileReviewRating(0);
     setProfileReviewText('');
     alert('Спасибо за ваш отзыв о кафе!');
  };

  const displayedMenu = selectedCategory === 'all' ? (menu || []) : (menu || []).filter(m => m.category === selectedCategory);
  const tableGroupsList = ['all', 'Белый зал', 'Красный зал', 'Кальянный зал', 'Летник', 'Тапчаны', 'Кабинки'];
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
        
        .payment-overlay { position: fixed; inset: 0; height: 100%; background: rgba(17,24,39,0.7); z-index: 9999; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; backdrop-filter: blur(4px); }
        .payment-modal { background: #fff; width: 100%; max-width: 500px; border-radius: 28px 28px 0 0; padding: 30px 25px; animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); box-sizing: border-box; max-height: 90vh; display: flex; flex-direction: column; }
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
        .story-circle { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 26px; border: 2px solid #fff; outline: 2px solid var(--orange); }
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
          .payment-modal { border-radius: 24px; max-height: 80vh; }
        }
        @media (min-width: 1200px) { .tables-grid { grid-template-columns: repeat(5, 1fr); } }
      `}}/>

      {showIOSInstallGuide && (
         <div className="payment-overlay" onClick={() => setShowIOSInstallGuide(false)}>
           <div className="payment-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', padding: '40px 20px', overflowY: 'auto'}}>
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

      {showInfoModal && (
        <div className="payment-overlay" onClick={() => setShowInfoModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'left', padding: '30px 20px', overflowY: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h2 style={{margin: 0, fontSize: '20px', color: '#111827'}}>ℹ️ Информация</h2>
              <button onClick={() => setShowInfoModal(false)} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
            </div>

            {currentUser.isAnonymous ? (
              <>
                <p style={{color: '#111827', fontSize: '15px', lineHeight: '1.5', background: '#fef3c7', padding: '15px', borderRadius: '12px', border: '1px solid #f59e0b'}}>
                  <b>🛠 Это тестовая версия сайта.</b><br/><br/>
                  Если заметите какие-то баги, глюки, просим обратиться в техподдержку (в Профиле) и написать, что случилось.<br/><br/>
                  Спасибо за внимание!
                </p>
                <p style={{color: '#6b7280', fontSize: '14px', lineHeight: '1.5', marginTop: '15px', textAlign: 'center'}}>
                  <i>💡 (Если зарегистрируетесь / войдете в личный кабинет, то вам выйдет подробная инструкция, как пользоваться сайтом)</i>
                </p>
              </>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <p style={{color: '#111827', fontSize: '14px', lineHeight: '1.5', background: '#fef3c7', padding: '12px', borderRadius: '12px', border: '1px solid #f59e0b', margin: 0}}>
                  <b>🛠 Это тестовая версия сайта.</b> Если заметите баги, пишите в техподдержку (в Профиле). Спасибо!
                </p>
                <h3 style={{margin: '5px 0 0 0', color: '#111827', fontSize: '18px'}}>📖 Инструкция для Гостя:</h3>
                
                <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                   <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>🛒 Заказы и Доставка</p>
                   <p style={{margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>Добавляйте блюда в корзину из раздела "Меню". В корзине можно выбрать: кушать в зале, забрать навынос или оформить доставку до двери.</p>
                </div>

                <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                   <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>📅 Бронь столиков</p>
                   <p style={{margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>В разделе "Залы" нажмите "Бронь" и выберите время. Для подтверждения нужно оплатить залог 1000₸. Когда приедете в кафе, нажмите на свой стол и выберите <b>«🙋‍♂️ Я пришел»</b>, чтобы официант подтвердил вашу посадку.</p>
                </div>

                <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                   <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>🛎 Вызов официанта и Счет</p>
                   <p style={{margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>Сидя за столом, вы можете в любой момент нажать "Официант", чтобы позвать его, или попросить счет для оплаты наличными.</p>
                </div>

                <div style={{background: '#f9fafb', padding: '15px', borderRadius: '12px', border: '1px solid #e5e7eb'}}>
                   <p style={{margin: '0 0 5px 0', fontWeight: 'bold', color: '#111827'}}>🎁 Кэшбек</p>
                   <p style={{margin: 0, fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>С каждого заказа вам начисляются бонусы, которые можно проверить в разделе "Профиль".</p>
                </div>
              </div>
            )}
            <button onClick={() => setShowInfoModal(false)} style={{width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '15px'}}>Понятно</button>
          </div>
        </div>
      )}

      {showSupportModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: '#f4f5f7', zIndex: 99999, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ padding: '20px', backgroundColor: '#111827', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <h2 style={{margin: 0, fontSize: '20px'}}>💬 Поддержка</h2>
              <p style={{margin: '2px 0 0 0', fontSize: '12px', color: '#10b981', fontWeight: 'bold'}}>Онлайн. Отвечаем быстро!</p>
            </div>
            <button onClick={() => setShowSupportModal(false)} style={{background: '#374151', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</button>
          </div>
          
          <div style={{flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px'}}>
             {supportChat.filter(m => m.phone === currentUser.phone).length === 0 && (
               <p style={{textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '20px'}}>Здесь вы можете сообщить о баге, глюке или оставить предложение. Напишите нам!</p>
             )}
             {supportChat.filter(m => m.phone === currentUser.phone).map(m => (
                <div key={m.id} style={{alignSelf: m.sender === 'guest' ? 'flex-end' : 'flex-start', background: m.sender === 'guest' ? '#111827' : '#fff', color: m.sender === 'guest' ? '#fff' : '#111827', border: m.sender === 'guest' ? 'none' : '1px solid #e5e7eb', padding: '12px', borderRadius: '16px', maxWidth: '85%', boxShadow: '0 2px 5px rgba(0,0,0,0.02)'}}>
                   <p style={{margin: 0, fontSize: '15px', lineHeight: '1.4'}}>{m.text}</p>
                   <p style={{margin: '5px 0 0 0', fontSize: '10px', opacity: 0.6, textAlign: 'right'}}>{m.time}</p>
                </div>
             ))}
          </div>
          
          <div style={{padding: '15px', backgroundColor: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '10px', flexShrink: 0, paddingBottom: 'max(15px, env(safe-area-inset-bottom))'}}>
            <input type="text" value={supportText} onChange={e=>setSupportText(e.target.value)} placeholder="Сообщение разработчикам..." style={{flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', fontSize: '15px', boxSizing: 'border-box', background: '#f9fafb', color: '#111827'}} />
            <button onClick={() => {
               if(!supportText.trim()) return;
               setSupportChat(prev => [...(prev||[]), {id: Date.now(), phone: currentUser.phone, name: currentUser.name, sender: 'guest', text: supportText, time: new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}]);
               setSupportText('');
            }} style={{background: '#3b82f6', color: '#fff', border: 'none', width: '50px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px'}}>➤</button>
          </div>
        </div>
      )}

      {showTimeModal && (
        <div className="payment-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', overflowY: 'auto'}}>
             <h2 style={{margin: '0 0 15px 0', color: '#111827'}}>{lang === 'ru' ? 'Выберите время' : 'Уақытты таңдаңыз'}</h2>
             <input type="time" value={bookingTime} onChange={e=>setBookingTime(e.target.value)} style={{width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #d1d5db', marginBottom: '20px', fontSize: '20px', textAlign: 'center', fontWeight: 'bold', color: '#111827'}} />
             <button onClick={confirmBookingTime} style={{width: '100%', padding: '16px', borderRadius: '14px', background: '#10b981', color: '#fff', fontWeight: 'bold', border: 'none', cursor: 'pointer', marginBottom: '10px', fontSize: '16px'}}>{lang === 'ru' ? 'Забронировать (Залог 1000₸)' : 'Брондау (Залог 1000₸)'}</button>
             <button onClick={() => { setShowTimeModal(false); setPreOrderTableId(null); }} style={{width: '100%', padding: '16px', borderRadius: '14px', background: '#f3f4f6', color: '#4b5563', fontWeight: 'bold', border: 'none', cursor: 'pointer', fontSize: '16px'}}>{lang === 'ru' ? 'Отмена' : 'Болдырмау'}</button>
          </div>
        </div>
      )}

      {showReviewFromProfile && (
        <div className="payment-overlay">
          <div className="payment-modal" style={{textAlign: 'center', overflowY: 'auto'}}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px'}}>
               <h2 style={{margin: 0, color: '#111827'}}>Оцените наше кафе!</h2>
               <button onClick={() => { setShowReviewFromProfile(false); setProfileReviewRating(0); setProfileReviewText(''); }} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer'}}>✕</button>
             </div>
             <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>Ваше мнение поможет нам стать лучше!</p>
             
             <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px'}}>
               {[1,2,3,4,5].map(star => (
                 <button key={star} onClick={() => setProfileReviewRating(star)} className={`star-btn ${profileReviewRating >= star ? 'active' : ''}`}>★</button>
               ))}
             </div>

             {profileReviewRating > 0 && profileReviewRating <= 3 && (
               <div style={{marginBottom: '20px', textAlign: 'left'}}>
                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#dc2626', fontWeight: 'bold'}}>* Обязательно укажите причину низкой оценки</p>
                 <textarea value={profileReviewText} onChange={e=>setProfileReviewText(e.target.value)} placeholder="Что пошло не так? Ваш отзыв поможет нам стать лучше." style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #dc2626', resize: 'none', background: '#fef2f2', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}
             
             {profileReviewRating > 3 && (
               <div style={{marginBottom: '20px'}}>
                 <textarea value={profileReviewText} onChange={e=>setProfileReviewText(e.target.value)} placeholder="Напишите комментарий (необязательно)" style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'none', background: '#f9fafb', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}

             <button onClick={submitProfileReview} style={{width: '100%', padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>Отправить отзыв</button>
          </div>
        </div>
      )}

      {waiterCallTableId && (
        <div className="payment-overlay" onClick={() => setWaiterCallTableId(null)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
             <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexShrink: 0}}>
                <h2 style={{margin: 0, color: '#111827', fontSize: '20px'}}>{lang === 'ru' ? 'Кого позвать?' : 'Кімді шақыру керек?'}</h2>
                <button onClick={() => setWaiterCallTableId(null)} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontWeight: 'bold'}}>✕</button>
             </div>
             <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px', flexShrink: 0}}>{lang === 'ru' ? 'Выберите официанта, который подойдет к вашему столику.' : 'Үстеліңізге келетін даяшыны таңдаңыз.'}</p>
             
             <div style={{display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '5px'}}>
                {availableWaitersList.length === 0 ? <p style={{color: '#dc2626', textAlign: 'center'}}>{lang === 'ru' ? 'Нет свободных официантов' : 'Бос даяшылар жоқ'}</p> : 
                  availableWaitersList.map(([p, data]) => (
                     <button key={p} onClick={() => {
                        setTables(prev => (prev || []).map(t => t.id === waiterCallTableId ? { ...t, isCalling: true, calledWaiter: p, callType: isArrivalCall ? 'arrival' : 'normal' } : t));
                        setWaiterCallTableId(null);
                        setIsArrivalCall(false);
                        alert(lang === 'ru' ? "Официант уведомлен! Скоро подойдет." : "Даяшыға хабарланды! Жақында келеді.");
                     }} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '14px', border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', flexShrink: 0}}>
                        <span style={{fontWeight: 'bold', color: '#111827', fontSize: '16px'}}>{data.name}</span>
                        <span style={{color: '#f59e0b', fontWeight: 'bold', fontSize: '13px'}}>{getWaiterRating(p)}</span>
                     </button>
                  ))
                }
             </div>
          </div>
        </div>
      )}

      {reviewOrder && (
        <div className="payment-overlay">
          <div className="payment-modal" style={{textAlign: 'center', overflowY: 'auto'}}>
             <h2 style={{margin: '0 0 10px 0', color: '#111827'}}>Как вам обслуживание?</h2>
             <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>Оцените работу официанта <b style={{color: '#111827'}}>{reviewOrder.waiterName || 'Кафе'}</b></p>
             
             <div style={{display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px'}}>
               {[1,2,3,4,5].map(star => (
                 <button key={star} onClick={() => setReviewRating(star)} className={`star-btn ${reviewRating >= star ? 'active' : ''}`}>★</button>
               ))}
             </div>

             {reviewRating > 0 && reviewRating <= 3 && (
               <div style={{marginBottom: '20px', textAlign: 'left'}}>
                 <p style={{margin: '0 0 5px 0', fontSize: '12px', color: '#dc2626', fontWeight: 'bold'}}>* Обязательно укажите причину низкой оценки</p>
                 <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Что пошло не так? Ваш отзыв поможет нам стать лучше." style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #dc2626', resize: 'none', background: '#fef2f2', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}
             
             {reviewRating > 3 && (
               <div style={{marginBottom: '20px'}}>
                 <textarea value={reviewText} onChange={e=>setReviewText(e.target.value)} placeholder="Напишите комментарий (необязательно)" style={{width: '100%', height: '80px', padding: '12px', borderRadius: '12px', border: '1px solid #d1d5db', resize: 'none', background: '#f9fafb', color: '#111827', fontFamily: 'inherit'}}></textarea>
               </div>
             )}

             <button onClick={submitReview} style={{width: '100%', padding: '16px', background: '#111827', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'}}>Отправить отзыв</button>
             <button onClick={() => {setOrders(prev => prev.map(o => o.id === reviewOrder.id ? { ...o, isReviewed: true } : o)); setReviewOrder(null);}} style={{background: 'none', border: 'none', color: '#6b7280', marginTop: '15px', cursor: 'pointer', textDecoration: 'underline'}}>Не сейчас</button>
          </div>
        </div>
      )}

      {paymentStatus !== 'idle' && (
        <div className="payment-overlay">
          <div className="payment-modal" style={{overflowY: 'auto'}}>
            
            {paymentStatus === 'select_method' && (
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px'}}>
                  <h2 style={{margin: 0, fontSize: '22px', fontWeight: '900', color: '#111827'}}>Метод оплаты</h2>
                  <button onClick={() => setPaymentStatus('idle')} style={{background: '#f3f4f6', border: 'none', width: '32px', height: '32px', borderRadius: '50%', fontWeight: 'bold', cursor: 'pointer', color: '#4b5563'}}>✕</button>
                </div>
                
                <div className="pay-method-btn" onClick={() => setPaymentStatus('kaspi_card')}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{background: '#eff6ff', padding: '10px', borderRadius: '12px', fontSize: '24px'}}>💳</div>
                    <div>
                      <p style={{margin: '0 0 3px 0', fontWeight: '900', fontSize: '16px', color: '#111827'}}>Банковская карта / Kaspi</p>
                      <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>Прямой перевод по реквизитам</p>
                    </div>
                  </div>
                  <span style={{color: '#9ca3af', fontWeight: 'bold'}}>➔</span>
                </div>

                <div className="pay-method-btn" onClick={handleCashSelection}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                    <div style={{background: '#ecfdf5', padding: '10px', borderRadius: '12px', fontSize: '24px'}}>💵</div>
                    <div>
                      <p style={{margin: '0 0 3px 0', fontWeight: '900', fontSize: '16px', color: '#111827'}}>Наличными</p>
                      <p style={{margin: 0, fontSize: '13px', color: '#6b7280'}}>Вызов официанта к столику</p>
                    </div>
                  </div>
                  <span style={{color: '#9ca3af', fontWeight: 'bold'}}>➔</span>
                </div>
              </>
            )}

            {paymentStatus === 'select_waiter' && (
              <>
                 <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px'}}>
                  {orderType !== 'in_hall' ? (
                     <button onClick={() => setPaymentStatus('select_method')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>←</button>
                  ) : (
                     <button onClick={() => setPaymentStatus('idle')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>✕</button>
                  )}
                  <h2 style={{margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827'}}>Кто вас обслужит?</h2>
                </div>
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '20px'}}>
                   {orderType === 'in_hall' 
                     ? 'Выберите вашего официанта для оформления заказа в зале.' 
                     : 'Выберите официанта по отзывам для оплаты наличными.'}
                </p>

                <button onClick={selectRandomWaiter} style={{width: '100%', padding: '16px', borderRadius: '14px', border: '2px dashed #111827', background: '#f9fafb', color: '#111827', fontWeight: '900', fontSize: '15px', cursor: 'pointer', marginBottom: '15px'}}>🎲 Мне лень, выберите случайно</button>

                <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                  {availableWaitersList.length === 0 ? <p style={{textAlign: 'center', color: '#dc2626'}}>К сожалению, сейчас нет свободных официантов.</p> : 
                   availableWaitersList.map(([p, data]) => (
                     <div key={p} onClick={() => confirmCashWithWaiter(p, data.name)} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '14px', cursor: 'pointer'}}>
                        <div>
                           <p style={{margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px', color: '#111827'}}>{data.name}</p>
                           <p style={{margin: 0, fontSize: '13px', color: '#f59e0b', fontWeight: 'bold'}}>{getWaiterRating(p)}</p>
                        </div>
                        <span style={{color: '#10b981', fontWeight: 'bold'}}>Выбрать ➔</span>
                     </div>
                   ))
                  }
                </div>
              </>
            )}

            {paymentStatus === 'kaspi_card' && (
              <>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px'}}>
                  <button onClick={() => setPaymentStatus('select_method')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>←</button>
                  <h2 style={{margin: '0', fontSize: '20px', fontWeight: '900', color: '#111827'}}>Безопасный перевод</h2>
                </div>
                
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4'}}>Скопируйте номер карты и переведите точную сумму в приложении вашего банка.</p>
                
                <div style={{background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', marginBottom: '25px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>К оплате</p>
                  <p style={{margin: '0 0 20px 0', fontSize: '36px', fontWeight: '900', color: '#ea580c'}}>{totalAmount} ₸</p>
                  
                  <div style={{textAlign: 'left'}}>
                    <p style={{margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold'}}>Номер карты (Visa / Mastercard)</p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '14px', border: '2px dashed #d1d5db'}}>
                      <span style={{fontSize: '20px', fontWeight: '900', letterSpacing: '1px', color: '#111827'}}>4400 4302 5493 5945</span>
                      <button onClick={() => copyToClipboard('4400430254935945')} style={{background: '#111827', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff', fontSize: '13px'}}>Копия</button>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px'}}><span style={{color: '#10b981', fontSize: '18px'}}>✓</span><span style={{fontSize: '14px', color: '#111827', fontWeight: 'bold'}}>Получатель: Эльвира А.</span></div>
                  </div>
                </div>
                <button onClick={confirmTransfer} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'}}>Я перевел({currentUser.name ? 'а' : ''}) деньги</button>
              </>
            )}

            {paymentStatus === 'kaspi_card_booking' && (
              <>
                <div style={{display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '15px'}}>
                  <button onClick={() => setPaymentStatus('idle')} style={{background: '#f3f4f6', border: 'none', color: '#111827', width: '36px', height: '36px', borderRadius: '10px', fontSize: '16px', cursor: 'pointer'}}>←</button>
                  <h2 style={{margin: '0', fontSize: '20px', fontWeight: '900', color: '#111827'}}>Оплата залога</h2>
                </div>
                
                <p style={{color: '#6b7280', fontSize: '14px', marginBottom: '25px', lineHeight: '1.4'}}>Для подтверждения брони столика внесите залог. В случае неприбытия сумма не возвращается.</p>
                
                <div style={{background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '20px', padding: '20px', marginBottom: '25px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold'}}>К оплате</p>
                  <p style={{margin: '0 0 20px 0', fontSize: '36px', fontWeight: '900', color: '#ea580c'}}>1000 ₸</p>
                  
                  <div style={{textAlign: 'left'}}>
                    <p style={{margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280', fontWeight: 'bold'}}>Номер карты (Visa / Mastercard)</p>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '15px', borderRadius: '14px', border: '2px dashed #d1d5db'}}>
                      <span style={{fontSize: '20px', fontWeight: '900', letterSpacing: '1px', color: '#111827'}}>4400 4302 5493 5945</span>
                      <button onClick={() => copyToClipboard('4400430254935945')} style={{background: '#111827', border: 'none', padding: '10px 15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#fff', fontSize: '13px'}}>Копия</button>
                    </div>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px'}}><span style={{color: '#10b981', fontSize: '18px'}}>✓</span><span style={{fontSize: '14px', color: '#111827', fontWeight: 'bold'}}>Получатель: Эльвира А.</span></div>
                  </div>
                </div>
                <button onClick={confirmBookingTransfer} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#10b981', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'}}>Я перевел(а) 1000 ₸</button>
              </>
            )}

            {/* ЗАГРУЗКА (ЕСЛИ ДЕНЬГИ ЕЩЕ ПРОВЕРЯЮТСЯ) */}
            {paymentStatus === 'processing' && (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{fontSize: '60px', animation: 'spinPulse 2s infinite linear'}}>⏳</div>
                <h2 style={{marginTop: '20px', color: '#111827'}}>Проверка платежа...</h2>
                <p style={{color: '#6b7280', fontSize: '15px', padding: '0 20px'}}>Пожалуйста, подождите. Кассир проверяет поступление средств на карту.</p>
              </div>
            )}

            {paymentStatus === 'waiter_pending' && (
              <div style={{textAlign: 'center', padding: '40px 0'}}>
                <div style={{fontSize: '60px', animation: 'spinPulse 2s infinite linear'}}>⏳</div>
                <h2 style={{marginTop: '20px', color: '#111827'}}>Ожидаем официанта</h2>
                <p style={{color: '#6b7280', fontSize: '15px', padding: '0 20px'}}>Официант уже получил уведомление и скоро подойдет к вашему столику для расчета.</p>
              </div>
            )}

            {/* ✅ ИСПРАВЛЕННЫЙ ЭКРАН ОТКЛОНЕНИЯ ДЛЯ ГОСТЯ С КРАСИВОЙ ИКОНКОЙ */}
            {paymentStatus === 'rejected' && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '80px', marginBottom: '10px', color: '#dc2626'}}>
                  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="40" cy="40" r="38" stroke="#dc2626" strokeWidth="4"/>
                    <path d="M24 24L56 56M56 24L24 56" stroke="#dc2626" strokeWidth="6" strokeLinecap="round"/>
                  </svg>
                </div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '24px', color: '#dc2626'}}>Деньги не поступили!</h2>
                <p style={{color: '#111827', marginBottom: '10px', fontSize: '18px', fontWeight: 'bold', lineHeight: '1.4'}}>
                  Попробуйте еще раз!
                </p>
                <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '14px', lineHeight: '1.4', background: '#fef3c7', padding: '12px', borderRadius: '10px'}}>
                  💡 Кассир не смог подтвердить ваш перевод. Проверьте статус платежа в приложении банка. Если проблема повторяется — обратитесь в техподдержку.
                </p>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button onClick={() => { 
                    // Повторная попытка — обновляем статус существующего заказа
                    if (pendingOrderId) {
                      setOrders(prev => (prev || []).map(o => 
                        o.id === pendingOrderId ? { ...o, status: 'transfer_pending' } : o
                      ));
                      setPaymentStatus('processing');
                    } else {
                      // Если ID потерян — создаем заново
                      if (isPreOrderFlow) {
                        confirmBookingTransfer();
                      } else {
                        confirmTransfer();
                      }
                    }
                  }} style={{flex: 1, padding: '16px', borderRadius: '14px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '15px', cursor: 'pointer'}}>
                    Повторить попытку
                  </button>
                  <button onClick={() => { 
                    setPaymentStatus('idle'); 
                    setActiveGuestTab('profile'); 
                    setShowSupportModal(true); // Открыть поддержку
                  }} style={{flex: 1, padding: '16px', borderRadius: '14px', border: '2px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontWeight: '900', fontSize: '15px', cursor: 'pointer'}}>
                    💬 В поддержку
                  </button>
                </div>
              </div>
            )}

            {paymentStatus === 'booking_success' && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '70px', color: '#10b981', marginBottom: '15px'}}>✅</div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '26px', color: '#111827'}}>Бронь подтверждена!</h2>
                <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '15px', lineHeight: '1.4'}}>Стол забронирован на ваше имя. Когда приедете в заведение, нажмите кнопку «🙋‍♂️ Я пришел» на карточке вашего столика.</p>
                <button onClick={() => { setPaymentStatus('idle'); setPreOrderTableId(null); setActiveGuestTab('table'); }} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'}}>Супер</button>
              </div>
            )}

            {paymentStatus === 'success' && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '70px', color: '#10b981', marginBottom: '15px'}}>✅</div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '26px', color: '#111827'}}>Оплата прошла!</h2>
                <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '15px', lineHeight: '1.4'}}>Деньги успешно поступили. Ваш заказ оформлен и уже отправлен на кухню.</p>
                <button onClick={handleFinishAndClear} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'}}>Отлично</button>
              </div>
            )}

            {paymentStatus === 'cash_success' && (
              <div style={{textAlign: 'center', padding: '30px 0'}}>
                <div style={{fontSize: '70px', marginBottom: '15px'}}>✅</div>
                <h2 style={{margin: '0 0 10px 0', fontSize: '26px', color: '#111827'}}>Оплата принята!</h2>
                <p style={{color: '#6b7280', marginBottom: '30px', fontSize: '15px', lineHeight: '1.4'}}>Официант подтвердил оплату. Заказ отправлен на кухню.</p>
                <button onClick={handleFinishAndClear} style={{width: '100%', padding: '18px', borderRadius: '16px', border: 'none', background: '#111827', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer'}}>Отлично</button>
              </div>
            )}

          </div>
        </div>
      )}

      {!isAnyModalOpen && totalItemsCount > 0 && activeGuestTab !== 'cart' && (
        <div style={{position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: '400px', zIndex: 99}}>
           <button onClick={() => setActiveGuestTab('cart')} style={{width: '100%', padding: '16px 20px', background: '#111827', color: '#fff', borderRadius: '18px', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '900', fontSize: '16px', cursor: 'pointer', boxShadow: '0 8px 25px rgba(17,24,39,0.3)'}}>
              <span style={{display: 'flex', alignItems: 'center', gap: '10px'}}><span style={{background: '#ea580c', padding: '4px 10px', borderRadius: '10px', color: '#fff'}}>{totalItemsCount}</span> {t.inCart}</span>
              <span>{baseSubtotal} ₸ ➔</span>
           </button>
        </div>
      )}

      <div className={`sidebar-overlay ${isMenuOpen ? 'open' : ''}`} onClick={() => setIsMenuOpen(false)}></div>
      <div className={`categories-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <button className="close-sidebar-btn" onClick={() => setIsMenuOpen(false)}><span>📂 {t.cats}</span> <span>✕</span></button>
        {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => { setSelectedCategory(cat.id); setIsMenuOpen(false); }} className={`cat-button ${selectedCategory === cat.id ? 'active' : 'inactive'}`}><span className="icon">{cat.icon}</span><span className="name">{cat.name}</span></button>))}
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
          <button onClick={() => setShowInfoModal(true)} style={{ background: '#fef3c7', border: '1px solid #f59e0b', padding: '8px 10px', borderRadius: '10px', color: '#b45309', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ℹ️
          </button>
          <button onClick={() => setLang(lang === 'ru' ? 'kz' : 'ru')} style={{ background: '#f3f4f6', border: '1px solid #d1d5db', padding: '8px 10px', borderRadius: '10px', color: '#111827', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
            {lang === 'ru' ? 'KZ' : 'RU'}
          </button>
          <button onClick={() => setActiveGuestTab('profile')} style={{ background: '#d1fae5', border: 'none', padding: '8px 15px', borderRadius: '12px', color: '#065f46', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            👤 {currentUser.isAnonymous ? (lang === 'ru' ? 'Войти' : 'Кіру') : currentUser.name}
          </button>
        </div>
      </header>

      <main className="main-content">
        {activeGuestTab === 'menu' && (
          <div className="menu-layout">
            <div className="desktop-sidebar">
              <h3 style={{margin: '0 0 10px 0', fontSize: '16px', color: 'var(--text)'}}>{t.cats}</h3>
              {CATEGORIES.map(cat => (<button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`cat-button ${selectedCategory === cat.id ? 'active' : 'inactive'}`}><span className="icon">{cat.icon}</span><span className="name">{cat.name}</span></button>))}
            </div>
            <div className="content-area">
              <button className="hamburger-menu-trigger" onClick={() => setIsMenuOpen(true)}><span>☰</span> {t.cats}</button>
              <div className="stories-row">{STORIES.map(story => (<div key={story.id} className="story-item"><div className="story-circle" style={{ background: story.color }}>{story.emoji}</div><span style={{ fontSize: '11px', fontWeight: 'bold', color: '#111827' }}>{story.title}</span></div>))}</div>
              
              <div className="food-list">
                {displayedMenu.map(item => (
                  <div key={item.id} className="food-card" style={{ opacity: item.isStop ? 0.6 : 1 }}>
                    <div className="food-pic" style={{ filter: item.isStop ? 'grayscale(1)' : 'none' }}>{item.imgUrl ? <img src={item.imgUrl} alt={item.name} style={{width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover'}}/> : item.img}</div>
                    <div className="food-info">
                      <h3 className="food-name" style={{textDecoration: item.isStop ? 'line-through' : 'none', color: '#111827'}}>{item.name}</h3>
                      <p className="food-ingr">{item.ingredients}</p>
                      {item.isStop ? <span style={{ color: '#dc2626', fontWeight: 'bold', fontSize: '12px' }}>Стоп: {item.stopReason}</span> : <span className="food-price">{item.price} ₸</span>}
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
              const groupTables = (tables || []).filter(t => t.group === groupName);
              if (groupTables.length === 0) return null;
              return (
                <div key={groupName} style={{ marginBottom: '25px', background: '#fff', padding: '15px', borderRadius: '20px', boxSizing: 'border-box' }}>
                  <h4 style={{ fontSize: '18px', color: '#111827', margin: "0 0 15px 0" }}>📍 {groupName}</h4>
                  <div className="tables-grid">
                    {groupTables.map(table => (
                      <div key={table.id} style={{ padding: '15px 10px', borderRadius: '14px', border: table.bookedBy === currentUser?.phone ? '2px solid #10b981' : '1px solid #e5e7eb', backgroundColor: table.status === 'free' && table.bookedBy ? '#fff7ed' : table.status === 'free' ? '#f8fafc' : '#fff', textAlign: 'center', boxSizing: 'border-box' }}>
                        <div style={{ fontSize: '30px', marginBottom: '8px' }}>{table.imgUrl ? <img src={table.imgUrl} alt={table.name} style={{width: '45px', height: '45px', borderRadius: '10px', objectFit: 'cover'}}/> : getTableIcon(table.type)}</div>
                        <h3 style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#111827', fontWeight: '800', lineHeight: '1.2' }}>{table.name}</h3>
                        <p style={{ fontSize: '11px', color: '#6b7280', margin: '0 0 10px 0' }}>Мест: {table.seats}</p>
                        
                        {table.bookedBy === currentUser?.phone && !currentUser.isAnonymous ? (
                          <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                            <span style={{ background: '#d1fae5', color: '#065f46', padding: '4px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '11px', display: 'inline-block' }}>
                              🔒 Ваш стол {table.bookedTime ? `(на ${table.bookedTime})` : ''}
                            </span>
                            
                            {table.status === 'occupied' && table.bookedTime ? (
                               <div style={{ background: '#eff6ff', border: '1px solid #3b82f6', padding: '10px', borderRadius: '8px', color: '#1d4ed8' }}>
                                  <p style={{margin: '0 0 5px 0', fontSize: '18px'}}>🧹</p>
                                  <p style={{margin: 0, fontSize: '12px', fontWeight: 'bold', lineHeight: '1.4'}}>Столик подготавливается. Не переживайте, он будет готов ровно к вашему приезду (на {table.bookedTime})!</p>
                               </div>
                            ) : table.status === 'free' && table.bookedTime ? (
                               <>
                                 <button onClick={() => { setIsArrivalCall(true); setWaiterCallTableId(table.id); }} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#ea580c', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 5px rgba(234,88,12,0.3)' }}>🙋‍♂️ Я пришел</button>
                                 <button onClick={() => handleFreeTable(table.id)} style={{ padding: '8px', width: '100%', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: 'transparent', color: '#dc2626', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>Отменить (без возврата 1000₸)</button>
                               </>
                            ) : (
                               <>
                                 {(() => {
                                    const hasOrder = (orders || []).some(o => o.tableId === table.id && o.phone === currentUser.phone && o.status !== 'delivered' && o.status !== 'rejected');
                                    if (hasOrder) {
                                      return <button onClick={() => handleChangeTableStart(table.id)} style={{ padding: '8px', width: '100%', borderRadius: '8px', border: '1px solid #3b82f6', backgroundColor: '#eff6ff', color: '#1d4ed8', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>🔄 Поменять стол</button>;
                                    } else {
                                      return <button onClick={() => handleFreeTable(table.id)} style={{ padding: '8px', width: '100%', borderRadius: '8px', border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}>🚪 Освободить</button>;
                                    }
                                 })()}
                                 <button onClick={() => { setIsArrivalCall(false); setWaiterCallTableId(table.id); }} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: table.isCalling ? '#f59e0b' : '#111827', color: '#fff', fontWeight: 'bold', cursor: 'pointer', transition: '0.2s', fontSize: '12px' }}>
                                   {table.isCalling ? 'Идет...' : '🛎️ Официант'}
                                 </button>
                               </>
                            )}
                          </div>
                        ) : table.status === 'free' && table.bookedBy && table.bookedBy !== currentUser?.phone ? (
                          checkIsBlocked(table.bookedTime) ? (
                            <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', border: '1px solid #dc2626' }}>
                               <span style={{ color: '#dc2626', fontWeight: '900', fontSize: '11px', display: 'block' }}>⛔ Бронь на {table.bookedTime}</span>
                               <span style={{ color: '#dc2626', fontSize: '10px' }}>Стол заблокирован</span>
                            </div>
                          ) : (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                              <span style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '11px', padding: '4px', background: '#fef3c7', borderRadius: '6px' }}>Бронь на {table.bookedTime}</span>
                              <button onClick={() => { if(currentUser.isAnonymous) return logout(); bookTableNow(table.id); }} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Сесть (до {getEvictionTime(table.bookedTime)})</button>
                            </div>
                          )
                        ) : table.status === 'free' && !table.bookedBy ? (
                          isChangingTable ? (
                            <button onClick={() => handleChangeTableConfirm(table.id)} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Пересесть сюда</button>
                          ) : (
                            <div style={{display: 'flex', flexDirection: 'column', gap: '6px'}}>
                              <button onClick={() => { if(currentUser.isAnonymous) return logout(); bookTableNow(table.id); }} style={{ padding: '10px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Сесть</button>
                              <button onClick={() => { if(currentUser.isAnonymous) return logout(); initiateBooking(table.id); }} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: 'transparent', color: '#4b5563', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Бронь</button>
                            </div>
                          )
                        ) : table.status === 'free' && isChangingTable ? (
                            <button onClick={() => handleChangeTableConfirm(table.id)} style={{ padding: '10px', width: '100%', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Пересесть сюда</button>
                        ) : (
                          <div style={{ backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px' }}><span style={{ color: '#dc2626', fontWeight: '900', fontSize: '12px', display: 'block' }}>Занято</span></div>
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
                   <h3 style={{ margin: 0, color: '#111827', fontSize: '16px' }}>📍 {lang === 'ru' ? 'Куда доставить?' : 'Қайда жеткізу керек?'}</h3>
                   <button onClick={handleGetLocation} style={{background: '#e0f2fe', color: '#0369a1', border: 'none', padding: '8px 12px', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer'}}>🗺️ {lang === 'ru' ? 'По геоданным' : 'Геодеректер бойынша'}</button>
                </div>
                <input type="text" placeholder={lang === 'ru' ? "Улица или ссылка с карты *" : "Көше немесе картадан сілтеме *"} value={address.street} onChange={e=>setAddress({...address, street: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', marginBottom: '10px', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}><input type="text" placeholder={lang === 'ru' ? "Дом *" : "Үй *"} value={address.house} onChange={e=>setAddress({...address, house: e.target.value})} style={{ flex: 1, minWidth: '0', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/><input type="text" placeholder={lang === 'ru' ? "Квартира" : "Пәтер"} value={address.apt} onChange={e=>setAddress({...address, apt: e.target.value})} style={{ flex: 1, minWidth: '0', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/></div>
                <input type="text" placeholder={lang === 'ru' ? "Комментарий курьеру" : "Курьерге пікір"} value={address.comment} onChange={e=>setAddress({...address, comment: e.target.value})} style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '14px', color: '#111827', boxSizing: 'border-box', background: '#f9fafb' }}/>
              </div>
            )}
            <div style={{backgroundColor: '#fff', borderRadius: '20px', padding: '15px', boxSizing: 'border-box'}}>
              {cartItemsArray.length === 0 ? <p style={{textAlign: 'center', color: '#6b7280'}}>{t.emptyCart}</p> : cartItemsArray.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{flex: 1, minWidth: 0}}><p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p><p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>{item.price} ₸</p></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><button onClick={() => removeFromCart(item.id)} style={{ width: '32px', height: '32px', background: '#f3f4f6', color: '#111827', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>-</button><span style={{color: '#111827', fontWeight: 'bold'}}>{item.quantity}</span><button onClick={() => addToCart(item)} style={{ width: '32px', height: '32px', background: '#111827', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>+</button></div>
                </div>
              ))}
              {cartItemsArray.length > 0 && <button onClick={() => { if(currentUser.isAnonymous) return logout(); handlePayClick(); }} style={{ width: '100%', padding: '18px', borderRadius: '16px', border: 'none', backgroundColor: '#ea580c', color: '#fff', fontWeight: '900', fontSize: '16px', marginTop: '20px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(234,88,12,0.3)' }}>{t.pay} ({totalAmount} ₸)</button>}
            </div>
          </div>
        )}

        {activeGuestTab === 'profile' && (
          <div className="page-container">
            {currentUser.isAnonymous ? (
              <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '20px', textAlign: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>🎁</div>
                <h2 style={{ margin: '0 0 10px 0', color: '#111827', fontSize: '22px' }}>{lang === 'ru' ? 'Вы не авторизованы' : 'Сіз жүйеге кірмедіңіз'}</h2>
                <p style={{ color: '#6b7280', marginBottom: '20px', fontSize: '14px', lineHeight: '1.4' }}>{lang === 'ru' ? 'Войдите в систему или создайте карту лояльности за 10 секунд, чтобы получать кэшбек с каждого заказа и бронировать столики.' : 'Әр тапсырыстан кэшбек алу және үстелдерді брондау үшін жүйеге кіріңіз немесе 10 секунд ішінде тіркеліңіз.'}</p>
                <button onClick={logout} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#ea580c', color: '#fff', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>{lang === 'ru' ? 'Войти / Создать карту' : 'Кіру / Карта жасау'}</button>
              </div>
            ) : (
              <>
                <div style={{ backgroundColor: '#111827', padding: '25px', borderRadius: '20px', color: '#fff', marginBottom: '20px' }}>
                  <h2 style={{ margin: '0 0 10px 0', color: '#fff' }}>{currentUser.name}</h2>
                  <p style={{ color: '#10b981', fontSize: '24px', fontWeight: '900', margin: 0 }}>Кэшбек: {availableBonuses} ₸</p>
                </div>

                {/* Кнопка выхода — теперь сверху! */}
                <button onClick={logout} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #d1d5db', background: '#fff', color: '#ef4444', fontWeight: 'bold', marginBottom: '15px', cursor: 'pointer' }}>{lang === 'ru' ? 'Выйти из аккаунта' : 'Аккаунттан шығу'}</button>

                <button onClick={handleInstallClick} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: 'none', background: '#3b82f6', color: '#fff', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   📱 {lang === 'ru' ? 'Установить приложение' : 'Қосымшаны орнату'}
                </button>

                <button onClick={() => setShowSupportModal(true)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #3b82f6', background: '#eff6ff', color: '#1d4ed8', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   💬 {lang === 'ru' ? 'Написать разработчикам' : 'Қолдау қызметіне жазу'}
                </button>

                {/* 🔥 НОВЫЙ БЛОК: Оставить отзыв о кафе */}
                <button onClick={() => setShowReviewFromProfile(true)} style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '2px solid #f59e0b', background: '#fef3c7', color: '#b45309', fontWeight: '900', fontSize: '16px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                   ⭐️ {lang === 'ru' ? 'Оставить отзыв о кафе' : 'Кафе туралы пікір қалдыру'}
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
                          o.status === 'transfer_pending' ? (lang === 'ru' ? 'Ожидание проверки оплаты' : 'Төлемді тексеру күтілуде') : 
                          (lang === 'ru' ? `Оплачено (${o.payMethod === 'kaspi' ? 'Kaspi' : 'Наличные'})` : `Төленді (${o.payMethod === 'kaspi' ? 'Kaspi' : 'Қолма-қол'})`)}
                       </p>
                       <p style={{margin: '0 0 5px 0', fontSize: '13px', color: '#4b5563', lineHeight: '1.4'}}>{o.itemsText}</p>
                       <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#9ca3af', marginTop: '10px', borderTop: '1px solid #f3f4f6', paddingTop: '10px'}}>
                          <span>{o.date}</span>
                       </div>
                    </div>
                  ))
                }
              </>
            )}
          </div>
        )}
      </main>

      {!isAnyModalOpen && (
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
      )}
    </div>
  );
}
