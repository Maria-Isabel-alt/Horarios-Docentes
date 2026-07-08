function Tarjetas({ totalClases, totalCruces }) {
  return (
    <section className="tarjetas">
      <div className="tarjeta">
        <span>Total clases</span>
        <strong>{totalClases}</strong>
      </div>

      <div className="tarjeta">
        <span>Alertas activas</span>
        <strong>{totalCruces}</strong>
      </div>

      <div className="tarjeta">
        <span>Estado</span>
        <strong>{totalCruces > 0 ? "Revisar" : "Correcto"}</strong>
      </div>
    </section>
  );
}

export default Tarjetas;