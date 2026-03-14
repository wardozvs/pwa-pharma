# 🔧 Guía de Configuración de Variables de Entorno

## 📋 Requisitos Previos

Necesitas obtener las siguientes variables:

### 1. Supabase (Base de Datos)
- URL de tu proyecto Supabase
- Clave anónima (anon key)

### 2. VAPID Keys (Notificaciones Push)
- Clave pública VAPID

---

## 🚀 Pasos de Configuración

### Paso 1: Obtener Credenciales de Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión o crea una cuenta
3. Crea un nuevo proyecto
4. En "Project Settings" → "API", copia:
   - **Project URL**: Esto es `SUPABASE_URL`
   - **anon public**: Esto es `SUPABASE_ANON_KEY`

### Paso 2: Generar VAPID Keys (opcional pero recomendado)

Para habilitar notificaciones push:

```bash
npm install -g web-push
web-push generate-vapid-keys
```

Copia la **Public Key** como `VAPID_PUBLIC_KEY`

### Paso 3: Configuración Local

1. Copia el archivo `.env.example` a `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Completa el archivo `.env.local` con tus credenciales:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
   VAPID_PUBLIC_KEY=BKey...
   ```

3. Ejecuta la aplicación localmente:
   ```bash
   npm start
   ```

### Paso 4: Configuración en Vercel

1. Ve a tu proyecto en [vercel.com](https://vercel.com)
2. Navega a **Settings** → **Environment Variables**
3. Agrega **exactamente** las tres variables (sin referencias @):

   | Variable | Value |
   |----------|-------|
   | `SUPABASE_URL` | `https://your-project.supabase.co` |
   | `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `VAPID_PUBLIC_KEY` | `BKey...` |

4. **Importante**: Deja los valores vagos en los "Environments" seleccionados:
   - ☑ Production
   - ☑ Preview  
   - ☑ Development

5. Click en **Save**
6. Haz un redeploy de tu proyecto:
   - Ve a la pestaña **Deployments**
   - Click en el último deployment (el que falló)
   - Click en **Redeploy**
   - Selecciona "Use existing Environment Variables"
   - Confirma

---

## ✅ Verificación

### ¿Está configurado correctamente?

Verifica que en la consola del navegador:
- No hay errores sobre "Supabase not configured"
- Puedes agregar medicamentos (se guardan localmente al menos)
- En versión en línea: Los datos sincronizar con Supabase

```bash
# Prueba local
npm start

# Abre http://localhost:4200
# Abre DevTools → Console
# Intenta agregar un medicamento
```

---

## 🔐 Seguridad

- **Nunca commitees `.env.local` a Git** (está en `.gitignore`)
- Usa la **clave anón** de Supabase, no la clave de servicio
- En Vercel, las variables se inyectan automáticamente durante el build
- El `.env.example` muestra solo los nombres, no contiene valores reales

---

## 🆘 Solución de Problemas

### Error: "env.SUPABASE_URL should be string"

Significa que las variables de entorno no están configuradas:

**Solución:**
1. Verifica que `.env.local` existe y tiene valores válidos (desarrollo local)
2. En Vercel, verifica que las variables bajo "Environment Variables" están completas
3. Redeploya el proyecto en Vercel para que aplique los cambios

### Error: "Supabase not configured"

Es un aviso informativo, no un error. Significa que:
- Las credenciales no están configuradas
- La aplicación seguirá funcionando offline con localStorage
- Los datos no se sincronizarán con Supabase

Configura las variables para habilitar la sincronización remota.

### Push Notifications no funcionan

1. Verifica que `VAPID_PUBLIC_KEY` está configurado en Vercel
2. Asegúrate de haber dado permisos de notificaciones al navegador
3. Genera nuevas keys si las antiguas no funcionan:
   ```bash
   web-push generate-vapid-keys
   ```

---

## 📚 Referencias

- [Documentación Supabase](https://supabase.com/docs)
- [Documentación VAPID](https://developer.mozilla.org/en-US/docs/Web/API/PushManager/subscribe)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
