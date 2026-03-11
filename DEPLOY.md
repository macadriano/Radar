# Despliegue de Radar Contractual en tu servidor

Esta guía asume un **servidor Linux** (VPS) con Node.js. Si usás otro tipo de hosting, ver la sección final.

---

## 1. Requisitos en el servidor

- **Node.js 18+** (recomendado 20 LTS)
- **npm** o **pnpm**
- Opcional: **PM2** (para mantener la app corriendo) y **Nginx** (reverse proxy)

---

## 2. Preparar el proyecto en tu PC

### 2.1 Build de producción

En la carpeta del proyecto:

```bash
npm install --production=false
npm run build
```

Se genera la carpeta `.next` con la app lista para producción.

### 2.2 Subir archivos al servidor

Necesitás subir al servidor:

- Carpeta **`.next`** (resultado del build)
- **`package.json`** y **`package-lock.json`**
- **`public`** (si tenés assets estáticos)
- **`prisma`** (solo si usás PostgreSQL en el servidor)
- **NO** subas `node_modules` ni `.env.local` (las variables se configuran en el servidor)

Ejemplo con SCP (reemplazá `usuario` y `tuservidor.com`):

```bash
scp -r .next package.json package-lock.json public prisma usuario@tuservidor.com:/var/www/radar/
```

O usando Git en el servidor (recomendado):

```bash
# En el servidor
cd /var/www
git clone https://github.com/TU-USUARIO/TU-REPO.git radar
cd radar
```

---

## 3. En el servidor

### 3.1 Instalar dependencias y construir

```bash
cd /var/www/radar   # o la ruta donde subiste el proyecto

npm install
npm run build
```

### 3.2 Variables de entorno

Creá el archivo `.env.production` o `.env.local` en la raíz del proyecto **en el servidor**:

```bash
nano .env.production
```

Contenido (con tus valores reales de Firebase):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

Si usás PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/radar"
```

Guardá (Ctrl+O, Enter, Ctrl+X en nano).

### 3.3 Levantar la app

**Opción A – Directo (solo para probar):**

```bash
npm run start
```

La app queda en **http://localhost:3000**. Para dejarla en segundo plano podés usar `screen` o `tmux`.

**Opción B – Con PM2 (recomendado):**

```bash
npm install -g pm2
pm2 start npm --name "radar" -- start
pm2 save
pm2 startup   # para que arranque al reiniciar el servidor
```

Comandos útiles PM2:

- `pm2 status`   – ver estado
- `pm2 logs radar` – ver logs
- `pm2 restart radar` – reiniciar

---

## 4. Nginx como reverse proxy (opcional)

Para usar dominio (ej. `https://radar.tudominio.com`) y HTTPS:

```bash
sudo nano /etc/nginx/sites-available/radar
```

Contenido:

```nginx
server {
    listen 80;
    server_name radar.tudominio.com;   # reemplazá por tu dominio

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar sitio y recargar Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/radar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Para HTTPS con Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d radar.tudominio.com
```

---

## 5. Resumen de comandos (servidor)

```bash
cd /var/www/radar
npm install
npm run build
# Crear .env.production con las variables de Firebase (y DATABASE_URL si aplica)
pm2 start npm --name "radar" -- start
pm2 save && pm2 startup
```

---

## 6. Otras opciones de publicación

| Opción | Descripción |
|--------|-------------|
| **Vercel** | Ideal para Next.js. Conectás el repo de GitHub y configurás las variables de entorno en el panel. Deploy automático en cada push. |
| **Railway / Render** | Similar: repo + variables de entorno, despliegue con un clic. |
| **Docker** | Podés usar el `Dockerfile` incluido en el proyecto (si lo agregás) y desplegar en cualquier servidor con Docker. |

Si me decís qué tenés (VPS Linux, Windows Server, Vercel, etc.), te doy los pasos exactos para ese caso.
