import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Starting server initialization...");

try {
  const testHash = bcrypt.hashSync("test", 10);
  const testMatch = bcrypt.compareSync("test", testHash);
  console.log("Bcrypt test passed:", testMatch);
} catch (err) {
  console.error("Bcrypt test failed:", err);
}

let db: any;
try {
  db = new Database("alif_layla.db");
  console.log("Database connected successfully");
} catch (err) {
  console.error("Failed to connect to database:", err);
  process.exit(1);
}

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT UNIQUE,
      phone TEXT,
      password TEXT,
      role TEXT,
      address TEXT,
      isOnline INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration: Add isOnline to users if it doesn't exist
  try {
    db.prepare("SELECT isOnline FROM users LIMIT 1").get();
  } catch (e) {
    console.log("Adding isOnline column to users table...");
    db.prepare("ALTER TABLE users ADD COLUMN isOnline INTEGER DEFAULT 1").run();
  }

  // Migration: Add riderLat and riderLng to orders if they don't exist
  try {
    db.prepare("SELECT riderLat FROM orders LIMIT 1").get();
  } catch (e) {
    console.log("Adding riderLat and riderLng columns to orders table...");
    db.prepare("ALTER TABLE orders ADD COLUMN riderLat REAL").run();
    db.prepare("ALTER TABLE orders ADD COLUMN riderLng REAL").run();
  }

  db.exec(`
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
      riderLat REAL,
      riderLng REAL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      amount REAL,
      status TEXT DEFAULT 'pending', -- pending, approved, rejected
      method TEXT,
      details TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER,
      role TEXT,
      title TEXT,
      message TEXT,
      type TEXT, -- order_update, new_order, payout, etc.
      isRead INTEGER DEFAULT 0,
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
  console.log("Database schema initialized");
} catch (err) {
  console.error("Database initialization failed:", err);
}

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

// Seed the user's email if not exists
const userEmail = "khanmohammadahmad@gmail.com";
const userExists = db.prepare("SELECT * FROM users WHERE email = ?").get(userEmail);
if (!userExists) {
  const hashedPassword = bcrypt.hashSync("password123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(
    "Ahmad Khan",
    userEmail,
    hashedPassword,
    "customer"
  );
  console.log(`Seeded user: ${userEmail} with password: password123`);
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

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Search API
  app.get("/api/search", (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.json({ restaurants: [], foodItems: [] });

    const restaurants = db.prepare("SELECT * FROM restaurants WHERE name LIKE ? AND approvedByAdmin = 1").all(`%${query}%`);
    const foodItems = db.prepare(`
      SELECT f.*, r.name as restaurantName 
      FROM food_items f 
      JOIN restaurants r ON f.restaurantId = r.id 
      WHERE f.name LIKE ? OR f.description LIKE ?
    `).all(`%${query}%`, `%${query}%`);

    res.json({ restaurants, foodItems });
  });

  // Profile API
  app.get("/api/profile", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, phone, role, address, isOnline, createdAt FROM users WHERE id = ?").get(req.user.id);
    res.json(user);
  });

  app.put("/api/profile", authenticate, (req: any, res) => {
    const { name, phone, address } = req.body;
    db.prepare("UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?").run(name, phone, address, req.user.id);
    const updatedUser = db.prepare("SELECT id, name, email, phone, role, address, isOnline, createdAt FROM users WHERE id = ?").get(req.user.id);
    res.json(updatedUser);
  });

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
    
    // Notify Restaurant
    const restaurant: any = db.prepare("SELECT ownerId, name FROM restaurants WHERE id = ?").get(restaurantId);
    if (restaurant) {
      sendNotification({
        userId: restaurant.ownerId,
        title: "New Order!",
        message: `You have a new order #${orderId} from Alif Layla`,
        type: "new_order"
      });
    }

    // Notify Admin
    sendNotification({
      role: "admin",
      title: "New Order Placed",
      message: `Order #${orderId} placed at ${restaurant?.name || 'Restaurant'}`,
      type: "new_order"
    });

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
    const restaurant: any = db.prepare("SELECT id, isOpen FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalOrders,
        SUM(totalAmount) as totalRevenue
      FROM orders 
      WHERE restaurantId = ?
    `).get(restaurant.id);
    res.json({ ...stats, isOpen: restaurant.isOpen });
  });

  app.get("/api/restaurant/menu", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    const menu = db.prepare("SELECT * FROM food_items WHERE restaurantId = ?").all(restaurant.id);
    res.json(menu);
  });

  app.post("/api/restaurant/menu", authenticate, (req: any, res) => {
    const { name, description, price, image, category } = req.body;
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    db.prepare("INSERT INTO food_items (restaurantId, name, description, price, image, category) VALUES (?, ?, ?, ?, ?, ?)").run(
      restaurant.id, name, description, price, image, category
    );
    res.json({ success: true });
  });

  app.put("/api/restaurant/menu/:id", authenticate, (req: any, res) => {
    const { name, description, price, image, category } = req.body;
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
    
    // Check if item belongs to restaurant
    const item = db.prepare("SELECT * FROM food_items WHERE id = ? AND restaurantId = ?").get(req.params.id, restaurant.id);
    if (!item) return res.status(403).json({ error: "Unauthorized" });

    db.prepare("UPDATE food_items SET name = ?, description = ?, price = ?, image = ?, category = ? WHERE id = ?").run(
      name, description, price, image, category, req.params.id
    );
    res.json({ success: true });
  });

  app.delete("/api/restaurant/menu/:id", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const item = db.prepare("SELECT * FROM food_items WHERE id = ? AND restaurantId = ?").get(req.params.id, restaurant.id);
    if (!item) return res.status(403).json({ error: "Unauthorized" });

    db.prepare("DELETE FROM food_items WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/restaurant/menu/:id/availability", authenticate, (req: any, res) => {
    const { isAvailable } = req.body;
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

    const item = db.prepare("SELECT * FROM food_items WHERE id = ? AND restaurantId = ?").get(req.params.id, restaurant.id);
    if (!item) return res.status(403).json({ error: "Unauthorized" });

    db.prepare("UPDATE food_items SET isAvailable = ? WHERE id = ?").run(isAvailable ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.patch("/api/restaurant/status", authenticate, (req: any, res) => {
    const { isOpen } = req.body;
    db.prepare("UPDATE restaurants SET isOpen = ? WHERE ownerId = ?").run(isOpen ? 1 : 0, req.user.id);
    res.json({ success: true });
  });

  app.patch("/api/delivery/status", authenticate, (req: any, res) => {
    const { isOnline } = req.body;
    db.prepare("UPDATE users SET isOnline = ? WHERE id = ?").run(isOnline ? 1 : 0, req.user.id);
    res.json({ success: true });
  });

  // Delivery Routes
  app.get("/api/delivery/available", authenticate, (req: any, res) => {
    const { backToHome } = req.query;
    
    if (backToHome === 'true') {
      const rider: any = db.prepare("SELECT address FROM users WHERE id = ?").get(req.user.id);
      // Extract the first part of the address (e.g., "Mumbai" or "Delhi") to simulate area-based filtering
      const riderArea = rider?.address?.split(',')?.pop()?.trim() || "";
      
      const orders = db.prepare(`
        SELECT o.* 
        FROM orders o 
        JOIN users u ON o.userId = u.id 
        WHERE o.status = 'ready' 
        AND o.deliveryBoyId IS NULL 
        AND (u.address LIKE ? OR u.address LIKE ?)
      `).all(`%${riderArea}%`, `%${rider?.address || ''}%`);
      
      return res.json(orders);
    }

    const orders = db.prepare("SELECT * FROM orders WHERE status = 'ready' AND deliveryBoyId IS NULL").all();
    res.json(orders);
  });

  app.post("/api/delivery/accept", authenticate, (req: any, res) => {
    const { orderId } = req.body;
    db.prepare("UPDATE orders SET deliveryBoyId = ?, status = 'picked' WHERE id = ?").run(req.user.id, orderId);
    io.emit("order_updated", { orderId, status: 'picked' });
    
    // Notify Customer
    const order: any = db.prepare("SELECT userId FROM orders WHERE id = ?").get(orderId);
    if (order) {
      sendNotification({
        userId: order.userId,
        title: "Order Picked Up",
        message: `A delivery partner has picked up your order #${orderId}`,
        type: "order_update"
      });
    }

    res.json({ success: true });
  });

  app.get("/api/delivery/my-active", authenticate, (req: any, res) => {
    const orders = db.prepare("SELECT * FROM orders WHERE deliveryBoyId = ? AND status IN ('picked', 'delivering')").all(req.user.id);
    res.json(orders);
  });

  app.get("/api/delivery/earnings", authenticate, (req: any, res) => {
    if (req.user.role !== 'delivery') return res.status(403).json({ error: "Forbidden" });
    const { date } = req.query;
    
    let statsQuery = `
      SELECT 
        COUNT(*) as totalDeliveries,
        SUM(deliveryCharge) as totalEarnings
      FROM orders 
      WHERE deliveryBoyId = ? AND status = 'delivered'
    `;
    
    let historyQuery = `
      SELECT * FROM orders 
      WHERE deliveryBoyId = ? AND status = 'delivered'
    `;

    const params: any[] = [req.user.id];

    if (date) {
      statsQuery += " AND date(createdAt) = date(?)";
      historyQuery += " AND date(createdAt) = date(?)";
      params.push(date);
    }

    historyQuery += " ORDER BY createdAt DESC";

    const stats = db.prepare(statsQuery).get(...params);
    const history = db.prepare(historyQuery).all(...params);

    res.json({ stats, history });
  });

  app.patch("/api/delivery/location", authenticate, (req: any, res) => {
    const { lat, lng } = req.body;
    if (req.user.role !== 'delivery') return res.status(403).json({ error: "Forbidden" });
    
    // Update location for all active orders of this rider
    db.prepare("UPDATE orders SET riderLat = ?, riderLng = ? WHERE deliveryBoyId = ? AND status IN ('picked', 'delivering')").run(lat, lng, req.user.id);
    
    // Notify customers tracking these orders
    const activeOrders = db.prepare("SELECT id FROM orders WHERE deliveryBoyId = ? AND status IN ('picked', 'delivering')").all(req.user.id);
    activeOrders.forEach((order: any) => {
      io.emit(`rider_location_${order.id}`, { lat, lng });
    });

    res.json({ success: true });
  });

  app.get("/api/orders/:id/rider-location", authenticate, (req: any, res) => {
    const order: any = db.prepare("SELECT riderLat, riderLng, deliveryBoyId FROM orders WHERE id = ?").get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ lat: order.riderLat, lng: order.riderLng });
  });

  // Kitchen Routes
  app.get("/api/kitchen/orders", authenticate, (req: any, res) => {
    const restaurant: any = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
    const orders = db.prepare("SELECT * FROM orders WHERE restaurantId = ? AND status IN ('placed', 'accepted', 'cooking')").all(restaurant.id);
    res.json(orders);
  });

  app.put("/api/orders/:id/status", authenticate, (req: any, res) => {
    const { status } = req.body;
    const orderId = req.params.id;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
    io.emit("order_updated", { orderId, status });
    
    const order: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
    if (order) {
      // Notify Customer
      sendNotification({
        userId: order.userId,
        title: "Order Update",
        message: `Your order #${orderId} is now ${status}`,
        type: "order_update"
      });

      // If Ready, notify Delivery Boys
      if (status === 'ready') {
        sendNotification({
          role: "delivery",
          title: "New Delivery Request",
          message: `A new order #${orderId} is ready for pickup`,
          type: "new_delivery"
        });
      }

      // If Delivered, notify Restaurant and Admin
      if (status === 'delivered') {
        const restaurant: any = db.prepare("SELECT ownerId FROM restaurants WHERE id = ?").get(order.restaurantId);
        if (restaurant) {
          sendNotification({
            userId: restaurant.ownerId,
            title: "Order Delivered",
            message: `Order #${orderId} has been successfully delivered`,
            type: "order_delivered"
          });
        }
      }
    }

    res.json({ success: true });
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);
    
    socket.on("authenticate", (token) => {
      try {
        const decoded: any = jwt.verify(token, process.env.JWT_SECRET || "secret");
        socket.join(`user_${decoded.id}`);
        socket.join(`role_${decoded.role}`);
        console.log(`Socket ${socket.id} authenticated as user_${decoded.id} and role_${decoded.role}`);
      } catch (err) {
        console.error("Socket authentication failed");
      }
    });

    socket.on("join_room", (room) => {
      socket.join(room);
    });
    
    socket.on("update_order_status", ({ orderId, status, role }) => {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, orderId);
      io.emit("order_updated", { orderId, status });
      
      // Trigger notification
      const order: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
      if (order) {
        sendNotification({
          userId: order.userId,
          title: "Order Update",
          message: `Your order #${orderId} is now ${status}`,
          type: "order_update"
        });
      }
    });
  });

  // Payout Routes
  app.get("/api/payouts", authenticate, (req: any, res) => {
    let balance = 0;
    if (req.user.role === 'delivery') {
      const earnings = db.prepare("SELECT SUM(deliveryCharge) as total FROM orders WHERE deliveryBoyId = ? AND status = 'delivered'").get(req.user.id);
      const paid = db.prepare("SELECT SUM(amount) as total FROM payouts WHERE userId = ? AND status = 'approved'").get(req.user.id);
      balance = (earnings.total || 0) - (paid.total || 0);
    } else if (req.user.role === 'restaurant') {
      const restaurant = db.prepare("SELECT id FROM restaurants WHERE ownerId = ?").get(req.user.id);
      if (restaurant) {
        const revenue = db.prepare("SELECT SUM(totalAmount) as total FROM orders WHERE restaurantId = ? AND status = 'delivered'").get(restaurant.id);
        const paid = db.prepare("SELECT SUM(amount) as total FROM payouts WHERE userId = ? AND status = 'approved'").get(req.user.id);
        // Assuming 10% commission
        balance = ((revenue.total || 0) * 0.9) - (paid.total || 0);
      }
    }

    const payouts = db.prepare("SELECT * FROM payouts WHERE userId = ? ORDER BY createdAt DESC").all(req.user.id);
    res.json({ balance, payouts });
  });

  app.post("/api/payouts/request", authenticate, (req: any, res) => {
    const { amount, method, details } = req.body;
    db.prepare("INSERT INTO payouts (userId, amount, method, details) VALUES (?, ?, ?, ?)").run(req.user.id, amount, method, details);
    res.json({ success: true });
  });

  // Notification Routes
  app.get("/api/notifications", authenticate, (req: any, res) => {
    const notifications = db.prepare("SELECT * FROM notifications WHERE userId = ? OR (role = ? AND userId IS NULL) ORDER BY createdAt DESC LIMIT 50").all(req.user.id, req.user.role);
    res.json(notifications);
  });

  app.patch("/api/notifications/read", authenticate, (req: any, res) => {
    db.prepare("UPDATE notifications SET isRead = 1 WHERE userId = ? OR (role = ? AND userId IS NULL)").run(req.user.id, req.user.role);
    res.json({ success: true });
  });

  const sendNotification = (data: { userId?: number, role?: string, title: string, message: string, type: string }) => {
    const info = db.prepare("INSERT INTO notifications (userId, role, title, message, type) VALUES (?, ?, ?, ?, ?)").run(
      data.userId || null,
      data.role || null,
      data.title,
      data.message,
      data.type
    );
    
    const notification = { id: info.lastInsertRowid, ...data, isRead: 0, createdAt: new Date().toISOString() };
    
    if (data.userId) {
      io.to(`user_${data.userId}`).emit("notification", notification);
    }
    if (data.role) {
      io.to(`role_${data.role}`).emit("notification", notification);
    }
    // Also emit to admin
    io.to("role_admin").emit("notification", notification);
  };

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Initializing Vite middleware...");
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
      console.log("Vite middleware initialized");
    } catch (err) {
      console.error("Failed to initialize Vite middleware:", err);
    }
  } else {
    console.log("Serving static files from dist...");
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
