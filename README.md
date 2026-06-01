# 🍔 Burger Mania Retro v2

Juego de retrospectiva Scrum multijugador en tiempo real. Versión 2 — rediseñada desde cero.

## Estructura

```
burger-mania-v2/
├── server.js        ← WebSocket server (Render)
├── package.json
└── public/
    └── index.html   ← Frontend (GitHub Pages)
```

## Deploy en 3 pasos

### 1. Render (servidor WebSocket)
1. Sube el repo completo a GitHub
2. [render.com](https://render.com) → New Web Service → conecta el repo
3. Build: `npm install` · Start: `node server.js`
4. Copia tu URL: `https://burger-mania-v2-xxxx.onrender.com`

### 2. Actualiza la URL en el frontend
En `public/index.html` busca:
```js
const WS_URL = 'wss://TU-PROYECTO.onrender.com';
```
Reemplaza con tu URL de Render (usa `wss://`, no `ws://`).

### 3. GitHub Pages (frontend)
Settings → Pages → Branch: `main` → Folder: `/public`

URL final: `https://tuusuario.github.io/burger-mania-v2/`

---

## Cómo jugar

| Paso | Quién | Qué hace |
|------|-------|---------|
| 1 | PO (host) | Crea la sala, configura preguntas opcionales |
| 2 | Todos | Se unen con el código de 4 letras |
| 3 | PO | Presiona ▶ Iniciar |
| 4 | Todos | Construyen su burger en 7 rondas temáticas |
| 5 | Host | Controla el timer: iniciar, pausar, saltar |
| 6 | Todos | Votan la mejor burger (anónima) al final de cada ronda |
| 7 | Host | Descarga el reporte HTML con todos los insights |

## Rondas

| # | Tema | Fase |
|---|------|------|
| 1 | Liked | 4Ls |
| 2 | Learned | 4Ls |
| 3 | Lacked | 4Ls |
| 4 | Longed for | 4Ls |
| 5 | Start | SSC |
| 6 | Stop | SSC |
| 7 | Continue | SSC |

## Puntos

| Acción | Puntos |
|--------|--------|
| Entregar burger | +1 |
| Por cada ingrediente | +1 |
| Votos del equipo | +3 |

## Poderes especiales (1 por partida)

| Rol | Poder |
|-----|-------|
| 🔵 Developer | Saltar pregunta sin penalización |
| 🟢 QA Engineer | Congelar a un jugador 10 segundos |
| 🟠 Product Owner | Agregar una pregunta extra a la ronda |
