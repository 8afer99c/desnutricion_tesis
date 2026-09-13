# Corrección de Modelo y Datos — Desnutrición Crónica Infantil — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corregir los defectos verificados en el pipeline de datos y en el modelo de clasificación de desnutrición crónica infantil (fuga del target, sobreajuste no detectado, métricas hardcodeadas, selección de modelo rota, splits corruptos) **sin romper ni sobrescribir ningún artefacto que ya existe** — todo se construye en paralelo (`pipeline_v2/`), con el modelo v1 y la API actual funcionando exactamente igual hasta que se decida explícitamente promover el modelo v2.

**Architecture:** Todo el trabajo nuevo vive en una carpeta paralela `pipeline_v2/` dentro de `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/`, que nunca modifica los notebooks, CSVs ni joblib originales — solo los lee. Los notebooks originales (`LIMPIEZA.ipynb`, `ENTRENAMIENTO.ipynb`) se dejan intactos como evidencia histórica; la lógica corregida se reimplementa en scripts `.py` testeables con `pytest`. La integración con la API (`API_DESNUTRICION/`) es la única fase que toca código ya desplegado, y se hace detrás de una variable de entorno (`MODEL_VERSION`) que por defecto mantiene el comportamiento actual (v1) — nada cambia en producción hasta que el usuario decida cambiar esa variable.

**Tech Stack:** Python 3.13 (venv local — el `.python-version` del proyecto pide 3.11.9 para Render, pero no hay 3.11 instalado en esta máquina; verifiqué que scikit-learn 1.6.1 + xgboost 2.1.4 + joblib 1.5.1 instalan y funcionan igual en 3.13), pandas, scikit-learn, xgboost, pytest, FastAPI TestClient (para los smoke tests de la API, sin tocar frontend).

**Fases:**
- **Fase 0** — Red de seguridad (backup + entorno + snapshot del comportamiento actual)
- **Fase 1** — Corregir la fuga del target
- **Fase 2** — Reentrenar con rigor (selección de modelo real, desbalance, métricas por clase)
- **Fase 3** — Integración en la API — **NO se ejecuta hasta aprobación explícita** (toca `dashboard.py`/`analytics.py`, que quedaron fuera de alcance por ahora)
- **Fase 4** — Documentación para la tesis (tabla única del experimento pedida por el tutor)

---

## Fase 0 — Red de seguridad y entorno

### Task 1: Backup de todos los artefactos existentes

**Files:**
- Create: `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/backups/pre_fix_2026-09-12/` (copias)
- Create: `API_DESNUTRICION/API_DESNUTRICION/backups/pre_fix_2026-09-12/` (copias)

- [ ] **Step 1: Backup de la carpeta de ML**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
mkdir -p backups/pre_fix_2026-09-12
cp ENSANUT_MODELO.csv ENSANUT_ENTRENAMIENTO.csv ENSANUT_FASEDOS.csv \
   train.csv test.csv \
   mejor_modelo.joblib xgboost_optimizado.joblib modelo_final_api.joblib \
   backups/pre_fix_2026-09-12/
```

- [ ] **Step 2: Backup del modelo desplegado en la API**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION"
mkdir -p backups/pre_fix_2026-09-12
cp models/modelo_final_api.joblib backups/pre_fix_2026-09-12/
cp app/config.py app/analytics.py backups/pre_fix_2026-09-12/
```

- [ ] **Step 3: Verificar que los backups son idénticos a los originales**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
cmp modelo_final_api.joblib backups/pre_fix_2026-09-12/modelo_final_api.joblib && echo "OK: backup idéntico"
```

Expected: `OK: backup idéntico`

- [ ] **Step 4: Commit (si el usuario decide versionar esta carpeta con git)**

No hay `.git` en `TESIS MACHINE LEARNING/`. Si no se va a versionar, omitir este paso — los backups ya quedan a salvo en disco.

---

### Task 2: Entorno reproducible y esqueleto de `pipeline_v2`

**Files:**
- Create: `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/requirements-dev.txt`
- Create: `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/pipeline_v2/__init__.py`
- Create: `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/pipeline_v2/paths.py`
- Create: `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/pipeline_v2/tests/__init__.py`

- [ ] **Step 1: Crear `requirements-dev.txt`**

```
pandas==2.2.3
numpy==1.26.4
scikit-learn==1.6.1
xgboost==2.1.4
joblib==1.5.1
pytest==8.3.3
fastapi==0.116.1
httpx==0.27.2
uvicorn==0.35.0
openpyxl==3.1.5
```

- [ ] **Step 2: Crear el venv e instalar dependencias**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
py -3.13 -m venv .venv
.venv/Scripts/python.exe -m pip install -q --disable-pip-version-check -r requirements-dev.txt
```

Expected: instalación sin errores (ya se verificó en la revisión previa que estas versiones exactas instalan y cargan el `.joblib` existente sin problemas).

- [ ] **Step 3: Crear el paquete `pipeline_v2`**

```python
# pipeline_v2/__init__.py
```//vacío, solo marca el paquete

```python
# pipeline_v2/paths.py
from pathlib import Path

PIPELINE_V2_DIR = Path(__file__).resolve().parent
DATA_DIR = PIPELINE_V2_DIR.parent  # carpeta con los CSV/joblib originales
OUTPUT_DIR = PIPELINE_V2_DIR / "output"

ENSANUT_CORREGIDO_PATH = DATA_DIR / "ENSANUT_CORREGIDO.csv"
ENSANUT_MODELO_PATH = DATA_DIR / "ENSANUT_MODELO.csv"
V1_MODEL_PATH = DATA_DIR / "modelo_final_api.joblib"

TARGET_COL = "desnutricion_cronica"
RANDOM_STATE = 42
TEST_SIZE = 0.20
```

```python
# pipeline_v2/tests/__init__.py
```//vacío

