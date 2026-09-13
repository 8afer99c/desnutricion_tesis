# pipeline_v2/tests/test_build_clean_dataset.py
from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.paths import TARGET_COL


def test_no_nulls_in_target():
    df = build_clean_dataset()
    assert df[TARGET_COL].isna().sum() == 0


def test_expected_row_count():
    df = build_clean_dataset()
    assert len(df) == 18493  # 20510 filas originales - 2017 con target sin medir


def test_class_balance_after_fix():
    df = build_clean_dataset()
    counts = df[TARGET_COL].value_counts()
    assert counts[0.0] == 13933
    assert counts[1.0] == 4560


def test_positive_rate_increases_after_removing_fabricated_negatives():
    df = build_clean_dataset()
    tasa = df[TARGET_COL].mean()
    assert tasa > 0.24  # antes de la corrección era 0.2223 (diluida por los 0 fabricados)
