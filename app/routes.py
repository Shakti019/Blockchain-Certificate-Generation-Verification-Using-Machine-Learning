from flask import request, jsonify, send_from_directory
from flask import Blueprint
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from datetime import timedelta,datetime
from app.models import User
from app import db
from werkzeug.utils import secure_filename
from .models import Certificate
from flask import request, jsonify, current_app
import os
import bcrypt
import joblib
import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut, GeocoderServiceError
import statistics
import requests
from geopy.geocoders import Nominatim
from .Secuirity_Key_Encryption_Algo import convert_pwd_in_array, reverse_fluid_encrypt
import json
from time import sleep
from .Encryption_Algo_Dict import Fluid_table, Number_division_table, keyOperator
from twilio.rest import Client
import uuid  # For MAC address generation
import platform  # For system info
from pathlib import Path




routes = Blueprint('routes', __name__)

@routes.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'email', 'password', 'confirmPassword',
                         'contactNumber', 'universityName', 'universityId',
                         'location', 'country', 'state', 'region', 'category']

        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400

        # Check if passwords match
        if data['password'] != data['confirmPassword']:
            return jsonify({"error": "Passwords don't match"}), 400

        # Check if email already exists
        if db.session.query(User).filter(User.email == data['email']).first():
            return jsonify({"error": "Email already registered"}), 400

        # Check if university ID already exists
        if db.session.query(User).filter(User.university_id == data['universityId']).first():
            return jsonify({"error": "University ID already registered"}), 400

        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            password=generate_password_hash(data['password']),
            phone=data['contactNumber'],
            address=data['location'],
            university_name=data['universityName'],
            university_id=data['universityId'],
            country=data['country'],
            state=data['state'],
            region=data['region'],
            category=data['category']
        )

        db.session.add(new_user)
        db.session.commit()

        # Generate access token
        access_token = create_access_token(
            identity=new_user.name,
            expires_delta=timedelta(days=7)
        )

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "access_token": access_token,
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print("Error:", str(e))
        return jsonify({"error": "Registration failed. Please try again."}), 500

@routes.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password required"}), 400

        user = db.session.query(User).filter(User.email == email).first()

        if not user or not check_password_hash(user.password, password):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(
            identity=user.name,
            expires_delta=timedelta(days=7)
        )

        return jsonify({
            "access_token": access_token,
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "university_name": user.university_name
            }
        }), 200

    except Exception as e:
        print("Login error:", str(e))
        return jsonify({"error": "Login failed"}), 500


def get_coordinates(street, city, state, postal_code, country, max_retries=3):
    """Get coordinates from address using Nominatim geocoder with retries"""
    try:
        # Format the address - handle cases where some fields might be empty
        address_parts = []
        if street:
            address_parts.append(street)
        if city:
            address_parts.append(city)
        if state:
            address_parts.append(state)
        if postal_code:
            address_parts.append(postal_code)
        if country:
            address_parts.append(country)
            
        address = ", ".join(filter(None, address_parts))
        
        # Initialize the geocoder with a meaningful user agent
        geolocator = Nominatim(
            user_agent="certificate_validator_app/1.0",
            timeout=10
        )
        
        # Try multiple times with exponential backoff
        for attempt in range(max_retries):
            try:
                # Add a small delay to respect rate limits
                sleep(1)  
                
                # Get location
                location = geolocator.geocode(address)
                
                if location:
                    return location.latitude, location.longitude
                
                # Try with a simpler address if full address fails
                if attempt == 1 and city and country:
                    location = geolocator.geocode(f"{city}, {country}")
                    if location:
                        return location.latitude, location.longitude
                
                # Final attempt with just country if all else fails
                if attempt == 2 and country:
                    location = geolocator.geocode(country)
                    if location:
                        return location.latitude, location.longitude
                        
            except (GeocoderTimedOut, GeocoderServiceError) as e:
                if attempt == max_retries - 1:
                    raise e
                sleep(2 ** attempt)  # Exponential backoff
                
        return None, None
        
    except Exception as e:
        current_app.logger.error(f"Geocoding error: {str(e)}")
        return None, None

