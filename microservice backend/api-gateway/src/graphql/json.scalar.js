import { GraphQLScalarType, valueFromASTUntyped } from "graphql";

export const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "A JSON value returned by a downstream service.",
  serialize: (value) => value,
  parseValue: (value) => value,
  parseLiteral: (ast) => valueFromASTUntyped(ast),
});
