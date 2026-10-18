import { GraphQLError } from "graphql";

const MAX_FIELDS = 160;
const MAX_ALIASES = 20;
const MAX_DEPTH = 8;

export function operationLimitsRule(context) {
  let fieldCount = 0;
  let aliasCount = 0;
  let depth = 0;
  let fieldLimitReported = false;
  let aliasLimitReported = false;
  let depthLimitReported = false;

  return {
    Field: {
      enter(node) {
        fieldCount += 1;
        depth += 1;
        if (node.alias) aliasCount += 1;

        if (fieldCount > MAX_FIELDS && !fieldLimitReported) {
          fieldLimitReported = true;
          context.reportError(new GraphQLError(`Operation exceeds the ${MAX_FIELDS}-field limit.`));
        }
        if (aliasCount > MAX_ALIASES && !aliasLimitReported) {
          aliasLimitReported = true;
          context.reportError(new GraphQLError(`Operation exceeds the ${MAX_ALIASES}-alias limit.`));
        }
        if (depth > MAX_DEPTH && !depthLimitReported) {
          depthLimitReported = true;
          context.reportError(new GraphQLError(`Operation exceeds the maximum depth of ${MAX_DEPTH}.`));
        }
      },
      leave() {
        depth -= 1;
      },
    },
  };
}
