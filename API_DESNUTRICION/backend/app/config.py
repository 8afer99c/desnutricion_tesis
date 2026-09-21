import json
import os
from pathlib import Path

# Carpeta raíz del proyecto
BASE_DIR = Path(__file__).resolve().parent.parent

# Ruta donde se encuentra el modelo entrenado
# MODEL_VERSION permite alternar entre el modelo v1 (original) y v2 (corregido y
# regularizado, ver pipeline_v2/). Por defecto se usa v2; para volver a v1 sin
# redeploy de código, basta con definir la variable de entorno MODEL_VERSION=v1.
_MODEL_VERSION_RAW = os.environ.get("MODEL_VERSION", "v2")
if _MODEL_VERSION_RAW not in ("v1", "v2"):
    print(f"ADVERTENCIA: MODEL_VERSION='{_MODEL_VERSION_RAW}' no reconocido; usando 'v2' por defecto")
    MODEL_VERSION = "v2"
else:
    MODEL_VERSION = _MODEL_VERSION_RAW
MODEL_PATH_V1 = BASE_DIR / "models" / "modelo_final_api.joblib"
MODEL_PATH_V2 = BASE_DIR / "models" / "modelo_v2.joblib"
MODEL_PATH = MODEL_PATH_V1 if MODEL_VERSION == "v1" else MODEL_PATH_V2
DATA_PATH = BASE_DIR / "data" / "ENSANUT_MODELO.csv"

# Particion de prueba (20 %) de pipeline_v2/split_dataset.py: registros que el
# modelo v2 no vio al entrenar. El resumen del tablero se calcula sobre ella.
DATA_TEST_PATH = BASE_DIR / "data" / "test_v2.csv"

UMBRAL_PATH = BASE_DIR / "models" / "metricas_v2.json"


def _cargar_umbral_decision():
    """Umbral de decisión ajustado (ver pipeline_v2/entrenar_modelo.py). Solo
    aplica al modelo v2 -- v1 nunca tuvo ajuste de umbral, usa el 0.5 por
    defecto de scikit-learn."""
    if MODEL_VERSION == "v1":
        return 0.5
    try:
        with open(UMBRAL_PATH, encoding="utf-8") as f:
            return json.load(f)["umbral_usado"]
    except (FileNotFoundError, KeyError):
        return 0.5


UMBRAL_DECISION = _cargar_umbral_decision()

# Nivel de riesgo. BAJO coincide con la clase 0 (probabilidad < UMBRAL_DECISION)
# para que un caso clasificado con desnutricion cronica nunca figure como BAJO.
# ALTO empieza en RIESGO_ALTO_DESDE. Con el modelo v2 la probabilidad maxima en
# la particion de prueba es 0.747, por lo que el 0.80 original nunca se alcanzaba;
# 0.60 corresponde a ~el percentil 95 de esas probabilidades, donde la prevalencia
# observada supera el 50 %. El modelo v1 conserva el corte 0.80 original.
RIESGO_ALTO_DESDE = 0.80 if MODEL_VERSION == "v1" else 0.60


def nivel_riesgo(probabilidad):
    """Devuelve "BAJO", "MEDIO" o "ALTO" a partir de la probabilidad estimada."""
    if probabilidad >= RIESGO_ALTO_DESDE:
        return "ALTO"
    if probabilidad >= UMBRAL_DECISION:
        return "MEDIO"
    return "BAJO"

# Información de la API
API_TITLE = "API de Predicción de Desnutrición Crónica Infantil"
API_VERSION = "1.0.0"
API_DESCRIPTION = """
API REST desarrollada con FastAPI para predecir
el riesgo de desnutrición crónica infantil mediante
un modelo de Machine Learning.
"""