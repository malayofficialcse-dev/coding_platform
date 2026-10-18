# Profile GraphQL API

The gateway exposes the authenticated and public profile aggregation at `POST /api/graphql`.

## Layout

- `schema.gql` defines the profile page contract.
- `profile/resolvers.js` resolves only the requested profile fields and fans out to the owning services concurrently.
- `profile/profile.api.js` handles bounded, authenticated service-to-service HTTP requests.
- `context.js` derives viewer identity from a verified bearer token; client-supplied identity headers are not used for GraphQL authorization.
- `operation-limits.js` limits field count, aliases, and query depth.
- `security/jwt.js` shares the gateway's JWT verification behavior with its existing REST proxy.

`myProfilePage` requires a valid token and the requested ID must match the token subject. `profilePage` supports the public `/profile/:id` route. Learning records are fetched only for the profile owner or an `admin`; anonymous and other viewers receive no learning records. Optional downstream sections fall back independently so one unavailable service does not discard the rest of the page.

The React operations and fragments live under `client/src/graphql/profile`. Keep the page operations separate so each screen requests only the fields it renders.
