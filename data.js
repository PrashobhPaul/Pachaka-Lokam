// Pachaka Lokam — v2.0 seed
// DESIGN RULES:
//   - Staple spices are ASSUMED available (chilli, curry leaves, mustard,
//     turmeric, cumin, ginger, garlic, salt, oil). Never check for them.
//   - Curry "needs" list only the DEFINING main ingredients.
//   - Lunch & dinner = rice-based meals. Chapati only as rare substitute.
//   - Breakfast combos must be authentic pairings.
//   - 5 regions: Kerala, Tamil Nadu, Andhra Pradesh, Telangana, Karnataka.
//   - Festival calendar: Jan 2026 – Apr 2028.
const U = (unit, defaultQty, step) => ({ unit, defaultQty, step });

const GROCERY_SEED = [
  { category: "Vegetables", items: [
    ["Carrot",U("kg",0.5,0.25)],["Potato",U("kg",1,0.5)],["Tomato",U("kg",1,0.25)],
    ["Onion",U("kg",2,0.5)],["Shallots",U("g",250,50)],["Ladiesfinger",U("kg",0.5,0.25)],
    ["Drumstick",U("nos",4,1)],["Chilli",U("g",100,50)],
    ["Cauliflower",U("nos",1,1)],["Cabbage",U("nos",1,1)],["Snake gourd",U("kg",0.5,0.25)],
    ["Ash gourd",U("kg",1,0.5)],["Pumpkin",U("kg",1,0.5)],["Yam",U("kg",0.5,0.25)],
    ["Raw banana",U("nos",3,1)],["Raw mango",U("nos",2,1)],["Beans",U("kg",0.5,0.25)],
    ["Beetroot",U("kg",0.5,0.25)],["Cucumber",U("kg",0.5,0.25)],
    ["Brinjal",U("kg",0.5,0.25)],["Ridge gourd",U("kg",0.5,0.25)],
    ["Bottle gourd",U("kg",0.5,0.25)],["Bitter gourd",U("kg",0.25,0.25)],
    ["Capsicum",U("nos",2,1)],["Ivy gourd",U("kg",0.25,0.25)],
    ["Green peas",U("g",250,50)],
  ]},
  { category: "Staples & Pulses", items: [
    ["Rice",U("kg",5,1)],["Toor dal",U("kg",1,0.25)],["Moong dal",U("kg",0.5,0.25)],
    ["Urad dal",U("kg",0.5,0.25)],["Chana",U("kg",0.5,0.25)],["Cowpeas",U("kg",0.5,0.25)],
    ["Peanuts",U("g",250,50)],
    ["Rawa",U("kg",0.5,0.25)],["Aata",U("kg",2,0.5)],["Sugar",U("kg",1,0.25)],
    ["Salt",U("kg",1,0.25)],["Tea powder",U("g",250,50)],["Coffee powder",U("g",200,50)],
    ["Jaggery",U("g",250,50)],["Tamarind",U("g",200,50)],
    ["Vermicelli",U("g",500,100)],["Ragi flour",U("kg",0.5,0.25)],
    ["Jowar flour",U("kg",0.5,0.25)],
  ]},
  { category: "Non-Veg", items: [
    ["Chicken",U("kg",1,0.25)],["Fish",U("kg",1,0.25)],["Egg",U("nos",12,6)],["Prawns",U("kg",0.5,0.25)],
    ["Mutton",U("kg",0.5,0.25)],
  ]},
  { category: "Dairy & Bakery", items: [
    ["Bread",U("pkt",1,1)],["Curd",U("g",500,100)],["Milk",U("L",1,0.5)],["Coconut milk",U("ml",400,100)],
    ["Butter",U("g",100,50)],["Ghee",U("g",200,50)],
  ]},
  { category: "Oils", items: [
    ["Coconut oil",U("L",1,0.5)],["Rice bran oil",U("L",1,0.5)],["Sesame oil",U("ml",200,50)],
  ]},
  { category: "Spices", items: [
    ["Coconut",U("nos",2,1)],["Chilli powder",U("g",200,50)],
    ["Masala powder",U("g",200,50)],["General spices",U("g",200,50)],
  ]},
  { category: "Snacks", items: [
    ["Biscuit",U("pkt",2,1)],["Rusk",U("pkt",1,1)],["Cookies",U("pkt",1,1)],
    ["Mixture",U("pkt",1,1)],["Banana chips",U("pkt",1,1)],
  ]},
  { category: "Fruits (Seasonal)", items: [
    ["Banana",U("nos",12,6)],["Apple",U("kg",1,0.5)],["Mango",U("kg",1,0.5)],
    ["Grapes",U("kg",0.5,0.25)],["Pomegranate",U("nos",2,1)],["Watermelon",U("nos",1,1)],
    ["Kiwi",U("nos",4,2)],["Strawberry",U("g",250,50)],
  ]},
];

// ===== VEGETABLE POOLS FOR SIDE-DISH RESOLUTION =====
const THORAN_VEG  = ["cabbage","carrot","cauliflower","ladiesfinger","beans","beetroot","snake gourd","yam","pumpkin"];
const SAMBAR_VEG  = ["drumstick","ash gourd","pumpkin","carrot","ladiesfinger"];
const AVIAL_VEG   = ["raw banana","yam","carrot","beans","ash gourd","snake gourd","cucumber","drumstick"];
const JUICE_FRUIT = ["mango","watermelon","grapes","pomegranate"];

// TN-specific
const PORIYAL_VEG = ["beans","cabbage","carrot","cauliflower","ladiesfinger","beetroot","brinjal","snake gourd","capsicum"];
const KOOTU_VEG   = ["ash gourd","raw banana","yam","snake gourd","bottle gourd"];
// AP/TG-specific
const VEPUDU_VEG  = ["brinjal","ladiesfinger","bitter gourd","cabbage","beans","capsicum","cauliflower"];
const PAPPU_VEG   = ["tomato","bottle gourd","ridge gourd","drumstick","brinjal"];
// Karnataka-specific
const PALYA_VEG   = ["beans","cabbage","carrot","cauliflower","beetroot","ivy gourd","capsicum","potato"];
const GOJJU_VEG   = ["brinjal","ivy gourd","raw mango","tomato"];

// =====================================================================
//  REGIONAL CURRIES — only MAIN defining ingredients in "needs"
// =====================================================================

const KERALA_CURRIES = [
  { name:"Sambar", needs:["toor dal"], minFrom:SAMBAR_VEG, minCount:2, render:m=>`Sambar (${m.join(", ")})` },
  { name:"Avial", needs:["coconut","curd"], minFrom:AVIAL_VEG, minCount:3, render:m=>`Avial (${m.join(", ")})` },
  { name:"Cabbage Thoran", needs:["cabbage","coconut"] },
  { name:"Carrot Thoran", needs:["carrot","coconut"] },
  { name:"Beans Thoran", needs:["beans","coconut"] },
  { name:"Potato Mezhukkupuratti", needs:["potato","onion"] },
  { name:"Kaalan", needs:["coconut","curd"], minFrom:["raw banana","yam"], minCount:1, render:m=>`Kaalan (${m.join(", ")})` },
  { name:"Olan", needs:["ash gourd","cowpeas","coconut milk"] },
  { name:"Vegetable Stew", needs:["potato","coconut milk"] },
  { name:"Pulissery (Mango)", needs:["mango","coconut","curd"] },
  { name:"Pulissery (Ash gourd)", needs:["ash gourd","coconut","curd"] },
  { name:"Moru Curry", needs:["curd","coconut"] },
  { name:"Egg Curry", needs:["egg","onion"], nonVeg:true },
  { name:"Chicken Curry", needs:["chicken","onion"], nonVeg:true },
  { name:"Fish Curry", needs:["fish","coconut"], nonVeg:true },
  { name:"Dal Fry", needs:["toor dal","onion"] },
  { name:"Erissery", needs:["pumpkin","cowpeas","coconut"] },
  { name:"Kootu Curry", needs:["raw banana","chana","coconut"] },
];

