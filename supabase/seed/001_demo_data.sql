-- TyreLink Ghana demo seed
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
-- Demo data only; replace with verified commercial records before launch.

insert into tyrelink.suppliers (id, trading_name, legal_name, contact_name, phone, email, city, status, commission_rate)
values
  ('10000000-0000-4000-8000-000000000001', 'Accra Tyre Distribution', 'Accra Tyre Distribution Ltd', 'Kwame Mensah', '+233 24 100 1001', 'sales@demo-accra-tyres.example', 'Accra', 'approved', 12.00),
  ('10000000-0000-4000-8000-000000000002', 'Westline Auto Supplies', 'Westline Auto Supplies Ltd', 'Ama Boateng', '+233 20 200 2002', 'sales@demo-westline.example', 'Tema', 'approved', 12.00),
  ('10000000-0000-4000-8000-000000000003', 'Northern Fleet Tyres', 'Northern Fleet Tyres Ltd', 'Abdul Rahman', '+233 27 300 3003', 'sales@demo-northern.example', 'Kumasi', 'approved', 10.00)
on conflict (id) do nothing;

insert into tyrelink.tyre_products (id, brand, model, width_mm, aspect_ratio, rim_size, load_index, speed_rating, category, warranty_description, wet_grip_rating, mileage_notes, active)
values
  ('20000000-0000-4000-8000-000000000001', 'Linglong', 'ComfortMaster', 175, 65, 14, '82', 'H', 'budget', '12 months against manufacturing defects', 'C', 'Balanced everyday option for city driving', true),
  ('20000000-0000-4000-8000-000000000002', 'Royal Black', 'Royal Excellence', 185, 65, 15, '88', 'H', 'budget', '12 months against manufacturing defects', 'C', 'Value-focused option for compact saloons', true),
  ('20000000-0000-4000-8000-000000000003', 'Centara', 'Performance Touring', 195, 65, 15, '91', 'V', 'mid_range', '24 months against manufacturing defects', 'B', 'Quiet touring tyre for mixed Ghanaian roads', true),
  ('20000000-0000-4000-8000-000000000004', 'Michelin', 'Primacy 4', 205, 55, 16, '91', 'V', 'premium', '36 months against manufacturing defects', 'A', 'Premium wet braking and long-life touring', true),
  ('20000000-0000-4000-8000-000000000005', 'Bridgestone', 'Turanza T005', 215, 55, 17, '94', 'W', 'premium', '36 months against manufacturing defects', 'A', 'Premium touring for executive saloons', true),
  ('20000000-0000-4000-8000-000000000006', 'Goodyear', 'EfficientGrip Performance', 225, 65, 17, '102', 'H', 'premium', '36 months against manufacturing defects', 'A', 'SUV touring with strong wet-road performance', true),
  ('20000000-0000-4000-8000-000000000007', 'Linglong', 'Commercial Runner', 215, 75, 16, '116', 'R', 'commercial', '12 months against manufacturing defects', 'C', 'Commercial light-truck option', true)
on conflict (id) do nothing;

insert into tyrelink.supplier_inventory (id, supplier_id, product_id, supplier_sku, unit_price, currency, stock_quantity, reserved_quantity, dispatch_time_hours, status)
values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'ATD-CM-1756514', 620.00, 'GHS', 18, 0, 12, 'active'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'WAS-RE-1856515', 760.00, 'GHS', 24, 0, 24, 'active'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000003', 'NFT-PT-1956515', 980.00, 'GHS', 12, 0, 24, 'active'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000004', 'ATD-MP-2055516', 2150.00, 'GHS', 8, 0, 12, 'active'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000005', 'WAS-BT-2155517', 2380.00, 'GHS', 6, 0, 24, 'active'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000006', 'NFT-GY-2256517', 2650.00, 'GHS', 7, 0, 36, 'active'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000007', 'NFT-LT-2157516', 1850.00, 'GHS', 10, 0, 36, 'active')
on conflict (id) do nothing;

