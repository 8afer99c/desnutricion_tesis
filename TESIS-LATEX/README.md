# Tesis — Modelos de Machine Learning para la predicción de indicadores de salud pública (OSEMN, Tungurahua)

Autor: Fernando José Ochoa Cobeña · Tutora: Ing. Fátima Adriana Avilés Castillo, Mg. · UTI
Formato: plantilla `tesis-uti.cls`. Compilar con `compilar.bat` (pdflatex → bibtex → pdflatex ×2).
Resultado: `main.pdf`, **123 páginas** (borrador).

## Reparto de páginas
Preliminares 1–18 · Cap. I 19–32 · Cap. II 33–46 · Cap. III 47–65 · Cap. IV 66–70 ·
Referencias 71–74 · Glosario 75–77 · Anexos A–I 78–123.

## Estructura
- `configuracion.tex` — datos de portada/actas (título registrado, autor, tutora, cédula, fechas).
- `preliminares/`, `capitulos/` (cap. I–IV, `extra-cap*.tex` y glosario), `anexos.tex` (A–I), `anexos/` (tablas generadas y código), `referencias.bib`.
- `figuras/` — figuras generadas con el modelo v2 real.

## Fuente de las cifras
Métricas: `TESIS MACHINE LEARNING/.../pipeline_v2/output/metricas_v2.json` (umbral 0.42; NO las de
`CONTEXTO_PROYECTO.md`). Métricas de Tungurahua, IC (bootstrap), 4 modelos por clase, umbral, calibración,
subgrupos, prueba sin variables de diseño, importancia, diccionario y pruebas de API se calcularon con
`modelo_v2.joblib` (entorno Python 3.13 + scikit-learn 1.6.1). Los cálculos no modifican el pipeline.

## Datos a confirmar en la revisión
El documento no lleva marcadores de trabajo. Quedan estos datos, que dependen de la revisión del tutor o de quien los aporte:
1. Nombres de los lectores (tribunal): las líneas de firma de la pág. iv están en blanco.
2. Diagnóstico AS-IS (Cap. II): se reconstruyó desde la documentación del INEC, sin entrevista a usuarios; la limitación está declarada.
3. Fechas del cronograma y montos del presupuesto (Cap. III): valores estimados.
4. URLs públicas de la API y del tablero (Anexo B.2): el texto solo indica el uso local.

Resueltos antes de la entrega: título (se mantiene el registrado, por indicación del tutor; Cap. I «Relación con el tema del trabajo»),
interfaz corregida (b441664), repositorio y hash (Anexo E) y `LIMPIEZA.ipynb` recuperado (commit 1b4b767).

## Hallazgos del prototipo/datos (ya documentados en cap. III–IV)
Riesgo BAJO con clase 1 (CORREGIDO en 7b37205 / 588d8fe: BAJO <=> clase 0, ALTO desde 0.60); `/dashboard` resumía predicciones sobre datos de entrenamiento (CORREGIDO en d785b95 / edf40ae: usa el conjunto de prueba); sin autenticación (decisión de alcance: datos públicos; el servicio guarda copia de los archivos clasificados);
formulario individual: la versión inicial rellenaba 106 variables con 0 (siempre clase 1); ahora envía nulos, pero sigue siendo solo ilustrativo (85.5 % clase 1); `.xlsx` → excepción (CORREGIDO en db5a77f / 89a23d5: lectura controlada de CSV y Excel); 84/114 predictores con
nulos originales imputados antes de la partición; sensibilidad muy distinta por área/edad; Brier peor que la prevalencia.
