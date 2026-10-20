import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";

import Encabezado from "../components/Encabezado";
import "./Docentes.css";

function Docentes({ clases = [] }) {
  const [docentesFirebase, setDocentesFirebase] = useState([]);
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

        setDocentesFirebase(listaDocentes);
      } catch (error) {
        console.error("Error al cargar docentes:", error);
        setError("No se pudieron cargar los docentes.");
      } finally {
        setCargando(false);
      }
    };

    cargarDocentes();
  }, []);

  const normalizar = (valor) => String(valor || "").trim();

  const docentes = useMemo(() => {
    const mapa = new Map();

    /*
     * 1. DOCENTES OBTENIDOS DE LAS CLASES
     */
    clases.forEach((clase) => {
      const cedula = normalizar(clase.cedula);
      const profesor = normalizar(clase.profesor);

      // Ignoramos registros sin identificación útil
      if (
        !cedula ||
        cedula.toLowerCase() === "na" ||
        cedula.toLowerCase() === "n/a"
      ) {
        return;
      }

      if (!mapa.has(cedula)) {
        mapa.set(cedula, {
          id: `clase-${cedula}`,
          nombre: profesor || "Sin nombre",
          cedula,
          contrato: normalizar(clase.contrato) || "Sin dato",
          programas: new Set(),
          totalClases: 0,
          origen: "clases",
        });
      }

      const docente = mapa.get(cedula);

      docente.totalClases += 1;

      if (clase.programa) {
        docente.programas.add(normalizar(clase.programa));
      }

      // Si inicialmente estaba vacío, aprovechar datos de otra clase
      if (docente.nombre === "Sin nombre" && profesor) {
        docente.nombre = profesor;
      }

      if (docente.contrato === "Sin dato" && clase.contrato) {
        docente.contrato = normalizar(clase.contrato);
      }
    });

    /*
     * 2. DOCENTES REGISTRADOS DIRECTAMENTE EN FIREBASE
     */
    docentesFirebase.forEach((docenteFirebase) => {
      const cedula = normalizar(docenteFirebase.cedula);

      if (!cedula) return;

      const nombreFirebase = `${docenteFirebase.nombres || ""} ${
        docenteFirebase.apellidos || ""
      }`.trim();

      if (mapa.has(cedula)) {
        const docenteExistente = mapa.get(cedula);

        // Firebase tiene prioridad como catálogo oficial
        if (nombreFirebase) {
          docenteExistente.nombre = nombreFirebase;
        }

        if (docenteFirebase.contrato) {
          docenteExistente.contrato = docenteFirebase.contrato;
        }

        docenteExistente.origen = "firebase";
        docenteExistente.id = docenteFirebase.id;
      } else {
        mapa.set(cedula, {
          id: docenteFirebase.id,
          nombre: nombreFirebase || "Sin nombre",
          cedula,
          contrato: docenteFirebase.contrato || "Sin dato",
          programas: new Set(),
          totalClases: 0,
          origen: "firebase",
        });
      }
    });

    return Array.from(mapa.values())
      .map((docente) => ({
        ...docente,
        programasTexto:
          docente.programas.size > 0
            ? Array.from(docente.programas).join(", ")
            : "Sin clases asignadas",
      }))
      .sort((a, b) =>
        a.nombre.localeCompare(b.nombre, "es", {
          sensitivity: "base",
        }),
      );
  }, [clases, docentesFirebase]);

  return (
    <>
      <Encabezado
        titulo="Docentes"
        texto="Catálogo de docentes disponibles para la programación académica."
      />

      <section className="panel">
        <div className="panel-header-tabla">
          <div>
            <h2>Docentes registrados</h2>

            <p>Se encontraron {docentes.length} docentes.</p>
          </div>
        </div>

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
                  <tr key={docente.cedula}>
                    <td>{docente.nombre}</td>

                    <td>{docente.cedula}</td>

                    <td>{docente.contrato}</td>

                    <td>{docente.programasTexto}</td>

                    <td>{docente.totalClases}</td>
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
