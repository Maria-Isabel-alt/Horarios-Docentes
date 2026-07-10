import { useState } from "react";
import { obtenerAlertas } from "../utils/horarios";

function TablaClases({
  clases = [],
  clasesBase = [],
  onEliminarClase,
  onEditarClase,
  acciones,
  mostrarBuscador = false,
  mensajeVacio = "Todavía no hay clases registradas.",
}) {
  const [busqueda, setBusqueda] = useState("");
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [claseAEliminar, setClaseAEliminar] = useState(null);

  const textoBusqueda = busqueda.trim().toLowerCase();

  const clasesFiltradas = clases.filter((clase) =>
    Object.values(clase).some((valor) =>
      String(valor || "").toLowerCase().includes(textoBusqueda)
    )
  );

  const confirmarEliminar = (clase) => {
    setClaseAEliminar(clase);
    setMenuAbierto(null);
  };

  const eliminar = async () => {
    if (!claseAEliminar) return;

    try {
      await onEliminarClase(claseAEliminar.id);
      setClaseAEliminar(null);
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la clase.");
    }
  };

  const editar = (clase) => {
    if (onEditarClase) {
      onEditarClase(clase);
      setMenuAbierto(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel-header-tabla">
        <div>
          <h2>Clases registradas</h2>
          <p>Consulta las clases guardadas en la programación.</p>
        </div>

        <div className="acciones-tabla">
          {mostrarBuscador && (
            <input
              className="buscador-tabla"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por docente, cédula, grupo, día, programa..."
            />
          )}

          {acciones}
        </div>
      </div>

      {clasesFiltradas.length === 0 ? (
        <p className="vacio">{mensajeVacio}</p>
      ) : (
        <div className="tabla-contenedor">
          <table>
            <thead>
              <tr>
                <th>Profesor</th>
                <th>Cédula</th>
                <th>Contrato</th>
                <th>Asignatura</th>
                <th>Día</th>
                <th>Hora</th>
                <th>Grupo</th>
                <th>Salón</th>
                <th>Programa</th>
                <th>Jornada</th>
                <th>Alertas</th>
                <th>Acción</th>
              </tr>
            </thead>

            <tbody>
              {clasesFiltradas.map((clase) => {
                const alertas = obtenerAlertas(clase, clasesBase);

                return (
                  <tr
                    key={clase.id}
                    className={alertas.length > 0 ? "fila-alerta" : ""}
                  >
                    <td>{clase.profesor}</td>
                    <td>{clase.cedula}</td>
                    <td>{clase.contrato || "Sin dato"}</td>
                    <td>{clase.asignatura}</td>
                    <td>{clase.dia}</td>
                    <td>
                      {clase.horaInicio} - {clase.horaFin}
                    </td>
                    <td>{clase.grupo}</td>
                    <td>{clase.salon}</td>
                    <td>{clase.programa}</td>
                    <td>{clase.jornada}</td>
                    <td>
                      {alertas.length > 0 ? (
                        alertas.map((alerta) => (
                          <span className="alerta" key={alerta}>
                            {alerta}
                          </span>
                        ))
                      ) : (
                        <span className="ok">Sin cruce</span>
                      )}
                    </td>

                    <td className="celda-acciones">
                      <button
                        className="boton-ajustes"
                        onClick={() =>
                          setMenuAbierto(
                            menuAbierto === clase.id ? null : clase.id
                          )
                        }
                      >
                        ⚙️
                      </button>

                      {menuAbierto === clase.id && (
                        <div className="menu-acciones">
                          <button onClick={() => editar(clase)}>Editar</button>

                          <button
                            className="opcion-eliminar"
                            onClick={() => confirmarEliminar(clase)}
                          >
                            Eliminar
                          </button>
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

      {claseAEliminar && (
        <div className="modal-fondo">
          <div className="modal-confirmacion">
            <div className="modal-icono">⚠️</div>

            <h3>Eliminar clase</h3>

            <p>
              ¿Seguro que deseas eliminar esta clase? Esta acción no se puede
              deshacer.
            </p>

            <div className="detalle-eliminar">
              <strong>{claseAEliminar.profesor}</strong>
              <span>{claseAEliminar.asignatura}</span>
              <span>
                {claseAEliminar.dia} · {claseAEliminar.horaInicio} -{" "}
                {claseAEliminar.horaFin}
              </span>
              <span>Grupo: {claseAEliminar.grupo}</span>
            </div>

            <div className="modal-botones">
              <button
                type="button"
                className="btn-cancelar-modal"
                onClick={() => setClaseAEliminar(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="btn-eliminar-modal"
                onClick={eliminar}
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default TablaClases;