import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useInView } from "framer-motion";
import axios from "axios";
import { Slider } from "@/components/ui/slider";
import { ArrowRight, ChevronDown, ChevronUp, Zap, Shield, Clock, Check } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TIERS = [
  { min: 1, max: 9, price: "5,00" },
  { min: 10, max: 49, price: "3,50" },
  { min: 50, max: 99, price: "3,00" },
  { min: 100, max: 199, price: "2,00" },
  { min: 200, max: 499, price: "1,80" },
  { min: 500, max: null, price: "1,50" },
];

/* Scroll-reveal wrapper — fades in + slides up when entering viewport */
function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}>
      {children}
    </motion.div>
  );
}

/* Interactive card — lifts on hover */
function Card({ children, className = "", highlighted = false, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`bg-surface border rounded-xl transition-colors duration-200 ${highlighted ? "border-accent/40 hover:border-accent/60" : "border-border hover:border-border-hover"} ${onClick ? "cursor-pointer" : ""} ${className}`}>
      {children}
    </motion.div>
  );
}

/* CTA button with micro-interaction */
function CTA({ children, onClick, className = "", full = false }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-white font-medium rounded-lg transition-colors ${full ? "w-full" : ""} ${className}`}>
      {children}
    </motion.button>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const lang = i18n.language || "fr";
  const [packs, setPacks] = useState([]);
  const [customQty, setCustomQty] = useState(25);
  const [pricing, setPricing] = useState(null);
  const [stats, setStats] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [deezer, setDeezer] = useState({ artists: [] });

  useEffect(() => {
    axios.get(`${API}/packs`).then((r) => setPacks(r.data.packs || r.data)).catch(() => {});
    axios.get(`${API}/stats/public`).then((r) => setStats(r.data)).catch(() => {});
    axios.get(`${API}/deezer/trending`).then((r) => setDeezer(r.data)).catch(() => {});
  }, []);

  const fetchPricing = useCallback(() => {
    const timer = setTimeout(() => {
      axios.get(`${API}/pricing/calculate?quantity=${customQty}`).then((r) => setPricing(r.data)).catch(() => {});
    }, 80);
    return () => clearTimeout(timer);
  }, [customQty]);
  useEffect(fetchPricing, [fetchPricing]);

  const faqs = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
  ];

  const ordersDelivered = stats?.orders || 0;

  const scrollToPacks = () => document.getElementById("packs")?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="max-w-6xl mx-auto px-5 md:px-8">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="pt-14 pb-16 md:pt-20 md:pb-24 grid md:grid-cols-5 gap-10 md:gap-14 items-start">
        {/* Left — 3 cols */}
        <div className="md:col-span-3 pt-2">
          <Reveal>
            <p className="text-accent text-[13px] font-medium tracking-wide mb-4">Deezer Premium</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-t-primary font-semibold text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.08] tracking-tight mb-5">
              {lang === "fr" ? (
                <>Liens d'activation<br />à partir de <span className="text-green">1,50€</span></>
              ) : lang === "ar" ? (
                <>روابط التفعيل<br />ابتداءً من <span className="text-green">1,50€</span></>
              ) : (
                <>Activation links<br />starting at <span className="text-green">1,50€</span></>
              )}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-t-secondary text-[15px] leading-relaxed mb-8 max-w-lg">
              {lang === "fr"
                ? "Achetez des liens d'activation Deezer Premium à prix dégressif. Livraison instantanée par email. Paiement crypto accepté — BTC, ETH, USDT, LTC."
                : lang === "ar"
                ? "اشترِ روابط تفعيل Deezer Premium بأسعار تنازلية. توصيل فوري عبر البريد. الدفع بالعملات الرقمية."
                : "Buy Deezer Premium activation links at volume discounts. Instant email delivery. Crypto payment accepted — BTC, ETH, USDT, LTC."}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap items-center gap-4 mb-8">
              <CTA onClick={scrollToPacks} className="text-[14px] px-7 py-3.5">
                {t("hero_cta")} <ArrowRight className="h-4 w-4" />
              </CTA>
              {ordersDelivered > 0 && (
                <span className="text-t-muted text-[13px]">
                  {ordersDelivered.toLocaleString()} {lang === "fr" ? "commandes livrées" : "orders delivered"}
                </span>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Zap, text: lang === "fr" ? "Livraison instantanée" : "Instant delivery" },
                { icon: Shield, text: lang === "fr" ? "Paiement sécurisé" : "Secure payment" },
                { icon: Clock, text: lang === "fr" ? "Garanti 30 jours" : "30-day guarantee" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3.5 py-2 text-[12px] text-t-secondary">
                  <item.icon className="h-3.5 w-3.5 text-t-muted" /> {item.text}
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Right — 2 cols : pricing table */}
        <Reveal delay={0.1} className="md:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
              <span className="text-[13px] text-t-primary font-medium">
                {lang === "fr" ? "Grille tarifaire" : lang === "ar" ? "جدول الأسعار" : "Volume pricing"}
              </span>
              <span className="text-accent text-[11px] font-medium bg-accent-dim px-2 py-0.5 rounded">
                {lang === "fr" ? "Jusqu'à -70%" : "Up to -70%"}
              </span>
            </div>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border text-t-muted">
                  <th className="text-left font-normal px-5 py-2.5">{lang === "fr" ? "Quantité" : "Qty"}</th>
                  <th className="text-right font-normal px-5 py-2.5">{lang === "fr" ? "Prix / lien" : "Price / link"}</th>
                </tr>
              </thead>
              <tbody>
                {TIERS.map((tier, i) => {
                  const isLast = i === TIERS.length - 1;
                  return (
                    <tr key={i} className={`border-b border-border last:border-0 ${isLast ? "bg-green-dim" : "hover:bg-surface-2"} transition-colors`}>
                      <td className="px-5 py-3 text-t-secondary">
                        {tier.max ? `${tier.min} – ${tier.max}` : `${tier.min}+`}
                      </td>
                      <td className={`px-5 py-3 text-right tabular-nums font-medium ${isLast ? "text-green" : "text-t-primary"}`}>
                        {tier.price}€
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </Reveal>
      </section>

      {/* ═══════════════ ARTISTS BAR ═══════════════ */}
      {deezer.artists?.length > 0 && (
        <Reveal>
          <section className="pb-16 md:pb-20">
            <p className="text-t-muted text-[11px] uppercase tracking-widest mb-4">
              {lang === "fr" ? "Disponible sur Deezer Premium" : "Available on Deezer Premium"}
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {deezer.artists.slice(0, 10).map((artist) => (
                <div key={artist.id} className="flex items-center gap-2.5 bg-surface border border-border rounded-lg px-3 py-2 shrink-0 hover:border-border-hover transition-colors">
                  <img src={artist.picture} alt={artist.name} className="w-7 h-7 rounded-full object-cover" loading="lazy" />
                  <span className="text-[12px] text-t-secondary whitespace-nowrap">{artist.name}</span>
                </div>
              ))}
            </div>
          </section>
        </Reveal>
      )}

      {/* ═══════════════ PACKS ═══════════════ */}
      <section id="packs" className="pb-16 md:pb-24">
        <Reveal>
          <h2 className="text-t-primary font-semibold text-[22px] mb-2">
            {lang === "fr" ? "Choisir un pack" : lang === "ar" ? "اختر باقة" : "Choose a pack"}
          </h2>
          <p className="text-t-muted text-[13px] mb-8">
            {lang === "fr" ? "Plus vous achetez, moins vous payez par lien." : "The more you buy, the less you pay per link."}
          </p>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {packs.filter(p => p.id !== "custom").map((pack, i) => {
            const name = t(pack.name_key);
            const hasDiscount = pack.discount > 0;
            return (
              <Reveal key={pack.id} delay={i * 0.08}>
                <Card highlighted={pack.highlighted} className="p-5 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-t-primary font-medium text-[15px]">{name}</p>
                      <p className="text-t-muted text-[12px] mt-0.5">
                        {pack.quantity} {lang === "fr" ? (pack.quantity > 1 ? "liens" : "lien") : (pack.quantity > 1 ? "links" : "link")} · Deezer Premium
                      </p>
                    </div>
                    {hasDiscount && (
                      <span className="text-green text-[11px] font-medium bg-green-dim px-2 py-0.5 rounded">-{pack.discount}%</span>
                    )}
                  </div>

                  {hasDiscount && (
                    <p className="text-t-muted text-[12px] mb-2">{pack.unit_price.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}</p>
                  )}

                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <span className="text-t-primary font-semibold text-[28px] tabular-nums leading-none">{pack.price.toFixed(0)}€</span>
                    <CTA onClick={() => navigate(`/checkout/${pack.id}`)} className="text-[13px] px-5 py-2.5">
                      {lang === "fr" ? "Acheter" : "Buy"} <ArrowRight className="h-3.5 w-3.5" />
                    </CTA>
                  </div>
                </Card>
              </Reveal>
            );
          })}

          {/* Custom */}
          <Reveal delay={0.16}>
            <Card className="p-5 flex flex-col h-full">
              <div className="mb-3">
                <p className="text-t-primary font-medium text-[15px]">{lang === "fr" ? "Sur mesure" : "Custom"}</p>
                <p className="text-t-muted text-[12px] mt-0.5">{lang === "fr" ? "Choisis la quantité exacte" : "Pick your exact quantity"}</p>
              </div>

              <div className="my-4">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-t-muted text-[12px]">{lang === "fr" ? "Liens" : "Links"}</span>
                  <span className="text-accent font-semibold text-[22px] tabular-nums">{customQty}</span>
                </div>
                <Slider value={[customQty]} min={1} max={1000} step={1} onValueChange={([v]) => setCustomQty(v)} />
                <div className="flex justify-between text-[10px] text-t-muted mt-1.5 tabular-nums"><span>1</span><span>1000</span></div>
              </div>

              {pricing && (
                <div className="flex items-center justify-between text-[12px] mb-2">
                  <span className="text-t-muted">{pricing.unit_price?.toFixed(2)}€ / {lang === "fr" ? "lien" : "link"}</span>
                  {pricing.savings > 0 && <span className="text-green font-medium">-{pricing.savings?.toFixed(0)}€ {lang === "fr" ? "d'économie" : "saved"}</span>}
                </div>
              )}

              <div className="mt-auto pt-4 flex items-end justify-between">
                <span className="text-t-primary font-semibold text-[28px] tabular-nums leading-none">
                  {pricing ? `${pricing.total?.toFixed(0)}€` : "—"}
                </span>
                <CTA onClick={() => navigate(`/checkout/custom?qty=${customQty}`)} className="text-[13px] px-5 py-2.5">
                  {lang === "fr" ? "Acheter" : "Buy"} <ArrowRight className="h-3.5 w-3.5" />
                </CTA>
              </div>
            </Card>
          </Reveal>
        </div>

        {/* Crypto payment note */}
        <Reveal delay={0.2}>
          <div className="flex flex-wrap items-center justify-between bg-surface border border-border rounded-xl px-5 py-4">
            <div className="flex items-center gap-3 text-[13px] text-t-secondary">
              <Shield className="h-4 w-4 text-t-muted shrink-0" />
              {lang === "fr" ? "Paiement sécurisé via" : "Secure payment via"} <span className="text-t-primary font-medium">OxaPay</span>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-t-muted font-mono">
              <span>BTC</span><span>ETH</span><span>USDT</span><span>LTC</span>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section className="pb-16 md:pb-24">
        <Reveal>
          <h2 className="text-t-primary font-semibold text-[22px] mb-8">{t("how_title")}</h2>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { num: "01", title: t("how_step1_title"), desc: t("how_step1_desc"), icon: Check },
            { num: "02", title: t("how_step2_title"), desc: t("how_step2_desc"), icon: Shield },
            { num: "03", title: t("how_step3_title"), desc: t("how_step3_desc"), icon: Zap },
          ].map((step, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <Card className="p-5 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-accent text-[11px] font-medium bg-accent-dim w-8 h-8 rounded-lg flex items-center justify-center">{step.num}</span>
                  <p className="text-t-primary font-medium text-[14px]">{step.title}</p>
                </div>
                <p className="text-t-secondary text-[13px] leading-relaxed">{step.desc}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ SOCIAL PROOF ═══════════════ */}
      <Reveal>
        <section className="pb-16 md:pb-24">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { value: ordersDelivered > 0 ? ordersDelivered.toLocaleString() : "500+", label: lang === "fr" ? "Commandes" : "Orders" },
              { value: stats?.links > 0 ? stats.links.toLocaleString() : "2,000+", label: lang === "fr" ? "Liens livrés" : "Links delivered" },
              { value: "< 1min", label: lang === "fr" ? "Temps de livraison" : "Delivery time" },
              { value: "30j", label: lang === "fr" ? "Garantie" : "Guarantee" },
            ].map((stat, i) => (
              <Card key={i} className="p-5 text-center">
                <p className="text-t-primary font-semibold text-[22px] tabular-nums">{stat.value}</p>
                <p className="text-t-muted text-[11px] mt-1">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>
      </Reveal>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="pb-16 md:pb-24">
        <Reveal>
          <h2 className="text-t-primary font-semibold text-[22px] mb-6">FAQ</h2>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="bg-surface border border-border rounded-xl divide-y divide-border overflow-hidden">
            {faqs.map((faq, i) => (
              <div key={i}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-surface-2 transition-colors">
                  <span className="text-t-primary text-[14px] font-medium pr-4">{faq.q}</span>
                  <motion.div animate={{ rotate: openFaq === i ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="h-4 w-4 text-t-muted shrink-0" />
                  </motion.div>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden">
                  <div className="px-5 pb-4">
                    <p className="text-t-secondary text-[13px] leading-relaxed">{faq.a}</p>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ═══════════════ BOTTOM CTA ═══════════════ */}
      <Reveal>
        <section className="pb-16 md:pb-20">
          <div className="bg-surface border border-border rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-t-primary font-semibold text-[18px] mb-1">{t("cta_title")}</h3>
              <p className="text-t-secondary text-[13px]">{t("cta_subtitle")}</p>
            </div>
            <CTA onClick={scrollToPacks} className="text-[14px] px-7 py-3.5 shrink-0">
              {t("hero_cta")} <ArrowRight className="h-4 w-4" />
            </CTA>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
