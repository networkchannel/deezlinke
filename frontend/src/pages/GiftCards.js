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
  const [isEditing, setIsEditing] = useState(false);
  const lang = "fr";

  return (
    <motion.div
      className="relative w-full max-w-2xl mx-auto"
      style={{ perspective: "1500px" }}
      whileHover={{ rotateY: isEditing ? 0 : 3, rotateX: isEditing ? 0 : -3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
      <div 
        className="relative bg-gradient-to-br from-accent via-accent-hover to-secondary rounded-3xl p-10 sm:p-12 shadow-2xl shadow-accent-glow transform-gpu"
        style={{ transformStyle: "preserve-3d" }}>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 rounded-3xl overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full blur-3xl" />
        </div>

        {/* Edit Button */}
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all group z-20">
            <Edit3 className="h-5 w-5 text-white group-hover:scale-110 transition-transform" />
          </button>
        )}

        {isEditing && (
          <button
            onClick={() => setIsEditing(false)}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all z-20">
            <X className="h-5 w-5 text-white" />
          </button>
        )}

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <Gift className="h-12 w-12 text-white drop-shadow-lg" />
            <Sparkles className="h-10 w-10 text-white/70" />
          </div>

          <div className="mb-8">
            <p className="text-white/80 text-sm mb-3 font-medium">Carte Cadeau DeezLink</p>
            {isEditing ? (
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="5"
                  max="500"
                  className="text-6xl font-bold text-white bg-white/10 border-2 border-white/30 rounded-xl px-4 py-2 w-40 tabular-nums backdrop-blur-sm focus:border-white/50 focus:outline-none"
                />
                <span className="text-6xl font-bold text-white ml-2">€</span>
              </div>
            ) : (
              <p className="text-6xl font-bold text-white tabular-nums drop-shadow-lg">
                {amount > 0 ? `${amount.toFixed(0)}€` : "—"}
              </p>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-white/70 text-xs mb-2 block font-medium">Pour</label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom du destinataire"
                  className="w-full bg-white/10 border-2 border-white/30 text-white rounded-xl px-4 py-3 text-lg font-semibold backdrop-blur-sm placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-white/70 text-xs mb-2 block font-medium">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Votre message personnel..."
                  maxLength={200}
                  rows={3}
                  className="w-full bg-white/10 border-2 border-white/30 text-white rounded-xl px-4 py-3 text-sm backdrop-blur-sm placeholder:text-white/40 focus:border-white/50 focus:outline-none resize-none"
                />
                <p className="text-white/60 text-xs mt-1">{message.length}/200</p>
              </div>
            </div>
          ) : (
            <>
              {recipientName && (
                <div className="mb-6">
                  <p className="text-white/60 text-xs mb-1 font-medium">Pour</p>
                  <p className="text-white font-bold text-2xl drop-shadow">{recipientName}</p>
                </div>
              )}

              {message && (
                <div className="glass backdrop-blur-md rounded-xl p-4 mb-6 border border-white/20">
                  <p className="text-white/90 text-sm italic leading-relaxed">"{message}"</p>
                </div>
              )}
            </>
          )}

          <div className="mt-8 pt-6 border-t border-white/30 flex items-center justify-between">
            <p className="text-white/70 text-xs font-medium">Valable 12 mois • Deezer Premium</p>
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  onValidate();
                }}
                disabled={loading}
                className="px-6 py-2.5 bg-white text-accent font-bold rounded-xl hover:bg-white/90 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    {lang === "fr" ? "Création..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    {lang === "fr" ? "Valider" : "Validate"}
                  </>
                )}
              </button>
            )}
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
