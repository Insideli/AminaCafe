const fs = require('fs');
const path = require('path');

// Читаем ваш файл меню (предполагается, что он называется "меню амина.txt" и лежит рядом)
const menuFilePath = path.join(__dirname, 'меню амина.txt');
const outputPath = path.join(__dirname, 'data-generated.js');

console.log('📂 Читаем меню из файла:', menuFilePath);

try {
  const rawData = fs.readFileSync(menuFilePath, 'utf8');
  const menuJson = JSON.parse(rawData);

  // Извлекаем все items из всех групп
  const allItems = [];
  if (menuJson.item_groups) {
    menuJson.item_groups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach(item => {
          // Добавляем только те, которые отмечены как i_useInMenu: 1 (можно убрать фильтр)
          // Если хотите все, уберите условие.
          if (item.i_useInMenu === 1 && item.mark_deleted === 0) {
            allItems.push(item);
          }
        });
      }
    });
  }

  console.log(`✅ Найдено ${allItems.length} активных блюд.`);

  // Генерируем массив объектов для INITIAL_MENU
  const menuItems = allItems.map(item => {
    // Ищем картинку по категории (можно оставить дефолт)
    let img = '🍽️';
    let imgUrl = '""';
    // Здесь можно добавить логику для картинок, но пока оставим пустым
    // Для простоты ставим img по первой букве категории или эмодзи.
    // Я добавлю простой маппинг по названию группы, но если группа неизвестна – оставим 🍽️
    const categoryMap = {
      'Салаты': '🥗',
      'Супы': '🍲',
      'Закуски': '🌮',
      'Пицца': '🍕',
      'Фаст фуд': '🍔',
      'Горячее': '🥩',
      'Гарниры': '🍟',
      'Десерты': '🍰',
      'Напитки': '🥤',
      'Бар': '🍺',
      'Хлеб': '🥖',
      'Соусы': '🥣',
      'Компании': '🍱',
      'Паста': '🍝',
      'Шашлык': '🍢',
      'Доп': '🥖',
      'Завтраки': '🍳',
      'Рыба': '🐟',
      'Гриль': '🔥',
      'Восточные блюда': '🍜',
      // ... можно добавить другие
    };
    // Определяем категорию по group.name
    let category = 'other';
    let groupName = '';
    if (menuJson.item_groups) {
      for (const g of menuJson.item_groups) {
        if (g.items && g.items.some(i => i.object_id === item.object_id)) {
          groupName = g.name;
          break;
        }
      }
    }
    // Маппинг категорий (можно упростить)
    const categoryMapping = {
      'Салаты': 'salads',
      'Супы': 'soups',
      'Закуски': 'snacks',
      'Пицца': 'pizza',
      'Фаст фуд': 'fastfood',
      'Горячее': 'hot',
      'Гарниры': 'hot',
      'Десерты': 'desserts',
      'Напитки': 'drinks',
      'Бар': 'alcohol',
      'Хлеб': 'other',
      'Соусы': 'other',
      'Компании': 'company',
      'Паста': 'pasta',
      'Шашлык': 'hot',
      'Доп': 'other',
      'Завтраки': 'breakfast',
      'Рыба': 'hot',
      'Гриль': 'hot',
      'Восточные блюда': 'hot',
    };
    category = categoryMapping[groupName] || 'other';

    // Получаем эмодзи
    const emoji = categoryMap[groupName] || '🍽️';

    return {
      id: `item_${item.object_id}`,
      name: item.name,
      price: item.price,
      ingredients: item.description || '',
      img: emoji,
      imgUrl: '',
      category: category,
      isStop: false,
      stopReason: '',
      paloma_id: item.object_id, // сразу проставляем object_id
    };
  });

  // Формируем содержимое data.js
  const fileContent = `
import { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot, setDoc } from "firebase/firestore";

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

export const INITIAL_MENU = ${JSON.stringify(menuItems, null, 2)};

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
  { id: 'other', name: 'Доп', icon: '🥖' },
  { id: 'desserts', name: 'Десерты', icon: '🍰' },
  { id: 'breakfast', name: 'Завтраки', icon: '🍳' },
  { id: 'pasta', name: 'Паста', icon: '🍝' },
];

export const STORIES = [
  { id: 1, title: "🔥 Сэты", emoji: "🍱", color: "linear-gradient(45deg, #f59e0b, #ef4444)" },
  { id: 2, title: "👨‍🍳 На гриле", emoji: "🥩", color: "linear-gradient(45deg, #10b981, #3b82f6)" },
  { id: 3, title: "🥤 Напитки", emoji: "🍹", color: "linear-gradient(45deg, #8b5cf6, #ec4899)" }
];

export const INITIAL_TABLES = [
  // ... (ваши столы, я их не трогаю, они должны быть в вашем файле, но я оставлю заглушку, чтобы не потерять)
  // Если у вас были столы в data.js, скопируйте их сюда, или я оставлю пустой массив.
];

export const STATION_MAP = {
  hot: ['soups', 'hot', 'company', 'pizza', 'fastfood', 'pasta'],
  cold: ['salads', 'snacks', 'other', 'desserts'],
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
`;

  fs.writeFileSync(outputPath, fileContent, 'utf8');
  console.log(`✅ Файл data-generated.js успешно создан! Размер: ${fs.statSync(outputPath).size} байт.`);
  console.log(`📋 Скопируйте его содержимое в ваш data.js или переименуйте.`);

} catch (error) {
  console.error('❌ Ошибка:', error.message);
}
