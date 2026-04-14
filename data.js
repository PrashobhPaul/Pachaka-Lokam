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

// ---------- Festival Dataset ----------
// Each festival: name, states[], startDate, endDate, peakDay, greeting, mealPlan
// mealPlan types: "progressive" | "pattern" | "festival" (static single-day)
const FESTIVAL_DATA = [
  // --- KERALA ---
  {
    name: "Onam",
    states: ["Kerala"],
    startDate: "2026-08-28",
    endDate: "2026-09-06",
    peakDay: "2026-09-05",
    greeting: "Happy Onam! Onathappan varavaayi!",
    mealPlan: {
      type: "pattern",
      pattern: ["simple","simple","medium","medium","medium","heavy","heavy","heavy","grand","grand"],
      templates: {
        simple: { lunch: ["Rice","Sambar","Thoran","Papadam"] },
        medium: { lunch: ["Rice","Sambar","Avial","Thoran","Papadam","Pickle"] },
        heavy:  { lunch: ["Rice","Sambar","Avial","Olan","Thoran","Papadam","Payasam"] },
        grand:  { lunch: ["Onasadya","Avial","Olan","Kootu Curry","Erissery","Kaalan","Rasam","Sambar","Thoran","Papadam","Ada Pradhaman","Pal Payasam","Banana Chips","Sharkara Upperi"] },
      }
    }
  },
  {
    name: "Vishu",
    states: ["Kerala"],
    startDate: "2026-04-14",
    endDate: "2026-04-15",
    peakDay: "2026-04-14",
    greeting: "Vishu Ashamsakal!",
    mealPlan: {
      type: "festival",
      meals: {
        breakfast: ["Vishu Kanji","Thattil Koottu"],
        lunch: ["Sadya","Vishu Katta","Veppampoorasam","Payasam"],
        dinner: ["Rice","Sambar","Thoran","Papadam"],
      }
    }
  },
  {
    name: "Thiruvathira",
    states: ["Kerala"],
    startDate: "2026-12-30",
    endDate: "2026-12-30",
    peakDay: "2026-12-30",
    greeting: "Happy Thiruvathira!",
    mealPlan: {
      type: "festival",
      meals: {
        breakfast: ["Puttu","Kadala Curry"],
        lunch: ["Rice","Sambar","Kootu Curry","Thoran"],
        dinner: ["Thiruvathira Puzhukku","Koova Payasam"],
      }
    }
  },
  // --- TAMIL NADU ---
  {
    name: "Pongal",
    states: ["Tamil Nadu"],
    startDate: "2026-01-14",
    endDate: "2026-01-17",
    peakDay: "2026-01-15",
    greeting: "Iniya Pongal Nalvazhthukkal!",
    mealPlan: {
      type: "progressive",
      days: [
        { dayOffset: 0, title: "Bhogi", meals: { lunch: ["Rice","Sambar","Kootu","Poriyal"], dinner: ["Rice","Rasam","Appalam"] }},
        { dayOffset: 1, title: "Thai Pongal", meals: { breakfast: ["Ven Pongal","Sakkarai Pongal"], lunch: ["Rice","Sambar","Kootu","Vadai","Payasam"] }},
        { dayOffset: 2, title: "Mattu Pongal", meals: { lunch: ["Rice","Sambar","Kootu","Poriyal","Payasam"] }},
        { dayOffset: 3, title: "Kaanum Pongal", meals: { lunch: ["Rice","Sambar","Rasam","Poriyal"] }},
      ]
    }
  },
  {
    name: "Navaratri",
    states: ["Tamil Nadu","Kerala","Andhra Pradesh","Telangana"],
    startDate: "2026-10-11",
    endDate: "2026-10-19",
    peakDay: "2026-10-19",
    greeting: "Happy Navaratri! Jai Mata Di!",
    mealPlan: {
      type: "pattern",
      pattern: ["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates: {
        simple: { lunch: ["Rice","Sambar","Kootu","Sundal"] },
        medium: { lunch: ["Rice","Sambar","Kootu","Sundal","Vadai","Payasam"] },
        heavy:  { lunch: ["Rice","Sambar","Kootu","Sundal","Vadai","Boli","Payasam","Sweet Pongal"] },
        grand:  { lunch: ["Vijayadashami Special","Puliyodarai","Lemon Rice","Sundal Varieties","Vadai","Kesari","Payasam"] },
      }
    }
  },
  {
    name: "Tamil New Year (Puthandu)",
    states: ["Tamil Nadu"],
    startDate: "2026-04-14",
    endDate: "2026-04-14",
    peakDay: "2026-04-14",
    greeting: "Puthandu Vazthukal!",
    mealPlan: {
      type: "festival",
      meals: {
        breakfast: ["Maanga Pachadi","Neer More"],
        lunch: ["Rice","Sambar","Rasam","Kootu","Poriyal","Vadai","Payasam"],
        dinner: ["Rice","Rasam","Poriyal"],
      }
    }
  },
  // --- ANDHRA PRADESH ---
  {
    name: "Ugadi",
    states: ["Andhra Pradesh","Telangana"],
    startDate: "2026-03-29",
    endDate: "2026-03-29",
    peakDay: "2026-03-29",
    greeting: "Ugadi Subhakankshalu!",
    mealPlan: {
      type: "festival",
      meals: {
        breakfast: ["Ugadi Pachadi","Pulihora"],
        lunch: ["Rice","Sambar","Pappu","Bobbatlu","Payasam","Avakaya"],
        dinner: ["Rice","Rasam","Fryums"],
      }
    }
  },
  {
    name: "Sankranti",
    states: ["Andhra Pradesh","Telangana"],
    startDate: "2026-01-13",
    endDate: "2026-01-16",
    peakDay: "2026-01-14",
    greeting: "Makara Sankranti Subhakankshalu!",
    mealPlan: {
      type: "progressive",
      days: [
        { dayOffset: 0, title: "Bhogi", meals: { lunch: ["Rice","Sambar","Pappu","Vada","Ariselu"] }},
        { dayOffset: 1, title: "Sankranti", meals: { breakfast: ["Pongal","Pulihora"], lunch: ["Rice","Sambar","Pappu","Bobbatlu","Paramannam","Ariselu"] }},
        { dayOffset: 2, title: "Kanuma", meals: { lunch: ["Rice","Sambar","Pappu","Non-veg Curry","Payasam"] }},
        { dayOffset: 3, title: "Mukkanuma", meals: { lunch: ["Rice","Sambar","Pappu","Poriyal"] }},
      ]
    }
  },
  // --- TELANGANA ---
  {
    name: "Bathukamma",
    states: ["Telangana"],
    startDate: "2026-10-02",
    endDate: "2026-10-10",
    peakDay: "2026-10-10",
    greeting: "Bathukamma Panduga Subhakankshalu!",
    mealPlan: {
      type: "pattern",
      pattern: ["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates: {
        simple: { lunch: ["Rice","Pappu","Poriyal","Perugu"] },
        medium: { lunch: ["Rice","Sambar","Pappu","Pulihora","Poriyal"] },
        heavy:  { lunch: ["Rice","Sambar","Pappu","Pulihora","Gutti Vankaya","Payasam"] },
        grand:  { lunch: ["Rice","Sambar","Pappu","Pulihora","Bobbatlu","Payasam","Garelu","Ariselu"] },
      }
    }
  },
  {
    name: "Bonalu",
    states: ["Telangana"],
    startDate: "2026-07-12",
    endDate: "2026-08-02",
    peakDay: "2026-07-19",
    greeting: "Bonalu Panduga Subhakankshalu!",
    mealPlan: {
      type: "pattern",
      pattern: Array(22).fill("simple").fill("medium",7,14).fill("heavy",14,21).fill("grand",21,22),
      templates: {
        simple: { lunch: ["Rice","Pappu","Poriyal","Perugu"] },
        medium: { lunch: ["Rice","Sambar","Pappu","Poriyal","Pulihora"] },
        heavy:  { lunch: ["Rice","Sambar","Pappu","Bonam Prasadam","Pulihora","Payasam"] },
        grand:  { lunch: ["Special Bonam Rice","Sambar","Pappu","Pulihora","Garelu","Payasam","Bobbatlu"] },
      }
    }
  },
];

