let carrito = [];

function agregarProducto(id){

    const producto =
    productos.find(
        p => p.id === id
    );

    if(
        !producto ||
        !usuarioActual ||
        producto.categoria !== usuarioActual.categoria
    ){
        return;
    }

    let item =
    carrito.find(
        p => p.id === id
    );

    if(item){

        item.cantidad++;

    }else{

        carrito.push({
            id:producto.id,
            nombre:producto.nombre,
            unidad:producto.unidad,
            cantidad:1
        });

    }

    mostrarProductos();
    actualizarCarrito();

}

function quitarProducto(id){

    let item =
    carrito.find(
        p => p.id === id
    );

    if(!item) return;

    item.cantidad--;

    if(item.cantidad <= 0){

        carrito =
        carrito.filter(
            p => p.id !== id
        );

    }

actualizarCarrito();

if(typeof renderProductosUsuario === "function"){
    renderProductosUsuario();
}

}

function obtenerCantidad(id){

    let item =
    carrito.find(
        p => p.id === id
    );

    return item ? item.cantidad : 0;
}

function actualizarCarrito(){

    let html = "";

    if(carrito.length === 0){
        html = `<p class="empty-state">Tu solicitud todavía está vacía.</p>`;
    }

    carrito.forEach(item=>{

        html += `
        <div class="cart-item">
            <span>${escaparHTML(item.nombre)}</span>
            <strong>x${item.cantidad}</strong>
        </div>
        `;
    });

    html += `
    <button onclick="enviarSolicitud()" ${carrito.length === 0 ? "disabled" : ""}>
        Enviar Solicitud
    </button>
    `;

    const contenedor = document.getElementById("carrito");

    if(contenedor){
        contenedor.innerHTML = html;
    }
}

async function enviarSolicitud(){

    if(carrito.length === 0){

        alert("No hay productos en la solicitud");
        return;
    }

    const nuevaSolicitud = {

        id:`${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uid:usuarioActual.uid || "",
        usuario:
        usuarioActual.usuario,

        categoria:
        usuarioActual.categoria,

        fecha:
        new Date().toISOString(),

        creadoEn:Date.now(),

        productos:
        [...carrito],

        estado:
        "Pendiente"

    };

    solicitudes.push(nuevaSolicitud);
    const guardado = await guardarSolicitudes(nuevaSolicitud);

    if(!guardado){
        solicitudes.pop();
        guardarEnLocalStorage("solicitudes", solicitudes);
        return;
    }
    alert(
        "Solicitud enviada correctamente"
    );

    carrito = [];

   actualizarCarrito();

if(typeof renderProductosUsuario === "function"){
    renderProductosUsuario();
}

}
