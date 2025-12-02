# Quick Setup Guide

Follow these steps to get the wedding management application running:

## Step 1: Install Dependencies

```bash
npm install
```

This will install:
- Next.js and React
- Prisma ORM
- NextAuth.js
- XLSX for Excel parsing
- TailwindCSS
- TypeScript

## Step 2: Configure Environment

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-change-this"
```

To generate a secure secret:
```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Step 3: Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database and tables
npm run db:push

# Seed with default users
npm run db:seed
```

## Step 4: Start Development Server

```bash
npm run dev
```

## Step 5: Login

Navigate to http://localhost:3000 and login with:

- Email: `bride@wedding.com` (or any of the other roles)
- Password: `password123`

## Default Users

All users have the same password: `password123`

- `bride@wedding.com` - Bride role
- `brother@wedding.com` - Brother role
- `father@wedding.com` - Father role
- `mother@wedding.com` - Mother role

## Testing Excel Import

1. Create an Excel file with columns: `name`, `ladies`, `gents`, `children`
2. Add some sample data:
   ```
   name            | ladies | gents | children
   Ahuja Family    | 2      | 1     | 0
   Sharma Family   | 1      | 2     | 1
   ```
3. Go to "Import Excel" page
4. Upload your file
5. Check the "Guests" page to see imported guests

## Troubleshooting

### Database errors
- Make sure you ran `npm run db:push` after setting up Prisma
- Check that `DATABASE_URL` in `.env` is correct

### Authentication errors
- Verify `NEXTAUTH_SECRET` is set in `.env`
- Make sure you've seeded the database with `npm run db:seed`

### Import errors
- Ensure Excel file has the correct column names (case-sensitive)
- Check that the file is `.xlsx` format
- Verify that `name` column is not empty for rows you want to import

