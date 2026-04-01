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
    <div className="w-full max-w-2xl mx-auto px-4">
      {/* Carte 3D */}
      <motion.div
        className="relative mb-8"
        style={{ perspective: "1500px" }}
        whileHover={{ rotateY: 2, rotateX: -2 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
        <div 
          className="relative bg-gradient-to-br from-accent via-accent-hover to-secondary rounded-2xl p-6 sm:p-10 shadow-2xl shadow-accent-glow/50"
          style={{ transformStyle: "preserve-3d", aspectRatio: "1.6" }}>
          
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 rounded-2xl overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-white drop-shadow-lg" />
              <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white/80" />
            </div>

            {/* Infos éditables */}
            <div className="space-y-3 sm:space-y-4">
              <p className="text-white/70 text-xs sm:text-sm font-medium">Carte Cadeau DeezLink</p>
              
              {/* Montant éditable */}
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="5"
                  max="500"
                  className="bg-white/20 border-2 border-white/30 text-white text-4xl sm:text-5xl font-bold rounded-lg px-3 py-2 w-32 sm:w-40 tabular-nums backdrop-blur-sm focus:border-white/60 focus:outline-none"
                  placeholder="50"
                />
                <span className="text-4xl sm:text-5xl font-bold text-white">€</span>
              </div>

              {/* Destinataire */}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Pour</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom du destinataire"
                  className="w-full bg-white/20 border border-white/30 text-white rounded-lg px-3 py-2 text-sm sm:text-base backdrop-blur-sm placeholder:text-white/40 focus:border-white/60 focus:outline-none"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-white/60 text-xs mb-1 block">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message..."
                  maxLength={150}
                  rows={2}
                  className="w-full bg-white/20 border border-white/30 text-white rounded-lg px-3 py-2 text-xs sm:text-sm backdrop-blur-sm placeholder:text-white/40 focus:border-white/60 focus:outline-none resize-none"
                />
                <p className="text-white/50 text-[10px] mt-1 text-right">{message.length}/150</p>
              </div>
            </div>

            {/* Footer */}
            <p className="text-white/60 text-[10px] sm:text-xs">Valable 12 mois • Deezer Premium</p>
          </div>
        </div>
      </motion.div>

      {/* Bouton Valider ESPACÉ */}
      <div className="flex justify-center">
        <motion.button
          onClick={onValidate}
          disabled={loading || !amount || amount < 5}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 bg-white text-accent font-bold text-lg rounded-xl hover:bg-white/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-3 shadow-2xl">
          {loading ? (
            <>
              <div className="w-6 h-6 border-3 border-accent border-t-transparent rounded-full animate-spin" />
              Création en cours...
            </>
          ) : (
            <>
              <Check className="h-6 w-6" />
              Créer la carte cadeau
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
