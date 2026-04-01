import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [showCartNotif, setShowCartNotif] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("deezlink_cart");
    if (saved) {
      try {
        setCart(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load cart", e);
      }
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem("deezlink_cart", JSON.stringify(cart));
  }, [cart]);

  const addToCart = (pack) => {
    // Check if pack already in cart
    const existing = cart.find((item) => item.id === pack.id);
    if (existing) {
      setCart(cart.map((item) => (item.id === pack.id ? { ...item, quantity: item.quantity + 1 } : item)));
    } else {
      setCart([...cart, { ...pack, quantity: 1 }]);
    }
    
    // Show notification
    setShowCartNotif(true);
    setTimeout(() => setShowCartNotif(false), 2000);
  };

  const removeFromCart = (packId) => {
    setCart(cart.filter((item) => item.id !== packId));
  };

  const updateQuantity = (packId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(packId);
    } else {
      setCart(cart.map((item) => (item.id === packId ? { ...item, quantity } : item)));
    }
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getTotalItems,
        showCartNotif,
      }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
