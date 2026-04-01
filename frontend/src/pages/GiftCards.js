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
      {/* Carte Cadeau Premium Template */}
      <motion.div
        className="relative mb-8 sm:mb-12"
        style={{ perspective: "2000px" }}
        whileHover={{ rotateY: 2, rotateX: -1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
        
        {/* La carte physique */}
        <div 
          className="relative bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden"
          style={{ 
            transformStyle: "preserve-3d",
            aspectRatio: "1.7",
            boxShadow: "0 20px 40px rgba(168, 85, 247, 0.3), 0 10px 20px rgba(236, 72, 153, 0.2)"
          }}>
          
          {/* Pattern Background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')]" />
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-40 pointer-events-none" />
          
          {/* Content Container */}
          <div className="relative z-10 p-4 sm:p-8 md:p-12 h-full flex flex-col justify-between">
            
            {/* Top: Logo & Brand */}
            <div className="flex items-center justify-between mb-4 sm:mb-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
                  <Gift className="h-5 w-5 sm:h-7 sm:w-7 text-white drop-shadow-lg" />
                </div>
                <div>
                  <h3 className="text-white text-sm sm:text-lg font-bold drop-shadow-md">DeezLink</h3>
                  <p className="text-white/80 text-[10px] sm:text-xs">Gift Card</p>
                </div>
              </div>
              <Sparkles className="h-7 w-7 sm:h-10 sm:w-10 text-white/70 drop-shadow-lg" />
            </div>

            {/* Middle: Form Fields */}
            <div className="flex flex-col gap-3 sm:gap-6">
              {/* Montant */}
              <div>
                <label className="text-white/70 text-xs sm:text-sm font-medium mb-1 sm:mb-2 block drop-shadow">Montant</label>
                <div className="flex items-baseline gap-1 sm:gap-2">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    min="5"
                    max="500"
                    className="bg-white/25 border-2 border-white/40 text-white text-4xl sm:text-6xl md:text-7xl font-black rounded-xl sm:rounded-2xl px-2 sm:px-4 py-1 sm:py-2 w-28 sm:w-48 md:w-56 tabular-nums backdrop-blur-md focus:border-white/70 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-white/20 transition-all"
                    placeholder="50"
                  />
                  <span className="text-4xl sm:text-6xl md:text-7xl font-black text-white drop-shadow-lg">€</span>
                </div>
              </div>

              {/* Destinataire */}
              <div>
                <label className="text-white/70 text-xs sm:text-sm font-medium mb-1 sm:mb-2 block drop-shadow">Pour</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom du destinataire"
                  className="w-full sm:w-80 md:w-96 bg-white/25 border-2 border-white/40 text-white text-sm sm:text-lg font-semibold rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-md placeholder:text-white/50 focus:border-white/70 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-white/20 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-white/70 text-xs sm:text-sm font-medium mb-1 sm:mb-2 block drop-shadow">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Joyeux anniversaire !"
                  maxLength={120}
                  rows={2}
                  className="w-full bg-white/25 border-2 border-white/40 text-white text-xs sm:text-sm rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-md placeholder:text-white/50 focus:border-white/70 focus:outline-none focus:ring-2 sm:focus:ring-4 focus:ring-white/20 transition-all resize-none"
                />
                <p className="text-white/60 text-[10px] sm:text-xs mt-1 text-right drop-shadow">{message.length}/120</p>
              </div>
            </div>

            {/* Bottom: Footer */}
            <div className="flex items-center justify-between mt-4 sm:mt-0">
              <p className="text-white/80 text-[10px] sm:text-xs drop-shadow">Valable 12 mois • Deezer Premium</p>
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Bouton Valider - BIEN ESPACÉ */}
      <div className="flex justify-center">
        <motion.button
          onClick={onValidate}
          disabled={loading || !amount || amount < 5}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto px-8 sm:px-12 py-4 sm:py-5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-base sm:text-xl rounded-xl sm:rounded-2xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 sm:gap-4 shadow-2xl shadow-purple-500/50">
          {loading ? (
            <>
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <Check className="h-6 w-6 sm:h-7 sm:w-7" />
              <span>Créer la carte cadeau</span>
            </>
          )}
        </motion.button>
      </div>
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
