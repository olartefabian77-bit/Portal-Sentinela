import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Panel from './pages/Panel.jsx';
import PrivateRoute from './routes/PrivateRoute.jsx';
import './index.css'; // si usas Tailwind o tus estilos
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Ruta protegida: requiere sesión */}
        <Route
          path="/panel"
          element={
            <PrivateRoute>
              <Panel />
            </PrivateRoute>
          }
        />
        {/* Redirección por defecto */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
``
