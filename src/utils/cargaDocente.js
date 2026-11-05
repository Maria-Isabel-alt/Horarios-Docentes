import { horaAMinutos, esValorValido } from "./horarios";

export const limitesCarga = {
  HC: {
    minimo: 8,
    maximo: 19,
  },

  DEX: {
    minimo: 8,
    maximo: 20,
  },

  TC: {
    minimo: 8,
    maximo: 22,
  },

  MT: {
    minimo: 8,
    maximo: 12,
  },
};

export function obtenerDuracionClase(clase) {
  const inicio = horaAMinutos(clase.horaInicio);
  const fin = horaAMinutos(clase.horaFin);

  if (inicio === null || fin === null || fin <= inicio) {
    return 0;
  }

  return (fin - inicio) / 60;
}

export function obtenerCargaDocente(cedula, clases = []) {
  if (!esValorValido(cedula)) {
    return 0;
  }

  return clases
    .filter(
      (clase) => String(clase.cedula || "").trim() === String(cedula).trim(),
    )
    .reduce((total, clase) => total + obtenerDuracionClase(clase), 0);
}

export function evaluarCargaDocente(contrato, horas, excepcionCarga = null) {
  const tipoContrato = String(contrato || "")
    .trim()
    .toUpperCase();

  const limiteGeneral = limitesCarga[tipoContrato];

  if (!limiteGeneral) {
    return {
      estado: "sin-configurar",
      mensaje: "Tipo de contrato sin configuración",
      minimo: null,
      maximo: null,
      usaExcepcion: false,
    };
  }

  let minimo = limiteGeneral.minimo;
  let maximo = limiteGeneral.maximo;
  let usaExcepcion = false;

  /*
   * Si el docente tiene una excepción activa,
   * usamos sus límites personalizados.
   */
  if (excepcionCarga?.activa) {
    const minimoExcepcion = Number(excepcionCarga.minimo);
    const maximoExcepcion = Number(excepcionCarga.maximo);

    if (!Number.isNaN(minimoExcepcion)) {
      minimo = minimoExcepcion;
    }

    if (!Number.isNaN(maximoExcepcion)) {
      maximo = maximoExcepcion;
    }

    usaExcepcion = true;
  }

  if (horas < minimo) {
    return {
      estado: "baja",
      mensaje: `Faltan ${minimo - horas} horas`,
      minimo,
      maximo,
      usaExcepcion,
    };
  }

  if (horas > maximo) {
    return {
      estado: "excedida",
      mensaje: `Excede ${horas - maximo} horas`,
      minimo,
      maximo,
      usaExcepcion,
    };
  }

  return {
    estado: "correcta",
    mensaje: usaExcepcion ? "Carga correcta con excepción" : "Carga correcta",
    minimo,
    maximo,
    usaExcepcion,
  };
}
