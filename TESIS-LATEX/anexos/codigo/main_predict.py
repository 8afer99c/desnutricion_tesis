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
    # Clasificación del riesgo (ver nivel_riesgo en config.py)
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
