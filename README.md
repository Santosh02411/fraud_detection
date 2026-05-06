# 🛡️ FraudGuard - Advanced Fraud Detection System

A comprehensive end-to-end fraud detection system using machine learning to identify and prevent fraudulent transactions in real-time.

## 🚀 Features

### 🔬 Machine Learning Models
- **Logistic Regression** - Fast and interpretable baseline model
- **Random Forest** - Ensemble method with high accuracy
- **XGBoost** - Advanced gradient boosting for superior performance
- **Real-time Fraud Prediction** - Instant analysis of transactions
- **Explainable AI** - Feature importance for transparency

### 📊 Analytics & Insights
- **Interactive Dashboard** - Real-time metrics and KPIs
- **Fraud Trends Analysis** - Hourly patterns and distributions
- **Merchant Risk Analysis** - Identify high-risk merchants
- **Transaction History** - Complete audit trail
- **Export Functionality** - Download reports in JSON/CSV

### 🚨 Alert System
- **Real-time Alerts** - Instant notifications for suspicious transactions
- **Risk Scoring** - 0-100% fraud probability
- **Email Notifications** - Automated alert emails (configurable)
- **Alert Management** - Resolve and track alerts

### 👥 User Management
- **Multi-user System** - Admin and regular user roles
- **Secure Authentication** - JWT-based login system
- **Role-based Access Control** - Admin panel for system monitoring
- **User Profiles** - Personalized dashboards

### 🎨 Modern UI/UX
- **Glassmorphism Design** - Modern, professional interface
- **Dark Theme** - Easy on the eyes fintech-style design
- **Responsive Layout** - Works on all devices
- **Interactive Charts** - Real-time data visualization
- **Smooth Animations** - Professional user experience

## 🏗️ Architecture

### Backend (Python/Flask)
```
backend/
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── database.py          # Database models and setup
│   └── api/
│       ├── auth.py          # Authentication endpoints
│       ├── transactions.py  # Transaction analysis
│       ├── analytics.py     # Analytics endpoints
│       └── admin.py         # Admin panel endpoints
├── models/
│   └── ml_models.py         # Machine learning models
├── utils/
│   └── email_service.py     # Email notifications
└── run.py                   # Application entry point
```

### Frontend (HTML/CSS/JavaScript)
```
frontend/
├── index.html               # Single-page application
├── css/
│   └── style.css           # Tailwind CSS + custom styles
└── js/
    ├── api.js              # API service layer
    ├── auth.js             # Authentication logic
    ├── dashboard.js        # Dashboard functionality
    ├── transactions.js     # Transaction analysis
    ├── analytics.js        # Analytics charts
    ├── admin.js            # Admin panel
    └── main.js             # Main application controller
```

## 🛠️ Technology Stack

### Backend
- **Python 3.8+** - Core programming language
- **Flask** - Web framework
- **SQLite** - Database (easily upgradeable to PostgreSQL)
- **Scikit-learn** - Machine learning library
- **XGBoost** - Gradient boosting framework
- **Imbalanced-learn** - SMOTE for handling class imbalance
- **JWT** - Authentication tokens
- **Flask-CORS** - Cross-origin resource sharing

### Frontend
- **HTML5/CSS3** - Modern web standards
- **JavaScript ES6+** - Client-side logic
- **Tailwind CSS** - Utility-first CSS framework
- **Chart.js** - Data visualization
- **Font Awesome** - Icon library

### Machine Learning
- **Data Preprocessing** - Feature scaling and normalization
- **SMOTE** - Synthetic minority oversampling
- **Model Evaluation** - Accuracy, precision, recall, F1-score
- **Feature Importance** - Model interpretability

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 14 or higher (for development tools)
- Git

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd fraud_detection
```

2. **Create virtual environment**
```bash
python -m venv venv
# On Windows
venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

4. **Set environment variables** (optional)
```bash
# Create .env file
cp .env.example .env

# Edit .env with your configuration
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key
FLASK_DEBUG=True
```

5. **Initialize the database**
```bash
python run.py
```
The database will be created automatically with a default admin user:
- Username: `admin`
- Password: `admin123`

### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **The frontend is ready to use!**
The frontend uses CDN links for Tailwind CSS, Chart.js, and Font Awesome, so no additional setup is required.

