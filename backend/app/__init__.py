from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SECRET_KEY"] = "dev-secret-change-later"  # TODO: needed for sessions, implement later
    app.config["SESSION_COOKIE_SECURE"] = False  # localhost http, per the handoff doc

    db.init_app(app)
    # must match the frontend's origin exactly; "*" does not work with cookies
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app