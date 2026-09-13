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


def test_predict_probabilidad_coincide_con_el_modelo_configurado():
    import joblib
    from app.config import MODEL_PATH

    ruta = Path(__file__).resolve().parent.parent / "data" / "ENSANUT_MODELO.csv"
    df = pd.read_csv(ruta)
    fila = df.iloc[0][Predictor.features()].to_dict()

    r = client.post("/predict", json=fila)
    prob_api = r.json()["probabilidad"]

    modelo_directo = joblib.load(MODEL_PATH)
    entrada = pd.DataFrame([fila])[Predictor.features()]
    prob_directa = modelo_directo.predict_proba(entrada)[0][1]

    assert abs(prob_api - round(prob_directa, 4)) < 1e-4
