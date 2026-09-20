def build_preprocessor(X):
    numericas = X.select_dtypes(include=["int64", "float64"]).columns.tolist()
    categoricas = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

    # Tripwire: ColumnTransformer usa remainder="drop", así que cualquier
    # columna con un dtype no cubierto por las dos listas de arriba (int32,
    # dtypes nullable de pandas, datetime, etc.) desaparecería en silencio del
    # modelo. Preferimos fallar ruidosamente a entrenar con menos variables de
    # las declaradas en la tesis.
    assert len(numericas) + len(categoricas) == X.shape[1], (
        "hay columnas con dtype no cubierto: "
        f"{sorted(set(X.columns) - set(numericas) - set(categoricas))}"
    )

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
    # Mismo StratifiedKFold explícito y sembrado que usa la búsqueda de
    # hiperparámetros de XGBoost, para que ambas validaciones cruzadas del
    # script sean consistentes y reproducibles.
    particion = StratifiedKFold(n_splits=cv, shuffle=True, random_state=RANDOM_STATE)
    with parallel_backend("threading"):
        probas_oof = cross_val_predict(
            pipeline, X_train, y_train, cv=particion, method="predict_proba", n_jobs=-1
        )[:, 1]
    mejor_umbral, mejor_f1 = 0.5, -1.0
    for umbral in np.arange(0.05, 0.95, 0.01):
        preds = (probas_oof >= umbral).astype(int)
        f1 = f1_score(y_train, preds, pos_label=1, zero_division=0)
        if f1 > mejor_f1:
            mejor_umbral, mejor_f1 = float(umbral), f1
    # np.arange acumula error de punto flotante (0.23000000000000004); el
    # umbral se guarda como artefacto y se propaga a la API, así que se
    # redondea a un valor limpio.
    return round(float(mejor_umbral), 4)


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


