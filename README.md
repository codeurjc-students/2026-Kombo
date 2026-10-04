# 2026-Kombo : Una aplicación Web para gestión de pedidos, caja e inventario 

**Kombo** es una aplicación web de punto de venta (TPV) y pedidos para un restaurante de comida rápida. Los clientes, registrados y anónimos, pueden consultar la carta, personalizar sus productos y hacer el pedido para coomer en el local, llevar o recibir a domicilio. Los empleaos atienden en el mostrados con el mismo catálogo, siguen la cola de pedidos pendientes y finalizados, consultan el stock y hacen el cierre de caja. El administrador gestiona la carta, el inventaeio, los empleados y las estadísticas de ventas. Cada pedido descuenta automáticamente del inventario los ingredientes consumidos, el carrito recomienda productos y cada pedido genera un ticket en pdf. 



**Bocetos de pantalla**
1. **Pantalla de inicio**
![Main Page](images/mainPage.png)
> Página principal accesible para usuarios anónimos, clientes registrados y empleados. Desde aquí se podrá acceder a la página de inicio de sesión, a la de perfil, a la de detalle de producto y a la de carrito. 


2. **Pantalla de detalle de producto**
![Detail Page](images/detailPage.png)

> Página de detalle de producto que será accesible para usuarios anónimos, clientes registrados y empleados. Se podrá navegar a la página principal, a la de carrito y a la del perfil de usuario. 

3. **Pantalla de carrito**
![Cart Page](images/cartPage.png)
> Página accesible para usuarios anónimos, clientes registrados y empleados. Desde aquí se podrá acceder a la página de checkout y a a la de detalle de los productos recomendados. 

4. **Pantalla de checkout**
![Checkout Page](images/checkout.png)
> Página de checkout que es accesible para usuarios anónimos, registrados y empleados. Desde aquí se podrá navegar a la página de inicio o volver al carrito. 

5. **Pantalla de Log-in**
![Log in Page](images/loginPage.png)
> Página de log in o registro, a la cual accederán los usuarios anónimos. Desde aquí se podrá volver a la página de inicio. 

6. **Pantalla de perfil**
![Profile Page](images/profilePage.png)
> Página de perfil que será accesible para clientes registrados y empleados. Se podrá navegar a la página de inicio y a la de carrito. 

7. **Pantalla de panel de pedidos**
![Order dashboard Page](images/orderDashboardPage.png)
> Pantalla de panel de pedidos que será accesible para empleados. Se podrá navegar a la página principal, a la de inventario y al cierre de caja. 

8. **Pantalla de inventario**
![Inventory Page](images/inventoryPage.png)
> Pantalla de inventario que será accesible para empleados. Se podrá navegar a la página principal, a la de panel de pedidos y al cierre de caja. 

9. **Pantalla de cierre de caja**
![End of dat balancing Page](images/eodBalancingPage.png)
> Pantalla de cierre de caja que será accesible para empleados. Se podrá navegar a la página principal, a la de inventario y al panel de pedidos. 

10. **Pantalla de dashboard general**
![General dashboard Page](images/dashboardPage.png)
> Pantalla de dashboard general que solo será accesible por el administrador. Se podrá navegar a la página de gestión de productos, de gestión de inventario y de gestión de usuarios. 

11. **Pantalla de gestión de productos**
![Product management Page](images/productManagePage.png)
> Pantalla de gesntión de productos que solo será accesible por el administrador. Se podrá navegar a la página de dashboard general, de gestión de inventario y de gestión de usuarios. 
 
12. **Pantalla de gestión de inventario**
![Product Management Page](images/productManagePage.png)
> Pantalla de gestión de inventario que solo será accesible por el administrador. Se podrá navegar a la página de gestión de productos, de dashboard general y de gestión de usuarios. 

13. **Pantalla de gestión de usuarios**
![User management Page](images/userManagePage.png)
> Pantalla de gestión de usuarios que solo será accesible por el administrador. Se podrá navegar a la página de gestión de productos, de gestión de inventario y de dashboard general.

**Flujo de navegación**
![General Flow](images/GeneralFlow.png)
> Diagrama de navegación de la aplicación, en el que se muestran las páginas a las que puede acceder cada tipo de usuario. El azul representa el flujo de los usuarios anónimos, el verde el de los clientes registrados y el naranja el de los empleados. Los clieentes registrados y los empleados también pueden realizar el flujo de los usuarios anónimos, y los empleados pueden realizar además el de los clientes registrados. 

![Admin Flow](images/AdminFlow.png)
> Diagrama de navegación de los administradores. 


> [!WARNING]
> **Estado del proyecto: solo están definidos los objetivos.** En esta fase (Fase 1) únicamente se han realizado el diseño y la documentación. **Todavía no hay ninguna implementación**: ni código, ni base de datos, ni despliegue.


