import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../Firebase/config";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const programas = [
  "Derecho Palmira",
  "Derecho Cali",
  "Derecho Virtual",
  "Ciencia Política Presencial",
  "Ciencia Política Virtual",
];

const estadoInicial = {
  profesor: "",
  cedula: "",
  contrato: "",
  asignatura: "",
  codigo: "",
  dia: "",
  horaInicio: "",
  horaFin: "",
  grupo: "",
  salon: "",
  programa: "",
  jornada: "",
};

function FormularioClase({
  onAgregarClase,
  claseEnEdicion,
  onActualizarClase,
  onCancelarEdicion,
}) {
  const [formulario, setFormulario] = useState(estadoInicial);
  const [mensaje, setMensaje] = useState("");

  const [docentes, setDocentes] = useState([]);
  const [busquedaNombre, setBusquedaNombre] = useState("");
  const [busquedaApellido, setBusquedaApellido] = useState("");
  const [busquedaCedula, setBusquedaCedula] = useState("");
  const [cargandoDocentes, setCargandoDocentes] = useState(true);

  const [asignaturas, setAsignaturas] = useState([]);
const [busquedaCodigo, setBusquedaCodigo] = useState("");
const [cargandoAsignaturas, setCargandoAsignaturas] = useState(true);

  useEffect(() => {
    const cargarDocentes = async () => {
      try {
        const resultado = await getDocs(collection(db, "docentes"));

        const lista = resultado.docs.map((documento) => ({
          id: documento.id,
          ...documento.data(),
        }));

        setDocentes(lista);
      } catch (error) {
        console.error("Error al cargar docentes:", error);
        setMensaje("❌ No se pudieron cargar los docentes.");
      } finally {
        setCargandoDocentes(false);
      }
    };

    cargarDocentes();
  }, []);

  useEffect(() => {
    if (claseEnEdicion) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormulario({
        profesor: claseEnEdicion.profesor || "",
        cedula: claseEnEdicion.cedula || "",
        contrato: claseEnEdicion.contrato || "",
        asignatura: claseEnEdicion.asignatura || "",
        codigo: claseEnEdicion.codigo || "",
        dia: claseEnEdicion.dia || "",
        horaInicio: claseEnEdicion.horaInicio || "",
        horaFin: claseEnEdicion.horaFin || "",
        grupo: claseEnEdicion.grupo || "",
        salon: claseEnEdicion.salon || "",
        programa: claseEnEdicion.programa || "",
        jornada: claseEnEdicion.jornada || "",
        id: claseEnEdicion.id,
      });

      setBusquedaCodigo(claseEnEdicion.codigo || "");

      setMensaje(
        "✏️ Estás editando una clase. Ajusta los datos y guarda los cambios."
      );
} else {
  setFormulario(estadoInicial);
  setBusquedaCodigo("");
  setMensaje("");
}
  }, [claseEnEdicion]);

  useEffect(() => {
  const cargarAsignaturas = async () => {
    try {
      const resultado = await getDocs(collection(db, "asignaturas"));

      const lista = resultado.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
      }));

      setAsignaturas(lista);
    } catch (error) {
      console.error("Error al cargar asignaturas:", error);
      setMensaje("❌ No se pudieron cargar las asignaturas.");
    } finally {
      setCargandoAsignaturas(false);
    }
  };

  cargarAsignaturas();
}, []);

  const normalizarTexto = (texto = "") =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const hayBusqueda =
    busquedaNombre.trim() !== "" ||
    busquedaApellido.trim() !== "" ||
    busquedaCedula.trim() !== "";

  const docentesFiltrados = hayBusqueda
    ? docentes
        .filter((docente) => {
          const nombre = normalizarTexto(docente.nombres);
          const apellido = normalizarTexto(docente.apellidos);
          const cedula = String(docente.cedula || "");

          const nombreBuscado = normalizarTexto(busquedaNombre);
          const apellidoBuscado = normalizarTexto(busquedaApellido);
          const cedulaBuscada = busquedaCedula.trim();

          return (
            nombre.includes(nombreBuscado) &&
            apellido.includes(apellidoBuscado) &&
            cedula.includes(cedulaBuscada)
          );
        })
        .slice(0, 10)
    : [];

  const seleccionarDocente = (docente) => {
    setFormulario((anterior) => ({
      ...anterior,
      profesor: `${docente.nombres} ${docente.apellidos}`.trim(),
      cedula: docente.cedula || "",
      contrato: docente.contrato || "",
    }));

    setBusquedaNombre("");
    setBusquedaApellido("");
    setBusquedaCedula("");
  };

