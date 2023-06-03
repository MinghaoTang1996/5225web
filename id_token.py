import jwt

id_token = "id_token"
payload = jwt.decode(id_token, options={"verify_signature": False})

print(payload["sub"])