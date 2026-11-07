let filtrosSolicitudesActuales = {};
let seccionSolicitudesAdmin = "pendientes";

function mostrarSolicitudesAdmin(
    filtros = filtrosSolicitudesActuales,
    seccion = seccionSolicitudesAdmin
){
    filtrosSolicitudesActuales = filtros;
    seccionSolicitudesAdmin = seccion;

    const usuarioSeleccionado = filtros.usuario || "";
    const categoriaSeleccionada = filtros.categoria || "";
    const estadoSeleccionado = filtros.estado || "";
    const fechaDesde = filtros.desde || "";
    const fechaHasta = filtros.hasta || "";

    const usuariosOptions = [...new Set(solicitudes.map(s => s.usuario))]
        .sort((a, b) => a.localeCompare(b, "es"))
        .map(usuario => `<option value="${escaparHTML(usuario)}" ${usuario === usuarioSeleccionado ? "selected" : ""}>${escaparHTML(usuario)}</option>`)
        .join("");

    const categoriasOptions = [...new Set(solicitudes.map(s => s.categoria).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, "es"))
        .map(categoria => `<option value="${escaparHTML(categoria)}" ${categoria === categoriaSeleccionada ? "selected" : ""}>${escaparHTML(categoria)}</option>`)
        .join("");

    const filtrosHtml = `
        <div class="filters-grid">
            <label>Desde<input id="solicitudDesde" type="date" value="${fechaDesde}"></label>
            <label>Hasta<input id="solicitudHasta" type="date" value="${fechaHasta}"></label>
            <label>Usuario<select id="filtroUsuario">
                <option value="">Todos</option>${usuariosOptions}
            </select></label>
            <label>Categoría<select id="filtroSolicitudCategoria">
                <option value="">Todas</option>${categoriasOptions}
            </select></label>
            <label>Estado<select id="filtroSolicitudEstado">
                <option value="">Todos</option>
                ${["Pendiente", "Comprado", "Comprado Más", "Comprado Menos", "No Comprado"]
                    .map(estado => `<option ${estado === estadoSeleccionado ? "selected" : ""}>${estado}</option>`).join("")}
            </select></label>
            <button onclick="filtrarSolicitudesAdmin()">Aplicar filtros</button>
        </div>
    `;

    const solicitudesOrdenadas = solicitudes
        .map((solicitud, indiceOriginal) => ({ solicitud, indiceOriginal }))
        .filter(({ solicitud }) =>
            seccion === "completas"
                ? solicitudEstaCompletada(solicitud)
                : !solicitudEstaCompletada(solicitud)
        )
        .sort((a, b) => obtenerFechaSolicitud(b.solicitud) - obtenerFechaSolicitud(a.solicitud))
        .filter(({ solicitud }) => {
            const fecha = obtenerFechaSolicitud(solicitud);
            const fechaLocal = fecha ? new Date(fecha) : null;
            const fechaISO = fechaLocal
                ? `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, "0")}-${String(fechaLocal.getDate()).padStart(2, "0")}`
                : "";
            const estadoProducto = (solicitud.productos || []).some(producto =>
                (producto.estado || "Pendiente") === estadoSeleccionado
            );

            return (!usuarioSeleccionado || solicitud.usuario === usuarioSeleccionado) &&
                (!categoriaSeleccionada || solicitud.categoria === categoriaSeleccionada) &&
                (!estadoSeleccionado || solicitud.estado === estadoSeleccionado || estadoProducto) &&
                (!fechaDesde || fechaISO >= fechaDesde) &&
                (!fechaHasta || fechaISO <= fechaHasta);
        });

    let html = `
        <h2>📋 Solicitudes</h2>
        <div class="request-tabs" role="tablist" aria-label="Sección de solicitudes">
            <button class="${seccion === "pendientes" ? "active" : ""}"
                onclick="cambiarSeccionSolicitudes('pendientes')">
                Pendientes (${solicitudes.filter(s => !solicitudEstaCompletada(s)).length})
            </button>
            <button class="${seccion === "completas" ? "active" : ""}"
                onclick="cambiarSeccionSolicitudes('completas')">
                Completas (${solicitudes.filter(s => solicitudEstaCompletada(s)).length})
            </button>
        </div>
        ${filtrosHtml}
        <p class="muted">${solicitudesOrdenadas.length} solicitudes</p>
        <hr>
    `;

    solicitudesOrdenadas.forEach(({ solicitud, indiceOriginal }) => {
        const fecha = obtenerFechaSolicitud(solicitud);

        html += `
            <article class="producto-card request-card">
                <h3>${escaparHTML(solicitud.usuario)}</h3>
                <p>${escaparHTML(solicitud.categoria || "Sin categoría")}</p>
                <p>${fecha ? new Date(fecha).toLocaleString("es") : escaparHTML(solicitud.fecha || "Fecha desconocida")}</p>
                <p>Estado general: <strong>${escaparHTML(solicitud.estado || "Pendiente")}</strong></p>
                ${solicitud.observaciones
                    ? `<p class="request-observation"><strong>Observaciones / producto faltante:</strong><br>${escaparHTML(solicitud.observaciones)}</p>`
                    : ""}
        `;

        (solicitud.productos || []).forEach(producto => {
            const estado = producto.estado || "Pendiente";
            const unidad = producto.unidad
                ? ` (${escaparHTML(producto.unidad)})`
                : "";

            html += `
                <div class="request-product">
                    <strong>${escaparHTML(producto.nombre)}${unidad}</strong> x${Number(producto.cantidad) || 0}
                    <label>Estado
                        <select onchange="cambiarEstadoProducto(${indiceOriginal}, ${producto.id}, this.value)">
                            ${["Pendiente", "Comprado", "Comprado Más", "Comprado Menos", "No Comprado"]
                                .map(opcion => `<option ${estado === opcion ? "selected" : ""}>${opcion}</option>`).join("")}
                        </select>
                    </label>
                    <label>Observación
                        <textarea rows="2" placeholder="Añadir observación..."
                            onchange="guardarObservacionProducto(${indiceOriginal}, ${producto.id}, this.value)">${escaparHTML(producto.observacion || "")}</textarea>
                    </label>
                </div>
            `;
        });

        if(seccion === "pendientes"){
            html += `<button onclick="compraCompleta(${indiceOriginal})">✅ Completar solicitud</button>`;
        }

        html += `</article>`;
    });

    document.getElementById("listaProductos").innerHTML = `
        <div id="panelSolicitudes">${html}</div>
    `;
}

