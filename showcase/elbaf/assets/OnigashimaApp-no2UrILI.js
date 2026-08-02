var Aa=Object.defineProperty;var Ia=(e,o,n)=>o in e?Aa(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var Wn=(e,o,n)=>Ia(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as oe,j as t,d as $s,f as Se,h as Ca,i as Fa}from"./vendor-C2HIMx-P.js";import{t as xe,c as M,aD as sn,au as Sn,d as zn,a5 as Ae,aJ as Ga,f as La,Y as Vn,a0 as Yn,ag as T,h as te,aK as Pa,ay as Oa,az as Vt,aA as Yt,aq as Ks,R as Da,M as Qe,o as lt,at as Et,ax as mt,aL as $t,aM as Kt,a4 as Na,a8 as kt,ar as Xt,av as Xs,aC as Ha,A as _a}from"./three-Zo_RlN_K.js";import{f as Ut,m as io,w as Oe,a as Ft,e as Mt,P as Ba,G as Ua,S as Wa,I as Va}from"./index-BKEMKjn6.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},R={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},Ro={dir:[.72,.52,-.44],col:"#f2e9cf"},zt={sea:.00105,bay:48e-5,deepGrade:210},Ya=1.15;function ne(e){const o=new xe(e);return[o.r,o.g,o.b]}const $a=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,Ka=`
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
`;function Xa({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new M(...ne(X.skyHigh))},uLow:{value:new M(...ne(X.skyLow))},uCloud:{value:new M(...ne(X.cloud))},uCloudLit:{value:new M(...ne(X.cloudLit))},uEmber:{value:new M(...ne(R.ember))},uFlash:{value:0},uFlashColor:{value:new M(...ne(X.boltGlow))},uFlashDir:{value:new M(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new M(...Ro.dir).normalize()},uMoonCol:{value:new M(...ne(Ro.col))},uUnder:{value:0},uUnderCol:{value:new M(...ne(X.underHaze))}}),[]);return oe((s,i)=>{const r=o.current?.uniforms;r&&(r.uTime.value+=i,r.uFlash.value=e?.flash??0,e?.flashDir&&r.uFlashDir.value.copy(e.flashDir),r.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:$a,fragmentShader:Ka,uniforms:n,side:sn,depthWrite:!1,depthTest:!1,fog:!1})]})}const W=1.9,V=e=>e*W,le={x:0,z:V(-60)},yt=V(300),ko=V(175),Za=118,O={x:0,z:V(-402),r:V(215),baseY:300,squash:[1.18,1.04,.98]},so=[[-.361,.301,.883],[.361,.301,.883]],kn=[0,.02,.9998],Tn=[0,-.419,.908];function En(e,o=1){const[n,s,i]=O.squash;return{x:O.x+e[0]*O.r*n*o,y:O.baseY+e[1]*O.r*s*o,z:O.z+e[2]*O.r*i*o}}const Me=so.map(e=>En(e)),he={...En(Tn),halfWidth:74,height:62};En(kn,.94);const Z={x:V(-152),y:4.5,z:V(-104),r:V(78)},$n=2.35,Tt=[Math.sin($n),Math.cos($n)],$=(()=>{const e=yt+ko*.35,o=le.x+Tt[0]*e,n=le.z+Tt[1]*e;return{x:o,z:n,pool:V(46),benchY:3.6,reach:V(560),gate:{x:o-Tt[0]*V(44),z:n-Tt[1]*V(44)},berth:{x:o+Tt[0]*V(12),z:n+Tt[1]*V(12)},dir:Tt}})(),Qa=[{rank:1,role:"east-south",ang:.75,dist:V(730),r:V(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:V(730),r:V(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:V(770),r:V(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:V(690),r:V(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:V(690),r:V(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:V(765),r:V(150),depth:42,dir:1,speed:35}],Fe=[];function Zs(e){const o=e==="low"?3:e==="mid"?5:7;Fe.length=0;for(const n of Qa)n.rank>o||Fe.push({role:n.role,x:le.x+Math.sin(n.ang)*n.dist,z:le.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Fe}const qa=e=>Fe.find(o=>o.role===e)??Fe[0];Zs("high");function Qs(e,o,n=0){let s=0,i=0;const r=1-De(8,34,n);if(r<=0)return{vx:s,vz:i,danger:0};let l=0;for(const h of Fe){const d=e-h.x,m=o-h.z,x=Math.hypot(d,m);if(x>h.r*1.7||x<.001)continue;const p=x/h.r,f=1-De(1,1.6,p),a=h.speed*(p/.3)*Math.exp(1-p/.3)*.62*f,u=h.speed*.55*Math.exp(-p*p*2.6)*f+h.speed*.1*f,g=1/x;s+=(-m*g*a*h.dir-d*g*u)*r,i+=(d*g*a*h.dir-m*g*u)*r,l=Math.max(l,(1-De(.15,1.15,p))*r)}return{vx:s,vz:i,danger:l}}const qs={x:0,halfWidth:V(96)},Rt=V(258),lo=V(624),Ao={safe:260,range:1150},Ja=0,To=V(1500),Io=e=>e<0?0:e>1?1:e;function er(e,o,n=4){let s=0,i=1,r=1,l=0;for(let h=0;h<n;h++){const d=1-Math.abs(Ut(e*r,o*r,1)*2-1);s+=d*d*i,l+=i,i*=.52,r*=2.07}return s/l}const De=(e,o,n)=>{const s=Io((n-e)/(o-e));return s*s*(3-2*s)};function tr(e){if(e>V(430))return 1e4;const o=1-De(V(430),V(205),e),n=De(V(150),V(-30),e);return qs.halfWidth+o*V(620)+n*V(300)}function or(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let s=Za;return s+=o*190,s+=Math.max(0,n)*46,s-=Math.max(0,-n)*26,s}function se(e,o){const n=e-le.x,s=o-le.z,i=Math.hypot(n,s),r=Math.atan2(n,s),l=(i-yt)/ko,h=Math.exp(-l*l*1.35)*or(r),d=Math.max(0,i-yt-ko*.55),m=-Math.pow(d/210,1.6)*175,x=Math.max(0,yt-ko*.5-i),p=-De(0,150,x)*46,f=Io(h/60),a=(er(e*.0052/W+13,o*.0052/W-21,4)-.42)*168*f,u=(Ut(e*.0042/W+31,o*.0042/W-17,4)-.5)*84*f,g=(Ut(e*.021-5,o*.021+9,3)-.5)*17*f;let b=h+m+p+a+u+g;const y=tr(o),k=1-De(y,y+V(105),Math.abs(e-qs.x)),S=1-De(V(-40),V(-190),o),c=k*S;b=b*(1-c)+Math.min(b,-34)*c;const j=Math.hypot(e-O.x,o-O.z);b+=Math.exp(-Math.pow(j/(O.r*1.55),2))*62;const F=(e-Z.x)/V(76),A=(o-Z.z)/V(58),z=(1-De(.72,1.18,Math.hypot(F,A)))*Io((b+34)/34);b=b*(1-z)+Z.y*z;const I=e-$.x,E=o-$.z;if(Math.abs(I)+Math.abs(E)<$.reach+V(140)){const D=Math.max(0,Math.min($.reach,I*$.dir[0]+E*$.dir[1])),L=I-$.dir[0]*D,B=E-$.dir[1]*D,q=Math.hypot(L,B),Q=V(30)+D/$.reach*V(48),G=1-De(Q,Q+V(62),q);b=b*(1-G)+Math.min(b,-26)*G;const Y=Math.hypot(I,E),re=1-De($.pool*.55,$.pool,Y);b=b*(1-re)+Math.min(b,-14)*re;const K=(e-$.gate.x)/V(30),ie=(o-$.gate.z)/V(24),ze=1-De(.72,1.18,Math.hypot(K,ie));b=b*(1-ze)+$.benchY*ze}return b}function Rn(e,o,n=3){const s=se(e+n,o)-se(e-n,o),i=se(e,o+n)-se(e,o-n),r=-s,l=2*n,h=-i,d=Math.hypot(r,l,h)||1;return[r/d,l/d,h/d]}function nr(e,o,n=3){return Math.acos(Rn(e,o,n)[1])}function co(e,o){const n=De(V(250),V(40),o),s=1-De(yt-V(40),yt+V(90),Math.hypot(e-le.x,o-le.z)),i=(1-De(V(60),V(170),Math.hypot(e-$.x,o-$.z)))*.85;return Io(Math.max(Math.min(n,s),i))}const Js=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],sr=Math.PI*2;function ar(e,o,n){let s=0,i=0,r=0;for(const l of Fe){const h=e-l.x,d=o-l.z,m=Math.max(1,Math.hypot(h,d));if(m>l.r*1.75)continue;const x=m/l.r,p=Math.exp(-3*x*x);s-=l.depth*p;const f=l.depth*6*x*p/l.r;i+=f*(h/m),r+=f*(d/m);const a=Math.atan2(d,h),u=Math.sin(a*3*l.dir+x*14-n*2.2),g=x*Math.exp(1-x)*(1-rr(x));s+=u*g*1.6}return{y:s,dx:i,dz:r}}function rr(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function rt(e,o,n,s=1){let i=0,r=0,l=0;for(const d of Js){const m=sr/d.len,x=Math.sqrt(9.81/m),p=Math.hypot(d.dir[0],d.dir[1]),f=d.dir[0]/p,a=d.dir[1]/p,u=m*(f*e+a*o-x*n),g=d.amp*s;i+=g*Math.sin(u);const b=g*m*Math.cos(u);r+=b*f,l+=b*a}const h=ar(e,o,n);return i+=h.y,r+=h.dx,l+=h.dz,{y:i,dx:r,dz:l}}const ir=Js.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),lr=()=>Fe.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),cr=()=>Fe.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),hr=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*W).toFixed(1)}, ${(250*W).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(yt-40*W).toFixed(1)}, ${(yt+90*W).toFixed(1)},
      length(p - vec2(${le.x.toFixed(1)}, ${le.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*W).toFixed(1)}, ${(170*W).toFixed(1)},
      length(p - vec2(${$.x.toFixed(1)}, ${$.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,dr=()=>`
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
${hr}

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
${ir}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${lr()}

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
`,ur=()=>`
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
${cr()}
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
`;function pr(e,o){const n=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let r=0;r<e;r++){const l=le.x+((r+.5)/e-.5)*o,h=le.z+((i+.5)/e-.5)*o,d=se(l,h),m=T.clamp(-d/46,0,1),x=(i*e+r)*4;n[x]=Math.round(m*255),n[x+1]=n[x],n[x+2]=n[x],n[x+3]=255}const s=new Ga(n,e,e,La);return s.minFilter=Vn,s.magFilter=Vn,s.wrapS=Yn,s.wrapT=Yn,s.needsUpdate=!0,s}const Co={low:112,mid:190,high:286},an=6400;function mr(e){const o=w.useRef(),n=an/(Co[e]??Co.high);return oe(s=>{const i=o.current;i&&(i.position.x=Math.round((s.camera.position.x-le.x)/n)*n,i.position.z=Math.round((s.camera.position.z-le.z)/n)*n)}),o}function fr({quality:e="high",storm:o}){const n=w.useRef(),s=mr(e),{geometry:i,uniforms:r,landTex:l,vert:h,frag:d}=w.useMemo(()=>{const m=Co[e]??Co.high,x=new Sn(an,an,m,m);x.rotateX(-Math.PI/2),x.translate(le.x,0,le.z);const p=To*1.05,f=pr(e==="low"?160:256,p),a={uTime:{value:0},uLand:{value:f},uSpan:{value:p},uCentre:{value:new zn(le.x,le.z)},uDeep:{value:new M(...ne(X.seaDeep))},uShallow:{value:new M(...ne(X.seaShallow))},uFoam:{value:new M(...ne(X.foam))},uSkyLow:{value:new M(...ne(X.skyLow))},uGilt:{value:new M(...ne(R.gilt))},uEmber:{value:new M(...ne(R.ember))},uFogColor:{value:new M(...ne(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new M(...ne(X.abyss))},uUnderGlow:{value:new M(...ne(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:xr.clone()},uMoonCol:{value:new M(...ne(gr))},uEyeA:{value:new M(Me[0].x,Me[0].y,Me[0].z)},uEyeB:{value:new M(Me[1].x,Me[1].y,Me[1].z)},uFlash:{value:0},uFlashColor:{value:new M(...ne(X.boltGlow))},uCameraPos:{value:new M}};return{geometry:x,uniforms:a,landTex:f,vert:dr(),frag:ur()}},[e]);return oe((m,x)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=x,p.uCameraPos.value.copy(m.camera.position),p.uFlash.value=o?.flash??0,p.uFogDensity.value=o?.fog??.0011;const f=Math.min(1,Math.max(0,(o?.depthBelow??0)/zt.deepGrade));p.uDepthFade.value=f,Kn.copy(yr).lerp(br,f*.8),p.uFogColor.value.lerpVectors(wr,Kn,o?.underwater??0)}),t.jsx("mesh",{ref:s,geometry:i,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:d,uniforms:r,transparent:!1,side:Ae},l.uuid)})}const xr=new M(...Ro.dir).normalize(),gr=Ro.col,wr=new M(...ne(X.haze)),yr=new M(...ne(X.underHaze)),br=new M(...ne(X.abyss)),Kn=new M;function vr({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const s=o,i=new Sn(To,To,s,s);i.rotateX(-Math.PI/2);const r=i.attributes.position,l=r.count,h=new Float32Array(l*3),d=new xe(X.rock),m=new xe(X.rockLit),x=new xe("#0b0e18"),p=new xe(X.snow),f=new xe(R.rockWarm),a=new xe;for(let u=0;u<l;u++){const g=r.getX(u)+le.x,b=r.getZ(u)+le.z,y=se(g,b);r.setX(u,g),r.setY(u,y),r.setZ(u,b);const k=Rn(g,b,To/s)[1],S=Math.max(0,(k-.55)/.45);a.copy(d).lerp(m,T.clamp(y/190,0,1));const c=1-T.clamp((y-Ja)/13,0,1);a.lerp(x,c*.85);const j=T.clamp((g-le.x)/260,0,1),F=96-j*42,A=T.clamp((y-F)/60,0,1)*S;a.lerp(p,A*(.45+j*.5));const z=Math.hypot(g-O.x,b-O.z),I=Math.exp(-Math.pow(z/330,2)),E=T.clamp((b-O.z)/260,0,1);a.lerp(f,I*E*.6*(1-A)),h[u*3]=a.r,h[u*3+1]=a.g,h[u*3+2]=a.b}return i.setAttribute("color",new te(h,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const An=-30,In=330,Mr=150,me={x:he.x,y:he.y-40,z:he.z-Mr-(An+In)},Ce={centre:[0,96,An],radii:[350,235,In]},Gt={x:me.x+Ce.centre[0],y:me.y+Ce.centre[1],z:me.z+Ce.centre[2]};function rn(e,o=.06){const n=(e.x-Gt.x)/Ce.radii[0],s=(e.y-Gt.y)/Ce.radii[1],i=(e.z-Gt.z)/Ce.radii[2],r=Math.sqrt(n*n+s*s+i*i),l=1+o;if(r>=l)return null;const h=r<1e-4?0:l/r;return e.x=Gt.x+(h?n*h:0)*Ce.radii[0],e.y=Gt.y+(h?s*h:l)*Ce.radii[1],e.z=Gt.z+(h?i*h:0)*Ce.radii[2],e}const ae={y:0,halfX:290,zFront:228,zBack:-240},je={y:40,z:An+In-40,halfX:96,depth:120},at={zTop:je.z-54,zBottom:140,halfX:74,steps:16},_={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},ye={y:74,z:_.z+_.halfZ+26,halfX:96,depth:40},jt=ye.y+3.5,Ne={y:-95,halfX:220,halfZ:175,ceiling:-34},ge={x:0,z:84,halfX:52,halfZ:40},ue={y:52,halfZ:205,x:252,tiers:3,tierRise:46},po=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],de={x:74,halfW:14,zFoot:_.z+_.halfZ+158,zTop:ye.z+ye.depth/2-6},ea=[{kind:"rampZ",x0:-74-de.halfW,x1:-74+de.halfW,z0:de.zFoot,z1:de.zTop,y0:0,y1:jt},{kind:"rampZ",x0:de.x-de.halfW,x1:de.x+de.halfW,z0:de.zFoot,z1:de.zTop,y0:0,y1:jt},{kind:"flat",x0:-96,x1:ye.halfX,z0:ye.z-ye.depth/2-2,z1:de.zTop+10,y:jt},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:ue.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:ue.y-.5},{kind:"flat",x0:ue.x-38,x1:ue.x+38,z0:-225,z1:ue.halfZ+20,y:ue.y-.5}],jr=e=>e<=0?0:e>=1?1:e*e*(3-2*e),ta=(()=>{const e=[],o=[],n=[],s=_.halfX+6,i=[s,s+9],r=[s+11,s+20],l=[s,s+20],h=[-212,-200],d=[-264,-252],m=[jt];for(let p=2;p<=_.storeys;p++)m.push(_.plinth+p*_.storey+1.5);e.push({kind:"flat",x0:ye.halfX-6,x1:s+20,z0:-212,z1:-196,y:jt}),o.push([(ye.halfX-6+s+20)/2,jt,-204,s+26-ye.halfX,16]);for(let p=0;p<m.length-1;p++){const f=m[p],a=m[p+1],u=(f+a)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:h[0],z1:d[1],y0:f,y1:u}),n.push({x0:i[0],x1:i[1],z0:h[0],z1:d[1],y0:f,y1:u}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:d[0],z1:d[1],y:u}),o.push([(l[0]+l[1])/2,u,(d[0]+d[1])/2,l[1]-l[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:r[0],x1:r[1],z0:d[1],z1:h[0],y0:u,y1:a}),n.push({x0:r[0],x1:r[1],z0:d[1],z1:h[0],y0:u,y1:a}),e.push({kind:"flat",x0:l[0],x1:l[1],z0:h[0],z1:h[1],y:a}),o.push([(l[0]+l[1])/2,a,(h[0]+h[1])/2,l[1]-l[0],h[1]-h[0]])}for(let p=1;p<m.length-1;p++){const a=1-Math.min(_.storeys,p+2)*_.taper,u=_.halfX*a,g=_.z+_.halfZ*a,b=m[p];e.push({kind:"flat",x0:u-4,x1:s,z0:-224,z1:-212,y:b}),o.push([(u-4+s)/2,b,-218,s-u+4,12]),e.push({kind:"flat",x0:-u-6,x1:u+6,z0:g,z1:-212,y:b}),o.push([0,b,(g-212)/2,u*2+12,-212-g])}const x=m[m.length-1];return e.push({kind:"flat",x0:58,x1:s,z0:-248,z1:-212,y:x}),o.push([(s+58)/2,x,-230,s-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[s,s+20],z:[d[0],h[1]]}}})();ea.push(...ta.walks);function Sr(e,o){let n=0;for(const s of ea){if(e<s.x0||e>s.x1)continue;const i=Math.min(s.z0,s.z1),r=Math.max(s.z0,s.z1);if(!(o<i||o>r))if(s.kind==="flat")s.y>n&&(n=s.y);else{const l=jr((o-s.z0)/(s.z1-s.z0)),h=s.y0+(s.y1-s.y0)*l;h>n&&(n=h)}}return n}const v={t:0,flash:0,flashDir:new M(0,.4,-1),fog:zt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new M(0,0,0),helmActive:!1,helmPos:new M(0,0,0),helmSpeed:0,subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new M(0,60,-200)}};function zr(){v.t=0,v.progress=0,v.flash=0,v.fog=zt.sea,v.rain=1,v.shot=0,v.underwater=0,v.depthBelow=0,v.whirlNear=0,v.subActive=!1,v.subThrottle=0}const _o=new Map;let oa=!0;function kr(e){oa=!!e}function Tr(e){const o=io(e);return _o.has(o)||_o.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),_o.get(o)}function Ze(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let s=!0;return Tr(e).then(i=>{s&&n(i&&oa)}),()=>{s=!1}},[e]),o}const gt=so.map(e=>new M(...e).normalize()),na=new M(...kn).normalize(),ln=new M(...Tn).normalize();function Er(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const d of gt){const m=e.dot(d),x=Math.pow(Math.max(0,m),46);o-=x*.3}const s=Math.max(0,e.dot(na)),i=Math.pow(s,150)*(1-Math.max(0,e.y)*.5);o-=i*.19;for(const d of gt){const m=new M(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,m),26)*.075}const r=Math.max(0,e.dot(ln));o-=Math.pow(r,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const l=Math.pow(Math.max(0,e.dot(gt[0])),30)+Math.pow(Math.max(0,e.dot(gt[1])),30),h=1-Math.min(1,l);return o+=(Ut(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(Ut(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const Rr=178*1.9,Ue=O.r/Rr;function Xn(e,o){const n=e*Ue,s=[new M(n*74,96*Ue,-20*Ue),new M(n*142,176*Ue,-58*Ue),new M(n*196,268*Ue,-76*Ue),new M(n*222,356*Ue,-52*Ue),new M(n*206,424*Ue,8*Ue),new M(n*154,462*Ue,72*Ue)],i=new M;for(const x of s)i.set(O.x+x.x,O.baseY+x.y,O.z+x.z),rn(i,.12)&&x.set(i.x-O.x,i.y-O.baseY,i.z-O.z);const r=new Vt(s),l=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,d=new Yt(r,l,1,h,!1),m=d.attributes.position;for(let x=0;x<=l;x++){const p=x/l,f=34*Ue*Math.pow(1-p,.72)*(1+Math.sin(p*Math.PI)*.16),a=r.getPoint(p);for(let u=0;u<=h;u++){const g=x*(h+1)+u;if(g>=m.count)continue;const b=m.getX(g)-a.x,y=m.getY(g)-a.y,k=m.getZ(g)-a.z;m.setXYZ(g,a.x+b*f,a.y+y*f,a.z+k*f)}}return m.needsUpdate=!0,d.computeVertexNormals(),d}const Ar={low:4,mid:6,high:7},sa="skull-island.opt.glb",Qt={height:1,yaw:0,lift:.02},Bo=new Da,Zn=new M,mo=new M;function Ir(e,o,n){mo.set(o[0],o[1],o[2]).normalize(),Zn.copy(mo).multiplyScalar(O.r*4),Bo.set(Zn,mo.clone().negate()),Bo.far=O.r*8;const s=Bo.intersectObject(e,!0)[0];return s?s.point.clone().addScaledVector(mo,-n):null}function Cr({shadows:e}){const{scene:o}=$s(io(sa)),{object:n,eyes:s,nose:i,mouth:r}=w.useMemo(()=>{const l=o.clone(!0),h=new Ks().setFromObject(l),d=new M,m=new M;h.getSize(d),h.getCenter(m);const x=O.r*O.squash[1]*1.62,p=d.y>1e-4?x*Qt.height/d.y:1,f=O.r*O.squash[1]*Qt.lift;l.scale.setScalar(p),l.rotation.set(0,Qt.yaw,0),l.position.set(0,-m.y*p+f,0);const a=m.x*p,u=m.z*p,g=Math.cos(Qt.yaw),b=Math.sin(Qt.yaw);l.position.x=-(a*g+u*b),l.position.z=-(-a*b+u*g),l.updateMatrixWorld(!0);let y=0,k=0;const S={x:0,y:0,z:0},c=new M,j=[];l.traverse(L=>{L.isMesh&&j.push(L)});for(const L of j){const B=L.geometry.clone();for(const G of["position","normal"]){const Y=B.attributes[G];if(!Y||Y.array instanceof Float32Array)continue;const re=new Float32Array(Y.count*3);for(let K=0;K<Y.count;K++)c.fromBufferAttribute(Y,K),re[K*3]=c.x,re[K*3+1]=c.y,re[K*3+2]=c.z;B.setAttribute(G,new te(re,3))}B.applyMatrix4(L.matrixWorld);const q=B.attributes.position;k+=q.count;for(let G=0;G<q.count;G++)S.x=q.getX(G)+O.x,S.y=q.getY(G)+O.baseY,S.z=q.getZ(G)+O.z,rn(S,.05)&&(q.setXYZ(G,S.x-O.x,S.y-O.baseY,S.z-O.z),y++);y&&B.computeVertexNormals(),q.needsUpdate=!0,B.computeBoundingSphere(),B.computeBoundingBox(),L.geometry=B,L.castShadow=e,L.receiveShadow=!1;const Q=Array.isArray(L.material)?L.material:[L.material];for(const G of Q)G.color?.multiply(Fr),G.roughness=.94,G.metalness=.02}for(const L of[l,...j])L.position.set(0,0,0),L.quaternion.identity(),L.scale.set(1,1,1),L.updateMatrix();l.updateMatrixWorld(!0);const F=(L,B=1)=>{const[q,Q,G]=O.squash;return new M(L[0]*O.r*q*B,L[1]*O.r*Q*B,L[2]*O.r*G*B)},A=so.map(L=>Ir(l,L,O.r*.1)??F(L,.82)),z=new M().addVectors(A[0],A[1]).multiplyScalar(.5),I=new M().addVectors(F(so[0],.82),F(so[1],.82)).multiplyScalar(.5),E=z.clone().sub(I),D=L=>{const B={x:L.x+O.x,y:L.y+O.baseY,z:L.z+O.z};return rn(B,.22)&&L.set(B.x-O.x,B.y-O.baseY,B.z-O.z),L};return{object:l,eyes:A.map(D),nose:D(F(kn,.87).add(E)),mouth:D(F(Tn,.9).add(E))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(aa,{eyes:s,nose:i,mouth:r,teeth:null,cast:e})]})}const Fr=new xe("#8f8a84");function aa({eyes:e,nose:o,mouth:n,teeth:s,cast:i}){const r=w.useRef(),l=w.useRef(),h=w.useRef();return oe(()=>{const d=v.t,m=.82+.18*Math.sin(d*2.3)*Math.sin(d*.71),x=.82+.18*Math.sin(d*1.9+2.1)*Math.sin(d*.63),p=.86+.14*Math.sin(d*1.4+.8);r.current&&(r.current.emissiveIntensity=5.2*m+v.flash*2),l.current&&(l.current.emissiveIntensity=5.2*x+v.flash*2),h.current&&(h.current.emissiveIntensity=3.4*p)}),t.jsxs(t.Fragment,{children:[e.map((d,m)=>t.jsxs("mesh",{position:d,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[O.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:m===0?r:l,color:R.furnace,emissive:R.ember,emissiveIntensity:5.2,toneMapped:!1,side:Ae,roughness:1})]},m)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[O.r*.046,O.r*.083,3]}),t.jsx("meshStandardMaterial",{color:R.emberDeep,emissive:R.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,O.r*.05,-O.r*.16],children:[t.jsx("planeGeometry",{args:[O.r*.62,O.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:R.ember,emissive:R.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:Ae})]}),s?.map((d,m)=>t.jsxs("mesh",{position:d.pos,scale:d.scale,rotation:[0,0,d.rot],castShadow:i,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:R.emberDeep,emissiveIntensity:.42,roughness:.78})]},m))]})]})}const Gr=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function Lr({quality:e="high",shadows:o=!0}){const s=Ze(sa)&&e!=="low"&&Gr!=="proc",{dome:i,hornL:r,hornR:l,teeth:h}=w.useMemo(()=>{const a=new Pa(O.r,Ar[e]??7),u=a.attributes.position,g=new Float32Array(u.count*3),b=new xe(X.rock),y=new xe(R.rockWarm),k=new xe("#120b10"),S=new xe,c=new M;for(let z=0;z<u.count;z++){c.set(u.getX(z),u.getY(z),u.getZ(z)).normalize();const I=O.r*Er(c),[E,D,L]=O.squash;u.setXYZ(z,c.x*I*E,c.y*I*D,c.z*I*L);const B=Math.max(Math.pow(Math.max(0,c.dot(gt[0])),5),Math.pow(Math.max(0,c.dot(gt[1])),5),Math.pow(Math.max(0,c.dot(ln)),6)*.9);S.copy(b).lerp(y,Math.min(1,B*1.5+Math.max(0,c.z)*.22));const q=Math.max(Math.pow(Math.max(0,c.dot(gt[0])),40),Math.pow(Math.max(0,c.dot(gt[1])),40));S.lerp(k,q),g[z*3]=S.r,g[z*3+1]=S.g,g[z*3+2]=S.b}a.setAttribute("color",new te(g,3)),a.computeVertexNormals();const j=new Oa(1,1,1),F=[],A=9;for(let z=0;z<A;z++){const I=z/(A-1)*2-1,E=he.halfWidth*2.1,D=I*E*.5,L=Math.pow(Math.abs(I),1.7)*14,B=46-Math.abs(I)*13+z%2*7;F.push({pos:[D,he.height*.5-L-B*.5,6],scale:[E/A*.76,B,52],rot:I*.13})}return j.dispose?.(),{dome:a,hornL:Xn(-1,e),hornR:Xn(1,e),teeth:F}},[e]),d=o,[m,x,p]=O.squash,f=(a,u)=>[a.x*O.r*m*u,a.y*O.r*x*u,a.z*O.r*p*u];return t.jsx("group",{position:[O.x,O.baseY,O.z],children:s?t.jsx(w.Suspense,{fallback:t.jsx(Qn,{dome:i,hornL:r,hornR:l,cast:d}),children:t.jsx(Cr,{shadows:d})}):t.jsxs(t.Fragment,{children:[t.jsx(Qn,{dome:i,hornL:r,hornR:l,cast:d}),t.jsx(aa,{eyes:gt.map(a=>f(a,.82)),nose:f(na,.87),mouth:f(ln,.96),teeth:h,cast:d})]})})}function Qn({dome:e,hornL:o,hornR:n,cast:s}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:s,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function it({matrices:e,target:o}){const n=w.useRef(!1);return oe(()=>{if(n.current||!o.current)return;const s=Math.min(e.length,o.current.count);for(let i=0;i<s;i++)o.current.setMatrixAt(i,e[i]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const Lt=190,dt=130,fo=9.5;function qn(e,o,n,s=24){const i=new Vt(e),r=new Yt(i,s,1,4,!1),l=r.attributes.position,h=new M(0,1,0),d=new M,m=new M,x=new M,p=new M,f=new M;for(let a=0;a<=s;a++){const u=a/s;i.getPointAt(u,m),i.getTangentAt(u,d),p.crossVectors(d,h).normalize(),x.crossVectors(p,d).normalize();for(let g=0;g<=4;g++){const b=a*5+g;if(b>=l.count)continue;const y=g/4*Math.PI*2+Math.PI/4,k=Math.cos(y)*o*.7071,S=Math.sin(y)*n*.7071;f.copy(m).addScaledVector(p,k).addScaledVector(x,S),l.setXYZ(b,f.x,f.y,f.z)}}return l.needsUpdate=!0,r.computeVertexNormals(),r}function Pr(e,o,n,s=40){const i=[];for(let d=0;d<=10;d++){const m=d/10*2-1;i.push(new M(m*e,-30*(1-m*m),0))}const r=new Vt(i),l=new Yt(r,s,n,8,!1),h=l.attributes.position;for(let d=0;d<=s;d++){const m=d/s*2-1,x=1+(1-m*m)*.85,p=r.getPointAt(d/s);for(let f=0;f<=8;f++){const a=d*9+f;a>=h.count||h.setXYZ(a,p.x+(h.getX(a)-p.x)*x,p.y+(h.getY(a)-p.y)*x,p.z+(h.getZ(a)-p.z)*x)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Jn({quality:e="high",shadows:o=!0,z:n=Rt,k:s=W}){const i=w.useRef(),r=w.useRef(),l=w.useRef(),h=w.useRef(),d=w.useMemo(()=>{const g=Lt/2,b=dt,y=qn([new M(-g-40,b+6,0),new M(-g-22,b+15.5,0),new M(0,b+20,0),new M(g+22,b+15.5,0),new M(g+40,b+6,0)],16,9,30),k=qn([new M(-g-30,b+2,0),new M(0,b+8,0),new M(g+30,b+2,0)],11,5,18);return{kasagi:y,shimaki:k,rope:Pr(g-6,30,6.4,44)}},[]),{tileM:m,merlonM:x,cannonM:p,lanternM:f}=w.useMemo(()=>{const g=new Qe,b=new lt,y=new M,k=new M,S=[],c=e==="low"?26:54;for(let I=0;I<c;I++){const E=I/(c-1)*2-1,D=E*(Lt/2+40),L=dt+20-Math.pow(Math.abs(E),1.9)*14+5,B=-Math.sign(E)*Math.pow(Math.abs(E),3)*.5;k.set(D,L,0),b.setFromEuler(new Et(0,0,B)),y.set(1,1,1),S.push(g.clone().compose(k,b,y))}const j=[];for(const I of[-1,1])for(let E=0;E<7;E++)k.set(I*(58+E*12),26,0),b.identity(),y.set(1,1,1),j.push(g.clone().compose(k,b,y));const F=[];for(const I of[-1,1])for(let E=0;E<2;E++)for(let D=0;D<4-E;D++)k.set(I*(64+D*13+E*6),32+E*10,8),b.setFromEuler(new Et(Math.PI/2-.16,0,0)),y.set(1,1,1),F.push(g.clone().compose(k,b,y));const A=[],z=e==="low"?10:22;for(let I=0;I<z;I++){const E=I/(z-1)*2-1,D=E*(Lt/2-12),L=30*(1-E*E);k.set(D,dt-34-L-7.5,0),b.identity(),y.set(1,1,1),A.push(g.clone().compose(k,b,y))}return{tileM:S,merlonM:j,cannonM:F,lanternM:A}},[e]);oe(()=>{const g=v.t;i.current&&(i.current.material.emissiveIntensity=2.6+Math.sin(g*3.1)*.22+Math.sin(g*7.7)*.1+v.flash*1.4)});const a=Lt/2,u=o;return t.jsxs("group",{position:[0,0,n],scale:s,children:[[-1,1].map(g=>t.jsxs("group",{position:[g*a,0,0],children:[t.jsxs("mesh",{position:[0,dt/2-30,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[fo*.86,fo,dt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[fo*1.5,fo*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},g)),t.jsxs("mesh",{position:[0,dt-26,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[Lt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:d.shimaki,castShadow:u,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:d.kasagi,castShadow:u,children:t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:r,args:[null,null,m.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(it,{matrices:m,target:r})]}),t.jsxs("mesh",{position:[0,dt-6,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,dt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:d.rope,position:[0,dt-34,2],castShadow:u,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(g=>{const b=30*(1-(g/(Lt/2-6))**2);return t.jsx("group",{position:[g,dt-34-b-4,2],children:[0,1,2].map(y=>t.jsxs("mesh",{position:[y%2?1.1:-1.1,-2.4-y*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:Ae})]},y))},g)}),[-1,1].map(g=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[g*108,6,0],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[g*108,30,6],castShadow:u,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:R.timber,roughness:.88})]}),t.jsxs("mesh",{position:[g*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},g)),t.jsxs("instancedMesh",{ref:h,args:[null,null,x.length],castShadow:u,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(it,{matrices:x,target:h})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,p.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(it,{matrices:p,target:l})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,f.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(it,{matrices:f,target:i})]})]})}const Or=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.12,"rgba(255,255,255,0.55)"),s.addColorStop(.4,"rgba(255,255,255,0.06)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let r=0;r<4;r++){const l=n.createLinearGradient(0,0,e/2,0);l.addColorStop(0,"rgba(255,255,255,0.95)"),l.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=l,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const i=new $t(o);return i.colorSpace=Kt,i})();function Dr(e,o,n,s){const i=[];for(let r=0;r<=s;r++){const l=r/s,h=l*2-1;i.push(new M(e[0]+(o[0]-e[0])*l,e[1]+(o[1]-e[1])*l-n*(1-h*h),e[2]+(o[2]-e[2])*l))}return i}const Nr=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Hr({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),i=w.useRef(),r=w.useRef(),{lanternM:l,lampM:h,pilingM:d,katanaY:m,ground:x}=w.useMemo(()=>{const a=new Qe,u=new lt,g=new M(1,1,1),b=new M,y=[],k=e==="low"?.42:e==="mid"?.72:1;for(const[F,A,z]of Nr){const I=Math.max(4,Math.round(z*k)),E=Dr(F,A,14,I);for(let D=1;D<E.length-1;D++){const L=.78+D*37%11/22;b.copy(E[D]).add(new M(0,-4.2*L,0)),u.setFromEuler(new Et(0,D*1.7%Math.PI,(D%3-1)*.06)),y.push(a.clone().compose(b,u,g.clone().multiplyScalar(L)))}}const S=[],c=e==="low"?6:11;for(let F=0;F<c;F++){const A=F/(c-1);for(const z of[-1,1]){const I=T.lerp(Z.x+46,he.x-6,A)+z*(26-A*9),E=T.lerp(Z.z-26,he.z+32,A);b.set(I,se(I,E)+5,E),u.identity(),S.push(a.clone().compose(b,u,g))}}const j=[];for(let F=0;F<16;F++){const A=F%2,z=Math.floor(F/2);b.set(Z.x+30+z*17,-2,Z.z+34+A*26),u.setFromEuler(new Et(0,0,(F%3-1)*.035)),j.push(a.clone().compose(b,u,g))}return{lanternM:y,lampM:S,pilingM:j,katanaY:se(Z.x+118,Z.z-58),ground:Z.y}},[e]);oe(()=>{const a=v.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(a*2.7)*.2+Math.sin(a*6.1+1.3)*.12+v.flash*1.6),r.current){const u=46*(1+Math.sin(a*1.3)*.13);r.current.scale.set(u,u,1),r.current.material.rotation=a*.07}});const p=o,f=(a,u)=>se(Z.x+a,Z.z+u);return t.jsxs("group",{children:[t.jsxs("group",{position:[Z.x,0,Z.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:R.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:p,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(a=>t.jsxs("group",{position:[52+a*26,1.5,92+a%2*13],rotation:[0,.4+a*.3,0],children:[t.jsxs("mesh",{castShadow:p,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:Ae})]})]},a))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(it,{matrices:d,target:i})]}),t.jsxs("group",{position:[Z.x+118,m,Z.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:p,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:r,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:Or,color:R.furnace,transparent:!0,opacity:.75,blending:mt,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(a=>{const u=96+a*4,g=88*a;return t.jsxs("group",{position:[Z.x+u,f(u,g),Z.z+g],rotation:[0,-a*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:p,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:p,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(b=>t.jsxs("mesh",{position:[b*3,37,4],rotation:[0,0,b*.3],castShadow:p,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},b)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:p,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.9,side:Ae})]})]},a)}),[-1,1].map(a=>{const u=40+a*34,g=-18+a*46;return t.jsxs("group",{position:[Z.x+u,f(u,g)+12,Z.z+g],rotation:[0,a*.8,0],children:[t.jsxs("mesh",{castShadow:p,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(b=>t.jsxs("mesh",{position:[b*5,7,-1],rotation:[0,0,b*-.5],castShadow:p,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},b)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:R.ember,emissive:R.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:Ae})]})]},a)}),t.jsxs("group",{position:[Z.x-34,f(-34,30)+2,Z.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:p,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.88,side:Ae,emissive:R.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(a,u)=>{const g=u/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(g)*26,55.5,Math.sin(g)*26],rotation:[0,-g,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},u)}),Array.from({length:10},(a,u)=>{const g=u/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(g)*32,44,Math.sin(g)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.5,toneMapped:!1})]},u)})]}),[0,1,2,3].map(a=>{const u=8+a*30,g=-70-a%2*14;return t.jsxs("group",{position:[Z.x+u,f(u,g),Z.z+g],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:a%2?"#e8dcc4":R.vermilion,roughness:.95,side:Ae})]})]},a)}),[0,1,2].map(a=>{const u=.28+a*.24,g=T.lerp(Z.x+46,he.x,u),b=T.lerp(Z.z-26,he.z+26,u),y=se(g,b),k=1-a*.1;return t.jsxs("group",{position:[g,y,b],scale:k,children:[[-1,1].map(S=>t.jsxs("mesh",{position:[S*15,17,0],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.7})]},S)),t.jsxs("mesh",{position:[0,36,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:p,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.75})]})]},a)}),t.jsx("group",{position:[Z.x,x,Z.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(it,{matrices:l,target:n})]})}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:p,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:R.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(it,{matrices:h,target:s})]})]})}const es={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function _r(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Br({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),i=w.useRef(),r=w.useRef(),{pineTrunkM:l,pineCanopyM:h,sakuraM:d,rockM:m}=w.useMemo(()=>{const p=es[e]??es.high,f=_r(20250801),a=new Qe,u=new lt,g=new M,b=new M,y=new M(0,1,0),k=new M,S=[],c=[],j=[],F=p.pine+p.sakura+p.rock;let A=0,z=0;for(;A<F&&z<F*60;){z++;const I=f()*Math.PI*2,E=yt*(.55+f()*.62),D=le.x+Math.sin(I)*E,L=le.z+Math.cos(I)*E,B=se(D,L);if(B<5||B>300||nr(D,L,6)>.72||Math.hypot(D-O.x,L-O.z)<O.r*1.35)continue;const q=D>le.x+(f()-.5)*90,Q=A;if(A++,b.set(D,B,L),Q<p.rock){const G=Rn(D,L,5);k.set(G[0],G[1],G[2]),u.setFromUnitVectors(y,k),u.multiply(new lt().setFromEuler(new Et(f()*.5,f()*6.28,f()*.5)));const Y=2.5+f()*7;g.set(Y*(.7+f()*.6),Y*(.5+f()*.5),Y*(.7+f()*.6)),b.y-=Y*.25,j.push(a.clone().compose(b,u,g))}else if(q){if(S.length>=p.pine)continue;u.setFromEuler(new Et(0,f()*6.28,(f()-.5)*.09));const G=.72+f()*.7;g.set(G,G*(.85+f()*.45),G),S.push(a.clone().compose(b,u,g))}else{if(c.length>=p.sakura)continue;u.setFromEuler(new Et(0,f()*6.28,(f()-.5)*.13));const G=.7+f()*.75;g.set(G,G*(.8+f()*.5),G),c.push(a.clone().compose(b,u,g))}}return{pineTrunkM:S.map(I=>I.clone().multiply(Ur)).concat(c.map(I=>I.clone().multiply(Yr))),pineCanopyM:S.map(I=>I.clone().multiply(Wr)),sakuraM:c.map(I=>I.clone().multiply(Vr)),rockM:j}},[e]),x=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],castShadow:x,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(it,{matrices:l,target:n})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:x,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(it,{matrices:h,target:s})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:x,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:R.sakura,roughness:.95,flatShading:!0,emissive:R.sakura,emissiveIntensity:.1}),t.jsx(it,{matrices:d,target:i})]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,m.length],castShadow:x,receiveShadow:x,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(it,{matrices:m,target:r})]})]})}const Ur=new Qe().makeTranslation(0,7,0),Wr=new Qe().makeTranslation(0,26,0),Vr=new Qe().compose(new M(0,13,0),new lt,new M(1,.72,1)),Yr=new Qe().compose(new M(0,5,0),new lt,new M(.75,.62,.75));function $r({url:e,height:o,loa:n,slim:s=1,sink:i=0,rotation:r,tint:l,emissive:h,emissiveIntensity:d}){const{scene:m}=$s(e),x=w.useMemo(()=>m.clone(!0),[m]),p=w.useMemo(()=>{const f=new Ks().setFromObject(x),a=new M;f.getSize(a);const u=new M;if(f.getCenter(u),n){const b=a.x>=a.z,y=Math.max(b?a.x:a.z,1e-4),k=n/y,S=b?[k,k,k*s]:[k*s,k,k];return{scale:S,offset:[-u.x*S[0],-f.min.y*S[1]-n*i,-u.z*S[2]]}}const g=a.y>1e-4?o/a.y:1;return{scale:[g,g,g],offset:[-u.x*g,-f.min.y*g,-u.z*g]}},[x,o,n,s,i]);return w.useEffect(()=>{x.traverse(f=>{if(f.isMesh&&(f.castShadow=!0,f.receiveShadow=!0,l&&f.material)){const a=Array.isArray(f.material)?f.material:[f.material];for(const u of a)u.color?.multiply(new xe(l)),h&&u.emissive&&(u.emissive.set(h),u.emissiveIntensity=d??.2)}})},[x,l,h,d]),t.jsx("group",{rotation:[0,r,0],scale:p.scale,position:p.offset,children:t.jsx("primitive",{object:x})})}class Kr extends w.Component{constructor(){super(...arguments);Wn(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function pe({name:e,height:o,loa:n=null,slim:s=1,sink:i=0,rotation:r=0,position:l=[0,0,0],tint:h=null,emissive:d=null,emissiveIntensity:m=.2,fallback:x=null}){const p=io(e);return Ze(e)?t.jsx("group",{position:l,children:t.jsx(Kr,{url:p,fallback:x,children:t.jsx(w.Suspense,{fallback:x,children:t.jsx($r,{url:p,height:o,loa:n,slim:s,sink:i,rotation:r,tint:h,emissive:d,emissiveIntensity:m})})})}):t.jsx("group",{position:l,children:x})}const xt=Math.PI,ts={"ship-sunny.opt.glb":xt/2,"ship-tang.opt.glb":xt/2,"ship-punk.opt.glb":xt/2,"ship-lion.opt.glb":xt/2,"ship-bone.opt.glb":xt/2,"ship-junk.opt.glb":xt/2,"ship-warjunk.opt.glb":xt/2,"ship-sub.opt.glb":-xt/2},Do=e=>e&&ts[e]!==void 0?ts[e]:xt/2,os={"ship-sunny.opt.glb":42,"ship-lion.opt.glb":42,"ship-punk.opt.glb":54,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":52,"ship-junk.opt.glb":40,"ship-warjunk.opt.glb":62},ns={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},Cn=2,No=(e,o=34)=>e&&os[e]!==void 0?os[e]:o,Ho=e=>e&&ns[e]!==void 0?ns[e]:1,cn=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),i=s.createImageData(e,o);for(let l=0;l<o;l++){const h=l/(o-1),d=Math.pow(1-h,1.7);for(let m=0;m<e;m++){const x=m/(e-1)*2-1,p=Math.max(0,1-Math.abs(x)/(.35+h*.65)),f=.45+.55*Math.pow(Math.abs(x)/(.35+h*.65),1.5),a=d*Math.pow(p,1.4)*f,u=(l*e+m)*4;i.data[u]=255,i.data[u+1]=255,i.data[u+2]=255,i.data[u+3]=Math.round(Math.min(1,a)*255)}}s.putImageData(i,0,0);const r=new $t(n);return r.colorSpace=Kt,r})(),Xr=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createImageData(e,e);for(let r=0;r<e;r++){const l=r/(e-1),h=Math.pow(1-l,1.5);for(let d=0;d<e;d++){const m=d/(e-1)*2-1,x=Math.max(0,1-Math.abs(m)),p=h*Math.pow(x,1.3),f=(r*e+d)*4;s.data[f]=255,s.data[f+1]=255,s.data[f+2]=255,s.data[f+3]=Math.round(Math.min(1,p)*255)}}n.putImageData(s,0,0);const i=new $t(o);return i.colorSpace=Kt,i})(),Eo=160,Ht=112,ao="#e6dfcf",ra="#0c0a15",_t=ra;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,s,i){const r=Math.min(i??0,Math.abs(n)/2,Math.abs(s)/2);return this.moveTo(e+r,o),this.arcTo(e+n,o,e+n,o+s,r),this.arcTo(e+n,o+s,e,o+s,r),this.arcTo(e,o+s,e,o,r),this.arcTo(e,o,e+n,o,r),this.closePath(),this});function Pt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=Eo,o.height=Ht;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,0,Ht);s.addColorStop(0,"#14101f"),s.addColorStop(.5,ra),s.addColorStop(1,"#08060f"),n.fillStyle=s,n.fillRect(0,0,Eo,Ht),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,Ht),n.save(),n.translate(Eo/2+4,Ht/2);try{e(n)}catch(r){console.warn("[onigashima] flag emblem skipped",r)}n.restore();const i=new $t(o);return i.colorSpace=Kt,i.anisotropy=4,i}function Uo(e,o,n=ao){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Wo(e,o,n=1){e.save(),e.fillStyle=_t,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function ss(e,o,n=4){e.save(),e.fillStyle=_t;for(let s=1;s<n;s++){const i=-o*.5+s*o/n;e.fillRect(i-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function as(e,o,n=ao){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const s of[1,-1]){e.save(),e.rotate(s*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const i of[-1,1])for(const r of[-.16,.16])e.beginPath(),e.arc(i*o*1.55,o*.55+r*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Zr={straw:Pt(e=>{as(e,26),Uo(e,26),Wo(e,26),ss(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Pt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=_t;for(const s of[-1,1])e.beginPath(),e.arc(s*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=_t,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Pt(e=>{as(e,26,"#d8cfc0"),e.fillStyle=ao,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=_t;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const s=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(s,26*.42),e.lineTo(s+26*.1,26*1.04),e.lineTo(s-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Pt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const s=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(s),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:Pt(e=>{e.fillStyle=ao;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();Uo(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Wo(e,25,.85),e.save(),e.fillStyle=_t,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=ao;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Pt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();Uo(e,26,"#cfd8e4"),Wo(e,26),ss(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},ia={value:0},rs=new Map;function Qr(e){const o=rs.get(e);if(o)return o;const n=Zr[e],s=new Na({map:n,emissiveMap:n,emissive:new xe("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:Ae,transparent:!1});return s.onBeforeCompile=i=>{i.uniforms.uTime=ia,i.vertexShader=`uniform float uTime;
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
      `)},s.customProgramCacheKey=()=>"onigashima-flag",rs.set(e,s),s}function qr(){return oe((e,o)=>{ia.value+=Math.min(o,.05)}),null}const Jr=(()=>{const e=new Sn(1,1,14,5);return e.translate(.5,0,0),e})();function ho({crew:e="straw",width:o=16,position:n=[0,0,0],rotation:s=Math.PI/2,staff:i=!0}){const r=w.useMemo(()=>Qr(e)??null,[e]),l=o*(Ht/Eo);return r?t.jsxs("group",{position:n,rotation:[0,s,0],children:[i&&t.jsxs("mesh",{position:[0,l*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,l*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:Jr,material:r,scale:[o,l,o]})]}):null}const Vo=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:R.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:R.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#6c684f"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#77694f"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#665945"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#666249"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:R.lantern,model:"ship-junk.opt.glb",tint:"#71634c"}];function ei(e){const o=T.lerp(820*W,150*W,e);return[(Math.sin(e*2.4)*54-e*26)*W,o]}function ti({spec:e,quality:o}){const n=w.useRef(),s=w.useRef(),i=w.useRef();oe(()=>{const a=n.current;if(!a)return;const u=T.clamp(v.progress*.82+.04,0,1),[g,b]=ei(u),y=g+e.off*W*.94,k=b-e.lead*W*.98,S=co(y,k),c=T.clamp(-se(y,k)/46,0,1),j=T.lerp(1,.055,S)*T.smoothstep(c,0,.28),F=rt(y,k,v.t,j),A=e.sub?T.smoothstep(v.progress,.42,.6):0;a.position.set(y,F.y-(e.sub?4.5:1.2)*e.scale-A*40,k);const z=e.sub?.35:1;a.rotation.x=T.clamp(F.dz*1.35*z,-.32,.32),a.rotation.z=T.clamp(-F.dx*1.15*z,-.28,.28),a.rotation.y=Math.PI+Math.sin(v.t*.31+e.lead)*.05,s.current&&(s.current.scale.z=1+Math.sin(v.t*1.6+e.off)*.09,s.current.rotation.y=Math.sin(v.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-S)*.75)*(1-A))});const r=e.scale,l=o==="low"?6:10,h=Ze(e.model2??""),d=Ze(e.model??""),m=h?e.model2:d?e.model:null,x=m==="ship-junk.opt.glb",p=No(m,34)*(x?e.scale??1:1),f=Ze(e.crew??"");return m?t.jsxs("group",{ref:n,children:[t.jsx(pe,{name:m,loa:p,slim:Ho(m),sink:.062,rotation:Do(m),tint:h?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),f&&t.jsx(pe,{name:e.crew,height:Cn,rotation:0,position:[0,p*.085,p*.06]}),e.flag&&t.jsx(ho,{crew:e.flag,width:p*(e.sub?.3:.22),position:[0,p*(e.sub?.42:.66),-p*.12],staff:!!e.sub}),t.jsxs("mesh",{position:[0,p*.3,-p*.2],children:[t.jsx("sphereGeometry",{args:[p*.03,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-p*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[p*.55,p*2.3]}),t.jsx("meshBasicMaterial",{map:cn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:r*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,l]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:Ae,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(a=>[0,1,2,3].map(u=>t.jsxs("mesh",{position:[a*5.6,3.4,-6+u*4],rotation:[0,0,a*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${a}-${u}`))),e.flag&&t.jsx(ho,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*r],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*r,74*r]}),t.jsx("meshBasicMaterial",{map:cn,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function is({x:e,z:o,yaw:n,name:s,loa:i,tint:r,sunk:l=.062,flag:h=null}){const d=No(s,i),m=w.useRef(),x=Ze(s);return oe(()=>{const p=m.current;if(!p)return;const f=co(e,o),a=T.clamp(-se(e,o)/46,0,1),u=T.lerp(1,.055,f)*T.smoothstep(a,0,.28),g=rt(e,o,v.t,u);p.position.set(e,g.y-1.5,o),p.rotation.set(T.clamp(g.dz*1.1,-.25,.25),n+Math.sin(v.t*.22+e)*.04,T.clamp(-g.dx,-.22,.22))}),t.jsxs("group",{ref:m,children:[t.jsx(pe,{name:s,loa:d,slim:Ho(s),sink:l,rotation:Do(s),tint:r,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&x&&t.jsx(ho,{crew:h,width:d*.22,position:[0,d*.62,-d*.1]})]})}const oi=[{x:-190*W,z:320*W,yaw:.35},{x:168*W,z:438*W,yaw:-.55},{x:-88*W,z:540*W,yaw:.12},{x:236*W,z:690*W,yaw:-.28},{x:-262*W,z:748*W,yaw:.48},{x:96*W,z:880*W,yaw:-.16}],ni=[{x:Z.x+132*W*.72,z:Z.z+96*W*.72,yaw:2.3},{x:Z.x+168*W*.72,z:Z.z+40*W*.72,yaw:1.9},{x:Z.x+96*W*.72,z:Z.z+150*W*.72,yaw:2.7}];function si({quality:e="high"}){const o=w.useMemo(()=>e==="low"?Vo.slice(0,5):e==="mid"?Vo.slice(0,11):Vo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(qr,{}),o.map(n=>t.jsx(ti,{spec:n,quality:e},n.id)),e!=="low"&&oi.map((n,s)=>t.jsx(is,{...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts"},`picket-${s}`)),e!=="low"&&ni.map((n,s)=>t.jsx(is,{...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki"},`moored-${s}`))]})}const ai="#2e2a33",hn="#3a4152",dn=X.snow,Fo="#cfe0f4";function ls({position:e}){return t.jsx("group",{position:e,children:t.jsx(pe,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:hn,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:hn,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:Fo,emissive:Fo,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:dn,roughness:.9})]})]})})})}function ri({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2($.dir[0],$.dir[1]),[]);return t.jsxs("group",{position:[$.gate.x,$.benchY,$.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:hn,roughness:.92})]},n)),t.jsx(pe,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:ai,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:dn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:dn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:Ae})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:Fo,emissive:Fo,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(ls,{position:[-14,0,10]}),t.jsx(ls,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const xo=new xe,un={color:"#7fd8c8",intensity:9e3,distance:320},Yo={color:"#ffc48a",intensity:12e3,distance:300},ii=new xe(un.color),li={low:1,mid:2,high:4},Ot=[{pos:[Z.x,40,Z.z],color:R.lantern,intensity:16e3,distance:460*W*.65},{pos:[0,78,Rt],color:R.lantern,intensity:15e3,distance:430},{pos:[he.x,he.y+6,he.z-30],color:R.emberDeep,intensity:3e4,distance:640},{pos:[$.gate.x,30,$.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function ci({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const s=w.useRef(),i=w.useRef(),r=w.useRef(),l=w.useRef(),h=w.useRef(),d=w.useRef(),m=Se(p=>p.camera),x=li[e]??5;return oe(()=>{if(s.current){s.current.intensity=v.flash*9e3;const a=v.flashDir;s.current.position.set(a.x*700,260+a.y*500,le.z+a.z*700)}const p=v.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(p*2.3)*Math.sin(p*.71))),r.current&&(r.current.intensity=62e3*(.86+.14*Math.sin(p*1.9+2.1)*Math.sin(p*.63)));const f=v.inside;if(h.current&&(h.current.intensity=.16+f*.3),d.current&&(d.current.intensity=.34+f*.26),l.current){const a=l.current,u=.06;let g=Ot[0],b=1/0;for(const y of Ot){const k=(m.position.x-y.pos[0])**2+(m.position.z-y.pos[2])**2;k<b&&(b=k,g=y)}if(v.subActive&&b>550*550){const y=v.subPos,k=Math.min(1,v.underwater/.35);a.position.x+=(y.x-a.position.x)*.3,a.position.y+=(y.y+14-a.position.y)*.3,a.position.z+=(y.z-a.position.z)*.3,xo.set(Yo.color).lerp(ii,k),a.color.lerp(xo,u),a.intensity+=(T.lerp(Yo.intensity,un.intensity,k)-a.intensity)*u,a.distance=T.lerp(Yo.distance,un.distance,k)}else if(v.helmActive&&b>550*550){const y=v.helmPos;a.position.x+=(y.x-a.position.x)*.25,a.position.y+=(y.y+16-a.position.y)*.25,a.position.z+=(y.z-a.position.z)*.25,a.color.lerp(xo.set(R.lantern),u),a.intensity+=(11e3-a.intensity)*u,a.distance=300}else a.position.x+=(g.pos[0]-a.position.x)*u,a.position.y+=(g.pos[1]-a.position.y)*u,a.position.z+=(g.pos[2]-a.position.z)*u,a.color.lerp(xo.set(g.color),u),a.intensity+=(g.intensity-a.intensity)*u,a.distance=g.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(W/1.55),"shadow-camera-right":520*(W/1.55),"shadow-camera-top":520*(W/1.55),"shadow-camera-bottom":-520*(W/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:x>=2?[Me[0].x,Me[0].y,Me[0].z]:[(Me[0].x+Me[1].x)/2,Me[0].y,Me[0].z],color:R.ember,intensity:62e3,distance:1250,decay:2}),x>=2&&t.jsx("pointLight",{ref:r,position:[Me[1].x,Me[1].y,Me[1].z],color:R.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:l,position:Ot[0].pos,color:Ot[0].color,intensity:Ot[0].intensity,distance:Ot[0].distance,decay:2}),x>=3&&t.jsx("pointLight",{position:[he.x,he.y+4,he.z-34],color:R.emberDeep,intensity:3e4,distance:640,decay:2}),x>=4&&t.jsx("pointLight",{position:[0,78,Rt],color:R.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:s,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function $o(e,o){let n=e>>>0;const s=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=[],r=o==="low"?3:5,l=(u,g,b,y,k)=>{const S=[u.clone()],c=u.clone();for(let F=0;F<y;F++)c.add(new M((s()-.5)*b*.55,-b/y,(s()-.5)*b*.42)).add(g.clone().multiplyScalar(b/y*.3)),S.push(c.clone());const j=new Yt(new Vt(S),y*2,k,r,!1);return i.push(j),S},h=l(new M(0,620,0),new M(0,0,0),620,9,3.4),d=o==="low"?1:3;for(let u=0;u<d;u++){const g=h[2+Math.floor(s()*(h.length-3))];l(g.clone(),new M(s()-.5,0,s()-.5).multiplyScalar(2),190+s()*130,4,1.5)}let m=0;for(const u of i)m+=u.attributes.position.count;const x=new Float32Array(m*3),p=new Float32Array(m*3);let f=0;for(const u of i)x.set(u.attributes.position.array,f*3),p.set(u.attributes.normal.array,f*3),f+=u.attributes.position.count,u.dispose();const a=new kt;return a.setAttribute("position",new te(x,3)),a.setAttribute("normal",new te(p,3)),a}function hi({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),s=w.useRef({i:0,t:-1,dur:0,flicker:0}),i=w.useMemo(()=>[$o(40503,e),$o(20973,e),$o(10196,e)],[e]);return oe((r,l)=>{const h=Math.min(l,.05),d=s.current;if(n.current-=h,n.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const m=o[d.i].current;if(m){const x=(Math.random()-.5)*2.4-Math.PI*.5,p=620+Math.random()*760;m.position.set(le.x+Math.cos(x)*p,40+Math.random()*120,le.z+Math.sin(x)*p*.7-240),m.rotation.y=Math.random()*Math.PI*2;const f=.7+Math.random()*.8;m.scale.set(f,f,f),v.flashDir.set(m.position.x,m.position.y+400,m.position.z).normalize()}n.current=T.lerp(6.5,2.2,v.progress)*(.45+Math.random())}if(d.t>=0){d.t+=h;const m=d.t/d.dur,x=Math.abs(Math.sin(m*Math.PI*d.flicker)),p=Math.max(0,1-m);v.flash=p*p*x;const f=o[d.i].current;f&&(f.material.opacity=Math.min(1,v.flash*2.2)),m>=1&&(d.t=-1,v.flash=0,f&&(f.material.opacity=0))}else v.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:i.map((r,l)=>t.jsx("mesh",{ref:o[l],geometry:r,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:mt,depthWrite:!1,toneMapped:!1})},l))})}const di=`
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
`,ui=`
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
`,cs={low:1600,mid:3800,high:7e3},go=460;function pi({quality:e}){const o=w.useRef(),n=Se(r=>r.camera),s=w.useMemo(()=>{const r=cs[e]??cs.high,l=new Float32Array(r*3),h=new Float32Array(r),d=new Float32Array(r);for(let x=0;x<r;x++)l[x*3]=Math.random()*go,l[x*3+1]=Math.random()*go,l[x*3+2]=Math.random()*go,h[x]=.7+Math.random()*.6,d[x]=.55+Math.random()*.85;const m=new kt;return m.setAttribute("position",new te(l,3)),m.setAttribute("aSpeed",new te(h,1)),m.setAttribute("aLen",new te(d,1)),m.boundingSphere=new Xt(new M,1e6),m},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new M},uBox:{value:go},uFall:{value:118},uSize:{value:2.4},uColor:{value:new M(...ne("#b9c8e4"))},uOpacity:{value:.5}}),[]);return oe((r,l)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=l,h.uCam.value.copy(n.position),h.uOpacity.value=.5*v.rain*v.rain+v.flash*.3)}),t.jsx("points",{geometry:s,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:di,fragmentShader:ui,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const mi=`
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
`,fi=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,hs={low:120,mid:340,high:700};function xi({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const i=hs[e]??hs.high,r=[Me[0],Me[1],he,he],l=new Float32Array(i*3),h=new Float32Array(i),d=new Float32Array(i),m=new Float32Array(i);for(let p=0;p<i;p++){const f=r[p%r.length];l[p*3]=f.x+(Math.random()-.5)*74,l[p*3+1]=f.y+(Math.random()-.5)*30,l[p*3+2]=f.z+(Math.random()-.5)*26,h[p]=Math.random(),d[p]=.045+Math.random()*.055,m[p]=2+Math.random()*4}const x=new kt;return x.setAttribute("position",new te(l,3)),x.setAttribute("aPhase",new te(h,1)),x.setAttribute("aRise",new te(d,1)),x.setAttribute("aSize",new te(m,1)),x.boundingSphere=new Xt(new M(0,300,-260),700),x},[e]),s=w.useMemo(()=>({uTime:{value:0},uColor:{value:new M(...ne(R.ember))}}),[]);return oe((i,r)=>{o.current&&(o.current.uniforms.uTime.value+=r)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:mi,fragmentShader:fi,uniforms:s,transparent:!0,depthWrite:!1,blending:mt,fog:!1})})}function gi({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(hi,{quality:e}),t.jsx(pi,{quality:e}),t.jsx(xi,{quality:e})]})}const wi=`
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
`,yi=`
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
`,ds={low:150,mid:380,high:620};function bi({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),i=w.useMemo(()=>{const l=ds[o]??ds.high,h=new Float32Array(l*3),d=new Float32Array(l),m=new Float32Array(l),x=new Float32Array(l),p=new Float32Array(l),f=new Float32Array(l);for(let u=0;u<l;u++)d[u]=Math.random()*Math.PI*2,m[u]=Math.random(),x[u]=.05+Math.random()*.05,p[u]=3+Math.random()*6,f[u]=Math.random();const a=new kt;return a.setAttribute("position",new te(h,3)),a.setAttribute("aAngle",new te(d,1)),a.setAttribute("aPhase",new te(m,1)),a.setAttribute("aRate",new te(x,1)),a.setAttribute("aSize",new te(p,1)),a.setAttribute("aJitter",new te(f,1)),a.boundingSphere=new Xt(new M(e.x,0,e.z),e.r*1.6+40),a},[o,e]),r=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new zn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new M(...ne(X.foam))},uGain:{value:1}}),[e]);return oe((l,h)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=h;const m=Math.hypot(l.camera.position.x-e.x,l.camera.position.z-e.z);d.uGain.value=1-T.smoothstep(m,1600,2400),s.current&&(s.current.visible=d.uGain.value>.02)}),t.jsx("points",{ref:s,geometry:i,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:wi,fragmentShader:yi,uniforms:r,transparent:!0,depthWrite:!1,blending:mt,fog:!1})})}function vi({quality:e="high"}){const o=Se(n=>n.camera);return oe(()=>{let n=0;for(const s of Fe){const i=Math.hypot(o.position.x-s.x,o.position.z-s.z);n=Math.max(n,1-T.smoothstep(i,s.r*.3,s.r*2.2))}v.whirlNear+=(n-v.whirlNear)*.05}),t.jsx(t.Fragment,{children:Fe.map((n,s)=>t.jsx(bi,{whirl:n,quality:e},s))})}const U={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},Wt={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<lo-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*W},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Rt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*W},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=qa("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<$.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},Mi=e=>Wt[e]?Wt[e].length:0,ji=()=>U.chain&&Wt[U.chain]?Wt[U.chain][U.step]??null:null;function pn(e){U.chain=Wt[e]?e:null,U.step=0,U.hull=1,U.grip=0,U.clock=0,U.done=!1,U.banner=null,U.rev++}function Go(e,o,n=3.4){U.banner={text:e,sub:o,until:U.clock+n},U.rev++}function Bt(e,o){U.hull<=0||(U.hull=Math.max(0,U.hull-e),U.hits++,U.hull<=0?Go("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&Go(o,null,2.2),U.rev++)}function la(e,o){if(U.clock+=e,U.banner&&U.clock>U.banner.until&&(U.banner=null,U.rev++),!U.chain||U.done||!o)return;const n=Wt[U.chain],s=n[U.step];if(!s)return;let i=!1;try{i=!!s.test(o)}catch{i=!1}i&&(U.step++,U.step>=n.length?(U.done=!0,Go("OBJECTIVE COMPLETE",Si[U.chain]??"",6)):Go(n[U.step].text,n[U.step].hint,3.6),U.rev++)}const Si={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function ca(e,{danger:o,headingX:n,headingZ:s,toCentreX:i,toCentreZ:r,speed:l,throttle:h}){if(o<=.001)return U.grip=Math.max(0,U.grip-e*.5),U.grip;const d=Math.hypot(i,r)||1,m=-i/d,x=-r/d,p=n*m+s*x,f=Math.min(1,Math.abs(l)/22),a=o*.42,u=Math.max(0,p)*f*(.35+.45*Math.min(1,Math.abs(h)));return U.grip=Math.max(0,Math.min(1,U.grip+(a-u)*e)),U.grip}const us=24,Ko=Ao.safe,ps=Ao.range,qt=2.1,zi=1.5,ms=22,ki=[Rt,lo],Ti=new Qe,Xo=new M,fs=new lt,Zo=new M;function Ei({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:us},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),s=w.useRef(0),i=w.useMemo(()=>{const r=new Xs(.55,1,1,e==="low"?6:10,1,!0);return r.translate(0,.5,0),r},[e]);return oe((r,l)=>{const h=o.current;if(!h)return;const d=Math.min(l,.05),m=v.helm;if(v.helmActive&&m&&!m.onFoot&&!m.sub&&!m.moored){let f=null,a=1/0;for(const u of ki){const g=Math.hypot(m.x,m.z-u);g<Ko||g>ps||g<a&&(a=g,f=u)}if(f!==null&&(s.current-=d,s.current<=0)){const u=1-T.clamp((a-Ko)/(ps-Ko),0,1);s.current=T.lerp(4.5,1.9,u);const g=n.find(b=>!b.live);if(g){const b=qt*.55,y=T.lerp(230,105,u);g.x=m.x+Math.sin(m.heading)*m.speed*b+(Math.random()-.5)*y,g.z=m.z+Math.cos(m.heading)*m.speed*b+(Math.random()-.5)*y,g.y0=210+Math.random()*60,g.t=0,g.live=!0}}}let p=0;for(const f of n){if(!f.live)continue;const a=f.t;if(f.t+=d,f.t<qt){const u=f.t/qt;Xo.set(f.x,f.y0*(1-u*u),f.z),Zo.set(2.2,9,2.2)}else{if(a<qt){const b=Math.hypot(f.x-m.x,f.z-m.z);b<ms&&Bt(.03*(1-b/ms)+.008,"HIT — SHOT THROUGH THE RIGGING"),v.splash+=1}const u=(f.t-qt)/zi;if(u>=1){f.live=!1;continue}const g=Math.min(1,u*4);Xo.set(f.x,rt(f.x,f.z,v.t,1).y-4,f.z),Zo.set(11+u*9,78*g*(1-u*u*.75),11+u*9)}fs.identity(),h.setMatrixAt(p,Ti.compose(Xo,fs,Zo)),p++}h.count=p,h.instanceMatrix.needsUpdate=!0,h.visible=p>0}),t.jsx("instancedMesh",{ref:o,args:[i,void 0,us],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:mt,side:Ae})})}const Ri=`
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
`,Ai=`
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
`,xs={low:700,mid:1800,high:3200},wo=260;function Ii({quality:e}){const o=w.useRef(),n=w.useRef(),s=Se(l=>l.camera),i=w.useMemo(()=>{const l=xs[e]??xs.high,h=new Float32Array(l*3),d=new Float32Array(l),m=new Float32Array(l),x=new Float32Array(l);for(let f=0;f<l;f++)h[f*3]=Math.random()*wo,h[f*3+1]=Math.random()*wo,h[f*3+2]=Math.random()*wo,d[f]=.5+Math.random()*1.4,m[f]=1.2+Math.random()*3.2,x[f]=Math.random();const p=new kt;return p.setAttribute("position",new te(h,3)),p.setAttribute("aSpeed",new te(d,1)),p.setAttribute("aSize",new te(m,1)),p.setAttribute("aPhase",new te(x,1)),p.boundingSphere=new Xt(new M,1e6),p},[e]),r=w.useMemo(()=>({uTime:{value:0},uCam:{value:new M},uBox:{value:wo},uColor:{value:new M(...ne("#cfeee6"))},uGain:{value:0}}),[]);return oe((l,h)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=h,d.uCam.value.copy(s.position),d.uGain.value=v.underwater,n.current&&(n.current.visible=v.underwater>.02))}),t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Ri,fragmentShader:Ai,uniforms:r,transparent:!0,depthWrite:!1,fog:!1})})}const Ci=`
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
`,Fi=`
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
`,gs={low:260,mid:700,high:1300},Gi=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,Li=`
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
`,ws=1100;function Pi({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),i=Se(h=>h.camera),r=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,d=new Xs(e.r*1.02,e.r*.07,ws,h,6,!0);return d.translate(e.x,-ws/2-3,e.z),d},[e,o]),l=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new M(...ne(X.foam))},uDeep:{value:new M(...ne(X.underGlow))},uCameraPos:{value:new M},uFogDensity:{value:.0062},uFogColor:{value:new M(...ne(X.underHaze))}}),[e]);return oe((h,d)=>{const m=n.current?.uniforms;if(!m)return;m.uTime.value+=d,m.uCameraPos.value.copy(h.camera.position),m.uFogDensity.value=h.scene.fog?.density??.0062;const x=h.scene.fog?.color;x&&m.uFogColor.value.set(x.r,x.g,x.b);const p=Math.hypot(i.position.x-e.x,i.position.z-e.z),f=1-T.smoothstep(p,e.r*8,e.r*24);m.uGain.value+=(v.underwater*f-m.uGain.value)*Math.min(1,d*4),s.current&&(s.current.visible=m.uGain.value>.012)}),t.jsx("mesh",{ref:s,geometry:r,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Gi,fragmentShader:Li,uniforms:l,transparent:!0,depthWrite:!1,side:Ae,blending:mt,fog:!1})})}function Oi({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),i=Se(h=>h.camera),r=w.useMemo(()=>{const h=gs[o]??gs.high,d=new Float32Array(h*3),m=new Float32Array(h),x=new Float32Array(h),p=new Float32Array(h),f=new Float32Array(h),a=new Float32Array(h);for(let g=0;g<h;g++)m[g]=Math.random()*Math.PI*2,x[g]=Math.random(),p[g]=.07+Math.random()*.1,f[g]=.12+Math.pow(Math.random(),1.8)*.5,a[g]=2+Math.random()*5;const u=new kt;return u.setAttribute("position",new te(d,3)),u.setAttribute("aAngle",new te(m,1)),u.setAttribute("aPhase",new te(x,1)),u.setAttribute("aRate",new te(p,1)),u.setAttribute("aRadius",new te(f,1)),u.setAttribute("aSize",new te(a,1)),u.boundingSphere=new Xt(new M(e.x,-60,e.z),e.r+140),u},[o,e]),l=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new zn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new M(...ne(X.underGlow))},uGain:{value:0}}),[e]);return oe((h,d)=>{const m=n.current?.uniforms;if(!m)return;m.uTime.value+=d;const x=Math.hypot(i.position.x-e.x,i.position.z-e.z),p=1-T.smoothstep(x,e.r*1.2,e.r*4);m.uGain.value=v.underwater*p,s.current&&(s.current.visible=m.uGain.value>.015)}),t.jsx("points",{ref:s,geometry:r,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Ci,fragmentShader:Fi,uniforms:l,transparent:!0,depthWrite:!1,blending:mt,fog:!1})})}function Di({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Ii,{quality:e}),Fe.map((o,n)=>t.jsx(Oi,{whirl:o,quality:e},n)),Fe.map((o,n)=>t.jsx(Pi,{whirl:o,quality:e},`w${n}`))]})}const Lo=16/9,ha=96,da=78;function mn(e,o,n=ha){if(!o||o>=Lo)return e;const s=T.degToRad(e)/2,i=2*Math.atan(Math.tan(s)*Lo/o);return Math.min(n,T.radToDeg(i))}function ua(e){return!e||e>=Lo?1:T.clamp(.72+.28*(e/Lo),.86,1)}function fn(e,o,n,s=.06,i=ha){const r=mn(o,e.aspect,i);Math.abs(e.fov-r)<=.05||(e.fov+=(r-e.fov)*(1-Math.pow(s,n)),e.updateProjectionMatrix())}function xn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*T.clamp(1280/o,.55,2.2)}const pa="oni.settings.v1";function Ni(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const be={comfort:0,lookSens:1,invertY:!1,freeCam:!1},gn=new Set;function ma(){for(const e of gn)e(be)}function fa(e){return gn.add(e),()=>gn.delete(e)}function Fn(e,o){e in be&&(be[e]=o,Bi(),ma())}function Po(e){Fn(e,!be[e])}function Hi(){Fn("comfort",be.comfort<.01?.55:be.comfort<.9?1:0)}function _i(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=be.lookSens-1e-6);Fn("lookSens",e[(o+1)%e.length])}function Bi(){try{localStorage.setItem(pa,JSON.stringify(be))}catch{}}function Ui(){let e=null;try{e=JSON.parse(localStorage.getItem(pa)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(be))typeof e[o]==typeof be[o]&&(be[o]=e[o]);else be.comfort=Ni()?1:0;return ma(),be}const Ee=(e,o)=>e+(o-e)*be.comfort,Jt=e=>e<-1?-1:e>1?1:e,C={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},bt={level:0},wn=new Set;function Wi(e){return wn.add(e),()=>wn.delete(e)}function Gn(e){if(bt.level===e)return e;bt.level=e;for(const o of wn)o(e);return e}function xa(){return Gn((bt.level+1)%3)}const J={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},ro=new Set,tt=(...e)=>e.some(o=>ro.has(o));function ga(){C.throttle=0,C.rudder=0,C.planes=0,C.boost=!1,C.walk.x=0,C.walk.z=0,C.surfaceQueued=!1,C.periscopeQueued=!1,C.burstQueued=!1,C.recentreQueued=!1,C.zoom=0,C.pistolQueued=!1,C.bazookaQueued=!1,C.gigantQueued=!1,C.rocketQueued=!1,C.hakiQueued=!1,C.gear2Queued=!1,C.gatlingHeld=!1,C.balloonHeld=!1,J.gatling=!1,J.balloon=!1,Gn(0),J.throttle=0,J.rudder=0,J.planes=0,J.boost=!1,J.walk.x=0,J.walk.z=0,ro.clear()}function Vi(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),o=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const r=i.key.toLowerCase();ro.add(r),r==="f"&&(C.surfaceQueued=!0),r==="p"&&(C.periscopeQueued=!0),r==="b"&&!i.repeat&&(C.burstQueued=!0),r==="r"&&!i.repeat&&(C.recentreQueued=!0),r==="v"&&!i.repeat&&Po("freeCam"),r==="x"&&!i.repeat&&xa(),r==="j"&&!i.repeat&&(C.pistolQueued=!0),r==="k"&&!i.repeat&&(C.bazookaQueued=!0),r==="l"&&!i.repeat&&(C.gigantQueued=!0),r==="g"&&!i.repeat&&(C.rocketQueued=!0),r==="h"&&!i.repeat&&(C.hakiQueued=!0),r==="n"&&!i.repeat&&(C.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(r)&&i.preventDefault()},n=i=>ro.delete(i.key.toLowerCase()),s=()=>ga();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",s),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",s),ro.clear()}}function Yi(){const e=tt("w","arrowup")?1:0,o=tt("s","arrowdown")?1:0,n=tt("a","arrowleft")?1:0,s=tt("d","arrowright")?1:0,i=tt("q"," ")?1:0,r=tt("e","c")?1:0,l=Jt(e-o+J.throttle);l<-.05&&bt.level&&Gn(0),C.throttle=bt.level>0?Math.max(l,1):l,C.rudder=Jt(n-s+J.rudder),C.planes=Jt(i-r+J.planes),C.boost=tt("shift")||J.boost||bt.level===2,C.zoom=(tt("]","=","+")?1:0)-(tt("[","-","_")?1:0),C.gatlingHeld=tt("u")||J.gatling,C.balloonHeld=tt("i")||J.balloon,C.walk.x=Jt(s-n+J.walk.x),C.walk.z=Jt(e-o+J.walk.z)}const yn=[0,(Me[0].y+Me[1].y)/2,Me[0].z],wa=[he.x,he.y,he.z],Oo=$.dir,ya=[$.x+Oo[0]*300,-36,$.z+Oo[1]*300],ba=[$.x+Oo[0]*46,34,$.z+Oo[1]*46],va=[$.gate.x,4,$.gate.z],Ma=[$.gate.x,22,$.gate.z],$i=1.55,bn=W/$i,Ki=1+(bn-1)*.35,ut=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:yn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:ya,to:ba,lookFrom:va,lookTo:Ma,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:wa,lookTo:yn,swell:0}],Xi=new Set([yn,wa,ya,ba,va,Ma]),yo=e=>Xi.has(e)?e:[e[0]*bn,e[1]*Ki,e[2]*bn];for(const e of ut)e.from=yo(e.from),e.to=yo(e.to),e.lookFrom=yo(e.lookFrom),e.lookTo=yo(e.lookTo);const vn=ut.reduce((e,o)=>e+o.dur,0),ys=ut,Zi=e=>e*e*(3-2*e),Qi=e=>1-Math.pow(1-e,2.2),bo=e=>new M(e[0],e[1],e[2]),St={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function qi(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,s=new Map;let i=0,r=null;const l=(p,f)=>{const a=v.orbit,u=a.dist*.0016,g=Math.cos(a.yaw),b=-Math.sin(a.yaw);a.target.x-=g*p*u,a.target.z-=b*p*u;const y=Math.cos(a.pitch),k=Math.sin(a.pitch);a.target.y+=f*u*y,a.target.x+=Math.sin(a.yaw)*f*u*k,a.target.z+=Math.cos(a.yaw)*f*u*k,ja()},h=p=>{s.set(p.pointerId,{x:p.clientX,y:p.clientY});try{n.setPointerCapture?.(p.pointerId)}catch{}if(s.size===2){const[f,a]=[...s.values()];i=Math.hypot(f.x-a.x,f.y-a.y),r={x:(f.x+a.x)/2,y:(f.y+a.y)/2}}},d=p=>{const f=s.get(p.pointerId);if(!f)return;const a=p.clientX-f.x,u=p.clientY-f.y;if(f.x=p.clientX,f.y=p.clientY,s.size>=2){const[g,b]=[...s.values()],y=Math.hypot(g.x-b.x,g.y-b.y),k={x:(g.x+b.x)/2,y:(g.y+b.y)/2};if(i>8&&y>8){const S=v.orbit;S.dist=T.clamp(S.dist*(i/y),...St.dist)}r&&l(k.x-r.x,k.y-r.y),i=y,r=k,p.cancelable&&p.preventDefault();return}if(p.shiftKey||p.buttons===4)l(a,u);else{const g=v.orbit;g.yaw-=a*.005*xn(),g.pitch=T.clamp(g.pitch+u*.004*xn(),...St.pitch)}p.cancelable&&p.preventDefault()},m=p=>{s.delete(p.pointerId)&&s.size<2&&(i=0,r=null)},x=p=>{p.preventDefault();const f=v.orbit;f.dist=T.clamp(f.dist*(1+Math.sign(p.deltaY)*.11),...St.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",d,{passive:!1}),n.addEventListener("pointerup",m),n.addEventListener("pointercancel",m),window.addEventListener("pointerup",m),n.addEventListener("wheel",x,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",d),n.removeEventListener("pointerup",m),n.removeEventListener("pointercancel",m),window.removeEventListener("pointerup",m),n.removeEventListener("wheel",x),s.clear()}},[e,o])}function ja(){const e=v.orbit;e.target.x=T.clamp(e.target.x,-4200,St.xz),e.target.z=T.clamp(e.target.z,-4200,St.xz),e.target.y=T.clamp(e.target.y,...St.y)}function Ji({onRails:e,playing:o,speed:n=1,onShot:s,idle:i=!1}){const r=Se(x=>x.camera),l=Se(x=>x.gl),h=w.useRef(0),d=w.useRef(-1),m=w.useRef(new M(0,150,-260));return qi(!e&&!i,l),w.useEffect(()=>{if(e)return;const x=v.orbit,p=r.position.clone().sub(x.target);x.dist=T.clamp(p.length(),...St.dist),x.yaw=Math.atan2(p.x,p.z),x.pitch=Math.asin(T.clamp(p.y/(p.length()||1),-1,1))},[e,r]),oe((x,p)=>{if(i)return;const f=Math.min(p,.05);if(v.t+=f,e){if(v.jumpTo!=null){let I=0;for(let E=0;E<v.jumpTo&&E<ut.length;E++)I+=ut[E].dur;h.current=I,v.jumpTo=null}o&&(h.current=(h.current+f*n)%vn);let y=0,k=0;for(;k<ut.length&&!(h.current<y+ut[k].dur);k++)y+=ut[k].dur;const S=ut[Math.min(k,ut.length-1)],c=T.clamp((h.current-y)/S.dur,0,1);d.current!==k&&(d.current=k,v.shot=k,s?.(k,S));const j=bo(S.from).lerp(bo(S.to),Qi(c)),F=bo(S.lookFrom).lerp(bo(S.lookTo),Zi(c)),A=S.swell??0;if(A>0){const I=v.t;j.y+=Math.sin(I*.62)*3.1*A+Math.sin(I*1.31+1.2)*1.2*A,j.x+=Math.sin(I*.44+.6)*2.2*A}j.x+=Math.sin(v.t*.83)*.35,j.y+=Math.sin(v.t*1.17+2)*.28,r.position.copy(j),m.current.lerp(F,1-Math.pow(1e-4,f)),r.lookAt(m.current),A>0&&r.rotateZ(Math.sin(v.t*.51)*.024*A);const z=mn(S.fov,r.aspect);Math.abs(r.fov-z)>.01&&(r.fov+=(z-r.fov)*(1-Math.pow(.02,f)),r.updateProjectionMatrix()),v.progress=h.current/vn}else{const y=v.orbit;C.recentreQueued&&(C.recentreQueued=!1,y.target.set(O.x,O.baseY*.55,O.z),y.dist=T.clamp(y.dist,260,1400));const k=C.walk.x,S=C.walk.z;if(k||S||C.planes||C.zoom){const F=y.dist*(C.boost?1.9:.7)*f,A=-Math.sin(y.yaw),z=-Math.cos(y.yaw);y.target.x+=(A*S-z*k)*F,y.target.z+=(z*S+A*k)*F,y.target.y+=C.planes*F,y.dist=T.clamp(y.dist*(1-C.zoom*.9*f),...St.dist),ja()}const c=Math.cos(y.pitch);r.position.set(y.target.x+Math.sin(y.yaw)*c*y.dist,y.target.y+Math.sin(y.pitch)*y.dist,y.target.z+Math.cos(y.yaw)*c*y.dist),r.lookAt(y.target);const j=mn(55,r.aspect);Math.abs(r.fov-j)>.01&&(r.fov+=(j-r.fov)*(1-Math.pow(.02,f)),r.updateProjectionMatrix()),v.t+=0}const a=co(r.position.x,r.position.z);v.shelter+=(a-v.shelter)*(1-Math.pow(.06,f)),v.fog=T.lerp(zt.sea,zt.bay,v.shelter),v.rain=1-v.shelter*.92;const u=rt(r.position.x,r.position.z,v.t,1),g=T.clamp((u.y-r.position.y-1)/3,0,1);v.underwater+=(g-v.underwater)*(1-Math.pow(.002,f)),v.depthBelow=Math.max(0,u.y-r.position.y);const b=T.lerp(8200,1700,v.underwater);Math.abs(r.far-b)>20&&(r.far=b,r.updateProjectionMatrix()),x.camera.updateMatrixWorld()}),null}const bs={low:[24,16],mid:[40,26],high:[56,36]};function el({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),i=w.useMemo(()=>{const[f,a]=bs[e]??bs.high,u=new Ha(1,f,a),g=u.attributes.position,b=new Float32Array(g.count*3),[y,k,S]=Ce.centre,[c,j,F]=Ce.radii,A=new xe("#241c22"),z=new xe(R.rockWarm),I=new xe;for(let E=0;E<g.count;E++){const D=g.getX(E),L=g.getY(E),B=g.getZ(E),q=1+(Ut(D*2.4+5,B*2.4-9,3)-.5)*.14;g.setXYZ(E,y+D*c*q,k+L*j*q,S+B*F*q);const Q=T.clamp((L+.2)/1.2,0,1);I.copy(A).lerp(z,(1-Q)*.55),b[E*3]=I.r,b[E*3+1]=I.g,b[E*3+2]=I.b}return u.setAttribute("color",new te(b,3)),u.computeVertexNormals(),u},[e]),{stairM:r,brazierM:l,bayM:h,tableM:d,jarM:m,westStairM:x}=w.useMemo(()=>{const f=new Qe,a=new lt,u=new M(1,1,1),g=new M,b=[];for(let G=0;G<at.steps;G++){const Y=G/(at.steps-1);g.set(0,T.lerp(je.y,ae.y+2,Y),T.lerp(at.zTop,at.zBottom,Y)),a.identity(),b.push(f.clone().compose(g,a,u))}const y=[],k=e==="low"?5:9;for(const G of[-1,1])for(let Y=0;Y<k;Y++){const re=Y/(k-1);g.set(G*176,ae.y+9,T.lerp(ae.zFront-40,ae.zBack+40,re)),a.identity(),y.push(f.clone().compose(g,a,u))}for(let G=0;G<6;G++)g.set(-110+G*44,ae.y+9,_.z+_.halfZ+54),a.identity(),y.push(f.clone().compose(g,a,u));const S=[],c=e==="low"?5:9;for(const G of[-1,1])for(let Y=0;Y<ue.tiers;Y++)for(let re=0;re<c;re++){const K=re/(c-1);g.set(G*(ue.x-Y*26),ue.y+Y*ue.tierRise,T.lerp(-205,ue.halfZ,K)),a.identity(),S.push(f.clone().compose(g,a,u))}const j=[],F=[],A=new lt,z=new M(0,1,0);let I=24301;const E=()=>(I=Math.imul(I,1664525)+1013904223>>>0,I/4294967296),D=e==="low"?1:2,L=e==="low"?5:8;for(const G of[-1,1])for(let Y=0;Y<D;Y++)for(let re=0;re<L;re++){const K=G*(96+Y*52+(E()-.5)*14),ie=T.lerp(ae.zBack+120,ae.zFront-60,re/(L-1))+(E()-.5)*16;if(!(Math.abs(K)<ge.halfX+24&&Math.abs(ie-ge.z)<ge.halfZ+20)&&!(Math.abs(Math.abs(K)-de.x)<26&&ie<de.zFoot+16&&ie>de.zTop-8)){g.set(K,ae.y+2.4,ie),A.setFromAxisAngle(z,(E()-.5)*.5),j.push(f.clone().compose(g,A,u));for(let ze=0;ze<2;ze++)g.set(K+(E()-.5)*30,ae.y+3.5,ie+(E()>.5?8:-8)+(E()-.5)*6),A.setFromAxisAngle(z,E()*Math.PI),F.push(f.clone().compose(g,A,u))}}const B=[],q=16,Q=G=>G*G*(3-2*G);for(let G=0;G<=q;G++){const Y=G/q;g.set(-252,Q(Y)*(ue.y-.5)-1.3,T.lerp(45,-45,Y)),a.identity(),B.push(f.clone().compose(g,a,u))}return{stairM:b,brazierM:y,bayM:S,tableM:j,jarM:F,westStairM:B}},[e]);oe(()=>{const f=v.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(f*4.1)*.3+Math.sin(f*9.3)*.15),s.current&&(s.current.material.emissiveIntensity=.85+Math.sin(f*.9)*.12)});const p=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:sn,receiveShadow:p,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:sn,roughness:.97,metalness:.02})}),[[0,(ae.zFront+ge.z+ge.halfZ)/2,ae.halfX*2,ae.zFront-ge.z-ge.halfZ],[0,(ae.zBack+ge.z-ge.halfZ)/2,ae.halfX*2,ge.z-ge.halfZ-ae.zBack],[-342/2-20,ge.z,ae.halfX*2-ge.halfX*2,ge.halfZ*2],[(ge.halfX+ae.halfX)/2+20,ge.z,ae.halfX*2-ge.halfX*2,ge.halfZ*2]].map(([f,a,u,g],b)=>t.jsxs("mesh",{position:[f,ae.y-3,a],receiveShadow:p,children:[t.jsx("boxGeometry",{args:[Math.abs(u),6,Math.abs(g)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),t.jsxs("mesh",{ref:s,position:[ge.x,Ne.ceiling+2,ge.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[ge.halfX*2,ge.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:Ae})]}),t.jsxs("mesh",{position:[0,je.y-4,je.z],receiveShadow:p,castShadow:p,children:[t.jsx("boxGeometry",{args:[je.halfX*2.6,8,je.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,r.length],receiveShadow:p,children:[t.jsx("boxGeometry",{args:[at.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(tl,{matrices:r})]}),[-1,1].map(f=>Array.from({length:ue.tiers},(a,u)=>t.jsxs("mesh",{position:[f*(ue.x-u*26),ue.y+u*ue.tierRise-4,0],receiveShadow:p,castShadow:p,children:[t.jsx("boxGeometry",{args:[76-u*6,7,ue.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:R.timber,roughness:.92})]},`${f}-${u}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:R.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(al,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(ol,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,m.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(nl,{matrices:m})]}),t.jsxs("instancedMesh",{args:[null,null,x.length],castShadow:p,receiveShadow:p,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(sl,{matrices:x})]}),t.jsxs("instancedMesh",{args:[null,null,l.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(rl,{matrices:l})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,l.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:R.furnace,emissive:R.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(il,{matrices:l})]}),t.jsxs("mesh",{position:[0,Ne.y-4,0],receiveShadow:p,children:[t.jsx("boxGeometry",{args:[Ne.halfX*2,8,Ne.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(f=>[-1,0,1].map(a=>t.jsxs("mesh",{position:[f*120,(Ne.y+ae.y)/2,a*96],castShadow:p,children:[t.jsx("boxGeometry",{args:[26,Math.abs(ae.y-Ne.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${f}-${a}`)))]})}function tl({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function ol({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function nl({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function sl({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function al({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function rl({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o})}function il({matrices:e}){const o=w.useRef();return t.jsx(At,{matrices:e,selfRef:o,offsetY:9})}function At({matrices:e,offsetY:o=0}){const n=w.useRef(),s=w.useRef(!1);return oe(()=>{if(s.current)return;const i=n.current?.parent;if(!i?.isInstancedMesh)return;const r=new Qe,l=new Qe().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,i.count);h++)r.copy(e[h]).multiply(l),i.setMatrixAt(h,r);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:n})}const vs=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),i=s.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),s.fillStyle=i,s.fillRect(0,0,e,o),s.globalAlpha=.14,s.fillStyle="#fff3c4";for(let l=0;l<12;l++){const h=l/12*Math.PI*2;s.save(),s.translate(e/2,o*.62),s.rotate(h),s.fillRect(-3,0,6,e),s.restore()}s.globalAlpha=.22,s.fillStyle="#5e1610";for(let l=8;l<e;l+=22)s.fillRect(l,0,3,o);s.globalAlpha=1;const r=new $t(n);return r.colorSpace=Kt,r})();function ll(e,o,n,s){const i=e+s,r=o+s,l=new Float32Array([-i,0,r,i,0,r,e*.18,n,o*.18,-i,0,r,e*.18,n,o*.18,-e*.18,n,o*.18,i,0,r,i,0,-r,e*.18,n,-o*.18,i,0,r,e*.18,n,-o*.18,e*.18,n,o*.18,i,0,-r,-i,0,-r,-e*.18,n,-o*.18,i,0,-r,-e*.18,n,-o*.18,e*.18,n,-o*.18,-i,0,-r,-i,0,r,-e*.18,n,o*.18,-i,0,-r,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new kt;return h.setAttribute("position",new te(l,3)),h.computeVertexNormals(),h}function cl({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),i=Ze("keep-hf.opt.glb"),r=w.useMemo(()=>{const h=[];for(let d=0;d<_.storeys;d++){const m=1-(d+1)*_.taper,x=_.plinth+d*_.storey;h.push({i:d,y:x,halfX:_.halfX*m,halfZ:_.halfZ*m,roof:ll(_.halfX*m,_.halfZ*m,d===_.storeys-1?30:16,11)})}return h},[]);oe(()=>{const h=v.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),s.current&&(s.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const l=o;return t.jsxs("group",{position:[0,_.baseY,_.z],children:[t.jsxs("mesh",{position:[0,_.plinth/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[_.halfX*2.2,_.plinth,_.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(pe,{name:"keep-hf.opt.glb",height:_.plinth+_.storeys*_.storey+26,position:[0,_.plinth*.5,0],tint:"#9a8468",emissive:R.emberDeep,emissiveIntensity:.14}),!i&&r.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,_.storey/2,0],castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2,_.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,_.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,_.storey*.38]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,_.storey*.02,h.halfZ+8],castShadow:l,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,_.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,_.storey,0],castShadow:l,receiveShadow:l,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,_.plinth+_.storeys*_.storey+30,0],rotation:[0,0,h*.4],castShadow:l,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,ye.y,ye.z-_.z],children:[t.jsxs("mesh",{castShadow:l,receiveShadow:l,children:[t.jsx("boxGeometry",{args:[ye.halfX*2,7,ye.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[ye.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:R.furnace,emissive:"#ffffff",emissiveMap:vs,map:vs,emissiveIntensity:2.2,toneMapped:!1,side:Ae})]}),t.jsx(pe,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:l,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:l,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(pe,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:R.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*ye.halfX*.9,28,ye.depth/2-4],castShadow:l,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:l,children:[t.jsx("boxGeometry",{args:[ye.halfX*2.3,5,ye.depth+22]}),t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(pe,{name:"oni-daiko.opt.glb",height:26,position:[h*(ye.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:l,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(hl,{})]})]})}function hl(){const e=w.useRef(),o=w.useRef(!1);return oe(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const s=new Qe,i=new M,r=new lt,l=new M(1,1,1);for(let h=0;h<n.count;h++){const d=h/(n.count-1)*2-1;i.set(d*(_.halfX+26),ye.y+74-(1-d*d)*20,_.halfZ+22),n.setMatrixAt(h,s.compose(i,r,l))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function dl({shadows:e=!0}){const{slabs:o,flights:n,tower:s}=ta,i=w.useMemo(()=>{const r=[],l=h=>h*h*(3-2*h);for(const h of n)for(let m=0;m<=9;m++){const x=m/9;r.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*l(x)-1.2,T.lerp(h.z0,h.z1,x)])}return r},[n]);return t.jsxs("group",{children:[[s.x[0]+1,s.x[1]-1].map(r=>[s.z[0]+1,s.z[1]-1].map(l=>t.jsxs("mesh",{position:[r,128,l],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${r}${l}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(ul,{points:i})]}),o.map(([r,l,h,d,m],x)=>t.jsxs("mesh",{position:[r,l-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(m)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},x)),o.map(([r,l,h,d,m],x)=>t.jsxs("mesh",{position:[r,l+5,h+Math.abs(m)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.8})]},`r${x}`))]})}function ul({points:e}){const o=w.useRef(),n=w.useRef(!1);return oe(()=>{if(n.current)return;const s=o.current?.parent;if(!s?.isInstancedMesh)return;const i=new Qe,r=new lt,l=new M(1,1,1),h=new M;for(let d=0;d<Math.min(e.length,s.count);d++)h.set(e[d][0],e[d][1],e[d][2]),s.setMatrixAt(d,i.compose(h,r,l));s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function pl({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],i=r=>r*r*(3-2*r);for(const r of[-1,1])for(let l=0;l<=20;l++){const h=l/20;n.push({x:r*de.x,y:i(h)*jt,z:T.lerp(de.zFoot,de.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,s)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[de.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.75})]},s)),[-1,1].map(n=>{const s=r=>r*r*(3-2*r),i=r=>{const l=[];for(let h=0;h<=16;h++){const d=h/16;l.push(new M(n*de.x+r,s(d)*jt+7,T.lerp(de.zFoot,de.zTop,d)))}return new Yt(new Vt(l),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(de.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.8})})]},n)})]})}function ml({shadows:e=!0}){const o=w.useMemo(()=>po.map(([,,n,s])=>{const i=[];for(let r=0;r<=12;r++){const l=r/12*2-1;i.push(new M(l*n*.5,s*(1-l*l),0))}return new Yt(new Vt(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[po.map(([n,s],i)=>t.jsxs("group",{position:[0,n,s],children:[t.jsx("mesh",{geometry:o[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:R.vermilion,roughness:.74})}),[-7,7].map(r=>t.jsx("mesh",{geometry:o[i],position:[0,7,r],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:R.vermilionDeep,roughness:.8})},r))]},i)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,po[0][0]-12,po[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,ae.y,0]})]})}function Sa(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function fl({quality:e,shadows:o}){const n=w.useMemo(()=>{const i=Sa(712273),r=[],l=e==="low"?14:e==="mid"?26:40;let h=0;for(;r.length<l&&h<l*40;){h++;const d=(i()*2-1)*(ae.halfX-30),m=T.lerp(ae.zBack+40,ae.zFront-30,i());Math.abs(d)<62&&m>_.z+120||Math.abs(d)<70&&Math.abs(m-84)<58||Math.abs(Math.abs(d)-de.x)<24&&m<de.zFoot+18&&m>de.zTop-10||r.push({x:d,z:m,kind:r.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return r},[e]),s=o;return t.jsx(t.Fragment,{children:n.map((i,r)=>{const l=[i.x,ae.y,i.z];return i.kind===0?t.jsx(pe,{name:"sake-tower.opt.glb",height:22*i.k,position:l,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:l,children:[0,1,2].map(h=>t.jsxs("mesh",{position:[0,4+h*7,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[6-h,6-h,7,10]}),t.jsx("meshStandardMaterial",{color:h%2?"#c9a86a":"#8e6a3c",roughness:.92})]},h))})},r):i.kind===1?t.jsx(pe,{name:"oni-guardian.opt.glb",height:30*i.k,position:l,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*4,28,0],rotation:[0,0,h*.5],castShadow:s,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},h))]})},r):i.kind===2?t.jsx(pe,{name:"wisteria-trellis.opt.glb",height:34*i.k,position:l,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:l,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(h=>t.jsxs("mesh",{position:[h,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},h))]})},r):t.jsxs("group",{position:l,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:r%2?R.vermilion:"#e8dcc4",roughness:.95,side:Ae,emissive:r%2?R.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},r)})})}function xl({shadows:e}){const o=w.useMemo(()=>{const n=Sa(10560325),s=[];for(let i=0;i<14;i++)s.push({x:(n()*2-1)*(Ne.halfX-40),z:(n()*2-1)*(Ne.halfZ-40),rot:n()*Math.PI*2,keg:i%2===0});return s},[]);return t.jsx(t.Fragment,{children:o.map((n,s)=>n.keg?t.jsx(pe,{name:"powder-keg.opt.glb",height:13,position:[n.x,Ne.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Ne.y+6,n.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},s):t.jsx(pe,{name:"war-cannon.opt.glb",height:12,position:[n.x,Ne.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Ne.y+5,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},s))})}function gl(){const e=Se(o=>o.camera);return oe((o,n)=>{const s=Math.min(n,.05),i=(e.position.x-me.x-Ce.centre[0])/Ce.radii[0],r=(e.position.y-me.y-Ce.centre[1])/Ce.radii[1],l=(e.position.z-me.z-Ce.centre[2])/Ce.radii[2],h=Math.sqrt(i*i+r*r+l*l),d=T.clamp(1-(h-1)/.5,0,1);v.inside+=(d-v.inside)*(1-Math.pow(.02,s))}),null}function wl({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[me.x,me.y,me.z],children:[t.jsx(gl,{}),t.jsx(el,{quality:e,shadows:o}),t.jsx(cl,{quality:e,shadows:o}),t.jsx(ml,{shadows:o}),t.jsx(pl,{shadows:o}),t.jsx(dl,{shadows:o}),t.jsx(fl,{quality:e,shadows:o}),t.jsx(xl,{shadows:o}),[-1,1].map(n=>t.jsx(pe,{name:"banquet-table.opt.glb",height:9,position:[n*92,ae.y,_.z+210],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}`)),t.jsx(pe,{name:"treasure-kura.opt.glb",height:64,position:[ue.x-74,ae.y,_.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[ue.x-74,ae.y,_.z+96],rotation:[0,-.7,0],children:[[-1,1].map(n=>[-1,1].map(s=>t.jsxs("mesh",{position:[n*12,5,s*9],castShadow:o,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${n}${s}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([n,s,i],r)=>t.jsx(pe,{name:"bomb-sphere.opt.glb",height:22,position:[n,Ne.y,s],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Ne.y+10,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${r}`)),[-1,1].map(n=>t.jsx(pe,{name:"keep-tier.opt.glb",height:96,position:[n*(ue.x-40),ue.y+ue.tiers*ue.tierRise-6,_.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(pe,{name:"arch-bridge.opt.glb",height:26,position:[n*74,ae.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(pe,{name:"oni-guardian.opt.glb",height:54,position:[n*(je.halfX+26),je.y,je.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(je.halfX+26),je.y,je.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,ye.y+30,ye.z-_.z+_.z+40],color:R.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,ue.y+120,60],color:R.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Ne.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,je.y+46,je.z-40],color:R.lantern,intensity:26e3,distance:620,decay:2})]})}const yl=Math.PI/2-.14,Ms=1.5;function za({enabled:e,dom:o,zoomMin:n=.34,zoomMax:s=2.6,zoom0:i=1,pitch0:r=.16,pitchMin:l=-.62,pitchMax:h=yl}){const d=w.useRef({yaw:0,pitch:r,zoom:i,smYaw:0,smPitch:r,smZoom:i,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:l,pitchMax:h,zoomMin:n,zoomMax:s,pitch0:r}).current;return w.useEffect(()=>{if(!e||!o)return;const m=o,x=new Map;let p=0,f=0,a=null;const u=()=>x.size,g=S=>{x.set(S.pointerId,{x:S.clientX,y:S.clientY});try{m.setPointerCapture?.(S.pointerId)}catch{}if(u()===1)d.dragging=!0,a={x:S.clientX,y:S.clientY,t:S.timeStamp};else if(u()===2){d.dragging=!1;const[c,j]=[...x.values()];p=Math.hypot(c.x-j.x,c.y-j.y),a=null}},b=S=>{const c=x.get(S.pointerId);if(!c)return;const j=S.clientX-c.x,F=S.clientY-c.y;if(c.x=S.clientX,c.y=S.clientY,u()>=2){const[z,I]=[...x.values()],E=Math.hypot(z.x-I.x,z.y-I.y);p>8&&E>8&&(d.zoom=T.clamp(d.zoom*(p/E),d.zoomMin,d.zoomMax),d.since=0),p=E;return}if(!d.dragging)return;a&&Math.hypot(S.clientX-a.x,S.clientY-a.y)>14&&(a=null);const A=xn()*be.lookSens;d.yaw-=j*.005*A,d.pitch=T.clamp(d.pitch+F*.004*A*(be.invertY?-1:1),d.pitchMin,d.pitchMax),d.since=0,S.cancelable&&S.preventDefault()},y=S=>{x.has(S.pointerId)&&(x.delete(S.pointerId),u()<2&&(p=0),u()===0&&(d.dragging=!1,a&&S.timeStamp-a.t<260&&(S.timeStamp-f<340?(d.recentre=!0,f=0):f=S.timeStamp),a=null))},k=S=>{S.preventDefault(),d.zoom=T.clamp(d.zoom*(1+Math.sign(S.deltaY)*.1),d.zoomMin,d.zoomMax),d.since=0};return m.addEventListener("pointerdown",g),m.addEventListener("pointermove",b,{passive:!1}),m.addEventListener("pointerup",y),m.addEventListener("pointercancel",y),window.addEventListener("pointerup",y),m.addEventListener("wheel",k,{passive:!1}),()=>{m.removeEventListener("pointerdown",g),m.removeEventListener("pointermove",b),m.removeEventListener("pointerup",y),m.removeEventListener("pointercancel",y),window.removeEventListener("pointerup",y),m.removeEventListener("wheel",k),x.clear(),d.dragging=!1}},[e,o,d]),d}function Mn(e,o,n=0){if(e.since+=o,C.zoom&&(e.zoom=T.clamp(e.zoom*(1-C.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,C.recentreQueued&&(C.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=Ms+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!be.freeCam&&!e.noRecentre&&!e.dragging&&e.since>Ms){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(Ee(.22,.48),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const s=e.dragging?6e-4:Ee(.002,.02),i=1-Math.pow(s,o);let r=e.yaw-e.smYaw;for(;r>Math.PI;)r-=Math.PI*2;for(;r<-Math.PI;)r+=Math.PI*2;e.smYaw+=r*i,e.smPitch+=(e.pitch-e.smPitch)*i,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const js=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeUrl:io("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeUrl:io("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],bl=e=>js.find(o=>o.id===e)??js[0],vl=.22,Ss=13,Ml=.09,jl=.34,zs=9,Sl=1.1,zl=.55,ks=12,kl=6,Tl=70,El=.55,Qo=26,Rl=8,Al=5,Ts=.8,Il=12,Cl=.3,Fl=.13,Es=3.4,Gl=32,Rs=.65,Ll=1.1,Pl=.5,Ol=6,As=6,Ie=new M,ot=new M,eo=new M;function Dl(e,o,n,s,i,r,l,h){let m=0;for(let x=1;x<=16;x++){const p=x/16*l,f=e+s*p,a=o+i*p,u=n+r*p,g=h??se(f,u);if(a<=g){let b=m,y=p;for(let k=0;k<6;k++){const S=(b+y)/2,c=o+i*S,j=h??se(e+s*S,n+r*S);c<=j?y=S:b=S}return y}m=p}return null}function Nl(e,o,n,s){const i=Math.min(e,.05),r=Oe.combat,l=we.move,h=r.style==="sword";s.x=0,s.y=0,s.z=0,Ie.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),Oe.lookYaw=Math.atan2(Ie.x,Ie.z),Oe.playerFacing=o.yaw,r.bazookaCd=Math.max(0,r.bazookaCd-i),r.gigantCd=Math.max(0,r.gigantCd-i),r.hakiCd=Math.max(0,r.hakiCd-i),r.gear2Cd=Math.max(0,r.gear2Cd-i),n.gear2Queued&&(n.gear2Queued=!1,!r.gear2&&r.gear2Cd<=0&&!h&&(r.gear2=!0,r.gear2T=Rl,Ft(.25),ot.set(o.x,o.y+1,o.z),Mt(ot,1.6,"haki"))),r.gear2&&(r.gear2T=Math.max(0,r.gear2T-i),r.gear2T<=0&&(r.gear2=!1,r.gear2Cd=Al));const d=r.gear2;r.balloon=T.damp(r.balloon,n.balloonHeld&&!h?1:0,8,i);const m=o.y+o.height*.9,x=Dl(o.x,m,o.z,Ie.x,Ie.y,Ie.z,Tl,o.floorY);Oe.aim.valid=x!=null,x!=null&&(Oe.aim.distance=x,Oe.aim.point.set(o.x,m,o.z).addScaledVector(Ie,x));const p=!l.kind;if(n.rocketQueued&&(n.rocketQueued=!1,p&&x!=null&&(a(h?"flash":"rocket",El),l.target.copy(Oe.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,p&&(a(h?"onigiri":"pistol",h?Cl:vl),l.target.set(o.x,m,o.z).addScaledVector(Ie,h?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,p&&r.bazookaCd<=0))if(h){const u=Oe.waves.find(g=>!g.active);u&&(u.active=!0,u.k=0,u.pos.set(o.x,m*.92,o.z),u.dir.set(Ie.x,Ie.y*.35,Ie.z).normalize(),r.bazookaCd=Ll,a("wavecast",.22),l.hit=!0,l.target.copy(u.pos).addScaledVector(u.dir,8),Ft(.1))}else a("bazooka",jl),l.target.set(o.x,m,o.z).addScaledVector(Ie,x!=null?Math.min(x,zs):zs),r.bazookaCd=Sl;n.gigantQueued&&(n.gigantQueued=!1,p&&r.gigantCd<=0&&(a(h?"sanzen":"gigant",h?Pl:zl),l.target.set(o.x,m,o.z).addScaledVector(Ie,x!=null?Math.min(x+1.5,ks):ks),r.gigantCd=h?Ol:kl));for(const u of Oe.waves){if(!u.active)continue;const g=u.k;u.k=Math.min(1,u.k+i/Rs),u.pos.addScaledVector(u.dir,Gl/Rs*i);for(const y of[.35,.68,1])g<y&&u.k>=y&&Mt(u.pos,1.6,"slash");const b=o.floorY==null?se(u.pos.x,u.pos.z):o.floorY;(u.k>=1||u.pos.y<b+.4)&&(u.k<1&&Mt(u.pos,1.6,"slash"),u.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,r.hakiCd<=0&&we.hakiT<=0&&(we.hakiT=Ts,we.hakiFired=!1,r.hakiCd=Il)),we.hakiT>0){we.hakiT=Math.max(0,we.hakiT-i);const u=1-we.hakiT/Ts;if(r.haki=u,!we.hakiFired&&u>.35&&(we.hakiFired=!0,ot.set(o.x,o.y,o.z),Mt(ot,3,"haki"),Ft(.9),h))for(let g=0;g<8;g++){const b=g/8*Math.PI*2;ot.set(o.x+Math.cos(b)*As,o.y+.6,o.z+Math.sin(b)*As),Mt(ot,1.4,"slash")}}else r.haki=0;const f=n.gatlingHeld&&!l.kind;if(r.gatling=T.damp(r.gatling,f?1:0,14,i),r.gatling>.2&&Oe.gatlingAim.copy(Ie),f){if(we.gatT-=i,we.gatT<=0)if(h)we.gatT=Fl,we.tatsu+=1.9,ot.set(o.x+Math.cos(we.tatsu)*Es,o.y+.6,o.z+Math.sin(we.tatsu)*Es),Mt(ot,.7,"slash"),Ft(.04);else{we.gatT=Ml*(d?.6:1);const u=x!=null?Math.min(x,Ss):Ss*.85;ot.set(o.x,m,o.z).addScaledVector(Ie,u),Mt(ot,.8,"punch"),Ft(.05)}}else we.gatT=0;if(l.kind){l.t+=i;const u=Math.min(1,l.t/l.dur);if(!l.hit&&u>.45){l.hit=!0;const g=l.kind==="gigant"||l.kind==="sanzen"?3:1.3;if(Mt(l.target,g,h?"slash":"punch"),Ft(l.kind==="gigant"||l.kind==="sanzen"?.7:.18),l.kind==="rocket"||l.kind==="flash"){eo.copy(l.target).sub(ot.set(o.x,o.y,o.z));const b=eo.length()||1;s.x=eo.x/b*Qo,s.y=Math.max(0,eo.y/b*Qo*.5),s.z=eo.z/b*Qo}else(l.kind==="pistol"||l.kind==="onigiri")&&(s.x=Ie.x*6,s.z=Ie.z*6)}l.t>=l.dur&&(l.kind=null,l.t=0),r.move=l.kind,r.moveK=l.kind?Math.min(1,l.t/l.dur):0}else r.move=null,r.moveK=0;return Oe.shake=Math.max(0,Oe.shake-i*2.4),s;function a(u,g){l.kind=u,l.t=0,l.dur=g,l.hit=!1}}const we={move:{kind:null,t:0,dur:0,hit:!1,target:new M},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function Hl(e="rubber"){const o=Oe.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,we.move.kind=null,we.move.t=0,we.hakiT=0,we.gatT=0,Oe.shake=0;for(const n of Oe.waves)n.active=!1}const qo=64,_l=19,Is=16,Bl=.92,Cs=.52,Ul=.3,Wl=.04,Vl=.0016,Yl=.055,$l=1.9,Kl=16,Xl=62,Zl=9,Fs={x:-.45,z:-2.4},Gs=.075,vo=new M,Ls=new M;function Dt(e,o){return T.clamp(-se(e,o)/26,0,1)}const Mo={x:60*W,z:1050*W},Ql=7,Ps=15,nt=1.85;function ql({mode:e,onMode:o,crew:n="luffy"}){const s=Se(F=>F.camera),i=Se(F=>F.gl),r=w.useRef(),l=w.useRef(),h=w.useRef({speed:0,grounded:!0,maxSpeed:15}),d=w.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,m=w.useRef({x:0,y:0,z:0}).current,x=bl(n),p=w.useRef(),f=w.useRef(),a=w.useRef(),u=Ze("ship-sunny.opt.glb"),g=Ze("ship-lion.opt.glb"),b=u||g,y=u?"ship-sunny.opt.glb":g?"ship-lion.opt.glb":null,k=y?No(y,34):30,S=Ze("crew-straw.opt.glb"),c=w.useRef({x:Mo.x,z:Mo.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,stride:0,area:"hall",snapCam:!0,boarded:!1}).current,j=za({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.34,zoomMax:3.4,pitch0:.16,pitchMin:-.62,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return c.x=Mo.x,c.z=Mo.z,c.heading=Math.PI,c.speed=0,c.vx=0,c.vz=0,c.throttle=0,c.flank=0,c.deckY=0,c.snapCam=!0,j.yaw=0,j.smYaw=0,j.pitch=.16,j.smPitch=.16,j.pitch0=.16,j.zoom=1,j.smZoom=1,j.noRecentre=!1,j.pitchMin=-.62,j.pitchMax=1.44,c.swallowed=0,c.burst=1,c.burstFx=0,c.slam=0,c.drift=0,c.trim=0,c.bowY=rt(c.x,c.z,v.t,1).y,v.helm=null,pn("helm"),()=>{v.helmActive=!1}},[e,c,j]),w.useEffect(()=>{if(e!=="foot")return;c.fvx=0,c.fvz=0,c.snapCam=!0,U.chain!=="foot"&&pn("foot"),Hl(x.weapon==="swords"?"sword":"rubber");const F=(z,I)=>{j.yaw=z,j.smYaw=z,j.pitch=I,j.smPitch=I,j.pitch0=0,j.noRecentre=!0,j.pitchMin=-1.28,j.pitchMax=1.28},A=v.footSpawn;if(v.footSpawn="hall",A==="port"){c.area="island",c.fx=Z.x+40*W,c.fz=Z.z+40*W,c.fy=se(c.fx,c.fz)+nt,c.fyaw=Math.atan2(he.x-c.fx,he.z-c.fz),F(c.fyaw+Math.PI,-.06);return}if(A==="rear"){c.area="island",c.fx=$.gate.x+$.dir[0]*26,c.fz=$.gate.z+$.dir[1]*26,c.fy=se(c.fx,c.fz)+nt,c.fyaw=Math.atan2(-$.dir[0],-$.dir[1]),F(c.fyaw+Math.PI,.02);return}c.area="hall",c.fx=me.x,c.fy=me.y+je.y,c.fz=me.z+at.zTop,c.fyaw=Math.PI,c.fpitch=-.05,F(0,.05)},[e,c,j]),oe((F,A)=>{if(e!=="helm"&&e!=="foot")return;const z=Math.min(A,.05);if(v.t+=z,e==="helm"){const I=c.heading;c.throttle+=(C.throttle-c.throttle)*(1-Math.pow(.02,z)),c.rudder+=(C.rudder-c.rudder)*(1-Math.pow(.005,z)),c.flank+=((C.boost?1:0)-c.flank)*(1-Math.pow(Wl,z));const E=qo*(1+Ul*c.flank),D=Math.sin(c.heading),L=Math.cos(c.heading),B=Math.cos(c.heading),q=-Math.sin(c.heading);let Q=c.vx*D+c.vz*L,G=c.vx*B+c.vz*q;const Y=1-v.shelter,re=c.throttle>=0?c.throttle*E:c.throttle*_l;Q+=T.clamp(re-Q,-Is*2.5,Is)*z,c.burst=Math.min(1,c.burst+z/Zl),C.burstQueued&&(C.burstQueued=!1,c.burst>=.999&&(c.burst=0,c.burstFx=1,Q+=Xl,v.splash+=1)),c.burstFx*=Math.pow(.2,z);const K=rt(c.x,c.z,v.t,1);Q-=(K.dx*D+K.dz*L)*Kl*Y*z,Q-=Q*Math.abs(Q)*Vl*z,G-=(G*Math.abs(G)*Yl+G*$l)*z;const ie=T.clamp(Math.abs(Q)/16,0,1);Q*=Math.pow(1-.11*Math.abs(c.rudder)*ie,z),c.vx=D*Q+B*G,c.vz=L*Q+q*G,c.speed=Q,c.drift+=(T.clamp(Math.abs(G)/11,0,1)-c.drift)*(1-Math.pow(.1,z)),c.heading+=c.rudder*Bl*ie*Math.sign(Q||1)*z;const ze=c.x+c.vx*z,ct=c.z+c.vz*z,Le=k*Cs,He=ze+D*Le,We=ct+L*Le;if(Dt(He,We)>.06)c.x=ze,c.z=ct,c.aground+=(0-c.aground)*(1-Math.pow(.05,z));else{c.aground+=(1-c.aground)*(1-Math.pow(.02,z)),Bt(Math.abs(c.speed)*.0012*z*60,"AGROUND — SHE IS TAKING WATER");const Te=Math.pow(.06,z);c.speed*=Te,c.vx*=Te,c.vz*=Te;const ht=6,_n=Dt(c.x+ht,c.z)-Dt(c.x-ht,c.z),Bn=Dt(c.x,c.z+ht)-Dt(c.x,c.z-ht),Un=Math.hypot(_n,Bn)||1;c.x+=_n/Un*26*z,c.z+=Bn/Un*26*z}const H=Qs(c.x,c.z,0);c.x+=H.vx*z,c.z+=H.vz*z,c.x+=Fs.x*Y*z,c.z+=Fs.z*Y*z;const ke=K.dx*B+K.dz*q;c.heading+=T.clamp(ke*.4,-Gs,Gs)*Y*z;let Pe=Fe[0],qe=1/0;for(const Te of Fe){const ht=(c.x-Te.x)**2+(c.z-Te.z)**2;ht<qe&&(qe=ht,Pe=Te)}if(ca(z,{danger:H.danger,headingX:Math.sin(c.heading),headingZ:Math.cos(c.heading),toCentreX:Pe.x-c.x,toCentreZ:Pe.z-c.z,speed:c.speed,throttle:c.throttle})>=1||H.danger>.94){const Te=Pe;c.x=Te.x+(Te.x>0?Te.r*1.85:-Te.r*1.85),c.z=Te.z+Te.r*1.5,c.speed=0,c.vx=0,c.vz=0,c.throttle=0,c.heading=Math.PI,c.swallowed+=1,c.aground=1,U.grip=0,Bt(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),v.splash+=1}const ve=co(c.x,c.z),P=T.lerp(1,.055,ve)*T.smoothstep(Dt(c.x,c.z),0,.3),ee=rt(c.x,c.z,v.t,P);v.helmActive=!0,v.helmPos.set(c.x,ee.y+k*.35,c.z),v.helmSpeed=T.clamp(Math.abs(c.speed)/qo,0,1);const Re=H.vx*Math.cos(c.heading)-H.vz*Math.sin(c.heading),ce=T.clamp(Math.abs(c.speed)/qo,0,1),Ve=T.clamp(c.rudder*ie*ce*.4+Re*.016,-.5,.5);c.heel+=(Ve-G*.012-c.heel)*(1-Math.pow(.15,z));const _e=k*Cs,Ye=rt(c.x+D*_e,c.z+L*_e,v.t,P).y,Ge=T.clamp((c.bowY-Ye)/Math.max(z,.001),0,60);c.bowY=Ye;const et=T.clamp((Ge-10)/24,0,1)*ce*Y;if(c.slam=Math.max(c.slam*Math.pow(.05,z),et),et>.25){const Te=Math.pow(1-.3*et,z);c.vx*=Te,c.vz*=Te}const uo=ce*.1*Math.sign(c.speed>=0?1:-1)+c.slam*.14+c.burstFx*.16;c.trim+=(uo-c.trim)*(1-Math.pow(.1,z));const $e=T.clamp(ce*Y*1.15+c.aground*.5+H.danger*.8+c.slam*1.3+c.burstFx,0,1);c.spray+=($e-c.spray)*(1-Math.pow(.08,z));const Ke=r.current;Ke&&(Ke.position.set(c.x,ee.y,c.z),Ke.rotation.set(T.clamp(ee.dz*1.2,-.3,.3)-c.trim,c.heading,T.clamp(-ee.dx,-.26,.26)+c.heel)),p.current&&(p.current.scale.z=1+Math.sin(v.t*1.6)*.08+c.burstFx*.4,p.current.scale.x=1+Y*.06+c.burstFx*.12),f.current&&(f.current.material.opacity=c.spray*.42,f.current.scale.setScalar(.7+c.spray*.55)),a.current&&(a.current.material.opacity=T.clamp(.34*ce+c.burstFx*.3,0,.62)*(.28+Y*.72),a.current.scale.set(1+ce*.75+c.drift*.6,1,1+ce*.5)),Mn(j,z,c.heading-I);const Be=c.heading+Math.PI+j.smYaw,Zt=Math.cos(j.smPitch),It=Math.max(k*3,76)*j.smZoom*(1+ce*Ee(.26,.1)+c.burstFx*Ee(.34,.12))*ua(s.aspect);c.deckY+=(ee.y-c.deckY)*(1-Math.pow(Ee(2e-4,.05),z));const On=T.lerp(ee.y,c.deckY,be.comfort),Ct=vo.set(c.x+Math.sin(Be)*Zt*It,On+k*.5+Math.sin(j.smPitch)*It,c.z+Math.cos(Be)*Zt*It),Ea=rt(Ct.x,Ct.z,v.t,P);Ct.y=Math.max(Ct.y,Ea.y+6),c.snapCam?(c.snapCam=!1,s.position.copy(Ct)):s.position.lerp(Ct,1-Math.pow(Ee(6e-4,.02),z));const Ra=Math.max(0,Math.cos(j.smYaw)),Dn=ce*Ee(66,34)*Ra;s.lookAt(Ls.set(c.x+(D+B*T.clamp(G/40,-.4,.4))*Dn,On+12-c.trim*26*ce*Ee(1,.35),c.z+(L+q*T.clamp(G/40,-.4,.4))*Dn));const Nn=Ee(1,0);Nn>.001&&s.rotateZ((Math.sin(v.t*2.3)*.012*ce+c.heel*.3+c.aground*Math.sin(v.t*21)*.02+c.slam*Math.sin(v.t*34)*.03+H.danger*Math.sin(v.t*2.7)*.03)*Nn),fn(s,60+ce*Ee(7,2)+c.burstFx*Ee(10,3),z,.06,da);const Hn=Math.hypot(c.x-(Z.x+60*W),c.z-(Z.z+60*W));Hn<90*W&&Math.abs(c.speed)<24&&(v.footSpawn="port",o?.("foot")),v.helm={speed:c.speed,heading:c.heading,throttle:c.throttle,aground:c.aground,x:c.x,z:c.z,toGate:Math.min(Math.hypot(c.x,c.z-Rt),Math.hypot(c.x,c.z-lo)),underFire:[Rt,lo].some(Te=>{const ht=Math.hypot(c.x,c.z-Te);return ht>Ao.safe&&ht<Ao.range}),moored:Hn<180*W,maelstrom:H.danger,swallowed:c.swallowed,burst:c.burst,drift:c.drift,maxSpeed:E,cruise:bt.level,flank:c.flank,freeCam:be.freeCam},la(z,v.helm),v.shelter+=(ve-v.shelter)*(1-Math.pow(.06,z)),v.underwater+=(0-v.underwater)*(1-Math.pow(.02,z))}else{Mn(j,z,0);const I=C.boost?Ps:Ql;c.fpitch+=(-j.smPitch-c.fpitch)*(1-Math.pow(1e-4,z));const E=C.walk.x,D=C.walk.z,L=Math.hypot(E,D),B=L>1?L:1,q=-Math.sin(j.smYaw),Q=-Math.cos(j.smYaw),G=-Q,Y=q,re=(q*(D/B)+G*(E/B))*I,K=(Q*(D/B)+Y*(E/B))*I,ie=1-Math.pow(L>.02?2e-5:4e-7,z);c.fvx+=(re-c.fvx)*ie,c.fvz+=(K-c.fvz)*ie;const ze=c.fvx*z,ct=c.fvz*z;if(c.area==="island"){const ve=c.fx+ze,P=c.fz+ct,ee=se(c.fx,c.fz),Re=se(ve,P),ce=Math.hypot(ze,ct)||1e-6,Ve=(Re-ee)/ce;(Re<=.3||Ve>=1.2&&Re>=ee)&&(c.fvx=0,c.fvz=0),Re>.3&&(Ve<1.2||Re<ee)&&(c.fx=ve,c.fz=P);const _e=se(c.fx,c.fz);c.fy+=(_e+nt-c.fy)*(1-Math.pow(.002,z));const Ye=Math.hypot(c.fx-he.x,c.fz-he.z),Ge=Math.hypot(c.fx-$.gate.x,c.fz-$.gate.z);Ye<80?(c.area="hall",c.fx=me.x,c.fz=me.z+at.zTop,c.fy=me.y+je.y+nt,c.fyaw=Math.PI,j.yaw=j.smYaw=0,j.pitch=j.smPitch=.05):Ge<40&&(c.area="hall",c.fx=me.x+60,c.fz=me.z+_.z+150,c.fy=me.y+nt,c.fyaw=0,j.yaw=j.smYaw=Math.PI,j.pitch=j.smPitch=.04),v.helm={onFoot:!0,area:"island",x:c.fx,z:c.fz,fy:c.fy-me.y,toMouth:Ye,toRear:Ge,nearPort:Math.hypot(c.fx-Z.x,c.fz-Z.z)<Z.r*1.4};const et=co(c.fx,c.fz);v.shelter+=(et-v.shelter)*(1-Math.pow(.06,z))}else{c.fx+=ze,c.fz+=ct;const ve=c.fx-me.x,P=c.fz-me.z;let ee=P>je.z-70?je.y:P>at.zBottom?T.lerp(0,je.y,(P-at.zBottom)/(at.zTop-at.zBottom)):0;ee=Math.max(ee,Sr(ve,P)),c.fy+=(me.y+ee+nt-c.fy)*(1-Math.pow(.005,z)),P>je.z+34&&(c.area="island",c.fx=he.x,c.fz=he.z+130,c.fy=se(c.fx,c.fz)+nt,c.fyaw=0,j.yaw=j.smYaw=Math.PI,j.pitch=j.smPitch=-.04),v.helm={onFoot:!0,area:"hall",x:c.fx,z:c.fz,lz:P,fy:c.fy-me.y},v.shelter+=(1-v.shelter)*(1-Math.pow(.06,z))}const Le=Math.hypot(c.fvx,c.fvz);c.stride+=Le*z;const He=x.height??1.74;if(Le>.4){let P=Math.atan2(c.fvx,c.fvz)-c.fyaw;for(;P>Math.PI;)P-=Math.PI*2;for(;P<-Math.PI;)P+=Math.PI*2;c.fyaw+=P*(1-Math.pow(4e-4,z))}c.fpitch+=(-j.smPitch-c.fpitch)*(1-Math.pow(1e-4,z)),c.pace=Le,h.current.speed=Le,h.current.maxSpeed=Ps,h.current.grounded=!0,d.x=c.fx,d.y=c.fy-nt,d.z=c.fz,d.yaw=j.smYaw+Math.PI,d.pitch=j.smPitch,d.height=He,d.floorY=c.area==="hall"?c.fy-nt:null,Nl(z,d,C,m),(m.x||m.z)&&(c.fvx+=m.x,c.fvz+=m.z);const We=He*4.2*j.smZoom,vt=Math.cos(j.smPitch),H=c.fy+Math.sin(c.stride*1.6)*.05*Ee(1,.3),ke=c.fx+Math.sin(j.smYaw)*vt*We,Pe=c.fz+Math.cos(j.smYaw)*vt*We;let qe=H+He*.55+Math.sin(j.smPitch)*We;const ft=c.area==="island"?se(ke,Pe):c.fy-nt;qe=Math.max(qe,ft+He*.6),vo.set(ke,qe,Pe),c.snapCam?(c.snapCam=!1,s.position.copy(vo)):s.position.lerp(vo,1-Math.pow(Ee(9e-4,.02),z)),s.lookAt(Ls.set(c.fx,H+He*.15,c.fz)),fn(s,72,z,.02),l.current&&(l.current.position.set(c.fx,c.fy-nt,c.fz),l.current.rotation.y=c.fyaw),v.underwater+=(0-v.underwater)*(1-Math.pow(.02,z))}v.fog=T.lerp(zt.sea,zt.bay,v.shelter),v.rain=1-v.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:l,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(Ba,{character:x,motion:h})}),t.jsxs("group",{ref:r,position:[0,-4e3,0],visible:e==="helm",children:[b&&t.jsx(pe,{name:y,loa:k,slim:Ho(y),sink:.062,rotation:Do(y),tint:u?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),b&&S&&t.jsx(pe,{name:"crew-straw.opt.glb",height:Cn,rotation:0,position:[0,k*.1,k*.12]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!b,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!b,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!b,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!b,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!b,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!b,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:p,position:[0,17.5,1.5],visible:!b,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:Ae,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!b,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(F=>t.jsxs("mesh",{position:[F*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:R.lantern,emissive:R.lantern,emissiveIntensity:3.4,toneMapped:!1})]},F)),t.jsx(ho,{crew:"straw",width:b?k*.24:14,position:[0,b?k*.78:26,-k*.06]}),t.jsxs("mesh",{ref:a,position:[0,.6,-k*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[k*.6,k*2.2]}),t.jsx("meshBasicMaterial",{map:cn,color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:f,position:[0,k*.12,k*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[k*.85,k*.6]}),t.jsx("meshBasicMaterial",{map:Xr,color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:mt})]})]})]})}const Os=76,Jl=24,Ds=26,ec=1.15,tc=.44,oc=.05,nc=.22,sc=70,jo=340,Ns=7,ac=6,Hs=60,So=185,rc=new M,_s=new M,zo={x:430*W,z:1e3*W};function ic({mode:e,onMode:o}){const n=Se(g=>g.camera),s=Se(g=>g.gl),i=w.useRef(),r=w.useRef(),l=w.useRef(),h=Ze("ship-tang.opt.glb"),d=Ze("ship-sub.opt.glb"),m=h||d,x=Ze("crew-heart.opt.glb"),p=h?"ship-tang.opt.glb":"ship-sub.opt.glb",f=No(p,28),a=w.useRef({x:zo.x,z:zo.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,u=za({enabled:e==="sub",dom:s.domElement,zoomMin:.42,zoomMax:2.3,pitch0:.22,pitchMin:-1,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return a.x=zo.x,a.z=zo.z,a.heading=Math.PI,a.speed=0,a.throttle=0,a.flank=0,a.depth=4,a.orderedDepth=4,a.berthing=0,a.snapCam=!0,u.yaw=0,u.smYaw=0,u.pitch=.22,u.smPitch=.22,u.pitch0=.22,u.zoom=1,u.smZoom=1,u.noRecentre=!1,a.heel=0,v.subActive=!0,v.helm=null,pn("sub"),()=>{v.subActive=!1,v.subThrottle=0}},[e,a,u]),oe((g,b)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const y=Math.min(b,.05);v.t+=y;const k=a.heading,S=C.boost;a.throttle+=(C.throttle-a.throttle)*(1-Math.pow(.02,y)),a.flank+=((S?1:0)-a.flank)*(1-Math.pow(oc,y)),v.subThrottle=Math.abs(a.throttle),a.rudder+=(C.rudder-a.rudder)*(1-Math.pow(8e-4,y));const c=T.clamp(a.depth/15,0,1),j=Os*(.7+.3*c)*(1+tc*a.flank),F=a.throttle>=0?a.throttle*j:a.throttle*Jl;a.speed+=T.clamp(F-a.speed,-Ds*2,Ds)*y,a.speed-=a.speed*Math.abs(a.speed)*.0016*y;const A=T.lerp(nc,1,T.clamp(Math.abs(a.speed)/7,0,1));a.heading+=a.rudder*ec*A*Math.sign(a.speed>=0?1:-1)*y,a.orderedDepth-=C.planes*sc*y,a.orderedDepth=T.clamp(a.orderedDepth,0,jo),C.surfaceQueued&&(C.surfaceQueued=!1,a.orderedDepth=0),C.periscopeQueued&&(C.periscopeQueued=!1,a.orderedDepth=ac);const z=a.x+Math.sin(a.heading)*a.speed*y,I=a.z+Math.cos(a.heading)*a.speed*y,E=Qs(z,I,a.depth);a.x=z+E.vx*y,a.z=I+E.vz*y;const D=E.vx*Math.cos(a.heading)-E.vz*Math.sin(a.heading);a.heading+=D*.008*y;const L=T.clamp(Math.abs(a.speed)/Os,0,1),B=T.clamp(D*.02+a.rudder*A*L*.34,-.6,.6);a.heel+=(B-a.heel)*(1-Math.pow(.12,y)),E.danger>.05&&(a.speed*=Math.pow(1-.22*E.danger,y));const q=se(a.x,a.z),Q=Math.max(2,-q-Ns),G=a.depth<1.5;a.depth+=(a.orderedDepth-a.depth)*(1-Math.pow(.12,y)),a.depth>Q?(a.scrape+=(1-a.scrape)*(1-Math.pow(.02,y)),a.depth=Q,a.orderedDepth=Math.min(a.orderedDepth,Q-2),Bt(Math.abs(a.speed)*.0016*y*60,"GROUNDED ON THE SHELF"),a.speed*=Math.pow(.3,y)):a.scrape+=(0-a.scrape)*(1-Math.pow(.05,y));const Y=(a.depth-So)/(jo-So);a.stress=Y>0?Math.min(1,Y*Y):0,a.stress>0&&Bt(a.stress*.06*y,"HULL UNDER PRESSURE — COME UP");const re=a.x+Math.sin(a.heading)*26,K=a.z+Math.cos(a.heading)*26;if(se(re,K)>-a.depth+Ns*.5){a.speed*=Math.pow(.1,y);const Ke=6,Be=se(a.x+Ke,a.z)-se(a.x-Ke,a.z),Zt=se(a.x,a.z+Ke)-se(a.x,a.z-Ke),It=Math.hypot(Be,Zt)||1;a.x-=Be/It*20*y,a.z-=Zt/It*20*y,a.scrape=Math.max(a.scrape,.5)}const ze=Math.hypot(a.x-$.x,a.z-$.z);if(ze<$.pool*1.1&&a.berthing===0&&(a.berthing=1e-4),a.berthing>0){a.berthing=Math.min(1,a.berthing+y*.5),a.x+=($.berth.x-a.x)*(1-Math.pow(.1,y)),a.z+=($.berth.z-a.z)*(1-Math.pow(.1,y)),a.orderedDepth=0,a.speed*=Math.pow(.1,y);let Be=Math.atan2($.dir[0],$.dir[1])+Math.PI-a.heading;for(;Be>Math.PI;)Be-=Math.PI*2;for(;Be<-Math.PI;)Be+=Math.PI*2;a.heading+=Be*(1-Math.pow(.2,y)),a.berthing>=1&&a.depth<1.2&&(v.footSpawn="rear",v.splash+=1,o?.("foot"))}a.depth<1.5!==G&&(v.splash+=1);const Le=rt(a.x,a.z,v.t,1),He=1-T.clamp(a.depth/10,0,1),We=-a.depth+Le.y*He,vt=T.clamp((a.orderedDepth-a.depth)*.05,-.34,.34)*Math.sign(a.speed>=0?1:-1)+Le.dz*.8*He;a.pitch+=(vt-a.pitch)*(1-Math.pow(.05,y));const H=i.current;H&&(H.position.set(a.x,We,a.z),H.rotation.set(a.pitch+a.scrape*Math.sin(v.t*23)*.02,a.heading,-Le.dx*.5*He+a.heel)),r.current&&(r.current.rotation.z+=a.throttle*9*y),l.current&&(l.current.visible=a.depth<2.5),v.subPos.set(a.x,We,a.z),Mn(u,y,a.heading-k);const ke=a.heading+Math.PI+u.smYaw,Pe=Math.cos(u.smPitch),qe=T.clamp(a.depth/240,0,1),ft=Math.max(f*4.5,88)*u.smZoom*(1-qe*.2)*ua(n.aspect),ve=rc.set(a.x+Math.sin(ke)*Pe*ft,We+10+Math.sin(u.smPitch)*ft,a.z+Math.cos(ke)*Pe*ft),P=se(ve.x,ve.z);ve.y=Math.max(ve.y,P+5),a.depth>10&&(ve.y=Math.min(ve.y,Le.y-3)),a.snapCam?(a.snapCam=!1,n.position.copy(ve)):n.position.lerp(ve,1-Math.pow(Ee(8e-4,.02),y));const ee=Math.max(0,Math.cos(u.smYaw)),Re=L*Ee(46,26)*ee;_s.set(a.x+Math.sin(a.heading)*Re,We+6-a.pitch*30*L*Ee(1,.35),a.z+Math.cos(a.heading)*Re),n.lookAt(_s);const ce=Ee(1,0);ce>.001&&n.rotateZ((a.scrape*Math.sin(v.t*19)*.015+a.heel*.35+E.danger*Math.sin(v.t*3.1)*.02)*ce),fn(n,64+L*Ee(6,2)+a.flank*Ee(2,.6),y,.06,da);const Ve=rt(n.position.x,n.position.z,v.t,1),_e=T.clamp((Ve.y-n.position.y-1)/3,0,1);v.underwater+=(_e-v.underwater)*(1-Math.pow(.002,y)),v.depthBelow=Math.max(0,Ve.y-n.position.y);const Ye=T.lerp(8200,1700,v.underwater);Math.abs(n.far-Ye)>20&&(n.far=Ye,n.updateProjectionMatrix()),v.shelter+=((ze<$.pool*3?.85:0)-v.shelter)*(1-Math.pow(.06,y));let Ge=Fe[0],et=1/0;for(const Ke of Fe){const Be=(a.x-Ke.x)**2+(a.z-Ke.z)**2;Be<et&&(et=Be,Ge=Ke)}ca(y,{danger:E.danger,headingX:Math.sin(a.heading),headingZ:Math.cos(a.heading),toCentreX:Ge.x-a.x,toCentreZ:Ge.z-a.z,speed:a.speed,throttle:a.throttle})>=1&&(Bt(.22,"CAUGHT IN THE VORTEX"),a.x=Ge.x+(a.x>Ge.x?1:-1)*Ge.r*1.9,a.z=Ge.z+Ge.r*1.5,a.speed=0,a.orderedDepth=Math.min(jo,a.depth+18),U.grip=0,v.splash+=1);let $e=Math.atan2($.x-a.x,$.z-a.z)-a.heading;for(;$e>Math.PI;)$e-=Math.PI*2;for(;$e<-Math.PI;)$e+=Math.PI*2;v.helm={sub:!0,speed:a.speed,maxSpeed:j,heading:a.heading,depth:a.depth,orderedDepth:a.orderedDepth,scrape:a.scrape,stress:a.stress,maelstrom:E.danger,toRear:ze,relRear:$e,berthing:a.berthing>0,x:a.x,z:a.z,maxDepth:jo,crushDepth:So,cruise:bt.level,flank:a.flank,freeCam:be.freeCam,dark:T.clamp((a.depth-Hs)/(So-Hs),0,1)},la(y,v.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[m&&t.jsx(pe,{name:p,loa:f,slim:Ho(p),sink:.14,rotation:Do(p),tint:h?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:l,position:[0,f*.15,-f*.07],children:[x&&t.jsx(pe,{name:"crew-heart.opt.glb",height:Cn,rotation:0}),t.jsx(ho,{crew:"heart",width:f*.26,position:[0,f*.2,-f*.2]})]}),t.jsxs("group",{visible:!m,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(g=>[0,1,2,3].map(b=>t.jsxs("mesh",{position:[g*5.1,1.2,8-b*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${g}-${b}`)))]}),t.jsxs("mesh",{position:[0,f*.02,f*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,f*.02,f*.6],scale:[f*.9,f*.9,1],children:t.jsx("spriteMaterial",{map:lc,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:mt})}),t.jsxs("mesh",{position:[0,f*.24,-f*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:r,position:[0,f*.012,-f*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(dc,{})]})}const lc=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,0.9)"),s.addColorStop(.4,"rgba(255,255,255,0.28)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e);const i=new $t(o);return i.colorSpace=Kt,i})(),cc=`
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
`,hc=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function dc(){const e=w.useRef(),o=w.useMemo(()=>{const i=new Float32Array(780),r=new Float32Array(260),l=new Float32Array(260),h=new Float32Array(260);for(let m=0;m<260;m++)i[m*3]=(Math.random()-.5)*3.4,i[m*3+1]=(Math.random()-.5)*2.6,i[m*3+2]=-14-Math.random()*4,r[m]=Math.random(),l[m]=.25+Math.random()*.3,h[m]=2+Math.random()*4;const d=new kt;return d.setAttribute("position",new te(i,3)),d.setAttribute("aPhase",new te(r,1)),d.setAttribute("aRate",new te(l,1)),d.setAttribute("aSize",new te(h,1)),d.boundingSphere=new Xt(new M(0,0,-30),70),d},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new M(...ne(X.underGlow))}}),[]);return oe((s,i)=>{const r=e.current?.uniforms;if(!r)return;r.uTime.value+=i;const l=v.subActive?v.subThrottle*v.underwater:0;r.uGain.value+=(l-r.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:cc,fragmentShader:hc,uniforms:n,transparent:!0,depthWrite:!1,blending:mt,fog:!1})})}const ka=.42;let N=null,wt=null,fe=null,jn=!1,pt=!0;function uc(){try{const e=localStorage.getItem("oni.audio");e!==null&&(pt=e==="1")}catch{}return pt}function Jo(e){pt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return wt&&N&&wt.gain.setTargetAtTime(e?ka:0,N.currentTime,.12),e&&N?.state==="suspended"&&N.resume(),pt}function pc(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),s=n.getChannelData(0);for(let i=0;i<o;i++)s[i]=Math.random()*2-1;return n}function to(e,o,n,s,i,r,l){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const d=e.createBiquadFilter();d.type=n,d.frequency.value=s,d.Q.value=i;const m=e.createGain();return m.gain.value=r,h.connect(d).connect(m).connect(l),h.start(),{src:h,filt:d,gain:m}}function en(){if(jn){N?.state==="suspended"&&N.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;N=new e,jn=!0,wt=N.createGain(),wt.gain.value=pt?ka:0;const o=N.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=N.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,wt.connect(n).connect(o).connect(N.destination);const s=pc(N),i=N.createGain();i.gain.value=1,i.connect(wt);const r=to(N,s,"bandpass",480,.7,.3,i),l=to(N,s,"highpass",1900,.5,0,i),h=to(N,s,"lowpass",220,1.1,.22,i),d=to(N,s,"lowpass",96,1.6,0,i),m=N.createGain();m.gain.value=1,m.connect(o);const x=N.createOscillator();x.type="sawtooth",x.frequency.value=41;const p=N.createBiquadFilter();p.type="lowpass",p.frequency.value=190,p.Q.value=1.2;const f=N.createGain();f.gain.value=0,x.connect(p).connect(f).connect(m),x.start();const a=N.createOscillator(),u=N.createOscillator(),g=N.createGain();a.frequency.value=.07,u.frequency.value=.113,g.gain.value=260,a.connect(g),u.connect(g),g.connect(r.filt.frequency),a.start(),u.start();const b=N.createGain();b.gain.value=0,b.connect(wt);const y=N.createGain();y.gain.value=.16,y.connect(b);for(const[S,c]of[[146.83,1],[220,.5],[293.66,.3]]){const j=N.createOscillator();j.type="sine",j.frequency.value=S;const F=N.createGain();F.gain.value=c;const A=N.createOscillator(),z=N.createGain();A.frequency.value=.21+Math.random()*.1,z.gain.value=S*.004,A.connect(z).connect(j.frequency),A.start(),j.connect(F).connect(y),j.start()}const k=to(N,s,"bandpass",900,3.2,.05,b);return fe={stormBus:i,festBus:b,wind:r,rain:l,sea:h,roar:d,breath:k,buf:s,comp:o,muffle:n,humGain:f,subBus:m},N}function mc(){if(!N||!fe||!pt)return;const e=N.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const s=N.createOscillator(),i=N.createGain();s.type="sine",s.frequency.setValueAtTime(1420,e+o),s.frequency.exponentialRampToValueAtTime(1180,e+o+.5),i.gain.setValueAtTime(0,e+o),i.gain.linearRampToValueAtTime(n,e+o+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),s.connect(i).connect(fe.subBus),s.start(e+o),s.stop(e+o+1.5)}}function fc(e=1){if(!N||!fe||!pt)return;const o=N.currentTime,n=N.createBufferSource();n.buffer=fe.buf;const s=N.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(1500,o),s.frequency.exponentialRampToValueAtTime(240,o+.5),s.Q.value=.7;const i=N.createGain();i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(.5*e,o+.02),i.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(s).connect(i).connect(wt),n.start(o),n.stop(o+.9)}function Nt(e,o=1,n=82){if(!N||!fe)return;const s=N.createOscillator(),i=N.createGain();s.type="sine",s.frequency.setValueAtTime(n*2.1,e),s.frequency.exponentialRampToValueAtTime(n,e+.06),s.frequency.exponentialRampToValueAtTime(n*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(o,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),s.connect(i).connect(fe.festBus),s.start(e),s.stop(e+.7);const r=N.createBufferSource();r.buffer=fe.buf;const l=N.createBiquadFilter();l.type="bandpass",l.frequency.value=1400,l.Q.value=.8;const h=N.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),r.connect(l).connect(h).connect(fe.festBus),r.start(e),r.stop(e+.12)}function xc(e=1,o=0){if(!N||!fe||!pt)return;const n=N.currentTime+o,s=N.createBufferSource();s.buffer=fe.buf,s.loop=!0;const i=N.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,n),i.frequency.exponentialRampToValueAtTime(70,n+2.6),i.Q.value=.9;const r=N.createGain(),l=.5*e;r.gain.setValueAtTime(0,n),r.gain.linearRampToValueAtTime(l,n+.05),r.gain.exponentialRampToValueAtTime(l*.24,n+.7),r.gain.exponentialRampToValueAtTime(l*.42,n+1.35),r.gain.exponentialRampToValueAtTime(1e-4,n+3.4),s.connect(i).connect(r).connect(fe.stormBus),s.start(n),s.stop(n+3.6);const h=N.createOscillator(),d=N.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),d.gain.setValueAtTime(0,n),d.gain.linearRampToValueAtTime(.32*e,n+.08),d.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(d).connect(fe.stormBus),h.start(n),h.stop(n+2.8)}function gc(e=.5){if(!N||!fe||!pt)return;const o=N.currentTime;for(const[n,s,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const r=N.createOscillator(),l=N.createGain();r.type="sine",r.frequency.value=61*n,l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(e*s,o+.008),l.gain.exponentialRampToValueAtTime(1e-4,o+i),r.connect(l).connect(wt),r.start(o),r.stop(o+i+.1)}}let st=0,tn=0,Bs=0,oo=0;function wc(e){if(!jn||!N||!fe||!pt)return;const o=N.currentTime,n=e.shelter,s=e.underwater,i=e.subActive?.12:1,r=Math.sin(n*Math.PI*.5)*i*(1-s*.92);fe.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),fe.festBus.gain.setTargetAtTime(r,o,.35),fe.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),fe.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),fe.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),fe.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-s*.55),o,.3),fe.muffle.frequency.setTargetAtTime(18e3-s*17400,o,.18);const l=e.subActive?s*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(fe.humGain.gain.setTargetAtTime(l,o,.25),e.splash!==Bs&&(Bs=e.splash,fc(1)),e.subActive&&s>.5?oo===0?oo=o+1.2:o>=oo&&(mc(),oo=o+6.5):oo=0,n>.06){const d=.9090909090909091;for(st<o&&(st=o+.1);st<o+.35;){const m=tn%8,x=n*.9;m===0?Nt(st,.85*x,74):m===2?Nt(st,.45*x,88):m===4?Nt(st,.7*x,74):m===6?Nt(st,.4*x,92):m===7&&(Nt(st,.3*x,96),Nt(st+d*.5,.36*x,96)),tn++,st+=d}}else st=0,tn=0}function yc(){const e=w.useRef(!1),o=w.useRef(-1);return oe(()=>{if(wc(v),v.flash>.55&&!e.current){e.current=!0;const n=v.flashDir,s=500+Math.abs(n.z)*900;xc(Math.min(1,.55+v.flash*.6),s/340)}else v.flash<.08&&(e.current=!1);v.shot!==o.current&&(v.shot===4&&o.current>=0&&gc(.55),o.current=v.shot)}),null}function bc({mode:e}){return v.mode=e,oe(()=>Yi(),-100),null}function vc({every:e=12}){const o=Se(s=>s.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),oe(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function Mc({budget:e}){const o=Se(s=>s.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(Ca,{bounds:s=>s>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function jc(){const e=Se(s=>s.gl),o=Se(s=>s.scene),n=Se(s=>s.camera);return w.useEffect(()=>{const s=setTimeout(()=>{try{e.compile(o,n)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(s)},[e,o,n]),null}function Sc(){const{camera:e,scene:o,gl:n}=Se();return w.useEffect(()=>{},[e,o,n]),null}const zc=new xe(X.haze),kc=new xe(X.underHaze),Tc=new xe(X.abyss),Us=new xe;function Ec(){const e=Se(o=>o.scene);return oe(()=>{if(!e.fog)return;const o=T.clamp(v.depthBelow/zt.deepGrade,0,1),n=T.lerp(.0062,.0142,o);e.fog.density=T.lerp(v.fog,n,v.underwater),Us.copy(kc).lerp(Tc,o*.8),e.fog.color.lerpColors(zc,Us,v.underwater)}),null}function Rc({quality:e,budget:o,onRails:n,playing:s,speed:i,onShot:r,mode:l,onMode:h,crew:d}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,v.fog]}),t.jsx(Xa,{storm:v}),t.jsx(ci,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(vr,{quality:e,segments:o.segments}),t.jsx(fr,{quality:e,storm:v}),t.jsx(Lr,{quality:e,shadows:o.shadows}),t.jsx(Jn,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Jn,{quality:e,shadows:!1,z:lo,k:W*1.5}),t.jsx(Hr,{quality:e,shadows:o.shadows}),t.jsx(Br,{quality:e,shadows:o.shadows}),t.jsx(si,{quality:e}),t.jsx(ri,{shadows:o.shadows}),t.jsx(wl,{quality:e,shadows:o.shadows}),t.jsx(gi,{quality:e}),t.jsx(vi,{quality:e}),t.jsx(Ei,{quality:e}),t.jsx(Di,{quality:e}),t.jsx(Ji,{onRails:n&&l==="off",playing:s&&l==="off",speed:i,onShot:r,idle:l!=="off"}),t.jsx(bc,{mode:l}),t.jsx(Ua,{}),t.jsx(Wa,{}),t.jsx(Va,{}),t.jsx(ql,{mode:l,onMode:h,crew:d}),t.jsx(ic,{mode:l,onMode:h}),t.jsx(yc,{}),t.jsx(Ec,{}),t.jsx(Sc,{}),t.jsx(jc,{}),t.jsx(Mc,{budget:o}),o.shadows&&t.jsx(vc,{every:o.shadowEvery})]})}const no="#d63420",Ac="rgba(8,6,16,0.72)",Ws="(max-width: 860px), (max-height: 520px)",on="min(7.5vh, 62px)";function Ic(e=2600,o=!0){const[n,s]=w.useState(!1);return w.useEffect(()=>{if(!o){s(!1);return}let i;const r=()=>{s(!1),clearTimeout(i),i=setTimeout(()=>s(!0),e)};r();for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(l,r,{passive:!0});return()=>{clearTimeout(i);for(const l of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(l,r)}},[e,o]),n}function Cc(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ws).matches);return w.useEffect(()=>{const n=window.matchMedia(Ws),s=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",s):n.addListener(s),()=>{n.removeEventListener?n.removeEventListener("change",s):n.removeListener(s)}},[]),e}function Xe({on:e,onClick:o,children:n,title:s,wide:i,block:r}){return t.jsx("button",{onClick:o,title:s,style:{appearance:"none",border:`1px solid ${e?no:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||r?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:r?"100%":void 0,textAlign:r?"right":"center",minHeight:32},children:n})}function Fc({shot:e,shotIndex:o,shotCount:n,total:s,playing:i,onRails:r,speed:l,tier:h,override:d,dev:m,onPlay:x,onRailsToggle:p,onSpeed:f,onQuality:a,onRestart:u,audio:g,onAudio:b,mode:y,onMode:k,crew:S,onCrew:c,stage:j,veiled:F=!1}){const A=y!=="off",z=Cc(),[I,E]=w.useState(!1),[D,L]=w.useState(()=>({...be}));w.useEffect(()=>fa(H=>L({...H})),[]);const B=Ic(2600,!A&&!I),q=w.useRef(),Q=w.useRef(),G=w.useRef(),Y=w.useRef(),re=w.useRef(),K=w.useRef(),ie=r&&!A;w.useEffect(()=>E(!1),[y]),w.useEffect(()=>{let H,ke=performance.now(),Pe=0,qe=0;const ft=ve=>{if(H=requestAnimationFrame(ft),q.current&&(q.current.style.transform=`scaleX(${j.progress||0})`),G.current&&j.helm){const P=j.helm;if(P.onFoot)G.current.textContent=P.area==="island"?P.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":P.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(P.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(P.sub){const ee=Math.abs(P.speed)*1.94;if(P.berthing)G.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Re=P.maelstrom>.22?P.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":P.stress>.02?"⚠ HULL UNDER PRESSURE":P.scrape>.3?"HULL ON THE ROCK":"",ce=Math.abs(P.relRear*180/Math.PI),Ve=ce<6?"· ON COURSE":P.relRear>0?`◀ ${ce.toFixed(0)}°`:`${ce.toFixed(0)}° ▶`,_e=10,Ye=Math.round(P.depth/P.maxDepth*_e),Ge=Math.round(P.crushDepth/P.maxDepth*_e);let et="";for(let $e=0;$e<_e;$e++)et+=$e<Ye?$e>=Ge?"▓":"█":$e===Ge?"┃":"·";const uo=P.cruise===2?" ⟲FLK":P.cruise===1?" ⟲AHD":"";G.current.textContent=`DEPTH ${P.depth.toFixed(0).padStart(3,"0")}/${P.orderedDepth.toFixed(0).padStart(3,"0")}m ${et}  ${ee.toFixed(0).padStart(2,"0")} KN${uo}
COVE ${Math.round(P.toRear)}m  ${Ve}`+(Re?`
${Re}`:"")}}else{const ee=Math.abs(P.speed)*1.94,Re=(P.heading*180/Math.PI+180)%360,ce=Math.round((P.burst??0)*5),Ve=P.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(ce)}${"·".repeat(5-ce)}`,_e=P.cruise===2?"  ⟲FLANK":P.cruise===1?"  ⟲AHEAD":P.flank>.5?"  FLANK":"";G.current.textContent=`${ee.toFixed(0).padStart(2,"0")} KN   BRG ${Re.toFixed(0).padStart(3,"0")}°   ${Ve}${_e}
`+(P.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":P.moored?"MOORING":P.aground>.3?"AGROUND — HELM OVER":P.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(P.toGate)}m`:P.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(P.toGate)}m`:`GATE ${Math.round(P.toGate)}m`)}}if(Y.current){const P=ji(),ee=Mi(U.chain);Y.current.textContent=U.done?"✔ OBJECTIVE COMPLETE":P?`▸ ${U.step+1}/${ee}  ${P.text}`:"",Y.current.style.color=U.done?"#8fe0a0":"#ffd9cf"}if(re.current){const P=Math.max(0,Math.min(1,U.hull)),ee=Math.max(0,Math.min(1,U.grip)),Re=_e=>{const Ye=Math.round(_e*12);return"█".repeat(Ye)+"·".repeat(12-Ye)},ce=P>.6?"#8fe0a0":P>.3?"#ffc46b":"#ff6b5a",Ve=ee>.66?"#ff6b5a":ee>.33?"#ffc46b":"rgba(255,255,255,0.45)";re.current.innerHTML=`<span style="color:${ce}">HULL ${Re(P)}</span>`+(ee>.02?`<span style="color:${Ve};margin-left:14px">VORTEX ${Re(ee)}</span>`:"")}if(K.current){const P=U.banner,ee=K.current;P?(ee.dataset.text!==P.text&&(ee.dataset.text=P.text,ee.innerHTML=`<div class="og-banner-main">${P.text}</div>`+(P.sub?`<div class="og-banner-sub">${P.sub}</div>`:""),ee.style.animation="none",ee.offsetWidth,ee.style.animation=""),ee.style.opacity="1"):(ee.style.opacity="0",ee.dataset.text="")}m&&Q.current?(qe++,Pe+=ve-ke,ke=ve,Pe>400&&(Q.current.textContent=`${Math.round(qe*1e3/Pe)} fps · shelter ${j.shelter.toFixed(2)} · fog ${(j.fog*1e4).toFixed(1)}e-4 · flash ${j.flash.toFixed(2)}`,Pe=0,qe=0)):ke=ve};return H=requestAnimationFrame(ft),()=>cancelAnimationFrame(H)},[j,m]);const ze={opacity:B?.16:1,transform:B?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},ct=[{key:"rails",on:!r,label:r?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:p,cinematicOnly:!0},{key:"helm",on:y==="helm",label:y==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>k(y==="helm"?"off":"helm")},{key:"sub",on:y==="sub",label:y==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>k(y==="sub"?"off":"sub")},{key:"foot",on:y==="foot",label:y==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>k(y==="foot"?"off":"foot")}],Le=H=>y==="foot"?t.jsx(Xe,{on:!0,wide:!0,block:H,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>c?.(S==="zoro"?"luffy":"zoro"),children:S==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,He=(H,ke)=>t.jsx(Xe,{on:H.on,onClick:H.click,title:H.title,wide:!0,block:ke,children:H.label},H.key),We=H=>A?t.jsxs(t.Fragment,{children:[t.jsx(Xe,{on:D.comfort>.01,wide:!0,block:H,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:Hi,children:D.comfort>.9?"COMFORT · FULL":D.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Xe,{on:D.freeCam,wide:!0,block:H,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>Po("freeCam"),children:D.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Xe,{on:Math.abs(D.lookSens-1)>.01,wide:!0,block:H,title:"How far a drag turns the view",onClick:_i,children:`LOOK ${D.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Xe,{on:D.invertY,wide:!0,block:H,title:"Invert the vertical look axis",onClick:()=>Po("invertY"),children:D.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,vt=H=>t.jsxs(t.Fragment,{children:[!A&&t.jsxs(t.Fragment,{children:[t.jsx(Xe,{on:i,onClick:x,title:"Play / pause the cinematic",block:H,children:i?H?"❙❙  PAUSE":"❙❙":H?"▶  PLAY":"▶"}),[.5,1,2].map(ke=>t.jsxs(Xe,{on:l===ke,onClick:()=>f(ke),title:`${ke}× speed`,block:H,children:[ke,"×"]},ke))]}),t.jsx(Xe,{on:!1,onClick:u,title:"Restart from the open sea",block:H,children:H?"↺  RESTART":"↺"}),t.jsx(Xe,{on:g,onClick:b,title:"Storm, taiko and a temple bell — all synthesised",block:H,children:g?H?"♪  SOUND ON":"♪":H?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Xe,{on:d!=="auto",wide:!0,block:H,title:"Render tier",onClick:()=>a(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${h.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!F&&t.jsxs(t.Fragment,{children:[[0,1].map(H=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[H?"bottom":"top"]:0,height:ie?on:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},H)),t.jsxs("div",{className:"og-tategaki",style:{opacity:A||I?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:A?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${no}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:A?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:q,style:{height:"100%",background:`linear-gradient(90deg, ${no}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${no}`}})}),t.jsx("div",{className:`og-chrome${A?"":" og-chrome-bottom"}`,style:{...A?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...ze},children:z?t.jsxs(t.Fragment,{children:[A&&t.jsx(Xe,{on:!0,onClick:()=>k("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(Xe,{on:I,onClick:()=>E(H=>!H),title:"Menu",children:I?"✕":"☰"}),I&&t.jsxs("div",{className:"og-menu",children:[A&&t.jsxs(t.Fragment,{children:[Le(!0),We(!0),t.jsx("div",{className:"og-menu-rule"})]}),ct.filter(H=>!(H.cinematicOnly&&A)).map(H=>He(H,!0)),t.jsx("div",{className:"og-menu-rule"}),vt(!0)]})]}):t.jsxs(t.Fragment,{children:[Le(!1),We(!1),vt(!1),ct.filter(H=>!(H.cinematicOnly&&A)).map(H=>He(H,!1))]})}),!A&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...ze,pointerEvents:"none"},children:[r?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:r?`  ·  ${Math.round(s)}s`:""})]}),A&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:Y,className:"og-objective"}),t.jsx("div",{ref:G,className:"og-readout"}),t.jsx("div",{ref:re,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:y==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":y==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":S==="zoro"?"WASD MOVE · SHIFT RUN · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),A&&t.jsx("div",{ref:K,className:"og-banner"}),m&&t.jsx("div",{ref:Q,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Ac,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${ie?on:"0px"};
          --og-bottom: ${ie?on:"0px"};
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
          color: ${no};
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
      `})]})}const nn="#d63420",Gc=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Lc({onPick:e}){const[o,n]=w.useState(!1),s=w.useRef(),i=620,r=d=>{o||(n(!0),e(d))},[l,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const d=setTimeout(()=>h(!0),i);return()=>clearTimeout(d)},[o]),w.useEffect(()=>{const d=m=>{(m.key==="Escape"||m.key==="Enter")&&r("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),l?null:t.jsxs("div",{ref:s,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Gc.map((d,m)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+m*.07}s`},onClick:()=>r(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${nn};
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
          border-color: ${nn};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${nn};
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
      `})]})}const Ln="#d63420",Pn="#4aa9c9",Pc=(e,o,n)=>e<o?o:e>n?n:e;function Ta(e,o,n){const s=w.useRef(o);s.current=o;const i=w.useRef(null),r=w.useRef({x:0,y:0});w.useEffect(()=>{const l=e.current;if(!l||!n)return;const h=p=>{if(i.current===null){i.current=p.pointerId,r.current={x:p.clientX,y:p.clientY};try{l.setPointerCapture?.(p.pointerId)}catch{}s.current.onMove(0,0,p.clientX,p.clientY),p.preventDefault()}},d=p=>{if(p.pointerId!==i.current)return;const f=r.current;s.current.onMove(p.clientX-f.x,p.clientY-f.y,f.x,f.y),p.preventDefault()},m=p=>{p.pointerId===i.current&&(i.current=null,s.current.onEnd(),p.cancelable&&p.preventDefault())};l.addEventListener("pointerdown",h),l.addEventListener("pointermove",d),l.addEventListener("pointerup",m),l.addEventListener("pointercancel",m),window.addEventListener("pointerup",m),window.addEventListener("pointercancel",m);const x=()=>{i.current!==null&&(i.current=null,s.current.onEnd())};return window.addEventListener("blur",x),()=>{l.removeEventListener("pointerdown",h),l.removeEventListener("pointermove",d),l.removeEventListener("pointerup",m),l.removeEventListener("pointercancel",m),window.removeEventListener("pointerup",m),window.removeEventListener("pointercancel",m),window.removeEventListener("blur",x)}},[e,n])}function Vs({label:e,sub:o,onDown:n,onUp:s,tone:i="plain",wide:r=!1}){const[l,h]=w.useState(!1),d=w.useRef();w.useEffect(()=>{const x=d.current;if(!x)return;let p=null;const f=u=>{p=u.pointerId;try{x.setPointerCapture?.(p)}catch{}h(!0),n(),u.preventDefault(),u.stopPropagation()},a=u=>{u.pointerId===p&&(p=null,h(!1),s(),u.preventDefault(),u.stopPropagation())};return x.addEventListener("pointerdown",f),x.addEventListener("pointerup",a),x.addEventListener("pointercancel",a),x.addEventListener("pointerleave",a),()=>{x.removeEventListener("pointerdown",f),x.removeEventListener("pointerup",a),x.removeEventListener("pointercancel",a),x.removeEventListener("pointerleave",a)}},[n,s]);const m=i==="hot"?Ln:i==="cool"?Pn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${r?" og-btn-wide":""}`,style:{border:`1px solid ${l?m:"rgba(255,255,255,0.18)"}`,background:l?`color-mix(in srgb, ${m} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:l?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Je({label:e,sub:o,onTap:n,on:s,tone:i="plain",wide:r=!1}){const l=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const m=l.current;if(!m)return;const x=p=>{h.current(),p.preventDefault(),p.stopPropagation()};return m.addEventListener("pointerdown",x),()=>m.removeEventListener("pointerdown",x)},[]);const d=i==="hot"?Ln:i==="cool"?Pn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:l,className:`og-btn${r?" og-btn-wide":""}`,style:{border:`1px solid ${s?d:"rgba(255,255,255,0.18)"}`,background:s?`color-mix(in srgb, ${d} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:s?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Oc(){const[e,o]=w.useState(bt.level);return w.useEffect(()=>Wi(o),[]),t.jsx(Je,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:xa})}function Dc({simple:e=!1}){const[o,n]=w.useState(be.freeCam);w.useEffect(()=>fa(i=>n(i.freeCam)),[]);const s=w.useRef(null);return e?t.jsx(Je,{label:"LEVEL",sub:"view",onTap:()=>C.recentreQueued=!0}):t.jsx(Je,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const i=performance.now();if(s.current&&i-s.current<420){s.current=null,Po("freeCam"),C.recentreQueued=!0;return}s.current=i,C.recentreQueued=!0}})}function Nc({active:e}){const o=w.useRef(),n=w.useRef(),s=w.useRef(),i=78;return w.useEffect(()=>{if(!e)return;let r;const l=()=>{r=requestAnimationFrame(l);const h=s.current,d=v.helm;h&&(h.textContent=d?.sub?String(Math.round(d.orderedDepth)):"⇕")};return r=requestAnimationFrame(l),()=>cancelAnimationFrame(r)},[e]),Ta(o,{onMove:(r,l,h,d)=>{const m=o.current;if(!m)return;const x=m.getBoundingClientRect(),p=x.top+x.height/2,f=Pc((d+l-p)/i,-1,1),a=Math.abs(f)<.1?0:f;J.active=!0,J.planes=-a;const u=n.current;u&&(u.style.transform=`translate(-50%, calc(-50% + ${f*i}px))`,u.style.borderColor=Pn,u.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{J.planes=0;const r=n.current;r&&(r.style.transform="translate(-50%, -50%)",r.style.borderColor="rgba(255,255,255,0.3)",r.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:s,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function Hc({mode:e,crew:o="luffy"}){const n=w.useRef(),s=w.useRef(),i=w.useRef(),r=w.useRef(),l=62,h=7,d=w.useRef(e);if(d.current=e,Ta(n,{onMove:(f,a,u,g)=>{const b=Math.hypot(f,a),y=b>l?l/b:1,k=f*y,S=a*y,c=s.current,j=i.current;c&&(c.style.transform=`translate(${u-l}px, ${g-l}px)`,c.style.opacity="1"),j&&(j.style.transform=`translate(${u+k-26}px, ${g+S-26}px)`,j.style.opacity="1"),r.current&&(r.current.style.opacity="0");const F=Math.abs(k)<h?0:k/l,A=Math.abs(S)<h?0:S/l;J.active=!0,d.current==="foot"?(J.walk.x=F,J.walk.z=-A):(J.throttle=-A,J.rudder=-F)},onEnd:()=>{s.current&&(s.current.style.opacity="0"),i.current&&(i.current.style.opacity="0"),r.current&&(r.current.style.opacity=""),J.throttle=0,J.rudder=0,J.walk.x=0,J.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{J.throttle=0,J.rudder=0,J.planes=0,J.boost=!1,J.walk.x=0,J.walk.z=0},[e]),e==="off")return null;const m=e==="sub",x=e==="foot",p=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:n,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:s,style:{position:"fixed",left:0,top:0,width:l*2,height:l*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:i,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${Ln}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:r,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:x?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[m&&t.jsx(Nc,{active:!0}),t.jsxs("div",{className:"og-actions",children:[m&&t.jsx(Je,{label:"SURFACE",sub:"blow all",onTap:()=>C.surfaceQueued=!0}),m&&t.jsx(Je,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>C.periscopeQueued=!0}),e==="helm"&&t.jsx(Je,{label:"BURST",sub:"coup de",tone:"cool",onTap:()=>C.burstQueued=!0}),x&&t.jsxs(t.Fragment,{children:[t.jsx(Je,{label:p?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>C.pistolQueued=!0}),t.jsx(Je,{label:p?"YAKKO":"BAZOOKA",sub:p?"flying cut":"both fists",tone:"cool",onTap:()=>C.bazookaQueued=!0}),t.jsx(Je,{label:p?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>C.gigantQueued=!0}),t.jsx(Je,{label:p?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>C.rocketQueued=!0}),t.jsx(Je,{label:p?"ASURA":"HAKI",sub:"burst",onTap:()=>C.hakiQueued=!0}),!p&&t.jsx(Je,{label:"GEAR 2",sub:"overdrive",onTap:()=>C.gear2Queued=!0}),t.jsx(Vs,{label:p?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>J.gatling=!0,onUp:()=>J.gatling=!1})]}),!x&&t.jsx(Oc,{}),t.jsx(Vs,{label:x?"RUN":"FLANK",sub:x?"»":"over",tone:"hot",onDown:()=>J.boost=!0,onUp:()=>J.boost=!1}),t.jsx(Dc,{simple:x})]})]}),t.jsx("style",{children:`
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
      `})]})}const Ys={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function _c(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const Bc=null;function $c(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(_c),[n,s]=w.useState("auto"),i=n==="auto"?o:n,r=Ys[i]??Ys.high;w.useEffect(()=>{kr(r.scene!=="low")},[r.scene]),w.useMemo(()=>Zs(r.scene),[r.scene]),w.useMemo(()=>Ui(),[]),w.useEffect(()=>Vi(),[]);const l=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,d]=w.useState(0),[m,x]=w.useState(!0),[p,f]=w.useState(!0),[a,u]=w.useState(1),[g,b]=w.useState(ys[0]),[y,k]=w.useState(0),[S,c]=w.useState(uc),[j,F]=w.useState(()=>{if(typeof location>"u")return"off";const K=new URLSearchParams(location.search).get("mode");return K==="helm"||K==="sub"||K==="foot"?K:"off"}),[A,z]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy");w.useEffect(()=>{if(!S)return;const K=()=>{en(),Jo(!0)};for(const ie of["pointerdown","keydown","touchstart"])window.addEventListener(ie,K,{once:!0,passive:!0});return()=>{for(const ie of["pointerdown","keydown","touchstart"])window.removeEventListener(ie,K)}},[S]);const I=w.useCallback(()=>{c(K=>{const ie=!K;return ie&&en(),Jo(ie),ie})},[]),[E,D]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),L=w.useCallback(K=>{S&&(en(),Jo(!0)),K==="off"?(v.jumpTo=0,x(!0),f(!0)):F(K),D(!0)},[S]),[B,q]=w.useState(!1),Q=w.useRef(!0);w.useEffect(()=>{if(ga(),Q.current){Q.current=!1;return}q(!0);const K=setTimeout(()=>q(!1),210);return()=>clearTimeout(K)},[j]);const G=w.useCallback((K,ie)=>{k(K),b(ie)},[]),Y=w.useCallback(()=>{zr(),d(K=>K+1),x(!0),f(!0)},[]),re=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(Bc,{})}):t.jsxs(t.Fragment,{children:[t.jsx(Fa,{shadows:r.shadows,dpr:r.dpr,gl:{antialias:r.aa,powerPreference:"high-performance",toneMapping:_a,toneMappingExposure:Ya,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(Rc,{quality:r.scene,budget:r,onRails:p,playing:m,speed:a,onShot:G,mode:j,onMode:F,crew:A},h)})}),l&&E&&t.jsx(Hc,{mode:j,crew:A}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:B?1:0,transition:B?"opacity .2s ease-in":"opacity .42s ease-out"}}),!E&&t.jsx(Lc,{onPick:L}),t.jsx(Fc,{veiled:!E,shot:g,shotIndex:y,shotCount:ys.length,total:vn,playing:m,onRails:p,speed:a,tier:i,override:n,dev:re,onPlay:()=>x(K=>!K),onRailsToggle:()=>f(K=>!K),onSpeed:u,onQuality:s,onRestart:Y,audio:S,onAudio:I,mode:j,onMode:F,crew:A,onCrew:z,stage:v})]})}export{$c as default};
