from fastapi import FastAPI, Depends, HTTPException, Body
from sqlmodel import Session, select
from typing import List, Optional
from models import Application, UserAuth, AuthToken, create_db_and_tables, get_session, engine
from totp import generate_totp_secret, get_totp_uri, verify_totp_code, generate_qr_code_base64
from pydantic import BaseModel
import uuid
from datetime import datetime, timedelta

app = FastAPI(title="Ashpaw 2FA Service")

@app.on_event("startup")
def on_startup():
    create_db_and_tables()

# Schema for requests
class AppCreate(BaseModel):
    name: str
    description: str = ""
    callback_url: str = ""

class AppUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    callback_url: Optional[str] = None

class VerifyRequest(BaseModel):
    code: str

class TokenValidateRequest(BaseModel):
    token: str
    # 在生产环境中，这里还应该包含 app_secret 或通过 Header 传递签名来验证调用者身份

# Admin Routes
@app.post("/apps", response_model=Application)
def create_app(app_data: AppCreate, session: Session = Depends(get_session)):
    db_app = Application(
        name=app_data.name, 
        description=app_data.description,
        callback_url=app_data.callback_url
    )
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    return db_app

@app.get("/apps", response_model=List[Application])
def list_apps(session: Session = Depends(get_session)):
    return session.exec(select(Application)).all()

@app.get("/apps/{app_id}", response_model=Application)
def get_app(app_id: str, session: Session = Depends(get_session)):
    app = session.exec(select(Application).where(Application.app_id == app_id)).first()
    if not app:
        raise HTTPException(status_code=404, detail="App not found")
    return app

@app.put("/apps/{app_id}", response_model=Application)
def update_app(app_id: str, app_data: AppUpdate, session: Session = Depends(get_session)):
    db_app = session.exec(select(Application).where(Application.app_id == app_id)).first()
    if not db_app:
        raise HTTPException(status_code=404, detail="Application not found")
    
    if app_data.name is not None:
        db_app.name = app_data.name
    if app_data.description is not None:
        db_app.description = app_data.description
    if app_data.callback_url is not None:
        db_app.callback_url = app_data.callback_url
        
    session.add(db_app)
    session.commit()
    session.refresh(db_app)
    return db_app

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
    # 1. 验证应用
    app_obj = session.exec(select(Application).where(Application.app_id == app_id)).first()
    if not app_obj:
        raise HTTPException(status_code=404, detail="Application not found")

    # 2. 验证用户和 TOTP
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth or not user_auth.totp_secret:
        raise HTTPException(status_code=400, detail="2FA not set up")
    
    if verify_totp_code(user_auth.totp_secret, data.code):
        # 激活状态（如果是首次）
        if not user_auth.is_totp_enabled:
            user_auth.is_totp_enabled = True
            session.add(user_auth)
            session.commit()
        
        # 3. 生成一次性 Token
        token = str(uuid.uuid4())
        auth_token = AuthToken(
            token=token,
            app_id=app_id,
            user_id=user_id,
            expires_at=datetime.utcnow() + timedelta(minutes=5) # 5分钟有效期
        )
        session.add(auth_token)
        session.commit()

        # 4. 构建回调 URL
        redirect_url = None
        if app_obj.callback_url:
            separator = "&" if "?" in app_obj.callback_url else "?"
            redirect_url = f"{app_obj.callback_url}{separator}token={token}"

        return {
            "status": "success",
            "redirect_url": redirect_url
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid verification code")

@app.post("/auth/bind-wechat/{app_id}/{user_id}")
def bind_wechat(app_id: str, user_id: str, session: Session = Depends(get_session)):
    user_auth = session.exec(select(UserAuth).where(UserAuth.app_id == app_id, UserAuth.user_id == user_id)).first()
    if not user_auth:
        user_auth = UserAuth(app_id=app_id, user_id=user_id)
    
    user_auth.wechat_id = f"wx_{user_id}" 
    user_auth.is_wechat_enabled = True
    session.add(user_auth)
    session.commit()
    return {"status": "success", "wechat_id": user_auth.wechat_id}

@app.post("/auth/validate-token")
def validate_token(data: TokenValidateRequest, session: Session = Depends(get_session)):
    """
    业务系统后端调用的接口，用于交换 token 获取用户信息。
    """
    token_entry = session.exec(select(AuthToken).where(AuthToken.token == data.token)).first()
    
    if not token_entry:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    if token_entry.is_used:
        raise HTTPException(status_code=400, detail="Token already used")
        
    if token_entry.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Token expired")
    
    # 标记为已使用
    token_entry.is_used = True
    session.add(token_entry)
    session.commit()
    
    return {
        "status": "valid",
        "app_id": token_entry.app_id,
        "user_id": token_entry.user_id
    }
