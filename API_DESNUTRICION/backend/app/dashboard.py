# ==========================================================
# dashboard.py
# ==========================================================

import pandas as pd

from app.config import DATA_TEST_PATH, MODEL_VERSION, UMBRAL_DECISION
from app.predictor import Predictor

OBJETIVO = "desnutricion_cronica"


class Dashboard:

    @staticmethod
    def resumen(provincia=None):
        """Resumen por ambito calculado sobre la particion de prueba.

        Antes se clasificaba el archivo completo (ENSANUT_MODELO.csv), que incluye
        los registros usados para entrenar el modelo, y solo se informaban las
        clasificaciones. Ahora se usan registros que el modelo no vio y se informan
        juntos los casos observados y los clasificados.
        """

        # ============================
        # Cargar la particion de prueba
        # ============================

        try:
            df = pd.read_csv(DATA_TEST_PATH)
        except FileNotFoundError:
            return {
                "error": "El conjunto de prueba (test_v2.csv) no se encontró en el servidor. El resumen no puede ser calculado.",
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
        # Clasificacion con el umbral de decision
        # ============================

        probabilidades = Predictor.modelo.predict_proba(df[Predictor.features()])[:, 1]

        clasificado = probabilidades >= UMBRAL_DECISION

        observado = df[OBJETIVO].to_numpy() == 1

        total = len(df)

        casos = int(clasificado.sum())

        sanos = total - casos

        observados = int(observado.sum())

        verdaderos_positivos = int((clasificado & observado).sum())

        resumen = {

            "provincia":
                provincia if provincia
                else "Ecuador",

            "fuente":
                "Conjunto de prueba (registros no usados para entrenar el modelo)",

            "total_registros":
                total,

            # Casos observados (variable objetivo de la encuesta)

            "casos_observados":
                observados,

            "porcentaje_observado":
                round(observados / total * 100, 2),

            # Casos clasificados por el modelo

            "casos_desnutricion":
                casos,

            "casos_sin_desnutricion":
                sanos,

            "porcentaje_desnutricion":
                round(casos / total * 100, 2),

            # Concordancia en el ambito (inestable si hay pocos registros)

            "verdaderos_positivos":
                verdaderos_positivos,

            "sensibilidad":
                round(verdaderos_positivos / observados, 4)
                if observados else None,

            "precision":
                round(verdaderos_positivos / casos, 4)
                if casos else None

        }

        if MODEL_VERSION == "v1":
            resumen["advertencia"] = (
                "El modelo v1 se entrenó con todos los registros; "
                "estas cifras no son fuera de muestra."
            )

        return resumen
