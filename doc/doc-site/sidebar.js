module.exports = {
  docs: [
    'welcome',
    {
      type: 'category',
      label: 'Generated index type category',
      link: {
        type: 'generated-index'
      },
      items: [
        'this-is-a-subdir/some-doc-page',
      ]
    },
    {
      type: 'category',
      label: 'Doc type category',
      link: {
        type: 'doc',
        id: 'this-is-another-subdir/index'
      },
      items: [
        'this-is-another-subdir/some-other-doc-page',
      ]
    },
    'security'
  ]
}
