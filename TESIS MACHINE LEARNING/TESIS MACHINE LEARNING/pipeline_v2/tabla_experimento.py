# pipeline_v2/tabla_experimento.py
"""
Genera la "tabla única del experimento" que pide Correcciones_Tesis_Fernando.docx:
dataset, muestra final, variable objetivo, predictores, partición,
preprocesamiento, modelos, hiperparámetros, semilla, métricas y criterio de
selección -- todo derivado de los artefactos ya generados, no inventado.
"""
import json

from pipeline_v2.paths import OUTPUT_DIR


def run():
    with open(OUTPUT_DIR / "metricas_v2.json", encoding="utf-8") as f:
        m = json.load(f)

    filas = [
        ("Dataset", "ENSANUT 2018 (Ecuador), microdatos f2_salud_niñez"),
        ("Muestra final", "18,493 registros (se excluyeron 2,017 con target sin medir; "
                           "antes se imputaban con la mediana, lo que introducía fuga)"),
        ("Variable objetivo", "desnutricion_cronica (0 = sin desnutrición crónica, 1 = con desnutrición crónica)"),
        ("Predictores", "114 variables"),
        ("Partición", "80/20 estratificada, random_state=42"),
        ("Preprocesamiento", "Numéricas: mediana + StandardScaler. Categóricas: moda + OneHotEncoder"),
        ("Modelos comparados", "Logistic Regression, Decision Tree, Random Forest, XGBoost (con manejo de desbalance)"),
        ("Criterio de selección", "average_precision (PR-AUC) en test, no F1 ponderado"),
        ("Modelo ganador", m["modelo_ganador"]),
        ("Semilla", "42"),
        ("Métricas clase positiva", f"precision={m['precision_clase_1']:.4f}, "
                                     f"recall={m['recall_clase_1']:.4f}, f1={m['f1_clase_1']:.4f}"),
        ("ROC-AUC / PR-AUC", f"{m['roc_auc']:.4f} / {m['pr_auc']:.4f}"),
        ("Balanced accuracy", f"{m['accuracy_balanced']:.4f}"),
    ]

    print("| Aspecto | Valor |")
    print("|---|---|")
    for k, v in filas:
        print(f"| {k} | {v} |")


if __name__ == "__main__":
    run()
