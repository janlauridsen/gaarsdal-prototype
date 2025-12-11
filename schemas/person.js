export default {
  name: 'person',
  title: 'Person',
  type: 'document',
  fields: [
    { name: 'name', type: 'string' },
    { name: 'phone', type: 'string' },
    { name: 'email', type: 'string' },
    { name: 'address', type: 'text' },
    { name: 'bio', type: 'array', of: [{ type: 'block' }] }
  ]
}
