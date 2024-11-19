import "./css/styles.css";
import { renderPedidoList } from "./components/PedidoList";
import { renderPedidoForm } from "./components/PedidoForm";
import { renderPedidoSearch } from "./components/PedidoSearch";

window.onload = () => {
    renderPedidoList();
    renderPedidoForm();
    renderPedidoSearch();
};
