const token = localStorage.getItem('token'),
  user = JSON.parse(localStorage.getItem('usuario') || 'null');
if (!token || user?.rol !== 'Administrador') location.href = '/';
const api = async (url, opt = {}) => {
  const isForm = opt.body instanceof FormData;
  const headers = { Authorization: 'Bearer ' + token, ...opt.headers };
  if (!isForm) headers['Content-Type'] = 'application/json';
  const r = await fetch('/api' + url, { ...opt, headers });
  const d = await r.json().catch(() => ({}));
  if (!r.ok)
    throw Error(
      Array.isArray(d.message) ? d.message.join(', ') : d.message || 'Error',
    );
  return d;
};
const modules = [
  ['Panel Principal', 'dashboard', '<i class="fa-solid fa-house"></i>'],
  ['Habitaciones', 'habitaciones', '<i class="fa-solid fa-bed"></i>'],
  [
    'Reservaciones',
    'reservaciones',
    '<i class="fa-solid fa-calendar-days"></i>',
  ],
  ['Recepción', 'recepcion', '<i class="fa-solid fa-bell"></i>'],
  ['Limpieza', 'limpieza', '<i class="fa-solid fa-broom"></i>'],
  ['Usuarios', 'usuarios', '<i class="fa-solid fa-user-gear"></i>'],
  [
    'Tipos de habitación',
    'tipos-habitacion',
    '<i class="fa-solid fa-key"></i>',
  ],
  ['Reportes', 'reportes', '<i class="fa-solid fa-chart-line"></i>'],
];
// Inyectamos el icono junto al nombre (x[2] es el icono y x[0] el texto)
nav.innerHTML = modules
  .map(
    (x) =>
      `<button onclick="load('${x[1]}','${x[0]}')">${x[2]} ${x[0]}</button>`,
  )
  .join('');
