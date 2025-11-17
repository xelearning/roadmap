/* ===========================
   Data + initial sample
   =========================== */ 
const initialNodes = [
 { "id": "a821772d-244e-4fd1-997e-9fd43ae27320", "label": "LLM Engineer", "type": "root", "x": 110, "y": 426, "desc": "Text AI & LLM systems.", "url": "" },
];
let connections = [
 [ "429af4b4-0c02-4611-9ce1-81cd915e855d", "a821772d-244e-4fd1-997e-9fd43ae27320" ],
 ]; 
let nodes = JSON.parse(JSON.stringify(initialNodes)); // visible set
const svg = document.getElementById('svg');
const canvasWrap = document.getElementById('canvasWrap');
const gLines = document.createElementNS('http://www.w3.org/2000/svg','g');
const gNodes = document.createElementNS('http://www.w3.org/2000/svg','g');
svg.appendChild(gLines);
svg.appendChild(gNodes);

let zoom = 1.12, panX = 0, panY = 0;
function setViewTransform() {
  gLines.setAttribute('transform', `translate(${panX},${panY}) scale(${zoom})`);
  gNodes.setAttribute('transform', `translate(${panX},${panY}) scale(${zoom})`);
}
setViewTransform();

/* ===========================
   Utilities
   =========================== */
function uid() {
  if(window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'id-'+Math.random().toString(36).slice(2,9);
}

function copyToClipboard(text){
  navigator.clipboard?.writeText(text).catch(()=>{});
}

function downloadFile(filename, text){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text],{type:'application/json'}));
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function round(n){ return Math.round(n); }

function svgPointFromEvent(e){
  const pt = svg.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const ctm = svg.getScreenCTM();
  if(!ctm) return {x: e.clientX, y: e.clientY};
  return pt.matrixTransform(ctm.inverse());
}

function measureText(text, fontSize=16){
  const temp = document.createElementNS("http://www.w3.org/2000/svg", "text");
  temp.setAttribute("font-size", fontSize);
  temp.setAttribute("visibility", "hidden");
  temp.textContent = text;
  svg.appendChild(temp);
  const width = temp.getBBox().width;
  svg.removeChild(temp);
  return width;
}

/* ===========================
   App state
   =========================== */
let tool = 'select'; // select, add-root, add-category, add-sub, connect, delete, edit, dashed, deco
let modeLabel = document.getElementById('modeLabel');
let selectedNode = null;
let connectFrom = null;
let disconnectFrom = null;
let activeRootId = null;
let lineElements = [];
let dragging = null;

/* ===========================
   Toolbar
   =========================== */
document.getElementById('toolbar').addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if(!btn || !btn.dataset.action) return;
  setTool(btn.dataset.action);
});

function setTool(t){
  tool = t;
  modeLabel.textContent = (t === 'select' ? 'Select' : t.replace('add-','Add ').replace('-',' ').replace(/\b\w/g,ch=>ch.toUpperCase()));
  document.querySelectorAll('#toolbar button').forEach(b=>b.classList.toggle('active', b.dataset.action===t));
  connectFrom = null;
  disconnectFrom = null;
  if(t!=='edit') hideRightPanel();
}

/* ===========================
   Root list
   =========================== */
const rootControls = document.getElementById('rootControls');

function refreshRootList(){
  const roots = initialNodes.filter(n=>n.type==='root');
  rootControls.innerHTML = '';
  const ul = document.createElement('ul');
  roots.forEach(r=>{
    const li = document.createElement('li');
    li.textContent = r.label;
    li.dataset.id = r.id;
    li.addEventListener('click', ()=>{
      activeRootId = r.id;
      Array.from(ul.children).forEach(c=>c.classList.remove('active'));
      li.classList.add('active');
    });
    ul.appendChild(li);
  });
  rootControls.appendChild(ul);
  if(!activeRootId && roots[0]) { activeRootId = roots[0].id; ul.children[0].classList.add('active'); }
}

/* ===========================
   Rendering
   =========================== */
