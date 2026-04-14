from datetime import datetime, timedelta
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_DEV_SECRET_KEY = "remotein-dev-secret-key-change-me"
SECRET_KEY = os.getenv("SECRET_KEY", DEFAULT_DEV_SECRET_KEY)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 hari

if not isinstance(SECRET_KEY, str) or not SECRET_KEY.strip():
    raise RuntimeError("SECRET_KEY harus berupa string non-kosong.")

SECRET_KEY = SECRET_KEY.strip()

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
