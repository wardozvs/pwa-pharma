# 🚀 Guía de Deployment en Vercel

## Problema: "Secret does not exist"

Si ves este error durante el deploy:
```
Deployment failed — Environment Variable "SUPABASE_URL" references Secret "supabase_url", which does not exist.
```

Es porque `vercel.json` estaba intentando referenciar secrets que no existían. **Esto ya está resuelto** ✅

---

## ✅ Pasos Corretos para Deploy en Vercel

### 1. Prepara tus Credenciales Locales

Primero, completa tu archivo `.env.local` con tus credenciales reales:

```bash
# .env.local
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VAPID_PUBLIC_KEY=BKey...
```

Prueba localmente:
```bash
npm start
# Verifica que la app funcioneperfectamente con los datos
```

### 2. Conecta tu Repositorio en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Click en **Add New...** → **Project**
3. Selecciona **Import Git Repository**
4. Busca tu repositorio `pwa-pharma`
5. Click **Import**
6. Vercel detectará automáticamente:
   - ✅ Framework: Angular
   - ✅ Build Command: `npm run build`
   - ✅ Output Directory: `dist/PharmaManager/browser`

### 3. Configura Environment Variables en Vercel

**Importante**: No uses secrets (sintaxis `@`), agrega valores directos:

1. Aún en la página de import, ve a **Environment Variables**
2. Click **Add New** para cada variable:

   **Variable 1:**
   - Name: `SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
   - Environment: ☑ Production ☑ Preview ☑ Development

   **Variable 2:**
   - Name: `SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Environment: ☑ Production ☑ Preview ☑ Development

   **Variable 3:**
   - Name: `VAPID_PUBLIC_KEY`
   - Value: `BKey...`
   - Environment: ☑ Production ☑ Preview ☑ Development

3. Click **Deploy**

### 4. Espera el Primer Deploy

Vercel compilará tu proyecto. Esto puede tomar 2-3 minutos.

✅ **Éxito** = Ves el badge "Production Deployment"
❌ **Error** = Revisa los logs en **Deployments** → último deployment

### 5. Si Falla el Deploy

Si el deploy falla, **no intentes modificar secrets**:

1. Ve a tu proyecto en Vercel
2. Navega a **Settings** → **Environment Variables**
3. Verifica que las 3 variables están creadas correctamente
4. Ve a **Deployments** → último deployment (rojo/fallido)
5. Click en **Redeploy** (arriba a la derecha)

---

## 📋 Checklist Completo

- [ ] `.env.local` tiene valores reales de Supabase
- [ ] App funciona localmente con `npm start`
- [ ] Repositorio está en GitHub
- [ ] Vercel tiene acceso a tu repositorio
- [ ] SUPABASE_URL configurada en Vercel
- [ ] SUPABASE_ANON_KEY configurada en Vercel
- [ ] VAPID_PUBLIC_KEY configurada en Vercel (opcional)
- [ ] Deploy completado exitosamente
- [ ] Puedes acceder a `https://your-app.vercel.app`

---

## 🔍 Verificar que Todo Funciona

Una vez deployado:

1. Abre tu sitio en `https://your-project.vercel.app`
2. Intenta agregar un medicamento
3. Recarga la página → **Debe persistir si Supabase está configurado**
4. Abre DevTools (F12) → Console
5. Deberías ver: `✓ Supabase initialized successfully`

Si ves: `⚠ Supabase not configured`
- Las variables de entorno no se pasaron correctamente
- Revisa "Environment Variables" en Vercel

---

## 🆘 Errores Comunes

### Error: "Supabase not configured"
- Verifica que en Vercel **Settings** → **Environment Variables** están creadas
- Redeploya el proyecto
- Espera 2 minutos para que Vercel reconstruya

### Error: "Cannot POST .../rest/v1/medicines"
- SUPABASE_URL es inválido (no contiene `https://` o no termina en `.supabase.co`)
- Verifica el valor exacto en tu panel de Supabase

### Error: "401 Unauthorized"
- SUPABASE_ANON_KEY es incorrecto
- Copia exactamente el valor de Supabase dashboard

---

## 📚 Referencias

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys)
- [Angular on Vercel](https://vercel.com/docs/frameworks/angular)