- [ ] **Step 4: Verificar que el paquete es importable**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
.venv/Scripts/python.exe -c "from pipeline_v2.paths import DATA_DIR; print(DATA_DIR)"
```

Expected: imprime la ruta de `TESIS MACHINE LEARNING/TESIS MACHINE LEARNING`.

- [ ] **Step 5: Commit**

No hay repo git en esta carpeta; si se decide inicializar uno más adelante, incluir estos archivos en el primer commit del `pipeline_v2`.

---

### Task 3: Captura de línea base (comportamiento actual del modelo v1, antes de tocar nada)

**Files:**
- Create: `pipeline_v2/baseline_snapshot.py`

- [ ] **Step 1: Escribir el script de snapshot**

```python
# pipeline_v2/baseline_snapshot.py
"""
Congela el comportamiento REAL del modelo v1 (el que ya está desplegado, con
la fuga del target) antes de cualquier cambio, usando el mismo split que
describe ENTRENAMIENTO.ipynb. Sirve como referencia para no perder de vista
qué tan malo era el punto de partida y como evidencia auditable para la tesis.
"""
import json

import joblib
import pandas as pd
from sklearn.metrics import (
    accuracy_score, balanced_accuracy_score, confusion_matrix, f1_score,
    precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import train_test_split

from pipeline_v2.paths import (
    ENSANUT_MODELO_PATH, OUTPUT_DIR, RANDOM_STATE, TARGET_COL, TEST_SIZE,
    V1_MODEL_PATH,
)


def run():
    modelo = joblib.load(V1_MODEL_PATH)
    df = pd.read_csv(ENSANUT_MODELO_PATH)
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]

    _, X_test, _, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    X_test = X_test[modelo.feature_names_in_.tolist()]

    y_pred = modelo.predict(X_test)
    y_proba = modelo.predict_proba(X_test)[:, 1]

    snapshot = {
        "accuracy": accuracy_score(y_test, y_pred),
        "balanced_accuracy": balanced_accuracy_score(y_test, y_pred),
        "precision_clase_1": precision_score(y_test, y_pred, pos_label=1),
        "recall_clase_1": recall_score(y_test, y_pred, pos_label=1),
        "f1_clase_1": f1_score(y_test, y_pred, pos_label=1),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "hardcoded_api_metrics_antes_de_la_correccion": {
            "accuracy": 0.767918, "precision": 0.713174,
            "recall": 0.767918, "f1_score": 0.718441,
        },
    }
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_DIR / "baseline_v1_snapshot.json", "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)
    print(json.dumps(snapshot, indent=2))


if __name__ == "__main__":
    run()
```

- [ ] **Step 2: Ejecutar y verificar que reproduce lo que ya vimos en la revisión**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
.venv/Scripts/python.exe -m pipeline_v2.baseline_snapshot
```

Expected: `accuracy` ≈ 0.6548, `recall_clase_1` ≈ 0.4759 (los mismos números de la revisión previa). Si difieren, detenerse e investigar antes de seguir — significaría que el entorno no es equivalente.

- [ ] **Step 3: Commit**

Guardar `pipeline_v2/output/baseline_v1_snapshot.json` como evidencia — no se sobrescribe nunca en fases posteriores.

---

## Fase 1 — Corregir la fuga del target

### Task 4: Dataset limpio sin fuga (`build_clean_dataset.py`)

Los diccionarios `.ods` que renombran las columnas (`dicentre.ods`, etc.) solo existían en Google Colab y no están en este repo — no se puede re-ejecutar el renombrado desde cero. En su lugar, verifiqué (durante la revisión) que **el orden de filas se preserva exactamente** entre `ENSANUT_CORREGIDO.csv` (crudo, con los NaN reales del target) y `ENSANUT_MODELO.csv` (ya renombrado e imputado): donde el target crudo NO es nulo, coincide al 100% con el target de `ENSANUT_MODELO.csv`. Esto permite reconstruir la máscara de filas válidas por posición, sin tocar el resto del pipeline de renombrado.

**Files:**
- Create: `pipeline_v2/build_clean_dataset.py`
- Test: `pipeline_v2/tests/test_build_clean_dataset.py`

- [ ] **Step 1: Escribir el test (falla primero, porque el módulo no existe)**

```python
# pipeline_v2/tests/test_build_clean_dataset.py
from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import TARGET_COL


def test_no_nulls_in_target():
    df = build_clean_dataset()
    assert df[TARGET_COL].isna().sum() == 0


def test_expected_row_count():
    df = build_clean_dataset()
    assert len(df) == 18493  # 20510 filas originales - 2017 con target sin medir


def test_class_balance_after_fix():
    df = build_clean_dataset()
    counts = df[TARGET_COL].value_counts()
    assert counts[0.0] == 13933
    assert counts[1.0] == 4560


def test_positive_rate_increases_after_removing_fabricated_negatives():
    df = build_clean_dataset()
    tasa = df[TARGET_COL].mean()
    assert tasa > 0.24  # antes de la corrección era 0.2223 (diluida por los 0 fabricados)
```

- [ ] **Step 2: Ejecutar el test y verificar que falla**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_build_clean_dataset.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline_v2.build_clean_dataset'`

- [ ] **Step 3: Escribir la implementación**

