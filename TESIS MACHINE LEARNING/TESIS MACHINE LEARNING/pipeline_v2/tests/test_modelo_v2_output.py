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
