var ea=Object.defineProperty;var ta=(e,o,n)=>o in e?ea(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var Tn=(e,o,n)=>ta(e,typeof o!="symbol"?o+"":o,n);import{r as g,u as J,j as t,d as ys,f as Se,h as oa,i as na}from"./vendor-C2HIMx-P.js";import{t as xe,c as M,aD as $o,au as hn,d as dn,a5 as Te,aJ as sa,f as aa,Y as En,a0 as Rn,ag as S,h as q,aK as ra,ay as ia,az as Pt,aA as Ot,aq as bs,R as la,M as He,o as Qe,at as vt,ax as st,aL as eo,aM as to,a4 as ca,a8 as wt,ar as Dt,av as vs,aC as ha,A as da}from"./three-Zo_RlN_K.js";import{f as Gt,m as un}from"./index-Ch9hADlh.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},k={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},yo={dir:[.72,.52,-.44],col:"#f2e9cf"},gt={sea:.00105,bay:48e-5,deepGrade:210},ua=1.15;function oe(e){const o=new xe(e);return[o.r,o.g,o.b]}const pa=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,ma=`
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
`;function fa({storm:e}){const o=g.useRef(),n=g.useMemo(()=>({uTime:{value:0},uHigh:{value:new M(...oe(X.skyHigh))},uLow:{value:new M(...oe(X.skyLow))},uCloud:{value:new M(...oe(X.cloud))},uCloudLit:{value:new M(...oe(X.cloudLit))},uEmber:{value:new M(...oe(k.ember))},uFlash:{value:0},uFlashColor:{value:new M(...oe(X.boltGlow))},uFlashDir:{value:new M(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new M(...yo.dir).normalize()},uMoonCol:{value:new M(...oe(yo.col))},uUnder:{value:0},uUnderCol:{value:new M(...oe(X.underHaze))}}),[]);return J((a,i)=>{const l=o.current?.uniforms;l&&(l.uTime.value+=i,l.uFlash.value=e?.flash??0,e?.flashDir&&l.uFlashDir.value.copy(e.flashDir),l.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:pa,fragmentShader:ma,uniforms:n,side:$o,depthWrite:!1,depthTest:!1,fog:!1})]})}const W=1.9,$=e=>e*W,ie={x:0,z:$(-60)},ht=$(300),xo=$(175),xa=118,P={x:0,z:$(-402),r:$(215),baseY:300,squash:[1.18,1.04,.98]},Yt=[[-.361,.301,.883],[.361,.301,.883]],pn=[0,.02,.9998],mn=[0,-.419,.908];function fn(e,o=1){const[n,a,i]=P.squash;return{x:P.x+e[0]*P.r*n*o,y:P.baseY+e[1]*P.r*a*o,z:P.z+e[2]*P.r*i*o}}const be=Yt.map(e=>fn(e)),le={...fn(mn),halfWidth:74,height:62};fn(pn,.94);const K={x:$(-152),y:4.5,z:$(-104),r:$(78)},An=2.35,yt=[Math.sin(An),Math.cos(An)],V=(()=>{const e=ht+xo*.35,o=ie.x+yt[0]*e,n=ie.z+yt[1]*e;return{x:o,z:n,pool:$(46),benchY:3.6,reach:$(560),gate:{x:o-yt[0]*$(44),z:n-yt[1]*$(44)},berth:{x:o+yt[0]*$(12),z:n+yt[1]*$(12)},dir:yt}})(),ga=[{rank:1,role:"east-south",ang:.75,dist:$(730),r:$(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:$(730),r:$(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:$(770),r:$(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:$(690),r:$(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:$(690),r:$(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:$(765),r:$(150),depth:42,dir:1,speed:35}],Ae=[];function Ms(e){const o=e==="low"?3:e==="mid"?5:7;Ae.length=0;for(const n of ga)n.rank>o||Ae.push({role:n.role,x:ie.x+Math.sin(n.ang)*n.dist,z:ie.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Ae}const wa=e=>Ae.find(o=>o.role===e)??Ae[0];Ms("high");function js(e,o,n=0){let a=0,i=0;const l=1-Ie(8,34,n);if(l<=0)return{vx:a,vz:i,danger:0};let h=0;for(const c of Ae){const d=e-c.x,u=o-c.z,x=Math.hypot(d,u);if(x>c.r*1.7||x<.001)continue;const r=x/c.r,f=1-Ie(1,1.6,r),m=c.speed*(r/.3)*Math.exp(1-r/.3)*.62*f,s=c.speed*.55*Math.exp(-r*r*2.6)*f+c.speed*.1*f,p=1/x;a+=(-u*p*m*c.dir-d*p*s)*l,i+=(d*p*m*c.dir-u*p*s)*l,h=Math.max(h,(1-Ie(.15,1.15,r))*l)}return{vx:a,vz:i,danger:h}}const Ss={x:0,halfWidth:$(96)},Mt=$(258),Zt=$(624),bo={safe:260,range:1150},ya=0,go=$(1500),vo=e=>e<0?0:e>1?1:e;function ba(e,o,n=4){let a=0,i=1,l=1,h=0;for(let c=0;c<n;c++){const d=1-Math.abs(Gt(e*l,o*l,1)*2-1);a+=d*d*i,h+=i,i*=.52,l*=2.07}return a/h}const Ie=(e,o,n)=>{const a=vo((n-e)/(o-e));return a*a*(3-2*a)};function va(e){if(e>$(430))return 1e4;const o=1-Ie($(430),$(205),e),n=Ie($(150),$(-30),e);return Ss.halfWidth+o*$(620)+n*$(300)}function Ma(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let a=xa;return a+=o*190,a+=Math.max(0,n)*46,a-=Math.max(0,-n)*26,a}function re(e,o){const n=e-ie.x,a=o-ie.z,i=Math.hypot(n,a),l=Math.atan2(n,a),h=(i-ht)/xo,c=Math.exp(-h*h*1.35)*Ma(l),d=Math.max(0,i-ht-xo*.55),u=-Math.pow(d/210,1.6)*175,x=Math.max(0,ht-xo*.5-i),r=-Ie(0,150,x)*46,f=vo(c/60),m=(ba(e*.0052/W+13,o*.0052/W-21,4)-.42)*168*f,s=(Gt(e*.0042/W+31,o*.0042/W-17,4)-.5)*84*f,p=(Gt(e*.021-5,o*.021+9,3)-.5)*17*f;let y=c+u+r+m+s+p;const v=va(o),b=1-Ie(v,v+$(105),Math.abs(e-Ss.x)),j=1-Ie($(-40),$(-190),o),R=b*j;y=y*(1-R)+Math.min(y,-34)*R;const E=Math.hypot(e-P.x,o-P.z);y+=Math.exp(-Math.pow(E/(P.r*1.55),2))*62;const C=(e-K.x)/$(76),A=(o-K.z)/$(58),F=(1-Ie(.72,1.18,Math.hypot(C,A)))*vo((y+34)/34);y=y*(1-F)+K.y*F;const z=e-V.x,T=o-V.z;if(Math.abs(z)+Math.abs(T)<V.reach+$(140)){const N=Math.max(0,Math.min(V.reach,z*V.dir[0]+T*V.dir[1])),I=z-V.dir[0]*N,B=T-V.dir[1]*N,Z=Math.hypot(I,B),ne=$(30)+N/V.reach*$(48),G=1-Ie(ne,ne+$(62),Z);y=y*(1-G)+Math.min(y,-26)*G;const L=Math.hypot(z,T),Q=1-Ie(V.pool*.55,V.pool,L);y=y*(1-Q)+Math.min(y,-14)*Q;const ae=(e-V.gate.x)/$(30),te=(o-V.gate.z)/$(24),pe=1-Ie(.72,1.18,Math.hypot(ae,te));y=y*(1-pe)+V.benchY*pe}return y}function xn(e,o,n=3){const a=re(e+n,o)-re(e-n,o),i=re(e,o+n)-re(e,o-n),l=-a,h=2*n,c=-i,d=Math.hypot(l,h,c)||1;return[l/d,h/d,c/d]}function ja(e,o,n=3){return Math.acos(xn(e,o,n)[1])}function Qt(e,o){const n=Ie($(250),$(40),o),a=1-Ie(ht-$(40),ht+$(90),Math.hypot(e-ie.x,o-ie.z)),i=(1-Ie($(60),$(170),Math.hypot(e-V.x,o-V.z)))*.85;return vo(Math.max(Math.min(n,a),i))}const zs=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],Sa=Math.PI*2;function za(e,o,n){let a=0,i=0,l=0;for(const h of Ae){const c=e-h.x,d=o-h.z,u=Math.max(1,Math.hypot(c,d));if(u>h.r*1.75)continue;const x=u/h.r,r=Math.exp(-3*x*x);a-=h.depth*r;const f=h.depth*6*x*r/h.r;i+=f*(c/u),l+=f*(d/u);const m=Math.atan2(d,c),s=Math.sin(m*3*h.dir+x*14-n*2.2),p=x*Math.exp(1-x)*(1-ka(x));a+=s*p*1.6}return{y:a,dx:i,dz:l}}function ka(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function Ke(e,o,n,a=1){let i=0,l=0,h=0;for(const d of zs){const u=Sa/d.len,x=Math.sqrt(9.81/u),r=Math.hypot(d.dir[0],d.dir[1]),f=d.dir[0]/r,m=d.dir[1]/r,s=u*(f*e+m*o-x*n),p=d.amp*a;i+=p*Math.sin(s);const y=p*u*Math.cos(s);l+=y*f,h+=y*m}const c=za(e,o,n);return i+=c.y,l+=c.dx,h+=c.dz,{y:i,dx:l,dz:h}}const Ta=zs.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Ea=()=>Ae.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),Ra=()=>Ae.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),Aa=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*W).toFixed(1)}, ${(250*W).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(ht-40*W).toFixed(1)}, ${(ht+90*W).toFixed(1)},
      length(p - vec2(${ie.x.toFixed(1)}, ${ie.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*W).toFixed(1)}, ${(170*W).toFixed(1)},
      length(p - vec2(${V.x.toFixed(1)}, ${V.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Fa=()=>`
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
${Aa}

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
${Ta}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Ea()}

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
`,Ca=()=>`
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
${Ra()}
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
`;function Ia(e,o){const n=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let l=0;l<e;l++){const h=ie.x+((l+.5)/e-.5)*o,c=ie.z+((i+.5)/e-.5)*o,d=re(h,c),u=S.clamp(-d/46,0,1),x=(i*e+l)*4;n[x]=Math.round(u*255),n[x+1]=n[x],n[x+2]=n[x],n[x+3]=255}const a=new sa(n,e,e,aa);return a.minFilter=En,a.magFilter=En,a.wrapS=Rn,a.wrapT=Rn,a.needsUpdate=!0,a}const Mo={low:112,mid:190,high:286},Vo=6400;function Ga(e){const o=g.useRef(),n=Vo/(Mo[e]??Mo.high);return J(a=>{const i=o.current;i&&(i.position.x=Math.round((a.camera.position.x-ie.x)/n)*n,i.position.z=Math.round((a.camera.position.z-ie.z)/n)*n)}),o}function La({quality:e="high",storm:o}){const n=g.useRef(),a=Ga(e),{geometry:i,uniforms:l,landTex:h,vert:c,frag:d}=g.useMemo(()=>{const u=Mo[e]??Mo.high,x=new hn(Vo,Vo,u,u);x.rotateX(-Math.PI/2),x.translate(ie.x,0,ie.z);const r=go*1.05,f=Ia(e==="low"?160:256,r),m={uTime:{value:0},uLand:{value:f},uSpan:{value:r},uCentre:{value:new dn(ie.x,ie.z)},uDeep:{value:new M(...oe(X.seaDeep))},uShallow:{value:new M(...oe(X.seaShallow))},uFoam:{value:new M(...oe(X.foam))},uSkyLow:{value:new M(...oe(X.skyLow))},uGilt:{value:new M(...oe(k.gilt))},uEmber:{value:new M(...oe(k.ember))},uFogColor:{value:new M(...oe(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new M(...oe(X.abyss))},uUnderGlow:{value:new M(...oe(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:Pa.clone()},uMoonCol:{value:new M(...oe(Oa))},uEyeA:{value:new M(be[0].x,be[0].y,be[0].z)},uEyeB:{value:new M(be[1].x,be[1].y,be[1].z)},uFlash:{value:0},uFlashColor:{value:new M(...oe(X.boltGlow))},uCameraPos:{value:new M}};return{geometry:x,uniforms:m,landTex:f,vert:Fa(),frag:Ca()}},[e]);return J((u,x)=>{const r=n.current?.uniforms;if(!r)return;r.uTime.value+=x,r.uCameraPos.value.copy(u.camera.position),r.uFlash.value=o?.flash??0,r.uFogDensity.value=o?.fog??.0011;const f=Math.min(1,Math.max(0,(o?.depthBelow??0)/gt.deepGrade));r.uDepthFade.value=f,Fn.copy(Na).lerp(Ha,f*.8),r.uFogColor.value.lerpVectors(Da,Fn,o?.underwater??0)}),t.jsx("mesh",{ref:a,geometry:i,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:c,fragmentShader:d,uniforms:l,transparent:!1,side:Te},h.uuid)})}const Pa=new M(...yo.dir).normalize(),Oa=yo.col,Da=new M(...oe(X.haze)),Na=new M(...oe(X.underHaze)),Ha=new M(...oe(X.abyss)),Fn=new M;function _a({quality:e="high",segments:o=200}){const n=g.useMemo(()=>{const a=o,i=new hn(go,go,a,a);i.rotateX(-Math.PI/2);const l=i.attributes.position,h=l.count,c=new Float32Array(h*3),d=new xe(X.rock),u=new xe(X.rockLit),x=new xe("#0b0e18"),r=new xe(X.snow),f=new xe(k.rockWarm),m=new xe;for(let s=0;s<h;s++){const p=l.getX(s)+ie.x,y=l.getZ(s)+ie.z,v=re(p,y);l.setX(s,p),l.setY(s,v),l.setZ(s,y);const b=xn(p,y,go/a)[1],j=Math.max(0,(b-.55)/.45);m.copy(d).lerp(u,S.clamp(v/190,0,1));const R=1-S.clamp((v-ya)/13,0,1);m.lerp(x,R*.85);const E=S.clamp((p-ie.x)/260,0,1),C=96-E*42,A=S.clamp((v-C)/60,0,1)*j;m.lerp(r,A*(.45+E*.5));const F=Math.hypot(p-P.x,y-P.z),z=Math.exp(-Math.pow(F/330,2)),T=S.clamp((y-P.z)/260,0,1);m.lerp(f,z*T*.6*(1-A)),c[s*3]=m.r,c[s*3+1]=m.g,c[s*3+2]=m.b}return i.setAttribute("color",new q(c,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const gn=-30,wn=330,Ba=150,me={x:le.x,y:le.y-40,z:le.z-Ba-(gn+wn)},Re={centre:[0,96,gn],radii:[350,235,wn]},St={x:me.x+Re.centre[0],y:me.y+Re.centre[1],z:me.z+Re.centre[2]};function Yo(e,o=.06){const n=(e.x-St.x)/Re.radii[0],a=(e.y-St.y)/Re.radii[1],i=(e.z-St.z)/Re.radii[2],l=Math.sqrt(n*n+a*a+i*i),h=1+o;if(l>=h)return null;const c=l<1e-4?0:h/l;return e.x=St.x+(c?n*c:0)*Re.radii[0],e.y=St.y+(c?a*c:h)*Re.radii[1],e.z=St.z+(c?i*c:0)*Re.radii[2],e}const se={y:0,halfX:290,zFront:228,zBack:-240},je={y:40,z:gn+wn-40,halfX:96,depth:120},Xe={zTop:je.z-54,zBottom:140,halfX:74,steps:16},H={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},we={y:74,z:H.z+H.halfZ+26,halfX:96,depth:40},ft=we.y+3.5,Ge={y:-95,halfX:220,halfZ:175,ceiling:-34},ge={x:0,z:84,halfX:52,halfZ:40},de={y:52,halfZ:205,x:252,tiers:3,tierRise:46},oo=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],he={x:74,halfW:14,zFoot:H.z+H.halfZ+158,zTop:we.z+we.depth/2-6},ks=[{kind:"rampZ",x0:-74-he.halfW,x1:-74+he.halfW,z0:he.zFoot,z1:he.zTop,y0:0,y1:ft},{kind:"rampZ",x0:he.x-he.halfW,x1:he.x+he.halfW,z0:he.zFoot,z1:he.zTop,y0:0,y1:ft},{kind:"flat",x0:-96,x1:we.halfX,z0:we.z-we.depth/2-2,z1:he.zTop+10,y:ft},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:de.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:de.y-.5},{kind:"flat",x0:de.x-38,x1:de.x+38,z0:-225,z1:de.halfZ+20,y:de.y-.5}],Ua=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Ts=(()=>{const e=[],o=[],n=[],a=H.halfX+6,i=[a,a+9],l=[a+11,a+20],h=[a,a+20],c=[-212,-200],d=[-264,-252],u=[ft];for(let r=2;r<=H.storeys;r++)u.push(H.plinth+r*H.storey+1.5);e.push({kind:"flat",x0:we.halfX-6,x1:a+20,z0:-212,z1:-196,y:ft}),o.push([(we.halfX-6+a+20)/2,ft,-204,a+26-we.halfX,16]);for(let r=0;r<u.length-1;r++){const f=u[r],m=u[r+1],s=(f+m)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:f,y1:s}),n.push({x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:f,y1:s}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:d[0],z1:d[1],y:s}),o.push([(h[0]+h[1])/2,s,(d[0]+d[1])/2,h[1]-h[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:s,y1:m}),n.push({x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:s,y1:m}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:c[0],z1:c[1],y:m}),o.push([(h[0]+h[1])/2,m,(c[0]+c[1])/2,h[1]-h[0],c[1]-c[0]])}for(let r=1;r<u.length-1;r++){const m=1-Math.min(H.storeys,r+2)*H.taper,s=H.halfX*m,p=H.z+H.halfZ*m,y=u[r];e.push({kind:"flat",x0:s-4,x1:a,z0:-224,z1:-212,y}),o.push([(s-4+a)/2,y,-218,a-s+4,12]),e.push({kind:"flat",x0:-s-6,x1:s+6,z0:p,z1:-212,y}),o.push([0,y,(p-212)/2,s*2+12,-212-p])}const x=u[u.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:x}),o.push([(a+58)/2,x,-230,a-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[a,a+20],z:[d[0],c[1]]}}})();ks.push(...Ts.walks);function Wa(e,o){let n=0;for(const a of ks){if(e<a.x0||e>a.x1)continue;const i=Math.min(a.z0,a.z1),l=Math.max(a.z0,a.z1);if(!(o<i||o>l))if(a.kind==="flat")a.y>n&&(n=a.y);else{const h=Ua((o-a.z0)/(a.z1-a.z0)),c=a.y0+(a.y1-a.y0)*h;c>n&&(n=c)}}return n}const w={t:0,flash:0,flashDir:new M(0,.4,-1),fog:gt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new M(0,0,0),helmActive:!1,helmPos:new M(0,0,0),helmSpeed:0,subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new M(0,60,-200)}};function $a(){w.t=0,w.progress=0,w.flash=0,w.fog=gt.sea,w.rain=1,w.shot=0,w.underwater=0,w.depthBelow=0,w.whirlNear=0,w.subActive=!1,w.subThrottle=0}const Ro=new Map;let Es=!0;function Va(e){Es=!!e}function Ya(e){const o=un(e);return Ro.has(o)||Ro.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),Ro.get(o)}function Ne(e){const[o,n]=g.useState(!1);return g.useEffect(()=>{let a=!0;return Ya(e).then(i=>{a&&n(i&&Es)}),()=>{a=!1}},[e]),o}const lt=Yt.map(e=>new M(...e).normalize()),Rs=new M(...pn).normalize(),Xo=new M(...mn).normalize();function Xa(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const d of lt){const u=e.dot(d),x=Math.pow(Math.max(0,u),46);o-=x*.3}const a=Math.max(0,e.dot(Rs)),i=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);o-=i*.19;for(const d of lt){const u=new M(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,u),26)*.075}const l=Math.max(0,e.dot(Xo));o-=Math.pow(l,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const h=Math.pow(Math.max(0,e.dot(lt[0])),30)+Math.pow(Math.max(0,e.dot(lt[1])),30),c=1-Math.min(1,h);return o+=(Gt(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*c,o+=(Gt(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*c,o}const Ka=178*1.9,Oe=P.r/Ka;function Cn(e,o){const n=e*Oe,a=[new M(n*74,96*Oe,-20*Oe),new M(n*142,176*Oe,-58*Oe),new M(n*196,268*Oe,-76*Oe),new M(n*222,356*Oe,-52*Oe),new M(n*206,424*Oe,8*Oe),new M(n*154,462*Oe,72*Oe)],i=new M;for(const x of a)i.set(P.x+x.x,P.baseY+x.y,P.z+x.z),Yo(i,.12)&&x.set(i.x-P.x,i.y-P.baseY,i.z-P.z);const l=new Pt(a),h=o==="low"?14:o==="mid"?22:34,c=o==="low"?6:10,d=new Ot(l,h,1,c,!1),u=d.attributes.position;for(let x=0;x<=h;x++){const r=x/h,f=34*Oe*Math.pow(1-r,.72)*(1+Math.sin(r*Math.PI)*.16),m=l.getPoint(r);for(let s=0;s<=c;s++){const p=x*(c+1)+s;if(p>=u.count)continue;const y=u.getX(p)-m.x,v=u.getY(p)-m.y,b=u.getZ(p)-m.z;u.setXYZ(p,m.x+y*f,m.y+v*f,m.z+b*f)}}return u.needsUpdate=!0,d.computeVertexNormals(),d}const Za={low:4,mid:6,high:7},As="skull-island.opt.glb",_t={height:1,yaw:0,lift:.02},Ao=new la,In=new M,no=new M;function Qa(e,o,n){no.set(o[0],o[1],o[2]).normalize(),In.copy(no).multiplyScalar(P.r*4),Ao.set(In,no.clone().negate()),Ao.far=P.r*8;const a=Ao.intersectObject(e,!0)[0];return a?a.point.clone().addScaledVector(no,-n):null}function qa({shadows:e}){const{scene:o}=ys(un(As)),{object:n,eyes:a,nose:i,mouth:l}=g.useMemo(()=>{const h=o.clone(!0),c=new bs().setFromObject(h),d=new M,u=new M;c.getSize(d),c.getCenter(u);const x=P.r*P.squash[1]*1.62,r=d.y>1e-4?x*_t.height/d.y:1,f=P.r*P.squash[1]*_t.lift;h.scale.setScalar(r),h.rotation.set(0,_t.yaw,0),h.position.set(0,-u.y*r+f,0);const m=u.x*r,s=u.z*r,p=Math.cos(_t.yaw),y=Math.sin(_t.yaw);h.position.x=-(m*p+s*y),h.position.z=-(-m*y+s*p),h.updateMatrixWorld(!0);let v=0,b=0;const j={x:0,y:0,z:0},R=new M,E=[];h.traverse(I=>{I.isMesh&&E.push(I)});for(const I of E){const B=I.geometry.clone();for(const G of["position","normal"]){const L=B.attributes[G];if(!L||L.array instanceof Float32Array)continue;const Q=new Float32Array(L.count*3);for(let ae=0;ae<L.count;ae++)R.fromBufferAttribute(L,ae),Q[ae*3]=R.x,Q[ae*3+1]=R.y,Q[ae*3+2]=R.z;B.setAttribute(G,new q(Q,3))}B.applyMatrix4(I.matrixWorld);const Z=B.attributes.position;b+=Z.count;for(let G=0;G<Z.count;G++)j.x=Z.getX(G)+P.x,j.y=Z.getY(G)+P.baseY,j.z=Z.getZ(G)+P.z,Yo(j,.05)&&(Z.setXYZ(G,j.x-P.x,j.y-P.baseY,j.z-P.z),v++);v&&B.computeVertexNormals(),Z.needsUpdate=!0,B.computeBoundingSphere(),B.computeBoundingBox(),I.geometry=B,I.castShadow=e,I.receiveShadow=!1;const ne=Array.isArray(I.material)?I.material:[I.material];for(const G of ne)G.color?.multiply(Ja),G.roughness=.94,G.metalness=.02}for(const I of[h,...E])I.position.set(0,0,0),I.quaternion.identity(),I.scale.set(1,1,1),I.updateMatrix();h.updateMatrixWorld(!0);const C=(I,B=1)=>{const[Z,ne,G]=P.squash;return new M(I[0]*P.r*Z*B,I[1]*P.r*ne*B,I[2]*P.r*G*B)},A=Yt.map(I=>Qa(h,I,P.r*.1)??C(I,.82)),F=new M().addVectors(A[0],A[1]).multiplyScalar(.5),z=new M().addVectors(C(Yt[0],.82),C(Yt[1],.82)).multiplyScalar(.5),T=F.clone().sub(z),N=I=>{const B={x:I.x+P.x,y:I.y+P.baseY,z:I.z+P.z};return Yo(B,.22)&&I.set(B.x-P.x,B.y-P.baseY,B.z-P.z),I};return{object:h,eyes:A.map(N),nose:N(C(pn,.87).add(T)),mouth:N(C(mn,.9).add(T))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Fs,{eyes:a,nose:i,mouth:l,teeth:null,cast:e})]})}const Ja=new xe("#8f8a84");function Fs({eyes:e,nose:o,mouth:n,teeth:a,cast:i}){const l=g.useRef(),h=g.useRef(),c=g.useRef();return J(()=>{const d=w.t,u=.82+.18*Math.sin(d*2.3)*Math.sin(d*.71),x=.82+.18*Math.sin(d*1.9+2.1)*Math.sin(d*.63),r=.86+.14*Math.sin(d*1.4+.8);l.current&&(l.current.emissiveIntensity=5.2*u+w.flash*2),h.current&&(h.current.emissiveIntensity=5.2*x+w.flash*2),c.current&&(c.current.emissiveIntensity=3.4*r)}),t.jsxs(t.Fragment,{children:[e.map((d,u)=>t.jsxs("mesh",{position:d,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[P.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:u===0?l:h,color:k.furnace,emissive:k.ember,emissiveIntensity:5.2,toneMapped:!1,side:Te,roughness:1})]},u)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[P.r*.046,P.r*.083,3]}),t.jsx("meshStandardMaterial",{color:k.emberDeep,emissive:k.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,P.r*.05,-P.r*.16],children:[t.jsx("planeGeometry",{args:[P.r*.62,P.r*.34]}),t.jsx("meshStandardMaterial",{ref:c,color:k.ember,emissive:k.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:Te})]}),a?.map((d,u)=>t.jsxs("mesh",{position:d.pos,scale:d.scale,rotation:[0,0,d.rot],castShadow:i,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:k.emberDeep,emissiveIntensity:.42,roughness:.78})]},u))]})]})}const er=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function tr({quality:e="high",shadows:o=!0}){const a=Ne(As)&&e!=="low"&&er!=="proc",{dome:i,hornL:l,hornR:h,teeth:c}=g.useMemo(()=>{const m=new ra(P.r,Za[e]??7),s=m.attributes.position,p=new Float32Array(s.count*3),y=new xe(X.rock),v=new xe(k.rockWarm),b=new xe("#120b10"),j=new xe,R=new M;for(let F=0;F<s.count;F++){R.set(s.getX(F),s.getY(F),s.getZ(F)).normalize();const z=P.r*Xa(R),[T,N,I]=P.squash;s.setXYZ(F,R.x*z*T,R.y*z*N,R.z*z*I);const B=Math.max(Math.pow(Math.max(0,R.dot(lt[0])),5),Math.pow(Math.max(0,R.dot(lt[1])),5),Math.pow(Math.max(0,R.dot(Xo)),6)*.9);j.copy(y).lerp(v,Math.min(1,B*1.5+Math.max(0,R.z)*.22));const Z=Math.max(Math.pow(Math.max(0,R.dot(lt[0])),40),Math.pow(Math.max(0,R.dot(lt[1])),40));j.lerp(b,Z),p[F*3]=j.r,p[F*3+1]=j.g,p[F*3+2]=j.b}m.setAttribute("color",new q(p,3)),m.computeVertexNormals();const E=new ia(1,1,1),C=[],A=9;for(let F=0;F<A;F++){const z=F/(A-1)*2-1,T=le.halfWidth*2.1,N=z*T*.5,I=Math.pow(Math.abs(z),1.7)*14,B=46-Math.abs(z)*13+F%2*7;C.push({pos:[N,le.height*.5-I-B*.5,6],scale:[T/A*.76,B,52],rot:z*.13})}return E.dispose?.(),{dome:m,hornL:Cn(-1,e),hornR:Cn(1,e),teeth:C}},[e]),d=o,[u,x,r]=P.squash,f=(m,s)=>[m.x*P.r*u*s,m.y*P.r*x*s,m.z*P.r*r*s];return t.jsx("group",{position:[P.x,P.baseY,P.z],children:a?t.jsx(g.Suspense,{fallback:t.jsx(Gn,{dome:i,hornL:l,hornR:h,cast:d}),children:t.jsx(qa,{shadows:d})}):t.jsxs(t.Fragment,{children:[t.jsx(Gn,{dome:i,hornL:l,hornR:h,cast:d}),t.jsx(Fs,{eyes:lt.map(m=>f(m,.82)),nose:f(Rs,.87),mouth:f(Xo,.96),teeth:c,cast:d})]})})}function Gn({dome:e,hornL:o,hornR:n,cast:a}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:a,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function Ze({matrices:e,target:o}){const n=g.useRef(!1);return J(()=>{if(n.current||!o.current)return;const a=Math.min(e.length,o.current.count);for(let i=0;i<a;i++)o.current.setMatrixAt(i,e[i]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const zt=190,tt=130,so=9.5;function Ln(e,o,n,a=24){const i=new Pt(e),l=new Ot(i,a,1,4,!1),h=l.attributes.position,c=new M(0,1,0),d=new M,u=new M,x=new M,r=new M,f=new M;for(let m=0;m<=a;m++){const s=m/a;i.getPointAt(s,u),i.getTangentAt(s,d),r.crossVectors(d,c).normalize(),x.crossVectors(r,d).normalize();for(let p=0;p<=4;p++){const y=m*5+p;if(y>=h.count)continue;const v=p/4*Math.PI*2+Math.PI/4,b=Math.cos(v)*o*.7071,j=Math.sin(v)*n*.7071;f.copy(u).addScaledVector(r,b).addScaledVector(x,j),h.setXYZ(y,f.x,f.y,f.z)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function or(e,o,n,a=40){const i=[];for(let d=0;d<=10;d++){const u=d/10*2-1;i.push(new M(u*e,-30*(1-u*u),0))}const l=new Pt(i),h=new Ot(l,a,n,8,!1),c=h.attributes.position;for(let d=0;d<=a;d++){const u=d/a*2-1,x=1+(1-u*u)*.85,r=l.getPointAt(d/a);for(let f=0;f<=8;f++){const m=d*9+f;m>=c.count||c.setXYZ(m,r.x+(c.getX(m)-r.x)*x,r.y+(c.getY(m)-r.y)*x,r.z+(c.getZ(m)-r.z)*x)}}return c.needsUpdate=!0,h.computeVertexNormals(),h}function Pn({quality:e="high",shadows:o=!0,z:n=Mt,k:a=W}){const i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=g.useMemo(()=>{const p=zt/2,y=tt,v=Ln([new M(-p-40,y+6,0),new M(-p-22,y+15.5,0),new M(0,y+20,0),new M(p+22,y+15.5,0),new M(p+40,y+6,0)],16,9,30),b=Ln([new M(-p-30,y+2,0),new M(0,y+8,0),new M(p+30,y+2,0)],11,5,18);return{kasagi:v,shimaki:b,rope:or(p-6,30,6.4,44)}},[]),{tileM:u,merlonM:x,cannonM:r,lanternM:f}=g.useMemo(()=>{const p=new He,y=new Qe,v=new M,b=new M,j=[],R=e==="low"?26:54;for(let z=0;z<R;z++){const T=z/(R-1)*2-1,N=T*(zt/2+40),I=tt+20-Math.pow(Math.abs(T),1.9)*14+5,B=-Math.sign(T)*Math.pow(Math.abs(T),3)*.5;b.set(N,I,0),y.setFromEuler(new vt(0,0,B)),v.set(1,1,1),j.push(p.clone().compose(b,y,v))}const E=[];for(const z of[-1,1])for(let T=0;T<7;T++)b.set(z*(58+T*12),26,0),y.identity(),v.set(1,1,1),E.push(p.clone().compose(b,y,v));const C=[];for(const z of[-1,1])for(let T=0;T<2;T++)for(let N=0;N<4-T;N++)b.set(z*(64+N*13+T*6),32+T*10,8),y.setFromEuler(new vt(Math.PI/2-.16,0,0)),v.set(1,1,1),C.push(p.clone().compose(b,y,v));const A=[],F=e==="low"?10:22;for(let z=0;z<F;z++){const T=z/(F-1)*2-1,N=T*(zt/2-12),I=30*(1-T*T);b.set(N,tt-34-I-7.5,0),y.identity(),v.set(1,1,1),A.push(p.clone().compose(b,y,v))}return{tileM:j,merlonM:E,cannonM:C,lanternM:A}},[e]);J(()=>{const p=w.t;i.current&&(i.current.material.emissiveIntensity=2.6+Math.sin(p*3.1)*.22+Math.sin(p*7.7)*.1+w.flash*1.4)});const m=zt/2,s=o;return t.jsxs("group",{position:[0,0,n],scale:a,children:[[-1,1].map(p=>t.jsxs("group",{position:[p*m,0,0],children:[t.jsxs("mesh",{position:[0,tt/2-30,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[so*.86,so,tt+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[so*1.5,so*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},p)),t.jsxs("mesh",{position:[0,tt-26,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[zt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:d.shimaki,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:d.kasagi,castShadow:s,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:l,args:[null,null,u.length],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(Ze,{matrices:u,target:l})]}),t.jsxs("mesh",{position:[0,tt-6,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,tt-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:d.rope,position:[0,tt-34,2],castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(p=>{const y=30*(1-(p/(zt/2-6))**2);return t.jsx("group",{position:[p,tt-34-y-4,2],children:[0,1,2].map(v=>t.jsxs("mesh",{position:[v%2?1.1:-1.1,-2.4-v*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:Te})]},v))},p)}),[-1,1].map(p=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[p*108,6,0],castShadow:s,receiveShadow:s,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[p*108,30,6],castShadow:s,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.88})]}),t.jsxs("mesh",{position:[p*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},p)),t.jsxs("instancedMesh",{ref:c,args:[null,null,x.length],castShadow:s,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(Ze,{matrices:x,target:c})]}),t.jsxs("instancedMesh",{ref:h,args:[null,null,r.length],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(Ze,{matrices:r,target:h})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,f.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Ze,{matrices:f,target:i})]})]})}const nr=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let l=0;l<4;l++){const h=n.createLinearGradient(0,0,e/2,0);h.addColorStop(0,"rgba(255,255,255,0.95)"),h.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=h,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const i=new eo(o);return i.colorSpace=to,i})();function sr(e,o,n,a){const i=[];for(let l=0;l<=a;l++){const h=l/a,c=h*2-1;i.push(new M(e[0]+(o[0]-e[0])*h,e[1]+(o[1]-e[1])*h-n*(1-c*c),e[2]+(o[2]-e[2])*h))}return i}const ar=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function rr({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{lanternM:h,lampM:c,pilingM:d,katanaY:u,ground:x}=g.useMemo(()=>{const m=new He,s=new Qe,p=new M(1,1,1),y=new M,v=[],b=e==="low"?.42:e==="mid"?.72:1;for(const[C,A,F]of ar){const z=Math.max(4,Math.round(F*b)),T=sr(C,A,14,z);for(let N=1;N<T.length-1;N++){const I=.78+N*37%11/22;y.copy(T[N]).add(new M(0,-4.2*I,0)),s.setFromEuler(new vt(0,N*1.7%Math.PI,(N%3-1)*.06)),v.push(m.clone().compose(y,s,p.clone().multiplyScalar(I)))}}const j=[],R=e==="low"?6:11;for(let C=0;C<R;C++){const A=C/(R-1);for(const F of[-1,1]){const z=S.lerp(K.x+46,le.x-6,A)+F*(26-A*9),T=S.lerp(K.z-26,le.z+32,A);y.set(z,re(z,T)+5,T),s.identity(),j.push(m.clone().compose(y,s,p))}}const E=[];for(let C=0;C<16;C++){const A=C%2,F=Math.floor(C/2);y.set(K.x+30+F*17,-2,K.z+34+A*26),s.setFromEuler(new vt(0,0,(C%3-1)*.035)),E.push(m.clone().compose(y,s,p))}return{lanternM:v,lampM:j,pilingM:E,katanaY:re(K.x+118,K.z-58),ground:K.y}},[e]);J(()=>{const m=w.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(m*2.7)*.2+Math.sin(m*6.1+1.3)*.12+w.flash*1.6),l.current){const s=46*(1+Math.sin(m*1.3)*.13);l.current.scale.set(s,s,1),l.current.material.rotation=m*.07}});const r=o,f=(m,s)=>re(K.x+m,K.z+s);return t.jsxs("group",{children:[t.jsxs("group",{position:[K.x,0,K.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(m=>t.jsxs("group",{position:[52+m*26,1.5,92+m%2*13],rotation:[0,.4+m*.3,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:Te})]})]},m))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(Ze,{matrices:d,target:i})]}),t.jsxs("group",{position:[K.x+118,u,K.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:r,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:l,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:nr,color:k.furnace,transparent:!0,opacity:.75,blending:st,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(m=>{const s=96+m*4,p=88*m;return t.jsxs("group",{position:[K.x+s,f(s,p),K.z+p],rotation:[0,-m*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:r,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:r,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(y=>t.jsxs("mesh",{position:[y*3,37,4],rotation:[0,0,y*.3],castShadow:r,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},y)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.9,side:Te})]})]},m)}),[-1,1].map(m=>{const s=40+m*34,p=-18+m*46;return t.jsxs("group",{position:[K.x+s,f(s,p)+12,K.z+p],rotation:[0,m*.8,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(y=>t.jsxs("mesh",{position:[y*5,7,-1],rotation:[0,0,y*-.5],castShadow:r,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},y)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:k.ember,emissive:k.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:Te})]})]},m)}),t.jsxs("group",{position:[K.x-34,f(-34,30)+2,K.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.88,side:Te,emissive:k.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(m,s)=>{const p=s/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(p)*26,55.5,Math.sin(p)*26],rotation:[0,-p,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},s)}),Array.from({length:10},(m,s)=>{const p=s/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(p)*32,44,Math.sin(p)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.5,toneMapped:!1})]},s)})]}),[0,1,2,3].map(m=>{const s=8+m*30,p=-70-m%2*14;return t.jsxs("group",{position:[K.x+s,f(s,p),K.z+p],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:m%2?"#e8dcc4":k.vermilion,roughness:.95,side:Te})]})]},m)}),[0,1,2].map(m=>{const s=.28+m*.24,p=S.lerp(K.x+46,le.x,s),y=S.lerp(K.z-26,le.z+26,s),v=re(p,y),b=1-m*.1;return t.jsxs("group",{position:[p,v,y],scale:b,children:[[-1,1].map(j=>t.jsxs("mesh",{position:[j*15,17,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.7})]},j)),t.jsxs("mesh",{position:[0,36,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.75})]})]},m)}),t.jsx("group",{position:[K.x,x,K.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,h.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(Ze,{matrices:h,target:n})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:r,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:k.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(Ze,{matrices:c,target:a})]})]})}const On={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function ir(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function lr({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{pineTrunkM:h,pineCanopyM:c,sakuraM:d,rockM:u}=g.useMemo(()=>{const r=On[e]??On.high,f=ir(20250801),m=new He,s=new Qe,p=new M,y=new M,v=new M(0,1,0),b=new M,j=[],R=[],E=[],C=r.pine+r.sakura+r.rock;let A=0,F=0;for(;A<C&&F<C*60;){F++;const z=f()*Math.PI*2,T=ht*(.55+f()*.62),N=ie.x+Math.sin(z)*T,I=ie.z+Math.cos(z)*T,B=re(N,I);if(B<5||B>300||ja(N,I,6)>.72||Math.hypot(N-P.x,I-P.z)<P.r*1.35)continue;const Z=N>ie.x+(f()-.5)*90,ne=A;if(A++,y.set(N,B,I),ne<r.rock){const G=xn(N,I,5);b.set(G[0],G[1],G[2]),s.setFromUnitVectors(v,b),s.multiply(new Qe().setFromEuler(new vt(f()*.5,f()*6.28,f()*.5)));const L=2.5+f()*7;p.set(L*(.7+f()*.6),L*(.5+f()*.5),L*(.7+f()*.6)),y.y-=L*.25,E.push(m.clone().compose(y,s,p))}else if(Z){if(j.length>=r.pine)continue;s.setFromEuler(new vt(0,f()*6.28,(f()-.5)*.09));const G=.72+f()*.7;p.set(G,G*(.85+f()*.45),G),j.push(m.clone().compose(y,s,p))}else{if(R.length>=r.sakura)continue;s.setFromEuler(new vt(0,f()*6.28,(f()-.5)*.13));const G=.7+f()*.75;p.set(G,G*(.8+f()*.5),G),R.push(m.clone().compose(y,s,p))}}return{pineTrunkM:j.map(z=>z.clone().multiply(cr)).concat(R.map(z=>z.clone().multiply(ur))),pineCanopyM:j.map(z=>z.clone().multiply(hr)),sakuraM:R.map(z=>z.clone().multiply(dr)),rockM:E}},[e]),x=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,h.length],castShadow:x,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(Ze,{matrices:h,target:n})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:x,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(Ze,{matrices:c,target:a})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:x,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:k.sakura,roughness:.95,flatShading:!0,emissive:k.sakura,emissiveIntensity:.1}),t.jsx(Ze,{matrices:d,target:i})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,u.length],castShadow:x,receiveShadow:x,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(Ze,{matrices:u,target:l})]})]})}const cr=new He().makeTranslation(0,7,0),hr=new He().makeTranslation(0,26,0),dr=new He().compose(new M(0,13,0),new Qe,new M(1,.72,1)),ur=new He().compose(new M(0,5,0),new Qe,new M(.75,.62,.75));function pr({url:e,height:o,rotation:n,tint:a,emissive:i,emissiveIntensity:l}){const{scene:h}=ys(e),c=g.useMemo(()=>h.clone(!0),[h]),d=g.useMemo(()=>{const u=new bs().setFromObject(c),x=new M;u.getSize(x);const r=x.y>1e-4?o/x.y:1,f=new M;return u.getCenter(f),{scale:r,offset:[-f.x*r,-u.min.y*r,-f.z*r]}},[c,o]);return g.useEffect(()=>{c.traverse(u=>{if(u.isMesh&&(u.castShadow=!0,u.receiveShadow=!0,a&&u.material)){const x=Array.isArray(u.material)?u.material:[u.material];for(const r of x)r.color?.multiply(new xe(a)),i&&r.emissive&&(r.emissive.set(i),r.emissiveIntensity=l??.2)}})},[c,a,i,l]),t.jsx("group",{rotation:[0,n,0],scale:d.scale,position:d.offset,children:t.jsx("primitive",{object:c})})}class mr extends g.Component{constructor(){super(...arguments);Tn(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ue({name:e,height:o,rotation:n=0,position:a=[0,0,0],tint:i=null,emissive:l=null,emissiveIntensity:h=.2,fallback:c=null}){const d=un(e);return Ne(e)?t.jsx("group",{position:a,children:t.jsx(mr,{url:d,fallback:c,children:t.jsx(g.Suspense,{fallback:c,children:t.jsx(pr,{url:d,height:o,rotation:n,tint:i,emissive:l,emissiveIntensity:h})})})}):t.jsx("group",{position:a,children:c})}const it=Math.PI,Dn={"ship-sunny.opt.glb":it/2,"ship-tang.opt.glb":it/2,"ship-punk.opt.glb":it/2,"ship-lion.opt.glb":it/2,"ship-bone.opt.glb":it/2,"ship-junk.opt.glb":it/2,"ship-warjunk.opt.glb":it/2,"ship-sub.opt.glb":-it/2},Eo=e=>e&&Dn[e]!==void 0?Dn[e]:it/2,Nn={"ship-sunny.opt.glb":78,"ship-punk.opt.glb":84,"ship-tang.opt.glb":32,"ship-lion.opt.glb":76,"ship-bone.opt.glb":82,"ship-junk.opt.glb":56,"ship-warjunk.opt.glb":88},qt=(e,o)=>e&&Nn[e]!==void 0?Nn[e]:o,wo=160,At=112,Xt="#e6dfcf",Cs="#0c0a15",Ft=Cs;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,a,i){const l=Math.min(i??0,Math.abs(n)/2,Math.abs(a)/2);return this.moveTo(e+l,o),this.arcTo(e+n,o,e+n,o+a,l),this.arcTo(e+n,o+a,e,o+a,l),this.arcTo(e,o+a,e,o,l),this.arcTo(e,o,e+n,o,l),this.closePath(),this});function kt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=wo,o.height=At;const n=o.getContext("2d"),a=n.createLinearGradient(0,0,0,At);a.addColorStop(0,"#14101f"),a.addColorStop(.5,Cs),a.addColorStop(1,"#08060f"),n.fillStyle=a,n.fillRect(0,0,wo,At),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,At),n.save(),n.translate(wo/2+4,At/2);try{e(n)}catch(l){console.warn("[onigashima] flag emblem skipped",l)}n.restore();const i=new eo(o);return i.colorSpace=to,i.anisotropy=4,i}function Fo(e,o,n=Xt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Co(e,o,n=1){e.save(),e.fillStyle=Ft,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Hn(e,o,n=4){e.save(),e.fillStyle=Ft;for(let a=1;a<n;a++){const i=-o*.5+a*o/n;e.fillRect(i-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function _n(e,o,n=Xt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const i of[-1,1])for(const l of[-.16,.16])e.beginPath(),e.arc(i*o*1.55,o*.55+l*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const fr={straw:kt(e=>{_n(e,26),Fo(e,26),Co(e,26),Hn(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:kt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Ft;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Ft,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:kt(e=>{_n(e,26,"#d8cfc0"),e.fillStyle=Xt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Ft;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const a=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:kt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const a=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:kt(e=>{e.fillStyle=Xt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();Fo(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Co(e,25,.85),e.save(),e.fillStyle=Ft,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Xt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:kt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();Fo(e,26,"#cfd8e4"),Co(e,26),Hn(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Is={value:0},Bn=new Map;function xr(e){const o=Bn.get(e);if(o)return o;const n=fr[e],a=new ca({map:n,emissiveMap:n,emissive:new xe("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:Te,transparent:!1});return a.onBeforeCompile=i=>{i.uniforms.uTime=Is,i.vertexShader=`uniform float uTime;
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
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Bn.set(e,a),a}function gr(){return J((e,o)=>{Is.value+=Math.min(o,.05)}),null}const wr=(()=>{const e=new hn(1,1,14,5);return e.translate(.5,0,0),e})();function Jt({crew:e="straw",width:o=16,position:n=[0,0,0],rotation:a=Math.PI/2,staff:i=!0}){const l=g.useMemo(()=>xr(e)??null,[e]),h=o*(At/wo);return l?t.jsxs("group",{position:n,rotation:[0,a,0],children:[i&&t.jsxs("mesh",{position:[0,h*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,h*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:wr,material:l,scale:[o,h,o]})]}):null}const Un=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),i=a.createImageData(e,o);for(let h=0;h<o;h++){const c=h/(o-1),d=Math.pow(1-c,1.7);for(let u=0;u<e;u++){const x=u/(e-1)*2-1,r=Math.max(0,1-Math.abs(x)/(.35+c*.65)),f=.45+.55*Math.pow(Math.abs(x)/(.35+c*.65),1.5),m=d*Math.pow(r,1.4)*f,s=(h*e+u)*4;i.data[s]=255,i.data[s+1]=255,i.data[s+2]=255,i.data[s+3]=Math.round(Math.min(1,m)*255)}}a.putImageData(i,0,0);const l=new eo(n);return l.colorSpace=to,l})(),Io=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:k.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:k.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",height2:58,model:"ship-lion.opt.glb",height:56,tint:"#c98a52",crew:"crew-straw.opt.glb",crewH:13},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",height2:62,model:"ship-bone.opt.glb",height:60,tint:"#9a6a4e",crew:"crew-punk.opt.glb",crewH:12},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",height2:24,model:"ship-sub.opt.glb",height:21,tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:k.lantern,model:"ship-junk.opt.glb",height:44,tint:"#8a7a62",crew:"crew-samurai.opt.glb",crewH:11},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:k.lantern,model:"ship-junk.opt.glb",height:40,tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:k.lantern,model:"ship-junk.opt.glb",height:46,tint:"#6e6a54",crew:"crew-samurai.opt.glb",crewH:11},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:k.lantern,model:"ship-junk.opt.glb",height:38,tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:k.lantern,model:"ship-junk.opt.glb",height:36,tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:k.lantern,model:"ship-junk.opt.glb",height:40,tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:k.lantern,model:"ship-junk.opt.glb",height:42,tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:k.lantern,model:"ship-junk.opt.glb",height:37,tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:k.lantern,model:"ship-junk.opt.glb",height:35,tint:"#6a5c47"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:k.lantern,model:"ship-junk.opt.glb",height:41,tint:"#6c684f"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:k.lantern,model:"ship-junk.opt.glb",height:38,tint:"#77694f"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:k.lantern,model:"ship-junk.opt.glb",height:36,tint:"#6d5f4a"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:k.lantern,model:"ship-junk.opt.glb",height:34,tint:"#665945"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:k.lantern,model:"ship-junk.opt.glb",height:39,tint:"#666249"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:k.lantern,model:"ship-junk.opt.glb",height:35,tint:"#71634c"}];function yr(e){const o=S.lerp(820*W,150*W,e);return[(Math.sin(e*2.4)*54-e*26)*W,o]}function br({spec:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=g.useRef();J(()=>{const f=n.current;if(!f)return;const m=S.clamp(w.progress*.82+.04,0,1),[s,p]=yr(m),y=s+e.off*W*.94,v=p-e.lead*W*.98,b=Qt(y,v),j=S.clamp(-re(y,v)/46,0,1),R=S.lerp(1,.055,b)*S.smoothstep(j,0,.28),E=Ke(y,v,w.t,R),C=e.sub?S.smoothstep(w.progress,.42,.6):0;f.position.set(y,E.y-(e.sub?4.5:1.2)*e.scale-C*40,v);const A=e.sub?.35:1;f.rotation.x=S.clamp(E.dz*1.35*A,-.32,.32),f.rotation.z=S.clamp(-E.dx*1.15*A,-.28,.28),f.rotation.y=Math.PI+Math.sin(w.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(w.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(w.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-b)*.75)*(1-C))});const l=e.scale,h=o==="low"?6:10,c=Ne(e.model2??""),d=Ne(e.model??""),u=c?e.model2:d?e.model:null,x=qt(u,c?e.height2:e.height),r=Ne(e.crew??"");return u?t.jsxs("group",{ref:n,children:[t.jsx(ue,{name:u,height:x,rotation:Eo(u),position:[0,-x*.18,0],tint:c?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),r&&t.jsx(ue,{name:e.crew,height:e.crewH,rotation:0,position:[0,x*.2,2*l]}),e.flag&&t.jsx(Jt,{crew:e.flag,width:x*(e.sub?.5:.32),position:[0,x*(e.sub?.55:.66),-4*l],staff:!!e.sub}),t.jsxs("mesh",{position:[0,x*.5,-8*l],children:[t.jsx("sphereGeometry",{args:[1.6,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:Un,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:l,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,h]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:Te,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(f=>[0,1,2,3].map(m=>t.jsxs("mesh",{position:[f*5.6,3.4,-6+m*4],rotation:[0,0,f*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${f}-${m}`))),e.flag&&t.jsx(Jt,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:Un,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Wn({x:e,z:o,yaw:n,name:a,height:i,tint:l,sunk:h=.18,flag:c=null}){const d=qt(a,i),u=g.useRef(),x=Ne(a);return J(()=>{const r=u.current;if(!r)return;const f=Qt(e,o),m=S.clamp(-re(e,o)/46,0,1),s=S.lerp(1,.055,f)*S.smoothstep(m,0,.28),p=Ke(e,o,w.t,s);r.position.set(e,p.y-1.5,o),r.rotation.set(S.clamp(p.dz*1.1,-.25,.25),n+Math.sin(w.t*.22+e)*.04,S.clamp(-p.dx,-.22,.22))}),t.jsxs("group",{ref:u,children:[t.jsx(ue,{name:a,height:d,rotation:Eo(a),position:[0,-d*h,0],tint:l,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),c&&x&&t.jsx(Jt,{crew:c,width:d*.3,position:[0,d*.62,-4]})]})}const vr=[{x:-190*W,z:320*W,yaw:.35},{x:168*W,z:438*W,yaw:-.55},{x:-88*W,z:540*W,yaw:.12},{x:236*W,z:690*W,yaw:-.28},{x:-262*W,z:748*W,yaw:.48},{x:96*W,z:880*W,yaw:-.16}],Mr=[{x:K.x+132*W*.72,z:K.z+96*W*.72,yaw:2.3},{x:K.x+168*W*.72,z:K.z+40*W*.72,yaw:1.9},{x:K.x+96*W*.72,z:K.z+150*W*.72,yaw:2.7}];function jr({quality:e="high"}){const o=g.useMemo(()=>e==="low"?Io.slice(0,5):e==="mid"?Io.slice(0,11):Io,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(gr,{}),o.map(n=>t.jsx(br,{spec:n,quality:e},n.id)),e!=="low"&&vr.map((n,a)=>t.jsx(Wn,{...n,name:"ship-warjunk.opt.glb",height:64,tint:"#8a8560",flag:"beasts"},`picket-${a}`)),e!=="low"&&Mr.map((n,a)=>t.jsx(Wn,{...n,name:"ship-junk.opt.glb",height:40,tint:"#7e7058",flag:"kozuki"},`moored-${a}`))]})}const Sr="#2e2a33",Ko="#3a4152",Zo=X.snow,jo="#cfe0f4";function $n({position:e}){return t.jsx("group",{position:e,children:t.jsx(ue,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Ko,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Ko,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:jo,emissive:jo,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Zo,roughness:.9})]})]})})})}function zr({shadows:e=!0}){const o=g.useMemo(()=>Math.atan2(V.dir[0],V.dir[1]),[]);return t.jsxs("group",{position:[V.gate.x,V.benchY,V.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Ko,roughness:.92})]},n)),t.jsx(ue,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:Sr,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Zo,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Zo,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:Te})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:jo,emissive:jo,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx($n,{position:[-14,0,10]}),t.jsx($n,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const ao=new xe,Qo={color:"#7fd8c8",intensity:9e3,distance:320},Go={color:"#ffc48a",intensity:12e3,distance:300},kr=new xe(Qo.color),Tr={low:1,mid:2,high:4},Tt=[{pos:[K.x,40,K.z],color:k.lantern,intensity:16e3,distance:460*W*.65},{pos:[0,78,Mt],color:k.lantern,intensity:15e3,distance:430},{pos:[le.x,le.y+6,le.z-30],color:k.emberDeep,intensity:3e4,distance:640},{pos:[V.gate.x,30,V.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function Er({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const a=g.useRef(),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=g.useRef(),u=Se(r=>r.camera),x=Tr[e]??5;return J(()=>{if(a.current){a.current.intensity=w.flash*9e3;const m=w.flashDir;a.current.position.set(m.x*700,260+m.y*500,ie.z+m.z*700)}const r=w.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(r*2.3)*Math.sin(r*.71))),l.current&&(l.current.intensity=62e3*(.86+.14*Math.sin(r*1.9+2.1)*Math.sin(r*.63)));const f=w.inside;if(c.current&&(c.current.intensity=.16+f*.3),d.current&&(d.current.intensity=.34+f*.26),h.current){const m=h.current,s=.06;let p=Tt[0],y=1/0;for(const v of Tt){const b=(u.position.x-v.pos[0])**2+(u.position.z-v.pos[2])**2;b<y&&(y=b,p=v)}if(w.subActive&&y>550*550){const v=w.subPos,b=Math.min(1,w.underwater/.35);m.position.x+=(v.x-m.position.x)*.3,m.position.y+=(v.y+14-m.position.y)*.3,m.position.z+=(v.z-m.position.z)*.3,ao.set(Go.color).lerp(kr,b),m.color.lerp(ao,s),m.intensity+=(S.lerp(Go.intensity,Qo.intensity,b)-m.intensity)*s,m.distance=S.lerp(Go.distance,Qo.distance,b)}else if(w.helmActive&&y>550*550){const v=w.helmPos;m.position.x+=(v.x-m.position.x)*.25,m.position.y+=(v.y+16-m.position.y)*.25,m.position.z+=(v.z-m.position.z)*.25,m.color.lerp(ao.set(k.lantern),s),m.intensity+=(11e3-m.intensity)*s,m.distance=300}else m.position.x+=(p.pos[0]-m.position.x)*s,m.position.y+=(p.pos[1]-m.position.y)*s,m.position.z+=(p.pos[2]-m.position.z)*s,m.color.lerp(ao.set(p.color),s),m.intensity+=(p.intensity-m.intensity)*s,m.distance=p.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:c,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(W/1.55),"shadow-camera-right":520*(W/1.55),"shadow-camera-top":520*(W/1.55),"shadow-camera-bottom":-520*(W/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:x>=2?[be[0].x,be[0].y,be[0].z]:[(be[0].x+be[1].x)/2,be[0].y,be[0].z],color:k.ember,intensity:62e3,distance:1250,decay:2}),x>=2&&t.jsx("pointLight",{ref:l,position:[be[1].x,be[1].y,be[1].z],color:k.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:h,position:Tt[0].pos,color:Tt[0].color,intensity:Tt[0].intensity,distance:Tt[0].distance,decay:2}),x>=3&&t.jsx("pointLight",{position:[le.x,le.y+4,le.z-34],color:k.emberDeep,intensity:3e4,distance:640,decay:2}),x>=4&&t.jsx("pointLight",{position:[0,78,Mt],color:k.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function Lo(e,o){let n=e>>>0;const a=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=[],l=o==="low"?3:5,h=(s,p,y,v,b)=>{const j=[s.clone()],R=s.clone();for(let C=0;C<v;C++)R.add(new M((a()-.5)*y*.55,-y/v,(a()-.5)*y*.42)).add(p.clone().multiplyScalar(y/v*.3)),j.push(R.clone());const E=new Ot(new Pt(j),v*2,b,l,!1);return i.push(E),j},c=h(new M(0,620,0),new M(0,0,0),620,9,3.4),d=o==="low"?1:3;for(let s=0;s<d;s++){const p=c[2+Math.floor(a()*(c.length-3))];h(p.clone(),new M(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let u=0;for(const s of i)u+=s.attributes.position.count;const x=new Float32Array(u*3),r=new Float32Array(u*3);let f=0;for(const s of i)x.set(s.attributes.position.array,f*3),r.set(s.attributes.normal.array,f*3),f+=s.attributes.position.count,s.dispose();const m=new wt;return m.setAttribute("position",new q(x,3)),m.setAttribute("normal",new q(r,3)),m}function Rr({quality:e}){const o=[g.useRef(),g.useRef(),g.useRef()],n=g.useRef(2.5),a=g.useRef({i:0,t:-1,dur:0,flicker:0}),i=g.useMemo(()=>[Lo(40503,e),Lo(20973,e),Lo(10196,e)],[e]);return J((l,h)=>{const c=Math.min(h,.05),d=a.current;if(n.current-=c,n.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const u=o[d.i].current;if(u){const x=(Math.random()-.5)*2.4-Math.PI*.5,r=620+Math.random()*760;u.position.set(ie.x+Math.cos(x)*r,40+Math.random()*120,ie.z+Math.sin(x)*r*.7-240),u.rotation.y=Math.random()*Math.PI*2;const f=.7+Math.random()*.8;u.scale.set(f,f,f),w.flashDir.set(u.position.x,u.position.y+400,u.position.z).normalize()}n.current=S.lerp(6.5,2.2,w.progress)*(.45+Math.random())}if(d.t>=0){d.t+=c;const u=d.t/d.dur,x=Math.abs(Math.sin(u*Math.PI*d.flicker)),r=Math.max(0,1-u);w.flash=r*r*x;const f=o[d.i].current;f&&(f.material.opacity=Math.min(1,w.flash*2.2)),u>=1&&(d.t=-1,w.flash=0,f&&(f.material.opacity=0))}else w.flash*=Math.pow(1e-4,c)}),t.jsx(t.Fragment,{children:i.map((l,h)=>t.jsx("mesh",{ref:o[h],geometry:l,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:st,depthWrite:!1,toneMapped:!1})},h))})}const Ar=`
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
`,Fr=`
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
`,Vn={low:1600,mid:3800,high:7e3},ro=460;function Cr({quality:e}){const o=g.useRef(),n=Se(l=>l.camera),a=g.useMemo(()=>{const l=Vn[e]??Vn.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l);for(let x=0;x<l;x++)h[x*3]=Math.random()*ro,h[x*3+1]=Math.random()*ro,h[x*3+2]=Math.random()*ro,c[x]=.7+Math.random()*.6,d[x]=.55+Math.random()*.85;const u=new wt;return u.setAttribute("position",new q(h,3)),u.setAttribute("aSpeed",new q(c,1)),u.setAttribute("aLen",new q(d,1)),u.boundingSphere=new Dt(new M,1e6),u},[e]),i=g.useMemo(()=>({uTime:{value:0},uCam:{value:new M},uBox:{value:ro},uFall:{value:118},uSize:{value:2.4},uColor:{value:new M(...oe("#b9c8e4"))},uOpacity:{value:.5}}),[]);return J((l,h)=>{const c=o.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(n.position),c.uOpacity.value=.5*w.rain*w.rain+w.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Ar,fragmentShader:Fr,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const Ir=`
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
`,Gr=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Yn={low:120,mid:340,high:700};function Lr({quality:e}){const o=g.useRef(),n=g.useMemo(()=>{const i=Yn[e]??Yn.high,l=[be[0],be[1],le,le],h=new Float32Array(i*3),c=new Float32Array(i),d=new Float32Array(i),u=new Float32Array(i);for(let r=0;r<i;r++){const f=l[r%l.length];h[r*3]=f.x+(Math.random()-.5)*74,h[r*3+1]=f.y+(Math.random()-.5)*30,h[r*3+2]=f.z+(Math.random()-.5)*26,c[r]=Math.random(),d[r]=.045+Math.random()*.055,u[r]=2+Math.random()*4}const x=new wt;return x.setAttribute("position",new q(h,3)),x.setAttribute("aPhase",new q(c,1)),x.setAttribute("aRise",new q(d,1)),x.setAttribute("aSize",new q(u,1)),x.boundingSphere=new Dt(new M(0,300,-260),700),x},[e]),a=g.useMemo(()=>({uTime:{value:0},uColor:{value:new M(...oe(k.ember))}}),[]);return J((i,l)=>{o.current&&(o.current.uniforms.uTime.value+=l)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Ir,fragmentShader:Gr,uniforms:a,transparent:!0,depthWrite:!1,blending:st,fog:!1})})}function Pr({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Rr,{quality:e}),t.jsx(Cr,{quality:e}),t.jsx(Lr,{quality:e})]})}const Or=`
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
`,Dr=`
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
`,Xn={low:150,mid:380,high:620};function Nr({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const h=Xn[o]??Xn.high,c=new Float32Array(h*3),d=new Float32Array(h),u=new Float32Array(h),x=new Float32Array(h),r=new Float32Array(h),f=new Float32Array(h);for(let s=0;s<h;s++)d[s]=Math.random()*Math.PI*2,u[s]=Math.random(),x[s]=.05+Math.random()*.05,r[s]=3+Math.random()*6,f[s]=Math.random();const m=new wt;return m.setAttribute("position",new q(c,3)),m.setAttribute("aAngle",new q(d,1)),m.setAttribute("aPhase",new q(u,1)),m.setAttribute("aRate",new q(x,1)),m.setAttribute("aSize",new q(r,1)),m.setAttribute("aJitter",new q(f,1)),m.boundingSphere=new Dt(new M(e.x,0,e.z),e.r*1.6+40),m},[o,e]),l=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new dn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new M(...oe(X.foam))},uGain:{value:1}}),[e]);return J((h,c)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=c;const u=Math.hypot(h.camera.position.x-e.x,h.camera.position.z-e.z);d.uGain.value=1-S.smoothstep(u,1600,2400),a.current&&(a.current.visible=d.uGain.value>.02)}),t.jsx("points",{ref:a,geometry:i,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Or,fragmentShader:Dr,uniforms:l,transparent:!0,depthWrite:!1,blending:st,fog:!1})})}function Hr({quality:e="high"}){const o=Se(n=>n.camera);return J(()=>{let n=0;for(const a of Ae){const i=Math.hypot(o.position.x-a.x,o.position.z-a.z);n=Math.max(n,1-S.smoothstep(i,a.r*.3,a.r*2.2))}w.whirlNear+=(n-w.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ae.map((n,a)=>t.jsx(Nr,{whirl:n,quality:e},a))})}const U={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},Lt={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<Zt-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*W},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Mt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*W},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=wa("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<V.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},_r=e=>Lt[e]?Lt[e].length:0,Br=()=>U.chain&&Lt[U.chain]?Lt[U.chain][U.step]??null:null;function qo(e){U.chain=Lt[e]?e:null,U.step=0,U.hull=1,U.grip=0,U.clock=0,U.done=!1,U.banner=null,U.rev++}function So(e,o,n=3.4){U.banner={text:e,sub:o,until:U.clock+n},U.rev++}function Ct(e,o){U.hull<=0||(U.hull=Math.max(0,U.hull-e),U.hits++,U.hull<=0?So("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&So(o,null,2.2),U.rev++)}function Gs(e,o){if(U.clock+=e,U.banner&&U.clock>U.banner.until&&(U.banner=null,U.rev++),!U.chain||U.done||!o)return;const n=Lt[U.chain],a=n[U.step];if(!a)return;let i=!1;try{i=!!a.test(o)}catch{i=!1}i&&(U.step++,U.step>=n.length?(U.done=!0,So("OBJECTIVE COMPLETE",Ur[U.chain]??"",6)):So(n[U.step].text,n[U.step].hint,3.6),U.rev++)}const Ur={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Ls(e,{danger:o,headingX:n,headingZ:a,toCentreX:i,toCentreZ:l,speed:h,throttle:c}){if(o<=.001)return U.grip=Math.max(0,U.grip-e*.5),U.grip;const d=Math.hypot(i,l)||1,u=-i/d,x=-l/d,r=n*u+a*x,f=Math.min(1,Math.abs(h)/22),m=o*.42,s=Math.max(0,r)*f*(.35+.45*Math.min(1,Math.abs(c)));return U.grip=Math.max(0,Math.min(1,U.grip+(m-s)*e)),U.grip}const Kn=24,Po=bo.safe,Zn=bo.range,Bt=2.1,Wr=1.5,Qn=34,$r=[Mt,Zt],Vr=new He,Oo=new M,qn=new Qe,Do=new M;function Yr({quality:e="high"}){const o=g.useRef(),n=g.useMemo(()=>Array.from({length:Kn},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),a=g.useRef(0),i=g.useMemo(()=>{const l=new vs(.55,1,1,e==="low"?6:10,1,!0);return l.translate(0,.5,0),l},[e]);return J((l,h)=>{const c=o.current;if(!c)return;const d=Math.min(h,.05),u=w.helm;if(w.helmActive&&u&&!u.onFoot&&!u.sub&&!u.moored){let f=null,m=1/0;for(const s of $r){const p=Math.hypot(u.x,u.z-s);p<Po||p>Zn||p<m&&(m=p,f=s)}if(f!==null&&(a.current-=d,a.current<=0)){const s=1-S.clamp((m-Po)/(Zn-Po),0,1);a.current=S.lerp(4.5,1.9,s);const p=n.find(y=>!y.live);if(p){const y=Bt*.55,v=S.lerp(230,105,s);p.x=u.x+Math.sin(u.heading)*u.speed*y+(Math.random()-.5)*v,p.z=u.z+Math.cos(u.heading)*u.speed*y+(Math.random()-.5)*v,p.y0=210+Math.random()*60,p.t=0,p.live=!0}}}let r=0;for(const f of n){if(!f.live)continue;const m=f.t;if(f.t+=d,f.t<Bt){const s=f.t/Bt;Oo.set(f.x,f.y0*(1-s*s),f.z),Do.set(2.2,9,2.2)}else{if(m<Bt){const y=Math.hypot(f.x-u.x,f.z-u.z);y<Qn&&Ct(.03*(1-y/Qn)+.008,"HIT — SHOT THROUGH THE RIGGING"),w.splash+=1}const s=(f.t-Bt)/Wr;if(s>=1){f.live=!1;continue}const p=Math.min(1,s*4);Oo.set(f.x,Ke(f.x,f.z,w.t,1).y-4,f.z),Do.set(11+s*9,78*p*(1-s*s*.75),11+s*9)}qn.identity(),c.setMatrixAt(r,Vr.compose(Oo,qn,Do)),r++}c.count=r,c.instanceMatrix.needsUpdate=!0,c.visible=r>0}),t.jsx("instancedMesh",{ref:o,args:[i,void 0,Kn],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:st,side:Te})})}const Xr=`
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
`,Kr=`
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
`,Jn={low:700,mid:1800,high:3200},io=260;function Zr({quality:e}){const o=g.useRef(),n=g.useRef(),a=Se(h=>h.camera),i=g.useMemo(()=>{const h=Jn[e]??Jn.high,c=new Float32Array(h*3),d=new Float32Array(h),u=new Float32Array(h),x=new Float32Array(h);for(let f=0;f<h;f++)c[f*3]=Math.random()*io,c[f*3+1]=Math.random()*io,c[f*3+2]=Math.random()*io,d[f]=.5+Math.random()*1.4,u[f]=1.2+Math.random()*3.2,x[f]=Math.random();const r=new wt;return r.setAttribute("position",new q(c,3)),r.setAttribute("aSpeed",new q(d,1)),r.setAttribute("aSize",new q(u,1)),r.setAttribute("aPhase",new q(x,1)),r.boundingSphere=new Dt(new M,1e6),r},[e]),l=g.useMemo(()=>({uTime:{value:0},uCam:{value:new M},uBox:{value:io},uColor:{value:new M(...oe("#cfeee6"))},uGain:{value:0}}),[]);return J((h,c)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=c,d.uCam.value.copy(a.position),d.uGain.value=w.underwater,n.current&&(n.current.visible=w.underwater>.02))}),t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Xr,fragmentShader:Kr,uniforms:l,transparent:!0,depthWrite:!1,fog:!1})})}const Qr=`
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
`,qr=`
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
`,es={low:260,mid:700,high:1300},Jr=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,ei=`
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
`,ts=1100;function ti({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=Se(c=>c.camera),l=g.useMemo(()=>{const c=o==="low"?24:o==="mid"?34:48,d=new vs(e.r*1.02,e.r*.07,ts,c,6,!0);return d.translate(e.x,-ts/2-3,e.z),d},[e,o]),h=g.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new M(...oe(X.foam))},uDeep:{value:new M(...oe(X.underGlow))},uCameraPos:{value:new M},uFogDensity:{value:.0062},uFogColor:{value:new M(...oe(X.underHaze))}}),[e]);return J((c,d)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=d,u.uCameraPos.value.copy(c.camera.position),u.uFogDensity.value=c.scene.fog?.density??.0062;const x=c.scene.fog?.color;x&&u.uFogColor.value.set(x.r,x.g,x.b);const r=Math.hypot(i.position.x-e.x,i.position.z-e.z),f=1-S.smoothstep(r,e.r*8,e.r*24);u.uGain.value+=(w.underwater*f-u.uGain.value)*Math.min(1,d*4),a.current&&(a.current.visible=u.uGain.value>.012)}),t.jsx("mesh",{ref:a,geometry:l,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Jr,fragmentShader:ei,uniforms:h,transparent:!0,depthWrite:!1,side:Te,blending:st,fog:!1})})}function oi({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=Se(c=>c.camera),l=g.useMemo(()=>{const c=es[o]??es.high,d=new Float32Array(c*3),u=new Float32Array(c),x=new Float32Array(c),r=new Float32Array(c),f=new Float32Array(c),m=new Float32Array(c);for(let p=0;p<c;p++)u[p]=Math.random()*Math.PI*2,x[p]=Math.random(),r[p]=.07+Math.random()*.1,f[p]=.12+Math.pow(Math.random(),1.8)*.5,m[p]=2+Math.random()*5;const s=new wt;return s.setAttribute("position",new q(d,3)),s.setAttribute("aAngle",new q(u,1)),s.setAttribute("aPhase",new q(x,1)),s.setAttribute("aRate",new q(r,1)),s.setAttribute("aRadius",new q(f,1)),s.setAttribute("aSize",new q(m,1)),s.boundingSphere=new Dt(new M(e.x,-60,e.z),e.r+140),s},[o,e]),h=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new dn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new M(...oe(X.underGlow))},uGain:{value:0}}),[e]);return J((c,d)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=d;const x=Math.hypot(i.position.x-e.x,i.position.z-e.z),r=1-S.smoothstep(x,e.r*1.2,e.r*4);u.uGain.value=w.underwater*r,a.current&&(a.current.visible=u.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:l,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Qr,fragmentShader:qr,uniforms:h,transparent:!0,depthWrite:!1,blending:st,fog:!1})})}function ni({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Zr,{quality:e}),Ae.map((o,n)=>t.jsx(oi,{whirl:o,quality:e},n)),Ae.map((o,n)=>t.jsx(ti,{whirl:o,quality:e},`w${n}`))]})}const zo=16/9,Ps=96,Os=78;function Jo(e,o,n=Ps){if(!o||o>=zo)return e;const a=S.degToRad(e)/2,i=2*Math.atan(Math.tan(a)*zo/o);return Math.min(n,S.radToDeg(i))}function Ds(e){return!e||e>=zo?1:S.clamp(.72+.28*(e/zo),.86,1)}function en(e,o,n,a=.06,i=Ps){const l=Jo(o,e.aspect,i);Math.abs(e.fov-l)<=.05||(e.fov+=(l-e.fov)*(1-Math.pow(a,n)),e.updateProjectionMatrix())}function tn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*S.clamp(1280/o,.55,2.2)}const Ns="oni.settings.v1";function si(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const ye={comfort:0,lookSens:1,invertY:!1,freeCam:!1},on=new Set;function Hs(){for(const e of on)e(ye)}function _s(e){return on.add(e),()=>on.delete(e)}function yn(e,o){e in ye&&(ye[e]=o,ii(),Hs())}function ko(e){yn(e,!ye[e])}function ai(){yn("comfort",ye.comfort<.01?.55:ye.comfort<.9?1:0)}function ri(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=ye.lookSens-1e-6);yn("lookSens",e[(o+1)%e.length])}function ii(){try{localStorage.setItem(Ns,JSON.stringify(ye))}catch{}}function li(){let e=null;try{e=JSON.parse(localStorage.getItem(Ns)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(ye))typeof e[o]==typeof ye[o]&&(ye[o]=e[o]);else ye.comfort=si()?1:0;return Hs(),ye}const ke=(e,o)=>e+(o-e)*ye.comfort,Ut=e=>e<-1?-1:e>1?1:e,_={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,zoom:0},dt={level:0},nn=new Set;function ci(e){return nn.add(e),()=>nn.delete(e)}function bn(e){if(dt.level===e)return e;dt.level=e;for(const o of nn)o(e);return e}function Bs(){return bn((dt.level+1)%3)}const ee={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0}},Kt=new Set,rt=(...e)=>e.some(o=>Kt.has(o));function Us(){_.throttle=0,_.rudder=0,_.planes=0,_.boost=!1,_.walk.x=0,_.walk.z=0,_.surfaceQueued=!1,_.periscopeQueued=!1,_.burstQueued=!1,_.recentreQueued=!1,_.zoom=0,bn(0),ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0,Kt.clear()}function hi(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),o=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const l=i.key.toLowerCase();Kt.add(l),l==="f"&&(_.surfaceQueued=!0),l==="p"&&(_.periscopeQueued=!0),l==="b"&&!i.repeat&&(_.burstQueued=!0),l==="r"&&!i.repeat&&(_.recentreQueued=!0),l==="v"&&!i.repeat&&ko("freeCam"),l==="x"&&!i.repeat&&Bs(),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(l)&&i.preventDefault()},n=i=>Kt.delete(i.key.toLowerCase()),a=()=>Us();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",a),Kt.clear()}}function di(){const e=rt("w","arrowup")?1:0,o=rt("s","arrowdown")?1:0,n=rt("a","arrowleft")?1:0,a=rt("d","arrowright")?1:0,i=rt("q"," ")?1:0,l=rt("e","c")?1:0,h=Ut(e-o+ee.throttle);h<-.05&&dt.level&&bn(0),_.throttle=dt.level>0?Math.max(h,1):h,_.rudder=Ut(n-a+ee.rudder),_.planes=Ut(i-l+ee.planes),_.boost=rt("shift")||ee.boost||dt.level===2,_.zoom=(rt("]","=","+")?1:0)-(rt("[","-","_")?1:0),_.walk.x=Ut(a-n+ee.walk.x),_.walk.z=Ut(e-o+ee.walk.z)}const sn=[0,(be[0].y+be[1].y)/2,be[0].z],Ws=[le.x,le.y,le.z],To=V.dir,$s=[V.x+To[0]*300,-36,V.z+To[1]*300],Vs=[V.x+To[0]*46,34,V.z+To[1]*46],Ys=[V.gate.x,4,V.gate.z],Xs=[V.gate.x,22,V.gate.z],ui=1.55,an=W/ui,pi=1+(an-1)*.35,ot=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:sn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:$s,to:Vs,lookFrom:Ys,lookTo:Xs,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Ws,lookTo:sn,swell:0}],mi=new Set([sn,Ws,$s,Vs,Ys,Xs]),lo=e=>mi.has(e)?e:[e[0]*an,e[1]*pi,e[2]*an];for(const e of ot)e.from=lo(e.from),e.to=lo(e.to),e.lookFrom=lo(e.lookFrom),e.lookTo=lo(e.lookTo);const rn=ot.reduce((e,o)=>e+o.dur,0),os=ot,fi=e=>e*e*(3-2*e),xi=e=>1-Math.pow(1-e,2.2),co=e=>new M(e[0],e[1],e[2]),xt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function gi(e,o){g.useEffect(()=>{if(!e)return;const n=o.domElement,a=new Map;let i=0,l=null;const h=(r,f)=>{const m=w.orbit,s=m.dist*.0016,p=Math.cos(m.yaw),y=-Math.sin(m.yaw);m.target.x-=p*r*s,m.target.z-=y*r*s;const v=Math.cos(m.pitch),b=Math.sin(m.pitch);m.target.y+=f*s*v,m.target.x+=Math.sin(m.yaw)*f*s*b,m.target.z+=Math.cos(m.yaw)*f*s*b,Ks()},c=r=>{a.set(r.pointerId,{x:r.clientX,y:r.clientY});try{n.setPointerCapture?.(r.pointerId)}catch{}if(a.size===2){const[f,m]=[...a.values()];i=Math.hypot(f.x-m.x,f.y-m.y),l={x:(f.x+m.x)/2,y:(f.y+m.y)/2}}},d=r=>{const f=a.get(r.pointerId);if(!f)return;const m=r.clientX-f.x,s=r.clientY-f.y;if(f.x=r.clientX,f.y=r.clientY,a.size>=2){const[p,y]=[...a.values()],v=Math.hypot(p.x-y.x,p.y-y.y),b={x:(p.x+y.x)/2,y:(p.y+y.y)/2};if(i>8&&v>8){const j=w.orbit;j.dist=S.clamp(j.dist*(i/v),...xt.dist)}l&&h(b.x-l.x,b.y-l.y),i=v,l=b,r.cancelable&&r.preventDefault();return}if(r.shiftKey||r.buttons===4)h(m,s);else{const p=w.orbit;p.yaw-=m*.005*tn(),p.pitch=S.clamp(p.pitch+s*.004*tn(),...xt.pitch)}r.cancelable&&r.preventDefault()},u=r=>{a.delete(r.pointerId)&&a.size<2&&(i=0,l=null)},x=r=>{r.preventDefault();const f=w.orbit;f.dist=S.clamp(f.dist*(1+Math.sign(r.deltaY)*.11),...xt.dist)};return n.addEventListener("pointerdown",c),n.addEventListener("pointermove",d,{passive:!1}),n.addEventListener("pointerup",u),n.addEventListener("pointercancel",u),window.addEventListener("pointerup",u),n.addEventListener("wheel",x,{passive:!1}),()=>{n.removeEventListener("pointerdown",c),n.removeEventListener("pointermove",d),n.removeEventListener("pointerup",u),n.removeEventListener("pointercancel",u),window.removeEventListener("pointerup",u),n.removeEventListener("wheel",x),a.clear()}},[e,o])}function Ks(){const e=w.orbit;e.target.x=S.clamp(e.target.x,-4200,xt.xz),e.target.z=S.clamp(e.target.z,-4200,xt.xz),e.target.y=S.clamp(e.target.y,...xt.y)}function wi({onRails:e,playing:o,speed:n=1,onShot:a,idle:i=!1}){const l=Se(x=>x.camera),h=Se(x=>x.gl),c=g.useRef(0),d=g.useRef(-1),u=g.useRef(new M(0,150,-260));return gi(!e&&!i,h),g.useEffect(()=>{if(e)return;const x=w.orbit,r=l.position.clone().sub(x.target);x.dist=S.clamp(r.length(),...xt.dist),x.yaw=Math.atan2(r.x,r.z),x.pitch=Math.asin(S.clamp(r.y/(r.length()||1),-1,1))},[e,l]),J((x,r)=>{if(i)return;const f=Math.min(r,.05);if(w.t+=f,e){if(w.jumpTo!=null){let z=0;for(let T=0;T<w.jumpTo&&T<ot.length;T++)z+=ot[T].dur;c.current=z,w.jumpTo=null}o&&(c.current=(c.current+f*n)%rn);let v=0,b=0;for(;b<ot.length&&!(c.current<v+ot[b].dur);b++)v+=ot[b].dur;const j=ot[Math.min(b,ot.length-1)],R=S.clamp((c.current-v)/j.dur,0,1);d.current!==b&&(d.current=b,w.shot=b,a?.(b,j));const E=co(j.from).lerp(co(j.to),xi(R)),C=co(j.lookFrom).lerp(co(j.lookTo),fi(R)),A=j.swell??0;if(A>0){const z=w.t;E.y+=Math.sin(z*.62)*3.1*A+Math.sin(z*1.31+1.2)*1.2*A,E.x+=Math.sin(z*.44+.6)*2.2*A}E.x+=Math.sin(w.t*.83)*.35,E.y+=Math.sin(w.t*1.17+2)*.28,l.position.copy(E),u.current.lerp(C,1-Math.pow(1e-4,f)),l.lookAt(u.current),A>0&&l.rotateZ(Math.sin(w.t*.51)*.024*A);const F=Jo(j.fov,l.aspect);Math.abs(l.fov-F)>.01&&(l.fov+=(F-l.fov)*(1-Math.pow(.02,f)),l.updateProjectionMatrix()),w.progress=c.current/rn}else{const v=w.orbit,b=_.walk.x,j=_.walk.z;if(b||j||_.planes||_.zoom){const C=v.dist*(_.boost?1.9:.7)*f,A=-Math.sin(v.yaw),F=-Math.cos(v.yaw);v.target.x+=(A*j-F*b)*C,v.target.z+=(F*j+A*b)*C,v.target.y+=_.planes*C,v.dist=S.clamp(v.dist*(1-_.zoom*.9*f),...xt.dist),Ks()}const R=Math.cos(v.pitch);l.position.set(v.target.x+Math.sin(v.yaw)*R*v.dist,v.target.y+Math.sin(v.pitch)*v.dist,v.target.z+Math.cos(v.yaw)*R*v.dist),l.lookAt(v.target);const E=Jo(55,l.aspect);Math.abs(l.fov-E)>.01&&(l.fov+=(E-l.fov)*(1-Math.pow(.02,f)),l.updateProjectionMatrix()),w.t+=0}const m=Qt(l.position.x,l.position.z);w.shelter+=(m-w.shelter)*(1-Math.pow(.06,f)),w.fog=S.lerp(gt.sea,gt.bay,w.shelter),w.rain=1-w.shelter*.92;const s=Ke(l.position.x,l.position.z,w.t,1),p=S.clamp((s.y-l.position.y-1)/3,0,1);w.underwater+=(p-w.underwater)*(1-Math.pow(.002,f)),w.depthBelow=Math.max(0,s.y-l.position.y);const y=S.lerp(8200,1700,w.underwater);Math.abs(l.far-y)>20&&(l.far=y,l.updateProjectionMatrix()),x.camera.updateMatrixWorld()}),null}const ns={low:[24,16],mid:[40,26],high:[56,36]};function yi({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const[f,m]=ns[e]??ns.high,s=new ha(1,f,m),p=s.attributes.position,y=new Float32Array(p.count*3),[v,b,j]=Re.centre,[R,E,C]=Re.radii,A=new xe("#241c22"),F=new xe(k.rockWarm),z=new xe;for(let T=0;T<p.count;T++){const N=p.getX(T),I=p.getY(T),B=p.getZ(T),Z=1+(Gt(N*2.4+5,B*2.4-9,3)-.5)*.14;p.setXYZ(T,v+N*R*Z,b+I*E*Z,j+B*C*Z);const ne=S.clamp((I+.2)/1.2,0,1);z.copy(A).lerp(F,(1-ne)*.55),y[T*3]=z.r,y[T*3+1]=z.g,y[T*3+2]=z.b}return s.setAttribute("color",new q(y,3)),s.computeVertexNormals(),s},[e]),{stairM:l,brazierM:h,bayM:c,tableM:d,jarM:u,westStairM:x}=g.useMemo(()=>{const f=new He,m=new Qe,s=new M(1,1,1),p=new M,y=[];for(let G=0;G<Xe.steps;G++){const L=G/(Xe.steps-1);p.set(0,S.lerp(je.y,se.y+2,L),S.lerp(Xe.zTop,Xe.zBottom,L)),m.identity(),y.push(f.clone().compose(p,m,s))}const v=[],b=e==="low"?5:9;for(const G of[-1,1])for(let L=0;L<b;L++){const Q=L/(b-1);p.set(G*176,se.y+9,S.lerp(se.zFront-40,se.zBack+40,Q)),m.identity(),v.push(f.clone().compose(p,m,s))}for(let G=0;G<6;G++)p.set(-110+G*44,se.y+9,H.z+H.halfZ+54),m.identity(),v.push(f.clone().compose(p,m,s));const j=[],R=e==="low"?5:9;for(const G of[-1,1])for(let L=0;L<de.tiers;L++)for(let Q=0;Q<R;Q++){const ae=Q/(R-1);p.set(G*(de.x-L*26),de.y+L*de.tierRise,S.lerp(-205,de.halfZ,ae)),m.identity(),j.push(f.clone().compose(p,m,s))}const E=[],C=[],A=new Qe,F=new M(0,1,0);let z=24301;const T=()=>(z=Math.imul(z,1664525)+1013904223>>>0,z/4294967296),N=e==="low"?1:2,I=e==="low"?5:8;for(const G of[-1,1])for(let L=0;L<N;L++)for(let Q=0;Q<I;Q++){const ae=G*(96+L*52+(T()-.5)*14),te=S.lerp(se.zBack+120,se.zFront-60,Q/(I-1))+(T()-.5)*16;if(!(Math.abs(ae)<ge.halfX+24&&Math.abs(te-ge.z)<ge.halfZ+20)&&!(Math.abs(Math.abs(ae)-he.x)<26&&te<he.zFoot+16&&te>he.zTop-8)){p.set(ae,se.y+2.4,te),A.setFromAxisAngle(F,(T()-.5)*.5),E.push(f.clone().compose(p,A,s));for(let pe=0;pe<2;pe++)p.set(ae+(T()-.5)*30,se.y+3.5,te+(T()>.5?8:-8)+(T()-.5)*6),A.setFromAxisAngle(F,T()*Math.PI),C.push(f.clone().compose(p,A,s))}}const B=[],Z=16,ne=G=>G*G*(3-2*G);for(let G=0;G<=Z;G++){const L=G/Z;p.set(-252,ne(L)*(de.y-.5)-1.3,S.lerp(45,-45,L)),m.identity(),B.push(f.clone().compose(p,m,s))}return{stairM:y,brazierM:v,bayM:j,tableM:E,jarM:C,westStairM:B}},[e]);J(()=>{const f=w.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(f*4.1)*.3+Math.sin(f*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(f*.9)*.12)});const r=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:$o,receiveShadow:r,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:$o,roughness:.97,metalness:.02})}),[[0,(se.zFront+ge.z+ge.halfZ)/2,se.halfX*2,se.zFront-ge.z-ge.halfZ],[0,(se.zBack+ge.z-ge.halfZ)/2,se.halfX*2,ge.z-ge.halfZ-se.zBack],[-342/2-20,ge.z,se.halfX*2-ge.halfX*2,ge.halfZ*2],[(ge.halfX+se.halfX)/2+20,ge.z,se.halfX*2-ge.halfX*2,ge.halfZ*2]].map(([f,m,s,p],y)=>t.jsxs("mesh",{position:[f,se.y-3,m],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Math.abs(s),6,Math.abs(p)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},y)),t.jsxs("mesh",{ref:a,position:[ge.x,Ge.ceiling+2,ge.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[ge.halfX*2,ge.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:Te})]}),t.jsxs("mesh",{position:[0,je.y-4,je.z],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[je.halfX*2.6,8,je.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,l.length],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Xe.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(bi,{matrices:l})]}),[-1,1].map(f=>Array.from({length:de.tiers},(m,s)=>t.jsxs("mesh",{position:[f*(de.x-s*26),de.y+s*de.tierRise-4,0],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[76-s*6,7,de.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.92})]},`${f}-${s}`))),t.jsxs("instancedMesh",{args:[null,null,c.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:k.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Si,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(vi,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,u.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Mi,{matrices:u})]}),t.jsxs("instancedMesh",{args:[null,null,x.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(ji,{matrices:x})]}),t.jsxs("instancedMesh",{args:[null,null,h.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(zi,{matrices:h})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,h.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:k.furnace,emissive:k.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(ki,{matrices:h})]}),t.jsxs("mesh",{position:[0,Ge.y-4,0],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Ge.halfX*2,8,Ge.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(f=>[-1,0,1].map(m=>t.jsxs("mesh",{position:[f*120,(Ge.y+se.y)/2,m*96],castShadow:r,children:[t.jsx("boxGeometry",{args:[26,Math.abs(se.y-Ge.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${f}-${m}`)))]})}function bi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function vi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Mi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function ji({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Si({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function zi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function ki({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o,offsetY:9})}function jt({matrices:e,offsetY:o=0}){const n=g.useRef(),a=g.useRef(!1);return J(()=>{if(a.current)return;const i=n.current?.parent;if(!i?.isInstancedMesh)return;const l=new He,h=new He().makeTranslation(0,o,0);for(let c=0;c<Math.min(e.length,i.count);c++)l.copy(e[c]).multiply(h),i.setMatrixAt(c,l);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:n})}const ss=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),i=a.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),a.fillStyle=i,a.fillRect(0,0,e,o),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let h=0;h<12;h++){const c=h/12*Math.PI*2;a.save(),a.translate(e/2,o*.62),a.rotate(c),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let h=8;h<e;h+=22)a.fillRect(h,0,3,o);a.globalAlpha=1;const l=new eo(n);return l.colorSpace=to,l})();function Ti(e,o,n,a){const i=e+a,l=o+a,h=new Float32Array([-i,0,l,i,0,l,e*.18,n,o*.18,-i,0,l,e*.18,n,o*.18,-e*.18,n,o*.18,i,0,l,i,0,-l,e*.18,n,-o*.18,i,0,l,e*.18,n,-o*.18,e*.18,n,o*.18,i,0,-l,-i,0,-l,-e*.18,n,-o*.18,i,0,-l,-e*.18,n,-o*.18,e*.18,n,-o*.18,-i,0,-l,-i,0,l,-e*.18,n,o*.18,-i,0,-l,-e*.18,n,o*.18,-e*.18,n,-o*.18]),c=new wt;return c.setAttribute("position",new q(h,3)),c.computeVertexNormals(),c}function Ei({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=Ne("keep-hf.opt.glb"),l=g.useMemo(()=>{const c=[];for(let d=0;d<H.storeys;d++){const u=1-(d+1)*H.taper,x=H.plinth+d*H.storey;c.push({i:d,y:x,halfX:H.halfX*u,halfZ:H.halfZ*u,roof:Ti(H.halfX*u,H.halfZ*u,d===H.storeys-1?30:16,11)})}return c},[]);J(()=>{const c=w.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(c*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(c*3.3)*.25)});const h=o;return t.jsxs("group",{position:[0,H.baseY,H.z],children:[t.jsxs("mesh",{position:[0,H.plinth/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[H.halfX*2.2,H.plinth,H.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(ue,{name:"keep-hf.opt.glb",height:H.plinth+H.storeys*H.storey+26,position:[0,H.plinth*.5,0],tint:"#9a8468",emissive:k.emberDeep,emissiveIntensity:.14}),!i&&l.map(c=>t.jsxs("group",{position:[0,c.y,0],children:[t.jsxs("mesh",{position:[0,H.storey/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2,H.storey,c.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,H.storey*.55,c.halfZ+.6],children:[t.jsx("planeGeometry",{args:[c.halfX*1.75,H.storey*.38]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,H.storey*.02,c.halfZ+8],castShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,H.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[c.halfX*2+3,1.6,c.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:c.roof,position:[0,H.storey,0],castShadow:h,receiveShadow:h,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},c.i)),[-1,1].map(c=>t.jsxs("mesh",{position:[c*14,H.plinth+H.storeys*H.storey+30,0],rotation:[0,0,c*.4],castShadow:h,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},c)),t.jsxs("group",{position:[0,we.y,we.z-H.z],children:[t.jsxs("mesh",{castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[we.halfX*2,7,we.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[we.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:k.furnace,emissive:"#ffffff",emissiveMap:ss,map:ss,emissiveIntensity:2.2,toneMapped:!1,side:Te})]}),t.jsx(ue,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:h,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*8,32,-5],rotation:[0,0,c*-.55],castShadow:h,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},c))]})}),t.jsx(ue,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:k.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*we.halfX*.9,28,we.depth/2-4],castShadow:h,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.7})]},c)),t.jsxs("mesh",{position:[0,56,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[we.halfX*2.3,5,we.depth+22]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.72})]}),[-1,1].map(c=>t.jsx(ue,{name:"oni-daiko.opt.glb",height:26,position:[c*(we.halfX-22),4,4],rotation:c*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:h,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},c))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Ri,{})]})]})}function Ri(){const e=g.useRef(),o=g.useRef(!1);return J(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const a=new He,i=new M,l=new Qe,h=new M(1,1,1);for(let c=0;c<n.count;c++){const d=c/(n.count-1)*2-1;i.set(d*(H.halfX+26),we.y+74-(1-d*d)*20,H.halfZ+22),n.setMatrixAt(c,a.compose(i,l,h))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Ai({shadows:e=!0}){const{slabs:o,flights:n,tower:a}=Ts,i=g.useMemo(()=>{const l=[],h=c=>c*c*(3-2*c);for(const c of n)for(let u=0;u<=9;u++){const x=u/9;l.push([(c.x0+c.x1)/2,c.y0+(c.y1-c.y0)*h(x)-1.2,S.lerp(c.z0,c.z1,x)])}return l},[n]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(l=>[a.z[0]+1,a.z[1]-1].map(h=>t.jsxs("mesh",{position:[l,128,h],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${l}${h}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Fi,{points:i})]}),o.map(([l,h,c,d,u],x)=>t.jsxs("mesh",{position:[l,h-1.6,c],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(u)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},x)),o.map(([l,h,c,d,u],x)=>t.jsxs("mesh",{position:[l,h+5,c+Math.abs(u)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})]},`r${x}`))]})}function Fi({points:e}){const o=g.useRef(),n=g.useRef(!1);return J(()=>{if(n.current)return;const a=o.current?.parent;if(!a?.isInstancedMesh)return;const i=new He,l=new Qe,h=new M(1,1,1),c=new M;for(let d=0;d<Math.min(e.length,a.count);d++)c.set(e[d][0],e[d][1],e[d][2]),a.setMatrixAt(d,i.compose(c,l,h));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function Ci({shadows:e=!0}){const o=g.useMemo(()=>{const n=[],i=l=>l*l*(3-2*l);for(const l of[-1,1])for(let h=0;h<=20;h++){const c=h/20;n.push({x:l*he.x,y:i(c)*ft,z:S.lerp(he.zFoot,he.zTop,c)})}return n},[]);return t.jsxs("group",{children:[o.map((n,a)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[he.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.75})]},a)),[-1,1].map(n=>{const a=l=>l*l*(3-2*l),i=l=>{const h=[];for(let c=0;c<=16;c++){const d=c/16;h.push(new M(n*he.x+l,a(d)*ft+7,S.lerp(he.zFoot,he.zTop,d)))}return new Ot(new Pt(h),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(he.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})})]},n)})]})}function Ii({shadows:e=!0}){const o=g.useMemo(()=>oo.map(([,,n,a])=>{const i=[];for(let l=0;l<=12;l++){const h=l/12*2-1;i.push(new M(h*n*.5,a*(1-h*h),0))}return new Ot(new Pt(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[oo.map(([n,a],i)=>t.jsxs("group",{position:[0,n,a],children:[t.jsx("mesh",{geometry:o[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.74})}),[-7,7].map(l=>t.jsx("mesh",{geometry:o[i],position:[0,7,l],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})},l))]},i)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,oo[0][0]-12,oo[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,se.y,0]})]})}function Zs(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Gi({quality:e,shadows:o}){const n=g.useMemo(()=>{const i=Zs(712273),l=[],h=e==="low"?14:e==="mid"?26:40;let c=0;for(;l.length<h&&c<h*40;){c++;const d=(i()*2-1)*(se.halfX-30),u=S.lerp(se.zBack+40,se.zFront-30,i());Math.abs(d)<62&&u>H.z+120||Math.abs(d)<70&&Math.abs(u-84)<58||Math.abs(Math.abs(d)-he.x)<24&&u<he.zFoot+18&&u>he.zTop-10||l.push({x:d,z:u,kind:l.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return l},[e]),a=o;return t.jsx(t.Fragment,{children:n.map((i,l)=>{const h=[i.x,se.y,i.z];return i.kind===0?t.jsx(ue,{name:"sake-tower.opt.glb",height:22*i.k,position:h,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:h,children:[0,1,2].map(c=>t.jsxs("mesh",{position:[0,4+c*7,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[6-c,6-c,7,10]}),t.jsx("meshStandardMaterial",{color:c%2?"#c9a86a":"#8e6a3c",roughness:.92})]},c))})},l):i.kind===1?t.jsx(ue,{name:"oni-guardian.opt.glb",height:30*i.k,position:h,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*4,28,0],rotation:[0,0,c*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},c))]})},l):i.kind===2?t.jsx(ue,{name:"wisteria-trellis.opt.glb",height:34*i.k,position:h,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(c=>t.jsxs("mesh",{position:[c,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},c))]})},l):t.jsxs("group",{position:h,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:l%2?k.vermilion:"#e8dcc4",roughness:.95,side:Te,emissive:l%2?k.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},l)})})}function Li({shadows:e}){const o=g.useMemo(()=>{const n=Zs(10560325),a=[];for(let i=0;i<14;i++)a.push({x:(n()*2-1)*(Ge.halfX-40),z:(n()*2-1)*(Ge.halfZ-40),rot:n()*Math.PI*2,keg:i%2===0});return a},[]);return t.jsx(t.Fragment,{children:o.map((n,a)=>n.keg?t.jsx(ue,{name:"powder-keg.opt.glb",height:13,position:[n.x,Ge.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Ge.y+6,n.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(ue,{name:"war-cannon.opt.glb",height:12,position:[n.x,Ge.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Ge.y+5,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function Pi(){const e=Se(o=>o.camera);return J((o,n)=>{const a=Math.min(n,.05),i=(e.position.x-me.x-Re.centre[0])/Re.radii[0],l=(e.position.y-me.y-Re.centre[1])/Re.radii[1],h=(e.position.z-me.z-Re.centre[2])/Re.radii[2],c=Math.sqrt(i*i+l*l+h*h),d=S.clamp(1-(c-1)/.5,0,1);w.inside+=(d-w.inside)*(1-Math.pow(.02,a))}),null}function Oi({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[me.x,me.y,me.z],children:[t.jsx(Pi,{}),t.jsx(yi,{quality:e,shadows:o}),t.jsx(Ei,{quality:e,shadows:o}),t.jsx(Ii,{shadows:o}),t.jsx(Ci,{shadows:o}),t.jsx(Ai,{shadows:o}),t.jsx(Gi,{quality:e,shadows:o}),t.jsx(Li,{shadows:o}),[-1,1].map(n=>t.jsx(ue,{name:"banquet-table.opt.glb",height:9,position:[n*92,se.y,H.z+210],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}`)),t.jsx(ue,{name:"treasure-kura.opt.glb",height:64,position:[de.x-74,se.y,H.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[de.x-74,se.y,H.z+96],rotation:[0,-.7,0],children:[[-1,1].map(n=>[-1,1].map(a=>t.jsxs("mesh",{position:[n*12,5,a*9],castShadow:o,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${n}${a}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([n,a,i],l)=>t.jsx(ue,{name:"bomb-sphere.opt.glb",height:22,position:[n,Ge.y,a],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Ge.y+10,a],castShadow:o,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${l}`)),[-1,1].map(n=>t.jsx(ue,{name:"keep-tier.opt.glb",height:96,position:[n*(de.x-40),de.y+de.tiers*de.tierRise-6,H.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(ue,{name:"arch-bridge.opt.glb",height:26,position:[n*74,se.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(ue,{name:"oni-guardian.opt.glb",height:54,position:[n*(je.halfX+26),je.y,je.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(je.halfX+26),je.y,je.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,we.y+30,we.z-H.z+H.z+40],color:k.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,de.y+120,60],color:k.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Ge.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,je.y+46,je.z-40],color:k.lantern,intensity:26e3,distance:620,decay:2})]})}const Di=Math.PI/2-.14,as=1.5;function Qs({enabled:e,dom:o,zoomMin:n=.34,zoomMax:a=2.6,zoom0:i=1,pitch0:l=.16,pitchMin:h=-.62,pitchMax:c=Di}){const d=g.useRef({yaw:0,pitch:l,zoom:i,smYaw:0,smPitch:l,smZoom:i,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:h,pitchMax:c,zoomMin:n,zoomMax:a,pitch0:l}).current;return g.useEffect(()=>{if(!e||!o)return;const u=o,x=new Map;let r=0,f=0,m=null;const s=()=>x.size,p=j=>{x.set(j.pointerId,{x:j.clientX,y:j.clientY});try{u.setPointerCapture?.(j.pointerId)}catch{}if(s()===1)d.dragging=!0,m={x:j.clientX,y:j.clientY,t:j.timeStamp};else if(s()===2){d.dragging=!1;const[R,E]=[...x.values()];r=Math.hypot(R.x-E.x,R.y-E.y),m=null}},y=j=>{const R=x.get(j.pointerId);if(!R)return;const E=j.clientX-R.x,C=j.clientY-R.y;if(R.x=j.clientX,R.y=j.clientY,s()>=2){const[F,z]=[...x.values()],T=Math.hypot(F.x-z.x,F.y-z.y);r>8&&T>8&&(d.zoom=S.clamp(d.zoom*(r/T),d.zoomMin,d.zoomMax),d.since=0),r=T;return}if(!d.dragging)return;m&&Math.hypot(j.clientX-m.x,j.clientY-m.y)>14&&(m=null);const A=tn()*ye.lookSens;d.yaw-=E*.005*A,d.pitch=S.clamp(d.pitch+C*.004*A*(ye.invertY?-1:1),d.pitchMin,d.pitchMax),d.since=0,j.cancelable&&j.preventDefault()},v=j=>{x.has(j.pointerId)&&(x.delete(j.pointerId),s()<2&&(r=0),s()===0&&(d.dragging=!1,m&&j.timeStamp-m.t<260&&(j.timeStamp-f<340?(d.recentre=!0,f=0):f=j.timeStamp),m=null))},b=j=>{j.preventDefault(),d.zoom=S.clamp(d.zoom*(1+Math.sign(j.deltaY)*.1),d.zoomMin,d.zoomMax),d.since=0};return u.addEventListener("pointerdown",p),u.addEventListener("pointermove",y,{passive:!1}),u.addEventListener("pointerup",v),u.addEventListener("pointercancel",v),window.addEventListener("pointerup",v),u.addEventListener("wheel",b,{passive:!1}),()=>{u.removeEventListener("pointerdown",p),u.removeEventListener("pointermove",y),u.removeEventListener("pointerup",v),u.removeEventListener("pointercancel",v),window.removeEventListener("pointerup",v),u.removeEventListener("wheel",b),x.clear(),d.dragging=!1}},[e,o,d]),d}function ln(e,o,n=0){if(e.since+=o,_.zoom&&(e.zoom=S.clamp(e.zoom*(1-_.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,_.recentreQueued&&(_.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=as+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!ye.freeCam&&!e.noRecentre&&!e.dragging&&e.since>as){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(ke(.22,.48),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const a=e.dragging?6e-4:ke(.002,.02),i=1-Math.pow(a,o);let l=e.yaw-e.smYaw;for(;l>Math.PI;)l-=Math.PI*2;for(;l<-Math.PI;)l+=Math.PI*2;e.smYaw+=l*i,e.smPitch+=(e.pitch-e.smPitch)*i,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const No=64,Ni=19,rs=16,Hi=.92,ho=9,_i=.3,Bi=.04,Ui=.0016,Wi=.055,$i=1.9,Vi=16,Yi=62,Xi=9,is={x:-.45,z:-2.4},ls=.075,Ki=new M,Zi=new M;function Et(e,o){return S.clamp(-re(e,o)/26,0,1)}const uo={x:60*W,z:1050*W},cs=22,Qi=42,bt=11;function qi({mode:e,onMode:o}){const n=Se(y=>y.camera),a=Se(y=>y.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=Ne("ship-sunny.opt.glb"),u=Ne("ship-lion.opt.glb"),x=d||u,r=d?"ship-sunny.opt.glb":u?"ship-lion.opt.glb":null,f=r?qt(r,58):34,m=Ne("crew-straw.opt.glb"),s=g.useRef({x:uo.x,z:uo.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,stride:0,area:"hall",boarded:!1}).current,p=Qs({enabled:e==="helm"||e==="foot",dom:a.domElement,zoomMin:.32,zoomMax:2.4,pitch0:.16,pitchMin:-.62,pitchMax:1.44});return g.useEffect(()=>{if(e==="helm")return s.x=uo.x,s.z=uo.z,s.heading=Math.PI,s.speed=0,s.vx=0,s.vz=0,s.throttle=0,s.flank=0,s.deckY=0,p.yaw=0,p.smYaw=0,p.pitch=.16,p.smPitch=.16,p.pitch0=.16,p.zoom=1,p.smZoom=1,p.noRecentre=!1,p.pitchMin=-.62,p.pitchMax=1.44,s.swallowed=0,s.burst=1,s.burstFx=0,s.slam=0,s.drift=0,s.trim=0,s.bowY=Ke(s.x,s.z,w.t,1).y,w.helm=null,qo("helm"),()=>{w.helmActive=!1}},[e,s,p]),g.useEffect(()=>{if(e!=="foot")return;s.fvx=0,s.fvz=0,U.chain!=="foot"&&qo("foot");const y=(b,j)=>{p.yaw=b,p.smYaw=b,p.pitch=j,p.smPitch=j,p.pitch0=0,p.noRecentre=!0,p.pitchMin=-1.28,p.pitchMax=1.28},v=w.footSpawn;if(w.footSpawn="hall",v==="port"){s.area="island",s.fx=K.x+40*W,s.fz=K.z+40*W,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.atan2(-(le.x-s.fx),-(le.z-s.fz)),y(s.fyaw,-.06);return}if(v==="rear"){s.area="island",s.fx=V.gate.x+V.dir[0]*26,s.fz=V.gate.z+V.dir[1]*26,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.atan2(V.dir[0],V.dir[1]),y(s.fyaw,.02);return}s.area="hall",s.fx=me.x,s.fy=me.y+je.y,s.fz=me.z+Xe.zTop,s.fyaw=0,s.fpitch=-.05,y(0,.05)},[e,s,p]),J((y,v)=>{if(e!=="helm"&&e!=="foot")return;const b=Math.min(v,.05);if(w.t+=b,e==="helm"){const j=s.heading;s.throttle+=(_.throttle-s.throttle)*(1-Math.pow(.02,b)),s.rudder+=(_.rudder-s.rudder)*(1-Math.pow(.005,b)),s.flank+=((_.boost?1:0)-s.flank)*(1-Math.pow(Bi,b));const R=No*(1+_i*s.flank),E=Math.sin(s.heading),C=Math.cos(s.heading),A=Math.cos(s.heading),F=-Math.sin(s.heading);let z=s.vx*E+s.vz*C,T=s.vx*A+s.vz*F;const N=1-w.shelter,I=s.throttle>=0?s.throttle*R:s.throttle*Ni;z+=S.clamp(I-z,-rs*2.5,rs)*b,s.burst=Math.min(1,s.burst+b/Xi),_.burstQueued&&(_.burstQueued=!1,s.burst>=.999&&(s.burst=0,s.burstFx=1,z+=Yi,w.splash+=1)),s.burstFx*=Math.pow(.2,b);const B=Ke(s.x,s.z,w.t,1);z-=(B.dx*E+B.dz*C)*Vi*N*b,z-=z*Math.abs(z)*Ui*b,T-=(T*Math.abs(T)*Wi+T*$i)*b;const Z=S.clamp(Math.abs(z)/16,0,1);z*=Math.pow(1-.11*Math.abs(s.rudder)*Z,b),s.vx=E*z+A*T,s.vz=C*z+F*T,s.speed=z,s.drift+=(S.clamp(Math.abs(T)/11,0,1)-s.drift)*(1-Math.pow(.1,b)),s.heading+=s.rudder*Hi*Z*Math.sign(z||1)*b;const ne=s.x+s.vx*b,G=s.z+s.vz*b,L=ne+E*ho*2,Q=G+C*ho*2;if(Et(L,Q)>.06)s.x=ne,s.z=G,s.aground+=(0-s.aground)*(1-Math.pow(.05,b));else{s.aground+=(1-s.aground)*(1-Math.pow(.02,b)),Ct(Math.abs(s.speed)*.0012*b*60,"AGROUND — SHE IS TAKING WATER");const ze=Math.pow(.06,b);s.speed*=ze,s.vx*=ze,s.vz*=ze;const et=6,Sn=Et(s.x+et,s.z)-Et(s.x-et,s.z),zn=Et(s.x,s.z+et)-Et(s.x,s.z-et),kn=Math.hypot(Sn,zn)||1;s.x+=Sn/kn*26*b,s.z+=zn/kn*26*b}const te=js(s.x,s.z,0);s.x+=te.vx*b,s.z+=te.vz*b,s.x+=is.x*N*b,s.z+=is.z*N*b;const pe=B.dx*A+B.dz*F;s.heading+=S.clamp(pe*.4,-ls,ls)*N*b;let Ee=Ae[0],_e=1/0;for(const ze of Ae){const et=(s.x-ze.x)**2+(s.z-ze.z)**2;et<_e&&(_e=et,Ee=ze)}if(Ls(b,{danger:te.danger,headingX:Math.sin(s.heading),headingZ:Math.cos(s.heading),toCentreX:Ee.x-s.x,toCentreZ:Ee.z-s.z,speed:s.speed,throttle:s.throttle})>=1||te.danger>.94){const ze=Ee;s.x=ze.x+(ze.x>0?ze.r*1.85:-ze.r*1.85),s.z=ze.z+ze.r*1.5,s.speed=0,s.vx=0,s.vz=0,s.throttle=0,s.heading=Math.PI,s.swallowed+=1,s.aground=1,U.grip=0,Ct(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),w.splash+=1}const ve=Qt(s.x,s.z),Le=S.lerp(1,.055,ve)*S.smoothstep(Et(s.x,s.z),0,.3),Fe=Ke(s.x,s.z,w.t,Le);w.helmActive=!0,w.helmPos.set(s.x,Fe.y+12,s.z),w.helmSpeed=S.clamp(Math.abs(s.speed)/No,0,1);const ut=te.vx*Math.cos(s.heading)-te.vz*Math.sin(s.heading),Me=S.clamp(Math.abs(s.speed)/No,0,1),O=S.clamp(s.rudder*Z*Me*.4+ut*.016,-.5,.5);s.heel+=(O-T*.012-s.heel)*(1-Math.pow(.15,b));const ce=Ke(s.x+E*ho*2.2,s.z+C*ho*2.2,w.t,Le).y,We=S.clamp((s.bowY-ce)/Math.max(b,.001),0,60);s.bowY=ce;const Ce=S.clamp((We-10)/24,0,1)*Me*N;if(s.slam=Math.max(s.slam*Math.pow(.05,b),Ce),Ce>.25){const ze=Math.pow(1-.3*Ce,b);s.vx*=ze,s.vz*=ze}const qe=Me*.1*Math.sign(s.speed>=0?1:-1)+s.slam*.14+s.burstFx*.16;s.trim+=(qe-s.trim)*(1-Math.pow(.1,b));const Be=S.clamp(Me*N*1.15+s.aground*.5+te.danger*.8+s.slam*1.3+s.burstFx,0,1);s.spray+=(Be-s.spray)*(1-Math.pow(.08,b));const Je=i.current;Je&&(Je.position.set(s.x,Fe.y-1.4,s.z),Je.rotation.set(S.clamp(Fe.dz*1.2,-.3,.3)-s.trim,s.heading,S.clamp(-Fe.dx,-.26,.26)+s.heel)),l.current&&(l.current.scale.z=1+Math.sin(w.t*1.6)*.08+s.burstFx*.4,l.current.scale.x=1+N*.06+s.burstFx*.12),h.current&&(h.current.material.opacity=s.spray*.42,h.current.scale.setScalar(.7+s.spray*.55)),c.current&&(c.current.material.opacity=S.clamp(.34*Me+s.burstFx*.3,0,.62)*(.28+N*.72),c.current.scale.set(1+Me*.75+s.drift*.6,1,1+Me*.5)),ln(p,b,s.heading-j);const pt=s.heading+Math.PI+p.smYaw,Pe=Math.cos(p.smPitch),mt=f*3.4*p.smZoom*(1+Me*ke(.26,.1)+s.burstFx*ke(.34,.12))*Ds(n.aspect);s.deckY+=(Fe.y-s.deckY)*(1-Math.pow(ke(2e-4,.05),b));const at=S.lerp(Fe.y,s.deckY,ye.comfort),$e=Ki.set(s.x+Math.sin(pt)*Pe*mt,at+14+Math.sin(p.smPitch)*mt,s.z+Math.cos(pt)*Pe*mt),Ve=Ke($e.x,$e.z,w.t,Le);$e.y=Math.max($e.y,Ve.y+7),n.position.lerp($e,1-Math.pow(ke(6e-4,.02),b));const De=Math.max(0,Math.cos(p.smYaw)),Nt=Me*ke(66,34)*De;n.lookAt(Zi.set(s.x+(E+A*S.clamp(T/40,-.4,.4))*Nt,at+12-s.trim*26*Me*ke(1,.35),s.z+(C+F*S.clamp(T/40,-.4,.4))*Nt));const Ht=ke(1,0);Ht>.001&&n.rotateZ((Math.sin(w.t*2.3)*.012*Me+s.heel*.3+s.aground*Math.sin(w.t*21)*.02+s.slam*Math.sin(w.t*34)*.03+te.danger*Math.sin(w.t*2.7)*.03)*Ht),en(n,60+Me*ke(7,2)+s.burstFx*ke(10,3),b,.06,Os);const jn=Math.hypot(s.x-(K.x+60*W),s.z-(K.z+60*W));jn<90*W&&Math.abs(s.speed)<24&&(w.footSpawn="port",o?.("foot")),w.helm={speed:s.speed,heading:s.heading,throttle:s.throttle,aground:s.aground,x:s.x,z:s.z,toGate:Math.min(Math.hypot(s.x,s.z-Mt),Math.hypot(s.x,s.z-Zt)),underFire:[Mt,Zt].some(ze=>{const et=Math.hypot(s.x,s.z-ze);return et>bo.safe&&et<bo.range}),moored:jn<180*W,maelstrom:te.danger,swallowed:s.swallowed,burst:s.burst,drift:s.drift,maxSpeed:R,cruise:dt.level,flank:s.flank,freeCam:ye.freeCam},Gs(b,w.helm),w.shelter+=(ve-w.shelter)*(1-Math.pow(.06,b)),w.underwater+=(0-w.underwater)*(1-Math.pow(.02,b))}else{ln(p,b,0);const j=_.boost?Qi:cs;s.fyaw+=(p.smYaw-s.fyaw)*(1-Math.pow(1e-4,b)),s.fpitch+=(-p.smPitch-s.fpitch)*(1-Math.pow(1e-4,b));const R=_.walk.x,E=_.walk.z,C=Math.hypot(R,E),A=C>1?C:1,F=-Math.sin(p.smYaw),z=-Math.cos(p.smYaw),T=-z,N=F,I=(F*(E/A)+T*(R/A))*j,B=(z*(E/A)+N*(R/A))*j,Z=1-Math.pow(C>.02?2e-5:4e-7,b);s.fvx+=(I-s.fvx)*Z,s.fvz+=(B-s.fvz)*Z;const ne=s.fvx*b,G=s.fvz*b;if(s.area==="island"){const ae=s.fx+ne,te=s.fz+G,pe=re(s.fx,s.fz),Ee=re(ae,te),_e=Math.hypot(ne,G)||1e-6,Y=(Ee-pe)/_e;(Ee<=.3||Y>=1.2&&Ee>=pe)&&(s.fvx=0,s.fvz=0),Ee>.3&&(Y<1.2||Ee<pe)&&(s.fx=ae,s.fz=te);const ve=re(s.fx,s.fz);s.fy+=(ve+bt-s.fy)*(1-Math.pow(.002,b));const Le=Math.hypot(s.fx-le.x,s.fz-le.z),Fe=Math.hypot(s.fx-V.gate.x,s.fz-V.gate.z);Le<80?(s.area="hall",s.fx=me.x,s.fz=me.z+Xe.zTop,s.fy=me.y+je.y+bt,s.fyaw=0,p.yaw=p.smYaw=0,p.pitch=p.smPitch=.05):Fe<40&&(s.area="hall",s.fx=me.x+60,s.fz=me.z+H.z+150,s.fy=me.y+bt,s.fyaw=Math.PI,p.yaw=p.smYaw=Math.PI,p.pitch=p.smPitch=.04),w.helm={onFoot:!0,area:"island",x:s.fx,z:s.fz,fy:s.fy-me.y,toMouth:Le,toRear:Fe,nearPort:Math.hypot(s.fx-K.x,s.fz-K.z)<K.r*1.4};const ut=Qt(s.fx,s.fz);w.shelter+=(ut-w.shelter)*(1-Math.pow(.06,b))}else{s.fx+=ne,s.fz+=G;const ae=s.fx-me.x,te=s.fz-me.z;let pe=te>je.z-70?je.y:te>Xe.zBottom?S.lerp(0,je.y,(te-Xe.zBottom)/(Xe.zTop-Xe.zBottom)):0;pe=Math.max(pe,Wa(ae,te)),s.fy+=(me.y+pe+bt-s.fy)*(1-Math.pow(.005,b)),te>je.z+34&&(s.area="island",s.fx=le.x,s.fz=le.z+130,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.PI,p.yaw=p.smYaw=Math.PI,p.pitch=p.smPitch=-.04),w.helm={onFoot:!0,area:"hall",x:s.fx,z:s.fz,lz:te,fy:s.fy-me.y},w.shelter+=(1-w.shelter)*(1-Math.pow(.06,b))}const L=Math.hypot(s.fvx,s.fvz);s.stride+=L*b;const Q=Math.min(1,L/cs)*ke(1,.3);n.position.set(s.fx,s.fy+Math.sin(s.stride*.42)*.45*Q,s.fz),n.rotation.set(0,0,0),n.rotateY(s.fyaw),n.rotateX(s.fpitch),n.rotateZ(Math.sin(s.stride*.21)*.016*Q*ke(1,0)),en(n,72,b,.02),w.underwater+=(0-w.underwater)*(1-Math.pow(.02,b))}w.fog=S.lerp(gt.sea,gt.bay,w.shelter),w.rain=1-w.shelter*.92}),t.jsxs("group",{ref:i,position:[0,-4e3,0],visible:e==="helm",children:[x&&t.jsx(ue,{name:d?"ship-sunny.opt.glb":"ship-lion.opt.glb",height:qt(d?"ship-sunny.opt.glb":"ship-lion.opt.glb",58),rotation:Eo(d?"ship-sunny.opt.glb":"ship-lion.opt.glb"),position:[0,-13,0],tint:d?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),x&&m&&t.jsx(ue,{name:"crew-straw.opt.glb",height:15,rotation:0,position:[0,14,6]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!x,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!x,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:l,position:[0,17.5,1.5],visible:!x,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:Te,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!x,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(y=>t.jsxs("mesh",{position:[y*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:3.4,toneMapped:!1})]},y)),t.jsx(Jt,{crew:"straw",width:x?19:14,position:[0,x?38:26,-2]}),t.jsxs("mesh",{ref:c,position:[0,.6,-30],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[18,72]}),t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:h,position:[0,3.4,17],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[26,18]}),t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:st})]})]})}const hs=66,Ji=22,ds=21,el=1.15,tl=.32,ol=.05,nl=.22,sl=70,po=340,us=7,al=6,ps=60,mo=185,rl=new M,ms=new M,fo={x:430*W,z:1e3*W};function il({mode:e,onMode:o}){const n=Se(m=>m.camera),a=Se(m=>m.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=Ne("ship-tang.opt.glb"),d=Ne("ship-sub.opt.glb"),u=c||d,x=Ne("crew-heart.opt.glb"),r=g.useRef({x:fo.x,z:fo.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0}).current,f=Qs({enabled:e==="sub",dom:a.domElement,zoomMin:.42,zoomMax:2.3,pitch0:.22,pitchMin:-1,pitchMax:1.42});return g.useEffect(()=>{if(e==="sub")return r.x=fo.x,r.z=fo.z,r.heading=Math.PI,r.speed=0,r.throttle=0,r.flank=0,r.depth=4,r.orderedDepth=4,r.berthing=0,f.yaw=0,f.smYaw=0,f.pitch=.22,f.smPitch=.22,f.pitch0=.22,f.zoom=1,f.smZoom=1,f.noRecentre=!1,r.heel=0,w.subActive=!0,w.helm=null,qo("sub"),()=>{w.subActive=!1,w.subThrottle=0}},[e,r,f]),J((m,s)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const p=Math.min(s,.05);w.t+=p;const y=r.heading,v=_.boost;r.throttle+=(_.throttle-r.throttle)*(1-Math.pow(.02,p)),r.flank+=((v?1:0)-r.flank)*(1-Math.pow(ol,p)),w.subThrottle=Math.abs(r.throttle),r.rudder+=(_.rudder-r.rudder)*(1-Math.pow(8e-4,p));const b=S.clamp(r.depth/15,0,1),j=hs*(.7+.3*b)*(1+tl*r.flank),R=r.throttle>=0?r.throttle*j:r.throttle*Ji;r.speed+=S.clamp(R-r.speed,-ds*2,ds)*p,r.speed-=r.speed*Math.abs(r.speed)*.0016*p;const E=S.lerp(nl,1,S.clamp(Math.abs(r.speed)/7,0,1));r.heading+=r.rudder*el*E*Math.sign(r.speed>=0?1:-1)*p,r.orderedDepth-=_.planes*sl*p,r.orderedDepth=S.clamp(r.orderedDepth,0,po),_.surfaceQueued&&(_.surfaceQueued=!1,r.orderedDepth=0),_.periscopeQueued&&(_.periscopeQueued=!1,r.orderedDepth=al);const C=r.x+Math.sin(r.heading)*r.speed*p,A=r.z+Math.cos(r.heading)*r.speed*p,F=js(C,A,r.depth);r.x=C+F.vx*p,r.z=A+F.vz*p;const z=F.vx*Math.cos(r.heading)-F.vz*Math.sin(r.heading);r.heading+=z*.008*p;const T=S.clamp(Math.abs(r.speed)/hs,0,1),N=S.clamp(z*.02+r.rudder*E*T*.34,-.6,.6);r.heel+=(N-r.heel)*(1-Math.pow(.12,p)),F.danger>.05&&(r.speed*=Math.pow(1-.22*F.danger,p));const I=re(r.x,r.z),B=Math.max(2,-I-us),Z=r.depth<1.5;r.depth+=(r.orderedDepth-r.depth)*(1-Math.pow(.12,p)),r.depth>B?(r.scrape+=(1-r.scrape)*(1-Math.pow(.02,p)),r.depth=B,r.orderedDepth=Math.min(r.orderedDepth,B-2),Ct(Math.abs(r.speed)*.0016*p*60,"GROUNDED ON THE SHELF"),r.speed*=Math.pow(.3,p)):r.scrape+=(0-r.scrape)*(1-Math.pow(.05,p));const ne=(r.depth-mo)/(po-mo);r.stress=ne>0?Math.min(1,ne*ne):0,r.stress>0&&Ct(r.stress*.06*p,"HULL UNDER PRESSURE — COME UP");const G=r.x+Math.sin(r.heading)*26,L=r.z+Math.cos(r.heading)*26;if(re(G,L)>-r.depth+us*.5){r.speed*=Math.pow(.1,p);const Ve=6,De=re(r.x+Ve,r.z)-re(r.x-Ve,r.z),Nt=re(r.x,r.z+Ve)-re(r.x,r.z-Ve),Ht=Math.hypot(De,Nt)||1;r.x-=De/Ht*20*p,r.z-=Nt/Ht*20*p,r.scrape=Math.max(r.scrape,.5)}const ae=Math.hypot(r.x-V.x,r.z-V.z);if(ae<V.pool*1.1&&r.berthing===0&&(r.berthing=1e-4),r.berthing>0){r.berthing=Math.min(1,r.berthing+p*.5),r.x+=(V.berth.x-r.x)*(1-Math.pow(.1,p)),r.z+=(V.berth.z-r.z)*(1-Math.pow(.1,p)),r.orderedDepth=0,r.speed*=Math.pow(.1,p);let De=Math.atan2(V.dir[0],V.dir[1])+Math.PI-r.heading;for(;De>Math.PI;)De-=Math.PI*2;for(;De<-Math.PI;)De+=Math.PI*2;r.heading+=De*(1-Math.pow(.2,p)),r.berthing>=1&&r.depth<1.2&&(w.footSpawn="rear",w.splash+=1,o?.("foot"))}r.depth<1.5!==Z&&(w.splash+=1);const pe=Ke(r.x,r.z,w.t,1),Ee=1-S.clamp(r.depth/10,0,1),_e=-r.depth+pe.y*Ee,Y=S.clamp((r.orderedDepth-r.depth)*.05,-.34,.34)*Math.sign(r.speed>=0?1:-1)+pe.dz*.8*Ee;r.pitch+=(Y-r.pitch)*(1-Math.pow(.05,p));const ve=i.current;ve&&(ve.position.set(r.x,_e,r.z),ve.rotation.set(r.pitch+r.scrape*Math.sin(w.t*23)*.02,r.heading,-pe.dx*.5*Ee+r.heel)),l.current&&(l.current.rotation.z+=r.throttle*9*p),h.current&&(h.current.visible=r.depth<2.5),w.subPos.set(r.x,_e,r.z),ln(f,p,r.heading-y);const Le=r.heading+Math.PI+f.smYaw,Fe=Math.cos(f.smPitch),ut=S.clamp(r.depth/240,0,1),Me=118*f.smZoom*(1-ut*.2)*Ds(n.aspect),O=rl.set(r.x+Math.sin(Le)*Fe*Me,_e+10+Math.sin(f.smPitch)*Me,r.z+Math.cos(Le)*Fe*Me),ce=re(O.x,O.z);O.y=Math.max(O.y,ce+5),r.depth>10&&(O.y=Math.min(O.y,pe.y-3)),n.position.lerp(O,1-Math.pow(ke(8e-4,.02),p));const We=Math.max(0,Math.cos(f.smYaw)),Ce=T*ke(46,26)*We;ms.set(r.x+Math.sin(r.heading)*Ce,_e+6-r.pitch*30*T*ke(1,.35),r.z+Math.cos(r.heading)*Ce),n.lookAt(ms);const qe=ke(1,0);qe>.001&&n.rotateZ((r.scrape*Math.sin(w.t*19)*.015+r.heel*.35+F.danger*Math.sin(w.t*3.1)*.02)*qe),en(n,64+T*ke(6,2)+r.flank*ke(2,.6),p,.06,Os);const Be=Ke(n.position.x,n.position.z,w.t,1),Je=S.clamp((Be.y-n.position.y-1)/3,0,1);w.underwater+=(Je-w.underwater)*(1-Math.pow(.002,p)),w.depthBelow=Math.max(0,Be.y-n.position.y);const pt=S.lerp(8200,1700,w.underwater);Math.abs(n.far-pt)>20&&(n.far=pt,n.updateProjectionMatrix()),w.shelter+=((ae<V.pool*3?.85:0)-w.shelter)*(1-Math.pow(.06,p));let Pe=Ae[0],mt=1/0;for(const Ve of Ae){const De=(r.x-Ve.x)**2+(r.z-Ve.z)**2;De<mt&&(mt=De,Pe=Ve)}Ls(p,{danger:F.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:Pe.x-r.x,toCentreZ:Pe.z-r.z,speed:r.speed,throttle:r.throttle})>=1&&(Ct(.22,"CAUGHT IN THE VORTEX"),r.x=Pe.x+(r.x>Pe.x?1:-1)*Pe.r*1.9,r.z=Pe.z+Pe.r*1.5,r.speed=0,r.orderedDepth=Math.min(po,r.depth+18),U.grip=0,w.splash+=1);let $e=Math.atan2(V.x-r.x,V.z-r.z)-r.heading;for(;$e>Math.PI;)$e-=Math.PI*2;for(;$e<-Math.PI;)$e+=Math.PI*2;w.helm={sub:!0,speed:r.speed,maxSpeed:j,heading:r.heading,depth:r.depth,orderedDepth:r.orderedDepth,scrape:r.scrape,stress:r.stress,maelstrom:F.danger,toRear:ae,relRear:$e,berthing:r.berthing>0,x:r.x,z:r.z,maxDepth:po,crushDepth:mo,cruise:dt.level,flank:r.flank,freeCam:ye.freeCam,dark:S.clamp((r.depth-ps)/(mo-ps),0,1)},Gs(p,w.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[u&&t.jsx(ue,{name:c?"ship-tang.opt.glb":"ship-sub.opt.glb",height:qt(c?"ship-tang.opt.glb":"ship-sub.opt.glb",24),rotation:Eo(c?"ship-tang.opt.glb":"ship-sub.opt.glb"),position:[0,c?-13:-8,0],tint:c?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:h,position:[0,7.5,-2],children:[x&&t.jsx(ue,{name:"crew-heart.opt.glb",height:9,rotation:0}),t.jsx(Jt,{crew:"heart",width:9,position:[0,5.5,-6]})]}),t.jsxs("group",{visible:!u,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(m=>[0,1,2,3].map(s=>t.jsxs("mesh",{position:[m*5.1,1.2,8-s*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${m}-${s}`)))]}),t.jsxs("mesh",{position:[0,.6,16.2],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,.6,19],scale:[26,26,1],children:t.jsx("spriteMaterial",{map:ll,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:st})}),t.jsxs("mesh",{position:[0,7.4,-13.5],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:l,position:[0,.4,-16.6],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(dl,{})]})}const ll=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e);const i=new eo(o);return i.colorSpace=to,i})(),cl=`
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
`,hl=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function dl(){const e=g.useRef(),o=g.useMemo(()=>{const i=new Float32Array(780),l=new Float32Array(260),h=new Float32Array(260),c=new Float32Array(260);for(let u=0;u<260;u++)i[u*3]=(Math.random()-.5)*3.4,i[u*3+1]=(Math.random()-.5)*2.6,i[u*3+2]=-14-Math.random()*4,l[u]=Math.random(),h[u]=.25+Math.random()*.3,c[u]=2+Math.random()*4;const d=new wt;return d.setAttribute("position",new q(i,3)),d.setAttribute("aPhase",new q(l,1)),d.setAttribute("aRate",new q(h,1)),d.setAttribute("aSize",new q(c,1)),d.boundingSphere=new Dt(new M(0,0,-30),70),d},[]),n=g.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new M(...oe(X.underGlow))}}),[]);return J((a,i)=>{const l=e.current?.uniforms;if(!l)return;l.uTime.value+=i;const h=w.subActive?w.subThrottle*w.underwater:0;l.uGain.value+=(h-l.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:cl,fragmentShader:hl,uniforms:n,transparent:!0,depthWrite:!1,blending:st,fog:!1})})}const qs=.42;let D=null,ct=null,fe=null,cn=!1,nt=!0;function ul(){try{const e=localStorage.getItem("oni.audio");e!==null&&(nt=e==="1")}catch{}return nt}function Ho(e){nt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return ct&&D&&ct.gain.setTargetAtTime(e?qs:0,D.currentTime,.12),e&&D?.state==="suspended"&&D.resume(),nt}function pl(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),a=n.getChannelData(0);for(let i=0;i<o;i++)a[i]=Math.random()*2-1;return n}function Wt(e,o,n,a,i,l,h){const c=e.createBufferSource();c.buffer=o,c.loop=!0;const d=e.createBiquadFilter();d.type=n,d.frequency.value=a,d.Q.value=i;const u=e.createGain();return u.gain.value=l,c.connect(d).connect(u).connect(h),c.start(),{src:c,filt:d,gain:u}}function _o(){if(cn){D?.state==="suspended"&&D.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;D=new e,cn=!0,ct=D.createGain(),ct.gain.value=nt?qs:0;const o=D.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=D.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,ct.connect(n).connect(o).connect(D.destination);const a=pl(D),i=D.createGain();i.gain.value=1,i.connect(ct);const l=Wt(D,a,"bandpass",480,.7,.3,i),h=Wt(D,a,"highpass",1900,.5,0,i),c=Wt(D,a,"lowpass",220,1.1,.22,i),d=Wt(D,a,"lowpass",96,1.6,0,i),u=D.createGain();u.gain.value=1,u.connect(o);const x=D.createOscillator();x.type="sawtooth",x.frequency.value=41;const r=D.createBiquadFilter();r.type="lowpass",r.frequency.value=190,r.Q.value=1.2;const f=D.createGain();f.gain.value=0,x.connect(r).connect(f).connect(u),x.start();const m=D.createOscillator(),s=D.createOscillator(),p=D.createGain();m.frequency.value=.07,s.frequency.value=.113,p.gain.value=260,m.connect(p),s.connect(p),p.connect(l.filt.frequency),m.start(),s.start();const y=D.createGain();y.gain.value=0,y.connect(ct);const v=D.createGain();v.gain.value=.16,v.connect(y);for(const[j,R]of[[146.83,1],[220,.5],[293.66,.3]]){const E=D.createOscillator();E.type="sine",E.frequency.value=j;const C=D.createGain();C.gain.value=R;const A=D.createOscillator(),F=D.createGain();A.frequency.value=.21+Math.random()*.1,F.gain.value=j*.004,A.connect(F).connect(E.frequency),A.start(),E.connect(C).connect(v),E.start()}const b=Wt(D,a,"bandpass",900,3.2,.05,y);return fe={stormBus:i,festBus:y,wind:l,rain:h,sea:c,roar:d,breath:b,buf:a,comp:o,muffle:n,humGain:f,subBus:u},D}function ml(){if(!D||!fe||!nt)return;const e=D.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const a=D.createOscillator(),i=D.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+o),a.frequency.exponentialRampToValueAtTime(1180,e+o+.5),i.gain.setValueAtTime(0,e+o),i.gain.linearRampToValueAtTime(n,e+o+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),a.connect(i).connect(fe.subBus),a.start(e+o),a.stop(e+o+1.5)}}function fl(e=1){if(!D||!fe||!nt)return;const o=D.currentTime,n=D.createBufferSource();n.buffer=fe.buf;const a=D.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,o),a.frequency.exponentialRampToValueAtTime(240,o+.5),a.Q.value=.7;const i=D.createGain();i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(.5*e,o+.02),i.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(a).connect(i).connect(ct),n.start(o),n.stop(o+.9)}function Rt(e,o=1,n=82){if(!D||!fe)return;const a=D.createOscillator(),i=D.createGain();a.type="sine",a.frequency.setValueAtTime(n*2.1,e),a.frequency.exponentialRampToValueAtTime(n,e+.06),a.frequency.exponentialRampToValueAtTime(n*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(o,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(i).connect(fe.festBus),a.start(e),a.stop(e+.7);const l=D.createBufferSource();l.buffer=fe.buf;const h=D.createBiquadFilter();h.type="bandpass",h.frequency.value=1400,h.Q.value=.8;const c=D.createGain();c.gain.setValueAtTime(o*.5,e),c.gain.exponentialRampToValueAtTime(1e-4,e+.09),l.connect(h).connect(c).connect(fe.festBus),l.start(e),l.stop(e+.12)}function xl(e=1,o=0){if(!D||!fe||!nt)return;const n=D.currentTime+o,a=D.createBufferSource();a.buffer=fe.buf,a.loop=!0;const i=D.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,n),i.frequency.exponentialRampToValueAtTime(70,n+2.6),i.Q.value=.9;const l=D.createGain(),h=.5*e;l.gain.setValueAtTime(0,n),l.gain.linearRampToValueAtTime(h,n+.05),l.gain.exponentialRampToValueAtTime(h*.24,n+.7),l.gain.exponentialRampToValueAtTime(h*.42,n+1.35),l.gain.exponentialRampToValueAtTime(1e-4,n+3.4),a.connect(i).connect(l).connect(fe.stormBus),a.start(n),a.stop(n+3.6);const c=D.createOscillator(),d=D.createGain();c.type="sine",c.frequency.setValueAtTime(46,n),c.frequency.exponentialRampToValueAtTime(28,n+2.2),d.gain.setValueAtTime(0,n),d.gain.linearRampToValueAtTime(.32*e,n+.08),d.gain.exponentialRampToValueAtTime(1e-4,n+2.6),c.connect(d).connect(fe.stormBus),c.start(n),c.stop(n+2.8)}function gl(e=.5){if(!D||!fe||!nt)return;const o=D.currentTime;for(const[n,a,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const l=D.createOscillator(),h=D.createGain();l.type="sine",l.frequency.value=61*n,h.gain.setValueAtTime(0,o),h.gain.linearRampToValueAtTime(e*a,o+.008),h.gain.exponentialRampToValueAtTime(1e-4,o+i),l.connect(h).connect(ct),l.start(o),l.stop(o+i+.1)}}let Ye=0,Bo=0,fs=0,$t=0;function wl(e){if(!cn||!D||!fe||!nt)return;const o=D.currentTime,n=e.shelter,a=e.underwater,i=e.subActive?.12:1,l=Math.sin(n*Math.PI*.5)*i*(1-a*.92);fe.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),fe.festBus.gain.setTargetAtTime(l,o,.35),fe.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),fe.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),fe.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),fe.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),o,.3),fe.muffle.frequency.setTargetAtTime(18e3-a*17400,o,.18);const h=e.subActive?a*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(fe.humGain.gain.setTargetAtTime(h,o,.25),e.splash!==fs&&(fs=e.splash,fl(1)),e.subActive&&a>.5?$t===0?$t=o+1.2:o>=$t&&(ml(),$t=o+6.5):$t=0,n>.06){const d=.9090909090909091;for(Ye<o&&(Ye=o+.1);Ye<o+.35;){const u=Bo%8,x=n*.9;u===0?Rt(Ye,.85*x,74):u===2?Rt(Ye,.45*x,88):u===4?Rt(Ye,.7*x,74):u===6?Rt(Ye,.4*x,92):u===7&&(Rt(Ye,.3*x,96),Rt(Ye+d*.5,.36*x,96)),Bo++,Ye+=d}}else Ye=0,Bo=0}function yl(){const e=g.useRef(!1),o=g.useRef(-1);return J(()=>{if(wl(w),w.flash>.55&&!e.current){e.current=!0;const n=w.flashDir,a=500+Math.abs(n.z)*900;xl(Math.min(1,.55+w.flash*.6),a/340)}else w.flash<.08&&(e.current=!1);w.shot!==o.current&&(w.shot===4&&o.current>=0&&gl(.55),o.current=w.shot)}),null}function bl(){return J(()=>di(),-100),null}function vl({every:e=12}){const o=Se(a=>a.gl),n=g.useRef(0);return g.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),J(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function Ml({budget:e}){const o=Se(a=>a.setDpr),n=g.useRef(e.dpr[1]);return t.jsx(oa,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function jl(){const e=Se(a=>a.gl),o=Se(a=>a.scene),n=Se(a=>a.camera);return g.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(o,n)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(a)},[e,o,n]),null}function Sl(){const{camera:e,scene:o,gl:n}=Se();return g.useEffect(()=>{},[e,o,n]),null}const zl=new xe(X.haze),kl=new xe(X.underHaze),Tl=new xe(X.abyss),xs=new xe;function El(){const e=Se(o=>o.scene);return J(()=>{if(!e.fog)return;const o=S.clamp(w.depthBelow/gt.deepGrade,0,1),n=S.lerp(.0062,.0142,o);e.fog.density=S.lerp(w.fog,n,w.underwater),xs.copy(kl).lerp(Tl,o*.8),e.fog.color.lerpColors(zl,xs,w.underwater)}),null}function Rl({quality:e,budget:o,onRails:n,playing:a,speed:i,onShot:l,mode:h,onMode:c}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,w.fog]}),t.jsx(fa,{storm:w}),t.jsx(Er,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(_a,{quality:e,segments:o.segments}),t.jsx(La,{quality:e,storm:w}),t.jsx(tr,{quality:e,shadows:o.shadows}),t.jsx(Pn,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Pn,{quality:e,shadows:!1,z:Zt,k:W*1.5}),t.jsx(rr,{quality:e,shadows:o.shadows}),t.jsx(lr,{quality:e,shadows:o.shadows}),t.jsx(jr,{quality:e}),t.jsx(zr,{shadows:o.shadows}),t.jsx(Oi,{quality:e,shadows:o.shadows}),t.jsx(Pr,{quality:e}),t.jsx(Hr,{quality:e}),t.jsx(Yr,{quality:e}),t.jsx(ni,{quality:e}),t.jsx(wi,{onRails:n&&h==="off",playing:a&&h==="off",speed:i,onShot:l,idle:h!=="off"}),t.jsx(bl,{}),t.jsx(qi,{mode:h,onMode:c}),t.jsx(il,{mode:h,onMode:c}),t.jsx(yl,{}),t.jsx(El,{}),t.jsx(Sl,{}),t.jsx(jl,{}),t.jsx(Ml,{budget:o}),o.shadows&&t.jsx(vl,{every:o.shadowEvery})]})}const Vt="#d63420",Al="rgba(8,6,16,0.72)",gs="(max-width: 860px), (max-height: 520px)",Uo="min(7.5vh, 62px)";function Fl(e=2600,o=!0){const[n,a]=g.useState(!1);return g.useEffect(()=>{if(!o){a(!1);return}let i;const l=()=>{a(!1),clearTimeout(i),i=setTimeout(()=>a(!0),e)};l();for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(h,l,{passive:!0});return()=>{clearTimeout(i);for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(h,l)}},[e,o]),n}function Cl(){const[e,o]=g.useState(()=>typeof window<"u"&&window.matchMedia(gs).matches);return g.useEffect(()=>{const n=window.matchMedia(gs),a=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",a):n.addListener(a),()=>{n.removeEventListener?n.removeEventListener("change",a):n.removeListener(a)}},[]),e}function Ue({on:e,onClick:o,children:n,title:a,wide:i,block:l}){return t.jsx("button",{onClick:o,title:a,style:{appearance:"none",border:`1px solid ${e?Vt:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||l?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:l?"100%":void 0,textAlign:l?"right":"center",minHeight:32},children:n})}function Il({shot:e,shotIndex:o,shotCount:n,total:a,playing:i,onRails:l,speed:h,tier:c,override:d,dev:u,onPlay:x,onRailsToggle:r,onSpeed:f,onQuality:m,onRestart:s,audio:p,onAudio:y,mode:v,onMode:b,stage:j,veiled:R=!1}){const E=v!=="off",C=Cl(),[A,F]=g.useState(!1),[z,T]=g.useState(()=>({...ye}));g.useEffect(()=>_s(Y=>T({...Y})),[]);const N=Fl(2600,!E&&!A),I=g.useRef(),B=g.useRef(),Z=g.useRef(),ne=g.useRef(),G=g.useRef(),L=g.useRef(),Q=l&&!E;g.useEffect(()=>F(!1),[v]),g.useEffect(()=>{let Y,ve=performance.now(),Le=0,Fe=0;const ut=Me=>{if(Y=requestAnimationFrame(ut),I.current&&(I.current.style.transform=`scaleX(${j.progress||0})`),Z.current&&j.helm){const O=j.helm;if(O.onFoot)Z.current.textContent=O.area==="island"?O.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":O.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(O.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(O.sub){const ce=Math.abs(O.speed)*1.94;if(O.berthing)Z.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const We=O.maelstrom>.22?O.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":O.stress>.02?"⚠ HULL UNDER PRESSURE":O.scrape>.3?"HULL ON THE ROCK":"",Ce=Math.abs(O.relRear*180/Math.PI),qe=Ce<6?"· ON COURSE":O.relRear>0?`◀ ${Ce.toFixed(0)}°`:`${Ce.toFixed(0)}° ▶`,Be=10,Je=Math.round(O.depth/O.maxDepth*Be),pt=Math.round(O.crushDepth/O.maxDepth*Be);let Pe="";for(let at=0;at<Be;at++)Pe+=at<Je?at>=pt?"▓":"█":at===pt?"┃":"·";const mt=O.cruise===2?" ⟲FLK":O.cruise===1?" ⟲AHD":"";Z.current.textContent=`DEPTH ${O.depth.toFixed(0).padStart(3,"0")}/${O.orderedDepth.toFixed(0).padStart(3,"0")}m ${Pe}  ${ce.toFixed(0).padStart(2,"0")} KN${mt}
COVE ${Math.round(O.toRear)}m  ${qe}`+(We?`
${We}`:"")}}else{const ce=Math.abs(O.speed)*1.94,We=(O.heading*180/Math.PI+180)%360,Ce=Math.round((O.burst??0)*5),qe=O.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(Ce)}${"·".repeat(5-Ce)}`,Be=O.cruise===2?"  ⟲FLANK":O.cruise===1?"  ⟲AHEAD":O.flank>.5?"  FLANK":"";Z.current.textContent=`${ce.toFixed(0).padStart(2,"0")} KN   BRG ${We.toFixed(0).padStart(3,"0")}°   ${qe}${Be}
`+(O.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":O.moored?"MOORING":O.aground>.3?"AGROUND — HELM OVER":O.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(O.toGate)}m`:O.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(O.toGate)}m`:`GATE ${Math.round(O.toGate)}m`)}}if(ne.current){const O=Br(),ce=_r(U.chain);ne.current.textContent=U.done?"✔ OBJECTIVE COMPLETE":O?`▸ ${U.step+1}/${ce}  ${O.text}`:"",ne.current.style.color=U.done?"#8fe0a0":"#ffd9cf"}if(G.current){const O=Math.max(0,Math.min(1,U.hull)),ce=Math.max(0,Math.min(1,U.grip)),We=Be=>{const Je=Math.round(Be*12);return"█".repeat(Je)+"·".repeat(12-Je)},Ce=O>.6?"#8fe0a0":O>.3?"#ffc46b":"#ff6b5a",qe=ce>.66?"#ff6b5a":ce>.33?"#ffc46b":"rgba(255,255,255,0.45)";G.current.innerHTML=`<span style="color:${Ce}">HULL ${We(O)}</span>`+(ce>.02?`<span style="color:${qe};margin-left:14px">VORTEX ${We(ce)}</span>`:"")}if(L.current){const O=U.banner,ce=L.current;O?(ce.dataset.text!==O.text&&(ce.dataset.text=O.text,ce.innerHTML=`<div class="og-banner-main">${O.text}</div>`+(O.sub?`<div class="og-banner-sub">${O.sub}</div>`:""),ce.style.animation="none",ce.offsetWidth,ce.style.animation=""),ce.style.opacity="1"):(ce.style.opacity="0",ce.dataset.text="")}u&&B.current?(Fe++,Le+=Me-ve,ve=Me,Le>400&&(B.current.textContent=`${Math.round(Fe*1e3/Le)} fps · shelter ${j.shelter.toFixed(2)} · fog ${(j.fog*1e4).toFixed(1)}e-4 · flash ${j.flash.toFixed(2)}`,Le=0,Fe=0)):ve=Me};return Y=requestAnimationFrame(ut),()=>cancelAnimationFrame(Y)},[j,u]);const ae={opacity:N?.16:1,transform:N?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},te=[{key:"rails",on:!l,label:l?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:r,cinematicOnly:!0},{key:"helm",on:v==="helm",label:v==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>b(v==="helm"?"off":"helm")},{key:"sub",on:v==="sub",label:v==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>b(v==="sub"?"off":"sub")},{key:"foot",on:v==="foot",label:v==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>b(v==="foot"?"off":"foot")}],pe=(Y,ve)=>t.jsx(Ue,{on:Y.on,onClick:Y.click,title:Y.title,wide:!0,block:ve,children:Y.label},Y.key),Ee=Y=>E?t.jsxs(t.Fragment,{children:[t.jsx(Ue,{on:z.comfort>.01,wide:!0,block:Y,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:ai,children:z.comfort>.9?"COMFORT · FULL":z.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Ue,{on:z.freeCam,wide:!0,block:Y,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>ko("freeCam"),children:z.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Ue,{on:Math.abs(z.lookSens-1)>.01,wide:!0,block:Y,title:"How far a drag turns the view",onClick:ri,children:`LOOK ${z.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Ue,{on:z.invertY,wide:!0,block:Y,title:"Invert the vertical look axis",onClick:()=>ko("invertY"),children:z.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,_e=Y=>t.jsxs(t.Fragment,{children:[!E&&t.jsxs(t.Fragment,{children:[t.jsx(Ue,{on:i,onClick:x,title:"Play / pause the cinematic",block:Y,children:i?Y?"❙❙  PAUSE":"❙❙":Y?"▶  PLAY":"▶"}),[.5,1,2].map(ve=>t.jsxs(Ue,{on:h===ve,onClick:()=>f(ve),title:`${ve}× speed`,block:Y,children:[ve,"×"]},ve))]}),t.jsx(Ue,{on:!1,onClick:s,title:"Restart from the open sea",block:Y,children:Y?"↺  RESTART":"↺"}),t.jsx(Ue,{on:p,onClick:y,title:"Storm, taiko and a temple bell — all synthesised",block:Y,children:p?Y?"♪  SOUND ON":"♪":Y?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Ue,{on:d!=="auto",wide:!0,block:Y,title:"Render tier",onClick:()=>m(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${c.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!R&&t.jsxs(t.Fragment,{children:[[0,1].map(Y=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[Y?"bottom":"top"]:0,height:Q?Uo:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},Y)),t.jsxs("div",{className:"og-tategaki",style:{opacity:E||A?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:E?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${Vt}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:E?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:I,style:{height:"100%",background:`linear-gradient(90deg, ${Vt}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${Vt}`}})}),t.jsx("div",{className:`og-chrome${E?"":" og-chrome-bottom"}`,style:{...E?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...ae},children:C?t.jsxs(t.Fragment,{children:[E&&t.jsx(Ue,{on:!0,onClick:()=>b("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(Ue,{on:A,onClick:()=>F(Y=>!Y),title:"Menu",children:A?"✕":"☰"}),A&&t.jsxs("div",{className:"og-menu",children:[E&&t.jsxs(t.Fragment,{children:[Ee(!0),t.jsx("div",{className:"og-menu-rule"})]}),te.filter(Y=>!(Y.cinematicOnly&&E)).map(Y=>pe(Y,!0)),t.jsx("div",{className:"og-menu-rule"}),_e(!0)]})]}):t.jsxs(t.Fragment,{children:[Ee(!1),_e(!1),te.filter(Y=>!(Y.cinematicOnly&&E)).map(Y=>pe(Y,!1))]})}),!E&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...ae,pointerEvents:"none"},children:[l?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM",t.jsx("span",{style:{opacity:.5},children:l?`  ·  ${Math.round(a)}s`:""})]}),E&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:ne,className:"og-objective"}),t.jsx("div",{ref:Z,className:"og-readout"}),t.jsx("div",{ref:G,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:v==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":v==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":"WASD MOVE · SHIFT RUN · DRAG LOOK · R LEVEL VIEW"})]}),E&&t.jsx("div",{ref:L,className:"og-banner"}),u&&t.jsx("div",{ref:B,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Al,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${Q?Uo:"0px"};
          --og-bottom: ${Q?Uo:"0px"};
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
          color: ${Vt};
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
      `})]})}const Wo="#d63420",Gl=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Ll({onPick:e}){const[o,n]=g.useState(!1),a=g.useRef(),i=620,l=d=>{o||(n(!0),e(d))},[h,c]=g.useState(!1);return g.useEffect(()=>{if(!o)return;const d=setTimeout(()=>c(!0),i);return()=>clearTimeout(d)},[o]),g.useEffect(()=>{const d=u=>{(u.key==="Escape"||u.key==="Enter")&&l("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),h?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Gl.map((d,u)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+u*.07}s`},onClick:()=>l(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${Wo};
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
          border-color: ${Wo};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Wo};
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
      `})]})}const vn="#d63420",Mn="#4aa9c9",Pl=(e,o,n)=>e<o?o:e>n?n:e;function Js(e,o,n){const a=g.useRef(o);a.current=o;const i=g.useRef(null),l=g.useRef({x:0,y:0});g.useEffect(()=>{const h=e.current;if(!h||!n)return;const c=x=>{if(i.current===null){i.current=x.pointerId,l.current={x:x.clientX,y:x.clientY};try{h.setPointerCapture?.(x.pointerId)}catch{}a.current.onMove(0,0,x.clientX,x.clientY),x.preventDefault()}},d=x=>{if(x.pointerId!==i.current)return;const r=l.current;a.current.onMove(x.clientX-r.x,x.clientY-r.y,r.x,r.y),x.preventDefault()},u=x=>{x.pointerId===i.current&&(i.current=null,a.current.onEnd(),x.preventDefault())};return h.addEventListener("pointerdown",c),h.addEventListener("pointermove",d),h.addEventListener("pointerup",u),h.addEventListener("pointercancel",u),()=>{h.removeEventListener("pointerdown",c),h.removeEventListener("pointermove",d),h.removeEventListener("pointerup",u),h.removeEventListener("pointercancel",u)}},[e,n])}function Ol({label:e,sub:o,onDown:n,onUp:a,tone:i="plain",wide:l=!1}){const[h,c]=g.useState(!1),d=g.useRef();g.useEffect(()=>{const x=d.current;if(!x)return;let r=null;const f=s=>{r=s.pointerId;try{x.setPointerCapture?.(r)}catch{}c(!0),n(),s.preventDefault(),s.stopPropagation()},m=s=>{s.pointerId===r&&(r=null,c(!1),a(),s.preventDefault(),s.stopPropagation())};return x.addEventListener("pointerdown",f),x.addEventListener("pointerup",m),x.addEventListener("pointercancel",m),x.addEventListener("pointerleave",m),()=>{x.removeEventListener("pointerdown",f),x.removeEventListener("pointerup",m),x.removeEventListener("pointercancel",m),x.removeEventListener("pointerleave",m)}},[n,a]);const u=i==="hot"?vn:i==="cool"?Mn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${h?u:"rgba(255,255,255,0.18)"}`,background:h?`color-mix(in srgb, ${u} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:h?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function It({label:e,sub:o,onTap:n,on:a,tone:i="plain",wide:l=!1}){const h=g.useRef(),c=g.useRef(n);c.current=n,g.useEffect(()=>{const u=h.current;if(!u)return;const x=r=>{c.current(),r.preventDefault(),r.stopPropagation()};return u.addEventListener("pointerdown",x),()=>u.removeEventListener("pointerdown",x)},[]);const d=i==="hot"?vn:i==="cool"?Mn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:h,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${a?d:"rgba(255,255,255,0.18)"}`,background:a?`color-mix(in srgb, ${d} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:a?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Dl(){const[e,o]=g.useState(dt.level);return g.useEffect(()=>ci(o),[]),t.jsx(It,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:Bs})}function Nl({simple:e=!1}){const[o,n]=g.useState(ye.freeCam);g.useEffect(()=>_s(i=>n(i.freeCam)),[]);const a=g.useRef(null);return e?t.jsx(It,{label:"LEVEL",sub:"view",onTap:()=>_.recentreQueued=!0}):t.jsx(It,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const i=performance.now();if(a.current&&i-a.current<420){a.current=null,ko("freeCam"),_.recentreQueued=!0;return}a.current=i,_.recentreQueued=!0}})}function Hl({active:e}){const o=g.useRef(),n=g.useRef(),a=g.useRef(),i=78;return g.useEffect(()=>{if(!e)return;let l;const h=()=>{l=requestAnimationFrame(h);const c=a.current,d=w.helm;c&&(c.textContent=d?.sub?String(Math.round(d.orderedDepth)):"⇕")};return l=requestAnimationFrame(h),()=>cancelAnimationFrame(l)},[e]),Js(o,{onMove:(l,h,c,d)=>{const u=o.current;if(!u)return;const x=u.getBoundingClientRect(),r=x.top+x.height/2,f=Pl((d+h-r)/i,-1,1),m=Math.abs(f)<.1?0:f;ee.active=!0,ee.planes=-m;const s=n.current;s&&(s.style.transform=`translate(-50%, calc(-50% + ${f*i}px))`,s.style.borderColor=Mn,s.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{ee.planes=0;const l=n.current;l&&(l.style.transform="translate(-50%, -50%)",l.style.borderColor="rgba(255,255,255,0.3)",l.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:a,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function _l({mode:e}){const o=g.useRef(),n=g.useRef(),a=g.useRef(),i=g.useRef(),l=62,h=7,c=g.useRef(e);if(c.current=e,Js(o,{onMove:(x,r,f,m)=>{const s=Math.hypot(x,r),p=s>l?l/s:1,y=x*p,v=r*p,b=n.current,j=a.current;b&&(b.style.transform=`translate(${f-l}px, ${m-l}px)`,b.style.opacity="1"),j&&(j.style.transform=`translate(${f+y-26}px, ${m+v-26}px)`,j.style.opacity="1"),i.current&&(i.current.style.opacity="0");const R=Math.abs(y)<h?0:y/l,E=Math.abs(v)<h?0:v/l;ee.active=!0,c.current==="foot"?(ee.walk.x=R,ee.walk.z=-E):(ee.throttle=-E,ee.rudder=-R)},onEnd:()=>{n.current&&(n.current.style.opacity="0"),a.current&&(a.current.style.opacity="0"),i.current&&(i.current.style.opacity=""),ee.throttle=0,ee.rudder=0,ee.walk.x=0,ee.walk.z=0}},e!=="off"),g.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),g.useEffect(()=>()=>{ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0},[e]),e==="off")return null;const d=e==="sub",u=e==="foot";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:o,style:{position:"fixed",left:0,bottom:0,width:"50vw",height:"62vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:n,style:{position:"fixed",left:0,top:0,width:l*2,height:l*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:a,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${vn}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:i,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:u?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[d&&t.jsx(Hl,{active:!0}),t.jsxs("div",{className:"og-actions",children:[d&&t.jsx(It,{label:"SURFACE",sub:"blow all",onTap:()=>_.surfaceQueued=!0}),d&&t.jsx(It,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>_.periscopeQueued=!0}),e==="helm"&&t.jsx(It,{label:"BURST",sub:"coup de",tone:"cool",onTap:()=>_.burstQueued=!0}),!u&&t.jsx(Dl,{}),t.jsx(Ol,{label:u?"RUN":"FLANK",sub:u?"»":"over",tone:"hot",onDown:()=>ee.boost=!0,onUp:()=>ee.boost=!1}),t.jsx(Nl,{simple:u})]})]}),t.jsx("style",{children:`
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
      `})]})}const ws={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function Bl(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const Ul=null;function Xl(){const e=g.useMemo(()=>!1,[]),[o]=g.useState(Bl),[n,a]=g.useState("auto"),i=n==="auto"?o:n,l=ws[i]??ws.high;g.useEffect(()=>{Va(l.scene!=="low")},[l.scene]),g.useMemo(()=>Ms(l.scene),[l.scene]),g.useMemo(()=>li(),[]),g.useEffect(()=>hi(),[]);const h=g.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[c,d]=g.useState(0),[u,x]=g.useState(!0),[r,f]=g.useState(!0),[m,s]=g.useState(1),[p,y]=g.useState(os[0]),[v,b]=g.useState(0),[j,R]=g.useState(ul),[E,C]=g.useState(()=>{if(typeof location>"u")return"off";const L=new URLSearchParams(location.search).get("mode");return L==="helm"||L==="sub"||L==="foot"?L:"off"});g.useEffect(()=>{if(!j)return;const L=()=>{_o(),Ho(!0)};for(const Q of["pointerdown","keydown","touchstart"])window.addEventListener(Q,L,{once:!0,passive:!0});return()=>{for(const Q of["pointerdown","keydown","touchstart"])window.removeEventListener(Q,L)}},[j]);const A=g.useCallback(()=>{R(L=>{const Q=!L;return Q&&_o(),Ho(Q),Q})},[]),[F,z]=g.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),T=g.useCallback(L=>{j&&(_o(),Ho(!0)),L==="off"?(w.jumpTo=0,x(!0),f(!0)):C(L),z(!0)},[j]),[N,I]=g.useState(!1),B=g.useRef(!0);g.useEffect(()=>{if(Us(),B.current){B.current=!1;return}I(!0);const L=setTimeout(()=>I(!1),210);return()=>clearTimeout(L)},[E]);const Z=g.useCallback((L,Q)=>{b(L),y(Q)},[]),ne=g.useCallback(()=>{$a(),d(L=>L+1),x(!0),f(!0)},[]),G=g.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(g.Suspense,{fallback:null,children:t.jsx(Ul,{})}):t.jsxs(t.Fragment,{children:[t.jsx(na,{shadows:l.shadows,dpr:l.dpr,gl:{antialias:l.aa,powerPreference:"high-performance",toneMapping:da,toneMappingExposure:ua,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(g.Suspense,{fallback:null,children:t.jsx(Rl,{quality:l.scene,budget:l,onRails:r,playing:u,speed:m,onShot:Z,mode:E,onMode:C},c)})}),h&&F&&t.jsx(_l,{mode:E}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:N?1:0,transition:N?"opacity .2s ease-in":"opacity .42s ease-out"}}),!F&&t.jsx(Ll,{onPick:T}),t.jsx(Il,{veiled:!F,shot:p,shotIndex:v,shotCount:os.length,total:rn,playing:u,onRails:r,speed:m,tier:i,override:n,dev:G,onPlay:()=>x(L=>!L),onRailsToggle:()=>f(L=>!L),onSpeed:s,onQuality:a,onRestart:ne,audio:j,onAudio:A,mode:E,onMode:C,stage:w})]})}export{Xl as default};
