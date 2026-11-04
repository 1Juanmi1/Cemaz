

let usuarios = JSON.parse(localStorage.getItem("usuarios"));

if(!usuarios && !firebaseEstaConfigurado()){
    usuarios = [
        {
            usuario:"admin",
            password:"1234",
            rol:"admin",
            activo:true,
            fechaCreacion:new Date().toLocaleDateString(),
            ultimoAcceso:"Nunca",
            solicitudes:0
        },
        {
            usuario:"cocina1",
            password:"1234",
            rol:"usuario",
            categoria:"Cocina",
            activo:true,
            fechaCreacion:new Date().toLocaleDateString(),
            ultimoAcceso:"Nunca",
            solicitudes:0
        },
        {
            usuario:"limpieza1",
            password:"1234",
            rol:"usuario",
            categoria:"Limpieza",
            activo:true,
            fechaCreacion:new Date().toLocaleDateString(),
            ultimoAcceso:"Nunca",
            solicitudes:0
        }
    ];

    localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

if(!usuarios){
    usuarios = [];
}

function guardarUsuarios(){
    guardarEnLocalStorage("usuarios", usuarios);
    persistirUsuariosFirebase();
}

let usuarioActual = null;

const correosPorUsuario = {
    cajas:"cemascaf+cajas@gmail.com",
    claudia:"cemascaf+servicio@gmail.com",
    max:"cemascaf+cocina@gmail.com",
    "dona jose":"cemascaf+chef@gmail.com",
    limpieza:"cemascaf+limpieza@gmail.com"
};

function obtenerCorreoDeAcceso(identificador){
    const usuarioNormalizado = identificador
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("es");
    const correoAsignado = Object.prototype.hasOwnProperty.call(
        correosPorUsuario,
        usuarioNormalizado
    ) ? correosPorUsuario[usuarioNormalizado] : null;

    return correoAsignado ||
        (identificador.includes("@") ? identificador.trim() : null);
}

async function login(){
    const identificador = document.getElementById("usuario").value.trim();
    const password = document.getElementById("password").value;

    if(!identificador || !password){
        alert("Ingresa tu usuario o correo y contraseña.");
        return;
    }

    if(firebaseEstaConfigurado()){
        if(!firebaseDisponible){
            alert("Firebase está configurado, pero no se pudo cargar su SDK. Revisa tu conexión.");
            return;
        }

        const correo = obtenerCorreoDeAcceso(identificador);

        if(!correo){
            alert("Usuario no reconocido. Revisa el nombre e inténtalo de nuevo.");
            return;
        }

        try{
            usuarioActual = await iniciarSesionFirebase(correo, password);
            mostrarSistema();
            escucharSolicitudesFirebase();
        }catch(error){
            if(esErrorFirebaseAuth(error)){
                alert(obtenerMensajeErrorAuth(error));
            }else{
                console.error("No se pudo iniciar sesión:", error);
                alert(error.message || "No se pudo iniciar sesión. Revisa la configuración de Firebase.");
            }
        }

        return;
    }

    const encontrado = usuarios.find(usuario =>
        usuario.usuario === identificador &&
        usuario.password === password
    );

    if(!encontrado){
        alert("Usuario o contraseña incorrectos.");
        return;
    }

    if(!encontrado.activo){
        alert("Usuario desactivado.");
        return;
    }

    encontrado.ultimoAcceso = new Date().toLocaleString();
    guardarUsuarios();
    usuarioActual = encontrado;
    mostrarSistema();
}

function obtenerMensajeErrorAuth(error){
    const mensajes = {
        "auth/invalid-credential":"Correo o contraseña incorrectos.",
        "auth/user-not-found":"No existe una cuenta con ese correo.",
        "auth/wrong-password":"Correo o contraseña incorrectos.",
        "auth/invalid-email":"Ingresa un correo electrónico válido.",
        "auth/network-request-failed":"No se pudo conectar con Firebase. Revisa tu conexión.",
        "auth/too-many-requests":"Se bloquearon temporalmente los intentos. Espera e inténtalo de nuevo.",
        "auth/unauthorized-domain":"Este dominio no está autorizado en Firebase Authentication. Agrégalo en Authorized domains."
    };

    return mensajes[error.code] || "Firebase no pudo autenticar la cuenta. Verifica los datos e inténtalo de nuevo.";
}
