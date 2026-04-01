import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Gift, Check, AlertCircle, Sparkles, Edit3, X } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function EditableGiftCard3D({ 
  amount, 
  setAmount, 
  recipientName, 
  setRecipientName, 
  message, 
  setMessage,
  onValidate,
  loading 
}) {
  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      {/* Carte Cadeau ULTRA-PREMIUM */}
      <motion.div
        className="relative mb-8 sm:mb-12"
        style={{ perspective: "2500px" }}
        whileHover={{ 
          rotateY: 5, 
          rotateX: -3,
          scale: 1.02
        }}
        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}>
        
        {/* La carte physique LUXE */}
        <div 
          className="relative rounded-2xl sm:rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.5)] overflow-hidden"
          style={{ 
            transformStyle: "preserve-3d",
            aspectRatio: "1.7",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)",
            backgroundSize: "300% 300%",
            animation: "gradient 15s ease infinite"
          }}>
          
          {/* Holographic Shine Layer */}
          <div className="absolute inset-0 opacity-60 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-pink-300/30 via-transparent to-blue-300/30" />
          </div>

          {/* Geometric Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hexagons" x="0" y="0" width="50" height="43.4" patternUnits="userSpaceOnUse">
                  <polygon points="25,0 50,14.43 50,43.3 25,57.74 0,43.3 0,14.43" fill="none" stroke="white" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
            </svg>
          </div>

          {/* Glassmorphic Content Container */}
          <div className="relative z-10 p-4 sm:p-8 md:p-10 h-full flex flex-col justify-between backdrop-blur-sm bg-black/5">
            
            {/* Top: Minimal Branding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/30 backdrop-blur-xl flex items-center justify-center border border-white/40 shadow-lg">
                  <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white text-sm sm:text-base font-black tracking-wider drop-shadow-lg">DEEZLINK</h3>
                  <p className="text-white/90 text-[9px] sm:text-[10px] uppercase tracking-widest">Premium Gift Card</p>
                </div>
              </div>
              <Sparkles className="h-7 w-7 sm:h-9 sm:w-9 text-white/90 drop-shadow-xl animate-pulse" />
            </div>

            {/* Center: Amount - Editable Inline */}
            <div className="flex flex-col items-center justify-center gap-6 sm:gap-8 my-4 sm:my-0">
              <div className="text-center">
                <label className="text-white/80 text-[10px] sm:text-xs font-semibold mb-2 sm:mb-3 block uppercase tracking-wider drop-shadow">Valeur</label>
                <div className="flex items-baseline justify-center gap-1 sm:gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="5"
                    max="500"
                    className="bg-white/30 border-2 border-white/50 text-white text-5xl sm:text-7xl md:text-8xl font-black rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1 sm:py-2 w-32 sm:w-52 md:w-64 text-center tabular-nums backdrop-blur-2xl focus:border-white/80 focus:bg-white/40 focus:outline-none focus:ring-4 focus:ring-white/30 transition-all shadow-2xl"
                    placeholder="50"
                  />
                  <span className="text-5xl sm:text-7xl md:text-8xl font-black text-white drop-shadow-2xl">€</span>
                </div>
              </div>

              {/* Compact Inputs */}
              <div className="w-full max-w-md space-y-3 sm:space-y-4">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Pour (optionnel)"
                  className="w-full bg-white/25 border border-white/40 text-white text-sm sm:text-base font-medium rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-center backdrop-blur-xl placeholder:text-white/60 focus:border-white/70 focus:bg-white/35 focus:outline-none transition-all shadow-lg"
                />
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Message (optionnel)"
                  maxLength={100}
                  rows={2}
                  className="w-full bg-white/25 border border-white/40 text-white text-xs sm:text-sm font-light rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 text-center backdrop-blur-xl placeholder:text-white/60 focus:border-white/70 focus:bg-white/35 focus:outline-none transition-all resize-none shadow-lg"
                />
              </div>
            </div>

            {/* Bottom: Minimal Footer */}
            <div className="flex items-center justify-between text-white/80">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold drop-shadow">12 Mois • Deezer Premium</p>
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50" />
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/50" />
              </div>
            </div>
          </div>

          {/* Edge Glow Effect */}
          <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-white/30 pointer-events-none" />
        </div>
      </motion.div>

      {/* Bouton Valider - Ultra Clean */}
      <div className="flex justify-center">
        <motion.button
          onClick={onValidate}
          disabled={loading || !amount || amount < 5}
          whileHover={{ scale: 1.05, boxShadow: "0 20px 60px rgba(102, 126, 234, 0.6)" }}
          whileTap={{ scale: 0.98 }}
          className="group relative w-full sm:w-auto px-10 sm:px-16 py-4 sm:py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-size-200 bg-pos-0 hover:bg-pos-100 text-white font-black text-base sm:text-xl rounded-xl sm:rounded-2xl transition-all duration-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 sm:gap-4 shadow-2xl overflow-hidden">
          {/* Animated shine */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          {loading ? (
            <>
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span className="relative z-10">Création...</span>
            </>
          ) : (
            <>
              <Check className="h-6 w-6 sm:h-7 sm:w-7 relative z-10" />
              <span className="relative z-10 uppercase tracking-wider">Créer la carte</span>
            </>
          )}
        </motion.button>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}

