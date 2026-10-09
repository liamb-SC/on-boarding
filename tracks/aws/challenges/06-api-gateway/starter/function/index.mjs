// With a Lambda *proxy* integration, API Gateway hands the whole HTTP request
// to the function as `event` (httpMethod, path, headers,
// queryStringParameters, body...) and expects an HTTP response back:
//   { statusCode: 200, headers: { ... }, body: '<a string>' }
//
// GET /hello?name=Ada  -> 200, JSON body { "message": "Hello, Ada!" }
// GET /hello           -> 400, JSON body { "error": "name is required" }
// Both with the header content-type: application/json.

export const handler = async (event) => {
  // TODO
};
