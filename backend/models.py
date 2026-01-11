from typing import Optional
from sqlmodel import Field, SQLModel, create_engine, Session, select
import uuid

class Application(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True)
    description: Optional[str] = None
    app_id: str = Field(default_factory=lambda: str(uuid.uuid4()), unique=True, index=True)
    app_secret: str = Field(default_factory=lambda: str(uuid.uuid4()))

class UserAuth(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    app_id: str = Field(index=True)
    user_id: str = Field(index=True)  # External system's user ID
    totp_secret: Optional[str] = None
    is_totp_enabled: bool = Field(default=False)
    wechat_id: Optional[str] = None
    is_wechat_enabled: bool = Field(default=False)

sqlite_file_name = "database.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
