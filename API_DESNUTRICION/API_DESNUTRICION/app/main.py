from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from fastapi import FastAPI
from fastapi import HTTPException
from typing import Dict, Any

from app.predictor import Predictor
from app.dashboard import Dashboard
from app.analytics import Analytics

from fastapi import UploadFile, File
from app.predict_file import PredictFile

from app.schemas import (
    PrediccionResponse
)

from app.config import (
    API_TITLE,
    API_DESCRIPTION,
    API_VERSION
)


app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION
)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

@app.get("/")
def inicio(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )

# ==========================================================
# INICIO
# ==========================================================

@app.get("/info")
def info():

    metricas = Analytics.metricas()

    return {

        "api":"Predicción de Desnutrición Crónica",

        "version":"1.0.0",

        "modelo":metricas.get("modelo", "desconocido"),

        "estado":"Activa"

    }


# ==========================================================
# HEALTH
# ==========================================================

@app.get("/health")
def health():

    return {

        "status":"OK"

    }


# ==========================================================
# VARIABLES
# ==========================================================

@app.get("/features")
def features():

    columnas = Predictor.features()

    return {

        "numero_variables":len(columnas),

        "variables":columnas

    }


# ==========================================================
# PREDICCIÓN INDIVIDUAL
# ==========================================================

@app.post(
    "/predict",
    response_model=PrediccionResponse
)
def predict(
    datos: Dict[str,Any]
):

    # Validar las 114 variables

    validacion = Predictor.validar(datos)


    if not validacion["ok"]:

        raise HTTPException(

            status_code=400,

            detail={

                "mensaje":
                "Las variables enviadas no coinciden con el modelo",

                "detalle":validacion

            }

        )


    prediccion, probabilidad = Predictor.predict(datos)



    if prediccion == 1:

        descripcion = (
            "Con desnutrición crónica"
        )

    else:

        descripcion = (
            "Sin desnutrición crónica"
        )



    # Clasificación del riesgo

    if probabilidad >= 0.80:

        riesgo = "ALTO"


    elif probabilidad >= 0.50:

        riesgo = "MEDIO"


    else:

        riesgo = "BAJO"



    return {


        "prediccion":prediccion,


        "descripcion":descripcion,


        "probabilidad":round(
            probabilidad,
            4
        ),


        "riesgo":riesgo

    }


# ==========================================================
# PREDICCIÓN MASIVA
# ==========================================================

@app.post("/predict-file")
def predict_file(
    archivo: UploadFile = File(...)
):

    resultado = PredictFile.procesar(archivo)


    if not resultado["ok"]:

        return resultado


    return FileResponse(

        path=resultado["archivo"],

        filename="resultado_prediccion.xlsx",

        media_type=
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

    )

from typing import Optional
@app.get("/dashboard")
def dashboard(
    provincia: Optional[str] = None
):

    return Dashboard.resumen(
        provincia
    )


# ==========================================================
# MÉTRICAS DEL MODELO
# ==========================================================

@app.get("/dashboard/metricas")
def metricas():

    return Analytics.metricas()


# ==========================================================
# IMPORTANCIA VARIABLES
# ==========================================================

@app.get("/dashboard/importancia")
def importancia():

    return Analytics.importancia()

# ==========================================================
# DISTRIBUCIÓN RIESGO
# ==========================================================

@app.get("/dashboard/riesgo")
def riesgo():

    return Analytics.riesgo()


@app.get("/example")
def example():

    ejemplo = {}

    for variable in Predictor.features():

        ejemplo[variable] = None

    return ejemplo