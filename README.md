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
