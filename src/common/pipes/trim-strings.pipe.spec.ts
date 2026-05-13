import { TrimStringsPipe } from './trim-strings.pipe';

describe('TrimStringsPipe', () => {
  let pipe: TrimStringsPipe;

  beforeEach(() => {
    pipe = new TrimStringsPipe();
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  it('should trim string values', () => {
    const input = '  hello  ';
    expect(pipe.transform(input, {} as any)).toBe('hello');
  });

  it('should trim nested object values', () => {
    const input = {
      name: '  John  ',
      info: {
        bio: '  Developer  '
      }
    };
    const output = {
      name: 'John',
      info: {
        bio: 'Developer'
      }
    };
    expect(pipe.transform(input, {} as any)).toEqual(output);
  });

  it('should NOT trim password field', () => {
    const input = {
      username: '  user  ',
      password: '  pass123  '
    };
    const output = {
      username: 'user',
      password: '  pass123  '
    };
    expect(pipe.transform(input, {} as any)).toEqual(output);
  });
});
