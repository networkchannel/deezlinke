import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import axios from "axios";
import { Gift, Check, AlertCircle, Sparkles } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function GiftCard3D({ amount, recipientName, message }) {
  return (
    <motion.div
      className="relative w-full max-w-md mx-auto"
      style={{ perspective: "1000px" }}
      whileHover={{ rotateY: 5, rotateX: -5 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
      <div className="relative bg-gradient-to-br from-accent via-accent-hover to-secondary rounded-2xl p-8 shadow-2xl shadow-accent-glow transform-gpu"
        style={{ transformStyle: "preserve-3d" }}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Gift className="h-10 w-10 text-white" />
            <Sparkles className="h-8 w-8 text-white/70" />
          </div>

          <div className="mb-6">
            <p className="text-white/80 text-sm mb-2">Carte Cadeau DeezLink</p>
            <p className="text-5xl font-bold text-white tabular-nums">
              {amount > 0 ? `${amount.toFixed(0)}€` : "—"}
            </p>
          </div>

          {recipientName && (
            <div className="mb-4">
              <p className="text-white/60 text-xs mb-1">Pour</p>
              <p className="text-white font-semibold text-lg">{recipientName}</p>
            </div>
          )}

          {message && (
            <div className="glass backdrop-blur-sm rounded-lg p-3 mt-4">
              <p className="text-white/90 text-sm italic">"{message}"</p>
            </div>
          )}

          <div className="mt-8 pt-4 border-t border-white/20">
            <p className="text-white/60 text-xs">Valable 12 mois • Deezer Premium</p>
          </div>
        </div>

        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500" />
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

  const predefinedAmounts = [25, 50, 100, 150, 200];

  const handlePurchase = async (e) => {
    e.preventDefault();
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
        // Reset form
        setRecipientEmail("");
        setRecipientName("");
        setMessage("");
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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Preview Card 3D */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <h2 className="text-xl font-bold text-t-primary mb-6">
              {lang === "fr" ? "Aperçu de votre carte" : "Card Preview"}
            </h2>
            <GiftCard3D amount={amount} recipientName={recipientName} message={message} />
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}>
            <div className="glass backdrop-blur-xl rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-t-primary mb-6">
                {lang === "fr" ? "Personnaliser votre carte" : "Customize your card"}
              </h2>

              {success ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-dim rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="h-8 w-8 text-green" />
                  </div>
                  <h3 className="text-xl font-bold text-t-primary mb-2">
                    {lang === "fr" ? "Carte créée !" : "Card created!"}
                  </h3>
                  <p className="text-t-secondary mb-6">
                    {lang === "fr" ? "Code de la carte cadeau :" : "Gift card code:"}
                  </p>
                  <div className="glass rounded-xl p-4 mb-6">
                    <p className="text-2xl font-mono font-bold text-accent">{generatedCode}</p>
                  </div>
                  <p className="text-sm text-t-muted mb-6">
                    {lang === "fr"
                      ? "⚠️ Conservez ce code précieusement ! Il ne sera plus affiché."
                      : "⚠️ Keep this code safe! It won't be displayed again."}
                  </p>
                  <button
                    onClick={() => {
                      setSuccess(false);
                      setGeneratedCode("");
                      setAmount(50);
                    }}
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all">
                    {lang === "fr" ? "Créer une autre carte" : "Create another card"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handlePurchase} className="space-y-6">
                  {/* Amount Selection */}
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-3">
                      {lang === "fr" ? "Montant" : "Amount"}
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {predefinedAmounts.map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAmount(amt)}
                          className={`py-2 rounded-lg font-semibold text-sm transition-all ${
                            amount === amt
                              ? "bg-accent text-white"
                              : "glass hover:bg-white/10 text-t-primary"
                          }`}>
                          {amt}€
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      min="5"
                      max="500"
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                    />
                  </div>

                  {/* Purchaser Email */}
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

                  {/* Recipient Name */}
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-2">
                      {lang === "fr" ? "Nom du destinataire (optionnel)" : "Recipient name (optional)"}
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                      placeholder="Jean Dupont"
                    />
                  </div>

                  {/* Recipient Email */}
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-2">
                      {lang === "fr" ? "Email du destinataire (optionnel)" : "Recipient email (optional)"}
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm"
                      placeholder="destinataire@email.com"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-sm font-medium text-t-primary block mb-2">
                      {lang === "fr" ? "Message personnel (optionnel)" : "Personal message (optional)"}
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={500}
                      rows={3}
                      className="w-full bg-bg/50 border border-border text-t-primary rounded-xl px-4 py-3 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 backdrop-blur-sm resize-none"
                      placeholder={lang === "fr" ? "Joyeux anniversaire ! 🎉" : "Happy birthday! 🎉"}
                    />
                    <p className="text-xs text-t-muted mt-1">{message.length}/500</p>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-red-400" />
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={loading}
                    className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-accent-glow flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {lang === "fr" ? "Création..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <Gift className="h-5 w-5" />
                        {lang === "fr" ? "Créer la carte" : "Create card"}
                      </>
                    )}
                  </motion.button>
                </form>
              )}
            </div>
          </motion.div>
        </div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16">
          <h2 className="text-2xl font-bold text-t-primary mb-8 text-center">
            {lang === "fr" ? "Comment ça marche ?" : "How it works?"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                title: lang === "fr" ? "Choisissez le montant" : "Choose amount",
                desc: lang === "fr" ? "De 5€ à 500€" : "From 5€ to 500€",
              },
              {
                step: "02",
                title: lang === "fr" ? "Personnalisez" : "Customize",
                desc: lang === "fr" ? "Nom, message personnel" : "Name, personal message",
              },
              {
                step: "03",
                title: lang === "fr" ? "Utilisez le code" : "Use the code",
                desc: lang === "fr" ? "À appliquer au panier" : "Apply to cart",
              },
            ].map((item, i) => (
              <div key={i} className="glass rounded-xl p-6 relative overflow-hidden">
                <div className="absolute -top-6 -right-6 text-[120px] font-bold text-white opacity-[0.03] leading-none select-none">
                  {item.step}
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-accent bg-accent-glow w-8 h-8 rounded-lg flex items-center justify-center">
                      {item.step}
                    </span>
                    <h3 className="text-base font-semibold text-t-primary">{item.title}</h3>
                  </div>
                  <p className="text-sm text-t-secondary">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
