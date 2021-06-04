import { IResolvers } from "apollo-server-express";
import { Db, ObjectID } from "mongodb";
import {
  GAMES_COLLECTION,
  DEVELOPERS_COLLECTION,
} from "../../database/collections";

export const gameResolver: IResolvers = {
  Query: {
    async getGames(root: void, args: void, context: Db) {
      try {
        return await context.collection(GAMES_COLLECTION).find().toArray();
      } catch (error) {
        console.log(error);
      }
    },
  },
  Mutation: {
    async createGame(parent: void, args: any, context: Db) {
      try {
        await context.collection(GAMES_COLLECTION).insertOne(args.Game);
        return "El registro se guardo correctamente";
      } catch (error) {
        console.log(error);
      }
    },
  },
  Game: {
    async developers(root: any, args: void, context: Db) {
      const list = root.developers.map(async (id: string) => {
        return await context
          .collection(DEVELOPERS_COLLECTION)
          .findOne({ _id: new ObjectID(id) });
      });
      return list;
    },
  },
};
