# CompuCare — Frontend Web Application

Aplicación Vue 3 de UniLink para gestionar soporte técnico empresarial por suscripción. **Proyecto académico en desarrollo.** La SPA utiliza JavaScript, Vite, PrimeVue, Pinia, Vue Router, Axios y Vue I18n.

## Arquitectura funcional (DDD)

El frontend agrupa interfaces por los cinco **Bounded Contexts** del producto. Su numeración es la establecida en el informe y no indica prioridad estratégica.

| Clasificación estratégica | BC | Carpeta del frontend | Responsabilidad |
| --- | --- | --- | --- |
| **Core** | BC04 — Service Requests | `src/service-requests/` | Tickets, asignaciones y diagnósticos |
| **Core** | BC03 — Subscriptions and Coverage | `src/subscriptions/` | Planes, saldo de horas y mantenimientos |
| **Supporting** | BC02 — Companies and Equipment | `src/equipment/` | Equipos, ubicaciones y su asignación |
| **Supporting** | BC05 — Quotations and Payments | `src/quotations/` | Cotizaciones y pagos simulados |
| **Generic** | BC01 — Identity and Access | `src/iam/` | Login, usuarios, sesión y permisos |

La interfaz se organiza en módulos con vistas `presentation`, lógica de aplicación y adaptadores HTTP `infrastructure`. **Las invariantes del dominio deben aplicarse y probarse en el backend**, no confiar exclusivamente en validaciones del navegador. Las clases de API del frontend constituyen consumidores de contratos HTTP; no son los agregados del dominio.

**Referencia de arquitectura:** [DDD — mapa de contextos, agregados y capas](https://github.com/upc-pre-202620-1asi0730-8093-UniLink/report/blob/main/docs/ddd-architecture.md).

## Requisitos para ejecución local

- Node.js y npm compatibles con Vite 8.
- Dos terminales (servidor de demostración y SPA).

```bash
npm install
```

Crea un archivo `.env.local` en la raíz del proyecto (no lo subas a GitHub):

```dotenv
VITE_UNILINK_API_URL=http://localhost:3000/api/v1
```

**Terminal 1 — API de demostración:**

```bash
npm run start
```

**Terminal 2 — Web Application:**

```bash
npm run dev
```

Accede a la URL local que indique Vite (normalmente `http://localhost:5173`).

> La API actual se encuentra en `server/server.js`, usa Node.js, JSON Server y `db.json`, y **solo sirve para desarrollo y demostración**. No es la API ASP.NET Core con Entity Framework Core exigida para la entrega. Contiene credenciales de prueba y simulación de correos; no se debe exponer públicamente como entorno productivo.

## Usuarios de demostración

Estas cuentas existen únicamente si se activa explícitamente el *seed* de desarrollo del backend C# con `DemoSeed__Enabled=true` y una contraseña privada `DemoSeed__Password` de **12 caracteres o más**. No deben exponerse credenciales reales en GitHub.

| Rol | Correo | Ruta inicial |
| --- | --- | --- |
| Administrador empresarial | `admin@mype.pe` | `/dashboard` |
| Empleado | `empleada@mype.pe` | `/my-tickets` |
| Técnico | `tecnico@unilink.pe` | `/technician` |
| Administrador UniLink | `soporte@unilink.pe` | `/admin/tickets` |

La contraseña pública `123456` correspondía al **servidor Node.js de demostración anterior**, no al backend ASP.NET Core ni a las cuentas de producción.

## Conexión con la REST API definitiva (ASP.NET Core)

La REST API oficial está en [UniLink/compucare-api](https://github.com/upc-pre-202620-1asi0730-8093-UniLink/compucare-api). No se copia el código C# dentro de este repositorio; las vistas Vue consumen sus recursos JSON mediante Axios.

**Pruebas locales, con la API C# y PostgreSQL ejecutándose:**

```dotenv
VITE_UNILINK_API_URL=http://localhost:5147/api/v1
```

Coloca esa variable en `.env.local` y ejecuta `npm run dev`. El servidor Node de `server/server.js` sigue disponible únicamente como simulador temporal. No ejecutes ambos servidores en el mismo puerto.

**Netlify (versión pública):** en *Site configuration → Environment variables*, establece `VITE_UNILINK_API_URL=https://TU-DOMINIO-RAILWAY/api/v1`, reemplazando el marcador con el dominio HTTPS auténtico de Railway, y ejecuta un nuevo despliegue. Esa URL se inserta **durante la compilación de Vite**. Debes configurar CORS en la API con el origen exacto de Netlify.

**Comprobación:** un usuario inicia sesión, crea una solicitud y otro usuario autorizado la ve desde su propia cuenta. Las solicitudes solo se comparten si ambos conectan a la misma API y a la misma base PostgreSQL; el backend debe aplicar permisos y filtros por rol/empresa.

## Scripts disponibles

| Comando | Acción |
| --- | --- |
| `npm run dev` | Ejecuta Vite en desarrollo |
| `npm run start` | Ejecuta la API de demostración |
| `npm run build` | Genera archivos estáticos en `dist/` |
| `npm run preview` | Sirve localmente la compilación de Vite |

## Internacionalización y accesibilidad

La navegación y parte de la interfaz soportan inglés (`en`) y español (`es`) mediante Vue I18n. El idioma inicial está configurado como **inglés** y se conserva la elección en `localStorage`. Las pantallas todavía necesitan una revisión completa para sustituir textos fijos, verificar etiquetas ARIA y comprobar que todo el recorrido sea accesible desde teclado.

## Despliegue y configuración

Para publicar en un hosting estático:

1. Construye con `npm run build`, publicando la carpeta `dist`.
2. Configura `VITE_UNILINK_API_URL` con una **API real HTTPS desplegada**, no `localhost`.
3. Mantén el fallback SPA de `public/_redirects` (`/* /index.html 200`) para rutas como `/login`.
4. Comprueba que la API permita CORS desde el dominio final y que las operaciones de los cinco BC funcionen tras recargar la página.

**Pendiente de AV2:** implementar y desplegar la API definitiva ASP.NET Core en C#, configurar persistencia relacional y reemplazar el servidor simulado. Los controles de autenticación/autorización deben proteger los endpoints en el servidor.

## Repositorios del equipo

- [Landing Page](https://github.com/upc-pre-202620-1asi0730-8093-UniLink/landing)
- [Project Report](https://github.com/upc-pre-202620-1asi0730-8093-UniLink/report)
