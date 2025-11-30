import { Response } from "express";
import { z } from "zod";

type Status = "success" | "error";

class ApiResponse<T = unknown> {
  static success<T>(
    data: T,
    message: string = "Request successful",
    statusCode: number = 200,
    meta: Record<string, unknown> = {},
    schema?: z.ZodSchema<T>,
  ): ApiResponse<T> {
    return new ApiResponse<T>("success", statusCode, message, data, meta, schema);
  }

  static error(
    statusCode: number,
    message: string,
    data: unknown | null = null,
    errorCode: string | null = null,
    meta: Record<string, unknown> = {},
    schema?: z.ZodSchema,
  ): ApiResponse<unknown> {
    const fullMeta = errorCode ? { errorCode, ...meta } : meta;
    return new ApiResponse<unknown>("error", statusCode, message, data, fullMeta, schema);
  }

  constructor(
    public status: Status,
    public statusCode: number,
    public message: string,
    public data: T,
    public meta: Record<string, unknown>,
    public schema?: z.ZodSchema<T>,
  ) {
    this.meta = { timestamp: new Date().toISOString(), ...meta };

    // Make schema non-enumerable so it doesn't appear in JSON serialization
    if (this.schema) {
      Object.defineProperty(this, "schema", { enumerable: false });
    }

    // Validate data against schema if provided
    if (this.schema && this.data !== null && this.data !== undefined) {
      const validationResult = this.schema.safeParse(this.data);
      if (!validationResult.success) {
        // If validation fails, throw an error (internal server error)
        // This ensures we never send data that doesn't match our contract
        throw new Error(`ApiResponse data validation failed: ${validationResult.error.message}`);
      }
      // Use the parsed data to ensure type safety (strips unknown fields)
      this.data = validationResult.data;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  send(res: Response): any {
    return res.status(this.statusCode).json(this);
  }
}

export default ApiResponse;
