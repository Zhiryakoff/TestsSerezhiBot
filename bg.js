(function(){
  var canvas = document.getElementById('bgCanvas');
  if(!canvas) return;
  var ctx = canvas.getContext('2d');
  var w, h, dpr;
  var lastDocH = 0;

  function docHeight(){
    return Math.max(
      window.innerHeight,
      document.documentElement.scrollHeight,
      document.body.scrollHeight
    );
  }

  function resize(force){
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var newW = window.innerWidth;
    var newH = docHeight();
    if (!force && newW === w && newH === h) return;
    w = newW; h = newH; lastDocH = h;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initNodes();
  }

  window.addEventListener('resize', function(){ resize(true); });
  window.addEventListener('orientationchange', function(){ resize(true); });

  var nodes = [];
  function initNodes(){
    var count = Math.round(Math.min(140, Math.max(30, (w * h) / 30000)));
    nodes = [];
    for (var i = 0; i < count; i++){
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.10,
        vy: (Math.random() - 0.5) * 0.10,
        r: Math.random() * 1.6 + 0.6,
        depth: Math.random() * 0.6 + 0.4
      });
    }
  }

  resize(true);

  var t = 0;
  var frameCount = 0;

  function frame(){
    t += 0.0032;
    frameCount++;

    // Periodically check whether the document height changed (screens in
    // this app swap content without a window resize event), so the canvas
    // keeps covering the full page instead of leaving blank/cropped areas.
    if (frameCount % 30 === 0 && docHeight() !== lastDocH) resize(true);

    ctx.clearRect(0, 0, w, h);

    var lineCount = 5;
    for (var l = 0; l < lineCount; l++){
      var amp = 40 + l * 18;
      var freq = 0.0016 + l * 0.0004;
      var phase = t * (0.6 + l * 0.15) + l * 1.7;
      var yBase = h * ((l + 0.5) / lineCount);

      ctx.beginPath();
      for (var x = 0; x <= w; x += 14){
        var y = yBase + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.3) * amp * 0.3;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      var alpha = 0.045 + (lineCount - l) * 0.010;
      ctx.strokeStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    var maxDist = 130;
    for (var i = 0; i < nodes.length; i++){
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy - 0.015 * n.depth;

      if (n.x < -20) n.x = w + 20;
      if (n.x > w + 20) n.x = -20;
      if (n.y < -20) n.y = h + 20;
      if (n.y > h + 20) n.y = -20;

      for (var j = i + 1; j < nodes.length; j++){
        var m = nodes[j];
        var dx = n.x - m.x, dy = n.y - m.y;
        var dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < maxDist){
          var a = (1 - dist / maxDist) * 0.12 * n.depth;
          ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(n.x, n.y);
          ctx.lineTo(m.x, m.y);
          ctx.stroke();
        }
      }
    }
    for (var k = 0; k < nodes.length; k++){
      var nn = nodes[k];
      var glow = 0.35 + 0.25 * Math.sin(t * 2 + k);
      ctx.beginPath();
      ctx.arc(nn.x, nn.y, nn.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + (glow * nn.depth).toFixed(3) + ')';
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
