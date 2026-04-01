export default function Footer() {
  return (
    <footer className="border-t border-border glass backdrop-blur-xl py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-t-muted">
          <div className="flex items-center gap-2">
            <span className="text-t-primary font-bold">
              Deez<span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-secondary">Link</span>
            </span>
            <span>&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-t-muted">Paiement accepté</span>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="text-t-secondary">BTC</span>
              <span className="text-t-secondary">ETH</span>
              <span className="text-t-secondary">USDT</span>
              <span className="text-t-secondary">LTC</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