insert into tyrelink.fitting_stations (id, trading_name, legal_name, phone, email, address_line, city, region, digital_address, latitude, longitude, status, membership_status, fitting_bays, standard_fitting_minutes, opening_hours, approved_at)
values
  ('40000000-0000-4000-8000-000000000001', 'TyreLink East Legon', 'TyreLink East Legon Demo Ltd', '+233 24 410 4101', 'eastlegon@tyrelink.demo', 'Boundary Road, East Legon', 'Accra', 'Greater Accra', 'GA-123-4567', 5.640200, -0.153700, 'approved', 'active', 4, 60, '{"mon_fri":"08:00-18:00","sat":"09:00-16:00"}', now()),
  ('40000000-0000-4000-8000-000000000002', 'TyreLink Spintex', 'TyreLink Spintex Demo Ltd', '+233 20 420 4202', 'spintex@tyrelink.demo', 'Spintex Road, near Coca-Cola Roundabout', 'Accra', 'Greater Accra', 'GT-234-5678', 5.625000, -0.101000, 'approved', 'active', 3, 60, '{"mon_fri":"08:00-18:00","sat":"09:00-15:00"}', now()),
  ('40000000-0000-4000-8000-000000000003', 'TyreLink Osu', 'TyreLink Osu Demo Ltd', '+233 27 430 4303', 'osu@tyrelink.demo', 'Oxford Street, Osu', 'Accra', 'Greater Accra', 'GT-345-6789', 5.556000, -0.182000, 'approved', 'active', 2, 60, '{"mon_fri":"08:30-17:30","sat":"09:00-14:00"}', now()),
  ('40000000-0000-4000-8000-000000000004', 'TyreLink Kumasi Central', 'TyreLink Kumasi Central Demo Ltd', '+233 24 440 4404', 'kumasi@tyrelink.demo', 'Bantama High Street', 'Kumasi', 'Ashanti', 'AK-456-7890', 6.700000, -1.625000, 'approved', 'active', 3, 60, '{"mon_fri":"08:00-17:00","sat":"09:00-15:00"}', now())
on conflict (id) do nothing;

insert into tyrelink.services (id, name, service_type, active)
values
  ('50000000-0000-4000-8000-000000000001', 'Tyre fitting', 'fitting', true),
  ('50000000-0000-4000-8000-000000000002', 'Wheel balancing', 'balancing', true),
  ('50000000-0000-4000-8000-000000000003', 'Wheel alignment', 'alignment', true),
  ('50000000-0000-4000-8000-000000000004', 'Valve replacement', 'valve', true),
  ('50000000-0000-4000-8000-000000000005', 'Old tyre disposal', 'disposal', true)
on conflict (id) do nothing;

