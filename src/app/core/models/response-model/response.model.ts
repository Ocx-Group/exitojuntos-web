export class Response<T = unknown> {
  success: boolean;
  data: T;
  message: string;
  code: number;
  errors: unknown;
}