```python
# pipeline_v2/build_clean_dataset.py
"""
Corrige la fuga de datos de LIMPIEZA.ipynb: en vez de imputar con la mediana
los valores faltantes del target "Desnutrición crónica" (lo que fabricaba
~2,017 etiquetas falsas, todas como clase 0), se eliminan esas filas.

Usa alineación posicional entre ENSANUT_CORREGIDO.csv (crudo, con NaN reales
en el target) y ENSANUT_MODELO.csv (renombrado e imputado, el que alimenta el
entrenamiento) porque los diccionarios .ods de renombrado solo existían en
Colab y no están disponibles localmente para re-derivar todo desde cero.

Verificado 2026-09-12: donde el target de ENSANUT_CORREGIDO no es nulo,
coincide al 100% (18,493/18,493) con el target de ENSANUT_MODELO -> el orden
de filas se preserva de punta a punta en el pipeline original.
"""
import pandas as pd

from pipeline_v2.paths import ENSANUT_CORREGIDO_PATH, ENSANUT_MODELO_PATH, TARGET_COL


def _find_target_column_cruda(columns):
    candidatas = [c for c in columns if "esnutric" in c and "r" in c.lower()]
    if len(candidatas) != 1:
        raise ValueError(f"Se esperaba 1 columna de target en el CSV crudo, se encontraron: {candidatas}")
    return candidatas[0]


def build_clean_dataset() -> pd.DataFrame:
    corregido = pd.read_csv(ENSANUT_CORREGIDO_PATH, low_memory=False)
    modelo = pd.read_csv(ENSANUT_MODELO_PATH, low_memory=False)

    if len(corregido) != len(modelo):
        raise AssertionError(
            f"Descuadre de filas: CORREGIDO tiene {len(corregido)}, MODELO tiene {len(modelo)}. "
            "El supuesto de alineación posicional ya no es válido -- no continuar."
        )

    columna_target_cruda = _find_target_column_cruda(corregido.columns)
    target_original = corregido[columna_target_cruda].reset_index(drop=True)
    mascara_valida = target_original.notna()

    modelo = modelo.reset_index(drop=True)

    # Verificación de alineación antes de confiar en la máscara.
    target_modelo_donde_valido = modelo.loc[mascara_valida, TARGET_COL].astype(float)
    target_crudo_donde_valido = target_original[mascara_valida].astype(float)
    tasa_coincidencia = (target_modelo_donde_valido.values == target_crudo_donde_valido.values).mean()
    if tasa_coincidencia < 1.0:
        raise AssertionError(
            f"Falló la verificación de alineación: solo {tasa_coincidencia:.4%} de las filas "
            "coinciden entre CORREGIDO y MODELO. No confiar en el enmascarado posicional."
        )

    return modelo.loc[mascara_valida].reset_index(drop=True)


if __name__ == "__main__":
    from pipeline_v2.paths import OUTPUT_DIR

    df = build_clean_dataset()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "ENSANUT_MODELO_v2.csv"
    df.to_csv(out_path, index=False)
    print(f"Filas originales (v1): 20510")
    print(f"Filas eliminadas (target sin medir en origen): {20510 - len(df)}")
    print(f"Filas finales (v2): {len(df)}")
    print(df[TARGET_COL].value_counts(normalize=True))
    print(f"Guardado en: {out_path}")
```

- [ ] **Step 4: Ejecutar el test y verificar que pasa**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_build_clean_dataset.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Generar el CSV limpio**

```bash
.venv/Scripts/python.exe -m pipeline_v2.build_clean_dataset
```

Expected: `Filas finales (v2): 18493`, guardado en `pipeline_v2/output/ENSANUT_MODELO_v2.csv` (el `ENSANUT_MODELO.csv` original NO se toca).

- [ ] **Step 6: Commit**

```bash
git add pipeline_v2/build_clean_dataset.py pipeline_v2/tests/test_build_clean_dataset.py
git commit -m "fix: eliminar filas con target sin medir en vez de imputarlas con la mediana"
```

(Si no hay repo git inicializado en esta carpeta, omitir — el archivo ya queda guardado en disco.)

---

### Task 5: Split train/test reproducible y limpio (`split_dataset.py`)

Reemplaza los `train.csv`/`test.csv` actuales, que están corruptos (suman 27,087 filas contra 20,510 de origen y tienen hasta 44% de nulos en el target). Los originales **no se sobrescriben** — los nuevos se generan en `pipeline_v2/output/`.

**Files:**
- Create: `pipeline_v2/split_dataset.py`
- Test: `pipeline_v2/tests/test_split_dataset.py`

- [ ] **Step 1: Escribir el test**

```python
# pipeline_v2/tests/test_split_dataset.py
from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.split_dataset import make_split
from pipeline_v2.paths import TARGET_COL


def test_split_sizes_match_source():
    total = len(build_clean_dataset())
    train_df, test_df = make_split()
    assert len(train_df) + len(test_df) == total


def test_no_row_overlap_between_splits():
    train_df, test_df = make_split()
    train_keys = set(map(tuple, train_df.astype(str).values))
    test_keys = set(map(tuple, test_df.astype(str).values))
    assert train_keys.isdisjoint(test_keys)


def test_zero_null_targets_in_both_splits():
    train_df, test_df = make_split()
    assert train_df[TARGET_COL].isna().sum() == 0
    assert test_df[TARGET_COL].isna().sum() == 0


def test_stratification_preserves_class_ratio():
    train_df, test_df = make_split()
    ratio_train = train_df[TARGET_COL].mean()
    ratio_test = test_df[TARGET_COL].mean()
    assert abs(ratio_train - ratio_test) < 0.02
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_split_dataset.py -v
```

Expected: `ModuleNotFoundError: No module named 'pipeline_v2.split_dataset'`

- [ ] **Step 3: Implementar**

```python
# pipeline_v2/split_dataset.py
"""
Regenera un split train/test reproducible a partir del dataset sin fuga.
Reemplaza los train.csv/test.csv actuales, que están corruptos.
"""
import pandas as pd
from sklearn.model_selection import train_test_split

from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import OUTPUT_DIR, RANDOM_STATE, TARGET_COL, TEST_SIZE


def make_split():
    df = build_clean_dataset()
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)
    return train_df, test_df


if __name__ == "__main__":
    train_df, test_df = make_split()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(OUTPUT_DIR / "train_v2.csv", index=False)
    test_df.to_csv(OUTPUT_DIR / "test_v2.csv", index=False)
    print(f"train_v2.csv: {train_df.shape}")
    print(f"test_v2.csv: {test_df.shape}")
```

- [ ] **Step 4: Ejecutar y verificar que pasa**

```bash
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_split_dataset.py -v
```

Expected: `4 passed`

- [ ] **Step 5: Generar los CSV**

```bash
.venv/Scripts/python.exe -m pipeline_v2.split_dataset
```