insert into tyrelink.station_services (station_id, service_id, price, price_unit, duration_minutes, active)
select s.id, v.service_id, v.price, v.price_unit, v.duration_minutes, true
from (values
  ('40000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, 80.00, 'per_tyre', 15),
  ('40000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 180.00, 'per_vehicle', 30),
  ('40000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000003'::uuid, 250.00, 'per_vehicle', 45),
  ('40000000-0000-4000-8000-000000000002'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, 75.00, 'per_tyre', 15),
  ('40000000-0000-4000-8000-000000000002'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 170.00, 'per_vehicle', 30),
  ('40000000-0000-4000-8000-000000000002'::uuid, '50000000-0000-4000-8000-000000000003'::uuid, 240.00, 'per_vehicle', 45),
  ('40000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, 85.00, 'per_tyre', 15),
  ('40000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 200.00, 'per_vehicle', 30),
  ('40000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000003'::uuid, 280.00, 'per_vehicle', 45),
  ('40000000-0000-4000-8000-000000000004'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, 70.00, 'per_tyre', 15),
  ('40000000-0000-4000-8000-000000000004'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 160.00, 'per_vehicle', 30)
) as v(station_id, service_id, price, price_unit, duration_minutes)
join tyrelink.fitting_stations s on s.id = v.station_id
on conflict (station_id, service_id) do nothing;

insert into tyrelink.vehicle_fitments (id, make, model, year_from, year_to, product_id, recommended, notes)
values
  ('60000000-0000-4000-8000-000000000001', 'Toyota', 'Corolla', 2008, 2013, '20000000-0000-4000-8000-000000000004', true, 'Confirm sidewall size before purchase; common 205/55 R16 fitment.'),
  ('60000000-0000-4000-8000-000000000002', 'Toyota', 'Corolla', 2008, 2013, '20000000-0000-4000-8000-000000000003', false, 'Mid-range alternative for the same common fitment.'),
  ('60000000-0000-4000-8000-000000000003', 'Toyota', 'Camry', 2012, 2017, '20000000-0000-4000-8000-000000000005', true, 'Common 215/55 R17 executive-saloon fitment.'),
  ('60000000-0000-4000-8000-000000000004', 'Honda', 'Civic', 2012, 2018, '20000000-0000-4000-8000-000000000004', true, 'Common 205/55 R16 fitment.'),
  ('60000000-0000-4000-8000-000000000005', 'Hyundai', 'Elantra', 2011, 2016, '20000000-0000-4000-8000-000000000003', true, 'Common 195/65 R15 fitment.'),
  ('60000000-0000-4000-8000-000000000006', 'Kia', 'Sportage', 2016, 2021, '20000000-0000-4000-8000-000000000006', true, 'Common 225/65 R17 SUV fitment.'),
  ('60000000-0000-4000-8000-000000000007', 'Toyota', 'Yaris', 2014, 2020, '20000000-0000-4000-8000-000000000002', true, 'Common 185/65 R15 fitment.'),
  ('60000000-0000-4000-8000-000000000008', 'Nissan', 'Almera', 2012, 2018, '20000000-0000-4000-8000-000000000001', true, 'Common 175/65 R14 fitment.'),
  ('60000000-0000-4000-8000-000000000009', 'Toyota', 'Hiace', 2010, 2018, '20000000-0000-4000-8000-000000000007', true, 'Commercial 215/75 R16 fitment.')
on conflict (id) do nothing;

insert into tyrelink.station_slots (id, station_id, starts_at, ends_at, capacity, booked_count, active)
select v.id, v.station_id, date_trunc('day', now()) + v.day_offset * interval '1 day' + v.start_time, date_trunc('day', now()) + v.day_offset * interval '1 day' + v.end_time, 1, 0, true
from (values
  ('70000000-0000-4000-8000-000000000001'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 1, time '09:00', time '10:00'),
  ('70000000-0000-4000-8000-000000000002'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 1, time '11:00', time '12:00'),
  ('70000000-0000-4000-8000-000000000003'::uuid, '40000000-0000-4000-8000-000000000001'::uuid, 2, time '14:00', time '15:00'),
  ('70000000-0000-4000-8000-000000000004'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 1, time '09:00', time '10:00'),
  ('70000000-0000-4000-8000-000000000005'::uuid, '40000000-0000-4000-8000-000000000002'::uuid, 2, time '13:00', time '14:00'),
  ('70000000-0000-4000-8000-000000000006'::uuid, '40000000-0000-4000-8000-000000000003'::uuid, 1, time '10:00', time '11:00'),
  ('70000000-0000-4000-8000-000000000007'::uuid, '40000000-0000-4000-8000-000000000004'::uuid, 1, time '09:00', time '10:00')
) as v(id, station_id, day_offset, start_time, end_time)
on conflict (id) do nothing;

-- Compact verification-friendly marker.
comment on schema tyrelink is 'TyreLink Ghana demo environment; replace seeded records before production launch.';
