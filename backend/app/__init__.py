import app
import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, send_from_directory, abort
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import timedelta

db = SQLAlchemy()

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        abort(404)
    full_path = os.path.join(FRONTEND_DIST, path)
    if path and os.path.isfile(full_path):
        return send_from_directory(FRONTEND_DIST, path)
    return send_from_directory(FRONTEND_DIST, "index.html")

def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
    app.config["SESSION_COOKIE_SECURE"] = False  # localhost http, per the handoff doc
    app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

    db.init_app(app)
    # must match the frontend's origin exactly; "*" does not work with cookies
    CORS(app, origins=["http://localhost:5173"], supports_credentials=True)

    from app.routes import main
    app.register_blueprint(main)

    with app.app_context():
        db.create_all()

    return app