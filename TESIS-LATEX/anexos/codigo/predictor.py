# ==========================================================
# predictor.py
# ==========================================================
import joblib
import pandas as pd
from app.config import MODEL_PATH, UMBRAL_DECISION
modelo = joblib.load(MODEL_PATH)
print("Modelo cargado correctamente")
FEATURES = modelo.feature_names_in_.tolist()
class Predictor:
    modelo = modelo
    @staticmethod
    def features():
        return FEATURES
    @staticmethod
    def validar(datos):
        from app.utils import validar_variables
        return validar_variables(
            datos,
            FEATURES
        )
    @staticmethod
    def predict(datos):
        df = pd.DataFrame([datos])
        # mismo orden usado en entrenamiento
        df = df[FEATURES]
        # Devolver la probabilidad de clase 1 y aplicar el umbral ajustado
        # (no el 0.5 por defecto de .predict(), que no está calibrado para
        # este problema con ~25% de positivos)
        prob = modelo.predict_proba(df)[0][1]
        pred = int(prob >= UMBRAL_DECISION)
        return pred, float(prob)
