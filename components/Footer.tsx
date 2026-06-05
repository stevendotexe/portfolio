export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <p className="footer-text">
            © {year} Steven Simbolon. All rights reserved.
          </p>
          <p className="footer-tagline">Interface. Outer Space.</p>
        </div>
      </div>
    </footer>
  );
}
