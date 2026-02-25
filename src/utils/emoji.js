const normalizeProductName = (value) =>
  value
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');

const keywordGroups = [
  {
    emoji: '🥛',
    words: [
      'milk',
      'leite',
      'leche',
      'cream',
      'creme',
      'crema',
      'nata',
      'plant milk',
      'leite vegetal',
      'leite de soja',
      'leite de aveia',
      'leite de amendoa',
      'bebida vegetal',
      'leche vegetal'
    ]
  },
  {
    emoji: '🧀',
    words: [
      'cheese',
      'queijo',
      'queso',
      'cheddar',
      'queijo cheddar',
      'queso cheddar',
      'mozzarella',
      'queijo mozzarela',
      'queso mozzarella',
      'parmesan',
      'queijo parmesao',
      'queso parmesano',
      'cream cheese',
      'queijo creme',
      'queijo de barrar',
      'queso crema',
      'queso de untar'
    ]
  },
  {
    emoji: '🧈',
    words: ['butter', 'manteiga', 'mantequilla', 'manteca', 'margarine', 'margarina']
  },
  {
    emoji: '🍦',
    words: ['yogurt', 'yoghurt', 'iogurte', 'yogur', 'vanilla extract', 'essencia de baunilha', 'extrato de baunilha', 'extracto de vainilla']
  },
  {
    emoji: '🥚',
    words: ['egg', 'eggs', 'ovo', 'ovos', 'huevo', 'huevos', 'eggs (dozen)', 'duzia de ovos', 'docena de huevos']
  },
  {
    emoji: '🍎',
    words: [
      'apple',
      'maca',
      'manzana',
      'apples',
      'red apple',
      'green apple',
      'macas',
      'maca vermelha',
      'maca verde',
      'manzanas',
      'manzana roja',
      'manzana verde',
      'applesauce',
      'pure de maca',
      'compota de maca',
      'pure de manzana',
      'apple juice',
      'sumo de maca',
      'jugo de manzana',
      'zumo de manzana'
    ]
  },
  {
    emoji: '🍌',
    words: ['banana', 'bananas', 'platano', 'maca de banana', 'pau-de-cabinda', 'platanos', 'bananos', 'guineos']
  },
  {
    emoji: '🍇',
    words: ['grape', 'grapes', 'uva', 'uvas', 'raisins', 'passas', 'uvas passas', 'pasas']
  },
  {
    emoji: '🍈',
    words: ['melon', 'melao', 'cantaloupe', 'meloa', 'cantalupo', 'melones']
  },
  {
    emoji: '🍉',
    words: ['watermelon', 'melancia', 'sandia', 'sandias']
  },
  {
    emoji: '🍊',
    words: [
      'orange',
      'laranja',
      'naranja',
      'oranges',
      'laranjas',
      'naranjas',
      'orange juice',
      'sumo de laranja',
      'laranjada',
      'jugo de naranja',
      'zumo de naranja'
    ]
  },
  {
    emoji: '🍋',
    words: ['lemon', 'limao', 'limon', 'lemons', 'limoes', 'limones', 'lemonade', 'limonada']
  },
  {
    emoji: '🍐',
    words: ['pear', 'pera', 'pears', 'peras']
  },
  {
    emoji: '🍑',
    words: ['peach', 'pessego', 'durazno', 'melocoton', 'peaches', 'pessegos', 'duraznos', 'melocotones']
  },
  {
    emoji: '🍒',
    words: ['cherry', 'cereja', 'cereza', 'cherries', 'cerejas', 'cerezas', 'dried cranberries', 'arandos secos', 'arandanos secos']
  },
  {
    emoji: '🍓',
    words: [
      'strawberry',
      'morango',
      'fresa',
      'strawberries',
      'morangos',
      'fresas',
      'frutillas',
      'frutilla',
      'frozen berries',
      'berries congelados',
      'frutos vermelhos congelados',
      'bayas congeladas'
    ]
  },
  {
    emoji: '🍅',
    words: ['tomato', 'tomate', 'tomatoes', 'tomates', 'jitomate', 'ketchup', 'catsup']
  },
  {
    emoji: '🥥',
    words: ['coconut', 'coco', 'coconut milk', 'leite de coco', 'leche de coco']
  },
  {
    emoji: '🥑',
    words: ['avocado', 'abacate', 'aguacate', 'palta']
  },
  {
    emoji: '🍆',
    words: ['eggplant', 'berinjela', 'berenjena', 'aubergine']
  },
  {
    emoji: '🥔',
    words: [
      'potato',
      'batata',
      'patata',
      'papa',
      'potatoes',
      'spuds',
      'batatas',
      'papas',
      'patatas',
      'chips',
      'crisps',
      'batatas fritas',
      'batatas de pacote',
      'patatas fritas',
      'papas fritas'
    ]
  },
  {
    emoji: '🥕',
    words: ['carrot', 'cenoura', 'zanahoria', 'carrots', 'cenouras', 'zanahorias']
  },
  {
    emoji: '🌽',
    words: ['corn', 'milho', 'maiz', 'maize', 'choclo', 'elote', 'tortilla chips', 'nachos', 'tortilhas de milho', 'totopos']
  },
  {
    emoji: '🌶️',
    words: [
      'pepper',
      'pimenta',
      'pimentao',
      'pimiento',
      'chile',
      'paprika',
      'colorau',
      'pimentao doce',
      'pimenton',
      'chili powder',
      'pimenta em po',
      'piripiri',
      'chile en polvo',
      'aji en polvo',
      'hot sauce',
      'molho picante',
      'salsa picante',
      'claro'
    ]
  },
  {
    emoji: '🥒',
    words: [
      'cucumber',
      'pepino',
      'cucumbers',
      'pepinos',
      'zucchini',
      'courgette',
      'curgete',
      'abobrinha',
      'calabacin',
      'zapallito',
      'pickles',
      'pepino em conserva',
      'curtidos',
      'pepinillos',
      'encurtidos'
    ]
  },
  {
    emoji: '🥦',
    words: [
      'broccoli',
      'brocolis',
      'brocoli',
      'brocolos',
      'cauliflower',
      'couve-flor',
      'coliflor',
      'asparagus',
      'espargos',
      'esparragos',
      'frozen vegetables',
      'vegetais congelados',
      'legumes congelados',
      'verduras congeladas'
    ]
  },
  {
    emoji: '🧅',
    words: ['onion', 'cebola', 'cebolla', 'onions', 'cebolas', 'cebollas', 'scallions', 'spring onions', 'cebolinho', 'cebola tenra', 'cebolletas', 'verdeo']
  },
  {
    emoji: '🧄',
    words: ['garlic', 'alho', 'ajo', 'ajos']
  },
  {
    emoji: '🥗',
    words: ['salad', 'salada', 'ensalada', 'salad dressing', 'molho de salada', 'alino', 'aderezo']
  },
  {
    emoji: '🥬',
    words: [
      'lettuce',
      'alface',
      'lechuga',
      'celery',
      'aipo',
      'apio',
      'cabbage',
      'couve',
      'repolho',
      'col',
      'repollo',
      'brussels sprouts',
      'couves de bruxelas',
      'coles de bruselas',
      'spinach',
      'espinafres',
      'espinacas',
      'espinaca',
      'kale',
      'couve galega',
      'col rizada',
      'romaine',
      'alface romana',
      'lechuga romana'
    ]
  },
  {
    emoji: '🍞',
    words: [
      'bread',
      'pao',
      'pan',
      'loaf',
      'cacete',
      'carcaca',
      'hogaza',
      'barra',
      'whole wheat bread',
      'pao integral',
      'pan integral',
      'breadcrumbs',
      'pao ralado',
      'pan rallado'
    ]
  },
  {
    emoji: '🥐',
    words: ['croissant', 'rolls', 'roll', 'paezinhos', 'carcacas', 'vianas', 'panecillos']
  },
  {
    emoji: '🥖',
    words: ['baguette']
  },
  {
    emoji: '🥨',
    words: ['pretzel', 'crackers', 'bolachas', 'bolachas de agua e sal', 'galletas saladas', 'pretzels', 'lazos']
  },
  {
    emoji: '🥯',
    words: ['bagel', 'bagels', 'english muffins', 'muffins ingleses', 'panecillos ingleses']
  },
  {
    emoji: '🥞',
    words: ['pancake', 'pancakes', 'panqueca', 'panquecas', 'panqueque', 'panqueques']
  },
  {
    emoji: '🧇',
    words: ['waffle', 'waffles', 'gofre', 'frozen waffles', 'waffles congelados', 'gofres']
  },
  {
    emoji: '🍔',
    words: ['hamburger', 'hamburguer', 'hamburguesa', 'bun', 'buns', 'paes de hamburguer', 'carcacas', 'paes', 'panes', 'bollos']
  },
  {
    emoji: '🥩',
    words: [
      'meat',
      'carne',
      'steak',
      'bife',
      'filete',
      'ground beef',
      'carne moida',
      'carne picada',
      'carne molida',
      'beef steak',
      'bife de vaca',
      'bistec',
      'carne de res',
      'pork chops',
      'costeletas de porco',
      'chuletas de cerdo',
      'salami',
      'salame'
    ]
  },
  {
    emoji: '🍗',
    words: [
      'chicken',
      'frango',
      'pollo',
      'chicken breast',
      'peito de frango',
      'pechugas de pollo',
      'chicken thighs',
      'pernas de frango',
      'coxas de frango',
      'muslos de pollo',
      'whole chicken',
      'frango inteiro',
      'pollo entero',
      'frozen chicken nuggets',
      'nuggets',
      'nuggets de frango',
      'nuggets de pollo'
    ]
  },
  {
    emoji: '🥓',
    words: ['bacon', 'tocino', 'toucinho', 'panceta']
  },
  {
    emoji: '🐟',
    words: [
      'fish',
      'peixe',
      'pescado',
      'tuna',
      'atum',
      'atun',
      'salmon',
      'salmao',
      'fish fillets',
      'filetes de peixe',
      'filetes de pescado',
      'frozen fish sticks',
      'douradinhos',
      'palitos de peixe',
      'varitas de pescado'
    ]
  },
  {
    emoji: '🍤',
    words: ['shrimp', 'camarao', 'camaron', 'gamba', 'prawns', 'gambas', 'langostinos', 'camarones']
  },
  {
    emoji: '🧂',
    words: [
      'salt',
      'sal',
      'black pepper',
      'pimenta preta',
      'pimenta',
      'pimienta negra',
      'pimienta',
      'cumin',
      'cominhos',
      'cominos',
      'nutmeg',
      'noz-moscada',
      'nuez moscada',
      'baking powder',
      'fermento',
      'fermento em po',
      'polvo de hornear',
      'levadura quimica',
      'baking soda',
      'bicarbonato',
      'bicarbonato de sodio'
    ]
  },
  {
    emoji: '🍬',
    words: [
      'sugar',
      'acucar',
      'azucar',
      'brown sugar',
      'acucar mascavado',
      'acucar amarelo',
      'azucar morena',
      'panela',
      'powdered sugar',
      'icing sugar',
      'acucar em po',
      'acucar de confeiteiro',
      'azucar glass',
      'azucar impalpable',
      'candy',
      'sweets',
      'rebucados',
      'doces',
      'guloseimas',
      'caramelos',
      'dulces',
      'chuches'
    ]
  },
  {
    emoji: '🍯',
    words: ['honey', 'mel', 'miel', 'jam', 'jelly', 'marmalade', 'compota', 'doce', 'geleia', 'mermelada', 'dulce', 'mustard', 'mostarda', 'mostaza']
  },
  {
    emoji: '🍚',
    words: ['rice', 'arroz', 'brown rice', 'arroz integral']
  },
  {
    emoji: '🍝',
    words: ['pasta', 'massa', 'macarrao', 'fideos', 'spaghetti', 'esparguete', 'espaguetes', 'espagueti', 'espaguetis', 'macaroni', 'cotovelos', 'macarrones']
  },
  {
    emoji: '🍜',
    words: ['noodle', 'noodles', 'macarrao', 'fideo', 'fideos', 'massas', 'fios', 'ramen']
  },
  {
    emoji: '🍲',
    words: ['soup', 'sopa']
  },
  {
    emoji: '🥣',
    words: [
      'cereal',
      'oats',
      'oatmeal',
      'aveia',
      'papas de aveia',
      'avena',
      'cereais',
      'cereales',
      'granola',
      'sour cream',
      'natas azedas',
      'crema agria',
      'nata agria',
      'cottage cheese',
      'queijo cottage',
      'requesao',
      'queso cottage',
      'requeson',
      'broth',
      'stock',
      'caldo',
      'canja',
      'salsa',
      'sauce',
      'molho',
      'mayonnaise',
      'mayo',
      'maionese',
      'mayonesa',
      'barbecue sauce',
      'molho barbecue',
      'molho churrasco',
      'salsa barbacoa'
    ]
  },
  {
    emoji: '🍫',
    words: [
      'chocolate',
      'granola bars',
      'barrinhas de cereais',
      'barritas de cereales',
      'protein bars',
      'barras de proteina',
      'cocoa powder',
      'cacau',
      'cacau em po',
      'cacao en polvo'
    ]
  },
  {
    emoji: '🍪',
    words: ['cookie', 'cookies', 'bolacha', 'biscoito', 'galleta', 'biscuits', 'bolachas', 'biscoitos', 'galletas', 'masitas']
  },
  {
    emoji: '🍰',
    words: ['cake', 'bolo', 'pastel', 'tarta']
  },
  {
    emoji: '🛢️',
    words: ['oil', 'oleo', 'aceite']
  },
  {
    emoji: '🥫',
    words: [
      'sauce',
      'molho',
      'salsa',
      'canned tomatoes',
      'tomate pelado',
      'tomate em lata',
      'tomate enlatado',
      'tomate en conserva',
      'tomato sauce',
      'molho de tomate',
      'polpa de tomate',
      'salsa de tomate',
      'tomato paste',
      'concentrado de tomate',
      'massa de tomate',
      'pasta de tomate',
      'canned corn',
      'milho em lata',
      'milho doce',
      'maiz enlatado',
      'elote',
      'canned beans',
      'feijao em lata',
      'feijao cozido',
      'frijoles enlatados',
      'canned tuna',
      'atum em lata',
      'atum em conserva',
      'atun en lata',
      'canned soup',
      'sopa em lata',
      'sopa enlatada',
      'pasta sauce',
      'molho para massa',
      'salsa para pasta'
    ]
  },
  {
    emoji: '💧',
    words: ['water', 'agua', 'bottled water', 'agua mineral', 'agua engarrafada', 'agua embotellada']
  },
  {
    emoji: '🧃',
    words: ['juice', 'suco', 'zumo', 'jugo']
  },
  {
    emoji: '🥤',
    words: ['soda', 'refrigerante', 'gaseosa', 'cola', 'gasosa', 'refresco', 'sports drink', 'isotonico', 'bebida desportiva', 'bebida deportiva']
  },
  {
    emoji: '🍺',
    words: ['beer', 'cerveja', 'cerveza']
  },
  {
    emoji: '🍷',
    words: ['wine', 'vinho', 'vino']
  },
  {
    emoji: '☕',
    words: ['coffee', 'cafe', 'bica', 'cimbalino']
  },
  {
    emoji: '🍵',
    words: ['tea', 'cha', 'te']
  },
  {
    emoji: '🧼',
    words: ['soap', 'sabao', 'jabon', 'dish soap', 'detergente da loica', 'detergente manual', 'lavavajillas', 'jabon de platos']
  },
  {
    emoji: '🧽',
    words: ['sponge', 'esponja']
  },
  {
    emoji: '🧻',
    words: [
      'toilet paper',
      'papel higienico',
      'paper towels',
      'kitchen roll',
      'rolo de cozinha',
      'papel de cozinha',
      'toallas de papel',
      'napkins',
      'guardanapos',
      'servilletas'
    ]
  },
  {
    emoji: '🧺',
    words: [
      'laundry',
      'lavandaria',
      'lavanderia',
      'ropa sucia',
      'laundry detergent',
      'detergente da roupa',
      'detergente para a maquina',
      'detergente para ropa'
    ]
  },
  {
    emoji: '🧴',
    words: ['detergent', 'detergente', 'shampoo', 'champu']
  },
  {
    emoji: '🧹',
    words: ['cleaner', 'limpador', 'limpiador']
  },
  {
    emoji: '🪥',
    words: ['toothpaste', 'dentifrico', 'pasta de dentes', 'pasta dental']
  },
  {
    emoji: '🍋‍🟩',
    words: ['limes', 'lime', 'limas', 'lima']
  },
  {
    emoji: '🫐',
    words: [
      'blueberries',
      'blueberry',
      'mirtilos',
      'mirtilo',
      'arandanos',
      'arandano',
      'raspberries',
      'raspberry',
      'framboesas',
      'framboesa',
      'frambuesas',
      'frambuesa',
      'blackberries',
      'blackberry',
      'amoras',
      'amora',
      'moras',
      'mora',
      'plums',
      'plum',
      'ameixas',
      'ameixa',
      'ciruelas',
      'ciruela'
    ]
  },
  {
    emoji: '🍍',
    words: ['pineapple', 'ananas', 'abacaxi', 'pina', 'pinas']
  },
  {
    emoji: '🥭',
    words: ['mango', 'manga', 'mangos', 'mangas']
  },
  {
    emoji: '🥝',
    words: ['kiwi', 'kiwis']
  },
  {
    emoji: '🫚',
    words: ['ginger', 'gengibre', 'jengibre']
  },
  {
    emoji: '🍠',
    words: ['sweet potatoes', 'sweet potato', 'batatas doces', 'batata doce', 'camotes', 'camote', 'boniatos', 'boniato']
  },
  {
    emoji: '🫑',
    words: ['bell peppers', 'peppers', 'pimentos', 'pimento', 'pimentoes', 'pimientos', 'pimiento', 'aji', 'morron']
  },
  {
    emoji: '🫛',
    words: ['green beans', 'feijao verde', 'vagens', 'judias verdes', 'vainitas', 'ejotes', 'chauchas', 'peas', 'ervilhas', 'guisantes', 'chicharos', 'arvejas']
  },
  {
    emoji: '🍄',
    words: ['mushrooms', 'mushroom', 'cogumelos', 'cogumelo', 'champinhons', 'setas', 'hongos', 'champinones']
  },
  {
    emoji: '🌿',
    words: ['cilantro', 'coriander', 'coentros', 'parsley', 'salsa', 'perejil', 'basil', 'manjericao', 'albahaca']
  },
  {
    emoji: '🫓',
    words: ['tortillas', 'tortilhas', 'pita', 'pao pita', 'pao sirio', 'pan pita', 'pan arabe']
  },
  {
    emoji: '🌾',
    words: ['quinoa', 'quinua', 'flour', 'farinha', 'harina', 'yeast', 'fermento padeiro', 'levedura', 'levadura']
  },
  {
    emoji: '🍨',
    words: ['ice cream', 'gelado', 'sorvete', 'helado']
  },
  {
    emoji: '🌭',
    words: [
      'sausage',
      'salsicha',
      'chourico',
      'enchido',
      'salchicha',
      'chorizo',
      'embutido',
      'hot dogs',
      'hot dog',
      'cachorro quente',
      'perro caliente',
      'pancho'
    ]
  },
  {
    emoji: '🍖',
    words: ['ham', 'fiambre', 'presunto', 'jamon', 'jamon cocido', 'deli ham', 'fatias de fiambre', 'jamon york']
  },
  {
    emoji: '🦃',
    words: ['turkey', 'peru', 'pavo', 'ground turkey', 'peru picado', 'pavo molido']
  },
  {
    emoji: '🥪',
    words: ['deli turkey', 'peito de peru', 'fiambre de peru', 'pechuga de pavo']
  },
  {
    emoji: '🍕',
    words: ['pepperoni', 'peperoni', 'frozen pizza', 'pizza congelada', 'pizza']
  },
  {
    emoji: '🧊',
    words: ['tofu', 'tempeh', 'ice', 'gelo', 'hielo']
  },
  {
    emoji: '🫘',
    words: ['beans', 'feijao', 'frijoles', 'alubias', 'habichuelas', 'porotos', 'lentils', 'lentilhas', 'lentejas']
  },
  {
    emoji: '🫒',
    words: ['olives', 'azeitonas', 'aceitunas', 'olive oil', 'azeite', 'azeite de oliva', 'aceite de oliva']
  },
  {
    emoji: '🥜',
    words: [
      'peanut butter',
      'manteiga de amendoim',
      'creme de amendoim',
      'mantequilla de mani',
      'crema de cacahuete',
      'nuts',
      'nozes',
      'frutos secos',
      'almonds',
      'amendoas',
      'almendras',
      'peanuts',
      'amendoins',
      'cacahuetes',
      'manies',
      'trail mix',
      'mistura de frutos secos',
      'mezcla de frutos secos'
    ]
  },
  {
    emoji: '🍁',
    words: ['maple syrup', 'xarope de acer', 'jarabe de arce']
  },
  {
    emoji: '🍛',
    words: ['curry powder', 'caril', 'caril em po', 'curry en polvo']
  },
  {
    emoji: '🪵',
    words: ['cinnamon', 'canela', 'canela em po']
  },
  {
    emoji: '🧪',
    words: ['vegetable oil', 'oleo vegetal', 'oleo de cozinha', 'aceite vegetal', 'canola oil', 'oleo de canola', 'aceite de canola']
  },
  {
    emoji: '🍶',
    words: ['vinegar', 'vinagre', 'soy sauce', 'molho de soja', 'shoyu', 'salsa de soja', 'teriyaki sauce', 'molho teriyaki', 'salsa teriyaki']
  },
  {
    emoji: '🍿',
    words: ['popcorn', 'pipocas', 'palomitas', 'pochoclo']
  },
  {
    emoji: '🍮',
    words: ['pudding', 'pudim', 'pudin', 'flan', 'postre']
  },
  {
    emoji: '🍟',
    words: ['frozen fries', 'batatas congeladas', 'patatas congeladas']
  },
  {
    emoji: '🥟',
    words: ['frozen dumplings', 'dumplings', 'gyozas', 'empanadillas congeladas']
  },
  {
    emoji: '❄️',
    words: ['frozen fruit', 'fruta congelada']
  },
  {
    emoji: '🫧',
    words: ['sparkling water', 'agua com gas', 'agua frisante', 'agua con gas', 'soda']
  },
  {
    emoji: '🤧',
    words: ['tissues', 'lencos', 'lencos de papel', 'panuelos', 'panuelos de papel']
  },
  {
    emoji: '🗑️',
    words: ['trash bags', 'sacos do lixo', 'sacos de lixo', 'bolsas de basura']
  },
  {
    emoji: '🥈',
    words: ['aluminum foil', 'folha de aluminio', 'papel de aluminio']
  },
  {
    emoji: '🌯',
    words: ['plastic wrap', 'pelicula aderente', 'film', 'film transparente', 'papel film']
  },
  {
    emoji: '📜',
    words: ['parchment paper', 'baking paper', 'papel vegetal', 'papel de forno']
  }
];

