function crearProductosCatalogo(categoria, subcategoria, unidad, nombres){
    return nombres.map(nombre => ({
        nombre,
        categoria,
        subcategoria,
        unidad,
        precio:null
    }));
}

const catalogoInicialCemaz = [
    ...crearProductosCatalogo("Cocina", "Carnes", "Libra", [
        "Adobado",
        "Carne de res para churrasquitos",
        "Costilla de res",
        "Carne de cerdo",
        "Chilera de cerdo",
        "Carne molida",
        "Posta",
        "Pechuga",
        "Pollo",
        "Longaniza",
        "Chorizo",
        "Salchicha",
        "Jamón",
        "Solomito"
    ]),
    ...crearProductosCatalogo("Cocina", "Carnes", "Docena", ["Huevos"]),
    ...crearProductosCatalogo("Cocina", "Verduras y frutas", "Unidad", [
        "Banano",
        "Pepino",
        "Lechuga",
        "Repollo",
        "Brócoli",
        "Melón",
        "Limón",
        "Cebollín",
        "Güisquil",
        "Chile pimiento verde",
        "Chile pimiento rojo",
        "Plátano",
        "Ajo",
        "Elote",
        "Piña",
        "Manzana",
        "Cilantro maduro",
        "Cilantro sarazo",
        "Perejil",
        "Apio",
        "Sandía"
    ]),
    ...crearProductosCatalogo("Cocina", "Verduras y frutas", "Libra", [
        "Zanahoria",
        "Tomate",
        "Cebolla amarilla",
        "Cebolla morada",
        "Cebolla blanca",
        "Ejote",
        "Papa loma",
        "Papa baby",
        "Remolacha",
        "Chile jalapeño",
        "Guisante",
        "Fresa"
    ]),
    ...crearProductosCatalogo("Cocina", "Especias", "Libra", [
        "Chile pasa",
        "Chile guaque",
        "Pepitoria",
        "Ajonjolí",
        "Tomillo",
        "Achiote",
        "Romero",
        "Pimienta gorda",
        "Clavo de olor",
        "Canela",
        "Laurel",
        "Jengibre",
        "Pimienta negra",
        "Chocolate",
        "Chile de árbol",
        "Orégano",
        "Ajo granulado",
        "Cúrcuma",
        "Jamaica"
    ]),
    ...crearProductosCatalogo("Cocina", "Salsas", "Litro", [
        "Salsa de tomate",
        "Mayonesa",
        "Mostaza",
        "Salsa de cilantro",
        "Salsa de soya",
        "Salsa inglesa",
        "Salsa ranch",
        "Salsa picante",
        "Miel",
        "Vinagre"
    ]),
    ...crearProductosCatalogo("Cocina", "Grasas", "Unidad", ["Mantequilla"]),
    ...crearProductosCatalogo("Cocina", "Grasas", "Litro", [
        "Aceite",
        "Aceite de coco",
        "Aceite de oliva"
    ]),
    ...crearProductosCatalogo("Cocina", "Grasas", "Libra", ["Manteca"]),
    ...crearProductosCatalogo("Cocina", "Harinas", "Libra", [
        "Maicena",
        "Corazón de trigo",
        "Incaparina",
        "Masa para panqueques"
    ]),
    ...crearProductosCatalogo("Cocina", "Granos", "Libra", [
        "Frijol",
        "Arroz",
        "Avena",
        "Sal",
        "Fideos",
        "Azúcar"
    ]),
    ...crearProductosCatalogo("Cocina", "Sin categoría", "Paquete", [
        "Frijol en bolsa",
        "Nachos",
        "Tacos",
        "Tostadas",
        "Saborizantes",
        "Cereal",
        "Té de manzanilla",
        "Tés variados"
    ]),
    ...crearProductosCatalogo("Cocina", "Sin categoría", "Unidad", [
        "Esencia de vainilla",
        "Esencia de coco",
        "Nutella",
        "Tajín",
        "Té frío",
        "Horchata",
        "Fruit punch"
    ]),
    ...crearProductosCatalogo("Limpieza", "Limpieza", "Galón", [
        "Cloro",
        "Jabón para platos",
        "Clorox",
        "Desengrasante",
        "Desinfectante",
        "Jabón para manos"
    ]),
    ...crearProductosCatalogo("Limpieza", "Limpieza", "Unidad", [
        "Esponja",
        "Alambre acerado",
        "Jabón de bola",
        "Ajax",
        "Trapos",
        "Bicarbonato"
    ]),
    ...crearProductosCatalogo("Servicio", "Servicio", "Paquete", [
        "Bolsas de sal",
        "Bolsas de azúcar",
        "Sobres de picante",
        "Servilletas",
        "Tenedores",
        "Cuchillos",
        "Cucharas",
        "Paquetes de cubiertos"
    ]),
    ...crearProductosCatalogo("Servicio", "Servicio", "Unidad", [
        "Pajillas",
        "Vasos de 8 oz",
        "Vasos de 12 oz",
        "Vasos plásticos",
        "Vasos de duroport",
        "Bolsas de 7 x 10",
        "Bolsas",
        "Vasos para café",
        "Bandejas para llevar",
        "Vasos de sopa para llevar",
        "Mayordomo",
        "Removedores de café",
        "Vasos para llevar",
        "Sobres de café",
        "Chocolate caliente"
    ]),
    ...crearProductosCatalogo("Servicio", "Servicio", "Rollo", [
        "Papel mantequilla para pan",
        "Aluminio"
    ]),
    ...crearProductosCatalogo("Caja", "Caja", "Unidad", [
        "Bolsas para mantequilla",
        "Guantes",
        "Redes",
        "Clips",
        "Marcadores",
        "Lapiceros",
        "Recibos",
        "Mata insectos"
    ]),
    ...crearProductosCatalogo("Caja", "Caja", "Rollo", [
        "Papel mantequilla",
        "Tape",
        "Papel transparente"
    ])
];

