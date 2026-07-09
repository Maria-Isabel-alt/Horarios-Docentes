import * as XLSX from "xlsx";
import Encabezado from "../components/Encabezado";
import Tarjetas from "../components/Tarjetas";
import TablaClases from "../components/TablaClases";
import "./ClasesRegistradas.css";

function ClasesRegistradas({ clases, totalCruces, onEliminarClase, onEditarClase }) {
    const descargarExcel = () => {
    const datos = clases.map((clase) => ({
      Profesor: clase.profesor,
      Cedula: clase.cedula,
      Contrato: clase.contrato || "",
      Asignatura: clase.asignatura,
      Codigo: clase.codigo,
      Dia: clase.dia,
      Hora_inicio: clase.horaInicio,
      Hora_fin: clase.horaFin,
      Grupo: clase.grupo,
      Salon: clase.salon,
      Programa: clase.programa,
      Jornada: clase.jornada,
    }));

    const hoja = XLSX.utils.json_to_sheet(datos);
    const libro = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(libro, hoja, "Clases registradas");
    XLSX.writeFile(libro, "clases_registradas.xlsx");
  };

  return (
    <>
      <Encabezado
        titulo="Clases registradas"
        texto="Consulta la tabla completa y descarga la información en Excel."
      />

      <Tarjetas totalClases={clases.length} totalCruces={totalCruces} />

      <TablaClases
        clases={clases}
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

export default ClasesRegistradas;