function render() {
  // clear
  gLines.innerHTML = '';
  gNodes.innerHTML = '';
  lineElements = [];

  // draw hub vertical
  const roots = nodes.filter(n => n.type === 'root');
  roots.forEach(root => {
    const cats = nodes.filter(n => n.type === 'category' && connections.some(c => c[0] === root.id && c[1] === n.id));
    if (cats.length === 0) return;
    const ys = cats.map(c => c.y);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const hub = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hub.setAttribute('d', `M ${root.x} ${minY} L ${root.x} ${maxY}`);
    hub.setAttribute('fill', 'none');
    hub.setAttribute('stroke', '#94a3b8');
    hub.setAttribute('stroke-width', '2');
    gLines.appendChild(hub);
  });

  // draw connections
  connections.forEach(([a, b]) => {
    const na = nodes.find(n => n.id === a) || initialNodes.find(n => n.id === a);
    const nb = nodes.find(n => n.id === b) || initialNodes.find(n => n.id === b);
    if (!na || !nb) return;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    if (na.type === 'root' && nb.type === 'category') path.setAttribute('d', `M ${na.x} ${nb.y} L ${nb.x} ${nb.y}`);
    else path.setAttribute('d', `M ${na.x} ${na.y} L ${nb.x} ${na.y} L ${nb.x} ${nb.y}`);

    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#94a3b8');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    gLines.appendChild(path);
    lineElements.push({ path, from: a, to: b });
  });

  // draw nodes
  nodes.forEach(n => {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', `translate(${n.x},${n.y})`);
    g.setAttribute('data-id', n.id);
    g.style.cursor = 'grab';

    const paddingX = 20, paddingY = 16;
    const fontSize = n.type === 'root' ? 20 : n.type === 'category' ? 19 : 15;
    const words = (n.label || '').split(/\s+/);
    const maxChars = n.type === 'root' ? 10 : n.type === 'category' ? 15 : 12;

    let lines = [], line = '';
    words.forEach(w => {
      if ((line + w).length > maxChars) { lines.push(line.trim()); line = w + ' '; }
      else line += w + ' ';
    });
    if (line) lines.push(line.trim());

    const longest = lines.reduce((a, b) => a.length > b.length ? a : b, '');
    const textWidth = measureText(longest, fontSize);
    const lineHeight = n.type === 'root' ? 24 : n.type === 'category' ? 22 : 18;
    const textHeight = lines.length * lineHeight;

    let shape;

    if (n.type === 'category' || n.type === 'sub') {
      const w = Math.max(textWidth + paddingX * 2, n.type === 'category' ? 210 : 110);
      const h = Math.max(textHeight + paddingY * 2, n.type === 'category' ? 64 : 44);
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shape.setAttribute("x", -w / 2);
      shape.setAttribute("y", -h / 2);
      shape.setAttribute("width", w);
      shape.setAttribute("height", h);
      shape.setAttribute("rx", 8);
      shape.setAttribute("fill", "#fff");
      shape.setAttribute("stroke", "#f97316");
      shape.setAttribute("stroke-width", "3");
      g._width = w; g._height = h;
    } 
    else if (n.type === 'dashed') {
      // dynamic width/height based on text
      const textW = Math.max(...lines.map(l => measureText(l, fontSize)));
      const textH = lines.length * (fontSize + 4);
      const w = Math.max(150, textW + paddingX * 2);
      const h = textH + paddingY * 2;

      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shape.setAttribute("x", -w / 2);
      shape.setAttribute("y", -h / 2);
      shape.setAttribute("width", w);
      shape.setAttribute("height", h);
      shape.setAttribute("rx", 2);
      shape.setAttribute("fill", "#fef3c7");        // background
      shape.setAttribute("stroke", "#fff");      // border color
      shape.setAttribute("stroke-width", "10");
      shape.setAttribute("stroke-dasharray", "8,4");
      g._width = w; g._height = h;
    }
    else if (n.type === 'circle-node') {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute('r', 18);
      shape.setAttribute('fill', '#fff');
      shape.setAttribute('stroke', '#2563eb');
      shape.setAttribute('stroke-width', '3');
      g._radius = 18;
    } 
    else { // default circle
      const r = Math.max(160, textWidth + paddingX * 4) / 2;
      shape = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      shape.setAttribute("r", r);
      shape.setAttribute("fill", "#fff");
      shape.setAttribute("stroke", "#3b82f6");
      shape.setAttribute("stroke-width", "3");
      g._radius = r;
    }

    g.appendChild(shape);

    // text label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", 0);
    text.setAttribute("y", 0);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", fontSize);

    let startY = -textHeight / 2 + lineHeight / 2;
    lines.forEach(l => {
      const tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
      tspan.setAttribute("x", 0);
      tspan.setAttribute("y", startY);
      tspan.textContent = l;
      text.appendChild(tspan);
      startY += lineHeight;
    });
    g.appendChild(text);

    // events
    g.addEventListener("mousedown", e => onNodeDown(e, n, g));
    g.addEventListener("click", e => onNodeClick(e, n, g));
    gNodes.appendChild(g);
  });

  setViewTransform();
  saveOutputToDetails();
}


