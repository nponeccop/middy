const defaults = {
  payloadFormatVersion: 1
}

const httpEventNormalizerMiddleware = (opts = {}) => {
  const options = { ...defaults, ...opts }

  const httpEventNormalizerMiddlewareBefore = async (request) => {
    const { event } = request
    let isHttpEvent = false

    switch (options.payloadFormatVersion) {
      case 1:
        isHttpEvent = Object.prototype.hasOwnProperty.call(event, 'httpMethod')
        break
      case 2:
        isHttpEvent =
          Object.prototype.hasOwnProperty.call(event, 'requestContext') &&
          Object.prototype.hasOwnProperty.call(event.requestContext, 'http') &&
          Object.prototype.hasOwnProperty.call(
            event.requestContext.http,
            'method'
          )
        break
      default:
        throw new Error(
          'Unknown API Gateway Payload format. Please use value 1 or 2.'
        )
    }

    if (isHttpEvent) {
      event.queryStringParameters = event.queryStringParameters ?? {}
      event.pathParameters = event.pathParameters ?? {}
      if (options.payloadFormatVersion === 1) {
        event.multiValueQueryStringParameters =
          event.multiValueQueryStringParameters ?? {}
      }
    }
  }

  return {
    before: httpEventNormalizerMiddlewareBefore
  }
}
module.exports = httpEventNormalizerMiddleware
