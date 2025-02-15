const middy = (handler = () => { }, plugin) => {
  plugin?.beforePrefetch?.()
  const beforeMiddlewares = []
  const afterMiddlewares = []
  const onErrorMiddlewares = []

  const instance = (event = {}, context = {}) => {
    plugin?.requestStart?.()
    const request = {
      event,
      context,
      response: undefined,
      error: undefined,
      internal: {}
    }

    const middyPromise = async () => {
      try {
        await runMiddlewares(beforeMiddlewares, request, plugin)
        // Check if before stack doesn't need to exit early
        if (request.response === undefined) {
          plugin?.beforeHandler?.()
          request.response = await handler(request.event, request.context)
          plugin?.afterHandler?.()
          await runMiddlewares(afterMiddlewares, request, plugin)
        }
      } catch (e) {
        // Reset response changes made by after stack before error thrown
        request.response = undefined
        request.error = e
        try {
          await runMiddlewares(onErrorMiddlewares, request, plugin)
          // Catch if onError stack hasn't handled the error
          if (request.response === undefined) {
            throw request.error
          }
        } catch (e) {
          // Save error that wasn't handled
          e.originalError = request.error
          request.error = e
          throw request.error
        }
      } finally {
        await plugin?.requestEnd?.()
      }
      return request.response
    }
    return middyPromise()
  }

  instance.use = (middlewares) => {
    if (Array.isArray(middlewares)) {
      middlewares.forEach((middleware) => instance.applyMiddleware(middleware))
      return instance
    } else if (typeof middlewares === 'object') {
      return instance.applyMiddleware(middlewares)
    }
    throw new Error('Middy.use() accepts an object or an array of objects')
  }

  instance.applyMiddleware = (middleware) => {
    if (typeof middleware !== 'object') {
      throw new Error('Middleware must be an object')
    }

    const { before, after, onError } = middleware

    if (!before && !after && !onError) {
      throw new Error(
        'Middleware must contain at least one key among "before", "after", "onError"'
      )
    }

    if (before) instance.before(before)
    if (after) instance.after(after)
    if (onError) instance.onError(onError)

    return instance
  }

  // Inline Middlewares
  instance.before = (beforeMiddleware) => {
    beforeMiddlewares.push(beforeMiddleware)
    return instance
  }
  instance.after = (afterMiddleware) => {
    afterMiddlewares.unshift(afterMiddleware)
    return instance
  }
  instance.onError = (onErrorMiddleware) => {
    onErrorMiddlewares.push(onErrorMiddleware)
    return instance
  }

  instance.__middlewares = {
    before: beforeMiddlewares,
    after: afterMiddlewares,
    onError: onErrorMiddlewares
  }

  return instance
}

const runMiddlewares = async (middlewares, request, plugin) => {
  const stack = Array.from(middlewares)
  if (!stack.length) return
  const nextMiddleware = stack.shift()
  plugin?.beforeMiddleware?.(nextMiddleware?.name)
  const res = await nextMiddleware?.(request)
  plugin?.afterMiddleware?.(nextMiddleware?.name)
  if (res !== undefined) {
    // short circuit chaining and respond early
    request.response = res
    return
  }
  return runMiddlewares(stack, request, plugin)
}

module.exports = middy
