// API simulada de UniLink: json-server (persistencia en db.json) + reglas de negocio en middlewares.
// Solo para desarrollo: las claves van en texto plano y el JWT es HS256 casero (sin dependencias).
import jsonServer from 'json-server';
import crypto from 'crypto';
import path from 'path';
import {fileURLToPath} from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;
const SECRET = process.env.JWT_SECRET || 'unilink-dev-secret';

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const db = router.db;

// ---------- helpers ----------
const rows = (n) => db.get(n).value();
const now = () => new Date().toISOString();
const nextId = (n) => rows(n).reduce((m, r) => Math.max(m, r.id), 0) + 1;
const find = (n, id) => rows(n).find((r) => r.id === Number(id));
const insert = (n, obj) => { const rec = {id: nextId(n), ...obj}; db.get(n).push(rec).write(); return rec; };
const update = (n, id, changes) => db.get(n).find({id: Number(id)}).assign(changes).write();
const publicUser = ({password, ...u}) => u;
const byEmail = (email) => rows('users').find((u) => u.email.toLowerCase() === String(email || '').toLowerCase());
const nextMonth = () => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString(); };
const notify = (userId, message) => { insert('notifications', {userId, message, createdAt: now()}); console.log(`[correo simulado -> usuario ${userId}] ${message}`); };
const allow = (...roles) => (req, res, next) => roles.includes(req.user.role) ? next() : res.status(403).json({message: 'Acceso denegado'});
const bad = (res, message, code = 400) => res.status(code).json({message});

const OPEN = ['Pendiente de Asignación', 'Asignado', 'En Diagnóstico'];

// ---------- JWT HS256 ----------
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const hmac = (data) => crypto.createHmac('sha256', SECRET).update(data).digest('base64url');
const sign = (claims) => {
  const head = b64({alg: 'HS256', typ: 'JWT'});
  const body = b64({...claims, exp: Math.floor(Date.now() / 1000) + 8 * 3600});
  return `${head}.${body}.${hmac(`${head}.${body}`)}`;
};
const verify = (token) => {
  const [h, p, s] = String(token).split('.');
  if (!h || !p || !s || hmac(`${h}.${p}`) !== s) return null;
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  return payload.exp > Date.now() / 1000 ? payload : null;
};

// ---------- middlewares base ----------
server.use(jsonServer.defaults());
server.use(jsonServer.bodyParser);
server.use(jsonServer.rewriter({'/api/v1/*': '/$1'}));

server.use((req, res, next) => {
  const isPublic = req.method === 'OPTIONS' || req.path === '/' || req.path.startsWith('/auth/') ||
    (req.method === 'GET' && req.path.startsWith('/plans'));
  if (isPublic) return next();
  const payload = verify((req.headers.authorization || '').replace('Bearer ', ''));
  const user = payload && find('users', payload.sub);
  if (!user) return bad(res, 'No autorizado', 401);
  req.user = user;
  next();
});

// ---------- EP01 IAM ----------
// US-01 / US-06
server.post('/auth/login', (req, res) => {
  const {email, password} = req.body || {};
  const user = byEmail(email);
  if (!user || user.password !== password) return bad(res, 'Credenciales inválidas', 401);
  res.json({token: sign({sub: user.id, role: user.role, companyId: user.companyId}), tokenType: 'Bearer', user: publicUser(user)});
});

const createSubscription = (companyId, planId) => {
  const p = find('plans', planId);
  db.get('subscriptions').remove({companyId}).write();
  return insert('subscriptions', {companyId, planId: p.id, planName: p.name, hoursTotal: p.hours, hoursUsed: 0,
    preventiveTotal: p.preventiveVisits, preventiveUsed: 0, startedAt: now(), renewsAt: nextMonth(), status: 'active'});
};

// US-02 / US-29
server.post('/auth/register', (req, res) => {
  const {company = {}, admin = {}, planId, payment} = req.body || {};
  if (!/^\d{11}$/.test(company.ruc || '') || !company.name || !admin.name || !admin.email || !admin.password)
    return bad(res, 'Datos incompletos o RUC inválido (11 dígitos)');
  if (rows('companies').some((c) => c.ruc === company.ruc)) return bad(res, 'El RUC ya está registrado', 409);
  if (byEmail(admin.email)) return bad(res, 'El correo ya está registrado', 409);
  if (planId) {
    if (!find('plans', planId)) return bad(res, 'Plan inexistente');
    if (!payment?.holder || !/^\d{4}$/.test(payment?.last4 || '')) return bad(res, 'Datos de pago requeridos');
  }
  const c = insert('companies', {name: company.name, ruc: company.ruc, createdAt: now()});
  const u = insert('users', {name: admin.name, email: admin.email, password: admin.password, role: 'admin', companyId: c.id, phone: '', position: 'Administrador'});
  if (planId) createSubscription(c.id, planId);
  console.log(`[correo simulado -> ${u.email}] Confirmación de registro de ${c.name}`);
  res.status(201).json({user: publicUser(u), company: c});
});

