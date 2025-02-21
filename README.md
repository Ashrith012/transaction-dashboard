# Transaction Dashboard

A MERN stack application for managing and visualizing transaction data.

## Features

- Transaction listing with search and pagination
- Monthly statistics
- Price range distribution (Bar Chart)
- Category distribution (Pie Chart)
- Database initialization from external API
- Responsive Material-UI design

## Tech Stack

- MongoDB
- Express.js
- React.js
- Node.js
- Material-UI
- Chart.js

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Start MongoDB server

4. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

5. Start the frontend server:
   ```bash
   cd frontend
   npm start
   ```

6. Open http://localhost:3000 in your browser

## API Endpoints

- GET /api/initialize-database - Initialize database with sample data
- GET /api/transactions - Get transactions with search and pagination
- GET /api/statistics/:month - Get monthly statistics
- GET /api/bar-chart/:month - Get price range distribution
- GET /api/pie-chart/:month - Get category distribution

## Environment Variables

Create a .env file in the backend directory:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/transaction_db
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
