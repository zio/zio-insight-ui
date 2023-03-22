import * as T from "@effect/io/Effect"

/**
 * An error indicating a fetch from an URL failed.
 */
export class FetchError {
  readonly _tag = "FetchError"
  constructor(readonly error: unknown) {}
}

/**
 * An error indicating the response received within a fetch was not
 * a valid JSON.
 */
export class InvalidJsonResponse {
  readonly _tag = "FetchError"
  constructor(readonly error: unknown) {}
}

export const request = (input: RequestInfo, init?: RequestInit | undefined) =>
  T.asyncInterrupt<never, FetchError, Response>((resume) => {
    const controller = new AbortController()

    fetch(input, { ...(init ?? {}), signal: controller.signal })
      .then((response) => {
        return resume(T.succeed(response))
      })
      .catch((error) => {
        return resume(T.fail(new FetchError(error)))
      })

    return T.sync(() => {
      controller.abort()
    })
  })

/**
 *
 * @param response Take a response and return an effect that either succeeds
 * turning the response body into a JSON object or fails with an error
 */
export const jsonFromResponse = (response: Response) =>
  T.attemptCatchPromise(
    () => response.json(),
    (error) => new InvalidJsonResponse(error)
  )
