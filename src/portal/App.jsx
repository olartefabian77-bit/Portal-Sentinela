import { useAuthPortal } from './hooks/useAuthPortal' // ajusta la ruta si hace falta

const {
  loading, errorMsg, okMsg,
  country, setCountry,
  dealer, setDealer,
  handleLogin, handleRegister
} = useAuthPortal()
// Al inicio del archivo:
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient' // Ajusta la ruta si este archivo no está en src raíz

// Dentro del componente:
const [loading, setLoading] = useState(false)
const [errorMsg, setErrorMsg] = useState('')
const [okMsg, setOkMsg] = useState('')
const [country, setCountry] = useState('Colombia')
const [dealer, setDealer] = useState('')

// (Opcional) Detectar sesión activa
useEffect(() => {
  supabase.auth.getUser().then(({ data }) => {
    if (data?.user) setOkMsg(`Sesión activa: ${data.user.email}`)
  })
}, [])

const handleLogin = async (e) => {
  e.preventDefault()
  setErrorMsg(''); setOkMsg(''); setLoading(true)
  const email = e.target.email.value.trim()
  const password = e.target.password.value
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    setOkMsg('Inicio de sesión correcto')
    // TODO: redirigir a dashboard cuando exista
  } catch (err) {
    setErrorMsg(err.message)
  } finally {
    setLoading(false)
  }
}

const handleRegister = async (e) => {
  e.preventDefault()
  setErrorMsg(''); setOkMsg(''); setLoading(true)
  const email = e.target.regEmail.value.trim()
  const password = e.target.regPassword.value
  try {
    // 1) Crear usuario
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    const user = data.user
    if (!user) throw new Error('No se pudo crear el usuario')

    // 2) Insertar perfil (tabla profiles)
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email,
      country,
      dealer,
      role: 'dealer'
    })
    if (insertError) throw insertError

    setOkMsg('Cuenta creada. Revisa tu correo si la verificación está activada.')
  } catch (err) {
    setErrorMsg(err.message)
  } finally {
    setLoading(false)
  }
}
import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Separator } from "../components/ui/separator";
import { CalendarDays, LogOut, Paperclip, PlusCircle, Upload, Wrench, User, Building2 } from "lucide-react";

