import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../Firebase/config";
import Encabezado from "../components/Encabezado";

import {
  obtenerDisponibilidades,
  guardarDisponibilidad,
} from "../services/disponibilidadService";

import "./Disponibilidad.css";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function Disponibilidad({ clases = [] }) {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [docentesFirebase, setDocentesFirebase] = useState([]);

  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [franjas, setFranjas] = useState([]);

  /*
   * CARGAR DISPONIBILIDADES Y CATÁLOGO DE DOCENTES
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [datosDisponibilidad, resultadoDocentes] = await Promise.all([
          obtenerDisponibilidades(),
          getDocs(collection(db, "docentes")),
        ]);

        setDisponibilidades(datosDisponibilidad);

        const listaDocentes = resultadoDocentes.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setDocentesFirebase(listaDocentes);
      } catch (error) {
        console.error("Error cargando disponibilidad:", error);

        setMensaje(
          "❌ No se pudieron cargar los datos del Banco de Disponibilidad.",
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  /*
   * UNIR DOCENTES DE FIREBASE + DOCENTES ENCONTRADOS EN CLASES
   */
  const docentes = useMemo(() => {
    const mapa = new Map();

    /*
     * 1. Docentes del catálogo oficial
     */
    docentesFirebase.forEach((docente) => {
      const cedula = String(docente.cedula || "").trim();

      if (!cedula) return;

      const nombre =
        `${docente.nombres || ""} ${docente.apellidos || ""}`.trim();

      mapa.set(cedula, {
        id: docente.id,
        cedula,
        nombre: nombre || "Sin nombre",
        contrato: docente.contrato || "Sin dato",
        origen: "firebase",
      });
    });

    /*
     * 2. Docentes encontrados en clases
     */
    clases.forEach((clase) => {
      const cedula = String(clase.cedula || "").trim();
      const profesor = String(clase.profesor || "").trim();

      if (
        !cedula ||
        cedula.toLowerCase() === "na" ||
        cedula.toLowerCase() === "n/a"
      ) {
        return;
      }

      if (mapa.has(cedula)) {
        const docente = mapa.get(cedula);

        if (docente.contrato === "Sin dato" && clase.contrato) {
          docente.contrato = clase.contrato;
        }

        if (docente.nombre === "Sin nombre" && profesor) {
          docente.nombre = profesor;
        }

        return;
      }

      mapa.set(cedula, {
        id: `clase-${cedula}`,
        cedula,
        nombre: profesor || "Sin nombre",
        contrato: clase.contrato || "Sin dato",
        origen: "clases",
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
      }),
    );
  }, [clases, docentesFirebase]);

  /*
   * BUSCADOR
   */
  const docentesFiltrados = useMemo(() => {
    const textoBusqueda = busqueda.trim().toLowerCase();

    if (!textoBusqueda) {
      return docentes.slice(0, 10);
    }

    return docentes
      .filter((docente) => {
        const texto =
          `${docente.nombre} ${docente.cedula} ${docente.contrato}`.toLowerCase();

        return texto.includes(textoBusqueda);
      })
      .slice(0, 10);
  }, [docentes, busqueda]);

  /*
   * SELECCIONAR DOCENTE
   */
  const seleccionarDocente = (docente) => {
    setDocenteSeleccionado(docente);

    const disponibilidadExistente = disponibilidades.find(
      (item) => String(item.cedula) === String(docente.cedula),
    );

    setFranjas(disponibilidadExistente?.franjas || []);

    setMensaje("");
  };

  /*
   * AGREGAR FRANJA
   */
  const agregarFranja = () => {
    setFranjas((anteriores) => [
      ...anteriores,
      {
        dia: "Lunes",
        inicio: "07:00",
        fin: "08:00",
      },
    ]);
  };

  /*
   * MODIFICAR FRANJA
   */
  const cambiarFranja = (indice, campo, valor) => {
    setFranjas((anteriores) =>
      anteriores.map((franja, i) =>
        i === indice
          ? {
              ...franja,
              [campo]: valor,
            }
          : franja,
      ),
    );
  };

  /*
   * ELIMINAR FRANJA
   */
  const eliminarFranja = (indice) => {
    setFranjas((anteriores) => anteriores.filter((_, i) => i !== indice));
  };

  /*
   * GUARDAR
   */
  const guardar = async () => {
    if (!docenteSeleccionado) {
      setMensaje("⚠ Selecciona un docente.");
      return;
    }

    if (franjas.length === 0) {
      setMensaje("⚠ Debes agregar al menos una franja de disponibilidad.");
      return;
    }

    /*
     * Validar horas
     */
    const franjaInvalida = franjas.find(
      (franja) => !franja.inicio || !franja.fin || franja.fin <= franja.inicio,
    );

    if (franjaInvalida) {
      setMensaje("⚠ La hora final debe ser mayor que la hora inicial.");
      return;
    }

    for (let i = 0; i < franjas.length; i++) {
      for (let j = i + 1; j < franjas.length; j++) {
        const franjaA = franjas[i];
        const franjaB = franjas[j];

        if (franjaA.dia !== franjaB.dia) {
          continue;
        }

        const hayCruce =
          franjaA.inicio < franjaB.fin && franjaB.inicio < franjaA.fin;

        if (hayCruce) {
          setMensaje(
            `⚠ Hay horarios de disponibilidad que se cruzan el ${franjaA.dia}.`,
          );

          return;
        }
      }
    }

    try {
      await guardarDisponibilidad(docenteSeleccionado.cedula, {
        docente: docenteSeleccionado.nombre,
        contrato: docenteSeleccionado.contrato,
        franjas,
      });

      const nuevoRegistro = {
        cedula: docenteSeleccionado.cedula,
        docente: docenteSeleccionado.nombre,
        contrato: docenteSeleccionado.contrato,
        franjas,
      };

      setDisponibilidades((anteriores) => {
        const existe = anteriores.some(
          (item) => String(item.cedula) === String(docenteSeleccionado.cedula),
        );

        if (existe) {
          return anteriores.map((item) =>
            String(item.cedula) === String(docenteSeleccionado.cedula)
              ? nuevoRegistro
              : item,
          );
        }

        return [...anteriores, nuevoRegistro];
      });

      setMensaje("✅ Disponibilidad guardada correctamente.");
    } catch (error) {
      console.error("Error guardando disponibilidad:", error);

      setMensaje("❌ No se pudo guardar la disponibilidad.");
    }
  };

  return (
    <>
      <Encabezado
        titulo="Banco de Disponibilidad"
        texto="Registra los días y horarios en los que cada docente puede impartir clases."
      />

      <section className="panel">
        <h2>Seleccionar docente</h2>

        <input
          className="buscador-disponibilidad"
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o cédula"
        />

        {cargando ? (
          <p className="vacio">Cargando docentes...</p>
        ) : docentes.length === 0 ? (
          <p className="vacio">No se encontraron docentes registrados.</p>
        ) : docentesFiltrados.length === 0 ? (
          <p className="vacio">No se encontraron docentes con esa búsqueda.</p>
        ) : (
          <div className="lista-docentes-disponibilidad">
            {docentesFiltrados.map((docente) => (
              <button
                type="button"
                key={docente.cedula}
                onClick={() => seleccionarDocente(docente)}
              >
                <strong>{docente.nombre}</strong>

                <span>
                  C.C. {docente.cedula} · {docente.contrato}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {docenteSeleccionado && (
        <section className="panel">
          <div className="encabezado-disponibilidad-docente">
            <div>
              <h2>{docenteSeleccionado.nombre}</h2>

              <p>
                C.C. {docenteSeleccionado.cedula} ·{" "}
                {docenteSeleccionado.contrato}
              </p>
            </div>
          </div>

          {franjas.length === 0 && (
            <p className="vacio">
              Este docente todavía no tiene disponibilidad registrada.
            </p>
          )}

          <div className="franjas-disponibilidad">
            {franjas.map((franja, indice) => (
              <div className="franja-disponibilidad" key={indice}>
                <select
                  value={franja.dia}
                  onChange={(e) => cambiarFranja(indice, "dia", e.target.value)}
                >
                  {dias.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={franja.inicio}
                  onChange={(e) =>
                    cambiarFranja(indice, "inicio", e.target.value)
                  }
                />

                <span>a</span>

                <input
                  type="time"
                  value={franja.fin}
                  onChange={(e) => cambiarFranja(indice, "fin", e.target.value)}
                />

                <button type="button" onClick={() => eliminarFranja(indice)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div className="acciones-disponibilidad">
            <button
              type="button"
              className="boton-agregar-franja"
              onClick={agregarFranja}
            >
              + Agregar franja
            </button>

            <button
              type="button"
              className="boton-guardar-disponibilidad"
              onClick={guardar}
            >
              Guardar disponibilidad
            </button>
          </div>

          {mensaje && <div className="mensaje-disponibilidad">{mensaje}</div>}
        </section>
      )}
    </>
  );
}

export default Disponibilidad;
