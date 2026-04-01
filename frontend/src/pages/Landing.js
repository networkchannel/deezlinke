import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import axios from "axios";
import { ArrowRight, Sparkles, Zap, Shield, Clock, Users, User, ChevronDown, Play, Music } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

function GlassCard({ children, className = "", glow = false }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`glass glass-hover rounded-2xl ${glow ? "shadow-lg shadow-accent-glow" : ""} ${className}`}>
      {children}
    </motion.div>
  );
}

function ArtistCarousel({ artists, lang }) {
  const [isPaused, setIsPaused] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  
  return (
    <div 
      className="relative overflow-hidden"
      onMouseEnter={() => {
        setIsHovering(true);
        setTimeout(() => setIsPaused(true), 200);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
        setIsPaused(false);
      }}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}>
      <div className="flex gap-4">
        <motion.div
          className="flex gap-4 shrink-0"
          animate={{
            x: isPaused ? 0 : [0, -1600],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 50,
              ease: "linear",
            },
          }}>
          {[...artists, ...artists, ...artists].map((artist, i) => (
            <motion.div
              key={`${artist.id}-${i}`}
              className="shrink-0 w-32"
              whileHover={{ scale: 1.015 }}
              transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}>
              <div className="glass rounded-xl p-3 backdrop-blur-xl transition-all duration-300">
                <div className="mb-2 overflow-hidden rounded-lg">
                  <motion.img
                    src={artist.picture}
                    alt={artist.name}
                    className="w-full aspect-square object-cover"
                    loading="lazy"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                  />
                </div>
                <p className="text-xs font-semibold text-t-primary truncate">{artist.name}</p>
                <p className="text-[10px] text-t-muted">
                  {(artist.nb_fan / 1000000).toFixed(1)}M fans
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [packs, setPacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [deezer, setDeezer] = useState({ artists: [], tracks: [] });

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs || r.data)).catch(() => {});
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/deezer/trending`).then((r) => setDeezer(r.data)).catch(() => {});
  }, []);

  const faqs = [
    {
      q: lang === "fr" ? "Les liens fonctionnent-ils vraiment ?" : "Do the links really work?",
      a: lang === "fr"
        ? "Oui ! Chaque lien active Deezer Premium instantanément. Minimum 1 mois garanti, souvent bien plus. Cliquez simplement dessus connecté à votre compte Deezer."
        : "Yes! Each link activates Deezer Premium instantly. Minimum 1 month guaranteed, often much longer. Just click it while logged into your Deezer account.",
    },
    {
      q: lang === "fr" ? "Pourquoi c'est moins cher qu'ailleurs ?" : "Why is it cheaper than elsewhere?",
      a: lang === "fr"
        ? "Nous achetons en volume et répercutons les économies. Plus vous achetez, plus le prix unitaire baisse. C'est gagnant-gagnant !"
        : "We buy in volume and pass on the savings. The more you buy, the lower the unit price. It's win-win!",
    },
    {
      q: lang === "fr" ? "Puis-je vraiment payer en crypto ?" : "Can I really pay with crypto?",
      a: lang === "fr"
        ? "Absolument ! Nous acceptons BTC, ETH, USDT, LTC via OxaPay. Paiement sécurisé, anonyme et rapide."
        : "Absolutely! We accept BTC, ETH, USDT, LTC via OxaPay. Secure, anonymous and fast payment.",
    },
    {
      q: lang === "fr" ? "Que se passe-t-il si un lien ne fonctionne pas ?" : "What if a link doesn't work?",
      a: lang === "fr"
        ? "Contactez-nous dans les 48h et nous le remplacerons immédiatement. Garantie satisfait ou remboursé sous 30 jours."
        : "Contact us within 48h and we'll replace it immediately. 30-day money-back guarantee.",
    },
  ];

  const ordersDelivered = stats?.orders || 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Floating orbs */}
      <div className="orb-purple" style={{ top: "-10%", right: "-10%" }} />
      <div className="orb-pink" style={{ bottom: "10%", left: "-5%" }} />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        
        {/* ═══ HERO + TRENDING SECTION ═══ */}
        <section className="mb-16 sm:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* HERO - Left side */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="text-accent text-xs font-semibold tracking-wide uppercase">
                    Deezer Premium
                  </span>
                </div>
              </Reveal>

              <Reveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-[1.1]">
                  {lang === "fr" ? (
                    <>
                      Musique illimitée<br />
                      à partir de{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                        1,50€
                      </span>
                    </>
                  ) : (
                    <>
                      Unlimited music<br />
                      starting at{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">
                        1,50€
                      </span>
                    </>
                  )}
                </h1>
              </Reveal>

              <Reveal delay={0.2}>
                <p className="text-base sm:text-lg text-t-secondary max-w-2xl mb-8 leading-relaxed">
                  {lang === "fr"
                    ? "Accédez à Deezer Premium avec nos liens d'activation à prix dégressifs. Livraison instantanée • Paiement crypto sécurisé • Garantie 30 jours."
                    : "Access Deezer Premium with our volume-priced activation links. Instant delivery • Secure crypto payment • 30-day guarantee."}
                </p>
              </Reveal>

              <Reveal delay={0.3}>
                <div className="flex flex-wrap items-center gap-4 mb-8">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate("/offers")}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-all shadow-lg shadow-accent-glow">
                    {lang === "fr" ? "Voir les offres" : "View offers"}
                    <ArrowRight className="h-5 w-5" />
                  </motion.button>
                  {ordersDelivered > 0 && (
                    <div className="flex items-center gap-2 text-sm text-t-muted">
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span>
                        {ordersDelivered.toLocaleString()}{" "}
                        {lang === "fr" ? "commandes livrées" : "orders delivered"}
                      </span>
                    </div>
                  )}
                </div>
              </Reveal>

              <Reveal delay={0.4}>
                <div className="flex flex-wrap gap-3">
                  {[
                    { icon: Zap, text: lang === "fr" ? "Livraison instantanée" : "Instant delivery" },
                    { icon: Shield, text: lang === "fr" ? "Paiement sécurisé" : "Secure payment" },
                    { icon: Clock, text: lang === "fr" ? "Garanti 30 jours" : "30-day guarantee" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 glass rounded-lg px-4 py-2.5 text-sm text-t-secondary backdrop-blur-md">
                      <item.icon className="h-4 w-4 text-accent" />
                      {item.text}
                    </div>
                  ))}
                </div>
              </Reveal>
            </div>

            {/* TRENDING - Right side (Liquid Glass) */}
            <div className="lg:col-span-5">
              <Reveal delay={0.2}>
                <div className="glass backdrop-blur-xl rounded-2xl p-5 sm:p-6 h-full border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Music className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                    <h2 className="text-base sm:text-lg font-bold text-t-primary">
                      {lang === "fr" ? "Tendances" : "Trending"}
                    </h2>
                  </div>
                  <p className="text-xs text-t-muted mb-4 sm:mb-6">
                    {lang === "fr" ? "Écoutez-les en Premium" : "Listen in Premium"}
                  </p>

                  {/* Top Tracks Compact */}
                  {deezer.tracks?.length > 0 && (
                    <div className="space-y-2">
                      {deezer.tracks.slice(0, 4).map((track, i) => (
                        <div
                          key={track.id}
                          className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group">
                          <span className="text-xs font-bold text-t-muted w-4">{i + 1}</span>
                          <img
                            src={track.album_cover}
                            alt={track.album_title}
                            className="w-9 h-9 sm:w-10 sm:h-10 rounded-md object-cover"
                            loading="lazy"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-t-primary truncate">{track.title}</p>
                            <p className="text-[10px] text-t-muted truncate">{track.artist_name}</p>
                          </div>
                          {track.preview && (
                            <button className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 w-6 h-6 rounded-full glass flex items-center justify-center hover:bg-accent hover:text-white">
                              <Play className="h-2.5 w-2.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ═══ ARTISTS CAROUSEL AUTO-SCROLL ═══ */}
        {deezer.artists?.length > 0 && (
          <Reveal>
            <section className="mb-16 sm:mb-20">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-t-primary mb-1">
                  {lang === "fr" ? "Artistes populaires" : "Popular Artists"}
                </h2>
              </div>
              <ArtistCarousel artists={deezer.artists.slice(0, 12)} lang={lang} />
            </section>
          </Reveal>
        )}

        {/* ═══ PACKS MINIMAL ═══ */}
        <section className="mb-16 sm:mb-20">
          <Reveal>
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">
                {lang === "fr" ? "Nos offres" : "Our offers"}
              </h2>
              <p className="text-sm text-t-muted">
                {lang === "fr" ? "Choisissez votre pack" : "Choose your pack"}
              </p>
            </div>
          </Reveal>

          {/* Mobile: Horizontal Scroll */}
          <div className="md:hidden overflow-x-auto pb-4 mb-6 scrollbar-hide">
            <div className="flex gap-4 px-4 min-w-max">
              {packs.filter((p) => p.id !== "custom").map((pack, i) => {
                const name = t(pack.name_key);
                const isPopular = pack.highlighted;
                return (
                  <Reveal key={pack.id} delay={i * 0.08}>
                    <GlassCard glow={isPopular} className="p-6 relative text-center w-64 shrink-0">
                      {isPopular && (
                        <div className="absolute top-0 right-0 bg-gradient-to-br from-accent to-secondary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                          TOP
                        </div>
                      )}
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                          {pack.id === "solo" && <User className="h-6 w-6 text-accent" />}
                          {pack.id === "duo" && <Users className="h-6 w-6 text-accent" />}
                          {pack.id === "family" && <Users className="h-6 w-6 text-accent" />}
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-t-primary mb-1">{name}</h3>
                      <p className="text-xs text-t-muted mb-4">
                        {pack.quantity} {lang === "fr" ? (pack.quantity > 1 ? "liens" : "lien") : pack.quantity > 1 ? "links" : "link"}
                      </p>
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary tabular-nums mb-4">
                        {pack.price.toFixed(0)}€
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/checkout/${pack.id}`)}
                        className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-all">
                        {lang === "fr" ? "Choisir" : "Choose"}
                      </motion.button>
                    </GlassCard>
                  </Reveal>
                );
              })}
            </div>
          </div>

          {/* Desktop: Grid */}
          <div className="hidden md:grid grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
            {packs.filter((p) => p.id !== "custom").map((pack, i) => {
              const name = t(pack.name_key);
              const isPopular = pack.highlighted;
              return (
                <Reveal key={pack.id} delay={i * 0.08}>
                  <GlassCard glow={isPopular} className="p-6 relative text-center">
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-gradient-to-br from-accent to-secondary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
                        TOP
                      </div>
                    )}
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-12 h-12 rounded-xl glass flex items-center justify-center">
                        {pack.id === "solo" && <User className="h-6 w-6 text-accent" />}
                        {pack.id === "duo" && <Users className="h-6 w-6 text-accent" />}
                        {pack.id === "family" && <Users className="h-6 w-6 text-accent" />}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-t-primary mb-1">{name}</h3>
                    <p className="text-xs text-t-muted mb-4">
                      {pack.quantity} {lang === "fr" ? (pack.quantity > 1 ? "liens" : "lien") : pack.quantity > 1 ? "links" : "link"}
                    </p>
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary tabular-nums mb-4">
                      {pack.price.toFixed(0)}€
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/checkout/${pack.id}`)}
                      className="w-full px-4 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-lg transition-all">
                      {lang === "fr" ? "Choisir" : "Choose"}
                    </motion.button>
                  </GlassCard>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.2}>
            <div className="text-center">
              <button
                onClick={() => navigate("/offers")}
                className="text-sm text-t-muted hover:text-t-primary transition-colors">
                {lang === "fr" ? "Voir toutes les offres et tarifs dégressifs" : "View all offers and volume pricing"}{" "}
                <span className="text-accent">→</span>
              </button>
            </div>
          </Reveal>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="mb-16 sm:mb-20">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">{t("how_title")}</h2>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { num: "01", title: t("how_step1_title"), desc: t("how_step1_desc") },
              { num: "02", title: t("how_step2_title"), desc: t("how_step2_desc") },
              { num: "03", title: t("how_step3_title"), desc: t("how_step3_desc") },
            ].map((step, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <GlassCard className="p-6 relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 text-[120px] font-bold text-white opacity-[0.03] leading-none select-none">
                    {step.num}
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-accent bg-accent-glow w-8 h-8 rounded-lg flex items-center justify-center">
                        {step.num}
                      </span>
                      <h3 className="text-base font-semibold text-t-primary">{step.title}</h3>
                    </div>
                    <p className="text-sm text-t-secondary leading-relaxed">{step.desc}</p>
                  </div>
                </GlassCard>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <Reveal>
          <section className="mb-16 sm:mb-20">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {[
                {
                  value: ordersDelivered > 0 ? ordersDelivered.toLocaleString() : "500+",
                  label: lang === "fr" ? "Commandes" : "Orders",
                },
                {
                  value: stats?.links > 0 ? stats.links.toLocaleString() : "2,000+",
                  label: lang === "fr" ? "Liens livrés" : "Links delivered",
                },
                { value: "< 1min", label: lang === "fr" ? "Livraison" : "Delivery" },
                { value: "30j", label: lang === "fr" ? "Garantie" : "Guarantee" },
              ].map((stat, i) => (
                <GlassCard key={i} className="p-5 text-center">
                  <p className="text-2xl font-bold text-t-primary tabular-nums mb-1">{stat.value}</p>
                  <p className="text-xs text-t-muted uppercase tracking-wide">{stat.label}</p>
                </GlassCard>
              ))}
            </div>
          </section>
        </Reveal>

        {/* ═══ FAQ ORIGINALE ═══ */}
        <section className="mb-16 sm:mb-20 max-w-3xl mx-auto">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
              {lang === "fr" ? "Questions fréquentes" : "FAQ"}
            </h2>
          </Reveal>
          <Reveal delay={0.05}>
            <GlassCard className="divide-y divide-border overflow-hidden">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-surface-hover transition-colors">
                    <span className="text-sm font-medium text-t-primary pr-4">{faq.q}</span>
                    <motion.div
                      animate={{ rotate: openFaq === i ? 180 : 0 }}
                      transition={{ duration: 0.3 }}>
                      <ChevronDown className="h-5 w-5 text-t-muted shrink-0" />
                    </motion.div>
                  </button>
                  <motion.div
                    initial={false}
                    animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden">
                    <div className="px-6 pb-5">
                      <p className="text-sm text-t-secondary leading-relaxed">{faq.a}</p>
                    </div>
                  </motion.div>
                </div>
              ))}
            </GlassCard>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
