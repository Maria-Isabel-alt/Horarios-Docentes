import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../Firebase/config";

import Encabezado from "../components/Encabezado";

import { obtenerAreas } from "../services/areasService";

import {
  obtenerAsignaturaAreas,
  guardarAreaAsignatura,
  eliminarAreaAsignatura,
} from "../services/asignaturaAreasService";

import "./Asignaturas.css";

function Asignaturas({ clases = [] }) {
  const [asignaturasFirebase, setAsignaturasFirebase] = useState([]);
  const [areas, setAreas] = useState([]);
  const [relaciones, setRelaciones] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardandoCodigo, setGuardandoCodigo] = useState("");

  /*
   * CARGAR ASIGNATURAS + ÁREAS + RELACIONES
   */
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);

        const [resultadoAsignaturas, listaAreas, listaRelaciones] =
          await Promise.all([
            getDocs(collection(db, "asignaturas")),
            obtenerAreas(),
            obtenerAsignaturaAreas(),
          ]);

        const listaAsignaturas = resultadoAsignaturas.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setAsignaturasFirebase(listaAsignaturas);
        setAreas(listaAreas);
        setRelaciones(listaRelaciones);
      } catch (error) {
        console.error("Error al cargar asignaturas:", error);

        setError("No se pudieron cargar las asignaturas.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const normalizarCodigo = (codigo) =>
    String(codigo || "")
      .trim()
      .toUpperCase();

  /*
   * UNIR ASIGNATURAS DEL CATÁLOGO +
   * ASIGNATURAS ENCONTRADAS EN LAS CLASES
   */
  const asignaturas = useMemo(() => {
    const mapa = new Map();

    /*
     * Primero obtenemos las asignaturas
     * encontradas en las clases importadas.
     */
    clases.forEach((clase) => {
      const codigo = normalizarCodigo(clase.codigo);

      if (!codigo) return;

      if (!mapa.has(codigo)) {
        mapa.set(codigo, {
          id: `clase-${codigo}`,
          codigo,
          nombre: String(clase.asignatura || "").trim() || "Sin nombre",
          origen: "clases",
        });
      }
    });

    /*
     * Después agregamos el catálogo oficial.
     * Firebase tiene prioridad.
     */
    asignaturasFirebase.forEach((asignatura) => {
      const codigo = normalizarCodigo(asignatura.codigo);

      if (!codigo) return;

      mapa.set(codigo, {
        id: asignatura.id,
        codigo,
        nombre: asignatura.nombre || mapa.get(codigo)?.nombre || "Sin nombre",
        origen: "firebase",
      });
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
      }),
    );
  }, [clases, asignaturasFirebase]);

  /*
   * TOTAL DE CLASES DE UNA ASIGNATURA
   */
  const obtenerTotalClases = (codigo) => {
    const codigoNormalizado = normalizarCodigo(codigo);

    return clases.filter(
      (clase) => normalizarCodigo(clase.codigo) === codigoNormalizado,
    ).length;
  };

  /*
   * PROGRAMAS EN LOS QUE APARECE
   */
  const obtenerProgramas = (codigo) => {
    const codigoNormalizado = normalizarCodigo(codigo);

    const programas = clases
      .filter(
        (clase) =>
          normalizarCodigo(clase.codigo) === codigoNormalizado &&
          clase.programa,
      )
      .map((clase) => String(clase.programa).trim());

    const programasUnicos = [...new Set(programas)];

    return programasUnicos.length > 0
      ? programasUnicos.join(", ")
      : "Sin clases asignadas";
  };

  /*
   * OBTENER RELACIÓN ACTUAL
   */
  const obtenerRelacion = (codigo) => {
    const codigoNormalizado = normalizarCodigo(codigo);

    return relaciones.find(
      (relacion) => normalizarCodigo(relacion.codigo) === codigoNormalizado,
    );
  };

  /*
   * OBTENER ÁREA COMPLETA
   */
  const obtenerArea = (areaId) => {
    return areas.find((area) => area.id === areaId);
  };

  /*
   * ASIGNAR / CAMBIAR ÁREA
   */
  const cambiarArea = async (asignatura, areaId) => {
    const codigo = normalizarCodigo(asignatura.codigo);

    try {
      setGuardandoCodigo(codigo);
      setMensaje("");

      /*
       * Si selecciona "Sin área",
       * eliminamos la relación.
       */
      if (!areaId) {
        await eliminarAreaAsignatura(codigo);

        setRelaciones((anteriores) =>
          anteriores.filter(
            (relacion) => normalizarCodigo(relacion.codigo) !== codigo,
          ),
        );

        setMensaje(`✅ Se quitó el área de ${asignatura.nombre}.`);

        return;
      }

      const areaSeleccionada = areas.find((area) => area.id === areaId);

      if (!areaSeleccionada) {
        setMensaje("❌ No se encontró el área seleccionada.");
        return;
      }

      const datos = {
        asignatura: asignatura.nombre,
        areaId: areaSeleccionada.id,
        areaNombre: areaSeleccionada.nombre,
      };

      await guardarAreaAsignatura(codigo, datos);

      const nuevaRelacion = {
        id: codigo,
        codigo,
        ...datos,
      };

      setRelaciones((anteriores) => {
        const existe = anteriores.some(
          (relacion) => normalizarCodigo(relacion.codigo) === codigo,
        );

        if (existe) {
          return anteriores.map((relacion) =>
            normalizarCodigo(relacion.codigo) === codigo
              ? nuevaRelacion
              : relacion,
          );
        }

        return [...anteriores, nuevaRelacion];
      });

      setMensaje(
        `✅ ${asignatura.nombre} fue asignada a ${areaSeleccionada.nombre}.`,
      );
    } catch (error) {
      console.error("Error asignando área:", error);

      setMensaje("❌ No se pudo guardar la relación.");
    } finally {
      setGuardandoCodigo("");
    }
  };

  return (
    <>
      <Encabezado
        titulo="Asignaturas"
        texto="Relaciona las asignaturas con las áreas del Derecho y los docentes habilitados."
      />

      <section className="panel">
        <div className="panel-header-tabla">
          <div>
            <h2>Asignaturas registradas</h2>

            <p>Se encontraron {asignaturas.length} asignaturas.</p>
          </div>
        </div>

        {mensaje && <div className="mensaje-asignaturas">{mensaje}</div>}

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
                  <th>Área del Derecho</th>
                  <th>Docentes habilitados</th>
                </tr>
              </thead>

              <tbody>
                {asignaturas.map((asignatura) => {
                  const relacion = obtenerRelacion(asignatura.codigo);

                  const area = relacion?.areaId
                    ? obtenerArea(relacion.areaId)
                    : null;

                  const docentesArea = area?.docentes || [];

                  return (
                    <tr key={asignatura.codigo}>
                      <td>{asignatura.nombre}</td>

                      <td>{asignatura.codigo}</td>

                      <td>{obtenerProgramas(asignatura.codigo)}</td>

                      <td>{obtenerTotalClases(asignatura.codigo)}</td>

                      <td>
                        <select
                          className="selector-area"
                          value={relacion?.areaId || ""}
                          disabled={guardandoCodigo === asignatura.codigo}
                          onChange={(e) =>
                            cambiarArea(asignatura, e.target.value)
                          }
                        >
                          <option value="">Sin área asignada</option>

                          {areas.map((area) => (
                            <option key={area.id} value={area.id}>
                              {area.nombre}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        {!area ? (
                          <span className="sin-area">
                            Primero asigna un área
                          </span>
                        ) : docentesArea.length === 0 ? (
                          <span className="sin-area">Área sin docentes</span>
                        ) : (
                          <div className="docentes-habilitados">
                            {docentesArea.map((docente) => (
                              <span
                                key={docente.cedula}
                                className="docente-habilitado"
                              >
                                {docente.nombre}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

export default Asignaturas;
