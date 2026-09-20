# pipeline_v2/build_clean_dataset.py
"""
Corrige la fuga de datos de LIMPIEZA.ipynb: en vez de imputar con la mediana
los valores faltantes del target "Desnutrición crónica" (lo que fabricaba
~2,017 etiquetas falsas, todas como clase 0), se eliminan esas filas.

Usa alineación posicional entre ENSANUT_CORREGIDO.csv (crudo, con NaN reales
en el target) y ENSANUT_MODELO.csv (renombrado e imputado, el que alimenta el
entrenamiento) porque los diccionarios .ods de renombrado solo existían en
Colab y no están disponibles localmente para re-derivar todo desde cero.

Verificado 2026-09-12: donde el target de ENSANUT_CORREGIDO no es nulo,
coincide al 100% (18,493/18,493) con el target de ENSANUT_MODELO -> el orden
de filas se preserva de punta a punta en el pipeline original.
"""
import pandas as pd

from pipeline_v2.paths import ENSANUT_CORREGIDO_PATH, ENSANUT_MODELO_PATH, TARGET_COL


def _find_target_column_cruda(columns):
    candidatas = [c for c in columns if "esnutric" in c and "r" in c.lower()]
    if len(candidatas) != 1:
        raise ValueError(f"Se esperaba 1 columna de target en el CSV crudo, se encontraron: {candidatas}")
    return candidatas[0]


def build_clean_dataset() -> pd.DataFrame:
    corregido = pd.read_csv(ENSANUT_CORREGIDO_PATH, low_memory=False)
    modelo = pd.read_csv(ENSANUT_MODELO_PATH, low_memory=False)

    if len(corregido) != len(modelo):
        raise AssertionError(
            f"Descuadre de filas: CORREGIDO tiene {len(corregido)}, MODELO tiene {len(modelo)}. "
            "El supuesto de alineación posicional ya no es válido -- no continuar."
        )

    columna_target_cruda = _find_target_column_cruda(corregido.columns)
    target_original = corregido[columna_target_cruda].reset_index(drop=True)
    mascara_valida = target_original.notna()

    modelo = modelo.reset_index(drop=True)

    # Verificación de alineación antes de confiar en la máscara.
    target_modelo_donde_valido = modelo.loc[mascara_valida, TARGET_COL].astype(float)
    target_crudo_donde_valido = target_original[mascara_valida].astype(float)
    tasa_coincidencia = (target_modelo_donde_valido.values == target_crudo_donde_valido.values).mean()
    if tasa_coincidencia < 1.0:
        raise AssertionError(
            f"Falló la verificación de alineación: solo {tasa_coincidencia:.4%} de las filas "
            "coinciden entre CORREGIDO y MODELO. No confiar en el enmascarado posicional."
        )

    return modelo.loc[mascara_valida].reset_index(drop=True)


if __name__ == "__main__":
    from pipeline_v2.paths import OUTPUT_DIR

    df = build_clean_dataset()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "ENSANUT_MODELO_v2.csv"
    df.to_csv(out_path, index=False)
    print(f"Filas originales (v1): 20510")
    print(f"Filas eliminadas (target sin medir en origen): {20510 - len(df)}")
    print(f"Filas finales (v2): {len(df)}")
    print(df[TARGET_COL].value_counts(normalize=True))
    print(f"Guardado en: {out_path}")
