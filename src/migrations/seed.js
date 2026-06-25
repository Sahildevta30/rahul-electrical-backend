require("dotenv").config();
const { pool } = require("../config/db");
const bcrypt = require("bcryptjs");

async function seed() {
  try {
    // Admin user
    const hash = await bcrypt.hash("Admin@2026", 10);
    await pool.query(`
      INSERT INTO users (name, email, phone, password_hash, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, ["Rahul Admin", "rahulelecworks@gmail.com", "9827708428", hash, "admin"]);

    // Categories
    const categories = [
      { name: "Lighting",        name_hi: "प्रकाश",       slug: "lighting",        icon: "💡", sort: 1 },
      { name: "Wiring & Cables", name_hi: "तार",           slug: "wiring",          icon: "🔶", sort: 2 },
      { name: "Switches & Panels",name_hi:"स्विच",         slug: "switches-panels", icon: "🔌", sort: 3 },
      { name: "Motors & Pumps",  name_hi: "मोटर",          slug: "motors-pumps",    icon: "⚙️", sort: 4 },
      { name: "Electrical Parts", name_hi:"पार्ट्स",       slug: "spare-parts",     icon: "🔩", sort: 5 },
      { name: "Tools",           name_hi: "उपकरण",         slug: "tools",           icon: "🔧", sort: 6 },
    ];
    for (const c of categories) {
      await pool.query(`
        INSERT INTO categories (name, name_hi, slug, icon, sort_order)
        VALUES ($1,$2,$3,$4,$5) ON CONFLICT (slug) DO NOTHING
      `, [c.name, c.name_hi, c.slug, c.icon, c.sort]);
    }

    // Sample products
    const { rows: cats } = await pool.query("SELECT id, slug FROM categories");
    const catMap = {};
    cats.forEach(c => catMap[c.slug] = c.id);

    const products = [
      { name:"LED Bulb 9W", slug:"led-bulb-9w", price:120, mrp:150, stock:45, cat:"lighting",
        desc:"Energy saving LED bulb, 9W, warm white 2700K, 810 lumens, 25000 hours life", brand:"Havells", sku:"LED-9W-01", featured:true },
      { name:"LED Bulb 18W", slug:"led-bulb-18w", price:220, mrp:280, stock:30, cat:"lighting",
        desc:"High brightness LED bulb 18W, cool white 6500K, ideal for large rooms", brand:"Philips", sku:"LED-18W-01", featured:false },
      { name:"CFL Tube 20W", slug:"cfl-tube-20w", price:200, mrp:250, stock:35, cat:"lighting",
        desc:"T8 fluorescent tube 20W cool white 6500K, 1800 lumens", brand:"Syska", sku:"CFL-20W-01", featured:false },
      { name:"Flood Light 50W", slug:"flood-light-50w", price:850, mrp:1100, stock:15, cat:"lighting",
        desc:"Outdoor LED flood light 50W, IP65 waterproof, 4500 lumens, 3yr warranty", brand:"Polycab", sku:"FL-50W-01", featured:true },
      { name:"Copper Wire 1.5mm (90m)", slug:"copper-wire-1-5mm", price:650, mrp:750, stock:30, cat:"wiring",
        desc:"ISI certified 1.5mm copper conductor wire, 90m roll, for light fittings", brand:"Polycab", sku:"CW-1.5-01", featured:false },
      { name:"Copper Wire 2.5mm (90m)", slug:"copper-wire-2-5mm", price:950, mrp:1100, stock:25, cat:"wiring",
        desc:"ISI certified 2.5mm copper wire 90m roll, for power points and AC circuits", brand:"Finolex", sku:"CW-2.5-01", featured:false },
      { name:"Armoured Cable 4-core", slug:"armoured-cable-4core", price:2200, mrp:2600, stock:10, cat:"wiring",
        desc:"4-core armoured underground cable, 4mm, 10m coil for industrial use", brand:"KEI", sku:"AC-4C-01", featured:false },
      { name:"MCB 32A Single Pole", slug:"mcb-32a-single", price:280, mrp:350, stock:20, cat:"switches-panels",
        desc:"Miniature circuit breaker 32A single pole, 6kA breaking capacity, ISI", brand:"Havells", sku:"MCB-32S-01", featured:false },
      { name:"ELCB 63A 30mA", slug:"elcb-63a-30ma", price:850, mrp:1050, stock:12, cat:"switches-panels",
        desc:"Earth leakage circuit breaker 63A, 30mA sensitivity, double pole", brand:"Legrand", sku:"ELCB-63-01", featured:true },
      { name:"Fan Regulator 5-speed", slug:"fan-regulator-5-speed", price:150, mrp:180, stock:40, cat:"switches-panels",
        desc:"Electronic step-type fan speed regulator, 5-speed, suitable for all fans", brand:"Anchor", sku:"FR-5S-01", featured:false },
      { name:"Modular Switch 6A", slug:"modular-switch-6a", price:65, mrp:80, stock:60, cat:"switches-panels",
        desc:"6A modular switch, ISI marked, suitable for all standard modular plates", brand:"GM", sku:"MS-6A-01", featured:false },
      { name:"Distribution Board 8-way", slug:"distribution-board-8way", price:1200, mrp:1500, stock:8, cat:"switches-panels",
        desc:"8-way consumer unit distribution board with 100A main switch, IP42", brand:"Havells", sku:"DB-8W-01", featured:false },
      { name:"Motor Capacitor 8μF", slug:"motor-capacitor-8uf", price:180, mrp:220, stock:25, cat:"motors-pumps",
        desc:"Run capacitor 8 microfarad 440V for single phase induction motors, ±5%", brand:"Epcos", sku:"MC-8UF-01", featured:false },
      { name:"Pump Capacitor 25μF", slug:"pump-capacitor-25uf", price:220, mrp:280, stock:18, cat:"motors-pumps",
        desc:"Start/run capacitor 25μF for submersible water pumps, 440V AC", brand:"Epcos", sku:"PC-25UF-01", featured:false },
      { name:"Motor Starter DOL 5HP", slug:"motor-starter-dol-5hp", price:1800, mrp:2200, stock:6, cat:"motors-pumps",
        desc:"Direct online starter 5HP with overload relay and push buttons, panel type", brand:"L&T", sku:"MS-DOL-5HP", featured:true },
      { name:"Submersible Pump 0.5HP", slug:"submersible-pump-0-5hp", price:4500, mrp:5500, stock:5, cat:"motors-pumps",
        desc:"0.5HP single phase submersible water pump, 1500 LPH, 25m head, copper winding", brand:"Kirloskar", sku:"SP-05HP-01", featured:true },
      { name:"Motor Rewinding Wire 20SWG", slug:"rewinding-wire-20swg", price:850, mrp:1000, stock:20, cat:"spare-parts",
        desc:"Enamelled copper winding wire 20 SWG (0.9mm), 1kg spool, H-class insulation", brand:"Vindhya", sku:"RW-20SWG-01", featured:false },
      { name:"Motor Bearing 6205", slug:"motor-bearing-6205", price:120, mrp:150, stock:30, cat:"spare-parts",
        desc:"Deep groove ball bearing 6205 (25×52×15mm), suitable for most motors", brand:"SKF", sku:"BRG-6205-01", featured:false },
      { name:"Transformer Core EI-66", slug:"transformer-core-ei66", price:450, mrp:550, stock:15, cat:"spare-parts",
        desc:"EI-66 silicon steel transformer core lamination set, grade M4", brand:"Generic", sku:"TC-EI66-01", featured:false },
      { name:"Digital Multimeter", slug:"digital-multimeter", price:750, mrp:900, stock:15, cat:"tools",
        desc:"Auto-ranging digital multimeter, AC/DC voltage, current, resistance, capacitance", brand:"Mastech", sku:"DMM-01", featured:false },
      { name:"PVC Insulation Tape", slug:"pvc-insulation-tape", price:45, mrp:55, stock:80, cat:"tools",
        desc:"PVC electrical insulation tape 18mm×10m, flame retardant, weatherproof", brand:"Anchor", sku:"PIT-01", featured:false },
      { name:"Cable Tie 200mm (100pcs)", slug:"cable-tie-200mm", price:85, mrp:100, stock:50, cat:"tools",
        desc:"Nylon cable ties 200mm, UV resistant, 18kg tensile strength, 100pcs pack", brand:"Generic", sku:"CT-200-01", featured:false },
    ];

    for (const p of products) {
      await pool.query(`
        INSERT INTO products (name, slug, price, mrp, stock, category_id, description, brand, sku, is_featured, min_stock)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT (slug) DO NOTHING
      `, [p.name, p.slug, p.price, p.mrp, p.stock, catMap[p.cat], p.desc, p.brand, p.sku, p.featured, 5]);
    }

    console.log("✅ Database seeded with admin, categories, and 22 products");
    console.log("   Admin login: rahulelecworks@gmail.com / Admin@2026");
  } catch (err) {
    console.error("❌ Seed failed:", err.message);
  } finally {
    await pool.end();
  }
}
seed();
