# Sistema de Logs de Auditoría

## 📋 Descripción
Sistema completo de auditoría que registra todas las acciones administrativas importantes en el torneo.

## 🎯 Funcionalidades Implementadas

### 1. **Servicio de Logs** (`services/logService.ts`)
- `registrarLog()`: Registra una acción en Firestore
- `obtenerLogsRecientes()`: Recupera los últimos N logs
- Almacenamiento en colección `logs_auditoria`

### 2. **Acciones Registradas**

#### GestionPilotosScreen
- ✅ Eliminación de pilotos individuales
- ✅ Exportación de datos a CSV

#### AdminScreen
- ✅ Eliminación masiva de todos los jugadores
- ✅ Eliminación de todas las carreras
- ✅ Generación de Semifinales A

#### MoverPilotosScreen
- ✅ Movimiento de pilotos entre carreras

### 3. **Pantalla de Visualización** (`screens/admin/LogsScreen.tsx`)
- Lista cronológica de últimos 100 logs
- Colores por tipo de acción:
  - 🗑️ Rojo: Eliminaciones
  - ⚙️ Azul: Generaciones de fases
  - 🔄 Naranja: Movimientos
  - 📊 Verde: Exportaciones
- Información detallada: fecha, hora, admin, acción, detalles

### 4. **Navegación**
- Botón "📋 Ver Logs de Auditoría" en AdminScreen
- Ruta integrada en AppNavigator

## 🔧 Estructura de Log

```typescript
{
  fecha: Date,
  admin_correo: string,
  accion: string,
  detalles: string
}
```

## 📊 Ejemplo de Logs

```
📋 LOGS DE AUDITORÍA
-------------------
🗑️ ELIMINAR_PILOTO
Piloto eliminado: Juan Pérez (DNI: 12345678A) de Clasificatoria 1
👤 Admin: admin@torneo.com
📅 10/03/2026 14:32:15

🔄 MOVER_PILOTO
Juan García movido de 'Clasificatoria 2' a 'Clasificatoria 5'
👤 Admin: admin@torneo.com
📅 10/03/2026 14:28:03

📊 EXPORTAR_CSV
Exportados 45 pilotos a CSV
👤 Admin: admin@torneo.com
📅 10/03/2026 14:15:22
```

## 🚀 Próximas Mejoras (Opcionales)

1. **Autenticación**: Reemplazar "admin@torneo.com" con usuario real del contexto
2. **Filtros**: Por tipo de acción, fecha, administrador
3. **Búsqueda**: Por palabras clave en detalles
4. **Exportar Logs**: Descargar logs a CSV para guardar historial
5. **Límite de retención**: Auto-eliminar logs antiguos (>30 días)

## 📝 Notas Técnicas

- Los logs se almacenan en Firestore (no SQLite)
- Ordenados por fecha descendente
- Indexados automáticamente por Firestore
- Sin límite de almacenamiento (revisar costos si hay muchos logs)

## ⚠️ Consideraciones

- **Privacidad**: Los logs contienen información sensible (DNIs, nombres)
- **Cumplimiento**: Puede requerirse para auditorías legales
- **Performance**: 100 logs no afectan rendimiento, pero revisar si se necesitan miles
- **Backup**: Exportar logs importantes periódicamente

---

**Fecha de implementación**: 10 de marzo de 2026
**Versión**: 1.0
