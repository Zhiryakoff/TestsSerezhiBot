(() => {
  const sections = window.QUIZ_DATA;
  const pictureQuestions = window.PICTURE_QUIZ_DATA || [];
  const names = {'1 фото':'Тест стр. 1-2','2 фото':'Тест стр. 3-4','3-4 фото':'Тест стр. 5-6'};
  const pictureNames = {
    'p1': 'Тест с 1 по 56 кар.',
    'p2': 'Тест с 57 по 112 кар.',
    'p3': 'Тест с 113 по 168 кар.'
  };
  const $ = id => document.getElementById(id);
  const screens = ['homeScreen','categoryScreen','modeScreen','quizScreen','resultScreen'];
  let currentKey = null, currentName = '', currentType = 'abbr', allMode = false;
  let questions = [], index = 0, correct = 0, wrong = [], startAt = 0, elapsed = 0, timerId = null, early = false;

  function show(id){
    screens.forEach(s=>$(s).classList.toggle('active',s===id));
    $('homeBtn').classList.toggle('hidden',id==='homeScreen');
    $('topTimer').classList.toggle('hidden',id!=='quizScreen');
    window.scrollTo({top:0,behavior:'instant'});
  }
  function fmt(sec){sec=Math.max(0,Math.floor(sec));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return h?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;}
  function tick(){elapsed=Math.floor((performance.now()-startAt)/1000);$('topTimer').textContent=fmt(elapsed);timerId=setTimeout(tick,250);}
  function stopTimer(){if(timerId){clearTimeout(timerId);timerId=null} if(startAt) elapsed=Math.floor((performance.now()-startAt)/1000);}
  function expandAll(){return Object.values(sections).flat();}
  function uniquePairs(arr){const seen=new Set();return arr.filter(q=>{const k=q.abbrev+'\u0000'+q.full;if(seen.has(k))return false;seen.add(k);return true})}
  function shuffled(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
  function normalQuestions(arr){const groups=new Map();arr.forEach(q=>{if(!groups.has(q.full))groups.set(q.full,[]);groups.get(q.full).push(q)});let out=[];for(const group of groups.values())out.push(...shuffled(group).slice(0,2));return shuffled(out);}

  function setupAbbrCategory(){
    const wrap=$('categoryButtons');wrap.innerHTML='';
    for(const key of ['1 фото','2 фото','3-4 фото']){
      const b=document.createElement('button');b.className='btn btn-primary';b.textContent=names[key];b.onclick=()=>openAbbrMode(key);wrap.appendChild(b);
    }
    const counts=Object.fromEntries(Object.entries(sections).map(([k,v])=>[k,v.length]));
    $('categoryInfo').textContent=`Всего отдельных сокращений: ${Object.values(counts).reduce((a,b)=>a+b,0)}. Разделы: ${counts['1 фото']}, ${counts['2 фото']}, ${counts['3-4 фото']}. Экзамен — по всем.`;
  }

  function setupPictureCategory(){
    const wrap=$('pictureButtons');wrap.innerHTML='';
    [['p1',0,56],['p2',56,112],['p3',112,168]].forEach(([key,a,b])=>{
      const btn=document.createElement('button');btn.className='btn btn-primary';btn.textContent=pictureNames[key];btn.onclick=()=>startPicture(key,pictureNames[key],pictureQuestions.slice(a,b));wrap.appendChild(btn);
    });
    const exam=document.createElement('button');exam.className='btn btn-exam';exam.textContent='Экзамен';exam.onclick=()=>startPicture('pexam','Экзамен — все картинки',pictureQuestions);wrap.appendChild(exam);
    $('pictureInfo').textContent='168 картинок, разбитых на 3 равные части по 56. В каждом вопросе показывается картинка, а расшифровка открывается после вашего ответа.';
  }

  function openCategory(type){
    currentType=type;
    $('categoryTitle').textContent=type==='abbr'?'Тест по сокращениям':'Тест по картинкам';
    $('abbrCategory').classList.toggle('hidden',type!=='abbr');
    $('pictureCategory').classList.toggle('hidden',type!=='picture');
    show('categoryScreen');
  }
  function openAbbrMode(key){currentKey=key;currentName=names[key];$('modeTitle').textContent=currentName;show('modeScreen');}

  function start(key,name,useAll,custom=null){
    currentKey=key;currentName=name;currentType='abbr';allMode=useAll;early=false;correct=0;wrong=[];index=0;
    questions=custom?shuffled(custom):(useAll?shuffled(uniquePairs(sections[key]||[])):normalQuestions(sections[key]||[]));
    startAt=performance.now();elapsed=0;clearTimeout(timerId);tick();show('quizScreen');renderQuestion();
  }

  function startPicture(key,name,custom){
    currentKey=key;currentName=name;currentType='picture';allMode=true;early=false;correct=0;wrong=[];index=0;
    questions=shuffled(custom);
    startAt=performance.now();elapsed=0;clearTimeout(timerId);tick();show('quizScreen');renderQuestion();
  }

  function renderQuestion(){
    if(index>=questions.length){finish(false);return;}
    const q=questions[index];
    $('quizName').textContent=currentName;
    $('progress').textContent=`${index+1}/${questions.length} • Верно: ${correct}`;
    const card=$('questionCard');
    $('answer').value='';
    $('answerArea').classList.add('hidden');$('answerArea').innerHTML='';$('revealBtn').disabled=false;
    if(currentType==='picture'){
      $('questionLabel').textContent='Что означает обозначение на картинке?';
      $('abbrev').innerHTML=`<img class="quiz-picture" src="${q.image}" alt="Картинка ${q.number}">`;
      card.classList.add('picture-card');
    }else{
      $('questionLabel').textContent='Расшифруйте сокращение';
      $('abbrev').textContent=q.abbrev;
      card.classList.remove('picture-card');
    }
  }

  function reveal(){
    const q=questions[index];const area=$('answerArea');area.classList.remove('hidden');
    if(currentType==='picture'){
      area.innerHTML=`<div class="your">Ваш ответ: ${escapeHtml($('answer').value.trim()||'(пусто)')}</div><div class="correct-label">Правильная расшифровка:</div><div class="picture-answer-text correct">${escapeHtml(q.answerText)}</div><div class="answer-buttons"><button class="btn correct-btn" id="yesBtn"><span class="btn-icon">✓</span>Верно</button><button class="btn wrong-btn" id="noBtn"><span class="btn-icon">✕</span>Неверно</button></div>`;
    }else{
      area.innerHTML=`<div class="your">Ваш ответ: ${escapeHtml($('answer').value.trim()||'(пусто)')}</div><div class="correct">Правильно: ${escapeHtml(q.full)}</div><div class="answer-buttons"><button class="btn correct-btn" id="yesBtn"><span class="btn-icon">✓</span>Верно</button><button class="btn wrong-btn" id="noBtn"><span class="btn-icon">✕</span>Неверно</button></div>`;
    }
    $('revealBtn').disabled=true;$('yesBtn').onclick=()=>mark(true);$('noBtn').onclick=()=>mark(false);area.scrollIntoView({behavior:'smooth',block:'nearest'});
  }

  function mark(ok){const q=questions[index];if(ok)correct++;else wrong.push(q);index++;renderQuestion();}
  function finish(force){early=force;stopTimer();showResult();}
  function showResult(){
    show('resultScreen');const answered=index,total=questions.length,pct=answered?Math.round(correct/answered*100):0;
    $('resultScore').textContent=answered?`${correct} из ${answered} (${pct}%)`:'Нет отвеченных вопросов';
    $('resultTime').textContent=`Итоговое время: ${fmt(elapsed)}`;
    $('resultStatus').textContent=early?`Тест завершён принудительно • отвечено ${answered} из ${total}`:(answered===total?'Тест завершён':'');
    const box=$('wrongBox'),eb=$('errorsBtn');
    if(wrong.length){
      box.classList.remove('hidden');
      if(currentType==='picture'){
        box.innerHTML='<div class="eyebrow">Ошибки</div>'+wrong.map(q=>`<div class="wrong-item picture-wrong-item"><div class="wrong-ab">Картинка ${q.number}</div><img src="${q.image}" alt="Картинка ${q.number}"><div class="wrong-answer"><span>Расшифровка:</span><div class="picture-answer-text">${escapeHtml(q.answerText)}</div></div></div>`).join('');
      }else{
        box.innerHTML='<div class="eyebrow">Ошибки</div>'+wrong.map(q=>`<div class="wrong-item"><div class="wrong-ab">${escapeHtml(q.abbrev)}</div><div>${escapeHtml(q.full)}</div></div>`).join('');
      }
      eb.classList.remove('hidden');
    }else{box.classList.add('hidden');box.innerHTML='';eb.classList.add('hidden');}
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  $('abbrBtn').onclick=()=>openCategory('abbr');
  $('pictureBtn').onclick=()=>openCategory('picture');
  $('normalBtn').onclick=()=>start(currentKey,currentName,false);
  $('allBtn').onclick=()=>start(currentKey,currentName+' — все сокращения',true);
  $('examBtn').onclick=()=>start('__all__','Экзамен — все сокращения',true,expandAll());
  $('revealBtn').onclick=reveal;
  $('answer').addEventListener('keydown',e=>{if(e.key==='Enter')reveal()});
  $('finishBtn').onclick=()=>{if(confirm('Завершить тест сейчас?'))finish(true)};
  $('homeBtn').onclick=$('categoryHomeBtn').onclick=$('modeHomeBtn').onclick=$('resultHomeBtn').onclick=()=>{stopTimer();show('homeScreen')};
  $('categoryButtons') && setupAbbrCategory();
  setupPictureCategory();
  $('retryBtn').onclick=()=>{
    if(currentType==='picture'){
      const source=currentKey==='pexam'?pictureQuestions:currentKey==='p1'?pictureQuestions.slice(0,56):currentKey==='p2'?pictureQuestions.slice(56,112):pictureQuestions.slice(112,168);
      startPicture(currentKey,currentName,source);
    }else start(currentKey,currentName,allMode,currentKey==='__all__'?expandAll():null);
  };
  $('errorsBtn').onclick=()=>currentType==='picture'?startPicture(currentKey,'Работа над ошибками',wrong):start(currentKey,'Работа над ошибками',false,wrong);
  show('homeScreen');
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
    // Auto-reload once when a new service worker takes control, so updates
    // (design/text changes) show up immediately instead of staying cached
    // in the Telegram in-app browser.
    let refreshed=false;
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(refreshed) return;
      refreshed=true;
      window.location.reload();
    });
  }
})();
