// ============================================
// PROJECT PHOENIX — Default Food Dictionary
// ============================================
// Comprehensive Indian food database with
// approximate nutritional values per serving.
// Organized by category for easy browsing.
// ============================================

const defaultFoods = [
  // ─── Breads & Rotis ───────────────────────
  { name: '1 Chapati', calories: 70, protein: 2, category: 'Breads' },
  { name: '1 Paratha (plain)', calories: 150, protein: 4, category: 'Breads' },
  { name: '1 Aloo Paratha', calories: 210, protein: 5, category: 'Breads' },
  { name: '1 Gobi Paratha', calories: 190, protein: 4, category: 'Breads' },
  { name: '1 Paneer Paratha', calories: 250, protein: 8, category: 'Breads' },
  { name: '1 Methi Paratha', calories: 180, protein: 4, category: 'Breads' },
  { name: '1 Poori', calories: 100, protein: 2, category: 'Breads' },
  { name: '1 Bhatura', calories: 200, protein: 4, category: 'Breads' },
  { name: '1 Naan', calories: 260, protein: 7, category: 'Breads' },
  { name: '1 Garlic Naan', calories: 300, protein: 7, category: 'Breads' },
  { name: '1 Butter Naan', calories: 320, protein: 7, category: 'Breads' },
  { name: '1 Kulcha', calories: 270, protein: 6, category: 'Breads' },
  { name: '1 Rumali Roti', calories: 90, protein: 3, category: 'Breads' },
  { name: '1 Missi Roti', calories: 120, protein: 5, category: 'Breads' },
  { name: '1 Thepla', calories: 130, protein: 4, category: 'Breads' },

  // ─── Rice & Biryani ───────────────────────
  { name: '1 Bowl Rice (cooked)', calories: 200, protein: 4, category: 'Rice' },
  { name: '1 Plate Jeera Rice', calories: 250, protein: 5, category: 'Rice' },
  { name: '1 Plate Veg Biryani', calories: 350, protein: 8, category: 'Rice' },
  { name: '1 Plate Chicken Biryani', calories: 450, protein: 22, category: 'Rice' },
  { name: '1 Plate Mutton Biryani', calories: 500, protein: 25, category: 'Rice' },
  { name: '1 Plate Egg Biryani', calories: 400, protein: 16, category: 'Rice' },
  { name: '1 Plate Pulao', calories: 280, protein: 6, category: 'Rice' },
  { name: '1 Bowl Khichdi', calories: 200, protein: 6, category: 'Rice' },
  { name: '1 Plate Lemon Rice', calories: 240, protein: 4, category: 'Rice' },
  { name: '1 Plate Curd Rice', calories: 220, protein: 6, category: 'Rice' },
  { name: '1 Plate Fried Rice', calories: 350, protein: 8, category: 'Rice' },

  // ─── Dal & Lentils ────────────────────────
  { name: '1 Bowl Dal (Toor/Arhar)', calories: 120, protein: 6, category: 'Dal' },
  { name: '1 Bowl Dal Fry', calories: 150, protein: 7, category: 'Dal' },
  { name: '1 Bowl Dal Makhani', calories: 220, protein: 9, category: 'Dal' },
  { name: '1 Bowl Dal Tadka', calories: 140, protein: 7, category: 'Dal' },
  { name: '1 Bowl Moong Dal', calories: 110, protein: 7, category: 'Dal' },
  { name: '1 Bowl Rajma', calories: 150, protein: 7, category: 'Dal' },
  { name: '1 Bowl Chole', calories: 160, protein: 7, category: 'Dal' },
  { name: '1 Bowl Sambhar', calories: 130, protein: 5, category: 'Dal' },
  { name: '1 Bowl Rasam', calories: 50, protein: 2, category: 'Dal' },
  { name: '1 Bowl Kadhi', calories: 140, protein: 4, category: 'Dal' },

  // ─── Sabzi & Curries ──────────────────────
  { name: '1 Bowl Sabzi (mixed veg)', calories: 100, protein: 3, category: 'Sabzi' },
  { name: '1 Bowl Aloo Gobhi', calories: 120, protein: 3, category: 'Sabzi' },
  { name: '1 Bowl Palak Paneer', calories: 250, protein: 14, category: 'Sabzi' },
  { name: '1 Bowl Shahi Paneer', calories: 300, protein: 15, category: 'Sabzi' },
  { name: '1 Bowl Matar Paneer', calories: 260, protein: 13, category: 'Sabzi' },
  { name: '1 Bowl Paneer Butter Masala', calories: 320, protein: 14, category: 'Sabzi' },
  { name: '1 Bowl Malai Kofta', calories: 290, protein: 8, category: 'Sabzi' },
  { name: '1 Bowl Bhindi Fry', calories: 110, protein: 3, category: 'Sabzi' },
  { name: '1 Bowl Baingan Bharta', calories: 130, protein: 3, category: 'Sabzi' },
  { name: '1 Bowl Aloo Matar', calories: 140, protein: 4, category: 'Sabzi' },
  { name: '1 Bowl Aloo Jeera', calories: 130, protein: 3, category: 'Sabzi' },
  { name: '1 Bowl Chana Masala', calories: 180, protein: 8, category: 'Sabzi' },

  // ─── Non-Veg Curries ──────────────────────
  { name: '1 Bowl Butter Chicken', calories: 350, protein: 25, category: 'Non-Veg' },
  { name: '1 Bowl Chicken Curry', calories: 280, protein: 22, category: 'Non-Veg' },
  { name: '1 Bowl Kadhai Chicken', calories: 300, protein: 24, category: 'Non-Veg' },
  { name: '1 Bowl Chicken Tikka Masala', calories: 320, protein: 26, category: 'Non-Veg' },
  { name: 'Chicken Breast 100g', calories: 165, protein: 31, category: 'Non-Veg' },
  { name: '1 Bowl Mutton Curry', calories: 350, protein: 28, category: 'Non-Veg' },
  { name: '1 Bowl Egg Curry', calories: 200, protein: 13, category: 'Non-Veg' },
  { name: '1 Bowl Fish Curry', calories: 220, protein: 20, category: 'Non-Veg' },
  { name: '2 pcs Tandoori Chicken', calories: 260, protein: 30, category: 'Non-Veg' },
  { name: '4 pcs Chicken Momos', calories: 200, protein: 12, category: 'Non-Veg' },
  { name: 'Chicken Tikka 6 pcs', calories: 250, protein: 28, category: 'Non-Veg' },

  // ─── Eggs ─────────────────────────────────
  { name: '1 Boiled Egg', calories: 78, protein: 6, category: 'Eggs' },
  { name: '2 Egg Omelette', calories: 180, protein: 12, category: 'Eggs' },
  { name: '1 Egg Bhurji (2 eggs)', calories: 200, protein: 13, category: 'Eggs' },
  { name: '1 Anda Bread', calories: 250, protein: 12, category: 'Eggs' },

  // ─── Paneer & Dairy ───────────────────────
  { name: 'Paneer 100g', calories: 265, protein: 18, category: 'Dairy' },
  { name: '1 Glass Milk (250ml)', calories: 150, protein: 8, category: 'Dairy' },
  { name: '1 Bowl Curd', calories: 100, protein: 5, category: 'Dairy' },
  { name: '1 Glass Lassi (sweet)', calories: 160, protein: 6, category: 'Dairy' },
  { name: '1 Glass Lassi (salted)', calories: 80, protein: 5, category: 'Dairy' },
  { name: '1 Glass Buttermilk', calories: 40, protein: 3, category: 'Dairy' },
  { name: '1 Glass Milkshake', calories: 250, protein: 8, category: 'Dairy' },
  { name: 'Cheese Slice 1 pc', calories: 70, protein: 4, category: 'Dairy' },
  { name: '1 Cup Raita', calories: 70, protein: 3, category: 'Dairy' },
  { name: '1 Bowl Shrikhand', calories: 200, protein: 5, category: 'Dairy' },

  // ─── Breakfast Items ──────────────────────
  { name: '1 Dosa (plain)', calories: 120, protein: 3, category: 'Breakfast' },
  { name: '1 Masala Dosa', calories: 250, protein: 5, category: 'Breakfast' },
  { name: '1 Idli', calories: 60, protein: 2, category: 'Breakfast' },
  { name: '2 Idli + Sambhar', calories: 180, protein: 6, category: 'Breakfast' },
  { name: '1 Bowl Poha', calories: 180, protein: 4, category: 'Breakfast' },
  { name: '1 Bowl Upma', calories: 200, protein: 5, category: 'Breakfast' },
  { name: '1 Plate Uttapam', calories: 200, protein: 5, category: 'Breakfast' },
  { name: '1 Bowl Oats (cooked)', calories: 150, protein: 5, category: 'Breakfast' },
  { name: '1 Bowl Daliya', calories: 170, protein: 6, category: 'Breakfast' },
  { name: '2 Bread Toast + Butter', calories: 200, protein: 4, category: 'Breakfast' },
  { name: '1 Bread Omelette', calories: 280, protein: 14, category: 'Breakfast' },
  { name: '1 Bowl Cornflakes + Milk', calories: 220, protein: 7, category: 'Breakfast' },
  { name: '1 Stuffed Parantha + Curd', calories: 300, protein: 9, category: 'Breakfast' },
  { name: '1 Plate Chole Bhature', calories: 450, protein: 12, category: 'Breakfast' },
  { name: '1 Bowl Misal Pav', calories: 350, protein: 10, category: 'Breakfast' },

  // ─── Snacks ───────────────────────────────
  { name: '1 Samosa', calories: 250, protein: 4, category: 'Snacks' },
  { name: '1 Plate Pakora (10 pcs)', calories: 300, protein: 6, category: 'Snacks' },
  { name: '1 Kachori', calories: 200, protein: 4, category: 'Snacks' },
  { name: '1 Plate Bhel Puri', calories: 200, protein: 4, category: 'Snacks' },
  { name: '1 Plate Sev Puri', calories: 250, protein: 4, category: 'Snacks' },
  { name: '1 Plate Pani Puri (6 pcs)', calories: 180, protein: 3, category: 'Snacks' },
  { name: '1 Plate Pav Bhaji', calories: 400, protein: 10, category: 'Snacks' },
  { name: '1 Vada Pav', calories: 300, protein: 6, category: 'Snacks' },
  { name: '4 pcs Veg Momos', calories: 180, protein: 5, category: 'Snacks' },
  { name: '1 Plate Aloo Tikki', calories: 200, protein: 4, category: 'Snacks' },
  { name: '1 Plate Chaat', calories: 220, protein: 5, category: 'Snacks' },
  { name: '1 Plate Dahi Vada', calories: 180, protein: 5, category: 'Snacks' },
  { name: '1 Spring Roll', calories: 150, protein: 3, category: 'Snacks' },
  { name: '1 Plate Maggi', calories: 310, protein: 7, category: 'Snacks' },
  { name: '1 Slice Pizza', calories: 250, protein: 10, category: 'Snacks' },
  { name: '1 Burger (Veg)', calories: 350, protein: 10, category: 'Snacks' },
  { name: '1 Frankie/Wrap', calories: 300, protein: 8, category: 'Snacks' },
  { name: '1 Plate French Fries', calories: 320, protein: 4, category: 'Snacks' },
  { name: 'Biscuits (4 pcs)', calories: 150, protein: 2, category: 'Snacks' },
  { name: '1 Plate Dhokla (4 pcs)', calories: 160, protein: 5, category: 'Snacks' },
  { name: '1 Bowl Mixture/Namkeen', calories: 250, protein: 5, category: 'Snacks' },

  // ─── Fruits ───────────────────────────────
  { name: '1 Banana', calories: 105, protein: 1, category: 'Fruits' },
  { name: '1 Apple', calories: 95, protein: 0.5, category: 'Fruits' },
  { name: '1 Mango', calories: 150, protein: 1, category: 'Fruits' },
  { name: '1 Bowl Papaya', calories: 60, protein: 0.5, category: 'Fruits' },
  { name: '1 Orange', calories: 62, protein: 1, category: 'Fruits' },
  { name: '1 Bowl Watermelon', calories: 50, protein: 1, category: 'Fruits' },
  { name: '1 Bowl Grapes', calories: 70, protein: 1, category: 'Fruits' },
  { name: '1 Pomegranate', calories: 83, protein: 1.5, category: 'Fruits' },
  { name: '1 Guava', calories: 68, protein: 2.5, category: 'Fruits' },
  { name: '1 Chiku (Sapodilla)', calories: 94, protein: 0.5, category: 'Fruits' },
  { name: '1 Bowl Pineapple', calories: 82, protein: 1, category: 'Fruits' },

  // ─── Dry Fruits & Nuts ────────────────────
  { name: 'Almonds 10 pcs', calories: 70, protein: 2.5, category: 'Dry Fruits' },
  { name: 'Cashews 10 pcs', calories: 90, protein: 2, category: 'Dry Fruits' },
  { name: 'Walnuts 5 halves', calories: 90, protein: 2, category: 'Dry Fruits' },
  { name: 'Peanuts 1 handful', calories: 160, protein: 7, category: 'Dry Fruits' },
  { name: 'Raisins 1 tbsp', calories: 45, protein: 0.5, category: 'Dry Fruits' },
  { name: 'Dates 2 pcs', calories: 110, protein: 1, category: 'Dry Fruits' },
  { name: 'Peanut Butter 2 tbsp', calories: 190, protein: 7, category: 'Dry Fruits' },
  { name: 'Mixed Dry Fruits 1 handful', calories: 170, protein: 5, category: 'Dry Fruits' },

  // ─── Drinks & Beverages ───────────────────
  { name: '1 Cup Chai (with sugar)', calories: 80, protein: 2, category: 'Drinks' },
  { name: '1 Cup Chai (without sugar)', calories: 30, protein: 2, category: 'Drinks' },
  { name: '1 Cup Coffee (with sugar)', calories: 90, protein: 1, category: 'Drinks' },
  { name: '1 Cup Black Coffee', calories: 5, protein: 0, category: 'Drinks' },
  { name: '1 Glass Fresh Juice', calories: 120, protein: 1, category: 'Drinks' },
  { name: '1 Glass Coconut Water', calories: 45, protein: 0.5, category: 'Drinks' },
  { name: '1 Can Cold Drink', calories: 140, protein: 0, category: 'Drinks' },
  { name: '1 Glass Nimbu Paani', calories: 50, protein: 0, category: 'Drinks' },
  { name: '1 Glass Mango Shake', calories: 250, protein: 5, category: 'Drinks' },
  { name: '1 Glass Banana Shake', calories: 200, protein: 7, category: 'Drinks' },
  { name: '1 Cup Haldi Doodh', calories: 160, protein: 8, category: 'Drinks' },

  // ─── Sweets & Desserts ────────────────────
  { name: '1 Gulab Jamun', calories: 150, protein: 2, category: 'Sweets' },
  { name: '1 Rasgulla', calories: 120, protein: 2, category: 'Sweets' },
  { name: '1 Piece Barfi', calories: 130, protein: 2, category: 'Sweets' },
  { name: '1 Laddu (Besan)', calories: 180, protein: 3, category: 'Sweets' },
  { name: '1 Piece Jalebi', calories: 150, protein: 1, category: 'Sweets' },
  { name: '1 Bowl Kheer', calories: 250, protein: 6, category: 'Sweets' },
  { name: '1 Bowl Halwa (Suji)', calories: 250, protein: 4, category: 'Sweets' },
  { name: '1 Bowl Gajar Halwa', calories: 300, protein: 5, category: 'Sweets' },
  { name: '1 Piece Kaju Katli', calories: 90, protein: 2, category: 'Sweets' },
  { name: '1 Scoop Ice Cream', calories: 140, protein: 2, category: 'Sweets' },

  // ─── Supplements & Protein ────────────────
  { name: '1 Scoop Whey Protein', calories: 120, protein: 24, category: 'Supplements' },
  { name: '1 Protein Bar', calories: 200, protein: 20, category: 'Supplements' },
  { name: '1 tbsp Honey', calories: 64, protein: 0, category: 'Supplements' },
  { name: '1 tbsp Ghee', calories: 120, protein: 0, category: 'Supplements' },
  { name: '1 tbsp Butter', calories: 100, protein: 0, category: 'Supplements' },
  { name: '1 tbsp Sugar', calories: 48, protein: 0, category: 'Supplements' },
];

export default defaultFoods;
