# ==========================================================
# predict_file.py
# ==========================================================

import os
import uuid
import pandas as pd

from app.predictor import Predictor


class ArchivoInvalido(Exception):
    """El archivo recibido no se puede leer como una tabla de datos."""


def _leer_tabla(archivo):
    """Lee un CSV o un Excel (.xlsx) como DataFrame.

    Cualquier problema de lectura se informa como ArchivoInvalido con un mensaje
    para el usuario, en lugar de dejar escapar la excepcion de pandas/openpyxl.
    """

    nombre = (archivo.filename or "").lower()

    if nombre.endswith(".xls"):
        # El formato binario antiguo necesita xlrd, que no es dependencia del proyecto.
        raise ArchivoInvalido(
            "El formato .xls no está soportado. Guarde el archivo como .xlsx o .csv."
        )

    if nombre.endswith(".xlsx"):
        try:
            return pd.read_excel(archivo.file, engine="openpyxl")
        except Exception:
            raise ArchivoInvalido(
                "No se pudo leer el archivo Excel. Verifique que sea un .xlsx válido."
            )

    try:
        return pd.read_csv(archivo.file)
    except pd.errors.EmptyDataError:
        raise ArchivoInvalido("El archivo está vacío.")
    except (UnicodeDecodeError, pd.errors.ParserError):
        raise ArchivoInvalido(
            "No se pudo leer el archivo. Debe ser un CSV en UTF-8 con las columnas "
            "separadas por comas, o un Excel .xlsx."
        )


class PredictFile:

    @staticmethod
    def procesar(archivo):

        try:
            df = _leer_tabla(archivo)
        except ArchivoInvalido as error:
            return {
                "ok": False,
                "mensaje": str(error)
            }

        if df.empty:
            return {
                "ok": False,
                "mensaje": "El archivo no contiene registros."
            }

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

        from app.config import UMBRAL_DECISION, nivel_riesgo

        try:
            probabilidades = Predictor.modelo.predict_proba(X)[:, 1]
        except (ValueError, TypeError):
            return {
                "ok": False,
                "mensaje": (
                    "No se pudo clasificar el archivo: revise que los valores de cada "
                    "columna tengan el tipo y las categorías esperados."
                )
            }

        predicciones = (probabilidades >= UMBRAL_DECISION).astype(int)

        df["prediccion"] = predicciones

        df["probabilidad"] = probabilidades

        probabilidades = pd.Series(probabilidades)


        df["riesgo"] = probabilidades.map(nivel_riesgo)

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
