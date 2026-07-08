import { obtenerAlertas } from "../utils/horarios";

function TablaClases({
  clases,
  clasesBase,
  onEliminarClase,
  mensajeVacio = "Todavía no hay clases registradas.",
}) {
  const eliminar = async (id) => {
    try {
      await onEliminarClase(id);
    } catch (error) {
      console.error(error);
      alert("No se pudo eliminar la clase.");
    }
  };

  return (
    <section className="panel">
      <h2>Clases registradas</h2>

      {clases.length === 0 ? (
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
              {clases.map((clase) => {
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
                      <button
                        className="eliminar"
                        onClick={() => eliminar(clase.id)}
                      >
                        Eliminar
                      </button>
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