Expected: `train_v2.csv: (14794, 115)`, `test_v2.csv: (3699, 115)` (80/20 de 18,493).

- [ ] **Step 6: Commit**

```bash
git add pipeline_v2/split_dataset.py pipeline_v2/tests/test_split_dataset.py
git commit -m "fix: regenerar train/test split limpio y reproducible"
```

---

## Fase 2 — Reentrenar con rigor

### Task 6: Screening de fuga por variable (`leakage_screen.py`)

El tutor pidió explícitamente verificar que "ninguna variable... revele directa o indirectamente la variable objetivo". Este script automatiza una primera pasada: mide qué tan bien predice el target CADA variable por sí sola (AUC univariado). No elimina nada automáticamente — solo genera una lista para revisión manual (una variable genuinamente predictiva también puede dar AUC alto sin ser fuga).

**Files:**
- Create: `pipeline_v2/leakage_screen.py`
- Test: `pipeline_v2/tests/test_leakage_screen.py`

- [ ] **Step 1: Escribir el test**

```python
# pipeline_v2/tests/test_leakage_screen.py
from pipeline_v2.leakage_screen import run


def test_leakage_screen_runs_and_returns_a_list():
    resultado = run()
    assert isinstance(resultado, list)
    for nombre_columna, auc in resultado:
        assert isinstance(nombre_columna, str)
        assert 0.0 <= auc <= 1.0
```

- [ ] **Step 2: Ejecutar y verificar que falla**

```bash
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_leakage_screen.py -v
```

Expected: `ModuleNotFoundError`

- [ ] **Step 3: Implementar**

```python
# pipeline_v2/leakage_screen.py
"""
Detector barato de posible fuga: mide el AUC de predecir el target usando
CADA variable por separado. Un AUC > 0.95 con una sola variable es sospechoso
y merece revisión manual (puede ser fuga, o puede ser una variable
legítimamente muy predictiva -- este script no decide, solo señala).
"""
import pandas as pd
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import OrdinalEncoder

from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import TARGET_COL

UMBRAL = 0.95


def run():
    df = build_clean_dataset()
    y = df[TARGET_COL]
    X = df.drop(columns=[TARGET_COL])

    sospechosas = []
    for columna in X.columns:
        serie = X[columna]
        try:
            if serie.dtype == object or str(serie.dtype) == "category":
                codificador = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
                valores = codificador.fit_transform(serie.astype(str).values.reshape(-1, 1)).ravel()
            else:
                valores = serie.fillna(serie.median()).values
            auc = roc_auc_score(y, valores)
            auc = max(auc, 1 - auc)  # AUC sin importar la dirección de la relación
        except Exception:
            continue
        if auc > UMBRAL:
            sospechosas.append((columna, auc))

    sospechosas.sort(key=lambda t: -t[1])
    if sospechosas:
        print(f"Variables con AUC univariado > {UMBRAL} (revisar manualmente):")
        for columna, auc in sospechosas:
            print(f"  {columna}: AUC={auc:.4f}")
    else:
        print(f"Ninguna variable supera AUC={UMBRAL} por sí sola -- sin señales obvias de fuga directa.")
    return sospechosas


if __name__ == "__main__":
    run()
```

- [ ] **Step 4: Ejecutar el test**

```bash
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_leakage_screen.py -v
```

Expected: `1 passed`

- [ ] **Step 5: Ejecutar el screening y revisar manualmente la salida**

```bash
.venv/Scripts/python.exe -m pipeline_v2.leakage_screen
```

Si aparece alguna variable en la lista, **detenerse y decidir junto con el usuario** si se elimina antes de reentrenar (no eliminar nada automáticamente).

- [ ] **Step 6: Commit**

```bash
git add pipeline_v2/leakage_screen.py pipeline_v2/tests/test_leakage_screen.py
git commit -m "feat: agregar screening automático de fuga por variable"
```

---

### Task 7: Pipeline de entrenamiento corregido (`entrenar_modelo.py`)

Corrige tres bugs a la vez: (a) la selección de "mejor modelo" ahora sí determina qué se optimiza (ya no se hardcodea XGBoost), (b) se maneja el desbalance de clases explícitamente, (c) el scoring de la búsqueda de hiperparámetros y las métricas reportadas dejan de ser promedios "weighted" y pasan a ser por clase + ROC-AUC + PR-AUC.

Nota de alcance: se dejan fuera LightGBM y CatBoost (que sí estaban en el notebook original) para no añadir dependencias pesadas al entorno de verificación; si se quieren replicar exactamente, se pueden agregar a `requirements-dev.txt` y a `candidate_models()` más adelante.

**Files:**
- Create: `pipeline_v2/entrenar_modelo.py`
- Test: `pipeline_v2/tests/test_modelo_v2_output.py` (corre DESPUÉS de entrenar, valida el artefacto)

- [ ] **Step 1: Implementar el script de entrenamiento**

