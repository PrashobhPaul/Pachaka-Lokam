// Pachaka Lokam — v1.1 seed
// DESIGN RULES:
//   - Staple spices are ASSUMED available (chilli, curry leaves, mustard,
//     turmeric, cumin, ginger, garlic, salt, oil). Never check for them.
//   - Curry "needs" list only the DEFINING main ingredients.
//   - Lunch & dinner = rice-based meals. Chapati only as rare substitute.
//   - Breakfast combos must be authentic pairings.
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
    ["Capsicum",U("nos",2,1)],
  ]},
  { category: "Staples & Pulses", items: [
    ["Rice",U("kg",5,1)],["Toor dal",U("kg",1,0.25)],["Moong dal",U("kg",0.5,0.25)],
    ["Urad dal",U("kg",0.5,0.25)],["Chana",U("kg",0.5,0.25)],["Cowpeas",U("kg",0.5,0.25)],
    ["Peanuts",U("g",250,50)],
    ["Rawa",U("kg",0.5,0.25)],["Aata",U("kg",2,0.5)],["Sugar",U("kg",1,0.25)],
    ["Salt",U("kg",1,0.25)],["Tea powder",U("g",250,50)],["Coffee powder",U("g",200,50)],
    ["Jaggery",U("g",250,50)],["Tamarind",U("g",200,50)],
    ["Vermicelli",U("g",500,100)],["Ragi flour",U("kg",0.5,0.25)],
  ]},
  { category: "Non-Veg", items: [
    ["Chicken",U("kg",1,0.25)],["Fish",U("kg",1,0.25)],["Egg",U("nos",12,6)],["Prawns",U("kg",0.5,0.25)],
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
const FRUITS      = ["banana","apple","mango","grapes","pomegranate","watermelon","kiwi","strawberry"];
const JUICE_FRUIT = ["mango","watermelon","grapes","pomegranate"];

// TN-specific
const PORIYAL_VEG = ["beans","cabbage","carrot","cauliflower","ladiesfinger","beetroot","brinjal","snake gourd","capsicum"];
const KOOTU_VEG   = ["ash gourd","raw banana","yam","snake gourd","bottle gourd"];
// AP/TG-specific
const VEPUDU_VEG  = ["brinjal","ladiesfinger","bitter gourd","cabbage","beans","capsicum","cauliflower"];
const PAPPU_VEG   = ["tomato","bottle gourd","ridge gourd","drumstick","brinjal"];

// =====================================================================
//  REGIONAL CURRIES — only MAIN defining ingredients in "needs"
//  Staple spices (chilli, curry leaves, mustard, turmeric, cumin,
//  ginger, garlic, masala powder, oil) are NEVER checked.
// =====================================================================

const KERALA_CURRIES = [
  { name:"Sambar", needs:["toor dal"], minFrom:SAMBAR_VEG, minCount:2,
    render:m=>`Sambar (${m.join(", ")})` },
  { name:"Avial", needs:["coconut","curd"], minFrom:AVIAL_VEG, minCount:3,
    render:m=>`Avial (${m.join(", ")})` },
  { name:"Cabbage Thoran", needs:["cabbage","coconut"] },
  { name:"Carrot Thoran", needs:["carrot","coconut"] },
  { name:"Beans Thoran", needs:["beans","coconut"] },
  { name:"Potato Mezhukkupuratti", needs:["potato","onion"] },
  { name:"Kaalan", needs:["coconut","curd"], minFrom:["raw banana","yam"], minCount:1,
    render:m=>`Kaalan (${m.join(", ")})` },
  { name:"Olan", needs:["ash gourd","cowpeas","coconut milk"] },
  { name:"Vegetable Stew", needs:["potato","coconut milk"] },
  { name:"Pulissery (Mango)", needs:["mango","coconut","curd"] },
  { name:"Pulissery (Ash gourd)", needs:["ash gourd","coconut","curd"] },
  { name:"Moru Curry", needs:["curd","coconut"] },
  { name:"Egg Curry", needs:["egg","onion"] },
  { name:"Chicken Curry", needs:["chicken","onion"] },
  { name:"Fish Curry", needs:["fish","coconut"] },
  { name:"Dal Fry", needs:["toor dal","onion"] },
  { name:"Erissery", needs:["pumpkin","cowpeas","coconut"] },
  { name:"Kootu Curry", needs:["raw banana","chana","coconut"] },
];

const TN_CURRIES = [
  { name:"TN Sambar", needs:["toor dal"], minFrom:SAMBAR_VEG, minCount:2,
    render:m=>`Sambar (${m.join(", ")})` },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Kootu", needs:["toor dal","coconut"], minFrom:KOOTU_VEG, minCount:1,
    render:m=>`Kootu (${m.join(", ")})` },
  { name:"Poriyal", needs:["coconut"], minFrom:PORIYAL_VEG, minCount:1,
    render:m=>`${m[0]} Poriyal` },
  { name:"Vathal Kuzhambu", needs:["tamarind","onion"] },
  { name:"Mor Kuzhambu", needs:["curd","coconut"] },
  { name:"Potato Podimas", needs:["potato","onion"] },
  { name:"Brinjal Gothsu", needs:["brinjal","tamarind"] },
  { name:"Egg Curry", needs:["egg","onion"] },
  { name:"Chicken Chettinad", needs:["chicken","onion","coconut"] },
  { name:"Fish Kulambu", needs:["fish","tamarind","onion"] },
  { name:"Sundal", needs:["chana","coconut"] },
];

const AP_CURRIES = [
  { name:"AP Pappu", needs:["toor dal"], minFrom:PAPPU_VEG, minCount:1,
    render:m=>`Pappu (${m.join(", ")})` },
  { name:"AP Sambar", needs:["toor dal","tamarind"], minFrom:SAMBAR_VEG, minCount:2,
    render:m=>`Sambar (${m.join(", ")})` },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Vepudu", needs:["onion"], minFrom:VEPUDU_VEG, minCount:1,
    render:m=>`${m[0]} Vepudu` },
  { name:"Gutti Vankaya", needs:["brinjal","onion","coconut"] },
  { name:"Tomato Pappu", needs:["toor dal","tomato"] },
  { name:"Egg Curry", needs:["egg","onion"] },
  { name:"Chicken Curry", needs:["chicken","onion"] },
  { name:"Fish Pulusu", needs:["fish","tamarind","onion"] },
  { name:"Dal Fry", needs:["toor dal","onion"] },
];

