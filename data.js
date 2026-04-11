// Pachaka Lokam — Seed Data v3.1 (Kerala curries expanded)

const U = (unit, defaultQty, step) => ({ unit, defaultQty, step });

// ============================================================
// GROCERY CATALOG
// ============================================================
const GROCERY_SEED = [
  { category: "Vegetables", items: [
    ["Carrot",U("kg",0.5,0.25)],["Potato",U("kg",1,0.5)],["Tomato",U("kg",1,0.25)],
    ["Onion",U("kg",2,0.5)],["Shallots",U("g",250,50)],
    ["Ladiesfinger",U("kg",0.5,0.25)],["Drumstick",U("nos",4,1)],
    ["Ginger",U("g",100,50)],["Garlic",U("g",100,50)],
    ["Chilli",U("g",100,50)],["Green chilli",U("g",100,50)],
    ["Curry leaves",U("g",50,25)],
    ["Cauliflower",U("nos",1,1)],["Cabbage",U("nos",1,1)],
    ["Snake gourd",U("kg",0.5,0.25)],["Ash gourd",U("kg",1,0.5)],
    ["Pumpkin",U("kg",1,0.5)],["Yam",U("kg",0.5,0.25)],
    ["Raw banana",U("nos",3,1)],["Raw mango",U("nos",2,1)],
    ["Beans",U("kg",0.5,0.25)],["Beetroot",U("kg",0.5,0.25)],
    ["Cucumber",U("kg",0.5,0.25)],
  ]},
  { category: "Staples & Pulses", items: [
    ["Rice",U("kg",5,1)],["Toor dal",U("kg",1,0.25)],["Moong dal",U("kg",0.5,0.25)],
    ["Urad dal",U("kg",0.5,0.25)],["Chana",U("kg",0.5,0.25)],
    ["Cowpeas",U("kg",0.5,0.25)],["Rawa",U("kg",0.5,0.25)],
    ["Aata",U("kg",2,0.5)],["Sugar",U("kg",1,0.25)],["Salt",U("kg",1,0.25)],
    ["Tea powder",U("g",250,50)],
  ]},
  { category: "Non-Veg", items: [
    ["Chicken",U("kg",1,0.25)],["Fish",U("kg",1,0.25)],["Egg",U("nos",12,6)],
  ]},
  { category: "Dairy & Bakery", items: [
    ["Bread",U("pkt",1,1)],["Curd",U("g",500,100)],["Milk",U("L",1,0.5)],
    ["Coconut milk",U("ml",400,100)],
  ]},
  { category: "Oils", items: [
    ["Coconut oil",U("L",1,0.5)],["Rice bran oil",U("L",1,0.5)],
  ]},
  { category: "Spices", items: [
    ["Coconut",U("nos",2,1)],["Chilli powder",U("g",200,50)],
    ["Masala powder",U("g",200,50)],["General spices",U("g",200,50)],
    ["Mustard seeds",U("g",100,25)],
  ]},
  { category: "Snacks", items: [
    ["Biscuit",U("pkt",2,1)],["Rusk",U("pkt",1,1)],["Cookies",U("pkt",1,1)],
    ["Mixture",U("pkt",1,1)],["Banana chips",U("pkt",1,1)],
  ]},
  { category: "Fruits (Seasonal)", items: [
    ["Banana",U("nos",12,6)],["Apple",U("kg",1,0.5)],["Mango",U("kg",1,0.5)],
    ["Grapes",U("kg",0.5,0.25)],["Pomegranate",U("nos",2,1)],
    ["Watermelon",U("nos",1,1)],["Kiwi",U("nos",4,2)],["Strawberry",U("g",250,50)],
  ]},
];

// ============================================================
// DYNAMIC INGREDIENT POOLS
// ============================================================
const THORAN_VEG  = ["cabbage","carrot","cauliflower","ladiesfinger","beans","beetroot","snake gourd","yam","pumpkin"];
const SAMBAR_VEG  = ["drumstick","ash gourd","pumpkin","carrot","ladiesfinger"];
const AVIAL_VEG   = ["raw banana","yam","carrot","beans","ash gourd","snake gourd","cucumber","drumstick"];
const FRUITS      = ["banana","apple","mango","grapes","pomegranate","watermelon","kiwi","strawberry"];
const JUICE_FRUIT = ["mango","watermelon","grapes","pomegranate"];

// ============================================================
// CURRY POOL — pairs with Chapati (dinner) AND Rice (lunch)
// ============================================================
const KERALA_CURRIES = [
  { name:"Sambar",
    needs:["toor dal","tomato","onion","chilli"],
    minFrom:SAMBAR_VEG, minCount:2,
    render:m=>`Sambar (${m.join(", ")})` },

  { name:"Avial",
    needs:["coconut","curd","curry leaves"],
    minFrom:AVIAL_VEG, minCount:4,
    render:m=>`Avial (${m.join(", ")})` },

  { name:"Cabbage Thoran",
    needs:["cabbage","coconut","green chilli"] },

  { name:"Potato Mezhukkupuratti",
    needs:["potato","onion","curry leaves"] },

  { name:"Kaalan",
    needs:["raw banana","yam","coconut","curd"] },

  { name:"Olan",
    needs:["ash gourd","cowpeas","coconut milk"] },

  { name:"Vegetable Stew",
    needs:["potato","carrot","beans","onion","coconut milk"] },

  { name:"Pulissery (Mango)",
    needs:["mango","coconut","curd"] },

  { name:"Pulissery (Ash gourd)",
    needs:["ash gourd","coconut","curd"] },

  { name:"Moru Curry",
    needs:["curd","coconut","chilli","curry leaves"] },

  { name:"Egg Curry",
    needs:["egg","onion","tomato","masala powder"] },

  { name:"Chicken Curry",
    needs:["chicken","onion","masala powder","tomato"] },

  { name:"Fish Curry",
    needs:["fish","coconut","chilli","onion"] },

  { name:"Dal Fry",
    needs:["toor dal","tomato","onion"] },
];