const TN_CURRIES = [
  { name:"TN Sambar", needs:["toor dal"], minFrom:SAMBAR_VEG, minCount:2, render:m=>`Sambar (${m.join(", ")})` },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Kootu", needs:["toor dal","coconut"], minFrom:KOOTU_VEG, minCount:1, render:m=>`Kootu (${m.join(", ")})` },
  { name:"Poriyal", needs:["coconut"], minFrom:PORIYAL_VEG, minCount:1, render:m=>`${m[0]} Poriyal` },
  { name:"Vathal Kuzhambu", needs:["tamarind","onion"] },
  { name:"Mor Kuzhambu", needs:["curd","coconut"] },
  { name:"Potato Podimas", needs:["potato","onion"] },
  { name:"Brinjal Gothsu", needs:["brinjal","tamarind"] },
  { name:"Egg Curry", needs:["egg","onion"], nonVeg:true },
  { name:"Chicken Chettinad", needs:["chicken","onion","coconut"], nonVeg:true },
  { name:"Fish Kulambu", needs:["fish","tamarind","onion"], nonVeg:true },
  { name:"Sundal", needs:["chana","coconut"] },
];

const AP_CURRIES = [
  { name:"AP Pappu", needs:["toor dal"], minFrom:PAPPU_VEG, minCount:1, render:m=>`Pappu (${m.join(", ")})` },
  { name:"AP Sambar", needs:["toor dal","tamarind"], minFrom:SAMBAR_VEG, minCount:2, render:m=>`Sambar (${m.join(", ")})` },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Vepudu", needs:["onion"], minFrom:VEPUDU_VEG, minCount:1, render:m=>`${m[0]} Vepudu` },
  { name:"Gutti Vankaya", needs:["brinjal","onion","coconut"] },
  { name:"Tomato Pappu", needs:["toor dal","tomato"] },
  { name:"Egg Curry", needs:["egg","onion"], nonVeg:true },
  { name:"Chicken Curry", needs:["chicken","onion"], nonVeg:true },
  { name:"Fish Pulusu", needs:["fish","tamarind","onion"], nonVeg:true },
  { name:"Dal Fry", needs:["toor dal","onion"] },
];

const TG_CURRIES = [
  { name:"TG Pappu", needs:["toor dal"], minFrom:PAPPU_VEG, minCount:1, render:m=>`Pappu (${m.join(", ")})` },
  { name:"TG Pulusu", needs:["tamarind","onion","tomato"] },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Vepudu", needs:["onion"], minFrom:VEPUDU_VEG, minCount:1, render:m=>`${m[0]} Vepudu` },
  { name:"Gutti Vankaya", needs:["brinjal","onion","coconut"] },
  { name:"Natu Kodi Pulusu", needs:["chicken","onion"], nonVeg:true },
  { name:"Egg Curry", needs:["egg","onion"], nonVeg:true },
  { name:"Tomato Pappu", needs:["toor dal","tomato"] },
  { name:"Dal Fry", needs:["toor dal","onion"] },
];

const KA_CURRIES = [
  { name:"Saaru (Rasam)", needs:["tomato","tamarind"] },
  { name:"Huli (Sambar)", needs:["toor dal"], minFrom:SAMBAR_VEG, minCount:2, render:m=>`Huli (${m.join(", ")})` },
  { name:"Palya", needs:["coconut"], minFrom:PALYA_VEG, minCount:1, render:m=>`${m[0]} Palya` },
  { name:"Gojju", needs:["tamarind","jaggery"], minFrom:GOJJU_VEG, minCount:1, render:m=>`${m[0]} Gojju` },
  { name:"Kootu", needs:["toor dal","coconut"], minFrom:KOOTU_VEG, minCount:1, render:m=>`Kootu (${m.join(", ")})` },
  { name:"Majjige Huli", needs:["curd","coconut"] },
  { name:"Egg Curry", needs:["egg","onion"], nonVeg:true },
  { name:"Chicken Saagu", needs:["chicken","onion","coconut"], nonVeg:true },
  { name:"Fish Curry", needs:["fish","coconut","onion"], nonVeg:true },
  { name:"Dal Fry", needs:["toor dal","onion"] },
  { name:"Ennegayi", needs:["brinjal","peanuts","onion"] },
];

const REGION_CURRIES = {
  "Kerala": KERALA_CURRIES, "Tamil Nadu": TN_CURRIES,
  "Andhra Pradesh": AP_CURRIES, "Telangana": TG_CURRIES, "Karnataka": KA_CURRIES,
};

// =====================================================================
//  MEAL RULES PER REGION
// =====================================================================