const emojiMap = {};

const normalizedKeywordGroups = keywordGroups.map((group) => ({
  emoji: group.emoji,
  words: [...new Set((group.words || []).map((word) => normalizeProductName(word)).filter(Boolean))]
}));

for (const group of normalizedKeywordGroups) {
  for (const word of group.words) {
    emojiMap[word] = group.emoji;
  }
}

const emojiKeys = Object.keys(emojiMap).sort((a, b) => b.length - a.length);

let customEmojiMap = {};
let normalizedCustomEmojiMap = {};

export const setCustomEmojiMap = (map) => {
  customEmojiMap = map || {};
  normalizedCustomEmojiMap = {};

  Object.keys(customEmojiMap).forEach((key) => {
    normalizedCustomEmojiMap[normalizeProductName(key)] = customEmojiMap[key];
  });
};

export const getEmojiForProduct = (productName) => {
  if (!productName || typeof productName !== 'string') {
    return '🛍️';
  }

  const rawName = productName.toLowerCase().trim();
  const normalizedName = normalizeProductName(productName);

  // Custom user preference first
  if (customEmojiMap[rawName]) {
    return customEmojiMap[rawName];
  }

  if (normalizedCustomEmojiMap[normalizedName]) {
    return normalizedCustomEmojiMap[normalizedName];
  }

  // Direct match
  if (emojiMap[normalizedName]) return emojiMap[normalizedName];

  // Partial match
  for (const key of emojiKeys) {
    if (normalizedName.includes(key)) {
      return emojiMap[key];
    }
  }

  return '🛍️'; // Default
};
