import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [auth, setAuth] = useState(
    !!localStorage.getItem("token")
  );

  const [showRegister, setShowRegister] = useState(false);

  if (!auth) {
    return showRegister ? (
      <Register setAuth={setAuth} setShowRegister={setShowRegister} />
    ) : (
      <Login setAuth={setAuth} setShowRegister={setShowRegister} />
    );
  }

  return <Dashboard setAuth={setAuth} />;
}
