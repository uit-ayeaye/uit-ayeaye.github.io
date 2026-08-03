var Fr=Object.defineProperty;var Lr=(e,o,n)=>o in e?Fr(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var ya=(e,o,n)=>Lr(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as se,j as t,d as Us,f as ve,h as Gr,i as Or}from"./vendor-C2HIMx-P.js";import{t as ze,c as k,aD as Pn,au as ea,d as ta,a5 as _e,aJ as Dr,f as Nr,Y as va,a0 as Ma,ag as R,h as ee,aK as Hr,ay as _r,az as lo,aA as co,aq as Ws,R as Br,M as rt,o as wt,at as Yt,ax as ut,aL as ho,aM as uo,a4 as Ur,a8 as It,ar as Kt,av as Ys,aC as Wr,A as Yr}from"./three-Zo_RlN_K.js";import{f as so,m as ko,w as Ye,a as Zt,e as Ct,P as Vr,G as $r,S as Kr,I as Qr}from"./index-qllXYSNu.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},E={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},Ko={dir:[.72,.52,-.44],col:"#f2e9cf"},Ht={sea:.00105,bay:48e-5,deepGrade:210},Xr=1.15;function ie(e){const o=new ze(e);return[o.r,o.g,o.b]}const Zr=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,qr=`
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
`;function Jr({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new k(...ie(X.skyHigh))},uLow:{value:new k(...ie(X.skyLow))},uCloud:{value:new k(...ie(X.cloud))},uCloudLit:{value:new k(...ie(X.cloudLit))},uEmber:{value:new k(...ie(E.ember))},uFlash:{value:0},uFlashColor:{value:new k(...ie(X.boltGlow))},uFlashDir:{value:new k(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new k(...Ko.dir).normalize()},uMoonCol:{value:new k(...ie(Ko.col))},uUnder:{value:0},uUnderCol:{value:new k(...ie(X.underHaze))}}),[]);return se((a,s)=>{const i=o.current?.uniforms;i&&(i.uTime.value+=s,i.uFlash.value=e?.flash??0,e?.flashDir&&i.uFlashDir.value.copy(e.flashDir),i.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:Zr,fragmentShader:qr,uniforms:n,side:Pn,depthWrite:!1,depthTest:!1,fog:!1})]})}const N=1.9,V=e=>e*N,pe={x:0,z:V(-60)},bt=V(300),Uo=V(175),ei=118,L={x:0,z:V(-402),r:V(215),baseY:300,squash:[1.18,1.04,.98]},Mo=[[-.361,.301,.883],[.361,.301,.883]],oa=[0,.02,.9998],na=[0,-.419,.908];function aa(e,o=1){const[n,a,s]=L.squash;return{x:L.x+e[0]*L.r*n*o,y:L.baseY+e[1]*L.r*a*o,z:L.z+e[2]*L.r*s*o}}const Ce=Mo.map(e=>aa(e)),ue={...aa(na),halfWidth:74,height:62};aa(oa,.94);const Q={x:V(-152),y:4.5,z:V(-104),r:V(78)},ja=2.35,Ut=[Math.sin(ja),Math.cos(ja)],W=(()=>{const e=bt+Uo*.35,o=pe.x+Ut[0]*e,n=pe.z+Ut[1]*e;return{x:o,z:n,pool:V(46),benchY:3.6,reach:V(560),gate:{x:o-Ut[0]*V(44),z:n-Ut[1]*V(44)},berth:{x:o+Ut[0]*V(12),z:n+Ut[1]*V(12)},dir:Ut}})(),ti=[{rank:1,role:"east-south",ang:.75,dist:V(730),r:V(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:V(730),r:V(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:V(770),r:V(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:V(690),r:V(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:V(690),r:V(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:V(765),r:V(150),depth:42,dir:1,speed:35}],Be=[];function Vs(e){const o=e==="low"?3:e==="mid"?5:7;Be.length=0;for(const n of ti)n.rank>o||Be.push({role:n.role,x:pe.x+Math.sin(n.ang)*n.dist,z:pe.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Be}const oi=e=>Be.find(o=>o.role===e)??Be[0];Vs("high");function $s(e,o,n=0){let a=0,s=0;const l=Math.max(.08*(1-Ke(120,420,n)),1-Ke(8,34,n));if(l<=0)return{vx:a,vz:s,danger:0};let h=0;for(const c of Be){const d=e-c.x,b=o-c.z,g=Math.hypot(d,b);if(g>c.r*1.7||g<.001)continue;const m=g/c.r,f=1-Ke(1,1.6,m),p=c.speed*(m/.3)*Math.exp(1-m/.3)*.62*f,x=c.speed*.55*Math.exp(-m*m*2.6)*f+c.speed*.1*f,u=1/g;a+=(-b*u*p*c.dir-d*u*x)*l,s+=(d*u*p*c.dir-b*u*x)*l,h=Math.max(h,(1-Ke(.15,1.15,m))*l)}return{vx:a,vz:s,danger:h}}const Qo={x:0,halfWidth:V(96)},_t=V(258),ro=V(624),Xo={safe:260,range:640},ni=0,Wo=V(1500),Zo=e=>e<0?0:e>1?1:e;function ai(e,o,n=4){let a=0,s=1,i=1,l=0;for(let h=0;h<n;h++){const c=1-Math.abs(so(e*i,o*i,1)*2-1);a+=c*c*s,l+=s,s*=.52,i*=2.07}return a/l}const Ke=(e,o,n)=>{const a=Zo((n-e)/(o-e));return a*a*(3-2*a)};function si(e){if(e>V(430))return 1e4;const o=1-Ke(V(430),V(205),e),n=Ke(V(150),V(-30),e);return Qo.halfWidth+o*V(620)+n*V(300)}function ri(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let a=ei;return a+=o*190,a+=Math.max(0,n)*46,a-=Math.max(0,-n)*26,a}function le(e,o){const n=e-pe.x,a=o-pe.z,s=Math.hypot(n,a),i=Math.atan2(n,a),l=(s-bt)/Uo,h=Math.exp(-l*l*1.35)*ri(i),c=Math.max(0,s-bt-Uo*.55),d=-Math.pow(c/210,1.6)*175,b=Math.max(0,bt-Uo*.5-s),g=-Ke(0,150,b)*46,m=Zo(h/60),f=(ai(e*.0052/N+13,o*.0052/N-21,4)-.42)*168*m,p=(so(e*.0042/N+31,o*.0042/N-17,4)-.5)*84*m,x=(so(e*.021-5,o*.021+9,3)-.5)*17*m;let u=h+d+g+f+p+x;const v=si(o),S=1-Ke(v,v+V(105),Math.abs(e-Qo.x)),z=1-Ke(V(-40),V(-190),o),j=S*z;u=u*(1-j)+Math.min(u,-34)*j;const A=Math.hypot(e-L.x,o-L.z);u+=Math.exp(-Math.pow(A/(L.r*1.55),2))*62;const r=(e-Q.x)/V(76),T=(o-Q.z)/V(58),P=(1-Ke(.72,1.18,Math.hypot(r,T)))*Zo((u+34)/34);u=u*(1-P)+Q.y*P;const C=e-W.x,M=o-W.z;if(Math.abs(C)+Math.abs(M)<W.reach+V(140)){const G=Math.max(0,Math.min(W.reach,C*W.dir[0]+M*W.dir[1])),F=C-W.dir[0]*G,B=M-W.dir[1]*G,K=Math.hypot(F,B),fe=V(30)+G/W.reach*V(48),O=1-Ke(fe,fe+V(62),K);u=u*(1-O)+Math.min(u,-26)*O;const $=Math.hypot(C,M),te=1-Ke(W.pool*.55,W.pool,$);u=u*(1-te)+Math.min(u,-14)*te;const ae=(e-W.gate.x)/V(30),me=(o-W.gate.z)/V(24),de=1-Ke(.72,1.18,Math.hypot(ae,me));u=u*(1-de)+W.benchY*de}return u}function sa(e,o,n=3){const a=le(e+n,o)-le(e-n,o),s=le(e,o+n)-le(e,o-n),i=-a,l=2*n,h=-s,c=Math.hypot(i,l,h)||1;return[i/c,l/c,h/c]}function ii(e,o,n=3){return Math.acos(sa(e,o,n)[1])}function So(e,o){const n=Ke(V(250),V(40),o),a=1-Ke(bt-V(40),bt+V(90),Math.hypot(e-pe.x,o-pe.z)),s=(1-Ke(V(60),V(170),Math.hypot(e-W.x,o-W.z)))*.85;return Zo(Math.max(Math.min(n,a),s))}const Ks=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],li=Math.PI*2;function ci(e,o,n){let a=0,s=0,i=0;for(const l of Be){const h=e-l.x,c=o-l.z,d=Math.max(1,Math.hypot(h,c));if(d>l.r*1.75)continue;const b=d/l.r,g=Math.exp(-3*b*b);a-=l.depth*g;const m=l.depth*6*b*g/l.r;s+=m*(h/d),i+=m*(c/d);const f=Math.atan2(c,h),p=Math.sin(f*3*l.dir+b*14-n*2.2),x=b*Math.exp(1-b)*(1-hi(b));a+=p*x*1.6}return{y:a,dx:s,dz:i}}function hi(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function gt(e,o,n,a=1){let s=0,i=0,l=0;for(const c of Ks){const d=li/c.len,b=Math.sqrt(9.81/d),g=Math.hypot(c.dir[0],c.dir[1]),m=c.dir[0]/g,f=c.dir[1]/g,p=d*(m*e+f*o-b*n),x=c.amp*a;s+=x*Math.sin(p);const u=x*d*Math.cos(p);i+=u*m,l+=u*f}const h=ci(e,o,n);return s+=h.y,i+=h.dx,l+=h.dz,{y:s,dx:i,dz:l}}const ui=Ks.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),di=()=>Be.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),pi=()=>Be.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),fi=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*N).toFixed(1)}, ${(250*N).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(bt-40*N).toFixed(1)}, ${(bt+90*N).toFixed(1)},
      length(p - vec2(${pe.x.toFixed(1)}, ${pe.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*N).toFixed(1)}, ${(170*N).toFixed(1)},
      length(p - vec2(${W.x.toFixed(1)}, ${W.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,mi=()=>`
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
${fi}

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
${ui}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${di()}

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
`,gi=()=>`
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
${pi()}
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
`;function xi(e,o){const n=new Uint8Array(e*e*4);for(let s=0;s<e;s++)for(let i=0;i<e;i++){const l=pe.x+((i+.5)/e-.5)*o,h=pe.z+((s+.5)/e-.5)*o,c=le(l,h),d=R.clamp(-c/46,0,1),b=(s*e+i)*4;n[b]=Math.round(d*255),n[b+1]=n[b],n[b+2]=n[b],n[b+3]=255}const a=new Dr(n,e,e,Nr);return a.minFilter=va,a.magFilter=va,a.wrapS=Ma,a.wrapT=Ma,a.needsUpdate=!0,a}const qo={low:112,mid:190,high:286},Fn=6400;function bi(e){const o=w.useRef(),n=Fn/(qo[e]??qo.high);return se(a=>{const s=o.current;s&&(s.position.x=Math.round((a.camera.position.x-pe.x)/n)*n,s.position.z=Math.round((a.camera.position.z-pe.z)/n)*n)}),o}function wi({quality:e="high",storm:o}){const n=w.useRef(),a=bi(e),{geometry:s,uniforms:i,landTex:l,vert:h,frag:c}=w.useMemo(()=>{const d=qo[e]??qo.high,b=new ea(Fn,Fn,d,d);b.rotateX(-Math.PI/2),b.translate(pe.x,0,pe.z);const g=Wo*1.05,m=xi(e==="low"?160:256,g),f={uTime:{value:0},uLand:{value:m},uSpan:{value:g},uCentre:{value:new ta(pe.x,pe.z)},uDeep:{value:new k(...ie(X.seaDeep))},uShallow:{value:new k(...ie(X.seaShallow))},uFoam:{value:new k(...ie(X.foam))},uSkyLow:{value:new k(...ie(X.skyLow))},uGilt:{value:new k(...ie(E.gilt))},uEmber:{value:new k(...ie(E.ember))},uFogColor:{value:new k(...ie(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new k(...ie(X.abyss))},uUnderGlow:{value:new k(...ie(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:yi.clone()},uMoonCol:{value:new k(...ie(vi))},uEyeA:{value:new k(Ce[0].x,Ce[0].y,Ce[0].z)},uEyeB:{value:new k(Ce[1].x,Ce[1].y,Ce[1].z)},uFlash:{value:0},uFlashColor:{value:new k(...ie(X.boltGlow))},uCameraPos:{value:new k}};return{geometry:b,uniforms:f,landTex:m,vert:mi(),frag:gi()}},[e]);return se((d,b)=>{const g=n.current?.uniforms;if(!g)return;g.uTime.value+=b,g.uCameraPos.value.copy(d.camera.position),g.uFlash.value=o?.flash??0,g.uFogDensity.value=o?.fog??.0011;const m=Math.min(1,Math.max(0,(o?.depthBelow??0)/Ht.deepGrade));g.uDepthFade.value=m,ka.copy(ji).lerp(ki,m*.8),g.uFogColor.value.lerpVectors(Mi,ka,o?.underwater??0)}),t.jsx("mesh",{ref:a,geometry:s,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:c,uniforms:i,transparent:!1,side:_e},l.uuid)})}const yi=new k(...Ko.dir).normalize(),vi=Ko.col,Mi=new k(...ie(X.haze)),ji=new k(...ie(X.underHaze)),ki=new k(...ie(X.abyss)),ka=new k;function Si({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const a=o,s=new ea(Wo,Wo,a,a);s.rotateX(-Math.PI/2);const i=s.attributes.position,l=i.count,h=new Float32Array(l*3),c=new ze(X.rock),d=new ze(X.rockLit),b=new ze("#0b0e18"),g=new ze(X.snow),m=new ze(E.rockWarm),f=new ze;for(let p=0;p<l;p++){const x=i.getX(p)+pe.x,u=i.getZ(p)+pe.z,v=le(x,u);i.setX(p,x),i.setY(p,v),i.setZ(p,u);const S=sa(x,u,Wo/a)[1],z=Math.max(0,(S-.55)/.45);f.copy(c).lerp(d,R.clamp(v/190,0,1));const j=1-R.clamp((v-ni)/13,0,1);f.lerp(b,j*.85);const A=R.clamp((x-pe.x)/260,0,1),r=96-A*42,T=R.clamp((v-r)/60,0,1)*z;f.lerp(g,T*(.45+A*.5));const P=Math.hypot(x-L.x,u-L.z),C=Math.exp(-Math.pow(P/330,2)),M=R.clamp((u-L.z)/260,0,1);f.lerp(m,C*M*.6*(1-T)),h[p*3]=f.r,h[p*3+1]=f.g,h[p*3+2]=f.b}return s.setAttribute("color",new ee(h,3)),s.computeVertexNormals(),s.computeBoundingSphere(),s},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const ra=-30,ia=330,zi=150,xe={x:ue.x,y:ue.y-40,z:ue.z-zi-(ra+ia)},Fe={centre:[0,96,ra],radii:[350,235,ia]},Tt={x:xe.x+Fe.centre[0],y:xe.y+Fe.centre[1],z:xe.z+Fe.centre[2]};function Ti(e,o,n){const a=(e-Tt.x)/Fe.radii[0],s=(o-Tt.y)/Fe.radii[1],i=(n-Tt.z)/Fe.radii[2];return Math.sqrt(a*a+s*s+i*i)}function Ln(e,o=.06){const n=(e.x-Tt.x)/Fe.radii[0],a=(e.y-Tt.y)/Fe.radii[1],s=(e.z-Tt.z)/Fe.radii[2],i=Math.sqrt(n*n+a*a+s*s),l=1+o;if(i>=l)return null;const h=i<1e-4?0:l/i;return e.x=Tt.x+(h?n*h:0)*Fe.radii[0],e.y=Tt.y+(h?a*h:l)*Fe.radii[1],e.z=Tt.z+(h?s*h:0)*Fe.radii[2],e}const ce={y:0,halfX:290,zFront:228,zBack:-240},Ne={y:40,z:ra+ia-40,halfX:96,depth:120},ht={zTop:Ne.z-54,zBottom:140,halfX:74,steps:16},D={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},Ae={y:74,z:D.z+D.halfZ+26,halfX:96,depth:40},Gt=Ae.y+3.5,Je={y:-95,halfX:220,halfZ:175,ceiling:-34},Ee={x:0,z:84,halfX:52,halfZ:40},Me={y:52,halfZ:205,x:252,tiers:3,tierRise:46},Eo=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],we={x:74,halfW:14,zFoot:D.z+D.halfZ+158,zTop:Ae.z+Ae.depth/2-6},Qs=[{kind:"rampZ",x0:-74-we.halfW,x1:-74+we.halfW,z0:we.zFoot,z1:we.zTop,y0:0,y1:Gt},{kind:"rampZ",x0:we.x-we.halfW,x1:we.x+we.halfW,z0:we.zFoot,z1:we.zTop,y0:0,y1:Gt},{kind:"flat",x0:-96,x1:Ae.halfX,z0:Ae.z-Ae.depth/2-2,z1:we.zTop,y:Gt},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:Me.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:Me.y-.5},{kind:"flat",x0:Me.x-38,x1:Me.x+38,z0:-225,z1:Me.halfZ+20,y:Me.y-.5}],Ei=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Xs=(()=>{const e=[],o=[],n=[],a=D.halfX+6,s=[a,a+9],i=[a+11,a+20],l=[a,a+20],h=[-212,-200],c=[-264,-252],d=[Gt];for(let g=2;g<=D.storeys;g++)d.push(D.plinth+g*D.storey+1.5);e.push({kind:"flat",x0:Ae.halfX-6,x1:a+20,z0:-212,z1:-196,y:Gt}),o.push([(Ae.halfX-6+a+20)/2,Gt,-204,a+26-Ae.halfX,16]);for(let g=0;g<d.length-1;g++){const m=d[g],f=d[g+1],p=(m+f)/2;e.push({kind:"rampZ",x0:s[0],x1:s[1],z0:h[0],z1:c[1],y0:m,y1:p}),n.push({x0:s[0],x1:s[1],z0:h[0],z1:c[1],y0:m,y1:p}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:c[0],z1:c[1],y:p}),o.push([(l[0]+l[1])/2,p,(c[0]+c[1])/2,l[1]-l[0],c[1]-c[0]]),e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),n.push({x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:h[0],z1:h[1],y:f}),o.push([(l[0]+l[1])/2,f,(h[0]+h[1])/2,l[1]-l[0],h[1]-h[0]])}for(let g=1;g<d.length-1;g++){const f=1-Math.min(D.storeys,g+2)*D.taper,p=D.halfX*f,x=D.z+D.halfZ*f,u=d[g];e.push({kind:"flat",x0:p-4,x1:a,z0:-224,z1:-212,y:u}),o.push([(p-4+a)/2,u,-218,a-p+4,12]),e.push({kind:"flat",x0:-p-6,x1:p+6,z0:x,z1:-212,y:u}),o.push([0,u,(x-212)/2,p*2+12,-212-x])}const b=d[d.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:b}),o.push([(a+58)/2,b,-230,a-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[a,a+20],z:[c[0],h[1]]}}})();Qs.push(...Xs.walks);const Ri=1.1;function Ai(e,o,n=1/0){const a=n+Ri;let s=-1/0;for(const i of Qs){if(e<i.x0||e>i.x1)continue;const l=Math.min(i.z0,i.z1),h=Math.max(i.z0,i.z1);if(o<l||o>h)continue;const c=i.kind==="flat"?i.y:i.y0+(i.y1-i.y0)*Ei((o-i.z0)/(i.z1-i.z0));c<=a&&c>s&&(s=c)}return s===-1/0?0:Math.max(0,s)}function Ii(e,o,n=1/0){const a=o>ht.zTop?Ne.y:o>ht.zBottom?Ne.y*(o-ht.zBottom)/(ht.zTop-ht.zBottom):0,s=Ai(e,o,n);return Math.max(a,s)}function Ci(e,o,n){const a=D.plinth+D.storeys*D.storey;if(n>a)return!1;const i=1-(n<=D.plinth?0:Math.min(D.storeys,Math.ceil((n-D.plinth)/D.storey)))*D.taper;return Math.abs(e)<D.halfX*i&&Math.abs(o-D.z)<D.halfZ*i}const y={t:0,flash:0,flashDir:new k(0,.4,-1),fog:Ht.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new k(0,0,0),helmActive:!1,helmPos:new k(0,0,0),helmSpeed:0,ship:{x:0,y:0,z:0,heading:Math.PI,loa:64,deckY:8.3,mastY:42},subThrottle:0,vessel:"sunny",footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new k(0,60,-200)}};function Pi(){y.t=0,y.progress=0,y.flash=0,y.fog=Ht.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const pn=new Map;let Zs=!0;function Fi(e){Zs=!!e}function Li(e){const o=ko(e);return pn.has(o)||pn.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),pn.get(o)}function ot(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let a=!0;return Li(e).then(s=>{a&&n(s&&Zs)}),()=>{a=!1}},[e]),o}const Et=Mo.map(e=>new k(...e).normalize()),qs=new k(...oa).normalize(),Gn=new k(...na).normalize();function Gi(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const c of Et){const d=e.dot(c),b=Math.pow(Math.max(0,d),46);o-=b*.3}const a=Math.max(0,e.dot(qs)),s=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);o-=s*.19;for(const c of Et){const d=new k(c.x*1.5,c.y-.55,c.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,d),26)*.075}const i=Math.max(0,e.dot(Gn));o-=Math.pow(i,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const l=Math.pow(Math.max(0,e.dot(Et[0])),30)+Math.pow(Math.max(0,e.dot(Et[1])),30),h=1-Math.min(1,l);return o+=(so(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(so(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const Oi=178*1.9,tt=L.r/Oi;function Sa(e,o){const n=e*tt,a=[new k(n*74,96*tt,-20*tt),new k(n*142,176*tt,-58*tt),new k(n*196,268*tt,-76*tt),new k(n*222,356*tt,-52*tt),new k(n*206,424*tt,8*tt),new k(n*154,462*tt,72*tt)],s=new k;for(const b of a)s.set(L.x+b.x,L.baseY+b.y,L.z+b.z),Ln(s,.12)&&b.set(s.x-L.x,s.y-L.baseY,s.z-L.z);const i=new lo(a),l=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,c=new co(i,l,1,h,!1),d=c.attributes.position;for(let b=0;b<=l;b++){const g=b/l,m=34*tt*Math.pow(1-g,.72)*(1+Math.sin(g*Math.PI)*.16),f=i.getPoint(g);for(let p=0;p<=h;p++){const x=b*(h+1)+p;if(x>=d.count)continue;const u=d.getX(x)-f.x,v=d.getY(x)-f.y,S=d.getZ(x)-f.z;d.setXYZ(x,f.x+u*m,f.y+v*m,f.z+S*m)}}return d.needsUpdate=!0,c.computeVertexNormals(),c}const Di={low:4,mid:6,high:7},Js="skull-island.opt.glb",mo={height:1,yaw:0,lift:.02},fn=new Br,za=new k,Ro=new k;function Ni(e,o,n){Ro.set(o[0],o[1],o[2]).normalize(),za.copy(Ro).multiplyScalar(L.r*4),fn.set(za,Ro.clone().negate()),fn.far=L.r*8;const a=fn.intersectObject(e,!0)[0];return a?a.point.clone().addScaledVector(Ro,-n):null}function Hi({shadows:e}){const{scene:o}=Us(ko(Js)),{object:n,eyes:a,nose:s,mouth:i}=w.useMemo(()=>{const l=o.clone(!0),h=new Ws().setFromObject(l),c=new k,d=new k;h.getSize(c),h.getCenter(d);const b=L.r*L.squash[1]*1.62,g=c.y>1e-4?b*mo.height/c.y:1,m=L.r*L.squash[1]*mo.lift;l.scale.setScalar(g),l.rotation.set(0,mo.yaw,0),l.position.set(0,-d.y*g+m,0);const f=d.x*g,p=d.z*g,x=Math.cos(mo.yaw),u=Math.sin(mo.yaw);l.position.x=-(f*x+p*u),l.position.z=-(-f*u+p*x),l.updateMatrixWorld(!0);let v=0,S=0;const z={x:0,y:0,z:0},j=new k,A=[];l.traverse(F=>{F.isMesh&&A.push(F)});for(const F of A){const B=F.geometry.clone();for(const O of["position","normal"]){const $=B.attributes[O];if(!$||$.array instanceof Float32Array)continue;const te=new Float32Array($.count*3);for(let ae=0;ae<$.count;ae++)j.fromBufferAttribute($,ae),te[ae*3]=j.x,te[ae*3+1]=j.y,te[ae*3+2]=j.z;B.setAttribute(O,new ee(te,3))}B.applyMatrix4(F.matrixWorld);const K=B.attributes.position;S+=K.count;for(let O=0;O<K.count;O++)z.x=K.getX(O)+L.x,z.y=K.getY(O)+L.baseY,z.z=K.getZ(O)+L.z,Ln(z,.05)&&(K.setXYZ(O,z.x-L.x,z.y-L.baseY,z.z-L.z),v++);v&&B.computeVertexNormals(),K.needsUpdate=!0,B.computeBoundingSphere(),B.computeBoundingBox(),F.geometry=B,F.castShadow=e,F.receiveShadow=!1;const fe=Array.isArray(F.material)?F.material:[F.material];for(const O of fe)O.color?.multiply(_i),O.roughness=.94,O.metalness=.02}for(const F of[l,...A])F.position.set(0,0,0),F.quaternion.identity(),F.scale.set(1,1,1),F.updateMatrix();l.updateMatrixWorld(!0);const r=(F,B=1)=>{const[K,fe,O]=L.squash;return new k(F[0]*L.r*K*B,F[1]*L.r*fe*B,F[2]*L.r*O*B)},T=Mo.map(F=>Ni(l,F,L.r*.1)??r(F,.82)),P=new k().addVectors(T[0],T[1]).multiplyScalar(.5),C=new k().addVectors(r(Mo[0],.82),r(Mo[1],.82)).multiplyScalar(.5),M=P.clone().sub(C),G=F=>{const B={x:F.x+L.x,y:F.y+L.baseY,z:F.z+L.z};return Ln(B,.22)&&F.set(B.x-L.x,B.y-L.baseY,B.z-L.z),F};return{object:l,eyes:T.map(G),nose:G(r(oa,.87).add(M)),mouth:G(r(na,.9).add(M))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(er,{eyes:a,nose:s,mouth:i,teeth:null,cast:e})]})}const _i=new ze("#8f8a84");function er({eyes:e,nose:o,mouth:n,teeth:a,cast:s}){const i=w.useRef(),l=w.useRef(),h=w.useRef();return se(()=>{const c=y.t,d=.82+.18*Math.sin(c*2.3)*Math.sin(c*.71),b=.82+.18*Math.sin(c*1.9+2.1)*Math.sin(c*.63),g=.86+.14*Math.sin(c*1.4+.8);i.current&&(i.current.emissiveIntensity=5.2*d+y.flash*2),l.current&&(l.current.emissiveIntensity=5.2*b+y.flash*2),h.current&&(h.current.emissiveIntensity=3.4*g)}),t.jsxs(t.Fragment,{children:[e.map((c,d)=>t.jsxs("mesh",{position:c,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[L.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:d===0?i:l,color:E.furnace,emissive:E.ember,emissiveIntensity:5.2,toneMapped:!1,side:_e,roughness:1})]},d)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[L.r*.046,L.r*.083,3]}),t.jsx("meshStandardMaterial",{color:E.emberDeep,emissive:E.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,L.r*.05,-L.r*.16],children:[t.jsx("planeGeometry",{args:[L.r*.62,L.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:E.ember,emissive:E.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:_e})]}),a?.map((c,d)=>t.jsxs("mesh",{position:c.pos,scale:c.scale,rotation:[0,0,c.rot],castShadow:s,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:E.emberDeep,emissiveIntensity:.42,roughness:.78})]},d))]})]})}const Bi=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function Ui({quality:e="high",shadows:o=!0}){const a=ot(Js)&&e!=="low"&&Bi!=="proc",{dome:s,hornL:i,hornR:l,teeth:h}=w.useMemo(()=>{const f=new Hr(L.r,Di[e]??7),p=f.attributes.position,x=new Float32Array(p.count*3),u=new ze(X.rock),v=new ze(E.rockWarm),S=new ze("#120b10"),z=new ze,j=new k;for(let P=0;P<p.count;P++){j.set(p.getX(P),p.getY(P),p.getZ(P)).normalize();const C=L.r*Gi(j),[M,G,F]=L.squash;p.setXYZ(P,j.x*C*M,j.y*C*G,j.z*C*F);const B=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),5),Math.pow(Math.max(0,j.dot(Et[1])),5),Math.pow(Math.max(0,j.dot(Gn)),6)*.9);z.copy(u).lerp(v,Math.min(1,B*1.5+Math.max(0,j.z)*.22));const K=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),40),Math.pow(Math.max(0,j.dot(Et[1])),40));z.lerp(S,K),x[P*3]=z.r,x[P*3+1]=z.g,x[P*3+2]=z.b}f.setAttribute("color",new ee(x,3)),f.computeVertexNormals();const A=new _r(1,1,1),r=[],T=9;for(let P=0;P<T;P++){const C=P/(T-1)*2-1,M=ue.halfWidth*2.1,G=C*M*.5,F=Math.pow(Math.abs(C),1.7)*14,B=46-Math.abs(C)*13+P%2*7;r.push({pos:[G,ue.height*.5-F-B*.5,6],scale:[M/T*.76,B,52],rot:C*.13})}return A.dispose?.(),{dome:f,hornL:Sa(-1,e),hornR:Sa(1,e),teeth:r}},[e]),c=o,[d,b,g]=L.squash,m=(f,p)=>[f.x*L.r*d*p,f.y*L.r*b*p,f.z*L.r*g*p];return t.jsx("group",{position:[L.x,L.baseY,L.z],children:a?t.jsx(w.Suspense,{fallback:t.jsx(Ta,{dome:s,hornL:i,hornR:l,cast:c}),children:t.jsx(Hi,{shadows:c})}):t.jsxs(t.Fragment,{children:[t.jsx(Ta,{dome:s,hornL:i,hornR:l,cast:c}),t.jsx(er,{eyes:Et.map(f=>m(f,.82)),nose:m(qs,.87),mouth:m(Gn,.96),teeth:h,cast:c})]})})}function Ta({dome:e,hornL:o,hornR:n,cast:a}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:a,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function xt({matrices:e,target:o}){const n=w.useRef(!1);return se(()=>{if(n.current||!o.current)return;const a=Math.min(e.length,o.current.count);for(let s=0;s<a;s++)o.current.setMatrixAt(s,e[s]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const qt=190,vt=130,Ao=9.5;function Ea(e,o,n,a=24){const s=new lo(e),i=new co(s,a,1,4,!1),l=i.attributes.position,h=new k(0,1,0),c=new k,d=new k,b=new k,g=new k,m=new k;for(let f=0;f<=a;f++){const p=f/a;s.getPointAt(p,d),s.getTangentAt(p,c),g.crossVectors(c,h).normalize(),b.crossVectors(g,c).normalize();for(let x=0;x<=4;x++){const u=f*5+x;if(u>=l.count)continue;const v=x/4*Math.PI*2+Math.PI/4,S=Math.cos(v)*o*.7071,z=Math.sin(v)*n*.7071;m.copy(d).addScaledVector(g,S).addScaledVector(b,z),l.setXYZ(u,m.x,m.y,m.z)}}return l.needsUpdate=!0,i.computeVertexNormals(),i}function Wi(e,o,n,a=40){const s=[];for(let c=0;c<=10;c++){const d=c/10*2-1;s.push(new k(d*e,-30*(1-d*d),0))}const i=new lo(s),l=new co(i,a,n,8,!1),h=l.attributes.position;for(let c=0;c<=a;c++){const d=c/a*2-1,b=1+(1-d*d)*.85,g=i.getPointAt(c/a);for(let m=0;m<=8;m++){const f=c*9+m;f>=h.count||h.setXYZ(f,g.x+(h.getX(f)-g.x)*b,g.y+(h.getY(f)-g.y)*b,g.z+(h.getZ(f)-g.z)*b)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Ra({quality:e="high",shadows:o=!0,z:n=_t,k:a=N}){const s=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useMemo(()=>{const x=qt/2,u=vt,v=Ea([new k(-x-40,u+6,0),new k(-x-22,u+15.5,0),new k(0,u+20,0),new k(x+22,u+15.5,0),new k(x+40,u+6,0)],16,9,30),S=Ea([new k(-x-30,u+2,0),new k(0,u+8,0),new k(x+30,u+2,0)],11,5,18);return{kasagi:v,shimaki:S,rope:Wi(x-6,30,6.4,44)}},[]),{tileM:d,merlonM:b,cannonM:g,lanternM:m}=w.useMemo(()=>{const x=new rt,u=new wt,v=new k,S=new k,z=[],j=e==="low"?26:54;for(let C=0;C<j;C++){const M=C/(j-1)*2-1,G=M*(qt/2+40),F=vt+20-Math.pow(Math.abs(M),1.9)*14+5,B=-Math.sign(M)*Math.pow(Math.abs(M),3)*.5;S.set(G,F,0),u.setFromEuler(new Yt(0,0,B)),v.set(1,1,1),z.push(x.clone().compose(S,u,v))}const A=[];for(const C of[-1,1])for(let M=0;M<7;M++)S.set(C*(58+M*12),26,0),u.identity(),v.set(1,1,1),A.push(x.clone().compose(S,u,v));const r=[];for(const C of[-1,1])for(let M=0;M<2;M++)for(let G=0;G<4-M;G++)S.set(C*(64+G*13+M*6),32+M*10,8),u.setFromEuler(new Yt(Math.PI/2-.16,0,0)),v.set(1,1,1),r.push(x.clone().compose(S,u,v));const T=[],P=e==="low"?10:22;for(let C=0;C<P;C++){const M=C/(P-1)*2-1,G=M*(qt/2-12),F=30*(1-M*M);S.set(G,vt-34-F-7.5,0),u.identity(),v.set(1,1,1),T.push(x.clone().compose(S,u,v))}return{tileM:z,merlonM:A,cannonM:r,lanternM:T}},[e]);se(()=>{const x=y.t;s.current&&(s.current.material.emissiveIntensity=2.6+Math.sin(x*3.1)*.22+Math.sin(x*7.7)*.1+y.flash*1.4)});const f=qt/2,p=o;return t.jsxs("group",{position:[0,0,n],scale:a,children:[[-1,1].map(x=>t.jsxs("group",{position:[x*f,0,0],children:[t.jsxs("mesh",{position:[0,vt/2-30,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ao*.86,Ao,vt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ao*1.5,Ao*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},x)),t.jsxs("mesh",{position:[0,vt-26,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[qt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:c.shimaki,castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:c.kasagi,castShadow:p,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(xt,{matrices:d,target:i})]}),t.jsxs("mesh",{position:[0,vt-6,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,vt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:c.rope,position:[0,vt-34,2],castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(x=>{const u=30*(1-(x/(qt/2-6))**2);return t.jsx("group",{position:[x,vt-34-u-4,2],children:[0,1,2].map(v=>t.jsxs("mesh",{position:[v%2?1.1:-1.1,-2.4-v*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:_e})]},v))},x)}),[-1,1].map(x=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[x*108,6,0],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[x*108,30,6],castShadow:p,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.88})]}),t.jsxs("mesh",{position:[x*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},x)),t.jsxs("instancedMesh",{ref:h,args:[null,null,b.length],castShadow:p,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(xt,{matrices:b,target:h})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,g.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(xt,{matrices:g,target:l})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,m.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(xt,{matrices:m,target:s})]})]})}const Yi=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let i=0;i<4;i++){const l=n.createLinearGradient(0,0,e/2,0);l.addColorStop(0,"rgba(255,255,255,0.95)"),l.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=l,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const s=new ho(o);return s.colorSpace=uo,s})();function Vi(e,o,n,a){const s=[];for(let i=0;i<=a;i++){const l=i/a,h=l*2-1;s.push(new k(e[0]+(o[0]-e[0])*l,e[1]+(o[1]-e[1])*l-n*(1-h*h),e[2]+(o[2]-e[2])*l))}return s}const $i=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Ki({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useRef(),i=w.useRef(),{lanternM:l,lampM:h,pilingM:c,katanaY:d,ground:b}=w.useMemo(()=>{const f=new rt,p=new wt,x=new k(1,1,1),u=new k,v=[],S=e==="low"?.42:e==="mid"?.72:1;for(const[r,T,P]of $i){const C=Math.max(4,Math.round(P*S)),M=Vi(r,T,14,C);for(let G=1;G<M.length-1;G++){const F=.78+G*37%11/22;u.copy(M[G]).add(new k(0,-4.2*F,0)),p.setFromEuler(new Yt(0,G*1.7%Math.PI,(G%3-1)*.06)),v.push(f.clone().compose(u,p,x.clone().multiplyScalar(F)))}}const z=[],j=e==="low"?6:11;for(let r=0;r<j;r++){const T=r/(j-1);for(const P of[-1,1]){const C=R.lerp(Q.x+46,ue.x-6,T)+P*(26-T*9),M=R.lerp(Q.z-26,ue.z+32,T);u.set(C,le(C,M)+5,M),p.identity(),z.push(f.clone().compose(u,p,x))}}const A=[];for(let r=0;r<16;r++){const T=r%2,P=Math.floor(r/2);u.set(Q.x+30+P*17,-2,Q.z+34+T*26),p.setFromEuler(new Yt(0,0,(r%3-1)*.035)),A.push(f.clone().compose(u,p,x))}return{lanternM:v,lampM:z,pilingM:A,katanaY:le(Q.x+118,Q.z-58),ground:Q.y}},[e]);se(()=>{const f=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(f*2.7)*.2+Math.sin(f*6.1+1.3)*.12+y.flash*1.6),i.current){const p=46*(1+Math.sin(f*1.3)*.13);i.current.scale.set(p,p,1),i.current.material.rotation=f*.07}});const g=o,m=(f,p)=>le(Q.x+f,Q.z+p);return t.jsxs("group",{children:[t.jsxs("group",{position:[Q.x,0,Q.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(f=>t.jsxs("group",{position:[52+f*26,1.5,92+f%2*13],rotation:[0,.4+f*.3,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:_e})]})]},f))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,c.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(xt,{matrices:c,target:s})]}),t.jsxs("group",{position:[Q.x+118,d,Q.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:g,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:i,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:Yi,color:E.furnace,transparent:!0,opacity:.75,blending:ut,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(f=>{const p=96+f*4,x=88*f;return t.jsxs("group",{position:[Q.x+p,m(p,x),Q.z+x],rotation:[0,-f*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:g,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:g,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*3,37,4],rotation:[0,0,u*.3],castShadow:g,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},u)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.9,side:_e})]})]},f)}),[-1,1].map(f=>{const p=40+f*34,x=-18+f*46;return t.jsxs("group",{position:[Q.x+p,m(p,x)+12,Q.z+x],rotation:[0,f*.8,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*5,7,-1],rotation:[0,0,u*-.5],castShadow:g,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},u)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:E.ember,emissive:E.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:_e})]})]},f)}),t.jsxs("group",{position:[Q.x-34,m(-34,30)+2,Q.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.88,side:_e,emissive:E.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(x)*26,55.5,Math.sin(x)*26],rotation:[0,-x,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},p)}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(x)*32,44,Math.sin(x)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.5,toneMapped:!1})]},p)})]}),[0,1,2,3].map(f=>{const p=8+f*30,x=-70-f%2*14;return t.jsxs("group",{position:[Q.x+p,m(p,x),Q.z+x],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:f%2?"#e8dcc4":E.vermilion,roughness:.95,side:_e})]})]},f)}),[0,1,2].map(f=>{const p=.28+f*.24,x=R.lerp(Q.x+46,ue.x,p),u=R.lerp(Q.z-26,ue.z+26,p),v=le(x,u),S=1-f*.1;return t.jsxs("group",{position:[x,v,u],scale:S,children:[[-1,1].map(z=>t.jsxs("mesh",{position:[z*15,17,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},z)),t.jsxs("mesh",{position:[0,36,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.75})]})]},f)}),t.jsx("group",{position:[Q.x,b,Q.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(xt,{matrices:l,target:n})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:g,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:E.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(xt,{matrices:h,target:a})]})]})}const Aa={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function Qi(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Xi({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useRef(),i=w.useRef(),{pineTrunkM:l,pineCanopyM:h,sakuraM:c,rockM:d}=w.useMemo(()=>{const g=Aa[e]??Aa.high,m=Qi(20250801),f=new rt,p=new wt,x=new k,u=new k,v=new k(0,1,0),S=new k,z=[],j=[],A=[],r=g.pine+g.sakura+g.rock;let T=0,P=0;for(;T<r&&P<r*60;){P++;const C=m()*Math.PI*2,M=bt*(.55+m()*.62),G=pe.x+Math.sin(C)*M,F=pe.z+Math.cos(C)*M,B=le(G,F);if(B<5||B>300||ii(G,F,6)>.72||Math.hypot(G-L.x,F-L.z)<L.r*1.35)continue;const K=G>pe.x+(m()-.5)*90,fe=T;if(T++,u.set(G,B,F),fe<g.rock){const O=sa(G,F,5);S.set(O[0],O[1],O[2]),p.setFromUnitVectors(v,S),p.multiply(new wt().setFromEuler(new Yt(m()*.5,m()*6.28,m()*.5)));const $=2.5+m()*7;x.set($*(.7+m()*.6),$*(.5+m()*.5),$*(.7+m()*.6)),u.y-=$*.25,A.push(f.clone().compose(u,p,x))}else if(K){if(z.length>=g.pine)continue;p.setFromEuler(new Yt(0,m()*6.28,(m()-.5)*.09));const O=.72+m()*.7;x.set(O,O*(.85+m()*.45),O),z.push(f.clone().compose(u,p,x))}else{if(j.length>=g.sakura)continue;p.setFromEuler(new Yt(0,m()*6.28,(m()-.5)*.13));const O=.7+m()*.75;x.set(O,O*(.8+m()*.5),O),j.push(f.clone().compose(u,p,x))}}return{pineTrunkM:z.map(C=>C.clone().multiply(Zi)).concat(j.map(C=>C.clone().multiply(el))),pineCanopyM:z.map(C=>C.clone().multiply(qi)),sakuraM:j.map(C=>C.clone().multiply(Ji)),rockM:A}},[e]),b=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],castShadow:b,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(xt,{matrices:l,target:n})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:b,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(xt,{matrices:h,target:a})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,c.length],castShadow:b,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:E.sakura,roughness:.95,flatShading:!0,emissive:E.sakura,emissiveIntensity:.1}),t.jsx(xt,{matrices:c,target:s})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:b,receiveShadow:b,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(xt,{matrices:d,target:i})]})]})}const Zi=new rt().makeTranslation(0,7,0),qi=new rt().makeTranslation(0,26,0),Ji=new rt().compose(new k(0,13,0),new wt,new k(1,.72,1)),el=new rt().compose(new k(0,5,0),new wt,new k(.75,.62,.75)),zt=Math.PI,Ia={"ship-sunny.opt.glb":zt/2,"ship-tang.opt.glb":zt/2,"ship-punk.opt.glb":zt/2,"ship-lion.opt.glb":zt/2,"ship-bone.opt.glb":zt/2,"ship-junk.opt.glb":zt/2,"ship-warjunk.opt.glb":zt/2,"ship-sub.opt.glb":-zt/2},cn=e=>e&&Ia[e]!==void 0?Ia[e]:zt/2,tl={"ship-sunny.opt.glb":40,"ship-lion.opt.glb":40,"ship-punk.opt.glb":52,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":50,"ship-junk.opt.glb":38,"ship-warjunk.opt.glb":60},po=1.6,Ca=Object.fromEntries(Object.entries(tl).map(([e,o])=>[e,Math.round(o*po)])),Pa={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},hn=2,Fa={"ship-sunny.opt.glb":.513,"ship-lion.opt.glb":.274,"ship-punk.opt.glb":.264,"ship-tang.opt.glb":.208,"ship-sub.opt.glb":.261,"ship-bone.opt.glb":.353,"ship-junk.opt.glb":.313,"ship-warjunk.opt.glb":.415},La={"ship-sunny.opt.glb":1.044,"ship-lion.opt.glb":.824,"ship-punk.opt.glb":.673,"ship-tang.opt.glb":1,"ship-sub.opt.glb":.641,"ship-bone.opt.glb":.771,"ship-junk.opt.glb":.915,"ship-warjunk.opt.glb":.702},Ga={"ship-sunny.opt.glb":.165,"ship-lion.opt.glb":.095,"ship-punk.opt.glb":.115,"ship-bone.opt.glb":.105,"ship-junk.opt.glb":.1,"ship-warjunk.opt.glb":.115,"ship-tang.opt.glb":.035,"ship-sub.opt.glb":.035},Oa={"ship-sunny.opt.glb":.28,"ship-lion.opt.glb":.144,"ship-punk.opt.glb":.148,"ship-tang.opt.glb":.41,"ship-sub.opt.glb":.214,"ship-bone.opt.glb":.158,"ship-junk.opt.glb":.21,"ship-warjunk.opt.glb":.244},tr=(e,o)=>(e&&Oa[e]!==void 0?Oa[e]:.2)*o/2,or={"ship-sunny.opt.glb":[.047,.057,.057,.107,.154,.154,.113,.079,.079],"ship-lion.opt.glb":[.076,.109,.104,.098,.103,.082,.051,.017,.017],"ship-punk.opt.glb":[.073,.073,.078,.078,.079,.081,.066,.057,.057],"ship-tang.opt.glb":[.069,.089,.097,.108,.227,.227,.155,.157,.157],"ship-sub.opt.glb":[.105,.12,.16,.161,.171,.179,.145,.144,.144],"ship-bone.opt.glb":[.087,.134,.116,.116,.12,.12,.107,.107,.107],"ship-junk.opt.glb":[.065,.086,.108,.124,.141,.141,.086,.043,.043],"ship-warjunk.opt.glb":[.071,.071,.071,.123,.064,.117,.108,.018,.018]},nr=(e,o,n)=>{const a=e&&or[e]||null;if(!a)return tr(e,o);const s=Math.min(.9999,Math.max(0,n+.5))*(a.length-1),i=Math.floor(s);return(a[i]+(a[i+1]-a[i])*(s-i))*o},Da={"ship-sunny.opt.glb":-.061,"ship-lion.opt.glb":-.206,"ship-punk.opt.glb":-.09,"ship-tang.opt.glb":.192,"ship-sub.opt.glb":-.05,"ship-bone.opt.glb":-.064,"ship-junk.opt.glb":.093,"ship-warjunk.opt.glb":-.044},ol=(e,o)=>(e&&Da[e]!==void 0?Da[e]:0)*o,ar=(e,o)=>{const n=e&&or[e]||null;if(!n)return o;const a=Math.max(...n)*.35,s=n.length,i=h=>-.5+h/(s-1),l=Math.round((o+.5)*(s-1));for(let h=0;h<s;h++)for(const c of[l-h,l+h])if(!(c<0||c>=s||n[c]<a))return h===0?o:i(c);return 0},Yo=[[0,.25,0],[-.5,0,.7],[.5,-.125,-.9],[0,-.25,Math.PI*.85]],la=(e,o,[n,a])=>{const s=ar(e,a);return[n*nr(e,o,s),s*o]},sr=e=>e==="low"?Yo.slice(0,1):e==="mid"?Yo.slice(0,2):Yo,mn=["ship-tang.opt.glb","ship-sub.opt.glb"],nl=[{what:"flag",mast:.9,onMast:!0,r:.03,deep:.5},{what:"lantern port",beam:-.6,deck:!0,up:.012,z:-.125,r:.008},{what:"lantern stbd",beam:.6,deck:!0,up:.012,z:-.125,r:.008},{what:"headlamp",only:mn,beam:0,deck:!0,up:-.012,z:.4,r:.028,snap:!1},{what:"stern lamp",only:mn,beam:0,deck:!0,up:.016,z:-.3,r:.016,snap:!1},{what:"screw",only:mn,beam:0,deck:!0,up:-.055,z:-.44,r:.03,snap:!1,deep:.12}],Ot=(e,o,n)=>{const a=n.onMast?ol(e,o)/o:n.snap===!1?n.z??0:ar(e,n.z??0);return[(n.beam??0)*nr(e,o,a),n.deck?$t(e,o)+(n.up??0)*o:(n.mast??0)*hr(e,o),a*o]},Dt=e=>nl.find(o=>o.what===e),al={"ship-sunny.opt.glb":!0,"ship-punk.opt.glb":!0,"ship-tang.opt.glb":!0},rr=e=>!!(e&&al[e]),sl=2.8,ir=sl*po,Jo=e=>ir*(.72+.28*(e/(40*po))),lr=.28*po,en=5.2*po,Na={"ship-sunny.opt.glb":"#e6ded0","ship-punk.opt.glb":"#c9bfae","ship-tang.opt.glb":"#ece3cd","ship-lion.opt.glb":"#9a9188","ship-sub.opt.glb":"#9a9188","ship-bone.opt.glb":"#9a9188"},ca=(e,o="#9a9188")=>e&&Na[e]!==void 0?Na[e]:o,rl={"ship-tang.opt.glb":["#e8c34a",.85],"ship-sub.opt.glb":["#e8c34a",.85],"ship-sunny.opt.glb":["#c9a06a",.2],"ship-punk.opt.glb":["#b06a5a",.2]},tn=e=>e&&rl[e]||null,un=(e,o=34)=>e&&Ca[e]!==void 0?Ca[e]:o,dn=e=>e&&Pa[e]!==void 0?Pa[e]:1,il=e=>e&&Fa[e]!==void 0?Fa[e]:.2,cr=e=>e&&Ga[e]!==void 0?Ga[e]:.13,zo=e=>Math.max(0,il(e)-cr(e)),$t=(e,o)=>cr(e)*o,hr=(e,o)=>((e&&La[e]!==void 0?La[e]:.8)-zo(e))*o,Ha={sunny:{id:"sunny",name:"THOUSAND SUNNY",crewName:"STRAW HAT",hulls:["ship-sunny.opt.glb","ship-lion.opt.glb"],flag:"straw",crew:"crew-straw.opt.glb",fleetId:"straw-hats",tint:"#c98a52",burst:{push:62,charge:9,label:"BURST",sub:"coup de"},topSpeed:64,accel:16,turn:.92},punk:{id:"punk",name:"VICTORIA PUNK",crewName:"KID",hulls:["ship-punk.opt.glb","ship-bone.opt.glb"],flag:"kid",crew:"crew-punk.opt.glb",fleetId:"kid",tint:"#9a6a4e",burst:{push:78,charge:13,label:"RAM",sub:"full ahead"},topSpeed:60,accel:12,turn:.74}},on=e=>Ha[e]??Ha.sunny,no=[{id:"sunny",mode:"helm",vessel:"sunny",name:"THOUSAND SUNNY",who:"LUFFY"},{id:"punk",mode:"helm",vessel:"punk",name:"VICTORIA PUNK",who:"KID"},{id:"tang",mode:"sub",vessel:"tang",name:"POLAR TANG",who:"LAW"}],ll=(e,o)=>e==="sub"?no[2]:no.find(n=>n.vessel===o)??no[0],ha=(e,o)=>{const n=no.indexOf(ll(e,o));return no[(n+1)%no.length]},ur=210,_a={off:1,lead:.98*po*.77},gn={SPREAD:28,SWEEP:14,RANK:118},Ba=(e,o=0,n=0)=>({off:(e+(n?.5*Math.sign(e||1):0))*gn.SPREAD,lead:o-Math.abs(e)*gn.SWEEP-n*gn.RANK}),Ua={kozuki:{side:-1,from:2},yakuza:{side:1,from:2},mink:{side:0,from:9}};function cl(e){const o={},n={};for(const a of e){const s=hl[a.id];if(s){Object.assign(a,Ba(s[0],s[1]));continue}const i=Ua[a.faction]?a.faction:"kozuki",l=Ua[i],h=a.rank??0,c=`${i}:${h}`;o[c]===void 0&&(o[c]=l.from,n[c]=-1);const d=l.side||n[c];Object.assign(a,Ba(d*o[c],0,h)),l.side===0?(n[c]>0&&(o[c]+=1),n[c]=-n[c]):o[c]+=1}}const hl={scabbards:[0,ur],"straw-hats":[-1,150],kid:[1,150],heart:[0,60]},ul=560*N,xn={z:1050},On={sunny:{x:0*N,z:xn.z*N},punk:{x:96*N,z:(xn.z-18)*N},tang:{x:-104*N,z:(xn.z-30)*N}};function dl(e,o=0){const n=(820+-670*e)*N+o;return[(Math.sin(e*2.4)*54-e*26)*N,n]}function pl(e,o,n,a){const[s,i]=dl(n,a);return[s+o*N*_a.off,i-e*N*_a.lead]}const fl=[{x:-300*N,z:100*N,yaw:.35},{x:330*N,z:360*N,yaw:-.55},{x:-390*N,z:470*N,yaw:.12},{x:420*N,z:830*N,yaw:-.28},{x:-455*N,z:930*N,yaw:.48},{x:400*N,z:1120*N,yaw:-.16},{x:-520*N,z:690*N,yaw:.22},{x:540*N,z:1290*N,yaw:-.42}],ml=[{x:Q.x+132*N*.72,z:Q.z+96*N*.72,yaw:2.3},{x:Q.x+168*N*.72,z:Q.z+40*N*.72,yaw:1.9},{x:Q.x+96*N*.72,z:Q.z+150*N*.72,yaw:2.7}];function gl({url:e,height:o,loa:n,slim:a=1,sink:s=0,rotation:i,tint:l,emissive:h,emissiveIntensity:c,glow:d,onMaterials:b}){const{scene:g}=Us(e),m=w.useMemo(()=>g.clone(!0),[g]),f=w.useMemo(()=>{const p=new Ws().setFromObject(m),x=new k;p.getSize(x);const u=new k;if(p.getCenter(u),n){const S=x.x>=x.z,z=Math.max(S?x.x:x.z,1e-4),j=n/z,A=S?[j,j,j*a]:[j*a,j,j];return{scale:A,offset:[-u.x*A[0],-p.min.y*A[1]-n*s,-u.z*A[2]]}}const v=x.y>1e-4?o/x.y:1;return{scale:[v,v,v],offset:[-u.x*v,-p.min.y*v,-u.z*v]}},[m,o,n,a,s]);return w.useEffect(()=>{const p=[];m.traverse(x=>{if(!x.isMesh)return;x.castShadow=!0,x.receiveShadow=!0;const u=x.material?Array.isArray(x.material)?x.material:[x.material]:[];for(const v of u)p.push(v),l&&(v.color?.multiply(new ze(l)),h&&v.emissive&&(v.emissive.set(h),v.emissiveIntensity=c??.2)),d&&v.emissive&&(v.emissive.set(d[0]),v.emissiveIntensity=d[1],v.map&&!v.emissiveMap&&(v.emissiveMap=v.map),v.needsUpdate=!0)}),b?.(p)},[m,l,h,c,d,b]),t.jsx("group",{rotation:[0,i,0],scale:f.scale,position:f.offset,children:t.jsx("primitive",{object:m})})}class xl extends w.Component{constructor(){super(...arguments);ya(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ye({name:e,height:o,loa:n=null,slim:a=1,sink:s=0,rotation:i=0,position:l=[0,0,0],tint:h=null,emissive:c=null,emissiveIntensity:d=.2,glow:b=null,onMaterials:g=null,fallback:m=null}){const f=ko(e);return ot(e)?t.jsx("group",{position:l,children:t.jsx(xl,{url:f,fallback:m,children:t.jsx(w.Suspense,{fallback:m,children:t.jsx(gl,{url:f,height:o,loa:n,slim:a,sink:s,rotation:i,tint:h,emissive:c,emissiveIntensity:d,glow:b,onMaterials:g})})})}):t.jsx("group",{position:l,children:m})}const Dn=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),s=a.createImageData(e,o);for(let l=0;l<o;l++){const h=l/(o-1),c=Math.pow(1-h,1.7);for(let d=0;d<e;d++){const b=d/(e-1)*2-1,g=Math.max(0,1-Math.abs(b)/(.35+h*.65)),m=.45+.55*Math.pow(Math.abs(b)/(.35+h*.65),1.5),f=c*Math.pow(g,1.4)*m,p=(l*e+d)*4;s.data[p]=255,s.data[p+1]=255,s.data[p+2]=255,s.data[p+3]=Math.round(Math.min(1,f)*255)}}a.putImageData(s,0,0);const i=new ho(n);return i.colorSpace=uo,i})(),bl=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createImageData(e,e);for(let i=0;i<e;i++){const l=i/(e-1),h=Math.pow(1-l,1.5);for(let c=0;c<e;c++){const d=c/(e-1)*2-1,b=Math.max(0,1-Math.abs(d)),g=h*Math.pow(b,1.3),m=(i*e+c)*4;a.data[m]=255,a.data[m+1]=255,a.data[m+2]=255,a.data[m+3]=Math.round(Math.min(1,g)*255)}}n.putImageData(a,0,0);const s=new ho(o);return s.colorSpace=uo,s})(),ua=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e);const s=new ho(o);return s.colorSpace=uo,s})(),Vo=160,oo=112,Lt="#e6dfcf",dr="#0c0a15",Wt=dr;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,a,s){const i=Math.min(s??0,Math.abs(n)/2,Math.abs(a)/2);return this.moveTo(e+i,o),this.arcTo(e+n,o,e+n,o+a,i),this.arcTo(e+n,o+a,e,o+a,i),this.arcTo(e,o+a,e,o,i),this.arcTo(e,o,e+n,o,i),this.closePath(),this});function Pt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=Vo,o.height=oo;const n=o.getContext("2d"),a=n.createLinearGradient(0,0,0,oo);a.addColorStop(0,"#14101f"),a.addColorStop(.5,dr),a.addColorStop(1,"#08060f"),n.fillStyle=a,n.fillRect(0,0,Vo,oo),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,oo),n.save(),n.translate(Vo/2+4,oo/2);try{e(n)}catch(i){console.warn("[onigashima] flag emblem skipped",i)}n.restore();const s=new ho(o);return s.colorSpace=uo,s.anisotropy=4,s}function bn(e,o,n=Lt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function wn(e,o,n=1){e.save(),e.fillStyle=Wt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Wa(e,o,n=4){e.save(),e.fillStyle=Wt;for(let a=1;a<n;a++){const s=-o*.5+a*o/n;e.fillRect(s-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function yn(e,o,n=Lt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const s of[-1,1])for(const i of[-.16,.16])e.beginPath(),e.arc(s*o*1.55,o*.55+i*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const wl={straw:Pt(e=>{yn(e,26),bn(e,26),wn(e,26),Wa(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Pt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Wt;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Wt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Pt(e=>{yn(e,26,"#d8cfc0"),e.fillStyle=Lt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Wt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const a=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Pt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const a=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),alliance:Pt(e=>{yn(e,27,"#dcd4c4"),e.fillStyle=Lt,e.beginPath();for(let n=0;n<16;n++){const a=n/16*Math.PI*2;e.moveTo(Math.cos(a)*27*1.02+27*.17,Math.sin(a)*27*1.02),e.arc(Math.cos(a)*27*1.02,Math.sin(a)*27*1.02,27*.17,0,Math.PI*2)}e.fill(),e.beginPath(),e.arc(0,0,27*1.02,0,Math.PI*2),e.fill(),e.fillStyle=Wt,e.beginPath(),e.arc(0,0,27*.9,0,Math.PI*2),e.fill(),e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*27*.1,27*.42),e.quadraticCurveTo(n*27*.92,27*.1,n*27*.62,-27*.78),e.quadraticCurveTo(n*27*.5,-27*.2,n*27*.06,27*.3),e.closePath(),e.fill();e.beginPath(),e.ellipse(27*.02,-27*.02,27*.15,27*.19,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(-27*.08,-27*.02),e.lineTo(-27*.36,27*.04),e.lineTo(-27*.08,27*.1),e.closePath(),e.fill(),e.beginPath(),e.arc(0,27*.52,27*.12,0,Math.PI*2),e.fill();for(let n=0;n<8;n++){const a=n/8*Math.PI*2;e.beginPath(),e.arc(Math.cos(a)*27*.26,27*.52+Math.sin(a)*27*.26,27*.055,0,Math.PI*2),e.fill()}}),yakuza:Pt(e=>{e.strokeStyle="#e8c86a",e.lineWidth=28*.12,e.beginPath(),e.roundRect(-28*.86,-28*.86,28*1.72,28*1.72,28*.14),e.stroke(),e.fillStyle=Lt;for(const n of[-.42,0,.42])e.fillRect(-28*.52,n*28-28*.07,28*1.04,28*.15);e.fillRect(-28*.09,-28*.55,28*.18,28*1.1),e.fillStyle="#d63420",e.beginPath(),e.arc(0,-28*1.32,28*.2,0,Math.PI*2),e.fill()}),mink:Pt(e=>{e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();bn(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),wn(e,25,.85),e.save(),e.fillStyle=Wt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Pt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();bn(e,26,"#cfd8e4"),wn(e,26),Wa(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},pr={value:0},Ya=new Map;function yl(e){const o=Ya.get(e);if(o)return o;const n=wl[e],a=new Ur({map:n,emissiveMap:n,emissive:new ze("#9fb4d8"),emissiveIntensity:.95,roughness:.94,metalness:0,side:_e,transparent:!1});return a.onBeforeCompile=s=>{s.uniforms.uTime=pr,s.vertexShader=`uniform float uTime;
`+s.vertexShader.replace("#include <begin_vertex>",`
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
        `),s.vertexShader=s.vertexShader.replace("#include <beginnormal_vertex>",`
      #include <beginnormal_vertex>
      float nHoist = uv.x * uv.x;
      objectNormal = normalize(objectNormal + vec3(
        -cos(uv.x * 8.5 - uTime * 5.2 + uv.y * 2.2) * 1.36 * nHoist, 0.0, 0.0));
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Ya.set(e,a),a}function vl(){return se((e,o)=>{pr.value+=Math.min(o,.05)}),null}const Ml=(()=>{const e=new ea(1,1,14,5);return e.translate(.5,0,0),e})();function nn({crew:e="straw",width:o=ir,position:n=[0,0,0],rotation:a=Math.PI/2,staff:s=!0}){const i=w.useMemo(()=>yl(e)??null,[e]),l=o*(oo/Vo);return i?t.jsxs("group",{position:n,rotation:[0,a,0],children:[s&&t.jsxs("mesh",{position:[0,l*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.028,o*.028,l*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{position:[-o*.02,-l*1.1,0],rotation:[0,0,-.06],children:[t.jsx("cylinderGeometry",{args:[o*.012,o*.012,l*2.4,3]}),t.jsx("meshStandardMaterial",{color:"#6b5f4a",emissive:"#6b5f4a",emissiveIntensity:.35,roughness:.9})]}),t.jsx("mesh",{geometry:Ml,material:i,scale:[o,l,o]})]}):null}const $o=[{id:"scabbards",flag:"kozuki",lead:ur,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:E.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:E.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb",sailedBy:"helm"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb",sailedBy:"helm"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445",crew:"crew-heart.opt.glb",sailedBy:"sub"},{id:"kozuki-0",faction:"kozuki",flag:"kozuki",rank:0,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1",faction:"kozuki",flag:"alliance",rank:0,scale:.848,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2",faction:"kozuki",flag:"kozuki",rank:0,scale:.836,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3",faction:"kozuki",flag:"kozuki",rank:0,scale:.824,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4",faction:"kozuki",flag:"alliance",rank:0,scale:.812,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"kozuki-5",faction:"kozuki",flag:"kozuki",rank:0,scale:.8,sail:"#beb39b",hull:"#382a1e",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47",crew:"crew-samurai.opt.glb"},{id:"kozuki-6",faction:"kozuki",flag:"kozuki",rank:0,scale:.788,sail:"#bcb199",hull:"#362820",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a",crew:"crew-samurai.opt.glb"},{id:"kozuki-7",faction:"kozuki",flag:"alliance",rank:0,scale:.776,sail:"#c4b9a1",hull:"#382b1f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7b6c53",crew:"crew-samurai.opt.glb"},{id:"kozuki-8",faction:"kozuki",flag:"kozuki",rank:0,scale:.764,sail:"#c9bea7",hull:"#392c20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#81725a",crew:"crew-samurai.opt.glb"},{id:"yakuza-0",faction:"yakuza",flag:"yakuza",rank:0,scale:.84,sail:"#b8a894",hull:"#4d3026",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1",faction:"yakuza",flag:"alliance",rank:0,scale:.828,sail:"#b2a28e",hull:"#472b22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2",faction:"yakuza",flag:"yakuza",rank:0,scale:.816,sail:"#ad9d89",hull:"#42271f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3",faction:"yakuza",flag:"yakuza",rank:0,scale:.804,sail:"#bfae99",hull:"#4a2e24",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4",faction:"yakuza",flag:"alliance",rank:0,scale:.792,sail:"#a89884",hull:"#3d241d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"yakuza-5",faction:"yakuza",flag:"yakuza",rank:0,scale:.78,sail:"#b5a591",hull:"#452a21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#83654f",crew:"crew-samurai.opt.glb"},{id:"yakuza-6",faction:"yakuza",flag:"yakuza",rank:0,scale:.768,sail:"#aa9a86",hull:"#402620",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#755949",crew:"crew-samurai.opt.glb"},{id:"yakuza-7",faction:"yakuza",flag:"alliance",rank:0,scale:.756,sail:"#bcac97",hull:"#482c23",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#886851",crew:"crew-samurai.opt.glb"},{id:"yakuza-8",faction:"yakuza",flag:"yakuza",rank:0,scale:.744,sail:"#a5957f",hull:"#3a221b",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6d5142",crew:"crew-samurai.opt.glb"},{id:"mink-0",faction:"mink",flag:"mink",rank:0,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"mink-1",faction:"mink",flag:"alliance",rank:0,scale:.886,sail:"#cdc2aa",hull:"#42392b",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#68644e",crew:"crew-samurai.opt.glb"},{id:"mink-2",faction:"mink",flag:"mink",rank:0,scale:.872,sail:"#cbc0a8",hull:"#403729",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6c684f",crew:"crew-samurai.opt.glb"},{id:"mink-3",faction:"mink",flag:"mink",rank:0,scale:.858,sail:"#c6bba3",hull:"#3d352a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#666249",crew:"crew-samurai.opt.glb"},{id:"kozuki-0b",faction:"kozuki",flag:"kozuki",rank:1,scale:.8,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1b",faction:"kozuki",flag:"alliance",rank:1,scale:.788,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2b",faction:"kozuki",flag:"kozuki",rank:1,scale:.776,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3b",faction:"kozuki",flag:"kozuki",rank:1,scale:.764,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4b",faction:"kozuki",flag:"alliance",rank:1,scale:.752,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"yakuza-0b",faction:"yakuza",flag:"yakuza",rank:1,scale:.78,sail:"#b8a894",hull:"#4d3026",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1b",faction:"yakuza",flag:"alliance",rank:1,scale:.768,sail:"#b2a28e",hull:"#472b22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2b",faction:"yakuza",flag:"yakuza",rank:1,scale:.756,sail:"#ad9d89",hull:"#42271f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3b",faction:"yakuza",flag:"yakuza",rank:1,scale:.744,sail:"#bfae99",hull:"#4a2e24",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4b",faction:"yakuza",flag:"alliance",rank:1,scale:.732,sail:"#a89884",hull:"#3d241d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"mink-0b",faction:"mink",flag:"mink",rank:1,scale:.84,sail:"#cec3ab",hull:"#42392c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a6650",crew:"crew-samurai.opt.glb"},{id:"mink-1b",faction:"mink",flag:"alliance",rank:1,scale:.826,sail:"#cabfa7",hull:"#40372a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6b674e",crew:"crew-samurai.opt.glb"},{id:"mink-2b",faction:"mink",flag:"mink",rank:1,scale:.812,sail:"#ccc1a9",hull:"#413828",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#69654d",crew:"crew-samurai.opt.glb"},{id:"mink-3b",faction:"mink",flag:"mink",rank:1,scale:.798,sail:"#c8bda5",hull:"#3f3629",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#676349",crew:"crew-samurai.opt.glb"}];cl($o);function Va({color:e,position:o,scale:n=1}){return t.jsxs("group",{position:o,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[lr*n,7,5]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[en*n,en*n,1],children:t.jsx("spriteMaterial",{map:ua,color:e,transparent:!0,opacity:.5,depthWrite:!1,blending:ut,toneMapped:!1})})]})}function jl({spec:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=w.useRef();se(()=>{const f=n.current;if(!f)return;const p=y.mode&&y.mode!=="off",x=on(y.vessel).fleetId;if(f.visible=!(e.sailedBy==="sub"?y.mode==="sub":e.sailedBy==="helm"&&(y.mode==="helm"||y.mode==="foot")&&x===e.id),!f.visible)return;const u=p?0:R.clamp(y.progress*.82+.04,0,1),[v,S]=pl(e.lead,e.off,u,p?ul:0),z=So(v,S),j=R.clamp(-le(v,S)/46,0,1),A=R.lerp(1,.055,z)*R.smoothstep(j,0,.28),r=gt(v,S,y.t,A),T=e.sub?R.smoothstep(y.progress,.42,.6):0;f.position.set(v,r.y-T*40,S);const P=e.sub?.35:1;f.rotation.x=R.clamp(r.dz*1.35*P,-.32,.32),f.rotation.z=R.clamp(-r.dx*1.15*P,-.28,.28),f.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),s.current&&(s.current.material.opacity=.36*(.25+(1-z)*.75)*(1-T))});const i=e.scale,l=o==="low"?6:10,h=ot(e.model2??""),c=ot(e.model??""),d=h?e.model2:c?e.model:null,b=d==="ship-junk.opt.glb",g=un(d,34)*(b?e.scale??1:1),m=ot(e.crew??"");return d?t.jsxs("group",{ref:n,children:[t.jsx(ye,{name:d,loa:g,slim:dn(d),sink:zo(d),rotation:cn(d),tint:h?ca(d):e.tint,emissive:"#3a2a18",emissiveIntensity:.16,glow:tn(d)}),m&&sr(o).map((f,p)=>{const[x,u]=la(d,g,f);return t.jsx(ye,{name:e.crew,height:hn,rotation:f[2],position:[x,$t(d,g),u]},`crew-${p}`)}),e.flag&&!rr(d)&&t.jsx(nn,{crew:e.flag,width:Jo(g),position:Ot(d,g,Dt("flag")),staff:!!e.sub}),["lantern port","lantern stbd"].map(f=>t.jsx(Va,{color:e.lamp,position:Ot(d,g,Dt(f))},f)),t.jsxs("mesh",{ref:s,position:[0,.6,-g*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[g*.55,g*2.3]}),t.jsx("meshBasicMaterial",{map:Dn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:i*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,l]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:_e,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(f=>[0,1,2,3].map(p=>t.jsxs("mesh",{position:[f*5.6,3.4,-6+p*4],rotation:[0,0,f*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${f}-${p}`))),e.flag&&t.jsx(nn,{crew:e.flag,width:Jo(g)/(i*1.7),position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsx(Va,{color:e.lamp,scale:1/(i*1.7),position:[0,e.open?5.6:9.4,e.open?7:-7.4]})]}),t.jsxs("mesh",{ref:s,position:[0,.6,-34*i],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*i,74*i]}),t.jsx("meshBasicMaterial",{map:Dn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function $a({x:e,z:o,yaw:n,name:a,loa:s,tint:i,flag:l=null,crew:h=null,quality:c="high"}){const d=un(a,s),b=w.useRef(),g=ot(a),m=ot(h??"");return se(()=>{const f=b.current;if(!f)return;const p=So(e,o),x=R.clamp(-le(e,o)/46,0,1),u=R.lerp(1,.055,p)*R.smoothstep(x,0,.28),v=gt(e,o,y.t,u);f.position.set(e,v.y,o),f.rotation.set(R.clamp(v.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,R.clamp(-v.dx,-.22,.22))}),t.jsxs("group",{ref:b,children:[t.jsx(ye,{name:a,loa:d,slim:dn(a),sink:zo(a),rotation:cn(a),tint:i,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&m&&g&&sr(c).slice(0,2).map((f,p)=>{const[x,u]=la(a,d,f);return t.jsx(ye,{name:h,height:hn,rotation:f[2],position:[x,$t(a,d),u]},`watch-${p}`)}),l&&g&&t.jsx(nn,{crew:l,width:Jo(d),position:Ot(a,d,Dt("flag"))})]})}function kl({quality:e="high"}){const o=w.useMemo(()=>e==="low"?$o.slice(0,7):e==="mid"?$o.slice(0,22):$o,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(vl,{}),o.map(n=>t.jsx(jl,{spec:n,quality:e},n.id)),e!=="low"&&fl.map((n,a)=>t.jsx($a,{quality:e,...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts",crew:"crew-samurai.opt.glb"},`picket-${a}`)),e!=="low"&&ml.map((n,a)=>t.jsx($a,{quality:e,...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki",crew:"crew-samurai.opt.glb"},`moored-${a}`))]})}const Sl=2,Ka={"powder-keg.opt.glb":2.4,"war-cannon.opt.glb":4.2,"bomb-sphere.opt.glb":3.6,"sake-tower.opt.glb":5,"wisteria-trellis.opt.glb":8,"banquet-table.opt.glb":2.4,"stone-lantern.opt.glb":4,"oni-daiko.opt.glb":6,"oni-guardian.opt.glb":13,"oni-throne.opt.glb":12,"kagura-stage.opt.glb":40,"treasure-kura.opt.glb":16,"rear-gatehouse.opt.glb":18,"keep-tier.opt.glb":56,"arch-bridge.opt.glb":14},he=(e,o=6)=>e&&Ka[e]!==void 0?Ka[e]:o,Ft=30,zl="#2e2a33",Nn="#3a4152",Hn=X.snow,an="#cfe0f4";function Qa({position:e}){const o=he("stone-lantern.opt.glb")/7.8;return t.jsx("group",{position:e,children:t.jsx(ye,{name:"stone-lantern.opt.glb",height:he("stone-lantern.opt.glb"),tint:"#8a93a8",fallback:t.jsxs("group",{scale:o,children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Nn,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Nn,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:an,emissive:an,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Hn,roughness:.9})]})]})})})}function Tl({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2(W.dir[0],W.dir[1]),[]);return t.jsxs("group",{position:[W.gate.x,W.benchY,W.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Nn,roughness:.92})]},n)),t.jsx(ye,{name:"rear-gatehouse.opt.glb",height:he("rear-gatehouse.opt.glb"),rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:zl,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Hn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Hn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:_e})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:an,emissive:an,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Qa,{position:[-14,0,10]}),t.jsx(Qa,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const Io=new ze,El=new k,_n={color:"#7fd8c8",intensity:26e3,distance:300},vn={color:"#ffc48a",intensity:17e3,distance:280},Rl=new ze(_n.color),Al={low:1,mid:2,high:4},Jt=[{pos:[Q.x,40,Q.z],color:E.lantern,intensity:16e3,distance:460*N*.65},{pos:[0,78,_t],color:E.lantern,intensity:15e3,distance:430},{pos:[ue.x,ue.y+6,ue.z-30],color:E.emberDeep,intensity:3e4,distance:640},{pos:[W.gate.x,30,W.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function Il({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const a=w.useRef(),s=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef(),d=ve(g=>g.camera),b=Al[e]??5;return se(()=>{if(a.current){a.current.intensity=y.flash*9e3;const f=y.flashDir;a.current.position.set(f.x*700,260+f.y*500,pe.z+f.z*700)}const g=y.t;s.current&&(s.current.intensity=62e3*(.86+.14*Math.sin(g*2.3)*Math.sin(g*.71))),i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(g*1.9+2.1)*Math.sin(g*.63)));const m=y.inside;if(h.current&&(h.current.intensity=.16+m*.3),c.current&&(c.current.intensity=.34+m*.26),l.current){const f=l.current,p=.06;let x=Jt[0],u=1/0;for(const v of Jt){const S=(d.position.x-v.pos[0])**2+(d.position.z-v.pos[2])**2;S<u&&(u=S,x=v)}if(y.subActive&&u>550*550){const v=y.subPos,S=Math.min(1,y.underwater/.35),z=El.set(d.position.x-v.x,0,d.position.z-v.z),j=Math.hypot(z.x,z.z)||1,A=26;f.position.x+=(v.x+z.x/j*A-f.position.x)*.3,f.position.y+=(v.y+7-f.position.y)*.3,f.position.z+=(v.z+z.z/j*A-f.position.z)*.3,Io.set(vn.color).lerp(Rl,S),f.color.lerp(Io,p),f.intensity+=(R.lerp(vn.intensity,_n.intensity,S)-f.intensity)*p,f.distance=R.lerp(vn.distance,_n.distance,S)}else if(y.helmActive&&u>550*550){const v=y.helmPos;f.position.x+=(v.x-f.position.x)*.25,f.position.y+=(v.y+16-f.position.y)*.25,f.position.z+=(v.z-f.position.z)*.25,f.color.lerp(Io.set(E.lantern),p),f.intensity+=(11e3-f.intensity)*p,f.distance=300}else f.position.x+=(x.pos[0]-f.position.x)*p,f.position.y+=(x.pos[1]-f.position.y)*p,f.position.z+=(x.pos[2]-f.position.z)*p,f.color.lerp(Io.set(x.color),p),f.intensity+=(x.intensity-f.intensity)*p,f.distance=x.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:c,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(N/1.55),"shadow-camera-right":520*(N/1.55),"shadow-camera-top":520*(N/1.55),"shadow-camera-bottom":-520*(N/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:s,position:b>=2?[Ce[0].x,Ce[0].y,Ce[0].z]:[(Ce[0].x+Ce[1].x)/2,Ce[0].y,Ce[0].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),b>=2&&t.jsx("pointLight",{ref:i,position:[Ce[1].x,Ce[1].y,Ce[1].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:l,position:Jt[0].pos,color:Jt[0].color,intensity:Jt[0].intensity,distance:Jt[0].distance,decay:2}),b>=3&&t.jsx("pointLight",{position:[ue.x,ue.y+4,ue.z-34],color:E.emberDeep,intensity:3e4,distance:640,decay:2}),b>=4&&t.jsx("pointLight",{position:[0,78,_t],color:E.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function Mn(e,o){let n=e>>>0;const a=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),s=[],i=o==="low"?3:5,l=(p,x,u,v,S)=>{const z=[p.clone()],j=p.clone();for(let r=0;r<v;r++)j.add(new k((a()-.5)*u*.55,-u/v,(a()-.5)*u*.42)).add(x.clone().multiplyScalar(u/v*.3)),z.push(j.clone());const A=new co(new lo(z),v*2,S,i,!1);return s.push(A),z},h=l(new k(0,620,0),new k(0,0,0),620,9,3.4),c=o==="low"?1:3;for(let p=0;p<c;p++){const x=h[2+Math.floor(a()*(h.length-3))];l(x.clone(),new k(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let d=0;for(const p of s)d+=p.attributes.position.count;const b=new Float32Array(d*3),g=new Float32Array(d*3);let m=0;for(const p of s)b.set(p.attributes.position.array,m*3),g.set(p.attributes.normal.array,m*3),m+=p.attributes.position.count,p.dispose();const f=new It;return f.setAttribute("position",new ee(b,3)),f.setAttribute("normal",new ee(g,3)),f}function Cl({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),a=w.useRef({i:0,t:-1,dur:0,flicker:0}),s=w.useMemo(()=>[Mn(40503,e),Mn(20973,e),Mn(10196,e)],[e]);return se((i,l)=>{const h=Math.min(l,.05),c=a.current;if(n.current-=h,n.current<=0&&c.t<0){c.i=(c.i+1)%3,c.t=0,c.dur=.16+Math.random()*.26,c.flicker=2+Math.floor(Math.random()*3);const d=o[c.i].current;if(d){const b=(Math.random()-.5)*2.4-Math.PI*.5,g=620+Math.random()*760;d.position.set(pe.x+Math.cos(b)*g,40+Math.random()*120,pe.z+Math.sin(b)*g*.7-240),d.rotation.y=Math.random()*Math.PI*2;const m=.7+Math.random()*.8;d.scale.set(m,m,m),y.flashDir.set(d.position.x,d.position.y+400,d.position.z).normalize()}n.current=R.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(c.t>=0){c.t+=h;const d=c.t/c.dur,b=Math.abs(Math.sin(d*Math.PI*c.flicker)),g=Math.max(0,1-d);y.flash=g*g*b;const m=o[c.i].current;m&&(m.material.opacity=Math.min(1,y.flash*2.2)),d>=1&&(c.t=-1,y.flash=0,m&&(m.material.opacity=0))}else y.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:s.map((i,l)=>t.jsx("mesh",{ref:o[l],geometry:i,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:ut,depthWrite:!1,toneMapped:!1})},l))})}const Pl=`
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
`,Fl=`
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
`,Xa={low:1600,mid:3800,high:7e3},Co=460;function Ll({quality:e}){const o=w.useRef(),n=ve(i=>i.camera),a=w.useMemo(()=>{const i=Xa[e]??Xa.high,l=new Float32Array(i*3),h=new Float32Array(i),c=new Float32Array(i);for(let b=0;b<i;b++)l[b*3]=Math.random()*Co,l[b*3+1]=Math.random()*Co,l[b*3+2]=Math.random()*Co,h[b]=.7+Math.random()*.6,c[b]=.55+Math.random()*.85;const d=new It;return d.setAttribute("position",new ee(l,3)),d.setAttribute("aSpeed",new ee(h,1)),d.setAttribute("aLen",new ee(c,1)),d.boundingSphere=new Kt(new k,1e6),d},[e]),s=w.useMemo(()=>({uTime:{value:0},uCam:{value:new k},uBox:{value:Co},uFall:{value:118},uSize:{value:2.4},uColor:{value:new k(...ie("#b9c8e4"))},uOpacity:{value:.5}}),[]);return se((i,l)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=l,h.uCam.value.copy(n.position),h.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Pl,fragmentShader:Fl,uniforms:s,transparent:!0,depthWrite:!1,fog:!1})})}const Gl=`
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
`,Ol=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Za={low:120,mid:340,high:700};function Dl({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const s=Za[e]??Za.high,i=[Ce[0],Ce[1],ue,ue],l=new Float32Array(s*3),h=new Float32Array(s),c=new Float32Array(s),d=new Float32Array(s);for(let g=0;g<s;g++){const m=i[g%i.length];l[g*3]=m.x+(Math.random()-.5)*74,l[g*3+1]=m.y+(Math.random()-.5)*30,l[g*3+2]=m.z+(Math.random()-.5)*26,h[g]=Math.random(),c[g]=.045+Math.random()*.055,d[g]=2+Math.random()*4}const b=new It;return b.setAttribute("position",new ee(l,3)),b.setAttribute("aPhase",new ee(h,1)),b.setAttribute("aRise",new ee(c,1)),b.setAttribute("aSize",new ee(d,1)),b.boundingSphere=new Kt(new k(0,300,-260),700),b},[e]),a=w.useMemo(()=>({uTime:{value:0},uColor:{value:new k(...ie(E.ember))}}),[]);return se((s,i)=>{o.current&&(o.current.uniforms.uTime.value+=i)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Gl,fragmentShader:Ol,uniforms:a,transparent:!0,depthWrite:!1,blending:ut,fog:!1})})}function Nl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Cl,{quality:e}),t.jsx(Ll,{quality:e}),t.jsx(Dl,{quality:e})]})}const Hl=`
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
`,_l=`
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
`,qa={low:150,mid:380,high:620};function Bl({whirl:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=w.useMemo(()=>{const l=qa[o]??qa.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l),g=new Float32Array(l),m=new Float32Array(l);for(let p=0;p<l;p++)c[p]=Math.random()*Math.PI*2,d[p]=Math.random(),b[p]=.05+Math.random()*.05,g[p]=3+Math.random()*6,m[p]=Math.random();const f=new It;return f.setAttribute("position",new ee(h,3)),f.setAttribute("aAngle",new ee(c,1)),f.setAttribute("aPhase",new ee(d,1)),f.setAttribute("aRate",new ee(b,1)),f.setAttribute("aSize",new ee(g,1)),f.setAttribute("aJitter",new ee(m,1)),f.boundingSphere=new Kt(new k(e.x,0,e.z),e.r*1.6+40),f},[o,e]),i=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new ta(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new k(...ie(X.foam))},uGain:{value:1}}),[e]);return se((l,h)=>{const c=n.current?.uniforms;if(!c)return;c.uTime.value+=h;const d=Math.hypot(l.camera.position.x-e.x,l.camera.position.z-e.z);c.uGain.value=1-R.smoothstep(d,1600,2400),a.current&&(a.current.visible=c.uGain.value>.02)}),t.jsx("points",{ref:a,geometry:s,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Hl,fragmentShader:_l,uniforms:i,transparent:!0,depthWrite:!1,blending:ut,fog:!1})})}function Ul({quality:e="high"}){const o=ve(n=>n.camera);return se(()=>{let n=0;for(const a of Be){const s=Math.hypot(o.position.x-a.x,o.position.z-a.z);n=Math.max(n,1-R.smoothstep(s,a.r*.3,a.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Be.map((n,a)=>t.jsx(Bl,{whirl:n,quality:e},a))})}const Y={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},io={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<ro-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*N},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<_t-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*N},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=oi("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<W.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},Wl=e=>io[e]?io[e].length:0,Yl=()=>Y.chain&&io[Y.chain]?io[Y.chain][Y.step]??null:null;function Bn(e){Y.chain=io[e]?e:null,Y.step=0,Y.hull=1,Y.grip=0,Y.clock=0,Y.done=!1,Y.banner=null,Y.rev++}function sn(e,o,n=3.4){Y.banner={text:e,sub:o,until:Y.clock+n},Y.rev++}function Vt(e,o){Y.hull<=0||(Y.hull=Math.max(0,Y.hull-e),Y.hits++,Y.hull<=0?sn("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&sn(o,null,2.2),Y.rev++)}function fr(e,o){if(Y.clock+=e,Y.banner&&Y.clock>Y.banner.until&&(Y.banner=null,Y.rev++),!Y.chain||Y.done||!o)return;const n=io[Y.chain],a=n[Y.step];if(!a)return;let s=!1;try{s=!!a.test(o)}catch{s=!1}s&&(Y.step++,Y.step>=n.length?(Y.done=!0,sn("OBJECTIVE COMPLETE",Vl[Y.chain]??"",6)):sn(n[Y.step].text,n[Y.step].hint,3.6),Y.rev++)}const Vl={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function mr(e,{danger:o,headingX:n,headingZ:a,toCentreX:s,toCentreZ:i,speed:l,throttle:h}){if(o<=.001)return Y.grip=Math.max(0,Y.grip-e*.5),Y.grip;const c=Math.hypot(s,i)||1,d=-s/c,b=-i/c,g=n*d+a*b,m=Math.min(1,Math.abs(l)/22),f=o*.42,p=Math.max(0,g)*m*(.35+.45*Math.min(1,Math.abs(h)));return Y.grip=Math.max(0,Math.min(1,Y.grip+(f-p)*e)),Y.grip}const Ja=24,jn=Xo.safe,es=Xo.range,go=2.1,$l=1.5,ts=22,Kl=[_t,ro],Ql=new rt,kn=new k,os=new wt,Sn=new k;function Xl({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:Ja},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),a=w.useRef(0),s=w.useMemo(()=>{const i=new Ys(.55,1,1,e==="low"?6:10,1,!0);return i.translate(0,.5,0),i},[e]);return se((i,l)=>{const h=o.current;if(!h)return;const c=Math.min(l,.05),d=y.helm;if(y.helmActive&&d&&!d.onFoot&&!d.sub&&!d.moored){let m=null,f=1/0;for(const p of Kl){const x=Math.hypot(d.x,d.z-p);x<jn||x>es||x<f&&(f=x,m=p)}if(m!==null&&(a.current-=c,a.current<=0)){const p=1-R.clamp((f-jn)/(es-jn),0,1);a.current=R.lerp(4.5,1.9,p);const x=n.find(u=>!u.live);if(x){const u=go*.55,v=R.lerp(230,105,p);x.x=d.x+Math.sin(d.heading)*d.speed*u+(Math.random()-.5)*v,x.z=d.z+Math.cos(d.heading)*d.speed*u+(Math.random()-.5)*v,x.y0=210+Math.random()*60,x.t=0,x.live=!0}}}let g=0;for(const m of n){if(!m.live)continue;const f=m.t;if(m.t+=c,m.t<go){const p=m.t/go;kn.set(m.x,m.y0*(1-p*p),m.z),Sn.set(2.2,9,2.2)}else{if(f<go){const u=Math.hypot(m.x-d.x,m.z-d.z);u<ts&&Vt(.03*(1-u/ts)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const p=(m.t-go)/$l;if(p>=1){m.live=!1;continue}const x=Math.min(1,p*4);kn.set(m.x,gt(m.x,m.z,y.t,1).y-4,m.z),Sn.set(11+p*9,78*x*(1-p*p*.75),11+p*9)}os.identity(),h.setMatrixAt(g,Ql.compose(kn,os,Sn)),g++}h.count=g,h.instanceMatrix.needsUpdate=!0,h.visible=g>0}),t.jsx("instancedMesh",{ref:o,args:[s,void 0,Ja],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:ut,side:_e})})}const Zl=`
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
`,ql=`
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
`,ns={low:700,mid:1800,high:3200},Po=260;function Jl({quality:e}){const o=w.useRef(),n=w.useRef(),a=ve(l=>l.camera),s=w.useMemo(()=>{const l=ns[e]??ns.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l);for(let m=0;m<l;m++)h[m*3]=Math.random()*Po,h[m*3+1]=Math.random()*Po,h[m*3+2]=Math.random()*Po,c[m]=.5+Math.random()*1.4,d[m]=1.2+Math.random()*3.2,b[m]=Math.random();const g=new It;return g.setAttribute("position",new ee(h,3)),g.setAttribute("aSpeed",new ee(c,1)),g.setAttribute("aSize",new ee(d,1)),g.setAttribute("aPhase",new ee(b,1)),g.boundingSphere=new Kt(new k,1e6),g},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new k},uBox:{value:Po},uColor:{value:new k(...ie("#cfeee6"))},uGain:{value:0}}),[]);return se((l,h)=>{const c=o.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(a.position),c.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:s,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Zl,fragmentShader:ql,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const ec=`
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
`,tc=`
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
`,as={low:260,mid:700,high:1300},oc=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,nc=`
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
       density, and that is a deliberate lie. CUT AGAIN from 0.22 to 0.14 when
       the starts moved abreast and further out: the decision to dive under a
       funnel is now made from well over a kilometre away, and at 0.22 the
       column had gone grey before the player could see there was one.
       Straight exp2 at the depth fog's own density gives 250m of visibility,
       and a maelstrom is nine hundred metres of moving water: the honest
       version is invisible from anywhere you would actually decide to dive, so
       the player meets it by being inside it. Churning white water genuinely
       does carry further than the murk around it — it is scattering light, not
       absorbing it — so the fudge is in the right direction, and it is the
       difference between a hazard you navigate and one that happens to you. */
    float d = length(uCameraPos - vWorld);
    float f = 1.0 - exp(-pow(d * uFogDensity * 0.14, 2.0));
    col = mix(col, uFogColor, clamp(f, 0.0, 1.0) * 0.6);

    gl_FragColor = vec4(col, k * 0.62 * (1.0 - f * 0.4));
  }
`,ss=1100,rs={low:[6,16],mid:[10,26],high:[14,40]};function ac({whirl:e,quality:o="high"}){const n=w.useRef(),a=w.useRef(),s=ve(h=>h.camera),i=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,c=new Ys(e.r*1.02,e.r*.07,ss,h,6,!0);return c.translate(e.x,-ss/2-3,e.z),c},[e,o]),l=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new k(...ie(X.foam))},uDeep:{value:new k(...ie(X.underGlow))},uCameraPos:{value:new k},uFogDensity:{value:.0062},uFogColor:{value:new k(...ie(X.underHaze))}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c,d.uCameraPos.value.copy(h.camera.position),d.uFogDensity.value=h.scene.fog?.density??.0062;const b=h.scene.fog?.color;b&&d.uFogColor.value.set(b.r,b.g,b.b);const g=Math.hypot(s.position.x-e.x,s.position.z-e.z),[m,f]=rs[o]??rs.high,p=1-R.smoothstep(g,e.r*m,e.r*f);d.uGain.value+=(y.underwater*p-d.uGain.value)*Math.min(1,c*4),a.current&&(a.current.visible=d.uGain.value>.012)}),t.jsx("mesh",{ref:a,geometry:i,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:oc,fragmentShader:nc,uniforms:l,transparent:!0,depthWrite:!1,side:_e,blending:ut,fog:!1})})}function sc({whirl:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=ve(h=>h.camera),i=w.useMemo(()=>{const h=as[o]??as.high,c=new Float32Array(h*3),d=new Float32Array(h),b=new Float32Array(h),g=new Float32Array(h),m=new Float32Array(h),f=new Float32Array(h);for(let x=0;x<h;x++)d[x]=Math.random()*Math.PI*2,b[x]=Math.random(),g[x]=.07+Math.random()*.1,m[x]=.12+Math.pow(Math.random(),1.8)*.5,f[x]=2+Math.random()*5;const p=new It;return p.setAttribute("position",new ee(c,3)),p.setAttribute("aAngle",new ee(d,1)),p.setAttribute("aPhase",new ee(b,1)),p.setAttribute("aRate",new ee(g,1)),p.setAttribute("aRadius",new ee(m,1)),p.setAttribute("aSize",new ee(f,1)),p.boundingSphere=new Kt(new k(e.x,-60,e.z),e.r+140),p},[o,e]),l=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new ta(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new k(...ie(X.underGlow))},uGain:{value:0}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c;const b=Math.hypot(s.position.x-e.x,s.position.z-e.z),g=1-R.smoothstep(b,e.r*1.2,e.r*4);d.uGain.value=y.underwater*g,a.current&&(a.current.visible=d.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:ec,fragmentShader:tc,uniforms:l,transparent:!0,depthWrite:!1,blending:ut,fog:!1})})}function rc({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Jl,{quality:e}),t.jsx(cc,{quality:e}),Be.map((o,n)=>t.jsx(sc,{whirl:o,quality:e},n)),Be.map((o,n)=>t.jsx(ac,{whirl:o,quality:e},`w${n}`))]})}const Fo=260,is={low:0,mid:90,high:220},ic=`
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uBox;
  uniform float uGain;
  attribute float aPhase;
  attribute float aRate;
  attribute float aSize;
  attribute float aSwing;
  varying float vFade;
  varying float vFlick;

  void main() {
    /* Each fish orbits its own little circuit — cheap, closed, and it never
       needs a position buffer written back. aSwing is the radius of that
       circuit, aRate how fast it is run. */
    float t = uTime * aRate + aPhase * 6.2831;
    vec3 p = position;
    p.x += sin(t) * aSwing;
    p.z += cos(t * 0.83) * aSwing;
    p.y += sin(t * 0.51 + aPhase * 3.0) * aSwing * 0.28;

    /* Follow the camera, snapped to the box lattice — the same wrap the marine
       snow uses. mod on the offset from the camera means the shoal is always
       around the player without anything being moved on the CPU. */
    vec3 rel = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5;
    vec3 world = uCam + rel;

    float d = length(rel);
    /* Fade at the box edge so nothing pops in at the wrap seam, and fade the
       whole shoal in with submergence. */
    vFade = uGain * (1.0 - smoothstep(uBox * 0.28, uBox * 0.5, d));
    /* The tail beat, handed to the fragment stage so the silhouette flicks. */
    vFlick = sin(t * 7.0);

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(aSize * (260.0 / -mv.z), 1.5, 14.0);
  }
`,lc=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  varying float vFlick;

  void main() {
    if (vFade < 0.02) discard;
    vec2 q = gl_PointCoord - 0.5;
    /* A fish shape from two lobes: a body ellipse and a tail triangle that
       swings with the beat. Cheaper than a texture and it cannot be seen to
       repeat. */
    float body = 1.0 - smoothstep(0.0, 0.3, length(q * vec2(1.0, 2.4)));
    vec2 t = q - vec2(0.28, vFlick * 0.06);
    float tail = 1.0 - smoothstep(0.0, 0.22, length(t * vec2(0.8, 3.2)));
    float a = clamp(body + tail * 0.8, 0.0, 1.0);
    if (a < 0.05) discard;
    /* A pale belly-flash on the beat — the one thing that actually catches the
       eye in dark water, and the reason a shoal reads at all. */
    float flash = 0.72 + 0.28 * abs(vFlick);
    gl_FragColor = vec4(uColor * flash, a * vFade * 0.85);
  }
`;function cc({quality:e}){const o=w.useRef(),n=w.useRef(),a=ve(h=>h.camera),s=is[e]??is.high,i=w.useMemo(()=>{const h=new Float32Array(s*3),c=new Float32Array(s),d=new Float32Array(s),b=new Float32Array(s),g=new Float32Array(s),m=Math.max(1,Math.round(s/18));for(let p=0;p<s;p++){const x=p%m,u=x*97.13%1*Fo,v=x*41.77%1*Fo,S=x*63.31%1*Fo;h[p*3]=u+(Math.random()-.5)*26,h[p*3+1]=v+(Math.random()-.5)*14,h[p*3+2]=S+(Math.random()-.5)*26,c[p]=Math.random(),d[p]=.24+x%5*.05+Math.random()*.03,b[p]=2.4+Math.random()*3.4,g[p]=7+Math.random()*12}const f=new It;return f.setAttribute("position",new ee(h,3)),f.setAttribute("aPhase",new ee(c,1)),f.setAttribute("aRate",new ee(d,1)),f.setAttribute("aSize",new ee(b,1)),f.setAttribute("aSwing",new ee(g,1)),f.boundingSphere=new Kt(new k,1e6),f},[s]),l=w.useMemo(()=>({uTime:{value:0},uCam:{value:new k},uBox:{value:Fo},uGain:{value:0},uColor:{value:new k(...ie("#9fe0d2"))}}),[]);return se((h,c)=>{const d=o.current?.uniforms;if(!d)return;d.uTime.value+=c,d.uCam.value.copy(a.position);const b=1-R.smoothstep(y.depthBelow,70,240);d.uGain.value+=(y.underwater*b-d.uGain.value)*Math.min(1,c*3),n.current&&(n.current.visible=d.uGain.value>.02)}),s?t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:ic,fragmentShader:lc,uniforms:l,transparent:!0,depthWrite:!1,fog:!1})}):null}const rn=16/9,gr=96,xr=78;function Un(e,o,n=gr){if(!o||o>=rn)return e;const a=R.degToRad(e)/2,s=2*Math.atan(Math.tan(a)*rn/o);return Math.min(n,R.radToDeg(s))}function br(e){return!e||e>=rn?1:R.clamp(.72+.28*(e/rn),.86,1)}function Wn(e,o,n,a=.06,s=gr){const i=Un(o,e.aspect,s);Math.abs(e.fov-i)<=.05||(e.fov+=(i-e.fov)*(1-Math.pow(a,n)),e.updateProjectionMatrix())}function Yn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*R.clamp(1280/o,.55,2.2)}const wr="oni.settings.v1";function hc(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const je={comfort:0,lookSens:1,invertY:!1,freeCam:!1,hud:!0},Vn=new Set;function uc(){for(const e of Vn)e(je)}function da(e){return Vn.add(e),()=>Vn.delete(e)}function pa(e,o){e in je&&(je[e]=o,fc(),uc())}function ao(e){pa(e,!je[e])}function dc(){pa("comfort",je.comfort<.01?.55:je.comfort<.9?1:0)}function pc(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=je.lookSens-1e-6);pa("lookSens",e[(o+1)%e.length])}function fc(){try{localStorage.setItem(wr,JSON.stringify(je))}catch{}}function mc(){let e=null;try{e=JSON.parse(localStorage.getItem(wr)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(je))o!=="hud"&&typeof e[o]==typeof je[o]&&(je[o]=e[o]);else je.comfort=hc()?1:0;return je}const De=(e,o)=>e+(o-e)*je.comfort,xo=e=>e<-1?-1:e>1?1:e,I={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,swapQueued:!1,jumpQueued:!1,boardQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},At={level:0},$n=new Set;function gc(e){return $n.add(e),()=>$n.delete(e)}function fa(e){if(At.level===e)return e;At.level=e;for(const o of $n)o(e);return e}function yr(){return fa((At.level+1)%3)}const oe={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},jo=new Set,pt=(...e)=>e.some(o=>jo.has(o));function Kn(){I.throttle=0,I.rudder=0,I.planes=0,I.boost=!1,I.walk.x=0,I.walk.z=0,I.surfaceQueued=!1,I.periscopeQueued=!1,I.burstQueued=!1,I.recentreQueued=!1,I.swapQueued=!1,I.jumpQueued=!1,I.boardQueued=!1,I.zoom=0,I.pistolQueued=!1,I.bazookaQueued=!1,I.gigantQueued=!1,I.rocketQueued=!1,I.hakiQueued=!1,I.gear2Queued=!1,I.gatlingHeld=!1,I.balloonHeld=!1,oe.gatling=!1,oe.balloon=!1,fa(0),oe.throttle=0,oe.rudder=0,oe.planes=0,oe.boost=!1,oe.walk.x=0,oe.walk.z=0,jo.clear()}function xc(){const e=s=>!!s&&(s.isContentEditable||/^(input|textarea|select)$/i.test(s.tagName??"")),o=s=>{if(s.metaKey||s.ctrlKey||s.altKey||e(s.target))return;const i=s.key.toLowerCase();jo.add(i),i==="f"&&(I.surfaceQueued=!0),i==="p"&&(I.periscopeQueued=!0),i==="b"&&!s.repeat&&(I.burstQueued=!0),i==="r"&&!s.repeat&&(I.recentreQueued=!0),i==="v"&&!s.repeat&&ao("freeCam"),i==="."&&!s.repeat&&ao("hud"),i==="x"&&!s.repeat&&yr(),i==="y"&&!s.repeat&&(I.swapQueued=!0),i===" "&&!s.repeat&&(I.jumpQueued=!0),i==="t"&&!s.repeat&&(I.boardQueued=!0),i==="j"&&!s.repeat&&(I.pistolQueued=!0),i==="k"&&!s.repeat&&(I.bazookaQueued=!0),i==="l"&&!s.repeat&&(I.gigantQueued=!0),i==="g"&&!s.repeat&&(I.rocketQueued=!0),i==="h"&&!s.repeat&&(I.hakiQueued=!0),i==="n"&&!s.repeat&&(I.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(i)&&s.preventDefault()},n=s=>jo.delete(s.key.toLowerCase()),a=()=>Kn();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",a),jo.clear()}}function bc(){const e=pt("w","arrowup")?1:0,o=pt("s","arrowdown")?1:0,n=pt("a","arrowleft")?1:0,a=pt("d","arrowright")?1:0,s=pt("q"," ")?1:0,i=pt("e","c")?1:0,l=xo(e-o+oe.throttle);l<-.05&&At.level&&fa(0),I.throttle=At.level>0?Math.max(l,1):l,I.rudder=xo(n-a+oe.rudder),I.planes=xo(s-i+oe.planes),I.boost=pt("shift")||oe.boost||At.level===2,I.zoom=(pt("]","=","+")?1:0)-(pt("[","-","_")?1:0),I.gatlingHeld=pt("u")||oe.gatling,I.balloonHeld=pt("i")||oe.balloon,I.walk.x=xo(a-n+oe.walk.x),I.walk.z=xo(e-o+oe.walk.z)}const Qn=[0,(Ce[0].y+Ce[1].y)/2,Ce[0].z],vr=[ue.x,ue.y,ue.z],ln=W.dir,Mr=[W.x+ln[0]*300,-36,W.z+ln[1]*300],jr=[W.x+ln[0]*46,34,W.z+ln[1]*46],kr=[W.gate.x,4,W.gate.z],Sr=[W.gate.x,22,W.gate.z],wc=1.55,Xn=N/wc,yc=1+(Xn-1)*.35,Mt=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Qn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Mr,to:jr,lookFrom:kr,lookTo:Sr,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:vr,lookTo:Qn,swell:0}],vc=new Set([Qn,vr,Mr,jr,kr,Sr]),Lo=e=>vc.has(e)?e:[e[0]*Xn,e[1]*yc,e[2]*Xn];for(const e of Mt)e.from=Lo(e.from),e.to=Lo(e.to),e.lookFrom=Lo(e.lookFrom),e.lookTo=Lo(e.lookTo);const Zn=Mt.reduce((e,o)=>e+o.dur,0),ls=Mt,Mc=e=>e*e*(3-2*e),jc=e=>1-Math.pow(1-e,2.2),Go=e=>new k(e[0],e[1],e[2]),Nt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function kc(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,a=new Map;let s=0,i=null;const l=(g,m)=>{const f=y.orbit,p=f.dist*.0016,x=Math.cos(f.yaw),u=-Math.sin(f.yaw);f.target.x-=x*g*p,f.target.z-=u*g*p;const v=Math.cos(f.pitch),S=Math.sin(f.pitch);f.target.y+=m*p*v,f.target.x+=Math.sin(f.yaw)*m*p*S,f.target.z+=Math.cos(f.yaw)*m*p*S,zr()},h=g=>{a.set(g.pointerId,{x:g.clientX,y:g.clientY});try{n.setPointerCapture?.(g.pointerId)}catch{}if(a.size===2){const[m,f]=[...a.values()];s=Math.hypot(m.x-f.x,m.y-f.y),i={x:(m.x+f.x)/2,y:(m.y+f.y)/2}}},c=g=>{const m=a.get(g.pointerId);if(!m)return;const f=g.clientX-m.x,p=g.clientY-m.y;if(m.x=g.clientX,m.y=g.clientY,a.size>=2){const[x,u]=[...a.values()],v=Math.hypot(x.x-u.x,x.y-u.y),S={x:(x.x+u.x)/2,y:(x.y+u.y)/2};if(s>8&&v>8){const z=y.orbit;z.dist=R.clamp(z.dist*(s/v),...Nt.dist)}i&&l(S.x-i.x,S.y-i.y),s=v,i=S,g.cancelable&&g.preventDefault();return}if(g.shiftKey||g.buttons===4)l(f,p);else{const x=y.orbit;x.yaw-=f*.005*Yn(),x.pitch=R.clamp(x.pitch+p*.004*Yn(),...Nt.pitch)}g.cancelable&&g.preventDefault()},d=g=>{a.delete(g.pointerId)&&a.size<2&&(s=0,i=null)},b=g=>{g.preventDefault();const m=y.orbit;m.dist=R.clamp(m.dist*(1+Math.sign(g.deltaY)*.11),...Nt.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",c,{passive:!1}),n.addEventListener("pointerup",d),n.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),n.addEventListener("wheel",b,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",c),n.removeEventListener("pointerup",d),n.removeEventListener("pointercancel",d),window.removeEventListener("pointerup",d),n.removeEventListener("wheel",b),a.clear()}},[e,o])}function zr(){const e=y.orbit;e.target.x=R.clamp(e.target.x,-4200,Nt.xz),e.target.z=R.clamp(e.target.z,-4200,Nt.xz),e.target.y=R.clamp(e.target.y,...Nt.y)}function Sc({onRails:e,playing:o,speed:n=1,onShot:a,idle:s=!1}){const i=ve(b=>b.camera),l=ve(b=>b.gl),h=w.useRef(0),c=w.useRef(-1),d=w.useRef(new k(0,150,-260));return kc(!e&&!s,l),w.useEffect(()=>{if(e)return;const b=y.orbit,g=i.position.clone().sub(b.target);b.dist=R.clamp(g.length(),...Nt.dist),b.yaw=Math.atan2(g.x,g.z),b.pitch=Math.asin(R.clamp(g.y/(g.length()||1),-1,1))},[e,i]),se((b,g)=>{if(s)return;const m=Math.min(g,.05);if(y.t+=m,e){if(y.jumpTo!=null){let C=0;for(let M=0;M<y.jumpTo&&M<Mt.length;M++)C+=Mt[M].dur;h.current=C,y.jumpTo=null}o&&(h.current=(h.current+m*n)%Zn);let v=0,S=0;for(;S<Mt.length&&!(h.current<v+Mt[S].dur);S++)v+=Mt[S].dur;const z=Mt[Math.min(S,Mt.length-1)],j=R.clamp((h.current-v)/z.dur,0,1);c.current!==S&&(c.current=S,y.shot=S,a?.(S,z));const A=Go(z.from).lerp(Go(z.to),jc(j)),r=Go(z.lookFrom).lerp(Go(z.lookTo),Mc(j)),T=z.swell??0;if(T>0){const C=y.t;A.y+=Math.sin(C*.62)*3.1*T+Math.sin(C*1.31+1.2)*1.2*T,A.x+=Math.sin(C*.44+.6)*2.2*T}A.x+=Math.sin(y.t*.83)*.35,A.y+=Math.sin(y.t*1.17+2)*.28,i.position.copy(A),d.current.lerp(r,1-Math.pow(1e-4,m)),i.lookAt(d.current),T>0&&i.rotateZ(Math.sin(y.t*.51)*.024*T);const P=Un(z.fov,i.aspect);Math.abs(i.fov-P)>.01&&(i.fov+=(P-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.progress=h.current/Zn}else{const v=y.orbit;I.recentreQueued&&(I.recentreQueued=!1,v.target.set(L.x,L.baseY*.55,L.z),v.dist=R.clamp(v.dist,260,1400));const S=I.walk.x,z=I.walk.z;if(S||z||I.planes||I.zoom){const r=v.dist*(I.boost?1.9:.7)*m,T=-Math.sin(v.yaw),P=-Math.cos(v.yaw);v.target.x+=(T*z-P*S)*r,v.target.z+=(P*z+T*S)*r,v.target.y+=I.planes*r,v.dist=R.clamp(v.dist*(1-I.zoom*.9*m),...Nt.dist),zr()}const j=Math.cos(v.pitch);i.position.set(v.target.x+Math.sin(v.yaw)*j*v.dist,v.target.y+Math.sin(v.pitch)*v.dist,v.target.z+Math.cos(v.yaw)*j*v.dist),i.lookAt(v.target);const A=Un(55,i.aspect);Math.abs(i.fov-A)>.01&&(i.fov+=(A-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.t+=0}const f=So(i.position.x,i.position.z);y.shelter+=(f-y.shelter)*(1-Math.pow(.06,m)),y.fog=R.lerp(Ht.sea,Ht.bay,y.shelter),y.rain=1-y.shelter*.92;const p=gt(i.position.x,i.position.z,y.t,1),x=R.clamp((p.y-i.position.y-1)/3,0,1);y.underwater+=(x-y.underwater)*(1-Math.pow(.002,m)),y.depthBelow=Math.max(0,p.y-i.position.y);const u=R.lerp(8200,1700,y.underwater);Math.abs(i.far-u)>20&&(i.far=u,i.updateProjectionMatrix()),b.camera.updateMatrixWorld()}),null}const cs={low:[24,16],mid:[40,26],high:[56,36]};function zc({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useMemo(()=>{const[m,f]=cs[e]??cs.high,p=new Wr(1,m,f),x=p.attributes.position,u=new Float32Array(x.count*3),[v,S,z]=Fe.centre,[j,A,r]=Fe.radii,T=new ze("#241c22"),P=new ze(E.rockWarm),C=new ze;for(let M=0;M<x.count;M++){const G=x.getX(M),F=x.getY(M),B=x.getZ(M),K=1+(so(G*2.4+5,B*2.4-9,3)-.5)*.14;x.setXYZ(M,v+G*j*K,S+F*A*K,z+B*r*K);const fe=R.clamp((F+.2)/1.2,0,1);C.copy(T).lerp(P,(1-fe)*.55),u[M*3]=C.r,u[M*3+1]=C.g,u[M*3+2]=C.b}return p.setAttribute("color",new ee(u,3)),p.computeVertexNormals(),p},[e]),{stairM:i,brazierM:l,bayM:h,tableM:c,jarM:d,westStairM:b}=w.useMemo(()=>{const m=new rt,f=new wt,p=new k(1,1,1),x=new k,u=[];for(let O=0;O<ht.steps;O++){const $=O/(ht.steps-1);x.set(0,R.lerp(Ne.y,ce.y+2,$),R.lerp(ht.zTop,ht.zBottom,$)),f.identity(),u.push(m.clone().compose(x,f,p))}const v=[],S=e==="low"?5:9;for(const O of[-1,1])for(let $=0;$<S;$++){const te=$/(S-1);x.set(O*176,ce.y+9,R.lerp(ce.zFront-40,ce.zBack+40,te)),f.identity(),v.push(m.clone().compose(x,f,p))}for(let O=0;O<6;O++)x.set(-110+O*44,ce.y+9,D.z+D.halfZ+54),f.identity(),v.push(m.clone().compose(x,f,p));const z=[],j=e==="low"?5:9;for(const O of[-1,1])for(let $=0;$<Me.tiers;$++)for(let te=0;te<j;te++){const ae=te/(j-1);x.set(O*(Me.x-$*26),Me.y+$*Me.tierRise,R.lerp(-205,Me.halfZ,ae)),f.identity(),z.push(m.clone().compose(x,f,p))}const A=[],r=[],T=new wt,P=new k(0,1,0);let C=24301;const M=()=>(C=Math.imul(C,1664525)+1013904223>>>0,C/4294967296),G=e==="low"?1:2,F=e==="low"?5:8;for(const O of[-1,1])for(let $=0;$<G;$++)for(let te=0;te<F;te++){const ae=O*(96+$*52+(M()-.5)*14),me=R.lerp(ce.zBack+120,ce.zFront-60,te/(F-1))+(M()-.5)*16;if(!(Math.abs(ae)<Ee.halfX+24&&Math.abs(me-Ee.z)<Ee.halfZ+20)&&!(Math.abs(Math.abs(ae)-we.x)<26&&me<we.zFoot+16&&me>we.zTop-8)){x.set(ae,ce.y+2.4,me),T.setFromAxisAngle(P,(M()-.5)*.5),A.push(m.clone().compose(x,T,p));for(let de=0;de<2;de++)x.set(ae+(M()-.5)*30,ce.y+3.5,me+(M()>.5?8:-8)+(M()-.5)*6),T.setFromAxisAngle(P,M()*Math.PI),r.push(m.clone().compose(x,T,p))}}const B=[],K=16,fe=O=>O*O*(3-2*O);for(let O=0;O<=K;O++){const $=O/K;x.set(-252,fe($)*(Me.y-.5)-1.3,R.lerp(45,-45,$)),f.identity(),B.push(m.clone().compose(x,f,p))}return{stairM:u,brazierM:v,bayM:z,tableM:A,jarM:r,westStairM:B}},[e]);se(()=>{const m=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(m*4.1)*.3+Math.sin(m*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(m*.9)*.12)});const g=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:s,side:Pn,receiveShadow:g,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Pn,roughness:.97,metalness:.02})}),[[0,(ce.zFront+Ee.z+Ee.halfZ)/2,ce.halfX*2,ce.zFront-Ee.z-Ee.halfZ],[0,(ce.zBack+Ee.z-Ee.halfZ)/2,ce.halfX*2,Ee.z-Ee.halfZ-ce.zBack],[-342/2-20,Ee.z,ce.halfX*2-Ee.halfX*2,Ee.halfZ*2],[(Ee.halfX+ce.halfX)/2+20,Ee.z,ce.halfX*2-Ee.halfX*2,Ee.halfZ*2]].map(([m,f,p,x],u)=>t.jsxs("mesh",{position:[m,ce.y-3,f],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[Math.abs(p),6,Math.abs(x)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},u)),t.jsxs("mesh",{ref:a,position:[Ee.x,Je.ceiling+2,Ee.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[Ee.halfX*2,Ee.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:_e})]}),t.jsxs("mesh",{position:[0,Ne.y-4,Ne.z],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[Ne.halfX*2.6,8,Ne.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,i.length],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[ht.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Tc,{matrices:i})]}),[-1,1].map(m=>Array.from({length:Me.tiers},(f,p)=>t.jsxs("mesh",{position:[m*(Me.x-p*26),Me.y+p*Me.tierRise-4,0],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[76-p*6,7,Me.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]},`${m}-${p}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:E.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Ic,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(Ec,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Rc,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,b.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Ac,{matrices:b})]}),t.jsxs("instancedMesh",{args:[null,null,l.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Cc,{matrices:l})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:E.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Pc,{matrices:l})]}),t.jsxs("mesh",{position:[0,Je.y-4,0],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[Je.halfX*2,8,Je.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(m=>[-1,0,1].map(f=>t.jsxs("mesh",{position:[m*120,(Je.y+ce.y)/2,f*96],castShadow:g,children:[t.jsx("boxGeometry",{args:[26,Math.abs(ce.y-Je.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${m}-${f}`)))]})}function Tc({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Ec({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Rc({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Ac({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Ic({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Cc({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o})}function Pc({matrices:e}){const o=w.useRef();return t.jsx(Qt,{matrices:e,selfRef:o,offsetY:9})}function Qt({matrices:e,offsetY:o=0}){const n=w.useRef(),a=w.useRef(!1);return se(()=>{if(a.current)return;const s=n.current?.parent;if(!s?.isInstancedMesh)return;const i=new rt,l=new rt().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,s.count);h++)i.copy(e[h]).multiply(l),s.setMatrixAt(h,i);s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:n})}const hs=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),s=a.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);s.addColorStop(0,"#fff3c4"),s.addColorStop(.32,"#ffc95e"),s.addColorStop(.66,"#e06120"),s.addColorStop(1,"#7e1c14"),a.fillStyle=s,a.fillRect(0,0,e,o),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let l=0;l<12;l++){const h=l/12*Math.PI*2;a.save(),a.translate(e/2,o*.62),a.rotate(h),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let l=8;l<e;l+=22)a.fillRect(l,0,3,o);a.globalAlpha=1;const i=new ho(n);return i.colorSpace=uo,i})();function Fc(e,o,n,a){const s=e+a,i=o+a,l=new Float32Array([-s,0,i,s,0,i,e*.18,n,o*.18,-s,0,i,e*.18,n,o*.18,-e*.18,n,o*.18,s,0,i,s,0,-i,e*.18,n,-o*.18,s,0,i,e*.18,n,-o*.18,e*.18,n,o*.18,s,0,-i,-s,0,-i,-e*.18,n,-o*.18,s,0,-i,-e*.18,n,-o*.18,e*.18,n,-o*.18,-s,0,-i,-s,0,i,-e*.18,n,o*.18,-s,0,-i,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new It;return h.setAttribute("position",new ee(l,3)),h.computeVertexNormals(),h}function Lc({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=ot("keep-hf.opt.glb"),i=w.useMemo(()=>{const h=[];for(let c=0;c<D.storeys;c++){const d=1-(c+1)*D.taper,b=D.plinth+c*D.storey;h.push({i:c,y:b,halfX:D.halfX*d,halfZ:D.halfZ*d,roof:Fc(D.halfX*d,D.halfZ*d,c===D.storeys-1?30:16,11)})}return h},[]);se(()=>{const h=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const l=o;return t.jsxs("group",{position:[0,D.baseY,D.z],children:[t.jsxs("mesh",{position:[0,D.plinth/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[D.halfX*2.2,D.plinth,D.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),s&&t.jsx(ye,{name:"keep-hf.opt.glb",height:D.plinth+D.storeys*D.storey+26,position:[0,D.plinth*.5,0],tint:"#9a8468",emissive:E.emberDeep,emissiveIntensity:.14}),!s&&i.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,D.storey/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2,D.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,D.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,D.storey*.38]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,D.storey*.02,h.halfZ+8],castShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,D.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,D.storey,0],castShadow:l,receiveShadow:l,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,D.plinth+D.storeys*D.storey+30,0],rotation:[0,0,h*.4],castShadow:l,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,Ae.y,Ae.z-D.z],children:[t.jsxs("mesh",{castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[Ae.halfX*2,7,Ae.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[Ae.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:"#ffffff",emissiveMap:hs,map:hs,emissiveIntensity:2.2,toneMapped:!1,side:_e})]}),t.jsx(ye,{name:"oni-throne.opt.glb",height:he("oni-throne.opt.glb"),position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],scale:he("oni-throne.opt.glb")/38,children:[t.jsxs("mesh",{position:[0,6,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:l,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:l,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(ye,{name:"kagura-stage.opt.glb",height:he("kagura-stage.opt.glb"),position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:E.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*Ae.halfX*.9,28,Ae.depth/2-4],castShadow:l,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[Ae.halfX*2.3,5,Ae.depth+22]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(ye,{name:"oni-daiko.opt.glb",height:he("oni-daiko.opt.glb"),position:[h*(Ae.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,he("oni-daiko.opt.glb")/2,0],rotation:[0,0,Math.PI/2],scale:he("oni-daiko.opt.glb")/22,children:t.jsxs("mesh",{castShadow:l,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Gc,{})]})]})}function Gc(){const e=w.useRef(),o=w.useRef(!1);return se(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const a=new rt,s=new k,i=new wt,l=new k(1,1,1);for(let h=0;h<n.count;h++){const c=h/(n.count-1)*2-1;s.set(c*(D.halfX+26),Ae.y+74-(1-c*c)*20,D.halfZ+22),n.setMatrixAt(h,a.compose(s,i,l))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Oc({shadows:e=!0}){const{slabs:o,flights:n,tower:a}=Xs,s=w.useMemo(()=>{const i=[],l=h=>h*h*(3-2*h);for(const h of n)for(let d=0;d<=9;d++){const b=d/9;i.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*l(b)-1.2,R.lerp(h.z0,h.z1,b)])}return i},[n]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(i=>[a.z[0]+1,a.z[1]-1].map(l=>t.jsxs("mesh",{position:[i,128,l],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${i}${l}`))),t.jsxs("instancedMesh",{args:[null,null,s.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Dc,{points:s})]}),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(c),3.2,Math.abs(d)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l+5,h+Math.abs(d)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(c),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})]},`r${b}`))]})}function Dc({points:e}){const o=w.useRef(),n=w.useRef(!1);return se(()=>{if(n.current)return;const a=o.current?.parent;if(!a?.isInstancedMesh)return;const s=new rt,i=new wt,l=new k(1,1,1),h=new k;for(let c=0;c<Math.min(e.length,a.count);c++)h.set(e[c][0],e[c][1],e[c][2]),a.setMatrixAt(c,s.compose(h,i,l));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function Nc({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],s=i=>i*i*(3-2*i);for(const i of[-1,1])for(let l=0;l<=20;l++){const h=l/20;n.push({x:i*we.x,y:s(h)*Gt,z:R.lerp(we.zFoot,we.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,a)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[we.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.75})]},a)),[-1,1].map(n=>{const a=i=>i*i*(3-2*i),s=i=>{const l=[];for(let h=0;h<=16;h++){const c=h/16;l.push(new k(n*we.x+i,a(c)*Gt+7,R.lerp(we.zFoot,we.zTop,c)))}return new co(new lo(l),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:s(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:s(we.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})})]},n)})]})}function Hc({shadows:e=!0}){const o=w.useMemo(()=>Eo.map(([,,n,a])=>{const s=[];for(let i=0;i<=12;i++){const l=i/12*2-1;s.push(new k(l*n*.5,a*(1-l*l),0))}return new co(new lo(s),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[Eo.map(([n,a],s)=>t.jsxs("group",{position:[0,n,a],children:[t.jsx("mesh",{geometry:o[s],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.74})}),[-7,7].map(i=>t.jsx("mesh",{geometry:o[s],position:[0,7,i],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})},i))]},s)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,Eo[0][0]-12,Eo[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,ce.y,0]})]})}function Tr(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function _c({quality:e,shadows:o}){const n=w.useMemo(()=>{const s=Tr(712273),i=[],l=e==="low"?34:e==="mid"?68:108;let h=0;for(;i.length<l&&h<l*40;){h++;const c=(s()*2-1)*(ce.halfX-30),d=R.lerp(ce.zBack+40,ce.zFront-30,s());Math.abs(c)<62&&d>D.z+120||Math.abs(c)<70&&Math.abs(d-84)<58||Math.abs(Math.abs(c)-we.x)<24&&d<we.zFoot+18&&d>we.zTop-10||i.push({x:c,z:d,kind:i.length%4,rot:s()*Math.PI*2,k:.82+s()*.5})}return i},[e]),a=o;return t.jsx(t.Fragment,{children:n.map((s,i)=>{const l=[s.x,ce.y,s.z];if(s.kind===0){const c=he("sake-tower.opt.glb")*s.k,d=c*.24;return t.jsx(ye,{name:"sake-tower.opt.glb",height:c,position:l,rotation:s.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:l,children:[0,1,2].map(b=>t.jsxs("mesh",{position:[0,c*(.17+b*.3),0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[d-b*d*.16,d-b*d*.16,c*.29,10]}),t.jsx("meshStandardMaterial",{color:b%2?"#c9a86a":"#8e6a3c",roughness:.92})]},b))})},i)}if(s.kind===1){const c=he("oni-guardian.opt.glb")*s.k;return t.jsx(ye,{name:"oni-guardian.opt.glb",height:c,position:l,rotation:s.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.17,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[c*.43,c*.33,c*.43]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,c*.6,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[c*.2,c*.33,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*c*.13,c*.93,0],rotation:[0,0,d*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[c*.067,c*.27,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},d))]})},i)}if(s.kind===2){const c=he("wisteria-trellis.opt.glb")*s.k;return t.jsx(ye,{name:"wisteria-trellis.opt.glb",height:c,position:l,rotation:s.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.94,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[c*.7,c*.07,c*.07]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-.26,-.09,.09,.26].map(d=>t.jsxs("mesh",{position:[d*c,c*.47,0],children:[t.jsx("coneGeometry",{args:[c*.1,c*.88,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},d))]})},i)}const h=Sl*4*s.k;return t.jsxs("group",{position:l,rotation:[0,s.rot,0],children:[t.jsxs("mesh",{position:[0,h/2,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[h*.021,h*.021,h,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[h*.12,h*.65,0],children:[t.jsx("planeGeometry",{args:[h*.235,h*.7]}),t.jsx("meshStandardMaterial",{color:i%2?E.vermilion:"#e8dcc4",roughness:.95,side:_e,emissive:i%2?E.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},i)})})}function Bc({shadows:e}){const o=w.useMemo(()=>{const n=Tr(10560325),a=[];for(let s=0;s<52;s++)a.push({x:(n()*2-1)*(Je.halfX-40),z:(n()*2-1)*(Je.halfZ-40),rot:n()*Math.PI*2,keg:s%2===0});return a},[]);return t.jsx(t.Fragment,{children:o.map((n,a)=>n.keg?t.jsx(ye,{name:"powder-keg.opt.glb",height:he("powder-keg.opt.glb"),position:[n.x,Je.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Je.y+he("powder-keg.opt.glb")*.5,n.z],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[he("powder-keg.opt.glb")*.4,he("powder-keg.opt.glb")*.4,he("powder-keg.opt.glb"),10]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(ye,{name:"war-cannon.opt.glb",height:he("war-cannon.opt.glb"),position:[n.x,Je.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Je.y+he("war-cannon.opt.glb")*.42,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[he("war-cannon.opt.glb")*.18,he("war-cannon.opt.glb")*.23,he("war-cannon.opt.glb")*1.9,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function Uc(){const e=ve(o=>o.camera);return se((o,n)=>{const a=Math.min(n,.05),s=(e.position.x-xe.x-Fe.centre[0])/Fe.radii[0],i=(e.position.y-xe.y-Fe.centre[1])/Fe.radii[1],l=(e.position.z-xe.z-Fe.centre[2])/Fe.radii[2],h=Math.sqrt(s*s+i*i+l*l),c=R.clamp(1-(h-1)/.5,0,1);y.inside+=(c-y.inside)*(1-Math.pow(.02,a))}),null}function Wc({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[xe.x,xe.y,xe.z],children:[t.jsx(Uc,{}),t.jsx(zc,{quality:e,shadows:o}),t.jsx(Lc,{quality:e,shadows:o}),t.jsx(Hc,{shadows:o}),t.jsx(Nc,{shadows:o}),t.jsx(Oc,{shadows:o}),t.jsx(_c,{quality:e,shadows:o}),t.jsx(Bc,{shadows:o}),[-1,1].flatMap(n=>[0,1,2,3,4].map(a=>t.jsx(ye,{name:"banquet-table.opt.glb",height:he("banquet-table.opt.glb"),position:[n*(74+a%2*22),ce.y,D.z+186+a*34],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}-${a}`))),t.jsx(ye,{name:"treasure-kura.opt.glb",height:he("treasure-kura.opt.glb"),position:[Me.x-74,ce.y,D.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsx("group",{position:[Me.x-74,ce.y,D.z+96],rotation:[0,-.7,0],children:(()=>{const n=he("treasure-kura.opt.glb");return t.jsxs(t.Fragment,{children:[[-1,1].map(a=>[-1,1].map(s=>t.jsxs("mesh",{position:[a*n*.3,n*.08,s*n*.22],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.1,n*.16,n*.1]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${a}${s}`))),t.jsxs("mesh",{position:[0,n*.34,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.85,n*.38,n*.65]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,n*.6,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[n*.65,n*.3,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})})()})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1],[-64,22,1.8],[104,-46,.2],[-176,-118,2.7],[18,-142,1.4],[-30,96,.9]].map(([n,a,s],i)=>t.jsx(ye,{name:"bomb-sphere.opt.glb",height:he("bomb-sphere.opt.glb"),position:[n,Je.y,a],rotation:s,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Je.y+he("bomb-sphere.opt.glb")*.5,a],castShadow:o,children:[t.jsx("sphereGeometry",{args:[he("bomb-sphere.opt.glb")*.5,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${i}`)),[-1,1].map(n=>t.jsx(ye,{name:"keep-tier.opt.glb",height:he("keep-tier.opt.glb"),position:[n*(Me.x-40),Me.y+Me.tiers*Me.tierRise-6,D.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(ye,{name:"arch-bridge.opt.glb",height:he("arch-bridge.opt.glb"),position:[n*74,ce.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(ye,{name:"oni-guardian.opt.glb",height:Ft,position:[n*(Ne.halfX+26),Ne.y,Ne.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(Ne.halfX+26),Ne.y,Ne.z-26],children:[t.jsxs("mesh",{position:[0,Ft*.17,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[Ft*.41,Ft*.33,Ft*.41]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,Ft*.59,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[Ft*.185,Ft*.33,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,Ae.y+30,Ae.z-D.z+D.z+40],color:E.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,Me.y+120,60],color:E.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Je.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,Ne.y+132,Ne.z-40],color:E.lantern,intensity:13e3,distance:620,decay:2})]})}const Yc=Math.PI/2-.14,us=4;function Er({enabled:e,dom:o,zoomMin:n=.34,zoomMax:a=2.6,zoom0:s=1,pitch0:i=.16,pitchMin:l=-.62,pitchMax:h=Yc}){const c=w.useRef({yaw:0,pitch:i,zoom:s,smYaw:0,smPitch:i,smZoom:s,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:l,pitchMax:h,zoomMin:n,zoomMax:a,pitch0:i}).current;return w.useEffect(()=>{if(!e||!o)return;const d=o,b=new Map;let g=0,m=0,f=null;const p=()=>b.size,x=A=>{b.set(A.pointerId,{x:A.clientX,y:A.clientY});try{d.setPointerCapture?.(A.pointerId)}catch{}if(p()===1)c.dragging=!0,f={x:A.clientX,y:A.clientY,t:A.timeStamp};else if(p()===2){c.dragging=!1;const[r,T]=[...b.values()];g=Math.hypot(r.x-T.x,r.y-T.y),f=null}},u=A=>{const r=b.get(A.pointerId);if(!r)return;const T=A.clientX-r.x,P=A.clientY-r.y;if(r.x=A.clientX,r.y=A.clientY,p()>=2){const[M,G]=[...b.values()],F=Math.hypot(M.x-G.x,M.y-G.y);g>8&&F>8&&(c.zoom=R.clamp(c.zoom*(g/F),c.zoomMin,c.zoomMax),c.since=0),g=F;return}if(!c.dragging)return;f&&Math.hypot(A.clientX-f.x,A.clientY-f.y)>14&&(f=null);const C=Yn()*je.lookSens;c.yaw-=T*.005*C,c.pitch=R.clamp(c.pitch+P*.004*C*(je.invertY?-1:1),c.pitchMin,c.pitchMax),c.since=0,A.cancelable&&A.preventDefault()},v=A=>{b.has(A.pointerId)&&(b.delete(A.pointerId),p()<2&&(g=0),p()===0&&(c.dragging=!1,f&&A.timeStamp-f.t<260&&(A.timeStamp-m<340?(c.recentre=!0,m=0):m=A.timeStamp),f=null))},S=A=>{A.preventDefault(),c.zoom=R.clamp(c.zoom*(1+Math.sign(A.deltaY)*.1),c.zoomMin,c.zoomMax),c.since=0};d.addEventListener("pointerdown",x),d.addEventListener("pointermove",u,{passive:!1}),d.addEventListener("pointerup",v),d.addEventListener("pointercancel",v),window.addEventListener("pointerup",v);const z=A=>{b.delete(A.pointerId)&&(b.size<2&&(g=0),b.size===0&&(c.dragging=!1))};d.addEventListener("lostpointercapture",z);const j=()=>{b.clear(),g=0,c.dragging=!1};return window.addEventListener("blur",j),d.addEventListener("wheel",S,{passive:!1}),()=>{d.removeEventListener("pointerdown",x),d.removeEventListener("pointermove",u),d.removeEventListener("pointerup",v),d.removeEventListener("pointercancel",v),d.removeEventListener("lostpointercapture",z),window.removeEventListener("pointerup",v),window.removeEventListener("blur",j),d.removeEventListener("wheel",S),b.clear(),c.dragging=!1}},[e,o,c]),c}function qn(e,o,n=0){if(e.since+=o,I.zoom&&(e.zoom=R.clamp(e.zoom*(1-I.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,I.recentreQueued&&(I.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=us+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!je.freeCam&&!e.noRecentre&&!e.dragging&&e.since>us){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(De(.5,.72),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const a=e.dragging?6e-4:De(.002,.02),s=1-Math.pow(a,o);let i=e.yaw-e.smYaw;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;e.smYaw+=i*s,e.smPitch+=(e.pitch-e.smPitch)*s,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const ds=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeLength:.78,capeUrl:ko("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeLength:.56,capeUrl:ko("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],Vc=e=>ds.find(o=>o.id===e)??ds[0],$c=.22,ps=13,Kc=.09,Qc=.34,fs=9,Xc=1.1,Zc=.55,ms=12,qc=6,Jc=70,e0=.55,zn=26,t0=8,o0=5,gs=.8,n0=12,a0=.3,s0=.13,xs=3.4,r0=32,bs=.65,i0=1.1,l0=.5,c0=6,ws=6,We=new k,ft=new k,bo=new k;function h0(e,o,n,a,s,i,l,h){let d=0;for(let b=1;b<=16;b++){const g=b/16*l,m=e+a*g,f=o+s*g,p=n+i*g,x=h??le(m,p);if(f<=x){let u=d,v=g;for(let S=0;S<6;S++){const z=(u+v)/2,j=o+s*z,A=h??le(e+a*z,n+i*z);j<=A?v=z:u=z}return v}d=g}return null}function u0(e,o,n,a){const s=Math.min(e,.05),i=Ye.combat,l=Re.move,h=i.style==="sword";a.x=0,a.y=0,a.z=0,We.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),Ye.lookYaw=Math.atan2(We.x,We.z),Ye.playerFacing=o.yaw,i.bazookaCd=Math.max(0,i.bazookaCd-s),i.gigantCd=Math.max(0,i.gigantCd-s),i.hakiCd=Math.max(0,i.hakiCd-s),i.gear2Cd=Math.max(0,i.gear2Cd-s),n.gear2Queued&&(n.gear2Queued=!1,!i.gear2&&i.gear2Cd<=0&&!h&&(i.gear2=!0,i.gear2T=t0,Zt(.25),ft.set(o.x,o.y+1,o.z),Ct(ft,1.6,"haki"))),i.gear2&&(i.gear2T=Math.max(0,i.gear2T-s),i.gear2T<=0&&(i.gear2=!1,i.gear2Cd=o0));const c=i.gear2;i.balloon=R.damp(i.balloon,n.balloonHeld&&!h?1:0,8,s);const d=o.y+o.height*.9,b=h0(o.x,d,o.z,We.x,We.y,We.z,Jc,o.floorY);Ye.aim.valid=b!=null,b!=null&&(Ye.aim.distance=b,Ye.aim.point.set(o.x,d,o.z).addScaledVector(We,b));const g=!l.kind;if(n.rocketQueued&&(n.rocketQueued=!1,g&&b!=null&&(f(h?"flash":"rocket",e0),l.target.copy(Ye.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,g&&(f(h?"onigiri":"pistol",h?a0:$c),l.target.set(o.x,d,o.z).addScaledVector(We,h?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,g&&i.bazookaCd<=0))if(h){const p=Ye.waves.find(x=>!x.active);p&&(p.active=!0,p.k=0,p.pos.set(o.x,d*.92,o.z),p.dir.set(We.x,We.y*.35,We.z).normalize(),i.bazookaCd=i0,f("wavecast",.22),l.hit=!0,l.target.copy(p.pos).addScaledVector(p.dir,8),Zt(.1))}else f("bazooka",Qc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b,fs):fs),i.bazookaCd=Xc;n.gigantQueued&&(n.gigantQueued=!1,g&&i.gigantCd<=0&&(f(h?"sanzen":"gigant",h?l0:Zc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b+1.5,ms):ms),i.gigantCd=h?c0:qc));for(const p of Ye.waves){if(!p.active)continue;const x=p.k;p.k=Math.min(1,p.k+s/bs),p.pos.addScaledVector(p.dir,r0/bs*s);for(const v of[.35,.68,1])x<v&&p.k>=v&&Ct(p.pos,1.6,"slash");const u=o.floorY==null?le(p.pos.x,p.pos.z):o.floorY;(p.k>=1||p.pos.y<u+.4)&&(p.k<1&&Ct(p.pos,1.6,"slash"),p.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,i.hakiCd<=0&&Re.hakiT<=0&&(Re.hakiT=gs,Re.hakiFired=!1,i.hakiCd=n0)),Re.hakiT>0){Re.hakiT=Math.max(0,Re.hakiT-s);const p=1-Re.hakiT/gs;if(i.haki=p,!Re.hakiFired&&p>.35&&(Re.hakiFired=!0,ft.set(o.x,o.y,o.z),Ct(ft,3,"haki"),Zt(.9),h))for(let x=0;x<8;x++){const u=x/8*Math.PI*2;ft.set(o.x+Math.cos(u)*ws,o.y+.6,o.z+Math.sin(u)*ws),Ct(ft,1.4,"slash")}}else i.haki=0;const m=n.gatlingHeld&&!l.kind;if(i.gatling=R.damp(i.gatling,m?1:0,14,s),i.gatling>.2&&Ye.gatlingAim.copy(We),m){if(Re.gatT-=s,Re.gatT<=0)if(h)Re.gatT=s0,Re.tatsu+=1.9,ft.set(o.x+Math.cos(Re.tatsu)*xs,o.y+.6,o.z+Math.sin(Re.tatsu)*xs),Ct(ft,.7,"slash"),Zt(.04);else{Re.gatT=Kc*(c?.6:1);const p=b!=null?Math.min(b,ps):ps*.85;ft.set(o.x,d,o.z).addScaledVector(We,p),Ct(ft,.8,"punch"),Zt(.05)}}else Re.gatT=0;if(l.kind){l.t+=s;const p=Math.min(1,l.t/l.dur);if(!l.hit&&p>.45){l.hit=!0;const x=l.kind==="gigant"||l.kind==="sanzen"?3:1.3;if(Ct(l.target,x,h?"slash":"punch"),Zt(l.kind==="gigant"||l.kind==="sanzen"?.7:.18),l.kind==="rocket"||l.kind==="flash"){bo.copy(l.target).sub(ft.set(o.x,o.y,o.z));const u=bo.length()||1;a.x=bo.x/u*zn,a.y=Math.max(0,bo.y/u*zn*.5),a.z=bo.z/u*zn}else(l.kind==="pistol"||l.kind==="onigiri")&&(a.x=We.x*6,a.z=We.z*6)}l.t>=l.dur&&(l.kind=null,l.t=0),i.move=l.kind,i.moveK=l.kind?Math.min(1,l.t/l.dur):0}else i.move=null,i.moveK=0;return Ye.shake=Math.max(0,Ye.shake-s*2.4),a;function f(p,x){l.kind=p,l.t=0,l.dur=x,l.hit=!1}}const Re={move:{kind:null,t:0,dur:0,hit:!1,target:new k},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function d0(e="rubber"){const o=Ye.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,Re.move.kind=null,Re.move.t=0,Re.hakiT=0,Re.gatT=0,Ye.shake=0;for(const n of Ye.waves)n.active=!1}const Oo=64,p0=19,f0=16,m0=.92,ys=.52,vs=.3,g0=.04,x0=.0016,b0=.055,w0=1.9,y0=16,v0=62,M0=9,Ms={x:-.45,z:-2.4},js=.075,Do=new k,ks=new k;function eo(e,o){return R.clamp(-le(e,o)/26,0,1)}const No=e=>On[e]??On.sunny,j0=7,Ss=15,Oe=1.85,zs=1.1,k0=26,Ts=9.4,Es=21,S0=.011;function z0({mode:e,onMode:o,crew:n="luffy",vessel:a="sunny"}){const s=ve(P=>P.camera),i=ve(P=>P.gl),l=w.useRef(),h=w.useRef(),c=w.useRef({speed:0,grounded:!0,maxSpeed:15}),d=w.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,b=w.useRef({x:0,y:0,z:0}).current,g=Vc(n),m=w.useRef(),f=w.useRef(),p=w.useRef(),x=on(a),u=ot(x.hulls[0]),v=ot(x.hulls[1]??""),S=u||v,z=u?x.hulls[0]:v?x.hulls[1]:null,j=z?un(z,34):30,A=ot(x.crew),r=w.useRef({x:No(a).x,z:No(a).z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,fvy:0,airborne:!1,landing:0,fyaw0:Math.PI,stride:0,area:"hall",dx:0,dz:0,snapCam:!0,boarded:!1}).current,T=Er({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.28,zoomMax:4.2,pitch0:.14,pitchMin:-1,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return r.x=No(a).x,r.z=No(a).z,r.heading=Math.PI,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.flank=0,r.deckY=0,r.snapCam=!0,T.yaw=0,T.smYaw=0,T.pitch=.14,T.smPitch=.14,T.pitch0=.14,T.zoom=1,T.smZoom=1,T.noRecentre=!1,T.pitchMin=-1,T.pitchMax=1.44,r.swallowed=0,r.burst=1,r.burstFx=0,r.slam=0,r.drift=0,r.trim=0,r.bowY=gt(r.x,r.z,y.t,1).y,y.helm=null,Bn("helm"),()=>{y.helmActive=!1}},[e,a,r,T]),w.useEffect(()=>{if(e!=="foot")return;r.fvx=0,r.fvz=0,r.snapCam=!0,Y.chain!=="foot"&&Bn("foot"),d0(g.weapon==="swords"?"sword":"rubber");const P=(M,G)=>{T.yaw=M,T.smYaw=M,T.pitch=G,T.smPitch=G,T.pitch0=0,T.noRecentre=!0,T.pitchMin=-1.28,T.pitchMax=1.28};r.fvy=0,r.airborne=!1,r.landing=0;const C=y.footSpawn;if(y.footSpawn="hall",C==="deck"){r.area="deck",r.dx=0,r.dz=-j*.2,r.fy=y.ship.y+y.ship.deckY+Oe,r.fyaw=r.heading,P(r.heading+Math.PI,.44);return}if(C==="port"){r.area="island",r.fx=Q.x+40*N,r.fz=Q.z+40*N,r.fy=le(r.fx,r.fz)+Oe,r.fyaw=Math.atan2(ue.x-r.fx,ue.z-r.fz),P(r.fyaw+Math.PI,-.06);return}if(C==="rear"){r.area="island",r.fx=W.gate.x+W.dir[0]*26,r.fz=W.gate.z+W.dir[1]*26,r.fy=le(r.fx,r.fz)+Oe,r.fyaw=Math.atan2(-W.dir[0],-W.dir[1]),P(r.fyaw+Math.PI,.02);return}r.area="hall",r.fx=xe.x,r.fy=xe.y+Ne.y,r.fz=xe.z+ht.zTop,r.fyaw=Math.PI,r.fpitch=-.05,P(0,.05)},[e,r,T]),se((P,C)=>{if(e!=="helm"&&e!=="foot")return;const M=Math.min(C,.05);y.t+=M;const G=e==="helm",F=e==="foot"&&r.area==="deck";if(G||F){const B=r.heading,K=G?I.throttle:r.order,fe=G?I.rudder:0;G&&(r.order=I.throttle),r.throttle+=(K-r.throttle)*(1-Math.pow(.02,M)),r.rudder+=(fe-r.rudder)*(1-Math.pow(.005,M)),r.flank+=((G&&I.boost?1:0)-r.flank)*(1-Math.pow(g0,M));const O=(x.topSpeed??Oo)*(1+vs*r.flank),$=Math.sin(r.heading),te=Math.cos(r.heading),ae=Math.cos(r.heading),me=-Math.sin(r.heading);let de=r.vx*$+r.vz*te,Pe=r.vx*ae+r.vz*me;const Ue=1-y.shelter,Z=r.throttle>=0?r.throttle*O:r.throttle*p0,be=x.accel??f0;de+=R.clamp(Z-de,-be*2.5,be)*M,r.burst=Math.min(1,r.burst+M/(x.burst?.charge??M0)),G&&I.burstQueued&&(I.burstQueued=!1,r.burst>=.999&&(r.burst=0,r.burstFx=1,de+=x.burst?.push??v0,y.splash+=1)),r.burstFx*=Math.pow(.2,M);const He=gt(r.x,r.z,y.t,1);de-=(He.dx*$+He.dz*te)*y0*Ue*M,de-=de*Math.abs(de)*x0*M,Pe-=(Pe*Math.abs(Pe)*b0+Pe*w0)*M;const et=R.clamp(Math.abs(de)/16,0,1);de*=Math.pow(1-.11*Math.abs(r.rudder)*et,M),r.vx=$*de+ae*Pe,r.vz=te*de+me*Pe,r.speed=de,r.drift+=(R.clamp(Math.abs(Pe)/11,0,1)-r.drift)*(1-Math.pow(.1,M)),r.heading+=r.rudder*(x.turn??m0)*et*Math.sign(de||1)*M;const it=r.x+r.vx*M,yt=r.z+r.vz*M,Qe=j*ys,lt=it+$*Qe,U=yt+te*Qe;if(eo(lt,U)>.06)r.x=it,r.z=yt,r.aground+=(0-r.aground)*(1-Math.pow(.05,M));else{r.aground+=(1-r.aground)*(1-Math.pow(.02,M)),Vt(Math.abs(r.speed)*.0012*M*60,"AGROUND — SHE IS TAKING WATER");const Te=Math.pow(.06,M);r.speed*=Te,r.vx*=Te,r.vz*=Te;const st=6,Xt=eo(r.x+st,r.z)-eo(r.x-st,r.z),fo=eo(r.x,r.z+st)-eo(r.x,r.z-st),St=Math.hypot(Xt,fo)||1;r.x+=Xt/St*26*M,r.z+=fo/St*26*M}const Le=$s(r.x,r.z,0);r.x+=Le.vx*M,r.z+=Le.vz*M,r.x+=Ms.x*Ue*M,r.z+=Ms.z*Ue*M;const nt=He.dx*ae+He.dz*me;r.heading+=R.clamp(nt*.4,-js,js)*Ue*M;let Ge=Be[0],dt=1/0;for(const Te of Be){const st=(r.x-Te.x)**2+(r.z-Te.z)**2;st<dt&&(dt=st,Ge=Te)}if(mr(M,{danger:Le.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:Ge.x-r.x,toCentreZ:Ge.z-r.z,speed:r.speed,throttle:r.throttle})>=1||Le.danger>.94){const Te=Ge;r.x=Te.x+(Te.x>0?Te.r*1.85:-Te.r*1.85),r.z=Te.z+Te.r*1.5,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.heading=Math.PI,r.swallowed+=1,r.aground=1,Y.grip=0,Vt(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const re=So(r.x,r.z),Ve=R.lerp(1,.055,re)*R.smoothstep(eo(r.x,r.z),0,.3),q=gt(r.x,r.z,y.t,Ve);y.helmActive=!0,y.helmPos.set(r.x,q.y+j*.35,r.z),y.helmSpeed=R.clamp(Math.abs(r.speed)/(x.topSpeed??Oo),0,1),y.ship.x=r.x,y.ship.y=q.y,y.ship.z=r.z,y.ship.heading=r.heading,y.ship.loa=j,y.ship.deckY=z?$t(z,j):j*.16,y.ship.mastY=z?hr(z,j):j*.6;const ne=Le.vx*Math.cos(r.heading)-Le.vz*Math.sin(r.heading),J=R.clamp(Math.abs(r.speed)/(x.topSpeed??Oo),0,1),ge=R.clamp(r.rudder*et*J*.4+ne*.016,-.5,.5);r.heel+=(ge-Pe*.012-r.heel)*(1-Math.pow(.15,M));const $e=j*ys,at=gt(r.x+$*$e,r.z+te*$e,y.t,Ve).y,kt=R.clamp((r.bowY-at)/Math.max(M,.001),0,60);r.bowY=at;const Ie=R.clamp((kt-10)/24,0,1)*J*Ue;if(r.slam=Math.max(r.slam*Math.pow(.05,M),Ie),Ie>.25){const Te=Math.pow(1-.3*Ie,M);r.vx*=Te,r.vz*=Te}const Xe=J*.1*Math.sign(r.speed>=0?1:-1)+r.slam*.14+r.burstFx*.16;r.trim+=(Xe-r.trim)*(1-Math.pow(.1,M));const To=R.clamp(J*Ue*1.15+r.aground*.5+Le.danger*.8+r.slam*1.3+r.burstFx,0,1);r.spray+=(To-r.spray)*(1-Math.pow(.08,M));const Bt=l.current;if(Bt&&(Bt.visible=!0,Bt.position.set(r.x,q.y,r.z),Bt.rotation.set(R.clamp(q.dz*1.2,-.3,.3)-r.trim,r.heading,R.clamp(-q.dx,-.26,.26)+r.heel)),m.current&&(m.current.scale.z=1+Math.sin(y.t*1.6)*.08+r.burstFx*.4,m.current.scale.x=1+Ue*.06+r.burstFx*.12),f.current&&(f.current.material.opacity=r.spray*.42,f.current.scale.setScalar(.7+r.spray*.55)),p.current&&(p.current.material.opacity=R.clamp(.34*J+r.burstFx*.3,0,.62)*(.28+Ue*.72),p.current.scale.set(1+J*.75+r.drift*.6,1,1+J*.5)),r.deckY+=(q.y-r.deckY)*(1-Math.pow(De(2e-4,.05),M)),G){qn(T,M,r.heading-B);const Te=r.heading+Math.PI+T.smYaw,st=Math.cos(T.smPitch),Xt=Math.max(j*1.9,52)*T.smZoom*(1+J*De(.26,.1)+r.burstFx*De(.34,.12))*br(s.aspect),fo=R.lerp(q.y,r.deckY,je.comfort),St=Do.set(r.x+Math.sin(Te)*st*Xt,fo+j*.26+Math.sin(T.smPitch)*Xt,r.z+Math.cos(Te)*st*Xt),Cr=gt(St.x,St.z,y.t,Ve);St.y=Math.max(St.y,Cr.y+6),r.snapCam?(r.snapCam=!1,s.position.copy(St)):s.position.lerp(St,1-Math.pow(De(6e-4,.02),M));const Pr=Math.max(0,Math.cos(T.smYaw)),ba=J*De(66,34)*Pr;s.lookAt(ks.set(r.x+($+ae*R.clamp(Pe/40,-.4,.4))*ba,fo+12-r.trim*26*J*De(1,.35),r.z+(te+me*R.clamp(Pe/40,-.4,.4))*ba));const wa=De(1,0);wa>.001&&s.rotateZ((Math.sin(y.t*2.3)*.012*J+r.heel*.3+r.aground*Math.sin(y.t*21)*.02+r.slam*Math.sin(y.t*34)*.03+Le.danger*Math.sin(y.t*2.7)*.03)*wa),Wn(s,60+J*De(7,2)+r.burstFx*De(10,3),M,.06,xr)}const xa=Math.hypot(r.x-(Q.x+60*N),r.z-(Q.z+60*N));xa<90*N&&Math.abs(r.speed)<24&&(y.footSpawn="port",G?o?.("foot"):r.area==="deck"&&(r.area="island",r.fx=Q.x+40*N,r.fz=Q.z+40*N,r.fy=le(r.fx,r.fz)+Oe,r.fvx=0,r.fvz=0,r.fvy=0,r.fyaw=Math.atan2(ue.x-r.fx,ue.z-r.fz),T.yaw=T.smYaw=r.fyaw+Math.PI)),I.boardQueued&&(I.boardQueued=!1,G?(y.footSpawn="deck",o?.("foot")):r.area==="deck"&&o?.("helm")),G&&(y.helm={speed:r.speed,heading:r.heading,throttle:r.throttle,aground:r.aground,x:r.x,z:r.z,toGate:Math.min(Math.hypot(r.x,r.z-_t),Math.hypot(r.x,r.z-ro)),underFire:[_t,ro].some(Te=>{const st=Math.hypot(r.x,r.z-Te);return st>Xo.safe&&st<Xo.range}),moored:xa<180*N,maelstrom:Le.danger,swallowed:r.swallowed,burst:r.burst,drift:r.drift,maxSpeed:O,cruise:At.level,flank:r.flank,freeCam:je.freeCam},fr(M,y.helm)),y.shelter+=(re-y.shelter)*(1-Math.pow(.06,M)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}if(e==="foot"){qn(T,M,0);const B=I.boost?Ss:j0;r.fpitch+=(-T.smPitch-r.fpitch)*(1-Math.pow(1e-4,M));const K=I.walk.x,fe=I.walk.z,O=Math.hypot(K,fe),$=O>1?O:1,te=-Math.sin(T.smYaw),ae=-Math.cos(T.smYaw),me=-ae,de=te,Pe=(te*(fe/$)+me*(K/$))*B,Ue=(ae*(fe/$)+de*(K/$))*B,Z=(1-Math.pow(O>.02?2e-5:4e-7,M))*(r.airborne?.25:1);r.fvx+=(Pe-r.fvx)*Z,r.fvz+=(Ue-r.fvz)*Z;const be=r.fvx*M,He=r.fvz*M,et=r.area==="island"?(q,ne)=>le(q,ne):r.area==="deck"?()=>y.ship.y+y.ship.deckY:(q,ne,J)=>xe.y+Ii(q-xe.x,ne-xe.z,J-xe.y),it=r.area==="hall"?(q,ne,J)=>Ci(q-xe.x,ne-xe.z,J-xe.y)||Ti(q,J,ne)>.97:()=>!1;if(r.area==="deck"){const q=Math.cos(-y.ship.heading),ne=Math.sin(-y.ship.heading);r.dx+=be*q+He*-ne,r.dz+=be*ne+He*q;const J=y.ship.loa*.14,ge=y.ship.loa*.42;Math.abs(r.dx)>J&&(r.dx=Math.sign(r.dx)*J,r.fvx=0,r.fvz=0),Math.abs(r.dz)>ge&&(r.dz=Math.sign(r.dz)*ge,r.fvx=0,r.fvz=0);const $e=Math.cos(y.ship.heading),at=Math.sin(y.ship.heading);r.fx=y.ship.x+r.dx*$e+r.dz*at,r.fz=y.ship.z-r.dx*at+r.dz*$e}else if(r.area==="island"){const q=r.fx+be,ne=r.fz+He,J=le(r.fx,r.fz),ge=le(q,ne),$e=Math.hypot(be,He)||1e-6,at=(ge-J)/$e;(ge<=.3||at>=1.2&&ge>=J)&&(r.fvx=0,r.fvz=0),ge>.3&&(at<1.2||ge<J)&&(r.fx=q,r.fz=ne)}else{const q=r.fx+be,ne=r.fz+He,J=r.fy-Oe,ge=et(r.fx,r.fz,J),$e=r.airborne?J:ge;et(q,ne,$e)-$e>zs||it(q,ne,J)?(r.fvx=0,r.fvz=0):(r.fx=q,r.fz=ne)}const yt=r.fy-Oe,Qe=et(r.fx,r.fz,yt);if(r.airborne?(r.fvy-=k0*M,r.fy+=r.fvy*M,r.fy-Oe<=Qe&&(r.landing=-r.fvy,r.fy=Qe+Oe,r.fvy=0,r.airborne=!1,r.landing>Es&&(Vt((r.landing-Es)*S0,"A LONG WAY DOWN"),Ye.roll=0))):r.area==="deck"?(r.fy=Qe+Oe,r.fvy=0,r.landing=Math.max(0,r.landing-M*40),I.jumpQueued&&(I.jumpQueued=!1,r.fvy=Ts,r.airborne=!0)):yt-Qe>zs?(r.airborne=!0,r.fvy=0):(r.fy+=(Qe+Oe-r.fy)*(1-Math.pow(.002,M)),r.landing=Math.max(0,r.landing-M*40),I.jumpQueued&&(I.jumpQueued=!1,r.fvy=Ts,r.airborne=!0)),I.jumpQueued=!1,r.area==="island"){const q=Math.hypot(r.fx-ue.x,r.fz-ue.z),ne=Math.hypot(r.fx-W.gate.x,r.fz-W.gate.z);q<80?(r.area="hall",r.fx=xe.x,r.fz=xe.z+ht.zTop,r.fy=xe.y+Ne.y+Oe,r.fvy=0,r.airborne=!1,r.fyaw=Math.PI,T.yaw=T.smYaw=0,T.pitch=T.smPitch=.05):ne<40&&(r.area="hall",r.fx=xe.x+60,r.fz=xe.z+D.z+150,r.fy=xe.y+Oe,r.fvy=0,r.airborne=!1,r.fyaw=0,T.yaw=T.smYaw=Math.PI,T.pitch=T.smPitch=.04),y.helm={onFoot:!0,area:"island",x:r.fx,z:r.fz,fy:r.fy-xe.y,toMouth:q,toRear:ne,nearPort:Math.hypot(r.fx-Q.x,r.fz-Q.z)<Q.r*1.4};const J=So(r.fx,r.fz);y.shelter+=(J-y.shelter)*(1-Math.pow(.06,M))}else if(r.area==="deck")y.helm={onFoot:!0,area:"deck",x:r.fx,z:r.fz,speed:r.speed,heading:r.heading,throttle:r.throttle,maxSpeed:(x.topSpeed??Oo)*(1+vs*r.flank),moored:!1};else{const q=r.fz-xe.z;q>Ne.z+34&&(r.area="island",r.fx=ue.x,r.fz=ue.z+130,r.fy=le(r.fx,r.fz)+Oe,r.fvy=0,r.airborne=!1,r.fyaw=0,T.yaw=T.smYaw=Math.PI,T.pitch=T.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:r.fx,z:r.fz,lz:q,fy:r.fy-xe.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,M))}const lt=Math.hypot(r.fvx,r.fvz);r.stride+=lt*M;const U=g.height??1.74;if(lt>.4){let ne=Math.atan2(r.fvx,r.fvz)-r.fyaw;for(;ne>Math.PI;)ne-=Math.PI*2;for(;ne<-Math.PI;)ne+=Math.PI*2;r.fyaw+=ne*(1-Math.pow(4e-4,M))}r.fpitch+=(-T.smPitch-r.fpitch)*(1-Math.pow(1e-4,M)),r.pace=lt,c.current.speed=lt,c.current.maxSpeed=Ss,c.current.grounded=!r.airborne,c.current.vy=r.fvy,c.current.landing=r.landing,Ye.playerTurn=(r.fyaw-r.fyaw0)/Math.max(M,1e-4),r.fyaw0=r.fyaw,d.x=r.fx,d.y=r.fy-Oe,d.z=r.fz,d.yaw=T.smYaw+Math.PI,d.pitch=T.smPitch,d.height=U,d.floorY=r.area==="hall"?r.fy-Oe:null,u0(M,d,I,b),(b.x||b.z)&&(r.fvx+=b.x,r.fvz+=b.z);const ke=(r.area==="deck"?Math.max(U*2.6,y.ship.loa*.75):U*2.6)*T.smZoom,Le=Math.cos(T.smPitch),nt=r.area==="deck"?R.lerp(r.fy,r.deckY+y.ship.deckY+Oe,je.comfort):r.fy,Ge=nt+Math.sin(r.stride*1.6)*.05*De(1,.3),dt=r.fx+Math.sin(T.smYaw)*Le*ke,H=r.fz+Math.cos(T.smYaw)*Le*ke;let re=Ge+U*.28+Math.sin(T.smPitch)*ke;const Ve=r.area==="island"?le(dt,H):nt-Oe;re=Math.max(re,Ve+U*.6),r.area==="deck"&&(re=Math.max(re,nt-Oe+y.ship.mastY*1.06)),Do.set(dt,re,H),r.snapCam?(r.snapCam=!1,s.position.copy(Do)):s.position.lerp(Do,1-Math.pow(De(9e-4,.02),M)),s.lookAt(ks.set(r.fx,Ge-U*.1,r.fz)),Wn(s,r.area==="hall"?72:64,M,.02),h.current&&(h.current.position.set(r.fx,r.fy-Oe,r.fz),h.current.rotation.y=r.fyaw),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}y.fog=R.lerp(Ht.sea,Ht.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:h,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(Vr,{character:g,motion:c})}),t.jsxs("group",{ref:l,position:[0,-4e3,0],visible:e==="helm",children:[S&&t.jsx(ye,{name:z,loa:j,slim:dn(z),sink:zo(z),rotation:cn(z),tint:ca(z,x.tint),emissive:"#3a2a18",emissiveIntensity:.24,glow:tn(z)}),S&&A&&Yo.slice(0,2).map((P,C)=>{const[M,G]=la(z,j,P);return t.jsx(ye,{name:x.crew,height:hn,rotation:P[2],position:[M,$t(z,j),G]},`crew-${C}`)}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!S,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!S,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!S,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!S,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!S,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!S,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:m,position:[0,17.5,1.5],visible:!S,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:_e,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!S,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),["lantern port","lantern stbd"].map(P=>{const C=S?Ot(z,j,Dt(P)):[P.endsWith("port")?-3.2:3.2,8,-j*.13];return t.jsxs("group",{position:C,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[lr,7,5]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[en,en,1],children:t.jsx("spriteMaterial",{map:ua,color:E.lantern,transparent:!0,opacity:.5,depthWrite:!1,blending:ut,toneMapped:!1})})]},P)}),!rr(z)&&t.jsx(nn,{crew:x.flag,width:Jo(j),position:S?Ot(z,j,Dt("flag")):[0,26,-j*.06]}),t.jsxs("mesh",{ref:p,position:[0,.6,-j*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[j*.6,j*2.2]}),t.jsx("meshBasicMaterial",{map:Dn,color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:f,position:[0,j*.12,j*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[j*.85,j*.6]}),t.jsx("meshBasicMaterial",{map:bl,color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:ut})]})]})]})}const Rs=76,T0=24,As=26,E0=1.15,R0=.44,A0=.05,I0=.22,C0=70,Ho=340,Is=7,P0=6,Cs=60,_o=185,Ps=.42,F0=new k,Fs=new k,Bo=On.tang;function L0({mode:e,onMode:o}){const n=ve(S=>S.camera),a=ve(S=>S.gl),s=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef([]),d=w.useCallback(S=>{c.current=S},[]),b=ot("ship-tang.opt.glb"),g=ot("ship-sub.opt.glb"),m=b||g,f=ot("crew-heart.opt.glb"),p=b?"ship-tang.opt.glb":"ship-sub.opt.glb",x=un(p,28),u=w.useRef({x:Bo.x,z:Bo.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:0,orderedDepth:0,pitch:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,v=Er({enabled:e==="sub",dom:a.domElement,zoomMin:.32,zoomMax:3.4,pitch0:.15,pitchMin:-1.24,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return u.x=Bo.x,u.z=Bo.z,u.heading=Math.PI,u.speed=0,u.throttle=0,u.flank=0,u.depth=0,u.orderedDepth=0,u.berthing=0,u.snapCam=!0,v.yaw=0,v.smYaw=0,v.pitch=.15,v.smPitch=.15,v.pitch0=.15,v.zoom=1,v.smZoom=1,v.noRecentre=!1,u.heel=0,y.subActive=!0,y.helm=null,Bn("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,u,v]),se((S,z)=>{if(e!=="sub"){s.current&&s.current.position.set(0,-4e3,0);return}const j=Math.min(z,.05);y.t+=j;const A=u.heading,r=I.boost;u.throttle+=(I.throttle-u.throttle)*(1-Math.pow(.02,j)),u.flank+=((r?1:0)-u.flank)*(1-Math.pow(A0,j)),y.subThrottle=Math.abs(u.throttle),u.rudder+=(I.rudder-u.rudder)*(1-Math.pow(8e-4,j));const T=R.clamp(u.depth/15,0,1),P=Rs*(.7+.3*T)*(1+R0*u.flank),C=u.throttle>=0?u.throttle*P:u.throttle*T0;u.speed+=R.clamp(C-u.speed,-As*2,As)*j,u.speed-=u.speed*Math.abs(u.speed)*.0016*j;const M=R.lerp(I0,1,R.clamp(Math.abs(u.speed)/7,0,1));u.heading+=u.rudder*E0*M*Math.sign(u.speed>=0?1:-1)*j,u.orderedDepth-=I.planes*C0*j,u.orderedDepth=R.clamp(u.orderedDepth,0,Ho),I.surfaceQueued&&(I.surfaceQueued=!1,u.orderedDepth=0),I.periscopeQueued&&(I.periscopeQueued=!1,u.orderedDepth=P0);const G=u.x+Math.sin(u.heading)*u.speed*j,F=u.z+Math.cos(u.heading)*u.speed*j,B=$s(G,F,u.depth);u.x=G+B.vx*j,u.z=F+B.vz*j;const K=B.vx*Math.cos(u.heading)-B.vz*Math.sin(u.heading);u.heading+=K*.008*j;const fe=R.clamp(Math.abs(u.speed)/Rs,0,1),O=R.clamp(K*.02+u.rudder*M*fe*.34,-.6,.6);u.heel+=(O-u.heel)*(1-Math.pow(.12,j)),B.danger>.05&&(u.speed*=Math.pow(1-.22*B.danger,j));const $=le(u.x,u.z),te=Math.max(2,-$-Is),ae=u.depth<1.5;u.depth+=(u.orderedDepth-u.depth)*(1-Math.pow(.12,j)),u.depth>te?(u.scrape+=(1-u.scrape)*(1-Math.pow(.02,j)),u.depth=te,u.orderedDepth=Math.min(u.orderedDepth,te-2),Vt(Math.abs(u.speed)*.0016*j*60,"GROUNDED ON THE SHELF"),u.speed*=Math.pow(.3,j)):u.scrape+=(0-u.scrape)*(1-Math.pow(.05,j));const me=(u.depth-_o)/(Ho-_o);u.stress=me>0?Math.min(1,me*me):0,u.stress>0&&Vt(u.stress*.06*j,"HULL UNDER PRESSURE — COME UP");const de=u.x+Math.sin(u.heading)*26,Pe=u.z+Math.cos(u.heading)*26;if(le(de,Pe)>-u.depth+Is*.5){u.speed*=Math.pow(.1,j);const Ie=6,Xe=le(u.x+Ie,u.z)-le(u.x-Ie,u.z),To=le(u.x,u.z+Ie)-le(u.x,u.z-Ie),Bt=Math.hypot(Xe,To)||1;u.x-=Xe/Bt*20*j,u.z-=To/Bt*20*j,u.scrape=Math.max(u.scrape,.5)}const Z=Math.hypot(u.x-W.x,u.z-W.z);if(Z<W.pool*1.1&&u.berthing===0&&(u.berthing=1e-4),u.berthing>0){u.berthing=Math.min(1,u.berthing+j*.5),u.x+=(W.berth.x-u.x)*(1-Math.pow(.1,j)),u.z+=(W.berth.z-u.z)*(1-Math.pow(.1,j)),u.orderedDepth=0,u.speed*=Math.pow(.1,j);let Xe=Math.atan2(W.dir[0],W.dir[1])+Math.PI-u.heading;for(;Xe>Math.PI;)Xe-=Math.PI*2;for(;Xe<-Math.PI;)Xe+=Math.PI*2;u.heading+=Xe*(1-Math.pow(.2,j)),u.berthing>=1&&u.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}u.depth<1.5!==ae&&(y.splash+=1);const He=gt(u.x,u.z,y.t,1),et=1-R.clamp(u.depth/10,0,1),it=-u.depth+He.y*et,yt=R.clamp((u.orderedDepth-u.depth)*.05,-.34,.34)*Math.sign(u.speed>=0?1:-1)+He.dz*.8*et;u.pitch+=(yt-u.pitch)*(1-Math.pow(.05,j));const Qe=s.current;Qe&&(Qe.position.set(u.x,it,u.z),Qe.rotation.set(u.pitch+u.scrape*Math.sin(y.t*23)*.02,u.heading,-He.dx*.5*et+u.heel)),i.current&&(i.current.rotation.z+=u.throttle*9*j),l.current&&(l.current.visible=u.depth<2.5),h.current&&(h.current.visible=u.depth<7);const lt=tn(p);if(lt){const Ie=lt[1]*(1+y.underwater*1.1+R.clamp(u.depth/260,0,1)*.6);for(const Xe of c.current)Xe.emissiveIntensity=Ie}y.subPos.set(u.x,it,u.z),qn(v,j,u.heading-A);const U=u.heading+Math.PI+Ps+v.smYaw,ke=Math.cos(v.smPitch),Le=R.clamp(u.depth/240,0,1),nt=Math.max(x*2,52)*v.smZoom*(1-Le*.2)*br(n.aspect),Ge=F0.set(u.x+Math.sin(U)*ke*nt,it+x*.12+Math.sin(v.smPitch)*nt,u.z+Math.cos(U)*ke*nt),dt=le(Ge.x,Ge.z);Ge.y=Math.max(Ge.y,dt+5),u.depth>10&&(Ge.y=Math.min(Ge.y,He.y-3)),u.snapCam?(u.snapCam=!1,n.position.copy(Ge)):n.position.lerp(Ge,1-Math.pow(De(8e-4,.02),j));const H=Math.max(0,Math.cos(v.smYaw+Ps)),re=fe*De(46,26)*H;Fs.set(u.x+Math.sin(u.heading)*re,it+6-u.pitch*30*fe*De(1,.35),u.z+Math.cos(u.heading)*re),n.lookAt(Fs);const Ve=De(1,0);Ve>.001&&n.rotateZ((u.scrape*Math.sin(y.t*19)*.015+u.heel*.35+B.danger*Math.sin(y.t*3.1)*.02)*Ve),Wn(n,64+fe*De(6,2)+u.flank*De(2,.6),j,.06,xr);const q=gt(n.position.x,n.position.z,y.t,1),ne=R.clamp((q.y-n.position.y-1)/3,0,1);y.underwater+=(ne-y.underwater)*(1-Math.pow(.002,j)),y.depthBelow=Math.max(0,q.y-n.position.y);const J=R.lerp(8200,1700,y.underwater);Math.abs(n.far-J)>20&&(n.far=J,n.updateProjectionMatrix()),y.shelter+=((Z<W.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,j));let ge=Be[0],$e=1/0;for(const Ie of Be){const Xe=(u.x-Ie.x)**2+(u.z-Ie.z)**2;Xe<$e&&($e=Xe,ge=Ie)}mr(j,{danger:B.danger,headingX:Math.sin(u.heading),headingZ:Math.cos(u.heading),toCentreX:ge.x-u.x,toCentreZ:ge.z-u.z,speed:u.speed,throttle:u.throttle})>=1&&(Vt(.22,"CAUGHT IN THE VORTEX"),u.x=ge.x+(u.x>ge.x?1:-1)*ge.r*1.9,u.z=ge.z+ge.r*1.5,u.speed=0,u.orderedDepth=Math.min(Ho,u.depth+18),Y.grip=0,y.splash+=1);let kt=Math.atan2(W.x-u.x,W.z-u.z)-u.heading;for(;kt>Math.PI;)kt-=Math.PI*2;for(;kt<-Math.PI;)kt+=Math.PI*2;y.helm={sub:!0,speed:u.speed,maxSpeed:P,heading:u.heading,depth:u.depth,orderedDepth:u.orderedDepth,scrape:u.scrape,stress:u.stress,maelstrom:B.danger,toRear:Z,relRear:kt,berthing:u.berthing>0,x:u.x,z:u.z,maxDepth:Ho,crushDepth:_o,cruise:At.level,flank:u.flank,freeCam:je.freeCam,dark:R.clamp((u.depth-Cs)/(_o-Cs),0,1)},fr(j,y.helm)}),t.jsxs("group",{ref:s,position:[0,-4e3,0],children:[m&&t.jsx(ye,{name:p,loa:x,slim:dn(p),glow:tn(p),onMaterials:d,sink:zo(p),rotation:cn(p),tint:ca(p,"#c9b445"),emissive:"#2a2410",emissiveIntensity:.22}),t.jsx("group",{ref:l,position:[0,$t(p,x),-x*.07],children:f&&t.jsx(ye,{name:"crew-heart.opt.glb",height:hn,rotation:0})}),m&&[-1,1].map(S=>[0,1,2,3,4,5,6].map(z=>t.jsxs("mesh",{position:[S*tr(p,x)*.55,$t(p,x)-x*.02,x*(.24-z*.08)],children:[t.jsx("sphereGeometry",{args:[x*.011,6,5]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:2.4,toneMapped:!1})]},`port-${S}-${z}`))),t.jsxs("group",{visible:!m,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(S=>[0,1,2,3].map(z=>t.jsxs("mesh",{position:[S*5.1,1.2,8-z*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${S}-${z}`)))]}),(()=>{const S=Ot(p,x,Dt("headlamp")),z=Ot(p,x,Dt("stern lamp")),j=Ot(p,x,Dt("screw"));return t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:S,children:[t.jsx("sphereGeometry",{args:[x*.028,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[S[0],S[1],S[2]+x*.06],scale:[x*.7,x*.7,1],children:t.jsx("spriteMaterial",{map:ua,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:ut})}),t.jsxs("mesh",{position:z,children:[t.jsx("sphereGeometry",{args:[x*.016,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("group",{ref:i,position:j,children:[t.jsxs("mesh",{children:[t.jsx("torusGeometry",{args:[x*.03,x*.008,6,12]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.45})]}),[0,1,2,3].map(A=>t.jsxs("mesh",{rotation:[0,0,A/4*Math.PI*2],children:[t.jsx("boxGeometry",{args:[x*.052,x*.014,x*.006]}),t.jsx("meshStandardMaterial",{color:"#8a7530",roughness:.42,metalness:.55})]},A))]})]})})(),t.jsx(D0,{})]})}const G0=`
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
`,O0=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function D0(){const e=w.useRef(),o=w.useMemo(()=>{const s=new Float32Array(780),i=new Float32Array(260),l=new Float32Array(260),h=new Float32Array(260);for(let d=0;d<260;d++)s[d*3]=(Math.random()-.5)*3.4,s[d*3+1]=(Math.random()-.5)*2.6,s[d*3+2]=-14-Math.random()*4,i[d]=Math.random(),l[d]=.25+Math.random()*.3,h[d]=2+Math.random()*4;const c=new It;return c.setAttribute("position",new ee(s,3)),c.setAttribute("aPhase",new ee(i,1)),c.setAttribute("aRate",new ee(l,1)),c.setAttribute("aSize",new ee(h,1)),c.boundingSphere=new Kt(new k(0,0,-30),70),c},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new k(...ie(X.underGlow))}}),[]);return se((a,s)=>{const i=e.current?.uniforms;if(!i)return;i.uTime.value+=s;const l=y.subActive?y.subThrottle*y.underwater:0;i.uGain.value+=(l-i.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:G0,fragmentShader:O0,uniforms:n,transparent:!0,depthWrite:!1,blending:ut,fog:!1})})}const Rr=.42;let _=null,Rt=null,Se=null,Jn=!1,jt=!0;function N0(){try{const e=localStorage.getItem("oni.audio");e!==null&&(jt=e==="1")}catch{}return jt}function Tn(e){jt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return Rt&&_&&Rt.gain.setTargetAtTime(e?Rr:0,_.currentTime,.12),e&&_?.state==="suspended"&&_.resume(),jt}function H0(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),a=n.getChannelData(0);for(let s=0;s<o;s++)a[s]=Math.random()*2-1;return n}function wo(e,o,n,a,s,i,l){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const c=e.createBiquadFilter();c.type=n,c.frequency.value=a,c.Q.value=s;const d=e.createGain();return d.gain.value=i,h.connect(c).connect(d).connect(l),h.start(),{src:h,filt:c,gain:d}}function En(){if(Jn){_?.state==="suspended"&&_.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;_=new e,Jn=!0,Rt=_.createGain(),Rt.gain.value=jt?Rr:0;const o=_.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=_.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,Rt.connect(n).connect(o).connect(_.destination);const a=H0(_),s=_.createGain();s.gain.value=1,s.connect(Rt);const i=wo(_,a,"bandpass",480,.7,.3,s),l=wo(_,a,"highpass",1900,.5,0,s),h=wo(_,a,"lowpass",220,1.1,.22,s),c=wo(_,a,"lowpass",96,1.6,0,s),d=_.createGain();d.gain.value=1,d.connect(o);const b=_.createOscillator();b.type="sawtooth",b.frequency.value=41;const g=_.createBiquadFilter();g.type="lowpass",g.frequency.value=190,g.Q.value=1.2;const m=_.createGain();m.gain.value=0,b.connect(g).connect(m).connect(d),b.start();const f=_.createOscillator(),p=_.createOscillator(),x=_.createGain();f.frequency.value=.07,p.frequency.value=.113,x.gain.value=260,f.connect(x),p.connect(x),x.connect(i.filt.frequency),f.start(),p.start();const u=_.createGain();u.gain.value=0,u.connect(Rt);const v=_.createGain();v.gain.value=.16,v.connect(u);for(const[z,j]of[[146.83,1],[220,.5],[293.66,.3]]){const A=_.createOscillator();A.type="sine",A.frequency.value=z;const r=_.createGain();r.gain.value=j;const T=_.createOscillator(),P=_.createGain();T.frequency.value=.21+Math.random()*.1,P.gain.value=z*.004,T.connect(P).connect(A.frequency),T.start(),A.connect(r).connect(v),A.start()}const S=wo(_,a,"bandpass",900,3.2,.05,u);return Se={stormBus:s,festBus:u,wind:i,rain:l,sea:h,roar:c,breath:S,buf:a,comp:o,muffle:n,humGain:m,subBus:d},_}function _0(){if(!_||!Se||!jt)return;const e=_.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const a=_.createOscillator(),s=_.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+o),a.frequency.exponentialRampToValueAtTime(1180,e+o+.5),s.gain.setValueAtTime(0,e+o),s.gain.linearRampToValueAtTime(n,e+o+.012),s.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),a.connect(s).connect(Se.subBus),a.start(e+o),a.stop(e+o+1.5)}}function B0(e=1){if(!_||!Se||!jt)return;const o=_.currentTime,n=_.createBufferSource();n.buffer=Se.buf;const a=_.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,o),a.frequency.exponentialRampToValueAtTime(240,o+.5),a.Q.value=.7;const s=_.createGain();s.gain.setValueAtTime(0,o),s.gain.linearRampToValueAtTime(.5*e,o+.02),s.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(a).connect(s).connect(Rt),n.start(o),n.stop(o+.9)}function to(e,o=1,n=82){if(!_||!Se)return;const a=_.createOscillator(),s=_.createGain();a.type="sine",a.frequency.setValueAtTime(n*2.1,e),a.frequency.exponentialRampToValueAtTime(n,e+.06),a.frequency.exponentialRampToValueAtTime(n*.7,e+.5),s.gain.setValueAtTime(0,e),s.gain.linearRampToValueAtTime(o,e+.004),s.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(s).connect(Se.festBus),a.start(e),a.stop(e+.7);const i=_.createBufferSource();i.buffer=Se.buf;const l=_.createBiquadFilter();l.type="bandpass",l.frequency.value=1400,l.Q.value=.8;const h=_.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),i.connect(l).connect(h).connect(Se.festBus),i.start(e),i.stop(e+.12)}function U0(e=1,o=0){if(!_||!Se||!jt)return;const n=_.currentTime+o,a=_.createBufferSource();a.buffer=Se.buf,a.loop=!0;const s=_.createBiquadFilter();s.type="lowpass",s.frequency.setValueAtTime(320,n),s.frequency.exponentialRampToValueAtTime(70,n+2.6),s.Q.value=.9;const i=_.createGain(),l=.5*e;i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(l,n+.05),i.gain.exponentialRampToValueAtTime(l*.24,n+.7),i.gain.exponentialRampToValueAtTime(l*.42,n+1.35),i.gain.exponentialRampToValueAtTime(1e-4,n+3.4),a.connect(s).connect(i).connect(Se.stormBus),a.start(n),a.stop(n+3.6);const h=_.createOscillator(),c=_.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.32*e,n+.08),c.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(c).connect(Se.stormBus),h.start(n),h.stop(n+2.8)}function W0(e=.5){if(!_||!Se||!jt)return;const o=_.currentTime;for(const[n,a,s]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const i=_.createOscillator(),l=_.createGain();i.type="sine",i.frequency.value=61*n,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(e*a,o+.008),l.gain.exponentialRampToValueAtTime(1e-4,o+s),i.connect(l).connect(Rt),i.start(o),i.stop(o+s+.1)}}let mt=0,Rn=0,Ls=0,yo=0;function Y0(e){if(!Jn||!_||!Se||!jt)return;const o=_.currentTime,n=e.shelter,a=e.underwater,s=e.subActive?.12:1,i=Math.sin(n*Math.PI*.5)*s*(1-a*.92);Se.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),Se.festBus.gain.setTargetAtTime(i,o,.35),Se.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),Se.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),Se.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),Se.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),o,.3),Se.muffle.frequency.setTargetAtTime(18e3-a*17400,o,.18);const l=e.subActive?a*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(Se.humGain.gain.setTargetAtTime(l,o,.25),e.splash!==Ls&&(Ls=e.splash,B0(1)),e.subActive&&a>.5?yo===0?yo=o+1.2:o>=yo&&(_0(),yo=o+6.5):yo=0,n>.06){const c=.9090909090909091;for(mt<o&&(mt=o+.1);mt<o+.35;){const d=Rn%8,b=n*.9;d===0?to(mt,.85*b,74):d===2?to(mt,.45*b,88):d===4?to(mt,.7*b,74):d===6?to(mt,.4*b,92):d===7&&(to(mt,.3*b,96),to(mt+c*.5,.36*b,96)),Rn++,mt+=c}}else mt=0,Rn=0}function V0(){const e=w.useRef(!1),o=w.useRef(-1);return se(()=>{if(Y0(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,a=500+Math.abs(n.z)*900;U0(Math.min(1,.55+y.flash*.6),a/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&W0(.55),o.current=y.shot)}),null}function $0({mode:e,vessel:o}){return y.mode=e,y.vessel=o,se(()=>bc(),-100),null}function K0(){const e=ve(s=>s.gl),o=ve(s=>s.camera),n=ve(s=>s.setSize),a=ve(s=>s.size);return w.useEffect(()=>{const s=()=>{const i=window.innerWidth,l=window.innerHeight;i<2||l<2||a.width>i*.5&&a.height>l*.5||(n(i,l),e.setSize(i,l,!1),o.aspect=i/l,o.updateProjectionMatrix())};return s(),window.addEventListener("resize",s),document.addEventListener("visibilitychange",s),()=>{window.removeEventListener("resize",s),document.removeEventListener("visibilitychange",s)}},[e,o,n,a.width,a.height]),null}function Q0({every:e=12}){const o=ve(a=>a.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),se(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function X0({budget:e}){const o=ve(a=>a.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(Gr,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function Z0(){const e=ve(a=>a.gl),o=ve(a=>a.scene),n=ve(a=>a.camera);return w.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(o,n)}catch(s){console.warn("[onigashima] pre-compile skipped",s)}},900);return()=>clearTimeout(a)},[e,o,n]),null}function q0(){const{camera:e,scene:o,gl:n}=ve();return w.useEffect(()=>{},[e,o,n]),null}const J0=new ze(X.haze),eh=new ze(X.underHaze),th=new ze(X.abyss),Gs=new ze;function oh(){const e=ve(o=>o.scene);return se(()=>{if(!e.fog)return;const o=R.clamp(y.depthBelow/Ht.deepGrade,0,1),n=R.lerp(.0062,.0142,o);e.fog.density=R.lerp(y.fog,n,y.underwater),Gs.copy(eh).lerp(th,o*.8),e.fog.color.lerpColors(J0,Gs,y.underwater)}),null}function nh({quality:e,budget:o,onRails:n,playing:a,speed:s,onShot:i,mode:l,onMode:h,crew:c,vessel:d="sunny"}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,y.fog]}),t.jsx(Jr,{storm:y}),t.jsx(Il,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(Si,{quality:e,segments:o.segments}),t.jsx(wi,{quality:e,storm:y}),t.jsx(Ui,{quality:e,shadows:o.shadows}),t.jsx(Ra,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Ra,{quality:e,shadows:!1,z:ro,k:N*1.5}),t.jsx(Ki,{quality:e,shadows:o.shadows}),t.jsx(Xi,{quality:e,shadows:o.shadows}),t.jsx(kl,{quality:e}),t.jsx(Tl,{shadows:o.shadows}),t.jsx(Wc,{quality:e,shadows:o.shadows}),t.jsx(Nl,{quality:e}),t.jsx(Ul,{quality:e}),t.jsx(Xl,{quality:e}),t.jsx(rc,{quality:e}),t.jsx(Sc,{onRails:n&&l==="off",playing:a&&l==="off",speed:s,onShot:i,idle:l!=="off"}),t.jsx($0,{mode:l,vessel:d}),t.jsx($r,{}),t.jsx(Kr,{}),t.jsx(Qr,{}),t.jsx(z0,{mode:l,onMode:h,crew:c,vessel:d}),t.jsx(L0,{mode:l,onMode:h}),t.jsx(V0,{}),t.jsx(K0,{}),t.jsx(oh,{}),t.jsx(q0,{}),t.jsx(Z0,{}),t.jsx(X0,{budget:o}),o.shadows&&t.jsx(Q0,{every:o.shadowEvery})]})}const vo="#d63420",ah="rgba(8,6,16,0.72)",Os="(max-width: 860px), (max-height: 520px)",An="min(7.5vh, 62px)";function sh(e=2600,o=!0){const[n,a]=w.useState(!1);return w.useEffect(()=>{if(!o){a(!1);return}let s;const i=()=>{a(!1),clearTimeout(s),s=setTimeout(()=>a(!0),e)};i();for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(l,i,{passive:!0});return()=>{clearTimeout(s);for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(l,i)}},[e,o]),n}function rh(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(Os).matches);return w.useEffect(()=>{const n=window.matchMedia(Os),a=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",a):n.addListener(a),()=>{n.removeEventListener?n.removeEventListener("change",a):n.removeListener(a)}},[]),e}function Ze({on:e,onClick:o,children:n,title:a,wide:s,block:i}){return t.jsx("button",{onClick:o,title:a,style:{appearance:"none",border:`1px solid ${e?vo:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:s||i?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:i?"100%":void 0,textAlign:i?"right":"center",minHeight:32},children:n})}function ih({shot:e,shotIndex:o,shotCount:n,total:a,playing:s,onRails:i,speed:l,tier:h,override:c,dev:d,onPlay:b,onRailsToggle:g,onSpeed:m,onQuality:f,onRestart:p,audio:x,onAudio:u,mode:v,onMode:S,crew:z,onCrew:j,vessel:A,onVessel:r,onSwap:T,stage:P,veiled:C=!1}){const M=v!=="off",G=rh(),[F,B]=w.useState(!1),[K,fe]=w.useState(()=>({...je}));w.useEffect(()=>da(U=>fe({...U})),[]);const O=sh(2600,!M&&!F),$=w.useRef(),te=w.useRef(),ae=w.useRef(),me=w.useRef(),de=w.useRef(),Pe=w.useRef(),Ue=i&&!M;w.useEffect(()=>B(!1),[v]),w.useEffect(()=>{let U,ke=performance.now(),Le=0,nt=0;const Ge=dt=>{if(U=requestAnimationFrame(Ge),$.current&&($.current.style.transform=`scaleX(${P.progress||0})`),ae.current&&P.helm){const H=P.helm;if(H.onFoot)ae.current.textContent=H.area==="deck"?`ON DECK · ${Math.round(Math.abs(H.speed)*1.94)} KN · BRG ${String(Math.round((H.heading*180/Math.PI+360)%360)).padStart(3,"0")}°   —  nobody is at the wheel`:H.area==="island"?H.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":H.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(H.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(H.sub){const re=Math.abs(H.speed)*1.94;if(H.berthing)ae.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Ve=H.maelstrom>.22?H.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":H.stress>.02?"⚠ HULL UNDER PRESSURE":H.scrape>.3?"HULL ON THE ROCK":"",q=Math.abs(H.relRear*180/Math.PI),ne=q<6?"· ON COURSE":H.relRear>0?`◀ ${q.toFixed(0)}°`:`${q.toFixed(0)}° ▶`,J=10,ge=Math.round(H.depth/H.maxDepth*J),$e=Math.round(H.crushDepth/H.maxDepth*J);let at="";for(let Ie=0;Ie<J;Ie++)at+=Ie<ge?Ie>=$e?"▓":"█":Ie===$e?"┃":"·";const kt=H.cruise===2?" ⟲FLK":H.cruise===1?" ⟲AHD":"";ae.current.textContent=`DEPTH ${H.depth.toFixed(0).padStart(3,"0")}/${H.orderedDepth.toFixed(0).padStart(3,"0")}m ${at}  ${re.toFixed(0).padStart(2,"0")} KN${kt}
COVE ${Math.round(H.toRear)}m  ${ne}`+(Ve?`
${Ve}`:"")}}else{const re=Math.abs(H.speed)*1.94,Ve=(H.heading*180/Math.PI+180)%360,q=Math.round((H.burst??0)*5),ne=H.burstLabel??"BURST",J=H.burst>=.999?`${ne} ▶READY`:`${ne} ${"█".repeat(q)}${"·".repeat(5-q)}`,ge=H.cruise===2?"  ⟲FLANK":H.cruise===1?"  ⟲AHEAD":H.flank>.5?"  FLANK":"";ae.current.textContent=`${re.toFixed(0).padStart(2,"0")} KN   BRG ${Ve.toFixed(0).padStart(3,"0")}°   ${J}${ge}
`+(H.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":H.moored?"MOORING":H.aground>.3?"AGROUND — HELM OVER":H.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(H.toGate)}m`:H.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(H.toGate)}m`:`GATE ${Math.round(H.toGate)}m`)}}if(me.current){const H=Yl(),re=Wl(Y.chain);me.current.textContent=Y.done?"✔ OBJECTIVE COMPLETE":H?`▸ ${Y.step+1}/${re}  ${H.text}`:"",me.current.style.color=Y.done?"#8fe0a0":"#ffd9cf"}if(de.current){const H=Math.max(0,Math.min(1,Y.hull)),re=Math.max(0,Math.min(1,Y.grip)),Ve=J=>{const ge=Math.round(J*12);return"█".repeat(ge)+"·".repeat(12-ge)},q=H>.6?"#8fe0a0":H>.3?"#ffc46b":"#ff6b5a",ne=re>.66?"#ff6b5a":re>.33?"#ffc46b":"rgba(255,255,255,0.45)";de.current.innerHTML=`<span style="color:${q}">HULL ${Ve(H)}</span>`+(re>.02?`<span style="color:${ne};margin-left:14px">VORTEX ${Ve(re)}</span>`:"")}if(Pe.current){const H=Y.banner,re=Pe.current;H?(re.dataset.text!==H.text&&(re.dataset.text=H.text,re.innerHTML=`<div class="og-banner-main">${H.text}</div>`+(H.sub?`<div class="og-banner-sub">${H.sub}</div>`:""),re.style.animation="none",re.offsetWidth,re.style.animation=""),re.style.opacity="1"):(re.style.opacity="0",re.dataset.text="")}d&&te.current?(nt++,Le+=dt-ke,ke=dt,Le>400&&(te.current.textContent=`${Math.round(nt*1e3/Le)} fps · shelter ${P.shelter.toFixed(2)} · fog ${(P.fog*1e4).toFixed(1)}e-4 · flash ${P.flash.toFixed(2)}`,Le=0,nt=0)):ke=dt};return U=requestAnimationFrame(Ge),()=>cancelAnimationFrame(U)},[P,d]);const Z={opacity:O?.16:1,transform:O?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},be=[{key:"rails",on:!i,label:i?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:g,cinematicOnly:!0},{key:"helm",on:v==="helm",label:v==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>S(v==="helm"?"off":"helm")},{key:"deck",on:!1,label:"WALK THE DECK",title:"Step back from the wheel and walk the deck as your pirate — she sails on",click:()=>{P.footSpawn="deck",S("foot")},helmOnly:!0},{key:"sub",on:v==="sub",label:v==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>S(v==="sub"?"off":"sub")},{key:"foot",on:v==="foot",label:v==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>S(v==="foot"?"off":"foot")}],He=U=>v==="foot"?t.jsx(Ze,{on:!0,wide:!0,block:U,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>j?.(z==="zoro"?"luffy":"zoro"),children:z==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,et=U=>{if(!M||v==="foot")return null;const ke=ha(v,A);return t.jsx(Ze,{on:!0,wide:!0,block:U,title:`Take ${ke.who}'s ship — the three of them are sailing abreast (Y)`,onClick:()=>T?.(),children:U?`⇄  ${ke.name}`:`⇄ ${ke.who}`})},it=(U,ke)=>t.jsx(Ze,{on:U.on,onClick:U.click,title:U.title,wide:!0,block:ke,children:U.label},U.key),yt=U=>M?t.jsxs(t.Fragment,{children:[t.jsx(Ze,{on:K.comfort>.01,wide:!0,block:U,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:dc,children:K.comfort>.9?"COMFORT · FULL":K.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Ze,{on:K.freeCam,wide:!0,block:U,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>ao("freeCam"),children:K.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Ze,{on:Math.abs(K.lookSens-1)>.01,wide:!0,block:U,title:"How far a drag turns the view",onClick:pc,children:`LOOK ${K.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Ze,{on:K.invertY,wide:!0,block:U,title:"Invert the vertical look axis",onClick:()=>ao("invertY"),children:K.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,Qe=()=>M?t.jsx(Ze,{on:!K.hud,title:"Hide the readouts, the chart and the objective — just the picture (H)",onClick:()=>ao("hud"),children:K.hud?"◱":"◰"}):null,lt=U=>t.jsxs(t.Fragment,{children:[!M&&t.jsxs(t.Fragment,{children:[t.jsx(Ze,{on:s,onClick:b,title:"Play / pause the cinematic",block:U,children:s?U?"❙❙  PAUSE":"❙❙":U?"▶  PLAY":"▶"}),[.5,1,2].map(ke=>t.jsxs(Ze,{on:l===ke,onClick:()=>m(ke),title:`${ke}× speed`,block:U,children:[ke,"×"]},ke))]}),t.jsx(Ze,{on:!1,onClick:p,title:"Restart from the open sea",block:U,children:U?"↺  RESTART":"↺"}),t.jsx(Ze,{on:x,onClick:u,title:"Storm, taiko and a temple bell — all synthesised",block:U,children:x?U?"♪  SOUND ON":"♪":U?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Ze,{on:c!=="auto",wide:!0,block:U,title:"Render tier",onClick:()=>f(c==="auto"?"low":c==="low"?"mobile":c==="mobile"?"high":"auto"),children:c==="auto"?`AUTO · ${h.toUpperCase()}`:c.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!C&&t.jsxs(t.Fragment,{children:[[0,1].map(U=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[U?"bottom":"top"]:0,height:Ue?An:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},U)),t.jsxs("div",{className:"og-tategaki",style:{opacity:M||F?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:M?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${vo}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:M?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:$,style:{height:"100%",background:`linear-gradient(90deg, ${vo}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${vo}`}})}),t.jsx("div",{className:`og-chrome${M?"":" og-chrome-bottom"}`,style:{...M?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...Z},children:G?t.jsxs(t.Fragment,{children:[M&&t.jsx(Ze,{on:!0,onClick:()=>S("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),Qe(),t.jsx(Ze,{on:F,onClick:()=>B(U=>!U),title:"Menu",children:F?"✕":"☰"}),F&&t.jsxs("div",{className:"og-menu",children:[M&&t.jsxs(t.Fragment,{children:[He(!0),et(!0),yt(!0),t.jsx("div",{className:"og-menu-rule"})]}),be.filter(U=>!(U.cinematicOnly&&M)&&!(U.helmOnly&&v!=="helm")).map(U=>it(U,!0)),t.jsx("div",{className:"og-menu-rule"}),lt(!0)]})]}):t.jsxs(t.Fragment,{children:[Qe(),He(!1),et(!1),yt(!1),lt(!1),be.filter(U=>!(U.cinematicOnly&&M)&&!(U.helmOnly&&v!=="helm")).map(U=>it(U,!1))]})}),!M&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...Z,pointerEvents:"none"},children:[i?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:i?`  ·  ${Math.round(a)}s`:""})]}),M&&K.hud&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:me,className:"og-objective"}),t.jsx("div",{ref:ae,className:"og-readout"}),t.jsx("div",{ref:de,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:v==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · T WALK THE DECK · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":v==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":z==="zoro"?"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),M&&K.hud&&t.jsx("div",{ref:Pe,className:"og-banner"}),d&&t.jsx("div",{ref:te,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:ah,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${Ue?An:"0px"};
          --og-bottom: ${Ue?An:"0px"};
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
          color: ${vo};
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
      `})]})}const In="#d63420",lh=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function ch({onPick:e}){const[o,n]=w.useState(!1),a=w.useRef(),s=620,i=c=>{o||(n(!0),e(c))},[l,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const c=setTimeout(()=>h(!0),s);return()=>clearTimeout(c)},[o]),w.useEffect(()=>{const c=d=>{(d.key==="Escape"||d.key==="Enter")&&i("off")};return window.addEventListener("keydown",c),()=>window.removeEventListener("keydown",c)}),l?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${s}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:lh.map((c,d)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+d*.07}s`},onClick:()=>i(c.key),children:[t.jsx("span",{className:"og-entry-kanji",children:c.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:c.label}),t.jsx("span",{className:"og-entry-sub",children:c.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},c.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${In};
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
          border-color: ${In};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${In};
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
      `})]})}const ma="#d63420",ga="#4aa9c9",hh=(e,o,n)=>e<o?o:e>n?n:e;function Ar(e,o,n){const a=w.useRef(o);a.current=o;const s=w.useRef(null),i=w.useRef({x:0,y:0});w.useEffect(()=>{const l=e.current;if(!l||!n)return;const h=m=>{if(s.current===null){s.current=m.pointerId,i.current={x:m.clientX,y:m.clientY};try{l.setPointerCapture?.(m.pointerId)}catch{}a.current.onMove(0,0,m.clientX,m.clientY),m.preventDefault()}},c=m=>{if(m.pointerId!==s.current)return;const f=i.current;a.current.onMove(m.clientX-f.x,m.clientY-f.y,f.x,f.y),m.preventDefault()},d=m=>{m.pointerId===s.current&&(s.current=null,a.current.onEnd(),m.cancelable&&m.preventDefault())};l.addEventListener("pointerdown",h),l.addEventListener("pointermove",c),l.addEventListener("pointerup",d),l.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),window.addEventListener("pointercancel",d);const b=()=>{s.current!==null&&(s.current=null,a.current.onEnd())};l.addEventListener("lostpointercapture",b),window.addEventListener("blur",b);const g=()=>{document.visibilityState!=="visible"&&b()};return document.addEventListener("visibilitychange",g),()=>{l.removeEventListener("pointerdown",h),l.removeEventListener("pointermove",c),l.removeEventListener("pointerup",d),l.removeEventListener("pointercancel",d),l.removeEventListener("lostpointercapture",b),window.removeEventListener("pointerup",d),window.removeEventListener("pointercancel",d),window.removeEventListener("blur",b),document.removeEventListener("visibilitychange",g)}},[e,n])}function Ds({label:e,sub:o,onDown:n,onUp:a,tone:s="plain",wide:i=!1}){const[l,h]=w.useState(!1),c=w.useRef();w.useEffect(()=>{const b=c.current;if(!b)return;let g=null;const m=p=>{g=p.pointerId;try{b.setPointerCapture?.(g)}catch{}h(!0),n(),p.preventDefault(),p.stopPropagation()},f=p=>{p.pointerId===g&&(g=null,h(!1),a(),p.preventDefault(),p.stopPropagation())};return b.addEventListener("pointerdown",m),b.addEventListener("pointerup",f),b.addEventListener("pointercancel",f),b.addEventListener("pointerleave",f),()=>{b.removeEventListener("pointerdown",m),b.removeEventListener("pointerup",f),b.removeEventListener("pointercancel",f),b.removeEventListener("pointerleave",f)}},[n,a]);const d=s==="hot"?ma:s==="cool"?ga:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${l?d:"rgba(255,255,255,0.18)"}`,background:l?`color-mix(in srgb, ${d} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:l?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function qe({label:e,sub:o,onTap:n,on:a,tone:s="plain",wide:i=!1}){const l=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const d=l.current;if(!d)return;const b=g=>{h.current(),g.preventDefault(),g.stopPropagation()};return d.addEventListener("pointerdown",b),()=>d.removeEventListener("pointerdown",b)},[]);const c=s==="hot"?ma:s==="cool"?ga:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:l,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${a?c:"rgba(255,255,255,0.18)"}`,background:a?`color-mix(in srgb, ${c} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:a?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function uh(){const[e,o]=w.useState(At.level);return w.useEffect(()=>gc(o),[]),t.jsx(qe,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:yr})}function dh({simple:e=!1}){const[o,n]=w.useState(je.freeCam);w.useEffect(()=>da(s=>n(s.freeCam)),[]);const a=w.useRef(null);return e?t.jsx(qe,{label:"LEVEL",sub:"view",onTap:()=>I.recentreQueued=!0}):t.jsx(qe,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const s=performance.now();if(a.current&&s-a.current<420){a.current=null,ao("freeCam"),I.recentreQueued=!0;return}a.current=s,I.recentreQueued=!0}})}function ph({active:e}){const o=w.useRef(),n=w.useRef(),a=w.useRef(),s=78;return w.useEffect(()=>{if(!e)return;let i;const l=()=>{i=requestAnimationFrame(l);const h=a.current,c=y.helm;h&&(h.textContent=c?.sub?String(Math.round(c.orderedDepth)):"⇕")};return i=requestAnimationFrame(l),()=>cancelAnimationFrame(i)},[e]),Ar(o,{onMove:(i,l,h,c)=>{const d=o.current;if(!d)return;const b=d.getBoundingClientRect(),g=b.top+b.height/2,m=hh((c+l-g)/s,-1,1),f=Math.abs(m)<.1?0:m;oe.active=!0,oe.planes=-f;const p=n.current;p&&(p.style.transform=`translate(-50%, calc(-50% + ${m*s}px))`,p.style.borderColor=ga,p.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{oe.planes=0;const i=n.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:a,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function fh({mode:e,crew:o="luffy",vessel:n="sunny",hud:a=!0,onSwap:s}){const[i,l]=w.useState(!1);w.useEffect(()=>{if(e!=="foot"){l(!1);return}const S=setInterval(()=>l(y.helm?.area==="deck"),200);return()=>clearInterval(S)},[e]);const h=w.useRef(),c=w.useRef(),d=w.useRef(),b=w.useRef(),g=62,m=7,f=w.useRef(e);if(f.current=e,Ar(h,{onMove:(S,z,j,A)=>{const r=Math.hypot(S,z),T=r>g?g/r:1,P=S*T,C=z*T,M=c.current,G=d.current;M&&(M.style.transform=`translate(${j-g}px, ${A-g}px)`,M.style.opacity="1"),G&&(G.style.transform=`translate(${j+P-26}px, ${A+C-26}px)`,G.style.opacity="1"),b.current&&(b.current.style.opacity="0");const F=Math.abs(P)<m?0:P/g,B=Math.abs(C)<m?0:C/g;oe.active=!0,f.current==="foot"?(oe.walk.x=F,oe.walk.z=-B):(oe.throttle=-B,oe.rudder=-F)},onEnd:()=>{c.current&&(c.current.style.opacity="0"),d.current&&(d.current.style.opacity="0"),b.current&&(b.current.style.opacity=""),oe.throttle=0,oe.rudder=0,oe.walk.x=0,oe.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{oe.throttle=0,oe.rudder=0,oe.planes=0,oe.boost=!1,oe.walk.x=0,oe.walk.z=0},[e]),e==="off")return null;const p=e==="sub",x=e==="foot",u=i,v=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:h,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:c,style:{position:"fixed",left:0,top:0,width:g*2,height:g*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:d,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${ma}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),a&&t.jsxs("div",{ref:b,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:x?"DRAG TO WALK":"DRAG TO STEER"})]}),a&&t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[p&&t.jsx(ph,{active:!0}),t.jsxs("div",{className:"og-actions",children:[p&&t.jsx(qe,{label:"SURFACE",sub:"blow all",onTap:()=>I.surfaceQueued=!0}),p&&t.jsx(qe,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>I.periscopeQueued=!0}),e==="helm"&&t.jsx(qe,{label:on(n).burst?.label??"BURST",sub:on(n).burst?.sub??"coup de",tone:"cool",onTap:()=>I.burstQueued=!0}),(e==="helm"||u)&&t.jsx(qe,{label:u?"TAKE WHEEL":"WALK DECK",sub:u?"back to it":"she sails on",onTap:()=>I.boardQueued=!0}),x&&t.jsx(qe,{label:"JUMP",sub:"↑",onTap:()=>I.jumpQueued=!0}),x&&t.jsxs(t.Fragment,{children:[t.jsx(qe,{label:v?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>I.pistolQueued=!0}),t.jsx(qe,{label:v?"YAKKO":"BAZOOKA",sub:v?"flying cut":"both fists",tone:"cool",onTap:()=>I.bazookaQueued=!0}),t.jsx(qe,{label:v?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>I.gigantQueued=!0}),t.jsx(qe,{label:v?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>I.rocketQueued=!0}),t.jsx(qe,{label:v?"ASURA":"HAKI",sub:"burst",onTap:()=>I.hakiQueued=!0}),!v&&t.jsx(qe,{label:"GEAR 2",sub:"overdrive",onTap:()=>I.gear2Queued=!0}),t.jsx(Ds,{label:v?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>oe.gatling=!0,onUp:()=>oe.gatling=!1})]}),!x&&t.jsx(qe,{label:"SWAP SHIP",sub:ha(e,n).who,tone:"cool",onTap:()=>s?.()}),!x&&t.jsx(uh,{}),t.jsx(Ds,{label:x?"RUN":"FLANK",sub:x?"»":"over",tone:"hot",onDown:()=>oe.boost=!0,onUp:()=>oe.boost=!1}),t.jsx(dh,{simple:x})]})]}),t.jsx("style",{children:`
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
      `})]})}const mh=168,gh=122,Ns="(max-width: 860px), (max-height: 520px)",Cn=1950,Hs={x:0,z:340},ct={sea:"rgba(8,10,22,0.72)",ring:"#57506a",land:"#2e2836",skull:"#8a7358",fairway:"rgba(160,200,255,0.12)",gate:"#e8402a",port:"#f0ad50",rear:"#8fd4f2",whirl:"rgba(140,170,235,0.55)",you:"#ffe6a0"},Ir=e=>({px:o=>(o-Hs.x)/Cn*(e/2)+e/2,pz:o=>(o-Hs.z)/Cn*(e/2)+e/2,pl:o=>o/Cn*(e/2)});function xh(e,o,n){const{px:a,pz:s,pl:i}=Ir(n);e.save(),e.scale(o,o),e.clearRect(0,0,n,n),e.fillStyle=ct.sea,e.fillRect(0,0,n,n),e.fillStyle=ct.fairway,e.fillRect(a(-Qo.halfWidth),0,i(Qo.halfWidth*2),n),e.strokeStyle=ct.ring,e.lineWidth=i(bt*.34),e.beginPath(),e.arc(a(pe.x),s(pe.z),i(bt),Math.PI*.34,Math.PI*.66,!0),e.stroke(),e.fillStyle=ct.skull,e.beginPath(),e.ellipse(a(L.x),s(L.z),i(L.r*L.squash[0]),i(L.r*L.squash[2]),0,0,Math.PI*2),e.fill(),e.strokeStyle=ct.gate,e.lineWidth=2;for(const[h,c]of[[_t,1],[ro,1.5]])e.beginPath(),e.moveTo(a(-95*N*c),s(h)),e.lineTo(a(95*N*c),s(h)),e.stroke();e.strokeStyle=ct.whirl,e.lineWidth=1;for(const h of Be)e.beginPath(),e.arc(a(h.x),s(h.z),i(h.r),0,Math.PI*2),e.stroke();const l=(h,c,d,b=2.6)=>{e.fillStyle=d,e.beginPath(),e.arc(a(h),s(c),b,0,Math.PI*2),e.fill()};l(Q.x,Q.z,ct.port),l(ue.x,ue.z,ct.land,2),l(W.gate.x,W.gate.z,ct.rear),e.restore()}function bh({mode:e}){const o=w.useRef(),n=w.useRef(),a=typeof window>"u"?1:Math.min(2,window.devicePixelRatio||1),[s,i]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ns).matches);w.useEffect(()=>{const b=window.matchMedia(Ns),g=()=>i(b.matches);return b.addEventListener?b.addEventListener("change",g):b.addListener(g),()=>{b.removeEventListener?b.removeEventListener("change",g):b.removeListener(g)}},[]);const[l,h]=w.useState(!0),c=s?gh:mh,d=w.useMemo(()=>{if(typeof document>"u")return null;const b=document.createElement("canvas");return b.width=c*a,b.height=c*a,xh(b.getContext("2d"),a,c),b},[a,c]);return w.useEffect(()=>{if(!n.current||!d||!l)return;const{px:b,pz:g}=Ir(c),m=n.current.getContext("2d");let f;const p=()=>{f=requestAnimationFrame(p);const x=y.helm;if(m.setTransform(1,0,0,1,0,0),m.clearRect(0,0,c*a,c*a),m.drawImage(d,0,0),!x||x.x===void 0)return;m.save(),m.scale(a,a);const u=b(x.x),v=g(x.z),S=x.sub&&x.depth>4;m.translate(u,v),x.heading!==void 0?(m.rotate(x.heading+Math.PI),m.beginPath(),m.moveTo(0,-5.5),m.lineTo(3.4,4),m.lineTo(0,2),m.lineTo(-3.4,4),m.closePath()):(m.beginPath(),m.arc(0,0,3,0,Math.PI*2)),m.fillStyle=S?"rgba(0,0,0,0)":ct.you,m.strokeStyle=ct.you,m.lineWidth=1.2,m.fill(),m.stroke(),m.restore(),S&&(m.save(),m.scale(a,a),m.fillStyle=ct.rear,m.font="600 9px ui-monospace, SFMono-Regular, Menlo, monospace",m.textAlign="right",m.fillText(`${Math.round(x.depth)}m DOWN`,c-6,c-6),m.restore())};return p(),()=>cancelAnimationFrame(f)},[d,a,e,l,c]),e==="off"?null:l?t.jsxs("div",{className:"og-minimap",style:{position:"fixed",left:14,bottom:14,zIndex:12,width:c,height:c,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.16)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",pointerEvents:"none"},children:[t.jsx("canvas",{ref:n,width:c*a,height:c*a,style:{width:c,height:c,display:"block"}}),t.jsx("div",{style:{position:"absolute",top:4,left:6,font:"600 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)"},children:"鬼ヶ島"}),t.jsx("button",{className:"og-map-close",onClick:()=>h(!1),"aria-label":"Hide the chart",children:"✕"}),t.jsx("canvas",{ref:o,style:{display:"none"}}),t.jsx("style",{children:_s})]}):t.jsxs(t.Fragment,{children:[t.jsx("button",{className:"og-map-tab",title:"Show the chart",onClick:()=>h(!0),"aria-label":"Show the chart",children:"鬼ヶ島 CHART"}),t.jsx("style",{children:_s})]})}const _s=`
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
`,Bs={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function wh(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const yh=null;function Sh(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(wh),[n,a]=w.useState("auto"),s=n==="auto"?o:n,i=Bs[s]??Bs.high;w.useEffect(()=>{Fi(i.scene!=="low")},[i.scene]),w.useMemo(()=>Vs(i.scene),[i.scene]),w.useMemo(()=>mc(),[]),w.useEffect(()=>xc(),[]);const l=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,c]=w.useState(0),[d,b]=w.useState(!0),[g,m]=w.useState(!0),[f,p]=w.useState(1),[x,u]=w.useState(ls[0]),[v,S]=w.useState(0),[z,j]=w.useState(N0),[A,r]=w.useState(()=>{if(typeof location>"u")return"off";const Z=new URLSearchParams(location.search).get("mode");return Z==="helm"||Z==="sub"||Z==="foot"?Z:"off"}),[T,P]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy"),[C,M]=w.useState(()=>typeof location>"u"?"sunny":new URLSearchParams(location.search).get("ship")==="punk"?"punk":"sunny");w.useEffect(()=>{if(!z)return;const Z=()=>{En(),Tn(!0)};for(const be of["pointerdown","keydown","touchstart"])window.addEventListener(be,Z,{once:!0,passive:!0});return()=>{for(const be of["pointerdown","keydown","touchstart"])window.removeEventListener(be,Z)}},[z]);const G=w.useCallback(()=>{j(Z=>{const be=!Z;return be&&En(),Tn(be),be})},[]),[F,B]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),K=w.useCallback(Z=>{z&&(En(),Tn(!0)),Z==="off"?(y.jumpTo=0,b(!0),m(!0)):r(Z),B(!0)},[z]),[fe,O]=w.useState(()=>je.hud);w.useEffect(()=>da(Z=>O(Z.hud)),[]);const[$,te]=w.useState(!1),ae=w.useRef(!0);w.useEffect(()=>{if(Kn(),ae.current){ae.current=!1;return}te(!0);const Z=setTimeout(()=>te(!1),210);return()=>clearTimeout(Z)},[A]);const me=w.useCallback(()=>{const Z=ha(A,C);Kn(),M(Z.vessel),r(Z.mode)},[A,C]);w.useEffect(()=>{if(A==="off")return;let Z;const be=()=>{Z=requestAnimationFrame(be),I.swapQueued&&(I.swapQueued=!1,me())};return Z=requestAnimationFrame(be),()=>cancelAnimationFrame(Z)},[A,me]);const de=w.useCallback((Z,be)=>{S(Z),u(be)},[]),Pe=w.useCallback(()=>{Pi(),c(Z=>Z+1),b(!0),m(!0)},[]),Ue=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(yh,{})}):t.jsxs(t.Fragment,{children:[t.jsx(Or,{shadows:i.shadows,dpr:i.dpr,gl:{antialias:i.aa,powerPreference:"high-performance",toneMapping:Yr,toneMappingExposure:Xr,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(nh,{quality:i.scene,budget:i,onRails:g,playing:d,speed:f,onShot:de,mode:A,onMode:r,crew:T,vessel:C},h)})}),l&&F&&t.jsx(fh,{mode:A,crew:T,vessel:C,hud:fe,onSwap:me}),F&&fe&&t.jsx(bh,{mode:A}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:$?1:0,transition:$?"opacity .2s ease-in":"opacity .42s ease-out"}}),!F&&t.jsx(ch,{onPick:K}),t.jsx(ih,{veiled:!F,shot:x,shotIndex:v,shotCount:ls.length,total:Zn,playing:d,onRails:g,speed:f,tier:s,override:n,dev:Ue,onPlay:()=>b(Z=>!Z),onRailsToggle:()=>m(Z=>!Z),onSpeed:p,onQuality:a,onRestart:Pe,audio:z,onAudio:G,mode:A,onMode:r,crew:T,onCrew:P,vessel:C,onVessel:M,onSwap:me,stage:y})]})}export{Sh as default};
