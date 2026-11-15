# CompuCare — Cuentas y datos de prueba

> Todos los datos son ficticios y existen en la base de datos de Azure usada por la versión publicada.
> Los estados de tickets, cotizaciones y horas pueden cambiar a medida que el equipo realiza pruebas.

## Dónde probar

| Qué | URL |
| --- | --- |
| **Aplicación web (frontend)** | `https://white-hill-0d2509f1e.6.azurestaticapps.net` |
| API en Azure | `https://compucare-platform-f0brhkh5eff7b5d4.westus-01.azurewebsites.net/api/v1` |
| Scalar (probar endpoints) | `https://compucare-platform-f0brhkh5eff7b5d4.westus-01.azurewebsites.net/scalar/v1` |
| Frontend local contra Azure | en `.env.local`: `VITE_UNILINK_API_URL=https://compucare-platform-f0brhkh5eff7b5d4.westus-01.azurewebsites.net/api/v1` y luego `npm run dev` |

En Scalar: ejecuta `POST /api/v1/auth/login`, copia el `token` de la respuesta y pégalo en **Authentication → Bearer** para usar los demás endpoints.

## Cuentas

**Todas las cuentas usan la misma contraseña:** `Demo-i5kXZpR9aB!`

| Rol | Correo | Nombre | Empresa | Qué puede hacer |
| --- | --- | --- | --- | --- |
| `sysadmin` | `soporte@unilink.pe` | Soporte UniLink | UniLink | Ver todos los tickets y cotizaciones, asignar técnicos |
| `technician` | `tecnico@unilink.pe` | Diego Paredes | UniLink | Iniciar diagnóstico, cotizar y cerrar sus tickets asignados |
| `admin` | `admin@mype.pe` | María Fernández | CompuCare demo company | Sedes, equipos, empleados, suscripción, mantenimientos, aprobar/pagar cotizaciones |
| `employee` | `empleada@mype.pe` | Ana Quispe | CompuCare demo company | Reportar fallas de sus equipos y ver sus tickets |
| `employee` | `carlos.ramos@mype.pe` | Carlos Ramos | CompuCare demo company | Ídem |
| `employee` | `lucia.torres@mype.pe` | Lucía Torres | CompuCare demo company | Ídem |
| `employee` | `jorge.salas@mype.pe` | Jorge Salas | CompuCare demo company | Ídem |
| `admin` | `gerencia@andina.pe` | Rosa Mendoza | Bodega Andina S.A.C. | Igual que el admin, para su empresa |
| `employee` | `pedro.huaman@andina.pe` | Pedro Huamán | Bodega Andina S.A.C. | Igual que un empleado, para su empresa |

## Empresas

### CompuCare demo company — RUC `20123456789`

**Suscripción:** plan **Empresarial** (8 h de soporte, 2 visitas preventivas). Usadas: **3,5 h** y **1 visita**.

**Sedes**

| Sede | Puesto | Estado |
| --- | --- | --- |
| Lima Central Office | Desk 1 | Activa |
| Sede San Isidro | Recepción | Activa |
| Sede Miraflores | Piso 2 - Contabilidad | Activa |
| Almacén Ate | Mesa 1 | **Inactiva** |

**Equipos**

| Equipo | N.º de serie | Tipo | Asignado a | Estado |
| --- | --- | --- | --- | --- |
| Office workstation | DEMO-COMPUCARE-001 | Desktop | Ana Quispe | Operativo |
| Laptop Lenovo ThinkPad E14 | SN-LNV-0001 | Laptop | Carlos Ramos | En Reparación |
| Laptop HP ProBook 450 | SN-HP-0002 | Laptop | Lucía Torres | En Reparación |
| PC Dell OptiPlex 7010 | SN-DELL-0004 | Desktop | Jorge Salas | En Reparación |
| Impresora Epson L3250 | SN-EPS-0003 | Impresora | Jorge Salas | En Reparación |
| Router TP-Link Archer C6 | SN-TPL-0006 | Red | — (sin asignar) | Operativo |
| Monitor LG 24MP400 | SN-LG-0005 | Otro | — (sin asignar) | Operativo |

**Mantenimiento preventivo:** 05/12/2026 a las 10:00 — PC Dell OptiPlex 7010 e Impresora Epson L3250.

**Tickets**

