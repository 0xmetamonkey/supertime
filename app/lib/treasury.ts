/**
 * Live treasury reader for the protocol.
 *
 * Reads public balances and recent inflows for the three sovereign vaults
 * (Bitcoin, EVM on Base/Ethereum, Solana) using only public RPCs and APIs.
 * No keys, no signing, no custodial access — read-only by construction.
 *
 * Used by:
 *   - app/api/treasury/route.ts (live meter on /protocol)
 *   - scripts/treasury-monitor.mts (cron snapshot + daily brief)
 */

export type TreasuryAssetId =
  | 'btc'
  | 'eth-base'
  | 'eth-ethereum'
  | 'usdc-base'
  | 'usdc-solana'
  | 'sol';

export interface TreasuryAsset {
  id: TreasuryAssetId;
  symbol: 'BTC' | 'ETH' | 'USDC' | 'SOL';
  chain: 'Bitcoin' | 'Base' | 'Ethereum' | 'Solana';
  amount: number | null;
  usd: number | null;
  error?: string;
}

export interface TreasuryInflow {
  chain: string;
  asset: string;
  amount: number;
  hash?: string;
  at?: string;
  from?: string;
}

export interface TreasuryMilestone {
  amount: number;
  label: string;
  reached: boolean;
}

export interface TreasurySnapshot {
  updatedAt: string;
  addresses: {
    btc: string;
    evm: string;
    sol: string;
  };
  assets: TreasuryAsset[];
  totalUsd: number;
  priced: boolean;
  prices: Record<string, number | null>;
  burn: {
    monthlyUsd: number;
    targetMonthlyUsd: number;
  };
  runway: {
    daysAtCurrentBurn: number | null;
    daysAtTargetBurn: number | null;
  };
  nextMilestone: TreasuryMilestone | null;
  milestones: TreasuryMilestone[];
  inflows: TreasuryInflow[];
  warnings: string[];
}

export const TREASURY_ADDRESSES = {
  btc:
    process.env.NEXT_PUBLIC_MONKEY_BTC_ADDRESS ||
    '12brgdhERnsUNqa17o1KW4tWC1rmLdYSvn',
  evm:
    process.env.NEXT_PUBLIC_MONKEY_EVM_ADDRESS ||
    '0x741cd4dabfc802db4167b4fc272e12b0a0181f12',
  sol:
    process.env.NEXT_PUBLIC_MONKEY_SOL_ADDRESS ||
    'Cqijh8ZoTmZ7FFMH6AgjMpnvnnFeMSDKPunXpBzLitW7',
};

const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const USDC_SOL_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

const BASE_RPCS = [
  'https://mainnet.base.org',
  'https://base-rpc.publicnode.com',
  'https://base.llamarpc.com',
];

const ETH_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://eth.llamarpc.com',
];

const SOL_RPCS = [
  'https://solana-rpc.publicnode.com',
  'https://api.mainnet-beta.solana.com',
];

const MEMPOOL = 'https://mempool.space/api';
const BLOCKSCOUT_BASE = 'https://base.blockscout.com/api/v2';
const PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,usd-coin&vs_currencies=usd';

