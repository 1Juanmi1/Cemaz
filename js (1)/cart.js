let carrito = [];
let observacionesSolicitud = "";
let solicitudEnviando = false;
let mensajeSolicitud = "";

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

    mensajeSolicitud = "";

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

    mensajeSolicitud = "";

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

function establecerCantidadProducto(id, valor){
    const cantidad = Number(valor);

    if(!Number.isInteger(cantidad) || cantidad < 0){
        alert("Ingresa una cantidad entera igual o mayor que cero.");
        if(typeof renderProductosUsuario === "function"){
            renderProductosUsuario();
        }
        return;
    }

    const item = carrito.find(producto => producto.id === id);
    mensajeSolicitud = "";

    if(cantidad === 0){
        carrito = carrito.filter(producto => producto.id !== id);
    }else if(item){
        item.cantidad = cantidad;
    }else{
        const producto = productos.find(producto => producto.id === id);

        if(!producto || !usuarioActual || producto.categoria !== usuarioActual.categoria){
            return;
        }

        carrito.push({
            id:producto.id,
            nombre:producto.nombre,
            unidad:producto.unidad,
            cantidad
        });
    }

    actualizarCarrito();
    if(typeof renderProductosUsuario === "function"){
        renderProductosUsuario();
    }
}

function actualizarCarrito(){

    let html = "";

    if(carrito.length === 0){
        html = `<p class="empty-state">Tu solicitud todavía está vacía.</p>`;
    }

    carrito.forEach(item=>{

        html += `
        <div class="cart-item">
            <span>${escaparHTML(item.nombre)}${item.unidad ? ` (${escaparHTML(item.unidad)})` : ""}</span>
            <strong>${item.cantidad}</strong>
        </div>
        `;
    });

    html += `
    <label for="observacionesSolicitud">Observaciones o producto faltante/nuevo</label>
    <textarea id="observacionesSolicitud" rows="3"
        placeholder="Escribe aquí si falta un producto o necesitas solicitar uno nuevo..."
        oninput="observacionesSolicitud=this.value; document.getElementById('enviarSolicitudBtn').disabled=solicitudEnviando || (carrito.length===0 && !this.value.trim())">${escaparHTML(observacionesSolicitud)}</textarea>
    <p class="muted" role="status" aria-live="polite">${escaparHTML(mensajeSolicitud)}</p>
    <button id="enviarSolicitudBtn" onclick="enviarSolicitud()" ${solicitudEnviando || (carrito.length === 0 && !observacionesSolicitud.trim()) ? "disabled" : ""}>
        ${solicitudEnviando ? "Enviando..." : "Enviar solicitud"}
    </button>
    `;

    const contenedor = document.getElementById("carrito");

    if(contenedor){
        contenedor.innerHTML = html;
    }
}

async function enviarSolicitud(){

    if(solicitudEnviando){
        return;
    }

    const observaciones = observacionesSolicitud.trim();

    if(carrito.length === 0 && !observaciones){

        mensajeSolicitud = "Agrega productos o escribe una observación antes de enviar.";
        actualizarCarrito();
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
        carrito.map(producto => ({...producto})),

        observaciones,

        estado:
        "Pendiente",

        completada:false

    };

    solicitudes.push(nuevaSolicitud);
    solicitudEnviando = true;
    mensajeSolicitud = "Enviando solicitud...";
    actualizarCarrito();

    let guardado = false;
    try{
        guardado = await guardarSolicitudes(nuevaSolicitud);
    }catch(error){
        console.error("No se pudo enviar la solicitud:", error);
    }finally{
        solicitudEnviando = false;
    }

    if(!guardado){
        solicitudes = solicitudes.filter(solicitud => solicitud.id !== nuevaSolicitud.id);
        guardarEnLocalStorage("solicitudes", solicitudes);
        mensajeSolicitud = "No se pudo enviar la solicitud. Tus productos y observaciones siguen aquí; inténtalo de nuevo.";
        actualizarCarrito();
        return;
    }

    carrito = [];
    observacionesSolicitud = "";
    mensajeSolicitud = "Solicitud enviada correctamente. Puedes seguir usando la aplicación.";

    actualizarCarrito();

    if(typeof renderProductosUsuario === "function"){
        renderProductosUsuario();
    }

}
