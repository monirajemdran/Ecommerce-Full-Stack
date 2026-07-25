import { useEffect, useState } from "react";
import axios from "axios";
import "./BuyerPromoBanner.css";

const FALLBACK_BANNER =
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1400&q=80";

function BuyerPromoBanner() {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/admin/banners/active")
      .then((res) => {
        const images = (res.data || []).map((b) => b.image).filter(Boolean);
        setSlides(images.length > 0 ? images : [FALLBACK_BANNER]);
      })
      .catch(() => setSlides([FALLBACK_BANNER]));
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="buyer-promo-banner" aria-label="Promotional banners">
      <div className="buyer-promo-track">
        {slides.map((src, idx) => (
          <img
            key={`${src}-${idx}`}
            src={src}
            alt="Store promotion"
            className={`buyer-promo-image ${idx === current ? "active" : ""}`}
            loading={idx === 0 ? "eager" : "lazy"}
          />
        ))}
        <div className="buyer-promo-overlay">
          <span className="buyer-promo-badge">✨ Trending Now</span>
          <h2>Discover Your Next Favorite Look</h2>
          <p>Premium picks · Limited deals · Style that speaks 🛍️</p>
        </div>
        {slides.length > 1 && (
          <div className="buyer-promo-dots">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={idx === current ? "active" : ""}
                aria-label={`Show banner ${idx + 1}`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default BuyerPromoBanner;