const MILESTONES: Omit<TreasuryMilestone, 'reached'>[] = [
  { amount: 1, label: 'Deploy the Belief contract' },
  { amount: 300, label: "One month of today's infrastructure" },
  { amount: 1000, label: 'Storage and backup hardware' },
  { amount: 3000, label: 'A working machine for the operator' },
  { amount: 10000, label: 'One month at the target budget' },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(9000),
    headers: { accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${new URL(url).host} responded ${response.status}`);
  }
  return (await response.json()) as T;
}

async function rpc<T>(urls: string[], method: string, params: unknown[]): Promise<T> {
  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        cache: 'no-store',
        signal: AbortSignal.timeout(9000),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      });

      if (!response.ok) {
        throw new Error(`${new URL(url).host} responded ${response.status}`);
      }

      const payload = (await response.json()) as {
        result?: T;
        error?: { message?: string };
      };

      if (payload.error) {
        throw new Error(payload.error.message || 'RPC error');
      }
      if (payload.result === undefined) {
        throw new Error('RPC returned no result');
      }
      return payload.result;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('All RPCs failed');
}

async function safe<T>(
  fn: () => Promise<T>
): Promise<{ value: T | null; error?: string }> {
  try {
    return { value: await fn() };
  } catch (error) {
    return { value: null, error: errorMessage(error) };
  }
}

function numberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function priceFor(
  prices: Record<string, number | null>,
  id: string
): number | null {
  const value = prices[id];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/* ------------------------------------------------------------------ */
/* Readers                                                             */
/* ------------------------------------------------------------------ */

interface MempoolAddressStats {
  chain_stats: { funded_txo_sum: number; spent_txo_sum: number };
}

interface MempoolTx {
  txid: string;
  status?: { confirmed?: boolean; block_time?: number };
  vin?: { prevout?: { scriptpubkey_address?: string } }[];
  vout?: { scriptpubkey_address?: string; value: number }[];
}

async function readBtcBalance(address: string): Promise<number> {
  const stats = await fetchJson<MempoolAddressStats>(
    `${MEMPOOL}/address/${address}`
  );
  const sats =
    stats.chain_stats.funded_txo_sum - stats.chain_stats.spent_txo_sum;
  return sats / 1e8;
}

async function readBtcInflows(address: string): Promise<TreasuryInflow[]> {
  const txs = await fetchJson<MempoolTx[]>(
    `${MEMPOOL}/address/${address}/txs`
  );

  const inflows: TreasuryInflow[] = [];

  for (const tx of txs) {
    const received = (tx.vout || [])
      .filter((output) => output.scriptpubkey_address === address)
      .reduce((sum, output) => sum + (output.value || 0), 0);

    if (!received) continue;

    inflows.push({
      chain: 'Bitcoin',
      asset: 'BTC',
      amount: received / 1e8,
      hash: tx.txid,
      at:
        tx.status?.block_time != null
          ? new Date(tx.status.block_time * 1000).toISOString()
          : undefined,
      from: tx.vin?.[0]?.prevout?.scriptpubkey_address,
    });
  }

  return inflows;
}

async function readEvmNative(
  urls: string[],
  address: string
): Promise<number> {
  const result = await rpc<string>(urls, 'eth_getBalance', [
    address,
    'latest',
  ]);
  return Number(BigInt(result)) / 1e18;
}

async function readErc20(
  urls: string[],
  token: string,
  holder: string,
  decimals: number
): Promise<number> {
  const data =
    '0x70a08231' +
    holder.toLowerCase().replace(/^0x/, '').padStart(64, '0');
  const result = await rpc<string>(urls, 'eth_call', [
    { to: token, data },
    'latest',
  ]);
  return Number(BigInt(result)) / 10 ** decimals;
}

interface BlockscoutTx {
  hash: string;
  from?: { hash?: string } | null;
  to?: { hash?: string } | null;
  value?: string;
  timestamp?: string;
  status?: string;
}

interface BlockscoutTxList {
  items?: BlockscoutTx[];
}

async function readBaseInflows(address: string): Promise<TreasuryInflow[]> {
  const data = await fetchJson<BlockscoutTxList>(
    `${BLOCKSCOUT_BASE}/addresses/${address}/transactions`
  );

  const lower = address.toLowerCase();
  const inflows: TreasuryInflow[] = [];

  for (const tx of data.items || []) {
    if (!tx.to?.hash || tx.to.hash.toLowerCase() !== lower) continue;
    if (tx.status && tx.status !== 'ok') continue;

    const wei = Number(tx.value || '0');
    if (!wei) continue;

    inflows.push({
      chain: 'Base',
      asset: 'ETH',
      amount: wei / 1e18,
      hash: tx.hash,
      at: tx.timestamp,
      from: tx.from?.hash,
    });
  }

  return inflows;
}

interface BlockscoutTransfer {
  transaction_hash?: string;
  timestamp?: string;
  from?: { hash?: string } | null;
  to?: { hash?: string } | null;
  total?: { value?: string; decimals?: string } | null;
  token?: {
    address_hash?: string;
    address?: string;
    symbol?: string;
    decimals?: string;
  } | null;
}

interface BlockscoutTransferList {
  items?: BlockscoutTransfer[];
}

async function readBaseTokenInflows(
  address: string
): Promise<TreasuryInflow[]> {
  const data = await fetchJson<BlockscoutTransferList>(
    `${BLOCKSCOUT_BASE}/addresses/${address}/token-transfers`
  );

  const lower = address.toLowerCase();
  const inflows: TreasuryInflow[] = [];

  for (const transfer of data.items || []) {
    const tokenAddress = (
      transfer.token?.address_hash ||
      transfer.token?.address ||
      ''
    ).toLowerCase();

    if (tokenAddress !== USDC_BASE.toLowerCase()) continue;
    if (!transfer.to?.hash || transfer.to.hash.toLowerCase() !== lower) {
      continue;
    }

    const decimals = Number(
      transfer.token?.decimals ?? transfer.total?.decimals ?? 6
    );
    const raw = Number(transfer.total?.value || '0');
    if (!raw) continue;

    inflows.push({
      chain: 'Base',
      asset: 'USDC',
      amount: raw / 10 ** decimals,
      hash: transfer.transaction_hash,
      at: transfer.timestamp,
      from: transfer.from?.hash,
    });
  }

  return inflows;
}

interface SolBalance {
  value: number;
}

interface SolTokenAccounts {
  value: Array<{
    account?: {
      data?: {
        parsed?: {
          info?: {
            tokenAmount?: {
              uiAmount?: number | null;
              uiAmountString?: string;
            };
          };
        };
      };
    };
  }>;
}

async function readSolBalance(address: string): Promise<number> {
  const result = await rpc<SolBalance>(SOL_RPCS, 'getBalance', [address]);
  return result.value / 1e9;
}

async function readSolUsdc(address: string): Promise<number> {
  const result = await rpc<SolTokenAccounts>(
    SOL_RPCS,
    'getTokenAccountsByOwner',
    [address, { mint: USDC_SOL_MINT }, { encoding: 'jsonParsed' }]
  );

  return (result.value || []).reduce((sum, entry) => {
    const amount =
      entry.account?.data?.parsed?.info?.tokenAmount;
    if (!amount) return sum;
    const value =
      typeof amount.uiAmount === 'number'
        ? amount.uiAmount
        : Number(amount.uiAmountString || 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

interface PriceResponse {
  bitcoin?: { usd?: number };
  ethereum?: { usd?: number };
  solana?: { usd?: number };
  'usd-coin'?: { usd?: number };
}

async function readPrices(): Promise<Record<string, number | null>> {
  const data = await fetchJson<PriceResponse>(PRICE_URL);
  return {
    bitcoin: data.bitcoin?.usd ?? null,
    ethereum: data.ethereum?.usd ?? null,
    solana: data.solana?.usd ?? null,
    'usd-coin': data['usd-coin']?.usd ?? null,
  };
}

function usdValue(amount: number | null, price: number | null): number | null {
  if (amount == null || price == null) return null;
  return amount * price;
}

/* ------------------------------------------------------------------ */
/* Snapshot                                                            */
/* ------------------------------------------------------------------ */

export async function getTreasurySnapshot(): Promise<TreasurySnapshot> {
  const { btc, evm, sol } = TREASURY_ADDRESSES;
  const warnings: string[] = [];

  const [btcBalance, ethBase, ethMain, usdcBase, solBalance, usdcSol, prices] =
    await Promise.all([
      safe(() => readBtcBalance(btc)),
      safe(() => readEvmNative(BASE_RPCS, evm)),
      safe(() => readEvmNative(ETH_RPCS, evm)),
      safe(() => readErc20(BASE_RPCS, USDC_BASE, evm, 6)),
      safe(() => readSolBalance(sol)),
      safe(() => readSolUsdc(sol)),
      safe(() => readPrices()),
    ]);

  const priceMap: Record<string, number | null> = prices.value ?? {
    bitcoin: null,
    ethereum: null,
    solana: null,
    'usd-coin': null,
  };

  if (!prices.value) {
    warnings.push('Price feed unavailable; USD values are partial.');
  }

  // Stablecoins remain usable at par when the price feed is down.
  const usdcPrice =
    priceFor(priceMap, 'usd-coin') ?? (usdcBase.value != null ? 1 : null);

  const assets: TreasuryAsset[] = [
    {
      id: 'btc',
      symbol: 'BTC',
      chain: 'Bitcoin',
      amount: btcBalance.value,
      usd: usdValue(btcBalance.value, priceFor(priceMap, 'bitcoin')),
      error: btcBalance.error,
    },
    {
      id: 'eth-base',
      symbol: 'ETH',
      chain: 'Base',
      amount: ethBase.value,
      usd: usdValue(ethBase.value, priceFor(priceMap, 'ethereum')),
      error: ethBase.error,
    },
    {
      id: 'eth-ethereum',
      symbol: 'ETH',
      chain: 'Ethereum',
      amount: ethMain.value,
      usd: usdValue(ethMain.value, priceFor(priceMap, 'ethereum')),
      error: ethMain.error,
    },
    {
      id: 'usdc-base',
      symbol: 'USDC',
      chain: 'Base',
      amount: usdcBase.value,
      usd: usdValue(usdcBase.value, usdcPrice),
      error: usdcBase.error,
    },
    {
      id: 'usdc-solana',
      symbol: 'USDC',
      chain: 'Solana',
      amount: usdcSol.value,
      usd: usdValue(usdcSol.value, usdcPrice),
      error: usdcSol.error,
    },
    {
      id: 'sol',
      symbol: 'SOL',
      chain: 'Solana',
      amount: solBalance.value,
      usd: usdValue(solBalance.value, priceFor(priceMap, 'solana')),
      error: solBalance.error,
    },
  ];

  for (const asset of assets) {
    if (asset.error) {
      warnings.push(`${asset.symbol} on ${asset.chain}: ${asset.error}`);
    }
  }

  const totalUsd = assets.reduce(
    (sum, asset) => sum + (asset.usd ?? 0),
    0
  );

  if (assets.some((asset) => asset.amount != null && asset.usd == null)) {
    warnings.push('Some held assets could not be priced.');
  }

  // Recent inflows, best effort — a failure here never blocks the balance.
  const [btcInflows, baseInflows, baseTokenInflows] = await Promise.all([
    safe(() => readBtcInflows(btc)),
    safe(() => readBaseInflows(evm)),
    safe(() => readBaseTokenInflows(evm)),
  ]);

  const inflows = [
    ...(btcInflows.value ?? []),
    ...(baseInflows.value ?? []),
    ...(baseTokenInflows.value ?? []),
  ]
    .sort((a, b) => (b.at || '').localeCompare(a.at || ''))
    .slice(0, 6);

  const monthlyUsd = numberEnv('TREASURY_MONTHLY_BURN_USD', 300);
  const targetMonthlyUsd = numberEnv(
    'TREASURY_TARGET_BUDGET_USD',
    10000
  );

  const daysAtCurrentBurn =
    monthlyUsd > 0 ? round1(totalUsd / (monthlyUsd / 30)) : null;
  const daysAtTargetBurn =
    targetMonthlyUsd > 0
      ? round1(totalUsd / (targetMonthlyUsd / 30))
      : null;

  const milestones: TreasuryMilestone[] = MILESTONES.map((milestone) => ({
    ...milestone,
    reached: totalUsd >= milestone.amount,
  }));

  const nextMilestone =
    milestones.find((milestone) => !milestone.reached) ?? null;

  return {
    updatedAt: new Date().toISOString(),
    addresses: { btc, evm, sol },
    assets,
    totalUsd: Math.round(totalUsd * 100) / 100,
    priced: !assets.some(
      (asset) => asset.amount != null && asset.usd == null
    ),
    prices: priceMap,
    burn: { monthlyUsd, targetMonthlyUsd },
    runway: { daysAtCurrentBurn, daysAtTargetBurn },
    nextMilestone,
    milestones,
    inflows,
    warnings,
  };
}
