import { defineMiddleware } from "astro:middleware";

// www.gabrielreis.dev is attached to the same Worker; send it to the apex.
export const onRequest = defineMiddleware((context, next) => {
  const url = new URL(context.request.url);
  if (url.hostname.startsWith("www.")) {
    url.hostname = url.hostname.slice("www.".length);
    return Response.redirect(url.toString(), 301);
  }
  return next();
});
