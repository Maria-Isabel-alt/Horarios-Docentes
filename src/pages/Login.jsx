import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/config";
import "./Login.css";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [mensaje, setMensaje] = useState("");

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setMensaje("");

    if (!correo || !password) {
      setMensaje("Debes escribir el correo y la contraseña.");
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, correo, password);
    } catch (error) {
      setMensaje("Correo o contraseña incorrectos.");
      console.log(error);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <h1>Horarios Docentes</h1>
        <p>Ingresa para organizar la programación académica.</p>

        {mensaje && <div className="login-mensaje">{mensaje}</div>}

        <form onSubmit={iniciarSesion}>
          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="director@correo.com"
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Escribe tu contraseña"
          />

          <button type="submit">Iniciar sesión</button>
        </form>
      </section>
    </main>
  );
}

export default Login;