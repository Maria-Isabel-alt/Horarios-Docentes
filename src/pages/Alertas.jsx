import { useMemo, useState } from "react";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";

import {
  obtenerConflictos,
  obtenerProblemasDatos,
  esValorValido,
  horaAMinutos,
  normalizar,
} from "../utils/horarios";

import "./Alertas.css";

const programasValidos = [
  "derecho palmira",
  "derecho cali",
  "derecho virtual",
  "ciencia política presencial",
  "ciencia politica presencial",
  "ciencia política virtual",
  "ciencia politica virtual",
];

function Alertas({ clases = [], clasesBase = [], totalClases, onEditarClase }) {
  const [busqueda, setBusqueda] = useState("");

  /*
   * Usamos clasesBase porque ahí debe estar toda la programación.
   * Si no llega, usamos clases.
   */
  const todasLasClases = clasesBase.length > 0 ? clasesBase : clases;

  /*
   * Agregamos validaciones adicionales a las de horarios.js
   */
  const obtenerProblemasCompletos = (clase) => {
    const problemas = [...obtenerProblemasDatos(clase)];

    if (!esValorValido(clase.contrato)) {
      problemas.push("Contrato pendiente");
    }

    if (!esValorValido(clase.jornada)) {
      problemas.push("Jornada pendiente");
    }

    const programa = normalizar(clase.programa);

    if (programa && !programasValidos.includes(programa)) {
      problemas.push("Programa no reconocido");
    }

    const inicio = horaAMinutos(clase.horaInicio);
    const fin = horaAMinutos(clase.horaFin);

    if (inicio !== null && fin !== null && fin <= inicio) {
      problemas.push("Horario inválido");
    }

    return [...new Set(problemas)];
  };

  /*
   * Conflictos reales entre dos clases
   */
  const conflictos = useMemo(
    () => obtenerConflictos(todasLasClases),
    [todasLasClases],
  );

  /*
   * Clases que tienen información pendiente
   */
  const datosPendientes = useMemo(() => {
    return todasLasClases
      .map((clase) => ({
        clase,
        problemas: obtenerProblemasCompletos(clase),
      }))
      .filter((registro) => registro.problemas.length > 0);
  }, [todasLasClases]);

  const textoBusqueda = normalizar(busqueda);

  const coincideBusqueda = (clase) => {
    if (!textoBusqueda) return true;

    const datos = [
      clase.profesor,
      clase.cedula,
      clase.contrato,
      clase.codigo,
      clase.asignatura,
      clase.dia,
      clase.horaInicio,
      clase.horaFin,
      clase.grupo,
      clase.salon,
      clase.programa,
      clase.jornada,
    ];

    return datos.some((dato) => normalizar(dato).includes(textoBusqueda));
  };

  const conflictosFiltrados = conflictos.filter(
    (conflicto) =>
      coincideBusqueda(conflicto.claseA) || coincideBusqueda(conflicto.claseB),
  );

  const pendientesFiltrados = datosPendientes.filter(({ clase }) =>
    coincideBusqueda(clase),
  );

  const totalIncidencias = conflictos.length + datosPendientes.length;

  const nombreTipoCruce = (tipo) => {
    if (tipo === "profesor") {
      return "Profesor";
    }

    if (tipo === "grupo") {
      return "Grupo";
    }

    if (tipo === "salón") {
      return "Salón";
    }

    return tipo;
  };

  const editarClase = (clase) => {
    if (onEditarClase) {
      onEditarClase(clase);
    }
  };

  return (
    <>
      <Encabezado
        titulo="Alertas"
        texto="Revisa conflictos de horario y datos pendientes de la programación."
      />

      <Tarjetas
        totalClases={totalClases ?? todasLasClases.length}
        totalCruces={totalIncidencias}
      />

      <section className="panel alertas-panel">
        <div className="alertas-encabezado">
          <div>
            <h2>Centro de alertas</h2>

            <p>
              Aquí puedes identificar qué clases se cruzan y cuáles necesitan
              correcciones.
            </p>
          </div>

          <input
            className="buscador-alertas"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar docente, asignatura, grupo, programa..."
          />
        </div>

        <div className="resumen-alertas">
          <div className="resumen-alerta-card">
            <span>Conflictos de horario</span>
            <strong>{conflictos.length}</strong>
          </div>

          <div className="resumen-alerta-card">
            <span>Clases con datos pendientes</span>
            <strong>{datosPendientes.length}</strong>
          </div>

          <div className="resumen-alerta-card">
            <span>Total incidencias</span>
            <strong>{totalIncidencias}</strong>
          </div>
        </div>

        {/* ============================= */}
        {/* CONFLICTOS DE HORARIO */}
        {/* ============================= */}

        <div className="seccion-alertas">
          <div className="titulo-seccion-alertas">
            <div>
              <h3>🔴 Conflictos de horario</h3>

              <p>Se muestra cada par de clases que presenta un conflicto.</p>
            </div>

            <span className="contador-conflictos">
              {conflictosFiltrados.length}
            </span>
          </div>

          {conflictosFiltrados.length === 0 ? (
            <div className="sin-incidencias">
              No se encontraron conflictos de horario.
            </div>
          ) : (
            <div className="lista-conflictos">
              {conflictosFiltrados.map((conflicto) => (
                <article className="tarjeta-conflicto" key={conflicto.id}>
                  <div className="encabezado-conflicto">
                    <div>
                      <span className="etiqueta-conflicto">Conflicto</span>

                      <h4>
                        {conflicto.tipos.length > 1
                          ? "Cruce múltiple"
                          : `Cruce de ${nombreTipoCruce(
                              conflicto.tipos[0],
                            ).toLowerCase()}`}
                      </h4>
                    </div>

                    <div className="tipos-conflicto">
                      {conflicto.tipos.map((tipo) => (
                        <span key={tipo}>{nombreTipoCruce(tipo)}</span>
                      ))}
                    </div>
                  </div>

                  <div className="comparacion-clases">
                    {/* CLASE A */}

                    <div className="clase-conflicto">
                      <span className="numero-clase">Clase A</span>

                      <h5>{conflicto.claseA.asignatura || "Sin asignatura"}</h5>

                      <p>
                        <strong>Profesor:</strong>{" "}
                        {conflicto.claseA.profesor || "Sin profesor"}
                      </p>

                      <p>
                        <strong>Cédula:</strong>{" "}
                        {conflicto.claseA.cedula || "Sin cédula"}
                      </p>

                      <p>
                        <strong>Horario:</strong> {conflicto.claseA.dia} ·{" "}
                        {conflicto.claseA.horaInicio} -{" "}
                        {conflicto.claseA.horaFin}
                      </p>

                      <p>
                        <strong>Grupo:</strong>{" "}
                        {conflicto.claseA.grupo || "Sin grupo"}
                      </p>

                      <p>
                        <strong>Salón:</strong>{" "}
                        {conflicto.claseA.salon || "Sin salón"}
                      </p>

                      <p>
                        <strong>Programa:</strong>{" "}
                        {conflicto.claseA.programa || "Sin programa"}
                      </p>

                      <button
                        type="button"
                        className="boton-corregir"
                        onClick={() => editarClase(conflicto.claseA)}
                      >
                        Editar clase A
                      </button>
                    </div>

                    <div className="separador-conflicto">
                      <span>↔</span>
                      <strong>SE CRUZA CON</strong>
                    </div>

                    {/* CLASE B */}

                    <div className="clase-conflicto">
                      <span className="numero-clase">Clase B</span>

                      <h5>{conflicto.claseB.asignatura || "Sin asignatura"}</h5>

                      <p>
                        <strong>Profesor:</strong>{" "}
                        {conflicto.claseB.profesor || "Sin profesor"}
                      </p>

                      <p>
                        <strong>Cédula:</strong>{" "}
                        {conflicto.claseB.cedula || "Sin cédula"}
                      </p>

                      <p>
                        <strong>Horario:</strong> {conflicto.claseB.dia} ·{" "}
                        {conflicto.claseB.horaInicio} -{" "}
                        {conflicto.claseB.horaFin}
                      </p>

                      <p>
                        <strong>Grupo:</strong>{" "}
                        {conflicto.claseB.grupo || "Sin grupo"}
                      </p>

                      <p>
                        <strong>Salón:</strong>{" "}
                        {conflicto.claseB.salon || "Sin salón"}
                      </p>

                      <p>
                        <strong>Programa:</strong>{" "}
                        {conflicto.claseB.programa || "Sin programa"}
                      </p>

                      <button
                        type="button"
                        className="boton-corregir"
                        onClick={() => editarClase(conflicto.claseB)}
                      >
                        Editar clase B
                      </button>
                    </div>
                  </div>

                  <div className="explicacion-conflicto">
                    <strong>¿Por qué existe esta alerta?</strong>

                    <span>
                      Ambas clases ocurren el mismo día y sus horarios se
                      superponen.
                    </span>

                    {conflicto.tipos.includes("profesor") && (
                      <span>• Tienen asignado el mismo profesor.</span>
                    )}

                    {conflicto.tipos.includes("grupo") && (
                      <span>• Tienen asignado el mismo grupo.</span>
                    )}

                    {conflicto.tipos.includes("salón") && (
                      <span>• Tienen asignado el mismo salón.</span>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* ============================= */}
        {/* DATOS PENDIENTES */}
        {/* ============================= */}

        <div className="seccion-alertas">
          <div className="titulo-seccion-alertas">
            <div>
              <h3>🟠 Datos pendientes</h3>

              <p>Clases que necesitan completar o corregir información.</p>
            </div>

            <span className="contador-pendientes">
              {pendientesFiltrados.length}
            </span>
          </div>

          {pendientesFiltrados.length === 0 ? (
            <div className="sin-incidencias">
              No hay clases con información pendiente.
            </div>
          ) : (
            <div className="lista-pendientes">
              {pendientesFiltrados.map(({ clase, problemas }) => (
                <article className="tarjeta-pendiente" key={clase.id}>
                  <div className="datos-clase-pendiente">
                    <div>
                      <span className="etiqueta-pendiente">
                        Requiere revisión
                      </span>

                      <h4>{clase.asignatura || "Asignatura pendiente"}</h4>

                      <p>{clase.profesor || "Docente sin asignar"}</p>
                    </div>

                    <div className="datos-secundarios">
                      <span>{clase.dia || "Día pendiente"}</span>

                      <span>
                        {clase.horaInicio || "--:--"} -{" "}
                        {clase.horaFin || "--:--"}
                      </span>

                      <span>Grupo: {clase.grupo || "Pendiente"}</span>

                      <span>Programa: {clase.programa || "Pendiente"}</span>
                    </div>
                  </div>

                  <div className="problemas-clase">
                    {problemas.map((problema) => (
                      <span className="problema-dato" key={problema}>
                        ⚠ {problema}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="boton-corregir"
                    onClick={() => editarClase(clase)}
                  >
                    Corregir clase
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Alertas;
