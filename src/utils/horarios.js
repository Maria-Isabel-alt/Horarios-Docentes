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

export function horaAMinutos(valor) {
  if (!valor) return null;

  let texto = String(valor)
    .trim()
    .toUpperCase()
    .replace(/\./g, "")
    .replace(/\s+/g, " ");

  // 18:30 / 07:00
  let coincidencia = texto.match(/^(\d{1,2}):(\d{2})$/);

  if (coincidencia) {
    const hora = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);

    if (hora > 23 || minutos > 59) {
      return null;
    }

    return hora * 60 + minutos;
  }

  // 7:00 AM / 1:00 PM
  coincidencia = texto.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/
  );

  if (coincidencia) {
    let hora = Number(coincidencia[1]);
    const minutos = Number(coincidencia[2]);
    const periodo = coincidencia[3];

    if (hora < 1 || hora > 12 || minutos > 59) {
      return null;
    }

    if (periodo === "PM" && hora !== 12) {
      hora += 12;
    }

    if (periodo === "AM" && hora === 12) {
      hora = 0;
    }

    return hora * 60 + minutos;
  }

  // 12:00 M
  coincidencia = texto.match(/^12:(\d{2})\s*M$/);

  if (coincidencia) {
    return 12 * 60 + Number(coincidencia[1]);
  }

  return null;
}

export function hayCruce(claseA, claseB) {
  if (
    normalizar(claseA.dia) !==
    normalizar(claseB.dia)
  ) {
    return false;
  }

  const inicioA = horaAMinutos(claseA.horaInicio);
  const finA = horaAMinutos(claseA.horaFin);

  const inicioB = horaAMinutos(claseB.horaInicio);
  const finB = horaAMinutos(claseB.horaFin);

  if (
    inicioA === null ||
    finA === null ||
    inicioB === null ||
    finB === null
  ) {
    return false;
  }

  return inicioA < finB && inicioB < finA;
}

export function esMismoProfesor(claseA, claseB) {
  const cedulaA = normalizar(claseA.cedula);
  const cedulaB = normalizar(claseB.cedula);

  // Preferimos identificar al profesor por cédula
  if (
    esValorValido(cedulaA) &&
    esValorValido(cedulaB)
  ) {
    return cedulaA === cedulaB;
  }

  const profesorA = normalizar(claseA.profesor);
  const profesorB = normalizar(claseB.profesor);

  if (
    !esValorValido(profesorA) ||
    !esValorValido(profesorB)
  ) {
    return false;
  }

  return profesorA === profesorB;
}

export function esMismoGrupo(claseA, claseB) {
  if (
    !esValorValido(claseA.grupo) ||
    !esValorValido(claseB.grupo)
  ) {
    return false;
  }

  return (
    normalizar(claseA.grupo) ===
    normalizar(claseB.grupo)
  );
}

export function esMismoSalon(claseA, claseB) {
  if (
    !esValorValido(claseA.salon) ||
    !esValorValido(claseB.salon)
  ) {
    return false;
  }

  return (
    normalizar(claseA.salon) ===
    normalizar(claseB.salon)
  );
}

/*
 * Problemas propios de UNA clase.
 * No necesitan compararse contra otra.
 */
export function obtenerProblemasDatos(clase) {
  const problemas = [];

  if (!esValorValido(clase.profesor)) {
    problemas.push("Docente pendiente");
  }

  if (!esValorValido(clase.cedula)) {
    problemas.push("Cédula del docente pendiente");
  }

  if (!esValorValido(clase.asignatura)) {
    problemas.push("Asignatura pendiente");
  }

  if (!esValorValido(clase.codigo)) {
    problemas.push("Código pendiente");
  }

  if (!esValorValido(clase.dia)) {
    problemas.push("Día pendiente");
  }

  if (horaAMinutos(clase.horaInicio) === null) {
    problemas.push("Hora de inicio pendiente o inválida");
  }

  if (horaAMinutos(clase.horaFin) === null) {
    problemas.push("Hora final pendiente o inválida");
  }

  if (!esValorValido(clase.grupo)) {
    problemas.push("Grupo pendiente");
  }

  if (!esValorValido(clase.salon)) {
    problemas.push("Salón pendiente");
  }

  if (!esValorValido(clase.programa)) {
    problemas.push("Programa pendiente");
  }

  return problemas;
}

/*
 * Indica exactamente QUÉ se cruza
 * entre dos clases.
 */
export function obtenerTiposCruce(claseA, claseB) {
  if (!hayCruce(claseA, claseB)) {
    return [];
  }

  const tipos = [];

  if (esMismoProfesor(claseA, claseB)) {
    tipos.push("profesor");
  }

  if (esMismoGrupo(claseA, claseB)) {
    tipos.push("grupo");
  }

  if (esMismoSalon(claseA, claseB)) {
    tipos.push("salón");
  }

  return tipos;
}

/*
 * Devuelve con cuáles clases choca
 * una clase concreta.
 */
export function obtenerCrucesDeClase(
  claseActual,
  clases
) {
  return clases
    .filter(
      (otraClase) =>
        otraClase.id !== claseActual.id
    )
    .map((otraClase) => {
      const tipos = obtenerTiposCruce(
        claseActual,
        otraClase
      );

      return {
        clase: otraClase,
        tipos,
      };
    })
    .filter((resultado) => resultado.tipos.length > 0);
}

/*
 * Función que ya utiliza TablaClases.
 * Ahora incluye cruces + problemas de datos.
 */
export function obtenerAlertas(claseActual, clases) {
  const alertas = [
    ...obtenerProblemasDatos(claseActual),
  ];

  const cruces = obtenerCrucesDeClase(
    claseActual,
    clases
  );

  cruces.forEach(({ tipos }) => {
    tipos.forEach((tipo) => {
      if (tipo === "profesor") {
        alertas.push("Cruce de profesor");
      }

      if (tipo === "grupo") {
        alertas.push("Cruce de grupo");
      }

      if (tipo === "salón") {
        alertas.push("Cruce de salón");
      }
    });
  });

  return [...new Set(alertas)];
}

/*
 * Devuelve todos los conflictos de la programación
 * sin duplicar A-B y B-A.
 */
export function obtenerConflictos(clases = []) {
  const conflictos = [];

  for (let i = 0; i < clases.length; i++) {
    for (let j = i + 1; j < clases.length; j++) {
      const claseA = clases[i];
      const claseB = clases[j];

      const tipos = obtenerTiposCruce(
        claseA,
        claseB
      );

      if (tipos.length === 0) {
        continue;
      }

      conflictos.push({
        id: `${claseA.id}-${claseB.id}`,
        claseA,
        claseB,
        tipos,
      });
    }
  }

  return conflictos;
}