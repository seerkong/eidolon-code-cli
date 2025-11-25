/**
 * Example API Response Object
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

export class ApiResponseFactory {
  static success<T>(data: T): ApiResponse<T> {
    return {
      code: 200,
      message: 'success',
      data,
    };
  }

  static error(code: number, message: string): ApiResponse {
    return {
      code,
      message,
    };
  }
}