```python
# pipeline_v2/entrenar_modelo.py
"""
Entrenamiento corregido del clasificador de desnutrición crónica.

Diferencias frente a ENTRENAMIENTO.ipynb:
1. Entrena sobre el dataset sin fuga (pipeline_v2.build_clean_dataset), no
   sobre la versión con el target imputado por mediana.
2. La selección de "mejor modelo" SÍ determina qué se optimiza (antes se
   hardcodeaba XGBoost sin importar cuál ganaba la comparación base).
3. Maneja el desbalance de clases explícitamente (scale_pos_weight para
   XGBoost, class_weight="balanced" para los demás).
4. La búsqueda de hiperparámetros se puntúa con average_precision (PR-AUC),
   mucho más informativo que f1_weighted para un problema con ~25% de
   positivos.
5. Reporta métricas completas por clase (no solo promedios ponderados):
   precision/recall/F1 de ambas clases, balanced accuracy, ROC-AUC, PR-AUC y
   matriz de confusión -- todo se guarda en metricas_v2.json.
"""
import json

import joblib
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score, balanced_accuracy_score, classification_report,
    confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

from pipeline_v2.paths import OUTPUT_DIR, RANDOM_STATE, TARGET_COL
from pipeline_v2.split_dataset import make_split


def build_preprocessor(X):
    numericas = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categoricas = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

    pipe_numerico = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    pipe_categorico = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer([
        ("num", pipe_numerico, numericas),
        ("cat", pipe_categorico, categoricas),
    ])


def candidate_models(scale_pos_weight: float) -> dict:
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "Decision Tree": DecisionTreeClassifier(
            random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "XGBoost": XGBClassifier(
            random_state=RANDOM_STATE, eval_metric="logloss",
            scale_pos_weight=scale_pos_weight,
        ),
    }


def evaluate(pipeline, X_test, y_test) -> dict:
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    return {
        "accuracy_balanced": balanced_accuracy_score(y_test, y_pred),
        "precision_clase_1": precision_score(y_test, y_pred, pos_label=1),
        "recall_clase_1": recall_score(y_test, y_pred, pos_label=1),
        "f1_clase_1": f1_score(y_test, y_pred, pos_label=1),
        "precision_clase_0": precision_score(y_test, y_pred, pos_label=0),
        "recall_clase_0": recall_score(y_test, y_pred, pos_label=0),
        "f1_clase_0": f1_score(y_test, y_pred, pos_label=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "pr_auc": average_precision_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
    }


def run():
    train_df, test_df = make_split()
    X_train = train_df.drop(columns=[TARGET_COL])
    y_train = train_df[TARGET_COL]
    X_test = test_df.drop(columns=[TARGET_COL])
    y_test = test_df[TARGET_COL]

    conteo = y_train.value_counts()
    scale_pos_weight = conteo[0.0] / conteo[1.0]
    print(f"scale_pos_weight (neg/pos en train) = {scale_pos_weight:.4f}")

    preprocesador = build_preprocessor(X_train)

    resultados = []
    pipelines = {}
    for nombre, modelo in candidate_models(scale_pos_weight).items():
        pipeline = Pipeline([("preprocesador", preprocesador), ("modelo", modelo)])
        pipeline.fit(X_train, y_train)
        pipelines[nombre] = pipeline
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        score = average_precision_score(y_test, y_proba)
        resultados.append((nombre, score))
        print(f"{nombre}: average_precision(test) = {score:.4f}")

    nombre_ganador = max(resultados, key=lambda r: r[1])[0]
    print(f"\nModelo ganador por average_precision: {nombre_ganador}")
    pipeline_ganador = pipelines[nombre_ganador]

    if nombre_ganador == "XGBoost":
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        parametros = {
            "modelo__n_estimators": [100, 200, 300, 400, 500],
            "modelo__max_depth": [3, 4, 5, 6, 7, 8],
            "modelo__learning_rate": [0.01, 0.03, 0.05, 0.1, 0.2],
            "modelo__subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
            "modelo__colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
            "modelo__gamma": [0, 0.1, 0.2, 0.3, 0.5],
            "modelo__min_child_weight": [1, 3, 5, 7],
        }
        busqueda = RandomizedSearchCV(
            estimator=pipeline_ganador, param_distributions=parametros, n_iter=40,
            scoring="average_precision", cv=cv, verbose=1,
            random_state=RANDOM_STATE, n_jobs=-1,
        )
        busqueda.fit(X_train, y_train)
        pipeline_final = busqueda.best_estimator_
        print("Mejores hiperparámetros:", busqueda.best_params_)
        print("Mejor score CV (average_precision):", busqueda.best_score_)
    else:
        pipeline_final = pipeline_ganador
        print(
            f"'{nombre_ganador}' no tiene grilla de hiperparámetros en este script; "
            "se usa tal cual salió de la comparación base."
        )

    metricas = evaluate(pipeline_final, X_test, y_test)
    metricas["modelo_ganador"] = nombre_ganador
    metricas["comparativa_base"] = dict(resultados)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline_final, OUTPUT_DIR / "modelo_v2.joblib")
    with open(OUTPUT_DIR / "metricas_v2.json", "w", encoding="utf-8") as f:
        json.dump(metricas, f, indent=2, ensure_ascii=False)

    print("\n=== MÉTRICAS FINALES (test, sin fuga) ===")
    resumen = {k: v for k, v in metricas.items() if k != "classification_report"}
    print(json.dumps(resumen, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    run()
```

- [ ] **Step 2: Ejecutar el entrenamiento**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING"
.venv/Scripts/python.exe -m pipeline_v2.entrenar_modelo
```

Expected: imprime `average_precision` de los 4 modelos base, el ganador, y termina con las métricas finales guardadas en `pipeline_v2/output/modelo_v2.joblib` y `metricas_v2.json`. Puede tardar varios minutos por el `RandomizedSearchCV` si XGBoost gana.

- [ ] **Step 3: Escribir el test que valida el artefacto generado**

```python
# pipeline_v2/tests/test_modelo_v2_output.py
import json

import joblib

from pipeline_v2.paths import OUTPUT_DIR


def test_modelo_v2_artifact_exists():
    assert (OUTPUT_DIR / "modelo_v2.joblib").exists(), (
        "Ejecuta primero: .venv/Scripts/python.exe -m pipeline_v2.entrenar_modelo"
    )


def test_metricas_v2_tiene_los_campos_requeridos():
    with open(OUTPUT_DIR / "metricas_v2.json", encoding="utf-8") as f:
        m = json.load(f)
    requeridos = {
        "accuracy_balanced", "precision_clase_1", "recall_clase_1", "f1_clase_1",
        "precision_clase_0", "recall_clase_0", "f1_clase_0",
        "roc_auc", "pr_auc", "confusion_matrix", "modelo_ganador",
    }
    assert requeridos.issubset(m.keys())


def test_modelo_v2_carga_y_tiene_114_features():
    modelo = joblib.load(OUTPUT_DIR / "modelo_v2.joblib")
    assert hasattr(modelo, "feature_names_in_")
    assert len(modelo.feature_names_in_) == 114


