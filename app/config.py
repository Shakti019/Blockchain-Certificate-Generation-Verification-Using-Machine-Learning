import os
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file


class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-secret-key')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///users.db')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')

    # Blockchain config
    BLOCKCHAIN_RPC = os.getenv('BLOCKCHAIN_RPC')
    CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
    ADMIN_ADDRESS = os.getenv('ADMIN_ADDRESS')
    ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY')
    CHAIN_ID = int(os.getenv('CHAIN_ID', '11155111'))  # Default Sepolia
    GAS_PRICE = os.getenv('GAS_PRICE', '20')

    # IPFS config
    IPFS_HOST = os.getenv('IPFS_HOST', 'localhost')
    IPFS_PORT = int(os.getenv('IPFS_PORT', '5001'))
    IPFS_PROTOCOL = os.getenv('IPFS_PROTOCOL', 'http')
    IPFS_GATEWAY = os.getenv('IPFS_GATEWAY', 'https://ipfs.io/ipfs/')

    # File uploads
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

    # Model paths
    MODEL_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    FRAUD_MODEL_PATH = os.path.join(MODEL_DIR, 'certificate_fraud_model.pkl')

    # Contract ABI path
    CONTRACT_ABI_PATH = os.path.join(BASE_DIR, 'contract_abi.json')
    
    # Default contract ABI (empty for now, will be populated from file if exists)
    CONTRACT_ABI = []

    def __init__(self):
        # Verify model path exists
        if not os.path.exists(self.FRAUD_MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at: {self.FRAUD_MODEL_PATH}")
            
        # Try to load contract ABI if file exists
        if os.path.exists(self.CONTRACT_ABI_PATH):
            try:
                import json
                with open(self.CONTRACT_ABI_PATH, 'r') as f:
                    self.CONTRACT_ABI = json.load(f)
            except Exception as e:
                print(f"Warning: Could not load contract ABI: {str(e)}")
                self.CONTRACT_ABI = []