const TG_CURRIES = [
  { name:"TG Pappu", needs:["toor dal"], minFrom:PAPPU_VEG, minCount:1,
    render:m=>`Pappu (${m.join(", ")})` },
  { name:"TG Pulusu", needs:["tamarind","onion","tomato"] },
  { name:"Rasam", needs:["tomato","tamarind"] },
  { name:"Vepudu", needs:["onion"], minFrom:VEPUDU_VEG, minCount:1,
    render:m=>`${m[0]} Vepudu` },
  { name:"Gutti Vankaya", needs:["brinjal","onion","coconut"] },
  { name:"Natu Kodi Pulusu", needs:["chicken","onion"] },
  { name:"Egg Curry", needs:["egg","onion"] },
  { name:"Tomato Pappu", needs:["toor dal","tomato"] },
  { name:"Dal Fry", needs:["toor dal","onion"] },
];

const REGION_CURRIES = {
  "Kerala": KERALA_CURRIES,
  "Tamil Nadu": TN_CURRIES,
  "Andhra Pradesh": AP_CURRIES,
  "Telangana": TG_CURRIES,
};

// =====================================================================
//  MEAL RULES PER REGION
//  Breakfast: authentic pairings only (idli+sambar/chutney, etc.)
//  Lunch: RICE-BASED only. Chapati is a rare special substitute.
//  Dinner: RICE-BASED primary. Chapati as occasional (simple:false).
//  Tea: beverage + snack.
// =====================================================================