| # | Empleado | Equipo | Categoría | Estado | Detalle |
| --- | --- | --- | --- | --- | --- |
| 1 | Ana Quispe | Office workstation | Hardware | **Atendido** | Cotización #1 (S/ 150.00) aprobada y **pagada**; 2 h consumidas |
| 2 | Carlos Ramos | Lenovo ThinkPad | Hardware | **En Diagnóstico** | Cotización #2 (S/ 45.50) **pendiente** de aprobación |
| 3 | Lucía Torres | HP ProBook | Hardware | **Asignado** (pausado) | Cotización #3 (S/ 85.00) **rechazada** → ticket en pausa |
| 4 | Jorge Salas | Dell OptiPlex | Red | **Asignado** | El técnico aún no inicia |
| 5 | Jorge Salas | Impresora Epson | Impresión | **Pendiente de Asignación** | Nadie lo ha asignado |
| 6 | Carlos Ramos | Lenovo ThinkPad | Software | **Cancelado** | Cancelado por el empleado |
| 7 | Ana Quispe | Office workstation | Software | **Atendido** | Sin cotización; 1,5 h consumidas |

### Bodega Andina S.A.C. — RUC `20601234567`

**Suscripción:** plan **Integral** (16 h, 4 visitas), sin consumo.

| Sede | Equipos | Tickets |
| --- | --- | --- |
| Local Principal Surquillo / Caja 1 | PC Caja Registradora (SN-AND-0001, asignada a Pedro Huamán) · Servidor de inventario (SN-AND-0002, sin asignar) | #8 — Pedro Huamán — Hardware — **Pendiente de Asignación** |

## Planes

| Id | Plan | Precio | Horas | Visitas preventivas |
| --- | --- | --- | --- | --- |
| 1 | Básico | S/ 240 | 4 | 1 |
| 2 | Empresarial | S/ 550 | 8 | 2 |
| 3 | Integral | S/ 600 | 16 | 4 |

## Valores para formularios

| Formulario | Valores de prueba |
| --- | --- |
| Pago simulado (registro y cotizaciones) | Titular: cualquier nombre · Últimos 4 dígitos: `4242`. No se guarda ningún dato de tarjeta. |
| Registrar una empresa nueva | Nombre: `Ferretería El Sol E.I.R.L.` · RUC: `20512345678` (11 dígitos, no usado) · Admin: `admin@elsol.pe` · Contraseña: mínimo 6 caracteres |
| RUC ya registrado (debe dar error 409) | `20123456789` o `20601234567` |
| Crear empleado | Nombre, correo nuevo (ej. `nuevo.empleado@mype.pe`), cargo opcional |
| Reportar ticket | Categoría: `Hardware`, `Software`, `Red`, `Impresión` u `Otro` · Descripción de **10 caracteres o más** |
| Registrar equipo | Tipo: `Desktop`, `Laptop`, `Impresora`, `Servidor`, `Red` u `Otro` · N.º de serie nuevo (ej. `SN-NEW-0100`) |
| Agendar mantenimiento | Fecha `AAAA-MM-DD` de hoy en adelante · Hora `HH:mm` · Equipos de la misma empresa |
| Cerrar ticket (técnico) | Diagnóstico, trabajo realizado y horas (> 0, sin superar las horas restantes del plan) |

## Recorridos sugeridos

1. **Flujo completo de un ticket.**
   1. Como `sysadmin`, asigna el ticket **#5** a Diego Paredes.
   2. Como `technician`, inícialo y crea una cotización.
   3. Como `admin@mype.pe`, apruébala y págala.
   4. Como `technician`, ciérralo con 1 h.
   5. Como `jorge.salas@mype.pe`, verás el ticket **Atendido** y el saldo de horas de la empresa bajará.
2. **Cotización pendiente.** Como `admin@mype.pe`, aprueba la cotización **#2**. Después, como `technician`, cierra el ticket **#2**.
3. **Ticket pausado.** El ticket **#3** no se puede cerrar porque tiene la cotización **#3** rechazada (debe dar error 409). Como `technician`, crea una cotización nueva para ese ticket.
4. **Alerta del 80 %.** La empresa A lleva 3,5 de 8 h. Si cierras tickets hasta superar 6,4 h, los administradores reciben la notificación de que se usó el 80 % de las horas.
5. **Aislamiento entre empresas.** `gerencia@andina.pe` no ve los equipos ni los tickets de la empresa A. Un empleado no puede asignar técnicos (debe dar error 403).
6. **Idiomas.** Cambia la interfaz a ES/EN: los mensajes de error de la API llegan en el idioma elegido.

## Notas

- Para restablecer una contraseña olvidada: en Azure (modo Production) se envía un correo, y **no hay SMTP configurado**, así que devolverá un error. La recuperación solo funciona con el backend local en modo Development, que devuelve el código en la respuesta.
- Crear empleados en Azure tiene la misma limitación: requiere SMTP para enviar la contraseña temporal. Los empleados de este documento se crearon con el backend local conectado a la base de Azure.
