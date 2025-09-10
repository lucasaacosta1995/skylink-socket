# SkyLink — Node Realtime (Socket.io)

Servicio **realtime** para emitir eventos al dashboard de SkyLink mediante **WebSocket (Socket.io)**.  
Recibe eventos desde Laravel por **HTTP ingest** (modo simple, sin Redis) o por **Redis Pub/Sub** (modo recomendado en producción).

> Nota: este servicio **no incluye** un cliente de consola. El consumidor de los eventos es el **dashboard en Laravel** (Blade), que se conecta por Socket.io usando `NODE_WS_URL`.

---

## 📦 Requisitos

- **Node.js** 18+
- (Opcional) **Redis** 6/7 si usás Pub/Sub
- Red local accesible desde Laravel (por defecto `http://127.0.0.1:3001`)

---

## 📁 Estructura mínima

```
node-realtime/
├─ server.js
├─ package.json
└─ .env               # opcional
```

---

## ⚙️ Variables de entorno

Crear `node-realtime/.env` (opcional) con:

```env
# Puerto del WebSocket (Socket.io HTTP server)
WS_PORT=3001

# (Opcional) Orígenes permitidos para Socket.io (recomendado en prod)
# CORS_ORIGIN=http://127.0.0.1:8000

# --- Solo si usás Redis (modo Pub/Sub) ---
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_CHANNEL=skylink.events
```

> El dashboard Laravel debe apuntar a este WS con `NODE_WS_URL` (en Laravel `.env`):  
> `NODE_WS_URL=http://127.0.0.1:3001`

---

## 🚀 Instalación y ejecución

```bash
cd node-realtime
npm i
node server.js
# => WS on 3001
```

- Si ves `WS on 3001`, el servidor de Socket.io quedó arriba.
- Si habilitaste Redis y no está corriendo, ioredis mostrará `ECONNREFUSED` (ver Troubleshooting).

---

## 🔌 Modos de entrada de eventos

### Modo A — HTTP ingest (sin Redis, ideal en Windows/WAMP)

**Qué es:** Laravel envía un `POST` a `http://127.0.0.1:3001/ingest` y Node re-emite por Socket.io.

**Servidor (`server.js`)** (versión con Express): debe exponer:

```http
POST /ingest
Content-Type: application/json

{
  "event": "reservation.updated",
  "data": { ... }
}
```

**Laravel (`EventPublisher`)** debe apuntar a:
```
NODE_HTTP_INGEST=http://127.0.0.1:3001/ingest
```
y enviar el payload del evento (ya incluido en tu servicio).

**Probar ingest a mano:**
```bash
curl -X POST http://127.0.0.1:3001/ingest   -H "Content-Type: application/json"   -d "{"event":"reservation.updated","data":{"id":"abc123","status":"CONFIRMED"}}"
```

### Modo B — Redis Pub/Sub (recomendado en producción)

**Qué es:** Laravel publica en un canal Redis (`skylink.events`), Node se **suscribe** y re-emite por Socket.io.

Requisitos:
- Redis corriendo (`127.0.0.1:6379` por defecto).
- `server.js` con ioredis (versión suscriptor).
- Laravel con `EventPublisher` que use `Redis::publish(...)`.

Variables útiles:
```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_CHANNEL=skylink.events
```

---

## 📡 Canal de salida (Socket.io)

- Namespace/root: conexión estándar `io("http://127.0.0.1:3001")`.
- Evento emitido: **`dashboard`**.
- Payload de ejemplo:
```json
{
  "event": "reservation.updated",
  "data": {
    "id": "abc123",
    "status": "CONFIRMED",
    "passengers": []
  }
}
```

El **dashboard (Laravel)** escucha:
```js
const socket = io(WS_URL);
socket.on('dashboard', (msg) => { /* actualizar UI */ });
```

---

## 🔐 CORS / Seguridad

Por defecto el servidor tiene `cors: { origin: '*' }`. En producción **restringí** el origen del WS al host del dashboard Laravel.

Ejemplo (código):
```js
const allowed = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
const io = new Server(httpServer, { cors: { origin: allowed } });
```

Y en `.env`:
```
CORS_ORIGIN=http://127.0.0.1:8000
```

---

## 🩺 Troubleshooting

- **`ECONNREFUSED 127.0.0.1:6379`**  
  Estás corriendo la versión con ioredis pero **Redis no está**. Opciones:  
  1) Levantar Redis (Docker/WSL), o  
  2) Usar el `server.js` con **HTTP ingest** (sin Redis).

- **El dashboard no recibe eventos**  
  - Verificá que Laravel esté publicando: logs del `EventPublisher`.  
  - Probá `curl` a `/ingest` (modo HTTP) para aislar el problema.  
  - Confirmá que `NODE_WS_URL` en Laravel apunte al puerto correcto.

- **CORS**  
  Si el browser bloquea WS por CORS, seteá `CORS_ORIGIN` con el origen exacto del dashboard.

---

## 📄 Licencia

Uso educativo/demostrativo para la prueba técnica de **SkyLink**.
