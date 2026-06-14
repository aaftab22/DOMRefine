from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.database.db import Base

class Audit(Base):
    __tablename__ = "audits"

    id = Column(Integer, primary_key=True)
    url = Column(String, nullable=False)

    audit_json = Column(JSONB, nullable=False)
    ai_analysis = Column(JSONB)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )


