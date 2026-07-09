import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../Firebase/config";

const coleccionClases = collection(db, "clases");

export function escucharClasesDelUsuario(uid, callback) {
  const consulta = query(coleccionClases, where("creadoPor", "==", uid));

  return onSnapshot(consulta, (snapshot) => {
    const clases = snapshot.docs.map((documento) => ({
      ...documento.data(),
      id: documento.id,
    }));

    callback(clases);
  });
}

export async function agregarClaseFirestore(clase, usuario) {
  const datosClase = { ...clase };

  delete datosClase.id;

  await addDoc(coleccionClases, {
    ...datosClase,
    creadoPor: usuario.uid,
    correoUsuario: usuario.email,
    fechaCreacion: new Date().toISOString(),
  });
}

export async function eliminarClaseFirestore(id) {
  await deleteDoc(doc(db, "clases", String(id)));
}

export async function actualizarClaseFirestore(id, clase) {
  const datosClase = { ...clase };

  delete datosClase.id;
  delete datosClase.creadoPor;
  delete datosClase.correoUsuario;
  delete datosClase.fechaCreacion;

  await updateDoc(doc(db, "clases", String(id)), {
    ...datosClase,
    fechaActualizacion: new Date().toISOString(),
  });
}