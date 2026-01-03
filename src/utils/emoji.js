const emojiMap = {
  // Dairy
  'milk': '🥛',
  'cheese': '🧀',
  'butter': '🧈',
  'yogurt': '🍦',
  'cream': '🥛',
  'eggs': '🥚',
  
  // Produce
  'apple': '🍎',
  'banana': '🍌',
  'grapes': '🍇',
  'melon': '🍈',
  'watermelon': '🍉',
  'orange': '🍊',
  'lemon': '🍋',
  'pear': '🍐',
  'peach': '🍑',
  'cherry': '🍒',
  'strawberry': '🍓',
  'tomato': '🍅',
  'coconut': '🥥',
  'avocado': '🥑',
  'eggplant': '🍆',
  'potato': '🥔',
  'carrot': '🥕',
  'corn': '🌽',
  'pepper': '🌶️',
  'cucumber': '🥒',
  'broccoli': '🥦',
  'onion': '🧅',
  'garlic': '🧄',
  'salad': '🥗',
  'lettuce': '🥬',
  
  // Bakery
  'bread': '🍞',
  'croissant': '🥐',
  'baguette': '🥖',
  'pretzel': '🥨',
  'bagel': '🥯',
  'pancakes': '🥞',
  'waffle': '🧇',
  'hamburguer': '🍔',
  'bun': '🍔',
  
  // Meat
  'meat': '🥩',
  'chicken': '🍗',
  'bacon': '🥓',
  'steak': '🥩',
  'fish': '🐟',
  'shrimp': '🍤',
  
  // Pantry
  'salt': '🧂',
  'sugar': '🍬',
  'honey': '🍯',
  'rice': '🍚',
  'pasta': '🍝',
  'noodle': '🍜',
  'soup': '🍲',
  'cereal': '🥣',
  'chocolate': '🍫',
  'cookie': '🍪',
  'cake': '🍰',
  'oil': '🛢️',
  'sauce': '🥫',
  
  // Drinks
  'water': '💧',
  'juice': '🧃',
  'soda': '🥤',
  'cola': '🥤',
  'beer': '🍺',
  'wine': '🍷',
  'coffee': '☕',
  'tea': '🍵',
  
  // Household
  'soap': '🧼',
  'sponge': '🧽',
  'toilet paper': '🧻',
  'laundry': '🧺',
  'detergent': '🧴',
  'cleaner': '🧹',
  'shampoo': '🧴',
  'toothpaste': '🪥',
};

export const getEmojiForProduct = (productName) => {
  const lowerName = productName.toLowerCase();
  
  // Direct match
  if (emojiMap[lowerName]) return emojiMap[lowerName];
  
  // Partial match
  for (const key in emojiMap) {
    if (lowerName.includes(key)) {
      return emojiMap[key];
    }
  }
  
  return '🛒'; // Default
};
