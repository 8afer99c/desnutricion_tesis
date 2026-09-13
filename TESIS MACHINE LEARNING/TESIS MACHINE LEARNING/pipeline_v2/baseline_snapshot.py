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
