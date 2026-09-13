# ==========================================================
# predict_file.py
# ==========================================================

import os
import uuid
import pandas as pd

from app.predictor import Predictor


class PredictFile:

    @staticmethod
    def procesar(archivo):

        df = pd.read_csv(archivo.file)

        columnas_modelo = Predictor.features()

        columnas_csv = df.columns.tolist()

        faltantes = sorted(
            list(
                set(columnas_modelo) -
                set(columnas_csv)
            )
        )

        adicionales = sorted(
            list(
                set(columnas_csv) -
                set(columnas_modelo)
            )
        )

        if faltantes:

            return {

                "ok": False,

                "mensaje": "El archivo no contiene todas las variables requeridas.",

                "faltantes": faltantes,

                "adicionales": adicionales

            }

        # Reordenar columnas exactamente igual al entrenamiento
        X = df[columnas_modelo]

        from app.config import UMBRAL_DECISION

        probabilidades = Predictor.modelo.predict_proba(X)[:, 1]

        predicciones = (probabilidades >= UMBRAL_DECISION).astype(int)

        df["prediccion"] = predicciones

        df["probabilidad"] = probabilidades

        probabilidades = pd.Series(probabilidades)


        df["riesgo"] = probabilidades.map(

            lambda p:

            "ALTO" if p >= 0.80 else

            "MEDIO" if p >= 0.50 else

            "BAJO"

        )

        total = len(df)

        casos = int((predicciones == 1).sum())

        sin_casos = total - casos


        # Crear carpeta de resultados
        os.makedirs(
            "outputs",
            exist_ok=True
        )


        nombre_archivo = (
            f"outputs/prediccion_{uuid.uuid4().hex}.xlsx"
        )


        # Guardar resultado Excel
        df.to_excel(
            nombre_archivo,
            index=False
        )


        return {

            "ok": True,

            "archivo": nombre_archivo,

            "total_registros": total,

            "casos_desnutricion": casos,

            "casos_sin_desnutricion": sin_casos,

            "porcentaje_desnutricion": round(
                casos / total * 100,
                2
            )

        }