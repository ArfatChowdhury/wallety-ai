export const categoryKeywords = {
  'Food & Dining': [
    'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'kfc', 'mcdonald',
    'subway', 'starbucks', 'foodpanda', 'pathao food', 'shohoz', 'meal',
    'dining', 'bakery', 'sushi', 'grill', 'kitchen', 'eatery', 'biryani',
    'chinese', 'thai', 'domino', 'pizza hut', 'burger king', 'wendy',
    'taco', 'noodle', 'breakfast', 'lunch', 'dinner', 'snack', 'sweets',
    'dessert', 'ice cream', 'juice', 'tea', 'grocery store', 'supermarket',
    'shwapno', 'agora', 'meena bazar', 'unimart', 'chaldal'
  ],
  'Transport': [
    'uber', 'pathao', 'shohoz', 'obhai', 'taxi', 'cab', 'ride',
    'fuel', 'petrol', 'diesel', 'gas station', 'cng', 'bus', 'train',
    'rickshaw', 'auto', 'transport', 'parking', 'toll', 'ferry',
    'biman', 'novoair', 'us-bangla', 'airline', 'airways', 'airport',
    'metro', 'launch', 'ship', 'vehicle', 'motor', 'bike'
  ],
  'Shopping': [
    'daraz', 'amazon', 'mall', 'shop', 'store', 'fashion', 'clothing',
    'shoes', 'footwear', 'apparels', 'garments', 'boutique', 'market',
    'electronics', 'gadget', 'mobile', 'laptop', 'accessories',
    'yellow', 'aarong', 'bata', 'apex', 'cats eye', 'richman',
    'westecs', 'depz', 'epyllion', 'decathlon', 'ikea', 'h&m',
    'zara', 'lifestyle', 'wallmart', 'target', 'costco'
  ],
  'Bills': [
    'electric', 'electricity', 'wasa', 'water', 'gas bill', 'titas',
    'internet', 'wifi', 'broadband', 'isp', 'desco', 'dpdc', 'reb',
    'mobile bill', 'phone bill', 'grameenphone', 'robi', 'banglalink',
    'teletalk', 'airtel', 'utility', 'service charge', 'maintenance',
    'rent', 'house rent', 'flat rent'
  ],
  'Health': [
    'pharmacy', 'chemist', 'medicine', 'drug', 'hospital', 'clinic',
    'doctor', 'dental', 'eye', 'health', 'medical', 'lab', 'test',
    'diagnostic', 'apollo', 'square hospital', 'popular', 'ibn sina',
    'evercare', 'labaid', 'watson', 'guardian', 'dispensary'
  ],
  'Entertainment': [
    'netflix', 'youtube', 'spotify', 'amazon prime', 'disney',
    'cinema', 'movie', 'theater', 'concert', 'game', 'gaming',
    'steam', 'playstation', 'xbox', 'subscription', 'streaming',
    'binge', 'chorki', 'bioscope', 'hoichoi', 'fun', 'park',
    'amusement', 'bowling', 'gym', 'fitness', 'sports'
  ],
  'Education': [
    'school', 'college', 'university', 'tuition', 'course', 'class',
    'coaching', 'book', 'stationery', 'pen', 'notebook', 'library',
    'exam', 'fee', 'admission', 'udemy', 'coursera', 'skillshare',
    'training', 'workshop', 'seminar', 'study'
  ],
  'Insurance': [
    'insurance', 'policy', 'premium', 'life insurance', 'health insurance',
    'vehicle insurance', 'fire insurance', 'delta life', 'meghna life',
    'pragati', 'rupali', 'sadharan bima', 'jiban bima'
  ],
};

export const suggestCategory = (merchantName, categoriesList) => {
  if (!merchantName || !categoriesList) return null;
  
  const lower = merchantName.toLowerCase();
  
  // Step 1: Check keyword mapping
  for (const [categoryName, keywords] of Object.entries(categoryKeywords)) {
    const matched = keywords.some(keyword => lower.includes(keyword));
    if (matched) {
      const found = categoriesList.find(
        c => c.name.toLowerCase() === categoryName.toLowerCase()
      );
      if (found) return found;
    }
  }
  
  // Step 2: Fallback - check if merchant name contains category name
  const fallback = categoriesList.find(c => 
    lower.includes(c.name.toLowerCase())
  );
  if (fallback) return fallback;
  
  // Step 3: Default to first non-income category
  return categoriesList.find(c => c.type !== 'income') || categoriesList[0];
};
