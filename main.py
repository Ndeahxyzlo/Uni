from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="FinTech Nova - Motor de Riesgo", description="API de evaluacion de riesgo crediticio", version="1.0.0")

class SolicitudCredito(BaseModel):
    edad: int
    ingresos: float
    deudas: float

@app.get("/status")
def get_status():
    return {"estado": "Operacional", "servidor": "Nodo-01"}

@app.post("/evaluar-riesgo")
def evaluar_riesgo(solicitud: SolicitudCredito):
    score = solicitud.ingresos - solicitud.deudas
    if solicitud.edad < 18:
        resultado = "Rechazado (Menor de edad)"
    elif score > 1000:
        resultado = "Aprobado"
    else:
        resultado = "En Revision"
    return {"resultado": resultado, "score_simulado": score}

@app.get("/datos-financieros/{id_cliente}")
def obtener_historial(id_cliente: int):
    return {"cliente_id": id_cliente, "historial": "Limpio", "score_interno": 750}
