# 🏁 Matsuri Racing - Sistema de Gestión de Torneos

Sistema completo de gestión de torneos de carreras con sistema de "Embudo Elástico" para competiciones con número variable de participantes.

## 🎯 Características

- ✅ **Sistema Elástico**: Se adapta automáticamente de 20 a 128 participantes
- 🏆 **Fases del Torneo**: Clasificatorias → Semifinales A/B → Final B → Gran Final
- 📱 **Panel de Administración**: Gestión completa de carreras, jugadores y progresión
- 🔴 **Vista en Vivo**: Bracket visual en tiempo real para proyectar
- 👥 **Panel de Jugador**: Vista personalizada con estado y próxima carrera
- 🔥 **Actualización en Tiempo Real**: Firebase Firestore con listeners

## 🛠️ Tecnologías

- **Frontend**: React Native + Expo
- **Backend**: Firebase Firestore
- **Navegación**: React Navigation
- **Lenguaje**: TypeScript

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/TU_USUARIO/torneo-app.git
cd torneo-app

# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npx expo start
```

## ⚙️ Configuración Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Copia las credenciales en `services/firebaseConfig.js`
3. Configura las reglas de Firestore (ver abajo)

### Reglas de Seguridad Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /jugadores/{jugadorId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /carreras/{carreraId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    match /configuracion/{doc} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## 🎮 Uso

### Admin (Contraseña: admin123)
1. Login como admin
2. Abrir inscripciones
3. Generar jugadores bot o esperar registros
4. Gestionar carreras y avanzar fases

### Jugador
1. Registrarse con nombre
2. Ver estado del torneo en tiempo real
3. Consultar bracket completo

## 📱 Builds

```bash
# Build para Web
npx expo build:web

# Build para Android (requiere EAS)
eas build --platform android

# Build para iOS (requiere Mac + Apple Dev Account)
eas build --platform ios
```

## 🔐 Seguridad

⚠️ **IMPORTANTE ANTES DE PRODUCCIÓN**:
- [ ] Mover credenciales Firebase a variables de entorno
- [ ] Implementar Firebase Authentication real
- [ ] Configurar reglas de seguridad Firestore
- [ ] Cambiar contraseña de admin hardcoded

## 📄 Licencia

MIT License - Desarrollado por [Tu Nombre]

## 🤝 Contribuciones

Pull requests son bienvenidos. Para cambios mayores, abre un issue primero.
