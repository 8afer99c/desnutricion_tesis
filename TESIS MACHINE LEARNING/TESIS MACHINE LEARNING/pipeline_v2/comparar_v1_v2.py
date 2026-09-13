"""
Compara el modelo actual (v1, desplegado, con la fuga) contra el nuevo (v2)
sobre el MISMO set de prueba sin fuga, para que el usuario decida con datos
si promover v2. Aviso: v1 pudo haber visto durante su propio entrenamiento
algunas de las filas que ahora están en test_v2 (su split original era
distinto) -- esta comparación es generosa con v1, no perfectamente
controlada, pero sirve como verificación de sensatez antes del cutover.

Cada modelo se evalúa en SU PROPIO umbral de decisión operativo: v1 nunca
tuvo un umbral ajustado (siempre usó el 0.5 por defecto de .predict(), tanto
en producción como en su entrenamiento original), así que se evalúa así.
v2 sí tiene un umbral ajustado (guardado en metricas_v2.json como
"umbral_usado", ver Task 7) -- compararlo a 0.5 sería injusto y no reflejaría
cómo v2 realmente se usaría.
"""
import json
import sys

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score, balanced_accuracy_score, f1_score,
    precision_score, recall_score, roc_auc_score,
)

from pipeline_v2.paths import OUTPUT_DIR, TARGET_COL, V1_MODEL_PATH

# Este aviso viaja DENTRO del JSON y se imprime encima de la tabla: los
# números de v1 aquí son optimistas y no deben citarse como su línea base.
AVISO_V1 = (
    "v1 se evalúa sobre filas que pudo haber memorizado en su propio "
    "entrenamiento (su split original era distinto del de v2), así que sus "
    "números aquí están inflados; su línea base real y sin fuga es "
    "recall=0.4759 / roc_auc=0.6479 (ver baseline_v1_snapshot.json)."
)


def score_model(pipeline, X, y, umbral: float = 0.5):
    y_proba = pipeline.predict_proba(X)[:, 1]
    y_pred = (y_proba >= umbral).astype(int)
    return {
        "umbral_usado": umbral,
        "balanced_accuracy": balanced_accuracy_score(y, y_pred),
        "recall_clase_1": recall_score(y, y_pred, pos_label=1),
        "precision_clase_1": precision_score(y, y_pred, pos_label=1),
        "f1_clase_1": f1_score(y, y_pred, pos_label=1),
        "roc_auc": roc_auc_score(y, y_proba),
        "pr_auc": average_precision_score(y, y_proba),
    }


def run():
    # La consola de Windows usa cp1252 por defecto y convertiría el aviso en
    # mojibake justo cuando más importa que se lea.
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except (AttributeError, OSError):
        pass

    if not (OUTPUT_DIR / "test_v2.csv").exists():
        raise SystemExit("Ejecuta primero: python -m pipeline_v2.split_dataset")
    if not (OUTPUT_DIR / "metricas_v2.json").exists() or not (OUTPUT_DIR / "modelo_v2.joblib").exists():
        raise SystemExit("Ejecuta primero: python -m pipeline_v2.entrenar_modelo")

    test_df = pd.read_csv(OUTPUT_DIR / "test_v2.csv")
    y = test_df[TARGET_COL]
    X = test_df.drop(columns=[TARGET_COL])

    with open(OUTPUT_DIR / "metricas_v2.json", encoding="utf-8") as f:
        umbral_v2 = json.load(f)["umbral_usado"]

    v1 = joblib.load(V1_MODEL_PATH)
    v2 = joblib.load(OUTPUT_DIR / "modelo_v2.joblib")

    v1_scores = score_model(v1, X[v1.feature_names_in_.tolist()], y, umbral=0.5)
    v2_scores = score_model(v2, X, y, umbral=umbral_v2)

    print(f"AVISO: {AVISO_V1}\n")
    print(f"{'Métrica':<22}{'v1 (actual, umbral 0.5)':<26}{'v2 (corregido, umbral '+f'{umbral_v2:.2f})':<26}")
    for k in v1_scores:
        print(f"{k:<22}{str(v1_scores[k]):<26}{str(v2_scores[k]):<26}")

    with open(OUTPUT_DIR / "comparacion_v1_v2.json", "w", encoding="utf-8") as f:
        json.dump(
            {"_aviso": AVISO_V1, "v1": v1_scores, "v2": v2_scores},
            f, indent=2, ensure_ascii=False,
        )


if __name__ == "__main__":
    run()