// ------------------------------------------------------------
// Utilidades de almacenamiento local (prototipo sin backend)
// ------------------------------------------------------------
const USERS_KEY = "gm_users"; // [{ email, password, dealerName, country, createdAt }]
const SESSION_KEY = "gm_session"; // { email }
const CASES_KEY = "gm_cases"; // [{ id, concesionario, email, vin, vehiculo, kilometraje, condicion, fechaFalla, ot, estado, dtc, placa, ciudadFalla, adjuntos[], createdAt, updatedAt? }]

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }
function loadSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function saveSession(session) { localStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function clearSession() { localStorage.removeItem(SESSION_KEY); }
function loadCases() { try { return JSON.parse(localStorage.getItem(CASES_KEY) || "[]"); } catch { return []; } }
function saveCases(casesArr) { localStorage.setItem(CASES_KEY, JSON.stringify(casesArr)); }

// Validaciones básicas
const isEmail = (v) => /\S+@\S+\.\S+/.test(v);
const cleanVIN = (v) => (v || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 17);

// Países y concesionarios
const COUNTRY_OPTIONS = [
  "Colombia", "Perú", "Chile", "Ecuador", "Venezuela", "Bolivia", "Uruguay", "Paraguay", "Argentina"
];
const DEALERS_BY_COUNTRY = {
  Colombia: [
    "Autolarte", "Andar", "Automarcali", "Automayor", "Autolitoral", "Llano grande", "Autoniza", "Autopacifico",
    "Autos y camiones de Boyaca", "Autosuperior", "Ayura Motors", "Campesa", "Autoshop", "Codiesel", "Coltolima",
    "Caminos", "Continautos", "Country Motors", "vehícosta"
  ]
};

// ------------------------------------------------------------
// Paleta GM
// ------------------------------------------------------------
const gm = {
  primary: "#194390",
  primaryLight: "#5C93CC",
  accent: "#86C1E2",
  dark: "#000082",
  white: "#FFFFFF",
};

const chevy = { gold: "#D4AA4D", silver: "#C0C0C0", black: "#000000" };

const CASE_STATES = ["abierto","en proceso","información pendiente","solucionado","cerrado"];

function downloadBlob(data, filename, mime) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function toCSV(cases) {
  const headers = [
    "id","concesionario","fecha_falla","estado","vin","vehiculo","kilometraje","ot","placa","ciudad_falla","dtc","adjuntos","creado_en","actualizado_en","correo"
  ];
  const escape = (v) => {
    const s = (v ?? "").toString().replace(/"/g, '""');
    return `"${s}"`;
  };
  const rows = cases.map(c => [
    c.id,
    c.concesionario,
    c.fechaFalla,
    c.estado ?? "",
    c.vin,
    c.vehiculo,
    c.kilometraje,
    c.ot,
    c.placa ?? "",
    c.ciudadFalla ?? "",
    c.dtc ?? "",
    (c.adjuntos?.length ?? 0),
    c.createdAt,
    c.updatedAt ?? "",
    c.email ?? "",
  ].map(escape).join(","));
  const bom = "\uFEFF";
  return bom + [headers.join(","), ...rows].join("\n");
}

function toExcelHTML(cases) {
  const cols = [
    { key: "id", label: "ID" },
    { key: "concesionario", label: "Concesionario" },
    { key: "fechaFalla", label: "Fecha de la falla" },
    { key: "estado", label: "Estado" },
    { key: "vin", label: "VIN" },
    { key: "vehiculo", label: "Vehículo" },
    { key: "kilometraje", label: "Kilometraje" },
    { key: "ot", label: "OT" },
    { key: "placa", label: "Placa" },
    { key: "ciudadFalla", label: "Ciudad donde falló" },
    { key: "dtc", label: "DTC" },
    { key: "adjuntos", label: "# Adjuntos" },
    { key: "createdAt", label: "Creado en" },
    { key: "updatedAt", label: "Actualizado en" },
    { key: "email", label: "Correo" },
  ];
  const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const thead = `<tr>${cols.map(c => `<th style="text-align:left; background:#eef2ff; border:1px solid #ddd; padding:4px;">${esc(c.label)}</th>`).join("")}</tr>`;
  const tbody = cases.map(c => {
    const tds = cols.map(col => {
      let val = c[col.key];
      if (col.key === "adjuntos") val = c.adjuntos?.length ?? 0;
      return `<td style="border:1px solid #ddd; padding:4px;">${esc(val)}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");
  const html = `\uFEFF<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="UTF-8" /></head>
<body><table>${thead}${tbody}</table></body></html>`;
  return html;
}

export default function App(){
  const [users, setUsers] = useState(loadUsers());
  const [session, setSession] = useState(loadSession());
  const [cases, setCases] = useState(loadCases());
  const currentUser = useMemo(() => users.find(u => u.email === session?.email) || null, [users, session]);

  useEffect(() => { saveUsers(users); }, [users]);
  useEffect(() => { session ? saveSession(session) : clearSession(); }, [session]);
  useEffect(() => { saveCases(cases); }, [cases]);

  const handleUpdateCase = (updated) => {
    setCases((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated, updatedAt: new Date().toISOString() } : c));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50 text-slate-900">
      <TopBar currentUser={currentUser} onLogout={() => setSession(null)} gm={gm} chevy={chevy} />

      <main className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 space-y-6">
        {!currentUser ? (
          <AuthCard
            onRegister={(u) => { setUsers((prev) => [...prev, u]); setSession({ email: u.email }); }}
            onLogin={(email) => setSession({ email })}
            users={users}
            gm={gm}
          />
        ) : (
          <>
            <IntroBanner dealerName={currentUser.dealerName} gm={gm} country={currentUser.country} />

            <Card className="border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl"><Wrench className="h-5 w-5 text-blue-600"/> Escalar nuevo caso</CardTitle>
              </CardHeader>
              <CardContent>
                <CaseForm
                  onSubmit={(newCase) => setCases((prev) => [newCase, ...prev])}
                  dealerName={currentUser.dealerName}
                  email={currentUser.email}
                />
              </CardContent>
            </Card>

            <CasesStrip cases={cases} gm={gm} onUpdateCase={handleUpdateCase} />
          </>
        )}
      </main>

      <footer className="mt-10 border-t bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/60" role="contentinfo">
        <div className="mx-auto max-w-7xl p-4 text-xs text-slate-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} GM — Portal de Casos Repetitivos (prototipo)</span>
          <span className="hidden sm:inline">Construido con React, Tailwind y UI simplificada</span>
        </div>
      </footer>
    </div>
  );
}

function TopBar({ currentUser, onLogout, gm, chevy }) {
  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-md flex items-center justify-center shadow"
            style={{ background: `linear-gradient(135deg, ${gm.primary}, ${gm.primaryLight})` }}
            aria-label="GM Logo"
            title="GM"
          >
            <span className="text-white font-bold lowercase">gm</span>
          </div>
          <div className="h-9 w-16 rounded-md flex items-center justify-center bg-white border shadow px-1" title="Chevrolet" aria-label="Chevrolet Logo">
            <svg viewBox="0 0 160 60" className="h-6" role="img" aria-hidden="true">
              <path d="M10 30 L40 10 L120 10 L150 30 L120 50 L40 50 Z" fill={chevy.gold} stroke={chevy.silver} strokeWidth="4" />
            </svg>
          </div>
          <div className="leading-tight">
            <div className="font-semibold">Portal de Concesionarios</div>
            <div className="text-xs text-slate-500">Casos repetitivos de campo</div>
          </div>
        </div>

        {currentUser ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium">{currentUser.dealerName}</div>
              <div className="text-xs text-slate-500">{currentUser.email} · {currentUser.country}</div>
            </div>
            <Button variant="outline" className="gap-2" onClick={onLogout} aria-label="Cerrar sesión">
              <LogOut className="h-4 w-4" /> Salir
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

function IntroBanner({ dealerName, gm, country }) {
  return (
    <div className="rounded-2xl p-5 sm:p-6 shadow-lg bg-white overflow-hidden border">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Hola, {dealerName}</h1>
          <p className="text-slate-600">País: <span className="font-medium">{country}</span>. Registra y consulta condiciones de falla repetitivas para acelerar la resolución técnica.</p>
        </div>
        <div className="rounded-xl px-4 py-3 text-white shadow-md" style={{ background: `linear-gradient(135deg, ${gm.primaryLight}, ${gm.accent})` }}>
          <div className="text-xs uppercase tracking-wider opacity-90">Estado</div>
          <div className="text-sm font-semibold">Prototipo UI — sólo almacenamiento local</div>
        </div>
      </div>
    </div>
  );
}

function AuthCard({ onRegister, onLogin, users, gm }) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDealer, setRegDealer] = useState("");
  const [regCountry, setRegCountry] = useState("Colombia");
  const [msg, setMsg] = useState(null);

  const handleLogin = (e) => {
    e.preventDefault();
    setMsg(null);
    const user = users.find(u => u.email.toLowerCase() === loginEmail.toLowerCase());
    if (!user) return setMsg({ type: "error", text: "Usuario no encontrado." });
    if (user.password !== loginPassword) return setMsg({ type: "error", text: "Contraseña incorrecta." });
    onLogin(user.email);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setMsg(null);
    if (!COUNTRY_OPTIONS.includes(regCountry)) return setMsg({ type: "error", text: "Selecciona un país válido." });
    if (!isEmail(regEmail)) return setMsg({ type: "error", text: "Ingresa un correo electrónico válido." });
    if (regPassword.length < 6) return setMsg({ type: "error", text: "La contraseña debe tener al menos 6 caracteres." });

    if (regCountry === "Colombia") {
      if (!DEALERS_BY_COUNTRY.Colombia.includes(regDealer)) return setMsg({ type: "error", text: "Selecciona un concesionario de la lista de Colombia." });
    } else {
      if (!regDealer.trim()) return setMsg({ type: "error", text: "Ingresa el nombre del concesionario." });
    }

    if (users.some(u => u.email.toLowerCase() === regEmail.toLowerCase())) return setMsg({ type: "error", text: "El correo ya está registrado." });

    onRegister({ email: regEmail, password: regPassword, dealerName: regDealer.trim(), country: regCountry, createdAt: new Date().toISOString() });
  };

  const dealerOptions = regCountry === "Colombia" ? (DEALERS_BY_COUNTRY.Colombia || []) : [];

  return (
    <Card className="border-0 shadow-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Acceso de Concesionarios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="register">Crear cuenta</TabsTrigger>
          </TabsList>
          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginEmail">Correo electrónico</Label>
                <Input id="loginEmail" type="email" placeholder="correo@concesionario.com" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginPass">Contraseña</Label>
                <Input id="loginPass" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gap-2" variant="default">
                <User className="h-4 w-4"/> Entrar
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="regCountry">País</Label>
                  <select id="regCountry" className="w-full rounded-md border px-3 py-2 bg-white" value={regCountry} onChange={(e) => { setRegCountry(e.target.value); setRegDealer(""); }}>
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="regDealer">Concesionario</Label>
                  {regCountry === "Colombia" ? (
                    <select id="regDealer" className="w-full rounded-md border px-3 py-2 bg-white" value={regDealer} onChange={(e) => setRegDealer(e.target.value)}>
                      <option value="">Selecciona un concesionario</option>
                      {dealerOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : (
                    <Input id="regDealer" placeholder="Nombre del concesionario" value={regDealer} onChange={(e) => setRegDealer(e.target.value)} required />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="regEmail">Correo electrónico</Label>
                <Input id="regEmail" type="email" placeholder="correo@concesionario.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="regPass">Contraseña</Label>
                <Input id="regPass" type="password" placeholder="Mínimo 6 caracteres" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gap-2" variant="default">
                <Building2 className="h-4 w-4"/> Crear cuenta
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {msg && (
          <div className={`mt-4 rounded-md p-3 text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
            {msg.text}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CaseForm({ onSubmit, dealerName, email }) {
  const [vin, setVin] = useState("");
  const [vehiculo, setVehiculo] = useState("");
  const [km, setKm] = useState("");
  const [condicion, setCondicion] = useState("");
  const [fecha, setFecha] = useState("");
  const [ot, setOt] = useState("");
  const [estado, setEstado] = useState("abierto");
  const [dtc, setDtc] = useState("");
  const [placa, setPlaca] = useState("");
  const [ciudadFalla, setCiudadFalla] = useState("");
  const [files, setFiles] = useState([]);
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 3500);
    return () => clearTimeout(t);
  }, [banner]);

  const handleFiles = (e) => {
    const incoming = Array.from(e.target.files || []);
    const mapped = incoming.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      url: URL.createObjectURL(f),
      type: f.type.startsWith("image/") ? "image" : f.type.startsWith("video/") ? "video" : "other",
      name: f.name,
      size: f.size,
    }));
    setFiles((prev) => [...prev, ...mapped]);
  };

  const removeFile = (id) => setFiles((prev) => prev.filter(f => f.id !== id));

  const resetForm = () => {
    setVin(""); setVehiculo(""); setKm(""); setCondicion(""); setFecha(""); setOt(""); setEstado("abierto"); setDtc(""); setPlaca(""); setCiudadFalla(""); setFiles([]);
  };

  const submit = (e) => {
    e.preventDefault();
    const vinClean = cleanVIN(vin);
    if (vinClean.length !== 17) return setBanner({ type: "error", text: "El VIN debe tener 17 caracteres." });
    if (!vehiculo.trim()) return setBanner({ type: "error", text: "Ingresa el modelo del vehículo." });
    const kmNum = Number(km);
    if (!Number.isFinite(kmNum) || kmNum < 0) return setBanner({ type: "error", text: "Kilometraje inválido." });
    if (!condicion.trim()) return setBanner({ type: "error", text: "Describe la condición de falla." });
    if (!fecha) return setBanner({ type: "error", text: "Selecciona la fecha de la falla." });
    if (!ot.trim()) return setBanner({ type: "error", text: "Ingresa el número de OT." });

    const newCase = {
      id: `CASE-${Date.now()}`,
      concesionario: dealerName,
      email,
      vin: vinClean,
      vehiculo: vehiculo.trim(),
      kilometraje: kmNum,
      condicion: condicion.trim(),
      fechaFalla: fecha,
      ot: ot.trim(),
      estado,
      dtc: dtc.trim(),
      placa: placa.trim().toUpperCase(),
      ciudadFalla: ciudadFalla.trim(),
      adjuntos: files.map(({ id, url, type, name, size }) => ({ id, url, type, name, size })),
      createdAt: new Date().toISOString(),
    };
    onSubmit(newCase);
    resetForm();
    setBanner({ type: "success", text: "Caso creado correctamente." });
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {banner && (
        <div className={`rounded-md p-3 text-sm ${banner.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {banner.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="vin">VIN (17 caracteres)</Label>
          <Input id="vin" value={vin} onChange={(e) => setVin(e.target.value)} placeholder="Ej. 1G1YZ23J9P5800001" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vehiculo">Vehículo</Label>
          <Input id="vehiculo" value={vehiculo} onChange={(e) => setVehiculo(e.target.value)} placeholder="Modelo/Versión" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="km">Kilometraje</Label>
          <Input id="km" type="number" value={km} onChange={(e) => setKm(e.target.value)} placeholder="Ej. 25400" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fecha">Fecha de la falla</Label>
          <div className="relative">
            <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            <CalendarDays className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="estado">Estado del caso</Label>
          <select id="estado" className="w-full rounded-md border px-3 py-2 bg-white" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {CASE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ciudadFalla">Ciudad donde falló</Label>
          <Input id="ciudadFalla" value={ciudadFalla} onChange={(e) => setCiudadFalla(e.target.value)} placeholder="Ej. Bogotá" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" value={placa} onChange={(e) => setPlaca(e.target.value)} placeholder="Ej. ABC123" />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="dtc">Códigos DTC (separados por coma)</Label>
          <Input id="dtc" value={dtc} onChange={(e) => setDtc(e.target.value)} placeholder="Ej. P0301, U0100" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="condicion">Condición de falla (describe el síntoma)</Label>
        <Textarea id="condicion" value={condicion} onChange={(e) => setCondicion(e.target.value)} placeholder="Relata la falla presentada por el vehículo, condiciones de aparición, testigos en el tablero, códigos DTC, etc." rows={4} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ot">Número de la OT (Orden de Trabajo)</Label>
        <Input id="ot" value={ot} onChange={(e) => setOt(e.target.value)} placeholder="Ej. OT-00012345" required />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Adjuntos</Label>
          <span className="text-xs text-slate-500">Imágenes y videos ayudan a validar más rápido</span>
        </div>
        <div className="rounded-lg border-dashed border-2 p-4 border-slate-300 bg-slate-50/60">
          <label className="flex flex-col items-center justify-center gap-2 cursor-pointer" aria-label="Subir adjuntos">
            <input type="file" className="hidden" multiple accept="image/*,video/*" onChange={handleFiles} />
            <Upload className="h-5 w-5 text-slate-500"/>
            <div className="text-sm text-slate-600">Arrastra y suelta o <span className="underline">haz clic para seleccionar</span></div>
            <div className="text-xs text-slate-400">Formatos: JPG, PNG, MP4, MOV…</div>
          </label>

          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {files.map((f) => (
                <div key={f.id} className="group relative rounded-lg overflow-hidden border bg-white">
                  {f.type === "image" ? (
                    <img src={f.url} alt={f.name} className="h-32 w-full object-cover"/>
                  ) : f.type === "video" ? (
                    <video src={f.url} className="h-32 w-full object-cover" muted />
                  ) : (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-500">
                      <Paperclip className="h-4 w-4 mr-1"/> {f.name}
                    </div>
                  )}
                  <button type="button" onClick={() => removeFile(f.id)} className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs shadow hover:bg-white">Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" onClick={resetForm}>Limpiar</Button>
        <Button type="submit" className="gap-2">
          <PlusCircle className="h-4 w-4"/> Crear caso
        </Button>
      </div>
    </form>
  );
}

function CasesStrip({ cases, gm, onUpdateCase }) {
  const [activeCase, setActiveCase] = useState(null);
  const hasCases = cases && cases.length > 0;

  const stateBadgeClass = (estado) => {
    const base = "text-xs px-2 py-0.5 rounded-full";
    switch (estado) {
      case "abierto": return `${base} bg-blue-50 text-blue-700 border border-blue-200`;
      case "en proceso": return `${base} bg-amber-50 text-amber-700 border border-amber-200`;
      case "información pendiente": return `${base} bg-violet-50 text-violet-700 border border-violet-200`;
      case "solucionado": return `${base} bg-emerald-50 text-emerald-700 border border-emerald-200`;
      case "cerrado": return `${base} bg-slate-100 text-slate-700 border border-slate-200`;
      default: return `${base} bg-slate-50 text-slate-700 border`;
    }
  };

  const handleExportCSV = () => {
    const csv = toCSV(cases);
    downloadBlob(csv, `gm_casos_${new Date().toISOString().slice(0,10)}.csv`, "text/csv;charset=utf-8;");
  };

  const handleExportExcel = () => {
    const html = toExcelHTML(cases);
    downloadBlob(html, `gm_casos_${new Date().toISOString().slice(0,10)}.xls`, "application/vnd.ms-excel;charset=utf-8;");
  };

  const handleUpdate = (updated) => {
    onUpdateCase?.(updated);
    if (activeCase?.id === updated.id) setActiveCase(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Casos registrados</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>Exportar CSV</Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel}>Exportar Excel (.xls)</Button>
        </div>
      </div>
      <div className="rounded-xl border bg-white p-3">
        {hasCases ? (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
            {cases.map((c) => (
              <article key={c.id} className="min-w-[340px] snap-start rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
                <header className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <span className={stateBadgeClass(c.estado)}>{c.estado || "abierto"}</span>
                  <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                </header>
                <Separator />
                <div className="p-4 space-y-3">
                  <div className="text-sm"><span className="font-medium">Concesionario:</span> {c.concesionario}</div>
                  <div className="text-sm"><span className="font-medium">Fecha de la falla:</span> {new Date(c.fechaFalla).toLocaleDateString?.() || c.fechaFalla}</div>
                  <div className="text-sm"><span className="font-medium">Descripción:</span> <span className="line-clamp-3">{c.condicion}</span></div>

                  <div className="flex items-center gap-2 pt-1">
                    {c.adjuntos?.length > 0 && (
                      <Badge variant="secondary" className="gap-1"><Paperclip className="h-3 w-3"/> {c.adjuntos.length} adj.</Badge>
                    )}
                    <Dialog open={activeCase?.id === c.id} onOpenChange={(open) => setActiveCase(open ? c : null)}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">Revisar</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Detalle del caso</DialogTitle>
                        </DialogHeader>
                        <CaseDetails c={c} onUpdateCase={handleUpdate} />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500 text-sm">Aún no hay casos registrados.</div>
        )}
      </div>
    </div>
  );
}

function CaseDetails({ c, onUpdateCase }) {
  const [estado, setEstado] = useState(c.estado || "abierto");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const saveEstado = async () => {
    try {
      setSaving(true);
      onUpdateCase && onUpdateCase({ ...c, estado });
      setMsg({ type: "success", text: "Estado actualizado." });
    } catch (e) {
      setMsg({ type: "error", text: "No se pudo actualizar el estado." });
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(null), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {msg && (
        <div className={`rounded-md p-2 text-sm ${msg.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><span className="font-medium">Concesionario:</span> {c.concesionario}</div>
        <div><span className="font-medium">Fecha de la falla:</span> {new Date(c.fechaFalla).toLocaleDateString?.() || c.fechaFalla}</div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Estado:</span>
          <select className="rounded-md border px-2 py-1 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
            {CASE_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <Button size="sm" variant="outline" onClick={saveEstado} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</Button>
        </div>
        <div><span className="font-medium">VIN:</span> {c.vin}</div>
        <div><span className="font-medium">Vehículo:</span> {c.vehiculo}</div>
        <div><span className="font-medium">Kilometraje:</span> {c.kilometraje.toLocaleString?.() || c.kilometraje} km</div>
        <div><span className="font-medium">OT:</span> {c.ot}</div>
        <div><span className="font-medium">Placa:</span> {c.placa || "—"}</div>
        <div><span className="font-medium">Ciudad donde falló:</span> {c.ciudadFalla || "—"}</div>
        <div><span className="font-medium">DTC:</span> {c.dtc || "—"}</div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-medium">Condición de falla</div>
        <div className="text-sm text-slate-700 whitespace-pre-wrap">{c.condicion}</div>
      </div>

      {c.adjuntos?.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Adjuntos</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {c.adjuntos.map((a) => (
              <div key={a.id} className="rounded-lg overflow-hidden border bg-white">
                {a.type === "image" ? (
                  <img src={a.url} alt={a.name} className="h-36 w-full object-cover"/>
                ) : a.type === "video" ? (
                  <video src={a.url} className="h-36 w-full object-cover" controls />
                ) : (
                  <div className="h-36 flex items-center justify-center text-xs text-slate-500">
                    <Paperclip className="h-4 w-4 mr-1"/> {a.name}
                  </div>
                )}
                <div className="px-3 py-2 text-xs text-slate-600 truncate">{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">Sin adjuntos.</div>
      )}
    </div>
  );
}
