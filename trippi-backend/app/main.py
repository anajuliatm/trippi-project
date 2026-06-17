from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router
from app.routes.user import router as user_router
from app.routes.trip import router as trip_router
from app.routes.itinerary import router as itinerary_router
from app.routes.finance import router as finance_router
from app.routes.payment import router as payment_router
from app.routes.trip_member import router as trip_member_router
from app.socket import sio
import socketio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://trippi-project-front.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(user_router)
app.include_router(trip_router)
app.include_router(itinerary_router)
app.include_router(finance_router)
app.include_router(payment_router)
app.include_router(trip_member_router)

@app.get("/")
def root():
    return {"message": "Trippi API funcionando"}

socket_app = socketio.ASGIApp(sio, other_asgi_app=app)