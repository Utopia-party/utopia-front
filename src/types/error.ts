export interface ApiError {
  response?: {
    data?: {
      code?: string;
      detail?: string;
      message?: string;
    };
  };
  message?: string;
}
