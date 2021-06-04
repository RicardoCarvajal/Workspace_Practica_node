import express from "express";
import cors from "cors";
import { ApolloServer } from "apollo-server-express";
import { schema } from "./graphql";
import MongoLib from "./database";
import config from "./config";

const app = express();

app.use(cors());

const server = new ApolloServer({
  schema,
  playground: true,
  introspection: true,
  context: async () => new MongoLib().connect(),
});

server.applyMiddleware({ app });

app.listen(config.port, () => {
  console.log("http://localhost:" + config.port + "/grahpql");
});

/*https://www.youtube.com/watch?v=P41iSO3R_6E&list=PL4n0o4LiEbG-UAnyVmjhZe0WhpjyYig3q&index=11 --- 25:18*/
