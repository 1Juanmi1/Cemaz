let firebaseApp = null;
let firebaseAuthService = null;
let firestoreDb = null;
let firebaseDisponible = false;
let solicitudes = JSON.parse(localStorage.getItem("solicitudes")) || [];
let unsubscribeSolicitudes = null;

function firebaseEstaConfigurado(){
    return Boolean(
        CEMAZ_FIREBASE_CONFIG.apiKey &&
        CEMAZ_FIREBASE_CONFIG.authDomain &&
        CEMAZ_FIREBASE_CONFIG.projectId &&
        CEMAZ_FIREBASE_CONFIG.appId
    );
}

if(firebaseEstaConfigurado() && typeof firebase !== "undefined"){
    firebaseApp = firebase.initializeApp(CEMAZ_FIREBASE_CONFIG);
    firebaseAuthService = firebase.auth();
    firestoreDb = firebase.firestore();
    firebaseDisponible = true;
}

function reportarErrorFirebase(operacion, error, mostrarAlerta = true){
    console.error(`Error de Firebase (${operacion}):`, error);

    const mensaje = error?.code === "permission-denied"
        ? operacion === "guardar solicitudes"
            ? `Firestore rechazó ${operacion}. Verifica las reglas publicadas y que el perfil tenga UID, usuario, categoría y activo: true.`
            : `Firestore rechazó ${operacion}. Verifica que las reglas actuales estén publicadas en el proyecto correcto y que el perfil tenga rol: "admin" y activo: true.`
        : `No se pudo ${operacion} en Firebase. Revisa tu conexión e inténtalo de nuevo.`;

    if(mostrarAlerta){
        alert(mensaje);
    }

    return mensaje;
}

function guardarEnLocalStorage(clave, valor){
    localStorage.setItem(clave, JSON.stringify(valor));
}

function diagnosticarOperacionFirestore(operacion, consulta){
    return consulta.catch(error => {
        console.error(`Error en Firestore (${operacion}):`, error);

        const detalle = error?.code === "permission-denied"
            ? `Firestore denegó ${operacion}. Revisa las reglas de esa colección.`
            : `Falló ${operacion}: ${error.message || "error desconocido de Firestore"}`;
        const errorConContexto = new Error(detalle);
        errorConContexto.code = error?.code;
        throw errorConContexto;
    });
}

async function cargarDatosFirebase(perfil){
    const esAdmin = perfil.rol === "admin";
    const consultaProductos = diagnosticarOperacionFirestore(
        "leer la colección 'products'",
        esAdmin
            ? firestoreDb.collection("products").get()
            : firestoreDb.collection("products")
                .where("categoria", "==", perfil.categoria)
                .get()
    );
    const consultaUsuarios = diagnosticarOperacionFirestore(
        esAdmin
            ? "leer la colección 'users'"
            : "leer el perfil en 'users'",
        esAdmin
            ? firestoreDb.collection("users").get()
            : firestoreDb.collection("users").doc(perfil.uid).get()
    );
    const consultaSolicitudes = diagnosticarOperacionFirestore(
        "leer la colección 'requests'",
        esAdmin
            ? firestoreDb.collection("requests").get()
            : firestoreDb.collection("requests")
                .where("uid", "==", perfil.uid)
                .get()
    );
    const consultaConfiguracion = diagnosticarOperacionFirestore(
        "leer el documento 'settings/catalog'",
        firestoreDb.collection("settings").doc("catalog").get()
    );
    const [productosSnapshot, usuariosSnapshot, solicitudesSnapshot, settingsSnapshot] =
        await Promise.all([
            consultaProductos,
            consultaUsuarios,
            consultaSolicitudes,
            consultaConfiguracion
        ]);

    if(esAdmin && productosSnapshot.empty){
        const catalogoLocal = JSON.parse(localStorage.getItem("productos")) || [];
        const lote = firestoreDb.batch();

        catalogoLocal.forEach(producto => {
            lote.set(
                firestoreDb.collection("products").doc(String(producto.id)),
                producto
            );
        });

        if(catalogoLocal.length > 0){
            await diagnosticarOperacionFirestore(
                "guardar el catálogo inicial en 'products'",
                lote.commit()
            );
        }
    }

    productos = productosSnapshot.empty && esAdmin
        ? JSON.parse(localStorage.getItem("productos")) || []
        : productosSnapshot.docs.map(documento => ({
            ...documento.data(),
            id:documento.data().id ?? documento.id
        }));

    usuarios = esAdmin
        ? usuariosSnapshot.docs.map(documento => ({
            ...documento.data(),
            uid:documento.id
        }))
        : [{
            ...usuariosSnapshot.data(),
            uid:perfil.uid
        }];

    solicitudes = solicitudesSnapshot.docs.map(documento => ({
        ...documento.data(),
        id:documento.id
    }));

    if(settingsSnapshot.exists){
        const settings = settingsSnapshot.data();
        categorias = settings.categorias || categorias;
        unidades = settings.unidades || unidades;
    }else if(esAdmin){
        await diagnosticarOperacionFirestore(
            "crear el documento 'settings/catalog'",
            firestoreDb.collection("settings").doc("catalog").set({
                categorias,
                unidades
            })
        );
    }

    guardarEnLocalStorage("productos", productos);
    guardarEnLocalStorage("usuarios", usuarios);
    guardarEnLocalStorage("solicitudes", solicitudes);
    guardarEnLocalStorage("categorias", categorias);
    guardarEnLocalStorage("unidades", unidades);
}

