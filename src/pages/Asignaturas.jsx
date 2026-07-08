import Encabezado from "../components/Encabezado";
import "./Asignaturas.css";

function Asignaturas({ clases }) {
  const asignaturas = Array.from(
    new Map(
      clases
        .filter((clase) => clase.asignatura)
        .map((clase) => [
          clase.codigo || clase.asignatura,
          {
            asignatura: clase.asignatura,
            codigo: clase.codigo || "Sin código",
            programa: clase.programa || "Sin programa",
            totalClases: clases.filter(
              (c) =>
                c.asignatura === clase.asignatura &&
                (c.codigo || "") === (clase.codigo || "")
            ).length,
          },
        ])
    ).values()
  );

  return (
    <>
      <Encabezado
        titulo="Asignaturas"
        texto="Asignaturas registradas automáticamente desde la programación."
      />

      <section className="panel">
        <h2>Asignaturas registradas</h2>

        {asignaturas.length === 0 ? (
          <p className="vacio">Todavía no hay asignaturas registradas.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Asignatura</th>
                  <th>Código</th>
                  <th>Programa</th>
                  <th>Total clases</th>
                </tr>
              </thead>

              <tbody>
                {asignaturas.map((asignatura) => (
                  <tr key={`${asignatura.codigo}-${asignatura.asignatura}`}>
                    <td>{asignatura.asignatura}</td>
                    <td>{asignatura.codigo}</td>
                    <td>{asignatura.programa}</td>
                    <td>{asignatura.totalClases}</td>
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