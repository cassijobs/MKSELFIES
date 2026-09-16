const app=document.querySelector('#app');
const CONFIG_KEY='presentes_encantados_config_v1';
const DEFAULTS={nome:'Caneca Bom Dia',frase:'Que hoje encontre você sorrindo.',assinatura:'Um MKSELFIES',cor:'#ffd17a'};
let stream=null,photoUrl='',nativePhotoUrl='';
const config=()=>{try{return{...DEFAULTS,...JSON.parse(localStorage.getItem(CONFIG_KEY)||'{}')}}catch{return DEFAULTS}};
function home(){stopCamera();app.innerHTML=`<section class="screen"><span class="brand">MKSELFIES</span><h1>A arte guarda uma surpresa.</h1><p>Aponte a câmera para o presente. Quando ele for reconhecido, uma experiência fotográfica será revelada.</p><div class="art-orbit"><span class="spark s1">✦</span><span class="mug">☕</span><span class="spark s2">✦</span></div><div class="actions"><button class="btn primary" id="scan">Experimentar protótipo</button><button class="btn quiet" id="studio">Abrir Studio</button></div></section>`;document.querySelector('#scan').onclick=reveal;document.querySelector('#studio').onclick=()=>location.href='../studio/'}
function reveal(){const c=config();app.innerHTML=`<section class="screen reveal"><div class="reveal-mark">✨</div><span class="brand">Arte reconhecida</span><h1>${safe(c.nome)}</h1><p>Esta arte preparou uma lembrança para você.</p><div class="actions"><button class="btn primary" id="prepare">Preparar minha foto</button><button class="btn quiet" id="back">Agora não</button></div></section>`;document.querySelector('#prepare').onclick=openCamera;document.querySelector('#back').onclick=home}
function openCamera(){
 stopCamera();
 app.innerHTML=`<section class="screen native-prompt"><span class="brand">Sua foto encantada</span><h1>Abra a câmera do celular.</h1><p>Tire sua fotografia normalmente, em pé. Ao voltar, você poderá posicionar o efeito antes de guardar.</p><div class="art-orbit"><span class="spark s1">✦</span><span class="mug">📷</span><span class="spark s2">✦</span></div><input id="native-camera" type="file" accept="image/*" capture="user" hidden><div class="actions"><button class="btn primary" id="open-native">Abrir câmera frontal</button><button class="btn quiet" id="back">Voltar</button></div></section>`;
 const input=document.querySelector('#native-camera');
 input.onchange=()=>{const file=input.files?.[0];if(file)openPhotoEditor(file)};
 document.querySelector('#open-native').onclick=()=>input.click();
 document.querySelector('#back').onclick=home;
 input.click();
}
function openPhotoEditor(file){
 if(nativePhotoUrl)URL.revokeObjectURL(nativePhotoUrl);
 nativePhotoUrl=URL.createObjectURL(file);
 const c=config();
 app.innerHTML=`<section class="screen camera-screen"><div class="camera-wrap"><img id="source-photo" class="source-photo" src="${nativePhotoUrl}" alt="Fotografia escolhida"><canvas id="canvas"></canvas><div class="camera-overlay"><div class="topbar"><span class="brand">Ajuste sua foto</span><button class="round" id="close" aria-label="Fechar">×</button></div><div class="guide" id="guide" style="--effect:${safe(c.cor)}"><div class="magic-ring"></div><span>Arraste o efeito<br>para a posição desejada</span></div><div class="camera-copy"><strong>${safe(c.frase)}</strong><span>${safe(c.assinatura)}</span></div><div class="status" id="status"></div><div class="capturebar"><button class="btn primary finish-photo" id="capture">Criar minha foto</button></div></div></div></section>`;
 document.querySelector('#close').onclick=openCamera;
 document.querySelector('#capture').onclick=capture;
 makeDraggable(document.querySelector('#guide'));
}
function makeDraggable(el){let active=false,dx=0,dy=0;el.addEventListener('pointerdown',e=>{active=true;el.setPointerCapture(e.pointerId);const r=el.getBoundingClientRect();dx=e.clientX-r.left;dy=e.clientY-r.top});el.addEventListener('pointermove',e=>{if(!active)return;const p=el.parentElement.getBoundingClientRect();el.style.left=`${Math.max(0,Math.min(p.width-el.offsetWidth,e.clientX-p.left-dx))}px`;el.style.top=`${Math.max(70,Math.min(p.height-el.offsetHeight-130,e.clientY-p.top-dy))}px`;el.style.transform='none'});el.addEventListener('pointerup',()=>active=false)}
function drawMirrored(ctx,video,x,y,w,h){ctx.save();ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(video,0,0,video.videoWidth,video.videoHeight,0,0,w,h);ctx.restore()}
function capture(){
 const photo=document.querySelector('#source-photo'),canvas=document.querySelector('#canvas'),guide=document.querySelector('#guide'),c=config();
 if(!photo?.complete||!photo.naturalWidth){showStatus('Aguarde a fotografia ficar pronta.');return}
 const sourceW=photo.naturalWidth,sourceH=photo.naturalHeight,maxSide=2048,resize=Math.min(1,maxSide/Math.max(sourceW,sourceH)),outW=Math.round(sourceW*resize),outH=Math.round(sourceH*resize),ctx=canvas.getContext('2d');
 canvas.width=outW;canvas.height=outH;ctx.drawImage(photo,0,0,outW,outH);
 const pr=photo.getBoundingClientRect(),gr=guide.getBoundingClientRect(),previewScale=Math.min(pr.width/sourceW,pr.height/sourceH),shownW=sourceW*previewScale,shownH=sourceH*previewScale,offsetX=(pr.width-shownW)/2,offsetY=(pr.height-shownH)/2;
 const normX=(gr.left-pr.left-offsetX)/shownW,normY=(gr.top-pr.top-offsetY)/shownH,normW=gr.width/shownW,normH=gr.height/shownH;
 const x=normX*outW,y=normY*outH,gw=normW*outW,gh=normH*outH;
 drawEffect(ctx,x,y,gw,gh,c.cor);drawCaption(ctx,outW,outH,c);
 canvas.toBlob(blob=>{if(!blob)return;if(photoUrl)URL.revokeObjectURL(photoUrl);photoUrl=URL.createObjectURL(blob);result(blob,c)},'image/jpeg',.92)
}
function drawEffect(ctx,x,y,w,h,color){ctx.save();ctx.strokeStyle=color;ctx.lineWidth=Math.max(4,w*.018);ctx.shadowColor=color;ctx.shadowBlur=w*.08;ctx.beginPath();ctx.ellipse(x+w/2,y+h/2,w*.38,h*.38,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle=color;ctx.font=`${Math.round(w*.14)}px serif`;ctx.fillText('✦',x+w*.12,y+h*.18);ctx.fillText('✦',x+w*.78,y+h*.78);ctx.restore()}
function drawCaption(ctx,w,h,c){const size=Math.round(w*.047),pad=w*.06;ctx.save();ctx.textAlign='center';ctx.fillStyle='rgba(10,8,16,.48)';ctx.fillRect(0,h-h*.19,w,h*.19);ctx.fillStyle='#fff';ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.font=`600 ${size}px Georgia,serif`;wrap(ctx,c.frase,w/2,h-h*.11,w-pad*2,size*1.15);ctx.font=`500 ${Math.round(size*.48)}px Arial`;ctx.fillText(c.assinatura,w/2,h-h*.035);ctx.restore()}
function wrap(ctx,text,x,y,max,line){const words=text.split(' '),lines=[];let cur='';for(const word of words){const test=cur?`${cur} ${word}`:word;if(ctx.measureText(test).width>max&&cur){lines.push(cur);cur=word}else cur=test}lines.push(cur);const start=y-(lines.length-1)*line/2;lines.forEach((l,i)=>ctx.fillText(l,x,start+i*line))}
function result(blob,c){window.__photoBlob=blob;app.innerHTML=`<section class="screen result"><span class="brand">Momento guardado</span><img class="photo" src="${photoUrl}" alt="Sua fotografia com o efeito ${safe(c.nome)}"><div class="actions"><button class="btn primary" id="share">Compartilhar</button><button class="btn secondary" id="download">Guardar</button><button class="btn quiet" id="again">Tirar outra</button></div></section>`;document.querySelector('#share').onclick=share;document.querySelector('#download').onclick=download;document.querySelector('#again').onclick=openCamera}
async function share(){const file=new File([window.__photoBlob],'mkselfies.jpg',{type:'image/jpeg'});if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'MKSELFIES'});return}catch(e){if(e.name==='AbortError')return}}download()}
function download(){const a=document.createElement('a');a.href=photoUrl;a.download='mkselfies.jpg';a.click()}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null}
function showStatus(msg){const el=document.querySelector('#status');if(el){el.textContent=msg;el.classList.add('show')}}
function safe(v){return String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]))}
addEventListener('pagehide',stopCamera);home();