function persistirUsuariosFirebase(){
    guardarEnLocalStorage("usuarios", usuarios);

    if(!firestoreDb || usuarioActual?.rol !== "admin"){
        return;
    }

    const lote = firestoreDb.batch();
    usuarios.filter(usuario =>
        usuario.uid && usuario.uid !== usuarioActual.uid
    ).forEach(usuario => {
        const {password, ...perfil} = usuario;
        lote.set(
            firestoreDb.collection("users").doc(usuario.uid),
            perfil,
            {merge:true}
        );
    });

    lote.commit().catch(error => reportarErrorFirebase("guardar usuarios", error));
}

function persistirProductosFirebase(productosEliminados = []){
    guardarEnLocalStorage("productos", productos);

    if(!firestoreDb){
        return Promise.resolve(true);
    }

    if(usuarioActual?.rol !== "admin"){
        reportarErrorFirebase("guardar productos", {code:"permission-denied"});
        return Promise.resolve(false);
    }

    const lote = firestoreDb.batch();
    productos.forEach(producto => {
        lote.set(
            firestoreDb.collection("products").doc(String(producto.id)),
            producto
        );
    });

    productosEliminados.forEach(id => {
        lote.delete(firestoreDb.collection("products").doc(String(id)));
    });

    return lote.commit().then(() => true).catch(error => {
        reportarErrorFirebase("guardar productos", error);
        return false;
    });
}

function eliminarProductoFirebase(id){
    if(!firestoreDb || usuarioActual?.rol !== "admin"){
        return Promise.resolve(true);
    }

    return firestoreDb.collection("products").doc(String(id)).delete()
        .then(() => true)
        .catch(error => {
            reportarErrorFirebase("eliminar producto", error);
            return false;
        });
}

function guardarConfiguracionFirebase(){
    if(!firestoreDb){
        return Promise.resolve(true);
    }

    if(usuarioActual?.rol !== "admin"){
        reportarErrorFirebase("guardar configuración", {code:"permission-denied"});
        return Promise.resolve(false);
    }

    return firestoreDb.collection("settings").doc("catalog").set({
        categorias,
        unidades
    }, {merge:true}).then(() => true).catch(error => {
        reportarErrorFirebase("guardar configuración", error);
        return false;
    });
}

function guardarSolicitudes(solicitudActualizada = null, notificarError = true){
    guardarEnLocalStorage("solicitudes", solicitudes);

    if(!firestoreDb || !usuarioActual){
        return Promise.resolve(true);
    }

    if(!solicitudActualizada){
        return Promise.resolve(true);
    }

    const id = String(solicitudActualizada.id);
    const datos = {
        ...solicitudActualizada,
        id,
        uid:solicitudActualizada.uid || usuarioActual.uid,
        usuario:solicitudActualizada.usuario || usuarioActual.usuario,
        categoria:solicitudActualizada.categoria || usuarioActual.categoria
    };

    return firestoreDb.collection("requests").doc(id).set(datos, {merge:true})
        .then(() => true).catch(error => {
        const mensaje = reportarErrorFirebase(
            "guardar solicitudes",
            error,
            notificarError
        );
        if(!notificarError){
            mensajeSolicitud = mensaje;
        }
        return false;
    });
}

async function iniciarSesionFirebase(email, password){
    const credenciales = await firebaseAuthService.signInWithEmailAndPassword(email, password);
    try{
        const documento = await diagnosticarOperacionFirestore(
            "leer el perfil en 'users'",
            firestoreDb.collection("users").doc(credenciales.user.uid).get()
        );

        if(!documento.exists){
            throw new Error("No existe el perfil de usuario en Firestore.");
        }

        const perfil = {
            ...documento.data(),
            uid:credenciales.user.uid,
            email:credenciales.user.email
        };

        if(perfil.activo !== true){
            throw new Error("El perfil de Firestore debe tener activo: true. Contacta al administrador.");
        }

        if(perfil.rol !== "admin" &&
            (!String(perfil.usuario || "").trim() ||
             !String(perfil.categoria || "").trim())
        ){
            throw new Error("El perfil de Firestore debe tener usuario y categoría configurados. Contacta al administrador.");
        }

        await cargarDatosFirebase(perfil);
        return perfil;
    }catch(error){
        await firebaseAuthService.signOut();
        throw error;
    }
}

async function cerrarSesionFirebase(){
    if(unsubscribeSolicitudes){
        unsubscribeSolicitudes();
        unsubscribeSolicitudes = null;
    }

    if(firebaseAuthService){
        await firebaseAuthService.signOut();
    }
}

function escucharSolicitudesFirebase(){
    if(!firestoreDb || usuarioActual?.rol !== "admin"){
        return;
    }

    if(unsubscribeSolicitudes){
        unsubscribeSolicitudes();
    }

    unsubscribeSolicitudes = firestoreDb.collection("requests").onSnapshot(
        snapshot => {
            solicitudes = snapshot.docs.map(documento => ({
                ...documento.data(),
                id:documento.id
            }));
            guardarEnLocalStorage("solicitudes", solicitudes);

            if(document.getElementById("panelSolicitudes")){
                mostrarSolicitudesAdmin(filtrosSolicitudesActuales);
            }
        },
        error => reportarErrorFirebase("escuchar solicitudes", error)
    );
}

function esErrorFirebaseAuth(error){
    return Boolean(error?.code && error.code.startsWith("auth/"));
}
