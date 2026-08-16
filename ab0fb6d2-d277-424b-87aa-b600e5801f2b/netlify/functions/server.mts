// Netlify Functions v2 entry.
//
// The TanStack Start build emits a standard fetch handler at
// dist/server/server.js. This function hands every request that the static
// publish directory does not already serve to that handler, which is what
// gives the site server rendered HTML on Netlify.
import server from "../../dist/server/server.js";

export default async function handler(request: Request): Promise<Response> {
  return server.fetch(request);
}

export const config = {
  path: "/*",
  preferStatic: true,
};