function solicitudEstaCompletada(solicitud){
    return solicitud.completada === true || solicitud.estado === "Comprado";
}

function cambiarSeccionSolicitudes(seccion){
    mostrarSolicitudesAdmin(filtrosSolicitudesActuales, seccion);
}

function obtenerFechaSolicitud(solicitud){
    const fechaGuardada = Number(solicitud.creadoEn);

    if(Number.isFinite(fechaGuardada) && fechaGuardada > 0){
        return fechaGuardada;
    }

    const fechaTexto = solicitud.fecha || "";
    const fechaISO = Date.parse(fechaTexto);

    if(!Number.isNaN(fechaISO)){
        return fechaISO;
    }

    const partes = fechaTexto.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,\s*(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
    );

    if(!partes){
        return 0;
    }

    const primero = Number(partes[1]);
    const segundo = Number(partes[2]);
    const mes = segundo > 12 ? primero : segundo;
    const dia = segundo > 12 ? segundo : primero;
    let hora = Number(partes[4] || 0);
    const sufijo = (partes[7] || "").toUpperCase();

    if(sufijo === "PM" && hora < 12){
        hora += 12;
    }else if(sufijo === "AM" && hora === 12){
        hora = 0;
    }

    const fecha = new Date(
        Number(partes[3]),
        mes - 1,
        dia,
        hora,
        Number(partes[5] || 0),
        Number(partes[6] || 0)
    ).getTime();

    return Number.isNaN(fecha) ? 0 : fecha;
}

function filtrarSolicitudesAdmin(){
    mostrarSolicitudesAdmin({
        desde:document.getElementById("solicitudDesde").value,
        hasta:document.getElementById("solicitudHasta").value,
        usuario:document.getElementById("filtroUsuario").value,
        categoria:document.getElementById("filtroSolicitudCategoria").value,
        estado:document.getElementById("filtroSolicitudEstado").value
    });
}

