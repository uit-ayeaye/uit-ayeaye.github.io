var zr=Object.defineProperty;var Tr=(e,o,n)=>o in e?zr(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var ps=(e,o,n)=>Tr(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as se,j as t,d as La,f as Me,h as Er,i as Rr}from"./vendor-C2HIMx-P.js";import{t as Se,c as S,aD as Rn,au as Kn,d as Qn,a5 as _e,aJ as Ar,f as Ir,Y as fs,a0 as ms,ag as R,h as ne,aK as Cr,ay as Pr,az as so,aA as ao,aq as Fa,R as Lr,M as at,o as yt,at as Ut,ax as pt,aL as ro,aM as io,a4 as Fr,a8 as Nt,ar as lo,av as Ga,aC as Gr,A as Or}from"./three-Zo_RlN_K.js";import{f as to,m as vo,w as Ye,a as Kt,e as It,P as Dr,G as Nr,S as Hr,I as _r}from"./index-BCvCxO--.js";const Q={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},E={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},Vo={dir:[.72,.52,-.44],col:"#f2e9cf"},Ot={sea:.00105,bay:48e-5,deepGrade:210},Br=1.15;function ie(e){const o=new Se(e);return[o.r,o.g,o.b]}const Ur=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,Wr=`
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
`;function Yr({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new S(...ie(Q.skyHigh))},uLow:{value:new S(...ie(Q.skyLow))},uCloud:{value:new S(...ie(Q.cloud))},uCloudLit:{value:new S(...ie(Q.cloudLit))},uEmber:{value:new S(...ie(E.ember))},uFlash:{value:0},uFlashColor:{value:new S(...ie(Q.boltGlow))},uFlashDir:{value:new S(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new S(...Vo.dir).normalize()},uMoonCol:{value:new S(...ie(Vo.col))},uUnder:{value:0},uUnderCol:{value:new S(...ie(Q.underHaze))}}),[]);return se((s,a)=>{const i=o.current?.uniforms;i&&(i.uTime.value+=a,i.uFlash.value=e?.flash??0,e?.flashDir&&i.uFlashDir.value.copy(e.flashDir),i.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:Ur,fragmentShader:Wr,uniforms:n,side:Rn,depthWrite:!1,depthTest:!1,fog:!1})]})}const _=1.9,V=e=>e*_,pe={x:0,z:V(-60)},wt=V(300),_o=V(175),Vr=118,F={x:0,z:V(-402),r:V(215),baseY:300,squash:[1.18,1.04,.98]},wo=[[-.361,.301,.883],[.361,.301,.883]],Xn=[0,.02,.9998],Zn=[0,-.419,.908];function qn(e,o=1){const[n,s,a]=F.squash;return{x:F.x+e[0]*F.r*n*o,y:F.baseY+e[1]*F.r*s*o,z:F.z+e[2]*F.r*a*o}}const Ie=wo.map(e=>qn(e)),he={...qn(Zn),halfWidth:74,height:62};qn(Xn,.94);const K={x:V(-152),y:4.5,z:V(-104),r:V(78)},gs=2.35,_t=[Math.sin(gs),Math.cos(gs)],W=(()=>{const e=wt+_o*.35,o=pe.x+_t[0]*e,n=pe.z+_t[1]*e;return{x:o,z:n,pool:V(46),benchY:3.6,reach:V(560),gate:{x:o-_t[0]*V(44),z:n-_t[1]*V(44)},berth:{x:o+_t[0]*V(12),z:n+_t[1]*V(12)},dir:_t}})(),$r=[{rank:1,role:"east-south",ang:.75,dist:V(730),r:V(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:V(730),r:V(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:V(770),r:V(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:V(690),r:V(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:V(690),r:V(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:V(765),r:V(150),depth:42,dir:1,speed:35}],Be=[];function Oa(e){const o=e==="low"?3:e==="mid"?5:7;Be.length=0;for(const n of $r)n.rank>o||Be.push({role:n.role,x:pe.x+Math.sin(n.ang)*n.dist,z:pe.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Be}const Kr=e=>Be.find(o=>o.role===e)??Be[0];Oa("high");function Da(e,o,n=0){let s=0,a=0;const i=1-Ze(8,34,n);if(i<=0)return{vx:s,vz:a,danger:0};let l=0;for(const h of Be){const c=e-h.x,d=o-h.z,b=Math.hypot(c,d);if(b>h.r*1.7||b<.001)continue;const g=b/h.r,m=1-Ze(1,1.6,g),f=h.speed*(g/.3)*Math.exp(1-g/.3)*.62*m,p=h.speed*.55*Math.exp(-g*g*2.6)*m+h.speed*.1*m,x=1/b;s+=(-d*x*f*h.dir-c*x*p)*i,a+=(c*x*f*h.dir-d*x*p)*i,l=Math.max(l,(1-Ze(.15,1.15,g))*i)}return{vx:s,vz:a,danger:l}}const $o={x:0,halfWidth:V(96)},Dt=V(258),oo=V(624),Ko={safe:260,range:640},Qr=0,Bo=V(1500),Qo=e=>e<0?0:e>1?1:e;function Xr(e,o,n=4){let s=0,a=1,i=1,l=0;for(let h=0;h<n;h++){const c=1-Math.abs(to(e*i,o*i,1)*2-1);s+=c*c*a,l+=a,a*=.52,i*=2.07}return s/l}const Ze=(e,o,n)=>{const s=Qo((n-e)/(o-e));return s*s*(3-2*s)};function Zr(e){if(e>V(430))return 1e4;const o=1-Ze(V(430),V(205),e),n=Ze(V(150),V(-30),e);return $o.halfWidth+o*V(620)+n*V(300)}function qr(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let s=Vr;return s+=o*190,s+=Math.max(0,n)*46,s-=Math.max(0,-n)*26,s}function re(e,o){const n=e-pe.x,s=o-pe.z,a=Math.hypot(n,s),i=Math.atan2(n,s),l=(a-wt)/_o,h=Math.exp(-l*l*1.35)*qr(i),c=Math.max(0,a-wt-_o*.55),d=-Math.pow(c/210,1.6)*175,b=Math.max(0,wt-_o*.5-a),g=-Ze(0,150,b)*46,m=Qo(h/60),f=(Xr(e*.0052/_+13,o*.0052/_-21,4)-.42)*168*m,p=(to(e*.0042/_+31,o*.0042/_-17,4)-.5)*84*m,x=(to(e*.021-5,o*.021+9,3)-.5)*17*m;let u=h+d+g+f+p+x;const v=Zr(o),z=1-Ze(v,v+V(105),Math.abs(e-$o.x)),T=1-Ze(V(-40),V(-190),o),j=z*T;u=u*(1-j)+Math.min(u,-34)*j;const I=Math.hypot(e-F.x,o-F.z);u+=Math.exp(-Math.pow(I/(F.r*1.55),2))*62;const r=(e-K.x)/V(76),k=(o-K.z)/V(58),P=(1-Ze(.72,1.18,Math.hypot(r,k)))*Qo((u+34)/34);u=u*(1-P)+K.y*P;const A=e-W.x,M=o-W.z;if(Math.abs(A)+Math.abs(M)<W.reach+V(140)){const G=Math.max(0,Math.min(W.reach,A*W.dir[0]+M*W.dir[1])),L=A-W.dir[0]*G,O=M-W.dir[1]*G,oe=Math.hypot(L,O),ue=V(30)+G/W.reach*V(48),D=1-Ze(ue,ue+V(62),oe);u=u*(1-D)+Math.min(u,-26)*D;const $=Math.hypot(A,M),X=1-Ze(W.pool*.55,W.pool,$);u=u*(1-X)+Math.min(u,-14)*X;const ae=(e-W.gate.x)/V(30),be=(o-W.gate.z)/V(24),de=1-Ze(.72,1.18,Math.hypot(ae,be));u=u*(1-de)+W.benchY*de}return u}function Jn(e,o,n=3){const s=re(e+n,o)-re(e-n,o),a=re(e,o+n)-re(e,o-n),i=-s,l=2*n,h=-a,c=Math.hypot(i,l,h)||1;return[i/c,l/c,h/c]}function Jr(e,o,n=3){return Math.acos(Jn(e,o,n)[1])}function Mo(e,o){const n=Ze(V(250),V(40),o),s=1-Ze(wt-V(40),wt+V(90),Math.hypot(e-pe.x,o-pe.z)),a=(1-Ze(V(60),V(170),Math.hypot(e-W.x,o-W.z)))*.85;return Qo(Math.max(Math.min(n,s),a))}const Na=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],ei=Math.PI*2;function ti(e,o,n){let s=0,a=0,i=0;for(const l of Be){const h=e-l.x,c=o-l.z,d=Math.max(1,Math.hypot(h,c));if(d>l.r*1.75)continue;const b=d/l.r,g=Math.exp(-3*b*b);s-=l.depth*g;const m=l.depth*6*b*g/l.r;a+=m*(h/d),i+=m*(c/d);const f=Math.atan2(c,h),p=Math.sin(f*3*l.dir+b*14-n*2.2),x=b*Math.exp(1-b)*(1-oi(b));s+=p*x*1.6}return{y:s,dx:a,dz:i}}function oi(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function xt(e,o,n,s=1){let a=0,i=0,l=0;for(const c of Na){const d=ei/c.len,b=Math.sqrt(9.81/d),g=Math.hypot(c.dir[0],c.dir[1]),m=c.dir[0]/g,f=c.dir[1]/g,p=d*(m*e+f*o-b*n),x=c.amp*s;a+=x*Math.sin(p);const u=x*d*Math.cos(p);i+=u*m,l+=u*f}const h=ti(e,o,n);return a+=h.y,i+=h.dx,l+=h.dz,{y:a,dx:i,dz:l}}const ni=Na.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),si=()=>Be.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),ai=()=>Be.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),ri=`
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
`,ii=()=>`
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
${ri}

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
${ni}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${si()}

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
`,li=()=>`
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
${ai()}
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
`;function ci(e,o){const n=new Uint8Array(e*e*4);for(let a=0;a<e;a++)for(let i=0;i<e;i++){const l=pe.x+((i+.5)/e-.5)*o,h=pe.z+((a+.5)/e-.5)*o,c=re(l,h),d=R.clamp(-c/46,0,1),b=(a*e+i)*4;n[b]=Math.round(d*255),n[b+1]=n[b],n[b+2]=n[b],n[b+3]=255}const s=new Ar(n,e,e,Ir);return s.minFilter=fs,s.magFilter=fs,s.wrapS=ms,s.wrapT=ms,s.needsUpdate=!0,s}const Xo={low:112,mid:190,high:286},An=6400;function hi(e){const o=w.useRef(),n=An/(Xo[e]??Xo.high);return se(s=>{const a=o.current;a&&(a.position.x=Math.round((s.camera.position.x-pe.x)/n)*n,a.position.z=Math.round((s.camera.position.z-pe.z)/n)*n)}),o}function ui({quality:e="high",storm:o}){const n=w.useRef(),s=hi(e),{geometry:a,uniforms:i,landTex:l,vert:h,frag:c}=w.useMemo(()=>{const d=Xo[e]??Xo.high,b=new Kn(An,An,d,d);b.rotateX(-Math.PI/2),b.translate(pe.x,0,pe.z);const g=Bo*1.05,m=ci(e==="low"?160:256,g),f={uTime:{value:0},uLand:{value:m},uSpan:{value:g},uCentre:{value:new Qn(pe.x,pe.z)},uDeep:{value:new S(...ie(Q.seaDeep))},uShallow:{value:new S(...ie(Q.seaShallow))},uFoam:{value:new S(...ie(Q.foam))},uSkyLow:{value:new S(...ie(Q.skyLow))},uGilt:{value:new S(...ie(E.gilt))},uEmber:{value:new S(...ie(E.ember))},uFogColor:{value:new S(...ie(Q.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new S(...ie(Q.abyss))},uUnderGlow:{value:new S(...ie(Q.underGlow))},uDepthFade:{value:0},uMoonDir:{value:di.clone()},uMoonCol:{value:new S(...ie(pi))},uEyeA:{value:new S(Ie[0].x,Ie[0].y,Ie[0].z)},uEyeB:{value:new S(Ie[1].x,Ie[1].y,Ie[1].z)},uFlash:{value:0},uFlashColor:{value:new S(...ie(Q.boltGlow))},uCameraPos:{value:new S}};return{geometry:b,uniforms:f,landTex:m,vert:ii(),frag:li()}},[e]);return se((d,b)=>{const g=n.current?.uniforms;if(!g)return;g.uTime.value+=b,g.uCameraPos.value.copy(d.camera.position),g.uFlash.value=o?.flash??0,g.uFogDensity.value=o?.fog??.0011;const m=Math.min(1,Math.max(0,(o?.depthBelow??0)/Ot.deepGrade));g.uDepthFade.value=m,xs.copy(mi).lerp(gi,m*.8),g.uFogColor.value.lerpVectors(fi,xs,o?.underwater??0)}),t.jsx("mesh",{ref:s,geometry:a,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:c,uniforms:i,transparent:!1,side:_e},l.uuid)})}const di=new S(...Vo.dir).normalize(),pi=Vo.col,fi=new S(...ie(Q.haze)),mi=new S(...ie(Q.underHaze)),gi=new S(...ie(Q.abyss)),xs=new S;function xi({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const s=o,a=new Kn(Bo,Bo,s,s);a.rotateX(-Math.PI/2);const i=a.attributes.position,l=i.count,h=new Float32Array(l*3),c=new Se(Q.rock),d=new Se(Q.rockLit),b=new Se("#0b0e18"),g=new Se(Q.snow),m=new Se(E.rockWarm),f=new Se;for(let p=0;p<l;p++){const x=i.getX(p)+pe.x,u=i.getZ(p)+pe.z,v=re(x,u);i.setX(p,x),i.setY(p,v),i.setZ(p,u);const z=Jn(x,u,Bo/s)[1],T=Math.max(0,(z-.55)/.45);f.copy(c).lerp(d,R.clamp(v/190,0,1));const j=1-R.clamp((v-Qr)/13,0,1);f.lerp(b,j*.85);const I=R.clamp((x-pe.x)/260,0,1),r=96-I*42,k=R.clamp((v-r)/60,0,1)*T;f.lerp(g,k*(.45+I*.5));const P=Math.hypot(x-F.x,u-F.z),A=Math.exp(-Math.pow(P/330,2)),M=R.clamp((u-F.z)/260,0,1);f.lerp(m,A*M*.6*(1-k)),h[p*3]=f.r,h[p*3+1]=f.g,h[p*3+2]=f.b}return a.setAttribute("color",new ne(h,3)),a.computeVertexNormals(),a.computeBoundingSphere(),a},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const es=-30,ts=330,bi=150,fe={x:he.x,y:he.y-40,z:he.z-bi-(es+ts)},Le={centre:[0,96,es],radii:[350,235,ts]},Tt={x:fe.x+Le.centre[0],y:fe.y+Le.centre[1],z:fe.z+Le.centre[2]};function wi(e,o,n){const s=(e-Tt.x)/Le.radii[0],a=(o-Tt.y)/Le.radii[1],i=(n-Tt.z)/Le.radii[2];return Math.sqrt(s*s+a*a+i*i)}function In(e,o=.06){const n=(e.x-Tt.x)/Le.radii[0],s=(e.y-Tt.y)/Le.radii[1],a=(e.z-Tt.z)/Le.radii[2],i=Math.sqrt(n*n+s*s+a*a),l=1+o;if(i>=l)return null;const h=i<1e-4?0:l/i;return e.x=Tt.x+(h?n*h:0)*Le.radii[0],e.y=Tt.y+(h?s*h:l)*Le.radii[1],e.z=Tt.z+(h?a*h:0)*Le.radii[2],e}const le={y:0,halfX:290,zFront:228,zBack:-240},De={y:40,z:es+ts-40,halfX:96,depth:120},dt={zTop:De.z-54,zBottom:140,halfX:74,steps:16},N={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},Re={y:74,z:N.z+N.halfZ+26,halfX:96,depth:40},Ft=Re.y+3.5,qe={y:-95,halfX:220,halfZ:175,ceiling:-34},Te={x:0,z:84,halfX:52,halfZ:40},ye={y:52,halfZ:205,x:252,tiers:3,tierRise:46},To=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],ge={x:74,halfW:14,zFoot:N.z+N.halfZ+158,zTop:Re.z+Re.depth/2-6},Ha=[{kind:"rampZ",x0:-74-ge.halfW,x1:-74+ge.halfW,z0:ge.zFoot,z1:ge.zTop,y0:0,y1:Ft},{kind:"rampZ",x0:ge.x-ge.halfW,x1:ge.x+ge.halfW,z0:ge.zFoot,z1:ge.zTop,y0:0,y1:Ft},{kind:"flat",x0:-96,x1:Re.halfX,z0:Re.z-Re.depth/2-2,z1:ge.zTop,y:Ft},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:ye.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:ye.y-.5},{kind:"flat",x0:ye.x-38,x1:ye.x+38,z0:-225,z1:ye.halfZ+20,y:ye.y-.5}],yi=e=>e<=0?0:e>=1?1:e*e*(3-2*e),_a=(()=>{const e=[],o=[],n=[],s=N.halfX+6,a=[s,s+9],i=[s+11,s+20],l=[s,s+20],h=[-212,-200],c=[-264,-252],d=[Ft];for(let g=2;g<=N.storeys;g++)d.push(N.plinth+g*N.storey+1.5);e.push({kind:"flat",x0:Re.halfX-6,x1:s+20,z0:-212,z1:-196,y:Ft}),o.push([(Re.halfX-6+s+20)/2,Ft,-204,s+26-Re.halfX,16]);for(let g=0;g<d.length-1;g++){const m=d[g],f=d[g+1],p=(m+f)/2;e.push({kind:"rampZ",x0:a[0],x1:a[1],z0:h[0],z1:c[1],y0:m,y1:p}),n.push({x0:a[0],x1:a[1],z0:h[0],z1:c[1],y0:m,y1:p}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:c[0],z1:c[1],y:p}),o.push([(l[0]+l[1])/2,p,(c[0]+c[1])/2,l[1]-l[0],c[1]-c[0]]),e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),n.push({x0:i[0],x1:i[1],z0:c[1],z1:h[0],y0:p,y1:f}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:h[0],z1:h[1],y:f}),o.push([(l[0]+l[1])/2,f,(h[0]+h[1])/2,l[1]-l[0],h[1]-h[0]])}for(let g=1;g<d.length-1;g++){const f=1-Math.min(N.storeys,g+2)*N.taper,p=N.halfX*f,x=N.z+N.halfZ*f,u=d[g];e.push({kind:"flat",x0:p-4,x1:s,z0:-224,z1:-212,y:u}),o.push([(p-4+s)/2,u,-218,s-p+4,12]),e.push({kind:"flat",x0:-p-6,x1:p+6,z0:x,z1:-212,y:u}),o.push([0,u,(x-212)/2,p*2+12,-212-x])}const b=d[d.length-1];return e.push({kind:"flat",x0:58,x1:s,z0:-248,z1:-212,y:b}),o.push([(s+58)/2,b,-230,s-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[s,s+20],z:[c[0],h[1]]}}})();Ha.push(..._a.walks);const vi=1.1;function Mi(e,o,n=1/0){const s=n+vi;let a=-1/0;for(const i of Ha){if(e<i.x0||e>i.x1)continue;const l=Math.min(i.z0,i.z1),h=Math.max(i.z0,i.z1);if(o<l||o>h)continue;const c=i.kind==="flat"?i.y:i.y0+(i.y1-i.y0)*yi((o-i.z0)/(i.z1-i.z0));c<=s&&c>a&&(a=c)}return a===-1/0?0:Math.max(0,a)}function ji(e,o,n=1/0){const s=o>dt.zTop?De.y:o>dt.zBottom?De.y*(o-dt.zBottom)/(dt.zTop-dt.zBottom):0,a=Mi(e,o,n);return Math.max(s,a)}function ki(e,o,n){const s=N.plinth+N.storeys*N.storey;if(n>s)return!1;const i=1-(n<=N.plinth?0:Math.min(N.storeys,Math.ceil((n-N.plinth)/N.storey)))*N.taper;return Math.abs(e)<N.halfX*i&&Math.abs(o-N.z)<N.halfZ*i}const y={t:0,flash:0,flashDir:new S(0,.4,-1),fog:Ot.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new S(0,0,0),helmActive:!1,helmPos:new S(0,0,0),helmSpeed:0,ship:{x:0,y:0,z:0,heading:Math.PI,loa:64,deckY:8.3,mastY:42},subThrottle:0,vessel:"sunny",footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new S(0,60,-200)}};function Si(){y.t=0,y.progress=0,y.flash=0,y.fog=Ot.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const un=new Map;let Ba=!0;function zi(e){Ba=!!e}function Ti(e){const o=vo(e);return un.has(o)||un.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),un.get(o)}function ot(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let s=!0;return Ti(e).then(a=>{s&&n(a&&Ba)}),()=>{s=!1}},[e]),o}const Et=wo.map(e=>new S(...e).normalize()),Ua=new S(...Xn).normalize(),Cn=new S(...Zn).normalize();function Ei(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const c of Et){const d=e.dot(c),b=Math.pow(Math.max(0,d),46);o-=b*.3}const s=Math.max(0,e.dot(Ua)),a=Math.pow(s,150)*(1-Math.max(0,e.y)*.5);o-=a*.19;for(const c of Et){const d=new S(c.x*1.5,c.y-.55,c.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,d),26)*.075}const i=Math.max(0,e.dot(Cn));o-=Math.pow(i,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const l=Math.pow(Math.max(0,e.dot(Et[0])),30)+Math.pow(Math.max(0,e.dot(Et[1])),30),h=1-Math.min(1,l);return o+=(to(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(to(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const Ri=178*1.9,et=F.r/Ri;function bs(e,o){const n=e*et,s=[new S(n*74,96*et,-20*et),new S(n*142,176*et,-58*et),new S(n*196,268*et,-76*et),new S(n*222,356*et,-52*et),new S(n*206,424*et,8*et),new S(n*154,462*et,72*et)],a=new S;for(const b of s)a.set(F.x+b.x,F.baseY+b.y,F.z+b.z),In(a,.12)&&b.set(a.x-F.x,a.y-F.baseY,a.z-F.z);const i=new so(s),l=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,c=new ao(i,l,1,h,!1),d=c.attributes.position;for(let b=0;b<=l;b++){const g=b/l,m=34*et*Math.pow(1-g,.72)*(1+Math.sin(g*Math.PI)*.16),f=i.getPoint(g);for(let p=0;p<=h;p++){const x=b*(h+1)+p;if(x>=d.count)continue;const u=d.getX(x)-f.x,v=d.getY(x)-f.y,z=d.getZ(x)-f.z;d.setXYZ(x,f.x+u*m,f.y+v*m,f.z+z*m)}}return d.needsUpdate=!0,c.computeVertexNormals(),c}const Ai={low:4,mid:6,high:7},Wa="skull-island.opt.glb",uo={height:1,yaw:0,lift:.02},dn=new Lr,ws=new S,Eo=new S;function Ii(e,o,n){Eo.set(o[0],o[1],o[2]).normalize(),ws.copy(Eo).multiplyScalar(F.r*4),dn.set(ws,Eo.clone().negate()),dn.far=F.r*8;const s=dn.intersectObject(e,!0)[0];return s?s.point.clone().addScaledVector(Eo,-n):null}function Ci({shadows:e}){const{scene:o}=La(vo(Wa)),{object:n,eyes:s,nose:a,mouth:i}=w.useMemo(()=>{const l=o.clone(!0),h=new Fa().setFromObject(l),c=new S,d=new S;h.getSize(c),h.getCenter(d);const b=F.r*F.squash[1]*1.62,g=c.y>1e-4?b*uo.height/c.y:1,m=F.r*F.squash[1]*uo.lift;l.scale.setScalar(g),l.rotation.set(0,uo.yaw,0),l.position.set(0,-d.y*g+m,0);const f=d.x*g,p=d.z*g,x=Math.cos(uo.yaw),u=Math.sin(uo.yaw);l.position.x=-(f*x+p*u),l.position.z=-(-f*u+p*x),l.updateMatrixWorld(!0);let v=0,z=0;const T={x:0,y:0,z:0},j=new S,I=[];l.traverse(L=>{L.isMesh&&I.push(L)});for(const L of I){const O=L.geometry.clone();for(const D of["position","normal"]){const $=O.attributes[D];if(!$||$.array instanceof Float32Array)continue;const X=new Float32Array($.count*3);for(let ae=0;ae<$.count;ae++)j.fromBufferAttribute($,ae),X[ae*3]=j.x,X[ae*3+1]=j.y,X[ae*3+2]=j.z;O.setAttribute(D,new ne(X,3))}O.applyMatrix4(L.matrixWorld);const oe=O.attributes.position;z+=oe.count;for(let D=0;D<oe.count;D++)T.x=oe.getX(D)+F.x,T.y=oe.getY(D)+F.baseY,T.z=oe.getZ(D)+F.z,In(T,.05)&&(oe.setXYZ(D,T.x-F.x,T.y-F.baseY,T.z-F.z),v++);v&&O.computeVertexNormals(),oe.needsUpdate=!0,O.computeBoundingSphere(),O.computeBoundingBox(),L.geometry=O,L.castShadow=e,L.receiveShadow=!1;const ue=Array.isArray(L.material)?L.material:[L.material];for(const D of ue)D.color?.multiply(Pi),D.roughness=.94,D.metalness=.02}for(const L of[l,...I])L.position.set(0,0,0),L.quaternion.identity(),L.scale.set(1,1,1),L.updateMatrix();l.updateMatrixWorld(!0);const r=(L,O=1)=>{const[oe,ue,D]=F.squash;return new S(L[0]*F.r*oe*O,L[1]*F.r*ue*O,L[2]*F.r*D*O)},k=wo.map(L=>Ii(l,L,F.r*.1)??r(L,.82)),P=new S().addVectors(k[0],k[1]).multiplyScalar(.5),A=new S().addVectors(r(wo[0],.82),r(wo[1],.82)).multiplyScalar(.5),M=P.clone().sub(A),G=L=>{const O={x:L.x+F.x,y:L.y+F.baseY,z:L.z+F.z};return In(O,.22)&&L.set(O.x-F.x,O.y-F.baseY,O.z-F.z),L};return{object:l,eyes:k.map(G),nose:G(r(Xn,.87).add(M)),mouth:G(r(Zn,.9).add(M))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Ya,{eyes:s,nose:a,mouth:i,teeth:null,cast:e})]})}const Pi=new Se("#8f8a84");function Ya({eyes:e,nose:o,mouth:n,teeth:s,cast:a}){const i=w.useRef(),l=w.useRef(),h=w.useRef();return se(()=>{const c=y.t,d=.82+.18*Math.sin(c*2.3)*Math.sin(c*.71),b=.82+.18*Math.sin(c*1.9+2.1)*Math.sin(c*.63),g=.86+.14*Math.sin(c*1.4+.8);i.current&&(i.current.emissiveIntensity=5.2*d+y.flash*2),l.current&&(l.current.emissiveIntensity=5.2*b+y.flash*2),h.current&&(h.current.emissiveIntensity=3.4*g)}),t.jsxs(t.Fragment,{children:[e.map((c,d)=>t.jsxs("mesh",{position:c,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[F.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:d===0?i:l,color:E.furnace,emissive:E.ember,emissiveIntensity:5.2,toneMapped:!1,side:_e,roughness:1})]},d)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[F.r*.046,F.r*.083,3]}),t.jsx("meshStandardMaterial",{color:E.emberDeep,emissive:E.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,F.r*.05,-F.r*.16],children:[t.jsx("planeGeometry",{args:[F.r*.62,F.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:E.ember,emissive:E.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:_e})]}),s?.map((c,d)=>t.jsxs("mesh",{position:c.pos,scale:c.scale,rotation:[0,0,c.rot],castShadow:a,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:E.emberDeep,emissiveIntensity:.42,roughness:.78})]},d))]})]})}const Li=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function Fi({quality:e="high",shadows:o=!0}){const s=ot(Wa)&&e!=="low"&&Li!=="proc",{dome:a,hornL:i,hornR:l,teeth:h}=w.useMemo(()=>{const f=new Cr(F.r,Ai[e]??7),p=f.attributes.position,x=new Float32Array(p.count*3),u=new Se(Q.rock),v=new Se(E.rockWarm),z=new Se("#120b10"),T=new Se,j=new S;for(let P=0;P<p.count;P++){j.set(p.getX(P),p.getY(P),p.getZ(P)).normalize();const A=F.r*Ei(j),[M,G,L]=F.squash;p.setXYZ(P,j.x*A*M,j.y*A*G,j.z*A*L);const O=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),5),Math.pow(Math.max(0,j.dot(Et[1])),5),Math.pow(Math.max(0,j.dot(Cn)),6)*.9);T.copy(u).lerp(v,Math.min(1,O*1.5+Math.max(0,j.z)*.22));const oe=Math.max(Math.pow(Math.max(0,j.dot(Et[0])),40),Math.pow(Math.max(0,j.dot(Et[1])),40));T.lerp(z,oe),x[P*3]=T.r,x[P*3+1]=T.g,x[P*3+2]=T.b}f.setAttribute("color",new ne(x,3)),f.computeVertexNormals();const I=new Pr(1,1,1),r=[],k=9;for(let P=0;P<k;P++){const A=P/(k-1)*2-1,M=he.halfWidth*2.1,G=A*M*.5,L=Math.pow(Math.abs(A),1.7)*14,O=46-Math.abs(A)*13+P%2*7;r.push({pos:[G,he.height*.5-L-O*.5,6],scale:[M/k*.76,O,52],rot:A*.13})}return I.dispose?.(),{dome:f,hornL:bs(-1,e),hornR:bs(1,e),teeth:r}},[e]),c=o,[d,b,g]=F.squash,m=(f,p)=>[f.x*F.r*d*p,f.y*F.r*b*p,f.z*F.r*g*p];return t.jsx("group",{position:[F.x,F.baseY,F.z],children:s?t.jsx(w.Suspense,{fallback:t.jsx(ys,{dome:a,hornL:i,hornR:l,cast:c}),children:t.jsx(Ci,{shadows:c})}):t.jsxs(t.Fragment,{children:[t.jsx(ys,{dome:a,hornL:i,hornR:l,cast:c}),t.jsx(Ya,{eyes:Et.map(f=>m(f,.82)),nose:m(Ua,.87),mouth:m(Cn,.96),teeth:h,cast:c})]})})}function ys({dome:e,hornL:o,hornR:n,cast:s}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:s,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function bt({matrices:e,target:o}){const n=w.useRef(!1);return se(()=>{if(n.current||!o.current)return;const s=Math.min(e.length,o.current.count);for(let a=0;a<s;a++)o.current.setMatrixAt(a,e[a]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const Qt=190,Mt=130,Ro=9.5;function vs(e,o,n,s=24){const a=new so(e),i=new ao(a,s,1,4,!1),l=i.attributes.position,h=new S(0,1,0),c=new S,d=new S,b=new S,g=new S,m=new S;for(let f=0;f<=s;f++){const p=f/s;a.getPointAt(p,d),a.getTangentAt(p,c),g.crossVectors(c,h).normalize(),b.crossVectors(g,c).normalize();for(let x=0;x<=4;x++){const u=f*5+x;if(u>=l.count)continue;const v=x/4*Math.PI*2+Math.PI/4,z=Math.cos(v)*o*.7071,T=Math.sin(v)*n*.7071;m.copy(d).addScaledVector(g,z).addScaledVector(b,T),l.setXYZ(u,m.x,m.y,m.z)}}return l.needsUpdate=!0,i.computeVertexNormals(),i}function Gi(e,o,n,s=40){const a=[];for(let c=0;c<=10;c++){const d=c/10*2-1;a.push(new S(d*e,-30*(1-d*d),0))}const i=new so(a),l=new ao(i,s,n,8,!1),h=l.attributes.position;for(let c=0;c<=s;c++){const d=c/s*2-1,b=1+(1-d*d)*.85,g=i.getPointAt(c/s);for(let m=0;m<=8;m++){const f=c*9+m;f>=h.count||h.setXYZ(f,g.x+(h.getX(f)-g.x)*b,g.y+(h.getY(f)-g.y)*b,g.z+(h.getZ(f)-g.z)*b)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Ms({quality:e="high",shadows:o=!0,z:n=Dt,k:s=_}){const a=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useMemo(()=>{const x=Qt/2,u=Mt,v=vs([new S(-x-40,u+6,0),new S(-x-22,u+15.5,0),new S(0,u+20,0),new S(x+22,u+15.5,0),new S(x+40,u+6,0)],16,9,30),z=vs([new S(-x-30,u+2,0),new S(0,u+8,0),new S(x+30,u+2,0)],11,5,18);return{kasagi:v,shimaki:z,rope:Gi(x-6,30,6.4,44)}},[]),{tileM:d,merlonM:b,cannonM:g,lanternM:m}=w.useMemo(()=>{const x=new at,u=new yt,v=new S,z=new S,T=[],j=e==="low"?26:54;for(let A=0;A<j;A++){const M=A/(j-1)*2-1,G=M*(Qt/2+40),L=Mt+20-Math.pow(Math.abs(M),1.9)*14+5,O=-Math.sign(M)*Math.pow(Math.abs(M),3)*.5;z.set(G,L,0),u.setFromEuler(new Ut(0,0,O)),v.set(1,1,1),T.push(x.clone().compose(z,u,v))}const I=[];for(const A of[-1,1])for(let M=0;M<7;M++)z.set(A*(58+M*12),26,0),u.identity(),v.set(1,1,1),I.push(x.clone().compose(z,u,v));const r=[];for(const A of[-1,1])for(let M=0;M<2;M++)for(let G=0;G<4-M;G++)z.set(A*(64+G*13+M*6),32+M*10,8),u.setFromEuler(new Ut(Math.PI/2-.16,0,0)),v.set(1,1,1),r.push(x.clone().compose(z,u,v));const k=[],P=e==="low"?10:22;for(let A=0;A<P;A++){const M=A/(P-1)*2-1,G=M*(Qt/2-12),L=30*(1-M*M);z.set(G,Mt-34-L-7.5,0),u.identity(),v.set(1,1,1),k.push(x.clone().compose(z,u,v))}return{tileM:T,merlonM:I,cannonM:r,lanternM:k}},[e]);se(()=>{const x=y.t;a.current&&(a.current.material.emissiveIntensity=2.6+Math.sin(x*3.1)*.22+Math.sin(x*7.7)*.1+y.flash*1.4)});const f=Qt/2,p=o;return t.jsxs("group",{position:[0,0,n],scale:s,children:[[-1,1].map(x=>t.jsxs("group",{position:[x*f,0,0],children:[t.jsxs("mesh",{position:[0,Mt/2-30,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ro*.86,Ro,Mt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[Ro*1.5,Ro*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},x)),t.jsxs("mesh",{position:[0,Mt-26,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[Qt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:c.shimaki,castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:c.kasagi,castShadow:p,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(bt,{matrices:d,target:i})]}),t.jsxs("mesh",{position:[0,Mt-6,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,Mt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:c.rope,position:[0,Mt-34,2],castShadow:p,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(x=>{const u=30*(1-(x/(Qt/2-6))**2);return t.jsx("group",{position:[x,Mt-34-u-4,2],children:[0,1,2].map(v=>t.jsxs("mesh",{position:[v%2?1.1:-1.1,-2.4-v*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:_e})]},v))},x)}),[-1,1].map(x=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[x*108,6,0],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[x*108,30,6],castShadow:p,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.88})]}),t.jsxs("mesh",{position:[x*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},x)),t.jsxs("instancedMesh",{ref:h,args:[null,null,b.length],castShadow:p,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(bt,{matrices:b,target:h})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,g.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(bt,{matrices:g,target:l})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,m.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(bt,{matrices:m,target:a})]})]})}const Oi=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.12,"rgba(255,255,255,0.55)"),s.addColorStop(.4,"rgba(255,255,255,0.06)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let i=0;i<4;i++){const l=n.createLinearGradient(0,0,e/2,0);l.addColorStop(0,"rgba(255,255,255,0.95)"),l.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=l,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const a=new ro(o);return a.colorSpace=io,a})();function Di(e,o,n,s){const a=[];for(let i=0;i<=s;i++){const l=i/s,h=l*2-1;a.push(new S(e[0]+(o[0]-e[0])*l,e[1]+(o[1]-e[1])*l-n*(1-h*h),e[2]+(o[2]-e[2])*l))}return a}const Ni=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Hi({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),a=w.useRef(),i=w.useRef(),{lanternM:l,lampM:h,pilingM:c,katanaY:d,ground:b}=w.useMemo(()=>{const f=new at,p=new yt,x=new S(1,1,1),u=new S,v=[],z=e==="low"?.42:e==="mid"?.72:1;for(const[r,k,P]of Ni){const A=Math.max(4,Math.round(P*z)),M=Di(r,k,14,A);for(let G=1;G<M.length-1;G++){const L=.78+G*37%11/22;u.copy(M[G]).add(new S(0,-4.2*L,0)),p.setFromEuler(new Ut(0,G*1.7%Math.PI,(G%3-1)*.06)),v.push(f.clone().compose(u,p,x.clone().multiplyScalar(L)))}}const T=[],j=e==="low"?6:11;for(let r=0;r<j;r++){const k=r/(j-1);for(const P of[-1,1]){const A=R.lerp(K.x+46,he.x-6,k)+P*(26-k*9),M=R.lerp(K.z-26,he.z+32,k);u.set(A,re(A,M)+5,M),p.identity(),T.push(f.clone().compose(u,p,x))}}const I=[];for(let r=0;r<16;r++){const k=r%2,P=Math.floor(r/2);u.set(K.x+30+P*17,-2,K.z+34+k*26),p.setFromEuler(new Ut(0,0,(r%3-1)*.035)),I.push(f.clone().compose(u,p,x))}return{lanternM:v,lampM:T,pilingM:I,katanaY:re(K.x+118,K.z-58),ground:K.y}},[e]);se(()=>{const f=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(f*2.7)*.2+Math.sin(f*6.1+1.3)*.12+y.flash*1.6),i.current){const p=46*(1+Math.sin(f*1.3)*.13);i.current.scale.set(p,p,1),i.current.material.rotation=f*.07}});const g=o,m=(f,p)=>re(K.x+f,K.z+p);return t.jsxs("group",{children:[t.jsxs("group",{position:[K.x,0,K.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(f=>t.jsxs("group",{position:[52+f*26,1.5,92+f%2*13],rotation:[0,.4+f*.3,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:_e})]})]},f))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(bt,{matrices:c,target:a})]}),t.jsxs("group",{position:[K.x+118,d,K.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:g,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:i,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:Oi,color:E.furnace,transparent:!0,opacity:.75,blending:pt,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(f=>{const p=96+f*4,x=88*f;return t.jsxs("group",{position:[K.x+p,m(p,x),K.z+x],rotation:[0,-f*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:g,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:g,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*3,37,4],rotation:[0,0,u*.3],castShadow:g,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},u)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.9,side:_e})]})]},f)}),[-1,1].map(f=>{const p=40+f*34,x=-18+f*46;return t.jsxs("group",{position:[K.x+p,m(p,x)+12,K.z+x],rotation:[0,f*.8,0],children:[t.jsxs("mesh",{castShadow:g,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*5,7,-1],rotation:[0,0,u*-.5],castShadow:g,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},u)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:E.ember,emissive:E.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:_e})]})]},f)}),t.jsxs("group",{position:[K.x-34,m(-34,30)+2,K.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:g,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.88,side:_e,emissive:E.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(x)*26,55.5,Math.sin(x)*26],rotation:[0,-x,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},p)}),Array.from({length:10},(f,p)=>{const x=p/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(x)*32,44,Math.sin(x)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.5,toneMapped:!1})]},p)})]}),[0,1,2,3].map(f=>{const p=8+f*30,x=-70-f%2*14;return t.jsxs("group",{position:[K.x+p,m(p,x),K.z+x],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:f%2?"#e8dcc4":E.vermilion,roughness:.95,side:_e})]})]},f)}),[0,1,2].map(f=>{const p=.28+f*.24,x=R.lerp(K.x+46,he.x,p),u=R.lerp(K.z-26,he.z+26,p),v=re(x,u),z=1-f*.1;return t.jsxs("group",{position:[x,v,u],scale:z,children:[[-1,1].map(T=>t.jsxs("mesh",{position:[T*15,17,0],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},T)),t.jsxs("mesh",{position:[0,36,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:g,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.75})]})]},f)}),t.jsx("group",{position:[K.x,b,K.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(bt,{matrices:l,target:n})]})}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:g,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:E.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(bt,{matrices:h,target:s})]})]})}const js={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function _i(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Bi({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),a=w.useRef(),i=w.useRef(),{pineTrunkM:l,pineCanopyM:h,sakuraM:c,rockM:d}=w.useMemo(()=>{const g=js[e]??js.high,m=_i(20250801),f=new at,p=new yt,x=new S,u=new S,v=new S(0,1,0),z=new S,T=[],j=[],I=[],r=g.pine+g.sakura+g.rock;let k=0,P=0;for(;k<r&&P<r*60;){P++;const A=m()*Math.PI*2,M=wt*(.55+m()*.62),G=pe.x+Math.sin(A)*M,L=pe.z+Math.cos(A)*M,O=re(G,L);if(O<5||O>300||Jr(G,L,6)>.72||Math.hypot(G-F.x,L-F.z)<F.r*1.35)continue;const oe=G>pe.x+(m()-.5)*90,ue=k;if(k++,u.set(G,O,L),ue<g.rock){const D=Jn(G,L,5);z.set(D[0],D[1],D[2]),p.setFromUnitVectors(v,z),p.multiply(new yt().setFromEuler(new Ut(m()*.5,m()*6.28,m()*.5)));const $=2.5+m()*7;x.set($*(.7+m()*.6),$*(.5+m()*.5),$*(.7+m()*.6)),u.y-=$*.25,I.push(f.clone().compose(u,p,x))}else if(oe){if(T.length>=g.pine)continue;p.setFromEuler(new Ut(0,m()*6.28,(m()-.5)*.09));const D=.72+m()*.7;x.set(D,D*(.85+m()*.45),D),T.push(f.clone().compose(u,p,x))}else{if(j.length>=g.sakura)continue;p.setFromEuler(new Ut(0,m()*6.28,(m()-.5)*.13));const D=.7+m()*.75;x.set(D,D*(.8+m()*.5),D),j.push(f.clone().compose(u,p,x))}}return{pineTrunkM:T.map(A=>A.clone().multiply(Ui)).concat(j.map(A=>A.clone().multiply(Vi))),pineCanopyM:T.map(A=>A.clone().multiply(Wi)),sakuraM:j.map(A=>A.clone().multiply(Yi)),rockM:I}},[e]),b=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],castShadow:b,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(bt,{matrices:l,target:n})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:b,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:Q.pine,roughness:.93,flatShading:!0}),t.jsx(bt,{matrices:h,target:s})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:b,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:E.sakura,roughness:.95,flatShading:!0,emissive:E.sakura,emissiveIntensity:.1}),t.jsx(bt,{matrices:c,target:a})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:b,receiveShadow:b,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:Q.rock,roughness:.97,flatShading:!0}),t.jsx(bt,{matrices:d,target:i})]})]})}const Ui=new at().makeTranslation(0,7,0),Wi=new at().makeTranslation(0,26,0),Yi=new at().compose(new S(0,13,0),new yt,new S(1,.72,1)),Vi=new at().compose(new S(0,5,0),new yt,new S(.75,.62,.75)),zt=Math.PI,ks={"ship-sunny.opt.glb":zt/2,"ship-tang.opt.glb":zt/2,"ship-punk.opt.glb":zt/2,"ship-lion.opt.glb":zt/2,"ship-bone.opt.glb":zt/2,"ship-junk.opt.glb":zt/2,"ship-warjunk.opt.glb":zt/2,"ship-sub.opt.glb":-zt/2},rn=e=>e&&ks[e]!==void 0?ks[e]:zt/2,$i={"ship-sunny.opt.glb":40,"ship-lion.opt.glb":40,"ship-punk.opt.glb":52,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":50,"ship-junk.opt.glb":38,"ship-warjunk.opt.glb":60},co=1.6,Ss=Object.fromEntries(Object.entries($i).map(([e,o])=>[e,Math.round(o*co)])),zs={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},ln=2,Ts={"ship-sunny.opt.glb":.513,"ship-lion.opt.glb":.274,"ship-punk.opt.glb":.264,"ship-tang.opt.glb":.208,"ship-sub.opt.glb":.261,"ship-bone.opt.glb":.353,"ship-junk.opt.glb":.313,"ship-warjunk.opt.glb":.415},Es={"ship-sunny.opt.glb":1.044,"ship-lion.opt.glb":.824,"ship-punk.opt.glb":.673,"ship-tang.opt.glb":1,"ship-sub.opt.glb":.641,"ship-bone.opt.glb":.771,"ship-junk.opt.glb":.915,"ship-warjunk.opt.glb":.702},Rs={"ship-sunny.opt.glb":.165,"ship-lion.opt.glb":.095,"ship-punk.opt.glb":.115,"ship-bone.opt.glb":.105,"ship-junk.opt.glb":.1,"ship-warjunk.opt.glb":.115,"ship-tang.opt.glb":.035,"ship-sub.opt.glb":.035},As={"ship-sunny.opt.glb":.28,"ship-lion.opt.glb":.144,"ship-punk.opt.glb":.148,"ship-tang.opt.glb":.41,"ship-sub.opt.glb":.214,"ship-bone.opt.glb":.158,"ship-junk.opt.glb":.21,"ship-warjunk.opt.glb":.244},Va=(e,o)=>(e&&As[e]!==void 0?As[e]:.2)*o/2,$a={"ship-sunny.opt.glb":[.047,.057,.057,.107,.154,.154,.113,.079,.079],"ship-lion.opt.glb":[.076,.109,.104,.098,.103,.082,.051,.017,.017],"ship-punk.opt.glb":[.073,.073,.078,.078,.079,.081,.066,.057,.057],"ship-tang.opt.glb":[.069,.089,.097,.108,.227,.227,.155,.157,.157],"ship-sub.opt.glb":[.105,.12,.16,.161,.171,.179,.145,.144,.144],"ship-bone.opt.glb":[.087,.134,.116,.116,.12,.12,.107,.107,.107],"ship-junk.opt.glb":[.065,.086,.108,.124,.141,.141,.086,.043,.043],"ship-warjunk.opt.glb":[.071,.071,.071,.123,.064,.117,.108,.018,.018]},Ka=(e,o,n)=>{const s=e&&$a[e]||null;if(!s)return Va(e,o);const a=Math.min(.9999,Math.max(0,n+.5))*(s.length-1),i=Math.floor(a);return(s[i]+(s[i+1]-s[i])*(a-i))*o},Is={"ship-sunny.opt.glb":-.061,"ship-lion.opt.glb":-.206,"ship-punk.opt.glb":-.09,"ship-tang.opt.glb":.192,"ship-sub.opt.glb":-.05,"ship-bone.opt.glb":-.064,"ship-junk.opt.glb":.093,"ship-warjunk.opt.glb":-.044},Ki=(e,o)=>(e&&Is[e]!==void 0?Is[e]:0)*o,Qa=(e,o)=>{const n=e&&$a[e]||null;if(!n)return o;const s=Math.max(...n)*.35,a=n.length,i=h=>-.5+h/(a-1),l=Math.round((o+.5)*(a-1));for(let h=0;h<a;h++)for(const c of[l-h,l+h])if(!(c<0||c>=a||n[c]<s))return h===0?o:i(c);return 0},Uo=[[0,.25,0],[-.5,0,.7],[.5,-.125,-.9],[0,-.25,Math.PI*.85]],os=(e,o,[n,s])=>{const a=Qa(e,s);return[n*Ka(e,o,a),a*o]},Xa=e=>e==="low"?Uo.slice(0,1):e==="mid"?Uo.slice(0,2):Uo,Qi=[{what:"flag",mast:.9,onMast:!0,r:.03,deep:.5},{what:"lantern port",beam:-.6,deck:!0,up:.012,z:-.125,r:.008},{what:"lantern stbd",beam:.6,deck:!0,up:.012,z:-.125,r:.008}],jo=(e,o,n)=>{const s=n.onMast?Ki(e,o)/o:Qa(e,n.z??0);return[(n.beam??0)*Ka(e,o,s),n.deck?Yt(e,o)+(n.up??0)*o:(n.mast??0)*tr(e,o),s*o]},ko=e=>Qi.find(o=>o.what===e),Xi={"ship-sunny.opt.glb":!0,"ship-punk.opt.glb":!0,"ship-tang.opt.glb":!0},Za=e=>!!(e&&Xi[e]),Zi=2.8,qa=Zi*co,Zo=e=>qa*(.72+.28*(e/(40*co))),Ja=.28*co,qo=5.2*co,Cs={"ship-sunny.opt.glb":"#e6ded0","ship-punk.opt.glb":"#c9bfae","ship-tang.opt.glb":"#ece3cd","ship-lion.opt.glb":"#9a9188","ship-sub.opt.glb":"#9a9188","ship-bone.opt.glb":"#9a9188"},ns=(e,o="#9a9188")=>e&&Cs[e]!==void 0?Cs[e]:o,qi={"ship-tang.opt.glb":["#e8c34a",.85],"ship-sub.opt.glb":["#e8c34a",.85],"ship-sunny.opt.glb":["#c9a06a",.2],"ship-punk.opt.glb":["#b06a5a",.2]},Jo=e=>e&&qi[e]||null,cn=(e,o=34)=>e&&Ss[e]!==void 0?Ss[e]:o,hn=e=>e&&zs[e]!==void 0?zs[e]:1,Ji=e=>e&&Ts[e]!==void 0?Ts[e]:.2,er=e=>e&&Rs[e]!==void 0?Rs[e]:.13,So=e=>Math.max(0,Ji(e)-er(e)),Yt=(e,o)=>er(e)*o,tr=(e,o)=>((e&&Es[e]!==void 0?Es[e]:.8)-So(e))*o,Ps={sunny:{id:"sunny",name:"THOUSAND SUNNY",crewName:"STRAW HAT",hulls:["ship-sunny.opt.glb","ship-lion.opt.glb"],flag:"straw",crew:"crew-straw.opt.glb",fleetId:"straw-hats",tint:"#c98a52",burst:{push:62,charge:9,label:"BURST",sub:"coup de"},topSpeed:64,accel:16,turn:.92},punk:{id:"punk",name:"VICTORIA PUNK",crewName:"KID",hulls:["ship-punk.opt.glb","ship-bone.opt.glb"],flag:"kid",crew:"crew-punk.opt.glb",fleetId:"kid",tint:"#9a6a4e",burst:{push:78,charge:13,label:"RAM",sub:"full ahead"},topSpeed:60,accel:12,turn:.74}},en=e=>Ps[e]??Ps.sunny,or=210,Ls={off:1,lead:.98*co*.77},pn={SPREAD:28,SWEEP:14,RANK:118},Fs=(e,o=0,n=0)=>({off:(e+(n?.5*Math.sign(e||1):0))*pn.SPREAD,lead:o-Math.abs(e)*pn.SWEEP-n*pn.RANK}),Gs={kozuki:{side:-1,from:2},yakuza:{side:1,from:2},mink:{side:0,from:9}};function el(e){const o={},n={};for(const s of e){const a=tl[s.id];if(a){Object.assign(s,Fs(a[0],a[1]));continue}const i=Gs[s.faction]?s.faction:"kozuki",l=Gs[i],h=s.rank??0,c=`${i}:${h}`;o[c]===void 0&&(o[c]=l.from,n[c]=-1);const d=l.side||n[c];Object.assign(s,Fs(d*o[c],0,h)),l.side===0?(n[c]>0&&(o[c]+=1),n[c]=-n[c]):o[c]+=1}}const tl={scabbards:[0,or],"straw-hats":[-1,150],kid:[1,150],heart:[0,60]},ol=430*_;function nl(e,o=0){const n=(820+-670*e)*_+o;return[(Math.sin(e*2.4)*54-e*26)*_,n]}function sl(e,o,n,s){const[a,i]=nl(n,s);return[a+o*_*Ls.off,i-e*_*Ls.lead]}const al=[{x:-300*_,z:100*_,yaw:.35},{x:330*_,z:360*_,yaw:-.55},{x:-390*_,z:470*_,yaw:.12},{x:420*_,z:830*_,yaw:-.28},{x:-455*_,z:930*_,yaw:.48},{x:400*_,z:1120*_,yaw:-.16},{x:-520*_,z:690*_,yaw:.22},{x:540*_,z:1290*_,yaw:-.42}],rl=[{x:K.x+132*_*.72,z:K.z+96*_*.72,yaw:2.3},{x:K.x+168*_*.72,z:K.z+40*_*.72,yaw:1.9},{x:K.x+96*_*.72,z:K.z+150*_*.72,yaw:2.7}];function il({url:e,height:o,loa:n,slim:s=1,sink:a=0,rotation:i,tint:l,emissive:h,emissiveIntensity:c,glow:d,onMaterials:b}){const{scene:g}=La(e),m=w.useMemo(()=>g.clone(!0),[g]),f=w.useMemo(()=>{const p=new Fa().setFromObject(m),x=new S;p.getSize(x);const u=new S;if(p.getCenter(u),n){const z=x.x>=x.z,T=Math.max(z?x.x:x.z,1e-4),j=n/T,I=z?[j,j,j*s]:[j*s,j,j];return{scale:I,offset:[-u.x*I[0],-p.min.y*I[1]-n*a,-u.z*I[2]]}}const v=x.y>1e-4?o/x.y:1;return{scale:[v,v,v],offset:[-u.x*v,-p.min.y*v,-u.z*v]}},[m,o,n,s,a]);return w.useEffect(()=>{const p=[];m.traverse(x=>{if(!x.isMesh)return;x.castShadow=!0,x.receiveShadow=!0;const u=x.material?Array.isArray(x.material)?x.material:[x.material]:[];for(const v of u)p.push(v),l&&(v.color?.multiply(new Se(l)),h&&v.emissive&&(v.emissive.set(h),v.emissiveIntensity=c??.2)),d&&v.emissive&&(v.emissive.set(d[0]),v.emissiveIntensity=d[1],v.map&&!v.emissiveMap&&(v.emissiveMap=v.map),v.needsUpdate=!0)}),b?.(p)},[m,l,h,c,d,b]),t.jsx("group",{rotation:[0,i,0],scale:f.scale,position:f.offset,children:t.jsx("primitive",{object:m})})}class ll extends w.Component{constructor(){super(...arguments);ps(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function xe({name:e,height:o,loa:n=null,slim:s=1,sink:a=0,rotation:i=0,position:l=[0,0,0],tint:h=null,emissive:c=null,emissiveIntensity:d=.2,glow:b=null,onMaterials:g=null,fallback:m=null}){const f=vo(e);return ot(e)?t.jsx("group",{position:l,children:t.jsx(ll,{url:f,fallback:m,children:t.jsx(w.Suspense,{fallback:m,children:t.jsx(il,{url:f,height:o,loa:n,slim:s,sink:a,rotation:i,tint:h,emissive:c,emissiveIntensity:d,glow:b,onMaterials:g})})})}):t.jsx("group",{position:l,children:m})}const Pn=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),a=s.createImageData(e,o);for(let l=0;l<o;l++){const h=l/(o-1),c=Math.pow(1-h,1.7);for(let d=0;d<e;d++){const b=d/(e-1)*2-1,g=Math.max(0,1-Math.abs(b)/(.35+h*.65)),m=.45+.55*Math.pow(Math.abs(b)/(.35+h*.65),1.5),f=c*Math.pow(g,1.4)*m,p=(l*e+d)*4;a.data[p]=255,a.data[p+1]=255,a.data[p+2]=255,a.data[p+3]=Math.round(Math.min(1,f)*255)}}s.putImageData(a,0,0);const i=new ro(n);return i.colorSpace=io,i})(),cl=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createImageData(e,e);for(let i=0;i<e;i++){const l=i/(e-1),h=Math.pow(1-l,1.5);for(let c=0;c<e;c++){const d=c/(e-1)*2-1,b=Math.max(0,1-Math.abs(d)),g=h*Math.pow(b,1.3),m=(i*e+c)*4;s.data[m]=255,s.data[m+1]=255,s.data[m+2]=255,s.data[m+3]=Math.round(Math.min(1,g)*255)}}n.putImageData(s,0,0);const a=new ro(o);return a.colorSpace=io,a})(),ss=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,0.9)"),s.addColorStop(.4,"rgba(255,255,255,0.28)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e);const a=new ro(o);return a.colorSpace=io,a})(),Wo=160,Jt=112,Lt="#e6dfcf",nr="#0c0a15",Bt=nr;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,s,a){const i=Math.min(a??0,Math.abs(n)/2,Math.abs(s)/2);return this.moveTo(e+i,o),this.arcTo(e+n,o,e+n,o+s,i),this.arcTo(e+n,o+s,e,o+s,i),this.arcTo(e,o+s,e,o,i),this.arcTo(e,o,e+n,o,i),this.closePath(),this});function Ct(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=Wo,o.height=Jt;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,0,Jt);s.addColorStop(0,"#14101f"),s.addColorStop(.5,nr),s.addColorStop(1,"#08060f"),n.fillStyle=s,n.fillRect(0,0,Wo,Jt),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,Jt),n.save(),n.translate(Wo/2+4,Jt/2);try{e(n)}catch(i){console.warn("[onigashima] flag emblem skipped",i)}n.restore();const a=new ro(o);return a.colorSpace=io,a.anisotropy=4,a}function fn(e,o,n=Lt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function mn(e,o,n=1){e.save(),e.fillStyle=Bt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Os(e,o,n=4){e.save(),e.fillStyle=Bt;for(let s=1;s<n;s++){const a=-o*.5+s*o/n;e.fillRect(a-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function gn(e,o,n=Lt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const s of[1,-1]){e.save(),e.rotate(s*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const a of[-1,1])for(const i of[-.16,.16])e.beginPath(),e.arc(a*o*1.55,o*.55+i*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const hl={straw:Ct(e=>{gn(e,26),fn(e,26),mn(e,26),Os(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Ct(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Bt;for(const s of[-1,1])e.beginPath(),e.arc(s*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Bt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Ct(e=>{gn(e,26,"#d8cfc0"),e.fillStyle=Lt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Bt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const s=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(s,26*.42),e.lineTo(s+26*.1,26*1.04),e.lineTo(s-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Ct(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const s=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(s),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),alliance:Ct(e=>{gn(e,27,"#dcd4c4"),e.fillStyle=Lt,e.beginPath();for(let n=0;n<16;n++){const s=n/16*Math.PI*2;e.moveTo(Math.cos(s)*27*1.02+27*.17,Math.sin(s)*27*1.02),e.arc(Math.cos(s)*27*1.02,Math.sin(s)*27*1.02,27*.17,0,Math.PI*2)}e.fill(),e.beginPath(),e.arc(0,0,27*1.02,0,Math.PI*2),e.fill(),e.fillStyle=Bt,e.beginPath(),e.arc(0,0,27*.9,0,Math.PI*2),e.fill(),e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*27*.1,27*.42),e.quadraticCurveTo(n*27*.92,27*.1,n*27*.62,-27*.78),e.quadraticCurveTo(n*27*.5,-27*.2,n*27*.06,27*.3),e.closePath(),e.fill();e.beginPath(),e.ellipse(27*.02,-27*.02,27*.15,27*.19,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(-27*.08,-27*.02),e.lineTo(-27*.36,27*.04),e.lineTo(-27*.08,27*.1),e.closePath(),e.fill(),e.beginPath(),e.arc(0,27*.52,27*.12,0,Math.PI*2),e.fill();for(let n=0;n<8;n++){const s=n/8*Math.PI*2;e.beginPath(),e.arc(Math.cos(s)*27*.26,27*.52+Math.sin(s)*27*.26,27*.055,0,Math.PI*2),e.fill()}}),yakuza:Ct(e=>{e.strokeStyle="#e8c86a",e.lineWidth=28*.12,e.beginPath(),e.roundRect(-28*.86,-28*.86,28*1.72,28*1.72,28*.14),e.stroke(),e.fillStyle=Lt;for(const n of[-.42,0,.42])e.fillRect(-28*.52,n*28-28*.07,28*1.04,28*.15);e.fillRect(-28*.09,-28*.55,28*.18,28*1.1),e.fillStyle="#d63420",e.beginPath(),e.arc(0,-28*1.32,28*.2,0,Math.PI*2),e.fill()}),mink:Ct(e=>{e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();fn(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),mn(e,25,.85),e.save(),e.fillStyle=Bt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Lt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Ct(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();fn(e,26,"#cfd8e4"),mn(e,26),Os(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},sr={value:0},Ds=new Map;function ul(e){const o=Ds.get(e);if(o)return o;const n=hl[e],s=new Fr({map:n,emissiveMap:n,emissive:new Se("#9fb4d8"),emissiveIntensity:.95,roughness:.94,metalness:0,side:_e,transparent:!1});return s.onBeforeCompile=a=>{a.uniforms.uTime=sr,a.vertexShader=`uniform float uTime;
`+a.vertexShader.replace("#include <begin_vertex>",`
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
        `),a.vertexShader=a.vertexShader.replace("#include <beginnormal_vertex>",`
      #include <beginnormal_vertex>
      float nHoist = uv.x * uv.x;
      objectNormal = normalize(objectNormal + vec3(
        -cos(uv.x * 8.5 - uTime * 5.2 + uv.y * 2.2) * 1.36 * nHoist, 0.0, 0.0));
      `)},s.customProgramCacheKey=()=>"onigashima-flag",Ds.set(e,s),s}function dl(){return se((e,o)=>{sr.value+=Math.min(o,.05)}),null}const pl=(()=>{const e=new Kn(1,1,14,5);return e.translate(.5,0,0),e})();function tn({crew:e="straw",width:o=qa,position:n=[0,0,0],rotation:s=Math.PI/2,staff:a=!0}){const i=w.useMemo(()=>ul(e)??null,[e]),l=o*(Jt/Wo);return i?t.jsxs("group",{position:n,rotation:[0,s,0],children:[a&&t.jsxs("mesh",{position:[0,l*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.028,o*.028,l*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{position:[-o*.02,-l*1.1,0],rotation:[0,0,-.06],children:[t.jsx("cylinderGeometry",{args:[o*.012,o*.012,l*2.4,3]}),t.jsx("meshStandardMaterial",{color:"#6b5f4a",emissive:"#6b5f4a",emissiveIntensity:.35,roughness:.9})]}),t.jsx("mesh",{geometry:pl,material:i,scale:[o,l,o]})]}):null}const Yo=[{id:"scabbards",flag:"kozuki",lead:or,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:E.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:E.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb",sailedBy:"helm"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb",sailedBy:"helm"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445",crew:"crew-heart.opt.glb",sailedBy:"sub"},{id:"kozuki-0",faction:"kozuki",flag:"kozuki",rank:0,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1",faction:"kozuki",flag:"alliance",rank:0,scale:.848,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2",faction:"kozuki",flag:"kozuki",rank:0,scale:.836,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3",faction:"kozuki",flag:"kozuki",rank:0,scale:.824,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4",faction:"kozuki",flag:"alliance",rank:0,scale:.812,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"kozuki-5",faction:"kozuki",flag:"kozuki",rank:0,scale:.8,sail:"#beb39b",hull:"#382a1e",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47",crew:"crew-samurai.opt.glb"},{id:"kozuki-6",faction:"kozuki",flag:"kozuki",rank:0,scale:.788,sail:"#bcb199",hull:"#362820",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a",crew:"crew-samurai.opt.glb"},{id:"kozuki-7",faction:"kozuki",flag:"alliance",rank:0,scale:.776,sail:"#c4b9a1",hull:"#382b1f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7b6c53",crew:"crew-samurai.opt.glb"},{id:"kozuki-8",faction:"kozuki",flag:"kozuki",rank:0,scale:.764,sail:"#c9bea7",hull:"#392c20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#81725a",crew:"crew-samurai.opt.glb"},{id:"yakuza-0",faction:"yakuza",flag:"yakuza",rank:0,scale:.84,sail:"#b8a894",hull:"#4d3026",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1",faction:"yakuza",flag:"alliance",rank:0,scale:.828,sail:"#b2a28e",hull:"#472b22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2",faction:"yakuza",flag:"yakuza",rank:0,scale:.816,sail:"#ad9d89",hull:"#42271f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3",faction:"yakuza",flag:"yakuza",rank:0,scale:.804,sail:"#bfae99",hull:"#4a2e24",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4",faction:"yakuza",flag:"alliance",rank:0,scale:.792,sail:"#a89884",hull:"#3d241d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"yakuza-5",faction:"yakuza",flag:"yakuza",rank:0,scale:.78,sail:"#b5a591",hull:"#452a21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#83654f",crew:"crew-samurai.opt.glb"},{id:"yakuza-6",faction:"yakuza",flag:"yakuza",rank:0,scale:.768,sail:"#aa9a86",hull:"#402620",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#755949",crew:"crew-samurai.opt.glb"},{id:"yakuza-7",faction:"yakuza",flag:"alliance",rank:0,scale:.756,sail:"#bcac97",hull:"#482c23",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#886851",crew:"crew-samurai.opt.glb"},{id:"yakuza-8",faction:"yakuza",flag:"yakuza",rank:0,scale:.744,sail:"#a5957f",hull:"#3a221b",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6d5142",crew:"crew-samurai.opt.glb"},{id:"mink-0",faction:"mink",flag:"mink",rank:0,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"mink-1",faction:"mink",flag:"alliance",rank:0,scale:.886,sail:"#cdc2aa",hull:"#42392b",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#68644e",crew:"crew-samurai.opt.glb"},{id:"mink-2",faction:"mink",flag:"mink",rank:0,scale:.872,sail:"#cbc0a8",hull:"#403729",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6c684f",crew:"crew-samurai.opt.glb"},{id:"mink-3",faction:"mink",flag:"mink",rank:0,scale:.858,sail:"#c6bba3",hull:"#3d352a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#666249",crew:"crew-samurai.opt.glb"},{id:"kozuki-0b",faction:"kozuki",flag:"kozuki",rank:1,scale:.8,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1b",faction:"kozuki",flag:"alliance",rank:1,scale:.788,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2b",faction:"kozuki",flag:"kozuki",rank:1,scale:.776,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3b",faction:"kozuki",flag:"kozuki",rank:1,scale:.764,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4b",faction:"kozuki",flag:"alliance",rank:1,scale:.752,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"yakuza-0b",faction:"yakuza",flag:"yakuza",rank:1,scale:.78,sail:"#b8a894",hull:"#4d3026",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1b",faction:"yakuza",flag:"alliance",rank:1,scale:.768,sail:"#b2a28e",hull:"#472b22",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2b",faction:"yakuza",flag:"yakuza",rank:1,scale:.756,sail:"#ad9d89",hull:"#42271f",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3b",faction:"yakuza",flag:"yakuza",rank:1,scale:.744,sail:"#bfae99",hull:"#4a2e24",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4b",faction:"yakuza",flag:"alliance",rank:1,scale:.732,sail:"#a89884",hull:"#3d241d",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"mink-0b",faction:"mink",flag:"mink",rank:1,scale:.84,sail:"#cec3ab",hull:"#42392c",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6a6650",crew:"crew-samurai.opt.glb"},{id:"mink-1b",faction:"mink",flag:"alliance",rank:1,scale:.826,sail:"#cabfa7",hull:"#40372a",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#6b674e",crew:"crew-samurai.opt.glb"},{id:"mink-2b",faction:"mink",flag:"mink",rank:1,scale:.812,sail:"#ccc1a9",hull:"#413828",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#69654d",crew:"crew-samurai.opt.glb"},{id:"mink-3b",faction:"mink",flag:"mink",rank:1,scale:.798,sail:"#c8bda5",hull:"#3f3629",lamp:E.lantern,model:"ship-junk.opt.glb",tint:"#676349",crew:"crew-samurai.opt.glb"}];el(Yo);function Ns({color:e,position:o,scale:n=1}){return t.jsxs("group",{position:o,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[Ja*n,7,5]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[qo*n,qo*n,1],children:t.jsx("spriteMaterial",{map:ss,color:e,transparent:!0,opacity:.5,depthWrite:!1,blending:pt,toneMapped:!1})})]})}function fl({spec:e,quality:o}){const n=w.useRef(),s=w.useRef(),a=w.useRef();se(()=>{const f=n.current;if(!f)return;const p=y.mode&&y.mode!=="off",x=en(y.vessel).fleetId;if(f.visible=!(e.sailedBy==="sub"?y.mode==="sub":e.sailedBy==="helm"&&(y.mode==="helm"||y.mode==="foot")&&x===e.id),!f.visible)return;const u=p?0:R.clamp(y.progress*.82+.04,0,1),[v,z]=sl(e.lead,e.off,u,p?ol:0),T=Mo(v,z),j=R.clamp(-re(v,z)/46,0,1),I=R.lerp(1,.055,T)*R.smoothstep(j,0,.28),r=xt(v,z,y.t,I),k=e.sub?R.smoothstep(y.progress,.42,.6):0;f.position.set(v,r.y-k*40,z);const P=e.sub?.35:1;f.rotation.x=R.clamp(r.dz*1.35*P,-.32,.32),f.rotation.z=R.clamp(-r.dx*1.15*P,-.28,.28),f.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,s.current&&(s.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,s.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),a.current&&(a.current.material.opacity=.36*(.25+(1-T)*.75)*(1-k))});const i=e.scale,l=o==="low"?6:10,h=ot(e.model2??""),c=ot(e.model??""),d=h?e.model2:c?e.model:null,b=d==="ship-junk.opt.glb",g=cn(d,34)*(b?e.scale??1:1),m=ot(e.crew??"");return d?t.jsxs("group",{ref:n,children:[t.jsx(xe,{name:d,loa:g,slim:hn(d),sink:So(d),rotation:rn(d),tint:h?ns(d):e.tint,emissive:"#3a2a18",emissiveIntensity:.16,glow:Jo(d)}),m&&Xa(o).map((f,p)=>{const[x,u]=os(d,g,f);return t.jsx(xe,{name:e.crew,height:ln,rotation:f[2],position:[x,Yt(d,g),u]},`crew-${p}`)}),e.flag&&!Za(d)&&t.jsx(tn,{crew:e.flag,width:Zo(g),position:jo(d,g,ko("flag")),staff:!!e.sub}),["lantern port","lantern stbd"].map(f=>t.jsx(Ns,{color:e.lamp,position:jo(d,g,ko(f))},f)),t.jsxs("mesh",{ref:a,position:[0,.6,-g*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[g*.55,g*2.3]}),t.jsx("meshBasicMaterial",{map:Pn,color:Q.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:i*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,l]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:_e,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(f=>[0,1,2,3].map(p=>t.jsxs("mesh",{position:[f*5.6,3.4,-6+p*4],rotation:[0,0,f*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${f}-${p}`))),e.flag&&t.jsx(tn,{crew:e.flag,width:Zo(g)/(i*1.7),position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsx(Ns,{color:e.lamp,scale:1/(i*1.7),position:[0,e.open?5.6:9.4,e.open?7:-7.4]})]}),t.jsxs("mesh",{ref:a,position:[0,.6,-34*i],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*i,74*i]}),t.jsx("meshBasicMaterial",{map:Pn,color:Q.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Hs({x:e,z:o,yaw:n,name:s,loa:a,tint:i,flag:l=null,crew:h=null,quality:c="high"}){const d=cn(s,a),b=w.useRef(),g=ot(s),m=ot(h??"");return se(()=>{const f=b.current;if(!f)return;const p=Mo(e,o),x=R.clamp(-re(e,o)/46,0,1),u=R.lerp(1,.055,p)*R.smoothstep(x,0,.28),v=xt(e,o,y.t,u);f.position.set(e,v.y,o),f.rotation.set(R.clamp(v.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,R.clamp(-v.dx,-.22,.22))}),t.jsxs("group",{ref:b,children:[t.jsx(xe,{name:s,loa:d,slim:hn(s),sink:So(s),rotation:rn(s),tint:i,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&m&&g&&Xa(c).slice(0,2).map((f,p)=>{const[x,u]=os(s,d,f);return t.jsx(xe,{name:h,height:ln,rotation:f[2],position:[x,Yt(s,d),u]},`watch-${p}`)}),l&&g&&t.jsx(tn,{crew:l,width:Zo(d),position:jo(s,d,ko("flag"))})]})}function ml({quality:e="high"}){const o=w.useMemo(()=>e==="low"?Yo.slice(0,7):e==="mid"?Yo.slice(0,22):Yo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(dl,{}),o.map(n=>t.jsx(fl,{spec:n,quality:e},n.id)),e!=="low"&&al.map((n,s)=>t.jsx(Hs,{quality:e,...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts",crew:"crew-samurai.opt.glb"},`picket-${s}`)),e!=="low"&&rl.map((n,s)=>t.jsx(Hs,{quality:e,...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki",crew:"crew-samurai.opt.glb"},`moored-${s}`))]})}const gl=2,_s={"powder-keg.opt.glb":2.4,"war-cannon.opt.glb":4.2,"bomb-sphere.opt.glb":3.6,"sake-tower.opt.glb":5,"wisteria-trellis.opt.glb":8,"banquet-table.opt.glb":2.4,"stone-lantern.opt.glb":4,"oni-daiko.opt.glb":6,"oni-guardian.opt.glb":13,"oni-throne.opt.glb":12,"kagura-stage.opt.glb":40,"treasure-kura.opt.glb":16,"rear-gatehouse.opt.glb":18,"keep-tier.opt.glb":56,"arch-bridge.opt.glb":14},ce=(e,o=6)=>e&&_s[e]!==void 0?_s[e]:o,Pt=30,xl="#2e2a33",Ln="#3a4152",Fn=Q.snow,on="#cfe0f4";function Bs({position:e}){const o=ce("stone-lantern.opt.glb")/7.8;return t.jsx("group",{position:e,children:t.jsx(xe,{name:"stone-lantern.opt.glb",height:ce("stone-lantern.opt.glb"),tint:"#8a93a8",fallback:t.jsxs("group",{scale:o,children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:on,emissive:on,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.9})]})]})})})}function bl({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2(W.dir[0],W.dir[1]),[]);return t.jsxs("group",{position:[W.gate.x,W.benchY,W.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Ln,roughness:.92})]},n)),t.jsx(xe,{name:"rear-gatehouse.opt.glb",height:ce("rear-gatehouse.opt.glb"),rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:xl,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Fn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:_e})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:on,emissive:on,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Bs,{position:[-14,0,10]}),t.jsx(Bs,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const Ao=new Se,Gn={color:"#7fd8c8",intensity:9e3,distance:320},xn={color:"#ffc48a",intensity:12e3,distance:300},wl=new Se(Gn.color),yl={low:1,mid:2,high:4},Xt=[{pos:[K.x,40,K.z],color:E.lantern,intensity:16e3,distance:460*_*.65},{pos:[0,78,Dt],color:E.lantern,intensity:15e3,distance:430},{pos:[he.x,he.y+6,he.z-30],color:E.emberDeep,intensity:3e4,distance:640},{pos:[W.gate.x,30,W.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function vl({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const s=w.useRef(),a=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef(),d=Me(g=>g.camera),b=yl[e]??5;return se(()=>{if(s.current){s.current.intensity=y.flash*9e3;const f=y.flashDir;s.current.position.set(f.x*700,260+f.y*500,pe.z+f.z*700)}const g=y.t;a.current&&(a.current.intensity=62e3*(.86+.14*Math.sin(g*2.3)*Math.sin(g*.71))),i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(g*1.9+2.1)*Math.sin(g*.63)));const m=y.inside;if(h.current&&(h.current.intensity=.16+m*.3),c.current&&(c.current.intensity=.34+m*.26),l.current){const f=l.current,p=.06;let x=Xt[0],u=1/0;for(const v of Xt){const z=(d.position.x-v.pos[0])**2+(d.position.z-v.pos[2])**2;z<u&&(u=z,x=v)}if(y.subActive&&u>550*550){const v=y.subPos,z=Math.min(1,y.underwater/.35);f.position.x+=(v.x-f.position.x)*.3,f.position.y+=(v.y+14-f.position.y)*.3,f.position.z+=(v.z-f.position.z)*.3,Ao.set(xn.color).lerp(wl,z),f.color.lerp(Ao,p),f.intensity+=(R.lerp(xn.intensity,Gn.intensity,z)-f.intensity)*p,f.distance=R.lerp(xn.distance,Gn.distance,z)}else if(y.helmActive&&u>550*550){const v=y.helmPos;f.position.x+=(v.x-f.position.x)*.25,f.position.y+=(v.y+16-f.position.y)*.25,f.position.z+=(v.z-f.position.z)*.25,f.color.lerp(Ao.set(E.lantern),p),f.intensity+=(11e3-f.intensity)*p,f.distance=300}else f.position.x+=(x.pos[0]-f.position.x)*p,f.position.y+=(x.pos[1]-f.position.y)*p,f.position.z+=(x.pos[2]-f.position.z)*p,f.color.lerp(Ao.set(x.color),p),f.intensity+=(x.intensity-f.intensity)*p,f.distance=x.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:Q.skyLow}),t.jsx("hemisphereLight",{ref:c,args:[Q.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(_/1.55),"shadow-camera-right":520*(_/1.55),"shadow-camera-top":520*(_/1.55),"shadow-camera-bottom":-520*(_/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:a,position:b>=2?[Ie[0].x,Ie[0].y,Ie[0].z]:[(Ie[0].x+Ie[1].x)/2,Ie[0].y,Ie[0].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),b>=2&&t.jsx("pointLight",{ref:i,position:[Ie[1].x,Ie[1].y,Ie[1].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:l,position:Xt[0].pos,color:Xt[0].color,intensity:Xt[0].intensity,distance:Xt[0].distance,decay:2}),b>=3&&t.jsx("pointLight",{position:[he.x,he.y+4,he.z-34],color:E.emberDeep,intensity:3e4,distance:640,decay:2}),b>=4&&t.jsx("pointLight",{position:[0,78,Dt],color:E.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:s,position:[0,700,-700],color:Q.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function bn(e,o){let n=e>>>0;const s=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),a=[],i=o==="low"?3:5,l=(p,x,u,v,z)=>{const T=[p.clone()],j=p.clone();for(let r=0;r<v;r++)j.add(new S((s()-.5)*u*.55,-u/v,(s()-.5)*u*.42)).add(x.clone().multiplyScalar(u/v*.3)),T.push(j.clone());const I=new ao(new so(T),v*2,z,i,!1);return a.push(I),T},h=l(new S(0,620,0),new S(0,0,0),620,9,3.4),c=o==="low"?1:3;for(let p=0;p<c;p++){const x=h[2+Math.floor(s()*(h.length-3))];l(x.clone(),new S(s()-.5,0,s()-.5).multiplyScalar(2),190+s()*130,4,1.5)}let d=0;for(const p of a)d+=p.attributes.position.count;const b=new Float32Array(d*3),g=new Float32Array(d*3);let m=0;for(const p of a)b.set(p.attributes.position.array,m*3),g.set(p.attributes.normal.array,m*3),m+=p.attributes.position.count,p.dispose();const f=new Nt;return f.setAttribute("position",new ne(b,3)),f.setAttribute("normal",new ne(g,3)),f}function Ml({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),s=w.useRef({i:0,t:-1,dur:0,flicker:0}),a=w.useMemo(()=>[bn(40503,e),bn(20973,e),bn(10196,e)],[e]);return se((i,l)=>{const h=Math.min(l,.05),c=s.current;if(n.current-=h,n.current<=0&&c.t<0){c.i=(c.i+1)%3,c.t=0,c.dur=.16+Math.random()*.26,c.flicker=2+Math.floor(Math.random()*3);const d=o[c.i].current;if(d){const b=(Math.random()-.5)*2.4-Math.PI*.5,g=620+Math.random()*760;d.position.set(pe.x+Math.cos(b)*g,40+Math.random()*120,pe.z+Math.sin(b)*g*.7-240),d.rotation.y=Math.random()*Math.PI*2;const m=.7+Math.random()*.8;d.scale.set(m,m,m),y.flashDir.set(d.position.x,d.position.y+400,d.position.z).normalize()}n.current=R.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(c.t>=0){c.t+=h;const d=c.t/c.dur,b=Math.abs(Math.sin(d*Math.PI*c.flicker)),g=Math.max(0,1-d);y.flash=g*g*b;const m=o[c.i].current;m&&(m.material.opacity=Math.min(1,y.flash*2.2)),d>=1&&(c.t=-1,y.flash=0,m&&(m.material.opacity=0))}else y.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:a.map((i,l)=>t.jsx("mesh",{ref:o[l],geometry:i,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:Q.bolt,transparent:!0,opacity:0,blending:pt,depthWrite:!1,toneMapped:!1})},l))})}const jl=`
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
`,kl=`
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
`,Us={low:1600,mid:3800,high:7e3},Io=460;function Sl({quality:e}){const o=w.useRef(),n=Me(i=>i.camera),s=w.useMemo(()=>{const i=Us[e]??Us.high,l=new Float32Array(i*3),h=new Float32Array(i),c=new Float32Array(i);for(let b=0;b<i;b++)l[b*3]=Math.random()*Io,l[b*3+1]=Math.random()*Io,l[b*3+2]=Math.random()*Io,h[b]=.7+Math.random()*.6,c[b]=.55+Math.random()*.85;const d=new Nt;return d.setAttribute("position",new ne(l,3)),d.setAttribute("aSpeed",new ne(h,1)),d.setAttribute("aLen",new ne(c,1)),d.boundingSphere=new lo(new S,1e6),d},[e]),a=w.useMemo(()=>({uTime:{value:0},uCam:{value:new S},uBox:{value:Io},uFall:{value:118},uSize:{value:2.4},uColor:{value:new S(...ie("#b9c8e4"))},uOpacity:{value:.5}}),[]);return se((i,l)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=l,h.uCam.value.copy(n.position),h.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:s,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:jl,fragmentShader:kl,uniforms:a,transparent:!0,depthWrite:!1,fog:!1})})}const zl=`
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
`,Tl=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Ws={low:120,mid:340,high:700};function El({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const a=Ws[e]??Ws.high,i=[Ie[0],Ie[1],he,he],l=new Float32Array(a*3),h=new Float32Array(a),c=new Float32Array(a),d=new Float32Array(a);for(let g=0;g<a;g++){const m=i[g%i.length];l[g*3]=m.x+(Math.random()-.5)*74,l[g*3+1]=m.y+(Math.random()-.5)*30,l[g*3+2]=m.z+(Math.random()-.5)*26,h[g]=Math.random(),c[g]=.045+Math.random()*.055,d[g]=2+Math.random()*4}const b=new Nt;return b.setAttribute("position",new ne(l,3)),b.setAttribute("aPhase",new ne(h,1)),b.setAttribute("aRise",new ne(c,1)),b.setAttribute("aSize",new ne(d,1)),b.boundingSphere=new lo(new S(0,300,-260),700),b},[e]),s=w.useMemo(()=>({uTime:{value:0},uColor:{value:new S(...ie(E.ember))}}),[]);return se((a,i)=>{o.current&&(o.current.uniforms.uTime.value+=i)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:zl,fragmentShader:Tl,uniforms:s,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function Rl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Ml,{quality:e}),t.jsx(Sl,{quality:e}),t.jsx(El,{quality:e})]})}const Al=`
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
`,Il=`
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
`,Ys={low:150,mid:380,high:620};function Cl({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),a=w.useMemo(()=>{const l=Ys[o]??Ys.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l),g=new Float32Array(l),m=new Float32Array(l);for(let p=0;p<l;p++)c[p]=Math.random()*Math.PI*2,d[p]=Math.random(),b[p]=.05+Math.random()*.05,g[p]=3+Math.random()*6,m[p]=Math.random();const f=new Nt;return f.setAttribute("position",new ne(h,3)),f.setAttribute("aAngle",new ne(c,1)),f.setAttribute("aPhase",new ne(d,1)),f.setAttribute("aRate",new ne(b,1)),f.setAttribute("aSize",new ne(g,1)),f.setAttribute("aJitter",new ne(m,1)),f.boundingSphere=new lo(new S(e.x,0,e.z),e.r*1.6+40),f},[o,e]),i=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new Qn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new S(...ie(Q.foam))},uGain:{value:1}}),[e]);return se((l,h)=>{const c=n.current?.uniforms;if(!c)return;c.uTime.value+=h;const d=Math.hypot(l.camera.position.x-e.x,l.camera.position.z-e.z);c.uGain.value=1-R.smoothstep(d,1600,2400),s.current&&(s.current.visible=c.uGain.value>.02)}),t.jsx("points",{ref:s,geometry:a,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Al,fragmentShader:Il,uniforms:i,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function Pl({quality:e="high"}){const o=Me(n=>n.camera);return se(()=>{let n=0;for(const s of Be){const a=Math.hypot(o.position.x-s.x,o.position.z-s.z);n=Math.max(n,1-R.smoothstep(a,s.r*.3,s.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Be.map((n,s)=>t.jsx(Cl,{whirl:n,quality:e},s))})}const Y={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},no={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<oo-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*_},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Dt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*_},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=Kr("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<W.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},Ll=e=>no[e]?no[e].length:0,Fl=()=>Y.chain&&no[Y.chain]?no[Y.chain][Y.step]??null:null;function On(e){Y.chain=no[e]?e:null,Y.step=0,Y.hull=1,Y.grip=0,Y.clock=0,Y.done=!1,Y.banner=null,Y.rev++}function nn(e,o,n=3.4){Y.banner={text:e,sub:o,until:Y.clock+n},Y.rev++}function Wt(e,o){Y.hull<=0||(Y.hull=Math.max(0,Y.hull-e),Y.hits++,Y.hull<=0?nn("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&nn(o,null,2.2),Y.rev++)}function ar(e,o){if(Y.clock+=e,Y.banner&&Y.clock>Y.banner.until&&(Y.banner=null,Y.rev++),!Y.chain||Y.done||!o)return;const n=no[Y.chain],s=n[Y.step];if(!s)return;let a=!1;try{a=!!s.test(o)}catch{a=!1}a&&(Y.step++,Y.step>=n.length?(Y.done=!0,nn("OBJECTIVE COMPLETE",Gl[Y.chain]??"",6)):nn(n[Y.step].text,n[Y.step].hint,3.6),Y.rev++)}const Gl={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function rr(e,{danger:o,headingX:n,headingZ:s,toCentreX:a,toCentreZ:i,speed:l,throttle:h}){if(o<=.001)return Y.grip=Math.max(0,Y.grip-e*.5),Y.grip;const c=Math.hypot(a,i)||1,d=-a/c,b=-i/c,g=n*d+s*b,m=Math.min(1,Math.abs(l)/22),f=o*.42,p=Math.max(0,g)*m*(.35+.45*Math.min(1,Math.abs(h)));return Y.grip=Math.max(0,Math.min(1,Y.grip+(f-p)*e)),Y.grip}const Vs=24,wn=Ko.safe,$s=Ko.range,po=2.1,Ol=1.5,Ks=22,Dl=[Dt,oo],Nl=new at,yn=new S,Qs=new yt,vn=new S;function Hl({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:Vs},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),s=w.useRef(0),a=w.useMemo(()=>{const i=new Ga(.55,1,1,e==="low"?6:10,1,!0);return i.translate(0,.5,0),i},[e]);return se((i,l)=>{const h=o.current;if(!h)return;const c=Math.min(l,.05),d=y.helm;if(y.helmActive&&d&&!d.onFoot&&!d.sub&&!d.moored){let m=null,f=1/0;for(const p of Dl){const x=Math.hypot(d.x,d.z-p);x<wn||x>$s||x<f&&(f=x,m=p)}if(m!==null&&(s.current-=c,s.current<=0)){const p=1-R.clamp((f-wn)/($s-wn),0,1);s.current=R.lerp(4.5,1.9,p);const x=n.find(u=>!u.live);if(x){const u=po*.55,v=R.lerp(230,105,p);x.x=d.x+Math.sin(d.heading)*d.speed*u+(Math.random()-.5)*v,x.z=d.z+Math.cos(d.heading)*d.speed*u+(Math.random()-.5)*v,x.y0=210+Math.random()*60,x.t=0,x.live=!0}}}let g=0;for(const m of n){if(!m.live)continue;const f=m.t;if(m.t+=c,m.t<po){const p=m.t/po;yn.set(m.x,m.y0*(1-p*p),m.z),vn.set(2.2,9,2.2)}else{if(f<po){const u=Math.hypot(m.x-d.x,m.z-d.z);u<Ks&&Wt(.03*(1-u/Ks)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const p=(m.t-po)/Ol;if(p>=1){m.live=!1;continue}const x=Math.min(1,p*4);yn.set(m.x,xt(m.x,m.z,y.t,1).y-4,m.z),vn.set(11+p*9,78*x*(1-p*p*.75),11+p*9)}Qs.identity(),h.setMatrixAt(g,Nl.compose(yn,Qs,vn)),g++}h.count=g,h.instanceMatrix.needsUpdate=!0,h.visible=g>0}),t.jsx("instancedMesh",{ref:o,args:[a,void 0,Vs],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:Q.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:pt,side:_e})})}const _l=`
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
`,Bl=`
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
`,Xs={low:700,mid:1800,high:3200},Co=260;function Ul({quality:e}){const o=w.useRef(),n=w.useRef(),s=Me(l=>l.camera),a=w.useMemo(()=>{const l=Xs[e]??Xs.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),b=new Float32Array(l);for(let m=0;m<l;m++)h[m*3]=Math.random()*Co,h[m*3+1]=Math.random()*Co,h[m*3+2]=Math.random()*Co,c[m]=.5+Math.random()*1.4,d[m]=1.2+Math.random()*3.2,b[m]=Math.random();const g=new Nt;return g.setAttribute("position",new ne(h,3)),g.setAttribute("aSpeed",new ne(c,1)),g.setAttribute("aSize",new ne(d,1)),g.setAttribute("aPhase",new ne(b,1)),g.boundingSphere=new lo(new S,1e6),g},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new S},uBox:{value:Co},uColor:{value:new S(...ie("#cfeee6"))},uGain:{value:0}}),[]);return se((l,h)=>{const c=o.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(s.position),c.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:a,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:_l,fragmentShader:Bl,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const Wl=`
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
`,Yl=`
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
`,Zs={low:260,mid:700,high:1300},Vl=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,$l=`
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
`,qs=1100;function Kl({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),a=Me(h=>h.camera),i=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,c=new Ga(e.r*1.02,e.r*.07,qs,h,6,!0);return c.translate(e.x,-qs/2-3,e.z),c},[e,o]),l=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new S(...ie(Q.foam))},uDeep:{value:new S(...ie(Q.underGlow))},uCameraPos:{value:new S},uFogDensity:{value:.0062},uFogColor:{value:new S(...ie(Q.underHaze))}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c,d.uCameraPos.value.copy(h.camera.position),d.uFogDensity.value=h.scene.fog?.density??.0062;const b=h.scene.fog?.color;b&&d.uFogColor.value.set(b.r,b.g,b.b);const g=Math.hypot(a.position.x-e.x,a.position.z-e.z),m=1-R.smoothstep(g,e.r*8,e.r*24);d.uGain.value+=(y.underwater*m-d.uGain.value)*Math.min(1,c*4),s.current&&(s.current.visible=d.uGain.value>.012)}),t.jsx("mesh",{ref:s,geometry:i,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Vl,fragmentShader:$l,uniforms:l,transparent:!0,depthWrite:!1,side:_e,blending:pt,fog:!1})})}function Ql({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),a=Me(h=>h.camera),i=w.useMemo(()=>{const h=Zs[o]??Zs.high,c=new Float32Array(h*3),d=new Float32Array(h),b=new Float32Array(h),g=new Float32Array(h),m=new Float32Array(h),f=new Float32Array(h);for(let x=0;x<h;x++)d[x]=Math.random()*Math.PI*2,b[x]=Math.random(),g[x]=.07+Math.random()*.1,m[x]=.12+Math.pow(Math.random(),1.8)*.5,f[x]=2+Math.random()*5;const p=new Nt;return p.setAttribute("position",new ne(c,3)),p.setAttribute("aAngle",new ne(d,1)),p.setAttribute("aPhase",new ne(b,1)),p.setAttribute("aRate",new ne(g,1)),p.setAttribute("aRadius",new ne(m,1)),p.setAttribute("aSize",new ne(f,1)),p.boundingSphere=new lo(new S(e.x,-60,e.z),e.r+140),p},[o,e]),l=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new Qn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new S(...ie(Q.underGlow))},uGain:{value:0}}),[e]);return se((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c;const b=Math.hypot(a.position.x-e.x,a.position.z-e.z),g=1-R.smoothstep(b,e.r*1.2,e.r*4);d.uGain.value=y.underwater*g,s.current&&(s.current.visible=d.uGain.value>.015)}),t.jsx("points",{ref:s,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Wl,fragmentShader:Yl,uniforms:l,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}function Xl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Ul,{quality:e}),Be.map((o,n)=>t.jsx(Ql,{whirl:o,quality:e},n)),Be.map((o,n)=>t.jsx(Kl,{whirl:o,quality:e},`w${n}`))]})}const sn=16/9,ir=96,lr=78;function Dn(e,o,n=ir){if(!o||o>=sn)return e;const s=R.degToRad(e)/2,a=2*Math.atan(Math.tan(s)*sn/o);return Math.min(n,R.radToDeg(a))}function cr(e){return!e||e>=sn?1:R.clamp(.72+.28*(e/sn),.86,1)}function Nn(e,o,n,s=.06,a=ir){const i=Dn(o,e.aspect,a);Math.abs(e.fov-i)<=.05||(e.fov+=(i-e.fov)*(1-Math.pow(s,n)),e.updateProjectionMatrix())}function Hn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*R.clamp(1280/o,.55,2.2)}const hr="oni.settings.v1";function Zl(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const ve={comfort:0,lookSens:1,invertY:!1,freeCam:!1,hud:!0},_n=new Set;function ql(){for(const e of _n)e(ve)}function as(e){return _n.add(e),()=>_n.delete(e)}function rs(e,o){e in ve&&(ve[e]=o,tc(),ql())}function eo(e){rs(e,!ve[e])}function Jl(){rs("comfort",ve.comfort<.01?.55:ve.comfort<.9?1:0)}function ec(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=ve.lookSens-1e-6);rs("lookSens",e[(o+1)%e.length])}function tc(){try{localStorage.setItem(hr,JSON.stringify(ve))}catch{}}function oc(){let e=null;try{e=JSON.parse(localStorage.getItem(hr)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(ve))o!=="hud"&&typeof e[o]==typeof ve[o]&&(ve[o]=e[o]);else ve.comfort=Zl()?1:0;return ve}const Oe=(e,o)=>e+(o-e)*ve.comfort,fo=e=>e<-1?-1:e>1?1:e,C={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,jumpQueued:!1,boardQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},At={level:0},Bn=new Set;function nc(e){return Bn.add(e),()=>Bn.delete(e)}function is(e){if(At.level===e)return e;At.level=e;for(const o of Bn)o(e);return e}function ur(){return is((At.level+1)%3)}const ee={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},yo=new Set,ft=(...e)=>e.some(o=>yo.has(o));function dr(){C.throttle=0,C.rudder=0,C.planes=0,C.boost=!1,C.walk.x=0,C.walk.z=0,C.surfaceQueued=!1,C.periscopeQueued=!1,C.burstQueued=!1,C.recentreQueued=!1,C.jumpQueued=!1,C.boardQueued=!1,C.zoom=0,C.pistolQueued=!1,C.bazookaQueued=!1,C.gigantQueued=!1,C.rocketQueued=!1,C.hakiQueued=!1,C.gear2Queued=!1,C.gatlingHeld=!1,C.balloonHeld=!1,ee.gatling=!1,ee.balloon=!1,is(0),ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0,yo.clear()}function sc(){const e=a=>!!a&&(a.isContentEditable||/^(input|textarea|select)$/i.test(a.tagName??"")),o=a=>{if(a.metaKey||a.ctrlKey||a.altKey||e(a.target))return;const i=a.key.toLowerCase();yo.add(i),i==="f"&&(C.surfaceQueued=!0),i==="p"&&(C.periscopeQueued=!0),i==="b"&&!a.repeat&&(C.burstQueued=!0),i==="r"&&!a.repeat&&(C.recentreQueued=!0),i==="v"&&!a.repeat&&eo("freeCam"),i==="."&&!a.repeat&&eo("hud"),i==="x"&&!a.repeat&&ur(),i===" "&&!a.repeat&&(C.jumpQueued=!0),i==="t"&&!a.repeat&&(C.boardQueued=!0),i==="j"&&!a.repeat&&(C.pistolQueued=!0),i==="k"&&!a.repeat&&(C.bazookaQueued=!0),i==="l"&&!a.repeat&&(C.gigantQueued=!0),i==="g"&&!a.repeat&&(C.rocketQueued=!0),i==="h"&&!a.repeat&&(C.hakiQueued=!0),i==="n"&&!a.repeat&&(C.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(i)&&a.preventDefault()},n=a=>yo.delete(a.key.toLowerCase()),s=()=>dr();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",s),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",s),yo.clear()}}function ac(){const e=ft("w","arrowup")?1:0,o=ft("s","arrowdown")?1:0,n=ft("a","arrowleft")?1:0,s=ft("d","arrowright")?1:0,a=ft("q"," ")?1:0,i=ft("e","c")?1:0,l=fo(e-o+ee.throttle);l<-.05&&At.level&&is(0),C.throttle=At.level>0?Math.max(l,1):l,C.rudder=fo(n-s+ee.rudder),C.planes=fo(a-i+ee.planes),C.boost=ft("shift")||ee.boost||At.level===2,C.zoom=(ft("]","=","+")?1:0)-(ft("[","-","_")?1:0),C.gatlingHeld=ft("u")||ee.gatling,C.balloonHeld=ft("i")||ee.balloon,C.walk.x=fo(s-n+ee.walk.x),C.walk.z=fo(e-o+ee.walk.z)}const Un=[0,(Ie[0].y+Ie[1].y)/2,Ie[0].z],pr=[he.x,he.y,he.z],an=W.dir,fr=[W.x+an[0]*300,-36,W.z+an[1]*300],mr=[W.x+an[0]*46,34,W.z+an[1]*46],gr=[W.gate.x,4,W.gate.z],xr=[W.gate.x,22,W.gate.z],rc=1.55,Wn=_/rc,ic=1+(Wn-1)*.35,jt=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Un,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:fr,to:mr,lookFrom:gr,lookTo:xr,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:pr,lookTo:Un,swell:0}],lc=new Set([Un,pr,fr,mr,gr,xr]),Po=e=>lc.has(e)?e:[e[0]*Wn,e[1]*ic,e[2]*Wn];for(const e of jt)e.from=Po(e.from),e.to=Po(e.to),e.lookFrom=Po(e.lookFrom),e.lookTo=Po(e.lookTo);const Yn=jt.reduce((e,o)=>e+o.dur,0),Js=jt,cc=e=>e*e*(3-2*e),hc=e=>1-Math.pow(1-e,2.2),Lo=e=>new S(e[0],e[1],e[2]),Gt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function uc(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,s=new Map;let a=0,i=null;const l=(g,m)=>{const f=y.orbit,p=f.dist*.0016,x=Math.cos(f.yaw),u=-Math.sin(f.yaw);f.target.x-=x*g*p,f.target.z-=u*g*p;const v=Math.cos(f.pitch),z=Math.sin(f.pitch);f.target.y+=m*p*v,f.target.x+=Math.sin(f.yaw)*m*p*z,f.target.z+=Math.cos(f.yaw)*m*p*z,br()},h=g=>{s.set(g.pointerId,{x:g.clientX,y:g.clientY});try{n.setPointerCapture?.(g.pointerId)}catch{}if(s.size===2){const[m,f]=[...s.values()];a=Math.hypot(m.x-f.x,m.y-f.y),i={x:(m.x+f.x)/2,y:(m.y+f.y)/2}}},c=g=>{const m=s.get(g.pointerId);if(!m)return;const f=g.clientX-m.x,p=g.clientY-m.y;if(m.x=g.clientX,m.y=g.clientY,s.size>=2){const[x,u]=[...s.values()],v=Math.hypot(x.x-u.x,x.y-u.y),z={x:(x.x+u.x)/2,y:(x.y+u.y)/2};if(a>8&&v>8){const T=y.orbit;T.dist=R.clamp(T.dist*(a/v),...Gt.dist)}i&&l(z.x-i.x,z.y-i.y),a=v,i=z,g.cancelable&&g.preventDefault();return}if(g.shiftKey||g.buttons===4)l(f,p);else{const x=y.orbit;x.yaw-=f*.005*Hn(),x.pitch=R.clamp(x.pitch+p*.004*Hn(),...Gt.pitch)}g.cancelable&&g.preventDefault()},d=g=>{s.delete(g.pointerId)&&s.size<2&&(a=0,i=null)},b=g=>{g.preventDefault();const m=y.orbit;m.dist=R.clamp(m.dist*(1+Math.sign(g.deltaY)*.11),...Gt.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",c,{passive:!1}),n.addEventListener("pointerup",d),n.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),n.addEventListener("wheel",b,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",c),n.removeEventListener("pointerup",d),n.removeEventListener("pointercancel",d),window.removeEventListener("pointerup",d),n.removeEventListener("wheel",b),s.clear()}},[e,o])}function br(){const e=y.orbit;e.target.x=R.clamp(e.target.x,-4200,Gt.xz),e.target.z=R.clamp(e.target.z,-4200,Gt.xz),e.target.y=R.clamp(e.target.y,...Gt.y)}function dc({onRails:e,playing:o,speed:n=1,onShot:s,idle:a=!1}){const i=Me(b=>b.camera),l=Me(b=>b.gl),h=w.useRef(0),c=w.useRef(-1),d=w.useRef(new S(0,150,-260));return uc(!e&&!a,l),w.useEffect(()=>{if(e)return;const b=y.orbit,g=i.position.clone().sub(b.target);b.dist=R.clamp(g.length(),...Gt.dist),b.yaw=Math.atan2(g.x,g.z),b.pitch=Math.asin(R.clamp(g.y/(g.length()||1),-1,1))},[e,i]),se((b,g)=>{if(a)return;const m=Math.min(g,.05);if(y.t+=m,e){if(y.jumpTo!=null){let A=0;for(let M=0;M<y.jumpTo&&M<jt.length;M++)A+=jt[M].dur;h.current=A,y.jumpTo=null}o&&(h.current=(h.current+m*n)%Yn);let v=0,z=0;for(;z<jt.length&&!(h.current<v+jt[z].dur);z++)v+=jt[z].dur;const T=jt[Math.min(z,jt.length-1)],j=R.clamp((h.current-v)/T.dur,0,1);c.current!==z&&(c.current=z,y.shot=z,s?.(z,T));const I=Lo(T.from).lerp(Lo(T.to),hc(j)),r=Lo(T.lookFrom).lerp(Lo(T.lookTo),cc(j)),k=T.swell??0;if(k>0){const A=y.t;I.y+=Math.sin(A*.62)*3.1*k+Math.sin(A*1.31+1.2)*1.2*k,I.x+=Math.sin(A*.44+.6)*2.2*k}I.x+=Math.sin(y.t*.83)*.35,I.y+=Math.sin(y.t*1.17+2)*.28,i.position.copy(I),d.current.lerp(r,1-Math.pow(1e-4,m)),i.lookAt(d.current),k>0&&i.rotateZ(Math.sin(y.t*.51)*.024*k);const P=Dn(T.fov,i.aspect);Math.abs(i.fov-P)>.01&&(i.fov+=(P-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.progress=h.current/Yn}else{const v=y.orbit;C.recentreQueued&&(C.recentreQueued=!1,v.target.set(F.x,F.baseY*.55,F.z),v.dist=R.clamp(v.dist,260,1400));const z=C.walk.x,T=C.walk.z;if(z||T||C.planes||C.zoom){const r=v.dist*(C.boost?1.9:.7)*m,k=-Math.sin(v.yaw),P=-Math.cos(v.yaw);v.target.x+=(k*T-P*z)*r,v.target.z+=(P*T+k*z)*r,v.target.y+=C.planes*r,v.dist=R.clamp(v.dist*(1-C.zoom*.9*m),...Gt.dist),br()}const j=Math.cos(v.pitch);i.position.set(v.target.x+Math.sin(v.yaw)*j*v.dist,v.target.y+Math.sin(v.pitch)*v.dist,v.target.z+Math.cos(v.yaw)*j*v.dist),i.lookAt(v.target);const I=Dn(55,i.aspect);Math.abs(i.fov-I)>.01&&(i.fov+=(I-i.fov)*(1-Math.pow(.02,m)),i.updateProjectionMatrix()),y.t+=0}const f=Mo(i.position.x,i.position.z);y.shelter+=(f-y.shelter)*(1-Math.pow(.06,m)),y.fog=R.lerp(Ot.sea,Ot.bay,y.shelter),y.rain=1-y.shelter*.92;const p=xt(i.position.x,i.position.z,y.t,1),x=R.clamp((p.y-i.position.y-1)/3,0,1);y.underwater+=(x-y.underwater)*(1-Math.pow(.002,m)),y.depthBelow=Math.max(0,p.y-i.position.y);const u=R.lerp(8200,1700,y.underwater);Math.abs(i.far-u)>20&&(i.far=u,i.updateProjectionMatrix()),b.camera.updateMatrixWorld()}),null}const ea={low:[24,16],mid:[40,26],high:[56,36]};function pc({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),a=w.useMemo(()=>{const[m,f]=ea[e]??ea.high,p=new Gr(1,m,f),x=p.attributes.position,u=new Float32Array(x.count*3),[v,z,T]=Le.centre,[j,I,r]=Le.radii,k=new Se("#241c22"),P=new Se(E.rockWarm),A=new Se;for(let M=0;M<x.count;M++){const G=x.getX(M),L=x.getY(M),O=x.getZ(M),oe=1+(to(G*2.4+5,O*2.4-9,3)-.5)*.14;x.setXYZ(M,v+G*j*oe,z+L*I*oe,T+O*r*oe);const ue=R.clamp((L+.2)/1.2,0,1);A.copy(k).lerp(P,(1-ue)*.55),u[M*3]=A.r,u[M*3+1]=A.g,u[M*3+2]=A.b}return p.setAttribute("color",new ne(u,3)),p.computeVertexNormals(),p},[e]),{stairM:i,brazierM:l,bayM:h,tableM:c,jarM:d,westStairM:b}=w.useMemo(()=>{const m=new at,f=new yt,p=new S(1,1,1),x=new S,u=[];for(let D=0;D<dt.steps;D++){const $=D/(dt.steps-1);x.set(0,R.lerp(De.y,le.y+2,$),R.lerp(dt.zTop,dt.zBottom,$)),f.identity(),u.push(m.clone().compose(x,f,p))}const v=[],z=e==="low"?5:9;for(const D of[-1,1])for(let $=0;$<z;$++){const X=$/(z-1);x.set(D*176,le.y+9,R.lerp(le.zFront-40,le.zBack+40,X)),f.identity(),v.push(m.clone().compose(x,f,p))}for(let D=0;D<6;D++)x.set(-110+D*44,le.y+9,N.z+N.halfZ+54),f.identity(),v.push(m.clone().compose(x,f,p));const T=[],j=e==="low"?5:9;for(const D of[-1,1])for(let $=0;$<ye.tiers;$++)for(let X=0;X<j;X++){const ae=X/(j-1);x.set(D*(ye.x-$*26),ye.y+$*ye.tierRise,R.lerp(-205,ye.halfZ,ae)),f.identity(),T.push(m.clone().compose(x,f,p))}const I=[],r=[],k=new yt,P=new S(0,1,0);let A=24301;const M=()=>(A=Math.imul(A,1664525)+1013904223>>>0,A/4294967296),G=e==="low"?1:2,L=e==="low"?5:8;for(const D of[-1,1])for(let $=0;$<G;$++)for(let X=0;X<L;X++){const ae=D*(96+$*52+(M()-.5)*14),be=R.lerp(le.zBack+120,le.zFront-60,X/(L-1))+(M()-.5)*16;if(!(Math.abs(ae)<Te.halfX+24&&Math.abs(be-Te.z)<Te.halfZ+20)&&!(Math.abs(Math.abs(ae)-ge.x)<26&&be<ge.zFoot+16&&be>ge.zTop-8)){x.set(ae,le.y+2.4,be),k.setFromAxisAngle(P,(M()-.5)*.5),I.push(m.clone().compose(x,k,p));for(let de=0;de<2;de++)x.set(ae+(M()-.5)*30,le.y+3.5,be+(M()>.5?8:-8)+(M()-.5)*6),k.setFromAxisAngle(P,M()*Math.PI),r.push(m.clone().compose(x,k,p))}}const O=[],oe=16,ue=D=>D*D*(3-2*D);for(let D=0;D<=oe;D++){const $=D/oe;x.set(-252,ue($)*(ye.y-.5)-1.3,R.lerp(45,-45,$)),f.identity(),O.push(m.clone().compose(x,f,p))}return{stairM:u,brazierM:v,bayM:T,tableM:I,jarM:r,westStairM:O}},[e]);se(()=>{const m=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(m*4.1)*.3+Math.sin(m*9.3)*.15),s.current&&(s.current.material.emissiveIntensity=.85+Math.sin(m*.9)*.12)});const g=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:a,side:Rn,receiveShadow:g,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Rn,roughness:.97,metalness:.02})}),[[0,(le.zFront+Te.z+Te.halfZ)/2,le.halfX*2,le.zFront-Te.z-Te.halfZ],[0,(le.zBack+Te.z-Te.halfZ)/2,le.halfX*2,Te.z-Te.halfZ-le.zBack],[-342/2-20,Te.z,le.halfX*2-Te.halfX*2,Te.halfZ*2],[(Te.halfX+le.halfX)/2+20,Te.z,le.halfX*2-Te.halfX*2,Te.halfZ*2]].map(([m,f,p,x],u)=>t.jsxs("mesh",{position:[m,le.y-3,f],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[Math.abs(p),6,Math.abs(x)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},u)),t.jsxs("mesh",{ref:s,position:[Te.x,qe.ceiling+2,Te.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[Te.halfX*2,Te.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:_e})]}),t.jsxs("mesh",{position:[0,De.y-4,De.z],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[De.halfX*2.6,8,De.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,i.length],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[dt.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(fc,{matrices:i})]}),[-1,1].map(m=>Array.from({length:ye.tiers},(f,p)=>t.jsxs("mesh",{position:[m*(ye.x-p*26),ye.y+p*ye.tierRise-4,0],receiveShadow:g,castShadow:g,children:[t.jsx("boxGeometry",{args:[76-p*6,7,ye.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]},`${m}-${p}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:E.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(bc,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(mc,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(gc,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,b.length],castShadow:g,receiveShadow:g,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(xc,{matrices:b})]}),t.jsxs("instancedMesh",{args:[null,null,l.length],castShadow:g,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(wc,{matrices:l})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:E.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(yc,{matrices:l})]}),t.jsxs("mesh",{position:[0,qe.y-4,0],receiveShadow:g,children:[t.jsx("boxGeometry",{args:[qe.halfX*2,8,qe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(m=>[-1,0,1].map(f=>t.jsxs("mesh",{position:[m*120,(qe.y+le.y)/2,f*96],castShadow:g,children:[t.jsx("boxGeometry",{args:[26,Math.abs(le.y-qe.y),26]}),t.jsx("meshStandardMaterial",{color:Q.rock,roughness:.95})]},`${m}-${f}`)))]})}function fc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function mc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function gc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function xc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function bc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function wc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o})}function yc({matrices:e}){const o=w.useRef();return t.jsx(Vt,{matrices:e,selfRef:o,offsetY:9})}function Vt({matrices:e,offsetY:o=0}){const n=w.useRef(),s=w.useRef(!1);return se(()=>{if(s.current)return;const a=n.current?.parent;if(!a?.isInstancedMesh)return;const i=new at,l=new at().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,a.count);h++)i.copy(e[h]).multiply(l),a.setMatrixAt(h,i);a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:n})}const ta=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),a=s.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);a.addColorStop(0,"#fff3c4"),a.addColorStop(.32,"#ffc95e"),a.addColorStop(.66,"#e06120"),a.addColorStop(1,"#7e1c14"),s.fillStyle=a,s.fillRect(0,0,e,o),s.globalAlpha=.14,s.fillStyle="#fff3c4";for(let l=0;l<12;l++){const h=l/12*Math.PI*2;s.save(),s.translate(e/2,o*.62),s.rotate(h),s.fillRect(-3,0,6,e),s.restore()}s.globalAlpha=.22,s.fillStyle="#5e1610";for(let l=8;l<e;l+=22)s.fillRect(l,0,3,o);s.globalAlpha=1;const i=new ro(n);return i.colorSpace=io,i})();function vc(e,o,n,s){const a=e+s,i=o+s,l=new Float32Array([-a,0,i,a,0,i,e*.18,n,o*.18,-a,0,i,e*.18,n,o*.18,-e*.18,n,o*.18,a,0,i,a,0,-i,e*.18,n,-o*.18,a,0,i,e*.18,n,-o*.18,e*.18,n,o*.18,a,0,-i,-a,0,-i,-e*.18,n,-o*.18,a,0,-i,-e*.18,n,-o*.18,e*.18,n,-o*.18,-a,0,-i,-a,0,i,-e*.18,n,o*.18,-a,0,-i,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new Nt;return h.setAttribute("position",new ne(l,3)),h.computeVertexNormals(),h}function Mc({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),a=ot("keep-hf.opt.glb"),i=w.useMemo(()=>{const h=[];for(let c=0;c<N.storeys;c++){const d=1-(c+1)*N.taper,b=N.plinth+c*N.storey;h.push({i:c,y:b,halfX:N.halfX*d,halfZ:N.halfZ*d,roof:vc(N.halfX*d,N.halfZ*d,c===N.storeys-1?30:16,11)})}return h},[]);se(()=>{const h=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),s.current&&(s.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const l=o;return t.jsxs("group",{position:[0,N.baseY,N.z],children:[t.jsxs("mesh",{position:[0,N.plinth/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[N.halfX*2.2,N.plinth,N.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),a&&t.jsx(xe,{name:"keep-hf.opt.glb",height:N.plinth+N.storeys*N.storey+26,position:[0,N.plinth*.5,0],tint:"#9a8468",emissive:E.emberDeep,emissiveIntensity:.14}),!a&&i.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,N.storey/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2,N.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,N.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,N.storey*.38]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,N.storey*.02,h.halfZ+8],castShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,N.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,N.storey,0],castShadow:l,receiveShadow:l,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,N.plinth+N.storeys*N.storey+30,0],rotation:[0,0,h*.4],castShadow:l,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,Re.y,Re.z-N.z],children:[t.jsxs("mesh",{castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[Re.halfX*2,7,Re.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[Re.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:"#ffffff",emissiveMap:ta,map:ta,emissiveIntensity:2.2,toneMapped:!1,side:_e})]}),t.jsx(xe,{name:"oni-throne.opt.glb",height:ce("oni-throne.opt.glb"),position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],scale:ce("oni-throne.opt.glb")/38,children:[t.jsxs("mesh",{position:[0,6,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:l,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:l,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(xe,{name:"kagura-stage.opt.glb",height:ce("kagura-stage.opt.glb"),position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:E.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*Re.halfX*.9,28,Re.depth/2-4],castShadow:l,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[Re.halfX*2.3,5,Re.depth+22]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(xe,{name:"oni-daiko.opt.glb",height:ce("oni-daiko.opt.glb"),position:[h*(Re.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,ce("oni-daiko.opt.glb")/2,0],rotation:[0,0,Math.PI/2],scale:ce("oni-daiko.opt.glb")/22,children:t.jsxs("mesh",{castShadow:l,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(jc,{})]})]})}function jc(){const e=w.useRef(),o=w.useRef(!1);return se(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const s=new at,a=new S,i=new yt,l=new S(1,1,1);for(let h=0;h<n.count;h++){const c=h/(n.count-1)*2-1;a.set(c*(N.halfX+26),Re.y+74-(1-c*c)*20,N.halfZ+22),n.setMatrixAt(h,s.compose(a,i,l))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function kc({shadows:e=!0}){const{slabs:o,flights:n,tower:s}=_a,a=w.useMemo(()=>{const i=[],l=h=>h*h*(3-2*h);for(const h of n)for(let d=0;d<=9;d++){const b=d/9;i.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*l(b)-1.2,R.lerp(h.z0,h.z1,b)])}return i},[n]);return t.jsxs("group",{children:[[s.x[0]+1,s.x[1]-1].map(i=>[s.z[0]+1,s.z[1]-1].map(l=>t.jsxs("mesh",{position:[i,128,l],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${i}${l}`))),t.jsxs("instancedMesh",{args:[null,null,a.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Sc,{points:a})]}),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(c),3.2,Math.abs(d)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),o.map(([i,l,h,c,d],b)=>t.jsxs("mesh",{position:[i,l+5,h+Math.abs(d)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(c),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})]},`r${b}`))]})}function Sc({points:e}){const o=w.useRef(),n=w.useRef(!1);return se(()=>{if(n.current)return;const s=o.current?.parent;if(!s?.isInstancedMesh)return;const a=new at,i=new yt,l=new S(1,1,1),h=new S;for(let c=0;c<Math.min(e.length,s.count);c++)h.set(e[c][0],e[c][1],e[c][2]),s.setMatrixAt(c,a.compose(h,i,l));s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function zc({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],a=i=>i*i*(3-2*i);for(const i of[-1,1])for(let l=0;l<=20;l++){const h=l/20;n.push({x:i*ge.x,y:a(h)*Ft,z:R.lerp(ge.zFoot,ge.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,s)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[ge.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.75})]},s)),[-1,1].map(n=>{const s=i=>i*i*(3-2*i),a=i=>{const l=[];for(let h=0;h<=16;h++){const c=h/16;l.push(new S(n*ge.x+i,s(c)*Ft+7,R.lerp(ge.zFoot,ge.zTop,c)))}return new ao(new so(l),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:a(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:a(ge.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})})]},n)})]})}function Tc({shadows:e=!0}){const o=w.useMemo(()=>To.map(([,,n,s])=>{const a=[];for(let i=0;i<=12;i++){const l=i/12*2-1;a.push(new S(l*n*.5,s*(1-l*l),0))}return new ao(new so(a),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[To.map(([n,s],a)=>t.jsxs("group",{position:[0,n,s],children:[t.jsx("mesh",{geometry:o[a],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.74})}),[-7,7].map(i=>t.jsx("mesh",{geometry:o[a],position:[0,7,i],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})},i))]},a)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,To[0][0]-12,To[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,le.y,0]})]})}function wr(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Ec({quality:e,shadows:o}){const n=w.useMemo(()=>{const a=wr(712273),i=[],l=e==="low"?34:e==="mid"?68:108;let h=0;for(;i.length<l&&h<l*40;){h++;const c=(a()*2-1)*(le.halfX-30),d=R.lerp(le.zBack+40,le.zFront-30,a());Math.abs(c)<62&&d>N.z+120||Math.abs(c)<70&&Math.abs(d-84)<58||Math.abs(Math.abs(c)-ge.x)<24&&d<ge.zFoot+18&&d>ge.zTop-10||i.push({x:c,z:d,kind:i.length%4,rot:a()*Math.PI*2,k:.82+a()*.5})}return i},[e]),s=o;return t.jsx(t.Fragment,{children:n.map((a,i)=>{const l=[a.x,le.y,a.z];if(a.kind===0){const c=ce("sake-tower.opt.glb")*a.k,d=c*.24;return t.jsx(xe,{name:"sake-tower.opt.glb",height:c,position:l,rotation:a.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:l,children:[0,1,2].map(b=>t.jsxs("mesh",{position:[0,c*(.17+b*.3),0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[d-b*d*.16,d-b*d*.16,c*.29,10]}),t.jsx("meshStandardMaterial",{color:b%2?"#c9a86a":"#8e6a3c",roughness:.92})]},b))})},i)}if(a.kind===1){const c=ce("oni-guardian.opt.glb")*a.k;return t.jsx(xe,{name:"oni-guardian.opt.glb",height:c,position:l,rotation:a.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.17,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[c*.43,c*.33,c*.43]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,c*.6,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[c*.2,c*.33,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*c*.13,c*.93,0],rotation:[0,0,d*.5],castShadow:s,children:[t.jsx("coneGeometry",{args:[c*.067,c*.27,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},d))]})},i)}if(a.kind===2){const c=ce("wisteria-trellis.opt.glb")*a.k;return t.jsx(xe,{name:"wisteria-trellis.opt.glb",height:c,position:l,rotation:a.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,c*.94,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[c*.7,c*.07,c*.07]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-.26,-.09,.09,.26].map(d=>t.jsxs("mesh",{position:[d*c,c*.47,0],children:[t.jsx("coneGeometry",{args:[c*.1,c*.88,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},d))]})},i)}const h=gl*4*a.k;return t.jsxs("group",{position:l,rotation:[0,a.rot,0],children:[t.jsxs("mesh",{position:[0,h/2,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[h*.021,h*.021,h,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[h*.12,h*.65,0],children:[t.jsx("planeGeometry",{args:[h*.235,h*.7]}),t.jsx("meshStandardMaterial",{color:i%2?E.vermilion:"#e8dcc4",roughness:.95,side:_e,emissive:i%2?E.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},i)})})}function Rc({shadows:e}){const o=w.useMemo(()=>{const n=wr(10560325),s=[];for(let a=0;a<52;a++)s.push({x:(n()*2-1)*(qe.halfX-40),z:(n()*2-1)*(qe.halfZ-40),rot:n()*Math.PI*2,keg:a%2===0});return s},[]);return t.jsx(t.Fragment,{children:o.map((n,s)=>n.keg?t.jsx(xe,{name:"powder-keg.opt.glb",height:ce("powder-keg.opt.glb"),position:[n.x,qe.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,qe.y+ce("powder-keg.opt.glb")*.5,n.z],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb")*.4,ce("powder-keg.opt.glb"),10]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},s):t.jsx(xe,{name:"war-cannon.opt.glb",height:ce("war-cannon.opt.glb"),position:[n.x,qe.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,qe.y+ce("war-cannon.opt.glb")*.42,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[ce("war-cannon.opt.glb")*.18,ce("war-cannon.opt.glb")*.23,ce("war-cannon.opt.glb")*1.9,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},s))})}function Ac(){const e=Me(o=>o.camera);return se((o,n)=>{const s=Math.min(n,.05),a=(e.position.x-fe.x-Le.centre[0])/Le.radii[0],i=(e.position.y-fe.y-Le.centre[1])/Le.radii[1],l=(e.position.z-fe.z-Le.centre[2])/Le.radii[2],h=Math.sqrt(a*a+i*i+l*l),c=R.clamp(1-(h-1)/.5,0,1);y.inside+=(c-y.inside)*(1-Math.pow(.02,s))}),null}function Ic({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[fe.x,fe.y,fe.z],children:[t.jsx(Ac,{}),t.jsx(pc,{quality:e,shadows:o}),t.jsx(Mc,{quality:e,shadows:o}),t.jsx(Tc,{shadows:o}),t.jsx(zc,{shadows:o}),t.jsx(kc,{shadows:o}),t.jsx(Ec,{quality:e,shadows:o}),t.jsx(Rc,{shadows:o}),[-1,1].flatMap(n=>[0,1,2,3,4].map(s=>t.jsx(xe,{name:"banquet-table.opt.glb",height:ce("banquet-table.opt.glb"),position:[n*(74+s%2*22),le.y,N.z+186+s*34],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}-${s}`))),t.jsx(xe,{name:"treasure-kura.opt.glb",height:ce("treasure-kura.opt.glb"),position:[ye.x-74,le.y,N.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsx("group",{position:[ye.x-74,le.y,N.z+96],rotation:[0,-.7,0],children:(()=>{const n=ce("treasure-kura.opt.glb");return t.jsxs(t.Fragment,{children:[[-1,1].map(s=>[-1,1].map(a=>t.jsxs("mesh",{position:[s*n*.3,n*.08,a*n*.22],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.1,n*.16,n*.1]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${s}${a}`))),t.jsxs("mesh",{position:[0,n*.34,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[n*.85,n*.38,n*.65]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,n*.6,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[n*.65,n*.3,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})})()})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1],[-64,22,1.8],[104,-46,.2],[-176,-118,2.7],[18,-142,1.4],[-30,96,.9]].map(([n,s,a],i)=>t.jsx(xe,{name:"bomb-sphere.opt.glb",height:ce("bomb-sphere.opt.glb"),position:[n,qe.y,s],rotation:a,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,qe.y+ce("bomb-sphere.opt.glb")*.5,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[ce("bomb-sphere.opt.glb")*.5,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${i}`)),[-1,1].map(n=>t.jsx(xe,{name:"keep-tier.opt.glb",height:ce("keep-tier.opt.glb"),position:[n*(ye.x-40),ye.y+ye.tiers*ye.tierRise-6,N.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(xe,{name:"arch-bridge.opt.glb",height:ce("arch-bridge.opt.glb"),position:[n*74,le.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(xe,{name:"oni-guardian.opt.glb",height:Pt,position:[n*(De.halfX+26),De.y,De.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(De.halfX+26),De.y,De.z-26],children:[t.jsxs("mesh",{position:[0,Pt*.17,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[Pt*.41,Pt*.33,Pt*.41]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,Pt*.59,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[Pt*.185,Pt*.33,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,Re.y+30,Re.z-N.z+N.z+40],color:E.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,ye.y+120,60],color:E.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,qe.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,De.y+132,De.z-40],color:E.lantern,intensity:13e3,distance:620,decay:2})]})}const Cc=Math.PI/2-.14,oa=4;function yr({enabled:e,dom:o,zoomMin:n=.34,zoomMax:s=2.6,zoom0:a=1,pitch0:i=.16,pitchMin:l=-.62,pitchMax:h=Cc}){const c=w.useRef({yaw:0,pitch:i,zoom:a,smYaw:0,smPitch:i,smZoom:a,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:l,pitchMax:h,zoomMin:n,zoomMax:s,pitch0:i}).current;return w.useEffect(()=>{if(!e||!o)return;const d=o,b=new Map;let g=0,m=0,f=null;const p=()=>b.size,x=I=>{b.set(I.pointerId,{x:I.clientX,y:I.clientY});try{d.setPointerCapture?.(I.pointerId)}catch{}if(p()===1)c.dragging=!0,f={x:I.clientX,y:I.clientY,t:I.timeStamp};else if(p()===2){c.dragging=!1;const[r,k]=[...b.values()];g=Math.hypot(r.x-k.x,r.y-k.y),f=null}},u=I=>{const r=b.get(I.pointerId);if(!r)return;const k=I.clientX-r.x,P=I.clientY-r.y;if(r.x=I.clientX,r.y=I.clientY,p()>=2){const[M,G]=[...b.values()],L=Math.hypot(M.x-G.x,M.y-G.y);g>8&&L>8&&(c.zoom=R.clamp(c.zoom*(g/L),c.zoomMin,c.zoomMax),c.since=0),g=L;return}if(!c.dragging)return;f&&Math.hypot(I.clientX-f.x,I.clientY-f.y)>14&&(f=null);const A=Hn()*ve.lookSens;c.yaw-=k*.005*A,c.pitch=R.clamp(c.pitch+P*.004*A*(ve.invertY?-1:1),c.pitchMin,c.pitchMax),c.since=0,I.cancelable&&I.preventDefault()},v=I=>{b.has(I.pointerId)&&(b.delete(I.pointerId),p()<2&&(g=0),p()===0&&(c.dragging=!1,f&&I.timeStamp-f.t<260&&(I.timeStamp-m<340?(c.recentre=!0,m=0):m=I.timeStamp),f=null))},z=I=>{I.preventDefault(),c.zoom=R.clamp(c.zoom*(1+Math.sign(I.deltaY)*.1),c.zoomMin,c.zoomMax),c.since=0};d.addEventListener("pointerdown",x),d.addEventListener("pointermove",u,{passive:!1}),d.addEventListener("pointerup",v),d.addEventListener("pointercancel",v),window.addEventListener("pointerup",v);const T=I=>{b.delete(I.pointerId)&&(b.size<2&&(g=0),b.size===0&&(c.dragging=!1))};d.addEventListener("lostpointercapture",T);const j=()=>{b.clear(),g=0,c.dragging=!1};return window.addEventListener("blur",j),d.addEventListener("wheel",z,{passive:!1}),()=>{d.removeEventListener("pointerdown",x),d.removeEventListener("pointermove",u),d.removeEventListener("pointerup",v),d.removeEventListener("pointercancel",v),d.removeEventListener("lostpointercapture",T),window.removeEventListener("pointerup",v),window.removeEventListener("blur",j),d.removeEventListener("wheel",z),b.clear(),c.dragging=!1}},[e,o,c]),c}function Vn(e,o,n=0){if(e.since+=o,C.zoom&&(e.zoom=R.clamp(e.zoom*(1-C.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,C.recentreQueued&&(C.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=oa+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!ve.freeCam&&!e.noRecentre&&!e.dragging&&e.since>oa){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(Oe(.5,.72),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const s=e.dragging?6e-4:Oe(.002,.02),a=1-Math.pow(s,o);let i=e.yaw-e.smYaw;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;e.smYaw+=i*a,e.smPitch+=(e.pitch-e.smPitch)*a,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const na=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeLength:.78,capeUrl:vo("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeLength:.56,capeUrl:vo("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],Pc=e=>na.find(o=>o.id===e)??na[0],Lc=.22,sa=13,Fc=.09,Gc=.34,aa=9,Oc=1.1,Dc=.55,ra=12,Nc=6,Hc=70,_c=.55,Mn=26,Bc=8,Uc=5,ia=.8,Wc=12,Yc=.3,Vc=.13,la=3.4,$c=32,ca=.65,Kc=1.1,Qc=.5,Xc=6,ha=6,We=new S,mt=new S,mo=new S;function Zc(e,o,n,s,a,i,l,h){let d=0;for(let b=1;b<=16;b++){const g=b/16*l,m=e+s*g,f=o+a*g,p=n+i*g,x=h??re(m,p);if(f<=x){let u=d,v=g;for(let z=0;z<6;z++){const T=(u+v)/2,j=o+a*T,I=h??re(e+s*T,n+i*T);j<=I?v=T:u=T}return v}d=g}return null}function qc(e,o,n,s){const a=Math.min(e,.05),i=Ye.combat,l=Ee.move,h=i.style==="sword";s.x=0,s.y=0,s.z=0,We.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),Ye.lookYaw=Math.atan2(We.x,We.z),Ye.playerFacing=o.yaw,i.bazookaCd=Math.max(0,i.bazookaCd-a),i.gigantCd=Math.max(0,i.gigantCd-a),i.hakiCd=Math.max(0,i.hakiCd-a),i.gear2Cd=Math.max(0,i.gear2Cd-a),n.gear2Queued&&(n.gear2Queued=!1,!i.gear2&&i.gear2Cd<=0&&!h&&(i.gear2=!0,i.gear2T=Bc,Kt(.25),mt.set(o.x,o.y+1,o.z),It(mt,1.6,"haki"))),i.gear2&&(i.gear2T=Math.max(0,i.gear2T-a),i.gear2T<=0&&(i.gear2=!1,i.gear2Cd=Uc));const c=i.gear2;i.balloon=R.damp(i.balloon,n.balloonHeld&&!h?1:0,8,a);const d=o.y+o.height*.9,b=Zc(o.x,d,o.z,We.x,We.y,We.z,Hc,o.floorY);Ye.aim.valid=b!=null,b!=null&&(Ye.aim.distance=b,Ye.aim.point.set(o.x,d,o.z).addScaledVector(We,b));const g=!l.kind;if(n.rocketQueued&&(n.rocketQueued=!1,g&&b!=null&&(f(h?"flash":"rocket",_c),l.target.copy(Ye.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,g&&(f(h?"onigiri":"pistol",h?Yc:Lc),l.target.set(o.x,d,o.z).addScaledVector(We,h?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,g&&i.bazookaCd<=0))if(h){const p=Ye.waves.find(x=>!x.active);p&&(p.active=!0,p.k=0,p.pos.set(o.x,d*.92,o.z),p.dir.set(We.x,We.y*.35,We.z).normalize(),i.bazookaCd=Kc,f("wavecast",.22),l.hit=!0,l.target.copy(p.pos).addScaledVector(p.dir,8),Kt(.1))}else f("bazooka",Gc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b,aa):aa),i.bazookaCd=Oc;n.gigantQueued&&(n.gigantQueued=!1,g&&i.gigantCd<=0&&(f(h?"sanzen":"gigant",h?Qc:Dc),l.target.set(o.x,d,o.z).addScaledVector(We,b!=null?Math.min(b+1.5,ra):ra),i.gigantCd=h?Xc:Nc));for(const p of Ye.waves){if(!p.active)continue;const x=p.k;p.k=Math.min(1,p.k+a/ca),p.pos.addScaledVector(p.dir,$c/ca*a);for(const v of[.35,.68,1])x<v&&p.k>=v&&It(p.pos,1.6,"slash");const u=o.floorY==null?re(p.pos.x,p.pos.z):o.floorY;(p.k>=1||p.pos.y<u+.4)&&(p.k<1&&It(p.pos,1.6,"slash"),p.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,i.hakiCd<=0&&Ee.hakiT<=0&&(Ee.hakiT=ia,Ee.hakiFired=!1,i.hakiCd=Wc)),Ee.hakiT>0){Ee.hakiT=Math.max(0,Ee.hakiT-a);const p=1-Ee.hakiT/ia;if(i.haki=p,!Ee.hakiFired&&p>.35&&(Ee.hakiFired=!0,mt.set(o.x,o.y,o.z),It(mt,3,"haki"),Kt(.9),h))for(let x=0;x<8;x++){const u=x/8*Math.PI*2;mt.set(o.x+Math.cos(u)*ha,o.y+.6,o.z+Math.sin(u)*ha),It(mt,1.4,"slash")}}else i.haki=0;const m=n.gatlingHeld&&!l.kind;if(i.gatling=R.damp(i.gatling,m?1:0,14,a),i.gatling>.2&&Ye.gatlingAim.copy(We),m){if(Ee.gatT-=a,Ee.gatT<=0)if(h)Ee.gatT=Vc,Ee.tatsu+=1.9,mt.set(o.x+Math.cos(Ee.tatsu)*la,o.y+.6,o.z+Math.sin(Ee.tatsu)*la),It(mt,.7,"slash"),Kt(.04);else{Ee.gatT=Fc*(c?.6:1);const p=b!=null?Math.min(b,sa):sa*.85;mt.set(o.x,d,o.z).addScaledVector(We,p),It(mt,.8,"punch"),Kt(.05)}}else Ee.gatT=0;if(l.kind){l.t+=a;const p=Math.min(1,l.t/l.dur);if(!l.hit&&p>.45){l.hit=!0;const x=l.kind==="gigant"||l.kind==="sanzen"?3:1.3;if(It(l.target,x,h?"slash":"punch"),Kt(l.kind==="gigant"||l.kind==="sanzen"?.7:.18),l.kind==="rocket"||l.kind==="flash"){mo.copy(l.target).sub(mt.set(o.x,o.y,o.z));const u=mo.length()||1;s.x=mo.x/u*Mn,s.y=Math.max(0,mo.y/u*Mn*.5),s.z=mo.z/u*Mn}else(l.kind==="pistol"||l.kind==="onigiri")&&(s.x=We.x*6,s.z=We.z*6)}l.t>=l.dur&&(l.kind=null,l.t=0),i.move=l.kind,i.moveK=l.kind?Math.min(1,l.t/l.dur):0}else i.move=null,i.moveK=0;return Ye.shake=Math.max(0,Ye.shake-a*2.4),s;function f(p,x){l.kind=p,l.t=0,l.dur=x,l.hit=!1}}const Ee={move:{kind:null,t:0,dur:0,hit:!1,target:new S},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function Jc(e="rubber"){const o=Ye.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,Ee.move.kind=null,Ee.move.t=0,Ee.hakiT=0,Ee.gatT=0,Ye.shake=0;for(const n of Ye.waves)n.active=!1}const Fo=64,e0=19,t0=16,o0=.92,ua=.52,da=.3,n0=.04,s0=.0016,a0=.055,r0=1.9,i0=16,l0=62,c0=9,pa={x:-.45,z:-2.4},fa=.075,Go=new S,ma=new S;function Zt(e,o){return R.clamp(-re(e,o)/26,0,1)}const Oo={x:60*_,z:1050*_},h0=7,ga=15,Ge=1.85,xa=1.1,u0=26,ba=9.4,wa=21,d0=.011;function p0({mode:e,onMode:o,crew:n="luffy",vessel:s="sunny"}){const a=Me(P=>P.camera),i=Me(P=>P.gl),l=w.useRef(),h=w.useRef(),c=w.useRef({speed:0,grounded:!0,maxSpeed:15}),d=w.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,b=w.useRef({x:0,y:0,z:0}).current,g=Pc(n),m=w.useRef(),f=w.useRef(),p=w.useRef(),x=en(s),u=ot(x.hulls[0]),v=ot(x.hulls[1]??""),z=u||v,T=u?x.hulls[0]:v?x.hulls[1]:null,j=T?cn(T,34):30,I=ot(x.crew),r=w.useRef({x:Oo.x,z:Oo.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,fvy:0,airborne:!1,landing:0,fyaw0:Math.PI,stride:0,area:"hall",dx:0,dz:0,snapCam:!0,boarded:!1}).current,k=yr({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.28,zoomMax:4.2,pitch0:.14,pitchMin:-1,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return r.x=Oo.x,r.z=Oo.z,r.heading=Math.PI,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.flank=0,r.deckY=0,r.snapCam=!0,k.yaw=0,k.smYaw=0,k.pitch=.14,k.smPitch=.14,k.pitch0=.14,k.zoom=1,k.smZoom=1,k.noRecentre=!1,k.pitchMin=-1,k.pitchMax=1.44,r.swallowed=0,r.burst=1,r.burstFx=0,r.slam=0,r.drift=0,r.trim=0,r.bowY=xt(r.x,r.z,y.t,1).y,y.helm=null,On("helm"),()=>{y.helmActive=!1}},[e,s,r,k]),w.useEffect(()=>{if(e!=="foot")return;r.fvx=0,r.fvz=0,r.snapCam=!0,Y.chain!=="foot"&&On("foot"),Jc(g.weapon==="swords"?"sword":"rubber");const P=(M,G)=>{k.yaw=M,k.smYaw=M,k.pitch=G,k.smPitch=G,k.pitch0=0,k.noRecentre=!0,k.pitchMin=-1.28,k.pitchMax=1.28};r.fvy=0,r.airborne=!1,r.landing=0;const A=y.footSpawn;if(y.footSpawn="hall",A==="deck"){r.area="deck",r.dx=0,r.dz=-j*.2,r.fy=y.ship.y+y.ship.deckY+Ge,r.fyaw=r.heading,P(r.heading+Math.PI,.44);return}if(A==="port"){r.area="island",r.fx=K.x+40*_,r.fz=K.z+40*_,r.fy=re(r.fx,r.fz)+Ge,r.fyaw=Math.atan2(he.x-r.fx,he.z-r.fz),P(r.fyaw+Math.PI,-.06);return}if(A==="rear"){r.area="island",r.fx=W.gate.x+W.dir[0]*26,r.fz=W.gate.z+W.dir[1]*26,r.fy=re(r.fx,r.fz)+Ge,r.fyaw=Math.atan2(-W.dir[0],-W.dir[1]),P(r.fyaw+Math.PI,.02);return}r.area="hall",r.fx=fe.x,r.fy=fe.y+De.y,r.fz=fe.z+dt.zTop,r.fyaw=Math.PI,r.fpitch=-.05,P(0,.05)},[e,r,k]),se((P,A)=>{if(e!=="helm"&&e!=="foot")return;const M=Math.min(A,.05);y.t+=M;const G=e==="helm",L=e==="foot"&&r.area==="deck";if(G||L){const O=r.heading,oe=G?C.throttle:r.order,ue=G?C.rudder:0;G&&(r.order=C.throttle),r.throttle+=(oe-r.throttle)*(1-Math.pow(.02,M)),r.rudder+=(ue-r.rudder)*(1-Math.pow(.005,M)),r.flank+=((G&&C.boost?1:0)-r.flank)*(1-Math.pow(n0,M));const D=(x.topSpeed??Fo)*(1+da*r.flank),$=Math.sin(r.heading),X=Math.cos(r.heading),ae=Math.cos(r.heading),be=-Math.sin(r.heading);let de=r.vx*$+r.vz*X,Ce=r.vx*ae+r.vz*be;const J=1-y.shelter,Ae=r.throttle>=0?r.throttle*D:r.throttle*e0,rt=x.accel??t0;de+=R.clamp(Ae-de,-rt*2.5,rt)*M,r.burst=Math.min(1,r.burst+M/(x.burst?.charge??c0)),G&&C.burstQueued&&(C.burstQueued=!1,r.burst>=.999&&(r.burst=0,r.burstFx=1,de+=x.burst?.push??l0,y.splash+=1)),r.burstFx*=Math.pow(.2,M);const Ne=xt(r.x,r.z,y.t,1);de-=(Ne.dx*$+Ne.dz*X)*i0*J*M,de-=de*Math.abs(de)*s0*M,Ce-=(Ce*Math.abs(Ce)*a0+Ce*r0)*M;const Je=R.clamp(Math.abs(de)/16,0,1);de*=Math.pow(1-.11*Math.abs(r.rudder)*Je,M),r.vx=$*de+ae*Ce,r.vz=X*de+be*Ce,r.speed=de,r.drift+=(R.clamp(Math.abs(Ce)/11,0,1)-r.drift)*(1-Math.pow(.1,M)),r.heading+=r.rudder*(x.turn??o0)*Je*Math.sign(de||1)*M;const it=r.x+r.vx*M,vt=r.z+r.vz*M,$e=j*ua,U=it+$*$e,je=vt+X*$e;if(Zt(U,je)>.06)r.x=it,r.z=vt,r.aground+=(0-r.aground)*(1-Math.pow(.05,M));else{r.aground+=(1-r.aground)*(1-Math.pow(.02,M)),Wt(Math.abs(r.speed)*.0012*M*60,"AGROUND — SHE IS TAKING WATER");const ze=Math.pow(.06,M);r.speed*=ze,r.vx*=ze,r.vz*=ze;const st=6,$t=Zt(r.x+st,r.z)-Zt(r.x-st,r.z),ho=Zt(r.x,r.z+st)-Zt(r.x,r.z-st),St=Math.hypot($t,ho)||1;r.x+=$t/St*26*M,r.z+=ho/St*26*M}const He=Da(r.x,r.z,0);r.x+=He.vx*M,r.z+=He.vz*M,r.x+=pa.x*J*M,r.z+=pa.z*J*M;const ct=Ne.dx*ae+Ne.dz*be;r.heading+=R.clamp(ct*.4,-fa,fa)*J*M;let Pe=Be[0],H=1/0;for(const ze of Be){const st=(r.x-ze.x)**2+(r.z-ze.z)**2;st<H&&(H=st,Pe=ze)}if(rr(M,{danger:He.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:Pe.x-r.x,toCentreZ:Pe.z-r.z,speed:r.speed,throttle:r.throttle})>=1||He.danger>.94){const ze=Pe;r.x=ze.x+(ze.x>0?ze.r*1.85:-ze.r*1.85),r.z=ze.z+ze.r*1.5,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.heading=Math.PI,r.swallowed+=1,r.aground=1,Y.grip=0,Wt(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const Fe=Mo(r.x,r.z),Ue=R.lerp(1,.055,Fe)*R.smoothstep(Zt(r.x,r.z),0,.3),Z=xt(r.x,r.z,y.t,Ue);y.helmActive=!0,y.helmPos.set(r.x,Z.y+j*.35,r.z),y.helmSpeed=R.clamp(Math.abs(r.speed)/(x.topSpeed??Fo),0,1),y.ship.x=r.x,y.ship.y=Z.y,y.ship.z=r.z,y.ship.heading=r.heading,y.ship.loa=j,y.ship.deckY=T?Yt(T,j):j*.16,y.ship.mastY=T?tr(T,j):j*.6;const te=He.vx*Math.cos(r.heading)-He.vz*Math.sin(r.heading),q=R.clamp(Math.abs(r.speed)/(x.topSpeed??Fo),0,1),we=R.clamp(r.rudder*Je*q*.4+te*.016,-.5,.5);r.heel+=(we-Ce*.012-r.heel)*(1-Math.pow(.15,M));const Ve=j*ua,ht=xt(r.x+$*Ve,r.z+X*Ve,y.t,Ue).y,nt=R.clamp((r.bowY-ht)/Math.max(M,.001),0,60);r.bowY=ht;const Ke=R.clamp((nt-10)/24,0,1)*q*J;if(r.slam=Math.max(r.slam*Math.pow(.05,M),Ke),Ke>.25){const ze=Math.pow(1-.3*Ke,M);r.vx*=ze,r.vz*=ze}const Qe=q*.1*Math.sign(r.speed>=0?1:-1)+r.slam*.14+r.burstFx*.16;r.trim+=(Qe-r.trim)*(1-Math.pow(.1,M));const zo=R.clamp(q*J*1.15+r.aground*.5+He.danger*.8+r.slam*1.3+r.burstFx,0,1);r.spray+=(zo-r.spray)*(1-Math.pow(.08,M));const Ht=l.current;if(Ht&&(Ht.visible=!0,Ht.position.set(r.x,Z.y,r.z),Ht.rotation.set(R.clamp(Z.dz*1.2,-.3,.3)-r.trim,r.heading,R.clamp(-Z.dx,-.26,.26)+r.heel)),m.current&&(m.current.scale.z=1+Math.sin(y.t*1.6)*.08+r.burstFx*.4,m.current.scale.x=1+J*.06+r.burstFx*.12),f.current&&(f.current.material.opacity=r.spray*.42,f.current.scale.setScalar(.7+r.spray*.55)),p.current&&(p.current.material.opacity=R.clamp(.34*q+r.burstFx*.3,0,.62)*(.28+J*.72),p.current.scale.set(1+q*.75+r.drift*.6,1,1+q*.5)),r.deckY+=(Z.y-r.deckY)*(1-Math.pow(Oe(2e-4,.05),M)),G){Vn(k,M,r.heading-O);const ze=r.heading+Math.PI+k.smYaw,st=Math.cos(k.smPitch),$t=Math.max(j*1.9,52)*k.smZoom*(1+q*Oe(.26,.1)+r.burstFx*Oe(.34,.12))*cr(a.aspect),ho=R.lerp(Z.y,r.deckY,ve.comfort),St=Go.set(r.x+Math.sin(ze)*st*$t,ho+j*.26+Math.sin(k.smPitch)*$t,r.z+Math.cos(ze)*st*$t),kr=xt(St.x,St.z,y.t,Ue);St.y=Math.max(St.y,kr.y+6),r.snapCam?(r.snapCam=!1,a.position.copy(St)):a.position.lerp(St,1-Math.pow(Oe(6e-4,.02),M));const Sr=Math.max(0,Math.cos(k.smYaw)),us=q*Oe(66,34)*Sr;a.lookAt(ma.set(r.x+($+ae*R.clamp(Ce/40,-.4,.4))*us,ho+12-r.trim*26*q*Oe(1,.35),r.z+(X+be*R.clamp(Ce/40,-.4,.4))*us));const ds=Oe(1,0);ds>.001&&a.rotateZ((Math.sin(y.t*2.3)*.012*q+r.heel*.3+r.aground*Math.sin(y.t*21)*.02+r.slam*Math.sin(y.t*34)*.03+He.danger*Math.sin(y.t*2.7)*.03)*ds),Nn(a,60+q*Oe(7,2)+r.burstFx*Oe(10,3),M,.06,lr)}const hs=Math.hypot(r.x-(K.x+60*_),r.z-(K.z+60*_));hs<90*_&&Math.abs(r.speed)<24&&(y.footSpawn="port",G?o?.("foot"):r.area==="deck"&&(r.area="island",r.fx=K.x+40*_,r.fz=K.z+40*_,r.fy=re(r.fx,r.fz)+Ge,r.fvx=0,r.fvz=0,r.fvy=0,r.fyaw=Math.atan2(he.x-r.fx,he.z-r.fz),k.yaw=k.smYaw=r.fyaw+Math.PI)),C.boardQueued&&(C.boardQueued=!1,G?(y.footSpawn="deck",o?.("foot")):r.area==="deck"&&o?.("helm")),G&&(y.helm={speed:r.speed,heading:r.heading,throttle:r.throttle,aground:r.aground,x:r.x,z:r.z,toGate:Math.min(Math.hypot(r.x,r.z-Dt),Math.hypot(r.x,r.z-oo)),underFire:[Dt,oo].some(ze=>{const st=Math.hypot(r.x,r.z-ze);return st>Ko.safe&&st<Ko.range}),moored:hs<180*_,maelstrom:He.danger,swallowed:r.swallowed,burst:r.burst,drift:r.drift,maxSpeed:D,cruise:At.level,flank:r.flank,freeCam:ve.freeCam},ar(M,y.helm)),y.shelter+=(Fe-y.shelter)*(1-Math.pow(.06,M)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}if(e==="foot"){Vn(k,M,0);const O=C.boost?ga:h0;r.fpitch+=(-k.smPitch-r.fpitch)*(1-Math.pow(1e-4,M));const oe=C.walk.x,ue=C.walk.z,D=Math.hypot(oe,ue),$=D>1?D:1,X=-Math.sin(k.smYaw),ae=-Math.cos(k.smYaw),be=-ae,de=X,Ce=(X*(ue/$)+be*(oe/$))*O,J=(ae*(ue/$)+de*(oe/$))*O,Ae=(1-Math.pow(D>.02?2e-5:4e-7,M))*(r.airborne?.25:1);r.fvx+=(Ce-r.fvx)*Ae,r.fvz+=(J-r.fvz)*Ae;const rt=r.fvx*M,Ne=r.fvz*M,Je=r.area==="island"?(Z,te)=>re(Z,te):r.area==="deck"?()=>y.ship.y+y.ship.deckY:(Z,te,q)=>fe.y+ji(Z-fe.x,te-fe.z,q-fe.y),it=r.area==="hall"?(Z,te,q)=>ki(Z-fe.x,te-fe.z,q-fe.y)||wi(Z,q,te)>.97:()=>!1;if(r.area==="deck"){const Z=Math.cos(-y.ship.heading),te=Math.sin(-y.ship.heading);r.dx+=rt*Z+Ne*-te,r.dz+=rt*te+Ne*Z;const q=y.ship.loa*.14,we=y.ship.loa*.42;Math.abs(r.dx)>q&&(r.dx=Math.sign(r.dx)*q,r.fvx=0,r.fvz=0),Math.abs(r.dz)>we&&(r.dz=Math.sign(r.dz)*we,r.fvx=0,r.fvz=0);const Ve=Math.cos(y.ship.heading),ht=Math.sin(y.ship.heading);r.fx=y.ship.x+r.dx*Ve+r.dz*ht,r.fz=y.ship.z-r.dx*ht+r.dz*Ve}else if(r.area==="island"){const Z=r.fx+rt,te=r.fz+Ne,q=re(r.fx,r.fz),we=re(Z,te),Ve=Math.hypot(rt,Ne)||1e-6,ht=(we-q)/Ve;(we<=.3||ht>=1.2&&we>=q)&&(r.fvx=0,r.fvz=0),we>.3&&(ht<1.2||we<q)&&(r.fx=Z,r.fz=te)}else{const Z=r.fx+rt,te=r.fz+Ne,q=r.fy-Ge,we=Je(r.fx,r.fz,q),Ve=r.airborne?q:we;Je(Z,te,Ve)-Ve>xa||it(Z,te,q)?(r.fvx=0,r.fvz=0):(r.fx=Z,r.fz=te)}const vt=r.fy-Ge,$e=Je(r.fx,r.fz,vt);if(r.airborne?(r.fvy-=u0*M,r.fy+=r.fvy*M,r.fy-Ge<=$e&&(r.landing=-r.fvy,r.fy=$e+Ge,r.fvy=0,r.airborne=!1,r.landing>wa&&(Wt((r.landing-wa)*d0,"A LONG WAY DOWN"),Ye.roll=0))):r.area==="deck"?(r.fy=$e+Ge,r.fvy=0,r.landing=Math.max(0,r.landing-M*40),C.jumpQueued&&(C.jumpQueued=!1,r.fvy=ba,r.airborne=!0)):vt-$e>xa?(r.airborne=!0,r.fvy=0):(r.fy+=($e+Ge-r.fy)*(1-Math.pow(.002,M)),r.landing=Math.max(0,r.landing-M*40),C.jumpQueued&&(C.jumpQueued=!1,r.fvy=ba,r.airborne=!0)),C.jumpQueued=!1,r.area==="island"){const Z=Math.hypot(r.fx-he.x,r.fz-he.z),te=Math.hypot(r.fx-W.gate.x,r.fz-W.gate.z);Z<80?(r.area="hall",r.fx=fe.x,r.fz=fe.z+dt.zTop,r.fy=fe.y+De.y+Ge,r.fvy=0,r.airborne=!1,r.fyaw=Math.PI,k.yaw=k.smYaw=0,k.pitch=k.smPitch=.05):te<40&&(r.area="hall",r.fx=fe.x+60,r.fz=fe.z+N.z+150,r.fy=fe.y+Ge,r.fvy=0,r.airborne=!1,r.fyaw=0,k.yaw=k.smYaw=Math.PI,k.pitch=k.smPitch=.04),y.helm={onFoot:!0,area:"island",x:r.fx,z:r.fz,fy:r.fy-fe.y,toMouth:Z,toRear:te,nearPort:Math.hypot(r.fx-K.x,r.fz-K.z)<K.r*1.4};const q=Mo(r.fx,r.fz);y.shelter+=(q-y.shelter)*(1-Math.pow(.06,M))}else if(r.area==="deck")y.helm={onFoot:!0,area:"deck",x:r.fx,z:r.fz,speed:r.speed,heading:r.heading,throttle:r.throttle,maxSpeed:(x.topSpeed??Fo)*(1+da*r.flank),moored:!1};else{const Z=r.fz-fe.z;Z>De.z+34&&(r.area="island",r.fx=he.x,r.fz=he.z+130,r.fy=re(r.fx,r.fz)+Ge,r.fvy=0,r.airborne=!1,r.fyaw=0,k.yaw=k.smYaw=Math.PI,k.pitch=k.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:r.fx,z:r.fz,lz:Z,fy:r.fy-fe.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,M))}const U=Math.hypot(r.fvx,r.fvz);r.stride+=U*M;const je=g.height??1.74;if(U>.4){let te=Math.atan2(r.fvx,r.fvz)-r.fyaw;for(;te>Math.PI;)te-=Math.PI*2;for(;te<-Math.PI;)te+=Math.PI*2;r.fyaw+=te*(1-Math.pow(4e-4,M))}r.fpitch+=(-k.smPitch-r.fpitch)*(1-Math.pow(1e-4,M)),r.pace=U,c.current.speed=U,c.current.maxSpeed=ga,c.current.grounded=!r.airborne,c.current.vy=r.fvy,c.current.landing=r.landing,Ye.playerTurn=(r.fyaw-r.fyaw0)/Math.max(M,1e-4),r.fyaw0=r.fyaw,d.x=r.fx,d.y=r.fy-Ge,d.z=r.fz,d.yaw=k.smYaw+Math.PI,d.pitch=k.smPitch,d.height=je,d.floorY=r.area==="hall"?r.fy-Ge:null,qc(M,d,C,b),(b.x||b.z)&&(r.fvx+=b.x,r.fvz+=b.z);const lt=(r.area==="deck"?Math.max(je*2.6,y.ship.loa*.75):je*2.6)*k.smZoom,He=Math.cos(k.smPitch),ct=r.area==="deck"?R.lerp(r.fy,r.deckY+y.ship.deckY+Ge,ve.comfort):r.fy,Pe=ct+Math.sin(r.stride*1.6)*.05*Oe(1,.3),H=r.fx+Math.sin(k.smYaw)*He*lt,me=r.fz+Math.cos(k.smYaw)*He*lt;let Fe=Pe+je*.28+Math.sin(k.smPitch)*lt;const Ue=r.area==="island"?re(H,me):ct-Ge;Fe=Math.max(Fe,Ue+je*.6),r.area==="deck"&&(Fe=Math.max(Fe,ct-Ge+y.ship.mastY*1.06)),Go.set(H,Fe,me),r.snapCam?(r.snapCam=!1,a.position.copy(Go)):a.position.lerp(Go,1-Math.pow(Oe(9e-4,.02),M)),a.lookAt(ma.set(r.fx,Pe-je*.1,r.fz)),Nn(a,r.area==="hall"?72:64,M,.02),h.current&&(h.current.position.set(r.fx,r.fy-Ge,r.fz),h.current.rotation.y=r.fyaw),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}y.fog=R.lerp(Ot.sea,Ot.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:h,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(Dr,{character:g,motion:c})}),t.jsxs("group",{ref:l,position:[0,-4e3,0],visible:e==="helm",children:[z&&t.jsx(xe,{name:T,loa:j,slim:hn(T),sink:So(T),rotation:rn(T),tint:ns(T,x.tint),emissive:"#3a2a18",emissiveIntensity:.24,glow:Jo(T)}),z&&I&&Uo.slice(0,2).map((P,A)=>{const[M,G]=os(T,j,P);return t.jsx(xe,{name:x.crew,height:ln,rotation:P[2],position:[M,Yt(T,j),G]},`crew-${A}`)}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!z,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!z,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!z,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!z,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!z,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!z,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:m,position:[0,17.5,1.5],visible:!z,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:_e,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!z,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),["lantern port","lantern stbd"].map(P=>{const A=z?jo(T,j,ko(P)):[P.endsWith("port")?-3.2:3.2,8,-j*.13];return t.jsxs("group",{position:A,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[Ja,7,5]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[qo,qo,1],children:t.jsx("spriteMaterial",{map:ss,color:E.lantern,transparent:!0,opacity:.5,depthWrite:!1,blending:pt,toneMapped:!1})})]},P)}),!Za(T)&&t.jsx(tn,{crew:x.flag,width:Zo(j),position:z?jo(T,j,ko("flag")):[0,26,-j*.06]}),t.jsxs("mesh",{ref:p,position:[0,.6,-j*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[j*.6,j*2.2]}),t.jsx("meshBasicMaterial",{map:Pn,color:Q.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:f,position:[0,j*.12,j*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[j*.85,j*.6]}),t.jsx("meshBasicMaterial",{map:cl,color:Q.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:pt})]})]})]})}const ya=76,f0=24,va=26,m0=1.15,g0=.44,x0=.05,b0=.22,w0=70,Do=340,Ma=7,y0=6,ja=60,No=185,ka=.42,v0=new S,Sa=new S,Ho={x:430*_,z:1e3*_};function M0({mode:e,onMode:o}){const n=Me(z=>z.camera),s=Me(z=>z.gl),a=w.useRef(),i=w.useRef(),l=w.useRef(),h=w.useRef(),c=w.useRef([]),d=w.useCallback(z=>{c.current=z},[]),b=ot("ship-tang.opt.glb"),g=ot("ship-sub.opt.glb"),m=b||g,f=ot("crew-heart.opt.glb"),p=b?"ship-tang.opt.glb":"ship-sub.opt.glb",x=cn(p,28),u=w.useRef({x:Ho.x,z:Ho.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:0,orderedDepth:0,pitch:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,v=yr({enabled:e==="sub",dom:s.domElement,zoomMin:.32,zoomMax:3.4,pitch0:.15,pitchMin:-1.24,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return u.x=Ho.x,u.z=Ho.z,u.heading=Math.PI,u.speed=0,u.throttle=0,u.flank=0,u.depth=0,u.orderedDepth=0,u.berthing=0,u.snapCam=!0,v.yaw=0,v.smYaw=0,v.pitch=.15,v.smPitch=.15,v.pitch0=.15,v.zoom=1,v.smZoom=1,v.noRecentre=!1,u.heel=0,y.subActive=!0,y.helm=null,On("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,u,v]),se((z,T)=>{if(e!=="sub"){a.current&&a.current.position.set(0,-4e3,0);return}const j=Math.min(T,.05);y.t+=j;const I=u.heading,r=C.boost;u.throttle+=(C.throttle-u.throttle)*(1-Math.pow(.02,j)),u.flank+=((r?1:0)-u.flank)*(1-Math.pow(x0,j)),y.subThrottle=Math.abs(u.throttle),u.rudder+=(C.rudder-u.rudder)*(1-Math.pow(8e-4,j));const k=R.clamp(u.depth/15,0,1),P=ya*(.7+.3*k)*(1+g0*u.flank),A=u.throttle>=0?u.throttle*P:u.throttle*f0;u.speed+=R.clamp(A-u.speed,-va*2,va)*j,u.speed-=u.speed*Math.abs(u.speed)*.0016*j;const M=R.lerp(b0,1,R.clamp(Math.abs(u.speed)/7,0,1));u.heading+=u.rudder*m0*M*Math.sign(u.speed>=0?1:-1)*j,u.orderedDepth-=C.planes*w0*j,u.orderedDepth=R.clamp(u.orderedDepth,0,Do),C.surfaceQueued&&(C.surfaceQueued=!1,u.orderedDepth=0),C.periscopeQueued&&(C.periscopeQueued=!1,u.orderedDepth=y0);const G=u.x+Math.sin(u.heading)*u.speed*j,L=u.z+Math.cos(u.heading)*u.speed*j,O=Da(G,L,u.depth);u.x=G+O.vx*j,u.z=L+O.vz*j;const oe=O.vx*Math.cos(u.heading)-O.vz*Math.sin(u.heading);u.heading+=oe*.008*j;const ue=R.clamp(Math.abs(u.speed)/ya,0,1),D=R.clamp(oe*.02+u.rudder*M*ue*.34,-.6,.6);u.heel+=(D-u.heel)*(1-Math.pow(.12,j)),O.danger>.05&&(u.speed*=Math.pow(1-.22*O.danger,j));const $=re(u.x,u.z),X=Math.max(2,-$-Ma),ae=u.depth<1.5;u.depth+=(u.orderedDepth-u.depth)*(1-Math.pow(.12,j)),u.depth>X?(u.scrape+=(1-u.scrape)*(1-Math.pow(.02,j)),u.depth=X,u.orderedDepth=Math.min(u.orderedDepth,X-2),Wt(Math.abs(u.speed)*.0016*j*60,"GROUNDED ON THE SHELF"),u.speed*=Math.pow(.3,j)):u.scrape+=(0-u.scrape)*(1-Math.pow(.05,j));const be=(u.depth-No)/(Do-No);u.stress=be>0?Math.min(1,be*be):0,u.stress>0&&Wt(u.stress*.06*j,"HULL UNDER PRESSURE — COME UP");const de=u.x+Math.sin(u.heading)*26,Ce=u.z+Math.cos(u.heading)*26;if(re(de,Ce)>-u.depth+Ma*.5){u.speed*=Math.pow(.1,j);const Ke=6,Qe=re(u.x+Ke,u.z)-re(u.x-Ke,u.z),zo=re(u.x,u.z+Ke)-re(u.x,u.z-Ke),Ht=Math.hypot(Qe,zo)||1;u.x-=Qe/Ht*20*j,u.z-=zo/Ht*20*j,u.scrape=Math.max(u.scrape,.5)}const Ae=Math.hypot(u.x-W.x,u.z-W.z);if(Ae<W.pool*1.1&&u.berthing===0&&(u.berthing=1e-4),u.berthing>0){u.berthing=Math.min(1,u.berthing+j*.5),u.x+=(W.berth.x-u.x)*(1-Math.pow(.1,j)),u.z+=(W.berth.z-u.z)*(1-Math.pow(.1,j)),u.orderedDepth=0,u.speed*=Math.pow(.1,j);let Qe=Math.atan2(W.dir[0],W.dir[1])+Math.PI-u.heading;for(;Qe>Math.PI;)Qe-=Math.PI*2;for(;Qe<-Math.PI;)Qe+=Math.PI*2;u.heading+=Qe*(1-Math.pow(.2,j)),u.berthing>=1&&u.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}u.depth<1.5!==ae&&(y.splash+=1);const Ne=xt(u.x,u.z,y.t,1),Je=1-R.clamp(u.depth/10,0,1),it=-u.depth+Ne.y*Je,vt=R.clamp((u.orderedDepth-u.depth)*.05,-.34,.34)*Math.sign(u.speed>=0?1:-1)+Ne.dz*.8*Je;u.pitch+=(vt-u.pitch)*(1-Math.pow(.05,j));const $e=a.current;$e&&($e.position.set(u.x,it,u.z),$e.rotation.set(u.pitch+u.scrape*Math.sin(y.t*23)*.02,u.heading,-Ne.dx*.5*Je+u.heel)),i.current&&(i.current.rotation.z+=u.throttle*9*j),l.current&&(l.current.visible=u.depth<2.5),h.current&&(h.current.visible=u.depth<7);const U=Jo(p);if(U){const Ke=U[1]*(1+y.underwater*1.1+R.clamp(u.depth/260,0,1)*.6);for(const Qe of c.current)Qe.emissiveIntensity=Ke}y.subPos.set(u.x,it,u.z),Vn(v,j,u.heading-I);const je=u.heading+Math.PI+ka+v.smYaw,lt=Math.cos(v.smPitch),He=R.clamp(u.depth/240,0,1),ct=Math.max(x*2,52)*v.smZoom*(1-He*.2)*cr(n.aspect),Pe=v0.set(u.x+Math.sin(je)*lt*ct,it+x*.12+Math.sin(v.smPitch)*ct,u.z+Math.cos(je)*lt*ct),H=re(Pe.x,Pe.z);Pe.y=Math.max(Pe.y,H+5),u.depth>10&&(Pe.y=Math.min(Pe.y,Ne.y-3)),u.snapCam?(u.snapCam=!1,n.position.copy(Pe)):n.position.lerp(Pe,1-Math.pow(Oe(8e-4,.02),j));const me=Math.max(0,Math.cos(v.smYaw+ka)),Fe=ue*Oe(46,26)*me;Sa.set(u.x+Math.sin(u.heading)*Fe,it+6-u.pitch*30*ue*Oe(1,.35),u.z+Math.cos(u.heading)*Fe),n.lookAt(Sa);const Ue=Oe(1,0);Ue>.001&&n.rotateZ((u.scrape*Math.sin(y.t*19)*.015+u.heel*.35+O.danger*Math.sin(y.t*3.1)*.02)*Ue),Nn(n,64+ue*Oe(6,2)+u.flank*Oe(2,.6),j,.06,lr);const Z=xt(n.position.x,n.position.z,y.t,1),te=R.clamp((Z.y-n.position.y-1)/3,0,1);y.underwater+=(te-y.underwater)*(1-Math.pow(.002,j)),y.depthBelow=Math.max(0,Z.y-n.position.y);const q=R.lerp(8200,1700,y.underwater);Math.abs(n.far-q)>20&&(n.far=q,n.updateProjectionMatrix()),y.shelter+=((Ae<W.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,j));let we=Be[0],Ve=1/0;for(const Ke of Be){const Qe=(u.x-Ke.x)**2+(u.z-Ke.z)**2;Qe<Ve&&(Ve=Qe,we=Ke)}rr(j,{danger:O.danger,headingX:Math.sin(u.heading),headingZ:Math.cos(u.heading),toCentreX:we.x-u.x,toCentreZ:we.z-u.z,speed:u.speed,throttle:u.throttle})>=1&&(Wt(.22,"CAUGHT IN THE VORTEX"),u.x=we.x+(u.x>we.x?1:-1)*we.r*1.9,u.z=we.z+we.r*1.5,u.speed=0,u.orderedDepth=Math.min(Do,u.depth+18),Y.grip=0,y.splash+=1);let nt=Math.atan2(W.x-u.x,W.z-u.z)-u.heading;for(;nt>Math.PI;)nt-=Math.PI*2;for(;nt<-Math.PI;)nt+=Math.PI*2;y.helm={sub:!0,speed:u.speed,maxSpeed:P,heading:u.heading,depth:u.depth,orderedDepth:u.orderedDepth,scrape:u.scrape,stress:u.stress,maelstrom:O.danger,toRear:Ae,relRear:nt,berthing:u.berthing>0,x:u.x,z:u.z,maxDepth:Do,crushDepth:No,cruise:At.level,flank:u.flank,freeCam:ve.freeCam,dark:R.clamp((u.depth-ja)/(No-ja),0,1)},ar(j,y.helm)}),t.jsxs("group",{ref:a,position:[0,-4e3,0],children:[m&&t.jsx(xe,{name:p,loa:x,slim:hn(p),glow:Jo(p),onMaterials:d,sink:So(p),rotation:rn(p),tint:ns(p,"#c9b445"),emissive:"#2a2410",emissiveIntensity:.22}),t.jsx("group",{ref:l,position:[0,Yt(p,x),-x*.07],children:f&&t.jsx(xe,{name:"crew-heart.opt.glb",height:ln,rotation:0})}),m&&[-1,1].map(z=>[0,1,2,3,4,5,6].map(T=>t.jsxs("mesh",{position:[z*Va(p,x)*.55,Yt(p,x)-x*.02,x*(.24-T*.08)],children:[t.jsx("sphereGeometry",{args:[x*.011,6,5]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:2.4,toneMapped:!1})]},`port-${z}-${T}`))),t.jsxs("group",{visible:!m,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(z=>[0,1,2,3].map(T=>t.jsxs("mesh",{position:[z*5.1,1.2,8-T*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${z}-${T}`)))]}),t.jsxs("mesh",{position:[0,x*.02,x*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,x*.02,x*.6],scale:[x*.9,x*.9,1],children:t.jsx("spriteMaterial",{map:ss,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:pt})}),t.jsxs("mesh",{position:[0,x*.24,-x*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,x*.012,-x*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(S0,{})]})}const j0=`
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
`,k0=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function S0(){const e=w.useRef(),o=w.useMemo(()=>{const a=new Float32Array(780),i=new Float32Array(260),l=new Float32Array(260),h=new Float32Array(260);for(let d=0;d<260;d++)a[d*3]=(Math.random()-.5)*3.4,a[d*3+1]=(Math.random()-.5)*2.6,a[d*3+2]=-14-Math.random()*4,i[d]=Math.random(),l[d]=.25+Math.random()*.3,h[d]=2+Math.random()*4;const c=new Nt;return c.setAttribute("position",new ne(a,3)),c.setAttribute("aPhase",new ne(i,1)),c.setAttribute("aRate",new ne(l,1)),c.setAttribute("aSize",new ne(h,1)),c.boundingSphere=new lo(new S(0,0,-30),70),c},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new S(...ie(Q.underGlow))}}),[]);return se((s,a)=>{const i=e.current?.uniforms;if(!i)return;i.uTime.value+=a;const l=y.subActive?y.subThrottle*y.underwater:0;i.uGain.value+=(l-i.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:j0,fragmentShader:k0,uniforms:n,transparent:!0,depthWrite:!1,blending:pt,fog:!1})})}const vr=.42;let B=null,Rt=null,ke=null,$n=!1,kt=!0;function z0(){try{const e=localStorage.getItem("oni.audio");e!==null&&(kt=e==="1")}catch{}return kt}function jn(e){kt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return Rt&&B&&Rt.gain.setTargetAtTime(e?vr:0,B.currentTime,.12),e&&B?.state==="suspended"&&B.resume(),kt}function T0(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),s=n.getChannelData(0);for(let a=0;a<o;a++)s[a]=Math.random()*2-1;return n}function go(e,o,n,s,a,i,l){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const c=e.createBiquadFilter();c.type=n,c.frequency.value=s,c.Q.value=a;const d=e.createGain();return d.gain.value=i,h.connect(c).connect(d).connect(l),h.start(),{src:h,filt:c,gain:d}}function kn(){if($n){B?.state==="suspended"&&B.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;B=new e,$n=!0,Rt=B.createGain(),Rt.gain.value=kt?vr:0;const o=B.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=B.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,Rt.connect(n).connect(o).connect(B.destination);const s=T0(B),a=B.createGain();a.gain.value=1,a.connect(Rt);const i=go(B,s,"bandpass",480,.7,.3,a),l=go(B,s,"highpass",1900,.5,0,a),h=go(B,s,"lowpass",220,1.1,.22,a),c=go(B,s,"lowpass",96,1.6,0,a),d=B.createGain();d.gain.value=1,d.connect(o);const b=B.createOscillator();b.type="sawtooth",b.frequency.value=41;const g=B.createBiquadFilter();g.type="lowpass",g.frequency.value=190,g.Q.value=1.2;const m=B.createGain();m.gain.value=0,b.connect(g).connect(m).connect(d),b.start();const f=B.createOscillator(),p=B.createOscillator(),x=B.createGain();f.frequency.value=.07,p.frequency.value=.113,x.gain.value=260,f.connect(x),p.connect(x),x.connect(i.filt.frequency),f.start(),p.start();const u=B.createGain();u.gain.value=0,u.connect(Rt);const v=B.createGain();v.gain.value=.16,v.connect(u);for(const[T,j]of[[146.83,1],[220,.5],[293.66,.3]]){const I=B.createOscillator();I.type="sine",I.frequency.value=T;const r=B.createGain();r.gain.value=j;const k=B.createOscillator(),P=B.createGain();k.frequency.value=.21+Math.random()*.1,P.gain.value=T*.004,k.connect(P).connect(I.frequency),k.start(),I.connect(r).connect(v),I.start()}const z=go(B,s,"bandpass",900,3.2,.05,u);return ke={stormBus:a,festBus:u,wind:i,rain:l,sea:h,roar:c,breath:z,buf:s,comp:o,muffle:n,humGain:m,subBus:d},B}function E0(){if(!B||!ke||!kt)return;const e=B.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const s=B.createOscillator(),a=B.createGain();s.type="sine",s.frequency.setValueAtTime(1420,e+o),s.frequency.exponentialRampToValueAtTime(1180,e+o+.5),a.gain.setValueAtTime(0,e+o),a.gain.linearRampToValueAtTime(n,e+o+.012),a.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),s.connect(a).connect(ke.subBus),s.start(e+o),s.stop(e+o+1.5)}}function R0(e=1){if(!B||!ke||!kt)return;const o=B.currentTime,n=B.createBufferSource();n.buffer=ke.buf;const s=B.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(1500,o),s.frequency.exponentialRampToValueAtTime(240,o+.5),s.Q.value=.7;const a=B.createGain();a.gain.setValueAtTime(0,o),a.gain.linearRampToValueAtTime(.5*e,o+.02),a.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(s).connect(a).connect(Rt),n.start(o),n.stop(o+.9)}function qt(e,o=1,n=82){if(!B||!ke)return;const s=B.createOscillator(),a=B.createGain();s.type="sine",s.frequency.setValueAtTime(n*2.1,e),s.frequency.exponentialRampToValueAtTime(n,e+.06),s.frequency.exponentialRampToValueAtTime(n*.7,e+.5),a.gain.setValueAtTime(0,e),a.gain.linearRampToValueAtTime(o,e+.004),a.gain.exponentialRampToValueAtTime(1e-4,e+.62),s.connect(a).connect(ke.festBus),s.start(e),s.stop(e+.7);const i=B.createBufferSource();i.buffer=ke.buf;const l=B.createBiquadFilter();l.type="bandpass",l.frequency.value=1400,l.Q.value=.8;const h=B.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),i.connect(l).connect(h).connect(ke.festBus),i.start(e),i.stop(e+.12)}function A0(e=1,o=0){if(!B||!ke||!kt)return;const n=B.currentTime+o,s=B.createBufferSource();s.buffer=ke.buf,s.loop=!0;const a=B.createBiquadFilter();a.type="lowpass",a.frequency.setValueAtTime(320,n),a.frequency.exponentialRampToValueAtTime(70,n+2.6),a.Q.value=.9;const i=B.createGain(),l=.5*e;i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(l,n+.05),i.gain.exponentialRampToValueAtTime(l*.24,n+.7),i.gain.exponentialRampToValueAtTime(l*.42,n+1.35),i.gain.exponentialRampToValueAtTime(1e-4,n+3.4),s.connect(a).connect(i).connect(ke.stormBus),s.start(n),s.stop(n+3.6);const h=B.createOscillator(),c=B.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),c.gain.setValueAtTime(0,n),c.gain.linearRampToValueAtTime(.32*e,n+.08),c.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(c).connect(ke.stormBus),h.start(n),h.stop(n+2.8)}function I0(e=.5){if(!B||!ke||!kt)return;const o=B.currentTime;for(const[n,s,a]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const i=B.createOscillator(),l=B.createGain();i.type="sine",i.frequency.value=61*n,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(e*s,o+.008),l.gain.exponentialRampToValueAtTime(1e-4,o+a),i.connect(l).connect(Rt),i.start(o),i.stop(o+a+.1)}}let gt=0,Sn=0,za=0,xo=0;function C0(e){if(!$n||!B||!ke||!kt)return;const o=B.currentTime,n=e.shelter,s=e.underwater,a=e.subActive?.12:1,i=Math.sin(n*Math.PI*.5)*a*(1-s*.92);ke.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),ke.festBus.gain.setTargetAtTime(i,o,.35),ke.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),ke.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),ke.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),ke.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-s*.55),o,.3),ke.muffle.frequency.setTargetAtTime(18e3-s*17400,o,.18);const l=e.subActive?s*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(ke.humGain.gain.setTargetAtTime(l,o,.25),e.splash!==za&&(za=e.splash,R0(1)),e.subActive&&s>.5?xo===0?xo=o+1.2:o>=xo&&(E0(),xo=o+6.5):xo=0,n>.06){const c=.9090909090909091;for(gt<o&&(gt=o+.1);gt<o+.35;){const d=Sn%8,b=n*.9;d===0?qt(gt,.85*b,74):d===2?qt(gt,.45*b,88):d===4?qt(gt,.7*b,74):d===6?qt(gt,.4*b,92):d===7&&(qt(gt,.3*b,96),qt(gt+c*.5,.36*b,96)),Sn++,gt+=c}}else gt=0,Sn=0}function P0(){const e=w.useRef(!1),o=w.useRef(-1);return se(()=>{if(C0(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,s=500+Math.abs(n.z)*900;A0(Math.min(1,.55+y.flash*.6),s/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&I0(.55),o.current=y.shot)}),null}function L0({mode:e,vessel:o}){return y.mode=e,y.vessel=o,se(()=>ac(),-100),null}function F0(){const e=Me(a=>a.gl),o=Me(a=>a.camera),n=Me(a=>a.setSize),s=Me(a=>a.size);return w.useEffect(()=>{const a=()=>{const i=window.innerWidth,l=window.innerHeight;i<2||l<2||s.width>i*.5&&s.height>l*.5||(n(i,l),e.setSize(i,l,!1),o.aspect=i/l,o.updateProjectionMatrix())};return a(),window.addEventListener("resize",a),document.addEventListener("visibilitychange",a),()=>{window.removeEventListener("resize",a),document.removeEventListener("visibilitychange",a)}},[e,o,n,s.width,s.height]),null}function G0({every:e=12}){const o=Me(s=>s.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),se(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function O0({budget:e}){const o=Me(s=>s.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(Er,{bounds:s=>s>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function D0(){const e=Me(s=>s.gl),o=Me(s=>s.scene),n=Me(s=>s.camera);return w.useEffect(()=>{const s=setTimeout(()=>{try{e.compile(o,n)}catch(a){console.warn("[onigashima] pre-compile skipped",a)}},900);return()=>clearTimeout(s)},[e,o,n]),null}function N0(){const{camera:e,scene:o,gl:n}=Me();return w.useEffect(()=>{},[e,o,n]),null}const H0=new Se(Q.haze),_0=new Se(Q.underHaze),B0=new Se(Q.abyss),Ta=new Se;function U0(){const e=Me(o=>o.scene);return se(()=>{if(!e.fog)return;const o=R.clamp(y.depthBelow/Ot.deepGrade,0,1),n=R.lerp(.0062,.0142,o);e.fog.density=R.lerp(y.fog,n,y.underwater),Ta.copy(_0).lerp(B0,o*.8),e.fog.color.lerpColors(H0,Ta,y.underwater)}),null}function W0({quality:e,budget:o,onRails:n,playing:s,speed:a,onShot:i,mode:l,onMode:h,crew:c,vessel:d="sunny"}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[Q.haze]}),t.jsx("fogExp2",{attach:"fog",args:[Q.haze,y.fog]}),t.jsx(Yr,{storm:y}),t.jsx(vl,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(xi,{quality:e,segments:o.segments}),t.jsx(ui,{quality:e,storm:y}),t.jsx(Fi,{quality:e,shadows:o.shadows}),t.jsx(Ms,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Ms,{quality:e,shadows:!1,z:oo,k:_*1.5}),t.jsx(Hi,{quality:e,shadows:o.shadows}),t.jsx(Bi,{quality:e,shadows:o.shadows}),t.jsx(ml,{quality:e}),t.jsx(bl,{shadows:o.shadows}),t.jsx(Ic,{quality:e,shadows:o.shadows}),t.jsx(Rl,{quality:e}),t.jsx(Pl,{quality:e}),t.jsx(Hl,{quality:e}),t.jsx(Xl,{quality:e}),t.jsx(dc,{onRails:n&&l==="off",playing:s&&l==="off",speed:a,onShot:i,idle:l!=="off"}),t.jsx(L0,{mode:l,vessel:d}),t.jsx(Nr,{}),t.jsx(Hr,{}),t.jsx(_r,{}),t.jsx(p0,{mode:l,onMode:h,crew:c,vessel:d}),t.jsx(M0,{mode:l,onMode:h}),t.jsx(P0,{}),t.jsx(F0,{}),t.jsx(U0,{}),t.jsx(N0,{}),t.jsx(D0,{}),t.jsx(O0,{budget:o}),o.shadows&&t.jsx(G0,{every:o.shadowEvery})]})}const bo="#d63420",Y0="rgba(8,6,16,0.72)",Ea="(max-width: 860px), (max-height: 520px)",zn="min(7.5vh, 62px)";function V0(e=2600,o=!0){const[n,s]=w.useState(!1);return w.useEffect(()=>{if(!o){s(!1);return}let a;const i=()=>{s(!1),clearTimeout(a),a=setTimeout(()=>s(!0),e)};i();for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(l,i,{passive:!0});return()=>{clearTimeout(a);for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(l,i)}},[e,o]),n}function $0(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ea).matches);return w.useEffect(()=>{const n=window.matchMedia(Ea),s=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",s):n.addListener(s),()=>{n.removeEventListener?n.removeEventListener("change",s):n.removeListener(s)}},[]),e}function Xe({on:e,onClick:o,children:n,title:s,wide:a,block:i}){return t.jsx("button",{onClick:o,title:s,style:{appearance:"none",border:`1px solid ${e?bo:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:a||i?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:i?"100%":void 0,textAlign:i?"right":"center",minHeight:32},children:n})}function K0({shot:e,shotIndex:o,shotCount:n,total:s,playing:a,onRails:i,speed:l,tier:h,override:c,dev:d,onPlay:b,onRailsToggle:g,onSpeed:m,onQuality:f,onRestart:p,audio:x,onAudio:u,mode:v,onMode:z,crew:T,onCrew:j,vessel:I,onVessel:r,stage:k,veiled:P=!1}){const A=v!=="off",M=$0(),[G,L]=w.useState(!1),[O,oe]=w.useState(()=>({...ve}));w.useEffect(()=>as(U=>oe({...U})),[]);const ue=V0(2600,!A&&!G),D=w.useRef(),$=w.useRef(),X=w.useRef(),ae=w.useRef(),be=w.useRef(),de=w.useRef(),Ce=i&&!A;w.useEffect(()=>L(!1),[v]),w.useEffect(()=>{let U,je=performance.now(),lt=0,He=0;const ct=Pe=>{if(U=requestAnimationFrame(ct),D.current&&(D.current.style.transform=`scaleX(${k.progress||0})`),X.current&&k.helm){const H=k.helm;if(H.onFoot)X.current.textContent=H.area==="deck"?`ON DECK · ${Math.round(Math.abs(H.speed)*1.94)} KN · BRG ${String(Math.round((H.heading*180/Math.PI+360)%360)).padStart(3,"0")}°   —  nobody is at the wheel`:H.area==="island"?H.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":H.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(H.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(H.sub){const me=Math.abs(H.speed)*1.94;if(H.berthing)X.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Fe=H.maelstrom>.22?H.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":H.stress>.02?"⚠ HULL UNDER PRESSURE":H.scrape>.3?"HULL ON THE ROCK":"",Ue=Math.abs(H.relRear*180/Math.PI),Z=Ue<6?"· ON COURSE":H.relRear>0?`◀ ${Ue.toFixed(0)}°`:`${Ue.toFixed(0)}° ▶`,te=10,q=Math.round(H.depth/H.maxDepth*te),we=Math.round(H.crushDepth/H.maxDepth*te);let Ve="";for(let nt=0;nt<te;nt++)Ve+=nt<q?nt>=we?"▓":"█":nt===we?"┃":"·";const ht=H.cruise===2?" ⟲FLK":H.cruise===1?" ⟲AHD":"";X.current.textContent=`DEPTH ${H.depth.toFixed(0).padStart(3,"0")}/${H.orderedDepth.toFixed(0).padStart(3,"0")}m ${Ve}  ${me.toFixed(0).padStart(2,"0")} KN${ht}
COVE ${Math.round(H.toRear)}m  ${Z}`+(Fe?`
${Fe}`:"")}}else{const me=Math.abs(H.speed)*1.94,Fe=(H.heading*180/Math.PI+180)%360,Ue=Math.round((H.burst??0)*5),Z=H.burstLabel??"BURST",te=H.burst>=.999?`${Z} ▶READY`:`${Z} ${"█".repeat(Ue)}${"·".repeat(5-Ue)}`,q=H.cruise===2?"  ⟲FLANK":H.cruise===1?"  ⟲AHEAD":H.flank>.5?"  FLANK":"";X.current.textContent=`${me.toFixed(0).padStart(2,"0")} KN   BRG ${Fe.toFixed(0).padStart(3,"0")}°   ${te}${q}
`+(H.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":H.moored?"MOORING":H.aground>.3?"AGROUND — HELM OVER":H.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(H.toGate)}m`:H.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(H.toGate)}m`:`GATE ${Math.round(H.toGate)}m`)}}if(ae.current){const H=Fl(),me=Ll(Y.chain);ae.current.textContent=Y.done?"✔ OBJECTIVE COMPLETE":H?`▸ ${Y.step+1}/${me}  ${H.text}`:"",ae.current.style.color=Y.done?"#8fe0a0":"#ffd9cf"}if(be.current){const H=Math.max(0,Math.min(1,Y.hull)),me=Math.max(0,Math.min(1,Y.grip)),Fe=te=>{const q=Math.round(te*12);return"█".repeat(q)+"·".repeat(12-q)},Ue=H>.6?"#8fe0a0":H>.3?"#ffc46b":"#ff6b5a",Z=me>.66?"#ff6b5a":me>.33?"#ffc46b":"rgba(255,255,255,0.45)";be.current.innerHTML=`<span style="color:${Ue}">HULL ${Fe(H)}</span>`+(me>.02?`<span style="color:${Z};margin-left:14px">VORTEX ${Fe(me)}</span>`:"")}if(de.current){const H=Y.banner,me=de.current;H?(me.dataset.text!==H.text&&(me.dataset.text=H.text,me.innerHTML=`<div class="og-banner-main">${H.text}</div>`+(H.sub?`<div class="og-banner-sub">${H.sub}</div>`:""),me.style.animation="none",me.offsetWidth,me.style.animation=""),me.style.opacity="1"):(me.style.opacity="0",me.dataset.text="")}d&&$.current?(He++,lt+=Pe-je,je=Pe,lt>400&&($.current.textContent=`${Math.round(He*1e3/lt)} fps · shelter ${k.shelter.toFixed(2)} · fog ${(k.fog*1e4).toFixed(1)}e-4 · flash ${k.flash.toFixed(2)}`,lt=0,He=0)):je=Pe};return U=requestAnimationFrame(ct),()=>cancelAnimationFrame(U)},[k,d]);const J={opacity:ue?.16:1,transform:ue?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},Ae=[{key:"rails",on:!i,label:i?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:g,cinematicOnly:!0},{key:"helm",on:v==="helm",label:v==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>z(v==="helm"?"off":"helm")},{key:"deck",on:!1,label:"WALK THE DECK",title:"Step back from the wheel and walk the deck as your pirate — she sails on",click:()=>{k.footSpawn="deck",z("foot")},helmOnly:!0},{key:"sub",on:v==="sub",label:v==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>z(v==="sub"?"off":"sub")},{key:"foot",on:v==="foot",label:v==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>z(v==="foot"?"off":"foot")}],rt=U=>v==="foot"?t.jsx(Xe,{on:!0,wide:!0,block:U,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>j?.(T==="zoro"?"luffy":"zoro"),children:T==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,Ne=U=>v==="helm"?t.jsx(Xe,{on:!0,wide:!0,block:U,title:"Swap between the Thousand Sunny and Kid's Victoria Punk",onClick:()=>r?.(I==="punk"?"sunny":"punk"),children:I==="punk"?"VICTORIA PUNK":"THOUSAND SUNNY"}):null,Je=(U,je)=>t.jsx(Xe,{on:U.on,onClick:U.click,title:U.title,wide:!0,block:je,children:U.label},U.key),it=U=>A?t.jsxs(t.Fragment,{children:[t.jsx(Xe,{on:O.comfort>.01,wide:!0,block:U,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:Jl,children:O.comfort>.9?"COMFORT · FULL":O.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Xe,{on:O.freeCam,wide:!0,block:U,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>eo("freeCam"),children:O.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Xe,{on:Math.abs(O.lookSens-1)>.01,wide:!0,block:U,title:"How far a drag turns the view",onClick:ec,children:`LOOK ${O.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Xe,{on:O.invertY,wide:!0,block:U,title:"Invert the vertical look axis",onClick:()=>eo("invertY"),children:O.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,vt=()=>A?t.jsx(Xe,{on:!O.hud,title:"Hide the readouts, the chart and the objective — just the picture (H)",onClick:()=>eo("hud"),children:O.hud?"◱":"◰"}):null,$e=U=>t.jsxs(t.Fragment,{children:[!A&&t.jsxs(t.Fragment,{children:[t.jsx(Xe,{on:a,onClick:b,title:"Play / pause the cinematic",block:U,children:a?U?"❙❙  PAUSE":"❙❙":U?"▶  PLAY":"▶"}),[.5,1,2].map(je=>t.jsxs(Xe,{on:l===je,onClick:()=>m(je),title:`${je}× speed`,block:U,children:[je,"×"]},je))]}),t.jsx(Xe,{on:!1,onClick:p,title:"Restart from the open sea",block:U,children:U?"↺  RESTART":"↺"}),t.jsx(Xe,{on:x,onClick:u,title:"Storm, taiko and a temple bell — all synthesised",block:U,children:x?U?"♪  SOUND ON":"♪":U?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Xe,{on:c!=="auto",wide:!0,block:U,title:"Render tier",onClick:()=>f(c==="auto"?"low":c==="low"?"mobile":c==="mobile"?"high":"auto"),children:c==="auto"?`AUTO · ${h.toUpperCase()}`:c.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!P&&t.jsxs(t.Fragment,{children:[[0,1].map(U=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[U?"bottom":"top"]:0,height:Ce?zn:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},U)),t.jsxs("div",{className:"og-tategaki",style:{opacity:A||G?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:A?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${bo}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:A?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:D,style:{height:"100%",background:`linear-gradient(90deg, ${bo}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${bo}`}})}),t.jsx("div",{className:`og-chrome${A?"":" og-chrome-bottom"}`,style:{...A?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...J},children:M?t.jsxs(t.Fragment,{children:[A&&t.jsx(Xe,{on:!0,onClick:()=>z("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),vt(),t.jsx(Xe,{on:G,onClick:()=>L(U=>!U),title:"Menu",children:G?"✕":"☰"}),G&&t.jsxs("div",{className:"og-menu",children:[A&&t.jsxs(t.Fragment,{children:[rt(!0),Ne(!0),it(!0),t.jsx("div",{className:"og-menu-rule"})]}),Ae.filter(U=>!(U.cinematicOnly&&A)&&!(U.helmOnly&&v!=="helm")).map(U=>Je(U,!0)),t.jsx("div",{className:"og-menu-rule"}),$e(!0)]})]}):t.jsxs(t.Fragment,{children:[vt(),rt(!1),Ne(!1),it(!1),$e(!1),Ae.filter(U=>!(U.cinematicOnly&&A)&&!(U.helmOnly&&v!=="helm")).map(U=>Je(U,!1))]})}),!A&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...J,pointerEvents:"none"},children:[i?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:i?`  ·  ${Math.round(s)}s`:""})]}),A&&O.hud&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:ae,className:"og-objective"}),t.jsx("div",{ref:X,className:"og-readout"}),t.jsx("div",{ref:be,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:v==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · T WALK THE DECK · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":v==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":T==="zoro"?"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),A&&O.hud&&t.jsx("div",{ref:de,className:"og-banner"}),d&&t.jsx("div",{ref:$,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Y0,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${Ce?zn:"0px"};
          --og-bottom: ${Ce?zn:"0px"};
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
      `})]})}const Tn="#d63420",Q0=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function X0({onPick:e}){const[o,n]=w.useState(!1),s=w.useRef(),a=620,i=c=>{o||(n(!0),e(c))},[l,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const c=setTimeout(()=>h(!0),a);return()=>clearTimeout(c)},[o]),w.useEffect(()=>{const c=d=>{(d.key==="Escape"||d.key==="Enter")&&i("off")};return window.addEventListener("keydown",c),()=>window.removeEventListener("keydown",c)}),l?null:t.jsxs("div",{ref:s,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${a}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Q0.map((c,d)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+d*.07}s`},onClick:()=>i(c.key),children:[t.jsx("span",{className:"og-entry-kanji",children:c.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:c.label}),t.jsx("span",{className:"og-entry-sub",children:c.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},c.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${Tn};
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
          border-color: ${Tn};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Tn};
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
      `})]})}const ls="#d63420",cs="#4aa9c9",Z0=(e,o,n)=>e<o?o:e>n?n:e;function Mr(e,o,n){const s=w.useRef(o);s.current=o;const a=w.useRef(null),i=w.useRef({x:0,y:0});w.useEffect(()=>{const l=e.current;if(!l||!n)return;const h=m=>{if(a.current===null){a.current=m.pointerId,i.current={x:m.clientX,y:m.clientY};try{l.setPointerCapture?.(m.pointerId)}catch{}s.current.onMove(0,0,m.clientX,m.clientY),m.preventDefault()}},c=m=>{if(m.pointerId!==a.current)return;const f=i.current;s.current.onMove(m.clientX-f.x,m.clientY-f.y,f.x,f.y),m.preventDefault()},d=m=>{m.pointerId===a.current&&(a.current=null,s.current.onEnd(),m.cancelable&&m.preventDefault())};l.addEventListener("pointerdown",h),l.addEventListener("pointermove",c),l.addEventListener("pointerup",d),l.addEventListener("pointercancel",d),window.addEventListener("pointerup",d),window.addEventListener("pointercancel",d);const b=()=>{a.current!==null&&(a.current=null,s.current.onEnd())};l.addEventListener("lostpointercapture",b),window.addEventListener("blur",b);const g=()=>{document.visibilityState!=="visible"&&b()};return document.addEventListener("visibilitychange",g),()=>{l.removeEventListener("pointerdown",h),l.removeEventListener("pointermove",c),l.removeEventListener("pointerup",d),l.removeEventListener("pointercancel",d),l.removeEventListener("lostpointercapture",b),window.removeEventListener("pointerup",d),window.removeEventListener("pointercancel",d),window.removeEventListener("blur",b),document.removeEventListener("visibilitychange",g)}},[e,n])}function Ra({label:e,sub:o,onDown:n,onUp:s,tone:a="plain",wide:i=!1}){const[l,h]=w.useState(!1),c=w.useRef();w.useEffect(()=>{const b=c.current;if(!b)return;let g=null;const m=p=>{g=p.pointerId;try{b.setPointerCapture?.(g)}catch{}h(!0),n(),p.preventDefault(),p.stopPropagation()},f=p=>{p.pointerId===g&&(g=null,h(!1),s(),p.preventDefault(),p.stopPropagation())};return b.addEventListener("pointerdown",m),b.addEventListener("pointerup",f),b.addEventListener("pointercancel",f),b.addEventListener("pointerleave",f),()=>{b.removeEventListener("pointerdown",m),b.removeEventListener("pointerup",f),b.removeEventListener("pointercancel",f),b.removeEventListener("pointerleave",f)}},[n,s]);const d=a==="hot"?ls:a==="cool"?cs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${l?d:"rgba(255,255,255,0.18)"}`,background:l?`color-mix(in srgb, ${d} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:l?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function tt({label:e,sub:o,onTap:n,on:s,tone:a="plain",wide:i=!1}){const l=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const d=l.current;if(!d)return;const b=g=>{h.current(),g.preventDefault(),g.stopPropagation()};return d.addEventListener("pointerdown",b),()=>d.removeEventListener("pointerdown",b)},[]);const c=a==="hot"?ls:a==="cool"?cs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:l,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${s?c:"rgba(255,255,255,0.18)"}`,background:s?`color-mix(in srgb, ${c} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:s?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function q0(){const[e,o]=w.useState(At.level);return w.useEffect(()=>nc(o),[]),t.jsx(tt,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:ur})}function J0({simple:e=!1}){const[o,n]=w.useState(ve.freeCam);w.useEffect(()=>as(a=>n(a.freeCam)),[]);const s=w.useRef(null);return e?t.jsx(tt,{label:"LEVEL",sub:"view",onTap:()=>C.recentreQueued=!0}):t.jsx(tt,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const a=performance.now();if(s.current&&a-s.current<420){s.current=null,eo("freeCam"),C.recentreQueued=!0;return}s.current=a,C.recentreQueued=!0}})}function eh({active:e}){const o=w.useRef(),n=w.useRef(),s=w.useRef(),a=78;return w.useEffect(()=>{if(!e)return;let i;const l=()=>{i=requestAnimationFrame(l);const h=s.current,c=y.helm;h&&(h.textContent=c?.sub?String(Math.round(c.orderedDepth)):"⇕")};return i=requestAnimationFrame(l),()=>cancelAnimationFrame(i)},[e]),Mr(o,{onMove:(i,l,h,c)=>{const d=o.current;if(!d)return;const b=d.getBoundingClientRect(),g=b.top+b.height/2,m=Z0((c+l-g)/a,-1,1),f=Math.abs(m)<.1?0:m;ee.active=!0,ee.planes=-f;const p=n.current;p&&(p.style.transform=`translate(-50%, calc(-50% + ${m*a}px))`,p.style.borderColor=cs,p.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{ee.planes=0;const i=n.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:s,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function th({mode:e,crew:o="luffy",vessel:n="sunny",hud:s=!0}){const[a,i]=w.useState(!1);w.useEffect(()=>{if(e!=="foot"){i(!1);return}const v=setInterval(()=>i(y.helm?.area==="deck"),200);return()=>clearInterval(v)},[e]);const l=w.useRef(),h=w.useRef(),c=w.useRef(),d=w.useRef(),b=62,g=7,m=w.useRef(e);if(m.current=e,Mr(l,{onMove:(v,z,T,j)=>{const I=Math.hypot(v,z),r=I>b?b/I:1,k=v*r,P=z*r,A=h.current,M=c.current;A&&(A.style.transform=`translate(${T-b}px, ${j-b}px)`,A.style.opacity="1"),M&&(M.style.transform=`translate(${T+k-26}px, ${j+P-26}px)`,M.style.opacity="1"),d.current&&(d.current.style.opacity="0");const G=Math.abs(k)<g?0:k/b,L=Math.abs(P)<g?0:P/b;ee.active=!0,m.current==="foot"?(ee.walk.x=G,ee.walk.z=-L):(ee.throttle=-L,ee.rudder=-G)},onEnd:()=>{h.current&&(h.current.style.opacity="0"),c.current&&(c.current.style.opacity="0"),d.current&&(d.current.style.opacity=""),ee.throttle=0,ee.rudder=0,ee.walk.x=0,ee.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0},[e]),e==="off")return null;const f=e==="sub",p=e==="foot",x=a,u=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:l,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:h,style:{position:"fixed",left:0,top:0,width:b*2,height:b*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:c,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${ls}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),s&&t.jsxs("div",{ref:d,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:p?"DRAG TO WALK":"DRAG TO STEER"})]}),s&&t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[f&&t.jsx(eh,{active:!0}),t.jsxs("div",{className:"og-actions",children:[f&&t.jsx(tt,{label:"SURFACE",sub:"blow all",onTap:()=>C.surfaceQueued=!0}),f&&t.jsx(tt,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>C.periscopeQueued=!0}),e==="helm"&&t.jsx(tt,{label:en(n).burst?.label??"BURST",sub:en(n).burst?.sub??"coup de",tone:"cool",onTap:()=>C.burstQueued=!0}),(e==="helm"||x)&&t.jsx(tt,{label:x?"TAKE WHEEL":"WALK DECK",sub:x?"back to it":"she sails on",onTap:()=>C.boardQueued=!0}),p&&t.jsx(tt,{label:"JUMP",sub:"↑",onTap:()=>C.jumpQueued=!0}),p&&t.jsxs(t.Fragment,{children:[t.jsx(tt,{label:u?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>C.pistolQueued=!0}),t.jsx(tt,{label:u?"YAKKO":"BAZOOKA",sub:u?"flying cut":"both fists",tone:"cool",onTap:()=>C.bazookaQueued=!0}),t.jsx(tt,{label:u?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>C.gigantQueued=!0}),t.jsx(tt,{label:u?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>C.rocketQueued=!0}),t.jsx(tt,{label:u?"ASURA":"HAKI",sub:"burst",onTap:()=>C.hakiQueued=!0}),!u&&t.jsx(tt,{label:"GEAR 2",sub:"overdrive",onTap:()=>C.gear2Queued=!0}),t.jsx(Ra,{label:u?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>ee.gatling=!0,onUp:()=>ee.gatling=!1})]}),!p&&t.jsx(q0,{}),t.jsx(Ra,{label:p?"RUN":"FLANK",sub:p?"»":"over",tone:"hot",onDown:()=>ee.boost=!0,onUp:()=>ee.boost=!1}),t.jsx(J0,{simple:p})]})]}),t.jsx("style",{children:`
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
      `})]})}const oh=168,nh=122,Aa="(max-width: 860px), (max-height: 520px)",En=1950,Ia={x:0,z:340},ut={sea:"rgba(8,10,22,0.72)",ring:"#57506a",land:"#2e2836",skull:"#8a7358",fairway:"rgba(160,200,255,0.12)",gate:"#e8402a",port:"#f0ad50",rear:"#8fd4f2",whirl:"rgba(140,170,235,0.55)",you:"#ffe6a0"},jr=e=>({px:o=>(o-Ia.x)/En*(e/2)+e/2,pz:o=>(o-Ia.z)/En*(e/2)+e/2,pl:o=>o/En*(e/2)});function sh(e,o,n){const{px:s,pz:a,pl:i}=jr(n);e.save(),e.scale(o,o),e.clearRect(0,0,n,n),e.fillStyle=ut.sea,e.fillRect(0,0,n,n),e.fillStyle=ut.fairway,e.fillRect(s(-$o.halfWidth),0,i($o.halfWidth*2),n),e.strokeStyle=ut.ring,e.lineWidth=i(wt*.34),e.beginPath(),e.arc(s(pe.x),a(pe.z),i(wt),Math.PI*.34,Math.PI*.66,!0),e.stroke(),e.fillStyle=ut.skull,e.beginPath(),e.ellipse(s(F.x),a(F.z),i(F.r*F.squash[0]),i(F.r*F.squash[2]),0,0,Math.PI*2),e.fill(),e.strokeStyle=ut.gate,e.lineWidth=2;for(const[h,c]of[[Dt,1],[oo,1.5]])e.beginPath(),e.moveTo(s(-95*_*c),a(h)),e.lineTo(s(95*_*c),a(h)),e.stroke();e.strokeStyle=ut.whirl,e.lineWidth=1;for(const h of Be)e.beginPath(),e.arc(s(h.x),a(h.z),i(h.r),0,Math.PI*2),e.stroke();const l=(h,c,d,b=2.6)=>{e.fillStyle=d,e.beginPath(),e.arc(s(h),a(c),b,0,Math.PI*2),e.fill()};l(K.x,K.z,ut.port),l(he.x,he.z,ut.land,2),l(W.gate.x,W.gate.z,ut.rear),e.restore()}function ah({mode:e}){const o=w.useRef(),n=w.useRef(),s=typeof window>"u"?1:Math.min(2,window.devicePixelRatio||1),[a,i]=w.useState(()=>typeof window<"u"&&window.matchMedia(Aa).matches);w.useEffect(()=>{const b=window.matchMedia(Aa),g=()=>i(b.matches);return b.addEventListener?b.addEventListener("change",g):b.addListener(g),()=>{b.removeEventListener?b.removeEventListener("change",g):b.removeListener(g)}},[]);const[l,h]=w.useState(!0),c=a?nh:oh,d=w.useMemo(()=>{if(typeof document>"u")return null;const b=document.createElement("canvas");return b.width=c*s,b.height=c*s,sh(b.getContext("2d"),s,c),b},[s,c]);return w.useEffect(()=>{if(!n.current||!d||!l)return;const{px:b,pz:g}=jr(c),m=n.current.getContext("2d");let f;const p=()=>{f=requestAnimationFrame(p);const x=y.helm;if(m.setTransform(1,0,0,1,0,0),m.clearRect(0,0,c*s,c*s),m.drawImage(d,0,0),!x||x.x===void 0)return;m.save(),m.scale(s,s);const u=b(x.x),v=g(x.z),z=x.sub&&x.depth>4;m.translate(u,v),x.heading!==void 0?(m.rotate(x.heading+Math.PI),m.beginPath(),m.moveTo(0,-5.5),m.lineTo(3.4,4),m.lineTo(0,2),m.lineTo(-3.4,4),m.closePath()):(m.beginPath(),m.arc(0,0,3,0,Math.PI*2)),m.fillStyle=z?"rgba(0,0,0,0)":ut.you,m.strokeStyle=ut.you,m.lineWidth=1.2,m.fill(),m.stroke(),m.restore(),z&&(m.save(),m.scale(s,s),m.fillStyle=ut.rear,m.font="600 9px ui-monospace, SFMono-Regular, Menlo, monospace",m.textAlign="right",m.fillText(`${Math.round(x.depth)}m DOWN`,c-6,c-6),m.restore())};return p(),()=>cancelAnimationFrame(f)},[d,s,e,l,c]),e==="off"?null:l?t.jsxs("div",{className:"og-minimap",style:{position:"fixed",left:14,bottom:14,zIndex:12,width:c,height:c,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.16)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",pointerEvents:"none"},children:[t.jsx("canvas",{ref:n,width:c*s,height:c*s,style:{width:c,height:c,display:"block"}}),t.jsx("div",{style:{position:"absolute",top:4,left:6,font:"600 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)"},children:"鬼ヶ島"}),t.jsx("button",{className:"og-map-close",onClick:()=>h(!1),"aria-label":"Hide the chart",children:"✕"}),t.jsx("canvas",{ref:o,style:{display:"none"}}),t.jsx("style",{children:Ca})]}):t.jsxs(t.Fragment,{children:[t.jsx("button",{className:"og-map-tab",title:"Show the chart",onClick:()=>h(!0),"aria-label":"Show the chart",children:"鬼ヶ島 CHART"}),t.jsx("style",{children:Ca})]})}const Ca=`
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
`,Pa={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function rh(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const ih=null;function dh(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(rh),[n,s]=w.useState("auto"),a=n==="auto"?o:n,i=Pa[a]??Pa.high;w.useEffect(()=>{zi(i.scene!=="low")},[i.scene]),w.useMemo(()=>Oa(i.scene),[i.scene]),w.useMemo(()=>oc(),[]),w.useEffect(()=>sc(),[]);const l=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,c]=w.useState(0),[d,b]=w.useState(!0),[g,m]=w.useState(!0),[f,p]=w.useState(1),[x,u]=w.useState(Js[0]),[v,z]=w.useState(0),[T,j]=w.useState(z0),[I,r]=w.useState(()=>{if(typeof location>"u")return"off";const J=new URLSearchParams(location.search).get("mode");return J==="helm"||J==="sub"||J==="foot"?J:"off"}),[k,P]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy"),[A,M]=w.useState(()=>typeof location>"u"?"sunny":new URLSearchParams(location.search).get("ship")==="punk"?"punk":"sunny");w.useEffect(()=>{if(!T)return;const J=()=>{kn(),jn(!0)};for(const Ae of["pointerdown","keydown","touchstart"])window.addEventListener(Ae,J,{once:!0,passive:!0});return()=>{for(const Ae of["pointerdown","keydown","touchstart"])window.removeEventListener(Ae,J)}},[T]);const G=w.useCallback(()=>{j(J=>{const Ae=!J;return Ae&&kn(),jn(Ae),Ae})},[]),[L,O]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),oe=w.useCallback(J=>{T&&(kn(),jn(!0)),J==="off"?(y.jumpTo=0,b(!0),m(!0)):r(J),O(!0)},[T]),[ue,D]=w.useState(()=>ve.hud);w.useEffect(()=>as(J=>D(J.hud)),[]);const[$,X]=w.useState(!1),ae=w.useRef(!0);w.useEffect(()=>{if(dr(),ae.current){ae.current=!1;return}X(!0);const J=setTimeout(()=>X(!1),210);return()=>clearTimeout(J)},[I]);const be=w.useCallback((J,Ae)=>{z(J),u(Ae)},[]),de=w.useCallback(()=>{Si(),c(J=>J+1),b(!0),m(!0)},[]),Ce=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(ih,{})}):t.jsxs(t.Fragment,{children:[t.jsx(Rr,{shadows:i.shadows,dpr:i.dpr,gl:{antialias:i.aa,powerPreference:"high-performance",toneMapping:Or,toneMappingExposure:Br,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(W0,{quality:i.scene,budget:i,onRails:g,playing:d,speed:f,onShot:be,mode:I,onMode:r,crew:k,vessel:A},h)})}),l&&L&&t.jsx(th,{mode:I,crew:k,vessel:A,hud:ue}),L&&ue&&t.jsx(ah,{mode:I}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:$?1:0,transition:$?"opacity .2s ease-in":"opacity .42s ease-out"}}),!L&&t.jsx(X0,{onPick:oe}),t.jsx(K0,{veiled:!L,shot:x,shotIndex:v,shotCount:Js.length,total:Yn,playing:d,onRails:g,speed:f,tier:a,override:n,dev:Ce,onPlay:()=>b(J=>!J),onRailsToggle:()=>m(J=>!J),onSpeed:p,onQuality:s,onRestart:de,audio:T,onAudio:G,mode:I,onMode:r,crew:k,onCrew:P,vessel:A,onVessel:M,stage:y})]})}export{dh as default};
