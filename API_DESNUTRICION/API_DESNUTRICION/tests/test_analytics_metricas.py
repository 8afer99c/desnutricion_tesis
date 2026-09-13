from app.analytics import Analytics
from app.config import MODEL_VERSION


def test_metricas_carga_desde_json_real():
    m = Analytics.metricas()
    if MODEL_VERSION == "v1":
        # v1 es el modelo legacy sin ajuste de umbral; Analytics.metricas()
        # no reporta las métricas detalladas de v2 en este modo (ver Fix 2
        # del final review), sino un mensaje honesto de que no aplican.
        assert m["modelo"].startswith("XGBoost")
        assert "mensaje" in m
        assert "accuracy_balanceada" not in m
    else:
        assert 0.0 <= m["accuracy_balanceada"] <= 1.0
        assert 0.0 <= m["recall_clase_desnutricion"] <= 1.0
        assert "roc_auc" in m
