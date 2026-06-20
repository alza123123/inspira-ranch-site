export const onRequest = async (context) => {
  const url = new URL(context.request.url);
  if (url.hostname === 'www.inspiraranch.us') {
    url.hostname = 'inspiraranch.us';
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
};
