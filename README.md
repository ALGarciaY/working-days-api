# Working Days API

API REST en **Node.js + TypeScript** que permite calcular fechas y horas hábiles en Colombia, teniendo en cuenta fines de semana y festivos.

---

## 🚀 Requisitos previos

- [Node.js](https://nodejs.org/) >= 18.x
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

---

## 📥 Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/ALGarciaY/working-days-api.git
   cd working-days-api
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear archivo `.env` en la raíz del proyecto:
   ```env
   BOGOTA_TZ=America/Bogota
   HOLIDAYS_URL=https://content.capta.co/Recruitment/WorkingDays.json
   ```

---

## 🛠️ Scripts disponibles

En el `package.json` ya están configurados los siguientes scripts:

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js"
  }
}
```

- **Desarrollo** (hot reload):
  ```bash
  npm run dev
  ```

- **Compilar**:
  ```bash
  npm run build
  ```

- **Producción local**:
  ```bash
  npm start
  ```

⚠️ Nota: En Vercel, la plataforma no usa npm start, sino que tomará dist/index.js automáticamente porque es el entrypoint exportado.

---

## 📡 Uso de la API

La API expone dos endpoints principales:

### 1. Endpoint raíz (comprobar que la API está corriendo)
```
GET /
```
📍 Uso: verificar que la API está activa.

### Ejemplo de request
```http
GET http://localhost:3000/
```

### Ejemplo de respuesta
```
Working Days API - GET /api/working-date?days=...&hours=...&date=...
```

### 2. Endpoint de cálculo de fechas hábiles
```
GET /api/working-date
```

### Parámetros de query
- `days`: número de días hábiles a sumar (opcional, entero positivo).
- `hours`: número de horas hábiles a sumar (opcional, entero positivo).
- `date`: fecha/hora inicial en formato ISO 8601 UTC con sufijo `Z` (opcional).  
  Si no se envía, se toma la hora actual en Colombia.

**Orden de operaciones**: primero se suman los días, luego las horas.

### Ejemplo de request
```http
GET http://localhost:3000/api/working-date?days=2&hours=3&date=2025-09-15T16:00:00Z
```

### Ejemplo de respuesta
```json
{
  "date": "2025-09-17T18:00:00Z"
}
```

---

## 📂 Estructura del proyecto

```
WORKING-DAYS-API/
    ├── src/
    │   ├── controllers/
    │   │   └── dateController.ts   # Controlador que expone el endpoint de cálculo de fechas, recibe   requests y devuelve responses
    │   ├── domain/
    │   │   └── dateService.ts      # Contiene toda la lógica de negocio: validación de días laborales, horas, festivos y cálculos
    │   ├── services/
    │   │   ├── holidayService.ts   # Servicio para obtener festivos desde una API externa (con cache local en memoria)
    │   │   └── config.ts           # Centraliza la carga de variables de entorno desde `.env`
    │   ├── index.ts                # Punto de entrada de la aplicación: levanta el servidor Express
    │   ├── routes.ts               # Define las rutas y conecta controladores con Express
    │   └── types.ts                # Tipos e interfaces TypeScript (ej: ApiError, HolidayResponse)
    │
    ├── .gitignore                  # Ignora dependencias, build y configuraciones locales
    ├── package.json                # Dependencias, scripts y metadatos del proyecto
    ├── README.md                   # Documentación del proyecto (instalación, uso, estructura)
    ├── tsconfig.json               # Configuración de TypeScript (compilación y reglas)
    └── vercel.json                 # Configuración de despliegue en Vercel (builds, rutas, etc.)
```

---

## ⚠️ Notas

- Si cambias de zona horaria o la URL de festivos, solo debes modificar el `.env`.
- La API usa caché de 1 hora para evitar sobrecargar el endpoint de festivos.
- Recuerda compilar con `npm run build` antes de ejecutar en producción.
