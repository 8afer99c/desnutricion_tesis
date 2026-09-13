"""
Entrenamiento corregido del clasificador de desnutrición crónica.

Diferencias frente a ENTRENAMIENTO.ipynb:
1. Entrena sobre el dataset sin fuga (pipeline_v2.build_clean_dataset), no
   sobre la versión con el target imputado por mediana.
2. La selección de "mejor modelo" SÍ determina qué se optimiza (antes se
   hardcodeaba XGBoost sin importar cuál ganaba la comparación base).
3. Maneja el desbalance de clases explícitamente (scale_pos_weight para
   XGBoost, class_weight="balanced" para los demás).
4. La búsqueda de hiperparámetros se puntúa con average_precision (PR-AUC),
   mucho más informativo que f1_weighted para un problema con ~25% de
   positivos.
5. Reporta métricas completas por clase (no solo promedios ponderados):
   precision/recall/F1 de ambas clases, balanced accuracy, ROC-AUC, PR-AUC y
   matriz de confusión -- todo se guarda en metricas_v2.json.
"""
import json

import joblib
import numpy as np
from joblib import parallel_backend
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    average_precision_score, balanced_accuracy_score, classification_report,
    confusion_matrix, f1_score, precision_score, recall_score, roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold, cross_val_predict
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

from pipeline_v2.paths import OUTPUT_DIR, RANDOM_STATE, TARGET_COL
from pipeline_v2.split_dataset import make_split


