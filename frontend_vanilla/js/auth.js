// Authentication Module
class AuthManager {
  constructor() {
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchTab(e.target.dataset.tab),
      );
    });

    // Login form
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Signup form
    document.getElementById("signup-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSignup();
    });

    // Logout button
    document.getElementById("logout-btn").addEventListener("click", () => {
      this.handleLogout();
    });
  }

  switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add("bg-blue-600", "text-white");
        btn.classList.remove("bg-white/20");
      } else {
        btn.classList.remove("bg-blue-600", "text-white");
        btn.classList.add("bg-white/20");
      }
    });

    // Show/hide forms
    document.querySelectorAll(".tab-content").forEach((content) => {
      content.classList.add("hidden");
    });

    if (tabName === "login") {
      document.getElementById("login-form").classList.remove("hidden");
    } else {
      document.getElementById("signup-form").classList.remove("hidden");
    }
  }

  async handleLogin() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    if (!username || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    showLoading(true);

    try {
      const response = await api.login(username, password);
      showToast("Login successful!", "success");

      // Update UI for logged-in user
      this.updateUIForLoggedInUser(response.user);

      // Navigate to dashboard
      navigateToPage("dashboard");
    } catch (error) {
      showToast(error.message || "Login failed", "error");
    } finally {
      showLoading(false);
    }
  }

  async handleSignup() {
    const username = document.getElementById("signup-username").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    if (!username || !email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters", "error");
      return;
    }

    showLoading(true);

    try {
      const response = await api.register(username, email, password);
      showToast("Registration successful!", "success");

      // Update UI for logged-in user
      this.updateUIForLoggedInUser(response.user);

      // Navigate to dashboard
      navigateToPage("dashboard");
    } catch (error) {
      showToast(error.message || "Registration failed", "error");
    } finally {
      showLoading(false);
    }
  }

  handleLogout() {
    api.logout();
    showToast("Logged out successfully", "success");

    // Reset UI to login state
    this.resetUIToLoginState();

    // Navigate to login page
    navigateToPage("login");
  }

  updateUIForLoggedInUser(user) {
    // Show navbar
    document.getElementById("navbar").classList.remove("hidden");

    // Update user info
    document.getElementById("user-info").textContent = user.username;

    // Show admin link if user is admin
    const adminLinks = document.querySelectorAll(".admin-only");
    adminLinks.forEach((link) => {
      link.classList.toggle("hidden", user.role !== "admin");
    });
  }

  resetUIToLoginState() {
    // Hide navbar
    document.getElementById("navbar").classList.add("hidden");

    // Clear forms
    document.getElementById("login-form").reset();
    document.getElementById("signup-form").reset();

    // Switch to login tab
    this.switchTab("login");
  }

  checkAuthenticationStatus() {
    if (api.isAuthenticated()) {
      const user = api.getCurrentUser();
      this.updateUIForLoggedInUser(user);
      return true;
    }
    return false;
  }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = AuthManager;
}
