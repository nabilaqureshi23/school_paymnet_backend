# 📘 School Payment System (Backend)

<p align="center">
  <img src="https://nestjs.com/img/logo-small.svg" width="120" alt="NestJS Logo" />
</p>

<p align="center">
  A <strong>NestJS + MongoDB</strong> backend for managing <strong>school fee payments</strong>, integrated with the <strong>Edviron Payment Gateway</strong>.
  <br>
  It supports <strong>JWT-based authentication</strong>, <strong>transaction management</strong>, <strong>webhook handling</strong>, and <strong>payment tracking</strong>.
</p>

<p align="center">
  <a href="https://github.com/username/school-payment-system/actions"><img src="https://img.shields.io/github/actions/workflow/status/username/school-payment-system/ci.yml?branch=main" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@nestjs/core"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NestJS Version"></a>
  <a href="https://github.com/username/school-payment-system/blob/main/LICENSE"><img src="https://img.shields.io/github/license/username/school-payment-system.svg" alt="License"></a>
  <img src="https://img.shields.io/badge/Node.js-16%2B-green" alt="Node Version">
  <img src="https://img.shields.io/badge/MongoDB-Atlas-brightgreen" alt="MongoDB">
  <img src="https://img.shields.io/badge/Deployed%20on-Render-46E3B7" alt="Deployed on Render">
</p>

## 🚀 Tech Stack

* [NestJS](https://nestjs.com/) — backend framework
* [MongoDB Atlas](https://www.mongodb.com/atlas) — cloud database
* [Mongoose](https://mongoosejs.com/) — ODM for MongoDB
* [JWT (jsonwebtoken)](https://jwt.io/) — authentication
* [Passport.js](http://www.passportjs.org/) — JWT strategy
* [Axios](https://axios-http.com/) — Edviron API calls

## 🌍 Live API (Hosted on Render)

**Base URL:**

```
https://school-paymnet-backend.onrender.com
```

## ⚙️ Local Setup Instructions

### 1. Clone Repo

```bash
git clone https://github.com/nabilaqureshi23/school_paymnet_backend.git
cd school-payment-system/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in `/backend`:

```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority

JWT_SECRET=your_super_secret_jwt_key_12345
JWT_EXPIRES_IN=1d

PG_KEY=edvtest01
API_KEY=<edviron_api_key>
SCHOOL_ID=<school_id>

PAYMENT_API_BASE_URL=https://dev-vanilla.edviron.com/erp
DEFAULT_CALLBACK_URL=https://google.com

PORT=3000
```

### 4. Run Server Locally

```bash
npm run start:dev
```

Server runs at:

```
http://localhost:3000
```

## ✅ API Endpoints

### 🔹 Authentication

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login, returns JWT token |

### 🔹 Payments

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| POST | `/create-payment` | ✅ | Create payment request, returns payment URL |
| POST | `/webhook` | ❌ | Handle payment gateway webhook (Edviron calls this) |
| GET | `/transaction-status/:id` | ✅ | Check status of a transaction |

### 🔹 Transactions

| Method | Endpoint | Protected | Description |
|--------|----------|-----------|-------------|
| GET | `/transactions?page=1&limit=10` | ✅ | Get paginated list of transactions |
| GET | `/transactions/school/:schoolId` | ✅ | Get transactions by school |

## 🔑 Authentication Flow

1. **Register User** → `POST /auth/register`
2. **Login** → `POST /auth/login` → returns `access_token`
3. **Use Token** → add header:

   ```
   Authorization: Bearer <access_token>
   ```

## 🔄 Payment Flow

1. **Create Payment** → `POST /create-payment`

   * Payload: `{ school_id, amount, student_info }`
   * Returns: `payment_url`

2. **Redirect User** → frontend redirects user to `payment_url`.

3. **Webhook Handling** → Edviron calls `POST /webhook`

   * Payload stored in **webhooklogs**
   * Updates **orderstatuses**

4. **Check Status** → `GET /transaction-status/:id`

## 🧪 Testing Live APIs (Render)

### 1. Register

```http
POST https://school-paymnet-backend.onrender.com/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "mypassword123"
}
```

### 2. Login

```http
POST https://school-paymnet-backend.onrender.com/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "mypassword123"
}
```

*Response:*

```json
{
  "access_token": "eyJhbGciOiJIUzI1..."
}
```

### 3. Create Payment

```http
POST https://school-paymnet-backend.onrender.com/create-payment
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "school_id": "65b0e6293e9f76a9694d84b4",
  "amount": 2000,
  "student_info": {
    "name": "John Doe",
    "id": "STU123",
    "email": "john@example.com"
  }
}
```

*Response:*

```json
{
  "payment_url": "https://edviron.com/pay/..."
}
```

### 4. Webhook Simulation (Testing Only)

```http
POST https://school-paymnet-backend.onrender.com/webhook
Content-Type: application/json

{
  "status": 200,
  "order_info": {
    "order_id": "collect_123",
    "order_amount": 2000,
    "transaction_amount": 2200,
    "gateway": "PhonePe",
    "bank_reference": "YESBNK222",
    "status": "success",
    "payment_mode": "upi",
    "payment_details": "success@ybl",
    "payment_message": "payment success",
    "payment_time": "2025-04-23T08:14:21.945+00:00",
    "error_message": "NA"
  }
}
```

### 5. Get Transactions

* **All (Paginated):**

```http
GET https://school-paymnet-backend.onrender.com/transactions?page=1&limit=10
Authorization: Bearer <access_token>
```

* **By School:**

```http
GET https://school-paymnet-backend.onrender.com/transactions/school/65b0e6293e9f76a9694d84b4
Authorization: Bearer <access_token>
```

* **Status:**

```http
GET https://school-paymnet-backend.onrender.com/transaction-status/order_12345
Authorization: Bearer <access_token>
```

## 📊 MongoDB Collections

* **users** → registered users
* **orders** → order info
* **orderstatuses** → payment status updates
* **webhooklogs** → raw webhook payloads

## 📈 Extra Features

* ✅ Pagination & Sorting on `/transactions`
* ✅ Data validation (`class-validator`)
* ✅ Indexed fields (`school_id`, `collect_id`, `custom_order_id`)
* ✅ Secure routes with JWT
* ✅ Robust logging (requests, webhooks, failed transactions)

## 📦 Postman Collection

1. Import: `School-Payment-System-With-Auth.postman_collection.json`
2. Run **Auth → Login** → saves `{{token}}`
3. All protected routes auto-use `{{token}}`

## ✅ Status

* [x] Core backend complete
* [x] MongoDB connected
* [x] JWT Authentication
* [x] Payment API integration
* [x] Webhook handling
* [x] Postman Collection ready
* [x] Deployed on Render

---

<p align="center">
  👉 This README is <strong>production & assessment ready</strong>.
</p>

---

<p align="center">
  <strong>Built with ❤️ for School Payment Management</strong>
</p>

<p align="center">
  <a href="https://github.com/username/school-payment-system">⭐ Star this repo if you found it helpful!</a>
</p>