const SHARED_TEA_RULES = [
  { name:"Tea + Biscuit", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","biscuit"], simple:true },
  { name:"Tea + Rusk", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","rusk"], simple:true },
  { name:"Tea + Banana Chips", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","banana chips"], simple:true },
  { name:"Tea + Mixture", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","mixture"], simple:true },
  { name:"Coffee + Biscuit", type:"tea-snack", beverage:"coffee", base:["coffee powder","milk","sugar","biscuit"], simple:true },
  { name:"Coffee + Rusk", type:"tea-snack", beverage:"coffee", base:["coffee powder","milk","sugar","rusk"], simple:true },
  { name:"Coffee + Banana Chips", type:"tea-snack", beverage:"coffee", base:["coffee powder","milk","sugar","banana chips"], simple:true },
  { name:"Black Tea + Biscuit", type:"tea-snack", beverage:"tea", blackFallback:true, base:["tea powder","sugar","biscuit"], simple:true },
  { name:"Black Coffee + Biscuit", type:"tea-snack", beverage:"coffee", blackFallback:true, base:["coffee powder","sugar","biscuit"], simple:true },
  { name:"Black Tea", type:"tea-snack", beverage:"tea", blackFallback:true, base:["tea powder","sugar"], simple:true },
  { name:"Black Coffee", type:"tea-snack", beverage:"coffee", blackFallback:true, base:["coffee powder","sugar"], simple:true },
  { name:"Milk + Cookies", type:"snack", beverage:"either", base:["milk","cookies"], simple:true },
  { name:"Fresh Juice", type:"juice", beverage:"either", base:["sugar"], minFrom:JUICE_FRUIT, minCount:1, simple:false,
    render:c=>`Fresh ${c.matched[0]} Juice` },
];

// AP / Telangana additional tea-time favourites
const EXTRA_TEA_AP_TG = [
  { name:"Tea + Punugulu", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","urad dal","rice"], simple:false, priority:1 },
  { name:"Tea + Button Idli", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","rice","urad dal"], simple:false, priority:2 },
  { name:"Tea + Samosa", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","aata","potato"], simple:false, priority:2 },
  { name:"Tea + Mirchi Bajji", type:"tea-snack", beverage:"tea", base:["tea powder","milk","sugar","chilli","aata"], simple:false, priority:3 },
  { name:"Coffee + Punugulu", type:"tea-snack", beverage:"coffee", base:["coffee powder","milk","sugar","urad dal","rice"], simple:false, priority:1 },
  { name:"Coffee + Samosa", type:"tea-snack", beverage:"coffee", base:["coffee powder","milk","sugar","aata","potato"], simple:false, priority:2 },
];

// ---------- KERALA ----------
// Priority: lower number = preferred. Picker biases toward priority 1 within same dish family.
const MEAL_RULES_KERALA = {
  breakfast: [
    // Idli — coconut chutney first, sambar second
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true, priority:1 },
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true, priority:2 },
    // Dosa — coconut chutney first, sambar second
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:1 },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true, priority:2 },
    { name:"Masala Dosa + Chutney", type:"dosa", base:["rice","urad dal","potato","onion","coconut"], simple:true, priority:3 },
    // Puttu — banana first, kadala curry second
    { name:"Puttu + Banana", type:"puttu", base:["rice","banana"], simple:true, priority:1 },
    { name:"Puttu + Kadala Curry", type:"puttu", base:["rice","chana","coconut"], simple:true, priority:2 },
    // Appam — stew, green peas, chicken
    { name:"Appam + Veg Stew", type:"appam", base:["rice","potato","coconut milk"], simple:true, priority:1 },
    { name:"Appam + Green Peas Curry", type:"appam", base:["rice","green peas","coconut milk","onion"], simple:true, priority:2 },
    { name:"Appam + Chicken Curry", type:"appam", base:["rice","chicken","onion","coconut milk"], simple:false, nonVeg:true, priority:3 },
    { name:"Appam + Egg Curry", type:"appam", base:["rice","egg","onion"], simple:true, nonVeg:true, priority:4 },
    // Idiyappam
    { name:"Idiyappam + Veg Stew", type:"idiyappam", base:["rice","potato","coconut milk"], simple:true, priority:1 },
    { name:"Idiyappam + Egg Curry", type:"idiyappam", base:["rice","egg","onion"], simple:true, nonVeg:true, priority:2 },
    { name:"Idiyappam + Coconut Milk", type:"idiyappam", base:["rice","coconut milk"], simple:true, priority:3 },
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    // Poori — must be paired with potato curry
    { name:"Poori + Potato Curry", type:"poori", base:["aata","potato","onion"], simple:false, priority:1 },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true, nonVeg:true },
  ],
  lunch: [
    { name:"Rice + Sambar + Thoran", type:"rice-curry", base:["rice"], withCurry:true, withThoran:true, simple:true, priority:1,
      render:c=>`Rice + ${c.curry} + ${c.thoran||"Pickle"}` },
    { name:"Rice + Fish Curry", type:"rice-nonveg", base:["rice","fish","coconut"], withThoran:true, simple:false, nonVeg:true, priority:2,
      render:c=>`Rice + Fish Curry + ${c.thoran||"Pickle"}` },
    { name:"Rice + Chicken Curry", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false, nonVeg:true, priority:3 },
    { name:"Rice + Egg Curry + Thoran", type:"rice-curry", base:["rice","egg","onion"], withThoran:true, simple:true, nonVeg:true, priority:2,
      render:c=>`Rice + Egg Curry + ${c.thoran||"Pickle"}` },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true, nonVeg:true },
    // Chapati for lunch — only with chicken or potato curry (defining ingredient required)
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, special:true, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, special:true, priority:2 },
  ],
  tea: SHARED_TEA_RULES,
  dinner: [
    { name:"Rice + Sambar", type:"rice-light", base:["rice","toor dal"], minFrom:SAMBAR_VEG, minCount:1, simple:true, priority:1,
      render:c=>`Rice + Sambar (${c.matched.join(", ")})` },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true, priority:2 },
    { name:"Sambar Rice", type:"rice-light", base:["rice","toor dal"], simple:true, priority:3 },
    { name:"Dal Khichdi", type:"rice-light", base:["rice","moong dal"], simple:true, priority:3 },
    { name:"Kanji + Payar", type:"rice-light", base:["rice","cowpeas"], simple:true, priority:3 },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:2 },
    // Chapati for dinner — strictly only with chicken or potato curry
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, priority:2 },
  ],
};

const MEAL_RULES_TN = {
  breakfast: [
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    { name:"Idli + Groundnut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Masala Dosa + Chutney", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true },
    { name:"Rava Dosa + Chutney", type:"dosa", base:["rawa","rice","onion","coconut"], simple:true },
    { name:"Pongal + Coconut Chutney", type:"pongal", base:["rice","moong dal","coconut"], simple:true },
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Semiya Upma", type:"rawa", base:["vermicelli","onion"], simple:true },
    { name:"Poori + Potato Masala", type:"poori", base:["aata","potato","onion"], simple:false },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true, nonVeg:true },
  ],
  lunch: [
    { name:"Rice + Sambar + Poriyal", type:"rice-curry", base:["rice"], withCurry:true, withPoriyal:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.poriyal||"Appalam"}` },
    { name:"Rice + Rasam + Poriyal", type:"rice-light", base:["rice","tomato","tamarind"], withPoriyal:true, simple:true,
      render:c=>`Rice + Rasam + ${c.poriyal||"Papad"}` },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Puliyodarai (Tamarind Rice)", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Lemon Rice", type:"variety-rice", base:["rice"], simple:true },
    { name:"Rice + Fish Kulambu", type:"rice-nonveg", base:["rice","fish","tamarind","onion"], simple:false, nonVeg:true },
    { name:"Rice + Chicken Chettinad", type:"rice-nonveg", base:["rice","chicken","onion","coconut"], simple:false, nonVeg:true },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true, nonVeg:true },
    { name:"Chapati + Kurma", type:"chapati", base:["aata","potato","onion","coconut"], simple:false, special:true },
  ],
  tea: SHARED_TEA_RULES,
  dinner: [
    { name:"Rice + Sambar", type:"rice-light", base:["rice","toor dal"], minFrom:SAMBAR_VEG, minCount:1, simple:true,
      render:c=>`Rice + Sambar (${c.matched.join(", ")})` },
    { name:"Rice + Rasam", type:"rice-light", base:["rice","tomato","tamarind"], simple:true },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Sambar Rice", type:"rice-light", base:["rice","toor dal"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Chapati + Kurma", type:"chapati", base:["aata","potato","onion","coconut"], simple:false },
  ],
};

const MEAL_RULES_AP = {
  breakfast: [
    // Idli — groundnut chutney 1st, karam podi+ghee 2nd, sambar 3rd
    { name:"Idli + Groundnut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true, priority:1 },
    { name:"Idli + Karam Podi + Ghee", type:"steamed", base:["rice","urad dal","ghee","chilli powder"], simple:true, priority:2 },
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true, priority:3 },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true, priority:4 },
    // Dosa — groundnut chutney 1st, onion+ghee+karam 2nd, potato curry 3rd
    { name:"Dosa + Groundnut Chutney", type:"dosa", base:["rice","urad dal","peanuts"], simple:true, priority:1 },
    { name:"Dosa + Onion Karam Podi (Ghee)", type:"dosa", base:["rice","urad dal","onion","ghee","chilli powder"], simple:true, priority:2 },
    { name:"Dosa + Potato Curry", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true, priority:3 },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:4 },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true, priority:5 },
    // Pesarattu (signature AP)
    { name:"Pesarattu + Ginger Chutney", type:"pesarattu", base:["moong dal","ginger"], simple:true, priority:1 },
    { name:"Pesarattu + Upma (MLA Pesarattu)", type:"pesarattu", base:["moong dal","rawa","onion"], simple:true, priority:2 },
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Poori + Potato Curry", type:"poori", base:["aata","potato","onion"], simple:false, priority:1 },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true, nonVeg:true },
  ],
  lunch: [
    { name:"Rice + Pappu + Vepudu", type:"rice-curry", base:["rice"], withCurry:true, withVepudu:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.vepudu||"Pickle"}` },
    { name:"Rice + Sambar + Vepudu", type:"rice-curry", base:["rice","toor dal","tamarind"], withVepudu:true, simple:true,
      render:c=>`Rice + Sambar + ${c.vepudu||"Fryums"}` },
    { name:"Pulihora + Perugu", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Rice + Gutti Vankaya", type:"rice-veg", base:["rice","brinjal","onion","coconut"], simple:false },
    { name:"Rice + Chicken Curry", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false, nonVeg:true },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true, nonVeg:true },
    // Chapati for AP/TG lunch — chicken or potato required
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, special:true, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, special:true, priority:2 },
  ],
  tea: SHARED_TEA_RULES.concat(EXTRA_TEA_AP_TG),
  dinner: [
    { name:"Rice + Pappu", type:"rice-light", base:["rice","toor dal"], minFrom:PAPPU_VEG, minCount:1, simple:true, priority:1,
      render:c=>`Rice + Pappu (${c.matched.join(", ")})` },
    { name:"Rice + Rasam", type:"rice-light", base:["rice","tomato","tamarind"], simple:true, priority:2 },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true, priority:2 },
    { name:"Pesarattu", type:"pesarattu", base:["moong dal","rice"], simple:true, priority:2 },
    { name:"Dosa + Groundnut Chutney", type:"dosa", base:["rice","urad dal","peanuts"], simple:true, priority:2 },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:3 },
    // Chapati only with chicken or potato
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, priority:2 },
  ],
};

