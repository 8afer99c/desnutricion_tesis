import json

import pandas as pd

from app.config import DATA_TEST_PATH, UMBRAL_PATH
from app.dashboard import Dashboard


def _metricas():
    with open(UMBRAL_PATH, encoding="utf-8") as f:
        return json.load(f)


def test_resumen_nacional_usa_la_particion_de_prueba():
    r = Dashboard.resumen()
    assert r["provincia"] == "Ecuador"
    assert r["total_registros"] == len(pd.read_csv(DATA_TEST_PATH))
    assert "prueba" in r["fuente"].lower()


def test_resumen_nacional_coincide_con_metricas_v2():
    # El resumen debe reproducir las metricas de la particion de prueba: si se
    # calculara sobre datos de entrenamiento no coincidiria.
    r = Dashboard.resumen()
    m = _metricas()
    assert abs(r["sensibilidad"] - m["recall_clase_1"]) < 1e-3
    assert abs(r["precision"] - m["precision_clase_1"]) < 1e-3


def test_resumen_es_coherente_consigo_mismo():
    r = Dashboard.resumen()
    assert r["casos_desnutricion"] + r["casos_sin_desnutricion"] == r["total_registros"]
    assert r["verdaderos_positivos"] <= min(r["casos_observados"], r["casos_desnutricion"])
    assert 0 <= r["porcentaje_observado"] <= 100


def test_resumen_de_provincia_filtra_registros_de_prueba():
    r = Dashboard.resumen("Tungurahua")
    assert r["provincia"] == "Tungurahua"
    assert r["total_registros"] == 112


def test_provincia_no_valida():
    assert Dashboard.resumen("Atlantis") == {"mensaje": "Provincia no válida."}