// US-03
server.post('/auth/forgot-password', (req, res) => {
  const user = byEmail(req.body?.email);
  if (!user) return bad(res, 'No se encontró la cuenta', 404);
  const token = crypto.randomBytes(16).toString('hex');
  insert('resetTokens', {userId: user.id, token, expiresAt: Date.now() + 24 * 3600 * 1000});
  console.log(`[correo simulado -> ${user.email}] Token de recuperación (24 h): ${token}`);
  res.json({message: 'Enlace enviado', devToken: token});
});

server.post('/auth/reset-password', (req, res) => {
  const {token, password} = req.body || {};
  const t = rows('resetTokens').find((x) => x.token === token && x.expiresAt > Date.now());
  if (!t || !password || password.length < 6) return bad(res, 'Token inválido, vencido o clave muy corta');
  update('users', t.userId, {password});
  db.get('resetTokens').remove({token}).write();
  res.json({message: 'Contraseña actualizada'});
});

// US-04
server.get('/employees', allow('admin'), (req, res) =>
  res.json(rows('users').filter((u) => u.role === 'employee' && u.companyId === req.user.companyId).map(publicUser)));

server.post('/employees', allow('admin'), (req, res) => {
  const {name, email, position} = req.body || {};
  if (!name || !email) return bad(res, 'Nombre y correo son obligatorios');
  if (byEmail(email)) return bad(res, 'El correo ya está registrado', 409);
  const tempPassword = crypto.randomBytes(4).toString('hex');
  const u = insert('users', {name, email, position: position || '', phone: '', password: tempPassword, role: 'employee', companyId: req.user.companyId});
  console.log(`[correo simulado -> ${email}] Invitación. Clave temporal: ${tempPassword}`);
  res.status(201).json({...publicUser(u), tempPassword});
});

server.get('/technicians', allow('sysadmin'), (req, res) =>
  res.json(rows('users').filter((u) => u.role === 'technician').map(publicUser)));

// US-05
server.patch('/users/:id', (req, res) => {
  if (Number(req.params.id) !== req.user.id) return bad(res, 'Acceso denegado', 403);
  const changes = {};
  for (const k of ['name', 'phone']) if (req.body?.[k] !== undefined) changes[k] = req.body[k];
  update('users', req.user.id, changes);
  res.json(publicUser(find('users', req.user.id)));
});

server.put('/users/:id/password', (req, res) => {
  if (Number(req.params.id) !== req.user.id) return bad(res, 'Acceso denegado', 403);
  const {currentPassword, newPassword} = req.body || {};
  if (req.user.password !== currentPassword) return bad(res, 'La clave actual no coincide');
  if (!newPassword || newPassword.length < 6) return bad(res, 'La nueva clave debe tener al menos 6 caracteres');
  update('users', req.user.id, {password: newPassword});
  res.json({message: 'Contraseña actualizada'});
});

// ---------- EP02 Equipos y sedes ----------
// US-10
server.get('/locations', (req, res) => res.json(rows('locations').filter((l) => l.companyId === req.user.companyId)));

server.post('/locations', allow('admin'), (req, res) => {
  const {name, desk} = req.body || {};
  if (!name || !desk) return bad(res, 'Sede y escritorio son obligatorios');
  res.status(201).json(insert('locations', {companyId: req.user.companyId, name, desk, active: true}));
});

server.patch('/locations/:id', allow('admin'), (req, res) => {
  const l = find('locations', req.params.id);
  if (!l || l.companyId !== req.user.companyId) return bad(res, 'Ubicación no encontrada', 404);
  const changes = {};
  for (const k of ['name', 'desk', 'active']) if (req.body?.[k] !== undefined) changes[k] = req.body[k];
  update('locations', l.id, changes);
  res.json(find('locations', l.id));
});

const equipmentStatus = (e) => rows('tickets').some((t) => t.equipmentId === e.id && OPEN.includes(t.status)) ? 'En Reparación' : 'Operativo';

