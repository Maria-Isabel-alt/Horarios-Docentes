import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import FormularioClase from "../components/FormularioClase";
import "./Programacion.css";

function Programacion({ clases, totalCruces, onAgregarClase }) {
  return (
    <>
      <Encabezado
        titulo="Programación de clases"
        texto="Registra clases y detecta cruces de profesor, grupo y salón."
      />

      <Tarjetas totalClases={clases.length} totalCruces={totalCruces} />

      <FormularioClase onAgregarClase={onAgregarClase} />
    </>
  );
}

export default Programacion;