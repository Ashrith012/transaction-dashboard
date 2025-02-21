const express = require('express');
const router = express.Router();
const axios = require('axios');
const Transaction = require('../models/Transaction');

// Initialize database
router.get('/initialize-database', async (req, res) => {
    try {
        console.log('Starting database initialization...');
        
        // Fetch data from the API
        console.log('Fetching data from API...');
        const response = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        
        if (!response.data || !Array.isArray(response.data)) {
            console.error('Invalid data received from API:', response.data);
            throw new Error('Invalid data received from API');
        }
        
        console.log(`Received ${response.data.length} records from API`);

        // Format the data
        console.log('Formatting data...');
        const formattedData = response.data.map(item => ({
            ...item,
            dateOfSale: new Date(item.dateOfSale)
        }));

        // Clear existing data
        console.log('Clearing existing data...');
        await Transaction.deleteMany({});
        console.log('Existing data cleared');

        // Insert new data
        console.log('Inserting new data...');
        const insertedData = await Transaction.insertMany(formattedData);
        console.log(`Successfully inserted ${insertedData.length} records`);
        
        console.log('Database initialization completed successfully');
        res.json({ 
            success: true,
            message: 'Database initialized successfully',
            recordCount: insertedData.length
        });
    } catch (error) {
        console.error('Error during database initialization:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error initializing database',
            message: error.message,
            details: error.stack
        });
    }
});

// List transactions with search and pagination
router.get('/transactions', async (req, res) => {
    try {
        const { month, search = '', page = 1, perPage = 10 } = req.query;
        const skip = (page - 1) * perPage;

        let query = {};
        if (month) {
            query.$expr = {
                $eq: [{ $month: '$dateOfSale' }, parseInt(month)]
            };
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { price: isNaN(search) ? undefined : Number(search) }
            ].filter(Boolean);
        }

        const transactions = await Transaction.find(query)
            .skip(skip)
            .limit(Number(perPage));

        const total = await Transaction.countDocuments(query);

        res.json({
            transactions,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / perPage)
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching transactions' });
    }
});

// Statistics API
router.get('/statistics/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const monthNum = parseInt(month);
        
        const query = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, monthNum]
            }
        };

        const totalSaleAmount = await Transaction.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$price' } } }
        ]);

        const soldItems = await Transaction.countDocuments({ ...query, sold: true });
        const notSoldItems = await Transaction.countDocuments({ ...query, sold: false });

        res.json({
            totalSaleAmount: totalSaleAmount[0]?.total || 0,
            totalSoldItems: soldItems,
            totalNotSoldItems: notSoldItems
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching statistics' });
    }
});

// Bar chart API
router.get('/bar-chart/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const monthNum = parseInt(month);
        
        const query = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, monthNum]
            }
        };

        const ranges = [
            { min: 0, max: 100 },
            { min: 101, max: 200 },
            { min: 201, max: 300 },
            { min: 301, max: 400 },
            { min: 401, max: 500 },
            { min: 501, max: 600 },
            { min: 601, max: 700 },
            { min: 701, max: 800 },
            { min: 801, max: 900 },
            { min: 901, max: Infinity }
        ];

        const result = await Promise.all(
            ranges.map(async ({ min, max }) => {
                const count = await Transaction.countDocuments({
                    ...query,
                    price: { $gte: min, $lt: max === Infinity ? Number.MAX_VALUE : max }
                });
                return {
                    range: `${min}-${max === Infinity ? 'above' : max}`,
                    count
                };
            })
        );

        res.json(result);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching bar chart data' });
    }
});

// Pie chart API
router.get('/pie-chart/:month', async (req, res) => {
    try {
        const { month } = req.params;
        const monthNum = parseInt(month);
        
        const query = {
            $expr: {
                $eq: [{ $month: '$dateOfSale' }, monthNum]
            }
        };

        const result = await Transaction.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json(result.map(item => ({
            category: item._id,
            count: item.count
        })));
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error fetching pie chart data' });
    }
});

// Combined API
router.get('/combined-data/:month', async (req, res) => {
    try {
        const { month } = req.params;
        
        const [statistics, barChart, pieChart] = await Promise.all([
            axios.get(`http://localhost:5000/api/statistics/${month}`),
            axios.get(`http://localhost:5000/api/bar-chart/${month}`),
            axios.get(`http://localhost:5000/api/pie-chart/${month}`)
        ]);

        res.json({
            statistics: statistics.data,
            barChart: barChart.data,
            pieChart: pieChart.data
        });
    } catch (error) {
        res.status(500).json({ error: 'Error fetching combined data' });
    }
});

module.exports = router;
