# pipeline_v2/tests/test_split_dataset.py
from pipeline_v2.build_clean_dataset import build_clean_dataset
from pipeline_v2.split_dataset import make_split
from pipeline_v2.paths import TARGET_COL


def test_split_sizes_match_source():
    total = len(build_clean_dataset())
    train_df, test_df = make_split()
    assert len(train_df) + len(test_df) == total


def test_no_row_overlap_between_splits():
    train_df, test_df = make_split()
    train_keys = set(map(tuple, train_df.astype(str).values))
    test_keys = set(map(tuple, test_df.astype(str).values))
    assert train_keys.isdisjoint(test_keys)


def test_zero_null_targets_in_both_splits():
    train_df, test_df = make_split()
    assert train_df[TARGET_COL].isna().sum() == 0
    assert test_df[TARGET_COL].isna().sum() == 0


def test_stratification_preserves_class_ratio():
    train_df, test_df = make_split()
    ratio_train = train_df[TARGET_COL].mean()
    ratio_test = test_df[TARGET_COL].mean()
    assert abs(ratio_train - ratio_test) < 0.02
