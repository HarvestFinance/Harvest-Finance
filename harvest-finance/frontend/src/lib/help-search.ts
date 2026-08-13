export interface Article {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  slug: string;
}

const HELP_ARTICLES: Article[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Harvest Finance',
    body: 'Welcome to Harvest Finance. Start by connecting your Stellar wallet, then browse available vault strategies. Deposit USDC or other supported tokens to begin earning yield.',
    category: 'Getting Started',
    tags: ['wallet', 'deposit', 'onboarding'],
    slug: 'getting-started',
  },
  {
    id: 'wallets',
    title: 'Supported Wallets',
    body: 'Harvest Finance supports all major Stellar wallets including Albedo, Freighter, andLedger. Connect your wallet through the dashboard to manage vaults.',
    category: 'Wallet',
    tags: ['wallet', 'connect', 'stellar'],
    slug: 'wallets',
  },
  {
    id: 'vaults',
    title: 'How Vaults Work',
    body: 'Vaults are algorithmically managed pools that optimize yield strategies. Your deposited assets are allocated to farming contracts, and you receive vault shares proportional to your contribution.',
    category: 'Vaults',
    tags: ['vault', 'yield', 'strategy'],
    slug: 'vaults',
  },
  {
    id: 'deposits',
    title: 'Making a Deposit',
    body: 'To deposit, select a vault from your dashboard, click "Deposit", enter an amount, and confirm the transaction in your wallet. Deposits are immediately reflected in your vault share balance.',
    category: 'Deposits',
    tags: ['deposit', 'vault', 'transaction'],
    slug: 'deposits',
  },
  {
    id: 'withdrawals',
    title: 'Withdrawing Funds',
    body: 'Withdrawals can be made at any time. Select a vault, click "Withdraw", enter the amount, and confirm. Funds are returned to your wallet along with any accrued yields.',
    category: 'Withdrawals',
    tags: ['withdraw', 'vault', 'transaction'],
    slug: 'withdrawals',
  },
  {
    id: 'rewards',
    title: 'Claiming Rewards',
    body: 'Rewards accumulate automatically in your vault. They are compounded based on the vault strategy. You can claim rewards at any time through the dashboard.',
    category: 'Rewards',
    tags: ['rewards', 'yield', 'compound'],
    slug: 'rewards',
  },
  {
    id: 'security',
    title: 'Security Best Practices',
    body: 'Never share your private key. Enable two-factor authentication. Always verify transaction details before signing. Harvest Finance will never ask for your private key.',
    category: 'Security',
    tags: ['security', 'private-key', '2fa'],
    slug: 'security',
  },
  {
    id: 'fees',
    title: 'Understanding Fees',
    body: 'Vaults charge a performance fee of 10-30% on yields, and a management fee of 0.1-2% annually. All fees are transparent and visible on the vault detail page.',
    category: 'Fees',
    tags: ['fees', 'vault', 'performance'],
    slug: 'fees',
  },
  {
    id: 'offline',
    title: 'Using Harvest Finance Offline',
    body: 'The dashboard works offline. Actions are queued and synced when you reconnect. View cached data, manage vaults, and queue transactions even without internet.',
    category: 'Offline Mode',
    tags: ['offline', 'sync', 'queue'],
    slug: 'offline',
  },
  {
    id: 'pwa',
    title: 'Installing the Mobile App',
    body: 'Harvest Finance is a Progressive Web App. Add it to your home screen for a native app experience with push notifications and offline support.',
    category: 'Mobile',
    tags: ['pwa', 'mobile', 'install'],
    slug: 'pwa',
  },
];

export function getAllArticles(): Article[] {
  return HELP_ARTICLES;
}

export function searchHelp(query: string, limit = 20): Article[] {
  if (!query.trim()) {
    return HELP_ARTICLES.slice(0, limit);
  }

  const lowerQuery = query.toLowerCase();
  const results = HELP_ARTICLES.filter(
    (article) =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.body.toLowerCase().includes(lowerQuery) ||
      article.category.toLowerCase().includes(lowerQuery) ||
      article.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)),
  );

  return results.slice(0, limit);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return HELP_ARTICLES.find((article) => article.slug === slug);
}
