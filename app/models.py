from . import db
from flask_login import UserMixin
from datetime import datetime


class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    phone = db.Column(db.String(15), nullable=False)
    address = db.Column(db.String(200), nullable=False)
    university_name = db.Column(db.String(100), nullable=False)  
    university_id = db.Column(db.String(50), nullable=False)  
    country = db.Column(db.String(50), nullable=False)
    state = db.Column(db.String(50), nullable=False)  
    region = db.Column(db.String(50), nullable=False)
    category = db.Column(db.String(50), nullable=False)

    def __repr__(self):
        return f'<User {self.email}>'

class Certificate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    certificate_id = db.Column(db.String(50), unique=True, nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    university_id = db.Column(db.String(50), nullable=False)
    university_name = db.Column(db.String(100), nullable=False)
    degree_program = db.Column(db.String(50), nullable=False)
    major = db.Column(db.String(100), nullable=False)
    graduation_date = db.Column(db.DateTime, nullable=False)
    cgpa = db.Column(db.Float, nullable=False)
    honors = db.Column(db.String(100))
    certificate_title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    street_address = db.Column(db.String(255))
    city = db.Column(db.String(100))
    state = db.Column(db.String(100))
    postal_code = db.Column(db.String(20))
    country = db.Column(db.String(100))
    terms_accepted = db.Column(db.Boolean, default=False)
    privacy_policy_accepted = db.Column(db.Boolean, default=False)
    image_path = db.Column(db.String(200), nullable=False)
    latitude = db.Column(db.Float)
    longitude = db.Column(db.Float)
    mobile_number = db.Column(db.String(15), nullable=False)
    encrypted_data = db.Column(db.Text, nullable=True)
    agreement_date = db.Column(db.DateTime, default=datetime.utcnow)
    issuer_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    verification_count = db.Column(db.Integer, default=0)
    last_verified = db.Column(db.DateTime, nullable=True)
    blockchain_hash = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<Certificate {self.certificate_id}>'