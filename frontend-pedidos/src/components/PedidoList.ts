import axios from "axios";

export async function renderPedidoList() {
    const tbody = document.querySelector("#pedidosTable tbody");
    if (!tbody) return;

    tbody.innerHTML = ""; // Limpiar la lista antes de renderizar

    try {
        const response = await axios.get("http://localhost:3000/api/pedidos");
        const pedidos = response.data;

        if (!pedidos || pedidos.length === 0) {
            tbody.innerHTML = "<tr><td colspan='7'>No hay pedidos para mostrar.</td></tr>";
            return;
        }

        pedidos.forEach((pedido: any) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${pedido.id}</td>
                <td>${pedido.cliente.razonSocial}</td>
                <td>${pedido.fechaPedido}</td>
                <td>${pedido.nroComprobante}</td>
                <td>${pedido.formaPago}</td>
                <td>$${pedido.totalPedido.toFixed(2)}</td>
                <td>
                    <button class="edit-btn" data-id="${pedido.id}">Editar</button>
                    <button class="delete-btn" data-id="${pedido.id}">Eliminar</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        addEventListeners();
    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
        tbody.innerHTML = "<tr><td colspan='7'>Ocurrió un error al cargar los pedidos.</td></tr>";
    }
}

function addEventListeners() {
    const editButtons = document.querySelectorAll(".edit-btn");
    const deleteButtons = document.querySelectorAll(".delete-btn");

    editButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            const id = (event.target as HTMLButtonElement).dataset.id;
            console.log("Editar pedido:", id);
        });
    });

    deleteButtons.forEach((button) => {
        button.addEventListener("click", async (event) => {
            const id = (event.target as HTMLButtonElement).dataset.id;
            try {
                await axios.delete(`http://localhost:3000/api/pedidos/${id}`);
                alert("Pedido eliminado correctamente.");
                renderPedidoList();
            } catch (error) {
                console.error("Error al eliminar el pedido:", error);
                alert("No se pudo eliminar el pedido.");
            }
        });
    });
}
