"""
Regenera un split train/test reproducible a partir del dataset sin fuga.
Reemplaza los train.csv/test.csv actuales, que están corruptos.
"""
import pandas as pd
from sklearn.model_selection import train_test_split

from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import OUTPUT_DIR, RANDOM_STATE, TARGET_COL, TEST_SIZE


def make_split():
    df = build_clean_dataset()
    X = df.drop(columns=[TARGET_COL])
    y = df[TARGET_COL]
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE, stratify=y
    )
    train_df = pd.concat([X_train, y_train], axis=1)
    test_df = pd.concat([X_test, y_test], axis=1)
    return train_df, test_df


if __name__ == "__main__":
    train_df, test_df = make_split()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    train_df.to_csv(OUTPUT_DIR / "train_v2.csv", index=False)
    test_df.to_csv(OUTPUT_DIR / "test_v2.csv", index=False)
    print(f"train_v2.csv: {train_df.shape}")
    print(f"test_v2.csv: {test_df.shape}")
