import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const PRODUCTS = [
  { id:1, name:"ProCool AC 1.5T", brand:"CoolBreeze", cat:"HVAC & Air Quality", emoji:"❄️", desc:"1.5-ton split AC with inverter technology, 5-star energy rating, and Wi-Fi control.", docs:[{name:"Installation Manual",type:"PDF",size:"3.2 MB"},{name:"User Guide",type:"PDF",size:"1.8 MB"},{name:"Error Codes Reference",type:"PDF",size:"0.4 MB"}], quickQ:["AC not cooling","Error code E3","Water dripping inside","Remote not working"], systemPrompt:"You are a support technician for the CoolBreeze ProCool AC 1.5T. Diagnose issues through guided questions like a real HVAC technician. Ask one or two targeted questions first, then narrow down the diagnosis. Reference specific parts, error codes, or manual sections where possible. Be concise." },
  { id:2, name:"SpeedStar S2 Scooter", brand:"VelocityMoto", cat:"Vehicles & Scooters", emoji:"🛵", desc:"125cc fuel-injected scooter with digital cluster, LED lights, and under-seat storage.", docs:[{name:"Owner's Manual",type:"PDF",size:"8.1 MB"},{name:"Service Manual",type:"PDF",size:"14.3 MB"},{name:"Wiring Diagram",type:"PDF",size:"2.1 MB"}], quickQ:["Horn not working","Engine won't start","Fuel indicator issue","Brakes feel soft"], systemPrompt:"You are an experienced scooter mechanic for the VelocityMoto SpeedStar S2. Diagnose issues systematically. Ask focused follow-up questions before suggesting fixes. Reference fuse numbers, relay locations, and manual figures when relevant. Keep answers short and practical." },
  { id:3, name:"WashMaster Pro 7kg", brand:"CleanTech", cat:"Home Appliances", emoji:"🫧", desc:"7kg fully automatic front-load washing machine with steam wash and quick dry modes.", docs:[{name:"Installation Guide",type:"PDF",size:"1.5 MB"},{name:"User Manual",type:"PDF",size:"4.2 MB"},{name:"Error Code List",type:"PDF",size:"0.6 MB"}], quickQ:["F5 error code","Not draining","Drum not spinning","Vibrating loudly"], systemPrompt:"You are a washing machine technician for the CleanTech WashMaster Pro 7kg. Diagnose problems through targeted questions. Ask about error codes, spin behavior, water supply, and drum sounds before suggesting fixes. Be methodical." },
  { id:4, name:"PureFlow RO 8L", brand:"AquaTech", cat:"Water Treatment", emoji:"💧", desc:"8-litre RO+UV water purifier with TDS controller and mineraliser.", docs:[{name:"Installation Manual",type:"PDF",size:"2.0 MB"},{name:"Filter Replacement Guide",type:"PDF",size:"1.1 MB"}], quickQ:["Slow water flow","Indicator light red","Water tastes odd","When to replace filter"], systemPrompt:"You are a water purifier technician for the AquaTech PureFlow RO 8L. Diagnose issues through investigation. Ask about water flow rate, indicator lights, and filter age before suggesting fixes. Be concise and helpful." },
  { id:5, name:"PowerView 55 QLED", brand:"PixelMax", cat:"Consumer Electronics", emoji:"📺", desc:"55-inch QLED smart TV with 4K HDR, Dolby Atmos, and built-in Android TV.", docs:[{name:"Quick Setup Guide",type:"PDF",size:"1.2 MB"},{name:"Full User Manual",type:"PDF",size:"6.8 MB"}], quickQ:["No picture but sound","WiFi not connecting","Apps crashing","Remote not pairing"], systemPrompt:"You are a TV technician for the PixelMax PowerView 55 QLED. Diagnose display, audio, connectivity, and software issues through guided questions. Reference settings menu paths and manual sections. Keep it concise." },
  { id:6, name:"IndustroPump X3", brand:"FlowForce", cat:"Industrial Equipment", emoji:"⚙️", desc:"3HP centrifugal water pump for industrial and agricultural use.", docs:[{name:"Technical Manual",type:"PDF",size:"5.6 MB"},{name:"Safety Guidelines",type:"PDF",size:"1.0 MB"}], quickQ:["Low pressure output","Motor overheating","Pump not priming","Unusual noise"], systemPrompt:"You are an industrial pump technician for the FlowForce IndustroPump X3. Diagnose issues systematically. Ask about pressure readings, motor sounds, and priming status before suggesting fixes. Safety is paramount." }
];

