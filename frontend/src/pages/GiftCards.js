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
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        className="glass backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl border border-white/10"
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <Gift className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-t-primary">Carte Cadeau DeezLink</h3>
            <p className="text-xs text-t-muted">Offrez Deezer Premium</p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5 mb-6">
          {/* Montant */}
          <div>
            <label className="block text-sm font-medium text-t-primary mb-2">
              Montant
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="5"
                max="500"
                className="w-full bg-bg-secondary/50 border border-white/10 text-t-primary text-2xl font-bold rounded-xl px-4 py-3 pr-12 focus:border-accent focus:outline-none transition-all"
                placeholder="50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-t-muted">€</span>
            </div>
            <p className="text-xs text-t-muted mt-1">Min 5€ • Max 500€</p>
          </div>

          {/* Destinataire */}
          <div>
            <label className="block text-sm font-medium text-t-primary mb-2">
              Pour (optionnel)
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Nom du destinataire"
              className="w-full bg-bg-secondary/50 border border-white/10 text-t-primary rounded-xl px-4 py-3 focus:border-accent focus:outline-none transition-all"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-t-primary mb-2">
              Message personnel (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Joyeux anniversaire ! Profite de la musique..."
              maxLength={200}
              rows={4}
              className="w-full bg-bg-secondary/50 border border-white/10 text-t-primary rounded-xl px-4 py-3 focus:border-accent focus:outline-none transition-all resize-none"
            />
            <p className="text-xs text-t-muted mt-1 text-right">{message.length}/200</p>
          </div>
        </div>

        {/* Preview Card */}
        {(amount > 0 || recipientName || message) && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mb-6">
            <p className="text-xs text-t-muted mb-3">Aperçu :</p>
            <div className="bg-gradient-to-br from-accent/20 to-secondary/20 rounded-xl p-6 border border-accent/20">
              <div className="flex items-center justify-between mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
                <span className="text-3xl font-bold text-accent">{amount > 0 ? `${amount}€` : "—"}</span>
              </div>
              {recipientName && (
                <p className="text-sm text-t-primary font-medium mb-2">Pour {recipientName}</p>
              )}
              {message && (
                <p className="text-xs text-t-muted italic">"{message}"</p>
              )}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-white/10">
          <p className="text-xs text-t-muted">Valable 12 mois</p>
          <motion.button
            onClick={onValidate}
            disabled={loading || !amount || amount < 5}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-accent to-secondary hover:opacity-90 text-white font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Créer la carte cadeau
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
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
