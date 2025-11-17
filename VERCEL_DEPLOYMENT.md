# Deploying Outline to Vercel

## ⚠️ Important Limitations

Vercel is a serverless platform optimized for static sites and serverless functions. Outline is a full-stack application with stateful requirements. **This deployment will have significant limitations:**

### Known Issues:
- **Real-time collaboration will NOT work** - WebSockets are not fully supported on Vercel
- **Socket.io connections will fail** - Requires persistent connections
- **Cron jobs won't run** - Serverless functions are stateless
- **Background workers disabled** - No persistent processes
- **Cold starts** - First request may be slow
- **300 second timeout** - Long-running operations may fail

### What Will Work:
- Basic document viewing and editing (without real-time collaboration)
- Authentication
- File uploads (if using S3 storage)
- Search
- User management

## Prerequisites

### 1. External Database Services (REQUIRED)

You cannot use local/containerized databases with Vercel. You need:

**PostgreSQL Database:**
- [Neon](https://neon.tech) - Free tier available
- [Supabase](https://supabase.com) - Free tier available
- [Railway](https://railway.app) - PostgreSQL hosting
- [ElephantSQL](https://www.elephantsql.com) - Managed PostgreSQL

**Redis:**
- [Upstash](https://upstash.com) - Serverless Redis (RECOMMENDED)
- [Redis Cloud](https://redis.com/redis-enterprise-cloud/) - Managed Redis
- [Railway](https://railway.app) - Redis hosting

### 2. S3-Compatible Storage (REQUIRED)

Vercel's serverless functions are stateless, so you MUST use S3:
- AWS S3
- Cloudflare R2
- DigitalOcean Spaces
- Backblaze B2

## Deployment Steps

### Step 1: Build the Application

Before deploying, build the application locally:

```bash
yarn install
yarn build
```

This creates the `build` directory that Vercel will deploy.

### Step 2: Configure Environment Variables

In your Vercel project dashboard, add these environment variables:

#### Required Variables:

```bash
# Application
NODE_ENV=production
URL=https://your-app.vercel.app
PORT=3000

# Security (generate with: openssl rand -hex 32)
SECRET_KEY=your_32_byte_hex_key
UTILS_SECRET=your_utils_secret

# Database (External PostgreSQL REQUIRED)
DATABASE_URL=postgresql://user:password@host:5432/outline
PGSSLMODE=require

# Redis (External Redis REQUIRED - Use Upstash for serverless)
REDIS_URL=redis://your-redis-url:6379

# File Storage (S3 REQUIRED for Vercel)
FILE_STORAGE=s3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_UPLOAD_BUCKET_NAME=your-bucket-name
AWS_S3_UPLOAD_BUCKET_URL=https://your-bucket.s3.amazonaws.com
AWS_S3_ACL=private

# Authentication (At least ONE is required)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
# or
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret

# SSL
FORCE_HTTPS=true
```

#### Optional Variables:

```bash
# Email (SMTP)
SMTP_SERVICE=gmail
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM_EMAIL=noreply@yourdomain.com

# Integrations
SLACK_VERIFICATION_TOKEN=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Monitoring
SENTRY_DSN=

# Language
DEFAULT_LANGUAGE=en_US

# Rate Limiting
RATE_LIMITER_ENABLED=true

# Debugging
DEBUG=
LOG_LEVEL=info
```

### Step 3: Deploy to Vercel

#### Option A: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Import your Git repository
4. Vercel will auto-detect the configuration
5. Add all environment variables
6. Deploy

#### Option C: Via Git Integration

1. Connect your repository to Vercel
2. Push to main branch
3. Vercel auto-deploys

### Step 4: Run Database Migrations

After first deployment, run migrations:

```bash
# SSH into Vercel (not available - see workaround below)
```

**Workaround for migrations:**

Since Vercel doesn't provide SSH access, you need to run migrations locally against your production database:

```bash
# Set production DATABASE_URL locally
export DATABASE_URL=postgresql://user:password@production-host:5432/outline

# Run migrations
yarn db:migrate

# Or use the upgrade command
yarn upgrade
```

**IMPORTANT:** Be extremely careful running migrations against production!

## Post-Deployment Configuration

### Update OAuth Redirect URIs

Update your OAuth app settings with your Vercel URL:

**Google OAuth:**
- Authorized redirect URIs: `https://your-app.vercel.app/auth/google.callback`

**Slack OAuth:**
- Redirect URLs: `https://your-app.vercel.app/auth/slack.callback`

### Update URL Environment Variable

Update the `URL` environment variable in Vercel to match your actual domain:
```
URL=https://your-app.vercel.app
```

Or if using custom domain:
```
URL=https://docs.yourdomain.com
```

## Troubleshooting

### Build Fails

```bash
# Build locally first to catch errors
yarn build
```

Common issues:
- Missing dependencies: Run `yarn install`
- TypeScript errors: Check `yarn lint`
- Out of memory: Vercel build has 3GB limit

### Runtime Errors

**"WebSocket connection failed"**
- Expected - WebSockets don't work on Vercel serverless
- Real-time collaboration is unavailable

**"Database connection timeout"**
- Check DATABASE_URL is correct
- Ensure database allows connections from Vercel IPs
- Use connection pooling (PgBouncer recommended)

**"Redis connection failed"**
- Use Upstash for serverless-compatible Redis
- Check REDIS_URL format

**"Function timeout"**
- Vercel has 300 second limit (5 minutes max)
- Some operations may need optimization

### Performance Issues

**Cold starts:**
- First request after inactivity will be slow
- Consider Vercel Pro for faster cold starts

**Database connection pooling:**
- Use PgBouncer or similar
- Set appropriate connection pool limits:
  ```
  DATABASE_CONNECTION_POOL_MIN=0
  DATABASE_CONNECTION_POOL_MAX=5
  ```

## Monitoring

Check Vercel dashboard for:
- Function logs
- Error rates
- Execution duration
- Bandwidth usage

## Costs

- **Vercel Hobby**: Free (limited)
- **Vercel Pro**: $20/month (recommended for production)
- **Database**: Varies by provider ($0-$50+/month)
- **Redis**: Upstash free tier or $10+/month
- **S3 Storage**: Varies by usage

## Better Alternatives

If you encounter issues with Vercel, consider these alternatives that better support stateful applications:

1. **Railway** - One-click deploy with built-in PostgreSQL/Redis
2. **Render** - Great for Node.js apps, free PostgreSQL
3. **Fly.io** - Excellent for stateful apps
4. **DigitalOcean App Platform** - Simple deployment
5. **Heroku** - Traditional PaaS (Outline already has heroku-postbuild)

## Support

For issues specific to:
- **Outline**: [GitHub Issues](https://github.com/outline/outline/issues)
- **Vercel**: [Vercel Support](https://vercel.com/support)

## Additional Resources

- [Outline Documentation](https://docs.getoutline.com)
- [Vercel Documentation](https://vercel.com/docs)
- [Outline Environment Variables](https://docs.getoutline.com/s/hosting/doc/environment-variables-P4fGjXN8oF)