@routes.route('/certificates/generate', methods=['POST'])
@jwt_required()
def generate_certificate():
    try:
        # Get the current university/issuer user
        issuer_name = get_jwt_identity()
        user = User.query.filter_by(name=issuer_name).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.form
        
        # Format phone number to E.164 format
        mobile_number = data['mobileNumber']
        if not mobile_number.startswith('+'):
            mobile_number = '+' + mobile_number.replace(' ', '').replace('-', '')
        
        # Validate phone number length (should be between 10 and 15 digits)
        digits_only = ''.join(filter(str.isdigit, mobile_number))
        if len(digits_only) < 10 or len(digits_only) > 15:
            return jsonify({"error": "Invalid phone number format. Must be between 10 and 15 digits"}), 400

        # Create encryption input string
        encryption_input = f"{data['studentName']}{data['universityId']}{mobile_number}{datetime.utcnow().isoformat()}"
        
        # Generate encrypted security key
        encrypted_data = convert_pwd_in_array(encryption_input)
        
        # Generate certificate ID with bcrypt hash
        cert_id = f"CERT-{bcrypt.hashpw(encryption_input.encode('utf-8'), bcrypt.gensalt()).hex()[:16].upper()}"

        # Get coordinates
        latitude, longitude = get_coordinates(
            data['streetAddress'],
            data['city'],
            data['state'],
            data['postalCode'],
            data['country']
        )

        # Save image file
        image_file = request.files['studentImage']
        filename = secure_filename(f"{cert_id}_{image_file.filename}")
        upload_folder = current_app.config['UPLOAD_FOLDER']
        os.makedirs(upload_folder, exist_ok=True)
        image_path = os.path.join(upload_folder, filename)
        image_file.save(image_path)

        # Create new certificate
        new_cert = Certificate(
            certificate_id=cert_id,
            student_name=data['studentName'],
            university_id=data['universityId'],
            university_name=user.university_name,
            degree_program=data['degreeProgram'],
            major=data['major'],
            graduation_date=datetime.strptime(data['graduationDate'], '%Y-%m-%d').date(),
            cgpa=float(data['cgpa']),
            honors=data.get('honors', ''),
            certificate_title=data['certificateTitle'],
            description=data.get('description', ''),
            street_address=data['streetAddress'],
            city=data['city'],
            state=data['state'],
            postal_code=data['postalCode'],
            country=data['country'],
            latitude=latitude,
            longitude=longitude,
            terms_accepted=data['termsAccepted'].lower() == 'true',
            privacy_policy_accepted=data['privacyPolicyAccepted'].lower() == 'true',
            image_path=filename,
            issuer_id=user.id,
            status='issued',
            encrypted_data=json.dumps(encrypted_data),
            mobile_number=mobile_number,  # Use the formatted phone number
            issued_at=datetime.utcnow()  # Explicitly set issued_at
        )

        db.session.add(new_cert)
        db.session.commit()

        # Generate verification URL
        verification_url = f"{request.host_url.rstrip('/')}/verify/{cert_id}"
        
        # Send SMS notification
        certificate_details = {
            'certificate_id': cert_id,
            'student_name': data['studentName'],
            'university_name': user.university_name,
            'degree_program': data['degreeProgram'],
            'verification_url': verification_url
        }
        
        sms_sent, sms_result = send_certificate_sms(
            mobile_number,  # Use the formatted phone number
            certificate_details
        )

        return jsonify({
            "success": True,
            "certificateId": cert_id,
            "verificationUrl": verification_url,
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            },
            "message": "Certificate generated successfully",
            "sms_notification": {
                "sent": sms_sent,
                "details": sms_result if not sms_sent else "SMS sent successfully"
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Certificate generation error: {str(e)}")
        return jsonify({
            "error": "Certificate generation failed",
            "details": str(e)
        }), 500

@routes.route('/certificates/verify', methods=['GET', 'POST'])
def verify_certificate():
    try:
        # Support both GET (query params) and POST (JSON body)
        if request.method == 'GET':
            certificate_id = request.args.get('certificateId')
            university_id = request.args.get('universityId')
            student_name = request.args.get('studentName')
        else:
            data = request.get_json()
            print(data)
            certificate_id = data.get('certificateId')
            university_id = data.get('universityId')
            student_name = data.get('studentName')

        # Basic validation
        if not certificate_id and not (university_id and student_name):
            return jsonify({
                "valid": False,
                "error": "Either certificateId or both universityId and studentName are required"
            }), 400

        query = Certificate.query

        if certificate_id:
            query = query.filter_by(certificate_id=certificate_id)
        else:
            query = query.filter_by(
                university_id=university_id,
                student_name=student_name
            )

        certificate = query.first()

        if not certificate:
            return jsonify({
                "valid": False,
                "error": "Certificate not found"
            }), 404

        if certificate.status == 'revoked':
            return jsonify({
                "valid": False,
                "error": "This certificate has been revoked",
                "certificateId": certificate.certificate_id
            }), 410

        # Prepare features for ML model
        ml_features = {
            'university_id': certificate.university_id,
            'issuer_id': certificate.issuer_id,
            'degree_program': certificate.degree_program,
            'cgpa': float(certificate.cgpa),  # Ensure numeric
            'days_since_issue': (datetime.utcnow() - certificate.issued_at).days,
            'verification_count': certificate.verification_count + 1,
            'verification_frequency': (certificate.verification_count + 1) /
                                      max(1, (datetime.utcnow() - certificate.issued_at).days),
            'cgpa_category': 'perfect' if certificate.cgpa >= 3.9 else
            'high' if certificate.cgpa >= 3.5 else
            'medium' if certificate.cgpa >= 3.0 else 'low'
        }

        # Get ML prediction
        ml_result = check_for_fraud(ml_features)

        # Prepare response
        response = {
            "valid": True,
            "certificate": {
                "id": certificate.certificate_id,
                "studentName": certificate.student_name,
                "universityName": certificate.university_name,
                "universityId": certificate.university_id,
                "degreeProgram": certificate.degree_program,
                "major": certificate.major,
                "graduationDate": certificate.graduation_date.isoformat() if certificate.graduation_date else None,
                "cgpa": certificate.cgpa,
                "honors": certificate.honors,
                "certificateTitle": certificate.certificate_title,
                "issuedAt": certificate.issued_at.isoformat() if certificate.issued_at else None,
                "issuer": User.query.get(certificate.issuer_id).name,
                "status": certificate.status,
                "verificationCount": certificate.verification_count,
                "lastVerified": certificate.last_verified.isoformat() if certificate.last_verified else None
            },
            "aiVerification": {
                "suspicionScore": ml_result['score'],
                "isSuspicious": ml_result['score'] > 0.7,
                "riskFactors": ml_result['risk_factors'],
                "confidence": 1 - ml_result['score'] if ml_result['score'] <= 0.7 else ml_result['score']
            }
        }

        # Update verification stats
        certificate.verification_count += 1
        certificate.last_verified = datetime.utcnow()
        db.session.commit()

        return jsonify(response), 200

    except Exception as e:
        current_app.logger.error(f"Verification error: {str(e)}")
        return jsonify({
            "valid": False,
            "error": "Verification failed",
            "details": str(e)
        }), 500


def check_for_fraud(features):
    """Analyze certificate features with ML model for fraud detection"""
    try:
        # Load model and encoders
        model_path = current_app.config['FRAUD_MODEL_PATH']
        if not os.path.exists(model_path):
            current_app.logger.error(f"Model file not found at: {model_path}")
            return {
                'score': 0.0,
                'risk_factors': [{'feature': 'error', 'value': 'Model file not found', 'importance': 1.0}]
            }
            
        model_data = joblib.load(model_path)
        model = model_data['model']
        label_encoders = model_data['label_encoders']
        # Prepare features DataFrame
        df = pd.DataFrame([features])

        # Encode categorical features
        categorical_cols = ['university_id', 'issuer_id', 'degree_program', 'cgpa_category']
        for col in categorical_cols:
            if col in df.columns and col in label_encoders:
                df[col] = label_encoders[col].transform(df[col])

        # Get prediction
        score = model.predict_proba(df)[0, 1]  # Probability of being fraud

        # Identify top risk factors
        risk_factors = []
        if hasattr(model, 'feature_importances_'):
            feature_importances = dict(zip(model.feature_names_in_, model.feature_importances_))
            sorted_features = sorted(feature_importances.items(), key=lambda x: x[1], reverse=True)

            for feature, importance in sorted_features[:3]:  # Top 3 features
                if feature in features:
                    risk_factors.append({
                        'feature': feature,
                        'value': features[feature],
                        'importance': float(importance)
                    })

        return {
            'score': float(score),
            'risk_factors': risk_factors
        }

    except Exception as e:
        current_app.logger.error(f"Fraud detection error: {str(e)}")
        return {
            'score': 0.0,
            'risk_factors': [{'feature': 'error', 'value': str(e), 'importance': 1.0}]
        }

@routes.route('/certificates', methods=['GET'])
@jwt_required()
def get_certificates():
    try:
        issuer_name = get_jwt_identity()
        user = User.query.filter_by(name=issuer_name).first()

        if not user:
            return jsonify({"error": "User not found"}), 404

        certificates = Certificate.query.filter_by(issuer_id=user.id).all()
        certificates_data = []
        
        for cert in certificates:
            cert_data = {
                'id': cert.id,
                'certificate_id': cert.certificate_id,
                'student_name': cert.student_name,
                'university_name': cert.university_name,
                'degree_program': cert.degree_program,
                'major': cert.major,
                'graduation_date': cert.graduation_date.isoformat() if cert.graduation_date else None,
                'cgpa': cert.cgpa,
                'honors': cert.honors,
                'certificate_title': cert.certificate_title,
                'image_path': cert.image_path,
                'issued_at': cert.issued_at.isoformat() if cert.issued_at else None,
                'status': cert.status,
                'verification_count': cert.verification_count,
                'last_verified': cert.last_verified.isoformat() if cert.last_verified else None,
                'latitude': cert.latitude,
                'longitude': cert.longitude,
                'city': cert.city,
                'country': cert.country
            }
            certificates_data.append(cert_data)
            print(certificates_data)

        return jsonify(certificates_data), 200

    except Exception as e:
        current_app.logger.error(f"Error fetching certificates: {str(e)}")
        return jsonify({"error": "Failed to fetch certificates"}), 500

import requests
from geopy.geocoders import Nominatim

def geocode_address(certificate):
    try:
        # Try using city and country first
        location_str = f"{certificate.city}, {certificate.country}"
        geolocator = Nominatim(user_agent="certificate_mapper")
        location = geolocator.geocode(location_str)
        
        if location:
            return location.latitude, location.longitude
        
        # Fallback to university name if city/country fails
        location = geolocator.geocode(certificate.university_name)
        if location:
            return location.latitude, location.longitude
            
        return None, None
    except Exception as e:
        print(f"Geocoding error: {e}")
        return None, None

@routes.route('/uploads/<path:filename>')
def serve_image(filename):
    """Serve uploaded images"""
    try:
        # Ensure the filename is secure and within the uploads directory
        safe_filename = secure_filename(filename)
        if not safe_filename:
            return jsonify({"error": "Invalid filename"}), 400
            
        # Get the upload folder path from config
        upload_folder = current_app.config['UPLOAD_FOLDER']
        
        # Ensure the upload folder exists
        os.makedirs(upload_folder, exist_ok=True)
        
        # Check if file exists
        file_path = os.path.join(upload_folder, safe_filename)
        if not os.path.exists(file_path):
            current_app.logger.error(f"Image file not found: {file_path}")
            return jsonify({"error": "Image not found"}), 404
            
        return send_from_directory(upload_folder, safe_filename)
    except Exception as e:
        current_app.logger.error(f"Error serving image: {str(e)}")
        return jsonify({"error": "Image not found"}), 404

@routes.route('/certificates/stats', methods=['GET'])
@jwt_required()
def get_certificate_stats():
    current_user_id = get_jwt_identity()
    
    total = Certificate.query.filter_by(issuer_id=current_user_id).count()
    issued = Certificate.query.filter_by(issuer_id=current_user_id, status='issued').count()
    pending = Certificate.query.filter_by(issuer_id=current_user_id, status='pending').count()
    revoked = Certificate.query.filter_by(issuer_id=current_user_id, status='revoked').count()
    
    return jsonify({
        'total': total,
        'issued': issued,
        'pending': pending,
        'revoked': revoked
    }), 200

@routes.route('/certificates/<int:certificate_id>/verify', methods=['POST'])
@jwt_required()
def verify_specific_certificate(certificate_id):
    current_user_id = get_jwt_identity()
    certificate = Certificate.query.filter_by(id=certificate_id, issuer_id=current_user_id).first()
    
    if not certificate:
        return jsonify({'error': 'Certificate not found'}), 404
    
    if certificate.status != 'issued':
        return jsonify({'error': 'Only issued certificates can be verified'}), 400
    
    # Update verification info
    certificate.verification_count += 1
    certificate.last_verified = datetime.utcnow()
    
    # Generate a simple verification hash (in production, use proper blockchain integration)
    if not certificate.blockchain_hash:
        certificate.blockchain_hash = f"bx{datetime.now().timestamp():.0f}"
    
    db.session.commit()
    
    return jsonify({
        'id': certificate.id,
        'certificate_id': certificate.certificate_id,
        'verification_count': certificate.verification_count,
        'last_verified': certificate.last_verified.isoformat(),
        'blockchain_hash': certificate.blockchain_hash
    }), 200

@routes.route('/certificates/search', methods=['GET'])
@jwt_required()
def search_certificates():
    current_user_id = get_jwt_identity()
    query = request.args.get('q', '')
    status = request.args.get('status', 'all')
    
    base_query = Certificate.query.filter_by(issuer_id=current_user_id)
    
    if query:
        base_query = base_query.filter(
            (Certificate.student_name.ilike(f'%{query}%')) |
            (Certificate.certificate_id.ilike(f'%{query}%')) |
            (Certificate.university_name.ilike(f'%{query}%'))
        )
    
    if status != 'all':
        base_query = base_query.filter_by(status=status)
    
    certificates = base_query.all()
    
    result = []
    for cert in certificates:
        result.append({
            'id': cert.id,
            'certificate_id': cert.certificate_id,
            'student_name': cert.student_name,
            'university_name': cert.university_name,
            'degree_program': cert.degree_program,
            'status': cert.status,
            'issued_at': cert.issued_at.isoformat()
        })
    
    return jsonify(result), 200

@routes.route('/certificates/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    current_user_id = get_jwt_identity()
    certificates = Certificate.query.filter_by(issuer_id=current_user_id).all()
    
    if not certificates:
        return jsonify({'error': 'No certificates found'}), 404
    
    # Basic statistics
    cgpas = [cert.cgpa for cert in certificates]
    verification_counts = [cert.verification_count for cert in certificates]
    
    # Group by degree program
    degree_counts = {}
    for cert in certificates:
        degree_counts[cert.degree_program] = degree_counts.get(cert.degree_program, 0) + 1
    
    return jsonify({
        'average_cgpa': round(statistics.mean(cgpas), 2) if cgpas else 0,
        'max_cgpa': max(cgpas) if cgpas else 0,
        'min_cgpa': min(cgpas) if cgpas else 0,
        'average_verifications': round(statistics.mean(verification_counts), 2) if verification_counts else 0,
        'degree_distribution': degree_counts,
        'total_certificates': len(certificates)
    }), 200

@routes.route('/user/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    try:
        # Get current user's name from JWT token
        current_user_name = get_jwt_identity()
        
        # Find user in database
        user = User.query.filter_by(name=current_user_name).first()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        # Return user data
        return jsonify({
            "name": user.name,
            "email": user.email,
            "organization": user.university_name,
            "role": user.category,
            "phone": user.phone,
            "address": user.address,
            "university_id": user.university_id,
            "country": user.country,
            "state": user.state,
            "region": user.region,
            "createdAt": user.id  # Using ID as a proxy for creation time since we don't have a creation timestamp
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error fetching user profile: {str(e)}")
        return jsonify({"error": "Failed to fetch user profile"}), 500

@routes.route('/certificates/validate/<certificate_id>', methods=['POST'])
@jwt_required()
def validate_certificate(certificate_id):
    try:
        # Get the certificate
        certificate = Certificate.query.filter_by(certificate_id=certificate_id).first()
        if not certificate:
            return jsonify({"error": "Certificate not found"}), 404

        # Get the encrypted data
        encrypted_data = json.loads(certificate.encrypted_data)
        
        # Create validation string
        validation_input = f"{certificate.student_name}{certificate.university_id}{certificate.mobile_number}{certificate.issued_at.isoformat()}"
        
        # Now decrypt the data only during validation
        decrypted_data = reverse_fluid_encrypt(
            encrypted_data['xor_results'],
            encrypted_data['original_bit'],
            get_mac_address(),  # current MAC address
            get_system_hardware_info()  # current system info
        )

        # Validate the decrypted data
        is_valid = decrypted_data == validation_input

        return jsonify({
            "valid": is_valid,
            "certificate": {
                "id": certificate.certificate_id,
                "studentName": certificate.student_name,
                "universityName": certificate.university_name,
                "issueDate": certificate.issued_at.isoformat(),
                "status": certificate.status
            }
        }), 200

    except Exception as e:
        print(f"Validation error: {str(e)}")
        return jsonify({"error": "Validation failed", "details": str(e)}), 500

def get_mac_address():
    """Get a unique identifier for the system"""
    return ':'.join(['{:02x}'.format((uuid.getnode() >> elements) & 0xff) 
                    for elements in range(0,2*6,2)][::-1])

def get_system_hardware_info():
    """Get basic system hardware information"""
    return {
        'system': platform.system(),
        'machine': platform.machine(),
        'processor': platform.processor()
    }

def send_certificate_sms(phone_number, certificate_details):
    """Send SMS notification for certificate generation"""
    try:
        print("\n=== Sending Certificate Details via SMS ===")
        
        # Your specific Twilio credentials
        account_sid = 'AC0be475859421b3d2b3838c819e2b05cb'
        from_number = '+17242045602'
        auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
        
        if not auth_token:
            print("Twilio auth token not configured")
            return False, "Twilio authentication token not configured"
            
        # Format phone number to E.164 format
        if not phone_number.startswith('+'):
            phone_number = '+' + phone_number.replace(' ', '').replace('-', '')
            
        print(f"Sending SMS to: {phone_number}")
        
        # Create message text with certificate details
        message_text = (
            f"Congratulations! Your certificate has been generated successfully!\n\n"
            f"Certificate Details:\n"
            f"ID: {certificate_details['certificate_id']}\n"
            f"Name: {certificate_details['student_name']}\n"
            f"University: {certificate_details['university_name']}\n"
            f"Program: {certificate_details['degree_program']}\n\n"
            f"Verify your certificate at:\n"
            f"{certificate_details['verification_url']}"
        )
        
        try:
            # Initialize Twilio client
            client = Client(account_sid, auth_token)
            
            # Send the message
            message = client.messages.create(
                body=message_text,
                from_=from_number,
                to=phone_number
            )
            
            print(f"SMS sent successfully! Message SID: {message.sid}")
            return True, message.sid
            
        except Exception as twilio_error:
            print(f"Twilio Error: {str(twilio_error)}")
            return False, str(twilio_error)
            
    except Exception as e:
        print(f"SMS sending failed: {str(e)}")
        return False, str(e)

@routes.route('/test-twilio', methods=['POST'])
def test_twilio():
    try:
        account_sid = 'AC0be475859421b3d2b3838c819e2b05cb'
        from_number = '+17242045602'
        auth_token = current_app.config.get('TWILIO_AUTH_TOKEN')
        
        # Get the test phone number from request
        data = request.get_json()
        to_number = data.get('phone_number')
        
        if not to_number:
            return jsonify({"error": "Please provide a phone_number in the request body"}), 400
            
        # Create Twilio client
        client = Client(account_sid, auth_token)
        
        # Send test message
        message = client.messages.create(
            body="This is a test message from your certificate validation system.",
            from_=from_number,
            to=to_number
        )
        
        return jsonify({
            "success": True,
            "message_sid": message.sid,
            "status": message.status
        }), 200
        
    except Exception as e:
        print(f"Twilio Error: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def initialize_model_directory():
    """Initialize the model directory and ensure model files exist"""
    try:
        # Get the app's root directory
        app_root = Path(current_app.root_path)
        
        # Create saved_models directory if it doesn't exist
        model_dir = app_root / 'saved_models'
        model_dir.mkdir(exist_ok=True)
        
        # Define model paths
        model_path = model_dir / 'random_forest_model.joblib'
        scaler_path = model_dir / 'scaler.joblib'
        
        # Check if models exist
        if not model_path.exists() or not scaler_path.exists():
            current_app.logger.warning(
                "Model files not found. Please run the training notebook to generate models."
            )
            return False
            
        return True
        
    except Exception as e:
        current_app.logger.error(f"Error initializing model directory: {str(e)}")
        return False

@routes.route('/certificates/validate-address', methods=['POST'])
def validate_address():
    try:
        data = request.get_json()
        
        # First check if address exists in our certificates
        existing_certificate = Certificate.query.filter(
            Certificate.street_address.ilike(f"%{data.get('streetAddress', '')}%"),
            Certificate.city.ilike(f"%{data.get('city', '')}%"),
            Certificate.state.ilike(f"%{data.get('state', '')}%"),
            Certificate.country.ilike(f"%{data.get('country', '')}%")
        ).first()

        if existing_certificate:
            return jsonify({
                "valid": True,
                "confidence": 1.0,
                "source": "platform_generated",
                "certificate_id": existing_certificate.certificate_id,
                "coordinates": {
                    "latitude": existing_certificate.latitude,
                    "longitude": existing_certificate.longitude
                }
            }), 200

        # For new addresses, use the trained model
        latitude, longitude = get_coordinates(
            data.get('streetAddress', ''),
            data.get('city', ''),
            data.get('state', ''),
            data.get('postalCode', ''),
            data.get('country', '')
        )

        if not latitude or not longitude:
            return jsonify({
                "valid": False,
                "error": "Could not validate address coordinates",
                "source": "external"
            }), 400

        # Load the latest model
        model_dir = os.path.join(current_app.root_path, 'saved_models')
        model_path = os.path.join(model_dir, 'random_forest_model.joblib')
        scaler_path = os.path.join(model_dir, 'scaler.joblib')
        
        if not os.path.exists(model_path) or not os.path.exists(scaler_path):
            # If model doesn't exist, train it first
            trainer = AddressModelTrainer()
            if not trainer.train_model():
                return jsonify({
                    "valid": False,
                    "error": "Could not initialize address validation model",
                    "source": "external"
                }), 500

        # Load model and make prediction
        model = joblib.load(model_path)
        scaler = joblib.load(scaler_path)

        features = pd.DataFrame([{
            'Latitude': latitude,
            'Longitude': longitude,
            'Country_encoded': hash(data.get('country', '')) % 100,
            'coord_in_country_bounds': 1 if is_coord_in_country_bounds(latitude, longitude, data.get('country', '')) else 0,
            'city_state_match': 1 if is_city_in_state(data.get('city', ''), data.get('state', ''), data.get('country', '')) else 0
        }])

        scaled_features = scaler.transform(features)
        prediction = model.predict(scaled_features)[0]
        confidence = float(model.predict_proba(scaled_features)[0][1])

        return jsonify({
            "valid": bool(prediction),
            "confidence": confidence,
            "source": "external",
            "coordinates": {
                "latitude": latitude,
                "longitude": longitude
            }
        }), 200

    except Exception as e:
        current_app.logger.error(f"Address validation error: {str(e)}")
        return jsonify({
            "valid": False,
            "error": str(e),
            "source": "external"
        }), 500

def is_coord_in_country_bounds(lat, lon, country):
    """Check if coordinates are within country bounds"""
    # Define country bounds (you can expand this dictionary)
    country_bounds = {
        'India': {'lat': (6, 35), 'lon': (68, 97)},
        'USA': {'lat': (24, 49), 'lon': (-125, -66)},
        'UK': {'lat': (49, 59), 'lon': (-8, 2)},
        # Add more countries as needed
    }
    
    if country in country_bounds:
        bounds = country_bounds[country]
        lat_in_range = bounds['lat'][0] <= lat <= bounds['lat'][1]
        lon_in_range = bounds['lon'][0] <= lon <= bounds['lon'][1]
        return lat_in_range and lon_in_range
    return False

def is_city_in_state(city, state, country):
    """Check if city belongs to state"""
    # This is a simplified version. You might want to use a proper database or API
    # for real city/state validation
    return bool(city and state and country)

@routes.route('/certificates/logs', methods=['GET'])
@jwt_required()
def get_certificate_logs():
    try:
        # Get all certificates with their verification history
        certificates = Certificate.query.order_by(Certificate.issued_at.desc()).all()
        
        logs = []
        for cert in certificates:
            log_entry = {
                'certificate_id': cert.certificate_id,
                'student_name': cert.student_name,
                'university_name': cert.university_name,
                'degree_program': cert.degree_program,
                'issued_at': cert.issued_at.isoformat() if cert.issued_at else None,
                'status': cert.status,
                'verification_count': cert.verification_count,
                'last_verified': cert.last_verified.isoformat() if cert.last_verified else None,
                'blockchain_hash': cert.blockchain_hash,
                'address': {
                    'street': cert.street_address,
                    'city': cert.city,
                    'state': cert.state,
                    'postal_code': cert.postal_code,
                    'country': cert.country
                },
                'encrypted_data': cert.encrypted_data,
                'latitude': cert.latitude,
                'longitude': cert.longitude
            }
            logs.append(log_entry)
        
        return jsonify(logs), 200
    except Exception as e:
        current_app.logger.error(f"Error fetching certificate logs: {str(e)}")
        return jsonify({"error": "Failed to fetch certificate logs"}), 500

@routes.route('/api/verify', methods=['GET', 'POST'])
def open_api_verify():
    try:
        # Support both GET (query params) and POST (JSON body)
        if request.method == 'GET':
            certificate_id = request.args.get('certificateId')
            university_id = request.args.get('universityId')
            student_name = request.args.get('studentName')
        else:
            data = request.get_json()
            certificate_id = data.get('certificateId')
            university_id = data.get('universityId')
            student_name = data.get('studentName')

        # Basic validation
        if not certificate_id and not (university_id and student_name):
            return jsonify({
                "valid": False,
                "error": "Either certificateId or both universityId and studentName are required"
            }), 400

        query = Certificate.query

        if certificate_id:
            query = query.filter_by(certificate_id=certificate_id)
        else:
            query = query.filter_by(
                university_id=university_id,
                student_name=student_name
            )

        certificate = query.first()

        if not certificate:
            return jsonify({
                "valid": False,
                "error": "Certificate not found"
            }), 404

        if certificate.status == 'revoked':
            return jsonify({
                "valid": False,
                "error": "This certificate has been revoked",
                "certificateId": certificate.certificate_id
            }), 410

        # Prepare response
        response = {
            "valid": True,
            "certificate": {
                "id": certificate.certificate_id,
                "studentName": certificate.student_name,
                "universityName": certificate.university_name,
                "universityId": certificate.university_id,
                "degreeProgram": certificate.degree_program,
                "major": certificate.major,
                "graduationDate": certificate.graduation_date.isoformat() if certificate.graduation_date else None,
                "cgpa": certificate.cgpa,
                "honors": certificate.honors,
                "certificateTitle": certificate.certificate_title,
                "issuedAt": certificate.issued_at.isoformat() if certificate.issued_at else None,
                "status": certificate.status,
                "verificationCount": certificate.verification_count,
                "lastVerified": certificate.last_verified.isoformat() if certificate.last_verified else None,
                "blockchainHash": certificate.blockchain_hash
            }
        }

        # Update verification stats
        certificate.verification_count += 1
        certificate.last_verified = datetime.utcnow()
        db.session.commit()

        return jsonify(response), 200

    except Exception as e:
        current_app.logger.error(f"Open API verification error: {str(e)}")
        return jsonify({
            "valid": False,
            "error": "Verification failed",
            "details": str(e)
        }), 500