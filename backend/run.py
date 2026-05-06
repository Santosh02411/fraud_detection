from app import create_app
import os

# Create the Flask app
app = create_app()

if __name__ == '__main__':
    # Development configuration
    debug_mode = os.environ.get('FLASK_DEBUG', 'True').lower() == 'true'
    port = int(os.environ.get('PORT', 5000))
    
    print(f"Starting Fraud Detection System on port {port}")
    print(f"Debug mode: {debug_mode}")
    print("API Endpoints:")
    print("  - POST /api/auth/register")
    print("  - POST /api/auth/login")
    print("  - GET  /api/auth/profile")
    print("  - POST /api/transactions/predict")
    print("  - GET  /api/transactions/history")
    print("  - POST /api/transactions/simulate")
    print("  - GET  /api/transactions/alerts")
    print("  - GET  /api/analytics/dashboard")
    print("  - GET  /api/analytics/fraud-trends")
    print("  - GET  /api/analytics/merchant-analysis")
    print("  - GET  /api/analytics/export")
    print("  - GET  /api/admin/users")
    print("  - GET  /api/admin/overview")
    print("  - GET  /api/admin/transactions")
    print("  - GET  /api/admin/alerts")
    
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