const MEAL_RULES_TG = {
  breakfast: [
    // Idli — groundnut chutney 1st, karam podi+ghee 2nd, sambar 3rd
    { name:"Idli + Groundnut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true, priority:1 },
    { name:"Idli + Karam Podi + Ghee", type:"steamed", base:["rice","urad dal","ghee","chilli powder"], simple:true, priority:2 },
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true, priority:3 },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true, priority:4 },
    // Dosa — groundnut chutney 1st, onion+ghee+karam 2nd, potato 3rd
    { name:"Dosa + Groundnut Chutney", type:"dosa", base:["rice","urad dal","peanuts"], simple:true, priority:1 },
    { name:"Dosa + Onion Karam Podi (Ghee)", type:"dosa", base:["rice","urad dal","onion","ghee","chilli powder"], simple:true, priority:2 },
    { name:"Dosa + Potato Curry", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true, priority:3 },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:4 },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true, priority:5 },
    // Pesarettu — signature TG breakfast as well
    { name:"Pesarattu + Ginger Chutney", type:"pesarattu", base:["moong dal","ginger"], simple:true, priority:1 },
    { name:"Pesarattu + Upma (MLA)", type:"pesarattu", base:["moong dal","rawa","onion"], simple:true, priority:2 },
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Poori + Aloo Curry", type:"poori", base:["aata","potato","onion"], simple:false, priority:1 },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true, nonVeg:true },
  ],
  lunch: [
    { name:"Rice + Pappu + Vepudu", type:"rice-curry", base:["rice"], withCurry:true, withVepudu:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.vepudu||"Perugu"}` },
    { name:"Rice + Pulusu + Vepudu", type:"rice-curry", base:["rice","tamarind","onion","tomato"], withVepudu:true, simple:true,
      render:c=>`Rice + Pulusu + ${c.vepudu||"Fryums"}` },
    { name:"Pulihora + Perugu", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Rice + Natu Kodi Pulusu", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false, nonVeg:true },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true, nonVeg:true },
    // Chapati for TG lunch — chicken or potato required
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, special:true, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, special:true, priority:2 },
  ],
  tea: SHARED_TEA_RULES.concat(EXTRA_TEA_AP_TG),
  dinner: [
    { name:"Rice + Pappu", type:"rice-light", base:["rice","toor dal"], minFrom:PAPPU_VEG, minCount:1, simple:true, priority:1,
      render:c=>`Rice + Pappu (${c.matched.join(", ")})` },
    { name:"Rice + Rasam + Pickle", type:"rice-light", base:["rice","tomato","tamarind"], simple:true, priority:2 },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true, priority:2 },
    { name:"Dosa + Groundnut Chutney", type:"dosa", base:["rice","urad dal","peanuts"], simple:true, priority:2 },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true, priority:3 },
    // Chapati only with chicken or potato
    { name:"Chapati + Chicken Curry", type:"chapati", base:["aata","chicken","onion"], simple:false, nonVeg:true, priority:1 },
    { name:"Chapati + Potato Curry", type:"chapati", base:["aata","potato","onion"], simple:false, priority:2 },
  ],
};

const MEAL_RULES_KA = {
  breakfast: [
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Masala Dosa + Chutney", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true },
    { name:"Rava Idli + Chutney", type:"steamed", base:["rawa","coconut"], simple:true },
    { name:"Akki Roti", type:"roti", base:["rice","onion","coconut"], simple:true },
    { name:"Ragi Mudde + Sambar", type:"ragi", base:["ragi flour","toor dal"], simple:true },
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Pongal + Coconut Chutney", type:"pongal", base:["rice","moong dal","coconut"], simple:true },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true, nonVeg:true },
  ],
  lunch: [
    { name:"Rice + Huli + Palya", type:"rice-curry", base:["rice"], withCurry:true, withPalya:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.palya||"Happala"}` },
    { name:"Rice + Saaru + Palya", type:"rice-light", base:["rice","tomato","tamarind"], withPalya:true, simple:true,
      render:c=>`Rice + Saaru + ${c.palya||"Kosambari"}` },
    { name:"Bisi Bele Bath", type:"variety-rice", base:["rice","toor dal","tamarind"], simple:true },
    { name:"Vangi Bath", type:"variety-rice", base:["rice","brinjal","peanuts"], simple:true },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Puliyogare (Tamarind Rice)", type:"variety-rice", base:["rice","tamarind","peanuts"], simple:true },
    { name:"Rice + Chicken Saagu", type:"rice-nonveg", base:["rice","chicken","onion","coconut"], simple:false, nonVeg:true },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true, nonVeg:true },
    { name:"Chapati + Dal Fry", type:"chapati", base:["aata","toor dal","onion"], simple:false, special:true },
  ],
  tea: SHARED_TEA_RULES,
  dinner: [
    { name:"Rice + Huli", type:"rice-light", base:["rice","toor dal"], minFrom:SAMBAR_VEG, minCount:1, simple:true,
      render:c=>`Rice + Huli (${c.matched.join(", ")})` },
    { name:"Rice + Saaru", type:"rice-light", base:["rice","tomato","tamarind"], simple:true },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Ragi Mudde + Saaru", type:"ragi", base:["ragi flour","tomato","tamarind"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Chapati + Dal Fry", type:"chapati", base:["aata","toor dal","onion"], simple:false },
  ],
};