export default function GiftCards() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language || "fr";
  const [amount, setAmount] = useState(50);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");

  const handleValidate = async () => {
    if (!purchaserEmail) {
      setError(lang === "fr" ? "Veuillez renseigner votre email" : "Please enter your email");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await axios.post(`${API}/gift-cards/purchase`, {
        amount,
        purchaser_email: purchaserEmail,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName || null,
        message: message || null,
      });

      if (response.data.success) {
        setGeneratedCode(response.data.gift_card.code);
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="orb-purple" style={{ top: "-10%", right: "-10%" }} />
      <div className="orb-pink" style={{ bottom: "10%", left: "-5%" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="h-8 w-8 text-accent" />
            <h1 className="text-4xl sm:text-5xl font-bold">
              {lang === "fr" ? "Cartes Cadeaux" : "Gift Cards"}
            </h1>
          </div>
          <p className="text-lg text-t-secondary max-w-2xl mx-auto">
            {lang === "fr"
              ? "Offrez la musique illimitée à vos proches avec nos cartes cadeaux DeezLink"
              : "Give unlimited music to your loved ones with DeezLink gift cards"}
          </p>
        </motion.div>

        {success ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto">
            <div className="glass backdrop-blur-xl rounded-2xl p-8 text-center">
              <div className="w-20 h-20 bg-green-dim rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="h-10 w-10 text-green" />
              </div>
              <h2 className="text-2xl font-bold text-t-primary mb-3">
                {lang === "fr" ? "Carte créée avec succès !" : "Card created successfully!"}
              </h2>
              <p className="text-t-secondary mb-6">
                {lang === "fr" ? "Voici le code de votre carte cadeau :" : "Here's your gift card code:"}
              </p>
              <div className="glass rounded-xl p-6 mb-6 bg-accent/10 border border-accent/30">
                <p className="text-3xl font-mono font-bold text-accent mb-2">{generatedCode}</p>
                <p className="text-sm text-t-muted">
                  {lang === "fr"
                    ? "⚠️ Notez ce code, il ne sera plus affiché"
                    : "⚠️ Save this code, it won't be shown again"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSuccess(false);
                  setGeneratedCode("");
                  setAmount(50);
                  setRecipientName("");
                  setMessage("");
                  setRecipientEmail("");
                }}
                className="px-8 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all">
                {lang === "fr" ? "Créer une autre carte" : "Create another card"}
              </button>
            </div>
          </motion.div>
        ) : (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}>
              <EditableGiftCard3D
                amount={amount}
                setAmount={setAmount}
                recipientName={recipientName}
                setRecipientName={setRecipientName}
                message={message}
                setMessage={setMessage}
                onValidate={handleValidate}
                loading={loading}
              />
            </motion.div>

            {/* Emails below card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="max-w-2xl mx-auto mt-8">
              <div className="glass backdrop-blur-xl rounded-2xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-2">
                      {lang === "fr" ? "Votre email" : "Your email"} *
                    </label>
                    <input
                      type="email"
                      value={purchaserEmail}
                      onChange={(e) => setPurchaserEmail(e.target.value)}
                      required
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                      placeholder="votre@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-2">
                      {lang === "fr" ? "Email destinataire (opt.)" : "Recipient email (opt.)"}
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                      placeholder="destinataire@email.com"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mt-4">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
