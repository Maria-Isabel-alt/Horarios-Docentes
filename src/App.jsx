import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "./App.css";

import Login from "./pages/Login";
import Docentes from "./pages/Docentes";
import Grupos from "./pages/Grupos";
import Asignaturas from "./pages/Asignaturas";
import Programacion from "./pages/Programacion";
import Alertas from "./pages/Alertas";

import { auth } from "./Firebase/config";
import { obtenerAlertas } from "./utils/horarios";

import {
  escucharClasesDelUsuario,
  agregarClaseFirestore,
  eliminarClaseFirestore,
} from "./services/clasesService";

function App() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Después de iniciar sesión, entra directo a Programación
  const [pestanaActiva, setPestanaActiva] = useState("programacion");

  // Ahora las clases vienen de Firestore
  const [clases, setClases] = useState([]);

  useEffect(() => {
    const cancelarEscucha = onAuthStateChanged(auth, (user) => {
      setUsuario(user);
      setCargando(false);
    });

    return () => cancelarEscucha();
  }, []);

  useEffect(() => {
    if (!usuario) return;

    const cancelarEscucha = escucharClasesDelUsuario(usuario.uid, setClases);

    return () => cancelarEscucha();
  }, [usuario]);

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  const agregarClase = async (nuevaClase) => {
    await agregarClaseFirestore(nuevaClase, usuario);
  };

  const eliminarClase = async (id) => {
    await eliminarClaseFirestore(id);
  };

  const totalCruces = clases.filter(
    (clase) => obtenerAlertas(clase, clases).length > 0
  ).length;

  const clasesConCruce = clases.filter(
    (clase) => obtenerAlertas(clase, clases).length > 0
  );

const menu = [
  { id: "programacion", texto: "Programación" },
  { id: "alertas", texto: "Alertas" },
  { id: "docentes", texto: "Docentes" },
  { id: "grupos", texto: "Grupos" },
  { id: "asignaturas", texto: "Asignaturas" },
];

  if (cargando) {
    return <div className="pantalla-carga">Cargando...</div>;
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>Horarios Docentes</h2>
        <p>Panel de programación académica</p>

        <div className="usuario-box">
          <span>Sesión iniciada</span>
          <strong>{usuario.email}</strong>
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              className={pestanaActiva === item.id ? "activo" : ""}
              onClick={() => setPestanaActiva(item.id)}
            >
              {item.texto}
            </button>
          ))}
        </nav>

        <button className="cerrar-sesion" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </aside>

      <main className="contenido">

{pestanaActiva === "docentes" && <Docentes clases={clases} />}

{pestanaActiva === "grupos" && <Grupos clases={clases} />}

{pestanaActiva === "asignaturas" && <Asignaturas clases={clases} />}

        {pestanaActiva === "programacion" && (
          <Programacion
            clases={clases}
            totalCruces={totalCruces}
            onAgregarClase={agregarClase}
            onEliminarClase={eliminarClase}
          />
        )}

        {pestanaActiva === "alertas" && (
          <Alertas
            clases={clasesConCruce}
            clasesBase={clases}
            totalClases={clases.length}
            totalCruces={totalCruces}
            onEliminarClase={eliminarClase}
          />
        )}
      </main>
    </div>
  );
}

export default App;