function guardarObservacionProducto(solicitudIndex, productoId, observacion){
    const producto = solicitudes[solicitudIndex]?.productos.find(item => item.id === productoId);

    if(!producto){
        return;
    }

    producto.observacion = observacion.trim();
    guardarSolicitudes(solicitudes[solicitudIndex]);
}

async function compraCompleta(index){
    const solicitud = solicitudes[index];

    if(!solicitud){
        return;
    }

    const estadoAnterior = solicitud.estado;
    const completadaAnterior = solicitud.completada;
    solicitud.completada = true;
    solicitud.estado = "Completada";

    const guardado = await guardarSolicitudes(solicitud);

    if(!guardado){
        solicitud.completada = completadaAnterior;
        solicitud.estado = estadoAnterior;
        mostrarSolicitudesAdmin(filtrosSolicitudesActuales, "pendientes");
        return;
    }

    mostrarSolicitudesAdmin(filtrosSolicitudesActuales, "pendientes");

}

function cambiarEstadoProducto(
    solicitudIndex,
    productoId,
    nuevoEstado
){

    let producto =
    solicitudes[
        solicitudIndex
    ].productos.find(
        p => p.id === productoId
    );

    if(producto){

        producto.estado =
        nuevoEstado;

    }

    guardarSolicitudes(solicitudes[solicitudIndex]);

}

function obtenerRangoSemanaActual(){
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const diaSemana = (inicio.getDay() + 6) % 7;
    inicio.setDate(inicio.getDate() - diaSemana);

    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + 7);

    return {inicio, fin};
}

function mostrarResumenSemanal(){
    const {inicio, fin} = obtenerRangoSemanaActual();
    const resumen = {
        "Comprados":new Map(),
        "No Comprados":new Map(),
        "Pendientes":new Map()
    };

    solicitudes.forEach(solicitud => {
        const fechaSolicitud = obtenerFechaSolicitud(solicitud);

        if(fechaSolicitud < inicio.getTime() || fechaSolicitud >= fin.getTime()){
            return;
        }

        (solicitud.productos || []).forEach(producto => {
            const estadoOriginal = producto.estado ||
                "Pendiente";
            const grupo = estadoOriginal === "No Comprado"
                ? "No Comprados"
                : estadoOriginal === "Pendiente"
                    ? "Pendientes"
                    : "Comprados";
            const unidad = producto.unidad || "";
            const clave = `${producto.nombre}\u0000${unidad}`;
            const existente = resumen[grupo].get(clave);

            if(existente){
                existente.cantidad += Number(producto.cantidad) || 0;
            }else{
                resumen[grupo].set(clave, {
                    nombre:producto.nombre || "Producto sin nombre",
                    unidad,
                    cantidad:Number(producto.cantidad) || 0
                });
            }
        });
    });

    const fechaFinVisible = new Date(fin);
    fechaFinVisible.setDate(fechaFinVisible.getDate() - 1);
    const fechaRango = `${inicio.toLocaleDateString("es")} – ${fechaFinVisible.toLocaleDateString("es")}`;
    const gruposHtml = Object.entries(resumen).map(([estado, productosPorEstado]) => {
        const productosOrdenados = [...productosPorEstado.values()]
            .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
        const filas = productosOrdenados.length
            ? productosOrdenados.map(producto => `
                <li>
                    <span>${escaparHTML(producto.nombre)}${producto.unidad ? ` (${escaparHTML(producto.unidad)})` : ""}</span>
                    <strong>${producto.cantidad}</strong>
                </li>
            `).join("")
            : `<li class="muted">Sin productos esta semana.</li>`;

        return `
            <article class="producto-card weekly-status">
                <h3>${estado}</h3>
                <ul>${filas}</ul>
            </article>
        `;
    }).join("");

    document.getElementById("listaProductos").innerHTML = `
        <h2>📅 Resumen semanal</h2>
        <p class="muted">Semana del ${escaparHTML(fechaRango)} · Cantidades agrupadas por producto y unidad.</p>
        <div class="cards weekly-summary">${gruposHtml}</div>
    `;
}

