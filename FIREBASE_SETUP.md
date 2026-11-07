# Configuración de Firebase para Cemaz

## 1. Crear el proyecto

1. Entra a [Firebase Console](https://console.firebase.google.com/) e inicia un proyecto.
2. Agrega una aplicación web (`</>`).
3. En Authentication, habilita el proveedor **Correo electrónico/contraseña**.
4. Crea la base de datos de Firestore en producción.
5. Copia las reglas de `firestore.rules` en la pestaña **Reglas** de Firestore y publícalas.
6. En Authentication → Settings → Authorized domains, agrega el dominio de GitHub Pages, por ejemplo `tu-usuario.github.io`.

## 2. Conectar la aplicación web

Copia la configuración de la aplicación web que muestra Firebase Console y pégala en `js/firebase-config.js`:

```js
const CEMAZ_FIREBASE_CONFIG = {
    apiKey: "…",
    authDomain: "…",
    projectId: "…",
    storageBucket: "…",
    messagingSenderId: "…",
    appId: "…"
};
```

La configuración web identifica el proyecto; no reemplaza las reglas de seguridad. Nunca publiques claves de cuentas de servicio o credenciales privadas en este repositorio.
La configuración web (`apiKey`, `projectId`, etc.) no es una contraseña; restringe su uso por dominio en Google Cloud cuando termines la puesta en marcha.

## 3. Crear el primer administrador

1. En Authentication, crea el usuario administrador con su correo y contraseña.
2. Copia el **UID** que Firebase asigna.
3. En Firestore, crea `users/{UID}` (el ID del documento debe ser exactamente el UID) con estos campos:

| Campo | Tipo | Valor de ejemplo |
|---|---|---|
| `usuario` | string | `admin` |
| `email` | string | el correo del usuario |
| `rol` | string | `admin` |
| `activo` | boolean | `true` |
| `fechaCreacion` | string | fecha ISO |
| `solicitudes` | number | `0` |

No guardes contraseñas en Firestore. El inicio de sesión usa el correo de Firebase Authentication. La pantalla de usuarios de Cemaz muestra perfiles; las cuentas se crean en Authentication y luego se agrega su perfil en Firestore.

## 4. Crear los demás usuarios

Para cada usuario de Cocina, Limpieza, Servicio o Caja:

1. Crea la cuenta en Authentication.
2. Crea `users/{UID}` en Firestore con `usuario`, `email`, `rol: "usuario"`, la `categoria` correspondiente, `activo: true`, `fechaCreacion` y `solicitudes: 0`.
3. En Cemaz, los usuarios normales pueden iniciar sesión con el nombre corto configurado y su contraseña. El administrador puede seguir usando su correo y contraseña.

Los nombres cortos se relacionan con correos de Firebase en `js/auth.js`:

| Usuario para iniciar sesión | Cuenta de Firebase Authentication |
|---|---|
| `cajas` | `cemascaf+cajas@gmail.com` |
| `servicio` | `cemascaf+servicio@gmail.com` |
| `cocina` | `cemascaf+cocina@gmail.com` |
| `cocina2` o `cocina 2` | `cemascaf+chef@gmail.com` |
| `limpieza` | `cemascaf+limpieza@gmail.com` |

El nombre es insensible a mayúsculas y acentos. Como el frontend es público, estos alias también son visibles en el código; no son contraseñas ni deben usarse como secreto. No guardes contraseñas en el código ni en Firestore.

Las reglas hacen que los usuarios solo consulten productos de su categoría y sus solicitudes. Admin puede gestionar usuarios, productos y solicitudes. Solo perfiles activos (`activo: true`) con `rol: "admin"` pueden crear/editar/eliminar documentos de `products` y guardar `settings/catalog` (unidades y categorías). Después de modificar `firestore.rules`, publícalo también en **Firestore Database → Rules** en Firebase Console; subirlo a GitHub por sí solo no actualiza los permisos del proyecto. No publiques reglas de prueba o abiertas.

En el catálogo, los usuarios pueden escribir la cantidad solicitada y adjuntar una observación general (por ejemplo, un producto faltante o nuevo), incluso sin agregar productos. Al enviar, la solicitud queda guardada sin cerrar la aplicación; si falla el guardado, se conservan los datos para reintentar. El administrador puede separar solicitudes pendientes y completas y completar cada solicitud explícitamente; completar una solicitud no cambia los estados individuales de sus productos. En Configuración, el administrador puede agregar unidades y asignarlas a productos al crearlos o editarlos. El resumen semanal agrupa cantidades por producto y unidad, según estado, de lunes a domingo.

El administrador también puede consultar una gráfica con los 10 productos más solicitados por cantidad en todo el historial, sin importar el estado de cada producto. Cambiar cantidades en el catálogo actualiza el carrito sin volver a dibujar la lista de productos.

Si Firestore rechaza una solicitud, publica `firestore.rules` desde la consola del mismo proyecto indicado en `js/firebase-config.js`. Revisa además que `users/{UID}` use el UID de Authentication y tenga `activo: true`, `usuario` y `categoria` iguales a los del perfil con el que se inició sesión. La aplicación conservará el borrador y mostrará el error en el carrito.

## 5. Datos que se inicializan

Al iniciar sesión por primera vez como administrador, Cemaz carga el catálogo local existente a Firestore solo si la colección `products` está vacía. También crea `settings/catalog` con categorías y unidades cuando todavía no existe. No importa contraseñas locales ni solicitudes históricas. Antes de migrar datos reales, realiza una copia de seguridad.

Sin configuración Firebase, la aplicación continúa en modo local: sus cambios no se sincronizan entre dispositivos.

La integración no se activa hasta completar la configuración web, publicar las reglas y crear el primer perfil administrador. Prueba primero en un proyecto de Firebase de desarrollo.
El modo local conserva las cuentas de demostración existentes y no es autenticación segura; no guardes información real ni presentes ese modo como una instalación de producción.
