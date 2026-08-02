var Fs=Object.defineProperty;var Gs=(e,o,s)=>o in e?Fs(e,o,{enumerable:!0,configurable:!0,writable:!0,value:s}):e[o]=s;var rn=(e,o,s)=>Gs(e,typeof o!="symbol"?o+"":o,s);import{r as g,u as ee,j as t,d as es,f as Me,h as Ls,i as Is}from"./vendor-C2HIMx-P.js";import{t as xe,c as v,aD as Io,au as Yo,d as Xo,a5 as ze,aJ as Cs,f as Ps,Y as ln,a0 as cn,ag as S,h as Q,aK as Ds,ay as Os,az as Tt,aA as Et,aq as ts,R as Ns,M as De,o as We,at as pt,ax as Qe,aL as Wt,aM as $t,a4 as Hs,a8 as lt,ar as Rt,av as os,aC as _s,A as Bs}from"./three-Zo_RlN_K.js";import{f as zt,m as Zo}from"./index-DgiDNpQd.js";const Y={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},E={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},co={dir:[.72,.52,-.44],col:"#f2e9cf"},it={sea:.00105,bay:48e-5,deepGrade:210},Us=1.15;function oe(e){const o=new xe(e);return[o.r,o.g,o.b]}const Ws=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,$s=`
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
`;function Vs({storm:e}){const o=g.useRef(),s=g.useMemo(()=>({uTime:{value:0},uHigh:{value:new v(...oe(Y.skyHigh))},uLow:{value:new v(...oe(Y.skyLow))},uCloud:{value:new v(...oe(Y.cloud))},uCloudLit:{value:new v(...oe(Y.cloudLit))},uEmber:{value:new v(...oe(E.ember))},uFlash:{value:0},uFlashColor:{value:new v(...oe(Y.boltGlow))},uFlashDir:{value:new v(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new v(...co.dir).normalize()},uMoonCol:{value:new v(...oe(co.col))},uUnder:{value:0},uUnderCol:{value:new v(...oe(Y.underHaze))}}),[]);return ee((a,i)=>{const l=o.current?.uniforms;l&&(l.uTime.value+=i,l.uFlash.value=e?.flash??0,e?.flashDir&&l.uFlashDir.value.copy(e.flashDir),l.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:Ws,fragmentShader:$s,uniforms:s,side:Io,depthWrite:!1,depthTest:!1,fog:!1})]})}const _=1.9,W=e=>e*_,ce={x:0,z:W(-60)},ot=W(300),ro=W(175),Ys=118,D={x:0,z:W(-402),r:W(215),baseY:300,squash:[1.18,1.04,.98]},Dt=[[-.361,.301,.883],[.361,.301,.883]],Ko=[0,.02,.9998],qo=[0,-.419,.908];function Qo(e,o=1){const[s,a,i]=D.squash;return{x:D.x+e[0]*D.r*s*o,y:D.baseY+e[1]*D.r*a*o,z:D.z+e[2]*D.r*i*o}}const be=Dt.map(e=>Qo(e)),ie={...Qo(qo),halfWidth:74,height:62};Qo(Ko,.94);const X={x:W(-152),y:4.5,z:W(-104),r:W(78)},hn=2.35,ht=[Math.sin(hn),Math.cos(hn)],$=(()=>{const e=ot+ro*.35,o=ce.x+ht[0]*e,s=ce.z+ht[1]*e;return{x:o,z:s,pool:W(46),benchY:3.6,reach:W(560),gate:{x:o-ht[0]*W(44),z:s-ht[1]*W(44)},berth:{x:o+ht[0]*W(12),z:s+ht[1]*W(12)},dir:ht}})(),Xs=[{rank:1,role:"east-south",ang:.75,dist:W(730),r:W(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:W(730),r:W(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:W(770),r:W(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:W(690),r:W(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:W(690),r:W(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:W(765),r:W(150),depth:42,dir:1,speed:35}],Ee=[];function ns(e){const o=e==="low"?3:e==="mid"?5:7;Ee.length=0;for(const s of Xs)s.rank>o||Ee.push({role:s.role,x:ce.x+Math.sin(s.ang)*s.dist,z:ce.z+Math.cos(s.ang)*s.dist,r:s.r,depth:s.depth,dir:s.dir,speed:s.speed});return Ee}const Zs=e=>Ee.find(o=>o.role===e)??Ee[0];ns("high");function ss(e,o,s=0){let a=0,i=0;const l=1-Ae(8,34,s);if(l<=0)return{vx:a,vz:i,danger:0};let h=0;for(const c of Ee){const d=e-c.x,u=o-c.z,p=Math.hypot(d,u);if(p>c.r*1.7||p<.001)continue;const r=p/c.r,f=1-Ae(1,1.6,r),m=c.speed*(r/.3)*Math.exp(1-r/.3)*.62*f,n=c.speed*.55*Math.exp(-r*r*2.6)*f+c.speed*.1*f,x=1/p;a+=(-u*x*m*c.dir-d*x*n)*l,i+=(d*x*m*c.dir-u*x*n)*l,h=Math.max(h,(1-Ae(.15,1.15,r))*l)}return{vx:a,vz:i,danger:h}}const as={x:0,halfWidth:W(96)},mt=W(258),Ht=W(624),ho={safe:260,range:1150},Ks=0,io=W(1500),uo=e=>e<0?0:e>1?1:e;function qs(e,o,s=4){let a=0,i=1,l=1,h=0;for(let c=0;c<s;c++){const d=1-Math.abs(zt(e*l,o*l,1)*2-1);a+=d*d*i,h+=i,i*=.52,l*=2.07}return a/h}const Ae=(e,o,s)=>{const a=uo((s-e)/(o-e));return a*a*(3-2*a)};function Qs(e){if(e>W(430))return 1e4;const o=1-Ae(W(430),W(205),e),s=Ae(W(150),W(-30),e);return as.halfWidth+o*W(620)+s*W(300)}function Js(e){const o=(1-Math.cos(e))*.5,s=Math.sin(e);let a=Ys;return a+=o*190,a+=Math.max(0,s)*46,a-=Math.max(0,-s)*26,a}function re(e,o){const s=e-ce.x,a=o-ce.z,i=Math.hypot(s,a),l=Math.atan2(s,a),h=(i-ot)/ro,c=Math.exp(-h*h*1.35)*Js(l),d=Math.max(0,i-ot-ro*.55),u=-Math.pow(d/210,1.6)*175,p=Math.max(0,ot-ro*.5-i),r=-Ae(0,150,p)*46,f=uo(c/60),m=(qs(e*.0052/_+13,o*.0052/_-21,4)-.42)*168*f,n=(zt(e*.0042/_+31,o*.0042/_-17,4)-.5)*84*f,x=(zt(e*.021-5,o*.021+9,3)-.5)*17*f;let w=c+u+r+m+n+x;const y=Qs(o),z=1-Ae(y,y+W(105),Math.abs(e-as.x)),T=1-Ae(W(-40),W(-190),o),L=z*T;w=w*(1-L)+Math.min(w,-34)*L;const R=Math.hypot(e-D.x,o-D.z);w+=Math.exp(-Math.pow(R/(D.r*1.55),2))*62;const G=(e-X.x)/W(76),F=(o-X.z)/W(58),A=(1-Ae(.72,1.18,Math.hypot(G,F)))*uo((w+34)/34);w=w*(1-A)+X.y*A;const M=e-$.x,j=o-$.z;if(Math.abs(M)+Math.abs(j)<$.reach+W(140)){const C=Math.max(0,Math.min($.reach,M*$.dir[0]+j*$.dir[1])),k=M-$.dir[0]*C,O=j-$.dir[1]*C,Z=Math.hypot(k,O),se=W(30)+C/$.reach*W(48),I=1-Ae(se,se+W(62),Z);w=w*(1-I)+Math.min(w,-26)*I;const P=Math.hypot(M,j),K=1-Ae($.pool*.55,$.pool,P);w=w*(1-K)+Math.min(w,-14)*K;const J=(e-$.gate.x)/W(30),ae=(o-$.gate.z)/W(24),V=1-Ae(.72,1.18,Math.hypot(J,ae));w=w*(1-V)+$.benchY*V}return w}function Jo(e,o,s=3){const a=re(e+s,o)-re(e-s,o),i=re(e,o+s)-re(e,o-s),l=-a,h=2*s,c=-i,d=Math.hypot(l,h,c)||1;return[l/d,h/d,c/d]}function ea(e,o,s=3){return Math.acos(Jo(e,o,s)[1])}function _t(e,o){const s=Ae(W(250),W(40),o),a=1-Ae(ot-W(40),ot+W(90),Math.hypot(e-ce.x,o-ce.z)),i=(1-Ae(W(60),W(170),Math.hypot(e-$.x,o-$.z)))*.85;return uo(Math.max(Math.min(s,a),i))}const rs=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],ta=Math.PI*2;function oa(e,o,s){let a=0,i=0,l=0;for(const h of Ee){const c=e-h.x,d=o-h.z,u=Math.max(1,Math.hypot(c,d));if(u>h.r*1.75)continue;const p=u/h.r,r=Math.exp(-3*p*p);a-=h.depth*r;const f=h.depth*6*p*r/h.r;i+=f*(c/u),l+=f*(d/u);const m=Math.atan2(d,c),n=Math.sin(m*3*h.dir+p*14-s*2.2),x=p*Math.exp(1-p)*(1-na(p));a+=n*x*1.6}return{y:a,dx:i,dz:l}}function na(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function Be(e,o,s,a=1){let i=0,l=0,h=0;for(const d of rs){const u=ta/d.len,p=Math.sqrt(9.81/u),r=Math.hypot(d.dir[0],d.dir[1]),f=d.dir[0]/r,m=d.dir[1]/r,n=u*(f*e+m*o-p*s),x=d.amp*a;i+=x*Math.sin(n);const w=x*u*Math.cos(n);l+=w*f,h+=w*m}const c=oa(e,o,s);return i+=c.y,l+=c.dx,h+=c.dz,{y:i,dx:l,dz:h}}const sa=rs.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),aa=()=>Ee.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),ra=()=>Ee.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),ia=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*_).toFixed(1)}, ${(250*_).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(ot-40*_).toFixed(1)}, ${(ot+90*_).toFixed(1)},
      length(p - vec2(${ce.x.toFixed(1)}, ${ce.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*_).toFixed(1)}, ${(170*_).toFixed(1)},
      length(p - vec2(${$.x.toFixed(1)}, ${$.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,la=()=>`
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
${ia}

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
${sa}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${aa()}

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
`,ca=()=>`
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
${ra()}
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
`;function ha(e,o){const s=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let l=0;l<e;l++){const h=ce.x+((l+.5)/e-.5)*o,c=ce.z+((i+.5)/e-.5)*o,d=re(h,c),u=S.clamp(-d/46,0,1),p=(i*e+l)*4;s[p]=Math.round(u*255),s[p+1]=s[p],s[p+2]=s[p],s[p+3]=255}const a=new Cs(s,e,e,Ps);return a.minFilter=ln,a.magFilter=ln,a.wrapS=cn,a.wrapT=cn,a.needsUpdate=!0,a}const dn={low:112,mid:190,high:286},un=6400;function da({quality:e="high",storm:o}){const s=g.useRef(),{geometry:a,uniforms:i,landTex:l,vert:h,frag:c}=g.useMemo(()=>{const d=dn[e]??dn.high,u=new Yo(un,un,d,d);u.rotateX(-Math.PI/2),u.translate(ce.x,0,ce.z);const p=io*1.05,r=ha(e==="low"?160:256,p),f={uTime:{value:0},uLand:{value:r},uSpan:{value:p},uCentre:{value:new Xo(ce.x,ce.z)},uDeep:{value:new v(...oe(Y.seaDeep))},uShallow:{value:new v(...oe(Y.seaShallow))},uFoam:{value:new v(...oe(Y.foam))},uSkyLow:{value:new v(...oe(Y.skyLow))},uGilt:{value:new v(...oe(E.gilt))},uEmber:{value:new v(...oe(E.ember))},uFogColor:{value:new v(...oe(Y.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new v(...oe(Y.abyss))},uUnderGlow:{value:new v(...oe(Y.underGlow))},uDepthFade:{value:0},uMoonDir:{value:ua.clone()},uMoonCol:{value:new v(...oe(pa))},uEyeA:{value:new v(be[0].x,be[0].y,be[0].z)},uEyeB:{value:new v(be[1].x,be[1].y,be[1].z)},uFlash:{value:0},uFlashColor:{value:new v(...oe(Y.boltGlow))},uCameraPos:{value:new v}};return{geometry:u,uniforms:f,landTex:r,vert:la(),frag:ca()}},[e]);return ee((d,u)=>{const p=s.current?.uniforms;if(!p)return;p.uTime.value+=u,p.uCameraPos.value.copy(d.camera.position),p.uFlash.value=o?.flash??0,p.uFogDensity.value=o?.fog??.0011;const r=Math.min(1,Math.max(0,(o?.depthBelow??0)/it.deepGrade));p.uDepthFade.value=r,pn.copy(fa).lerp(xa,r*.8),p.uFogColor.value.lerpVectors(ma,pn,o?.underwater??0)}),t.jsx("mesh",{geometry:a,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:s,vertexShader:h,fragmentShader:c,uniforms:i,transparent:!1,side:ze},l.uuid)})}const ua=new v(...co.dir).normalize(),pa=co.col,ma=new v(...oe(Y.haze)),fa=new v(...oe(Y.underHaze)),xa=new v(...oe(Y.abyss)),pn=new v;function ga({quality:e="high",segments:o=200}){const s=g.useMemo(()=>{const a=o,i=new Yo(io,io,a,a);i.rotateX(-Math.PI/2);const l=i.attributes.position,h=l.count,c=new Float32Array(h*3),d=new xe(Y.rock),u=new xe(Y.rockLit),p=new xe("#0b0e18"),r=new xe(Y.snow),f=new xe(E.rockWarm),m=new xe;for(let n=0;n<h;n++){const x=l.getX(n)+ce.x,w=l.getZ(n)+ce.z,y=re(x,w);l.setX(n,x),l.setY(n,y),l.setZ(n,w);const z=Jo(x,w,io/a)[1],T=Math.max(0,(z-.55)/.45);m.copy(d).lerp(u,S.clamp(y/190,0,1));const L=1-S.clamp((y-Ks)/13,0,1);m.lerp(p,L*.85);const R=S.clamp((x-ce.x)/260,0,1),G=96-R*42,F=S.clamp((y-G)/60,0,1)*T;m.lerp(r,F*(.45+R*.5));const A=Math.hypot(x-D.x,w-D.z),M=Math.exp(-Math.pow(A/330,2)),j=S.clamp((w-D.z)/260,0,1);m.lerp(f,M*j*.6*(1-F)),c[n*3]=m.r,c[n*3+1]=m.g,c[n*3+2]=m.b}return i.setAttribute("color",new Q(c,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[o]);return t.jsx("mesh",{geometry:s,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const en=-30,tn=330,wa=150,me={x:ie.x,y:ie.y-40,z:ie.z-wa-(en+tn)},Te={centre:[0,96,en],radii:[350,235,tn]},xt={x:me.x+Te.centre[0],y:me.y+Te.centre[1],z:me.z+Te.centre[2]};function Co(e,o=.06){const s=(e.x-xt.x)/Te.radii[0],a=(e.y-xt.y)/Te.radii[1],i=(e.z-xt.z)/Te.radii[2],l=Math.sqrt(s*s+a*a+i*i),h=1+o;if(l>=h)return null;const c=l<1e-4?0:h/l;return e.x=xt.x+(c?s*c:0)*Te.radii[0],e.y=xt.y+(c?a*c:h)*Te.radii[1],e.z=xt.z+(c?i*c:0)*Te.radii[2],e}const ne={y:0,halfX:290,zFront:228,zBack:-240},ve={y:40,z:en+tn-40,halfX:96,depth:120},_e={zTop:ve.z-54,zBottom:140,halfX:74,steps:16},B={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},ye={y:74,z:B.z+B.halfZ+26,halfX:96,depth:40},rt=ye.y+3.5,Fe={y:-95,halfX:220,halfZ:175,ceiling:-34},we={x:0,z:84,halfX:52,halfZ:40},ue={y:52,halfZ:205,x:252,tiers:3,tierRise:46},Yt=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],le={x:74,halfW:14,zFoot:B.z+B.halfZ+158,zTop:ye.z+ye.depth/2-6},is=[{kind:"rampZ",x0:-74-le.halfW,x1:-74+le.halfW,z0:le.zFoot,z1:le.zTop,y0:0,y1:rt},{kind:"rampZ",x0:le.x-le.halfW,x1:le.x+le.halfW,z0:le.zFoot,z1:le.zTop,y0:0,y1:rt},{kind:"flat",x0:-96,x1:ye.halfX,z0:ye.z-ye.depth/2-2,z1:le.zTop+10,y:rt},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:ue.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:ue.y-.5},{kind:"flat",x0:ue.x-38,x1:ue.x+38,z0:-225,z1:ue.halfZ+20,y:ue.y-.5}],ya=e=>e<=0?0:e>=1?1:e*e*(3-2*e),ls=(()=>{const e=[],o=[],s=[],a=B.halfX+6,i=[a,a+9],l=[a+11,a+20],h=[a,a+20],c=[-212,-200],d=[-264,-252],u=[rt];for(let r=2;r<=B.storeys;r++)u.push(B.plinth+r*B.storey+1.5);e.push({kind:"flat",x0:ye.halfX-6,x1:a+20,z0:-212,z1:-196,y:rt}),o.push([(ye.halfX-6+a+20)/2,rt,-204,a+26-ye.halfX,16]);for(let r=0;r<u.length-1;r++){const f=u[r],m=u[r+1],n=(f+m)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:f,y1:n}),s.push({x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:f,y1:n}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:d[0],z1:d[1],y:n}),o.push([(h[0]+h[1])/2,n,(d[0]+d[1])/2,h[1]-h[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:n,y1:m}),s.push({x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:n,y1:m}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:c[0],z1:c[1],y:m}),o.push([(h[0]+h[1])/2,m,(c[0]+c[1])/2,h[1]-h[0],c[1]-c[0]])}for(let r=1;r<u.length-1;r++){const m=1-Math.min(B.storeys,r+2)*B.taper,n=B.halfX*m,x=B.z+B.halfZ*m,w=u[r];e.push({kind:"flat",x0:n-4,x1:a,z0:-224,z1:-212,y:w}),o.push([(n-4+a)/2,w,-218,a-n+4,12]),e.push({kind:"flat",x0:-n-6,x1:n+6,z0:x,z1:-212,y:w}),o.push([0,w,(x-212)/2,n*2+12,-212-x])}const p=u[u.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:p}),o.push([(a+58)/2,p,-230,a-58,36]),{walks:e,slabs:o,flights:s,tower:{x:[a,a+20],z:[d[0],c[1]]}}})();is.push(...ls.walks);function ba(e,o){let s=0;for(const a of is){if(e<a.x0||e>a.x1)continue;const i=Math.min(a.z0,a.z1),l=Math.max(a.z0,a.z1);if(!(o<i||o>l))if(a.kind==="flat")a.y>s&&(s=a.y);else{const h=ya((o-a.z0)/(a.z1-a.z0)),c=a.y0+(a.y1-a.y0)*h;c>s&&(s=c)}}return s}const b={t:0,flash:0,flashDir:new v(0,.4,-1),fog:it.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new v(0,0,0),helmActive:!1,helmPos:new v(0,0,0),helmSpeed:0,subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new v(0,60,-200)}};function va(){b.t=0,b.progress=0,b.flash=0,b.fog=it.sea,b.rain=1,b.shot=0,b.underwater=0,b.depthBelow=0,b.whirlNear=0,b.subActive=!1,b.subThrottle=0}const yo=new Map;let cs=!0;function Ma(e){cs=!!e}function ja(e){const o=Zo(e);return yo.has(o)||yo.set(o,fetch(o,{method:"HEAD"}).then(s=>s.ok?!(s.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),yo.get(o)}function Pe(e){const[o,s]=g.useState(!1);return g.useEffect(()=>{let a=!0;return ja(e).then(i=>{a&&s(i&&cs)}),()=>{a=!1}},[e]),o}const et=Dt.map(e=>new v(...e).normalize()),hs=new v(...Ko).normalize(),Po=new v(...qo).normalize();function Sa(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const s=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=s*.13;for(const d of et){const u=e.dot(d),p=Math.pow(Math.max(0,u),46);o-=p*.3}const a=Math.max(0,e.dot(hs)),i=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);o-=i*.19;for(const d of et){const u=new v(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,u),26)*.075}const l=Math.max(0,e.dot(Po));o-=Math.pow(l,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const h=Math.pow(Math.max(0,e.dot(et[0])),30)+Math.pow(Math.max(0,e.dot(et[1])),30),c=1-Math.min(1,h);return o+=(zt(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*c,o+=(zt(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*c,o}const za=178*1.9,Ge=D.r/za;function mn(e,o){const s=e*Ge,a=[new v(s*74,96*Ge,-20*Ge),new v(s*142,176*Ge,-58*Ge),new v(s*196,268*Ge,-76*Ge),new v(s*222,356*Ge,-52*Ge),new v(s*206,424*Ge,8*Ge),new v(s*154,462*Ge,72*Ge)],i=new v;for(const p of a)i.set(D.x+p.x,D.baseY+p.y,D.z+p.z),Co(i,.12)&&p.set(i.x-D.x,i.y-D.baseY,i.z-D.z);const l=new Tt(a),h=o==="low"?14:o==="mid"?22:34,c=o==="low"?6:10,d=new Et(l,h,1,c,!1),u=d.attributes.position;for(let p=0;p<=h;p++){const r=p/h,f=34*Ge*Math.pow(1-r,.72)*(1+Math.sin(r*Math.PI)*.16),m=l.getPoint(r);for(let n=0;n<=c;n++){const x=p*(c+1)+n;if(x>=u.count)continue;const w=u.getX(x)-m.x,y=u.getY(x)-m.y,z=u.getZ(x)-m.z;u.setXYZ(x,m.x+w*f,m.y+y*f,m.z+z*f)}}return u.needsUpdate=!0,d.computeVertexNormals(),d}const ka={low:4,mid:6,high:7},ds="skull-island.opt.glb",Ft={height:1,yaw:0,lift:.02},bo=new Ns,fn=new v,Xt=new v;function Ta(e,o,s){Xt.set(o[0],o[1],o[2]).normalize(),fn.copy(Xt).multiplyScalar(D.r*4),bo.set(fn,Xt.clone().negate()),bo.far=D.r*8;const a=bo.intersectObject(e,!0)[0];return a?a.point.clone().addScaledVector(Xt,-s):null}function Ea({shadows:e}){const{scene:o}=es(Zo(ds)),{object:s,eyes:a,nose:i,mouth:l}=g.useMemo(()=>{const h=o.clone(!0),c=new ts().setFromObject(h),d=new v,u=new v;c.getSize(d),c.getCenter(u);const p=D.r*D.squash[1]*1.62,r=d.y>1e-4?p*Ft.height/d.y:1,f=D.r*D.squash[1]*Ft.lift;h.scale.setScalar(r),h.rotation.set(0,Ft.yaw,0),h.position.set(0,-u.y*r+f,0);const m=u.x*r,n=u.z*r,x=Math.cos(Ft.yaw),w=Math.sin(Ft.yaw);h.position.x=-(m*x+n*w),h.position.z=-(-m*w+n*x),h.updateMatrixWorld(!0);let y=0,z=0;const T={x:0,y:0,z:0},L=new v,R=[];h.traverse(k=>{k.isMesh&&R.push(k)});for(const k of R){const O=k.geometry.clone();for(const I of["position","normal"]){const P=O.attributes[I];if(!P||P.array instanceof Float32Array)continue;const K=new Float32Array(P.count*3);for(let J=0;J<P.count;J++)L.fromBufferAttribute(P,J),K[J*3]=L.x,K[J*3+1]=L.y,K[J*3+2]=L.z;O.setAttribute(I,new Q(K,3))}O.applyMatrix4(k.matrixWorld);const Z=O.attributes.position;z+=Z.count;for(let I=0;I<Z.count;I++)T.x=Z.getX(I)+D.x,T.y=Z.getY(I)+D.baseY,T.z=Z.getZ(I)+D.z,Co(T,.05)&&(Z.setXYZ(I,T.x-D.x,T.y-D.baseY,T.z-D.z),y++);y&&O.computeVertexNormals(),Z.needsUpdate=!0,O.computeBoundingSphere(),O.computeBoundingBox(),k.geometry=O,k.castShadow=e,k.receiveShadow=!1;const se=Array.isArray(k.material)?k.material:[k.material];for(const I of se)I.color?.multiply(Ra),I.roughness=.94,I.metalness=.02}for(const k of[h,...R])k.position.set(0,0,0),k.quaternion.identity(),k.scale.set(1,1,1),k.updateMatrix();h.updateMatrixWorld(!0);const G=(k,O=1)=>{const[Z,se,I]=D.squash;return new v(k[0]*D.r*Z*O,k[1]*D.r*se*O,k[2]*D.r*I*O)},F=Dt.map(k=>Ta(h,k,D.r*.1)??G(k,.82)),A=new v().addVectors(F[0],F[1]).multiplyScalar(.5),M=new v().addVectors(G(Dt[0],.82),G(Dt[1],.82)).multiplyScalar(.5),j=A.clone().sub(M),C=k=>{const O={x:k.x+D.x,y:k.y+D.baseY,z:k.z+D.z};return Co(O,.22)&&k.set(O.x-D.x,O.y-D.baseY,O.z-D.z),k};return{object:h,eyes:F.map(C),nose:C(G(Ko,.87).add(j)),mouth:C(G(qo,.9).add(j))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:s}),t.jsx(us,{eyes:a,nose:i,mouth:l,teeth:null,cast:e})]})}const Ra=new xe("#8f8a84");function us({eyes:e,nose:o,mouth:s,teeth:a,cast:i}){const l=g.useRef(),h=g.useRef(),c=g.useRef();return ee(()=>{const d=b.t,u=.82+.18*Math.sin(d*2.3)*Math.sin(d*.71),p=.82+.18*Math.sin(d*1.9+2.1)*Math.sin(d*.63),r=.86+.14*Math.sin(d*1.4+.8);l.current&&(l.current.emissiveIntensity=5.2*u+b.flash*2),h.current&&(h.current.emissiveIntensity=5.2*p+b.flash*2),c.current&&(c.current.emissiveIntensity=3.4*r)}),t.jsxs(t.Fragment,{children:[e.map((d,u)=>t.jsxs("mesh",{position:d,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[D.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:u===0?l:h,color:E.furnace,emissive:E.ember,emissiveIntensity:5.2,toneMapped:!1,side:ze,roughness:1})]},u)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[D.r*.046,D.r*.083,3]}),t.jsx("meshStandardMaterial",{color:E.emberDeep,emissive:E.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:s,children:[t.jsxs("mesh",{position:[0,D.r*.05,-D.r*.16],children:[t.jsx("planeGeometry",{args:[D.r*.62,D.r*.34]}),t.jsx("meshStandardMaterial",{ref:c,color:E.ember,emissive:E.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:ze})]}),a?.map((d,u)=>t.jsxs("mesh",{position:d.pos,scale:d.scale,rotation:[0,0,d.rot],castShadow:i,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:E.emberDeep,emissiveIntensity:.42,roughness:.78})]},u))]})]})}const Aa=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function Fa({quality:e="high",shadows:o=!0}){const a=Pe(ds)&&e!=="low"&&Aa!=="proc",{dome:i,hornL:l,hornR:h,teeth:c}=g.useMemo(()=>{const m=new Ds(D.r,ka[e]??7),n=m.attributes.position,x=new Float32Array(n.count*3),w=new xe(Y.rock),y=new xe(E.rockWarm),z=new xe("#120b10"),T=new xe,L=new v;for(let A=0;A<n.count;A++){L.set(n.getX(A),n.getY(A),n.getZ(A)).normalize();const M=D.r*Sa(L),[j,C,k]=D.squash;n.setXYZ(A,L.x*M*j,L.y*M*C,L.z*M*k);const O=Math.max(Math.pow(Math.max(0,L.dot(et[0])),5),Math.pow(Math.max(0,L.dot(et[1])),5),Math.pow(Math.max(0,L.dot(Po)),6)*.9);T.copy(w).lerp(y,Math.min(1,O*1.5+Math.max(0,L.z)*.22));const Z=Math.max(Math.pow(Math.max(0,L.dot(et[0])),40),Math.pow(Math.max(0,L.dot(et[1])),40));T.lerp(z,Z),x[A*3]=T.r,x[A*3+1]=T.g,x[A*3+2]=T.b}m.setAttribute("color",new Q(x,3)),m.computeVertexNormals();const R=new Os(1,1,1),G=[],F=9;for(let A=0;A<F;A++){const M=A/(F-1)*2-1,j=ie.halfWidth*2.1,C=M*j*.5,k=Math.pow(Math.abs(M),1.7)*14,O=46-Math.abs(M)*13+A%2*7;G.push({pos:[C,ie.height*.5-k-O*.5,6],scale:[j/F*.76,O,52],rot:M*.13})}return R.dispose?.(),{dome:m,hornL:mn(-1,e),hornR:mn(1,e),teeth:G}},[e]),d=o,[u,p,r]=D.squash,f=(m,n)=>[m.x*D.r*u*n,m.y*D.r*p*n,m.z*D.r*r*n];return t.jsx("group",{position:[D.x,D.baseY,D.z],children:a?t.jsx(g.Suspense,{fallback:t.jsx(xn,{dome:i,hornL:l,hornR:h,cast:d}),children:t.jsx(Ea,{shadows:d})}):t.jsxs(t.Fragment,{children:[t.jsx(xn,{dome:i,hornL:l,hornR:h,cast:d}),t.jsx(us,{eyes:et.map(m=>f(m,.82)),nose:f(hs,.87),mouth:f(Po,.96),teeth:c,cast:d})]})})}function xn({dome:e,hornL:o,hornR:s,cast:a}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:a,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:s,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function Ue({matrices:e,target:o}){const s=g.useRef(!1);return ee(()=>{if(s.current||!o.current)return;const a=Math.min(e.length,o.current.count);for(let i=0;i<a;i++)o.current.setMatrixAt(i,e[i]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),s.current=!0}),null}const gt=190,Ze=130,Zt=9.5;function gn(e,o,s,a=24){const i=new Tt(e),l=new Et(i,a,1,4,!1),h=l.attributes.position,c=new v(0,1,0),d=new v,u=new v,p=new v,r=new v,f=new v;for(let m=0;m<=a;m++){const n=m/a;i.getPointAt(n,u),i.getTangentAt(n,d),r.crossVectors(d,c).normalize(),p.crossVectors(r,d).normalize();for(let x=0;x<=4;x++){const w=m*5+x;if(w>=h.count)continue;const y=x/4*Math.PI*2+Math.PI/4,z=Math.cos(y)*o*.7071,T=Math.sin(y)*s*.7071;f.copy(u).addScaledVector(r,z).addScaledVector(p,T),h.setXYZ(w,f.x,f.y,f.z)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Ga(e,o,s,a=40){const i=[];for(let d=0;d<=10;d++){const u=d/10*2-1;i.push(new v(u*e,-30*(1-u*u),0))}const l=new Tt(i),h=new Et(l,a,s,8,!1),c=h.attributes.position;for(let d=0;d<=a;d++){const u=d/a*2-1,p=1+(1-u*u)*.85,r=l.getPointAt(d/a);for(let f=0;f<=8;f++){const m=d*9+f;m>=c.count||c.setXYZ(m,r.x+(c.getX(m)-r.x)*p,r.y+(c.getY(m)-r.y)*p,r.z+(c.getZ(m)-r.z)*p)}}return c.needsUpdate=!0,h.computeVertexNormals(),h}function wn({quality:e="high",shadows:o=!0,z:s=mt,k:a=_}){const i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=g.useMemo(()=>{const x=gt/2,w=Ze,y=gn([new v(-x-40,w+6,0),new v(-x-22,w+15.5,0),new v(0,w+20,0),new v(x+22,w+15.5,0),new v(x+40,w+6,0)],16,9,30),z=gn([new v(-x-30,w+2,0),new v(0,w+8,0),new v(x+30,w+2,0)],11,5,18);return{kasagi:y,shimaki:z,rope:Ga(x-6,30,6.4,44)}},[]),{tileM:u,merlonM:p,cannonM:r,lanternM:f}=g.useMemo(()=>{const x=new De,w=new We,y=new v,z=new v,T=[],L=e==="low"?26:54;for(let M=0;M<L;M++){const j=M/(L-1)*2-1,C=j*(gt/2+40),k=Ze+20-Math.pow(Math.abs(j),1.9)*14+5,O=-Math.sign(j)*Math.pow(Math.abs(j),3)*.5;z.set(C,k,0),w.setFromEuler(new pt(0,0,O)),y.set(1,1,1),T.push(x.clone().compose(z,w,y))}const R=[];for(const M of[-1,1])for(let j=0;j<7;j++)z.set(M*(58+j*12),26,0),w.identity(),y.set(1,1,1),R.push(x.clone().compose(z,w,y));const G=[];for(const M of[-1,1])for(let j=0;j<2;j++)for(let C=0;C<4-j;C++)z.set(M*(64+C*13+j*6),32+j*10,8),w.setFromEuler(new pt(Math.PI/2-.16,0,0)),y.set(1,1,1),G.push(x.clone().compose(z,w,y));const F=[],A=e==="low"?10:22;for(let M=0;M<A;M++){const j=M/(A-1)*2-1,C=j*(gt/2-12),k=30*(1-j*j);z.set(C,Ze-34-k-7.5,0),w.identity(),y.set(1,1,1),F.push(x.clone().compose(z,w,y))}return{tileM:T,merlonM:R,cannonM:G,lanternM:F}},[e]);ee(()=>{const x=b.t;i.current&&(i.current.material.emissiveIntensity=2.6+Math.sin(x*3.1)*.22+Math.sin(x*7.7)*.1+b.flash*1.4)});const m=gt/2,n=o;return t.jsxs("group",{position:[0,0,s],scale:a,children:[[-1,1].map(x=>t.jsxs("group",{position:[x*m,0,0],children:[t.jsxs("mesh",{position:[0,Ze/2-30,0],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[Zt*.86,Zt,Ze+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[Zt*1.5,Zt*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},x)),t.jsxs("mesh",{position:[0,Ze-26,0],castShadow:n,children:[t.jsx("boxGeometry",{args:[gt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:d.shimaki,castShadow:n,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:d.kasagi,castShadow:n,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:l,args:[null,null,u.length],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(Ue,{matrices:u,target:l})]}),t.jsxs("mesh",{position:[0,Ze-6,0],castShadow:n,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,Ze-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:d.rope,position:[0,Ze-34,2],castShadow:n,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(x=>{const w=30*(1-(x/(gt/2-6))**2);return t.jsx("group",{position:[x,Ze-34-w-4,2],children:[0,1,2].map(y=>t.jsxs("mesh",{position:[y%2?1.1:-1.1,-2.4-y*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:ze})]},y))},x)}),[-1,1].map(x=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[x*108,6,0],castShadow:n,receiveShadow:n,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[x*108,30,6],castShadow:n,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.88})]}),t.jsxs("mesh",{position:[x*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},x)),t.jsxs("instancedMesh",{ref:c,args:[null,null,p.length],castShadow:n,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(Ue,{matrices:p,target:c})]}),t.jsxs("instancedMesh",{ref:h,args:[null,null,r.length],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(Ue,{matrices:r,target:h})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,f.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Ue,{matrices:f,target:i})]})]})}const La=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const s=o.getContext("2d"),a=s.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=a,s.fillRect(0,0,e,e),s.translate(e/2,e/2);for(let l=0;l<4;l++){const h=s.createLinearGradient(0,0,e/2,0);h.addColorStop(0,"rgba(255,255,255,0.95)"),h.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=h,s.beginPath(),s.moveTo(0,-2.5),s.lineTo(e/2,0),s.lineTo(0,2.5),s.closePath(),s.fill(),s.rotate(Math.PI/2)}const i=new Wt(o);return i.colorSpace=$t,i})();function Ia(e,o,s,a){const i=[];for(let l=0;l<=a;l++){const h=l/a,c=h*2-1;i.push(new v(e[0]+(o[0]-e[0])*h,e[1]+(o[1]-e[1])*h-s*(1-c*c),e[2]+(o[2]-e[2])*h))}return i}const Ca=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Pa({quality:e="high",shadows:o=!0}){const s=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{lanternM:h,lampM:c,pilingM:d,katanaY:u,ground:p}=g.useMemo(()=>{const m=new De,n=new We,x=new v(1,1,1),w=new v,y=[],z=e==="low"?.42:e==="mid"?.72:1;for(const[G,F,A]of Ca){const M=Math.max(4,Math.round(A*z)),j=Ia(G,F,14,M);for(let C=1;C<j.length-1;C++){const k=.78+C*37%11/22;w.copy(j[C]).add(new v(0,-4.2*k,0)),n.setFromEuler(new pt(0,C*1.7%Math.PI,(C%3-1)*.06)),y.push(m.clone().compose(w,n,x.clone().multiplyScalar(k)))}}const T=[],L=e==="low"?6:11;for(let G=0;G<L;G++){const F=G/(L-1);for(const A of[-1,1]){const M=S.lerp(X.x+46,ie.x-6,F)+A*(26-F*9),j=S.lerp(X.z-26,ie.z+32,F);w.set(M,re(M,j)+5,j),n.identity(),T.push(m.clone().compose(w,n,x))}}const R=[];for(let G=0;G<16;G++){const F=G%2,A=Math.floor(G/2);w.set(X.x+30+A*17,-2,X.z+34+F*26),n.setFromEuler(new pt(0,0,(G%3-1)*.035)),R.push(m.clone().compose(w,n,x))}return{lanternM:y,lampM:T,pilingM:R,katanaY:re(X.x+118,X.z-58),ground:X.y}},[e]);ee(()=>{const m=b.t;if(s.current&&(s.current.material.emissiveIntensity=2.4+Math.sin(m*2.7)*.2+Math.sin(m*6.1+1.3)*.12+b.flash*1.6),l.current){const n=46*(1+Math.sin(m*1.3)*.13);l.current.scale.set(n,n,1),l.current.material.rotation=m*.07}});const r=o,f=(m,n)=>re(X.x+m,X.z+n);return t.jsxs("group",{children:[t.jsxs("group",{position:[X.x,0,X.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(m=>t.jsxs("group",{position:[52+m*26,1.5,92+m%2*13],rotation:[0,.4+m*.3,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:ze})]})]},m))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(Ue,{matrices:d,target:i})]}),t.jsxs("group",{position:[X.x+118,u,X.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:r,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:l,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:La,color:E.furnace,transparent:!0,opacity:.75,blending:Qe,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(m=>{const n=96+m*4,x=88*m;return t.jsxs("group",{position:[X.x+n,f(n,x),X.z+x],rotation:[0,-m*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:r,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:r,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(w=>t.jsxs("mesh",{position:[w*3,37,4],rotation:[0,0,w*.3],castShadow:r,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},w)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.9,side:ze})]})]},m)}),[-1,1].map(m=>{const n=40+m*34,x=-18+m*46;return t.jsxs("group",{position:[X.x+n,f(n,x)+12,X.z+x],rotation:[0,m*.8,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(w=>t.jsxs("mesh",{position:[w*5,7,-1],rotation:[0,0,w*-.5],castShadow:r,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},w)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:E.ember,emissive:E.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:ze})]})]},m)}),t.jsxs("group",{position:[X.x-34,f(-34,30)+2,X.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.88,side:ze,emissive:E.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(m,n)=>{const x=n/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(x)*26,55.5,Math.sin(x)*26],rotation:[0,-x,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},n)}),Array.from({length:10},(m,n)=>{const x=n/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(x)*32,44,Math.sin(x)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.5,toneMapped:!1})]},n)})]}),[0,1,2,3].map(m=>{const n=8+m*30,x=-70-m%2*14;return t.jsxs("group",{position:[X.x+n,f(n,x),X.z+x],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:m%2?"#e8dcc4":E.vermilion,roughness:.95,side:ze})]})]},m)}),[0,1,2].map(m=>{const n=.28+m*.24,x=S.lerp(X.x+46,ie.x,n),w=S.lerp(X.z-26,ie.z+26,n),y=re(x,w),z=1-m*.1;return t.jsxs("group",{position:[x,y,w],scale:z,children:[[-1,1].map(T=>t.jsxs("mesh",{position:[T*15,17,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},T)),t.jsxs("mesh",{position:[0,36,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.75})]})]},m)}),t.jsx("group",{position:[X.x,p,X.z],children:t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(Ue,{matrices:h,target:s})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:r,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:E.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(Ue,{matrices:c,target:a})]})]})}const yn={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function Da(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Oa({quality:e="high",shadows:o=!0}){const s=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{pineTrunkM:h,pineCanopyM:c,sakuraM:d,rockM:u}=g.useMemo(()=>{const r=yn[e]??yn.high,f=Da(20250801),m=new De,n=new We,x=new v,w=new v,y=new v(0,1,0),z=new v,T=[],L=[],R=[],G=r.pine+r.sakura+r.rock;let F=0,A=0;for(;F<G&&A<G*60;){A++;const M=f()*Math.PI*2,j=ot*(.55+f()*.62),C=ce.x+Math.sin(M)*j,k=ce.z+Math.cos(M)*j,O=re(C,k);if(O<5||O>300||ea(C,k,6)>.72||Math.hypot(C-D.x,k-D.z)<D.r*1.35)continue;const Z=C>ce.x+(f()-.5)*90,se=F;if(F++,w.set(C,O,k),se<r.rock){const I=Jo(C,k,5);z.set(I[0],I[1],I[2]),n.setFromUnitVectors(y,z),n.multiply(new We().setFromEuler(new pt(f()*.5,f()*6.28,f()*.5)));const P=2.5+f()*7;x.set(P*(.7+f()*.6),P*(.5+f()*.5),P*(.7+f()*.6)),w.y-=P*.25,R.push(m.clone().compose(w,n,x))}else if(Z){if(T.length>=r.pine)continue;n.setFromEuler(new pt(0,f()*6.28,(f()-.5)*.09));const I=.72+f()*.7;x.set(I,I*(.85+f()*.45),I),T.push(m.clone().compose(w,n,x))}else{if(L.length>=r.sakura)continue;n.setFromEuler(new pt(0,f()*6.28,(f()-.5)*.13));const I=.7+f()*.75;x.set(I,I*(.8+f()*.5),I),L.push(m.clone().compose(w,n,x))}}return{pineTrunkM:T.map(M=>M.clone().multiply(Na)).concat(L.map(M=>M.clone().multiply(Ba))),pineCanopyM:T.map(M=>M.clone().multiply(Ha)),sakuraM:L.map(M=>M.clone().multiply(_a)),rockM:R}},[e]),p=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:p,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(Ue,{matrices:h,target:s})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:p,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:Y.pine,roughness:.93,flatShading:!0}),t.jsx(Ue,{matrices:c,target:a})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:p,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:E.sakura,roughness:.95,flatShading:!0,emissive:E.sakura,emissiveIntensity:.1}),t.jsx(Ue,{matrices:d,target:i})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,u.length],castShadow:p,receiveShadow:p,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:Y.rock,roughness:.97,flatShading:!0}),t.jsx(Ue,{matrices:u,target:l})]})]})}const Na=new De().makeTranslation(0,7,0),Ha=new De().makeTranslation(0,26,0),_a=new De().compose(new v(0,13,0),new We,new v(1,.72,1)),Ba=new De().compose(new v(0,5,0),new We,new v(.75,.62,.75));function Ua({url:e,height:o,rotation:s,tint:a,emissive:i,emissiveIntensity:l}){const{scene:h}=es(e),c=g.useMemo(()=>h.clone(!0),[h]),d=g.useMemo(()=>{const u=new ts().setFromObject(c),p=new v;u.getSize(p);const r=p.y>1e-4?o/p.y:1,f=new v;return u.getCenter(f),{scale:r,offset:[-f.x*r,-u.min.y*r,-f.z*r]}},[c,o]);return g.useEffect(()=>{c.traverse(u=>{if(u.isMesh&&(u.castShadow=!0,u.receiveShadow=!0,a&&u.material)){const p=Array.isArray(u.material)?u.material:[u.material];for(const r of p)r.color?.multiply(new xe(a)),i&&r.emissive&&(r.emissive.set(i),r.emissiveIntensity=l??.2)}})},[c,a,i,l]),t.jsx("group",{rotation:[0,s,0],scale:d.scale,position:d.offset,children:t.jsx("primitive",{object:c})})}class Wa extends g.Component{constructor(){super(...arguments);rn(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(s){}render(){return this.state.failed?this.props.fallback:this.props.children}}function pe({name:e,height:o,rotation:s=0,position:a=[0,0,0],tint:i=null,emissive:l=null,emissiveIntensity:h=.2,fallback:c=null}){const d=Zo(e);return Pe(e)?t.jsx("group",{position:a,children:t.jsx(Wa,{url:d,fallback:c,children:t.jsx(g.Suspense,{fallback:c,children:t.jsx(Ua,{url:d,height:o,rotation:s,tint:i,emissive:l,emissiveIntensity:h})})})}):t.jsx("group",{position:a,children:c})}const Je=Math.PI,bn={"ship-sunny.opt.glb":Je/2,"ship-tang.opt.glb":Je/2,"ship-punk.opt.glb":Je/2,"ship-lion.opt.glb":Je/2,"ship-bone.opt.glb":Je/2,"ship-junk.opt.glb":Je/2,"ship-warjunk.opt.glb":Je/2,"ship-sub.opt.glb":-Je/2},go=e=>e&&bn[e]!==void 0?bn[e]:Je/2,vn={"ship-sunny.opt.glb":78,"ship-punk.opt.glb":84,"ship-tang.opt.glb":32,"ship-lion.opt.glb":76,"ship-bone.opt.glb":82,"ship-junk.opt.glb":56,"ship-warjunk.opt.glb":88},Bt=(e,o)=>e&&vn[e]!==void 0?vn[e]:o,lo=160,Mt=112,Ot="#e6dfcf",ps="#0c0a15",jt=ps;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,s,a,i){const l=Math.min(i??0,Math.abs(s)/2,Math.abs(a)/2);return this.moveTo(e+l,o),this.arcTo(e+s,o,e+s,o+a,l),this.arcTo(e+s,o+a,e,o+a,l),this.arcTo(e,o+a,e,o,l),this.arcTo(e,o,e+s,o,l),this.closePath(),this});function wt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=lo,o.height=Mt;const s=o.getContext("2d"),a=s.createLinearGradient(0,0,0,Mt);a.addColorStop(0,"#14101f"),a.addColorStop(.5,ps),a.addColorStop(1,"#08060f"),s.fillStyle=a,s.fillRect(0,0,lo,Mt),s.fillStyle="rgba(255,255,255,0.07)",s.fillRect(0,0,5,Mt),s.save(),s.translate(lo/2+4,Mt/2);try{e(s)}catch(l){console.warn("[onigashima] flag emblem skipped",l)}s.restore();const i=new Wt(o);return i.colorSpace=$t,i.anisotropy=4,i}function vo(e,o,s=Ot){e.fillStyle=s,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Mo(e,o,s=1){e.save(),e.fillStyle=jt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*s,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*s,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Mn(e,o,s=4){e.save(),e.fillStyle=jt;for(let a=1;a<s;a++){const i=-o*.5+a*o/s;e.fillRect(i-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function jn(e,o,s=Ot){e.save(),e.strokeStyle=s,e.lineWidth=o*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=s;for(const i of[-1,1])for(const l of[-.16,.16])e.beginPath(),e.arc(i*o*1.55,o*.55+l*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const $a={straw:wt(e=>{jn(e,26),vo(e,26),Mo(e,26),Mn(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:wt(e=>{const s="#a8e8d4";e.fillStyle=s,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=jt;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=jt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:wt(e=>{jn(e,26,"#d8cfc0"),e.fillStyle=Ot,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=jt;for(const s of[-1,1])e.save(),e.translate(s*26*.4,-26*.3),e.rotate(s*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let s=0;s<6;s++){const a=-15.6+s*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:wt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let s=0;s<5;s++){const a=s/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:wt(e=>{e.fillStyle=Ot;for(const s of[-1,1])e.beginPath(),e.moveTo(s*25*.5,-25*.85),e.lineTo(s*25*1.02,-25*1.72),e.lineTo(s*25*1.06,-25*.6),e.closePath(),e.fill();vo(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Mo(e,25,.85),e.save(),e.fillStyle=jt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Ot;for(const s of[-1,1])e.beginPath(),e.moveTo(s*25*.3,25*.7),e.lineTo(s*25*.42,25*1.42),e.lineTo(s*25*.16,25*.78),e.closePath(),e.fill()}),beasts:wt(e=>{e.fillStyle="#cfd8e4";for(const s of[-1,1])e.beginPath(),e.moveTo(s*26*.62,-26*.78),e.quadraticCurveTo(s*26*1.5,-26*1.5,s*26*1.18,-26*2),e.quadraticCurveTo(s*26*1.42,-26*1.35,s*26*.86,-26*.5),e.closePath(),e.fill();vo(e,26,"#cfd8e4"),Mo(e,26),Mn(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},ms={value:0},Sn=new Map;function Va(e){const o=Sn.get(e);if(o)return o;const s=$a[e],a=new Hs({map:s,emissiveMap:s,emissive:new xe("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:ze,transparent:!1});return a.onBeforeCompile=i=>{i.uniforms.uTime=ms,i.vertexShader=`uniform float uTime;
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
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Sn.set(e,a),a}function Ya(){return ee((e,o)=>{ms.value+=Math.min(o,.05)}),null}const Xa=(()=>{const e=new Yo(1,1,14,5);return e.translate(.5,0,0),e})();function Ut({crew:e="straw",width:o=16,position:s=[0,0,0],rotation:a=Math.PI/2,staff:i=!0}){const l=g.useMemo(()=>Va(e)??null,[e]),h=o*(Mt/lo);return l?t.jsxs("group",{position:s,rotation:[0,a,0],children:[i&&t.jsxs("mesh",{position:[0,h*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,h*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:Xa,material:l,scale:[o,h,o]})]}):null}const zn=(()=>{if(typeof document>"u")return null;const e=64,o=128,s=document.createElement("canvas");s.width=e,s.height=o;const a=s.getContext("2d"),i=a.createImageData(e,o);for(let h=0;h<o;h++){const c=h/(o-1),d=Math.pow(1-c,1.7);for(let u=0;u<e;u++){const p=u/(e-1)*2-1,r=Math.max(0,1-Math.abs(p)/(.35+c*.65)),f=.45+.55*Math.pow(Math.abs(p)/(.35+c*.65),1.5),m=d*Math.pow(r,1.4)*f,n=(h*e+u)*4;i.data[n]=255,i.data[n+1]=255,i.data[n+2]=255,i.data[n+3]=Math.round(Math.min(1,m)*255)}}a.putImageData(i,0,0);const l=new Wt(s);return l.colorSpace=$t,l})(),jo=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:E.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:E.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",height2:58,model:"ship-lion.opt.glb",height:56,tint:"#c98a52",crew:"crew-straw.opt.glb",crewH:13},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",height2:62,model:"ship-bone.opt.glb",height:60,tint:"#9a6a4e",crew:"crew-punk.opt.glb",crewH:12},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",height2:24,model:"ship-sub.opt.glb",height:21,tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:E.lantern,model:"ship-junk.opt.glb",height:44,tint:"#8a7a62",crew:"crew-samurai.opt.glb",crewH:11},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:E.lantern,model:"ship-junk.opt.glb",height:40,tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:E.lantern,model:"ship-junk.opt.glb",height:46,tint:"#6e6a54",crew:"crew-samurai.opt.glb",crewH:11},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:E.lantern,model:"ship-junk.opt.glb",height:38,tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:E.lantern,model:"ship-junk.opt.glb",height:36,tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:E.lantern,model:"ship-junk.opt.glb",height:40,tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:E.lantern,model:"ship-junk.opt.glb",height:42,tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:E.lantern,model:"ship-junk.opt.glb",height:37,tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:E.lantern,model:"ship-junk.opt.glb",height:35,tint:"#6a5c47"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:E.lantern,model:"ship-junk.opt.glb",height:41,tint:"#6c684f"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:E.lantern,model:"ship-junk.opt.glb",height:38,tint:"#77694f"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:E.lantern,model:"ship-junk.opt.glb",height:36,tint:"#6d5f4a"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:E.lantern,model:"ship-junk.opt.glb",height:34,tint:"#665945"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:E.lantern,model:"ship-junk.opt.glb",height:39,tint:"#666249"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:E.lantern,model:"ship-junk.opt.glb",height:35,tint:"#71634c"}];function Za(e){const o=S.lerp(820*_,150*_,e);return[(Math.sin(e*2.4)*54-e*26)*_,o]}function Ka({spec:e,quality:o}){const s=g.useRef(),a=g.useRef(),i=g.useRef();ee(()=>{const f=s.current;if(!f)return;const m=S.clamp(b.progress*.82+.04,0,1),[n,x]=Za(m),w=n+e.off*_*.94,y=x-e.lead*_*.98,z=_t(w,y),T=S.clamp(-re(w,y)/46,0,1),L=S.lerp(1,.055,z)*S.smoothstep(T,0,.28),R=Be(w,y,b.t,L),G=e.sub?S.smoothstep(b.progress,.42,.6):0;f.position.set(w,R.y-(e.sub?4.5:1.2)*e.scale-G*40,y);const F=e.sub?.35:1;f.rotation.x=S.clamp(R.dz*1.35*F,-.32,.32),f.rotation.z=S.clamp(-R.dx*1.15*F,-.28,.28),f.rotation.y=Math.PI+Math.sin(b.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(b.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(b.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-z)*.75)*(1-G))});const l=e.scale,h=o==="low"?6:10,c=Pe(e.model2??""),d=Pe(e.model??""),u=c?e.model2:d?e.model:null,p=Bt(u,c?e.height2:e.height),r=Pe(e.crew??"");return u?t.jsxs("group",{ref:s,children:[t.jsx(pe,{name:u,height:p,rotation:go(u),position:[0,-p*.18,0],tint:c?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),r&&t.jsx(pe,{name:e.crew,height:e.crewH,rotation:0,position:[0,p*.2,2*l]}),e.flag&&t.jsx(Ut,{crew:e.flag,width:p*(e.sub?.5:.32),position:[0,p*(e.sub?.55:.66),-4*l],staff:!!e.sub}),t.jsxs("mesh",{position:[0,p*.5,-8*l],children:[t.jsx("sphereGeometry",{args:[1.6,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:zn,color:Y.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:s,children:[t.jsxs("group",{scale:l,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,h]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:ze,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(f=>[0,1,2,3].map(m=>t.jsxs("mesh",{position:[f*5.6,3.4,-6+m*4],rotation:[0,0,f*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${f}-${m}`))),e.flag&&t.jsx(Ut,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:zn,color:Y.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function kn({x:e,z:o,yaw:s,name:a,height:i,tint:l,sunk:h=.18,flag:c=null}){const d=Bt(a,i),u=g.useRef(),p=Pe(a);return ee(()=>{const r=u.current;if(!r)return;const f=_t(e,o),m=S.clamp(-re(e,o)/46,0,1),n=S.lerp(1,.055,f)*S.smoothstep(m,0,.28),x=Be(e,o,b.t,n);r.position.set(e,x.y-1.5,o),r.rotation.set(S.clamp(x.dz*1.1,-.25,.25),s+Math.sin(b.t*.22+e)*.04,S.clamp(-x.dx,-.22,.22))}),t.jsxs("group",{ref:u,children:[t.jsx(pe,{name:a,height:d,rotation:go(a),position:[0,-d*h,0],tint:l,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),c&&p&&t.jsx(Ut,{crew:c,width:d*.3,position:[0,d*.62,-4]})]})}const qa=[{x:-190*_,z:320*_,yaw:.35},{x:168*_,z:438*_,yaw:-.55},{x:-88*_,z:540*_,yaw:.12},{x:236*_,z:690*_,yaw:-.28},{x:-262*_,z:748*_,yaw:.48},{x:96*_,z:880*_,yaw:-.16}],Qa=[{x:X.x+132*_*.72,z:X.z+96*_*.72,yaw:2.3},{x:X.x+168*_*.72,z:X.z+40*_*.72,yaw:1.9},{x:X.x+96*_*.72,z:X.z+150*_*.72,yaw:2.7}];function Ja({quality:e="high"}){const o=g.useMemo(()=>e==="low"?jo.slice(0,5):e==="mid"?jo.slice(0,11):jo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Ya,{}),o.map(s=>t.jsx(Ka,{spec:s,quality:e},s.id)),e!=="low"&&qa.map((s,a)=>t.jsx(kn,{...s,name:"ship-warjunk.opt.glb",height:64,tint:"#8a8560",flag:"beasts"},`picket-${a}`)),e!=="low"&&Qa.map((s,a)=>t.jsx(kn,{...s,name:"ship-junk.opt.glb",height:40,tint:"#7e7058",flag:"kozuki"},`moored-${a}`))]})}const er="#2e2a33",Do="#3a4152",Oo=Y.snow,po="#cfe0f4";function Tn({position:e}){return t.jsx("group",{position:e,children:t.jsx(pe,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Do,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Do,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:po,emissive:po,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Oo,roughness:.9})]})]})})})}function tr({shadows:e=!0}){const o=g.useMemo(()=>Math.atan2($.dir[0],$.dir[1]),[]);return t.jsxs("group",{position:[$.gate.x,$.benchY,$.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(s=>t.jsxs("mesh",{position:[0,.7+s*1.3,6-s*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-s*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Do,roughness:.92})]},s)),t.jsx(pe,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:er,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Oo,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Oo,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(s=>t.jsxs("mesh",{position:[s,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},s)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(s=>t.jsxs("mesh",{position:[s,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:ze})]},s)),[-9,9].map(s=>t.jsxs("mesh",{position:[s,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:po,emissive:po,emissiveIntensity:1.4,toneMapped:!1})]},s))]})}),t.jsx(Tn,{position:[-14,0,10]}),t.jsx(Tn,{position:[14,0,10]}),[-8,0,8].map(s=>t.jsxs("mesh",{position:[s+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},s))]})}const Kt=new xe,No={color:"#7fd8c8",intensity:9e3,distance:320},So={color:"#ffc48a",intensity:12e3,distance:300},or=new xe(No.color),nr={low:1,mid:2,high:4},yt=[{pos:[X.x,40,X.z],color:E.lantern,intensity:16e3,distance:460*_*.65},{pos:[0,78,mt],color:E.lantern,intensity:15e3,distance:430},{pos:[ie.x,ie.y+6,ie.z-30],color:E.emberDeep,intensity:3e4,distance:640},{pos:[$.gate.x,30,$.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function sr({quality:e="high",shadowMap:o=2048,shadows:s=!0}){const a=g.useRef(),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=g.useRef(),u=Me(r=>r.camera),p=nr[e]??5;return ee(()=>{if(a.current){a.current.intensity=b.flash*9e3;const m=b.flashDir;a.current.position.set(m.x*700,260+m.y*500,ce.z+m.z*700)}const r=b.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(r*2.3)*Math.sin(r*.71))),l.current&&(l.current.intensity=62e3*(.86+.14*Math.sin(r*1.9+2.1)*Math.sin(r*.63)));const f=b.inside;if(c.current&&(c.current.intensity=.16+f*.3),d.current&&(d.current.intensity=.34+f*.26),h.current){const m=h.current,n=.06;let x=yt[0],w=1/0;for(const y of yt){const z=(u.position.x-y.pos[0])**2+(u.position.z-y.pos[2])**2;z<w&&(w=z,x=y)}if(b.subActive&&w>550*550){const y=b.subPos,z=Math.min(1,b.underwater/.35);m.position.x+=(y.x-m.position.x)*.3,m.position.y+=(y.y+14-m.position.y)*.3,m.position.z+=(y.z-m.position.z)*.3,Kt.set(So.color).lerp(or,z),m.color.lerp(Kt,n),m.intensity+=(S.lerp(So.intensity,No.intensity,z)-m.intensity)*n,m.distance=S.lerp(So.distance,No.distance,z)}else if(b.helmActive&&w>550*550){const y=b.helmPos;m.position.x+=(y.x-m.position.x)*.25,m.position.y+=(y.y+16-m.position.y)*.25,m.position.z+=(y.z-m.position.z)*.25,m.color.lerp(Kt.set(E.lantern),n),m.intensity+=(11e3-m.intensity)*n,m.distance=300}else m.position.x+=(x.pos[0]-m.position.x)*n,m.position.y+=(x.pos[1]-m.position.y)*n,m.position.z+=(x.pos[2]-m.position.z)*n,m.color.lerp(Kt.set(x.color),n),m.intensity+=(x.intensity-m.intensity)*n,m.distance=x.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:c,intensity:.16,color:Y.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[Y.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:s,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(_/1.55),"shadow-camera-right":520*(_/1.55),"shadow-camera-top":520*(_/1.55),"shadow-camera-bottom":-520*(_/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:p>=2?[be[0].x,be[0].y,be[0].z]:[(be[0].x+be[1].x)/2,be[0].y,be[0].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),p>=2&&t.jsx("pointLight",{ref:l,position:[be[1].x,be[1].y,be[1].z],color:E.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:h,position:yt[0].pos,color:yt[0].color,intensity:yt[0].intensity,distance:yt[0].distance,decay:2}),p>=3&&t.jsx("pointLight",{position:[ie.x,ie.y+4,ie.z-34],color:E.emberDeep,intensity:3e4,distance:640,decay:2}),p>=4&&t.jsx("pointLight",{position:[0,78,mt],color:E.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:Y.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function zo(e,o){let s=e>>>0;const a=()=>(s=Math.imul(s,1664525)+1013904223>>>0,s/4294967296),i=[],l=o==="low"?3:5,h=(n,x,w,y,z)=>{const T=[n.clone()],L=n.clone();for(let G=0;G<y;G++)L.add(new v((a()-.5)*w*.55,-w/y,(a()-.5)*w*.42)).add(x.clone().multiplyScalar(w/y*.3)),T.push(L.clone());const R=new Et(new Tt(T),y*2,z,l,!1);return i.push(R),T},c=h(new v(0,620,0),new v(0,0,0),620,9,3.4),d=o==="low"?1:3;for(let n=0;n<d;n++){const x=c[2+Math.floor(a()*(c.length-3))];h(x.clone(),new v(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let u=0;for(const n of i)u+=n.attributes.position.count;const p=new Float32Array(u*3),r=new Float32Array(u*3);let f=0;for(const n of i)p.set(n.attributes.position.array,f*3),r.set(n.attributes.normal.array,f*3),f+=n.attributes.position.count,n.dispose();const m=new lt;return m.setAttribute("position",new Q(p,3)),m.setAttribute("normal",new Q(r,3)),m}function ar({quality:e}){const o=[g.useRef(),g.useRef(),g.useRef()],s=g.useRef(2.5),a=g.useRef({i:0,t:-1,dur:0,flicker:0}),i=g.useMemo(()=>[zo(40503,e),zo(20973,e),zo(10196,e)],[e]);return ee((l,h)=>{const c=Math.min(h,.05),d=a.current;if(s.current-=c,s.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const u=o[d.i].current;if(u){const p=(Math.random()-.5)*2.4-Math.PI*.5,r=620+Math.random()*760;u.position.set(ce.x+Math.cos(p)*r,40+Math.random()*120,ce.z+Math.sin(p)*r*.7-240),u.rotation.y=Math.random()*Math.PI*2;const f=.7+Math.random()*.8;u.scale.set(f,f,f),b.flashDir.set(u.position.x,u.position.y+400,u.position.z).normalize()}s.current=S.lerp(6.5,2.2,b.progress)*(.45+Math.random())}if(d.t>=0){d.t+=c;const u=d.t/d.dur,p=Math.abs(Math.sin(u*Math.PI*d.flicker)),r=Math.max(0,1-u);b.flash=r*r*p;const f=o[d.i].current;f&&(f.material.opacity=Math.min(1,b.flash*2.2)),u>=1&&(d.t=-1,b.flash=0,f&&(f.material.opacity=0))}else b.flash*=Math.pow(1e-4,c)}),t.jsx(t.Fragment,{children:i.map((l,h)=>t.jsx("mesh",{ref:o[h],geometry:l,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:Y.bolt,transparent:!0,opacity:0,blending:Qe,depthWrite:!1,toneMapped:!1})},h))})}const rr=`
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
`,ir=`
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
`,En={low:1600,mid:3800,high:7e3},qt=460;function lr({quality:e}){const o=g.useRef(),s=Me(l=>l.camera),a=g.useMemo(()=>{const l=En[e]??En.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l);for(let p=0;p<l;p++)h[p*3]=Math.random()*qt,h[p*3+1]=Math.random()*qt,h[p*3+2]=Math.random()*qt,c[p]=.7+Math.random()*.6,d[p]=.55+Math.random()*.85;const u=new lt;return u.setAttribute("position",new Q(h,3)),u.setAttribute("aSpeed",new Q(c,1)),u.setAttribute("aLen",new Q(d,1)),u.boundingSphere=new Rt(new v,1e6),u},[e]),i=g.useMemo(()=>({uTime:{value:0},uCam:{value:new v},uBox:{value:qt},uFall:{value:118},uSize:{value:2.4},uColor:{value:new v(...oe("#b9c8e4"))},uOpacity:{value:.5}}),[]);return ee((l,h)=>{const c=o.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(s.position),c.uOpacity.value=.5*b.rain*b.rain+b.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:rr,fragmentShader:ir,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const cr=`
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
`,hr=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Rn={low:120,mid:340,high:700};function dr({quality:e}){const o=g.useRef(),s=g.useMemo(()=>{const i=Rn[e]??Rn.high,l=[be[0],be[1],ie,ie],h=new Float32Array(i*3),c=new Float32Array(i),d=new Float32Array(i),u=new Float32Array(i);for(let r=0;r<i;r++){const f=l[r%l.length];h[r*3]=f.x+(Math.random()-.5)*74,h[r*3+1]=f.y+(Math.random()-.5)*30,h[r*3+2]=f.z+(Math.random()-.5)*26,c[r]=Math.random(),d[r]=.045+Math.random()*.055,u[r]=2+Math.random()*4}const p=new lt;return p.setAttribute("position",new Q(h,3)),p.setAttribute("aPhase",new Q(c,1)),p.setAttribute("aRise",new Q(d,1)),p.setAttribute("aSize",new Q(u,1)),p.boundingSphere=new Rt(new v(0,300,-260),700),p},[e]),a=g.useMemo(()=>({uTime:{value:0},uColor:{value:new v(...oe(E.ember))}}),[]);return ee((i,l)=>{o.current&&(o.current.uniforms.uTime.value+=l)}),t.jsx("points",{geometry:s,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:cr,fragmentShader:hr,uniforms:a,transparent:!0,depthWrite:!1,blending:Qe,fog:!1})})}function ur({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ar,{quality:e}),t.jsx(lr,{quality:e}),t.jsx(dr,{quality:e})]})}const pr=`
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
`,mr=`
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
`,An={low:150,mid:380,high:620};function fr({whirl:e,quality:o}){const s=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const h=An[o]??An.high,c=new Float32Array(h*3),d=new Float32Array(h),u=new Float32Array(h),p=new Float32Array(h),r=new Float32Array(h),f=new Float32Array(h);for(let n=0;n<h;n++)d[n]=Math.random()*Math.PI*2,u[n]=Math.random(),p[n]=.05+Math.random()*.05,r[n]=3+Math.random()*6,f[n]=Math.random();const m=new lt;return m.setAttribute("position",new Q(c,3)),m.setAttribute("aAngle",new Q(d,1)),m.setAttribute("aPhase",new Q(u,1)),m.setAttribute("aRate",new Q(p,1)),m.setAttribute("aSize",new Q(r,1)),m.setAttribute("aJitter",new Q(f,1)),m.boundingSphere=new Rt(new v(e.x,0,e.z),e.r*1.6+40),m},[o,e]),l=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new Xo(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new v(...oe(Y.foam))},uGain:{value:1}}),[e]);return ee((h,c)=>{const d=s.current?.uniforms;if(!d)return;d.uTime.value+=c;const u=Math.hypot(h.camera.position.x-e.x,h.camera.position.z-e.z);d.uGain.value=1-S.smoothstep(u,1600,2400),a.current&&(a.current.visible=d.uGain.value>.02)}),t.jsx("points",{ref:a,geometry:i,renderOrder:2,children:t.jsx("shaderMaterial",{ref:s,vertexShader:pr,fragmentShader:mr,uniforms:l,transparent:!0,depthWrite:!1,blending:Qe,fog:!1})})}function xr({quality:e="high"}){const o=Me(s=>s.camera);return ee(()=>{let s=0;for(const a of Ee){const i=Math.hypot(o.position.x-a.x,o.position.z-a.z);s=Math.max(s,1-S.smoothstep(i,a.r*.3,a.r*2.2))}b.whirlNear+=(s-b.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ee.map((s,a)=>t.jsx(fr,{whirl:s,quality:e},a))})}const U={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},kt={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<Ht-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*_},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<mt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*_},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=Zs("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<$.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},gr=e=>kt[e]?kt[e].length:0,wr=()=>U.chain&&kt[U.chain]?kt[U.chain][U.step]??null:null;function Ho(e){U.chain=kt[e]?e:null,U.step=0,U.hull=1,U.grip=0,U.clock=0,U.done=!1,U.banner=null,U.rev++}function mo(e,o,s=3.4){U.banner={text:e,sub:o,until:U.clock+s},U.rev++}function St(e,o){U.hull<=0||(U.hull=Math.max(0,U.hull-e),U.hits++,U.hull<=0?mo("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&mo(o,null,2.2),U.rev++)}function fs(e,o){if(U.clock+=e,U.banner&&U.clock>U.banner.until&&(U.banner=null,U.rev++),!U.chain||U.done||!o)return;const s=kt[U.chain],a=s[U.step];if(!a)return;let i=!1;try{i=!!a.test(o)}catch{i=!1}i&&(U.step++,U.step>=s.length?(U.done=!0,mo("OBJECTIVE COMPLETE",yr[U.chain]??"",6)):mo(s[U.step].text,s[U.step].hint,3.6),U.rev++)}const yr={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function xs(e,{danger:o,headingX:s,headingZ:a,toCentreX:i,toCentreZ:l,speed:h,throttle:c}){if(o<=.001)return U.grip=Math.max(0,U.grip-e*.5),U.grip;const d=Math.hypot(i,l)||1,u=-i/d,p=-l/d,r=s*u+a*p,f=Math.min(1,Math.abs(h)/22),m=o*.42,n=Math.max(0,r)*f*(.35+.45*Math.min(1,Math.abs(c)));return U.grip=Math.max(0,Math.min(1,U.grip+(m-n)*e)),U.grip}const Fn=24,ko=ho.safe,Gn=ho.range,Gt=2.1,br=1.5,Ln=34,vr=[mt,Ht],Mr=new De,To=new v,In=new We,Eo=new v;function jr({quality:e="high"}){const o=g.useRef(),s=g.useMemo(()=>Array.from({length:Fn},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),a=g.useRef(0),i=g.useMemo(()=>{const l=new os(.55,1,1,e==="low"?6:10,1,!0);return l.translate(0,.5,0),l},[e]);return ee((l,h)=>{const c=o.current;if(!c)return;const d=Math.min(h,.05),u=b.helm;if(b.helmActive&&u&&!u.onFoot&&!u.sub&&!u.moored){let f=null,m=1/0;for(const n of vr){const x=Math.hypot(u.x,u.z-n);x<ko||x>Gn||x<m&&(m=x,f=n)}if(f!==null&&(a.current-=d,a.current<=0)){const n=1-S.clamp((m-ko)/(Gn-ko),0,1);a.current=S.lerp(4.5,1.9,n);const x=s.find(w=>!w.live);if(x){const w=Gt*.55,y=S.lerp(230,105,n);x.x=u.x+Math.sin(u.heading)*u.speed*w+(Math.random()-.5)*y,x.z=u.z+Math.cos(u.heading)*u.speed*w+(Math.random()-.5)*y,x.y0=210+Math.random()*60,x.t=0,x.live=!0}}}let r=0;for(const f of s){if(!f.live)continue;const m=f.t;if(f.t+=d,f.t<Gt){const n=f.t/Gt;To.set(f.x,f.y0*(1-n*n),f.z),Eo.set(2.2,9,2.2)}else{if(m<Gt){const w=Math.hypot(f.x-u.x,f.z-u.z);w<Ln&&St(.03*(1-w/Ln)+.008,"HIT — SHOT THROUGH THE RIGGING"),b.splash+=1}const n=(f.t-Gt)/br;if(n>=1){f.live=!1;continue}const x=Math.min(1,n*4);To.set(f.x,Be(f.x,f.z,b.t,1).y-4,f.z),Eo.set(11+n*9,78*x*(1-n*n*.75),11+n*9)}In.identity(),c.setMatrixAt(r,Mr.compose(To,In,Eo)),r++}c.count=r,c.instanceMatrix.needsUpdate=!0,c.visible=r>0}),t.jsx("instancedMesh",{ref:o,args:[i,void 0,Fn],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:Y.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:Qe,side:ze})})}const Sr=`
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
`,zr=`
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
`,Cn={low:700,mid:1800,high:3200},Qt=260;function kr({quality:e}){const o=g.useRef(),s=g.useRef(),a=Me(h=>h.camera),i=g.useMemo(()=>{const h=Cn[e]??Cn.high,c=new Float32Array(h*3),d=new Float32Array(h),u=new Float32Array(h),p=new Float32Array(h);for(let f=0;f<h;f++)c[f*3]=Math.random()*Qt,c[f*3+1]=Math.random()*Qt,c[f*3+2]=Math.random()*Qt,d[f]=.5+Math.random()*1.4,u[f]=1.2+Math.random()*3.2,p[f]=Math.random();const r=new lt;return r.setAttribute("position",new Q(c,3)),r.setAttribute("aSpeed",new Q(d,1)),r.setAttribute("aSize",new Q(u,1)),r.setAttribute("aPhase",new Q(p,1)),r.boundingSphere=new Rt(new v,1e6),r},[e]),l=g.useMemo(()=>({uTime:{value:0},uCam:{value:new v},uBox:{value:Qt},uColor:{value:new v(...oe("#cfeee6"))},uGain:{value:0}}),[]);return ee((h,c)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=c,d.uCam.value.copy(a.position),d.uGain.value=b.underwater,s.current&&(s.current.visible=b.underwater>.02))}),t.jsx("points",{ref:s,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Sr,fragmentShader:zr,uniforms:l,transparent:!0,depthWrite:!1,fog:!1})})}const Tr=`
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
`,Er=`
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
`,Pn={low:260,mid:700,high:1300},Rr=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,Ar=`
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
`,Dn=1100;function Fr({whirl:e,quality:o}){const s=g.useRef(),a=g.useRef(),i=Me(c=>c.camera),l=g.useMemo(()=>{const c=o==="low"?24:o==="mid"?34:48,d=new os(e.r*1.02,e.r*.07,Dn,c,6,!0);return d.translate(e.x,-Dn/2-3,e.z),d},[e,o]),h=g.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new v(...oe(Y.foam))},uDeep:{value:new v(...oe(Y.underGlow))},uCameraPos:{value:new v},uFogDensity:{value:.0062},uFogColor:{value:new v(...oe(Y.underHaze))}}),[e]);return ee((c,d)=>{const u=s.current?.uniforms;if(!u)return;u.uTime.value+=d,u.uCameraPos.value.copy(c.camera.position),u.uFogDensity.value=c.scene.fog?.density??.0062;const p=c.scene.fog?.color;p&&u.uFogColor.value.set(p.r,p.g,p.b);const r=Math.hypot(i.position.x-e.x,i.position.z-e.z),f=1-S.smoothstep(r,e.r*8,e.r*24);u.uGain.value+=(b.underwater*f-u.uGain.value)*Math.min(1,d*4),a.current&&(a.current.visible=u.uGain.value>.012)}),t.jsx("mesh",{ref:a,geometry:l,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:s,vertexShader:Rr,fragmentShader:Ar,uniforms:h,transparent:!0,depthWrite:!1,side:ze,blending:Qe,fog:!1})})}function Gr({whirl:e,quality:o}){const s=g.useRef(),a=g.useRef(),i=Me(c=>c.camera),l=g.useMemo(()=>{const c=Pn[o]??Pn.high,d=new Float32Array(c*3),u=new Float32Array(c),p=new Float32Array(c),r=new Float32Array(c),f=new Float32Array(c),m=new Float32Array(c);for(let x=0;x<c;x++)u[x]=Math.random()*Math.PI*2,p[x]=Math.random(),r[x]=.07+Math.random()*.1,f[x]=.12+Math.pow(Math.random(),1.8)*.5,m[x]=2+Math.random()*5;const n=new lt;return n.setAttribute("position",new Q(d,3)),n.setAttribute("aAngle",new Q(u,1)),n.setAttribute("aPhase",new Q(p,1)),n.setAttribute("aRate",new Q(r,1)),n.setAttribute("aRadius",new Q(f,1)),n.setAttribute("aSize",new Q(m,1)),n.boundingSphere=new Rt(new v(e.x,-60,e.z),e.r+140),n},[o,e]),h=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new Xo(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new v(...oe(Y.underGlow))},uGain:{value:0}}),[e]);return ee((c,d)=>{const u=s.current?.uniforms;if(!u)return;u.uTime.value+=d;const p=Math.hypot(i.position.x-e.x,i.position.z-e.z),r=1-S.smoothstep(p,e.r*1.2,e.r*4);u.uGain.value=b.underwater*r,a.current&&(a.current.visible=u.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:l,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:s,vertexShader:Tr,fragmentShader:Er,uniforms:h,transparent:!0,depthWrite:!1,blending:Qe,fog:!1})})}function Lr({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(kr,{quality:e}),Ee.map((o,s)=>t.jsx(Gr,{whirl:o,quality:e},s)),Ee.map((o,s)=>t.jsx(Fr,{whirl:o,quality:e},`w${s}`))]})}const fo=16/9,gs=96,ws=78;function _o(e,o,s=gs){if(!o||o>=fo)return e;const a=S.degToRad(e)/2,i=2*Math.atan(Math.tan(a)*fo/o);return Math.min(s,S.radToDeg(i))}function ys(e){return!e||e>=fo?1:S.clamp(.72+.28*(e/fo),.86,1)}function Bo(e,o,s,a=.06,i=gs){const l=_o(o,e.aspect,i);Math.abs(e.fov-l)<=.05||(e.fov+=(l-e.fov)*(1-Math.pow(a,s)),e.updateProjectionMatrix())}function bs(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*S.clamp(1280/o,.55,2.2)}const Uo=[0,(be[0].y+be[1].y)/2,be[0].z],vs=[ie.x,ie.y,ie.z],xo=$.dir,Ms=[$.x+xo[0]*300,-36,$.z+xo[1]*300],js=[$.x+xo[0]*46,34,$.z+xo[1]*46],Ss=[$.gate.x,4,$.gate.z],zs=[$.gate.x,22,$.gate.z],Ir=1.55,Wo=_/Ir,Cr=1+(Wo-1)*.35,Ke=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Uo,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Ms,to:js,lookFrom:Ss,lookTo:zs,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:vs,lookTo:Uo,swell:0}],Pr=new Set([Uo,vs,Ms,js,Ss,zs]),Jt=e=>Pr.has(e)?e:[e[0]*Wo,e[1]*Cr,e[2]*Wo];for(const e of Ke)e.from=Jt(e.from),e.to=Jt(e.to),e.lookFrom=Jt(e.lookFrom),e.lookTo=Jt(e.lookTo);const $o=Ke.reduce((e,o)=>e+o.dur,0),On=Ke,Dr=e=>e*e*(3-2*e),Or=e=>1-Math.pow(1-e,2.2),eo=e=>new v(e[0],e[1],e[2]);function Nr(e,o){g.useEffect(()=>{if(!e)return;const s=o.domElement;let a=!1,i=0,l=0,h=0;const c=(w,y)=>{a=!0,i=w,l=y},d=(w,y)=>{if(!a)return;const z=b.orbit;z.yaw-=(w-i)*.005,z.pitch=S.clamp(z.pitch+(y-l)*.004,-.35,1.15),i=w,l=y},u=()=>{a=!1,h=0},p=w=>c(w.clientX,w.clientY),r=w=>d(w.clientX,w.clientY),f=w=>{w.preventDefault();const y=b.orbit;y.dist=S.clamp(y.dist*(1+Math.sign(w.deltaY)*.11),45,1400)},m=w=>{w.touches.length===1?c(w.touches[0].clientX,w.touches[0].clientY):w.touches.length===2&&(h=Math.hypot(w.touches[0].clientX-w.touches[1].clientX,w.touches[0].clientY-w.touches[1].clientY))},n=w=>{if(w.touches.length===1)d(w.touches[0].clientX,w.touches[0].clientY);else if(w.touches.length===2&&h){const y=Math.hypot(w.touches[0].clientX-w.touches[1].clientX,w.touches[0].clientY-w.touches[1].clientY),z=b.orbit;z.dist=S.clamp(z.dist*(h/y),45,1400),h=y}w.preventDefault()};s.addEventListener("pointerdown",p),window.addEventListener("pointermove",r),window.addEventListener("pointerup",x),s.addEventListener("wheel",f,{passive:!1}),s.addEventListener("touchstart",m,{passive:!1}),s.addEventListener("touchmove",n,{passive:!1}),window.addEventListener("touchend",x);function x(){u()}return()=>{s.removeEventListener("pointerdown",p),window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",x),s.removeEventListener("wheel",f),s.removeEventListener("touchstart",m),s.removeEventListener("touchmove",n),window.removeEventListener("touchend",x)}},[e,o])}function Hr({onRails:e,playing:o,speed:s=1,onShot:a,idle:i=!1}){const l=Me(p=>p.camera),h=Me(p=>p.gl),c=g.useRef(0),d=g.useRef(-1),u=g.useRef(new v(0,150,-260));return Nr(!e&&!i,h),g.useEffect(()=>{if(e)return;const p=b.orbit,r=l.position.clone().sub(p.target);p.dist=S.clamp(r.length(),45,1400),p.yaw=Math.atan2(r.x,r.z),p.pitch=Math.asin(S.clamp(r.y/(r.length()||1),-1,1))},[e,l]),ee((p,r)=>{if(i)return;const f=Math.min(r,.05);if(b.t+=f,e){if(b.jumpTo!=null){let M=0;for(let j=0;j<b.jumpTo&&j<Ke.length;j++)M+=Ke[j].dur;c.current=M,b.jumpTo=null}o&&(c.current=(c.current+f*s)%$o);let y=0,z=0;for(;z<Ke.length&&!(c.current<y+Ke[z].dur);z++)y+=Ke[z].dur;const T=Ke[Math.min(z,Ke.length-1)],L=S.clamp((c.current-y)/T.dur,0,1);d.current!==z&&(d.current=z,b.shot=z,a?.(z,T));const R=eo(T.from).lerp(eo(T.to),Or(L)),G=eo(T.lookFrom).lerp(eo(T.lookTo),Dr(L)),F=T.swell??0;if(F>0){const M=b.t;R.y+=Math.sin(M*.62)*3.1*F+Math.sin(M*1.31+1.2)*1.2*F,R.x+=Math.sin(M*.44+.6)*2.2*F}R.x+=Math.sin(b.t*.83)*.35,R.y+=Math.sin(b.t*1.17+2)*.28,l.position.copy(R),u.current.lerp(G,1-Math.pow(1e-4,f)),l.lookAt(u.current),F>0&&l.rotateZ(Math.sin(b.t*.51)*.024*F);const A=_o(T.fov,l.aspect);Math.abs(l.fov-A)>.01&&(l.fov+=(A-l.fov)*(1-Math.pow(.02,f)),l.updateProjectionMatrix()),b.progress=c.current/$o}else{const y=b.orbit,z=Math.cos(y.pitch);l.position.set(y.target.x+Math.sin(y.yaw)*z*y.dist,y.target.y+Math.sin(y.pitch)*y.dist,y.target.z+Math.cos(y.yaw)*z*y.dist),l.lookAt(y.target);const T=_o(55,l.aspect);Math.abs(l.fov-T)>.01&&(l.fov+=(T-l.fov)*(1-Math.pow(.02,f)),l.updateProjectionMatrix()),b.t+=0}const m=_t(l.position.x,l.position.z);b.shelter+=(m-b.shelter)*(1-Math.pow(.06,f)),b.fog=S.lerp(it.sea,it.bay,b.shelter),b.rain=1-b.shelter*.92;const n=Be(l.position.x,l.position.z,b.t,1),x=S.clamp((n.y-l.position.y-1)/3,0,1);b.underwater+=(x-b.underwater)*(1-Math.pow(.002,f)),b.depthBelow=Math.max(0,n.y-l.position.y);const w=S.lerp(8200,1700,b.underwater);Math.abs(l.far-w)>20&&(l.far=w,l.updateProjectionMatrix()),p.camera.updateMatrixWorld()}),null}const Nn={low:[24,16],mid:[40,26],high:[56,36]};function _r({quality:e="high",shadows:o=!0}){const s=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const[f,m]=Nn[e]??Nn.high,n=new _s(1,f,m),x=n.attributes.position,w=new Float32Array(x.count*3),[y,z,T]=Te.centre,[L,R,G]=Te.radii,F=new xe("#241c22"),A=new xe(E.rockWarm),M=new xe;for(let j=0;j<x.count;j++){const C=x.getX(j),k=x.getY(j),O=x.getZ(j),Z=1+(zt(C*2.4+5,O*2.4-9,3)-.5)*.14;x.setXYZ(j,y+C*L*Z,z+k*R*Z,T+O*G*Z);const se=S.clamp((k+.2)/1.2,0,1);M.copy(F).lerp(A,(1-se)*.55),w[j*3]=M.r,w[j*3+1]=M.g,w[j*3+2]=M.b}return n.setAttribute("color",new Q(w,3)),n.computeVertexNormals(),n},[e]),{stairM:l,brazierM:h,bayM:c,tableM:d,jarM:u,westStairM:p}=g.useMemo(()=>{const f=new De,m=new We,n=new v(1,1,1),x=new v,w=[];for(let I=0;I<_e.steps;I++){const P=I/(_e.steps-1);x.set(0,S.lerp(ve.y,ne.y+2,P),S.lerp(_e.zTop,_e.zBottom,P)),m.identity(),w.push(f.clone().compose(x,m,n))}const y=[],z=e==="low"?5:9;for(const I of[-1,1])for(let P=0;P<z;P++){const K=P/(z-1);x.set(I*176,ne.y+9,S.lerp(ne.zFront-40,ne.zBack+40,K)),m.identity(),y.push(f.clone().compose(x,m,n))}for(let I=0;I<6;I++)x.set(-110+I*44,ne.y+9,B.z+B.halfZ+54),m.identity(),y.push(f.clone().compose(x,m,n));const T=[],L=e==="low"?5:9;for(const I of[-1,1])for(let P=0;P<ue.tiers;P++)for(let K=0;K<L;K++){const J=K/(L-1);x.set(I*(ue.x-P*26),ue.y+P*ue.tierRise,S.lerp(-205,ue.halfZ,J)),m.identity(),T.push(f.clone().compose(x,m,n))}const R=[],G=[],F=new We,A=new v(0,1,0);let M=24301;const j=()=>(M=Math.imul(M,1664525)+1013904223>>>0,M/4294967296),C=e==="low"?1:2,k=e==="low"?5:8;for(const I of[-1,1])for(let P=0;P<C;P++)for(let K=0;K<k;K++){const J=I*(96+P*52+(j()-.5)*14),ae=S.lerp(ne.zBack+120,ne.zFront-60,K/(k-1))+(j()-.5)*16;if(!(Math.abs(J)<we.halfX+24&&Math.abs(ae-we.z)<we.halfZ+20)&&!(Math.abs(Math.abs(J)-le.x)<26&&ae<le.zFoot+16&&ae>le.zTop-8)){x.set(J,ne.y+2.4,ae),F.setFromAxisAngle(A,(j()-.5)*.5),R.push(f.clone().compose(x,F,n));for(let V=0;V<2;V++)x.set(J+(j()-.5)*30,ne.y+3.5,ae+(j()>.5?8:-8)+(j()-.5)*6),F.setFromAxisAngle(A,j()*Math.PI),G.push(f.clone().compose(x,F,n))}}const O=[],Z=16,se=I=>I*I*(3-2*I);for(let I=0;I<=Z;I++){const P=I/Z;x.set(-252,se(P)*(ue.y-.5)-1.3,S.lerp(45,-45,P)),m.identity(),O.push(f.clone().compose(x,m,n))}return{stairM:w,brazierM:y,bayM:T,tableM:R,jarM:G,westStairM:O}},[e]);ee(()=>{const f=b.t;s.current&&(s.current.material.emissiveIntensity=2.6+Math.sin(f*4.1)*.3+Math.sin(f*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(f*.9)*.12)});const r=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:Io,receiveShadow:r,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Io,roughness:.97,metalness:.02})}),[[0,(ne.zFront+we.z+we.halfZ)/2,ne.halfX*2,ne.zFront-we.z-we.halfZ],[0,(ne.zBack+we.z-we.halfZ)/2,ne.halfX*2,we.z-we.halfZ-ne.zBack],[-342/2-20,we.z,ne.halfX*2-we.halfX*2,we.halfZ*2],[(we.halfX+ne.halfX)/2+20,we.z,ne.halfX*2-we.halfX*2,we.halfZ*2]].map(([f,m,n,x],w)=>t.jsxs("mesh",{position:[f,ne.y-3,m],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Math.abs(n),6,Math.abs(x)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},w)),t.jsxs("mesh",{ref:a,position:[we.x,Fe.ceiling+2,we.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[we.halfX*2,we.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:ze})]}),t.jsxs("mesh",{position:[0,ve.y-4,ve.z],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[ve.halfX*2.6,8,ve.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,l.length],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[_e.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Br,{matrices:l})]}),[-1,1].map(f=>Array.from({length:ue.tiers},(m,n)=>t.jsxs("mesh",{position:[f*(ue.x-n*26),ue.y+n*ue.tierRise-4,0],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[76-n*6,7,ue.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:E.timber,roughness:.92})]},`${f}-${n}`))),t.jsxs("instancedMesh",{args:[null,null,c.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:E.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Vr,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(Ur,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,u.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Wr,{matrices:u})]}),t.jsxs("instancedMesh",{args:[null,null,p.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx($r,{matrices:p})]}),t.jsxs("instancedMesh",{args:[null,null,h.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Yr,{matrices:h})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:E.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Xr,{matrices:h})]}),t.jsxs("mesh",{position:[0,Fe.y-4,0],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Fe.halfX*2,8,Fe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(f=>[-1,0,1].map(m=>t.jsxs("mesh",{position:[f*120,(Fe.y+ne.y)/2,m*96],castShadow:r,children:[t.jsx("boxGeometry",{args:[26,Math.abs(ne.y-Fe.y),26]}),t.jsx("meshStandardMaterial",{color:Y.rock,roughness:.95})]},`${f}-${m}`)))]})}function Br({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function Ur({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function Wr({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function $r({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function Vr({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function Yr({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o})}function Xr({matrices:e}){const o=g.useRef();return t.jsx(ft,{matrices:e,selfRef:o,offsetY:9})}function ft({matrices:e,offsetY:o=0}){const s=g.useRef(),a=g.useRef(!1);return ee(()=>{if(a.current)return;const i=s.current?.parent;if(!i?.isInstancedMesh)return;const l=new De,h=new De().makeTranslation(0,o,0);for(let c=0;c<Math.min(e.length,i.count);c++)l.copy(e[c]).multiply(h),i.setMatrixAt(c,l);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:s})}const Hn=(()=>{if(typeof document>"u")return null;const e=256,o=128,s=document.createElement("canvas");s.width=e,s.height=o;const a=s.getContext("2d"),i=a.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),a.fillStyle=i,a.fillRect(0,0,e,o),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let h=0;h<12;h++){const c=h/12*Math.PI*2;a.save(),a.translate(e/2,o*.62),a.rotate(c),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let h=8;h<e;h+=22)a.fillRect(h,0,3,o);a.globalAlpha=1;const l=new Wt(s);return l.colorSpace=$t,l})();function Zr(e,o,s,a){const i=e+a,l=o+a,h=new Float32Array([-i,0,l,i,0,l,e*.18,s,o*.18,-i,0,l,e*.18,s,o*.18,-e*.18,s,o*.18,i,0,l,i,0,-l,e*.18,s,-o*.18,i,0,l,e*.18,s,-o*.18,e*.18,s,o*.18,i,0,-l,-i,0,-l,-e*.18,s,-o*.18,i,0,-l,-e*.18,s,-o*.18,e*.18,s,-o*.18,-i,0,-l,-i,0,l,-e*.18,s,o*.18,-i,0,-l,-e*.18,s,o*.18,-e*.18,s,-o*.18]),c=new lt;return c.setAttribute("position",new Q(h,3)),c.computeVertexNormals(),c}function Kr({quality:e="high",shadows:o=!0}){const s=g.useRef(),a=g.useRef(),i=Pe("keep-hf.opt.glb"),l=g.useMemo(()=>{const c=[];for(let d=0;d<B.storeys;d++){const u=1-(d+1)*B.taper,p=B.plinth+d*B.storey;c.push({i:d,y:p,halfX:B.halfX*u,halfZ:B.halfZ*u,roof:Zr(B.halfX*u,B.halfZ*u,d===B.storeys-1?30:16,11)})}return c},[]);ee(()=>{const c=b.t;s.current&&(s.current.material.emissiveIntensity=2.2+Math.sin(c*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(c*3.3)*.25)});const h=o;return t.jsxs("group",{position:[0,B.baseY,B.z],children:[t.jsxs("mesh",{position:[0,B.plinth/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[B.halfX*2.2,B.plinth,B.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(pe,{name:"keep-hf.opt.glb",height:B.plinth+B.storeys*B.storey+26,position:[0,B.plinth*.5,0],tint:"#9a8468",emissive:E.emberDeep,emissiveIntensity:.14}),!i&&l.map(c=>t.jsxs("group",{position:[0,c.y,0],children:[t.jsxs("mesh",{position:[0,B.storey/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2,B.storey,c.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,B.storey*.55,c.halfZ+.6],children:[t.jsx("planeGeometry",{args:[c.halfX*1.75,B.storey*.38]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,B.storey*.02,c.halfZ+8],castShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,B.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[c.halfX*2+3,1.6,c.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:c.roof,position:[0,B.storey,0],castShadow:h,receiveShadow:h,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},c.i)),[-1,1].map(c=>t.jsxs("mesh",{position:[c*14,B.plinth+B.storeys*B.storey+30,0],rotation:[0,0,c*.4],castShadow:h,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},c)),t.jsxs("group",{position:[0,ye.y,ye.z-B.z],children:[t.jsxs("mesh",{castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[ye.halfX*2,7,ye.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[ye.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:E.furnace,emissive:"#ffffff",emissiveMap:Hn,map:Hn,emissiveIntensity:2.2,toneMapped:!1,side:ze})]}),t.jsx(pe,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:h,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*8,32,-5],rotation:[0,0,c*-.55],castShadow:h,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},c))]})}),t.jsx(pe,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:E.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*ye.halfX*.9,28,ye.depth/2-4],castShadow:h,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.7})]},c)),t.jsxs("mesh",{position:[0,56,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[ye.halfX*2.3,5,ye.depth+22]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.72})]}),[-1,1].map(c=>t.jsx(pe,{name:"oni-daiko.opt.glb",height:26,position:[c*(ye.halfX-22),4,4],rotation:c*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:h,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},c))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(qr,{})]})]})}function qr(){const e=g.useRef(),o=g.useRef(!1);return ee(()=>{if(o.current)return;const s=e.current?.parent;if(!s?.isInstancedMesh)return;const a=new De,i=new v,l=new We,h=new v(1,1,1);for(let c=0;c<s.count;c++){const d=c/(s.count-1)*2-1;i.set(d*(B.halfX+26),ye.y+74-(1-d*d)*20,B.halfZ+22),s.setMatrixAt(c,a.compose(i,l,h))}s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Qr({shadows:e=!0}){const{slabs:o,flights:s,tower:a}=ls,i=g.useMemo(()=>{const l=[],h=c=>c*c*(3-2*c);for(const c of s)for(let u=0;u<=9;u++){const p=u/9;l.push([(c.x0+c.x1)/2,c.y0+(c.y1-c.y0)*h(p)-1.2,S.lerp(c.z0,c.z1,p)])}return l},[s]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(l=>[a.z[0]+1,a.z[1]-1].map(h=>t.jsxs("mesh",{position:[l,128,h],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${l}${h}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Jr,{points:i})]}),o.map(([l,h,c,d,u],p)=>t.jsxs("mesh",{position:[l,h-1.6,c],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(u)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},p)),o.map(([l,h,c,d,u],p)=>t.jsxs("mesh",{position:[l,h+5,c+Math.abs(u)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})]},`r${p}`))]})}function Jr({points:e}){const o=g.useRef(),s=g.useRef(!1);return ee(()=>{if(s.current)return;const a=o.current?.parent;if(!a?.isInstancedMesh)return;const i=new De,l=new We,h=new v(1,1,1),c=new v;for(let d=0;d<Math.min(e.length,a.count);d++)c.set(e[d][0],e[d][1],e[d][2]),a.setMatrixAt(d,i.compose(c,l,h));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:o})}function ei({shadows:e=!0}){const o=g.useMemo(()=>{const s=[],i=l=>l*l*(3-2*l);for(const l of[-1,1])for(let h=0;h<=20;h++){const c=h/20;s.push({x:l*le.x,y:i(c)*rt,z:S.lerp(le.zFoot,le.zTop,c)})}return s},[]);return t.jsxs("group",{children:[o.map((s,a)=>t.jsxs("mesh",{position:[s.x,s.y-1.4,s.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[le.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.75})]},a)),[-1,1].map(s=>{const a=l=>l*l*(3-2*l),i=l=>{const h=[];for(let c=0;c<=16;c++){const d=c/16;h.push(new v(s*le.x+l,a(d)*rt+7,S.lerp(le.zFoot,le.zTop,d)))}return new Et(new Tt(h),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(le.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})})]},s)})]})}function ti({shadows:e=!0}){const o=g.useMemo(()=>Yt.map(([,,s,a])=>{const i=[];for(let l=0;l<=12;l++){const h=l/12*2-1;i.push(new v(h*s*.5,a*(1-h*h),0))}return new Et(new Tt(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[Yt.map(([s,a],i)=>t.jsxs("group",{position:[0,s,a],children:[t.jsx("mesh",{geometry:o[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:E.vermilion,roughness:.74})}),[-7,7].map(l=>t.jsx("mesh",{geometry:o[i],position:[0,7,l],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:E.vermilionDeep,roughness:.8})},l))]},i)),[-1,0,1].map(s=>t.jsxs("mesh",{position:[s*70,Yt[0][0]-12,Yt[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:2.4,toneMapped:!1})]},s)),t.jsx("group",{position:[0,ne.y,0]})]})}function ks(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function oi({quality:e,shadows:o}){const s=g.useMemo(()=>{const i=ks(712273),l=[],h=e==="low"?14:e==="mid"?26:40;let c=0;for(;l.length<h&&c<h*40;){c++;const d=(i()*2-1)*(ne.halfX-30),u=S.lerp(ne.zBack+40,ne.zFront-30,i());Math.abs(d)<62&&u>B.z+120||Math.abs(d)<70&&Math.abs(u-84)<58||Math.abs(Math.abs(d)-le.x)<24&&u<le.zFoot+18&&u>le.zTop-10||l.push({x:d,z:u,kind:l.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return l},[e]),a=o;return t.jsx(t.Fragment,{children:s.map((i,l)=>{const h=[i.x,ne.y,i.z];return i.kind===0?t.jsx(pe,{name:"sake-tower.opt.glb",height:22*i.k,position:h,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:h,children:[0,1,2].map(c=>t.jsxs("mesh",{position:[0,4+c*7,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[6-c,6-c,7,10]}),t.jsx("meshStandardMaterial",{color:c%2?"#c9a86a":"#8e6a3c",roughness:.92})]},c))})},l):i.kind===1?t.jsx(pe,{name:"oni-guardian.opt.glb",height:30*i.k,position:h,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*4,28,0],rotation:[0,0,c*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},c))]})},l):i.kind===2?t.jsx(pe,{name:"wisteria-trellis.opt.glb",height:34*i.k,position:h,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(c=>t.jsxs("mesh",{position:[c,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},c))]})},l):t.jsxs("group",{position:h,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:l%2?E.vermilion:"#e8dcc4",roughness:.95,side:ze,emissive:l%2?E.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},l)})})}function ni({shadows:e}){const o=g.useMemo(()=>{const s=ks(10560325),a=[];for(let i=0;i<14;i++)a.push({x:(s()*2-1)*(Fe.halfX-40),z:(s()*2-1)*(Fe.halfZ-40),rot:s()*Math.PI*2,keg:i%2===0});return a},[]);return t.jsx(t.Fragment,{children:o.map((s,a)=>s.keg?t.jsx(pe,{name:"powder-keg.opt.glb",height:13,position:[s.x,Fe.y,s.z],rotation:s.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[s.x,Fe.y+6,s.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(pe,{name:"war-cannon.opt.glb",height:12,position:[s.x,Fe.y,s.z],rotation:s.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[s.x,Fe.y+5,s.z],rotation:[0,s.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function si(){const e=Me(o=>o.camera);return ee((o,s)=>{const a=Math.min(s,.05),i=(e.position.x-me.x-Te.centre[0])/Te.radii[0],l=(e.position.y-me.y-Te.centre[1])/Te.radii[1],h=(e.position.z-me.z-Te.centre[2])/Te.radii[2],c=Math.sqrt(i*i+l*l+h*h),d=S.clamp(1-(c-1)/.5,0,1);b.inside+=(d-b.inside)*(1-Math.pow(.02,a))}),null}function ai({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[me.x,me.y,me.z],children:[t.jsx(si,{}),t.jsx(_r,{quality:e,shadows:o}),t.jsx(Kr,{quality:e,shadows:o}),t.jsx(ti,{shadows:o}),t.jsx(ei,{shadows:o}),t.jsx(Qr,{shadows:o}),t.jsx(oi,{quality:e,shadows:o}),t.jsx(ni,{shadows:o}),[-1,1].map(s=>t.jsx(pe,{name:"banquet-table.opt.glb",height:9,position:[s*92,ne.y,B.z+210],rotation:s*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${s}`)),t.jsx(pe,{name:"treasure-kura.opt.glb",height:64,position:[ue.x-74,ne.y,B.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[ue.x-74,ne.y,B.z+96],rotation:[0,-.7,0],children:[[-1,1].map(s=>[-1,1].map(a=>t.jsxs("mesh",{position:[s*12,5,a*9],castShadow:o,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${s}${a}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([s,a,i],l)=>t.jsx(pe,{name:"bomb-sphere.opt.glb",height:22,position:[s,Fe.y,a],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[s,Fe.y+10,a],castShadow:o,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${l}`)),[-1,1].map(s=>t.jsx(pe,{name:"keep-tier.opt.glb",height:96,position:[s*(ue.x-40),ue.y+ue.tiers*ue.tierRise-6,B.z+140],rotation:s*.6,tint:"#a08c74",fallback:null},`turret-${s}`)),[-1,1].map(s=>t.jsx(pe,{name:"arch-bridge.opt.glb",height:26,position:[s*74,ne.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${s}`)),[-1,1].map(s=>t.jsx(pe,{name:"oni-guardian.opt.glb",height:54,position:[s*(ve.halfX+26),ve.y,ve.z-26],rotation:-s*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[s*(ve.halfX+26),ve.y,ve.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},s)),t.jsx("pointLight",{position:[0,ye.y+30,ye.z-B.z+B.z+40],color:E.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,ue.y+120,60],color:E.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Fe.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,ve.y+46,ve.z-40],color:E.lantern,intensity:26e3,distance:620,decay:2})]})}const Lt=e=>e<-1?-1:e>1?1:e,q={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1},te={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0}},Nt=new Set,dt=(...e)=>e.some(o=>Nt.has(o));function ri(){q.throttle=0,q.rudder=0,q.planes=0,q.boost=!1,q.walk.x=0,q.walk.z=0,q.surfaceQueued=!1,q.periscopeQueued=!1,q.burstQueued=!1,te.throttle=0,te.rudder=0,te.planes=0,te.boost=!1,te.walk.x=0,te.walk.z=0,Nt.clear()}function ii(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),o=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const l=i.key.toLowerCase();Nt.add(l),l==="f"&&(q.surfaceQueued=!0),l==="p"&&(q.periscopeQueued=!0),l==="b"&&!i.repeat&&(q.burstQueued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(l)&&i.preventDefault()},s=i=>Nt.delete(i.key.toLowerCase()),a=()=>ri();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",s),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",s),window.removeEventListener("blur",a),Nt.clear()}}function li(){const e=dt("w","arrowup")?1:0,o=dt("s","arrowdown")?1:0,s=dt("a","arrowleft")?1:0,a=dt("d","arrowright")?1:0,i=dt("q"," ")?1:0,l=dt("e","c")?1:0;q.throttle=Lt(e-o+te.throttle),q.rudder=Lt(s-a+te.rudder),q.planes=Lt(i-l+te.planes),q.boost=dt("shift")||te.boost,q.walk.x=Lt(a-s+te.walk.x),q.walk.z=Lt(e-o+te.walk.z)}const to=64,ci=19,_n=16,hi=.92,oo=9,di=.0016,ui=.055,pi=1.9,mi=16,fi=62,xi=9,Bn={x:-.45,z:-2.4},Un=.075,gi=new v,wi=new v;function bt(e,o){return S.clamp(-re(e,o)/26,0,1)}const Wn=22,yi=42,ut=11;function bi({mode:e,onMode:o}){const s=Me(x=>x.camera),a=Me(x=>x.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=Pe("ship-sunny.opt.glb"),u=Pe("ship-lion.opt.glb"),p=d||u,r=d?"ship-sunny.opt.glb":u?"ship-lion.opt.glb":null,f=r?Bt(r,58):34,m=Pe("crew-straw.opt.glb"),n=g.useRef({x:40*_,z:1010*_,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,stride:0,area:"hall",camYaw:0,camPitch:.16,camZoom:1,boarded:!1}).current;return g.useEffect(()=>{if(e==="off")return;const x=a.domElement;let w=!1,y=0,z=0;const T=(k,O)=>{w=!0,y=k,z=O},L=(k,O)=>{if(!w)return;const Z=bs();n.camYaw-=(k-y)*.005*Z,n.camPitch=S.clamp(n.camPitch+(O-z)*.004*Z,-.25,1.05),y=k,z=O},R=()=>{w=!1},G=k=>T(k.clientX,k.clientY),F=k=>L(k.clientX,k.clientY),A=k=>{k.preventDefault(),n.camZoom=S.clamp(n.camZoom*(1+Math.sign(k.deltaY)*.1),.32,2.4)},M=k=>k.clientX>window.innerWidth*.5,j=k=>k.touches[0]&&M(k.touches[0])&&T(k.touches[0].clientX,k.touches[0].clientY),C=k=>{w&&(k.touches[0]&&L(k.touches[0].clientX,k.touches[0].clientY),k.preventDefault())};return x.addEventListener("pointerdown",G),window.addEventListener("pointermove",F),window.addEventListener("pointerup",R),x.addEventListener("wheel",A,{passive:!1}),x.addEventListener("touchstart",j,{passive:!1}),x.addEventListener("touchmove",C,{passive:!1}),window.addEventListener("touchend",R),()=>{x.removeEventListener("pointerdown",G),window.removeEventListener("pointermove",F),window.removeEventListener("pointerup",R),x.removeEventListener("wheel",A),x.removeEventListener("touchstart",j),x.removeEventListener("touchmove",C),window.removeEventListener("touchend",R)}},[e,a,n]),g.useEffect(()=>{if(e==="helm")return n.x=40*_,n.z=760*_,n.heading=Math.PI,n.speed=0,n.vx=0,n.vz=0,n.throttle=0,n.camYaw=0,n.camPitch=.16,n.camZoom=1,n.swallowed=0,n.burst=1,n.burstFx=0,n.slam=0,n.drift=0,n.trim=0,n.bowY=Be(n.x,n.z,b.t,1).y,b.helm=null,Ho("helm"),()=>{b.helmActive=!1}},[e,n]),g.useEffect(()=>{if(e!=="foot")return;n.fvx=0,n.fvz=0,U.chain!=="foot"&&Ho("foot");const x=b.footSpawn;if(b.footSpawn="hall",x==="port"){n.area="island",n.fx=X.x+40*_,n.fz=X.z+40*_,n.fy=re(n.fx,n.fz)+ut,n.fyaw=Math.atan2(-(ie.x-n.fx),-(ie.z-n.fz)),n.camYaw=n.fyaw,n.camPitch=-.06;return}if(x==="rear"){n.area="island",n.fx=$.gate.x+$.dir[0]*26,n.fz=$.gate.z+$.dir[1]*26,n.fy=re(n.fx,n.fz)+ut,n.fyaw=Math.atan2($.dir[0],$.dir[1]),n.camYaw=n.fyaw,n.camPitch=.02;return}n.area="hall",n.fx=me.x,n.fy=me.y+ve.y,n.fz=me.z+_e.zTop,n.fyaw=0,n.fpitch=-.05,n.camYaw=0,n.camPitch=.05},[e,n]),ee((x,w)=>{if(e!=="helm"&&e!=="foot")return;const y=Math.min(w,.05);if(b.t+=y,e==="helm"){const z=q.throttle,T=q.boost,L=z>0?z*(T?1:.62):z;n.throttle+=(L-n.throttle)*(1-Math.pow(.02,y)),n.rudder+=(q.rudder-n.rudder)*(1-Math.pow(.005,y));const R=Math.sin(n.heading),G=Math.cos(n.heading),F=Math.cos(n.heading),A=-Math.sin(n.heading);let M=n.vx*R+n.vz*G,j=n.vx*F+n.vz*A;const C=1-b.shelter,k=n.throttle>=0?n.throttle*to:n.throttle*ci;M+=S.clamp(k-M,-_n*2.5,_n)*y,n.burst=Math.min(1,n.burst+y/xi),q.burstQueued&&(q.burstQueued=!1,n.burst>=.999&&(n.burst=0,n.burstFx=1,M+=fi,b.splash+=1)),n.burstFx*=Math.pow(.2,y);const O=Be(n.x,n.z,b.t,1);M-=(O.dx*R+O.dz*G)*mi*C*y,M-=M*Math.abs(M)*di*y,j-=(j*Math.abs(j)*ui+j*pi)*y;const Z=S.clamp(Math.abs(M)/16,0,1);M*=Math.pow(1-.11*Math.abs(n.rudder)*Z,y),n.vx=R*M+F*j,n.vz=G*M+A*j,n.speed=M,n.drift+=(S.clamp(Math.abs(j)/11,0,1)-n.drift)*(1-Math.pow(.1,y)),n.heading+=n.rudder*hi*Z*Math.sign(M||1)*y;const se=n.x+n.vx*y,I=n.z+n.vz*y,P=se+R*oo*2,K=I+G*oo*2;if(bt(P,K)>.06)n.x=se,n.z=I,n.aground+=(0-n.aground)*(1-Math.pow(.05,y));else{n.aground+=(1-n.aground)*(1-Math.pow(.02,y)),St(Math.abs(n.speed)*.0012*y*60,"AGROUND — SHE IS TAKING WATER");const je=Math.pow(.06,y);n.speed*=je,n.vx*=je,n.vz*=je;const Xe=6,nn=bt(n.x+Xe,n.z)-bt(n.x-Xe,n.z),sn=bt(n.x,n.z+Xe)-bt(n.x,n.z-Xe),an=Math.hypot(nn,sn)||1;n.x+=nn/an*26*y,n.z+=sn/an*26*y}const ae=ss(n.x,n.z,0);n.x+=ae.vx*y,n.z+=ae.vz*y,n.x+=Bn.x*C*y,n.z+=Bn.z*C*y;const V=O.dx*F+O.dz*A;n.heading+=S.clamp(V*.4,-Un,Un)*C*y;let ge=Ee[0],Re=1/0;for(const je of Ee){const Xe=(n.x-je.x)**2+(n.z-je.z)**2;Xe<Re&&(Re=Xe,ge=je)}if(xs(y,{danger:ae.danger,headingX:Math.sin(n.heading),headingZ:Math.cos(n.heading),toCentreX:ge.x-n.x,toCentreZ:ge.z-n.z,speed:n.speed,throttle:n.throttle})>=1||ae.danger>.94){const je=ge;n.x=je.x+(je.x>0?je.r*1.85:-je.r*1.85),n.z=je.z+je.r*1.5,n.speed=0,n.vx=0,n.vz=0,n.throttle=0,n.heading=Math.PI,n.swallowed+=1,n.aground=1,U.grip=0,St(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),b.splash+=1}const Oe=_t(n.x,n.z),Le=S.lerp(1,.055,Oe)*S.smoothstep(bt(n.x,n.z),0,.3),H=Be(n.x,n.z,b.t,Le);b.helmActive=!0,b.helmPos.set(n.x,H.y+12,n.z),b.helmSpeed=S.clamp(Math.abs(n.speed)/to,0,1);const he=ae.vx*Math.cos(n.heading)-ae.vz*Math.sin(n.heading),de=S.clamp(Math.abs(n.speed)/to,0,1),Se=S.clamp(n.rudder*Z*de*.4+he*.016,-.5,.5);n.heel+=(Se-j*.012-n.heel)*(1-Math.pow(.15,y));const $e=Be(n.x+R*oo*2.2,n.z+G*oo*2.2,b.t,Le).y,Ve=S.clamp((n.bowY-$e)/Math.max(y,.001),0,60);n.bowY=$e;const Ye=S.clamp((Ve-10)/24,0,1)*de*C;if(n.slam=Math.max(n.slam*Math.pow(.05,y),Ye),Ye>.25){const je=Math.pow(1-.3*Ye,y);n.vx*=je,n.vz*=je}const ct=de*.1*Math.sign(n.speed>=0?1:-1)+n.slam*.14+n.burstFx*.16;n.trim+=(ct-n.trim)*(1-Math.pow(.1,y));const Ie=S.clamp(de*C*1.15+n.aground*.5+ae.danger*.8+n.slam*1.3+n.burstFx,0,1);n.spray+=(Ie-n.spray)*(1-Math.pow(.08,y));const Ne=i.current;Ne&&(Ne.position.set(n.x,H.y-1.4,n.z),Ne.rotation.set(S.clamp(H.dz*1.2,-.3,.3)-n.trim,n.heading,S.clamp(-H.dx,-.26,.26)+n.heel)),l.current&&(l.current.scale.z=1+Math.sin(b.t*1.6)*.08+n.burstFx*.4,l.current.scale.x=1+C*.06+n.burstFx*.12),h.current&&(h.current.material.opacity=n.spray*.42,h.current.scale.setScalar(.7+n.spray*.55)),c.current&&(c.current.material.opacity=S.clamp(.34*de+n.burstFx*.3,0,.62)*(.28+C*.72),c.current.scale.set(1+de*.75+n.drift*.6,1,1+de*.5));const wo=n.heading+Math.PI+n.camYaw,st=Math.cos(n.camPitch),Ce=f*3.4*n.camZoom*(1+de*.26+n.burstFx*.34)*ys(s.aspect),ke=gi.set(n.x+Math.sin(wo)*st*Ce,H.y+14+Math.sin(n.camPitch)*Ce,n.z+Math.cos(wo)*st*Ce),Vt=Be(ke.x,ke.z,b.t,Le);ke.y=Math.max(ke.y,Vt.y+7),s.position.lerp(ke,1-Math.pow(6e-4,y));const At=de*66;s.lookAt(wi.set(n.x+(R+F*S.clamp(j/40,-.4,.4))*At,H.y+12-n.trim*26*de,n.z+(G+A*S.clamp(j/40,-.4,.4))*At)),s.rotateZ(Math.sin(b.t*2.3)*.012*de+n.heel*.3+n.aground*Math.sin(b.t*21)*.02+n.slam*Math.sin(b.t*34)*.03+ae.danger*Math.sin(b.t*2.7)*.03),Bo(s,60+de*7+n.burstFx*10,y,.06,ws);const on=Math.hypot(n.x-(X.x+60*_),n.z-(X.z+60*_));on<90*_&&Math.abs(n.speed)<24&&(b.footSpawn="port",o?.("foot")),b.helm={speed:n.speed,heading:n.heading,throttle:n.throttle,aground:n.aground,x:n.x,z:n.z,toGate:Math.min(Math.hypot(n.x,n.z-mt),Math.hypot(n.x,n.z-Ht)),underFire:[mt,Ht].some(je=>{const Xe=Math.hypot(n.x,n.z-je);return Xe>ho.safe&&Xe<ho.range}),moored:on<180*_,maelstrom:ae.danger,swallowed:n.swallowed,burst:n.burst,drift:n.drift,maxSpeed:to},fs(y,b.helm),b.shelter+=(Oe-b.shelter)*(1-Math.pow(.06,y)),b.underwater+=(0-b.underwater)*(1-Math.pow(.02,y))}else{const z=q.boost?yi:Wn;n.fyaw+=(n.camYaw-n.fyaw)*(1-Math.pow(1e-4,y)),n.fpitch+=(-n.camPitch-n.fpitch)*(1-Math.pow(1e-4,y));const T=q.walk.x,L=q.walk.z,R=Math.hypot(T,L),G=R>1?R:1,F=-Math.sin(n.camYaw),A=-Math.cos(n.camYaw),M=-A,j=F,C=(F*(L/G)+M*(T/G))*z,k=(A*(L/G)+j*(T/G))*z,O=1-Math.pow(R>.02?2e-5:4e-7,y);n.fvx+=(C-n.fvx)*O,n.fvz+=(k-n.fvz)*O;const Z=n.fvx*y,se=n.fvz*y;if(n.area==="island"){const K=n.fx+Z,J=n.fz+se,ae=re(n.fx,n.fz),V=re(K,J),ge=Math.hypot(Z,se)||1e-6,Re=(V-ae)/ge;(V<=.3||Re>=1.2&&V>=ae)&&(n.fvx=0,n.fvz=0),V>.3&&(Re<1.2||V<ae)&&(n.fx=K,n.fz=J);const nt=re(n.fx,n.fz);n.fy+=(nt+ut-n.fy)*(1-Math.pow(.002,y));const Oe=Math.hypot(n.fx-ie.x,n.fz-ie.z),Le=Math.hypot(n.fx-$.gate.x,n.fz-$.gate.z);Oe<80?(n.area="hall",n.fx=me.x,n.fz=me.z+_e.zTop,n.fy=me.y+ve.y+ut,n.fyaw=0,n.camYaw=0,n.camPitch=.05):Le<40&&(n.area="hall",n.fx=me.x+60,n.fz=me.z+B.z+150,n.fy=me.y+ut,n.fyaw=Math.PI,n.camYaw=Math.PI,n.camPitch=.04),b.helm={onFoot:!0,area:"island",x:n.fx,z:n.fz,fy:n.fy-me.y,toMouth:Oe,toRear:Le,nearPort:Math.hypot(n.fx-X.x,n.fz-X.z)<X.r*1.4};const H=_t(n.fx,n.fz);b.shelter+=(H-b.shelter)*(1-Math.pow(.06,y))}else{n.fx+=Z,n.fz+=se;const K=n.fx-me.x,J=n.fz-me.z;let ae=J>ve.z-70?ve.y:J>_e.zBottom?S.lerp(0,ve.y,(J-_e.zBottom)/(_e.zTop-_e.zBottom)):0;ae=Math.max(ae,ba(K,J)),n.fy+=(me.y+ae+ut-n.fy)*(1-Math.pow(.005,y)),J>ve.z+34&&(n.area="island",n.fx=ie.x,n.fz=ie.z+130,n.fy=re(n.fx,n.fz)+ut,n.fyaw=Math.PI,n.camYaw=Math.PI,n.camPitch=-.04),b.helm={onFoot:!0,area:"hall",x:n.fx,z:n.fz,lz:J,fy:n.fy-me.y},b.shelter+=(1-b.shelter)*(1-Math.pow(.06,y))}const I=Math.hypot(n.fvx,n.fvz);n.stride+=I*y;const P=Math.min(1,I/Wn);s.position.set(n.fx,n.fy+Math.sin(n.stride*.42)*.45*P,n.fz),s.rotation.set(0,0,0),s.rotateY(n.fyaw),s.rotateX(n.fpitch),s.rotateZ(Math.sin(n.stride*.21)*.016*P),Bo(s,72,y,.02),b.underwater+=(0-b.underwater)*(1-Math.pow(.02,y))}b.fog=S.lerp(it.sea,it.bay,b.shelter),b.rain=1-b.shelter*.92}),t.jsxs("group",{ref:i,position:[0,-4e3,0],visible:e==="helm",children:[p&&t.jsx(pe,{name:d?"ship-sunny.opt.glb":"ship-lion.opt.glb",height:Bt(d?"ship-sunny.opt.glb":"ship-lion.opt.glb",58),rotation:go(d?"ship-sunny.opt.glb":"ship-lion.opt.glb"),position:[0,-13,0],tint:d?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),p&&m&&t.jsx(pe,{name:"crew-straw.opt.glb",height:15,rotation:0,position:[0,14,6]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!p,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!p,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!p,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!p,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!p,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!p,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:l,position:[0,17.5,1.5],visible:!p,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:ze,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!p,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(x=>t.jsxs("mesh",{position:[x*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:E.lantern,emissive:E.lantern,emissiveIntensity:3.4,toneMapped:!1})]},x)),t.jsx(Ut,{crew:"straw",width:p?19:14,position:[0,p?38:26,-2]}),t.jsxs("mesh",{ref:c,position:[0,.6,-30],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[18,72]}),t.jsx("meshBasicMaterial",{color:Y.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:h,position:[0,3.4,17],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[26,18]}),t.jsx("meshBasicMaterial",{color:Y.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:Qe})]})]})}const $n=66,vi=22,Vn=21,Mi=1.15,ji=.22,Si=70,no=340,Yn=7,zi=6,Xn=60,so=185,ki=new v,Zn=new v;function Ti({mode:e,onMode:o}){const s=Me(f=>f.camera),a=Me(f=>f.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=Pe("ship-tang.opt.glb"),d=Pe("ship-sub.opt.glb"),u=c||d,p=Pe("crew-heart.opt.glb"),r=g.useRef({x:300*_,z:780*_,heading:Math.PI,speed:0,throttle:0,rudder:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0,camYaw:0,camPitch:.22,camDist:118}).current;return g.useEffect(()=>{if(e!=="sub")return;const f=a.domElement;let m=!1,n=0,x=0;const w=(M,j)=>{m=!0,n=M,x=j},y=(M,j)=>{if(!m)return;const C=bs();r.camYaw-=(M-n)*.005*C,r.camPitch=S.clamp(r.camPitch+(j-x)*.004*C,-.5,1),n=M,x=j},z=()=>{m=!1},T=M=>w(M.clientX,M.clientY),L=M=>y(M.clientX,M.clientY),R=M=>{M.preventDefault(),r.camDist=S.clamp(r.camDist*(1+Math.sign(M.deltaY)*.1),48,260)},G=M=>M.clientX>window.innerWidth*.5,F=M=>M.touches[0]&&G(M.touches[0])&&w(M.touches[0].clientX,M.touches[0].clientY),A=M=>{m&&(M.touches[0]&&y(M.touches[0].clientX,M.touches[0].clientY),M.preventDefault())};return f.addEventListener("pointerdown",T),window.addEventListener("pointermove",L),window.addEventListener("pointerup",z),f.addEventListener("wheel",R,{passive:!1}),f.addEventListener("touchstart",F,{passive:!1}),f.addEventListener("touchmove",A,{passive:!1}),window.addEventListener("touchend",z),()=>{f.removeEventListener("pointerdown",T),window.removeEventListener("pointermove",L),window.removeEventListener("pointerup",z),f.removeEventListener("wheel",R),f.removeEventListener("touchstart",F),f.removeEventListener("touchmove",A),window.removeEventListener("touchend",z)}},[e,a,r]),g.useEffect(()=>{if(e==="sub")return r.x=360*_,r.z=690*_,r.heading=Math.PI,r.speed=0,r.throttle=0,r.depth=4,r.orderedDepth=4,r.berthing=0,r.camYaw=0,r.camPitch=.22,r.heel=0,b.subActive=!0,b.helm=null,Ho("sub"),()=>{b.subActive=!1,b.subThrottle=0}},[e,r]),ee((f,m)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const n=Math.min(m,.05);b.t+=n;const x=q.throttle,w=q.boost,y=x>0?x*(w?1:.7):x;r.throttle+=(y-r.throttle)*(1-Math.pow(.02,n)),b.subThrottle=Math.abs(r.throttle),r.rudder+=(q.rudder-r.rudder)*(1-Math.pow(8e-4,n));const z=S.clamp(r.depth/15,0,1),T=$n*(.7+.3*z),L=r.throttle>=0?r.throttle*T:r.throttle*vi;r.speed+=S.clamp(L-r.speed,-Vn*2,Vn)*n,r.speed-=r.speed*Math.abs(r.speed)*.0016*n;const R=S.lerp(ji,1,S.clamp(Math.abs(r.speed)/7,0,1));r.heading+=r.rudder*Mi*R*Math.sign(r.speed>=0?1:-1)*n,r.orderedDepth-=q.planes*Si*n,r.orderedDepth=S.clamp(r.orderedDepth,0,no),q.surfaceQueued&&(q.surfaceQueued=!1,r.orderedDepth=0),q.periscopeQueued&&(q.periscopeQueued=!1,r.orderedDepth=zi);const G=r.x+Math.sin(r.heading)*r.speed*n,F=r.z+Math.cos(r.heading)*r.speed*n,A=ss(G,F,r.depth);r.x=G+A.vx*n,r.z=F+A.vz*n;const M=A.vx*Math.cos(r.heading)-A.vz*Math.sin(r.heading);r.heading+=M*.008*n;const j=S.clamp(Math.abs(r.speed)/$n,0,1),C=S.clamp(M*.02+r.rudder*R*j*.34,-.6,.6);r.heel+=(C-r.heel)*(1-Math.pow(.12,n)),A.danger>.05&&(r.speed*=Math.pow(1-.22*A.danger,n));const k=re(r.x,r.z),O=Math.max(2,-k-Yn),Z=r.depth<1.5;r.depth+=(r.orderedDepth-r.depth)*(1-Math.pow(.12,n)),r.depth>O?(r.scrape+=(1-r.scrape)*(1-Math.pow(.02,n)),r.depth=O,r.orderedDepth=Math.min(r.orderedDepth,O-2),St(Math.abs(r.speed)*.0016*n*60,"GROUNDED ON THE SHELF"),r.speed*=Math.pow(.3,n)):r.scrape+=(0-r.scrape)*(1-Math.pow(.05,n));const se=(r.depth-so)/(no-so);r.stress=se>0?Math.min(1,se*se):0,r.stress>0&&St(r.stress*.06*n,"HULL UNDER PRESSURE — COME UP");const I=r.x+Math.sin(r.heading)*26,P=r.z+Math.cos(r.heading)*26;if(re(I,P)>-r.depth+Yn*.5){r.speed*=Math.pow(.1,n);const Ce=6,ke=re(r.x+Ce,r.z)-re(r.x-Ce,r.z),Vt=re(r.x,r.z+Ce)-re(r.x,r.z-Ce),At=Math.hypot(ke,Vt)||1;r.x-=ke/At*20*n,r.z-=Vt/At*20*n,r.scrape=Math.max(r.scrape,.5)}const J=Math.hypot(r.x-$.x,r.z-$.z);if(J<$.pool*1.1&&r.berthing===0&&(r.berthing=1e-4),r.berthing>0){r.berthing=Math.min(1,r.berthing+n*.5),r.x+=($.berth.x-r.x)*(1-Math.pow(.1,n)),r.z+=($.berth.z-r.z)*(1-Math.pow(.1,n)),r.orderedDepth=0,r.speed*=Math.pow(.1,n);let ke=Math.atan2($.dir[0],$.dir[1])+Math.PI-r.heading;for(;ke>Math.PI;)ke-=Math.PI*2;for(;ke<-Math.PI;)ke+=Math.PI*2;r.heading+=ke*(1-Math.pow(.2,n)),r.berthing>=1&&r.depth<1.2&&(b.footSpawn="rear",b.splash+=1,o?.("foot"))}r.depth<1.5!==Z&&(b.splash+=1);const V=Be(r.x,r.z,b.t,1),ge=1-S.clamp(r.depth/10,0,1),Re=-r.depth+V.y*ge,nt=S.clamp((r.orderedDepth-r.depth)*.05,-.34,.34)*Math.sign(r.speed>=0?1:-1)+V.dz*.8*ge;r.pitch+=(nt-r.pitch)*(1-Math.pow(.05,n));const Oe=i.current;Oe&&(Oe.position.set(r.x,Re,r.z),Oe.rotation.set(r.pitch+r.scrape*Math.sin(b.t*23)*.02,r.heading,-V.dx*.5*ge+r.heel)),l.current&&(l.current.rotation.z+=r.throttle*9*n),h.current&&(h.current.visible=r.depth<2.5),b.subPos.set(r.x,Re,r.z);const Le=r.heading+Math.PI+r.camYaw,H=Math.cos(r.camPitch),he=S.clamp(r.depth/240,0,1),de=r.camDist*(1-he*.2)*ys(s.aspect),Se=ki.set(r.x+Math.sin(Le)*H*de,Re+10+Math.sin(r.camPitch)*de,r.z+Math.cos(Le)*H*de),$e=re(Se.x,Se.z);Se.y=Math.max(Se.y,$e+5),r.depth>10&&(Se.y=Math.min(Se.y,V.y-3)),s.position.lerp(Se,1-Math.pow(8e-4,n)),Zn.set(r.x+Math.sin(r.heading)*j*46,Re+6-r.pitch*30*j,r.z+Math.cos(r.heading)*j*46),s.lookAt(Zn),s.rotateZ(r.scrape*Math.sin(b.t*19)*.015+r.heel*.35+A.danger*Math.sin(b.t*3.1)*.02),Bo(s,64+j*6+(w?2:0),n,.06,ws);const Ve=Be(s.position.x,s.position.z,b.t,1),Ye=S.clamp((Ve.y-s.position.y-1)/3,0,1);b.underwater+=(Ye-b.underwater)*(1-Math.pow(.002,n)),b.depthBelow=Math.max(0,Ve.y-s.position.y);const ct=S.lerp(8200,1700,b.underwater);Math.abs(s.far-ct)>20&&(s.far=ct,s.updateProjectionMatrix()),b.shelter+=((J<$.pool*3?.85:0)-b.shelter)*(1-Math.pow(.06,n));let Ie=Ee[0],Ne=1/0;for(const Ce of Ee){const ke=(r.x-Ce.x)**2+(r.z-Ce.z)**2;ke<Ne&&(Ne=ke,Ie=Ce)}xs(n,{danger:A.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:Ie.x-r.x,toCentreZ:Ie.z-r.z,speed:r.speed,throttle:r.throttle})>=1&&(St(.22,"CAUGHT IN THE VORTEX"),r.x=Ie.x+(r.x>Ie.x?1:-1)*Ie.r*1.9,r.z=Ie.z+Ie.r*1.5,r.speed=0,r.orderedDepth=Math.min(no,r.depth+18),U.grip=0,b.splash+=1);let st=Math.atan2($.x-r.x,$.z-r.z)-r.heading;for(;st>Math.PI;)st-=Math.PI*2;for(;st<-Math.PI;)st+=Math.PI*2;b.helm={sub:!0,speed:r.speed,maxSpeed:T,heading:r.heading,depth:r.depth,orderedDepth:r.orderedDepth,scrape:r.scrape,stress:r.stress,maelstrom:A.danger,toRear:J,relRear:st,berthing:r.berthing>0,x:r.x,z:r.z,maxDepth:no,crushDepth:so,dark:S.clamp((r.depth-Xn)/(so-Xn),0,1)},fs(n,b.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[u&&t.jsx(pe,{name:c?"ship-tang.opt.glb":"ship-sub.opt.glb",height:Bt(c?"ship-tang.opt.glb":"ship-sub.opt.glb",24),rotation:go(c?"ship-tang.opt.glb":"ship-sub.opt.glb"),position:[0,c?-13:-8,0],tint:c?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:h,position:[0,7.5,-2],children:[p&&t.jsx(pe,{name:"crew-heart.opt.glb",height:9,rotation:0}),t.jsx(Ut,{crew:"heart",width:9,position:[0,5.5,-6]})]}),t.jsxs("group",{visible:!u,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(f=>[0,1,2,3].map(m=>t.jsxs("mesh",{position:[f*5.1,1.2,8-m*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${f}-${m}`)))]}),t.jsxs("mesh",{position:[0,.6,16.2],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,.6,19],scale:[26,26,1],children:t.jsx("spriteMaterial",{map:Ei,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:Qe})}),t.jsxs("mesh",{position:[0,7.4,-13.5],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:l,position:[0,.4,-16.6],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(Fi,{})]})}const Ei=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const s=o.getContext("2d"),a=s.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),s.fillStyle=a,s.fillRect(0,0,e,e);const i=new Wt(o);return i.colorSpace=$t,i})(),Ri=`
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
`,Ai=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function Fi(){const e=g.useRef(),o=g.useMemo(()=>{const i=new Float32Array(780),l=new Float32Array(260),h=new Float32Array(260),c=new Float32Array(260);for(let u=0;u<260;u++)i[u*3]=(Math.random()-.5)*3.4,i[u*3+1]=(Math.random()-.5)*2.6,i[u*3+2]=-14-Math.random()*4,l[u]=Math.random(),h[u]=.25+Math.random()*.3,c[u]=2+Math.random()*4;const d=new lt;return d.setAttribute("position",new Q(i,3)),d.setAttribute("aPhase",new Q(l,1)),d.setAttribute("aRate",new Q(h,1)),d.setAttribute("aSize",new Q(c,1)),d.boundingSphere=new Rt(new v(0,0,-30),70),d},[]),s=g.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new v(...oe(Y.underGlow))}}),[]);return ee((a,i)=>{const l=e.current?.uniforms;if(!l)return;l.uTime.value+=i;const h=b.subActive?b.subThrottle*b.underwater:0;l.uGain.value+=(h-l.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:Ri,fragmentShader:Ai,uniforms:s,transparent:!0,depthWrite:!1,blending:Qe,fog:!1})})}const Ts=.42;let N=null,tt=null,fe=null,Vo=!1,qe=!0;function Gi(){try{const e=localStorage.getItem("oni.audio");e!==null&&(qe=e==="1")}catch{}return qe}function Ro(e){qe=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return tt&&N&&tt.gain.setTargetAtTime(e?Ts:0,N.currentTime,.12),e&&N?.state==="suspended"&&N.resume(),qe}function Li(e){const o=e.sampleRate*2,s=e.createBuffer(1,o,e.sampleRate),a=s.getChannelData(0);for(let i=0;i<o;i++)a[i]=Math.random()*2-1;return s}function It(e,o,s,a,i,l,h){const c=e.createBufferSource();c.buffer=o,c.loop=!0;const d=e.createBiquadFilter();d.type=s,d.frequency.value=a,d.Q.value=i;const u=e.createGain();return u.gain.value=l,c.connect(d).connect(u).connect(h),c.start(),{src:c,filt:d,gain:u}}function Ao(){if(Vo){N?.state==="suspended"&&N.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;N=new e,Vo=!0,tt=N.createGain(),tt.gain.value=qe?Ts:0;const o=N.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const s=N.createBiquadFilter();s.type="lowpass",s.frequency.value=18e3,s.Q.value=.4,tt.connect(s).connect(o).connect(N.destination);const a=Li(N),i=N.createGain();i.gain.value=1,i.connect(tt);const l=It(N,a,"bandpass",480,.7,.3,i),h=It(N,a,"highpass",1900,.5,0,i),c=It(N,a,"lowpass",220,1.1,.22,i),d=It(N,a,"lowpass",96,1.6,0,i),u=N.createGain();u.gain.value=1,u.connect(o);const p=N.createOscillator();p.type="sawtooth",p.frequency.value=41;const r=N.createBiquadFilter();r.type="lowpass",r.frequency.value=190,r.Q.value=1.2;const f=N.createGain();f.gain.value=0,p.connect(r).connect(f).connect(u),p.start();const m=N.createOscillator(),n=N.createOscillator(),x=N.createGain();m.frequency.value=.07,n.frequency.value=.113,x.gain.value=260,m.connect(x),n.connect(x),x.connect(l.filt.frequency),m.start(),n.start();const w=N.createGain();w.gain.value=0,w.connect(tt);const y=N.createGain();y.gain.value=.16,y.connect(w);for(const[T,L]of[[146.83,1],[220,.5],[293.66,.3]]){const R=N.createOscillator();R.type="sine",R.frequency.value=T;const G=N.createGain();G.gain.value=L;const F=N.createOscillator(),A=N.createGain();F.frequency.value=.21+Math.random()*.1,A.gain.value=T*.004,F.connect(A).connect(R.frequency),F.start(),R.connect(G).connect(y),R.start()}const z=It(N,a,"bandpass",900,3.2,.05,w);return fe={stormBus:i,festBus:w,wind:l,rain:h,sea:c,roar:d,breath:z,buf:a,comp:o,muffle:s,humGain:f,subBus:u},N}function Ii(){if(!N||!fe||!qe)return;const e=N.currentTime;for(const[o,s]of[[0,.16],[.9,.045]]){const a=N.createOscillator(),i=N.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+o),a.frequency.exponentialRampToValueAtTime(1180,e+o+.5),i.gain.setValueAtTime(0,e+o),i.gain.linearRampToValueAtTime(s,e+o+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),a.connect(i).connect(fe.subBus),a.start(e+o),a.stop(e+o+1.5)}}function Ci(e=1){if(!N||!fe||!qe)return;const o=N.currentTime,s=N.createBufferSource();s.buffer=fe.buf;const a=N.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,o),a.frequency.exponentialRampToValueAtTime(240,o+.5),a.Q.value=.7;const i=N.createGain();i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(.5*e,o+.02),i.gain.exponentialRampToValueAtTime(1e-4,o+.8),s.connect(a).connect(i).connect(tt),s.start(o),s.stop(o+.9)}function vt(e,o=1,s=82){if(!N||!fe)return;const a=N.createOscillator(),i=N.createGain();a.type="sine",a.frequency.setValueAtTime(s*2.1,e),a.frequency.exponentialRampToValueAtTime(s,e+.06),a.frequency.exponentialRampToValueAtTime(s*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(o,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(i).connect(fe.festBus),a.start(e),a.stop(e+.7);const l=N.createBufferSource();l.buffer=fe.buf;const h=N.createBiquadFilter();h.type="bandpass",h.frequency.value=1400,h.Q.value=.8;const c=N.createGain();c.gain.setValueAtTime(o*.5,e),c.gain.exponentialRampToValueAtTime(1e-4,e+.09),l.connect(h).connect(c).connect(fe.festBus),l.start(e),l.stop(e+.12)}function Pi(e=1,o=0){if(!N||!fe||!qe)return;const s=N.currentTime+o,a=N.createBufferSource();a.buffer=fe.buf,a.loop=!0;const i=N.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,s),i.frequency.exponentialRampToValueAtTime(70,s+2.6),i.Q.value=.9;const l=N.createGain(),h=.5*e;l.gain.setValueAtTime(0,s),l.gain.linearRampToValueAtTime(h,s+.05),l.gain.exponentialRampToValueAtTime(h*.24,s+.7),l.gain.exponentialRampToValueAtTime(h*.42,s+1.35),l.gain.exponentialRampToValueAtTime(1e-4,s+3.4),a.connect(i).connect(l).connect(fe.stormBus),a.start(s),a.stop(s+3.6);const c=N.createOscillator(),d=N.createGain();c.type="sine",c.frequency.setValueAtTime(46,s),c.frequency.exponentialRampToValueAtTime(28,s+2.2),d.gain.setValueAtTime(0,s),d.gain.linearRampToValueAtTime(.32*e,s+.08),d.gain.exponentialRampToValueAtTime(1e-4,s+2.6),c.connect(d).connect(fe.stormBus),c.start(s),c.stop(s+2.8)}function Di(e=.5){if(!N||!fe||!qe)return;const o=N.currentTime;for(const[s,a,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const l=N.createOscillator(),h=N.createGain();l.type="sine",l.frequency.value=61*s,h.gain.setValueAtTime(0,o),h.gain.linearRampToValueAtTime(e*a,o+.008),h.gain.exponentialRampToValueAtTime(1e-4,o+i),l.connect(h).connect(tt),l.start(o),l.stop(o+i+.1)}}let He=0,Fo=0,Kn=0,Ct=0;function Oi(e){if(!Vo||!N||!fe||!qe)return;const o=N.currentTime,s=e.shelter,a=e.underwater,i=e.subActive?.12:1,l=Math.sin(s*Math.PI*.5)*i*(1-a*.92);fe.stormBus.gain.setTargetAtTime(Math.cos(s*Math.PI*.5),o,.35),fe.festBus.gain.setTargetAtTime(l,o,.35),fe.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),fe.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),fe.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),fe.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),o,.3),fe.muffle.frequency.setTargetAtTime(18e3-a*17400,o,.18);const h=e.subActive?a*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(fe.humGain.gain.setTargetAtTime(h,o,.25),e.splash!==Kn&&(Kn=e.splash,Ci(1)),e.subActive&&a>.5?Ct===0?Ct=o+1.2:o>=Ct&&(Ii(),Ct=o+6.5):Ct=0,s>.06){const d=.9090909090909091;for(He<o&&(He=o+.1);He<o+.35;){const u=Fo%8,p=s*.9;u===0?vt(He,.85*p,74):u===2?vt(He,.45*p,88):u===4?vt(He,.7*p,74):u===6?vt(He,.4*p,92):u===7&&(vt(He,.3*p,96),vt(He+d*.5,.36*p,96)),Fo++,He+=d}}else He=0,Fo=0}function Ni(){const e=g.useRef(!1),o=g.useRef(-1);return ee(()=>{if(Oi(b),b.flash>.55&&!e.current){e.current=!0;const s=b.flashDir,a=500+Math.abs(s.z)*900;Pi(Math.min(1,.55+b.flash*.6),a/340)}else b.flash<.08&&(e.current=!1);b.shot!==o.current&&(b.shot===4&&o.current>=0&&Di(.55),o.current=b.shot)}),null}function Hi(){return ee(()=>li(),-100),null}function _i({every:e=12}){const o=Me(a=>a.gl),s=g.useRef(0);return g.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),ee(()=>{s.current+=1,s.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function Bi({budget:e}){const o=Me(a=>a.setDpr),s=g.useRef(e.dpr[1]);return t.jsx(Ls,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{s.current=Math.max(e.dpr[0],s.current-.25),o(s.current)},onIncline:()=>{s.current=Math.min(e.dpr[1],s.current+.25),o(s.current)},onFallback:()=>{s.current=e.dpr[0],o(e.dpr[0])}})}function Ui(){const e=Me(a=>a.gl),o=Me(a=>a.scene),s=Me(a=>a.camera);return g.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(o,s)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(a)},[e,o,s]),null}function Wi(){const{camera:e,scene:o,gl:s}=Me();return g.useEffect(()=>{},[e,o,s]),null}const $i=new xe(Y.haze),Vi=new xe(Y.underHaze),Yi=new xe(Y.abyss),qn=new xe;function Xi(){const e=Me(o=>o.scene);return ee(()=>{if(!e.fog)return;const o=S.clamp(b.depthBelow/it.deepGrade,0,1),s=S.lerp(.0062,.0142,o);e.fog.density=S.lerp(b.fog,s,b.underwater),qn.copy(Vi).lerp(Yi,o*.8),e.fog.color.lerpColors($i,qn,b.underwater)}),null}function Zi({quality:e,budget:o,onRails:s,playing:a,speed:i,onShot:l,mode:h,onMode:c}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[Y.haze]}),t.jsx("fogExp2",{attach:"fog",args:[Y.haze,b.fog]}),t.jsx(Vs,{storm:b}),t.jsx(sr,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(ga,{quality:e,segments:o.segments}),t.jsx(da,{quality:e,storm:b}),t.jsx(Fa,{quality:e,shadows:o.shadows}),t.jsx(wn,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(wn,{quality:e,shadows:!1,z:Ht,k:_*1.5}),t.jsx(Pa,{quality:e,shadows:o.shadows}),t.jsx(Oa,{quality:e,shadows:o.shadows}),t.jsx(Ja,{quality:e}),t.jsx(tr,{shadows:o.shadows}),t.jsx(ai,{quality:e,shadows:o.shadows}),t.jsx(ur,{quality:e}),t.jsx(xr,{quality:e}),t.jsx(jr,{quality:e}),t.jsx(Lr,{quality:e}),t.jsx(Hr,{onRails:s&&h==="off",playing:a&&h==="off",speed:i,onShot:l,idle:h!=="off"}),t.jsx(Hi,{}),t.jsx(bi,{mode:h,onMode:c}),t.jsx(Ti,{mode:h,onMode:c}),t.jsx(Ni,{}),t.jsx(Xi,{}),t.jsx(Wi,{}),t.jsx(Ui,{}),t.jsx(Bi,{budget:o}),o.shadows&&t.jsx(_i,{every:o.shadowEvery})]})}const Pt="#d63420",Ki="rgba(8,6,16,0.72)",Qn="(max-width: 860px), (max-height: 520px)",Go="min(7.5vh, 62px)";function qi(e=2600,o=!0){const[s,a]=g.useState(!1);return g.useEffect(()=>{if(!o){a(!1);return}let i;const l=()=>{a(!1),clearTimeout(i),i=setTimeout(()=>a(!0),e)};l();for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(h,l,{passive:!0});return()=>{clearTimeout(i);for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(h,l)}},[e,o]),s}function Qi(){const[e,o]=g.useState(()=>typeof window<"u"&&window.matchMedia(Qn).matches);return g.useEffect(()=>{const s=window.matchMedia(Qn),a=()=>o(s.matches);return s.addEventListener?s.addEventListener("change",a):s.addListener(a),()=>{s.removeEventListener?s.removeEventListener("change",a):s.removeListener(a)}},[]),e}function at({on:e,onClick:o,children:s,title:a,wide:i,block:l}){return t.jsx("button",{onClick:o,title:a,style:{appearance:"none",border:`1px solid ${e?Pt:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||l?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:l?"100%":void 0,textAlign:l?"right":"center",minHeight:32},children:s})}function Ji({shot:e,shotIndex:o,shotCount:s,total:a,playing:i,onRails:l,speed:h,tier:c,override:d,dev:u,onPlay:p,onRailsToggle:r,onSpeed:f,onQuality:m,onRestart:n,audio:x,onAudio:w,mode:y,onMode:z,stage:T,veiled:L=!1}){const R=y!=="off",G=Qi(),[F,A]=g.useState(!1),M=qi(2600,!R&&!F),j=g.useRef(),C=g.useRef(),k=g.useRef(),O=g.useRef(),Z=g.useRef(),se=g.useRef(),I=l&&!R;g.useEffect(()=>A(!1),[y]),g.useEffect(()=>{let V,ge=performance.now(),Re=0,nt=0;const Oe=Le=>{if(V=requestAnimationFrame(Oe),j.current&&(j.current.style.transform=`scaleX(${T.progress||0})`),k.current&&T.helm){const H=T.helm;if(H.onFoot)k.current.textContent=H.area==="island"?H.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":H.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(H.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(H.sub){const he=Math.abs(H.speed)*1.94;if(H.berthing)k.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const de=H.maelstrom>.22?H.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":H.stress>.02?"⚠ HULL UNDER PRESSURE":H.scrape>.3?"HULL ON THE ROCK":"",Se=Math.abs(H.relRear*180/Math.PI),$e=Se<6?"· ON COURSE":H.relRear>0?`◀ ${Se.toFixed(0)}°`:`${Se.toFixed(0)}° ▶`,Ve=10,Ye=Math.round(H.depth/H.maxDepth*Ve),ct=Math.round(H.crushDepth/H.maxDepth*Ve);let Ie="";for(let Ne=0;Ne<Ve;Ne++)Ie+=Ne<Ye?Ne>=ct?"▓":"█":Ne===ct?"┃":"·";k.current.textContent=`DEPTH ${H.depth.toFixed(0).padStart(3,"0")}/${H.orderedDepth.toFixed(0).padStart(3,"0")}m ${Ie}  ${he.toFixed(0).padStart(2,"0")} KN
COVE ${Math.round(H.toRear)}m  ${$e}`+(de?`
${de}`:"")}}else{const he=Math.abs(H.speed)*1.94,de=(H.heading*180/Math.PI+180)%360,Se=Math.round((H.burst??0)*5),$e=H.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(Se)}${"·".repeat(5-Se)}`;k.current.textContent=`${he.toFixed(0).padStart(2,"0")} KN   BRG ${de.toFixed(0).padStart(3,"0")}°   ${$e}
`+(H.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":H.moored?"MOORING":H.aground>.3?"AGROUND — HELM OVER":H.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(H.toGate)}m`:H.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(H.toGate)}m`:`GATE ${Math.round(H.toGate)}m`)}}if(O.current){const H=wr(),he=gr(U.chain);O.current.textContent=U.done?"✔ OBJECTIVE COMPLETE":H?`▸ ${U.step+1}/${he}  ${H.text}`:"",O.current.style.color=U.done?"#8fe0a0":"#ffd9cf"}if(Z.current){const H=Math.max(0,Math.min(1,U.hull)),he=Math.max(0,Math.min(1,U.grip)),de=Ve=>{const Ye=Math.round(Ve*12);return"█".repeat(Ye)+"·".repeat(12-Ye)},Se=H>.6?"#8fe0a0":H>.3?"#ffc46b":"#ff6b5a",$e=he>.66?"#ff6b5a":he>.33?"#ffc46b":"rgba(255,255,255,0.45)";Z.current.innerHTML=`<span style="color:${Se}">HULL ${de(H)}</span>`+(he>.02?`<span style="color:${$e};margin-left:14px">VORTEX ${de(he)}</span>`:"")}if(se.current){const H=U.banner,he=se.current;H?(he.dataset.text!==H.text&&(he.dataset.text=H.text,he.innerHTML=`<div class="og-banner-main">${H.text}</div>`+(H.sub?`<div class="og-banner-sub">${H.sub}</div>`:""),he.style.animation="none",he.offsetWidth,he.style.animation=""),he.style.opacity="1"):(he.style.opacity="0",he.dataset.text="")}u&&C.current?(nt++,Re+=Le-ge,ge=Le,Re>400&&(C.current.textContent=`${Math.round(nt*1e3/Re)} fps · shelter ${T.shelter.toFixed(2)} · fog ${(T.fog*1e4).toFixed(1)}e-4 · flash ${T.flash.toFixed(2)}`,Re=0,nt=0)):ge=Le};return V=requestAnimationFrame(Oe),()=>cancelAnimationFrame(V)},[T,u]);const P={opacity:M?.16:1,transform:M?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},K=[{key:"rails",on:!l,label:l?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:r,cinematicOnly:!0},{key:"helm",on:y==="helm",label:y==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>z(y==="helm"?"off":"helm")},{key:"sub",on:y==="sub",label:y==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>z(y==="sub"?"off":"sub")},{key:"foot",on:y==="foot",label:y==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>z(y==="foot"?"off":"foot")}],J=(V,ge)=>t.jsx(at,{on:V.on,onClick:V.click,title:V.title,wide:!0,block:ge,children:V.label},V.key),ae=V=>t.jsxs(t.Fragment,{children:[!R&&t.jsxs(t.Fragment,{children:[t.jsx(at,{on:i,onClick:p,title:"Play / pause the cinematic",block:V,children:i?V?"❙❙  PAUSE":"❙❙":V?"▶  PLAY":"▶"}),[.5,1,2].map(ge=>t.jsxs(at,{on:h===ge,onClick:()=>f(ge),title:`${ge}× speed`,block:V,children:[ge,"×"]},ge))]}),t.jsx(at,{on:!1,onClick:n,title:"Restart from the open sea",block:V,children:V?"↺  RESTART":"↺"}),t.jsx(at,{on:x,onClick:w,title:"Storm, taiko and a temple bell — all synthesised",block:V,children:x?V?"♪  SOUND ON":"♪":V?"♪̸  SOUND OFF":"♪̸"}),t.jsx(at,{on:d!=="auto",wide:!0,block:V,title:"Render tier",onClick:()=>m(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${c.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!L&&t.jsxs(t.Fragment,{children:[[0,1].map(V=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[V?"bottom":"top"]:0,height:I?Go:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},V)),t.jsxs("div",{className:"og-tategaki",style:{opacity:R||F?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:R?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${Pt}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:R?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:j,style:{height:"100%",background:`linear-gradient(90deg, ${Pt}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${Pt}`}})}),t.jsx("div",{className:`og-chrome${R?"":" og-chrome-bottom"}`,style:{...R?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...P},children:G?t.jsxs(t.Fragment,{children:[R&&t.jsx(at,{on:!0,onClick:()=>z("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(at,{on:F,onClick:()=>A(V=>!V),title:"Menu",children:F?"✕":"☰"}),F&&t.jsxs("div",{className:"og-menu",children:[K.filter(V=>!(V.cinematicOnly&&R)).map(V=>J(V,!0)),t.jsx("div",{className:"og-menu-rule"}),ae(!0)]})]}):t.jsxs(t.Fragment,{children:[ae(!1),K.filter(V=>!(V.cinematicOnly&&R)).map(V=>J(V,!1))]})}),!R&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...P,pointerEvents:"none"},children:[l?`SHOT ${String(o+1).padStart(2,"0")} / ${String(s).padStart(2,"0")}`:"FREE LOOK · DRAG TO ORBIT · SCROLL TO ZOOM",t.jsx("span",{style:{opacity:.5},children:l?`  ·  ${Math.round(a)}s`:""})]}),R&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:O,className:"og-objective"}),t.jsx("div",{ref:k,className:"og-readout"}),t.jsx("div",{ref:Z,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:y==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FULL · B COUP DE BURST · DRAG LOOK":y==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · F SURFACE · P PERISCOPE · DRAG LOOK":"WASD MOVE · SHIFT RUN · DRAG LOOK"})]}),R&&t.jsx("div",{ref:se,className:"og-banner"}),u&&t.jsx("div",{ref:C,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Ki,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${I?Go:"0px"};
          --og-bottom: ${I?Go:"0px"};
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
          color: ${Pt};
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
      `})]})}const Lo="#d63420",el=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function tl({onPick:e}){const[o,s]=g.useState(!1),a=g.useRef(),i=620,l=d=>{o||(s(!0),e(d))},[h,c]=g.useState(!1);return g.useEffect(()=>{if(!o)return;const d=setTimeout(()=>c(!0),i);return()=>clearTimeout(d)},[o]),g.useEffect(()=>{const d=u=>{(u.key==="Escape"||u.key==="Enter")&&l("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),h?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:el.map((d,u)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+u*.07}s`},onClick:()=>l(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${Lo};
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
          border-color: ${Lo};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Lo};
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
      `})]})}const Es="#d63420",Rs="#4aa9c9",ol=(e,o,s)=>e<o?o:e>s?s:e;function As(e,o,s){const a=g.useRef(o);a.current=o;const i=g.useRef(null),l=g.useRef({x:0,y:0});g.useEffect(()=>{const h=e.current;if(!h||!s)return;const c=p=>{if(i.current===null){i.current=p.pointerId,l.current={x:p.clientX,y:p.clientY};try{h.setPointerCapture?.(p.pointerId)}catch{}a.current.onMove(0,0,p.clientX,p.clientY),p.preventDefault()}},d=p=>{if(p.pointerId!==i.current)return;const r=l.current;a.current.onMove(p.clientX-r.x,p.clientY-r.y,r.x,r.y),p.preventDefault()},u=p=>{p.pointerId===i.current&&(i.current=null,a.current.onEnd(),p.preventDefault())};return h.addEventListener("pointerdown",c),h.addEventListener("pointermove",d),h.addEventListener("pointerup",u),h.addEventListener("pointercancel",u),()=>{h.removeEventListener("pointerdown",c),h.removeEventListener("pointermove",d),h.removeEventListener("pointerup",u),h.removeEventListener("pointercancel",u)}},[e,s])}function ao({label:e,sub:o,onDown:s,onUp:a,tone:i="plain",wide:l=!1}){const[h,c]=g.useState(!1),d=g.useRef();g.useEffect(()=>{const p=d.current;if(!p)return;let r=null;const f=n=>{r=n.pointerId;try{p.setPointerCapture?.(r)}catch{}c(!0),s(),n.preventDefault(),n.stopPropagation()},m=n=>{n.pointerId===r&&(r=null,c(!1),a(),n.preventDefault(),n.stopPropagation())};return p.addEventListener("pointerdown",f),p.addEventListener("pointerup",m),p.addEventListener("pointercancel",m),p.addEventListener("pointerleave",m),()=>{p.removeEventListener("pointerdown",f),p.removeEventListener("pointerup",m),p.removeEventListener("pointercancel",m),p.removeEventListener("pointerleave",m)}},[s,a]);const u=i==="hot"?Es:i==="cool"?Rs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${h?u:"rgba(255,255,255,0.18)"}`,background:h?`color-mix(in srgb, ${u} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:h?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function nl({active:e}){const o=g.useRef(),s=g.useRef(),a=78;return As(o,{onMove:(i,l,h,c)=>{const d=o.current;if(!d)return;const u=d.getBoundingClientRect(),p=u.top+u.height/2,r=ol((c+l-p)/a,-1,1),f=Math.abs(r)<.1?0:r;te.active=!0,te.planes=-f;const m=s.current;m&&(m.style.transform=`translate(-50%, calc(-50% + ${r*a}px))`,m.style.borderColor=Rs,m.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{te.planes=0;const i=s.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsx("div",{ref:s,className:"og-planes-knob",children:"⇕"})]})}function sl({mode:e}){const o=g.useRef(),s=g.useRef(),a=g.useRef(),i=g.useRef(),l=62,h=7,c=g.useRef(e);if(c.current=e,As(o,{onMove:(p,r,f,m)=>{const n=Math.hypot(p,r),x=n>l?l/n:1,w=p*x,y=r*x,z=s.current,T=a.current;z&&(z.style.transform=`translate(${f-l}px, ${m-l}px)`,z.style.opacity="1"),T&&(T.style.transform=`translate(${f+w-26}px, ${m+y-26}px)`,T.style.opacity="1"),i.current&&(i.current.style.opacity="0");const L=Math.abs(w)<h?0:w/l,R=Math.abs(y)<h?0:y/l;te.active=!0,c.current==="foot"?(te.walk.x=L,te.walk.z=-R):(te.throttle=-R,te.rudder=-L)},onEnd:()=>{s.current&&(s.current.style.opacity="0"),a.current&&(a.current.style.opacity="0"),i.current&&(i.current.style.opacity=""),te.throttle=0,te.rudder=0,te.walk.x=0,te.walk.z=0}},e!=="off"),g.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),g.useEffect(()=>()=>{te.throttle=0,te.rudder=0,te.planes=0,te.boost=!1,te.walk.x=0,te.walk.z=0},[e]),e==="off")return null;const d=e==="sub",u=e==="foot";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:o,style:{position:"fixed",left:0,bottom:0,width:"50vw",height:"62vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:s,style:{position:"fixed",left:0,top:0,width:l*2,height:l*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:a,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${Es}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:i,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:u?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsxs("div",{className:"og-right",children:[d&&t.jsx(nl,{active:!0}),t.jsxs("div",{className:"og-actions",children:[d&&t.jsx(ao,{label:"SURFACE",sub:"blow all",onDown:()=>q.surfaceQueued=!0,onUp:()=>{}}),d&&t.jsx(ao,{label:"PERISCOPE",sub:"6m",tone:"cool",wide:!0,onDown:()=>q.periscopeQueued=!0,onUp:()=>{}}),e==="helm"&&t.jsx(ao,{label:"BURST",sub:"coup de",tone:"cool",wide:!0,onDown:()=>q.burstQueued=!0,onUp:()=>{}}),t.jsx(ao,{label:u?"RUN":"FLANK",sub:u?"»":"full",tone:"hot",onDown:()=>te.boost=!0,onUp:()=>te.boost=!1})]})]}),t.jsx("style",{children:`
        .og-btn {
          border-radius: 10px;
          font: 700 12px/1.25 ui-monospace, SFMono-Regular, Menlo, monospace;
          letter-spacing: 0.12em;
          text-align: center;
          padding: 13px 0;
          width: 74px;
          backdrop-filter: blur(9px);
          -webkit-backdrop-filter: blur(9px);
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          touch-action: none;
          transition: background .12s, border-color .12s, color .12s;
        }
        .og-btn-wide { width: 96px; font-size: 11px; }
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
        .og-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          align-items: flex-end;
        }

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
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1.5px solid rgba(255,255,255,0.3);
          background: rgba(8,6,16,0.55);
          box-shadow: 0 0 18px rgba(74,169,201,0.3);
          pointer-events: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font: 700 15px/1 ui-monospace, Menlo, monospace;
          color: rgba(255,255,255,0.6);
          transition: border-color .12s, background .12s;
        }

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

        /* Short landscape phones: the buttons ride lower, the planes strip
           shortens, and the stick area must not eat the whole screen. */
        @media (max-height: 480px) {
          .og-right { bottom: calc(10px + env(safe-area-inset-bottom, 0px)); gap: 8px; }
          .og-actions { gap: 7px; }
          .og-hint { bottom: calc(66px + env(safe-area-inset-bottom, 0px)); }
          .og-btn { padding: 8px 0; width: 64px; font-size: 10px; }
          .og-btn-wide { width: 80px; font-size: 9px; }
          .og-btn-sub { display: none; }
          .og-planes { height: min(34vh, 130px); width: 52px; }
          .og-planes-knob { width: 36px; height: 36px; font-size: 13px; }
          .og-planes-rail { top: 24px; bottom: 24px; }
          .og-planes-up { top: 7px; }
          .og-planes-dn { bottom: 7px; }
        }
      `})]})}const Jn={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function al(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const rl=null;function dl(){const e=g.useMemo(()=>!1,[]),[o]=g.useState(al),[s,a]=g.useState("auto"),i=s==="auto"?o:s,l=Jn[i]??Jn.high;g.useEffect(()=>{Ma(l.scene!=="low")},[l.scene]),g.useMemo(()=>ns(l.scene),[l.scene]),g.useEffect(()=>ii(),[]);const h=g.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[c,d]=g.useState(0),[u,p]=g.useState(!0),[r,f]=g.useState(!0),[m,n]=g.useState(1),[x,w]=g.useState(On[0]),[y,z]=g.useState(0),[T,L]=g.useState(Gi),[R,G]=g.useState(()=>{if(typeof location>"u")return"off";const P=new URLSearchParams(location.search).get("mode");return P==="helm"||P==="sub"||P==="foot"?P:"off"});g.useEffect(()=>{if(!T)return;const P=()=>{Ao(),Ro(!0)};for(const K of["pointerdown","keydown","touchstart"])window.addEventListener(K,P,{once:!0,passive:!0});return()=>{for(const K of["pointerdown","keydown","touchstart"])window.removeEventListener(K,P)}},[T]);const F=g.useCallback(()=>{L(P=>{const K=!P;return K&&Ao(),Ro(K),K})},[]),[A,M]=g.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),j=g.useCallback(P=>{T&&(Ao(),Ro(!0)),P==="off"?(b.jumpTo=0,p(!0),f(!0)):G(P),M(!0)},[T]),[C,k]=g.useState(!1),O=g.useRef(!0);g.useEffect(()=>{if(O.current){O.current=!1;return}k(!0);const P=setTimeout(()=>k(!1),210);return()=>clearTimeout(P)},[R]);const Z=g.useCallback((P,K)=>{z(P),w(K)},[]),se=g.useCallback(()=>{va(),d(P=>P+1),p(!0),f(!0)},[]),I=g.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(g.Suspense,{fallback:null,children:t.jsx(rl,{})}):t.jsxs(t.Fragment,{children:[t.jsx(Is,{shadows:l.shadows,dpr:l.dpr,gl:{antialias:l.aa,powerPreference:"high-performance",toneMapping:Bs,toneMappingExposure:Us,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(g.Suspense,{fallback:null,children:t.jsx(Zi,{quality:l.scene,budget:l,onRails:r,playing:u,speed:m,onShot:Z,mode:R,onMode:G},c)})}),h&&A&&t.jsx(sl,{mode:R}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:C?1:0,transition:C?"opacity .2s ease-in":"opacity .42s ease-out"}}),!A&&t.jsx(tl,{onPick:j}),t.jsx(Ji,{veiled:!A,shot:x,shotIndex:y,shotCount:On.length,total:$o,playing:u,onRails:r,speed:m,tier:i,override:s,dev:I,onPlay:()=>p(P=>!P),onRailsToggle:()=>f(P=>!P),onSpeed:n,onQuality:a,onRestart:se,audio:T,onAudio:F,mode:R,onMode:G,stage:b})]})}export{dl as default};
