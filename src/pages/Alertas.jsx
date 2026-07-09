import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import TablaClases from "../components/TablaClases";
import "./Alertas.css";

function Alertas({
  clases,
  clasesBase,
  totalClases,
  totalCruces,
  onEliminarClase,
  onEditarClase,
}) {
  return (
    <>
      <Encabezado
        titulo="Alertas"
        texto="Revisa las clases que tienen cruces de horario."
      />

      <Tarjetas totalClases={totalClases} totalCruces={totalCruces} />

      <TablaClases
        clases={clases}
        clasesBase={clasesBase}
        onEliminarClase={onEliminarClase}
        onEditarClase={onEditarClase}
        mostrarBuscador={true}
        mensajeVacio="No hay cruces registrados. Todo está correcto."
      />
    </>
  );
}

export default Alertas;