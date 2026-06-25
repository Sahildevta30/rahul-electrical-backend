-- ============================================================
-- Rahul Electrical Works - Seed Data
-- ============================================================

-- CATEGORIES
INSERT INTO categories (name, name_hi, slug, icon, sort_order) VALUES
  ('Lighting',          'लाइटिंग',        'lighting',       '💡', 1),
  ('Wiring & Cables',   'तार और केबल',     'wiring-cables',  '🔶', 2),
  ('Switches & Panels', 'स्विच और पैनल',   'switches-panels','🔌', 3),
  ('Motors & Pumps',    'मोटर और पंप',     'motors-pumps',   '⚙️', 4),
  ('Spare Parts',       'स्पेयर पार्ट्स',  'spare-parts',    '🔩', 5),
  ('Tools',             'टूल्स',           'tools',          '🔧', 6)
ON CONFLICT (slug) DO NOTHING;

-- PRODUCTS (50 products)
DO $$
DECLARE
  cat_lighting        UUID;
  cat_wiring          UUID;
  cat_switches        UUID;
  cat_motors          UUID;
  cat_spare           UUID;
  cat_tools           UUID;
BEGIN
  SELECT id INTO cat_lighting  FROM categories WHERE slug='lighting';
  SELECT id INTO cat_wiring    FROM categories WHERE slug='wiring-cables';
  SELECT id INTO cat_switches  FROM categories WHERE slug='switches-panels';
  SELECT id INTO cat_motors    FROM categories WHERE slug='motors-pumps';
  SELECT id INTO cat_spare     FROM categories WHERE slug='spare-parts';
  SELECT id INTO cat_tools     FROM categories WHERE slug='tools';

  -- LIGHTING (8 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_lighting,'LED Bulb 9W',        'LED बल्ब 9W',       'led-bulb-9w',        'LGT001',120,150,50,true, 'Energy-saving 9W LED bulb, warm white, 810 lumens, 3 year warranty'),
    (cat_lighting,'LED Bulb 12W',       'LED बल्ब 12W',      'led-bulb-12w',       'LGT002',150,190,45,true, 'High-brightness 12W LED bulb, cool white, 1080 lumens'),
    (cat_lighting,'CFL Tube 20W',       'CFL ट्यूब 20W',     'cfl-tube-20w',       'LGT003',200,250,35,false,'T8 fluorescent tube, 20W, cool white, 1800 lumens'),
    (cat_lighting,'LED Street Light 30W','LED स्ट्रीट लाइट','led-street-30w',     'LGT004',950,1200,20,false,'Waterproof LED street light, 30W, IP65 rated'),
    (cat_lighting,'LED Panel Light 18W','LED पैनल लाइट',    'led-panel-18w',      'LGT005',550,700,25,true, 'Square LED panel, 18W, recessed mount, cool white'),
    (cat_lighting,'Flood Light 50W',    'फ्लड लाइट 50W',    'flood-light-50w',    'LGT006',1200,1500,15,false,'Outdoor waterproof flood light, 50W, IP66'),
    (cat_lighting,'Emergency Light',    'इमरजेंसी लाइट',   'emergency-light',    'LGT007',450,550,30,false,'Rechargeable LED emergency light, 4W, 4hr backup'),
    (cat_lighting,'Tube Light Holder',  'ट्यूब लाइट होल्डर','tube-light-holder',  'LGT008',85,110,60,false, 'T8 fluorescent tube holder set with starter')
  ON CONFLICT (slug) DO NOTHING;

  -- WIRING (8 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_wiring,'Copper Wire 1.5mm 90m', 'कॉपर तार 1.5mm',  'copper-wire-1-5mm', 'WRG001',650,750,30,true, 'ISI certified 1.5mm copper wire, 90m roll, 97% purity'),
    (cat_wiring,'Copper Wire 2.5mm 90m', 'कॉपर तार 2.5mm',  'copper-wire-2-5mm', 'WRG002',950,1100,25,true, 'ISI certified 2.5mm copper wire, 90m roll, heavy load'),
    (cat_wiring,'Copper Wire 4mm 90m',   'कॉपर तार 4mm',    'copper-wire-4mm',   'WRG003',1400,1600,20,false,'ISI certified 4mm copper wire, 90m roll, for heavy appliances'),
    (cat_wiring,'Armoured Cable 4-core', 'आर्मर्ड केबल',    'armoured-cable-4c', 'WRG004',2200,2600,10,false,'4-core armoured underground cable, 4mm, 10m length'),
    (cat_wiring,'PVC Conduit 1 inch',    'PVC कंड्यूट',     'pvc-conduit-1in',   'WRG005',85,110,50,false, 'Rigid PVC electrical conduit pipe, 1 inch, 3m length'),
    (cat_wiring,'Flexible Conduit 25mm', 'फ्लेक्सिबल कंड्यूट','flex-conduit-25mm','WRG006',220,270,35,false,'Flexible metallic conduit, 25mm, 10m roll'),
    (cat_wiring,'Cable Tie 100pc',       'केबल टाई',        'cable-tie-100pc',   'WRG007',95,120,80,false, 'Nylon cable ties, 200mm x 4.8mm, pack of 100'),
    (cat_wiring,'PVC Tape Roll',         'PVC टेप',         'pvc-tape-roll',     'WRG008',45,60,100,false, 'PVC insulation tape 18mm x 10m, flame retardant')
  ON CONFLICT (slug) DO NOTHING;

  -- SWITCHES & PANELS (10 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_switches,'Modular Switch 6A',       'मॉड्यूलर स्विच',    'modular-switch-6a',    'SWP001',95,120,60,false,'6A modular one-way switch, ISI marked'),
    (cat_switches,'Modular Socket 6A',       'मॉड्यूलर सॉकेट',   'modular-socket-6a',    'SWP002',110,140,55,false,'3-pin modular socket, 6A, child-safe shutter'),
    (cat_switches,'MCB Single Pole 32A',     'MCB सिंगल पोल',    'mcb-single-32a',       'SWP003',280,340,20,true, 'Miniature circuit breaker, 32A, single pole, ISI'),
    (cat_switches,'MCB Double Pole 32A',     'MCB डबल पोल',      'mcb-double-32a',       'SWP004',520,640,15,false,'MCB double pole, 32A, 240V AC'),
    (cat_switches,'ELCB 63A 30mA',           'ELCB 63A',          'elcb-63a',             'SWP005',850,1050,12,true, 'Earth leakage circuit breaker, 63A, 30mA sensitivity'),
    (cat_switches,'Distribution Board 6-way','DB बॉक्स 6-way',   'db-board-6way',        'SWP006',650,800,18,false,'6-way distribution board, powder coated steel'),
    (cat_switches,'Distribution Board 12-way','DB बॉक्स 12-way', 'db-board-12way',       'SWP007',1100,1350,10,false,'12-way distribution board with bus bar'),
    (cat_switches,'Fan Regulator 5-speed',   'फैन रेगुलेटर',     'fan-regulator-5speed', 'SWP008',150,190,40,true, 'Electronic step-type fan speed controller, 5-speed'),
    (cat_switches,'Voltage Stabilizer 5KVA', 'वोल्टेज स्टेबलाइजर','voltage-stab-5kva',   'SWP009',3200,3800,8,false,'Servo voltage stabilizer, 5KVA, for home appliances'),
    (cat_switches,'Automatic Changeover',    'ऑटो चेंजओवर',      'auto-changeover-63a',  'SWP010',1800,2200,6,false,'Automatic changeover switch, 63A, for generator/inverter')
  ON CONFLICT (slug) DO NOTHING;

  -- MOTORS & PUMPS (8 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_motors,'Submersible Pump 0.5HP',   'सबमर्सिबल पंप 0.5HP','submersible-0-5hp',  'MTP001',3500,4200,10,true, '0.5HP single-phase submersible pump, 30m head'),
    (cat_motors,'Submersible Pump 1HP',     'सबमर्सिबल पंप 1HP',  'submersible-1hp',    'MTP002',5500,6500,8,true,  '1HP single-phase submersible pump, 40m head'),
    (cat_motors,'Monoblock Pump 0.5HP',     'मोनोब्लॉक पंप',      'monoblock-0-5hp',    'MTP003',2800,3400,10,false,'0.5HP monoblock centrifugal pump, surface mounted'),
    (cat_motors,'Motor Capacitor 8μF',      'मोटर कैपेसिटर 8μF',  'motor-cap-8uf',      'MTP004',180,220,25,true,  'Run capacitor 8μF 450V for single-phase motors'),
    (cat_motors,'Motor Capacitor 25μF',     'मोटर कैपेसिटर 25μF', 'motor-cap-25uf',     'MTP005',220,270,22,false, 'Start capacitor 25μF for submersible pumps'),
    (cat_motors,'Pump Control Panel 1HP',   'पंप कंट्रोल पैनल',   'pump-panel-1hp',     'MTP006',1800,2200,8,false, 'Automatic pump controller with dry-run protection'),
    (cat_motors,'Float Switch',             'फ्लोट स्विच',         'float-switch',       'MTP007',350,440,20,false, 'Automatic water level float switch for overhead tanks'),
    (cat_motors,'Pressure Switch',          'प्रेशर स्विच',        'pressure-switch',    'MTP008',650,800,12,false, 'Automatic pressure switch for booster pumps')
  ON CONFLICT (slug) DO NOTHING;

  -- SPARE PARTS (8 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_spare,'Ceiling Fan Capacitor 2.5μF','सीलिंग फैन कैपेसिटर','fan-cap-2-5uf',     'SPR001',85,110,50,false,'2.5μF run capacitor for ceiling fans'),
    (cat_spare,'Ceiling Fan Capacitor 3.15μF','फैन कैपेसिटर 3.15', 'fan-cap-3-15uf',    'SPR002',95,120,45,false,'3.15μF run capacitor for high-speed ceiling fans'),
    (cat_spare,'Tube Light Choke 40W',      'ट्यूब लाइट चोक',    'tube-choke-40w',     'SPR003',120,150,35,false,'Electromagnetic ballast/choke for 40W tube light'),
    (cat_spare,'Tube Light Starter',        'ट्यूब लाइट स्टार्टर','tube-starter',       'SPR004',15,20,100,false, 'Starter for fluorescent tube light, pack of 5'),
    (cat_spare,'Door Bell Transformer',     'डोरबेल ट्रांसफॉर्मर','doorbell-transformer','SPR005',120,150,30,false,'240V to 8V/12V transformer for door bells'),
    (cat_spare,'Coil Spring Contact',       'कॉइल स्प्रिंग',     'coil-spring-contact', 'SPR006',45,60,80,false, 'Replacement spring contact for switches'),
    (cat_spare,'Ceramic Fuse 32A',          'फ्यूज 32A',          'ceramic-fuse-32a',   'SPR007',25,35,120,false, 'Ceramic cartridge fuse 32A, pack of 5'),
    (cat_spare,'Wire Connector Strip',      'वायर कनेक्टर',      'wire-connector-strip','SPR008',180,220,40,false,'12-way terminal block connector strip')
  ON CONFLICT (slug) DO NOTHING;

  -- TOOLS (8 products)
  INSERT INTO products (category_id, name, name_hi, slug, sku, price, mrp, stock, is_featured, description) VALUES
    (cat_tools,'Digital Multimeter',        'डिजिटल मल्टीमीटर',   'digital-multimeter', 'TLS001',750,950,15,true, 'Auto-ranging digital multimeter, AC/DC, capacitance'),
    (cat_tools,'Analog Multimeter',         'एनालॉग मल्टीमीटर',   'analog-multimeter',  'TLS002',380,480,12,false,'Analog multimeter, 1000V DC, 10A, with probes'),
    (cat_tools,'Insulation Tester 500V',    'इंसुलेशन टेस्टर',    'insulation-tester',  'TLS003',1800,2200,6,false,'Digital insulation resistance tester, 500V/1000V'),
    (cat_tools,'Clamp Meter 400A',          'क्लैंप मीटर',        'clamp-meter-400a',   'TLS004',1200,1500,8,true, 'AC clamp meter 400A, with temperature measurement'),
    (cat_tools,'Screwdriver Set 6pc',       'स्क्रूड्राइवर सेट',  'screwdriver-set-6pc','TLS005',280,350,25,false,'Insulated screwdriver set, 6-piece, 1000V rated'),
    (cat_tools,'Pliers Set 3pc',            'प्लायर्स सेट',       'pliers-set-3pc',     'TLS006',320,400,20,false,'Combination, nose, and cutter pliers, insulated handles'),
    (cat_tools,'Wire Stripper',             'वायर स्ट्रिपर',      'wire-stripper',      'TLS007',180,220,30,false,'Automatic wire stripper 0.5-6mm, professional grade'),
    (cat_tools,'Voltage Tester Pen',        'वोल्टेज टेस्टर',     'voltage-tester-pen', 'TLS008',95,120,40,false, 'Non-contact voltage tester pen, 12-1000V AC')
  ON CONFLICT (slug) DO NOTHING;

END $$;

-- DEFAULT ADMIN USER (password: Admin@123)
INSERT INTO users (name, phone, email, password_hash, role)
VALUES (
  'Rahul Admin',
  '9827708428',
  'rahulelecworks@gmail.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin'
) ON CONFLICT (phone) DO NOTHING;
