/**
 * Categories for HTTP status codes, used for color-coding output.
 */
export enum HttpStatusCategory {
  /** Target server could not be reached */
  Unreachable = "unreachable",

  /** 1xx Informational responses */
  Informational = "informational",

  /** 2xx Success responses */
  Success = "success",

  /** 3xx Redirection responses */
  Redirect = "redirect",

  /** 4xx Client error responses */
  ClientError = "clientError",

  /** 5xx Server error responses */
  ServerError = "serverError",
}

/**
 * Determine the category of an HTTP status code.
 *
 * @param statusCode - The HTTP status code, or null if server unreachable
 * @returns The category for color-coding
 */
export function categorizeStatus(statusCode: number | null): HttpStatusCategory {
  if (statusCode === null) {
    return HttpStatusCategory.Unreachable;
  }

  if (statusCode >= 100 && statusCode < 200) {
    return HttpStatusCategory.Informational;
  }

  if (statusCode >= 200 && statusCode < 300) {
    return HttpStatusCategory.Success;
  }

  if (statusCode >= 300 && statusCode < 400) {
    return HttpStatusCategory.Redirect;
  }

  if (statusCode >= 400 && statusCode < 500) {
    return HttpStatusCategory.ClientError;
  }

  if (statusCode >= 500 && statusCode < 600) {
    return HttpStatusCategory.ServerError;
  }

  // Unknown status codes default to server error
  return HttpStatusCategory.ServerError;
}
