import axios from "axios";

export function renderPedidoSearch() {
    const buscarNumeroBtn = document.getElementById("buscarNumeroBtn");
    const buscarFechaBtn = document.getElementById("buscarFechaBtn");
    const resultadoBusqueda = document.getElementById("resultadoBusqueda");

    if (!buscarNumeroBtn || !buscarFechaBtn || !resultadoBusqueda) return;

    buscarNumeroBtn.addEventListener("click", async () => {
        const nroComprobante = (document.getElementById("buscarNumero") as HTMLInputElement).value;
        try {
            const response = await axios.get(`http://localhost:3000/api/pedidos?nroComprobante=${nroComprobante}`);
            resultadoBusqueda.innerHTML = JSON.stringify(response.data, null, 2);
        } catch (error) {
            console.error("Error al buscar el pedido:", error);
            resultadoBusqueda.innerHTML = "Error al buscar el pedido.";
        }
    });

    buscarFechaBtn.addEventListener("click", async () => {
        const fechaInicio = (document.getElementById("buscarFechaInicio") as HTMLInputElement).value;
        const fechaFin = (document.getElementById("buscarFechaFin") as HTMLInputElement).value;
        try {
            const response = await axios.get(`http://localhost:3000/api/pedidos?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`);
            resultadoBusqueda.innerHTML = JSON.stringify(response.data, null, 2);
        } catch (error) {
            console.error("Error al buscar pedidos:", error);
            resultadoBusqueda.innerHTML = "Error al buscar pedidos.";
        }
    });
}
