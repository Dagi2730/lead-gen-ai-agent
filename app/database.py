import os
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DB_FILE = "leadgen.db"
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class SearchSession(Base):
    __tablename__ = "search_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    industry = Column(String, index=True)
    location = Column(String, index=True)
    max_results = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    leads = relationship("DBLead", back_populates="session", cascade="all, delete-orphan")

class DBLead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("search_sessions.id"))
    company_name = Column(String)
    website = Column(String)
    description = Column(Text)
    email = Column(String)
    phone = Column(String)
    location = Column(String)
    icp_fit_score = Column(Float)
    ai_insight = Column(Text)
    outreach_angle = Column(Text)
    
    session = relationship("SearchSession", back_populates="leads")

def init_db():
    Base.metadata.create_all(bind=engine)