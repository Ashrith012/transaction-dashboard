import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Container, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    TextField,
    Select,
    MenuItem,
    Box,
    Typography,
    Grid,
    Button,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Update API_BASE_URL to use environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const Dashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [selectedMonth, setSelectedMonth] = useState(''); // Empty string for placeholder
    const [searchQuery, setSearchQuery] = useState('');
    const [statistics, setStatistics] = useState({});
    const [barChartData, setBarChartData] = useState([]);
    const [pieChartData, setPieChartData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    useEffect(() => {
        if (selectedMonth) {
            fetchData();
        } else {
            setTransactions([]);
            setStatistics({});
            setBarChartData([]);
            setPieChartData([]);
        }
    }, [selectedMonth, searchQuery, currentPage]);

    const fetchData = async () => {
        try {
            console.log('Fetching data for month:', selectedMonth);
            
            // Fetch transactions
            const transactionsResponse = await axios.get(`${API_BASE_URL}/transactions`, {
                params: {
                    month: selectedMonth,
                    search: searchQuery,
                    page: currentPage
                }
            });
            console.log('Transactions response:', transactionsResponse.data);
            setTransactions(transactionsResponse.data.transactions);
            setTotalPages(transactionsResponse.data.totalPages);

            // Fetch statistics
            const statsResponse = await axios.get(`${API_BASE_URL}/statistics/${selectedMonth}`);
            console.log('Statistics response:', statsResponse.data);
            setStatistics(statsResponse.data);

            // Fetch bar chart data
            const barResponse = await axios.get(`${API_BASE_URL}/bar-chart/${selectedMonth}`);
            console.log('Bar chart response:', barResponse.data);
            setBarChartData(barResponse.data);

            // Fetch pie chart data
            const pieResponse = await axios.get(`${API_BASE_URL}/pie-chart/${selectedMonth}`);
            console.log('Pie chart response:', pieResponse.data);
            setPieChartData(pieResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
            setSnackbar({
                open: true,
                message: `Error fetching data: ${error.message}`,
                severity: 'error'
            });
        }
    };

    const initializeDatabase = async () => {
        try {
            setSnackbar({ open: true, message: 'Initializing database...', severity: 'info' });
            console.log('Sending initialization request...');
            
            const response = await axios.get(`${API_BASE_URL}/initialize-database`);
            console.log('Initialization response:', response.data);
            
            if (response.data.success) {
                setSnackbar({ 
                    open: true, 
                    message: `Database initialized successfully! ${response.data.recordCount} records imported.`, 
                    severity: 'success' 
                });
                
                // Set default month to current month after initialization
                const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
                setSelectedMonth(currentMonth);
                
                // Data will be fetched automatically due to useEffect when selectedMonth changes
            } else {
                throw new Error(response.data.message || 'Initialization failed');
            }
        } catch (error) {
            console.error('Error initializing database:', error);
            setSnackbar({ 
                open: true, 
                message: `Error initializing database: ${error.message}`, 
                severity: 'error' 
            });
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    const barChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Price Range Distribution'
            }
        },
        scales: {
            x: {
                type: 'category',
                title: {
                    display: true,
                    text: 'Price Range'
                }
            },
            y: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Number of Items'
                }
            }
        }
    };

    const pieChartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Category Distribution'
            }
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Transaction Dashboard
                </Typography>
                <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={initializeDatabase}
                >
                    Initialize Database
                </Button>
            </Box>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Box sx={{ mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <TextField
                            fullWidth
                            label="Search transactions"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, description, or price"
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <Select
                            fullWidth
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            displayEmpty
                            renderValue={(selected) => {
                                if (!selected) {
                                    return <Typography sx={{ color: 'text.secondary' }}>Select Month</Typography>;
                                }
                                return months[parseInt(selected) - 1];
                            }}
                            sx={{
                                '& .MuiSelect-select': {
                                    padding: '16.5px 14px',
                                }
                            }}
                        >
                            <MenuItem disabled value="">
                                <Typography sx={{ fontStyle: 'italic' }}>Select Month</Typography>
                            </MenuItem>
                            {months.map((month, index) => (
                                <MenuItem 
                                    key={index} 
                                    value={String(index + 1).padStart(2, '0')}
                                >
                                    {month}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                </Grid>
            </Box>

            <TableContainer component={Paper} sx={{ mb: 3 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Title</TableCell>
                            <TableCell>Description</TableCell>
                            <TableCell>Price</TableCell>
                            <TableCell>Category</TableCell>
                            <TableCell>Sold</TableCell>
                            <TableCell>Image</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                                <TableCell>{transaction.id}</TableCell>
                                <TableCell>{transaction.title}</TableCell>
                                <TableCell>{transaction.description}</TableCell>
                                <TableCell>${transaction.price}</TableCell>
                                <TableCell>{transaction.category}</TableCell>
                                <TableCell>{transaction.sold ? 'Yes' : 'No'}</TableCell>
                                <TableCell>
                                    <img 
                                        src={transaction.image} 
                                        alt={transaction.title} 
                                        style={{ width: '50px', height: '50px' }}
                                    />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Box sx={{ mb: 3 }}>
                <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Statistics - {months[parseInt(selectedMonth) - 1]}
                    </Typography>
                    <Grid container spacing={2}>
                        <Grid item xs={4}>
                            <Typography>Total Sale: ${statistics.totalSaleAmount}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography>Total Sold Items: {statistics.totalSoldItems}</Typography>
                        </Grid>
                        <Grid item xs={4}>
                            <Typography>Total Not Sold Items: {statistics.totalNotSoldItems}</Typography>
                        </Grid>
                    </Grid>
                </Paper>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={6}>
                    {barChartData.length > 0 && (
                        <Paper sx={{ p: 2 }}>
                            <Bar
                                data={{
                                    labels: barChartData.map(item => item.range),
                                    datasets: [{
                                        label: 'Number of Items',
                                        data: barChartData.map(item => item.count),
                                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                                        borderColor: 'rgba(75, 192, 192, 1)',
                                        borderWidth: 1
                                    }]
                                }}
                                options={barChartOptions}
                            />
                        </Paper>
                    )}
                </Grid>
                <Grid item xs={6}>
                    {pieChartData.length > 0 && (
                        <Paper sx={{ p: 2 }}>
                            <Pie
                                data={{
                                    labels: pieChartData.map(item => item.category),
                                    datasets: [{
                                        data: pieChartData.map(item => item.count),
                                        backgroundColor: [
                                            'rgba(255, 99, 132, 0.8)',
                                            'rgba(54, 162, 235, 0.8)',
                                            'rgba(255, 206, 86, 0.8)',
                                            'rgba(75, 192, 192, 0.8)',
                                            'rgba(153, 102, 255, 0.8)',
                                            'rgba(255, 159, 64, 0.8)'
                                        ],
                                        borderColor: [
                                            'rgba(255, 99, 132, 1)',
                                            'rgba(54, 162, 235, 1)',
                                            'rgba(255, 206, 86, 1)',
                                            'rgba(75, 192, 192, 1)',
                                            'rgba(153, 102, 255, 1)',
                                            'rgba(255, 159, 64, 1)'
                                        ],
                                        borderWidth: 1
                                    }]
                                }}
                                options={pieChartOptions}
                            />
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;
