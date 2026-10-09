/* Demos dos produtos: ao passar o mouse / focar / tocar no cartão, os elementos [data-t] aparecem em sequência (ms) e
   o ciclo repete; ao sair, tudo pausa e volta ao início. Números [data-n] contam de 0 até o valor. Sem biblioteca. */
(function () {
  var cards = document.querySelectorAll('.px'), calma = matchMedia('(prefers-reduced-motion:reduce)').matches;
  function conta(el) {
    var n = parseFloat(el.getAttribute('data-n')), d = +el.getAttribute('data-d') || 0, t0 = performance.now();
    (function passo(now) {
      var p = Math.min(1, (now - t0) / 800), v = n * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toFixed(d).replace('.', ',');
      if (p < 1) requestAnimationFrame(passo);
    })(t0);
  }
  Array.prototype.forEach.call(cards, function (card) {
    var passos = card.querySelectorAll('[data-t]'), tm = [];
    function limpa() {
      tm.forEach(clearTimeout); tm = [];
      Array.prototype.forEach.call(passos, function (s) { s.classList.remove('v'); });
      Array.prototype.forEach.call(card.querySelectorAll('[data-n]'), function (e) { e.textContent = '0'; });
    }
    function toca() {
      limpa();
      Array.prototype.forEach.call(passos, function (s) {
        tm.push(setTimeout(function () { s.classList.add('v'); if (s.hasAttribute('data-n')) conta(s); }, +s.getAttribute('data-t')));
        if (s.hasAttribute('data-x')) tm.push(setTimeout(function () { s.classList.remove('v'); }, +s.getAttribute('data-x')));
      });
      Array.prototype.forEach.call(card.querySelectorAll('[data-k]'), function (k) {   // contadores dentro de um passo
        tm.push(setTimeout(function () { conta(k); }, +k.getAttribute('data-k')));
      });
      tm.push(setTimeout(toca, +card.getAttribute('data-len') || 11000));
    }
    function liga() {
      card.classList.add('on');
      if (calma) {   // sem animação: mostra o quadro final
        Array.prototype.forEach.call(passos, function (s) { if (!s.hasAttribute('data-x')) s.classList.add('v'); });
        Array.prototype.forEach.call(card.querySelectorAll('[data-n],[data-k]'), function (e) { e.textContent = parseFloat(e.getAttribute('data-n')).toFixed(+e.getAttribute('data-d') || 0).replace('.', ','); });
        return;
      }
      toca();
    }
    function desliga() { card.classList.remove('on'); limpa(); }
    if (matchMedia('(hover:hover)').matches) {            // mouse: passar por cima toca; sair para
      card.addEventListener('mouseenter', liga);
      card.addEventListener('mouseleave', desliga);
    } else {                                              // toque: tocar liga/desliga, e só um cartão por vez
      card.addEventListener('click', function () {
        if (card.classList.contains('on')) { desliga(); return; }
        Array.prototype.forEach.call(cards, function (o) { if (o !== card) o.dispatchEvent(new Event('desliga')); });
        liga();
      });
      card.addEventListener('desliga', desliga);
    }
    card.addEventListener('focus', liga);                 // teclado
    card.addEventListener('blur', desliga);
  });
})();