const REGION_MEAL_RULES = {
  "Kerala": MEAL_RULES_KERALA, "Tamil Nadu": MEAL_RULES_TN,
  "Andhra Pradesh": MEAL_RULES_AP, "Telangana": MEAL_RULES_TG, "Karnataka": MEAL_RULES_KA,
};

const MEAL_RULES = MEAL_RULES_KERALA;
const DINNER_CURRIES = KERALA_CURRIES;

// =====================================================================
//  FESTIVAL DATA — Jan 2026 to Apr 2028
// =====================================================================
const FESTIVAL_DATA = [
  // ---- 2026 ----
  { id:"sankranti-2026", name:"Sankranti", states:["Andhra Pradesh","Telangana"],
    start:"2026-01-13", end:"2026-01-16", peak:"2026-01-14", greeting:"Makara Sankranti Subhakankshalu!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Pappu","Vada","Ariselu"]}},
      {dayOffset:1,title:"Sankranti",meals:{breakfast:["Pongal","Pulihora"],lunch:["Rice","Sambar","Pappu","Bobbatlu","Paramannam","Ariselu"]}},
      {dayOffset:2,title:"Kanuma",meals:{lunch:["Rice","Sambar","Pappu","Non-veg Curry","Payasam"]}},
      {dayOffset:3,title:"Mukkanuma",meals:{lunch:["Rice","Sambar","Pappu","Poriyal"]}},
    ]}},
  { id:"pongal-2026", name:"Pongal", states:["Tamil Nadu"],
    start:"2026-01-14", end:"2026-01-17", peak:"2026-01-15", greeting:"Iniya Pongal Nalvazhthukkal!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Kootu","Poriyal"]}},
      {dayOffset:1,title:"Thai Pongal",meals:{breakfast:["Ven Pongal","Sakkarai Pongal"],lunch:["Rice","Sambar","Kootu","Vadai","Payasam"]}},
      {dayOffset:2,title:"Mattu Pongal",meals:{lunch:["Rice","Sambar","Kootu","Poriyal","Payasam"]}},
      {dayOffset:3,title:"Kaanum Pongal",meals:{lunch:["Rice","Sambar","Rasam","Poriyal"]}},
    ]}},
  { id:"ugadi-2026", name:"Ugadi", states:["Andhra Pradesh","Telangana","Karnataka"],
    start:"2026-03-29", end:"2026-03-29", peak:"2026-03-29", greeting:"Ugadi Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Ugadi Pachadi","Pulihora"],lunch:["Rice","Bobbatlu","Payasam","Avakaya"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"vishu-2026", name:"Vishu", states:["Kerala"],
    start:"2026-04-14", end:"2026-04-15", peak:"2026-04-14", greeting:"Vishu Ashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Vishu Kanji","Thattil Koottu"],lunch:["Sadya","Vishu Katta","Veppampoorasam","Payasam"],dinner:["Rice","Sambar","Thoran","Papadam"]}}},
  { id:"onam-2026", name:"Onam", states:["Kerala"],
    start:"2026-08-28", end:"2026-09-06", peak:"2026-09-05", greeting:"Happy Onam! Onathappan varavaayi!",
    mealPlan:{type:"pattern",pattern:["simple","simple","medium","medium","medium","heavy","heavy","heavy","grand","grand"],
      templates:{simple:{lunch:["Rice","Sambar","Thoran","Papadam"]},medium:{lunch:["Rice","Sambar","Avial","Thoran","Papadam","Pickle"]},
        heavy:{lunch:["Rice","Sambar","Avial","Olan","Thoran","Papadam","Payasam"]},
        grand:{lunch:["Onasadya","Avial","Olan","Kootu Curry","Erissery","Kaalan","Rasam","Sambar","Thoran","Papadam","Ada Pradhaman","Pal Payasam","Banana Chips","Sharkara Upperi"]}}}},
  { id:"ganesh-2026", name:"Ganesh Chaturthi", states:["Karnataka","Andhra Pradesh","Telangana"],
    start:"2026-08-22", end:"2026-08-22", peak:"2026-08-22", greeting:"Happy Ganesh Chaturthi!",
    mealPlan:{type:"festival",meals:{breakfast:["Modak","Pulihora"],lunch:["Rice","Sambar","Kobbari Annam","Payasam"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"bathukamma-2026", name:"Bathukamma", states:["Telangana"],
    start:"2026-10-02", end:"2026-10-10", peak:"2026-10-10", greeting:"Bathukamma Panduga Subhakankshalu!",
    mealPlan:{type:"pattern",pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates:{simple:{lunch:["Rice","Pappu","Poriyal","Perugu"]},medium:{lunch:["Rice","Sambar","Pappu","Pulihora","Poriyal"]},
        heavy:{lunch:["Rice","Sambar","Pappu","Pulihora","Gutti Vankaya","Payasam"]},
        grand:{lunch:["Rice","Sambar","Pappu","Pulihora","Bobbatlu","Payasam","Garelu","Ariselu"]}}}},
  { id:"navaratri-2026", name:"Navaratri", states:["Tamil Nadu","Kerala","Andhra Pradesh","Telangana","Karnataka"],
    start:"2026-10-11", end:"2026-10-19", peak:"2026-10-19", greeting:"Happy Navaratri!",
    mealPlan:{type:"pattern",pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates:{simple:{lunch:["Rice","Sambar","Kootu","Sundal"]},medium:{lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Payasam"]},
        heavy:{lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Boli","Payasam","Sweet Pongal"]},
        grand:{lunch:["Vijayadashami Special","Puliyodarai","Lemon Rice","Sundal Varieties","Vadai","Kesari","Payasam"]}}}},
  { id:"deepavali-2026", name:"Deepavali", states:["Tamil Nadu","Kerala","Andhra Pradesh","Telangana","Karnataka"],
    start:"2026-10-20", end:"2026-10-20", peak:"2026-10-20", greeting:"Happy Deepavali!",
    mealPlan:{type:"festival",meals:{breakfast:["Pongal","Vada","Payasam"],lunch:["Rice","Sambar","Poriyal","Payasam","Sweets"],dinner:["Rice","Rasam","Papad"]}}},
  // ---- 2027 ----
  { id:"sankranti-2027", name:"Sankranti", states:["Andhra Pradesh","Telangana"],
    start:"2027-01-13", end:"2027-01-16", peak:"2027-01-14", greeting:"Makara Sankranti Subhakankshalu!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Pappu","Vada","Ariselu"]}},
      {dayOffset:1,title:"Sankranti",meals:{breakfast:["Pongal","Pulihora"],lunch:["Rice","Sambar","Pappu","Bobbatlu","Paramannam","Ariselu"]}},
      {dayOffset:2,title:"Kanuma",meals:{lunch:["Rice","Sambar","Pappu","Non-veg Curry","Payasam"]}},
      {dayOffset:3,title:"Mukkanuma",meals:{lunch:["Rice","Sambar","Pappu","Poriyal"]}},
    ]}},
  { id:"pongal-2027", name:"Pongal", states:["Tamil Nadu"],
    start:"2027-01-14", end:"2027-01-17", peak:"2027-01-15", greeting:"Iniya Pongal Nalvazhthukkal!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Kootu","Poriyal"]}},
      {dayOffset:1,title:"Thai Pongal",meals:{breakfast:["Ven Pongal","Sakkarai Pongal"],lunch:["Rice","Sambar","Kootu","Vadai","Payasam"]}},
      {dayOffset:2,title:"Mattu Pongal",meals:{lunch:["Rice","Sambar","Kootu","Poriyal","Payasam"]}},
      {dayOffset:3,title:"Kaanum Pongal",meals:{lunch:["Rice","Sambar","Rasam","Poriyal"]}},
    ]}},
  { id:"ugadi-2027", name:"Ugadi", states:["Andhra Pradesh","Telangana","Karnataka"],
    start:"2027-03-18", end:"2027-03-18", peak:"2027-03-18", greeting:"Ugadi Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Ugadi Pachadi","Pulihora"],lunch:["Rice","Bobbatlu","Payasam","Avakaya"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"vishu-2027", name:"Vishu", states:["Kerala"],
    start:"2027-04-14", end:"2027-04-15", peak:"2027-04-14", greeting:"Vishu Ashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Vishu Kanji","Thattil Koottu"],lunch:["Sadya","Vishu Katta","Veppampoorasam","Payasam"],dinner:["Rice","Sambar","Thoran","Papadam"]}}},
  { id:"onam-2027", name:"Onam", states:["Kerala"],
    start:"2027-09-16", end:"2027-09-25", peak:"2027-09-24", greeting:"Happy Onam! Onathappan varavaayi!",
    mealPlan:{type:"pattern",pattern:["simple","simple","medium","medium","medium","heavy","heavy","heavy","grand","grand"],
      templates:{simple:{lunch:["Rice","Sambar","Thoran","Papadam"]},medium:{lunch:["Rice","Sambar","Avial","Thoran","Papadam","Pickle"]},
        heavy:{lunch:["Rice","Sambar","Avial","Olan","Thoran","Papadam","Payasam"]},
        grand:{lunch:["Onasadya","Avial","Olan","Kootu Curry","Erissery","Kaalan","Rasam","Sambar","Thoran","Papadam","Ada Pradhaman","Pal Payasam","Banana Chips","Sharkara Upperi"]}}}},
  { id:"ganesh-2027", name:"Ganesh Chaturthi", states:["Karnataka","Andhra Pradesh","Telangana"],
    start:"2027-09-11", end:"2027-09-11", peak:"2027-09-11", greeting:"Happy Ganesh Chaturthi!",
    mealPlan:{type:"festival",meals:{breakfast:["Modak","Pulihora"],lunch:["Rice","Sambar","Kobbari Annam","Payasam"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"bathukamma-2027", name:"Bathukamma", states:["Telangana"],
    start:"2027-09-22", end:"2027-09-30", peak:"2027-09-30", greeting:"Bathukamma Panduga Subhakankshalu!",
    mealPlan:{type:"pattern",pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates:{simple:{lunch:["Rice","Pappu","Poriyal","Perugu"]},medium:{lunch:["Rice","Sambar","Pappu","Pulihora","Poriyal"]},
        heavy:{lunch:["Rice","Sambar","Pappu","Pulihora","Gutti Vankaya","Payasam"]},
        grand:{lunch:["Rice","Sambar","Pappu","Pulihora","Bobbatlu","Payasam","Garelu","Ariselu"]}}}},
  { id:"navaratri-2027", name:"Navaratri", states:["Tamil Nadu","Kerala","Andhra Pradesh","Telangana","Karnataka"],
    start:"2027-10-01", end:"2027-10-09", peak:"2027-10-09", greeting:"Happy Navaratri!",
    mealPlan:{type:"pattern",pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates:{simple:{lunch:["Rice","Sambar","Kootu","Sundal"]},medium:{lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Payasam"]},
        heavy:{lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Boli","Payasam","Sweet Pongal"]},
        grand:{lunch:["Vijayadashami Special","Puliyodarai","Lemon Rice","Sundal Varieties","Vadai","Kesari","Payasam"]}}}},
  { id:"deepavali-2027", name:"Deepavali", states:["Tamil Nadu","Kerala","Andhra Pradesh","Telangana","Karnataka"],
    start:"2027-10-10", end:"2027-10-10", peak:"2027-10-10", greeting:"Happy Deepavali!",
    mealPlan:{type:"festival",meals:{breakfast:["Pongal","Vada","Payasam"],lunch:["Rice","Sambar","Poriyal","Payasam","Sweets"],dinner:["Rice","Rasam","Papad"]}}},
  // ---- 2028 (Jan–Apr) ----
  { id:"sankranti-2028", name:"Sankranti", states:["Andhra Pradesh","Telangana"],
    start:"2028-01-13", end:"2028-01-16", peak:"2028-01-14", greeting:"Makara Sankranti Subhakankshalu!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Pappu","Vada","Ariselu"]}},
      {dayOffset:1,title:"Sankranti",meals:{breakfast:["Pongal","Pulihora"],lunch:["Rice","Sambar","Pappu","Bobbatlu","Paramannam","Ariselu"]}},
      {dayOffset:2,title:"Kanuma",meals:{lunch:["Rice","Sambar","Pappu","Non-veg Curry","Payasam"]}},
      {dayOffset:3,title:"Mukkanuma",meals:{lunch:["Rice","Sambar","Pappu","Poriyal"]}},
    ]}},
  { id:"pongal-2028", name:"Pongal", states:["Tamil Nadu"],
    start:"2028-01-14", end:"2028-01-17", peak:"2028-01-15", greeting:"Iniya Pongal Nalvazhthukkal!",
    mealPlan:{type:"progressive",days:[
      {dayOffset:0,title:"Bhogi",meals:{lunch:["Rice","Sambar","Kootu","Poriyal"]}},
      {dayOffset:1,title:"Thai Pongal",meals:{breakfast:["Ven Pongal","Sakkarai Pongal"],lunch:["Rice","Sambar","Kootu","Vadai","Payasam"]}},
      {dayOffset:2,title:"Mattu Pongal",meals:{lunch:["Rice","Sambar","Kootu","Poriyal","Payasam"]}},
      {dayOffset:3,title:"Kaanum Pongal",meals:{lunch:["Rice","Sambar","Rasam","Poriyal"]}},
    ]}},
  { id:"ugadi-2028", name:"Ugadi", states:["Andhra Pradesh","Telangana","Karnataka"],
    start:"2028-04-07", end:"2028-04-07", peak:"2028-04-07", greeting:"Ugadi Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Ugadi Pachadi","Pulihora"],lunch:["Rice","Bobbatlu","Payasam","Avakaya"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"vishu-2028", name:"Vishu", states:["Kerala"],
    start:"2028-04-14", end:"2028-04-15", peak:"2028-04-14", greeting:"Vishu Ashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Vishu Kanji","Thattil Koottu"],lunch:["Sadya","Vishu Katta","Veppampoorasam","Payasam"],dinner:["Rice","Sambar","Thoran","Papadam"]}}},

  // ===== ADDITIONAL REGIONAL FESTIVALS =====
  // ---- Kerala extras ----
  { id:"thrissur-pooram-2026", name:"Thrissur Pooram", states:["Kerala"],
    start:"2026-04-26", end:"2026-04-26", peak:"2026-04-26", greeting:"Pooram Aashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Puttu","Kadala Curry"],lunch:["Sadya","Avial","Olan","Thoran","Payasam"],dinner:["Rice","Sambar","Pickle"]}}},
  { id:"easter-2026", name:"Easter", states:["Kerala","Tamil Nadu"],
    start:"2026-04-05", end:"2026-04-05", peak:"2026-04-05", greeting:"Happy Easter!",
    mealPlan:{type:"festival",meals:{breakfast:["Appam","Egg Curry"],lunch:["Rice","Chicken Curry","Salad","Pal Payasam"],dinner:["Rice","Fish Curry"]}}},
  { id:"karthika-vilakku-2026", name:"Karthika Vilakku", states:["Kerala"],
    start:"2026-12-04", end:"2026-12-04", peak:"2026-12-04", greeting:"Karthika Vilakku Aashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Idli","Sambar"],lunch:["Rice","Sambar","Avial","Payasam"],dinner:["Appam","Stew"]}}},
  { id:"christmas-2026", name:"Christmas", states:["Kerala","Tamil Nadu","Andhra Pradesh","Telangana","Karnataka"],
    start:"2026-12-25", end:"2026-12-25", peak:"2026-12-25", greeting:"Merry Christmas!",
    mealPlan:{type:"festival",meals:{breakfast:["Appam","Stew"],lunch:["Chicken Biriyani","Salad","Plum Cake"],dinner:["Rice","Sambar","Pickle"]}}},
  // ---- Tamil Nadu extras ----
  { id:"karthigai-deepam-2026", name:"Karthigai Deepam", states:["Tamil Nadu"],
    start:"2026-12-04", end:"2026-12-04", peak:"2026-12-04", greeting:"Karthigai Deepam Nalvazhthukkal!",
    mealPlan:{type:"festival",meals:{breakfast:["Pori","Aval"],lunch:["Rice","Sambar","Poriyal","Pori Urundai","Appam"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"shivaratri-2026", name:"Maha Shivaratri", states:["Tamil Nadu","Andhra Pradesh","Telangana","Karnataka","Kerala"],
    start:"2026-02-15", end:"2026-02-15", peak:"2026-02-15", greeting:"Om Namah Shivaya!",
    mealPlan:{type:"festival",meals:{breakfast:["Sabudana Khichdi","Fruits"],lunch:["Rice","Curd Rice","Pickle"],dinner:["Rice","Sambar"]}}},
  { id:"varalakshmi-2026", name:"Varalakshmi Vratham", states:["Tamil Nadu","Andhra Pradesh","Telangana","Karnataka"],
    start:"2026-08-07", end:"2026-08-07", peak:"2026-08-07", greeting:"Varalakshmi Vratham Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Kesari","Pongal"],lunch:["Rice","Sambar","Vada","Payasam","Sundal"],dinner:["Rice","Rasam","Pickle"]}}},
  // ---- AP extras ----
  { id:"sri-rama-navami-2026", name:"Sri Rama Navami", states:["Andhra Pradesh","Telangana","Tamil Nadu","Karnataka"],
    start:"2026-03-27", end:"2026-03-27", peak:"2026-03-27", greeting:"Sri Rama Navami Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Vada","Pulihora"],lunch:["Rice","Sambar","Pulihora","Panakam","Vadapappu"],dinner:["Rice","Rasam"]}}},
  { id:"atla-tadde-2026", name:"Atla Tadde", states:["Andhra Pradesh","Telangana"],
    start:"2026-10-08", end:"2026-10-08", peak:"2026-10-08", greeting:"Atla Tadde Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Atlu (Dosa)","Chutney"],lunch:["Rice","Pappu","Vepudu"],dinner:["Atlu","Pickle"]}}},
  // ---- Telangana extras ----
  { id:"bonalu-2026", name:"Bonalu", states:["Telangana"],
    start:"2026-07-19", end:"2026-08-09", peak:"2026-08-02", greeting:"Bonalu Subhakankshalu!",
    mealPlan:{type:"pattern",pattern:["simple","simple","medium","medium","medium","medium","medium","heavy","heavy","heavy","heavy","heavy","heavy","heavy","grand","grand","grand","grand","grand","grand","grand","grand"],
      templates:{simple:{lunch:["Rice","Pappu","Vepudu","Perugu"]},medium:{lunch:["Rice","Pappu","Vepudu","Pulihora","Perugu"]},heavy:{lunch:["Rice","Pappu","Pulihora","Bonam","Vepudu","Perugu"]},grand:{lunch:["Bonam","Rice","Pappu","Pulihora","Garelu","Payasam","Bobbatlu"]}}}},
  { id:"sammakka-2026", name:"Sammakka Saralamma Jatara", states:["Telangana"],
    start:"2026-02-04", end:"2026-02-07", peak:"2026-02-05", greeting:"Sammakka Saralamma Jatara Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Pesarattu","Chutney"],lunch:["Rice","Pappu","Vepudu","Pulihora"],dinner:["Rice","Rasam","Pickle"]}}},

  // ===== Same recurring set for 2027 =====
  { id:"thrissur-pooram-2027", name:"Thrissur Pooram", states:["Kerala"],
    start:"2027-05-15", end:"2027-05-15", peak:"2027-05-15", greeting:"Pooram Aashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Puttu","Kadala Curry"],lunch:["Sadya","Avial","Olan","Thoran","Payasam"],dinner:["Rice","Sambar","Pickle"]}}},
  { id:"easter-2027", name:"Easter", states:["Kerala","Tamil Nadu"],
    start:"2027-03-28", end:"2027-03-28", peak:"2027-03-28", greeting:"Happy Easter!",
    mealPlan:{type:"festival",meals:{breakfast:["Appam","Egg Curry"],lunch:["Rice","Chicken Curry","Salad","Pal Payasam"],dinner:["Rice","Fish Curry"]}}},
  { id:"karthika-vilakku-2027", name:"Karthika Vilakku", states:["Kerala"],
    start:"2027-11-23", end:"2027-11-23", peak:"2027-11-23", greeting:"Karthika Vilakku Aashamsakal!",
    mealPlan:{type:"festival",meals:{breakfast:["Idli","Sambar"],lunch:["Rice","Sambar","Avial","Payasam"],dinner:["Appam","Stew"]}}},
  { id:"christmas-2027", name:"Christmas", states:["Kerala","Tamil Nadu","Andhra Pradesh","Telangana","Karnataka"],
    start:"2027-12-25", end:"2027-12-25", peak:"2027-12-25", greeting:"Merry Christmas!",
    mealPlan:{type:"festival",meals:{breakfast:["Appam","Stew"],lunch:["Chicken Biriyani","Salad","Plum Cake"],dinner:["Rice","Sambar","Pickle"]}}},
  { id:"karthigai-deepam-2027", name:"Karthigai Deepam", states:["Tamil Nadu"],
    start:"2027-11-23", end:"2027-11-23", peak:"2027-11-23", greeting:"Karthigai Deepam Nalvazhthukkal!",
    mealPlan:{type:"festival",meals:{breakfast:["Pori","Aval"],lunch:["Rice","Sambar","Poriyal","Pori Urundai","Appam"],dinner:["Rice","Rasam","Pickle"]}}},
  { id:"shivaratri-2027", name:"Maha Shivaratri", states:["Tamil Nadu","Andhra Pradesh","Telangana","Karnataka","Kerala"],
    start:"2027-03-06", end:"2027-03-06", peak:"2027-03-06", greeting:"Om Namah Shivaya!",
    mealPlan:{type:"festival",meals:{breakfast:["Sabudana Khichdi","Fruits"],lunch:["Rice","Curd Rice","Pickle"],dinner:["Rice","Sambar"]}}},
  { id:"sri-rama-navami-2027", name:"Sri Rama Navami", states:["Andhra Pradesh","Telangana","Tamil Nadu","Karnataka"],
    start:"2027-04-15", end:"2027-04-15", peak:"2027-04-15", greeting:"Sri Rama Navami Subhakankshalu!",
    mealPlan:{type:"festival",meals:{breakfast:["Vada","Pulihora"],lunch:["Rice","Sambar","Pulihora","Panakam","Vadapappu"],dinner:["Rice","Rasam"]}}},
  { id:"bonalu-2027", name:"Bonalu", states:["Telangana"],
    start:"2027-07-08", end:"2027-07-29", peak:"2027-07-22", greeting:"Bonalu Subhakankshalu!",
    mealPlan:{type:"pattern",pattern:["simple","simple","medium","medium","medium","medium","medium","heavy","heavy","heavy","heavy","heavy","heavy","heavy","grand","grand","grand","grand","grand","grand","grand","grand"],
      templates:{simple:{lunch:["Rice","Pappu","Vepudu","Perugu"]},medium:{lunch:["Rice","Pappu","Vepudu","Pulihora","Perugu"]},heavy:{lunch:["Rice","Pappu","Pulihora","Bonam","Vepudu","Perugu"]},grand:{lunch:["Bonam","Rice","Pappu","Pulihora","Garelu","Payasam","Bobbatlu"]}}}},
];

