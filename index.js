const express = require('express');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


app.get('/', (req, res) => {
  res.send({ message: 'The corner advisor server is Running...' });
});

app.listen(port, () => {
  console.log(`The server running on ${port}`);
});