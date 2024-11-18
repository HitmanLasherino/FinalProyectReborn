import { AppDataSource } from "../data-source.js";
import { PedidoVenta } from "../entity/PedidoVenta.js";
import { PedidoVentaDetalle } from "../entity/PedidoVentaDetalle.js";
import { Cliente } from "../entity/Cliente.js";
import { Producto } from "../entity/Producto.js";
export class PedidoVentaController {
    static createPedido = async (req, res) => {
        const queryRunner = AppDataSource.createQueryRunner();
        try {
            const { idcliente, nroComprobante, formaPago, detalles } = req.body;
            // Validar datos requeridos
            if (!idcliente || !nroComprobante || !formaPago || !detalles) {
                res.status(400).json({ message: "Faltan datos requeridos (Cliente, Nro Comprobante, Forma de Pago, Detalles)." });
                return;
            }
            await queryRunner.connect();
            await queryRunner.startTransaction();
            // Verificar que el cliente exista
            const cliente = await queryRunner.manager.findOne(Cliente, { where: { id: idcliente } });
            if (!cliente) {
                throw new Error("El cliente no existe.");
            }
            // Verificar que el número de comprobante no este duplicado
            const comprobanteExistente = await queryRunner.manager.findOne(PedidoVenta, { where: { nroComprobante } });
            if (comprobanteExistente) {
                throw new Error(`El número de comprobante ${nroComprobante} ya existe. Debe ser único.`);
            }
            // Verificar que no haya productos duplicados en el detalle
            const productoIds = detalles.map((detalle) => detalle.idproducto);
            const productosDuplicados = productoIds.filter((id, index) => productoIds.indexOf(id) !== index);
            if (productosDuplicados.length > 0) {
                throw new Error(`El pedido contiene productos duplicados: ${productosDuplicados.join(", ")}`);
            }
            // Crear cabecera del pedido
            const pedido = new PedidoVenta();
            pedido.nroComprobante = nroComprobante;
            pedido.formaPago = formaPago;
            pedido.totalPedido = 0;
            pedido.cliente = cliente;
            await queryRunner.manager.save(pedido);
            // Procesar detalles del pedido
            let totalPedido = 0;
            for (const detalle of detalles) {
                const { idproducto, cantidad } = detalle;
                // Verificar que el producto exista
                const producto = await queryRunner.manager.findOne(Producto, { where: { id: idproducto } });
                if (!producto) {
                    throw new Error(`El producto con ID ${idproducto} no existe.`);
                }
                // Calcular subtotal
                const subtotal = producto.precioVenta * cantidad;
                totalPedido += subtotal;
                // Crear detalle del pedido
                const pedidoDetalle = new PedidoVentaDetalle();
                pedidoDetalle.idproducto = idproducto;
                pedidoDetalle.cantidad = cantidad;
                pedidoDetalle.subtotal = subtotal;
                pedidoDetalle.pedidoVenta = Promise.resolve(pedido);
                await queryRunner.manager.save(pedidoDetalle);
            }
            // Actualizar total del pedido
            pedido.totalPedido = totalPedido;
            await queryRunner.manager.save(pedido);
            // Confirmar transaccion
            await queryRunner.commitTransaction();
            res.status(201).json({ message: "Pedido creado exitosamente", pedido });
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            console.error("Error al crear pedido:", error);
            // Manejo del error
            if (error instanceof Error) {
                res.status(500).json({ message: "Error interno del servidor", error: error.message });
            }
            else {
                res.status(500).json({ message: "Error interno del servidor" });
            }
        }
        finally {
            await queryRunner.release();
        }
    };
    // M3todo estatico para obtener todos los pedidos
    static getAllPedidos = async (req, res) => {
        try {
            const pedidos = await AppDataSource.manager.find(PedidoVenta, {
                relations: ["cliente", "detalles", "detalles.producto"],
            });
            res.status(200).json(pedidos);
        }
        catch (error) {
            console.error("Error al obtener pedidos:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    };
    // Método para obtener un pedido por su ID
    static getPedidoById = async (req, res) => {
        const { id } = req.params;
        try {
            // Usar QueryBuilder para obtener el pedido junto con las relaciones
            const pedido = await AppDataSource.manager.createQueryBuilder(PedidoVenta, "pedido")
                .leftJoinAndSelect("pedido.cliente", "cliente")
                .leftJoinAndSelect("pedido.detalles", "detalles")
                .leftJoinAndSelect("detalles.producto", "producto")
                .where("pedido.id = :id", { id: Number(id) })
                .getOne();
            // Mostrar la consulta SQL generada
            console.log(AppDataSource.manager.createQueryBuilder(PedidoVenta, "pedido").getSql());
            // Verificar si el pedido existe
            if (!pedido) {
                res.status(404).json({ message: `El pedido con ID ${id} no fue encontrado.` });
                return;
            }
            // Consulta adicional para obtener los detalles del pedido
            const detalles = await AppDataSource.manager.find(PedidoVentaDetalle, {
                where: { pedidoVenta: { id: pedido.id } },
                relations: ["producto"],
            });
            // Asignar manualmente los detalles usando un bucle
            detalles.forEach(async (detalle) => {
                const pedidoDetalle = new PedidoVentaDetalle();
                pedidoDetalle.idproducto = detalle.idproducto;
                pedidoDetalle.cantidad = detalle.cantidad;
                pedidoDetalle.subtotal = detalle.subtotal;
                pedidoDetalle.pedidoVenta = Promise.resolve(pedido);
                // Guardar cada detalle en la base de datos
                await AppDataSource.manager.save(pedidoDetalle);
            });
            // Devolver el pedido encontrado con los detalles
            res.status(200).json({ ...pedido, detalles });
        }
        catch (error) {
            console.error("Error al obtener el pedido:", error);
            res.status(500).json({ message: "Error interno del servidor", error: error instanceof Error ? error.message : "" });
        }
    };
}