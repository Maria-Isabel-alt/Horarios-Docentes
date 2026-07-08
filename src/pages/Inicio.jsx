import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import "./Inicio.css";

function Inicio({ totalClases, totalCruces }) {
  return (
    <>
      <Encabezado
        titulo="Inicio"
        texto="Resumen general de la programación académica."
      />

      <Tarjetas totalClases={totalClases} totalCruces={totalCruces} />

      <section className="panel inicio-panel">
        <h2>Bienvenido</h2>
        <p>
          Desde este sistema podrás organizar docentes, grupos, asignaturas,
          salones y horarios. También podrás detectar cruces de profesor, grupo
          y salón.
        </p>
      </section>
    </>
  );
}

export default Inicio;