function mostrarGraficaProductosMasPedidos(){
    if(usuarioActual?.rol !== "admin"){
        return;
    }

    const cantidadesPorProducto = new Map();

    solicitudes.forEach(solicitud => {
        (solicitud.productos || []).forEach(producto => {
            const nombre = producto.nombre || "Producto sin nombre";
            const unidad = producto.unidad || "";
            const clave = `${nombre}\u0000${unidad}`;
            const cantidad = Number(producto.cantidad);

            if(!Number.isFinite(cantidad) || cantidad <= 0){
                return;
            }

            const existente = cantidadesPorProducto.get(clave);
            if(existente){
                existente.cantidad += cantidad;
            }else{
                cantidadesPorProducto.set(clave, {nombre, unidad, cantidad});
            }
        });
    });

    const masPedidos = [...cantidadesPorProducto.values()]
        .sort((a, b) =>
            b.cantidad - a.cantidad ||
            a.nombre.localeCompare(b.nombre, "es")
        )
        .slice(0, 10);
    const maximo = masPedidos[0]?.cantidad || 0;
    const barras = masPedidos.length
        ? masPedidos.map(producto => {
            const porcentaje = Math.max(2, (producto.cantidad / maximo) * 100);
            const etiqueta = `${producto.nombre}${producto.unidad ? ` (${producto.unidad})` : ""}`;

            return `
                <li class="popular-chart-row">
                    <span class="popular-chart-label">${escaparHTML(etiqueta)}</span>
                    <div class="popular-chart-track" role="img"
                        aria-label="${escaparHTML(etiqueta)}: ${producto.cantidad}">
                        <span class="popular-chart-bar" style="width:${porcentaje}%"></span>
                    </div>
                    <strong>${producto.cantidad}</strong>
                </li>
            `;
        }).join("")
        : `<li class="empty-state">Todavía no hay productos solicitados.</li>`;

    document.getElementById("listaProductos").innerHTML = `
        <h2>📈 Productos más pedidos</h2>
        <p class="muted">Top 10 por cantidad solicitada en todo el historial, sin importar el estado.</p>
        <ol class="popular-chart">${barras}</ol>
    `;
}

function mostrarPanelProductos(){

const categoriaOptions = categorias.map(categoria =>
    `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`
).join("");

const categoriaFiltroOptions = `
    <option value="">Todas</option>
    ${categoriaOptions}
`;

const unidadOptions = unidades.map(unidad =>
    `<option value="${escaparHTML(unidad)}">${escaparHTML(unidad)}</option>`
).join("");

const subcategoriaOptions = [...new Set(
    productos.map(producto => producto.subcategoria).filter(Boolean)
)].sort((a, b) => a.localeCompare(b, "es")).map(subcategoria =>
    `<option value="${escaparHTML(subcategoria)}">${escaparHTML(subcategoria)}</option>`
).join("");

let html = `

<h2>📦 Administrar Productos</h2>

<p class="muted">Catálogo de Cemaz cargado con precios pendientes.</p>

<button onclick="mostrarConfiguracion()">
⚙ Configuración
</button>

<hr>

<h3>➕ Nuevo Producto</h3>

<input
id="nuevoNombre"
placeholder="Nombre">

<input
id="nuevoPrecio"
type="number"
placeholder="Precio"
min="0"
step="0.01">

<input
id="nuevaSubcategoria"
placeholder="Subcategoría">

<select id="nuevaUnidad">

<option value="">Unidad</option>
${unidadOptions}

</select>

<select id="nuevaCategoria">

<option value="">Categoría</option>
${categoriaOptions}

</select>

<button onclick="crearProducto()">
Guardar Producto
</button>

<hr>

<h3>🔍 Buscar</h3>

<input
id="buscarProducto"
placeholder="Buscar..."
oninput="filtrarProductos()">

<select
id="filtroCategoria"
onchange="filtrarProductos()">

${categoriaFiltroOptions}

</select>

<select
id="filtroSubcategoria"
onchange="filtrarProductos()">

<option value="">Todas las subcategorías</option>
${subcategoriaOptions}

</select>

<hr>

<div id="contenedorProductos">

</div>

`;

document.getElementById(
"listaProductos"
).innerHTML = html;

renderProductos();

}
function mostrarConfiguracion(){

let html = `

<h2>
⚙ Configuración
</h2>

<h3>
Nueva Categoría
</h3>

<input
id="nuevaCategoriaNombre"
placeholder="Categoría">

<button
onclick="crearCategoria()">

Agregar Categoría

</button>

<hr>

<h3>
Nueva Unidad
</h3>

<input
id="nuevaUnidadNombre"
placeholder="Unidad">

<button
onclick="crearUnidad()">

Agregar Unidad

</button>

<hr>

<h3>
Categorías Actuales
</h3>

`;

categorias.forEach(cat=>{

html += `
<p>${cat}</p>
`;

});

html += `

<hr>

<h3>
Unidades Actuales
</h3>

`;

unidades.forEach(unidad=>{

html += `
<p>${unidad}</p>
`;

});

document.getElementById(
"listaProductos"
).innerHTML = html;

}

