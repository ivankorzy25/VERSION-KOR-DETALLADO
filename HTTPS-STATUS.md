# 🔐 Estado de Configuración HTTPS

## ✅ Lo que YA está funcionando

### Backend
- ✅ Node.js backend corriendo en puerto 3001
- ✅ PM2 configurado para inicio automático
- ✅ API funciona correctamente en HTTP local

### Infraestructura
- ✅ Nginx instalado y configurado
- ✅ DuckDNS configurado: `lista-precios.duckdns.org`
- ✅ DNS actualizado (IP: 190.50.173.83)
- ✅ Certbot instalado
- ✅ Firewall puertos 80/443 abiertos
- ✅ Port forwarding configurado en router

---

## ⚠️ Problema Actual: DNS NO PROPAGADO GLOBALMENTE

### El Issue

El dominio `lista-precios.duckdns.org` resuelve correctamente desde tu ISP local (Speedy: 186.130.128.250), pero **NO desde DNS públicos como Google (8.8.8.8)**.

Let's Encrypt usa DNS públicos para validar el dominio, por eso falla con:
```
DNS problem: SERVFAIL looking up A for lista-precios.duckdns.org
```

### Verificación

```bash
# Funciona con tu DNS local
$ nslookup lista-precios.duckdns.org
Servidor:  186-130-128-250.speedy.com.ar
Address:  190.50.173.83  ✅

# Falla con Google DNS
$ nslookup lista-precios.duckdns.org 8.8.8.8
DNS request timed out  ❌
```

---

## 🔧 SOLUCIÓN 1: Certificado Autofirmado (Inmediato)

Usa un certificado autofirmado que funciona inmediatamente pero muestra advertencia en el navegador.

### Pasos en el servidor Ubuntu:

```bash
# 1. Conectar al servidor
ssh ivan@192.168.1.100
# Contraseña: Alvlgeddl2025

# 2. Ir al proyecto
cd ~/projects/VERSION-KOR-DETALLADO/backend

# 3. Ejecutar script de certificado autofirmado
chmod +x setup-selfsigned.sh
./setup-selfsigned.sh
```

**Resultado:**
- ✅ HTTPS funcionando inmediatamente
- ⚠️ Navegador mostrará "Conexión no segura"
- ⚠️ Debes hacer clic en "Avanzado" → "Continuar"

### Actualizar frontend