function logout() {
  localStorage.clear();
  location.href = '/';
}
function esc(v) {
  return String(v ?? '').replace(
    /[&<>"']/g,
    (m) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
      })[m],
  );
}
function table(rows) {
  if (!rows?.length) return '<div class="box empty">Sin registros</div>';
  const ks = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object');
  return `<div class="box table-wrap"><table><thead><tr>${ks.map((k) => `<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${ks.map((k) => `<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
async function load(id, label) {
  title.textContent = label;
  content.innerHTML = '<div class="box">Cargando...</div>';
  try {
    if (id === 'dashboard') return dash();
    if (id === 'habitaciones') return habitaciones();
    if (id === 'reservaciones') return reservaciones();
    if (id === 'recepcion') return recepcion();
    if (id === 'limpieza') return limpieza();
    if (id === 'reportes') return reportes();
    return crud(id);
  } catch (e) {
    content.innerHTML = `<p class=error>${esc(e.message)}</p>`;
  }
}
async function dash() {
  const d = await api('/reportes/dashboard');
  content.innerHTML = `<div class=cards><div class=card>Ocupación<strong>${d.porcentajeOcupacion}%</strong></div><div class=card>Reservaciones confirmadas<strong>${d.reservacionesConfirmadas}</strong></div>${d.estados.map((x) => `<div class=card>${esc(x.nombre)}<strong>${x.total}</strong></div>`).join('')}</div>`;
}
function habitacionCard(h, tipos) {
  return `<article class="room-card ${h.activa ? '' : 'inactive'}"><div class="room-photo">${h.fotoUrl ? `<img src="${esc(h.fotoUrl)}" alt="Habitación ${esc(h.numero)}">` : '<span>Sin fotografía</span>'}</div><div class="room-body"><div class="room-title"><h3>Habitación ${esc(h.numero)}</h3><span class="badge">${esc(h.estado?.nombre || 'Sin estado')}</span></div><p>Piso: ${esc(h.piso ?? '-')} · ${esc(h.tipo?.nombre || 'Sin tipo')}</p><p>${esc(h.observaciones || 'Sin observaciones')}</p><div class="actions"><button class="primary" onclick='editarHabitacion(${JSON.stringify(h).replace(/'/g, '&#39;')})'>Editar</button><label class="file-button">Foto<input type="file" accept="image/png,image/jpeg,image/webp" onchange="subirFoto(${h.id},this)"></label>${h.fotoUrl ? `<button onclick="eliminarFoto(${h.id})">Quitar foto</button>` : ''}<button class="danger" onclick="eliminarHabitacion(${h.id})">Eliminar</button></div></div></article>`;
}
async function habitaciones() {
  const [rows, tipos] = await Promise.all([
    api('/habitaciones'),
    api('/tipos-habitacion'),
  ]);
  window.tiposHabitacion = tipos;
  content.innerHTML = `<div class="box"><h3 id="habitacionFormTitulo">Nueva habitación</h3><form id="habitacionForm"><input type=hidden name=id><input name=numero placeholder="Número" required><input name=piso type=number placeholder="Piso"><select name=tipoId>${tipos.map((t) => `<option value=${t.id}>${esc(t.nombre)}</option>`)}</select><input name=estadoId type=number value=1 placeholder="ID estado"><textarea name=observaciones placeholder="Observaciones"></textarea><button class=primary>Guardar habitación</button><button class="primary danger" type=button onclick="limpiarHabitacionForm()">Cancelar edición</button></form></div><div class="room-grid">${rows.map((h) => habitacionCard(h, tipos)).join('')}</div>`;
  habitacionForm.onsubmit = guardarHabitacion;
}
async function guardarHabitacion(e) {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(e.target));
  const id = d.id;
  delete d.id;
  await api(id ? `/habitaciones/${id}` : '/habitaciones', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(d),
  });
  habitaciones();
}
function editarHabitacion(h) {
  const f = document.getElementById('habitacionForm');
  f.id.value = h.id;
  f.numero.value = h.numero;
  f.piso.value = h.piso ?? '';
  f.tipoId.value = h.tipoId ?? '';
  f.estadoId.value = h.estadoId ?? 1;
  f.observaciones.value = h.observaciones ?? '';
  habitacionFormTitulo.textContent = 'Editar habitación ' + h.numero;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function limpiarHabitacionForm() {
  habitaciones();
}
async function subirFoto(id, input) {
  if (!input.files[0]) return;
  const fd = new FormData();
  fd.append('foto', input.files[0]);
  await api(`/habitaciones/${id}/foto`, { method: 'POST', body: fd });
  habitaciones();
}
async function eliminarFoto(id) {
  if (!confirm('¿Quitar la fotografía?')) return;
  await api(`/habitaciones/${id}/foto`, { method: 'DELETE' });
  habitaciones();
}
async function eliminarHabitacion(id) {
  if (
    !confirm(
      'La habitación se desactivará para conservar su historial. ¿Continuar?',
    )
  )
    return;
  await api(`/habitaciones/${id}`, { method: 'DELETE' });
  habitaciones();
}
async function crud(id) {
  const rows = await api('/' + id);
  let fields =
    id === 'huespedes'
      ? [
          'nombre',
          'apellidoPaterno',
          'apellidoMaterno',
          'telefono',
          'correo',
          'direccion',
          'identificacion',
        ]
      : id === 'usuarios'
        ? [
            'nombre',
            'apellidoPaterno',
            'correo',
            'usuario',
            'password',
            'rolId',
          ]
        : ['nombre', 'descripcion', 'capacidad', 'camas', 'precio'];
  content.innerHTML = `<div class=box><form id=f>${fields.map((x) => `<input name=${x} placeholder="${x}" ${x === 'password' ? 'type=password' : ''}>`).join('')}<button class=primary>Guardar</button></form></div>${table(rows)}`;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f));
    await api('/' + id, { method: 'POST', body: JSON.stringify(d) });
    crud(id);
  };
}
function detalleHabitaciones(raw) {
  return String(raw || '')
    .split(',')
    .filter(Boolean)
    .map((x) => {
      const [numero, foto] = x.split('|');
      return `<div class="selected-room">${foto ? `<img src="${esc(foto)}">` : ''}<span>Hab. ${esc(numero)}</span></div>`;
    })
    .join('');
}
function reservaCard(r) {
  return `<article class="reservation-card"><div><span class="folio">${esc(r.folio)}</span><span class="status status-${String(r.estado).toLowerCase().replaceAll(' ', '-')}">${esc(r.estado)}</span></div><h3>${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')}</h3><p>${esc(String(r.fecha_inicio).slice(0, 10))} → ${esc(String(r.fecha_fin).slice(0, 10))}</p><div class="selected-rooms">${detalleHabitaciones(r.habitaciones_detalle)}</div><small>Registró: ${esc(r.recepcionista_nombre || 'Recepción')}</small><div class="actions">${r.estado === 'En proceso' ? `<button class=primary onclick="cambiarReserva(${r.id},'Confirmada')">Confirmar</button>` : ''}${!['Cancelada', 'Finalizada'].includes(r.estado) ? `<button onclick='editarReserva(${JSON.stringify(r).replace(/'/g, '&#39;')})'>Modificar</button><button class=danger onclick="cambiarReserva(${r.id},'Cancelada')">Cancelar</button>` : ''}</div></article>`;
}
async function reservaciones() {
  const [rows, hues] = await Promise.all([
    api('/reservaciones'),
    api('/huespedes'),
  ]);
  window.huespedesReserva = hues;
  content.innerHTML = `<section class="reservation-hero"><div><p class="eyebrow">Módulo de recepción</p><h2>Nueva reservación</h2><p>Consulta disponibilidad, selecciona visualmente las habitaciones y confirma la estancia.</p></div></section><div class="box"><form id="reservaForm"><input type=hidden name=id><select name=huespedId required><option value="">Selecciona huésped</option>${hues.map((h) => `<option value=${h.id}>${esc(h.nombre)} ${esc(h.apellidoPaterno || '')}</option>`)}</select><input name=fechaInicio type=date required><input name=fechaFin type=date required><input name=adultos type=number min=1 value=1><input name=menores type=number min=0 value=0><button type=button class=primary onclick="buscarDisponibles()">Buscar disponibilidad</button></form><div id="availableRooms" class="available-grid"></div><div class="reservation-submit"><label><input id=confirmarReserva type=checkbox checked> Confirmar reservación inmediatamente</label><button class=primary onclick="guardarReserva()">Guardar reservación</button><button onclick="limpiarReserva()">Limpiar</button></div></div><div class="section-title"><h2>Reservaciones registradas</h2><button onclick="api('/reservaciones/liberar-expiradas',{method:'POST'}).then(()=>reservaciones())">Liberar bloqueos vencidos</button></div><div class="reservation-grid">${rows.map(reservaCard).join('')}</div>`;
}
async function buscarDisponibles() {
  const f = reservaForm;
  if (!f.fechaInicio.value || !f.fechaFin.value)
    return alert('Selecciona las fechas');
  const rooms = await api(
    `/reservaciones/disponibles?inicio=${encodeURIComponent(f.fechaInicio.value)}&fin=${encodeURIComponent(f.fechaFin.value)}`,
  );
  availableRooms.innerHTML = rooms.length
    ? rooms
        .map(
          (h) =>
            `<label class="available-room"><input type=checkbox name=habitacionIds value=${h.id}><div class="room-photo">${h.fotoUrl ? `<img src="${esc(h.fotoUrl)}">` : '<span>Sin foto</span>'}</div><strong>Habitación ${esc(h.numero)}</strong><span>${esc(h.tipo?.nombre || 'Sin tipo')} · Piso ${esc(h.piso ?? '-')}</span></label>`,
        )
        .join('')
    : '<p>No hay habitaciones disponibles para esas fechas.</p>';
}
async function guardarReserva() {
  const f = reservaForm;
  const ids = [
    ...document.querySelectorAll('input[name=habitacionIds]:checked'),
  ].map((x) => Number(x.value));
  const d = {
    huespedId: Number(f.huespedId.value),
    fechaInicio: f.fechaInicio.value,
    fechaFin: f.fechaFin.value,
    adultos: Number(f.adultos.value),
    menores: Number(f.menores.value),
    habitacionIds: ids,
    confirmar: confirmarReserva.checked,
  };
  if (!d.huespedId || !ids.length)
    return alert('Selecciona huésped y habitación');
  const id = f.id.value;
  await api(id ? `/reservaciones/${id}` : '/reservaciones', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(d),
  });
  reservaciones();
}
async function editarReserva(r) {
  await reservaciones();
  const f = reservaForm;
  f.id.value = r.id;
  f.huespedId.value = r.huesped_id;
  f.fechaInicio.value = String(r.fecha_inicio).slice(0, 10);
  f.fechaFin.value = String(r.fecha_fin).slice(0, 10);
  f.adultos.value = r.adultos;
  f.menores.value = r.menores;
  await buscarDisponibles();
  const nums = String(r.habitaciones_detalle || '')
    .split(',')
    .map((x) => x.split('|')[0]);
  const all = await api('/habitaciones');
  all
    .filter((h) => nums.includes(String(h.numero)))
    .forEach((h) => {
      const cb = document.querySelector(
        `input[name=habitacionIds][value="${h.id}"]`,
      );
      if (cb) cb.checked = true;
    });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function limpiarReserva() {
  reservaciones();
}
async function cambiarReserva(id, estado) {
  if (estado === 'Cancelada' && !confirm('¿Cancelar esta reservación?')) return;
  await api(`/reservaciones/${id}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ estado }),
  });
  reservaciones();
}
async function recepcion() {
  const [res, h] = await Promise.all([
    api('/reservaciones'),
    api('/recepcion/historial'),
  ]);
  content.innerHTML = `<div class=cards><div class=box><h3>Check-in</h3><form id=fi><input name=reservacionId type=number placeholder="ID reservación"><textarea name=observaciones placeholder=Observaciones></textarea><button class=primary>Registrar</button></form></div><div class=box><h3>Check-out</h3><form id=fo><input name=reservacionId type=number placeholder="ID reservación"><textarea name=observaciones placeholder=Observaciones></textarea><button class=primary>Registrar</button></form></div></div><h3>Reservaciones</h3>${table(res)}<h3>Historial</h3>${table(h)}`;
  fi.onsubmit = (e) => sendForm(e, '/recepcion/checkin', recepcion);
  fo.onsubmit = (e) => sendForm(e, '/recepcion/checkout', recepcion);
}
async function sendForm(e, url, cb) {
  e.preventDefault();
  await api(url, {
    method: 'POST',
    body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
  });
  cb();
}
async function limpieza() {
  const [rows, hs, us, obs] = await Promise.all([
    api('/limpieza'),
    api('/habitaciones'),
    api('/usuarios'),
    api('/limpieza/observaciones'),
  ]);
  const cams = us.filter((x) => x.rol?.nombre === 'Camarista');
  content.innerHTML = `<div class=box><form id=f><select name=habitacionId>${hs.filter((x) => x.activa).map((x) => `<option value=${x.id}>${esc(x.numero)}</option>`)}</select><select name=camaristaId>${cams.map((x) => `<option value=${x.id}>${esc(x.nombre)}</option>`)}</select><input name=fecha type=date value=${new Date().toISOString().slice(0, 10)}><button class=primary>Asignar</button></form></div><h3>Asignaciones</h3>${table(rows)}<h3>Observaciones</h3>${table(obs)}`;
  f.onsubmit = (e) => sendForm(e, '/limpieza/asignar', limpieza);
}
async function reportes() {
  const [o, t] = await Promise.all([
    api('/reportes/ocupacion'),
    api('/reportes/habitaciones-utilizadas'),
  ]);
  content.innerHTML =
    '<h3>Ocupación</h3>' +
    table(o) +
    '<h3>Habitaciones más utilizadas</h3>' +
    table(t);
}
// CRUD completo para los catálogos visibles en el panel.
const camposCrud = {
  huespedes: [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'telefono',
    'correo',
    'direccion',
    'identificacion',
  ],
  usuarios: [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'telefono',
    'correo',
    'usuario',
    'password',
    'rolId',
  ],
  'tipos-habitacion': ['nombre', 'descripcion', 'capacidad', 'camas', 'precio'],
};
async function crud(id) {
  const rows = await api('/' + id),
    fields = camposCrud[id] || ['nombre'];
  const visibles = fields.filter((x) => x !== 'password');
  content.innerHTML = `<div class=box><h3 id=crudTitle>Nuevo registro</h3><form id=f><input type=hidden name=id>${fields.map((x) => `<input name=${x} placeholder="${x}" ${x === 'password' ? 'type=password' : ''} ${x === 'nombre' ? 'required' : ''}>`).join('')}<button class=primary>Guardar</button><button class="primary danger" type=button onclick="crud('${id}')">Cancelar edición</button></form></div><div class="box table-wrap"><table><thead><tr>${visibles.map((x) => `<th>${esc(x)}</th>`).join('')}<th>Acciones</th></tr></thead><tbody>${rows.map((r) => `<tr>${visibles.map((x) => `<td>${esc(r[x] ?? (x === 'rolId' ? r.rol?.nombre : ''))}</td>`).join('')}<td class=actions><button onclick='editarCrud(${JSON.stringify(id)},${JSON.stringify(r).replace(/'/g, '&#39;')})'>Editar</button><button class=danger onclick="eliminarCrud('${id}',${r.id})">Eliminar</button></td></tr>`).join('')}</tbody></table></div>`;
  f.onsubmit = async (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(f)),
      itemId = d.id;
    delete d.id;
    if (itemId && !d.password) delete d.password;
    await api('/' + id + (itemId ? '/' + itemId : ''), {
      method: itemId ? 'PATCH' : 'POST',
      body: JSON.stringify(d),
    });
    crud(id);
  };
}
function editarCrud(id, row) {
  const form = document.getElementById('f');
  form.id.value = row.id;
  (camposCrud[id] || []).forEach((campo) => {
    if (campo !== 'password' && form[campo])
      form[campo].value =
        row[campo] ?? (campo === 'rolId' ? row.rol?.id : '') ?? '';
  });
  crudTitle.textContent = 'Editar registro';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function eliminarCrud(id, itemId) {
  if (!confirm('¿Eliminar este registro de la base de datos?')) return;
  try {
    await api(`/${id}/${itemId}`, { method: 'DELETE' });
    crud(id);
  } catch (e) {
    alert(
      e.message +
        '. Si tiene historial relacionado, el registro no puede eliminarse.',
    );
  }
}

function reservaCard(r) {
  return `<article class="reservation-card"><div><span class="folio">${esc(r.folio)}</span><span class="status status-${String(r.estado).toLowerCase().replaceAll(' ', '-')}">${esc(r.estado)}</span></div><h3>${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')}</h3><p>${esc(String(r.fecha_inicio).slice(0, 10))} → ${esc(String(r.fecha_fin).slice(0, 10))}</p><div class="selected-rooms">${detalleHabitaciones(r.habitaciones_detalle)}</div><small>Registró: ${esc(r.recepcionista_nombre || 'Recepción')}</small><div class="actions">${r.estado === 'En proceso' ? `<button class=primary onclick="cambiarReserva(${r.id},'Confirmada')">Confirmar</button>` : ''}${!['Cancelada', 'Finalizada'].includes(r.estado) ? `<button onclick='editarReserva(${JSON.stringify(r).replace(/'/g, '&#39;')})'>Modificar</button><button class=danger onclick="cambiarReserva(${r.id},'Cancelada')">Cancelar</button>` : ''}<button class=danger onclick="eliminarReserva(${r.id})">Eliminar</button></div></article>`;
}
async function reservaciones() {
  const rows = await api('/reservaciones');
  content.innerHTML = `<section class="reservation-hero"><div><p class="eyebrow">Módulo de recepción</p><h2>Nueva reservación</h2><p>1. Captura al huésped y las fechas. 2. Busca y elige la habitación. 3. Guarda la reservación.</p></div></section><div class="box"><form id="reservaForm"><input type=hidden name=id><input type=hidden name=huespedId><h3>Datos del huésped</h3><input name=nombre placeholder="Nombre" required><input name=apellidoPaterno placeholder="Apellido paterno" required><input name=apellidoMaterno placeholder="Apellido materno"><input name=telefono placeholder="Teléfono" required><input name=correo type=email placeholder="Correo"><input name=identificacion placeholder="Identificación"><textarea name=direccion placeholder="Dirección"></textarea><h3>Datos de la estancia</h3><input name=fechaInicio type=date required><input name=fechaFin type=date required><input name=adultos type=number min=1 value=1><input name=menores type=number min=0 value=0><button type=button class=primary onclick="buscarDisponibles()">Buscar disponibilidad</button></form><div id="availableRooms" class="available-grid"></div><div class="reservation-submit"><label><input id=confirmarReserva type=checkbox checked> Confirmar reservación inmediatamente</label><button class=primary onclick="guardarReserva()">Guardar reservación</button><button onclick="limpiarReserva()">Limpiar</button></div></div><div class="section-title"><h2>Reservaciones registradas</h2><button onclick="api('/reservaciones/liberar-expiradas',{method:'POST'}).then(()=>reservaciones())">Liberar bloqueos vencidos</button></div><div class="reservation-grid">${rows.map(reservaCard).join('')}</div>`;
}
async function guardarReserva() {
  const f = reservaForm;
  if (!f.reportValidity()) return;
  const ids = [
    ...document.querySelectorAll('input[name=habitacionIds]:checked'),
  ].map((x) => Number(x.value));
  if (!ids.length) return alert('Selecciona al menos una habitación');
  const d = {
    huespedId: Number(f.huespedId.value) || undefined,
    huesped: {
      nombre: f.nombre.value,
      apellidoPaterno: f.apellidoPaterno.value,
      apellidoMaterno: f.apellidoMaterno.value,
      telefono: f.telefono.value,
      correo: f.correo.value,
      identificacion: f.identificacion.value,
      direccion: f.direccion.value,
    },
    fechaInicio: f.fechaInicio.value,
    fechaFin: f.fechaFin.value,
    adultos: Number(f.adultos.value),
    menores: Number(f.menores.value),
    habitacionIds: ids,
    confirmar: confirmarReserva.checked,
  };
  const id = f.id.value;
  await api(id ? `/reservaciones/${id}` : '/reservaciones', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(d),
  });
  reservaciones();
}
async function editarReserva(r) {
  const huesped = await api(`/huespedes/${r.huesped_id}`);
  await reservaciones();
  const f = reservaForm;
  f.id.value = r.id;
  f.huespedId.value = r.huesped_id;
  [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'telefono',
    'correo',
    'identificacion',
    'direccion',
  ].forEach((campo) => (f[campo].value = huesped[campo] || ''));
  f.fechaInicio.value = String(r.fecha_inicio).slice(0, 10);
  f.fechaFin.value = String(r.fecha_fin).slice(0, 10);
  f.adultos.value = r.adultos;
  f.menores.value = r.menores;
  await buscarDisponibles();
  const nums = String(r.habitaciones_detalle || '')
    .split(',')
    .map((x) => x.split('|')[0]);
  const all = await api('/habitaciones');
  all
    .filter((h) => nums.includes(String(h.numero)))
    .forEach((h) => {
      const cb = document.querySelector(
        `input[name=habitacionIds][value="${h.id}"]`,
      );
      if (cb) cb.checked = true;
    });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
async function eliminarReserva(id) {
  if (
    !confirm(
      '¿Eliminar definitivamente esta reservación? La habitación volverá a estar disponible.',
    )
  )
    return;
  await api(`/reservaciones/${id}`, { method: 'DELETE' });
  reservaciones();
}

// Flujo presencial: la reservación queda confirmada inmediatamente y Recepción
// continúa con el check-in/check-out.
function campo(label, control, ancho = '') {
  return `<label class="form-field ${ancho}"><span>${label}</span>${control}</label>`;
}

function reservaCard(r) {
  return `<article class="reservation-card"><div><span class="folio">${esc(r.folio)}</span><span class="status status-${String(r.estado).toLowerCase().replaceAll(' ', '-')}">${esc(r.estado)}</span></div><h3>${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')}</h3><p>${esc(String(r.fecha_inicio).slice(0, 10))} → ${esc(String(r.fecha_fin).slice(0, 10))}</p><div class="selected-rooms">${detalleHabitaciones(r.habitaciones_detalle)}</div><small>Registró: ${esc(r.recepcionista_nombre || 'Recepción')}</small><div class="actions">${!['Cancelada', 'Finalizada'].includes(r.estado) ? `<button onclick='editarReserva(${JSON.stringify(r).replace(/'/g, '&#39;')})'>Editar</button><button class=danger onclick="cambiarReserva(${r.id},'Cancelada')">Cancelar</button>` : ''}<button class=danger onclick="eliminarReserva(${r.id})">Eliminar</button></div></article>`;
}

async function reservaciones() {
  const rows = await api('/reservaciones');
  content.innerHTML = `<section class="reservation-hero"><div><p class="eyebrow">Atención presencial</p><h2>Registrar cliente y estancia</h2><p>La reservación se confirma inmediatamente. Después podrás realizar el check-in desde Recepción.</p></div><div class="instant-badge">Confirmación inmediata</div></section><div class="box reservation-form-box"><form id="reservaForm"><input type=hidden name=id><input type=hidden name=huespedId><fieldset><legend>1. Datos del cliente</legend><div class=form-grid>${campo('Nombre *', '<input name=nombre placeholder="Ej. María" required>')}${campo('Apellido paterno *', '<input name=apellidoPaterno placeholder="Ej. Hernández" required>')}${campo('Apellido materno', '<input name=apellidoMaterno placeholder="Ej. López">')}${campo('Teléfono *', '<input name=telefono type=tel placeholder="Ej. 772 123 4567" required>')}${campo('Correo electrónico', '<input name=correo type=email placeholder="cliente@correo.com">')}${campo('Identificación', '<input name=identificacion placeholder="INE, pasaporte, etc.">')}${campo('Dirección', '<textarea name=direccion placeholder="Domicilio del cliente"></textarea>', 'wide')}</div></fieldset><fieldset><legend>2. Datos de la estancia</legend><div class=form-grid>${campo('Fecha de entrada *', '<input name=fechaInicio type=date required>')}${campo('Fecha de salida *', '<input name=fechaFin type=date required>')}${campo('Adultos *', '<input name=adultos type=number min=1 value=1 required>')}${campo('Menores', '<input name=menores type=number min=0 value=0>')}</div><button type=button class="primary search-rooms" onclick="buscarDisponibles()">Buscar habitaciones disponibles</button></fieldset></form><section class=room-selection><h3>3. Selecciona la habitación</h3><p class=helper>Elige una o más habitaciones disponibles para las fechas indicadas.</p><div id="availableRooms" class="available-grid empty-selection">Primero selecciona las fechas y busca disponibilidad.</div></section><div class="reservation-submit"><span class="confirmation-note">✓ Se guardará como <strong>Confirmada</strong></span><button class=primary onclick="guardarReserva()">Confirmar y guardar reservación</button><button onclick="limpiarReserva()">Limpiar formulario</button></div></div><div class="section-title"><h2>Reservaciones registradas</h2></div><div class="reservation-grid">${rows.map(reservaCard).join('')}</div>`;
}

async function guardarReserva() {
  const f = reservaForm;
  if (!f.reportValidity()) return;
  const ids = [
    ...document.querySelectorAll('input[name=habitacionIds]:checked'),
  ].map((x) => Number(x.value));
  if (!ids.length) return alert('Selecciona al menos una habitación');
  const d = {
    huespedId: Number(f.huespedId.value) || undefined,
    huesped: {
      nombre: f.nombre.value,
      apellidoPaterno: f.apellidoPaterno.value,
      apellidoMaterno: f.apellidoMaterno.value,
      telefono: f.telefono.value,
      correo: f.correo.value,
      identificacion: f.identificacion.value,
      direccion: f.direccion.value,
    },
    fechaInicio: f.fechaInicio.value,
    fechaFin: f.fechaFin.value,
    adultos: Number(f.adultos.value),
    menores: Number(f.menores.value),
    habitacionIds: ids,
    confirmar: true,
  };
  const id = f.id.value;
  await api(id ? `/reservaciones/${id}` : '/reservaciones', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(d),
  });
  alert(
    id ? 'Reservación actualizada' : 'Reservación confirmada correctamente',
  );
  reservaciones();
}

async function recepcion() {
  const [res, historial] = await Promise.all([
    api('/reservaciones'),
    api('/recepcion/historial'),
  ]);
  const confirmadas = res.filter((r) => r.estado === 'Confirmada');
  const activas = res.filter(
    (r) => !['Cancelada', 'Finalizada'].includes(r.estado),
  );
  const opciones = (rows) =>
    `<option value="">Selecciona una reservación</option>${rows.map((r) => `<option value=${r.id}>${esc(r.folio)} · ${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')} · Hab. ${esc(String(r.habitaciones_detalle || '').split('|')[0])}</option>`).join('')}`;
  content.innerHTML = `<section class="reservation-hero reception-hero"><div><p class=eyebrow>Operación de recepción</p><h2>Llegadas y salidas</h2><p>Selecciona una reservación confirmada para registrar la llegada o salida del cliente.</p></div></section><div class="reception-grid"><div class="box operation-card"><span class=step-number>1</span><h3>Registrar check-in</h3><p>Confirma que el cliente llegó y entrega la habitación.</p><form id=fi class=operation-form>${campo('Reservación confirmada *', `<select name=reservacionId required>${opciones(confirmadas)}</select>`, 'wide')}${campo('Observaciones de llegada', '<textarea name=observaciones placeholder="Equipaje, solicitudes o notas"></textarea>', 'wide')}<button class=primary>Registrar llegada</button></form></div><div class="box operation-card checkout-card"><span class=step-number>2</span><h3>Registrar check-out</h3><p>Finaliza la estancia y envía la habitación a limpieza.</p><form id=fo class=operation-form>${campo('Reservación activa *', `<select name=reservacionId required>${opciones(activas)}</select>`, 'wide')}${campo('Observaciones de salida', '<textarea name=observaciones placeholder="Daños, objetos olvidados o notas"></textarea>', 'wide')}<button class=primary>Registrar salida</button></form></div></div><div class=section-title><h2>Reservaciones disponibles</h2><button onclick="load('reservaciones','Reservaciones')">Nueva reservación</button></div>${table(res)}<div class=section-title><h2>Historial de recepción</h2></div>${table(historial)}`;
  fi.onsubmit = (e) => sendForm(e, '/recepcion/checkin', recepcion);
  fo.onsubmit = (e) => sendForm(e, '/recepcion/checkout', recepcion);
}

let origenReserva = 'reservaciones';
function formularioReservaHtml(titulo) {
  return `<section class="reservation-hero"><div><p class=eyebrow>Atención presencial</p><h2>${titulo}</h2><p>Captura al cliente, consulta disponibilidad y confirma su habitación inmediatamente.</p></div><div class=instant-badge>Confirmación inmediata</div></section><div class="box reservation-form-box"><form id=reservaForm><input type=hidden name=id><input type=hidden name=huespedId><fieldset><legend>1. Datos del cliente</legend><div class=form-grid>${campo('Nombre *', '<input name=nombre placeholder="Ej. María" required>')}${campo('Apellido paterno *', '<input name=apellidoPaterno placeholder="Ej. Hernández" required>')}${campo('Apellido materno', '<input name=apellidoMaterno placeholder="Ej. López">')}${campo('Teléfono *', '<input name=telefono type=tel placeholder="Ej. 772 123 4567" required>')}${campo('Correo electrónico', '<input name=correo type=email placeholder="cliente@correo.com">')}${campo('Identificación', '<input name=identificacion placeholder="INE o pasaporte">')}${campo('Dirección', '<textarea name=direccion placeholder="Domicilio del cliente"></textarea>', 'wide')}</div></fieldset><fieldset><legend>2. Datos de la estancia</legend><div class=form-grid>${campo('Fecha de entrada *', '<input name=fechaInicio type=date required>')}${campo('Fecha de salida *', '<input name=fechaFin type=date required>')}${campo('Adultos *', '<input name=adultos type=number min=1 value=1 required>')}${campo('Menores', '<input name=menores type=number min=0 value=0>')}</div><div class="form-btn-container"><button type=button class="primary action-btn" onclick="buscarDisponibles()">Buscar habitaciones</button></div></fieldset></form><section class=room-selection><h3>3. Selecciona la habitación</h3><p class=helper>Las fotografías te ayudarán a identificar cada habitación.</p><div id=availableRooms class="available-grid empty-selection">Primero selecciona las fechas y busca disponibilidad.</div></section><div class=reservation-submit><span class=confirmation-note>✓ Se guardará como <strong>Confirmada</strong></span><button class="primary create-button" onclick="guardarReserva()">Crear reservación</button><button class="primary danger" type="button" onclick="limpiarReservaActual()">Limpiar</button></div></div>`;
}
function reservaCard(r) {
  return `<article class=reservation-card><div><span class=folio>${esc(r.folio)}</span><span class="status status-${String(r.estado).toLowerCase().replaceAll(' ', '-')}">${esc(r.estado)}</span></div><h3>${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')}</h3><p>${esc(String(r.fecha_inicio).slice(0, 10))} → ${esc(String(r.fecha_fin).slice(0, 10))}</p><div class=selected-rooms>${detalleHabitaciones(r.habitaciones_detalle)}</div><small>Registró: ${esc(r.recepcionista_nombre || 'Recepción')}</small><div class=actions>${!['Cancelada', 'Finalizada'].includes(r.estado) ? `<button class=edit-button onclick='editarReserva(${JSON.stringify(r).replace(/'/g, '&#39;')})'>Editar</button><button class=danger onclick="cambiarReserva(${r.id},'Cancelada')">Cancelar</button>` : ''}<button class=danger onclick="eliminarReserva(${r.id})">Eliminar</button></div></article>`;
}
async function reservaciones() {
  origenReserva = 'reservaciones';
  const rows = await api('/reservaciones');
  content.innerHTML =
    formularioReservaHtml('Nueva reservación') +
    `<div class=section-title><h2>Reservaciones registradas</h2></div><div class=reservation-grid>${rows.map(reservaCard).join('')}</div>`;
}
function limpiarReservaActual() {
  origenReserva === 'recepcion' ? recepcion() : reservaciones();
}
async function guardarReserva() {
  const f = reservaForm;
  if (!f.reportValidity()) return;
  const ids = [
    ...document.querySelectorAll('input[name=habitacionIds]:checked'),
  ].map((x) => Number(x.value));
  if (!ids.length) return alert('Selecciona al menos una habitación');
  const d = {
    huespedId: Number(f.huespedId.value) || undefined,
    huesped: {
      nombre: f.nombre.value,
      apellidoPaterno: f.apellidoPaterno.value,
      apellidoMaterno: f.apellidoMaterno.value,
      telefono: f.telefono.value,
      correo: f.correo.value,
      identificacion: f.identificacion.value,
      direccion: f.direccion.value,
    },
    fechaInicio: f.fechaInicio.value,
    fechaFin: f.fechaFin.value,
    adultos: Number(f.adultos.value),
    menores: Number(f.menores.value),
    habitacionIds: ids,
    confirmar: true,
  };
  const id = f.id.value;
  await api(id ? `/reservaciones/${id}` : '/reservaciones', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(d),
  });
  alert(id ? 'Reservación actualizada' : 'Reservación creada correctamente');
  origenReserva === 'recepcion' ? recepcion() : reservaciones();
}
async function recepcion() {
  origenReserva = 'recepcion';
  const [res, historial] = await Promise.all([
    api('/reservaciones'),
    api('/recepcion/historial'),
  ]);
  const confirmadas = res.filter((r) => r.estado === 'Confirmada'),
    activas = res.filter(
      (r) => !['Cancelada', 'Finalizada'].includes(r.estado),
    );
  const opciones = (rows) =>
    `<option value="">Selecciona una reservación</option>${rows.map((r) => `<option value=${r.id}>${esc(r.folio)} · ${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')} · Hab. ${esc(String(r.habitaciones_detalle || '').split('|')[0])}</option>`).join('')}`;
  content.innerHTML =
    formularioReservaHtml('Reservación desde recepción') +
    `<div class="section-title reception-divider"><h2>Check-in y check-out</h2><span>Administra las llegadas y salidas</span></div><div class=reception-grid><div class="box operation-card"><span class=step-number>1</span><h3>Registrar check-in</h3><p>Confirma la llegada y entrega la habitación.</p><form id=fi class=operation-form>${campo('Reservación confirmada *', `<select name=reservacionId required>${opciones(confirmadas)}</select>`, 'wide')}${campo('Observaciones', '<textarea name=observaciones placeholder="Solicitudes o notas"></textarea>', 'wide')}<button class="primary create-button">Registrar llegada</button></form></div><div class="box operation-card checkout-card"><span class=step-number>2</span><h3>Registrar check-out</h3><p>Finaliza la estancia y envía la habitación a limpieza.</p><form id=fo class=operation-form>${campo('Reservación activa *', `<select name=reservacionId required>${opciones(activas)}</select>`, 'wide')}${campo('Observaciones', '<textarea name=observaciones placeholder="Daños u objetos olvidados"></textarea>', 'wide')}<button class="primary create-button">Registrar salida</button></form></div></div><div class=section-title><h2>Clientes y reservaciones</h2></div><div class=reservation-grid>${res.map(reservaCard).join('')}</div><div class=section-title><h2>Historial de recepción</h2></div>${table(historial)}`;
  fi.onsubmit = (e) => sendForm(e, '/recepcion/checkin', recepcion);
  fo.onsubmit = (e) => sendForm(e, '/recepcion/checkout', recepcion);
}
async function dash() {
  const d = await api('/reportes/dashboard');
  content.innerHTML = `<section class=dashboard-hero><div><p class=eyebrow>Resumen del hotel</p><h2>Panel de operaciones</h2><p>Consulta rápidamente el estado del Balneario Dios Padre.</p></div><div class=occupancy-ring style="--value:${Math.min(100, d.porcentajeOcupacion)}"><strong>${d.porcentajeOcupacion}%</strong><span>Ocupación</span></div></section><div class=dashboard-grid><article class="metric-card featured"><i class="fa-solid fa-calendar-check"></i><div><span>Reservaciones confirmadas</span><strong>${d.reservacionesConfirmadas}</strong></div></article>${d.estados.map((x) => `<article class=metric-card><i class="fa-solid fa-hotel"></i><div><span>${esc(x.nombre)}</span><strong>${x.total}</strong></div></article>`).join('')}</div><div class=quick-actions><h3>Acciones rápidas</h3><button class=create-button onclick="load('recepcion','Recepción')">Nueva reservación</button><button onclick="load('habitaciones','Habitaciones')">Administrar habitaciones y fotos</button></div>`;
}
function recepcionCard(r, accion) {
  const habitacion =
    String(r.habitaciones_detalle || '').split('|')[0] || 'Sin habitación';
  const texto =
    `${r.folio} ${r.huesped_nombre} ${r.huesped_apellido || ''} ${habitacion}`.toLowerCase();
  return `<article class="reception-queue-card" data-search="${esc(texto)}"><div class=queue-main><span class=queue-room>Hab. ${esc(habitacion)}</span><div><strong>${esc(r.huesped_nombre)} ${esc(r.huesped_apellido || '')}</strong><small>${esc(r.folio)} · ${esc(String(r.fecha_inicio).slice(0, 10))} → ${esc(String(r.fecha_fin).slice(0, 10))}</small></div></div><button class="${accion === 'checkin' ? 'checkin-button' : 'checkout-button'}" onclick="accionRecepcion(${r.id},'${accion}')">${accion === 'checkin' ? 'Registrar llegada' : 'Registrar salida'}</button></article>`;
}

async function accionRecepcion(id, accion) {
  const palabra = accion === 'checkin' ? 'llegada' : 'salida';
  if (!confirm(`¿Confirmar la ${palabra} de este cliente?`)) return;
  await api(`/recepcion/${accion}`, {
    method: 'POST',
    body: JSON.stringify({ reservacionId: id, observaciones: '' }),
  });
  alert(
    accion === 'checkin'
      ? 'Llegada registrada. Habitación ocupada.'
      : 'Salida registrada. Habitación enviada a limpieza.',
  );
  recepcion();
}

function mostrarRecepcionTab(tab) {
  document
    .querySelectorAll('.reception-panel')
    .forEach((x) => (x.hidden = x.dataset.panel !== tab));
  document
    .querySelectorAll('.reception-tab')
    .forEach((x) => x.classList.toggle('active', x.dataset.tab === tab));
  document
    .getElementById(`panel-${tab}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filtrarRecepcion(valor) {
  const termino = valor.trim().toLowerCase();
  document
    .querySelectorAll('.reception-queue-card')
    .forEach((card) => (card.hidden = !card.dataset.search.includes(termino)));
}

async function recepcion() {
  origenReserva = 'recepcion';
  const [res, historial] = await Promise.all([
    api('/reservaciones'),
    api('/recepcion/historial'),
  ]);
  const checkins = new Set(
    historial
      .filter((x) => x.tipo === 'Check-in')
      .map((x) => Number(x.reservacion_id)),
  );
  const checkouts = new Set(
    historial
      .filter((x) => x.tipo === 'Check-out')
      .map((x) => Number(x.reservacion_id)),
  );
  const llegadas = res.filter(
    (r) => r.estado === 'Confirmada' && !checkins.has(Number(r.id)),
  );
  const salidas = res.filter(
    (r) =>
      checkins.has(Number(r.id)) &&
      !checkouts.has(Number(r.id)) &&
      r.estado !== 'Finalizada',
  );
  content.innerHTML = `<section class=reception-command><div><p class=eyebrow>Recepción rápida</p><h2>¿Qué necesitas hacer?</h2><p>Elige una acción. Los clientes pendientes aparecen primero.</p></div><div class=live-summary><span><strong>${llegadas.length}</strong> llegadas</span><span><strong>${salidas.length}</strong> salidas</span></div></section><nav class=reception-tabs><button class="reception-tab active" data-tab=llegadas onclick="mostrarRecepcionTab('llegadas')"><i class="fa-solid fa-person-walking-arrow-right"></i><strong>Llegadas</strong><span>${llegadas.length} pendientes</span></button><button class=reception-tab data-tab=salidas onclick="mostrarRecepcionTab('salidas')"><i class="fa-solid fa-person-walking-arrow-loop-left"></i><strong>Salidas</strong><span>${salidas.length} pendientes</span></button><button class=reception-tab data-tab=nueva onclick="mostrarRecepcionTab('nueva')"><i class="fa-solid fa-user-plus"></i><strong>Nueva reservación</strong><span>Cliente sin registro</span></button></nav><div class="reception-search">${campo('Buscar cliente, folio o habitación', '<input type=search placeholder="Escribe para filtrar..." oninput="filtrarRecepcion(this.value)">', 'wide')}</div><section id=panel-llegadas class=reception-panel data-panel=llegadas><div class=panel-heading><div><h2>Clientes por llegar</h2><p>Un toque registra el check-in y marca la habitación como ocupada.</p></div></div><div class=queue-list>${llegadas.length ? llegadas.map((r) => recepcionCard(r, 'checkin')).join('') : '<div class=queue-empty>✓ No hay llegadas pendientes</div>'}</div></section><section id=panel-salidas class=reception-panel data-panel=salidas hidden><div class=panel-heading><div><h2>Clientes hospedados</h2><p>Registra la salida y envía la habitación a limpieza.</p></div></div><div class=queue-list>${salidas.length ? salidas.map((r) => recepcionCard(r, 'checkout')).join('') : '<div class=queue-empty>✓ No hay salidas pendientes</div>'}</div></section><section id=panel-nueva class=reception-panel data-panel=nueva hidden>${formularioReservaHtml('Nueva reservación desde recepción')}</section><details class=reception-history><summary>Ver historial de movimientos (${historial.length})</summary>${table(historial)}</details>`;
}

async function editarReserva(r) {
  const destino = origenReserva;
  const huesped = await api(`/huespedes/${r.huesped_id}`);
  if (destino === 'recepcion') {
    await recepcion();
    mostrarRecepcionTab('nueva');
  } else await reservaciones();
  const f = reservaForm;
  f.id.value = r.id;
  f.huespedId.value = r.huesped_id;
  [
    'nombre',
    'apellidoPaterno',
    'apellidoMaterno',
    'telefono',
    'correo',
    'identificacion',
    'direccion',
  ].forEach((campo) => (f[campo].value = huesped[campo] || ''));
  f.fechaInicio.value = String(r.fecha_inicio).slice(0, 10);
  f.fechaFin.value = String(r.fecha_fin).slice(0, 10);
  f.adultos.value = r.adultos;
  f.menores.value = r.menores;
  await buscarDisponibles();
  const nums = String(r.habitaciones_detalle || '')
    .split(',')
    .map((x) => x.split('|')[0]);
  const all = await api('/habitaciones');
  all
    .filter((h) => nums.includes(String(h.numero)))
    .forEach((h) => {
      const cb = document.querySelector(
        `input[name=habitacionIds][value="${h.id}"]`,
      );
      if (cb) cb.checked = true;
    });
}

function limpiezaCard(row) {
  return `<article class="cleaning-record ${row.estado === 'Finalizada' ? 'completed' : ''}"><div class=cleaning-icon><i class="fa-solid ${row.estado === 'Finalizada' ? 'fa-check' : 'fa-broom'}"></i></div><div><strong>Habitación ${esc(row.numero)}</strong><span>${esc(row.camarista)} · ${esc(String(row.fecha).slice(0, 10))}</span></div><span class="cleaning-status">${esc(row.estado)}</span></article>`;
}
async function limpieza() {
  const [rows, hs, us, obs] = await Promise.all([
    api('/limpieza'),
    api('/habitaciones'),
    api('/usuarios'),
    api('/limpieza/observaciones'),
  ]);
  const cams = us.filter((x) => x.rol?.nombre === 'Camarista'),
    pendientes = rows.filter((x) => x.estado !== 'Finalizada'),
    finalizadas = rows.filter((x) => x.estado === 'Finalizada');
  const habitacionesAsignables = hs.filter(
    (x) => x.activa && x.estado?.nombre !== 'Ocupada',
  );
  content.innerHTML = `<section class=cleaning-hero><div><p class=eyebrow>Control de limpieza</p><h2>Habitaciones y camaristas</h2><p>Asigna tareas y consulta qué habitaciones ya quedaron disponibles.</p></div><div class=cleaning-counters><span><strong>${pendientes.length}</strong>Pendientes</span><span><strong>${finalizadas.length}</strong>Finalizadas</span></div></section><div class="box cleaning-assignment"><h3>Nueva asignación</h3><form id=f>${campo('Habitación *', `<select name=habitacionId required><option value="">Selecciona habitación</option>${habitacionesAsignables.map((x) => `<option value=${x.id}>Habitación ${esc(x.numero)} · ${esc(x.estado?.nombre || '')}</option>`).join('')}</select>`)}${campo('Camarista *', `<select name=camaristaId required><option value="">Selecciona camarista</option>${cams.map((x) => `<option value=${x.id}>${esc(x.nombre)}</option>`).join('')}</select>`)}${campo('Fecha *', `<input name=fecha type=date required value=${new Date().toISOString().slice(0, 10)}>`)}<div class="form-btn-container"><button class="primary action-btn">Asignar limpieza</button></div></form></div><div class=section-title><div><h2>En limpieza</h2><p>Estas tareas siguen visibles para las camaristas.</p></div></div><div class=cleaning-list>${pendientes.length ? pendientes.map(limpiezaCard).join('') : '<div class=queue-empty>No hay limpiezas pendientes</div>'}</div><div class="section-title completed-heading"><div><h2>Habitaciones finalizadas</h2><p>Ya aparecen como Disponibles para Administración y se conservan aquí como registro.</p></div><span class=completed-total>${finalizadas.length} registros</span></div><div class="cleaning-list completed-list">${finalizadas.length ? finalizadas.map(limpiezaCard).join('') : '<div class=queue-empty>Aún no hay habitaciones finalizadas</div>'}</div><details class=reception-history><summary>Observaciones e incidencias (${obs.length})</summary>${table(obs)}</details>`;
  f.onsubmit = (e) => sendForm(e, '/limpieza/asignar', limpieza);
}
const bloqueosReserva = new Set();
async function cambiarBloqueo(input) {
  try {
    await api(`/reservaciones/bloqueo/${input.value}`, {
      method: input.checked ? 'POST' : 'DELETE',
    });
    input.checked
      ? bloqueosReserva.add(Number(input.value))
      : bloqueosReserva.delete(Number(input.value));
  } catch (error) {
    input.checked = false;
    alert(error.message);
    await buscarDisponibles();
  }
}
async function liberarBloqueosReserva() {
  await Promise.all(
    [...bloqueosReserva].map((id) =>
      api(`/reservaciones/bloqueo/${id}`, { method: 'DELETE' }).catch(() => {}),
    ),
  );
  bloqueosReserva.clear();
}
document.addEventListener('click', (event) => {
  if (bloqueosReserva.size && event.target.closest('aside nav button'))
    void liberarBloqueosReserva();
});
async function buscarDisponibles() {
  const f = reservaForm;
  if (!f.fechaInicio.value || !f.fechaFin.value)
    return alert('Selecciona las fechas');
  await liberarBloqueosReserva();
  const rooms = await api(
    `/reservaciones/disponibles?inicio=${encodeURIComponent(f.fechaInicio.value)}&fin=${encodeURIComponent(f.fechaFin.value)}`,
  );
  availableRooms.innerHTML = rooms.length
    ? rooms
        .map(
          (h) =>
            `<label class="available-room"><input type=checkbox name=habitacionIds value=${h.id} onchange="cambiarBloqueo(this)"><div class=room-photo>${h.fotoUrl ? `<img src="${esc(h.fotoUrl)}">` : '<span>Sin foto</span>'}</div><strong>Habitación ${esc(h.numero)}</strong><span>${esc(h.tipo?.nombre || 'Sin tipo')} · Piso ${esc(h.piso ?? '-')}</span></label>`,
        )
        .join('')
    : '<p>No hay habitaciones disponibles para esas fechas.</p>';
}
async function limpiarReservaActual() {
  await liberarBloqueosReserva();
  origenReserva === 'recepcion' ? recepcion() : reservaciones();
}
load('dashboard', 'Dashboard');