// US-11 / US-12 (GET)
server.get('/equipments', (req, res) => {
  const {status, type, locationId, q} = req.query;
  let list = rows('equipments').filter((e) => e.companyId === req.user.companyId);
  if (req.user.role === 'employee') list = list.filter((e) => e.assignedTo === req.user.id);
  list = list.map((e) => ({...e, status: equipmentStatus(e)}));
  if (status) list = list.filter((e) => e.status === status);
  if (type) list = list.filter((e) => e.type === type);
  if (locationId) list = list.filter((e) => e.locationId === Number(locationId));
  if (q) list = list.filter((e) => `${e.serialNumber} ${e.name} ${e.code}`.toLowerCase().includes(String(q).toLowerCase()));
  res.json(list);
});

// US-07 / US-12 (POST)
server.post('/equipments', allow('admin'), (req, res) => {
  const {serialNumber, type, name, locationId} = req.body || {};
  if (!serialNumber || !type || !name) return bad(res, 'Número de serie, tipo y nombre son obligatorios');
  if (rows('equipments').some((e) => e.serialNumber === serialNumber)) return bad(res, 'El número de serie ya existe', 409);
  if (locationId) {
    const l = find('locations', locationId);
    if (!l || l.companyId !== req.user.companyId || !l.active) return bad(res, 'Sede inexistente o inactiva');
  }
  const id = nextId('equipments');
  const e = insert('equipments', {companyId: req.user.companyId, code: `EQ-${String(id).padStart(4, '0')}`, name, serialNumber, type, locationId: locationId || null, assignedTo: null});
  res.status(201).json(e);
});

// US-08
server.put('/equipments/:id/assign', allow('admin'), (req, res) => {
  const e = find('equipments', req.params.id);
  if (!e || e.companyId !== req.user.companyId) return bad(res, 'Equipo no encontrado', 404);
  const employeeId = req.body?.employeeId ?? null;
  if (employeeId !== null) {
    const emp = find('users', employeeId);
    if (!emp || emp.role !== 'employee' || emp.companyId !== req.user.companyId) return bad(res, 'Empleado inválido');
  }
  update('equipments', e.id, {assignedTo: employeeId});
  insert('assignments', {equipmentId: e.id, employeeId, at: now()});
  res.json(find('equipments', e.id));
});

// US-09
server.get('/equipments/:id/history', allow('admin'), (req, res) => {
  const e = find('equipments', req.params.id);
  if (!e || e.companyId !== req.user.companyId) return bad(res, 'Equipo no encontrado', 404);
  const tickets = rows('tickets').filter((t) => t.equipmentId === e.id).map((t) => ({...t, quotes: rows('quotes').filter((q) => q.ticketId === t.id)}));
  res.json({
    equipment: {...e, status: equipmentStatus(e)},
    assignments: rows('assignments').filter((a) => a.equipmentId === e.id),
    tickets,
    maintenances: rows('maintenances').filter((m) => m.equipmentIds.includes(e.id))
  });
});

// ---------- EP03 Suscripciones ----------
const getSub = (companyId) => rows('subscriptions').find((s) => s.companyId === companyId);
const balanceOf = (s) => ({...s, hoursRemaining: Math.max(s.hoursTotal - s.hoursUsed, 0),
  preventiveRemaining: s.preventiveTotal - s.preventiveUsed, percentUsed: Math.round((s.hoursUsed / s.hoursTotal) * 100)});

// US-18 / US-14
server.get('/subscriptions/balance', allow('admin'), (req, res) => {
  const s = getSub(req.user.companyId);
  return s ? res.json(balanceOf(s)) : bad(res, 'Sin suscripción activa', 404);
});

// US-13
server.post('/subscriptions', allow('admin'), (req, res) => {
  const {planId, billing} = req.body || {};
  if (!find('plans', planId) || !billing?.name || !billing?.email) return bad(res, 'Plan y datos de facturación son obligatorios');
  res.status(201).json(balanceOf(createSubscription(req.user.companyId, planId)));
});

// US-16
server.post('/subscriptions/renew', allow('admin'), (req, res) => {
  const s = getSub(req.user.companyId);
  if (!s) return bad(res, 'Sin suscripción activa', 404);
  const p = find('plans', s.planId);
  update('subscriptions', s.id, {hoursTotal: p.hours, hoursUsed: 0, preventiveTotal: p.preventiveVisits, preventiveUsed: 0, startedAt: now(), renewsAt: nextMonth()});
  res.json(balanceOf(find('subscriptions', s.id)));
});

