import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

// ТВОИ КЛЮЧИ FIREBASE
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
const db = getFirestore(app);

// КРАСИВЫЕ ФОТОГРАФИИ ДЛЯ МЕНЮ (Теперь они экспортируются)
export const P_SALAD = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80";
export const P_SOUP = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=80";
export const P_PIZZA = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80";
export const P_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
export const P_MEAT = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=300&q=80";
export const P_CHICKEN = "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=300&q=80";
export const P_PASTA = "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=300&q=80";
export const P_DRINK = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80";
export const P_BEER = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=300&q=80";
export const P_SNACK = "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=300&q=80";
export const P_KHACHAPURI = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80";

export const INITIAL_MENU = [
  // Ваши начальные данные остаются здесь на всякий случай
  { id: "s1", name: "Салат свежий", price: 1880, ingredients: "помидоры, огурцы, лук, перец светофор, микс салата", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "sp1", name: "Суп лапша с курицей", price: 1580, ingredients: "куриный бульон с курицей и домашней лапшой", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
];

export const CATEGORIES = [
  { id: 'all', name: 'Все', icon: '🍽️' }, { id: 'salads', name: 'Салаты', icon: '🥗' },
  { id: 'soups', name: 'Супы', icon: '🍲' }, { id: 'snacks', name: 'Закуски', icon: '🌮' },
  { id: 'pizza', name: 'Пицца', icon: '🍕' }, { id: 'fastfood', name: 'Фаст Фуд', icon: '🍔' },
  { id: 'hot', name: 'Горячее', icon: '🥩' }, { id: 'company', name: 'Компании', icon: '🍱' }, 
  { id: 'drinks', name: 'Напитки', icon: '🍹' }, { id: 'alcohol', name: 'Бар', icon: '🍺' },
  { id: 'other', name: 'Доп', icon: '🥖' }
];

export const STORIES = [
  { id: 1, title: "🔥 Сэты", emoji: "🍱", color: "linear-gradient(45deg, #f59e0b, #ef4444)" },
  { id: 2, title: "👨‍🍳 На гриле", emoji: "🥩", color: "linear-gradient(45deg, #10b981, #3b82f6)" },
  { id: 3, title: "🥤 Напитки", emoji: "🍹", color: "linear-gradient(45deg, #8b5cf6, #ec4899)" }
];

export const INITIAL_TABLES = [
  { id: 1, group: "Белый зал", type: "table", name: "Стол 1 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 2, group: "Белый зал", type: "table", name: "Стол 2 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 3, group: "Белый зал", type: "table", name: "Стол 3 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 4, group: "Белый зал", type: "table", name: "Стол 4 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 5, group: "Белый зал", type: "table", name: "Стол 5 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 6, group: "Белый зал", type: "table", name: "Стол 6 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 7, group: "Белый зал", type: "table", name: "Стол 7 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 8, group: "Белый зал", type: "table", name: "Стол 8 (Белый зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 9, group: "Красный зал", type: "table", name: "Стол 9 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 10, group: "Красный зал", type: "table", name: "Стол 10 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 11, group: "Красный зал", type: "table", name: "Стол 11 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 12, group: "Красный зал", type: "table", name: "Стол 12 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 13, group: "Красный зал", type: "table", name: "Стол 13 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 14, group: "Красный зал", type: "table", name: "Стол 14 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 15, group: "Красный зал", type: "table", name: "Стол 15 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 16, group: "Красный зал", type: "table", name: "Стол 16 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 17, group: "Красный зал", type: "table", name: "Стол 17 (Красный зал)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 18, group: "Кальянный зал", type: "table", name: "Стол 18 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 19, group: "Кальянный зал", type: "table", name: "Стол 19 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 20, group: "Кальянный зал", type: "table", name: "Стол 20 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 21, group: "Кальянный зал", type: "table", name: "Стол 21 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 22, group: "Кальянный зал", type: "table", name: "Стол 22 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 23, group: "Кальянный зал", type: "table", name: "Стол 23 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 24, group: "Кальянный зал", type: "table", name: "Стол 24 (Кальянный)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 25, group: "Летник", type: "table", name: "Стол 25 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 26, group: "Летник", type: "table", name: "Стол 26 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 27, group: "Летник", type: "table", name: "Стол 27 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 28, group: "Летник", type: "table", name: "Стол 28 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 29, group: "Летник", type: "table", name: "Стол 29 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 30, group: "Летник", type: "table", name: "Стол 30 (Летник)", seats: 4, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 31, group: "Тапчаны", type: "tapchan", name: "Топчан 31", seats: 8, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 32, group: "Тапчаны", type: "tapchan", name: "Топчан 32", seats: 8, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 33, group: "Тапчаны", type: "tapchan", name: "Топчан 33", seats: 8, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 34, group: "Тапчаны", type: "tapchan", name: "Топчан 34", seats: 8, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 35, group: "Кабинки", type: "cabin", name: "Кабинка 1 (Нават)", seats: 6, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 36, group: "Кабинки", type: "cabin", name: "Кабинка 2 (Космос)", seats: 6, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 37, group: "Кабинки", type: "cabin", name: "Кабинка 3 (Томирис)", seats: 6, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 38, group: "Кабинки", type: "cabin", name: "Кабинка 4 (Цветочная)", seats: 6, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null },
  { id: 39, group: "Кабинки", type: "cabin", name: "Кабинка 5 (Гараж)", seats: 6, status: "free", bookedBy: null, bookedTime: null, isCalling: false, isCallingForBill: false, imgUrl: "", servedBy: null }
];

export const STATION_MAP = { 
  hot: ['soups', 'hot', 'company', 'pizza', 'fastfood', 'pasta'], 
  cold: ['salads', 'snacks', 'other'], 
  bar: ['drinks', 'alcohol'],
  mangal: ['hot']
};

export const INITIAL_CUSTOMERS = { "77075375180": { phone: "77075375180", name: "Або Босс", bonuses: 500, totalSpent: 10000, sessionToken: null } };

export const INITIAL_ROLES = { 
  "001002003": { role: "admin", name: "Директор Эльвира", password: "Админ Амина", onShift: true, schedule: "ПН-ПТ", isSenior: false, sessionToken: null }, 
  "02180": { role: "developer", name: "Разработчик (Ваце)", password: "005", onShift: true, schedule: "24/7", isSenior: true, sessionToken: null },
  "002005008": { role: "chef", name: "Шеф Повар", password: "Шеф повар Амина", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null },
  "77772222222": { role: "waiter", name: "Официант Али (Старший)", password: "123", schedule: "2/2", onShift: true, kaspi: "77072223344", isSenior: true, sessionToken: null },
  "009009009": { role: "cashier", name: "Кассир Мадина", password: "КАССА", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null }
};

export const INITIAL_SUPPORT = [];

// СИНХРОНИЗАЦИЯ С ОБЛАКОМ GOOGLE ФАЙРБЕЙЗ
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const docRef = doc(db, "amina_db", key);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setValue(docSnap.data().data);
      } else {
        setDoc(docRef, { data: initialValue });
        setValue(initialValue);
      }
    });
    return () => unsubscribe();
  }, [key]);

  const updateValue = (newValue) => {
    const valueToStore = typeof newValue === 'function' ? newValue(value) : newValue;
    setValue(valueToStore);
    setDoc(doc(db, "amina_db", key), { data: valueToStore });
  };

  return [value, updateValue];
}
