import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, Search, ShoppingBag, User, 
  ChefHat, Truck, LayoutDashboard, 
  Settings, LogOut, Plus, Minus, 
  CheckCircle, Clock, MapPin, Star,
  Utensils, ClipboardList, Wallet, BarChart3,
  Percent, SlidersHorizontal, ChevronDown,
  Bell, CreditCard, HelpCircle, ChevronRight, Camera,
  Phone, ChevronLeft, Calendar, MessageSquare, Headphones, Banknote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { io } from 'socket.io-client';

// --- Utility ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Contexts ---
const AuthContext = createContext<any>(null);
const CartContext = createContext<any>(null);
const NotificationContext = createContext<any>(null);

const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(AuthContext);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState<any>(null);

  useEffect(() => {
    if (!user) return;

    const socket = io();
    const token = localStorage.getItem('token');
    socket.emit('authenticate', token);

    const fetchNotifications = async () => {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    };

    fetchNotifications();

    socket.on('notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setActiveToast(notification);
      
      // Browser notification
      if (Notification.permission === "granted") {
        new Notification(notification.title, { body: notification.message });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const markAsRead = async () => {
    const token = localStorage.getItem('token');
    await fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: 1 })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, activeToast, setActiveToast }}>
      {children}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-4 right-4 z-[100] bg-white border border-gray-100 shadow-2xl rounded-2xl p-4 flex items-center gap-4 max-w-md mx-auto"
          >
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center shrink-0">
              <Bell size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{activeToast.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{activeToast.message}</p>
            </div>
            <button 
              onClick={() => setActiveToast(null)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <Plus className="rotate-45" size={20} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

// --- Mock Data / API Helpers ---
const API_URL = '';

// --- Components ---
const BottomNav = ({ role }: { role: string }) => {
  const location = useLocation();
  const navItems = {
    customer: [
      { icon: Utensils, label: 'Restaurants', path: '/' },
      { icon: Search, label: 'Search', path: '/search' },
      { icon: User, label: 'My Profile', path: '/profile' },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 flex justify-around items-center z-50">
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
            <item.icon size={24} />
            <span className="text-[11px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const FloatingCart = () => {
  const { cart } = useContext(CartContext);
  const navigate = useNavigate();
  
  if (cart.length === 0) return null;

  const total = cart.reduce((acc: number, item: any) => acc + item.price, 0);

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40">
      <div className="bg-blue-900 text-white p-4 rounded-2xl flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-sm font-bold">{cart.length} Item(s) | ₹{total}</p>
            <p className="text-[10px] opacity-70">Pick up & Drop</p>
          </div>
        </div>
        <button 
          onClick={() => navigate('/cart')}
          className="bg-white text-blue-900 px-6 py-2 rounded-xl font-bold text-sm"
        >
          Checkout
        </button>
      </div>
    </div>
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [serverStatus, setServerStatus] = useState('checking');

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.ok ? setServerStatus('online') : setServerStatus('offline'))
      .catch(() => setServerStatus('offline'));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (isLogin) {
        const result = await login(email, password);
        if (result?.error) {
          setError(result.error);
        }
      } else {
        const result = await signup({ name, email, password, role });
        if (result.error) {
          setError(result.error);
        } else {
          setMessage('Signup successful! Please login.');
          setIsLogin(true);
        }
      }
    } catch (err: any) {
      setError('Something went wrong. Please try again.');
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
          <div className="mt-2 flex items-center justify-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              serverStatus === 'online' ? "bg-green-500" : serverStatus === 'offline' ? "bg-red-500" : "bg-gray-300 animate-pulse"
            )} />
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
              Server {serverStatus}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
            {message}
          </div>
        )}

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

  const banners = [
    { id: 1, image: 'https://picsum.photos/seed/banner1/800/400', title: 'Bhukkad Cafe & Chinese', price: '₹110' },
    { id: 2, image: 'https://picsum.photos/seed/banner2/800/400', title: 'Special Ramadan Offer', price: '₹129' },
  ];

  const offers = [
    { id: 1, title: 'Pickup & Drop', subtitle: 'Vegetables & Fruits', image: 'https://picsum.photos/seed/offer1/200/200', color: 'bg-blue-50' },
    { id: 2, title: 'Ramadan Special', subtitle: 'Ramadan Kareem', image: 'https://picsum.photos/seed/offer2/200/200', color: 'bg-green-50' },
    { id: 3, title: 'Bk Snacks', subtitle: 'Chicken Samosa', image: 'https://picsum.photos/seed/offer3/200/200', color: 'bg-orange-50' },
  ];

  const filterOptions = ['Filter', 'Sort by', 'Cuisines', 'Pure Veg', 'Rating 4.0+'];

  useEffect(() => {
    fetch('/api/restaurants')
      .then(res => res.json())
      .then(data => {
        setRestaurants(data);
        setLoading(false);
      });
  }, []);

  const filteredRestaurants = restaurants.filter((res: any) => 
    res.name.toLowerCase().includes(search.toLowerCase()) ||
    res.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="pb-32 pt-4 px-0 max-w-2xl mx-auto bg-white min-h-screen">
      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search for restaurants or dishes"
            className="w-full pl-4 pr-12 py-3.5 bg-white rounded-xl border border-gray-200 shadow-sm focus:ring-1 focus:ring-orange-500 outline-none text-sm"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </div>

      {/* Banner Slider */}
      <div className="flex overflow-x-auto gap-4 px-4 mb-8 no-scrollbar snap-x">
        {banners.map(banner => (
          <div key={banner.id} className="min-w-[85%] snap-center">
            <div className="relative rounded-2xl overflow-hidden aspect-[2/1] shadow-sm">
              <img src={banner.image} alt={banner.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                <h4 className="text-white font-bold text-lg leading-tight">{banner.title}</h4>
                <p className="text-orange-400 font-bold">Starts at {banner.price}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Offers Section */}
      <div className="px-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1 bg-orange-100 rounded-full text-orange-600">
            <Percent size={14} />
          </div>
          <h3 className="text-lg font-bold text-gray-800">Offers near by you</h3>
        </div>
        <div className="flex overflow-x-auto gap-4 no-scrollbar">
          {offers.map(offer => (
            <div key={offer.id} className={cn("min-w-[140px] p-3 rounded-2xl border border-gray-100 flex flex-col gap-2", offer.color)}>
              <img src={offer.image} className="w-full aspect-square rounded-xl object-cover" referrerPolicy="no-referrer" />
              <div>
                <p className="text-[11px] font-bold text-gray-900 leading-tight">{offer.title}</p>
                <p className="text-[9px] text-gray-500">{offer.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto gap-2 px-4 mb-6 no-scrollbar">
        {filterOptions.map(opt => (
          <button key={opt} className="whitespace-nowrap px-4 py-2 rounded-full border border-gray-200 text-xs font-medium text-gray-600 flex items-center gap-1 hover:bg-gray-50">
            {opt} {opt === 'Filter' && <SlidersHorizontal size={12} />}
            {(opt === 'Sort by' || opt === 'Cuisines') && <ChevronDown size={12} />}
          </button>
        ))}
      </div>

      {/* Restaurant List */}
      <div className="px-4">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          {loading ? 'Finding nearby restaurants...' : `${filteredRestaurants.length} Restaurants near you`}
        </h3>
        
        <div className="space-y-6">
          {loading ? (
            [1,2,3].map(i => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="w-20 h-20 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2 py-2">
                  <div className="h-4 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))
          ) : filteredRestaurants.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No restaurants found matching your search.
            </div>
          ) : (
            filteredRestaurants.map((res: any) => (
              <Link to={`/restaurant/${res.id}`} key={res.id} className="flex gap-4 group">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-100 shadow-sm">
                    <img 
                      src={`https://picsum.photos/seed/${res.id}/200/200`} 
                      alt={res.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full border border-gray-100 flex items-center justify-center">
                    <div className={cn("w-3 h-3 rounded-sm border", res.id % 2 === 0 ? "border-green-600" : "border-red-600")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full m-auto mt-[2px]", res.id % 2 === 0 ? "bg-green-600" : "bg-red-600")} />
                    </div>
                  </div>
                </div>
                <div className="flex-1 border-b border-gray-50 pb-6">
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-orange-600 transition-colors">{res.name}</h4>
                    <div className="flex items-center gap-1 text-green-700 font-bold text-xs">
                      <Star size={12} fill="currentColor" /> {res.rating || '4.5'}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">Breakfast, Veg Items, Etc.</p>
                  <p className="text-xs text-gray-400 mt-2 flex items-center gap-3">
                    <span className="flex items-center gap-1"><Clock size={12} /> 30-40 min</span>
                    <span className="flex items-center gap-1"><Truck size={12} /> Free Delivery</span>
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const OrderTracking = ({ orderId, onClose }: { orderId: number, onClose: () => void }) => {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    fetch(`/api/orders/${orderId}/rider-location`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      if (data.lat && data.lng) setLocation(data);
      setLoading(false);
    });

    // Listen for live updates
    const socket = io();
    socket.on(`rider_location_${orderId}`, (newLoc) => {
      setLocation(newLoc);
    });

    return () => {
      socket.off(`rider_location_${orderId}`);
      socket.disconnect();
    };
  }, [orderId]);

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-xl font-bold">Track Order #{orderId}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-gray-400 uppercase">Live</span>
        </div>
      </div>

      <div className="flex-1 relative bg-gray-50">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
          </div>
        ) : location ? (
          <iframe 
            width="100%" 
            height="100%" 
            frameBorder="0" 
            style={{ border: 0 }}
            src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=16&output=embed`}
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 mb-4">
              <MapPin size={40} />
            </div>
            <h3 className="text-lg font-bold">Waiting for Rider</h3>
            <p className="text-sm text-gray-500 mt-2">The rider hasn't shared their location yet. They might still be at the restaurant.</p>
          </div>
        )}
      </div>

      <div className="p-6 bg-white rounded-t-[40px] shadow-2xl border-t border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400 overflow-hidden">
              <img src="https://picsum.photos/seed/rider/100/100" alt="Rider" referrerPolicy="no-referrer" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase">Your Rider</p>
              <p className="font-bold text-lg">Rahul Sharma</p>
            </div>
          </div>
          <button className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-100">
            <Phone size={20} />
          </button>
        </div>
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-2xl text-orange-700">
          <Clock size={20} />
          <p className="text-sm font-bold">Estimated arrival: 12-15 mins</p>
        </div>
      </div>
    </div>
  );
};

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackingOrder, setTrackingOrder] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/orders/my', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    })
    .catch(() => {
      setOrders([]);
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
              
              {['picked', 'delivering'].includes(order.status) && (
                <button 
                  onClick={() => setTrackingOrder(order.id)}
                  className="mt-4 w-full py-3 bg-orange-50 text-orange-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  Track Live Location
                </button>
              )}

              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-between items-center">
                <p className="text-gray-500 text-sm">Total Amount</p>
                <p className="font-bold text-orange-600">₹{order.totalAmount}</p>
              </div>
            </div>
          ))
        )}
      </div>

      {trackingOrder && (
        <OrderTracking 
          orderId={trackingOrder} 
          onClose={() => setTrackingOrder(null)} 
        />
      )}
    </div>
  );
};

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>({ restaurants: [], foodItems: [] });
  const [loading, setLoading] = useState(false);

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults({ restaurants: [], foodItems: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${q}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Search</h2>
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search for food or restaurants"
          className="w-full pl-12 pr-4 py-4 bg-gray-100 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
        />
      </div>

      {loading && <div className="text-center py-8 text-gray-400">Searching...</div>}

      {!loading && query.length >= 2 && results.restaurants.length === 0 && results.foodItems.length === 0 && (
        <div className="text-center py-8 text-gray-400">No results found for "{query}"</div>
      )}

      <div className="space-y-8">
        {results.restaurants.length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-4">Restaurants</h3>
            <div className="space-y-4">
              {results.restaurants.map((res: any) => (
                <Link to={`/restaurant/${res.id}`} key={res.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                  <img src={`https://picsum.photos/seed/${res.id}/100/100`} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div>
                    <h4 className="font-bold">{res.name}</h4>
                    <p className="text-xs text-gray-500">{res.address}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {results.foodItems.length > 0 && (
          <section>
            <h3 className="text-lg font-bold mb-4">Dishes</h3>
            <div className="space-y-4">
              {results.foodItems.map((item: any) => (
                <Link to={`/restaurant/${item.restaurantId}`} key={item.id} className="flex items-center gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                  <img src={`https://picsum.photos/seed/food-${item.id}/100/100`} className="w-16 h-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                  <div className="flex-1">
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-xs text-gray-500">from {item.restaurantName}</p>
                    <p className="text-orange-600 font-bold text-sm">₹{item.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user, logout } = useContext(AuthContext);
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setProfile(data);
      setFormData({ name: data.name, phone: data.phone || '', address: data.address || '' });
      setLoading(false);
    });
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });
    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setIsEditing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  );

  const menuItems = [
    { icon: ShoppingBag, label: 'My Orders', path: '/orders', color: 'text-blue-500', bg: 'bg-blue-50' },
    { icon: CreditCard, label: 'Payment Methods', path: '#', color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Bell, label: 'Notifications', path: '#', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: HelpCircle, label: 'Help Center', path: '#', color: 'text-green-500', bg: 'bg-green-50' },
    { icon: Settings, label: 'Settings', path: '#', color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  return (
    <div className="pb-32 bg-gray-50 min-h-screen">
      {/* Header / Cover */}
      <div className="h-48 bg-orange-500 relative">
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0">
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-full p-1 shadow-xl">
              <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center text-orange-600 text-3xl md:text-4xl font-bold border-4 border-white">
                {profile.name[0]}
              </div>
            </div>
            <button className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow-md border border-gray-100 text-gray-600 hover:text-orange-500 transition-colors">
              <Camera size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-16">
        {/* Profile Info */}
        <div className="text-center md:text-left mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
              <p className="text-gray-500">{profile.email}</p>
              <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-bold uppercase rounded tracking-wider">
                  {profile.role}
                </span>
                <span className="text-xs text-gray-400">• Member since {new Date(profile.createdAt).getFullYear()}</span>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => setIsEditing(true)}
                className="bg-white border border-gray-200 text-gray-700 px-6 py-2 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold mb-6">Edit Profile Details</h3>
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                      placeholder="Enter your name"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="text" 
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                      placeholder="Enter phone number"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-4 text-gray-400" size={18} />
                    <textarea 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none text-sm h-24 resize-none"
                      placeholder="Enter delivery address"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-orange-500 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-orange-200">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsEditing(false)} 
                    className="flex-1 bg-gray-100 text-gray-600 py-3.5 rounded-xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Quick Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                    <p className="text-sm font-medium text-gray-700">{profile.phone || 'Not added'}</p>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
                    <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Default Address</p>
                    <p className="text-sm font-medium text-gray-700 truncate">{profile.address || 'Not added'}</p>
                  </div>
                </div>
              </div>

              {/* Menu List */}
              <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
                {menuItems.map((item, idx) => (
                  <Link 
                    key={idx} 
                    to={item.path}
                    className={cn(
                      "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors",
                      idx !== menuItems.length - 1 && "border-b border-gray-50"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                        <item.icon size={20} />
                      </div>
                      <span className="font-bold text-gray-700 text-sm">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                  </Link>
                ))}
              </div>

              {/* Logout Button */}
              <button 
                onClick={logout}
                className="w-full bg-white border border-red-100 text-red-500 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
              >
                <LogOut size={18} /> Logout from Account
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Admin Panel ---
const AdminDashboard = () => {
  const { logout } = useContext(AuthContext);
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Control Panel</h1>
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-colors font-medium shadow-sm"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
      
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
  const { logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState<any>({ totalOrders: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
        const [ordersRes, statsRes] = await Promise.all([
          fetch('/api/restaurant/orders', { headers }),
          fetch('/api/restaurant/stats', { headers })
        ]);
        const ordersData = await ordersRes.json();
        const statsData = await statsRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setStats(statsData || { totalOrders: 0, totalRevenue: 0 });
      } catch (err) {
        setOrders([]);
      } finally {
        setLoading(false);
      }
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

  const toggleStatus = async () => {
    const newStatus = !stats.isOpen;
    await fetch('/api/restaurant/status', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isOpen: newStatus })
    });
    setStats({ ...stats, isOpen: newStatus });
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold">Restaurant Dashboard</h2>
          <p className="text-xs text-gray-500">Manage your orders and business</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {stats.isOpen ? 'Accepting Orders' : 'Closed'}
            </p>
            <div 
              onClick={toggleStatus}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer transition-colors ml-auto mt-1",
                stats.isOpen ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <motion.div 
                animate={{ x: stats.isOpen ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </div>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>
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

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/restaurant/payout" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Banknote size={20} />
          </div>
          <span className="text-sm font-bold">Payouts</span>
        </Link>
        <Link to="/restaurant/contact" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <Headphones size={20} />
          </div>
          <span className="text-sm font-bold">Support</span>
        </Link>
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

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/restaurant/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.json())
    .then(data => {
      setOrders(Array.isArray(data) ? data : []);
      setLoading(false);
    });
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
    const res = await fetch('/api/restaurant/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">All Orders</h2>
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No orders found</div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg">Order #{order.id}</p>
                  <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  order.status === 'delivered' ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"
                )}>
                  {order.status}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                {JSON.parse(order.items).map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity || 1}</span>
                    <span className="font-medium">₹{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-50 pt-4 flex justify-between items-center mb-4">
                <span className="text-gray-500 text-sm">Total Amount</span>
                <span className="font-bold text-orange-600 text-lg">₹{order.totalAmount}</span>
              </div>

              <div className="flex gap-2">
                {order.status === 'placed' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'accepted')}
                    className="flex-1 bg-orange-500 text-white py-2.5 rounded-xl font-bold text-sm"
                  >
                    Accept Order
                  </button>
                )}
                {order.status === 'accepted' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'cooking')}
                    className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-bold text-sm"
                  >
                    Start Cooking
                  </button>
                )}
                {order.status === 'cooking' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'ready')}
                    className="flex-1 bg-green-500 text-white py-2.5 rounded-xl font-bold text-sm"
                  >
                    Mark Ready
                  </button>
                )}
                <button className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold text-sm">
                  Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const RestaurantMenuManager = () => {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', price: '', category: '', image: ''
  });

  const fetchMenu = async () => {
    const res = await fetch('/api/restaurant/menu', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setMenu(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingItem ? `/api/restaurant/menu/${editingItem.id}` : '/api/restaurant/menu';
    const method = editingItem ? 'PUT' : 'POST';
    
    const res = await fetch(url, {
      method,
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsAdding(false);
      setEditingItem(null);
      setFormData({ name: '', description: '', price: '', category: '', image: '' });
      fetchMenu();
    }
  };

  const toggleAvailability = async (id: number, current: boolean) => {
    await fetch(`/api/restaurant/menu/${id}/availability`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isAvailable: !current })
    });
    fetchMenu();
  };

  const deleteItem = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await fetch(`/api/restaurant/menu/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    fetchMenu();
  };

  return (
    <div className="pb-24 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Menu Management</h2>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 text-white p-2 rounded-full shadow-lg"
        >
          <Plus size={24} />
        </button>
      </div>

      {(isAdding || editingItem) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-bold mb-4">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input 
                type="text" placeholder="Item Name" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                required
              />
              <textarea 
                placeholder="Description" 
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none h-20"
              />
              <div className="flex gap-4">
                <input 
                  type="number" placeholder="Price" 
                  value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  className="flex-1 p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
                <input 
                  type="text" placeholder="Category" 
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="flex-1 p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                  required
                />
              </div>
              <input 
                type="text" placeholder="Image URL (optional)" 
                value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <div className="flex gap-3 pt-2">
                <button type="submit" className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold">
                  {editingItem ? 'Update' : 'Add Item'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setEditingItem(null); }}
                  className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : menu.length === 0 ? (
          <div className="text-center py-12 text-gray-400">Your menu is empty</div>
        ) : (
          menu.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4">
              <img 
                src={item.image || `https://picsum.photos/seed/${item.id}/200/200`} 
                className="w-20 h-20 rounded-xl object-cover" 
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold">{item.name}</h4>
                    <p className="text-xs text-gray-500">{item.category}</p>
                  </div>
                  <p className="text-orange-600 font-bold">₹{item.price}</p>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        setEditingItem(item);
                        setFormData({
                          name: item.name,
                          description: item.description,
                          price: item.price.toString(),
                          category: item.category,
                          image: item.image || ''
                        });
                      }}
                      className="text-blue-500 text-xs font-bold"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteItem(item.id)}
                      className="text-red-500 text-xs font-bold"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                      {item.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                    <div 
                      onClick={() => toggleAvailability(item.id, item.isAvailable)}
                      className={cn(
                        "w-8 h-4 rounded-full relative cursor-pointer transition-colors",
                        item.isAvailable ? "bg-green-500" : "bg-gray-300"
                      )}
                    >
                      <div className={cn(
                        "absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all",
                        item.isAvailable ? "left-4.5" : "left-0.5"
                      )} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// --- Delivery App ---
const DeliveryApp = () => {
  const { logout } = useContext(AuthContext);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [earnings, setEarnings] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isBackToHome, setIsBackToHome] = useState(false);

  const fetchAvailable = async () => {
    const res = await fetch(`/api/delivery/available?backToHome=${isBackToHome}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setAvailableOrders(Array.isArray(data) ? data : []);
    
    // Fetch profile for online status
    const profileRes = await fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const profileData = await profileRes.json();
    setIsOnline(!!profileData.isOnline);

    // Fetch earnings for today
    const earnRes = await fetch('/api/delivery/earnings', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const earnData = await earnRes.json();
    setEarnings(earnData.stats.totalEarnings || 0);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchAvailable();
  }, [isBackToHome]);

  const acceptOrder = async (orderId: number) => {
    await fetch('/api/delivery/accept', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ orderId })
    });
    fetchAvailable();
  };

  const toggleOnline = async () => {
    const newStatus = !isOnline;
    await fetch('/api/delivery/status', {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isOnline: newStatus })
    });
    setIsOnline(newStatus);
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">New Orders</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-gray-500 font-medium">Tracking live location</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              Ghar Side
            </p>
            <button 
              onClick={() => setIsBackToHome(!isBackToHome)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all mt-1",
                isBackToHome 
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-100" 
                  : "bg-gray-100 text-gray-400"
              )}
            >
              <Home size={12} />
              {isBackToHome ? 'On' : 'Off'}
            </button>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {isOnline ? 'Online' : 'Offline'}
            </p>
            <div 
              onClick={toggleOnline}
              className={cn(
                "w-12 h-6 rounded-full relative cursor-pointer transition-colors ml-auto mt-1",
                isOnline ? "bg-green-500" : "bg-gray-300"
              )}
            >
              <motion.div 
                animate={{ x: isOnline ? 26 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm" 
              />
            </div>
          </div>
          <button onClick={logout} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {/* Today's Summary Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Today's Earnings</p>
            <p className="text-xl font-bold text-gray-900">₹{earnings}</p>
          </div>
        </div>
        <Link to="/delivery/earnings" className="text-orange-500 text-xs font-bold">View Details</Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <Link to="/delivery/payout" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500">
            <Banknote size={20} />
          </div>
          <span className="text-sm font-bold">Payouts</span>
        </Link>
        <Link to="/delivery/contact" className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3 shadow-sm">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500">
            <Headphones size={20} />
          </div>
          <span className="text-sm font-bold">Support</span>
        </Link>
      </div>

      {isBackToHome && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center shrink-0">
            <Home size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-orange-900">"Ghar Side" Mode Active</p>
            <p className="text-[10px] text-orange-700">Showing orders heading towards your home area.</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-40 bg-gray-100 rounded-3xl animate-pulse" />)
        ) : availableOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">Waiting for new orders...</p>
            <p className="text-xs text-gray-400 mt-1">We'll notify you when a new order is ready</p>
          </div>
        ) : (
          availableOrders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-orange-500 font-bold uppercase tracking-wider mb-1">Ready for Pickup</p>
                  <h3 className="text-xl font-bold">Order #{order.id}</h3>
                </div>
                <div className="bg-green-50 px-3 py-1 rounded-full">
                  <p className="text-green-600 font-bold text-sm">₹{order.deliveryCharge}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                <MapPin size={14} />
                <span>2.5 km away from your location</span>
              </div>

              <button 
                onClick={() => acceptOrder(order.id)}
                className="w-full bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 active:scale-[0.98] transition-transform"
              >
                Accept Delivery
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const ActiveDeliveries = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchActive = async () => {
    const res = await fetch('/api/delivery/my-active', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setOrders(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchActive();
  }, []);

  // Live Location Tracking
  useEffect(() => {
    if (orders.length === 0) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetch('/api/delivery/location', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ lat: latitude, lng: longitude })
        }).catch(err => console.error("Location update failed", err));
      },
      (error) => console.error("Geolocation error", error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [orders.length]);

  const updateStatus = async (orderId: number, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    fetchActive();
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold">Active Deliveries</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[10px] text-gray-500 font-medium">Sharing live location with customer</p>
          </div>
        </div>
      </div>
      <div className="space-y-4">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Truck size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No active deliveries</p>
            <Link to="/delivery/new" className="text-orange-500 text-sm font-bold mt-2 inline-block">Find new orders</Link>
          </div>
        ) : (
          orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded mb-2 inline-block">
                    {order.status}
                  </span>
                  <h3 className="text-xl font-bold">Order #{order.id}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 uppercase font-bold">Earnings</p>
                  <p className="text-green-600 font-bold text-lg">₹{order.deliveryCharge}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 shrink-0">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Pickup From</p>
                    <p className="text-sm font-bold text-gray-700">Restaurant Address (Mock)</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Deliver To</p>
                    <p className="text-sm font-bold text-gray-700">Customer Address (Mock)</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {order.status === 'picked' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'delivering')}
                    className="flex-1 bg-orange-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100"
                  >
                    Start Delivery
                  </button>
                )}
                {order.status === 'delivering' && (
                  <button 
                    onClick={() => updateStatus(order.id, 'delivered')}
                    className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-100"
                  >
                    Mark as Delivered
                  </button>
                )}
                <button className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
                  <Phone size={20} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const DeliveryEarnings = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchEarnings = async (date?: string) => {
    setLoading(true);
    const url = date ? `/api/delivery/earnings?date=${date}` : '/api/delivery/earnings';
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchEarnings(selectedDate);
  }, [selectedDate]);

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Earnings</h2>
        <div className="relative">
          <input 
            type="date" 
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
          />
          <div className="bg-white border border-gray-100 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 text-sm font-medium text-gray-600">
            <Calendar size={16} className="text-orange-500" />
            {selectedDate === new Date().toISOString().split('T')[0] ? 'Today' : selectedDate}
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-500 mb-4">
                <Wallet size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Earnings</p>
              <h3 className="text-2xl font-bold text-gray-900">₹{data?.stats?.totalEarnings || 0}</h3>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 mb-4">
                <CheckCircle size={20} />
              </div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Deliveries</p>
              <h3 className="text-2xl font-bold text-gray-900">{data?.stats?.totalDeliveries || 0}</h3>
            </div>
          </div>

          <h3 className="text-lg font-bold mb-4">
            {selectedDate === new Date().toISOString().split('T')[0] ? 'Today\'s History' : `History for ${selectedDate}`}
          </h3>
          <div className="space-y-3">
            {data?.history?.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                No earnings history for this date
              </div>
            ) : (
              data?.history?.map((order: any) => (
                <div key={order.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm">Order #{order.id}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold text-green-600">+₹{order.deliveryCharge}</p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

// --- Kitchen App ---
const KitchenApp = () => {
  const { logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetch('/api/kitchen/orders', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    })
    .then(res => res.ok ? res.json() : [])
    .then(data => setOrders(Array.isArray(data) ? data : []))
    .catch(() => setOrders([]));
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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Kitchen Display</h2>
        <button 
          onClick={logout}
          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      </div>
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
const NotificationBell = () => {
  const { unreadCount } = useContext(NotificationContext);
  const navigate = useNavigate();

  return (
    <button 
      onClick={() => navigate('/notifications')}
      className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors"
    >
      <Bell size={24} />
      {unreadCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
};

const NotificationsPage = () => {
  const { notifications, markAsRead } = useContext(NotificationContext);
  const navigate = useNavigate();

  useEffect(() => {
    markAsRead();
  }, []);

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-400">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">Notifications</h2>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-gray-300" />
            </div>
            <p className="text-gray-400 font-medium">No notifications yet</p>
          </div>
        ) : (
          notifications.map((n: any) => (
            <div 
              key={n.id} 
              className={cn(
                "bg-white p-4 rounded-2xl border flex gap-4 shadow-sm transition-all",
                n.isRead ? "border-gray-100 opacity-75" : "border-orange-100 bg-orange-50/30"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                n.type === 'order_update' ? "bg-blue-50 text-blue-500" :
                n.type === 'new_order' ? "bg-green-50 text-green-500" :
                "bg-orange-50 text-orange-500"
              )}>
                {n.type === 'order_update' ? <Clock size={20} /> :
                 n.type === 'new_order' ? <ShoppingBag size={20} /> :
                 <Bell size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-sm text-gray-900">{n.title}</p>
                  <p className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const PayoutPage = () => {
  const [balance, setBalance] = useState(0);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('UPI');
  const [details, setDetails] = useState('');
  const [showRequest, setShowRequest] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payouts', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setBalance(data.balance || 0);
      setPayouts(data.payouts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/payouts/request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ amount: parseFloat(amount), method, details })
    });
    if (res.ok) {
      setShowRequest(false);
      setAmount('');
      setDetails('');
      fetchData();
    }
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Payouts</h2>
      
      <div className="bg-orange-600 rounded-3xl p-8 text-white mb-8 shadow-lg shadow-orange-100">
        <p className="text-orange-100 text-sm font-medium uppercase tracking-wider mb-2">Available Balance</p>
        <h3 className="text-4xl font-bold mb-6">₹{balance.toFixed(2)}</h3>
        <button 
          onClick={() => setShowRequest(true)}
          className="bg-white text-orange-600 px-6 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-orange-50 transition-colors"
        >
          Request Payout
        </button>
      </div>

      <h3 className="text-lg font-bold mb-4">Payout History</h3>
      <div className="space-y-3">
        {loading ? (
          [1,2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
            No payout history found
          </div>
        ) : (
          payouts.map((p: any) => (
            <div key={p.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <CreditCard size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">₹{p.amount}</p>
                  <p className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString()} • {p.method}</p>
                </div>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                p.status === 'approved' ? "bg-green-100 text-green-600" : 
                p.status === 'pending' ? "bg-orange-100 text-orange-600" : "bg-red-100 text-red-600"
              )}>
                {p.status}
              </span>
            </div>
          ))
        )}
      </div>

      <AnimatePresence>
        {showRequest && (
          <div className="fixed inset-0 bg-black/50 z-[70] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="bg-white w-full max-w-md rounded-t-[40px] sm:rounded-[40px] p-8"
            >
              <h3 className="text-2xl font-bold mb-6">Request Payout</h3>
              <form onSubmit={handleRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Amount (Max ₹{balance})</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    max={balance}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-bold text-lg"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Payout Method</label>
                  <select 
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Details (UPI ID or A/C Info)</label>
                  <input 
                    type="text" 
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="e.g. name@upi"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100">
                    Submit Request
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRequest(false)}
                    className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContactPage = () => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
    setSubject('');
    setMessage('');
  };

  return (
    <div className="pb-32 pt-6 px-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Contact Support</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <a href="tel:+919876543210" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center hover:border-orange-200 transition-colors">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-3">
            <Phone size={24} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Call Us</p>
          <p className="text-sm font-bold">+91 98765 43210</p>
        </a>
        <a href="mailto:support@aliflayla.com" className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center hover:border-orange-200 transition-colors">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-3">
            <MessageSquare size={24} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Email Us</p>
          <p className="text-sm font-bold">support@aliflayla.com</p>
        </a>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500 mx-auto mb-3">
            <Headphones size={24} />
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase mb-1">Live Chat</p>
          <p className="text-sm font-bold">Available 24/7</p>
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold mb-6">Send us a message</h3>
        {sent ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
              <CheckCircle size={40} />
            </div>
            <h4 className="text-lg font-bold mb-2">Message Sent!</h4>
            <p className="text-gray-500 text-sm mb-6">We've received your message and will get back to you soon.</p>
            <button 
              onClick={() => setSent(false)}
              className="text-orange-600 font-bold text-sm"
            >
              Send another message
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Subject</label>
              <input 
                type="text" 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="How can we help?"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
              <textarea 
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none h-32 resize-none"
                placeholder="Describe your issue in detail..."
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={sending}
              className="w-full bg-orange-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-orange-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending...
                </>
              ) : 'Send Message'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

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
    try {
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
        return { success: true };
      }
      return data;
    } catch (err) {
      return { error: 'Failed to connect to server' };
    }
  };

  const signup = async (userData: any) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || 'Signup failed' };
      }
      return data;
    } catch (err) {
      return { error: 'Failed to connect to server' };
    }
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
        <NotificationProvider>
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
                        <Route path="/search" element={<SearchPage />} />
                        <Route path="/orders" element={<CustomerOrders />} />
                        <Route path="/notifications" element={<NotificationsPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                      </>
                    )}

                  {/* Delivery Routes */}
                  {user.role === 'delivery' && (
                    <>
                      <Route path="/" element={<Navigate to="/delivery/new" />} />
                      <Route path="/delivery/new" element={<DeliveryApp />} />
                      <Route path="/delivery/active" element={<ActiveDeliveries />} />
                      <Route path="/delivery/earnings" element={<DeliveryEarnings />} />
                      <Route path="/delivery/payout" element={<PayoutPage />} />
                      <Route path="/delivery/contact" element={<ContactPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </>
                  )}

                  {/* Restaurant Routes */}
                  {user.role === 'restaurant' && (
                    <>
                      <Route path="/" element={<Navigate to="/restaurant/dash" />} />
                      <Route path="/restaurant/dash" element={<RestaurantDashboard />} />
                      <Route path="/restaurant/orders" element={<RestaurantOrders />} />
                      <Route path="/restaurant/menu" element={<RestaurantMenuManager />} />
                      <Route path="/restaurant/payout" element={<PayoutPage />} />
                      <Route path="/restaurant/contact" element={<ContactPage />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                    </>
                  )}

                  {/* Kitchen Routes */}
                  {user.role === 'kitchen' && (
                    <>
                      <Route path="/" element={<Navigate to="/kitchen/cooking" />} />
                      <Route path="/kitchen/cooking" element={<KitchenApp />} />
                      <Route path="/kitchen/ready" element={<div className="p-8">Ready Orders</div>} />
                      <Route path="/kitchen/history" element={<div className="p-8">Kitchen History</div>} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                    </>
                  )}

                  {/* Admin Routes */}
                  {user.role === 'admin' && (
                    <>
                      <Route path="*" element={<AdminDashboard />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                    </>
                  )}

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
                {user.role !== 'admin' && (
                  <>
                    <FloatingCart />
                    <BottomNav role={user.role} />
                  </>
                )}
              </>
            )}
          </div>
        </BrowserRouter>
      </NotificationProvider>
      </CartContext.Provider>
    </AuthContext.Provider>
  );
}
