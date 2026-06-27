// Generates a self-contained, shareable HTML page from docs/diagrams/ARCHITECTURE.md
// Usage: node docs/diagrams/build-html.js
const fs = require("fs");
const path = require("path");

const mdPath = path.join(__dirname, process.argv[2] || "ARCHITECTURE.md");
const outPath = path.join(__dirname, process.argv[3] || "architecture.html");
const md = fs.readFileSync(mdPath, "utf8");

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${process.argv[4] || "AI Colleagues Platform — Architecture"}</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<style>
  :root{
    --green:#3ecf8e; --green-d:#08301d; --bg:#fcfcfc; --fg:#1a1a1a;
    --muted:#6b7280; --border:#e4e4e4; --card:#ffffff; --accent:#eafaf1;
    --code:#f6f8f7;
  }
  *{box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;
    color:var(--fg);background:var(--bg);line-height:1.6;font-size:15px}
  a{color:#1a7f54;text-decoration:none} a:hover{text-decoration:underline}
  .layout{display:grid;grid-template-columns:280px 1fr;max-width:1400px;margin:0 auto;min-height:100vh}
  /* sidebar */
  aside{position:sticky;top:0;align-self:start;height:100vh;overflow:auto;border-right:1px solid var(--border);
    padding:20px 14px;background:#fff}
  .brand{display:flex;align-items:center;gap:8px;margin-bottom:6px}
  .brand .logo{width:26px;height:26px;border-radius:7px;background:var(--green);color:var(--green-d);
    display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px}
  .brand b{font-size:15px}
  .sub{color:var(--muted);font-size:12px;margin:0 0 14px 2px}
  nav a{display:block;padding:4px 8px;border-radius:6px;color:#374151;font-size:13px}
  nav a:hover{background:var(--accent);text-decoration:none}
  nav a.h3{padding-left:20px;color:#6b7280;font-size:12.5px}
  nav a.active{background:var(--green);color:var(--green-d);font-weight:600}
  /* content */
  main{padding:36px 48px;max-width:1000px;overflow:hidden}
  h1{font-size:30px;border-bottom:2px solid var(--green);padding-bottom:10px;margin-top:0}
  h2{font-size:23px;margin-top:42px;border-bottom:1px solid var(--border);padding-bottom:6px}
  h3{font-size:18px;margin-top:30px;color:#111}
  h4{font-size:15px;margin-top:20px;color:#374151}
  table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13.5px;display:block;overflow-x:auto}
  th,td{border:1px solid var(--border);padding:7px 10px;text-align:left;vertical-align:top}
  th{background:var(--accent);font-weight:600}
  tr:nth-child(even) td{background:#fafcfb}
  code{background:var(--code);padding:1.5px 5px;border-radius:4px;font-size:13px;
    font-family:"SF Mono",ui-monospace,Menlo,Consolas,monospace}
  pre code{background:none;padding:0}
  blockquote{margin:14px 0;padding:8px 16px;border-left:3px solid var(--green);background:var(--accent);
    color:#374151;border-radius:0 6px 6px 0}
  blockquote p{margin:4px 0}
  hr{border:none;border-top:1px solid var(--border);margin:30px 0}
  .mermaid{background:var(--card);border:1px solid var(--border);border-radius:10px;padding:18px;margin:18px 0;
    text-align:center;overflow-x:auto}
  .toolbar{position:fixed;top:14px;right:18px;display:flex;gap:8px;z-index:10}
  .toolbar button{border:1px solid var(--border);background:#fff;border-radius:8px;padding:7px 12px;
    font-size:13px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,.04)}
  .toolbar button:hover{border-color:var(--green);color:#1a7f54}
  @media print{aside,.toolbar{display:none}.layout{grid-template-columns:1fr}main{padding:0}
    .mermaid{break-inside:avoid}}
  @media (max-width:900px){.layout{grid-template-columns:1fr}aside{position:static;height:auto;border-right:none;border-bottom:1px solid var(--border)}}
</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">🖨️ Print / Save PDF</button>
  <button onclick="document.documentElement.requestFullscreen?.()">⛶ Fullscreen</button>
</div>
<div class="layout">
  <aside>
    <div class="brand"><span class="logo">H</span><b>hragent</b></div>
    <p class="sub">Architecture &amp; Diagrams</p>
    <nav id="toc"></nav>
  </aside>
  <main id="content"></main>
</div>

<script type="application/json" id="md">${JSON.stringify(md)}</script>
<script>
  const source = JSON.parse(document.getElementById('md').textContent);

  // Render markdown (fenced mermaid blocks are converted below)
  marked.setOptions({ gfm:true, breaks:false });
  const contentEl = document.getElementById('content');
  contentEl.innerHTML = marked.parse(source);

  // Convert <code class="language-mermaid"> blocks into <div class="mermaid">
  document.querySelectorAll('code.language-mermaid').forEach(code => {
    const div = document.createElement('div');
    div.className = 'mermaid';
    div.textContent = code.textContent;
    code.closest('pre').replaceWith(div);
  });

  // Give headings ids + build the TOC (h2 + h3)
  const toc = document.getElementById('toc');
  let n = 0;
  contentEl.querySelectorAll('h2, h3').forEach(h => {
    const id = 'sec-' + (n++);
    h.id = id;
    const a = document.createElement('a');
    a.href = '#' + id;
    a.textContent = h.textContent;
    if (h.tagName === 'H3') a.className = 'h3';
    toc.appendChild(a);
  });

  // Mermaid with a green theme to match the product
  mermaid.initialize({
    startOnLoad:false,
    theme:'base',
    themeVariables:{
      primaryColor:'#eafaf1', primaryBorderColor:'#3ecf8e', primaryTextColor:'#08301d',
      lineColor:'#5b9c80', secondaryColor:'#f3f4f3', tertiaryColor:'#ffffff',
      fontFamily:'-apple-system,Segoe UI,Inter,sans-serif', fontSize:'13px',
      actorBkg:'#eafaf1', actorBorder:'#3ecf8e', actorTextColor:'#08301d',
      noteBkgColor:'#fff7e6', noteBorderColor:'#f5c66b'
    }
  });
  mermaid.run({ querySelector:'.mermaid' });

  // Scroll-spy: highlight active TOC item
  const links = [...toc.querySelectorAll('a')];
  const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        map.get(e.target.id)?.classList.add('active');
      }
    });
  }, { rootMargin:'0px 0px -75% 0px' });
  contentEl.querySelectorAll('h2, h3').forEach(h => obs.observe(h));
</script>
</body>
</html>`;

fs.writeFileSync(outPath, html);
console.log("Wrote", outPath, `(${(html.length/1024).toFixed(1)} KB)`);
