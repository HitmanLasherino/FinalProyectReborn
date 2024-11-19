import axios from "axios";
import { renderPedidoList } from "./PedidoList";

export async function renderPedidoForm() {
    const clienteSelect = document.getElementById("idcliente") as HTMLSelectElement;
    const fechaPedidoInput = document.getElementById("fechaPedido") as HTMLInputElement;
    const nroComprobanteInput = document.getElementById("nroComprobante") as HTMLInputElement;
    const formaPagoInput = document.getElementById("formaPago") as HTMLInputElement;
    const addProductoBtn = document.getElementById("addProductoBtn") as HTMLButtonElement;

    if (!clienteSelect || !fechaPedidoInput || !nroComprobanteInput || !formaPagoInput) return;

    try {
        // Cargar lista de clientes
        const response = await axios.get("http://localhost:3000/api/clientes");
        const clientes = response.data;

        clienteSelect.innerHTML = clientes
            .map((cliente: any) => `<option value="${cliente.id}">${cliente.razonSocial}</option>`)
            .join("");

        // Evento para agregar productos
        addProductoBtn.addEventListener("click", async () => {
            const productosContainer = document.getElementById("productosContainer");
            if (productosContainer) {
                const responseProductos = await axios.get("http://localhost:3000/api/productos");
                const productos = responseProductos.data;

                const newProductRow = document.createElement("div");
                newProductRow.innerHTML = `
                    <select class="producto-id">
                        ${productos
                            .map(
                                (producto: any) =>
                                    `<option value="${producto.id}">${producto.nombre}</option>`
                            )
                            .join("")}
                    </select>
                    <input type="number" placeholder="Cantidad" class="producto-cantidad" />
                `;
                productosContainer.appendChild(newProductRow);
            }
        });

        // Evento para guardar el pedido
        const form = document.getElementById("pedidoForm") as HTMLFormElement;
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            const clienteId = clienteSelect.value;
            const fechaPedido = fechaPedidoInput.value;
            const nroComprobante = nroComprobanteInput.value;
            const formaPago = formaPagoInput.value;

            // Capturar productos
            const productosContainer = document.getElementById("productosContainer");
            const productos: any[] = [];
            if (productosContainer) {
                productosContainer.querySelectorAll("div").forEach((row) => {
                    const idProducto = (row.querySelector(".producto-id") as HTMLSelectElement).value;
                    const cantidad = (row.querySelector(".producto-cantidad") as HTMLInputElement).value;
                    if (idProducto && cantidad) {
                        productos.push({ idproducto: idProducto, cantidad: Number(cantidad) });
                    }
                });
            }

            if (!clienteId || !fechaPedido || !nroComprobante || !formaPago) {
                alert("Todos los campos son obligatorios.");
                return;
            }

            try {
                // Guardar pedido
                await axios.post("http://localhost:3000/api/pedidos", {
                    idcliente: clienteId,
                    fechaPedido,
                    nroComprobante,
                    formaPago,
                    detalles: productos,
                });

                alert("Pedido guardado correctamente.");
                renderPedidoList(); // Actualizar la lista de pedidos
            } catch (error) {
                console.error("Error al guardar el pedido:", error);
                alert("Ocurrió un error al guardar el pedido.");
            }
        });
    } catch (error) {
        console.error("Error al cargar los clientes:", error);
    }
}
