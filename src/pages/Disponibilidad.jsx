import { useEffect, useMemo, useState } from "react";

import Encabezado from "../components/Encabezado";

import {
  obtenerDisponibilidades,
  guardarDisponibilidad,
} from "../services/disponibilidadService";

import "./Disponibilidad.css";

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function Disponibilidad({ clases = [] }) {
  const [disponibilidades, setDisponibilidades] = useState([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);

  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");

  const [franjas, setFranjas] = useState([]);

  useEffect(() => {
    const cargar = async () => {
      try {
        const datos = await obtenerDisponibilidades();
        setDisponibilidades(datos);
      } catch (error) {
        console.error(error);
        setMensaje("No se pudieron cargar las disponibilidades.");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, []);

  const docentes = useMemo(() => {
    const mapa = new Map();

    clases.forEach((clase) => {
      const cedula = String(clase.cedula || "").trim();
      const profesor = String(clase.profesor || "").trim();

      if (!cedula || !profesor) return;

      if (!mapa.has(cedula)) {
        mapa.set(cedula, {
          cedula,
          nombre: profesor,
          contrato: clase.contrato || "Sin dato",
        });
      }
    });

    return Array.from(mapa.values()).sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", {
        sensitivity: "base",
      }),
    );
  }, [clases]);

  const docentesFiltrados = docentes.filter((docente) => {
    const texto = `${docente.nombre} ${docente.cedula}`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  const seleccionarDocente = (docente) => {
    setDocenteSeleccionado(docente);

    const disponibilidadExistente = disponibilidades.find(
      (item) => String(item.cedula) === String(docente.cedula),
    );

    setFranjas(disponibilidadExistente?.franjas || []);
    setMensaje("");
  };

  const agregarFranja = () => {
    setFranjas((anteriores) => [
      ...anteriores,
      {
        dia: "Lunes",
        inicio: "07:00",
        fin: "08:00",
      },
    ]);
  };

  const cambiarFranja = (indice, campo, valor) => {
    setFranjas((anteriores) =>
      anteriores.map((franja, i) =>
        i === indice
          ? {
              ...franja,
              [campo]: valor,
            }
          : franja,
      ),
    );
  };

  const eliminarFranja = (indice) => {
    setFranjas((anteriores) => anteriores.filter((_, i) => i !== indice));
  };

  const guardar = async () => {
    if (!docenteSeleccionado) {
      setMensaje("Selecciona un docente.");
      return;
    }

    try {
      await guardarDisponibilidad(docenteSeleccionado.cedula, {
        docente: docenteSeleccionado.nombre,
        contrato: docenteSeleccionado.contrato,
        franjas,
      });

      setDisponibilidades((anteriores) => {
        const existe = anteriores.some(
          (item) => String(item.cedula) === String(docenteSeleccionado.cedula),
        );

        const nuevoRegistro = {
          cedula: docenteSeleccionado.cedula,
          docente: docenteSeleccionado.nombre,
          contrato: docenteSeleccionado.contrato,
          franjas,
        };

        if (existe) {
          return anteriores.map((item) =>
            String(item.cedula) === String(docenteSeleccionado.cedula)
              ? nuevoRegistro
              : item,
          );
        }

        return [...anteriores, nuevoRegistro];
      });

      setMensaje("✅ Disponibilidad guardada.");
    } catch (error) {
      console.error(error);
      setMensaje("❌ No se pudo guardar.");
    }
  };

  return (
    <>
      <Encabezado
        titulo="Banco de Disponibilidad"
        texto="Registra los días y horarios en los que cada docente puede impartir clases."
      />

      <section className="panel">
        <h2>Seleccionar docente</h2>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o cédula"
        />

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <div className="lista-docentes-disponibilidad">
            {docentesFiltrados.slice(0, 10).map((docente) => (
              <button
                type="button"
                key={docente.cedula}
                onClick={() => seleccionarDocente(docente)}
              >
                <strong>{docente.nombre}</strong>
                <span>
                  C.C. {docente.cedula} · {docente.contrato}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>

      {docenteSeleccionado && (
        <section className="panel">
          <h2>{docenteSeleccionado.nombre}</h2>

          <p>
            C.C. {docenteSeleccionado.cedula} · {docenteSeleccionado.contrato}
          </p>

          <div className="franjas-disponibilidad">
            {franjas.map((franja, indice) => (
              <div className="franja-disponibilidad" key={indice}>
                <select
                  value={franja.dia}
                  onChange={(e) => cambiarFranja(indice, "dia", e.target.value)}
                >
                  {dias.map((dia) => (
                    <option key={dia} value={dia}>
                      {dia}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={franja.inicio}
                  onChange={(e) =>
                    cambiarFranja(indice, "inicio", e.target.value)
                  }
                />

                <span>a</span>

                <input
                  type="time"
                  value={franja.fin}
                  onChange={(e) => cambiarFranja(indice, "fin", e.target.value)}
                />

                <button type="button" onClick={() => eliminarFranja(indice)}>
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={agregarFranja}>
            + Agregar franja
          </button>

          <button type="button" onClick={guardar}>
            Guardar disponibilidad
          </button>

          {mensaje && <p>{mensaje}</p>}
        </section>
      )}
    </>
  );
}

export default Disponibilidad;
