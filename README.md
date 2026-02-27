# FinOpenPOS - POS and Inventory Management System

This is a Point of Sale (POS) and Inventory Management System built with Next.js, React, and MongoDB. It provides a comprehensive solution for managing products, customers, orders, and transactions in a retail or small business setting.

This particular iteration embraces the spirit of open-source development, making it freely available for the community to use, modify, and improve upon.

## Features

- **Dashboard**: Overview of key metrics and charts (Revenue, Profit, Expenses)
- **Products Management**: Add, edit, delete, and view products with stock tracking
- **Customer Management**: Manage customer information and status
- **Order Management**: Create and manage orders with embedded transaction history
- **Point of Sale (POS)**: Quick and easy sales processing with real-time stock updates
- **User Authentication**: Secure login and signup system powered by NextAuth.js

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: MongoDB with Mongoose (ODM)
- **Authentication**: NextAuth.js (Auth.js) v5
- **UI Components**: Shadcn UI & Lucide Icons
- **Charts**: Recharts

## Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- A MongoDB database (Atlas or local instance)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/your-repo/FinOpenPOS.git
cd FinOpenPOS
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory and add the following:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/finopenpos?retryWrites=true&w=majority

# NextAuth Configuration
# You can generate a secret using: npx auth secret
AUTH_SECRET=your_generated_secret_here
NEXTAUTH_URL=http://localhost:3000
```

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `src/app/`: Next.js app router pages and API routes
- `src/models/`: Mongoose schemas for MongoDB
- `src/components/`: Reusable React components and UI elements
- `src/lib/`: Database connection utilities and configuration
- `src/auth.ts`: NextAuth.js configuration

## Key Pages

- `/admin`: Main dashboard with financial overview
- `/admin/products`: Product management
- `/admin/customers`: Customer management
- `/admin/orders`: Order history
- `/admin/pos`: Interactive Point of Sale interface

## Data Architecture (NoSQL)

The project uses MongoDB with the following collections:

- `users`: User accounts and authentication data
- `products`: Product catalog and inventory levels
- `customers`: Customer profiles and status
- `orders`: Sales records (Order items are embedded for performance)
- `transactions`: Financial ledger (Income/Expenses)

## Authentication

Authentication is handled via **NextAuth.js**. The application uses a Credentials provider for email/password login. New users can sign up directly from the login page.

## Transition from Supabase

This project has been migrated from Supabase (PostgreSQL) to MongoDB (NoSQL) to support flexible data structures and easier horizontal scaling. Details of the migration can be found in `TRANSITION_PLAN.md`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
