import ApiResponse from '@/utils/ApiResponse.js';
import { z } from 'zod';
import type { Response } from 'express';

describe('ApiResponse', () => {
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe('success', () => {
    it('should create success response with default values', () => {
      const data = { id: '123', name: 'Test' };
      const response = ApiResponse.success(data);

      expect(response.status).toBe('success');
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('Request successful');
      expect(response.data).toEqual(data);
      expect(response.meta).toHaveProperty('timestamp');
    });

    it('should create success response with custom values', () => {
      const data = { id: '123' };
      const response = ApiResponse.success(
        data,
        'Custom message',
        201,
        { customMeta: 'value' }
      );

      expect(response.statusCode).toBe(201);
      expect(response.message).toBe('Custom message');
      expect(response.meta.customMeta).toBe('value');
    });

    it('should validate data against schema', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const validData = { id: '123', name: 'Test' };
      
      expect(() => {
        ApiResponse.success(validData, 'Success', 200, {}, schema);
      }).not.toThrow();
    });

    it('should throw error if data does not match schema', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const invalidData = { id: '123', age: 25 }; // missing 'name'

      expect(() => {
        ApiResponse.success(invalidData as any, 'Success', 200, {}, schema);
      }).toThrow('ApiResponse data validation failed');
    });

    it('should strip unknown fields when schema is provided', () => {
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      });

      const dataWithExtra = { id: '123', name: 'Test', extra: 'field' };
      const response = ApiResponse.success(dataWithExtra, 'Success', 200, {}, schema);

      expect(response.data).toEqual({ id: '123', name: 'Test' });
      expect(response.data).not.toHaveProperty('extra');
    });

    it('should send response correctly', () => {
      const data = { test: 'data' };
      const response = ApiResponse.success(data);

      response.send(mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(response);
    });
  });

  describe('error', () => {
    it('should create error response with required values', () => {
      const response = ApiResponse.error(404, 'Not found');

      expect(response.status).toBe('error');
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Not found');
      expect(response.data).toBeNull();
      expect(response.meta).toHaveProperty('timestamp');
    });

    it('should create error response with error code', () => {
      const response = ApiResponse.error(
        400,
        'Validation failed',
        { field: 'email' },
        'VALIDATION_ERROR'
      );

      expect(response.meta.errorCode).toBe('VALIDATION_ERROR');
      expect(response.data).toEqual({ field: 'email' });
    });

    it('should send error response correctly', () => {
      const response = ApiResponse.error(500, 'Server error');

      response.send(mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith(response);
    });

    it('should validate error data against schema if provided', () => {
      const errorSchema = z.object({
        logtoUserId: z.string(),
        email: z.string().email().optional(),
      });

      const errorData = {
        logtoUserId: 'logto123',
        email: 'test@example.com',
      };

      expect(() => {
        ApiResponse.error(404, 'User not found', errorData, 'USER_NOT_FOUND', {}, errorSchema);
      }).not.toThrow();
    });
  });

  describe('meta', () => {
    it('should always include timestamp in meta', () => {
      const response = ApiResponse.success({});
      
      expect(response.meta).toHaveProperty('timestamp');
      expect(typeof response.meta.timestamp).toBe('string');
      expect(new Date(response.meta.timestamp as string)).toBeInstanceOf(Date);
    });

    it('should merge custom meta with timestamp', () => {
      const customMeta = { requestId: '123', userId: 'user456' };
      const response = ApiResponse.success({}, 'Success', 200, customMeta);

      expect(response.meta.timestamp).toBeDefined();
      expect(response.meta.requestId).toBe('123');
      expect(response.meta.userId).toBe('user456');
    });
  });

  describe('schema property', () => {
    it('should not be enumerable', () => {
      const schema = z.object({ id: z.string() });
      const response = ApiResponse.success({ id: '123' }, 'Success', 200, {}, schema);

      const keys = Object.keys(response);
      expect(keys).not.toContain('schema');
    });

    it('should not appear in JSON serialization', () => {
      const schema = z.object({ id: z.string() });
      const response = ApiResponse.success({ id: '123' }, 'Success', 200, {}, schema);

      const json = JSON.parse(JSON.stringify(response));
      expect(json).not.toHaveProperty('schema');
    });
  });
});
