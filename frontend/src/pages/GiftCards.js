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
  const [editingField, setEditingField] = useState(null);
  const lang = "fr";

  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: "1500px", aspectRatio: "1.586" }}
      whileHover={{ rotateY: 2, rotateX: -2 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div 
        className="relative w-full h-full bg-gradient-to-br from-accent via-accent-hover to-secondary rounded-2xl p-6 sm:p-8 shadow-2xl shadow-accent-glow transform-gpu"
        style={{ transformStyle: "preserve-3d" }}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header avec icônes interactives */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            {/* Icône cadeau → Prénom */}
            <div className="relative group">
              <button
                onClick={() => setEditingField(editingField === "name" ? null : "name")}
                className="relative flex items-center gap-2 sm:gap-3 transition-all hover:scale-105">
                <Gift className="h-8 sm:h-10 w-8 sm:w-10 text-white drop-shadow-lg" />
                {editingField === "name" ? (
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Prénom"
                    autoFocus
                    className="w-20 sm:w-28 bg-white/20 border-2 border-white/40 text-white text-sm sm:text-base font-bold rounded-lg px-2 py-1 backdrop-blur-sm placeholder:text-white/50 focus:border-white/60 focus:outline-none"
                  />
                ) : (
                  <span className="text-white text-sm sm:text-lg font-bold drop-shadow">
                    {recipientName || "Prénom"}
                  </span>
                )}
              </button>
              <div className="hidden sm:block absolute -bottom-5 left-0 text-white/60 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cliquez pour éditer
              </div>
            </div>

            {/* Icône étoile → Montant */}
            <div className="relative group">
              <button
                onClick={() => setEditingField(editingField === "amount" ? null : "amount")}
                className="relative flex items-center gap-1 sm:gap-2 transition-all hover:scale-105">
                <Sparkles className="h-7 sm:h-9 w-7 sm:w-9 text-white/90 drop-shadow-lg" />
                {editingField === "amount" ? (
                  <div className="flex items-baseline gap-0.5">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="5"
                      max="500"
                      autoFocus
                      className="w-16 sm:w-20 bg-white/20 border-2 border-white/40 text-white text-2xl sm:text-3xl font-bold rounded-lg px-1 sm:px-2 py-0.5 sm:py-1 tabular-nums backdrop-blur-sm focus:border-white/60 focus:outline-none text-right"
                    />
                    <span className="text-2xl sm:text-3xl font-bold text-white">€</span>
                  </div>
                ) : (
                  <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums drop-shadow-lg">
                    {amount > 0 ? `${amount}€` : "—€"}
                  </span>
                )}
              </button>
              <div className="hidden sm:block absolute -bottom-5 right-0 text-white/60 text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Cliquez pour éditer
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4 font-medium">Carte Cadeau DeezLink</p>

            {/* Zone Message */}
            <div className="flex-1 mb-3 sm:mb-4">
              {editingField === "message" ? (
                <div>
                  <label className="text-white/70 text-[10px] sm:text-xs mb-1 sm:mb-2 block font-medium">Message personnel</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Écrivez un message..."
                    maxLength={200}
                    rows={3}
                    autoFocus
                    className="w-full bg-white/20 border-2 border-white/40 text-white rounded-lg px-3 py-2 text-xs sm:text-sm backdrop-blur-sm placeholder:text-white/50 focus:border-white/60 focus:outline-none resize-none"
                  />
                  <p className="text-white/60 text-[10px] mt-1">{message.length}/200</p>
                </div>
              ) : (
                <button
                  onClick={() => setEditingField("message")}
                  className="w-full h-full min-h-[60px] sm:min-h-[80px] glass backdrop-blur-md rounded-lg p-3 border border-white/20 hover:border-white/40 transition-all text-left group">
                  {message ? (
                    <p className="text-white/90 text-xs sm:text-sm italic leading-relaxed">"{message}"</p>
                  ) : (
                    <p className="text-white/40 text-xs sm:text-sm italic">Cliquez pour ajouter un message...</p>
                  )}
                  <div className="hidden sm:block text-white/50 text-[9px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Cliquez pour éditer le message
                  </div>
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 sm:pt-4 border-t border-white/30 space-y-2 sm:space-y-3">
              <p className="text-white/70 text-[10px] sm:text-xs font-medium">Valable 12 mois • Deezer Premium</p>
              
              <motion.button
                onClick={onValidate}
                disabled={loading || !amount || amount < 5}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-white text-accent font-bold rounded-lg sm:rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base">
                {loading ? (
                  <>
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 sm:h-5 sm:w-5" />
                    Valider la carte cadeau
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-3xl opacity-0 hover:opacity-100 transition-opacity duration-700" />
      </div>
    </motion.div>
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
