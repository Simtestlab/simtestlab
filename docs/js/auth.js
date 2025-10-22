// Enhanced Authentication System for MkDocs with Advanced Session Management
class SessionManager {
    constructor() {
        this.sessionId = null;
        this.lastActivity = null;
        this.warningShown = false;
        this.renewalTimer = null;
        this.expiryTimer = null;
        this.broadcastChannel = null;
        this.init();
    }

    init() {
        // Generate unique session ID
        this.sessionId = this.generateSessionId();

        // Initialize broadcast channel for cross-tab communication
        this.initBroadcastChannel();

        // Set up activity tracking
        this.setupActivityTracking();

        // Check for existing session
        this.checkExistingSession();
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel('mkdocs_auth_channel');

            this.broadcastChannel.onmessage = (event) => {
                const { type, data } = event.data;

                switch (type) {
                    case 'logout':
                        this.handleRemoteLogout();
                        break;
                    case 'login':
                        this.handleRemoteLogin(data);
                        break;
                    case 'session_expired':
                        this.handleSessionExpired();
                        break;
                }
            };
        } catch (e) {
            console.warn('BroadcastChannel not supported, cross-tab sync disabled');
        }
    }

    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

        const updateActivity = () => {
            this.lastActivity = Date.now();
            this.warningShown = false; // Reset warning flag on activity
        };

        events.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true });
        });

        // Check activity every minute
        setInterval(() => {
            this.checkSessionActivity();
        }, 60000);
    }

    checkExistingSession() {
        const sessionData = this.getStoredSession();

        if (sessionData) {
            const { token, expiry, sessionId, lastActivity } = sessionData;
            const now = Date.now();

            if (now < expiry) {
                // Session is still valid
                this.sessionId = sessionId;
                this.lastActivity = lastActivity || now;
                this.startSessionTimers(expiry - now);

                // Broadcast login to other tabs
                this.broadcastLogin({ token, expiry, sessionId });

                return true;
            } else {
                // Session expired
                this.clearStoredSession();
                return false;
            }
        }

        return false;
    }

    startSessionTimers(timeUntilExpiry) {
        // Clear existing timers
        this.clearTimers();

        // Set renewal timer (5 minutes before expiry)
        const renewalTime = Math.max(timeUntilExpiry - (5 * 60 * 1000), 1000);
        this.renewalTimer = setTimeout(() => {
            this.showRenewalWarning();
        }, renewalTime);

        // Set expiry timer
        this.expiryTimer = setTimeout(() => {
            this.handleSessionExpired();
        }, timeUntilExpiry);
    }

    clearTimers() {
        if (this.renewalTimer) {
            clearTimeout(this.renewalTimer);
            this.renewalTimer = null;
        }
        if (this.expiryTimer) {
            clearTimeout(this.expiryTimer);
            this.expiryTimer = null;
        }
    }

    showRenewalWarning() {
        if (this.warningShown) return;

        this.warningShown = true;

        const warning = document.createElement('div');
        warning.id = 'session-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            font-weight: 500;
            max-width: 300px;
        `;

        warning.innerHTML = `
            <div style="margin-bottom: 0.5rem;">⏰ Session expires in 5 minutes</div>
            <button id="extend-session" style="
                background: white;
                color: #ff9800;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                margin-right: 0.5rem;
            ">Extend Session</button>
            <button id="dismiss-warning" style="
                background: transparent;
                color: white;
                border: 1px solid white;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
            ">Dismiss</button>
        `;

        document.body.appendChild(warning);

        // Add event listeners
        document.getElementById('extend-session').onclick = () => {
            this.extendSession();
            warning.remove();
        };

        document.getElementById('dismiss-warning').onclick = () => {
            warning.remove();
        };
    }

    extendSession() {
        const newExpiry = Date.now() + (30 * 60 * 1000); // 30 minutes from now
        this.updateStoredSession({ expiry: newExpiry });
        this.startSessionTimers(30 * 60 * 1000);
        this.showSuccessMessage('Session extended for 30 minutes');
    }

    handleSessionExpired() {
        this.clearStoredSession();
        this.clearTimers();
        this.broadcastSessionExpired();

        // Show expiry message and reload
        const expiryMsg = document.createElement('div');
        expiryMsg.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #f44336;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            z-index: 10002;
            text-align: center;
            font-weight: 500;
        `;

        expiryMsg.innerHTML = `
            <div style="font-size: 1.2rem; margin-bottom: 1rem;">🔒 Session Expired</div>
            <div>Your session has expired. Please log in again.</div>
        `;

        document.body.appendChild(expiryMsg);

        setTimeout(() => {
            location.reload();
        }, 3000);
    }

    checkSessionActivity() {
        if (!this.lastActivity) return;

        const now = Date.now();
        const inactiveTime = now - this.lastActivity;
        const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

        if (inactiveTime > maxInactiveTime) {
            this.handleSessionExpired();
        }
    }

    createSession(username, password) {
        const token = this.generateToken(username, password);
        const expiry = Date.now() + (30 * 60 * 1000); // 30 minutes
        const sessionData = {
            token,
            expiry,
            sessionId: this.sessionId,
            lastActivity: Date.now(),
            username
        };

        this.storeSession(sessionData);
        this.startSessionTimers(30 * 60 * 1000);
        this.broadcastLogin(sessionData);

        return sessionData;
    }

    generateToken(username, password) {
        const timestamp = Date.now();
        const sessionPart = this.sessionId;
        const data = `${username}:${password}:${timestamp}:${sessionPart}`;
        return btoa(data);
    }

    verifyToken(token) {
        try {
            const decoded = atob(token);
            const parts = decoded.split(':');
            if (parts.length === 4) {
                const [username, password, timestamp, sessionPart] = parts;

                // Check if session matches
                if (sessionPart !== this.sessionId) {
                    return false;
                }

                // Check if token is not too old (max 31 minutes to account for clock skew)
                const tokenTime = parseInt(timestamp);
                const now = Date.now();
                if (now - tokenTime > 31 * 60 * 1000) {
                    return false;
                }

                const expectedToken = this.generateToken(username, password);
                return token === expectedToken;
            }
        } catch (e) {
            console.warn('Token verification failed');
        }
        return false;
    }

    storeSession(sessionData) {
        const dataToStore = {
            ...sessionData,
            lastActivity: this.lastActivity || Date.now()
        };
        localStorage.setItem('mkdocs_auth_session', JSON.stringify(dataToStore));
    }

    getStoredSession() {
        try {
            const stored = localStorage.getItem('mkdocs_auth_session');
            return stored ? JSON.parse(stored) : null;
        } catch (e) {
            console.warn('Failed to parse stored session');
            return null;
        }
    }

    updateStoredSession(updates) {
        const currentSession = this.getStoredSession();
        if (currentSession) {
            const updatedSession = { ...currentSession, ...updates };
            this.storeSession(updatedSession);
        }
    }

    clearStoredSession() {
        localStorage.removeItem('mkdocs_auth_session');
        this.sessionId = null;
        this.lastActivity = null;
        this.clearTimers();
    }

    broadcastLogin(sessionData) {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({
                type: 'login',
                data: { sessionId: sessionData.sessionId }
            });
        }
    }

    broadcastLogout() {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ type: 'logout' });
        }
    }

    broadcastSessionExpired() {
        if (this.broadcastChannel) {
            this.broadcastChannel.postMessage({ type: 'session_expired' });
        }
    }

    handleRemoteLogout() {
        this.clearStoredSession();
        location.reload();
    }

    handleRemoteLogin(data) {
        // Update our session ID if another tab logged in
        if (data.sessionId && data.sessionId !== this.sessionId) {
            this.sessionId = data.sessionId;
        }
    }

    showSuccessMessage(message) {
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
        success.textContent = '✅ ' + message;
        document.body.appendChild(success);

        setTimeout(() => {
            success.remove();
        }, 3000);
    }

    destroy() {
        this.clearTimers();
        if (this.broadcastChannel) {
            this.broadcastChannel.close();
        }
    }
}

// Authentication System for MkDocs
class AuthManager {
    constructor() {
        this.overlay = null;
        this.isAuthenticated = false;
        this.sessionManager = new SessionManager();
        this.init();
    }

    init() {
        // Check if user is already authenticated via session manager
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
        const sessionValid = this.sessionManager.checkExistingSession();

        if (sessionValid) {
            const sessionData = this.sessionManager.getStoredSession();
            if (sessionData && sessionData.token) {
                this.isAuthenticated = this.sessionManager.verifyToken(sessionData.token);
            }
        }

        return this.isAuthenticated;
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
                // Create session using session manager
                this.sessionManager.createSession(username, password);

                this.isAuthenticated = true;
                this.hideAuthOverlay();

                // Show success message
                this.sessionManager.showSuccessMessage('Login successful!');
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

    logout() {
        this.sessionManager.clearStoredSession();
        this.sessionManager.broadcastLogout();
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