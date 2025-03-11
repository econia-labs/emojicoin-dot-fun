module.exports = {
  docs: [
    {
      type: 'category',
      label: 'ℹ️ About',
      link: {
        type: 'generated-index'
      },
      items: [
        'about/about',
        'about/core-values',
        'about/how-it-works',
        'about/emojicoin-LP',
      ]
    },
    {
      type: 'category',
      label: ' 🏁 Start here',
      link: {
        type: 'generated-index'
      },
      items: [
        'start-here/how-to-download-petra',
        'start-here/aptos-wallet-and-moonpay',
        'start-here/aptos-wallet-and-cex',
        'start-here/bridging-from-eth',
        'start-here/bridging-from-solana',
        'start-here/how-to-trade-on-emojicoin',
      ]
    },
    {
      type: 'category',
      label: '🧠 Resources',
      link: {
        type: 'generated-index'
      },
      items: [
        'resources/glossary',
        'resources/faq',
        'resources/audit',
        'resources/bug-submission-form',
      ]
    },
    {
      type: 'category',
      label: '🏗 Integrators',
      link: {
        type: 'generated-index'
      },
      items: [
        'resources/integrators/sdk',
        {
          type: 'category',
          label: '🔗 APIs',
          link: {
            type: 'generated-index'
          },
          items: [
            'resources/integrators/api/coingecko',
            'resources/integrators/api/dexscreener',
            'resources/integrators/api/trending',
          ]
        },
      ]
    },
  ]
}
