import "./BuyerVibeStrip.css";

const VIBE_LINES = [
  { emoji: "✨", text: "Fresh drops every week — grab your style before it's gone!" },
  { emoji: "🛍️", text: "Curated fashion, fair prices, and checkout in minutes." },
  { emoji: "💖", text: "Your wardrobe called — it wants a glow-up today!" },
  { emoji: "🔥", text: "Hot deals live now — scroll offers above and save big." },
  { emoji: "🚀", text: "Fast delivery vibes — shop smart, slay harder." },
  { emoji: "👗", text: "From casual to classy — find the fit that feels like you." },
];

const STICKERS = ["🌟", "💫", "🎀", "🏷️", "😍", "⭐"];

function BuyerVibeStrip() {
  return (
    <section className="buyer-vibe-strip" aria-label="Store highlights">
      <div className="buyer-vibe-stickers" aria-hidden>
        {STICKERS.map((s, i) => (
          <span key={i} className={`vibe-sticker vibe-sticker-${i + 1}`}>
            {s}
          </span>
        ))}
      </div>
      <div className="buyer-vibe-header">
        <h3>Why shoppers love us</h3>
        <p>Good vibes only — scroll down for today's best picks 👇</p>
      </div>
      <div className="buyer-vibe-grid">
        {VIBE_LINES.map((line, idx) => (
          <div key={idx} className="buyer-vibe-card">
            <span className="vibe-emoji" aria-hidden>
              {line.emoji}
            </span>
            <p>{line.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default BuyerVibeStrip;