// US-15
server.get('/maintenances', allow('admin'), (req, res) => res.json(rows('maintenances').filter((m) => m.companyId === req.user.companyId)));

server.post('/maintenances', allow('admin'), (req, res) => {
  const {date, time, equipmentIds} = req.body || {};
  if (!date || !time || !Array.isArray(equipmentIds) || !equipmentIds.length) return bad(res, 'Fecha, hora y equipos son obligatorios');
  const s = getSub(req.user.companyId);
  if (!s || s.preventiveUsed >= s.preventiveTotal) return bad(res, 'No hay cupos preventivos disponibles');
  const valid = equipmentIds.every((id) => find('equipments', id)?.companyId === req.user.companyId);
  if (!valid) return bad(res, 'Equipos inválidos');
  const m = insert('maintenances', {companyId: req.user.companyId, date, time, equipmentIds: equipmentIds.map(Number), status: 'Agendado'});
  update('subscriptions', s.id, {preventiveUsed: s.preventiveUsed + 1});
  res.status(201).json(m);
});

// ---------- EP04 Tickets ----------
const addStatus = (t, status) => ({status, timeline: [...t.timeline, {status, at: now()}]});

server.get('/tickets', (req, res) => {
  const {role, id, companyId} = req.user;
  let list = rows('tickets');
  if (role === 'employee') list = list.filter((t) => t.employeeId === id);
  else if (role === 'admin') list = list.filter((t) => t.companyId === companyId);
  else if (role === 'technician') list = list.filter((t) => t.technicianId === id);
  const enrich = (t) => ({...t, equipmentName: find('equipments', t.equipmentId)?.name,
    employeeName: find('users', t.employeeId)?.name, technicianName: find('users', t.technicianId)?.name});
  res.json(list.map(enrich));
});

// US-19 / US-24
server.post('/tickets', allow('employee'), (req, res) => {
  const {equipmentId, category, description} = req.body || {};
  if (!equipmentId || !category || !description) return bad(res, 'equipmentId, category y description son obligatorios');
  const e = find('equipments', equipmentId);
  if (!e || e.assignedTo !== req.user.id) return bad(res, 'El equipo no está asignado a tu usuario');
  const status = 'Pendiente de Asignación';
  const t = insert('tickets', {companyId: req.user.companyId, employeeId: req.user.id, equipmentId: e.id, category, description,
    status, technicianId: null, paused: false, timeline: [{status, at: now()}], createdAt: now()});
  res.status(201).json(t);
});

// US-23
server.put('/tickets/:id/cancel', allow('employee'), (req, res) => {
  const t = find('tickets', req.params.id);
  if (!t || t.employeeId !== req.user.id) return bad(res, 'Ticket no encontrado', 404);
  if (t.status !== 'Pendiente de Asignación') return bad(res, 'Solo se pueden cancelar solicitudes pendientes');
  update('tickets', t.id, addStatus(t, 'Cancelado'));
  res.json(find('tickets', t.id));
});

// US-20
server.put('/tickets/:id/assign', allow('sysadmin'), (req, res) => {
  const t = find('tickets', req.params.id);
  const tech = find('users', req.body?.technicianId);
  if (!t) return bad(res, 'Ticket no encontrado', 404);
  if (t.status !== 'Pendiente de Asignación') return bad(res, 'El ticket ya fue asignado o cerrado');
  if (!tech || tech.role !== 'technician') return bad(res, 'Técnico inválido');
  update('tickets', t.id, {...addStatus(t, 'Asignado'), technicianId: tech.id});
  notify(tech.id, `Se te asignó el ticket #${t.id}`);
  res.json(find('tickets', t.id));
});

server.put('/tickets/:id/start', allow('technician'), (req, res) => {
  const t = find('tickets', req.params.id);
  if (!t || t.technicianId !== req.user.id) return bad(res, 'Ticket no encontrado', 404);
  if (t.status !== 'Asignado') return bad(res, 'El ticket no está en estado Asignado');
  update('tickets', t.id, addStatus(t, 'En Diagnóstico'));
  res.json(find('tickets', t.id));
});

