export default {
  name: 'page',
  title: 'Page',
  type: 'document',
  fields: [
    { name: 'title', type: 'string', title: 'Title' },
    { name: 'slug', type: 'slug', title: 'Slug', options: { source: 'title', maxLength: 96 } },
    { name: 'intro', type: 'text', title: 'Intro' },
    { name: 'body', type: 'array', title: 'Body', of: [{ type: 'block' }] },
    { name: 'metaTitle', type: 'string', title: 'Meta title' },
    { name: 'metaDescription', type: 'text', title: 'Meta description' }
  ]
}
