from functools import wraps
from datetime import datetime, timezone
from typing import Callable, ParamSpec, TypeVar
from uuid import UUID

import jwt
from flask import current_app, jsonify, request

from extensions import db
from models.user import User

P = ParamSpec("P")
R = TypeVar("R")


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + current_app.config["JWT_EXPIRES_IN"]
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": expires_at,
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def get_current_user() -> User | None:
    token = extract_bearer_token()

    if not token:
        return None

    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])
        user_id = UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, TypeError, ValueError):
        return None

    return db.session.get(User, user_id)


def login_required(route_handler: Callable[P, R]) -> Callable[P, R]:
    @wraps(route_handler)
    def wrapped_route(*args: P.args, **kwargs: P.kwargs):
        current_user = get_current_user()

        if current_user is None:
            return jsonify({"error": "Authentication required"}), 401

        return route_handler(current_user, *args, **kwargs)

    return wrapped_route


def extract_bearer_token() -> str | None:
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.removeprefix("Bearer ").strip()
