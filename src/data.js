import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";
import { fetchPalomaMenu } from './paloma.js';

// Firebase config (ваш)
const firebaseConfig = { /* ... */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ... (ваши картинки)

export const INITIAL_MENU = [
  // ... все ваши блюда с paloma_id: 0
]; // Убедитесь, что массив закрыт правильно!

// ========== ЭКСПОРТЫ (ОБЯЗАТЕЛЬНО ДОЛЖНЫ БЫТЬ) ==========
export const CATEGORIES = [
  { id: 'all', name: 'Все', icon: '🍽️' },
  { id: 'salads', name: 'Салаты', icon: '🥗' },
  { id: 'soups', name: 'Супы', icon: '🍲' },
  { id: 'snacks', name: 'Закуски', icon: '🌮' },
  { id: 'pizza', name: 'Пицца', icon: '🍕' },
  { id: 'fastfood', name: 'Фаст Фуд', icon: '🍔' },
  { id: 'hot', name: 'Горячее', icon: '🥩' },
  { id: 'company', name: 'Компании', icon: '🍱' },
  { id: 'drinks', name: 'Напитки', icon: '🍹' },
  { id: 'alcohol', name: 'Бар', icon: '🍺' },
  { id: 'other', name: 'Доп', icon: '🥖' }
];

export const STORIES = [
  { id: 1, title: "🔥 Сэты", emoji: "🍱", color: "linear-gradient(45deg, #f59e0b, #ef4444)" },
  { id: 2, title: "👨‍🍳 На гриле", emoji: "🥩", color: "linear-gradient(45deg, #10b981, #3b82f6)" },
  { id: 3, title: "🥤 Напитки", emoji: "🍹", color: "linear-gradient(45deg, #8b5cf6, #ec4899)" }
];

export const INITIAL_TABLES = [
  // ... ваш массив столов (39 объектов)
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

// ========== ФУНКЦИЯ СИНХРОНИЗАЦИИ ==========
export async function syncMenuWithPaloma(menu, setMenu) {
  try {
    const palomaData = await fetchPalomaMenu();
    const palomaItems = [];
    if (palomaData.item_groups) {
      palomaData.item_groups.forEach(group => {
        if (group.items) {
          group.items.forEach(item => {
            if (item.mark_deleted === 0 && item.i_useInMenu === 1) {
              palomaItems.push(item);
            }
          });
        }
      });
    }
    const updatedMenu = menu.map(localItem => {
      const found = palomaItems.find(p => p.name.trim().toLowerCase() === localItem.name.trim().toLowerCase());
      return { ...localItem, paloma_id: found ? found.object_id : 0 };
    });
    setMenu(updatedMenu);
    return updatedMenu;
  } catch (error) {
    console.error('Ошибка синхронизации меню с Paloma:', error);
    return menu;
  }
}

// ========== ХУК ==========
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
