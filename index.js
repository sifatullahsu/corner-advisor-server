const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;
const cluster = process.env.DB_CLUSTER;


const uri = `mongodb+srv://${user}:${pass}@${cluster}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

const run = async () => {
  try {
    const db = client.db('corner-advisor');
    const serviceCollection = db.collection('services');

    app.get('/services', async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const size = parseInt(req.query.size) || 10;
      const skip = (page - 1) * size;

      const query = {}
      const cursor = serviceCollection.find(query);
      const services = await cursor.skip(skip).limit(size).toArray();

      const totalRecord = await serviceCollection.estimatedDocumentCount();
      const total = Math.ceil(totalRecord / size);

      const data = {
        data: services,
        pagination: {
          total,
          current: page,
        }
      }

      res.send(data);
    });

    app.get('/services/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) }

      const service = await serviceCollection.findOne(query);
      return res.send(service);
    });

  }
  finally {

  }
}
run().catch(err => console.error(err));


app.get('/', (req, res) => {
  res.send({ message: 'The corner advisor server is Running...' });
});

app.listen(port, () => {
  console.log(`The server running on ${port}`);
});