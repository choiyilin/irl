-- ============================================================
-- IRL — Venue Seed Data (Manhattan Demo)
-- Paste into Supabase SQL Editor after running schema.sql
-- ============================================================

insert into public.venues (name, category, neighborhood, lat, lng, tags, rating_avg, featured, deal_title, deal_details) values
  ('The Gilded Fox', 'bar', 'East Village', 40.7282, -73.9907, '{"first date","drinks","cozy"}', 4.6, true, '2-for-1 craft cocktails for Premium members', '$18 value'),
  ('Rooftop at The Clement', 'restaurant', 'Midtown', 40.7614, -73.9776, '{"first date","dinner","views"}', 4.8, true, '$15 off dinner for two with Premium', '$15 value'),
  ('Neon Tiger', 'club', 'Lower East Side', 40.7205, -73.9880, '{"nightlife","group outing","dancing"}', 4.3, true, 'Free cover before 11pm + skip the line', '$30 value'),
  ('Court 16 Pickleball', 'activity', 'Williamsburg', 40.7189, -73.9568, '{"activity","sporty","fun"}', 4.7, true, 'Free court rental (1hr) for Premium couples', '$40 value'),
  ('Sotto Voce', 'restaurant', 'East Village', 40.7260, -73.9897, '{"first date","dinner","italian"}', 4.5, true, 'Complimentary dessert with any entrée', '$16 value'),
  ('The Velvet Room', 'bar', 'SoHo', 40.7233, -74.0030, '{"drinks","lounge","music"}', 4.4, true, 'Free signature shot on arrival', '$14 value'),
  ('Puttshack Chelsea', 'activity', 'Chelsea', 40.7425, -74.0010, '{"activity","fun","group outing"}', 4.2, true, 'BOGO mini golf rounds for Premium', '$22 value'),
  ('Skybar Tribeca', 'bar', 'Tribeca', 40.7163, -74.0086, '{"drinks","views","upscale"}', 4.6, true, 'Complimentary coat check + priority seating', '$10 value'),
  ('La Esquina', 'restaurant', 'Nolita', 40.7196, -73.9959, '{"dinner","bottomless","trendy"}', 4.3, true, 'Free guac & chips + $10 off', '$20 value'),
  ('Whisper Lounge', 'club', 'Flatiron', 40.7407, -73.9897, '{"nightlife","dancing","upscale"}', 4.1, true, 'Free cover + 1 drink for Premium ladies', '$35 value'),
  ('Cucina Nonno', 'restaurant', 'Chelsea', 40.7352, -73.9937, '{"bottomless","brunch","weekend"}', 4.7, true, 'Bottomless brunch for $39 (reg $55)', '$16 value'),
  ('Alley Cat Lanes', 'activity', 'Hudson Yards', 40.7484, -73.9857, '{"activity","fun","group outing","first date"}', 4.0, true, 'Free shoe rental + 1 game with Premium', '$18 value'),
  ('Maman', 'coffee', 'SoHo', 40.7215, -73.9985, '{"first date","cozy","coffee"}', 4.6, false, null, null),
  ('Devoción', 'coffee', 'Williamsburg', 40.7267, -73.9905, '{"first date","coffee","cozy"}', 4.7, true, 'Free pastry with any latte for Premium', '$6 value'),
  ('Van Leeuwen', 'dessert', 'East Village', 40.7290, -73.9845, '{"dessert","casual","sweet"}', 4.5, false, null, null),
  ('Levain Bakery', 'dessert', 'Upper West Side', 40.7797, -73.9808, '{"dessert","sweet","casual"}', 4.8, true, 'BOGO cookies for Premium members', '$5 value'),
  ('Dante NYC', 'bar', 'West Village', 40.7305, -74.0000, '{"drinks","first date","cozy","upscale"}', 4.9, true, 'Complimentary Negroni flight for Premium', '$24 value'),
  ('Juliana''s Pizza', 'restaurant', 'DUMBO', 40.7026, -73.9934, '{"dinner","casual","first date"}', 4.7, false, null, null),
  ('Cafeteria', 'restaurant', 'Chelsea', 40.7424, -73.9964, '{"dinner","late night","trendy"}', 4.3, true, '$12 off dinner for two', '$12 value'),
  ('AIRE Ancient Baths', 'activity', 'Tribeca', 40.7194, -74.0065, '{"activity","upscale","cozy"}', 4.9, true, '15% off couples bath experience', '$45 value'),
  ('Cha Cha Matcha', 'coffee', 'Nolita', 40.7260, -73.9932, '{"coffee","casual","trendy"}', 4.2, false, null, null),
  ('Employees Only', 'bar', 'West Village', 40.7335, -74.0050, '{"drinks","late night","first date"}', 4.6, true, 'Free psychic reading at the door + 1 drink', '$20 value'),
  ('Taiyaki NYC', 'dessert', 'Chinatown', 40.7168, -73.9990, '{"dessert","casual","sweet"}', 4.4, false, null, null),
  ('The Flatiron Room', 'bar', 'Flatiron', 40.7440, -73.9880, '{"drinks","upscale","cozy"}', 4.7, true, 'Complimentary whiskey tasting (3 pours)', '$28 value'),
  ('Catch NYC', 'restaurant', 'Meatpacking', 40.7415, -74.0058, '{"dinner","upscale","views"}', 4.5, true, 'Free appetizer with entrée for Premium', '$18 value'),
  ('Smorgasburg', 'other', 'Williamsburg', 40.7214, -73.9616, '{"casual","fun","group outing","first date"}', 4.3, false, null, null),

  -- K-Town Nightlife
  ('Mission', 'club', 'Koreatown', 40.7480, -73.9870, '{"drinks","late night","club","dancing","korean"}', 4.4, true, 'Free cover before 11pm (IRL+)', '$30 value'),
  ('DEN Social', 'bar', 'Koreatown', 40.7484, -73.9877, '{"drinks","late night","group outing","korean","soju"}', 4.3, true, '2-for-1 soju cocktails (IRL+)', '$16 value'),
  ('Maru', 'bar', 'Koreatown', 40.7489, -73.9863, '{"drinks","late night","korean","soju","cozy"}', 4.5, true, 'Skip the line (IRL+)', '$10 value'),
  ('Pocha 32', 'bar', 'Koreatown', 40.7476, -73.9880, '{"drinks","late night","group outing","korean","soju","budget"}', 4.2, true, 'Free shot with check-in (IRL+)', '$8 value'),
  ('Soju Haus', 'bar', 'Koreatown', 40.7486, -73.9859, '{"drinks","late night","korean","soju","group outing"}', 4.1, true, '2-for-1 soju bombs (IRL+)', '$12 value'),
  ('Gagopa Karaoke', 'activity', 'Koreatown', 40.7478, -73.9872, '{"activity","late night","group outing","korean","karaoke","fun"}', 4.3, true, 'Free hour upgrade with 2hr booking (IRL+)', '$25 value'),
  ('Insa', 'bar', 'Koreatown', 40.7492, -73.9868, '{"drinks","late night","korean","karaoke","group outing"}', 4.4, false, null, null),
  ('Circle Lounge', 'club', 'Koreatown', 40.7483, -73.9885, '{"drinks","late night","club","dancing","korean"}', 4.2, true, 'Free cover + 1 drink for IRL+ members', '$35 value'),
  ('The Spot K-Town', 'club', 'Koreatown', 40.7475, -73.9866, '{"drinks","late night","club","dancing","group outing","korean"}', 4.0, false, null, null),
  ('Seoul Nights', 'club', 'Koreatown', 40.7490, -73.9875, '{"drinks","late night","club","dancing","korean"}', 4.3, true, 'Skip the line + free shot (IRL+)', '$20 value'),
  ('Ktown Social Club', 'bar', 'Koreatown', 40.7487, -73.9882, '{"drinks","late night","korean","soju","cozy"}', 4.1, false, null, null),
  ('Boka', 'bar', 'Koreatown', 40.7479, -73.9862, '{"drinks","late night","korean","group outing"}', 4.2, true, 'Free appetizer with first round (IRL+)', '$14 value'),

  -- Central Park Date Activities
  ('Central Park Picnic Spot', 'activity', 'Central Park', 40.7729, -73.9712, '{"activity","first date","casual","daytime","romantic","outdoor","budget"}', 4.8, true, 'Free — bring a blanket!', 'Free'),
  ('Rowboat at The Lake', 'activity', 'Central Park', 40.7753, -73.9713, '{"activity","first date","romantic","daytime","outdoor","scenic"}', 4.7, true, 'Under $20 per hour', '$20'),
  ('Bethesda Terrace Walk', 'activity', 'Central Park', 40.7741, -73.9710, '{"activity","first date","casual","daytime","romantic","scenic","outdoor"}', 4.9, true, 'Free', 'Free'),
  ('Bow Bridge Photo Walk', 'activity', 'Central Park', 40.7746, -73.9718, '{"activity","first date","romantic","scenic","outdoor","daytime"}', 4.8, false, null, null),
  ('Strawberry Fields Stroll', 'activity', 'Central Park', 40.7757, -73.9749, '{"activity","casual","daytime","outdoor","scenic"}', 4.5, false, null, null),
  ('Great Lawn Sunset', 'activity', 'Central Park', 40.7812, -73.9665, '{"activity","first date","casual","daytime","romantic","outdoor","budget"}', 4.7, true, 'Free — bring a blanket!', 'Free'),
  ('Central Park Zoo', 'activity', 'Central Park', 40.7677, -73.9718, '{"activity","first date","casual","daytime","fun"}', 4.4, true, '$5 off admission for two (IRL+)', '$5 value'),
  ('Carousel Date', 'activity', 'Central Park', 40.7680, -73.9740, '{"activity","casual","daytime","fun","budget"}', 4.2, false, null, null),
  ('Shakespeare Garden', 'activity', 'Central Park', 40.7795, -73.9695, '{"activity","first date","romantic","scenic","outdoor","daytime"}', 4.6, false, null, null),
  ('Conservatory Garden', 'activity', 'Central Park', 40.7942, -73.9520, '{"activity","first date","romantic","scenic","outdoor","daytime"}', 4.7, false, null, null);