const asignaturasFiltradas =
  busquedaCodigo.trim() !== ""
    ? asignaturas
        .filter((asignatura) =>
          String(asignatura.codigo || "")
            .toLowerCase()
            .includes(busquedaCodigo.trim().toLowerCase())
        )
        .slice(0, 10)
    : [];

    const seleccionarAsignatura = (asignatura) => {
  setFormulario((anterior) => ({
    ...anterior,
    codigo: asignatura.codigo || "",
    asignatura: asignatura.nombre || "",
  }));

  setBusquedaCodigo(asignatura.codigo || "");
};

  const cambiarDato = (e) => {
    const { name, value } = e.target;

    setFormulario({
      ...formulario,
      [name]: value,
    });
  };

  const guardarClase = async (e) => {
    e.preventDefault();

    if (
      !formulario.profesor ||
      !formulario.cedula ||
      !formulario.contrato ||
      !formulario.asignatura ||
      !formulario.dia ||
      !formulario.horaInicio ||
      !formulario.horaFin ||
      !formulario.grupo
    ) {
      setMensaje(
        "⚠ Debes llenar profesor, cédula, contrato, asignatura, día, hora y grupo."
      );
      return;
    }

    if (formulario.horaFin <= formulario.horaInicio) {
      setMensaje("⚠ La hora final debe ser mayor que la hora inicial.");
      return;
    }

    try {
      if (claseEnEdicion) {
        await onActualizarClase(formulario);
        setMensaje("✅ Clase actualizada correctamente.");
      } else {
        await onAgregarClase({
          ...formulario,
          id: Date.now(),
        });

        setMensaje("✅ Clase guardada correctamente.");
      }

      setFormulario(estadoInicial);

      setBusquedaCodigo("");

      setBusquedaNombre("");
      setBusquedaApellido("");
      setBusquedaCedula("");
    } catch (error) {
      console.error(error);
      setMensaje("❌ No se pudo guardar la clase.");
    }
  };

  const cancelarEdicion = () => {
    setFormulario(estadoInicial);
    setBusquedaCodigo("");
    setMensaje("");

    setBusquedaNombre("");
    setBusquedaApellido("");
    setBusquedaCedula("");

    if (onCancelarEdicion) {
      onCancelarEdicion();
    }
  };

  return (
    <section className="panel">
      <h2>{claseEnEdicion ? "Editar clase" : "Nueva clase"}</h2>

      {mensaje && <div className="mensaje">{mensaje}</div>}

      <form onSubmit={guardarClase} className="formulario">
        <div className="busqueda-docente">
          <div className="titulo-busqueda-docente">
            <h3>Buscar docente</h3>
            <p>Busca por nombre, apellido o número de cédula.</p>
          </div>

          <div className="campo">
            <label>Nombre</label>
            <input
              type="text"
              value={busquedaNombre}
              onChange={(e) => setBusquedaNombre(e.target.value)}
              placeholder="Ej: Sebastian"
            />
          </div>

          <div className="campo">
            <label>Apellido</label>
            <input
              type="text"
              value={busquedaApellido}
              onChange={(e) => setBusquedaApellido(e.target.value)}
              placeholder="Ej: Quintero"
            />
          </div>

          <div className="campo">
            <label>Cédula</label>
            <input
              type="text"
              value={busquedaCedula}
              onChange={(e) => setBusquedaCedula(e.target.value)}
              placeholder="Ej: 1108641197"
            />
          </div>

          {cargandoDocentes && (
            <div className="estado-busqueda">Cargando docentes...</div>
          )}

          {!cargandoDocentes && hayBusqueda && (
            <div className="resultados-docentes">
              {docentesFiltrados.length > 0 ? (
                docentesFiltrados.map((docente) => (
                  <button
                    key={docente.id}
                    type="button"
                    className="resultado-docente"
                    onClick={() => seleccionarDocente(docente)}
                  >
                    <strong>
                      {docente.nombres} {docente.apellidos}
                    </strong>

                    <span>
                      C.C. {docente.cedula} ·{" "}
                      {docente.contrato || "Sin contrato"}
                    </span>
                  </button>
                ))
              ) : (
                <div className="estado-busqueda">
                  No se encontraron docentes.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="campo">
          <label>Nombre del profesor</label>
          <input
            name="profesor"
            value={formulario.profesor}
            readOnly
            placeholder="Selecciona un docente"
          />
        </div>

        <div className="campo">
          <label>Cédula del profesor</label>
          <input
            name="cedula"
            value={formulario.cedula}
            readOnly
            placeholder="Se completa automáticamente"
          />
        </div>

        <div className="campo">
          <label>Tipo de contrato</label>
          <input
            name="contrato"
            value={formulario.contrato}
            readOnly
            placeholder="Se completa automáticamente"
          />
        </div>

<div className="campo campo-codigo">
  <label>Código</label>

  <input
    type="text"
    value={busquedaCodigo}
    onChange={(e) => {
      const valor = e.target.value.toUpperCase();

      setBusquedaCodigo(valor);

      setFormulario((anterior) => ({
        ...anterior,
        codigo: "",
        asignatura: "",
      }));
    }}
    placeholder="Ej: DB013"
    autoComplete="off"
  />

  {cargandoAsignaturas && (
    <div className="estado-busqueda">Cargando asignaturas...</div>
  )}

  {!cargandoAsignaturas &&
    busquedaCodigo.trim() !== "" &&
    busquedaCodigo !== formulario.codigo && (
      <div className="resultados-codigo">
        {asignaturasFiltradas.length > 0 ? (
          asignaturasFiltradas.map((asignatura) => (
            <button
              key={asignatura.id}
              type="button"
              className="resultado-codigo"
              onClick={() => seleccionarAsignatura(asignatura)}
            >
              <strong>{asignatura.codigo}</strong>
              <span>{asignatura.nombre}</span>
            </button>
          ))
        ) : (
          <div className="estado-busqueda">
            No se encontraron códigos.
          </div>
        )}
      </div>
    )}
</div>

<div className="campo">
  <label>Asignatura</label>

  <input
    name="asignatura"
    value={formulario.asignatura}
    readOnly
    placeholder="Se completa al seleccionar el código"
  />
</div>

        <div className="campo">
          <label>Día</label>
          <select name="dia" value={formulario.dia} onChange={cambiarDato}>
            <option value="">Seleccionar día</option>

            {dias.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Hora inicio</label>
          <input
            type="time"
            name="horaInicio"
            value={formulario.horaInicio}
            onChange={cambiarDato}
          />
        </div>

        <div className="campo">
          <label>Hora fin</label>
          <input
            type="time"
            name="horaFin"
            value={formulario.horaFin}
            onChange={cambiarDato}
          />
        </div>

        <div className="campo">
          <label>Grupo</label>
          <input
            name="grupo"
            value={formulario.grupo}
            onChange={cambiarDato}
            placeholder="Ej: EJM-1"
          />
        </div>

        <div className="campo">
          <label>Salón</label>
          <input
            name="salon"
            value={formulario.salon}
            onChange={cambiarDato}
            placeholder="Ej: 1101"
          />
        </div>

        <div className="campo">
          <label>Programa</label>

          <select
            name="programa"
            value={formulario.programa}
            onChange={cambiarDato}
          >
            <option value="">Seleccionar programa</option>

            {programas.map((programa) => (
              <option key={programa} value={programa}>
                {programa}
              </option>
            ))}
          </select>
        </div>

        <div className="campo">
          <label>Jornada</label>
          <input
            name="jornada"
            value={formulario.jornada}
            onChange={cambiarDato}
            placeholder="Ej: Nocturno"
          />
        </div>

        <button type="submit" className="boton-guardar">
          {claseEnEdicion ? "Actualizar clase" : "Guardar clase"}
        </button>

        {claseEnEdicion && (
          <button
            type="button"
            className="boton-cancelar"
            onClick={cancelarEdicion}
          >
            Cancelar edición
          </button>
        )}
      </form>
    </section>
  );
}

export default FormularioClase;