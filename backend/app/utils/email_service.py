# Email Service for Fraud Alerts
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import os

class EmailService:
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', 587))
        self.smtp_username = os.environ.get('SMTP_USERNAME', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', 'noreply@frauddetection.com')
    
    def send_fraud_alert(self, user_email, user_name, transaction_details, fraud_probability):
        """Send fraud alert email to user"""
        if not self.smtp_username or not self.smtp_password:
            print("Email credentials not configured. Skipping email notification.")
            return False
        
        try:
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = user_email
            msg['Subject'] = f'🚨 Fraud Alert - Suspicious Transaction Detected'
            
            # Email body
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🛡️ FraudGuard</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Advanced Fraud Detection System</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
                    <h2 style="color: #dc3545; margin-bottom: 20px;">⚠️ Fraud Alert</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Dear {user_name},
                    </p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        We have detected a suspicious transaction on your account that may indicate fraudulent activity.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
                        <h3 style="color: #333; margin-top: 0;">Transaction Details:</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Amount:</td>
                                <td style="padding: 8px; color: #333;">${transaction_details.get('amount', 0):.2f}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Merchant:</td>
                                <td style="padding: 8px; color: #333;">{transaction_details.get('merchant', 'Unknown')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Category:</td>
                                <td style="padding: 8px; color: #333;">{transaction_details.get('category', 'Unknown')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Location:</td>
                                <td style="padding: 8px; color: #333;">{transaction_details.get('location', 'Unknown')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Time:</td>
                                <td style="padding: 8px; color: #333;">{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</td>
                            </tr>
                            <tr>
                                <td style="padding: 8px; font-weight: bold; color: #666;">Fraud Probability:</td>
                                <td style="padding: 8px; color: #dc3545; font-weight: bold;">{fraud_probability:.1f}%</td>
                            </tr>
                        </table>
                    </div>
                    
                    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                        <h3 style="color: #856404; margin-top: 0;">🔒 Recommended Actions:</h3>
                        <ul style="color: #856404; margin: 10px 0; padding-left: 20px;">
                            <li>Review the transaction details above</li>
                            <li>If you don't recognize this transaction, contact your bank immediately</li>
                            <li>Monitor your account for any other suspicious activity</li>
                            <li>Consider changing your account password</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                            View Full Report
                        </a>
                    </div>
                </div>
                
                <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 10px;">
                    <p style="margin: 0; font-size: 14px;">
                        This is an automated message from FraudGuard. Please do not reply to this email.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                        © 2024 FraudGuard. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Failed to send email: {e}")
            return False
    
    def send_welcome_email(self, user_email, user_name):
        """Send welcome email to new user"""
        if not self.smtp_username or not self.smtp_password:
            print("Email credentials not configured. Skipping welcome email.")
            return False
        
        try:
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = user_email
            msg['Subject'] = 'Welcome to FraudGuard - Your Account is Ready!'
            
            body = f"""
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">🛡️ FraudGuard</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0 0;">Advanced Fraud Detection System</p>
                </div>
                
                <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; margin: 20px 0;">
                    <h2 style="color: #28a745; margin-bottom: 20px;">✅ Welcome to FraudGuard!</h2>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Dear {user_name},
                    </p>
                    <p style="color: #333; font-size: 16px; line-height: 1.6;">
                        Thank you for joining FraudGuard! Your account has been successfully created and is ready to use.
                    </p>
                    
                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #333; margin-top: 0;">🚀 What you can do with FraudGuard:</h3>
                        <ul style="color: #333; margin: 15px 0; padding-left: 20px;">
                            <li>🔍 Analyze transactions for fraud in real-time</li>
                            <li>📊 View detailed analytics and insights</li>
                            <li>🚨 Receive instant fraud alerts</li>
                            <li>📈 Monitor your transaction history</li>
                            <li>🛡️ Protect your financial assets</li>
                        </ul>
                    </div>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="#" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                            Get Started
                        </a>
                    </div>
                </div>
                
                <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 10px;">
                    <p style="margin: 0; font-size: 14px;">
                        This is an automated message from FraudGuard. Please do not reply to this email.
                    </p>
                    <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.8;">
                        © 2024 FraudGuard. All rights reserved.
                    </p>
                </div>
            </body>
            </html>
            """
            
            msg.attach(MIMEText(body, 'html'))
            
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Failed to send welcome email: {e}")
            return False

# Global email service instance
email_service = EmailService()
