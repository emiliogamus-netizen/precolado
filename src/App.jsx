import { useState, useRef, useEffect } from "react";
import { db } from "./firebase.js";
import { collection, doc, onSnapshot, setDoc, updateDoc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLISTS — basados en formatos SF753-02, SF753-03, SF753-05
// ─────────────────────────────────────────────────────────────────────────────

// Etapa 1: todo lo que se revisa ANTES de cerrar la cimbra
const CHECKLIST_E1 = [
  // PROYECTO
  { id:"e1_01", cat:"Proyecto",    code:"A.1",  label:"Residente cuenta con planos actualizados, autorizados y/o boletines correspondientes en campo" },
  // ACERO
  { id:"e1_02", cat:"Acero",       code:"A.2",  label:"Diámetros, dimensiones y corrugado del acero conforme a proyecto estructural" },
  { id:"e1_03", cat:"Acero",       code:"A.3",  label:"Armado (separación, sentido y cantidad) conforme a planos estructurales. Desfase máx. 1.5 cm" },
  { id:"e1_04", cat:"Acero",       code:"A.4",  label:"Traslapes y longitudes de desarrollo conforme a proyecto y notas en planos" },
  { id:"e1_05", cat:"Acero",       code:"A.5",  label:"Bastones, columpios y refuerzos especiales en posición y separaciones indicadas en planos" },
  { id:"e1_06", cat:"Acero",       code:"A.6",  label:"Ganchos, dobleces y estribos correctamente formados" },
  { id:"e1_07", cat:"Acero",       code:"A.7",  label:"Desplantes y anclajes para elementos verticales (columnas, muros, castillos) a la separación indicada" },
  { id:"e1_08", cat:"Acero",       code:"A.8",  label:"Refuerzos para pasos en contratrabes, trabes y losas conforme a planos" },
  { id:"e1_09", cat:"Acero",       code:"A.9",  label:"Acero limpio: libre de óxido suelto, grasa o contaminantes antes del colado" },
  { id:"e1_10", cat:"Acero",       code:"A.10", label:"Separadores de recubrimiento colocados en cantidad y posición correcta según proyecto. Recubrimiento libre de obstrucciones" },
  // INSTALACIONES
  { id:"e1_14", cat:"Inst. Hidráulica, Sanitaria y Pluvial", code:"IHS.1", label:"Instalaciones hidráulica, sanitaria y pluvial ocultas concluidas al 100%" },
  { id:"e1_15", cat:"Inst. Hidráulica, Sanitaria y Pluvial", code:"IHS.2", label:"Pasos de instalaciones (hidráulica, sanitaria y pluvial) en contratrabes, trabes y losas conforme a proyecto" },
  { id:"e1_16", cat:"Inst. Hidráulica, Sanitaria y Pluvial", code:"IHS.3", label:"Registros y tuberías protegidos contra derrame de concreto; tubos sin deformaciones ni obstrucciones" },
  { id:"e1_23", cat:"Inst. Eléctrica y canalizaciones vacías",   code:"IE.1", label:"Ductos, cajas y registros colocados al 100%" },
  { id:"e1_25", cat:"Inst. Eléctrica y canalizaciones vacías",   code:"IE.3", label:"Pasos eléctricos en contratrabes, trabes y losas conforme a proyecto" },
  // GEOMETRÍA
  { id:"e1_26", cat:"Geometría",   code:"G.1",  label:"Ejes y niveles del elemento verificados. Tolerancia ± 0.5 cm del eje" },
  { id:"e1_27", cat:"Geometría",   code:"G.2",  label:"Dimensiones del elemento (largo, ancho, peralte) conformes a plano" },
  { id:"e1_29", cat:"Geometría",   code:"G.3",  label:"Juntas de construcción escarificadas con rugosidad adecuada y limpias previo al armado" },
];

// Etapa 2: todo lo que se revisa DESPUÉS de cerrar la cimbra, antes del colado
const CHECKLIST_E2 = [
  // CIMBRA
  { id:"e2_01", cat:"Cimbra",    code:"C.1",  label:"Cimbra alineada y escuadrada en todos sus vértices" },
  { id:"e2_02", cat:"Cimbra",    code:"C.2",  label:"Cimbra a plomo en todas sus caras. Tolerancia de desplome: 0.5%" },
  { id:"e2_04", cat:"Cimbra",    code:"C.4",  label:"Cimbra sin puntos de fuga en ningún punto del perímetro (evita fugas de concreto)" },
  { id:"e2_05", cat:"Cimbra",    code:"C.5",  label:"Apuntalamiento y contraventeo completo y con la cantidad mínima de puntales requeridos" },
  { id:"e2_06", cat:"Cimbra",    code:"C.6",  label:"Desmoldante aplicado correctamente en toda la superficie" },
  { id:"e2_08", cat:"Cimbra",    code:"C.8",  label:"Protección para colindancias colocada (malla sombra, tapial, poliestireno)" },
  // LIMPIEZA
  { id:"e2_09", cat:"Limpieza",  code:"L.1",  label:"Fondo y paredes interiores libres de escombro, polvo y agua estancada" },
  { id:"e2_10", cat:"Limpieza",  code:"L.2",  label:"Limpieza final del acero realizada (por tránsito de personal)" },
  { id:"e2_11", cat:"Limpieza",  code:"L.3",  label:"Cimbra humedecida previo al colado" },
  // INSTALACIONES — verificación final
  { id:"e2_13", cat:"Inst. finales", code:"IF.1", label:"Verificación final: instalaciones hidráulicas en posición y sin daños" },
  { id:"e2_14", cat:"Inst. finales", code:"IF.2", label:"Verificación final: instalaciones sanitarias y pluviales en posición" },
  { id:"e2_15", cat:"Inst. finales", code:"IF.3", label:"Verificación final: instalaciones eléctricas, canalizaciones vacías en posición y perfectamente sujetas" },
  { id:"e2_16", cat:"Acero",        code:"A.11", label:"Verificación final: separadores de recubrimiento en posición correcta y sin desplazamientos por el proceso de cimbrado" },
  // CONDICIONES DE COLADO
  { id:"e2_23", cat:"Condiciones", code:"CC.7", label:"Acceso garantizado para colado y vibrado en toda la extensión del elemento" },
  { id:"e2_24", cat:"Condiciones", code:"CC.8", label:"Columnas, castillos y elementos verticales alineados al momento del colado" },
];

const ELEMENT_TYPES = ["Losa de cimentación","Losa de entrepiso","Columna","Muro","Dados y contratrabes","Escalera","Otro"];
const emptyCheck = (items) => Object.fromEntries(items.map(i => [i.id, false]));
const pct = (cl) => { const v = Object.values(cl); return Math.round(v.filter(Boolean).length / v.length * 100); };

const globalEstado = (rec) => {
  if (rec.etapa2?.estado === "aprobado") return "listo";
  return "proceso";
};

const EST = {
  proceso:  { label: "En proceso",  dot: "#f59e0b" },
  listo:    { label: "Autorizado",  dot: "#10b981" },
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGNATURE PAD
// ─────────────────────────────────────────────────────────────────────────────
function SignPad({ label, onSign, signed, accent }) {
  const ref = useRef(null);
  const draw = useRef(false);
  const last = useRef(null);
  useEffect(() => {
    const ctx = ref.current.getContext("2d");
    ctx.fillStyle = "#fafaf9";
    ctx.fillRect(0, 0, ref.current.width, ref.current.height);
  }, []);
  const pos = e => {
    const r = ref.current.getBoundingClientRect();
    const sx = ref.current.width / r.width;
    const sy = ref.current.height / r.height;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (cx - r.left) * sx, y: (cy - r.top) * sy };
  };
  const down = e => { draw.current = true; last.current = pos(e); };
  const move = e => {
    if (!draw.current) return;
    e.preventDefault();
    const p = pos(e);
    const ctx = ref.current.getContext("2d");
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = accent || "#1c1917"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke();
    last.current = p;
    onSign(true);
  };
  const up = () => { draw.current = false; };
  const clear = () => {
    const ctx = ref.current.getContext("2d");
    ctx.fillStyle = "#fafaf9"; ctx.fillRect(0, 0, ref.current.width, ref.current.height);
    onSign(false);
  };
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 11, color: "#78716c", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>{label}</div>
      <canvas ref={ref} width={360} height={100}
        onMouseDown={down} onMouseMove={move} onMouseUp={up} onMouseLeave={up}
        onTouchStart={down} onTouchMove={move} onTouchEnd={up}
        style={{ borderRadius: 6, border: `1.5px solid ${signed ? accent : "#d6d3d1"}`, cursor: "crosshair", width: "100%", touchAction: "none", background: "#fafaf9", display: "block" }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 5 }}>
        <button onClick={clear} style={{ background: "transparent", border: "1px solid #d6d3d1", color: "#a8a29e", padding: "2px 10px", borderRadius: 4, cursor: "pointer", fontSize: 11 }}>Borrar</button>
        <span style={{ fontSize: 11, color: signed ? "#10b981" : "#a8a29e" }}>{signed ? "✓ Firmado" : "Trace su firma"}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKLIST COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
function ChecklistSection({ items, checklist, onChange, accent, accentBg }) {
  const cats = [...new Set(items.map(i => i.cat))];
  const p = pct(checklist);
  const done = Object.values(checklist).filter(Boolean).length;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "#78716c" }}>{done} de {items.length} puntos verificados</span>
        <span style={{ fontSize: 22, fontWeight: 700, color: p === 100 ? "#10b981" : accent }}>{p}%</span>
      </div>
      <div style={{ height: 4, background: "#e7e5e4", borderRadius: 4, marginBottom: 20, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, background: p === 100 ? "#10b981" : accent, borderRadius: 4, transition: "width .3s" }} />
      </div>
      {cats.map(cat => (
        <div key={cat} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 10, color: accent, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8, paddingBottom: 4, borderBottom: `1px solid ${accentBg}` }}>{cat}</div>
          {items.filter(i => i.cat === cat).map(item => (
            <div key={item.id} onClick={() => onChange(item.id)}
              style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 6, marginBottom: 3, cursor: "pointer", background: checklist[item.id] ? accentBg : "transparent", transition: "background .15s" }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, flexShrink: 0, marginTop: 1, background: checklist[item.id] ? accent : "#fff", border: `1.5px solid ${checklist[item.id] ? accent : "#d6d3d1"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#fff", transition: "all .15s" }}>
                {checklist[item.id] ? "✓" : ""}
              </div>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, color: "#a8a29e", fontFamily: "monospace", marginRight: 6 }}>{item.code}</span>
                <span style={{ fontSize: 13, color: checklist[item.id] ? "#1c1917" : "#57534e" }}>{item.label}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL DETALLE (vista dueño / lectura)
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ record, onClose, onFillEtapa }) {
  if (!record) return null;
  const EPanel = ({ etapa, items, num, accent, accentBg, title }) => {
    if (!etapa) return (
      <div style={{ background: "#fafaf9", border: "1px dashed #e7e5e4", borderRadius: 8, padding: 20, textAlign: "center", color: "#c0bdb9", fontSize: 12 }}>
        Etapa {num} bloqueada — completa la Etapa 1 primero
      </div>
    );
    const p = pct(etapa.checklist);
    const cats = [...new Set(items.map(i => i.cat))];
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={{ fontSize: 10, color: accent, letterSpacing: 2, fontWeight: 700, textTransform: "uppercase" }}>Etapa {num} — {title}</span>
          <span style={{ fontSize: 18, fontWeight: 700, color: p === 100 ? "#10b981" : accent }}>{p}%</span>
        </div>
        <div style={{ height: 3, background: "#e7e5e4", borderRadius: 4, marginBottom: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${p}%`, background: p === 100 ? "#10b981" : accent, borderRadius: 4 }} />
        </div>
        {cats.map(cat => (
          <div key={cat} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 9, color: "#a8a29e", letterSpacing: 2, textTransform: "uppercase", marginBottom: 5 }}>{cat}</div>
            {items.filter(i => i.cat === cat).map(item => (
              <div key={item.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "4px 0", borderBottom: "1px solid #f5f4f3" }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, marginTop: 2, background: etapa.checklist[item.id] ? "#d1fae5" : "#fef3c7", border: `1px solid ${etapa.checklist[item.id] ? "#6ee7b7" : "#fde68a"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: etapa.checklist[item.id] ? "#059669" : "#92400e" }}>
                  {etapa.checklist[item.id] ? "✓" : "–"}
                </div>
                <span style={{ fontSize: 11, color: etapa.checklist[item.id] ? "#44403c" : "#78716c" }}>{item.label}</span>
              </div>
            ))}
          </div>
        ))}
        <div style={{ display: "flex", flexWrap:"wrap", gap: 12, fontSize: 11, color: "#a8a29e", marginTop: 10, paddingTop: 10, borderTop: "1px solid #f5f4f3" }}>
          <span>{etapa.firmaResidente ? "✍️ Res. firmado" : "— Sin firma residente"}</span>
          <span>{etapa.firmaContratista ? "✍️ Cont. firmado" : "— Sin firma contratista"}</span>
          {etapa.nombreContratista && <span>👷 {etapa.nombreContratista}</span>}
          {etapa.fechaHora && <span>🕐 {etapa.fechaHora}</span>}
        </div>
        {Array.isArray(etapa.fotos) && etapa.fotos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, color: "#a8a29e", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>📷 {etapa.fotos.length} foto(s)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 6 }}>
              {etapa.fotos.map((url, i) => (
                <img key={i} src={url} alt={`Foto ${i+1}`} onClick={() => { const w = window.open(); w.document.write(`<img src="${url}" style="max-width:100%;max-height:100vh;margin:auto;display:block;">`); }}
                  style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6, border: "1px solid #e7e5e4", cursor: "zoom-in" }} />
              ))}
            </div>
          </div>
        )}
        {etapa.obs ? <div style={{ marginTop: 8, fontSize: 12, color: "#78716c", fontStyle: "italic" }}>"{etapa.obs}"</div> : null}
        {etapa.estado === "pendiente" && onFillEtapa && (
          <button onClick={() => { onClose(); onFillEtapa(record, num); }} style={{ marginTop: 12, width: "100%", padding: "8px", background: accent, border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 12 }}>Completar Etapa {num}</button>
        )}
      </div>
    );
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,0.4)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#fff", borderRadius: 12, width: "100%", maxWidth: 760, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #f5f4f3", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1c1917" }}>{[].concat(record.tipoElemento).join(" + ")} {record.elemento}</div>
            <div style={{ fontSize: 12, color: "#a8a29e", marginTop: 2 }}>Eje {record.eje} · {record.nivel} · {record.fecha}</div>
            <div style={{ fontSize: 12, color: "#78716c", marginTop: 1 }}>Residente: {record.residente} · Contratista: {record.contratista || "—"}</div>
          </div>
          <StatusPill estado={globalEstado(record)} />
        </div>
        <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fafaf9", borderRadius: 8, padding: 16, border: "1px solid #f5f4f3" }}>
            <EPanel etapa={record.etapa1} items={CHECKLIST_E1} num={1} accent="#3b82f6" accentBg="#eff6ff" title="Pre-cimbrado" />
          </div>
          <div style={{ background: "#fafaf9", borderRadius: 8, padding: 16, border: "1px solid #f5f4f3" }}>
            <EPanel etapa={record.etapa2} items={CHECKLIST_E2} num={2} accent="#f59e0b" accentBg="#fffbeb" title="Pre-colado" />
          </div>
        </div>
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f5f4f3", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "7px 18px", background: "transparent", border: "1px solid #e7e5e4", color: "#78716c", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATUS PILL
// ─────────────────────────────────────────────────────────────────────────────
function StatusPill({ estado }) {
  const e = EST[estado] || EST.proceso;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 20, background: "#f5f4f3", fontSize: 11, fontWeight: 600, color: "#57534e", whiteSpace: "nowrap" }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: e.dot }} />
      {e.label}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORMULARIO DE ETAPA
// ─────────────────────────────────────────────────────────────────────────────
function EtapaForm({ record, etapaNum, onSave, onCancel }) {
  const items  = etapaNum === 1 ? CHECKLIST_E1 : CHECKLIST_E2;
  const accent = etapaNum === 1 ? "#3b82f6" : "#f59e0b";
  const accentBg = etapaNum === 1 ? "#eff6ff" : "#fffbeb";
  const title  = etapaNum === 1 ? "Autorización Previa al Cimbrado" : "Autorización Previa al Colado";
  const sub    = etapaNum === 1
    ? "Verificar el acero, recubrimientos e instalaciones antes de cerrar la cimbra."
    : "Verificar la cimbra ya colocada y condiciones de colado.";

  const etapaData = etapaNum === 1 ? record.etapa1 : record.etapa2;

  const [step, setStep] = useState(1);
  const [cl, setCl] = useState(etapaData?.checklist && Object.keys(etapaData.checklist).length > 0 ? etapaData.checklist : emptyCheck(items));
  const [fotos, setFotos] = useState(Array.isArray(etapaData?.fotos) ? etapaData.fotos.map(f => typeof f === "string" ? { url: f, name: "foto" } : f) : []);
  const [firmaRes, setFirmaRes] = useState(etapaData?.firmaResidente || false);
  const [firmaCont, setFirmaCont] = useState(etapaData?.firmaContratista || false);
  const [nombreCont, setNombreCont] = useState(etapaData?.nombreContratista || "");
  const [obs, setObs] = useState(etapaData?.obs || "");

  const p = pct(cl);
  const canSave = p >= 80 && firmaRes && firmaCont && nombreCont.trim().length > 2;
  const toggle = id => setCl(prev => ({ ...prev, [id]: !prev[id] }));

  const iStyle = { width: "100%", background: "#fff", border: "1px solid #e7e5e4", color: "#1c1917", padding: "9px 12px", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit" };

  return (
    <div style={{ maxWidth: 660, margin: "0 auto" }}>
      {/* Header de etapa */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: accentBg, border: `1px solid ${accent}33`, borderRadius: 20, padding: "3px 12px", fontSize: 11, color: accent, fontWeight: 700, letterSpacing: 1, marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: accent }} />
          ETAPA {etapaNum}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1c1917" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#78716c", marginTop: 4 }}>{sub}</div>
        <div style={{ marginTop: 6, fontSize: 13, color: "#57534e" }}>
          {[].concat(record.tipoElemento).join(" + ")} <strong style={{ color: accent }}>{record.elemento}</strong> · {record.eje} · {record.nivel} · {record.fecha}
        </div>
      </div>

      {/* Steps nav */}
      <div style={{ display: "flex", marginBottom: 28 }}>
        {["Checklist", "Evidencia", "Firmas"].map((s, i) => (
          <div key={s} style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <div style={{ textAlign: "center", flex: 1 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", margin: "0 auto 4px", background: step > i+1 ? "#10b981" : step === i+1 ? accent : "#fff", border: `2px solid ${step > i+1 ? "#10b981" : step === i+1 ? accent : "#e7e5e4"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: step >= i+1 ? "#fff" : "#c0bdb9", transition: "all .2s" }}>
                {step > i+1 ? "✓" : i+1}
              </div>
              <div style={{ fontSize: 10, color: step === i+1 ? accent : "#a8a29e", letterSpacing: 1, fontWeight: 600 }}>{s.toUpperCase()}</div>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i+1 ? "#10b981" : "#f5f4f3", marginBottom: 18 }} />}
          </div>
        ))}
      </div>

      {/* STEP 1 — Checklist */}
      {step === 1 && (
        <div>
          <ChecklistSection items={items} checklist={cl} onChange={toggle} accent={accent} accentBg={accentBg} />
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 11, color: "#78716c", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5, fontWeight: 600 }}>Observaciones</label>
            <textarea value={obs} onChange={e => setObs(e.target.value)} style={{ ...iStyle, minHeight: 65, resize: "vertical" }} placeholder="Anotaciones para esta etapa..." />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between", marginTop: 20 }}>
            <button onClick={onCancel} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #e7e5e4", color: "#78716c", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
            <button onClick={() => setStep(2)} style={{ padding: "9px 22px", background: accent, border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* STEP 2 — Fotos */}
      {step === 2 && (
        <div>
          <div style={{ fontSize: 13, color: "#78716c", marginBottom: 16 }}>
            {etapaNum === 1 ? "Fotografías del acero, recubrimientos e instalaciones antes de cerrar cimbra." : "Fotografías de la cimbra terminada, apuntalamiento y condiciones generales."}
          </div>
          <label style={{ display: "block", border: `2px dashed ${accentBg === "#eff6ff" ? "#bfdbfe" : "#fde68a"}`, borderRadius: 10, padding: "32px 20px", textAlign: "center", cursor: "pointer", background: accentBg, marginBottom: 14, transition: "border .2s" }}>
            <div style={{ fontSize: 32, marginBottom: 6 }}>📷</div>
            <div style={{ color: "#57534e", fontSize: 13, fontWeight: 500 }}>Adjuntar fotografías de evidencia</div>
            <div style={{ color: "#a8a29e", fontSize: 12, marginTop: 3 }}>Se recomienda mínimo 3 fotos</div>
            <input type="file" multiple accept="image/*" onChange={e => setFotos(prev => [...prev, ...Array.from(e.target.files).map(f => ({ name: f.name, file: f, url: URL.createObjectURL(f) }))])} style={{ display: "none" }} />
          </label>
          {fotos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
              {fotos.map((f, i) => (
                <div key={i} style={{ position: "relative" }}>
                  <img src={f.url} alt={f.name} style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8, border: "1px solid #e7e5e4" }} />
                  <button onClick={() => setFotos(prev => prev.filter((_, j) => j !== i))} style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,.5)", border: "none", color: "#fff", cursor: "pointer", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ color: "#a8a29e", fontSize: 12, marginBottom: 20 }}>{fotos.length === 0 ? "Sin fotos adjuntas." : `${fotos.length} foto(s) adjunta(s) ✓`}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button onClick={() => setStep(1)} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #e7e5e4", color: "#78716c", borderRadius: 6, cursor: "pointer" }}>← Atrás</button>
            <button onClick={() => setStep(3)} style={{ padding: "9px 22px", background: accent, border: "none", color: "#fff", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>Siguiente →</button>
          </div>
        </div>
      )}

      {/* STEP 3 — Firmas */}
      {step === 3 && (
        <div>
          <div style={{ background: "#fafaf9", border: "1px solid #e7e5e4", borderRadius: 10, padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: "#57534e", margin: "0 0 16px", lineHeight: 1.6 }}>
              Los suscritos certifican que el elemento <strong>{[].concat(record.tipoElemento).join(" + ")} {record.elemento}</strong> ha sido revisado y cumple con los requisitos de la <strong>Etapa {etapaNum}</strong> para continuar el proceso constructivo.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <SignPad label="Firma del Residente de Obra" onSign={setFirmaRes} signed={firmaRes} accent={accent} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 11, color: "#78716c", letterSpacing: 1, textTransform: "uppercase", marginBottom: 6, fontWeight: 600 }}>Nombre del Contratista</div>
                <input value={nombreCont} onChange={e => setNombreCont(e.target.value)} placeholder="Nombre completo del contratista" style={{ width: "100%", background: "#fff", border: "1px solid #e7e5e4", color: "#1c1917", padding: "9px 12px", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit", marginBottom: 10 }} />
                <SignPad label="Firma del Contratista" onSign={setFirmaCont} signed={firmaCont} accent="#78716c" />
              </div>
            </div>
          </div>

          {/* Resumen de requisitos */}
          <div style={{ background: canSave ? "#f0fdf4" : "#fafaf9", border: `1px solid ${canSave ? "#bbf7d0" : "#e7e5e4"}`, borderRadius: 8, padding: 14, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: canSave ? "#059669" : "#78716c", marginBottom: 6 }}>
              {canSave ? "✓ Listo para guardar" : "Para guardar se requiere:"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: 12 }}>
              <span style={{ color: p >= 80 ? "#059669" : "#d97706" }}>{p >= 80 ? "✓" : "○"} Checklist al {p}% (mínimo 80%)</span>
              <span style={{ color: firmaRes ? "#059669" : "#d97706" }}>{firmaRes ? "✓" : "○"} Firma del Residente de Obra</span>
              <span style={{ color: nombreCont.trim().length > 2 ? "#059669" : "#d97706" }}>{nombreCont.trim().length > 2 ? "✓" : "○"} Nombre del Contratista</span>
              <span style={{ color: firmaCont ? "#059669" : "#d97706" }}>{firmaCont ? "✓" : "○"} Firma del Contratista</span>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "space-between" }}>
            <button onClick={() => setStep(2)} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #e7e5e4", color: "#78716c", borderRadius: 6, cursor: "pointer" }}>← Atrás</button>
            <button onClick={async () => {
                const compressImg = (file) => new Promise((res, rej) => {
                  const img = new Image();
                  const url = URL.createObjectURL(file);
                  img.onload = () => {
                    try {
                      const MAX = 1000;
                      let w = img.width || MAX, h = img.height || MAX;
                      if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
                      else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
                      const canvas = document.createElement("canvas");
                      canvas.width = w; canvas.height = h;
                      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
                      res(canvas.toDataURL("image/jpeg", 0.65));
                    } catch(e) { res(url); }
                    URL.revokeObjectURL(url);
                  };
                  img.onerror = () => { res(null); URL.revokeObjectURL(url); };
                  img.src = url;
                });
                const fotosB64 = (await Promise.all(fotos.map(f => f.file ? compressImg(f.file) : Promise.resolve(f.url || f)))).filter(Boolean);
                onSave(record, etapaNum, { estado: p >= 80 ? "aprobado" : "pendiente", checklist: cl, fotos: fotosB64, firmaResidente: firmaRes, firmaContratista: firmaCont, nombreContratista: nombreCont.trim(), obs, fechaHora: new Date().toLocaleString("es-MX", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" }) });
              }}
              disabled={!canSave}
              style={{ padding: "9px 26px", background: canSave ? "#10b981" : "#e7e5e4", border: "none", color: canSave ? "#fff" : "#a8a29e", borderRadius: 6, cursor: canSave ? "pointer" : "not-allowed", fontWeight: 700, fontSize: 14 }}>
              Guardar Etapa {etapaNum} ✓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NUEVO ELEMENTO
// ─────────────────────────────────────────────────────────────────────────────
function NewElementForm({ onSave, onCancel }) {
  const [d, setD] = useState({ tipoElemento: [], elemento: "", eje: "", nivel: "", fecha: new Date().toISOString().split("T")[0], residente: "", contratista: "" });
  const toggleTipo = (t) => setD(p => ({ ...p, tipoElemento: p.tipoElemento.includes(t) ? p.tipoElemento.filter(x => x !== t) : [...p.tipoElemento, t] }));
  const iStyle = { width: "100%", background: "#fff", border: "1px solid #e7e5e4", color: "#1c1917", padding: "9px 12px", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "inherit", transition: "border .2s" };
  const lStyle = { fontSize: 11, color: "#78716c", letterSpacing: 1, textTransform: "uppercase", display: "block", marginBottom: 5, fontWeight: 600 };
  const valid = d.tipoElemento.length > 0 && d.elemento && d.eje && d.nivel && d.residente && d.contratista;
  return (
    <div style={{ maxWidth: 540, margin: "0 auto" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: "#1c1917" }}>Registrar elemento</div>
        <div style={{ fontSize: 13, color: "#78716c", marginTop: 4 }}>Después completa la Etapa 1 (pre-cimbrado) y Etapa 2 (pre-colado).</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <label style={lStyle}>Tipo de elemento <span style={{ color:"#a8a29e", fontWeight:400, textTransform:"none", letterSpacing:0 }}>(selecciona uno o varios)</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {ELEMENT_TYPES.map(t => {
              const sel = d.tipoElemento.includes(t);
              return (
                <button key={t} type="button" onClick={() => toggleTipo(t)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${sel ? "#1c1917" : "#e7e5e4"}`, background: sel ? "#1c1917" : "#fff", color: sel ? "#fff" : "#57534e", cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: sel ? 600 : 400, transition: "all .15s" }}>
                  {sel && <span style={{ marginRight: 5, fontSize: 11 }}>✓</span>}{t}
                </button>
              );
            })}
          </div>
          {d.tipoElemento.length === 0 && <div style={{ fontSize: 11, color: "#f59e0b", marginTop: 6 }}>Selecciona al menos un tipo</div>}
        </div>
        <div><label style={lStyle}>Identificador</label>
          <input style={iStyle} placeholder="Ej: N+3.20, C-12, T-03" value={d.elemento} onChange={e => setD(p => ({ ...p, elemento: e.target.value }))} />
        </div>
        <div><label style={lStyle}>Eje(s)</label>
          <input style={iStyle} placeholder="Ej: A-C / 1-4" value={d.eje} onChange={e => setD(p => ({ ...p, eje: e.target.value }))} />
        </div>
        <div><label style={lStyle}>Nivel</label>
          <input style={iStyle} placeholder="Ej: N+3.20" value={d.nivel} onChange={e => setD(p => ({ ...p, nivel: e.target.value }))} />
        </div>
        <div><label style={lStyle}>Fecha de colado</label>
          <input type="date" style={iStyle} value={d.fecha} onChange={e => setD(p => ({ ...p, fecha: e.target.value }))} />
        </div>
        <div><label style={lStyle}>Residente de obra</label>
          <input style={iStyle} placeholder="Ing. Nombre Apellido" value={d.residente} onChange={e => setD(p => ({ ...p, residente: e.target.value }))} />
        </div>
        <div><label style={lStyle}>Contratista</label>
          <input style={iStyle} placeholder="Nombre del contratista" value={d.contratista} onChange={e => setD(p => ({ ...p, contratista: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 22 }}>
        <button onClick={onCancel} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #e7e5e4", color: "#78716c", borderRadius: 6, cursor: "pointer", fontSize: 13 }}>Cancelar</button>
        <button onClick={() => valid && onSave(d)} disabled={!valid} style={{ padding: "9px 22px", background: valid ? "#3b82f6" : "#e7e5e4", border: "none", color: valid ? "#fff" : "#a8a29e", borderRadius: 6, cursor: valid ? "pointer" : "not-allowed", fontWeight: 600, fontSize: 13 }}>
          Crear y revisar E1 →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TARJETA DE ELEMENTO
// ─────────────────────────────────────────────────────────────────────────────
function Card({ record, onClick, onEtapa, onDelete }) {
  const p1 = record.etapa1 ? pct(record.etapa1.checklist) : 0;
  const p2 = record.etapa2 ? pct(record.etapa2.checklist) : 0;
  const e1ok = record.etapa1?.estado === "aprobado";

  return (
    <div onClick={() => onClick(record)}
      style={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 10, padding: "16px 18px", cursor: "pointer", transition: "box-shadow .15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.07)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#1c1917" }}>{[].concat(record.tipoElemento).join(" + ")} {record.elemento}</div>
          <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 2 }}>Eje {record.eje} · {record.nivel} · {record.fecha}</div>
          <div style={{ fontSize: 11, color: "#78716c", marginTop: 1 }}>Res: {record.residente} · Cont: {record.contratista || "—"}</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <StatusPill estado={globalEstado(record)} />
          {onDelete && (
            <button onClick={e => { e.stopPropagation(); if(window.confirm("¿Eliminar este elemento? Esta acción no se puede deshacer.")) onDelete(record.id); }}
              style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fff", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
              🗑
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {/* E1 */}
        <div style={{ background: "#f8faff", border: "1px solid #dbeafe", borderRadius: 8, padding: "10px 12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#3b82f6", letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>E1 · Pre-cimbrado</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: e1ok ? "#10b981" : "#3b82f6" }}>{p1}%</span>
          </div>
          <div style={{ height: 3, background: "#dbeafe", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${p1}%`, background: e1ok ? "#10b981" : "#3b82f6", borderRadius: 4 }} />
          </div>
          {e1ok
            ? <div style={{ fontSize: 11, color: "#059669" }}>✓ Autorizado · {record.etapa1.fechaHora || ""}</div>
            : <button onClick={e => { e.stopPropagation(); onEtapa(record, 1); }} style={{ width: "100%", padding: "5px", background: "#3b82f6", border: "none", color: "#fff", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Completar →</button>
          }
        </div>

        {/* E2 */}
        <div style={{ background: e1ok ? "#fffdf5" : "#fafaf9", border: `1px solid ${e1ok ? "#fde68a" : "#f5f4f3"}`, borderRadius: 8, padding: "10px 12px", opacity: e1ok ? 1 : 0.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "#f59e0b", letterSpacing: 1, fontWeight: 700, textTransform: "uppercase" }}>E2 · Pre-colado</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: record.etapa2?.estado === "aprobado" ? "#10b981" : "#f59e0b" }}>{p2}%</span>
          </div>
          <div style={{ height: 3, background: e1ok ? "#fde68a" : "#e7e5e4", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ height: "100%", width: `${p2}%`, background: record.etapa2?.estado === "aprobado" ? "#10b981" : "#f59e0b", borderRadius: 4 }} />
          </div>
          {!e1ok
            ? <div style={{ fontSize: 11, color: "#c0bdb9" }}>Bloqueada hasta E1</div>
            : record.etapa2?.estado === "aprobado"
              ? <div style={{ fontSize: 11, color: "#059669" }}>✓ Autorizado · {record.etapa2.fechaHora || ""}</div>
              : <button onClick={e => { e.stopPropagation(); onEtapa(record, 2); }} style={{ width: "100%", padding: "5px", background: "#f59e0b", border: "none", color: "#fff", borderRadius: 5, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>Completar →</button>
          }
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE = [
  { id:1, tipoElemento:["Losa de entrepiso"], elemento:"N+3.20",    eje:"A-C / 1-4",     nivel:"N+3.20",          fecha:"2026-02-18", residente:"Ing. Carlos Mendoza",
    etapa1:{ estado:"aprobado",  checklist:Object.fromEntries(CHECKLIST_E1.map(i=>[i.id,true])),  fotos:5, firmaResidente:true, firmaContratista:true, obs:"" },
    etapa2:{ estado:"aprobado",  checklist:Object.fromEntries(CHECKLIST_E2.map(i=>[i.id,true])),  fotos:4, firmaResidente:true, firmaContratista:true, obs:"Sin observaciones." } },
  { id:2, tipoElemento:["Columna"], elemento:"C-12", eje:"B / 3", nivel:"N+0.00–N+3.20", fecha:"2026-02-22", residente:"Ing. Laura Torres",
    etapa1:{ estado:"aprobado",  checklist:Object.fromEntries(CHECKLIST_E1.map(i=>[i.id,true])),  fotos:2, firmaResidente:true, firmaContratista:true, obs:"" },
    etapa2:{ estado:"pendiente", checklist:emptyCheck(CHECKLIST_E2), fotos:0, firmaResidente:false, firmaContratista:false, obs:"" } },
  { id:3, tipoElemento:["Losa de cimentación","Dados y contratrabes"], elemento:"CIM-01", eje:"A-D / 1-5", nivel:"N-1.20", fecha:"2026-02-25", residente:"Ing. Marco Ríos",
    etapa1:{ estado:"pendiente", checklist:emptyCheck(CHECKLIST_E1), fotos:0, firmaResidente:false, firmaContratista:false, obs:"" },
    etapa2: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// PANTALLA DE LOGIN
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_PINS = { dueno: "0000", residente: "1111" };

function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [pins, setPins] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, "config", "pins"));
        setPins(snap.exists() ? snap.data() : DEFAULT_PINS);
      } catch(e) { setPins(DEFAULT_PINS); }
    })();
  }, []);

  const handleKey = (k) => {
    if (k === "⌫") { setPin(p => p.slice(0, -1)); setError(""); return; }
    if (pin.length >= 6) return;
    const next = pin + k;
    setPin(next);
    if (!pins) return;
    if (next.length >= 4) {
      if (next === pins.dueno) { setPin(""); onLogin("dueno"); }
      else if (next === pins.residente) { setPin(""); onLogin("residente"); }
      else if (next.length >= 6) { setError("PIN incorrecto"); setPin(""); }
    }
  };

  if (!pins) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f7f6f3" }}><div style={{ color:"#a8a29e", fontSize:13 }}>Cargando...</div></div>;

  return (
    <div style={{ minHeight:"100vh", background:"#f7f6f3", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Inter',system-ui,sans-serif" }}>
      <div style={{ background:"#fff", borderRadius:16, padding:"40px 36px", width:300, boxShadow:"0 4px 24px rgba(0,0,0,.08)", textAlign:"center" }}>
        <div style={{ display:"flex", justifyContent:"center", gap:4, marginBottom:20 }}>
          <div style={{ width:10, height:10, borderRadius:3, background:"#3b82f6" }} />
          <div style={{ width:10, height:10, borderRadius:3, background:"#f59e0b" }} />
        </div>
        <div style={{ fontSize:18, fontWeight:700, color:"#1c1917", marginBottom:4 }}>Precolado</div>
        <div style={{ fontSize:12, color:"#a8a29e", marginBottom:28 }}>Ingresa tu PIN para continuar</div>

        {/* Puntos indicadores */}
        <div style={{ display:"flex", justifyContent:"center", gap:10, marginBottom:24 }}>
          {[0,1,2,3].map(i => (
            <div key={i} style={{ width:12, height:12, borderRadius:"50%", background: pin.length > i ? "#1c1917" : "#e7e5e4", transition:"background .15s" }} />
          ))}
        </div>

        {error && <div style={{ fontSize:12, color:"#ef4444", marginBottom:14, fontWeight:500 }}>{error}</div>}

        {/* Teclado numérico */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
            <button key={i} onClick={() => k && handleKey(k)} disabled={!k}
              style={{ padding:"14px 0", borderRadius:8, border:"1px solid #e7e5e4", background: k ? "#fff" : "transparent", color: k === "⌫" ? "#78716c" : "#1c1917", fontSize: k === "⌫" ? 18 : 20, fontWeight:500, cursor: k ? "pointer" : "default", transition:"background .1s", fontFamily:"inherit" }}
              onMouseEnter={e => { if(k) e.currentTarget.style.background="#f7f6f3"; }}
              onMouseLeave={e => { if(k) e.currentTarget.style.background="#fff"; }}>
              {k}
            </button>
          ))}
        </div>

        <div style={{ marginTop:24, fontSize:11, color:"#c0bdb9" }}>
          Autorizaciones de obra
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CAMBIAR PINES (solo dueño)
// ─────────────────────────────────────────────────────────────────────────────
function ChangePinsModal({ onClose }) {
  const [form, setForm] = useState({ dueno:"", residente:"" });
  const [saved, setSaved] = useState(false);
  const iStyle = { width:"100%", background:"#fff", border:"1px solid #e7e5e4", color:"#1c1917", padding:"9px 12px", borderRadius:6, fontSize:16, outline:"none", textAlign:"center", letterSpacing:4, fontFamily:"inherit" };
  const valid = form.dueno.length >= 4 && form.residente.length >= 4 && form.dueno !== form.residente;

  const save = async () => {
    await setDoc(doc(db, "config", "pins"), { dueno: form.dueno, residente: form.residente });
    setSaved(true);
    setTimeout(onClose, 1200);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(28,25,23,.4)", zIndex:200, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{ background:"#fff", borderRadius:12, padding:28, width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,.12)" }}>
        <div style={{ fontSize:16, fontWeight:700, marginBottom:4 }}>Cambiar PINs</div>
        <div style={{ fontSize:12, color:"#78716c", marginBottom:20 }}>Mínimo 4 dígitos. Deben ser diferentes entre sí.</div>
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:11, color:"#78716c", display:"block", marginBottom:5, fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>Tu PIN (Dueño)</label>
          <input type="password" inputMode="numeric" maxLength={6} value={form.dueno} onChange={e=>setForm(p=>({...p,dueno:e.target.value.replace(/\D/g,"")}))} style={iStyle} placeholder="••••" />
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:11, color:"#78716c", display:"block", marginBottom:5, fontWeight:600, letterSpacing:1, textTransform:"uppercase" }}>PIN del Residente</label>
          <input type="password" inputMode="numeric" maxLength={6} value={form.residente} onChange={e=>setForm(p=>({...p,residente:e.target.value.replace(/\D/g,"")}))} style={iStyle} placeholder="••••" />
        </div>
        {form.dueno && form.residente && form.dueno === form.residente && <div style={{ fontSize:12, color:"#ef4444", marginBottom:12 }}>Los PINs no pueden ser iguales</div>}
        {saved && <div style={{ fontSize:12, color:"#059669", marginBottom:12, fontWeight:600 }}>✓ PINs guardados</div>}
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={onClose} style={{ flex:1, padding:"9px", background:"transparent", border:"1px solid #e7e5e4", color:"#78716c", borderRadius:6, cursor:"pointer", fontSize:13 }}>Cancelar</button>
          <button onClick={save} disabled={!valid} style={{ flex:1, padding:"9px", background:valid?"#1c1917":"#e7e5e4", border:"none", color:valid?"#fff":"#a8a29e", borderRadius:6, cursor:valid?"pointer":"not-allowed", fontWeight:600, fontSize:13 }}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [role, setRole] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dash");
  const [selected, setSelected] = useState(null);
  const [etapaTarget, setEtapaTarget] = useState(null);
  const [filter, setFilter] = useState("todos");
  const [showPins, setShowPins] = useState(false);

  // Escucha en tiempo real a Firestore
  useEffect(() => {
    if (!role) return;
    setLoading(true);
    const unsub = onSnapshot(collection(db, "records"), (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setRecords(docs);
      setLoading(false);
    });
    return () => unsub();
  }, [role]);

  const filtered = filter === "todos" ? records : records.filter(r => globalEstado(r) === filter);
  const counts = {
    total:   records.length,
    proceso: records.filter(r => globalEstado(r) === "proceso").length,
    listo:   records.filter(r => globalEstado(r) === "listo").length,
  };

  const handleNew = async (datos) => {
    const id = Date.now().toString();
    const rec = { ...datos, createdAt: Date.now(), etapa1: { estado:"pendiente", checklist:emptyCheck(CHECKLIST_E1), fotos:[], firmaResidente:false, firmaContratista:false, obs:"" }, etapa2: null };
    await setDoc(doc(db, "records", id), rec);
    setEtapaTarget({ record: { id, ...rec }, num: 1 });
    setView("etapa");
  };

  const handleEtapaSave = async (record, num, data) => {
    const ref = doc(db, "records", record.id.toString());
    if (num === 1) {
      await updateDoc(ref, { etapa1: data, etapa2: { estado:"pendiente", checklist:emptyCheck(CHECKLIST_E2), fotos:[], firmaResidente:false, firmaContratista:false, obs:"" } });
    } else {
      await updateDoc(ref, { etapa2: data });
    }
    setView("dash");
  };

  const handleDelete = async (id) => {
    const { deleteDoc } = await import("firebase/firestore");
    await deleteDoc(doc(db, "records", id.toString()));
  };

  const openEtapa = (rec, num) => { setEtapaTarget({ record: rec, num }); setView("etapa"); };

  const FILTERS = [
    { key:"todos",   label:"Todos",       count: counts.total },
    { key:"proceso", label:"En proceso",  count: counts.proceso },
    { key:"listo",   label:"Autorizados", count: counts.listo },
  ];

  if (!role) return <LoginScreen onLogin={setRole} />;

  return (
    <div style={{ minHeight: "100vh", background: "#f7f6f3", color: "#1c1917", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #f7f6f3; } ::-webkit-scrollbar-thumb { background: #d6d3d1; border-radius: 3px; }
        input, select, textarea { color-scheme: light; font-family: inherit; }
        input::placeholder, textarea::placeholder { color: #c0bdb9; }
        option { background: #fff; }
        button { font-family: inherit; }
      `}</style>

      {/* NAV */}
      <div style={{ background: "#fff", borderBottom: "1px solid #e7e5e4", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#3b82f6" }} />
            <div style={{ width: 8, height: 8, borderRadius: 2, background: "#f59e0b" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: "#1c1917", letterSpacing: -.3 }}>Precolado</span>
          <span style={{ fontSize: 11, color: "#c0bdb9", borderLeft: "1px solid #e7e5e4", paddingLeft: 10, marginLeft: 2 }}>
            {role === "dueno" ? "👁 Dueño" : "🏗 Residente"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {view !== "dash" && (
            <button onClick={() => setView("dash")} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e7e5e4", background: "transparent", color: "#78716c", cursor: "pointer", fontSize: 12 }}>← Panel</button>
          )}
          {view === "dash" && role === "residente" && (
            <button onClick={() => setView("new")} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#1c1917", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>+ Nuevo elemento</button>
          )}
          {role === "dueno" && (
            <button onClick={() => setShowPins(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e7e5e4", background: "transparent", color: "#78716c", cursor: "pointer", fontSize: 12 }}>⚙ PINs</button>
          )}
          <button onClick={() => { setRole(null); setView("dash"); setRecords([]); }} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #e7e5e4", background: "transparent", color: "#78716c", cursor: "pointer", fontSize: 12 }}>Salir</button>
        </div>
      </div>

      <div style={{ padding: "28px 24px", maxWidth: 860, margin: "0 auto" }}>
        {/* DASHBOARD */}
        {view === "dash" && (
          <>
            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
              {[
                { key: "todos",   label: "Total",        val: counts.total,   color: "#1c1917", bg: "#fff" },
                { key: "proceso", label: "En proceso",   val: counts.proceso, color: "#d97706", bg: "#fffbeb" },
                { key: "listo",   label: "Autorizados",  val: counts.listo,   color: "#059669", bg: "#f0fdf4" },
              ].map(s => (
                <div key={s.key} onClick={() => setFilter(s.key)} style={{ background: s.bg, border: `1px solid ${filter === s.key ? s.color + "44" : "#e7e5e4"}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", transition: "all .15s" }}>
                  <div style={{ fontSize: 30, fontWeight: 700, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: "#a8a29e", marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Leyenda */}
            <div style={{ display: "flex", gap: 20, marginBottom: 16, fontSize: 11, color: "#a8a29e" }}>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:8,height:8,borderRadius:2,background:"#3b82f6",display:"inline-block" }}/>Etapa 1 — Pre-cimbrado · {CHECKLIST_E1.length} puntos</span>
              <span style={{ display:"flex", alignItems:"center", gap:5 }}><span style={{ width:8,height:8,borderRadius:2,background:"#f59e0b",display:"inline-block" }}/>Etapa 2 — Pre-colado · {CHECKLIST_E2.length} puntos</span>
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {FILTERS.map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === f.key ? "#1c1917" : "#e7e5e4"}`, background: filter === f.key ? "#1c1917" : "transparent", color: filter === f.key ? "#fff" : "#78716c", cursor: "pointer", fontSize: 11, fontWeight: filter === f.key ? 600 : 400, fontFamily: "inherit" }}>
                  {f.label} <span style={{ opacity: 0.6 }}>{f.count}</span>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.length === 0 && (
                <div style={{ textAlign: "center", color: "#c0bdb9", padding: 48, fontSize: 13 }}>
                  {role === "residente"
                    ? <><span>Sin registros. </span><span onClick={() => setView("new")} style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 500 }}>Crear el primero →</span></>
                    : <span>Sin registros aún. El residente debe crear el primer elemento.</span>
                  }
                </div>
              )}
              {filtered.map(r => (
                <Card key={r.id} record={r} onClick={setSelected} onEtapa={role === "residente" ? openEtapa : null} onDelete={handleDelete} />
              ))}
            </div>
          </>
        )}

        {view === "new" && role === "residente" && <NewElementForm onSave={handleNew} onCancel={() => setView("dash")} />}

        {view === "etapa" && etapaTarget && role === "residente" && (
          <EtapaForm record={etapaTarget.record} etapaNum={etapaTarget.num} onSave={handleEtapaSave} onCancel={() => setView("dash")} />
        )}
      </div>

      <DetailModal
        record={selected}
        onClose={() => setSelected(null)}
        onFillEtapa={role === "residente" ? (rec, num) => { setSelected(null); openEtapa(rec, num); } : null}
      />

      {showPins && <ChangePinsModal onClose={() => setShowPins(false)} />}
    </div>
  );
}
