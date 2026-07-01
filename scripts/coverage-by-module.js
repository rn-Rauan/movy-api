// @ts-check
/**
 * Gera um relatorio de cobertura AGRUPADO POR MODULO a partir do
 * coverage-summary.json produzido pelo Jest/Istanbul.
 *
 * A pagina reaproveita o CSS/JS do proprio relatorio do Istanbul
 * (lcov-report/) para ficar identica ao index padrao — inclusive a
 * barrinha de porcentagem — mas com uma linha por modulo
 * (auth, bookings, driver, ..., shared) em vez de por arquivo/pasta.
 *
 * Saida: coverage/by-module.html
 *
 * Uso:
 *   node scripts/coverage-by-module.js
 * ou (gera a cobertura antes):
 *   npm run test:cov:module
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..').replace(/\\/g, '/');
const COVERAGE_DIR = path.resolve(__dirname, '..', 'coverage');
const SUMMARY_PATH = path.join(COVERAGE_DIR, 'coverage-summary.json');
const LCOV_DIR = path.join(COVERAGE_DIR, 'lcov-report');
const OUTPUT_PATH = path.join(COVERAGE_DIR, 'by-module.html');

const METRICS = /** @type {const} */ (['statements', 'branches', 'functions', 'lines']);

if (!fs.existsSync(SUMMARY_PATH)) {
  console.error(
    `\n[coverage-by-module] Nao encontrei ${path.relative(process.cwd(), SUMMARY_PATH)}.\n` +
      `Rode a cobertura primeiro:  npm run test:cov   (ou)  npm run test:cov:module\n`,
  );
  process.exit(1);
}

/** @type {Record<string, any>} */
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, 'utf8'));

/**
 * Descobre a qual "modulo" um arquivo pertence a partir do caminho.
 * - src/modules/<mod>/...  -> <mod>
 * - src/shared/...         -> shared
 * - src/...                -> (raiz)
 * - qualquer outro         -> primeiro segmento (ex.: prisma)
 * @param {string} filePath
 * @returns {string}
 */