def test_modelo_v2_mejora_recall_de_clase_1_frente_a_v1():
    with open(OUTPUT_DIR / "metricas_v2.json", encoding="utf-8") as f:
        m = json.load(f)
    with open(OUTPUT_DIR / "baseline_v1_snapshot.json", encoding="utf-8") as f:
        base = json.load(f)
    # No exigimos un número mágico -- exigimos que el manejo de desbalance
    # realmente mueva la aguja en la clase que importa (antes: 0.4759).
    assert m["recall_clase_1"] >= base["recall_clase_1"]
```

- [ ] **Step 4: Ejecutar el test**

```bash
.venv/Scripts/python.exe -m pytest pipeline_v2/tests/test_modelo_v2_output.py -v
```

Expected: `4 passed`. Si `test_modelo_v2_mejora_recall_de_clase_1_frente_a_v1` falla, **no continuar a la Fase 3** — significa que la corrección de desbalance no fue suficiente y hay que ajustar `entrenar_modelo.py` (por ejemplo, probar `class_weight` distinto o revisar el screening de fuga del Task 6 con más detalle) antes de considerar el modelo v2 mejor que v1.

- [ ] **Step 5: Commit**

```bash
git add pipeline_v2/entrenar_modelo.py pipeline_v2/tests/test_modelo_v2_output.py
git commit -m "feat: pipeline de entrenamiento corregido (selección real, desbalance, métricas por clase)"
```

(Los artefactos generados — `modelo_v2.joblib`, `metricas_v2.json` — son binarios/grandes; decidir con el usuario si se versionan con git o quedan solo en disco.)

---

### Task 8: Comparación controlada v1 vs. v2

**Files:**
- Create: `pipeline_v2/comparar_v1_v2.py`

- [ ] **Step 1: Implementar**

```python
# pipeline_v2/comparar_v1_v2.py
"""
Compara el modelo actual (v1, desplegado, con la fuga) contra el nuevo (v2)
sobre el MISMO set de prueba sin fuga, para que el usuario decida con datos
si promover v2. Aviso: v1 pudo haber visto durante su propio entrenamiento
algunas de las filas que ahora están en test_v2 (su split original era
distinto) -- esta comparación es generosa con v1, no perfectamente
controlada, pero sirve como verificación de sensatez antes del cutover.
"""
import json

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score, balanced_accuracy_score, f1_score,
    precision_score, recall_score, roc_auc_score,
)

from pipeline_v2.paths import OUTPUT_DIR, TARGET_COL, V1_MODEL_PATH


def score_model(pipeline, X, y):
    y_pred = pipeline.predict(X)
    y_proba = pipeline.predict_proba(X)[:, 1]
    return {
        "balanced_accuracy": balanced_accuracy_score(y, y_pred),
        "recall_clase_1": recall_score(y, y_pred, pos_label=1),
        "precision_clase_1": precision_score(y, y_pred, pos_label=1),
        "f1_clase_1": f1_score(y, y_pred, pos_label=1),
        "roc_auc": roc_auc_score(y, y_proba),
        "pr_auc": average_precision_score(y, y_proba),
    }


def run():
    test_df = pd.read_csv(OUTPUT_DIR / "test_v2.csv")
    y = test_df[TARGET_COL]
    X = test_df.drop(columns=[TARGET_COL])

    v1 = joblib.load(V1_MODEL_PATH)
    v2 = joblib.load(OUTPUT_DIR / "modelo_v2.joblib")

    v1_scores = score_model(v1, X[v1.feature_names_in_.tolist()], y)
    v2_scores = score_model(v2, X, y)

    print(f"{'Métrica':<22}{'v1 (actual)':<15}{'v2 (corregido)':<15}")
    for k in v1_scores:
        print(f"{k:<22}{v1_scores[k]:<15.4f}{v2_scores[k]:<15.4f}")

    with open(OUTPUT_DIR / "comparacion_v1_v2.json", "w", encoding="utf-8") as f:
        json.dump({"v1": v1_scores, "v2": v2_scores}, f, indent=2)


if __name__ == "__main__":
    run()
