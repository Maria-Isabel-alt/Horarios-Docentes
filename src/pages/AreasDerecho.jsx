import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../Firebase/config";

import Encabezado from "../components/Encabezado";

import {
  obtenerAreas,
  crearArea,
  actualizarArea,
  eliminarArea,
} from "../services/areasService";

import "./AreasDerecho.css";

function AreasDerecho({ clases = [] }) {
  const [areas, setAreas] = useState([]);
  const [docentesFirebase, setDocentesFirebase] = useState([]);

  const [nombreArea, setNombreArea] = useState("");
  const [docentesSeleccionados, setDocentesSeleccionados] = useState([]);

  const [areaEnEdicion, setAreaEnEdicion] = useState(null);

  const [busquedaDocente, setBusquedaDocente] = useState("");

  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [listaAreas, resultadoDocentes] = await Promise.all([
          obtenerAreas(),
          getDocs(collection(db, "docentes")),
        ]);

        setAreas(listaAreas);

        const docentes = resultadoDocentes.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setDocentesFirebase(docentes);
      } catch (error) {
        console.error(error);

        setMensaje("❌ No se pudieron cargar las áreas.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const docentes = useMemo(() => {
    const mapa = new Map();

    docentesFirebase.forEach((docente) => {
      const cedula = String(docente.cedula || "").trim();

      if (!cedula) return;

      mapa.set(cedula, {
        cedula,
        nombre:
          `${docente.nombres || ""} ${docente.apellidos || ""}`.trim() ||
          "Sin nombre",
      });
    });

    clases.forEach((clase) => {
      const cedula = String(clase.cedula || "").trim();

      if (!cedula) return;

      if (!mapa.has(cedula)) {
        mapa.set(cedula, {
          cedula,
          nombre: clase.profesor || "Sin nombre",
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
      }),
    );
  }, [docentesFirebase, clases]);

  const docentesFiltrados = docentes.filter((docente) => {
    const texto = `${docente.nombre} ${docente.cedula}`.toLowerCase();

    return texto.includes(busquedaDocente.toLowerCase());
  });

  const seleccionarDocente = (docente) => {
    setDocentesSeleccionados((anteriores) => {
      const existe = anteriores.some((item) => item.cedula === docente.cedula);

      if (existe) {
        return anteriores.filter((item) => item.cedula !== docente.cedula);
      }

      return [...anteriores, docente];
    });
  };

  const guardarArea = async () => {
    if (!nombreArea.trim()) {
      setMensaje("⚠ Escribe el nombre del área.");
      return;
    }

    if (docentesSeleccionados.length === 0) {
      setMensaje("⚠ Selecciona al menos un docente.");
      return;
    }

    const datos = {
      nombre: nombreArea.trim(),
      docentes: docentesSeleccionados,
    };

    try {
      if (areaEnEdicion) {
        await actualizarArea(areaEnEdicion.id, datos);

        setAreas((anteriores) =>
          anteriores.map((area) =>
            area.id === areaEnEdicion.id
              ? {
                  ...area,
                  ...datos,
                }
              : area,
          ),
        );

        setMensaje("✅ Área actualizada.");
      } else {
        const nuevaArea = await crearArea(datos);

        setAreas((anteriores) => [...anteriores, nuevaArea]);

        setMensaje("✅ Área creada correctamente.");
      }

      setNombreArea("");
      setDocentesSeleccionados([]);
      setAreaEnEdicion(null);
      setBusquedaDocente("");
    } catch (error) {
      console.error(error);

      setMensaje("❌ No se pudo guardar el área.");
    }
  };

  const editarArea = (area) => {
    setAreaEnEdicion(area);
    setNombreArea(area.nombre || "");
    setDocentesSeleccionados(area.docentes || []);
    setBusquedaDocente("");
    setMensaje("");
  };

  const borrarArea = async (area) => {
    const confirmar = window.confirm(
      `¿Seguro que deseas eliminar el área "${area.nombre}"?`,
    );

    if (!confirmar) return;

    try {
      await eliminarArea(area.id);

      setAreas((anteriores) =>
        anteriores.filter((item) => item.id !== area.id),
      );

      if (areaEnEdicion?.id === area.id) {
        setAreaEnEdicion(null);
        setNombreArea("");
        setDocentesSeleccionados([]);
      }

      setMensaje("✅ Área eliminada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("❌ No se pudo eliminar el área.");
    }
  };

  return (
    <>
      <Encabezado
        titulo="Banco de Áreas del Derecho"
        texto="Organiza las áreas jurídicas y los docentes que pueden pertenecer a cada una."
      />

      <section className="panel">
        <h2>{areaEnEdicion ? "Editar área" : "Nueva área"}</h2>
        <input
          type="text"
          value={nombreArea}
          onChange={(e) => setNombreArea(e.target.value)}
          placeholder="Ej: Derecho Penal"
        />

        <h3>Docentes del área</h3>

        <input
          type="text"
          value={busquedaDocente}
          onChange={(e) => setBusquedaDocente(e.target.value)}
          placeholder="Buscar docente por nombre o cédula"
        />

        <div>
          {docentesFiltrados.slice(0, 15).map((docente) => {
            const seleccionado = docentesSeleccionados.some(
              (item) => item.cedula === docente.cedula,
            );

            return (
              <button
                type="button"
                key={docente.cedula}
                onClick={() => seleccionarDocente(docente)}
              >
                {seleccionado ? "✓ " : ""}
                {docente.nombre} · {docente.cedula}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={guardarArea}>
          {areaEnEdicion ? "Actualizar área" : "Guardar área"}
        </button>

        {areaEnEdicion && (
          <button
            type="button"
            onClick={() => {
              setAreaEnEdicion(null);
              setNombreArea("");
              setDocentesSeleccionados([]);
              setBusquedaDocente("");
              setMensaje("");
            }}
          >
            Cancelar edición
          </button>
        )}

        {mensaje && <p>{mensaje}</p>}
      </section>

      <section className="panel">
        <h2>Áreas registradas</h2>

        {cargando ? (
          <p>Cargando áreas...</p>
        ) : areas.length === 0 ? (
          <p>Todavía no hay áreas registradas.</p>
        ) : (
          areas.map((area) => (
            <div className="tarjeta-area" key={area.id}>
              <div className="encabezado-area">
                <div>
                  <h3>{area.nombre}</h3>

                  <p>
                    {area.docentes?.length || 0}{" "}
                    {area.docentes?.length === 1 ? "docente" : "docentes"}
                  </p>
                </div>

                <div className="acciones-area">
                  <button
                    type="button"
                    className="boton-editar-area"
                    onClick={() => editarArea(area)}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="boton-eliminar-area"
                    onClick={() => borrarArea(area)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>

              <div className="docentes-area">
                {(area.docentes || []).map((docente) => (
                  <span className="docente-area" key={docente.cedula}>
                    {docente.nombre}
                  </span>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}

export default AreasDerecho;
