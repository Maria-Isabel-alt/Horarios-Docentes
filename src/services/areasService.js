import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

import { db } from "../Firebase/config";

const referenciaAreas = collection(db, "areas_derecho");

export async function obtenerAreas() {
  const resultado = await getDocs(referenciaAreas);

  return resultado.docs.map((documento) => ({
    id: documento.id,
    ...documento.data(),
  }));
}

export async function crearArea(datos) {
  const resultado = await addDoc(referenciaAreas, datos);

  return {
    id: resultado.id,
    ...datos,
  };
}

export async function actualizarArea(id, datos) {
  const referencia = doc(db, "areas_derecho", id);

  await updateDoc(referencia, datos);
}

export async function eliminarArea(id) {
  const referencia = doc(db, "areas_derecho", id);

  await deleteDoc(referencia);
}
