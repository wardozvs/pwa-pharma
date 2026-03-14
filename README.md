# PharmaManager - PWA de Gestión de Medicamentos

Una aplicación web progresiva (PWA) moderna para gestionar tu inventario de medicamentos con sincronización en tiempo real, notificaciones de caducidad y soporte offline.

## 🎯 Funcionalidades

- **Gestión de Medicamentos**: Registra medicamentos con nombre, dosis (mg), cantidad de tabletas y fecha de caducidad
- **Escaneo de Códigos de Barras**: Usa la cámara de tu dispositivo para escanear códigos de barras
- **Notificaciones Inteligentes**: Recibe notificaciones automáticas cuando un medicamento está próximo a caducar (60 días)
- **Sincronización Remota**: Conecta con Supabase para sincronizar datos en múltiples dispositivos
- **Soporte Offline**: Accede a tus medicamentos incluso sin conexión a internet
- **Pantalla de Splash**: Diseño atractivo con animación de carga
- **Interfaz Responsiva**: Funciona perfectamente en desktop y mobile

## 🛠️ Tecnologías

- **Angular 19+**: Framework base
- **Angular SSR (Universal)**: Renderización en servidor
- **Angular PWA**: Conversión en Progressive Web App
- **Supabase**: Base de datos y autenticación
- **Tailwind CSS**: Estilos
- **date-fns**: Manipulación de fechas
- **RxJS**: Manejo de datos reactivos

## 📋 Requisitos Previos

- Node.js 18+
- npm 9+

## 🚀 Instalación Local

### 1. Clonar el repositorio

\\\ash
git clone <tu-repo-url>
cd PharmaManager
\\\

### 2. Instalar dependencias

\\\ash
npm install
\\\

### 3. Ejecutar la aplicación

\\\ash
npm start
\\\

La aplicación estará disponible en \http://localhost:4200\

## 🚀 Deployment en Vercel

1. Conecta tu repositorio GitHub en [vercel.com](https://vercel.com)
2. Configura las variables de entorno:
   - SUPABASE_URL
   - SUPABASE_ANON_KEY
   - VAPID_PUBLIC_KEY
3. Vercel detectará automáticamente la configuración de Angular y realizará el deploy

## 📱 Instalación como PWA

1. Abre la aplicación en un navegador compatible
2. Busca la opción "Instalar" o "Agregar a pantalla de inicio"
3. Confirma la instalación

## 📄 Licencia

MIT - Libre para usar y modificar