## **Fase 1: Definición del proyecto**
### **Objetivos**

#### **Objetivos funcionales**
- **OF1.** Permitir a cualquier usuario, incluso anónimo, consultar la carta por categorías, con buscador y filtros, y ver el detalle de cada producto. 

- **OF2.** Permitir montar un pedido con carrito, personalizar productos (quitando o añadiendo ingredientes), elegir si se come en el local, se lleva o se recibe a domicilio y financiarlo con un checkout con pago simulado. 

- **OF3.** Ofrecer a los clientes registrados un perfil con datos personales, direcciones guardadas, historial de pedidos y la opcion de repetir el último pedido.

- **OF4.** Ofrecer a los empleados la toma de pedidos en mostrador, un panel de pedidos pendiente y finalizados, la consulta de inventario con avisos de bajo stock y el cierre de caja con desglose por tarjeta y efectivo. 

- **OF5.** Permitir al administrador gestionar productos y combos, ingredientes, entradas de proveedor y empleados. 

- **OF6.** Mantener el inventario de ingredientes actualizado automáticamente con cada pedido y no ofrecer los productos que no se puedan preparar por falta de stock. 

- **OF7.** Recomendar en el carrito productos que suelen comprarse junto a los que ya contiene. 

- **OF8.** Mostrar al administrador estadísticas de ventas mediante gráficos (ventas diarias, productos más vendidos, ...), junto con el ticket medio y las horas pico, y permitir reportes exportables. 

- **OF9.** Generar el ticket de cada pedido, con su número de pedido, en formato PDF. 


#### **Objetivos técnicos**

- **OT1.** Desarrollar una API Rest con Spring Boot que exponga todos los recursos y aplique la lógica de negocio. 

- **OT2.** Desarrollar una SPA con React que consuma la API y adapte la interfaz según el rol del usuario. 

- **OT3.** Persistir los datos en MySQL (incluidas las fotos) con un modelo realcional normalizado. 

- **OT4.** Implementar autenticación y autorización por roles y control de acceso por propietario de los datos. 

- **OT5.** Integrar las tecnologías complementarias: generación de tickets descargables en PDF y envío de correo electrónico al crear una cuenta. 

- **OT6.** Automatizar la construcción y las pruebas con Github Actionas y contenerizar la aplicación con DOcker. 

- **OT7.** Aplicaar análisis estático de código con SonarQube integrado en el pipeline de integración continua. 

- **OT8.** Escribir pruebas automatizadas sobre la lógica de negocio y la API. 

### Metodología

El desarrollo se organiza en cinco fases con entrega final aproximada el 10 de enero. Las fases de implementación siguen el orden de las funcionaliades: primero las básicas, después las intermedias y por último las avanzadas. 

<!-- TODO: las fechas de las fases 2-5 son una propuesta; ajústalas con tu tutor -->
| Fase | Descripción | Fechas |
|:---:|---|---|
| **1** | Definición de funcionalidades y pantallas (wireframes, modelo de entidades, algoritmo, tecnología complementaria, README) | 28 sep – 4 oct 2026 |
| **2** | Funcionalidades básicas (MVP). Arquitectura inicial, CI con GitHub Actions, Docker y Sonar configurados | 5 oct – 8 nov 2026 |
| **3** | Funcionalidades intermedias (búsqueda, personalización, recomendaciones, ticket PDF, inventario, cierre de caja) | 9 nov – 6 dic 2026 |
| **4** | Funcionalidades avanzadas, gráficos, corrección de incidencias de Sonar y refuerzo de pruebas | 7 dic – 27 dic 2026 |
| **5** | Cierre: documentación final, memoria y revisión general | 28 dic 2026 – 10 ene 2027 |

