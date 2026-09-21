# config.py (extracto)
UMBRAL_DECISION = _cargar_umbral_decision()   # 0.42 en el modelo v2

# Nivel de riesgo. BAJO coincide con la clase 0 (probabilidad < UMBRAL_DECISION)
# para que un caso clasificado con desnutricion cronica nunca figure como BAJO.
# ALTO empieza en RIESGO_ALTO_DESDE. Con el modelo v2 la probabilidad maxima en
# la particion de prueba es 0.747, por lo que el 0.80 original nunca se alcanzaba;
# 0.60 corresponde a ~el percentil 95 de esas probabilidades, donde la prevalencia
# observada supera el 50 %. El modelo v1 conserva el corte 0.80 original.
RIESGO_ALTO_DESDE = 0.80 if MODEL_VERSION == "v1" else 0.60


def nivel_riesgo(probabilidad):
    """Devuelve "BAJO", "MEDIO" o "ALTO" a partir de la probabilidad estimada."""
    if probabilidad >= RIESGO_ALTO_DESDE:
        return "ALTO"
    if probabilidad >= UMBRAL_DECISION:
        return "MEDIO"
    return "BAJO"