## 🚀 Running the Application

### Method 1: Development Mode

1. **Start the backend server**
```bash
cd backend
python run.py
```
The API will be available at `http://localhost:5000`

2. **Open the frontend**
Open `frontend/index.html` in your web browser or use a simple HTTP server:
```bash
cd frontend
python -m http.server 8000
```
Then visit `http://localhost:8000`

### Method 2: Production Mode

For production deployment, consider using:
- **Gunicorn** for the Python backend
- **Nginx** as a reverse proxy
- **PostgreSQL** for the database
- **Redis** for caching

## 📊 Usage Guide

### Getting Started

1. **Login as Admin**
   - Username: `admin`
   - Password: `admin123`

2. **Create Regular Users**
   - Use the signup form or admin panel
   - Regular users can analyze transactions and view their own data

3. **Analyze Transactions**
   - Go to "New Transaction" page
   - Enter transaction details or use "Simulate Random"
   - View fraud probability and risk factors

### Key Features

#### 🎯 Transaction Analysis
- Enter transaction amount, merchant, category, and location
- Get instant fraud probability (0-100%)
- View key risk factors and feature importance
- Automatic alert creation for high-risk transactions

#### 📈 Dashboard
- Real-time KPI metrics
- Transaction trends visualization
- Recent transactions list
- Fraud vs normal transaction breakdown

#### 🚨 Alerts
- Automatic fraud alerts for suspicious transactions
- Alert management and resolution
- Email notifications (configurable)
- Alert history tracking

#### 📊 Analytics
- Hourly fraud patterns
- Fraud probability distribution
- Merchant risk analysis
- Data export functionality

#### ⚙️ Admin Panel
- System overview and statistics
- User management
- Role-based access control
- System health monitoring

## 🔧 Configuration

### Email Configuration (Optional)
To enable email notifications, set these environment variables:
```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=noreply@frauddetection.com
```

### Database Configuration
The system uses SQLite by default. To use PostgreSQL:
1. Install `psycopg2-binary`
2. Update the database URI in `app/__init__.py`
3. Set the `DATABASE_URL` environment variable

### Model Configuration
- Models are automatically trained on first run
- Trained models are saved in the `models/` directory
- You can retrain models by deleting the saved files

## 🤖 Machine Learning Details

### Data Preprocessing
- **Feature Scaling**: StandardScaler for numerical features
- **Class Imbalance**: SMOTE oversampling for minority class
- **Feature Engineering**: Time-based features, transaction patterns

### Model Performance
The system evaluates models using:
- **Accuracy**: Overall prediction accuracy
- **Precision**: False positive rate
- **Recall**: Fraud detection rate
- **F1-Score**: Harmonic mean of precision and recall

### Model Selection
- **XGBoost** is used as the default model (best performance)
- **Random Forest** provides good interpretability
- **Logistic Regression** serves as a fast baseline

## 📱 Mobile Responsiveness

The application is fully responsive and works on:
- Desktop browsers
- Tablets
- Mobile phones
- Various screen sizes

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Cross-origin request protection
- **Input Validation**: Server-side input sanitization
- **Role-based Access**: Admin and user role separation

## 🚀 Advanced Features

### Live Transaction Simulation
- Automatic transaction generation for testing
- Real-time fraud detection demonstration
- Pattern-based transaction simulation

### Export Functionality
- JSON export of transaction data
- Alert history export
- Analytics data export
- Custom date range selection

### System Monitoring
- Database health checks
- API response monitoring
- User activity tracking
- System performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure the backend is running and CORS is configured
2. **Database Errors**: Delete the database file to reinitialize
3. **Model Training**: Check Python dependencies and data availability
4. **Authentication**: Clear browser cache and localStorage

### Debug Mode
Enable Flask debug mode:
```bash
export FLASK_DEBUG=True
python run.py
```

### Logs
Check the console for detailed error messages and API responses.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

## 🎯 Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Mobile app development
- [ ] Advanced anomaly detection
- [ ] Graph-based fraud detection
- [ ] AI-powered chatbot assistant
- [ ] Multi-language support
- [ ] Advanced reporting features
- [ ] Integration with payment gateways

---

**Built with ❤️ for secure financial transactions**
#   f r a u d _ d e t e c t i o n  
 