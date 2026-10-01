import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";

import Encabezado from "../components/Encabezado";
import "./Docentes.css";

function Docentes({ clases = [] }) {
  const [docentes, setDocentes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        const resultado = await getDocs(collection(db, "docentes"));

const listaDocentes = resultado.docs.map((documento) => ({
  id: documento.id,
  ...documento.data(),
}));

console.log("DOCENTES FIREBASE:", listaDocentes);

setDocentes(listaDocentes);
      } catch (error) {
        console.error("Error al cargar docentes:", error);
        setError("No se pudieron cargar los docentes.");
      } finally {
        setCargando(false);
      }
    };

    cargarDocentes();
  }, []);

  const obtenerTotalClases = (cedula) => {
    return clases.filter((clase) => clase.cedula === cedula).length;
  };

  const obtenerProgramas = (cedula) => {
    const programas = clases
      .filter((clase) => clase.cedula === cedula && clase.programa)
      .map((clase) => clase.programa);

    const programasUnicos = [...new Set(programas)];

    return programasUnicos.length > 0
      ? programasUnicos.join(", ")
      : "Sin clases asignadas";
  };

  return (
    <>
      <Encabezado
        titulo="Docentes"
        texto="Catálogo de docentes disponibles para la programación académica."
      />

      <section className="panel">
        <h2>Docentes registrados</h2>

        {cargando ? (
          <p className="vacio">Cargando docentes...</p>
        ) : error ? (
          <p className="vacio">{error}</p>
        ) : docentes.length === 0 ? (
          <p className="vacio">Todavía no hay docentes registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Cédula</th>
                  <th>Contrato</th>
                  <th>Programa(s)</th>
                  <th>Total clases</th>
                </tr>
              </thead>

              <tbody>
                {docentes.map((docente) => (
                  <tr key={docente.id}>
                    <td>
                      {docente.nombres} {docente.apellidos}
                    </td>

                    <td>{docente.cedula}</td>

                    <td>{docente.contrato || "Sin dato"}</td>

                    <td>{obtenerProgramas(docente.cedula)}</td>

                    <td>{obtenerTotalClases(docente.cedula)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default Docentes;