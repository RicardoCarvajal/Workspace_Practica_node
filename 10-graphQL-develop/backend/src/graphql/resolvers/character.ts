import { IResolvers } from "apollo-server-express";
import { Db, ObjectID } from "mongodb";
import data from "../../data/data.json";
import {
  CHERACTERS_COLLECTION,
  GAMES_COLLECTION,
} from "../../database/collections";

export const characterResolver: IResolvers = {
  Query: {
    async getCharacters(root: void, args: void, context: Db) {
      try {
        return await context.collection(CHERACTERS_COLLECTION).find().toArray();
      } catch (error) {
        console.log(error);
      }
    },
    getCharacter(parent: void, args: any) {
      const [found] = data.characters.filter((ch) => ch._id === args._id);
      return found;
    },
  },
  Mutation: {
    async createCharacter(parent: void, args: any, context: Db) {
      try {
        await context
          .collection(CHERACTERS_COLLECTION)
          .insertOne(args.Character);
        return "El registro se guardo correctamente";
      } catch (error) {
        console.log(error);
      }
    },
  },
  Character: {
    async games(root: any, args: void, context: Db) {
      console.log(root.games);
      const list = root.games.map(async (id: string) => {
        return await context
          .collection(GAMES_COLLECTION)
          .findOne({ _id: new ObjectID(id) });
      });
      return list;
    },
  },
};
