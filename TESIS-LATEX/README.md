# Tesis — Clasificación de desnutrición crónica infantil (ENSANUT 2018, Tungurahua)

Autor: Fernando José Ochoa Cobeña · Tutora: Ing. Fátima Adriana Avilés Castillo, Mg. · UTI
Formato: plantilla `tesis-uti.cls`. Compilar con `compilar.bat` (pdflatex → bibtex → pdflatex ×2).
Resultado: `main.pdf`, **121 páginas** (borrador).

## Reparto de páginas
Preliminares 21 · Cap. I 22–34 · Cap. II 35–48 · Cap. III 49–65 · Cap. IV 66–70 ·
Referencias 71–74 · Glosario 75–77 · Anexos A–I 78–118.

## Estructura
- `configuracion.tex` — datos de portada/actas (título propuesto, autor, tutora, cédula, fechas).
- `preliminares/`, `capitulos/` (cap. I–IV, `extra-cap*.tex` y glosario), `anexos.tex` (A–I), `anexos/` (tablas generadas y código), `referencias.bib`.
- `figuras/` — figuras generadas con el modelo v2 real.

## Fuente de las cifras
Métricas: `TESIS MACHINE LEARNING/.../pipeline_v2/output/metricas_v2.json` (umbral 0.42; NO las de
`CONTEXTO_PROYECTO.md`). Métricas de Tungurahua, IC (bootstrap), 4 modelos por clase, umbral, calibración,
subgrupos, prueba sin variables de diseño, importancia, diccionario y pruebas de API se calcularon con
`modelo_v2.joblib` (entorno Python 3.13 + scikit-learn 1.6.1). Los cálculos no modifican el pipeline.

## Pendientes (texto en rojo `[PENDIENTE: …]`)
1. Confirmar el título propuesto con la tutora. 2. Nombres de los lectores (tribunal).
3. Diagnóstico AS-IS: ¿basta sin entrevista? 4. Interfaz: (interfaz YA corregida y capturas nuevas tomadas el 2026-09-20; commit b441664 en `pipeline-v2-fixes`, publicado en github.com/8afer99c/desnutricion_tesis). 5. Fechas y montos reales (cronograma, presupuesto).
6. URLs públicas de la API y del dashboard (Anexo B.2). (Repositorio y hash ya documentados en Anexo E; `LIMPIEZA.ipynb` recuperado del commit 1b4b767: imputación con moda/mediana sobre la base completa.)

## Hallazgos del prototipo/datos (ya documentados en cap. III–IV)
Riesgo BAJO con clase 1; `/dashboard` resume predicciones sobre datos de entrenamiento; sin autenticación;
formulario individual rellena 106 variables con 0 (siempre clase 1); `.xlsx` → excepción; 84/114 predictores con
nulos originales imputados antes de la partición; sensibilidad muy distinta por área/edad; Brier peor que la prevalencia.