// ---------- KERALA ----------
const MEAL_RULES_KERALA = {
  breakfast: [
    // Idli combos
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    // Dosa combos
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Masala Dosa + Chutney", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true },
    // Puttu combos
    { name:"Puttu + Kadala Curry", type:"puttu", base:["rice","chana","coconut"], simple:true },
    { name:"Puttu + Banana", type:"puttu", base:["rice","banana"], simple:true },
    // Appam combos
    { name:"Appam + Veg Stew", type:"appam", base:["rice","potato","coconut milk"], simple:true },
    { name:"Appam + Egg Curry", type:"appam", base:["rice","egg","onion"], simple:true },
    // Idiyappam combos
    { name:"Idiyappam + Egg Curry", type:"idiyappam", base:["rice","egg","onion"], simple:true },
    { name:"Idiyappam + Veg Stew", type:"idiyappam", base:["rice","potato","coconut milk"], simple:true },
    { name:"Idiyappam + Coconut Milk", type:"idiyappam", base:["rice","coconut milk"], simple:true },
    // Others
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Poori + Potato Masala", type:"poori", base:["aata","potato","onion"], simple:false },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true },
  ],
  lunch: [
    // All rice-based
    { name:"Rice + Sambar + Thoran", type:"rice-curry", base:["rice"], withCurry:true, withThoran:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.thoran||"Pickle"}` },
    { name:"Rice + Fish Curry", type:"rice-nonveg", base:["rice","fish","coconut"], withThoran:true, simple:false,
      render:c=>`Rice + Fish Curry + ${c.thoran||"Pickle"}` },
    { name:"Rice + Chicken Curry", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false,
      render:()=>`Rice + Chicken Curry + Salad` },
    { name:"Rice + Egg Curry + Thoran", type:"rice-curry", base:["rice","egg","onion"], withThoran:true, simple:true,
      render:c=>`Rice + Egg Curry + ${c.thoran||"Pickle"}` },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true },
    // Chapati as rare rice substitute
    { name:"Chapati + Curry", type:"chapati", base:["aata"], withCurry:true, simple:false, special:true,
      render:c=>`Chapati + ${c.curry}` },
  ],
  tea: [
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
    { name:"Fresh Fruit Plate", type:"fruit", beverage:"either", base:[], minFrom:FRUITS, minCount:1, simple:true,
      render:c=>`Fresh ${c.matched.join(" & ")} Plate` },
    { name:"Fresh Juice", type:"juice", beverage:"either", base:["sugar"], minFrom:JUICE_FRUIT, minCount:1, simple:false,
      render:c=>`Fresh ${c.matched[0]} Juice` },
  ],
  dinner: [
    // Rice-based primary
    { name:"Rice + Sambar", type:"rice-light", base:["rice","toor dal"], minFrom:SAMBAR_VEG, minCount:1, simple:true,
      render:c=>`Rice + Sambar (${c.matched.join(", ")})` },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Sambar Rice", type:"rice-light", base:["rice","toor dal"], simple:true },
    { name:"Dal Khichdi", type:"rice-light", base:["rice","moong dal"], simple:true },
    { name:"Kanji + Payar", type:"rice-light", base:["rice","cowpeas"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    // Chapati as occasional substitute
    { name:"Chapati + Curry", type:"chapati", base:["aata"], withCurry:true, simple:false,
      render:c=>`Chapati + ${c.curry}` },
  ],
};

// ---------- TAMIL NADU ----------
const MEAL_RULES_TN = {
  breakfast: [
    // Idli combos
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    { name:"Idli + Groundnut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true },
    // Dosa combos
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Masala Dosa + Chutney", type:"dosa", base:["rice","urad dal","potato","onion"], simple:true },
    { name:"Rava Dosa + Chutney", type:"dosa", base:["rawa","rice","onion","coconut"], simple:true },
    // Pongal
    { name:"Pongal + Coconut Chutney", type:"pongal", base:["rice","moong dal","coconut"], simple:true },
    // Others
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Semiya Upma", type:"rawa", base:["vermicelli","onion"], simple:true },
    { name:"Poori + Potato Masala", type:"poori", base:["aata","potato","onion"], simple:false },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true },
  ],
  lunch: [
    // Rice + Sambar + Poriyal (TN standard)
    { name:"Rice + Sambar + Poriyal", type:"rice-curry", base:["rice"], withCurry:true, withPoriyal:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.poriyal||"Appalam"}` },
    // Rice + Rasam + Poriyal
    { name:"Rice + Rasam + Poriyal", type:"rice-light", base:["rice","tomato","tamarind"], withPoriyal:true, simple:true,
      render:c=>`Rice + Rasam + ${c.poriyal||"Papad"}` },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    // Variety rice (still rice)
    { name:"Puliyodarai (Tamarind Rice)", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Lemon Rice", type:"variety-rice", base:["rice"], simple:true },
    // Non-veg rice meals
    { name:"Rice + Fish Kulambu", type:"rice-nonveg", base:["rice","fish","tamarind","onion"], simple:false },
    { name:"Rice + Chicken Chettinad", type:"rice-nonveg", base:["rice","chicken","onion","coconut"], simple:false },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true },
    // Chapati as rare substitute
    { name:"Chapati + Kurma", type:"chapati", base:["aata","potato","onion","coconut"], simple:false, special:true },
  ],
  tea: MEAL_RULES_KERALA.tea,
  dinner: [
    // Rice-based
    { name:"Rice + Sambar", type:"rice-light", base:["rice","toor dal"], minFrom:SAMBAR_VEG, minCount:1, simple:true,
      render:c=>`Rice + Sambar (${c.matched.join(", ")})` },
    { name:"Rice + Rasam", type:"rice-light", base:["rice","tomato","tamarind"], simple:true },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Sambar Rice", type:"rice-light", base:["rice","toor dal"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    // Chapati occasional
    { name:"Chapati + Kurma", type:"chapati", base:["aata","potato","onion","coconut"], simple:false },
  ],
};

