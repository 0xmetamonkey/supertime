/**
 * Treasury monitor — cron entry point.
 *
 *   npm run treasury:update
 *
 * Reads the public vaults, writes a public snapshot for the site and a
 * human-readable daily brief, and prints a summary. Read-only: this script
 * never holds or moves funds.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
  getTreasurySnapshot,
  type TreasurySnapshot,
} from '../app/lib/treasury.ts';

function usd(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value < 100 ? 2 : 0,
  });
}

function amount(value: number | null): string {
  if (value == null) return '—';
  return value.toLocaleString('en-US', {
    maximumFractionDigits: value < 1 ? 8 : 4,
  });
}

function summary(snapshot: TreasurySnapshot): string {
  const lines: string[] = [];

  lines.push(`Treasury — ${snapshot.updatedAt}`);
  lines.push('');
  lines.push(`Total: ${usd(snapshot.totalUsd)} (priced: ${snapshot.priced ? 'yes' : 'partial'})`);
  lines.push('');

  for (const asset of snapshot.assets) {
    lines.push(
      `  ${asset.symbol.padEnd(5)} ${asset.chain.padEnd(9)} ${amount(
        asset.amount
      ).padStart(14)}  ${usd(asset.usd)}`
    );
  }

  lines.push('');
  lines.push(
    `Runway: ${snapshot.runway.daysAtCurrentBurn ?? '—'} days at ${usd(
      snapshot.burn.monthlyUsd
    )}/mo | ${snapshot.runway.daysAtTargetBurn ?? '—'} days at ${usd(
      snapshot.burn.targetMonthlyUsd
    )}/mo`
  );

  if (snapshot.nextMilestone) {
    lines.push(
      `Next milestone: ${usd(snapshot.nextMilestone.amount)} — ${
        snapshot.nextMilestone.label
      }`
    );
  } else {
    lines.push('Next milestone: none — every published milestone is funded.');
  }

  if (snapshot.inflows.length) {
    lines.push('');
    lines.push('Recent inflows:');
    for (const inflow of snapshot.inflows) {
      lines.push(
        `  ${amount(inflow.amount)} ${inflow.asset} on ${inflow.chain}${
          inflow.at ? ` — ${inflow.at.slice(0, 10)}` : ''
        }`
      );
    }
  } else {
    lines.push('');
    lines.push('Recent inflows: none recorded.');
  }

  if (snapshot.warnings.length) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of snapshot.warnings) {
      lines.push(`  - ${warning}`);
    }
  }

  return lines.join('\n') + '\n';
}

function brief(snapshot: TreasurySnapshot): string {
  const day = snapshot.updatedAt.slice(0, 10);
  const lines: string[] = [];

  lines.push(`# Treasury brief — ${day}`);
  lines.push('');
  lines.push(`**Total:** ${usd(snapshot.totalUsd)}  `);
  lines.push(
    `**Runway:** ${snapshot.runway.daysAtCurrentBurn ?? '—'} days at ${usd(
      snapshot.burn.monthlyUsd
    )}/mo · ${snapshot.runway.daysAtTargetBurn ?? '—'} days at ${usd(
      snapshot.burn.targetMonthlyUsd
    )}/mo  `
  );
  lines.push(
    `**Next milestone:** ${
      snapshot.nextMilestone
        ? `${usd(snapshot.nextMilestone.amount)} — ${snapshot.nextMilestone.label}`
        : 'all published milestones funded'
    }`
  );
  lines.push('');
  lines.push('| Asset | Chain | Amount | USD |');
  lines.push('| --- | --- | ---: | ---: |');

  for (const asset of snapshot.assets) {
    lines.push(
      `| ${asset.symbol} | ${asset.chain} | ${amount(asset.amount)} | ${usd(
        asset.usd
      )} |`
    );
  }

  lines.push('');
  lines.push('## Recent inflows');
  lines.push('');

  if (snapshot.inflows.length) {
    for (const inflow of snapshot.inflows) {
      lines.push(
        `- ${amount(inflow.amount)} ${inflow.asset} on ${inflow.chain}${
          inflow.at ? ` (${inflow.at.slice(0, 10)})` : ''
        }${inflow.hash ? ` — \`${inflow.hash.slice(0, 18)}…\`` : ''}`
      );
    }
  } else {
    lines.push('None recorded.');
  }

  if (snapshot.warnings.length) {
    lines.push('');
    lines.push('## Warnings');
    lines.push('');
    for (const warning of snapshot.warnings) {
      lines.push(`- ${warning}`);
    }
  }

  return lines.join('\n') + '\n';
}

async function main() {
  const snapshot = await getTreasurySnapshot();

  const root = path.resolve(process.cwd(), 'research_docs', 'chief');
  const briefs = path.join(root, 'briefs');
  await mkdir(briefs, { recursive: true });

  const day = snapshot.updatedAt.slice(0, 10);

  await Promise.all([
    writeFile(
      path.join(root, 'treasury.json'),
      JSON.stringify(snapshot, null, 2) + '\n',
      'utf-8'
    ),
    writeFile(
      path.join(briefs, `${day}.md`),
      brief(snapshot),
      'utf-8'
    ),
  ]);

  console.log(summary(snapshot));
  console.log(
    `Wrote ${path.join(root, 'treasury.json')} and ${path.join(
      briefs,
      `${day}.md`
    )}`
  );
}

main().catch((error) => {
  console.error('[treasury] monitor failed:', error);
  process.exit(1);
});
