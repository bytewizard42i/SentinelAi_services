# 📁 config/ Directory

Configuration templates and environment files for the SentinelAI project.

## 📄 Files

- `.env.production.template` - Production environment template
- `netlify.toml` - Netlify deployment configuration

## 🚀 Usage

### Environment Setup
```bash
# Copy the production template
cp config/.env.production.template .env

# Edit with your values
nano .env
```

### Netlify Deployment
The `netlify.toml` file contains build and deployment settings for Netlify hosting.

## 🔒 Security Notes

- Never commit actual `.env` files with real secrets
- Use the templates as starting points
- Store secrets securely (environment variables, secret managers)

## ⚙️ Required Variables

See the template files for all required configuration variables including:
- Midnight Network settings
- API keys
- Database connections
- Wallet configurations
