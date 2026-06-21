export default {
  name: 'product',
  title: 'Produto',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Nome do Produto',
      type: 'string',
    },
    {
      name: 'price',
      title: 'Preço (Opcional)',
      type: 'string',
    },
    {
      name: 'link',
      title: 'Link de Compra (Shopee)',
      type: 'url',
    },
    {
      name: 'category',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          {title: 'Varões', value: 'varoes'},
          {title: 'Acessórios', value: 'acessorios'},
          {title: 'Elétrica', value: 'eletrica'},
        ],
      },
    },
    {
      name: 'image',
      title: 'Imagem do Produto',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'description',
      title: 'Descrição Curta',
      type: 'text',
    },
  ],
}
