var da=Object.defineProperty;var ua=(e,o,n)=>o in e?da(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var In=(e,o,n)=>ua(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as te,j as t,d as Es,f as ke,h as pa,i as ma}from"./vendor-C2HIMx-P.js";import{t as ge,c as j,aD as Ko,au as fn,d as xn,a5 as Re,aJ as fa,f as xa,Y as Ln,a0 as Gn,ag as z,h as ee,aK as ga,ay as wa,az as Nt,aA as Ht,aq as Rs,R as ya,M as Ve,o as Je,at as jt,ax as it,aL as _t,aM as Bt,a4 as ba,a8 as bt,ar as Ut,av as As,aC as va,A as Ma}from"./three-Zo_RlN_K.js";import{f as Ot,m as eo,P as ja}from"./index-CpRQjLF5.js";const K={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},T={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},bo={dir:[.72,.52,-.44],col:"#f2e9cf"},yt={sea:.00105,bay:48e-5,deepGrade:210},Sa=1.15;function se(e){const o=new ge(e);return[o.r,o.g,o.b]}const za=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,ka=`
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
`;function Ta({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new j(...se(K.skyHigh))},uLow:{value:new j(...se(K.skyLow))},uCloud:{value:new j(...se(K.cloud))},uCloudLit:{value:new j(...se(K.cloudLit))},uEmber:{value:new j(...se(T.ember))},uFlash:{value:0},uFlashColor:{value:new j(...se(K.boltGlow))},uFlashDir:{value:new j(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new j(...bo.dir).normalize()},uMoonCol:{value:new j(...se(bo.col))},uUnder:{value:0},uUnderCol:{value:new j(...se(K.underHaze))}}),[]);return te((s,r)=>{const i=o.current?.uniforms;i&&(i.uTime.value+=r,i.uFlash.value=e?.flash??0,e?.flashDir&&i.uFlashDir.value.copy(e.flashDir),i.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:za,fragmentShader:ka,uniforms:n,side:Ko,depthWrite:!1,depthTest:!1,fog:!1})]})}const W=1.9,$=e=>e*W,le={x:0,z:$(-60)},mt=$(300),go=$(175),Ea=118,G={x:0,z:$(-402),r:$(215),baseY:300,squash:[1.18,1.04,.98]},Qt=[[-.361,.301,.883],[.361,.301,.883]],gn=[0,.02,.9998],wn=[0,-.419,.908];function yn(e,o=1){const[n,s,r]=G.squash;return{x:G.x+e[0]*G.r*n*o,y:G.baseY+e[1]*G.r*s*o,z:G.z+e[2]*G.r*r*o}}const Me=Qt.map(e=>yn(e)),de={...yn(wn),halfWidth:74,height:62};yn(gn,.94);const Q={x:$(-152),y:4.5,z:$(-104),r:$(78)},Pn=2.35,Mt=[Math.sin(Pn),Math.cos(Pn)],Y=(()=>{const e=mt+go*.35,o=le.x+Mt[0]*e,n=le.z+Mt[1]*e;return{x:o,z:n,pool:$(46),benchY:3.6,reach:$(560),gate:{x:o-Mt[0]*$(44),z:n-Mt[1]*$(44)},berth:{x:o+Mt[0]*$(12),z:n+Mt[1]*$(12)},dir:Mt}})(),Ra=[{rank:1,role:"east-south",ang:.75,dist:$(730),r:$(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:$(730),r:$(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:$(770),r:$(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:$(690),r:$(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:$(690),r:$(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:$(765),r:$(150),depth:42,dir:1,speed:35}],Fe=[];function Fs(e){const o=e==="low"?3:e==="mid"?5:7;Fe.length=0;for(const n of Ra)n.rank>o||Fe.push({role:n.role,x:le.x+Math.sin(n.ang)*n.dist,z:le.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Fe}const Aa=e=>Fe.find(o=>o.role===e)??Fe[0];Fs("high");function Cs(e,o,n=0){let s=0,r=0;const i=1-Ge(8,34,n);if(i<=0)return{vx:s,vz:r,danger:0};let c=0;for(const h of Fe){const d=e-h.x,p=o-h.z,x=Math.hypot(d,p);if(x>h.r*1.7||x<.001)continue;const u=x/h.r,f=1-Ge(1,1.6,u),a=h.speed*(u/.3)*Math.exp(1-u/.3)*.62*f,m=h.speed*.55*Math.exp(-u*u*2.6)*f+h.speed*.1*f,g=1/x;s+=(-p*g*a*h.dir-d*g*m)*i,r+=(d*g*a*h.dir-p*g*m)*i,c=Math.max(c,(1-Ge(.15,1.15,u))*i)}return{vx:s,vz:r,danger:c}}const Is={x:0,halfWidth:$(96)},St=$(258),to=$(624),vo={safe:260,range:1150},Fa=0,wo=$(1500),Mo=e=>e<0?0:e>1?1:e;function Ca(e,o,n=4){let s=0,r=1,i=1,c=0;for(let h=0;h<n;h++){const d=1-Math.abs(Ot(e*i,o*i,1)*2-1);s+=d*d*r,c+=r,r*=.52,i*=2.07}return s/c}const Ge=(e,o,n)=>{const s=Mo((n-e)/(o-e));return s*s*(3-2*s)};function Ia(e){if(e>$(430))return 1e4;const o=1-Ge($(430),$(205),e),n=Ge($(150),$(-30),e);return Is.halfWidth+o*$(620)+n*$(300)}function La(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let s=Ea;return s+=o*190,s+=Math.max(0,n)*46,s-=Math.max(0,-n)*26,s}function ie(e,o){const n=e-le.x,s=o-le.z,r=Math.hypot(n,s),i=Math.atan2(n,s),c=(r-mt)/go,h=Math.exp(-c*c*1.35)*La(i),d=Math.max(0,r-mt-go*.55),p=-Math.pow(d/210,1.6)*175,x=Math.max(0,mt-go*.5-r),u=-Ge(0,150,x)*46,f=Mo(h/60),a=(Ca(e*.0052/W+13,o*.0052/W-21,4)-.42)*168*f,m=(Ot(e*.0042/W+31,o*.0042/W-17,4)-.5)*84*f,g=(Ot(e*.021-5,o*.021+9,3)-.5)*17*f;let v=h+p+u+a+m+g;const y=Ia(o),l=1-Ge(y,y+$(105),Math.abs(e-Is.x)),M=1-Ge($(-40),$(-190),o),A=l*M;v=v*(1-A)+Math.min(v,-34)*A;const F=Math.hypot(e-G.x,o-G.z);v+=Math.exp(-Math.pow(F/(G.r*1.55),2))*62;const S=(e-Q.x)/$(76),R=(o-Q.z)/$(58),I=(1-Ge(.72,1.18,Math.hypot(S,R)))*Mo((v+34)/34);v=v*(1-I)+Q.y*I;const E=e-Y.x,k=o-Y.z;if(Math.abs(E)+Math.abs(k)<Y.reach+$(140)){const P=Math.max(0,Math.min(Y.reach,E*Y.dir[0]+k*Y.dir[1])),C=E-Y.dir[0]*P,D=k-Y.dir[1]*P,Z=Math.hypot(C,D),J=$(30)+P/Y.reach*$(48),L=1-Ge(J,J+$(62),Z);v=v*(1-L)+Math.min(v,-26)*L;const X=Math.hypot(E,k),oe=1-Ge(Y.pool*.55,Y.pool,X);v=v*(1-oe)+Math.min(v,-14)*oe;const V=(e-Y.gate.x)/$(30),re=(o-Y.gate.z)/$(24),je=1-Ge(.72,1.18,Math.hypot(V,re));v=v*(1-je)+Y.benchY*je}return v}function bn(e,o,n=3){const s=ie(e+n,o)-ie(e-n,o),r=ie(e,o+n)-ie(e,o-n),i=-s,c=2*n,h=-r,d=Math.hypot(i,c,h)||1;return[i/d,c/d,h/d]}function Ga(e,o,n=3){return Math.acos(bn(e,o,n)[1])}function oo(e,o){const n=Ge($(250),$(40),o),s=1-Ge(mt-$(40),mt+$(90),Math.hypot(e-le.x,o-le.z)),r=(1-Ge($(60),$(170),Math.hypot(e-Y.x,o-Y.z)))*.85;return Mo(Math.max(Math.min(n,s),r))}const Ls=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],Pa=Math.PI*2;function Oa(e,o,n){let s=0,r=0,i=0;for(const c of Fe){const h=e-c.x,d=o-c.z,p=Math.max(1,Math.hypot(h,d));if(p>c.r*1.75)continue;const x=p/c.r,u=Math.exp(-3*x*x);s-=c.depth*u;const f=c.depth*6*x*u/c.r;r+=f*(h/p),i+=f*(d/p);const a=Math.atan2(d,h),m=Math.sin(a*3*c.dir+x*14-n*2.2),g=x*Math.exp(1-x)*(1-Da(x));s+=m*g*1.6}return{y:s,dx:r,dz:i}}function Da(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function Qe(e,o,n,s=1){let r=0,i=0,c=0;for(const d of Ls){const p=Pa/d.len,x=Math.sqrt(9.81/p),u=Math.hypot(d.dir[0],d.dir[1]),f=d.dir[0]/u,a=d.dir[1]/u,m=p*(f*e+a*o-x*n),g=d.amp*s;r+=g*Math.sin(m);const v=g*p*Math.cos(m);i+=v*f,c+=v*a}const h=Oa(e,o,n);return r+=h.y,i+=h.dx,c+=h.dz,{y:r,dx:i,dz:c}}const Na=Ls.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Ha=()=>Fe.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),_a=()=>Fe.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),Ba=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*W).toFixed(1)}, ${(250*W).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(mt-40*W).toFixed(1)}, ${(mt+90*W).toFixed(1)},
      length(p - vec2(${le.x.toFixed(1)}, ${le.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*W).toFixed(1)}, ${(170*W).toFixed(1)},
      length(p - vec2(${Y.x.toFixed(1)}, ${Y.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Ua=()=>`
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
${Ba}

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
${Na}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Ha()}

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
`,Wa=()=>`
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
${_a()}
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
`;function $a(e,o){const n=new Uint8Array(e*e*4);for(let r=0;r<e;r++)for(let i=0;i<e;i++){const c=le.x+((i+.5)/e-.5)*o,h=le.z+((r+.5)/e-.5)*o,d=ie(c,h),p=z.clamp(-d/46,0,1),x=(r*e+i)*4;n[x]=Math.round(p*255),n[x+1]=n[x],n[x+2]=n[x],n[x+3]=255}const s=new fa(n,e,e,xa);return s.minFilter=Ln,s.magFilter=Ln,s.wrapS=Gn,s.wrapT=Gn,s.needsUpdate=!0,s}const jo={low:112,mid:190,high:286},Zo=6400;function Ya(e){const o=w.useRef(),n=Zo/(jo[e]??jo.high);return te(s=>{const r=o.current;r&&(r.position.x=Math.round((s.camera.position.x-le.x)/n)*n,r.position.z=Math.round((s.camera.position.z-le.z)/n)*n)}),o}function Va({quality:e="high",storm:o}){const n=w.useRef(),s=Ya(e),{geometry:r,uniforms:i,landTex:c,vert:h,frag:d}=w.useMemo(()=>{const p=jo[e]??jo.high,x=new fn(Zo,Zo,p,p);x.rotateX(-Math.PI/2),x.translate(le.x,0,le.z);const u=wo*1.05,f=$a(e==="low"?160:256,u),a={uTime:{value:0},uLand:{value:f},uSpan:{value:u},uCentre:{value:new xn(le.x,le.z)},uDeep:{value:new j(...se(K.seaDeep))},uShallow:{value:new j(...se(K.seaShallow))},uFoam:{value:new j(...se(K.foam))},uSkyLow:{value:new j(...se(K.skyLow))},uGilt:{value:new j(...se(T.gilt))},uEmber:{value:new j(...se(T.ember))},uFogColor:{value:new j(...se(K.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new j(...se(K.abyss))},uUnderGlow:{value:new j(...se(K.underGlow))},uDepthFade:{value:0},uMoonDir:{value:Xa.clone()},uMoonCol:{value:new j(...se(Ka))},uEyeA:{value:new j(Me[0].x,Me[0].y,Me[0].z)},uEyeB:{value:new j(Me[1].x,Me[1].y,Me[1].z)},uFlash:{value:0},uFlashColor:{value:new j(...se(K.boltGlow))},uCameraPos:{value:new j}};return{geometry:x,uniforms:a,landTex:f,vert:Ua(),frag:Wa()}},[e]);return te((p,x)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=x,u.uCameraPos.value.copy(p.camera.position),u.uFlash.value=o?.flash??0,u.uFogDensity.value=o?.fog??.0011;const f=Math.min(1,Math.max(0,(o?.depthBelow??0)/yt.deepGrade));u.uDepthFade.value=f,On.copy(Qa).lerp(qa,f*.8),u.uFogColor.value.lerpVectors(Za,On,o?.underwater??0)}),t.jsx("mesh",{ref:s,geometry:r,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:d,uniforms:i,transparent:!1,side:Re},c.uuid)})}const Xa=new j(...bo.dir).normalize(),Ka=bo.col,Za=new j(...se(K.haze)),Qa=new j(...se(K.underHaze)),qa=new j(...se(K.abyss)),On=new j;function Ja({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const s=o,r=new fn(wo,wo,s,s);r.rotateX(-Math.PI/2);const i=r.attributes.position,c=i.count,h=new Float32Array(c*3),d=new ge(K.rock),p=new ge(K.rockLit),x=new ge("#0b0e18"),u=new ge(K.snow),f=new ge(T.rockWarm),a=new ge;for(let m=0;m<c;m++){const g=i.getX(m)+le.x,v=i.getZ(m)+le.z,y=ie(g,v);i.setX(m,g),i.setY(m,y),i.setZ(m,v);const l=bn(g,v,wo/s)[1],M=Math.max(0,(l-.55)/.45);a.copy(d).lerp(p,z.clamp(y/190,0,1));const A=1-z.clamp((y-Fa)/13,0,1);a.lerp(x,A*.85);const F=z.clamp((g-le.x)/260,0,1),S=96-F*42,R=z.clamp((y-S)/60,0,1)*M;a.lerp(u,R*(.45+F*.5));const I=Math.hypot(g-G.x,v-G.z),E=Math.exp(-Math.pow(I/330,2)),k=z.clamp((v-G.z)/260,0,1);a.lerp(f,E*k*.6*(1-R)),h[m*3]=a.r,h[m*3+1]=a.g,h[m*3+2]=a.b}return r.setAttribute("color",new ee(h,3)),r.computeVertexNormals(),r.computeBoundingSphere(),r},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const vn=-30,Mn=330,er=150,fe={x:de.x,y:de.y-40,z:de.z-er-(vn+Mn)},Ae={centre:[0,96,vn],radii:[350,235,Mn]},Tt={x:fe.x+Ae.centre[0],y:fe.y+Ae.centre[1],z:fe.z+Ae.centre[2]};function Qo(e,o=.06){const n=(e.x-Tt.x)/Ae.radii[0],s=(e.y-Tt.y)/Ae.radii[1],r=(e.z-Tt.z)/Ae.radii[2],i=Math.sqrt(n*n+s*s+r*r),c=1+o;if(i>=c)return null;const h=i<1e-4?0:c/i;return e.x=Tt.x+(h?n*h:0)*Ae.radii[0],e.y=Tt.y+(h?s*h:c)*Ae.radii[1],e.z=Tt.z+(h?r*h:0)*Ae.radii[2],e}const ae={y:0,halfX:290,zFront:228,zBack:-240},ze={y:40,z:vn+Mn-40,halfX:96,depth:120},Ze={zTop:ze.z-54,zBottom:140,halfX:74,steps:16},_={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},ye={y:74,z:_.z+_.halfZ+26,halfX:96,depth:40},gt=ye.y+3.5,Pe={y:-95,halfX:220,halfZ:175,ceiling:-34},we={x:0,z:84,halfX:52,halfZ:40},pe={y:52,halfZ:205,x:252,tiers:3,tierRise:46},so=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],ue={x:74,halfW:14,zFoot:_.z+_.halfZ+158,zTop:ye.z+ye.depth/2-6},Gs=[{kind:"rampZ",x0:-74-ue.halfW,x1:-74+ue.halfW,z0:ue.zFoot,z1:ue.zTop,y0:0,y1:gt},{kind:"rampZ",x0:ue.x-ue.halfW,x1:ue.x+ue.halfW,z0:ue.zFoot,z1:ue.zTop,y0:0,y1:gt},{kind:"flat",x0:-96,x1:ye.halfX,z0:ye.z-ye.depth/2-2,z1:ue.zTop+10,y:gt},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:pe.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:pe.y-.5},{kind:"flat",x0:pe.x-38,x1:pe.x+38,z0:-225,z1:pe.halfZ+20,y:pe.y-.5}],tr=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Ps=(()=>{const e=[],o=[],n=[],s=_.halfX+6,r=[s,s+9],i=[s+11,s+20],c=[s,s+20],h=[-212,-200],d=[-264,-252],p=[gt];for(let u=2;u<=_.storeys;u++)p.push(_.plinth+u*_.storey+1.5);e.push({kind:"flat",x0:ye.halfX-6,x1:s+20,z0:-212,z1:-196,y:gt}),o.push([(ye.halfX-6+s+20)/2,gt,-204,s+26-ye.halfX,16]);for(let u=0;u<p.length-1;u++){const f=p[u],a=p[u+1],m=(f+a)/2;e.push({kind:"rampZ",x0:r[0],x1:r[1],z0:h[0],z1:d[1],y0:f,y1:m}),n.push({x0:r[0],x1:r[1],z0:h[0],z1:d[1],y0:f,y1:m}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:d[0],z1:d[1],y:m}),o.push([(c[0]+c[1])/2,m,(d[0]+d[1])/2,c[1]-c[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:d[1],z1:h[0],y0:m,y1:a}),n.push({x0:i[0],x1:i[1],z0:d[1],z1:h[0],y0:m,y1:a}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:h[0],z1:h[1],y:a}),o.push([(c[0]+c[1])/2,a,(h[0]+h[1])/2,c[1]-c[0],h[1]-h[0]])}for(let u=1;u<p.length-1;u++){const a=1-Math.min(_.storeys,u+2)*_.taper,m=_.halfX*a,g=_.z+_.halfZ*a,v=p[u];e.push({kind:"flat",x0:m-4,x1:s,z0:-224,z1:-212,y:v}),o.push([(m-4+s)/2,v,-218,s-m+4,12]),e.push({kind:"flat",x0:-m-6,x1:m+6,z0:g,z1:-212,y:v}),o.push([0,v,(g-212)/2,m*2+12,-212-g])}const x=p[p.length-1];return e.push({kind:"flat",x0:58,x1:s,z0:-248,z1:-212,y:x}),o.push([(s+58)/2,x,-230,s-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[s,s+20],z:[d[0],h[1]]}}})();Gs.push(...Ps.walks);function or(e,o){let n=0;for(const s of Gs){if(e<s.x0||e>s.x1)continue;const r=Math.min(s.z0,s.z1),i=Math.max(s.z0,s.z1);if(!(o<r||o>i))if(s.kind==="flat")s.y>n&&(n=s.y);else{const c=tr((o-s.z0)/(s.z1-s.z0)),h=s.y0+(s.y1-s.y0)*c;h>n&&(n=h)}}return n}const b={t:0,flash:0,flashDir:new j(0,.4,-1),fog:yt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new j(0,0,0),helmActive:!1,helmPos:new j(0,0,0),helmSpeed:0,subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new j(0,60,-200)}};function nr(){b.t=0,b.progress=0,b.flash=0,b.fog=yt.sea,b.rain=1,b.shot=0,b.underwater=0,b.depthBelow=0,b.whirlNear=0,b.subActive=!1,b.subThrottle=0}const Co=new Map;let Os=!0;function sr(e){Os=!!e}function ar(e){const o=eo(e);return Co.has(o)||Co.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),Co.get(o)}function Ye(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let s=!0;return ar(e).then(r=>{s&&n(r&&Os)}),()=>{s=!1}},[e]),o}const ut=Qt.map(e=>new j(...e).normalize()),Ds=new j(...gn).normalize(),qo=new j(...wn).normalize();function rr(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const d of ut){const p=e.dot(d),x=Math.pow(Math.max(0,p),46);o-=x*.3}const s=Math.max(0,e.dot(Ds)),r=Math.pow(s,150)*(1-Math.max(0,e.y)*.5);o-=r*.19;for(const d of ut){const p=new j(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,p),26)*.075}const i=Math.max(0,e.dot(qo));o-=Math.pow(i,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const c=Math.pow(Math.max(0,e.dot(ut[0])),30)+Math.pow(Math.max(0,e.dot(ut[1])),30),h=1-Math.min(1,c);return o+=(Ot(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(Ot(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const ir=178*1.9,_e=G.r/ir;function Dn(e,o){const n=e*_e,s=[new j(n*74,96*_e,-20*_e),new j(n*142,176*_e,-58*_e),new j(n*196,268*_e,-76*_e),new j(n*222,356*_e,-52*_e),new j(n*206,424*_e,8*_e),new j(n*154,462*_e,72*_e)],r=new j;for(const x of s)r.set(G.x+x.x,G.baseY+x.y,G.z+x.z),Qo(r,.12)&&x.set(r.x-G.x,r.y-G.baseY,r.z-G.z);const i=new Nt(s),c=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,d=new Ht(i,c,1,h,!1),p=d.attributes.position;for(let x=0;x<=c;x++){const u=x/c,f=34*_e*Math.pow(1-u,.72)*(1+Math.sin(u*Math.PI)*.16),a=i.getPoint(u);for(let m=0;m<=h;m++){const g=x*(h+1)+m;if(g>=p.count)continue;const v=p.getX(g)-a.x,y=p.getY(g)-a.y,l=p.getZ(g)-a.z;p.setXYZ(g,a.x+v*f,a.y+y*f,a.z+l*f)}}return p.needsUpdate=!0,d.computeVertexNormals(),d}const lr={low:4,mid:6,high:7},Ns="skull-island.opt.glb",$t={height:1,yaw:0,lift:.02},Io=new ya,Nn=new j,ao=new j;function cr(e,o,n){ao.set(o[0],o[1],o[2]).normalize(),Nn.copy(ao).multiplyScalar(G.r*4),Io.set(Nn,ao.clone().negate()),Io.far=G.r*8;const s=Io.intersectObject(e,!0)[0];return s?s.point.clone().addScaledVector(ao,-n):null}function hr({shadows:e}){const{scene:o}=Es(eo(Ns)),{object:n,eyes:s,nose:r,mouth:i}=w.useMemo(()=>{const c=o.clone(!0),h=new Rs().setFromObject(c),d=new j,p=new j;h.getSize(d),h.getCenter(p);const x=G.r*G.squash[1]*1.62,u=d.y>1e-4?x*$t.height/d.y:1,f=G.r*G.squash[1]*$t.lift;c.scale.setScalar(u),c.rotation.set(0,$t.yaw,0),c.position.set(0,-p.y*u+f,0);const a=p.x*u,m=p.z*u,g=Math.cos($t.yaw),v=Math.sin($t.yaw);c.position.x=-(a*g+m*v),c.position.z=-(-a*v+m*g),c.updateMatrixWorld(!0);let y=0,l=0;const M={x:0,y:0,z:0},A=new j,F=[];c.traverse(C=>{C.isMesh&&F.push(C)});for(const C of F){const D=C.geometry.clone();for(const L of["position","normal"]){const X=D.attributes[L];if(!X||X.array instanceof Float32Array)continue;const oe=new Float32Array(X.count*3);for(let V=0;V<X.count;V++)A.fromBufferAttribute(X,V),oe[V*3]=A.x,oe[V*3+1]=A.y,oe[V*3+2]=A.z;D.setAttribute(L,new ee(oe,3))}D.applyMatrix4(C.matrixWorld);const Z=D.attributes.position;l+=Z.count;for(let L=0;L<Z.count;L++)M.x=Z.getX(L)+G.x,M.y=Z.getY(L)+G.baseY,M.z=Z.getZ(L)+G.z,Qo(M,.05)&&(Z.setXYZ(L,M.x-G.x,M.y-G.baseY,M.z-G.z),y++);y&&D.computeVertexNormals(),Z.needsUpdate=!0,D.computeBoundingSphere(),D.computeBoundingBox(),C.geometry=D,C.castShadow=e,C.receiveShadow=!1;const J=Array.isArray(C.material)?C.material:[C.material];for(const L of J)L.color?.multiply(dr),L.roughness=.94,L.metalness=.02}for(const C of[c,...F])C.position.set(0,0,0),C.quaternion.identity(),C.scale.set(1,1,1),C.updateMatrix();c.updateMatrixWorld(!0);const S=(C,D=1)=>{const[Z,J,L]=G.squash;return new j(C[0]*G.r*Z*D,C[1]*G.r*J*D,C[2]*G.r*L*D)},R=Qt.map(C=>cr(c,C,G.r*.1)??S(C,.82)),I=new j().addVectors(R[0],R[1]).multiplyScalar(.5),E=new j().addVectors(S(Qt[0],.82),S(Qt[1],.82)).multiplyScalar(.5),k=I.clone().sub(E),P=C=>{const D={x:C.x+G.x,y:C.y+G.baseY,z:C.z+G.z};return Qo(D,.22)&&C.set(D.x-G.x,D.y-G.baseY,D.z-G.z),C};return{object:c,eyes:R.map(P),nose:P(S(gn,.87).add(k)),mouth:P(S(wn,.9).add(k))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Hs,{eyes:s,nose:r,mouth:i,teeth:null,cast:e})]})}const dr=new ge("#8f8a84");function Hs({eyes:e,nose:o,mouth:n,teeth:s,cast:r}){const i=w.useRef(),c=w.useRef(),h=w.useRef();return te(()=>{const d=b.t,p=.82+.18*Math.sin(d*2.3)*Math.sin(d*.71),x=.82+.18*Math.sin(d*1.9+2.1)*Math.sin(d*.63),u=.86+.14*Math.sin(d*1.4+.8);i.current&&(i.current.emissiveIntensity=5.2*p+b.flash*2),c.current&&(c.current.emissiveIntensity=5.2*x+b.flash*2),h.current&&(h.current.emissiveIntensity=3.4*u)}),t.jsxs(t.Fragment,{children:[e.map((d,p)=>t.jsxs("mesh",{position:d,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[G.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:p===0?i:c,color:T.furnace,emissive:T.ember,emissiveIntensity:5.2,toneMapped:!1,side:Re,roughness:1})]},p)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[G.r*.046,G.r*.083,3]}),t.jsx("meshStandardMaterial",{color:T.emberDeep,emissive:T.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,G.r*.05,-G.r*.16],children:[t.jsx("planeGeometry",{args:[G.r*.62,G.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:T.ember,emissive:T.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:Re})]}),s?.map((d,p)=>t.jsxs("mesh",{position:d.pos,scale:d.scale,rotation:[0,0,d.rot],castShadow:r,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:T.emberDeep,emissiveIntensity:.42,roughness:.78})]},p))]})]})}const ur=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function pr({quality:e="high",shadows:o=!0}){const s=Ye(Ns)&&e!=="low"&&ur!=="proc",{dome:r,hornL:i,hornR:c,teeth:h}=w.useMemo(()=>{const a=new ga(G.r,lr[e]??7),m=a.attributes.position,g=new Float32Array(m.count*3),v=new ge(K.rock),y=new ge(T.rockWarm),l=new ge("#120b10"),M=new ge,A=new j;for(let I=0;I<m.count;I++){A.set(m.getX(I),m.getY(I),m.getZ(I)).normalize();const E=G.r*rr(A),[k,P,C]=G.squash;m.setXYZ(I,A.x*E*k,A.y*E*P,A.z*E*C);const D=Math.max(Math.pow(Math.max(0,A.dot(ut[0])),5),Math.pow(Math.max(0,A.dot(ut[1])),5),Math.pow(Math.max(0,A.dot(qo)),6)*.9);M.copy(v).lerp(y,Math.min(1,D*1.5+Math.max(0,A.z)*.22));const Z=Math.max(Math.pow(Math.max(0,A.dot(ut[0])),40),Math.pow(Math.max(0,A.dot(ut[1])),40));M.lerp(l,Z),g[I*3]=M.r,g[I*3+1]=M.g,g[I*3+2]=M.b}a.setAttribute("color",new ee(g,3)),a.computeVertexNormals();const F=new wa(1,1,1),S=[],R=9;for(let I=0;I<R;I++){const E=I/(R-1)*2-1,k=de.halfWidth*2.1,P=E*k*.5,C=Math.pow(Math.abs(E),1.7)*14,D=46-Math.abs(E)*13+I%2*7;S.push({pos:[P,de.height*.5-C-D*.5,6],scale:[k/R*.76,D,52],rot:E*.13})}return F.dispose?.(),{dome:a,hornL:Dn(-1,e),hornR:Dn(1,e),teeth:S}},[e]),d=o,[p,x,u]=G.squash,f=(a,m)=>[a.x*G.r*p*m,a.y*G.r*x*m,a.z*G.r*u*m];return t.jsx("group",{position:[G.x,G.baseY,G.z],children:s?t.jsx(w.Suspense,{fallback:t.jsx(Hn,{dome:r,hornL:i,hornR:c,cast:d}),children:t.jsx(hr,{shadows:d})}):t.jsxs(t.Fragment,{children:[t.jsx(Hn,{dome:r,hornL:i,hornR:c,cast:d}),t.jsx(Hs,{eyes:ut.map(a=>f(a,.82)),nose:f(Ds,.87),mouth:f(qo,.96),teeth:h,cast:d})]})})}function Hn({dome:e,hornL:o,hornR:n,cast:s}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:s,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function qe({matrices:e,target:o}){const n=w.useRef(!1);return te(()=>{if(n.current||!o.current)return;const s=Math.min(e.length,o.current.count);for(let r=0;r<s;r++)o.current.setMatrixAt(r,e[r]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const Et=190,st=130,ro=9.5;function _n(e,o,n,s=24){const r=new Nt(e),i=new Ht(r,s,1,4,!1),c=i.attributes.position,h=new j(0,1,0),d=new j,p=new j,x=new j,u=new j,f=new j;for(let a=0;a<=s;a++){const m=a/s;r.getPointAt(m,p),r.getTangentAt(m,d),u.crossVectors(d,h).normalize(),x.crossVectors(u,d).normalize();for(let g=0;g<=4;g++){const v=a*5+g;if(v>=c.count)continue;const y=g/4*Math.PI*2+Math.PI/4,l=Math.cos(y)*o*.7071,M=Math.sin(y)*n*.7071;f.copy(p).addScaledVector(u,l).addScaledVector(x,M),c.setXYZ(v,f.x,f.y,f.z)}}return c.needsUpdate=!0,i.computeVertexNormals(),i}function mr(e,o,n,s=40){const r=[];for(let d=0;d<=10;d++){const p=d/10*2-1;r.push(new j(p*e,-30*(1-p*p),0))}const i=new Nt(r),c=new Ht(i,s,n,8,!1),h=c.attributes.position;for(let d=0;d<=s;d++){const p=d/s*2-1,x=1+(1-p*p)*.85,u=i.getPointAt(d/s);for(let f=0;f<=8;f++){const a=d*9+f;a>=h.count||h.setXYZ(a,u.x+(h.getX(a)-u.x)*x,u.y+(h.getY(a)-u.y)*x,u.z+(h.getZ(a)-u.z)*x)}}return h.needsUpdate=!0,c.computeVertexNormals(),c}function Bn({quality:e="high",shadows:o=!0,z:n=St,k:s=W}){const r=w.useRef(),i=w.useRef(),c=w.useRef(),h=w.useRef(),d=w.useMemo(()=>{const g=Et/2,v=st,y=_n([new j(-g-40,v+6,0),new j(-g-22,v+15.5,0),new j(0,v+20,0),new j(g+22,v+15.5,0),new j(g+40,v+6,0)],16,9,30),l=_n([new j(-g-30,v+2,0),new j(0,v+8,0),new j(g+30,v+2,0)],11,5,18);return{kasagi:y,shimaki:l,rope:mr(g-6,30,6.4,44)}},[]),{tileM:p,merlonM:x,cannonM:u,lanternM:f}=w.useMemo(()=>{const g=new Ve,v=new Je,y=new j,l=new j,M=[],A=e==="low"?26:54;for(let E=0;E<A;E++){const k=E/(A-1)*2-1,P=k*(Et/2+40),C=st+20-Math.pow(Math.abs(k),1.9)*14+5,D=-Math.sign(k)*Math.pow(Math.abs(k),3)*.5;l.set(P,C,0),v.setFromEuler(new jt(0,0,D)),y.set(1,1,1),M.push(g.clone().compose(l,v,y))}const F=[];for(const E of[-1,1])for(let k=0;k<7;k++)l.set(E*(58+k*12),26,0),v.identity(),y.set(1,1,1),F.push(g.clone().compose(l,v,y));const S=[];for(const E of[-1,1])for(let k=0;k<2;k++)for(let P=0;P<4-k;P++)l.set(E*(64+P*13+k*6),32+k*10,8),v.setFromEuler(new jt(Math.PI/2-.16,0,0)),y.set(1,1,1),S.push(g.clone().compose(l,v,y));const R=[],I=e==="low"?10:22;for(let E=0;E<I;E++){const k=E/(I-1)*2-1,P=k*(Et/2-12),C=30*(1-k*k);l.set(P,st-34-C-7.5,0),v.identity(),y.set(1,1,1),R.push(g.clone().compose(l,v,y))}return{tileM:M,merlonM:F,cannonM:S,lanternM:R}},[e]);te(()=>{const g=b.t;r.current&&(r.current.material.emissiveIntensity=2.6+Math.sin(g*3.1)*.22+Math.sin(g*7.7)*.1+b.flash*1.4)});const a=Et/2,m=o;return t.jsxs("group",{position:[0,0,n],scale:s,children:[[-1,1].map(g=>t.jsxs("group",{position:[g*a,0,0],children:[t.jsxs("mesh",{position:[0,st/2-30,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[ro*.86,ro,st+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[ro*1.5,ro*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},g)),t.jsxs("mesh",{position:[0,st-26,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[Et+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:d.shimaki,castShadow:m,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:d.kasagi,castShadow:m,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:i,args:[null,null,p.length],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(qe,{matrices:p,target:i})]}),t.jsxs("mesh",{position:[0,st-6,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,st-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:d.rope,position:[0,st-34,2],castShadow:m,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(g=>{const v=30*(1-(g/(Et/2-6))**2);return t.jsx("group",{position:[g,st-34-v-4,2],children:[0,1,2].map(y=>t.jsxs("mesh",{position:[y%2?1.1:-1.1,-2.4-y*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:Re})]},y))},g)}),[-1,1].map(g=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[g*108,6,0],castShadow:m,receiveShadow:m,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[g*108,30,6],castShadow:m,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.88})]}),t.jsxs("mesh",{position:[g*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},g)),t.jsxs("instancedMesh",{ref:h,args:[null,null,x.length],castShadow:m,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(qe,{matrices:x,target:h})]}),t.jsxs("instancedMesh",{ref:c,args:[null,null,u.length],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(qe,{matrices:u,target:c})]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,f.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(qe,{matrices:f,target:r})]})]})}const fr=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,1)"),s.addColorStop(.12,"rgba(255,255,255,0.55)"),s.addColorStop(.4,"rgba(255,255,255,0.06)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let i=0;i<4;i++){const c=n.createLinearGradient(0,0,e/2,0);c.addColorStop(0,"rgba(255,255,255,0.95)"),c.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=c,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const r=new _t(o);return r.colorSpace=Bt,r})();function xr(e,o,n,s){const r=[];for(let i=0;i<=s;i++){const c=i/s,h=c*2-1;r.push(new j(e[0]+(o[0]-e[0])*c,e[1]+(o[1]-e[1])*c-n*(1-h*h),e[2]+(o[2]-e[2])*c))}return r}const gr=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function wr({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useRef(),i=w.useRef(),{lanternM:c,lampM:h,pilingM:d,katanaY:p,ground:x}=w.useMemo(()=>{const a=new Ve,m=new Je,g=new j(1,1,1),v=new j,y=[],l=e==="low"?.42:e==="mid"?.72:1;for(const[S,R,I]of gr){const E=Math.max(4,Math.round(I*l)),k=xr(S,R,14,E);for(let P=1;P<k.length-1;P++){const C=.78+P*37%11/22;v.copy(k[P]).add(new j(0,-4.2*C,0)),m.setFromEuler(new jt(0,P*1.7%Math.PI,(P%3-1)*.06)),y.push(a.clone().compose(v,m,g.clone().multiplyScalar(C)))}}const M=[],A=e==="low"?6:11;for(let S=0;S<A;S++){const R=S/(A-1);for(const I of[-1,1]){const E=z.lerp(Q.x+46,de.x-6,R)+I*(26-R*9),k=z.lerp(Q.z-26,de.z+32,R);v.set(E,ie(E,k)+5,k),m.identity(),M.push(a.clone().compose(v,m,g))}}const F=[];for(let S=0;S<16;S++){const R=S%2,I=Math.floor(S/2);v.set(Q.x+30+I*17,-2,Q.z+34+R*26),m.setFromEuler(new jt(0,0,(S%3-1)*.035)),F.push(a.clone().compose(v,m,g))}return{lanternM:y,lampM:M,pilingM:F,katanaY:ie(Q.x+118,Q.z-58),ground:Q.y}},[e]);te(()=>{const a=b.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(a*2.7)*.2+Math.sin(a*6.1+1.3)*.12+b.flash*1.6),i.current){const m=46*(1+Math.sin(a*1.3)*.13);i.current.scale.set(m,m,1),i.current.material.rotation=a*.07}});const u=o,f=(a,m)=>ie(Q.x+a,Q.z+m);return t.jsxs("group",{children:[t.jsxs("group",{position:[Q.x,0,Q.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(a=>t.jsxs("group",{position:[52+a*26,1.5,92+a%2*13],rotation:[0,.4+a*.3,0],children:[t.jsxs("mesh",{castShadow:u,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:Re})]})]},a))]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,d.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(qe,{matrices:d,target:r})]}),t.jsxs("group",{position:[Q.x+118,p,Q.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:u,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:i,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:fr,color:T.furnace,transparent:!0,opacity:.75,blending:it,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(a=>{const m=96+a*4,g=88*a;return t.jsxs("group",{position:[Q.x+m,f(m,g),Q.z+g],rotation:[0,-a*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:u,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:u,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(v=>t.jsxs("mesh",{position:[v*3,37,4],rotation:[0,0,v*.3],castShadow:u,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},v)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:u,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.9,side:Re})]})]},a)}),[-1,1].map(a=>{const m=40+a*34,g=-18+a*46;return t.jsxs("group",{position:[Q.x+m,f(m,g)+12,Q.z+g],rotation:[0,a*.8,0],children:[t.jsxs("mesh",{castShadow:u,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(v=>t.jsxs("mesh",{position:[v*5,7,-1],rotation:[0,0,v*-.5],castShadow:u,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},v)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:T.ember,emissive:T.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:Re})]})]},a)}),t.jsxs("group",{position:[Q.x-34,f(-34,30)+2,Q.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:u,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.88,side:Re,emissive:T.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(a,m)=>{const g=m/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(g)*26,55.5,Math.sin(g)*26],rotation:[0,-g,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},m)}),Array.from({length:10},(a,m)=>{const g=m/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(g)*32,44,Math.sin(g)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.5,toneMapped:!1})]},m)})]}),[0,1,2,3].map(a=>{const m=8+a*30,g=-70-a%2*14;return t.jsxs("group",{position:[Q.x+m,f(m,g),Q.z+g],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:a%2?"#e8dcc4":T.vermilion,roughness:.95,side:Re})]})]},a)}),[0,1,2].map(a=>{const m=.28+a*.24,g=z.lerp(Q.x+46,de.x,m),v=z.lerp(Q.z-26,de.z+26,m),y=ie(g,v),l=1-a*.1;return t.jsxs("group",{position:[g,y,v],scale:l,children:[[-1,1].map(M=>t.jsxs("mesh",{position:[M*15,17,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},M)),t.jsxs("mesh",{position:[0,36,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.75})]})]},a)}),t.jsx("group",{position:[Q.x,x,Q.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(qe,{matrices:c,target:n})]})}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:u,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:T.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(qe,{matrices:h,target:s})]})]})}const Un={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function yr(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function br({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useRef(),i=w.useRef(),{pineTrunkM:c,pineCanopyM:h,sakuraM:d,rockM:p}=w.useMemo(()=>{const u=Un[e]??Un.high,f=yr(20250801),a=new Ve,m=new Je,g=new j,v=new j,y=new j(0,1,0),l=new j,M=[],A=[],F=[],S=u.pine+u.sakura+u.rock;let R=0,I=0;for(;R<S&&I<S*60;){I++;const E=f()*Math.PI*2,k=mt*(.55+f()*.62),P=le.x+Math.sin(E)*k,C=le.z+Math.cos(E)*k,D=ie(P,C);if(D<5||D>300||Ga(P,C,6)>.72||Math.hypot(P-G.x,C-G.z)<G.r*1.35)continue;const Z=P>le.x+(f()-.5)*90,J=R;if(R++,v.set(P,D,C),J<u.rock){const L=bn(P,C,5);l.set(L[0],L[1],L[2]),m.setFromUnitVectors(y,l),m.multiply(new Je().setFromEuler(new jt(f()*.5,f()*6.28,f()*.5)));const X=2.5+f()*7;g.set(X*(.7+f()*.6),X*(.5+f()*.5),X*(.7+f()*.6)),v.y-=X*.25,F.push(a.clone().compose(v,m,g))}else if(Z){if(M.length>=u.pine)continue;m.setFromEuler(new jt(0,f()*6.28,(f()-.5)*.09));const L=.72+f()*.7;g.set(L,L*(.85+f()*.45),L),M.push(a.clone().compose(v,m,g))}else{if(A.length>=u.sakura)continue;m.setFromEuler(new jt(0,f()*6.28,(f()-.5)*.13));const L=.7+f()*.75;g.set(L,L*(.8+f()*.5),L),A.push(a.clone().compose(v,m,g))}}return{pineTrunkM:M.map(E=>E.clone().multiply(vr)).concat(A.map(E=>E.clone().multiply(Sr))),pineCanopyM:M.map(E=>E.clone().multiply(Mr)),sakuraM:A.map(E=>E.clone().multiply(jr)),rockM:F}},[e]),x=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],castShadow:x,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(qe,{matrices:c,target:n})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,h.length],castShadow:x,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:K.pine,roughness:.93,flatShading:!0}),t.jsx(qe,{matrices:h,target:s})]}),t.jsxs("instancedMesh",{ref:r,args:[null,null,d.length],castShadow:x,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:T.sakura,roughness:.95,flatShading:!0,emissive:T.sakura,emissiveIntensity:.1}),t.jsx(qe,{matrices:d,target:r})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,p.length],castShadow:x,receiveShadow:x,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:K.rock,roughness:.97,flatShading:!0}),t.jsx(qe,{matrices:p,target:i})]})]})}const vr=new Ve().makeTranslation(0,7,0),Mr=new Ve().makeTranslation(0,26,0),jr=new Ve().compose(new j(0,13,0),new Je,new j(1,.72,1)),Sr=new Ve().compose(new j(0,5,0),new Je,new j(.75,.62,.75));function zr({url:e,height:o,loa:n,slim:s=1,sink:r=0,rotation:i,tint:c,emissive:h,emissiveIntensity:d}){const{scene:p}=Es(e),x=w.useMemo(()=>p.clone(!0),[p]),u=w.useMemo(()=>{const f=new Rs().setFromObject(x),a=new j;f.getSize(a);const m=new j;if(f.getCenter(m),n){const v=a.x>=a.z,y=Math.max(v?a.x:a.z,1e-4),l=n/y,M=v?[l,l,l*s]:[l*s,l,l];return{scale:M,offset:[-m.x*M[0],-f.min.y*M[1]-n*r,-m.z*M[2]]}}const g=a.y>1e-4?o/a.y:1;return{scale:[g,g,g],offset:[-m.x*g,-f.min.y*g,-m.z*g]}},[x,o,n,s,r]);return w.useEffect(()=>{x.traverse(f=>{if(f.isMesh&&(f.castShadow=!0,f.receiveShadow=!0,c&&f.material)){const a=Array.isArray(f.material)?f.material:[f.material];for(const m of a)m.color?.multiply(new ge(c)),h&&m.emissive&&(m.emissive.set(h),m.emissiveIntensity=d??.2)}})},[x,c,h,d]),t.jsx("group",{rotation:[0,i,0],scale:u.scale,position:u.offset,children:t.jsx("primitive",{object:x})})}class kr extends w.Component{constructor(){super(...arguments);In(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function me({name:e,height:o,loa:n=null,slim:s=1,sink:r=0,rotation:i=0,position:c=[0,0,0],tint:h=null,emissive:d=null,emissiveIntensity:p=.2,fallback:x=null}){const u=eo(e);return Ye(e)?t.jsx("group",{position:c,children:t.jsx(kr,{url:u,fallback:x,children:t.jsx(w.Suspense,{fallback:x,children:t.jsx(zr,{url:u,height:o,loa:n,slim:s,sink:r,rotation:i,tint:h,emissive:d,emissiveIntensity:p})})})}):t.jsx("group",{position:c,children:x})}const dt=Math.PI,Wn={"ship-sunny.opt.glb":dt/2,"ship-tang.opt.glb":dt/2,"ship-punk.opt.glb":dt/2,"ship-lion.opt.glb":dt/2,"ship-bone.opt.glb":dt/2,"ship-junk.opt.glb":dt/2,"ship-warjunk.opt.glb":dt/2,"ship-sub.opt.glb":-dt/2},Ro=e=>e&&Wn[e]!==void 0?Wn[e]:dt/2,$n={"ship-sunny.opt.glb":34,"ship-lion.opt.glb":34,"ship-punk.opt.glb":46,"ship-tang.opt.glb":28,"ship-sub.opt.glb":28,"ship-bone.opt.glb":52,"ship-junk.opt.glb":40,"ship-warjunk.opt.glb":62},Yn={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},Ao=(e,o=34)=>e&&$n[e]!==void 0?$n[e]:o,Fo=e=>e&&Yn[e]!==void 0?Yn[e]:1,Jo=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),r=s.createImageData(e,o);for(let c=0;c<o;c++){const h=c/(o-1),d=Math.pow(1-h,1.7);for(let p=0;p<e;p++){const x=p/(e-1)*2-1,u=Math.max(0,1-Math.abs(x)/(.35+h*.65)),f=.45+.55*Math.pow(Math.abs(x)/(.35+h*.65),1.5),a=d*Math.pow(u,1.4)*f,m=(c*e+p)*4;r.data[m]=255,r.data[m+1]=255,r.data[m+2]=255,r.data[m+3]=Math.round(Math.min(1,a)*255)}}s.putImageData(r,0,0);const i=new _t(n);return i.colorSpace=Bt,i})(),Tr=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createImageData(e,e);for(let i=0;i<e;i++){const c=i/(e-1),h=Math.pow(1-c,1.5);for(let d=0;d<e;d++){const p=d/(e-1)*2-1,x=Math.max(0,1-Math.abs(p)),u=h*Math.pow(x,1.3),f=(i*e+d)*4;s.data[f]=255,s.data[f+1]=255,s.data[f+2]=255,s.data[f+3]=Math.round(Math.min(1,u)*255)}}n.putImageData(s,0,0);const r=new _t(o);return r.colorSpace=Bt,r})(),yo=160,It=112,qt="#e6dfcf",_s="#0c0a15",Lt=_s;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,s,r){const i=Math.min(r??0,Math.abs(n)/2,Math.abs(s)/2);return this.moveTo(e+i,o),this.arcTo(e+n,o,e+n,o+s,i),this.arcTo(e+n,o+s,e,o+s,i),this.arcTo(e,o+s,e,o,i),this.arcTo(e,o,e+n,o,i),this.closePath(),this});function Rt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=yo,o.height=It;const n=o.getContext("2d"),s=n.createLinearGradient(0,0,0,It);s.addColorStop(0,"#14101f"),s.addColorStop(.5,_s),s.addColorStop(1,"#08060f"),n.fillStyle=s,n.fillRect(0,0,yo,It),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,It),n.save(),n.translate(yo/2+4,It/2);try{e(n)}catch(i){console.warn("[onigashima] flag emblem skipped",i)}n.restore();const r=new _t(o);return r.colorSpace=Bt,r.anisotropy=4,r}function Lo(e,o,n=qt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Go(e,o,n=1){e.save(),e.fillStyle=Lt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Vn(e,o,n=4){e.save(),e.fillStyle=Lt;for(let s=1;s<n;s++){const r=-o*.5+s*o/n;e.fillRect(r-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function Xn(e,o,n=qt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const s of[1,-1]){e.save(),e.rotate(s*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const r of[-1,1])for(const i of[-.16,.16])e.beginPath(),e.arc(r*o*1.55,o*.55+i*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Er={straw:Rt(e=>{Xn(e,26),Lo(e,26),Go(e,26),Vn(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Rt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Lt;for(const s of[-1,1])e.beginPath(),e.arc(s*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Lt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Rt(e=>{Xn(e,26,"#d8cfc0"),e.fillStyle=qt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Lt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const s=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(s,26*.42),e.lineTo(s+26*.1,26*1.04),e.lineTo(s-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Rt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const s=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(s),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:Rt(e=>{e.fillStyle=qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();Lo(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Go(e,25,.85),e.save(),e.fillStyle=Lt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Rt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();Lo(e,26,"#cfd8e4"),Go(e,26),Vn(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Bs={value:0},Kn=new Map;function Rr(e){const o=Kn.get(e);if(o)return o;const n=Er[e],s=new ba({map:n,emissiveMap:n,emissive:new ge("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:Re,transparent:!1});return s.onBeforeCompile=r=>{r.uniforms.uTime=Bs,r.vertexShader=`uniform float uTime;
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
      `)},s.customProgramCacheKey=()=>"onigashima-flag",Kn.set(e,s),s}function Ar(){return te((e,o)=>{Bs.value+=Math.min(o,.05)}),null}const Fr=(()=>{const e=new fn(1,1,14,5);return e.translate(.5,0,0),e})();function no({crew:e="straw",width:o=16,position:n=[0,0,0],rotation:s=Math.PI/2,staff:r=!0}){const i=w.useMemo(()=>Rr(e)??null,[e]),c=o*(It/yo);return i?t.jsxs("group",{position:n,rotation:[0,s,0],children:[r&&t.jsxs("mesh",{position:[0,c*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,c*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:Fr,material:i,scale:[o,c,o]})]}):null}const Po=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:T.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:T.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6c684f"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#77694f"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#665945"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#666249"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#71634c"}];function Cr(e){const o=z.lerp(820*W,150*W,e);return[(Math.sin(e*2.4)*54-e*26)*W,o]}function Ir({spec:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=w.useRef();te(()=>{const a=n.current;if(!a)return;const m=z.clamp(b.progress*.82+.04,0,1),[g,v]=Cr(m),y=g+e.off*W*.94,l=v-e.lead*W*.98,M=oo(y,l),A=z.clamp(-ie(y,l)/46,0,1),F=z.lerp(1,.055,M)*z.smoothstep(A,0,.28),S=Qe(y,l,b.t,F),R=e.sub?z.smoothstep(b.progress,.42,.6):0;a.position.set(y,S.y-(e.sub?4.5:1.2)*e.scale-R*40,l);const I=e.sub?.35:1;a.rotation.x=z.clamp(S.dz*1.35*I,-.32,.32),a.rotation.z=z.clamp(-S.dx*1.15*I,-.28,.28),a.rotation.y=Math.PI+Math.sin(b.t*.31+e.lead)*.05,s.current&&(s.current.scale.z=1+Math.sin(b.t*1.6+e.off)*.09,s.current.rotation.y=Math.sin(b.t*.9+e.lead*.1)*.05),r.current&&(r.current.material.opacity=.36*(.25+(1-M)*.75)*(1-R))});const i=e.scale,c=o==="low"?6:10,h=Ye(e.model2??""),d=Ye(e.model??""),p=h?e.model2:d?e.model:null,x=p==="ship-junk.opt.glb",u=Ao(p,34)*(x?e.scale??1:1),f=Ye(e.crew??"");return p?t.jsxs("group",{ref:n,children:[t.jsx(me,{name:p,loa:u,slim:Fo(p),sink:.062,rotation:Ro(p),tint:h?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),f&&t.jsx(me,{name:e.crew,height:u*.085,rotation:0,position:[0,u*.085,u*.06]}),e.flag&&t.jsx(no,{crew:e.flag,width:u*(e.sub?.3:.22),position:[0,u*(e.sub?.42:.66),-u*.12],staff:!!e.sub}),t.jsxs("mesh",{position:[0,u*.3,-u*.2],children:[t.jsx("sphereGeometry",{args:[u*.03,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:r,position:[0,.6,-u*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[u*.55,u*2.3]}),t.jsx("meshBasicMaterial",{map:Jo,color:K.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:i*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,c]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:s,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:Re,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(a=>[0,1,2,3].map(m=>t.jsxs("mesh",{position:[a*5.6,3.4,-6+m*4],rotation:[0,0,a*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${a}-${m}`))),e.flag&&t.jsx(no,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:r,position:[0,.6,-34*i],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*i,74*i]}),t.jsx("meshBasicMaterial",{map:Jo,color:K.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Zn({x:e,z:o,yaw:n,name:s,loa:r,tint:i,sunk:c=.062,flag:h=null}){const d=Ao(s,r),p=w.useRef(),x=Ye(s);return te(()=>{const u=p.current;if(!u)return;const f=oo(e,o),a=z.clamp(-ie(e,o)/46,0,1),m=z.lerp(1,.055,f)*z.smoothstep(a,0,.28),g=Qe(e,o,b.t,m);u.position.set(e,g.y-1.5,o),u.rotation.set(z.clamp(g.dz*1.1,-.25,.25),n+Math.sin(b.t*.22+e)*.04,z.clamp(-g.dx,-.22,.22))}),t.jsxs("group",{ref:p,children:[t.jsx(me,{name:s,loa:d,slim:Fo(s),sink:c,rotation:Ro(s),tint:i,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&x&&t.jsx(no,{crew:h,width:d*.22,position:[0,d*.62,-d*.1]})]})}const Lr=[{x:-190*W,z:320*W,yaw:.35},{x:168*W,z:438*W,yaw:-.55},{x:-88*W,z:540*W,yaw:.12},{x:236*W,z:690*W,yaw:-.28},{x:-262*W,z:748*W,yaw:.48},{x:96*W,z:880*W,yaw:-.16}],Gr=[{x:Q.x+132*W*.72,z:Q.z+96*W*.72,yaw:2.3},{x:Q.x+168*W*.72,z:Q.z+40*W*.72,yaw:1.9},{x:Q.x+96*W*.72,z:Q.z+150*W*.72,yaw:2.7}];function Pr({quality:e="high"}){const o=w.useMemo(()=>e==="low"?Po.slice(0,5):e==="mid"?Po.slice(0,11):Po,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Ar,{}),o.map(n=>t.jsx(Ir,{spec:n,quality:e},n.id)),e!=="low"&&Lr.map((n,s)=>t.jsx(Zn,{...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts"},`picket-${s}`)),e!=="low"&&Gr.map((n,s)=>t.jsx(Zn,{...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki"},`moored-${s}`))]})}const Or="#2e2a33",en="#3a4152",tn=K.snow,So="#cfe0f4";function Qn({position:e}){return t.jsx("group",{position:e,children:t.jsx(me,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:en,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:en,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:So,emissive:So,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:tn,roughness:.9})]})]})})})}function Dr({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2(Y.dir[0],Y.dir[1]),[]);return t.jsxs("group",{position:[Y.gate.x,Y.benchY,Y.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:en,roughness:.92})]},n)),t.jsx(me,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:Or,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:tn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:tn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:Re})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:So,emissive:So,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Qn,{position:[-14,0,10]}),t.jsx(Qn,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const io=new ge,on={color:"#7fd8c8",intensity:9e3,distance:320},Oo={color:"#ffc48a",intensity:12e3,distance:300},Nr=new ge(on.color),Hr={low:1,mid:2,high:4},At=[{pos:[Q.x,40,Q.z],color:T.lantern,intensity:16e3,distance:460*W*.65},{pos:[0,78,St],color:T.lantern,intensity:15e3,distance:430},{pos:[de.x,de.y+6,de.z-30],color:T.emberDeep,intensity:3e4,distance:640},{pos:[Y.gate.x,30,Y.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function _r({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const s=w.useRef(),r=w.useRef(),i=w.useRef(),c=w.useRef(),h=w.useRef(),d=w.useRef(),p=ke(u=>u.camera),x=Hr[e]??5;return te(()=>{if(s.current){s.current.intensity=b.flash*9e3;const a=b.flashDir;s.current.position.set(a.x*700,260+a.y*500,le.z+a.z*700)}const u=b.t;r.current&&(r.current.intensity=62e3*(.86+.14*Math.sin(u*2.3)*Math.sin(u*.71))),i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(u*1.9+2.1)*Math.sin(u*.63)));const f=b.inside;if(h.current&&(h.current.intensity=.16+f*.3),d.current&&(d.current.intensity=.34+f*.26),c.current){const a=c.current,m=.06;let g=At[0],v=1/0;for(const y of At){const l=(p.position.x-y.pos[0])**2+(p.position.z-y.pos[2])**2;l<v&&(v=l,g=y)}if(b.subActive&&v>550*550){const y=b.subPos,l=Math.min(1,b.underwater/.35);a.position.x+=(y.x-a.position.x)*.3,a.position.y+=(y.y+14-a.position.y)*.3,a.position.z+=(y.z-a.position.z)*.3,io.set(Oo.color).lerp(Nr,l),a.color.lerp(io,m),a.intensity+=(z.lerp(Oo.intensity,on.intensity,l)-a.intensity)*m,a.distance=z.lerp(Oo.distance,on.distance,l)}else if(b.helmActive&&v>550*550){const y=b.helmPos;a.position.x+=(y.x-a.position.x)*.25,a.position.y+=(y.y+16-a.position.y)*.25,a.position.z+=(y.z-a.position.z)*.25,a.color.lerp(io.set(T.lantern),m),a.intensity+=(11e3-a.intensity)*m,a.distance=300}else a.position.x+=(g.pos[0]-a.position.x)*m,a.position.y+=(g.pos[1]-a.position.y)*m,a.position.z+=(g.pos[2]-a.position.z)*m,a.color.lerp(io.set(g.color),m),a.intensity+=(g.intensity-a.intensity)*m,a.distance=g.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:K.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[K.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(W/1.55),"shadow-camera-right":520*(W/1.55),"shadow-camera-top":520*(W/1.55),"shadow-camera-bottom":-520*(W/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:r,position:x>=2?[Me[0].x,Me[0].y,Me[0].z]:[(Me[0].x+Me[1].x)/2,Me[0].y,Me[0].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),x>=2&&t.jsx("pointLight",{ref:i,position:[Me[1].x,Me[1].y,Me[1].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:c,position:At[0].pos,color:At[0].color,intensity:At[0].intensity,distance:At[0].distance,decay:2}),x>=3&&t.jsx("pointLight",{position:[de.x,de.y+4,de.z-34],color:T.emberDeep,intensity:3e4,distance:640,decay:2}),x>=4&&t.jsx("pointLight",{position:[0,78,St],color:T.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:s,position:[0,700,-700],color:K.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function Do(e,o){let n=e>>>0;const s=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),r=[],i=o==="low"?3:5,c=(m,g,v,y,l)=>{const M=[m.clone()],A=m.clone();for(let S=0;S<y;S++)A.add(new j((s()-.5)*v*.55,-v/y,(s()-.5)*v*.42)).add(g.clone().multiplyScalar(v/y*.3)),M.push(A.clone());const F=new Ht(new Nt(M),y*2,l,i,!1);return r.push(F),M},h=c(new j(0,620,0),new j(0,0,0),620,9,3.4),d=o==="low"?1:3;for(let m=0;m<d;m++){const g=h[2+Math.floor(s()*(h.length-3))];c(g.clone(),new j(s()-.5,0,s()-.5).multiplyScalar(2),190+s()*130,4,1.5)}let p=0;for(const m of r)p+=m.attributes.position.count;const x=new Float32Array(p*3),u=new Float32Array(p*3);let f=0;for(const m of r)x.set(m.attributes.position.array,f*3),u.set(m.attributes.normal.array,f*3),f+=m.attributes.position.count,m.dispose();const a=new bt;return a.setAttribute("position",new ee(x,3)),a.setAttribute("normal",new ee(u,3)),a}function Br({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),s=w.useRef({i:0,t:-1,dur:0,flicker:0}),r=w.useMemo(()=>[Do(40503,e),Do(20973,e),Do(10196,e)],[e]);return te((i,c)=>{const h=Math.min(c,.05),d=s.current;if(n.current-=h,n.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const p=o[d.i].current;if(p){const x=(Math.random()-.5)*2.4-Math.PI*.5,u=620+Math.random()*760;p.position.set(le.x+Math.cos(x)*u,40+Math.random()*120,le.z+Math.sin(x)*u*.7-240),p.rotation.y=Math.random()*Math.PI*2;const f=.7+Math.random()*.8;p.scale.set(f,f,f),b.flashDir.set(p.position.x,p.position.y+400,p.position.z).normalize()}n.current=z.lerp(6.5,2.2,b.progress)*(.45+Math.random())}if(d.t>=0){d.t+=h;const p=d.t/d.dur,x=Math.abs(Math.sin(p*Math.PI*d.flicker)),u=Math.max(0,1-p);b.flash=u*u*x;const f=o[d.i].current;f&&(f.material.opacity=Math.min(1,b.flash*2.2)),p>=1&&(d.t=-1,b.flash=0,f&&(f.material.opacity=0))}else b.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:r.map((i,c)=>t.jsx("mesh",{ref:o[c],geometry:i,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:K.bolt,transparent:!0,opacity:0,blending:it,depthWrite:!1,toneMapped:!1})},c))})}const Ur=`
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
`,Wr=`
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
`,qn={low:1600,mid:3800,high:7e3},lo=460;function $r({quality:e}){const o=w.useRef(),n=ke(i=>i.camera),s=w.useMemo(()=>{const i=qn[e]??qn.high,c=new Float32Array(i*3),h=new Float32Array(i),d=new Float32Array(i);for(let x=0;x<i;x++)c[x*3]=Math.random()*lo,c[x*3+1]=Math.random()*lo,c[x*3+2]=Math.random()*lo,h[x]=.7+Math.random()*.6,d[x]=.55+Math.random()*.85;const p=new bt;return p.setAttribute("position",new ee(c,3)),p.setAttribute("aSpeed",new ee(h,1)),p.setAttribute("aLen",new ee(d,1)),p.boundingSphere=new Ut(new j,1e6),p},[e]),r=w.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:lo},uFall:{value:118},uSize:{value:2.4},uColor:{value:new j(...se("#b9c8e4"))},uOpacity:{value:.5}}),[]);return te((i,c)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=c,h.uCam.value.copy(n.position),h.uOpacity.value=.5*b.rain*b.rain+b.flash*.3)}),t.jsx("points",{geometry:s,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Ur,fragmentShader:Wr,uniforms:r,transparent:!0,depthWrite:!1,fog:!1})})}const Yr=`
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
`,Vr=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Jn={low:120,mid:340,high:700};function Xr({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const r=Jn[e]??Jn.high,i=[Me[0],Me[1],de,de],c=new Float32Array(r*3),h=new Float32Array(r),d=new Float32Array(r),p=new Float32Array(r);for(let u=0;u<r;u++){const f=i[u%i.length];c[u*3]=f.x+(Math.random()-.5)*74,c[u*3+1]=f.y+(Math.random()-.5)*30,c[u*3+2]=f.z+(Math.random()-.5)*26,h[u]=Math.random(),d[u]=.045+Math.random()*.055,p[u]=2+Math.random()*4}const x=new bt;return x.setAttribute("position",new ee(c,3)),x.setAttribute("aPhase",new ee(h,1)),x.setAttribute("aRise",new ee(d,1)),x.setAttribute("aSize",new ee(p,1)),x.boundingSphere=new Ut(new j(0,300,-260),700),x},[e]),s=w.useMemo(()=>({uTime:{value:0},uColor:{value:new j(...se(T.ember))}}),[]);return te((r,i)=>{o.current&&(o.current.uniforms.uTime.value+=i)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Yr,fragmentShader:Vr,uniforms:s,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function Kr({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Br,{quality:e}),t.jsx($r,{quality:e}),t.jsx(Xr,{quality:e})]})}const Zr=`
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
`,Qr=`
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
`,es={low:150,mid:380,high:620};function qr({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=w.useMemo(()=>{const c=es[o]??es.high,h=new Float32Array(c*3),d=new Float32Array(c),p=new Float32Array(c),x=new Float32Array(c),u=new Float32Array(c),f=new Float32Array(c);for(let m=0;m<c;m++)d[m]=Math.random()*Math.PI*2,p[m]=Math.random(),x[m]=.05+Math.random()*.05,u[m]=3+Math.random()*6,f[m]=Math.random();const a=new bt;return a.setAttribute("position",new ee(h,3)),a.setAttribute("aAngle",new ee(d,1)),a.setAttribute("aPhase",new ee(p,1)),a.setAttribute("aRate",new ee(x,1)),a.setAttribute("aSize",new ee(u,1)),a.setAttribute("aJitter",new ee(f,1)),a.boundingSphere=new Ut(new j(e.x,0,e.z),e.r*1.6+40),a},[o,e]),i=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new xn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new j(...se(K.foam))},uGain:{value:1}}),[e]);return te((c,h)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=h;const p=Math.hypot(c.camera.position.x-e.x,c.camera.position.z-e.z);d.uGain.value=1-z.smoothstep(p,1600,2400),s.current&&(s.current.visible=d.uGain.value>.02)}),t.jsx("points",{ref:s,geometry:r,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Zr,fragmentShader:Qr,uniforms:i,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function Jr({quality:e="high"}){const o=ke(n=>n.camera);return te(()=>{let n=0;for(const s of Fe){const r=Math.hypot(o.position.x-s.x,o.position.z-s.z);n=Math.max(n,1-z.smoothstep(r,s.r*.3,s.r*2.2))}b.whirlNear+=(n-b.whirlNear)*.05}),t.jsx(t.Fragment,{children:Fe.map((n,s)=>t.jsx(qr,{whirl:n,quality:e},s))})}const U={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},Dt={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<to-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*W},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<St-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*W},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=Aa("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<Y.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},ei=e=>Dt[e]?Dt[e].length:0,ti=()=>U.chain&&Dt[U.chain]?Dt[U.chain][U.step]??null:null;function nn(e){U.chain=Dt[e]?e:null,U.step=0,U.hull=1,U.grip=0,U.clock=0,U.done=!1,U.banner=null,U.rev++}function zo(e,o,n=3.4){U.banner={text:e,sub:o,until:U.clock+n},U.rev++}function Gt(e,o){U.hull<=0||(U.hull=Math.max(0,U.hull-e),U.hits++,U.hull<=0?zo("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&zo(o,null,2.2),U.rev++)}function Us(e,o){if(U.clock+=e,U.banner&&U.clock>U.banner.until&&(U.banner=null,U.rev++),!U.chain||U.done||!o)return;const n=Dt[U.chain],s=n[U.step];if(!s)return;let r=!1;try{r=!!s.test(o)}catch{r=!1}r&&(U.step++,U.step>=n.length?(U.done=!0,zo("OBJECTIVE COMPLETE",oi[U.chain]??"",6)):zo(n[U.step].text,n[U.step].hint,3.6),U.rev++)}const oi={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Ws(e,{danger:o,headingX:n,headingZ:s,toCentreX:r,toCentreZ:i,speed:c,throttle:h}){if(o<=.001)return U.grip=Math.max(0,U.grip-e*.5),U.grip;const d=Math.hypot(r,i)||1,p=-r/d,x=-i/d,u=n*p+s*x,f=Math.min(1,Math.abs(c)/22),a=o*.42,m=Math.max(0,u)*f*(.35+.45*Math.min(1,Math.abs(h)));return U.grip=Math.max(0,Math.min(1,U.grip+(a-m)*e)),U.grip}const ts=24,No=vo.safe,os=vo.range,Yt=2.1,ni=1.5,ns=22,si=[St,to],ai=new Ve,Ho=new j,ss=new Je,_o=new j;function ri({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:ts},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),s=w.useRef(0),r=w.useMemo(()=>{const i=new As(.55,1,1,e==="low"?6:10,1,!0);return i.translate(0,.5,0),i},[e]);return te((i,c)=>{const h=o.current;if(!h)return;const d=Math.min(c,.05),p=b.helm;if(b.helmActive&&p&&!p.onFoot&&!p.sub&&!p.moored){let f=null,a=1/0;for(const m of si){const g=Math.hypot(p.x,p.z-m);g<No||g>os||g<a&&(a=g,f=m)}if(f!==null&&(s.current-=d,s.current<=0)){const m=1-z.clamp((a-No)/(os-No),0,1);s.current=z.lerp(4.5,1.9,m);const g=n.find(v=>!v.live);if(g){const v=Yt*.55,y=z.lerp(230,105,m);g.x=p.x+Math.sin(p.heading)*p.speed*v+(Math.random()-.5)*y,g.z=p.z+Math.cos(p.heading)*p.speed*v+(Math.random()-.5)*y,g.y0=210+Math.random()*60,g.t=0,g.live=!0}}}let u=0;for(const f of n){if(!f.live)continue;const a=f.t;if(f.t+=d,f.t<Yt){const m=f.t/Yt;Ho.set(f.x,f.y0*(1-m*m),f.z),_o.set(2.2,9,2.2)}else{if(a<Yt){const v=Math.hypot(f.x-p.x,f.z-p.z);v<ns&&Gt(.03*(1-v/ns)+.008,"HIT — SHOT THROUGH THE RIGGING"),b.splash+=1}const m=(f.t-Yt)/ni;if(m>=1){f.live=!1;continue}const g=Math.min(1,m*4);Ho.set(f.x,Qe(f.x,f.z,b.t,1).y-4,f.z),_o.set(11+m*9,78*g*(1-m*m*.75),11+m*9)}ss.identity(),h.setMatrixAt(u,ai.compose(Ho,ss,_o)),u++}h.count=u,h.instanceMatrix.needsUpdate=!0,h.visible=u>0}),t.jsx("instancedMesh",{ref:o,args:[r,void 0,ts],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:K.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:it,side:Re})})}const ii=`
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
`,li=`
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
`,as={low:700,mid:1800,high:3200},co=260;function ci({quality:e}){const o=w.useRef(),n=w.useRef(),s=ke(c=>c.camera),r=w.useMemo(()=>{const c=as[e]??as.high,h=new Float32Array(c*3),d=new Float32Array(c),p=new Float32Array(c),x=new Float32Array(c);for(let f=0;f<c;f++)h[f*3]=Math.random()*co,h[f*3+1]=Math.random()*co,h[f*3+2]=Math.random()*co,d[f]=.5+Math.random()*1.4,p[f]=1.2+Math.random()*3.2,x[f]=Math.random();const u=new bt;return u.setAttribute("position",new ee(h,3)),u.setAttribute("aSpeed",new ee(d,1)),u.setAttribute("aSize",new ee(p,1)),u.setAttribute("aPhase",new ee(x,1)),u.boundingSphere=new Ut(new j,1e6),u},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:co},uColor:{value:new j(...se("#cfeee6"))},uGain:{value:0}}),[]);return te((c,h)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=h,d.uCam.value.copy(s.position),d.uGain.value=b.underwater,n.current&&(n.current.visible=b.underwater>.02))}),t.jsx("points",{ref:n,geometry:r,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:ii,fragmentShader:li,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const hi=`
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
`,di=`
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
`,rs={low:260,mid:700,high:1300},ui=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,pi=`
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
`,is=1100;function mi({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=ke(h=>h.camera),i=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,d=new As(e.r*1.02,e.r*.07,is,h,6,!0);return d.translate(e.x,-is/2-3,e.z),d},[e,o]),c=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new j(...se(K.foam))},uDeep:{value:new j(...se(K.underGlow))},uCameraPos:{value:new j},uFogDensity:{value:.0062},uFogColor:{value:new j(...se(K.underHaze))}}),[e]);return te((h,d)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=d,p.uCameraPos.value.copy(h.camera.position),p.uFogDensity.value=h.scene.fog?.density??.0062;const x=h.scene.fog?.color;x&&p.uFogColor.value.set(x.r,x.g,x.b);const u=Math.hypot(r.position.x-e.x,r.position.z-e.z),f=1-z.smoothstep(u,e.r*8,e.r*24);p.uGain.value+=(b.underwater*f-p.uGain.value)*Math.min(1,d*4),s.current&&(s.current.visible=p.uGain.value>.012)}),t.jsx("mesh",{ref:s,geometry:i,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:ui,fragmentShader:pi,uniforms:c,transparent:!0,depthWrite:!1,side:Re,blending:it,fog:!1})})}function fi({whirl:e,quality:o}){const n=w.useRef(),s=w.useRef(),r=ke(h=>h.camera),i=w.useMemo(()=>{const h=rs[o]??rs.high,d=new Float32Array(h*3),p=new Float32Array(h),x=new Float32Array(h),u=new Float32Array(h),f=new Float32Array(h),a=new Float32Array(h);for(let g=0;g<h;g++)p[g]=Math.random()*Math.PI*2,x[g]=Math.random(),u[g]=.07+Math.random()*.1,f[g]=.12+Math.pow(Math.random(),1.8)*.5,a[g]=2+Math.random()*5;const m=new bt;return m.setAttribute("position",new ee(d,3)),m.setAttribute("aAngle",new ee(p,1)),m.setAttribute("aPhase",new ee(x,1)),m.setAttribute("aRate",new ee(u,1)),m.setAttribute("aRadius",new ee(f,1)),m.setAttribute("aSize",new ee(a,1)),m.boundingSphere=new Ut(new j(e.x,-60,e.z),e.r+140),m},[o,e]),c=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new xn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new j(...se(K.underGlow))},uGain:{value:0}}),[e]);return te((h,d)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=d;const x=Math.hypot(r.position.x-e.x,r.position.z-e.z),u=1-z.smoothstep(x,e.r*1.2,e.r*4);p.uGain.value=b.underwater*u,s.current&&(s.current.visible=p.uGain.value>.015)}),t.jsx("points",{ref:s,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:hi,fragmentShader:di,uniforms:c,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function xi({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ci,{quality:e}),Fe.map((o,n)=>t.jsx(fi,{whirl:o,quality:e},n)),Fe.map((o,n)=>t.jsx(mi,{whirl:o,quality:e},`w${n}`))]})}const ko=16/9,$s=96,Ys=78;function sn(e,o,n=$s){if(!o||o>=ko)return e;const s=z.degToRad(e)/2,r=2*Math.atan(Math.tan(s)*ko/o);return Math.min(n,z.radToDeg(r))}function Vs(e){return!e||e>=ko?1:z.clamp(.72+.28*(e/ko),.86,1)}function an(e,o,n,s=.06,r=$s){const i=sn(o,e.aspect,r);Math.abs(e.fov-i)<=.05||(e.fov+=(i-e.fov)*(1-Math.pow(s,n)),e.updateProjectionMatrix())}function rn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*z.clamp(1280/o,.55,2.2)}const Xs="oni.settings.v1";function gi(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const be={comfort:0,lookSens:1,invertY:!1,freeCam:!1},ln=new Set;function Ks(){for(const e of ln)e(be)}function Zs(e){return ln.add(e),()=>ln.delete(e)}function jn(e,o){e in be&&(be[e]=o,bi(),Ks())}function To(e){jn(e,!be[e])}function wi(){jn("comfort",be.comfort<.01?.55:be.comfort<.9?1:0)}function yi(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=be.lookSens-1e-6);jn("lookSens",e[(o+1)%e.length])}function bi(){try{localStorage.setItem(Xs,JSON.stringify(be))}catch{}}function vi(){let e=null;try{e=JSON.parse(localStorage.getItem(Xs)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(be))typeof e[o]==typeof be[o]&&(be[o]=e[o]);else be.comfort=gi()?1:0;return Ks(),be}const Ee=(e,o)=>e+(o-e)*be.comfort,Vt=e=>e<-1?-1:e>1?1:e,H={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,zoom:0},ft={level:0},cn=new Set;function Mi(e){return cn.add(e),()=>cn.delete(e)}function Sn(e){if(ft.level===e)return e;ft.level=e;for(const o of cn)o(e);return e}function Qs(){return Sn((ft.level+1)%3)}const ne={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0}},Jt=new Set,ct=(...e)=>e.some(o=>Jt.has(o));function qs(){H.throttle=0,H.rudder=0,H.planes=0,H.boost=!1,H.walk.x=0,H.walk.z=0,H.surfaceQueued=!1,H.periscopeQueued=!1,H.burstQueued=!1,H.recentreQueued=!1,H.zoom=0,Sn(0),ne.throttle=0,ne.rudder=0,ne.planes=0,ne.boost=!1,ne.walk.x=0,ne.walk.z=0,Jt.clear()}function ji(){const e=r=>!!r&&(r.isContentEditable||/^(input|textarea|select)$/i.test(r.tagName??"")),o=r=>{if(r.metaKey||r.ctrlKey||r.altKey||e(r.target))return;const i=r.key.toLowerCase();Jt.add(i),i==="f"&&(H.surfaceQueued=!0),i==="p"&&(H.periscopeQueued=!0),i==="b"&&!r.repeat&&(H.burstQueued=!0),i==="r"&&!r.repeat&&(H.recentreQueued=!0),i==="v"&&!r.repeat&&To("freeCam"),i==="x"&&!r.repeat&&Qs(),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(i)&&r.preventDefault()},n=r=>Jt.delete(r.key.toLowerCase()),s=()=>qs();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",s),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",s),Jt.clear()}}function Si(){const e=ct("w","arrowup")?1:0,o=ct("s","arrowdown")?1:0,n=ct("a","arrowleft")?1:0,s=ct("d","arrowright")?1:0,r=ct("q"," ")?1:0,i=ct("e","c")?1:0,c=Vt(e-o+ne.throttle);c<-.05&&ft.level&&Sn(0),H.throttle=ft.level>0?Math.max(c,1):c,H.rudder=Vt(n-s+ne.rudder),H.planes=Vt(r-i+ne.planes),H.boost=ct("shift")||ne.boost||ft.level===2,H.zoom=(ct("]","=","+")?1:0)-(ct("[","-","_")?1:0),H.walk.x=Vt(s-n+ne.walk.x),H.walk.z=Vt(e-o+ne.walk.z)}const hn=[0,(Me[0].y+Me[1].y)/2,Me[0].z],Js=[de.x,de.y,de.z],Eo=Y.dir,ea=[Y.x+Eo[0]*300,-36,Y.z+Eo[1]*300],ta=[Y.x+Eo[0]*46,34,Y.z+Eo[1]*46],oa=[Y.gate.x,4,Y.gate.z],na=[Y.gate.x,22,Y.gate.z],zi=1.55,dn=W/zi,ki=1+(dn-1)*.35,at=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:hn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:ea,to:ta,lookFrom:oa,lookTo:na,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Js,lookTo:hn,swell:0}],Ti=new Set([hn,Js,ea,ta,oa,na]),ho=e=>Ti.has(e)?e:[e[0]*dn,e[1]*ki,e[2]*dn];for(const e of at)e.from=ho(e.from),e.to=ho(e.to),e.lookFrom=ho(e.lookFrom),e.lookTo=ho(e.lookTo);const un=at.reduce((e,o)=>e+o.dur,0),ls=at,Ei=e=>e*e*(3-2*e),Ri=e=>1-Math.pow(1-e,2.2),uo=e=>new j(e[0],e[1],e[2]),wt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function Ai(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,s=new Map;let r=0,i=null;const c=(u,f)=>{const a=b.orbit,m=a.dist*.0016,g=Math.cos(a.yaw),v=-Math.sin(a.yaw);a.target.x-=g*u*m,a.target.z-=v*u*m;const y=Math.cos(a.pitch),l=Math.sin(a.pitch);a.target.y+=f*m*y,a.target.x+=Math.sin(a.yaw)*f*m*l,a.target.z+=Math.cos(a.yaw)*f*m*l,sa()},h=u=>{s.set(u.pointerId,{x:u.clientX,y:u.clientY});try{n.setPointerCapture?.(u.pointerId)}catch{}if(s.size===2){const[f,a]=[...s.values()];r=Math.hypot(f.x-a.x,f.y-a.y),i={x:(f.x+a.x)/2,y:(f.y+a.y)/2}}},d=u=>{const f=s.get(u.pointerId);if(!f)return;const a=u.clientX-f.x,m=u.clientY-f.y;if(f.x=u.clientX,f.y=u.clientY,s.size>=2){const[g,v]=[...s.values()],y=Math.hypot(g.x-v.x,g.y-v.y),l={x:(g.x+v.x)/2,y:(g.y+v.y)/2};if(r>8&&y>8){const M=b.orbit;M.dist=z.clamp(M.dist*(r/y),...wt.dist)}i&&c(l.x-i.x,l.y-i.y),r=y,i=l,u.cancelable&&u.preventDefault();return}if(u.shiftKey||u.buttons===4)c(a,m);else{const g=b.orbit;g.yaw-=a*.005*rn(),g.pitch=z.clamp(g.pitch+m*.004*rn(),...wt.pitch)}u.cancelable&&u.preventDefault()},p=u=>{s.delete(u.pointerId)&&s.size<2&&(r=0,i=null)},x=u=>{u.preventDefault();const f=b.orbit;f.dist=z.clamp(f.dist*(1+Math.sign(u.deltaY)*.11),...wt.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",d,{passive:!1}),n.addEventListener("pointerup",p),n.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),n.addEventListener("wheel",x,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",d),n.removeEventListener("pointerup",p),n.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),n.removeEventListener("wheel",x),s.clear()}},[e,o])}function sa(){const e=b.orbit;e.target.x=z.clamp(e.target.x,-4200,wt.xz),e.target.z=z.clamp(e.target.z,-4200,wt.xz),e.target.y=z.clamp(e.target.y,...wt.y)}function Fi({onRails:e,playing:o,speed:n=1,onShot:s,idle:r=!1}){const i=ke(x=>x.camera),c=ke(x=>x.gl),h=w.useRef(0),d=w.useRef(-1),p=w.useRef(new j(0,150,-260));return Ai(!e&&!r,c),w.useEffect(()=>{if(e)return;const x=b.orbit,u=i.position.clone().sub(x.target);x.dist=z.clamp(u.length(),...wt.dist),x.yaw=Math.atan2(u.x,u.z),x.pitch=Math.asin(z.clamp(u.y/(u.length()||1),-1,1))},[e,i]),te((x,u)=>{if(r)return;const f=Math.min(u,.05);if(b.t+=f,e){if(b.jumpTo!=null){let E=0;for(let k=0;k<b.jumpTo&&k<at.length;k++)E+=at[k].dur;h.current=E,b.jumpTo=null}o&&(h.current=(h.current+f*n)%un);let y=0,l=0;for(;l<at.length&&!(h.current<y+at[l].dur);l++)y+=at[l].dur;const M=at[Math.min(l,at.length-1)],A=z.clamp((h.current-y)/M.dur,0,1);d.current!==l&&(d.current=l,b.shot=l,s?.(l,M));const F=uo(M.from).lerp(uo(M.to),Ri(A)),S=uo(M.lookFrom).lerp(uo(M.lookTo),Ei(A)),R=M.swell??0;if(R>0){const E=b.t;F.y+=Math.sin(E*.62)*3.1*R+Math.sin(E*1.31+1.2)*1.2*R,F.x+=Math.sin(E*.44+.6)*2.2*R}F.x+=Math.sin(b.t*.83)*.35,F.y+=Math.sin(b.t*1.17+2)*.28,i.position.copy(F),p.current.lerp(S,1-Math.pow(1e-4,f)),i.lookAt(p.current),R>0&&i.rotateZ(Math.sin(b.t*.51)*.024*R);const I=sn(M.fov,i.aspect);Math.abs(i.fov-I)>.01&&(i.fov+=(I-i.fov)*(1-Math.pow(.02,f)),i.updateProjectionMatrix()),b.progress=h.current/un}else{const y=b.orbit;H.recentreQueued&&(H.recentreQueued=!1,y.target.set(G.x,G.baseY*.55,G.z),y.dist=z.clamp(y.dist,260,1400));const l=H.walk.x,M=H.walk.z;if(l||M||H.planes||H.zoom){const S=y.dist*(H.boost?1.9:.7)*f,R=-Math.sin(y.yaw),I=-Math.cos(y.yaw);y.target.x+=(R*M-I*l)*S,y.target.z+=(I*M+R*l)*S,y.target.y+=H.planes*S,y.dist=z.clamp(y.dist*(1-H.zoom*.9*f),...wt.dist),sa()}const A=Math.cos(y.pitch);i.position.set(y.target.x+Math.sin(y.yaw)*A*y.dist,y.target.y+Math.sin(y.pitch)*y.dist,y.target.z+Math.cos(y.yaw)*A*y.dist),i.lookAt(y.target);const F=sn(55,i.aspect);Math.abs(i.fov-F)>.01&&(i.fov+=(F-i.fov)*(1-Math.pow(.02,f)),i.updateProjectionMatrix()),b.t+=0}const a=oo(i.position.x,i.position.z);b.shelter+=(a-b.shelter)*(1-Math.pow(.06,f)),b.fog=z.lerp(yt.sea,yt.bay,b.shelter),b.rain=1-b.shelter*.92;const m=Qe(i.position.x,i.position.z,b.t,1),g=z.clamp((m.y-i.position.y-1)/3,0,1);b.underwater+=(g-b.underwater)*(1-Math.pow(.002,f)),b.depthBelow=Math.max(0,m.y-i.position.y);const v=z.lerp(8200,1700,b.underwater);Math.abs(i.far-v)>20&&(i.far=v,i.updateProjectionMatrix()),x.camera.updateMatrixWorld()}),null}const cs={low:[24,16],mid:[40,26],high:[56,36]};function Ci({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=w.useMemo(()=>{const[f,a]=cs[e]??cs.high,m=new va(1,f,a),g=m.attributes.position,v=new Float32Array(g.count*3),[y,l,M]=Ae.centre,[A,F,S]=Ae.radii,R=new ge("#241c22"),I=new ge(T.rockWarm),E=new ge;for(let k=0;k<g.count;k++){const P=g.getX(k),C=g.getY(k),D=g.getZ(k),Z=1+(Ot(P*2.4+5,D*2.4-9,3)-.5)*.14;g.setXYZ(k,y+P*A*Z,l+C*F*Z,M+D*S*Z);const J=z.clamp((C+.2)/1.2,0,1);E.copy(R).lerp(I,(1-J)*.55),v[k*3]=E.r,v[k*3+1]=E.g,v[k*3+2]=E.b}return m.setAttribute("color",new ee(v,3)),m.computeVertexNormals(),m},[e]),{stairM:i,brazierM:c,bayM:h,tableM:d,jarM:p,westStairM:x}=w.useMemo(()=>{const f=new Ve,a=new Je,m=new j(1,1,1),g=new j,v=[];for(let L=0;L<Ze.steps;L++){const X=L/(Ze.steps-1);g.set(0,z.lerp(ze.y,ae.y+2,X),z.lerp(Ze.zTop,Ze.zBottom,X)),a.identity(),v.push(f.clone().compose(g,a,m))}const y=[],l=e==="low"?5:9;for(const L of[-1,1])for(let X=0;X<l;X++){const oe=X/(l-1);g.set(L*176,ae.y+9,z.lerp(ae.zFront-40,ae.zBack+40,oe)),a.identity(),y.push(f.clone().compose(g,a,m))}for(let L=0;L<6;L++)g.set(-110+L*44,ae.y+9,_.z+_.halfZ+54),a.identity(),y.push(f.clone().compose(g,a,m));const M=[],A=e==="low"?5:9;for(const L of[-1,1])for(let X=0;X<pe.tiers;X++)for(let oe=0;oe<A;oe++){const V=oe/(A-1);g.set(L*(pe.x-X*26),pe.y+X*pe.tierRise,z.lerp(-205,pe.halfZ,V)),a.identity(),M.push(f.clone().compose(g,a,m))}const F=[],S=[],R=new Je,I=new j(0,1,0);let E=24301;const k=()=>(E=Math.imul(E,1664525)+1013904223>>>0,E/4294967296),P=e==="low"?1:2,C=e==="low"?5:8;for(const L of[-1,1])for(let X=0;X<P;X++)for(let oe=0;oe<C;oe++){const V=L*(96+X*52+(k()-.5)*14),re=z.lerp(ae.zBack+120,ae.zFront-60,oe/(C-1))+(k()-.5)*16;if(!(Math.abs(V)<we.halfX+24&&Math.abs(re-we.z)<we.halfZ+20)&&!(Math.abs(Math.abs(V)-ue.x)<26&&re<ue.zFoot+16&&re>ue.zTop-8)){g.set(V,ae.y+2.4,re),R.setFromAxisAngle(I,(k()-.5)*.5),F.push(f.clone().compose(g,R,m));for(let je=0;je<2;je++)g.set(V+(k()-.5)*30,ae.y+3.5,re+(k()>.5?8:-8)+(k()-.5)*6),R.setFromAxisAngle(I,k()*Math.PI),S.push(f.clone().compose(g,R,m))}}const D=[],Z=16,J=L=>L*L*(3-2*L);for(let L=0;L<=Z;L++){const X=L/Z;g.set(-252,J(X)*(pe.y-.5)-1.3,z.lerp(45,-45,X)),a.identity(),D.push(f.clone().compose(g,a,m))}return{stairM:v,brazierM:y,bayM:M,tableM:F,jarM:S,westStairM:D}},[e]);te(()=>{const f=b.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(f*4.1)*.3+Math.sin(f*9.3)*.15),s.current&&(s.current.material.emissiveIntensity=.85+Math.sin(f*.9)*.12)});const u=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:r,side:Ko,receiveShadow:u,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Ko,roughness:.97,metalness:.02})}),[[0,(ae.zFront+we.z+we.halfZ)/2,ae.halfX*2,ae.zFront-we.z-we.halfZ],[0,(ae.zBack+we.z-we.halfZ)/2,ae.halfX*2,we.z-we.halfZ-ae.zBack],[-342/2-20,we.z,ae.halfX*2-we.halfX*2,we.halfZ*2],[(we.halfX+ae.halfX)/2+20,we.z,ae.halfX*2-we.halfX*2,we.halfZ*2]].map(([f,a,m,g],v)=>t.jsxs("mesh",{position:[f,ae.y-3,a],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Math.abs(m),6,Math.abs(g)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},v)),t.jsxs("mesh",{ref:s,position:[we.x,Pe.ceiling+2,we.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[we.halfX*2,we.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:Re})]}),t.jsxs("mesh",{position:[0,ze.y-4,ze.z],receiveShadow:u,castShadow:u,children:[t.jsx("boxGeometry",{args:[ze.halfX*2.6,8,ze.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,i.length],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Ze.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Ii,{matrices:i})]}),[-1,1].map(f=>Array.from({length:pe.tiers},(a,m)=>t.jsxs("mesh",{position:[f*(pe.x-m*26),pe.y+m*pe.tierRise-4,0],receiveShadow:u,castShadow:u,children:[t.jsx("boxGeometry",{args:[76-m*6,7,pe.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]},`${f}-${m}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:T.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Oi,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(Li,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,p.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Gi,{matrices:p})]}),t.jsxs("instancedMesh",{args:[null,null,x.length],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Pi,{matrices:x})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Di,{matrices:c})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:T.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Ni,{matrices:c})]}),t.jsxs("mesh",{position:[0,Pe.y-4,0],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Pe.halfX*2,8,Pe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(f=>[-1,0,1].map(a=>t.jsxs("mesh",{position:[f*120,(Pe.y+ae.y)/2,a*96],castShadow:u,children:[t.jsx("boxGeometry",{args:[26,Math.abs(ae.y-Pe.y),26]}),t.jsx("meshStandardMaterial",{color:K.rock,roughness:.95})]},`${f}-${a}`)))]})}function Ii({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Li({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Gi({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Pi({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Oi({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Di({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o})}function Ni({matrices:e}){const o=w.useRef();return t.jsx(zt,{matrices:e,selfRef:o,offsetY:9})}function zt({matrices:e,offsetY:o=0}){const n=w.useRef(),s=w.useRef(!1);return te(()=>{if(s.current)return;const r=n.current?.parent;if(!r?.isInstancedMesh)return;const i=new Ve,c=new Ve().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,r.count);h++)i.copy(e[h]).multiply(c),r.setMatrixAt(h,i);r.instanceMatrix.needsUpdate=!0,r.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:n})}const hs=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const s=n.getContext("2d"),r=s.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);r.addColorStop(0,"#fff3c4"),r.addColorStop(.32,"#ffc95e"),r.addColorStop(.66,"#e06120"),r.addColorStop(1,"#7e1c14"),s.fillStyle=r,s.fillRect(0,0,e,o),s.globalAlpha=.14,s.fillStyle="#fff3c4";for(let c=0;c<12;c++){const h=c/12*Math.PI*2;s.save(),s.translate(e/2,o*.62),s.rotate(h),s.fillRect(-3,0,6,e),s.restore()}s.globalAlpha=.22,s.fillStyle="#5e1610";for(let c=8;c<e;c+=22)s.fillRect(c,0,3,o);s.globalAlpha=1;const i=new _t(n);return i.colorSpace=Bt,i})();function Hi(e,o,n,s){const r=e+s,i=o+s,c=new Float32Array([-r,0,i,r,0,i,e*.18,n,o*.18,-r,0,i,e*.18,n,o*.18,-e*.18,n,o*.18,r,0,i,r,0,-i,e*.18,n,-o*.18,r,0,i,e*.18,n,-o*.18,e*.18,n,o*.18,r,0,-i,-r,0,-i,-e*.18,n,-o*.18,r,0,-i,-e*.18,n,-o*.18,e*.18,n,-o*.18,-r,0,-i,-r,0,i,-e*.18,n,o*.18,-r,0,-i,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new bt;return h.setAttribute("position",new ee(c,3)),h.computeVertexNormals(),h}function _i({quality:e="high",shadows:o=!0}){const n=w.useRef(),s=w.useRef(),r=Ye("keep-hf.opt.glb"),i=w.useMemo(()=>{const h=[];for(let d=0;d<_.storeys;d++){const p=1-(d+1)*_.taper,x=_.plinth+d*_.storey;h.push({i:d,y:x,halfX:_.halfX*p,halfZ:_.halfZ*p,roof:Hi(_.halfX*p,_.halfZ*p,d===_.storeys-1?30:16,11)})}return h},[]);te(()=>{const h=b.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),s.current&&(s.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const c=o;return t.jsxs("group",{position:[0,_.baseY,_.z],children:[t.jsxs("mesh",{position:[0,_.plinth/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[_.halfX*2.2,_.plinth,_.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),r&&t.jsx(me,{name:"keep-hf.opt.glb",height:_.plinth+_.storeys*_.storey+26,position:[0,_.plinth*.5,0],tint:"#9a8468",emissive:T.emberDeep,emissiveIntensity:.14}),!r&&i.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,_.storey/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2,_.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,_.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,_.storey*.38]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,_.storey*.02,h.halfZ+8],castShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,_.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,_.storey,0],castShadow:c,receiveShadow:c,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,_.plinth+_.storeys*_.storey+30,0],rotation:[0,0,h*.4],castShadow:c,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,ye.y,ye.z-_.z],children:[t.jsxs("mesh",{castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[ye.halfX*2,7,ye.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[ye.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:"#ffffff",emissiveMap:hs,map:hs,emissiveIntensity:2.2,toneMapped:!1,side:Re})]}),t.jsx(me,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:c,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:c,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(me,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:T.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*ye.halfX*.9,28,ye.depth/2-4],castShadow:c,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[ye.halfX*2.3,5,ye.depth+22]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(me,{name:"oni-daiko.opt.glb",height:26,position:[h*(ye.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:c,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Bi,{})]})]})}function Bi(){const e=w.useRef(),o=w.useRef(!1);return te(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const s=new Ve,r=new j,i=new Je,c=new j(1,1,1);for(let h=0;h<n.count;h++){const d=h/(n.count-1)*2-1;r.set(d*(_.halfX+26),ye.y+74-(1-d*d)*20,_.halfZ+22),n.setMatrixAt(h,s.compose(r,i,c))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Ui({shadows:e=!0}){const{slabs:o,flights:n,tower:s}=Ps,r=w.useMemo(()=>{const i=[],c=h=>h*h*(3-2*h);for(const h of n)for(let p=0;p<=9;p++){const x=p/9;i.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*c(x)-1.2,z.lerp(h.z0,h.z1,x)])}return i},[n]);return t.jsxs("group",{children:[[s.x[0]+1,s.x[1]-1].map(i=>[s.z[0]+1,s.z[1]-1].map(c=>t.jsxs("mesh",{position:[i,128,c],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${i}${c}`))),t.jsxs("instancedMesh",{args:[null,null,r.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Wi,{points:r})]}),o.map(([i,c,h,d,p],x)=>t.jsxs("mesh",{position:[i,c-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(p)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},x)),o.map(([i,c,h,d,p],x)=>t.jsxs("mesh",{position:[i,c+5,h+Math.abs(p)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})]},`r${x}`))]})}function Wi({points:e}){const o=w.useRef(),n=w.useRef(!1);return te(()=>{if(n.current)return;const s=o.current?.parent;if(!s?.isInstancedMesh)return;const r=new Ve,i=new Je,c=new j(1,1,1),h=new j;for(let d=0;d<Math.min(e.length,s.count);d++)h.set(e[d][0],e[d][1],e[d][2]),s.setMatrixAt(d,r.compose(h,i,c));s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function $i({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],r=i=>i*i*(3-2*i);for(const i of[-1,1])for(let c=0;c<=20;c++){const h=c/20;n.push({x:i*ue.x,y:r(h)*gt,z:z.lerp(ue.zFoot,ue.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,s)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[ue.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.75})]},s)),[-1,1].map(n=>{const s=i=>i*i*(3-2*i),r=i=>{const c=[];for(let h=0;h<=16;h++){const d=h/16;c.push(new j(n*ue.x+i,s(d)*gt+7,z.lerp(ue.zFoot,ue.zTop,d)))}return new Ht(new Nt(c),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:r(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:r(ue.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})})]},n)})]})}function Yi({shadows:e=!0}){const o=w.useMemo(()=>so.map(([,,n,s])=>{const r=[];for(let i=0;i<=12;i++){const c=i/12*2-1;r.push(new j(c*n*.5,s*(1-c*c),0))}return new Ht(new Nt(r),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[so.map(([n,s],r)=>t.jsxs("group",{position:[0,n,s],children:[t.jsx("mesh",{geometry:o[r],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.74})}),[-7,7].map(i=>t.jsx("mesh",{geometry:o[r],position:[0,7,i],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})},i))]},r)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,so[0][0]-12,so[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,ae.y,0]})]})}function aa(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Vi({quality:e,shadows:o}){const n=w.useMemo(()=>{const r=aa(712273),i=[],c=e==="low"?14:e==="mid"?26:40;let h=0;for(;i.length<c&&h<c*40;){h++;const d=(r()*2-1)*(ae.halfX-30),p=z.lerp(ae.zBack+40,ae.zFront-30,r());Math.abs(d)<62&&p>_.z+120||Math.abs(d)<70&&Math.abs(p-84)<58||Math.abs(Math.abs(d)-ue.x)<24&&p<ue.zFoot+18&&p>ue.zTop-10||i.push({x:d,z:p,kind:i.length%4,rot:r()*Math.PI*2,k:.82+r()*.5})}return i},[e]),s=o;return t.jsx(t.Fragment,{children:n.map((r,i)=>{const c=[r.x,ae.y,r.z];return r.kind===0?t.jsx(me,{name:"sake-tower.opt.glb",height:22*r.k,position:c,rotation:r.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:c,children:[0,1,2].map(h=>t.jsxs("mesh",{position:[0,4+h*7,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[6-h,6-h,7,10]}),t.jsx("meshStandardMaterial",{color:h%2?"#c9a86a":"#8e6a3c",roughness:.92})]},h))})},i):r.kind===1?t.jsx(me,{name:"oni-guardian.opt.glb",height:30*r.k,position:c,rotation:r.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*4,28,0],rotation:[0,0,h*.5],castShadow:s,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},h))]})},i):r.kind===2?t.jsx(me,{name:"wisteria-trellis.opt.glb",height:34*r.k,position:c,rotation:r.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(h=>t.jsxs("mesh",{position:[h,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},h))]})},i):t.jsxs("group",{position:c,rotation:[0,r.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:i%2?T.vermilion:"#e8dcc4",roughness:.95,side:Re,emissive:i%2?T.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},i)})})}function Xi({shadows:e}){const o=w.useMemo(()=>{const n=aa(10560325),s=[];for(let r=0;r<14;r++)s.push({x:(n()*2-1)*(Pe.halfX-40),z:(n()*2-1)*(Pe.halfZ-40),rot:n()*Math.PI*2,keg:r%2===0});return s},[]);return t.jsx(t.Fragment,{children:o.map((n,s)=>n.keg?t.jsx(me,{name:"powder-keg.opt.glb",height:13,position:[n.x,Pe.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Pe.y+6,n.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},s):t.jsx(me,{name:"war-cannon.opt.glb",height:12,position:[n.x,Pe.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Pe.y+5,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},s))})}function Ki(){const e=ke(o=>o.camera);return te((o,n)=>{const s=Math.min(n,.05),r=(e.position.x-fe.x-Ae.centre[0])/Ae.radii[0],i=(e.position.y-fe.y-Ae.centre[1])/Ae.radii[1],c=(e.position.z-fe.z-Ae.centre[2])/Ae.radii[2],h=Math.sqrt(r*r+i*i+c*c),d=z.clamp(1-(h-1)/.5,0,1);b.inside+=(d-b.inside)*(1-Math.pow(.02,s))}),null}function Zi({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[fe.x,fe.y,fe.z],children:[t.jsx(Ki,{}),t.jsx(Ci,{quality:e,shadows:o}),t.jsx(_i,{quality:e,shadows:o}),t.jsx(Yi,{shadows:o}),t.jsx($i,{shadows:o}),t.jsx(Ui,{shadows:o}),t.jsx(Vi,{quality:e,shadows:o}),t.jsx(Xi,{shadows:o}),[-1,1].map(n=>t.jsx(me,{name:"banquet-table.opt.glb",height:9,position:[n*92,ae.y,_.z+210],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}`)),t.jsx(me,{name:"treasure-kura.opt.glb",height:64,position:[pe.x-74,ae.y,_.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[pe.x-74,ae.y,_.z+96],rotation:[0,-.7,0],children:[[-1,1].map(n=>[-1,1].map(s=>t.jsxs("mesh",{position:[n*12,5,s*9],castShadow:o,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${n}${s}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([n,s,r],i)=>t.jsx(me,{name:"bomb-sphere.opt.glb",height:22,position:[n,Pe.y,s],rotation:r,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Pe.y+10,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${i}`)),[-1,1].map(n=>t.jsx(me,{name:"keep-tier.opt.glb",height:96,position:[n*(pe.x-40),pe.y+pe.tiers*pe.tierRise-6,_.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(me,{name:"arch-bridge.opt.glb",height:26,position:[n*74,ae.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(me,{name:"oni-guardian.opt.glb",height:54,position:[n*(ze.halfX+26),ze.y,ze.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(ze.halfX+26),ze.y,ze.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,ye.y+30,ye.z-_.z+_.z+40],color:T.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,pe.y+120,60],color:T.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Pe.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,ze.y+46,ze.z-40],color:T.lantern,intensity:26e3,distance:620,decay:2})]})}const Qi=Math.PI/2-.14,ds=1.5;function ra({enabled:e,dom:o,zoomMin:n=.34,zoomMax:s=2.6,zoom0:r=1,pitch0:i=.16,pitchMin:c=-.62,pitchMax:h=Qi}){const d=w.useRef({yaw:0,pitch:i,zoom:r,smYaw:0,smPitch:i,smZoom:r,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:c,pitchMax:h,zoomMin:n,zoomMax:s,pitch0:i}).current;return w.useEffect(()=>{if(!e||!o)return;const p=o,x=new Map;let u=0,f=0,a=null;const m=()=>x.size,g=M=>{x.set(M.pointerId,{x:M.clientX,y:M.clientY});try{p.setPointerCapture?.(M.pointerId)}catch{}if(m()===1)d.dragging=!0,a={x:M.clientX,y:M.clientY,t:M.timeStamp};else if(m()===2){d.dragging=!1;const[A,F]=[...x.values()];u=Math.hypot(A.x-F.x,A.y-F.y),a=null}},v=M=>{const A=x.get(M.pointerId);if(!A)return;const F=M.clientX-A.x,S=M.clientY-A.y;if(A.x=M.clientX,A.y=M.clientY,m()>=2){const[I,E]=[...x.values()],k=Math.hypot(I.x-E.x,I.y-E.y);u>8&&k>8&&(d.zoom=z.clamp(d.zoom*(u/k),d.zoomMin,d.zoomMax),d.since=0),u=k;return}if(!d.dragging)return;a&&Math.hypot(M.clientX-a.x,M.clientY-a.y)>14&&(a=null);const R=rn()*be.lookSens;d.yaw-=F*.005*R,d.pitch=z.clamp(d.pitch+S*.004*R*(be.invertY?-1:1),d.pitchMin,d.pitchMax),d.since=0,M.cancelable&&M.preventDefault()},y=M=>{x.has(M.pointerId)&&(x.delete(M.pointerId),m()<2&&(u=0),m()===0&&(d.dragging=!1,a&&M.timeStamp-a.t<260&&(M.timeStamp-f<340?(d.recentre=!0,f=0):f=M.timeStamp),a=null))},l=M=>{M.preventDefault(),d.zoom=z.clamp(d.zoom*(1+Math.sign(M.deltaY)*.1),d.zoomMin,d.zoomMax),d.since=0};return p.addEventListener("pointerdown",g),p.addEventListener("pointermove",v,{passive:!1}),p.addEventListener("pointerup",y),p.addEventListener("pointercancel",y),window.addEventListener("pointerup",y),p.addEventListener("wheel",l,{passive:!1}),()=>{p.removeEventListener("pointerdown",g),p.removeEventListener("pointermove",v),p.removeEventListener("pointerup",y),p.removeEventListener("pointercancel",y),window.removeEventListener("pointerup",y),p.removeEventListener("wheel",l),x.clear(),d.dragging=!1}},[e,o,d]),d}function pn(e,o,n=0){if(e.since+=o,H.zoom&&(e.zoom=z.clamp(e.zoom*(1-H.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,H.recentreQueued&&(H.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=ds+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!be.freeCam&&!e.noRecentre&&!e.dragging&&e.since>ds){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(Ee(.22,.48),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const s=e.dragging?6e-4:Ee(.002,.02),r=1-Math.pow(s,o);let i=e.yaw-e.smYaw;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;e.smYaw+=i*r,e.smPitch+=(e.pitch-e.smPitch)*r,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const us=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeUrl:eo("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeUrl:eo("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],qi=e=>us.find(o=>o.id===e)??us[0],Bo=64,Ji=19,ps=16,el=.92,ms=.52,tl=.3,ol=.04,nl=.0016,sl=.055,al=1.9,rl=16,il=62,ll=9,fs={x:-.45,z:-2.4},xs=.075,Uo=new j,gs=new j;function Ft(e,o){return z.clamp(-ie(e,o)/26,0,1)}const po={x:60*W,z:1050*W},cl=7,ws=15,ht=1.85;function hl({mode:e,onMode:o,crew:n="luffy"}){const s=ke(A=>A.camera),r=ke(A=>A.gl),i=w.useRef(),c=w.useRef(),h=w.useRef({speed:0,grounded:!0,maxSpeed:15}),d=qi(n),p=w.useRef(),x=w.useRef(),u=w.useRef(),f=Ye("ship-sunny.opt.glb"),a=Ye("ship-lion.opt.glb"),m=f||a,g=f?"ship-sunny.opt.glb":a?"ship-lion.opt.glb":null,v=g?Ao(g,34):30,y=Ye("crew-straw.opt.glb"),l=w.useRef({x:po.x,z:po.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,stride:0,area:"hall",boarded:!1}).current,M=ra({enabled:e==="helm"||e==="foot",dom:r.domElement,zoomMin:.34,zoomMax:3.4,pitch0:.16,pitchMin:-.62,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return l.x=po.x,l.z=po.z,l.heading=Math.PI,l.speed=0,l.vx=0,l.vz=0,l.throttle=0,l.flank=0,l.deckY=0,M.yaw=0,M.smYaw=0,M.pitch=.16,M.smPitch=.16,M.pitch0=.16,M.zoom=1,M.smZoom=1,M.noRecentre=!1,M.pitchMin=-.62,M.pitchMax=1.44,l.swallowed=0,l.burst=1,l.burstFx=0,l.slam=0,l.drift=0,l.trim=0,l.bowY=Qe(l.x,l.z,b.t,1).y,b.helm=null,nn("helm"),()=>{b.helmActive=!1}},[e,l,M]),w.useEffect(()=>{if(e!=="foot")return;l.fvx=0,l.fvz=0,U.chain!=="foot"&&nn("foot");const A=(S,R)=>{M.yaw=S,M.smYaw=S,M.pitch=R,M.smPitch=R,M.pitch0=0,M.noRecentre=!0,M.pitchMin=-1.28,M.pitchMax=1.28},F=b.footSpawn;if(b.footSpawn="hall",F==="port"){l.area="island",l.fx=Q.x+40*W,l.fz=Q.z+40*W,l.fy=ie(l.fx,l.fz)+ht,l.fyaw=Math.atan2(de.x-l.fx,de.z-l.fz),A(l.fyaw+Math.PI,-.06);return}if(F==="rear"){l.area="island",l.fx=Y.gate.x+Y.dir[0]*26,l.fz=Y.gate.z+Y.dir[1]*26,l.fy=ie(l.fx,l.fz)+ht,l.fyaw=Math.atan2(-Y.dir[0],-Y.dir[1]),A(l.fyaw+Math.PI,.02);return}l.area="hall",l.fx=fe.x,l.fy=fe.y+ze.y,l.fz=fe.z+Ze.zTop,l.fyaw=Math.PI,l.fpitch=-.05,A(0,.05)},[e,l,M]),te((A,F)=>{if(e!=="helm"&&e!=="foot")return;const S=Math.min(F,.05);if(b.t+=S,e==="helm"){const R=l.heading;l.throttle+=(H.throttle-l.throttle)*(1-Math.pow(.02,S)),l.rudder+=(H.rudder-l.rudder)*(1-Math.pow(.005,S)),l.flank+=((H.boost?1:0)-l.flank)*(1-Math.pow(ol,S));const I=Bo*(1+tl*l.flank),E=Math.sin(l.heading),k=Math.cos(l.heading),P=Math.cos(l.heading),C=-Math.sin(l.heading);let D=l.vx*E+l.vz*k,Z=l.vx*P+l.vz*C;const J=1-b.shelter,L=l.throttle>=0?l.throttle*I:l.throttle*Ji;D+=z.clamp(L-D,-ps*2.5,ps)*S,l.burst=Math.min(1,l.burst+S/ll),H.burstQueued&&(H.burstQueued=!1,l.burst>=.999&&(l.burst=0,l.burstFx=1,D+=il,b.splash+=1)),l.burstFx*=Math.pow(.2,S);const X=Qe(l.x,l.z,b.t,1);D-=(X.dx*E+X.dz*k)*rl*J*S,D-=D*Math.abs(D)*nl*S,Z-=(Z*Math.abs(Z)*sl+Z*al)*S;const oe=z.clamp(Math.abs(D)/16,0,1);D*=Math.pow(1-.11*Math.abs(l.rudder)*oe,S),l.vx=E*D+P*Z,l.vz=k*D+C*Z,l.speed=D,l.drift+=(z.clamp(Math.abs(Z)/11,0,1)-l.drift)*(1-Math.pow(.1,S)),l.heading+=l.rudder*el*oe*Math.sign(D||1)*S;const V=l.x+l.vx*S,re=l.z+l.vz*S,je=v*ms,et=V+E*je,Be=re+k*je;if(Ft(et,Be)>.06)l.x=V,l.z=re,l.aground+=(0-l.aground)*(1-Math.pow(.05,S));else{l.aground+=(1-l.aground)*(1-Math.pow(.02,S)),Gt(Math.abs(l.speed)*.0012*S*60,"AGROUND — SHE IS TAKING WATER");const Te=Math.pow(.06,S);l.speed*=Te,l.vx*=Te,l.vz*=Te;const nt=6,An=Ft(l.x+nt,l.z)-Ft(l.x-nt,l.z),Fn=Ft(l.x,l.z+nt)-Ft(l.x,l.z-nt),Cn=Math.hypot(An,Fn)||1;l.x+=An/Cn*26*S,l.z+=Fn/Cn*26*S}const Se=Cs(l.x,l.z,0);l.x+=Se.vx*S,l.z+=Se.vz*S,l.x+=fs.x*J*S,l.z+=fs.z*J*S;const lt=X.dx*P+X.dz*C;l.heading+=z.clamp(lt*.4,-xs,xs)*J*S;let B=Fe[0],ve=1/0;for(const Te of Fe){const nt=(l.x-Te.x)**2+(l.z-Te.z)**2;nt<ve&&(ve=nt,B=Te)}if(Ws(S,{danger:Se.danger,headingX:Math.sin(l.heading),headingZ:Math.cos(l.heading),toCentreX:B.x-l.x,toCentreZ:B.z-l.z,speed:l.speed,throttle:l.throttle})>=1||Se.danger>.94){const Te=B;l.x=Te.x+(Te.x>0?Te.r*1.85:-Te.r*1.85),l.z=Te.z+Te.r*1.5,l.speed=0,l.vx=0,l.vz=0,l.throttle=0,l.heading=Math.PI,l.swallowed+=1,l.aground=1,U.grip=0,Gt(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),b.splash+=1}const Oe=oo(l.x,l.z),ce=z.lerp(1,.055,Oe)*z.smoothstep(Ft(l.x,l.z),0,.3),he=Qe(l.x,l.z,b.t,ce);b.helmActive=!0,b.helmPos.set(l.x,he.y+v*.35,l.z),b.helmSpeed=z.clamp(Math.abs(l.speed)/Bo,0,1);const O=Se.vx*Math.cos(l.heading)-Se.vz*Math.sin(l.heading),q=z.clamp(Math.abs(l.speed)/Bo,0,1),Ie=z.clamp(l.rudder*oe*q*.4+O*.016,-.5,.5);l.heel+=(Ie-Z*.012-l.heel)*(1-Math.pow(.15,S));const Ce=v*ms,De=Qe(l.x+E*Ce,l.z+k*Ce,b.t,ce).y,Ne=z.clamp((l.bowY-De)/Math.max(S,.001),0,60);l.bowY=De;const Ue=z.clamp((Ne-10)/24,0,1)*q*J;if(l.slam=Math.max(l.slam*Math.pow(.05,S),Ue),Ue>.25){const Te=Math.pow(1-.3*Ue,S);l.vx*=Te,l.vz*=Te}const We=q*.1*Math.sign(l.speed>=0?1:-1)+l.slam*.14+l.burstFx*.16;l.trim+=(We-l.trim)*(1-Math.pow(.1,S));const vt=z.clamp(q*J*1.15+l.aground*.5+Se.danger*.8+l.slam*1.3+l.burstFx,0,1);l.spray+=(vt-l.spray)*(1-Math.pow(.08,S));const kt=i.current;kt&&(kt.position.set(l.x,he.y,l.z),kt.rotation.set(z.clamp(he.dz*1.2,-.3,.3)-l.trim,l.heading,z.clamp(-he.dx,-.26,.26)+l.heel)),p.current&&(p.current.scale.z=1+Math.sin(b.t*1.6)*.08+l.burstFx*.4,p.current.scale.x=1+J*.06+l.burstFx*.12),x.current&&(x.current.material.opacity=l.spray*.42,x.current.scale.setScalar(.7+l.spray*.55)),u.current&&(u.current.material.opacity=z.clamp(.34*q+l.burstFx*.3,0,.62)*(.28+J*.72),u.current.scale.set(1+q*.75+l.drift*.6,1,1+q*.5)),pn(M,S,l.heading-R);const He=l.heading+Math.PI+M.smYaw,Xe=Math.cos(M.smPitch),Le=Math.max(v*3,76)*M.smZoom*(1+q*Ee(.26,.1)+l.burstFx*Ee(.34,.12))*Vs(s.aspect);l.deckY+=(he.y-l.deckY)*(1-Math.pow(Ee(2e-4,.05),S));const Wt=z.lerp(he.y,l.deckY,be.comfort),xt=Uo.set(l.x+Math.sin(He)*Xe*Le,Wt+v*.5+Math.sin(M.smPitch)*Le,l.z+Math.cos(He)*Xe*Le),ca=Qe(xt.x,xt.z,b.t,ce);xt.y=Math.max(xt.y,ca.y+6),s.position.lerp(xt,1-Math.pow(Ee(6e-4,.02),S));const ha=Math.max(0,Math.cos(M.smYaw)),Tn=q*Ee(66,34)*ha;s.lookAt(gs.set(l.x+(E+P*z.clamp(Z/40,-.4,.4))*Tn,Wt+12-l.trim*26*q*Ee(1,.35),l.z+(k+C*z.clamp(Z/40,-.4,.4))*Tn));const En=Ee(1,0);En>.001&&s.rotateZ((Math.sin(b.t*2.3)*.012*q+l.heel*.3+l.aground*Math.sin(b.t*21)*.02+l.slam*Math.sin(b.t*34)*.03+Se.danger*Math.sin(b.t*2.7)*.03)*En),an(s,60+q*Ee(7,2)+l.burstFx*Ee(10,3),S,.06,Ys);const Rn=Math.hypot(l.x-(Q.x+60*W),l.z-(Q.z+60*W));Rn<90*W&&Math.abs(l.speed)<24&&(b.footSpawn="port",o?.("foot")),b.helm={speed:l.speed,heading:l.heading,throttle:l.throttle,aground:l.aground,x:l.x,z:l.z,toGate:Math.min(Math.hypot(l.x,l.z-St),Math.hypot(l.x,l.z-to)),underFire:[St,to].some(Te=>{const nt=Math.hypot(l.x,l.z-Te);return nt>vo.safe&&nt<vo.range}),moored:Rn<180*W,maelstrom:Se.danger,swallowed:l.swallowed,burst:l.burst,drift:l.drift,maxSpeed:I,cruise:ft.level,flank:l.flank,freeCam:be.freeCam},Us(S,b.helm),b.shelter+=(Oe-b.shelter)*(1-Math.pow(.06,S)),b.underwater+=(0-b.underwater)*(1-Math.pow(.02,S))}else{pn(M,S,0);const R=H.boost?ws:cl;l.fpitch+=(-M.smPitch-l.fpitch)*(1-Math.pow(1e-4,S));const I=H.walk.x,E=H.walk.z,k=Math.hypot(I,E),P=k>1?k:1,C=-Math.sin(M.smYaw),D=-Math.cos(M.smYaw),Z=-D,J=C,L=(C*(E/P)+Z*(I/P))*R,X=(D*(E/P)+J*(I/P))*R,oe=1-Math.pow(k>.02?2e-5:4e-7,S);l.fvx+=(L-l.fvx)*oe,l.fvz+=(X-l.fvz)*oe;const V=l.fvx*S,re=l.fvz*S;if(l.area==="island"){const Oe=l.fx+V,ce=l.fz+re,he=ie(l.fx,l.fz),O=ie(Oe,ce),q=Math.hypot(V,re)||1e-6,Ie=(O-he)/q;(O<=.3||Ie>=1.2&&O>=he)&&(l.fvx=0,l.fvz=0),O>.3&&(Ie<1.2||O<he)&&(l.fx=Oe,l.fz=ce);const Ce=ie(l.fx,l.fz);l.fy+=(Ce+ht-l.fy)*(1-Math.pow(.002,S));const De=Math.hypot(l.fx-de.x,l.fz-de.z),Ne=Math.hypot(l.fx-Y.gate.x,l.fz-Y.gate.z);De<80?(l.area="hall",l.fx=fe.x,l.fz=fe.z+Ze.zTop,l.fy=fe.y+ze.y+ht,l.fyaw=Math.PI,M.yaw=M.smYaw=0,M.pitch=M.smPitch=.05):Ne<40&&(l.area="hall",l.fx=fe.x+60,l.fz=fe.z+_.z+150,l.fy=fe.y+ht,l.fyaw=0,M.yaw=M.smYaw=Math.PI,M.pitch=M.smPitch=.04),b.helm={onFoot:!0,area:"island",x:l.fx,z:l.fz,fy:l.fy-fe.y,toMouth:De,toRear:Ne,nearPort:Math.hypot(l.fx-Q.x,l.fz-Q.z)<Q.r*1.4};const Ue=oo(l.fx,l.fz);b.shelter+=(Ue-b.shelter)*(1-Math.pow(.06,S))}else{l.fx+=V,l.fz+=re;const Oe=l.fx-fe.x,ce=l.fz-fe.z;let he=ce>ze.z-70?ze.y:ce>Ze.zBottom?z.lerp(0,ze.y,(ce-Ze.zBottom)/(Ze.zTop-Ze.zBottom)):0;he=Math.max(he,or(Oe,ce)),l.fy+=(fe.y+he+ht-l.fy)*(1-Math.pow(.005,S)),ce>ze.z+34&&(l.area="island",l.fx=de.x,l.fz=de.z+130,l.fy=ie(l.fx,l.fz)+ht,l.fyaw=0,M.yaw=M.smYaw=Math.PI,M.pitch=M.smPitch=-.04),b.helm={onFoot:!0,area:"hall",x:l.fx,z:l.fz,lz:ce,fy:l.fy-fe.y},b.shelter+=(1-b.shelter)*(1-Math.pow(.06,S))}const je=Math.hypot(l.fvx,l.fvz);l.stride+=je*S;const et=d.height??1.74;if(je>.4){let ce=Math.atan2(l.fvx,l.fvz)-l.fyaw;for(;ce>Math.PI;)ce-=Math.PI*2;for(;ce<-Math.PI;)ce+=Math.PI*2;l.fyaw+=ce*(1-Math.pow(4e-4,S))}l.fpitch+=(-M.smPitch-l.fpitch)*(1-Math.pow(1e-4,S)),l.pace=je,h.current.speed=je,h.current.maxSpeed=ws,h.current.grounded=!0;const Be=et*4.2*M.smZoom,tt=Math.cos(M.smPitch),Se=l.fy+Math.sin(l.stride*1.6)*.05*Ee(1,.3),lt=l.fx+Math.sin(M.smYaw)*tt*Be,B=l.fz+Math.cos(M.smYaw)*tt*Be;let ve=Se+et*.55+Math.sin(M.smPitch)*Be;const ot=l.area==="island"?ie(lt,B):l.fy-ht;ve=Math.max(ve,ot+et*.6),Uo.set(lt,ve,B),s.position.lerp(Uo,1-Math.pow(Ee(9e-4,.02),S)),s.lookAt(gs.set(l.fx,Se+et*.15,l.fz)),an(s,72,S,.02),c.current&&(c.current.position.set(l.fx,l.fy-ht,l.fz),c.current.rotation.y=l.fyaw),b.underwater+=(0-b.underwater)*(1-Math.pow(.02,S))}b.fog=z.lerp(yt.sea,yt.bay,b.shelter),b.rain=1-b.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:c,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(ja,{character:d,motion:h})}),t.jsxs("group",{ref:i,position:[0,-4e3,0],visible:e==="helm",children:[m&&t.jsx(me,{name:g,loa:v,slim:Fo(g),sink:.062,rotation:Ro(g),tint:f?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),m&&y&&t.jsx(me,{name:"crew-straw.opt.glb",height:v*.09,rotation:0,position:[0,v*.1,v*.12]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!m,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!m,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!m,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!m,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!m,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!m,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:p,position:[0,17.5,1.5],visible:!m,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:Re,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!m,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(A=>t.jsxs("mesh",{position:[A*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:3.4,toneMapped:!1})]},A)),t.jsx(no,{crew:"straw",width:m?v*.24:14,position:[0,m?v*.78:26,-v*.06]}),t.jsxs("mesh",{ref:u,position:[0,.6,-v*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[v*.6,v*2.2]}),t.jsx("meshBasicMaterial",{map:Jo,color:K.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:x,position:[0,v*.12,v*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[v*.85,v*.6]}),t.jsx("meshBasicMaterial",{map:Tr,color:K.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:it})]})]})]})}const ys=76,dl=24,bs=26,ul=1.15,pl=.44,ml=.05,fl=.22,xl=70,mo=340,vs=7,gl=6,Ms=60,fo=185,wl=new j,js=new j,xo={x:430*W,z:1e3*W};function yl({mode:e,onMode:o}){const n=ke(g=>g.camera),s=ke(g=>g.gl),r=w.useRef(),i=w.useRef(),c=w.useRef(),h=Ye("ship-tang.opt.glb"),d=Ye("ship-sub.opt.glb"),p=h||d,x=Ye("crew-heart.opt.glb"),u=h?"ship-tang.opt.glb":"ship-sub.opt.glb",f=Ao(u,28),a=w.useRef({x:xo.x,z:xo.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0}).current,m=ra({enabled:e==="sub",dom:s.domElement,zoomMin:.42,zoomMax:2.3,pitch0:.22,pitchMin:-1,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return a.x=xo.x,a.z=xo.z,a.heading=Math.PI,a.speed=0,a.throttle=0,a.flank=0,a.depth=4,a.orderedDepth=4,a.berthing=0,m.yaw=0,m.smYaw=0,m.pitch=.22,m.smPitch=.22,m.pitch0=.22,m.zoom=1,m.smZoom=1,m.noRecentre=!1,a.heel=0,b.subActive=!0,b.helm=null,nn("sub"),()=>{b.subActive=!1,b.subThrottle=0}},[e,a,m]),te((g,v)=>{if(e!=="sub"){r.current&&r.current.position.set(0,-4e3,0);return}const y=Math.min(v,.05);b.t+=y;const l=a.heading,M=H.boost;a.throttle+=(H.throttle-a.throttle)*(1-Math.pow(.02,y)),a.flank+=((M?1:0)-a.flank)*(1-Math.pow(ml,y)),b.subThrottle=Math.abs(a.throttle),a.rudder+=(H.rudder-a.rudder)*(1-Math.pow(8e-4,y));const A=z.clamp(a.depth/15,0,1),F=ys*(.7+.3*A)*(1+pl*a.flank),S=a.throttle>=0?a.throttle*F:a.throttle*dl;a.speed+=z.clamp(S-a.speed,-bs*2,bs)*y,a.speed-=a.speed*Math.abs(a.speed)*.0016*y;const R=z.lerp(fl,1,z.clamp(Math.abs(a.speed)/7,0,1));a.heading+=a.rudder*ul*R*Math.sign(a.speed>=0?1:-1)*y,a.orderedDepth-=H.planes*xl*y,a.orderedDepth=z.clamp(a.orderedDepth,0,mo),H.surfaceQueued&&(H.surfaceQueued=!1,a.orderedDepth=0),H.periscopeQueued&&(H.periscopeQueued=!1,a.orderedDepth=gl);const I=a.x+Math.sin(a.heading)*a.speed*y,E=a.z+Math.cos(a.heading)*a.speed*y,k=Cs(I,E,a.depth);a.x=I+k.vx*y,a.z=E+k.vz*y;const P=k.vx*Math.cos(a.heading)-k.vz*Math.sin(a.heading);a.heading+=P*.008*y;const C=z.clamp(Math.abs(a.speed)/ys,0,1),D=z.clamp(P*.02+a.rudder*R*C*.34,-.6,.6);a.heel+=(D-a.heel)*(1-Math.pow(.12,y)),k.danger>.05&&(a.speed*=Math.pow(1-.22*k.danger,y));const Z=ie(a.x,a.z),J=Math.max(2,-Z-vs),L=a.depth<1.5;a.depth+=(a.orderedDepth-a.depth)*(1-Math.pow(.12,y)),a.depth>J?(a.scrape+=(1-a.scrape)*(1-Math.pow(.02,y)),a.depth=J,a.orderedDepth=Math.min(a.orderedDepth,J-2),Gt(Math.abs(a.speed)*.0016*y*60,"GROUNDED ON THE SHELF"),a.speed*=Math.pow(.3,y)):a.scrape+=(0-a.scrape)*(1-Math.pow(.05,y));const X=(a.depth-fo)/(mo-fo);a.stress=X>0?Math.min(1,X*X):0,a.stress>0&&Gt(a.stress*.06*y,"HULL UNDER PRESSURE — COME UP");const oe=a.x+Math.sin(a.heading)*26,V=a.z+Math.cos(a.heading)*26;if(ie(oe,V)>-a.depth+vs*.5){a.speed*=Math.pow(.1,y);const Xe=6,Le=ie(a.x+Xe,a.z)-ie(a.x-Xe,a.z),Wt=ie(a.x,a.z+Xe)-ie(a.x,a.z-Xe),xt=Math.hypot(Le,Wt)||1;a.x-=Le/xt*20*y,a.z-=Wt/xt*20*y,a.scrape=Math.max(a.scrape,.5)}const je=Math.hypot(a.x-Y.x,a.z-Y.z);if(je<Y.pool*1.1&&a.berthing===0&&(a.berthing=1e-4),a.berthing>0){a.berthing=Math.min(1,a.berthing+y*.5),a.x+=(Y.berth.x-a.x)*(1-Math.pow(.1,y)),a.z+=(Y.berth.z-a.z)*(1-Math.pow(.1,y)),a.orderedDepth=0,a.speed*=Math.pow(.1,y);let Le=Math.atan2(Y.dir[0],Y.dir[1])+Math.PI-a.heading;for(;Le>Math.PI;)Le-=Math.PI*2;for(;Le<-Math.PI;)Le+=Math.PI*2;a.heading+=Le*(1-Math.pow(.2,y)),a.berthing>=1&&a.depth<1.2&&(b.footSpawn="rear",b.splash+=1,o?.("foot"))}a.depth<1.5!==L&&(b.splash+=1);const Be=Qe(a.x,a.z,b.t,1),tt=1-z.clamp(a.depth/10,0,1),Se=-a.depth+Be.y*tt,lt=z.clamp((a.orderedDepth-a.depth)*.05,-.34,.34)*Math.sign(a.speed>=0?1:-1)+Be.dz*.8*tt;a.pitch+=(lt-a.pitch)*(1-Math.pow(.05,y));const B=r.current;B&&(B.position.set(a.x,Se,a.z),B.rotation.set(a.pitch+a.scrape*Math.sin(b.t*23)*.02,a.heading,-Be.dx*.5*tt+a.heel)),i.current&&(i.current.rotation.z+=a.throttle*9*y),c.current&&(c.current.visible=a.depth<2.5),b.subPos.set(a.x,Se,a.z),pn(m,y,a.heading-l);const ve=a.heading+Math.PI+m.smYaw,ot=Math.cos(m.smPitch),Oe=z.clamp(a.depth/240,0,1),ce=Math.max(f*4.5,88)*m.smZoom*(1-Oe*.2)*Vs(n.aspect),he=wl.set(a.x+Math.sin(ve)*ot*ce,Se+10+Math.sin(m.smPitch)*ce,a.z+Math.cos(ve)*ot*ce),O=ie(he.x,he.z);he.y=Math.max(he.y,O+5),a.depth>10&&(he.y=Math.min(he.y,Be.y-3)),n.position.lerp(he,1-Math.pow(Ee(8e-4,.02),y));const q=Math.max(0,Math.cos(m.smYaw)),Ie=C*Ee(46,26)*q;js.set(a.x+Math.sin(a.heading)*Ie,Se+6-a.pitch*30*C*Ee(1,.35),a.z+Math.cos(a.heading)*Ie),n.lookAt(js);const Ce=Ee(1,0);Ce>.001&&n.rotateZ((a.scrape*Math.sin(b.t*19)*.015+a.heel*.35+k.danger*Math.sin(b.t*3.1)*.02)*Ce),an(n,64+C*Ee(6,2)+a.flank*Ee(2,.6),y,.06,Ys);const De=Qe(n.position.x,n.position.z,b.t,1),Ne=z.clamp((De.y-n.position.y-1)/3,0,1);b.underwater+=(Ne-b.underwater)*(1-Math.pow(.002,y)),b.depthBelow=Math.max(0,De.y-n.position.y);const Ue=z.lerp(8200,1700,b.underwater);Math.abs(n.far-Ue)>20&&(n.far=Ue,n.updateProjectionMatrix()),b.shelter+=((je<Y.pool*3?.85:0)-b.shelter)*(1-Math.pow(.06,y));let We=Fe[0],vt=1/0;for(const Xe of Fe){const Le=(a.x-Xe.x)**2+(a.z-Xe.z)**2;Le<vt&&(vt=Le,We=Xe)}Ws(y,{danger:k.danger,headingX:Math.sin(a.heading),headingZ:Math.cos(a.heading),toCentreX:We.x-a.x,toCentreZ:We.z-a.z,speed:a.speed,throttle:a.throttle})>=1&&(Gt(.22,"CAUGHT IN THE VORTEX"),a.x=We.x+(a.x>We.x?1:-1)*We.r*1.9,a.z=We.z+We.r*1.5,a.speed=0,a.orderedDepth=Math.min(mo,a.depth+18),U.grip=0,b.splash+=1);let He=Math.atan2(Y.x-a.x,Y.z-a.z)-a.heading;for(;He>Math.PI;)He-=Math.PI*2;for(;He<-Math.PI;)He+=Math.PI*2;b.helm={sub:!0,speed:a.speed,maxSpeed:F,heading:a.heading,depth:a.depth,orderedDepth:a.orderedDepth,scrape:a.scrape,stress:a.stress,maelstrom:k.danger,toRear:je,relRear:He,berthing:a.berthing>0,x:a.x,z:a.z,maxDepth:mo,crushDepth:fo,cruise:ft.level,flank:a.flank,freeCam:be.freeCam,dark:z.clamp((a.depth-Ms)/(fo-Ms),0,1)},Us(y,b.helm)}),t.jsxs("group",{ref:r,position:[0,-4e3,0],children:[p&&t.jsx(me,{name:u,loa:f,slim:Fo(u),sink:.14,rotation:Ro(u),tint:h?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:c,position:[0,f*.15,-f*.07],children:[x&&t.jsx(me,{name:"crew-heart.opt.glb",height:f*.1,rotation:0}),t.jsx(no,{crew:"heart",width:f*.26,position:[0,f*.2,-f*.2]})]}),t.jsxs("group",{visible:!p,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(g=>[0,1,2,3].map(v=>t.jsxs("mesh",{position:[g*5.1,1.2,8-v*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${g}-${v}`)))]}),t.jsxs("mesh",{position:[0,f*.02,f*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,f*.02,f*.6],scale:[f*.9,f*.9,1],children:t.jsx("spriteMaterial",{map:bl,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:it})}),t.jsxs("mesh",{position:[0,f*.24,-f*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,f*.012,-f*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(jl,{})]})}const bl=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),s=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);s.addColorStop(0,"rgba(255,255,255,0.9)"),s.addColorStop(.4,"rgba(255,255,255,0.28)"),s.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=s,n.fillRect(0,0,e,e);const r=new _t(o);return r.colorSpace=Bt,r})(),vl=`
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
`,Ml=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function jl(){const e=w.useRef(),o=w.useMemo(()=>{const r=new Float32Array(780),i=new Float32Array(260),c=new Float32Array(260),h=new Float32Array(260);for(let p=0;p<260;p++)r[p*3]=(Math.random()-.5)*3.4,r[p*3+1]=(Math.random()-.5)*2.6,r[p*3+2]=-14-Math.random()*4,i[p]=Math.random(),c[p]=.25+Math.random()*.3,h[p]=2+Math.random()*4;const d=new bt;return d.setAttribute("position",new ee(r,3)),d.setAttribute("aPhase",new ee(i,1)),d.setAttribute("aRate",new ee(c,1)),d.setAttribute("aSize",new ee(h,1)),d.boundingSphere=new Ut(new j(0,0,-30),70),d},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new j(...se(K.underGlow))}}),[]);return te((s,r)=>{const i=e.current?.uniforms;if(!i)return;i.uTime.value+=r;const c=b.subActive?b.subThrottle*b.underwater:0;i.uGain.value+=(c-i.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:vl,fragmentShader:Ml,uniforms:n,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}const ia=.42;let N=null,pt=null,xe=null,mn=!1,rt=!0;function Sl(){try{const e=localStorage.getItem("oni.audio");e!==null&&(rt=e==="1")}catch{}return rt}function Wo(e){rt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return pt&&N&&pt.gain.setTargetAtTime(e?ia:0,N.currentTime,.12),e&&N?.state==="suspended"&&N.resume(),rt}function zl(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),s=n.getChannelData(0);for(let r=0;r<o;r++)s[r]=Math.random()*2-1;return n}function Xt(e,o,n,s,r,i,c){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const d=e.createBiquadFilter();d.type=n,d.frequency.value=s,d.Q.value=r;const p=e.createGain();return p.gain.value=i,h.connect(d).connect(p).connect(c),h.start(),{src:h,filt:d,gain:p}}function $o(){if(mn){N?.state==="suspended"&&N.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;N=new e,mn=!0,pt=N.createGain(),pt.gain.value=rt?ia:0;const o=N.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=N.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,pt.connect(n).connect(o).connect(N.destination);const s=zl(N),r=N.createGain();r.gain.value=1,r.connect(pt);const i=Xt(N,s,"bandpass",480,.7,.3,r),c=Xt(N,s,"highpass",1900,.5,0,r),h=Xt(N,s,"lowpass",220,1.1,.22,r),d=Xt(N,s,"lowpass",96,1.6,0,r),p=N.createGain();p.gain.value=1,p.connect(o);const x=N.createOscillator();x.type="sawtooth",x.frequency.value=41;const u=N.createBiquadFilter();u.type="lowpass",u.frequency.value=190,u.Q.value=1.2;const f=N.createGain();f.gain.value=0,x.connect(u).connect(f).connect(p),x.start();const a=N.createOscillator(),m=N.createOscillator(),g=N.createGain();a.frequency.value=.07,m.frequency.value=.113,g.gain.value=260,a.connect(g),m.connect(g),g.connect(i.filt.frequency),a.start(),m.start();const v=N.createGain();v.gain.value=0,v.connect(pt);const y=N.createGain();y.gain.value=.16,y.connect(v);for(const[M,A]of[[146.83,1],[220,.5],[293.66,.3]]){const F=N.createOscillator();F.type="sine",F.frequency.value=M;const S=N.createGain();S.gain.value=A;const R=N.createOscillator(),I=N.createGain();R.frequency.value=.21+Math.random()*.1,I.gain.value=M*.004,R.connect(I).connect(F.frequency),R.start(),F.connect(S).connect(y),F.start()}const l=Xt(N,s,"bandpass",900,3.2,.05,v);return xe={stormBus:r,festBus:v,wind:i,rain:c,sea:h,roar:d,breath:l,buf:s,comp:o,muffle:n,humGain:f,subBus:p},N}function kl(){if(!N||!xe||!rt)return;const e=N.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const s=N.createOscillator(),r=N.createGain();s.type="sine",s.frequency.setValueAtTime(1420,e+o),s.frequency.exponentialRampToValueAtTime(1180,e+o+.5),r.gain.setValueAtTime(0,e+o),r.gain.linearRampToValueAtTime(n,e+o+.012),r.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),s.connect(r).connect(xe.subBus),s.start(e+o),s.stop(e+o+1.5)}}function Tl(e=1){if(!N||!xe||!rt)return;const o=N.currentTime,n=N.createBufferSource();n.buffer=xe.buf;const s=N.createBiquadFilter();s.type="bandpass",s.frequency.setValueAtTime(1500,o),s.frequency.exponentialRampToValueAtTime(240,o+.5),s.Q.value=.7;const r=N.createGain();r.gain.setValueAtTime(0,o),r.gain.linearRampToValueAtTime(.5*e,o+.02),r.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(s).connect(r).connect(pt),n.start(o),n.stop(o+.9)}function Ct(e,o=1,n=82){if(!N||!xe)return;const s=N.createOscillator(),r=N.createGain();s.type="sine",s.frequency.setValueAtTime(n*2.1,e),s.frequency.exponentialRampToValueAtTime(n,e+.06),s.frequency.exponentialRampToValueAtTime(n*.7,e+.5),r.gain.setValueAtTime(0,e),r.gain.linearRampToValueAtTime(o,e+.004),r.gain.exponentialRampToValueAtTime(1e-4,e+.62),s.connect(r).connect(xe.festBus),s.start(e),s.stop(e+.7);const i=N.createBufferSource();i.buffer=xe.buf;const c=N.createBiquadFilter();c.type="bandpass",c.frequency.value=1400,c.Q.value=.8;const h=N.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),i.connect(c).connect(h).connect(xe.festBus),i.start(e),i.stop(e+.12)}function El(e=1,o=0){if(!N||!xe||!rt)return;const n=N.currentTime+o,s=N.createBufferSource();s.buffer=xe.buf,s.loop=!0;const r=N.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(320,n),r.frequency.exponentialRampToValueAtTime(70,n+2.6),r.Q.value=.9;const i=N.createGain(),c=.5*e;i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(c,n+.05),i.gain.exponentialRampToValueAtTime(c*.24,n+.7),i.gain.exponentialRampToValueAtTime(c*.42,n+1.35),i.gain.exponentialRampToValueAtTime(1e-4,n+3.4),s.connect(r).connect(i).connect(xe.stormBus),s.start(n),s.stop(n+3.6);const h=N.createOscillator(),d=N.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),d.gain.setValueAtTime(0,n),d.gain.linearRampToValueAtTime(.32*e,n+.08),d.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(d).connect(xe.stormBus),h.start(n),h.stop(n+2.8)}function Rl(e=.5){if(!N||!xe||!rt)return;const o=N.currentTime;for(const[n,s,r]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const i=N.createOscillator(),c=N.createGain();i.type="sine",i.frequency.value=61*n,c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(e*s,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+r),i.connect(c).connect(pt),i.start(o),i.stop(o+r+.1)}}let Ke=0,Yo=0,Ss=0,Kt=0;function Al(e){if(!mn||!N||!xe||!rt)return;const o=N.currentTime,n=e.shelter,s=e.underwater,r=e.subActive?.12:1,i=Math.sin(n*Math.PI*.5)*r*(1-s*.92);xe.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),xe.festBus.gain.setTargetAtTime(i,o,.35),xe.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),xe.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),xe.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),xe.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-s*.55),o,.3),xe.muffle.frequency.setTargetAtTime(18e3-s*17400,o,.18);const c=e.subActive?s*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(xe.humGain.gain.setTargetAtTime(c,o,.25),e.splash!==Ss&&(Ss=e.splash,Tl(1)),e.subActive&&s>.5?Kt===0?Kt=o+1.2:o>=Kt&&(kl(),Kt=o+6.5):Kt=0,n>.06){const d=.9090909090909091;for(Ke<o&&(Ke=o+.1);Ke<o+.35;){const p=Yo%8,x=n*.9;p===0?Ct(Ke,.85*x,74):p===2?Ct(Ke,.45*x,88):p===4?Ct(Ke,.7*x,74):p===6?Ct(Ke,.4*x,92):p===7&&(Ct(Ke,.3*x,96),Ct(Ke+d*.5,.36*x,96)),Yo++,Ke+=d}}else Ke=0,Yo=0}function Fl(){const e=w.useRef(!1),o=w.useRef(-1);return te(()=>{if(Al(b),b.flash>.55&&!e.current){e.current=!0;const n=b.flashDir,s=500+Math.abs(n.z)*900;El(Math.min(1,.55+b.flash*.6),s/340)}else b.flash<.08&&(e.current=!1);b.shot!==o.current&&(b.shot===4&&o.current>=0&&Rl(.55),o.current=b.shot)}),null}function Cl({mode:e}){return b.mode=e,te(()=>Si(),-100),null}function Il({every:e=12}){const o=ke(s=>s.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),te(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function Ll({budget:e}){const o=ke(s=>s.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(pa,{bounds:s=>s>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function Gl(){const e=ke(s=>s.gl),o=ke(s=>s.scene),n=ke(s=>s.camera);return w.useEffect(()=>{const s=setTimeout(()=>{try{e.compile(o,n)}catch(r){console.warn("[onigashima] pre-compile skipped",r)}},900);return()=>clearTimeout(s)},[e,o,n]),null}function Pl(){const{camera:e,scene:o,gl:n}=ke();return w.useEffect(()=>{},[e,o,n]),null}const Ol=new ge(K.haze),Dl=new ge(K.underHaze),Nl=new ge(K.abyss),zs=new ge;function Hl(){const e=ke(o=>o.scene);return te(()=>{if(!e.fog)return;const o=z.clamp(b.depthBelow/yt.deepGrade,0,1),n=z.lerp(.0062,.0142,o);e.fog.density=z.lerp(b.fog,n,b.underwater),zs.copy(Dl).lerp(Nl,o*.8),e.fog.color.lerpColors(Ol,zs,b.underwater)}),null}function _l({quality:e,budget:o,onRails:n,playing:s,speed:r,onShot:i,mode:c,onMode:h,crew:d}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[K.haze]}),t.jsx("fogExp2",{attach:"fog",args:[K.haze,b.fog]}),t.jsx(Ta,{storm:b}),t.jsx(_r,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(Ja,{quality:e,segments:o.segments}),t.jsx(Va,{quality:e,storm:b}),t.jsx(pr,{quality:e,shadows:o.shadows}),t.jsx(Bn,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Bn,{quality:e,shadows:!1,z:to,k:W*1.5}),t.jsx(wr,{quality:e,shadows:o.shadows}),t.jsx(br,{quality:e,shadows:o.shadows}),t.jsx(Pr,{quality:e}),t.jsx(Dr,{shadows:o.shadows}),t.jsx(Zi,{quality:e,shadows:o.shadows}),t.jsx(Kr,{quality:e}),t.jsx(Jr,{quality:e}),t.jsx(ri,{quality:e}),t.jsx(xi,{quality:e}),t.jsx(Fi,{onRails:n&&c==="off",playing:s&&c==="off",speed:r,onShot:i,idle:c!=="off"}),t.jsx(Cl,{mode:c}),t.jsx(hl,{mode:c,onMode:h,crew:d}),t.jsx(yl,{mode:c,onMode:h}),t.jsx(Fl,{}),t.jsx(Hl,{}),t.jsx(Pl,{}),t.jsx(Gl,{}),t.jsx(Ll,{budget:o}),o.shadows&&t.jsx(Il,{every:o.shadowEvery})]})}const Zt="#d63420",Bl="rgba(8,6,16,0.72)",ks="(max-width: 860px), (max-height: 520px)",Vo="min(7.5vh, 62px)";function Ul(e=2600,o=!0){const[n,s]=w.useState(!1);return w.useEffect(()=>{if(!o){s(!1);return}let r;const i=()=>{s(!1),clearTimeout(r),r=setTimeout(()=>s(!0),e)};i();for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(c,i,{passive:!0});return()=>{clearTimeout(r);for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(c,i)}},[e,o]),n}function Wl(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(ks).matches);return w.useEffect(()=>{const n=window.matchMedia(ks),s=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",s):n.addListener(s),()=>{n.removeEventListener?n.removeEventListener("change",s):n.removeListener(s)}},[]),e}function $e({on:e,onClick:o,children:n,title:s,wide:r,block:i}){return t.jsx("button",{onClick:o,title:s,style:{appearance:"none",border:`1px solid ${e?Zt:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:r||i?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:i?"100%":void 0,textAlign:i?"right":"center",minHeight:32},children:n})}function $l({shot:e,shotIndex:o,shotCount:n,total:s,playing:r,onRails:i,speed:c,tier:h,override:d,dev:p,onPlay:x,onRailsToggle:u,onSpeed:f,onQuality:a,onRestart:m,audio:g,onAudio:v,mode:y,onMode:l,crew:M,onCrew:A,stage:F,veiled:S=!1}){const R=y!=="off",I=Wl(),[E,k]=w.useState(!1),[P,C]=w.useState(()=>({...be}));w.useEffect(()=>Zs(B=>C({...B})),[]);const D=Ul(2600,!R&&!E),Z=w.useRef(),J=w.useRef(),L=w.useRef(),X=w.useRef(),oe=w.useRef(),V=w.useRef(),re=i&&!R;w.useEffect(()=>k(!1),[y]),w.useEffect(()=>{let B,ve=performance.now(),ot=0,Oe=0;const ce=he=>{if(B=requestAnimationFrame(ce),Z.current&&(Z.current.style.transform=`scaleX(${F.progress||0})`),L.current&&F.helm){const O=F.helm;if(O.onFoot)L.current.textContent=O.area==="island"?O.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":O.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(O.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(O.sub){const q=Math.abs(O.speed)*1.94;if(O.berthing)L.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Ie=O.maelstrom>.22?O.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":O.stress>.02?"⚠ HULL UNDER PRESSURE":O.scrape>.3?"HULL ON THE ROCK":"",Ce=Math.abs(O.relRear*180/Math.PI),De=Ce<6?"· ON COURSE":O.relRear>0?`◀ ${Ce.toFixed(0)}°`:`${Ce.toFixed(0)}° ▶`,Ne=10,Ue=Math.round(O.depth/O.maxDepth*Ne),We=Math.round(O.crushDepth/O.maxDepth*Ne);let vt="";for(let He=0;He<Ne;He++)vt+=He<Ue?He>=We?"▓":"█":He===We?"┃":"·";const kt=O.cruise===2?" ⟲FLK":O.cruise===1?" ⟲AHD":"";L.current.textContent=`DEPTH ${O.depth.toFixed(0).padStart(3,"0")}/${O.orderedDepth.toFixed(0).padStart(3,"0")}m ${vt}  ${q.toFixed(0).padStart(2,"0")} KN${kt}
COVE ${Math.round(O.toRear)}m  ${De}`+(Ie?`
${Ie}`:"")}}else{const q=Math.abs(O.speed)*1.94,Ie=(O.heading*180/Math.PI+180)%360,Ce=Math.round((O.burst??0)*5),De=O.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(Ce)}${"·".repeat(5-Ce)}`,Ne=O.cruise===2?"  ⟲FLANK":O.cruise===1?"  ⟲AHEAD":O.flank>.5?"  FLANK":"";L.current.textContent=`${q.toFixed(0).padStart(2,"0")} KN   BRG ${Ie.toFixed(0).padStart(3,"0")}°   ${De}${Ne}
`+(O.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":O.moored?"MOORING":O.aground>.3?"AGROUND — HELM OVER":O.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(O.toGate)}m`:O.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(O.toGate)}m`:`GATE ${Math.round(O.toGate)}m`)}}if(X.current){const O=ti(),q=ei(U.chain);X.current.textContent=U.done?"✔ OBJECTIVE COMPLETE":O?`▸ ${U.step+1}/${q}  ${O.text}`:"",X.current.style.color=U.done?"#8fe0a0":"#ffd9cf"}if(oe.current){const O=Math.max(0,Math.min(1,U.hull)),q=Math.max(0,Math.min(1,U.grip)),Ie=Ne=>{const Ue=Math.round(Ne*12);return"█".repeat(Ue)+"·".repeat(12-Ue)},Ce=O>.6?"#8fe0a0":O>.3?"#ffc46b":"#ff6b5a",De=q>.66?"#ff6b5a":q>.33?"#ffc46b":"rgba(255,255,255,0.45)";oe.current.innerHTML=`<span style="color:${Ce}">HULL ${Ie(O)}</span>`+(q>.02?`<span style="color:${De};margin-left:14px">VORTEX ${Ie(q)}</span>`:"")}if(V.current){const O=U.banner,q=V.current;O?(q.dataset.text!==O.text&&(q.dataset.text=O.text,q.innerHTML=`<div class="og-banner-main">${O.text}</div>`+(O.sub?`<div class="og-banner-sub">${O.sub}</div>`:""),q.style.animation="none",q.offsetWidth,q.style.animation=""),q.style.opacity="1"):(q.style.opacity="0",q.dataset.text="")}p&&J.current?(Oe++,ot+=he-ve,ve=he,ot>400&&(J.current.textContent=`${Math.round(Oe*1e3/ot)} fps · shelter ${F.shelter.toFixed(2)} · fog ${(F.fog*1e4).toFixed(1)}e-4 · flash ${F.flash.toFixed(2)}`,ot=0,Oe=0)):ve=he};return B=requestAnimationFrame(ce),()=>cancelAnimationFrame(B)},[F,p]);const je={opacity:D?.16:1,transform:D?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},et=[{key:"rails",on:!i,label:i?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:u,cinematicOnly:!0},{key:"helm",on:y==="helm",label:y==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>l(y==="helm"?"off":"helm")},{key:"sub",on:y==="sub",label:y==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>l(y==="sub"?"off":"sub")},{key:"foot",on:y==="foot",label:y==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>l(y==="foot"?"off":"foot")}],Be=B=>y==="foot"?t.jsx($e,{on:!0,wide:!0,block:B,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>A?.(M==="zoro"?"luffy":"zoro"),children:M==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,tt=(B,ve)=>t.jsx($e,{on:B.on,onClick:B.click,title:B.title,wide:!0,block:ve,children:B.label},B.key),Se=B=>R?t.jsxs(t.Fragment,{children:[t.jsx($e,{on:P.comfort>.01,wide:!0,block:B,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:wi,children:P.comfort>.9?"COMFORT · FULL":P.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx($e,{on:P.freeCam,wide:!0,block:B,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>To("freeCam"),children:P.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx($e,{on:Math.abs(P.lookSens-1)>.01,wide:!0,block:B,title:"How far a drag turns the view",onClick:yi,children:`LOOK ${P.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx($e,{on:P.invertY,wide:!0,block:B,title:"Invert the vertical look axis",onClick:()=>To("invertY"),children:P.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,lt=B=>t.jsxs(t.Fragment,{children:[!R&&t.jsxs(t.Fragment,{children:[t.jsx($e,{on:r,onClick:x,title:"Play / pause the cinematic",block:B,children:r?B?"❙❙  PAUSE":"❙❙":B?"▶  PLAY":"▶"}),[.5,1,2].map(ve=>t.jsxs($e,{on:c===ve,onClick:()=>f(ve),title:`${ve}× speed`,block:B,children:[ve,"×"]},ve))]}),t.jsx($e,{on:!1,onClick:m,title:"Restart from the open sea",block:B,children:B?"↺  RESTART":"↺"}),t.jsx($e,{on:g,onClick:v,title:"Storm, taiko and a temple bell — all synthesised",block:B,children:g?B?"♪  SOUND ON":"♪":B?"♪̸  SOUND OFF":"♪̸"}),t.jsx($e,{on:d!=="auto",wide:!0,block:B,title:"Render tier",onClick:()=>a(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${h.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!S&&t.jsxs(t.Fragment,{children:[[0,1].map(B=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[B?"bottom":"top"]:0,height:re?Vo:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},B)),t.jsxs("div",{className:"og-tategaki",style:{opacity:R||E?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:R?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${Zt}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:R?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:Z,style:{height:"100%",background:`linear-gradient(90deg, ${Zt}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${Zt}`}})}),t.jsx("div",{className:`og-chrome${R?"":" og-chrome-bottom"}`,style:{...R?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...je},children:I?t.jsxs(t.Fragment,{children:[R&&t.jsx($e,{on:!0,onClick:()=>l("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx($e,{on:E,onClick:()=>k(B=>!B),title:"Menu",children:E?"✕":"☰"}),E&&t.jsxs("div",{className:"og-menu",children:[R&&t.jsxs(t.Fragment,{children:[Be(!0),Se(!0),t.jsx("div",{className:"og-menu-rule"})]}),et.filter(B=>!(B.cinematicOnly&&R)).map(B=>tt(B,!0)),t.jsx("div",{className:"og-menu-rule"}),lt(!0)]})]}):t.jsxs(t.Fragment,{children:[Be(!1),Se(!1),lt(!1),et.filter(B=>!(B.cinematicOnly&&R)).map(B=>tt(B,!1))]})}),!R&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...je,pointerEvents:"none"},children:[i?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:i?`  ·  ${Math.round(s)}s`:""})]}),R&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:X,className:"og-objective"}),t.jsx("div",{ref:L,className:"og-readout"}),t.jsx("div",{ref:oe,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:y==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":y==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":"WASD MOVE · SHIFT RUN · DRAG ORBIT · WHEEL ZOOM · R RECENTRE"})]}),R&&t.jsx("div",{ref:V,className:"og-banner"}),p&&t.jsx("div",{ref:J,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Bl,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${re?Vo:"0px"};
          --og-bottom: ${re?Vo:"0px"};
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
          color: ${Zt};
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
      `})]})}const Xo="#d63420",Yl=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Vl({onPick:e}){const[o,n]=w.useState(!1),s=w.useRef(),r=620,i=d=>{o||(n(!0),e(d))},[c,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const d=setTimeout(()=>h(!0),r);return()=>clearTimeout(d)},[o]),w.useEffect(()=>{const d=p=>{(p.key==="Escape"||p.key==="Enter")&&i("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),c?null:t.jsxs("div",{ref:s,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${r}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Yl.map((d,p)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+p*.07}s`},onClick:()=>i(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${Xo};
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
          border-color: ${Xo};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Xo};
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
      `})]})}const zn="#d63420",kn="#4aa9c9",Xl=(e,o,n)=>e<o?o:e>n?n:e;function la(e,o,n){const s=w.useRef(o);s.current=o;const r=w.useRef(null),i=w.useRef({x:0,y:0});w.useEffect(()=>{const c=e.current;if(!c||!n)return;const h=u=>{if(r.current===null){r.current=u.pointerId,i.current={x:u.clientX,y:u.clientY};try{c.setPointerCapture?.(u.pointerId)}catch{}s.current.onMove(0,0,u.clientX,u.clientY),u.preventDefault()}},d=u=>{if(u.pointerId!==r.current)return;const f=i.current;s.current.onMove(u.clientX-f.x,u.clientY-f.y,f.x,f.y),u.preventDefault()},p=u=>{u.pointerId===r.current&&(r.current=null,s.current.onEnd(),u.cancelable&&u.preventDefault())};c.addEventListener("pointerdown",h),c.addEventListener("pointermove",d),c.addEventListener("pointerup",p),c.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),window.addEventListener("pointercancel",p);const x=()=>{r.current!==null&&(r.current=null,s.current.onEnd())};return window.addEventListener("blur",x),()=>{c.removeEventListener("pointerdown",h),c.removeEventListener("pointermove",d),c.removeEventListener("pointerup",p),c.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),window.removeEventListener("pointercancel",p),window.removeEventListener("blur",x)}},[e,n])}function Kl({label:e,sub:o,onDown:n,onUp:s,tone:r="plain",wide:i=!1}){const[c,h]=w.useState(!1),d=w.useRef();w.useEffect(()=>{const x=d.current;if(!x)return;let u=null;const f=m=>{u=m.pointerId;try{x.setPointerCapture?.(u)}catch{}h(!0),n(),m.preventDefault(),m.stopPropagation()},a=m=>{m.pointerId===u&&(u=null,h(!1),s(),m.preventDefault(),m.stopPropagation())};return x.addEventListener("pointerdown",f),x.addEventListener("pointerup",a),x.addEventListener("pointercancel",a),x.addEventListener("pointerleave",a),()=>{x.removeEventListener("pointerdown",f),x.removeEventListener("pointerup",a),x.removeEventListener("pointercancel",a),x.removeEventListener("pointerleave",a)}},[n,s]);const p=r==="hot"?zn:r==="cool"?kn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${c?p:"rgba(255,255,255,0.18)"}`,background:c?`color-mix(in srgb, ${p} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:c?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Pt({label:e,sub:o,onTap:n,on:s,tone:r="plain",wide:i=!1}){const c=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const p=c.current;if(!p)return;const x=u=>{h.current(),u.preventDefault(),u.stopPropagation()};return p.addEventListener("pointerdown",x),()=>p.removeEventListener("pointerdown",x)},[]);const d=r==="hot"?zn:r==="cool"?kn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${s?d:"rgba(255,255,255,0.18)"}`,background:s?`color-mix(in srgb, ${d} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:s?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Zl(){const[e,o]=w.useState(ft.level);return w.useEffect(()=>Mi(o),[]),t.jsx(Pt,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:Qs})}function Ql({simple:e=!1}){const[o,n]=w.useState(be.freeCam);w.useEffect(()=>Zs(r=>n(r.freeCam)),[]);const s=w.useRef(null);return e?t.jsx(Pt,{label:"LEVEL",sub:"view",onTap:()=>H.recentreQueued=!0}):t.jsx(Pt,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const r=performance.now();if(s.current&&r-s.current<420){s.current=null,To("freeCam"),H.recentreQueued=!0;return}s.current=r,H.recentreQueued=!0}})}function ql({active:e}){const o=w.useRef(),n=w.useRef(),s=w.useRef(),r=78;return w.useEffect(()=>{if(!e)return;let i;const c=()=>{i=requestAnimationFrame(c);const h=s.current,d=b.helm;h&&(h.textContent=d?.sub?String(Math.round(d.orderedDepth)):"⇕")};return i=requestAnimationFrame(c),()=>cancelAnimationFrame(i)},[e]),la(o,{onMove:(i,c,h,d)=>{const p=o.current;if(!p)return;const x=p.getBoundingClientRect(),u=x.top+x.height/2,f=Xl((d+c-u)/r,-1,1),a=Math.abs(f)<.1?0:f;ne.active=!0,ne.planes=-a;const m=n.current;m&&(m.style.transform=`translate(-50%, calc(-50% + ${f*r}px))`,m.style.borderColor=kn,m.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{ne.planes=0;const i=n.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:s,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function Jl({mode:e}){const o=w.useRef(),n=w.useRef(),s=w.useRef(),r=w.useRef(),i=62,c=7,h=w.useRef(e);if(h.current=e,la(o,{onMove:(x,u,f,a)=>{const m=Math.hypot(x,u),g=m>i?i/m:1,v=x*g,y=u*g,l=n.current,M=s.current;l&&(l.style.transform=`translate(${f-i}px, ${a-i}px)`,l.style.opacity="1"),M&&(M.style.transform=`translate(${f+v-26}px, ${a+y-26}px)`,M.style.opacity="1"),r.current&&(r.current.style.opacity="0");const A=Math.abs(v)<c?0:v/i,F=Math.abs(y)<c?0:y/i;ne.active=!0,h.current==="foot"?(ne.walk.x=A,ne.walk.z=-F):(ne.throttle=-F,ne.rudder=-A)},onEnd:()=>{n.current&&(n.current.style.opacity="0"),s.current&&(s.current.style.opacity="0"),r.current&&(r.current.style.opacity=""),ne.throttle=0,ne.rudder=0,ne.walk.x=0,ne.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{ne.throttle=0,ne.rudder=0,ne.planes=0,ne.boost=!1,ne.walk.x=0,ne.walk.z=0},[e]),e==="off")return null;const d=e==="sub",p=e==="foot";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:o,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:n,style:{position:"fixed",left:0,top:0,width:i*2,height:i*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:s,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${zn}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:r,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:p?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[d&&t.jsx(ql,{active:!0}),t.jsxs("div",{className:"og-actions",children:[d&&t.jsx(Pt,{label:"SURFACE",sub:"blow all",onTap:()=>H.surfaceQueued=!0}),d&&t.jsx(Pt,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>H.periscopeQueued=!0}),e==="helm"&&t.jsx(Pt,{label:"BURST",sub:"coup de",tone:"cool",onTap:()=>H.burstQueued=!0}),!p&&t.jsx(Zl,{}),t.jsx(Kl,{label:p?"RUN":"FLANK",sub:p?"»":"over",tone:"hot",onDown:()=>ne.boost=!0,onUp:()=>ne.boost=!1}),t.jsx(Ql,{simple:p})]})]}),t.jsx("style",{children:`
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
      `})]})}const Ts={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function ec(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const tc=null;function rc(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(ec),[n,s]=w.useState("auto"),r=n==="auto"?o:n,i=Ts[r]??Ts.high;w.useEffect(()=>{sr(i.scene!=="low")},[i.scene]),w.useMemo(()=>Fs(i.scene),[i.scene]),w.useMemo(()=>vi(),[]),w.useEffect(()=>ji(),[]);const c=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,d]=w.useState(0),[p,x]=w.useState(!0),[u,f]=w.useState(!0),[a,m]=w.useState(1),[g,v]=w.useState(ls[0]),[y,l]=w.useState(0),[M,A]=w.useState(Sl),[F,S]=w.useState(()=>{if(typeof location>"u")return"off";const V=new URLSearchParams(location.search).get("mode");return V==="helm"||V==="sub"||V==="foot"?V:"off"}),[R,I]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy");w.useEffect(()=>{if(!M)return;const V=()=>{$o(),Wo(!0)};for(const re of["pointerdown","keydown","touchstart"])window.addEventListener(re,V,{once:!0,passive:!0});return()=>{for(const re of["pointerdown","keydown","touchstart"])window.removeEventListener(re,V)}},[M]);const E=w.useCallback(()=>{A(V=>{const re=!V;return re&&$o(),Wo(re),re})},[]),[k,P]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),C=w.useCallback(V=>{M&&($o(),Wo(!0)),V==="off"?(b.jumpTo=0,x(!0),f(!0)):S(V),P(!0)},[M]),[D,Z]=w.useState(!1),J=w.useRef(!0);w.useEffect(()=>{if(qs(),J.current){J.current=!1;return}Z(!0);const V=setTimeout(()=>Z(!1),210);return()=>clearTimeout(V)},[F]);const L=w.useCallback((V,re)=>{l(V),v(re)},[]),X=w.useCallback(()=>{nr(),d(V=>V+1),x(!0),f(!0)},[]),oe=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(tc,{})}):t.jsxs(t.Fragment,{children:[t.jsx(ma,{shadows:i.shadows,dpr:i.dpr,gl:{antialias:i.aa,powerPreference:"high-performance",toneMapping:Ma,toneMappingExposure:Sa,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(_l,{quality:i.scene,budget:i,onRails:u,playing:p,speed:a,onShot:L,mode:F,onMode:S,crew:R},h)})}),c&&k&&t.jsx(Jl,{mode:F}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:D?1:0,transition:D?"opacity .2s ease-in":"opacity .42s ease-out"}}),!k&&t.jsx(Vl,{onPick:C}),t.jsx($l,{veiled:!k,shot:g,shotIndex:y,shotCount:ls.length,total:un,playing:p,onRails:u,speed:a,tier:r,override:n,dev:oe,onPlay:()=>x(V=>!V),onRailsToggle:()=>f(V=>!V),onSpeed:m,onQuality:s,onRestart:X,audio:M,onAudio:E,mode:F,onMode:S,crew:R,onCrew:I,stage:b})]})}export{rc as default};
