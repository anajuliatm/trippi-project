from fastapi import FastAPI
from app.routes.user import router as user_router
from app.routes.trip import router as trip_router
from app.routes.itinerary import router as itinerary_router

app = FastAPI()

app.include_router(user_router)
app.include_router(trip_router)
app.include_router(itinerary_router)

@app.get("/")
def root():
    return {"message": "Trippi API funcionando"}