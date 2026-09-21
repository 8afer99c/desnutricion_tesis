from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from fastapi import FastAPI, HTTPException
from typing import Dict, Any
from fastapi.middleware.cors import CORSMiddleware

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
    API_VERSION,
    nivel_riesgo
)

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory="static_react/assets"), name="assets")

# templates = Jinja2Templates(directory="templates")

# ==========================================================
# INICIO
# ==========================================================

@app.get("/api/info")
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

@app.get("/api/health")
def health():

    return {

        "status":"OK"

    }


# ==========================================================
# VARIABLES
# ==========================================================

@app.get("/api/features")
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
    "/api/predict",
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

    riesgo = nivel_riesgo(probabilidad)



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

@app.post("/api/predict-file")
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
@app.get("/api/dashboard")
def dashboard(
    provincia: Optional[str] = None
):

    return Dashboard.resumen(
        provincia
    )


# ==========================================================
# MÉTRICAS DEL MODELO
# ==========================================================

@app.get("/api/dashboard/metricas")
def metricas():

    return Analytics.metricas()


# ==========================================================
# IMPORTANCIA VARIABLES
# ==========================================================

@app.get("/api/dashboard/importancia")
def importancia():

    return Analytics.importancia()

# ==========================================================
# DISTRIBUCIÓN RIESGO
# ==========================================================

@app.get("/api/dashboard/riesgo")
def riesgo():

    return Analytics.riesgo()


@app.get("/api/example")
def example():

    ejemplo = {}

    for variable in Predictor.features():

        ejemplo[variable] = None

@app.get("/api/debug-files")
def debug_files():
    import os
    from app.config import BASE_DIR
    data_dir = BASE_DIR / "data"
    outputs_dir = BASE_DIR / "outputs"
    return {
        "base_dir": str(BASE_DIR),
        "data_exists": data_dir.exists(),
        "data_files": os.listdir(data_dir) if data_dir.exists() else [],
        "outputs_exists": outputs_dir.exists(),
        "outputs_files": os.listdir(outputs_dir) if outputs_dir.exists() else [],
        "cwd": os.getcwd()
    }

# ==========================================================
# REACT SPA SERVING
# ==========================================================
@app.get("/{catchall:path}")
def serve_react_spa(catchall: str):
    import os
    if catchall.startswith("api/") or catchall in ("docs", "openapi.json"):
        raise HTTPException(status_code=404)
        
    file_path = os.path.join("static_react", catchall)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
        
    response = FileResponse("static_react/index.html")
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response