from fastapi import FastAPI, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from models import Application, UserAuth, create_db_and_tables, get_session, engine
from totp import generate_totp_secret, get_totp_uri, verify_totp_code, generate_qr_code_base64
from pydantic import BaseModel

app = FastAPI(title="Ashpaw 2FA Service")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Schema for requests
class AppCreate(BaseModel):
    name: str
    description: str = ""

class VerifyRequest(BaseModel):
    code: str

# Admin Routes
@app.post("/apps", response_model=Application)
def create_app(app_data: AppCreate, session: Session = Depends(get_session)):
    db_app = Application(name=app_data.name, description=app_data.description)
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    return db_app

@app.get("/apps", response_model=List[Application])
def list_apps(session: Session = Depends(get_session)):
    return session.exec(select(Application)).all()

@app.get("/apps/{app_id}/users", response_model=List[UserAuth])
def list_app_users(app_id: str, session: Session = Depends(get_session)):
    return session.exec(select(UserAuth).where(UserAuth.app_id == app_id)).all()

@app.delete("/apps/{app_id}/users/{user_id}")
def reset_user_auth(app_id: str, user_id: str, session: Session = Depends(get_session)):
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if user_auth:
        session.delete(user_auth)
        session.commit()
    return {"message": "User 2FA reset successful"}

# User/Auth Routes
@app.get("/auth/status/{app_id}/{user_id}")
def get_auth_status(app_id: str, user_id: str, session: Session = Depends(get_session)):
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth:
        return {"is_totp_enabled": False, "is_wechat_enabled": False}
    return {
        "is_totp_enabled": user_auth.is_totp_enabled,
        "is_wechat_enabled": user_auth.is_wechat_enabled,
        "wechat_id": user_auth.wechat_id
    }

@app.post("/auth/setup/{app_id}/{user_id}")
def setup_totp(app_id: str, user_id: str, session: Session = Depends(get_session)):
    # Check if app exists
    app_obj = session.exec(select(Application).where(Application.app_id == app_id)).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth:
        user_auth = UserAuth(app_id=app_id, user_id=user_id)
        session.add(user_auth)
    
    if not user_auth.totp_secret:
        user_auth.totp_secret = generate_totp_secret()
        session.add(user_auth)
        session.commit()
        session.refresh(user_auth)
    
    uri = get_totp_uri(user_auth.totp_secret, user_id, issuer_name=app_obj.name)
    qr_code = generate_qr_code_base64(uri)
    
    return {"secret": user_auth.totp_secret, "qr_code": qr_code}

@app.post("/auth/verify/{app_id}/{user_id}")
def verify_auth(app_id: str, user_id: str, data: VerifyRequest, session: Session = Depends(get_session)):
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth or not user_auth.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    if verify_totp_code(user_auth.totp_secret, data.code):
        if not user_auth.is_totp_enabled:
            user_auth.is_totp_enabled = True
            session.add(user_auth)
            session.commit()
        return {"status": "success"}
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@app.post("/auth/bind-wechat/{app_id}/{user_id}")
def bind_wechat(app_id: str, user_id: str, session: Session = Depends(get_session)):
    # This is a placeholder for WeChat OAuth binding
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth:
        user_auth = UserAuth(app_id=app_id, user_id=user_id)
    
    user_auth.wechat_id = f"wx_{user_id}" # Mock ID
    user_auth.is_wechat_enabled = True
    session.add(user_auth)
    session.commit()
    return {"status": "success", "wechat_id": user_auth.wechat_id}