import { ApiResponse, MenuCategory, Product } from './types';

const img = (id: string, w = 400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

/** Reusable food photography so every item has a matching image. */
const IMG = {
  karahi: img('photo-1631452180519-c014fe946bc7'),
  curry: img('photo-1585937421612-70a008356fbe'),
  handi: img('photo-1603894584373-5ac82b2ae398'),
  biryani: img('photo-1563379091339-03b21ab4a4f8'),
  biryani2: img('photo-1589302168068-964664d93dc0'),
  pulao: img('photo-1596797038530-2c107229654b'),
  rice: img('photo-1586201375761-83865001e31c'),
  seekh: img('photo-1599487488170-d11ec9c172f0'),
  tikka: img('photo-1529042410759-befb1204b468'),
  bbq: img('photo-1555939594-58d7cb561ad1'),
  chops: img('photo-1544025162-d76694265947'),
  naan: img('photo-1601050690597-df0568f70950'),
  roti: img('photo-1626074353765-517a681e40be'),
  paratha: img('photo-1567337710282-00832b415979'),
  samosa: img('photo-1601050690117-94f5f6fa8bd7'),
  chaat: img('photo-1606491956689-2ea866880c84'),
  chai: img('photo-1571934811356-5cc061b6821f'),
  tea: img('photo-1544787219-7f47ccb76574'),
  kahwa: img('photo-1564890369478-c89ca6d9cde9'),
  coffee: img('photo-1509042239860-f550ce710b93'),
  lassi: img('photo-1553530666-ba11a7da3888'),
  juice: img('photo-1600271886742-f049cd451bba'),
  lemonade: img('photo-1523677011781-c91d1bbe2f9e'),
  soda: img('photo-1554866585-cd94860890b7'),
  shake: img('photo-1572490122747-3968b75cc699'),
  burger: img('photo-1568901346375-23c9450c58cd'),
  zinger: img('photo-1606755962773-d324e0a13086'),
  burger2: img('photo-1594212699903-ec8a3eca50f5'),
  fries: img('photo-1573080496219-bb080dd4f877'),
  nuggets: img('photo-1562967914-608f82629710'),
  friedChicken: img('photo-1626645738196-c2a7c87a8f58'),
  wings: img('photo-1527477396000-e27163b481c2'),
  pizza: img('photo-1513104890138-7c749659a591'),
  pizza2: img('photo-1574071318508-1cdbab80d002'),
  pizza3: img('photo-1628840042765-356cda07504e'),
  pizza4: img('photo-1565299624946-b28f40a0ae38'),
  garlicBread: img('photo-1573140401552-3fab0b24306f'),
  pasta: img('photo-1621996346565-e3dbc646d9a9'),
  shawarma: img('photo-1529006557810-274b9b2fc783'),
  wrap: img('photo-1561651823-34feb02250e4'),
  roll: img('photo-1626700051175-6818013e1d4f'),
  hummus: img('photo-1577805947697-89e18249d767'),
  falafel: img('photo-1593001874117-c99c800e3eb7'),
  nihari: img('photo-1574484284002-952d92456975'),
  haleem: img('photo-1547592180-85f173990554'),
  daal: img('photo-1546833999-b9f581a1996d'),
  halwa: img('photo-1587314168485-3236d6710814'),
  gulabJamun: img('photo-1601303516534-bf0b1eb70df4'),
  mithai: img('photo-1551024506-0bccd828d307'),
  kheer: img('photo-1488477181946-6428a0291777'),
  iceCream: img('photo-1563805042-7684c019e1cb'),
  kulfi: img('photo-1505394033641-40c6b8e6a5f7'),
  cake: img('photo-1578985545062-69928b1d9587'),
  cake2: img('photo-1571877227200-a0d98ea607e9'),
  cheesecake: img('photo-1524351199678-941a58a3df50'),
  noodles: img('photo-1585032226651-759b368d7246'),
  chinese: img('photo-1525755662778-989d0524087e'),
  soup: img('photo-1547592166-23ac45744acd'),
  prawns: img('photo-1559847844-5315695dadae'),
  springRoll: img('photo-1496116218417-1a781b1c416c'),
  atta: img('photo-1574323347407-f5e1ad6d020b'),
  oil: img('photo-1474979266404-7eaacbcd87c5'),
  sugar: img('photo-1581268497089-9da1a3a3a8d1'),
  lentils: img('photo-1515543904379-3d757afe72e4'),
  milk: img('photo-1550583724-b2692b85b150'),
  eggs: img('photo-1582722872445-44dc5f7e3c8f'),
  yogurt: img('photo-1488477181946-6428a0291777'),
  butter: img('photo-1589985270826-4b7bb135bc9d'),
  cheese: img('photo-1486297678162-eb2a19b0a32d'),
  biscuits: img('photo-1558961363-fa8fdf82db35'),
  chips: img('photo-1566478989037-eec170784d0b'),
  detergent: img('photo-1610557892470-55d9e80c0bce'),
  tissues: img('photo-1584308666744-24d5c474f2ae'),
  potatoes: img('photo-1518977676601-b53f82aba655'),
  onions: img('photo-1508747703725-719777637510'),
  tomatoes: img('photo-1592924357228-91a4daadcfea'),
  chillies: img('photo-1583119912267-cc97c911e416'),
  ginger: img('photo-1615485500704-8e990f9900f7'),
  spinach: img('photo-1576045057995-568f588f82fb'),
  okra: img('photo-1425543103986-22abb7d7e8d2'),
  cauliflower: img('photo-1568584711075-3d021a7c3ca3'),
  lemon: img('photo-1590502593747-42a996133562'),
  mango: img('photo-1553279768-865429fa0078'),
  banana: img('photo-1571771894821-ce9b6c11b08e'),
  apple: img('photo-1560806887-1e4cd0b6cbd6'),
  grapes: img('photo-1537640538966-79f369143f8f'),
  guava: img('photo-1536511132770-e5058c7e8c46'),
  pomegranate: img('photo-1541344999736-83eca272f6fc'),
  orange: img('photo-1547514701-42782101795e'),
  watermelon: img('photo-1587049352846-4a222e784d38'),
  bread: img('photo-1509440159596-0249088772ff'),
  buns: img('photo-1549931319-a545dcf3bc73'),
  rusk: img('photo-1555507036-ab1f4038808a'),
  patties: img('photo-1509365465985-25d11c17e812'),
  brownie: img('photo-1607920591413-4ec007e70023'),
  croissant: img('photo-1555507036-ab1f4038808a'),
  cookies: img('photo-1499636136210-6f4ee915583e'),
  tablets: img('photo-1584308666744-24d5c474f2ae'),
  medicine: img('photo-1471864190281-a93a3070b6de'),
  syrup: img('photo-1587854692152-cbe660dbde88'),
  vitamins: img('photo-1550572017-edd951b55104'),
  omega: img('photo-1577401239170-897942555fb3'),
  sanitizer: img('photo-1584744982491-665216d95f8b'),
  toothpaste: img('photo-1559591937-abc3a5d51f42'),
  mask: img('photo-1586942593568-29361efcd571'),
  sunscreen: img('photo-1556228720-195a672e8a03'),
  diapers: img('photo-1515488042361-ee00e0ddd4e4'),
  wipes: img('photo-1519689680058-324335c77eba'),
  lotion: img('photo-1556228578-8c89e6adf883'),
  thermometer: img('photo-1584036561566-baf8f5f1b144'),
  bpMonitor: img('photo-1615486511484-92e172cc4fe0'),
  glucometer: img('photo-1579684385127-1ef15d508118'),
  nebulizer: img('photo-1584982751601-97dcc096659c'),
  whey: img('photo-1593095948071-474c5cc2989d'),
  electrolyte: img('photo-1622484212850-eb596d769edc'),
  bandage: img('photo-1603398938378-e54eab446dde'),
  antiseptic: img('photo-1584744982491-665216d95f8b'),
  spray: img('photo-1631549916768-4119b2e5f926'),
  feeder: img('photo-1519689680058-324335c77eba'),
};

type ItemSeed = {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  compareAtPrice?: number;
  isVeg?: boolean;
  isPopular?: boolean;
  unit?: string;
};

type MenuSeed = {
  storeId: string;
  categories: { id: string; name: string; items: ItemSeed[] }[];
};

/** Compact item builder: (id, name, description, price, image, extras). */
const it = (id: string, name: string, description: string, price: number, image: string, extra: Partial<ItemSeed> = {}): ItemSeed => ({
  id,
  name,
  description,
  price,
  image,
  ...extra,
});

const seeds: MenuSeed[] = [
  {
    storeId: 'st_karahi_point',
    categories: [
      {
        id: 'starters',
        name: 'Starters',
        items: [
          it('seekh', 'Seekh Kebab (4 pcs)', 'Juicy beef seekh kebabs grilled over charcoal, served with mint chutney.', 550, IMG.seekh, { isPopular: true }),
          it('tikka', 'Chicken Tikka (2 pcs)', 'Marinated chicken tikka, smoky and tender.', 480, IMG.tikka),
          it('fish', 'Lahori Fried Fish', 'Crispy spiced river fish, a Lahore winter favourite.', 750, IMG.friedChicken),
          it('malai_boti', 'Chicken Malai Boti', 'Creamy, mild boneless boti with a hint of black pepper.', 690, IMG.bbq, { isPopular: true }),
        ],
      },
      {
        id: 'karahi',
        name: 'Karahi & Handi',
        items: [
          it('chicken_karahi_full', 'Chicken Karahi (Full)', 'Signature desi chicken karahi with fresh tomatoes, ginger and green chillies. Serves 3-4.', 1850, IMG.karahi, { isPopular: true }),
          it('chicken_karahi_half', 'Chicken Karahi (Half)', 'Our signature karahi in a half portion. Serves 1-2.', 990, IMG.karahi),
          it('mutton_karahi_half', 'Mutton Karahi (Half)', 'Slow-cooked mutton karahi with bone-in pieces.', 1650, IMG.curry),
          it('white_karahi', 'White Chicken Karahi', 'Creamy cashew and yogurt based karahi.', 1150, IMG.handi),
          it('chicken_handi', 'Chicken Boneless Handi', 'Rich, buttery boneless chicken handi.', 1250, IMG.handi, { isPopular: true }),
          it('daal_makhani', 'Daal Makhani', 'Overnight simmered black lentils with butter and cream.', 450, IMG.daal, { isVeg: true }),
        ],
      },
      {
        id: 'breads',
        name: 'Breads & Rice',
        items: [
          it('roti', 'Tandoori Roti', 'Fresh from the tandoor.', 30, IMG.roti, { isVeg: true }),
          it('garlic_naan', 'Garlic Naan', 'Soft naan brushed with garlic butter.', 80, IMG.naan, { isVeg: true, isPopular: true }),
          it('roghni_naan', 'Roghni Naan', 'Sesame-topped, slightly sweet naan.', 70, IMG.naan, { isVeg: true }),
          it('plain_rice', 'Plain Basmati Rice', 'Steamed long-grain basmati.', 250, IMG.rice, { isVeg: true }),
          it('kabuli_pulao', 'Kabuli Pulao', 'Afghan-style pulao with carrots, raisins and tender beef.', 550, IMG.pulao),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('mint_margarita', 'Mint Margarita', 'Fresh mint, lemon and soda.', 250, IMG.lemonade, { isVeg: true, isPopular: true }),
          it('lassi', 'Sweet Lassi', 'Thick Punjabi lassi topped with malai.', 180, IMG.lassi, { isVeg: true }),
          it('soft_drink', 'Soft Drink 1.5L', 'Coke, Sprite or Fanta.', 200, IMG.soda, { isVeg: true }),
          it('fresh_lime', 'Fresh Lime Soda', 'Sweet or salted.', 150, IMG.lemonade, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_biryani_express',
    categories: [
      {
        id: 'biryani',
        name: 'Biryani & Rice',
        items: [
          it('chicken_biryani', 'Chicken Biryani', 'Classic Lahori chicken biryani with aloo, served with raita.', 350, IMG.biryani, { isPopular: true }),
          it('beef_biryani', 'Beef Biryani', 'Tender beef chunks layered with fragrant basmati.', 420, IMG.biryani2),
          it('mutton_biryani', 'Mutton Biryani', 'Premium mutton biryani, dum-cooked.', 650, IMG.biryani2, { isPopular: true }),
          it('sindhi_biryani', 'Sindhi Biryani', 'Spicy Sindhi style with potatoes and tomatoes.', 380, IMG.biryani),
          it('chicken_pulao', 'Chicken Yakhni Pulao', 'Mild, aromatic pulao cooked in chicken stock.', 320, IMG.pulao),
          it('prawn_biryani', 'Prawn Biryani', 'Karachi-style prawn biryani.', 750, IMG.prawns),
          it('family_deal', 'Family Deal (Serves 4)', '4 chicken biryani, 4 raita, 1.5L drink.', 1450, IMG.biryani, { compareAtPrice: 1650, isPopular: true }),
        ],
      },
      {
        id: 'sides',
        name: 'Sides',
        items: [
          it('raita', 'Mint Raita', 'Cooling yogurt with mint and cumin.', 60, IMG.yogurt, { isVeg: true }),
          it('shami', 'Shami Kebab (2 pcs)', 'Beef and chana daal kebabs, shallow fried.', 120, IMG.seekh),
          it('salad', 'Fresh Salad', 'Onion, cucumber, tomato and lemon.', 80, IMG.chaat, { isVeg: true }),
          it('boti', 'Chicken Boti (6 pcs)', 'Charcoal grilled boneless boti.', 350, IMG.tikka),
        ],
      },
      {
        id: 'desserts',
        name: 'Desserts',
        items: [
          it('kheer', 'Kheer', 'Slow-cooked rice pudding with cardamom and pistachio.', 150, IMG.kheer, { isVeg: true, isPopular: true }),
          it('gulab_jamun', 'Gulab Jamun (2 pcs)', 'Soft, syrupy and warm.', 120, IMG.gulabJamun, { isVeg: true }),
          it('zarda', 'Zarda', 'Sweet saffron rice with dry fruits.', 150, IMG.rice, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('coke', 'Soft Drink 1.5L', 'Chilled Coke, Sprite or Fanta.', 200, IMG.soda, { isVeg: true }),
          it('lassi', 'Sweet Lassi', 'Traditional Punjabi lassi.', 150, IMG.lassi, { isVeg: true }),
          it('can', 'Soft Drink (Can)', '250ml can.', 100, IMG.soda, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_tikka_tarang',
    categories: [
      {
        id: 'bbq',
        name: 'BBQ',
        items: [
          it('tikka_leg', 'Chicken Tikka (Leg)', 'Classic Lahori tikka, charred and spicy.', 450, IMG.tikka, { isPopular: true }),
          it('malai_boti', 'Chicken Malai Boti', 'Creamy marinated boneless boti.', 690, IMG.bbq, { isPopular: true }),
          it('reshmi', 'Reshmi Kebab', 'Silky minced chicken kebabs.', 620, IMG.seekh),
          it('beef_seekh', 'Beef Seekh Kebab (4 pcs)', 'Spiced minced beef on skewers.', 550, IMG.seekh),
          it('mutton_chops', 'Mutton Chops (4 pcs)', 'Marinated mutton chops grilled to perfection.', 1450, IMG.chops),
          it('beef_boti', 'Beef Bihari Boti', 'Tender Bihari-style beef boti with mustard oil marinade.', 720, IMG.bbq),
          it('platter', 'BBQ Platter (Serves 2)', 'Tikka, malai boti, seekh kebab, naan and raita.', 2450, IMG.bbq, { compareAtPrice: 2750, isPopular: true }),
        ],
      },
      {
        id: 'breads',
        name: 'Naan & Rice',
        items: [
          it('roghni', 'Roghni Naan', 'Sesame topped naan.', 70, IMG.naan, { isVeg: true }),
          it('kulcha', 'Kulcha', 'Soft tandoori kulcha.', 60, IMG.roti, { isVeg: true }),
          it('namkeen_rice', 'Namkeen Rice', 'Lightly spiced rice, perfect with BBQ.', 300, IMG.rice, { isVeg: true }),
        ],
      },
      {
        id: 'sides',
        name: 'Sides & Chutneys',
        items: [
          it('raita', 'Mint Raita', 'House raita.', 70, IMG.yogurt, { isVeg: true }),
          it('kachumber', 'Kachumber Salad', 'Chopped onion, tomato, cucumber and lemon.', 100, IMG.chaat, { isVeg: true }),
          it('imli', 'Imli Chutney', 'Tangy tamarind chutney.', 50, IMG.chaat, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('kahwa', 'Peshawari Kahwa', 'Green tea with cardamom.', 180, IMG.kahwa, { isVeg: true }),
          it('doodh_patti', 'Doodh Patti', 'Strong milk tea.', 150, IMG.chai, { isVeg: true }),
          it('soda', 'Soft Drink 1.5L', 'Chilled.', 200, IMG.soda, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_burger_junction',
    categories: [
      {
        id: 'burgers',
        name: 'Burgers',
        items: [
          it('zinger', 'Zinger Burger', 'Crispy spicy chicken fillet, lettuce and mayo.', 450, IMG.zinger, { isPopular: true }),
          it('double_zinger', 'Double Decker Zinger', 'Two zinger fillets, double cheese.', 690, IMG.zinger),
          it('beef_classic', 'Classic Beef Burger', 'Grilled beef patty with cheese, onions and pickles.', 550, IMG.burger, { isPopular: true }),
          it('smash', 'Smash Burger', 'Double smashed beef patties with secret sauce.', 620, IMG.burger2),
          it('grilled_chicken', 'Grilled Chicken Burger', 'Healthier grilled chicken with honey mustard.', 490, IMG.burger),
          it('spicy_crunch', 'Spicy Crunch Burger', 'Extra crunchy, extra spicy.', 470, IMG.zinger),
        ],
      },
      {
        id: 'sides',
        name: 'Sides',
        items: [
          it('fries', 'French Fries', 'Golden, salted fries.', 220, IMG.fries, { isVeg: true, isPopular: true }),
          it('loaded_fries', 'Loaded Fries', 'Fries with cheese sauce, chicken and jalapeños.', 380, IMG.fries),
          it('nuggets', 'Chicken Nuggets (6 pcs)', 'Crispy nuggets with dip.', 350, IMG.nuggets),
          it('wings', 'Hot Wings (6 pcs)', 'Spicy fried wings.', 420, IMG.wings),
          it('coleslaw', 'Coleslaw', 'Creamy cabbage slaw.', 90, IMG.chaat, { isVeg: true }),
        ],
      },
      {
        id: 'deals',
        name: 'Deals',
        items: [
          it('zinger_meal', 'Zinger Meal', 'Zinger burger, fries and a drink.', 690, IMG.zinger, { compareAtPrice: 790, isPopular: true }),
          it('family_bucket', 'Family Bucket', '8 pcs fried chicken, 2 large fries, 1.5L drink.', 2200, IMG.friedChicken, { compareAtPrice: 2500 }),
          it('kids_meal', 'Kids Meal', 'Mini burger, small fries, juice.', 450, IMG.burger),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('soda', 'Soft Drink (Regular)', '345ml.', 100, IMG.soda, { isVeg: true }),
          it('shake', 'Oreo Milkshake', 'Thick and creamy.', 350, IMG.shake, { isVeg: true }),
          it('margarita', 'Mint Margarita', 'Refreshing mint and lime.', 220, IMG.lemonade, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_pizza_pointe',
    categories: [
      {
        id: 'pizzas',
        name: 'Pizzas',
        items: [
          it('tikka', 'Chicken Tikka Pizza (Medium)', 'Desi tikka chunks, onions and capsicum.', 1150, IMG.pizza2, { isPopular: true }),
          it('fajita', 'Chicken Fajita (Medium)', 'Fajita chicken, jalapeños and cheese.', 1150, IMG.pizza3, { isPopular: true }),
          it('malai_boti', 'Malai Boti Pizza (Large)', 'Creamy malai boti on a cheesy base.', 1650, IMG.pizza),
          it('cheese', 'Cheese Lovers (Medium)', 'Triple cheese blend.', 950, IMG.pizza4, { isVeg: true }),
          it('pepperoni', 'Beef Pepperoni (Medium)', 'Beef pepperoni with mozzarella.', 1250, IMG.pizza3),
          it('bihari', 'Beef Bihari Pizza (Medium)', 'Bihari kebab topping with tangy sauce.', 1350, IMG.pizza2),
        ],
      },
      {
        id: 'starters',
        name: 'Starters',
        items: [
          it('garlic_bread', 'Garlic Bread', 'Cheesy garlic bread sticks.', 350, IMG.garlicBread, { isVeg: true }),
          it('wings', 'Chicken Wings (6 pcs)', 'BBQ or hot.', 550, IMG.wings),
          it('cheese_sticks', 'Cheese Sticks', 'Mozzarella sticks with marinara.', 450, IMG.garlicBread, { isVeg: true }),
        ],
      },
      {
        id: 'pasta',
        name: 'Pasta',
        items: [
          it('alfredo', 'Chicken Alfredo', 'Creamy alfredo with grilled chicken.', 850, IMG.pasta, { isPopular: true }),
          it('arrabbiata', 'Penne Arrabbiata', 'Spicy tomato sauce.', 750, IMG.pasta, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('soda', 'Soft Drink 1.5L', 'Chilled.', 200, IMG.soda, { isVeg: true }),
          it('lemonade', 'Lemonade', 'Fresh lemonade.', 180, IMG.lemonade, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_chai_khana',
    categories: [
      {
        id: 'chai',
        name: 'Chai & Coffee',
        items: [
          it('doodh_patti', 'Doodh Patti', 'Strong, milky and sweet.', 150, IMG.chai, { isVeg: true, isPopular: true }),
          it('karak', 'Karak Chai', 'Extra strong with cardamom.', 130, IMG.tea, { isVeg: true }),
          it('kashmiri', 'Kashmiri Pink Chai', 'Pink chai with pistachio and almonds.', 220, IMG.chai, { isVeg: true, isPopular: true }),
          it('green_tea', 'Green Tea', 'Light and refreshing.', 100, IMG.kahwa, { isVeg: true }),
          it('cold_coffee', 'Cold Coffee', 'Blended with ice cream.', 320, IMG.coffee, { isVeg: true }),
        ],
      },
      {
        id: 'breakfast',
        name: 'Breakfast',
        items: [
          it('aloo_paratha', 'Aloo Paratha', 'Stuffed potato paratha with yogurt.', 220, IMG.paratha, { isVeg: true, isPopular: true }),
          it('anda_paratha', 'Anda Paratha', 'Paratha with a fried egg.', 250, IMG.paratha),
          it('halwa_puri', 'Halwa Puri Set', '2 puri, halwa, channay and achaar.', 350, IMG.halwa, { isVeg: true, isPopular: true }),
          it('omelette', 'Desi Omelette', 'With onions, tomatoes and green chillies.', 150, IMG.eggs),
          it('channay', 'Channay', 'Spiced chickpeas.', 180, IMG.daal, { isVeg: true }),
        ],
      },
      {
        id: 'snacks',
        name: 'Snacks',
        items: [
          it('samosa', 'Samosa (2 pcs)', 'Crispy aloo samosas with chutney.', 80, IMG.samosa, { isVeg: true, isPopular: true }),
          it('pakora', 'Pakora Plate', 'Mixed vegetable pakoras.', 200, IMG.samosa, { isVeg: true }),
          it('chicken_roll', 'Chicken Roll', 'Paratha roll with chicken and chutney.', 180, IMG.roll),
          it('bun_kebab', 'Bun Kebab', 'Karachi-style bun kebab.', 150, IMG.burger),
          it('dahi_bhalla', 'Dahi Bhalla', 'Lentil dumplings in yogurt with chutneys.', 200, IMG.chaat, { isVeg: true }),
        ],
      },
      {
        id: 'sweets',
        name: 'Sweets',
        items: [
          it('zarda', 'Zarda', 'Sweet saffron rice.', 150, IMG.rice, { isVeg: true }),
          it('gajar_halwa', 'Gajar Ka Halwa', 'Carrot halwa with khoya.', 220, IMG.halwa, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_shawarma_stop',
    categories: [
      {
        id: 'shawarma',
        name: 'Shawarma',
        items: [
          it('chicken', 'Chicken Shawarma', 'Classic chicken shawarma with garlic sauce.', 250, IMG.shawarma, { isPopular: true }),
          it('zinger', 'Zinger Shawarma', 'Crispy zinger strips with spicy mayo.', 320, IMG.wrap, { isPopular: true }),
          it('beef', 'Beef Shawarma', 'Marinated beef with tahini.', 350, IMG.shawarma),
          it('cheese', 'Cheese Shawarma', 'Loaded with melted cheese.', 300, IMG.wrap),
          it('platter', 'Shawarma Platter', 'Chicken shawarma meat, rice, fries and garlic sauce.', 650, IMG.shawarma),
        ],
      },
      {
        id: 'rolls',
        name: 'Wraps & Rolls',
        items: [
          it('cheese_roll', 'Chicken Cheese Roll', 'Paratha roll with cheese and chicken.', 280, IMG.roll),
          it('mexican', 'Mexican Wrap', 'Spicy chicken, beans and salsa.', 380, IMG.wrap),
          it('paratha_roll', 'Chicken Paratha Roll', 'Classic Lahori paratha roll.', 260, IMG.roll, { isPopular: true }),
        ],
      },
      {
        id: 'sides',
        name: 'Sides',
        items: [
          it('garlic_fries', 'Garlic Mayo Fries', 'Fries tossed in garlic mayo.', 260, IMG.fries, { isVeg: true }),
          it('hummus', 'Hummus with Pita', 'Creamy hummus and warm pita.', 350, IMG.hummus, { isVeg: true }),
          it('falafel', 'Falafel (6 pcs)', 'Crispy chickpea falafel.', 300, IMG.falafel, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('juice', 'Fresh Juice', 'Orange, apple or mango.', 250, IMG.juice, { isVeg: true }),
          it('soda', 'Soft Drink (Regular)', '345ml.', 100, IMG.soda, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_desi_dastarkhwan',
    categories: [
      {
        id: 'signature',
        name: 'Signature Dishes',
        items: [
          it('beef_nihari', 'Beef Nihari', 'Overnight slow-cooked nihari with ginger and lemon.', 550, IMG.nihari, { isPopular: true }),
          it('mutton_nihari', 'Mutton Nihari', 'Premium mutton nihari.', 850, IMG.nihari),
          it('haleem', 'Haleem', 'Wheat, lentils and beef, cooked for hours.', 380, IMG.haleem, { isPopular: true }),
          it('paye', 'Siri Paye', 'Traditional Lahori paye.', 650, IMG.curry),
          it('qorma', 'Chicken Qorma', 'Rich, aromatic qorma.', 480, IMG.curry),
          it('daal_mash', 'Daal Mash', 'Dry white lentils with ginger.', 250, IMG.daal, { isVeg: true }),
        ],
      },
      {
        id: 'breads',
        name: 'Breads',
        items: [
          it('roti', 'Tandoori Roti', 'Fresh tandoori roti.', 30, IMG.roti, { isVeg: true }),
          it('naan', 'Naan', 'Soft naan.', 50, IMG.naan, { isVeg: true }),
          it('puri', 'Puri (2 pcs)', 'Fluffy fried puris.', 60, IMG.paratha, { isVeg: true }),
        ],
      },
      {
        id: 'breakfast',
        name: 'Breakfast',
        items: [
          it('halwa_puri', 'Halwa Puri Set', 'Puri, halwa, channay and aloo bhujia.', 320, IMG.halwa, { isVeg: true, isPopular: true }),
          it('lassi', 'Lassi', 'Sweet or salted.', 150, IMG.lassi, { isVeg: true }),
        ],
      },
      {
        id: 'desserts',
        name: 'Desserts',
        items: [
          it('kheer', 'Kheer', 'Rice pudding.', 150, IMG.kheer, { isVeg: true }),
          it('suji_halwa', 'Suji Halwa', 'Semolina halwa.', 120, IMG.halwa, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_mithai_more',
    categories: [
      {
        id: 'mithai',
        name: 'Mithai',
        items: [
          it('gulab_jamun', 'Gulab Jamun (500g)', 'Soft khoya gulab jamun in syrup.', 550, IMG.gulabJamun, { isVeg: true, isPopular: true }),
          it('barfi', 'Barfi (500g)', 'Classic milk barfi.', 700, IMG.mithai, { isVeg: true }),
          it('rasgulla', 'Rasgulla (500g)', 'Spongy and light.', 500, IMG.gulabJamun, { isVeg: true }),
          it('jalebi', 'Jalebi (500g)', 'Crispy and syrupy.', 400, IMG.mithai, { isVeg: true, isPopular: true }),
          it('kaju_katli', 'Kaju Katli (250g)', 'Premium cashew fudge.', 750, IMG.mithai, { isVeg: true }),
          it('mix_box', 'Mixed Mithai Box (1kg)', 'Assorted premium mithai gift box.', 1400, IMG.mithai, { isVeg: true, compareAtPrice: 1600 }),
        ],
      },
      {
        id: 'ice_cream',
        name: 'Ice Cream & Kulfi',
        items: [
          it('mango_ic', 'Mango Ice Cream', 'Made with Chaunsa mangoes.', 250, IMG.iceCream, { isVeg: true, isPopular: true }),
          it('kulfi', 'Kulfi', 'Traditional pistachio kulfi.', 150, IMG.kulfi, { isVeg: true }),
          it('falooda', 'Falooda', 'Kulfi, vermicelli, basil seeds and rose syrup.', 320, IMG.iceCream, { isVeg: true }),
        ],
      },
      {
        id: 'cakes',
        name: 'Cakes',
        items: [
          it('choc_fudge', 'Chocolate Fudge Cake (1 lb)', 'Rich fudge cake.', 1200, IMG.cake, { isVeg: true, isPopular: true }),
          it('pineapple', 'Pineapple Cake (1 lb)', 'Fresh cream pineapple cake.', 1100, IMG.cake2, { isVeg: true }),
          it('cheesecake', 'Cheesecake Slice', 'Baked New York style.', 450, IMG.cheesecake, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('mango_lassi', 'Mango Lassi', 'Thick mango lassi.', 220, IMG.lassi, { isVeg: true }),
          it('rooh_afza', 'Rooh Afza Milk', 'Chilled rose milk.', 150, IMG.milk, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_wok_n_roll',
    categories: [
      {
        id: 'mains',
        name: 'Chinese Mains',
        items: [
          it('manchurian', 'Chicken Manchurian', 'Sweet and tangy Manchurian with rice.', 750, IMG.chinese, { isPopular: true }),
          it('chowmein', 'Chicken Chowmein', 'Stir-fried noodles with vegetables.', 650, IMG.noodles, { isPopular: true }),
          it('chilli_dry', 'Beef Chilli Dry', 'Spicy dry beef with capsicum.', 850, IMG.chinese),
          it('sweet_sour', 'Sweet & Sour Chicken', 'Crispy chicken in sweet and sour sauce.', 780, IMG.chinese),
          it('egg_rice', 'Egg Fried Rice', 'Wok-tossed with eggs and spring onion.', 450, IMG.rice),
          it('singaporean', 'Singaporean Rice', 'Rice, noodles, chicken and creamy sauce.', 850, IMG.noodles),
        ],
      },
      {
        id: 'soups',
        name: 'Soups',
        items: [
          it('hot_sour', 'Hot & Sour Soup', 'Classic spicy and tangy.', 350, IMG.soup),
          it('corn', 'Chicken Corn Soup', 'Mild and comforting.', 320, IMG.soup, { isPopular: true }),
        ],
      },
      {
        id: 'starters',
        name: 'Starters',
        items: [
          it('dynamite', 'Dynamite Prawns', 'Crispy prawns in spicy mayo.', 950, IMG.prawns),
          it('crispy_chicken', 'Crispy Chicken', 'Honey chilli crispy chicken.', 650, IMG.friedChicken),
          it('spring_rolls', 'Spring Rolls (4 pcs)', 'Vegetable spring rolls.', 300, IMG.springRoll, { isVeg: true }),
        ],
      },
      {
        id: 'drinks',
        name: 'Drinks',
        items: [
          it('iced_tea', 'Peach Iced Tea', 'Refreshing.', 220, IMG.tea, { isVeg: true }),
          it('soda', 'Soft Drink (Regular)', '345ml.', 100, IMG.soda, { isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_fresh_basket',
    categories: [
      {
        id: 'staples',
        name: 'Staples',
        items: [
          it('atta', 'Chakki Atta', 'Fine wheat flour.', 1450, IMG.atta, { unit: '10 kg bag', isVeg: true, isPopular: true }),
          it('rice', 'Super Kernel Basmati', 'Aged long-grain basmati rice.', 1650, IMG.rice, { unit: '5 kg bag', isVeg: true, isPopular: true }),
          it('sugar', 'Sugar', 'Refined white sugar.', 175, IMG.sugar, { unit: '1 kg', isVeg: true }),
          it('oil', 'Cooking Oil', 'Canola blend cooking oil.', 2750, IMG.oil, { unit: '5 L', isVeg: true }),
          it('ghee', 'Banaspati Ghee', 'Vegetable ghee.', 1350, IMG.oil, { unit: '2.5 kg', isVeg: true }),
          it('daal_chana', 'Daal Chana', 'Split chickpeas.', 320, IMG.lentils, { unit: '1 kg', isVeg: true }),
          it('daal_masoor', 'Daal Masoor', 'Red lentils.', 340, IMG.lentils, { unit: '1 kg', isVeg: true }),
          it('salt', 'Iodised Salt', 'Table salt.', 60, IMG.sugar, { unit: '800 g', isVeg: true }),
        ],
      },
      {
        id: 'dairy',
        name: 'Dairy & Eggs',
        items: [
          it('milk', 'Full Cream Milk', 'UHT packaged milk.', 250, IMG.milk, { unit: '1 L', isVeg: true, isPopular: true }),
          it('eggs', 'Farm Eggs', 'Fresh eggs.', 330, IMG.eggs, { unit: 'Dozen', isVeg: true, isPopular: true }),
          it('yogurt', 'Yogurt (Dahi)', 'Fresh set yogurt.', 260, IMG.yogurt, { unit: '1 kg', isVeg: true }),
          it('butter', 'Butter', 'Salted dairy butter.', 380, IMG.butter, { unit: '200 g', isVeg: true }),
          it('cheese', 'Cheddar Cheese Slices', '10 slices.', 450, IMG.cheese, { unit: '200 g', isVeg: true }),
        ],
      },
      {
        id: 'snacks',
        name: 'Beverages & Snacks',
        items: [
          it('tea', 'Black Tea (Family Pack)', 'Premium blend tea leaves.', 1850, IMG.tea, { unit: '950 g', isVeg: true, isPopular: true }),
          it('biscuits', 'Biscuits Family Pack', 'Assorted biscuits.', 150, IMG.biscuits, { unit: '1 pack', isVeg: true }),
          it('chips', 'Potato Chips', 'Masala flavour.', 100, IMG.chips, { unit: '65 g', isVeg: true }),
          it('soda', 'Soft Drink', 'Coke, Sprite or Fanta.', 200, IMG.soda, { unit: '1.5 L', isVeg: true }),
          it('juice', 'Mango Juice', 'Packaged nectar.', 250, IMG.juice, { unit: '1 L', isVeg: true }),
        ],
      },
      {
        id: 'household',
        name: 'Household',
        items: [
          it('dishwash', 'Dishwash Liquid', 'Lemon scented.', 380, IMG.detergent, { unit: '750 ml' }),
          it('detergent', 'Washing Powder', 'Stain remover formula.', 420, IMG.detergent, { unit: '1 kg' }),
          it('tissues', 'Tissue Box', '2-ply facial tissues.', 210, IMG.tissues, { unit: '150 sheets' }),
        ],
      },
    ],
  },
  {
    storeId: 'st_sabzi_express',
    categories: [
      {
        id: 'vegetables',
        name: 'Vegetables',
        items: [
          it('potatoes', 'Potatoes (Aloo)', 'Fresh local potatoes.', 90, IMG.potatoes, { unit: '1 kg', isVeg: true, isPopular: true }),
          it('onions', 'Onions (Pyaz)', 'Red onions.', 110, IMG.onions, { unit: '1 kg', isVeg: true }),
          it('tomatoes', 'Tomatoes', 'Ripe and firm.', 120, IMG.tomatoes, { unit: '1 kg', isVeg: true, isPopular: true }),
          it('chillies', 'Green Chillies', 'Fresh hari mirch.', 40, IMG.chillies, { unit: '250 g', isVeg: true }),
          it('ginger', 'Ginger (Adrak)', 'Fresh ginger root.', 120, IMG.ginger, { unit: '250 g', isVeg: true }),
          it('garlic', 'Garlic (Lehsan)', 'Local garlic.', 110, IMG.ginger, { unit: '250 g', isVeg: true }),
          it('spinach', 'Spinach (Palak)', 'Fresh bunch.', 60, IMG.spinach, { unit: '1 bunch', isVeg: true }),
          it('okra', 'Okra (Bhindi)', 'Tender bhindi.', 180, IMG.okra, { unit: '1 kg', isVeg: true }),
          it('cauliflower', 'Cauliflower (Gobi)', 'Whole head.', 120, IMG.cauliflower, { unit: '1 pc', isVeg: true }),
          it('lemon', 'Lemons', 'Juicy desi lemons.', 80, IMG.lemon, { unit: '250 g', isVeg: true }),
        ],
      },
      {
        id: 'fruits',
        name: 'Fruits',
        items: [
          it('chaunsa', 'Chaunsa Mangoes', 'Sweet Multani chaunsa, in season.', 280, IMG.mango, { unit: '1 kg', isVeg: true, isPopular: true }),
          it('bananas', 'Bananas', 'Ripe local bananas.', 160, IMG.banana, { unit: 'Dozen', isVeg: true }),
          it('apples', 'Kala Kulu Apples', 'Crisp Swat apples.', 320, IMG.apple, { unit: '1 kg', isVeg: true }),
          it('grapes', 'Black Grapes', 'Seedless.', 250, IMG.grapes, { unit: '500 g', isVeg: true }),
          it('guava', 'Guava (Amrood)', 'Fresh guavas.', 200, IMG.guava, { unit: '1 kg', isVeg: true }),
          it('pomegranate', 'Pomegranate (Anaar)', 'Kandahari anaar.', 450, IMG.pomegranate, { unit: '1 kg', isVeg: true }),
          it('kinnow', 'Kinnow', 'Sargodha kinnow.', 200, IMG.orange, { unit: 'Dozen', isVeg: true, isPopular: true }),
          it('watermelon', 'Watermelon', 'Whole, approx. 4 kg.', 350, IMG.watermelon, { unit: '1 pc', isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_daily_bake',
    categories: [
      {
        id: 'breads',
        name: 'Breads',
        items: [
          it('bread', 'Sandwich Bread', 'Soft white bread.', 130, IMG.bread, { unit: 'Large loaf', isVeg: true, isPopular: true }),
          it('brown', 'Brown Bread', 'Whole wheat.', 160, IMG.bread, { unit: 'Large loaf', isVeg: true }),
          it('buns', 'Burger Buns (6 pcs)', 'Sesame topped.', 120, IMG.buns, { unit: 'Pack of 6', isVeg: true }),
          it('rusk', 'Cake Rusk', 'Crunchy tea-time rusk.', 220, IMG.rusk, { unit: '350 g', isVeg: true }),
        ],
      },
      {
        id: 'bakery',
        name: 'Bakery Items',
        items: [
          it('patties', 'Chicken Patties', 'Flaky puff pastry with chicken filling.', 120, IMG.patties, { unit: '1 pc', isPopular: true }),
          it('pizza_slice', 'Pizza Slice', 'Chicken tikka pizza slice.', 180, IMG.pizza, { unit: '1 slice' }),
          it('cream_roll', 'Cream Roll', 'Classic bakery cream roll.', 80, IMG.rusk, { unit: '1 pc', isVeg: true }),
          it('fruit_cake', 'Fruit Cake Slice', 'Dense fruit cake.', 150, IMG.cake2, { unit: '1 slice', isVeg: true }),
          it('brownie', 'Chocolate Brownie', 'Fudgy walnut brownie.', 200, IMG.brownie, { unit: '1 pc', isVeg: true, isPopular: true }),
          it('croissant', 'Butter Croissant', 'Flaky and buttery.', 150, IMG.croissant, { unit: '1 pc', isVeg: true }),
        ],
      },
      {
        id: 'cakes',
        name: 'Cakes',
        items: [
          it('black_forest', 'Black Forest Cake', 'Cherry and chocolate.', 1300, IMG.cake, { unit: '1 lb', isVeg: true }),
          it('red_velvet', 'Red Velvet Cake', 'Cream cheese frosting.', 1400, IMG.cake2, { unit: '1 lb', isVeg: true, isPopular: true }),
        ],
      },
      {
        id: 'cookies',
        name: 'Cookies',
        items: [
          it('nankhatai', 'Nankhatai', 'Traditional shortbread cookies.', 280, IMG.cookies, { unit: '250 g', isVeg: true }),
          it('choc_chip', 'Chocolate Chip Cookies', 'Soft baked.', 350, IMG.cookies, { unit: '300 g', isVeg: true }),
        ],
      },
    ],
  },
  {
    storeId: 'st_careplus',
    categories: [
      {
        id: 'medicine',
        name: 'Medicine',
        items: [
          it('paracetamol', 'Paracetamol 500mg', 'Pain and fever relief.', 30, IMG.tablets, { unit: '10 tablets', isPopular: true }),
          it('ibuprofen', 'Ibuprofen 400mg', 'Anti-inflammatory.', 85, IMG.medicine, { unit: '10 tablets' }),
          it('antacid', 'Antacid Syrup', 'Relief from acidity and heartburn.', 180, IMG.syrup, { unit: '120 ml' }),
          it('ors', 'ORS Sachets', 'Oral rehydration salts.', 100, IMG.tablets, { unit: '5 sachets', isPopular: true }),
          it('cough', 'Cough Syrup', 'For dry and chesty cough.', 220, IMG.syrup, { unit: '120 ml' }),
          it('antihistamine', 'Anti-Allergy Tablets', 'Non-drowsy antihistamine.', 90, IMG.tablets, { unit: '10 tablets' }),
        ],
      },
      {
        id: 'wellness',
        name: 'Wellness',
        items: [
          it('vitamin_c', 'Vitamin C 1000mg', 'Immune support effervescent.', 350, IMG.vitamins, { unit: '20 tablets', isPopular: true }),
          it('multi', 'Daily Multivitamin', 'Complete A to Z.', 650, IMG.vitamins, { unit: '30 tablets' }),
          it('calcium', 'Calcium + Vitamin D3', 'Bone health.', 480, IMG.tablets, { unit: '30 tablets' }),
          it('omega3', 'Omega-3 Fish Oil', 'Heart and brain support.', 850, IMG.omega, { unit: '30 softgels', compareAtPrice: 950 }),
        ],
      },
      {
        id: 'personal_care',
        name: 'Personal Care',
        items: [
          it('sanitizer', 'Hand Sanitizer', '70% alcohol.', 250, IMG.sanitizer, { unit: '250 ml' }),
          it('toothpaste', 'Toothpaste', 'Fluoride whitening.', 220, IMG.toothpaste, { unit: '120 g' }),
          it('masks', 'Face Masks (50 pcs)', '3-ply disposable.', 350, IMG.mask, { unit: 'Box of 50' }),
          it('sunscreen', 'Sunscreen SPF 50', 'Broad spectrum.', 950, IMG.sunscreen, { unit: '50 ml' }),
        ],
      },
      {
        id: 'baby',
        name: 'Baby Care',
        items: [
          it('diapers', 'Diapers Size 3', 'Ultra-absorbent.', 1650, IMG.diapers, { unit: '44 count', isPopular: true }),
          it('wipes', 'Baby Wipes', 'Fragrance-free.', 350, IMG.wipes, { unit: '72 wipes' }),
          it('lotion', 'Baby Lotion', 'Gentle moisturiser.', 450, IMG.lotion, { unit: '200 ml' }),
        ],
      },
    ],
  },
  {
    storeId: 'st_sehat_plus',
    categories: [
      {
        id: 'vitamins',
        name: 'Vitamins & Supplements',
        items: [
          it('d3', 'Vitamin D3 2000 IU', 'Bone and immune health.', 420, IMG.vitamins, { unit: '30 softgels', isPopular: true }),
          it('zinc', 'Zinc 50mg', 'Immune support.', 380, IMG.tablets, { unit: '30 tablets' }),
          it('iron', 'Iron + Folic Acid', 'For anaemia support.', 300, IMG.tablets, { unit: '30 tablets' }),
          it('multi_women', 'Multivitamin for Women', 'Formulated for daily needs.', 750, IMG.vitamins, { unit: '30 tablets' }),
        ],
      },
      {
        id: 'devices',
        name: 'Health Devices',
        items: [
          it('thermometer', 'Digital Thermometer', 'Fast 10-second reading.', 650, IMG.thermometer, { unit: '1 unit' }),
          it('bp', 'Blood Pressure Monitor', 'Automatic upper-arm monitor.', 4500, IMG.bpMonitor, { unit: '1 unit', isPopular: true }),
          it('strips', 'Glucometer Strips', 'Compatible test strips.', 1800, IMG.glucometer, { unit: '50 strips' }),
          it('nebulizer', 'Nebulizer', 'Compressor nebulizer with mask.', 4200, IMG.nebulizer, { unit: '1 unit' }),
        ],
      },
      {
        id: 'nutrition',
        name: 'Nutrition',
        items: [
          it('whey', 'Whey Protein', 'Chocolate flavour, 24g protein per scoop.', 6500, IMG.whey, { unit: '1 kg' }),
          it('ensure', 'Nutritional Supplement Powder', 'Complete balanced nutrition.', 1950, IMG.whey, { unit: '400 g' }),
          it('electrolytes', 'Electrolyte Sachets', 'Hydration mix.', 250, IMG.electrolyte, { unit: '10 sachets' }),
        ],
      },
    ],
  },
  {
    storeId: 'st_mediquick',
    categories: [
      {
        id: 'first_aid',
        name: 'First Aid',
        items: [
          it('bandages', 'Adhesive Bandages', 'Assorted sizes.', 150, IMG.bandage, { unit: '20 count', isPopular: true }),
          it('antiseptic', 'Antiseptic Liquid', 'For cuts and wounds.', 180, IMG.antiseptic, { unit: '100 ml' }),
          it('cotton', 'Cotton Roll', 'Absorbent cotton.', 90, IMG.wipes, { unit: '100 g' }),
          it('pain_spray', 'Pain Relief Spray', 'Fast acting for muscle pain.', 450, IMG.spray, { unit: '100 ml' }),
          it('burn', 'Burn Ointment', 'Soothing burn relief.', 220, IMG.lotion, { unit: '30 g' }),
        ],
      },
      {
        id: 'medicine',
        name: 'Medicine',
        items: [
          it('paracetamol', 'Paracetamol 500mg', 'Pain and fever relief.', 30, IMG.tablets, { unit: '10 tablets', isPopular: true }),
          it('allergy', 'Anti-Allergy Tablets', 'Fast relief from allergies.', 120, IMG.medicine, { unit: '10 tablets' }),
          it('gel', 'Pain Relief Gel', 'Topical diclofenac gel.', 350, IMG.lotion, { unit: '50 g' }),
        ],
      },
      {
        id: 'baby',
        name: 'Baby Care',
        items: [
          it('diapers', 'Diapers Size 4', 'Ultra-absorbent.', 1750, IMG.diapers, { unit: '40 count' }),
          it('wipes', 'Baby Wipes', 'Fragrance-free.', 350, IMG.wipes, { unit: '72 wipes', isPopular: true }),
          it('feeder', 'Baby Feeder 250ml', 'BPA-free bottle.', 350, IMG.feeder, { unit: '1 unit' }),
        ],
      },
    ],
  },
];

const categories: MenuCategory[] = [];
const products: Product[] = [];

seeds.forEach((seed) => {
  seed.categories.forEach((cat, index) => {
    const categoryId = `${seed.storeId}__${cat.id}`;
    categories.push({ id: categoryId, storeId: seed.storeId, name: cat.name, sortOrder: index });
    cat.items.forEach((item) => {
      products.push({ ...item, id: `${seed.storeId}__${item.id}`, storeId: seed.storeId, categoryId });
    });
  });
});

export const menuResponse: ApiResponse<{ categories: MenuCategory[]; products: Product[] }> = {
  status: 'success',
  meta: { requestId: 'req_menu_001', timestamp: '2026-09-07T09:00:00.000Z', total: products.length },
  data: { categories, products },
};
