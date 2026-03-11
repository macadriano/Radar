# Despliegue en Ubuntu VPS

Guía paso a paso para publicar **Radar Contractual** en un VPS con Ubuntu (22.04 o 24.04). Ejecutá los bloques en orden, conectado por SSH a tu servidor.

---

## 1. Conectarte al VPS

```bash
ssh tu_usuario@IP_DE_TU_VPS
```

---

## 2. Instalar Node.js 20 (LTS)

```bash
# Actualizar paquetes
sudo apt update && sudo apt upgrade -y

# Node.js 20 desde NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node -v   # debe mostrar v20.x.x
npm -v
```

---

## 3. Crear carpeta y obtener el proyecto

**Opción A – Con Git (recomendado)**

```bash
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Reemplazá por la URL real de tu repositorio
git clone https://github.com/TU-USUARIO/Radar.git radar
cd radar
```

**Opción B – Subir desde tu PC con SCP**

En tu **PC Windows** (PowerShell), desde la carpeta del proyecto:

```powershell
scp -r .next package.json package-lock.json public prisma src next.config.ts tsconfig.json ecosystem.config.cjs usuario@IP_DE_TU_VPS:/var/www/radar/
```

Luego en el **VPS**:

```bash
sudo mkdir -p /var/www/radar
sudo chown $USER:$USER /var/www/radar
cd /var/www/radar
# Si subiste por SCP, los archivos ya están; si no, repite el scp desde la PC
```

Si usaste SCP sin `src` y configs, mejor usar Git para no olvidar archivos.

---

## 4. Instalar dependencias y construir

```bash
cd /var/www/radar

npm install
npm run build
```

Si aparece algún error de memoria durante el build:

```bash
export NODE_OPTIONS="--max-old-space-size=1024"
npm run build
```

---

## 5. Variables de entorno en el servidor

```bash
nano .env.production
```

Pegá y reemplazá con tus valores de Firebase (los mismos que en tu `.env.local` local):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

Opcional, si usás PostgreSQL:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/radar"
```

Guardar: `Ctrl+O`, `Enter`, `Ctrl+X`.

---

## 6. PM2: dejar la app corriendo

```bash
cd /var/www/radar

sudo npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Copiá y ejecutá el comando que te muestra `pm2 startup` (suele ser algo como `sudo env PATH=... pm2 startup systemd -u tu_usuario --hp /home/tu_usuario`).

Comprobar:

```bash
pm2 status
curl -I http://127.0.0.1:3000
```

Si `curl` devuelve `HTTP/1.1 200 OK`, la app responde en el puerto 3000.

---

## 7. Nginx: acceder por dominio o IP (puerto 80)

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/radar
```

Pegá esto y, si tenés dominio, reemplazá `radar.tudominio.com` por tu dominio o dejá `_` para aceptar cualquier nombre (útil si solo usás IP):

```nginx
server {
    listen 80;
    server_name radar.tudominio.com _;

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
sudo ln -sf /etc/nginx/sites-available/radar /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Abrí en el navegador: `http://IP_DE_TU_VPS` o `http://radar.tudominio.com`.

---

## 8. HTTPS con Let's Encrypt (si tenés dominio)

Solo si ya apuntás el dominio al VPS (registro A o CNAME):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d radar.tudominio.com
```

Respondé el asistente (email, aceptar términos). Certbot configura HTTPS y la renovación automática.

Luego en **Firebase Console** → Authentication → Authorized domains → agregá `radar.tudominio.com` para que el login funcione en producción.

---

## 9. Comandos útiles después del despliegue

| Acción              | Comando                    |
|---------------------|----------------------------|
| Ver estado de la app| `pm2 status`               |
| Ver logs            | `pm2 logs radar`           |
| Reiniciar la app   | `pm2 restart radar`        |
| Detener             | `pm2 stop radar`           |
| Actualizar y redesplegar | `cd /var/www/radar && git pull && npm install && npm run build && pm2 restart radar` |

---

## 10. Resumen rápido (ya con Node y Git instalados)

```bash
cd /var/www
git clone https://github.com/TU-USUARIO/Radar.git radar
cd radar
npm install && npm run build
nano .env.production   # pegar variables de Firebase
pm2 start ecosystem.config.cjs && pm2 save && pm2 startup
sudo apt install -y nginx
# configurar site radar y sudo nginx -t && sudo systemctl reload nginx
```

Listo: la app queda publicada en tu Ubuntu VPS.
