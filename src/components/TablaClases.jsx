import { useState } from "react";
import { obtenerAlertas } from "../utils/horarios";

function TablaClases({
  clases,
  clasesBase,
  onEliminarClase,
  onEditarClase,
  acciones,
  mostrarBuscador = false,
  mensajeVacio = "Todavía no hay clases registradas.",
}) {
  const [busqueda, setBusqueda] = useState("");

  const textoBusqueda = busqueda.trim().toLowerCase();

  const clasesFiltradas = clases.filter((clase) =>
    Object.values(clase).some((valor) =>
      String(valor || "").toLowerCase().includes(textoBusqueda)
    )
  );

  const eliminar = async (id) => {
    const confirmar = confirm("¿Seguro que deseas eliminar esta clase?");

    if (!confirmar) return;

    try {
      await onEliminarClase(id);
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la clase.");
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
                    <td>
                      <div className="acciones-fila">
                        <button
                          className="editar"
                          onClick={() => onEditarClase(clase)}
                        >
                          Editar
                        </button>

                        <button
                          className="eliminar"
                          onClick={() => eliminar(clase.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default TablaClases;