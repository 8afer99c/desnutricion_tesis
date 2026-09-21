from app.main import example
from app.predictor import Predictor


def test_example_devuelve_la_plantilla_con_las_114_variables():
    # En main el endpoint perdio su return y respondia null. Se llama a la funcion
    # directamente para no depender del prefijo de rutas (/example o /api/example).
    plantilla = example()
    assert isinstance(plantilla, dict)
    assert set(plantilla) == set(Predictor.features())
    assert len(plantilla) == 114
    assert all(valor is None for valor in plantilla.values())
