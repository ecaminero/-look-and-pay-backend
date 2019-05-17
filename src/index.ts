import * as bodyParser from 'body-parser';
import * as cors from 'cors';
import { DateTime, Interval } from 'luxon';
import { GraphQLServer } from 'graphql-yoga';
import { default as typeDefs } from './graphql/typeDefs'
import { default as resolvers } from './graphql/resolvers'
import { startDB, models } from './db';

require('dotenv').config();

const db = startDB({
  user: process.env.MONGO_USERNAME || 'graphql', 
  pwd: process.env.MONGO_PASSWORD || 'graphql', 
  db: process.env.MONGO_DATABASE || 'look-and-pay-backend',
  host: process.env.MONGO_SERVICE_HOST || 'mongodb',
  url:process.env.MONGO_SERVICE_URL || 'localhost:27017' 
});

const pkg = require('../package.json');

const context = req => ({ ...req, db, models });

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context
});

const today = DateTime.utc();  

server.express.use( bodyParser.json({limit: "500mb"}) );
server.express.use( bodyParser.urlencoded({limit: "500mb", extended: true}) ); 
server.express.use(cors());

server.express.get('/health', (req, res) => {
  const { hours = 0, minutes = 0, seconds = 0 } = Interval.fromDateTimes(today, DateTime.utc())
    .toDuration(['hours', 'minutes', 'seconds'])
    .toObject();
  res.status(200).send({
    appName: pkg.name,
    version: pkg.version,
    startTime: today.toISO(),
    uptime: `${hours}h ${minutes}m:${Math.round(seconds)}s`
  });
});

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';
const opts = {
  port: port,
  cors: {
    origin: '*'
  },
  endpoint: '/graphql'
};
server.start(opts, () => console.log(`Server is running on http://${host}:${opts.port}`));

console.log(`AppNameLookAndPay: ${pkg.name}`);
console.log(`AppVersionLookAndPay: ${pkg.version}`);
console.log(`NodeNameLookAndPay: ${process.env.ALPHA_SERVICE_BASE_NODE_NAME}`);
console.log(`PodNameLookAndPay: ${process.env.ALPHA_SERVICE_BASE_POD_NAME}`);
console.log(`PodIdALookAndPay: ${process.env.ALPHA_SERVICE_BASE_POD_IP}`);
console.log(`PodServiceAccountLookAndPay: ${process.env.ALPHA_SERVICE_BASE_POD_SERVICE_ACCOUNT}`);

console.log(`Running on http://${host}:${port}`);
