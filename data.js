// Pachaka Lokam — seed data v2.
// Each grocery item now carries a natural unit + default qty + input step.
// Each meal carries an `ingredients` list (lowercase tokens) for pantry-aware suggestions.
//
// Unit conventions:
//   kg  -> staples, vegetables sold by weight
//   g   -> spices, small-batch items
//   L   -> milk, large oils
//   ml  -> small oils, sauces
//   nos -> countable (eggs, coconut, drumstick)
//   pkt -> packaged (biscuit, bread, tea)

const U = (unit, defaultQty, step) => ({ unit, defaultQty, step });

const GROCERY_SEED = [
  { category: "Vegetables", items: [
    ["Carrot",        U("kg", 0.5, 0.25)],
    ["Potato",        U("kg", 1,   0.5)],
    ["Tomato",        U("kg", 1,   0.25)],
    ["Onion",         U("kg", 2,   0.5)],
    ["Ladiesfinger",  U("kg", 0.5, 0.25)],
    ["Drumstick",     U("nos", 4,  1)],
    ["Ginger",        U("g", 100,  50)],
    ["Garlic",        U("g", 100,  50)],
    ["Chilli",        U("g", 100,  50)],
    ["Curry leaves",  U("g", 50,   25)],
    ["Cauliflower",   U("nos", 1,  1)],
    ["Cabbage",       U("nos", 1,  1)],
    ["Snake gourd",   U("kg", 0.5, 0.25)],
    ["Pumpkin",       U("kg", 1,   0.5)],
    ["Yam",           U("kg", 0.5, 0.25)],
    ["Raw mango",     U("nos", 2,  1)],
  ]},
  { category: "Staples & Pulses", items: [
    ["Rice",       U("kg", 5,  1)],
    ["Toor dal",   U("kg", 1,  0.25)],
    ["Moong dal",  U("kg", 0.5,0.25)],
    ["Urad dal",   U("kg", 0.5,0.25)],
    ["Chana",      U("kg", 0.5,0.25)],
    ["Rawa",       U("kg", 0.5,0.25)],
    ["Aata",       U("kg", 2,  0.5)],
    ["Sugar",      U("kg", 1,  0.25)],
    ["Salt",       U("kg", 1,  0.25)],
    ["Tea powder", U("g", 250, 50)],
  ]},
  { category: "Non-Veg", items: [
    ["Chicken", U("kg", 1,  0.25)],
    ["Fish",    U("kg", 1,  0.25)],
    ["Egg",     U("nos", 12, 6)],
  ]},
  { category: "Dairy & Bakery", items: [
    ["Bread", U("pkt", 1, 1)],
    ["Curd",  U("g", 500, 100)],
    ["Milk",  U("L", 1,   0.5)],
  ]},
  { category: "Oils", items: [
    ["Coconut oil",   U("L",  1, 0.5)],
    ["Rice bran oil", U("L",  1, 0.5)],
  ]},
  { category: "Spices", items: [
    ["Coconut",        U("nos", 2, 1)],
    ["Chilli powder",  U("g", 200, 50)],
    ["Masala powder",  U("g", 200, 50)],
    ["General spices", U("g", 200, 50)],
  ]},
  { category: "Snacks", items: [
    ["Biscuit", U("pkt", 2, 1)],
    ["Rusk",    U("pkt", 1, 1)],
    ["Cookies", U("pkt", 1, 1)],
  ]},
  { category: "Fruits (Seasonal)", items: [
    ["Banana",      U("nos", 12, 6)],
    ["Apple",       U("kg", 1,  0.5)],
    ["Mango",       U("kg", 1,  0.5)],
    ["Grapes",      U("kg", 0.5,0.25)],
    ["Pomegranate", U("nos", 2, 1)],
    ["Watermelon",  U("nos", 1, 1)],
    ["Kiwi",        U("nos", 4, 2)],
    ["Strawberry",  U("g", 250, 50)],
  ]},
];

// Ingredient tokens are lowercase and matched by substring against pantry item names.
// Keep them atomic: prefer "rice" over "rice flour" unless distinction matters.
const MEAL_CATALOG = {
  breakfast: [
    { name: "Idli",           simple: true,  ingredients: ["rice", "urad dal"] },
    { name: "Dosa",           simple: true,  ingredients: ["rice", "urad dal"] },
    { name: "Upma",           simple: true,  ingredients: ["rawa", "onion", "curry leaves"] },
    { name: "Puttu + Kadala", simple: true,  ingredients: ["rice", "chana", "coconut"] },
    { name: "Bread + Egg",    simple: true,  ingredients: ["bread", "egg"] },
    { name: "Aata Paratha",   simple: true,  ingredients: ["aata", "onion"] },
  ],
  lunch: [
    { name: "Rice + Sambar + Thoran", simple: true,  ingredients: ["rice", "toor dal", "tomato", "onion", "cabbage"] },
    { name: "Fish Curry Meals",       simple: false, ingredients: ["rice", "fish", "coconut", "chilli"] },
    { name: "Moru Curry Meals",       simple: true,  ingredients: ["rice", "curd", "coconut"] },
    { name: "Dal Meals",              simple: true,  ingredients: ["rice", "toor dal", "tomato"] },
    { name: "Chicken Curry Meals",    simple: false, ingredients: ["rice", "chicken", "onion", "masala powder"] },
    { name: "Egg Curry Meals",        simple: true,  ingredients: ["rice", "egg", "onion", "tomato"] },
  ],
  dinner: [
    { name: "Chapati + Dal",     simple: true, ingredients: ["aata", "toor dal"] },
    { name: "Chapati + Veg Curry", simple: true, ingredients: ["aata", "potato", "onion"] },
    { name: "Idiyappam + Milk",  simple: true, ingredients: ["rice", "milk"] },
    { name: "Dosa + Chutney",    simple: true, ingredients: ["rice", "urad dal", "coconut"] },
    { name: "Light meals",       simple: true, ingredients: ["rice", "curd"] },
  ],
};

const REMINDER_SEED = [
  { title: "Buy Milk",          frequency: "daily",  time: "07:00", active: true },
  { title: "Vegetable shopping",frequency: "weekly", time: "09:00", active: true },
];
