import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const db = new Database("alif_layla.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    password TEXT,
    role TEXT,
    address TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS restaurants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ownerId INTEGER,
    address TEXT,
    lat REAL,
    lng REAL,
    rating REAL DEFAULT 0,
    isOpen INTEGER DEFAULT 1,
    approvedByAdmin INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS food_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    restaurantId INTEGER,
    name TEXT,
    description TEXT,
    price REAL,
    image TEXT,
    category TEXT,
    isAvailable INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER,
    restaurantId INTEGER,
    items TEXT,
    totalAmount REAL,
    deliveryCharge REAL,
    taxAmount REAL,
    commissionAmount REAL,
    status TEXT,
    deliveryBoyId INTEGER,
    paymentStatus TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderId INTEGER,
    userId INTEGER,
    gatewayName TEXT,
    transactionId TEXT,
    amount REAL,
    paymentMethod TEXT,
    status TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS payment_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    gatewayName TEXT,
    publicKey TEXT,
    secretKey TEXT,
    webhookSecret TEXT,
    mode TEXT,
    commissionPercent REAL,
    deliveryChargePercent REAL,
    taxPercent REAL,
    codEnabled INTEGER,
    refundEnabled INTEGER,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Admin and Payment Settings if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE role = 'admin'").get();
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Super Admin",
    "admin@aliflayla.com",
    hashedPassword,
    "admin"
  );
}

// Seed some restaurants and food items
const restaurantExists = db.prepare("SELECT * FROM restaurants LIMIT 1").get();
if (!restaurantExists) {
  const res1 = db.prepare("INSERT INTO restaurants (name, ownerId, address, rating, approvedByAdmin) VALUES (?, ?, ?, ?, ?)").run(
    "Spice Garden", 1, "123 Curry Lane, Mumbai", 4.8, 1
  );
  const res2 = db.prepare("INSERT INTO restaurants (name, ownerId, address, rating, approvedByAdmin) VALUES (?, ?, ?, ?, ?)").run(
    "Burger King", 1, "456 Fast St, Delhi", 4.2, 1
  );

  db.prepare("INSERT INTO food_items (restaurantId, name, description, price, category) VALUES (?, ?, ?, ?, ?)").run(
    res1.lastInsertRowid, "Paneer Tikka", "Grilled cottage cheese with spices", 250, "Starters"
  );
  db.prepare("INSERT INTO food_items (restaurantId, name, description, price, category) VALUES (?, ?, ?, ?, ?)").run(
    res1.lastInsertRowid, "Butter Chicken", "Creamy tomato based chicken curry", 350, "Main Course"
  );
  db.prepare("INSERT INTO food_items (restaurantId, name, description, price, category) VALUES (?, ?, ?, ?, ?)").run(
    res2.lastInsertRowid, "Whopper Burger", "Flame-grilled beef patty burger", 199, "Burgers"
  );
}

