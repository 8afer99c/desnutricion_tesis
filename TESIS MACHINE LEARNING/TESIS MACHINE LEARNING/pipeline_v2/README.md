# pipeline_v2 — pipeline corregido de desnutrición crónica

Código **aditivo**: no modifica ningún CSV, notebook ni modelo original. Todo lo
que produce se escribe en `pipeline_v2/output/` (ignorado por git).

Corrige tres defectos del pipeline original:

1. **Fuga de datos**: `LIMPIEZA.ipynb` imputaba con la mediana los ~2,017
   valores faltantes del target, fabricando etiquetas (todas clase 0). Aquí esas
   filas se eliminan (`build_clean_dataset.py`).
2. **Selección de modelo rota**: antes se comparaban 4 modelos y luego se
   optimizaba XGBoost sin importar cuál ganaba. Ahora la comparación decide de
   verdad (`entrenar_modelo.py`).
3. **Desbalance ignorado**: `class_weight="balanced"` / `scale_pos_weight` más
   un umbral de decisión ajustado por validación cruzada sobre train (nunca
   sobre test).

## Orden de ejecución

Desde `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING` (la carpeta que contiene
`pipeline_v2/`), con el entorno virtual activo:

```bash
# Windows: .venv\Scripts\activate     |     POSIX: source .venv/bin/activate

python -m pipeline_v2.baseline_snapshot     # 1. Métricas reales de v1 (línea base sin fuga)
python -m pipeline_v2.build_clean_dataset   # 2. Dataset sin fuga -> output/ENSANUT_MODELO_v2.csv
python -m pipeline_v2.split_dataset         # 3. Split 80/20 -> output/train_v2.csv, test_v2.csv
python -m pipeline_v2.entrenar_modelo       # 4. Entrena, elige modelo, ajusta umbral -> modelo_v2.joblib, metricas_v2.json
python -m pipeline_v2.comparar_v1_v2        # 5. v1 vs v2 sobre el MISMO test -> comparacion_v1_v2.json
python -m pipeline_v2.tabla_experimento     # 6. Tabla única del experimento -> output/tabla_experimento.md
```

Sin activar el venv, se puede invocar el intérprete directamente:
`.venv/Scripts/python.exe -m pipeline_v2.entrenar_modelo`.

Los pasos son **secuenciales**: cada uno consume artefactos del anterior.
`comparar_v1_v2.py` y `tabla_experimento.py` fallan con un mensaje explícito
(no con un `FileNotFoundError` pelado) si falta un artefacto previo.

El paso 4 es el más lento (entrena 4 candidatos sobre ~14,800 filas y luego
corre una validación cruzada 5-fold adicional para el umbral): del orden de
varios minutos.

### Nota de entorno (Python 3.13 + Windows)

El backend `loky` de joblib para `n_jobs=-1` falla en esta máquina
(`multiprocessing.resource_tracker` no puede importar `_posixsubprocess`). Por
eso las llamadas paralelas van envueltas en
`joblib.parallel_backend("threading")`. Es un workaround puramente de
infraestructura: el resultado numérico es idéntico, sólo cambia el paralelismo.
Cualquier llamada paralela nueva debe seguir el mismo patrón.

## Artefactos generados (`pipeline_v2/output/`)

| Archivo | Producido por | Contenido |
|---|---|---|
| `baseline_v1_snapshot.json` | `baseline_snapshot` | Métricas reales de v1 sin fuga (recall clase 1 = 0.4759) |
| `ENSANUT_MODELO_v2.csv` | `build_clean_dataset` | Dataset sin las filas de target fabricado |
| `train_v2.csv` / `test_v2.csv` | `split_dataset` | Split estratificado 80/20, `random_state=42` |
| `modelo_v2.joblib` | `entrenar_modelo` | Pipeline final (preprocesador + modelo ganador) |
| `metricas_v2.json` | `entrenar_modelo` | Métricas por clase en test, métricas en train, umbral, hiperparámetros |
| `comparacion_v1_v2.json` | `comparar_v1_v2` | v1 vs v2 sobre el mismo test, con `_aviso` sobre el sesgo a favor de v1 |
| `tabla_experimento.md` | `tabla_experimento` | Tabla única del experimento, lista para la tesis |

## Cómo leer `metricas_v2.json`

- Las claves de primer nivel (`recall_clase_1`, `pr_auc`, ...) son **test**.
- `metricas["train"]` trae las mismas métricas sobre train: la brecha
  train-vs-test documenta el sobreajuste de forma explícita.
- `umbral_usado` es el umbral operativo; la API debe usar ese valor, no `0.5`.
- `hiperparametros_ajustados` dice si el modelo ganador pasó por búsqueda de
  hiperparámetros (hoy sólo XGBoost tiene grilla en el script).

## Advertencia sobre `comparacion_v1_v2.json`

v1 se evalúa sobre filas que pudo haber memorizado en su propio entrenamiento
(su split original era distinto), así que sus números ahí están **inflados**. La
línea base honesta de v1 es `baseline_v1_snapshot.json`
(recall clase 1 = 0.4759, ROC-AUC = 0.6479). No citar los números de v1 de la
comparación en la tesis sin ese aviso.

## Tests

```bash
python -m pytest pipeline_v2/tests/ -v
```

Algunos tests dependen de los artefactos de `output/`, así que se ejecutan
después del pipeline completo.
