import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";

function ImportarExcel() {
  const [archivoNombre, setArchivoNombre] = useState("");
  const [libroExcel, setLibroExcel] = useState(null);
  const [hojas, setHojas] = useState([]);
  const [hojaSeleccionada, setHojaSeleccionada] = useState("");
  const [registros, setRegistros] = useState([]);
  const [mensaje, setMensaje] = useState("");

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
        }))
      );

      setAsignaturas(
        asignaturasSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  cargarCatalogos();
}, []);

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
      String(d.cedula || "").trim() ===
      String(registro.cedula || "").trim()
  );

  const asignatura = asignaturas.find(
    (a) =>
      String(a.codigo || "").trim().toUpperCase() ===
      String(registro.codigo || "").trim().toUpperCase()
  );

  const programaNormalizado = normalizarPrograma(registro.programa);

  const horaInicio = convertirHora(registro.horaInicio);
  const horaFin = convertirHora(registro.horaFin);

  if (!registro.cedula) {
    errores.push("Falta cédula");
  } else if (!docente) {
    errores.push("Docente no encontrado");
  }

  if (!registro.codigo) {
    errores.push("Falta código");
  } else if (!asignatura) {
    errores.push("Código no encontrado");
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
      : "",

    contrato: docente?.contrato || "",

    asignatura: asignatura?.nombre || "",

    codigo: registro.codigo.toUpperCase(),

    horaInicio,
    horaFin,

    programa: programaNormalizado || registro.programa,

    errores,
    advertencias,

    valido: errores.length === 0,
  };
};

const normalizarEncabezado = (texto = "") =>
  String(texto)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");

  const convertirFila = (fila) => {
    const filaNormalizada = {};

    Object.entries(fila).forEach(([clave, valor]) => {
      filaNormalizada[normalizarEncabezado(clave)] = valor;
    });

    return {
      cedula: String(filaNormalizada["CEDULA"] || "").trim(),
      codigo: String(filaNormalizada["CODIGO"] || "").trim(),
      dia: String(filaNormalizada["DIA"] || "").trim(),
      horaInicio: String(filaNormalizada["HORA INICIO"] || "").trim(),
      horaFin: String(filaNormalizada["HORA FIN"] || "").trim(),
      grupo: String(filaNormalizada["GRUPO"] || "").trim(),
      salon: String(filaNormalizada["SALON ASIGNADO"] || "").trim(),
      programa: String(filaNormalizada["PROGRAMA"] || "").trim(),
      jornada: String(filaNormalizada["JORNADA"] || "").trim(),
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
  .filter(
    (fila) =>
      fila.cedula ||
      fila.codigo ||
      fila.dia ||
      fila.grupo
  )
  .map(validarRegistro);

    setRegistros(filasConvertidas);
    setHojaSeleccionada(nombreHoja);

    setMensaje(
      `✅ Se encontraron ${filasConvertidas.length} registros en la hoja "${nombreHoja}".`
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

  return (
    <section className="panel">
      <h2>Cargar programación desde Excel</h2>

      <p>
        Selecciona el archivo de programación y revisa los datos antes de
        guardarlos.
      </p>

      <div>
        <label>
          <strong>Seleccionar archivo Excel</strong>
        </label>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={cargarArchivo}
        />
      </div>

      {archivoNombre && (
        <p>
          Archivo seleccionado: <strong>{archivoNombre}</strong>
        </p>
      )}

      {hojas.length > 0 && (
        <div className="campo">
          <label>Hoja del Excel</label>

          <select
            value={hojaSeleccionada}
            onChange={cambiarHoja}
          >
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

      <td>{registro.salon || "Sin asignar"}</td>

      <td>{registro.programa}</td>

      <td>{registro.jornada}</td>

      <td>
        {registro.errores?.length > 0 ? (
          <span>
            ❌ {registro.errores.join(", ")}
          </span>
        ) : registro.advertencias?.length > 0 ? (
          <span>
            ⚠️ {registro.advertencias.join(", ")}
          </span>
        ) : (
          <span>✅ Correcto</span>
        )}
      </td>
    </tr>
  ))}
</tbody>
            </table>
          </div>

          {registros.length > 20 && (
            <p>
              Mostrando los primeros 20 de {registros.length} registros.
            </p>
          )}
        </>
      )}
    </section>
  );
}

export default ImportarExcel;