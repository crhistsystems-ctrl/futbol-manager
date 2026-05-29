// ================================================================
// MIGUEL FC — Google Apps Script Backend
//
// INSTRUCCIONES DE CONFIGURACIÓN:
//
// 1. Abre Google Sheets y crea una hoja nueva (o usa una existente)
// 2. Ve a Extensiones > Apps Script
// 3. Borra el contenido por defecto y pega todo este código
// 4. Guarda el proyecto (Ctrl+S)
// 5. Ejecuta la función "setupSheets" una sola vez para crear los encabezados:
//    Selecciona "setupSheets" en el menú desplegable y pulsa ▶ Ejecutar
// 6. Ve a Configuración del proyecto (ícono ⚙) > Propiedades del script
//    Agrega: SECRET_KEY = (una clave secreta que tú elijas)
// 7. Implementar > Nueva implementación:
//    - Tipo: Aplicación web
//    - Descripción: v1
//    - Ejecutar como: Yo
//    - Quién tiene acceso: Cualquier usuario
//    - Haz clic en Implementar y copia la URL
// 8. En Vercel (o .env.local), configura:
//    SCRIPT_URL = la URL del paso 7
//    SCRIPT_SECRET = la clave del paso 6
// ================================================================

function getSecret() {
  return PropertiesService.getScriptProperties().getProperty('SECRET_KEY') || '';
}

function checkAuth(secret) {
  var expected = getSecret();
  return expected.length > 0 && secret === expected;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Crea los encabezados en las hojas si no existen — ejecutar una sola vez
function setupSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  var jSheet = ss.getSheetByName('Jugadores');
  if (!jSheet) jSheet = ss.insertSheet('Jugadores');
  if (jSheet.getLastRow() === 0) {
    jSheet.appendRow(['id', 'nombre', 'telefono', 'acudiente', 'cuota_mensual', 'fecha_ingreso', 'activo']);
    jSheet.getRange(1, 1, 1, 7).setFontWeight('bold');
  }

  var pSheet = ss.getSheetByName('Pagos');
  if (!pSheet) pSheet = ss.insertSheet('Pagos');
  if (pSheet.getLastRow() === 0) {
    pSheet.appendRow(['id', 'jugador_id', 'jugador_nombre', 'monto', 'fecha', 'mes', 'año', 'notas']);
    pSheet.getRange(1, 1, 1, 8).setFontWeight('bold');
  }

  return 'Hojas configuradas correctamente ✓';
}

