Proyecto final
Aplicación web con servicios de Inteligencia Artificial

Descripción del proyecto

Desarrollar  una  aplicación  web  que  permita  a  los  usuarios  iniciar  sesión  y  utilizar  al
menos tres servicios de Inteligencia Artificial. El estudiante elegirá el tema y definirá
el objetivo, los usuarios destinatarios y las funcionalidades de su aplicación.

El  servicio  principal  será  un  chatbot  con  RAG,  que  responderá  utilizando  información
recuperada  desde  un  Data  Warehouse  o  base  de  datos.  Los  servicios  adicionales
resolverán solicitudes que requieran consultar fuentes externas y combinar información
mediante  varios  pasos,  según  las  necesidades  del  usuario.  Podrán  utilizar  APIs
públicas, páginas web, noticias, estadísticas, mapas, redes sociales o foros.

Tecnologías

El lenguaje y las herramientas son libres:

•  Frontend: React, Vue, Angular u otras alternativas.
•  Backend y API: Django, FastAPI, Express, NestJS, ASP.NET Core, Spring

Boot, Laravel u otras alternativas.

•  Datos: Snowflake, BigQuery, Redshift, PostgreSQL, MySQL/MariaDB, SQL

Server, u otras alternativas.
IA: proveedores como Groq, OpenAI, Google, Anthropic, etc.

•

Las tecnologías son de elección libre, siempre que permitan cumplir los requisitos del
proyecto.

Componentes requeridos

1. Propuesta y arquitectura

•  Definir  el  objetivo  de  la  aplicación,  sus  usuarios,  fuentes  de  información  y  los

servicios de IA.

•  Elaborar un diagrama de arquitectura que defina los componentes, tecnologías,
hosting  y  comunicaciones.  Representar  el  recorrido  de  una  solicitud  desde  la
GUI y desde un consumidor externo como Power BI.

2. Aplicación web y administración

•

Implementar  inicio  y  cierre  de  sesión  con  roles  de  administrador  y  usuario,
restringiendo funciones y datos según el acceso correspondiente.

•  Desarrollar CRUD de usuarios, configuración de servicios de IA y entidades
propias  de  la  aplicación.  El  administrador  deberá  gestionar  los  datos  que
alimentan  sus  servicios,  activar  o  desactivar  servicios  y  asignar  límites  de
consumo de  tokens  por  usuario.  La  información  obtenida de  servicios  externos
podrá consultarse sin implementar un CRUD sobre ella.

•  Crear una interfaz clara con un menú principal para los servicios de IA, historial
de  conversaciones  y  consumo  de
las  opciones
administrativas.  La  interfaz  del  chatbot  deberá  permitir  escribir  preguntas  y
visualizar las respuestas.

tokens,  además  de

3. Servicios de IA

•

•

•
•

Implementar un chatbot con RAG que recupere información relevante de la BD
o DW y la utilice como contexto.
Identificar las fuentes de datos utilizadas e indicar cuando no exista información
suficiente.
Implementar memoria conversacional para mantener el contexto de la sesión.
Implementar  al  menos  dos  servicios  adicionales  de  IA  que  resuelvan
solicitudes de varios pasos. Según la petición, la solución deberá determinar qué
información  necesita,  seleccionar  las  consultas  o  funciones  correspondientes  y
utilizar sus resultados para continuar hasta elaborar la respuesta (agentes). Por
ejemplo, buscar opciones, consultar sus características, compararlas y presentar
una recomendación. Los resultados deberán visualizarse en la aplicación web.

4. Historial y control de consumo

•  Registrar automáticamente cada conversación del chatbot en  el DW o base de

datos.

•  Permitir  al  usuario  consultar  su  propio  historial  y  consumo;  el  administrador
podrá consultar el uso general, con filtros por usuario, fecha y servicio. Mostrar
un reporte web de consultas realizadas y consumo acumulado por servicio.

•  Verificar  el  consumo  de  tokens  disponibles  antes  de  ejecutar  solicitudes  y

bloquearlas cuando el usuario alcance su límite.

5. API REST

•  Exponer  los  servicios  de  IA,  la  consulta  de  historial,  y  el  consumo  de  tokens
interfaz  web  y  disponibles  para

la

mediante  endpoints  utilizados  por
consumidores externos.

•  Aplicar autenticación, permisos y límites de consumo.
•  Documentar métodos HTTP mediante Swagger o similares.
•  Demostrar el consumo externo mediante Postman o similares.

6. Power BI

•  Crear un reporte que consuma datos desde la API del proyecto y replique el

reporte web de consultas y consumo, con filtros por fecha y servicio.

•  Verificar que ambas interfaces presenten resultados coincidentes.

7. Pruebas y despliegue

•

Implementar  pruebas  automatizadas  de  los  servicios  principales  de  IA,  el
registro/consulta del historial y el cálculo de consumo de tokens.

•  Desplegar la aplicación y la API en un hosting en la nube.

•  Configurar  un  flujo  de  CI/CD,  con  GitHub  Actions  o  Gitlab,  que  ejecute  las
repositorio  y  despliegue

pruebas  al  actualizar
automáticamente la nueva versión únicamente si las pruebas son satisfactorias.

rama  principal  del

la

Ejemplos de aplicaciones

Propuesta

Películas y
videojuegos

Chatbot con
RAG
Consultas sobre el
catálogo
almacenado.

Turismo

Información
económica

Opiniones de
productos

Consultas sobre
destinos y
actividades
registrados.
Consultas sobre
indicadores
históricos
almacenados.

Consultas sobre
productos,
comentarios y
valoraciones.

Servicio adicional 1

Servicio adicional 2

Según las preferencias,
buscar títulos, consultar
reseñas de los candidatos
y comparar opciones para
recomendar.
Buscar lugares según
intereses, consultar clima
y distancias, y organizar
un itinerario.
Identificar los indicadores
necesarios para una
pregunta, consultarlos y
realizar cálculos para
comparar períodos.
Buscar reseñas según el
producto solicitado,
analizar su sentimiento y
ampliar la búsqueda si la
información resulta
insuficiente.

Buscar novedades sobre un
título o saga solicitados y
ampliar la consulta cuando
falte información para
responder.
Ante un cambio de
presupuesto o clima, buscar
alternativas y ajustar las
actividades propuestas.
Investigar noticias sobre un
sector, ampliar la búsqueda
sobre los acontecimientos
encontrados y elaborar un
resumen con fuentes.
Identificar problemas
recurrentes y consultar
características o reseñas de
otras opciones para
recomendar alternativas.

Los  ejemplos  son  orientativos.  Cada  propuesta  deberá  definir  las  entidades  que
administrará, las fuentes de datos y el alcance de sus servicios, cumpliendo todos los
componentes requeridos.

Entregables

•  Repositorio  Git  con  código  fuente,  pruebas  automatizadas  y  configuración  de

CI/CD.

•  Script  de  creación  de  la  base  de  datos  y  datos  necesarios  para  demostrar  la

aplicación.

•  PDF  con  la  propuesta,  arquitectura,  modelo  de  datos  y  capturas  de  pantalla

como evidencia.

•  Documentación de la API mediante Swagger o herramientas similares. Adjuntar

los enlaces de la documentación y de la aplicación publicada.

•  Archivo de Power BI con el reporte conectado a la API.
•  Demostración  funcional  de  la  aplicación  web,  consumo  de  la  API  desde  un

cliente externo y reporte de Power BI.

Fecha de entrega: 10 de noviembre
Valor: 30 pts.

