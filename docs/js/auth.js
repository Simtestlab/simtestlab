// Professional Authentication System for MkDocs
class AuthManager {
    constructor() {
        this.overlay = null;
        this.isAuthenticated = false;
        this.sessionCheckInterval = null;
        this.init();
    }

    init() {
        // Check authentication status immediately
        this.checkAuthentication();

        // If not authenticated, show login with professional timing
        if (!this.isAuthenticated) {
            // Small delay for smooth page load experience
            setTimeout(() => {
                this.createAuthOverlay();
                this.showAuthOverlay();
            }, 500);
        }

        // Set up session monitoring
        this.startSessionMonitoring();

        // Prevent unauthorized access
        this.preventAccess();
    }

    checkAuthentication() {
        const authToken = localStorage.getItem('mkdocs_auth_token');
        const authExpiry = localStorage.getItem('mkdocs_auth_expiry');
        const authUser = localStorage.getItem('mkdocs_auth_user');

        if (authToken && authExpiry && authUser) {
            const now = new Date().getTime();
            const expiry = parseInt(authExpiry);

            if (now < expiry) {
                // Token is still valid, verify it
                this.isAuthenticated = this.verifyToken(authToken, authUser);
                if (this.isAuthenticated) {
                    this.updateLastActivity();
                }
            } else {
                // Token expired, clean up
                this.logout();
            }
        }
    }

    verifyToken(token, expectedUser) {
        try {
            const decoded = atob(token);
            const parts = decoded.split(':');
            if (parts.length === 4) {
                const [username, password, timestamp, salt] = parts;
                if (username === expectedUser) {
                    const expectedToken = this.generateToken(username, password, salt);
                    return token === expectedToken;
                }
            }
        } catch (e) {
            console.warn('Token verification failed');
        }
        return false;
    }

    generateToken(username, password, salt = null) {
        const timestamp = new Date().getTime();
        const saltValue = salt || Math.random().toString(36).substring(2, 15);
        const data = `${username}:${password}:${timestamp}:${saltValue}`;
        return btoa(data);
    }