// ---- GET handler ----
function doGet(e) {
  if (!checkAuth(e.parameter.secret)) {
    return jsonResponse({ error: 'No autorizado' });
  }

  var action = e.parameter.action;

  try {
    switch (action) {
      case 'getDashboard':
        return jsonResponse({ jugadores: getJugadoresData(), pagos: getPagosData() });
      case 'getJugadores':
        return jsonResponse(getJugadoresData());
      case 'getJugador':
        return jsonResponse(getJugadorById(e.parameter.id));
      case 'getPagos':
        return jsonResponse(getPagosData(e.parameter.jugadorId, e.parameter.mes, e.parameter.año));
      case 'addJugador':
        return jsonResponse(addJugadorData(e.parameter));
      case 'updateJugador':
        return jsonResponse(updateJugadorData(e.parameter.id, e.parameter));
      case 'addPago':
        return jsonResponse(addPagoData(e.parameter));
      case 'deletePago':
        return jsonResponse(deletePagoData(e.parameter.id));
      default:
        return jsonResponse({ error: 'Acción desconocida: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ---- POST handler ----
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: 'JSON inválido' });
  }

  if (!checkAuth(data.secret)) {
    return jsonResponse({ error: 'No autorizado' });
  }

  var action = data.action;
  var payload = data.payload;
  var id = data.id;

  try {
    switch (action) {
      case 'addJugador':
        return jsonResponse(addJugadorData(payload));
      case 'updateJugador':
        return jsonResponse(updateJugadorData(id, payload));
      case 'addPago':
        return jsonResponse(addPagoData(payload));
      case 'deletePago':
        return jsonResponse(deletePagoData(id));
      default:
        return jsonResponse({ error: 'Acción desconocida: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: err.toString() });
  }
}

// ================================================================
// JUGADORES
// ================================================================

function getJugadoresData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jugadores');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 7).getValues();

  return data
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      return {
        id: String(row[0]),
        nombre: String(row[1]),
        telefono: String(row[2]),
        acudiente: String(row[3]),
        cuota_mensual: Number(row[4]),
        fecha_ingreso: row[5] ? safeFormatDate(row[5]) : '',
        activo: row[6] === true || row[6] === 'TRUE' || row[6] === 'true'
      };
    });
}

function getJugadorById(id) {
  if (!id) return null;
  var jugadores = getJugadoresData();
  return jugadores.find(function(j) { return j.id === id; }) || null;
}

function addJugadorData(payload) {
  var existentes = getJugadoresData();
  var duplicado = existentes.find(function(j) {
    return j.activo &&
      j.nombre.trim().toLowerCase() === (payload.nombre || '').trim().toLowerCase() &&
      j.telefono.trim() === (payload.telefono || '').trim();
  });
  if (duplicado) {
    return { error: 'ya existe un jugador activo con ese nombre y teléfono', id: duplicado.id };
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jugadores');
  var id = Utilities.getUuid();

  sheet.appendRow([
    id,
    payload.nombre || '',
    String(payload.telefono || ''),
    payload.acudiente || '',
    Number(payload.cuota_mensual) || 0,
    payload.fecha_ingreso || '',
    true
  ]);

  return {
    id: id,
    nombre: payload.nombre,
    telefono: String(payload.telefono || ''),
    acudiente: payload.acudiente || '',
    cuota_mensual: Number(payload.cuota_mensual),
    fecha_ingreso: payload.fecha_ingreso || '',
    activo: true
  };
}

function updateJugadorData(id, payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Jugadores');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      var row = i + 1;
      if (payload.nombre !== undefined)        sheet.getRange(row, 2).setValue(payload.nombre);
      if (payload.telefono !== undefined)      sheet.getRange(row, 3).setValue(String(payload.telefono));
      if (payload.acudiente !== undefined)     sheet.getRange(row, 4).setValue(payload.acudiente);
      if (payload.cuota_mensual !== undefined) sheet.getRange(row, 5).setValue(Number(payload.cuota_mensual));
      if (payload.fecha_ingreso !== undefined) sheet.getRange(row, 6).setValue(payload.fecha_ingreso);
      if (payload.activo !== undefined)        sheet.getRange(row, 7).setValue(payload.activo);
      return { id: id, updated: true };
    }
  }

  throw new Error('Jugador no encontrado: ' + id);
}

// ================================================================
// PAGOS
// ================================================================

function getPagosData(jugadorId, mes, año) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  var data = sheet.getRange(2, 1, lastRow - 1, 8).getValues();

  var pagos = data
    .filter(function(row) { return row[0] !== ''; })
    .map(function(row) {
      return {
        id: String(row[0]),
        jugador_id: String(row[1]),
        jugador_nombre: String(row[2]),
        monto: Number(row[3]),
        fecha: row[4] ? safeFormatDate(row[4]) : '',
        mes: Number(row[5]),
        año: Number(row[6]),
        notas: String(row[7] || '')
      };
    });

  if (jugadorId) pagos = pagos.filter(function(p) { return p.jugador_id === jugadorId; });
  if (mes)       pagos = pagos.filter(function(p) { return p.mes === Number(mes); });
  if (año)       pagos = pagos.filter(function(p) { return p.año === Number(año); });

  return pagos;
}

function addPagoData(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  var id = Utilities.getUuid();
  var jugador = getJugadorById(payload.jugador_id);
  var jugadorNombre = jugador ? jugador.nombre : '';

  sheet.appendRow([
    id,
    payload.jugador_id,
    jugadorNombre,
    Number(payload.monto),
    payload.fecha || '',
    Number(payload.mes),
    Number(payload.año),
    payload.notas || ''
  ]);

  return {
    id: id,
    jugador_id: payload.jugador_id,
    jugador_nombre: jugadorNombre,
    monto: Number(payload.monto),
    fecha: payload.fecha || '',
    mes: Number(payload.mes),
    año: Number(payload.año),
    notas: payload.notas || ''
  };
}

function deletePagoData(id) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Pagos');
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { deleted: true, id: id };
    }
  }

  throw new Error('Pago no encontrado: ' + id);
}

// ================================================================
// HELPERS
// ================================================================

function safeFormatDate(date) {
  if (!date) return '';
  try {
    if (typeof date === 'string' && date.match(/^\d{4}-\d{2}-\d{2}$/)) return date;
    return Utilities.formatDate(new Date(date), 'America/Bogota', 'yyyy-MM-dd');
  } catch (e) {
    return String(date);
  }
}
