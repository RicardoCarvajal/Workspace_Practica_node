import { GraphQLSchema } from "graphql";
import { mergeSchemas } from "apollo-server-express";
import "graphql-import-node";
import character from "./schema/character.graphql";
import game from "./schema/game.graphql";
import developer from "./schema/developer.graphql";
import { characterResolver } from "./resolvers/character";
import { gameResolver } from "./resolvers/game";
import { developerResolver } from "./resolvers/developer";

export const schema: GraphQLSchema = mergeSchemas({
  schemas: [character, game, developer],
  resolvers: [characterResolver, gameResolver, developerResolver],
});
