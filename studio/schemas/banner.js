export default {
  name: 'banner',
  title: 'Banner Promocional',
  type: 'document',
  fields: [
    {
      name: 'isActive',
      title: 'Mostrar no Site?',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'text',
      title: 'Texto do Banner',
      type: 'string',
    },
    {
      name: 'link',
      title: 'Link de Destino',
      type: 'url',
    },
  ],
}
