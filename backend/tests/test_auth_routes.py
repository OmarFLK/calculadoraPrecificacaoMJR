import unittest

import jwt

from app import create_app
from config import TestConfig
from extensions import db
from models.user import User


class AuthRoutesTest(unittest.TestCase):
    def setUp(self) -> None:
        self.app = create_app(TestConfig)
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.create_all()

        self.user = User(name="Usuário Teste", email="teste@mauajr.com")
        self.user.set_password("senha-segura")
        db.session.add(self.user)
        db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self) -> None:
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_login_returns_token_that_authorizes_me(self) -> None:
        login_response = self.client.post(
            "/auth/login",
            json={"email": "  TESTE@MAUAJR.COM ", "password": "senha-segura"},
        )

        self.assertEqual(200, login_response.status_code)
        access_token = login_response.get_json()["access_token"]
        me_response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )

        self.assertEqual(200, me_response.status_code)
        self.assertEqual("teste@mauajr.com", me_response.get_json()["user"]["email"])

    def test_login_rejects_wrong_password(self) -> None:
        response = self.client.post(
            "/auth/login",
            json={"email": "teste@mauajr.com", "password": "incorreta"},
        )

        self.assertEqual(401, response.status_code)
        self.assertEqual("Invalid email or password", response.get_json()["error"])

    def test_login_rejects_non_object_body(self) -> None:
        response = self.client.post("/auth/login", json=["invalid"])

        self.assertEqual(400, response.status_code)
        self.assertIn("expected a JSON object", response.get_json()["error"])

    def test_me_rejects_missing_and_malformed_tokens(self) -> None:
        missing_response = self.client.get("/auth/me")
        malformed_response = self.client.get(
            "/auth/me",
            headers={"Authorization": "Bearer not-a-jwt"},
        )
        token_without_subject = jwt.encode(
            {"email": "teste@mauajr.com"},
            self.app.config["JWT_SECRET_KEY"],
            algorithm="HS256",
        )
        missing_subject_response = self.client.get(
            "/auth/me",
            headers={"Authorization": f"Bearer {token_without_subject}"},
        )

        self.assertEqual(401, missing_response.status_code)
        self.assertEqual(401, malformed_response.status_code)
        self.assertEqual(401, missing_subject_response.status_code)

    def test_register_hashes_password_and_normalizes_identity(self) -> None:
        response = self.client.post(
            "/auth/register",
            json={
                "name": "  Nova Pessoa  ",
                "email": "  NOVA@MAUAJR.COM ",
                "password": "outra-senha",
            },
        )

        self.assertEqual(201, response.status_code)
        user = User.query.filter_by(email="nova@mauajr.com").one()
        self.assertEqual("Nova Pessoa", user.name)
        self.assertNotEqual("outra-senha", user.password_hash)
        self.assertTrue(user.check_password("outra-senha"))


if __name__ == "__main__":
    unittest.main()