// ---------- ANDHRA PRADESH ----------
const MEAL_RULES_AP = {
  breakfast: [
    // Pesarattu (AP signature)
    { name:"Pesarattu + Ginger Chutney", type:"pesarattu", base:["moong dal"], simple:true },
    // Idli combos
    { name:"Idli + Sambar", type:"steamed", base:["rice","urad dal","toor dal"], simple:true },
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    { name:"Idli + Peanut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true },
    // Dosa combos
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    // Others
    { name:"Upma", type:"rawa", base:["rawa","onion"], simple:true },
    { name:"Poori + Potato Curry", type:"poori", base:["aata","potato","onion"], simple:false },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true },
  ],
  lunch: [
    // Rice + Pappu + Vepudu (AP standard)
    { name:"Rice + Pappu + Vepudu", type:"rice-curry", base:["rice"], withCurry:true, withVepudu:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.vepudu||"Pickle"}` },
    // Rice + Sambar + Vepudu
    { name:"Rice + Sambar + Vepudu", type:"rice-curry", base:["rice","toor dal","tamarind"], withVepudu:true, simple:true,
      render:c=>`Rice + Sambar + ${c.vepudu||"Fryums"}` },
    // Variety rice
    { name:"Pulihora + Perugu", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    // Non-veg rice
    { name:"Rice + Gutti Vankaya", type:"rice-veg", base:["rice","brinjal","onion","coconut"], simple:false },
    { name:"Rice + Chicken Curry", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true },
    // Chapati rare
    { name:"Chapati + Dal Fry", type:"chapati", base:["aata","toor dal","onion"], simple:false, special:true },
  ],
  tea: MEAL_RULES_KERALA.tea,
  dinner: [
    // Rice-based
    { name:"Rice + Pappu", type:"rice-light", base:["rice","toor dal"], minFrom:PAPPU_VEG, minCount:1, simple:true,
      render:c=>`Rice + Pappu (${c.matched.join(", ")})` },
    { name:"Rice + Rasam", type:"rice-light", base:["rice","tomato","tamarind"], simple:true },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Pesarattu", type:"pesarattu", base:["moong dal","rice"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    // Chapati occasional
    { name:"Chapati + Dal Fry", type:"chapati", base:["aata","toor dal","onion"], simple:false },
  ],
};

// ---------- TELANGANA ----------
const MEAL_RULES_TG = {
  breakfast: [
    // Pesarattu (TG signature, served with upma)
    { name:"Pesarattu + Upma", type:"pesarattu", base:["moong dal","rawa","onion"], simple:true },
    // Idli combos
    { name:"Idli + Coconut Chutney", type:"steamed", base:["rice","urad dal","coconut"], simple:true },
    { name:"Idli + Peanut Chutney", type:"steamed", base:["rice","urad dal","peanuts"], simple:true },
    // Dosa combos
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    { name:"Dosa + Sambar", type:"dosa", base:["rice","urad dal","toor dal"], simple:true },
    // Others
    { name:"Poori + Aloo Curry", type:"poori", base:["aata","potato","onion"], simple:false },
    { name:"Bread + Egg Omelette", type:"bread", base:["bread","egg"], simple:true },
  ],
  lunch: [
    // Rice + Pappu + Vepudu (TG standard)
    { name:"Rice + Pappu + Vepudu", type:"rice-curry", base:["rice"], withCurry:true, withVepudu:true, simple:true,
      render:c=>`Rice + ${c.curry} + ${c.vepudu||"Perugu"}` },
    // Rice + Pulusu + Vepudu
    { name:"Rice + Pulusu + Vepudu", type:"rice-curry", base:["rice","tamarind","onion","tomato"], withVepudu:true, simple:true,
      render:c=>`Rice + Pulusu + ${c.vepudu||"Fryums"}` },
    // Variety rice
    { name:"Pulihora + Perugu", type:"variety-rice", base:["rice","tamarind"], simple:true },
    { name:"Curd Rice + Pickle", type:"rice-light", base:["rice","curd"], simple:true },
    // Non-veg rice
    { name:"Rice + Natu Kodi Pulusu", type:"rice-nonveg", base:["rice","chicken","onion"], simple:false },
    { name:"Chicken Biriyani", type:"biriyani", base:["rice","chicken","onion","curd"], simple:false, special:true },
    // Chapati rare
    { name:"Chapati + Dal", type:"chapati", base:["aata","toor dal","onion"], simple:false, special:true },
  ],
  tea: MEAL_RULES_KERALA.tea,
  dinner: [
    // Rice-based
    { name:"Rice + Pappu", type:"rice-light", base:["rice","toor dal"], minFrom:PAPPU_VEG, minCount:1, simple:true,
      render:c=>`Rice + Pappu (${c.matched.join(", ")})` },
    { name:"Rice + Rasam + Pickle", type:"rice-light", base:["rice","tomato","tamarind"], simple:true },
    { name:"Curd Rice", type:"rice-light", base:["rice","curd"], simple:true },
    { name:"Dosa + Coconut Chutney", type:"dosa", base:["rice","urad dal","coconut"], simple:true },
    // Chapati occasional
    { name:"Chapati + Dal", type:"chapati", base:["aata","toor dal","onion"], simple:false },
  ],
};

const REGION_MEAL_RULES = {
  "Kerala": MEAL_RULES_KERALA,
  "Tamil Nadu": MEAL_RULES_TN,
  "Andhra Pradesh": MEAL_RULES_AP,
  "Telangana": MEAL_RULES_TG,
};

// Legacy aliases
const MEAL_RULES = MEAL_RULES_KERALA;
const DINNER_CURRIES = KERALA_CURRIES;

// ===== FESTIVAL DATA =====
const FESTIVAL_DATA = [
  {
    id:"vishu", name:"Vishu", states:["Kerala"],
    start:"2026-04-14", end:"2026-04-15", peak:"2026-04-14",
    greeting:"Vishu Ashamsakal!",
    mealPlan: { type:"festival",
      meals: { breakfast:["Vishu Kanji","Thattil Koottu"],
               lunch:["Sadya","Vishu Katta","Veppampoorasam","Payasam"],
               dinner:["Rice","Sambar","Thoran","Papadam"] } }
  },
  {
    id:"onam", name:"Onam", states:["Kerala"],
    start:"2026-08-28", end:"2026-09-06", peak:"2026-09-05",
    greeting:"Happy Onam! Onathappan varavaayi!",
    mealPlan: { type:"pattern",
      pattern:["simple","simple","medium","medium","medium","heavy","heavy","heavy","grand","grand"],
      templates: {
        simple: { lunch:["Rice","Sambar","Thoran","Papadam"] },
        medium: { lunch:["Rice","Sambar","Avial","Thoran","Papadam","Pickle"] },
        heavy:  { lunch:["Rice","Sambar","Avial","Olan","Thoran","Papadam","Payasam"] },
        grand:  { lunch:["Onasadya","Avial","Olan","Kootu Curry","Erissery","Kaalan","Rasam","Sambar","Thoran","Papadam","Ada Pradhaman","Pal Payasam","Banana Chips","Sharkara Upperi"] },
      } }
  },
  {
    id:"pongal", name:"Pongal", states:["Tamil Nadu"],
    start:"2026-01-14", end:"2026-01-17", peak:"2026-01-15",
    greeting:"Iniya Pongal Nalvazhthukkal!",
    mealPlan: { type:"progressive",
      days: [
        { dayOffset:0, title:"Bhogi", meals:{ lunch:["Rice","Sambar","Kootu","Poriyal"] } },
        { dayOffset:1, title:"Thai Pongal", meals:{ breakfast:["Ven Pongal","Sakkarai Pongal"], lunch:["Rice","Sambar","Kootu","Vadai","Payasam"] } },
        { dayOffset:2, title:"Mattu Pongal", meals:{ lunch:["Rice","Sambar","Kootu","Poriyal","Payasam"] } },
        { dayOffset:3, title:"Kaanum Pongal", meals:{ lunch:["Rice","Sambar","Rasam","Poriyal"] } },
      ] }
  },
  {
    id:"navaratri", name:"Navaratri", states:["Tamil Nadu","Kerala","Andhra Pradesh","Telangana"],
    start:"2026-10-11", end:"2026-10-19", peak:"2026-10-19",
    greeting:"Happy Navaratri!",
    mealPlan: { type:"pattern",
      pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates: {
        simple: { lunch:["Rice","Sambar","Kootu","Sundal"] },
        medium: { lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Payasam"] },
        heavy:  { lunch:["Rice","Sambar","Kootu","Sundal","Vadai","Boli","Payasam","Sweet Pongal"] },
        grand:  { lunch:["Vijayadashami Special","Puliyodarai","Lemon Rice","Sundal Varieties","Vadai","Kesari","Payasam"] },
      } }
  },
  {
    id:"ugadi", name:"Ugadi", states:["Andhra Pradesh","Telangana"],
    start:"2026-03-29", end:"2026-03-29", peak:"2026-03-29",
    greeting:"Ugadi Subhakankshalu!",
    mealPlan: { type:"festival",
      meals: { breakfast:["Ugadi Pachadi","Pulihora"],
               lunch:["Rice","Bobbatlu","Payasam","Avakaya"],
               dinner:["Rice","Rasam","Pickle"] } }
  },
  {
    id:"sankranti", name:"Sankranti", states:["Andhra Pradesh","Telangana"],
    start:"2026-01-13", end:"2026-01-16", peak:"2026-01-14",
    greeting:"Makara Sankranti Subhakankshalu!",
    mealPlan: { type:"progressive",
      days: [
        { dayOffset:0, title:"Bhogi", meals:{ lunch:["Rice","Sambar","Pappu","Vada","Ariselu"] } },
        { dayOffset:1, title:"Sankranti", meals:{ breakfast:["Pongal","Pulihora"], lunch:["Rice","Sambar","Pappu","Bobbatlu","Paramannam","Ariselu"] } },
        { dayOffset:2, title:"Kanuma", meals:{ lunch:["Rice","Sambar","Pappu","Non-veg Curry","Payasam"] } },
        { dayOffset:3, title:"Mukkanuma", meals:{ lunch:["Rice","Sambar","Pappu","Poriyal"] } },
      ] }
  },
  {
    id:"bathukamma", name:"Bathukamma", states:["Telangana"],
    start:"2026-10-02", end:"2026-10-10", peak:"2026-10-10",
    greeting:"Bathukamma Panduga Subhakankshalu!",
    mealPlan: { type:"pattern",
      pattern:["simple","simple","simple","medium","medium","medium","heavy","heavy","grand"],
      templates: {
        simple: { lunch:["Rice","Pappu","Poriyal","Perugu"] },
        medium: { lunch:["Rice","Sambar","Pappu","Pulihora","Poriyal"] },
        heavy:  { lunch:["Rice","Sambar","Pappu","Pulihora","Gutti Vankaya","Payasam"] },
        grand:  { lunch:["Rice","Sambar","Pappu","Pulihora","Bobbatlu","Payasam","Garelu","Ariselu"] },
      } }
  },
];

const REMINDER_SEED = [
  { title:"Buy Milk", frequency:"daily", time:"07:00", active:true },
  { title:"Vegetable shopping", frequency:"weekly", time:"09:00", active:true },
];
