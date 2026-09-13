# pipeline_v2/tabla_experimento.py
"""
Genera la "tabla única del experimento" que pide Correcciones_Tesis_Fernando.docx:
dataset, muestra final, variable objetivo, predictores, partición,
preprocesamiento, modelos, hiperparámetros, semilla, métricas y criterio de
selección -- todo derivado de los artefactos ya generados, no inventado.

Los valores numéricos NO se escriben a mano: se leen de metricas_v2.json, de
pipeline_v2.paths y de los propios CSV del split, para que la tabla no quede
desfasada si el pipeline se vuelve a ejecutar con otros datos o parámetros.

Además de imprimirla, la tabla se guarda en output/tabla_experimento.md con
codificación UTF-8, porque la consola de Windows (cp1252) convierte "niñez" en
mojibake y la tabla está pensada para copiarse tal cual dentro de la tesis.
"""
import json
import sys

import pandas as pd

from pipeline_v2.paths import (
    ENSANUT_MODELO_PATH, OUTPUT_DIR, RANDOM_STATE, TARGET_COL, TEST_SIZE,
)


def _contar_predictores():
    """Número de predictores, leyendo sólo la cabecera del split de prueba."""
    ruta = OUTPUT_DIR / "test_v2.csv"
    if not ruta.exists():
        return None
    columnas = pd.read_csv(ruta, nrows=0).columns.tolist()
    return len([c for c in columnas if c != TARGET_COL])


def _filas_dataset_original():
    """Filas del dataset v1 (antes de descartar los target sin medir)."""
    if not ENSANUT_MODELO_PATH.exists():
        return None
    return len(pd.read_csv(ENSANUT_MODELO_PATH, usecols=[TARGET_COL]))


def _filas_de_matriz(matriz):
    return int(sum(sum(fila) for fila in matriz))


def _muestra_final(m):
    """Muestra efectiva = soporte de train + soporte de test."""
    n_test = _filas_de_matriz(m["confusion_matrix"])
    if "train" not in m:
        return None, n_test
    return _filas_de_matriz(m["train"]["confusion_matrix"]) + n_test, n_test


def _describir_hiperparametros(m):
    if m.get("hiperparametros_ajustados"):
        return ("Ajustados con RandomizedSearchCV (scoring=average_precision, "
                "CV 5-fold estratificada y sembrada)")
    params = m.get("hiperparametros_modelo", {})
    interesantes = ["n_estimators", "max_depth", "class_weight", "criterion",
                    "min_samples_split", "min_samples_leaf", "max_features"]
    detalle = ", ".join(
        f"{k}={params[k]}" for k in interesantes if k in params
    )
    base = ("SIN búsqueda de hiperparámetros: el modelo ganador se usa con los "
            "valores por defecto de scikit-learn (sólo la rama de XGBoost tiene "
            "grilla en el script)")
    return f"{base}. Parámetros efectivos: {detalle}" if detalle else base


def construir_filas(m):
    n_total, n_test = _muestra_final(m)
    n_original = _filas_dataset_original()
    n_predictores = _contar_predictores()

    if n_total is not None and n_original is not None:
        muestra = (f"{n_total:,} registros (se excluyeron {n_original - n_total:,} "
                   "con target sin medir; antes se imputaban con la mediana, lo que "
                   "introducía fuga)")
    elif n_total is not None:
        muestra = (f"{n_total:,} registros (se excluyeron los de target sin medir; "
                   "antes se imputaban con la mediana, lo que introducía fuga)")
    else:
        muestra = "no derivable (falta la evaluación sobre train en metricas_v2.json)"

    particion = (f"{int((1 - TEST_SIZE) * 100)}/{int(TEST_SIZE * 100)} estratificada, "
                 f"random_state={RANDOM_STATE}")

    filas = [
        ("Dataset", "ENSANUT 2018 (Ecuador), microdatos f2_salud_niñez"),
        ("Muestra final", muestra),
        ("Variable objetivo",
         f"{TARGET_COL} (0 = sin desnutrición crónica, 1 = con desnutrición crónica)"),
        ("Predictores",
         f"{n_predictores} variables" if n_predictores is not None
         else "no derivable (falta output/test_v2.csv)"),
        ("Partición", particion),
        ("Preprocesamiento",
         "Numéricas: mediana + StandardScaler. Categóricas: moda + OneHotEncoder"),
        ("Modelos comparados",
         ", ".join(m["comparativa_base"].keys()) + " (con manejo de desbalance)"),
        ("Criterio de selección", "average_precision (PR-AUC) en test, no F1 ponderado"),
        ("Modelo ganador", m["modelo_ganador"]),
        ("Hiperparámetros", _describir_hiperparametros(m)),
        ("Semilla", str(RANDOM_STATE)),
        ("Umbral de decisión",
         f"{m['umbral_usado']:.2f} (maximiza F1 de clase 1, CV 5-fold out-of-fold sobre train)"),
        ("Métricas clase positiva", f"precision={m['precision_clase_1']:.4f}, "
                                    f"recall={m['recall_clase_1']:.4f}, f1={m['f1_clase_1']:.4f}"),
        ("ROC-AUC / PR-AUC", f"{m['roc_auc']:.4f} / {m['pr_auc']:.4f}"),
        ("Balanced accuracy", f"{m['accuracy_balanced']:.4f}"),
    ]

    if "train" in m:
        tr = m["train"]
        filas.append((
            "Brecha train vs test",
            f"balanced accuracy train={tr['accuracy_balanced']:.4f} vs "
            f"test={m['accuracy_balanced']:.4f}; "
            f"PR-AUC train={tr['pr_auc']:.4f} vs test={m['pr_auc']:.4f} "
            "(el modelo memoriza train: sobreajuste esperado en un bosque sin "
            "profundidad máxima, reportado de forma explícita)"
        ))

    return filas


def render_markdown(filas) -> str:
    lineas = ["| Aspecto | Valor |", "|---|---|"]
    lineas += [f"| {k} | {v} |" for k, v in filas]
    return "\n".join(lineas) + "\n"


def run():
    # La consola de Windows usa cp1252 y rompe los acentos/ñ de la tabla.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

    ruta_metricas = OUTPUT_DIR / "metricas_v2.json"
    if not ruta_metricas.exists():
        raise SystemExit("Ejecuta primero: python -m pipeline_v2.entrenar_modelo")

    with open(ruta_metricas, encoding="utf-8") as f:
        m = json.load(f)

    tabla = render_markdown(construir_filas(m))
    print(tabla, end="")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    destino = OUTPUT_DIR / "tabla_experimento.md"
    with open(destino, "w", encoding="utf-8") as f:
        f.write(tabla)
    print(f"\nTabla guardada en: {destino}")


if __name__ == "__main__":
    run()
