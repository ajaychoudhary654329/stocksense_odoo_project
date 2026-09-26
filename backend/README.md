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

### 1. Local MongoDB Replica Set and Environment

The StockSense stock workflows use MongoDB transactions when available. On Windows, `start-local.ps1` starts a user-owned single-node replica set on port `27018`, initializes it on first use, and then starts the API. It stores database files under `%LOCALAPPDATA%\StockSenseMongo\rs0` and leaves the MongoDB Windows service on port `27017` untouched.

Run from PowerShell in the backend folder:

```powershell
.\start-local.ps1
```

The script uses `backend/.env` for stable settings. For manual setup, copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.

### 2. Install Dependencies

```bash
npm install
```

### 3. Run the API Manually

```bash
npm run dev
```

The API server listens on `http://localhost:5000`. Ensure the `rs0` MongoDB member from `start-local.ps1` is running first.

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