    startSessionMonitoring() {
        // Check session every 5 minutes
        this.sessionCheckInterval = setInterval(() => {
            this.checkSessionExpiry();
        }, 5 * 60 * 1000);

        // Update activity on user interactions
        ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => this.updateLastActivity(), { passive: true });
        });
    }

    updateLastActivity() {
        if (this.isAuthenticated) {
            const now = new Date().getTime();
            localStorage.setItem('mkdocs_auth_activity', now.toString());
        }
    }

    checkSessionExpiry() {
        if (!this.isAuthenticated) return;

        const lastActivity = localStorage.getItem('mkdocs_auth_activity');
        const authExpiry = localStorage.getItem('mkdocs_auth_expiry');

        if (lastActivity && authExpiry) {
            const now = new Date().getTime();
            const activityTime = parseInt(lastActivity);
            const expiryTime = parseInt(authExpiry);

            // Auto-logout after 2 hours of inactivity or 24 hours total
            const inactiveLimit = 2 * 60 * 60 * 1000; // 2 hours
            const totalLimit = 24 * 60 * 60 * 1000; // 24 hours

            if (now - activityTime > inactiveLimit || now > expiryTime) {
                this.logout('Session expired due to inactivity');
            }
        }
    }

    createAuthOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <div class="auth-icon">�</div>
                    <h2>Access Documentation</h2>
                    <p>Enter your credentials to continue</p>
                </div>
                <form class="auth-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <div class="input-wrapper">
                            <span class="input-icon">👤</span>
                            <input type="text" id="username" name="username" required autocomplete="username" placeholder="Enter username">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <div class="input-wrapper">
                            <span class="input-icon">🔒</span>
                            <input type="password" id="password" name="password" required autocomplete="current-password" placeholder="Enter password">
                        </div>
                    </div>
                    <div class="form-options">
                        <label class="remember-me">
                            <input type="checkbox" id="remember" checked>
                            <span class="checkmark"></span>
                            Remember me for 24 hours
                        </label>
                    </div>
                    <button type="button" class="auth-button" onclick="authManager.login()">
                        <span class="button-text">Sign In</span>
                        <span class="button-spinner" style="display: none;"></span>
                    </button>
                    <div class="auth-error" id="auth-error"></div>
                    <div class="auth-info">
                        <small>Session will remain active across page navigation</small>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;

        // Add keyboard support
        this.setupKeyboardSupport();
    }

    setupKeyboardSupport() {
        const usernameInput = document.getElementById('username');
        const passwordInput = document.getElementById('password');

        if (usernameInput && passwordInput) {
            // Auto-focus username field
            setTimeout(() => usernameInput.focus(), 600);

            // Enter key support
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.login();
                }
            });
        }
    }

    showAuthOverlay() {
        if (this.overlay) {
            // Smooth fade-in animation
            requestAnimationFrame(() => {
                this.overlay.classList.add('show');
            });
        }
    }

    hideAuthOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                    this.overlay = null;
                }
            }, 400);
        }
    }

    async login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        const errorDiv = document.getElementById('auth-error');
        const button = document.querySelector('.auth-button');
        const buttonText = button.querySelector('.button-text');
        const spinner = button.querySelector('.button-spinner');

        // Clear previous error
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Validate input
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Show loading state
        button.disabled = true;
        buttonText.textContent = 'Signing In...';
        spinner.style.display = 'inline-block';

        try {
            // Simulate network delay for professional feel
            await new Promise(resolve => setTimeout(resolve, 800));

            // Check credentials
            if (this.validateCredentials(username, password)) {
                // Generate secure token
                const salt = Math.random().toString(36).substring(2, 15);
                const token = this.generateToken(username, password, salt);

                // Set session duration based on remember preference
                const sessionDuration = remember ? 24 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000; // 24h or 8h
                const expiry = new Date().getTime() + sessionDuration;

                // Store session data
                localStorage.setItem('mkdocs_auth_token', token);
                localStorage.setItem('mkdocs_auth_expiry', expiry.toString());
                localStorage.setItem('mkdocs_auth_user', username);
                localStorage.setItem('mkdocs_auth_activity', new Date().getTime().toString());

                this.isAuthenticated = true;

                // Hide overlay with smooth transition
                this.hideAuthOverlay();

                // Show success feedback
                this.showSuccessMessage();

                // Start session monitoring
                this.startSessionMonitoring();

            } else {
                this.showError('Invalid username or password');
                // Add shake animation for wrong credentials
                this.shakeForm();
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Authentication failed. Please try again.');
        } finally {
            // Reset button state
            button.disabled = false;
            buttonText.textContent = 'Sign In';
            spinner.style.display = 'none';
        }
    }

    shakeForm() {
        const container = document.querySelector('.auth-container');
        if (container) {
            container.classList.add('shake');
            setTimeout(() => container.classList.remove('shake'), 500);
        }
    }

    validateCredentials(username, password) {
        const validUsername = window.MKDOCS_AUTH_USERNAME || 'admin';
        const validPassword = window.MKDOCS_AUTH_PASSWORD || 'password';

        return username === validUsername && password === validPassword;
    }

    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';

            // Auto-hide error after 5 seconds
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    showSuccessMessage() {
        const success = document.createElement('div');
        success.className = 'auth-success-notification';
        success.innerHTML = `
            <div class="success-icon">✅</div>
            <div class="success-content">
                <div class="success-title">Welcome back!</div>
                <div class="success-subtitle">You are now signed in</div>
            </div>
        `;
        document.body.appendChild(success);

        // Animate in
        setTimeout(() => success.classList.add('show'), 100);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            success.classList.remove('show');
            setTimeout(() => success.remove(), 300);
        }, 3000);
    }

    logout(reason = 'Logged out successfully') {
        // Clear all session data
        localStorage.removeItem('mkdocs_auth_token');
        localStorage.removeItem('mkdocs_auth_expiry');
        localStorage.removeItem('mkdocs_auth_user');
        localStorage.removeItem('mkdocs_auth_activity');

        // Clear session monitoring
        if (this.sessionCheckInterval) {
            clearInterval(this.sessionCheckInterval);
            this.sessionCheckInterval = null;
        }

        this.isAuthenticated = false;

        // Show logout message if reason provided
        if (reason !== 'Logged out successfully') {
            this.showLogoutMessage(reason);
        }

        // Reload page to show login
        setTimeout(() => location.reload(), 1000);
    }

    showLogoutMessage(reason) {
        const message = document.createElement('div');
        message.className = 'auth-logout-notification';
        message.innerHTML = `
            <div class="logout-icon">⏰</div>
            <div class="logout-content">
                <div class="logout-title">Session Ended</div>
                <div class="logout-subtitle">${reason}</div>
            </div>
        `;
        document.body.appendChild(message);

        setTimeout(() => message.classList.add('show'), 100);
        setTimeout(() => {
            message.classList.remove('show');
            setTimeout(() => message.remove(), 300);
        }, 4000);
    }

    preventAccess() {
        // Prevent right-click context menu
        document.addEventListener('contextmenu', (e) => {
            if (!this.isAuthenticated) {
                e.preventDefault();
                return false;
            }
        });

        // Prevent keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (!this.isAuthenticated) {
                // Prevent Ctrl+U (view source), Ctrl+S (save), Ctrl+A (select all), Ctrl+P (print)
                if (e.ctrlKey && ['u', 's', 'a', 'p', 'c', 'v'].includes(e.key.toLowerCase())) {
                    e.preventDefault();
                    return false;
                }
                // Prevent F12 (dev tools), F11 (fullscreen)
                if (['F12', 'F11'].includes(e.key)) {
                    e.preventDefault();
                    return false;
                }
                // Prevent Ctrl+Shift+I (dev tools)
                if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // Prevent drag and drop
        document.addEventListener('dragstart', (e) => {
            if (!this.isAuthenticated) {
                e.preventDefault();
                return false;
            }
        });

        // Prevent text selection
        document.addEventListener('selectstart', (e) => {
            if (!this.isAuthenticated) {
                e.preventDefault();
                return false;
            }
        });
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Global logout function
window.logout = () => {
    if (window.authManager) {
        window.authManager.logout();
    }
};