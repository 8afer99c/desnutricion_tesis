from pathlib import Path

PIPELINE_V2_DIR = Path(__file__).resolve().parent
DATA_DIR = PIPELINE_V2_DIR.parent  # carpeta con los CSV/joblib originales
OUTPUT_DIR = PIPELINE_V2_DIR / "output"

ENSANUT_CORREGIDO_PATH = DATA_DIR / "ENSANUT_CORREGIDO.csv"
ENSANUT_MODELO_PATH = DATA_DIR / "ENSANUT_MODELO.csv"
V1_MODEL_PATH = DATA_DIR / "modelo_final_api.joblib"

TARGET_COL = "desnutricion_cronica"
RANDOM_STATE = 42
TEST_SIZE = 0.20
