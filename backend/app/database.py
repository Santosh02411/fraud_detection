from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    merchant = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    location = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    fraud_probability = db.Column(db.Float, nullable=False)
    is_fraud = db.Column(db.Boolean, default=False)
    alert_sent = db.Column(db.Boolean, default=False)
    
    # Feature columns for ML model
    v1 = db.Column(db.Float)
    v2 = db.Column(db.Float)
    v3 = db.Column(db.Float)
    v4 = db.Column(db.Float)
    v5 = db.Column(db.Float)
    v6 = db.Column(db.Float)
    v7 = db.Column(db.Float)
    v8 = db.Column(db.Float)
    v9 = db.Column(db.Float)
    v10 = db.Column(db.Float)
    v11 = db.Column(db.Float)
    v12 = db.Column(db.Float)
    v13 = db.Column(db.Float)
    v14 = db.Column(db.Float)
    v15 = db.Column(db.Float)
    v16 = db.Column(db.Float)
    v17 = db.Column(db.Float)
    v18 = db.Column(db.Float)
    v19 = db.Column(db.Float)
    v20 = db.Column(db.Float)
    v21 = db.Column(db.Float)
    v22 = db.Column(db.Float)
    v23 = db.Column(db.Float)
    v24 = db.Column(db.Float)
    v25 = db.Column(db.Float)
    v26 = db.Column(db.Float)
    v27 = db.Column(db.Float)
    v28 = db.Column(db.Float)

    user = db.relationship('User', backref=db.backref('transactions', lazy=True))

class FraudAlert(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.Integer, db.ForeignKey('transaction.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    alert_type = db.Column(db.String(50), nullable=False)  # 'high_risk', 'suspicious', 'blocked'
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved = db.Column(db.Boolean, default=False)
    
    transaction = db.relationship('Transaction', backref=db.backref('alerts', lazy=True))
    user = db.relationship('User', backref=db.backref('fraud_alerts', lazy=True))

def init_db(app):
    db.init_app(app)
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                email='admin@frauddetection.com',
                role='admin'
            )
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
