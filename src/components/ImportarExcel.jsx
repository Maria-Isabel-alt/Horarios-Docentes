import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";
import "./ImportarExcel.css";

function ImportarExcel({ onAgregarClase, onEliminarClase, clases = [] }) {
  const [archivoNombre, setArchivoNombre] = useState("");
  const [libroExcel, setLibroExcel] = useState(null);
  const [hojas, setHojas] = useState([]);
  const [hojaSeleccionada, setHojaSeleccionada] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [eliminando, setEliminando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(null);

  const [docentes, setDocentes] = useState([]);
  const [asignaturas, setAsignaturas] = useState([]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [docentesSnapshot, asignaturasSnapshot] = await Promise.all([
          getDocs(collection(db, "docentes")),
          getDocs(collection(db, "asignaturas")),
        ]);

        setDocentes(
          docentesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );

        setAsignaturas(
          asignaturasSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
        );
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      }
    };

    cargarCatalogos();
  }, []);

  const normalizarEncabezado = (texto = "") =>
    String(texto)
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const convertirHora = (hora) => {
    if (!hora) return "";

    const texto = String(hora).trim().toUpperCase();

    if (/^\d{2}:\d{2}$/.test(texto)) {
      return texto;
    }

    const coincidencia = texto.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

    if (!coincidencia) {
      return texto;
    }

    let [, horas, minutos, periodo] = coincidencia;

    horas = Number(horas);

    if (periodo === "PM" && horas !== 12) {
      horas += 12;
    }

    if (periodo === "AM" && horas === 12) {
      horas = 0;
    }

    return `${String(horas).padStart(2, "0")}:${minutos}`;
  };

  const normalizarPrograma = (programa) => {
    const valor = normalizarEncabezado(programa);

    const equivalencias = {
      "DERECHO PALMIRA": "Derecho Palmira",
      "DERECHO CALI": "Derecho Cali",
      "DERECHO VIRTUAL": "Derecho Virtual",
      "CIENCIA POLITICA PRESENCIAL": "Ciencia Política Presencial",
      "CIENCIA POLITICA VIRTUAL": "Ciencia Política Virtual",
    };

    return equivalencias[valor] || "";
  };

  const validarRegistro = (registro) => {
    const errores = [];
    const advertencias = [];

    const docente = docentes.find(
      (d) =>
        String(d.cedula || "").trim() === String(registro.cedula || "").trim(),
    );

    const asignatura = asignaturas.find(
      (a) =>
        String(a.codigo || "")
          .trim()
          .toUpperCase() ===
        String(registro.codigo || "")
          .trim()
          .toUpperCase(),
    );

    const programaNormalizado = normalizarPrograma(registro.programa);

    const horaInicio = convertirHora(registro.horaInicio);
    const horaFin = convertirHora(registro.horaFin);

    if (!registro.cedula) {
      errores.push("Falta cédula");
    } else if (!docente && !registro.docenteExcel) {
      errores.push("Docente no encontrado");
    } else if (!docente) {
      advertencias.push("Docente no registrado en catálogo");
    }

    if (!registro.codigo) {
      errores.push("Falta código");
    } else if (!asignatura && !registro.asignaturaExcel) {
      errores.push("Código no encontrado");
    } else if (!asignatura) {
      advertencias.push("Asignatura no registrada en catálogo");
    }

    if (!registro.dia) {
      errores.push("Falta día");
    }

    if (!horaInicio) {
      errores.push("Falta hora inicial");
    }

    if (!horaFin) {
      errores.push("Falta hora final");
    }

    if (horaInicio && horaFin && horaFin <= horaInicio) {
      errores.push("Horario inválido");
    }

    if (!registro.grupo) {
      errores.push("Falta grupo");
    }

    if (!programaNormalizado) {
      errores.push("Programa no reconocido");
    }

    if (!registro.salon) {
      advertencias.push("Sin salón asignado");
    }

    return {
      ...registro,

      profesor: docente
        ? `${docente.nombres} ${docente.apellidos}`.trim()
        : registro.docenteExcel,

      contrato: docente?.contrato || registro.contratoExcel || "",

      asignatura: asignatura?.nombre || registro.asignaturaExcel || "",

      codigo: registro.codigo.toUpperCase(),

      horaInicio,
      horaFin,

      programa: programaNormalizado || registro.programa,

      errores,
      advertencias,

      valido: errores.length === 0,
    };
  };

  const convertirFila = (fila) => {
    const filaNormalizada = {};

    Object.entries(fila).forEach(([clave, valor]) => {
      filaNormalizada[normalizarEncabezado(clave)] = valor;
    });

    return {
      cedula: String(filaNormalizada["CEDULA"] || "").trim(),

      docenteExcel: String(filaNormalizada["DOCENTE"] || "").trim(),

      contratoExcel: String(filaNormalizada["CONTRATO"] || "").trim(),

      asignaturaExcel: String(filaNormalizada["ASIGNATURA"] || "").trim(),

      codigo: String(filaNormalizada["CODIGO"] || "").trim(),

      dia: String(filaNormalizada["DIA"] || "").trim(),

      horaInicio: String(filaNormalizada["HORA INICIO"] || "").trim(),

      horaFin: String(filaNormalizada["HORA FIN"] || "").trim(),

      grupo: String(filaNormalizada["GRUPO"] || "").trim(),

      salon: String(filaNormalizada["SALON ASIGNADO"] || "").trim(),

      programa: String(filaNormalizada["PROGRAMA"] || "").trim(),

      jornada: String(filaNormalizada["JORNADA"] || "").trim(),

      matriculados: Number(filaNormalizada["MATRICULADOS"] || 0),
    };
  };

  const leerHoja = (libro, nombreHoja) => {
    const hoja = libro.Sheets[nombreHoja];

    const datos = XLSX.utils.sheet_to_json(hoja, {
      defval: "",
      raw: false,
    });

    const filasConvertidas = datos
      .map(convertirFila)
      .filter((fila) => fila.cedula || fila.codigo || fila.dia || fila.grupo)
      .map(validarRegistro);

    setRegistros(filasConvertidas);
    setHojaSeleccionada(nombreHoja);

    setMensaje(
      `✅ Se encontraron ${filasConvertidas.length} registros en la hoja "${nombreHoja}".`,
    );
  };

  const cargarArchivo = (e) => {
    const archivo = e.target.files?.[0];

    if (!archivo) return;

    const extension = archivo.name.split(".").pop()?.toLowerCase();

    if (!["xlsx", "xls"].includes(extension)) {
      setMensaje("❌ Debes seleccionar un archivo de Excel.");
      return;
    }

    const lector = new FileReader();

    lector.onload = (evento) => {
      try {
        const datos = new Uint8Array(evento.target.result);

        const libro = XLSX.read(datos, {
          type: "array",
        });

        setLibroExcel(libro);
        setArchivoNombre(archivo.name);
        setHojas(libro.SheetNames);

        if (libro.SheetNames.length > 0) {
          leerHoja(libro, libro.SheetNames[0]);
        }
      } catch (error) {
        console.error("Error leyendo Excel:", error);
        setMensaje("❌ No se pudo leer el archivo.");
      }
    };

    lector.readAsArrayBuffer(archivo);
  };

  const cambiarHoja = (e) => {
    const nombreHoja = e.target.value;

    if (!libroExcel) return;

    leerHoja(libroExcel, nombreHoja);
  };

  const solicitarGuardarRegistros = () => {
    if (registros.length === 0) {
      setMensaje("⚠ No hay registros para guardar.");
      return;
    }

    const pendientesRevision = registros.filter(
      (registro) =>
        registro.errores?.length > 0 || registro.advertencias?.length > 0,
    ).length;

    setConfirmacion({
      tipo: "guardar",
      titulo: "Guardar programación",
      mensaje: "¿Deseas guardar las clases importadas desde el archivo Excel?",
      cantidad: registros.length,
      pendientes: pendientesRevision,
    });
  };

  const guardarRegistros = async () => {
    if (registros.length === 0) {
      setMensaje("⚠ No hay registros para guardar.");
      return;
    }

    if (!onAgregarClase) {
      setMensaje("❌ No se encontró la función para guardar las clases.");
      return;
    }

    const pendientesRevision = registros.filter(
      (registro) =>
        registro.errores?.length > 0 || registro.advertencias?.length > 0,
    ).length;

    setGuardando(true);
    setProgreso(0);

    let guardadas = 0;
    let fallidas = 0;

    try {
      for (let i = 0; i < registros.length; i++) {
        const registro = registros[i];

        const erroresImportacion = registro.errores || [];
        const advertenciasImportacion = registro.advertencias || [];

        const alertasImportacion = [
          ...erroresImportacion,
          ...advertenciasImportacion,
        ];

        const nuevaClase = {
          profesor: registro.profesor || "",
          cedula: registro.cedula || "",
          contrato: registro.contrato || "",
          asignatura: registro.asignatura || "",
          codigo: registro.codigo || "",
          dia: registro.dia || "",
          horaInicio: registro.horaInicio || "",
          horaFin: registro.horaFin || "",
          grupo: registro.grupo || "",
          matriculados: registro.matriculados || 0,
          salon: registro.salon || "",
          programa: registro.programa || "",
          jornada: registro.jornada || "",

          // Información especial de la importación
          origen: "excel",

          erroresImportacion,
          advertenciasImportacion,
          alertasImportacion,

          requiereRevision: alertasImportacion.length > 0,

          estadoRevision:
            alertasImportacion.length > 0 ? "pendiente" : "correcto",

          id: Date.now() + i,
        };

        try {
          await onAgregarClase(nuevaClase);
          guardadas++;
        } catch (error) {
          console.error(`Error guardando registro ${i + 1}:`, error);

          fallidas++;
        }

        setProgreso(i + 1);
      }

      if (fallidas === 0) {
        setMensaje(
          `✅ Se guardaron ${guardadas} clases. ` +
            `${pendientesRevision} quedaron pendientes de revisión.`,
        );
      } else {
        setMensaje(
          `⚠ Se guardaron ${guardadas} clases y ${fallidas} no pudieron guardarse.`,
        );
      }
    } catch (error) {
      console.error("Error durante la importación:", error);
      setMensaje("❌ Ocurrió un error durante la importación.");
    } finally {
      setGuardando(false);
    }
  };

  const totalValidos = registros.filter((registro) => registro.valido).length;

  const totalPendientesRevision = registros.filter(
    (registro) =>
      registro.errores?.length > 0 || registro.advertencias?.length > 0,
  ).length;

  const totalErrores = registros.filter((registro) => !registro.valido).length;

  const totalAdvertencias = registros.filter(
    (registro) => registro.valido && registro.advertencias?.length > 0,
  ).length;

  const totalCorrectos = registros.filter(
    (registro) => registro.valido && registro.advertencias?.length === 0,
  ).length;

  const solicitarEliminarImportacion = () => {
    const clasesImportadas = clases.filter((clase) => clase.origen === "excel");

    if (clasesImportadas.length === 0) {
      setMensaje("No hay clases importadas desde Excel para eliminar.");
      return;
    }

    setConfirmacion({
      tipo: "eliminar",
      titulo: "Eliminar importación",
      mensaje:
        "¿Seguro que deseas eliminar todas las clases importadas desde Excel?",
      cantidad: clasesImportadas.length,
    });
  };

  const eliminarClasesImportadas = async () => {
    const clasesImportadas = clases.filter((clase) => clase.origen === "excel");

    setEliminando(true);

    let eliminadas = 0;
    let fallidas = 0;

    try {
      for (const clase of clasesImportadas) {
        try {
          await onEliminarClase(clase.id);
          eliminadas++;
        } catch (error) {
          console.error("Error eliminando clase:", clase.id, error);
          fallidas++;
        }
      }

      if (fallidas === 0) {
        setMensaje(
          `✅ Se eliminaron ${eliminadas} clases importadas desde Excel.`,
        );
      } else {
        setMensaje(
          `⚠ Se eliminaron ${eliminadas} clases y ${fallidas} no pudieron eliminarse.`,
        );
      }
    } catch (error) {
      console.error("Error eliminando importación:", error);
      setMensaje("❌ Ocurrió un error al eliminar la importación.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <section className="panel">
      <h2>Cargar programación desde Excel</h2>

      <p>
        Selecciona el archivo de programación y revisa los datos antes de
        guardarlos.
      </p>

      <div className="excel-carga">
        <div className="excel-carga-info">
          <div className="excel-icono">📊</div>

          <div>
            <strong>Cargar archivo Excel</strong>
            <p>
              Selecciona un archivo .xlsx o .xls con la programación académica.
            </p>
          </div>
        </div>

        <label className="boton-seleccionar-excel">
          Seleccionar archivo
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={cargarArchivo}
            hidden
          />
        </label>
      </div>

      {clases.some((clase) => clase.origen === "excel") && (
        <div className="zona-eliminar-importacion">
          <button
            type="button"
            className="boton-eliminar-importacion"
            onClick={solicitarEliminarImportacion}
            disabled={eliminando}
          >
            {eliminando
              ? "Eliminando clases importadas..."
              : "Eliminar clases importadas desde Excel"}
          </button>

          <p>
            Solo elimina las clases cargadas mediante Excel. Las clases creadas
            manualmente se conservan.
          </p>
        </div>
      )}

      {archivoNombre && (
        <div className="archivo-seleccionado">
          <span>✓</span>

          <div>
            <small>Archivo seleccionado</small>
            <strong>{archivoNombre}</strong>
          </div>
        </div>
      )}

      {hojas.length > 0 && (
        <div className="campo selector-hoja-excel">
          <label>Hoja del Excel</label>

          <select value={hojaSeleccionada} onChange={cambiarHoja}>
            {hojas.map((hoja) => (
              <option key={hoja} value={hoja}>
                {hoja}
              </option>
            ))}
          </select>
        </div>
      )}

      {mensaje && <div className="mensaje">{mensaje}</div>}

      {registros.length > 0 && (
        <>
          <div className="resumen-importacion">
            <div className="resumen-item">
              <span>Total registros</span>
              <strong>{registros.length}</strong>
            </div>

            <div className="resumen-item resumen-correcto">
              <span>Correctos</span>
              <strong>{totalCorrectos}</strong>
            </div>

            <div className="resumen-item resumen-advertencia">
              <span>Advertencias</span>
              <strong>{totalAdvertencias}</strong>
            </div>

            <div className="resumen-item resumen-error">
              <span>Con errores</span>
              <strong>{totalErrores}</strong>
            </div>
          </div>

          <div className="acciones-importacion">
            <button
              type="button"
              className="boton-importar-clases"
              onClick={solicitarGuardarRegistros}
              disabled={guardando || registros.length === 0}
            >
              {guardando
                ? `Guardando ${progreso} de ${registros.length}...`
                : `Guardar ${registros.length} clases`}
            </button>

            {totalPendientesRevision > 0 && (
              <p className="aviso-registros-error">
                ⚠ {totalPendientesRevision} registros quedarán pendientes de
                revisión.
              </p>
            )}
          </div>

          <h3>Vista previa</h3>

          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Cédula</th>
                  <th>Docente</th>
                  <th>Contrato</th>
                  <th>Código</th>
                  <th>Asignatura</th>
                  <th>Día</th>
                  <th>Hora inicio</th>
                  <th>Hora fin</th>
                  <th>Grupo</th>
                  <th>Matriculados</th>
                  <th>Salón</th>
                  <th>Programa</th>
                  <th>Jornada</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {registros.slice(0, 20).map((registro, index) => (
                  <tr key={index}>
                    <td>{registro.cedula}</td>

                    <td>{registro.profesor || "—"}</td>

                    <td>{registro.contrato || "—"}</td>

                    <td>{registro.codigo}</td>

                    <td>{registro.asignatura || "—"}</td>

                    <td>{registro.dia}</td>

                    <td>{registro.horaInicio}</td>

                    <td>{registro.horaFin}</td>

                    <td>{registro.grupo}</td>

                    <td>{registro.matriculados || 0}</td>

                    <td>{registro.salon || "Sin asignar"}</td>

                    <td>{registro.programa}</td>

                    <td>{registro.jornada}</td>

                    <td>
                      {registro.errores?.length > 0 ? (
                        <span className="estado-importacion estado-error">
                          ✕ {registro.errores.join(", ")}
                        </span>
                      ) : registro.advertencias?.length > 0 ? (
                        <span className="estado-importacion estado-advertencia">
                          ⚠ {registro.advertencias.join(", ")}
                        </span>
                      ) : (
                        <span className="estado-importacion estado-correcto">
                          ✓ Correcto
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {registros.length > 20 && (
            <p>Mostrando los primeros 20 de {registros.length} registros.</p>
          )}
        </>
      )}

      {confirmacion && (
        <div className="modal-fondo">
          <div className="modal-confirmacion">
            <div className="modal-icono">
              {confirmacion.tipo === "eliminar" ? "⚠️" : "📊"}
            </div>

            <h3>{confirmacion.titulo}</h3>

            <p>{confirmacion.mensaje}</p>

            <div className="detalle-importacion-modal">
              <strong>
                {confirmacion.cantidad} clases
                {confirmacion.tipo === "eliminar"
                  ? " serán eliminadas"
                  : " serán guardadas"}
              </strong>

              {confirmacion.tipo === "guardar" &&
                confirmacion.pendientes > 0 && (
                  <span>
                    ⚠ {confirmacion.pendientes} quedarán pendientes de revisión.
                  </span>
                )}

              {confirmacion.tipo === "eliminar" && (
                <>
                  <span>Las clases creadas manualmente se conservarán.</span>

                  <span className="texto-peligro">
                    Esta acción no se puede deshacer.
                  </span>
                </>
              )}
            </div>

            <div className="modal-botones">
              <button
                type="button"
                className="btn-cancelar-modal"
                onClick={() => setConfirmacion(null)}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  confirmacion.tipo === "eliminar"
                    ? "btn-eliminar-modal"
                    : "btn-confirmar-importacion"
                }
                onClick={() => {
                  const tipo = confirmacion.tipo;

                  setConfirmacion(null);

                  if (tipo === "guardar") {
                    guardarRegistros();
                  }

                  if (tipo === "eliminar") {
                    eliminarClasesImportadas();
                  }
                }}
              >
                {confirmacion.tipo === "eliminar"
                  ? "Sí, eliminar"
                  : "Sí, guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default ImportarExcel;
