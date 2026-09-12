# Deployment E-Kantin

## Local

Jalankan MySQL XAMPP, pastikan database `ekantin_db` sudah dibuat dari `database/ekantin_db.sql`, lalu jalankan:

```powershell
npm run dev
```

## Backend

Deploy folder `backend` ke Render atau Railway sebagai Node.js service.

Build command:

```text
npm install
```

Start command:

```text
npm start
```

Environment variables:

```text
PORT=5000
DB_HOST=<host-mysql-cloud>
DB_USER=<user-mysql-cloud>
DB_PASSWORD=<password-mysql-cloud>
DB_NAME=ekantin_db
```

Tes setelah deploy:

```text
https://alamat-backend-anda.example.com/api/health
```

Endpoint harus mengembalikan `status: ok` dan `database: connected`.

## Frontend

Deploy folder `frontend` ke Vercel atau Netlify.

Build command:

```text
npm run build
```

Output directory:

```text
dist
```

Tambahkan environment variable di pengaturan hosting frontend:

```text
VITE_API_URL=https://alamat-backend-anda.example.com/api
```

Jangan memasukkan password database ke frontend. File `.env` lokal juga jangan di-upload ke repository.
