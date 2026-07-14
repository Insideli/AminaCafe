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

// КРАСИВЫЕ ФОТОГРАФИИ ДЛЯ МЕНЮ
const P_SALAD = "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=300&q=80";
const P_SOUP = "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=300&q=80";
const P_PIZZA = "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=300&q=80";
const P_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=300&q=80";
const P_MEAT = "https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=300&q=80";
const P_CHICKEN = "https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&w=300&q=80";
const P_PASTA = "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=300&q=80";
const P_DRINK = "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=300&q=80";
const P_BEER = "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=300&q=80";
const P_SNACK = "https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=300&q=80";
const P_KHACHAPURI = "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80";

export const INITIAL_MENU = [
  { id: "s1", name: "Салат свежий", price: 1880, ingredients: "помидоры, огурцы, лук, перец светофор, микс салата", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s2", name: "Салат с уткой и ананасом", price: 2780, ingredients: "филе утки, помидор, ананас, лист салата, шпинат, руккола, миндаль", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s3", name: "Салат Греческий", price: 2380, ingredients: "помидоры, огурцы, перец светофор, маслины, брынза, оливковое масло", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s4", name: "Салат «Властелин колец»", price: 2760, ingredients: "кабачки, лук, микс салат, помидор, брынза, утка, соус бульгоги", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s5", name: "Салат Азия микс", price: 2880, ingredients: "телятина, кабачки-баклажаны в кляре, огурцы, перец, медово-соевый соус", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s6", name: "Салат теплый с курицей", price: 2880, ingredients: "кабачок, баклажан, помидор, микс салата, филе куриное, свит чили", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s7", name: "Салат с жареными баклажанами", price: 2870, ingredients: "баклажаны, брынза, шампиньоны, помидоры, зелень, арахис", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s8", name: "Салат с Авокадо и креветками", price: 2880, ingredients: "креветки тигровые, авокадо, помидор, микс салата с рукколой, моцарелла", img: "🦐", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s9", name: "Салат Астория", price: 2880, ingredients: "микс салат, руккола, зеленое яблоко, черри, семга, моцарелла", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s10", name: "Салат гнездо глухаря", price: 2580, ingredients: "картофель, огурец соленый, курица, яйцо, кукуруза, картофель пай", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s11", name: "Салат от Шефа", price: 2880, ingredients: "телятина в имбирном соусе, микс салата, помидоры, огурцы, кабачки", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s12", name: "Салат с пикантными баклажанами", price: 2860, ingredients: "обжаренные баклажаны, помидоры, сыр тофу, грибы эноки", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s13", name: "Салат Пекинский", price: 2780, ingredients: "телятина, огурцы, помидоры, перец, морковь, соевый соус", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s14", name: "Салат Грузинский", price: 2860, ingredients: "язык телячий, помидоры, грибы вешенки, опята, лук красный", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s15", name: "Салат с семгой и рукколой", price: 2820, ingredients: "сёмга малосольная, помидор, апельсин, творожный сыр, руккола", img: "🐟", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s16", name: "Салат с креветками и рукколой", price: 2880, ingredients: "креветки, помидор, апельсин, творожный сыр, руккола", img: "🦐", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s17", name: "Цезарь с курицей", price: 2580, ingredients: "салат айсберг, помидоры, сухарики, яйцо, соус цезарь, сыр пармезан, куриное филе", img: "🥬", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s18", name: "Цезарь с сёмгой", price: 2780, ingredients: "салат айсберг, помидоры, сухарики, яйцо, соус цезарь, сёмга", img: "🥬", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s19", name: "Цезарь с креветками", price: 2880, ingredients: "салат айсберг, помидоры, сухарики, соус цезарь, креветки", img: "🥬", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s20", name: "Салат Дамский каприз", price: 2670, ingredients: "куриное филе, ананас, грецкий орех, майонез, сыр", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s21", name: "Салат Малибу", price: 2780, ingredients: "копченая курица, помидор, сыр, микс салата, майонез, сухарики", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s22", name: "Оливье", price: 2350, ingredients: "говядина, картофель, морковь, яйцо, горошек, майонез, огурцы", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s23", name: "Салат Царский", price: 2780, ingredients: "семга копченая, картофель, морковь, горошек, огурцы, майонез", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s24", name: "Салат мужской каприз", price: 2770, ingredients: "курица, говядина, шампиньоны, лук, майонез, картофель пай", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s25", name: "Салат Темпура", price: 2760, ingredients: "курица, цветная капуста, цуккини, помидоры, свит чили соус", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s26", name: "Баклажан по - Азиатски", price: 2680, ingredients: "баклажаны, помидоры, соус свит чили, кинза, кунжут", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },
  { id: "s27", name: "Салат Свекольный микс", price: 2860, ingredients: "руккола, креветки тигровые, свекла, апельсин, творожный сыр", img: "🥗", imgUrl: P_SALAD, category: "salads", isStop: false, stopReason: "" },

  // СУПЫ
  { id: "sp1", name: "Суп лапша с курицей", price: 1580, ingredients: "куриный бульон с курицей и домашней лапшой", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp2", name: "Сорпа с говядиной", price: 1880, ingredients: "говяжьи ребра, картофель, бульон, лук", img: "🍲", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp3", name: "Пельмени по-домашнему", price: 1880, ingredients: "пельмени с говядиной по-домашнему, сметана", img: "🥟", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp4", name: "Рамён с говядиной", price: 2650, ingredients: "лапша, бульон, грибы, перец, яйцо, говядина", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp5", name: "Рамён с курицей", price: 2450, ingredients: "лапша, бульон, грибы, перец, яйцо, курица", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp6", name: "Рамён с сёмгой", price: 2780, ingredients: "лапша, бульон, грибы, перец, яйцо, сёмга", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp7", name: "Рамён сырный", price: 2450, ingredients: "лапша, бульон, грибы, сыр, овощи", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp8", name: "Том ям с курицей", price: 2400, ingredients: "тайский острый суп с грибами и курицей", img: "🍲", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp9", name: "Том ям с креветками", price: 2660, ingredients: "тайский острый суп с грибами и креветками", img: "🍲", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp10", name: "Том ям с морепродуктами", price: 2870, ingredients: "тайский острый суп с грибами, креветками и мидиями", img: "🍲", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp11", name: "Солянка сборная", price: 1880, ingredients: "телятина, ветчина, говядина копченая, сосиски охотничьи", img: "🥘", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp12", name: "Хаш с бараниной", price: 2480, ingredients: "густой бульон, чеснок, баранина, зелень, лаваш", img: "🍲", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp13", name: "Чечевичный крем суп", price: 1870, ingredients: "чечевица, картофель, морковь, лук, томат, сухарики", img: "🥣", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },
  { id: "sp14", name: "Острый суп с телятиной", price: 2450, ingredients: "телятина, бульон, соевый соус, перец чили, тесто", img: "🍜", imgUrl: P_SOUP, category: "soups", isStop: false, stopReason: "" },

  // ЗАКУСКИ
  { id: "z1", name: "Хачапури с сыром", price: 1880, ingredients: "мини хачапури с нежным сыром", img: "🧀", imgUrl: P_KHACHAPURI, category: "snacks", isStop: false, stopReason: "" },
  { id: "z2", name: "Хачапури с сыром и зеленью", price: 1880, ingredients: "мини хачапури с сыром и свежей зеленью", img: "🧀", imgUrl: P_KHACHAPURI, category: "snacks", isStop: false, stopReason: "" },
  { id: "z3", name: "Хачапури с двойным сыром", price: 2480, ingredients: "лодочка с увеличенной порцией сыра", img: "🧀", imgUrl: P_KHACHAPURI, category: "snacks", isStop: false, stopReason: "" },
  { id: "z4", name: "Хачапури по Аджарски", price: 2680, ingredients: "хрустящее тесто, лодочка с сулугуни и желтком", img: "🧀", imgUrl: P_KHACHAPURI, category: "snacks", isStop: false, stopReason: "" },
  { id: "z5", name: "Хачапури ассорти", price: 4780, ingredients: "ассорти из всех видов хачапури", img: "🧀", imgUrl: P_KHACHAPURI, category: "snacks", isStop: false, stopReason: "" },
  { id: "z6", name: "Кесадилья с курицей", price: 1880, ingredients: "тортилья, филе куриное, шампиньоны, моцарелла, сальса", img: "🌮", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z7", name: "Кесадилья с говядиной", price: 2350, ingredients: "тортилья, говядина, шампиньоны, моцарелла, сальса", img: "🌮", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z8", name: "Крылья в темпуре острые", price: 1880, ingredients: "7 шт куриных крыльев в хрустящей острой панировке", img: "🍗", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z9", name: "Крылья терияки", price: 1880, ingredients: "7 шт крыльев обжаренных во фритюре с соусом терияки", img: "🍗", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z10", name: "Наггетсы", price: 1880, ingredients: "7 шт хрустящих куриных наггетсов", img: "🍗", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z11", name: "Сырные палочки/шарики", price: 2260, ingredients: "5 шт хрустящих сырных шариков", img: "🧆", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z12", name: "Кавказская закуска", price: 2470, ingredients: "помидоры, огурцы, брынза, маслины, перец, зелень", img: "🥒", imgUrl: P_SALAD, category: "snacks", isStop: false, stopReason: "" },
  { id: "z13", name: "Русская закуска", price: 2680, ingredients: "селедка, огурцы маринованные, картофель, капуста, зелень", img: "🐟", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z14", name: "Разносол по-домашнему", price: 2680, ingredients: "огурчики, помидорки, патиссоны, квашеная капуста", img: "🥒", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z15", name: "Ассорти закусок", price: 3850, ingredients: "баклажан с сыром, филе утки, селедка, кимчи", img: "🍱", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z16", name: "Мясное ассорти", price: 4450, ingredients: "говядина, казы, говядина копченая", img: "🥩", imgUrl: P_MEAT, category: "snacks", isStop: false, stopReason: "" },
  { id: "z17", name: "Рыбное ассорти", price: 4680, ingredients: "семга, балык, скумбрия, тарталетка с икрой", img: "🐟", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z18", name: "Ассорти сосисок", price: 2880, ingredients: "охотничьи, сардельки, куриные сосиски, картофель", img: "🌭", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z19", name: "Мини чебуреки", price: 2180, ingredients: "7 шт мини чебуреков со сметаной и аджикой", img: "🥟", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z20", name: "Пивные креветки", price: 2880, ingredients: "обжаренные тигровые креветки к пиву", img: "🦐", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z21", name: "Пивное ассорти", price: 2880, ingredients: "крылья терияки, наггетсы, сырные шарики, сухарики, чечил, чипсы", img: "🥨", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z22", name: "Пивной Сет №1", price: 4050, ingredients: "колбаски, крендельки, чипсы, курт, чечил, гарлики", img: "🍻", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z23", name: "Пивной Сет №2", price: 3000, ingredients: "фисташки, чечил, гарлики, чипсы, курт", img: "🍻", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z24", name: "Пивной Сет №3", price: 3000, ingredients: "цветной арахис, кириешки, кальмары, чечил", img: "🍻", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z25", name: "Пивной Сет №4", price: 2100, ingredients: "цветной арахис, арахис соленый, фисташки", img: "🍻", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },
  { id: "z26", name: "Сет Gradus Haus", price: 4400, ingredients: "арахис, колбаски, чечил, крылья, рыбная соломка + Пиво 1л", img: "🍻", imgUrl: P_SNACK, category: "snacks", isStop: false, stopReason: "" },

  // ПАСТА
  { id: "p1", name: "Паста Альфредо", price: 2480, ingredients: "фетучини, сливочный соус, грибы, курица, пармезан", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },
  { id: "p2", name: "Паста с сёмгой", price: 2780, ingredients: "фетучини, сёмга, помидор, шпинат, сливочный соус", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },
  { id: "p3", name: "Паста с креветками", price: 2780, ingredients: "фетучини, креветки тигровые, чеснок, базилик, помидор, сливки", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },
  { id: "p4", name: "Паста с телятиной и грибами", price: 2680, ingredients: "телятина, грибы, чеснок, лук, бульон, сливки, фетучини", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },
  { id: "p5", name: "Паста с морепродуктами", price: 2880, ingredients: "кальмар, осьминог, мидии, сёмга, соус биск, фетучини", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },
  { id: "p6", name: "Паста карбонара с уткой", price: 2850, ingredients: "фетучини, филе утки копченое, сливки, сыр", img: "🍝", imgUrl: P_PASTA, category: "pasta", isStop: false, stopReason: "" },

  // ПИЦЦА
  { id: "pz1", name: "Пицца Маргарита", price: 2200, ingredients: "тесто, соус томатный, сыр моцарелла, помидоры", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz2", name: "Пицца Грибная", price: 2450, ingredients: "тесто, соус томатный, сыр моцарелла, грибы", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz3", name: "Пицца Мексиканская", price: 2750, ingredients: "фарш говяжий, лук, перец, перец чили, моцарелла", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz4", name: "Пицца Пепперони", price: 2350, ingredients: "тесто, соус томатный, сыр моцарелла, салями", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz5", name: "Детская с сосисками", price: 2350, ingredients: "соус томатный, сыр моцарелла, сосиски детские", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz6", name: "С курицей и грибами", price: 2450, ingredients: "соус томатный, сыр моцарелла, грибы, филе куриное", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz7", name: "Пицца Куриная", price: 2450, ingredients: "тесто, соус томатный, сыр моцарелла, филе куриное", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz8", name: "Пицца Верона", price: 2450, ingredients: "грибы, салями, лук красный, перец светофор, помидоры", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz9", name: "Колбасный микс", price: 2450, ingredients: "ветчина говяжья, салями, сосиски, моцарелла", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz10", name: "Четыре сезона", price: 2750, ingredients: "салями, помидоры, шампиньоны, курица, моцарелла", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz11", name: "Пицца барбекю с уткой", price: 2650, ingredients: "копченая утка, помидоры черри, руккола, моцарелла", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },
  { id: "pz12", name: "Салями с грибами (острая)", price: 2740, ingredients: "салями, шампиньоны, острый соус, моцарелла", img: "🍕", imgUrl: P_PIZZA, category: "pizza", isStop: false, stopReason: "" },

  // ФАСТ ФУД
  { id: "ff1", name: "Гамбургер с говядиной", price: 1350, ingredients: "булочка, котлета говяжья, помидоры, огурцы, соус, айсберг", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff2", name: "Чизбургер с говядиной", price: 1480, ingredients: "булочка, сыр, котлета говяжья, помидоры, огурцы", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff3", name: "Двойной чизбургер (говядина)", price: 1880, ingredients: "булочка, сыр, двойная котлета говяжья, помидоры", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff4", name: "Гамбургер с курицей", price: 1150, ingredients: "булочка, котлета куриная, помидоры, огурцы, соус", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff5", name: "Чизбургер с курицей", price: 1350, ingredients: "булочка, сыр, котлета куриная, помидоры, огурцы", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff6", name: "Двойной чизбургер (курица)", price: 1780, ingredients: "булочка, сыр, двойная котлета куриная, помидоры", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff7", name: "Донер куриный", price: 1550, ingredients: "куриное филе на мангале, лаваш, соус, огурцы, фри", img: "🌯", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff8", name: "Пицца донер с курицей", price: 2280, ingredients: "сыр, картофель фри, помидоры, куриное филе, соус", img: "🍕", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff9", name: "Донер с люля-кебаб", price: 1650, ingredients: "люля-кебаб на мангале, лаваш, соус, огурцы, фри", img: "🌯", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff10", name: "Мангал-Бургер с курицей", price: 1550, ingredients: "булочка, куриное филе обжаренное на мангале, овощи", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },
  { id: "ff11", name: "Мангал-Бургер с люля-кебаб", price: 1650, ingredients: "булочка, люля-кебаб обжаренная на мангале, овощи", img: "🍔", imgUrl: P_BURGER, category: "fastfood", isStop: false, stopReason: "" },

  // ГОРЯЧЕЕ
  { id: "h1", name: "Шницель под сыром", price: 2780, ingredients: "куриное филе в панировке, запеченное под сыром", img: "🍗", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h2", name: "Жульен с курицей", price: 2650, ingredients: "куриное филе в сливочном соусе, картофельное пюре, сыр", img: "🍲", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h3", name: "Котлета Киевская", price: 1850, ingredients: "куриное филе со сливочным маслом и зеленью в сухарях", img: "🍗", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h4", name: "Цыпленок табака", price: 2650, ingredients: "цыпленок обжаренный со сливочным маслом, картофель", img: "🍗", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h5", name: "Филе цыпленка Веллингтон", price: 2880, ingredients: "куриное филе со сливочным сыром и грибами в тесте", img: "🍗", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h6", name: "Биточки куриные в грибном соусе", price: 1850, ingredients: "нежные куриные котлеты с грибным соусом", img: "🧆", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h7", name: "Курица в сливочно-грибном соусе", price: 2630, ingredients: "филе куриное, шампиньоны, лук, сливки", img: "🍲", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h8", name: "Курица в кисло-сладком соусе", price: 2560, ingredients: "куриное филе, кисло-сладкий соус, лук, перец", img: "🍗", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h9", name: "Филе куриное по-Итальянски", price: 2670, ingredients: "куриное филе, шпинат, помидор, картофель, песто, сыр", img: "🥘", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h10", name: "Бефстроганов с говядиной", price: 2880, ingredients: "говядина обжаренная с луком и грибами в сливках", img: "🍲", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h11", name: "Фрикадельки с телятины BBQ", price: 2680, ingredients: "фарш с телятины, соус барбекю, картофельное пюре", img: "🧆", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h12", name: "Мясо по-тайски", price: 2880, ingredients: "говядина, лук, чеснок, перец, сельдерей, тайский соус", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h13", name: "Мясной рулет со сливочным сыром", price: 2680, ingredients: "рулет с телятины в панировке с нежным сыром", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h14", name: "Говядина на жаровне (острая)", price: 2780, ingredients: "говядина, перец, лук, кабачки, чили", img: "🥘", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h15", name: "Биточки из телятины в грибном соусе", price: 2680, ingredients: "котлеты из телятины, лук, шампиньоны, сливки", img: "🧆", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h16", name: "Казан кебаб", price: 2780, ingredients: "говядина жаренная с луком и специями", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h17", name: "Телятина по-монастырски", price: 2780, ingredients: "телятина, грибы, лук, сливки, картофель, сыр", img: "🍲", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h18", name: "Куырдак с говядиной", price: 3680, ingredients: "томлёные говяжьи рёбрышки с луком и картофелем", img: "🥘", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h19", name: "Бифштекс Дуэт", price: 2680, ingredients: "котлета говяжья, котлета куриная, грибы, яйцо", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h20", name: "Острые томленые ребра телятины", price: 3680, ingredients: "телячьи ребра, перец полу горький, кабачки, лук", img: "🍖", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h21", name: "Баранина с овощами в горшочке", price: 2680, ingredients: "баранина томленая, перец, картофель, соус", img: "🍲", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h22", name: "Ребра баранины с овощами гриль", price: 3560, ingredients: "антрекот баранины на гриле с овощами", img: "🍖", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h23", name: "Куырдак с бараниной", price: 3660, ingredients: "кусочки баранины томлёные с луком и картофелем", img: "🥘", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h24", name: "Стейк из ягнёнка", price: 3570, ingredients: "стейк с ножки ягнёнка с соусом BBQ и картофелем", img: "🍖", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h25", name: "Каре ягнёнка", price: 3650, ingredients: "антрекот ягнёнка в тесте фило с грибным соусом", img: "🍖", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h26", name: "Лагман Гуйру", price: 1880, ingredients: "лапша, говядина, перец, лук, сельдерей, специи", img: "🍜", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h27", name: "Лагман Цо Мян (жаренный)", price: 1880, ingredients: "лапша жаренная, говядина, перец, лук, сельдерей", img: "🍜", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h28", name: "Лагман Суйру (домашний)", price: 1870, ingredients: "лапша домашняя, говядина, овощи, бульон", img: "🍜", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h29", name: "Фри с мясом", price: 2670, ingredients: "картофель фри, обжаренная говядина", img: "🍟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h30", name: "Стейк сёмги", price: 4880, ingredients: "стейк из красной рыбы приготовленный на гриле", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h31", name: "Форель речная", price: 3180, ingredients: "форель жаренная на сковороде или на мангале", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h32", name: "Форель запечёная в печи", price: 3560, ingredients: "форель запечённая с овощами и картофелем", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h33", name: "Рыбные котлеты с икорным соусом", price: 2750, ingredients: "котлеты из белой рыбы с икорно-лимонным соусом", img: "🧆", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h34", name: "Скумбрия на мангале", price: 3650, ingredients: "скумбрия на открытом огне с миксом салата", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h35", name: "Скумбрия запечённая с овощами", price: 3850, ingredients: "скумбрия, лук, помидоры, перец, кабачки", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h36", name: "Филе судака в кисло сладком соусе", price: 2880, ingredients: "судак, перец светофор, кисло-сладкий соус, кунжут", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h37", name: "Судак в панировке под сыром", price: 3380, ingredients: "филе судака в сухарях запечённая под сыром", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h38", name: "Стейк семги под сыром", price: 4880, ingredients: "стейк сёмги запечённый в печи под сыром", img: "🐟", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h39", name: "Стейк Тибон", price: 5680, ingredients: "стейк на Т-образной кости, подаётся с салатом", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h40", name: "Стейк Рибай", price: 5870, ingredients: "стейк антрекот говяжий на рёберной кости", img: "🥩", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h41", name: "Сковорода от шефа", price: 5180, ingredients: "вырезка тонкий край с картофелем и грибами", img: "🥘", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h42", name: "Колбаски куриные", price: 2250, ingredients: "куриные колбаски на гриле с картофелем", img: "🌭", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "h43", name: "Колбаски из Говядины", price: 2580, ingredients: "говяжьи колбаски на гриле с картофелем", img: "🌭", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h44", name: "Колбаски из Баранины", price: 2670, ingredients: "бараньи колбаски на гриле с картофелем", img: "🌭", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "h45", name: "Ассорти колбасок", price: 6170, ingredients: "бараньи, говяжьи, куриные колбаски на гриле", img: "🌭", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },

  // ГАРНИРЫ
  { id: "g1", name: "Картофельное пюре", price: 580, ingredients: "гарнир", img: "🥔", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g2", name: "Рис", price: 530, ingredients: "гарнир", img: "🍚", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g3", name: "Цветной рис", price: 680, ingredients: "гарнир с овощами", img: "🍚", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g4", name: "Овощи гриль", price: 980, ingredients: "гриль овощи", img: "🍆", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g5", name: "Картофель фри (пол порции)", price: 680, ingredients: "хрустящий фри", img: "🍟", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g6", name: "Картофель фри (порция)", price: 850, ingredients: "хрустящий фри", img: "🍟", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g7", name: "Стрючковая фасоль с чесноком", price: 580, ingredients: "гарнир", img: "🫛", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g8", name: "Картофель по-домашнему", price: 580, ingredients: "жареный с луком", img: "🥔", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "g9", name: "Картофель по-деревенски", price: 580, ingredients: "с чесноком и луком", img: "🥔", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },

  // ШАШЛЫКИ
  { id: "sh1", name: "Шашлык Антрекот", price: 1870, ingredients: "сочный шашлык на мангале", img: "🍢", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "sh2", name: "Шашлык Баранина", price: 1580, ingredients: "кусочки баранины на мангале", img: "🍢", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "sh3", name: "Шашлык Ребра", price: 1680, ingredients: "ребрышки на мангале", img: "🍢", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "sh4", name: "Шашлык Люля-кебаб", price: 1250, ingredients: "люля-кебаб из рубленого мяса", img: "🍢", imgUrl: P_MEAT, category: "hot", isStop: false, stopReason: "" },
  { id: "sh5", name: "Шашлык Утка", price: 1150, ingredients: "мясо утки на мангале", img: "🍢", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "sh6", name: "Шашлык Филе куриное", price: 1150, ingredients: "куриное филе на мангале", img: "🍢", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "sh7", name: "Шашлык Крылышки", price: 980, ingredients: "куриные крылышки на мангале", img: "🍢", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "sh8", name: "Шашлык Окорочка", price: 980, ingredients: "куриные окорочка на мангале", img: "🍢", imgUrl: P_CHICKEN, category: "hot", isStop: false, stopReason: "" },
  { id: "sh9", name: "Шашлык Шампиньоны", price: 980, ingredients: "грибы на мангале", img: "🍢", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },
  { id: "sh10", name: "Шашлык Овощной", price: 980, ingredients: "овощи на мангале", img: "🍢", imgUrl: P_SNACK, category: "hot", isStop: false, stopReason: "" },

  // КОМПАНИИ
  { id: "c1", name: "Манты с говядиной", price: 11800, ingredients: "сочные манты с рубленной говядиной", img: "🥟", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c2", name: "Дапанджи с курицей (5 чел)", price: 10760, ingredients: "курица с овощами, специи, лук, картофель", img: "🥘", imgUrl: P_CHICKEN, category: "company", isStop: false, stopReason: "" },
  { id: "c3", name: "Бешбармак из конины (5 чел)", price: 15860, ingredients: "жая, казы, сочни, лук", img: "🍲", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c4", name: "Садж ассорти", price: 24780, ingredients: "баранина, телятина, цыплёнок, курдюк, овощи", img: "🥘", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c5", name: "Ассорти Султана (8-10 чел)", price: 27880, ingredients: "мега-ассорти: 4 баранины, 4 люля-кебаб, крылья, антрекоты", img: "👑", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c6", name: "Грузинский сэт (4-5 чел)", price: 15350, ingredients: "хачапури, 2 люля-кебаб, крылья, утиные грудки", img: "🍱", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c7", name: "Шашлык дОС (5-6 чел)", price: 18860, ingredients: "баранина, куриное филе, люля-кебаб, крылья, шампиньоны", img: "🍢", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c8", name: "Микс гриль (5 чел)", price: 21780, ingredients: "стейк тибон, рибай, люля кебаб, шницель, крылья", img: "🥩", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c9", name: "Ассорти морепродуктов", price: 14860, ingredients: "креветки, мидии, рыбные палочки, кольца кальмара", img: "🦐", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c10", name: "Микс разгуляй (8 чел)", price: 28650, ingredients: "рибай, тибон, люля, баранина, цыпленок табака", img: "🍗", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c11", name: "Мечта рыбака (5 чел)", price: 28880, ingredients: "стейк сёмги, скумбрия, форель, судак, тарталетка", img: "🐟", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c12", name: "Ханский размах (10 чел)", price: 34870, ingredients: "колбаски, крылья, тибон, рибай, оссобуко, ребра", img: "👑", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },
  { id: "c13", name: "Мега ассорти барбекю (15 чел)", price: 37860, ingredients: "седло барашка, стейк ягненка, люля, антрекот, крылья", img: "🍖", imgUrl: P_MEAT, category: "company", isStop: false, stopReason: "" },

  // ДОП / ХЛЕБ / СОУСЫ
  { id: "ot1", name: "Лепешка+бауырсаки+хлеб", price: 800, ingredients: "мучные изделия", img: "🥖", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ot2", name: "Лепешка+ржаной", price: 700, ingredients: "мучные изделия", img: "🥖", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ot3", name: "Лепешка", price: 300, ingredients: "свежая выпечка", img: "🫓", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ot4", name: "Лаваш", price: 120, ingredients: "тонкий лаваш", img: "🫔", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "sc1", name: "Перечный соус", price: 580, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc2", name: "Горчичный соус", price: 450, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc3", name: "Грибной соус", price: 750, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc4", name: "Барбекю соус", price: 580, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc5", name: "Шашлычный соус", price: 580, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc6", name: "Майонез", price: 580, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc7", name: "Кетчуп", price: 450, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc8", name: "Сметана", price: 450, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "sc9", name: "Тар-тар", price: 580, ingredients: "соус", img: "🥣", imgUrl: P_SOUP, category: "other", isStop: false, stopReason: "" },
  { id: "ds1", name: "Бой: Чайник", price: 4600, ingredients: "возмещение ущерба", img: "💔", imgUrl: "", category: "other", isStop: false, stopReason: "" },
  { id: "ds2", name: "Бой: Винный бокал", price: 2300, ingredients: "возмещение ущерба", img: "💔", imgUrl: "", category: "other", isStop: false, stopReason: "" },
  { id: "ds3", name: "Бой: Тарелка", price: 2300, ingredients: "возмещение ущерба", img: "💔", imgUrl: "", category: "other", isStop: false, stopReason: "" },
  { id: "ds4", name: "Арахис соленый", price: 980, ingredients: "снеки", img: "🥜", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ds5", name: "Чипсы", price: 980, ingredients: "снеки", img: "🥔", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ds6", name: "Сыр Чечил", price: 980, ingredients: "снеки", img: "🧀", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ds7", name: "Курт (3 шт)", price: 560, ingredients: "снеки", img: "⚪", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },
  { id: "ds8", name: "Фисташки", price: 1070, ingredients: "снеки", img: "🥜", imgUrl: P_SNACK, category: "other", isStop: false, stopReason: "" },

  // БЕЗАЛКОГОЛЬНЫЕ НАПИТКИ
  { id: "d1", name: "Лимонад домашний 1л", price: 1980, ingredients: "свежий цитрусовый лимонад", img: "🍹", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d2", name: "Компот 1л", price: 1680, ingredients: "домашний компот", img: "🧃", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d3", name: "Чай Ташкентский", price: 1200, ingredients: "чай, лимон, мята, нават", img: "🫖", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d4", name: "Чай Мороканский / Фруктовый", price: 1200, ingredients: "авторский чай на выбор", img: "🫖", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d5", name: "Чёрный / Зеленый чай", price: 730, ingredients: "классический чай в чайнике", img: "🫖", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d6", name: "Чёрный кофе", price: 680, ingredients: "свежесваренный кофе", img: "☕", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d7", name: "Чай с молоком", price: 850, ingredients: "горячий чай с молоком", img: "☕", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d8", name: "Кофе 3 в 1 (чашка)", price: 500, ingredients: "растворимый кофе", img: "☕", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d9", name: "Coca Cola / Fanta / Sprite 1л", price: 1050, ingredients: "охлажденный газированный напиток", img: "🥤", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d10", name: "Coca Cola 0.5л", price: 650, ingredients: "охлажденный газированный напиток", img: "🥤", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d11", name: "Piko Pulpi / Макси чай 1л", price: 1050, ingredients: "сок / холодный чай", img: "🧃", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d12", name: "Piko 1л", price: 1270, ingredients: "сок натуральный", img: "🧃", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d13", name: "Вода 0.5л/1л", price: 680, ingredients: "вода без газа / с газом", img: "💧", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d14", name: "Молочный коктейль Сникерс", price: 1450, ingredients: "молоко, мороженое, сироп", img: "🧋", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d15", name: "Молочный коктейль Банановый/Клубничный", price: 1450, ingredients: "молоко, мороженое, сироп", img: "🧋", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d16", name: "Молочный коктейль Орео/Шоколадный", price: 1450, ingredients: "молоко, мороженое, сироп", img: "🧋", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },
  { id: "d17", name: "Слеш Фруктово-ягодный", price: 1050, ingredients: "ледяной напиток с сиропом", img: "🍧", imgUrl: P_DRINK, category: "drinks", isStop: false, stopReason: "" },

  // АЛКОГОЛЬНЫЕ НАПИТКИ / БАР
  { id: "a1", name: "Пиво Прага 0.5л", price: 1150, ingredients: "светлое пиво", img: "🍺", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a2", name: "Пиво Кружка свежего 0.5л", price: 1120, ingredients: "разливное светлое пиво", img: "🍺", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a3", name: "Пиво Шымкент 0.5л", price: 1170, ingredients: "светлое пиво", img: "🍺", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a4", name: "Слеш Алкогольный", price: 1650, ingredients: "ликер, фрукты, лед", img: "🍸", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a5", name: "Коктейль Лонг Айленд", price: 2880, ingredients: "водка, ром, текила, джин, сироп", img: "🍸", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a6", name: "Коктейль Голубая Лагуна", price: 2880, ingredients: "водка, ликер, спрайт", img: "🍸", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a7", name: "Коктейль Виски-кола", price: 1650, ingredients: "виски, кола", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a8", name: "Коктейль Текила санрайс", price: 1650, ingredients: "текила, гренадин, апельсиновый сок", img: "🍹", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a9", name: "Коктейль Отвертка / Электрик", price: 1380, ingredients: "алкогольный микс", img: "🍸", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a10", name: "Маргарита", price: 2300, ingredients: "текила, ликер, сироп", img: "🍸", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a11", name: "Водка Абсолют 0.5л", price: 11980, ingredients: "крепкий алкоголь", img: "🧊", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a12", name: "Водка Финляндия 0.5л", price: 11970, ingredients: "крепкий алкоголь", img: "🧊", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a13", name: "Водка Хортица / Мороша 0.5л", price: 5960, ingredients: "крепкий алкоголь", img: "🧊", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a14", name: "Водка Nemirov 0.5л", price: 6480, ingredients: "крепкий алкоголь", img: "🧊", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a15", name: "Коньяк Казахстанский 0.5л", price: 8370, ingredients: "коньяк", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a16", name: "Коньяк Армянский 0.5л", price: 10730, ingredients: "коньяк", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a17", name: "Виски Jack Daniels 0.5л", price: 19450, ingredients: "виски", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a18", name: "Виски Jameson 0.5л", price: 16770, ingredients: "виски", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a19", name: "Виски McLain 0.5л", price: 9870, ingredients: "виски", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a20", name: "Вино Кабуки 0.75л", price: 7360, ingredients: "вино", img: "🍷", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a21", name: "Вино Ламбруско 0.75л", price: 6580, ingredients: "вино", img: "🍷", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a22", name: "Грузинские вина 0.5л", price: 8760, ingredients: "вино", img: "🍷", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a23", name: "Мартини Айс 0.75л", price: 10000, ingredients: "вермут", img: "🍷", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a24", name: "Мартини Bianca 0.5л", price: 7000, ingredients: "вермут", img: "🍷", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" },
  { id: "a25", name: "Шоты (Киви / Гринадин) 6 шт", price: 2300, ingredients: "сет шотов", img: "🥃", imgUrl: P_BEER, category: "alcohol", isStop: false, stopReason: "" }
];

export const CATEGORIES = [
  { id: 'all', name: 'Все', icon: '🍽️' }, { id: 'salads', name: 'Салаты', icon: '🥗' },
  { id: 'soups', name: 'Супы', icon: '🍲' }, { id: 'snacks', name: 'Закуски', icon: '🌮' },
  { id: 'pizza', name: 'Пицца', icon: '🍕' }, { id: 'fastfood', name: 'Фаст Фуд', icon: '🍔' },
  { id: 'hot', name: 'Горячее', icon: '🥩' }, { id: 'company', name: 'Компании', icon: '🍱' }, 
  { id: 'drinks', name: 'Напитки', icon: '🍹' }, { id: 'alcohol', name: 'Бар', icon: '🍺' },
  { id: 'other', name: 'Доп', icon: '🥖' }
];

export const INITIAL_STORIES = [
  { id: 1, title: "🔥 Сэты", imgUrl: P_MEAT, isActive: true },
  { id: 2, title: "👨‍🍳 На гриле", imgUrl: P_CHICKEN, isActive: true },
  { id: 3, title: "🥤 Новинки", imgUrl: P_DRINK, isActive: true }
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
  "002005008": { role: "chef", name: "Шеф Повар", password: "Шеф повар Амина", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null }, 
  "004005006": { role: "cook", station: "hot", name: "Повар Восток", password: "Восток повар", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null },
  "005004006": { role: "cook", station: "cold", name: "Повар Холодный", password: "Холодный повар", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null },
  "005005007": { role: "cook", station: "bar", name: "Бармен", password: "БАРМЕН", onShift: true, schedule: "3/1", isSenior: false, sessionToken: null },
  "007008009": { role: "cook", station: "mangal", name: "Шашлычник", password: "МАНГАЛ", onShift: true, schedule: "5/2", isSenior: false, sessionToken: null },
  "77772222222": { role: "waiter", name: "Официант Али", password: "123", schedule: "2/2", onShift: true, kaspi: "77072223344", isSenior: true, sessionToken: null },
  "009009009": { role: "cashier", name: "Кассир Мадина", password: "КАССА", onShift: true, schedule: "2/2", isSenior: false, sessionToken: null }
};

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
