/* lang-toggle.js — shared bilingual ZH/EN toggle for HTML articles.
 *
 * Wires up <div class="lang-toggle"><button data-target="…">…</button>…</div>
 * to flip the data-lang attribute on the article wrapper. The CSS rules in
 * article.css then show/hide the matching <pre data-lang="…"> inside
 * <div class="prompt-block">.
 *
 * Works in two layouts:
 *   - Standalone HTML:  wrapper is the outer <div class="art-body" data-lang="zh">
 *   - Jekyll-rendered:  the layout emits the same wrapper
 *
 * State is persisted in localStorage so refreshes / re-opens remember the
 * reader's last choice across the whole site.
 */
(function(){
  'use strict';
  var STORAGE_KEY = 'mrchen.articleLang';

  function getRoot() {
    return document.querySelector('.art-body') || document.body;
  }

  function applyLang(lang) {
    var root = getRoot();
    root.setAttribute('data-lang', lang);
    document.querySelectorAll('.lang-toggle button').forEach(function(b){
      b.classList.toggle('active', b.dataset.target === lang);
    });
  }

  function init() {
    var toggles = document.querySelectorAll('.lang-toggle');
    if (!toggles.length) return;

    // Pick up the persisted choice (or the wrapper's initial attr, or 'zh').
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var initial = saved || getRoot().getAttribute('data-lang') || 'zh';
    applyLang(initial);

    document.querySelectorAll('.lang-toggle button').forEach(function(btn){
      btn.addEventListener('click', function(){
        var target = btn.dataset.target;
        if (!target) return;
        applyLang(target);
        try { localStorage.setItem(STORAGE_KEY, target); } catch (e) {}
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
