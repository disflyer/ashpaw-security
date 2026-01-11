import pyotp
import qrcode
import io
import base64

def generate_totp_secret():
    return pyotp.random_base32()

def get_totp_uri(secret, user_id, issuer_name="Ashpaw2FA"):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=user_id, issuer_name=issuer_name)

def verify_totp_code(secret, code):
    totp = pyotp.totp.TOTP(secret)
    return totp.verify(code)

def generate_qr_code_base64(uri):
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    return base64.b64encode(buffered.getvalue()).decode()
