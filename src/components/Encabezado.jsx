function Encabezado({ titulo, texto }) {
  return (
    <section className="encabezado">
      <h1>{titulo}</h1>
      <p>{texto}</p>
    </section>
  );
}

export default Encabezado;