// US-22 + US-14 (descuento) + US-17 (alerta 80%)
server.put('/tickets/:id/diagnosis', allow('technician'), (req, res) => {
  const t = find('tickets', req.params.id);
  if (!t || t.technicianId !== req.user.id) return bad(res, 'Ticket no encontrado', 404);
  if (!['Asignado', 'En Diagnóstico'].includes(t.status)) return bad(res, 'El ticket no admite cierre en este estado');
  if (t.paused) return bad(res, 'La orden está pausada por una cotización rechazada');
  const {diagnosis, workDone, hours} = req.body || {};
  if (!diagnosis || !workDone || !(Number(hours) > 0)) return bad(res, 'Diagnóstico, trabajo realizado y horas (> 0) son obligatorios');
  update('tickets', t.id, {...addStatus(t, 'Atendido'), diagnosis, workDone, hours: Number(hours)});
  const s = getSub(t.companyId);
  if (s) {
    const before = (s.hoursUsed / s.hoursTotal) * 100;
    const used = s.hoursUsed + Number(hours);
    update('subscriptions', s.id, {hoursUsed: used});
    if (before < 80 && (used / s.hoursTotal) * 100 >= 80)
      rows('users').filter((u) => u.role === 'admin' && u.companyId === t.companyId)
        .forEach((u) => notify(u.id, 'Has consumido el 80% de tu bolsa de horas. Evalúa un upgrade de plan.'));
  }
  res.json(find('tickets', t.id));
});

// ---------- EP05 Cotizaciones y pagos ----------
server.get('/quotes', (req, res) => {
  const {role, id, companyId} = req.user;
  let list = rows('quotes');
  if (role === 'admin') list = list.filter((q) => q.companyId === companyId);
  else if (role === 'technician') list = list.filter((q) => q.technicianId === id);
  else if (role !== 'sysadmin') return bad(res, 'Acceso denegado', 403);
  res.json(list);
});

// US-25
server.post('/quotes', allow('technician'), (req, res) => {
  const {ticketId, items} = req.body || {};
  const t = find('tickets', ticketId);
  if (!t || t.technicianId !== req.user.id) return bad(res, 'Ticket no encontrado', 404);
  if (!Array.isArray(items) || !items.length || !items.every((i) => i.description && Number(i.cost) > 0))
    return bad(res, 'Cada ítem requiere descripción y costo mayor a 0');
  const clean = items.map((i) => ({description: i.description, cost: Number(i.cost)}));
  const total = clean.reduce((sum, i) => sum + i.cost, 0);
  const q = insert('quotes', {ticketId: t.id, companyId: t.companyId, technicianId: req.user.id, items: clean, total, status: 'PENDING', createdAt: now()});
  rows('users').filter((u) => u.role === 'admin' && u.companyId === t.companyId)
    .forEach((u) => notify(u.id, `Nueva cotización #${q.id} pendiente de aprobación`));
  res.status(201).json(q);
});

// US-26 / US-30
server.put('/quotes/:id/status', allow('admin'), (req, res) => {
  const q = find('quotes', req.params.id);
  const {status} = req.body || {};
  if (!['APPROVED', 'REJECTED'].includes(status)) return bad(res, 'Estado inválido (APPROVED o REJECTED)');
  if (!q) return bad(res, 'Cotización no encontrada', 404);
  if (q.companyId !== req.user.companyId) return bad(res, 'La cotización no pertenece a tu empresa', 403);
  if (q.status !== 'PENDING') return bad(res, 'La cotización ya fue resuelta');
  update('quotes', q.id, {status});
  update('tickets', q.ticketId, {paused: status === 'REJECTED'});
  if (status === 'APPROVED') notify(q.technicianId, `Cotización #${q.id} aprobada, puedes proceder`);
  res.json(find('quotes', q.id));
});

// US-28
server.post('/quotes/:id/pay', allow('admin'), (req, res) => {
  const q = find('quotes', req.params.id);
  if (!q || q.companyId !== req.user.companyId) return bad(res, 'Cotización no encontrada', 404);
  if (q.status !== 'APPROVED') return bad(res, 'Solo se pueden pagar cotizaciones aprobadas');
  if (!req.body?.holder || !/^\d{4}$/.test(req.body?.last4 || '')) return bad(res, 'Datos de tarjeta de prueba requeridos');
  update('quotes', q.id, {status: 'PAID', paidAt: now(), receipt: `REC-${String(q.id).padStart(5, '0')}`});
  res.json(find('quotes', q.id));
});

server.get('/notifications', (req, res) =>
  res.json(rows('notifications').filter((n) => n.userId === req.user.id).reverse()));

// ---------- bloqueo de CRUD genérico y router ----------
server.use((req, res, next) => {
  const resource = req.path.split('/')[1];
  return req.method === 'GET' && ['plans', 'companies'].includes(resource) ? next() : bad(res, 'Operación no permitida', 403);
});
server.use(router);
server.listen(PORT, () => console.log(`UniLink API en http://localhost:${PORT}/api/v1`));
