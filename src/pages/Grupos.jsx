import Encabezado from "../components/Encabezado";
import "./Grupos.css";

function Grupos({ clases }) {
  const grupos = Array.from(
    new Map(
      clases
        .filter((clase) => clase.grupo)
        .map((clase) => [
          clase.grupo,
          {
            grupo: clase.grupo,
            programa: clase.programa || "Sin programa",
            jornada: clase.jornada || "Sin jornada",
            totalClases: clases.filter((c) => c.grupo === clase.grupo).length,
          },
        ])
    ).values()
  );

  return (
    <>
      <Encabezado
        titulo="Grupos"
        texto="Grupos registrados automáticamente desde la programación."
      />

      <section className="panel">
        <h2>Grupos registrados</h2>

        {grupos.length === 0 ? (
          <p className="vacio">Todavía no hay grupos registrados.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Programa</th>
                  <th>Jornada</th>
                  <th>Total clases</th>
                </tr>
              </thead>

              <tbody>
                {grupos.map((grupo) => (
                  <tr key={grupo.grupo}>
                    <td>{grupo.grupo}</td>
                    <td>{grupo.programa}</td>
                    <td>{grupo.jornada}</td>
                    <td>{grupo.totalClases}</td>
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

export default Grupos;