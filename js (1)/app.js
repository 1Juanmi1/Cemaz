function mostrarLogin() {

    document.getElementById("app").innerHTML = `

    <div class="login-container">

        <h1>☕ Cemaz</h1>

        <input
            type="text"
            id="usuario"
            placeholder="${firebaseEstaConfigurado() ? "Usuario o correo electrónico" : "Usuario (modo local)"}"
            autocomplete="username">

        <input
            type="password"
            id="password"
            placeholder="Contraseña"
            autocomplete="current-password">

        <button onclick="login()">

            Ingresar

        </button>

        <p class="muted" role="status">
            ${firebaseEstaConfigurado()
                ? "Ingresa tu usuario y contraseña. El administrador puede usar su correo."
                : "Modo local: las cuentas y solicitudes no se sincronizan entre dispositivos."}
        </p>

    </div>

    `;

}

function mostrarSistema() {

    let html = `

    <div class="contenedor">

    `;

    if(usuarioActual.rol === "admin"){

        html += `

        <div class="sidebar">

            <h2>
                ☕ CEMAZ
            </h2>

            <button onclick="mostrarDashboard()">
                📊 Dashboard
            </button>

            <button onclick="mostrarSolicitudesAdmin()">
                📋 Solicitudes
            </button>

            <button onclick="mostrarPanelProductos()">
                📦 Productos
            </button>

            <button onclick="mostrarUsuarios()">
                👥 Usuarios
            </button>

            <button onclick="mostrarConfiguracion()">
                ⚙ Configuración
            </button>

            <button onclick="cerrarSesion()">
                🚪 Cerrar Sesión
            </button>

        </div>

        <div class="main">

            <div class="topbar">

                <h2>
                    Bienvenido ${escaparHTML(usuarioActual.usuario)}
                </h2>

            </div>

            <div id="listaProductos">

            </div>

        </div>

        `;

    } else {

        html += `

        <div class="main main-user">

            <div class="topbar">

                <h2>
                    ${escaparHTML(usuarioActual.usuario)}
                </h2>

                <button onclick="cerrarSesion()">

                    🚪 Salir

                </button>

            </div>

            <h2>

                Categoría:

                ${escaparHTML(usuarioActual.categoria)}

            </h2>

            <div class="layout">

                <div id="listaProductos">

                </div>

                <div class="panelCarrito">

                    <h2>
                        🛒 Mi Solicitud
                    </h2>

                    <div id="carrito">

                    </div>

                </div>

            </div>

        </div>

        `;

    }

    html += `

    </div>

    `;

    document.getElementById(
        "app"
    ).innerHTML = html;

    if(usuarioActual.rol === "admin"){

        mostrarDashboard();

    }else{

        mostrarProductos();

        actualizarCarrito();

    }

}

function mostrarDashboard(){

    const totalUsuarios =
    usuarios.length;

    const totalProductos =
    productos.length;

    const totalSolicitudes = solicitudes.length;

    const totalCategorias =
    categorias.length;

    document.getElementById(
        "listaProductos"
    ).innerHTML = `

    <h2>
    📊 Dashboard
    </h2>

    <div class="cards">

        <div class="producto-card">

            <h3>
                👥 Usuarios
            </h3>

            <h1>
                ${totalUsuarios}
            </h1>

        </div>

        <div class="producto-card">

            <h3>
                📦 Productos
            </h3>

            <h1>
                ${totalProductos}
            </h1>

        </div>

        <div class="producto-card">

            <h3>
                📋 Solicitudes
            </h3>

            <h1>
                ${totalSolicitudes}
            </h1>

        </div>

        <div class="producto-card">

            <h3>
                ⚙ Categorías
            </h3>

            <h1>
                ${totalCategorias}
            </h1>

        </div>

    </div>

    `;

}

function mostrarProductos() {
    renderCatalogoUsuario();
}
function renderProductosUsuario(){
    renderCatalogoUsuario();
}
function filtrarProductosUsuario(){
    renderCatalogoUsuario(true);
}

function escaparHTML(valor){
    return String(valor ?? "").replace(/[&<>"']/g, caracter => ({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#39;"
    })[caracter]);
}

function renderCatalogoUsuario(restaurarFoco = false){

    const contenedor = document.getElementById("listaProductos");

    if(!contenedor || !usuarioActual){
        return;
    }

    const texto = (
        document.getElementById("buscarUsuario")?.value || ""
    ).trim().toLocaleLowerCase();

    const productosVisibles = productos.filter(producto =>
        producto.categoria === usuarioActual.categoria &&
        producto.nombre.toLocaleLowerCase().includes(texto)
    );

    const grupos = productosVisibles.reduce((resultado, producto) => {
        const subcategoria = producto.subcategoria || "Otros";
        (resultado[subcategoria] ||= []).push(producto);
        return resultado;
    }, Object.create(null));

    let html = `
        <h2>🛒 Catálogo</h2>
        <input
            id="buscarUsuario"
            placeholder="🔍 Buscar producto..."
        value="${escaparHTML(texto)}"
            oninput="filtrarProductosUsuario()"
            aria-label="Buscar productos">
    `;

    const nombresGrupos = Object.keys(grupos).sort((a, b) =>
        a.localeCompare(b, "es")
    );

    if(nombresGrupos.length === 0){
        html += `<p class="empty-state">No hay productos disponibles para tu categoría.</p>`;
    }

    nombresGrupos.forEach((subcategoria, index) => {
        html += `
            <details class="catalog-group" ${index === 0 ? "open" : ""}>
                <summary>${escaparHTML(subcategoria)} <span>${grupos[subcategoria].length}</span></summary>
                <div class="cards">
        `;

        grupos[subcategoria].forEach(producto => {
            html += `
                <article class="producto-card">
                    <h3>${escaparHTML(producto.nombre)}</h3>
                    <p>📦 ${escaparHTML(producto.unidad || "-")}</p>
                    <div class="cantidad">
                        <button aria-label="Quitar ${escaparHTML(producto.nombre)}"
                            onclick="quitarProducto(${producto.id})">−</button>
                        <span>${obtenerCantidad(producto.id)}</span>
                        <button aria-label="Agregar ${escaparHTML(producto.nombre)}"
                            onclick="agregarProducto(${producto.id})">+</button>
                    </div>
                </article>
            `;
        });

        html += `</div></details>`;
    });

    contenedor.innerHTML = html;

    if(restaurarFoco){
        const campoBusqueda = document.getElementById("buscarUsuario");
        campoBusqueda.focus();
        campoBusqueda.setSelectionRange(texto.length, texto.length);
    }
}

async function cerrarSesion(){
    try{
        await cerrarSesionFirebase();
    }catch(error){
        reportarErrorFirebase("cerrar sesión", error);
    }

    usuarioActual = null;
    solicitudes = [];
    carrito = [];
    mostrarLogin();
}

mostrarLogin();
