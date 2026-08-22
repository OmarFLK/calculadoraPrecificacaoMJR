from flask import Blueprint, jsonify, request

from extensions import db
from models.user import User
from utils.auth import create_access_token, login_required
from utils.validators import ValidationError, require_fields, validate_email

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    validate_json_object(payload)
    password = payload.get("password") or payload.get("senha")
    name = payload.get("name") or payload.get("nome")
    email = payload.get("email")

    require_fields({"name": name, "email": email, "password": password}, ["name", "email", "password"])
    validate_name(name)
    validate_email(email)
    validate_password(password)
    normalized_email = email.strip().lower()

    if User.query.filter_by(email=normalized_email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(name=name.strip(), email=normalized_email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"user": user.to_dict(), "access_token": create_access_token(user)}), 201


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    validate_json_object(payload)
    require_fields(payload, ["email", "password"])
    validate_email(payload["email"])
    validate_password_type(payload["password"])

    user = User.query.filter_by(email=payload["email"].strip().lower()).first()

    if user is None or not user.check_password(payload["password"]):
        return jsonify({"error": "Invalid email or password"}), 401

    return jsonify({"user": user.to_dict(), "access_token": create_access_token(user)})


@auth_bp.get("/me")
@login_required
def me(current_user: User):
    return jsonify({"user": current_user.to_dict()})


def validate_password(password: str) -> None:
    validate_password_type(password)

    if len(password) < 6:
        raise ValidationError("Invalid password: expected at least 6 characters")


def validate_password_type(password: object) -> None:
    if not isinstance(password, str):
        raise ValidationError("Invalid password: expected a string")


def validate_name(name: object) -> None:
    if not isinstance(name, str) or not name.strip():
        raise ValidationError("Invalid name: expected a non-empty string")


def validate_json_object(payload: object) -> None:
    if not isinstance(payload, dict):
        raise ValidationError("Invalid request body: expected a JSON object")
