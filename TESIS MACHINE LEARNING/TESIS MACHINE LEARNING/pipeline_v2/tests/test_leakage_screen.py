from pipeline_v2.leakage_screen import run


def test_leakage_screen_runs_and_returns_a_list():
    resultado = run()
    assert isinstance(resultado, list)
    for nombre_columna, auc in resultado:
        assert isinstance(nombre_columna, str)
        assert 0.0 <= auc <= 1.0
