(function(){
  var canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var w, h, dpr;
  var scrollOffset = 0;
  var targetScroll = 0;

  function resize(){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Track scroll from the main scrollable element (window + .app)
  function onScroll(){
    targetScroll = window.scrollY || document.documentElement.scrollTop || 0;
  }
  window.addEventListener('scroll', onScroll, {passive:true});

  var appEl = document.querySelector('.app');
  if (appEl) {
    appEl.addEventListener('scroll', function(){
      targetScroll = appEl.scrollTop;
    }, {passive:true});
  }

  // Abstract nodes forming drifting connected lines
  var NODE_COUNT = Math.round(Math.min(60, Math.max(28, (window.innerWidth * window.innerHeight) / 26000)));
  var nodes = [];
  function initNodes(){
    nodes = [];
    for (var i = 0; i < NODE_COUNT; i++){
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        r: Math.random() * 1.6 + 0.6,
        depth: Math.random() * 0.6 + 0.4
      });
    }
  }
  initNodes();
  window.addEventListener('resize', function(){ initNodes(); });

  var t = 0;

  function frame(){
    t += 0.0032;
    // ease scroll offset toward target for smooth parallax
    scrollOffset += (targetScroll - scrollOffset) * 0.06;

    ctx.clearRect(0, 0, w, h);

    // subtle vignette-ish base already via CSS background; draw abstract wave lines
    var lineCount = 5;
    for (var l = 0; l < lineCount; l++){
      var amp = 40 + l * 18;
      var freq = 0.0016 + l * 0.0004;
      var phase = t * (0.6 + l * 0.15) + l * 1.7;
      var yBase = h * (0.15 + l * 0.16) - (scrollOffset * (0.15 + l * 0.05)) % (h * 1.4);

      ctx.beginPath();
      for (var x = 0; x <= w; x += 12){
        var y = yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.3) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      var alpha = 0.05 + (lineCount - l) * 0.012;
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // drifting nodes with connecting lines (constellation)
    var maxDist = 130;
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy - 0.02 * n.depth; // slow upward drift
      // gentle scroll-based parallax shift
      var py = n.y + (scrollOffset * 0.04 * n.depth) % h;

      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (py < -20) { n.y = h + 20; }
      if (py > h + 20) { n.y = -20; }

      for (var j = i + 1; j < nodes.length; j++){
        var m = nodes[j];
        var my = m.y + (scrollOffset * 0.04 * m.depth) % h;
        var dx = n.x - m.x, dy = py - my;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < maxDist){
          var a = (1 - dist / maxDist) * 0.12 * n.depth;
          ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(n.x, py);
          ctx.lineTo(m.x, my);
          ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++){
      var nn = nodes[k];
      var pyy = nn.y + (scrollOffset * 0.04 * nn.depth) % h;
      var glow = 0.35 + 0.25 * Math.sin(t * 2 + k);
      ctx.beginPath();
      ctx.arc(nn.x, pyy, nn.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (glow * nn.depth).toFixed(3) + ')';
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
