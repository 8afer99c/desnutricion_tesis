# ==========================================================
# dashboard.py
# ==========================================================

import pandas as pd

from app.config import DATA_PATH
from app.predictor import Predictor


class Dashboard:

    @staticmethod
    def resumen(provincia=None):

        # ============================
        # Cargar datos nacionales
        # ============================

        try:
            df = pd.read_csv(DATA_PATH)
        except FileNotFoundError as e:
            import os
            return {
                "error": f"Error: No se encontró el archivo. Ruta intentada: {DATA_PATH}. ¿Existe?: {os.path.exists(DATA_PATH)}",
                "total_registros": 0,
                "casos_desnutricion": 0,
                "casos_sin_desnutricion": 0,
                "porcentaje_desnutricion": 0
            }

        # ============================
        # Filtrar provincia (opcional)
        # ============================

        if provincia is not None:

            from app.utils import PROVINCIAS

            if provincia is not None:

                codigo = None

                for k, v in PROVINCIAS.items():
                    if v.lower() == provincia.lower():
                        codigo = k
                        break

                if codigo is None:
                    return {
                        "mensaje": "Provincia no válida."
                    }

                df = df[df["provincia"] == codigo]

        # Si no existen registros

        if df.empty:

            return {

                "mensaje":
                "No existen registros para esa provincia."

            }

        # ============================
        # Variables del modelo
        # ============================

        X = df[Predictor.features()]

        # ============================
        # Predicción
        # ============================

        from app.config import UMBRAL_DECISION

        probabilidades = Predictor.modelo.predict_proba(X)[:, 1]
        pred = (probabilidades >= UMBRAL_DECISION).astype(int)

        total = len(pred)

        casos = int((pred == 1).sum())

        sanos = int((pred == 0).sum())

        porcentaje = round(

            casos / total * 100,

            2

        )

        return {

            "provincia":
                provincia if provincia
                else "Ecuador",

            "total_registros":
                total,

            "casos_desnutricion":
                casos,

            "casos_sin_desnutricion":
                sanos,

            "porcentaje_desnutricion":
                porcentaje

        }