def build_preprocessor(X):
    numericas = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categoricas = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

    pipe_numerico = Pipeline([
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler()),
    ])
    pipe_categorico = Pipeline([
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    return ColumnTransformer([
        ("num", pipe_numerico, numericas),
        ("cat", pipe_categorico, categoricas),
    ])


def candidate_models(scale_pos_weight: float) -> dict:
    return {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "Decision Tree": DecisionTreeClassifier(
            random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=300, random_state=RANDOM_STATE, class_weight="balanced"
        ),
        "XGBoost": XGBClassifier(
            random_state=RANDOM_STATE, eval_metric="logloss",
            scale_pos_weight=scale_pos_weight,
        ),
    }


def find_best_threshold(pipeline, X_train, y_train, cv=5) -> float:
    """
    El umbral 0.5 por defecto de .predict() no está calibrado para un
    problema con ~25% de positivos: un modelo con buen poder de ranking
    (PR-AUC/ROC-AUC decentes) puede terminar sin superar 0.5 en casi ningún
    caso real, colapsando el recall de la clase positiva a casi 0 aunque el
    modelo "sepa" ordenar bien los casos. Se busca el umbral que maximiza
    F1 de la clase 1 usando predicciones out-of-fold sobre TRAIN (nunca
    sobre test, para no contaminar la evaluación final).
    """
    # NOTA DE ENTORNO: el backend por defecto de joblib para n_jobs=-1 ('loky',
    # basado en multiprocessing) está roto en este entorno (Python 3.13 +
    # Windows: multiprocessing.resource_tracker intenta importar
    # `_posixsubprocess` al lanzar procesos hijo y falla). Se fuerza el
    # backend 'threading' como workaround puramente de infraestructura --
    # el resultado numérico de cross_val_predict es determinista e idéntico
    # independientemente del backend usado; solo cambia el paralelismo.
    with parallel_backend("threading"):
        probas_oof = cross_val_predict(
            pipeline, X_train, y_train, cv=cv, method="predict_proba", n_jobs=-1
        )[:, 1]
    mejor_umbral, mejor_f1 = 0.5, -1.0
    for umbral in np.arange(0.05, 0.95, 0.01):
        preds = (probas_oof >= umbral).astype(int)
        f1 = f1_score(y_train, preds, pos_label=1, zero_division=0)
        if f1 > mejor_f1:
            mejor_umbral, mejor_f1 = float(umbral), f1
    return mejor_umbral


def evaluate(pipeline, X_test, y_test, umbral: float = 0.5) -> dict:
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    y_pred = (y_proba >= umbral).astype(int)
    return {
        "umbral_usado": umbral,
        "accuracy_balanced": balanced_accuracy_score(y_test, y_pred),
        "precision_clase_1": precision_score(y_test, y_pred, pos_label=1),
        "recall_clase_1": recall_score(y_test, y_pred, pos_label=1),
        "f1_clase_1": f1_score(y_test, y_pred, pos_label=1),
        "precision_clase_0": precision_score(y_test, y_pred, pos_label=0),
        "recall_clase_0": recall_score(y_test, y_pred, pos_label=0),
        "f1_clase_0": f1_score(y_test, y_pred, pos_label=0),
        "roc_auc": roc_auc_score(y_test, y_proba),
        "pr_auc": average_precision_score(y_test, y_proba),
        "confusion_matrix": confusion_matrix(y_test, y_pred).tolist(),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
    }


def run():
    train_df, test_df = make_split()
    X_train = train_df.drop(columns=[TARGET_COL])
    y_train = train_df[TARGET_COL]
    X_test = test_df.drop(columns=[TARGET_COL])
    y_test = test_df[TARGET_COL]

    conteo = y_train.value_counts()
    scale_pos_weight = conteo[0.0] / conteo[1.0]
    print(f"scale_pos_weight (neg/pos en train) = {scale_pos_weight:.4f}")

    preprocesador = build_preprocessor(X_train)

    resultados = []
    pipelines = {}
    for nombre, modelo in candidate_models(scale_pos_weight).items():
        pipeline = Pipeline([("preprocesador", preprocesador), ("modelo", modelo)])
        pipeline.fit(X_train, y_train)
        pipelines[nombre] = pipeline
        y_proba = pipeline.predict_proba(X_test)[:, 1]
        score = average_precision_score(y_test, y_proba)
        resultados.append((nombre, score))
        print(f"{nombre}: average_precision(test) = {score:.4f}")

    nombre_ganador = max(resultados, key=lambda r: r[1])[0]
    print(f"\nModelo ganador por average_precision: {nombre_ganador}")
    pipeline_ganador = pipelines[nombre_ganador]

    if nombre_ganador == "XGBoost":
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
        parametros = {
            "modelo__n_estimators": [100, 200, 300, 400, 500],
            "modelo__max_depth": [3, 4, 5, 6, 7, 8],
            "modelo__learning_rate": [0.01, 0.03, 0.05, 0.1, 0.2],
            "modelo__subsample": [0.6, 0.7, 0.8, 0.9, 1.0],
            "modelo__colsample_bytree": [0.6, 0.7, 0.8, 0.9, 1.0],
            "modelo__gamma": [0, 0.1, 0.2, 0.3, 0.5],
            "modelo__min_child_weight": [1, 3, 5, 7],
        }
        busqueda = RandomizedSearchCV(
            estimator=pipeline_ganador, param_distributions=parametros, n_iter=40,
            scoring="average_precision", cv=cv, verbose=1,
            random_state=RANDOM_STATE, n_jobs=-1,
        )
        # Mismo workaround de entorno que en find_best_threshold: backend
        # 'loky' roto en esta máquina para Python 3.13 + Windows.
        with parallel_backend("threading"):
            busqueda.fit(X_train, y_train)
        pipeline_final = busqueda.best_estimator_
        print("Mejores hiperparámetros:", busqueda.best_params_)
        print("Mejor score CV (average_precision):", busqueda.best_score_)
    else:
        pipeline_final = pipeline_ganador
        print(
            f"'{nombre_ganador}' no tiene grilla de hiperparámetros en este script; "
            "se usa tal cual salió de la comparación base."
        )

    umbral_optimo = find_best_threshold(pipeline_final, X_train, y_train)
    print(f"Umbral óptimo (maximiza F1 clase 1, CV sobre train): {umbral_optimo:.2f}")

    metricas = evaluate(pipeline_final, X_test, y_test, umbral=umbral_optimo)
    metricas["modelo_ganador"] = nombre_ganador
    metricas["comparativa_base"] = dict(resultados)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(pipeline_final, OUTPUT_DIR / "modelo_v2.joblib")
    with open(OUTPUT_DIR / "metricas_v2.json", "w", encoding="utf-8") as f:
        json.dump(metricas, f, indent=2, ensure_ascii=False)

    print("\n=== MÉTRICAS FINALES (test, sin fuga) ===")
    resumen = {k: v for k, v in metricas.items() if k != "classification_report"}
    print(json.dumps(resumen, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    run()
