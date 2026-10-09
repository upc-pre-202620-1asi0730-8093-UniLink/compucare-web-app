# UniLink

Plataforma web de soporte técnico por suscripción para MYPE. Estructura tomada de `learning-center`:
Vue 3 + Vite + Pinia + PrimeVue + Axios, con una API simulada en json-server.

## Cómo correrlo

```bash
npm install
# Terminal 1: API simulada (http://localhost:3000/api/v1)
npm run api
# Terminal 2: frontend (http://localhost:5173)
npm run dev
```

Pega tu licencia de PrimeUI en `.env.development` (`VITE_PRIME_UI_LICENSE_KEY`), igual que en learning-center.

## Usuarios de prueba (clave `123456`)

| Rol | Correo | Entra a |
|---|---|---|
| Administrador de MYPE | admin@mype.pe | /dashboard |
| Empleado | empleada@mype.pe | /my-tickets |
| Técnico de soporte | tecnico@unilink.pe | /technician |
| Administrador del sistema | soporte@unilink.pe | /admin/tickets |

## Estructura (bounded contexts, igual que learning-center)

```
src/
  shared/            BaseApi (con JWT), BaseEndpoint, layout, home, notificaciones
  iam/               EP01  login, registro, recuperación, empleados, perfil
  equipment/         EP02  equipos, sedes, asignación, historial
  subscriptions/     EP03  planes, bolsa de horas, preventivos, renovación
  service-requests/  EP04  tickets (empleado, sysadmin, técnico)
  quotations/        EP05  cotizaciones, aprobación, gastos, pago simulado
  <contexto>/infrastructure  *-api.js   (extiende BaseApi)
  <contexto>/application     *.store.js (Pinia)
  <contexto>/presentation    views + *-routes.js
server/
  db.json            datos semilla
  server.js          json-server + reglas de negocio + JWT
```

## Trazabilidad de user stories

| US | Dónde |
|---|---|
| 01, 06 | `sign-in.vue`, guard en `router.js`, `POST /auth/login` |
| 02, 29 | `sign-up.vue` (plan y pago simulado opcional), `POST /auth/register` |
| 03 | `forgot-password.vue`, token de 24 h |
| 04 | `employees.vue`, `POST /employees` |
| 05 | `profile.vue`, `PATCH /users/:id`, `PUT /users/:id/password` |
| 07, 12 | `equipment-list.vue`, `/equipments` |
| 08 | diálogo "Asignar" en `equipment-list.vue` |
| 09 | `equipment-history.vue` |
| 10 | `locations.vue` |
| 11 | filtros en `equipment-list.vue` |
| 13 | `plans.vue`, `POST /subscriptions` |
| 14, 18 | `dashboard.vue`, `GET /subscriptions/balance` |
| 15 | `maintenance.vue`, `/maintenances` |
| 16 | botón "Renovar periodo", `POST /subscriptions/renew` |
| 17 | aviso en `dashboard.vue` + notificación al cruzar 80 % |
| 19, 24 | `my-tickets.vue`, `POST /tickets` |
| 20 | `admin-tickets.vue` |
| 21 | línea de tiempo en `my-tickets.vue` |
| 22 | `technician-tickets.vue` (cierre con horas) |
| 23 | cancelar en `my-tickets.vue` |
| 25 | cotizar en `technician-tickets.vue` |
| 26, 30 | `quotes.vue`, `PUT /quotes/:id/status` |
| 27 | sección "Gastos adicionales del mes" en `quotes.vue` |
| 28 | diálogo de pago simulado en `quotes.vue` |

## Notas

- Los correos son simulados: salen por la consola de `npm run api` y como notificaciones en `/notifications`.
- Solo desarrollo: claves en texto plano en `db.json` y JWT HS256 casero. No es para producción.
- Respecto a learning-center se simplificó: sin i18n y sin entities/assemblers (las vistas usan los objetos JSON directo).