```mermaid
gantt
    title Planificación del TFG 1 (28 sep 2026 - 10 ene 2027)
    dateFormat YYYY-MM-DD
    axisFormat %d/%m
    tickInterval 1week

    section Fase 1 - Definición
    Wireframes de pantallas                          :done,   f1a, 2026-09-28, 3d
    Modelo de entidades y permisos                   :done,   f1b, 2026-10-01, 2d
    Algoritmo y tecnología complementaria            :done,   f1c, 2026-10-03, 2d
    README y documentación de la fase                :active, f1d, 2026-10-03, 2d

    section Fase 2 - Funcionalidades básicas (MVP)
    Configuración inicial de Spring Boot y React     :f2a, 2026-10-05, 5d
    Docker y MySQL                                   :f2b, after f2a, 2d
    Integración continua con GitHub Actions y Sonar  :f2c, 2026-10-10, 4d
    Entidades y API REST base                        :f2d, 2026-10-14, 5d
    Registro inicio de sesión y roles                :f2e, 2026-10-19, 6d
    Carta detalle carrito y checkout simulado        :f2f, 2026-10-25, 9d
    Panel de pedidos perfil y CRUD de productos      :f2g, 2026-11-03, 6d

    section Fase 3 - Funcionalidades intermedias
    Buscador filtros y personalización               :f3a, 2026-11-09, 7d
    Barra lateral del pedido y repetir pedido        :f3b, 2026-11-16, 4d
    Algoritmo de recomendaciones                     :f3c, 2026-11-20, 5d
    Ticket del pedido en PDF                         :f3d, 2026-11-25, 4d
    Inventario y descuento automático de stock       :f3e, 2026-11-29, 4d
    Cierre de caja                                   :f3f, 2026-12-03, 4d

    section Fase 4 - Funcionalidades avanzadas
    Dashboard y gráficos                             :f4a, 2026-12-07, 7d
    Estimación de stock y reportes exportables       :f4b, 2026-12-14, 7d
    Corrección de Sonar y pruebas                    :f4c, 2026-12-21, 7d

    section Fase 5 - Cierre
    Memoria y documentación final                    :f5a, 2026-12-28, 9d
    Revisión general                                 :f5b, 2027-01-06, 5d
    Entrega del TFG 1                                :milestone, m1, 2027-01-10, 0d
```

### **Funcionalidades**

#### **Funcionaldades básicas (MVP)**

**Usuario anónimo**
- Ver la carta por categorías en la página principal. 

- Ver el detalle de los productos de un producto o combo.

- Añadir productos al carrito y ver el carrito con cantidades, subtotal, gastos de envío y total. 

- Elegir si el pedido es para comer en el local, para llevar o a domicilio. 

- Realizar el checkout rellenando un formulario de ocontacto (con dirección y datos personales).

- Pagar mediante pago simulado (tarjeta o efectivo) y ver la confirmación con el número de pedido. 

- Registrarse e iniciar sesión. 

**Usuario registrado**
- Todas las funcionalidades del usuario anónimo, pero sin rellenar el formulario de checkout dado que se usan los datos guardados. 

- Perfil básico: datos persinales, cambio de contraseña y direcciones guardadas. 

- Consultar el historial de pedidos.


**Empleado**
- Panel de pedidos: pedidos pendientes y finalizados, ordenados por antigüedad, con posibilidad de cambiar el estado y de marcar como cobrados los pedidos en efectivo.

- Toma de pedidos en mostrador. 

**Administración**
- Gestión de productos y comboos: CRUD básico. 
- Gestión de usuarios: CRUD básico de empleados. 


#### **Funcionalidades intermedias**

**Usuario anónimo y registrado**

- Buscador y filtros en la carta. 

- Personalización del producto (quitar ingredientes).

- Apartado de recomendaciones del carrito. 

- Lógica de checkout: ocultar el pago en efectivo si el pedido es a domicilio.

- Barra lateral desplegable para ver el pedido actual sin salir de la página. 

- Descarga del ticker de pedido en PDF.

**Cliente registrado**
- Repetir el último pedido desde el perfil. 

**Empleado**
- Consulta de inventario, con los ingredientes resaltados en rojo si queda bajo stock. 

- Cierre de caja. 

- Impresión o descarga del ticket en PDF de cualquier pedido. 

**Administrador** 
- Gestión de productos: asociación de cada producto a su lista de ingredientes con cantidades. 
- Gestión de inventario: CRUD de ingredientes y umbrales de alerta. 
- Dashboard básico: gráfico de ventas diarias.


#### **Funcionalidades avanzadas**

**Administrador**
- Dashboard completo: gráfico de productos más vendidos, vista diaria o mensual de las ventas, ticket medio y horas pico. 
- Estimación del stock restante según el consumo histórico. 



### Entidades 
1. **Entidad 1**: Usuario.
2. **Entidad 2**: Ingrediente. 
3. **Entidad 3**: Pedido. 
4. **Entidad 4**: Producto. 
5. **Entidad 5**: Imagen. 

- Usuarios - Pedido (1:N) : un usuario puede realizar varios pedidos, pero un pedido pertenece a un usuario (los pedidos anónimos no tendrán usuario). 

- Pedido - Producto (N:N) : un pedido está formado por N productos y un producto puede pertenecer a N pedidos. 

- Producto - Ingrediente (N:N) : un producto contiene N ingredientes y un ingrediente puede estar en N productos. 

- Imagen - Usuario (1:1) : cada usuario tiene asociada una imagen y una imagen pertenece a un usuario. 

- Imagen - Producto (1:1) : cada producto tiene asociada una imagen y una imagen pertece a un producto. 

