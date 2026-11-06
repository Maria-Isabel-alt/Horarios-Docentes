import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from "firebase/firestore";

import { db } from "../Firebase/config";

const coleccionDisponibilidad = collection(db, "disponibilidad_docentes");

export async function obtenerDisponibilidades() {
  const resultado = await getDocs(coleccionDisponibilidad);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function guardarDisponibilidad(cedula, datos) {
  const referencia = doc(db, "disponibilidad_docentes", String(cedula));

  await setDoc(
    referencia,
    {
      ...datos,
      cedula: String(cedula),
    },
    {
      merge: true,
    },
  );
}

export async function eliminarDisponibilidad(cedula) {
  const referencia = doc(db, "disponibilidad_docentes", String(cedula));

  await deleteDoc(referencia);
}
