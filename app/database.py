import os
import sqlite3
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, ForeignKey, DateTime, Boolean, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

DB_FILE = "leadgen.db"
engine = create_engine(f"sqlite:///{DB_FILE}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="user")           # 'user' | 'admin'
    is_active = Column(Boolean, default=True)
    current_workspace_id = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")
    smtp_settings = relationship("SMTPSettings", back_populates="user", cascade="all, delete-orphan")
    dispatch_logs = relationship("EmailDispatchLog", back_populates="user")

class Workspace(Base):
    __tablename__ = "workspaces"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, index=True, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    sessions = relationship("SearchSession", back_populates="workspace", cascade="all, delete-orphan")
    leads = relationship("DBLead", back_populates="workspace", cascade="all, delete-orphan")
    smtp_settings = relationship("SMTPSettings", back_populates="workspace", cascade="all, delete-orphan")
    dispatch_logs = relationship("EmailDispatchLog", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, default="member")  # 'owner', 'admin', 'member'
    joined_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="memberships")

class SearchSession(Base):
    __tablename__ = "search_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    industry = Column(String, index=True)
    location = Column(String, index=True)
    max_results = Column(Integer)
    custom_icp_rules = Column(Text, nullable=True)
    seed_urls = Column(Text, nullable=True)
    dedup_filtered_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    leads = relationship("DBLead", back_populates="session", cascade="all, delete-orphan")
    workspace = relationship("Workspace", back_populates="sessions")

class DBLead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("search_sessions.id"), nullable=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    company_name = Column(String, index=True)
    website = Column(String, index=True)
    description = Column(Text)
    email = Column(String, index=True)
    phone = Column(String)
    location = Column(String)
    icp_fit_score = Column(Float)
    ai_insight = Column(Text)
    outreach_angle = Column(Text)
    confidence = Column(String, default="Verified")
    deliverability_status = Column(String, default="Valid")  # 'Verified', 'Valid', 'Risky', 'Invalid'
    deliverability_score = Column(Float, default=90.0)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    campaign_status = Column(String, default="uncontacted")  # 'uncontacted', 'contacted', 'bounced', 'replied', 'converted'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("SearchSession", back_populates="leads")
    workspace = relationship("Workspace", back_populates="leads")
    assigned_to = relationship("User", foreign_keys=[assigned_to_user_id])
    dispatch_logs = relationship("EmailDispatchLog", back_populates="lead", cascade="all, delete-orphan")

class SMTPSettings(Base):
    __tablename__ = "smtp_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    host = Column(String, default="smtp.gmail.com")
    port = Column(Integer, default=587)
    username = Column(String, default="")
    password = Column(String, default="")
    use_tls = Column(Boolean, default=True)
    use_ssl = Column(Boolean, default=False)
    from_name = Column(String, default="LeadGen Growth Team")
    from_email = Column(String, default="")
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="smtp_settings")
    workspace = relationship("Workspace", back_populates="smtp_settings")

class EmailDispatchLog(Base):
    __tablename__ = "email_dispatch_logs"

    id = Column(Integer, primary_key=True, index=True)
    workspace_id = Column(Integer, ForeignKey("workspaces.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=True)
    recipient_email = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    body = Column(Text, nullable=False)
    step_number = Column(Integer, default=1)  # 1, 2, 3
    tone = Column(String, default="Professional & Consultative")
    status = Column(String, default="sent")  # 'sent', 'simulated', 'failed'
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    workspace = relationship("Workspace", back_populates="dispatch_logs")
    user = relationship("User", back_populates="dispatch_logs")
    lead = relationship("DBLead", back_populates="dispatch_logs")

def auto_migrate():
    """Ensure newly added columns exist in existing SQLite database tables."""
    if not os.path.exists(DB_FILE):
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    columns_to_ensure = {
        "users": [
            ("current_workspace_id", "INTEGER"),
            ("role", "VARCHAR DEFAULT 'user'"),
            ("is_active", "INTEGER DEFAULT 1")
        ],
        "search_sessions": [
            ("workspace_id", "INTEGER"),
            ("user_id", "INTEGER"),
            ("custom_icp_rules", "TEXT"),
            ("seed_urls", "TEXT"),
            ("dedup_filtered_count", "INTEGER DEFAULT 0")
        ],
        "leads": [
            ("workspace_id", "INTEGER"),
            ("confidence", "VARCHAR DEFAULT 'Verified'"),
            ("deliverability_status", "VARCHAR DEFAULT 'Valid'"),
            ("deliverability_score", "FLOAT DEFAULT 90.0"),
            ("assigned_to_user_id", "INTEGER"),
            ("campaign_status", "VARCHAR DEFAULT 'uncontacted'"),
            ("created_at", "DATETIME")
        ]
    }

    for table_name, cols in columns_to_ensure.items():
        try:
            cursor.execute(f"PRAGMA table_info({table_name});")
            existing_cols = {row[1] for row in cursor.fetchall()}
            if existing_cols:
                for col_name, col_type in cols:
                    if col_name not in existing_cols:
                        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type};")
        except Exception as e:
            print(f"Migration notice for {table_name}: {e}")

    conn.commit()
    conn.close()

# ── Admin credentials ─────────────────────────────────────────────────────────
ADMIN_EMAIL    = "superadmin@leadgen.ai"
ADMIN_PASSWORD = "LG$Nexus2026!#"

def seed_admin_user():
    """Create the superadmin account if it doesn't already exist."""
    import hashlib, binascii, os as _os
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()
        if existing:
            # Ensure the role is still admin (in case of manual reset)
            if existing.role != "admin":
                existing.role = "admin"
                db.commit()
            return
        salt = hashlib.sha256(_os.urandom(60)).hexdigest().encode('ascii')
        pwdhash = hashlib.pbkdf2_hmac('sha256', ADMIN_PASSWORD.encode('utf-8'), salt, 100_000)
        hashed = (salt + binascii.hexlify(pwdhash)).decode('ascii')
        admin = User(
            name="Platform Superadmin",
            email=ADMIN_EMAIL,
            hashed_password=hashed,
            role="admin",
            is_active=True
        )
        db.add(admin)
        db.commit()
        print(f"[LeadGen] Superadmin seeded → {ADMIN_EMAIL}")
    except Exception as e:
        print(f"[LeadGen] Admin seed error: {e}")
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    auto_migrate()
    seed_admin_user()