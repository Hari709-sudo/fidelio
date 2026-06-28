import { useState, useEffect, useCallback } from "react";

const SUPABASE_URL = "https://pmhwxagtqjbzryhnqyxx.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtaHd4YWd0cWpienJ5aG5xeXh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1OTc0MzMsImV4cCI6MjA5ODE3MzQzM30.Mz2xdLXXfmOdAqnrbOJQ-BUkUaKa2eBY7cPVF3-ftMw";

const sb = async (path, opts = {}) => {
  const method = opts.method || "GET";
  const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
  };
  if (method === "POST") headers["Prefer"] = "return=representation";
  if (method === "PATCH") headers["Prefer"] = "return=minimal";

  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: opts.body || undefined,
  });

  const text = await res.text();
  if (!res.ok) throw new Error(text);
  return text ? JSON.parse(text) : [];
};

function QRCode({ value, color = "#C9A84C", size = 140 }) {
  const cells = 13;
  const cell = size / cells;
  const seed = value.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
  const isCorner = (r, c) =>
    (r < 4 && c < 4) || (r < 4 && c >= cells - 4) || (r >= cells - 4 && c < 4);
  const grid = Array.from({ length: cells * cells }, (_, i) => {
    const r = i % cells, c = Math.floor(i / cells);
    if (isCorner(r, c)) return true;
    return ((seed * (i + 13) * 7 + i * 41 + r * 3 + c * 11) % 19) > 8;
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="white" rx={8} />
      {grid.map((filled, i) => {
        const cx = (i % cells) * cell + 1;
        const cy = Math.floor(i / cells) * cell + 1;
        return filled ? <rect key={i} x={cx} y={cy} width={cell - 2} height={cell - 2} fill={color} rx={1.5} /> : null;
      })}
    </svg>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ background: "#1E1E2A", borderRadius: 99, height: 7, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.5s ease" }} />
    </div>
  );
}

function StampGrid({ current, goal, color }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {Array.from({ length: goal }, (_, i) => (
        <div key={i} style={{
          width: 30, height: 30, borderRadius: "50%",
          border: `2px solid ${i < current ? color : "#2A2A38"}`,
          background: i < current ? color : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: "#000", fontWeight: 700,
        }}>
          {i < current ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

function Toast({ msg, color }) {
  return (
    <div style={{
      position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
      background: color, color: "#000", fontWeight: 700, fontSize: 14,
      borderRadius: 12, padding: "12px 20px", zIndex: 999, whiteSpace: "nowrap",
      boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
    }}>{msg}</div>
  );
}

function ClientCard({ card, business, clientName, onBack }) {
  const val = business.mode === "visits" ? card.visits : card.points;
  const isComplete = val >= business.goal;
  const cardId = `${(card.client_id || "").slice(0, 6)}-${(card.business_id || "").slice(0, 6)}`;
  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff", fontFamily: "'Inter',sans-serif", padding: 20 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", marginBottom: 20 }}>← Retour</button>
      <div style={{ background: "linear-gradient(135deg,#1A1A24,#12121A)", borderRadius: 20, padding: 24, marginBottom: 16, border: `1px solid ${business.color}44`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 180, height: 180, borderRadius: "50%", background: business.color, opacity: 0.07, filter: "blur(50px)" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{business.logo}</div>
            <div style={{ fontWeight: 700, fontSize: 17 }}>{business.name}</div>
            <div style={{ color: "#555", fontSize: 12 }}>Carte fidélité · {clientName}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: business.color, fontWeight: 800, fontSize: 30 }}>{val}</div>
            <div style={{ color: "#444", fontSize: 12 }}>/ {business.goal} {business.mode === "visits" ? "visites" : "pts"}</div>
          </div>
        </div>
        {business.mode === "visits" && business.goal <= 12
          ? <StampGrid current={card.visits} goal={business.goal} color={business.color} />
          : <ProgressBar value={val} max={business.goal} color={business.color} />
        }
        <div style={{ background: "#0A0A0F", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
          <span style={{ fontSize: 18 }}>🎁</span>
          <div>
            <div style={{ fontSize: 11, color: "#444" }}>Récompense</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: isComplete ? business.color : "#fff" }}>
              {isComplete ? `✅ ${business.reward} disponible !` : business.reward}
            </div>
          </div>
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 13, color: "#333", fontWeight: 600 }}>Présenter en caisse</div>
        <QRCode value={cardId} color={business.color} size={150} />
        <div style={{ fontSize: 11, color: "#999", letterSpacing: "0.05em" }}>{cardId.toUpperCase()}</div>
      </div>
    </div>
  );
}

function Dashboard({ business, onBack }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [scannedId, setScannedId] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const loadCards = useCallback(async () => {
    try {
      const data = await sb(`loyalty_cards?business_id=eq.${business.id}&select=*,clients(name,phone)`);
      setCards(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [business.id]);

  useEffect(() => { loadCards(); }, [loadCards]);

  async function handleScan() {
    if (!scannedId.trim()) return;
    const prefix = scannedId.trim().split("-")[0];
    try {
      const clients = await sb(`clients?id=like.${prefix}*`);
      if (!clients.length) { showToast("❌ Client introuvable"); return; }
      const client = clients[0];
      const existing = await sb(`loyalty_cards?client_id=eq.${client.id}&business_id=eq.${business.id}`);
      if (!existing.length) { showToast("❌ Pas de carte pour ce client"); return; }
      const card = existing[0];
      const update = business.mode === "visits" ? { visits: card.visits + 1 } : { points: card.points + 10 };
      await sb(`loyalty_cards?id=eq.${card.id}`, { method: "PATCH", body: JSON.stringify(update) });
      showToast(`✅ ${client.name} — ${business.mode === "visits" ? "visite enregistrée !" : "+10 pts ajoutés !"}`);
      setScannedId("");
      setShowScanner(false);
      loadCards();
    } catch (e) { showToast("❌ Erreur : " + e.message); }
  }

  async function handleAddClient() {
    if (!newName.trim()) return;
    try {
      const clientData = { name: newName.trim() };
      if (newPhone.trim()) clientData.phone = newPhone.trim();
      const created = await sb("clients", { method: "POST", body: JSON.stringify(clientData) });
      const client = Array.isArray(created) ? created[0] : created;
      await sb("loyalty_cards", { method: "POST", body: JSON.stringify({ client_id: client.id, business_id: business.id }) });
      showToast(`✅ ${newName} ajouté !`);
      setNewName(""); setNewPhone(""); setShowAdd(false);
      loadCards();
    } catch (e) { showToast("❌ Erreur : " + e.message); }
  }

  const ready = cards.filter(c => business.mode === "visits" ? c.visits >= business.goal : c.points >= business.goal);

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff", fontFamily: "'Inter',sans-serif" }}>
      {toast && <Toast msg={toast} color={business.color} />}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 22, cursor: "pointer" }}>‹</button>
        <div style={{ fontSize: 24 }}>{business.logo}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{business.name}</div>
          <div style={{ color: "#555", fontSize: 12 }}>{cards.length} clients</div>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ marginLeft: "auto", background: business.color, color: "#000", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          + Client
        </button>
      </div>
      <div style={{ display: "flex", gap: 10, padding: "16px 20px" }}>
        {[{ label: "Clients", value: cards.length, icon: "👥" }, { label: "Récompenses", value: ready.length, icon: "🎁" }].map(s => (
          <div key={s.label} style={{ flex: 1, background: "#13131A", borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontWeight: 800, fontSize: 24, color: business.color }}>{s.value}</div>
            <div style={{ color: "#555", fontSize: 12 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 20px 16px" }}>
        <div onClick={() => setShowScanner(true)} style={{ background: business.color, borderRadius: 14, padding: "16px 0", textAlign: "center", fontWeight: 800, fontSize: 16, color: "#000", cursor: "pointer" }}>
          📷  Scanner un client
        </div>
      </div>
      <div style={{ padding: "0 20px 40px" }}>
        <div style={{ color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 10 }}>CLIENTS</div>
        {loading && <div style={{ color: "#444", textAlign: "center", padding: 40 }}>Chargement...</div>}
        {!loading && cards.length === 0 && <div style={{ color: "#333", textAlign: "center", padding: 40 }}>Aucun client — ajoutez-en un !</div>}
        {cards.map(c => {
          const val = business.mode === "visits" ? c.visits : c.points;
          const done = val >= business.goal;
          return (
            <div key={c.id} style={{ background: "#13131A", borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: `1px solid ${done ? business.color + "55" : "transparent"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{c.clients?.name}</div>
                  {c.clients?.phone && <div style={{ color: "#444", fontSize: 12 }}>{c.clients.phone}</div>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {done && <span style={{ fontSize: 11, color: business.color, fontWeight: 700 }}>🎁 Dispo</span>}
                  <span style={{ color: business.color, fontWeight: 800, fontSize: 16 }}>{val}</span>
                  <span style={{ color: "#333", fontSize: 12 }}>/ {business.goal}</span>
                </div>
              </div>
              <ProgressBar value={val} max={business.goal} color={business.color} />
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#13131A", borderRadius: "20px 20px 0 0", padding: 28, width: "100%" }}>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 16 }}>Nouveau client</div>
            <input placeholder="Nom et prénom *" value={newName} onChange={e => setNewName(e.target.value)}
              style={{ width: "100%", background: "#1E1E2A", border: `1px solid ${business.color}44`, borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box", marginBottom: 12 }} />
            <input placeholder="Téléphone (facultatif)" value={newPhone} onChange={e => setNewPhone(e.target.value)}
              style={{ width: "100%", background: "#1E1E2A", border: `1px solid ${business.color}44`, borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box", marginBottom: 14 }} />
            <div onClick={handleAddClient} style={{ background: business.color, color: "#000", fontWeight: 700, borderRadius: 12, padding: "14px 0", textAlign: "center", cursor: "pointer" }}>
              Ajouter le client
            </div>
            <button onClick={() => setShowAdd(false)} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", padding: 10 }}>
              Annuler
            </button>
          </div>
        </div>
      )}

      {showScanner && (
        <div style={{ position: "fixed", inset: 0, background: "#000000EE", zIndex: 200, display: "flex", alignItems: "flex-end" }}>
          <div style={{ background: "#13131A", borderRadius: "20px 20px 0 0", padding: 28, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 18 }}>Scanner le QR du client</div>
              <div style={{ color: "#555", fontSize: 13, marginTop: 4 }}>Entrez l'ID affiché sous le QR code</div>
            </div>
            <input placeholder="Ex: abc123-def456" value={scannedId} onChange={e => setScannedId(e.target.value)}
              style={{ width: "100%", background: "#1E1E2A", border: `1px solid ${business.color}55`, borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box", marginBottom: 14 }} />
            <div onClick={handleScan} style={{ background: business.color, color: "#000", fontWeight: 700, borderRadius: 12, padding: "14px 0", textAlign: "center", cursor: "pointer", marginBottom: 10 }}>
              Valider ✓
            </div>
            <button onClick={() => setShowScanner(false)} style={{ width: "100%", background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", padding: 10 }}>
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("home");
  const [mode, setMode] = useState("merchant");
  const [businesses, setBusinesses] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNewBiz, setShowNewBiz] = useState(false);
  const [toast, setToast] = useState(null);
  const [myPhone, setMyPhone] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [bizForm, setBizForm] = useState({ name: "", type: "barber", logo: "✂️", color: "#C9A84C", mode: "visits", goal: 10, reward: "" });

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  useEffect(() => { loadBusinesses(); }, []);

  async function loadBusinesses() {
    try {
      const data = await sb("businesses?select=*&order=created_at.asc");
      setBusinesses(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function loadMyCards(phone) {
    try {
      const clients = await sb(`clients?phone=eq.${encodeURIComponent(phone)}`);
      if (!clients.length) { showToast("❌ Aucun compte trouvé"); return; }
      const client = clients[0];
      const cards = await sb(`loyalty_cards?client_id=eq.${client.id}&select=*,businesses(*)`);
      setMyCards(cards.map(c => ({ ...c, clientName: client.name })));
      setMyPhone(phone);
    } catch (e) { showToast("❌ Erreur : " + e.message); }
  }

  async function handleAddBusiness() {
    if (!bizForm.name.trim() || !bizForm.reward.trim()) {
      showToast("❌ Remplis le nom et la récompense");
      return;
    }
    try {
      const payload = {
        name: bizForm.name.trim(),
        type: bizForm.type,
        logo: bizForm.logo,
        color: bizForm.color,
        mode: bizForm.mode,
        goal: Number(bizForm.goal),
        reward: bizForm.reward.trim(),
      };
      await sb("businesses", { method: "POST", body: JSON.stringify(payload) });
      showToast(`✅ ${bizForm.name} créé !`);
      setShowNewBiz(false);
      setBizForm({ name: "", type: "barber", logo: "✂️", color: "#C9A84C", mode: "visits", goal: 10, reward: "" });
      loadBusinesses();
    } catch (e) { showToast("❌ Erreur : " + e.message); }
  }

  if (view === "dashboard" && selectedBusiness) {
    return <Dashboard business={selectedBusiness} onBack={() => { setView("home"); loadBusinesses(); }} />;
  }
  if (view === "card" && selectedCard) {
    return <ClientCard card={selectedCard} business={selectedCard.businesses} clientName={selectedCard.clientName} onBack={() => setView("home")} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0F", color: "#fff", fontFamily: "'Inter',sans-serif", padding: 20 }}>
      {toast && <Toast msg={toast} color="#C9A84C" />}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", color: "#333", fontWeight: 700, marginBottom: 6 }}>FIDELIO</div>
        <div style={{ fontSize: 26, fontWeight: 800 }}>Cartes fidélité</div>
        <div style={{ color: "#333", fontSize: 13, marginTop: 4 }}>Barber · Restaurant · Commerce</div>
      </div>
      <div style={{ display: "flex", background: "#13131A", borderRadius: 12, padding: 4, marginBottom: 24 }}>
        {["merchant", "client"].map(m => (
          <div key={m} onClick={() => setMode(m)} style={{
            flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 9,
            fontWeight: 700, fontSize: 14, cursor: "pointer",
            background: mode === m ? "#fff" : "transparent",
            color: mode === m ? "#000" : "#444", transition: "all 0.2s",
          }}>
            {m === "merchant" ? "🏪 Commerçant" : "👤 Client"}
          </div>
        ))}
      </div>

      {mode === "merchant" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>VOS COMMERCES</div>
            <button onClick={() => setShowNewBiz(true)} style={{ background: "#C9A84C", color: "#000", border: "none", borderRadius: 8, padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              + Ajouter
            </button>
          </div>
          {loading && <div style={{ color: "#444", textAlign: "center", padding: 40 }}>Chargement...</div>}
          {!loading && businesses.length === 0 && (
            <div style={{ color: "#333", textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🏪</div>
              <div>Ajoutez votre premier commerce</div>
            </div>
          )}
          {businesses.map(b => (
            <div key={b.id} onClick={() => { setSelectedBusiness(b); setView("dashboard"); }}
              style={{ background: "#13131A", borderRadius: 16, padding: "18px 20px", marginBottom: 12, cursor: "pointer", border: `1px solid ${b.color}22`, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 28 }}>{b.logo}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{b.name}</div>
                <div style={{ color: "#444", fontSize: 13 }}>{b.mode === "visits" ? `${b.goal} visites` : `${b.goal} pts`} → {b.reward}</div>
              </div>
              <div style={{ color: b.color, fontSize: 20 }}>›</div>
            </div>
          ))}

          {showNewBiz && (
            <div style={{ position: "fixed", inset: 0, background: "#000000CC", zIndex: 100, display: "flex", alignItems: "flex-end" }}>
              <div style={{ background: "#13131A", borderRadius: "20px 20px 0 0", padding: 28, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Nouveau commerce</div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Nom du commerce *</div>
                  <input value={bizForm.name} onChange={e => setBizForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ex: Fade Kings"
                    style={{ width: "100%", background: "#1E1E2A", border: "1px solid #2A2A38", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Récompense *</div>
                  <input value={bizForm.reward} onChange={e => setBizForm(p => ({ ...p, reward: e.target.value }))}
                    placeholder="Ex: Coupe gratuite"
                    style={{ width: "100%", background: "#1E1E2A", border: "1px solid #2A2A38", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Objectif</div>
                  <input type="number" value={bizForm.goal} onChange={e => setBizForm(p => ({ ...p, goal: Number(e.target.value) }))}
                    style={{ width: "100%", background: "#1E1E2A", border: "1px solid #2A2A38", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 14, boxSizing: "border-box" }} />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Type</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ v: "barber", l: "✂️ Barber", logo: "✂️", color: "#C9A84C" }, { v: "restaurant", l: "🍽️ Restaurant", logo: "🍽️", color: "#E05A2B" }].map(opt => (
                      <div key={opt.v} onClick={() => setBizForm(p => ({ ...p, type: opt.v, logo: opt.logo, color: opt.color }))}
                        style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", background: bizForm.type === opt.v ? "#fff" : "#1E1E2A", color: bizForm.type === opt.v ? "#000" : "#555" }}>
                        {opt.l}
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: "#555", fontSize: 12, marginBottom: 6 }}>Système</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[{ v: "visits", l: "🔖 Visites" }, { v: "points", l: "⭐ Points" }].map(opt => (
                      <div key={opt.v} onClick={() => setBizForm(p => ({ ...p, mode: opt.v }))}
                        style={{ flex: 1, textAlign: "center", padding: "10px 0", borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: "pointer", background: bizForm.mode === opt.v ? "#fff" : "#1E1E2A", color: bizForm.mode === opt.v ? "#000" : "#555" }}>
                        {opt.l}
                      </div>
                    ))}
                  </div>
                </div>
                <div onClick={handleAddBusiness} style={{ background: "#C9A84C", color: "#000", fontWeight: 700, borderRadius: 12, padding: "14px 0", textAlign: "center", cursor: "pointer" }}>
                  Créer le commerce
                </div>
                <button onClick={() => setShowNewBiz(false)} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#555", fontSize: 14, cursor: "pointer", padding: 10 }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {mode === "client" && (
        <>
          {!myPhone ? (
            <div>
              <div style={{ color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 16 }}>ACCÉDER À MES CARTES</div>
              <div style={{ background: "#13131A", borderRadius: 16, padding: 20 }}>
                <div style={{ color: "#fff", fontWeight: 600, marginBottom: 12 }}>Votre numéro de téléphone</div>
                <input placeholder="+33 6 12 34 56 78" value={phoneInput} onChange={e => setPhoneInput(e.target.value)}
                  style={{ width: "100%", background: "#1E1E2A", border: "1px solid #2A2A38", borderRadius: 10, padding: "12px 16px", color: "#fff", fontSize: 15, boxSizing: "border-box", marginBottom: 14 }} />
                <div onClick={() => phoneInput.trim() && loadMyCards(phoneInput.trim())}
                  style={{ background: "#C9A84C", color: "#000", fontWeight: 700, borderRadius: 12, padding: "14px 0", textAlign: "center", cursor: "pointer" }}>
                  Voir mes cartes →
                </div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ color: "#444", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>MES CARTES</div>
                <button onClick={() => { setMyPhone(""); setMyCards([]); }} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer" }}>Changer</button>
              </div>
              {myCards.length === 0 && <div style={{ color: "#333", textAlign: "center", padding: 40 }}>Aucune carte pour l'instant</div>}
              {myCards.map(c => {
                const b = c.businesses;
                if (!b) return null;
                const val = b.mode === "visits" ? c.visits : c.points;
                const done = val >= b.goal;
                return (
                  <div key={c.id} onClick={() => { setSelectedCard(c); setView("card"); }}
                    style={{ background: "linear-gradient(135deg,#1A1A24,#13131A)", borderRadius: 16, padding: "18px 20px", marginBottom: 12, cursor: "pointer", border: `1px solid ${done ? b.color : b.color + "22"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{b.logo}</span>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{b.name}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ color: b.color, fontWeight: 800, fontSize: 20 }}>{val}</div>
                        <div style={{ color: "#333", fontSize: 11 }}>/ {b.goal}</div>
                      </div>
                    </div>
                    <ProgressBar value={val} max={b.goal} color={b.color} />
                    {done && <div style={{ marginTop: 10, color: b.color, fontSize: 13, fontWeight: 700 }}>🎁 {b.reward} disponible !</div>}
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
