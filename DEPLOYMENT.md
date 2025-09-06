# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at vercel.com)
- GitHub repository with your code

## Deployment Steps

### 1. Environment Variables Setup
Before deploying, you need to set up environment variables in Vercel:

1. Go to your Vercel dashboard
2. Select your project (or import it first)
3. Go to Settings → Environment Variables
4. Add the following variables:

**Required Variables:**
- `NEXT_PUBLIC_API_URL` - Your API endpoint URL
- `NEXT_PUBLIC_APP_URL` - Your app's domain (will be provided by Vercel)

**Optional Variables (add as needed):**
- `DATABASE_URL` - Database connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Same as NEXT_PUBLIC_APP_URL

### 2. Deploy via GitHub
1. Push your code to GitHub
2. Go to vercel.com and click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect it's a Next.js project
5. Click "Deploy"

### 3. Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project root
vercel

# For production deployment
vercel --prod
```

### 4. Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed

## Build Configuration
The project includes:
- ✅ `vercel.json` - Vercel configuration
- ✅ `.env.example` - Environment variables template
- ✅ `.env.local` - Local development variables
- ✅ Proper `.gitignore` settings

## Post-Deployment Checklist
- [ ] Verify all environment variables are set
- [ ] Test all API endpoints work with production URLs
- [ ] Check that all pages load correctly
- [ ] Verify any third-party integrations work
- [ ] Test authentication flows (if applicable)

## Troubleshooting
- If build fails, check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are correctly set
- Check that API endpoints are accessible from Vercel's servers