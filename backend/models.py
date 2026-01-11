from typing import Optional
from sqlmodel import Field, SQLModel, create_engine, Session, select, UniqueConstraint
import uuid
from datetime import datetime, timedelta

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    callback_url: Optional[str] = None  # 新增：回调地址
    app_id: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True, index=True)
    app_secret: str = Field(default_factory=lambda: str(uuid.uuid4()))

class UserAuth(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("app_id", "user_id", name="unique_app_user"),) # 数据库层面的唯一性约束
    
    id: Optional[int] = Field(default=None, primary_key=True)
    app_id: str = Field(index=True)
    user_id: str = Field(index=True)
    totp_secret: Optional[str] = None
    is_totp_enabled: bool = Field(default=False)
    wechat_id: Optional[str] = None
    is_wechat_enabled: bool = Field(default=False)

class AuthToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    token: str = Field(index=True, unique=True)
    app_id: str = Field(index=True)
    user_id: str = Field(index=True)
    expires_at: datetime
    is_used: bool = Field(default=False)

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

# check_same_thread=False is needed for SQLite with FastAPI
connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, echo=False, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session