export default {
  name: 'hypnoterapi',
  title: 'Hypnoterapi',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    { name: 'summary', type: 'text' },
    { name: 'body', type: 'array', of: [{ type: 'block' }] }
  ]
}
