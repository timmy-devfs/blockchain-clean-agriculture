const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const app = express();

// middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// test route
app.get('/', (req, res) => {
  res.send('🚀 Farm Service Running');
});

// start server
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});