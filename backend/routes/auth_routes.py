from flask import Blueprint, jsonify, request

from extensions import db
from models.user import User
from utils.auth import create_access_token, login_required
from utils.validators import ValidationError, require_fields, validate_email

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    password = payload.get("password") or payload.get("senha")
    name = payload.get("name") or payload.get("nome")

    require_fields({"name": name, "email": payload.get("email"), "password": password}, ["name", "email", "password"])
    validate_email(payload["email"])
    validate_password(password)

    if User.query.filter_by(email=payload["email"].lower()).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name, email=payload["email"].lower())
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"user": user.to_dict(), "access_token": create_access_token(user)}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    require_fields(payload, ["email", "password"])
    validate_email(payload["email"])

    user = User.query.filter_by(email=payload["email"].lower()).first()

    if user is None or not user.check_password(payload["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"user": user.to_dict(), "access_token": create_access_token(user)})


@auth_bp.get("/me")
@login_required
def me(current_user: User):
    return jsonify({"user": current_user.to_dict()})


def validate_password(password: str) -> None:
    if len(password) < 6:
        raise ValidationError("Invalid password: expected at least 6 characters")
