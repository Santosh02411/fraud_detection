// Main Application Controller
class FraudDetectionApp {
  constructor() {
    this.currentPage = "login";
    this.pageManagers = {};
    this.initializeApp();
  }

  initializeApp() {
    this.initializeNavigation();
    // Defer initial auth check to after app is fully initialized
    setTimeout(() => this.checkInitialAuth(), 0);
    this.setupGlobalEventListeners();
  }

  initializeNavigation() {
    // Navigation links
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = e.target.closest(".nav-link").dataset.page;
        navigateToPage(page);
      });
    });

    // Handle browser back/forward
    window.addEventListener("popstate", (e) => {
      if (e.state && e.state.page) {
        this.navigateToPage(e.state.page, false);
      }
    });
  }

  checkInitialAuth() {
    if (authManager.checkAuthenticationStatus()) {
      navigateToPage("dashboard");
    } else {
      navigateToPage("login");
    }
  }

  setupGlobalEventListeners() {
    // Handle page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.pauseAutoRefresh();
      } else {
        this.resumeAutoRefresh();
      }
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      this.handleResize();
    });

    // Handle online/offline status
    window.addEventListener("online", () => {
      showToast("Connection restored", "success");
    });

    window.addEventListener("offline", () => {
      showToast("Connection lost", "error");
    });
  }

  async navigateToPage(pageName, addToHistory = true) {
    if (pageName === this.currentPage) return;

    // Check authentication for protected pages
    if (pageName !== "login" && !api.isAuthenticated()) {
      showToast("Please login first", "warning");
      navigateToPage("login");
      return;
    }

    // Check admin access for admin page
    if (pageName === "admin" && !api.isAdmin()) {
      showToast("Admin access required", "error");
      return;
    }

    try {
      // Hide current page
      this.hideCurrentPage();

      // Clean up current page manager
      this.cleanupCurrentPage();

      // Show new page
      await this.showPage(pageName);

      // Update navigation
      this.updateNavigation(pageName);

      // Update browser history
      if (addToHistory) {
        history.pushState({ page: pageName }, "", `#${pageName}`);
      }

      this.currentPage = pageName;
    } catch (error) {
      console.error("Navigation error:", error);
      showToast("Failed to navigate to page", "error");
    }
  }

  hideCurrentPage() {
    const currentPageElement = document.getElementById(
      `${this.currentPage}-page`,
    );
    if (currentPageElement) {
      currentPageElement.classList.add("hidden");
    }
  }

  async showPage(pageName) {
    const pageElement = document.getElementById(`${pageName}-page`);
    if (!pageElement) {
      throw new Error(`Page ${pageName} not found`);
    }

    pageElement.classList.remove("hidden");

    // Initialize page-specific manager
    await this.initializePageManager(pageName);
  }

  async initializePageManager(pageName) {
    // Destroy previous manager if exists
    if (this.pageManagers[this.currentPage]) {
      this.pageManagers[this.currentPage].destroy();
    }

    let manager = null;

    switch (pageName) {
      case "dashboard":
        manager = new DashboardManager();
        await manager.initialize();
        break;
      case "transaction":
        // Transaction manager is already initialized globally
        break;
      case "alerts":
        await this.loadAlertsPage();
        break;
      case "analytics":
        manager = new AnalyticsManager();
        await manager.initialize();
        break;
      case "admin":
        manager = new AdminManager();
        await manager.initialize();
        break;
    }

    this.pageManagers[pageName] = manager;
  }

  async loadAlertsPage() {
    try {
      showLoading(true);
      const alerts = await api.getAlerts();
      this.displayAlerts(alerts.alerts);
    } catch (error) {
      showToast("Failed to load alerts", "error");
    } finally {
      showLoading(false);
    }
  }

  displayAlerts(alerts) {
    const container = document.getElementById("alerts-list");

    if (alerts.length === 0) {
      container.innerHTML =
        '<p class="text-gray-400 text-center py-4">No alerts found</p>';
      return;
    }

    container.innerHTML = alerts
      .map(
        (alert) => `
            <div class="alert-${alert.alert_type} rounded-lg p-4 ${alert.resolved ? "alert-resolved" : ""}">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center space-x-2">
                                <span class="text-xs px-2 py-1 rounded ${
                                  alert.alert_type === "high_risk"
                                    ? "bg-red-600"
                                    : alert.alert_type === "suspicious"
                                      ? "bg-yellow-600"
                                      : "bg-blue-600"
                                } text-white">
                                    ${alert.alert_type.replace("_", " ").toUpperCase()}
                                </span>
                                ${alert.resolved ? '<span class="text-xs bg-green-600 text-white px-2 py-1 rounded">RESOLVED</span>' : ""}
                            </div>
                            <p class="text-gray-300 text-sm mt-1">${alert.message}</p>
                            <p class="text-gray-400 text-xs mt-1">
                                ${new Date(alert.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        ${
                          alert.transaction
                            ? `
                            <div class="text-right">
                                <p class="font-medium text-white">$${alert.transaction.amount.toFixed(2)}</p>
                                <p class="text-xs text-gray-400">${alert.transaction.merchant}</p>
                            </div>
                        `
                            : ""
                        }
                        ${
                          !alert.resolved
                            ? `
                            <button onclick="resolveUserAlert(${alert.id})" 
                                    class="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm transition-colors">
                                <i class="fas fa-check mr-1"></i>Resolve
                            </button>
                        `
                            : ""
                        }
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  }

  updateNavigation(pageName) {
    // Update nav link active states
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.classList.remove("active");
      if (link.dataset.page === pageName) {
        link.classList.add("active");
      }
    });
  }

  cleanupCurrentPage() {
    if (this.pageManagers[this.currentPage]) {
      const manager = this.pageManagers[this.currentPage];
      if (manager && typeof manager.destroy === "function") {
        manager.destroy();
      }
      delete this.pageManagers[this.currentPage];
    }
  }

  pauseAutoRefresh() {
    if (this.pageManagers.dashboard) {
      this.pageManagers.dashboard.stopAutoRefresh();
    }
  }

  resumeAutoRefresh() {
    if (this.pageManagers.dashboard) {
      this.pageManagers.dashboard.startAutoRefresh();
    }
  }

  handleResize() {
    // Handle responsive layout changes
    Object.values(this.pageManagers).forEach((manager) => {
      if (manager && typeof manager.handleResize === "function") {
        manager.handleResize();
      }
    });
  }
}

// Global functions
window.navigateToPage = (pageName) => {
  app.navigateToPage(pageName);
};

window.resolveUserAlert = async (alertId) => {
  try {
    showLoading(true);
    await api.resolveAlert(alertId);
    showToast("Alert resolved successfully", "success");

    // Reload alerts if on alerts page
    if (app.currentPage === "alerts") {
      await app.loadAlertsPage();
    }
  } catch (error) {
    showToast("Failed to resolve alert", "error");
  } finally {
    showLoading(false);
  }
};

// Utility functions
window.showLoading = (show) => {
  const overlay = document.getElementById("loading-overlay");
  if (show) {
    overlay.classList.remove("hidden");
  } else {
    overlay.classList.add("hidden");
  }
};

window.showToast = (message, type = "info") => {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  const toastIcon = document.getElementById("toast-icon");

  // Set message
  toastMessage.textContent = message;

  // Set icon and color based on type
  const iconConfig = {
    success: { icon: "fas fa-check-circle", color: "text-green-400" },
    error: { icon: "fas fa-exclamation-circle", color: "text-red-400" },
    warning: { icon: "fas fa-exclamation-triangle", color: "text-yellow-400" },
    info: { icon: "fas fa-info-circle", color: "text-blue-400" },
  };

  const config = iconConfig[type] || iconConfig.info;
  toastIcon.innerHTML = `<i class="${config.icon} ${config.color}"></i>`;

  // Show toast
  toast.classList.remove("translate-x-full");

  // Hide after 3 seconds
  setTimeout(() => {
    toast.classList.add("translate-x-full");
  }, 3000);
};

// Initialize app
const app = new FraudDetectionApp();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = FraudDetectionApp;
}
