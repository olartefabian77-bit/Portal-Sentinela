// Archivo sugerido: src/pages/Login.jsx  (ajusta el nombre/ruta según tu proyecto)

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient"; // ⬅️ Ajusta esta ruta si tu supabaseClient está en otra carpeta

/**
 * Página de acceso para concesionarios GM.
 * - Login con email/contraseña (Supabase v2)
 * - Selección de país y concesionario
 * - Estado de sesión y logout
 * - Código en español y validaciones básicas
 */

const PAISES = [
  "Colombia",
  "Perú",
  "Chile",
  "Ecuador",
  "Venezuela",
  "Bolivia",
  "Uruguay",
  "Paraguay",
  "Argentina",
];

// ⚠️ Lista ejemplo (puedes reemplazarla por la definitiva que ya tenemos en tu otro archivo)
const DEALERS_POR_PAIS = {
  Colombia: [
    "Selecciona un concesionario…",
    "AUTOGERMANA",
    "AUTOLARTE",
    "AUTONIZA",
    "AUTOCENTRO",
    "CHEVROLET SERVICIOS",
  ],
  Perú: ["Selecciona un concesionario…"],
  Chile: ["Selecciona un concesionario…"],
  Ecuador: ["Selecciona un concesionario…"],
  Venezuela: ["Selecciona un concesionario…"],
  Bolivia: ["Selecciona un concesionario…"],
  Uruguay: ["Selecciona un concesionario…"],
  Paraguay: ["Selecciona un concesionario…"],
  Argentina: ["Selecciona un concesionario…"],
};

export default function Login() {
  // --- Estado de formulario / UI ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [country, setCountry] = useState("Colombia");
  const [dealer, setDealer] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorAuth, setErrorAuth] = useState(null);
  const [message, setMessage] = useState(null);

  // --- Estado de sesión mínima para mostrar quién está logueado ---
  const [dbUser, setDbUser] = useState(null); // { sessionActive: string } | null

  // Lista de concesionarios según país (memo para rendimiento)
  const dealersOptions = useMemo(() => {
    const lista = DEALERS_POR_PAIS[country] ?? ["Selecciona un concesionario…"];
    return lista;
  }, [country]);

  // --- Suscripción a cambios de sesión (Supabase v2) ---
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user?.email) {
        setDbUser({ sessionActive: session.user.email });
      } else {
        setDbUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe?.();
    };
  }, []);

  // --- Acciones ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorAuth(null);
    setMessage(null);

    if (!email || !password) {
      setErrorAuth("Por favor, completa email y contraseña.");
      return;
    }

    if (!country) {
      setErrorAuth("Selecciona un país.");
      return;
    }

    if (!dealer) {
      setErrorAuth("Selecciona un concesionario.");
      return;
    }

    try {
      setLoading(true);

      // Supabase v2: signInWithPassword
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorAuth(error.message ?? "No fue posible iniciar sesión.");
        return;
      }

      setMessage("¡Inicio de sesión exitoso!");
      // Aquí puedes redirigir, por ejemplo:
      // navigate('/panel');  // si usas react-router
    } catch (err) {
      setErrorAuth(err?.message ?? "Error inesperado al iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setErrorAuth(null);
    setMessage(null);
    try {
      await supabase.auth.signOut();
      setMessage("Sesión cerrada correctamente.");
    } catch (err) {
      setErrorAuth(err?.message ?? "Error al cerrar sesión.");
    }
  };

  // --- Render ---
  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>Portal GM — Acceso de Concesionarios</h1>

        {/* Estado de sesión */}
        <div style={styles.sessionBox}>
          {dbUser ? (
            <div>
              <span>
                Sesión activa: <strong>{dbUser.sessionActive}</strong>
              </span>
              <button style={styles.linkButton} onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <span>No hay sesión iniciada</span>
          )}
        </div>

        {/* Alertas */}
        {!!errorAuth && <div style={styles.error}>{errorAuth}</div>}
        {!!message && <div style={styles.success}>{message}</div>}

        {/* Formulario */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="usuario@concesionario.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldRow}>
            <div style={styles.field}>
              <label htmlFor="country">País</label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setDealer(""); // reinicia dealer al cambiar país
                }}
                style={styles.select}
              >
                {PAISES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.field}>
              <label htmlFor="dealer">Concesionario</label>
              <select
                id="dealer"
                value={dealer}
                onChange={(e) => setDealer(e.target.value)}
                style={styles.select}
              >
                <option value="" disabled>
                  Selecciona un concesionario…
                </option>
                {dealersOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            disabled={loading}
          >
            {loading ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}

