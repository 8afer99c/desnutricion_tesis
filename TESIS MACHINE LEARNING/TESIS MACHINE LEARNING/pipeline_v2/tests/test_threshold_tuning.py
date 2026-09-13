"""
Cobertura de las dos correcciones de umbral introducidas a mitad de vuelo:

- `entrenar_modelo.find_best_threshold`: busca el umbral que maximiza F1 de la
  clase 1 con predicciones out-of-fold sobre TRAIN.
- `comparar_v1_v2.score_model`: puntúa aplicando ese umbral en vez de usar
  `.predict()` (que asume 0.5).

Sin estos tests, una regresión futura a `.predict()` pasaría desapercibida.
Todo corre sobre datos sintéticos: no toca artefactos ni el dataset real.
"""
import numpy as np
import pandas as pd
import pytest
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

from pipeline_v2.comparar_v1_v2 import score_model
from pipeline_v2.entrenar_modelo import find_best_threshold


class ProbabilidadesSesgadas:
    """
    Clasificador de juguete cuyas probabilidades están comprimidas hacia abajo:
    ordena bien los casos (la probabilidad crece con la primera variable) pero
    casi nunca supera 0.5, que es justo el escenario que hace colapsar el recall
    de la clase positiva cuando se usa `.predict()` a secas.
    """

    def __init__(self, tope=0.35):
        self.tope = tope
        self.classes_ = np.array([0, 1])

    def fit(self, X, y=None):
        return self

    def get_params(self, deep=True):
        return {"tope": self.tope}

    def set_params(self, **params):
        for k, v in params.items():
            setattr(self, k, v)
        return self

    def predict_proba(self, X):
        valores = np.asarray(X)[:, 0].astype(float)
        rango = valores.max() - valores.min()
        normal = (valores - valores.min()) / (rango if rango else 1.0)
        p1 = normal * self.tope
        return np.column_stack([1.0 - p1, p1])

    def predict(self, X):
        return (self.predict_proba(X)[:, 1] >= 0.5).astype(int)


def _dataset_desbalanceado(n=400, semilla=0):
    rng = np.random.default_rng(semilla)
    señal = rng.normal(size=n)
    y = pd.Series((señal + rng.normal(scale=0.6, size=n) > 1.0).astype(int))
    X = pd.DataFrame({"señal": señal, "ruido": rng.normal(size=n)})
    return X, y


def test_find_best_threshold_devuelve_un_valor_dentro_de_la_rejilla():
    X, y = _dataset_desbalanceado()
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("modelo", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    umbral = find_best_threshold(pipeline, X, y, cv=3)

    assert isinstance(umbral, float)
    assert 0.05 <= umbral < 0.95, f"umbral fuera de la rejilla: {umbral}"
    # Finding #12: se redondea antes de devolverse, nada de 0.23000000000000004.
    assert umbral == round(umbral, 4)


def test_find_best_threshold_baja_de_0_5_con_probabilidades_comprimidas():
    """
    Con un clasificador que nunca pasa de 0.35, el umbral por defecto (0.5) daría
    cero positivos y F1=0; la búsqueda debe encontrar un umbral por debajo.
    """
    X, y = _dataset_desbalanceado()
    pipeline = Pipeline([("modelo", ProbabilidadesSesgadas(tope=0.35))])
    umbral = find_best_threshold(pipeline, X, y, cv=3)

    assert umbral < 0.5, (
        f"el umbral debería bajar de 0.5 con probabilidades comprimidas, dio {umbral}"
    )


def test_find_best_threshold_es_determinista():
    """La CV va sembrada (finding #14): dos llamadas dan el mismo umbral."""
    X, y = _dataset_desbalanceado()
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("modelo", LogisticRegression(max_iter=1000, class_weight="balanced")),
    ])
    assert find_best_threshold(pipeline, X, y, cv=3) == find_best_threshold(
        pipeline, X, y, cv=3
    )


def test_score_model_respeta_el_umbral_y_no_asume_0_5():
    """
    Si `score_model` volviera a usar `.predict()` (umbral 0.5 implícito), las dos
    llamadas darían métricas idénticas y este test fallaría.
    """
    X, y = _dataset_desbalanceado()
    modelo = ProbabilidadesSesgadas(tope=0.35).fit(X, y)

    bajo = score_model(modelo, X, y, umbral=0.23)
    defecto = score_model(modelo, X, y, umbral=0.5)

    assert bajo["umbral_usado"] == 0.23
    assert defecto["umbral_usado"] == 0.5
    assert bajo["recall_clase_1"] != defecto["recall_clase_1"]
    assert bajo["f1_clase_1"] != defecto["f1_clase_1"]
    # Con probabilidades que nunca llegan a 0.5, el umbral por defecto no
    # detecta ningún positivo: exactamente el fallo que motivó el ajuste.
    assert defecto["recall_clase_1"] == 0.0
    assert bajo["recall_clase_1"] > 0.0
    # Las métricas basadas en ranking no dependen del umbral.
    assert bajo["roc_auc"] == pytest.approx(defecto["roc_auc"])
    assert bajo["pr_auc"] == pytest.approx(defecto["pr_auc"])