// ---------- Regional Meal Catalog (expanded for South Indian states) ----------
const REGIONAL_MEALS = {
  Kerala: {
    breakfast: [
      { name: "Idli", simple: true },
      { name: "Dosa", simple: true },
      { name: "Upma", simple: true },
      { name: "Puttu + Kadala", simple: true },
      { name: "Bread + Egg", simple: true },
      { name: "Appam + Stew", simple: false },
      { name: "Idiyappam + Egg Curry", simple: false },
      { name: "Pathiri + Chicken Curry", simple: false },
    ],
    lunch: [
      { name: "Rice + Sambar + Thoran", simple: true },
      { name: "Fish Curry Meals", simple: false },
      { name: "Moru Curry Meals", simple: true },
      { name: "Dal Meals", simple: true },
      { name: "Avial Meals", simple: false },
      { name: "Kootu Curry Meals", simple: false },
    ],
    dinner: [
      { name: "Chapati + Curry", simple: true },
      { name: "Light meals", simple: true },
      { name: "Leftovers", simple: true },
      { name: "Porridge + Side", simple: true },
    ],
  },
  "Tamil Nadu": {
    breakfast: [
      { name: "Idli + Sambar", simple: true },
      { name: "Dosa + Chutney", simple: true },
      { name: "Pongal + Vada", simple: false },
      { name: "Upma", simple: true },
      { name: "Poori + Masala", simple: false },
      { name: "Rava Dosa", simple: true },
    ],
    lunch: [
      { name: "Rice + Sambar + Rasam + Poriyal", simple: true },
      { name: "Curd Rice + Pickle", simple: true },
      { name: "Variety Rice (Puliyodarai/Lemon)", simple: true },
      { name: "Kootu + Rice", simple: true },
      { name: "Fish Kulambu Meals", simple: false },
    ],
    dinner: [
      { name: "Chapati + Kurma", simple: true },
      { name: "Idli/Dosa (light)", simple: true },
      { name: "Parotta + Salna", simple: false },
    ],
  },
  "Andhra Pradesh": {
    breakfast: [
      { name: "Pesarattu + Ginger Chutney", simple: true },
      { name: "Idli + Peanut Chutney", simple: true },
      { name: "Upma + Pickle", simple: true },
      { name: "Dosa + Sambar", simple: true },
      { name: "Poori + Curry", simple: false },
    ],
    lunch: [
      { name: "Rice + Pappu + Poriyal", simple: true },
      { name: "Rice + Sambar + Rasam + Fryums", simple: true },
      { name: "Pulihora + Perugu", simple: true },
      { name: "Gutti Vankaya Meals", simple: false },
      { name: "Gongura Chicken Meals", simple: false },
    ],
    dinner: [
      { name: "Chapati + Dal Fry", simple: true },
      { name: "Pesarattu", simple: true },
      { name: "Rice + Rasam", simple: true },
    ],
  },
  "Telangana": {
    breakfast: [
      { name: "Pesarattu + Upma", simple: true },
      { name: "Idli + Palli Chutney", simple: true },
      { name: "Dosa + Sambar", simple: true },
      { name: "Poori + Aloo Curry", simple: false },
      { name: "Sakinalu + Tea", simple: true },
    ],
    lunch: [
      { name: "Rice + Pappu + Poriyal + Perugu", simple: true },
      { name: "Rice + Pulusu + Vepudu", simple: true },
      { name: "Jonna Rotte + Natu Kodi Pulusu", simple: false },
      { name: "Pulihora + Perugu", simple: true },
      { name: "Sarva Pindi Meals", simple: false },
    ],
    dinner: [
      { name: "Chapati + Dal", simple: true },
      { name: "Ragi Sangati + Natukodi", simple: false },
      { name: "Rice + Rasam + Pickle", simple: true },
    ],
  },
};
