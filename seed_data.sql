-- SEED DATA FOR TROLLEY
-- Run this in Supabase SQL Editor after 001_initial_schema.sql

-- 1. Insert Sample Restaurants
INSERT INTO restaurants (name, slug, description, cuisine_type, phone, email, address, zone, emoji, is_open, is_active)
VALUES 
  ('Swati Braai House', 'swati-braai-house', 'Authentic Eswatini grilled meats and sides.', 'Braai', '+268 7600 0001', 'info@swatibraai.sz', 'Gables Shopping Centre, Ezulwini', 'Mbabane', '🥩', TRUE, TRUE),
  ('Sibebe Rock Café', 'sibebe-rock-cafe', 'Best burgers and views in Mbabane.', 'Café', '+268 7600 0002', 'hello@sibeberock.sz', 'Pine Valley, Mbabane', 'Mbabane', '🍔', TRUE, TRUE),
  ('Manzini Pizza Co.', 'manzini-pizza-co', 'Wood-fired pizzas with local toppings.', 'Pizza', '+268 7600 0003', 'order@manzinipizza.sz', 'President Centre, Manzini', 'Manzini', '🍕', TRUE, TRUE);

-- 2. Insert Menu Categories for Swati Braai House
DO $$
DECLARE
    braai_id UUID;
BEGIN
    SELECT id INTO braai_id FROM restaurants WHERE slug = 'swati-braai-house';
    
    INSERT INTO menu_categories (restaurant_id, name, display_order)
    VALUES 
      (braai_id, 'Platters', 1),
      (braai_id, 'Sides', 2);
END $$;

-- 3. Insert Menu Items for Swati Braai House
DO $$
DECLARE
    braai_id UUID;
    platters_cat_id UUID;
    sides_cat_id UUID;
BEGIN
    SELECT id INTO braai_id FROM restaurants WHERE slug = 'swati-braai-house';
    SELECT id INTO platters_cat_id FROM menu_categories WHERE restaurant_id = braai_id AND name = 'Platters';
    SELECT id INTO sides_cat_id FROM menu_categories WHERE restaurant_id = braai_id AND name = 'Sides';
    
    INSERT INTO menu_items (category_id, restaurant_id, name, description, price_szl, emoji, is_available)
    VALUES 
      (platters_cat_id, braai_id, 'Mixed Grill Platter', 'Beef, chicken, and boerewors with pap.', 150.00, '🍖', TRUE),
      (platters_cat_id, braai_id, 'Quarter Chicken', 'Flame-grilled with peri-peri sauce.', 65.00, '🍗', TRUE),
      (sides_cat_id, braai_id, 'Chakalaka', 'Spicy vegetable relish.', 25.00, '🌶️', TRUE),
      (sides_cat_id, braai_id, 'Pap & Gravy', 'Traditional maize meal.', 20.00, '🥣', TRUE);
END $$;
