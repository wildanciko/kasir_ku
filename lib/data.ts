export type Category = "All" | "Coffee" | "Food" | "Drinks" | "Desserts";

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  emoji: string;
  category: Category;
}

export const CATEGORIES: Category[] = ["All", "Coffee", "Food", "Drinks", "Desserts"];

export const MENU_ITEMS: MenuItem[] = [
  { id: 1,  name: "Cappuccino",      price: 3.50, emoji: "☕", category: "Coffee"   },
  { id: 2,  name: "Latte",           price: 3.80, emoji: "🥛", category: "Coffee"   },
  { id: 3,  name: "Americano",       price: 2.90, emoji: "☕", category: "Coffee"   },
  { id: 4,  name: "Mocha",           price: 4.20, emoji: "☕", category: "Coffee"   },
  { id: 5,  name: "Bagel",           price: 2.80, emoji: "🥯", category: "Food"     },
  { id: 6,  name: "Sandwich",        price: 5.50, emoji: "🥪", category: "Food"     },
  { id: 7,  name: "Caesar Salad",    price: 6.50, emoji: "🥗", category: "Food"     },
  { id: 8,  name: "Muffin",          price: 2.60, emoji: "🧁", category: "Desserts" },
  { id: 9,  name: "Orange Juice",    price: 2.90, emoji: "🍊", category: "Drinks"   },
  { id: 10, name: "Smoothie",        price: 3.90, emoji: "🥤", category: "Drinks"   },
  { id: 11, name: "Chocolate Cake",  price: 4.50, emoji: "🎂", category: "Desserts" },
  { id: 12, name: "Cookie",          price: 1.80, emoji: "🍪", category: "Desserts" },
];

export interface CartItem extends MenuItem {
  qty: number;
}

export const TAX_RATE = 0.08;
