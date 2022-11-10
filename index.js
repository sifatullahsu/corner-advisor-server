const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

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

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ message: 'Unauthorize access' });
  }

  const token = authorization.split(' ')['1']

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }

    req.decode = decode;
    next();
  });
}

const run = async () => {
  try {
    const db = client.db('corner-advisor');
    const serviceCollection = db.collection('services');
    const reviewCollection = db.collection('reviews');

    app.post('/jwt', async (req, res) => {
      const user = req.body;

      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

      res.send({ token });
    });

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

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        const service = await serviceCollection.findOne(query);

        if (service) {
          res.send(service);
        }
        else {
          res.send({ message: 'No data found..' });
        }
      }
      else {
        res.send({ message: 'No data found..' });
      }
    });

    app.get('/reviews', async (req, res) => {
      const serviceId = req.query.serviceId;

      const query = { serviceId: serviceId }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();

      const data = {
        data: reviews
      }

      res.send(data);
    });

    app.get('/get-reviews-by-email/', verifyJWT, async (req, res) => {
      const email = req.query.email;

      const query = { "author.email": email }
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();

      const data = {
        data: reviews
      }

      res.send(data);
    });

    app.get('/reviews/:id', async (req, res) => {
      const id = req.params.id;

      if (ObjectId.isValid(id)) {
        const query = { _id: ObjectId(id) }
        const review = await reviewCollection.findOne(query);

        if (review) {
          res.send(review);
        }
        else {
          res.send({ message: 'No data found..' });
        }
      }
      else {
        res.send({ message: 'No data found..' });
      }
    });

    app.post('/review', async (req, res) => {
      const data = req.body;
      const result = await reviewCollection.insertOne(data);

      res.send(result);
    });

    app.post('/service', async (req, res) => {
      const data = req.body;
      const result = await serviceCollection.insertOne(data);

      res.send(result);
    });

    app.patch('/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const updateObject = req.body;

      const query = { _id: ObjectId(id) }
      const updatedDoc = {
        $set: updateObject
      }
      const result = await reviewCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    app.delete('/reviews/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    })
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