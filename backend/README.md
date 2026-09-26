# StockSense API — Backend

Node.js + Express.js + MongoDB backend for the **StockSense** Inventory Management System.

---

## Technical Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JSON Web Tokens (JWT) + bcryptjs
- **Validation**: express-validator
- **CORS**: cors middleware

---

## Directory Structure

```text
backend/
├── src/
│   ├── server.js               # Entry point
│   ├── app.js                  # Express app & route configuration
│   │
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   │
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Warehouse.js
│   │   ├── Location.js
│   │   ├── Receipt.js
│   │   ├── Delivery.js
│   │   ├── Inventory.js
│   │   └── StockMove.js
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── dashboardController.js
│   │   ├── productController.js
│   │   ├── warehouseController.js
│   │   ├── locationController.js
│   │   ├── receiptController.js
│   │   ├── deliveryController.js
│   │   ├── inventoryController.js
│   │   └── moveController.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── productRoutes.js
│   │   ├── warehouseRoutes.js
│   │   ├── locationRoutes.js
│   │   ├── receiptRoutes.js
│   │   ├── deliveryRoutes.js
│   │   ├── inventoryRoutes.js
│   │   └── moveRoutes.js
│   │
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   │
│   └── services/
│       └── inventoryService.js
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## Getting Started

### 1. Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/stocksense
JWT_SECRET=stocksense_hackathon_jwt_secret_key_2026
JWT_EXPIRES_IN=1d
CORS_ORIGIN=*
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Locally

```bash
npm run dev
```

The API server will listen on `http://localhost:5000`.

---

## API Summary

| Module     | Method | Endpoint                 | Auth |
| ---------- | ------ | ------------------------ | ---- |
| System     | `GET`  | `/health`                | No   |
| System     | `GET`  | `/api/health`            | No   |
| Auth       | `POST` | `/api/auth/register`     | No   |
| Auth       | `POST` | `/api/auth/login`        | No   |
| Auth       | `POST` | `/api/auth/forgot-password` | No|
| Auth       | `GET`  | `/api/auth/me`           | Yes  |
| Auth       | `POST` | `/api/auth/logout`       | Yes  |
| Dashboard  | `GET`  | `/api/dashboard`         | Yes  |
| Products   | `GET`  | `/api/products`          | Yes  |
| Products   | `POST` | `/api/products`          | Yes  |
| Products   | `GET`  | `/api/products/:id`      | Yes  |
| Products   | `PUT`  | `/api/products/:id`      | Yes  |
| Products   | `DELETE`| `/api/products/:id`     | Yes  |
| Warehouses | `GET`  | `/api/warehouses`        | Yes  |
| Warehouses | `POST` | `/api/warehouses`        | Yes  |
| Warehouses | `GET`  | `/api/warehouses/:id`    | Yes  |
| Warehouses | `PUT`  | `/api/warehouses/:id`    | Yes  |
| Locations  | `GET`  | `/api/locations`         | Yes  |
| Locations  | `POST` | `/api/locations`         | Yes  |
| Locations  | `GET`  | `/api/locations/:id`     | Yes  |
| Locations  | `PUT`  | `/api/locations/:id`     | Yes  |
| Receipts   | `GET`  | `/api/receipts`          | Yes  |
| Receipts   | `POST` | `/api/receipts`          | Yes  |
| Receipts   | `GET`  | `/api/receipts/:id`      | Yes  |
| Receipts   | `PUT`  | `/api/receipts/:id`      | Yes  |
| Receipts   | `PATCH`| `/api/receipts/:id/status`| Yes |
| Receipts   | `POST` | `/api/receipts/:id/cancel`| Yes |
| Receipts   | `GET`  | `/api/receipts/:id/print` | Yes |
| Deliveries | `GET`  | `/api/deliveries`        | Yes  |
| Deliveries | `POST` | `/api/deliveries`        | Yes  |
| Deliveries | `GET`  | `/api/deliveries/:id`    | Yes  |
| Deliveries | `PUT`  | `/api/deliveries/:id`    | Yes  |
| Deliveries | `PATCH`| `/api/deliveries/:id/status`| Yes|
| Deliveries | `POST` | `/api/deliveries/:id/cancel`| Yes|
| Deliveries | `GET`  | `/api/deliveries/:id/print` | Yes|
| Inventory  | `GET`  | `/api/inventory`         | Yes  |
| Inventory  | `GET`  | `/api/inventory/:productId` | Yes |
| Inventory  | `POST` | `/api/inventory/adjustments` | Yes |
| Moves      | `GET`  | `/api/moves`             | Yes  |
| Moves      | `GET`  | `/api/moves/:id`         | Yes  |

---

## State Machine Rules

### Receipt Workflow:
```text
DRAFT -> READY -> DONE
```
- **When DONE**: Inventory `onHand` is incremented and a `StockMove` of type `IN` is recorded atomically.

### Delivery Workflow:
```text
DRAFT -> WAITING / READY -> DONE
```
- Stock availability is checked: `freeToUse = onHand - reserved`.
- If insufficient stock: status becomes `WAITING` with detailed shortage warnings.
- **When DONE**: Re-validates stock availability, decrements inventory `onHand`, and records a `StockMove` of type `OUT`.
