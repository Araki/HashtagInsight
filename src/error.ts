export type TErrorCode = 400 | 403 | 409;

export type TErrorType = 'duplicate' | 'required' | 'invalid' | 'permission';

interface IErrorResponse {
  column: string;
  type: TErrorType;
}

export class CustomError extends Error {
  constructor(public code: TErrorCode, public errors: IErrorResponse[] = [], message?: string) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}