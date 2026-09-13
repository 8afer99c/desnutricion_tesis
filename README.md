# Sistema Predictivo de Desnutrición Crónica Infantil

![Estado](https://img.shields.io/badge/Estado-Producci%C3%B3n-success)
![Stack](https://img.shields.io/badge/Stack-React%20%7C%20FastAPI%20%7C%20XGBoost-blue)

Este repositorio contiene una aplicación web Full-Stack diseñada para analizar y predecir el riesgo de desnutrición crónica en la población infantil. El núcleo del sistema es un motor de inteligencia artificial (XGBoost) entrenado con datos de encuestas nacionales de salud y nutrición (ENSANUT).

## 🚀 Arquitectura del Proyecto

El proyecto está dividido en dos capas principales, contenidas dentro del directorio `API_DESNUTRICION`:

- **Backend (`/backend`)**: Construido con **FastAPI** y Python. Expone los endpoints REST para realizar predicciones individuales y por lotes, calcular métricas globales y analizar la importancia de variables del modelo XGBoost (`modelo_v2.joblib`).
- **Frontend (`/frontend`)**: Interfaz gráfica moderna y profesional construida con **React 19**, **TypeScript** y empaquetada con **Vite**. Utiliza **Tailwind CSS v4** para los estilos, **Recharts** para visualización de datos y **Framer Motion** para transiciones fluidas.

## 📂 Estructura de Directorios

```text
desnutricion_tesis/
├── API_DESNUTRICION/
│   ├── backend/          # API REST (FastAPI), Modelos ML (.joblib) y Datasets
│   ├── frontend/         # Interfaz de Usuario (React, Vite, Tailwind CSS)
│   └── docs/             # Documentación adicional del proyecto
└── README.md             # Este archivo
```

## ⚙️ Requisitos Previos

Asegúrate de tener instalado en tu sistema local:
- **Node.js** (v18 o superior) y npm
- **Python** (v3.9 a v3.13)
- Gestor de paquetes `pip`

## 🛠️ Instalación y Configuración

Sigue estos pasos para desplegar el entorno de desarrollo en tu máquina local.

### 1. Configurar el Backend (FastAPI)

Abre una terminal, navega a la carpeta del backend y crea un entorno virtual:

```bash
cd API_DESNUTRICION/backend
python -m venv venv
```

Activa el entorno virtual:
- En **Windows**: `venv\Scripts\activate`
- En **Mac/Linux**: `source venv/bin/activate`

Instala las dependencias necesarias:
```bash
pip install -r requirements.txt
```

### 2. Configurar el Frontend (React)

Abre una nueva pestaña en tu terminal y navega a la carpeta del frontend:

```bash
cd API_DESNUTRICION/frontend
npm install
```

## ▶️ Ejecución de la Aplicación

Para utilizar la aplicación, debes mantener ambos servidores (Backend y Frontend) corriendo simultáneamente en terminales separadas.

### Iniciar Backend (Puerto 8000)
```bash
cd API_DESNUTRICION/backend
# Asegúrate de tener el entorno virtual activado
python -m uvicorn app.main:app --reload
```
*La API estará disponible en `http://localhost:8000` (y su documentación Swagger en `/docs`).*

### Iniciar Frontend (Puerto 5173)
```bash
cd API_DESNUTRICION/frontend
npm run dev
```
*Abre tu navegador web y visita `http://localhost:5173` para usar la aplicación.*

## 📊 Características Principales

1. **Dashboard Clínico:** Vista global con KPI's poblacionales (Evaluados, Casos en riesgo, Prevalencia) alimentados por el dataset base.
2. **Predicción Individual:** Formulario interactivo que permite ingresar los parámetros clínicos de un paciente (Edad, Sexo, Lactancia, Episodios de diarrea, etc.) y devuelve un diagnóstico probabilístico en tiempo real.
3. **Métricas del Modelo:** Evaluación técnica del desempeño del XGBoost, mostrando exactitud, precisión, recall, F1 Score y el nivel de impacto/peso de las variables médicas.

---
*Proyecto desarrollado para investigación y análisis predictivo en salud pública.*