const REMINDER_SEED = [
  { title:"Buy Milk", frequency:"daily", time:"07:00", active:true },
  { title:"Vegetable shopping", frequency:"weekly", time:"09:00", active:true },
];

// Default water reminder configuration — disabled until user opts in.
const WATER_REMINDER_DEFAULT = {
  enabled: false,
  intervalMinutes: 60,    // every hour
  startTime: "08:00",
  endTime: "22:00",
  glassesGoal: 8,
};

// =====================================================================
//  ICON LIBRARY — keep this file as the single source of truth so the
//  same emoji shows up in Kitchen, Grocery, Meal Plan and Today views.
// =====================================================================
const ITEM_ICON = {
  // Vegetables
  "Carrot":"🥕","Potato":"🥔","Tomato":"🍅","Onion":"🧅","Shallots":"🧅",
  "Ladiesfinger":"🌿","Drumstick":"🌿","Chilli":"🌶️","Capsicum":"🫑",
  "Cauliflower":"🥦","Cabbage":"🥬","Snake gourd":"🥒","Ash gourd":"🥒",
  "Pumpkin":"🎃","Yam":"🍠","Raw banana":"🍌","Raw mango":"🥭",
  "Beans":"🫛","Beetroot":"🟣","Cucumber":"🥒","Brinjal":"🍆",
  "Ridge gourd":"🥒","Bottle gourd":"🥒","Bitter gourd":"🥒","Ivy gourd":"🥒",
  "Green peas":"🟢",
  // Staples & Pulses
  "Rice":"🍚","Toor dal":"🟡","Moong dal":"🟢","Urad dal":"⚪",
  "Chana":"🟠","Cowpeas":"🟤","Peanuts":"🥜","Rawa":"🌾","Aata":"🌾",
  "Sugar":"🍬","Salt":"🧂","Tea powder":"🍵","Coffee powder":"☕",
  "Jaggery":"🍯","Tamarind":"🟫","Vermicelli":"🍝","Ragi flour":"🌾","Jowar flour":"🌾",
  // Non-Veg
  "Chicken":"🍗","Fish":"🐟","Egg":"🥚","Prawns":"🦐","Mutton":"🥩",
  // Dairy & Bakery
  "Bread":"🍞","Curd":"🥛","Milk":"🥛","Coconut milk":"🥥",
  "Butter":"🧈","Ghee":"🧈",
  // Oils
  "Coconut oil":"🫗","Rice bran oil":"🫗","Sesame oil":"🫗",
  // Spices
  "Coconut":"🥥","Chilli powder":"🌶️","Masala powder":"🍂","General spices":"🌿",
  // Snacks
  "Biscuit":"🍪","Rusk":"🥖","Cookies":"🍪","Mixture":"🥨","Banana chips":"🍌",
  // Fruits
  "Banana":"🍌","Apple":"🍎","Mango":"🥭","Grapes":"🍇",
  "Pomegranate":"🍎","Watermelon":"🍉","Kiwi":"🥝","Strawberry":"🍓",
};

