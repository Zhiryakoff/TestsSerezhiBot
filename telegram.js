(function(){
  if (window.Telegram && Telegram.WebApp) {
    const tg = Telegram.WebApp;
    tg.ready();
    tg.expand();
    if (tg.setHeaderColor) tg.setHeaderColor('bg_color');
    if (tg.setBackgroundColor) tg.setBackgroundColor('bg_color');
    document.documentElement.style.setProperty('--tg-bg', tg.backgroundColor || '#111827');
  }
})();
