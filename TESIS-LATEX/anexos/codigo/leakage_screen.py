"""
Detector barato de posible fuga: mide el AUC de predecir el target usando
CADA variable por separado. Un AUC > 0.95 con una sola variable es sospechoso
y merece revisión manual (puede ser fuga, o puede ser una variable
legítimamente muy predictiva -- este script no decide, solo señala).
"""
from sklearn.metrics import roc_auc_score
from sklearn.preprocessing import OrdinalEncoder

from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import TARGET_COL

UMBRAL = 0.95


def run():
    df = build_clean_dataset()
    y = df[TARGET_COL]
    X = df.drop(columns=[TARGET_COL])

    sospechosas = []
    omitidas = []
    for columna in X.columns:
        serie = X[columna]
        try:
            if serie.dtype == object or str(serie.dtype) == "category":
                codificador = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
                valores = codificador.fit_transform(serie.astype(str).values.reshape(-1, 1)).ravel()
            else:
                valores = serie.fillna(serie.median()).values
            auc = roc_auc_score(y, valores)
            auc = max(auc, 1 - auc)  # AUC sin importar la dirección de la relación
        except Exception:
            omitidas.append(columna)
            continue
        if auc > UMBRAL:
            sospechosas.append((columna, auc))

    print(f"Columnas evaluadas: {len(X.columns) - len(omitidas)}/{len(X.columns)}", end="")
    if omitidas:
        print(f" (omitidas: {len(omitidas)} - {omitidas})")
    else:
        print(" (omitidas: 0)")

    sospechosas.sort(key=lambda t: -t[1])
    if sospechosas:
        print(f"Variables con AUC univariado > {UMBRAL} (revisar manualmente):")
        for columna, auc in sospechosas:
            print(f"  {columna}: AUC={auc:.4f}")
    else:
        print(f"Ninguna variable supera AUC={UMBRAL} por sí sola -- sin señales obvias de fuga directa.")
    return sospechosas


if __name__ == "__main__":
    run()