/* ===========================
   Node interactions
   =========================== */
function onNodeDown(e,node,group){
  if(e.button && e.button!==0) return;
  if(tool!=='select') return;
  dragging={node,group,startX:e.clientX,startY:e.clientY,nodeStartX:node.x,nodeStartY:node.y};
  document.body.style.cursor='grabbing';
  window.addEventListener('mousemove',onMouseMove);
  window.addEventListener('mouseup',onMouseUp);
}
function onMouseMove(e){
  if(dragging){
    const dx=(e.clientX-dragging.startX)/zoom;
    const dy=(e.clientY-dragging.startY)/zoom;
    dragging.node.x = dragging.nodeStartX + dx;
    dragging.node.y = dragging.nodeStartY + dy;
    render();
  }
}
function onMouseUp(){
  if(dragging){ dragging=null; document.body.style.cursor=''; window.removeEventListener('mousemove',onMouseMove); window.removeEventListener('mouseup',onMouseUp); saveInitialPositions(); }
}

function onNodeClick(e,n,g){
  e.stopPropagation();
  if(tool==='Disconnect'){
    if(!disconnectFrom){ disconnectFrom=n.id; highlightNodeId(n.id); }
    else { connections=connections.filter(([a,b])=>!((a===disconnectFrom&&b===n.id)||(a===n.id&&b===disconnectFrom))); disconnectFrom=null; render(); }
    return;
  }
  if(tool==='connect'){
    if(!connectFrom){ connectFrom=n.id; highlightNodeId(n.id); }
    else { if(connectFrom!==n.id) connections.push([connectFrom,n.id]); connectFrom=null; render(); }
    return;
  }
  if(tool==='dashed'){ n.showDashed=!n.showDashed; const idx=initialNodes.findIndex(x=>x.id===n.id); if(idx!==-1) initialNodes[idx].showDashed=n.showDashed; render(); return; }
  if(tool==='deco'){ n.showDeco=!n.showDeco; const idx=initialNodes.findIndex(x=>x.id===n.id); if(idx!==-1) initialNodes[idx].showDeco=n.showDeco; render(); return; }
  if(tool==='delete'){ deleteNodeById(n.id); return; }

  selectedNode=n;
  showDetails(n);
  if(tool==='edit' || ['dashed','circle-node','root','category','sub'].includes(n.type)){
  openRightPanel();
}
  highlightNodeId(n.id);
}

/* ===========================
   Canvas interactions
   =========================== */
svg.addEventListener('click', e => {
  if (!tool) return;
  const pt = svgPointFromEvent(e);
  let newNode = null;
  let type = tool.startsWith('add-') ? tool.replace('add-','') : tool;

  if(type==='root'){
    newNode = {id:uid(), label:'New Root', type:'root', x:pt.x, y:pt.y, desc:'', url:'', showDashed:false};
  }
  if(type==='category'){
    newNode = {id:uid(), label:'New Category', type:'category', x:pt.x, y:pt.y, desc:'', url:'', showDashed:false};
    if(activeRootId) connections.push([activeRootId,newNode.id]);
  }
  if(type==='sub'){
    newNode = {id:uid(), label:'New Sub', type:'sub', x:pt.x, y:pt.y, desc:'', url:'', showDashed:false};
    if(selectedNode && selectedNode.type==='category') connections.push([selectedNode.id,newNode.id]);
  }
  if(type==='dashed'){
    newNode = {id:uid(), label:'Dashed Node', type:'dashed', x:pt.x, y:pt.y, desc:'', url:'', showDashed:true};
  }
  if(type==='circle-node'){ 
    newNode = {id:uid(), label:'Circle Node', type:'circle-node', x:pt.x, y:pt.y, desc:'', url:'', showDashed:false};
  }
  if(newNode){
    initialNodes.push(newNode);
    nodes.push(newNode);
    render();
    refreshRootList();
  }
});

