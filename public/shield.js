(function () {
  'use strict';

  // ── Random phrases for blocked attempts ──
  var PHRASES = [
    'nuh uh',
    'nice try',
    'not today',
    'access denied',
    'i use arch btw',
    '403',
    'permission denied',
    'try harder',
    'no.',
    'really?',
    'blocked',
    'bruh',
  ];

  // ── Overlay ──
  var _kf = document.createElement('style');
  _kf.textContent = '@keyframes _nuhuh{0%{opacity:0;transform:translate(-50%,-52%) scale(0.88)}12%{opacity:1;transform:translate(-50%,-50%) scale(1)}78%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.04)}}';
  document.head.appendChild(_kf);
  var _el = document.createElement('div');
  _el.style.cssText = 'position:fixed;top:50%;left:50%;font-family:Syne,sans-serif;font-size:3.5rem;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;color:#C5F037;pointer-events:none;z-index:999999;opacity:0;white-space:nowrap;';
  document.body.appendChild(_el);

  function _block() {
    _el.textContent = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    _el.style.animation = 'none';
    void _el.offsetWidth;
    _el.style.animation = '_nuhuh 1.4s cubic-bezier(0.22,1,0.36,1) forwards';
  }

  // ── Block devtools shortcuts ──
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); _block(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'F12') { e.preventDefault(); _block(); return; }
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && 'IJKC'.includes(e.key.toUpperCase())) { e.preventDefault(); _block(); return; }
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toUpperCase() === 'U') { e.preventDefault(); _block(); return; }
  });

  // ── Console easter egg ──
  var shown = false;
  function showEgg() {
    if (shown) return;
    shown = true;

    console.log(
      '%c' +
      '\n' +
      ' ██╗  ██╗███████╗██╗     ██╗      ██████╗ \n' +
      ' ██║  ██║██╔════╝██║     ██║     ██╔═══██╗\n' +
      ' ███████║█████╗  ██║     ██║     ██║   ██║\n' +
      ' ██╔══██║██╔══╝  ██║     ██║     ██║   ██║\n' +
      ' ██║  ██║███████╗███████╗███████╗╚██████╔╝\n' +
      ' ╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝ \n' +
      '\n' +
      ' ████████╗██╗  ██╗███████╗██████╗ ███████╗\n' +
      ' ╚══██╔══╝██║  ██║██╔════╝██╔══██╗██╔════╝\n' +
      '    ██║   ███████║█████╗  ██████╔╝█████╗  \n' +
      '    ██║   ██╔══██║██╔══╝  ██╔══██╗██╔══╝  \n' +
      '    ██║   ██║  ██║███████╗██║  ██║███████╗\n' +
      '    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝\n' +
      '\n',
      'color: #C5F037; font-family: monospace; font-size: 11px; line-height: 1.1;'
    );

    console.log(
      '%cNICE WORK GETTING HERE\n',
      'color: #f0f0f0; font-size: 20px; font-weight: bold; letter-spacing: 2px;'
    );

    console.log(
      '%c' +
      ' If you\'re reading this — let\'s talk.\n\n' +
      ' → github.com/abeb021\n' +
      ' → t.me/abeb021\n',
      'color: #888; font-size: 13px; line-height: 1.7;'
    );

    console.log(
      '%c┌──────────────────────────────────────────────┐\n' +
      '│  Go · Kafka · PostgreSQL · Docker · Arch     │\n' +
      '│  Backend dev. Runs Arch. Reads source code.  │\n' +
      '└──────────────────────────────────────────────┘',
      'color: #444; font-family: monospace; font-size: 11px; line-height: 1.5;'
    );
  }

  showEgg();

  // ── Devtools size detection ──
  var THRESHOLD = 160;
  var dtOpen = false;
  setInterval(function () {
    var w = window.outerWidth  - window.innerWidth  > THRESHOLD;
    var h = window.outerHeight - window.innerHeight > THRESHOLD;
    if ((w || h) && !dtOpen) { dtOpen = true; shown = false; showEgg(); }
    else if (!w && !h)       { dtOpen = false; }
  }, 1000);

  // ── Image ID trick (Chrome undocked) ──
  var img = new Image();
  Object.defineProperty(img, 'id', { get: function () { shown = false; showEgg(); } });
  setInterval(function () { console.log('%c', img); }, 2000);

})();
