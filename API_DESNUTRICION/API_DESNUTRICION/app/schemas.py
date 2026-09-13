from pydantic import BaseModel
from typing import Dict, Any
from pydantic import RootModel
from typing import Dict, Any


class PrediccionResponse(BaseModel):

    prediccion: int

    descripcion: str

    probabilidad: float

    riesgo: str