// Pachaka Lokam — seed data pulled from the spec document.
// Loaded once; user state (checked/qty/plans/reminders) lives in localStorage.

const GROCERY_SEED = [
  { category: "Vegetables", items: ["Carrot","Potato","Tomato","Onion","Ladiesfinger","Drumstick","Ginger","Garlic","Chilli","Curry leaves","Cauliflower","Cabbage","Snake gourd","Pumpkin","Yam","Raw mango"] },
  { category: "Staples & Pulses", items: ["Rice","Toor dal","Moong dal","Urad dal","Chana","Rawa","Aata","Sugar","Salt","Tea powder"] },
  { category: "Non-Veg", items: ["Chicken","Fish","Egg"] },
  { category: "Dairy & Bakery", items: ["Bread","Curd","Milk"] },
  { category: "Oils", items: ["Coconut oil","Rice bran oil"] },
  { category: "Spices", items: ["Coconut","Chilli powder","Masala powder","General spices"] },
  { category: "Snacks", items: ["Biscuit","Rusk","Cookies"] },
  { category: "Fruits (Seasonal)", items: ["Banana","Apple","Mango","Grapes","Pomegranate","Watermelon","Kiwi","Strawberry"] },
];

const MEAL_CATALOG = {
  breakfast: [
    { name: "Idli", simple: true },
    { name: "Dosa", simple: true },
    { name: "Upma", simple: true },
    { name: "Puttu + Kadala", simple: true },
    { name: "Bread + Egg", simple: true },
  ],
  lunch: [
    { name: "Rice + Sambar + Thoran", simple: true },
    { name: "Fish Curry Meals", simple: false },
    { name: "Moru Curry Meals", simple: true },
    { name: "Dal Meals", simple: true },
  ],
  dinner: [
    { name: "Chapati + Curry", simple: true },
    { name: "Light meals", simple: true },
    { name: "Leftovers", simple: true },
  ],
};

const REMINDER_SEED = [
  { title: "Buy Milk", frequency: "daily", time: "07:00", active: true },
  { title: "Vegetable shopping", frequency: "weekly", time: "09:00", active: true },
];
