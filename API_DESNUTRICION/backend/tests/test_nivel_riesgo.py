from pathlib import Path

import pandas as pd

from app.config import RIESGO_ALTO_DESDE, UMBRAL_DECISION, nivel_riesgo
from app.predictor import Predictor


def test_bordes_del_nivel_de_riesgo():
    assert nivel_riesgo(UMBRAL_DECISION - 0.001) == "BAJO"
    assert nivel_riesgo(UMBRAL_DECISION) == "MEDIO"
    assert nivel_riesgo(RIESGO_ALTO_DESDE - 0.001) == "MEDIO"
    assert nivel_riesgo(RIESGO_ALTO_DESDE) == "ALTO"
    assert nivel_riesgo(0.0) == "BAJO"
    assert nivel_riesgo(1.0) == "ALTO"


def test_el_umbral_de_decision_es_menor_que_el_corte_de_riesgo_alto():
    assert 0.0 < UMBRAL_DECISION < RIESGO_ALTO_DESDE < 1.0


def test_clase_positiva_nunca_es_riesgo_bajo():
    # Con el corte antiguo (0.50) los casos con probabilidad entre el umbral y 0.50
    # se clasificaban con desnutricion cronica pero figuraban como riesgo BAJO.
    ruta = Path(__file__).resolve().parent.parent / "data" / "ENSANUT_MODELO.csv"
    muestra = pd.read_csv(ruta).sample(300, random_state=42)
    probabilidades = Predictor.modelo.predict_proba(muestra[Predictor.features()])[:, 1]

    for p in probabilidades:
        clase_positiva = p >= UMBRAL_DECISION
        assert (nivel_riesgo(p) != "BAJO") == clase_positiva
