import Encabezado from "../components/Encabezado";
import "./Docentes.css";

function Docentes({ clases }) {
  const docentes = Array.from(
    new Map(
      clases
        .filter((clase) => clase.cedula)
        .map((clase) => [
          clase.cedula,
          {
            nombre: clase.profesor,
            cedula: clase.cedula,
            programa: clase.programa || "Sin programa",
            totalClases: clases.filter((c) => c.cedula === clase.cedula).length,
          },
        ])
    ).values()
  );

  return (
    <>
      <Encabezado
        titulo="Docentes"
        texto="Docentes registrados automáticamente desde la programación."
      />

      <section className="panel">
        <h2>Docentes registrados</h2>

        {docentes.length === 0 ? (
          <p className="vacio">Todavía no hay docentes registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Cédula</th>
                  <th>Programa</th>
                  <th>Total clases</th>
                </tr>
              </thead>

              <tbody>
                {docentes.map((docente) => (
                  <tr key={docente.cedula}>
                    <td>{docente.nombre}</td>
                    <td>{docente.cedula}</td>
                    <td>{docente.programa}</td>
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