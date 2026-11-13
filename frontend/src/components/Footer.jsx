import React from "react";
import { ArrowRight, Check, Instagram } from "lucide-react";
import { useStorefront } from "../context/StorefrontContext.jsx";
import MotionFooter from "./ui/motion-footer.jsx";
export default function Footer() {
  const { go, notify, email, setEmail, subscribed, setSubscribed } =
    useStorefront();
  return (
    <MotionFooter onExplore={() => go("shop")}>
      <div className="footer-main">
        <div className="footer-brand">
          <button className="wordmark footer-logo" onClick={() => go("home")}>
            GAZU
          </button>
          <p>Thoughtful essentials for wherever life takes you.</p>
          <div className="socials">
            <a href="https://instagram.com" aria-label="Instagram">
              <Instagram />
            </a>
            <span>IN / OUT / EVERYDAY</span>
          </div>
        </div>
        <nav className="gazu-footer-nav" aria-label="Explore collections">
          <h4>EXPLORE</h4>
          <button onClick={() => go("shop", "Men")}>Men</button>
          <button onClick={() => go("shop", "Women")}>Women</button>
          <button onClick={() => go("shop", "Kids")}>Kids</button>
          <button onClick={() => go("shop", "Accessories")}>Accessories</button>
          <button onClick={() => go("shop-the-look")}>Shop the Look</button>
          <button onClick={() => go("style-finder")}>Style Finder</button>
          <button onClick={() => go("launches")}>New Launches</button>
        </nav>
        <nav className="gazu-footer-nav" aria-label="Help and support">
          <h4>HELP</h4>
          <button onClick={() => go("help")}>Contact us</button>
          <button onClick={() => go("track")}>Track order</button>
          <button onClick={() => go("help")}>Shipping & returns</button>
          <button onClick={() => go("help")}>FAQs</button>
        </nav>
        <div className="newsletter">
          <h4>NOTES FROM GAZU</h4>
          <p>Demo newsletter preview — subscriptions are not sent or stored.</p>
          {subscribed ? (
            <div className="success">
              <Check size={17} /> DEMO PREVIEW COMPLETE
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (email.includes("@")) {
                  setSubscribed(true);
                  notify("Demo preview only — no subscription was sent");
                }
              }}
            >
              <input
                type="email"
                required
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button aria-label="Subscribe">
                <ArrowRight />
              </button>
            </form>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>© 2026 GAZU STUDIO</span>
        <span>MADE FOR EVERYDAY, MADE TO LAST</span>
        <div>
          <button onClick={() => go("help")}>PRIVACY</button>
          <button onClick={() => go("help")}>TERMS</button>
        </div>
      </div>
    </MotionFooter>
  );
}