Luego actualiza [api.js:8](api.js#L8):

```javascript
baseURL: 'https://lista-precios.duckdns.org/api',
```

---

## 🔧 SOLUCIÓN 2: Let's Encrypt (Recomendado, requiere espera)

Esperar 2-12 horas para que DNS propague globalmente, luego obtener certificado válido.

### Verificar propagación DNS

Primero verifica que el DNS funciona globalmente:

```bash
# Desde tu PC Windows
nslookup lista-precios.duckdns.org 8.8.8.8
```

Debe mostrar:
```
Address:  190.50.173.83  ✅
```

### Obtener certificado Let's Encrypt

Una vez que DNS propague:

```bash
# 1. Conectar al servidor
ssh ivan@192.168.1.100

# 2. Ejecutar Certbot
sudo certbot --nginx -d lista-precios.duckdns.org --non-interactive --agree-tos --email ivan@korzy.com --redirect
```

**Resultado:**
- ✅ Certificado SSL válido 90 días
- ✅ Renovación automática configurada
- ✅ Sin advertencias en navegador

---

## 🧪 Testing

### Test 1: Backend local (HTTP)
```bash
ssh ivan@192.168.1.100
curl http://localhost:3001/api/health
```

Debe devolver:
```json
{"status":"OK","timestamp":"...","uptime":...}
```

### Test 2: Nginx local (HTTP)
```bash
ssh ivan@192.168.1.100
curl http://localhost/api/health
```

### Test 3: HTTPS local (con certificado)
```bash
ssh ivan@192.168.1.100
curl -k https://localhost/api/health
```

### Test 4: Desde tu PC

**Opción A - Con certificado autofirmado:**
```bash
curl -k https://lista-precios.duckdns.org/api/health
```

**Opción B - Con Let's Encrypt:**
```bash
curl https://lista-precios.duckdns.org/api/health
```

---

## 📊 Estado de Scripts Creados

| Script | Estado | Descripción |
|--------|--------|-------------|
| `setup-https.sh` | ✅ Creado | Setup completo HTTPS con Let's Encrypt |
| `setup-https-with-sudo.sh` | ✅ Creado | Mismo pero con contraseña sudo incluida |
| `setup-selfsigned.sh` | ✅ Creado | Certificado autofirmado (rápido) |
| `CONFIGURAR-HTTPS.md` | ✅ Creado | Documentación completa paso a paso |

---

## 🎯 Próximos Pasos Recomendados

### Opción A: Inmediato (Certificado Autofirmado)

1. **Conectar al servidor y ejecutar:**
   ```bash
   ssh ivan@192.168.1.100
   cd ~/projects/VERSION-KOR-DETALLADO/backend
   ./setup-selfsigned.sh
   ```

2. **Actualizar frontend:**
   - Editar [api.js:8](api.js#L8)
   - Cambiar a: `baseURL: 'https://lista-precios.duckdns.org/api'`
   - Commit y push a GitHub

3. **Probar desde GitHub Pages:**
   - Ir a: https://ivankorzy25.github.io/VERSION-KOR-DETALLADO/
   - Login: `admin` / `kor2025`
   - Activar Modo Interno: `2323`
   - Abrir editor de imágenes
   - Aceptar advertencia de certificado
   - Debería funcionar

### Opción B: Esperarhasta propagación DNS (2-12 horas)

1. **Verificar DNS cada hora:**
   ```bash
   nslookup lista-precios.duckdns.org 8.8.8.8
   ```

2. **Cuando funcione, ejecutar:**
   ```bash
   ssh ivan@192.168.1.100
   sudo certbot --nginx -d lista-precios.duckdns.org
   ```

3. **Actualizar frontend igual que Opción A**

---

## 🐛 Troubleshooting

### Problema: Port forwarding no funciona

Cuando accedes desde fuera a `lista-precios.duckdns.org`, obtienes respuesta de "micro_httpd" en vez de Nginx.

**Posibles causas:**
1. El router está redirigiendo a su propia interfaz web
2. Hay otro dispositivo en 192.168.1.100 respondiendo
3. La configuración de port forwarding no se guardó

**Solución:**
1. Ve al router (192.168.1.1)
2. Verifica port forwarding:
   - Puerto externo 80 → 192.168.1.100:80
   - Puerto externo 443 → 192.168.1.100:443
3. Guarda y reinicia el router si es necesario

### Problema: Nginx no arranca

```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuración
sudo tail -f /var/log/nginx/error.log
```

### Problema: Backend no responde

```bash
pm2 logs kor-backend
pm2 restart kor-backend
```

---

## 📞 Comandos Útiles

```bash
# Ver estado general
pm2 status
sudo systemctl status nginx
sudo certbot certificates

# Logs
pm2 logs kor-backend
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Reiniciar servicios
pm2 restart kor-backend
sudo systemctl reload nginx

# Test local
curl http://localhost:3001/api/health
curl http://localhost/api/health
curl -k https://localhost/api/health

# Verificar DNS
nslookup lista-precios.duckdns.org
nslookup lista-precios.duckdns.org 8.8.8.8
cat ~/duckdns/duck.log  # Debe mostrar "OK"
```

---

## 📝 Resumen

**¿Qué tenemos?**
- ✅ Backend funcionando
- ✅ Nginx configurado
- ✅ DNS configurado (pero no propagado globalmente)
- ✅ Scripts listos para HTTPS

**¿Qué falta?**
- ⏳ Esperar propagación DNS (2-12 horas), O
- 🚀 Usar certificado autofirmado (inmediato)

**Recomendación:**
Si necesitas que funcione YA → Usa certificado autofirmado
Si puedes esperar → Espera propagación DNS y usa Let's Encrypt

---

**Última actualización:** 10 de Noviembre 2025
