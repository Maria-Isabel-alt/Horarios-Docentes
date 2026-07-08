import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "../Firebase/config";

const coleccionClases = collection(db, "clases");

export function escucharClasesDelUsuario(uid, callback) {
  const consulta = query(coleccionClases, where("creadoPor", "==", uid));

  return onSnapshot(consulta, (snapshot) => {
    const clases = snapshot.docs.map((documento) => ({
      id: documento.id,
      ...documento.data(),
    }));

    callback(clases);
  });
}

export async function agregarClaseFirestore(clase, usuario) {
  await addDoc(coleccionClases, {
    ...clase,
    creadoPor: usuario.uid,
    correoUsuario: usuario.email,
    fechaCreacion: new Date().toISOString(),
  });
}

export async function eliminarClaseFirestore(id) {
  await deleteDoc(doc(db, "clases", id));
}