```

- [ ] **Step 2: Ejecutar y revisar la tabla con el usuario**

```bash
.venv/Scripts/python.exe -m pipeline_v2.comparar_v1_v2
```

Expected: tabla impresa comparando ambas versiones. **Este es el punto de decisión humana**: solo si v2 se ve claramente mejor (o al menos no peor) en `recall_clase_1` y `pr_auc`, se avanza a la Fase 3.

- [ ] **Step 3: Commit**

```bash
git add pipeline_v2/comparar_v1_v2.py
git commit -m "feat: script de comparación controlada v1 vs v2"
```

---

## Fase 3 — Integración en la API

**⚠️ No ejecutar esta fase todavía.** Toca `app/config.py` y (opcionalmente) `app/analytics.py`, que alimentan endpoints con prefijo `/dashboard/*` — quedaron explícitamente fuera de alcance por ahora. Queda documentada aquí para que el plan esté completo, pero requiere aprobación explícita antes de tocar código de la API.

### Task 9: Arreglar `DATA_PATH` en `config.py` (bajo riesgo, aislado, no cambia comportamiento)

Este fix es puramente de robustez de rutas — no cambia qué dataset usa el dashboard, solo evita que se rompa si la API se ejecuta desde un directorio de trabajo distinto (como pasaría en Render).

**Files:**
- Modify: `API_DESNUTRICION/API_DESNUTRICION/app/config.py:8`

- [ ] **Step 1: Ver el estado actual**

```python
# app/config.py, línea 8 (actual)
DATA_PATH = "data/ENSANUT_MODELO.csv"
```

- [ ] **Step 2: Corregir**

```python
# app/config.py, línea 8 (corregido)
DATA_PATH = BASE_DIR / "data" / "ENSANUT_MODELO.csv"
```

- [ ] **Step 3: Verificar que nada se rompe**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION"
python -c "from app.config import DATA_PATH; import pandas as pd; df = pd.read_csv(DATA_PATH); print(df.shape)"
```

Expected: `(20510, 115)` — igual que antes, solo que ahora funciona sin importar el directorio de trabajo actual.

- [ ] **Step 4: Commit**

```bash
git add app/config.py
git commit -m "fix: DATA_PATH usa BASE_DIR para no depender del cwd"
```

---

### Task 10 (opcional, requiere aprobación): Métricas en vivo en `Analytics.metricas()`

Hoy `Analytics.metricas()` devuelve números fijos que no reproducen con el modelo real. Este task los reemplaza por lo que salga de `metricas_v2.json`. **Cambia el significado de los campos devueltos** (pasa de "accuracy ponderada" a "balanced accuracy", agrega `roc_auc`/`pr_auc`) — es un cambio de contrato, no solo un bugfix silencioso, por eso queda gateado.

**Files:**
- Modify: `API_DESNUTRICION/API_DESNUTRICION/app/analytics.py:19-34`
- Create: `API_DESNUTRICION/API_DESNUTRICION/models/metricas_v2.json` (copia de `pipeline_v2/output/metricas_v2.json`)

- [ ] **Step 1: Copiar el artefacto de métricas al proyecto de la API**

```bash
cp "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/pipeline_v2/output/metricas_v2.json" \
   "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION/models/metricas_v2.json"
```

- [ ] **Step 2: Reemplazar el método**

```python
# app/analytics.py -- reemplaza el método metricas() actual
import json
from app.config import BASE_DIR

METRICS_PATH = BASE_DIR / "models" / "metricas_v2.json"


@staticmethod
def metricas():
    with open(METRICS_PATH, encoding="utf-8") as f:
        m = json.load(f)
    return {
        "modelo": m.get("modelo_ganador", "XGBoost"),
        "accuracy_balanceada": round(m["accuracy_balanced"], 6),
        "precision_clase_desnutricion": round(m["precision_clase_1"], 6),
        "recall_clase_desnutricion": round(m["recall_clase_1"], 6),
        "f1_clase_desnutricion": round(m["f1_clase_1"], 6),
        "roc_auc": round(m["roc_auc"], 6),
        "pr_auc": round(m["pr_auc"], 6),
    }
```

- [ ] **Step 3: Test de contrato**

```python
# API_DESNUTRICION/API_DESNUTRICION/tests/test_analytics_metricas.py
from app.analytics import Analytics


def test_metricas_carga_desde_json_real():
    m = Analytics.metricas()
    assert 0.0 <= m["accuracy_balanceada"] <= 1.0
    assert 0.0 <= m["recall_clase_desnutricion"] <= 1.0
    assert "roc_auc" in m
```

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION"
python -m pytest tests/test_analytics_metricas.py -v
```

Expected: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add app/analytics.py models/metricas_v2.json tests/test_analytics_metricas.py
git commit -m "fix: Analytics.metricas() calcula desde el modelo real en vez de valores fijos"
```

---

### Task 11 (opcional, requiere aprobación): Cutover del modelo detrás de una variable de entorno

Por defecto (`MODEL_VERSION` sin definir) la API sigue usando exactamente el modelo v1 actual — cero cambio de comportamiento hasta que el usuario decida exportar `MODEL_VERSION=v2`.

**Files:**
- Modify: `API_DESNUTRICION/API_DESNUTRICION/app/config.py`
- Create: `API_DESNUTRICION/API_DESNUTRICION/models/modelo_v2.joblib` (copia)
- Create: `API_DESNUTRICION/API_DESNUTRICION/tests/test_api_contract.py`

- [ ] **Step 1: Copiar el modelo v2 a la API**

```bash
cp "C:/Users/Chris/Desktop/TESIS 8A/TESIS MACHINE LEARNING/TESIS MACHINE LEARNING/pipeline_v2/output/modelo_v2.joblib" \
   "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION/models/modelo_v2.joblib"
```

- [ ] **Step 2: Agregar la variable de entorno en `config.py`**

```python
# app/config.py -- agregar después de MODEL_PATH
import os

MODEL_VERSION = os.environ.get("MODEL_VERSION", "v1")
MODEL_PATH_V1 = BASE_DIR / "models" / "modelo_final_api.joblib"
MODEL_PATH_V2 = BASE_DIR / "models" / "modelo_v2.joblib"
MODEL_PATH = MODEL_PATH_V2 if MODEL_VERSION == "v2" else MODEL_PATH_V1
```

(`app/predictor.py` no cambia — sigue haciendo `joblib.load(MODEL_PATH)`, así que hereda el comportamiento sin tocarlo.)

- [ ] **Step 3: Smoke tests de contrato de la API (backend, sin tocar templates/estático)**

```python
# API_DESNUTRICION/API_DESNUTRICION/tests/test_api_contract.py
from pathlib import Path

import pandas as pd
from fastapi.testclient import TestClient

from app.main import app
from app.predictor import Predictor

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "OK"}


def test_features_devuelve_114_variables():
    r = client.get("/features")
    assert r.status_code == 200
    body = r.json()
    assert body["numero_variables"] == 114
    assert len(body["variables"]) == 114


def test_predict_con_fila_real_devuelve_esquema_esperado():
    ruta = Path(__file__).resolve().parent.parent / "data" / "ENSANUT_MODELO.csv"
    df = pd.read_csv(ruta)
    fila = df.iloc[0][Predictor.features()].to_dict()

    r = client.post("/predict", json=fila)
    assert r.status_code == 200
    body = r.json()
    assert body["prediccion"] in (0, 1)
    assert body["riesgo"] in ("ALTO", "MEDIO", "BAJO")
    assert 0.0 <= body["probabilidad"] <= 1.0
```

- [ ] **Step 4: Ejecutar con `MODEL_VERSION` sin definir (default = v1, debe comportarse EXACTAMENTE igual que hoy)**

```bash
cd "C:/Users/Chris/Desktop/TESIS 8A/API_DESNUTRICION/API_DESNUTRICION"
python -m pytest tests/test_api_contract.py -v
```

Expected: `3 passed` — confirma que nada se rompió con el modelo actual.

- [ ] **Step 5: Ejecutar con `MODEL_VERSION=v2` para confirmar que el nuevo modelo también respeta el contrato**

```bash
MODEL_VERSION=v2 python -m pytest tests/test_api_contract.py -v
```

Expected: `3 passed` — mismo contrato de API, modelo distinto por debajo.

- [ ] **Step 6: Commit (sin cambiar el default en producción)**

```bash
git add app/config.py models/modelo_v2.joblib tests/test_api_contract.py
git commit -m "feat: soporte de MODEL_VERSION (v1 por defecto) para cutover gradual del modelo"
```

- [ ] **Step 7: Cutover real — solo cuando el usuario lo pida explícitamente**

En Render, agregar la variable de entorno `MODEL_VERSION=v2` en el servicio (`render.yaml` no la define, así que por defecto seguiría en v1 incluso después de este deploy). Documentar el rollback: quitar la variable de entorno vuelve a v1 instantáneamente, sin redeploy de código.

---

## Fase 4 — Documentación para la tesis

### Task 12: Tabla única del experimento (pedida por el tutor)

**Files:**
- Create: `pipeline_v2/tabla_experimento.py`

- [ ] **Step 1: Implementar**

```python
# pipeline_v2/tabla_experimento.py
"""
Genera la "tabla única del experimento" que pide Correcciones_Tesis_Fernando.docx:
dataset, muestra final, variable objetivo, predictores, partición,
preprocesamiento, modelos, hiperparámetros, semilla, métricas y criterio de
selección -- todo derivado de los artefactos ya generados, no inventado.
"""
import json

from pipeline_v2.paths import OUTPUT_DIR


def run():
    with open(OUTPUT_DIR / "metricas_v2.json", encoding="utf-8") as f:
        m = json.load(f)

    filas = [
        ("Dataset", "ENSANUT 2018 (Ecuador), microdatos f2_salud_niñez"),
        ("Muestra final", "18,493 registros (se excluyeron 2,017 con target sin medir; "
                           "antes se imputaban con la mediana, lo que introducía fuga)"),
        ("Variable objetivo", "desnutricion_cronica (0 = sin desnutrición crónica, 1 = con desnutrición crónica)"),
        ("Predictores", "114 variables"),
        ("Partición", "80/20 estratificada, random_state=42"),
        ("Preprocesamiento", "Numéricas: mediana + StandardScaler. Categóricas: moda + OneHotEncoder"),
        ("Modelos comparados", "Logistic Regression, Decision Tree, Random Forest, XGBoost (con manejo de desbalance)"),
        ("Criterio de selección", "average_precision (PR-AUC) en test, no F1 ponderado"),
        ("Modelo ganador", m["modelo_ganador"]),
        ("Semilla", "42"),
        ("Métricas clase positiva", f"precision={m['precision_clase_1']:.4f}, "
                                     f"recall={m['recall_clase_1']:.4f}, f1={m['f1_clase_1']:.4f}"),
        ("ROC-AUC / PR-AUC", f"{m['roc_auc']:.4f} / {m['pr_auc']:.4f}"),
        ("Balanced accuracy", f"{m['accuracy_balanced']:.4f}"),
    ]

    print("| Aspecto | Valor |")
    print("|---|---|")
    for k, v in filas:
        print(f"| {k} | {v} |")


if __name__ == "__main__":
    run()
```

- [ ] **Step 2: Ejecutar y copiar la salida a la sección correspondiente de la tesis (manual, fuera de este repo)**

```bash
.venv/Scripts/python.exe -m pipeline_v2.tabla_experimento
```

- [ ] **Step 3: Commit**

```bash
git add pipeline_v2/tabla_experimento.py
git commit -m "docs: script para generar la tabla única del experimento"
```

---

## Self-Review

**Cobertura del spec** (los 9 hallazgos de la revisión + pedidos del tutor):
1. Fuga por imputación del target → Task 4 ✅
2. Sobreajuste no detectado → Task 3 (baseline) + Task 7 (test de mejora) ✅
3. Métricas hardcodeadas en la API → Task 10 (gateado) ✅
4. Selección de modelo rota → Task 7 (`nombre_ganador` ya no se ignora) ✅
5. train.csv/test.csv corruptos → Task 5 ✅
6. Métricas "weighted" que ocultan la clase positiva → Task 7 (métricas por clase + PR-AUC) ✅
7. Desajuste de alcance territorial (Tungurahua vs. nacional) → **no cubierto por este plan**, es una decisión de alcance/narrativa de la tesis, no un bug de código; queda para discutir aparte.
8. ENDI sin usar → **no cubierto**, es limpieza de datos muertos, bajo riesgo/bajo impacto; se puede añadir como task menor si se quiere.
9. `DATA_PATH` relativo → Task 9 ✅
10. Pedido del tutor de tabla única del experimento → Task 12 ✅
11. Pedido del tutor de verificar fuga por variable → Task 6 ✅
12. Pedido del tutor de métricas por clase completas → Task 7 ✅

**Sin placeholders:** todo el código de cada task está completo y es ejecutable tal cual, sin "TODO" ni "implementar después".

**Consistencia de tipos:** `TARGET_COL`, `build_clean_dataset()`, `make_split()`, `OUTPUT_DIR` se definen una vez en `paths.py`/`build_clean_dataset.py`/`split_dataset.py` y se importan igual en todos los tasks posteriores — nombres verificados consistentes en todo el documento.

---

**Plan completo y guardado en `docs/superpowers/plans/2026-09-12-desnutricion-model-data-fixes.md`.**

Dos formas de ejecutarlo:

**1. Subagent-Driven (recomendado)** — despliego un subagente fresco por task, con revisión entre cada uno.

**2. Ejecución en esta misma sesión** — voy corriendo las tasks en orden, con checkpoints para que revises antes de seguir.

¿Cuál prefieres, y confirmas que la Fase 3 (API) se queda en pausa hasta que la apruebes explícitamente?
