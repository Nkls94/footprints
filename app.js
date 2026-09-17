'use strict';
const map=L.map('map',{preferCanvas:true,minZoom:12,maxZoom:23});
L.control.scale({imperial:false}).addTo(map);
const scenes=window.SATLAs_SCENES; let current=null,imagery=null,layers=[],generation=0;
const byId=id=>document.getElementById(id);
for(const s of scenes){const o=document.createElement('option');o.value=s.key;o.textContent=s.title;byId('scene').appendChild(o);}
const fmt=n=>Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
function mode(){return document.querySelector('input[name=mode]:checked').value;}
function showLayers(){
  layers.forEach(l=>map.removeLayer(l));layers=[];if(!current)return;
  const selected=mode(),opacity=Number(byId('opacity').value);
  for(const kind of ['raw','regularized']){
    if(selected!=='both'&&selected!==kind)continue;
    const layer=L.geoJSON(current[kind],{
      style:{color:kind==='raw'?'#ffbf47':'#50e4d1',weight:1.3,fillOpacity:opacity},
      onEachFeature:(f,l)=>{const p=f.properties;const el=document.createElement('div');
        el.textContent=`Building #${p.instance_id} · ${kind==='raw'?'Original':'Regularized 0.3 m'}\nConfidence: ${Number(p.score??p.confidence??0).toFixed(3)}`;
        el.style.whiteSpace='pre-line';l.bindPopup(el);}}).addTo(map);layers.push(layer);
  }
  byId('status').textContent=`${current.title} · ${selected==='none'?'Imagery only':selected==='both'?'Original + regularized':selected==='raw'?'Original shapes':'Regularized 0.3 m'}`;
}
function selectScene(key){
  const s=scenes.find(v=>v.key===key);if(!s)throw new Error('Unknown scene');current=s;
  if(imagery)map.removeLayer(imagery);
  const token=++generation;
  imagery=L.imageOverlay(s.image,s.bounds,{opacity:1,attribution:'Project RGB imagery · Satlas six-city predictions'}).addTo(map);
  imagery.on('error',()=>{if(token===generation)byId('status').textContent='Image could not load. Extract the complete ZIP and reopen index.html.';});
  map.fitBounds(s.bounds,{padding:[20,20]});
  byId('count').textContent=fmt(s.raw.features.length);byId('area').textContent=s.area_km2.toFixed(3);
  showLayers();
}
byId('scene').addEventListener('change',e=>selectScene(e.target.value));
document.querySelectorAll('input[name=mode],#opacity').forEach(e=>e.addEventListener('input',showLayers));
byId('fit').addEventListener('click',()=>map.fitBounds(current.bounds,{padding:[20,20]}));
selectScene(scenes[0].key);
