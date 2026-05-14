import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UnauthorizedException } from '@nestjs/common';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new JwtAuthGuard(reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user if present', () => {
      const user = { id: '1' };
      const result = guard.handleRequest(null, user, null, {} as any);
      expect(result).toEqual(user);
    });

    it('should throw UnauthorizedException if no user and not public', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      expect(() => guard.handleRequest(null, null, null, context)).toThrow(
        UnauthorizedException,
      );
    });

    it('should return null if no user but public', () => {
      reflector.getAllAndOverride = jest.fn().mockReturnValue(true);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      const result = guard.handleRequest(null, null, null, context);
      expect(result).toBeNull();
    });
  });
});
