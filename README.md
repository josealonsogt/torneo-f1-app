# 🏁 Matsuri Racing - Kaizō Sim

![Estado](https://img.shields.io/badge/Estado-En_Producción-success?style=for-the-badge)
![Open Source](https://img.shields.io/badge/Open_Source-Sí-blue?style=for-the-badge)

**Matsuri Racing** es una plataforma completa de gestión de torneos de **SimRacing** desarrollada para **Kaizō Sim**. 
Permite controlar todo el flujo de un evento: desde la inscripción de pilotos hasta la generación automática de la **Gran Final**, incluyendo un *Live Timing* público y avisos por **WhatsApp**[cite: 1].

👉 **[PROBAR LA APP EN VIVO AQUÍ](https://torneo-matsuri.vercel.app)** 👈  
📄 **[Ver Manual de Usuario y Documentación (PDF)](./kaizo%20sim%20aplicacion.pdf)**

---

## 🔐 Acceso de Prueba (Administrador)

Para probar todas las funcionalidades del panel de control, puedes utilizar las credenciales de administrador:
*   **Usuario:** `admin`[cite: 1]
*   **Correo:** `admin@torneo.com`[cite: 1]
*   **Contraseña:** `admin`[cite: 1]

*Nota sobre el login:* Al registrarse como nuevo jugador, se pide nombre, correo y DNI. Sin embargo, el DNI es el identificador principal; si se introduce un DNI previamente registrado, el sistema accederá a ese perfil existente[cite: 1].

---

## 🏎️ ¿Qué hace la aplicación?

La app está dividida en **3 grandes bloques** para que el torneo fluya sin interrupciones:

### 👑 Centro de Mando (Admin)
Panel de control para los organizadores del torneo[cite: 1].
*   Creación automática de las 16 clasificatorias[cite: 1].
*   Generación elástica de Semifinales y Finales (avanzan los ganadores)[cite: 2].
*   Asignación de posiciones y tiempos[cite: 1].
*   Botón de aviso rápido a los pilotos por WhatsApp[cite: 1].
*   Logs de Auditoría para visualizar el registro de todos los cambios logísticos[cite: 2].

### 🚦 Tu Box (Pilotos)
Cada piloto tiene su propio espacio dentro de la plataforma.
*   Perfil personal de piloto (Box)[cite: 3].
*   Estado en tiempo real dentro del torneo (En Lista de Espera, Clasificado, Eliminado)[cite: 3].
*   Historial completo de todas las carreras disputadas[cite: 3].

### 📺 Live Timing & Pantalla Gigante
Vista pública pensada para espectadores y eventos presenciales.
*   Seguimiento en directo del torneo[cite: 3].
*   Vista Bracket / Cuadrante proyectable en grandes pantallas[cite: 2].
*   Ideal para eventos físicos.

---

## 🛠️ Tecnologías Principales

*   **Frontend:** React Native + Expo (Web, iOS y Android)
*   **Backend:** Firebase
*   **Base de datos:** Firestore (tiempo real)
*   **Diseño:** Brutalismo UI, alto contraste y tipografía agresiva
