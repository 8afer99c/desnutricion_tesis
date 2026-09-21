import io
from pathlib import Path
from types import SimpleNamespace

import pandas as pd
import pytest

from app.predict_file import PredictFile
from app.predictor import Predictor

DATOS = Path(__file__).resolve().parent.parent / "data" / "test_v2.csv"


@pytest.fixture(autouse=True)
def salida_temporal(tmp_path, monkeypatch):
    # El servicio escribe el resultado en ./outputs; se aisla en una carpeta temporal.
    monkeypatch.chdir(tmp_path)


def _tabla(n=5):
    return pd.read_csv(DATOS).head(n)[Predictor.features()]


def _subida(nombre, contenido):
    return SimpleNamespace(filename=nombre, file=io.BytesIO(contenido))


def _csv(df):
    return df.to_csv(index=False).encode("utf-8")


def _xlsx(df):
    buf = io.BytesIO()
    df.to_excel(buf, index=False)
    return buf.getvalue()


def test_csv_valido():
    r = PredictFile.procesar(_subida("datos.csv", _csv(_tabla())))
    assert r["ok"] is True
    assert r["total_registros"] == 5


def test_xlsx_valido_da_el_mismo_resultado_que_el_csv():
    df = _tabla(20)
    r_csv = PredictFile.procesar(_subida("datos.csv", _csv(df)))
    r_xlsx = PredictFile.procesar(_subida("datos.xlsx", _xlsx(df)))
    assert r_xlsx["ok"] is True
    for clave in ("total_registros", "casos_desnutricion", "casos_sin_desnutricion"):
        assert r_xlsx[clave] == r_csv[clave]


def test_xlsx_con_columnas_faltantes_informa_cuales():
    df = _tabla().drop(columns=["sexo", "area"])
    r = PredictFile.procesar(_subida("datos.xlsx", _xlsx(df)))
    assert r["ok"] is False
    assert set(r["faltantes"]) == {"sexo", "area"}


def test_xls_antiguo_se_rechaza_con_mensaje():
    r = PredictFile.procesar(_subida("datos.xls", b"cualquier cosa"))
    assert r["ok"] is False
    assert ".xlsx" in r["mensaje"]


@pytest.mark.parametrize("nombre", ["falso.xlsx", "vacio.xlsx"])
def test_excel_danado_o_vacio_no_lanza_excepcion(nombre):
    contenido = b"" if nombre == "vacio.xlsx" else b"esto no es un excel"
    r = PredictFile.procesar(_subida(nombre, contenido))
    assert r["ok"] is False
    assert "Excel" in r["mensaje"]


def test_excel_enviado_como_csv_no_lanza_excepcion():
    # Era el caso CP14 de la tesis: un .xlsx sin extension reconocida producia UnicodeDecodeError.
    r = PredictFile.procesar(_subida("datos.csv", _xlsx(_tabla())))
    assert r["ok"] is False
    assert "mensaje" in r


def test_archivo_vacio_y_sin_registros():
    vacio = PredictFile.procesar(_subida("vacio.csv", b""))
    assert vacio["ok"] is False

    solo_encabezado = PredictFile.procesar(_subida("h.csv", _csv(_tabla(0))))
    assert solo_encabezado["ok"] is False
    assert "registros" in solo_encabezado["mensaje"]
