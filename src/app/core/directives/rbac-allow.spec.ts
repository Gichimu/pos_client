import { RbacAllow } from './rbac-allow';

describe('RbacAllow', () => {
  it('should create an instance', () => {
    const directive = new RbacAllow();
    expect(directive).toBeTruthy();
  });
});
