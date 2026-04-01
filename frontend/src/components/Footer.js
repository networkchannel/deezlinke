export default function Footer() {
  return (
    <footer className="border-t border-border py-6">
      <div className="max-w-5xl mx-auto px-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-t-muted">
        <span>DeezLink &copy; {new Date().getFullYear()}</span>
        <div className="flex items-center gap-3">
          <span className="font-mono">BTC</span>
          <span className="font-mono">ETH</span>
          <span className="font-mono">USDT</span>
          <span className="font-mono">LTC</span>
        </div>
      </div>
    </footer>
  );
}
