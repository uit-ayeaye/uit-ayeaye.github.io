var br=Object.defineProperty;var wr=(e,o,n)=>o in e?br(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var ps=(e,o,n)=>wr(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as se,j as t,d as La,f as Me,h as yr,i as vr}from"./vendor-C2HIMx-P.js";import{t as Se,c as S,aD as Tn,au as $n,d as Kn,a5 as _e,aJ as Mr,f as jr,Y as fs,a0 as ms,ag as R,h as ne,aK as kr,ay as Sr,az as so,aA as ao,aq as Fa,R as zr,M as at,o as yt,at as Bt,ax as pt,aL as ro,aM as io,a4 as Tr,a8 as Dt,ar as lo,av as Pa,aC as Er,A as Rr}from"./three-Zo_RlN_K.js";import{f as to,m as vo,w as Ye,a as Vt,e as Ct,P as Ar,G as Ir,S as Cr,I as Lr}from"./index-9VBPaH6b.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},T={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},$o={dir:[.72,.52,-.44],col:"#f2e9cf"},Gt={sea:.00105,bay:48e-5,deepGrade:210},Fr=1.15;function ie(e){const o=new Se(e);return[o.r,o.g,o.b]}const Pr=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,Gr=`
  precision highp float;

  uniform float uTime;
  uniform vec3  uHigh;
  uniform vec3  uLow;
  uniform vec3  uCloud;
  uniform vec3  uCloudLit;
  uniform vec3  uEmber;
  uniform float uFlash;
  uniform vec3  uFlashColor;
  uniform vec3  uFlashDir;
  uniform float uGlow;
  uniform vec3  uMoonDir;
  uniform vec3  uMoonCol;
  uniform float uUnder;
  uniform vec3  uUnderCol;

  varying vec3 vDir;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }
  float fbm(vec2 p) {
    float s = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { s += noise(p) * a; p *= 2.03; a *= 0.5; }
    return s;
  }

  void main() {
    vec3 d = normalize(vDir);
    float up = clamp(d.y, -1.0, 1.0);

    /* Base gradient. The horizon band is the brightest part of the sky — a
       storm at night is lit by whatever is under it, not from above. */
    float t = smoothstep(-0.12, 0.72, up);
    vec3 col = mix(uLow, uHigh, t);

    /* Clouds. Projected onto a plane above the viewer, so they converge at the
       horizon the way real overcast does. The guard on the up term keeps the
       division from exploding at eye level. */
    vec2 cp = d.xz / max(abs(up) + 0.18, 0.18);
    float c1 = fbm(cp * 0.75 + vec2(uTime * 0.0075, uTime * 0.0031));
    float c2 = fbm(cp * 1.85 - vec2(uTime * 0.0128, uTime * 0.0062));
    float cover = smoothstep(0.34, 0.86, c1 * 0.68 + c2 * 0.42);
    // Thin the deck near the horizon so the island silhouette has sky behind it.
    cover *= smoothstep(-0.06, 0.34, up);

    col = mix(col, uCloud, cover * 0.85);

    /* Underlighting. The island sits at -Z, so cloud in that half of the sky and
       low to the horizon picks up the furnace. This is the term that ties the
       sky to the scene; without it the dome could belong to any storm anywhere. */
    float toward = smoothstep(0.1, 0.95, dot(d, normalize(vec3(0.0, 0.22, -1.0))));
    float low = 1.0 - smoothstep(0.0, 0.5, up);
    float lit = toward * low * uGlow;
    col = mix(col, uCloudLit, lit * cover * 0.8);
    col += uEmber * lit * 0.13;

    /* The full moon of the Fire Festival — canon insists on it (it is the
       Sulong moon) and on it staying VEILED: it rides behind the deck and
       breaks through only where the scrolling cover thins, so it comes and
       goes on the cloud's own schedule with no extra animation. Oversized to
       anime proportions on purpose; a correct half-degree disc reads as a
       star at this fog level. */
    float md = dot(d, normalize(uMoonDir));
    /* MUCH BIGGER. It was a two-degree disc, which is very nearly correct and
       completely wrong: at this fog density and this exposure it read as a
       bright star, and the one image everybody has of this island is a low dark
       silhouette under a MOON. Nine degrees across is anime proportion — the
       same licence the horns and the mouth already take — and it gives the
       water something to be lit by other than the face. */
    float disc = smoothstep(0.99560, 0.99700, md);
    float halo = pow(max(md, 0.0), 260.0) * 0.55 + pow(max(md, 0.0), 34.0) * 0.14;
    /* And less veiled. Canon has it break through the cover rather than hide
       behind it, and the cloud still crosses it on its own schedule. */
    float veil = 1.0 - cover * 0.55;
    col += uMoonCol * (disc * 3.4 + halo) * veil;

    /* Lightning. The flash is directional — it comes from where the bolt is —
       so the sky brightens asymmetrically and the storm reads as having a
       position rather than being a global fade. */
    float aim = pow(max(dot(d, normalize(uFlashDir)), 0.0), 3.0);
    col += uFlashColor * uFlash * (0.35 + aim * 1.5) * (0.4 + cover * 0.9);

    /* Submerged, the dome IS the murk. The underwater far plane pulls in to
       1700m for the cull win, which slices the 4km ocean plane — and every
       fragment that slice exposes is this dome, so it must wear the fog's
       colour or the abyss has a storm-pink hole in it. */
    col = mix(col, uUnderCol, uUnder);

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function Or({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new S(...ie(X.skyHigh))},uLow:{value:new S(...ie(X.skyLow))},uCloud:{value:new S(...ie(X.cloud))},uCloudLit:{value:new S(...ie(X.cloudLit))},uEmber:{value:new S(...ie(T.ember))},uFlash:{value:0},uFlashColor:{value:new S(...ie(X.boltGlow))},uFlashDir:{value:new S(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new S(...$o.dir).normalize()},uMoonCol:{value:new S(...ie($o.col))},uUnder:{value:0},uUnderCol:{value:new S(...ie(X.underHaze))}}),[]);return se((s,r)=>{const i=o.current?.uniforms;i&&(i.uTime.value+=r,i.uFlash.value=e?.flash??0,e?.flashDir&&i.uFlashDir.value.copy(e.flashDir),i.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:Pr,fragmentShader:Gr,uniforms:n,side:Tn,depthWrite:!1,depthTest:!1,fog:!1})]})}const _=1.9,V=e=>e*_,pe={x:0,z:V(-60)},wt=V(300),Bo=V(175),Dr=118,P={x:0,z:V(-402),r:V(215),baseY:300,squash:[1.18,1.04,.98]},wo=[[-.361,.301,.883],[.361,.301,.883]],Xn=[0,.02,.9998],Qn=[0,-.419,.908];function Zn(e,o=1){const[n,s,r]=P.squash;return{x:P.x+e[0]*P.r*n*o,y:P.baseY+e[1]*P.r*s*o,z:P.z+e[2]*P.r*r*o}}const Ie=wo.map(e=>Zn(e)),he={...Zn(Qn),halfWidth:74,height:62};Zn(Xn,.94);const K={x:V(-152),y:4.5,z:V(-104),r:V(78)},gs=2.35,Ht=[Math.sin(gs),Math.cos(gs)],W=(()=>{const e=wt+Bo*.35,o=pe.x+Ht[0]*e,n=pe.z+Ht[1]*e;return{x:o,z:n,pool:V(46),benchY:3.6,reach:V(560),gate:{x:o-Ht[0]*V(44),z:n-Ht[1]*V(44)},berth:{x:o+Ht[0]*V(12),z:n+Ht[1]*V(12)},dir:Ht}})(),Nr=[{rank:1,role:"east-south",ang:.75,dist:V(730),r:V(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:V(730),r:V(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:V(770),r:V(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:V(690),r:V(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:V(690),r:V(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:V(765),r:V(150),depth:42,dir:1,speed:35}],Be=[];function Ga(e){const o=e==="low"?3:e==="mid"?5:7;Be.length=0;for(const n of Nr)n.rank>o||Be.push({role:n.role,x:pe.x+Math.sin(n.ang)*n.dist,z:pe.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Be}const Hr=e=>Be.find(o=>o.role===e)??Be[0];Ga("high");function Oa(e,o,n=0){let s=0,r=0;const i=1-Ze(8,34,n);if(i<=0)return{vx:s,vz:r,danger:0};let l=0;for(const h of Be){const c=e-h.x,d=o-h.z,b=Math.hypot(c,d);if(b>h.r*1.7||b<.001)continue;const g=b/h.r,m=1-Ze(1,1.6,g),f=h.speed*(g/.3)*Math.exp(1-g/.3)*.62*m,p=h.speed*.55*Math.exp(-g*g*2.6)*m+h.speed*.1*m,x=1/b;s+=(-d*x*f*h.dir-c*x*p)*i,r+=(c*x*f*h.dir-d*x*p)*i,l=Math.max(l,(1-Ze(.15,1.15,g))*i)}return{vx:s,vz:r,danger:l}}const Ko={x:0,halfWidth:V(96)},Ot=V(258),oo=V(624),Xo={safe:260,range:640},_r=0,Uo=V(1500),Qo=e=>e<0?0:e>1?1:e;function Br(e,o,n=4){let s=0,r=1,i=1,l=0;for(let h=0;h<n;h++){const c=1-Math.abs(to(e*i,o*i,1)*2-1);s+=c*c*r,l+=r,r*=.52,i*=2.07}return s/l}const Ze=(e,o,n)=>{const s=Qo((n-e)/(o-e));return s*s*(3-2*s)};function Ur(e){if(e>V(430))return 1e4;const o=1-Ze(V(430),V(205),e),n=Ze(V(150),V(-30),e);return Ko.halfWidth+o*V(620)+n*V(300)}function Wr(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let s=Dr;return s+=o*190,s+=Math.max(0,n)*46,s-=Math.max(0,-n)*26,s}function re(e,o){const n=e-pe.x,s=o-pe.z,r=Math.hypot(n,s),i=Math.atan2(n,s),l=(r-wt)/Bo,h=Math.exp(-l*l*1.35)*Wr(i),c=Math.max(0,r-wt-Bo*.55),d=-Math.pow(c/210,1.6)*175,b=Math.max(0,wt-Bo*.5-r),g=-Ze(0,150,b)*46,m=Qo(h/60),f=(Br(e*.0052/_+13,o*.0052/_-21,4)-.42)*168*m,p=(to(e*.0042/_+31,o*.0042/_-17,4)-.5)*84*m,x=(to(e*.021-5,o*.021+9,3)-.5)*17*m;let u=h+d+g+f+p+x;const v=Ur(o),z=1-Ze(v,v+V(105),Math.abs(e-Ko.x)),E=1-Ze(V(-40),V(-190),o),j=z*E;u=u*(1-j)+Math.min(u,-34)*j;const I=Math.hypot(e-P.x,o-P.z);u+=Math.exp(-Math.pow(I/(P.r*1.55),2))*62;const a=(e-K.x)/V(76),k=(o-K.z)/V(58),L=(1-Ze(.72,1.18,Math.hypot(a,k)))*Qo((u+34)/34);u=u*(1-L)+K.y*L;const A=e-W.x,M=o-W.z;if(Math.abs(A)+Math.abs(M)<W.reach+V(140)){const G=Math.max(0,Math.min(W.reach,A*W.dir[0]+M*W.dir[1])),F=A-W.dir[0]*G,O=M-W.dir[1]*G,oe=Math.hypot(F,O),ue=V(30)+G/W.reach*V(48),D=1-Ze(ue,ue+V(62),oe);u=u*(1-D)+Math.min(u,-26)*D;const $=Math.hypot(A,M),Q=1-Ze(W.pool*.55,W.pool,$);u=u*(1-Q)+Math.min(u,-14)*Q;const ae=(e-W.gate.x)/V(30),be=(o-W.gate.z)/V(24),de=1-Ze(.72,1.18,Math.hypot(ae,be));u=u*(1-de)+W.benchY*de}return u}function qn(e,o,n=3){const s=re(e+n,o)-re(e-n,o),r=re(e,o+n)-re(e,o-n),i=-s,l=2*n,h=-r,c=Math.hypot(i,l,h)||1;return[i/c,l/c,h/c]}function Yr(e,o,n=3){return Math.acos(qn(e,o,n)[1])}function Mo(e,o){const n=Ze(V(250),V(40),o),s=1-Ze(wt-V(40),wt+V(90),Math.hypot(e-pe.x,o-pe.z)),r=(1-Ze(V(60),V(170),Math.hypot(e-W.x,o-W.z)))*.85;return Qo(Math.max(Math.min(n,s),r))}const Da=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],Vr=Math.PI*2;function $r(e,o,n){let s=0,r=0,i=0;for(const l of Be){const h=e-l.x,c=o-l.z,d=Math.max(1,Math.hypot(h,c));if(d>l.r*1.75)continue;const b=d/l.r,g=Math.exp(-3*b*b);s-=l.depth*g;const m=l.depth*6*b*g/l.r;r+=m*(h/d),i+=m*(c/d);const f=Math.atan2(c,h),p=Math.sin(f*3*l.dir+b*14-n*2.2),x=b*Math.exp(1-b)*(1-Kr(b));s+=p*x*1.6}return{y:s,dx:r,dz:i}}function Kr(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function xt(e,o,n,s=1){let r=0,i=0,l=0;for(const c of Da){const d=Vr/c.len,b=Math.sqrt(9.81/d),g=Math.hypot(c.dir[0],c.dir[1]),m=c.dir[0]/g,f=c.dir[1]/g,p=d*(m*e+f*o-b*n),x=c.amp*s;r+=x*Math.sin(p);const u=x*d*Math.cos(p);i+=u*m,l+=u*f}const h=$r(e,o,n);return r+=h.y,i+=h.dx,l+=h.dz,{y:r,dx:i,dz:l}}const Xr=Da.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Qr=()=>Be.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),Zr=()=>Be.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),qr=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*_).toFixed(1)}, ${(250*_).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(wt-40*_).toFixed(1)}, ${(wt+90*_).toFixed(1)},
      length(p - vec2(${pe.x.toFixed(1)}, ${pe.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*_).toFixed(1)}, ${(170*_).toFixed(1)},
      length(p - vec2(${W.x.toFixed(1)}, ${W.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Jr=()=>`
  uniform float uTime;
  uniform sampler2D uLand;
  uniform float uSpan;
  uniform vec2  uCentre;

  varying vec3  vWorld;
  varying vec3  vNormal;
  varying float vShelter;
  varying float vBay;
  varying float vDepth;
  varying float vCrest;

  /* Shelter: how far inside the bay this point is. Mirrors field.js/shelter().
     Kept as smoothsteps rather than sampled from the land texture because it
     must stay smooth across the channel, where the land mask is a hard edge
     and would make the water's calmness flicker along the shore. The body is
     GENERATED from field.js's own constants — see SHELTER_GLSL. */
${qr}

  /* One maelstrom. A gaussian bowl sunk into the surface plus a slow spiral
     corrugation, matching whirlSurfaceAt in lib/sea.js exactly. The gradient
     goes into the tangent frame the same way the swells' does, so the funnel
     walls shade and catch the eye-socket glints like any other slope. */
  void whirl(
    vec2 p, vec2 c, float R, float depth, float dirSign, float t,
    inout vec3 disp, inout vec3 tangent, inout vec3 binormal
  ) {
    vec2 d = p - c;
    float r = max(length(d), 1.0);
    float q = r / R;
    if (q > 1.75) return;
    float bowl = exp(-3.0 * q * q);
    disp.y -= depth * bowl;
    float slope = depth * 6.0 * q * bowl / R;
    tangent.y  += slope * d.x / r;
    binormal.y += slope * d.y / r;
    float ang = atan(d.y, d.x);
    float ring = q * exp(1.0 - q) * (1.0 - smoothstep(1.0, 1.6, q));
    disp.y += sin(ang * 3.0 * dirSign + q * 14.0 - t * 2.2) * ring * 1.6;
  }

  /* One Gerstner wave. Accumulates into position and into the tangent frame so
     the normal comes out analytically — a finite-difference normal on a 15m quad
     is a facet, not a normal.

     Parametrised by AMPLITUDE in metres, not by the steepness the textbook form
     uses. Steepness is the wrong dial to author with: it is divided by the wave
     number, so the same steepness produces a 25m wave at 187m wavelength and a
     4m wave at 30m, and tuning the sea state means solving for k in your head
     every time. Amplitude is the thing being judged by eye, so it is the thing
     in the call. */
  void gerstner(
    vec2 p, vec2 dir, float amplitude, float len, float t,
    inout vec3 disp, inout vec3 tangent, inout vec3 binormal, inout float total
  ) {
    float k = 6.2831853 / len;
    float c = sqrt(9.81 / k);
    vec2  d = normalize(dir);
    float f = k * (dot(d, p) - c * t);
    // Steepness must stay under 1 or the wave self-intersects and the surface
    // folds through itself — visible as black shards on the crests.
    float steep = min(amplitude * k, 0.92);

    disp.x += d.x * amplitude * cos(f);
    disp.z += d.y * amplitude * cos(f);
    disp.y += amplitude * sin(f);
    total  += amplitude;

    float sf = steep * sin(f);
    float cf = steep * cos(f);
    tangent  += vec3(-d.x * d.x * sf,  d.x * cf, -d.x * d.y * sf);
    binormal += vec3(-d.x * d.y * sf,  d.y * cf, -d.y * d.y * sf);
  }

  void main() {
    vec3 world = (modelMatrix * vec4(position, 1.0)).xyz;
    vec2 p = world.xz;

    /* Land mask lookup. R holds normalised depth: 0 at the shoreline, 1 in deep
       water. Outside the baked span it clamps to deep, which is correct — there
       is nothing but ocean out there. */
    vec2 uv = (p - uCentre) / uSpan + 0.5;
    float depth = texture2D(uLand, clamp(uv, 0.0, 1.0)).r;
    depth = mix(1.0, depth, step(0.0, min(uv.x, uv.y)) * step(max(uv.x, uv.y), 1.0));

    float shelter = shelterAt(p);

    /* Amplitude is killed twice over: by shelter (the bay is enclosed) and by
       depth (a swell cannot stand up in 3m of water — it breaks, which is what
       the foam term downstream is for). Without the depth factor the surf runs
       straight through the headlands and up the beach. */
    float amp = mix(1.0, 0.055, shelter) * smoothstep(0.0, 0.28, depth);

    vec3 disp = vec3(0.0);
    vec3 tangent = vec3(1.0, 0.0, 0.0);
    vec3 binormal = vec3(0.0, 0.0, 1.0);
    float total = 0.0;

    /* Three swells, deliberately non-harmonic wavelengths so the pattern does
       not visibly repeat, all running roughly north — the storm is driving the
       fleet onto the island, which is why the alliance can make the crossing at
       all on the night of a gale.

       Amplitudes are a gale, not a tsunami: 7.5m on the primary swell against a
       ~190m wavelength is a steep, genuinely dangerous sea and already large
       next to the 24m ships crossing it.

       THESE LINES ARE GENERATED from lib/sea.js, because the fleet has to ride
       this exact surface and it computes the same sum on the CPU. Two hand-kept
       copies of a wave table is a bug waiting for the first time someone tunes
       the sea state and forgets the other one. */
${Xr}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Qr()}

    vec3 pos = world + disp;

    vNormal  = normalize(cross(binormal, tangent));
    vWorld   = pos;
    vShelter = shelter;
    vBay     = bayShelterAt(p);
    vDepth   = depth;
    /* Crest height normalised against the amplitude actually summed at this
       point, so foam appears on the tops of small waves in the lee on the same
       terms as big ones in the open. Normalising against a constant instead is
       what puts foam on the entire ocean the moment the sea state is raised. */
    vCrest   = clamp(disp.y / max(total, 0.001), -1.0, 1.0);

    gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
  }
`,ei=()=>`
  precision highp float;

  uniform float uTime;
  uniform vec3  uDeep;
  uniform vec3  uShallow;
  uniform vec3  uFoam;
  uniform vec3  uSkyLow;
  uniform vec3  uGilt;
  uniform vec3  uEmber;
  uniform vec3  uFogColor;
  uniform float uFogDensity;
  uniform vec3  uUnderDeep;
  uniform vec3  uUnderGlow;
  /** 0..1 over the first ~70m of depth. Kills the surface light with depth. */
  uniform float uDepthFade;
  uniform vec3  uEyeA;
  uniform vec3  uEyeB;
  /** The moon, as a direction — see the moonpath below. Matches fx/Sky.jsx. */
  uniform vec3  uMoonDir;
  uniform vec3  uMoonCol;
  uniform float uFlash;
  uniform vec3  uFlashColor;
  uniform vec3  uCameraPos;

  varying vec3  vWorld;
  varying vec3  vNormal;
  varying float vShelter;
  varying float vBay;
  varying float vDepth;
  varying float vCrest;

  /* Small-scale chop, as a normal perturbation only. Three octaves of crossed
     sines is enough because it is never seen in silhouette — it only has to
     break up the specular so the sea does not read as a sheet of vinyl. */
  vec3 chop(vec2 p, float t, float strength) {
    float a = sin(p.x * 0.145 + t * 1.7) * cos(p.y * 0.121 - t * 1.3);
    float b = sin(p.x * 0.061 - t * 0.9 + a) * cos(p.y * 0.078 + t * 1.1);
    float c = sin((p.x + p.y) * 0.32 + t * 2.6) * 0.4;
    vec2 g = vec2(
      cos(p.x * 0.145 + t * 1.7) * 0.145 + cos(p.x * 0.061 - t * 0.9) * 0.061 + c * 0.1,
      -sin(p.y * 0.121 - t * 1.3) * 0.121 + b * 0.05
    );
    return normalize(vec3(-g.x * strength, 1.0, -g.y * strength));
  }

  /* A maelstrom's face paint: log-spiral foam arms tightening into a froth
     collar at the throat, and an ink darkening toward the drop. The log
     winding is the signature — linear spirals read as a decal, log spirals
     read as water being wound in. Returns (foam, darkening). */
  vec2 whirlMark(vec2 p, vec2 c, float R, float dirSign, float t) {
    vec2 d = p - c;
    float r = max(length(d), 1.0);
    float q = r / R;
    if (q > 1.7) return vec2(0.0);
    float ang = atan(d.y, d.x);
    float spiral = sin(ang * 3.0 * dirSign + log(q + 0.06) * 9.0 - t * 2.2 * dirSign);
    float arms = smoothstep(0.15, 0.9, spiral)
               * (1.0 - smoothstep(0.85, 1.45, q))
               * smoothstep(0.10, 0.30, q);
    float throat = 1.0 - smoothstep(0.10, 0.26, q);
    float dark = 1.0 - smoothstep(0.06, 0.55, q);
    return vec2(clamp(arms * 0.85 + throat, 0.0, 1.0), dark);
  }

  /* Cheap point-light specular. Used for the eye sockets: they are the only real
     light sources on the island and a proper reflection pass to show them would
     cost a whole extra scene render for two orange smears. */
  float glint(vec3 src, vec3 n, vec3 v, float power) {
    vec3 l = normalize(src - vWorld);
    vec3 h = normalize(l + v);
    float d = length(src - vWorld);
    return pow(max(dot(n, h), 0.0), power) / (1.0 + d * d * 0.00004);
  }

  void main() {
    vec3 v = normalize(uCameraPos - vWorld);

    /* Chop is strongest in the open and almost absent in the bay — the gold-leaf
       stillness of the arrival plate depends on the reflection NOT breaking up. */
    vec3 detail = chop(vWorld.xz, uTime, mix(2.6, 0.34, vShelter));
    vec3 n = normalize(mix(detail, vNormal, 0.55) + vNormal * 0.45);

    float fres = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 4.0);

    /* Body colour: deep water grading to shallow over the bay floor. */
    vec3 col = mix(uShallow, uDeep, smoothstep(0.05, 0.6, vDepth));

    /* Sky term. Out at sea this is nearly all the colour there is, and it is a
       bruised violet rather than a blue — the storm is lit from inside. */
    col = mix(col, uSkyLow, fres * 0.72);

    /* The island's light on the water. Two contributions:
         - a broad wash of gold that grows as the bay encloses the water, which
           is the lantern light of the port bouncing off a flat surface
         - two tight specular lobes for the eye sockets, which is what actually
           sells the skull as a light source rather than a painted backdrop */
    float wash = vBay * (0.35 + 0.65 * (1.0 - vDepth));
    col = mix(col, uGilt, wash * 0.55);

    /* Gated almost entirely by BAY shelter: the sockets are point sources on
       the island's south face, and an ungated falloff let their specular
       smear reach the rear cove — warm light arriving through a mountain. */
    float eyes = glint(uEyeA, n, v, 220.0) + glint(uEyeB, n, v, 220.0);
    col += uEmber * eyes * 22.0 * (0.05 + vBay);

    /* THE MOONPATH.
     *
     * The one thing this water was missing. Everything lighting it was a POINT
     * source on the island — the sockets, the port's lanterns — so the further
     * out to sea you sailed the less there was to see, and at two kilometres
     * the ocean was a flat dark field with a ship-shaped hole in it. The moon
     * is a DIRECTIONAL source, so its specular is a path that runs to the
     * horizon and never falls off, which is exactly the cue that makes open
     * water read as a surface rather than as a void.
     *
     * Two lobes, because a real moonpath is not one highlight: a tight one for
     * the glitter on individual facets and a broad one for the sheen down the
     * whole track. Killed inside the bay, where the ring's own walls put the
     * water in shadow and the gold is supposed to own it. */
    vec3 hM = normalize(uMoonDir + v);
    float tight = pow(max(dot(n, hM), 0.0), 420.0);
    float broad = pow(max(dot(n, hM), 0.0), 26.0);
    /* The broad lobe is deliberately WEAK. At the first gain the lit faces of
       every swell came up near-white and the storm sea turned into a field of
       ice floes — legible, and no longer this scene. The tight glitter does the
       work of saying "there is a surface here"; the broad sheen only has to
       keep the moonpath from being a line of disconnected sparks. */
    col += uMoonCol * (tight * 2.8 + broad * 0.13) * (1.0 - vBay * 0.82);
    /* And a whisper of sky on the upward flanks, so a wave has a lit side and a
       dark side even where the moonpath does not reach. */
    col += uSkyLow * max(n.y, 0.0) * 0.055 * (1.0 - vShelter * 0.6);

    /* Foam. Two kinds, and they behave differently:
         crest foam — on the tops of steep swells, only in the open sea. Hard
           threshold, because the reference waves have flat white caps with an
           ink outline, not a soft gradient.
         shore foam — a band that hugs the coastline wherever the water is
           shallow, animated so it breathes in and out rather than sitting as a
           static ring. This is the term that makes the headlands read as rock
           standing in surf.

       Both are written as one-minus-smoothstep(lo, hi, x) rather than the
       tempting smoothstep(hi, lo, x). GLSL leaves smoothstep UNDEFINED when
       edge0 >= edge1 — most drivers happen to produce the reversed ramp, but not
       all, and one that does not returns 1.0 everywhere. That is exactly how
       this shader first rendered: an entire ocean of solid shore foam. */
    float crest = smoothstep(0.58, 0.92, vCrest) * (1.0 - vShelter * 0.85);
    float breathe = 0.5 + 0.5 * sin(uTime * 0.9 + vWorld.x * 0.02 + vWorld.z * 0.017);
    float shore = (1.0 - smoothstep(0.0, 0.13, vDepth)) * (0.45 + 0.55 * breathe);
    float foam = clamp(crest + shore * 0.9, 0.0, 1.0);

    /* The maelstroms. Ink first — the water falls away into the throat — then
       their foam joins the common mix so it tone-maps like all other foam. */
    vec2 wm = vec2(0.0);
${Zr()}
    col = mix(col, uDeep * 0.30, clamp(wm.y, 0.0, 1.0) * 0.85);
    foam = clamp(foam + wm.x, 0.0, 1.0);
    col = mix(col, uFoam, foam * 0.92);

    /* Seen from BELOW — the submarine's view. The gilt wash, the glints and
       the sky term are all surface-side phenomena, so this overrides the lot.
       Three things build the underside, in order of how much they matter:

         SNELL'S WINDOW. From under water the entire sky arrives through a
         cone about 96° wide directly overhead, and outside that cone the
         surface is a mirror of the dark water below. It is the single most
         recognisable thing about being underwater, it is what tells the
         player which way is up without a horizon, and it costs one dot
         product. The view vector v runs from the fragment to the camera, so
         under the surface it points DOWN — the term is -v.y, not +v.y, and
         getting that backwards lights the horizon and blacks out the
         ceiling.

         THE RIPPLE. The window's edge crawls as the swell passes over it.
         Without it the window is a painted disc.

         DEPTH. Sixty metres down the window is nearly gone, which is what
         makes coming back up feel like coming back up. */
    if (!gl_FrontFacing) {
      float up = clamp(-v.y, 0.0, 1.0);
      float ripple = 0.72 + 0.28 * sin(vWorld.x * 0.11 + uTime * 1.9) * sin(vWorld.z * 0.13 - uTime * 1.6);
      float window = smoothstep(0.42, 0.95, up) * ripple;
      col = mix(uUnderDeep, uUnderGlow, clamp(foam * 0.7 + window * 0.9, 0.0, 1.0)) * ripple;
      /* The light that reaches this depth at all. Not a fog term — fog is
         applied below and handles distance; this is how much there is to
         see in the first place. */
      col *= mix(1.0, 0.22, uDepthFade);
    }

    /* Lightning. A flat additive term rather than a light, because a real light
       that switches on would recompile every material in the scene — the same
       trap the Elbaf valley hit. See fx/Storm.jsx. */
    col += uFlashColor * uFlash * (0.16 + fres * 0.5 + foam * 0.4);

    /* Fog, applied here rather than by three's fog chunk because this is a raw
       ShaderMaterial. Exp2 to match the rest of the scene. */
    float d = length(uCameraPos - vWorld);
    float f = 1.0 - exp(-pow(d * uFogDensity, 2.0));
    col = mix(col, uFogColor, clamp(f, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function ti(e,o){const n=new Uint8Array(e*e*4);for(let r=0;r<e;r++)for(let i=0;i<e;i++){const l=pe.x+((i+.5)/e-.5)*o,h=pe.z+((r+.5)/e-.5)*o,c=re(l,h),d=R.clamp(-c/46,0,1),b=(r*e+i)*4;n[b]=Math.round(d*255),n[b+1]=n[b],n[b+2]=n[b],n[b+3]=255}const s=new Mr(n,e,e,jr);return s.minFilter=fs,s.magFilter=fs,s.wrapS=ms,s.wrapT=ms,s.needsUpdate=!0,s}const Zo={low:112,mid:190,high:286},En=6400;function oi(e){const o=w.useRef(),n=En/(Zo[e]??Zo.high);return se(s=>{const r=o.current;r&&(r.position.x=Math.round((s.camera.position.x-pe.x)/n)*n,r.position.z=Math.round((s.camera.position.z-pe.z)/n)*n)}),o}function ni({quality:e="high",storm:o}){const n=w.useRef(),s=oi(e),{geometry:r,uniforms:i,landTex:l,vert:h,frag:c}=w.useMemo(()=>{const d=Zo[e]??Zo.high,b=new $n(En,En,d,d);b.rotateX(-Math.PI/2),b.translate(pe.x,0,pe.z);const g=Uo*1.05,m=ti(e==="low"?160:256,g),f={uTime:{value:0},uLand:{value:m},uSpan:{value:g},uCentre:{value:new Kn(pe.x,pe.z)},uDeep:{value:new S(...ie(X.seaDeep))},uShallow:{value:new S(...ie(X.seaShallow))},uFoam:{value:new S(...ie(X.foam))},uSkyLow:{value:new S(...ie(X.skyLow))},uGilt:{value:new S(...ie(T.gilt))},uEmber:{value:new S(...ie(T.ember))},uFogColor:{value:new S(...ie(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new S(...ie(X.abyss))},uUnderGlow:{value:new S(...ie(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:si.clone()},uMoonCol:{value:new S(...ie(ai))},uEyeA:{value:new S(Ie[0].x,Ie[0].y,Ie[0].z)},uEyeB:{value:new S(Ie[1].x,Ie[1].y,Ie[1].z)},uFlash:{value:0},uFlashColor:{value:new S(...ie(X.boltGlow))},uCameraPos:{value:new S}};return{geometry:b,uniforms:f,landTex:m,vert:Jr(),frag:ei()}},[e]);return se((d,b)=>{const g=n.current?.uniforms;if(!g)return;g.uTime.value+=b,g.uCameraPos.value.copy(d.camera.position),g.uFlash.value=o?.flash??0,g.uFogDensity.value=o?.fog??.0011;const m=Math.min(1,Math.max(0,(o?.depthBelow??0)/Gt.deepGrade));g.uDepthFade.value=m,xs.copy(ii).lerp(li,m*.8),g.uFogColor.value.lerpVectors(ri,xs,o?.underwater??0)}),t.jsx("mesh",{ref:s,geometry:r,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:c,uniforms:i,transparent:!1,side:_e},l.uuid)})}const si=new S(...$o.dir).normalize(),ai=$o.col,ri=new S(...ie(X.haze)),ii=new S(...ie(X.underHaze)),li=new S(...ie(X.abyss)),xs=new S;function ci({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const s=o,r=new $n(Uo,Uo,s,s);r.rotateX(-Math.PI/2);const i=r.attributes.position,l=i.count,h=new Float32Array(l*3),c=new Se(X.rock),d=new Se(X.rockLit),b=new Se("#0b0e18"),g=new Se(X.snow),m=new Se(T.rockWarm),f=new Se;for(let p=0;p<l;p++){const x=i.getX(p)+pe.x,u=i.getZ(p)+pe.z,v=re(x,u);i.setX(p,x),i.setY(p,v),i.setZ(p,u);const z=qn(x,u,Uo/s)[1],E=Math.max(0,(z-.55)/.45);f.copy(c).lerp(d,R.clamp(v/190,0,1));const j=1-R.clamp((v-_r)/13,0,1);f.lerp(b,j*.85);const I=R.clamp((x-pe.x)/260,0,1),a=96-I*42,k=R.clamp((v-a)/60,0,1)*E;f.lerp(g,k*(.45+I*.5));const L=Math.hypot(x-P.x,u-P.z),A=Math.exp(-Math.pow(L/330,2)),M=R.clamp((u-P.z)/260,0,1);f.lerp(m,A*M*.6*(1-k)),h[p*3]=f.r,h[p*3+1]=f.g,h[p*3+2]=f.b}return r.setAttribute("color",new ne(h,3)),r.computeVertexNormals(),r.computeBoundingSphere(),r},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const Jn=-30,es=330,hi=150,fe={x:he.x,y:he.y-40,z:he.z-hi-(Jn+es)},Fe={centre:[0,96,Jn],radii:[350,235,es]},Tt={x:fe.x+Fe.centre[0],y:fe.y+Fe.centre[1],z:fe.z+Fe.centre[2]};function ui(e,o,n){const s=(e-Tt.x)/Fe.radii[0],r=(o-Tt.y)/Fe.radii[1],i=(n-Tt.z)/Fe.radii[2];return Math.sqrt(s*s+r*r+i*i)}function Rn(e,o=.06){const n=(e.x-Tt.x)/Fe.radii[0],s=(e.y-Tt.y)/Fe.radii[1],r=(e.z-Tt.z)/Fe.radii[2],i=Math.sqrt(n*n+s*s+r*r),l=1+o;if(i>=l)return null;const h=i<1e-4?0:l/i;return e.x=Tt.x+(h?n*h:0)*Fe.radii[0],e.y=Tt.y+(h?s*h:l)*Fe.radii[1],e.z=Tt.z+(h?r*h:0)*Fe.radii[2],e}const le={y:0,halfX:290,zFront:228,zBack:-240},De={y:40,z:Jn+es-40,halfX:96,depth:120},dt={zTop:De.z-54,zBottom:140,halfX:74,steps:16},N={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},Re={y:74,z:N.z+N.halfZ+26,halfX:96,depth:40},Ft=Re.y+3.5,qe={y:-95,halfX:220,halfZ:175,ceiling:-34},Te={x:0,z:84,halfX:52,halfZ:40},ye={y:52,halfZ:205,x:252,tiers:3,tierRise:46},Eo=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],ge={x:74,halfW:14,zFoot:N.z+N.halfZ+158,zTop:Re.z+Re.depth/2-6},Na=[{kind:"rampZ",x0:-74-ge.halfW,x1:-74+ge.halfW,z0:ge.zFoot,z1:ge.zTop,y0:0,y1:Ft},{kind:"rampZ",x0:ge.x-ge.halfW,x1:ge.x+ge.halfW,z0:ge.zFoot,z1:ge.zTop,y0:0,y1:Ft},{kind:"flat",x0:-96,x1:Re.halfX,z0:Re.z-Re.depth/2-2,z1:ge.zTop,y:Ft},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:ye.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:ye.y-.5},{kind:"flat",x0:ye.x-38,x1:ye.x+38,z0:-225,z1:ye.halfZ+20,y:ye.y-.5}],di=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Ha=(()=>{const e=[],o=[],n=[],s=N.halfX+6,r=[s,s+9],i=[s+11,s+20],l=[s,s+20],h=[-212,-200],c=[-264,-252],d=[Ft];for(let g=2;g<=N.storeys;g++)d.push(N.plinth+g*N.storey+1.5);e.push({kind:"flat",x0:Re.halfX-6,x1:s+20,z0:-212,z1:-196,y:Ft}),o.push([(Re.halfX-6+s+20)/2,Ft,-204,s+26-Re.halfX,16]);for(let g=0;g<d.length-1;g++){const m=d[g],f=d[g+1],p=(m+f)/2;e.push({kind:"rampZ",x0:r[0],x1:r[1],z0:h[0],z1:c[1],y0:m,y1:p}),n.push({x0:r[0],x1:r[1],z0:h[0],z1:c[1],y0:m,y1:p}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:c[0],z1:c[1],y:p}),o.push([(l[0]+l[1])/2,p,(c[0]+c[1])/2,l[1]-l[0],c[1]-c[0]]),e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),n.push({x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:h[0],z1:h[1],y:f}),o.push([(l[0]+l[1])/2,f,(h[0]+h[1])/2,l[1]-l[0],h[1]-h[0]])}for(let g=1;g<d.length-1;g++){const f=1-Math.min(N.storeys,g+2)*N.taper,p=N.halfX*f,x=N.z+N.halfZ*f,u=d[g];e.push({kind:"flat",x0:p-4,x1:s,z0:-224,z1:-212,y:u}),o.push([(p-4+s)/2,u,-218,s-p+4,12]),e.push({kind:"flat",x0:-p-6,x1:p+6,z0:x,z1:-212,y:u}),o.push([0,u,(x-212)/2,p*2+12,-212-x])}const b=d[d.length-1];return e.push({kind:"flat",x0:58,x1:s,z0:-248,z1:-212,y:b}),o.push([(s+58)/2,b,-230,s-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[s,s+20],z:[c[0],h[1]]}}})();Na.push(...Ha.walks);const pi=1.1;function fi(e,o,n=1/0){const s=n+pi;let r=-1/0;for(const i of Na){if(e<i.x0||e>i.x1)continue;const l=Math.min(i.z0,i.z1),h=Math.max(i.z0,i.z1);if(o<l||o>h)continue;const c=i.kind==="flat"?i.y:i.y0+(i.y1-i.y0)*di((o-i.z0)/(i.z1-i.z0));c<=s&&c>r&&(r=c)}return r===-1/0?0:Math.max(0,r)}function mi(e,o,n=1/0){const s=o>dt.zTop?De.y:o>dt.zBottom?De.y*(o-dt.zBottom)/(dt.zTop-dt.zBottom):0,r=fi(e,o,n);return Math.max(s,r)}function gi(e,o,n){const s=N.plinth+N.storeys*N.storey;if(n>s)return!1;const i=1-(n<=N.plinth?0:Math.min(N.storeys,Math.ceil((n-N.plinth)/N.storey)))*N.taper;return Math.abs(e)<N.halfX*i&&Math.abs(o-N.z)<N.halfZ*i}const y={t:0,flash:0,flashDir:new S(0,.4,-1),fog:Gt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new S(0,0,0),helmActive:!1,helmPos:new S(0,0,0),helmSpeed:0,ship:{x:0,y:0,z:0,heading:Math.PI,loa:64,deckY:8.3,mastY:42},subThrottle:0,vessel:"sunny",footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new S(0,60,-200)}};function xi(){y.t=0,y.progress=0,y.flash=0,y.fog=Gt.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const hn=new Map;let _a=!0;function bi(e){_a=!!e}function wi(e){const o=vo(e);return hn.has(o)||hn.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),hn.get(o)}function ot(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let s=!0;return wi(e).then(r=>{s&&n(r&&_a)}),()=>{s=!1}},[e]),o}const Et=wo.map(e=>new S(...e).normalize()),Ba=new S(...Xn).normalize(),An=new S(...Qn).normalize();function yi(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const c of Et){const d=e.dot(c),b=Math.pow(Math.max(0,d),46);o-=b*.3}const s=Math.max(0,e.dot(Ba)),r=Math.pow(s,150)*(1-Math.max(0,e.y)*.5);o-=r*.19;for(const c of Et){const d=new S(c.x*1.5,c.y-.55,c.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,d),26)*.075}const i=Math.max(0,e.dot(An));o-=Math.pow(i,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const l=Math.pow(Math.max(0,e.dot(Et[0])),30)+Math.pow(Math.max(0,e.dot(Et[1])),30),h=1-Math.min(1,l);return o+=(to(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(to(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const vi=178*1.9,et=P.r/vi;function bs(e,o){const n=e*et,s=[new S(n*74,96*et,-20*et),new S(n*142,176*et,-58*et),new S(n*196,268*et,-76*et),new S(n*222,356*et,-52*et),new S(n*206,424*et,8*et),new S(n*154,462*et,72*et)],r=new S;for(const b of s)r.set(P.x+b.x,P.baseY+b.y,P.z+b.z),Rn(r,.12)&&b.set(r.x-P.x,r.y-P.baseY,r.z-P.z);const i=new so(s),l=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,c=new ao(i,l,1,h,!1),d=c.attributes.position;for(let b=0;b<=l;b++){const g=b/l,m=34*et*Math.pow(1-g,.72)*(1+Math.sin(g*Math.PI)*.16),f=i.getPoint(g);for(let p=0;p<=h;p++){const x=b*(h+1)+p;if(x>=d.count)continue;const u=d.getX(x)-f.x,v=d.getY(x)-f.y,z=d.getZ(x)-f.z;d.setXYZ(x,f.x+u*m,f.y+v*m,f.z+z*m)}}return d.needsUpdate=!0,c.computeVertexNormals(),c}const Mi={low:4,mid:6,high:7},Ua="skull-island.opt.glb",uo={height:1,yaw:0,lift:.02},un=new zr,ws=new S,Ro=new S;function ji(e,o,n){Ro.set(o[0],o[1],o[2]).normalize(),ws.copy(Ro).multiplyScalar(P.r*4),un.set(ws,Ro.clone().negate()),un.far=P.r*8;const s=un.intersectObject(e,!0)[0];return s?s.point.clone().addScaledVector(Ro,-n):null}function ki({shadows:e}){const{scene:o}=La(vo(Ua)),{object:n,eyes:s,nose:r,mouth:i}=w.useMemo(()=>{const l=o.clone(!0),h=new Fa().setFromObject(l),c=new S,d=new S;h.getSize(c),h.getCenter(d);const b=P.r*P.squash[1]*1.62,g=c.y>1e-4?b*uo.height/c.y:1,m=P.r*P.squash[1]*uo.lift;l.scale.setScalar(g),l.rotation.set(0,uo.yaw,0),l.position.set(0,-d.y*g+m,0);const f=d.x*g,p=d.z*g,x=Math.cos(uo.yaw),u=Math.sin(uo.yaw);l.position.x=-(f*x+p*u),l.position.z=-(-f*u+p*x),l.updateMatrixWorld(!0);let v=0,z=0;const E={x:0,y:0,z:0},j=new S,I=[];l.traverse(F=>{F.isMesh&&I.push(F)});for(const F of I){const O=F.geometry.clone();for(const D of["position","normal"]){const $=O.attributes[D];if(!$||$.array instanceof Float32Array)continue;const Q=new Float32Array($.count*3);for(let ae=0;ae<$.count;ae++)j.fromBufferAttribute($,ae),Q[ae*3]=j.x,Q[ae*3+1]=j.y,Q[ae*3+2]=j.z;O.setAttribute(D,new ne(Q,3))}O.applyMatrix4(F.matrixWorld);const oe=O.attributes.position;z+=oe.count;for(let D=0;D<oe.count;D++)E.x=oe.getX(D)+P.x,E.y=oe.getY(D)+P.baseY,E.z=oe.getZ(D)+P.z,Rn(E,.05)&&(oe.setXYZ(D,E.x-P.x,E.y-P.baseY,E.z-P.z),v++);v&&O.computeVertexNormals(),oe.needsUpdate=!0,O.computeBoundingSphere(),O.computeBoundingBox(),F.geometry=O,F.castShadow=e,F.receiveShadow=!1;const ue=Array.isArray(F.material)?F.material:[F.material];for(const D of ue)D.color?.multiply(Si),D.roughness=.94,D.metalness=.02}for(const F of[l,...I])F.position.set(0,0,0),F.quaternion.identity(),F.scale.set(1,1,1),F.updateMatrix();l.updateMatrixWorld(!0);const a=(F,O=1)=>{const[oe,ue,D]=P.squash;return new S(F[0]*P.r*oe*O,F[1]*P.r*ue*O,F[2]*P.r*D*O)},k=wo.map(F=>ji(l,F,P.r*.1)??a(F,.82)),L=new S().addVectors(k[0],k[1]).multiplyScalar(.5),A=new S().addVectors(a(wo[0],.82),a(wo[1],.82)).multiplyScalar(.5),M=L.clone().sub(A),G=F=>{const O={x:F.x+P.x,y:F.y+P.baseY,z:F.z+P.z};return Rn(O,.22)&&F.set(O.x-P.x,O.y-P.baseY,O.z-P.z),F};return{object:l,eyes:k.map(G),nose:G(a(Xn,.87).add(M)),mouth:G(a(Qn,.9).add(M))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Wa,{eyes:s,nose:r,mouth:i,teeth:null,cast:e})]})}const Si=new Se("#8f8a84");function Wa({eyes:e,nose:o,mouth:n,teeth:s,cast:r}){const i=w.useRef(),l=w.useRef(),h=w.useRef();return se(()=>{const c=y.t,d=.82+.18*Math.sin(c*2.3)*Math.sin(c*.71),b=.82+.18*Math.sin(c*1.9+2.1)*Math.sin(c*.63),g=.86+.14*Math.sin(c*1.4+.8);i.current&&(i.current.emissiveIntensity=5.2*d+y.flash*2),l.current&&(l.current.emissiveIntensity=5.2*b+y.flash*2),h.current&&(h.current.emissiveIntensity=3.4*g)}),t.jsxs(t.Fragment,{children:[e.map((c,d)=>t.jsxs("mesh",{position:c,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[P.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:d===0?i:l,color:T.furnace,emissive:T.ember,emissiveIntensity:5.2,toneMapped:!1,side:_e,roughness:1})]},d)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[P.r*.046,P.r*.083,3]}),t.jsx("meshStandardMaterial",{color:T.emberDeep,emissive:T.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,P.r*.05,-P.r*.16],children:[t.jsx("planeGeometry",{args:[P.r*.62,P.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:T.ember,emissive:T.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:_e})]}),s?.map((c,d)=>t.jsxs("mesh",{position:c.pos,scale:c.scale,rotation:[0,0,c.rot],castShadow:r,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:T.emberDeep,emissiveIntensity:.42,roughness:.78})]},d))]})]})}const zi=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function Ti({quality:e="high",shadows:o=!0}){const s=ot(Ua)&&e!=="low"&&zi!=="proc",{dome:r,hornL:i,hornR:l,teeth:h}=w.useMemo(()=>{const f=new kr(P.r,Mi[e]??7),p=f.attributes.position,x=new Float32Array(p.count*3),u=new Se(X.rock),v=new Se(T.rockWarm),z=new Se("#120b10"),E=new Se,j=new S;for(let L=0;L<p.count;L++){j.set(p.getX(L),p.getY(L),p.getZ(L)).normalize();const A=P.r*yi(j),[M,G,F]=P.squash;p.setXYZ(L,j.x*A*M,j.y*A*G,j.z*A*F);const O=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),5),Math.pow(Math.max(0,j.dot(Et[1])),5),Math.pow(Math.max(0,j.dot(An)),6)*.9);E.copy(u).lerp(v,Math.min(1,O*1.5+Math.max(0,j.z)*.22));const oe=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),40),Math.pow(Math.max(0,j.dot(Et[1])),40));E.lerp(z,oe),x[L*3]=E.r,x[L*3+1]=E.g,x[L*3+2]=E.b}f.setAttribute("color",new ne(x,3)),f.computeVertexNormals();const I=new Sr(1,1,1),a=[],k=9;for(let L=0;L<k;L++){const A=L/(k-1)*2-1,M=he.halfWidth*2.1,G=A*M*.5,F=Math.pow(Math.abs(A),1.7)*14,O=46-Math.abs(A)*13+L%2*7;a.push({pos:[G,he.height*.5-F-O*.5,6],scale:[M/k*.76,O,52],rot:A*.13})}return I.dispose?.(),{dome:f,hornL:bs(-1,e),hornR:bs(1,e),teeth:a}},[e]),c=o,[d,b,g]=P.squash,m=(f,p)=>[f.x*P.r*d*p,f.y*P.r*b*p,f.z*P.r*g*p];return t.jsx("group",{position:[P.x,P.baseY,P.z],children:s?t.jsx(w.Suspense,{fallback:t.jsx(ys,{dome:r,hornL:i,hornR:l,cast:c}),children:t.jsx(ki,{shadows:c})}):t.jsxs(t.Fragment,{children:[t.jsx(ys,{dome:r,hornL:i,hornR:l,cast:c}),t.jsx(Wa,{eyes:Et.map(f=>m(f,.82)),nose:m(Ba,.87),mouth:m(An,.96),teeth:h,cast:c})]})})}function ys({dome:e,hornL:o,hornR:n,cast:s}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:s,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function bt({matrices:e,target:o}){const n=w.useRef(!1);return se(()=>{if(n.current||!o.current)return;const s=Math.min(e.length,o.current.count);for(let r=0;r<s;r++)o.current.setMatrixAt(r,e[r]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const $t=190,Mt=130,Ao=9.5;function vs(e,o,n,s=24){const r=new so(e),i=new ao(r,s,1,4,!1),l=i.attributes.position,h=new S(0,1,0),c=new S,d=new S,b=new S,g=new S,m=new S;for(let f=0;f<=s;f++){const p=f/s;r.getPointAt(p,d),r.getTangentAt(p,c),g.crossVectors(c,h).normalize(),b.crossVectors(g,c).normalize();for(let x=0;x<=4;x++){const u=f*5+x;if(u>=l.count)continue;const v=x/4*Math.PI*2+Math.PI/4,z=Math.cos(v)*o*.7071,E=Math.sin(v)*n*.7071;m.copy(d).addScaledVector(g,z).addScaledVector(b,E),l.setXYZ(u,m.x,m.y,m.z)}}return l.needsUpdate=!0,i.computeVertexNormals(),i}function Ei(e,o,n,s=40){const r=[];for(let c=0;c<=10;c++){const d=c/10*2-1;r.push(new S(d*e,-30*(1-d*d),0))}const i=new so(r),l=new ao(i,s,n,8,!1),h=l.attributes.position;for(let c=0;c<=s;c++){const d=c/s*2-1,b=1+(1-d*d)*.85,g=i.getPointAt(c/s);for(let m=0;m<=8;m++){const f=c*9+m;f>=h.count||h.setXYZ(f,g.x+(h.getX(f)-g.x)*b,g.y+(h.getY(f)-g.y)*b,g.z+(h.getZ(f)-g.z)*b)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Ms({quality:e="high",shadows:o=!0,z:n=Ot,k:s=_}){const r=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useMemo(()=>{const x=$t/2,u=Mt,v=vs([new S(-x-40,u+6,0),new S(-x-22,u+15.5,0),new S(0,u+20,0),new S(x+22,u+15.5,0),new S(x+40,u+6,0)],16,9,30),z=vs([new S(-x-30,u+2,0),new S(0,u+8,0),new S(x+30,u+2,0)],11,5,18);return{kasagi:v,shimaki:z,rope:Ei(x-6,30,6.4,44)}},[]),{tileM:d,merlonM:b,cannonM:g,lanternM:m}=w.useMemo(()=>{const x=new at,u=new yt,v=new S,z=new S,E=[],j=e==="low"?26:54;for(let A=0;A<j;A++){const M=A/(j-1)*2-1,G=M*($t/2+40),F=Mt+20-Math.pow(Math.abs(M),1.9)*14+5,O=-Math.sign(M)*Math.pow(Math.abs(M),3)*.5;z.set(G,F,0),u.setFromEuler(new Bt(0,0,O)),v.set(1,1,1),E.push(x.clone().compose(z,u,v))}const I=[];for(const A of[-1,1])for(let M=0;M<7;M++)z.set(A*(58+M*12),26,0),u.identity(),v.set(1,1,1),I.push(x.clone().compose(z,u,v));const a=[];for(const A of[-1,1])for(let M=0;M<2;M++)for(let G=0;G<4-M;G++)z.set(A*(64+G*13+M*6),32+M*10,8),u.setFromEuler(new Bt(Math.PI/2-.16,0,0)),v.set(1,1,1),a.push(x.clone().compose(z,u,v));const k=[],L=e==="low"?10:22;for(let A=0;A<L;A++){const M=A/(L-1)*2-1,G=M*($t/2-12),F=30*(1-M*M);z.set(G,Mt-34-F-7.5,0),u.identity(),v.set(1,1,1),k.push(x.clone().compose(z,u,v))}return{tileM:E,merlonM:I,cannonM:a,lanternM:k}},[e]);se(()=>{const x=y.t;r.current&&(r.current.material.emissiveIntensity=2.6+Math.sin(x*3.1)*.22+Math.sin(x*7.7)*.1+y.flash*1.4)});const f=$t/2,p=o;return t.jsxs("group",{position:[0,0,n],scale:s,children:[[-1,1].map(x=>t.jsxs("group",{position:[x*f,0,0],children:[t.jsxs("mesh",{position:[0,Mt/2-30,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ao*.86,Ao,Mt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ao*1.5,Ao*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},x)),t.jsxs("mesh",{position:[0,Mt-26,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[$t+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:c.shimaki,castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:c.kasagi,castShadow:p,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(bt,{matrices:d,target:i})]}),t.jsxs("mesh",{position:[0,Mt-6,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,Mt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:c.rope,position:[0,Mt-34,2],castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(x=>{const u=30*(1-(x/($t/2-6))**2);return t.jsx("group",{position:[x,Mt-34-u-4,2],children:[0,1,2].map(v=>t.jsxs("mesh",{position:[v%2?1.1:-1.1,-2.4-v*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:_e})]},v))},x)}),[-1,1].map(x=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[x*108,6,0],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[x*108,30,6],castShadow:p,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.88})]}),t.jsxs("mesh",{position:[x*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},x)),t.jsxs("instancedMesh",{ref:h,args:[null,null,b.length],castShadow:p,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(bt,{matrices:b,target:h})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,g.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(bt,{matrices:g,target:l})]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,m.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(bt,{matrices:m,target:r})]})]})}const Ri=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.12,"rgba(255,255,255,0.55)"),s.addColorStop(.4,"rgba(255,255,255,0.06)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let i=0;i<4;i++){const l=n.createLinearGradient(0,0,e/2,0);l.addColorStop(0,"rgba(255,255,255,0.95)"),l.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=l,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const r=new ro(o);return r.colorSpace=io,r})();function Ai(e,o,n,s){const r=[];for(let i=0;i<=s;i++){const l=i/s,h=l*2-1;r.push(new S(e[0]+(o[0]-e[0])*l,e[1]+(o[1]-e[1])*l-n*(1-h*h),e[2]+(o[2]-e[2])*l))}return r}const Ii=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Ci({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useRef(),i=w.useRef(),{lanternM:l,lampM:h,pilingM:c,katanaY:d,ground:b}=w.useMemo(()=>{const f=new at,p=new yt,x=new S(1,1,1),u=new S,v=[],z=e==="low"?.42:e==="mid"?.72:1;for(const[a,k,L]of Ii){const A=Math.max(4,Math.round(L*z)),M=Ai(a,k,14,A);for(let G=1;G<M.length-1;G++){const F=.78+G*37%11/22;u.copy(M[G]).add(new S(0,-4.2*F,0)),p.setFromEuler(new Bt(0,G*1.7%Math.PI,(G%3-1)*.06)),v.push(f.clone().compose(u,p,x.clone().multiplyScalar(F)))}}const E=[],j=e==="low"?6:11;for(let a=0;a<j;a++){const k=a/(j-1);for(const L of[-1,1]){const A=R.lerp(K.x+46,he.x-6,k)+L*(26-k*9),M=R.lerp(K.z-26,he.z+32,k);u.set(A,re(A,M)+5,M),p.identity(),E.push(f.clone().compose(u,p,x))}}const I=[];for(let a=0;a<16;a++){const k=a%2,L=Math.floor(a/2);u.set(K.x+30+L*17,-2,K.z+34+k*26),p.setFromEuler(new Bt(0,0,(a%3-1)*.035)),I.push(f.clone().compose(u,p,x))}return{lanternM:v,lampM:E,pilingM:I,katanaY:re(K.x+118,K.z-58),ground:K.y}},[e]);se(()=>{const f=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(f*2.7)*.2+Math.sin(f*6.1+1.3)*.12+y.flash*1.6),i.current){const p=46*(1+Math.sin(f*1.3)*.13);i.current.scale.set(p,p,1),i.current.material.rotation=f*.07}});const g=o,m=(f,p)=>re(K.x+f,K.z+p);return t.jsxs("group",{children:[t.jsxs("group",{position:[K.x,0,K.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(f=>t.jsxs("group",{position:[52+f*26,1.5,92+f%2*13],rotation:[0,.4+f*.3,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:_e})]})]},f))]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,c.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(bt,{matrices:c,target:r})]}),t.jsxs("group",{position:[K.x+118,d,K.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:g,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:i,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:Ri,color:T.furnace,transparent:!0,opacity:.75,blending:pt,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(f=>{const p=96+f*4,x=88*f;return t.jsxs("group",{position:[K.x+p,m(p,x),K.z+x],rotation:[0,-f*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:g,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:g,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*3,37,4],rotation:[0,0,u*.3],castShadow:g,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},u)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.9,side:_e})]})]},f)}),[-1,1].map(f=>{const p=40+f*34,x=-18+f*46;return t.jsxs("group",{position:[K.x+p,m(p,x)+12,K.z+x],rotation:[0,f*.8,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*5,7,-1],rotation:[0,0,u*-.5],castShadow:g,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},u)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:T.ember,emissive:T.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:_e})]})]},f)}),t.jsxs("group",{position:[K.x-34,m(-34,30)+2,K.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.88,side:_e,emissive:T.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(x)*26,55.5,Math.sin(x)*26],rotation:[0,-x,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},p)}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(x)*32,44,Math.sin(x)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.5,toneMapped:!1})]},p)})]}),[0,1,2,3].map(f=>{const p=8+f*30,x=-70-f%2*14;return t.jsxs("group",{position:[K.x+p,m(p,x),K.z+x],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:f%2?"#e8dcc4":T.vermilion,roughness:.95,side:_e})]})]},f)}),[0,1,2].map(f=>{const p=.28+f*.24,x=R.lerp(K.x+46,he.x,p),u=R.lerp(K.z-26,he.z+26,p),v=re(x,u),z=1-f*.1;return t.jsxs("group",{position:[x,v,u],scale:z,children:[[-1,1].map(E=>t.jsxs("mesh",{position:[E*15,17,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},E)),t.jsxs("mesh",{position:[0,36,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.75})]})]},f)}),t.jsx("group",{position:[K.x,b,K.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(bt,{matrices:l,target:n})]})}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:g,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:T.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(bt,{matrices:h,target:s})]})]})}const js={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function Li(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Fi({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useRef(),i=w.useRef(),{pineTrunkM:l,pineCanopyM:h,sakuraM:c,rockM:d}=w.useMemo(()=>{const g=js[e]??js.high,m=Li(20250801),f=new at,p=new yt,x=new S,u=new S,v=new S(0,1,0),z=new S,E=[],j=[],I=[],a=g.pine+g.sakura+g.rock;let k=0,L=0;for(;k<a&&L<a*60;){L++;const A=m()*Math.PI*2,M=wt*(.55+m()*.62),G=pe.x+Math.sin(A)*M,F=pe.z+Math.cos(A)*M,O=re(G,F);if(O<5||O>300||Yr(G,F,6)>.72||Math.hypot(G-P.x,F-P.z)<P.r*1.35)continue;const oe=G>pe.x+(m()-.5)*90,ue=k;if(k++,u.set(G,O,F),ue<g.rock){const D=qn(G,F,5);z.set(D[0],D[1],D[2]),p.setFromUnitVectors(v,z),p.multiply(new yt().setFromEuler(new Bt(m()*.5,m()*6.28,m()*.5)));const $=2.5+m()*7;x.set($*(.7+m()*.6),$*(.5+m()*.5),$*(.7+m()*.6)),u.y-=$*.25,I.push(f.clone().compose(u,p,x))}else if(oe){if(E.length>=g.pine)continue;p.setFromEuler(new Bt(0,m()*6.28,(m()-.5)*.09));const D=.72+m()*.7;x.set(D,D*(.85+m()*.45),D),E.push(f.clone().compose(u,p,x))}else{if(j.length>=g.sakura)continue;p.setFromEuler(new Bt(0,m()*6.28,(m()-.5)*.13));const D=.7+m()*.75;x.set(D,D*(.8+m()*.5),D),j.push(f.clone().compose(u,p,x))}}return{pineTrunkM:E.map(A=>A.clone().multiply(Pi)).concat(j.map(A=>A.clone().multiply(Di))),pineCanopyM:E.map(A=>A.clone().multiply(Gi)),sakuraM:j.map(A=>A.clone().multiply(Oi)),rockM:I}},[e]),b=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],castShadow:b,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(bt,{matrices:l,target:n})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:b,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(bt,{matrices:h,target:s})]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,c.length],castShadow:b,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:T.sakura,roughness:.95,flatShading:!0,emissive:T.sakura,emissiveIntensity:.1}),t.jsx(bt,{matrices:c,target:r})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:b,receiveShadow:b,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(bt,{matrices:d,target:i})]})]})}const Pi=new at().makeTranslation(0,7,0),Gi=new at().makeTranslation(0,26,0),Oi=new at().compose(new S(0,13,0),new yt,new S(1,.72,1)),Di=new at().compose(new S(0,5,0),new yt,new S(.75,.62,.75)),zt=Math.PI,ks={"ship-sunny.opt.glb":zt/2,"ship-tang.opt.glb":zt/2,"ship-punk.opt.glb":zt/2,"ship-lion.opt.glb":zt/2,"ship-bone.opt.glb":zt/2,"ship-junk.opt.glb":zt/2,"ship-warjunk.opt.glb":zt/2,"ship-sub.opt.glb":-zt/2},an=e=>e&&ks[e]!==void 0?ks[e]:zt/2,Ni={"ship-sunny.opt.glb":40,"ship-lion.opt.glb":40,"ship-punk.opt.glb":52,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":50,"ship-junk.opt.glb":38,"ship-warjunk.opt.glb":60},co=1.6,Ss=Object.fromEntries(Object.entries(Ni).map(([e,o])=>[e,Math.round(o*co)])),zs={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},rn=2,Ts={"ship-sunny.opt.glb":.513,"ship-lion.opt.glb":.274,"ship-punk.opt.glb":.264,"ship-tang.opt.glb":.208,"ship-sub.opt.glb":.261,"ship-bone.opt.glb":.353,"ship-junk.opt.glb":.313,"ship-warjunk.opt.glb":.415},Es={"ship-sunny.opt.glb":1.044,"ship-lion.opt.glb":.824,"ship-punk.opt.glb":.673,"ship-tang.opt.glb":1,"ship-sub.opt.glb":.641,"ship-bone.opt.glb":.771,"ship-junk.opt.glb":.915,"ship-warjunk.opt.glb":.702},Rs={"ship-sunny.opt.glb":.165,"ship-lion.opt.glb":.095,"ship-punk.opt.glb":.115,"ship-bone.opt.glb":.105,"ship-junk.opt.glb":.1,"ship-warjunk.opt.glb":.115,"ship-tang.opt.glb":.035,"ship-sub.opt.glb":.035},As={"ship-sunny.opt.glb":.28,"ship-lion.opt.glb":.144,"ship-punk.opt.glb":.148,"ship-tang.opt.glb":.41,"ship-sub.opt.glb":.214,"ship-bone.opt.glb":.158,"ship-junk.opt.glb":.21,"ship-warjunk.opt.glb":.244},ts=(e,o)=>(e&&As[e]!==void 0?As[e]:.2)*o/2,Wo=[[0,.26,0],[-.55,.02,.7],[.55,-.08,-.9],[0,-.27,Math.PI*.85]],os=(e,o,[n,s])=>[n*ts(e,o),s*o],Ya=e=>e==="low"?Wo.slice(0,1):e==="mid"?Wo.slice(0,2):Wo,Hi=2.8,Va=Hi*co,jo=e=>Va*(.72+.28*(e/(40*co))),qo=.28*co,Jo=5.2*co,Is={"ship-sunny.opt.glb":"#e6ded0","ship-punk.opt.glb":"#c9bfae","ship-tang.opt.glb":"#ece3cd","ship-lion.opt.glb":"#9a9188","ship-sub.opt.glb":"#9a9188","ship-bone.opt.glb":"#9a9188"},ns=(e,o="#9a9188")=>e&&Is[e]!==void 0?Is[e]:o,_i={"ship-tang.opt.glb":["#e8c34a",.85],"ship-sub.opt.glb":["#e8c34a",.85],"ship-sunny.opt.glb":["#c9a06a",.2],"ship-punk.opt.glb":["#b06a5a",.2]},en=e=>e&&_i[e]||null,ln=(e,o=34)=>e&&Ss[e]!==void 0?Ss[e]:o,cn=e=>e&&zs[e]!==void 0?zs[e]:1,Bi=e=>e&&Ts[e]!==void 0?Ts[e]:.2,$a=e=>e&&Rs[e]!==void 0?Rs[e]:.13,zo=e=>Math.max(0,Bi(e)-$a(e)),At=(e,o)=>$a(e)*o,ko=(e,o)=>((e&&Es[e]!==void 0?Es[e]:.8)-zo(e))*o,Cs={sunny:{id:"sunny",name:"THOUSAND SUNNY",crewName:"STRAW HAT",hulls:["ship-sunny.opt.glb","ship-lion.opt.glb"],flag:"straw",crew:"crew-straw.opt.glb",fleetId:"straw-hats",tint:"#c98a52",burst:{push:62,charge:9,label:"BURST",sub:"coup de"},topSpeed:64,accel:16,turn:.92},punk:{id:"punk",name:"VICTORIA PUNK",crewName:"KID",hulls:["ship-punk.opt.glb","ship-bone.opt.glb"],flag:"kid",crew:"crew-punk.opt.glb",fleetId:"kid",tint:"#9a6a4e",burst:{push:78,charge:13,label:"RAM",sub:"full ahead"},topSpeed:60,accel:12,turn:.74}},In=e=>Cs[e]??Cs.sunny,Ka=210,Ls={off:1,lead:.98*co*.77},dn={SPREAD:28,SWEEP:14,RANK:118},Fs=(e,o=0,n=0)=>({off:(e+(n?.5*Math.sign(e||1):0))*dn.SPREAD,lead:o-Math.abs(e)*dn.SWEEP-n*dn.RANK}),Ps={kozuki:{side:-1,from:2},yakuza:{side:1,from:2},mink:{side:0,from:9}};function Ui(e){const o={},n={};for(const s of e){const r=Wi[s.id];if(r){Object.assign(s,Fs(r[0],r[1]));continue}const i=Ps[s.faction]?s.faction:"kozuki",l=Ps[i],h=s.rank??0,c=`${i}:${h}`;o[c]===void 0&&(o[c]=l.from,n[c]=-1);const d=l.side||n[c];Object.assign(s,Fs(d*o[c],0,h)),l.side===0?(n[c]>0&&(o[c]+=1),n[c]=-n[c]):o[c]+=1}}const Wi={scabbards:[0,Ka],"straw-hats":[-1,150],kid:[1,150],heart:[0,60]},Yi=430*_;function Vi(e,o=0){const n=(820+-670*e)*_+o;return[(Math.sin(e*2.4)*54-e*26)*_,n]}function $i(e,o,n,s){const[r,i]=Vi(n,s);return[r+o*_*Ls.off,i-e*_*Ls.lead]}const Ki=[{x:-300*_,z:100*_,yaw:.35},{x:330*_,z:360*_,yaw:-.55},{x:-390*_,z:470*_,yaw:.12},{x:420*_,z:830*_,yaw:-.28},{x:-455*_,z:930*_,yaw:.48},{x:400*_,z:1120*_,yaw:-.16},{x:-520*_,z:690*_,yaw:.22},{x:540*_,z:1290*_,yaw:-.42}],Xi=[{x:K.x+132*_*.72,z:K.z+96*_*.72,yaw:2.3},{x:K.x+168*_*.72,z:K.z+40*_*.72,yaw:1.9},{x:K.x+96*_*.72,z:K.z+150*_*.72,yaw:2.7}];function Qi({url:e,height:o,loa:n,slim:s=1,sink:r=0,rotation:i,tint:l,emissive:h,emissiveIntensity:c,glow:d,onMaterials:b}){const{scene:g}=La(e),m=w.useMemo(()=>g.clone(!0),[g]),f=w.useMemo(()=>{const p=new Fa().setFromObject(m),x=new S;p.getSize(x);const u=new S;if(p.getCenter(u),n){const z=x.x>=x.z,E=Math.max(z?x.x:x.z,1e-4),j=n/E,I=z?[j,j,j*s]:[j*s,j,j];return{scale:I,offset:[-u.x*I[0],-p.min.y*I[1]-n*r,-u.z*I[2]]}}const v=x.y>1e-4?o/x.y:1;return{scale:[v,v,v],offset:[-u.x*v,-p.min.y*v,-u.z*v]}},[m,o,n,s,r]);return w.useEffect(()=>{const p=[];m.traverse(x=>{if(!x.isMesh)return;x.castShadow=!0,x.receiveShadow=!0;const u=x.material?Array.isArray(x.material)?x.material:[x.material]:[];for(const v of u)p.push(v),l&&(v.color?.multiply(new Se(l)),h&&v.emissive&&(v.emissive.set(h),v.emissiveIntensity=c??.2)),d&&v.emissive&&(v.emissive.set(d[0]),v.emissiveIntensity=d[1],v.map&&!v.emissiveMap&&(v.emissiveMap=v.map),v.needsUpdate=!0)}),b?.(p)},[m,l,h,c,d,b]),t.jsx("group",{rotation:[0,i,0],scale:f.scale,position:f.offset,children:t.jsx("primitive",{object:m})})}class Zi extends w.Component{constructor(){super(...arguments);ps(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function xe({name:e,height:o,loa:n=null,slim:s=1,sink:r=0,rotation:i=0,position:l=[0,0,0],tint:h=null,emissive:c=null,emissiveIntensity:d=.2,glow:b=null,onMaterials:g=null,fallback:m=null}){const f=vo(e);return ot(e)?t.jsx("group",{position:l,children:t.jsx(Zi,{url:f,fallback:m,children:t.jsx(w.Suspense,{fallback:m,children:t.jsx(Qi,{url:f,height:o,loa:n,slim:s,sink:r,rotation:i,tint:h,emissive:c,emissiveIntensity:d,glow:b,onMaterials:g})})})}):t.jsx("group",{position:l,children:m})}const Cn=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),r=s.createImageData(e,o);for(let l=0;l<o;l++){const h=l/(o-1),c=Math.pow(1-h,1.7);for(let d=0;d<e;d++){const b=d/(e-1)*2-1,g=Math.max(0,1-Math.abs(b)/(.35+h*.65)),m=.45+.55*Math.pow(Math.abs(b)/(.35+h*.65),1.5),f=c*Math.pow(g,1.4)*m,p=(l*e+d)*4;r.data[p]=255,r.data[p+1]=255,r.data[p+2]=255,r.data[p+3]=Math.round(Math.min(1,f)*255)}}s.putImageData(r,0,0);const i=new ro(n);return i.colorSpace=io,i})(),qi=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createImageData(e,e);for(let i=0;i<e;i++){const l=i/(e-1),h=Math.pow(1-l,1.5);for(let c=0;c<e;c++){const d=c/(e-1)*2-1,b=Math.max(0,1-Math.abs(d)),g=h*Math.pow(b,1.3),m=(i*e+c)*4;s.data[m]=255,s.data[m+1]=255,s.data[m+2]=255,s.data[m+3]=Math.round(Math.min(1,g)*255)}}n.putImageData(s,0,0);const r=new ro(o);return r.colorSpace=io,r})(),ss=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,0.9)"),s.addColorStop(.4,"rgba(255,255,255,0.28)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e);const r=new ro(o);return r.colorSpace=io,r})(),Yo=160,Zt=112,qt="#e6dfcf",Xa="#0c0a15",Jt=Xa;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,s,r){const i=Math.min(r??0,Math.abs(n)/2,Math.abs(s)/2);return this.moveTo(e+i,o),this.arcTo(e+n,o,e+n,o+s,i),this.arcTo(e+n,o+s,e,o+s,i),this.arcTo(e,o+s,e,o,i),this.arcTo(e,o,e+n,o,i),this.closePath(),this});function _t(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=Yo,o.height=Zt;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,0,Zt);s.addColorStop(0,"#14101f"),s.addColorStop(.5,Xa),s.addColorStop(1,"#08060f"),n.fillStyle=s,n.fillRect(0,0,Yo,Zt),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,Zt),n.save(),n.translate(Yo/2+4,Zt/2);try{e(n)}catch(i){console.warn("[onigashima] flag emblem skipped",i)}n.restore();const r=new ro(o);return r.colorSpace=io,r.anisotropy=4,r}function pn(e,o,n=qt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function fn(e,o,n=1){e.save(),e.fillStyle=Jt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Gs(e,o,n=4){e.save(),e.fillStyle=Jt;for(let s=1;s<n;s++){const r=-o*.5+s*o/n;e.fillRect(r-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function Os(e,o,n=qt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const s of[1,-1]){e.save(),e.rotate(s*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const r of[-1,1])for(const i of[-.16,.16])e.beginPath(),e.arc(r*o*1.55,o*.55+i*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Ji={straw:_t(e=>{Os(e,26),pn(e,26),fn(e,26),Gs(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:_t(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Jt;for(const s of[-1,1])e.beginPath(),e.arc(s*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Jt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:_t(e=>{Os(e,26,"#d8cfc0"),e.fillStyle=qt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Jt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const s=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(s,26*.42),e.lineTo(s+26*.1,26*1.04),e.lineTo(s-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:_t(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const s=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(s),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),yakuza:_t(e=>{e.strokeStyle="#e8c86a",e.lineWidth=28*.12,e.beginPath(),e.roundRect(-28*.86,-28*.86,28*1.72,28*1.72,28*.14),e.stroke(),e.fillStyle=qt;for(const n of[-.42,0,.42])e.fillRect(-28*.52,n*28-28*.07,28*1.04,28*.15);e.fillRect(-28*.09,-28*.55,28*.18,28*1.1),e.fillStyle="#d63420",e.beginPath(),e.arc(0,-28*1.32,28*.2,0,Math.PI*2),e.fill()}),mink:_t(e=>{e.fillStyle=qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();pn(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),fn(e,25,.85),e.save(),e.fillStyle=Jt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:_t(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();pn(e,26,"#cfd8e4"),fn(e,26),Gs(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Qa={value:0},Ds=new Map;function el(e){const o=Ds.get(e);if(o)return o;const n=Ji[e],s=new Tr({map:n,emissiveMap:n,emissive:new Se("#9fb4d8"),emissiveIntensity:.95,roughness:.94,metalness:0,side:_e,transparent:!1});return s.onBeforeCompile=r=>{r.uniforms.uTime=Qa,r.vertexShader=`uniform float uTime;
`+r.vertexShader.replace("#include <begin_vertex>",`
        #include <begin_vertex>
        /* uv.x is 0 at the hoist and 1 at the fly. Amplitude grows as its
           SQUARE, because cloth nailed to a staff cannot move at the nail
           and moves most at the free corner — a linear ramp makes the whole
           flag slide sideways like a sheet of paper. */
        float hoist = uv.x * uv.x;
        transformed.z += sin(uv.x * 8.5 - uTime * 5.2 + uv.y * 2.2) * 0.16 * hoist;
        transformed.z += sin(uv.x * 15.0 - uTime * 8.1) * 0.05 * hoist;
        transformed.y += sin(uv.x * 4.0 - uTime * 4.6) * 0.07 * hoist;
        /* Shorten toward the mast as it billows, or the cloth visibly
           stretches every time a fold passes through it. */
        transformed.x -= hoist * 0.06;
        `),r.vertexShader=r.vertexShader.replace("#include <beginnormal_vertex>",`
      #include <beginnormal_vertex>
      float nHoist = uv.x * uv.x;
      objectNormal = normalize(objectNormal + vec3(
        -cos(uv.x * 8.5 - uTime * 5.2 + uv.y * 2.2) * 1.36 * nHoist, 0.0, 0.0));
      `)},s.customProgramCacheKey=()=>"onigashima-flag",Ds.set(e,s),s}function tl(){return se((e,o)=>{Qa.value+=Math.min(o,.05)}),null}const ol=(()=>{const e=new $n(1,1,14,5);return e.translate(.5,0,0),e})();function So({crew:e="straw",width:o=Va,position:n=[0,0,0],rotation:s=Math.PI/2,staff:r=!0}){const i=w.useMemo(()=>el(e)??null,[e]),l=o*(Zt/Yo);return i?t.jsxs("group",{position:n,rotation:[0,s,0],children:[r&&t.jsxs("mesh",{position:[0,l*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.028,o*.028,l*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{position:[-o*.02,-l*1.1,0],rotation:[0,0,-.06],children:[t.jsx("cylinderGeometry",{args:[o*.012,o*.012,l*2.4,3]}),t.jsx("meshStandardMaterial",{color:"#6b5f4a",emissive:"#6b5f4a",emissiveIntensity:.35,roughness:.9})]}),t.jsx("mesh",{geometry:ol,material:i,scale:[o,l,o]})]}):null}const Vo=[{id:"scabbards",flag:"kozuki",lead:Ka,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:T.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:T.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb",sailedBy:"helm"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb",sailedBy:"helm"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445",crew:"crew-heart.opt.glb",sailedBy:"sub"},{id:"kozuki-0",faction:"kozuki",flag:"kozuki",rank:0,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1",faction:"kozuki",flag:"kozuki",rank:0,scale:.848,sail:"#c6bba4",hull:"#453322",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2",faction:"kozuki",flag:"kozuki",rank:0,scale:.836,sail:"#c2b79f",hull:"#3a2d20",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3",faction:"kozuki",flag:"kozuki",rank:0,scale:.824,sail:"#bdb29a",hull:"#37291d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4",faction:"kozuki",flag:"kozuki",rank:0,scale:.812,sail:"#c8bda6",hull:"#3c2e21",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"kozuki-5",faction:"kozuki",flag:"kozuki",rank:0,scale:.8,sail:"#beb39b",hull:"#382a1e",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47",crew:"crew-samurai.opt.glb"},{id:"kozuki-6",faction:"kozuki",flag:"kozuki",rank:0,scale:.788,sail:"#bcb199",hull:"#362820",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a",crew:"crew-samurai.opt.glb"},{id:"kozuki-7",faction:"kozuki",flag:"kozuki",rank:0,scale:.776,sail:"#c4b9a1",hull:"#382b1f",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7b6c53",crew:"crew-samurai.opt.glb"},{id:"kozuki-8",faction:"kozuki",flag:"kozuki",rank:0,scale:.764,sail:"#c9bea7",hull:"#392c20",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#81725a",crew:"crew-samurai.opt.glb"},{id:"yakuza-0",faction:"yakuza",flag:"yakuza",rank:0,scale:.84,sail:"#b8a894",hull:"#4d3026",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1",faction:"yakuza",flag:"yakuza",rank:0,scale:.828,sail:"#b2a28e",hull:"#472b22",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2",faction:"yakuza",flag:"yakuza",rank:0,scale:.816,sail:"#ad9d89",hull:"#42271f",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3",faction:"yakuza",flag:"yakuza",rank:0,scale:.804,sail:"#bfae99",hull:"#4a2e24",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4",faction:"yakuza",flag:"yakuza",rank:0,scale:.792,sail:"#a89884",hull:"#3d241d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"yakuza-5",faction:"yakuza",flag:"yakuza",rank:0,scale:.78,sail:"#b5a591",hull:"#452a21",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#83654f",crew:"crew-samurai.opt.glb"},{id:"yakuza-6",faction:"yakuza",flag:"yakuza",rank:0,scale:.768,sail:"#aa9a86",hull:"#402620",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#755949",crew:"crew-samurai.opt.glb"},{id:"yakuza-7",faction:"yakuza",flag:"yakuza",rank:0,scale:.756,sail:"#bcac97",hull:"#482c23",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#886851",crew:"crew-samurai.opt.glb"},{id:"yakuza-8",faction:"yakuza",flag:"yakuza",rank:0,scale:.744,sail:"#a5957f",hull:"#3a221b",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6d5142",crew:"crew-samurai.opt.glb"},{id:"mink-0",faction:"mink",flag:"mink",rank:0,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"mink-1",faction:"mink",flag:"mink",rank:0,scale:.886,sail:"#cdc2aa",hull:"#42392b",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#68644e",crew:"crew-samurai.opt.glb"},{id:"mink-2",faction:"mink",flag:"mink",rank:0,scale:.872,sail:"#cbc0a8",hull:"#403729",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6c684f",crew:"crew-samurai.opt.glb"},{id:"mink-3",faction:"mink",flag:"mink",rank:0,scale:.858,sail:"#c6bba3",hull:"#3d352a",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#666249",crew:"crew-samurai.opt.glb"},{id:"kozuki-0b",faction:"kozuki",flag:"kozuki",rank:1,scale:.8,sail:"#cfc4ac",hull:"#4a3728",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1b",faction:"kozuki",flag:"kozuki",rank:1,scale:.788,sail:"#c6bba4",hull:"#453322",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2b",faction:"kozuki",flag:"kozuki",rank:1,scale:.776,sail:"#c2b79f",hull:"#3a2d20",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3b",faction:"kozuki",flag:"kozuki",rank:1,scale:.764,sail:"#bdb29a",hull:"#37291d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4b",faction:"kozuki",flag:"kozuki",rank:1,scale:.752,sail:"#c8bda6",hull:"#3c2e21",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"yakuza-0b",faction:"yakuza",flag:"yakuza",rank:1,scale:.78,sail:"#b8a894",hull:"#4d3026",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1b",faction:"yakuza",flag:"yakuza",rank:1,scale:.768,sail:"#b2a28e",hull:"#472b22",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2b",faction:"yakuza",flag:"yakuza",rank:1,scale:.756,sail:"#ad9d89",hull:"#42271f",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3b",faction:"yakuza",flag:"yakuza",rank:1,scale:.744,sail:"#bfae99",hull:"#4a2e24",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4b",faction:"yakuza",flag:"yakuza",rank:1,scale:.732,sail:"#a89884",hull:"#3d241d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"mink-0b",faction:"mink",flag:"mink",rank:1,scale:.84,sail:"#cec3ab",hull:"#42392c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6a6650",crew:"crew-samurai.opt.glb"},{id:"mink-1b",faction:"mink",flag:"mink",rank:1,scale:.826,sail:"#cabfa7",hull:"#40372a",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6b674e",crew:"crew-samurai.opt.glb"},{id:"mink-2b",faction:"mink",flag:"mink",rank:1,scale:.812,sail:"#ccc1a9",hull:"#413828",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#69654d",crew:"crew-samurai.opt.glb"},{id:"mink-3b",faction:"mink",flag:"mink",rank:1,scale:.798,sail:"#c8bda5",hull:"#3f3629",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#676349",crew:"crew-samurai.opt.glb"}];Ui(Vo);function Ns({color:e,position:o,scale:n=1}){return t.jsxs("group",{position:o,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[qo*n,7,5]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[Jo*n,Jo*n,1],children:t.jsx("spriteMaterial",{map:ss,color:e,transparent:!0,opacity:.5,depthWrite:!1,blending:pt,toneMapped:!1})})]})}function nl({spec:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=w.useRef();se(()=>{const f=n.current;if(!f)return;const p=y.mode&&y.mode!=="off";if(f.visible=!(e.sailedBy==="sub"?y.mode==="sub":e.sailedBy==="helm"&&(y.mode==="helm"||y.mode==="foot")&&y.vessel===e.id),!f.visible)return;const x=p?0:R.clamp(y.progress*.82+.04,0,1),[u,v]=$i(e.lead,e.off,x,p?Yi:0),z=Mo(u,v),E=R.clamp(-re(u,v)/46,0,1),j=R.lerp(1,.055,z)*R.smoothstep(E,0,.28),I=xt(u,v,y.t,j),a=e.sub?R.smoothstep(y.progress,.42,.6):0;f.position.set(u,I.y-a*40,v);const k=e.sub?.35:1;f.rotation.x=R.clamp(I.dz*1.35*k,-.32,.32),f.rotation.z=R.clamp(-I.dx*1.15*k,-.28,.28),f.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,s.current&&(s.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,s.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),r.current&&(r.current.material.opacity=.36*(.25+(1-z)*.75)*(1-a))});const i=e.scale,l=o==="low"?6:10,h=ot(e.model2??""),c=ot(e.model??""),d=h?e.model2:c?e.model:null,b=d==="ship-junk.opt.glb",g=ln(d,34)*(b?e.scale??1:1),m=ot(e.crew??"");return d?t.jsxs("group",{ref:n,children:[t.jsx(xe,{name:d,loa:g,slim:cn(d),sink:zo(d),rotation:an(d),tint:h?ns(d):e.tint,emissive:"#3a2a18",emissiveIntensity:.16,glow:en(d)}),m&&Ya(o).map((f,p)=>{const[x,u]=os(d,g,f);return t.jsx(xe,{name:e.crew,height:rn,rotation:f[2],position:[x,At(d,g),u]},`crew-${p}`)}),e.flag&&t.jsx(So,{crew:e.flag,width:jo(g),position:[0,ko(d,g)*(e.sub?.72:.9),-g*.1],staff:!!e.sub}),t.jsx(Ns,{color:e.lamp,position:[0,At(d,g)+qo*3,-g*.2]}),t.jsxs("mesh",{ref:r,position:[0,.6,-g*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[g*.55,g*2.3]}),t.jsx("meshBasicMaterial",{map:Cn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:i*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,l]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:_e,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(f=>[0,1,2,3].map(p=>t.jsxs("mesh",{position:[f*5.6,3.4,-6+p*4],rotation:[0,0,f*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${f}-${p}`))),e.flag&&t.jsx(So,{crew:e.flag,width:jo(g)/(i*1.7),position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsx(Ns,{color:e.lamp,scale:1/(i*1.7),position:[0,e.open?5.6:9.4,e.open?7:-7.4]})]}),t.jsxs("mesh",{ref:r,position:[0,.6,-34*i],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*i,74*i]}),t.jsx("meshBasicMaterial",{map:Cn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Hs({x:e,z:o,yaw:n,name:s,loa:r,tint:i,flag:l=null,crew:h=null,quality:c="high"}){const d=ln(s,r),b=w.useRef(),g=ot(s),m=ot(h??"");return se(()=>{const f=b.current;if(!f)return;const p=Mo(e,o),x=R.clamp(-re(e,o)/46,0,1),u=R.lerp(1,.055,p)*R.smoothstep(x,0,.28),v=xt(e,o,y.t,u);f.position.set(e,v.y,o),f.rotation.set(R.clamp(v.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,R.clamp(-v.dx,-.22,.22))}),t.jsxs("group",{ref:b,children:[t.jsx(xe,{name:s,loa:d,slim:cn(s),sink:zo(s),rotation:an(s),tint:i,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&m&&g&&Ya(c).slice(0,2).map((f,p)=>{const[x,u]=os(s,d,f);return t.jsx(xe,{name:h,height:rn,rotation:f[2],position:[x,At(s,d),u]},`watch-${p}`)}),l&&g&&t.jsx(So,{crew:l,width:jo(d),position:[0,ko(s,d)*.9,-d*.1]})]})}function sl({quality:e="high"}){const o=w.useMemo(()=>e==="low"?Vo.slice(0,7):e==="mid"?Vo.slice(0,22):Vo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(tl,{}),o.map(n=>t.jsx(nl,{spec:n,quality:e},n.id)),e!=="low"&&Ki.map((n,s)=>t.jsx(Hs,{quality:e,...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts",crew:"crew-samurai.opt.glb"},`picket-${s}`)),e!=="low"&&Xi.map((n,s)=>t.jsx(Hs,{quality:e,...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki",crew:"crew-samurai.opt.glb"},`moored-${s}`))]})}const al=2,_s={"powder-keg.opt.glb":2.4,"war-cannon.opt.glb":4.2,"bomb-sphere.opt.glb":3.6,"sake-tower.opt.glb":5,"wisteria-trellis.opt.glb":8,"banquet-table.opt.glb":2.4,"stone-lantern.opt.glb":4,"oni-daiko.opt.glb":6,"oni-guardian.opt.glb":13,"oni-throne.opt.glb":12,"kagura-stage.opt.glb":40,"treasure-kura.opt.glb":16,"rear-gatehouse.opt.glb":18,"keep-tier.opt.glb":56,"arch-bridge.opt.glb":14},ce=(e,o=6)=>e&&_s[e]!==void 0?_s[e]:o,Lt=30,rl="#2e2a33",Ln="#3a4152",Fn=X.snow,tn="#cfe0f4";function Bs({position:e}){const o=ce("stone-lantern.opt.glb")/7.8;return t.jsx("group",{position:e,children:t.jsx(xe,{name:"stone-lantern.opt.glb",height:ce("stone-lantern.opt.glb"),tint:"#8a93a8",fallback:t.jsxs("group",{scale:o,children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:tn,emissive:tn,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.9})]})]})})})}function il({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2(W.dir[0],W.dir[1]),[]);return t.jsxs("group",{position:[W.gate.x,W.benchY,W.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.92})]},n)),t.jsx(xe,{name:"rear-gatehouse.opt.glb",height:ce("rear-gatehouse.opt.glb"),rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:rl,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:_e})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:tn,emissive:tn,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Bs,{position:[-14,0,10]}),t.jsx(Bs,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const Io=new Se,Pn={color:"#7fd8c8",intensity:9e3,distance:320},mn={color:"#ffc48a",intensity:12e3,distance:300},ll=new Se(Pn.color),cl={low:1,mid:2,high:4},Kt=[{pos:[K.x,40,K.z],color:T.lantern,intensity:16e3,distance:460*_*.65},{pos:[0,78,Ot],color:T.lantern,intensity:15e3,distance:430},{pos:[he.x,he.y+6,he.z-30],color:T.emberDeep,intensity:3e4,distance:640},{pos:[W.gate.x,30,W.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function hl({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const s=w.useRef(),r=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef(),d=Me(g=>g.camera),b=cl[e]??5;return se(()=>{if(s.current){s.current.intensity=y.flash*9e3;const f=y.flashDir;s.current.position.set(f.x*700,260+f.y*500,pe.z+f.z*700)}const g=y.t;r.current&&(r.current.intensity=62e3*(.86+.14*Math.sin(g*2.3)*Math.sin(g*.71))),i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(g*1.9+2.1)*Math.sin(g*.63)));const m=y.inside;if(h.current&&(h.current.intensity=.16+m*.3),c.current&&(c.current.intensity=.34+m*.26),l.current){const f=l.current,p=.06;let x=Kt[0],u=1/0;for(const v of Kt){const z=(d.position.x-v.pos[0])**2+(d.position.z-v.pos[2])**2;z<u&&(u=z,x=v)}if(y.subActive&&u>550*550){const v=y.subPos,z=Math.min(1,y.underwater/.35);f.position.x+=(v.x-f.position.x)*.3,f.position.y+=(v.y+14-f.position.y)*.3,f.position.z+=(v.z-f.position.z)*.3,Io.set(mn.color).lerp(ll,z),f.color.lerp(Io,p),f.intensity+=(R.lerp(mn.intensity,Pn.intensity,z)-f.intensity)*p,f.distance=R.lerp(mn.distance,Pn.distance,z)}else if(y.helmActive&&u>550*550){const v=y.helmPos;f.position.x+=(v.x-f.position.x)*.25,f.position.y+=(v.y+16-f.position.y)*.25,f.position.z+=(v.z-f.position.z)*.25,f.color.lerp(Io.set(T.lantern),p),f.intensity+=(11e3-f.intensity)*p,f.distance=300}else f.position.x+=(x.pos[0]-f.position.x)*p,f.position.y+=(x.pos[1]-f.position.y)*p,f.position.z+=(x.pos[2]-f.position.z)*p,f.color.lerp(Io.set(x.color),p),f.intensity+=(x.intensity-f.intensity)*p,f.distance=x.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:c,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(_/1.55),"shadow-camera-right":520*(_/1.55),"shadow-camera-top":520*(_/1.55),"shadow-camera-bottom":-520*(_/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:r,position:b>=2?[Ie[0].x,Ie[0].y,Ie[0].z]:[(Ie[0].x+Ie[1].x)/2,Ie[0].y,Ie[0].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),b>=2&&t.jsx("pointLight",{ref:i,position:[Ie[1].x,Ie[1].y,Ie[1].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:l,position:Kt[0].pos,color:Kt[0].color,intensity:Kt[0].intensity,distance:Kt[0].distance,decay:2}),b>=3&&t.jsx("pointLight",{position:[he.x,he.y+4,he.z-34],color:T.emberDeep,intensity:3e4,distance:640,decay:2}),b>=4&&t.jsx("pointLight",{position:[0,78,Ot],color:T.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:s,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function gn(e,o){let n=e>>>0;const s=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),r=[],i=o==="low"?3:5,l=(p,x,u,v,z)=>{const E=[p.clone()],j=p.clone();for(let a=0;a<v;a++)j.add(new S((s()-.5)*u*.55,-u/v,(s()-.5)*u*.42)).add(x.clone().multiplyScalar(u/v*.3)),E.push(j.clone());const I=new ao(new so(E),v*2,z,i,!1);return r.push(I),E},h=l(new S(0,620,0),new S(0,0,0),620,9,3.4),c=o==="low"?1:3;for(let p=0;p<c;p++){const x=h[2+Math.floor(s()*(h.length-3))];l(x.clone(),new S(s()-.5,0,s()-.5).multiplyScalar(2),190+s()*130,4,1.5)}let d=0;for(const p of r)d+=p.attributes.position.count;const b=new Float32Array(d*3),g=new Float32Array(d*3);let m=0;for(const p of r)b.set(p.attributes.position.array,m*3),g.set(p.attributes.normal.array,m*3),m+=p.attributes.position.count,p.dispose();const f=new Dt;return f.setAttribute("position",new ne(b,3)),f.setAttribute("normal",new ne(g,3)),f}function ul({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),s=w.useRef({i:0,t:-1,dur:0,flicker:0}),r=w.useMemo(()=>[gn(40503,e),gn(20973,e),gn(10196,e)],[e]);return se((i,l)=>{const h=Math.min(l,.05),c=s.current;if(n.current-=h,n.current<=0&&c.t<0){c.i=(c.i+1)%3,c.t=0,c.dur=.16+Math.random()*.26,c.flicker=2+Math.floor(Math.random()*3);const d=o[c.i].current;if(d){const b=(Math.random()-.5)*2.4-Math.PI*.5,g=620+Math.random()*760;d.position.set(pe.x+Math.cos(b)*g,40+Math.random()*120,pe.z+Math.sin(b)*g*.7-240),d.rotation.y=Math.random()*Math.PI*2;const m=.7+Math.random()*.8;d.scale.set(m,m,m),y.flashDir.set(d.position.x,d.position.y+400,d.position.z).normalize()}n.current=R.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(c.t>=0){c.t+=h;const d=c.t/c.dur,b=Math.abs(Math.sin(d*Math.PI*c.flicker)),g=Math.max(0,1-d);y.flash=g*g*b;const m=o[c.i].current;m&&(m.material.opacity=Math.min(1,y.flash*2.2)),d>=1&&(c.t=-1,y.flash=0,m&&(m.material.opacity=0))}else y.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:r.map((i,l)=>t.jsx("mesh",{ref:o[l],geometry:i,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:pt,depthWrite:!1,toneMapped:!1})},l))})}const dl=`
  uniform float uTime;
  uniform vec3  uCam;
  uniform float uBox;
  uniform float uFall;
  uniform float uSize;
  attribute float aSpeed;
  attribute float aLen;
  varying float vLen;

  void main() {
    /* Every drop lives in a box that FOLLOWS THE CAMERA, wrapped with mod. This
       is the whole trick: 6000 drops are enough to fill a 400m box completely,
       where the same 6000 spread over the 4km scene would be invisible. The
       camera never sees the seam because the box is bigger than the fog. */
    vec3 p = position;
    p.y -= uTime * uFall * aSpeed;
    p = mod(p - uCam + uBox * 0.5, uBox) + uCam - uBox * 0.5;

    /* Wind shear: the drops lean with the gale, and lean more the higher they
       are, which is what makes it read as weather rather than as a screensaver. */
    p.x += (p.y - uCam.y) * 0.16;
    p.z -= (p.y - uCam.y) * 0.07;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    vLen = aLen;
    // Near drops are streaks, far drops are dots; the size clamp stops a drop
    // that passes through the near plane from filling the screen.
    gl_PointSize = clamp(uSize * aLen * (300.0 / -mv.z), 1.0, 26.0);
  }
`,pl=`
  precision mediump float;
  uniform vec3  uColor;
  uniform float uOpacity;
  varying float vLen;

  void main() {
    /* Draw the point sprite as a vertical streak, not a round dot: a soft
       horizontal falloff and almost none vertically. A round particle at this
       density reads as snow, which is the wrong weather entirely. */
    vec2 c = gl_PointCoord - 0.5;
    float a = smoothstep(0.5, 0.0, abs(c.x) * 4.2) * smoothstep(0.55, 0.1, abs(c.y));
    if (a < 0.02) discard;
    gl_FragColor = vec4(uColor, a * uOpacity);
  }
`,Us={low:1600,mid:3800,high:7e3},Co=460;function fl({quality:e}){const o=w.useRef(),n=Me(i=>i.camera),s=w.useMemo(()=>{const i=Us[e]??Us.high,l=new Float32Array(i*3),h=new Float32Array(i),c=new Float32Array(i);for(let b=0;b<i;b++)l[b*3]=Math.random()*Co,l[b*3+1]=Math.random()*Co,l[b*3+2]=Math.random()*Co,h[b]=.7+Math.random()*.6,c[b]=.55+Math.random()*.85;const d=new Dt;return d.setAttribute("position",new ne(l,3)),d.setAttribute("aSpeed",new ne(h,1)),d.setAttribute("aLen",new ne(c,1)),d.boundingSphere=new lo(new S,1e6),d},[e]),r=w.useMemo(()=>({uTime:{value:0},uCam:{value:new S},uBox:{value:Co},uFall:{value:118},uSize:{value:2.4},uColor:{value:new S(...ie("#b9c8e4"))},uOpacity:{value:.5}}),[]);return se((i,l)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=l,h.uCam.value.copy(n.position),h.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:s,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:dl,fragmentShader:pl,uniforms:r,transparent:!0,depthWrite:!1,fog:!1})})}const ml=`
  uniform float uTime;
  attribute float aPhase;
  attribute float aRise;
  attribute float aSize;
  varying float vFade;

  void main() {
    /* Embers rise, drift and die, then restart — all from one saw wave on time
       plus the per-particle phase. No CPU respawn bookkeeping at all. */
    float life = fract(uTime * aRise + aPhase);
    vec3 p = position;
    p.y += life * 190.0;
    p.x += sin(uTime * 0.6 + aPhase * 40.0) * 26.0 * life;
    p.z += cos(uTime * 0.45 + aPhase * 27.0) * 20.0 * life;

    // Fade in fast, out slow: an ember flares as it leaves the fire.
    vFade = smoothstep(0.0, 0.06, life) * (1.0 - smoothstep(0.35, 1.0, life));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (260.0 / -mv.z), 1.0, 12.0);
  }
`,gl=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Ws={low:120,mid:340,high:700};function xl({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const r=Ws[e]??Ws.high,i=[Ie[0],Ie[1],he,he],l=new Float32Array(r*3),h=new Float32Array(r),c=new Float32Array(r),d=new Float32Array(r);for(let g=0;g<r;g++){const m=i[g%i.length];l[g*3]=m.x+(Math.random()-.5)*74,l[g*3+1]=m.y+(Math.random()-.5)*30,l[g*3+2]=m.z+(Math.random()-.5)*26,h[g]=Math.random(),c[g]=.045+Math.random()*.055,d[g]=2+Math.random()*4}const b=new Dt;return b.setAttribute("position",new ne(l,3)),b.setAttribute("aPhase",new ne(h,1)),b.setAttribute("aRise",new ne(c,1)),b.setAttribute("aSize",new ne(d,1)),b.boundingSphere=new lo(new S(0,300,-260),700),b},[e]),s=w.useMemo(()=>({uTime:{value:0},uColor:{value:new S(...ie(T.ember))}}),[]);return se((r,i)=>{o.current&&(o.current.uniforms.uTime.value+=i)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:ml,fragmentShader:gl,uniforms:s,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function bl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ul,{quality:e}),t.jsx(fl,{quality:e}),t.jsx(xl,{quality:e})]})}const wl=`
  uniform float uTime;
  uniform vec2  uCentre;
  uniform float uR;
  uniform float uDepth;
  uniform float uDir;
  attribute float aAngle;
  attribute float aPhase;
  attribute float aRate;
  attribute float aSize;
  attribute float aJitter;
  varying float vFade;

  void main() {
    /* Radial life: 1.3R in the mist, falling to 0.14R at the throat. */
    float life = fract(aPhase + uTime * aRate);
    float q = 1.3 - life * 1.16;

    /* Wound-up angle: the integral of a 1/(q+0.2) spin, cheaply faked by
       advancing with life rather than with time so it stays coherent. */
    float ang = aAngle + uDir * (uTime * 0.22 + life * 7.5 / (q + 0.2));

    float r = q * uR;
    vec3 p;
    p.x = uCentre.x + cos(ang) * r;
    p.z = uCentre.y + sin(ang) * r;
    /* Ride the funnel wall, plus spray lift near the rim collar. */
    float bowl = exp(-3.0 * q * q);
    p.y = -uDepth * bowl + 2.0 + aJitter * (3.0 + 6.0 * (1.0 - q));

    /* Faint in the outer mist, brightest over the collar, gone into the
       throat — the drop swallows the spray before the geometry swallows it. */
    vFade = smoothstep(1.28, 1.05, q) * (0.35 + 0.65 * smoothstep(0.7, 0.34, q)) * smoothstep(0.12, 0.24, q);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (0.9 + (1.0 - q) * 1.4) * (420.0 / -mv.z), 1.0, 34.0);
  }
`,yl=`
  precision mediump float;
  uniform vec3  uColor;
  uniform float uGain;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.06, d);
    float k = a * vFade * uGain;
    if (k < 0.012) discard;
    gl_FragColor = vec4(uColor, k * 0.5);
  }
`,Ys={low:150,mid:380,high:620};function vl({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=w.useMemo(()=>{const l=Ys[o]??Ys.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l),g=new Float32Array(l),m=new Float32Array(l);for(let p=0;p<l;p++)c[p]=Math.random()*Math.PI*2,d[p]=Math.random(),b[p]=.05+Math.random()*.05,g[p]=3+Math.random()*6,m[p]=Math.random();const f=new Dt;return f.setAttribute("position",new ne(h,3)),f.setAttribute("aAngle",new ne(c,1)),f.setAttribute("aPhase",new ne(d,1)),f.setAttribute("aRate",new ne(b,1)),f.setAttribute("aSize",new ne(g,1)),f.setAttribute("aJitter",new ne(m,1)),f.boundingSphere=new lo(new S(e.x,0,e.z),e.r*1.6+40),f},[o,e]),i=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new Kn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new S(...ie(X.foam))},uGain:{value:1}}),[e]);return se((l,h)=>{const c=n.current?.uniforms;if(!c)return;c.uTime.value+=h;const d=Math.hypot(l.camera.position.x-e.x,l.camera.position.z-e.z);c.uGain.value=1-R.smoothstep(d,1600,2400),s.current&&(s.current.visible=c.uGain.value>.02)}),t.jsx("points",{ref:s,geometry:r,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:wl,fragmentShader:yl,uniforms:i,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function Ml({quality:e="high"}){const o=Me(n=>n.camera);return se(()=>{let n=0;for(const s of Be){const r=Math.hypot(o.position.x-s.x,o.position.z-s.z);n=Math.max(n,1-R.smoothstep(r,s.r*.3,s.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Be.map((n,s)=>t.jsx(vl,{whirl:n,quality:e},s))})}const Y={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},no={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<oo-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*_},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Ot-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*_},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=Hr("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<W.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},jl=e=>no[e]?no[e].length:0,kl=()=>Y.chain&&no[Y.chain]?no[Y.chain][Y.step]??null:null;function Gn(e){Y.chain=no[e]?e:null,Y.step=0,Y.hull=1,Y.grip=0,Y.clock=0,Y.done=!1,Y.banner=null,Y.rev++}function on(e,o,n=3.4){Y.banner={text:e,sub:o,until:Y.clock+n},Y.rev++}function Ut(e,o){Y.hull<=0||(Y.hull=Math.max(0,Y.hull-e),Y.hits++,Y.hull<=0?on("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&on(o,null,2.2),Y.rev++)}function Za(e,o){if(Y.clock+=e,Y.banner&&Y.clock>Y.banner.until&&(Y.banner=null,Y.rev++),!Y.chain||Y.done||!o)return;const n=no[Y.chain],s=n[Y.step];if(!s)return;let r=!1;try{r=!!s.test(o)}catch{r=!1}r&&(Y.step++,Y.step>=n.length?(Y.done=!0,on("OBJECTIVE COMPLETE",Sl[Y.chain]??"",6)):on(n[Y.step].text,n[Y.step].hint,3.6),Y.rev++)}const Sl={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function qa(e,{danger:o,headingX:n,headingZ:s,toCentreX:r,toCentreZ:i,speed:l,throttle:h}){if(o<=.001)return Y.grip=Math.max(0,Y.grip-e*.5),Y.grip;const c=Math.hypot(r,i)||1,d=-r/c,b=-i/c,g=n*d+s*b,m=Math.min(1,Math.abs(l)/22),f=o*.42,p=Math.max(0,g)*m*(.35+.45*Math.min(1,Math.abs(h)));return Y.grip=Math.max(0,Math.min(1,Y.grip+(f-p)*e)),Y.grip}const Vs=24,xn=Xo.safe,$s=Xo.range,po=2.1,zl=1.5,Ks=22,Tl=[Ot,oo],El=new at,bn=new S,Xs=new yt,wn=new S;function Rl({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:Vs},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),s=w.useRef(0),r=w.useMemo(()=>{const i=new Pa(.55,1,1,e==="low"?6:10,1,!0);return i.translate(0,.5,0),i},[e]);return se((i,l)=>{const h=o.current;if(!h)return;const c=Math.min(l,.05),d=y.helm;if(y.helmActive&&d&&!d.onFoot&&!d.sub&&!d.moored){let m=null,f=1/0;for(const p of Tl){const x=Math.hypot(d.x,d.z-p);x<xn||x>$s||x<f&&(f=x,m=p)}if(m!==null&&(s.current-=c,s.current<=0)){const p=1-R.clamp((f-xn)/($s-xn),0,1);s.current=R.lerp(4.5,1.9,p);const x=n.find(u=>!u.live);if(x){const u=po*.55,v=R.lerp(230,105,p);x.x=d.x+Math.sin(d.heading)*d.speed*u+(Math.random()-.5)*v,x.z=d.z+Math.cos(d.heading)*d.speed*u+(Math.random()-.5)*v,x.y0=210+Math.random()*60,x.t=0,x.live=!0}}}let g=0;for(const m of n){if(!m.live)continue;const f=m.t;if(m.t+=c,m.t<po){const p=m.t/po;bn.set(m.x,m.y0*(1-p*p),m.z),wn.set(2.2,9,2.2)}else{if(f<po){const u=Math.hypot(m.x-d.x,m.z-d.z);u<Ks&&Ut(.03*(1-u/Ks)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const p=(m.t-po)/zl;if(p>=1){m.live=!1;continue}const x=Math.min(1,p*4);bn.set(m.x,xt(m.x,m.z,y.t,1).y-4,m.z),wn.set(11+p*9,78*x*(1-p*p*.75),11+p*9)}Xs.identity(),h.setMatrixAt(g,El.compose(bn,Xs,wn)),g++}h.count=g,h.instanceMatrix.needsUpdate=!0,h.visible=g>0}),t.jsx("instancedMesh",{ref:o,args:[r,void 0,Vs],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:pt,side:_e})})}const Al=`
  uniform float uTime;
  uniform vec3  uCam;
  uniform float uBox;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aPhase;
  varying float vFade;

  void main() {
    /* Same follow-the-camera box the rain uses, and for the same reason: a
       few thousand motes fill a 260m box completely, where the same count
       spread over the 4km scene would be invisible. Sinking, not falling —
       marine snow drifts down at centimetres per second, so this is slow on
       purpose and the swirl matters more than the descent. */
    vec3 p = position;
    p.y -= uTime * aSpeed * 0.9;
    p.x += sin(uTime * 0.21 + aPhase * 12.0) * 3.4;
    p.z += cos(uTime * 0.17 + aPhase * 9.0) * 3.4;
    p = mod(p - uCam + uBox * 0.5, uBox) + uCam - uBox * 0.5;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    /* Fade the far ones out by hand: they sit inside the fog but Points do
       not receive three's fog chunk in a raw ShaderMaterial. */
    vFade = 1.0 - smoothstep(40.0, 210.0, -mv.z);
    gl_PointSize = clamp(aSize * (150.0 / -mv.z), 1.0, 7.0);
  }
`,Il=`
  precision mediump float;
  uniform vec3  uColor;
  uniform float uGain;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.12, d);
    float k = a * vFade * uGain;
    if (k < 0.015) discard;
    gl_FragColor = vec4(uColor, k * 0.5);
  }
`,Qs={low:700,mid:1800,high:3200},Lo=260;function Cl({quality:e}){const o=w.useRef(),n=w.useRef(),s=Me(l=>l.camera),r=w.useMemo(()=>{const l=Qs[e]??Qs.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l);for(let m=0;m<l;m++)h[m*3]=Math.random()*Lo,h[m*3+1]=Math.random()*Lo,h[m*3+2]=Math.random()*Lo,c[m]=.5+Math.random()*1.4,d[m]=1.2+Math.random()*3.2,b[m]=Math.random();const g=new Dt;return g.setAttribute("position",new ne(h,3)),g.setAttribute("aSpeed",new ne(c,1)),g.setAttribute("aSize",new ne(d,1)),g.setAttribute("aPhase",new ne(b,1)),g.boundingSphere=new lo(new S,1e6),g},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new S},uBox:{value:Lo},uColor:{value:new S(...ie("#cfeee6"))},uGain:{value:0}}),[]);return se((l,h)=>{const c=o.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(s.position),c.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:r,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Al,fragmentShader:Il,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const Ll=`
  uniform float uTime;
  uniform vec2  uCentre;
  uniform float uR;
  uniform float uDir;
  uniform float uDepth;
  attribute float aAngle;
  attribute float aPhase;
  attribute float aRate;
  attribute float aRadius;
  attribute float aSize;
  varying float vFade;

  void main() {
    /* One particle's life takes it from the throat's rim down the cone to its
       point. Radius shrinks with depth (a vortex is a cone, not a cylinder)
       and the angular rate RISES as it narrows — conservation of angular
       momentum, and the single thing that makes a drain look like a drain. */
    float life = fract(aPhase + uTime * aRate);
    float depth = life * uDepth;
    float shrink = 1.0 - life * 0.82;
    float r = aRadius * uR * shrink;
    float ang = aAngle + uDir * (uTime * 0.5 + life * 9.0) / max(shrink, 0.18);

    vec3 p;
    p.x = uCentre.x + cos(ang) * r;
    p.z = uCentre.y + sin(ang) * r;
    p.y = -6.0 - depth;

    /* In fast at the top, out slowly at the bottom of the cone. */
    vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.55, 1.0, life));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (260.0 / -mv.z), 1.0, 14.0);
  }
`,Fl=`
  precision mediump float;
  uniform vec3  uColor;
  uniform float uGain;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    /* A ring, not a disc — these are bubbles, and a bubble seen in murk is a
       bright rim around a darker middle. */
    float a = smoothstep(0.5, 0.2, d) - smoothstep(0.3, 0.05, d) * 0.6;
    float k = a * vFade * uGain;
    if (k < 0.02) discard;
    gl_FragColor = vec4(uColor, k * 0.8);
  }
`,Zs={low:260,mid:700,high:1300},Pl=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,Gl=`
  precision mediump float;
  uniform float uTime;
  uniform float uDir;
  uniform float uGain;
  uniform vec3  uColor;
  uniform vec3  uDeep;
  uniform vec3  uCameraPos;
  uniform float uFogDensity;
  uniform vec3  uFogColor;
  varying vec2 vUv;
  varying vec3 vWorld;

  void main() {
    /* uv.x runs around the cone, uv.y from the throat (0) to the ceiling (1) —
       the geometry is built apex-down, so height IS the wind of the spiral. */
    float a = vUv.x * 6.2831853;
    float h = vUv.y;

    /* Three arms, wound tighter toward the throat and turning with time. The
       rate rises as the radius shrinks, which is the one detail that makes a
       drain look like a drain rather than like a spinning cone. */
    float wind = mix(34.0, 8.0, h);
    float s = sin(a * 3.0 * uDir + h * wind - uTime * (2.6 + (1.0 - h) * 2.2) * uDir);
    float arms = smoothstep(0.05, 0.92, s);

    /* A second, finer set running the other way: real white water is not three
       clean ribbons, it is shear. */
    float s2 = sin(a * 7.0 * uDir - h * 19.0 + uTime * 1.7 * uDir);
    arms = clamp(arms + smoothstep(0.55, 1.0, s2) * 0.45, 0.0, 1.0);

    /* Open at the ceiling, closed at the point. Fading IN at the top matters:
       the wall has to emerge from the underside of the sea rather than start
       at a hard rim, or the surface grows a visible collar. */
    /* Open at the ceiling, tapering away into the dark at the bottom rather
       than stopping — the wall runs to the seabed now, and a hard end a
       kilometre down reads as a cut-off pipe. */
    float fade = smoothstep(0.0, 0.06, h) * (1.0 - smoothstep(0.88, 1.0, h));
    float k = arms * fade * uGain;
    if (k < 0.015) discard;

    vec3 col = mix(uDeep, uColor, arms);

    /* Fog, applied by hand because this is a raw ShaderMaterial — but at HALF
       density, and that is a deliberate lie.
       Straight exp2 at the depth fog's own density gives 250m of visibility,
       and a maelstrom is nine hundred metres of moving water: the honest
       version is invisible from anywhere you would actually decide to dive, so
       the player meets it by being inside it. Churning white water genuinely
       does carry further than the murk around it — it is scattering light, not
       absorbing it — so the fudge is in the right direction, and it is the
       difference between a hazard you navigate and one that happens to you. */
    float d = length(uCameraPos - vWorld);
    float f = 1.0 - exp(-pow(d * uFogDensity * 0.22, 2.0));
    col = mix(col, uFogColor, clamp(f, 0.0, 1.0) * 0.6);

    gl_FragColor = vec4(col, k * 0.62 * (1.0 - f * 0.4));
  }
`,qs=1100;function Ol({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=Me(h=>h.camera),i=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,c=new Pa(e.r*1.02,e.r*.07,qs,h,6,!0);return c.translate(e.x,-qs/2-3,e.z),c},[e,o]),l=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new S(...ie(X.foam))},uDeep:{value:new S(...ie(X.underGlow))},uCameraPos:{value:new S},uFogDensity:{value:.0062},uFogColor:{value:new S(...ie(X.underHaze))}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c,d.uCameraPos.value.copy(h.camera.position),d.uFogDensity.value=h.scene.fog?.density??.0062;const b=h.scene.fog?.color;b&&d.uFogColor.value.set(b.r,b.g,b.b);const g=Math.hypot(r.position.x-e.x,r.position.z-e.z),m=1-R.smoothstep(g,e.r*8,e.r*24);d.uGain.value+=(y.underwater*m-d.uGain.value)*Math.min(1,c*4),s.current&&(s.current.visible=d.uGain.value>.012)}),t.jsx("mesh",{ref:s,geometry:i,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Pl,fragmentShader:Gl,uniforms:l,transparent:!0,depthWrite:!1,side:_e,blending:pt,fog:!1})})}function Dl({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=Me(h=>h.camera),i=w.useMemo(()=>{const h=Zs[o]??Zs.high,c=new Float32Array(h*3),d=new Float32Array(h),b=new Float32Array(h),g=new Float32Array(h),m=new Float32Array(h),f=new Float32Array(h);for(let x=0;x<h;x++)d[x]=Math.random()*Math.PI*2,b[x]=Math.random(),g[x]=.07+Math.random()*.1,m[x]=.12+Math.pow(Math.random(),1.8)*.5,f[x]=2+Math.random()*5;const p=new Dt;return p.setAttribute("position",new ne(c,3)),p.setAttribute("aAngle",new ne(d,1)),p.setAttribute("aPhase",new ne(b,1)),p.setAttribute("aRate",new ne(g,1)),p.setAttribute("aRadius",new ne(m,1)),p.setAttribute("aSize",new ne(f,1)),p.boundingSphere=new lo(new S(e.x,-60,e.z),e.r+140),p},[o,e]),l=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new Kn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new S(...ie(X.underGlow))},uGain:{value:0}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c;const b=Math.hypot(r.position.x-e.x,r.position.z-e.z),g=1-R.smoothstep(b,e.r*1.2,e.r*4);d.uGain.value=y.underwater*g,s.current&&(s.current.visible=d.uGain.value>.015)}),t.jsx("points",{ref:s,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Ll,fragmentShader:Fl,uniforms:l,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function Nl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Cl,{quality:e}),Be.map((o,n)=>t.jsx(Dl,{whirl:o,quality:e},n)),Be.map((o,n)=>t.jsx(Ol,{whirl:o,quality:e},`w${n}`))]})}const nn=16/9,Ja=96,er=78;function On(e,o,n=Ja){if(!o||o>=nn)return e;const s=R.degToRad(e)/2,r=2*Math.atan(Math.tan(s)*nn/o);return Math.min(n,R.radToDeg(r))}function tr(e){return!e||e>=nn?1:R.clamp(.72+.28*(e/nn),.86,1)}function Dn(e,o,n,s=.06,r=Ja){const i=On(o,e.aspect,r);Math.abs(e.fov-i)<=.05||(e.fov+=(i-e.fov)*(1-Math.pow(s,n)),e.updateProjectionMatrix())}function Nn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*R.clamp(1280/o,.55,2.2)}const or="oni.settings.v1";function Hl(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const ve={comfort:0,lookSens:1,invertY:!1,freeCam:!1,hud:!0},Hn=new Set;function _l(){for(const e of Hn)e(ve)}function as(e){return Hn.add(e),()=>Hn.delete(e)}function rs(e,o){e in ve&&(ve[e]=o,Wl(),_l())}function eo(e){rs(e,!ve[e])}function Bl(){rs("comfort",ve.comfort<.01?.55:ve.comfort<.9?1:0)}function Ul(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=ve.lookSens-1e-6);rs("lookSens",e[(o+1)%e.length])}function Wl(){try{localStorage.setItem(or,JSON.stringify(ve))}catch{}}function Yl(){let e=null;try{e=JSON.parse(localStorage.getItem(or)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(ve))o!=="hud"&&typeof e[o]==typeof ve[o]&&(ve[o]=e[o]);else ve.comfort=Hl()?1:0;return ve}const Oe=(e,o)=>e+(o-e)*ve.comfort,fo=e=>e<-1?-1:e>1?1:e,C={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,jumpQueued:!1,boardQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},It={level:0},_n=new Set;function Vl(e){return _n.add(e),()=>_n.delete(e)}function is(e){if(It.level===e)return e;It.level=e;for(const o of _n)o(e);return e}function nr(){return is((It.level+1)%3)}const ee={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},yo=new Set,ft=(...e)=>e.some(o=>yo.has(o));function sr(){C.throttle=0,C.rudder=0,C.planes=0,C.boost=!1,C.walk.x=0,C.walk.z=0,C.surfaceQueued=!1,C.periscopeQueued=!1,C.burstQueued=!1,C.recentreQueued=!1,C.jumpQueued=!1,C.boardQueued=!1,C.zoom=0,C.pistolQueued=!1,C.bazookaQueued=!1,C.gigantQueued=!1,C.rocketQueued=!1,C.hakiQueued=!1,C.gear2Queued=!1,C.gatlingHeld=!1,C.balloonHeld=!1,ee.gatling=!1,ee.balloon=!1,is(0),ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0,yo.clear()}function $l(){const e=r=>!!r&&(r.isContentEditable||/^(input|textarea|select)$/i.test(r.tagName??"")),o=r=>{if(r.metaKey||r.ctrlKey||r.altKey||e(r.target))return;const i=r.key.toLowerCase();yo.add(i),i==="f"&&(C.surfaceQueued=!0),i==="p"&&(C.periscopeQueued=!0),i==="b"&&!r.repeat&&(C.burstQueued=!0),i==="r"&&!r.repeat&&(C.recentreQueued=!0),i==="v"&&!r.repeat&&eo("freeCam"),i==="."&&!r.repeat&&eo("hud"),i==="x"&&!r.repeat&&nr(),i===" "&&!r.repeat&&(C.jumpQueued=!0),i==="t"&&!r.repeat&&(C.boardQueued=!0),i==="j"&&!r.repeat&&(C.pistolQueued=!0),i==="k"&&!r.repeat&&(C.bazookaQueued=!0),i==="l"&&!r.repeat&&(C.gigantQueued=!0),i==="g"&&!r.repeat&&(C.rocketQueued=!0),i==="h"&&!r.repeat&&(C.hakiQueued=!0),i==="n"&&!r.repeat&&(C.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(i)&&r.preventDefault()},n=r=>yo.delete(r.key.toLowerCase()),s=()=>sr();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",s),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",s),yo.clear()}}function Kl(){const e=ft("w","arrowup")?1:0,o=ft("s","arrowdown")?1:0,n=ft("a","arrowleft")?1:0,s=ft("d","arrowright")?1:0,r=ft("q"," ")?1:0,i=ft("e","c")?1:0,l=fo(e-o+ee.throttle);l<-.05&&It.level&&is(0),C.throttle=It.level>0?Math.max(l,1):l,C.rudder=fo(n-s+ee.rudder),C.planes=fo(r-i+ee.planes),C.boost=ft("shift")||ee.boost||It.level===2,C.zoom=(ft("]","=","+")?1:0)-(ft("[","-","_")?1:0),C.gatlingHeld=ft("u")||ee.gatling,C.balloonHeld=ft("i")||ee.balloon,C.walk.x=fo(s-n+ee.walk.x),C.walk.z=fo(e-o+ee.walk.z)}const Bn=[0,(Ie[0].y+Ie[1].y)/2,Ie[0].z],ar=[he.x,he.y,he.z],sn=W.dir,rr=[W.x+sn[0]*300,-36,W.z+sn[1]*300],ir=[W.x+sn[0]*46,34,W.z+sn[1]*46],lr=[W.gate.x,4,W.gate.z],cr=[W.gate.x,22,W.gate.z],Xl=1.55,Un=_/Xl,Ql=1+(Un-1)*.35,jt=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Bn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:rr,to:ir,lookFrom:lr,lookTo:cr,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:ar,lookTo:Bn,swell:0}],Zl=new Set([Bn,ar,rr,ir,lr,cr]),Fo=e=>Zl.has(e)?e:[e[0]*Un,e[1]*Ql,e[2]*Un];for(const e of jt)e.from=Fo(e.from),e.to=Fo(e.to),e.lookFrom=Fo(e.lookFrom),e.lookTo=Fo(e.lookTo);const Wn=jt.reduce((e,o)=>e+o.dur,0),Js=jt,ql=e=>e*e*(3-2*e),Jl=e=>1-Math.pow(1-e,2.2),Po=e=>new S(e[0],e[1],e[2]),Pt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function ec(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,s=new Map;let r=0,i=null;const l=(g,m)=>{const f=y.orbit,p=f.dist*.0016,x=Math.cos(f.yaw),u=-Math.sin(f.yaw);f.target.x-=x*g*p,f.target.z-=u*g*p;const v=Math.cos(f.pitch),z=Math.sin(f.pitch);f.target.y+=m*p*v,f.target.x+=Math.sin(f.yaw)*m*p*z,f.target.z+=Math.cos(f.yaw)*m*p*z,hr()},h=g=>{s.set(g.pointerId,{x:g.clientX,y:g.clientY});try{n.setPointerCapture?.(g.pointerId)}catch{}if(s.size===2){const[m,f]=[...s.values()];r=Math.hypot(m.x-f.x,m.y-f.y),i={x:(m.x+f.x)/2,y:(m.y+f.y)/2}}},c=g=>{const m=s.get(g.pointerId);if(!m)return;const f=g.clientX-m.x,p=g.clientY-m.y;if(m.x=g.clientX,m.y=g.clientY,s.size>=2){const[x,u]=[...s.values()],v=Math.hypot(x.x-u.x,x.y-u.y),z={x:(x.x+u.x)/2,y:(x.y+u.y)/2};if(r>8&&v>8){const E=y.orbit;E.dist=R.clamp(E.dist*(r/v),...Pt.dist)}i&&l(z.x-i.x,z.y-i.y),r=v,i=z,g.cancelable&&g.preventDefault();return}if(g.shiftKey||g.buttons===4)l(f,p);else{const x=y.orbit;x.yaw-=f*.005*Nn(),x.pitch=R.clamp(x.pitch+p*.004*Nn(),...Pt.pitch)}g.cancelable&&g.preventDefault()},d=g=>{s.delete(g.pointerId)&&s.size<2&&(r=0,i=null)},b=g=>{g.preventDefault();const m=y.orbit;m.dist=R.clamp(m.dist*(1+Math.sign(g.deltaY)*.11),...Pt.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",c,{passive:!1}),n.addEventListener("pointerup",d),n.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),n.addEventListener("wheel",b,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",c),n.removeEventListener("pointerup",d),n.removeEventListener("pointercancel",d),window.removeEventListener("pointerup",d),n.removeEventListener("wheel",b),s.clear()}},[e,o])}function hr(){const e=y.orbit;e.target.x=R.clamp(e.target.x,-4200,Pt.xz),e.target.z=R.clamp(e.target.z,-4200,Pt.xz),e.target.y=R.clamp(e.target.y,...Pt.y)}function tc({onRails:e,playing:o,speed:n=1,onShot:s,idle:r=!1}){const i=Me(b=>b.camera),l=Me(b=>b.gl),h=w.useRef(0),c=w.useRef(-1),d=w.useRef(new S(0,150,-260));return ec(!e&&!r,l),w.useEffect(()=>{if(e)return;const b=y.orbit,g=i.position.clone().sub(b.target);b.dist=R.clamp(g.length(),...Pt.dist),b.yaw=Math.atan2(g.x,g.z),b.pitch=Math.asin(R.clamp(g.y/(g.length()||1),-1,1))},[e,i]),se((b,g)=>{if(r)return;const m=Math.min(g,.05);if(y.t+=m,e){if(y.jumpTo!=null){let A=0;for(let M=0;M<y.jumpTo&&M<jt.length;M++)A+=jt[M].dur;h.current=A,y.jumpTo=null}o&&(h.current=(h.current+m*n)%Wn);let v=0,z=0;for(;z<jt.length&&!(h.current<v+jt[z].dur);z++)v+=jt[z].dur;const E=jt[Math.min(z,jt.length-1)],j=R.clamp((h.current-v)/E.dur,0,1);c.current!==z&&(c.current=z,y.shot=z,s?.(z,E));const I=Po(E.from).lerp(Po(E.to),Jl(j)),a=Po(E.lookFrom).lerp(Po(E.lookTo),ql(j)),k=E.swell??0;if(k>0){const A=y.t;I.y+=Math.sin(A*.62)*3.1*k+Math.sin(A*1.31+1.2)*1.2*k,I.x+=Math.sin(A*.44+.6)*2.2*k}I.x+=Math.sin(y.t*.83)*.35,I.y+=Math.sin(y.t*1.17+2)*.28,i.position.copy(I),d.current.lerp(a,1-Math.pow(1e-4,m)),i.lookAt(d.current),k>0&&i.rotateZ(Math.sin(y.t*.51)*.024*k);const L=On(E.fov,i.aspect);Math.abs(i.fov-L)>.01&&(i.fov+=(L-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.progress=h.current/Wn}else{const v=y.orbit;C.recentreQueued&&(C.recentreQueued=!1,v.target.set(P.x,P.baseY*.55,P.z),v.dist=R.clamp(v.dist,260,1400));const z=C.walk.x,E=C.walk.z;if(z||E||C.planes||C.zoom){const a=v.dist*(C.boost?1.9:.7)*m,k=-Math.sin(v.yaw),L=-Math.cos(v.yaw);v.target.x+=(k*E-L*z)*a,v.target.z+=(L*E+k*z)*a,v.target.y+=C.planes*a,v.dist=R.clamp(v.dist*(1-C.zoom*.9*m),...Pt.dist),hr()}const j=Math.cos(v.pitch);i.position.set(v.target.x+Math.sin(v.yaw)*j*v.dist,v.target.y+Math.sin(v.pitch)*v.dist,v.target.z+Math.cos(v.yaw)*j*v.dist),i.lookAt(v.target);const I=On(55,i.aspect);Math.abs(i.fov-I)>.01&&(i.fov+=(I-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.t+=0}const f=Mo(i.position.x,i.position.z);y.shelter+=(f-y.shelter)*(1-Math.pow(.06,m)),y.fog=R.lerp(Gt.sea,Gt.bay,y.shelter),y.rain=1-y.shelter*.92;const p=xt(i.position.x,i.position.z,y.t,1),x=R.clamp((p.y-i.position.y-1)/3,0,1);y.underwater+=(x-y.underwater)*(1-Math.pow(.002,m)),y.depthBelow=Math.max(0,p.y-i.position.y);const u=R.lerp(8200,1700,y.underwater);Math.abs(i.far-u)>20&&(i.far=u,i.updateProjectionMatrix()),b.camera.updateMatrixWorld()}),null}const ea={low:[24,16],mid:[40,26],high:[56,36]};function oc({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useMemo(()=>{const[m,f]=ea[e]??ea.high,p=new Er(1,m,f),x=p.attributes.position,u=new Float32Array(x.count*3),[v,z,E]=Fe.centre,[j,I,a]=Fe.radii,k=new Se("#241c22"),L=new Se(T.rockWarm),A=new Se;for(let M=0;M<x.count;M++){const G=x.getX(M),F=x.getY(M),O=x.getZ(M),oe=1+(to(G*2.4+5,O*2.4-9,3)-.5)*.14;x.setXYZ(M,v+G*j*oe,z+F*I*oe,E+O*a*oe);const ue=R.clamp((F+.2)/1.2,0,1);A.copy(k).lerp(L,(1-ue)*.55),u[M*3]=A.r,u[M*3+1]=A.g,u[M*3+2]=A.b}return p.setAttribute("color",new ne(u,3)),p.computeVertexNormals(),p},[e]),{stairM:i,brazierM:l,bayM:h,tableM:c,jarM:d,westStairM:b}=w.useMemo(()=>{const m=new at,f=new yt,p=new S(1,1,1),x=new S,u=[];for(let D=0;D<dt.steps;D++){const $=D/(dt.steps-1);x.set(0,R.lerp(De.y,le.y+2,$),R.lerp(dt.zTop,dt.zBottom,$)),f.identity(),u.push(m.clone().compose(x,f,p))}const v=[],z=e==="low"?5:9;for(const D of[-1,1])for(let $=0;$<z;$++){const Q=$/(z-1);x.set(D*176,le.y+9,R.lerp(le.zFront-40,le.zBack+40,Q)),f.identity(),v.push(m.clone().compose(x,f,p))}for(let D=0;D<6;D++)x.set(-110+D*44,le.y+9,N.z+N.halfZ+54),f.identity(),v.push(m.clone().compose(x,f,p));const E=[],j=e==="low"?5:9;for(const D of[-1,1])for(let $=0;$<ye.tiers;$++)for(let Q=0;Q<j;Q++){const ae=Q/(j-1);x.set(D*(ye.x-$*26),ye.y+$*ye.tierRise,R.lerp(-205,ye.halfZ,ae)),f.identity(),E.push(m.clone().compose(x,f,p))}const I=[],a=[],k=new yt,L=new S(0,1,0);let A=24301;const M=()=>(A=Math.imul(A,1664525)+1013904223>>>0,A/4294967296),G=e==="low"?1:2,F=e==="low"?5:8;for(const D of[-1,1])for(let $=0;$<G;$++)for(let Q=0;Q<F;Q++){const ae=D*(96+$*52+(M()-.5)*14),be=R.lerp(le.zBack+120,le.zFront-60,Q/(F-1))+(M()-.5)*16;if(!(Math.abs(ae)<Te.halfX+24&&Math.abs(be-Te.z)<Te.halfZ+20)&&!(Math.abs(Math.abs(ae)-ge.x)<26&&be<ge.zFoot+16&&be>ge.zTop-8)){x.set(ae,le.y+2.4,be),k.setFromAxisAngle(L,(M()-.5)*.5),I.push(m.clone().compose(x,k,p));for(let de=0;de<2;de++)x.set(ae+(M()-.5)*30,le.y+3.5,be+(M()>.5?8:-8)+(M()-.5)*6),k.setFromAxisAngle(L,M()*Math.PI),a.push(m.clone().compose(x,k,p))}}const O=[],oe=16,ue=D=>D*D*(3-2*D);for(let D=0;D<=oe;D++){const $=D/oe;x.set(-252,ue($)*(ye.y-.5)-1.3,R.lerp(45,-45,$)),f.identity(),O.push(m.clone().compose(x,f,p))}return{stairM:u,brazierM:v,bayM:E,tableM:I,jarM:a,westStairM:O}},[e]);se(()=>{const m=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(m*4.1)*.3+Math.sin(m*9.3)*.15),s.current&&(s.current.material.emissiveIntensity=.85+Math.sin(m*.9)*.12)});const g=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:r,side:Tn,receiveShadow:g,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Tn,roughness:.97,metalness:.02})}),[[0,(le.zFront+Te.z+Te.halfZ)/2,le.halfX*2,le.zFront-Te.z-Te.halfZ],[0,(le.zBack+Te.z-Te.halfZ)/2,le.halfX*2,Te.z-Te.halfZ-le.zBack],[-342/2-20,Te.z,le.halfX*2-Te.halfX*2,Te.halfZ*2],[(Te.halfX+le.halfX)/2+20,Te.z,le.halfX*2-Te.halfX*2,Te.halfZ*2]].map(([m,f,p,x],u)=>t.jsxs("mesh",{position:[m,le.y-3,f],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[Math.abs(p),6,Math.abs(x)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},u)),t.jsxs("mesh",{ref:s,position:[Te.x,qe.ceiling+2,Te.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[Te.halfX*2,Te.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:_e})]}),t.jsxs("mesh",{position:[0,De.y-4,De.z],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[De.halfX*2.6,8,De.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,i.length],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[dt.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(nc,{matrices:i})]}),[-1,1].map(m=>Array.from({length:ye.tiers},(f,p)=>t.jsxs("mesh",{position:[m*(ye.x-p*26),ye.y+p*ye.tierRise-4,0],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[76-p*6,7,ye.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]},`${m}-${p}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:T.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(ic,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(sc,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(ac,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,b.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(rc,{matrices:b})]}),t.jsxs("instancedMesh",{args:[null,null,l.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(lc,{matrices:l})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:T.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(cc,{matrices:l})]}),t.jsxs("mesh",{position:[0,qe.y-4,0],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[qe.halfX*2,8,qe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(m=>[-1,0,1].map(f=>t.jsxs("mesh",{position:[m*120,(qe.y+le.y)/2,f*96],castShadow:g,children:[t.jsx("boxGeometry",{args:[26,Math.abs(le.y-qe.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${m}-${f}`)))]})}function nc({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function sc({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function ac({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function rc({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function ic({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function lc({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o})}function cc({matrices:e}){const o=w.useRef();return t.jsx(Wt,{matrices:e,selfRef:o,offsetY:9})}function Wt({matrices:e,offsetY:o=0}){const n=w.useRef(),s=w.useRef(!1);return se(()=>{if(s.current)return;const r=n.current?.parent;if(!r?.isInstancedMesh)return;const i=new at,l=new at().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,r.count);h++)i.copy(e[h]).multiply(l),r.setMatrixAt(h,i);r.instanceMatrix.needsUpdate=!0,r.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:n})}const ta=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),r=s.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);r.addColorStop(0,"#fff3c4"),r.addColorStop(.32,"#ffc95e"),r.addColorStop(.66,"#e06120"),r.addColorStop(1,"#7e1c14"),s.fillStyle=r,s.fillRect(0,0,e,o),s.globalAlpha=.14,s.fillStyle="#fff3c4";for(let l=0;l<12;l++){const h=l/12*Math.PI*2;s.save(),s.translate(e/2,o*.62),s.rotate(h),s.fillRect(-3,0,6,e),s.restore()}s.globalAlpha=.22,s.fillStyle="#5e1610";for(let l=8;l<e;l+=22)s.fillRect(l,0,3,o);s.globalAlpha=1;const i=new ro(n);return i.colorSpace=io,i})();function hc(e,o,n,s){const r=e+s,i=o+s,l=new Float32Array([-r,0,i,r,0,i,e*.18,n,o*.18,-r,0,i,e*.18,n,o*.18,-e*.18,n,o*.18,r,0,i,r,0,-i,e*.18,n,-o*.18,r,0,i,e*.18,n,-o*.18,e*.18,n,o*.18,r,0,-i,-r,0,-i,-e*.18,n,-o*.18,r,0,-i,-e*.18,n,-o*.18,e*.18,n,-o*.18,-r,0,-i,-r,0,i,-e*.18,n,o*.18,-r,0,-i,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new Dt;return h.setAttribute("position",new ne(l,3)),h.computeVertexNormals(),h}function uc({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=ot("keep-hf.opt.glb"),i=w.useMemo(()=>{const h=[];for(let c=0;c<N.storeys;c++){const d=1-(c+1)*N.taper,b=N.plinth+c*N.storey;h.push({i:c,y:b,halfX:N.halfX*d,halfZ:N.halfZ*d,roof:hc(N.halfX*d,N.halfZ*d,c===N.storeys-1?30:16,11)})}return h},[]);se(()=>{const h=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),s.current&&(s.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const l=o;return t.jsxs("group",{position:[0,N.baseY,N.z],children:[t.jsxs("mesh",{position:[0,N.plinth/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[N.halfX*2.2,N.plinth,N.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),r&&t.jsx(xe,{name:"keep-hf.opt.glb",height:N.plinth+N.storeys*N.storey+26,position:[0,N.plinth*.5,0],tint:"#9a8468",emissive:T.emberDeep,emissiveIntensity:.14}),!r&&i.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,N.storey/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2,N.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,N.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,N.storey*.38]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,N.storey*.02,h.halfZ+8],castShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,N.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,N.storey,0],castShadow:l,receiveShadow:l,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,N.plinth+N.storeys*N.storey+30,0],rotation:[0,0,h*.4],castShadow:l,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,Re.y,Re.z-N.z],children:[t.jsxs("mesh",{castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[Re.halfX*2,7,Re.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[Re.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:"#ffffff",emissiveMap:ta,map:ta,emissiveIntensity:2.2,toneMapped:!1,side:_e})]}),t.jsx(xe,{name:"oni-throne.opt.glb",height:ce("oni-throne.opt.glb"),position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],scale:ce("oni-throne.opt.glb")/38,children:[t.jsxs("mesh",{position:[0,6,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:l,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:l,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(xe,{name:"kagura-stage.opt.glb",height:ce("kagura-stage.opt.glb"),position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:T.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*Re.halfX*.9,28,Re.depth/2-4],castShadow:l,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[Re.halfX*2.3,5,Re.depth+22]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(xe,{name:"oni-daiko.opt.glb",height:ce("oni-daiko.opt.glb"),position:[h*(Re.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,ce("oni-daiko.opt.glb")/2,0],rotation:[0,0,Math.PI/2],scale:ce("oni-daiko.opt.glb")/22,children:t.jsxs("mesh",{castShadow:l,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(dc,{})]})]})}function dc(){const e=w.useRef(),o=w.useRef(!1);return se(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const s=new at,r=new S,i=new yt,l=new S(1,1,1);for(let h=0;h<n.count;h++){const c=h/(n.count-1)*2-1;r.set(c*(N.halfX+26),Re.y+74-(1-c*c)*20,N.halfZ+22),n.setMatrixAt(h,s.compose(r,i,l))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function pc({shadows:e=!0}){const{slabs:o,flights:n,tower:s}=Ha,r=w.useMemo(()=>{const i=[],l=h=>h*h*(3-2*h);for(const h of n)for(let d=0;d<=9;d++){const b=d/9;i.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*l(b)-1.2,R.lerp(h.z0,h.z1,b)])}return i},[n]);return t.jsxs("group",{children:[[s.x[0]+1,s.x[1]-1].map(i=>[s.z[0]+1,s.z[1]-1].map(l=>t.jsxs("mesh",{position:[i,128,l],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${i}${l}`))),t.jsxs("instancedMesh",{args:[null,null,r.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(fc,{points:r})]}),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(c),3.2,Math.abs(d)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l+5,h+Math.abs(d)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(c),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})]},`r${b}`))]})}function fc({points:e}){const o=w.useRef(),n=w.useRef(!1);return se(()=>{if(n.current)return;const s=o.current?.parent;if(!s?.isInstancedMesh)return;const r=new at,i=new yt,l=new S(1,1,1),h=new S;for(let c=0;c<Math.min(e.length,s.count);c++)h.set(e[c][0],e[c][1],e[c][2]),s.setMatrixAt(c,r.compose(h,i,l));s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function mc({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],r=i=>i*i*(3-2*i);for(const i of[-1,1])for(let l=0;l<=20;l++){const h=l/20;n.push({x:i*ge.x,y:r(h)*Ft,z:R.lerp(ge.zFoot,ge.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,s)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[ge.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.75})]},s)),[-1,1].map(n=>{const s=i=>i*i*(3-2*i),r=i=>{const l=[];for(let h=0;h<=16;h++){const c=h/16;l.push(new S(n*ge.x+i,s(c)*Ft+7,R.lerp(ge.zFoot,ge.zTop,c)))}return new ao(new so(l),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:r(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:r(ge.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})})]},n)})]})}function gc({shadows:e=!0}){const o=w.useMemo(()=>Eo.map(([,,n,s])=>{const r=[];for(let i=0;i<=12;i++){const l=i/12*2-1;r.push(new S(l*n*.5,s*(1-l*l),0))}return new ao(new so(r),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[Eo.map(([n,s],r)=>t.jsxs("group",{position:[0,n,s],children:[t.jsx("mesh",{geometry:o[r],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.74})}),[-7,7].map(i=>t.jsx("mesh",{geometry:o[r],position:[0,7,i],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})},i))]},r)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,Eo[0][0]-12,Eo[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,le.y,0]})]})}function ur(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function xc({quality:e,shadows:o}){const n=w.useMemo(()=>{const r=ur(712273),i=[],l=e==="low"?34:e==="mid"?68:108;let h=0;for(;i.length<l&&h<l*40;){h++;const c=(r()*2-1)*(le.halfX-30),d=R.lerp(le.zBack+40,le.zFront-30,r());Math.abs(c)<62&&d>N.z+120||Math.abs(c)<70&&Math.abs(d-84)<58||Math.abs(Math.abs(c)-ge.x)<24&&d<ge.zFoot+18&&d>ge.zTop-10||i.push({x:c,z:d,kind:i.length%4,rot:r()*Math.PI*2,k:.82+r()*.5})}return i},[e]),s=o;return t.jsx(t.Fragment,{children:n.map((r,i)=>{const l=[r.x,le.y,r.z];if(r.kind===0){const c=ce("sake-tower.opt.glb")*r.k,d=c*.24;return t.jsx(xe,{name:"sake-tower.opt.glb",height:c,position:l,rotation:r.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:l,children:[0,1,2].map(b=>t.jsxs("mesh",{position:[0,c*(.17+b*.3),0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[d-b*d*.16,d-b*d*.16,c*.29,10]}),t.jsx("meshStandardMaterial",{color:b%2?"#c9a86a":"#8e6a3c",roughness:.92})]},b))})},i)}if(r.kind===1){const c=ce("oni-guardian.opt.glb")*r.k;return t.jsx(xe,{name:"oni-guardian.opt.glb",height:c,position:l,rotation:r.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.17,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[c*.43,c*.33,c*.43]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,c*.6,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[c*.2,c*.33,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*c*.13,c*.93,0],rotation:[0,0,d*.5],castShadow:s,children:[t.jsx("coneGeometry",{args:[c*.067,c*.27,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},d))]})},i)}if(r.kind===2){const c=ce("wisteria-trellis.opt.glb")*r.k;return t.jsx(xe,{name:"wisteria-trellis.opt.glb",height:c,position:l,rotation:r.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.94,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[c*.7,c*.07,c*.07]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-.26,-.09,.09,.26].map(d=>t.jsxs("mesh",{position:[d*c,c*.47,0],children:[t.jsx("coneGeometry",{args:[c*.1,c*.88,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},d))]})},i)}const h=al*4*r.k;return t.jsxs("group",{position:l,rotation:[0,r.rot,0],children:[t.jsxs("mesh",{position:[0,h/2,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[h*.021,h*.021,h,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[h*.12,h*.65,0],children:[t.jsx("planeGeometry",{args:[h*.235,h*.7]}),t.jsx("meshStandardMaterial",{color:i%2?T.vermilion:"#e8dcc4",roughness:.95,side:_e,emissive:i%2?T.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},i)})})}function bc({shadows:e}){const o=w.useMemo(()=>{const n=ur(10560325),s=[];for(let r=0;r<52;r++)s.push({x:(n()*2-1)*(qe.halfX-40),z:(n()*2-1)*(qe.halfZ-40),rot:n()*Math.PI*2,keg:r%2===0});return s},[]);return t.jsx(t.Fragment,{children:o.map((n,s)=>n.keg?t.jsx(xe,{name:"powder-keg.opt.glb",height:ce("powder-keg.opt.glb"),position:[n.x,qe.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,qe.y+ce("powder-keg.opt.glb")*.5,n.z],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb"),10]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},s):t.jsx(xe,{name:"war-cannon.opt.glb",height:ce("war-cannon.opt.glb"),position:[n.x,qe.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,qe.y+ce("war-cannon.opt.glb")*.42,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("war-cannon.opt.glb")*.18,ce("war-cannon.opt.glb")*.23,ce("war-cannon.opt.glb")*1.9,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},s))})}function wc(){const e=Me(o=>o.camera);return se((o,n)=>{const s=Math.min(n,.05),r=(e.position.x-fe.x-Fe.centre[0])/Fe.radii[0],i=(e.position.y-fe.y-Fe.centre[1])/Fe.radii[1],l=(e.position.z-fe.z-Fe.centre[2])/Fe.radii[2],h=Math.sqrt(r*r+i*i+l*l),c=R.clamp(1-(h-1)/.5,0,1);y.inside+=(c-y.inside)*(1-Math.pow(.02,s))}),null}function yc({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[fe.x,fe.y,fe.z],children:[t.jsx(wc,{}),t.jsx(oc,{quality:e,shadows:o}),t.jsx(uc,{quality:e,shadows:o}),t.jsx(gc,{shadows:o}),t.jsx(mc,{shadows:o}),t.jsx(pc,{shadows:o}),t.jsx(xc,{quality:e,shadows:o}),t.jsx(bc,{shadows:o}),[-1,1].flatMap(n=>[0,1,2,3,4].map(s=>t.jsx(xe,{name:"banquet-table.opt.glb",height:ce("banquet-table.opt.glb"),position:[n*(74+s%2*22),le.y,N.z+186+s*34],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}-${s}`))),t.jsx(xe,{name:"treasure-kura.opt.glb",height:ce("treasure-kura.opt.glb"),position:[ye.x-74,le.y,N.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsx("group",{position:[ye.x-74,le.y,N.z+96],rotation:[0,-.7,0],children:(()=>{const n=ce("treasure-kura.opt.glb");return t.jsxs(t.Fragment,{children:[[-1,1].map(s=>[-1,1].map(r=>t.jsxs("mesh",{position:[s*n*.3,n*.08,r*n*.22],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.1,n*.16,n*.1]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${s}${r}`))),t.jsxs("mesh",{position:[0,n*.34,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.85,n*.38,n*.65]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,n*.6,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[n*.65,n*.3,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})})()})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1],[-64,22,1.8],[104,-46,.2],[-176,-118,2.7],[18,-142,1.4],[-30,96,.9]].map(([n,s,r],i)=>t.jsx(xe,{name:"bomb-sphere.opt.glb",height:ce("bomb-sphere.opt.glb"),position:[n,qe.y,s],rotation:r,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,qe.y+ce("bomb-sphere.opt.glb")*.5,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[ce("bomb-sphere.opt.glb")*.5,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${i}`)),[-1,1].map(n=>t.jsx(xe,{name:"keep-tier.opt.glb",height:ce("keep-tier.opt.glb"),position:[n*(ye.x-40),ye.y+ye.tiers*ye.tierRise-6,N.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(xe,{name:"arch-bridge.opt.glb",height:ce("arch-bridge.opt.glb"),position:[n*74,le.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(xe,{name:"oni-guardian.opt.glb",height:Lt,position:[n*(De.halfX+26),De.y,De.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(De.halfX+26),De.y,De.z-26],children:[t.jsxs("mesh",{position:[0,Lt*.17,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[Lt*.41,Lt*.33,Lt*.41]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,Lt*.59,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[Lt*.185,Lt*.33,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,Re.y+30,Re.z-N.z+N.z+40],color:T.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,ye.y+120,60],color:T.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,qe.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,De.y+132,De.z-40],color:T.lantern,intensity:13e3,distance:620,decay:2})]})}const vc=Math.PI/2-.14,oa=4;function dr({enabled:e,dom:o,zoomMin:n=.34,zoomMax:s=2.6,zoom0:r=1,pitch0:i=.16,pitchMin:l=-.62,pitchMax:h=vc}){const c=w.useRef({yaw:0,pitch:i,zoom:r,smYaw:0,smPitch:i,smZoom:r,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:l,pitchMax:h,zoomMin:n,zoomMax:s,pitch0:i}).current;return w.useEffect(()=>{if(!e||!o)return;const d=o,b=new Map;let g=0,m=0,f=null;const p=()=>b.size,x=I=>{b.set(I.pointerId,{x:I.clientX,y:I.clientY});try{d.setPointerCapture?.(I.pointerId)}catch{}if(p()===1)c.dragging=!0,f={x:I.clientX,y:I.clientY,t:I.timeStamp};else if(p()===2){c.dragging=!1;const[a,k]=[...b.values()];g=Math.hypot(a.x-k.x,a.y-k.y),f=null}},u=I=>{const a=b.get(I.pointerId);if(!a)return;const k=I.clientX-a.x,L=I.clientY-a.y;if(a.x=I.clientX,a.y=I.clientY,p()>=2){const[M,G]=[...b.values()],F=Math.hypot(M.x-G.x,M.y-G.y);g>8&&F>8&&(c.zoom=R.clamp(c.zoom*(g/F),c.zoomMin,c.zoomMax),c.since=0),g=F;return}if(!c.dragging)return;f&&Math.hypot(I.clientX-f.x,I.clientY-f.y)>14&&(f=null);const A=Nn()*ve.lookSens;c.yaw-=k*.005*A,c.pitch=R.clamp(c.pitch+L*.004*A*(ve.invertY?-1:1),c.pitchMin,c.pitchMax),c.since=0,I.cancelable&&I.preventDefault()},v=I=>{b.has(I.pointerId)&&(b.delete(I.pointerId),p()<2&&(g=0),p()===0&&(c.dragging=!1,f&&I.timeStamp-f.t<260&&(I.timeStamp-m<340?(c.recentre=!0,m=0):m=I.timeStamp),f=null))},z=I=>{I.preventDefault(),c.zoom=R.clamp(c.zoom*(1+Math.sign(I.deltaY)*.1),c.zoomMin,c.zoomMax),c.since=0};d.addEventListener("pointerdown",x),d.addEventListener("pointermove",u,{passive:!1}),d.addEventListener("pointerup",v),d.addEventListener("pointercancel",v),window.addEventListener("pointerup",v);const E=I=>{b.delete(I.pointerId)&&(b.size<2&&(g=0),b.size===0&&(c.dragging=!1))};d.addEventListener("lostpointercapture",E);const j=()=>{b.clear(),g=0,c.dragging=!1};return window.addEventListener("blur",j),d.addEventListener("wheel",z,{passive:!1}),()=>{d.removeEventListener("pointerdown",x),d.removeEventListener("pointermove",u),d.removeEventListener("pointerup",v),d.removeEventListener("pointercancel",v),d.removeEventListener("lostpointercapture",E),window.removeEventListener("pointerup",v),window.removeEventListener("blur",j),d.removeEventListener("wheel",z),b.clear(),c.dragging=!1}},[e,o,c]),c}function Yn(e,o,n=0){if(e.since+=o,C.zoom&&(e.zoom=R.clamp(e.zoom*(1-C.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,C.recentreQueued&&(C.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=oa+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!ve.freeCam&&!e.noRecentre&&!e.dragging&&e.since>oa){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(Oe(.5,.72),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const s=e.dragging?6e-4:Oe(.002,.02),r=1-Math.pow(s,o);let i=e.yaw-e.smYaw;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;e.smYaw+=i*r,e.smPitch+=(e.pitch-e.smPitch)*r,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const na=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeLength:.78,capeUrl:vo("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeLength:.56,capeUrl:vo("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],Mc=e=>na.find(o=>o.id===e)??na[0],jc=.22,sa=13,kc=.09,Sc=.34,aa=9,zc=1.1,Tc=.55,ra=12,Ec=6,Rc=70,Ac=.55,yn=26,Ic=8,Cc=5,ia=.8,Lc=12,Fc=.3,Pc=.13,la=3.4,Gc=32,ca=.65,Oc=1.1,Dc=.5,Nc=6,ha=6,We=new S,mt=new S,mo=new S;function Hc(e,o,n,s,r,i,l,h){let d=0;for(let b=1;b<=16;b++){const g=b/16*l,m=e+s*g,f=o+r*g,p=n+i*g,x=h??re(m,p);if(f<=x){let u=d,v=g;for(let z=0;z<6;z++){const E=(u+v)/2,j=o+r*E,I=h??re(e+s*E,n+i*E);j<=I?v=E:u=E}return v}d=g}return null}function _c(e,o,n,s){const r=Math.min(e,.05),i=Ye.combat,l=Ee.move,h=i.style==="sword";s.x=0,s.y=0,s.z=0,We.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),Ye.lookYaw=Math.atan2(We.x,We.z),Ye.playerFacing=o.yaw,i.bazookaCd=Math.max(0,i.bazookaCd-r),i.gigantCd=Math.max(0,i.gigantCd-r),i.hakiCd=Math.max(0,i.hakiCd-r),i.gear2Cd=Math.max(0,i.gear2Cd-r),n.gear2Queued&&(n.gear2Queued=!1,!i.gear2&&i.gear2Cd<=0&&!h&&(i.gear2=!0,i.gear2T=Ic,Vt(.25),mt.set(o.x,o.y+1,o.z),Ct(mt,1.6,"haki"))),i.gear2&&(i.gear2T=Math.max(0,i.gear2T-r),i.gear2T<=0&&(i.gear2=!1,i.gear2Cd=Cc));const c=i.gear2;i.balloon=R.damp(i.balloon,n.balloonHeld&&!h?1:0,8,r);const d=o.y+o.height*.9,b=Hc(o.x,d,o.z,We.x,We.y,We.z,Rc,o.floorY);Ye.aim.valid=b!=null,b!=null&&(Ye.aim.distance=b,Ye.aim.point.set(o.x,d,o.z).addScaledVector(We,b));const g=!l.kind;if(n.rocketQueued&&(n.rocketQueued=!1,g&&b!=null&&(f(h?"flash":"rocket",Ac),l.target.copy(Ye.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,g&&(f(h?"onigiri":"pistol",h?Fc:jc),l.target.set(o.x,d,o.z).addScaledVector(We,h?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,g&&i.bazookaCd<=0))if(h){const p=Ye.waves.find(x=>!x.active);p&&(p.active=!0,p.k=0,p.pos.set(o.x,d*.92,o.z),p.dir.set(We.x,We.y*.35,We.z).normalize(),i.bazookaCd=Oc,f("wavecast",.22),l.hit=!0,l.target.copy(p.pos).addScaledVector(p.dir,8),Vt(.1))}else f("bazooka",Sc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b,aa):aa),i.bazookaCd=zc;n.gigantQueued&&(n.gigantQueued=!1,g&&i.gigantCd<=0&&(f(h?"sanzen":"gigant",h?Dc:Tc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b+1.5,ra):ra),i.gigantCd=h?Nc:Ec));for(const p of Ye.waves){if(!p.active)continue;const x=p.k;p.k=Math.min(1,p.k+r/ca),p.pos.addScaledVector(p.dir,Gc/ca*r);for(const v of[.35,.68,1])x<v&&p.k>=v&&Ct(p.pos,1.6,"slash");const u=o.floorY==null?re(p.pos.x,p.pos.z):o.floorY;(p.k>=1||p.pos.y<u+.4)&&(p.k<1&&Ct(p.pos,1.6,"slash"),p.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,i.hakiCd<=0&&Ee.hakiT<=0&&(Ee.hakiT=ia,Ee.hakiFired=!1,i.hakiCd=Lc)),Ee.hakiT>0){Ee.hakiT=Math.max(0,Ee.hakiT-r);const p=1-Ee.hakiT/ia;if(i.haki=p,!Ee.hakiFired&&p>.35&&(Ee.hakiFired=!0,mt.set(o.x,o.y,o.z),Ct(mt,3,"haki"),Vt(.9),h))for(let x=0;x<8;x++){const u=x/8*Math.PI*2;mt.set(o.x+Math.cos(u)*ha,o.y+.6,o.z+Math.sin(u)*ha),Ct(mt,1.4,"slash")}}else i.haki=0;const m=n.gatlingHeld&&!l.kind;if(i.gatling=R.damp(i.gatling,m?1:0,14,r),i.gatling>.2&&Ye.gatlingAim.copy(We),m){if(Ee.gatT-=r,Ee.gatT<=0)if(h)Ee.gatT=Pc,Ee.tatsu+=1.9,mt.set(o.x+Math.cos(Ee.tatsu)*la,o.y+.6,o.z+Math.sin(Ee.tatsu)*la),Ct(mt,.7,"slash"),Vt(.04);else{Ee.gatT=kc*(c?.6:1);const p=b!=null?Math.min(b,sa):sa*.85;mt.set(o.x,d,o.z).addScaledVector(We,p),Ct(mt,.8,"punch"),Vt(.05)}}else Ee.gatT=0;if(l.kind){l.t+=r;const p=Math.min(1,l.t/l.dur);if(!l.hit&&p>.45){l.hit=!0;const x=l.kind==="gigant"||l.kind==="sanzen"?3:1.3;if(Ct(l.target,x,h?"slash":"punch"),Vt(l.kind==="gigant"||l.kind==="sanzen"?.7:.18),l.kind==="rocket"||l.kind==="flash"){mo.copy(l.target).sub(mt.set(o.x,o.y,o.z));const u=mo.length()||1;s.x=mo.x/u*yn,s.y=Math.max(0,mo.y/u*yn*.5),s.z=mo.z/u*yn}else(l.kind==="pistol"||l.kind==="onigiri")&&(s.x=We.x*6,s.z=We.z*6)}l.t>=l.dur&&(l.kind=null,l.t=0),i.move=l.kind,i.moveK=l.kind?Math.min(1,l.t/l.dur):0}else i.move=null,i.moveK=0;return Ye.shake=Math.max(0,Ye.shake-r*2.4),s;function f(p,x){l.kind=p,l.t=0,l.dur=x,l.hit=!1}}const Ee={move:{kind:null,t:0,dur:0,hit:!1,target:new S},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function Bc(e="rubber"){const o=Ye.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,Ee.move.kind=null,Ee.move.t=0,Ee.hakiT=0,Ee.gatT=0,Ye.shake=0;for(const n of Ye.waves)n.active=!1}const Go=64,Uc=19,Wc=16,Yc=.92,ua=.52,da=.3,Vc=.04,$c=.0016,Kc=.055,Xc=1.9,Qc=16,Zc=62,qc=9,pa={x:-.45,z:-2.4},fa=.075,Oo=new S,ma=new S;function Xt(e,o){return R.clamp(-re(e,o)/26,0,1)}const Do={x:60*_,z:1050*_},Jc=7,ga=15,Ge=1.85,xa=1.1,eh=26,ba=9.4,wa=21,th=.011;function oh({mode:e,onMode:o,crew:n="luffy",vessel:s="sunny"}){const r=Me(L=>L.camera),i=Me(L=>L.gl),l=w.useRef(),h=w.useRef(),c=w.useRef({speed:0,grounded:!0,maxSpeed:15}),d=w.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,b=w.useRef({x:0,y:0,z:0}).current,g=Mc(n),m=w.useRef(),f=w.useRef(),p=w.useRef(),x=In(s),u=ot(x.hulls[0]),v=ot(x.hulls[1]??""),z=u||v,E=u?x.hulls[0]:v?x.hulls[1]:null,j=E?ln(E,34):30,I=ot(x.crew),a=w.useRef({x:Do.x,z:Do.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,fvy:0,airborne:!1,landing:0,fyaw0:Math.PI,stride:0,area:"hall",dx:0,dz:0,snapCam:!0,boarded:!1}).current,k=dr({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.28,zoomMax:4.2,pitch0:.14,pitchMin:-1,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return a.x=Do.x,a.z=Do.z,a.heading=Math.PI,a.speed=0,a.vx=0,a.vz=0,a.throttle=0,a.flank=0,a.deckY=0,a.snapCam=!0,k.yaw=0,k.smYaw=0,k.pitch=.14,k.smPitch=.14,k.pitch0=.14,k.zoom=1,k.smZoom=1,k.noRecentre=!1,k.pitchMin=-1,k.pitchMax=1.44,a.swallowed=0,a.burst=1,a.burstFx=0,a.slam=0,a.drift=0,a.trim=0,a.bowY=xt(a.x,a.z,y.t,1).y,y.helm=null,Gn("helm"),()=>{y.helmActive=!1}},[e,s,a,k]),w.useEffect(()=>{if(e!=="foot")return;a.fvx=0,a.fvz=0,a.snapCam=!0,Y.chain!=="foot"&&Gn("foot"),Bc(g.weapon==="swords"?"sword":"rubber");const L=(M,G)=>{k.yaw=M,k.smYaw=M,k.pitch=G,k.smPitch=G,k.pitch0=0,k.noRecentre=!0,k.pitchMin=-1.28,k.pitchMax=1.28};a.fvy=0,a.airborne=!1,a.landing=0;const A=y.footSpawn;if(y.footSpawn="hall",A==="deck"){a.area="deck",a.dx=0,a.dz=-j*.2,a.fy=y.ship.y+y.ship.deckY+Ge,a.fyaw=a.heading,L(a.heading+Math.PI,.44);return}if(A==="port"){a.area="island",a.fx=K.x+40*_,a.fz=K.z+40*_,a.fy=re(a.fx,a.fz)+Ge,a.fyaw=Math.atan2(he.x-a.fx,he.z-a.fz),L(a.fyaw+Math.PI,-.06);return}if(A==="rear"){a.area="island",a.fx=W.gate.x+W.dir[0]*26,a.fz=W.gate.z+W.dir[1]*26,a.fy=re(a.fx,a.fz)+Ge,a.fyaw=Math.atan2(-W.dir[0],-W.dir[1]),L(a.fyaw+Math.PI,.02);return}a.area="hall",a.fx=fe.x,a.fy=fe.y+De.y,a.fz=fe.z+dt.zTop,a.fyaw=Math.PI,a.fpitch=-.05,L(0,.05)},[e,a,k]),se((L,A)=>{if(e!=="helm"&&e!=="foot")return;const M=Math.min(A,.05);y.t+=M;const G=e==="helm",F=e==="foot"&&a.area==="deck";if(G||F){const O=a.heading,oe=G?C.throttle:a.order,ue=G?C.rudder:0;G&&(a.order=C.throttle),a.throttle+=(oe-a.throttle)*(1-Math.pow(.02,M)),a.rudder+=(ue-a.rudder)*(1-Math.pow(.005,M)),a.flank+=((G&&C.boost?1:0)-a.flank)*(1-Math.pow(Vc,M));const D=(x.topSpeed??Go)*(1+da*a.flank),$=Math.sin(a.heading),Q=Math.cos(a.heading),ae=Math.cos(a.heading),be=-Math.sin(a.heading);let de=a.vx*$+a.vz*Q,Ce=a.vx*ae+a.vz*be;const J=1-y.shelter,Ae=a.throttle>=0?a.throttle*D:a.throttle*Uc,rt=x.accel??Wc;de+=R.clamp(Ae-de,-rt*2.5,rt)*M,a.burst=Math.min(1,a.burst+M/(x.burst?.charge??qc)),G&&C.burstQueued&&(C.burstQueued=!1,a.burst>=.999&&(a.burst=0,a.burstFx=1,de+=x.burst?.push??Zc,y.splash+=1)),a.burstFx*=Math.pow(.2,M);const Ne=xt(a.x,a.z,y.t,1);de-=(Ne.dx*$+Ne.dz*Q)*Qc*J*M,de-=de*Math.abs(de)*$c*M,Ce-=(Ce*Math.abs(Ce)*Kc+Ce*Xc)*M;const Je=R.clamp(Math.abs(de)/16,0,1);de*=Math.pow(1-.11*Math.abs(a.rudder)*Je,M),a.vx=$*de+ae*Ce,a.vz=Q*de+be*Ce,a.speed=de,a.drift+=(R.clamp(Math.abs(Ce)/11,0,1)-a.drift)*(1-Math.pow(.1,M)),a.heading+=a.rudder*(x.turn??Yc)*Je*Math.sign(de||1)*M;const it=a.x+a.vx*M,vt=a.z+a.vz*M,$e=j*ua,U=it+$*$e,je=vt+Q*$e;if(Xt(U,je)>.06)a.x=it,a.z=vt,a.aground+=(0-a.aground)*(1-Math.pow(.05,M));else{a.aground+=(1-a.aground)*(1-Math.pow(.02,M)),Ut(Math.abs(a.speed)*.0012*M*60,"AGROUND — SHE IS TAKING WATER");const ze=Math.pow(.06,M);a.speed*=ze,a.vx*=ze,a.vz*=ze;const st=6,Yt=Xt(a.x+st,a.z)-Xt(a.x-st,a.z),ho=Xt(a.x,a.z+st)-Xt(a.x,a.z-st),St=Math.hypot(Yt,ho)||1;a.x+=Yt/St*26*M,a.z+=ho/St*26*M}const He=Oa(a.x,a.z,0);a.x+=He.vx*M,a.z+=He.vz*M,a.x+=pa.x*J*M,a.z+=pa.z*J*M;const ct=Ne.dx*ae+Ne.dz*be;a.heading+=R.clamp(ct*.4,-fa,fa)*J*M;let Le=Be[0],H=1/0;for(const ze of Be){const st=(a.x-ze.x)**2+(a.z-ze.z)**2;st<H&&(H=st,Le=ze)}if(qa(M,{danger:He.danger,headingX:Math.sin(a.heading),headingZ:Math.cos(a.heading),toCentreX:Le.x-a.x,toCentreZ:Le.z-a.z,speed:a.speed,throttle:a.throttle})>=1||He.danger>.94){const ze=Le;a.x=ze.x+(ze.x>0?ze.r*1.85:-ze.r*1.85),a.z=ze.z+ze.r*1.5,a.speed=0,a.vx=0,a.vz=0,a.throttle=0,a.heading=Math.PI,a.swallowed+=1,a.aground=1,Y.grip=0,Ut(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const Pe=Mo(a.x,a.z),Ue=R.lerp(1,.055,Pe)*R.smoothstep(Xt(a.x,a.z),0,.3),Z=xt(a.x,a.z,y.t,Ue);y.helmActive=!0,y.helmPos.set(a.x,Z.y+j*.35,a.z),y.helmSpeed=R.clamp(Math.abs(a.speed)/(x.topSpeed??Go),0,1),y.ship.x=a.x,y.ship.y=Z.y,y.ship.z=a.z,y.ship.heading=a.heading,y.ship.loa=j,y.ship.deckY=E?At(E,j):j*.16,y.ship.mastY=E?ko(E,j):j*.6;const te=He.vx*Math.cos(a.heading)-He.vz*Math.sin(a.heading),q=R.clamp(Math.abs(a.speed)/(x.topSpeed??Go),0,1),we=R.clamp(a.rudder*Je*q*.4+te*.016,-.5,.5);a.heel+=(we-Ce*.012-a.heel)*(1-Math.pow(.15,M));const Ve=j*ua,ht=xt(a.x+$*Ve,a.z+Q*Ve,y.t,Ue).y,nt=R.clamp((a.bowY-ht)/Math.max(M,.001),0,60);a.bowY=ht;const Ke=R.clamp((nt-10)/24,0,1)*q*J;if(a.slam=Math.max(a.slam*Math.pow(.05,M),Ke),Ke>.25){const ze=Math.pow(1-.3*Ke,M);a.vx*=ze,a.vz*=ze}const Xe=q*.1*Math.sign(a.speed>=0?1:-1)+a.slam*.14+a.burstFx*.16;a.trim+=(Xe-a.trim)*(1-Math.pow(.1,M));const To=R.clamp(q*J*1.15+a.aground*.5+He.danger*.8+a.slam*1.3+a.burstFx,0,1);a.spray+=(To-a.spray)*(1-Math.pow(.08,M));const Nt=l.current;if(Nt&&(Nt.visible=!0,Nt.position.set(a.x,Z.y,a.z),Nt.rotation.set(R.clamp(Z.dz*1.2,-.3,.3)-a.trim,a.heading,R.clamp(-Z.dx,-.26,.26)+a.heel)),m.current&&(m.current.scale.z=1+Math.sin(y.t*1.6)*.08+a.burstFx*.4,m.current.scale.x=1+J*.06+a.burstFx*.12),f.current&&(f.current.material.opacity=a.spray*.42,f.current.scale.setScalar(.7+a.spray*.55)),p.current&&(p.current.material.opacity=R.clamp(.34*q+a.burstFx*.3,0,.62)*(.28+J*.72),p.current.scale.set(1+q*.75+a.drift*.6,1,1+q*.5)),a.deckY+=(Z.y-a.deckY)*(1-Math.pow(Oe(2e-4,.05),M)),G){Yn(k,M,a.heading-O);const ze=a.heading+Math.PI+k.smYaw,st=Math.cos(k.smPitch),Yt=Math.max(j*1.9,52)*k.smZoom*(1+q*Oe(.26,.1)+a.burstFx*Oe(.34,.12))*tr(r.aspect),ho=R.lerp(Z.y,a.deckY,ve.comfort),St=Oo.set(a.x+Math.sin(ze)*st*Yt,ho+j*.26+Math.sin(k.smPitch)*Yt,a.z+Math.cos(ze)*st*Yt),gr=xt(St.x,St.z,y.t,Ue);St.y=Math.max(St.y,gr.y+6),a.snapCam?(a.snapCam=!1,r.position.copy(St)):r.position.lerp(St,1-Math.pow(Oe(6e-4,.02),M));const xr=Math.max(0,Math.cos(k.smYaw)),us=q*Oe(66,34)*xr;r.lookAt(ma.set(a.x+($+ae*R.clamp(Ce/40,-.4,.4))*us,ho+12-a.trim*26*q*Oe(1,.35),a.z+(Q+be*R.clamp(Ce/40,-.4,.4))*us));const ds=Oe(1,0);ds>.001&&r.rotateZ((Math.sin(y.t*2.3)*.012*q+a.heel*.3+a.aground*Math.sin(y.t*21)*.02+a.slam*Math.sin(y.t*34)*.03+He.danger*Math.sin(y.t*2.7)*.03)*ds),Dn(r,60+q*Oe(7,2)+a.burstFx*Oe(10,3),M,.06,er)}const hs=Math.hypot(a.x-(K.x+60*_),a.z-(K.z+60*_));hs<90*_&&Math.abs(a.speed)<24&&(y.footSpawn="port",G?o?.("foot"):a.area==="deck"&&(a.area="island",a.fx=K.x+40*_,a.fz=K.z+40*_,a.fy=re(a.fx,a.fz)+Ge,a.fvx=0,a.fvz=0,a.fvy=0,a.fyaw=Math.atan2(he.x-a.fx,he.z-a.fz),k.yaw=k.smYaw=a.fyaw+Math.PI)),C.boardQueued&&(C.boardQueued=!1,G?(y.footSpawn="deck",o?.("foot")):a.area==="deck"&&o?.("helm")),G&&(y.helm={speed:a.speed,heading:a.heading,throttle:a.throttle,aground:a.aground,x:a.x,z:a.z,toGate:Math.min(Math.hypot(a.x,a.z-Ot),Math.hypot(a.x,a.z-oo)),underFire:[Ot,oo].some(ze=>{const st=Math.hypot(a.x,a.z-ze);return st>Xo.safe&&st<Xo.range}),moored:hs<180*_,maelstrom:He.danger,swallowed:a.swallowed,burst:a.burst,drift:a.drift,maxSpeed:D,cruise:It.level,flank:a.flank,freeCam:ve.freeCam},Za(M,y.helm)),y.shelter+=(Pe-y.shelter)*(1-Math.pow(.06,M)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}if(e==="foot"){Yn(k,M,0);const O=C.boost?ga:Jc;a.fpitch+=(-k.smPitch-a.fpitch)*(1-Math.pow(1e-4,M));const oe=C.walk.x,ue=C.walk.z,D=Math.hypot(oe,ue),$=D>1?D:1,Q=-Math.sin(k.smYaw),ae=-Math.cos(k.smYaw),be=-ae,de=Q,Ce=(Q*(ue/$)+be*(oe/$))*O,J=(ae*(ue/$)+de*(oe/$))*O,Ae=(1-Math.pow(D>.02?2e-5:4e-7,M))*(a.airborne?.25:1);a.fvx+=(Ce-a.fvx)*Ae,a.fvz+=(J-a.fvz)*Ae;const rt=a.fvx*M,Ne=a.fvz*M,Je=a.area==="island"?(Z,te)=>re(Z,te):a.area==="deck"?()=>y.ship.y+y.ship.deckY:(Z,te,q)=>fe.y+mi(Z-fe.x,te-fe.z,q-fe.y),it=a.area==="hall"?(Z,te,q)=>gi(Z-fe.x,te-fe.z,q-fe.y)||ui(Z,q,te)>.97:()=>!1;if(a.area==="deck"){const Z=Math.cos(-y.ship.heading),te=Math.sin(-y.ship.heading);a.dx+=rt*Z+Ne*-te,a.dz+=rt*te+Ne*Z;const q=y.ship.loa*.14,we=y.ship.loa*.42;Math.abs(a.dx)>q&&(a.dx=Math.sign(a.dx)*q,a.fvx=0,a.fvz=0),Math.abs(a.dz)>we&&(a.dz=Math.sign(a.dz)*we,a.fvx=0,a.fvz=0);const Ve=Math.cos(y.ship.heading),ht=Math.sin(y.ship.heading);a.fx=y.ship.x+a.dx*Ve+a.dz*ht,a.fz=y.ship.z-a.dx*ht+a.dz*Ve}else if(a.area==="island"){const Z=a.fx+rt,te=a.fz+Ne,q=re(a.fx,a.fz),we=re(Z,te),Ve=Math.hypot(rt,Ne)||1e-6,ht=(we-q)/Ve;(we<=.3||ht>=1.2&&we>=q)&&(a.fvx=0,a.fvz=0),we>.3&&(ht<1.2||we<q)&&(a.fx=Z,a.fz=te)}else{const Z=a.fx+rt,te=a.fz+Ne,q=a.fy-Ge,we=Je(a.fx,a.fz,q),Ve=a.airborne?q:we;Je(Z,te,Ve)-Ve>xa||it(Z,te,q)?(a.fvx=0,a.fvz=0):(a.fx=Z,a.fz=te)}const vt=a.fy-Ge,$e=Je(a.fx,a.fz,vt);if(a.airborne?(a.fvy-=eh*M,a.fy+=a.fvy*M,a.fy-Ge<=$e&&(a.landing=-a.fvy,a.fy=$e+Ge,a.fvy=0,a.airborne=!1,a.landing>wa&&(Ut((a.landing-wa)*th,"A LONG WAY DOWN"),Ye.roll=0))):a.area==="deck"?(a.fy=$e+Ge,a.fvy=0,a.landing=Math.max(0,a.landing-M*40),C.jumpQueued&&(C.jumpQueued=!1,a.fvy=ba,a.airborne=!0)):vt-$e>xa?(a.airborne=!0,a.fvy=0):(a.fy+=($e+Ge-a.fy)*(1-Math.pow(.002,M)),a.landing=Math.max(0,a.landing-M*40),C.jumpQueued&&(C.jumpQueued=!1,a.fvy=ba,a.airborne=!0)),C.jumpQueued=!1,a.area==="island"){const Z=Math.hypot(a.fx-he.x,a.fz-he.z),te=Math.hypot(a.fx-W.gate.x,a.fz-W.gate.z);Z<80?(a.area="hall",a.fx=fe.x,a.fz=fe.z+dt.zTop,a.fy=fe.y+De.y+Ge,a.fvy=0,a.airborne=!1,a.fyaw=Math.PI,k.yaw=k.smYaw=0,k.pitch=k.smPitch=.05):te<40&&(a.area="hall",a.fx=fe.x+60,a.fz=fe.z+N.z+150,a.fy=fe.y+Ge,a.fvy=0,a.airborne=!1,a.fyaw=0,k.yaw=k.smYaw=Math.PI,k.pitch=k.smPitch=.04),y.helm={onFoot:!0,area:"island",x:a.fx,z:a.fz,fy:a.fy-fe.y,toMouth:Z,toRear:te,nearPort:Math.hypot(a.fx-K.x,a.fz-K.z)<K.r*1.4};const q=Mo(a.fx,a.fz);y.shelter+=(q-y.shelter)*(1-Math.pow(.06,M))}else if(a.area==="deck")y.helm={onFoot:!0,area:"deck",x:a.fx,z:a.fz,speed:a.speed,heading:a.heading,throttle:a.throttle,maxSpeed:(x.topSpeed??Go)*(1+da*a.flank),moored:!1};else{const Z=a.fz-fe.z;Z>De.z+34&&(a.area="island",a.fx=he.x,a.fz=he.z+130,a.fy=re(a.fx,a.fz)+Ge,a.fvy=0,a.airborne=!1,a.fyaw=0,k.yaw=k.smYaw=Math.PI,k.pitch=k.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:a.fx,z:a.fz,lz:Z,fy:a.fy-fe.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,M))}const U=Math.hypot(a.fvx,a.fvz);a.stride+=U*M;const je=g.height??1.74;if(U>.4){let te=Math.atan2(a.fvx,a.fvz)-a.fyaw;for(;te>Math.PI;)te-=Math.PI*2;for(;te<-Math.PI;)te+=Math.PI*2;a.fyaw+=te*(1-Math.pow(4e-4,M))}a.fpitch+=(-k.smPitch-a.fpitch)*(1-Math.pow(1e-4,M)),a.pace=U,c.current.speed=U,c.current.maxSpeed=ga,c.current.grounded=!a.airborne,c.current.vy=a.fvy,c.current.landing=a.landing,Ye.playerTurn=(a.fyaw-a.fyaw0)/Math.max(M,1e-4),a.fyaw0=a.fyaw,d.x=a.fx,d.y=a.fy-Ge,d.z=a.fz,d.yaw=k.smYaw+Math.PI,d.pitch=k.smPitch,d.height=je,d.floorY=a.area==="hall"?a.fy-Ge:null,_c(M,d,C,b),(b.x||b.z)&&(a.fvx+=b.x,a.fvz+=b.z);const lt=(a.area==="deck"?Math.max(je*2.6,y.ship.loa*.75):je*2.6)*k.smZoom,He=Math.cos(k.smPitch),ct=a.area==="deck"?R.lerp(a.fy,a.deckY+y.ship.deckY+Ge,ve.comfort):a.fy,Le=ct+Math.sin(a.stride*1.6)*.05*Oe(1,.3),H=a.fx+Math.sin(k.smYaw)*He*lt,me=a.fz+Math.cos(k.smYaw)*He*lt;let Pe=Le+je*.28+Math.sin(k.smPitch)*lt;const Ue=a.area==="island"?re(H,me):ct-Ge;Pe=Math.max(Pe,Ue+je*.6),a.area==="deck"&&(Pe=Math.max(Pe,ct-Ge+y.ship.mastY*1.06)),Oo.set(H,Pe,me),a.snapCam?(a.snapCam=!1,r.position.copy(Oo)):r.position.lerp(Oo,1-Math.pow(Oe(9e-4,.02),M)),r.lookAt(ma.set(a.fx,Le-je*.1,a.fz)),Dn(r,a.area==="hall"?72:64,M,.02),h.current&&(h.current.position.set(a.fx,a.fy-Ge,a.fz),h.current.rotation.y=a.fyaw),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}y.fog=R.lerp(Gt.sea,Gt.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:h,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(Ar,{character:g,motion:c})}),t.jsxs("group",{ref:l,position:[0,-4e3,0],visible:e==="helm",children:[z&&t.jsx(xe,{name:E,loa:j,slim:cn(E),sink:zo(E),rotation:an(E),tint:ns(E,x.tint),emissive:"#3a2a18",emissiveIntensity:.24,glow:en(E)}),z&&I&&Wo.slice(0,2).map((L,A)=>{const[M,G]=os(E,j,L);return t.jsx(xe,{name:x.crew,height:rn,rotation:L[2],position:[M,At(E,j),G]},`crew-${A}`)}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!z,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!z,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!z,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!z,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!z,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!z,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:m,position:[0,17.5,1.5],visible:!z,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:_e,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!z,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(L=>t.jsxs("group",{position:[L*(z?ts(E,j)*.62:3.2),(z?At(E,j):8)+qo*3.4,-j*.19],children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[qo,7,5]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[Jo,Jo,1],children:t.jsx("spriteMaterial",{map:ss,color:T.lantern,transparent:!0,opacity:.5,depthWrite:!1,blending:pt,toneMapped:!1})})]},L)),t.jsx(So,{crew:x.flag,width:jo(j),position:[0,z?ko(E,j)*.9:26,-j*.06]}),t.jsxs("mesh",{ref:p,position:[0,.6,-j*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[j*.6,j*2.2]}),t.jsx("meshBasicMaterial",{map:Cn,color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:f,position:[0,j*.12,j*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[j*.85,j*.6]}),t.jsx("meshBasicMaterial",{map:qi,color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:pt})]})]})]})}const ya=76,nh=24,va=26,sh=1.15,ah=.44,rh=.05,ih=.22,lh=70,No=340,Ma=7,ch=6,ja=60,Ho=185,hh=new S,ka=new S,_o={x:430*_,z:1e3*_};function uh({mode:e,onMode:o}){const n=Me(z=>z.camera),s=Me(z=>z.gl),r=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef([]),d=w.useCallback(z=>{c.current=z},[]),b=ot("ship-tang.opt.glb"),g=ot("ship-sub.opt.glb"),m=b||g,f=ot("crew-heart.opt.glb"),p=b?"ship-tang.opt.glb":"ship-sub.opt.glb",x=ln(p,28),u=w.useRef({x:_o.x,z:_o.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:0,orderedDepth:0,pitch:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,v=dr({enabled:e==="sub",dom:s.domElement,zoomMin:.32,zoomMax:3.4,pitch0:.15,pitchMin:-1.24,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return u.x=_o.x,u.z=_o.z,u.heading=Math.PI,u.speed=0,u.throttle=0,u.flank=0,u.depth=0,u.orderedDepth=0,u.berthing=0,u.snapCam=!0,v.yaw=0,v.smYaw=0,v.pitch=.15,v.smPitch=.15,v.pitch0=.15,v.zoom=1,v.smZoom=1,v.noRecentre=!1,u.heel=0,y.subActive=!0,y.helm=null,Gn("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,u,v]),se((z,E)=>{if(e!=="sub"){r.current&&r.current.position.set(0,-4e3,0);return}const j=Math.min(E,.05);y.t+=j;const I=u.heading,a=C.boost;u.throttle+=(C.throttle-u.throttle)*(1-Math.pow(.02,j)),u.flank+=((a?1:0)-u.flank)*(1-Math.pow(rh,j)),y.subThrottle=Math.abs(u.throttle),u.rudder+=(C.rudder-u.rudder)*(1-Math.pow(8e-4,j));const k=R.clamp(u.depth/15,0,1),L=ya*(.7+.3*k)*(1+ah*u.flank),A=u.throttle>=0?u.throttle*L:u.throttle*nh;u.speed+=R.clamp(A-u.speed,-va*2,va)*j,u.speed-=u.speed*Math.abs(u.speed)*.0016*j;const M=R.lerp(ih,1,R.clamp(Math.abs(u.speed)/7,0,1));u.heading+=u.rudder*sh*M*Math.sign(u.speed>=0?1:-1)*j,u.orderedDepth-=C.planes*lh*j,u.orderedDepth=R.clamp(u.orderedDepth,0,No),C.surfaceQueued&&(C.surfaceQueued=!1,u.orderedDepth=0),C.periscopeQueued&&(C.periscopeQueued=!1,u.orderedDepth=ch);const G=u.x+Math.sin(u.heading)*u.speed*j,F=u.z+Math.cos(u.heading)*u.speed*j,O=Oa(G,F,u.depth);u.x=G+O.vx*j,u.z=F+O.vz*j;const oe=O.vx*Math.cos(u.heading)-O.vz*Math.sin(u.heading);u.heading+=oe*.008*j;const ue=R.clamp(Math.abs(u.speed)/ya,0,1),D=R.clamp(oe*.02+u.rudder*M*ue*.34,-.6,.6);u.heel+=(D-u.heel)*(1-Math.pow(.12,j)),O.danger>.05&&(u.speed*=Math.pow(1-.22*O.danger,j));const $=re(u.x,u.z),Q=Math.max(2,-$-Ma),ae=u.depth<1.5;u.depth+=(u.orderedDepth-u.depth)*(1-Math.pow(.12,j)),u.depth>Q?(u.scrape+=(1-u.scrape)*(1-Math.pow(.02,j)),u.depth=Q,u.orderedDepth=Math.min(u.orderedDepth,Q-2),Ut(Math.abs(u.speed)*.0016*j*60,"GROUNDED ON THE SHELF"),u.speed*=Math.pow(.3,j)):u.scrape+=(0-u.scrape)*(1-Math.pow(.05,j));const be=(u.depth-Ho)/(No-Ho);u.stress=be>0?Math.min(1,be*be):0,u.stress>0&&Ut(u.stress*.06*j,"HULL UNDER PRESSURE — COME UP");const de=u.x+Math.sin(u.heading)*26,Ce=u.z+Math.cos(u.heading)*26;if(re(de,Ce)>-u.depth+Ma*.5){u.speed*=Math.pow(.1,j);const Ke=6,Xe=re(u.x+Ke,u.z)-re(u.x-Ke,u.z),To=re(u.x,u.z+Ke)-re(u.x,u.z-Ke),Nt=Math.hypot(Xe,To)||1;u.x-=Xe/Nt*20*j,u.z-=To/Nt*20*j,u.scrape=Math.max(u.scrape,.5)}const Ae=Math.hypot(u.x-W.x,u.z-W.z);if(Ae<W.pool*1.1&&u.berthing===0&&(u.berthing=1e-4),u.berthing>0){u.berthing=Math.min(1,u.berthing+j*.5),u.x+=(W.berth.x-u.x)*(1-Math.pow(.1,j)),u.z+=(W.berth.z-u.z)*(1-Math.pow(.1,j)),u.orderedDepth=0,u.speed*=Math.pow(.1,j);let Xe=Math.atan2(W.dir[0],W.dir[1])+Math.PI-u.heading;for(;Xe>Math.PI;)Xe-=Math.PI*2;for(;Xe<-Math.PI;)Xe+=Math.PI*2;u.heading+=Xe*(1-Math.pow(.2,j)),u.berthing>=1&&u.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}u.depth<1.5!==ae&&(y.splash+=1);const Ne=xt(u.x,u.z,y.t,1),Je=1-R.clamp(u.depth/10,0,1),it=-u.depth+Ne.y*Je,vt=R.clamp((u.orderedDepth-u.depth)*.05,-.34,.34)*Math.sign(u.speed>=0?1:-1)+Ne.dz*.8*Je;u.pitch+=(vt-u.pitch)*(1-Math.pow(.05,j));const $e=r.current;$e&&($e.position.set(u.x,it,u.z),$e.rotation.set(u.pitch+u.scrape*Math.sin(y.t*23)*.02,u.heading,-Ne.dx*.5*Je+u.heel)),i.current&&(i.current.rotation.z+=u.throttle*9*j),l.current&&(l.current.visible=u.depth<2.5),h.current&&(h.current.visible=u.depth<7);const U=en(p);if(U){const Ke=U[1]*(1+y.underwater*1.1+R.clamp(u.depth/260,0,1)*.6);for(const Xe of c.current)Xe.emissiveIntensity=Ke}y.subPos.set(u.x,it,u.z),Yn(v,j,u.heading-I);const je=u.heading+Math.PI+v.smYaw,lt=Math.cos(v.smPitch),He=R.clamp(u.depth/240,0,1),ct=Math.max(x*2,52)*v.smZoom*(1-He*.2)*tr(n.aspect),Le=hh.set(u.x+Math.sin(je)*lt*ct,it+x*.12+Math.sin(v.smPitch)*ct,u.z+Math.cos(je)*lt*ct),H=re(Le.x,Le.z);Le.y=Math.max(Le.y,H+5),u.depth>10&&(Le.y=Math.min(Le.y,Ne.y-3)),u.snapCam?(u.snapCam=!1,n.position.copy(Le)):n.position.lerp(Le,1-Math.pow(Oe(8e-4,.02),j));const me=Math.max(0,Math.cos(v.smYaw)),Pe=ue*Oe(46,26)*me;ka.set(u.x+Math.sin(u.heading)*Pe,it+6-u.pitch*30*ue*Oe(1,.35),u.z+Math.cos(u.heading)*Pe),n.lookAt(ka);const Ue=Oe(1,0);Ue>.001&&n.rotateZ((u.scrape*Math.sin(y.t*19)*.015+u.heel*.35+O.danger*Math.sin(y.t*3.1)*.02)*Ue),Dn(n,64+ue*Oe(6,2)+u.flank*Oe(2,.6),j,.06,er);const Z=xt(n.position.x,n.position.z,y.t,1),te=R.clamp((Z.y-n.position.y-1)/3,0,1);y.underwater+=(te-y.underwater)*(1-Math.pow(.002,j)),y.depthBelow=Math.max(0,Z.y-n.position.y);const q=R.lerp(8200,1700,y.underwater);Math.abs(n.far-q)>20&&(n.far=q,n.updateProjectionMatrix()),y.shelter+=((Ae<W.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,j));let we=Be[0],Ve=1/0;for(const Ke of Be){const Xe=(u.x-Ke.x)**2+(u.z-Ke.z)**2;Xe<Ve&&(Ve=Xe,we=Ke)}qa(j,{danger:O.danger,headingX:Math.sin(u.heading),headingZ:Math.cos(u.heading),toCentreX:we.x-u.x,toCentreZ:we.z-u.z,speed:u.speed,throttle:u.throttle})>=1&&(Ut(.22,"CAUGHT IN THE VORTEX"),u.x=we.x+(u.x>we.x?1:-1)*we.r*1.9,u.z=we.z+we.r*1.5,u.speed=0,u.orderedDepth=Math.min(No,u.depth+18),Y.grip=0,y.splash+=1);let nt=Math.atan2(W.x-u.x,W.z-u.z)-u.heading;for(;nt>Math.PI;)nt-=Math.PI*2;for(;nt<-Math.PI;)nt+=Math.PI*2;y.helm={sub:!0,speed:u.speed,maxSpeed:L,heading:u.heading,depth:u.depth,orderedDepth:u.orderedDepth,scrape:u.scrape,stress:u.stress,maelstrom:O.danger,toRear:Ae,relRear:nt,berthing:u.berthing>0,x:u.x,z:u.z,maxDepth:No,crushDepth:Ho,cruise:It.level,flank:u.flank,freeCam:ve.freeCam,dark:R.clamp((u.depth-ja)/(Ho-ja),0,1)},Za(j,y.helm)}),t.jsxs("group",{ref:r,position:[0,-4e3,0],children:[m&&t.jsx(xe,{name:p,loa:x,slim:cn(p),glow:en(p),onMaterials:d,sink:zo(p),rotation:an(p),tint:ns(p,"#c9b445"),emissive:"#2a2410",emissiveIntensity:.22}),t.jsx("group",{ref:l,position:[0,At(p,x),-x*.07],children:f&&t.jsx(xe,{name:"crew-heart.opt.glb",height:rn,rotation:0})}),t.jsx("group",{ref:h,position:[0,At(p,x),-x*.2],children:t.jsx(So,{crew:"heart",width:jo(x),position:[0,ko(p,x)*.42,0],staff:!0})}),m&&[-1,1].map(z=>[0,1,2,3,4,5,6].map(E=>t.jsxs("mesh",{position:[z*ts(p,x)*.55,At(p,x)-x*.02,x*(.24-E*.08)],children:[t.jsx("sphereGeometry",{args:[x*.011,6,5]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:2.4,toneMapped:!1})]},`port-${z}-${E}`))),t.jsxs("group",{visible:!m,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(z=>[0,1,2,3].map(E=>t.jsxs("mesh",{position:[z*5.1,1.2,8-E*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${z}-${E}`)))]}),t.jsxs("mesh",{position:[0,x*.02,x*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,x*.02,x*.6],scale:[x*.9,x*.9,1],children:t.jsx("spriteMaterial",{map:ss,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:pt})}),t.jsxs("mesh",{position:[0,x*.24,-x*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,x*.012,-x*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(fh,{})]})}const dh=`
  uniform float uTime;
  uniform float uGain;
  attribute float aPhase;
  attribute float aRate;
  attribute float aSize;
  varying float vFade;

  void main() {
    /* Each bubble streams aft and up from the props on a saw wave — the same
       zero-bookkeeping trick as the storm's embers. Local space: the group is
       the boat, so the trail follows her for free. */
    float life = fract(uTime * aRate + aPhase);
    vec3 p = position;
    p.z -= life * 46.0;
    p.y += life * life * 14.0;
    p.x += sin(life * 21.0 + aPhase * 40.0) * 1.6;

    vFade = smoothstep(0.0, 0.08, life) * (1.0 - smoothstep(0.5, 1.0, life)) * uGain;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (140.0 / -mv.z), 1.0, 9.0);
  }
`,ph=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function fh(){const e=w.useRef(),o=w.useMemo(()=>{const r=new Float32Array(780),i=new Float32Array(260),l=new Float32Array(260),h=new Float32Array(260);for(let d=0;d<260;d++)r[d*3]=(Math.random()-.5)*3.4,r[d*3+1]=(Math.random()-.5)*2.6,r[d*3+2]=-14-Math.random()*4,i[d]=Math.random(),l[d]=.25+Math.random()*.3,h[d]=2+Math.random()*4;const c=new Dt;return c.setAttribute("position",new ne(r,3)),c.setAttribute("aPhase",new ne(i,1)),c.setAttribute("aRate",new ne(l,1)),c.setAttribute("aSize",new ne(h,1)),c.boundingSphere=new lo(new S(0,0,-30),70),c},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new S(...ie(X.underGlow))}}),[]);return se((s,r)=>{const i=e.current?.uniforms;if(!i)return;i.uTime.value+=r;const l=y.subActive?y.subThrottle*y.underwater:0;i.uGain.value+=(l-i.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:dh,fragmentShader:ph,uniforms:n,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}const pr=.42;let B=null,Rt=null,ke=null,Vn=!1,kt=!0;function mh(){try{const e=localStorage.getItem("oni.audio");e!==null&&(kt=e==="1")}catch{}return kt}function vn(e){kt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return Rt&&B&&Rt.gain.setTargetAtTime(e?pr:0,B.currentTime,.12),e&&B?.state==="suspended"&&B.resume(),kt}function gh(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),s=n.getChannelData(0);for(let r=0;r<o;r++)s[r]=Math.random()*2-1;return n}function go(e,o,n,s,r,i,l){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const c=e.createBiquadFilter();c.type=n,c.frequency.value=s,c.Q.value=r;const d=e.createGain();return d.gain.value=i,h.connect(c).connect(d).connect(l),h.start(),{src:h,filt:c,gain:d}}function Mn(){if(Vn){B?.state==="suspended"&&B.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;B=new e,Vn=!0,Rt=B.createGain(),Rt.gain.value=kt?pr:0;const o=B.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=B.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,Rt.connect(n).connect(o).connect(B.destination);const s=gh(B),r=B.createGain();r.gain.value=1,r.connect(Rt);const i=go(B,s,"bandpass",480,.7,.3,r),l=go(B,s,"highpass",1900,.5,0,r),h=go(B,s,"lowpass",220,1.1,.22,r),c=go(B,s,"lowpass",96,1.6,0,r),d=B.createGain();d.gain.value=1,d.connect(o);const b=B.createOscillator();b.type="sawtooth",b.frequency.value=41;const g=B.createBiquadFilter();g.type="lowpass",g.frequency.value=190,g.Q.value=1.2;const m=B.createGain();m.gain.value=0,b.connect(g).connect(m).connect(d),b.start();const f=B.createOscillator(),p=B.createOscillator(),x=B.createGain();f.frequency.value=.07,p.frequency.value=.113,x.gain.value=260,f.connect(x),p.connect(x),x.connect(i.filt.frequency),f.start(),p.start();const u=B.createGain();u.gain.value=0,u.connect(Rt);const v=B.createGain();v.gain.value=.16,v.connect(u);for(const[E,j]of[[146.83,1],[220,.5],[293.66,.3]]){const I=B.createOscillator();I.type="sine",I.frequency.value=E;const a=B.createGain();a.gain.value=j;const k=B.createOscillator(),L=B.createGain();k.frequency.value=.21+Math.random()*.1,L.gain.value=E*.004,k.connect(L).connect(I.frequency),k.start(),I.connect(a).connect(v),I.start()}const z=go(B,s,"bandpass",900,3.2,.05,u);return ke={stormBus:r,festBus:u,wind:i,rain:l,sea:h,roar:c,breath:z,buf:s,comp:o,muffle:n,humGain:m,subBus:d},B}function xh(){if(!B||!ke||!kt)return;const e=B.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const s=B.createOscillator(),r=B.createGain();s.type="sine",s.frequency.setValueAtTime(1420,e+o),s.frequency.exponentialRampToValueAtTime(1180,e+o+.5),r.gain.setValueAtTime(0,e+o),r.gain.linearRampToValueAtTime(n,e+o+.012),r.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),s.connect(r).connect(ke.subBus),s.start(e+o),s.stop(e+o+1.5)}}function bh(e=1){if(!B||!ke||!kt)return;const o=B.currentTime,n=B.createBufferSource();n.buffer=ke.buf;const s=B.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(1500,o),s.frequency.exponentialRampToValueAtTime(240,o+.5),s.Q.value=.7;const r=B.createGain();r.gain.setValueAtTime(0,o),r.gain.linearRampToValueAtTime(.5*e,o+.02),r.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(s).connect(r).connect(Rt),n.start(o),n.stop(o+.9)}function Qt(e,o=1,n=82){if(!B||!ke)return;const s=B.createOscillator(),r=B.createGain();s.type="sine",s.frequency.setValueAtTime(n*2.1,e),s.frequency.exponentialRampToValueAtTime(n,e+.06),s.frequency.exponentialRampToValueAtTime(n*.7,e+.5),r.gain.setValueAtTime(0,e),r.gain.linearRampToValueAtTime(o,e+.004),r.gain.exponentialRampToValueAtTime(1e-4,e+.62),s.connect(r).connect(ke.festBus),s.start(e),s.stop(e+.7);const i=B.createBufferSource();i.buffer=ke.buf;const l=B.createBiquadFilter();l.type="bandpass",l.frequency.value=1400,l.Q.value=.8;const h=B.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),i.connect(l).connect(h).connect(ke.festBus),i.start(e),i.stop(e+.12)}function wh(e=1,o=0){if(!B||!ke||!kt)return;const n=B.currentTime+o,s=B.createBufferSource();s.buffer=ke.buf,s.loop=!0;const r=B.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(320,n),r.frequency.exponentialRampToValueAtTime(70,n+2.6),r.Q.value=.9;const i=B.createGain(),l=.5*e;i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(l,n+.05),i.gain.exponentialRampToValueAtTime(l*.24,n+.7),i.gain.exponentialRampToValueAtTime(l*.42,n+1.35),i.gain.exponentialRampToValueAtTime(1e-4,n+3.4),s.connect(r).connect(i).connect(ke.stormBus),s.start(n),s.stop(n+3.6);const h=B.createOscillator(),c=B.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.32*e,n+.08),c.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(c).connect(ke.stormBus),h.start(n),h.stop(n+2.8)}function yh(e=.5){if(!B||!ke||!kt)return;const o=B.currentTime;for(const[n,s,r]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const i=B.createOscillator(),l=B.createGain();i.type="sine",i.frequency.value=61*n,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(e*s,o+.008),l.gain.exponentialRampToValueAtTime(1e-4,o+r),i.connect(l).connect(Rt),i.start(o),i.stop(o+r+.1)}}let gt=0,jn=0,Sa=0,xo=0;function vh(e){if(!Vn||!B||!ke||!kt)return;const o=B.currentTime,n=e.shelter,s=e.underwater,r=e.subActive?.12:1,i=Math.sin(n*Math.PI*.5)*r*(1-s*.92);ke.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),ke.festBus.gain.setTargetAtTime(i,o,.35),ke.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),ke.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),ke.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),ke.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-s*.55),o,.3),ke.muffle.frequency.setTargetAtTime(18e3-s*17400,o,.18);const l=e.subActive?s*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(ke.humGain.gain.setTargetAtTime(l,o,.25),e.splash!==Sa&&(Sa=e.splash,bh(1)),e.subActive&&s>.5?xo===0?xo=o+1.2:o>=xo&&(xh(),xo=o+6.5):xo=0,n>.06){const c=.9090909090909091;for(gt<o&&(gt=o+.1);gt<o+.35;){const d=jn%8,b=n*.9;d===0?Qt(gt,.85*b,74):d===2?Qt(gt,.45*b,88):d===4?Qt(gt,.7*b,74):d===6?Qt(gt,.4*b,92):d===7&&(Qt(gt,.3*b,96),Qt(gt+c*.5,.36*b,96)),jn++,gt+=c}}else gt=0,jn=0}function Mh(){const e=w.useRef(!1),o=w.useRef(-1);return se(()=>{if(vh(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,s=500+Math.abs(n.z)*900;wh(Math.min(1,.55+y.flash*.6),s/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&yh(.55),o.current=y.shot)}),null}function jh({mode:e,vessel:o}){return y.mode=e,y.vessel=o,se(()=>Kl(),-100),null}function kh(){const e=Me(r=>r.gl),o=Me(r=>r.camera),n=Me(r=>r.setSize),s=Me(r=>r.size);return w.useEffect(()=>{const r=()=>{const i=window.innerWidth,l=window.innerHeight;i<2||l<2||s.width>i*.5&&s.height>l*.5||(n(i,l),e.setSize(i,l,!1),o.aspect=i/l,o.updateProjectionMatrix())};return r(),window.addEventListener("resize",r),document.addEventListener("visibilitychange",r),()=>{window.removeEventListener("resize",r),document.removeEventListener("visibilitychange",r)}},[e,o,n,s.width,s.height]),null}function Sh({every:e=12}){const o=Me(s=>s.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),se(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function zh({budget:e}){const o=Me(s=>s.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(yr,{bounds:s=>s>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function Th(){const e=Me(s=>s.gl),o=Me(s=>s.scene),n=Me(s=>s.camera);return w.useEffect(()=>{const s=setTimeout(()=>{try{e.compile(o,n)}catch(r){console.warn("[onigashima] pre-compile skipped",r)}},900);return()=>clearTimeout(s)},[e,o,n]),null}function Eh(){const{camera:e,scene:o,gl:n}=Me();return w.useEffect(()=>{},[e,o,n]),null}const Rh=new Se(X.haze),Ah=new Se(X.underHaze),Ih=new Se(X.abyss),za=new Se;function Ch(){const e=Me(o=>o.scene);return se(()=>{if(!e.fog)return;const o=R.clamp(y.depthBelow/Gt.deepGrade,0,1),n=R.lerp(.0062,.0142,o);e.fog.density=R.lerp(y.fog,n,y.underwater),za.copy(Ah).lerp(Ih,o*.8),e.fog.color.lerpColors(Rh,za,y.underwater)}),null}function Lh({quality:e,budget:o,onRails:n,playing:s,speed:r,onShot:i,mode:l,onMode:h,crew:c,vessel:d="sunny"}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,y.fog]}),t.jsx(Or,{storm:y}),t.jsx(hl,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(ci,{quality:e,segments:o.segments}),t.jsx(ni,{quality:e,storm:y}),t.jsx(Ti,{quality:e,shadows:o.shadows}),t.jsx(Ms,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Ms,{quality:e,shadows:!1,z:oo,k:_*1.5}),t.jsx(Ci,{quality:e,shadows:o.shadows}),t.jsx(Fi,{quality:e,shadows:o.shadows}),t.jsx(sl,{quality:e}),t.jsx(il,{shadows:o.shadows}),t.jsx(yc,{quality:e,shadows:o.shadows}),t.jsx(bl,{quality:e}),t.jsx(Ml,{quality:e}),t.jsx(Rl,{quality:e}),t.jsx(Nl,{quality:e}),t.jsx(tc,{onRails:n&&l==="off",playing:s&&l==="off",speed:r,onShot:i,idle:l!=="off"}),t.jsx(jh,{mode:l,vessel:d}),t.jsx(Ir,{}),t.jsx(Cr,{}),t.jsx(Lr,{}),t.jsx(oh,{mode:l,onMode:h,crew:c,vessel:d}),t.jsx(uh,{mode:l,onMode:h}),t.jsx(Mh,{}),t.jsx(kh,{}),t.jsx(Ch,{}),t.jsx(Eh,{}),t.jsx(Th,{}),t.jsx(zh,{budget:o}),o.shadows&&t.jsx(Sh,{every:o.shadowEvery})]})}const bo="#d63420",Fh="rgba(8,6,16,0.72)",Ta="(max-width: 860px), (max-height: 520px)",kn="min(7.5vh, 62px)";function Ph(e=2600,o=!0){const[n,s]=w.useState(!1);return w.useEffect(()=>{if(!o){s(!1);return}let r;const i=()=>{s(!1),clearTimeout(r),r=setTimeout(()=>s(!0),e)};i();for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(l,i,{passive:!0});return()=>{clearTimeout(r);for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(l,i)}},[e,o]),n}function Gh(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ta).matches);return w.useEffect(()=>{const n=window.matchMedia(Ta),s=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",s):n.addListener(s),()=>{n.removeEventListener?n.removeEventListener("change",s):n.removeListener(s)}},[]),e}function Qe({on:e,onClick:o,children:n,title:s,wide:r,block:i}){return t.jsx("button",{onClick:o,title:s,style:{appearance:"none",border:`1px solid ${e?bo:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:r||i?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:i?"100%":void 0,textAlign:i?"right":"center",minHeight:32},children:n})}function Oh({shot:e,shotIndex:o,shotCount:n,total:s,playing:r,onRails:i,speed:l,tier:h,override:c,dev:d,onPlay:b,onRailsToggle:g,onSpeed:m,onQuality:f,onRestart:p,audio:x,onAudio:u,mode:v,onMode:z,crew:E,onCrew:j,vessel:I,onVessel:a,stage:k,veiled:L=!1}){const A=v!=="off",M=Gh(),[G,F]=w.useState(!1),[O,oe]=w.useState(()=>({...ve}));w.useEffect(()=>as(U=>oe({...U})),[]);const ue=Ph(2600,!A&&!G),D=w.useRef(),$=w.useRef(),Q=w.useRef(),ae=w.useRef(),be=w.useRef(),de=w.useRef(),Ce=i&&!A;w.useEffect(()=>F(!1),[v]),w.useEffect(()=>{let U,je=performance.now(),lt=0,He=0;const ct=Le=>{if(U=requestAnimationFrame(ct),D.current&&(D.current.style.transform=`scaleX(${k.progress||0})`),Q.current&&k.helm){const H=k.helm;if(H.onFoot)Q.current.textContent=H.area==="deck"?`ON DECK · ${Math.round(Math.abs(H.speed)*1.94)} KN · BRG ${String(Math.round((H.heading*180/Math.PI+360)%360)).padStart(3,"0")}°   —  nobody is at the wheel`:H.area==="island"?H.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":H.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(H.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(H.sub){const me=Math.abs(H.speed)*1.94;if(H.berthing)Q.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Pe=H.maelstrom>.22?H.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":H.stress>.02?"⚠ HULL UNDER PRESSURE":H.scrape>.3?"HULL ON THE ROCK":"",Ue=Math.abs(H.relRear*180/Math.PI),Z=Ue<6?"· ON COURSE":H.relRear>0?`◀ ${Ue.toFixed(0)}°`:`${Ue.toFixed(0)}° ▶`,te=10,q=Math.round(H.depth/H.maxDepth*te),we=Math.round(H.crushDepth/H.maxDepth*te);let Ve="";for(let nt=0;nt<te;nt++)Ve+=nt<q?nt>=we?"▓":"█":nt===we?"┃":"·";const ht=H.cruise===2?" ⟲FLK":H.cruise===1?" ⟲AHD":"";Q.current.textContent=`DEPTH ${H.depth.toFixed(0).padStart(3,"0")}/${H.orderedDepth.toFixed(0).padStart(3,"0")}m ${Ve}  ${me.toFixed(0).padStart(2,"0")} KN${ht}
COVE ${Math.round(H.toRear)}m  ${Z}`+(Pe?`
${Pe}`:"")}}else{const me=Math.abs(H.speed)*1.94,Pe=(H.heading*180/Math.PI+180)%360,Ue=Math.round((H.burst??0)*5),Z=H.burstLabel??"BURST",te=H.burst>=.999?`${Z} ▶READY`:`${Z} ${"█".repeat(Ue)}${"·".repeat(5-Ue)}`,q=H.cruise===2?"  ⟲FLANK":H.cruise===1?"  ⟲AHEAD":H.flank>.5?"  FLANK":"";Q.current.textContent=`${me.toFixed(0).padStart(2,"0")} KN   BRG ${Pe.toFixed(0).padStart(3,"0")}°   ${te}${q}
`+(H.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":H.moored?"MOORING":H.aground>.3?"AGROUND — HELM OVER":H.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(H.toGate)}m`:H.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(H.toGate)}m`:`GATE ${Math.round(H.toGate)}m`)}}if(ae.current){const H=kl(),me=jl(Y.chain);ae.current.textContent=Y.done?"✔ OBJECTIVE COMPLETE":H?`▸ ${Y.step+1}/${me}  ${H.text}`:"",ae.current.style.color=Y.done?"#8fe0a0":"#ffd9cf"}if(be.current){const H=Math.max(0,Math.min(1,Y.hull)),me=Math.max(0,Math.min(1,Y.grip)),Pe=te=>{const q=Math.round(te*12);return"█".repeat(q)+"·".repeat(12-q)},Ue=H>.6?"#8fe0a0":H>.3?"#ffc46b":"#ff6b5a",Z=me>.66?"#ff6b5a":me>.33?"#ffc46b":"rgba(255,255,255,0.45)";be.current.innerHTML=`<span style="color:${Ue}">HULL ${Pe(H)}</span>`+(me>.02?`<span style="color:${Z};margin-left:14px">VORTEX ${Pe(me)}</span>`:"")}if(de.current){const H=Y.banner,me=de.current;H?(me.dataset.text!==H.text&&(me.dataset.text=H.text,me.innerHTML=`<div class="og-banner-main">${H.text}</div>`+(H.sub?`<div class="og-banner-sub">${H.sub}</div>`:""),me.style.animation="none",me.offsetWidth,me.style.animation=""),me.style.opacity="1"):(me.style.opacity="0",me.dataset.text="")}d&&$.current?(He++,lt+=Le-je,je=Le,lt>400&&($.current.textContent=`${Math.round(He*1e3/lt)} fps · shelter ${k.shelter.toFixed(2)} · fog ${(k.fog*1e4).toFixed(1)}e-4 · flash ${k.flash.toFixed(2)}`,lt=0,He=0)):je=Le};return U=requestAnimationFrame(ct),()=>cancelAnimationFrame(U)},[k,d]);const J={opacity:ue?.16:1,transform:ue?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},Ae=[{key:"rails",on:!i,label:i?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:g,cinematicOnly:!0},{key:"helm",on:v==="helm",label:v==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>z(v==="helm"?"off":"helm")},{key:"deck",on:!1,label:"WALK THE DECK",title:"Step back from the wheel and walk the deck as your pirate — she sails on",click:()=>{k.footSpawn="deck",z("foot")},helmOnly:!0},{key:"sub",on:v==="sub",label:v==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>z(v==="sub"?"off":"sub")},{key:"foot",on:v==="foot",label:v==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>z(v==="foot"?"off":"foot")}],rt=U=>v==="foot"?t.jsx(Qe,{on:!0,wide:!0,block:U,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>j?.(E==="zoro"?"luffy":"zoro"),children:E==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,Ne=U=>v==="helm"?t.jsx(Qe,{on:!0,wide:!0,block:U,title:"Swap between the Thousand Sunny and Kid's Victoria Punk",onClick:()=>a?.(I==="punk"?"sunny":"punk"),children:I==="punk"?"VICTORIA PUNK":"THOUSAND SUNNY"}):null,Je=(U,je)=>t.jsx(Qe,{on:U.on,onClick:U.click,title:U.title,wide:!0,block:je,children:U.label},U.key),it=U=>A?t.jsxs(t.Fragment,{children:[t.jsx(Qe,{on:O.comfort>.01,wide:!0,block:U,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:Bl,children:O.comfort>.9?"COMFORT · FULL":O.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Qe,{on:O.freeCam,wide:!0,block:U,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>eo("freeCam"),children:O.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Qe,{on:Math.abs(O.lookSens-1)>.01,wide:!0,block:U,title:"How far a drag turns the view",onClick:Ul,children:`LOOK ${O.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Qe,{on:O.invertY,wide:!0,block:U,title:"Invert the vertical look axis",onClick:()=>eo("invertY"),children:O.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,vt=()=>A?t.jsx(Qe,{on:!O.hud,title:"Hide the readouts, the chart and the objective — just the picture (H)",onClick:()=>eo("hud"),children:O.hud?"◱":"◰"}):null,$e=U=>t.jsxs(t.Fragment,{children:[!A&&t.jsxs(t.Fragment,{children:[t.jsx(Qe,{on:r,onClick:b,title:"Play / pause the cinematic",block:U,children:r?U?"❙❙  PAUSE":"❙❙":U?"▶  PLAY":"▶"}),[.5,1,2].map(je=>t.jsxs(Qe,{on:l===je,onClick:()=>m(je),title:`${je}× speed`,block:U,children:[je,"×"]},je))]}),t.jsx(Qe,{on:!1,onClick:p,title:"Restart from the open sea",block:U,children:U?"↺  RESTART":"↺"}),t.jsx(Qe,{on:x,onClick:u,title:"Storm, taiko and a temple bell — all synthesised",block:U,children:x?U?"♪  SOUND ON":"♪":U?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Qe,{on:c!=="auto",wide:!0,block:U,title:"Render tier",onClick:()=>f(c==="auto"?"low":c==="low"?"mobile":c==="mobile"?"high":"auto"),children:c==="auto"?`AUTO · ${h.toUpperCase()}`:c.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!L&&t.jsxs(t.Fragment,{children:[[0,1].map(U=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[U?"bottom":"top"]:0,height:Ce?kn:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},U)),t.jsxs("div",{className:"og-tategaki",style:{opacity:A||G?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:A?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${bo}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:A?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:D,style:{height:"100%",background:`linear-gradient(90deg, ${bo}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${bo}`}})}),t.jsx("div",{className:`og-chrome${A?"":" og-chrome-bottom"}`,style:{...A?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...J},children:M?t.jsxs(t.Fragment,{children:[A&&t.jsx(Qe,{on:!0,onClick:()=>z("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),vt(),t.jsx(Qe,{on:G,onClick:()=>F(U=>!U),title:"Menu",children:G?"✕":"☰"}),G&&t.jsxs("div",{className:"og-menu",children:[A&&t.jsxs(t.Fragment,{children:[rt(!0),Ne(!0),it(!0),t.jsx("div",{className:"og-menu-rule"})]}),Ae.filter(U=>!(U.cinematicOnly&&A)&&!(U.helmOnly&&v!=="helm")).map(U=>Je(U,!0)),t.jsx("div",{className:"og-menu-rule"}),$e(!0)]})]}):t.jsxs(t.Fragment,{children:[vt(),rt(!1),Ne(!1),it(!1),$e(!1),Ae.filter(U=>!(U.cinematicOnly&&A)&&!(U.helmOnly&&v!=="helm")).map(U=>Je(U,!1))]})}),!A&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...J,pointerEvents:"none"},children:[i?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:i?`  ·  ${Math.round(s)}s`:""})]}),A&&O.hud&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:ae,className:"og-objective"}),t.jsx("div",{ref:Q,className:"og-readout"}),t.jsx("div",{ref:be,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:v==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · T WALK THE DECK · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":v==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":E==="zoro"?"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),A&&O.hud&&t.jsx("div",{ref:de,className:"og-banner"}),d&&t.jsx("div",{ref:$,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Fh,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${Ce?kn:"0px"};
          --og-bottom: ${Ce?kn:"0px"};
        }

        @keyframes ogCaption {
          from { opacity: 0; transform: translateY(14px); filter: blur(3px); }
          to   { opacity: 1; transform: none; filter: none; }
        }
        @keyframes ogBanner {
          from { opacity: 0; transform: translate(-50%, 10px) scale(.97); }
          to   { opacity: 1; transform: translate(-50%, 0) scale(1); }
        }
        @keyframes ogMenu {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: none; }
        }
        html, body, #root { margin: 0; height: 100%; background: #05040a; overflow: hidden; }
        canvas { display: block; touch-action: none; }

        /* ── the control cluster ──────────────────────────────────────────── */
        .og-chrome {
          position: fixed;
          right: max(14px, 3.2vw);
          z-index: 13;
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: flex-end;
          align-items: flex-start;
          max-width: min(64vw, 560px);
        }
        .og-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: max(178px, 44vw);
          max-width: 240px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          padding: 9px;
          border-radius: 6px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(5,4,10,0.82);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 18px 50px rgba(0,0,0,.6);
          animation: ogMenu .22s cubic-bezier(.2,.9,.2,1) both;
          /* Never taller than the screen under the bar it hangs from. */
          max-height: calc(100vh - var(--og-top) - 78px);
          overflow-y: auto;
        }
        /* While the film is running the cluster sits at the BOTTOM, so the
           menu has to open upward — hanging it below the button put every
           entry off the bottom of the screen. */
        .og-chrome-bottom .og-menu {
          top: auto;
          bottom: calc(100% + 8px);
          max-height: calc(100vh - var(--og-bottom) - 90px);
        }
        .og-menu-rule {
          height: 1px;
          margin: 3px 0;
          background: rgba(255,255,255,0.1);
        }

        /* ── the title card ───────────────────────────────────────────────── */
        .og-tategaki {
          position: fixed;
          right: max(20px, 3.2vw);
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          pointer-events: none;
          writing-mode: vertical-rl;
          text-orientation: upright;
          font: 700 clamp(20px, 3.3vw, 42px)/1.5 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          letter-spacing: 0.22em;
          color: rgba(255,246,240,0.94);
          text-shadow: 0 0 26px rgba(214,52,32,0.75), 0 0 70px rgba(0,0,0,0.9), 0 2px 3px #000;
        }
        .og-tategaki-sub {
          display: block;
          margin-top: 0.7em;
          font: 600 clamp(9px, 1.1vw, 13px)/1.5 ui-monospace, Menlo, monospace;
          letter-spacing: 0.42em;
          color: ${bo};
          text-orientation: sideways;
        }

        /* ── the instrument panel ─────────────────────────────────────────── */
        .og-instruments {
          position: fixed;
          left: max(16px, 3.2vw);
          top: calc(var(--og-top) + 16px);
          z-index: 11;
          pointer-events: none;
          max-width: min(52vw, 460px);
          font: 600 11px/1.65 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.13em;
          color: rgba(255,230,215,0.86);
          text-shadow: 0 1px 10px #000, 0 0 22px rgba(0,0,0,.8);
          transition: top .7s cubic-bezier(.6,0,.2,1);
        }
        .og-objective {
          font-size: 12px;
          letter-spacing: 0.1em;
          margin-bottom: 5px;
          text-shadow: 0 1px 12px #000;
        }
        /* The readout is written with real newlines — the sub's telemetry is
           two lines of instrument, not one 92-character run that a phone
           wraps wherever it happens to land. */
        .og-readout { opacity: .92; white-space: pre-line; }
        .og-gauges { margin-top: 5px; letter-spacing: .04em; }
        .og-keys {
          margin-top: 7px;
          opacity: .42;
          font-size: 10px;
          letter-spacing: 0.16em;
        }

        /* ── the banner ───────────────────────────────────────────────────── */
        .og-banner {
          position: fixed;
          left: 50%;
          top: 24%;
          transform: translateX(-50%);
          z-index: 12;
          pointer-events: none;
          text-align: center;
          opacity: 0;
          transition: opacity .45s ease;
          animation: ogBanner .5s cubic-bezier(.2,.9,.2,1) both;
          max-width: min(88vw, 720px);
        }
        .og-banner-main {
          font: 700 clamp(17px, 3.4vw, 34px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif;
          letter-spacing: .08em;
          color: #fff6f0;
          text-shadow: 0 2px 26px #000, 0 0 60px rgba(214,52,32,.55);
        }
        .og-banner-sub {
          margin-top: 7px;
          font: 500 clamp(9px, 1.3vw, 13px)/1.5 ui-monospace, Menlo, monospace;
          letter-spacing: .18em;
          color: rgba(255,225,215,.72);
          text-shadow: 0 1px 14px #000;
        }

        /* ── small screens ────────────────────────────────────────────────
           A phone has room for the picture OR the furniture, not both. The
           key hints go (there is no keyboard), and the panel narrows so the
           telemetry cannot reach the menu button on the other side. */
        @media (max-width: 760px) {
          .og-instruments {
            font-size: 10px;
            letter-spacing: .08em;
            /* 62vw let a two-line objective run three quarters of the way
               across the picture. Half is enough for the telemetry, which is
               all fixed-width cells and short words. */
            max-width: 50vw;
            opacity: .88;
          }
          .og-objective { font-size: 10.5px; }
          /* Two lines of objective, hard. The chain's longest step is "RUN
             UNDER THE BACK-DOOR MAELSTROM", which wrapped to two and pushed
             every readout below it down; a third line would reach the chart. */
          .og-objective {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          /**
           * THE BANNER MOVES OUT OF THE PICTURE.
           *
           * At 24% down a 1180px-tall phone it lands 280px in, which is
           * dead centre of the visible scene and exactly where the ship is. It
           * is a three-second announcement sitting on top of the one thing the
           * player came to look at, and the objective text is already printed
           * in the panel above — the banner's job is to say that it CHANGED,
           * not to be the only copy of it.
           *
           * Under the instrument panel, at a size that reads at arm's length
           * without owning the frame.
           */
          /* 92px put it straight through the instrument panel, which runs to
             about 180 with a wrapped objective and a warning line. 196 clears
             the tallest state the panel has and is still in the top fifth of
             the screen, well clear of the ship. */
          .og-banner {
            top: calc(var(--og-top) + 196px);
            max-width: 76vw;
          }
          .og-banner-main { font: 700 15px/1.2 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif; }
          .og-banner-sub { margin-top: 4px; font-size: 9px; line-height: 1.4; }
        }
        /* No keyboard hints when the on-screen controls are up — the stick
           and the buttons say it better, and the line was the widest thing
           in the panel on a phone. */
        .og-touch .og-keys { display: none; }
        /* Landscape phones are SHORT: pull everything up tight. */
        @media (max-height: 480px) {
          .og-instruments { top: calc(var(--og-top) + 8px); line-height: 1.45; }
          .og-banner { top: 12%; }
          .og-tategaki { font-size: clamp(16px, 4vh, 26px); }
        }
      `})]})}const Sn="#d63420",Dh=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Nh({onPick:e}){const[o,n]=w.useState(!1),s=w.useRef(),r=620,i=c=>{o||(n(!0),e(c))},[l,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const c=setTimeout(()=>h(!0),r);return()=>clearTimeout(c)},[o]),w.useEffect(()=>{const c=d=>{(d.key==="Escape"||d.key==="Enter")&&i("off")};return window.addEventListener("keydown",c),()=>window.removeEventListener("keydown",c)}),l?null:t.jsxs("div",{ref:s,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${r}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Dh.map((c,d)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+d*.07}s`},onClick:()=>i(c.key),children:[t.jsx("span",{className:"og-entry-kanji",children:c.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:c.label}),t.jsx("span",{className:"og-entry-sub",children:c.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},c.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
        @keyframes ogRise {
          from { opacity: 0; transform: translateY(16px); filter: blur(6px); }
          to   { opacity: 1; transform: none; filter: none; }
        }
        @keyframes ogVeil {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .og-landing {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-tap-highlight-color: transparent;
        }
        .og-landing-veil {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(120% 78% at 50% 44%, rgba(5,4,10,0.18) 0%, rgba(5,4,10,0.72) 58%, rgba(5,4,10,0.94) 100%),
            linear-gradient(180deg, rgba(5,4,10,0.86) 0%, rgba(5,4,10,0.1) 26%, rgba(5,4,10,0.14) 62%, rgba(5,4,10,0.92) 100%);
          animation: ogVeil .9s ease both;
        }
        .og-landing-body {
          position: relative;
          width: min(560px, 90vw);
          padding: max(28px, 5vh) 0 max(28px, 5vh);
          text-align: center;
        }
        .og-landing-eyebrow {
          font: 600 clamp(8px, 1.5vw, 10px)/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.42em;
          color: rgba(255,225,215,0.5);
          text-indent: 0.42em;
          animation: ogRise .8s cubic-bezier(.2,.9,.2,1) both;
        }
        .og-landing-kanji {
          margin: clamp(10px, 2vh, 18px) 0 0;
          font: 700 clamp(52px, 15vw, 96px)/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          letter-spacing: 0.14em;
          text-indent: 0.14em;
          color: #fff6f0;
          text-shadow: 0 0 40px rgba(214,52,32,0.55), 0 4px 40px rgba(0,0,0,0.9);
          animation: ogRise .9s cubic-bezier(.2,.9,.2,1) both;
        }
        .og-landing-title {
          margin-top: clamp(6px, 1.4vh, 12px);
          font: 600 clamp(10px, 2.1vw, 13px)/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.56em;
          text-indent: 0.56em;
          color: ${Sn};
          animation: ogRise .9s cubic-bezier(.2,.9,.2,1) both;
        }
        .og-landing-title span {
          display: block;
          margin-top: 6px;
          font-size: 0.82em;
          letter-spacing: 0.34em;
          text-indent: 0.34em;
          color: rgba(255,255,255,0.38);
        }
        .og-landing-blurb {
          margin: clamp(14px, 2.6vh, 22px) auto 0;
          max-width: 42ch;
          font: 400 clamp(12px, 2.4vw, 14px)/1.75 "Hiragino Mincho ProN", Georgia, serif;
          color: rgba(255,236,228,0.72);
          text-shadow: 0 1px 16px rgba(0,0,0,0.9);
          animation: ogRise .9s cubic-bezier(.2,.9,.2,1) both;
        }

        .og-landing-grid {
          margin-top: clamp(18px, 3.4vh, 30px);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .og-entry {
          display: flex;
          align-items: center;
          gap: 14px;
          width: 100%;
          padding: 12px 14px;
          text-align: left;
          appearance: none;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 5px;
          background: rgba(10,8,18,0.5);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          color: inherit;
          animation: ogRise .8s cubic-bezier(.2,.9,.2,1) both;
          transition: border-color .2s, background .2s, transform .2s;
        }
        .og-entry:hover, .og-entry:focus-visible {
          border-color: ${Sn};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Sn};
          text-shadow: 0 0 18px rgba(214,52,32,0.5);
        }
        .og-entry-text { flex: 1 1 auto; min-width: 0; }
        .og-entry-label {
          display: block;
          font: 700 clamp(11px, 2.2vw, 12px)/1.3 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.16em;
          color: #fff6f0;
        }
        .og-entry-sub {
          display: block;
          margin-top: 4px;
          font: 400 clamp(9px, 1.9vw, 10.5px)/1.45 ui-monospace, Menlo, monospace;
          letter-spacing: 0.06em;
          color: rgba(255,225,215,0.5);
        }
        .og-entry-arrow {
          flex: 0 0 auto;
          font: 400 20px/1 ui-monospace, Menlo, monospace;
          color: rgba(255,255,255,0.28);
        }

        .og-landing-foot {
          margin-top: clamp(16px, 3vh, 26px);
          display: flex;
          flex-direction: column;
          gap: 7px;
          font: 500 9px/1.5 ui-monospace, Menlo, monospace;
          letter-spacing: 0.24em;
          color: rgba(255,255,255,0.3);
          animation: ogRise .8s cubic-bezier(.2,.9,.2,1) both;
        }
        .og-landing-legal {
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.22);
          font-family: ui-sans-serif, system-ui, sans-serif;
        }

        /* Short landscape phones: the card has to fit between two thumbs, so
           the kanji shrinks hard and the entry rows lose their second line. */
        @media (max-height: 560px) {
          .og-landing-body { padding: 18px 0; }
          .og-landing-kanji { font-size: clamp(34px, 9vh, 54px); }
          .og-landing-blurb { display: none; }
          .og-entry { padding: 9px 12px; }
          .og-entry-sub { display: none; }
          .og-landing-grid { margin-top: 14px; gap: 6px; }
          .og-landing-foot { margin-top: 12px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .og-landing-veil, .og-landing-eyebrow, .og-landing-kanji,
          .og-landing-title, .og-landing-blurb, .og-entry, .og-landing-foot {
            animation-duration: .01ms !important;
          }
        }
      `})]})}const ls="#d63420",cs="#4aa9c9",Hh=(e,o,n)=>e<o?o:e>n?n:e;function fr(e,o,n){const s=w.useRef(o);s.current=o;const r=w.useRef(null),i=w.useRef({x:0,y:0});w.useEffect(()=>{const l=e.current;if(!l||!n)return;const h=m=>{if(r.current===null){r.current=m.pointerId,i.current={x:m.clientX,y:m.clientY};try{l.setPointerCapture?.(m.pointerId)}catch{}s.current.onMove(0,0,m.clientX,m.clientY),m.preventDefault()}},c=m=>{if(m.pointerId!==r.current)return;const f=i.current;s.current.onMove(m.clientX-f.x,m.clientY-f.y,f.x,f.y),m.preventDefault()},d=m=>{m.pointerId===r.current&&(r.current=null,s.current.onEnd(),m.cancelable&&m.preventDefault())};l.addEventListener("pointerdown",h),l.addEventListener("pointermove",c),l.addEventListener("pointerup",d),l.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),window.addEventListener("pointercancel",d);const b=()=>{r.current!==null&&(r.current=null,s.current.onEnd())};l.addEventListener("lostpointercapture",b),window.addEventListener("blur",b);const g=()=>{document.visibilityState!=="visible"&&b()};return document.addEventListener("visibilitychange",g),()=>{l.removeEventListener("pointerdown",h),l.removeEventListener("pointermove",c),l.removeEventListener("pointerup",d),l.removeEventListener("pointercancel",d),l.removeEventListener("lostpointercapture",b),window.removeEventListener("pointerup",d),window.removeEventListener("pointercancel",d),window.removeEventListener("blur",b),document.removeEventListener("visibilitychange",g)}},[e,n])}function Ea({label:e,sub:o,onDown:n,onUp:s,tone:r="plain",wide:i=!1}){const[l,h]=w.useState(!1),c=w.useRef();w.useEffect(()=>{const b=c.current;if(!b)return;let g=null;const m=p=>{g=p.pointerId;try{b.setPointerCapture?.(g)}catch{}h(!0),n(),p.preventDefault(),p.stopPropagation()},f=p=>{p.pointerId===g&&(g=null,h(!1),s(),p.preventDefault(),p.stopPropagation())};return b.addEventListener("pointerdown",m),b.addEventListener("pointerup",f),b.addEventListener("pointercancel",f),b.addEventListener("pointerleave",f),()=>{b.removeEventListener("pointerdown",m),b.removeEventListener("pointerup",f),b.removeEventListener("pointercancel",f),b.removeEventListener("pointerleave",f)}},[n,s]);const d=r==="hot"?ls:r==="cool"?cs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${l?d:"rgba(255,255,255,0.18)"}`,background:l?`color-mix(in srgb, ${d} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:l?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function tt({label:e,sub:o,onTap:n,on:s,tone:r="plain",wide:i=!1}){const l=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const d=l.current;if(!d)return;const b=g=>{h.current(),g.preventDefault(),g.stopPropagation()};return d.addEventListener("pointerdown",b),()=>d.removeEventListener("pointerdown",b)},[]);const c=r==="hot"?ls:r==="cool"?cs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:l,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${s?c:"rgba(255,255,255,0.18)"}`,background:s?`color-mix(in srgb, ${c} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:s?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function _h(){const[e,o]=w.useState(It.level);return w.useEffect(()=>Vl(o),[]),t.jsx(tt,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:nr})}function Bh({simple:e=!1}){const[o,n]=w.useState(ve.freeCam);w.useEffect(()=>as(r=>n(r.freeCam)),[]);const s=w.useRef(null);return e?t.jsx(tt,{label:"LEVEL",sub:"view",onTap:()=>C.recentreQueued=!0}):t.jsx(tt,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const r=performance.now();if(s.current&&r-s.current<420){s.current=null,eo("freeCam"),C.recentreQueued=!0;return}s.current=r,C.recentreQueued=!0}})}function Uh({active:e}){const o=w.useRef(),n=w.useRef(),s=w.useRef(),r=78;return w.useEffect(()=>{if(!e)return;let i;const l=()=>{i=requestAnimationFrame(l);const h=s.current,c=y.helm;h&&(h.textContent=c?.sub?String(Math.round(c.orderedDepth)):"⇕")};return i=requestAnimationFrame(l),()=>cancelAnimationFrame(i)},[e]),fr(o,{onMove:(i,l,h,c)=>{const d=o.current;if(!d)return;const b=d.getBoundingClientRect(),g=b.top+b.height/2,m=Hh((c+l-g)/r,-1,1),f=Math.abs(m)<.1?0:m;ee.active=!0,ee.planes=-f;const p=n.current;p&&(p.style.transform=`translate(-50%, calc(-50% + ${m*r}px))`,p.style.borderColor=cs,p.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{ee.planes=0;const i=n.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:s,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function Wh({mode:e,crew:o="luffy",vessel:n="sunny",hud:s=!0}){const[r,i]=w.useState(!1);w.useEffect(()=>{if(e!=="foot"){i(!1);return}const v=setInterval(()=>i(y.helm?.area==="deck"),200);return()=>clearInterval(v)},[e]);const l=w.useRef(),h=w.useRef(),c=w.useRef(),d=w.useRef(),b=62,g=7,m=w.useRef(e);if(m.current=e,fr(l,{onMove:(v,z,E,j)=>{const I=Math.hypot(v,z),a=I>b?b/I:1,k=v*a,L=z*a,A=h.current,M=c.current;A&&(A.style.transform=`translate(${E-b}px, ${j-b}px)`,A.style.opacity="1"),M&&(M.style.transform=`translate(${E+k-26}px, ${j+L-26}px)`,M.style.opacity="1"),d.current&&(d.current.style.opacity="0");const G=Math.abs(k)<g?0:k/b,F=Math.abs(L)<g?0:L/b;ee.active=!0,m.current==="foot"?(ee.walk.x=G,ee.walk.z=-F):(ee.throttle=-F,ee.rudder=-G)},onEnd:()=>{h.current&&(h.current.style.opacity="0"),c.current&&(c.current.style.opacity="0"),d.current&&(d.current.style.opacity=""),ee.throttle=0,ee.rudder=0,ee.walk.x=0,ee.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0},[e]),e==="off")return null;const f=e==="sub",p=e==="foot",x=r,u=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:l,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:h,style:{position:"fixed",left:0,top:0,width:b*2,height:b*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:c,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${ls}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),s&&t.jsxs("div",{ref:d,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:p?"DRAG TO WALK":"DRAG TO STEER"})]}),s&&t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[f&&t.jsx(Uh,{active:!0}),t.jsxs("div",{className:"og-actions",children:[f&&t.jsx(tt,{label:"SURFACE",sub:"blow all",onTap:()=>C.surfaceQueued=!0}),f&&t.jsx(tt,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>C.periscopeQueued=!0}),e==="helm"&&t.jsx(tt,{label:In(n).burst?.label??"BURST",sub:In(n).burst?.sub??"coup de",tone:"cool",onTap:()=>C.burstQueued=!0}),(e==="helm"||x)&&t.jsx(tt,{label:x?"TAKE WHEEL":"WALK DECK",sub:x?"back to it":"she sails on",onTap:()=>C.boardQueued=!0}),p&&t.jsx(tt,{label:"JUMP",sub:"↑",onTap:()=>C.jumpQueued=!0}),p&&t.jsxs(t.Fragment,{children:[t.jsx(tt,{label:u?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>C.pistolQueued=!0}),t.jsx(tt,{label:u?"YAKKO":"BAZOOKA",sub:u?"flying cut":"both fists",tone:"cool",onTap:()=>C.bazookaQueued=!0}),t.jsx(tt,{label:u?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>C.gigantQueued=!0}),t.jsx(tt,{label:u?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>C.rocketQueued=!0}),t.jsx(tt,{label:u?"ASURA":"HAKI",sub:"burst",onTap:()=>C.hakiQueued=!0}),!u&&t.jsx(tt,{label:"GEAR 2",sub:"overdrive",onTap:()=>C.gear2Queued=!0}),t.jsx(Ea,{label:u?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>ee.gatling=!0,onUp:()=>ee.gatling=!1})]}),!p&&t.jsx(_h,{}),t.jsx(Ea,{label:p?"RUN":"FLANK",sub:p?"»":"over",tone:"hot",onDown:()=>ee.boost=!0,onUp:()=>ee.boost=!1}),t.jsx(Bh,{simple:p})]})]}),t.jsx("style",{children:`
        .og-btn {
          border-radius: 10px;
          font: 700 11.5px/1.25 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.1em;
          text-align: center;
          padding: 11px 4px;
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
          transition: background .12s, border-color .12s, color .12s;
        }
        .og-btn-wide { font-size: 11px; }
        .og-btn-sub {
          display: block;
          font-size: 0.72em;
          opacity: 0.6;
          letter-spacing: 0.08em;
        }
        /* The right-hand column. Bottom-anchored and growing upward, so
           adding or removing a button never moves the thumb's resting
           target — and nothing in it can overlap anything else in it. */
        .og-right {
          position: fixed;
          right: max(16px, 3.4vw);
          bottom: calc(24px + env(safe-area-inset-bottom, 0px));
          z-index: 13;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }
        /* Two fixed columns, filling from the bottom-right corner outward.
           An odd button takes the whole last row rather than leaving a hole
           next to the one place the thumb naturally lands. */
        .og-actions {
          display: grid;
          grid-template-columns: repeat(2, 86px);
          gap: 8px;
        }
        .og-actions > :last-child:nth-child(odd) { grid-column: span 2; }

        /* ── the dive planes ──────────────────────────────────────────────
           A narrow strip on the right edge, sitting ABOVE the action column.
           Narrow on purpose: everything it does not cover is still the
           camera's look-drag area. */
        .og-planes {
          position: relative;
          flex: 0 0 auto;
          width: 62px;
          height: min(30vh, 200px);
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          border-radius: 32px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(8,6,16,0.34);
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
        }
        .og-planes-rail {
          position: absolute;
          left: 50%;
          top: 34px;
          bottom: 34px;
          width: 2px;
          transform: translateX(-50%);
          background: linear-gradient(
            180deg,
            rgba(74,169,201,0.55),
            rgba(255,255,255,0.14) 50%,
            rgba(74,169,201,0.55)
          );
        }
        .og-planes-cap {
          position: absolute;
          left: 0;
          right: 0;
          text-align: center;
          font: 700 8px/1 ui-monospace, Menlo, monospace;
          letter-spacing: 0.16em;
          color: rgba(255,255,255,0.42);
          pointer-events: none;
        }
        .og-planes-up { top: 12px; }
        .og-planes-dn { bottom: 12px; }
        .og-planes-knob {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(8,6,16,0.55);
          box-shadow: 0 0 18px rgba(74,169,201,0.3);
          pointer-events: none;
          display: flex;
          align-items: baseline;
          justify-content: center;
          gap: 1px;
          font: 700 15px/1 ui-monospace, Menlo, monospace;
          color: rgba(255,255,255,0.72);
          transition: border-color .12s, background .12s;
        }
        .og-planes-unit { font-size: 8px; opacity: 0.55; }

        /* THE STEERING HINT CLEARS THE CHART.
           At 104px up in the left corner it sat directly behind the minimap,
           so on every phone the one affordance that tells a first-time player
           the left half steers read as a stray "R" poking out from under a
           map. The chart is 168px tall plus its 14px inset, so the hint goes
           above it. */
        .og-hint {
          position: fixed;
          bottom: calc(198px + env(safe-area-inset-bottom, 0px));
          z-index: 12;
          display: flex;
          align-items: center;
          gap: 10px;
          pointer-events: none;
          font: 600 10px/1 ui-monospace, Menlo, monospace;
          letter-spacing: 0.22em;
          color: rgba(255,255,255,0.42);
          animation: ogPulse 3.4s ease-in-out infinite;
        }
        .og-ring {
          width: 44px; height: 44px; border-radius: 50%;
          border: 1.5px dashed rgba(255,255,255,0.3);
        }
        @keyframes ogPulse { 0%,100% { opacity: .34 } 50% { opacity: .8 } }
        /* Bottom CENTRE: the one strip of screen that belongs to neither
           thumb — the stick's ring springs up to the left of it and the
           action grid sits to the right. */
        .og-hint-right {
          left: 50%;
          transform: translateX(-50%);
          bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          animation: ogHintOut .9s ease 6.5s both;
          font-size: 9px;
          letter-spacing: 0.18em;
          text-align: center;
        }
        @keyframes ogHintOut { from { opacity: .5 } to { opacity: 0 } }

        /* Short landscape phones: the buttons ride lower, the planes strip
           shortens, and the stick area must not eat the whole screen. */
        @media (max-height: 480px) {
          .og-right { bottom: calc(10px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
          .og-actions { gap: 6px; grid-template-columns: repeat(2, 74px); }
          .og-hint { bottom: calc(152px + env(safe-area-inset-bottom, 0px)); }
          .og-btn { padding: 7px 2px; font-size: 10px; }
          .og-btn-wide { font-size: 9px; }
          .og-btn-sub { display: none; }
          .og-planes { height: min(30vh, 118px); width: 52px; }
          .og-planes-knob { width: 40px; height: 40px; font-size: 12px; }
          .og-planes-rail { top: 24px; bottom: 24px; }
          .og-planes-up { top: 7px; }
          .og-planes-dn { bottom: 7px; }
        }
        /* Narrow portrait phones: the two columns still have to fit beside
           the safe-area inset without touching the middle of the screen. */
        @media (max-width: 400px) {
          .og-actions { grid-template-columns: repeat(2, 76px); }
        }
      `})]})}const Yh=168,Vh=122,Ra="(max-width: 860px), (max-height: 520px)",zn=1950,Aa={x:0,z:340},ut={sea:"rgba(8,10,22,0.72)",ring:"#57506a",land:"#2e2836",skull:"#8a7358",fairway:"rgba(160,200,255,0.12)",gate:"#e8402a",port:"#f0ad50",rear:"#8fd4f2",whirl:"rgba(140,170,235,0.55)",you:"#ffe6a0"},mr=e=>({px:o=>(o-Aa.x)/zn*(e/2)+e/2,pz:o=>(o-Aa.z)/zn*(e/2)+e/2,pl:o=>o/zn*(e/2)});function $h(e,o,n){const{px:s,pz:r,pl:i}=mr(n);e.save(),e.scale(o,o),e.clearRect(0,0,n,n),e.fillStyle=ut.sea,e.fillRect(0,0,n,n),e.fillStyle=ut.fairway,e.fillRect(s(-Ko.halfWidth),0,i(Ko.halfWidth*2),n),e.strokeStyle=ut.ring,e.lineWidth=i(wt*.34),e.beginPath(),e.arc(s(pe.x),r(pe.z),i(wt),Math.PI*.34,Math.PI*.66,!0),e.stroke(),e.fillStyle=ut.skull,e.beginPath(),e.ellipse(s(P.x),r(P.z),i(P.r*P.squash[0]),i(P.r*P.squash[2]),0,0,Math.PI*2),e.fill(),e.strokeStyle=ut.gate,e.lineWidth=2;for(const[h,c]of[[Ot,1],[oo,1.5]])e.beginPath(),e.moveTo(s(-95*_*c),r(h)),e.lineTo(s(95*_*c),r(h)),e.stroke();e.strokeStyle=ut.whirl,e.lineWidth=1;for(const h of Be)e.beginPath(),e.arc(s(h.x),r(h.z),i(h.r),0,Math.PI*2),e.stroke();const l=(h,c,d,b=2.6)=>{e.fillStyle=d,e.beginPath(),e.arc(s(h),r(c),b,0,Math.PI*2),e.fill()};l(K.x,K.z,ut.port),l(he.x,he.z,ut.land,2),l(W.gate.x,W.gate.z,ut.rear),e.restore()}function Kh({mode:e}){const o=w.useRef(),n=w.useRef(),s=typeof window>"u"?1:Math.min(2,window.devicePixelRatio||1),[r,i]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ra).matches);w.useEffect(()=>{const b=window.matchMedia(Ra),g=()=>i(b.matches);return b.addEventListener?b.addEventListener("change",g):b.addListener(g),()=>{b.removeEventListener?b.removeEventListener("change",g):b.removeListener(g)}},[]);const[l,h]=w.useState(!0),c=r?Vh:Yh,d=w.useMemo(()=>{if(typeof document>"u")return null;const b=document.createElement("canvas");return b.width=c*s,b.height=c*s,$h(b.getContext("2d"),s,c),b},[s,c]);return w.useEffect(()=>{if(!n.current||!d||!l)return;const{px:b,pz:g}=mr(c),m=n.current.getContext("2d");let f;const p=()=>{f=requestAnimationFrame(p);const x=y.helm;if(m.setTransform(1,0,0,1,0,0),m.clearRect(0,0,c*s,c*s),m.drawImage(d,0,0),!x||x.x===void 0)return;m.save(),m.scale(s,s);const u=b(x.x),v=g(x.z),z=x.sub&&x.depth>4;m.translate(u,v),x.heading!==void 0?(m.rotate(x.heading+Math.PI),m.beginPath(),m.moveTo(0,-5.5),m.lineTo(3.4,4),m.lineTo(0,2),m.lineTo(-3.4,4),m.closePath()):(m.beginPath(),m.arc(0,0,3,0,Math.PI*2)),m.fillStyle=z?"rgba(0,0,0,0)":ut.you,m.strokeStyle=ut.you,m.lineWidth=1.2,m.fill(),m.stroke(),m.restore(),z&&(m.save(),m.scale(s,s),m.fillStyle=ut.rear,m.font="600 9px ui-monospace, SFMono-Regular, Menlo, monospace",m.textAlign="right",m.fillText(`${Math.round(x.depth)}m DOWN`,c-6,c-6),m.restore())};return p(),()=>cancelAnimationFrame(f)},[d,s,e,l,c]),e==="off"?null:l?t.jsxs("div",{className:"og-minimap",style:{position:"fixed",left:14,bottom:14,zIndex:12,width:c,height:c,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.16)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",pointerEvents:"none"},children:[t.jsx("canvas",{ref:n,width:c*s,height:c*s,style:{width:c,height:c,display:"block"}}),t.jsx("div",{style:{position:"absolute",top:4,left:6,font:"600 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)"},children:"鬼ヶ島"}),t.jsx("button",{className:"og-map-close",onClick:()=>h(!1),"aria-label":"Hide the chart",children:"✕"}),t.jsx("canvas",{ref:o,style:{display:"none"}}),t.jsx("style",{children:Ia})]}):t.jsxs(t.Fragment,{children:[t.jsx("button",{className:"og-map-tab",title:"Show the chart",onClick:()=>h(!0),"aria-label":"Show the chart",children:"鬼ヶ島 CHART"}),t.jsx("style",{children:Ia})]})}const Ia=`
        .og-map-close, .og-map-tab {
          appearance: none;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(8,6,16,0.62);
          color: rgba(255,255,255,0.7);
          font: 700 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace;
          cursor: pointer;
          pointer-events: auto;
          -webkit-tap-highlight-color: transparent;
        }
        .og-map-close {
          position: absolute;
          top: 3px;
          right: 3px;
          width: 26px;
          height: 26px;
          border-radius: 4px;
        }
        /* The folded chart. Deliberately the size of a button and in the
           bottom-left, which is the one corner neither thumb rests on. */
        .og-map-tab {
          position: fixed;
          left: 14px;
          bottom: calc(14px + env(safe-area-inset-bottom, 0px));
          z-index: 12;
          padding: 8px 10px;
          min-height: 34px;
          border-radius: 5px;
          letter-spacing: 0.14em;
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
        }
`,Ca={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function Xh(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const Qh=null;function t0(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(Xh),[n,s]=w.useState("auto"),r=n==="auto"?o:n,i=Ca[r]??Ca.high;w.useEffect(()=>{bi(i.scene!=="low")},[i.scene]),w.useMemo(()=>Ga(i.scene),[i.scene]),w.useMemo(()=>Yl(),[]),w.useEffect(()=>$l(),[]);const l=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,c]=w.useState(0),[d,b]=w.useState(!0),[g,m]=w.useState(!0),[f,p]=w.useState(1),[x,u]=w.useState(Js[0]),[v,z]=w.useState(0),[E,j]=w.useState(mh),[I,a]=w.useState(()=>{if(typeof location>"u")return"off";const J=new URLSearchParams(location.search).get("mode");return J==="helm"||J==="sub"||J==="foot"?J:"off"}),[k,L]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy"),[A,M]=w.useState(()=>typeof location>"u"?"sunny":new URLSearchParams(location.search).get("ship")==="punk"?"punk":"sunny");w.useEffect(()=>{if(!E)return;const J=()=>{Mn(),vn(!0)};for(const Ae of["pointerdown","keydown","touchstart"])window.addEventListener(Ae,J,{once:!0,passive:!0});return()=>{for(const Ae of["pointerdown","keydown","touchstart"])window.removeEventListener(Ae,J)}},[E]);const G=w.useCallback(()=>{j(J=>{const Ae=!J;return Ae&&Mn(),vn(Ae),Ae})},[]),[F,O]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),oe=w.useCallback(J=>{E&&(Mn(),vn(!0)),J==="off"?(y.jumpTo=0,b(!0),m(!0)):a(J),O(!0)},[E]),[ue,D]=w.useState(()=>ve.hud);w.useEffect(()=>as(J=>D(J.hud)),[]);const[$,Q]=w.useState(!1),ae=w.useRef(!0);w.useEffect(()=>{if(sr(),ae.current){ae.current=!1;return}Q(!0);const J=setTimeout(()=>Q(!1),210);return()=>clearTimeout(J)},[I]);const be=w.useCallback((J,Ae)=>{z(J),u(Ae)},[]),de=w.useCallback(()=>{xi(),c(J=>J+1),b(!0),m(!0)},[]),Ce=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(Qh,{})}):t.jsxs(t.Fragment,{children:[t.jsx(vr,{shadows:i.shadows,dpr:i.dpr,gl:{antialias:i.aa,powerPreference:"high-performance",toneMapping:Rr,toneMappingExposure:Fr,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(Lh,{quality:i.scene,budget:i,onRails:g,playing:d,speed:f,onShot:be,mode:I,onMode:a,crew:k,vessel:A},h)})}),l&&F&&t.jsx(Wh,{mode:I,crew:k,vessel:A,hud:ue}),F&&ue&&t.jsx(Kh,{mode:I}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:$?1:0,transition:$?"opacity .2s ease-in":"opacity .42s ease-out"}}),!F&&t.jsx(Nh,{onPick:oe}),t.jsx(Oh,{veiled:!F,shot:x,shotIndex:v,shotCount:Js.length,total:Wn,playing:d,onRails:g,speed:f,tier:r,override:n,dev:Ce,onPlay:()=>b(J=>!J),onRailsToggle:()=>m(J=>!J),onSpeed:p,onQuality:s,onRestart:de,audio:E,onAudio:G,mode:I,onMode:a,crew:k,onCrew:L,vessel:A,onVessel:M,stage:y})]})}export{t0 as default};