const API_KEY = "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";

export default function App() {
  const [page, setPage] = useState("browse");
  const [currentProduct, setCurrentProduct] = useState(null);
  const [prodTab, setProdTab] = useState("assistant");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [companyProds, setCompanyProds] = useState(PRODUCTS);
  const [showModal, setShowModal] = useState(false);
  const [newProd, setNewProd] = useState({ name:"", brand:"", cat:"Home Appliances", desc:"", emoji:"📦" });
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const cats = ["All", ...new Set(PRODUCTS.map(p => p.cat))];

  const filtered = PRODUCTS.filter(p => {
    const matchCat = filterCat === "All" || p.cat === filterCat;
    const matchQ = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQ;
  });

  function openProduct(p) {
    setCurrentProduct(p);
    setMessages([{ role:"bot", text:"Hi! I am the assistant for " + p.name + ". Describe your issue and I will help diagnose it." }]);
    setPage("product");
    setProdTab("assistant");
  }

  async function sendMessage(text) {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(function(prev) { return [...prev, { role:"user", text: msg }]; });
    setLoading(true);

    const hist = messages
  .slice(1)
  .filter(function(m) { return m.role === "user" || m.role === "bot"; })
  .map(function(m) {
    return { role: m.role === "bot" ? "assistant" : "user", content: m.text };
  });

if (hist.length > 0 && hist[hist.length - 1].role === "assistant") {
  hist.pop();
}

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", { 
        method: "POST",
        headers: {
             "Authorization": "Bearer " + API_KEY,
             "Content-Type": "application/json"
          },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 800,
          messages: [
            { role: "system", content: currentProduct.systemPrompt },
            ...hist,
            { role: "user", content: msg }
          ]
        })
      });

      const data = await res.json();
      console.log("Response:", JSON.stringify(data));
      const reply = data.choices && data.choices[0] ? data.choices[0].message.content : "Sorry, something went wrong.";
      setMessages(function(prev) { return [...prev, { role:"bot", text: reply }]; });
    } catch(e) {
      console.error("Error:", e);
      setMessages(function(prev) { return [...prev, { role:"bot", text:"Connection error. Please try again." }]; });
    }
    setLoading(false);
  }

  function saveProduct() {
    if (!newProd.name || !newProd.brand) return alert("Enter name and brand.");
    const p = {
      ...newProd,
      id: Date.now(),
      docs: [],
      quickQ: ["Common issue","Maintenance help","Error help","Installation"],
      systemPrompt: "You are a support technician for the " + newProd.brand + " " + newProd.name + ". Diagnose issues through targeted questions."
    };
    setCompanyProds(function(prev) { return [...prev, p]; });
    PRODUCTS.push(p);
    setShowModal(false);
    setNewProd({ name:"", brand:"", cat:"Home Appliances", desc:"", emoji:"📦" });
  }

  return (
    <div style={{ fontFamily:"system-ui", minHeight:"100vh", background:"#f5f5f5" }}>

      <nav style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:52, position:"sticky", top:0, zIndex:100 }}>
        <div onClick={() => setPage("browse")} style={{ fontWeight:600, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:30, height:30, background:"#1D9E75", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:16 }}>🔧</div>
          FixIQ
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {["browse","portal"].map(t => (
            <button key={t} onClick={() => setPage(t)} style={{ padding:"6px 16px", border:"none", background: page===t ? "#E1F5EE" : "transparent", color: page===t ? "#0F6E56" : "#666", borderRadius:6, cursor:"pointer", fontWeight: page===t ? 600 : 400, fontSize:14 }}>
              {t === "browse" ? "Products" : "Company Portal"}
            </button>
          ))}
        </div>
        <button onClick={() => setPage("portal")} style={{ background:"#1D9E75", color:"#fff", border:"none", borderRadius:6, padding:"7px 16px", cursor:"pointer", fontWeight:600, fontSize:13 }}>+ List a product</button>
      </nav>

      {page === "browse" && (
        <div>
          <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", padding:"24px" }}>
            <h1 style={{ fontSize:22, fontWeight:600, marginBottom:6 }}>Product support, powered by AI</h1>
            <p style={{ color:"#666", marginBottom:16, fontSize:14 }}>Find your product and get expert troubleshooting help instantly.</p>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products or brands…" style={{ padding:"9px 14px", border:"1px solid #ddd", borderRadius:8, width:400, fontSize:14, outline:"none" }} />
            <div style={{ display:"flex", gap:6, marginTop:12, flexWrap:"wrap" }}>
              {cats.map(c => (
                <button key={c} onClick={() => setFilterCat(c)} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, border:"1px solid", borderColor: filterCat===c ? "#5DCAA5" : "#ddd", background: filterCat===c ? "#E1F5EE" : "transparent", color: filterCat===c ? "#0F6E56" : "#666", cursor:"pointer" }}>{c}</button>
              ))}
            </div>
          </div>
          <div style={{ padding:24, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12 }}>
            {filtered.map(p => (
              <div key={p.id} onClick={() => openProduct(p)} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, overflow:"hidden", cursor:"pointer" }}>
                <div style={{ height:110, display:"flex", alignItems:"center", justifyContent:"center", fontSize:52, background:"#fafafa" }}>{p.emoji}</div>
                <div style={{ padding:12 }}>
                  <div style={{ fontSize:11, color:"#999", textTransform:"uppercase", letterSpacing:0.5, marginBottom:3 }}>{p.brand}</div>
                  <div style={{ fontSize:14, fontWeight:600, marginBottom:6 }}>{p.name}</div>
                  <span style={{ fontSize:11, padding:"2px 8px", borderRadius:10, background:"#E1F5EE", color:"#0F6E56" }}>{p.cat}</span>
                  <div style={{ fontSize:12, color:"#aaa", marginTop:8 }}>📄 {p.docs.length} documents</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {page === "product" && currentProduct && (
        <div>
          <div style={{ background:"#fff", borderBottom:"1px solid #e5e5e5", padding:"16px 24px" }}>
            <button onClick={() => setPage("browse")} style={{ background:"none", border:"none", color:"#1D9E75", cursor:"pointer", fontSize:13, marginBottom:12 }}>← Back to products</button>
            <div style={{ display:"flex", gap:20, alignItems:"flex-start" }}>
              <div style={{ fontSize:56 }}>{currentProduct.emoji}</div>
              <div>
                <div style={{ fontSize:12, color:"#999", marginBottom:3 }}>{currentProduct.brand}</div>
                <h2 style={{ fontSize:20, fontWeight:600, marginBottom:6 }}>{currentProduct.name}</h2>
                <p style={{ fontSize:14, color:"#666" }}>{currentProduct.desc}</p>
              </div>
            </div>
          </div>
          <div style={{ display:"flex", borderBottom:"1px solid #e5e5e5", background:"#fff", padding:"0 24px" }}>
            {["assistant","docs"].map(t => (
              <button key={t} onClick={() => setProdTab(t)} style={{ padding:"10px 16px", border:"none", borderBottom: prodTab===t ? "2px solid #1D9E75" : "2px solid transparent", background:"transparent", color: prodTab===t ? "#1D9E75" : "#666", cursor:"pointer", fontWeight: prodTab===t ? 600 : 400, fontSize:13 }}>
                {t === "assistant" ? "Ask the assistant" : "Documentation"}
              </button>
            ))}
          </div>
          <div style={{ padding:24 }}>
            {prodTab === "assistant" && (
              <div style={{ maxWidth:680 }}>
                <div ref={chatRef} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:16, height:360, overflowY:"auto", display:"flex", flexDirection:"column", gap:10, marginBottom:10 }}>
                  {messages.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role==="user" ? "flex-end" : "flex-start", maxWidth:"80%" }}>
                      <div style={{ fontSize:11, color:"#aaa", marginBottom:3, textAlign: m.role==="user" ? "right" : "left" }}>{m.role==="user" ? "You" : "Assistant"}</div>
                      <div style={{ padding:"10px 14px", borderRadius:12, background: m.role==="user" ? "#1D9E75" : "#f5f5f5", color: m.role==="user" ? "#fff" : "#222", fontSize:14, lineHeight:1.55, borderBottomRightRadius: m.role==="user" ? 4 : 12, borderBottomLeftRadius: m.role==="bot" ? 4 : 12 }}
                        dangerouslySetInnerHTML={{__html: m.text.replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>").replace(/\n/g,"<br/>")}} />
                    </div>
                  ))}
                  {loading && <div style={{ alignSelf:"flex-start", background:"#f5f5f5", borderRadius:12, padding:"10px 14px", fontSize:13, color:"#999" }}>Thinking…</div>}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:10 }}>
                  {currentProduct.quickQ.map(q => (
                    <button key={q} onClick={() => sendMessage(q)} style={{ fontSize:12, padding:"5px 12px", borderRadius:20, border:"1px solid #ddd", background:"transparent", color:"#666", cursor:"pointer" }}>{q}</button>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==="Enter" && sendMessage()} placeholder="Describe your issue…" style={{ flex:1, padding:"10px 14px", border:"1px solid #ddd", borderRadius:8, fontSize:14, outline:"none" }} />
                  <button onClick={() => sendMessage()} disabled={loading} style={{ background:"#1D9E75", color:"#fff", border:"none", borderRadius:8, padding:"10px 20px", cursor:"pointer", fontWeight:600, fontSize:13 }}>Send</button>
                </div>
              </div>
            )}
            {prodTab === "docs" && (
              <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:600 }}>
                {currentProduct.docs.map((d,i) => (
                  <div key={i} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:8, padding:"12px 16px", display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:22 }}>📄</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14, fontWeight:600 }}>{d.name}</div>
                      <div style={{ fontSize:12, color:"#aaa" }}>{d.type} · {d.size}</div>
                    </div>
                    <button style={{ fontSize:12, color:"#1D9E75", background:"none", border:"none", cursor:"pointer" }}>⬇ Download</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {page === "portal" && (
        <div style={{ padding:24 }}>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
            {[["Products listed", companyProds.length],["Documents uploaded", companyProds.reduce((a,p)=>a+p.docs.length,0)],["Support sessions","24"]].map(([l,v]) => (
              <div key={l} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:10, padding:16 }}>
                <div style={{ fontSize:12, color:"#999", marginBottom:6 }}>{l}</div>
                <div style={{ fontSize:24, fontWeight:700 }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <h2 style={{ fontSize:18, fontWeight:600 }}>Your products</h2>
            <button onClick={() => setShowModal(true)} style={{ background:"#1D9E75", color:"#fff", border:"none", borderRadius:8, padding:"8px 16px", cursor:"pointer", fontWeight:600, fontSize:13 }}>+ Add product</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
            {companyProds.map(p => (
              <div key={p.id} style={{ background:"#fff", border:"1px solid #e5e5e5", borderRadius:12, padding:16 }}>
                <div style={{ fontSize:32, marginBottom:8 }}>{p.emoji}</div>
                <div style={{ fontSize:14, fontWeight:600 }}>{p.name}</div>
                <div style={{ fontSize:12, color:"#999", marginTop:3 }}>{p.cat}</div>
                <div style={{ fontSize:12, color:"#1D9E75", marginTop:8 }}>📄 {p.docs.length} docs</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:12, padding:24, width:440, maxHeight:"90vh", overflowY:"auto" }}>
            <h3 style={{ fontSize:16, fontWeight:600, marginBottom:16 }}>Add a new product</h3>
            {[["Product name","name","e.g. AquaFresh 500"],["Brand","brand","e.g. AquaTech"],["Description","desc","Brief description…"],["Emoji icon","emoji","e.g. 💧"]].map(([label,key,ph]) => (
              <div key={key} style={{ marginBottom:12 }}>
                <label style={{ fontSize:13, color:"#666", display:"block", marginBottom:4 }}>{label}</label>
                <input value={newProd[key]} onChange={e => setNewProd(p => ({...p,[key]:e.target.value}))} placeholder={ph} style={{ width:"100%", padding:"8px 10px", border:"1px solid #ddd", borderRadius:7, fontSize:14, outline:"none" }} />
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"flex-end", gap:8, marginTop:16 }}>
              <button onClick={() => setShowModal(false)} style={{ padding:"8px 16px", border:"1px solid #ddd", borderRadius:7, background:"transparent", cursor:"pointer", fontSize:13 }}>Cancel</button>
              <button onClick={saveProduct} style={{ padding:"8px 16px", background:"#1D9E75", color:"#fff", border:"none", borderRadius:7, cursor:"pointer", fontWeight:600, fontSize:13 }}>Save product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}