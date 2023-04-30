const cors = require("cors");
const express = require("express");
const typeDefs = require("./schema");
const resolvers = require("./resolvers");
//const { models, db } = require("./db");
const initializeDatabase = require("./db");

const { ApolloServer } = require("apollo-server-express");
const { connect } = require("mongoose");
//import { Pool, Client } from "pg";
const Pool = require("pg").Pool;
//const { typeDefs, resolvers } = require('./graphql');

require("dotenv").config({ path: ".env" });

const PORT = process.env.PORT || 3000;

// const config = {
//   user: "bruh",
//   password: "Shashi@123",
//   database: "postgres",
//   host: "34.173.198.96",
// };

const startServer = async () => {
  //const db = await connectToMongoDB();
  const { models, db } = await initializeDatabase();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context() {
      //({ db });
      return { models, db };
    },
  });

  const app = express();

  //using the graphql server as a middleware for the express server accessible via /graphql endpoint
  server.applyMiddleware({ app });

  //app.use(express.json());
  app.use(express.json({ limit: "50mb" }));
   app.use(
    cors({
      origin: "*",
      credentials: true,
      methods: "GET,OPTIONS,PATCH,DELETE,POST,PUT",
      allowedHeaders: "X-CSRF-Token,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Content-Type,Date,X-Api-Version",
      preflightContinue: true,
      maxAge: 999999999
    })
  );

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send("Something went wrong!");
  });

  //normal endpoints accessible as well
  app.post("/saveRecipe", (req, res) => {
    res.send("Hello World");
  });

  app.listen(PORT, () => {
    console.log(`listening for requests on port ${PORT}`);
  });
};

startServer();
