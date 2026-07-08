import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import FormularioClase from "../components/FormularioClase";
import TablaClases from "../components/TablaClases";
import "./Programacion.css";

function Programacion({ clases, totalCruces, onAgregarClase, onEliminarClase }) {
  return (
    <>
      <Encabezado
        titulo="Programación de clases"
        texto="Registra clases y detecta cruces de profesor, grupo y salón."
      />

      <Tarjetas totalClases={clases.length} totalCruces={totalCruces} />

      <FormularioClase onAgregarClase={onAgregarClase} />

      <TablaClases
        clases={clases}
        clasesBase={clases}
        onEliminarClase={onEliminarClase}
      />
    </>
  );
}

export default Programacion;