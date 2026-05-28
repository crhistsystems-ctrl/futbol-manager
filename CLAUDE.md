# Miguel FC — Gestión de Jugadores

## Descripción
App web para que Miguel (entrenador de fútbol) lleve el registro de pagos mensuales de sus jugadores.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Google Sheets (vía Apps Script Web App) |
| Auth | NextAuth v4 (CredentialsProvider) |
| Deploy | Vercel |

---

## Diseño

- **Tema:** Oscuro con acento verde deportivo
- **Fondo:** `#0a0a0a` · **Cards:** `#141414` · **Acento:** `#22c55e`
- **Tipografía:** Bebas Neue (títulos) + DM Sans (cuerpo)
- **Mobile-first**

---

## Arquitectura de datos (Google Sheets)

### Hoja "Jugadores"
`id | nombre | telefono | acudiente | cuota_mensual | fecha_ingreso | activo`

### Hoja "Pagos"
`id | jugador_id | jugador_nombre | monto | fecha | mes | año | notas`

**Flujo:** Next.js API Routes → `lib/sheets.ts` → Apps Script Web App → Google Sheets

---

## Variables de entorno

```env
NEXTAUTH_URL=
NEXTAUTH_SECRET=
ADMIN_USERNAME=
ADMIN_PASSWORD=
SCRIPT_URL=         # URL del Apps Script desplegado
SCRIPT_SECRET=      # SECRET_KEY configurada en Script Properties
```

---

## Configurar Apps Script

1. Crear Google Sheets con hojas "Jugadores" y "Pagos"
2. Extensiones > Apps Script → pegar apps-script/Code.gs
3. Ejecutar setupSheets() una vez para crear encabezados
4. Configuración del proyecto > Propiedades del script → agregar SECRET_KEY
5. Implementar como Web App (Ejecutar como: Yo, Acceso: Cualquier usuario)
6. Copiar URL → SCRIPT_URL en Vercel

---

## Funcionalidades

1. Login — usuario/contraseña via variables de entorno
2. Dashboard — resumen mensual con navegación mes/año, stats, quién pagó/debe
3. Jugadores — lista con búsqueda y filtros, agregar nuevo jugador
4. Detalle jugador — info, edición, historial de pagos, registrar pago, activar/desactivar

---

## Comandos

```bash
npm run dev     # Desarrollo
npm run build   # Build producción
npm start       # Iniciar producción
```

## Convenciones

- Idioma UI: Español
- Precios: Formato colombiano ($80.000)
- Sin shadcn/ui ni componentes con estilos propios