// zoom/pan
svg.addEventListener('wheel', e=>{
  e.preventDefault();
  const delta=-e.deltaY/500;
  const newZoom=Math.min(3,Math.max(0.4,zoom+delta*zoom));
  const rect=svg.getBoundingClientRect();
  const mx=e.clientX-rect.left;
  const my=e.clientY-rect.top;
  const wx=(mx-panX)/zoom;
  const wy=(my-panY)/zoom;
  panX=mx-wx*newZoom;
  panY=my-wy*newZoom;
  zoom=newZoom;
  setViewTransform();
},{passive:false});

let panning=false, panStart={x:0,y:0,px:0,py:0};
svg.addEventListener('mousedown', e=>{
  if(e.target===svg && tool==='select'){ panning=true; panStart={x:e.clientX,y:e.clientY,px:panX,py:panY}; canvasWrap.style.cursor='grabbing'; }
});
window.addEventListener('mousemove', e=>{ if(panning){ panX=panStart.px+(e.clientX-panStart.x); panY=panStart.py+(e.clientY-panStart.y); setViewTransform(); }});
window.addEventListener('mouseup', ()=>{ if(panning){ panning=false; canvasWrap.style.cursor=''; }});
svg.addEventListener('contextmenu', e=>e.preventDefault());

/* ===========================
   Delete / Highlight / Details
   =========================== */
function deleteNodeById(id){
  initialNodes.splice(initialNodes.findIndex(n=>n.id===id),1);
  connections=connections.filter(([a,b])=>a!==id&&b!==id);
  nodes=nodes.filter(n=>n.id!==id);
  if(selectedNode && selectedNode.id===id){ selectedNode=null; hideRightPanel(); }
  refreshRootList(); render();
}

function highlightNodeId(id){
  lineElements.forEach(l=>{
    if(l.from===id||l.to===id){ l.path.setAttribute('stroke','#facc15'); l.path.setAttribute('stroke-width','4'); }
    else { l.path.setAttribute('stroke','#94a3b8'); l.path.setAttribute('stroke-width','2'); }
  });
  gNodes.querySelectorAll('g').forEach(g=>{
    const sid=g.getAttribute('data-id');
    const shape=g.querySelector('rect, circle');
    if(!shape) return;
    shape.setAttribute('stroke-width',sid===id?'5':'3');
  });
}

/* ===========================
   Details panel
   =========================== */
const rightpanel=document.getElementById('rightpanel');
const inputLabel=document.getElementById('inputLabel');
const inputUrl=document.getElementById('inputUrl');
const inputDesc=document.getElementById('inputDesc');
const detailsJson=document.getElementById('detailsJson');
const selectedIdEl=document.getElementById('selectedId');

function showDetails(n){
  selectedNode=n;
  selectedIdEl.textContent=n.id;
  inputLabel.value=n.label||'';
  inputUrl.value=n.url||'';
  inputDesc.value=n.desc||'';
  saveOutputToDetails();
  openRightPanel();
  highlightNodeId(n.id);
}
function openRightPanel(){ rightpanel.classList.add('show'); }
function hideRightPanel(){ rightpanel.classList.remove('show'); selectedIdEl.textContent='—'; }

document.getElementById('btnSaveDetails').addEventListener('click', ()=>{
  if(!selectedNode) return;
  selectedNode.label=inputLabel.value;
  selectedNode.url=inputUrl.value;
  selectedNode.desc=inputDesc.value;
  const idx=initialNodes.findIndex(n=>n.id===selectedNode.id);
  if(idx!==-1) initialNodes[idx]=selectedNode;
  render();
});

/* ===========================
   Save / Output
   =========================== */
function saveOutputToDetails(){
  detailsJson.value=JSON.stringify({nodes:initialNodes,connections},null,2);
}

/* ===========================
   Init
   =========================== */
refreshRootList();
render(); 
