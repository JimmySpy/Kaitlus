# Kaitlus

A Node.js web application with user authentication, MySQL database, deployed on Railway.

## Features

- 🏠 Homepage with modern UI
- 🔐 User registration and login
- 🔒 Secure password hashing with bcrypt
- 📊 User dashboard
- 🗄️ MySQL database
- ☁️ Ready for Railway deployment

## Local Development

### Prerequisites

- Node.js 18+
- MySQL 8.0+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/kaitlus.git
   cd kaitlus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` with your MySQL credentials:
   ```
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=kaitlus
   SESSION_SECRET=your-secret-key
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## Deploy to Railway

### Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/kaitlus.git
   git push -u origin main
   ```

### Step 2: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `kaitlus` repository

### Step 3: Add MySQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add MySQL"**
3. Railway will automatically create a MySQL database

### Step 4: Connect Your App to MySQL

1. Click on your web service (not the database)
2. Go to **"Variables"** tab
3. Click **"Add Reference"** and add these from your MySQL service:
   - `MYSQLHOST`
   - `MYSQLPORT`
   - `MYSQLUSER`
   - `MYSQLPASSWORD`
   - `MYSQLDATABASE`

4. Add a custom variable:
   - `SESSION_SECRET` = (generate a random string)

### Step 5: Deploy

Railway will automatically deploy your app. Click on the deployment to see logs.

To get a public URL:
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**

## Project Structure

```
kaitlus/
├── config/
│   └── database.js      # MySQL connection config
├── public/
│   └── css/
│       └── style.css    # Styles
├── routes/
│   └── auth.js          # Login/register routes
├── views/
│   ├── index.ejs        # Homepage
│   ├── login.ejs        # Login page
│   ├── register.ejs     # Registration page
│   └── dashboard.ejs    # User dashboard
├── .env.example         # Environment template
├── .gitignore
├── package.json
├── railway.json         # Railway config
├── README.md
└── server.js            # Main server file
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `MYSQL_HOST` | MySQL server host |
| `MYSQL_PORT` | MySQL server port (default: 3306) |
| `MYSQL_USER` | MySQL username |
| `MYSQL_PASSWORD` | MySQL password |
| `MYSQL_DATABASE` | Database name |
| `SESSION_SECRET` | Secret for session encryption |
| `PORT` | Server port (Railway sets this) |

## License

MIT
