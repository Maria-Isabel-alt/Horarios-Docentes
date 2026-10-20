export function normalizar(valor) {
  return String(valor || "").trim().toLowerCase();
}

export function esValorValido(valor) {
  const texto = normalizar(valor);

  return ![
    "",
    "na",
    "n/a",
    "sin dato",
    "sin profesor",
    "sin docente",
    "no aplica",
    "-",
  ].includes(texto);
}

export function hayCruce(claseA, claseB) {
  if (normalizar(claseA.dia) !== normalizar(claseB.dia)) {
    return false;
  }

  // Si alguna clase no tiene horario completo,
  // no podemos determinar un cruce.
  if (
    !claseA.horaInicio ||
    !claseA.horaFin ||
    !claseB.horaInicio ||
    !claseB.horaFin
  ) {
    return false;
  }

  return (
    claseA.horaInicio < claseB.horaFin &&
    claseB.horaInicio < claseA.horaFin
  );
}

export function esMismoProfesor(claseA, claseB) {
  const cedulaA = normalizar(claseA.cedula);
  const cedulaB = normalizar(claseB.cedula);

  // La cédula es el identificador más confiable.
  if (esValorValido(cedulaA) && esValorValido(cedulaB)) {
    return cedulaA === cedulaB;
  }

  const profesorA = normalizar(claseA.profesor);
  const profesorB = normalizar(claseB.profesor);

  // Si alguno no tiene un profesor real, NO hay
  // información suficiente para declarar un cruce.
  if (
    !esValorValido(profesorA) ||
    !esValorValido(profesorB)
  ) {
    return false;
  }

  return profesorA === profesorB;
}

export function obtenerAlertas(claseActual, clases) {
  const alertas = [];

  clases.forEach((otraClase) => {
    if (otraClase.id === claseActual.id) return;

    if (!hayCruce(claseActual, otraClase)) return;

    // CRUCE DE PROFESOR
    if (esMismoProfesor(claseActual, otraClase)) {
      alertas.push("Cruce de profesor");
    }

    // CRUCE DE GRUPO
    if (
      esValorValido(claseActual.grupo) &&
      esValorValido(otraClase.grupo) &&
      normalizar(claseActual.grupo) ===
        normalizar(otraClase.grupo)
    ) {
      alertas.push("Cruce de grupo");
    }

    // CRUCE DE SALÓN
    if (
      esValorValido(claseActual.salon) &&
      esValorValido(otraClase.salon) &&
      normalizar(claseActual.salon) ===
        normalizar(otraClase.salon)
    ) {
      alertas.push("Cruce de salón");
    }
  });

  return [...new Set(alertas)];
}