async function crearCategoria(){

const nombre =
document.getElementById(
"nuevaCategoriaNombre"
).value.trim();

if(!nombre)return;

if(categorias.includes(nombre)){
    alert("Esa categoría ya existe.");
    return;
}

categorias.push(nombre);

if(!await guardarCategorias()){
    categorias.pop();
    localStorage.setItem("categorias", JSON.stringify(categorias));
    mostrarConfiguracion();
    return;
}

mostrarConfiguracion();

}

async function crearUnidad(){

const nombre =
document.getElementById(
"nuevaUnidadNombre"
).value.trim();

if(!nombre)return;

if(unidades.some(unidad => unidad.toLocaleLowerCase() === nombre.toLocaleLowerCase())){
    alert("Esa unidad ya existe.");
    return;
}

unidades.push(nombre);

if(!await guardarUnidades()){
    unidades.pop();
    localStorage.setItem("unidades", JSON.stringify(unidades));
    mostrarConfiguracion();
    return;
}

mostrarConfiguracion();

}
function mostrarUsuarios(){

const categoriasOptions = categorias.map(categoria =>
    `<option value="${escaparHTML(categoria)}">${escaparHTML(categoria)}</option>`
).join("");

let html = `<h2>👥 Gestión de Usuarios</h2>`;

if(firebaseEstaConfigurado()){
    html += `
        <p class="muted">
            Crea las cuentas en Firebase Authentication y luego agrega su perfil en
            <code>users/{UID}</code> en Firestore. Cemaz nunca almacena contraseñas en Firestore.
        </p>
    `;
}else{
    html += `
        <div class="producto-card">
            <h3>➕ Crear usuario local de prueba</h3>
            <input id="nuevoUsuario" placeholder="Usuario">
            <input id="nuevoPassword" type="password" placeholder="Contraseña local">
            <select id="categoriaUsuario">${categoriasOptions}</select>
            <button onclick="crearUsuario()">Crear usuario local</button>
        </div>
    `;
}

usuarios.forEach((usuario,index)=>{

html += `

<div class="producto-card">

<h3>${escaparHTML(usuario.usuario)}</h3>
${usuario.email ? `<p>${escaparHTML(usuario.email)}</p>` : ""}
<p><strong>Rol:</strong> ${escaparHTML(usuario.rol)}</p>
<p><strong>Categoría:</strong> ${escaparHTML(usuario.categoria || "Administrador")}</p>
<p><strong>Estado:</strong> ${usuario.activo ? "✅ Activo" : "❌ Desactivado"}</p>
<p><strong>Solicitudes:</strong> ${Number(usuario.solicitudes) || 0}</p>
<p><strong>Creado:</strong> ${escaparHTML(usuario.fechaCreacion || "Desconocido")}</p>
${usuario.ultimoAcceso ? `<p><strong>Último acceso:</strong> ${escaparHTML(usuario.ultimoAcceso)}</p>` : ""}

`;

if((usuarioActual.uid && usuario.uid !== usuarioActual.uid) ||
   (!usuarioActual.uid && usuario.usuario !== "admin")){

html += `

<button
onclick="editarUsuario(${index})">

✏ Editar

</button>

<button
onclick="toggleUsuario(${index})">

${usuario.activo ? "⛔ Desactivar" : "✅ Activar"}

</button>

${firebaseEstaConfigurado() ? "" : `<button
onclick="eliminarUsuario(${index})">

🗑 Eliminar

</button>`}

`;

}


html += `

</div>

`;

});

document.getElementById(
"listaProductos"
).innerHTML = html;

}