#### Atributos de las entidades
**Usuario**
- Id : identificador. 
- Nombre completo. 
- Email.
- Teléfono.
- Imagen. 
- Contraseña. 
- Rol. 
- Direcciones.
- Último pedido.

**Producto**
- Id : identificador. 
- Nombre. 
- Imagen. 
- Precio. 
- Descripción. 
- Categoría. 
- Activo : booleano para saber si se muestra a los usuarios. 

**Ingrediente**
- Id : identificador. 
- Nombre.
- Unidad de medida. 
- Stock actual. 
- Umbral de alerta. 

**Pedido**
- Id : identificador. 
- Número pedido. 
- Usuario. 
- Tipo de entrega : comer en local, para llevar o a domicilio. 
- Dirección entrega. 
- Estado : en preparación, listo, entregado o cancelado. 
- Fecha de creación. 
- Fecha de entrega. 
- Precio. 

**Imagen**
- Id : identificador. 
- Texto. 



### Permisos de usuario

| Acción | Anónimo | Cliente | Empleado | Administrador |
| :----- | :-----: | :-----: | :------: | :-----------: |
| Consultar la carta, el detalle de producto y las recomendaciones | X | X | X | X |
| Registrarse | X | | | |
| Iniciar sesión | | X | X | X |
| Crear un pedido y pagarlo (pago simulado) | X | X | X | |
| Hacer el checkout sin rellenar el formulario de datos | | X | | |
| Descargar el ticket PDF de su propio pedido | X | X | | |
| Consultar su historial de pedidos y repetir el último | | X | | |
| Gestionar su perfil | | X | X | |
| Gestionar sus direcciones guardadas | | X | | |
| Consultar todos los pedidos | | | X | X |
| Cambiar el estado de un pedido y marcar como cobrado el pago en efectivo | | | X | |
| Descargar el ticket PDF de cualquier pedido | | | X | X |
| Consultar el inventario de ingredientes | | | X | X |
| Consultar el cierre de caja | | | X | X |
| Gestionar productos (crear, editar, eliminar, foto) | | | | X |
| Gestionar ingredientes y reponer stock | | | | X |
| Gestionar empleados | | | | X |
| Consultar el dashboard y los reportes de ventas | | | | X |


### Entidades que tendrán imágenes asociadas
- **Usuario**: fotografía de perfil. Al crear el usuario se pondrá una por defecto, teniendo el usuario la posibilidad de cambiarla en configuraciones. 

- **Producto**: fotografía del producto. 


### Tecnología complementaria 
- **Generación del ticket de pedido en PDF**: se generará el ticket de cada pedido en un PDF. Contendrá el nombre del local, el número del pedido, los productos del pedido y el precio pagado. 

- **Envío de emails** a los usuarios cuando se registren en la web. 


### Algoritmo de consulta avanza 
- **Recomendaciones del carrito**: se recomendará a los usuarios pedidos que pueden comprar según cuales son los productos más comprados junto con los que ya hay en el carrito. 


### Gráficos
- **Gráfico de ventas diarias**: será un gráfico de barras en el que se mostrará el número de pedidos vendidos por hora.
- **Gráfico de productos más vendidos**: será un gráfico de sectores en el que se mostrará los produtos más vendidos ese mes.

## 🤖 **Uso de Herramientas de IA**

Resumen de las herramientas de IA utilizadas en cada una de las fases del proyecto:

| Fase | Estado | Herramienta | Uso |
| :--- | :----- | :---------- | :-- |
| Fase 1: Definición de funcionalidades y pantallas | Completada | Claude Sonnet 5.5 (Anthropic) | Conversión a Markdown de la documentación, redacción y estructuración del README, propuesta de descripciones de los bocetos y diagrama de Gantt. Los bocetos y las decisiones de diseño son de la autora |
| Fase 2: Funcionalidades básicas (MVP) | Pendiente | | |
| Fase 3: Funcionalidades intermedias | Pendiente | | |
| Fase 4: Funcionalidades avanzadas | Pendiente | | |
| Fase 5: Cierre | Pendiente | | |

> El fichero [AI_USAGE.md](AI_USAGE.md) contiene información detallada sobre cada uso: fecha, fase, objetivo, herramienta, versión, configuración, forma de uso, complementos y ficheros de contexto.


## Autor 
El presente Trabajo de Fin de Grado ha sido desarrollado por **Delia Martínez López**, alumna del Doble Grado en Ingeniería Informática e Ingeniería del Software de la Escuela Técnica Superior de Ingeniería Informática (ETSII) de la Universidad Rey Juan Carlos, bajo la tutoría de **Óscar Soto Sánchez**.

- **Curso académico:** 2026-2027
- **Fecha de entrega del TFG 1:** 10 de enero de 2027
