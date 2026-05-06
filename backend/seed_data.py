import os
import random
import datetime
from app import create_app
from app.database import db, User, Transaction, FraudAlert

def seed_transactions(count=15):
    app = create_app()
    with app.app_context():
        print(f"Seeding {count} transactions...")
        
        # Get admin user
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            print("Admin user not found. Please run the app first to initialize DB.")
            return

        # Sample data
        merchants = ['Amazon', 'Apple Store', 'Starbucks', 'Tesla', 'Walmart', 'Steam', 'Uber', 'Airbnb', 'Shell', 'Nike']
        categories = ['Shopping', 'Electronics', 'Food', 'Auto', 'Travel', 'Entertainment', 'Transport']
        locations = ['New York, NY', 'San Francisco, CA', 'London, UK', 'Berlin, DE', 'Tokyo, JP', 'Mumbai, IN']

        # Clear existing data if desired (optional)
        # Transaction.query.delete()
        # FraudAlert.query.delete()
        # db.session.commit()

        for i in range(count):
            is_fraud = random.random() < 0.25 # 25% fraud rate for better visualization
            amount = random.uniform(500, 5000) if is_fraud else random.uniform(10, 800)
            merchant = random.choice(merchants)
            category = random.choice(categories)
            location = random.choice(locations)
            
            fraud_prob = random.uniform(75, 99) if is_fraud else random.uniform(0.1, 15)
            
            # Generate features (V1-V28)
            features = {}
            for j in range(1, 29):
                features[f'v{j}'] = random.uniform(-3, 3) if is_fraud else random.uniform(-0.5, 0.5)

            tx = Transaction(
                user_id=admin.id,
                amount=amount,
                merchant=merchant,
                category=category,
                location=location,
                fraud_probability=fraud_prob,
                is_fraud=is_fraud,
                timestamp=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(0, 7), hours=random.randint(0, 23)),
                **features
            )
            
            db.session.add(tx)
            db.session.flush() # Get the ID

            if is_fraud:
                alert = FraudAlert(
                    transaction_id=tx.id,
                    user_id=admin.id,
                    alert_type='high_risk' if fraud_prob > 85 else 'suspicious',
                    message=f"High risk transaction detected at {merchant}. Amount: ${amount:.2f}",
                    created_at=tx.timestamp
                )
                db.session.add(alert)

        db.session.commit()
        print(f"Successfully seeded {count} transactions and alerts.")

if __name__ == '__main__':
    seed_transactions()
