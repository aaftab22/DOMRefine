from fastapi import FastAPI
from app.api.audit import router

app = FastAPI()

app.include_router(router)

@app.get("/")
def root():
    return {"message": "DOMRefiner API is running!"}