function guardarProductos(productosEliminados = []){
    localStorage.setItem("productos", JSON.stringify(productos));
    return persistirProductosFirebase(productosEliminados);
}

function normalizarTextoCatalogo(valor){
    return String(valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .toLocaleLowerCase();
}

function normalizarNombreCatalogo(valor){
    const nombre = normalizarTextoCatalogo(valor);
    const alias = {
        "chile huaque":"chile guaque",
        "achote":"achiote",
        "clavo":"clavo de olor",
        "jabón en bola":"jabon de bola",
        "jabon en bola":"jabon de bola",
        "renovadores de cafe":"removedores de cafe"
    };

    return alias[nombre] || nombre;
}

function cargarCatalogoCemaz(){
    // Incrementa esta versión solo cuando se requiera migrar el catálogo inicial otra vez.
    const versionCatalogo = "3";

    if(localStorage.getItem("catalogoCemazVersion") === versionCatalogo){
        return;
    }

    const productosDemo = new Set([
        "cafe",
        "leche",
        "detergente",
        "cloro",
        "caja grande"
    ]);

    productos = productos.filter(producto =>
        !(Number(producto.id) >= 1 &&
          Number(producto.id) <= 6 &&
          productosDemo.has(normalizarTextoCatalogo(producto.nombre)))
    );

    const indicesPorProducto = new Map();

    productos.forEach((producto, indice) => {
        if(producto.categoria === "Cajas"){
            producto.categoria = "Caja";
        }

        const llave = `${normalizarTextoCatalogo(producto.categoria)}|${normalizarNombreCatalogo(producto.nombre)}`;
        indicesPorProducto.set(llave, indice);
    });

    catalogoInicialCemaz.forEach(productoCatalogo => {
        const llave = `${normalizarTextoCatalogo(productoCatalogo.categoria)}|${normalizarNombreCatalogo(productoCatalogo.nombre)}`;
        const indiceExistente = indicesPorProducto.get(llave);
        const producto = {
            ...productoCatalogo,
            id:indiceExistente === undefined
                ? Date.now() + Math.random()
                : productos[indiceExistente].id
        };

        if(indiceExistente === undefined){
            indicesPorProducto.set(llave, productos.length);
            productos.push(producto);
        }else{
            productos[indiceExistente] = producto;
        }
    });

    guardarProductos();
    localStorage.setItem("catalogoCemazVersion", versionCatalogo);
}

let productos = JSON.parse(localStorage.getItem("productos")) || [];
cargarCatalogoCemaz();