// Engine compatibility — dinner chapati uses this list
const DINNER_CURRIES = KERALA_CURRIES;

// ============================================================
// MEAL RULES
// ============================================================
const MEAL_RULES = {
  breakfast: [
    { name:"Idli + Sambar",         base:["rice","urad dal","toor dal","tomato","onion"], simple:true },
    { name:"Dosa + Chutney",        base:["rice","urad dal","coconut"], simple:true },
    { name:"Masala Dosa",           base:["rice","urad dal","potato","onion"], simple:true },
    { name:"Puttu + Kadala Curry",  base:["rice","chana","coconut"], simple:true },
    { name:"Appam + Kadala Curry",  base:["rice","chana","coconut"], simple:true },
    { name:"Idiyappam + Egg Curry", base:["rice","egg","onion","tomato"], simple:true },
    { name:"Idiyappam + Stew",      base:["rice","potato","carrot","beans","coconut milk","onion"], simple:true },
    { name:"Idiyappam + Milk",      base:["rice","milk","sugar"], simple:true },
    { name:"Upma",                  base:["rawa","onion","curry leaves"], simple:true },
    { name:"Poori + Potato Masala", base:["aata","potato","onion"], simple:true },
    { name:"Bread + Egg Omelette",  base:["bread","egg","onion"], simple:true },
  ],

  // Lunch = Rice + a Kerala curry + Thoran (curry chosen dynamically)
  lunch: [
    { name:"Kerala Sadya-style Meals",
      base:["rice"], withCurry:true, withThoran:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.thoran||"Pickle"}` },

    // Non-veg lunches keep their own entries for variety weighting
    { name:"Fish Curry Meals",
      base:["rice","fish","coconut","chilli","onion"],
      withThoran:true, simple:false,
      render:c=>`Rice + Fish Curry + ${c.thoran||"Pickle"}` },

    { name:"Chicken Curry Meals",
      base:["rice","chicken","onion","masala powder","tomato"],
      simple:false, render:()=>`Rice + Chicken Curry + Salad` },

    { name:"Egg Curry Meals",
      base:["rice","egg","onion","tomato","masala powder"],
      withThoran:true, simple:true,
      render:c=>`Rice + Egg Curry + ${c.thoran||"Pickle"}` },

    // Specials — ~15% chance when fully cookable
    { name:"Chicken Biriyani",
      base:["rice","chicken","onion","masala powder","curd","ginger","garlic"],
      simple:false, special:true },
    { name:"Veg Fried Rice",
      base:["rice","cabbage","carrot","onion","chilli"],
      simple:false, special:true },
    { name:"Veg Pulav",
      base:["rice","onion","carrot","masala powder","coconut oil"],
      simple:false, special:true },
  ],

  tea: [
    { name:"Tea + Biscuit",      base:["tea powder","milk","sugar","biscuit"], simple:true },
    { name:"Tea + Rusk",         base:["tea powder","milk","sugar","rusk"], simple:true },
    { name:"Tea + Banana Chips", base:["tea powder","milk","sugar","banana chips"], simple:true },
    { name:"Tea + Mixture",      base:["tea powder","milk","sugar","mixture"], simple:true },
    { name:"Milk + Cookies",     base:["milk","cookies"], simple:true },
    { name:"Fresh Fruit Plate",  base:[], minFrom:FRUITS, minCount:1, simple:true,
      render:c=>`Fresh ${c.matched.join(" & ")} Plate` },
    { name:"Fresh Juice",        base:["sugar"], minFrom:JUICE_FRUIT, minCount:1, simple:false,
      render:c=>`Fresh ${c.matched[0]} Juice` },
  ],

  // Dinner = light. Chapati + dynamic curry, or rice-light dishes
  dinner: [
    { name:"Chapati + Curry", base:["aata"], withCurry:true, simple:true,
      render:c=>`Chapati + ${c.curry}` },
    { name:"Curd Rice",       base:["rice","curd","curry leaves"], simple:true },
    { name:"Sambar Rice",     base:["rice","toor dal","tomato","onion"],
      minFrom:SAMBAR_VEG, minCount:1, simple:true,
      render:c=>`Sambar Rice (${c.matched.join(", ")})` },
    { name:"Dal Khichdi",     base:["rice","moong dal","tomato","onion"], simple:true },
    { name:"Dosa + Chutney",  base:["rice","urad dal","coconut"], simple:true },
    { name:"Kanji + Payar",   base:["rice","cowpeas","coconut"], simple:true },
  ],
};

const REMINDER_SEED = [
  { title:"Buy Milk", frequency:"daily", time:"07:00", active:true },
  { title:"Vegetable shopping", frequency:"weekly", time:"09:00", active:true },
];
