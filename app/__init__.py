from flask import Flask
from flask_bcrypt import Bcrypt
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
from datetime import timedelta
from .config import Config
import os
from web3 import Web3
from dotenv import load_dotenv

bcrypt = Bcrypt()
db = SQLAlchemy()
jwt = JWTManager()
migrate = Migrate()


def create_app():
    app = Flask(__name__)
    
    # Load environment variables from .env file
    load_dotenv()
    
    # Configure Twilio settings
    app.config['TWILIO_ACCOUNT_SID'] = os.getenv('TWILIO_ACCOUNT_SID')
    app.config['TWILIO_AUTH_TOKEN'] = os.getenv('TWILIO_AUTH_TOKEN')
    app.config['TWILIO_PHONE_NUMBER'] = os.getenv('TWILIO_PHONE_NUMBER')
    
    app.config.from_object(Config)

    # Configure CORS
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    jwt.init_app(app)
    migrate.init_app(app, db)

    # Configure JWT
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['BASE_URL'] = 'http://E-Certify.com'


    # Initialize Web3
    app.w3 = Web3(Web3.HTTPProvider(app.config['BLOCKCHAIN_RPC']))

    # Initialize contract
    try:
        app.contract = app.w3.eth.contract(
            address=app.config['CONTRACT_ADDRESS'],
            abi=app.config['CONTRACT_ABI']
        )
        print("✅ Successfully connected to blockchain contract")
    except Exception as e:
        app.contract = None
        print(f"⚠️ Could not connect to contract: {str(e)}")

    # Register blueprints
    from .routes import routes
    app.register_blueprint(routes)

    # Create upload folder if it doesn't exist
    with app.app_context():
        if not os.path.exists(app.config['UPLOAD_FOLDER']):
            os.makedirs(app.config['UPLOAD_FOLDER'])
        db.create_all()

    return app