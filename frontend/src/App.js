import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";

export default function App() {
  const [auth, setAuth] = useState(
    !!localStorage.getItem("token")
  );

  const [showRegister, setShowRegister] = useState(false);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={!auth ? <Login setAuth={setAuth} setShowRegister={setShowRegister} /> : <Navigate to="/dashboard" />} 
        />
        <Route 
          path="/register" 
          element={!auth ? <Register setAuth={setAuth} setShowRegister={setShowRegister} /> : <Navigate to="/dashboard" />} 
        />
        
        {/* Private Routes */}
        <Route 
          path="/dashboard" 
          element={auth ? <Dashboard setAuth={setAuth} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/pricing" 
          element={auth ? <Pricing /> : <Navigate to="/login" />} 
        />

        {/* Default Route */}
        <Route path="*" element={<Navigate to={auth ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}