function eliminarUsuario(index){

if(firebaseEstaConfigurado()){
    alert("Para eliminar una cuenta definitivamente, elimínala en Firebase Authentication y borra su perfil de Firestore. Puedes desactivarla aquí mientras tanto.");
    return;
}

if(
usuarios[index].usuario ===
"admin"
){

return;

}

usuarios.splice(index,1);

guardarUsuarios();

mostrarUsuarios();

}
function crearUsuario(){

    if(firebaseEstaConfigurado()){
        alert("Crea primero la cuenta en Firebase Authentication. Después crea el documento users/{UID} en Firestore con rol, categoría y activo. Consulta FIREBASE_SETUP.md.");
        return;
    }

    const usuario =
    document.getElementById(
        "nuevoUsuario"
    ).value.trim();

    const password =
    document.getElementById(
        "nuevoPassword"
    ).value.trim();

    const categoria =
    document.getElementById(
        "categoriaUsuario"
    ).value;

    if(!usuario || !password){

        alert(
            "Complete todos los campos"
        );

        return;
    }

    const existe =
    usuarios.find(
        u => u.usuario === usuario
    );

    if(existe){

        alert(
            "El usuario ya existe"
        );

        return;
    }

    usuarios.push({

        usuario:usuario,

        password:password,

        rol:"usuario",

        categoria:categoria,

        activo:true,

        fechaCreacion:
        new Date().toLocaleDateString(),

        ultimoAcceso:"Nunca",

        solicitudes:0

    });

    guardarUsuarios();

    alert(
"✅ Usuario creado correctamente"
);

mostrarUsuarios();

}
function toggleUsuario(index){

if(
usuarios[index].usuario ===
"admin"
){

return;

}

usuarios[index].activo =
!usuarios[index].activo;

guardarUsuarios();

mostrarUsuarios();

}
function editarUsuario(index){

const categoriasUsuarioOptions = categorias.map(cat =>
    `<option value="${escaparHTML(cat)}" ${usuarios[index].categoria === cat ? "selected" : ""}>${escaparHTML(cat)}</option>`
).join("");

document.getElementById(
"listaProductos"
).innerHTML = `

<div class="producto-card">

<h2>
✏ Editar Usuario
</h2>

<input
id="editarUsuarioNombre"
value="${escaparHTML(usuarios[index].usuario)}">

<select
id="editarCategoria">

${categoriasUsuarioOptions}

</select>

<button
onclick="guardarUsuario(${index})">

💾 Guardar

</button>

<button
onclick="mostrarUsuarios()">

❌ Cancelar

</button>

</div>

`;

}

function guardarUsuario(index){

usuarios[index].usuario =
document.getElementById("editarUsuarioNombre").value.trim();

usuarios[index].categoria =
document.getElementById("editarCategoria").value;

guardarUsuarios();

alert(
"✅ Usuario actualizado"
);

mostrarUsuarios();

}
function renderProductos(){
    renderListadoProductos(productos);
}

function filtrarProductos(){

    const texto = document.getElementById("buscarProducto").value.trim().toLocaleLowerCase();
    const categoria = document.getElementById("filtroCategoria").value;
    const subcategoria = document.getElementById("filtroSubcategoria").value;
    const filtrados = productos.filter(producto =>
        producto.nombre.toLocaleLowerCase().includes(texto) &&
        (!categoria || producto.categoria === categoria) &&
        (!subcategoria || producto.subcategoria === subcategoria)
    );

    renderListadoProductos(filtrados);
}

function renderListadoProductos(lista){
    const contenedor = document.getElementById("contenedorProductos");

    if(!contenedor){
        return;
    }

    if(lista.length === 0){
        contenedor.innerHTML = `<p class="empty-state">No se encontraron productos.</p>`;
        return;
    }

    contenedor.innerHTML = lista.map(producto => `
        <article class="producto-card">
            <h3>${escaparHTML(producto.nombre)}</h3>
            <p>${Number.isFinite(Number(producto.precio)) && producto.precio !== null && producto.precio !== ""
                ? `💰 Q${Number(producto.precio).toFixed(2)}`
                : "Precio pendiente"}</p>
            <p>📦 ${escaparHTML(producto.unidad || "-")}</p>
            <p>📂 ${escaparHTML(producto.categoria || "-")}</p>
            <p>📁 ${escaparHTML(producto.subcategoria || "-")}</p>
            <button onclick="editarProducto(${producto.id})">✏ Editar</button>
            <button onclick="eliminarProducto(${producto.id})">🗑 Eliminar</button>
        </article>
    `).join("");
}

