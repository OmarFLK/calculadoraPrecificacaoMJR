from flask import Flask, jsonify

from config import Config
from extensions import cors, db, migrate
from models import (
    AiAnalysisLog,
    ComplexityLevel,
    HistoricalProject,
    Nucleus,
    PricingRule,
    PricingSimulation,
    ProjectFile,
    Service,
    User,
)
from routes.ai_routes import ai_bp
from routes.analytics_routes import analytics_bp
from routes.auth_routes import auth_bp
from routes.pricing_routes import pricing_bp, simulations_bp
from routes.project_routes import project_bp

_registered_models = (
    AiAnalysisLog,
    ComplexityLevel,
    HistoricalProject,
    Nucleus,
    PricingRule,
    PricingSimulation,
    ProjectFile,
    Service,
    User,
)


def create_app(config_class: type[Config] = Config) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(
        app,
        resources={r"/*": {"origins": app.config["FRONTEND_ORIGINS"]}},
        supports_credentials=True,
    )

    register_blueprints(app)
    register_error_handlers(app)
    register_healthcheck(app)

    return app


def register_blueprints(app: Flask) -> None:
    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(project_bp, url_prefix="/projects")
    app.register_blueprint(pricing_bp, url_prefix="/pricing")
    app.register_blueprint(simulations_bp, url_prefix="/simulations")
    app.register_blueprint(ai_bp, url_prefix="/ai")
    app.register_blueprint(analytics_bp, url_prefix="/analytics")


def register_healthcheck(app: Flask) -> None:
    @app.get("/health")
    def healthcheck():
        return jsonify({"status": "ok"})


def register_error_handlers(app: Flask) -> None:
    from utils.validators import ValidationError

    @app.errorhandler(ValidationError)
    def validation_error(error):
        return jsonify({"error": str(error)}), 400

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def internal_error(_error):
        return jsonify({"error": "Internal server error"}), 500


app = create_app()


if __name__ == "__main__":
    app.run(debug=True)
