import { useState } from "react";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

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
const [formulario, setFormulario] = useState(
  claseEnEdicion || estadoInicial
);

const [mensaje, setMensaje] = useState(
  claseEnEdicion
    ? "✏️ Estás editando una clase. Ajusta los datos y guarda los cambios."
    : ""
);

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

    const nuevaClase = {
      ...formulario,
      id: Date.now(),
    };

    try {
      if (claseEnEdicion) {
        await onActualizarClase(formulario);
        setMensaje("✅ Clase actualizada correctamente.");
      } else {
        await onAgregarClase(nuevaClase);
        setMensaje("✅ Clase guardada correctamente.");
      }

      setFormulario(estadoInicial);
    } catch (error) {
      console.error(error);
      setMensaje("❌ No se pudo guardar la clase.");
    }
  };

  const cancelarEdicion = () => {
    setFormulario(estadoInicial);
    setMensaje("");

    if (onCancelarEdicion) {
      onCancelarEdicion();
    }
  };

  return (
    <section className="panel">
      <h2>{claseEnEdicion ? "Editar clase" : "Nueva clase"}</h2>

      {mensaje && <div className="mensaje">{mensaje}</div>}

      <form onSubmit={guardarClase} className="formulario">
        <div className="campo">
          <label>Nombre del profesor</label>
          <input
            name="profesor"
            value={formulario.profesor}
            onChange={cambiarDato}
            placeholder="Ej: Juan Pérez"
          />
        </div>

        <div className="campo">
          <label>Cédula del profesor</label>
          <input
            name="cedula"
            value={formulario.cedula}
            onChange={cambiarDato}
            placeholder="Ej: 10101010"
          />
        </div>

        <div className="campo">
          <label>Tipo de contrato</label>
          <select
            name="contrato"
            value={formulario.contrato}
            onChange={cambiarDato}
          >
            <option value="">Seleccionar contrato</option>
            <option value="HC">HC</option>
            <option value="TC">TC</option>
            <option value="MT">MT</option>
            <option value="DIRECTOR">DIRECTOR</option>
          </select>
        </div>

        <div className="campo">
          <label>Asignatura</label>
          <input
            name="asignatura"
            value={formulario.asignatura}
            onChange={cambiarDato}
            placeholder="Ej: Derecho civil"
          />
        </div>

        <div className="campo">
          <label>Código</label>
          <input
            name="codigo"
            value={formulario.codigo}
            onChange={cambiarDato}
            placeholder="Ej: DP046"
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
          <input
            name="programa"
            value={formulario.programa}
            onChange={cambiarDato}
            placeholder="Ej: Derecho Cali"
          />
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