function moduleOf(filePath) {
  let p = filePath.replace(/\\/g, '/');
  if (p.startsWith(ROOT + '/')) p = p.slice(ROOT.length + 1); // caminho relativo a raiz do repo
  const mod = p.match(/(?:^|\/)src\/modules\/([^/]+)\//);
  if (mod) return mod[1];
  if (/(?:^|\/)src\/shared\//.test(p)) return 'shared';
  if (/(?:^|\/)src\//.test(p)) return '(raiz)';
  const first = p.split('/').filter(Boolean)[0];
  return first || '(outros)';
}

/** Caminho relativo (dentro de coverage/) para o relatorio detalhado do modulo. */
function reportLinkFor(mod) {
  const candidates =
    mod === 'shared'
      ? ['src/shared']
      : mod === '(raiz)'
        ? ['src']
        : [`src/modules/${mod}`, mod];
  for (const c of candidates) {
    if (fs.existsSync(path.join(LCOV_DIR, c, 'index.html'))) {
      return `lcov-report/${c}/index.html`;
    }
  }
  return null;
}

const emptyMetric = () => ({ covered: 0, total: 0 });

/** @type {Record<string, Record<string, {covered:number,total:number}>>} */
const modules = {};

for (const [filePath, data] of Object.entries(summary)) {
  if (filePath === 'total') continue;
  const mod = moduleOf(filePath);
  if (!modules[mod]) {
    modules[mod] = {
      statements: emptyMetric(),
      branches: emptyMetric(),
      functions: emptyMetric(),
      lines: emptyMetric(),
    };
  }
  for (const m of METRICS) {
    modules[mod][m].covered += data[m].covered;
    modules[mod][m].total += data[m].total;
  }
}

/** Percentual (2 casas), 100 quando total = 0 (convencao do Istanbul). */
function pct(metric) {
  if (metric.total === 0) return 100;
  return Math.round((metric.covered / metric.total) * 10000) / 100;
}

/** Watermarks padrao do Istanbul: < 50 baixo, 50-79 medio, >= 80 alto. */
function levelOf(value) {
  if (value >= 80) return 'high';
  if (value >= 50) return 'medium';
  return 'low';
}

// Ordena alfabeticamente; "shared", "(raiz)" e demais nao-modulos vao para o fim.
const names = Object.keys(modules).sort((a, b) => {
  const rank = (n) => (n === '(raiz)' ? 3 : n === 'prisma' ? 2 : n === 'shared' ? 1 : 0);
  return rank(a) - rank(b) || a.localeCompare(b);
});

// ---- HTML (identico ao index do Istanbul, agrupado por modulo) ------------

/** Bloco de metrica do cabecalho (Statements/Branches/Functions/Lines). */
function headerMetric(label, m) {
  return `            <div class='fl pad1y space-right2'>
                <span class="strong">${m.pct}% </span>
                <span class="quiet">${label}</span>
                <span class='fraction'>${m.covered}/${m.total}</span>
            </div>`;
}

/** Celula da barrinha de progresso (chart), baseada em statements. */
function picCell(value) {
  const lvl = levelOf(value);
  const w = Math.floor(value);
  const fill =
    w >= 100
      ? `<div class="cover-fill cover-full" style="width: 100%"></div><div class="cover-empty" style="width: 0%"></div>`
      : `<div class="cover-fill" style="width: ${w}%"></div><div class="cover-empty" style="width: ${100 - w}%"></div>`;
  return `\t<td data-value="${value}" class="pic ${lvl}">
\t<div class="chart">${fill}</div>
\t</td>`;
}

/** Par de celulas pct + abs para uma metrica. */
function metricCells(metric) {
  const value = pct(metric);
  const lvl = levelOf(value);
  return (
    `\t<td data-value="${value}" class="pct ${lvl}">${value}%</td>\n` +
    `\t<td data-value="${metric.total}" class="abs ${lvl}">${metric.covered}/${metric.total}</td>`
  );
}

const rows = names
  .map((name) => {
    const m = modules[name];
    const stmtPct = pct(m.statements);
    const fileLvl = levelOf(stmtPct);
    const link = reportLinkFor(name);
    const label = link ? `<a href="${link}">${name}</a>` : name;
    return `<tr>
\t<td class="file ${fileLvl}" data-value="${name}">${label}</td>
${picCell(stmtPct)}
${metricCells(m.statements)}
${metricCells(m.branches)}
${metricCells(m.functions)}
${metricCells(m.lines)}
\t</tr>`;
  })
  .join('\n\n');

const t = summary.total;
const overallLvl = levelOf(t.statements.pct);

const html = `
<!doctype html>
<html lang="pt-br">

<head>
    <title>Cobertura por modulo &middot; Movy API</title>
    <meta charset="utf-8" />
    <link rel="stylesheet" href="lcov-report/prettify.css" />
    <link rel="stylesheet" href="lcov-report/base.css" />
    <link rel="shortcut icon" type="image/x-icon" href="lcov-report/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style type='text/css'>
        .coverage-summary .sorter {
            background-image: url(lcov-report/sort-arrow-sprite.png);
        }
    </style>
</head>

<body>
<div class='wrapper'>
    <div class='pad1'>
        <h1>Todos os modulos</h1>
        <div class='clearfix'>
${headerMetric('Statements', t.statements)}

${headerMetric('Branches', t.branches)}

${headerMetric('Functions', t.functions)}

${headerMetric('Lines', t.lines)}
        </div>
        <p class="quiet">
            Uma linha por modulo (agrupado a partir de <em>src/modules/&lt;mod&gt;</em> e <em>src/shared</em>).
            Clique no modulo para o detalhe por arquivo. Clique nos cabecalhos para ordenar.
        </p>
        <template id="filterTemplate">
            <div class="quiet">
                Filtro:
                <input type="search" id="fileSearch">
            </div>
        </template>
    </div>
    <div class='status-line ${overallLvl}'></div>
    <div class="pad1">
<table class="coverage-summary">
<thead>
<tr>
   <th data-col="file" data-fmt="html" data-html="true" class="file">Modulo</th>
   <th data-col="pic" data-type="number" data-fmt="html" data-html="true" class="pic"></th>
   <th data-col="statements" data-type="number" data-fmt="pct" class="pct">Statements</th>
   <th data-col="statements_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="branches" data-type="number" data-fmt="pct" class="pct">Branches</th>
   <th data-col="branches_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="functions" data-type="number" data-fmt="pct" class="pct">Functions</th>
   <th data-col="functions_raw" data-type="number" data-fmt="html" class="abs"></th>
   <th data-col="lines" data-type="number" data-fmt="pct" class="pct">Lines</th>
   <th data-col="lines_raw" data-type="number" data-fmt="html" class="abs"></th>
</tr>
</thead>
<tbody>
${rows}
</tbody>
</table>
    </div>
    <div class='push'></div>
</div>
<div class='footer quiet pad2 space-top1 center small'>
    Cobertura por modulo gerada em ${new Date().toLocaleString('pt-BR')} &middot;
    <a href="lcov-report/index.html">ver relatorio completo por arquivo</a>
</div>
<script src="lcov-report/prettify.js"></script>
<script>
    window.onload = function () {
        prettyPrint();
    };
</script>
<script src="lcov-report/sorter.js"></script>
<script src="lcov-report/block-navigation.js"></script>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_PATH, html, 'utf8');

// Resumo curto no console.
console.log('\nCobertura por modulo:\n');
for (const name of names) {
  const m = modules[name];
  console.log(`  ${name.padEnd(16)} ${String(pct(m.statements)).padStart(6)}% stmts`);
}
console.log(`\nHTML gerado: ${path.relative(process.cwd(), OUTPUT_PATH)}\n`);
