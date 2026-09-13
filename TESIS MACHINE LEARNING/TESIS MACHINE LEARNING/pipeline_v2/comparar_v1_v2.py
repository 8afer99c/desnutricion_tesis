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
