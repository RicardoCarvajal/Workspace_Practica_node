import { IResolvers } from "apollo-server-express";
import { Db } from "mongodb";
import { DEVELOPERS_COLLECTION } from "../../database/collections";

export const developerResolver: IResolvers = {
  Query: {
    async getDevelopers(parent: void, args: any, context: Db) {
      try {
        return await context.collection(DEVELOPERS_COLLECTION).find().toArray();
      } catch (error) {
        console.log(error);
      }
    },
  },
  Mutation: {
    async createDeveloper(parent: void, args: any, context: Db) {
      try {
        await context
          .collection(DEVELOPERS_COLLECTION)
          .insertOne(args.Developer);
        return "El registro se guardo correctamente";
      } catch (error) {
        console.log(error);
      }
    },
  },
};
