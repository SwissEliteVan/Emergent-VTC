const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('VTC Solo Backend is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});