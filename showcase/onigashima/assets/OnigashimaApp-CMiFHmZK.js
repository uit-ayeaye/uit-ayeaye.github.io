var sr=Object.defineProperty;var ar=(e,o,n)=>o in e?sr(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var ns=(e,o,n)=>ar(e,typeof o!="symbol"?o+"":o,n);import{r as b,u as ne,j as t,d as xa,f as be,h as rr,i as ir}from"./vendor-C2HIMx-P.js";import{t as ve,c as j,aD as vn,au as Hn,d as _n,a5 as De,aJ as lr,f as cr,Y as ss,a0 as as,ag as T,h as oe,aK as hr,ay as dr,az as to,aA as oo,aq as ba,R as ur,M as rt,o as mt,at as Dt,ax as wt,aL as no,aM as so,a4 as pr,a8 as Lt,ar as ao,av as wa,aC as fr,A as mr}from"./three-Zo_RlN_K.js";import{f as qt,m as bo,w as Ue,a as Ut,e as Et,P as gr,G as xr,S as br,I as wr}from"./index-CzNdpRVu.js";const Z={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},E={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},Wo={dir:[.72,.52,-.44],col:"#f2e9cf"},Ft={sea:.00105,bay:48e-5,deepGrade:210},yr=1.15;function ie(e){const o=new ve(e);return[o.r,o.g,o.b]}const vr=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,Mr=`
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
`;function jr({storm:e}){const o=b.useRef(),n=b.useMemo(()=>({uTime:{value:0},uHigh:{value:new j(...ie(Z.skyHigh))},uLow:{value:new j(...ie(Z.skyLow))},uCloud:{value:new j(...ie(Z.cloud))},uCloudLit:{value:new j(...ie(Z.cloudLit))},uEmber:{value:new j(...ie(E.ember))},uFlash:{value:0},uFlashColor:{value:new j(...ie(Z.boltGlow))},uFlashDir:{value:new j(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new j(...Wo.dir).normalize()},uMoonCol:{value:new j(...ie(Wo.col))},uUnder:{value:0},uUnderCol:{value:new j(...ie(Z.underHaze))}}),[]);return ne((s,i)=>{const a=o.current?.uniforms;a&&(a.uTime.value+=i,a.uFlash.value=e?.flash??0,e?.flashDir&&a.uFlashDir.value.copy(e.flashDir),a.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:vr,fragmentShader:Mr,uniforms:n,side:vn,depthWrite:!1,depthTest:!1,fog:!1})]})}const N=1.9,V=e=>e*N,de={x:0,z:V(-60)},ft=V(300),No=V(175),Sr=118,L={x:0,z:V(-402),r:V(215),baseY:300,squash:[1.18,1.04,.98]},mo=[[-.361,.301,.883],[.361,.301,.883]],Bn=[0,.02,.9998],Un=[0,-.419,.908];function Wn(e,o=1){const[n,s,i]=L.squash;return{x:L.x+e[0]*L.r*n*o,y:L.baseY+e[1]*L.r*s*o,z:L.z+e[2]*L.r*i*o}}const Ae=mo.map(e=>Wn(e)),he={...Wn(Un),halfWidth:74,height:62};Wn(Bn,.94);const Q={x:V(-152),y:4.5,z:V(-104),r:V(78)},rs=2.35,Gt=[Math.sin(rs),Math.cos(rs)],U=(()=>{const e=ft+No*.35,o=de.x+Gt[0]*e,n=de.z+Gt[1]*e;return{x:o,z:n,pool:V(46),benchY:3.6,reach:V(560),gate:{x:o-Gt[0]*V(44),z:n-Gt[1]*V(44)},berth:{x:o+Gt[0]*V(12),z:n+Gt[1]*V(12)},dir:Gt}})(),kr=[{rank:1,role:"east-south",ang:.75,dist:V(730),r:V(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:V(730),r:V(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:V(770),r:V(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:V(690),r:V(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:V(690),r:V(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:V(765),r:V(150),depth:42,dir:1,speed:35}],Ne=[];function ya(e){const o=e==="low"?3:e==="mid"?5:7;Ne.length=0;for(const n of kr)n.rank>o||Ne.push({role:n.role,x:de.x+Math.sin(n.ang)*n.dist,z:de.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Ne}const zr=e=>Ne.find(o=>o.role===e)??Ne[0];ya("high");function va(e,o,n=0){let s=0,i=0;const a=1-Xe(8,34,n);if(a<=0)return{vx:s,vz:i,danger:0};let c=0;for(const d of Ne){const h=e-d.x,p=o-d.z,g=Math.hypot(h,p);if(g>d.r*1.7||g<.001)continue;const f=g/d.r,m=1-Xe(1,1.6,f),l=d.speed*(f/.3)*Math.exp(1-f/.3)*.62*m,u=d.speed*.55*Math.exp(-f*f*2.6)*m+d.speed*.1*m,x=1/g;s+=(-p*x*l*d.dir-h*x*u)*a,i+=(h*x*l*d.dir-p*x*u)*a,c=Math.max(c,(1-Xe(.15,1.15,f))*a)}return{vx:s,vz:i,danger:c}}const Yo={x:0,halfWidth:V(96)},Pt=V(258),Jt=V(624),Vo={safe:260,range:1150},Tr=0,Ho=V(1500),$o=e=>e<0?0:e>1?1:e;function Er(e,o,n=4){let s=0,i=1,a=1,c=0;for(let d=0;d<n;d++){const h=1-Math.abs(qt(e*a,o*a,1)*2-1);s+=h*h*i,c+=i,i*=.52,a*=2.07}return s/c}const Xe=(e,o,n)=>{const s=$o((n-e)/(o-e));return s*s*(3-2*s)};function Rr(e){if(e>V(430))return 1e4;const o=1-Xe(V(430),V(205),e),n=Xe(V(150),V(-30),e);return Yo.halfWidth+o*V(620)+n*V(300)}function Ar(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let s=Sr;return s+=o*190,s+=Math.max(0,n)*46,s-=Math.max(0,-n)*26,s}function re(e,o){const n=e-de.x,s=o-de.z,i=Math.hypot(n,s),a=Math.atan2(n,s),c=(i-ft)/No,d=Math.exp(-c*c*1.35)*Ar(a),h=Math.max(0,i-ft-No*.55),p=-Math.pow(h/210,1.6)*175,g=Math.max(0,ft-No*.5-i),f=-Xe(0,150,g)*46,m=$o(d/60),l=(Er(e*.0052/N+13,o*.0052/N-21,4)-.42)*168*m,u=(qt(e*.0042/N+31,o*.0042/N-17,4)-.5)*84*m,x=(qt(e*.021-5,o*.021+9,3)-.5)*17*m;let v=d+p+f+l+u+x;const w=Rr(o),k=1-Xe(w,w+V(105),Math.abs(e-Yo.x)),z=1-Xe(V(-40),V(-190),o),r=k*z;v=v*(1-r)+Math.min(v,-34)*r;const M=Math.hypot(e-L.x,o-L.z);v+=Math.exp(-Math.pow(M/(L.r*1.55),2))*62;const F=(e-Q.x)/V(76),C=(o-Q.z)/V(58),S=(1-Xe(.72,1.18,Math.hypot(F,C)))*$o((v+34)/34);v=v*(1-S)+Q.y*S;const R=e-U.x,A=o-U.z;if(Math.abs(R)+Math.abs(A)<U.reach+V(140)){const B=Math.max(0,Math.min(U.reach,R*U.dir[0]+A*U.dir[1])),G=R-U.dir[0]*B,$=A-U.dir[1]*B,q=Math.hypot(G,$),ee=V(30)+B/U.reach*V(48),P=1-Xe(ee,ee+V(62),q);v=v*(1-P)+Math.min(v,-26)*P;const K=Math.hypot(R,A),ae=1-Xe(U.pool*.55,U.pool,K);v=v*(1-ae)+Math.min(v,-14)*ae;const H=(e-U.gate.x)/V(30),te=(o-U.gate.z)/V(24),we=1-Xe(.72,1.18,Math.hypot(H,te));v=v*(1-we)+U.benchY*we}return v}function Yn(e,o,n=3){const s=re(e+n,o)-re(e-n,o),i=re(e,o+n)-re(e,o-n),a=-s,c=2*n,d=-i,h=Math.hypot(a,c,d)||1;return[a/h,c/h,d/h]}function Ir(e,o,n=3){return Math.acos(Yn(e,o,n)[1])}function wo(e,o){const n=Xe(V(250),V(40),o),s=1-Xe(ft-V(40),ft+V(90),Math.hypot(e-de.x,o-de.z)),i=(1-Xe(V(60),V(170),Math.hypot(e-U.x,o-U.z)))*.85;return $o(Math.max(Math.min(n,s),i))}const Ma=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],Cr=Math.PI*2;function Fr(e,o,n){let s=0,i=0,a=0;for(const c of Ne){const d=e-c.x,h=o-c.z,p=Math.max(1,Math.hypot(d,h));if(p>c.r*1.75)continue;const g=p/c.r,f=Math.exp(-3*g*g);s-=c.depth*f;const m=c.depth*6*g*f/c.r;i+=m*(d/p),a+=m*(h/p);const l=Math.atan2(h,d),u=Math.sin(l*3*c.dir+g*14-n*2.2),x=g*Math.exp(1-g)*(1-Pr(g));s+=u*x*1.6}return{y:s,dx:i,dz:a}}function Pr(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function ut(e,o,n,s=1){let i=0,a=0,c=0;for(const h of Ma){const p=Cr/h.len,g=Math.sqrt(9.81/p),f=Math.hypot(h.dir[0],h.dir[1]),m=h.dir[0]/f,l=h.dir[1]/f,u=p*(m*e+l*o-g*n),x=h.amp*s;i+=x*Math.sin(u);const v=x*p*Math.cos(u);a+=v*m,c+=v*l}const d=Fr(e,o,n);return i+=d.y,a+=d.dx,c+=d.dz,{y:i,dx:a,dz:c}}const Lr=Ma.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Gr=()=>Ne.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),Or=()=>Ne.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),Dr=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*N).toFixed(1)}, ${(250*N).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(ft-40*N).toFixed(1)}, ${(ft+90*N).toFixed(1)},
      length(p - vec2(${de.x.toFixed(1)}, ${de.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*N).toFixed(1)}, ${(170*N).toFixed(1)},
      length(p - vec2(${U.x.toFixed(1)}, ${U.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Nr=()=>`
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
${Dr}

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
${Lr}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Gr()}

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
`,Hr=()=>`
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
${Or()}
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
`;function _r(e,o){const n=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let a=0;a<e;a++){const c=de.x+((a+.5)/e-.5)*o,d=de.z+((i+.5)/e-.5)*o,h=re(c,d),p=T.clamp(-h/46,0,1),g=(i*e+a)*4;n[g]=Math.round(p*255),n[g+1]=n[g],n[g+2]=n[g],n[g+3]=255}const s=new lr(n,e,e,cr);return s.minFilter=ss,s.magFilter=ss,s.wrapS=as,s.wrapT=as,s.needsUpdate=!0,s}const Ko={low:112,mid:190,high:286},Mn=6400;function Br(e){const o=b.useRef(),n=Mn/(Ko[e]??Ko.high);return ne(s=>{const i=o.current;i&&(i.position.x=Math.round((s.camera.position.x-de.x)/n)*n,i.position.z=Math.round((s.camera.position.z-de.z)/n)*n)}),o}function Ur({quality:e="high",storm:o}){const n=b.useRef(),s=Br(e),{geometry:i,uniforms:a,landTex:c,vert:d,frag:h}=b.useMemo(()=>{const p=Ko[e]??Ko.high,g=new Hn(Mn,Mn,p,p);g.rotateX(-Math.PI/2),g.translate(de.x,0,de.z);const f=Ho*1.05,m=_r(e==="low"?160:256,f),l={uTime:{value:0},uLand:{value:m},uSpan:{value:f},uCentre:{value:new _n(de.x,de.z)},uDeep:{value:new j(...ie(Z.seaDeep))},uShallow:{value:new j(...ie(Z.seaShallow))},uFoam:{value:new j(...ie(Z.foam))},uSkyLow:{value:new j(...ie(Z.skyLow))},uGilt:{value:new j(...ie(E.gilt))},uEmber:{value:new j(...ie(E.ember))},uFogColor:{value:new j(...ie(Z.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new j(...ie(Z.abyss))},uUnderGlow:{value:new j(...ie(Z.underGlow))},uDepthFade:{value:0},uMoonDir:{value:Wr.clone()},uMoonCol:{value:new j(...ie(Yr))},uEyeA:{value:new j(Ae[0].x,Ae[0].y,Ae[0].z)},uEyeB:{value:new j(Ae[1].x,Ae[1].y,Ae[1].z)},uFlash:{value:0},uFlashColor:{value:new j(...ie(Z.boltGlow))},uCameraPos:{value:new j}};return{geometry:g,uniforms:l,landTex:m,vert:Nr(),frag:Hr()}},[e]);return ne((p,g)=>{const f=n.current?.uniforms;if(!f)return;f.uTime.value+=g,f.uCameraPos.value.copy(p.camera.position),f.uFlash.value=o?.flash??0,f.uFogDensity.value=o?.fog??.0011;const m=Math.min(1,Math.max(0,(o?.depthBelow??0)/Ft.deepGrade));f.uDepthFade.value=m,is.copy($r).lerp(Kr,m*.8),f.uFogColor.value.lerpVectors(Vr,is,o?.underwater??0)}),t.jsx("mesh",{ref:s,geometry:i,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:d,fragmentShader:h,uniforms:a,transparent:!1,side:De},c.uuid)})}const Wr=new j(...Wo.dir).normalize(),Yr=Wo.col,Vr=new j(...ie(Z.haze)),$r=new j(...ie(Z.underHaze)),Kr=new j(...ie(Z.abyss)),is=new j;function Xr({quality:e="high",segments:o=200}){const n=b.useMemo(()=>{const s=o,i=new Hn(Ho,Ho,s,s);i.rotateX(-Math.PI/2);const a=i.attributes.position,c=a.count,d=new Float32Array(c*3),h=new ve(Z.rock),p=new ve(Z.rockLit),g=new ve("#0b0e18"),f=new ve(Z.snow),m=new ve(E.rockWarm),l=new ve;for(let u=0;u<c;u++){const x=a.getX(u)+de.x,v=a.getZ(u)+de.z,w=re(x,v);a.setX(u,x),a.setY(u,w),a.setZ(u,v);const k=Yn(x,v,Ho/s)[1],z=Math.max(0,(k-.55)/.45);l.copy(h).lerp(p,T.clamp(w/190,0,1));const r=1-T.clamp((w-Tr)/13,0,1);l.lerp(g,r*.85);const M=T.clamp((x-de.x)/260,0,1),F=96-M*42,C=T.clamp((w-F)/60,0,1)*z;l.lerp(f,C*(.45+M*.5));const S=Math.hypot(x-L.x,v-L.z),R=Math.exp(-Math.pow(S/330,2)),A=T.clamp((v-L.z)/260,0,1);l.lerp(m,R*A*.6*(1-C)),d[u*3]=l.r,d[u*3+1]=l.g,d[u*3+2]=l.b}return i.setAttribute("color",new oe(d,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const Vn=-30,$n=330,Qr=150,pe={x:he.x,y:he.y-40,z:he.z-Qr-(Vn+$n)},Ce={centre:[0,96,Vn],radii:[350,235,$n]},jt={x:pe.x+Ce.centre[0],y:pe.y+Ce.centre[1],z:pe.z+Ce.centre[2]};function Zr(e,o,n){const s=(e-jt.x)/Ce.radii[0],i=(o-jt.y)/Ce.radii[1],a=(n-jt.z)/Ce.radii[2];return Math.sqrt(s*s+i*i+a*a)}function jn(e,o=.06){const n=(e.x-jt.x)/Ce.radii[0],s=(e.y-jt.y)/Ce.radii[1],i=(e.z-jt.z)/Ce.radii[2],a=Math.sqrt(n*n+s*s+i*i),c=1+o;if(a>=c)return null;const d=a<1e-4?0:c/a;return e.x=jt.x+(d?n*d:0)*Ce.radii[0],e.y=jt.y+(d?s*d:c)*Ce.radii[1],e.z=jt.z+(d?i*d:0)*Ce.radii[2],e}const le={y:0,halfX:290,zFront:228,zBack:-240},Le={y:40,z:Vn+$n-40,halfX:96,depth:120},lt={zTop:Le.z-54,zBottom:140,halfX:74,steps:16},O={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},Ee={y:74,z:O.z+O.halfZ+26,halfX:96,depth:40},It=Ee.y+3.5,Qe={y:-95,halfX:220,halfZ:175,ceiling:-34},ke={x:0,z:84,halfX:52,halfZ:40},xe={y:52,halfZ:205,x:252,tiers:3,tierRise:46},ko=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],me={x:74,halfW:14,zFoot:O.z+O.halfZ+158,zTop:Ee.z+Ee.depth/2-6},ja=[{kind:"rampZ",x0:-74-me.halfW,x1:-74+me.halfW,z0:me.zFoot,z1:me.zTop,y0:0,y1:It},{kind:"rampZ",x0:me.x-me.halfW,x1:me.x+me.halfW,z0:me.zFoot,z1:me.zTop,y0:0,y1:It},{kind:"flat",x0:-96,x1:Ee.halfX,z0:Ee.z-Ee.depth/2-2,z1:me.zTop,y:It},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:xe.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:xe.y-.5},{kind:"flat",x0:xe.x-38,x1:xe.x+38,z0:-225,z1:xe.halfZ+20,y:xe.y-.5}],qr=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Sa=(()=>{const e=[],o=[],n=[],s=O.halfX+6,i=[s,s+9],a=[s+11,s+20],c=[s,s+20],d=[-212,-200],h=[-264,-252],p=[It];for(let f=2;f<=O.storeys;f++)p.push(O.plinth+f*O.storey+1.5);e.push({kind:"flat",x0:Ee.halfX-6,x1:s+20,z0:-212,z1:-196,y:It}),o.push([(Ee.halfX-6+s+20)/2,It,-204,s+26-Ee.halfX,16]);for(let f=0;f<p.length-1;f++){const m=p[f],l=p[f+1],u=(m+l)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:d[0],z1:h[1],y0:m,y1:u}),n.push({x0:i[0],x1:i[1],z0:d[0],z1:h[1],y0:m,y1:u}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:h[0],z1:h[1],y:u}),o.push([(c[0]+c[1])/2,u,(h[0]+h[1])/2,c[1]-c[0],h[1]-h[0]]),e.push({kind:"rampZ",x0:a[0],x1:a[1],z0:h[1],z1:d[0],y0:u,y1:l}),n.push({x0:a[0],x1:a[1],z0:h[1],z1:d[0],y0:u,y1:l}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:d[0],z1:d[1],y:l}),o.push([(c[0]+c[1])/2,l,(d[0]+d[1])/2,c[1]-c[0],d[1]-d[0]])}for(let f=1;f<p.length-1;f++){const l=1-Math.min(O.storeys,f+2)*O.taper,u=O.halfX*l,x=O.z+O.halfZ*l,v=p[f];e.push({kind:"flat",x0:u-4,x1:s,z0:-224,z1:-212,y:v}),o.push([(u-4+s)/2,v,-218,s-u+4,12]),e.push({kind:"flat",x0:-u-6,x1:u+6,z0:x,z1:-212,y:v}),o.push([0,v,(x-212)/2,u*2+12,-212-x])}const g=p[p.length-1];return e.push({kind:"flat",x0:58,x1:s,z0:-248,z1:-212,y:g}),o.push([(s+58)/2,g,-230,s-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[s,s+20],z:[h[0],d[1]]}}})();ja.push(...Sa.walks);const Jr=1.1;function ei(e,o,n=1/0){const s=n+Jr;let i=-1/0;for(const a of ja){if(e<a.x0||e>a.x1)continue;const c=Math.min(a.z0,a.z1),d=Math.max(a.z0,a.z1);if(o<c||o>d)continue;const h=a.kind==="flat"?a.y:a.y0+(a.y1-a.y0)*qr((o-a.z0)/(a.z1-a.z0));h<=s&&h>i&&(i=h)}return i===-1/0?0:Math.max(0,i)}function ti(e,o,n=1/0){const s=o>lt.zTop?Le.y:o>lt.zBottom?Le.y*(o-lt.zBottom)/(lt.zTop-lt.zBottom):0,i=ei(e,o,n);return Math.max(s,i)}function oi(e,o,n){const s=O.plinth+O.storeys*O.storey;if(n>s)return!1;const a=1-(n<=O.plinth?0:Math.min(O.storeys,Math.ceil((n-O.plinth)/O.storey)))*O.taper;return Math.abs(e)<O.halfX*a&&Math.abs(o-O.z)<O.halfZ*a}const y={t:0,flash:0,flashDir:new j(0,.4,-1),fog:Ft.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new j(0,0,0),helmActive:!1,helmPos:new j(0,0,0),helmSpeed:0,ship:{x:0,y:0,z:0,heading:Math.PI,loa:42,deckY:5.5},subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new j(0,60,-200)}};function ni(){y.t=0,y.progress=0,y.flash=0,y.fog=Ft.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const an=new Map;let ka=!0;function si(e){ka=!!e}function ai(e){const o=bo(e);return an.has(o)||an.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),an.get(o)}function ot(e){const[o,n]=b.useState(!1);return b.useEffect(()=>{let s=!0;return ai(e).then(i=>{s&&n(i&&ka)}),()=>{s=!1}},[e]),o}const St=mo.map(e=>new j(...e).normalize()),za=new j(...Bn).normalize(),Sn=new j(...Un).normalize();function ri(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const h of St){const p=e.dot(h),g=Math.pow(Math.max(0,p),46);o-=g*.3}const s=Math.max(0,e.dot(za)),i=Math.pow(s,150)*(1-Math.max(0,e.y)*.5);o-=i*.19;for(const h of St){const p=new j(h.x*1.5,h.y-.55,h.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,p),26)*.075}const a=Math.max(0,e.dot(Sn));o-=Math.pow(a,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const c=Math.pow(Math.max(0,e.dot(St[0])),30)+Math.pow(Math.max(0,e.dot(St[1])),30),d=1-Math.min(1,c);return o+=(qt(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*d,o+=(qt(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*d,o}const ii=178*1.9,et=L.r/ii;function ls(e,o){const n=e*et,s=[new j(n*74,96*et,-20*et),new j(n*142,176*et,-58*et),new j(n*196,268*et,-76*et),new j(n*222,356*et,-52*et),new j(n*206,424*et,8*et),new j(n*154,462*et,72*et)],i=new j;for(const g of s)i.set(L.x+g.x,L.baseY+g.y,L.z+g.z),jn(i,.12)&&g.set(i.x-L.x,i.y-L.baseY,i.z-L.z);const a=new to(s),c=o==="low"?14:o==="mid"?22:34,d=o==="low"?6:10,h=new oo(a,c,1,d,!1),p=h.attributes.position;for(let g=0;g<=c;g++){const f=g/c,m=34*et*Math.pow(1-f,.72)*(1+Math.sin(f*Math.PI)*.16),l=a.getPoint(f);for(let u=0;u<=d;u++){const x=g*(d+1)+u;if(x>=p.count)continue;const v=p.getX(x)-l.x,w=p.getY(x)-l.y,k=p.getZ(x)-l.z;p.setXYZ(x,l.x+v*m,l.y+w*m,l.z+k*m)}}return p.needsUpdate=!0,h.computeVertexNormals(),h}const li={low:4,mid:6,high:7},Ta="skull-island.opt.glb",io={height:1,yaw:0,lift:.02},rn=new ur,cs=new j,zo=new j;function ci(e,o,n){zo.set(o[0],o[1],o[2]).normalize(),cs.copy(zo).multiplyScalar(L.r*4),rn.set(cs,zo.clone().negate()),rn.far=L.r*8;const s=rn.intersectObject(e,!0)[0];return s?s.point.clone().addScaledVector(zo,-n):null}function hi({shadows:e}){const{scene:o}=xa(bo(Ta)),{object:n,eyes:s,nose:i,mouth:a}=b.useMemo(()=>{const c=o.clone(!0),d=new ba().setFromObject(c),h=new j,p=new j;d.getSize(h),d.getCenter(p);const g=L.r*L.squash[1]*1.62,f=h.y>1e-4?g*io.height/h.y:1,m=L.r*L.squash[1]*io.lift;c.scale.setScalar(f),c.rotation.set(0,io.yaw,0),c.position.set(0,-p.y*f+m,0);const l=p.x*f,u=p.z*f,x=Math.cos(io.yaw),v=Math.sin(io.yaw);c.position.x=-(l*x+u*v),c.position.z=-(-l*v+u*x),c.updateMatrixWorld(!0);let w=0,k=0;const z={x:0,y:0,z:0},r=new j,M=[];c.traverse(G=>{G.isMesh&&M.push(G)});for(const G of M){const $=G.geometry.clone();for(const P of["position","normal"]){const K=$.attributes[P];if(!K||K.array instanceof Float32Array)continue;const ae=new Float32Array(K.count*3);for(let H=0;H<K.count;H++)r.fromBufferAttribute(K,H),ae[H*3]=r.x,ae[H*3+1]=r.y,ae[H*3+2]=r.z;$.setAttribute(P,new oe(ae,3))}$.applyMatrix4(G.matrixWorld);const q=$.attributes.position;k+=q.count;for(let P=0;P<q.count;P++)z.x=q.getX(P)+L.x,z.y=q.getY(P)+L.baseY,z.z=q.getZ(P)+L.z,jn(z,.05)&&(q.setXYZ(P,z.x-L.x,z.y-L.baseY,z.z-L.z),w++);w&&$.computeVertexNormals(),q.needsUpdate=!0,$.computeBoundingSphere(),$.computeBoundingBox(),G.geometry=$,G.castShadow=e,G.receiveShadow=!1;const ee=Array.isArray(G.material)?G.material:[G.material];for(const P of ee)P.color?.multiply(di),P.roughness=.94,P.metalness=.02}for(const G of[c,...M])G.position.set(0,0,0),G.quaternion.identity(),G.scale.set(1,1,1),G.updateMatrix();c.updateMatrixWorld(!0);const F=(G,$=1)=>{const[q,ee,P]=L.squash;return new j(G[0]*L.r*q*$,G[1]*L.r*ee*$,G[2]*L.r*P*$)},C=mo.map(G=>ci(c,G,L.r*.1)??F(G,.82)),S=new j().addVectors(C[0],C[1]).multiplyScalar(.5),R=new j().addVectors(F(mo[0],.82),F(mo[1],.82)).multiplyScalar(.5),A=S.clone().sub(R),B=G=>{const $={x:G.x+L.x,y:G.y+L.baseY,z:G.z+L.z};return jn($,.22)&&G.set($.x-L.x,$.y-L.baseY,$.z-L.z),G};return{object:c,eyes:C.map(B),nose:B(F(Bn,.87).add(A)),mouth:B(F(Un,.9).add(A))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Ea,{eyes:s,nose:i,mouth:a,teeth:null,cast:e})]})}const di=new ve("#8f8a84");function Ea({eyes:e,nose:o,mouth:n,teeth:s,cast:i}){const a=b.useRef(),c=b.useRef(),d=b.useRef();return ne(()=>{const h=y.t,p=.82+.18*Math.sin(h*2.3)*Math.sin(h*.71),g=.82+.18*Math.sin(h*1.9+2.1)*Math.sin(h*.63),f=.86+.14*Math.sin(h*1.4+.8);a.current&&(a.current.emissiveIntensity=5.2*p+y.flash*2),c.current&&(c.current.emissiveIntensity=5.2*g+y.flash*2),d.current&&(d.current.emissiveIntensity=3.4*f)}),t.jsxs(t.Fragment,{children:[e.map((h,p)=>t.jsxs("mesh",{position:h,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[L.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:p===0?a:c,color:E.furnace,emissive:E.ember,emissiveIntensity:5.2,toneMapped:!1,side:De,roughness:1})]},p)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[L.r*.046,L.r*.083,3]}),t.jsx("meshStandardMaterial",{color:E.emberDeep,emissive:E.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,L.r*.05,-L.r*.16],children:[t.jsx("planeGeometry",{args:[L.r*.62,L.r*.34]}),t.jsx("meshStandardMaterial",{ref:d,color:E.ember,emissive:E.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:De})]}),s?.map((h,p)=>t.jsxs("mesh",{position:h.pos,scale:h.scale,rotation:[0,0,h.rot],castShadow:i,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:E.emberDeep,emissiveIntensity:.42,roughness:.78})]},p))]})]})}const ui=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function pi({quality:e="high",shadows:o=!0}){const s=ot(Ta)&&e!=="low"&&ui!=="proc",{dome:i,hornL:a,hornR:c,teeth:d}=b.useMemo(()=>{const l=new hr(L.r,li[e]??7),u=l.attributes.position,x=new Float32Array(u.count*3),v=new ve(Z.rock),w=new ve(E.rockWarm),k=new ve("#120b10"),z=new ve,r=new j;for(let S=0;S<u.count;S++){r.set(u.getX(S),u.getY(S),u.getZ(S)).normalize();const R=L.r*ri(r),[A,B,G]=L.squash;u.setXYZ(S,r.x*R*A,r.y*R*B,r.z*R*G);const $=Math.max(Math.pow(Math.max(0,r.dot(St[0])),5),Math.pow(Math.max(0,r.dot(St[1])),5),Math.pow(Math.max(0,r.dot(Sn)),6)*.9);z.copy(v).lerp(w,Math.min(1,$*1.5+Math.max(0,r.z)*.22));const q=Math.max(Math.pow(Math.max(0,r.dot(St[0])),40),Math.pow(Math.max(0,r.dot(St[1])),40));z.lerp(k,q),x[S*3]=z.r,x[S*3+1]=z.g,x[S*3+2]=z.b}l.setAttribute("color",new oe(x,3)),l.computeVertexNormals();const M=new dr(1,1,1),F=[],C=9;for(let S=0;S<C;S++){const R=S/(C-1)*2-1,A=he.halfWidth*2.1,B=R*A*.5,G=Math.pow(Math.abs(R),1.7)*14,$=46-Math.abs(R)*13+S%2*7;F.push({pos:[B,he.height*.5-G-$*.5,6],scale:[A/C*.76,$,52],rot:R*.13})}return M.dispose?.(),{dome:l,hornL:ls(-1,e),hornR:ls(1,e),teeth:F}},[e]),h=o,[p,g,f]=L.squash,m=(l,u)=>[l.x*L.r*p*u,l.y*L.r*g*u,l.z*L.r*f*u];return t.jsx("group",{position:[L.x,L.baseY,L.z],children:s?t.jsx(b.Suspense,{fallback:t.jsx(hs,{dome:i,hornL:a,hornR:c,cast:h}),children:t.jsx(hi,{shadows:h})}):t.jsxs(t.Fragment,{children:[t.jsx(hs,{dome:i,hornL:a,hornR:c,cast:h}),t.jsx(Ea,{eyes:St.map(l=>m(l,.82)),nose:m(za,.87),mouth:m(Sn,.96),teeth:d,cast:h})]})})}function hs({dome:e,hornL:o,hornR:n,cast:s}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:s,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function pt({matrices:e,target:o}){const n=b.useRef(!1);return ne(()=>{if(n.current||!o.current)return;const s=Math.min(e.length,o.current.count);for(let i=0;i<s;i++)o.current.setMatrixAt(i,e[i]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const Wt=190,gt=130,To=9.5;function ds(e,o,n,s=24){const i=new to(e),a=new oo(i,s,1,4,!1),c=a.attributes.position,d=new j(0,1,0),h=new j,p=new j,g=new j,f=new j,m=new j;for(let l=0;l<=s;l++){const u=l/s;i.getPointAt(u,p),i.getTangentAt(u,h),f.crossVectors(h,d).normalize(),g.crossVectors(f,h).normalize();for(let x=0;x<=4;x++){const v=l*5+x;if(v>=c.count)continue;const w=x/4*Math.PI*2+Math.PI/4,k=Math.cos(w)*o*.7071,z=Math.sin(w)*n*.7071;m.copy(p).addScaledVector(f,k).addScaledVector(g,z),c.setXYZ(v,m.x,m.y,m.z)}}return c.needsUpdate=!0,a.computeVertexNormals(),a}function fi(e,o,n,s=40){const i=[];for(let h=0;h<=10;h++){const p=h/10*2-1;i.push(new j(p*e,-30*(1-p*p),0))}const a=new to(i),c=new oo(a,s,n,8,!1),d=c.attributes.position;for(let h=0;h<=s;h++){const p=h/s*2-1,g=1+(1-p*p)*.85,f=a.getPointAt(h/s);for(let m=0;m<=8;m++){const l=h*9+m;l>=d.count||d.setXYZ(l,f.x+(d.getX(l)-f.x)*g,f.y+(d.getY(l)-f.y)*g,f.z+(d.getZ(l)-f.z)*g)}}return d.needsUpdate=!0,c.computeVertexNormals(),c}function us({quality:e="high",shadows:o=!0,z:n=Pt,k:s=N}){const i=b.useRef(),a=b.useRef(),c=b.useRef(),d=b.useRef(),h=b.useMemo(()=>{const x=Wt/2,v=gt,w=ds([new j(-x-40,v+6,0),new j(-x-22,v+15.5,0),new j(0,v+20,0),new j(x+22,v+15.5,0),new j(x+40,v+6,0)],16,9,30),k=ds([new j(-x-30,v+2,0),new j(0,v+8,0),new j(x+30,v+2,0)],11,5,18);return{kasagi:w,shimaki:k,rope:fi(x-6,30,6.4,44)}},[]),{tileM:p,merlonM:g,cannonM:f,lanternM:m}=b.useMemo(()=>{const x=new rt,v=new mt,w=new j,k=new j,z=[],r=e==="low"?26:54;for(let R=0;R<r;R++){const A=R/(r-1)*2-1,B=A*(Wt/2+40),G=gt+20-Math.pow(Math.abs(A),1.9)*14+5,$=-Math.sign(A)*Math.pow(Math.abs(A),3)*.5;k.set(B,G,0),v.setFromEuler(new Dt(0,0,$)),w.set(1,1,1),z.push(x.clone().compose(k,v,w))}const M=[];for(const R of[-1,1])for(let A=0;A<7;A++)k.set(R*(58+A*12),26,0),v.identity(),w.set(1,1,1),M.push(x.clone().compose(k,v,w));const F=[];for(const R of[-1,1])for(let A=0;A<2;A++)for(let B=0;B<4-A;B++)k.set(R*(64+B*13+A*6),32+A*10,8),v.setFromEuler(new Dt(Math.PI/2-.16,0,0)),w.set(1,1,1),F.push(x.clone().compose(k,v,w));const C=[],S=e==="low"?10:22;for(let R=0;R<S;R++){const A=R/(S-1)*2-1,B=A*(Wt/2-12),G=30*(1-A*A);k.set(B,gt-34-G-7.5,0),v.identity(),w.set(1,1,1),C.push(x.clone().compose(k,v,w))}return{tileM:z,merlonM:M,cannonM:F,lanternM:C}},[e]);ne(()=>{const x=y.t;i.current&&(i.current.material.emissiveIntensity=2.6+Math.sin(x*3.1)*.22+Math.sin(x*7.7)*.1+y.flash*1.4)});const l=Wt/2,u=o;return t.jsxs("group",{position:[0,0,n],scale:s,children:[[-1,1].map(x=>t.jsxs("group",{position:[x*l,0,0],children:[t.jsxs("mesh",{position:[0,gt/2-30,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[To*.86,To,gt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[To*1.5,To*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},x)),t.jsxs("mesh",{position:[0,gt-26,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[Wt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:h.shimaki,castShadow:u,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:h.kasagi,castShadow:u,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,p.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(pt,{matrices:p,target:a})]}),t.jsxs("mesh",{position:[0,gt-6,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,gt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:h.rope,position:[0,gt-34,2],castShadow:u,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(x=>{const v=30*(1-(x/(Wt/2-6))**2);return t.jsx("group",{position:[x,gt-34-v-4,2],children:[0,1,2].map(w=>t.jsxs("mesh",{position:[w%2?1.1:-1.1,-2.4-w*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:De})]},w))},x)}),[-1,1].map(x=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[x*108,6,0],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[x*108,30,6],castShadow:u,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.88})]}),t.jsxs("mesh",{position:[x*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},x)),t.jsxs("instancedMesh",{ref:d,args:[null,null,g.length],castShadow:u,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(pt,{matrices:g,target:d})]}),t.jsxs("instancedMesh",{ref:c,args:[null,null,f.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(pt,{matrices:f,target:c})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,m.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(pt,{matrices:m,target:i})]})]})}const mi=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.12,"rgba(255,255,255,0.55)"),s.addColorStop(.4,"rgba(255,255,255,0.06)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let a=0;a<4;a++){const c=n.createLinearGradient(0,0,e/2,0);c.addColorStop(0,"rgba(255,255,255,0.95)"),c.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=c,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const i=new no(o);return i.colorSpace=so,i})();function gi(e,o,n,s){const i=[];for(let a=0;a<=s;a++){const c=a/s,d=c*2-1;i.push(new j(e[0]+(o[0]-e[0])*c,e[1]+(o[1]-e[1])*c-n*(1-d*d),e[2]+(o[2]-e[2])*c))}return i}const xi=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function bi({quality:e="high",shadows:o=!0}){const n=b.useRef(),s=b.useRef(),i=b.useRef(),a=b.useRef(),{lanternM:c,lampM:d,pilingM:h,katanaY:p,ground:g}=b.useMemo(()=>{const l=new rt,u=new mt,x=new j(1,1,1),v=new j,w=[],k=e==="low"?.42:e==="mid"?.72:1;for(const[F,C,S]of xi){const R=Math.max(4,Math.round(S*k)),A=gi(F,C,14,R);for(let B=1;B<A.length-1;B++){const G=.78+B*37%11/22;v.copy(A[B]).add(new j(0,-4.2*G,0)),u.setFromEuler(new Dt(0,B*1.7%Math.PI,(B%3-1)*.06)),w.push(l.clone().compose(v,u,x.clone().multiplyScalar(G)))}}const z=[],r=e==="low"?6:11;for(let F=0;F<r;F++){const C=F/(r-1);for(const S of[-1,1]){const R=T.lerp(Q.x+46,he.x-6,C)+S*(26-C*9),A=T.lerp(Q.z-26,he.z+32,C);v.set(R,re(R,A)+5,A),u.identity(),z.push(l.clone().compose(v,u,x))}}const M=[];for(let F=0;F<16;F++){const C=F%2,S=Math.floor(F/2);v.set(Q.x+30+S*17,-2,Q.z+34+C*26),u.setFromEuler(new Dt(0,0,(F%3-1)*.035)),M.push(l.clone().compose(v,u,x))}return{lanternM:w,lampM:z,pilingM:M,katanaY:re(Q.x+118,Q.z-58),ground:Q.y}},[e]);ne(()=>{const l=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(l*2.7)*.2+Math.sin(l*6.1+1.3)*.12+y.flash*1.6),a.current){const u=46*(1+Math.sin(l*1.3)*.13);a.current.scale.set(u,u,1),a.current.material.rotation=l*.07}});const f=o,m=(l,u)=>re(Q.x+l,Q.z+u);return t.jsxs("group",{children:[t.jsxs("group",{position:[Q.x,0,Q.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:f,receiveShadow:f,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:f,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(l=>t.jsxs("group",{position:[52+l*26,1.5,92+l%2*13],rotation:[0,.4+l*.3,0],children:[t.jsxs("mesh",{castShadow:f,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:De})]})]},l))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,h.length],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(pt,{matrices:h,target:i})]}),t.jsxs("group",{position:[Q.x+118,p,Q.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:f,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:a,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:mi,color:E.furnace,transparent:!0,opacity:.75,blending:wt,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(l=>{const u=96+l*4,x=88*l;return t.jsxs("group",{position:[Q.x+u,m(u,x),Q.z+x],rotation:[0,-l*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:f,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:f,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(v=>t.jsxs("mesh",{position:[v*3,37,4],rotation:[0,0,v*.3],castShadow:f,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},v)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:f,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.9,side:De})]})]},l)}),[-1,1].map(l=>{const u=40+l*34,x=-18+l*46;return t.jsxs("group",{position:[Q.x+u,m(u,x)+12,Q.z+x],rotation:[0,l*.8,0],children:[t.jsxs("mesh",{castShadow:f,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(v=>t.jsxs("mesh",{position:[v*5,7,-1],rotation:[0,0,v*-.5],castShadow:f,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},v)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:E.ember,emissive:E.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:De})]})]},l)}),t.jsxs("group",{position:[Q.x-34,m(-34,30)+2,Q.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:f,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.88,side:De,emissive:E.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(l,u)=>{const x=u/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(x)*26,55.5,Math.sin(x)*26],rotation:[0,-x,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},u)}),Array.from({length:10},(l,u)=>{const x=u/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(x)*32,44,Math.sin(x)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.5,toneMapped:!1})]},u)})]}),[0,1,2,3].map(l=>{const u=8+l*30,x=-70-l%2*14;return t.jsxs("group",{position:[Q.x+u,m(u,x),Q.z+x],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:l%2?"#e8dcc4":E.vermilion,roughness:.95,side:De})]})]},l)}),[0,1,2].map(l=>{const u=.28+l*.24,x=T.lerp(Q.x+46,he.x,u),v=T.lerp(Q.z-26,he.z+26,u),w=re(x,v),k=1-l*.1;return t.jsxs("group",{position:[x,w,v],scale:k,children:[[-1,1].map(z=>t.jsxs("mesh",{position:[z*15,17,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},z)),t.jsxs("mesh",{position:[0,36,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.75})]})]},l)}),t.jsx("group",{position:[Q.x,g,Q.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(pt,{matrices:c,target:n})]})}),t.jsxs("instancedMesh",{ref:s,args:[null,null,d.length],castShadow:f,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:E.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(pt,{matrices:d,target:s})]})]})}const ps={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function wi(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function yi({quality:e="high",shadows:o=!0}){const n=b.useRef(),s=b.useRef(),i=b.useRef(),a=b.useRef(),{pineTrunkM:c,pineCanopyM:d,sakuraM:h,rockM:p}=b.useMemo(()=>{const f=ps[e]??ps.high,m=wi(20250801),l=new rt,u=new mt,x=new j,v=new j,w=new j(0,1,0),k=new j,z=[],r=[],M=[],F=f.pine+f.sakura+f.rock;let C=0,S=0;for(;C<F&&S<F*60;){S++;const R=m()*Math.PI*2,A=ft*(.55+m()*.62),B=de.x+Math.sin(R)*A,G=de.z+Math.cos(R)*A,$=re(B,G);if($<5||$>300||Ir(B,G,6)>.72||Math.hypot(B-L.x,G-L.z)<L.r*1.35)continue;const q=B>de.x+(m()-.5)*90,ee=C;if(C++,v.set(B,$,G),ee<f.rock){const P=Yn(B,G,5);k.set(P[0],P[1],P[2]),u.setFromUnitVectors(w,k),u.multiply(new mt().setFromEuler(new Dt(m()*.5,m()*6.28,m()*.5)));const K=2.5+m()*7;x.set(K*(.7+m()*.6),K*(.5+m()*.5),K*(.7+m()*.6)),v.y-=K*.25,M.push(l.clone().compose(v,u,x))}else if(q){if(z.length>=f.pine)continue;u.setFromEuler(new Dt(0,m()*6.28,(m()-.5)*.09));const P=.72+m()*.7;x.set(P,P*(.85+m()*.45),P),z.push(l.clone().compose(v,u,x))}else{if(r.length>=f.sakura)continue;u.setFromEuler(new Dt(0,m()*6.28,(m()-.5)*.13));const P=.7+m()*.75;x.set(P,P*(.8+m()*.5),P),r.push(l.clone().compose(v,u,x))}}return{pineTrunkM:z.map(R=>R.clone().multiply(vi)).concat(r.map(R=>R.clone().multiply(Si))),pineCanopyM:z.map(R=>R.clone().multiply(Mi)),sakuraM:r.map(R=>R.clone().multiply(ji)),rockM:M}},[e]),g=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(pt,{matrices:c,target:n})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,d.length],castShadow:g,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:Z.pine,roughness:.93,flatShading:!0}),t.jsx(pt,{matrices:d,target:s})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,h.length],castShadow:g,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:E.sakura,roughness:.95,flatShading:!0,emissive:E.sakura,emissiveIntensity:.1}),t.jsx(pt,{matrices:h,target:i})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,p.length],castShadow:g,receiveShadow:g,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:Z.rock,roughness:.97,flatShading:!0}),t.jsx(pt,{matrices:p,target:a})]})]})}const vi=new rt().makeTranslation(0,7,0),Mi=new rt().makeTranslation(0,26,0),ji=new rt().compose(new j(0,13,0),new mt,new j(1,.72,1)),Si=new rt().compose(new j(0,5,0),new mt,new j(.75,.62,.75)),Mt=Math.PI,fs={"ship-sunny.opt.glb":Mt/2,"ship-tang.opt.glb":Mt/2,"ship-punk.opt.glb":Mt/2,"ship-lion.opt.glb":Mt/2,"ship-bone.opt.glb":Mt/2,"ship-junk.opt.glb":Mt/2,"ship-warjunk.opt.glb":Mt/2,"ship-sub.opt.glb":-Mt/2},en=e=>e&&fs[e]!==void 0?fs[e]:Mt/2,ki={"ship-sunny.opt.glb":40,"ship-lion.opt.glb":40,"ship-punk.opt.glb":52,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":50,"ship-junk.opt.glb":38,"ship-warjunk.opt.glb":60},Ra=1.6,ms=Object.fromEntries(Object.entries(ki).map(([e,o])=>[e,Math.round(o*Ra)])),gs={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},tn=2,xs={"ship-sunny.opt.glb":.513,"ship-lion.opt.glb":.213,"ship-punk.opt.glb":.118,"ship-tang.opt.glb":.208,"ship-sub.opt.glb":.256,"ship-bone.opt.glb":.308,"ship-junk.opt.glb":.313,"ship-warjunk.opt.glb":.415},bs={"ship-sunny.opt.glb":1.044,"ship-lion.opt.glb":.824,"ship-punk.opt.glb":.673,"ship-tang.opt.glb":1,"ship-sub.opt.glb":.641,"ship-bone.opt.glb":.771,"ship-junk.opt.glb":.915,"ship-warjunk.opt.glb":.702},ws={"ship-sunny.opt.glb":.13,"ship-lion.opt.glb":.13,"ship-punk.opt.glb":.075,"ship-bone.opt.glb":.13,"ship-junk.opt.glb":.13,"ship-warjunk.opt.glb":.13,"ship-tang.opt.glb":.05,"ship-sub.opt.glb":.05},_o=[[0,.26,0],[-.1,.02,.7],[.1,-.08,-.9],[0,-.27,Math.PI*.85]],Aa=e=>e==="low"?_o.slice(0,1):e==="mid"?_o.slice(0,2):_o,ys={"ship-sunny.opt.glb":"#e6ded0","ship-punk.opt.glb":"#c9bfae","ship-tang.opt.glb":"#d8cdb4","ship-lion.opt.glb":"#9a9188","ship-sub.opt.glb":"#9a9188","ship-bone.opt.glb":"#9a9188"},Kn=(e,o="#9a9188")=>e&&ys[e]!==void 0?ys[e]:o,on=(e,o=34)=>e&&ms[e]!==void 0?ms[e]:o,nn=e=>e&&gs[e]!==void 0?gs[e]:1,zi=e=>e&&xs[e]!==void 0?xs[e]:.2,Ia=e=>e&&ws[e]!==void 0?ws[e]:.13,vo=e=>Math.max(0,zi(e)-Ia(e)),Nt=(e,o)=>Ia(e)*o,sn=(e,o)=>((e&&bs[e]!==void 0?bs[e]:.8)-vo(e))*o,Ca=210,vs={off:1,lead:.98*Ra*.77},Ms={SPREAD:28,SWEEP:14},js=(e,o=0)=>({off:e*Ms.SPREAD,lead:o-Math.abs(e)*Ms.SWEEP}),Ti={scabbards:[0,Ca],"straw-hats":[-1,150],kid:[1,150],heart:[0,60]},Ei=430*N;function Ri(e,o=0){const n=(820+-670*e)*N+o;return[(Math.sin(e*2.4)*54-e*26)*N,n]}function Ai(e,o,n,s){const[i,a]=Ri(n,s);return[i+o*N*vs.off,a-e*N*vs.lead]}const Ii=[{x:-300*N,z:100*N,yaw:.35},{x:330*N,z:360*N,yaw:-.55},{x:-390*N,z:470*N,yaw:.12},{x:420*N,z:830*N,yaw:-.28},{x:-455*N,z:930*N,yaw:.48},{x:400*N,z:1120*N,yaw:-.16},{x:-520*N,z:690*N,yaw:.22},{x:540*N,z:1290*N,yaw:-.42}],Ci=[{x:Q.x+132*N*.72,z:Q.z+96*N*.72,yaw:2.3},{x:Q.x+168*N*.72,z:Q.z+40*N*.72,yaw:1.9},{x:Q.x+96*N*.72,z:Q.z+150*N*.72,yaw:2.7}];function Fi({url:e,height:o,loa:n,slim:s=1,sink:i=0,rotation:a,tint:c,emissive:d,emissiveIntensity:h}){const{scene:p}=xa(e),g=b.useMemo(()=>p.clone(!0),[p]),f=b.useMemo(()=>{const m=new ba().setFromObject(g),l=new j;m.getSize(l);const u=new j;if(m.getCenter(u),n){const v=l.x>=l.z,w=Math.max(v?l.x:l.z,1e-4),k=n/w,z=v?[k,k,k*s]:[k*s,k,k];return{scale:z,offset:[-u.x*z[0],-m.min.y*z[1]-n*i,-u.z*z[2]]}}const x=l.y>1e-4?o/l.y:1;return{scale:[x,x,x],offset:[-u.x*x,-m.min.y*x,-u.z*x]}},[g,o,n,s,i]);return b.useEffect(()=>{g.traverse(m=>{if(m.isMesh&&(m.castShadow=!0,m.receiveShadow=!0,c&&m.material)){const l=Array.isArray(m.material)?m.material:[m.material];for(const u of l)u.color?.multiply(new ve(c)),d&&u.emissive&&(u.emissive.set(d),u.emissiveIntensity=h??.2)}})},[g,c,d,h]),t.jsx("group",{rotation:[0,a,0],scale:f.scale,position:f.offset,children:t.jsx("primitive",{object:g})})}class Pi extends b.Component{constructor(){super(...arguments);ns(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ge({name:e,height:o,loa:n=null,slim:s=1,sink:i=0,rotation:a=0,position:c=[0,0,0],tint:d=null,emissive:h=null,emissiveIntensity:p=.2,fallback:g=null}){const f=bo(e);return ot(e)?t.jsx("group",{position:c,children:t.jsx(Pi,{url:f,fallback:g,children:t.jsx(b.Suspense,{fallback:g,children:t.jsx(Fi,{url:f,height:o,loa:n,slim:s,sink:i,rotation:a,tint:d,emissive:h,emissiveIntensity:p})})})}):t.jsx("group",{position:c,children:g})}const kn=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),i=s.createImageData(e,o);for(let c=0;c<o;c++){const d=c/(o-1),h=Math.pow(1-d,1.7);for(let p=0;p<e;p++){const g=p/(e-1)*2-1,f=Math.max(0,1-Math.abs(g)/(.35+d*.65)),m=.45+.55*Math.pow(Math.abs(g)/(.35+d*.65),1.5),l=h*Math.pow(f,1.4)*m,u=(c*e+p)*4;i.data[u]=255,i.data[u+1]=255,i.data[u+2]=255,i.data[u+3]=Math.round(Math.min(1,l)*255)}}s.putImageData(i,0,0);const a=new no(n);return a.colorSpace=so,a})(),Li=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createImageData(e,e);for(let a=0;a<e;a++){const c=a/(e-1),d=Math.pow(1-c,1.5);for(let h=0;h<e;h++){const p=h/(e-1)*2-1,g=Math.max(0,1-Math.abs(p)),f=d*Math.pow(g,1.3),m=(a*e+h)*4;s.data[m]=255,s.data[m+1]=255,s.data[m+2]=255,s.data[m+3]=Math.round(Math.min(1,f)*255)}}n.putImageData(s,0,0);const i=new no(o);return i.colorSpace=so,i})(),Bo=160,Qt=112,go="#e6dfcf",Fa="#0c0a15",Zt=Fa;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,s,i){const a=Math.min(i??0,Math.abs(n)/2,Math.abs(s)/2);return this.moveTo(e+a,o),this.arcTo(e+n,o,e+n,o+s,a),this.arcTo(e+n,o+s,e,o+s,a),this.arcTo(e,o+s,e,o,a),this.arcTo(e,o,e+n,o,a),this.closePath(),this});function Yt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=Bo,o.height=Qt;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,0,Qt);s.addColorStop(0,"#14101f"),s.addColorStop(.5,Fa),s.addColorStop(1,"#08060f"),n.fillStyle=s,n.fillRect(0,0,Bo,Qt),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,Qt),n.save(),n.translate(Bo/2+4,Qt/2);try{e(n)}catch(a){console.warn("[onigashima] flag emblem skipped",a)}n.restore();const i=new no(o);return i.colorSpace=so,i.anisotropy=4,i}function ln(e,o,n=go){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function cn(e,o,n=1){e.save(),e.fillStyle=Zt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Ss(e,o,n=4){e.save(),e.fillStyle=Zt;for(let s=1;s<n;s++){const i=-o*.5+s*o/n;e.fillRect(i-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function ks(e,o,n=go){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const s of[1,-1]){e.save(),e.rotate(s*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const i of[-1,1])for(const a of[-.16,.16])e.beginPath(),e.arc(i*o*1.55,o*.55+a*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Gi={straw:Yt(e=>{ks(e,26),ln(e,26),cn(e,26),Ss(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Yt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Zt;for(const s of[-1,1])e.beginPath(),e.arc(s*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Zt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Yt(e=>{ks(e,26,"#d8cfc0"),e.fillStyle=go,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Zt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const s=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(s,26*.42),e.lineTo(s+26*.1,26*1.04),e.lineTo(s-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Yt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const s=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(s),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:Yt(e=>{e.fillStyle=go;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();ln(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),cn(e,25,.85),e.save(),e.fillStyle=Zt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=go;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Yt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();ln(e,26,"#cfd8e4"),cn(e,26),Ss(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Pa={value:0},zs=new Map;function Oi(e){const o=zs.get(e);if(o)return o;const n=Gi[e],s=new pr({map:n,emissiveMap:n,emissive:new ve("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:De,transparent:!1});return s.onBeforeCompile=i=>{i.uniforms.uTime=Pa,i.vertexShader=`uniform float uTime;
`+i.vertexShader.replace("#include <begin_vertex>",`
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
        `),i.vertexShader=i.vertexShader.replace("#include <beginnormal_vertex>",`
      #include <beginnormal_vertex>
      float nHoist = uv.x * uv.x;
      objectNormal = normalize(objectNormal + vec3(
        -cos(uv.x * 8.5 - uTime * 5.2 + uv.y * 2.2) * 1.36 * nHoist, 0.0, 0.0));
      `)},s.customProgramCacheKey=()=>"onigashima-flag",zs.set(e,s),s}function Di(){return ne((e,o)=>{Pa.value+=Math.min(o,.05)}),null}const Ni=(()=>{const e=new Hn(1,1,14,5);return e.translate(.5,0,0),e})();function yo({crew:e="straw",width:o=16,position:n=[0,0,0],rotation:s=Math.PI/2,staff:i=!0}){const a=b.useMemo(()=>Oi(e)??null,[e]),c=o*(Qt/Bo);return a?t.jsxs("group",{position:n,rotation:[0,s,0],children:[i&&t.jsxs("mesh",{position:[0,c*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,c*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:Ni,material:a,scale:[o,c,o]})]}):null}const Uo=[{id:"scabbards",flag:"kozuki",lead:Ca,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:E.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:E.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb",sailedBy:"helm"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445",crew:"crew-heart.opt.glb",sailedBy:"sub"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#68644e",crew:"crew-samurai.opt.glb"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#75664f",crew:"crew-samurai.opt.glb"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47",crew:"crew-samurai.opt.glb"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6c684f",crew:"crew-samurai.opt.glb"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#77694f",crew:"crew-samurai.opt.glb"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a",crew:"crew-samurai.opt.glb"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#665945",crew:"crew-samurai.opt.glb"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#666249",crew:"crew-samurai.opt.glb"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#71634c",crew:"crew-samurai.opt.glb"},{id:"samurai-g",flag:"kozuki",lead:-22,off:264,scale:.8,sail:"#c5baa3",hull:"#3b2e22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7d6e55",crew:"crew-samurai.opt.glb"},{id:"mink-e",flag:"mink",lead:-96,off:-290,scale:.86,sail:"#cec3ab",hull:"#42392c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a6650",crew:"crew-samurai.opt.glb"},{id:"yakuza-f",flag:"kozuki",lead:-152,off:330,scale:.74,sail:"#c0b59d",hull:"#3d3023",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#76684e",crew:"crew-samurai.opt.glb"},{id:"samurai-h",flag:"kozuki",lead:-206,off:-348,scale:.82,sail:"#c7bca5",hull:"#3a2d21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7f7057",crew:"crew-samurai.opt.glb"},{id:"mink-f",flag:"mink",lead:-258,off:208,scale:.78,sail:"#cabfa7",hull:"#40372a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6b674e",crew:"crew-samurai.opt.glb"},{id:"yakuza-g",flag:"kozuki",lead:-300,off:-196,scale:.76,sail:"#c2b79f",hull:"#3c2f22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#78694f",crew:"crew-samurai.opt.glb"},{id:"samurai-i",flag:"kozuki",lead:-344,off:306,scale:.8,sail:"#c9bea7",hull:"#392c20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#81725a",crew:"crew-samurai.opt.glb"},{id:"mink-g",flag:"mink",lead:-398,off:88,scale:.84,sail:"#ccc1a9",hull:"#413828",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#69654d",crew:"crew-samurai.opt.glb"},{id:"yakuza-h",flag:"kozuki",lead:-440,off:-370,scale:.72,sail:"#bfb49c",hull:"#3b2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#74664d",crew:"crew-samurai.opt.glb"},{id:"samurai-j",flag:"kozuki",lead:-498,off:372,scale:.78,sail:"#c4b9a1",hull:"#382b1f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7b6c53",crew:"crew-samurai.opt.glb"},{id:"mink-h",flag:"mink",lead:-546,off:-140,scale:.8,sail:"#c8bda5",hull:"#3f3629",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#676349",crew:"crew-samurai.opt.glb"}];(()=>{let e=2,o=-1;for(const n of Uo){const s=Ti[n.id];if(s){Object.assign(n,js(s[0],s[1]));continue}Object.assign(n,js(o*e)),o>0&&(e+=1),o=-o}})();function Hi({spec:e,quality:o}){const n=b.useRef(),s=b.useRef(),i=b.useRef();ne(()=>{const l=n.current;if(!l)return;const u=y.mode&&y.mode!=="off";if(l.visible=!(e.sailedBy&&y.mode===e.sailedBy),!l.visible)return;const x=u?0:T.clamp(y.progress*.82+.04,0,1),[v,w]=Ai(e.lead,e.off,x,u?Ei:0),k=wo(v,w),z=T.clamp(-re(v,w)/46,0,1),r=T.lerp(1,.055,k)*T.smoothstep(z,0,.28),M=ut(v,w,y.t,r),F=e.sub?T.smoothstep(y.progress,.42,.6):0;l.position.set(v,M.y-(e.sub?4.5:1.2)*e.scale-F*40,w);const C=e.sub?.35:1;l.rotation.x=T.clamp(M.dz*1.35*C,-.32,.32),l.rotation.z=T.clamp(-M.dx*1.15*C,-.28,.28),l.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,s.current&&(s.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,s.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-k)*.75)*(1-F))});const a=e.scale,c=o==="low"?6:10,d=ot(e.model2??""),h=ot(e.model??""),p=d?e.model2:h?e.model:null,g=p==="ship-junk.opt.glb",f=on(p,34)*(g?e.scale??1:1),m=ot(e.crew??"");return p?t.jsxs("group",{ref:n,children:[t.jsx(ge,{name:p,loa:f,slim:nn(p),sink:vo(p),rotation:en(p),tint:d?Kn(p):e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),m&&Aa(o).map(([l,u,x],v)=>t.jsx(ge,{name:e.crew,height:tn,rotation:x,position:[l*f,Nt(p,f),u*f]},`crew-${v}`)),e.flag&&t.jsx(yo,{crew:e.flag,width:f*(e.sub?.3:.22),position:[0,sn(p,f)*(e.sub?.72:.88),-f*.12],staff:!!e.sub}),t.jsxs("mesh",{position:[0,Nt(p,f)+f*.05,-f*.2],children:[t.jsx("sphereGeometry",{args:[f*.03,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-f*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[f*.55,f*2.3]}),t.jsx("meshBasicMaterial",{map:kn,color:Z.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:a*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,c]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:De,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(l=>[0,1,2,3].map(u=>t.jsxs("mesh",{position:[l*5.6,3.4,-6+u*4],rotation:[0,0,l*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${l}-${u}`))),e.flag&&t.jsx(yo,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*a],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*a,74*a]}),t.jsx("meshBasicMaterial",{map:kn,color:Z.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Ts({x:e,z:o,yaw:n,name:s,loa:i,tint:a,flag:c=null,crew:d=null,quality:h="high"}){const p=on(s,i),g=b.useRef(),f=ot(s),m=ot(d??"");return ne(()=>{const l=g.current;if(!l)return;const u=wo(e,o),x=T.clamp(-re(e,o)/46,0,1),v=T.lerp(1,.055,u)*T.smoothstep(x,0,.28),w=ut(e,o,y.t,v);l.position.set(e,w.y-1.5,o),l.rotation.set(T.clamp(w.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,T.clamp(-w.dx,-.22,.22))}),t.jsxs("group",{ref:g,children:[t.jsx(ge,{name:s,loa:p,slim:nn(s),sink:vo(s),rotation:en(s),tint:a,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),d&&m&&f&&Aa(h).slice(0,2).map(([l,u,x],v)=>t.jsx(ge,{name:d,height:tn,rotation:x,position:[l*p,Nt(s,p),u*p]},`watch-${v}`)),c&&f&&t.jsx(yo,{crew:c,width:p*.22,position:[0,sn(s,p)*.88,-p*.1]})]})}function _i({quality:e="high"}){const o=b.useMemo(()=>e==="low"?Uo.slice(0,6):e==="mid"?Uo.slice(0,16):Uo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Di,{}),o.map(n=>t.jsx(Hi,{spec:n,quality:e},n.id)),e!=="low"&&Ii.map((n,s)=>t.jsx(Ts,{quality:e,...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts",crew:"crew-samurai.opt.glb"},`picket-${s}`)),e!=="low"&&Ci.map((n,s)=>t.jsx(Ts,{quality:e,...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki",crew:"crew-samurai.opt.glb"},`moored-${s}`))]})}const Bi=2,Es={"powder-keg.opt.glb":2.4,"war-cannon.opt.glb":4.2,"bomb-sphere.opt.glb":3.6,"sake-tower.opt.glb":5,"wisteria-trellis.opt.glb":8,"banquet-table.opt.glb":2.4,"stone-lantern.opt.glb":4,"oni-daiko.opt.glb":6,"oni-guardian.opt.glb":13,"oni-throne.opt.glb":12,"kagura-stage.opt.glb":40,"treasure-kura.opt.glb":16,"rear-gatehouse.opt.glb":18,"keep-tier.opt.glb":56,"arch-bridge.opt.glb":14},ce=(e,o=6)=>e&&Es[e]!==void 0?Es[e]:o,Rt=30,Ui="#2e2a33",zn="#3a4152",Tn=Z.snow,Xo="#cfe0f4";function Rs({position:e}){const o=ce("stone-lantern.opt.glb")/7.8;return t.jsx("group",{position:e,children:t.jsx(ge,{name:"stone-lantern.opt.glb",height:ce("stone-lantern.opt.glb"),tint:"#8a93a8",fallback:t.jsxs("group",{scale:o,children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:zn,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:zn,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:Xo,emissive:Xo,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Tn,roughness:.9})]})]})})})}function Wi({shadows:e=!0}){const o=b.useMemo(()=>Math.atan2(U.dir[0],U.dir[1]),[]);return t.jsxs("group",{position:[U.gate.x,U.benchY,U.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:zn,roughness:.92})]},n)),t.jsx(ge,{name:"rear-gatehouse.opt.glb",height:ce("rear-gatehouse.opt.glb"),rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:Ui,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Tn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Tn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:De})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:Xo,emissive:Xo,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Rs,{position:[-14,0,10]}),t.jsx(Rs,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const Eo=new ve,En={color:"#7fd8c8",intensity:9e3,distance:320},hn={color:"#ffc48a",intensity:12e3,distance:300},Yi=new ve(En.color),Vi={low:1,mid:2,high:4},Vt=[{pos:[Q.x,40,Q.z],color:E.lantern,intensity:16e3,distance:460*N*.65},{pos:[0,78,Pt],color:E.lantern,intensity:15e3,distance:430},{pos:[he.x,he.y+6,he.z-30],color:E.emberDeep,intensity:3e4,distance:640},{pos:[U.gate.x,30,U.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function $i({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const s=b.useRef(),i=b.useRef(),a=b.useRef(),c=b.useRef(),d=b.useRef(),h=b.useRef(),p=be(f=>f.camera),g=Vi[e]??5;return ne(()=>{if(s.current){s.current.intensity=y.flash*9e3;const l=y.flashDir;s.current.position.set(l.x*700,260+l.y*500,de.z+l.z*700)}const f=y.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(f*2.3)*Math.sin(f*.71))),a.current&&(a.current.intensity=62e3*(.86+.14*Math.sin(f*1.9+2.1)*Math.sin(f*.63)));const m=y.inside;if(d.current&&(d.current.intensity=.16+m*.3),h.current&&(h.current.intensity=.34+m*.26),c.current){const l=c.current,u=.06;let x=Vt[0],v=1/0;for(const w of Vt){const k=(p.position.x-w.pos[0])**2+(p.position.z-w.pos[2])**2;k<v&&(v=k,x=w)}if(y.subActive&&v>550*550){const w=y.subPos,k=Math.min(1,y.underwater/.35);l.position.x+=(w.x-l.position.x)*.3,l.position.y+=(w.y+14-l.position.y)*.3,l.position.z+=(w.z-l.position.z)*.3,Eo.set(hn.color).lerp(Yi,k),l.color.lerp(Eo,u),l.intensity+=(T.lerp(hn.intensity,En.intensity,k)-l.intensity)*u,l.distance=T.lerp(hn.distance,En.distance,k)}else if(y.helmActive&&v>550*550){const w=y.helmPos;l.position.x+=(w.x-l.position.x)*.25,l.position.y+=(w.y+16-l.position.y)*.25,l.position.z+=(w.z-l.position.z)*.25,l.color.lerp(Eo.set(E.lantern),u),l.intensity+=(11e3-l.intensity)*u,l.distance=300}else l.position.x+=(x.pos[0]-l.position.x)*u,l.position.y+=(x.pos[1]-l.position.y)*u,l.position.z+=(x.pos[2]-l.position.z)*u,l.color.lerp(Eo.set(x.color),u),l.intensity+=(x.intensity-l.intensity)*u,l.distance=x.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:d,intensity:.16,color:Z.skyLow}),t.jsx("hemisphereLight",{ref:h,args:[Z.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(N/1.55),"shadow-camera-right":520*(N/1.55),"shadow-camera-top":520*(N/1.55),"shadow-camera-bottom":-520*(N/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:g>=2?[Ae[0].x,Ae[0].y,Ae[0].z]:[(Ae[0].x+Ae[1].x)/2,Ae[0].y,Ae[0].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),g>=2&&t.jsx("pointLight",{ref:a,position:[Ae[1].x,Ae[1].y,Ae[1].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:c,position:Vt[0].pos,color:Vt[0].color,intensity:Vt[0].intensity,distance:Vt[0].distance,decay:2}),g>=3&&t.jsx("pointLight",{position:[he.x,he.y+4,he.z-34],color:E.emberDeep,intensity:3e4,distance:640,decay:2}),g>=4&&t.jsx("pointLight",{position:[0,78,Pt],color:E.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:s,position:[0,700,-700],color:Z.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function dn(e,o){let n=e>>>0;const s=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=[],a=o==="low"?3:5,c=(u,x,v,w,k)=>{const z=[u.clone()],r=u.clone();for(let F=0;F<w;F++)r.add(new j((s()-.5)*v*.55,-v/w,(s()-.5)*v*.42)).add(x.clone().multiplyScalar(v/w*.3)),z.push(r.clone());const M=new oo(new to(z),w*2,k,a,!1);return i.push(M),z},d=c(new j(0,620,0),new j(0,0,0),620,9,3.4),h=o==="low"?1:3;for(let u=0;u<h;u++){const x=d[2+Math.floor(s()*(d.length-3))];c(x.clone(),new j(s()-.5,0,s()-.5).multiplyScalar(2),190+s()*130,4,1.5)}let p=0;for(const u of i)p+=u.attributes.position.count;const g=new Float32Array(p*3),f=new Float32Array(p*3);let m=0;for(const u of i)g.set(u.attributes.position.array,m*3),f.set(u.attributes.normal.array,m*3),m+=u.attributes.position.count,u.dispose();const l=new Lt;return l.setAttribute("position",new oe(g,3)),l.setAttribute("normal",new oe(f,3)),l}function Ki({quality:e}){const o=[b.useRef(),b.useRef(),b.useRef()],n=b.useRef(2.5),s=b.useRef({i:0,t:-1,dur:0,flicker:0}),i=b.useMemo(()=>[dn(40503,e),dn(20973,e),dn(10196,e)],[e]);return ne((a,c)=>{const d=Math.min(c,.05),h=s.current;if(n.current-=d,n.current<=0&&h.t<0){h.i=(h.i+1)%3,h.t=0,h.dur=.16+Math.random()*.26,h.flicker=2+Math.floor(Math.random()*3);const p=o[h.i].current;if(p){const g=(Math.random()-.5)*2.4-Math.PI*.5,f=620+Math.random()*760;p.position.set(de.x+Math.cos(g)*f,40+Math.random()*120,de.z+Math.sin(g)*f*.7-240),p.rotation.y=Math.random()*Math.PI*2;const m=.7+Math.random()*.8;p.scale.set(m,m,m),y.flashDir.set(p.position.x,p.position.y+400,p.position.z).normalize()}n.current=T.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(h.t>=0){h.t+=d;const p=h.t/h.dur,g=Math.abs(Math.sin(p*Math.PI*h.flicker)),f=Math.max(0,1-p);y.flash=f*f*g;const m=o[h.i].current;m&&(m.material.opacity=Math.min(1,y.flash*2.2)),p>=1&&(h.t=-1,y.flash=0,m&&(m.material.opacity=0))}else y.flash*=Math.pow(1e-4,d)}),t.jsx(t.Fragment,{children:i.map((a,c)=>t.jsx("mesh",{ref:o[c],geometry:a,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:Z.bolt,transparent:!0,opacity:0,blending:wt,depthWrite:!1,toneMapped:!1})},c))})}const Xi=`
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
`,Qi=`
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
`,As={low:1600,mid:3800,high:7e3},Ro=460;function Zi({quality:e}){const o=b.useRef(),n=be(a=>a.camera),s=b.useMemo(()=>{const a=As[e]??As.high,c=new Float32Array(a*3),d=new Float32Array(a),h=new Float32Array(a);for(let g=0;g<a;g++)c[g*3]=Math.random()*Ro,c[g*3+1]=Math.random()*Ro,c[g*3+2]=Math.random()*Ro,d[g]=.7+Math.random()*.6,h[g]=.55+Math.random()*.85;const p=new Lt;return p.setAttribute("position",new oe(c,3)),p.setAttribute("aSpeed",new oe(d,1)),p.setAttribute("aLen",new oe(h,1)),p.boundingSphere=new ao(new j,1e6),p},[e]),i=b.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:Ro},uFall:{value:118},uSize:{value:2.4},uColor:{value:new j(...ie("#b9c8e4"))},uOpacity:{value:.5}}),[]);return ne((a,c)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=c,d.uCam.value.copy(n.position),d.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:s,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Xi,fragmentShader:Qi,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const qi=`
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
`,Ji=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Is={low:120,mid:340,high:700};function el({quality:e}){const o=b.useRef(),n=b.useMemo(()=>{const i=Is[e]??Is.high,a=[Ae[0],Ae[1],he,he],c=new Float32Array(i*3),d=new Float32Array(i),h=new Float32Array(i),p=new Float32Array(i);for(let f=0;f<i;f++){const m=a[f%a.length];c[f*3]=m.x+(Math.random()-.5)*74,c[f*3+1]=m.y+(Math.random()-.5)*30,c[f*3+2]=m.z+(Math.random()-.5)*26,d[f]=Math.random(),h[f]=.045+Math.random()*.055,p[f]=2+Math.random()*4}const g=new Lt;return g.setAttribute("position",new oe(c,3)),g.setAttribute("aPhase",new oe(d,1)),g.setAttribute("aRise",new oe(h,1)),g.setAttribute("aSize",new oe(p,1)),g.boundingSphere=new ao(new j(0,300,-260),700),g},[e]),s=b.useMemo(()=>({uTime:{value:0},uColor:{value:new j(...ie(E.ember))}}),[]);return ne((i,a)=>{o.current&&(o.current.uniforms.uTime.value+=a)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:qi,fragmentShader:Ji,uniforms:s,transparent:!0,depthWrite:!1,blending:wt,fog:!1})})}function tl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Ki,{quality:e}),t.jsx(Zi,{quality:e}),t.jsx(el,{quality:e})]})}const ol=`
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
`,nl=`
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
`,Cs={low:150,mid:380,high:620};function sl({whirl:e,quality:o}){const n=b.useRef(),s=b.useRef(),i=b.useMemo(()=>{const c=Cs[o]??Cs.high,d=new Float32Array(c*3),h=new Float32Array(c),p=new Float32Array(c),g=new Float32Array(c),f=new Float32Array(c),m=new Float32Array(c);for(let u=0;u<c;u++)h[u]=Math.random()*Math.PI*2,p[u]=Math.random(),g[u]=.05+Math.random()*.05,f[u]=3+Math.random()*6,m[u]=Math.random();const l=new Lt;return l.setAttribute("position",new oe(d,3)),l.setAttribute("aAngle",new oe(h,1)),l.setAttribute("aPhase",new oe(p,1)),l.setAttribute("aRate",new oe(g,1)),l.setAttribute("aSize",new oe(f,1)),l.setAttribute("aJitter",new oe(m,1)),l.boundingSphere=new ao(new j(e.x,0,e.z),e.r*1.6+40),l},[o,e]),a=b.useMemo(()=>({uTime:{value:0},uCentre:{value:new _n(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new j(...ie(Z.foam))},uGain:{value:1}}),[e]);return ne((c,d)=>{const h=n.current?.uniforms;if(!h)return;h.uTime.value+=d;const p=Math.hypot(c.camera.position.x-e.x,c.camera.position.z-e.z);h.uGain.value=1-T.smoothstep(p,1600,2400),s.current&&(s.current.visible=h.uGain.value>.02)}),t.jsx("points",{ref:s,geometry:i,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:ol,fragmentShader:nl,uniforms:a,transparent:!0,depthWrite:!1,blending:wt,fog:!1})})}function al({quality:e="high"}){const o=be(n=>n.camera);return ne(()=>{let n=0;for(const s of Ne){const i=Math.hypot(o.position.x-s.x,o.position.z-s.z);n=Math.max(n,1-T.smoothstep(i,s.r*.3,s.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ne.map((n,s)=>t.jsx(sl,{whirl:n,quality:e},s))})}const Y={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},eo={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<Jt-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*N},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Pt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*N},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=zr("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<U.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},rl=e=>eo[e]?eo[e].length:0,il=()=>Y.chain&&eo[Y.chain]?eo[Y.chain][Y.step]??null:null;function Rn(e){Y.chain=eo[e]?e:null,Y.step=0,Y.hull=1,Y.grip=0,Y.clock=0,Y.done=!1,Y.banner=null,Y.rev++}function Qo(e,o,n=3.4){Y.banner={text:e,sub:o,until:Y.clock+n},Y.rev++}function Ht(e,o){Y.hull<=0||(Y.hull=Math.max(0,Y.hull-e),Y.hits++,Y.hull<=0?Qo("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&Qo(o,null,2.2),Y.rev++)}function La(e,o){if(Y.clock+=e,Y.banner&&Y.clock>Y.banner.until&&(Y.banner=null,Y.rev++),!Y.chain||Y.done||!o)return;const n=eo[Y.chain],s=n[Y.step];if(!s)return;let i=!1;try{i=!!s.test(o)}catch{i=!1}i&&(Y.step++,Y.step>=n.length?(Y.done=!0,Qo("OBJECTIVE COMPLETE",ll[Y.chain]??"",6)):Qo(n[Y.step].text,n[Y.step].hint,3.6),Y.rev++)}const ll={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Ga(e,{danger:o,headingX:n,headingZ:s,toCentreX:i,toCentreZ:a,speed:c,throttle:d}){if(o<=.001)return Y.grip=Math.max(0,Y.grip-e*.5),Y.grip;const h=Math.hypot(i,a)||1,p=-i/h,g=-a/h,f=n*p+s*g,m=Math.min(1,Math.abs(c)/22),l=o*.42,u=Math.max(0,f)*m*(.35+.45*Math.min(1,Math.abs(d)));return Y.grip=Math.max(0,Math.min(1,Y.grip+(l-u)*e)),Y.grip}const Fs=24,un=Vo.safe,Ps=Vo.range,lo=2.1,cl=1.5,Ls=22,hl=[Pt,Jt],dl=new rt,pn=new j,Gs=new mt,fn=new j;function ul({quality:e="high"}){const o=b.useRef(),n=b.useMemo(()=>Array.from({length:Fs},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),s=b.useRef(0),i=b.useMemo(()=>{const a=new wa(.55,1,1,e==="low"?6:10,1,!0);return a.translate(0,.5,0),a},[e]);return ne((a,c)=>{const d=o.current;if(!d)return;const h=Math.min(c,.05),p=y.helm;if(y.helmActive&&p&&!p.onFoot&&!p.sub&&!p.moored){let m=null,l=1/0;for(const u of hl){const x=Math.hypot(p.x,p.z-u);x<un||x>Ps||x<l&&(l=x,m=u)}if(m!==null&&(s.current-=h,s.current<=0)){const u=1-T.clamp((l-un)/(Ps-un),0,1);s.current=T.lerp(4.5,1.9,u);const x=n.find(v=>!v.live);if(x){const v=lo*.55,w=T.lerp(230,105,u);x.x=p.x+Math.sin(p.heading)*p.speed*v+(Math.random()-.5)*w,x.z=p.z+Math.cos(p.heading)*p.speed*v+(Math.random()-.5)*w,x.y0=210+Math.random()*60,x.t=0,x.live=!0}}}let f=0;for(const m of n){if(!m.live)continue;const l=m.t;if(m.t+=h,m.t<lo){const u=m.t/lo;pn.set(m.x,m.y0*(1-u*u),m.z),fn.set(2.2,9,2.2)}else{if(l<lo){const v=Math.hypot(m.x-p.x,m.z-p.z);v<Ls&&Ht(.03*(1-v/Ls)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const u=(m.t-lo)/cl;if(u>=1){m.live=!1;continue}const x=Math.min(1,u*4);pn.set(m.x,ut(m.x,m.z,y.t,1).y-4,m.z),fn.set(11+u*9,78*x*(1-u*u*.75),11+u*9)}Gs.identity(),d.setMatrixAt(f,dl.compose(pn,Gs,fn)),f++}d.count=f,d.instanceMatrix.needsUpdate=!0,d.visible=f>0}),t.jsx("instancedMesh",{ref:o,args:[i,void 0,Fs],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:Z.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:wt,side:De})})}const pl=`
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
`,fl=`
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
`,Os={low:700,mid:1800,high:3200},Ao=260;function ml({quality:e}){const o=b.useRef(),n=b.useRef(),s=be(c=>c.camera),i=b.useMemo(()=>{const c=Os[e]??Os.high,d=new Float32Array(c*3),h=new Float32Array(c),p=new Float32Array(c),g=new Float32Array(c);for(let m=0;m<c;m++)d[m*3]=Math.random()*Ao,d[m*3+1]=Math.random()*Ao,d[m*3+2]=Math.random()*Ao,h[m]=.5+Math.random()*1.4,p[m]=1.2+Math.random()*3.2,g[m]=Math.random();const f=new Lt;return f.setAttribute("position",new oe(d,3)),f.setAttribute("aSpeed",new oe(h,1)),f.setAttribute("aSize",new oe(p,1)),f.setAttribute("aPhase",new oe(g,1)),f.boundingSphere=new ao(new j,1e6),f},[e]),a=b.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:Ao},uColor:{value:new j(...ie("#cfeee6"))},uGain:{value:0}}),[]);return ne((c,d)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=d,h.uCam.value.copy(s.position),h.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:pl,fragmentShader:fl,uniforms:a,transparent:!0,depthWrite:!1,fog:!1})})}const gl=`
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
`,xl=`
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
`,Ds={low:260,mid:700,high:1300},bl=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,wl=`
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
`,Ns=1100;function yl({whirl:e,quality:o}){const n=b.useRef(),s=b.useRef(),i=be(d=>d.camera),a=b.useMemo(()=>{const d=o==="low"?24:o==="mid"?34:48,h=new wa(e.r*1.02,e.r*.07,Ns,d,6,!0);return h.translate(e.x,-Ns/2-3,e.z),h},[e,o]),c=b.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new j(...ie(Z.foam))},uDeep:{value:new j(...ie(Z.underGlow))},uCameraPos:{value:new j},uFogDensity:{value:.0062},uFogColor:{value:new j(...ie(Z.underHaze))}}),[e]);return ne((d,h)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=h,p.uCameraPos.value.copy(d.camera.position),p.uFogDensity.value=d.scene.fog?.density??.0062;const g=d.scene.fog?.color;g&&p.uFogColor.value.set(g.r,g.g,g.b);const f=Math.hypot(i.position.x-e.x,i.position.z-e.z),m=1-T.smoothstep(f,e.r*8,e.r*24);p.uGain.value+=(y.underwater*m-p.uGain.value)*Math.min(1,h*4),s.current&&(s.current.visible=p.uGain.value>.012)}),t.jsx("mesh",{ref:s,geometry:a,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:bl,fragmentShader:wl,uniforms:c,transparent:!0,depthWrite:!1,side:De,blending:wt,fog:!1})})}function vl({whirl:e,quality:o}){const n=b.useRef(),s=b.useRef(),i=be(d=>d.camera),a=b.useMemo(()=>{const d=Ds[o]??Ds.high,h=new Float32Array(d*3),p=new Float32Array(d),g=new Float32Array(d),f=new Float32Array(d),m=new Float32Array(d),l=new Float32Array(d);for(let x=0;x<d;x++)p[x]=Math.random()*Math.PI*2,g[x]=Math.random(),f[x]=.07+Math.random()*.1,m[x]=.12+Math.pow(Math.random(),1.8)*.5,l[x]=2+Math.random()*5;const u=new Lt;return u.setAttribute("position",new oe(h,3)),u.setAttribute("aAngle",new oe(p,1)),u.setAttribute("aPhase",new oe(g,1)),u.setAttribute("aRate",new oe(f,1)),u.setAttribute("aRadius",new oe(m,1)),u.setAttribute("aSize",new oe(l,1)),u.boundingSphere=new ao(new j(e.x,-60,e.z),e.r+140),u},[o,e]),c=b.useMemo(()=>({uTime:{value:0},uCentre:{value:new _n(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new j(...ie(Z.underGlow))},uGain:{value:0}}),[e]);return ne((d,h)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=h;const g=Math.hypot(i.position.x-e.x,i.position.z-e.z),f=1-T.smoothstep(g,e.r*1.2,e.r*4);p.uGain.value=y.underwater*f,s.current&&(s.current.visible=p.uGain.value>.015)}),t.jsx("points",{ref:s,geometry:a,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:gl,fragmentShader:xl,uniforms:c,transparent:!0,depthWrite:!1,blending:wt,fog:!1})})}function Ml({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ml,{quality:e}),Ne.map((o,n)=>t.jsx(vl,{whirl:o,quality:e},n)),Ne.map((o,n)=>t.jsx(yl,{whirl:o,quality:e},`w${n}`))]})}const Zo=16/9,Oa=96,Da=78;function An(e,o,n=Oa){if(!o||o>=Zo)return e;const s=T.degToRad(e)/2,i=2*Math.atan(Math.tan(s)*Zo/o);return Math.min(n,T.radToDeg(i))}function Na(e){return!e||e>=Zo?1:T.clamp(.72+.28*(e/Zo),.86,1)}function In(e,o,n,s=.06,i=Oa){const a=An(o,e.aspect,i);Math.abs(e.fov-a)<=.05||(e.fov+=(a-e.fov)*(1-Math.pow(s,n)),e.updateProjectionMatrix())}function Cn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*T.clamp(1280/o,.55,2.2)}const Ha="oni.settings.v1";function jl(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const Me={comfort:0,lookSens:1,invertY:!1,freeCam:!1},Fn=new Set;function _a(){for(const e of Fn)e(Me)}function Ba(e){return Fn.add(e),()=>Fn.delete(e)}function Xn(e,o){e in Me&&(Me[e]=o,zl(),_a())}function qo(e){Xn(e,!Me[e])}function Sl(){Xn("comfort",Me.comfort<.01?.55:Me.comfort<.9?1:0)}function kl(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=Me.lookSens-1e-6);Xn("lookSens",e[(o+1)%e.length])}function zl(){try{localStorage.setItem(Ha,JSON.stringify(Me))}catch{}}function Tl(){let e=null;try{e=JSON.parse(localStorage.getItem(Ha)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(Me))typeof e[o]==typeof Me[o]&&(Me[o]=e[o]);else Me.comfort=jl()?1:0;return _a(),Me}const Pe=(e,o)=>e+(o-e)*Me.comfort,co=e=>e<-1?-1:e>1?1:e,I={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,jumpQueued:!1,boardQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},zt={level:0},Pn=new Set;function El(e){return Pn.add(e),()=>Pn.delete(e)}function Qn(e){if(zt.level===e)return e;zt.level=e;for(const o of Pn)o(e);return e}function Ua(){return Qn((zt.level+1)%3)}const J={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},xo=new Set,ct=(...e)=>e.some(o=>xo.has(o));function Wa(){I.throttle=0,I.rudder=0,I.planes=0,I.boost=!1,I.walk.x=0,I.walk.z=0,I.surfaceQueued=!1,I.periscopeQueued=!1,I.burstQueued=!1,I.recentreQueued=!1,I.jumpQueued=!1,I.boardQueued=!1,I.zoom=0,I.pistolQueued=!1,I.bazookaQueued=!1,I.gigantQueued=!1,I.rocketQueued=!1,I.hakiQueued=!1,I.gear2Queued=!1,I.gatlingHeld=!1,I.balloonHeld=!1,J.gatling=!1,J.balloon=!1,Qn(0),J.throttle=0,J.rudder=0,J.planes=0,J.boost=!1,J.walk.x=0,J.walk.z=0,xo.clear()}function Rl(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),o=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const a=i.key.toLowerCase();xo.add(a),a==="f"&&(I.surfaceQueued=!0),a==="p"&&(I.periscopeQueued=!0),a==="b"&&!i.repeat&&(I.burstQueued=!0),a==="r"&&!i.repeat&&(I.recentreQueued=!0),a==="v"&&!i.repeat&&qo("freeCam"),a==="x"&&!i.repeat&&Ua(),a===" "&&!i.repeat&&(I.jumpQueued=!0),a==="t"&&!i.repeat&&(I.boardQueued=!0),a==="j"&&!i.repeat&&(I.pistolQueued=!0),a==="k"&&!i.repeat&&(I.bazookaQueued=!0),a==="l"&&!i.repeat&&(I.gigantQueued=!0),a==="g"&&!i.repeat&&(I.rocketQueued=!0),a==="h"&&!i.repeat&&(I.hakiQueued=!0),a==="n"&&!i.repeat&&(I.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(a)&&i.preventDefault()},n=i=>xo.delete(i.key.toLowerCase()),s=()=>Wa();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",s),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",s),xo.clear()}}function Al(){const e=ct("w","arrowup")?1:0,o=ct("s","arrowdown")?1:0,n=ct("a","arrowleft")?1:0,s=ct("d","arrowright")?1:0,i=ct("q"," ")?1:0,a=ct("e","c")?1:0,c=co(e-o+J.throttle);c<-.05&&zt.level&&Qn(0),I.throttle=zt.level>0?Math.max(c,1):c,I.rudder=co(n-s+J.rudder),I.planes=co(i-a+J.planes),I.boost=ct("shift")||J.boost||zt.level===2,I.zoom=(ct("]","=","+")?1:0)-(ct("[","-","_")?1:0),I.gatlingHeld=ct("u")||J.gatling,I.balloonHeld=ct("i")||J.balloon,I.walk.x=co(s-n+J.walk.x),I.walk.z=co(e-o+J.walk.z)}const Ln=[0,(Ae[0].y+Ae[1].y)/2,Ae[0].z],Ya=[he.x,he.y,he.z],Jo=U.dir,Va=[U.x+Jo[0]*300,-36,U.z+Jo[1]*300],$a=[U.x+Jo[0]*46,34,U.z+Jo[1]*46],Ka=[U.gate.x,4,U.gate.z],Xa=[U.gate.x,22,U.gate.z],Il=1.55,Gn=N/Il,Cl=1+(Gn-1)*.35,xt=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Ln,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Va,to:$a,lookFrom:Ka,lookTo:Xa,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Ya,lookTo:Ln,swell:0}],Fl=new Set([Ln,Ya,Va,$a,Ka,Xa]),Io=e=>Fl.has(e)?e:[e[0]*Gn,e[1]*Cl,e[2]*Gn];for(const e of xt)e.from=Io(e.from),e.to=Io(e.to),e.lookFrom=Io(e.lookFrom),e.lookTo=Io(e.lookTo);const On=xt.reduce((e,o)=>e+o.dur,0),Hs=xt,Pl=e=>e*e*(3-2*e),Ll=e=>1-Math.pow(1-e,2.2),Co=e=>new j(e[0],e[1],e[2]),Ct={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function Gl(e,o){b.useEffect(()=>{if(!e)return;const n=o.domElement,s=new Map;let i=0,a=null;const c=(f,m)=>{const l=y.orbit,u=l.dist*.0016,x=Math.cos(l.yaw),v=-Math.sin(l.yaw);l.target.x-=x*f*u,l.target.z-=v*f*u;const w=Math.cos(l.pitch),k=Math.sin(l.pitch);l.target.y+=m*u*w,l.target.x+=Math.sin(l.yaw)*m*u*k,l.target.z+=Math.cos(l.yaw)*m*u*k,Qa()},d=f=>{s.set(f.pointerId,{x:f.clientX,y:f.clientY});try{n.setPointerCapture?.(f.pointerId)}catch{}if(s.size===2){const[m,l]=[...s.values()];i=Math.hypot(m.x-l.x,m.y-l.y),a={x:(m.x+l.x)/2,y:(m.y+l.y)/2}}},h=f=>{const m=s.get(f.pointerId);if(!m)return;const l=f.clientX-m.x,u=f.clientY-m.y;if(m.x=f.clientX,m.y=f.clientY,s.size>=2){const[x,v]=[...s.values()],w=Math.hypot(x.x-v.x,x.y-v.y),k={x:(x.x+v.x)/2,y:(x.y+v.y)/2};if(i>8&&w>8){const z=y.orbit;z.dist=T.clamp(z.dist*(i/w),...Ct.dist)}a&&c(k.x-a.x,k.y-a.y),i=w,a=k,f.cancelable&&f.preventDefault();return}if(f.shiftKey||f.buttons===4)c(l,u);else{const x=y.orbit;x.yaw-=l*.005*Cn(),x.pitch=T.clamp(x.pitch+u*.004*Cn(),...Ct.pitch)}f.cancelable&&f.preventDefault()},p=f=>{s.delete(f.pointerId)&&s.size<2&&(i=0,a=null)},g=f=>{f.preventDefault();const m=y.orbit;m.dist=T.clamp(m.dist*(1+Math.sign(f.deltaY)*.11),...Ct.dist)};return n.addEventListener("pointerdown",d),n.addEventListener("pointermove",h,{passive:!1}),n.addEventListener("pointerup",p),n.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),n.addEventListener("wheel",g,{passive:!1}),()=>{n.removeEventListener("pointerdown",d),n.removeEventListener("pointermove",h),n.removeEventListener("pointerup",p),n.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),n.removeEventListener("wheel",g),s.clear()}},[e,o])}function Qa(){const e=y.orbit;e.target.x=T.clamp(e.target.x,-4200,Ct.xz),e.target.z=T.clamp(e.target.z,-4200,Ct.xz),e.target.y=T.clamp(e.target.y,...Ct.y)}function Ol({onRails:e,playing:o,speed:n=1,onShot:s,idle:i=!1}){const a=be(g=>g.camera),c=be(g=>g.gl),d=b.useRef(0),h=b.useRef(-1),p=b.useRef(new j(0,150,-260));return Gl(!e&&!i,c),b.useEffect(()=>{if(e)return;const g=y.orbit,f=a.position.clone().sub(g.target);g.dist=T.clamp(f.length(),...Ct.dist),g.yaw=Math.atan2(f.x,f.z),g.pitch=Math.asin(T.clamp(f.y/(f.length()||1),-1,1))},[e,a]),ne((g,f)=>{if(i)return;const m=Math.min(f,.05);if(y.t+=m,e){if(y.jumpTo!=null){let R=0;for(let A=0;A<y.jumpTo&&A<xt.length;A++)R+=xt[A].dur;d.current=R,y.jumpTo=null}o&&(d.current=(d.current+m*n)%On);let w=0,k=0;for(;k<xt.length&&!(d.current<w+xt[k].dur);k++)w+=xt[k].dur;const z=xt[Math.min(k,xt.length-1)],r=T.clamp((d.current-w)/z.dur,0,1);h.current!==k&&(h.current=k,y.shot=k,s?.(k,z));const M=Co(z.from).lerp(Co(z.to),Ll(r)),F=Co(z.lookFrom).lerp(Co(z.lookTo),Pl(r)),C=z.swell??0;if(C>0){const R=y.t;M.y+=Math.sin(R*.62)*3.1*C+Math.sin(R*1.31+1.2)*1.2*C,M.x+=Math.sin(R*.44+.6)*2.2*C}M.x+=Math.sin(y.t*.83)*.35,M.y+=Math.sin(y.t*1.17+2)*.28,a.position.copy(M),p.current.lerp(F,1-Math.pow(1e-4,m)),a.lookAt(p.current),C>0&&a.rotateZ(Math.sin(y.t*.51)*.024*C);const S=An(z.fov,a.aspect);Math.abs(a.fov-S)>.01&&(a.fov+=(S-a.fov)*(1-Math.pow(.02,m)),a.updateProjectionMatrix()),y.progress=d.current/On}else{const w=y.orbit;I.recentreQueued&&(I.recentreQueued=!1,w.target.set(L.x,L.baseY*.55,L.z),w.dist=T.clamp(w.dist,260,1400));const k=I.walk.x,z=I.walk.z;if(k||z||I.planes||I.zoom){const F=w.dist*(I.boost?1.9:.7)*m,C=-Math.sin(w.yaw),S=-Math.cos(w.yaw);w.target.x+=(C*z-S*k)*F,w.target.z+=(S*z+C*k)*F,w.target.y+=I.planes*F,w.dist=T.clamp(w.dist*(1-I.zoom*.9*m),...Ct.dist),Qa()}const r=Math.cos(w.pitch);a.position.set(w.target.x+Math.sin(w.yaw)*r*w.dist,w.target.y+Math.sin(w.pitch)*w.dist,w.target.z+Math.cos(w.yaw)*r*w.dist),a.lookAt(w.target);const M=An(55,a.aspect);Math.abs(a.fov-M)>.01&&(a.fov+=(M-a.fov)*(1-Math.pow(.02,m)),a.updateProjectionMatrix()),y.t+=0}const l=wo(a.position.x,a.position.z);y.shelter+=(l-y.shelter)*(1-Math.pow(.06,m)),y.fog=T.lerp(Ft.sea,Ft.bay,y.shelter),y.rain=1-y.shelter*.92;const u=ut(a.position.x,a.position.z,y.t,1),x=T.clamp((u.y-a.position.y-1)/3,0,1);y.underwater+=(x-y.underwater)*(1-Math.pow(.002,m)),y.depthBelow=Math.max(0,u.y-a.position.y);const v=T.lerp(8200,1700,y.underwater);Math.abs(a.far-v)>20&&(a.far=v,a.updateProjectionMatrix()),g.camera.updateMatrixWorld()}),null}const _s={low:[24,16],mid:[40,26],high:[56,36]};function Dl({quality:e="high",shadows:o=!0}){const n=b.useRef(),s=b.useRef(),i=b.useMemo(()=>{const[m,l]=_s[e]??_s.high,u=new fr(1,m,l),x=u.attributes.position,v=new Float32Array(x.count*3),[w,k,z]=Ce.centre,[r,M,F]=Ce.radii,C=new ve("#241c22"),S=new ve(E.rockWarm),R=new ve;for(let A=0;A<x.count;A++){const B=x.getX(A),G=x.getY(A),$=x.getZ(A),q=1+(qt(B*2.4+5,$*2.4-9,3)-.5)*.14;x.setXYZ(A,w+B*r*q,k+G*M*q,z+$*F*q);const ee=T.clamp((G+.2)/1.2,0,1);R.copy(C).lerp(S,(1-ee)*.55),v[A*3]=R.r,v[A*3+1]=R.g,v[A*3+2]=R.b}return u.setAttribute("color",new oe(v,3)),u.computeVertexNormals(),u},[e]),{stairM:a,brazierM:c,bayM:d,tableM:h,jarM:p,westStairM:g}=b.useMemo(()=>{const m=new rt,l=new mt,u=new j(1,1,1),x=new j,v=[];for(let P=0;P<lt.steps;P++){const K=P/(lt.steps-1);x.set(0,T.lerp(Le.y,le.y+2,K),T.lerp(lt.zTop,lt.zBottom,K)),l.identity(),v.push(m.clone().compose(x,l,u))}const w=[],k=e==="low"?5:9;for(const P of[-1,1])for(let K=0;K<k;K++){const ae=K/(k-1);x.set(P*176,le.y+9,T.lerp(le.zFront-40,le.zBack+40,ae)),l.identity(),w.push(m.clone().compose(x,l,u))}for(let P=0;P<6;P++)x.set(-110+P*44,le.y+9,O.z+O.halfZ+54),l.identity(),w.push(m.clone().compose(x,l,u));const z=[],r=e==="low"?5:9;for(const P of[-1,1])for(let K=0;K<xe.tiers;K++)for(let ae=0;ae<r;ae++){const H=ae/(r-1);x.set(P*(xe.x-K*26),xe.y+K*xe.tierRise,T.lerp(-205,xe.halfZ,H)),l.identity(),z.push(m.clone().compose(x,l,u))}const M=[],F=[],C=new mt,S=new j(0,1,0);let R=24301;const A=()=>(R=Math.imul(R,1664525)+1013904223>>>0,R/4294967296),B=e==="low"?1:2,G=e==="low"?5:8;for(const P of[-1,1])for(let K=0;K<B;K++)for(let ae=0;ae<G;ae++){const H=P*(96+K*52+(A()-.5)*14),te=T.lerp(le.zBack+120,le.zFront-60,ae/(G-1))+(A()-.5)*16;if(!(Math.abs(H)<ke.halfX+24&&Math.abs(te-ke.z)<ke.halfZ+20)&&!(Math.abs(Math.abs(H)-me.x)<26&&te<me.zFoot+16&&te>me.zTop-8)){x.set(H,le.y+2.4,te),C.setFromAxisAngle(S,(A()-.5)*.5),M.push(m.clone().compose(x,C,u));for(let we=0;we<2;we++)x.set(H+(A()-.5)*30,le.y+3.5,te+(A()>.5?8:-8)+(A()-.5)*6),C.setFromAxisAngle(S,A()*Math.PI),F.push(m.clone().compose(x,C,u))}}const $=[],q=16,ee=P=>P*P*(3-2*P);for(let P=0;P<=q;P++){const K=P/q;x.set(-252,ee(K)*(xe.y-.5)-1.3,T.lerp(45,-45,K)),l.identity(),$.push(m.clone().compose(x,l,u))}return{stairM:v,brazierM:w,bayM:z,tableM:M,jarM:F,westStairM:$}},[e]);ne(()=>{const m=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(m*4.1)*.3+Math.sin(m*9.3)*.15),s.current&&(s.current.material.emissiveIntensity=.85+Math.sin(m*.9)*.12)});const f=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:vn,receiveShadow:f,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:vn,roughness:.97,metalness:.02})}),[[0,(le.zFront+ke.z+ke.halfZ)/2,le.halfX*2,le.zFront-ke.z-ke.halfZ],[0,(le.zBack+ke.z-ke.halfZ)/2,le.halfX*2,ke.z-ke.halfZ-le.zBack],[-342/2-20,ke.z,le.halfX*2-ke.halfX*2,ke.halfZ*2],[(ke.halfX+le.halfX)/2+20,ke.z,le.halfX*2-ke.halfX*2,ke.halfZ*2]].map(([m,l,u,x],v)=>t.jsxs("mesh",{position:[m,le.y-3,l],receiveShadow:f,children:[t.jsx("boxGeometry",{args:[Math.abs(u),6,Math.abs(x)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},v)),t.jsxs("mesh",{ref:s,position:[ke.x,Qe.ceiling+2,ke.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[ke.halfX*2,ke.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:De})]}),t.jsxs("mesh",{position:[0,Le.y-4,Le.z],receiveShadow:f,castShadow:f,children:[t.jsx("boxGeometry",{args:[Le.halfX*2.6,8,Le.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,a.length],receiveShadow:f,children:[t.jsx("boxGeometry",{args:[lt.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Nl,{matrices:a})]}),[-1,1].map(m=>Array.from({length:xe.tiers},(l,u)=>t.jsxs("mesh",{position:[m*(xe.x-u*26),xe.y+u*xe.tierRise-4,0],receiveShadow:f,castShadow:f,children:[t.jsx("boxGeometry",{args:[76-u*6,7,xe.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]},`${m}-${u}`))),t.jsxs("instancedMesh",{args:[null,null,d.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:E.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Ul,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,h.length],castShadow:f,receiveShadow:f,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(Hl,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,p.length],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(_l,{matrices:p})]}),t.jsxs("instancedMesh",{args:[null,null,g.length],castShadow:f,receiveShadow:f,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Bl,{matrices:g})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Wl,{matrices:c})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:E.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Yl,{matrices:c})]}),t.jsxs("mesh",{position:[0,Qe.y-4,0],receiveShadow:f,children:[t.jsx("boxGeometry",{args:[Qe.halfX*2,8,Qe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(m=>[-1,0,1].map(l=>t.jsxs("mesh",{position:[m*120,(Qe.y+le.y)/2,l*96],castShadow:f,children:[t.jsx("boxGeometry",{args:[26,Math.abs(le.y-Qe.y),26]}),t.jsx("meshStandardMaterial",{color:Z.rock,roughness:.95})]},`${m}-${l}`)))]})}function Nl({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function Hl({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function _l({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function Bl({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function Ul({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function Wl({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o})}function Yl({matrices:e}){const o=b.useRef();return t.jsx(_t,{matrices:e,selfRef:o,offsetY:9})}function _t({matrices:e,offsetY:o=0}){const n=b.useRef(),s=b.useRef(!1);return ne(()=>{if(s.current)return;const i=n.current?.parent;if(!i?.isInstancedMesh)return;const a=new rt,c=new rt().makeTranslation(0,o,0);for(let d=0;d<Math.min(e.length,i.count);d++)a.copy(e[d]).multiply(c),i.setMatrixAt(d,a);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:n})}const Bs=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),i=s.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),s.fillStyle=i,s.fillRect(0,0,e,o),s.globalAlpha=.14,s.fillStyle="#fff3c4";for(let c=0;c<12;c++){const d=c/12*Math.PI*2;s.save(),s.translate(e/2,o*.62),s.rotate(d),s.fillRect(-3,0,6,e),s.restore()}s.globalAlpha=.22,s.fillStyle="#5e1610";for(let c=8;c<e;c+=22)s.fillRect(c,0,3,o);s.globalAlpha=1;const a=new no(n);return a.colorSpace=so,a})();function Vl(e,o,n,s){const i=e+s,a=o+s,c=new Float32Array([-i,0,a,i,0,a,e*.18,n,o*.18,-i,0,a,e*.18,n,o*.18,-e*.18,n,o*.18,i,0,a,i,0,-a,e*.18,n,-o*.18,i,0,a,e*.18,n,-o*.18,e*.18,n,o*.18,i,0,-a,-i,0,-a,-e*.18,n,-o*.18,i,0,-a,-e*.18,n,-o*.18,e*.18,n,-o*.18,-i,0,-a,-i,0,a,-e*.18,n,o*.18,-i,0,-a,-e*.18,n,o*.18,-e*.18,n,-o*.18]),d=new Lt;return d.setAttribute("position",new oe(c,3)),d.computeVertexNormals(),d}function $l({quality:e="high",shadows:o=!0}){const n=b.useRef(),s=b.useRef(),i=ot("keep-hf.opt.glb"),a=b.useMemo(()=>{const d=[];for(let h=0;h<O.storeys;h++){const p=1-(h+1)*O.taper,g=O.plinth+h*O.storey;d.push({i:h,y:g,halfX:O.halfX*p,halfZ:O.halfZ*p,roof:Vl(O.halfX*p,O.halfZ*p,h===O.storeys-1?30:16,11)})}return d},[]);ne(()=>{const d=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(d*2.2)*.3),s.current&&(s.current.material.emissiveIntensity=2.3+Math.sin(d*3.3)*.25)});const c=o;return t.jsxs("group",{position:[0,O.baseY,O.z],children:[t.jsxs("mesh",{position:[0,O.plinth/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[O.halfX*2.2,O.plinth,O.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(ge,{name:"keep-hf.opt.glb",height:O.plinth+O.storeys*O.storey+26,position:[0,O.plinth*.5,0],tint:"#9a8468",emissive:E.emberDeep,emissiveIntensity:.14}),!i&&a.map(d=>t.jsxs("group",{position:[0,d.y,0],children:[t.jsxs("mesh",{position:[0,O.storey/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[d.halfX*2,O.storey,d.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,O.storey*.55,d.halfZ+.6],children:[t.jsx("planeGeometry",{args:[d.halfX*1.75,O.storey*.38]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,O.storey*.02,d.halfZ+8],castShadow:c,children:[t.jsx("boxGeometry",{args:[d.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,O.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[d.halfX*2+3,1.6,d.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:d.roof,position:[0,O.storey,0],castShadow:c,receiveShadow:c,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},d.i)),[-1,1].map(d=>t.jsxs("mesh",{position:[d*14,O.plinth+O.storeys*O.storey+30,0],rotation:[0,0,d*.4],castShadow:c,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},d)),t.jsxs("group",{position:[0,Ee.y,Ee.z-O.z],children:[t.jsxs("mesh",{castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[Ee.halfX*2,7,Ee.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[Ee.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:"#ffffff",emissiveMap:Bs,map:Bs,emissiveIntensity:2.2,toneMapped:!1,side:De})]}),t.jsx(ge,{name:"oni-throne.opt.glb",height:ce("oni-throne.opt.glb"),position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],scale:ce("oni-throne.opt.glb")/38,children:[t.jsxs("mesh",{position:[0,6,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:c,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*8,32,-5],rotation:[0,0,d*-.55],castShadow:c,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},d))]})}),t.jsx(ge,{name:"kagura-stage.opt.glb",height:ce("kagura-stage.opt.glb"),position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:E.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*Ee.halfX*.9,28,Ee.depth/2-4],castShadow:c,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},d)),t.jsxs("mesh",{position:[0,56,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[Ee.halfX*2.3,5,Ee.depth+22]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.72})]}),[-1,1].map(d=>t.jsx(ge,{name:"oni-daiko.opt.glb",height:ce("oni-daiko.opt.glb"),position:[d*(Ee.halfX-22),4,4],rotation:d*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,ce("oni-daiko.opt.glb")/2,0],rotation:[0,0,Math.PI/2],scale:ce("oni-daiko.opt.glb")/22,children:t.jsxs("mesh",{castShadow:c,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},d))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Kl,{})]})]})}function Kl(){const e=b.useRef(),o=b.useRef(!1);return ne(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const s=new rt,i=new j,a=new mt,c=new j(1,1,1);for(let d=0;d<n.count;d++){const h=d/(n.count-1)*2-1;i.set(h*(O.halfX+26),Ee.y+74-(1-h*h)*20,O.halfZ+22),n.setMatrixAt(d,s.compose(i,a,c))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Xl({shadows:e=!0}){const{slabs:o,flights:n,tower:s}=Sa,i=b.useMemo(()=>{const a=[],c=d=>d*d*(3-2*d);for(const d of n)for(let p=0;p<=9;p++){const g=p/9;a.push([(d.x0+d.x1)/2,d.y0+(d.y1-d.y0)*c(g)-1.2,T.lerp(d.z0,d.z1,g)])}return a},[n]);return t.jsxs("group",{children:[[s.x[0]+1,s.x[1]-1].map(a=>[s.z[0]+1,s.z[1]-1].map(c=>t.jsxs("mesh",{position:[a,128,c],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${a}${c}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Ql,{points:i})]}),o.map(([a,c,d,h,p],g)=>t.jsxs("mesh",{position:[a,c-1.6,d],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(h),3.2,Math.abs(p)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},g)),o.map(([a,c,d,h,p],g)=>t.jsxs("mesh",{position:[a,c+5,d+Math.abs(p)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(h),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})]},`r${g}`))]})}function Ql({points:e}){const o=b.useRef(),n=b.useRef(!1);return ne(()=>{if(n.current)return;const s=o.current?.parent;if(!s?.isInstancedMesh)return;const i=new rt,a=new mt,c=new j(1,1,1),d=new j;for(let h=0;h<Math.min(e.length,s.count);h++)d.set(e[h][0],e[h][1],e[h][2]),s.setMatrixAt(h,i.compose(d,a,c));s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function Zl({shadows:e=!0}){const o=b.useMemo(()=>{const n=[],i=a=>a*a*(3-2*a);for(const a of[-1,1])for(let c=0;c<=20;c++){const d=c/20;n.push({x:a*me.x,y:i(d)*It,z:T.lerp(me.zFoot,me.zTop,d)})}return n},[]);return t.jsxs("group",{children:[o.map((n,s)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[me.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.75})]},s)),[-1,1].map(n=>{const s=a=>a*a*(3-2*a),i=a=>{const c=[];for(let d=0;d<=16;d++){const h=d/16;c.push(new j(n*me.x+a,s(h)*It+7,T.lerp(me.zFoot,me.zTop,h)))}return new oo(new to(c),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(me.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})})]},n)})]})}function ql({shadows:e=!0}){const o=b.useMemo(()=>ko.map(([,,n,s])=>{const i=[];for(let a=0;a<=12;a++){const c=a/12*2-1;i.push(new j(c*n*.5,s*(1-c*c),0))}return new oo(new to(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[ko.map(([n,s],i)=>t.jsxs("group",{position:[0,n,s],children:[t.jsx("mesh",{geometry:o[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.74})}),[-7,7].map(a=>t.jsx("mesh",{geometry:o[i],position:[0,7,a],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})},a))]},i)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,ko[0][0]-12,ko[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,le.y,0]})]})}function Za(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Jl({quality:e,shadows:o}){const n=b.useMemo(()=>{const i=Za(712273),a=[],c=e==="low"?34:e==="mid"?68:108;let d=0;for(;a.length<c&&d<c*40;){d++;const h=(i()*2-1)*(le.halfX-30),p=T.lerp(le.zBack+40,le.zFront-30,i());Math.abs(h)<62&&p>O.z+120||Math.abs(h)<70&&Math.abs(p-84)<58||Math.abs(Math.abs(h)-me.x)<24&&p<me.zFoot+18&&p>me.zTop-10||a.push({x:h,z:p,kind:a.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return a},[e]),s=o;return t.jsx(t.Fragment,{children:n.map((i,a)=>{const c=[i.x,le.y,i.z];if(i.kind===0){const h=ce("sake-tower.opt.glb")*i.k,p=h*.24;return t.jsx(ge,{name:"sake-tower.opt.glb",height:h,position:c,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:c,children:[0,1,2].map(g=>t.jsxs("mesh",{position:[0,h*(.17+g*.3),0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[p-g*p*.16,p-g*p*.16,h*.29,10]}),t.jsx("meshStandardMaterial",{color:g%2?"#c9a86a":"#8e6a3c",roughness:.92})]},g))})},a)}if(i.kind===1){const h=ce("oni-guardian.opt.glb")*i.k;return t.jsx(ge,{name:"oni-guardian.opt.glb",height:h,position:c,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,h*.17,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[h*.43,h*.33,h*.43]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,h*.6,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[h*.2,h*.33,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(p=>t.jsxs("mesh",{position:[p*h*.13,h*.93,0],rotation:[0,0,p*.5],castShadow:s,children:[t.jsx("coneGeometry",{args:[h*.067,h*.27,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},p))]})},a)}if(i.kind===2){const h=ce("wisteria-trellis.opt.glb")*i.k;return t.jsx(ge,{name:"wisteria-trellis.opt.glb",height:h,position:c,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,h*.94,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[h*.7,h*.07,h*.07]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-.26,-.09,.09,.26].map(p=>t.jsxs("mesh",{position:[p*h,h*.47,0],children:[t.jsx("coneGeometry",{args:[h*.1,h*.88,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},p))]})},a)}const d=Bi*4*i.k;return t.jsxs("group",{position:c,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,d/2,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[d*.021,d*.021,d,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[d*.12,d*.65,0],children:[t.jsx("planeGeometry",{args:[d*.235,d*.7]}),t.jsx("meshStandardMaterial",{color:a%2?E.vermilion:"#e8dcc4",roughness:.95,side:De,emissive:a%2?E.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},a)})})}function ec({shadows:e}){const o=b.useMemo(()=>{const n=Za(10560325),s=[];for(let i=0;i<52;i++)s.push({x:(n()*2-1)*(Qe.halfX-40),z:(n()*2-1)*(Qe.halfZ-40),rot:n()*Math.PI*2,keg:i%2===0});return s},[]);return t.jsx(t.Fragment,{children:o.map((n,s)=>n.keg?t.jsx(ge,{name:"powder-keg.opt.glb",height:ce("powder-keg.opt.glb"),position:[n.x,Qe.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Qe.y+ce("powder-keg.opt.glb")*.5,n.z],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb"),10]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},s):t.jsx(ge,{name:"war-cannon.opt.glb",height:ce("war-cannon.opt.glb"),position:[n.x,Qe.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Qe.y+ce("war-cannon.opt.glb")*.42,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("war-cannon.opt.glb")*.18,ce("war-cannon.opt.glb")*.23,ce("war-cannon.opt.glb")*1.9,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},s))})}function tc(){const e=be(o=>o.camera);return ne((o,n)=>{const s=Math.min(n,.05),i=(e.position.x-pe.x-Ce.centre[0])/Ce.radii[0],a=(e.position.y-pe.y-Ce.centre[1])/Ce.radii[1],c=(e.position.z-pe.z-Ce.centre[2])/Ce.radii[2],d=Math.sqrt(i*i+a*a+c*c),h=T.clamp(1-(d-1)/.5,0,1);y.inside+=(h-y.inside)*(1-Math.pow(.02,s))}),null}function oc({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[pe.x,pe.y,pe.z],children:[t.jsx(tc,{}),t.jsx(Dl,{quality:e,shadows:o}),t.jsx($l,{quality:e,shadows:o}),t.jsx(ql,{shadows:o}),t.jsx(Zl,{shadows:o}),t.jsx(Xl,{shadows:o}),t.jsx(Jl,{quality:e,shadows:o}),t.jsx(ec,{shadows:o}),[-1,1].flatMap(n=>[0,1,2,3,4].map(s=>t.jsx(ge,{name:"banquet-table.opt.glb",height:ce("banquet-table.opt.glb"),position:[n*(74+s%2*22),le.y,O.z+186+s*34],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}-${s}`))),t.jsx(ge,{name:"treasure-kura.opt.glb",height:ce("treasure-kura.opt.glb"),position:[xe.x-74,le.y,O.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsx("group",{position:[xe.x-74,le.y,O.z+96],rotation:[0,-.7,0],children:(()=>{const n=ce("treasure-kura.opt.glb");return t.jsxs(t.Fragment,{children:[[-1,1].map(s=>[-1,1].map(i=>t.jsxs("mesh",{position:[s*n*.3,n*.08,i*n*.22],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.1,n*.16,n*.1]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${s}${i}`))),t.jsxs("mesh",{position:[0,n*.34,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.85,n*.38,n*.65]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,n*.6,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[n*.65,n*.3,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})})()})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1],[-64,22,1.8],[104,-46,.2],[-176,-118,2.7],[18,-142,1.4],[-30,96,.9]].map(([n,s,i],a)=>t.jsx(ge,{name:"bomb-sphere.opt.glb",height:ce("bomb-sphere.opt.glb"),position:[n,Qe.y,s],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Qe.y+ce("bomb-sphere.opt.glb")*.5,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[ce("bomb-sphere.opt.glb")*.5,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${a}`)),[-1,1].map(n=>t.jsx(ge,{name:"keep-tier.opt.glb",height:ce("keep-tier.opt.glb"),position:[n*(xe.x-40),xe.y+xe.tiers*xe.tierRise-6,O.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(ge,{name:"arch-bridge.opt.glb",height:ce("arch-bridge.opt.glb"),position:[n*74,le.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(ge,{name:"oni-guardian.opt.glb",height:Rt,position:[n*(Le.halfX+26),Le.y,Le.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(Le.halfX+26),Le.y,Le.z-26],children:[t.jsxs("mesh",{position:[0,Rt*.17,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[Rt*.41,Rt*.33,Rt*.41]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,Rt*.59,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[Rt*.185,Rt*.33,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,Ee.y+30,Ee.z-O.z+O.z+40],color:E.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,xe.y+120,60],color:E.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Qe.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,Le.y+132,Le.z-40],color:E.lantern,intensity:13e3,distance:620,decay:2})]})}const nc=Math.PI/2-.14,Us=1.5;function qa({enabled:e,dom:o,zoomMin:n=.34,zoomMax:s=2.6,zoom0:i=1,pitch0:a=.16,pitchMin:c=-.62,pitchMax:d=nc}){const h=b.useRef({yaw:0,pitch:a,zoom:i,smYaw:0,smPitch:a,smZoom:i,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:c,pitchMax:d,zoomMin:n,zoomMax:s,pitch0:a}).current;return b.useEffect(()=>{if(!e||!o)return;const p=o,g=new Map;let f=0,m=0,l=null;const u=()=>g.size,x=z=>{g.set(z.pointerId,{x:z.clientX,y:z.clientY});try{p.setPointerCapture?.(z.pointerId)}catch{}if(u()===1)h.dragging=!0,l={x:z.clientX,y:z.clientY,t:z.timeStamp};else if(u()===2){h.dragging=!1;const[r,M]=[...g.values()];f=Math.hypot(r.x-M.x,r.y-M.y),l=null}},v=z=>{const r=g.get(z.pointerId);if(!r)return;const M=z.clientX-r.x,F=z.clientY-r.y;if(r.x=z.clientX,r.y=z.clientY,u()>=2){const[S,R]=[...g.values()],A=Math.hypot(S.x-R.x,S.y-R.y);f>8&&A>8&&(h.zoom=T.clamp(h.zoom*(f/A),h.zoomMin,h.zoomMax),h.since=0),f=A;return}if(!h.dragging)return;l&&Math.hypot(z.clientX-l.x,z.clientY-l.y)>14&&(l=null);const C=Cn()*Me.lookSens;h.yaw-=M*.005*C,h.pitch=T.clamp(h.pitch+F*.004*C*(Me.invertY?-1:1),h.pitchMin,h.pitchMax),h.since=0,z.cancelable&&z.preventDefault()},w=z=>{g.has(z.pointerId)&&(g.delete(z.pointerId),u()<2&&(f=0),u()===0&&(h.dragging=!1,l&&z.timeStamp-l.t<260&&(z.timeStamp-m<340?(h.recentre=!0,m=0):m=z.timeStamp),l=null))},k=z=>{z.preventDefault(),h.zoom=T.clamp(h.zoom*(1+Math.sign(z.deltaY)*.1),h.zoomMin,h.zoomMax),h.since=0};return p.addEventListener("pointerdown",x),p.addEventListener("pointermove",v,{passive:!1}),p.addEventListener("pointerup",w),p.addEventListener("pointercancel",w),window.addEventListener("pointerup",w),p.addEventListener("wheel",k,{passive:!1}),()=>{p.removeEventListener("pointerdown",x),p.removeEventListener("pointermove",v),p.removeEventListener("pointerup",w),p.removeEventListener("pointercancel",w),window.removeEventListener("pointerup",w),p.removeEventListener("wheel",k),g.clear(),h.dragging=!1}},[e,o,h]),h}function Dn(e,o,n=0){if(e.since+=o,I.zoom&&(e.zoom=T.clamp(e.zoom*(1-I.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,I.recentreQueued&&(I.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=Us+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!Me.freeCam&&!e.noRecentre&&!e.dragging&&e.since>Us){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(Pe(.22,.48),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const s=e.dragging?6e-4:Pe(.002,.02),i=1-Math.pow(s,o);let a=e.yaw-e.smYaw;for(;a>Math.PI;)a-=Math.PI*2;for(;a<-Math.PI;)a+=Math.PI*2;e.smYaw+=a*i,e.smPitch+=(e.pitch-e.smPitch)*i,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const Ws=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeLength:.78,capeUrl:bo("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeLength:.56,capeUrl:bo("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],sc=e=>Ws.find(o=>o.id===e)??Ws[0],ac=.22,Ys=13,rc=.09,ic=.34,Vs=9,lc=1.1,cc=.55,$s=12,hc=6,dc=70,uc=.55,mn=26,pc=8,fc=5,Ks=.8,mc=12,gc=.3,xc=.13,Xs=3.4,bc=32,Qs=.65,wc=1.1,yc=.5,vc=6,Zs=6,Be=new j,ht=new j,ho=new j;function Mc(e,o,n,s,i,a,c,d){let p=0;for(let g=1;g<=16;g++){const f=g/16*c,m=e+s*f,l=o+i*f,u=n+a*f,x=d??re(m,u);if(l<=x){let v=p,w=f;for(let k=0;k<6;k++){const z=(v+w)/2,r=o+i*z,M=d??re(e+s*z,n+a*z);r<=M?w=z:v=z}return w}p=f}return null}function jc(e,o,n,s){const i=Math.min(e,.05),a=Ue.combat,c=ze.move,d=a.style==="sword";s.x=0,s.y=0,s.z=0,Be.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),Ue.lookYaw=Math.atan2(Be.x,Be.z),Ue.playerFacing=o.yaw,a.bazookaCd=Math.max(0,a.bazookaCd-i),a.gigantCd=Math.max(0,a.gigantCd-i),a.hakiCd=Math.max(0,a.hakiCd-i),a.gear2Cd=Math.max(0,a.gear2Cd-i),n.gear2Queued&&(n.gear2Queued=!1,!a.gear2&&a.gear2Cd<=0&&!d&&(a.gear2=!0,a.gear2T=pc,Ut(.25),ht.set(o.x,o.y+1,o.z),Et(ht,1.6,"haki"))),a.gear2&&(a.gear2T=Math.max(0,a.gear2T-i),a.gear2T<=0&&(a.gear2=!1,a.gear2Cd=fc));const h=a.gear2;a.balloon=T.damp(a.balloon,n.balloonHeld&&!d?1:0,8,i);const p=o.y+o.height*.9,g=Mc(o.x,p,o.z,Be.x,Be.y,Be.z,dc,o.floorY);Ue.aim.valid=g!=null,g!=null&&(Ue.aim.distance=g,Ue.aim.point.set(o.x,p,o.z).addScaledVector(Be,g));const f=!c.kind;if(n.rocketQueued&&(n.rocketQueued=!1,f&&g!=null&&(l(d?"flash":"rocket",uc),c.target.copy(Ue.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,f&&(l(d?"onigiri":"pistol",d?gc:ac),c.target.set(o.x,p,o.z).addScaledVector(Be,d?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,f&&a.bazookaCd<=0))if(d){const u=Ue.waves.find(x=>!x.active);u&&(u.active=!0,u.k=0,u.pos.set(o.x,p*.92,o.z),u.dir.set(Be.x,Be.y*.35,Be.z).normalize(),a.bazookaCd=wc,l("wavecast",.22),c.hit=!0,c.target.copy(u.pos).addScaledVector(u.dir,8),Ut(.1))}else l("bazooka",ic),c.target.set(o.x,p,o.z).addScaledVector(Be,g!=null?Math.min(g,Vs):Vs),a.bazookaCd=lc;n.gigantQueued&&(n.gigantQueued=!1,f&&a.gigantCd<=0&&(l(d?"sanzen":"gigant",d?yc:cc),c.target.set(o.x,p,o.z).addScaledVector(Be,g!=null?Math.min(g+1.5,$s):$s),a.gigantCd=d?vc:hc));for(const u of Ue.waves){if(!u.active)continue;const x=u.k;u.k=Math.min(1,u.k+i/Qs),u.pos.addScaledVector(u.dir,bc/Qs*i);for(const w of[.35,.68,1])x<w&&u.k>=w&&Et(u.pos,1.6,"slash");const v=o.floorY==null?re(u.pos.x,u.pos.z):o.floorY;(u.k>=1||u.pos.y<v+.4)&&(u.k<1&&Et(u.pos,1.6,"slash"),u.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,a.hakiCd<=0&&ze.hakiT<=0&&(ze.hakiT=Ks,ze.hakiFired=!1,a.hakiCd=mc)),ze.hakiT>0){ze.hakiT=Math.max(0,ze.hakiT-i);const u=1-ze.hakiT/Ks;if(a.haki=u,!ze.hakiFired&&u>.35&&(ze.hakiFired=!0,ht.set(o.x,o.y,o.z),Et(ht,3,"haki"),Ut(.9),d))for(let x=0;x<8;x++){const v=x/8*Math.PI*2;ht.set(o.x+Math.cos(v)*Zs,o.y+.6,o.z+Math.sin(v)*Zs),Et(ht,1.4,"slash")}}else a.haki=0;const m=n.gatlingHeld&&!c.kind;if(a.gatling=T.damp(a.gatling,m?1:0,14,i),a.gatling>.2&&Ue.gatlingAim.copy(Be),m){if(ze.gatT-=i,ze.gatT<=0)if(d)ze.gatT=xc,ze.tatsu+=1.9,ht.set(o.x+Math.cos(ze.tatsu)*Xs,o.y+.6,o.z+Math.sin(ze.tatsu)*Xs),Et(ht,.7,"slash"),Ut(.04);else{ze.gatT=rc*(h?.6:1);const u=g!=null?Math.min(g,Ys):Ys*.85;ht.set(o.x,p,o.z).addScaledVector(Be,u),Et(ht,.8,"punch"),Ut(.05)}}else ze.gatT=0;if(c.kind){c.t+=i;const u=Math.min(1,c.t/c.dur);if(!c.hit&&u>.45){c.hit=!0;const x=c.kind==="gigant"||c.kind==="sanzen"?3:1.3;if(Et(c.target,x,d?"slash":"punch"),Ut(c.kind==="gigant"||c.kind==="sanzen"?.7:.18),c.kind==="rocket"||c.kind==="flash"){ho.copy(c.target).sub(ht.set(o.x,o.y,o.z));const v=ho.length()||1;s.x=ho.x/v*mn,s.y=Math.max(0,ho.y/v*mn*.5),s.z=ho.z/v*mn}else(c.kind==="pistol"||c.kind==="onigiri")&&(s.x=Be.x*6,s.z=Be.z*6)}c.t>=c.dur&&(c.kind=null,c.t=0),a.move=c.kind,a.moveK=c.kind?Math.min(1,c.t/c.dur):0}else a.move=null,a.moveK=0;return Ue.shake=Math.max(0,Ue.shake-i*2.4),s;function l(u,x){c.kind=u,c.t=0,c.dur=x,c.hit=!1}}const ze={move:{kind:null,t:0,dur:0,hit:!1,target:new j},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function Sc(e="rubber"){const o=Ue.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,ze.move.kind=null,ze.move.t=0,ze.hakiT=0,ze.gatT=0,Ue.shake=0;for(const n of Ue.waves)n.active=!1}const Fo=64,kc=19,qs=16,zc=.92,Js=.52,ea=.3,Tc=.04,Ec=.0016,Rc=.055,Ac=1.9,Ic=16,Cc=62,Fc=9,ta={x:-.45,z:-2.4},oa=.075,Po=new j,na=new j;function $t(e,o){return T.clamp(-re(e,o)/26,0,1)}const Lo={x:60*N,z:1050*N},Pc=7,sa=15,$e=1.85,aa=1.1,Lc=26,Gc=9.4,ra=21,Oc=.011;function Dc({mode:e,onMode:o,crew:n="luffy"}){const s=be(F=>F.camera),i=be(F=>F.gl),a=b.useRef(),c=b.useRef(),d=b.useRef({speed:0,grounded:!0,maxSpeed:15}),h=b.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,p=b.useRef({x:0,y:0,z:0}).current,g=sc(n),f=b.useRef(),m=b.useRef(),l=b.useRef(),u=ot("ship-sunny.opt.glb"),x=ot("ship-lion.opt.glb"),v=u||x,w=u?"ship-sunny.opt.glb":x?"ship-lion.opt.glb":null,k=w?on(w,34):30,z=ot("crew-straw.opt.glb"),r=b.useRef({x:Lo.x,z:Lo.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,fvy:0,airborne:!1,landing:0,fyaw0:Math.PI,stride:0,area:"hall",dx:0,dz:0,snapCam:!0,boarded:!1}).current,M=qa({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.34,zoomMax:3.4,pitch0:.16,pitchMin:-.62,pitchMax:1.44});return b.useEffect(()=>{if(e==="helm")return r.x=Lo.x,r.z=Lo.z,r.heading=Math.PI,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.flank=0,r.deckY=0,r.snapCam=!0,M.yaw=0,M.smYaw=0,M.pitch=.16,M.smPitch=.16,M.pitch0=.16,M.zoom=1,M.smZoom=1,M.noRecentre=!1,M.pitchMin=-.62,M.pitchMax=1.44,r.swallowed=0,r.burst=1,r.burstFx=0,r.slam=0,r.drift=0,r.trim=0,r.bowY=ut(r.x,r.z,y.t,1).y,y.helm=null,Rn("helm"),()=>{y.helmActive=!1}},[e,r,M]),b.useEffect(()=>{if(e!=="foot")return;r.fvx=0,r.fvz=0,r.snapCam=!0,Y.chain!=="foot"&&Rn("foot"),Sc(g.weapon==="swords"?"sword":"rubber");const F=(S,R)=>{M.yaw=S,M.smYaw=S,M.pitch=R,M.smPitch=R,M.pitch0=0,M.noRecentre=!0,M.pitchMin=-1.28,M.pitchMax=1.28};r.fvy=0,r.airborne=!1,r.landing=0;const C=y.footSpawn;if(y.footSpawn="hall",C==="deck"){r.area="deck",r.dx=0,r.dz=-k*.2,r.fyaw=r.heading,F(r.heading+Math.PI,.24);return}if(C==="port"){r.area="island",r.fx=Q.x+40*N,r.fz=Q.z+40*N,r.fy=re(r.fx,r.fz)+$e,r.fyaw=Math.atan2(he.x-r.fx,he.z-r.fz),F(r.fyaw+Math.PI,-.06);return}if(C==="rear"){r.area="island",r.fx=U.gate.x+U.dir[0]*26,r.fz=U.gate.z+U.dir[1]*26,r.fy=re(r.fx,r.fz)+$e,r.fyaw=Math.atan2(-U.dir[0],-U.dir[1]),F(r.fyaw+Math.PI,.02);return}r.area="hall",r.fx=pe.x,r.fy=pe.y+Le.y,r.fz=pe.z+lt.zTop,r.fyaw=Math.PI,r.fpitch=-.05,F(0,.05)},[e,r,M]),ne((F,C)=>{if(e!=="helm"&&e!=="foot")return;const S=Math.min(C,.05);y.t+=S;const R=e==="helm",A=e==="foot"&&r.area==="deck";if(R||A){const B=r.heading,G=R?I.throttle:r.order,$=R?I.rudder:0;R&&(r.order=I.throttle),r.throttle+=(G-r.throttle)*(1-Math.pow(.02,S)),r.rudder+=($-r.rudder)*(1-Math.pow(.005,S)),r.flank+=((R&&I.boost?1:0)-r.flank)*(1-Math.pow(Tc,S));const q=Fo*(1+ea*r.flank),ee=Math.sin(r.heading),P=Math.cos(r.heading),K=Math.cos(r.heading),ae=-Math.sin(r.heading);let H=r.vx*ee+r.vz*P,te=r.vx*K+r.vz*ae;const we=1-y.shelter,Tt=r.throttle>=0?r.throttle*q:r.throttle*kc;H+=T.clamp(Tt-H,-qs*2.5,qs)*S,r.burst=Math.min(1,r.burst+S/Fc),R&&I.burstQueued&&(I.burstQueued=!1,r.burst>=.999&&(r.burst=0,r.burstFx=1,H+=Cc,y.splash+=1)),r.burstFx*=Math.pow(.2,S);const Ge=ut(r.x,r.z,y.t,1);H-=(Ge.dx*ee+Ge.dz*P)*Ic*we*S,H-=H*Math.abs(H)*Ec*S,te-=(te*Math.abs(te)*Rc+te*Ac)*S;const We=T.clamp(Math.abs(H)/16,0,1);H*=Math.pow(1-.11*Math.abs(r.rudder)*We,S),r.vx=ee*H+K*te,r.vz=P*H+ae*te,r.speed=H,r.drift+=(T.clamp(Math.abs(te)/11,0,1)-r.drift)*(1-Math.pow(.1,S)),r.heading+=r.rudder*zc*We*Math.sign(H||1)*S;const Ze=r.x+r.vx*S,yt=r.z+r.vz*S,W=k*Js,Re=Ze+ee*W,qe=yt+P*W;if($t(Re,qe)>.06)r.x=Ze,r.z=yt,r.aground+=(0-r.aground)*(1-Math.pow(.05,S));else{r.aground+=(1-r.aground)*(1-Math.pow(.02,S)),Ht(Math.abs(r.speed)*.0012*S*60,"AGROUND — SHE IS TAKING WATER");const Se=Math.pow(.06,S);r.speed*=Se,r.vx*=Se,r.vz*=Se;const st=6,Bt=$t(r.x+st,r.z)-$t(r.x-st,r.z),ro=$t(r.x,r.z+st)-$t(r.x,r.z-st),vt=Math.hypot(Bt,ro)||1;r.x+=Bt/vt*26*S,r.z+=ro/vt*26*S}const Ie=va(r.x,r.z,0);r.x+=Ie.vx*S,r.z+=Ie.vz*S,r.x+=ta.x*we*S,r.z+=ta.z*we*S;const He=Ge.dx*K+Ge.dz*ae;r.heading+=T.clamp(He*.4,-oa,oa)*we*S;let D=Ne[0],ue=1/0;for(const Se of Ne){const st=(r.x-Se.x)**2+(r.z-Se.z)**2;st<ue&&(ue=st,D=Se)}if(Ga(S,{danger:Ie.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:D.x-r.x,toCentreZ:D.z-r.z,speed:r.speed,throttle:r.throttle})>=1||Ie.danger>.94){const Se=D;r.x=Se.x+(Se.x>0?Se.r*1.85:-Se.r*1.85),r.z=Se.z+Se.r*1.5,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.heading=Math.PI,r.swallowed+=1,r.aground=1,Y.grip=0,Ht(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const _e=wo(r.x,r.z),Ye=T.lerp(1,.055,_e)*T.smoothstep($t(r.x,r.z),0,.3),Fe=ut(r.x,r.z,y.t,Ye);y.helmActive=!0,y.helmPos.set(r.x,Fe.y+k*.35,r.z),y.helmSpeed=T.clamp(Math.abs(r.speed)/Fo,0,1),y.ship.x=r.x,y.ship.y=Fe.y,y.ship.z=r.z,y.ship.heading=r.heading,y.ship.loa=k,y.ship.deckY=w?Nt(w,k):k*.16;const se=Ie.vx*Math.cos(r.heading)-Ie.vz*Math.sin(r.heading),X=T.clamp(Math.abs(r.speed)/Fo,0,1),fe=T.clamp(r.rudder*We*X*.4+se*.016,-.5,.5);r.heel+=(fe-te*.012-r.heel)*(1-Math.pow(.15,S));const Ve=k*Js,je=ut(r.x+ee*Ve,r.z+P*Ve,y.t,Ye).y,Oe=T.clamp((r.bowY-je)/Math.max(S,.001),0,60);r.bowY=je;const Ke=T.clamp((Oe-10)/24,0,1)*X*we;if(r.slam=Math.max(r.slam*Math.pow(.05,S),Ke),Ke>.25){const Se=Math.pow(1-.3*Ke,S);r.vx*=Se,r.vz*=Se}const Mo=X*.1*Math.sign(r.speed>=0?1:-1)+r.slam*.14+r.burstFx*.16;r.trim+=(Mo-r.trim)*(1-Math.pow(.1,S));const jo=T.clamp(X*we*1.15+r.aground*.5+Ie.danger*.8+r.slam*1.3+r.burstFx,0,1);r.spray+=(jo-r.spray)*(1-Math.pow(.08,S));const So=a.current;if(So&&(So.visible=!0,So.position.set(r.x,Fe.y,r.z),So.rotation.set(T.clamp(Fe.dz*1.2,-.3,.3)-r.trim,r.heading,T.clamp(-Fe.dx,-.26,.26)+r.heel)),f.current&&(f.current.scale.z=1+Math.sin(y.t*1.6)*.08+r.burstFx*.4,f.current.scale.x=1+we*.06+r.burstFx*.12),m.current&&(m.current.material.opacity=r.spray*.42,m.current.scale.setScalar(.7+r.spray*.55)),l.current&&(l.current.material.opacity=T.clamp(.34*X+r.burstFx*.3,0,.62)*(.28+we*.72),l.current.scale.set(1+X*.75+r.drift*.6,1,1+X*.5)),r.deckY+=(Fe.y-r.deckY)*(1-Math.pow(Pe(2e-4,.05),S)),R){Dn(M,S,r.heading-B);const Se=r.heading+Math.PI+M.smYaw,st=Math.cos(M.smPitch),Bt=Math.max(k*1.9,52)*M.smZoom*(1+X*Pe(.26,.1)+r.burstFx*Pe(.34,.12))*Na(s.aspect),ro=T.lerp(Fe.y,r.deckY,Me.comfort),vt=Po.set(r.x+Math.sin(Se)*st*Bt,ro+k*.26+Math.sin(M.smPitch)*Bt,r.z+Math.cos(Se)*st*Bt),or=ut(vt.x,vt.z,y.t,Ye);vt.y=Math.max(vt.y,or.y+6),r.snapCam?(r.snapCam=!1,s.position.copy(vt)):s.position.lerp(vt,1-Math.pow(Pe(6e-4,.02),S));const nr=Math.max(0,Math.cos(M.smYaw)),ts=X*Pe(66,34)*nr;s.lookAt(na.set(r.x+(ee+K*T.clamp(te/40,-.4,.4))*ts,ro+12-r.trim*26*X*Pe(1,.35),r.z+(P+ae*T.clamp(te/40,-.4,.4))*ts));const os=Pe(1,0);os>.001&&s.rotateZ((Math.sin(y.t*2.3)*.012*X+r.heel*.3+r.aground*Math.sin(y.t*21)*.02+r.slam*Math.sin(y.t*34)*.03+Ie.danger*Math.sin(y.t*2.7)*.03)*os),In(s,60+X*Pe(7,2)+r.burstFx*Pe(10,3),S,.06,Da)}const es=Math.hypot(r.x-(Q.x+60*N),r.z-(Q.z+60*N));es<90*N&&Math.abs(r.speed)<24&&(y.footSpawn="port",R?o?.("foot"):r.area==="deck"&&(r.area="island",r.fx=Q.x+40*N,r.fz=Q.z+40*N,r.fy=re(r.fx,r.fz)+$e,r.fvx=0,r.fvz=0,r.fvy=0,r.fyaw=Math.atan2(he.x-r.fx,he.z-r.fz),M.yaw=M.smYaw=r.fyaw+Math.PI)),I.boardQueued&&(I.boardQueued=!1,R?(y.footSpawn="deck",o?.("foot")):r.area==="deck"&&o?.("helm")),R&&(y.helm={speed:r.speed,heading:r.heading,throttle:r.throttle,aground:r.aground,x:r.x,z:r.z,toGate:Math.min(Math.hypot(r.x,r.z-Pt),Math.hypot(r.x,r.z-Jt)),underFire:[Pt,Jt].some(Se=>{const st=Math.hypot(r.x,r.z-Se);return st>Vo.safe&&st<Vo.range}),moored:es<180*N,maelstrom:Ie.danger,swallowed:r.swallowed,burst:r.burst,drift:r.drift,maxSpeed:q,cruise:zt.level,flank:r.flank,freeCam:Me.freeCam},La(S,y.helm)),y.shelter+=(_e-y.shelter)*(1-Math.pow(.06,S)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,S))}if(e==="foot"){Dn(M,S,0);const B=I.boost?sa:Pc;r.fpitch+=(-M.smPitch-r.fpitch)*(1-Math.pow(1e-4,S));const G=I.walk.x,$=I.walk.z,q=Math.hypot(G,$),ee=q>1?q:1,P=-Math.sin(M.smYaw),K=-Math.cos(M.smYaw),ae=-K,H=P,te=(P*($/ee)+ae*(G/ee))*B,we=(K*($/ee)+H*(G/ee))*B,Tt=(1-Math.pow(q>.02?2e-5:4e-7,S))*(r.airborne?.25:1);r.fvx+=(te-r.fvx)*Tt,r.fvz+=(we-r.fvz)*Tt;const Ge=r.fvx*S,We=r.fvz*S,Ze=r.area==="island"?(se,X)=>re(se,X):r.area==="deck"?()=>y.ship.y+y.ship.deckY:(se,X,fe)=>pe.y+ti(se-pe.x,X-pe.z,fe-pe.y),yt=r.area==="hall"?(se,X,fe)=>oi(se-pe.x,X-pe.z,fe-pe.y)||Zr(se,fe,X)>.97:()=>!1;if(r.area==="deck"){const se=Math.cos(-y.ship.heading),X=Math.sin(-y.ship.heading);r.dx+=Ge*se+We*-X,r.dz+=Ge*X+We*se;const fe=y.ship.loa*.14,Ve=y.ship.loa*.42;Math.abs(r.dx)>fe&&(r.dx=Math.sign(r.dx)*fe,r.fvx=0,r.fvz=0),Math.abs(r.dz)>Ve&&(r.dz=Math.sign(r.dz)*Ve,r.fvx=0,r.fvz=0);const je=Math.cos(y.ship.heading),Oe=Math.sin(y.ship.heading);r.fx=y.ship.x+r.dx*je+r.dz*Oe,r.fz=y.ship.z-r.dx*Oe+r.dz*je}else if(r.area==="island"){const se=r.fx+Ge,X=r.fz+We,fe=re(r.fx,r.fz),Ve=re(se,X),je=Math.hypot(Ge,We)||1e-6,Oe=(Ve-fe)/je;(Ve<=.3||Oe>=1.2&&Ve>=fe)&&(r.fvx=0,r.fvz=0),Ve>.3&&(Oe<1.2||Ve<fe)&&(r.fx=se,r.fz=X)}else{const se=r.fx+Ge,X=r.fz+We,fe=r.fy-$e,Ve=Ze(r.fx,r.fz,fe),je=r.airborne?fe:Ve;Ze(se,X,je)-je>aa||yt(se,X,fe)?(r.fvx=0,r.fvz=0):(r.fx=se,r.fz=X)}const W=r.fy-$e,Re=Ze(r.fx,r.fz,W);if(r.airborne?(r.fvy-=Lc*S,r.fy+=r.fvy*S,r.fy-$e<=Re&&(r.landing=-r.fvy,r.fy=Re+$e,r.fvy=0,r.airborne=!1,r.landing>ra&&(Ht((r.landing-ra)*Oc,"A LONG WAY DOWN"),Ue.roll=0))):W-Re>aa?(r.airborne=!0,r.fvy=0):(r.fy+=(Re+$e-r.fy)*(1-Math.pow(.002,S)),r.landing=Math.max(0,r.landing-S*40),I.jumpQueued&&(I.jumpQueued=!1,r.fvy=Gc,r.airborne=!0)),I.jumpQueued=!1,r.area==="island"){const se=Math.hypot(r.fx-he.x,r.fz-he.z),X=Math.hypot(r.fx-U.gate.x,r.fz-U.gate.z);se<80?(r.area="hall",r.fx=pe.x,r.fz=pe.z+lt.zTop,r.fy=pe.y+Le.y+$e,r.fvy=0,r.airborne=!1,r.fyaw=Math.PI,M.yaw=M.smYaw=0,M.pitch=M.smPitch=.05):X<40&&(r.area="hall",r.fx=pe.x+60,r.fz=pe.z+O.z+150,r.fy=pe.y+$e,r.fvy=0,r.airborne=!1,r.fyaw=0,M.yaw=M.smYaw=Math.PI,M.pitch=M.smPitch=.04),y.helm={onFoot:!0,area:"island",x:r.fx,z:r.fz,fy:r.fy-pe.y,toMouth:se,toRear:X,nearPort:Math.hypot(r.fx-Q.x,r.fz-Q.z)<Q.r*1.4};const fe=wo(r.fx,r.fz);y.shelter+=(fe-y.shelter)*(1-Math.pow(.06,S))}else if(r.area==="deck")y.helm={onFoot:!0,area:"deck",x:r.fx,z:r.fz,speed:r.speed,heading:r.heading,throttle:r.throttle,maxSpeed:Fo*(1+ea*r.flank),moored:!1};else{const se=r.fz-pe.z;se>Le.z+34&&(r.area="island",r.fx=he.x,r.fz=he.z+130,r.fy=re(r.fx,r.fz)+$e,r.fvy=0,r.airborne=!1,r.fyaw=0,M.yaw=M.smYaw=Math.PI,M.pitch=M.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:r.fx,z:r.fz,lz:se,fy:r.fy-pe.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,S))}const qe=Math.hypot(r.fvx,r.fvz);r.stride+=qe*S;const nt=g.height??1.74;if(qe>.4){let X=Math.atan2(r.fvx,r.fvz)-r.fyaw;for(;X>Math.PI;)X-=Math.PI*2;for(;X<-Math.PI;)X+=Math.PI*2;r.fyaw+=X*(1-Math.pow(4e-4,S))}r.fpitch+=(-M.smPitch-r.fpitch)*(1-Math.pow(1e-4,S)),r.pace=qe,d.current.speed=qe,d.current.maxSpeed=sa,d.current.grounded=!r.airborne,d.current.vy=r.fvy,d.current.landing=r.landing,Ue.playerTurn=(r.fyaw-r.fyaw0)/Math.max(S,1e-4),r.fyaw0=r.fyaw,h.x=r.fx,h.y=r.fy-$e,h.z=r.fz,h.yaw=M.smYaw+Math.PI,h.pitch=M.smPitch,h.height=nt,h.floorY=r.area==="hall"?r.fy-$e:null,jc(S,h,I,p),(p.x||p.z)&&(r.fvx+=p.x,r.fvz+=p.z);const Ie=(r.area==="deck"?Math.max(nt*2.6,y.ship.loa*.34):nt*2.6)*M.smZoom,He=Math.cos(M.smPitch),D=r.area==="deck"?T.lerp(r.fy,r.deckY+y.ship.deckY+$e,Me.comfort):r.fy,ue=D+Math.sin(r.stride*1.6)*.05*Pe(1,.3),Je=r.fx+Math.sin(M.smYaw)*He*Ie,_e=r.fz+Math.cos(M.smYaw)*He*Ie;let Ye=ue+nt*.28+Math.sin(M.smPitch)*Ie;const Fe=r.area==="island"?re(Je,_e):D-$e;Ye=Math.max(Ye,Fe+nt*.6),Po.set(Je,Ye,_e),r.snapCam?(r.snapCam=!1,s.position.copy(Po)):s.position.lerp(Po,1-Math.pow(Pe(9e-4,.02),S)),s.lookAt(na.set(r.fx,ue-nt*.1,r.fz)),In(s,r.area==="hall"?72:64,S,.02),c.current&&(c.current.position.set(r.fx,r.fy-$e,r.fz),c.current.rotation.y=r.fyaw),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,S))}y.fog=T.lerp(Ft.sea,Ft.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:c,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(gr,{character:g,motion:d})}),t.jsxs("group",{ref:a,position:[0,-4e3,0],visible:e==="helm",children:[v&&t.jsx(ge,{name:w,loa:k,slim:nn(w),sink:vo(w),rotation:en(w),tint:Kn(w,"#c98a52"),emissive:"#3a2a18",emissiveIntensity:.24}),v&&z&&_o.slice(0,2).map(([F,C,S],R)=>t.jsx(ge,{name:"crew-straw.opt.glb",height:tn,rotation:S,position:[F*k,Nt(w,k),C*k]},`crew-${R}`)),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!v,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!v,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!v,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!v,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!v,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!v,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:f,position:[0,17.5,1.5],visible:!v,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:De,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!v,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(F=>t.jsxs("mesh",{position:[F*k*.085,(v?Nt(w,k):8)+k*.045,-k*.19],children:[t.jsx("sphereGeometry",{args:[k*.019,8,6]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:3.4,toneMapped:!1})]},F)),t.jsx(yo,{crew:"straw",width:v?k*.24:14,position:[0,v?sn(w,k)*.88:26,-k*.06]}),t.jsxs("mesh",{ref:l,position:[0,.6,-k*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[k*.6,k*2.2]}),t.jsx("meshBasicMaterial",{map:kn,color:Z.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:m,position:[0,k*.12,k*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[k*.85,k*.6]}),t.jsx("meshBasicMaterial",{map:Li,color:Z.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:wt})]})]})]})}const ia=76,Nc=24,la=26,Hc=1.15,_c=.44,Bc=.05,Uc=.22,Wc=70,Go=340,ca=7,Yc=6,ha=60,Oo=185,Vc=new j,da=new j,Do={x:430*N,z:1e3*N};function $c({mode:e,onMode:o}){const n=be(x=>x.camera),s=be(x=>x.gl),i=b.useRef(),a=b.useRef(),c=b.useRef(),d=ot("ship-tang.opt.glb"),h=ot("ship-sub.opt.glb"),p=d||h,g=ot("crew-heart.opt.glb"),f=d?"ship-tang.opt.glb":"ship-sub.opt.glb",m=on(f,28),l=b.useRef({x:Do.x,z:Do.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,u=qa({enabled:e==="sub",dom:s.domElement,zoomMin:.42,zoomMax:2.3,pitch0:.22,pitchMin:-1,pitchMax:1.42});return b.useEffect(()=>{if(e==="sub")return l.x=Do.x,l.z=Do.z,l.heading=Math.PI,l.speed=0,l.throttle=0,l.flank=0,l.depth=4,l.orderedDepth=4,l.berthing=0,l.snapCam=!0,u.yaw=0,u.smYaw=0,u.pitch=.22,u.smPitch=.22,u.pitch0=.22,u.zoom=1,u.smZoom=1,u.noRecentre=!1,l.heel=0,y.subActive=!0,y.helm=null,Rn("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,l,u]),ne((x,v)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const w=Math.min(v,.05);y.t+=w;const k=l.heading,z=I.boost;l.throttle+=(I.throttle-l.throttle)*(1-Math.pow(.02,w)),l.flank+=((z?1:0)-l.flank)*(1-Math.pow(Bc,w)),y.subThrottle=Math.abs(l.throttle),l.rudder+=(I.rudder-l.rudder)*(1-Math.pow(8e-4,w));const r=T.clamp(l.depth/15,0,1),M=ia*(.7+.3*r)*(1+_c*l.flank),F=l.throttle>=0?l.throttle*M:l.throttle*Nc;l.speed+=T.clamp(F-l.speed,-la*2,la)*w,l.speed-=l.speed*Math.abs(l.speed)*.0016*w;const C=T.lerp(Uc,1,T.clamp(Math.abs(l.speed)/7,0,1));l.heading+=l.rudder*Hc*C*Math.sign(l.speed>=0?1:-1)*w,l.orderedDepth-=I.planes*Wc*w,l.orderedDepth=T.clamp(l.orderedDepth,0,Go),I.surfaceQueued&&(I.surfaceQueued=!1,l.orderedDepth=0),I.periscopeQueued&&(I.periscopeQueued=!1,l.orderedDepth=Yc);const S=l.x+Math.sin(l.heading)*l.speed*w,R=l.z+Math.cos(l.heading)*l.speed*w,A=va(S,R,l.depth);l.x=S+A.vx*w,l.z=R+A.vz*w;const B=A.vx*Math.cos(l.heading)-A.vz*Math.sin(l.heading);l.heading+=B*.008*w;const G=T.clamp(Math.abs(l.speed)/ia,0,1),$=T.clamp(B*.02+l.rudder*C*G*.34,-.6,.6);l.heel+=($-l.heel)*(1-Math.pow(.12,w)),A.danger>.05&&(l.speed*=Math.pow(1-.22*A.danger,w));const q=re(l.x,l.z),ee=Math.max(2,-q-ca),P=l.depth<1.5;l.depth+=(l.orderedDepth-l.depth)*(1-Math.pow(.12,w)),l.depth>ee?(l.scrape+=(1-l.scrape)*(1-Math.pow(.02,w)),l.depth=ee,l.orderedDepth=Math.min(l.orderedDepth,ee-2),Ht(Math.abs(l.speed)*.0016*w*60,"GROUNDED ON THE SHELF"),l.speed*=Math.pow(.3,w)):l.scrape+=(0-l.scrape)*(1-Math.pow(.05,w));const K=(l.depth-Oo)/(Go-Oo);l.stress=K>0?Math.min(1,K*K):0,l.stress>0&&Ht(l.stress*.06*w,"HULL UNDER PRESSURE — COME UP");const ae=l.x+Math.sin(l.heading)*26,H=l.z+Math.cos(l.heading)*26;if(re(ae,H)>-l.depth+ca*.5){l.speed*=Math.pow(.1,w);const Oe=6,Ke=re(l.x+Oe,l.z)-re(l.x-Oe,l.z),Mo=re(l.x,l.z+Oe)-re(l.x,l.z-Oe),jo=Math.hypot(Ke,Mo)||1;l.x-=Ke/jo*20*w,l.z-=Mo/jo*20*w,l.scrape=Math.max(l.scrape,.5)}const we=Math.hypot(l.x-U.x,l.z-U.z);if(we<U.pool*1.1&&l.berthing===0&&(l.berthing=1e-4),l.berthing>0){l.berthing=Math.min(1,l.berthing+w*.5),l.x+=(U.berth.x-l.x)*(1-Math.pow(.1,w)),l.z+=(U.berth.z-l.z)*(1-Math.pow(.1,w)),l.orderedDepth=0,l.speed*=Math.pow(.1,w);let Ke=Math.atan2(U.dir[0],U.dir[1])+Math.PI-l.heading;for(;Ke>Math.PI;)Ke-=Math.PI*2;for(;Ke<-Math.PI;)Ke+=Math.PI*2;l.heading+=Ke*(1-Math.pow(.2,w)),l.berthing>=1&&l.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}l.depth<1.5!==P&&(y.splash+=1);const Ge=ut(l.x,l.z,y.t,1),We=1-T.clamp(l.depth/10,0,1),Ze=-l.depth+Ge.y*We,yt=T.clamp((l.orderedDepth-l.depth)*.05,-.34,.34)*Math.sign(l.speed>=0?1:-1)+Ge.dz*.8*We;l.pitch+=(yt-l.pitch)*(1-Math.pow(.05,w));const W=i.current;W&&(W.position.set(l.x,Ze,l.z),W.rotation.set(l.pitch+l.scrape*Math.sin(y.t*23)*.02,l.heading,-Ge.dx*.5*We+l.heel)),a.current&&(a.current.rotation.z+=l.throttle*9*w),c.current&&(c.current.visible=l.depth<2.5),y.subPos.set(l.x,Ze,l.z),Dn(u,w,l.heading-k);const Re=l.heading+Math.PI+u.smYaw,qe=Math.cos(u.smPitch),nt=T.clamp(l.depth/240,0,1),Ie=Math.max(m*2.6,60)*u.smZoom*(1-nt*.2)*Na(n.aspect),He=Vc.set(l.x+Math.sin(Re)*qe*Ie,Ze+m*.2+Math.sin(u.smPitch)*Ie,l.z+Math.cos(Re)*qe*Ie),D=re(He.x,He.z);He.y=Math.max(He.y,D+5),l.depth>10&&(He.y=Math.min(He.y,Ge.y-3)),l.snapCam?(l.snapCam=!1,n.position.copy(He)):n.position.lerp(He,1-Math.pow(Pe(8e-4,.02),w));const ue=Math.max(0,Math.cos(u.smYaw)),Je=G*Pe(46,26)*ue;da.set(l.x+Math.sin(l.heading)*Je,Ze+6-l.pitch*30*G*Pe(1,.35),l.z+Math.cos(l.heading)*Je),n.lookAt(da);const _e=Pe(1,0);_e>.001&&n.rotateZ((l.scrape*Math.sin(y.t*19)*.015+l.heel*.35+A.danger*Math.sin(y.t*3.1)*.02)*_e),In(n,64+G*Pe(6,2)+l.flank*Pe(2,.6),w,.06,Da);const Ye=ut(n.position.x,n.position.z,y.t,1),Fe=T.clamp((Ye.y-n.position.y-1)/3,0,1);y.underwater+=(Fe-y.underwater)*(1-Math.pow(.002,w)),y.depthBelow=Math.max(0,Ye.y-n.position.y);const se=T.lerp(8200,1700,y.underwater);Math.abs(n.far-se)>20&&(n.far=se,n.updateProjectionMatrix()),y.shelter+=((we<U.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,w));let X=Ne[0],fe=1/0;for(const Oe of Ne){const Ke=(l.x-Oe.x)**2+(l.z-Oe.z)**2;Ke<fe&&(fe=Ke,X=Oe)}Ga(w,{danger:A.danger,headingX:Math.sin(l.heading),headingZ:Math.cos(l.heading),toCentreX:X.x-l.x,toCentreZ:X.z-l.z,speed:l.speed,throttle:l.throttle})>=1&&(Ht(.22,"CAUGHT IN THE VORTEX"),l.x=X.x+(l.x>X.x?1:-1)*X.r*1.9,l.z=X.z+X.r*1.5,l.speed=0,l.orderedDepth=Math.min(Go,l.depth+18),Y.grip=0,y.splash+=1);let je=Math.atan2(U.x-l.x,U.z-l.z)-l.heading;for(;je>Math.PI;)je-=Math.PI*2;for(;je<-Math.PI;)je+=Math.PI*2;y.helm={sub:!0,speed:l.speed,maxSpeed:M,heading:l.heading,depth:l.depth,orderedDepth:l.orderedDepth,scrape:l.scrape,stress:l.stress,maelstrom:A.danger,toRear:we,relRear:je,berthing:l.berthing>0,x:l.x,z:l.z,maxDepth:Go,crushDepth:Oo,cruise:zt.level,flank:l.flank,freeCam:Me.freeCam,dark:T.clamp((l.depth-ha)/(Oo-ha),0,1)},La(w,y.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[p&&t.jsx(ge,{name:f,loa:m,slim:nn(f),sink:vo(f),rotation:en(f),tint:Kn(f,"#c9b445"),emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:c,position:[0,Nt(f,m),-m*.07],children:[g&&t.jsx(ge,{name:"crew-heart.opt.glb",height:tn,rotation:0}),t.jsx(yo,{crew:"heart",width:m*.26,position:[0,sn(f,m)*.55,-m*.2]})]}),t.jsxs("group",{visible:!p,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(x=>[0,1,2,3].map(v=>t.jsxs("mesh",{position:[x*5.1,1.2,8-v*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${x}-${v}`)))]}),t.jsxs("mesh",{position:[0,m*.02,m*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,m*.02,m*.6],scale:[m*.9,m*.9,1],children:t.jsx("spriteMaterial",{map:Kc,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:wt})}),t.jsxs("mesh",{position:[0,m*.24,-m*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:a,position:[0,m*.012,-m*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(Zc,{})]})}const Kc=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,0.9)"),s.addColorStop(.4,"rgba(255,255,255,0.28)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e);const i=new no(o);return i.colorSpace=so,i})(),Xc=`
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
`,Qc=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function Zc(){const e=b.useRef(),o=b.useMemo(()=>{const i=new Float32Array(780),a=new Float32Array(260),c=new Float32Array(260),d=new Float32Array(260);for(let p=0;p<260;p++)i[p*3]=(Math.random()-.5)*3.4,i[p*3+1]=(Math.random()-.5)*2.6,i[p*3+2]=-14-Math.random()*4,a[p]=Math.random(),c[p]=.25+Math.random()*.3,d[p]=2+Math.random()*4;const h=new Lt;return h.setAttribute("position",new oe(i,3)),h.setAttribute("aPhase",new oe(a,1)),h.setAttribute("aRate",new oe(c,1)),h.setAttribute("aSize",new oe(d,1)),h.boundingSphere=new ao(new j(0,0,-30),70),h},[]),n=b.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new j(...ie(Z.underGlow))}}),[]);return ne((s,i)=>{const a=e.current?.uniforms;if(!a)return;a.uTime.value+=i;const c=y.subActive?y.subThrottle*y.underwater:0;a.uGain.value+=(c-a.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:Xc,fragmentShader:Qc,uniforms:n,transparent:!0,depthWrite:!1,blending:wt,fog:!1})})}const Ja=.42;let _=null,kt=null,ye=null,Nn=!1,bt=!0;function qc(){try{const e=localStorage.getItem("oni.audio");e!==null&&(bt=e==="1")}catch{}return bt}function gn(e){bt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return kt&&_&&kt.gain.setTargetAtTime(e?Ja:0,_.currentTime,.12),e&&_?.state==="suspended"&&_.resume(),bt}function Jc(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),s=n.getChannelData(0);for(let i=0;i<o;i++)s[i]=Math.random()*2-1;return n}function uo(e,o,n,s,i,a,c){const d=e.createBufferSource();d.buffer=o,d.loop=!0;const h=e.createBiquadFilter();h.type=n,h.frequency.value=s,h.Q.value=i;const p=e.createGain();return p.gain.value=a,d.connect(h).connect(p).connect(c),d.start(),{src:d,filt:h,gain:p}}function xn(){if(Nn){_?.state==="suspended"&&_.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;_=new e,Nn=!0,kt=_.createGain(),kt.gain.value=bt?Ja:0;const o=_.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=_.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,kt.connect(n).connect(o).connect(_.destination);const s=Jc(_),i=_.createGain();i.gain.value=1,i.connect(kt);const a=uo(_,s,"bandpass",480,.7,.3,i),c=uo(_,s,"highpass",1900,.5,0,i),d=uo(_,s,"lowpass",220,1.1,.22,i),h=uo(_,s,"lowpass",96,1.6,0,i),p=_.createGain();p.gain.value=1,p.connect(o);const g=_.createOscillator();g.type="sawtooth",g.frequency.value=41;const f=_.createBiquadFilter();f.type="lowpass",f.frequency.value=190,f.Q.value=1.2;const m=_.createGain();m.gain.value=0,g.connect(f).connect(m).connect(p),g.start();const l=_.createOscillator(),u=_.createOscillator(),x=_.createGain();l.frequency.value=.07,u.frequency.value=.113,x.gain.value=260,l.connect(x),u.connect(x),x.connect(a.filt.frequency),l.start(),u.start();const v=_.createGain();v.gain.value=0,v.connect(kt);const w=_.createGain();w.gain.value=.16,w.connect(v);for(const[z,r]of[[146.83,1],[220,.5],[293.66,.3]]){const M=_.createOscillator();M.type="sine",M.frequency.value=z;const F=_.createGain();F.gain.value=r;const C=_.createOscillator(),S=_.createGain();C.frequency.value=.21+Math.random()*.1,S.gain.value=z*.004,C.connect(S).connect(M.frequency),C.start(),M.connect(F).connect(w),M.start()}const k=uo(_,s,"bandpass",900,3.2,.05,v);return ye={stormBus:i,festBus:v,wind:a,rain:c,sea:d,roar:h,breath:k,buf:s,comp:o,muffle:n,humGain:m,subBus:p},_}function e0(){if(!_||!ye||!bt)return;const e=_.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const s=_.createOscillator(),i=_.createGain();s.type="sine",s.frequency.setValueAtTime(1420,e+o),s.frequency.exponentialRampToValueAtTime(1180,e+o+.5),i.gain.setValueAtTime(0,e+o),i.gain.linearRampToValueAtTime(n,e+o+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),s.connect(i).connect(ye.subBus),s.start(e+o),s.stop(e+o+1.5)}}function t0(e=1){if(!_||!ye||!bt)return;const o=_.currentTime,n=_.createBufferSource();n.buffer=ye.buf;const s=_.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(1500,o),s.frequency.exponentialRampToValueAtTime(240,o+.5),s.Q.value=.7;const i=_.createGain();i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(.5*e,o+.02),i.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(s).connect(i).connect(kt),n.start(o),n.stop(o+.9)}function Kt(e,o=1,n=82){if(!_||!ye)return;const s=_.createOscillator(),i=_.createGain();s.type="sine",s.frequency.setValueAtTime(n*2.1,e),s.frequency.exponentialRampToValueAtTime(n,e+.06),s.frequency.exponentialRampToValueAtTime(n*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(o,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),s.connect(i).connect(ye.festBus),s.start(e),s.stop(e+.7);const a=_.createBufferSource();a.buffer=ye.buf;const c=_.createBiquadFilter();c.type="bandpass",c.frequency.value=1400,c.Q.value=.8;const d=_.createGain();d.gain.setValueAtTime(o*.5,e),d.gain.exponentialRampToValueAtTime(1e-4,e+.09),a.connect(c).connect(d).connect(ye.festBus),a.start(e),a.stop(e+.12)}function o0(e=1,o=0){if(!_||!ye||!bt)return;const n=_.currentTime+o,s=_.createBufferSource();s.buffer=ye.buf,s.loop=!0;const i=_.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,n),i.frequency.exponentialRampToValueAtTime(70,n+2.6),i.Q.value=.9;const a=_.createGain(),c=.5*e;a.gain.setValueAtTime(0,n),a.gain.linearRampToValueAtTime(c,n+.05),a.gain.exponentialRampToValueAtTime(c*.24,n+.7),a.gain.exponentialRampToValueAtTime(c*.42,n+1.35),a.gain.exponentialRampToValueAtTime(1e-4,n+3.4),s.connect(i).connect(a).connect(ye.stormBus),s.start(n),s.stop(n+3.6);const d=_.createOscillator(),h=_.createGain();d.type="sine",d.frequency.setValueAtTime(46,n),d.frequency.exponentialRampToValueAtTime(28,n+2.2),h.gain.setValueAtTime(0,n),h.gain.linearRampToValueAtTime(.32*e,n+.08),h.gain.exponentialRampToValueAtTime(1e-4,n+2.6),d.connect(h).connect(ye.stormBus),d.start(n),d.stop(n+2.8)}function n0(e=.5){if(!_||!ye||!bt)return;const o=_.currentTime;for(const[n,s,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const a=_.createOscillator(),c=_.createGain();a.type="sine",a.frequency.value=61*n,c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(e*s,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+i),a.connect(c).connect(kt),a.start(o),a.stop(o+i+.1)}}let dt=0,bn=0,ua=0,po=0;function s0(e){if(!Nn||!_||!ye||!bt)return;const o=_.currentTime,n=e.shelter,s=e.underwater,i=e.subActive?.12:1,a=Math.sin(n*Math.PI*.5)*i*(1-s*.92);ye.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),ye.festBus.gain.setTargetAtTime(a,o,.35),ye.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),ye.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),ye.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),ye.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-s*.55),o,.3),ye.muffle.frequency.setTargetAtTime(18e3-s*17400,o,.18);const c=e.subActive?s*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(ye.humGain.gain.setTargetAtTime(c,o,.25),e.splash!==ua&&(ua=e.splash,t0(1)),e.subActive&&s>.5?po===0?po=o+1.2:o>=po&&(e0(),po=o+6.5):po=0,n>.06){const h=.9090909090909091;for(dt<o&&(dt=o+.1);dt<o+.35;){const p=bn%8,g=n*.9;p===0?Kt(dt,.85*g,74):p===2?Kt(dt,.45*g,88):p===4?Kt(dt,.7*g,74):p===6?Kt(dt,.4*g,92):p===7&&(Kt(dt,.3*g,96),Kt(dt+h*.5,.36*g,96)),bn++,dt+=h}}else dt=0,bn=0}function a0(){const e=b.useRef(!1),o=b.useRef(-1);return ne(()=>{if(s0(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,s=500+Math.abs(n.z)*900;o0(Math.min(1,.55+y.flash*.6),s/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&n0(.55),o.current=y.shot)}),null}function r0({mode:e}){return y.mode=e,ne(()=>Al(),-100),null}function i0(){const e=be(i=>i.gl),o=be(i=>i.camera),n=be(i=>i.setSize),s=be(i=>i.size);return b.useEffect(()=>{const i=()=>{const a=window.innerWidth,c=window.innerHeight;a<2||c<2||s.width>a*.5&&s.height>c*.5||(n(a,c),e.setSize(a,c,!1),o.aspect=a/c,o.updateProjectionMatrix())};return i(),window.addEventListener("resize",i),document.addEventListener("visibilitychange",i),()=>{window.removeEventListener("resize",i),document.removeEventListener("visibilitychange",i)}},[e,o,n,s.width,s.height]),null}function l0({every:e=12}){const o=be(s=>s.gl),n=b.useRef(0);return b.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),ne(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function c0({budget:e}){const o=be(s=>s.setDpr),n=b.useRef(e.dpr[1]);return t.jsx(rr,{bounds:s=>s>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function h0(){const e=be(s=>s.gl),o=be(s=>s.scene),n=be(s=>s.camera);return b.useEffect(()=>{const s=setTimeout(()=>{try{e.compile(o,n)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(s)},[e,o,n]),null}function d0(){const{camera:e,scene:o,gl:n}=be();return b.useEffect(()=>{},[e,o,n]),null}const u0=new ve(Z.haze),p0=new ve(Z.underHaze),f0=new ve(Z.abyss),pa=new ve;function m0(){const e=be(o=>o.scene);return ne(()=>{if(!e.fog)return;const o=T.clamp(y.depthBelow/Ft.deepGrade,0,1),n=T.lerp(.0062,.0142,o);e.fog.density=T.lerp(y.fog,n,y.underwater),pa.copy(p0).lerp(f0,o*.8),e.fog.color.lerpColors(u0,pa,y.underwater)}),null}function g0({quality:e,budget:o,onRails:n,playing:s,speed:i,onShot:a,mode:c,onMode:d,crew:h}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[Z.haze]}),t.jsx("fogExp2",{attach:"fog",args:[Z.haze,y.fog]}),t.jsx(jr,{storm:y}),t.jsx($i,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(Xr,{quality:e,segments:o.segments}),t.jsx(Ur,{quality:e,storm:y}),t.jsx(pi,{quality:e,shadows:o.shadows}),t.jsx(us,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(us,{quality:e,shadows:!1,z:Jt,k:N*1.5}),t.jsx(bi,{quality:e,shadows:o.shadows}),t.jsx(yi,{quality:e,shadows:o.shadows}),t.jsx(_i,{quality:e}),t.jsx(Wi,{shadows:o.shadows}),t.jsx(oc,{quality:e,shadows:o.shadows}),t.jsx(tl,{quality:e}),t.jsx(al,{quality:e}),t.jsx(ul,{quality:e}),t.jsx(Ml,{quality:e}),t.jsx(Ol,{onRails:n&&c==="off",playing:s&&c==="off",speed:i,onShot:a,idle:c!=="off"}),t.jsx(r0,{mode:c}),t.jsx(xr,{}),t.jsx(br,{}),t.jsx(wr,{}),t.jsx(Dc,{mode:c,onMode:d,crew:h}),t.jsx($c,{mode:c,onMode:d}),t.jsx(a0,{}),t.jsx(i0,{}),t.jsx(m0,{}),t.jsx(d0,{}),t.jsx(h0,{}),t.jsx(c0,{budget:o}),o.shadows&&t.jsx(l0,{every:o.shadowEvery})]})}const fo="#d63420",x0="rgba(8,6,16,0.72)",fa="(max-width: 860px), (max-height: 520px)",wn="min(7.5vh, 62px)";function b0(e=2600,o=!0){const[n,s]=b.useState(!1);return b.useEffect(()=>{if(!o){s(!1);return}let i;const a=()=>{s(!1),clearTimeout(i),i=setTimeout(()=>s(!0),e)};a();for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(c,a,{passive:!0});return()=>{clearTimeout(i);for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(c,a)}},[e,o]),n}function w0(){const[e,o]=b.useState(()=>typeof window<"u"&&window.matchMedia(fa).matches);return b.useEffect(()=>{const n=window.matchMedia(fa),s=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",s):n.addListener(s),()=>{n.removeEventListener?n.removeEventListener("change",s):n.removeListener(s)}},[]),e}function at({on:e,onClick:o,children:n,title:s,wide:i,block:a}){return t.jsx("button",{onClick:o,title:s,style:{appearance:"none",border:`1px solid ${e?fo:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||a?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:a?"100%":void 0,textAlign:a?"right":"center",minHeight:32},children:n})}function y0({shot:e,shotIndex:o,shotCount:n,total:s,playing:i,onRails:a,speed:c,tier:d,override:h,dev:p,onPlay:g,onRailsToggle:f,onSpeed:m,onQuality:l,onRestart:u,audio:x,onAudio:v,mode:w,onMode:k,crew:z,onCrew:r,stage:M,veiled:F=!1}){const C=w!=="off",S=w0(),[R,A]=b.useState(!1),[B,G]=b.useState(()=>({...Me}));b.useEffect(()=>Ba(W=>G({...W})),[]);const $=b0(2600,!C&&!R),q=b.useRef(),ee=b.useRef(),P=b.useRef(),K=b.useRef(),ae=b.useRef(),H=b.useRef(),te=a&&!C;b.useEffect(()=>A(!1),[w]),b.useEffect(()=>{let W,Re=performance.now(),qe=0,nt=0;const Ie=He=>{if(W=requestAnimationFrame(Ie),q.current&&(q.current.style.transform=`scaleX(${M.progress||0})`),P.current&&M.helm){const D=M.helm;if(D.onFoot)P.current.textContent=D.area==="deck"?`ON DECK · ${Math.round(Math.abs(D.speed)*1.94)} KN · BRG ${String(Math.round((D.heading*180/Math.PI+360)%360)).padStart(3,"0")}°   —  nobody is at the wheel`:D.area==="island"?D.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":D.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(D.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(D.sub){const ue=Math.abs(D.speed)*1.94;if(D.berthing)P.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Je=D.maelstrom>.22?D.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":D.stress>.02?"⚠ HULL UNDER PRESSURE":D.scrape>.3?"HULL ON THE ROCK":"",_e=Math.abs(D.relRear*180/Math.PI),Ye=_e<6?"· ON COURSE":D.relRear>0?`◀ ${_e.toFixed(0)}°`:`${_e.toFixed(0)}° ▶`,Fe=10,se=Math.round(D.depth/D.maxDepth*Fe),X=Math.round(D.crushDepth/D.maxDepth*Fe);let fe="";for(let je=0;je<Fe;je++)fe+=je<se?je>=X?"▓":"█":je===X?"┃":"·";const Ve=D.cruise===2?" ⟲FLK":D.cruise===1?" ⟲AHD":"";P.current.textContent=`DEPTH ${D.depth.toFixed(0).padStart(3,"0")}/${D.orderedDepth.toFixed(0).padStart(3,"0")}m ${fe}  ${ue.toFixed(0).padStart(2,"0")} KN${Ve}
COVE ${Math.round(D.toRear)}m  ${Ye}`+(Je?`
${Je}`:"")}}else{const ue=Math.abs(D.speed)*1.94,Je=(D.heading*180/Math.PI+180)%360,_e=Math.round((D.burst??0)*5),Ye=D.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(_e)}${"·".repeat(5-_e)}`,Fe=D.cruise===2?"  ⟲FLANK":D.cruise===1?"  ⟲AHEAD":D.flank>.5?"  FLANK":"";P.current.textContent=`${ue.toFixed(0).padStart(2,"0")} KN   BRG ${Je.toFixed(0).padStart(3,"0")}°   ${Ye}${Fe}
`+(D.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":D.moored?"MOORING":D.aground>.3?"AGROUND — HELM OVER":D.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(D.toGate)}m`:D.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(D.toGate)}m`:`GATE ${Math.round(D.toGate)}m`)}}if(K.current){const D=il(),ue=rl(Y.chain);K.current.textContent=Y.done?"✔ OBJECTIVE COMPLETE":D?`▸ ${Y.step+1}/${ue}  ${D.text}`:"",K.current.style.color=Y.done?"#8fe0a0":"#ffd9cf"}if(ae.current){const D=Math.max(0,Math.min(1,Y.hull)),ue=Math.max(0,Math.min(1,Y.grip)),Je=Fe=>{const se=Math.round(Fe*12);return"█".repeat(se)+"·".repeat(12-se)},_e=D>.6?"#8fe0a0":D>.3?"#ffc46b":"#ff6b5a",Ye=ue>.66?"#ff6b5a":ue>.33?"#ffc46b":"rgba(255,255,255,0.45)";ae.current.innerHTML=`<span style="color:${_e}">HULL ${Je(D)}</span>`+(ue>.02?`<span style="color:${Ye};margin-left:14px">VORTEX ${Je(ue)}</span>`:"")}if(H.current){const D=Y.banner,ue=H.current;D?(ue.dataset.text!==D.text&&(ue.dataset.text=D.text,ue.innerHTML=`<div class="og-banner-main">${D.text}</div>`+(D.sub?`<div class="og-banner-sub">${D.sub}</div>`:""),ue.style.animation="none",ue.offsetWidth,ue.style.animation=""),ue.style.opacity="1"):(ue.style.opacity="0",ue.dataset.text="")}p&&ee.current?(nt++,qe+=He-Re,Re=He,qe>400&&(ee.current.textContent=`${Math.round(nt*1e3/qe)} fps · shelter ${M.shelter.toFixed(2)} · fog ${(M.fog*1e4).toFixed(1)}e-4 · flash ${M.flash.toFixed(2)}`,qe=0,nt=0)):Re=He};return W=requestAnimationFrame(Ie),()=>cancelAnimationFrame(W)},[M,p]);const we={opacity:$?.16:1,transform:$?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},Tt=[{key:"rails",on:!a,label:a?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:f,cinematicOnly:!0},{key:"helm",on:w==="helm",label:w==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>k(w==="helm"?"off":"helm")},{key:"deck",on:!1,label:"WALK THE DECK",title:"Step back from the wheel and walk the deck as your pirate — she sails on",click:()=>{M.footSpawn="deck",k("foot")},helmOnly:!0},{key:"sub",on:w==="sub",label:w==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>k(w==="sub"?"off":"sub")},{key:"foot",on:w==="foot",label:w==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>k(w==="foot"?"off":"foot")}],Ge=W=>w==="foot"?t.jsx(at,{on:!0,wide:!0,block:W,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>r?.(z==="zoro"?"luffy":"zoro"),children:z==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,We=(W,Re)=>t.jsx(at,{on:W.on,onClick:W.click,title:W.title,wide:!0,block:Re,children:W.label},W.key),Ze=W=>C?t.jsxs(t.Fragment,{children:[t.jsx(at,{on:B.comfort>.01,wide:!0,block:W,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:Sl,children:B.comfort>.9?"COMFORT · FULL":B.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(at,{on:B.freeCam,wide:!0,block:W,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>qo("freeCam"),children:B.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(at,{on:Math.abs(B.lookSens-1)>.01,wide:!0,block:W,title:"How far a drag turns the view",onClick:kl,children:`LOOK ${B.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(at,{on:B.invertY,wide:!0,block:W,title:"Invert the vertical look axis",onClick:()=>qo("invertY"),children:B.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,yt=W=>t.jsxs(t.Fragment,{children:[!C&&t.jsxs(t.Fragment,{children:[t.jsx(at,{on:i,onClick:g,title:"Play / pause the cinematic",block:W,children:i?W?"❙❙  PAUSE":"❙❙":W?"▶  PLAY":"▶"}),[.5,1,2].map(Re=>t.jsxs(at,{on:c===Re,onClick:()=>m(Re),title:`${Re}× speed`,block:W,children:[Re,"×"]},Re))]}),t.jsx(at,{on:!1,onClick:u,title:"Restart from the open sea",block:W,children:W?"↺  RESTART":"↺"}),t.jsx(at,{on:x,onClick:v,title:"Storm, taiko and a temple bell — all synthesised",block:W,children:x?W?"♪  SOUND ON":"♪":W?"♪̸  SOUND OFF":"♪̸"}),t.jsx(at,{on:h!=="auto",wide:!0,block:W,title:"Render tier",onClick:()=>l(h==="auto"?"low":h==="low"?"mobile":h==="mobile"?"high":"auto"),children:h==="auto"?`AUTO · ${d.toUpperCase()}`:h.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!F&&t.jsxs(t.Fragment,{children:[[0,1].map(W=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[W?"bottom":"top"]:0,height:te?wn:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},W)),t.jsxs("div",{className:"og-tategaki",style:{opacity:C||R?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:C?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${fo}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:C?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:q,style:{height:"100%",background:`linear-gradient(90deg, ${fo}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${fo}`}})}),t.jsx("div",{className:`og-chrome${C?"":" og-chrome-bottom"}`,style:{...C?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...we},children:S?t.jsxs(t.Fragment,{children:[C&&t.jsx(at,{on:!0,onClick:()=>k("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(at,{on:R,onClick:()=>A(W=>!W),title:"Menu",children:R?"✕":"☰"}),R&&t.jsxs("div",{className:"og-menu",children:[C&&t.jsxs(t.Fragment,{children:[Ge(!0),Ze(!0),t.jsx("div",{className:"og-menu-rule"})]}),Tt.filter(W=>!(W.cinematicOnly&&C)&&!(W.helmOnly&&w!=="helm")).map(W=>We(W,!0)),t.jsx("div",{className:"og-menu-rule"}),yt(!0)]})]}):t.jsxs(t.Fragment,{children:[Ge(!1),Ze(!1),yt(!1),Tt.filter(W=>!(W.cinematicOnly&&C)&&!(W.helmOnly&&w!=="helm")).map(W=>We(W,!1))]})}),!C&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...we,pointerEvents:"none"},children:[a?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:a?`  ·  ${Math.round(s)}s`:""})]}),C&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:K,className:"og-objective"}),t.jsx("div",{ref:P,className:"og-readout"}),t.jsx("div",{ref:ae,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:w==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · T WALK THE DECK · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":w==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":z==="zoro"?"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),C&&t.jsx("div",{ref:H,className:"og-banner"}),p&&t.jsx("div",{ref:ee,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:x0,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${te?wn:"0px"};
          --og-bottom: ${te?wn:"0px"};
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
          color: ${fo};
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
            max-width: 62vw;
          }
          .og-objective { font-size: 11px; }
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
      `})]})}const yn="#d63420",v0=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function M0({onPick:e}){const[o,n]=b.useState(!1),s=b.useRef(),i=620,a=h=>{o||(n(!0),e(h))},[c,d]=b.useState(!1);return b.useEffect(()=>{if(!o)return;const h=setTimeout(()=>d(!0),i);return()=>clearTimeout(h)},[o]),b.useEffect(()=>{const h=p=>{(p.key==="Escape"||p.key==="Enter")&&a("off")};return window.addEventListener("keydown",h),()=>window.removeEventListener("keydown",h)}),c?null:t.jsxs("div",{ref:s,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:v0.map((h,p)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+p*.07}s`},onClick:()=>a(h.key),children:[t.jsx("span",{className:"og-entry-kanji",children:h.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:h.label}),t.jsx("span",{className:"og-entry-sub",children:h.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},h.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${yn};
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
          border-color: ${yn};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${yn};
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
      `})]})}const Zn="#d63420",qn="#4aa9c9",j0=(e,o,n)=>e<o?o:e>n?n:e;function er(e,o,n){const s=b.useRef(o);s.current=o;const i=b.useRef(null),a=b.useRef({x:0,y:0});b.useEffect(()=>{const c=e.current;if(!c||!n)return;const d=f=>{if(i.current===null){i.current=f.pointerId,a.current={x:f.clientX,y:f.clientY};try{c.setPointerCapture?.(f.pointerId)}catch{}s.current.onMove(0,0,f.clientX,f.clientY),f.preventDefault()}},h=f=>{if(f.pointerId!==i.current)return;const m=a.current;s.current.onMove(f.clientX-m.x,f.clientY-m.y,m.x,m.y),f.preventDefault()},p=f=>{f.pointerId===i.current&&(i.current=null,s.current.onEnd(),f.cancelable&&f.preventDefault())};c.addEventListener("pointerdown",d),c.addEventListener("pointermove",h),c.addEventListener("pointerup",p),c.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),window.addEventListener("pointercancel",p);const g=()=>{i.current!==null&&(i.current=null,s.current.onEnd())};return window.addEventListener("blur",g),()=>{c.removeEventListener("pointerdown",d),c.removeEventListener("pointermove",h),c.removeEventListener("pointerup",p),c.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),window.removeEventListener("pointercancel",p),window.removeEventListener("blur",g)}},[e,n])}function ma({label:e,sub:o,onDown:n,onUp:s,tone:i="plain",wide:a=!1}){const[c,d]=b.useState(!1),h=b.useRef();b.useEffect(()=>{const g=h.current;if(!g)return;let f=null;const m=u=>{f=u.pointerId;try{g.setPointerCapture?.(f)}catch{}d(!0),n(),u.preventDefault(),u.stopPropagation()},l=u=>{u.pointerId===f&&(f=null,d(!1),s(),u.preventDefault(),u.stopPropagation())};return g.addEventListener("pointerdown",m),g.addEventListener("pointerup",l),g.addEventListener("pointercancel",l),g.addEventListener("pointerleave",l),()=>{g.removeEventListener("pointerdown",m),g.removeEventListener("pointerup",l),g.removeEventListener("pointercancel",l),g.removeEventListener("pointerleave",l)}},[n,s]);const p=i==="hot"?Zn:i==="cool"?qn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:h,className:`og-btn${a?" og-btn-wide":""}`,style:{border:`1px solid ${c?p:"rgba(255,255,255,0.18)"}`,background:c?`color-mix(in srgb, ${p} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:c?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function tt({label:e,sub:o,onTap:n,on:s,tone:i="plain",wide:a=!1}){const c=b.useRef(),d=b.useRef(n);d.current=n,b.useEffect(()=>{const p=c.current;if(!p)return;const g=f=>{d.current(),f.preventDefault(),f.stopPropagation()};return p.addEventListener("pointerdown",g),()=>p.removeEventListener("pointerdown",g)},[]);const h=i==="hot"?Zn:i==="cool"?qn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${a?" og-btn-wide":""}`,style:{border:`1px solid ${s?h:"rgba(255,255,255,0.18)"}`,background:s?`color-mix(in srgb, ${h} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:s?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function S0(){const[e,o]=b.useState(zt.level);return b.useEffect(()=>El(o),[]),t.jsx(tt,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:Ua})}function k0({simple:e=!1}){const[o,n]=b.useState(Me.freeCam);b.useEffect(()=>Ba(i=>n(i.freeCam)),[]);const s=b.useRef(null);return e?t.jsx(tt,{label:"LEVEL",sub:"view",onTap:()=>I.recentreQueued=!0}):t.jsx(tt,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const i=performance.now();if(s.current&&i-s.current<420){s.current=null,qo("freeCam"),I.recentreQueued=!0;return}s.current=i,I.recentreQueued=!0}})}function z0({active:e}){const o=b.useRef(),n=b.useRef(),s=b.useRef(),i=78;return b.useEffect(()=>{if(!e)return;let a;const c=()=>{a=requestAnimationFrame(c);const d=s.current,h=y.helm;d&&(d.textContent=h?.sub?String(Math.round(h.orderedDepth)):"⇕")};return a=requestAnimationFrame(c),()=>cancelAnimationFrame(a)},[e]),er(o,{onMove:(a,c,d,h)=>{const p=o.current;if(!p)return;const g=p.getBoundingClientRect(),f=g.top+g.height/2,m=j0((h+c-f)/i,-1,1),l=Math.abs(m)<.1?0:m;J.active=!0,J.planes=-l;const u=n.current;u&&(u.style.transform=`translate(-50%, calc(-50% + ${m*i}px))`,u.style.borderColor=qn,u.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{J.planes=0;const a=n.current;a&&(a.style.transform="translate(-50%, -50%)",a.style.borderColor="rgba(255,255,255,0.3)",a.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:s,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function T0({mode:e,crew:o="luffy"}){const[n,s]=b.useState(!1);b.useEffect(()=>{if(e!=="foot"){s(!1);return}const x=setInterval(()=>s(y.helm?.area==="deck"),200);return()=>clearInterval(x)},[e]);const i=b.useRef(),a=b.useRef(),c=b.useRef(),d=b.useRef(),h=62,p=7,g=b.useRef(e);if(g.current=e,er(i,{onMove:(x,v,w,k)=>{const z=Math.hypot(x,v),r=z>h?h/z:1,M=x*r,F=v*r,C=a.current,S=c.current;C&&(C.style.transform=`translate(${w-h}px, ${k-h}px)`,C.style.opacity="1"),S&&(S.style.transform=`translate(${w+M-26}px, ${k+F-26}px)`,S.style.opacity="1"),d.current&&(d.current.style.opacity="0");const R=Math.abs(M)<p?0:M/h,A=Math.abs(F)<p?0:F/h;J.active=!0,g.current==="foot"?(J.walk.x=R,J.walk.z=-A):(J.throttle=-A,J.rudder=-R)},onEnd:()=>{a.current&&(a.current.style.opacity="0"),c.current&&(c.current.style.opacity="0"),d.current&&(d.current.style.opacity=""),J.throttle=0,J.rudder=0,J.walk.x=0,J.walk.z=0}},e!=="off"),b.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),b.useEffect(()=>()=>{J.throttle=0,J.rudder=0,J.planes=0,J.boost=!1,J.walk.x=0,J.walk.z=0},[e]),e==="off")return null;const f=e==="sub",m=e==="foot",l=n,u=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:i,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:a,style:{position:"fixed",left:0,top:0,width:h*2,height:h*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:c,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${Zn}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:d,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:m?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[f&&t.jsx(z0,{active:!0}),t.jsxs("div",{className:"og-actions",children:[f&&t.jsx(tt,{label:"SURFACE",sub:"blow all",onTap:()=>I.surfaceQueued=!0}),f&&t.jsx(tt,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>I.periscopeQueued=!0}),e==="helm"&&t.jsx(tt,{label:"BURST",sub:"coup de",tone:"cool",onTap:()=>I.burstQueued=!0}),(e==="helm"||l)&&t.jsx(tt,{label:l?"TAKE WHEEL":"WALK DECK",sub:l?"back to it":"she sails on",onTap:()=>I.boardQueued=!0}),m&&t.jsx(tt,{label:"JUMP",sub:"↑",onTap:()=>I.jumpQueued=!0}),m&&t.jsxs(t.Fragment,{children:[t.jsx(tt,{label:u?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>I.pistolQueued=!0}),t.jsx(tt,{label:u?"YAKKO":"BAZOOKA",sub:u?"flying cut":"both fists",tone:"cool",onTap:()=>I.bazookaQueued=!0}),t.jsx(tt,{label:u?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>I.gigantQueued=!0}),t.jsx(tt,{label:u?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>I.rocketQueued=!0}),t.jsx(tt,{label:u?"ASURA":"HAKI",sub:"burst",onTap:()=>I.hakiQueued=!0}),!u&&t.jsx(tt,{label:"GEAR 2",sub:"overdrive",onTap:()=>I.gear2Queued=!0}),t.jsx(ma,{label:u?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>J.gatling=!0,onUp:()=>J.gatling=!1})]}),!m&&t.jsx(S0,{}),t.jsx(ma,{label:m?"RUN":"FLANK",sub:m?"»":"over",tone:"hot",onDown:()=>J.boost=!0,onUp:()=>J.boost=!1}),t.jsx(k0,{simple:m})]})]}),t.jsx("style",{children:`
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

        .og-hint {
          position: fixed;
          bottom: calc(104px + env(safe-area-inset-bottom, 0px));
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
          .og-hint { bottom: calc(66px + env(safe-area-inset-bottom, 0px)); }
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
      `})]})}const Te=168,Jn=1950,tr={x:0,z:340},it={sea:"rgba(8,10,22,0.72)",ring:"#57506a",land:"#2e2836",skull:"#8a7358",fairway:"rgba(160,200,255,0.12)",gate:"#e8402a",port:"#f0ad50",rear:"#8fd4f2",whirl:"rgba(140,170,235,0.55)",you:"#ffe6a0"},At=e=>(e-tr.x)/Jn*(Te/2)+Te/2,Ot=e=>(e-tr.z)/Jn*(Te/2)+Te/2,Xt=e=>e/Jn*(Te/2);function E0(e,o){e.save(),e.scale(o,o),e.clearRect(0,0,Te,Te),e.fillStyle=it.sea,e.fillRect(0,0,Te,Te),e.fillStyle=it.fairway,e.fillRect(At(-Yo.halfWidth),0,Xt(Yo.halfWidth*2),Te),e.strokeStyle=it.ring,e.lineWidth=Xt(ft*.34),e.beginPath(),e.arc(At(de.x),Ot(de.z),Xt(ft),Math.PI*.34,Math.PI*.66,!0),e.stroke(),e.fillStyle=it.skull,e.beginPath(),e.ellipse(At(L.x),Ot(L.z),Xt(L.r*L.squash[0]),Xt(L.r*L.squash[2]),0,0,Math.PI*2),e.fill(),e.strokeStyle=it.gate,e.lineWidth=2;for(const[s,i]of[[Pt,1],[Jt,1.5]])e.beginPath(),e.moveTo(At(-95*N*i),Ot(s)),e.lineTo(At(95*N*i),Ot(s)),e.stroke();e.strokeStyle=it.whirl,e.lineWidth=1;for(const s of Ne)e.beginPath(),e.arc(At(s.x),Ot(s.z),Xt(s.r),0,Math.PI*2),e.stroke();const n=(s,i,a,c=2.6)=>{e.fillStyle=a,e.beginPath(),e.arc(At(s),Ot(i),c,0,Math.PI*2),e.fill()};n(Q.x,Q.z,it.port),n(he.x,he.z,it.land,2),n(U.gate.x,U.gate.z,it.rear),e.restore()}function R0({mode:e}){const o=b.useRef(),n=b.useRef(),s=typeof window>"u"?1:Math.min(2,window.devicePixelRatio||1),i=b.useMemo(()=>{if(typeof document>"u")return null;const a=document.createElement("canvas");return a.width=Te*s,a.height=Te*s,E0(a.getContext("2d"),s),a},[s]);return b.useEffect(()=>{if(!n.current||!i)return;const a=n.current.getContext("2d");let c;const d=()=>{c=requestAnimationFrame(d);const h=y.helm;if(a.setTransform(1,0,0,1,0,0),a.clearRect(0,0,Te*s,Te*s),a.drawImage(i,0,0),!h||h.x===void 0)return;a.save(),a.scale(s,s);const p=At(h.x),g=Ot(h.z),f=h.sub&&h.depth>4;a.translate(p,g),h.heading!==void 0?(a.rotate(h.heading+Math.PI),a.beginPath(),a.moveTo(0,-5.5),a.lineTo(3.4,4),a.lineTo(0,2),a.lineTo(-3.4,4),a.closePath()):(a.beginPath(),a.arc(0,0,3,0,Math.PI*2)),a.fillStyle=f?"rgba(0,0,0,0)":it.you,a.strokeStyle=it.you,a.lineWidth=1.2,a.fill(),a.stroke(),a.restore(),f&&(a.save(),a.scale(s,s),a.fillStyle=it.rear,a.font="600 9px ui-monospace, SFMono-Regular, Menlo, monospace",a.textAlign="right",a.fillText(`${Math.round(h.depth)}m DOWN`,Te-6,Te-6),a.restore())};return d(),()=>cancelAnimationFrame(c)},[i,s,e]),e==="off"?null:t.jsxs("div",{className:"og-minimap",style:{position:"fixed",left:14,bottom:14,zIndex:12,width:Te,height:Te,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.16)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",pointerEvents:"none"},children:[t.jsx("canvas",{ref:n,width:Te*s,height:Te*s,style:{width:Te,height:Te,display:"block"}}),t.jsx("div",{style:{position:"absolute",top:4,left:6,font:"600 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)"},children:"鬼ヶ島"}),t.jsx("canvas",{ref:o,style:{display:"none"}})]})}const ga={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function A0(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const I0=null;function G0(){const e=b.useMemo(()=>!1,[]),[o]=b.useState(A0),[n,s]=b.useState("auto"),i=n==="auto"?o:n,a=ga[i]??ga.high;b.useEffect(()=>{si(a.scene!=="low")},[a.scene]),b.useMemo(()=>ya(a.scene),[a.scene]),b.useMemo(()=>Tl(),[]),b.useEffect(()=>Rl(),[]);const c=b.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[d,h]=b.useState(0),[p,g]=b.useState(!0),[f,m]=b.useState(!0),[l,u]=b.useState(1),[x,v]=b.useState(Hs[0]),[w,k]=b.useState(0),[z,r]=b.useState(qc),[M,F]=b.useState(()=>{if(typeof location>"u")return"off";const H=new URLSearchParams(location.search).get("mode");return H==="helm"||H==="sub"||H==="foot"?H:"off"}),[C,S]=b.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy");b.useEffect(()=>{if(!z)return;const H=()=>{xn(),gn(!0)};for(const te of["pointerdown","keydown","touchstart"])window.addEventListener(te,H,{once:!0,passive:!0});return()=>{for(const te of["pointerdown","keydown","touchstart"])window.removeEventListener(te,H)}},[z]);const R=b.useCallback(()=>{r(H=>{const te=!H;return te&&xn(),gn(te),te})},[]),[A,B]=b.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),G=b.useCallback(H=>{z&&(xn(),gn(!0)),H==="off"?(y.jumpTo=0,g(!0),m(!0)):F(H),B(!0)},[z]),[$,q]=b.useState(!1),ee=b.useRef(!0);b.useEffect(()=>{if(Wa(),ee.current){ee.current=!1;return}q(!0);const H=setTimeout(()=>q(!1),210);return()=>clearTimeout(H)},[M]);const P=b.useCallback((H,te)=>{k(H),v(te)},[]),K=b.useCallback(()=>{ni(),h(H=>H+1),g(!0),m(!0)},[]),ae=b.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(b.Suspense,{fallback:null,children:t.jsx(I0,{})}):t.jsxs(t.Fragment,{children:[t.jsx(ir,{shadows:a.shadows,dpr:a.dpr,gl:{antialias:a.aa,powerPreference:"high-performance",toneMapping:mr,toneMappingExposure:yr,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(b.Suspense,{fallback:null,children:t.jsx(g0,{quality:a.scene,budget:a,onRails:f,playing:p,speed:l,onShot:P,mode:M,onMode:F,crew:C},d)})}),c&&A&&t.jsx(T0,{mode:M,crew:C}),A&&t.jsx(R0,{mode:M}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:$?1:0,transition:$?"opacity .2s ease-in":"opacity .42s ease-out"}}),!A&&t.jsx(M0,{onPick:G}),t.jsx(y0,{veiled:!A,shot:x,shotIndex:w,shotCount:Hs.length,total:On,playing:p,onRails:f,speed:l,tier:i,override:n,dev:ae,onPlay:()=>g(H=>!H),onRailsToggle:()=>m(H=>!H),onSpeed:u,onQuality:s,onRestart:K,audio:z,onAudio:R,mode:M,onMode:F,crew:C,onCrew:S,stage:y})]})}export{G0 as default};
