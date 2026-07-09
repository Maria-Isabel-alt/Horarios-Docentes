import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import FormularioClase from "../components/FormularioClase";
import TablaClases from "../components/TablaClases";
import "./Programacion.css";

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
  onAgregarClase={onAgregarClase}
  claseEnEdicion={claseEnEdicion}
  onActualizarClase={onActualizarClase}
  onCancelarEdicion={onCancelarEdicion}
/>

      <TablaClases
        clasesBase={clases}
        onEliminarClase={onEliminarClase}
        onEditarClase={onEditarClase}
        mostrarBuscador={true}
        acciones={
          <button
            className="boton-excel"
            onClick={descargarExcel}
            disabled={clases.length === 0}
          >
            Descargar Excel
          </button>
        }
      />
    </>
  );
}

export default Programacion;