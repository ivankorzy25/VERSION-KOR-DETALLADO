# 🔐 Guía Completa: Configurar HTTPS

Esta guía te ayudará a configurar HTTPS en tu servidor Ubuntu para que el backend funcione desde cualquier lugar, incluso con GitHub Pages.

---

## 📋 **Requisitos Previos**

- ✅ Servidor Ubuntu 24.04 corriendo
- ✅ Backend instalado y funcionando (puerto 3001)
- ✅ Acceso al router para configurar port forwarding

---

## 🚀 **Paso 1: Conectarte al Servidor**

```bash
ssh ivan@192.168.1.100
# Contraseña: Alvlgeddl2025
```

---

## 📥 **Paso 2: Descargar y Ejecutar el Script**

```bash
# Ir a la carpeta del proyecto
cd ~/projects/VERSION-KOR-DETALLADO/backend

# Actualizar repositorio
git pull origin main

# Dar permisos de ejecución al script
chmod +x setup-https.sh

# Ejecutar el script
./setup-https.sh
```

---

## 📝 **Paso 3: Durante la Ejecución del Script**

El script te pedirá:

### 1️⃣ **Subdominio de DuckDNS**

Ve a https://www.duckdns.org/ y:
- Inicia sesión con Google/GitHub/Twitter
- Crea un subdominio (ejemplo: `kor-generadores`)
- Anota el **TOKEN** que te muestra

Ingresa en el script:
```
Subdominio: kor-generadores
Token: (pega el token que copiaste)
```

### 2️⃣ **Email para Let's Encrypt**

Ingresa tu email real (para notificaciones de renovación):
```
Email: tu_email@gmail.com
```

---

## 🌐 **Paso 4: Configurar Port Forwarding en tu Router**

**IMPORTANTE:** Debes redirigir los puertos de Internet a tu servidor.

### **Cómo acceder a tu router:**

1. Abre un navegador
2. Ve a: `http://192.168.1.1` (o `192.168.0.1`)
3. Ingresa usuario/contraseña del router

### **Configurar Port Forwarding:**

Busca una sección llamada:
- **Port Forwarding** o
- **Virtual Server** o
- **NAT** o
- **Aplicaciones y Juegos**

Agrega estas 2 reglas:

| Puerto Externo | Puerto Interno | IP Interna | Protocolo |
|----------------|----------------|------------|-----------|
| 80 | 80 | 192.168.1.100 | TCP |
| 443 | 443 | 192.168.1.100 | TCP |

**Guarda** y **aplica** los cambios.

---

## 🧪 **Paso 5: Verificar que Funciona**

Después de ejecutar el script, prueba:

```bash
# Desde el servidor Ubuntu
curl https://TU_SUBDOMINIO.duckdns.org/api/health
```

Deberías ver:
```json
{"status":"OK","timestamp":"...","uptime":...}
```

---

## 📱 **Paso 6: Actualizar el Frontend**

Edita el archivo `api.js`:

```javascript
const API_CONFIG = {
    baseURL: 'https://TU_SUBDOMINIO.duckdns.org/api',
    timeout: 30000
};
```

Sube los cambios a GitHub:

```bash
git add api.js
git commit -m "Actualizar URL a HTTPS"
git push
```

---

## ✅ **Paso 7: Probar desde GitHub Pages**

1. Espera 2-3 minutos (GitHub Pages actualiza)
2. Abre: https://ivankorzy25.github.io/VERSION-KOR-DETALLADO/
3. Login: `admin` / `kor2025`
4. Activa Modo Interno: `2323`
5. Abre el editor de imágenes
6. **Debería funcionar sin errores** ✨

---

## 🔄 **Mantenimiento**

### **Verificar renovación automática:**
```bash
sudo systemctl status certbot.timer
```

### **Renovar manualmente (si es necesario):**
```bash
sudo certbot renew
```

### **Ver logs de Nginx:**
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Reiniciar servicios:**
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar Backend
pm2 restart kor-backend
```

---

## ❓ **Troubleshooting**

### **Error: "Connection timed out"**

Verifica que:
- El port forwarding esté configurado correctamente
- Los puertos 80 y 443 estén abiertos en el firewall
```bash
sudo ufw status
```

### **Error: "DNS resolution failed"**

Verifica que DuckDNS esté actualizado:
```bash
cat ~/duckdns/duck.log
```

Debe mostrar: `OK`

Si dice `KO`, verifica el token y el subdominio.

### **Error: "Certificate verification failed"**

El certificado puede tardar unos segundos en activarse. Espera 1-2 minutos y vuelve a intentar.

---

## 🔒 **Seguridad**

El script configura:
- ✅ Certificado SSL válido (3 meses)
- ✅ Renovación automática
- ✅ HTTP → HTTPS redirect
- ✅ CORS headers para GitHub Pages
- ✅ Headers de seguridad (Nginx)

---

## 📞 **Soporte**

Si tienes problemas, verifica:

1. **Backend corriendo:**
```bash
pm2 status
```

2. **Nginx corriendo:**
```bash
sudo systemctl status nginx
```

3. **Certificado SSL válido:**
```bash
sudo certbot certificates
```

4. **Prueba local:**
```bash
curl http://localhost:3001/api/health
```

---

**¡Listo!** Tu backend ahora funciona con HTTPS desde cualquier lugar. 🎉
