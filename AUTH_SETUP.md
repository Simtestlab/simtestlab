# Authentication Setup Guide

This documentation site is protected with a login system. Follow these steps to configure authentication:

## Setting up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

### Required Secrets:

- **`DOCS_USERNAME`**: The username for accessing the documentation
  - Example value: `admin` or `viewer`
  - This will be the username users need to enter

- **`DOCS_PASSWORD`**: The password for accessing the documentation
  - Example value: `securePassword123!`
  - This will be the password users need to enter

### Example Configuration:

```
DOCS_USERNAME = admin
DOCS_PASSWORD = mySecurePassword2025!
```

## How It Works

1. **Build Time**: During GitHub Actions deployment, the credentials are securely injected into the HTML
2. **Runtime**: When users visit the site, they're prompted for login
3. **Authentication**: Credentials are validated client-side against the injected values
4. **Session**: Successful login creates a 24-hour session stored in browser localStorage

## Security Features

- ✅ Credentials stored securely in GitHub Secrets (not in code)
- ✅ Client-side authentication with session management
- ✅ Protection against right-click, keyboard shortcuts, and drag operations
- ✅ 30-minute session timeout
- ✅ Dark mode compatible login interface

## Default Fallback

If secrets are not configured, the system falls back to:
- Username: `admin`
- Password: `password`

⚠️ **Important**: Change these defaults by setting up GitHub Secrets!

## Testing Locally

To test authentication locally without GitHub Actions:

1. Set environment variables:
   ```bash
   export MKDOCS_AUTH_USERNAME="your_username"
   export MKDOCS_AUTH_PASSWORD="your_password"
   ```

2. Build the site:
   ```bash
   mkdocs build
   ```

3. Serve locally:
   ```bash
   mkdocs serve
   ```

The login screen will appear when you access the site.