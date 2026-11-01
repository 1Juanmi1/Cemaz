let categorias =
JSON.parse(localStorage.getItem("categorias"));

if(!categorias){

    categorias = [
        "Cocina",
        "Limpieza",
        "Servicio",
        "Caja"
    ];

}

if(categorias.includes("Cajas")){
    categorias = [...new Set(categorias.map(categoria =>
        categoria === "Cajas" ? "Caja" : categoria
    ))];

    usuarios.forEach(usuario => {
        if(usuario.categoria === "Cajas"){
            usuario.categoria = "Caja";
        }
    });

    guardarUsuarios();

}

localStorage.setItem("categorias", JSON.stringify(categorias));

let unidades =
JSON.parse(localStorage.getItem("unidades"));

if(!unidades){

    unidades = [
        "Unidad",
        "Libra",
        "Galón",
        "Litro",
        "Docena",
        "Paquete",
        "Rollo"
    ];

}else{
    ["Paquete", "Rollo"].forEach(unidad => {
        if(!unidades.includes(unidad)){
            unidades.push(unidad);
        }
    });

}

localStorage.setItem("unidades", JSON.stringify(unidades));

function guardarCategorias(){

    localStorage.setItem(
        "categorias",
        JSON.stringify(categorias)
    );
    guardarConfiguracionFirebase();

}

function guardarUnidades(){

    localStorage.setItem(
        "unidades",
        JSON.stringify(unidades)
    );
    guardarConfiguracionFirebase();

}