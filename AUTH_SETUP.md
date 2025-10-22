# Professional Authentication Setup Guide

This documentation site features a **professional-grade authentication system** with persistent sessions across page navigation, automatic session management, and a polished user experience.

## ✨ Key Features

- 🔐 **Professional Login UI** - Modern design with smooth animations
- 🔄 **Persistent Sessions** - Stay logged in across page navigation (24 hours max)
- ⏰ **Smart Session Management** - Auto-logout after 2 hours of inactivity
- 🎨 **Dark Mode Compatible** - Seamless integration with Material theme
- 📱 **Responsive Design** - Works perfectly on all devices
- 🚫 **Security Features** - Prevents unauthorized access and shortcuts
- 🚪 **Easy Logout** - One-click logout from any page

## Setting up GitHub Secrets

### 1. Access Repository Secrets
1. Go to your GitHub repository: `https://github.com/Simtestlab/simtestlab`
2. Click **"Settings"** tab → **"Secrets and variables"** → **"Actions"**
3. Click **"New repository secret"**

### 2. Required Secrets

#### `DOCS_USERNAME`
- **Purpose**: Username for documentation access
- **Example**: `admin`, `viewer`, `docs-user`
- **Security**: Choose a non-obvious username

#### `DOCS_PASSWORD`
- **Purpose**: Password for documentation access
- **Example**: `MySecurePass2025!`
- **Security**: Use a strong, unique password

### 3. Example Configuration

```
DOCS_USERNAME: admin
DOCS_PASSWORD: MySecurePassword2025!
```

## How It Works

### Build-Time Integration
1. **GitHub Actions** reads secrets securely
2. **Credentials injected** into HTML during build
3. **No secrets exposed** in repository or client-side code

### Runtime Authentication
1. **Page Load**: Authentication check happens immediately
2. **Login Required**: Professional overlay appears with smooth animation
3. **Session Active**: User can navigate freely between pages
4. **Auto-Logout**: Session ends after inactivity or 24-hour limit

### Session Management
- ✅ **Persistent across navigation** - No re-login needed
- ✅ **Activity tracking** - Resets timeout on user interaction
- ✅ **Secure tokens** - Encrypted session validation
- ✅ **Automatic cleanup** - Expired sessions removed

## Security Features

- **Client-Side Protection**: Prevents right-click, keyboard shortcuts, and drag operations
- **Session Encryption**: Secure token generation and validation
- **Activity Monitoring**: Automatic logout on inactivity
- **Secure Injection**: Credentials injected during build, not stored in code

## Testing Locally

### Method 1: Environment Variables
```bash
# Set credentials
export MKDOCS_AUTH_USERNAME="your_username"
export MKDOCS_AUTH_PASSWORD="your_password"

# Build and serve
mkdocs build --clean
mkdocs serve
```

### Method 2: Using Test Script
```bash
# Run the test script
chmod +x test-auth.sh
./test-auth.sh
```

## Default Fallback

If GitHub Secrets are not configured:
- **Username**: `admin`
- **Password**: `password`

⚠️ **Important**: Always configure GitHub Secrets for production use!

## User Experience

### Login Flow
1. **Page Access**: User visits any documentation page
2. **Auth Check**: System verifies existing session
3. **Login Prompt**: Professional overlay appears (500ms delay for smooth UX)
4. **Authentication**: Enter credentials and click "Sign In"
5. **Success**: Smooth transition with success notification
6. **Navigation**: Full access across all pages without re-login

### Session Indicators
- **Logout Button**: Appears in navigation when authenticated
- **Success Notifications**: Confirmation on login
- **Session Warnings**: Automatic logout notifications

## Troubleshooting

### Common Issues

**"Secrets not working"**
- Verify secret names: `DOCS_USERNAME`, `DOCS_PASSWORD`
- Check GitHub Actions permissions
- Ensure workflow re-runs after adding secrets

**"Login not persisting"**
- Check browser localStorage is enabled
- Verify no VPN/proxy interference
- Clear browser cache if needed

**"Build failing"**
- Check workflow logs for credential injection errors
- Verify `mkdocs.yml` syntax
- Ensure all required files are present

## Advanced Configuration

### Custom Session Duration
Modify `auth.js` to change session limits:
```javascript
// Change from 24 hours to custom duration
const sessionDuration = 8 * 60 * 60 * 1000; // 8 hours
```

### Additional Security
The system includes comprehensive protection against:
- Developer tools access (F12, Ctrl+Shift+I)
- Source code viewing (Ctrl+U)
- Page saving (Ctrl+S)
- Content selection and copying
- Right-click context menus

## Deployment

Once configured, the authentication system will:
1. **Automatically activate** on next GitHub Pages deployment
2. **Use secure credentials** from GitHub Secrets
3. **Provide seamless experience** for authorized users
4. **Protect all content** until proper authentication

---

🎉 **Your documentation is now professionally secured with enterprise-grade authentication!**

2. Build the site:
   ```bash
   mkdocs build
   ```

3. Serve locally:
   ```bash
   mkdocs serve
   ```

The login screen will appear when you access the site.