// Authentication System for MkDocs
class AuthManager {
    constructor() {
        this.overlay = null;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Check if user is already authenticated
        this.checkAuthentication();

        // Create auth overlay if not authenticated
        if (!this.isAuthenticated) {
            this.createAuthOverlay();
            this.showAuthOverlay();
        }

        // Prevent right-click and keyboard shortcuts
        this.preventAccess();
    }

    checkAuthentication() {
        const authToken = localStorage.getItem('mkdocs_auth_token');
        const authExpiry = localStorage.getItem('mkdocs_auth_expiry');

        if (authToken && authExpiry) {
            const now = new Date().getTime();
            if (now < parseInt(authExpiry)) {
                // Token is still valid
                this.isAuthenticated = this.verifyToken(authToken);
            } else {
                // Token expired, remove it
                this.logout();
            }
        }
    }

    verifyToken(token) {
        // Simple token verification - in production, use proper JWT or similar
        try {
            const decoded = atob(token);
            const parts = decoded.split(':');
            if (parts.length === 3) {
                const [username, password, timestamp] = parts;
                const expectedToken = this.generateToken(username, password);
                return token === expectedToken;
            }
        } catch (e) {
            console.warn('Token verification failed');
        }
        return false;
    }

    generateToken(username, password) {
        // Simple token generation - in production, use proper encryption
        const timestamp = new Date().getTime();
        const data = `${username}:${password}:${timestamp}`;
        return btoa(data);
    }

    createAuthOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-container">
                <div class="auth-header">
                    <h2>🔒 Secure Access</h2>
                    <p>Please enter your credentials to access this documentation</p>
                </div>
                <form class="auth-form" onsubmit="return false;">
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" name="username" required autocomplete="username">
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" name="password" required autocomplete="current-password">
                    </div>
                    <button type="button" class="auth-button" onclick="authManager.login()">Login</button>
                    <div class="auth-error" id="auth-error"></div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }

    showAuthOverlay() {
        if (this.overlay) {
            setTimeout(() => {
                this.overlay.classList.add('show');
            }, 100);
        }
    }

    hideAuthOverlay() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
            setTimeout(() => {
                this.overlay.remove();
                this.overlay = null;
            }, 300);
        }
    }

    async login() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('auth-error');
        const button = document.querySelector('.auth-button');

        // Clear previous error
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';

        // Validate input
        if (!username || !password) {
            this.showError('Please enter both username and password');
            return;
        }

        // Disable button during authentication
        button.disabled = true;
        button.textContent = 'Authenticating...';

        try {
            // Check credentials against configured values
            if (this.validateCredentials(username, password)) {
                // Generate and store token
                const token = this.generateToken(username, password);
                const expiry = new Date().getTime() + (30 * 60 * 1000); // 30 minutes

                localStorage.setItem('mkdocs_auth_token', token);
                localStorage.setItem('mkdocs_auth_expiry', expiry.toString());

                this.isAuthenticated = true;
                this.hideAuthOverlay();

                // Show success message
                this.showSuccessMessage();
            } else {
                this.showError('Invalid username or password');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showError('Authentication failed. Please try again.');
        } finally {
            // Re-enable button
            button.disabled = false;
            button.textContent = 'Login';
        }
    }

    validateCredentials(username, password) {
        // Get credentials from global config (set during build)
        const validUsername = window.MKDOCS_AUTH_USERNAME || 'admin';
        const validPassword = window.MKDOCS_AUTH_PASSWORD || 'password';

        return username === validUsername && password === validPassword;
    }

    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    showSuccessMessage() {
        // Optional: Show a brief success message
        const success = document.createElement('div');
        success.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            font-weight: 500;
        `;
        success.textContent = '✅ Login successful!';
        document.body.appendChild(success);

        setTimeout(() => {
            success.remove();
        }, 3000);
    }

    logout() {
        localStorage.removeItem('mkdocs_auth_token');
        localStorage.removeItem('mkdocs_auth_expiry');
        this.isAuthenticated = false;
        location.reload();
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
                // Prevent Ctrl+U (view source), Ctrl+S (save), etc.
                if (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'a' || e.key === 'p')) {
                    e.preventDefault();
                    return false;
                }
                // Prevent F12 (dev tools)
                if (e.key === 'F12') {
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
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Global logout function for potential use in templates
window.logout = () => {
    if (window.authManager) {
        window.authManager.logout();
    }
};