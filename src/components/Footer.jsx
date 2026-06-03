// components/Footer.jsx
export default function Footer() {
  return (
    <footer style={{
      background: "var(--primary)",
      color: "rgba(255,255,255,.7)",
      padding: "48px 0 24px",
      marginTop: "80px",
    }}>
      <div className="container">
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:32, marginBottom:40 }}>
          <div>
            <h3 style={{ fontFamily:"var(--font-display)", color:"#fff", marginBottom:12 }}>🛍️ ShopEase</h3>
            <p style={{ fontSize:".88rem", lineHeight:1.7 }}>Your one-stop destination for quality products at great prices.</p>
          </div>
          <div>
            <h4 style={{ color:"#fff", fontWeight:600, marginBottom:12 }}>Shop</h4>
            <ul style={{ display:"flex", flexDirection:"column", gap:8, fontSize:".88rem" }}>
              {["Electronics","Clothing","Footwear","Accessories"].map(c => (
                <li key={c}><a href={`/?category=${c}`} style={{ color:"rgba(255,255,255,.7)" }}>{c}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color:"#fff", fontWeight:600, marginBottom:12 }}>Account</h4>
            <ul style={{ display:"flex", flexDirection:"column", gap:8, fontSize:".88rem" }}>
              {[["My Orders","/orders"],["Cart","/cart"],["Sign In","/login"]].map(([l,h]) => (
                <li key={l}><a href={h} style={{ color:"rgba(255,255,255,.7)" }}>{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 style={{ color:"#fff", fontWeight:600, marginBottom:12 }}>Support</h4>
            <ul style={{ display:"flex", flexDirection:"column", gap:8, fontSize:".88rem" }}>
              {["FAQ","Returns","Shipping","Contact Us"].map(i => (
                <li key={i} style={{ color:"rgba(255,255,255,.7)" }}>{i}</li>
              ))}
            </ul>
          </div>
        </div>
        <div style={{ borderTop:"1px solid rgba(255,255,255,.1)", paddingTop:24, textAlign:"center", fontSize:".82rem" }}>
          © {new Date().getFullYear()} ShopEase. Built with React + Spring Boot.
        </div>
      </div>
    </footer>
  );
}
