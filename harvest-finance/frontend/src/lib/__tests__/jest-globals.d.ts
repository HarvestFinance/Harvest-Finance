// jest-globals.d.ts - Stub module declaration for @jest/globals
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JestMock = (...args: any[]) => any;

declare module '@jest/globals' {
  export const describe: JestMock;
  export const it: JestMock;
  export const expect: JestMock;
  export const test: JestMock;
  export const beforeEach: JestMock;
  export const afterEach: JestMock;
  export const beforeAll: JestMock;
  export const afterAll: JestMock;
}