async function crearProducto(){
    const nombre = document.getElementById("nuevoNombre").value.trim();
    const precioTexto = document.getElementById("nuevoPrecio").value.trim();
    const precio = precioTexto === "" ? null : Number(precioTexto);
    const unidad = document.getElementById("nuevaUnidad").value;
    const categoria = document.getElementById("nuevaCategoria").value;
    const subcategoria = document.getElementById("nuevaSubcategoria").value.trim();

    if(!nombre || (precio !== null && (!Number.isFinite(precio) || precio < 0)) || !unidad || !categoria){
        alert("Ingresa nombre, una categoría y una unidad. El precio es opcional.");
        return;
    }

    const nuevoProducto = {
        id:Date.now() + Math.random(),
        nombre,
        precio,
        categoria,
        subcategoria,
        unidad
    };
    productos.push(nuevoProducto);

    if(!await guardarProductos()){
        productos = productos.filter(producto => producto.id !== nuevoProducto.id);
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarPanelProductos();
        return;
    }
    mostrarPanelProductos();
}

function editarProducto(id){
    const producto = productos.find(item => item.id === id);

    if(!producto){
        return;
    }

    const categoriaOptions = categorias.map(categoria =>
        `<option value="${escaparHTML(categoria)}" ${producto.categoria === categoria ? "selected" : ""}>${escaparHTML(categoria)}</option>`
    ).join("");

    const unidadOptions = unidades.map(unidad =>
        `<option value="${escaparHTML(unidad)}" ${producto.unidad === unidad ? "selected" : ""}>${escaparHTML(unidad)}</option>`
    ).join("");

    document.getElementById("contenedorProductos").innerHTML = `
        <form class="producto-card" onsubmit="guardarEdicionProducto(event, ${id})">
            <h3>Editar producto</h3>
            <label>Nombre<input id="editarProductoNombre" value="${escaparHTML(producto.nombre)}" required></label>
            <label>Precio<input id="editarProductoPrecio" type="number" min="0" step="0.01"
                value="${producto.precio ?? ""}" placeholder="Pendiente"></label>
            <label>Categoría<select id="editarProductoCategoria" required>${categoriaOptions}</select></label>
            <label>Subcategoría<input id="editarProductoSubcategoria"
                value="${escaparHTML(producto.subcategoria || "")}"></label>
            <label>Unidad<select id="editarProductoUnidad" required>${unidadOptions}</select></label>
            <button type="submit">Guardar cambios</button>
            <button type="button" onclick="mostrarPanelProductos()">Cancelar</button>
        </form>
    `;
}

async function guardarEdicionProducto(event, id){
    event.preventDefault();
    const producto = productos.find(item => item.id === id);

    if(!producto){
        return;
    }

    const nombre = document.getElementById("editarProductoNombre").value.trim();
    const precioTexto = document.getElementById("editarProductoPrecio").value.trim();
    const precio = precioTexto === "" ? null : Number(precioTexto);

    if(!nombre || (precio !== null && (!Number.isFinite(precio) || precio < 0))){
        alert("Ingresa un nombre y un precio válido, o deja el precio vacío.");
        return;
    }

    const copiaAnterior = {...producto};
    producto.nombre = nombre;
    producto.precio = precio;
    producto.categoria = document.getElementById("editarProductoCategoria").value;
    producto.subcategoria = document.getElementById("editarProductoSubcategoria").value.trim();
    producto.unidad = document.getElementById("editarProductoUnidad").value;

    if(!await guardarProductos()){
        Object.assign(producto, copiaAnterior);
        localStorage.setItem("productos", JSON.stringify(productos));
        editarProducto(id);
        return;
    }
    mostrarPanelProductos();
}

async function eliminarProducto(id){
    const indice = productos.findIndex(producto => producto.id === id);

    if(indice === -1){
        return;
    }

    if(!confirm(`¿Eliminar "${productos[indice].nombre}"?`)){
        return;
    }

    const [productoEliminado] = productos.splice(indice, 1);
    if(!await guardarProductos([id])){
        productos.splice(indice, 0, productoEliminado);
        localStorage.setItem("productos", JSON.stringify(productos));
        mostrarPanelProductos();
        return;
    }
    mostrarPanelProductos();
}