const settingsExists = db.prepare("SELECT * FROM payment_settings WHERE id = 1").get();
if (!settingsExists) {
  db.prepare(`
    INSERT INTO payment_settings (
      id, gatewayName, publicKey, secretKey, mode, 
      commissionPercent, deliveryChargePercent, taxPercent, 
      codEnabled, refundEnabled
    ) VALUES (1, 'stripe', 'pk_test_mock', 'sk_test_mock', 'test', 10, 5, 5, 1, 1)
  `).run();
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    console.log("Signup request:", req.body);
    const { name, email, password, role, phone, address } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: "All fields (name, email, password, role) are required" });
    }
    
    try {
      const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (name, email, password, role, phone, address) VALUES (?, ?, ?, ?, ?, ?)").run(
        name, email, hashedPassword, role, phone || null, address || null
      );
      
      console.log("Signup successful for:", email);
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (err: any) {
      console.error("Signup error:", err.message);
      res.status(500).json({ error: "Internal server error during signup" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    console.log("Login attempt:", req.body.email);
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (user && bcrypt.compareSync(password, user.password)) {
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || "secret");
        console.log("Login successful:", email);
        res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
      } else {
        console.log("Login failed: Invalid credentials for", email);
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (err: any) {
      console.error("Login error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Restaurant Routes
  app.get("/api/restaurants", (req, res) => {
    const restaurants = db.prepare("SELECT * FROM restaurants WHERE approvedByAdmin = 1 AND isOpen = 1").all();
    res.json(restaurants);
  });

  app.get("/api/restaurants/:id/menu", (req, res) => {
    const menu = db.prepare("SELECT * FROM food_items WHERE restaurantId = ?").all(req.params.id);
    res.json(menu);
  });

  // Order Routes
  app.post("/api/orders", authenticate, (req: any, res) => {
    const { restaurantId, items, totalAmount } = req.body;
    const settings: any = db.prepare("SELECT * FROM payment_settings WHERE id = 1").get();
    
    const commissionAmount = (totalAmount * settings.commissionPercent) / 100;
    const deliveryCharge = (totalAmount * settings.deliveryChargePercent) / 100;
    const taxAmount = (totalAmount * settings.taxPercent) / 100;
    const finalAmount = totalAmount + deliveryCharge + taxAmount;

    const result = db.prepare(`
      INSERT INTO orders (userId, restaurantId, items, totalAmount, deliveryCharge, taxAmount, commissionAmount, status, paymentStatus)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'placed', 'pending')
    `).run(req.user.id, restaurantId, JSON.stringify(items), finalAmount, deliveryCharge, taxAmount, commissionAmount);

    const orderId = result.lastInsertRowid;
    io.emit("new_order", { orderId, restaurantId });
    res.json({ orderId, finalAmount });
  });

  app.get("/api/orders/my", authenticate, (req: any, res) => {
    const orders = db.prepare("SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC").all(req.user.id);
    res.json(orders);
  });

  // Admin Routes
  app.get("/api/admin/settings", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const settings = db.prepare("SELECT * FROM payment_settings WHERE id = 1").get();
    res.json(settings);
  });

  app.put("/api/admin/settings", authenticate, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: "Forbidden" });
    const { gatewayName, publicKey, secretKey, commissionPercent, deliveryChargePercent, taxPercent, codEnabled } = req.body;
    db.prepare(`
      UPDATE payment_settings SET 
        gatewayName = ?, publicKey = ?, secretKey = ?, 
        commissionPercent = ?, deliveryChargePercent = ?, taxPercent = ?, 
        codEnabled = ?, updatedAt = CURRENT_TIMESTAMP
      WHERE id = 1
    `).run(gatewayName, publicKey, secretKey, commissionPercent, deliveryChargePercent, taxPercent, codEnabled ? 1 : 0);
    res.json({ success: true });
  });

  // Restaurant Management
  app.post("/api/restaurants", authenticate, (req: any, res) => {
    const { name, address, lat, lng } = req.body;
    const result = db.prepare("INSERT INTO restaurants (name, ownerId, address, lat, lng) VALUES (?, ?, ?, ?, ?)").run(
      name, req.user.id, address, lat, lng
    );
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/restaurant/my", authenticate, (req: any, res) => {
    const restaurant = db.prepare("SELECT * FROM restaurants WHERE ownerId = ?").get(req.user.id);
    res.json(restaurant);
  });

  app.get("/api/restaurant/orders", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const orders = db.prepare("SELECT * FROM orders WHERE restaurantId = ? ORDER BY createdAt DESC").all(restaurant.id);
    res.json(orders);
  });

  app.get("/api/restaurant/stats", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(totalAmount) as totalRevenue
      FROM orders 
      WHERE restaurantId = ?
    `).get(restaurant.id);
    res.json(stats);
  });

  app.post("/api/restaurant/menu", authenticate, (req: any, res) => {
    const { name, description, price, image, category } = req.body;
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    db.prepare("INSERT INTO food_items (restaurantId, name, description, price, image, category) VALUES (?, ?, ?, ?, ?, ?)").run(
      restaurant.id, name, description, price, image, category
    );
    res.json({ success: true });
  });

  // Delivery Routes
  app.get("/api/delivery/available", authenticate, (req: any, res) => {
    const orders = db.prepare("SELECT * FROM orders WHERE status = 'ready' AND deliveryBoyId IS NULL").all();
    res.json(orders);
  });

  app.post("/api/delivery/accept", authenticate, (req: any, res) => {
    const { orderId } = req.body;
    db.prepare("UPDATE orders SET deliveryBoyId = ?, status = 'picked' WHERE id = ?").run(req.user.id, orderId);
    io.emit("order_updated", { orderId, status: 'picked' });
    res.json({ success: true });
  });

  app.get("/api/delivery/my-active", authenticate, (req: any, res) => {
    const orders = db.prepare("SELECT * FROM orders WHERE deliveryBoyId = ? AND status IN ('picked', 'delivering')").all(req.user.id);
    res.json(orders);
  });

  // Kitchen Routes
  app.get("/api/kitchen/orders", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    const orders = db.prepare("SELECT * FROM orders WHERE restaurantId = ? AND status IN ('placed', 'accepted', 'cooking')").all(restaurant.id);
    res.json(orders);
  });

  app.put("/api/orders/:id/status", authenticate, (req: any, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    io.emit("order_updated", { orderId: req.params.id, status });
    res.json({ success: true });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    socket.on("join_room", (room) => {
      socket.join(room);
    });
    socket.on("update_order_status", ({ orderId, status, role }) => {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
      io.emit("order_updated", { orderId, status });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
