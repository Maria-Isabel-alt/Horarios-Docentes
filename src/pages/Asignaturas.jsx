import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";

import Encabezado from "../components/Encabezado";
import "./Asignaturas.css";

function Asignaturas({ clases = [] }) {
  const [asignaturas, setAsignaturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarAsignaturas = async () => {
      try {
        const resultado = await getDocs(collection(db, "asignaturas"));

        const listaAsignaturas = resultado.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setAsignaturas(listaAsignaturas);
      } catch (error) {
        console.error("Error al cargar asignaturas:", error);
        setError("No se pudieron cargar las asignaturas.");
      } finally {
        setCargando(false);
      }
    };

    cargarAsignaturas();
  }, []);

  const obtenerTotalClases = (codigo) => {
    return clases.filter((clase) => clase.codigo === codigo).length;
  };

  const obtenerProgramas = (codigo) => {
    const programas = clases
      .filter((clase) => clase.codigo === codigo && clase.programa)
      .map((clase) => clase.programa);

    const programasUnicos = [...new Set(programas)];

    return programasUnicos.length > 0
      ? programasUnicos.join(", ")
      : "Sin clases asignadas";
  };

  return (
    <>
      <Encabezado
        titulo="Asignaturas"
        texto="Catálogo de asignaturas disponibles para la programación académica."
      />

      <section className="panel">
        <h2>Asignaturas registradas</h2>

        {cargando ? (
          <p className="vacio">Cargando asignaturas...</p>
        ) : error ? (
          <p className="vacio">{error}</p>
        ) : asignaturas.length === 0 ? (
          <p className="vacio">Todavía no hay asignaturas registradas.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Código</th>
                  <th>Programa(s)</th>
                  <th>Total clases</th>
                </tr>
              </thead>

              <tbody>
                {asignaturas.map((asignatura) => (
                  <tr key={asignatura.id}>
                    <td>{asignatura.nombre}</td>

                    <td>{asignatura.codigo}</td>

                    <td>{obtenerProgramas(asignatura.codigo)}</td>

                    <td>{obtenerTotalClases(asignatura.codigo)}</td>
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

export default Asignaturas;