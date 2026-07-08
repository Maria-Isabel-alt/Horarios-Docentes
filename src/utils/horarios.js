export function normalizar(valor) {
  return String(valor || "").trim().toLowerCase();
}

export function hayCruce(claseA, claseB) {
  if (claseA.dia !== claseB.dia) return false;

  return claseA.horaInicio < claseB.horaFin && claseB.horaInicio < claseA.horaFin;
}

export function esMismoProfesor(claseA, claseB) {
  const cedulaA = normalizar(claseA.cedula);
  const cedulaB = normalizar(claseB.cedula);

  if (cedulaA && cedulaB) {
    return cedulaA === cedulaB;
  }

  return normalizar(claseA.profesor) === normalizar(claseB.profesor);
}

export function obtenerAlertas(claseActual, clases) {
  const alertas = [];

  clases.forEach((otraClase) => {
    if (otraClase.id === claseActual.id) return;
    if (!hayCruce(claseActual, otraClase)) return;

    if (esMismoProfesor(claseActual, otraClase)) {
      alertas.push("Cruce de profesor");
    }

    if (normalizar(claseActual.grupo) === normalizar(otraClase.grupo)) {
      alertas.push("Cruce de grupo");
    }

    if (
      claseActual.salon &&
      otraClase.salon &&
      normalizar(claseActual.salon) === normalizar(otraClase.salon)
    ) {
      alertas.push("Cruce de salón");
    }
  });

  return [...new Set(alertas)];
}