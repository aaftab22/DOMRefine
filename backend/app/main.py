from fastapi import FastAPI
from app.api.audit import router
from fastapi.middleware.cors import CORSMiddleware
from app.database.db import Base, engine
from app.models.audit_model import Audit
app = FastAPI()

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://dom-refine-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {"message": "DOMRefiner API is running!"}