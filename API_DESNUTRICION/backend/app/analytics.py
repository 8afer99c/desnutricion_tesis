# ==========================================================
# analytics.py
# ==========================================================

import json

import pandas as pd
import numpy as np

from app.config import BASE_DIR, DATA_PATH, MODEL_VERSION, RIESGO_ALTO_DESDE, UMBRAL_DECISION
from app.predictor import Predictor

METRICS_PATH = BASE_DIR / "models" / "metricas_v2.json"


class Analytics:


    # ======================================================
    # MÉTRICAS DEL MODELO
    # ======================================================

    @staticmethod
    def metricas():
        if MODEL_VERSION == "v1":
            return {
                "modelo": "XGBoost (v1, modelo legacy)",
                "mensaje": "Métricas detalladas no disponibles para v1 -- este endpoint reporta las métricas del modelo v2 corregido, que no está activo (MODEL_VERSION=v1).",
            }
        with open(METRICS_PATH, encoding="utf-8") as f:
            m = json.load(f)
        return {
            "modelo": m.get("modelo_ganador", "XGBoost"),
            "accuracy_balanceada": round(m["accuracy_balanced"], 6),
            "precision_clase_desnutricion": round(m["precision_clase_1"], 6),
            "recall_clase_desnutricion": round(m["recall_clase_1"], 6),
            "f1_clase_desnutricion": round(m["f1_clase_1"], 6),
            "roc_auc": round(m["roc_auc"], 6),
            "pr_auc": round(m["pr_auc"], 6),
        }



    # ======================================================
    # IMPORTANCIA DE VARIABLES
    # ======================================================

    @staticmethod
    def importancia():

        pipeline = Predictor.modelo

        modelo = pipeline.named_steps["modelo"]

        preprocesador = pipeline.named_steps["preprocesador"]


        # Obtener importancia del modelo

        importancia = modelo.feature_importances_


        # Obtener variables transformadas

        variables = preprocesador.get_feature_names_out()


        print(
            "Variables transformadas:",
            len(variables)
        )

        print(
            "Importancias:",
            len(importancia)
        )


        # Ajustar si existe diferencia

        minimo = min(
            len(variables),
            len(importancia)
        )


        resultado = pd.DataFrame({

            "variable": variables[:minimo],

            "importancia": importancia[:minimo]

        })


        resultado = resultado.sort_values(
            by="importancia",
            ascending=False
        )


        return resultado.head(15).to_dict(
            orient="records"
        )



    # ======================================================
    # NIVEL DE RIESGO
    # ======================================================

    @staticmethod
    def riesgo():

        df = pd.read_csv(DATA_PATH)


        X = df[Predictor.features()]


        probabilidades = Predictor.modelo.predict_proba(X)[:,1]


        alto = int(
            (probabilidades >= RIESGO_ALTO_DESDE).sum()
        )


        medio = int(
            ((probabilidades >= UMBRAL_DECISION) &
             (probabilidades < RIESGO_ALTO_DESDE)).sum()
        )


        bajo = int(
            (probabilidades < UMBRAL_DECISION).sum()
        )


        return {


            "riesgo_alto":alto,

            "riesgo_medio":medio,

            "riesgo_bajo":bajo

        }