const CATEGORY_ICON = {
  "Vegetables":"🥬",
  "Staples & Pulses":"🌾",
  "Non-Veg":"🍗",
  "Dairy & Bakery":"🥛",
  "Oils":"🫗",
  "Spices":"🌶️",
  "Snacks":"🍪",
  "Fruits (Seasonal)":"🍎",
};

function getItemIcon(name) {
  return ITEM_ICON[name] || "🥗";
}
function getCategoryIcon(cat) {
  return CATEGORY_ICON[cat] || "🍽️";
}

// Keyword-based icon for meals — survives slight name variations.
function getMealIcon(name) {
  if (!name) return "🍽️";
  const n = name.toLowerCase();
  if (n.includes("biriyani") || n.includes("biryani")) return "🍛";
  if (n.includes("idli"))                              return "🥟";
  if (n.includes("dosa") || n.includes("pesarattu") || n.includes("appam") || n.includes("atlu")) return "🥞";
  if (n.includes("puttu"))                             return "🌾";
  if (n.includes("idiyappam"))                         return "🍜";
  if (n.includes("upma") || n.includes("pongal") || n.includes("khichdi") || n.includes("kanji")) return "🥣";
  if (n.includes("poori") || n.includes("puri") || n.includes("chapati") || n.includes("akki roti") || n.includes("ragi mudde") || n.includes("roti")) return "🫓";
  if (n.includes("bread"))                             return "🍞";
  if (n.includes("chicken"))                           return "🍗";
  if (n.includes("fish") || n.includes("prawn"))       return "🐟";
  if (n.includes("egg"))                               return "🥚";
  if (n.includes("rice") || n.includes("pulihora") || n.includes("puliyodarai") || n.includes("puliyogare") || n.includes("vangi bath") || n.includes("bisi bele") || n.includes("lemon rice")) return "🍚";
  if (n.includes("juice"))                             return "🥤";
  if (n.includes("coffee"))                            return "☕";
  if (n.startsWith("tea") || n.includes("black tea"))  return "🍵";
  if (n.includes("milk"))                              return "🥛";
  if (n.includes("samosa"))                            return "🥟";
  if (n.includes("punugulu") || n.includes("bajji") || n.includes("button idli") || n.includes("mixture") || n.includes("vada") || n.includes("garelu")) return "🥨";
  if (n.includes("payasam"))                           return "🍮";
  return "🍽️";
}
