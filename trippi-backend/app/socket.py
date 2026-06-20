import socketio

sio = socketio.AsyncServer(
    async_mode = "asgi",
    cors_allowed_origins=["http://localhost:5173", "http://127.0.0.1:5173", "https://trippi-project-front.onrender.com", "http://localhost:9010", "http://127.0.0.1:9010"],
)

@sio.event
async def join_trip(sid, trip_id):
    await sio.enter_room(sid, trip_id)

@sio.event
async def leave_trip(sid, trip_id):
    await sio.leave_room(sid, trip_id)