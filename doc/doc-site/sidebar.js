module.exports = {
  docs: [
    'welcome',
    {
      type: 'category',
      label: 'About',
      link: {
        type: 'generated-index'
      },
      items: [
        'about/about',
        'about/why-we-built-emojicoin',
        'about/how-it-works',
        'about/emojicoin-LP',
      ]
    },
    {
      type: 'category',
      label: 'Start Here',
      link: {
        type: 'generated-index'
      },
      items: [
        {
          type: 'category',
          label: 'Getting Started',
          items: [
            'start-here/how-to-download-petra',
            'start-here/aptos-wallet-and-moonpay',
          ]
        },
        {
          type: 'category',
          label: 'Bridging',
          items: [
            'start-here/bridging-from-eth',
            'start-here/bridging-from-solana'
          ]
        },
        'start-here/how-to-trade-on-emojicoin',
    
      ]
    },
    {
      type: 'category',
      label: 'Resources',
      link: {
        type: 'generated-index'
      },
      items: [
        'resources/glossary',
        'resources/faq',
        'resources/audit',
        'resources/bug-submission-form',
      ]
    }
  ]
}
