// Shared by the article section and the standalone context lab.
(() => {
  "use strict";
  const template = document.createElement("template");
  template.innerHTML = `<style>
    :host {
      --ink:#1a1a1a; --muted:#6b6b6b; --rule:#e6e3dc; --paper:#fff; --soft:#f5f1ea;
      --rust:#8b3a2f; --rust-soft:#f5ebe6; --rust-line:#c9a89e;
      --teal:#2a6470; --teal-soft:#e6eef0; --teal-line:#9ab8be;
      --green:#4a6f3a; --green-soft:#ecf0e6; --green-line:#a8c0a0;
      --gold:#a07020; --gold-soft:#f5ecdb; --gold-line:#d4a86a;
      --serif:Georgia,"Songti SC","Noto Serif SC",serif;
      --sans:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
      --mono:"SFMono-Regular",Consolas,monospace;
    }
    * { box-sizing:border-box }
    :host { display:block; margin:0; color:var(--ink); background:var(--paper); font-family:var(--sans); font-size:15px; line-height:1.65 }
    button,select { font:inherit; color:inherit }
    button { cursor:pointer }
    button:disabled { cursor:default; opacity:.35 }
    button:focus-visible,select:focus-visible,summary:focus-visible,a:focus-visible { outline:3px solid var(--teal); outline-offset:4px }
    button { -webkit-tap-highlight-color:transparent }
    a { color:var(--rust); text-underline-offset:3px }
    [hidden] { display:none!important }
    h1,h2,h3,p { margin:0 }
    h1,h2,h3 { font-family:var(--serif); font-weight:500 }
    code { font-family:var(--mono); font-size:.86em; overflow-wrap:anywhere }
    .page { max-width:1160px; margin:auto; padding:34px 28px 24px }
    .masthead { display:flex; align-items:flex-start; justify-content:space-between; gap:24px; margin-bottom:24px }
    .eyebrow { font:11px/1.5 var(--mono); letter-spacing:.12em; color:var(--rust); margin-bottom:10px }
    h1 { font-size:clamp(28px,3.7vw,42px); line-height:1.25; letter-spacing:-.025em }
    .lead { color:var(--muted); margin-top:10px; font-family:var(--serif); font-size:17px }
    .edition { font:11px/1.8 var(--mono); color:var(--muted); text-align:right; padding-top:3px; white-space:nowrap }
    .edition button { font:inherit; border:0; background:none; color:var(--rust); padding:6px 0; text-decoration:underline; text-underline-offset:4px }
    .toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:13px 0; border-top:1px solid var(--rule); border-bottom:1px solid var(--rule) }
    .scenario-control { display:flex; align-items:center; gap:10px; min-width:0 }
    .small-label { font-size:12px; color:var(--muted); white-space:nowrap }
    select { max-width:100%; padding:7px 30px 7px 10px; background:var(--soft); border:1px solid var(--rule); border-radius:4px; font-size:13px }
    .prompt-shortcuts { display:flex; gap:6px; flex-wrap:wrap; align-items:center }
    .prompt-shortcuts button { border:1px solid var(--rule); border-radius:3px; background:white; padding:5px 9px; color:var(--muted); font:11px/1.7 var(--mono); position:relative }
    .prompt-shortcuts button.present { color:var(--rust); border-color:var(--rust-line); background:var(--rust-soft) }
    .prompt-shortcuts button.current::after { content:""; width:5px; height:5px; border-radius:50%; background:var(--rust); position:absolute; right:4px; top:4px }
    .route-map { margin:14px 0 5px; padding-bottom:10px; border-bottom:1px solid var(--rule) }
    .route-map-head { display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; align-items:center; font-size:11px; color:var(--muted) }
    .route-legend { display:flex; align-items:center; gap:14px; flex-wrap:wrap }
    .route-legend span { display:inline-flex; align-items:center; gap:5px }
    .route-legend i { display:inline-block; width:20px; height:2px; background:var(--rust) }
    .route-legend .other-line { background:var(--rule) }
    .route-legend .current-node { width:9px; height:9px; border-radius:2px; background:var(--rust) }
    .graph-scroll { width:100%; overflow-x:auto; overscroll-behavior-x:contain; scrollbar-width:thin; scrollbar-color:var(--rust-line) var(--soft) }
    .route-graph { position:relative; width:100%; min-width:1050px; aspect-ratio:1100 / 294; margin:6px 0 0 }
    .route-graph svg { display:block; width:100%; height:100%; overflow:visible }
    .graph-edge { fill:none; stroke:var(--rule); stroke-width:1.7; stroke-linejoin:round; stroke-linecap:round; transition:stroke .2s }
    .graph-edge.selected { stroke:var(--rust); stroke-width:2.7 }
    .graph-edge-label { fill:var(--muted); opacity:.48; font:11px var(--sans); text-anchor:middle }
    .graph-edge-label.selected { fill:var(--rust); opacity:1 }
    .graph-window-label { fill:var(--muted); font:10px var(--mono); letter-spacing:.03em }
    .graph-window-boundary { stroke:var(--rule); stroke-width:1; stroke-dasharray:3 5 }
    .graph-node { position:absolute; width:8%; height:16.3265%; transform:translate(-50%,-50%); padding:5px 3px; background:#fff; border:1px solid var(--rule); border-radius:4px; text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px }
    .graph-node:disabled { opacity:.6; cursor:default; background:var(--soft); color:var(--ink) }
    .graph-node.selected { border-color:var(--rust-line); background:var(--rust-soft); color:var(--rust) }
    .graph-node.selected:hover { border-color:var(--rust); box-shadow:0 0 0 1px var(--rust-line) }
    .graph-node[aria-current="step"] { color:white; background:var(--rust); border-color:var(--rust) }
    .graph-node-top { display:flex; align-items:baseline; justify-content:center; gap:5px; font-size:12px; line-height:1.3 }
    .graph-node-top strong { font-weight:500 }
    .graph-number { font:9px var(--mono); opacity:.7 }
    .graph-node-sub { font-size:9px; line-height:1.3; white-space:nowrap; opacity:.85 }
    .graph-scroll-hint { display:none; font-size:10px; color:var(--muted); margin-top:4px }
    @media(max-width:1120px) { .graph-scroll-hint { display:block } }
    .narrative { min-height:112px; display:flex; align-items:center; gap:18px; padding:12px 0 18px }
    .chapter { font:46px/1 var(--serif); color:var(--rust-line); width:61px; flex-shrink:0; align-self:flex-start; padding-top:6px }
    .narrative h2 { font-size:25px; line-height:1.35; margin-bottom:6px }
    .narrative p { color:var(--muted); font-size:14px; max-width:830px; line-height:1.75 }
    .scene { display:grid; grid-template-columns:minmax(0,1.45fr) 70px minmax(0,1fr); align-items:stretch; min-height:350px; position:relative }
    .window { border:1px solid var(--rust-line); border-radius:5px; display:flex; flex-direction:column; overflow:hidden; background:white }
    .window-head { display:flex; align-items:center; justify-content:space-between; gap:10px; background:var(--rust-soft); padding:11px 16px; border-bottom:1px solid var(--rust-line) }
    .window-title { font:15px/1.4 var(--mono); color:var(--rust) }
    .window-kicker { font-size:11px; color:var(--muted) }
    .compare { border:1px solid var(--rust-line); color:var(--rust); background:white; font-size:11px; padding:4px 7px; border-radius:3px; white-space:nowrap }
    .compare[aria-pressed="true"] { color:white; background:var(--rust) }
    .budget { padding:10px 16px 9px; border-bottom:1px solid var(--rule) }
    .budget-top { display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--muted); gap:8px }
    .budget-top button { background:none; border:0; padding:0; color:var(--muted); text-decoration:underline dotted; text-underline-offset:3px; font-size:11px }
    .budget-readout { color:var(--ink); font-family:var(--mono); font-size:12px }
    .budget-track { display:flex; height:5px; gap:5px; margin-top:8px }
    .base-track { flex:3; background:var(--soft); overflow:hidden; border-radius:2px }
    .buffer-track { flex:1; background:var(--soft); border-radius:2px; overflow:hidden }
    .budget-fill { height:100%; background:var(--rust); transition:width .5s ease }
    .buffer-track .budget-fill { background:var(--gold) }
    .input { padding:11px; display:flex; flex-direction:column; gap:7px; flex:1; min-height:226px }
    .piece { display:block; width:100%; text-align:left; background:white; border:1px solid var(--rule); border-radius:3px; padding:8px 11px; line-height:1.6; position:relative }
    .piece:hover { border-color:var(--rust-line) }
    .piece .meta { display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--muted); font:10px/1.5 var(--mono); margin-bottom:3px }
    .piece .meta .open { font-family:var(--sans); color:var(--muted) }
    .piece .content { font-size:13px; display:block }
    .piece.foundation { background:var(--soft); padding:7px 11px }
    .piece.foundation .content { display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:11px; color:var(--muted) }
    .piece.guidance { border-left:3px solid var(--rust); padding:7px 11px }
    .piece.guidance .content { color:var(--rust); font-size:12px }
    .piece.signal { background:var(--rust-soft); border-color:var(--rust-line) }
    .piece.signal .meta { color:var(--rust) }
    .piece.fresh { animation:enter .45s ease both; box-shadow:inset 3px 0 0 var(--rust) }
    .piece.tool { background:var(--teal-soft); border-color:var(--teal-line) }
    .piece.action { background:var(--green-soft); border-color:var(--green-line) }
    .piece.ghost { border-style:dashed; background:transparent; color:var(--muted); text-align:center; padding:16px 10px; font-size:12px }
    .piece.past { padding:5px 10px; background:var(--soft) }
    .piece.past .meta { display:none }
    .piece.past .content { font-size:11px; color:var(--muted) }
    mark { background:var(--gold-soft); color:var(--ink); border-bottom:1px solid var(--gold-line); padding:1px 3px; border-radius:2px }
    .travelling-fact { position:fixed; z-index:9; background:var(--gold-soft); border:1px solid var(--gold-line); border-radius:3px; padding:5px 9px; font-size:12px; pointer-events:none; box-shadow:0 5px 15px #1a1a1a18 }
    .compact-log { display:flex; justify-content:space-between; gap:12px; color:var(--muted); font-size:11px; margin:2px 3px }
    .input-caption { font-size:10px; color:var(--muted); padding:0 14px 9px }
    .connection { display:flex; flex-direction:column; justify-content:center; align-items:center; gap:7px; padding:0 3px; color:var(--muted) }
    .connection .arrow { font:32px/1 var(--serif); color:var(--teal) }
    .connection .flow-name { font-size:10px; text-align:center; line-height:1.6 }
    .connection.active .arrow { animation:flow 1.4s ease-in-out 2; color:var(--teal) }
    .connection.inactive .arrow { color:var(--rule) }
    .storage { display:grid; grid-template-rows:1.05fr 1fr; gap:12px }
    .store { border:1px solid var(--teal-line); border-radius:5px; display:flex; flex-direction:column; min-width:0; background:white }
    .store-head { padding:10px 13px; display:flex; align-items:center; justify-content:space-between; gap:7px; border-bottom:1px solid var(--teal-line); background:var(--teal-soft) }
    .store-head h3 { font:14px/1.5 var(--mono); color:var(--teal) }
    .store-head span { font-size:10px; color:var(--teal) }
    .store-content { padding:11px 13px; display:flex; flex-direction:column; justify-content:center; flex:1; min-height:109px }
    .store .empty { color:var(--muted); font-size:12px; text-align:center; padding:10px 0 }
    .note-file { text-align:left; background:var(--teal-soft); border:1px solid var(--teal-line); border-radius:3px; padding:8px 10px; width:100% }
    .file-title { display:flex; align-items:center; justify-content:space-between; color:var(--teal); font:11px/1.5 var(--mono); margin-bottom:5px }
    .note-file p { font-size:12px; line-height:1.8 }
    .store-active { box-shadow:0 0 0 2px var(--teal-soft) }
    .history-items { display:flex; flex-direction:column; gap:4px }
    .history-row { border:0; border-radius:3px; background:var(--soft); text-align:left; padding:6px 8px; font-size:11px; display:flex; gap:8px; align-items:center }
    .history-row code { color:var(--teal); white-space:nowrap; font-size:10px }
    .history-row span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
    .store-foot { color:var(--muted); font-size:10px; margin-top:7px }
    .fact-track { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:12px 0; margin-top:4px; min-height:57px }
    .fact-label { font-size:12px }
    .fact-locations { display:flex; gap:12px; flex-wrap:wrap }
    .fact-locations button { display:flex; align-items:center; gap:5px; background:none; border:0; padding:3px 0; font-size:11px; color:var(--muted) }
    .status-dot { display:inline-block; width:6px; height:6px; border:1px solid var(--muted); border-radius:50% }
    .exists { color:var(--teal)!important }
    .exists .status-dot { background:var(--teal); border-color:var(--teal) }
    .takeaway { border-top:1px solid var(--rule); border-bottom:1px solid var(--rule); padding:11px 14px; font-family:var(--serif); font-size:16px; background:var(--soft) }
    .takeaway strong { color:var(--rust); font-weight:500 }
    .controls { display:flex; align-items:center; justify-content:space-between; gap:12px; background:rgba(255,255,255,.96); padding:14px 0; position:sticky; bottom:0; z-index:5; border-bottom:1px solid var(--rule) }
    .control-left { display:flex; align-items:center; gap:14px }
    .counter { font:11px/1.5 var(--mono); color:var(--muted) }
    .btn { border:1px solid var(--rule); border-radius:4px; background:white; padding:8px 15px; font-size:13px }
    .primary { background:var(--rust); border-color:var(--rust); color:white; min-width:176px }
    .restart { border:0; background:none; color:var(--muted); text-decoration:underline; font-size:11px; padding:8px 0 }
    .understory { margin-top:19px; border-bottom:1px solid var(--rule) }
    .understory summary { cursor:pointer; padding:0 0 15px; font-size:12px; color:var(--muted); width:fit-content }
    .code-wrap { display:grid; grid-template-columns:1.5fr 1fr; gap:18px; padding-bottom:18px }
    .code-panel { border:1px solid var(--rule); background:var(--soft); border-radius:4px; padding:14px 0 }
    .code-panel h3 { font:11px/1.5 var(--sans); color:var(--muted); padding:0 15px 9px }
    .code-line { display:block; border:0; background:none; width:100%; text-align:left; font:11px/1.8 var(--mono); padding:4px 15px; white-space:pre-wrap }
    .code-line.active { background:var(--rust-soft); color:var(--rust); box-shadow:inset 3px 0 var(--rust) }
    .code-line:hover { background:var(--rust-soft) }
    .code-note { font-size:11px; color:var(--muted); padding:9px 15px 0; line-height:1.7 }
    footer { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:18px; font-size:11px; color:var(--muted) }
    .text-button { border:0; background:none; padding:0; font:inherit; color:var(--rust); text-decoration:underline; text-underline-offset:4px }
    dialog { padding:0; border:1px solid var(--rule); border-radius:7px; max-width:780px; width:calc(100% - 40px); max-height:86dvh; color:var(--ink); background:white; box-shadow:0 20px 80px #1a1a1a26 }
    dialog::backdrop { background:#1a1a1a66; backdrop-filter:blur(3px) }
    .dialog-head { display:flex; justify-content:space-between; align-items:flex-start; gap:20px; padding:22px 26px 16px; border-bottom:1px solid var(--rule); position:sticky; top:0; background:white; z-index:2 }
    .dialog-kicker { font:10px/1.7 var(--mono); color:var(--rust); margin-bottom:5px }
    .dialog-head h2 { font-size:25px }
    .close { flex-shrink:0; background:var(--soft); border:1px solid var(--rule); border-radius:50%; width:32px; height:32px; font-size:20px; line-height:1 }
    .dialog-body { padding:21px 26px 26px; font-size:14px }
    .dialog-body p + p { margin-top:12px }
    .dialog-body h3 { font-size:18px; margin:20px 0 9px }
    .dialog-body .note { padding:12px 15px; border-left:3px solid var(--teal); background:var(--teal-soft); font-size:13px; margin:16px 0 }
    .dialog-body .small { font-size:12px; color:var(--muted) }
    .prompt-meta { display:flex; gap:7px; flex-wrap:wrap; margin:14px 0 }
    .prompt-meta span { padding:4px 8px; background:var(--soft); border-radius:3px; font-size:11px; color:var(--muted) }
    .languages { display:flex; gap:4px; margin:17px 0 11px }
    .languages button { padding:6px 12px; background:white; border:1px solid var(--rule); border-radius:3px; font-size:12px }
    .languages [aria-pressed="true"] { color:var(--rust); background:var(--rust-soft); border-color:var(--rust-line) }
    .prompt-text { white-space:pre-wrap; overflow-wrap:anywhere; padding:17px; border:1px solid var(--rule); background:var(--soft); font:13px/1.9 var(--sans); margin:0 }
    .prompt-text.english { font:12px/1.9 var(--mono) }
    .parallel { display:grid; grid-template-columns:1fr 1fr; gap:12px }
    .parallel .prompt-text { padding:13px; font-size:12px }
    .prompt-copy-label { font:10px/1.5 var(--mono); color:var(--muted); margin-bottom:7px }
    .jump { margin-top:17px }
    .detail-code { background:var(--soft); border:1px solid var(--rule); border-radius:3px; white-space:pre-wrap; overflow-wrap:anywhere; padding:15px; font:12px/1.9 var(--mono); margin:14px 0 }
    .source-list { padding-left:18px; font-size:12px; line-height:2 }
    .prediction { display:flex; flex-wrap:wrap; gap:7px; margin:15px 0 }
    .prediction button { padding:8px 12px; border:1px solid var(--rule); background:var(--soft); border-radius:3px; font-size:12px }
    .prediction button.correct { border-color:var(--green); background:var(--green-soft) }
    @keyframes enter { from { opacity:0; transform:translateY(7px) } to { opacity:1; transform:none } }
    @keyframes flow { 50% { transform:translateX(4px); opacity:.55 } }
    @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; scroll-behavior:auto!important } }
    @media (max-width:900px) {
      .page { padding:24px 20px }
      .masthead { margin-bottom:16px }
      .eyebrow { margin-bottom:6px }
      .lead { margin-top:7px; font-size:15px }
      .edition { display:none }
      .scene { grid-template-columns:minmax(0,1.35fr) 48px minmax(0,1fr) }
      .connection .flow-name { font-size:9px }
      .narrative { min-height:109px }
    }
    @media (max-width:620px) {
      .page { padding:22px 16px 18px }
      .masthead { margin-bottom:18px }
      h1 { font-size:29px; line-height:1.35 }
      .lead { font-size:14px; line-height:1.8; margin-top:7px }
      .eyebrow { font-size:9px }
      .toolbar { align-items:flex-start; flex-direction:column; gap:10px; padding:11px 0 }
      .scenario-control { width:100% }
      select { flex:1; min-width:0; font-size:12px }
      .prompt-shortcuts { width:100%; justify-content:flex-end }
      .prompt-shortcuts .small-label { margin-right:auto }
      .prompt-shortcuts button { padding:4px 8px; font-size:10px }
      .narrative { align-items:flex-start; min-height:139px; gap:9px; padding:13px 0 16px }
      .chapter { width:36px; font-size:32px; padding-top:3px }
      .narrative h2 { font-size:22px; margin-bottom:6px }
      .narrative p { font-size:13px; line-height:1.8 }
      .scene { display:flex; flex-direction:column; gap:0 }
      .window-head { padding:10px 12px }
      .input { min-height:264px }
      .connection { flex-direction:row; height:35px; padding:0; gap:10px }
      .connection .arrow { font-size:24px; transform:rotate(90deg) }
      .connection.active .arrow { animation:none }
      .connection .flow-name { font-size:10px }
      .storage { grid-template-columns:1fr 1fr; grid-template-rows:auto; gap:9px }
      .store-head { padding:8px 9px; flex-wrap:wrap; gap:0 }
      .store-head h3 { font-size:12px; width:100% }
      .store-head span { font-size:9px }
      .store-content { padding:8px; min-height:130px }
      .note-file { padding:6px }
      .note-file p { font-size:10px }
      .file-title { font-size:9px }
      .file-title .file-open { display:none }
      .history-row { flex-direction:column; align-items:flex-start; gap:0; padding:4px 5px; font-size:10px }
      .history-row span { width:100% }
      .store-foot { font-size:9px }
      .fact-track { flex-direction:column; align-items:flex-start; gap:4px; padding:11px 0 }
      .fact-label { font-size:11px }
      .fact-locations { gap:14px }
      .fact-locations button { font-size:10px }
      .takeaway { font-size:15px; padding:10px 12px }
      .controls { padding:12px 0 calc(12px + env(safe-area-inset-bottom)); gap:9px }
      .control-left { gap:9px }
      .primary { min-width:0; padding:9px 13px; font-size:12px }
      .btn { padding:8px 11px }
      .counter { font-size:10px }
      .restart { display:none }
      .code-wrap { grid-template-columns:1fr }
      .code-line { font-size:10px }
      footer { align-items:flex-start; font-size:10px; gap:12px }
      dialog { width:calc(100% - 22px); max-height:90dvh }
      .dialog-head { padding:18px 18px 13px }
      .dialog-head h2 { font-size:23px }
      .dialog-body { padding:17px 18px 22px; font-size:13px }
      .parallel { grid-template-columns:1fr }
      .prompt-text { font-size:12px }
    }

    .store-head h3 button { display:flex; align-items:center; gap:9px; color:inherit; background:none; border:0; padding:0; font:inherit; text-align:left }
    .store-head h3 button span { font:10px var(--sans); border-bottom:1px solid var(--teal-line) }
    dialog { max-width:1000px }
    .origin-label { background:var(--gold-soft); border-left:3px solid var(--gold-line); padding:9px 12px; font-size:11px; line-height:1.7; margin:15px 0 }
    .raw-label { font-size:11px; color:var(--muted); margin:12px 0 4px; line-height:1.7 }
    .raw-code { margin:5px 0 13px; font-size:12px; line-height:1.85 }
    .raw-details { border-top:1px solid var(--rule); margin-top:17px; padding-top:11px }
    .raw-details summary { cursor:pointer; color:var(--rust); font-size:12px; padding:4px 0 9px }
    .compact-note { margin:12px 0!important; padding:9px 12px!important }
    .storage-path { display:flex; align-items:center; flex-wrap:wrap; gap:14px; padding:10px 13px; background:var(--teal-soft); color:var(--teal); margin-top:17px; border:1px solid var(--teal-line); border-radius:3px }
    .storage-path span { font-size:11px }
    .inspect-tabs { display:flex; flex-wrap:wrap; gap:7px; margin:15px 0 }
    .inspect-tabs button { padding:7px 11px; border:1px solid var(--rule); border-radius:3px; background:white; font-size:12px }
    .inspect-tabs [aria-pressed="true"] { background:var(--rust-soft); color:var(--rust); border-color:var(--rust-line) }
    .browser-grid { display:grid; grid-template-columns:220px minmax(0,1fr); border:1px solid var(--rule); border-radius:4px; overflow:hidden; margin:12px 0 }
    .record-list { padding:8px; background:var(--soft); border-right:1px solid var(--rule); max-height:570px; overflow:auto }
    .record-list button { display:block; text-align:left; width:100%; padding:8px 10px; background:transparent; border:1px solid transparent; border-radius:3px }
    .record-list button + button { margin-top:4px }
    .record-list button span { display:block; color:var(--muted); font-size:10px }
    .record-list button strong { display:block; font-size:12px; font-weight:500; margin-top:3px }
    .record-list [aria-pressed="true"] { background:white; border-color:var(--teal-line) }
    .record-list [aria-pressed="true"] strong { color:var(--teal) }
    .record-content { padding:13px 17px; min-width:0; max-height:570px; overflow:auto }
    .record-content h3 { margin:0 0 8px }
    .file-browser { border:1px solid var(--rule); padding:13px 16px; margin:12px 0 }
    .file-banner { display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; padding-bottom:10px; border-bottom:1px solid var(--rule); font-size:11px; color:var(--muted) }
    .file-banner code { color:var(--teal); font-size:12px }
    .path-map { display:flex; flex-wrap:wrap; align-items:center; gap:10px; font-size:12px; margin:13px 0 }
    .path-map span { color:var(--muted); font-size:11px }
    .tool-links { display:flex; flex-wrap:wrap; gap:10px; margin:15px 0 }
    .inline-tool { background:white; border:1px solid var(--teal-line); color:var(--teal); border-radius:3px; padding:4px 8px; font-size:12px }
    .tool-catalog { display:grid; grid-template-columns:1fr 1.3fr 1.3fr; gap:10px; margin:17px 0 21px }
    .tool-catalog section { background:var(--soft); border:1px solid var(--rule); padding:9px; min-width:0 }
    .tool-catalog h3 { font:12px var(--sans); color:var(--muted); margin:0 0 9px }
    .tool-catalog button { display:block; width:100%; padding:7px 8px; border:1px solid transparent; border-radius:3px; background:transparent; text-align:left; font-size:12px }
    .tool-catalog button code { display:block; font-size:11px; overflow-wrap:anywhere }
    .tool-catalog button span { display:block; font-size:10px; color:var(--muted); margin-top:2px }
    .tool-catalog [aria-pressed="true"] { background:white; border-color:var(--rust-line); color:var(--rust) }
    .tool-selected { border-top:2px solid var(--rust-line); padding-top:1px }
    .tool-selected > h3:first-child { font-family:var(--sans); font-size:17px; overflow-wrap:anywhere }
    .parameter-list { display:grid; grid-template-columns:1fr 1fr; border-top:1px solid var(--rule); margin:12px 0 }
    .parameter-list > div { border-bottom:1px solid var(--rule); padding:10px 12px 10px 0 }
    .parameter-list code { font-size:12px; color:var(--teal) }
    .parameter-list p { font-size:12px; margin:4px 0!important }
    .parameter-list .parameter-en { font-size:11px; color:var(--muted) }
    .required { color:var(--muted); font-size:10px; margin-left:10px }
    .paired-copy { display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:9px 13px 14px; background:var(--soft); margin-top:18px }
    .paired-copy p { font-size:12px }
    .field-guide { border-top:1px solid var(--rule); margin:14px 0 }
    .field-guide > div { display:flex; align-items:baseline; gap:16px; border-bottom:1px solid var(--rule); padding:8px 0; font-size:12px }
    .field-guide code { min-width:110px; color:var(--teal); font-size:11px }
    .snapshot-legend { display:flex; flex-wrap:wrap; gap:15px; margin:13px 0; font-size:12px; color:var(--teal) }
    @media(max-width:620px) {
      .browser-grid { grid-template-columns:1fr }
      .record-list { display:grid; grid-template-columns:1fr 1fr; max-height:230px; border-right:0; border-bottom:1px solid var(--rule) }
      .record-list button + button { margin-top:0 }
      .record-content { padding:12px; max-height:none }
      .tool-catalog { grid-template-columns:1fr; gap:7px }
      .tool-catalog section { display:grid; grid-template-columns:1fr 1fr }
      .tool-catalog h3 { grid-column:1 / -1 }
      .parameter-list,.paired-copy { grid-template-columns:1fr }
      .field-guide > div { gap:9px }
      .field-guide code { min-width:85px }
      .raw-code { font-size:11px; padding:11px }
    }

    .history-tabs { align-items:center }
    .history-tabs > code { font-size:11px; color:var(--teal); margin-right:5px }
    .sample-label { margin:8px 0!important; font-size:10px!important }
    .tool-browser { display:grid; grid-template-columns:240px minmax(0,1fr); border:1px solid var(--rule); margin-top:17px; border-radius:4px; overflow:hidden }
    .tool-browser .tool-catalog { display:block; margin:0; max-height:570px; overflow:auto; background:var(--soft); border-right:1px solid var(--rule); padding:6px }
    .tool-browser .tool-catalog section { border:0; background:transparent; padding:7px 3px }
    .tool-browser .tool-catalog h3 { margin:2px 8px 6px; font-size:11px }
    .tool-browser .tool-catalog button { padding:6px 8px }
    .tool-browser .tool-selected { max-height:570px; overflow:auto; min-width:0; border:0; padding:13px 18px }
    .tool-browser .tool-selected > h3:first-child { margin-top:0 }
    .tool-browser .parameter-list { grid-template-columns:1fr }
    .tool-browser .paired-copy { grid-template-columns:1fr; gap:4px }
    @media(max-width:620px) {
      .tool-browser { grid-template-columns:1fr }
      .tool-browser .tool-catalog { max-height:220px; border-right:0; border-bottom:1px solid var(--rule) }
      .tool-browser .tool-catalog section { display:grid; grid-template-columns:1fr 1fr }
      .tool-browser .tool-selected { max-height:none; padding:13px }
    }

    .assembly-map { display:grid; grid-template-columns:1fr 1.4fr 1.7fr 1fr; gap:7px; margin:12px 0 16px; align-items:stretch }
    .assembly-map > div { position:relative; padding:8px 10px; background:var(--soft); border:1px solid var(--rule); border-radius:3px; font-size:12px }
    .assembly-map b { color:var(--rust); margin-right:5px; font-weight:500 }
    .assembly-map small { display:block; margin-top:3px; color:var(--muted); font-size:10px }
    .assembly-map .map-window { background:var(--rust-soft); border-color:var(--rust-line) }
    .assembly-map .map-hint { color:var(--teal) }
    .assembly-caption { font-size:11px; color:var(--muted); margin-top:8px!important }
    @media(max-width:620px) { .assembly-map { grid-template-columns:1fr 1fr } }
    .assembly-lead { font-size:14px; line-height:1.8; margin-bottom:15px }
    .assembly-request { border:1px solid var(--rule); border-radius:5px; overflow:hidden }
    .assembly-request-head { display:flex; justify-content:space-between; flex-wrap:wrap; gap:6px; padding:10px 14px; background:var(--soft); font-size:12px }
    .assembly-tools { padding:9px 14px; border-bottom:1px solid var(--rule); display:flex; align-items:baseline; flex-wrap:wrap; gap:9px; font-size:12px }
    .assembly-tools > code { color:var(--rust) }
    .assembly-input { margin:13px; padding-left:14px; border-left:2px solid var(--rust-line) }
    .assembly-input-label { color:var(--rust); font:12px var(--mono); margin-bottom:10px }
    .assembly-message { border:1px solid var(--rule); border-radius:3px; margin:8px 0; overflow:hidden }
    .assembly-message-head { display:flex; align-items:baseline; flex-wrap:wrap; gap:9px; padding:8px 11px; background:var(--soft); font-size:12px }
    .assembly-message-head b { color:var(--rust); font:12px var(--mono) }
    .assembly-message-head code { color:var(--muted); font-size:11px }
    .assembly-brief { margin-left:auto; color:var(--muted); font-size:11px }
    .assembly-message-body { padding:10px 13px }
    .assembly-message-body .tag { color:var(--rust); font:11px/1.7 var(--mono); overflow-wrap:anywhere }
    .assembly-guidance { padding:4px 0 }
    .assembly-guidance > summary { cursor:pointer; color:var(--ink); font-size:12px; line-height:1.8 }
    .assembly-guidance > summary span { color:var(--rust); margin-left:5px; font-size:11px }
    .assembly-guidance .parallel { margin-top:12px }
    .assembly-guidance .prompt-text { font-size:12px }
    .assembly-window { border-color:var(--rust-line) }
    .assembly-window > .assembly-message-head { background:var(--rust-soft) }
    .assembly-window pre { margin:0; padding:0; border:0; background:none; color:var(--ink); font:11px/1.85 var(--mono); white-space:pre-wrap; overflow-wrap:anywhere }
    .assembly-switch { display:flex; align-items:center; flex-wrap:wrap; gap:6px; font-size:11px; margin:0 0 8px }
    .assembly-switch span { color:var(--muted) }
    .assembly-switch button { font-size:11px; border:1px solid var(--rule); border-radius:3px; background:white; padding:3px 8px }
    .assembly-switch button[aria-pressed="true"] { color:var(--teal); background:var(--teal-soft); border-color:var(--teal-line) }
    .assembly-hint { margin:6px 0; padding:8px 10px; border-left:3px solid var(--teal); background:var(--teal-soft) }
    .assembly-hint pre { color:var(--teal) }
    .assembly-hint p { color:var(--teal); font-size:11px; margin-top:5px }
    .assembly-absence { font-size:11px; color:var(--muted); margin-top:8px }
    .assembly-next { margin-top:14px; padding:11px 14px; background:var(--soft); border-left:3px solid var(--rust); font-size:12px; line-height:1.8 }
    .assembly-next .tool-links { margin:5px 0 0 }
    .assembly-translation pre { font-size:12px }
    @media(max-width:620px) {
      .assembly-input { margin:9px; padding-left:8px }
      .assembly-message-head { gap:5px; padding:8px }
      .assembly-brief { width:100%; margin-left:0 }
      .assembly-message-body { padding:9px }
      .assembly-window pre { font-size:10px }
      .assembly-request-head,.assembly-tools { padding:9px }
    }

    :host([embedded]) .masthead, :host([embedded]) footer { display:none }
    :host([embedded]) .page { max-width:none; padding:0 }
</style>
<div class="page">
  <header class="masthead">
    <div>
      <div class="eyebrow">CODEX / AN EXPLORABLE EXPLANATION</div>
      <h1>换一扇窗，怎样继续同一个任务？</h1>
      <p class="lead">跟着一句“不能修改 public API”，走过两扇上下文窗口。</p>
    </div>
    <div class="edition">CONTEXT LAB · 01<br>ASTRA / 2026.10<button type="button" data-detail="scope">演示范围与版本 ↗</button></div>
  </header>
  <main>
    <div class="toolbar">
      <div class="scenario-control">
        <label class="small-label" for="scenario">换一种走法</label>
        <select id="scenario">
          <option value="fallback">完整流程：收到兜底提示后保存</option>
          <option value="early">提前保存，然后主动换窗</option>
          <option value="direct">不写 Notes，直接主动换窗</option>
          <option value="forced">一直不写 Notes，直到被迫换窗</option>
        </select>
      </div>
      <div class="prompt-shortcuts" aria-label="三段提示的详情">
        <span class="small-label">提示词</span>
        <button type="button" data-prompt="guidance">guidance</button>
        <button type="button" data-prompt="reminder">reminder</button>
        <button type="button" data-prompt="fallback">fallback</button>
      </div>
    </div>
    <section class="route-map" aria-label="所有走法的分支流程图">
      <div class="route-map-head"><span>同一张图，切换走法看分支；点击点亮的节点查看这一步。</span><div class="route-legend" aria-hidden="true"><span><i></i>当前路线</span><span><i class="other-line"></i>其他走法</span><span><i class="current-node"></i>当前步骤</span></div></div>
      <div class="graph-scroll" id="graph-scroll"><div class="route-graph" id="timeline" role="group" aria-label="运行步骤"></div></div>
      <p class="graph-scroll-hint">左右滑动可看完整流程 →</p>
    </section>
    <section class="narrative" aria-live="polite" aria-atomic="true">
      <div class="chapter" id="chapter" aria-hidden="true">01</div>
      <div><h2 id="step-title"></h2><p id="step-description"></p></div>
    </section>
    <section class="scene" aria-label="当前模型输入与外部存储">
      <div class="window">
        <div class="window-head">
          <div><div class="window-title" id="window-title"></div><div class="window-kicker" id="window-kicker">模型下一次调用能看到的输入</div></div>
          <button type="button" class="compare" id="compare" aria-pressed="false" hidden>对比换窗前</button>
        </div>
        <div class="budget">
          <div class="budget-top"><button type="button" data-detail="budget">上下文余量 ⓘ</button><span class="budget-readout" id="budget-readout"></span></div>
          <div class="budget-track" aria-hidden="true"><div class="base-track"><div class="budget-fill" id="base-fill"></div></div><div class="buffer-track"><div class="budget-fill" id="buffer-fill"></div></div></div>
        </div>
        <div class="input" id="input"></div>
        <div class="input-caption">精选输入片段，按作用聚合；点开卡片看细节。</div>
      </div>
      <div class="connection inactive" id="connection" aria-hidden="true"><span class="arrow" id="flow-arrow">↔</span><span class="flow-name" id="flow-name">按需读写</span></div>
      <div class="storage" aria-label="窗口外，换窗仍保留">
        <section class="store" id="notes-store">
          <div class="store-head"><h3><button type="button" data-detail="notes" aria-label="打开 Notes 文件结构">Notes <span>打开 ↗</span></button></h3><span>Agent 主动写 · 可修改</span></div>
          <div class="store-content" id="notes-content"></div>
        </section>
        <section class="store" id="history-store">
          <div class="store-head"><h3><button type="button" data-detail="history" aria-label="打开 History 条目结构">History <span>打开 ↗</span></button></h3><span>系统异步留档 · 只读</span></div>
          <div class="store-content" id="history-content"></div>
        </section>
      </div>
    </section>
    <div class="fact-track">
      <div class="fact-label">追踪 <mark>不能修改 public API</mark> 这条约束</div>
      <div class="fact-locations" id="fact-locations"></div>
    </div>
    <p class="takeaway" id="takeaway"></p>
    <nav class="controls" aria-label="控制演示">
      <div class="control-left">
        <button type="button" class="btn" id="prev">← 上一步</button>
        <span class="counter" id="counter"></span>
        <button type="button" class="restart" id="restart">从头看</button>
      </div>
      <button type="button" class="btn primary" id="next"></button>
    </nav>
    <details class="understory" id="logic">
      <summary>展开同步伪代码 · 看谁在决定下一步</summary>
      <div class="code-wrap">
        <div class="code-panel">
          <h3>运行时：组装输入、注入提示、执行换窗</h3>
          <button type="button" class="code-line" data-line="init" data-detail="initial">input = build_context(guidance, window_ids, notes_hint)</button>
          <button type="button" class="code-line" data-line="work" data-detail="history">after_model_response:  // 每次响应结束后检查</button>
          <button type="button" class="code-line" data-line="limit" data-detail="rollover">  rollover = needs_follow_up &amp;&amp; (new_context || at_limit)</button>
          <button type="button" class="code-line" data-line="reminder" data-prompt="reminder">  if remaining &lt;= 6144 &amp;&amp; !reminded: append(reminder)</button>
          <button type="button" class="code-line" data-line="fallback" data-prompt="fallback">  if remaining == 0 &amp;&amp; !rollover &amp;&amp; !fallback_sent:
    append(fallback)  // 还要有已配置的提示与可用空间</button>
          <button type="button" class="code-line" data-line="reset" data-detail="initial">  if rollover: input = build_context(...)  // 替换旧输入</button>
          <p class="code-note">为讲解简化的 token-budget 主路径。各条 if 独立；省略扩展钩子与其他触发条件。点击代码可看解释。</p>
        </div>
        <div class="code-panel">
          <h3>Agent：遵循提示，决定记什么、读什么</h3>
          <button type="button" class="code-line" data-line="save" data-detail="notes">notes.write_file("checkpoint.md", checkpoint)</button>
          <button type="button" class="code-line" data-line="request" data-detail="rollover">functions.new_context()  // 无需提交 Notes 凭证</button>
          <button type="button" class="code-line" data-line="read" data-detail="notes">notes.read_file("checkpoint.md")</button>
          <button type="button" class="code-line" data-line="search" data-detail="locate">history.search_contents(...)  // 缺少引用时先定位</button>
          <button type="button" class="code-line" data-line="recover" data-detail="history">history.read_item(window_id, item_id)</button>
          <p class="code-note">这里是工具调用意图的伪代码，不是可以直接复制执行的 API 参数。提示要求保存；换窗工具本身没有保存门禁。</p>
        </div>
      </div>
    </details>
  </main>
  <footer>
    <span>机制演示 · 任务、条目 ID 与运行数据为教学示例</span>
    <button type="button" class="text-button" data-detail="scope">参数、默认配置与版本说明 ↗</button>
  </footer>
</div>
<dialog id="inspector" aria-labelledby="detail-title">
  <div class="dialog-head"><div><div class="dialog-kicker" id="detail-kicker"></div><h2 id="detail-title"></h2></div><button type="button" class="close" id="close" aria-label="关闭详情">×</button></div>
  <div class="dialog-body" id="detail-body"></div>
</dialog>

<script id="prompt-data" type="application/json">{"guidance_message": {"zh": "对于可能跨越多个上下文窗口的任务，使用 \`notes\` 维护一份简洁的检查点，记录目标、决策、进展、经验和下一步。对于你当前正在处理的每一条相关用户请求，以及重要操作或工具调用，都要记录其窗口 ID 和条目 ID。之后可以使用 \`history\` 工具，通过这些引用查找细节。注意，每个非 assistant 条目（例如 user、developer、工具响应）都有一个条目 ID \`[id: ...]\`，紧跟在该条目的内容之后。相对笔记路径属于当前线程；绝对路径可以读取其他线程的笔记，但写入仅限当前线程。\\n\\n建议在工作过程中逐步记笔记，以免遗漏重要信息。也可以使用 \`get_context_remaining\` 工具查询剩余 token 预算，以便更好地规划。一旦 token 预算耗尽，你将无法再访问当前窗口，并会在一个全新的上下文窗口中继续；届时只能通过 \`notes\` 和 \`history\` 工具恢复信息。因此，要避免在没有留下任何记录的情况下耗尽上下文窗口。\\n\\n如果 \`\\u003ccontext_window>\` 中存在 Previous context window id，说明发生过上下文重置，当前是一个新窗口。重置后，先读取检查点，再使用只读的 \`history\` 工具找回缺失的细节。已知窗口 ID 和条目 ID 时，优先直接使用 \`read_item\`；缺少或不确定这些 ID 时，先用 \`list_items\` 或 \`search_contents\` 定位条目。\\n\\n把 notes 和 history 当作内部记录。不要在面向用户的消息中提及它们。\\n", "en": "For tasks that may span context windows, use \`notes\` to maintain a concise checkpoint of the goal, decisions, progress, learnings and next steps. Include the window ID and item ID for every relevant user request you are currently solving as well as important actions/tool calls. You can use \`history\` tool to look up details with the references later. Note that every non-assistant item, such as user, developer, tool response, has an item id \`[id: ...]\` that is immediately after its item content. Relative note paths belong to the current thread; absolute paths may read other threads' notes, but writes are limited to the current thread.\\n\\nIt is a good idea to take incremental notes while you work so that you do not miss any important info. You can also use \`get_context_remaining\` tool to find the remaining token budget for better planning. Once the token budget is exhausted, you will lose access to the current window and continue in a fresh context window and you can only recover through \`notes\` and \`history\` tools. So be careful not to over-run the context window without any documentation.\\n\\nIf Previous context window id is present in \`\\u003ccontext_window>\`, it means a context reset occurred and this is a new window. After a reset, read the checkpoint and use the read-only \`history\` tool to recover any missing details. When a window ID and item ID are known, prefer \`read_item\` directly; when they are missing or uncertain, use \`list_items\`, or \`search_contents\` to locate the item first.\\n\\nTreat notes and history as internal bookkeeping. Do not mention them in user-facing messages.\\n"}, "reminder_message_template": {"zh": "\\u003ccontext_window_reminder>\\n当前上下文窗口即将耗尽，只剩 {n_remaining} tokens。在开启新窗口之前，使用 \`notes\` 工具保存简洁的进展笔记，记录目标、决策、进展、经验、下一步，以及仍在处理的每一条相关用户请求的窗口 ID 和条目 ID，并记录重要操作或工具调用，以便以后查阅。注意，每个非 assistant 条目（例如 user、developer、工具响应）都有一个条目 ID \`[id: ...]\`，紧跟在该条目的内容之后。写入或追加笔记时，应尽可能帮助自己在新窗口中恢复工作。如果旧笔记已经过时或不再相关，也建议进行清理。后续上下文窗口不会自动包含当前对话。保存状态后，调用 \`functions.new_context\`，在一个全新的上下文窗口中继续。\\n\\u003c/context_window_reminder>", "en": "\\u003ccontext_window_reminder>\\nYour current context window is nearly exhausted; only {n_remaining} tokens remain. Before starting a new context window, save concise progress notes with the \`notes\` tool with the goal, decisions, progress, learnings, next steps, and the window ID and item ID of every relevant user request still being solved, as well as important actions/tool calls for future reference. Note that every non-assistant item, such as user, developer, tool response, has an item id \`[id: ...]\` that is immediately after its item content. You should write or append notes in a way to best help you recover in a new context window. It is also a good idea to clean up your old notes if they become obsolete or irrelevant. Future context windows will not automatically include the current conversation. After saving your state, call \`functions.new_context\` to continue in a fresh context window.\\n\\u003c/context_window_reminder>"}, "auto_compact_fallback_prompt": {"zh": "\\u003ccontext_window_reminder>\\n当前上下文窗口已经耗尽。不要在这个窗口中继续执行任务，也不要给出最终回答。下一个窗口不会自动包含这段对话。现在恰好调用一次 \`notes\` 的写入或追加操作，保存一份简洁的检查点，记录目标、决策、进展、经验、下一步，以及仍在处理的每一条相关用户请求的窗口 ID 和条目 ID，并记录重要操作或工具调用，以便以后查阅。注意，每个非 assistant 条目（例如 user、developer、工具响应）都有一个条目 ID \`[id: ...]\`，紧跟在该条目的内容之后。等 notes 的结果返回后，调用 \`functions.new_context\`；不要使用 \`notes\` 和 \`functions.new_context\` 以外的任何工具。\\n\\u003c/context_window_reminder>", "en": "\\u003ccontext_window_reminder>\\nThe current context window is exhausted. Do not continue the task or give a final answer in this window. The next window will not automatically include this conversation. Make exactly one write or append call to \`notes\` now to save a concise checkpoint with the goal, decisions, progress, learnings, next steps, and the window ID and item ID of every relevant user request still being solved, as well as important actions/tool calls for future reference. Note that every non-assistant item, such as user, developer, tool response, has an item id \`[id: ...]\` that is immediately after its item content. After the notes result returns, call \`functions.new_context\`; do not use any tools other than \`notes\` and \`functions.new_context\`.\\n\\u003c/context_window_reminder>"}}</script>
<script id="inspection-data" type="application/json">{"tools": [{"id": "functions.new_context", "namespace": "functions", "name": "new_context", "description": "Start a new context window. Does not clear, reset, or otherwise affect environment state.", "parameters": {"type": "object", "properties": {}, "additionalProperties": false}}, {"id": "functions.get_context_remaining", "namespace": "functions", "name": "get_context_remaining", "description": "Get the remaining tokens in the current context window.", "parameters": {"type": "object", "properties": {}, "additionalProperties": false}}, {"id": "history.list_windows", "namespace": "history", "name": "list_windows", "description": "List an agent's context windows as window ID and item-count pairs. Private model-only recovery; never disclose this activity.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "description": "Maximum number of windows to return."}, "agent_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Agent whose history to inspect. Omit to use the current agent; otherwise pass an absolute agent name or a name relative to the current agent."}, "recent_first": {"type": "boolean", "description": "Whether to return the most recently created windows first."}}}}, {"id": "history.list_items", "namespace": "history", "name": "list_items", "description": "List history items with optional window, role, and tool filters. Private model-only recovery; never disclose this activity.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "description": "Maximum number of items to return."}, "recent_first": {"type": "boolean", "description": "Whether to return the most recently created items first."}, "tool_namespace": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Callable namespace to include. When set, non-tool messages are excluded."}, "role": {"anyOf": [{"type": "string", "enum": ["user", "assistant", "tool", "system", "developer"]}, {"type": "null"}], "description": "Message role to include. Null or omission includes all roles."}, "agent_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Agent whose history to inspect. Omit to use the current agent; otherwise pass an absolute agent name or a name relative to the current agent."}, "tool_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Callable tool name to include. When set, non-tool messages are excluded."}, "window_id": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Full window ID. Null or omission includes all windows."}, "max_chars_per_item": {"type": "integer", "minimum": 1, "description": "Maximum characters returned in each item's truncated_content."}}}}, {"id": "history.read_item", "namespace": "history", "name": "read_item", "description": "Read a bounded range from private model-only history. Never disclose the item or this activity.", "parameters": {"type": "object", "properties": {"agent_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Agent whose history to inspect. Omit to use the current agent; otherwise pass an absolute agent name or a name relative to the current agent."}, "item_id": {"type": "string", "description": "The short item ID is the suffix shown in the target item's trailing \`[id: ...]\` marker, printed after that item's content."}, "offset_chars": {"type": "integer", "minimum": 0, "description": "Zero-based character offset at which reading starts."}, "limit_chars": {"type": "integer", "minimum": 1, "description": "Maximum number of characters to return."}, "window_id": {"type": "string", "description": "Full window ID containing the item."}}, "required": ["item_id", "window_id"]}}, {"id": "history.search_contents", "namespace": "history", "name": "search_contents", "description": "Search private model-only history by literal substring. Never disclose results or this activity.", "parameters": {"type": "object", "properties": {"limit": {"type": "integer", "minimum": 1, "description": "Maximum number of matching items to return."}, "query": {"type": "string", "encrypted": true, "description": "Case-sensitive literal substring to find in item content."}, "recent_first": {"type": "boolean", "description": "Whether to return the most recently created matches first."}, "tool_namespace": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Callable namespace to include. When set, non-tool messages are excluded."}, "role": {"anyOf": [{"type": "string", "enum": ["user", "assistant", "tool", "system", "developer"]}, {"type": "null"}], "description": "Message role to include. Null or omission includes all roles."}, "agent_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Agent whose history to inspect. Omit to use the current agent; otherwise pass an absolute agent name or a name relative to the current agent."}, "tool_name": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Callable tool name to include. When set, non-tool messages are excluded."}, "window_id": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Full window ID. Null or omission includes all windows."}}, "required": ["query"]}}, {"id": "notes.list_files_by_prefix", "namespace": "notes", "name": "list_files_by_prefix", "description": "List private model-only notes by path prefix. Never disclose paths, contents, or this activity.", "parameters": {"type": "object", "properties": {"prefix": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Note path prefix to list."}, "max_results": {"type": "integer", "minimum": 1, "description": "Maximum number of files to return."}, "file_order_by": {"type": "string", "enum": ["name", "created_at", "updated_at"], "description": "Field used to order files."}, "file_order": {"type": "string", "enum": ["ascending", "descending"], "description": "Direction used to order files."}}}}, {"id": "notes.read_file", "namespace": "notes", "name": "read_file", "description": "Read all or a line range from private model-only notes. Never disclose paths, contents, or this activity.", "parameters": {"type": "object", "properties": {"path": {"type": "string", "description": "Note file path to read."}, "start_line": {"anyOf": [{"type": "integer"}, {"type": "null"}], "description": "First line to return, inclusive and 1-based. Negative values count backward from the final line."}, "stop_line": {"anyOf": [{"type": "integer"}, {"type": "null"}], "description": "Last line to return, inclusive and 1-based. Negative values count backward from the final line."}}, "required": ["path"]}}, {"id": "notes.search_contents", "namespace": "notes", "name": "search_contents", "description": "Search private model-only note lines by literal substring. Never disclose results or this activity.", "parameters": {"type": "object", "properties": {"max_matches_per_file": {"type": "integer", "minimum": 1, "description": "Maximum number of matching lines returned per file."}, "query": {"type": "string", "encrypted": true, "description": "Case-sensitive literal substring to find in note lines."}, "recent_file_first": {"type": "boolean", "description": "Whether to order matching files by creation time, newest first."}, "max_files": {"type": "integer", "minimum": 1, "description": "Maximum number of matching files returned."}, "path_prefix": {"anyOf": [{"type": "string"}, {"type": "null"}], "description": "Note path prefix to search."}}, "required": ["query"]}}, {"id": "notes.append_to_file", "namespace": "notes", "name": "append_to_file", "description": "Append text to private model-only notes. Never disclose paths, contents, or this activity.", "parameters": {"type": "object", "properties": {"text": {"type": "string", "encrypted": true, "description": "Text appended exactly as provided."}, "path": {"type": "string", "description": "Note file path to append to."}}, "required": ["text", "path"]}}, {"id": "notes.write_file", "namespace": "notes", "name": "write_file", "description": "Create or replace private model-only notes. Never disclose paths, contents, or this activity.", "parameters": {"type": "object", "properties": {"text": {"type": "string", "encrypted": true, "description": "Complete replacement text for the file."}, "path": {"type": "string", "description": "Note file path to create or replace."}}, "required": ["text", "path"]}}], "historyDescription": "Recover prior conversation after a context-window reset by listing, reading, and searching normalized history using agent names and the opaque window and item IDs returned by these tools. Pass returned IDs unchanged when filtering or reading an item. Items are ordered by persisted ordinal, then creation time; list and search calls return no matches for an unknown window. Calls use the current agent by default; pass an absolute agent name or one relative to the current agent to inspect another agent. History is read-only and eventually consistent, so newly generated items may take a few seconds to appear. This is private model-only state. Use it silently to continue the task. Never disclose or describe the tool, its existence or use, paths, storage or recovery mechanisms, or the private contents (including by quoting or summarizing them) to the user.", "notesDescription": "Read and maintain private notes that survive context-window transitions within this rollout. Paths are virtual, not filesystem paths. Relative file paths use the current agent's \\u003cagent_name>/notes directory; cross-agent paths must be absolute. Absolute paths use \\u003cagent_name>/notes[/\\u003cpath>]. Reads, listings, searches, and writes may access other agents' notes. File operations require \\u003cpath>; path-prefix arguments may be omitted to use the current notes directory. Empty, '.', and '..' path components are unsupported. Shell expansion is not performed, so '~' is treated literally. Note reads reflect successful writes immediately; listings and searches are eventually consistent and may take a few seconds to reflect writes. Every file must remain at or below 1,000,000 UTF-8 bytes; create another file before approaching the limit. This is private model-only state. Use it silently to continue the task. Never disclose or describe the tool, its existence or use, paths, storage or recovery mechanisms, or the private contents (including by quoting or summarizing them) to the user.", "snapshot": "---\\nsource: core/tests/suite/token_budget.rs\\nexpression: snapshot\\n---\\nScenario: New context window tool installs fresh full context before the next follow-up request.\\n\\n## Window 1\\n-- request 1 (turn; Final Follow-Up Request) --\\n00:message/developer:\\n    \\u003cMODEL_INSTRUCTIONS>\\n01:message/developer[2]:\\n    [01] \\u003cSKILLS_INSTRUCTIONS>\\n    [02] \\u003cPERMISSIONS_INSTRUCTIONS>\\n02:message/developer[3]:\\n    [01] \\u003ccontext_window>\\n    [02]\\n        Agent name: /root\\n        First context window id: \\u003cUUID 1>\\n        Current context window id: \\u003cUUID 2>\\n        Previous context window id: \\u003cUUID 1>\\n\\n    [03] \\u003c/context_window>\\n03:message/user:\\n    \\u003cENVIRONMENT_CONTEXT>\\n04:function_call/update_plan:{\\"plan\\":[{\\"status\\":\\"in_progress\\",\\"step\\":\\"Continue in the new context window\\"}]}\\n05:function_call_output:Plan updated\\n", "hint": "Recent notes (up to 5, most-recent first):\\n- /root/worker/notes/latest.md (2 lines, 14 UTF-8 bytes)"}</script>
`;
  class CodexContextLab extends HTMLElement {
    connectedCallback() {
      if (this.shadowRoot) return;
      // Keep article styles and event handlers outside the interactive lab.
      const root = this.attachShadow({mode:"open"});
      root.append(template.content.cloneNode(true));
      initialize(root);
      // The wide article demo uses the same side margin as the fixed contents panel.
      const contents = this.hasAttribute("embedded") && document.querySelector("[data-article-toc]");
      if (contents) {
        new IntersectionObserver(([entry]) => {
          contents.style.visibility = entry.isIntersecting ? "hidden" : "";
        }).observe(this);
      }
    }
  }
function initialize(root) {
  "use strict";
  const $ = id => root.getElementById(id);
  const prompts = JSON.parse($("prompt-data").textContent);
  const constraint = '<mark>不能修改 public API</mark>';
  const checkpoint = '目标：修复 cache invalidation bug，并跑完测试。\n约束：不能修改 public API。\n发现：缓存失效时机不正确；失败测试已复现。\n下一步：修改内部缓存逻辑，再跑回归测试。\n引用：用户请求 W1 / U1；失败测试 W1 / T8。';
  const routes = {
    fallback:["start","work","reminder","fallback","save","request","reset","read","recover","finish"],
    early:["start","work","reminder","save","request","reset","read","recover","finish"],
    direct:["start","work","request","reset","locate","recover","finish"],
    forced:["start","work","reminder","fallback","limit","reset","locate","recover","finish"]
  };
  const scenes = {
    start:{label:"接任务",title:"先给 Agent 一套“跨窗工作方法”",description:"用户交付修复任务。同时，初始上下文带上 guidance：工作中逐步记 Notes，换窗后读 Notes，缺细节再查 History。",budget:"充足",base:100,buffer:100,code:"init",prompt:"guidance",takeaway:"guidance 从开始就存在；<strong>不必等快满了才记笔记。</strong>",next:"开始排查 bug →"},
    work:{label:"工作",title:"工具结果越来越多，窗口越来越满",description:"Agent 已定位缓存问题，拿到了失败测试。目标、约束和原始证据都还在当前输入里；History 也自动保留这些条目。",budget:"剩余 8,000",base:32,buffer:100,code:"work",takeaway:"History 保留原始细节；<strong>Notes 要由 Agent 自己挑选、整理和写入。</strong>",next:"继续，接近阈值 →"},
    reminder:{label:"提醒",title:"剩余 6,000：下一次输入多出一段提醒",description:"一次响应结束后，运行时发现基础预算已低于 6,144，于是插入 reminder：先保存进展，再主动换窗。每个窗口只提醒一次。",budget:"剩余 6,000",base:24,buffer:100,code:"reminder",prompt:"reminder",takeaway:"阈值是 6,144；<strong>实际插入时可以更低，提醒不会在生成中途打断模型。</strong>",next:"这次没保存，继续执行 →"},
    fallback:{label:"兜底",title:"基础预算归零，再给一次保存机会",description:"这次 Agent 没有响应前面的提醒。基础预算已用完，但还没碰到最终限制：旧窗口收到 fallback，要求写一次 Notes，再调用 new_context。",budget:"基础 0 · 进入 buffer",base:0,buffer:100,code:"fallback",prompt:"fallback",takeaway:"额外 buffer 最多 16,384 tokens；<strong>这段空间用来交接，仍受完整上下文硬上限约束。</strong>",next:"Agent 写下检查点 →"},
    save:{label:"写 Notes",title:"把“继续工作需要知道什么”写到窗外",description:"Agent 调用 Notes 工具，把目标、约束、发现和下一步写进 checkpoint.md，并留下 W1 / U1、W1 / T8 两个原始条目的引用。",budget:"交接中",base:0,buffer:73,code:"save",flow:"write",takeaway:"Notes 的内容由 Agent 组织；<strong>运行时不会自动替它写一篇交接摘要。</strong>",next:"调用 new_context →"},
    request:{label:"请求换窗",title:"Notes 返回后，Agent 主动请求换窗",description:"new_context 不接收摘要，也不检查检查点是否齐全。它设置换窗请求；这一轮还需要继续执行时，运行时处理这个请求。",budget:"准备换窗",base:0,buffer:62,code:"request",takeaway:"主动请求可以提前换窗，<strong>不必等预算耗尽，也不必等 fallback。</strong>",next:"创建 Window #2 →"},
    limit:{label:"到达上限",title:"连 buffer 也耗尽了，运行时必须换窗",description:"这个分支里，Agent 连 fallback 也没有遵守，仍未写 Notes。达到基础预算加 buffer 的限制，或更早撞到硬上限，且还需继续执行时，运行时触发换窗。",budget:"到达最终限制",base:0,buffer:0,code:"limit",takeaway:"运行时<strong>不会等待 Notes 写好</strong>；这条路径也不会因此改用传统 summary compaction。",next:"仍然创建 Window #2 →"},
    reset:{label:"新窗口",title:"新窗口建立了，但它还不知道这项任务",description:"旧对话被移出当前输入。新输入由当前运行规则、环境、guidance、窗口 ID，以及可用的 Notes 提示重新组成。此刻还没有读 Notes 正文。",budget:"新窗口 · 余量恢复",base:100,buffer:100,code:"reset",takeaway:"<strong>外部仍有记录 ≠ 模型已经读到了记录。</strong>现在点击“对比换窗前”，看约束消失在哪一边。",next:"读取 checkpoint.md →"},
    read:{label:"读 Notes",title:"一次读取，让任务重新进入模型视野",description:"guidance 告诉 Agent：看到 Previous window ID 就先恢复。Agent 按 Notes 提示读取 checkpoint.md，工具结果把目标、约束和下一步带回当前输入。",budget:"新窗口 · 恢复任务",base:88,buffer:100,code:"read",flow:"read",takeaway:"Notes 正文是<strong>通过一次工具读取重新进入输入</strong>的，并非在换窗时自动全文注入。",next:"用引用找回失败日志 →"},
    locate:{label:"找历史",title:"没有检查点，就先去 History 找路",description:"Agent 只能借助 Previous window ID 定位旧窗口，再用 list_items 或 search_contents 找到用户请求与相关工具结果。这个演示选择了成功找回的路径。",budget:"新窗口 · 定位条目",base:90,buffer:100,code:"search",flow:"search",takeaway:"没有 Notes 也有 History 可查；<strong>但要额外寻找相关条目，恢复质量取决于 Agent。</strong>",next:"读取找到的原始条目 →"},
    recover:{label:"查 History",title:"按引用补回原始细节",description:"检查点已经保留了 W1 / T8。Agent 直接读取这条失败测试结果，拿到精确断言；无需把整个旧窗口再次装回上下文。",budget:"新窗口 · 证据已恢复",base:79,buffer:100,code:"recover",flow:"history",takeaway:"<strong>Notes 保存工作线索，History 保存可回查的原始证据。</strong>读哪一段，由 Agent 决定。",next:"带着恢复的信息继续 →"},
    finish:{label:"继续",title:"还是同一项任务，输入已经换了一轮",description:"Agent 现在再次知道：修复缓存问题、跑测试、保持 public API 不变。它继续修改内部实现；磁盘上的代码和外部工作状态并没有因为换窗而重置。",budget:"新窗口 · 继续执行",base:71,buffer:100,code:"work",takeaway:"跨窗连续性来自<strong>保存 → 换窗 → 按需恢复</strong>，每一步都有明确的执行者。",next:"换个分支，看看差别 ↺"}
  };
  const promptInfo = {
    guidance:{field:"guidance_message",title:"guidance · 怎么跨窗工作",purpose:"从一开始就教 Agent 维护检查点，并约定新窗口的恢复方法。它随完整上下文的构建或重建提供。",when:"完整上下文建立时",parameter:"无独立阈值",instruction:"工作中逐步保存；换窗后先读 Notes，缺细节再查 History。",step:"start"},
    reminder:{field:"reminder_message_template",title:"reminder · 快满了，先保存",purpose:"响应结束后检查基础预算剩余量，达到提醒阈值就追加到输入，让下一次模型调用看到。",when:"基础剩余 ≤ 6,144",parameter:"每窗口最多一次",instruction:"保存当前状态，然后调用 functions.new_context。",step:"reminder"},
    fallback:{field:"auto_compact_fallback_prompt",title:"fallback · 停下任务，完成交接",purpose:"基础预算归零、尚未决定换窗且仍有空间时，运行时给旧窗口一次保存机会。主动 new_context 或已经到最终限制时会跳过它。",when:"基础剩余 = 0，尚有余量",parameter:"buffer 最多 16,384",instruction:"恰好写入或追加一次 Notes；等结果返回后，再调用 functions.new_context。",step:"fallback"}
  };
  let route="fallback", index=0, comparing=false, promptLanguage="zh", openPrompt=null;
  const dialog=$("inspector");
  const escape = text => String(text).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const steps = () => routes[route];
  const key = () => steps()[index];
  const hasSaved = () => ["fallback","early"].includes(route) && index >= steps().indexOf("save");
  const isNewWindow = () => index >= steps().indexOf("reset");
  const hasRead = () => isNewWindow() && ["read","recover","finish"].includes(key());
  const hadReminder = () => route!=="direct" && index>=steps().indexOf("reminder");
  const hadFallback = () => ["fallback","forced"].includes(route) && index>=steps().indexOf("fallback");
  const graphNodes=[
    ["start",54,148,"guidance"],["work",164,148,"消息与工具"],
    ["reminder",274,148,"reminder"],["fallback",384,148,"fallback"],
    ["save",494,148,"保存检查点"],["request",604,148,"new_context"],
    ["reset",714,148,"Window #2"],["read",824,148,"读回检查点"],
    ["recover",934,148,"恢复原始细节"],["finish",1044,148,"保留原约束"],
    ["limit",494,238,"运行时换窗"],["locate",824,238,"定位旧条目"]
  ];
  const graphEdges=[
    ["start","work","M100 148H118"],
    ["work","reminder","M210 148H228"],
    ["reminder","fallback","M320 148H338"],
    ["fallback","save","M430 148H448"],
    ["save","request","M540 148H558"],
    ["request","reset","M650 148H668"],
    ["reset","read","M760 148H778"],
    ["read","recover","M870 148H888"],
    ["recover","finish","M980 148H998"],
    ["work","request","M164 122V48Q164 32 180 32H588Q604 32 604 48V122"],
    ["reminder","save","M274 122V96Q274 80 290 80H478Q494 80 494 96V122"],
    ["fallback","limit","M384 174V218Q384 238 404 238H448"],
    ["limit","reset","M540 238H680Q700 238 700 218V174"],
    ["reset","locate","M728 174V218Q728 238 748 238H778"],
    ["locate","recover","M870 238H914Q934 238 934 218V174"]
  ];
  const graphLabels=[
    ["work","request",384,20,"不写 Notes，直接换窗"],
    ["reminder","save",384,68,"提前保存，跳过兜底"],
    ["fallback","limit",550,280,"忽略提示，耗尽余量"],
    ["reset","read",824,190,"有 Notes，先读检查点"],
    ["reset","locate",824,280,"无 Notes，先找历史"]
  ];
  function renderRouteGraph() {
    const list=steps(),activeEdges=new Set(list.slice(1).map((id,i)=>list[i]+":"+id));
    const orderedNodes=[...graphNodes].sort((a,b)=>(list.includes(a[0])?list.indexOf(a[0]):100)-(list.includes(b[0])?list.indexOf(b[0]):100));
    const focused=$("timeline").contains(root.activeElement);
    const selected=(a,b)=>activeEdges.has(a+":"+b);
    $("timeline").innerHTML=`<svg viewBox="0 0 1100 294" aria-hidden="true"><defs>
      <marker id="graph-arrow-muted" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L6 3L0 6Z" fill="#e6e3dc"/></marker>
      <marker id="graph-arrow-active" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L7 3.5L0 7Z" fill="#8b3a2f"/></marker>
      </defs><path class="graph-window-boundary" d="M660 102V290"/><text class="graph-window-label" x="16" y="111">WINDOW #1</text><text class="graph-window-label" x="681" y="111">WINDOW #2</text>
      ${graphEdges.map(([a,b,d])=>`<path class="graph-edge ${selected(a,b)?"selected":""}" data-edge="${a}:${b}" d="${d}" marker-end="url(#graph-arrow-${selected(a,b)?"active":"muted"})"/>`).join("")}
      ${graphLabels.map(([a,b,x,y,text])=>`<text class="graph-edge-label ${selected(a,b)?"selected":""}" x="${x}" y="${y}">${text}</text>`).join("")}
      </svg>${orderedNodes.map(([id,x,y,sub])=>{
        const i=list.indexOf(id),onRoute=i!==-1;
        return `<button type="button" class="graph-node ${onRoute?"selected":""}" style="left:${x/11}%;top:${y/2.94}%" data-node="${id}" ${onRoute?`data-step="${i}"`:'disabled'} ${id===key()?'aria-current="step"':""} aria-label="${onRoute?`第 ${i+1} 步：${scenes[id].label}`:`当前路线不经过：${scenes[id].label}`}"><span class="graph-node-top">${onRoute?`<span class="graph-number">${i+1}</span>`:""}<strong>${scenes[id].label}</strong></span><span class="graph-node-sub">${sub}</span></button>`;
      }).join("")}`;
    const current=$("timeline").querySelector('[aria-current="step"]');
    if(focused) current.focus({preventScroll:true});
    const scroller=$("graph-scroll"),left=current.offsetLeft-current.offsetWidth/2,right=left+current.offsetWidth;
    if(left<scroller.scrollLeft||right>scroller.scrollLeft+scroller.clientWidth) {
      scroller.scrollLeft=Math.max(0,current.offsetLeft-scroller.clientWidth/2);
    }
  }
  function piece(kind,label,content,detail,options={}) {
    const attribute = options.prompt ? `data-prompt="${detail}"` : `data-detail="${detail}"`;
    return `<button type="button" class="piece ${kind}" ${attribute}><span class="meta"><span>${label}</span><span class="open">展开 ↗</span></span><span class="content">${content}</span></button>`;
  }
  function stateScene() {
    const s={...scenes[key()]};
    if(route==="early") {
      if(key()==="reminder") s.next="Agent 保存检查点 →";
      if(["save","request"].includes(key())) {s.base=19;s.buffer=100;s.budget="基础预算尚未耗尽";}
    }
    if(route==="direct") {
      if(key()==="work") s.next="不写 Notes，直接换窗 →";
      if(key()==="request") Object.assign(s,{title:"没写任何 Notes，也能主动换窗",description:"Agent 直接调用 new_context。此时尚未达到 reminder 阈值，运行时也不会临时要求它先补写 Notes；主动换窗会跳过 fallback。",budget:"仍有基础预算",base:28,buffer:100,takeaway:"guidance 已经要求记笔记；<strong>换窗工具没有“必须先保存”的门禁。</strong>"});
    }
    if(route==="forced" && key()==="fallback") s.next="继续忽略，耗尽 buffer →";
    if(["direct","forced"].includes(route)) {
      if(key()==="reset") Object.assign(s,{description:"运行规则、环境、guidance 与窗口 ID 被重新组装。Notes 仍是空的，旧用户请求也没自动带进来；可恢复的原始内容留在 History。",next:"从旧窗口找回线索 →"});
      if(key()==="recover") Object.assign(s,{description:"通过前一步定位到的引用，Agent 读取 W1 / U1 的用户请求，以及 W1 / T8 的失败测试。现在，目标、public API 约束和测试细节才重新进入当前输入。"});
    }
    return s;
  }
  function buildInput(s) {
    const newWindow=isNewWindow()&&!comparing;
    const saved=hasSaved();
    const current=key();
    let html=piece("foundation","运行上下文","运行规则 · 工具 · 权限 · 环境","world");
    html+=piece("guidance"+(current==="start"?" fresh":""),"developer · guidance","逐步记 Notes；换窗后读取检查点。","guidance",{prompt:true});
    if(!newWindow) {
      html+=piece("","user · W1 / U1",`修复 cache invalidation bug，跑完测试；${constraint}。`,"request");
      if(current!=="start") {
        html+=piece("","assistant → 工具调用 · W1 / C7","exec_command → 运行缓存失效测试","call");
        html+=piece("","工具返回 · W1 / T8","失败测试：更新之后，读到的仍是旧缓存。","test");
      }
      if(hadReminder()||comparing&&route!=="direct") {
        html+=piece("signal"+(current==="reminder"?" fresh":""),"developer · reminder","只剩 6,000 tokens：保存进展，然后换窗。","reminder",{prompt:true});
      }
      if(hadFallback()) html+=piece("signal"+(current==="fallback"?" fresh":""),"developer · fallback","停止任务。写一次 Notes，随后 new_context。","fallback",{prompt:true});
      if(current==="save") html+=piece("action fresh","Agent → Notes","notes.write_file → checkpoint.md 已保存","notes");
      if(current==="request"||comparing&&route!=="forced") html+=piece("action"+(!comparing?" fresh":""),"Agent → 运行时","functions.new_context() → 请求已登记","rollover");
      if(current==="limit"||comparing&&route==="forced") html+=piece("action","运行时 · 最终限制","还需继续执行 → 准备自动换窗","rollover");
    } else {
      html+=piece("","developer · 窗口信息",`Agent: /root · First: W1<br>Current: W2 · Previous: W1<br>${saved?"可选 Notes 提示：checkpoint.md（目录示意）":"Notes 暂无可用检查点"}`,"initial");
      if(current==="reset") html+='<button type="button" class="piece ghost fresh" data-detail="missing">这里没有旧任务，也没有 Notes 正文。<br>点击检验：什么会自动带过来？</button>';
      if(current==="read"||hasRead()&&saved) html+=piece("tool"+(current==="read"?" fresh":""),"notes.read_file → 工具结果",`修复缓存；${constraint}。<br>下一步：改内部实现，跑回归。引用 W1 / U1、T8。`,"notes");
      if(current==="locate") html+=piece("tool fresh","history · 定位结果","找到 W1 / U1（用户请求）与 W1 / T8（失败测试）。","locate");
      if(["recover","finish"].includes(current)) {
        if(!saved) html+=piece("tool","history.read_item → W1 / U1",`修复缓存、跑测试；${constraint}。`,"request");
        html+=piece("tool"+(current==="recover"?" fresh":""),"history.read_item → W1 / T8","断言：expected fresh value，实际返回 stale value。","test");
      }
      if(current==="finish") html+=piece("action fresh","Agent · 继续任务","保留公开接口，修改内部缓存失效逻辑。","continuity");
    }
    $("input").innerHTML=html;
  }
  function render() {
    const s=stateScene(), saved=hasSaved(), newWindow=isNewWindow();
    $("scenario").value=route;
    $("chapter").textContent=String(index+1).padStart(2,"0");
    $("step-title").textContent=s.title;
    $("step-description").textContent=s.description;
    $("takeaway").innerHTML=s.takeaway;
    $("counter").textContent=`${index+1} / ${steps().length}`;
    $("prev").disabled=index===0;
    $("next").textContent=s.next;
    renderRouteGraph();
    $("compare").hidden=!newWindow;
    $("compare").setAttribute("aria-pressed",String(comparing));
    $("compare").textContent=comparing?"返回换窗后":"对比换窗前";
    $("window-title").textContent=comparing?"Window #1 · 换窗前":`Window #${newWindow?2:1}`;
    $("window-kicker").textContent=comparing?"回看旧窗口输入；右侧仍是当前存储":"模型下一次调用能看到的输入";
    $("budget-readout").textContent=comparing?"回看旧窗口":s.budget;
    $("base-fill").style.width=(comparing?0:s.base)+"%";
    $("buffer-fill").style.width=(comparing?0:s.buffer)+"%";
    buildInput(s);
    $("notes-content").innerHTML=saved?`<button type="button" class="note-file" data-detail="notes"><span class="file-title"><span>checkpoint.md</span><span class="file-open">打开 ↗</span></span><p>目标、发现、下一步<br>${constraint}<br><code>W1 / U1 · W1 / T8</code></p></button><p class="store-foot">窗外保存；读取后才进入新窗口。</p>`:'<button type="button" class="piece ghost" data-detail="notes">尚未写入检查点</button><p class="store-foot">运行时不会替 Agent 自动填写。</p>';
    $("history-content").innerHTML=`<div class="history-items">${historyItems("W1").filter(item=>["U1","A2","C7","T8"].includes(item.id)).map(item=>`<button type="button" class="history-row" data-history-item="${item.id}" data-history-in="W1"><code>W1 / ${item.id}</code><span>${kindNames[item.kind]} · ${item.title}</span></button>`).join("")}</div><p class="store-foot">点 History 浏览条目；新记录可能延迟几秒出现。</p>`;
    const flow=s.flow;
    $("connection").className="connection "+(flow?"active":"inactive");
    $("flow-arrow").textContent=flow==="write"?"→":flow?"←":"↔";
    $("flow-name").textContent=({write:"写到窗外",read:"读回输入",history:"按引用读回",search:"搜索旧窗口"})[flow]||"窗口外存储";
    $("notes-store").classList.toggle("store-active",["write","read"].includes(flow));
    $("history-store").classList.toggle("store-active",["history","search"].includes(flow));
    const visible=!newWindow||hasRead();
    $("fact-locations").innerHTML=[["input",visible,"当前输入"],["notes",saved,"Notes"],["history",true,"History"]].map(([type,exists,label])=>`<button type="button" data-location="${type}" class="${exists?"exists":""}"><span class="status-dot"></span>${label} ${exists?"有":"无"}</button>`).join("");
    root.querySelectorAll(".prompt-shortcuts button").forEach(button=>{
      const id=button.dataset.prompt;
      const present=id==="guidance"||!newWindow&&(id==="reminder"?hadReminder():hadFallback());
      button.classList.toggle("present",present);
      button.classList.toggle("current",s.prompt===id);
      button.setAttribute("aria-label",`${id}，${present?"当前窗口已提供":"当前窗口尚未提供"}，查看中英文全文`);
    });
    root.querySelectorAll("[data-line]").forEach(line=>line.classList.toggle("active",line.dataset.line===s.code));
  }
  function go(i,keepGraph=false) {
    // Keep the cause and its resulting scene visible as the reader advances.
    if(!keepGraph&&i>0&&root.querySelector(".narrative").getBoundingClientRect().top>90) {
      root.querySelector(".narrative").scrollIntoView({block:"start",behavior:"instant"});
    }
    const oldIndex=index;
    const source=key()==="fallback"||key()==="reminder"?root.querySelector("#input mark"):root.querySelector("#notes-content mark");
    const origin=source?.getBoundingClientRect();
    index=Math.max(0,Math.min(i,steps().length-1)); comparing=false; render();
    const destination=key()==="save"?root.querySelector("#notes-content mark"):key()==="read"?root.querySelector("#input .tool mark"):null;
    if(index===oldIndex+1&&origin&&destination&&!window.matchMedia("(prefers-reduced-motion:reduce)").matches) {
      const end=destination.getBoundingClientRect();
      const token=document.createElement("span");
      token.className="travelling-fact";token.textContent="不能修改 public API";token.setAttribute("aria-hidden","true");
      token.style.left=origin.left+"px";token.style.top=origin.top+"px";
      root.append(token);
      const motion=token.animate([{transform:"translate(0,0)",opacity:1},{transform:`translate(${end.left-origin.left}px,${end.top-origin.top}px)`,opacity:1},{transform:`translate(${end.left-origin.left}px,${end.top-origin.top}px)`,opacity:0}],{duration:850,easing:"ease-in-out"});
      motion.onfinish=()=>token.remove();
    }
  }
  function setRoute(value,preferred) {
    route=value; index=preferred?Math.max(0,routes[value].indexOf(preferred)):0; comparing=false; render();
  }
  function showDialog(kicker,title,html) {
    const oldScroll=dialog.open&&$("detail-title").textContent===title?dialog.scrollTop:0;
    $("detail-kicker").textContent=kicker;
    $("detail-title").textContent=title;
    $("detail-body").innerHTML=html;
    if(!dialog.open) dialog.showModal();
    dialog.scrollTop=oldScroll;
  }
  function showPrompt(id) {
    openPrompt=id;
    const info=promptInfo[id];
    showDialog("DEVELOPER MESSAGE · ASTRA",info.title,`<p>${info.purpose}</p><div class="prompt-meta"><span>${info.when}</span><span>${info.parameter}</span><span>${info.field}</span></div><div class="note">${info.instruction}</div><div class="languages" role="group" aria-label="提示词语言"><button type="button" data-language="zh">中文译文</button><button type="button" data-language="en">English 原文</button><button type="button" data-language="both">中英对照</button></div><div id="prompt-content"></div><p class="small" style="margin-top:12px">${id==="reminder"?"提醒中的剩余量由运行时填写；当前阶段为 6,000。":""} ${id==="fallback"?"提示要求只用 Notes 和换窗工具；执行层没有因此新增专门的工具白名单。":""}</p><button type="button" class="btn jump" data-jump="${info.step}">在流程中看它出现 →</button>`);
    renderPrompt();
  }
  function renderPrompt() {
    const content=prompts[promptInfo[openPrompt].field];
    const single=lang=>`<div><div class="prompt-copy-label">${lang==="zh"?"中文译文":"ENGLISH · ORIGINAL"}</div><pre class="prompt-text ${lang==="en"?"english":""}">${escape(content[lang])}</pre></div>`;
    $("prompt-content").innerHTML=promptLanguage==="both"?`<div class="parallel">${single("zh")}${single("en")}</div>`:single(promptLanguage);
    root.querySelectorAll("[data-language]").forEach(button=>button.setAttribute("aria-pressed",String(button.dataset.language===promptLanguage)));
  }
  const inspection=JSON.parse($("inspection-data").textContent);
  const demoWindows={W1:"00000000-0000-4000-8000-000000000001",W2:"00000000-0000-4000-8000-000000000002"};
  const rawCode=(text,label="")=>`${label?`<div class="raw-label">${label}</div>`:""}<pre class="detail-code raw-code">${escape(typeof text==="string"?text:JSON.stringify(text,null,2))}</pre>`;
  const originLabel=text=>`<div class="origin-label">${text}</div>`;
  const toolButton=(id,label)=>`<button type="button" class="inline-tool" data-tool="${id}">${label||id} ↗</button>`;
  function windowText(window="W2",translated=false) {
    const labels=translated?["Agent 名称","首个上下文窗口 ID","当前上下文窗口 ID","上一个上下文窗口 ID"]:["Agent name","First context window id","Current context window id","Previous context window id"];
    return `<context_window>\n${labels[0]}: /root\n${labels[1]}: ${demoWindows.W1}\n${labels[2]}: ${demoWindows[window]}\n${window==="W2"?labels[3]+": "+demoWindows.W1+"\n":""}</context_window>`;
  }
  function historyItems(window="W1") {
    const message=(id,role,title,text)=>({id,kind:role,title,raw:{type:"message",role,content:[{type:role==="assistant"?"output_text":"input_text",text}]}});
    const call=(id,name,title,args,callId,namespace)=>({id,kind:"function_call",title,raw:{type:"function_call",name,...namespace?{namespace}:{},arguments:JSON.stringify(args),call_id:callId}});
    const output=(id,title,text,callId)=>({id,kind:"function_call_output",title,raw:{type:"function_call_output",call_id:callId,output:text}});
    if(window==="W2") {
      const items=[message("D1","developer","窗口信息",windowText()),message("D2","developer","跨窗工作指引",`<context_window_guidance>\n${prompts.guidance_message.en}\n</context_window_guidance>`)];
      if(hasRead()&&hasSaved())items.push(call("C1","read_file","读取检查点",{path:"checkpoint.md"},"call_read","notes"),output("T1","检查点正文",checkpoint,"call_read"));
      if(["recover","finish"].includes(key())) {
        if(!hasSaved())items.push(call("C0","read_item","找回原始任务",{window_id:demoWindows.W1,item_id:"U1"},"call_user","history"),output("T0","取回用户要求","请修复 cache invalidation bug，跑完相关测试。不能修改 public API。","call_user"));
        items.push(call("C2","read_item","回查旧测试",{window_id:demoWindows.W1,item_id:"T8"},"call_history","history"),output("T2","取回失败测试", "Expected: fresh value\nReceived: stale value","call_history"));
      }
      return items;
    }
    const items=[message("D1","developer","窗口信息",windowText("W1")),message("D2","developer","跨窗工作指引",`<context_window_guidance>\n${prompts.guidance_message.en}\n</context_window_guidance>`),message("U1","user","修复任务与 API 约束","请修复 cache invalidation bug，跑完相关测试。不能修改 public API。")];
    if(key()!=="start")items.push(message("A2","assistant","向用户说明下一步","我会先复现缓存失效问题，再检查内部实现。"),call("C7","exec_command","调用测试工具",{cmd:"npm test -- cache-invalidation"},"call_test"),output("T8","测试返回失败日志","cache invalidation / returns fresh value after update\nExpected: fresh value\nReceived: stale value","call_test"));
    if(hadReminder())items.push(message("D9","developer","提醒：只剩 6,000 tokens",prompts.reminder_message_template.en.replaceAll("{n_remaining}","6000")));
    if(hadFallback())items.push(message("D10","developer","兜底：先写 Notes",prompts.auto_compact_fallback_prompt.en));
    if(hasSaved())items.push(call("C11","write_file","写入检查点",{path:"checkpoint.md",text:checkpoint},"call_note","notes"),output("T12","写入完成（结果示意）","检查点写入成功。","call_note"));
    if(isNewWindow()||key()==="request") {
      if(route!=="forced")items.push(call("C13","new_context","请求换窗",{},"call_reset"),output("T14","换窗工具返回","A new context window will start without summarizing conversation history.","call_reset"));
    }
    return items;
  }
  const kindNames={user:"用户消息",assistant:"Assistant 消息",developer:"开发者消息",system:"系统消息",function_call:"工具调用",function_call_output:"工具返回"};
  function showHistory(window="W1",selected="U1") {
    const items=historyItems(window),item=items.find(x=>x.id===selected)||items[0];
    const translated=item.id==="D1"?windowText(window,true):item.id==="D2"?`<context_window_guidance>\n${prompts.guidance_message.zh}\n</context_window_guidance>`:item.id==="D9"?prompts.reminder_message_template.zh.replaceAll("{n_remaining}","6000"):item.id==="D10"?prompts.auto_compact_fallback_prompt.zh:item.id==="T14"?"新上下文窗口即将启动，不会对对话历史生成摘要。":null;
    const body=item.raw.type==="message"?item.raw.content[0].text:item.raw.type==="function_call"?`${item.raw.namespace?item.raw.namespace+".":""}${item.raw.name}\n${JSON.stringify(JSON.parse(item.raw.arguments),null,2)}`:item.raw.output;
    showDialog("HISTORY · 会话条目浏览器","History 里不只有用户消息",`<p>查询接口支持 <code>user / assistant / tool / system / developer</code> 五种角色，也能按工具名过滤。下面把同一案例中的<strong>消息、工具调用、工具返回</strong>分别展开。</p>
      <div class="inspect-tabs history-tabs" role="group" aria-label="历史窗口"><code>Agent /root →</code><button type="button" data-history-window="W1" aria-pressed="${window==="W1"}">Window #1 · ${historyItems("W1").length} 个演示条目</button>${isNewWindow()?`<button type="button" data-history-window="W2" aria-pressed="${window==="W2"}">Window #2 · ${historyItems("W2").length} 个演示条目</button>`:""}</div>
      <div class="browser-grid"><div class="record-list" aria-label="历史条目">${items.map(x=>`<button type="button" data-history-item="${x.id}" data-history-in="${window}" aria-pressed="${x.id===item.id}"><span><code>${x.id}</code> · ${kindNames[x.kind]}</span><strong>${x.title}</strong></button>`).join("")}</div><section class="record-content"><h3>${kindNames[item.kind]} · ${escape(item.id)}</h3>${translated?rawCode(body,"消息正文")+rawCode(translated,"中文译文"):rawCode(item.raw,"消息结构")}${item.id==="T8"||item.id==="T2"?'<p class="small">日志含义：更新缓存后应返回新值，实际仍返回旧值。</p>':""}${item.raw.call_id?`<p class="small"><code>call_id: ${item.raw.call_id}</code> 将调用和返回配对；<code>arguments</code> 在原始协议里是包含 JSON 的字符串。</p>`:""}${item.id==="C7"?'<button type="button" class="text-button" data-history-item="T8" data-history-in="W1">看这次调用的返回 T8 →</button>':item.id==="T8"?'<button type="button" class="text-button" data-history-item="C7" data-history-in="W1">回看发起调用的 C7 →</button>':""}</section></div>
      <h3>怎样把这一条读回新窗口？</h3>${rawCode({window_id:demoWindows[window],item_id:item.id},"history.read_item · 调用参数")}${toolButton("history.read_item","查看 read_item 参数与原文")}
      <details class="raw-details"><summary>存储范围、查询延迟与 reasoning 的边界</summary><p class="small">这里按 Codex 消息类型展示本页案例；它不是远端 History 服务返回的原始 JSON。</p><p>角色过滤明确包含 assistant；工具过滤支持 namespace 与 name。工具描述称其为归一化会话历史，按持久化序号和创建时间排序，只读且最终一致，新条目可能延迟数秒出现。</p><p>开源客户端调用远端 History 服务，未包含完整的服务端归一化与留存实现。因此不能从这里保证“每个内部事件、隐藏推理、所有内容都无损可读”。<code>reasoning</code> 是另一种底层条目，不等同于这里示例的 assistant 普通消息。</p><p>工具结果支持 <code>encrypted_output</code> 和图片附件；本页不把测试里的加密占位串解释为真实条目正文。</p><button type="button" class="text-button" data-contract="history">工具说明原文与中文翻译 →</button></details>`);
  }
  function showNotes() {
    const saved=hasSaved();
    showDialog("NOTES · 虚拟文本文件","Notes 的结构，就是路径 + 文本",`<p>Notes 没有强制的 <code>goal / progress / next_steps</code> 数据结构。Agent 自己选文件名、组织正文；Markdown、纯文本或 JSON 都只是文件内容。</p><div class="storage-path"><code>/root/notes/</code><span>当前 Agent 的虚拟目录，不是本机磁盘目录</span></div><div class="file-browser"><div class="file-banner"><code>${saved?"└─ checkpoint.md":"└─ （当前还没有文件）"}</code><span>${saved?"本步骤已经写入":"下面预览一份可写入的示例"}</span></div>${rawCode(checkpoint,saved?"checkpoint.md · 当前案例内容":"checkpoint.md · 示例预览，尚未写入")}</div><p class="small">“目标、约束、发现、下一步、引用”是这份笔记的写法，不是 Notes 系统预设字段。可以拆成多个文件，路径也由 Agent 决定。</p><h3>一次写入实际提交什么？</h3>${rawCode({path:"checkpoint.md",text:checkpoint},"notes.write_file · 调用参数")}
      <div class="path-map"><code>checkpoint.md</code><span>相对路径解析为</span><code>/root/notes/checkpoint.md</code></div>
      <div class="tool-links">${toolButton("notes.write_file","创建 / 覆盖")}${toolButton("notes.append_to_file","追加文本")}${toolButton("notes.read_file","读取全文 / 行范围")}${toolButton("notes.list_files_by_prefix","列目录")}${toolButton("notes.search_contents","搜索文本")}</div>
      <h3>换窗带过来的是目录，还是正文？</h3><p>换窗时，运行时可以把 Notes 的简短提示放进窗口信息，告诉模型有哪些笔记可读。完整正文仍需 <code>notes.read_file</code> 读取。</p><button type="button" class="text-button" data-initial-tab="hint">看它在完整输入中的位置 →</button>
      <details class="raw-details"><summary>文件限制、读写一致性与原始约定</summary><p>单文件上限为 1,000,000 UTF-8 字节。读取会立即反映成功写入；列目录和搜索是最终一致，可能延迟数秒。没有独立的重命名、移动、删除工具；这版公开了上面五个操作。</p><p>路径不进行 shell 展开，<code>~</code> 只是普通字符，不支持空路径段、<code>.</code> 或 <code>..</code>。</p><p>该源码的 Notes 工具说明允许绝对路径访问其他 Agent 的笔记；同次 Astra guidance 写的是“写入仅限当前线程”。这两段约定存在差异，不能把其中一段当成已验证的服务端权限规则。本演示只写当前 Agent。</p><button type="button" class="text-button" data-contract="notes">工具说明原文与中文翻译 →</button></details>`);
  }
  const toolExplanations={
    "functions.new_context":["请求换窗",{},"设置换窗请求，不检查 Notes 是否写好。还需继续执行时由运行时处理；环境状态不会清空。"],
    "functions.get_context_remaining":["查看剩余预算",{},"返回当前窗口的基础预算余量；无法确定时可为 unknown / null。这里查询的是不含额外 buffer 的剩余预算。"],
    "history.list_windows":["列出历史窗口",{recent_first:true,limit:5},"列出 Agent 的窗口 ID 与条目数，默认查看当前 Agent。"],
    "history.list_items":["列出窗口条目",{window_id:demoWindows.W1,limit:20,max_chars_per_item:400},"可按窗口、角色、工具命名空间和工具名过滤；每项可带截断内容。"],
    "history.read_item":["读取原始条目",{window_id:demoWindows.W1,item_id:"T8",offset_chars:0,limit_chars:2000},"用窗口 ID + 条目 ID 定位，可按字符范围读取。"],
    "history.search_contents":["搜索历史内容",{window_id:demoWindows.W1,query:"public API",role:"user"},"按区分大小写的字面子串搜索，不是语义搜索。"],
    "notes.list_files_by_prefix":["列出笔记文件",{prefix:null,max_results:10,file_order_by:"updated_at",file_order:"descending"},"按虚拟路径前缀列文件，可指定排序。"],
    "notes.read_file":["读取笔记",{path:"checkpoint.md"},"读取全文或指定行范围；行号从 1 开始，负数从末尾倒数。"],
    "notes.search_contents":["搜索笔记",{query:"public API",path_prefix:null,max_files:10},"在笔记行中匹配区分大小写的字面子串。"],
    "notes.append_to_file":["追加笔记",{path:"checkpoint.md",text:"\n下一步：补跑回归测试。"},"按提供的原样文本追加到文件。"],
    "notes.write_file":["创建或覆盖笔记",{path:"checkpoint.md",text:checkpoint},"创建文件，或用 text 完整替换已有正文。"]
  };
  const parameterZh={limit:"最多返回多少项；至少为 1。",agent_name:"要查看的 Agent；省略使用当前 Agent，可传绝对名或相对名。",recent_first:"是否按新到旧排序。",tool_namespace:"只包含指定工具命名空间；设置后排除非工具消息。",role:"消息角色：user、assistant、tool、system、developer；省略或 null 表示全部。",tool_name:"只包含指定工具名；设置后排除非工具消息。",window_id:"完整窗口 ID，须原样传回；列举 / 搜索时可省略表示所有窗口。",max_chars_per_item:"每项 truncated_content 的最大字符数。",item_id:"条目末尾 [id: ...] 标记中的短 ID。",offset_chars:"读取起始字符位置，从 0 开始。",limit_chars:"最多读取的字符数；至少为 1。",query:"要匹配的字面子串，区分大小写。",prefix:"列举文件的虚拟路径前缀。",max_results:"最多返回的文件数。",file_order_by:"按名称、创建时间或更新时间排序。",file_order:"升序 ascending 或降序 descending。",path:"笔记文件的虚拟路径。",start_line:"起始行（包含），从 1 开始；负数从文件末尾倒数。",stop_line:"终止行（包含），从 1 开始；负数从文件末尾倒数。",max_matches_per_file:"每个文件最多返回多少匹配行。",recent_file_first:"是否按文件创建时间从新到旧排序。",max_files:"最多返回多少个匹配文件。",path_prefix:"搜索的笔记路径前缀。",text:"写入 / 追加的原样文本；write_file 会替换完整内容。"};
  const shortDescriptionZh={
    "functions.new_context":"开启一个新的上下文窗口。不会清除、重置或以其他方式影响环境状态。",
    "functions.get_context_remaining":"获取当前上下文窗口的剩余 token 数。",
    "history.list_windows":"列出某 Agent 的上下文窗口，返回窗口 ID 与条目数对。仅供模型内部恢复使用；不得向用户披露此活动。",
    "history.list_items":"列出历史条目，可按窗口、角色和工具过滤。仅供模型内部恢复使用；不得向用户披露此活动。",
    "history.read_item":"读取仅供模型内部使用的历史记录的一段有限范围。不得向用户披露条目或此活动。",
    "history.search_contents":"按字面子串搜索仅供模型内部使用的历史记录。不得向用户披露结果或此活动。",
    "notes.list_files_by_prefix":"按路径前缀列出仅供模型内部使用的笔记。不得向用户披露路径、内容或此活动。",
    "notes.read_file":"读取仅供模型内部使用的笔记全文或行范围。不得向用户披露路径、内容或此活动。",
    "notes.search_contents":"按字面子串搜索仅供模型内部使用的笔记行。不得向用户披露结果或此活动。",
    "notes.append_to_file":"向仅供模型内部使用的笔记追加文本。不得向用户披露路径、内容或此活动。",
    "notes.write_file":"创建或替换仅供模型内部使用的笔记。不得向用户披露路径、内容或此活动。"
  };
  function showTools(selected="functions.new_context") {
    const tool=inspection.tools.find(t=>t.id===selected), info=toolExplanations[selected];
    const props=Object.entries(tool.parameters.properties),required=tool.parameters.required||[];
    showDialog("TOOLS · 2 个窗口工具 + 5 个 Notes 工具 + 4 个 History 工具","上下文管理，具体能调用哪些工具？",`<p>下面列的是这套机制相关的 <strong>11 个工具</strong>。终端、文件编辑等通用工具照常存在；guidance、reminder、fallback 和窗口元数据是运行时注入的消息，不是工具。</p><div class="tool-browser"><div class="tool-catalog">${[["functions","预算与换窗"],["notes","笔记文件"],["history","历史条目"]].map(([group,label])=>`<section><h3>${label}</h3>${inspection.tools.filter(t=>t.namespace===group).map(t=>`<button type="button" data-tool="${t.id}" aria-pressed="${t.id===selected}"><code>${t.id}</code><span>${toolExplanations[t.id][0]}</span></button>`).join("")}</section>`).join("")}</div>
      <section class="tool-selected"><h3>${tool.id} · ${info[0]}</h3><p>${info[2]}</p>${rawCode(info[1],"调用参数")}
      ${selected==="functions.new_context"?rawCode("A new context window will start without summarizing conversation history.","工具返回原文")+'<p class="small">中文：新上下文窗口即将启动，不会对对话历史生成摘要。</p>':selected==="functions.get_context_remaining"?rawCode("You have 6000 tokens left in this context window.","工具返回")+'<p class="small">中文：当前上下文窗口还剩 6000 tokens。代码模式对应 <code>{"tokens_left":6000}</code>；不可用时为 null。</p>':""}
      <h3>参数怎么读？</h3>${props.length?`<div class="parameter-list">${props.map(([name,p])=>`<div><code>${name}</code><span class="required">${required.includes(name)?"必填":"可省略"}</span><p>${selected==="history.read_item"&&name==="window_id"?"包含目标条目的完整窗口 ID；必填。":parameterZh[name]}</p><p class="parameter-en" lang="en">${escape(p.description||"")}</p></div>`).join("")}</div>`:'<p>没有参数，传 <code>{}</code>。</p>'}
      <div class="paired-copy"><div><span class="raw-label">工具说明 · 中文译文</span><p>${shortDescriptionZh[selected]}</p></div><div lang="en"><span class="raw-label">DESCRIPTION · 英文原文</span><p>${escape(tool.description)}</p></div></div>
      <details class="raw-details"><summary>参数 JSON Schema 原文</summary>${rawCode(tool.parameters)}<p class="small">上面的参数表逐项提供中文解释。</p></details></section></div>
      <div class="tool-links"><button type="button" class="text-button" data-contract="notes">Notes 命名空间说明（双语）</button><button type="button" class="text-button" data-contract="history">History 命名空间说明（双语）</button></div><details class="raw-details"><summary>运行规则、权限和环境是什么？</summary><p>这些来自当前 WorldState 与扩展贡献，包括模型指令、开发者指令、技能、审批与沙箱权限、环境等。换窗会按当前状态重新组装。它们的全文取决于线程配置，不存在一份所有用户通用的完整内容。</p><button type="button" class="text-button" data-detail="initial">看新窗口的完整组装 →</button></details>`);
  }
  let assemblyHasHint=false;
  function showInitial(focus) {
    assemblyHasHint=focus==="hint"||hasSaved();
    renderInitial();
  }
  function assemblyHintText(zh=false) {
    const bytes=new TextEncoder().encode(checkpoint).length;
    return zh?`最近的笔记（最多 5 个，最近的排在前面）：\n- /root/notes/checkpoint.md（5 行，${bytes} 个 UTF-8 字节）`:
      `Recent notes (up to 5, most-recent first):\n- /root/notes/checkpoint.md (5 lines, ${bytes} UTF-8 bytes)`;
  }
  function renderInitial() {
    const contextBody=windowText().replace('</context_window>','');
    const translatedBody=windowText("W2",true).replace('</context_window>','')+(assemblyHasHint?assemblyHintText(true)+'\n':'')+'</context_window>';
    const guidanceCopies=`<div class="parallel"><div><div class="prompt-copy-label">中文译文</div><pre class="prompt-text">${escape(prompts.guidance_message.zh)}</pre></div><div><div class="prompt-copy-label">ENGLISH · 原文</div><pre class="prompt-text english">${escape(prompts.guidance_message.en)}</pre></div></div>`;
    showDialog("WINDOW #2 · 输入总装","新窗第一份输入：这些一起发给模型",`<p class="assembly-lead"><strong>四条消息按顺序拼成同一份输入。</strong>Notes 提示嵌在③里，下面可以切换有、无提示的情况。</p>
      <div class="assembly-map" aria-label="完整输入的四个组成部分"><div><b>①</b>模型指令<small>developer</small></div><div><b>②</b>运行规则<small>包含 guidance</small></div><div class="map-window"><b>③</b>窗口信息<small class="map-hint">${assemblyHasHint?"内含 Notes 提示":"本次无 Notes 提示"}</small></div><div><b>④</b>当前环境<small>user</small></div></div>
      <div class="assembly-request">
        <div class="assembly-request-head"><strong>Window #2 · 首次模型调用</strong><span>此刻还没读取 Notes 或 History</span></div>
        <div class="assembly-tools"><code>tools</code><span>可调用的工具定义</span>${toolButton("functions.new_context","窗口 2 个 · Notes 5 个 · History 4 个")}<span>＋终端、文件编辑等通用工具</span></div>
        <div class="assembly-input"><div class="assembly-input-label">input [</div>
          <section class="assembly-message"><div class="assembly-message-head"><b>①</b><code>developer</code><strong>模型指令</strong><span class="assembly-brief">使用当前模型的指令全文</span></div></section>
          <section class="assembly-message"><div class="assembly-message-head"><b>②</b><code>developer</code><strong>运行规则 + guidance</strong><span class="assembly-brief">权限、技能、扩展指令等按配置重建</span></div><div class="assembly-message-body">
            <div class="tag">&lt;context_window_guidance&gt;</div>
            <details class="assembly-guidance"><summary>逐步记 Notes；看到 Previous window ID 后，读 Notes、按需查 History。<span>展开完整原文与译文 ↗</span></summary>${guidanceCopies}</details>
            <div class="tag">&lt;/context_window_guidance&gt;</div>
          </div></section>
          <section class="assembly-message assembly-window"><div class="assembly-message-head"><b>③</b><code>developer</code><strong>窗口信息 + 可选 Notes 提示</strong></div><div class="assembly-message-body">
            <p style="font-size:12px;margin-bottom:10px">组装新窗口时，运行时自动向 Notes 后端索取提示。<strong>拿到非空、且不超过 4,000 字节的文本，就插入这里；取不到则省略。</strong></p>
            <div class="assembly-switch" role="group" aria-label="Notes 提示请求的结果"><span>这次请求的结果：</span><button type="button" data-assembly-hint="yes" aria-pressed="${assemblyHasHint}">取得有效提示</button><button type="button" data-assembly-hint="no" aria-pressed="${!assemblyHasHint}">未取得有效提示</button></div>
            <pre>${escape(contextBody)}</pre>
            ${assemblyHasHint?`<div class="assembly-hint"><pre>${escape(assemblyHintText())}</pre></div>`:''}
            <pre>&lt;/context_window&gt;</pre>
            ${assemblyHasHint?'<p class="assembly-caption">蓝色部分是后端返回的 Notes 提示：告诉模型哪里有笔记，未包含文件正文。</p>':'<p class="assembly-absence">请求失败、返回空文本或文本超限时，不插入提示。窗口 ID 后直接闭合标签；已保存的 Notes 仍可通过工具读取。</p>'}
          </div></section>
          <section class="assembly-message"><div class="assembly-message-head"><b>④</b><code>user</code><strong>当前环境</strong><span class="assembly-brief">工作目录、Shell、日期等；并非旧用户任务</span></div></section>
          <div class="assembly-input-label">]</div>
        </div>
      </div>
      <div class="assembly-next"><strong>模型拿到这份输入后，才开始恢复任务。</strong>旧任务、旧工具结果和 Notes 正文，通过接下来的工具返回补入当前窗口。<div class="tool-links"><span>模型开始运行 →</span>${toolButton("notes.read_file","读检查点")}${toolButton("history.read_item","读历史条目")}<span>→ 返回内容追加进 Window #2</span></div></div>
      <details class="raw-details assembly-translation"><summary>③ 窗口信息的完整中文对照</summary>${rawCode(translatedBody)}<p class="small">Agent name 是当前 Agent；First 是首个窗口，Current 是当前窗口，Previous 是上一窗口。Notes 提示只提供恢复线索。</p></details>
      <details class="raw-details"><summary>哪些内容会随情况变化？</summary><p>Notes 后端决定提示的具体内容。上面展示的是最近文件目录；写过 Notes 不保证这次请求一定能拿到提示。</p><p>①②④取决于当前模型、权限、技能和环境配置。开启额外保留功能时，还可附加指定的客户端消息或工具输出；扩展也可补入持久目标。本页主线使用普通用户任务，不自动保留上一窗口的整段对话。</p></details>`);
  }
  function assemblyReferences() {
    return `<details class="raw-details"><summary>查看组装实现与请求记录</summary><p class="small">总装图按本页任务组织，通用指令正文收起。UUID 和文件内容用于演示；Notes 目录的写法来自扩展测试。下面保留仓库记录，便于逐项核对。</p><h3>换窗请求快照</h3>${rawCode(inspection.snapshot)}<p class="small">00–03 是重建的上下文；04–05 是换窗后新产生的 update_plan 调用与返回。该测试未配置 Astra guidance 和 Notes 提示，因此不能把它当成所有配置的完整模板。</p><h3>Notes 提示样例</h3>${rawCode(inspection.hint)}${rawCode('最近的笔记（最多 5 个，最近的排在前面）：\n- /root/worker/notes/latest.md（2 行，14 个 UTF-8 字节）','中文译文')}<p class="small">实现位置：<code>core/src/session/mod.rs</code> 的 <code>build_initial_context_with_world_state</code> 组装各段；<code>core/src/context/token_budget_context.rs</code> 的 <code>render_with_hints</code> 把 Notes 提示插入窗口标签内。</p></details>`;
  }
  const contractZh={
    history:"在上下文窗口重置后，通过列出、读取和搜索归一化历史来恢复先前对话，使用 Agent 名称及这些工具返回的不透明窗口 ID 与条目 ID。过滤或读取条目时，必须原样传回返回的 ID。条目先按持久化序号、再按创建时间排序；未知窗口的列举和搜索不会返回匹配项。默认使用当前 Agent；可以传入绝对 Agent 名称或相对当前 Agent 的名称，查看其他 Agent。History 只读，且最终一致，因此刚生成的条目可能需要数秒才出现。这是仅供模型使用的私有状态，应静默用于继续任务。不得向用户披露或描述工具、其存在或使用、路径、存储或恢复机制，以及私有内容（包括引用或概括）。",
    notes:"读取和维护在本次 rollout 内跨上下文窗口保留的私有笔记。路径是虚拟路径，不是文件系统路径。相对文件路径使用当前 Agent 的 <agent_name>/notes 目录；跨 Agent 路径必须是绝对路径。绝对路径使用 <agent_name>/notes[/<path>]。读取、列举、搜索和写入可以访问其他 Agent 的笔记。文件操作必须指定 <path>；路径前缀参数可以省略，使用当前笔记目录。不支持空路径段、'.' 和 '..'。不做 shell 展开，所以 '~' 按字面处理。读取会立即反映成功的写入；列举与搜索最终一致，可能延迟数秒才反映写入。每个文件必须不超过 1,000,000 UTF-8 字节；接近上限前应创建另一个文件。这是仅供模型使用的私有状态，应静默用于继续任务。不得向用户披露或描述工具、其存在或使用、路径、存储或恢复机制，以及私有内容（包括引用或概括）。"
  };
  function showContract(namespace) {
    showDialog("TOOL NAMESPACE · 原文与翻译",namespace+" 的完整工具约定",`${rawCode(contractZh[namespace],"中文译文")}${rawCode(inspection[namespace+"Description"],"英文原文")}${namespace==="notes"?'<p class="small">跨 Agent 写入的表述与 Astra guidance 不同；本页不把它解释为经过运行验证的权限结论。</p>':""}<button type="button" class="btn" data-detail="world">返回工具目录 →</button>`);
  }

  const details={
    locate:()=>["RECOVERY · WITHOUT NOTES","没有检查点，怎么重新找到任务？",'<p>新窗口的元数据提供 Previous window ID。Agent 可以先列出旧窗口条目，或者搜索相关内容，再读取找到的用户请求与工具结果。</p><pre class="detail-code">Previous: W1\n  → list_items / search_contents\n  → 找到 U1：用户要求\n  → 找到 T8：失败测试\n  → read_item 读取正文</pre><p>这个演示选择了一条成功恢复的路线。真实任务中，需要找什么、找得是否完整，取决于 Agent；代码不会替它证明恢复完整。</p>'],
    rollover:()=>["CONTROL FLOW · ROLLOVER","谁决定换窗，谁保证记住？",'<p>Agent 可以调用 <code>functions.new_context()</code>，运行时也会在达到最终预算限制时触发换窗。本页展示的是仍需要继续执行的轮次。</p><pre class="detail-code">Agent 请求 new_context\n        或\n达到基础预算 + buffer / 完整上下文硬上限\n        ↓\n还需继续执行 → 运行时重建下一窗口</pre><div class="note">工具不会要求提交 Notes、检查笔记是否完整，也没有“未保存就拒绝换窗”的门禁。</div><p>启用 token-budget 的这条路径直接重建窗口；不会因没有 Notes 就回退为传统摘要压缩。尚未启用这套机制的线程，使用原有压缩路径。</p>'],
    budget:()=>["TOKEN BUDGET · ASTRA","三个不同的时刻",'<p><strong>提醒：</strong>每次模型响应结束后，若基础预算剩余 ≤ 6,144 tokens，就注入 reminder，每个窗口一次。</p><p><strong>兜底：</strong>基础预算归零但尚未需要换窗时，注入 fallback，使用最多 16,384 tokens 的额外 buffer 完成交接。</p><p><strong>换窗：</strong>基础预算加 buffer 的限制，或完整上下文硬上限，任一先到达就可能触发换窗。主动 new_context 可以更早发生。</p><div class="note">buffer 不是一定能用满的赠送空间。一轮响应也可能直接越过最终限制，来不及走到 fallback。</div><p class="small">此页余量条是阶段示意，不按比例表示 Astra 的完整窗口大小。6,144 与 16,384 来自模型默认参数；8,000、6,000 及各阶段用量是教学设定。基础预算口径可受配置影响。</p>'],
    continuity:()=>["TASK CONTINUITY","换的是输入窗口，工作还在继续",'<p>换窗没有回滚磁盘上的代码，也没有重建整个运行环境。Notes、History 与已有外部工作状态继续存在。</p><p>模型则需要重新获得足以继续推理的信息。检查点负责简短地指路，原始历史负责补全证据，WorldState 负责重建当前运行上下文。</p><div class="note">执行状态的连续，与模型是否知道任务的连续，是两件要分别处理的事。</div>'],
    missing:()=>["TRY IT · BEFORE READING","Window #2 会自动拿到什么？",'<p>还没调用 Notes / History。选择你认为已经在第一份输入中的内容：</p><div class="prediction"><button type="button" data-answer="old">上一窗口的全部对话</button><button type="button" data-answer="notes">checkpoint.md 全文</button><button type="button" data-answer="context">重建的上下文、窗口 ID、可选 Notes 提示</button></div><div id="prediction-result" aria-live="polite"></div>'],
    scope:()=>["VERSION & SCOPE","这个实验演示的是哪套配置？",'<p>对象是 Codex 的 <strong>Agent-managed Context / token-budget 路径</strong>，以 Astra 的模型默认提示为例。页面是确定性的机制演示，不会调用真实模型。</p><div class="note">guidance、reminder、fallback 原文取自本机 <code>gpt-6-astra</code> 的模型配置快照：2026-10-21 00:08（UTC+8），客户端缓存版本 0.163.0。三段均附中文译文。</div><p>在对应版本中，支持该机制的模型、实验开关、官方服务与合适的 ChatGPT 登录/套餐条件共同决定是否启用。未自定义覆盖时，启用的 Astra 线程会采用模型的提醒阈值 6,144、fallback 提示和 16,384 buffer；并非每个 Codex 线程都默认使用这条路径。</p><p>核对时，这台机器已打开实验开关，并使用合适的 ChatGPT 登录；这支持“以 Astra 启动的新线程可走此路径”的判断，不是一次真实换窗的运行记录。</p><details style="margin-top:18px"><summary style="cursor:pointer">展开实现位置</summary><ul class="source-list"><li><code>session/token_budget.rs</code>：配置解析、提醒、兜底提示</li><li><code>session/turn.rs</code>：响应后的检查与换窗分支</li><li><code>session/context_window.rs</code>：预算、buffer 与硬上限</li><li><code>session/mod.rs</code>：重建输入、替换历史</li><li><code>tools/handlers/new_context_window.rs</code>：主动换窗工具</li><li><code>ext/history-notes/</code>：Notes / History 与 Notes 提示</li></ul><p class="small">本地 Codex 源码基线：<code>464add49587a7cb6032d5ab04faa8a1585947853</code>。基于该基线及模型配置，机制和默认参数可能随版本变化。</p></details>']
  };
  function showDetail(id) {
    openPrompt=null;
    if(id==="history")return showHistory();
    if(id==="notes")return showNotes();
    if(id==="initial")return showInitial();
    if(id==="world")return showTools();
    if(id==="request")return showHistory("W1","U1");
    if(id==="test")return showHistory("W1","T8");
    if(id==="call")return showHistory("W1","C7");
    showDialog(...details[id]());
    if(id==="scope") $("detail-body").insertAdjacentHTML("beforeend",assemblyReferences());
  }
  root.addEventListener("click",event=>{
    const button=event.target.closest("button");
    if(!button)return;
    if(button.dataset.tool) showTools(button.dataset.tool);
    else if(button.dataset.historyWindow) showHistory(button.dataset.historyWindow);
    else if(button.dataset.historyItem) showHistory(button.dataset.historyIn,button.dataset.historyItem);
    else if(button.dataset.initialTab) showInitial(button.dataset.initialTab);
    else if(button.dataset.assemblyHint) {assemblyHasHint=button.dataset.assemblyHint==="yes";renderInitial();}
    else if(button.dataset.contract) showContract(button.dataset.contract);
    else if(button.dataset.prompt) showPrompt(button.dataset.prompt);
    else if(button.dataset.detail) showDetail(button.dataset.detail);
    else if(button.dataset.step!==undefined) go(Number(button.dataset.step),true);
    else if(button.dataset.language) {promptLanguage=button.dataset.language;renderPrompt();}
    else if(button.dataset.jump) {
      const step=button.dataset.jump;
      dialog.close();
      if(!steps().includes(step)) setRoute("fallback",step);
      else go(steps().indexOf(step));
    } else if(button.dataset.location) {
      const location=button.dataset.location;
      if(location==="input") showDetail(isNewWindow()&&!hasRead()?"initial":"request");
      else showDetail(location);
    } else if(button.dataset.answer) {
      const correct=button.dataset.answer==="context";
      button.classList.toggle("correct",correct);
      $("prediction-result").innerHTML=`<div class="note">${correct?"对。":"这项不会自动带过来。"} 新输入由当前运行上下文、窗口 ID 和可选 Notes 提示组成。旧任务与 Notes 正文，要通过后续读取恢复。</div>`;
    }
  });
  $("next").addEventListener("click",()=>{
    if(index<steps().length-1)go(index+1);
    else {setRoute(route==="fallback"?"direct":"fallback");$("scenario").focus();}
  });
  $("prev").addEventListener("click",()=>go(index-1));
  $("restart").addEventListener("click",()=>go(0));
  $("scenario").addEventListener("change",event=>setRoute(event.target.value));
  $("compare").addEventListener("click",()=>{comparing=!comparing;render();});
  $("close").addEventListener("click",()=>dialog.close());
  dialog.addEventListener("click",event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
  root.addEventListener("keydown",event=>{
    if(dialog.open||event.altKey||event.ctrlKey||event.metaKey||["SELECT","INPUT","TEXTAREA"].includes(event.target.tagName))return;
    if(event.key==="ArrowRight"){event.preventDefault();go(index+1,!!event.target.closest(".route-graph"));}
    if(event.key==="ArrowLeft"){event.preventDefault();go(index-1,!!event.target.closest(".route-graph"));}
  });
  render();
}
  customElements.define("codex-context-lab", CodexContextLab);
})();
