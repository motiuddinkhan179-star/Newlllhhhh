import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, ShoppingBag, User, 
  ChefHat, Truck, LayoutDashboard, 
  Settings, LogOut, Plus, Minus, 
  CheckCircle, Clock, MapPin, Star,
  Utensils, ClipboardList, Wallet, BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Contexts ---
const AuthContext = createContext<any>(null);
const CartContext = createContext<any>(null);

// --- Mock Data / API Helpers ---
const API_URL = '';

// --- Components ---
const BottomNav = ({ role }: { role: string }) => {
  const location = useLocation();
  const navItems = {
    customer: [
      { icon: Home, label: 'Home', path: '/' },
      { icon: Search, label: 'Search', path: '/search' },
      { icon: ShoppingBag, label: 'Orders', path: '/orders' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    delivery: [
      { icon: ClipboardList, label: 'New', path: '/delivery/new' },
      { icon: Truck, label: 'Active', path: '/delivery/active' },
      { icon: Wallet, label: 'Earnings', path: '/delivery/earnings' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    restaurant: [
      { icon: LayoutDashboard, label: 'Dash', path: '/restaurant/dash' },
      { icon: ClipboardList, label: 'Orders', path: '/restaurant/orders' },
      { icon: Utensils, label: 'Menu', path: '/restaurant/menu' },
      { icon: User, label: 'Profile', path: '/profile' },
    ],
    kitchen: [
      { icon: Clock, label: 'Cooking', path: '/kitchen/cooking' },
      { icon: CheckCircle, label: 'Ready', path: '/kitchen/ready' },
      { icon: ShoppingBag, label: 'History', path: '/kitchen/history' },
    ],
  };

  const items = navItems[role as keyof typeof navItems] || [];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 flex justify-around items-center z-50 md:hidden">
      {items.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.path} 
            to={item.path}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-orange-500" : "text-gray-400"
            )}
          >
            <item.icon size={20} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

// --- Pages ---
import { useParams } from 'react-router-dom';

const Login = () => {
  const { login, signup } = useContext(AuthContext);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await signup({ name, email, password, role });
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-orange-600">Alif Layla</h1>
          <p className="text-gray-500 mt-2">{isLogin ? 'Welcome Back!' : 'Create Account'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  <option value="customer">Customer</option>
                  <option value="restaurant">Restaurant Owner</option>
                  <option value="delivery">Delivery Partner</option>
                  <option value="kitchen">Kitchen Staff</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="email@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all active:scale-95 mt-4"
          >
            {isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? "Don't have an account?" : "Already have an account?"} 
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-orange-500 font-bold ml-1"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

// --- Customer App ---
const RestaurantMenu = () => {
  const { id } = useParams();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useContext(CartContext);

  useEffect(() => {
    fetch(`/api/restaurants/${id}/menu`)
      .then(res => res.json())
      .then(data => {
        setMenu(data);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <Link to="/" className="text-orange-500 flex items-center gap-1 mb-6">
        <Minus size={16} /> Back to Restaurants
      </Link>
      <h2 className="text-2xl font-bold mb-6">Menu</h2>
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : (
          menu.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold">{item.name}</h4>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-orange-600 font-bold mt-1">₹{item.price}</p>
              </div>
              <button 
                onClick={() => addToCart({ ...item, restaurantId: id })}
                className="bg-orange-100 text-orange-600 p-2 rounded-xl hover:bg-orange-200 transition-colors"
              >
                <Plus size={20} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CartPage = () => {
  const { cart, removeFromCart, clearCart } = useContext(CartContext);
  const navigate = useNavigate();

  const total = cart.reduce((sum: number, item: any) => sum + item.price, 0);

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        restaurantId: cart[0].restaurantId,
        items: cart,
        totalAmount: total
      })
    });
    if (res.ok) {
      clearCart();
      navigate('/orders');
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="text-center py-12">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Your cart is empty</p>
          <Link to="/" className="text-orange-500 font-bold mt-4 block">Browse Food</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map((item: any, idx: number) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                <div>
                  <h4 className="font-bold">{item.name}</h4>
                  <p className="text-orange-600 font-bold">₹{item.price}</p>
                </div>
                <button onClick={() => removeFromCart(idx)} className="text-red-500">
                  <Minus size={20} />
                </button>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>₹{total}</span>
            </div>
            <div className="flex justify-between mb-4 font-bold text-lg">
              <span>Total</span>
              <span className="text-orange-600">₹{total}</span>
            </div>
            <button 
              onClick={placeOrder}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-orange-200"
            >
              Checkout & Pay
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const CustomerHome = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/restaurants')
      .then(res => res.json())
      .then(data => {
        setRestaurants(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hey, Foodie!</h2>
          <p className="text-gray-500 flex items-center gap-1">
            <MapPin size={14} /> Delivering to Home
          </p>
        </div>
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
          <User size={20} />
        </div>
      </header>

      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search for restaurants or dishes"
          className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      <section>
        <h3 className="text-xl font-bold mb-4">Popular Restaurants</h3>
        <div className="space-y-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-48 bg-gray-100 rounded-3xl animate-pulse" />)
          ) : (
            restaurants.map((res: any) => (
              <Link to={`/restaurant/${res.id}`} key={res.id} className="block group">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group-hover:shadow-md transition-all">
                  <img 
                    src={`https://picsum.photos/seed/${res.id}/800/400`} 
                    alt={res.name}
                    className="w-full h-48 object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-lg font-bold text-gray-900">{res.name}</h4>
                      <div className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Star size={12} fill="currentColor" /> {res.rating || '4.5'}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500">{res.address}</p>
                    <div className="mt-3 flex items-center gap-4 text-xs text-gray-400 font-medium">
                      <span className="flex items-center gap-1"><Clock size={12} /> 30-40 min</span>
                      <span className="flex items-center gap-1"><Truck size={12} /> Free Delivery</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
};

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders/my', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">My Orders</h2>
      <div className="space-y-4">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No orders yet</p>
          </div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  order.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                )}>
                  {order.status}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="font-bold text-orange-600">₹{order.totalAmount}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Admin Panel ---
const AdminDashboard = () => {
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/settings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(setSettings);
  }, []);

  const handleSave = async () => {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(settings)
    });
    if (res.ok) {
      alert('Settings saved successfully!');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setSettings((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  if (!settings) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Control Panel</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">Total Revenue</p>
          <h3 className="text-2xl font-bold">₹1,24,500</h3>
          <div className="mt-4 text-green-500 text-xs font-bold">+12% from last month</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">Total Orders</p>
          <h3 className="text-2xl font-bold">1,450</h3>
          <div className="mt-4 text-blue-500 text-xs font-bold">85 active now</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm mb-1">Active Restaurants</p>
          <h3 className="text-2xl font-bold">42</h3>
          <div className="mt-4 text-orange-500 text-xs font-bold">5 pending approval</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Settings size={20} /> Payment Gateway Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active Gateway</label>
              <select 
                name="gatewayName"
                value={settings.gatewayName}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="stripe">Stripe</option>
                <option value="razorpay">Razorpay</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Public Key</label>
              <input 
                type="text" 
                name="publicKey"
                value={settings.publicKey} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
              <input 
                type="password" 
                name="secretKey"
                value={settings.secretKey} 
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform Comm %</label>
                <input 
                  type="number" 
                  name="commissionPercent"
                  value={settings.commissionPercent} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tax %</label>
                <input 
                  type="number" 
                  name="taxPercent"
                  value={settings.taxPercent} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery %</label>
                <input 
                  type="number" 
                  name="deliveryChargePercent"
                  value={settings.deliveryChargePercent} 
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200" 
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div>
                <p className="font-bold text-sm">Cash on Delivery</p>
                <p className="text-xs text-gray-500">Enable/Disable COD payments</p>
              </div>
              <div 
                onClick={() => setSettings((prev: any) => ({ ...prev, codEnabled: prev.codEnabled ? 0 : 1 }))}
                className={cn(
                  "w-12 h-6 rounded-full relative cursor-pointer transition-colors",
                  settings.codEnabled ? "bg-orange-500" : "bg-gray-300"
                )}
              >
                <motion.div 
                  animate={{ x: settings.codEnabled ? 24 : 4 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
                />
              </div>
            </div>
            <button 
              onClick={handleSave}
              className="w-full bg-orange-500 text-white py-4 rounded-xl font-bold mt-4"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Restaurant App ---
const RestaurantDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState<any>({ totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [ordersRes, statsRes] = await Promise.all([
        fetch('/api/restaurant/orders', { headers }),
        fetch('/api/restaurant/stats', { headers })
      ]);
      const ordersData = await ordersRes.json();
      const statsData = await statsRes.json();
      setOrders(ordersData);
      setStats(statsData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const updateStatus = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    // Refresh
    const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
    const res = await fetch('/api/restaurant/orders', { headers });
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Restaurant Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
          <p className="text-orange-600 text-xs font-bold uppercase">Total Orders</p>
          <h3 className="text-2xl font-bold">{stats.totalOrders || 0}</h3>
        </div>
        <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
          <p className="text-green-600 text-xs font-bold uppercase">Revenue</p>
          <h3 className="text-2xl font-bold">₹{stats.totalRevenue || 0}</h3>
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4">Recent Orders</h3>
      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">Order #{order.id}</p>
                <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
              <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-lg text-[10px] font-bold uppercase">
                {order.status}
              </span>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={() => updateStatus(order.id, 'accepted')}
                className="flex-1 bg-orange-500 text-white py-2 rounded-xl text-sm font-bold"
              >
                Accept
              </button>
              <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-bold">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Delivery App ---
const DeliveryApp = () => {
  const [availableOrders, setAvailableOrders] = useState([]);

  useEffect(() => {
    fetch('/api/delivery/available', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(setAvailableOrders);
  }, []);

  const acceptOrder = async (orderId: number) => {
    await fetch('/api/delivery/accept', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ orderId })
    });
    // Refresh available orders
    const res = await fetch('/api/delivery/available', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setAvailableOrders(data);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Delivery Partner</h2>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Today's Earnings</h3>
          <span className="text-green-600 font-bold">₹850</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-green-500 w-3/4" />
        </div>
      </div>

      <h3 className="text-lg font-bold mb-4">Available Tasks</h3>
      <div className="space-y-4">
        {availableOrders.map((order: any) => (
          <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
                  <Utensils size={20} />
                </div>
                <div>
                  <p className="font-bold">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">Pick up from: Spice Garden</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-orange-600 font-bold">₹45</p>
                <p className="text-[10px] text-gray-400">Earn</p>
              </div>
            </div>
            <button 
              onClick={() => acceptOrder(order.id)}
              className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold"
            >
              Accept Delivery
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Kitchen App ---
const KitchenApp = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/kitchen/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(setOrders);
  }, []);

  const markReady = async (orderId: number) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status: 'ready' })
    });
    // Refresh kitchen orders
    const res = await fetch('/api/kitchen/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Kitchen Display</h2>
      <div className="grid grid-cols-1 gap-4">
        {orders.map((order: any) => (
          <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border-2 border-orange-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">Order #{order.id}</h3>
                <p className="text-sm text-gray-500">Placed {new Date(order.createdAt).toLocaleTimeString()}</p>
              </div>
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                {order.status.toUpperCase()}
              </div>
            </div>
            <div className="space-y-2 mb-6">
              {/* In a real app, we'd parse order.items */}
              <div className="flex justify-between border-b border-gray-50 pb-2">
                <span>Items in Order</span>
                <span className="font-bold">Total: ₹{order.totalAmount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => markReady(order.id)}
                className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-100"
              >
                Mark Ready
              </button>
              <button className="bg-gray-100 text-gray-400 p-4 rounded-2xl">
                <Clock size={24} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
    }
  };

  const signup = async (userData: any) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return res.json();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const addToCart = (item: any) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (idx: number) => {
    const newCart = [...cart];
    newCart.splice(idx, 1);
    setCart(newCart);
  };

  const clearCart = () => setCart([]);

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
        <BrowserRouter>
          <div className="min-h-screen bg-gray-50">
            {!user ? (
              <Routes>
                <Route path="*" element={<Login />} />
              </Routes>
            ) : (
              <>
                <Routes>
                  {/* Customer Routes */}
                  {user.role === 'customer' && (
                    <>
                      <Route path="/" element={<CustomerHome />} />
                      <Route path="/restaurant/:id" element={<RestaurantMenu />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/search" element={<div className="p-8">Search Page</div>} />
                      <Route path="/orders" element={<CustomerOrders />} />
                      <Route path="/profile" element={<div className="p-8">Profile <button onClick={logout} className="text-red-500 font-bold">Logout</button></div>} />
                    </>
                  )}

                {/* Delivery Routes */}
                {user.role === 'delivery' && (
                  <>
                    <Route path="/" element={<Navigate to="/delivery/new" />} />
                    <Route path="/delivery/new" element={<DeliveryApp />} />
                    <Route path="/delivery/active" element={<div className="p-8">Active Deliveries</div>} />
                    <Route path="/delivery/earnings" element={<div className="p-8">Earnings History</div>} />
                    <Route path="/profile" element={<div className="p-8">Profile <button onClick={logout} className="text-red-500 font-bold">Logout</button></div>} />
                  </>
                )}

                {/* Restaurant Routes */}
                {user.role === 'restaurant' && (
                  <>
                    <Route path="/" element={<Navigate to="/restaurant/dash" />} />
                    <Route path="/restaurant/dash" element={<RestaurantDashboard />} />
                    <Route path="/restaurant/orders" element={<div className="p-8">All Orders</div>} />
                    <Route path="/restaurant/menu" element={<div className="p-8">Menu Management</div>} />
                    <Route path="/profile" element={<div className="p-8">Profile <button onClick={logout} className="text-red-500 font-bold">Logout</button></div>} />
                  </>
                )}

                {/* Kitchen Routes */}
                {user.role === 'kitchen' && (
                  <>
                    <Route path="/" element={<Navigate to="/kitchen/cooking" />} />
                    <Route path="/kitchen/cooking" element={<KitchenApp />} />
                    <Route path="/kitchen/ready" element={<div className="p-8">Ready Orders</div>} />
                    <Route path="/kitchen/history" element={<div className="p-8">Kitchen History</div>} />
                  </>
                )}

                {/* Admin Routes */}
                {user.role === 'admin' && (
                  <Route path="*" element={<AdminDashboard />} />
                )}

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
              {user.role !== 'admin' && <BottomNav role={user.role} />}
            </>
          )}
        </div>
      </BrowserRouter>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}
