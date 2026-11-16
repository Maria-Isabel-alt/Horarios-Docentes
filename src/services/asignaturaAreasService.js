import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../Firebase/config";

const referenciaAsignaturaAreas = collection(db, "asignatura_areas");

export async function obtenerAsignaturaAreas() {
  const resultado = await getDocs(referenciaAsignaturaAreas);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function guardarAreaAsignatura(codigo, datos) {
  const codigoLimpio = String(codigo || "")
    .trim()
    .toUpperCase();

  const referencia = doc(db, "asignatura_areas", codigoLimpio);

  await setDoc(
    referencia,
    {
      ...datos,
      codigo: codigoLimpio,
    },
    {
      merge: true,
    },
  );
}

export async function eliminarAreaAsignatura(codigo) {
  const codigoLimpio = String(codigo || "")
    .trim()
    .toUpperCase();

  const referencia = doc(db, "asignatura_areas", codigoLimpio);

  await deleteDoc(referencia);
}
