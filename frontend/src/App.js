import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { useEffect } from "react";
import { initSecurity } from "@/utils/security";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Landing from "@/pages/Landing";
import Offers from "@/pages/Offers";
import GiftCards from "@/pages/GiftCards";
import Checkout from "@/pages/Checkout";
import OrderConfirmation from "@/pages/OrderConfirmation";
import OrderHistory from "@/pages/OrderHistory";
import Login from "@/pages/Login";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import Profile from "@/pages/Profile";

function App() {
  // Initialiser la sécurité au chargement
  useEffect(() => {
    initSecurity();
  }, []);

  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-bg flex flex-col relative overflow-hidden">
            {/* Animated background */}
            <div className="fixed inset-0 z-0">
              <div className="orb-purple animate-pulse" style={{ top: "-10%", right: "-10%", animationDuration: "8s" }} />
              <div className="orb-pink animate-pulse" style={{ bottom: "10%", left: "-5%", animationDuration: "10s" }} />
            </div>
            
            <div className="relative z-10 flex flex-col min-h-screen">
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/offers" element={<Offers />} />
                  <Route path="/gift-cards" element={<GiftCards />} />
                  <Route path="/checkout/:packId" element={<Checkout />} />
                  <Route path="/order/:orderId" element={<OrderConfirmation />} />
                  <Route path="/history" element={<OrderHistory />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </main>
              <Footer />
            </div>
          </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
