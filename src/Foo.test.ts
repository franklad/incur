import { Foo } from 'clac'

describe('foo', () => {
  test('default', () => {
    expect(Foo.foo()).toBe('Hello, foo!')
  })
})
