# ==========================================================
# utils.py
# ==========================================================

from typing import Dict, List

# ==========================================================
# VALIDAR VARIABLES
# ==========================================================

def validar_variables(
    datos: Dict,
    variables_modelo: List
):

    recibidas = set(datos.keys())

    esperadas = set(variables_modelo)

    faltantes = list(
        esperadas - recibidas
    )

    adicionales = list(
        recibidas - esperadas
    )

    return {

        "ok":len(faltantes)==0 and len(adicionales)==0,

        "faltantes":sorted(faltantes),

        "adicionales":sorted(adicionales)

    }


PROVINCIAS = {
    1: "Azuay",
    2: "Bolívar",
    3: "Cañar",
    4: "Carchi",
    5: "Cotopaxi",
    6: "Chimborazo",
    7: "El Oro",
    8: "Esmeraldas",
    9: "Guayas",
    10: "Imbabura",
    11: "Loja",
    12: "Los Ríos",
    13: "Manabí",
    14: "Morona Santiago",
    15: "Napo",
    16: "Pastaza",
    17: "Pichincha",
    18: "Tungurahua",
    19: "Zamora Chinchipe",
    20: "Galápagos",
    21: "Sucumbíos",
    22: "Orellana",
    23: "Santo Domingo de los Tsáchilas",
    24: "Santa Elena",
    90: "Rural"
}