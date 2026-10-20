import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import FormularioClase from "../components/FormularioClase";
import TablaClases from "../components/TablaClases";
import "./Programacion.css";
import ImportarExcel from "../components/ImportarExcel";

function Programacion({
  clases,
  totalCruces,
  onAgregarClase,
  onEliminarClase,
  onEditarClase,
  claseEnEdicion,
  onActualizarClase,
  onCancelarEdicion,
}) {
  return (
    <>
      <Encabezado
        titulo="Programación de clases"
        texto="Registra clases y detecta cruces de profesor, grupo y salón."
      />

      <Tarjetas totalClases={clases.length} totalCruces={totalCruces} />

<FormularioClase
  key={claseEnEdicion?.id || "nueva-clase"}
  clases={clases}
  onAgregarClase={onAgregarClase}
  claseEnEdicion={claseEnEdicion}
  onActualizarClase={onActualizarClase}
  onCancelarEdicion={onCancelarEdicion}
/>

<ImportarExcel
  onAgregarClase={onAgregarClase}
/>

      <TablaClases
        clases={clases}
        clasesBase={clases}
        onEliminarClase={onEliminarClase}
        onEditarClase={onEditarClase}
      />
    </>
  );
}

export default Programacion;