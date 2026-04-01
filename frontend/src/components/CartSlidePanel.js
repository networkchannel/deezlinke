import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function CartSlidePanel({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, getTotal, getTotalItems } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";

  const handleCheckout = () => {
    if (cart.length === 1) {
      navigate(`/checkout/${cart[0].id}`);
    } else {
      // For multiple items, we'll need to handle multi-checkout
      navigate("/checkout/custom");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Slide Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 glass backdrop-blur-xl border-l border-border z-50 flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-bold text-t-primary">
                  {lang === "fr" ? "Panier" : "Cart"}
                </h2>
                {getTotalItems() > 0 && (
                  <span className="text-xs bg-accent text-white px-2 py-0.5 rounded-full">
                    {getTotalItems()}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-t-muted hover:text-t-primary transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag className="h-16 w-16 text-t-muted mb-4 opacity-20" />
                  <p className="text-t-muted mb-2">
                    {lang === "fr" ? "Votre panier est vide" : "Your cart is empty"}
                  </p>
                  <button
                    onClick={() => {
                      navigate("/offers");
                      onClose();
                    }}
                    className="text-sm text-accent hover:underline">
                    {lang === "fr" ? "Voir les offres" : "View offers"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="glass rounded-xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-t-primary">
                            {t(item.name_key)}
                          </h3>
                          <p className="text-xs text-t-muted">
                            {item.quantity} {lang === "fr" ? "x" : "×"} {item.price.toFixed(0)}€
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-t-muted hover:text-red-500 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-surface-hover transition-colors">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-semibold text-t-primary w-8 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-lg glass flex items-center justify-center hover:bg-surface-hover transition-colors">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <span className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                          {(item.price * item.quantity).toFixed(0)}€
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-border p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-t-primary">Total</span>
                  <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                    {getTotal().toFixed(0)}€
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-accent-glow">
                  {lang === "fr" ? "Passer commande" : "Checkout"}
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
