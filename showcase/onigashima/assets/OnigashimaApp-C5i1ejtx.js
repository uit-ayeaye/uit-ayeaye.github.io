var _s=Object.defineProperty;var Us=(e,s,o)=>s in e?_s(e,s,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[s]=o;var Ao=(e,s,o)=>Us(e,typeof s!="symbol"?s+"":s,o);import{r as g,u as Q,j as t,d as Ws,f as ye,h as $s,i as Vs}from"./vendor-C2HIMx-P.js";import{t as fe,c as v,aD as uo,au as Mo,d as jo,a5 as je,aJ as Ys,f as Xs,Y as Go,a0 as Fo,ag as E,h as Y,aK as Ks,ay as Zs,az as yt,aA as bt,M as Ae,o as Ne,at as it,ax as et,aL as Gt,aM as Ft,aq as qs,a4 as Qs,a8 as tt,ar as vt,aC as Js,A as en}from"./three-Zo_RlN_K.js";import{f as xt,m as gs}from"./index-D3NXMYYa.js";const $={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},k={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},gt={sea:.00105,bay:48e-5},tn=1.15;function se(e){const s=new fe(e);return[s.r,s.g,s.b]}const on=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,sn=`
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
    float disc = smoothstep(0.99900, 0.99938, md);
    float halo = pow(max(md, 0.0), 700.0) * 0.42 + pow(max(md, 0.0), 70.0) * 0.10;
    float veil = 1.0 - cover * 0.85;
    col += uMoonCol * (disc * 2.2 + halo) * veil;

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
`;function nn({storm:e}){const s=g.useRef(),o=g.useMemo(()=>({uTime:{value:0},uHigh:{value:new v(...se($.skyHigh))},uLow:{value:new v(...se($.skyLow))},uCloud:{value:new v(...se($.cloud))},uCloudLit:{value:new v(...se($.cloudLit))},uEmber:{value:new v(...se(k.ember))},uFlash:{value:0},uFlashColor:{value:new v(...se($.boltGlow))},uFlashDir:{value:new v(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new v(.72,.52,-.44).normalize()},uMoonCol:{value:new v(...se("#f2e9cf"))},uUnder:{value:0},uUnderCol:{value:new v(...se($.underHaze))}}),[]);return Q((a,i)=>{const l=s.current?.uniforms;l&&(l.uTime.value+=i,l.uFlash.value=e?.flash??0,e?.flashDir&&l.uFlashDir.value.copy(e.flashDir),l.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:s,vertexShader:on,fragmentShader:sn,uniforms:o,side:uo,depthWrite:!1,depthTest:!1,fog:!1})]})}const H=1.9,_=e=>e*H,de={x:0,z:_(-60)},Ve=_(300),Bt=_(175),an=118,ee={x:0,z:_(-352),r:_(178),baseY:268,squash:[1.16,1.02,.9]},ws=[[-.361,.301,.883],[.361,.301,.883]],ys=[0,.02,.9998],bs=[0,-.419,.908];function So(e,s=1){const[o,a,i]=ee.squash;return{x:ee.x+e[0]*ee.r*o*s,y:ee.baseY+e[1]*ee.r*a*s,z:ee.z+e[2]*ee.r*i*s}}const xe=ws.map(e=>So(e)),ae={...So(bs),halfWidth:74,height:62};So(ys,.94);const W={x:_(-152),y:4.5,z:_(-104),r:_(78)},Lo=2.35,nt=[Math.sin(Lo),Math.cos(Lo)],D=(()=>{const e=Ve+Bt*.35,s=de.x+nt[0]*e,o=de.z+nt[1]*e;return{x:s,z:o,pool:_(46),benchY:3.6,reach:_(560),gate:{x:s-nt[0]*_(44),z:o-nt[1]*_(44)},berth:{x:s+nt[0]*_(12),z:o+nt[1]*_(12)},dir:nt}})(),Ee=[{x:_(-470),z:_(120),r:_(150),depth:30,dir:1,speed:30},{x:_(470),z:_(-30),r:_(165),depth:34,dir:-1,speed:32}];function vs(e,s,o=0){let a=0,i=0;const l=1-ze(8,34,o);if(l<=0)return{vx:a,vz:i,danger:0};let h=0;for(const c of Ee){const d=e-c.x,m=s-c.z,x=Math.hypot(d,m);if(x>c.r*1.7||x<.001)continue;const r=x/c.r,n=1-ze(1,1.6,r),p=c.speed*(r/.3)*Math.exp(1-r/.3)*.62*n,u=c.speed*.55*Math.exp(-r*r*2.6)*n+c.speed*.1*n,f=1/x;a+=(-m*f*p*c.dir-d*f*u)*l,i+=(d*f*p*c.dir-m*f*u)*l,h=Math.max(h,(1-ze(.05,.55,r))*l)}return{vx:a,vz:i,danger:h}}const Ms={x:0,halfWidth:_(96)},Lt=_(258),rn=0,_t=_(1500),Wt=e=>e<0?0:e>1?1:e;function ln(e,s,o=4){let a=0,i=1,l=1,h=0;for(let c=0;c<o;c++){const d=1-Math.abs(xt(e*l,s*l,1)*2-1);a+=d*d*i,h+=i,i*=.52,l*=2.07}return a/h}const ze=(e,s,o)=>{const a=Wt((o-e)/(s-e));return a*a*(3-2*a)};function cn(e){if(e>_(430))return 1e4;const s=1-ze(_(430),_(205),e),o=ze(_(150),_(-30),e);return Ms.halfWidth+s*_(620)+o*_(300)}function hn(e){const s=(1-Math.cos(e))*.5,o=Math.sin(e);let a=an;return a+=s*190,a+=Math.max(0,o)*46,a-=Math.max(0,-o)*26,a}function ne(e,s){const o=e-de.x,a=s-de.z,i=Math.hypot(o,a),l=Math.atan2(o,a),h=(i-Ve)/Bt,c=Math.exp(-h*h*1.35)*hn(l),d=Math.max(0,i-Ve-Bt*.55),m=-Math.pow(d/210,1.6)*175,x=Math.max(0,Ve-Bt*.5-i),r=-ze(0,150,x)*46,n=Wt(c/60),p=(ln(e*.0052/H+13,s*.0052/H-21,4)-.42)*168*n,u=(xt(e*.0042/H+31,s*.0042/H-17,4)-.5)*84*n,f=(xt(e*.021-5,s*.021+9,3)-.5)*17*n;let w=c+m+r+p+u+f;const b=cn(s),T=1-ze(b,b+_(105),Math.abs(e-Ms.x)),R=1-ze(_(-40),_(-190),s),L=T*R;w=w*(1-L)+Math.min(w,-34)*L;const S=Math.hypot(e-ee.x,s-ee.z);w+=Math.exp(-Math.pow(S/(ee.r*1.55),2))*62;const G=(e-W.x)/_(76),A=(s-W.z)/_(58),j=(1-ze(.72,1.18,Math.hypot(G,A)))*Wt((w+34)/34);w=w*(1-j)+W.y*j;const M=e-D.x,z=s-D.z;if(Math.abs(M)+Math.abs(z)<D.reach+_(140)){const O=Math.max(0,Math.min(D.reach,M*D.dir[0]+z*D.dir[1])),V=M-D.dir[0]*O,q=z-D.dir[1]*O,te=Math.hypot(V,q),ue=_(30)+O/D.reach*_(48),N=1-ze(ue,ue+_(62),te);w=w*(1-N)+Math.min(w,-26)*N;const C=Math.hypot(M,z),X=1-ze(D.pool*.55,D.pool,C);w=w*(1-X)+Math.min(w,-14)*X;const Se=(e-D.gate.x)/_(30),ve=(s-D.gate.z)/_(24),B=1-ze(.72,1.18,Math.hypot(Se,ve));w=w*(1-B)+D.benchY*B}return w}function zo(e,s,o=3){const a=ne(e+o,s)-ne(e-o,s),i=ne(e,s+o)-ne(e,s-o),l=-a,h=2*o,c=-i,d=Math.hypot(l,h,c)||1;return[l/d,h/d,c/d]}function dn(e,s,o=3){return Math.acos(zo(e,s,o)[1])}function Rt(e,s){const o=ze(_(250),_(40),s),a=1-ze(Ve-_(40),Ve+_(90),Math.hypot(e-de.x,s-de.z)),i=(1-ze(_(60),_(170),Math.hypot(e-D.x,s-D.z)))*.85;return Wt(Math.max(Math.min(o,a),i))}const js=[{dir:[.1,-1],amp:7.5,len:187},{dir:[-.42,-.91],amp:3.4,len:97},{dir:[.71,-.7],amp:1.6,len:61}],un=Math.PI*2;function pn(e,s,o){let a=0,i=0,l=0;for(const h of Ee){const c=e-h.x,d=s-h.z,m=Math.max(1,Math.hypot(c,d));if(m>h.r*1.75)continue;const x=m/h.r,r=Math.exp(-3*x*x);a-=h.depth*r;const n=h.depth*6*x*r/h.r;i+=n*(c/m),l+=n*(d/m);const p=Math.atan2(d,c),u=Math.sin(p*3*h.dir+x*14-o*2.2),f=x*Math.exp(1-x)*(1-mn(x));a+=u*f*1.6}return{y:a,dx:i,dz:l}}function mn(e){const s=Math.min(1,Math.max(0,(e-1)/.6));return s*s*(3-2*s)}function Qe(e,s,o,a=1){let i=0,l=0,h=0;for(const d of js){const m=un/d.len,x=Math.sqrt(9.81/m),r=Math.hypot(d.dir[0],d.dir[1]),n=d.dir[0]/r,p=d.dir[1]/r,u=m*(n*e+p*s-x*o),f=d.amp*a;i+=f*Math.sin(u);const w=f*m*Math.cos(u);l+=w*n,h+=w*p}const c=pn(e,s,o);return i+=c.y,l+=c.dx,h+=c.dz,{y:i,dx:l,dz:h}}const fn=js.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),xn=Ee.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),gn=Ee.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),wn=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*H).toFixed(1)}, ${(250*H).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(Ve-40*H).toFixed(1)}, ${(Ve+90*H).toFixed(1)},
      length(p - vec2(${de.x.toFixed(1)}, ${de.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*H).toFixed(1)}, ${(170*H).toFixed(1)},
      length(p - vec2(${D.x.toFixed(1)}, ${D.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,yn=`
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
${wn}

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
${fn}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${xn}

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
`,bn=`
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
${gn}
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
`;function vn(e,s){const o=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let l=0;l<e;l++){const h=de.x+((l+.5)/e-.5)*s,c=de.z+((i+.5)/e-.5)*s,d=ne(h,c),m=E.clamp(-d/46,0,1),x=(i*e+l)*4;o[x]=Math.round(m*255),o[x+1]=o[x],o[x+2]=o[x],o[x+3]=255}const a=new Ys(o,e,e,Xs);return a.minFilter=Go,a.magFilter=Go,a.wrapS=Fo,a.wrapT=Fo,a.needsUpdate=!0,a}const Po={low:96,mid:168,high:248},Io=4200;function Mn({quality:e="high",storm:s}){const o=g.useRef(),{geometry:a,uniforms:i,landTex:l}=g.useMemo(()=>{const h=Po[e]??Po.high,c=new Mo(Io,Io,h,h);c.rotateX(-Math.PI/2),c.translate(de.x,0,de.z);const d=_t*1.05,m=vn(e==="low"?160:256,d),x={uTime:{value:0},uLand:{value:m},uSpan:{value:d},uCentre:{value:new jo(de.x,de.z)},uDeep:{value:new v(...se($.seaDeep))},uShallow:{value:new v(...se($.seaShallow))},uFoam:{value:new v(...se($.foam))},uSkyLow:{value:new v(...se($.skyLow))},uGilt:{value:new v(...se(k.gilt))},uEmber:{value:new v(...se(k.ember))},uFogColor:{value:new v(...se($.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new v(...se($.abyss))},uUnderGlow:{value:new v(...se($.underGlow))},uDepthFade:{value:0},uEyeA:{value:new v(xe[0].x,xe[0].y,xe[0].z)},uEyeB:{value:new v(xe[1].x,xe[1].y,xe[1].z)},uFlash:{value:0},uFlashColor:{value:new v(...se($.boltGlow))},uCameraPos:{value:new v}};return{geometry:c,uniforms:x,landTex:m}},[e]);return Q((h,c)=>{const d=o.current?.uniforms;if(!d)return;d.uTime.value+=c,d.uCameraPos.value.copy(h.camera.position),d.uFlash.value=s?.flash??0,d.uFogDensity.value=s?.fog??.0011;const m=Math.min(1,Math.max(0,(s?.depthBelow??0)/70));d.uDepthFade.value=m,Co.copy(Sn).lerp(zn,m*.8),d.uFogColor.value.lerpVectors(jn,Co,s?.underwater??0)}),t.jsx("mesh",{geometry:a,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:yn,fragmentShader:bn,uniforms:i,transparent:!1,side:je},l.uuid)})}const jn=new v(...se($.haze)),Sn=new v(...se($.underHaze)),zn=new v(...se($.abyss)),Co=new v;function kn({quality:e="high",segments:s=200}){const o=g.useMemo(()=>{const a=s,i=new Mo(_t,_t,a,a);i.rotateX(-Math.PI/2);const l=i.attributes.position,h=l.count,c=new Float32Array(h*3),d=new fe($.rock),m=new fe($.rockLit),x=new fe("#0b0e18"),r=new fe($.snow),n=new fe(k.rockWarm),p=new fe;for(let u=0;u<h;u++){const f=l.getX(u)+de.x,w=l.getZ(u)+de.z,b=ne(f,w);l.setX(u,f),l.setY(u,b),l.setZ(u,w);const T=zo(f,w,_t/a)[1],R=Math.max(0,(T-.55)/.45);p.copy(d).lerp(m,E.clamp(b/190,0,1));const L=1-E.clamp((b-rn)/13,0,1);p.lerp(x,L*.85);const S=E.clamp((f-de.x)/260,0,1),G=96-S*42,A=E.clamp((b-G)/60,0,1)*R;p.lerp(r,A*(.45+S*.5));const j=Math.hypot(f-ee.x,w-ee.z),M=Math.exp(-Math.pow(j/330,2)),z=E.clamp((w-ee.z)/260,0,1);p.lerp(n,M*z*.6*(1-A)),c[u*3]=p.r,c[u*3+1]=p.g,c[u*3+2]=p.b}return i.setAttribute("color",new Y(c,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[s]);return t.jsx("mesh",{geometry:o,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const y={t:0,flash:0,flashDir:new v(0,.4,-1),fog:gt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new v(0,0,0),helmActive:!1,helmPos:new v(0,0,0),subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new v(0,60,-200)}};function Tn(){y.t=0,y.progress=0,y.flash=0,y.fog=gt.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const We=ws.map(e=>new v(...e).normalize()),Ss=new v(...ys).normalize(),po=new v(...bs).normalize();function En(e){let s=1;s+=Math.max(0,e.y)*.1,s-=Math.pow(Math.max(0,e.y),4)*.2;const o=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);s+=o*.13;for(const d of We){const m=e.dot(d),x=Math.pow(Math.max(0,m),46);s-=x*.3}const a=Math.max(0,e.dot(Ss)),i=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);s-=i*.19;for(const d of We){const m=new v(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);s+=Math.pow(Math.max(0,m),26)*.075}const l=Math.max(0,e.dot(po));s-=Math.pow(l,30)*.11,s-=Math.pow(Math.max(0,-e.y),3)*.28;const h=Math.pow(Math.max(0,e.dot(We[0])),30)+Math.pow(Math.max(0,e.dot(We[1])),30),c=1-Math.min(1,h);return s+=(xt(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*c,s+=(xt(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*c,s}function Do(e,s){const o=e,a=[new v(o*74,96,-20),new v(o*142,176,-58),new v(o*196,268,-76),new v(o*222,356,-52),new v(o*206,424,8),new v(o*154,462,72)],i=new yt(a),l=s==="low"?14:s==="mid"?22:34,h=s==="low"?6:10,c=new bt(i,l,1,h,!1),d=c.attributes.position;for(let m=0;m<=l;m++){const x=m/l,r=34*Math.pow(1-x,.72)*(1+Math.sin(x*Math.PI)*.16),n=i.getPoint(x);for(let p=0;p<=h;p++){const u=m*(h+1)+p;if(u>=d.count)continue;const f=d.getX(u)-n.x,w=d.getY(u)-n.y,b=d.getZ(u)-n.z;d.setXYZ(u,n.x+f*r,n.y+w*r,n.z+b*r)}}return d.needsUpdate=!0,c.computeVertexNormals(),c}const Rn={low:4,mid:6,high:7};function An({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=g.useRef(),{dome:l,hornL:h,hornR:c,teeth:d}=g.useMemo(()=>{const u=new Ks(ee.r,Rn[e]??7),f=u.attributes.position,w=new Float32Array(f.count*3),b=new fe($.rock),T=new fe(k.rockWarm),R=new fe("#120b10"),L=new fe,S=new v;for(let M=0;M<f.count;M++){S.set(f.getX(M),f.getY(M),f.getZ(M)).normalize();const z=ee.r*En(S),[O,V,q]=ee.squash;f.setXYZ(M,S.x*z*O,S.y*z*V,S.z*z*q);const te=Math.max(Math.pow(Math.max(0,S.dot(We[0])),5),Math.pow(Math.max(0,S.dot(We[1])),5),Math.pow(Math.max(0,S.dot(po)),6)*.9);L.copy(b).lerp(T,Math.min(1,te*1.5+Math.max(0,S.z)*.22));const ue=Math.max(Math.pow(Math.max(0,S.dot(We[0])),40),Math.pow(Math.max(0,S.dot(We[1])),40));L.lerp(R,ue),w[M*3]=L.r,w[M*3+1]=L.g,w[M*3+2]=L.b}u.setAttribute("color",new Y(w,3)),u.computeVertexNormals();const G=new Zs(1,1,1),A=[],j=9;for(let M=0;M<j;M++){const z=M/(j-1)*2-1,O=ae.halfWidth*2.1,V=z*O*.5,q=Math.pow(Math.abs(z),1.7)*14,te=46-Math.abs(z)*13+M%2*7;A.push({pos:[V,ae.height*.5-q-te*.5,6],scale:[O/j*.76,te,52],rot:z*.13})}return G.dispose?.(),{dome:u,hornL:Do(-1,e),hornR:Do(1,e),teeth:A}},[e]);Q(()=>{const u=y.t,f=.82+.18*Math.sin(u*2.3)*Math.sin(u*.71),w=.82+.18*Math.sin(u*1.9+2.1)*Math.sin(u*.63),b=.86+.14*Math.sin(u*1.4+.8);o.current&&(o.current.emissiveIntensity=5.2*f+y.flash*2),a.current&&(a.current.emissiveIntensity=5.2*w+y.flash*2),i.current&&(i.current.emissiveIntensity=3.4*b)});const m=s,[x,r,n]=ee.squash,p=(u,f)=>[u.x*ee.r*x*f,u.y*ee.r*r*f,u.z*ee.r*n*f];return t.jsxs("group",{position:[ee.x,ee.baseY,ee.z],children:[t.jsx("mesh",{geometry:l,castShadow:m,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:h,castShadow:m,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:c,castShadow:m,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),We.map((u,f)=>t.jsxs("mesh",{position:p(u,.82),rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[44,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:f===0?o:a,color:k.furnace,emissive:k.ember,emissiveIntensity:5.2,toneMapped:!1,side:je,roughness:1})]},f)),t.jsxs("mesh",{position:p(Ss,.87),rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[19,34,3]}),t.jsx("meshStandardMaterial",{color:k.emberDeep,emissive:k.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:p(po,.96),children:[t.jsxs("mesh",{position:[0,30,-62],children:[t.jsx("planeGeometry",{args:[ae.halfWidth*2.3,ae.height*1.8]}),t.jsx("meshStandardMaterial",{ref:i,color:k.ember,emissive:k.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:je})]}),d.map((u,f)=>t.jsxs("mesh",{position:u.pos,scale:u.scale,rotation:[0,0,u.rot],castShadow:m,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:k.emberDeep,emissiveIntensity:.42,roughness:.78})]},f))]})]})}function Pe({matrices:e,target:s}){const o=g.useRef(!1);return Q(()=>{if(o.current||!s.current)return;const a=Math.min(e.length,s.current.count);for(let i=0;i<a;i++)s.current.setMatrixAt(i,e[i]);s.current.instanceMatrix.needsUpdate=!0,s.current.computeBoundingSphere(),o.current=!0}),null}const ct=190,De=130,Pt=9.5;function Oo(e,s,o,a=24){const i=new yt(e),l=new bt(i,a,1,4,!1),h=l.attributes.position,c=new v(0,1,0),d=new v,m=new v,x=new v,r=new v,n=new v;for(let p=0;p<=a;p++){const u=p/a;i.getPointAt(u,m),i.getTangentAt(u,d),r.crossVectors(d,c).normalize(),x.crossVectors(r,d).normalize();for(let f=0;f<=4;f++){const w=p*5+f;if(w>=h.count)continue;const b=f/4*Math.PI*2+Math.PI/4,T=Math.cos(b)*s*.7071,R=Math.sin(b)*o*.7071;n.copy(m).addScaledVector(r,T).addScaledVector(x,R),h.setXYZ(w,n.x,n.y,n.z)}}return h.needsUpdate=!0,l.computeVertexNormals(),l}function Gn(e,s,o,a=40){const i=[];for(let d=0;d<=10;d++){const m=d/10*2-1;i.push(new v(m*e,-30*(1-m*m),0))}const l=new yt(i),h=new bt(l,a,o,8,!1),c=h.attributes.position;for(let d=0;d<=a;d++){const m=d/a*2-1,x=1+(1-m*m)*.85,r=l.getPointAt(d/a);for(let n=0;n<=8;n++){const p=d*9+n;p>=c.count||c.setXYZ(p,r.x+(c.getX(p)-r.x)*x,r.y+(c.getY(p)-r.y)*x,r.z+(c.getZ(p)-r.z)*x)}}return c.needsUpdate=!0,h.computeVertexNormals(),h}function Fn({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),h=g.useMemo(()=>{const p=ct/2,u=De,f=Oo([new v(-p-40,u+6,0),new v(-p-22,u+15.5,0),new v(0,u+20,0),new v(p+22,u+15.5,0),new v(p+40,u+6,0)],16,9,30),w=Oo([new v(-p-30,u+2,0),new v(0,u+8,0),new v(p+30,u+2,0)],11,5,18);return{kasagi:f,shimaki:w,rope:Gn(p-6,30,6.4,44)}},[]),{tileM:c,merlonM:d,cannonM:m,lanternM:x}=g.useMemo(()=>{const p=new Ae,u=new Ne,f=new v,w=new v,b=[],T=e==="low"?26:54;for(let A=0;A<T;A++){const j=A/(T-1)*2-1,M=j*(ct/2+40),z=De+20-Math.pow(Math.abs(j),1.9)*14+5,O=-Math.sign(j)*Math.pow(Math.abs(j),3)*.5;w.set(M,z,0),u.setFromEuler(new it(0,0,O)),f.set(1,1,1),b.push(p.clone().compose(w,u,f))}const R=[];for(const A of[-1,1])for(let j=0;j<7;j++)w.set(A*(58+j*12),26,0),u.identity(),f.set(1,1,1),R.push(p.clone().compose(w,u,f));const L=[];for(const A of[-1,1])for(let j=0;j<2;j++)for(let M=0;M<4-j;M++)w.set(A*(64+M*13+j*6),32+j*10,8),u.setFromEuler(new it(Math.PI/2-.16,0,0)),f.set(1,1,1),L.push(p.clone().compose(w,u,f));const S=[],G=e==="low"?10:22;for(let A=0;A<G;A++){const j=A/(G-1)*2-1,M=j*(ct/2-12),z=30*(1-j*j);w.set(M,De-34-z-7.5,0),u.identity(),f.set(1,1,1),S.push(p.clone().compose(w,u,f))}return{tileM:b,merlonM:R,cannonM:L,lanternM:S}},[e]);Q(()=>{const p=y.t;o.current&&(o.current.material.emissiveIntensity=2.6+Math.sin(p*3.1)*.22+Math.sin(p*7.7)*.1+y.flash*1.4)});const r=ct/2,n=s;return t.jsxs("group",{position:[0,0,Lt],scale:H,children:[[-1,1].map(p=>t.jsxs("group",{position:[p*r,0,0],children:[t.jsxs("mesh",{position:[0,De/2-30,0],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[Pt*.86,Pt,De+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[Pt*1.5,Pt*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},p)),t.jsxs("mesh",{position:[0,De-26,0],castShadow:n,children:[t.jsx("boxGeometry",{args:[ct+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:h.shimaki,castShadow:n,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:h.kasagi,castShadow:n,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(Pe,{matrices:c,target:a})]}),t.jsxs("mesh",{position:[0,De-6,0],castShadow:n,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,De-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:h.rope,position:[0,De-34,2],castShadow:n,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(p=>{const u=30*(1-(p/(ct/2-6))**2);return t.jsx("group",{position:[p,De-34-u-4,2],children:[0,1,2].map(f=>t.jsxs("mesh",{position:[f%2?1.1:-1.1,-2.4-f*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:je})]},f))},p)}),[-1,1].map(p=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[p*108,6,0],castShadow:n,receiveShadow:n,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[p*108,30,6],castShadow:n,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.88})]}),t.jsxs("mesh",{position:[p*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},p)),t.jsxs("instancedMesh",{ref:l,args:[null,null,d.length],castShadow:n,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(Pe,{matrices:d,target:l})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,m.length],castShadow:n,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(Pe,{matrices:m,target:i})]}),t.jsxs("instancedMesh",{ref:o,args:[null,null,x.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Pe,{matrices:x,target:o})]})]})}const Ln=(()=>{if(typeof document>"u")return null;const e=128,s=document.createElement("canvas");s.width=s.height=e;const o=s.getContext("2d"),a=o.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),o.fillStyle=a,o.fillRect(0,0,e,e),o.translate(e/2,e/2);for(let l=0;l<4;l++){const h=o.createLinearGradient(0,0,e/2,0);h.addColorStop(0,"rgba(255,255,255,0.95)"),h.addColorStop(1,"rgba(255,255,255,0)"),o.fillStyle=h,o.beginPath(),o.moveTo(0,-2.5),o.lineTo(e/2,0),o.lineTo(0,2.5),o.closePath(),o.fill(),o.rotate(Math.PI/2)}const i=new Gt(s);return i.colorSpace=Ft,i})();function Pn(e,s,o,a){const i=[];for(let l=0;l<=a;l++){const h=l/a,c=h*2-1;i.push(new v(e[0]+(s[0]-e[0])*h,e[1]+(s[1]-e[1])*h-o*(1-c*c),e[2]+(s[2]-e[2])*h))}return i}const In=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function Cn({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{lanternM:h,lampM:c,pilingM:d,katanaY:m,ground:x}=g.useMemo(()=>{const p=new Ae,u=new Ne,f=new v(1,1,1),w=new v,b=[],T=e==="low"?.42:e==="mid"?.72:1;for(const[G,A,j]of In){const M=Math.max(4,Math.round(j*T)),z=Pn(G,A,14,M);for(let O=1;O<z.length-1;O++){const V=.78+O*37%11/22;w.copy(z[O]).add(new v(0,-4.2*V,0)),u.setFromEuler(new it(0,O*1.7%Math.PI,(O%3-1)*.06)),b.push(p.clone().compose(w,u,f.clone().multiplyScalar(V)))}}const R=[],L=e==="low"?6:11;for(let G=0;G<L;G++){const A=G/(L-1);for(const j of[-1,1]){const M=E.lerp(W.x+46,ae.x-6,A)+j*(26-A*9),z=E.lerp(W.z-26,ae.z+32,A);w.set(M,ne(M,z)+5,z),u.identity(),R.push(p.clone().compose(w,u,f))}}const S=[];for(let G=0;G<16;G++){const A=G%2,j=Math.floor(G/2);w.set(W.x+30+j*17,-2,W.z+34+A*26),u.setFromEuler(new it(0,0,(G%3-1)*.035)),S.push(p.clone().compose(w,u,f))}return{lanternM:b,lampM:R,pilingM:S,katanaY:ne(W.x+118,W.z-58),ground:W.y}},[e]);Q(()=>{const p=y.t;if(o.current&&(o.current.material.emissiveIntensity=2.4+Math.sin(p*2.7)*.2+Math.sin(p*6.1+1.3)*.12+y.flash*1.6),l.current){const u=46*(1+Math.sin(p*1.3)*.13);l.current.scale.set(u,u,1),l.current.material.rotation=p*.07}});const r=s,n=(p,u)=>ne(W.x+p,W.z+u);return t.jsxs("group",{children:[t.jsxs("group",{position:[W.x,0,W.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(p=>t.jsxs("group",{position:[52+p*26,1.5,92+p%2*13],rotation:[0,.4+p*.3,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:je})]})]},p))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(Pe,{matrices:d,target:i})]}),t.jsxs("group",{position:[W.x+118,m,W.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:r,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:l,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:Ln,color:k.furnace,transparent:!0,opacity:.75,blending:et,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(p=>{const u=96+p*4,f=88*p;return t.jsxs("group",{position:[W.x+u,n(u,f),W.z+f],rotation:[0,-p*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:r,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:r,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(w=>t.jsxs("mesh",{position:[w*3,37,4],rotation:[0,0,w*.3],castShadow:r,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},w)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.9,side:je})]})]},p)}),[-1,1].map(p=>{const u=40+p*34,f=-18+p*46;return t.jsxs("group",{position:[W.x+u,n(u,f)+12,W.z+f],rotation:[0,p*.8,0],children:[t.jsxs("mesh",{castShadow:r,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(w=>t.jsxs("mesh",{position:[w*5,7,-1],rotation:[0,0,w*-.5],castShadow:r,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},w)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:k.ember,emissive:k.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:je})]})]},p)}),t.jsxs("group",{position:[W.x-34,n(-34,30)+2,W.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:r,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.88,side:je,emissive:k.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(p,u)=>{const f=u/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(f)*26,55.5,Math.sin(f)*26],rotation:[0,-f,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},u)}),Array.from({length:10},(p,u)=>{const f=u/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(f)*32,44,Math.sin(f)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.5,toneMapped:!1})]},u)})]}),[0,1,2,3].map(p=>{const u=8+p*30,f=-70-p%2*14;return t.jsxs("group",{position:[W.x+u,n(u,f),W.z+f],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:p%2?"#e8dcc4":k.vermilion,roughness:.95,side:je})]})]},p)}),[0,1,2].map(p=>{const u=.28+p*.24,f=E.lerp(W.x+46,ae.x,u),w=E.lerp(W.z-26,ae.z+26,u),b=ne(f,w),T=1-p*.1;return t.jsxs("group",{position:[f,b,w],scale:T,children:[[-1,1].map(R=>t.jsxs("mesh",{position:[R*15,17,0],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.7})]},R)),t.jsxs("mesh",{position:[0,36,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:r,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.75})]})]},p)}),t.jsx("group",{position:[W.x,x,W.z],children:t.jsxs("instancedMesh",{ref:o,args:[null,null,h.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(Pe,{matrices:h,target:o})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:r,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:k.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(Pe,{matrices:c,target:a})]})]})}const No={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function Dn(e){let s=e>>>0;return()=>(s=Math.imul(s,1664525)+1013904223>>>0,s/4294967296)}function On({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{pineTrunkM:h,pineCanopyM:c,sakuraM:d,rockM:m}=g.useMemo(()=>{const r=No[e]??No.high,n=Dn(20250801),p=new Ae,u=new Ne,f=new v,w=new v,b=new v(0,1,0),T=new v,R=[],L=[],S=[],G=r.pine+r.sakura+r.rock;let A=0,j=0;for(;A<G&&j<G*60;){j++;const M=n()*Math.PI*2,z=Ve*(.55+n()*.62),O=de.x+Math.sin(M)*z,V=de.z+Math.cos(M)*z,q=ne(O,V);if(q<5||q>300||dn(O,V,6)>.72||Math.hypot(O-ee.x,V-ee.z)<ee.r*1.35)continue;const te=O>de.x+(n()-.5)*90,ue=A;if(A++,w.set(O,q,V),ue<r.rock){const N=zo(O,V,5);T.set(N[0],N[1],N[2]),u.setFromUnitVectors(b,T),u.multiply(new Ne().setFromEuler(new it(n()*.5,n()*6.28,n()*.5)));const C=2.5+n()*7;f.set(C*(.7+n()*.6),C*(.5+n()*.5),C*(.7+n()*.6)),w.y-=C*.25,S.push(p.clone().compose(w,u,f))}else if(te){if(R.length>=r.pine)continue;u.setFromEuler(new it(0,n()*6.28,(n()-.5)*.09));const N=.72+n()*.7;f.set(N,N*(.85+n()*.45),N),R.push(p.clone().compose(w,u,f))}else{if(L.length>=r.sakura)continue;u.setFromEuler(new it(0,n()*6.28,(n()-.5)*.13));const N=.7+n()*.75;f.set(N,N*(.8+n()*.5),N),L.push(p.clone().compose(w,u,f))}}return{pineTrunkM:R.map(M=>M.clone().multiply(Nn)).concat(L.map(M=>M.clone().multiply(_n))),pineCanopyM:R.map(M=>M.clone().multiply(Hn)),sakuraM:L.map(M=>M.clone().multiply(Bn)),rockM:S}},[e]),x=s;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:o,args:[null,null,h.length],castShadow:x,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(Pe,{matrices:h,target:o})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,c.length],castShadow:x,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:$.pine,roughness:.93,flatShading:!0}),t.jsx(Pe,{matrices:c,target:a})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:x,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:k.sakura,roughness:.95,flatShading:!0,emissive:k.sakura,emissiveIntensity:.1}),t.jsx(Pe,{matrices:d,target:i})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,m.length],castShadow:x,receiveShadow:x,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:$.rock,roughness:.97,flatShading:!0}),t.jsx(Pe,{matrices:m,target:l})]})]})}const Nn=new Ae().makeTranslation(0,7,0),Hn=new Ae().makeTranslation(0,26,0),Bn=new Ae().compose(new v(0,13,0),new Ne,new v(1,.72,1)),_n=new Ae().compose(new v(0,5,0),new Ne,new v(.75,.62,.75)),qt=new Map;let zs=!0;function Un(e){zs=!!e}function Wn(e){const s=gs(e);return qt.has(s)||qt.set(s,fetch(s,{method:"HEAD"}).then(o=>o.ok?!(o.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),qt.get(s)}function Re(e){const[s,o]=g.useState(!1);return g.useEffect(()=>{let a=!0;return Wn(e).then(i=>{a&&o(i&&zs)}),()=>{a=!1}},[e]),s}function $n({url:e,height:s,rotation:o,tint:a,emissive:i,emissiveIntensity:l}){const{scene:h}=Ws(e),c=g.useMemo(()=>h.clone(!0),[h]),d=g.useMemo(()=>{const m=new qs().setFromObject(c),x=new v;m.getSize(x);const r=x.y>1e-4?s/x.y:1,n=new v;return m.getCenter(n),{scale:r,offset:[-n.x*r,-m.min.y*r,-n.z*r]}},[c,s]);return g.useEffect(()=>{c.traverse(m=>{if(m.isMesh&&(m.castShadow=!0,m.receiveShadow=!0,a&&m.material)){const x=Array.isArray(m.material)?m.material:[m.material];for(const r of x)r.color?.multiply(new fe(a)),i&&r.emissive&&(r.emissive.set(i),r.emissiveIntensity=l??.2)}})},[c,a,i,l]),t.jsx("group",{rotation:[0,o,0],scale:d.scale,position:d.offset,children:t.jsx("primitive",{object:c})})}class Vn extends g.Component{constructor(){super(...arguments);Ao(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(o){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ce({name:e,height:s,rotation:o=0,position:a=[0,0,0],tint:i=null,emissive:l=null,emissiveIntensity:h=.2,fallback:c=null}){const d=gs(e);return Re(e)?t.jsx("group",{position:a,children:t.jsx(Vn,{url:d,fallback:c,children:t.jsx(g.Suspense,{fallback:c,children:t.jsx($n,{url:d,height:s,rotation:o,tint:i,emissive:l,emissiveIntensity:h})})})}):t.jsx("group",{position:a,children:c})}const Ue=Math.PI,Ho={"ship-sunny.opt.glb":Ue/2,"ship-tang.opt.glb":Ue/2,"ship-punk.opt.glb":Ue/2,"ship-lion.opt.glb":Ue/2,"ship-bone.opt.glb":Ue/2,"ship-junk.opt.glb":Ue/2,"ship-warjunk.opt.glb":Ue/2,"ship-sub.opt.glb":-Ue/2},Xt=e=>e&&Ho[e]!==void 0?Ho[e]:Ue/2,Bo={"ship-sunny.opt.glb":78,"ship-punk.opt.glb":84,"ship-tang.opt.glb":32,"ship-lion.opt.glb":76,"ship-bone.opt.glb":82,"ship-junk.opt.glb":56,"ship-warjunk.opt.glb":88},Kt=(e,s)=>e&&Bo[e]!==void 0?Bo[e]:s,Ut=160,mt=112,kt="#e6dfcf",ks="#0c0a15",ft=ks;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,s,o,a,i){const l=Math.min(i??0,Math.abs(o)/2,Math.abs(a)/2);return this.moveTo(e+l,s),this.arcTo(e+o,s,e+o,s+a,l),this.arcTo(e+o,s+a,e,s+a,l),this.arcTo(e,s+a,e,s,l),this.arcTo(e,s,e+o,s,l),this.closePath(),this});function ht(e){if(typeof document>"u")return null;const s=document.createElement("canvas");s.width=Ut,s.height=mt;const o=s.getContext("2d"),a=o.createLinearGradient(0,0,0,mt);a.addColorStop(0,"#14101f"),a.addColorStop(.5,ks),a.addColorStop(1,"#08060f"),o.fillStyle=a,o.fillRect(0,0,Ut,mt),o.fillStyle="rgba(255,255,255,0.07)",o.fillRect(0,0,5,mt),o.save(),o.translate(Ut/2+4,mt/2);try{e(o)}catch(l){console.warn("[onigashima] flag emblem skipped",l)}o.restore();const i=new Gt(s);return i.colorSpace=Ft,i.anisotropy=4,i}function Qt(e,s,o=kt){e.fillStyle=o,e.beginPath(),e.ellipse(0,-s*.12,s,s*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-s*.52,s*.6,s*1.04,s*.5,s*.16),e.fill()}function Jt(e,s,o=1){e.save(),e.fillStyle=ft,e.beginPath(),e.ellipse(-s*.38,-s*.2,s*.27*o,s*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(s*.38,-s*.2,s*.27*o,s*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,s*.06),e.lineTo(-s*.14,s*.34),e.lineTo(s*.14,s*.34),e.closePath(),e.fill(),e.restore()}function _o(e,s,o=4){e.save(),e.fillStyle=ft;for(let a=1;a<o;a++){const i=-s*.5+a*s/o;e.fillRect(i-s*.035,s*.6,s*.07,s*.5)}e.fillRect(-s*.52,s*.78,s*1.04,s*.05),e.restore()}function Uo(e,s,o=kt){e.save(),e.strokeStyle=o,e.lineWidth=s*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-s*1.55,s*.55),e.lineTo(s*1.55,s*.55),e.stroke(),e.fillStyle=o;for(const i of[-1,1])for(const l of[-.16,.16])e.beginPath(),e.arc(i*s*1.55,s*.55+l*s,s*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Yn={straw:ht(e=>{Uo(e,26),Qt(e,26),Jt(e,26),_o(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:ht(e=>{const o="#a8e8d4";e.fillStyle=o,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=ft;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=ft,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:ht(e=>{Uo(e,26,"#d8cfc0"),e.fillStyle=kt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=ft;for(const o of[-1,1])e.save(),e.translate(o*26*.4,-26*.3),e.rotate(o*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let o=0;o<6;o++){const a=-15.6+o*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:ht(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let o=0;o<5;o++){const a=o/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:ht(e=>{e.fillStyle=kt;for(const o of[-1,1])e.beginPath(),e.moveTo(o*25*.5,-25*.85),e.lineTo(o*25*1.02,-25*1.72),e.lineTo(o*25*1.06,-25*.6),e.closePath(),e.fill();Qt(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Jt(e,25,.85),e.save(),e.fillStyle=ft,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=kt;for(const o of[-1,1])e.beginPath(),e.moveTo(o*25*.3,25*.7),e.lineTo(o*25*.42,25*1.42),e.lineTo(o*25*.16,25*.78),e.closePath(),e.fill()}),beasts:ht(e=>{e.fillStyle="#cfd8e4";for(const o of[-1,1])e.beginPath(),e.moveTo(o*26*.62,-26*.78),e.quadraticCurveTo(o*26*1.5,-26*1.5,o*26*1.18,-26*2),e.quadraticCurveTo(o*26*1.42,-26*1.35,o*26*.86,-26*.5),e.closePath(),e.fill();Qt(e,26,"#cfd8e4"),Jt(e,26),_o(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Ts={value:0},Wo=new Map;function Xn(e){const s=Wo.get(e);if(s)return s;const o=Yn[e],a=new Qs({map:o,emissiveMap:o,emissive:new fe("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:je,transparent:!1});return a.onBeforeCompile=i=>{i.uniforms.uTime=Ts,i.vertexShader=`uniform float uTime;
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
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Wo.set(e,a),a}function Kn(){return Q((e,s)=>{Ts.value+=Math.min(s,.05)}),null}const Zn=(()=>{const e=new Mo(1,1,14,5);return e.translate(.5,0,0),e})();function At({crew:e="straw",width:s=16,position:o=[0,0,0],rotation:a=Math.PI/2,staff:i=!0}){const l=g.useMemo(()=>Xn(e)??null,[e]),h=s*(mt/Ut);return l?t.jsxs("group",{position:o,rotation:[0,a,0],children:[i&&t.jsxs("mesh",{position:[0,h*.1,0],children:[t.jsx("cylinderGeometry",{args:[s*.018,s*.018,h*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:Zn,material:l,scale:[s,h,s]})]}):null}const $o=(()=>{if(typeof document>"u")return null;const e=64,s=128,o=document.createElement("canvas");o.width=e,o.height=s;const a=o.getContext("2d"),i=a.createImageData(e,s);for(let h=0;h<s;h++){const c=h/(s-1),d=Math.pow(1-c,1.7);for(let m=0;m<e;m++){const x=m/(e-1)*2-1,r=Math.max(0,1-Math.abs(x)/(.35+c*.65)),n=.45+.55*Math.pow(Math.abs(x)/(.35+c*.65),1.5),p=d*Math.pow(r,1.4)*n,u=(h*e+m)*4;i.data[u]=255,i.data[u+1]=255,i.data[u+2]=255,i.data[u+3]=Math.round(Math.min(1,p)*255)}}a.putImageData(i,0,0);const l=new Gt(o);return l.colorSpace=Ft,l})(),eo=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:k.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:96,off:-66,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:k.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",height2:58,model:"ship-lion.opt.glb",height:56,tint:"#c98a52",crew:"crew-straw.opt.glb",crewH:13},{id:"kid",flag:"kid",lead:84,off:74,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",height2:62,model:"ship-bone.opt.glb",height:60,tint:"#9a6a4e",crew:"crew-punk.opt.glb",crewH:12},{id:"heart",flag:"heart",lead:150,off:190,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",height2:24,model:"ship-sub.opt.glb",height:21,tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:k.lantern,model:"ship-junk.opt.glb",height:44,tint:"#8a7a62",crew:"crew-samurai.opt.glb",crewH:11},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:k.lantern,model:"ship-junk.opt.glb",height:40,tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:k.lantern,model:"ship-junk.opt.glb",height:46,tint:"#6e6a54",crew:"crew-samurai.opt.glb",crewH:11},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:k.lantern,model:"ship-junk.opt.glb",height:38,tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:k.lantern,model:"ship-junk.opt.glb",height:36,tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:k.lantern,model:"ship-junk.opt.glb",height:40,tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:k.lantern,model:"ship-junk.opt.glb",height:42,tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:k.lantern,model:"ship-junk.opt.glb",height:37,tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:k.lantern,model:"ship-junk.opt.glb",height:35,tint:"#6a5c47"}];function qn(e){const s=E.lerp(820*H,150*H,e);return[(Math.sin(e*2.4)*54-e*26)*H,s]}function Qn({spec:e,quality:s}){const o=g.useRef(),a=g.useRef(),i=g.useRef();Q(()=>{const n=o.current;if(!n)return;const p=E.clamp(y.progress*.82+.04,0,1),[u,f]=qn(p),w=u+e.off*H*.94,b=f-e.lead*H*.98,T=Rt(w,b),R=E.clamp(-ne(w,b)/46,0,1),L=E.lerp(1,.055,T)*E.smoothstep(R,0,.28),S=Qe(w,b,y.t,L),G=e.sub?E.smoothstep(y.progress,.42,.6):0;n.position.set(w,S.y-(e.sub?4.5:1.2)*e.scale-G*40,b);const A=e.sub?.35:1;n.rotation.x=E.clamp(S.dz*1.35*A,-.32,.32),n.rotation.z=E.clamp(-S.dx*1.15*A,-.28,.28),n.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-T)*.75)*(1-G))});const l=e.scale,h=s==="low"?6:10,c=Re(e.model2??""),d=Re(e.model??""),m=c?e.model2:d?e.model:null,x=Kt(m,c?e.height2:e.height),r=Re(e.crew??"");return m?t.jsxs("group",{ref:o,children:[t.jsx(ce,{name:m,height:x,rotation:Xt(m),position:[0,-x*.18,0],tint:c?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),r&&t.jsx(ce,{name:e.crew,height:e.crewH,rotation:0,position:[0,x*.2,2*l]}),e.flag&&t.jsx(At,{crew:e.flag,width:x*(e.sub?.5:.32),position:[0,x*(e.sub?.55:.66),-4*l],staff:!!e.sub}),t.jsxs("mesh",{position:[0,x*.5,-8*l],children:[t.jsx("sphereGeometry",{args:[1.6,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:$o,color:$.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:o,children:[t.jsxs("group",{scale:l,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,h]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:je,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(n=>[0,1,2,3].map(p=>t.jsxs("mesh",{position:[n*5.6,3.4,-6+p*4],rotation:[0,0,n*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${n}-${p}`))),e.flag&&t.jsx(At,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:$o,color:$.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Vo({x:e,z:s,yaw:o,name:a,height:i,tint:l,sunk:h=.18,flag:c=null}){const d=Kt(a,i),m=g.useRef(),x=Re(a);return Q(()=>{const r=m.current;if(!r)return;const n=Rt(e,s),p=E.clamp(-ne(e,s)/46,0,1),u=E.lerp(1,.055,n)*E.smoothstep(p,0,.28),f=Qe(e,s,y.t,u);r.position.set(e,f.y-1.5,s),r.rotation.set(E.clamp(f.dz*1.1,-.25,.25),o+Math.sin(y.t*.22+e)*.04,E.clamp(-f.dx,-.22,.22))}),t.jsxs("group",{ref:m,children:[t.jsx(ce,{name:a,height:d,rotation:Xt(a),position:[0,-d*h,0],tint:l,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),c&&x&&t.jsx(At,{crew:c,width:d*.3,position:[0,d*.62,-4]})]})}const Jn=[{x:-190*H,z:320*H,yaw:.35},{x:168*H,z:438*H,yaw:-.55},{x:-88*H,z:540*H,yaw:.12}],ea=[{x:W.x+132*H*.72,z:W.z+96*H*.72,yaw:2.3},{x:W.x+168*H*.72,z:W.z+40*H*.72,yaw:1.9},{x:W.x+96*H*.72,z:W.z+150*H*.72,yaw:2.7}];function ta({quality:e="high"}){const s=g.useMemo(()=>e==="low"?eo.slice(0,4):e==="mid"?eo.slice(0,9):eo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Kn,{}),s.map(o=>t.jsx(Qn,{spec:o,quality:e},o.id)),e!=="low"&&Jn.map((o,a)=>t.jsx(Vo,{...o,name:"ship-warjunk.opt.glb",height:64,tint:"#8a8560",flag:"beasts"},`picket-${a}`)),e!=="low"&&ea.map((o,a)=>t.jsx(Vo,{...o,name:"ship-junk.opt.glb",height:40,tint:"#7e7058",flag:"kozuki"},`moored-${a}`))]})}const oa="#2e2a33",mo="#3a4152",fo=$.snow,$t="#cfe0f4";function Yo({position:e}){return t.jsx("group",{position:e,children:t.jsx(ce,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:mo,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:mo,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:$t,emissive:$t,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:fo,roughness:.9})]})]})})})}function sa({shadows:e=!0}){const s=g.useMemo(()=>Math.atan2(D.dir[0],D.dir[1]),[]);return t.jsxs("group",{position:[D.gate.x,D.benchY,D.gate.z],rotation:[0,s,0],children:[[0,1,2,3].map(o=>t.jsxs("mesh",{position:[0,.7+o*1.3,6-o*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-o*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:mo,roughness:.92})]},o)),t.jsx(ce,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:oa,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:fo,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:fo,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(o=>t.jsxs("mesh",{position:[o,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},o)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(o=>t.jsxs("mesh",{position:[o,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:je})]},o)),[-9,9].map(o=>t.jsxs("mesh",{position:[o,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:$t,emissive:$t,emissiveIntensity:1.4,toneMapped:!1})]},o))]})}),t.jsx(Yo,{position:[-14,0,10]}),t.jsx(Yo,{position:[14,0,10]}),[-8,0,8].map(o=>t.jsxs("mesh",{position:[o+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},o))]})}const It=new fe,xo={color:"#7fd8c8",intensity:9e3,distance:320},to={color:"#ffc48a",intensity:12e3,distance:300},na=new fe(xo.color),aa={low:1,mid:2,high:4},dt=[{pos:[W.x,40,W.z],color:k.lantern,intensity:16e3,distance:460*H*.65},{pos:[0,78,Lt],color:k.lantern,intensity:15e3,distance:430},{pos:[ae.x,ae.y+6,ae.z-30],color:k.emberDeep,intensity:3e4,distance:640},{pos:[D.gate.x,30,D.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function ra({quality:e="high",shadowMap:s=2048,shadows:o=!0}){const a=g.useRef(),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=g.useRef(),m=ye(r=>r.camera),x=aa[e]??5;return Q(()=>{if(a.current){a.current.intensity=y.flash*9e3;const p=y.flashDir;a.current.position.set(p.x*700,260+p.y*500,de.z+p.z*700)}const r=y.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(r*2.3)*Math.sin(r*.71))),l.current&&(l.current.intensity=62e3*(.86+.14*Math.sin(r*1.9+2.1)*Math.sin(r*.63)));const n=y.inside;if(c.current&&(c.current.intensity=.16+n*.3),d.current&&(d.current.intensity=.34+n*.26),h.current){const p=h.current,u=.06;let f=dt[0],w=1/0;for(const b of dt){const T=(m.position.x-b.pos[0])**2+(m.position.z-b.pos[2])**2;T<w&&(w=T,f=b)}if(y.subActive&&w>550*550){const b=y.subPos,T=Math.min(1,y.underwater/.35);p.position.x+=(b.x-p.position.x)*.3,p.position.y+=(b.y+14-p.position.y)*.3,p.position.z+=(b.z-p.position.z)*.3,It.set(to.color).lerp(na,T),p.color.lerp(It,u),p.intensity+=(E.lerp(to.intensity,xo.intensity,T)-p.intensity)*u,p.distance=E.lerp(to.distance,xo.distance,T)}else if(y.helmActive&&w>550*550){const b=y.helmPos;p.position.x+=(b.x-p.position.x)*.25,p.position.y+=(b.y+16-p.position.y)*.25,p.position.z+=(b.z-p.position.z)*.25,p.color.lerp(It.set(k.lantern),u),p.intensity+=(11e3-p.intensity)*u,p.distance=300}else p.position.x+=(f.pos[0]-p.position.x)*u,p.position.y+=(f.pos[1]-p.position.y)*u,p.position.z+=(f.pos[2]-p.position.z)*u,p.color.lerp(It.set(f.color),u),p.intensity+=(f.intensity-p.intensity)*u,p.distance=f.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:c,intensity:.16,color:$.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[$.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:o,"shadow-mapSize":[s,s],"shadow-camera-left":-520*(H/1.55),"shadow-camera-right":520*(H/1.55),"shadow-camera-top":520*(H/1.55),"shadow-camera-bottom":-520*(H/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:x>=2?[xe[0].x,xe[0].y,xe[0].z]:[(xe[0].x+xe[1].x)/2,xe[0].y,xe[0].z],color:k.ember,intensity:62e3,distance:1250,decay:2}),x>=2&&t.jsx("pointLight",{ref:l,position:[xe[1].x,xe[1].y,xe[1].z],color:k.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:h,position:dt[0].pos,color:dt[0].color,intensity:dt[0].intensity,distance:dt[0].distance,decay:2}),x>=3&&t.jsx("pointLight",{position:[ae.x,ae.y+4,ae.z-34],color:k.emberDeep,intensity:3e4,distance:640,decay:2}),x>=4&&t.jsx("pointLight",{position:[0,78,Lt],color:k.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:$.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function oo(e,s){let o=e>>>0;const a=()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296),i=[],l=s==="low"?3:5,h=(u,f,w,b,T)=>{const R=[u.clone()],L=u.clone();for(let G=0;G<b;G++)L.add(new v((a()-.5)*w*.55,-w/b,(a()-.5)*w*.42)).add(f.clone().multiplyScalar(w/b*.3)),R.push(L.clone());const S=new bt(new yt(R),b*2,T,l,!1);return i.push(S),R},c=h(new v(0,620,0),new v(0,0,0),620,9,3.4),d=s==="low"?1:3;for(let u=0;u<d;u++){const f=c[2+Math.floor(a()*(c.length-3))];h(f.clone(),new v(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let m=0;for(const u of i)m+=u.attributes.position.count;const x=new Float32Array(m*3),r=new Float32Array(m*3);let n=0;for(const u of i)x.set(u.attributes.position.array,n*3),r.set(u.attributes.normal.array,n*3),n+=u.attributes.position.count,u.dispose();const p=new tt;return p.setAttribute("position",new Y(x,3)),p.setAttribute("normal",new Y(r,3)),p}function ia({quality:e}){const s=[g.useRef(),g.useRef(),g.useRef()],o=g.useRef(2.5),a=g.useRef({i:0,t:-1,dur:0,flicker:0}),i=g.useMemo(()=>[oo(40503,e),oo(20973,e),oo(10196,e)],[e]);return Q((l,h)=>{const c=Math.min(h,.05),d=a.current;if(o.current-=c,o.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const m=s[d.i].current;if(m){const x=(Math.random()-.5)*2.4-Math.PI*.5,r=620+Math.random()*760;m.position.set(de.x+Math.cos(x)*r,40+Math.random()*120,de.z+Math.sin(x)*r*.7-240),m.rotation.y=Math.random()*Math.PI*2;const n=.7+Math.random()*.8;m.scale.set(n,n,n),y.flashDir.set(m.position.x,m.position.y+400,m.position.z).normalize()}o.current=E.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(d.t>=0){d.t+=c;const m=d.t/d.dur,x=Math.abs(Math.sin(m*Math.PI*d.flicker)),r=Math.max(0,1-m);y.flash=r*r*x;const n=s[d.i].current;n&&(n.material.opacity=Math.min(1,y.flash*2.2)),m>=1&&(d.t=-1,y.flash=0,n&&(n.material.opacity=0))}else y.flash*=Math.pow(1e-4,c)}),t.jsx(t.Fragment,{children:i.map((l,h)=>t.jsx("mesh",{ref:s[h],geometry:l,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:$.bolt,transparent:!0,opacity:0,blending:et,depthWrite:!1,toneMapped:!1})},h))})}const la=`
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
`,ca=`
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
`,Xo={low:1600,mid:3800,high:7e3},Ct=460;function ha({quality:e}){const s=g.useRef(),o=ye(l=>l.camera),a=g.useMemo(()=>{const l=Xo[e]??Xo.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l);for(let x=0;x<l;x++)h[x*3]=Math.random()*Ct,h[x*3+1]=Math.random()*Ct,h[x*3+2]=Math.random()*Ct,c[x]=.7+Math.random()*.6,d[x]=.55+Math.random()*.85;const m=new tt;return m.setAttribute("position",new Y(h,3)),m.setAttribute("aSpeed",new Y(c,1)),m.setAttribute("aLen",new Y(d,1)),m.boundingSphere=new vt(new v,1e6),m},[e]),i=g.useMemo(()=>({uTime:{value:0},uCam:{value:new v},uBox:{value:Ct},uFall:{value:118},uSize:{value:2.4},uColor:{value:new v(...se("#b9c8e4"))},uOpacity:{value:.5}}),[]);return Q((l,h)=>{const c=s.current?.uniforms;c&&(c.uTime.value+=h,c.uCam.value.copy(o.position),c.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:s,vertexShader:la,fragmentShader:ca,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const da=`
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
`,ua=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Ko={low:120,mid:340,high:700};function pa({quality:e}){const s=g.useRef(),o=g.useMemo(()=>{const i=Ko[e]??Ko.high,l=[xe[0],xe[1],ae,ae],h=new Float32Array(i*3),c=new Float32Array(i),d=new Float32Array(i),m=new Float32Array(i);for(let r=0;r<i;r++){const n=l[r%l.length];h[r*3]=n.x+(Math.random()-.5)*74,h[r*3+1]=n.y+(Math.random()-.5)*30,h[r*3+2]=n.z+(Math.random()-.5)*26,c[r]=Math.random(),d[r]=.045+Math.random()*.055,m[r]=2+Math.random()*4}const x=new tt;return x.setAttribute("position",new Y(h,3)),x.setAttribute("aPhase",new Y(c,1)),x.setAttribute("aRise",new Y(d,1)),x.setAttribute("aSize",new Y(m,1)),x.boundingSphere=new vt(new v(0,300,-260),700),x},[e]),a=g.useMemo(()=>({uTime:{value:0},uColor:{value:new v(...se(k.ember))}}),[]);return Q((i,l)=>{s.current&&(s.current.uniforms.uTime.value+=l)}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:s,vertexShader:da,fragmentShader:ua,uniforms:a,transparent:!0,depthWrite:!1,blending:et,fog:!1})})}function ma({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ia,{quality:e}),t.jsx(ha,{quality:e}),t.jsx(pa,{quality:e})]})}const fa=`
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
`,xa=`
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
`,Zo={low:150,mid:380,high:620};function ga({whirl:e,quality:s}){const o=g.useRef(),a=g.useMemo(()=>{const l=Zo[s]??Zo.high,h=new Float32Array(l*3),c=new Float32Array(l),d=new Float32Array(l),m=new Float32Array(l),x=new Float32Array(l),r=new Float32Array(l);for(let p=0;p<l;p++)c[p]=Math.random()*Math.PI*2,d[p]=Math.random(),m[p]=.05+Math.random()*.05,x[p]=3+Math.random()*6,r[p]=Math.random();const n=new tt;return n.setAttribute("position",new Y(h,3)),n.setAttribute("aAngle",new Y(c,1)),n.setAttribute("aPhase",new Y(d,1)),n.setAttribute("aRate",new Y(m,1)),n.setAttribute("aSize",new Y(x,1)),n.setAttribute("aJitter",new Y(r,1)),n.boundingSphere=new vt(new v(e.x,0,e.z),e.r*1.6+40),n},[s,e]),i=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new jo(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new v(...se($.foam))},uGain:{value:1}}),[e]);return Q((l,h)=>{const c=o.current?.uniforms;if(!c)return;c.uTime.value+=h;const d=Math.hypot(l.camera.position.x-e.x,l.camera.position.z-e.z);c.uGain.value=1-E.smoothstep(d,1600,2400)}),t.jsx("points",{geometry:a,renderOrder:2,children:t.jsx("shaderMaterial",{ref:o,vertexShader:fa,fragmentShader:xa,uniforms:i,transparent:!0,depthWrite:!1,blending:et,fog:!1})})}function wa({quality:e="high"}){const s=ye(o=>o.camera);return Q(()=>{let o=0;for(const a of Ee){const i=Math.hypot(s.position.x-a.x,s.position.z-a.z);o=Math.max(o,1-E.smoothstep(i,a.r*.3,a.r*2.2))}y.whirlNear+=(o-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ee.map((o,a)=>t.jsx(ga,{whirl:o,quality:e},a))})}const ya=`
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
`,ba=`
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
`,qo={low:700,mid:1800,high:3200},Dt=260;function va({quality:e}){const s=g.useRef(),o=g.useRef(),a=ye(h=>h.camera),i=g.useMemo(()=>{const h=qo[e]??qo.high,c=new Float32Array(h*3),d=new Float32Array(h),m=new Float32Array(h),x=new Float32Array(h);for(let n=0;n<h;n++)c[n*3]=Math.random()*Dt,c[n*3+1]=Math.random()*Dt,c[n*3+2]=Math.random()*Dt,d[n]=.5+Math.random()*1.4,m[n]=1.2+Math.random()*3.2,x[n]=Math.random();const r=new tt;return r.setAttribute("position",new Y(c,3)),r.setAttribute("aSpeed",new Y(d,1)),r.setAttribute("aSize",new Y(m,1)),r.setAttribute("aPhase",new Y(x,1)),r.boundingSphere=new vt(new v,1e6),r},[e]),l=g.useMemo(()=>({uTime:{value:0},uCam:{value:new v},uBox:{value:Dt},uColor:{value:new v(...se("#cfeee6"))},uGain:{value:0}}),[]);return Q((h,c)=>{const d=s.current?.uniforms;d&&(d.uTime.value+=c,d.uCam.value.copy(a.position),d.uGain.value=y.underwater,o.current&&(o.current.visible=y.underwater>.02))}),t.jsx("points",{ref:o,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:s,vertexShader:ya,fragmentShader:ba,uniforms:l,transparent:!0,depthWrite:!1,fog:!1})})}const Ma=`
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
`,ja=`
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
`,Qo={low:220,mid:520,high:900};function Sa({whirl:e,quality:s}){const o=g.useRef(),a=g.useRef(),i=ye(c=>c.camera),l=g.useMemo(()=>{const c=Qo[s]??Qo.high,d=new Float32Array(c*3),m=new Float32Array(c),x=new Float32Array(c),r=new Float32Array(c),n=new Float32Array(c),p=new Float32Array(c);for(let f=0;f<c;f++)m[f]=Math.random()*Math.PI*2,x[f]=Math.random(),r[f]=.07+Math.random()*.1,n[f]=.12+Math.pow(Math.random(),1.8)*.5,p[f]=2+Math.random()*5;const u=new tt;return u.setAttribute("position",new Y(d,3)),u.setAttribute("aAngle",new Y(m,1)),u.setAttribute("aPhase",new Y(x,1)),u.setAttribute("aRate",new Y(r,1)),u.setAttribute("aRadius",new Y(n,1)),u.setAttribute("aSize",new Y(p,1)),u.boundingSphere=new vt(new v(e.x,-60,e.z),e.r+140),u},[s,e]),h=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new jo(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:120},uColor:{value:new v(...se($.underGlow))},uGain:{value:0}}),[e]);return Q((c,d)=>{const m=o.current?.uniforms;if(!m)return;m.uTime.value+=d;const x=Math.hypot(i.position.x-e.x,i.position.z-e.z),r=1-E.smoothstep(x,e.r*1.2,e.r*4);m.uGain.value=y.underwater*r,a.current&&(a.current.visible=m.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:l,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Ma,fragmentShader:ja,uniforms:h,transparent:!0,depthWrite:!1,blending:et,fog:!1})})}function za({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(va,{quality:e}),Ee.map((s,o)=>t.jsx(Sa,{whirl:s,quality:e},o))]})}const go=[0,(xe[0].y+xe[1].y)/2,xe[0].z],Es=[ae.x,ae.y,ae.z],Vt=D.dir,Rs=[D.x+Vt[0]*300,-36,D.z+Vt[1]*300],As=[D.x+Vt[0]*46,34,D.z+Vt[1]*46],Gs=[D.gate.x,4,D.gate.z],Fs=[D.gate.x,22,D.gate.z],ka=1.55,wo=H/ka,Ta=1+(wo-1)*.35,Oe=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:go,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Rs,to:As,lookFrom:Gs,lookTo:Fs,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Es,lookTo:go,swell:0}],Ea=new Set([go,Es,Rs,As,Gs,Fs]),Ot=e=>Ea.has(e)?e:[e[0]*wo,e[1]*Ta,e[2]*wo];for(const e of Oe)e.from=Ot(e.from),e.to=Ot(e.to),e.lookFrom=Ot(e.lookFrom),e.lookTo=Ot(e.lookTo);const yo=Oe.reduce((e,s)=>e+s.dur,0),Jo=Oe,Ra=e=>e*e*(3-2*e),Aa=e=>1-Math.pow(1-e,2.2),Nt=e=>new v(e[0],e[1],e[2]),es=16/9,Ga=96;function ts(e,s){if(s>=es)return e;const o=E.degToRad(e)/2,a=2*Math.atan(Math.tan(o)*es/s);return Math.min(Ga,E.radToDeg(a))}function Fa(e,s){g.useEffect(()=>{if(!e)return;const o=s.domElement;let a=!1,i=0,l=0,h=0;const c=(w,b)=>{a=!0,i=w,l=b},d=(w,b)=>{if(!a)return;const T=y.orbit;T.yaw-=(w-i)*.005,T.pitch=E.clamp(T.pitch+(b-l)*.004,-.35,1.15),i=w,l=b},m=()=>{a=!1,h=0},x=w=>c(w.clientX,w.clientY),r=w=>d(w.clientX,w.clientY),n=w=>{w.preventDefault();const b=y.orbit;b.dist=E.clamp(b.dist*(1+Math.sign(w.deltaY)*.11),45,1400)},p=w=>{w.touches.length===1?c(w.touches[0].clientX,w.touches[0].clientY):w.touches.length===2&&(h=Math.hypot(w.touches[0].clientX-w.touches[1].clientX,w.touches[0].clientY-w.touches[1].clientY))},u=w=>{if(w.touches.length===1)d(w.touches[0].clientX,w.touches[0].clientY);else if(w.touches.length===2&&h){const b=Math.hypot(w.touches[0].clientX-w.touches[1].clientX,w.touches[0].clientY-w.touches[1].clientY),T=y.orbit;T.dist=E.clamp(T.dist*(h/b),45,1400),h=b}w.preventDefault()};o.addEventListener("pointerdown",x),window.addEventListener("pointermove",r),window.addEventListener("pointerup",f),o.addEventListener("wheel",n,{passive:!1}),o.addEventListener("touchstart",p,{passive:!1}),o.addEventListener("touchmove",u,{passive:!1}),window.addEventListener("touchend",f);function f(){m()}return()=>{o.removeEventListener("pointerdown",x),window.removeEventListener("pointermove",r),window.removeEventListener("pointerup",f),o.removeEventListener("wheel",n),o.removeEventListener("touchstart",p),o.removeEventListener("touchmove",u),window.removeEventListener("touchend",f)}},[e,s])}function La({onRails:e,playing:s,speed:o=1,onShot:a,idle:i=!1}){const l=ye(x=>x.camera),h=ye(x=>x.gl),c=g.useRef(0),d=g.useRef(-1),m=g.useRef(new v(0,150,-260));return Fa(!e&&!i,h),g.useEffect(()=>{if(e)return;const x=y.orbit,r=l.position.clone().sub(x.target);x.dist=E.clamp(r.length(),45,1400),x.yaw=Math.atan2(r.x,r.z),x.pitch=Math.asin(E.clamp(r.y/(r.length()||1),-1,1))},[e,l]),Q((x,r)=>{if(i)return;const n=Math.min(r,.05);if(y.t+=n,e){if(y.jumpTo!=null){let M=0;for(let z=0;z<y.jumpTo&&z<Oe.length;z++)M+=Oe[z].dur;c.current=M,y.jumpTo=null}s&&(c.current=(c.current+n*o)%yo);let b=0,T=0;for(;T<Oe.length&&!(c.current<b+Oe[T].dur);T++)b+=Oe[T].dur;const R=Oe[Math.min(T,Oe.length-1)],L=E.clamp((c.current-b)/R.dur,0,1);d.current!==T&&(d.current=T,y.shot=T,a?.(T,R));const S=Nt(R.from).lerp(Nt(R.to),Aa(L)),G=Nt(R.lookFrom).lerp(Nt(R.lookTo),Ra(L)),A=R.swell??0;if(A>0){const M=y.t;S.y+=Math.sin(M*.62)*3.1*A+Math.sin(M*1.31+1.2)*1.2*A,S.x+=Math.sin(M*.44+.6)*2.2*A}S.x+=Math.sin(y.t*.83)*.35,S.y+=Math.sin(y.t*1.17+2)*.28,l.position.copy(S),m.current.lerp(G,1-Math.pow(1e-4,n)),l.lookAt(m.current),A>0&&l.rotateZ(Math.sin(y.t*.51)*.024*A);const j=ts(R.fov,l.aspect);Math.abs(l.fov-j)>.01&&(l.fov+=(j-l.fov)*(1-Math.pow(.02,n)),l.updateProjectionMatrix()),y.progress=c.current/yo}else{const b=y.orbit,T=Math.cos(b.pitch);l.position.set(b.target.x+Math.sin(b.yaw)*T*b.dist,b.target.y+Math.sin(b.pitch)*b.dist,b.target.z+Math.cos(b.yaw)*T*b.dist),l.lookAt(b.target);const R=ts(55,l.aspect);Math.abs(l.fov-R)>.01&&(l.fov+=(R-l.fov)*(1-Math.pow(.02,n)),l.updateProjectionMatrix()),y.t+=0}const p=Rt(l.position.x,l.position.z);y.shelter+=(p-y.shelter)*(1-Math.pow(.06,n)),y.fog=E.lerp(gt.sea,gt.bay,y.shelter),y.rain=1-y.shelter*.92;const u=Qe(l.position.x,l.position.z,y.t,1),f=E.clamp((u.y-l.position.y-1)/3,0,1);y.underwater+=(f-y.underwater)*(1-Math.pow(.002,n)),y.depthBelow=Math.max(0,u.y-l.position.y);const w=E.lerp(6e3,1700,y.underwater);Math.abs(l.far-w)>20&&(l.far=w,l.updateProjectionMatrix()),x.camera.updateMatrixWorld()}),null}const ko=-30,To=330,ge={x:ae.x,y:ae.y-40,z:ee.z-ee.r*ee.squash[2]-(ko+To)-70},qe={centre:[0,96,ko],radii:[350,235,To]},J={y:0,halfX:290,zFront:228,zBack:-240},we={y:40,z:ko+To-40,halfX:96,depth:120},Le={zTop:we.z-54,zBottom:140,halfX:74,steps:16},P={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},me={y:74,z:P.z+P.halfZ+26,halfX:96,depth:40},Je=me.y+3.5,ke={y:-95,halfX:220,halfZ:175,ceiling:-34},pe={x:0,z:84,halfX:52,halfZ:40},le={y:52,halfZ:205,x:252,tiers:3,tierRise:46},Ht=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],ie={x:74,halfW:14,zFoot:P.z+P.halfZ+158,zTop:me.z+me.depth/2-6},Ls=[{kind:"rampZ",x0:-74-ie.halfW,x1:-74+ie.halfW,z0:ie.zFoot,z1:ie.zTop,y0:0,y1:Je},{kind:"rampZ",x0:ie.x-ie.halfW,x1:ie.x+ie.halfW,z0:ie.zFoot,z1:ie.zTop,y0:0,y1:Je},{kind:"flat",x0:-96,x1:me.halfX,z0:me.z-me.depth/2-2,z1:ie.zTop+10,y:Je},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:le.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:le.y-.5},{kind:"flat",x0:le.x-38,x1:le.x+38,z0:-225,z1:le.halfZ+20,y:le.y-.5}],Pa=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Ps=(()=>{const e=[],s=[],o=[],a=P.halfX+6,i=[a,a+9],l=[a+11,a+20],h=[a,a+20],c=[-212,-200],d=[-264,-252],m=[Je];for(let r=2;r<=P.storeys;r++)m.push(P.plinth+r*P.storey+1.5);e.push({kind:"flat",x0:me.halfX-6,x1:a+20,z0:-212,z1:-196,y:Je}),s.push([(me.halfX-6+a+20)/2,Je,-204,a+26-me.halfX,16]);for(let r=0;r<m.length-1;r++){const n=m[r],p=m[r+1],u=(n+p)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:n,y1:u}),o.push({x0:i[0],x1:i[1],z0:c[0],z1:d[1],y0:n,y1:u}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:d[0],z1:d[1],y:u}),s.push([(h[0]+h[1])/2,u,(d[0]+d[1])/2,h[1]-h[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:u,y1:p}),o.push({x0:l[0],x1:l[1],z0:d[1],z1:c[0],y0:u,y1:p}),e.push({kind:"flat",x0:h[0],x1:h[1],z0:c[0],z1:c[1],y:p}),s.push([(h[0]+h[1])/2,p,(c[0]+c[1])/2,h[1]-h[0],c[1]-c[0]])}for(let r=1;r<m.length-1;r++){const p=1-Math.min(P.storeys,r+2)*P.taper,u=P.halfX*p,f=P.z+P.halfZ*p,w=m[r];e.push({kind:"flat",x0:u-4,x1:a,z0:-224,z1:-212,y:w}),s.push([(u-4+a)/2,w,-218,a-u+4,12]),e.push({kind:"flat",x0:-u-6,x1:u+6,z0:f,z1:-212,y:w}),s.push([0,w,(f-212)/2,u*2+12,-212-f])}const x=m[m.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:x}),s.push([(a+58)/2,x,-230,a-58,36]),{walks:e,slabs:s,flights:o,tower:{x:[a,a+20],z:[d[0],c[1]]}}})();Ls.push(...Ps.walks);function Ia(e,s){let o=0;for(const a of Ls){if(e<a.x0||e>a.x1)continue;const i=Math.min(a.z0,a.z1),l=Math.max(a.z0,a.z1);if(!(s<i||s>l))if(a.kind==="flat")a.y>o&&(o=a.y);else{const h=Pa((s-a.z0)/(a.z1-a.z0)),c=a.y0+(a.y1-a.y0)*h;c>o&&(o=c)}}return o}const os={low:[24,16],mid:[40,26],high:[56,36]};function Ca({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const[n,p]=os[e]??os.high,u=new Js(1,n,p),f=u.attributes.position,w=new Float32Array(f.count*3),[b,T,R]=qe.centre,[L,S,G]=qe.radii,A=new fe("#241c22"),j=new fe(k.rockWarm),M=new fe;for(let z=0;z<f.count;z++){const O=f.getX(z),V=f.getY(z),q=f.getZ(z),te=1+(xt(O*2.4+5,q*2.4-9,3)-.5)*.14;f.setXYZ(z,b+O*L*te,T+V*S*te,R+q*G*te);const ue=E.clamp((V+.2)/1.2,0,1);M.copy(A).lerp(j,(1-ue)*.55),w[z*3]=M.r,w[z*3+1]=M.g,w[z*3+2]=M.b}return u.setAttribute("color",new Y(w,3)),u.computeVertexNormals(),u},[e]),{stairM:l,brazierM:h,bayM:c,tableM:d,jarM:m,westStairM:x}=g.useMemo(()=>{const n=new Ae,p=new Ne,u=new v(1,1,1),f=new v,w=[];for(let N=0;N<Le.steps;N++){const C=N/(Le.steps-1);f.set(0,E.lerp(we.y,J.y+2,C),E.lerp(Le.zTop,Le.zBottom,C)),p.identity(),w.push(n.clone().compose(f,p,u))}const b=[],T=e==="low"?5:9;for(const N of[-1,1])for(let C=0;C<T;C++){const X=C/(T-1);f.set(N*176,J.y+9,E.lerp(J.zFront-40,J.zBack+40,X)),p.identity(),b.push(n.clone().compose(f,p,u))}for(let N=0;N<6;N++)f.set(-110+N*44,J.y+9,P.z+P.halfZ+54),p.identity(),b.push(n.clone().compose(f,p,u));const R=[],L=e==="low"?5:9;for(const N of[-1,1])for(let C=0;C<le.tiers;C++)for(let X=0;X<L;X++){const Se=X/(L-1);f.set(N*(le.x-C*26),le.y+C*le.tierRise,E.lerp(-205,le.halfZ,Se)),p.identity(),R.push(n.clone().compose(f,p,u))}const S=[],G=[],A=new Ne,j=new v(0,1,0);let M=24301;const z=()=>(M=Math.imul(M,1664525)+1013904223>>>0,M/4294967296),O=e==="low"?1:2,V=e==="low"?5:8;for(const N of[-1,1])for(let C=0;C<O;C++)for(let X=0;X<V;X++){const Se=N*(96+C*52+(z()-.5)*14),ve=E.lerp(J.zBack+120,J.zFront-60,X/(V-1))+(z()-.5)*16;if(!(Math.abs(Se)<pe.halfX+24&&Math.abs(ve-pe.z)<pe.halfZ+20)&&!(Math.abs(Math.abs(Se)-ie.x)<26&&ve<ie.zFoot+16&&ve>ie.zTop-8)){f.set(Se,J.y+2.4,ve),A.setFromAxisAngle(j,(z()-.5)*.5),S.push(n.clone().compose(f,A,u));for(let B=0;B<2;B++)f.set(Se+(z()-.5)*30,J.y+3.5,ve+(z()>.5?8:-8)+(z()-.5)*6),A.setFromAxisAngle(j,z()*Math.PI),G.push(n.clone().compose(f,A,u))}}const q=[],te=16,ue=N=>N*N*(3-2*N);for(let N=0;N<=te;N++){const C=N/te;f.set(-252,ue(C)*(le.y-.5)-1.3,E.lerp(45,-45,C)),p.identity(),q.push(n.clone().compose(f,p,u))}return{stairM:w,brazierM:b,bayM:R,tableM:S,jarM:G,westStairM:q}},[e]);Q(()=>{const n=y.t;o.current&&(o.current.material.emissiveIntensity=2.6+Math.sin(n*4.1)*.3+Math.sin(n*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(n*.9)*.12)});const r=s;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:uo,receiveShadow:r,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:uo,roughness:.97,metalness:.02})}),[[0,(J.zFront+pe.z+pe.halfZ)/2,J.halfX*2,J.zFront-pe.z-pe.halfZ],[0,(J.zBack+pe.z-pe.halfZ)/2,J.halfX*2,pe.z-pe.halfZ-J.zBack],[-342/2-20,pe.z,J.halfX*2-pe.halfX*2,pe.halfZ*2],[(pe.halfX+J.halfX)/2+20,pe.z,J.halfX*2-pe.halfX*2,pe.halfZ*2]].map(([n,p,u,f],w)=>t.jsxs("mesh",{position:[n,J.y-3,p],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Math.abs(u),6,Math.abs(f)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},w)),t.jsxs("mesh",{ref:a,position:[pe.x,ke.ceiling+2,pe.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[pe.halfX*2,pe.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:je})]}),t.jsxs("mesh",{position:[0,we.y-4,we.z],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[we.halfX*2.6,8,we.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,l.length],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[Le.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Da,{matrices:l})]}),[-1,1].map(n=>Array.from({length:le.tiers},(p,u)=>t.jsxs("mesh",{position:[n*(le.x-u*26),le.y+u*le.tierRise-4,0],receiveShadow:r,castShadow:r,children:[t.jsx("boxGeometry",{args:[76-u*6,7,le.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:k.timber,roughness:.92})]},`${n}-${u}`))),t.jsxs("instancedMesh",{args:[null,null,c.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:k.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Ba,{matrices:c})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(Oa,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,m.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Na,{matrices:m})]}),t.jsxs("instancedMesh",{args:[null,null,x.length],castShadow:r,receiveShadow:r,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Ha,{matrices:x})]}),t.jsxs("instancedMesh",{args:[null,null,h.length],castShadow:r,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(_a,{matrices:h})]}),t.jsxs("instancedMesh",{ref:o,args:[null,null,h.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:k.furnace,emissive:k.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Ua,{matrices:h})]}),t.jsxs("mesh",{position:[0,ke.y-4,0],receiveShadow:r,children:[t.jsx("boxGeometry",{args:[ke.halfX*2,8,ke.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(n=>[-1,0,1].map(p=>t.jsxs("mesh",{position:[n*120,(ke.y+J.y)/2,p*96],castShadow:r,children:[t.jsx("boxGeometry",{args:[26,Math.abs(J.y-ke.y),26]}),t.jsx("meshStandardMaterial",{color:$.rock,roughness:.95})]},`${n}-${p}`)))]})}function Da({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function Oa({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function Na({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function Ha({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function Ba({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function _a({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s})}function Ua({matrices:e}){const s=g.useRef();return t.jsx(lt,{matrices:e,selfRef:s,offsetY:9})}function lt({matrices:e,offsetY:s=0}){const o=g.useRef(),a=g.useRef(!1);return Q(()=>{if(a.current)return;const i=o.current?.parent;if(!i?.isInstancedMesh)return;const l=new Ae,h=new Ae().makeTranslation(0,s,0);for(let c=0;c<Math.min(e.length,i.count);c++)l.copy(e[c]).multiply(h),i.setMatrixAt(c,l);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:o})}const ss=(()=>{if(typeof document>"u")return null;const e=256,s=128,o=document.createElement("canvas");o.width=e,o.height=s;const a=o.getContext("2d"),i=a.createRadialGradient(e/2,s*.62,8,e/2,s*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),a.fillStyle=i,a.fillRect(0,0,e,s),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let h=0;h<12;h++){const c=h/12*Math.PI*2;a.save(),a.translate(e/2,s*.62),a.rotate(c),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let h=8;h<e;h+=22)a.fillRect(h,0,3,s);a.globalAlpha=1;const l=new Gt(o);return l.colorSpace=Ft,l})();function Wa(e,s,o,a){const i=e+a,l=s+a,h=new Float32Array([-i,0,l,i,0,l,e*.18,o,s*.18,-i,0,l,e*.18,o,s*.18,-e*.18,o,s*.18,i,0,l,i,0,-l,e*.18,o,-s*.18,i,0,l,e*.18,o,-s*.18,e*.18,o,s*.18,i,0,-l,-i,0,-l,-e*.18,o,-s*.18,i,0,-l,-e*.18,o,-s*.18,e*.18,o,-s*.18,-i,0,-l,-i,0,l,-e*.18,o,s*.18,-i,0,-l,-e*.18,o,s*.18,-e*.18,o,-s*.18]),c=new tt;return c.setAttribute("position",new Y(h,3)),c.computeVertexNormals(),c}function $a({quality:e="high",shadows:s=!0}){const o=g.useRef(),a=g.useRef(),i=Re("keep-hf.opt.glb"),l=g.useMemo(()=>{const c=[];for(let d=0;d<P.storeys;d++){const m=1-(d+1)*P.taper,x=P.plinth+d*P.storey;c.push({i:d,y:x,halfX:P.halfX*m,halfZ:P.halfZ*m,roof:Wa(P.halfX*m,P.halfZ*m,d===P.storeys-1?30:16,11)})}return c},[]);Q(()=>{const c=y.t;o.current&&(o.current.material.emissiveIntensity=2.2+Math.sin(c*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(c*3.3)*.25)});const h=s;return t.jsxs("group",{position:[0,P.baseY,P.z],children:[t.jsxs("mesh",{position:[0,P.plinth/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[P.halfX*2.2,P.plinth,P.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(ce,{name:"keep-hf.opt.glb",height:P.plinth+P.storeys*P.storey+26,position:[0,P.plinth*.5,0],tint:"#9a8468",emissive:k.emberDeep,emissiveIntensity:.14}),!i&&l.map(c=>t.jsxs("group",{position:[0,c.y,0],children:[t.jsxs("mesh",{position:[0,P.storey/2,0],castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2,P.storey,c.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,P.storey*.55,c.halfZ+.6],children:[t.jsx("planeGeometry",{args:[c.halfX*1.75,P.storey*.38]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,P.storey*.02,c.halfZ+8],castShadow:h,children:[t.jsx("boxGeometry",{args:[c.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,P.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[c.halfX*2+3,1.6,c.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:c.roof,position:[0,P.storey,0],castShadow:h,receiveShadow:h,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},c.i)),[-1,1].map(c=>t.jsxs("mesh",{position:[c*14,P.plinth+P.storeys*P.storey+30,0],rotation:[0,0,c*.4],castShadow:h,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},c)),t.jsxs("group",{position:[0,me.y,me.z-P.z],children:[t.jsxs("mesh",{castShadow:h,receiveShadow:h,children:[t.jsx("boxGeometry",{args:[me.halfX*2,7,me.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:o,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[me.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:k.furnace,emissive:"#ffffff",emissiveMap:ss,map:ss,emissiveIntensity:2.2,toneMapped:!1,side:je})]}),t.jsx(ce,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:h,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*8,32,-5],rotation:[0,0,c*-.55],castShadow:h,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},c))]})}),t.jsx(ce,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:k.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*me.halfX*.9,28,me.depth/2-4],castShadow:h,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.7})]},c)),t.jsxs("mesh",{position:[0,56,0],castShadow:h,children:[t.jsx("boxGeometry",{args:[me.halfX*2.3,5,me.depth+22]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.72})]}),[-1,1].map(c=>t.jsx(ce,{name:"oni-daiko.opt.glb",height:26,position:[c*(me.halfX-22),4,4],rotation:c*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:h,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},c))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Va,{})]})]})}function Va(){const e=g.useRef(),s=g.useRef(!1);return Q(()=>{if(s.current)return;const o=e.current?.parent;if(!o?.isInstancedMesh)return;const a=new Ae,i=new v,l=new Ne,h=new v(1,1,1);for(let c=0;c<o.count;c++){const d=c/(o.count-1)*2-1;i.set(d*(P.halfX+26),me.y+74-(1-d*d)*20,P.halfZ+22),o.setMatrixAt(c,a.compose(i,l,h))}o.instanceMatrix.needsUpdate=!0,o.computeBoundingSphere(),s.current=!0}),t.jsx("object3D",{ref:e})}function Ya({shadows:e=!0}){const{slabs:s,flights:o,tower:a}=Ps,i=g.useMemo(()=>{const l=[],h=c=>c*c*(3-2*c);for(const c of o)for(let m=0;m<=9;m++){const x=m/9;l.push([(c.x0+c.x1)/2,c.y0+(c.y1-c.y0)*h(x)-1.2,E.lerp(c.z0,c.z1,x)])}return l},[o]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(l=>[a.z[0]+1,a.z[1]-1].map(h=>t.jsxs("mesh",{position:[l,128,h],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${l}${h}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Xa,{points:i})]}),s.map(([l,h,c,d,m],x)=>t.jsxs("mesh",{position:[l,h-1.6,c],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(m)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},x)),s.map(([l,h,c,d,m],x)=>t.jsxs("mesh",{position:[l,h+5,c+Math.abs(m)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})]},`r${x}`))]})}function Xa({points:e}){const s=g.useRef(),o=g.useRef(!1);return Q(()=>{if(o.current)return;const a=s.current?.parent;if(!a?.isInstancedMesh)return;const i=new Ae,l=new Ne,h=new v(1,1,1),c=new v;for(let d=0;d<Math.min(e.length,a.count);d++)c.set(e[d][0],e[d][1],e[d][2]),a.setMatrixAt(d,i.compose(c,l,h));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:s})}function Ka({shadows:e=!0}){const s=g.useMemo(()=>{const o=[],i=l=>l*l*(3-2*l);for(const l of[-1,1])for(let h=0;h<=20;h++){const c=h/20;o.push({x:l*ie.x,y:i(c)*Je,z:E.lerp(ie.zFoot,ie.zTop,c)})}return o},[]);return t.jsxs("group",{children:[s.map((o,a)=>t.jsxs("mesh",{position:[o.x,o.y-1.4,o.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[ie.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.75})]},a)),[-1,1].map(o=>{const a=l=>l*l*(3-2*l),i=l=>{const h=[];for(let c=0;c<=16;c++){const d=c/16;h.push(new v(o*ie.x+l,a(d)*Je+7,E.lerp(ie.zFoot,ie.zTop,d)))}return new bt(new yt(h),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(ie.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})})]},o)})]})}function Za({shadows:e=!0}){const s=g.useMemo(()=>Ht.map(([,,o,a])=>{const i=[];for(let l=0;l<=12;l++){const h=l/12*2-1;i.push(new v(h*o*.5,a*(1-h*h),0))}return new bt(new yt(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[Ht.map(([o,a],i)=>t.jsxs("group",{position:[0,o,a],children:[t.jsx("mesh",{geometry:s[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:k.vermilion,roughness:.74})}),[-7,7].map(l=>t.jsx("mesh",{geometry:s[i],position:[0,7,l],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:k.vermilionDeep,roughness:.8})},l))]},i)),[-1,0,1].map(o=>t.jsxs("mesh",{position:[o*70,Ht[0][0]-12,Ht[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:2.4,toneMapped:!1})]},o)),t.jsx("group",{position:[0,J.y,0]})]})}function Is(e){let s=e>>>0;return()=>(s=Math.imul(s,1664525)+1013904223>>>0,s/4294967296)}function qa({quality:e,shadows:s}){const o=g.useMemo(()=>{const i=Is(712273),l=[],h=e==="low"?14:e==="mid"?26:40;let c=0;for(;l.length<h&&c<h*40;){c++;const d=(i()*2-1)*(J.halfX-30),m=E.lerp(J.zBack+40,J.zFront-30,i());Math.abs(d)<62&&m>P.z+120||Math.abs(d)<70&&Math.abs(m-84)<58||Math.abs(Math.abs(d)-ie.x)<24&&m<ie.zFoot+18&&m>ie.zTop-10||l.push({x:d,z:m,kind:l.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return l},[e]),a=s;return t.jsx(t.Fragment,{children:o.map((i,l)=>{const h=[i.x,J.y,i.z];return i.kind===0?t.jsx(ce,{name:"sake-tower.opt.glb",height:22*i.k,position:h,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:h,children:[0,1,2].map(c=>t.jsxs("mesh",{position:[0,4+c*7,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[6-c,6-c,7,10]}),t.jsx("meshStandardMaterial",{color:c%2?"#c9a86a":"#8e6a3c",roughness:.92})]},c))})},l):i.kind===1?t.jsx(ce,{name:"oni-guardian.opt.glb",height:30*i.k,position:h,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(c=>t.jsxs("mesh",{position:[c*4,28,0],rotation:[0,0,c*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},c))]})},l):i.kind===2?t.jsx(ce,{name:"wisteria-trellis.opt.glb",height:34*i.k,position:h,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:h,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(c=>t.jsxs("mesh",{position:[c,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},c))]})},l):t.jsxs("group",{position:h,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:l%2?k.vermilion:"#e8dcc4",roughness:.95,side:je,emissive:l%2?k.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},l)})})}function Qa({shadows:e}){const s=g.useMemo(()=>{const o=Is(10560325),a=[];for(let i=0;i<14;i++)a.push({x:(o()*2-1)*(ke.halfX-40),z:(o()*2-1)*(ke.halfZ-40),rot:o()*Math.PI*2,keg:i%2===0});return a},[]);return t.jsx(t.Fragment,{children:s.map((o,a)=>o.keg?t.jsx(ce,{name:"powder-keg.opt.glb",height:13,position:[o.x,ke.y,o.z],rotation:o.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[o.x,ke.y+6,o.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(ce,{name:"war-cannon.opt.glb",height:12,position:[o.x,ke.y,o.z],rotation:o.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[o.x,ke.y+5,o.z],rotation:[0,o.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function Ja(){const e=ye(s=>s.camera);return Q((s,o)=>{const a=Math.min(o,.05),i=(e.position.x-ge.x-qe.centre[0])/qe.radii[0],l=(e.position.y-ge.y-qe.centre[1])/qe.radii[1],h=(e.position.z-ge.z-qe.centre[2])/qe.radii[2],c=Math.sqrt(i*i+l*l+h*h),d=E.clamp(1-(c-1)/.5,0,1);y.inside+=(d-y.inside)*(1-Math.pow(.02,a))}),null}function er({quality:e="high",shadows:s=!0}){return t.jsxs("group",{position:[ge.x,ge.y,ge.z],children:[t.jsx(Ja,{}),t.jsx(Ca,{quality:e,shadows:s}),t.jsx($a,{quality:e,shadows:s}),t.jsx(Za,{shadows:s}),t.jsx(Ka,{shadows:s}),t.jsx(Ya,{shadows:s}),t.jsx(qa,{quality:e,shadows:s}),t.jsx(Qa,{shadows:s}),[-1,1].map(o=>t.jsx(ce,{name:"banquet-table.opt.glb",height:9,position:[o*92,J.y,P.z+210],rotation:o*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${o}`)),t.jsx(ce,{name:"treasure-kura.opt.glb",height:64,position:[le.x-74,J.y,P.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[le.x-74,J.y,P.z+96],rotation:[0,-.7,0],children:[[-1,1].map(o=>[-1,1].map(a=>t.jsxs("mesh",{position:[o*12,5,a*9],castShadow:s,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${o}${a}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:s,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([o,a,i],l)=>t.jsx(ce,{name:"bomb-sphere.opt.glb",height:22,position:[o,ke.y,a],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[o,ke.y+10,a],castShadow:s,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${l}`)),[-1,1].map(o=>t.jsx(ce,{name:"keep-tier.opt.glb",height:96,position:[o*(le.x-40),le.y+le.tiers*le.tierRise-6,P.z+140],rotation:o*.6,tint:"#a08c74",fallback:null},`turret-${o}`)),[-1,1].map(o=>t.jsx(ce,{name:"arch-bridge.opt.glb",height:26,position:[o*74,J.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${o}`)),[-1,1].map(o=>t.jsx(ce,{name:"oni-guardian.opt.glb",height:54,position:[o*(we.halfX+26),we.y,we.z-26],rotation:-o*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[o*(we.halfX+26),we.y,we.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:s,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},o)),t.jsx("pointLight",{position:[0,me.y+30,me.z-P.z+P.z+40],color:k.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,le.y+120,60],color:k.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,ke.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,we.y+46,we.z-40],color:k.lantern,intensity:26e3,distance:620,decay:2})]})}const Mt=e=>e<-1?-1:e>1?1:e,Z={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1},K={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0}},Tt=new Set,at=(...e)=>e.some(s=>Tt.has(s));function tr(){Z.throttle=0,Z.rudder=0,Z.planes=0,Z.boost=!1,Z.walk.x=0,Z.walk.z=0,Z.surfaceQueued=!1,Z.periscopeQueued=!1,K.throttle=0,K.rudder=0,K.planes=0,K.boost=!1,K.walk.x=0,K.walk.z=0,Tt.clear()}function or(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),s=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const l=i.key.toLowerCase();Tt.add(l),l==="f"&&(Z.surfaceQueued=!0),l==="p"&&(Z.periscopeQueued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(l)&&i.preventDefault()},o=i=>Tt.delete(i.key.toLowerCase()),a=()=>tr();return window.addEventListener("keydown",s,{passive:!1}),window.addEventListener("keyup",o),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",s),window.removeEventListener("keyup",o),window.removeEventListener("blur",a),Tt.clear()}}function sr(){const e=at("w","arrowup")?1:0,s=at("s","arrowdown")?1:0,o=at("a","arrowleft")?1:0,a=at("d","arrowright")?1:0,i=at("q"," ")?1:0,l=at("e","c")?1:0;Z.throttle=Mt(e-s+K.throttle),Z.rudder=Mt(o-a+K.rudder),Z.planes=Mt(i-l+K.planes),Z.boost=at("shift")||K.boost,Z.walk.x=Mt(a-o+K.walk.x),Z.walk.z=Mt(e-s+K.walk.z)}const I={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},wt={helm:[{text:"MAKE FOR THE GATE",hint:"The torii stands across the only channel in. Full ahead.",test:e=>e.toGate<420*H},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Lt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*H},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE EASTERN MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>Math.hypot(e.x-Ee[1].x,e.z-Ee[1].z)<Ee[1].r*.9&&e.depth>30},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<D.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},nr=e=>wt[e]?wt[e].length:0,ar=()=>I.chain&&wt[I.chain]?wt[I.chain][I.step]??null:null;function bo(e){I.chain=wt[e]?e:null,I.step=0,I.hull=1,I.grip=0,I.clock=0,I.done=!1,I.banner=null,I.rev++}function Yt(e,s,o=3.4){I.banner={text:e,sub:s,until:I.clock+o},I.rev++}function Et(e,s){I.hull<=0||(I.hull=Math.max(0,I.hull-e),I.hits++,I.hull<=0?Yt("HULL BREACHED","She is going down — the raid goes on without you",5):s&&e>.04&&Yt(s,null,2.2),I.rev++)}function Cs(e,s){if(I.clock+=e,I.banner&&I.clock>I.banner.until&&(I.banner=null,I.rev++),!I.chain||I.done||!s)return;const o=wt[I.chain],a=o[I.step];if(!a)return;let i=!1;try{i=!!a.test(s)}catch{i=!1}i&&(I.step++,I.step>=o.length?(I.done=!0,Yt("OBJECTIVE COMPLETE",rr[I.chain]??"",6)):Yt(o[I.step].text,o[I.step].hint,3.6),I.rev++)}const rr={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Ds(e,{danger:s,headingX:o,headingZ:a,toCentreX:i,toCentreZ:l,speed:h,throttle:c}){if(s<=.001)return I.grip=Math.max(0,I.grip-e*.5),I.grip;const d=Math.hypot(i,l)||1,m=-i/d,x=-l/d,r=o*m+a*x,n=Math.min(1,Math.abs(h)/22),p=s*.42,u=Math.max(0,r)*n*(.35+.45*Math.min(1,Math.abs(c)));return I.grip=Math.max(0,Math.min(1,I.grip+(p-u)*e)),I.grip}const ns=34,ir=12,as=7.5,lr=.62,rs=9,is={x:-.45,z:-2.4},ls=.12;function ut(e,s){return E.clamp(-ne(e,s)/26,0,1)}const cr=22,hr=42,rt=11;function dr({mode:e,onMode:s}){const o=ye(p=>p.camera),a=ye(p=>p.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=g.useRef(),d=Re("ship-sunny.opt.glb"),m=Re("ship-lion.opt.glb"),x=d||m,r=Re("crew-straw.opt.glb"),n=g.useRef({x:40*H,z:760*H,heading:Math.PI,speed:0,throttle:0,rudder:0,aground:0,heel:0,spray:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,area:"hall",camYaw:0,camPitch:.16,camDist:95,boarded:!1}).current;return g.useEffect(()=>{if(e==="off")return;const p=a.domElement;let u=!1,f=0,w=0;const b=(M,z)=>{u=!0,f=M,w=z},T=(M,z)=>{u&&(n.camYaw-=(M-f)*.005,n.camPitch=E.clamp(n.camPitch+(z-w)*.004,-.25,1.05),f=M,w=z)},R=()=>{u=!1},L=M=>b(M.clientX,M.clientY),S=M=>T(M.clientX,M.clientY),G=M=>{M.preventDefault(),n.camDist=E.clamp(n.camDist*(1+Math.sign(M.deltaY)*.1),22,190)},A=M=>M.touches[0]&&b(M.touches[0].clientX,M.touches[0].clientY),j=M=>{M.touches[0]&&T(M.touches[0].clientX,M.touches[0].clientY),M.preventDefault()};return p.addEventListener("pointerdown",L),window.addEventListener("pointermove",S),window.addEventListener("pointerup",R),p.addEventListener("wheel",G,{passive:!1}),p.addEventListener("touchstart",A,{passive:!1}),p.addEventListener("touchmove",j,{passive:!1}),window.addEventListener("touchend",R),()=>{p.removeEventListener("pointerdown",L),window.removeEventListener("pointermove",S),window.removeEventListener("pointerup",R),p.removeEventListener("wheel",G),p.removeEventListener("touchstart",A),p.removeEventListener("touchmove",j),window.removeEventListener("touchend",R)}},[e,a,n]),g.useEffect(()=>{if(e==="helm")return n.x=40*H,n.z=760*H,n.heading=Math.PI,n.speed=0,n.throttle=0,n.camYaw=0,n.camPitch=.16,n.camDist=95,n.swallowed=0,y.helm=null,bo("helm"),()=>{y.helmActive=!1}},[e,n]),g.useEffect(()=>{if(e!=="foot")return;I.chain!=="foot"&&bo("foot");const p=y.footSpawn;if(y.footSpawn="hall",p==="port"){n.area="island",n.fx=W.x+40*H,n.fz=W.z+40*H,n.fy=ne(n.fx,n.fz)+rt,n.fyaw=Math.atan2(-(ae.x-n.fx),-(ae.z-n.fz)),n.camYaw=n.fyaw,n.camPitch=-.06;return}if(p==="rear"){n.area="island",n.fx=D.gate.x+D.dir[0]*26,n.fz=D.gate.z+D.dir[1]*26,n.fy=ne(n.fx,n.fz)+rt,n.fyaw=Math.atan2(D.dir[0],D.dir[1]),n.camYaw=n.fyaw,n.camPitch=.02;return}n.area="hall",n.fx=ge.x,n.fy=ge.y+we.y,n.fz=ge.z+Le.zTop,n.fyaw=0,n.fpitch=-.05,n.camYaw=0,n.camPitch=.05},[e,n]),Q((p,u)=>{if(e!=="helm"&&e!=="foot")return;const f=Math.min(u,.05);if(y.t+=f,e==="helm"){const w=Z.throttle,b=Z.boost,T=w>0?w*(b?1:.62):w;n.throttle+=(T-n.throttle)*(1-Math.pow(.02,f)),n.rudder+=(Z.rudder-n.rudder)*(1-Math.pow(.005,f));const R=n.throttle>=0?n.throttle*ns:n.throttle*ir;n.speed+=E.clamp(R-n.speed,-as*2.5,as)*f,n.speed-=n.speed*Math.abs(n.speed)*.0016*f;const L=E.clamp(Math.abs(n.speed)/16,0,1);n.heading+=n.rudder*lr*L*Math.sign(n.speed||1)*f;const S=n.x+Math.sin(n.heading)*n.speed*f,G=n.z+Math.cos(n.heading)*n.speed*f,A=S+Math.sin(n.heading)*rs*2,j=G+Math.cos(n.heading)*rs*2;if(ut(A,j)>.06)n.x=S,n.z=G,n.aground+=(0-n.aground)*(1-Math.pow(.05,f));else{n.aground+=(1-n.aground)*(1-Math.pow(.02,f)),Et(Math.abs(n.speed)*.0012*f*60,"AGROUND — SHE IS TAKING WATER"),n.speed*=Math.pow(.06,f);const oe=6,Xe=ut(n.x+oe,n.z)-ut(n.x-oe,n.z),Zt=ut(n.x,n.z+oe)-ut(n.x,n.z-oe),Ke=Math.hypot(Xe,Zt)||1;n.x+=Xe/Ke*26*f,n.z+=Zt/Ke*26*f}const z=vs(n.x,n.z,0);n.x+=z.vx*f,n.z+=z.vz*f;const O=1-y.shelter;n.x+=is.x*O*f,n.z+=is.z*O*f;const V=Qe(n.x,n.z,y.t,1),q=Math.cos(n.heading),te=-Math.sin(n.heading),ue=V.dx*q+V.dz*te;n.heading+=E.clamp(ue*.4,-ls,ls)*O*f;let N=Ee[0],C=1/0;for(const oe of Ee){const Xe=(n.x-oe.x)**2+(n.z-oe.z)**2;Xe<C&&(C=Xe,N=oe)}if(Ds(f,{danger:z.danger,headingX:Math.sin(n.heading),headingZ:Math.cos(n.heading),toCentreX:N.x-n.x,toCentreZ:N.z-n.z,speed:n.speed,throttle:n.throttle})>=1||z.danger>.94){const oe=N;n.x=oe.x+(oe.x>0?oe.r*1.85:-oe.r*1.85),n.z=oe.z+oe.r*1.5,n.speed=0,n.throttle=0,n.heading=Math.PI,n.swallowed+=1,n.aground=1,I.grip=0,Et(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const Se=Rt(n.x,n.z),ve=E.lerp(1,.055,Se)*E.smoothstep(ut(n.x,n.z),0,.3),B=Qe(n.x,n.z,y.t,ve);y.helmActive=!0,y.helmPos.set(n.x,B.y+12,n.z);const be=z.vx*Math.cos(n.heading)-z.vz*Math.sin(n.heading),Te=E.clamp(Math.abs(n.speed)/ns,0,1),Be=E.clamp(n.rudder*L*Te*.4+be*.016,-.5,.5);n.heel+=(Be-n.heel)*(1-Math.pow(.15,f));const ot=E.clamp(Te*O*1.15+n.aground*.5+z.danger*.8,0,1);n.spray+=(ot-n.spray)*(1-Math.pow(.08,f));const Ie=i.current;Ie&&(Ie.position.set(n.x,B.y-1.4,n.z),Ie.rotation.set(E.clamp(B.dz*1.2,-.3,.3),n.heading,E.clamp(-B.dx,-.26,.26)+n.heel)),l.current&&(l.current.scale.z=1+Math.sin(y.t*1.6)*.08,l.current.scale.x=1+O*.06),h.current&&(h.current.material.opacity=n.spray*.42,h.current.scale.setScalar(.7+n.spray*.55)),c.current&&(c.current.material.opacity=.34*Te*(.28+O*.72));const U=n.heading+Math.PI+n.camYaw,re=Math.cos(n.camPitch),Me=new v(n.x+Math.sin(U)*re*n.camDist,B.y+14+Math.sin(n.camPitch)*n.camDist,n.z+Math.cos(U)*re*n.camDist),Ce=Qe(Me.x,Me.z,y.t,ve);Me.y=Math.max(Me.y,Ce.y+7),o.position.lerp(Me,1-Math.pow(6e-4,f)),o.lookAt(n.x+Math.sin(n.heading)*Te*58,B.y+12,n.z+Math.cos(n.heading)*Te*58),o.rotateZ(Math.sin(y.t*2.3)*.012*Te+n.heel*.3+n.aground*Math.sin(y.t*21)*.02+z.danger*Math.sin(y.t*2.7)*.03);const Ye=60+Te*6;Math.abs(o.fov-Ye)>.05&&(o.fov+=(Ye-o.fov)*(1-Math.pow(.06,f)),o.updateProjectionMatrix());const st=Math.hypot(n.x-(W.x+60*H),n.z-(W.z+60*H));st<90*H&&Math.abs(n.speed)<24&&(y.footSpawn="port",s?.("foot")),y.helm={speed:n.speed,heading:n.heading,throttle:n.throttle,aground:n.aground,x:n.x,z:n.z,toGate:Math.hypot(n.x,n.z-Lt),moored:st<180*H,maelstrom:z.danger,swallowed:n.swallowed},Cs(f,y.helm),y.shelter+=(Se-y.shelter)*(1-Math.pow(.06,f)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,f))}else{const w=Z.boost?hr:cr;n.fyaw=n.camYaw,n.fpitch=-n.camPitch;const b=Z.walk.x,T=Z.walk.z,R=Math.hypot(b,T),L=R>1?R:1,S=new v(-Math.sin(n.fyaw),0,-Math.cos(n.fyaw)),G=new v(-S.z,0,S.x),A=(S.x*(T/L)+G.x*(b/L))*w*f,j=(S.z*(T/L)+G.z*(b/L))*w*f;if(n.area==="island"){const M=n.fx+A,z=n.fz+j,O=ne(n.fx,n.fz),V=ne(M,z),q=Math.hypot(A,j)||1e-6,te=(V-O)/q;V>.3&&(te<1.2||V<O)&&(n.fx=M,n.fz=z);const ue=ne(n.fx,n.fz);n.fy+=(ue+rt-n.fy)*(1-Math.pow(.002,f));const N=Math.hypot(n.fx-ae.x,n.fz-ae.z),C=Math.hypot(n.fx-D.gate.x,n.fz-D.gate.z);N<80?(n.area="hall",n.fx=ge.x,n.fz=ge.z+Le.zTop,n.fy=ge.y+we.y+rt,n.fyaw=0,n.camYaw=0,n.camPitch=.05):C<40&&(n.area="hall",n.fx=ge.x+60,n.fz=ge.z+P.z+150,n.fy=ge.y+rt,n.fyaw=Math.PI,n.camYaw=Math.PI,n.camPitch=.04),y.helm={onFoot:!0,area:"island",x:n.fx,z:n.fz,fy:n.fy-ge.y,toMouth:N,toRear:C,nearPort:Math.hypot(n.fx-W.x,n.fz-W.z)<W.r*1.4};const X=Rt(n.fx,n.fz);y.shelter+=(X-y.shelter)*(1-Math.pow(.06,f))}else{n.fx+=A,n.fz+=j;const M=n.fx-ge.x,z=n.fz-ge.z;let O=z>we.z-70?we.y:z>Le.zBottom?E.lerp(0,we.y,(z-Le.zBottom)/(Le.zTop-Le.zBottom)):0;O=Math.max(O,Ia(M,z)),n.fy+=(ge.y+O+rt-n.fy)*(1-Math.pow(.005,f)),z>we.z+34&&(n.area="island",n.fx=ae.x,n.fz=ae.z+130,n.fy=ne(n.fx,n.fz)+rt,n.fyaw=Math.PI,n.camYaw=Math.PI,n.camPitch=-.04),y.helm={onFoot:!0,area:"hall",x:n.fx,z:n.fz,lz:z,fy:n.fy-ge.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,f))}o.position.set(n.fx,n.fy,n.fz),o.rotation.set(0,0,0),o.rotateY(n.fyaw),o.rotateX(n.fpitch),o.fov!==72&&(o.fov+=(72-o.fov)*(1-Math.pow(.02,f)),o.updateProjectionMatrix()),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,f))}y.fog=E.lerp(gt.sea,gt.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs("group",{ref:i,position:[0,-4e3,0],visible:e==="helm",children:[x&&t.jsx(ce,{name:d?"ship-sunny.opt.glb":"ship-lion.opt.glb",height:Kt(d?"ship-sunny.opt.glb":"ship-lion.opt.glb",58),rotation:Xt(d?"ship-sunny.opt.glb":"ship-lion.opt.glb"),position:[0,-13,0],tint:d?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),x&&r&&t.jsx(ce,{name:"crew-straw.opt.glb",height:15,rotation:0,position:[0,14,6]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!x,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!x,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:l,position:[0,17.5,1.5],visible:!x,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:je,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!x,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(p=>t.jsxs("mesh",{position:[p*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:k.lantern,emissive:k.lantern,emissiveIntensity:3.4,toneMapped:!1})]},p)),t.jsx(At,{crew:"straw",width:x?19:14,position:[0,x?38:26,-2]}),t.jsxs("mesh",{ref:c,position:[0,.6,-30],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[18,72]}),t.jsx("meshBasicMaterial",{color:$.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:h,position:[0,3.4,17],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[26,18]}),t.jsx("meshBasicMaterial",{color:$.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:et})]})]})}const cs=34,ur=13,hs=10,pr=.8,mr=.22,fr=15,so=92,ds=7,xr=6,no=72,gr=new v,us=new v;function wr({mode:e,onMode:s}){const o=ye(n=>n.camera),a=ye(n=>n.gl),i=g.useRef(),l=g.useRef(),h=g.useRef(),c=Re("ship-tang.opt.glb"),d=Re("ship-sub.opt.glb"),m=c||d,x=Re("crew-heart.opt.glb"),r=g.useRef({x:300*H,z:780*H,heading:Math.PI,speed:0,throttle:0,rudder:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0,camYaw:0,camPitch:.22,camDist:74}).current;return g.useEffect(()=>{if(e!=="sub")return;const n=a.domElement;let p=!1,u=0,f=0;const w=(j,M)=>{p=!0,u=j,f=M},b=(j,M)=>{p&&(r.camYaw-=(j-u)*.005,r.camPitch=E.clamp(r.camPitch+(M-f)*.004,-.5,1),u=j,f=M)},T=()=>{p=!1},R=j=>w(j.clientX,j.clientY),L=j=>b(j.clientX,j.clientY),S=j=>{j.preventDefault(),r.camDist=E.clamp(r.camDist*(1+Math.sign(j.deltaY)*.1),30,170)},G=j=>j.touches[0]&&w(j.touches[0].clientX,j.touches[0].clientY),A=j=>{j.touches[0]&&b(j.touches[0].clientX,j.touches[0].clientY),j.preventDefault()};return n.addEventListener("pointerdown",R),window.addEventListener("pointermove",L),window.addEventListener("pointerup",T),n.addEventListener("wheel",S,{passive:!1}),n.addEventListener("touchstart",G,{passive:!1}),n.addEventListener("touchmove",A,{passive:!1}),window.addEventListener("touchend",T),()=>{n.removeEventListener("pointerdown",R),window.removeEventListener("pointermove",L),window.removeEventListener("pointerup",T),n.removeEventListener("wheel",S),n.removeEventListener("touchstart",G),n.removeEventListener("touchmove",A),window.removeEventListener("touchend",T)}},[e,a,r]),g.useEffect(()=>{if(e==="sub")return r.x=360*H,r.z=690*H,r.heading=Math.PI,r.speed=0,r.throttle=0,r.depth=4,r.orderedDepth=4,r.berthing=0,r.camYaw=0,r.camPitch=.22,r.heel=0,y.subActive=!0,y.helm=null,bo("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,r]),Q((n,p)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const u=Math.min(p,.05);y.t+=u;const f=Z.throttle,w=Z.boost,b=f>0?f*(w?1:.7):f;r.throttle+=(b-r.throttle)*(1-Math.pow(.02,u)),y.subThrottle=Math.abs(r.throttle),r.rudder+=(Z.rudder-r.rudder)*(1-Math.pow(.003,u));const T=E.clamp(r.depth/15,0,1),R=cs*(.7+.3*T),L=r.throttle>=0?r.throttle*R:r.throttle*ur;r.speed+=E.clamp(L-r.speed,-hs*2,hs)*u,r.speed-=r.speed*Math.abs(r.speed)*.0016*u;const S=E.lerp(mr,1,E.clamp(Math.abs(r.speed)/7,0,1));r.heading+=r.rudder*pr*S*Math.sign(r.speed>=0?1:-1)*u,r.orderedDepth-=Z.planes*fr*u,r.orderedDepth=E.clamp(r.orderedDepth,0,so),Z.surfaceQueued&&(Z.surfaceQueued=!1,r.orderedDepth=0),Z.periscopeQueued&&(Z.periscopeQueued=!1,r.orderedDepth=xr);const G=r.x+Math.sin(r.heading)*r.speed*u,A=r.z+Math.cos(r.heading)*r.speed*u,j=vs(G,A,r.depth);r.x=G+j.vx*u,r.z=A+j.vz*u;const M=j.vx*Math.cos(r.heading)-j.vz*Math.sin(r.heading);r.heading+=M*.008*u;const z=E.clamp(Math.abs(r.speed)/cs,0,1),O=E.clamp(M*.02+r.rudder*S*z*.34,-.6,.6);r.heel+=(O-r.heel)*(1-Math.pow(.12,u)),j.danger>.05&&(r.speed*=Math.pow(1-.22*j.danger,u));const V=ne(r.x,r.z),q=Math.max(2,-V-ds),te=r.depth<1.5;r.depth+=(r.orderedDepth-r.depth)*(1-Math.pow(.25,u)),r.depth>q?(r.scrape+=(1-r.scrape)*(1-Math.pow(.02,u)),r.depth=q,r.orderedDepth=Math.min(r.orderedDepth,q-2),Et(Math.abs(r.speed)*.0016*u*60,"GROUNDED ON THE SHELF"),r.speed*=Math.pow(.3,u)):r.scrape+=(0-r.scrape)*(1-Math.pow(.05,u)),r.stress=r.depth>no?Math.min(1,(r.depth-no)/(so-no)):0,r.stress>0&&Et(r.stress*.035*u,"HULL UNDER PRESSURE — COME UP");const ue=r.x+Math.sin(r.heading)*26,N=r.z+Math.cos(r.heading)*26;if(ne(ue,N)>-r.depth+ds*.5){r.speed*=Math.pow(.1,u);const _e=6,Ge=ne(r.x+_e,r.z)-ne(r.x-_e,r.z),Eo=ne(r.x,r.z+_e)-ne(r.x,r.z-_e),Ro=Math.hypot(Ge,Eo)||1;r.x-=Ge/Ro*20*u,r.z-=Eo/Ro*20*u,r.scrape=Math.max(r.scrape,.5)}const X=Math.hypot(r.x-D.x,r.z-D.z);if(X<D.pool*1.1&&r.berthing===0&&(r.berthing=1e-4),r.berthing>0){r.berthing=Math.min(1,r.berthing+u*.5),r.x+=(D.berth.x-r.x)*(1-Math.pow(.1,u)),r.z+=(D.berth.z-r.z)*(1-Math.pow(.1,u)),r.orderedDepth=0,r.speed*=Math.pow(.1,u);let Ge=Math.atan2(D.dir[0],D.dir[1])+Math.PI-r.heading;for(;Ge>Math.PI;)Ge-=Math.PI*2;for(;Ge<-Math.PI;)Ge+=Math.PI*2;r.heading+=Ge*(1-Math.pow(.2,u)),r.berthing>=1&&r.depth<1.2&&(y.footSpawn="rear",y.splash+=1,s?.("foot"))}r.depth<1.5!==te&&(y.splash+=1);const ve=Qe(r.x,r.z,y.t,1),B=1-E.clamp(r.depth/10,0,1),be=-r.depth+ve.y*B,Te=E.clamp((r.orderedDepth-r.depth)*.05,-.34,.34)*Math.sign(r.speed>=0?1:-1)+ve.dz*.8*B;r.pitch+=(Te-r.pitch)*(1-Math.pow(.05,u));const Be=i.current;Be&&(Be.position.set(r.x,be,r.z),Be.rotation.set(r.pitch+r.scrape*Math.sin(y.t*23)*.02,r.heading,-ve.dx*.5*B+r.heel)),l.current&&(l.current.rotation.z+=r.throttle*9*u),h.current&&(h.current.visible=r.depth<2.5),y.subPos.set(r.x,be,r.z);const ot=r.heading+Math.PI+r.camYaw,Ie=Math.cos(r.camPitch),U=gr.set(r.x+Math.sin(ot)*Ie*r.camDist,be+10+Math.sin(r.camPitch)*r.camDist,r.z+Math.cos(ot)*Ie*r.camDist),re=ne(U.x,U.z);U.y=Math.max(U.y,re+5),o.position.lerp(U,1-Math.pow(8e-4,u)),us.set(r.x+Math.sin(r.heading)*z*46,be+6-r.pitch*30*z,r.z+Math.cos(r.heading)*z*46),o.lookAt(us),o.rotateZ(r.scrape*Math.sin(y.t*19)*.015+r.heel*.35+j.danger*Math.sin(y.t*3.1)*.02);const Me=64+z*6+(w?2:0);Math.abs(o.fov-Me)>.05&&(o.fov+=(Me-o.fov)*(1-Math.pow(.06,u)),o.updateProjectionMatrix());const Ce=Qe(o.position.x,o.position.z,y.t,1),Ye=E.clamp((Ce.y-o.position.y-1)/3,0,1);y.underwater+=(Ye-y.underwater)*(1-Math.pow(.002,u)),y.depthBelow=Math.max(0,Ce.y-o.position.y);const st=E.lerp(6e3,1700,y.underwater);Math.abs(o.far-st)>20&&(o.far=st,o.updateProjectionMatrix()),y.shelter+=((X<D.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,u));let oe=Ee[0],Xe=1/0;for(const _e of Ee){const Ge=(r.x-_e.x)**2+(r.z-_e.z)**2;Ge<Xe&&(Xe=Ge,oe=_e)}Ds(u,{danger:j.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:oe.x-r.x,toCentreZ:oe.z-r.z,speed:r.speed,throttle:r.throttle})>=1&&(Et(.22,"CAUGHT IN THE VORTEX"),r.x=oe.x+(r.x>oe.x?1:-1)*oe.r*1.9,r.z=oe.z+oe.r*1.5,r.speed=0,r.orderedDepth=Math.min(so,r.depth+18),I.grip=0,y.splash+=1);let Ke=Math.atan2(D.x-r.x,D.z-r.z)-r.heading;for(;Ke>Math.PI;)Ke-=Math.PI*2;for(;Ke<-Math.PI;)Ke+=Math.PI*2;y.helm={sub:!0,speed:r.speed,maxSpeed:R,heading:r.heading,depth:r.depth,orderedDepth:r.orderedDepth,scrape:r.scrape,stress:r.stress,maelstrom:j.danger,toRear:X,relRear:Ke,berthing:r.berthing>0,x:r.x,z:r.z},Cs(u,y.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[m&&t.jsx(ce,{name:c?"ship-tang.opt.glb":"ship-sub.opt.glb",height:Kt(c?"ship-tang.opt.glb":"ship-sub.opt.glb",24),rotation:Xt(c?"ship-tang.opt.glb":"ship-sub.opt.glb"),position:[0,c?-13:-8,0],tint:c?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:h,position:[0,7.5,-2],children:[x&&t.jsx(ce,{name:"crew-heart.opt.glb",height:9,rotation:0}),t.jsx(At,{crew:"heart",width:9,position:[0,5.5,-6]})]}),t.jsxs("group",{visible:!m,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(n=>[0,1,2,3].map(p=>t.jsxs("mesh",{position:[n*5.1,1.2,8-p*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${n}-${p}`)))]}),t.jsxs("mesh",{position:[0,.6,16.2],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,.6,19],scale:[26,26,1],children:t.jsx("spriteMaterial",{map:yr,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:et})}),t.jsxs("mesh",{position:[0,7.4,-13.5],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:l,position:[0,.4,-16.6],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(Mr,{})]})}const yr=(()=>{if(typeof document>"u")return null;const e=64,s=document.createElement("canvas");s.width=e,s.height=e;const o=s.getContext("2d"),a=o.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),o.fillStyle=a,o.fillRect(0,0,e,e);const i=new Gt(s);return i.colorSpace=Ft,i})(),br=`
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
`,vr=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function Mr(){const e=g.useRef(),s=g.useMemo(()=>{const i=new Float32Array(780),l=new Float32Array(260),h=new Float32Array(260),c=new Float32Array(260);for(let m=0;m<260;m++)i[m*3]=(Math.random()-.5)*3.4,i[m*3+1]=(Math.random()-.5)*2.6,i[m*3+2]=-14-Math.random()*4,l[m]=Math.random(),h[m]=.25+Math.random()*.3,c[m]=2+Math.random()*4;const d=new tt;return d.setAttribute("position",new Y(i,3)),d.setAttribute("aPhase",new Y(l,1)),d.setAttribute("aRate",new Y(h,1)),d.setAttribute("aSize",new Y(c,1)),d.boundingSphere=new vt(new v(0,0,-30),70),d},[]),o=g.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new v(...se($.underGlow))}}),[]);return Q((a,i)=>{const l=e.current?.uniforms;if(!l)return;l.uTime.value+=i;const h=y.subActive?y.subThrottle*(.25+y.underwater*.75):0;l.uGain.value+=(h-l.uGain.value)*.06}),t.jsx("points",{geometry:s,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:br,fragmentShader:vr,uniforms:o,transparent:!0,depthWrite:!1,blending:et,fog:!1})})}const Os=.42;let F=null,$e=null,he=null,vo=!1,He=!0;function jr(){try{const e=localStorage.getItem("oni.audio");e!==null&&(He=e==="1")}catch{}return He}function ao(e){He=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return $e&&F&&$e.gain.setTargetAtTime(e?Os:0,F.currentTime,.12),e&&F?.state==="suspended"&&F.resume(),He}function Sr(e){const s=e.sampleRate*2,o=e.createBuffer(1,s,e.sampleRate),a=o.getChannelData(0);for(let i=0;i<s;i++)a[i]=Math.random()*2-1;return o}function jt(e,s,o,a,i,l,h){const c=e.createBufferSource();c.buffer=s,c.loop=!0;const d=e.createBiquadFilter();d.type=o,d.frequency.value=a,d.Q.value=i;const m=e.createGain();return m.gain.value=l,c.connect(d).connect(m).connect(h),c.start(),{src:c,filt:d,gain:m}}function ro(){if(vo){F?.state==="suspended"&&F.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;F=new e,vo=!0,$e=F.createGain(),$e.gain.value=He?Os:0;const s=F.createDynamicsCompressor();s.threshold.value=-18,s.knee.value=22,s.ratio.value=3.4,s.attack.value=.006,s.release.value=.26;const o=F.createBiquadFilter();o.type="lowpass",o.frequency.value=18e3,o.Q.value=.4,$e.connect(o).connect(s).connect(F.destination);const a=Sr(F),i=F.createGain();i.gain.value=1,i.connect($e);const l=jt(F,a,"bandpass",480,.7,.3,i),h=jt(F,a,"highpass",1900,.5,0,i),c=jt(F,a,"lowpass",220,1.1,.22,i),d=jt(F,a,"lowpass",96,1.6,0,i),m=F.createGain();m.gain.value=1,m.connect(s);const x=F.createOscillator();x.type="sawtooth",x.frequency.value=41;const r=F.createBiquadFilter();r.type="lowpass",r.frequency.value=190,r.Q.value=1.2;const n=F.createGain();n.gain.value=0,x.connect(r).connect(n).connect(m),x.start();const p=F.createOscillator(),u=F.createOscillator(),f=F.createGain();p.frequency.value=.07,u.frequency.value=.113,f.gain.value=260,p.connect(f),u.connect(f),f.connect(l.filt.frequency),p.start(),u.start();const w=F.createGain();w.gain.value=0,w.connect($e);const b=F.createGain();b.gain.value=.16,b.connect(w);for(const[R,L]of[[146.83,1],[220,.5],[293.66,.3]]){const S=F.createOscillator();S.type="sine",S.frequency.value=R;const G=F.createGain();G.gain.value=L;const A=F.createOscillator(),j=F.createGain();A.frequency.value=.21+Math.random()*.1,j.gain.value=R*.004,A.connect(j).connect(S.frequency),A.start(),S.connect(G).connect(b),S.start()}const T=jt(F,a,"bandpass",900,3.2,.05,w);return he={stormBus:i,festBus:w,wind:l,rain:h,sea:c,roar:d,breath:T,buf:a,comp:s,muffle:o,humGain:n,subBus:m},F}function zr(){if(!F||!he||!He)return;const e=F.currentTime;for(const[s,o]of[[0,.16],[.9,.045]]){const a=F.createOscillator(),i=F.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+s),a.frequency.exponentialRampToValueAtTime(1180,e+s+.5),i.gain.setValueAtTime(0,e+s),i.gain.linearRampToValueAtTime(o,e+s+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+s+1.4),a.connect(i).connect(he.subBus),a.start(e+s),a.stop(e+s+1.5)}}function kr(e=1){if(!F||!he||!He)return;const s=F.currentTime,o=F.createBufferSource();o.buffer=he.buf;const a=F.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,s),a.frequency.exponentialRampToValueAtTime(240,s+.5),a.Q.value=.7;const i=F.createGain();i.gain.setValueAtTime(0,s),i.gain.linearRampToValueAtTime(.5*e,s+.02),i.gain.exponentialRampToValueAtTime(1e-4,s+.8),o.connect(a).connect(i).connect($e),o.start(s),o.stop(s+.9)}function pt(e,s=1,o=82){if(!F||!he)return;const a=F.createOscillator(),i=F.createGain();a.type="sine",a.frequency.setValueAtTime(o*2.1,e),a.frequency.exponentialRampToValueAtTime(o,e+.06),a.frequency.exponentialRampToValueAtTime(o*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(s,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(i).connect(he.festBus),a.start(e),a.stop(e+.7);const l=F.createBufferSource();l.buffer=he.buf;const h=F.createBiquadFilter();h.type="bandpass",h.frequency.value=1400,h.Q.value=.8;const c=F.createGain();c.gain.setValueAtTime(s*.5,e),c.gain.exponentialRampToValueAtTime(1e-4,e+.09),l.connect(h).connect(c).connect(he.festBus),l.start(e),l.stop(e+.12)}function Tr(e=1,s=0){if(!F||!he||!He)return;const o=F.currentTime+s,a=F.createBufferSource();a.buffer=he.buf,a.loop=!0;const i=F.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,o),i.frequency.exponentialRampToValueAtTime(70,o+2.6),i.Q.value=.9;const l=F.createGain(),h=.5*e;l.gain.setValueAtTime(0,o),l.gain.linearRampToValueAtTime(h,o+.05),l.gain.exponentialRampToValueAtTime(h*.24,o+.7),l.gain.exponentialRampToValueAtTime(h*.42,o+1.35),l.gain.exponentialRampToValueAtTime(1e-4,o+3.4),a.connect(i).connect(l).connect(he.stormBus),a.start(o),a.stop(o+3.6);const c=F.createOscillator(),d=F.createGain();c.type="sine",c.frequency.setValueAtTime(46,o),c.frequency.exponentialRampToValueAtTime(28,o+2.2),d.gain.setValueAtTime(0,o),d.gain.linearRampToValueAtTime(.32*e,o+.08),d.gain.exponentialRampToValueAtTime(1e-4,o+2.6),c.connect(d).connect(he.stormBus),c.start(o),c.stop(o+2.8)}function Er(e=.5){if(!F||!he||!He)return;const s=F.currentTime;for(const[o,a,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const l=F.createOscillator(),h=F.createGain();l.type="sine",l.frequency.value=61*o,h.gain.setValueAtTime(0,s),h.gain.linearRampToValueAtTime(e*a,s+.008),h.gain.exponentialRampToValueAtTime(1e-4,s+i),l.connect(h).connect($e),l.start(s),l.stop(s+i+.1)}}let Fe=0,io=0,ps=0,St=0;function Rr(e){if(!vo||!F||!he||!He)return;const s=F.currentTime,o=e.shelter,a=e.underwater,i=e.subActive?.12:1,l=Math.sin(o*Math.PI*.5)*i*(1-a*.92);if(he.stormBus.gain.setTargetAtTime(Math.cos(o*Math.PI*.5),s,.35),he.festBus.gain.setTargetAtTime(l,s,.35),he.rain.gain.gain.setTargetAtTime(.22*e.rain,s,.4),he.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),s,.5),he.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),s,.5),he.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),s,.3),he.muffle.frequency.setTargetAtTime(18e3-a*17400,s,.18),he.humGain.gain.setTargetAtTime(e.subActive?a*(.045+e.subThrottle*.11):0,s,.25),e.splash!==ps&&(ps=e.splash,kr(1)),e.subActive&&a>.5?St===0?St=s+1.2:s>=St&&(zr(),St=s+6.5):St=0,o>.06){const c=.9090909090909091;for(Fe<s&&(Fe=s+.1);Fe<s+.35;){const d=io%8,m=o*.9;d===0?pt(Fe,.85*m,74):d===2?pt(Fe,.45*m,88):d===4?pt(Fe,.7*m,74):d===6?pt(Fe,.4*m,92):d===7&&(pt(Fe,.3*m,96),pt(Fe+c*.5,.36*m,96)),io++,Fe+=c}}else Fe=0,io=0}function Ar(){const e=g.useRef(!1),s=g.useRef(-1);return Q(()=>{if(Rr(y),y.flash>.55&&!e.current){e.current=!0;const o=y.flashDir,a=500+Math.abs(o.z)*900;Tr(Math.min(1,.55+y.flash*.6),a/340)}else y.flash<.08&&(e.current=!1);y.shot!==s.current&&(y.shot===4&&s.current>=0&&Er(.55),s.current=y.shot)}),null}function Gr(){return Q(()=>sr(),-100),null}function Fr({every:e=12}){const s=ye(a=>a.gl),o=g.useRef(0);return g.useEffect(()=>(s.shadowMap.autoUpdate=!1,s.shadowMap.needsUpdate=!0,()=>{s.shadowMap.autoUpdate=!0}),[s]),Q(()=>{o.current+=1,o.current%e===0&&(s.shadowMap.needsUpdate=!0)}),null}function Lr({budget:e}){const s=ye(a=>a.setDpr),o=g.useRef(e.dpr[1]);return t.jsx($s,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{o.current=Math.max(e.dpr[0],o.current-.25),s(o.current)},onIncline:()=>{o.current=Math.min(e.dpr[1],o.current+.25),s(o.current)},onFallback:()=>{o.current=e.dpr[0],s(e.dpr[0])}})}function Pr(){const e=ye(a=>a.gl),s=ye(a=>a.scene),o=ye(a=>a.camera);return g.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(s,o)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(a)},[e,s,o]),null}function Ir(){const{camera:e,scene:s,gl:o}=ye();return g.useEffect(()=>{},[e,s,o]),null}const Cr=new fe($.haze),Dr=new fe($.underHaze),Or=new fe($.abyss),ms=new fe;function Nr(){const e=ye(s=>s.scene);return Q(()=>{if(!e.fog)return;const s=E.clamp(y.depthBelow/70,0,1),o=E.lerp(.0062,.0135,s);e.fog.density=E.lerp(y.fog,o,y.underwater),ms.copy(Dr).lerp(Or,s*.8),e.fog.color.lerpColors(Cr,ms,y.underwater)}),null}function Hr({quality:e,budget:s,onRails:o,playing:a,speed:i,onShot:l,mode:h,onMode:c}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[$.haze]}),t.jsx("fogExp2",{attach:"fog",args:[$.haze,y.fog]}),t.jsx(nn,{storm:y}),t.jsx(ra,{quality:e,shadowMap:s.shadowMap,shadows:s.shadows}),t.jsx(kn,{quality:e,segments:s.segments}),t.jsx(Mn,{quality:e,storm:y}),t.jsx(An,{quality:e,shadows:s.shadows}),t.jsx(Fn,{quality:e,shadows:s.shadows}),t.jsx(Cn,{quality:e,shadows:s.shadows}),t.jsx(On,{quality:e,shadows:s.shadows}),t.jsx(ta,{quality:e}),t.jsx(sa,{shadows:s.shadows}),t.jsx(er,{quality:e,shadows:s.shadows}),t.jsx(ma,{quality:e}),t.jsx(wa,{quality:e}),t.jsx(za,{quality:e}),t.jsx(La,{onRails:o&&h==="off",playing:a&&h==="off",speed:i,onShot:l,idle:h!=="off"}),t.jsx(Gr,{}),t.jsx(dr,{mode:h,onMode:c}),t.jsx(wr,{mode:h,onMode:c}),t.jsx(Ar,{}),t.jsx(Nr,{}),t.jsx(Ir,{}),t.jsx(Pr,{}),t.jsx(Lr,{budget:s}),s.shadows&&t.jsx(Fr,{every:s.shadowEvery})]})}const zt="#d63420",Br="rgba(8,6,16,0.72)",fs="(max-width: 860px), (max-height: 520px)",lo="min(7.5vh, 62px)";function _r(e=2600,s=!0){const[o,a]=g.useState(!1);return g.useEffect(()=>{if(!s){a(!1);return}let i;const l=()=>{a(!1),clearTimeout(i),i=setTimeout(()=>a(!0),e)};l();for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(h,l,{passive:!0});return()=>{clearTimeout(i);for(const h of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(h,l)}},[e,s]),o}function Ur(){const[e,s]=g.useState(()=>typeof window<"u"&&window.matchMedia(fs).matches);return g.useEffect(()=>{const o=window.matchMedia(fs),a=()=>s(o.matches);return o.addEventListener?o.addEventListener("change",a):o.addListener(a),()=>{o.removeEventListener?o.removeEventListener("change",a):o.removeListener(a)}},[]),e}function Ze({on:e,onClick:s,children:o,title:a,wide:i,block:l}){return t.jsx("button",{onClick:s,title:a,style:{appearance:"none",border:`1px solid ${e?zt:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||l?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:l?"100%":void 0,textAlign:l?"right":"center",minHeight:32},children:o})}function Wr({shot:e,shotIndex:s,shotCount:o,total:a,playing:i,onRails:l,speed:h,tier:c,override:d,dev:m,onPlay:x,onRailsToggle:r,onSpeed:n,onQuality:p,onRestart:u,audio:f,onAudio:w,mode:b,onMode:T,stage:R,veiled:L=!1}){const S=b!=="off",G=Ur(),[A,j]=g.useState(!1),M=_r(2600,!S&&!A),z=g.useRef(),O=g.useRef(),V=g.useRef(),q=g.useRef(),te=g.useRef(),ue=g.useRef(),N=l&&!S;g.useEffect(()=>j(!1),[b]),g.useEffect(()=>{let B,be=performance.now(),Te=0,Be=0;const ot=Ie=>{if(B=requestAnimationFrame(ot),z.current&&(z.current.style.transform=`scaleX(${R.progress||0})`),V.current&&R.helm){const U=R.helm;if(U.onFoot)V.current.textContent=U.area==="island"?U.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":U.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(U.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(U.sub){const re=Math.abs(U.speed)*1.94;if(U.berthing)V.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Me=U.maelstrom>.22?U.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":U.stress>.02?"⚠ HULL UNDER PRESSURE":U.scrape>.3?"HULL ON THE ROCK":"",Ce=Math.abs(U.relRear*180/Math.PI),Ye=Ce<6?"· ON COURSE":U.relRear>0?`◀ ${Ce.toFixed(0)}°`:`${Ce.toFixed(0)}° ▶`;V.current.textContent=`DEPTH ${U.depth.toFixed(0).padStart(2,"0")}/${U.orderedDepth.toFixed(0).padStart(2,"0")}m   ${re.toFixed(0).padStart(2,"0")} KN
COVE ${Math.round(U.toRear)}m  ${Ye}`+(Me?`
${Me}`:"")}}else{const re=Math.abs(U.speed)*1.94,Me=(U.heading*180/Math.PI+180)%360;V.current.textContent=`${re.toFixed(0).padStart(2,"0")} KN   BRG ${Me.toFixed(0).padStart(3,"0")}°   `+(U.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":U.moored?"MOORING":U.aground>.3?"AGROUND — HELM OVER":`GATE ${Math.round(U.toGate)}m`)}}if(q.current){const U=ar(),re=nr(I.chain);q.current.textContent=I.done?"✔ OBJECTIVE COMPLETE":U?`▸ ${I.step+1}/${re}  ${U.text}`:"",q.current.style.color=I.done?"#8fe0a0":"#ffd9cf"}if(te.current){const U=Math.max(0,Math.min(1,I.hull)),re=Math.max(0,Math.min(1,I.grip)),Me=st=>{const oe=Math.round(st*12);return"█".repeat(oe)+"·".repeat(12-oe)},Ce=U>.6?"#8fe0a0":U>.3?"#ffc46b":"#ff6b5a",Ye=re>.66?"#ff6b5a":re>.33?"#ffc46b":"rgba(255,255,255,0.45)";te.current.innerHTML=`<span style="color:${Ce}">HULL ${Me(U)}</span>`+(re>.02?`<span style="color:${Ye};margin-left:14px">VORTEX ${Me(re)}</span>`:"")}if(ue.current){const U=I.banner,re=ue.current;U?(re.dataset.text!==U.text&&(re.dataset.text=U.text,re.innerHTML=`<div class="og-banner-main">${U.text}</div>`+(U.sub?`<div class="og-banner-sub">${U.sub}</div>`:""),re.style.animation="none",re.offsetWidth,re.style.animation=""),re.style.opacity="1"):(re.style.opacity="0",re.dataset.text="")}m&&O.current?(Be++,Te+=Ie-be,be=Ie,Te>400&&(O.current.textContent=`${Math.round(Be*1e3/Te)} fps · shelter ${R.shelter.toFixed(2)} · fog ${(R.fog*1e4).toFixed(1)}e-4 · flash ${R.flash.toFixed(2)}`,Te=0,Be=0)):be=Ie};return B=requestAnimationFrame(ot),()=>cancelAnimationFrame(B)},[R,m]);const C={opacity:M?.16:1,transform:M?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},X=[{key:"rails",on:!l,label:l?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:r,cinematicOnly:!0},{key:"helm",on:b==="helm",label:b==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>T(b==="helm"?"off":"helm")},{key:"sub",on:b==="sub",label:b==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>T(b==="sub"?"off":"sub")},{key:"foot",on:b==="foot",label:b==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>T(b==="foot"?"off":"foot")}],Se=(B,be)=>t.jsx(Ze,{on:B.on,onClick:B.click,title:B.title,wide:!0,block:be,children:B.label},B.key),ve=B=>t.jsxs(t.Fragment,{children:[!S&&t.jsxs(t.Fragment,{children:[t.jsx(Ze,{on:i,onClick:x,title:"Play / pause the cinematic",block:B,children:i?B?"❙❙  PAUSE":"❙❙":B?"▶  PLAY":"▶"}),[.5,1,2].map(be=>t.jsxs(Ze,{on:h===be,onClick:()=>n(be),title:`${be}× speed`,block:B,children:[be,"×"]},be))]}),t.jsx(Ze,{on:!1,onClick:u,title:"Restart from the open sea",block:B,children:B?"↺  RESTART":"↺"}),t.jsx(Ze,{on:f,onClick:w,title:"Storm, taiko and a temple bell — all synthesised",block:B,children:f?B?"♪  SOUND ON":"♪":B?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Ze,{on:d!=="auto",wide:!0,block:B,title:"Render tier",onClick:()=>p(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${c.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!L&&t.jsxs(t.Fragment,{children:[[0,1].map(B=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[B?"bottom":"top"]:0,height:N?lo:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},B)),t.jsxs("div",{className:"og-tategaki",style:{opacity:S||A?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:S?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${zt}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:S?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:z,style:{height:"100%",background:`linear-gradient(90deg, ${zt}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${zt}`}})}),t.jsx("div",{className:`og-chrome${S?"":" og-chrome-bottom"}`,style:{...S?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...C},children:G?t.jsxs(t.Fragment,{children:[S&&t.jsx(Ze,{on:!0,onClick:()=>T("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(Ze,{on:A,onClick:()=>j(B=>!B),title:"Menu",children:A?"✕":"☰"}),A&&t.jsxs("div",{className:"og-menu",children:[X.filter(B=>!(B.cinematicOnly&&S)).map(B=>Se(B,!0)),t.jsx("div",{className:"og-menu-rule"}),ve(!0)]})]}):t.jsxs(t.Fragment,{children:[ve(!1),X.filter(B=>!(B.cinematicOnly&&S)).map(B=>Se(B,!1))]})}),!S&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...C,pointerEvents:"none"},children:[l?`SHOT ${String(s+1).padStart(2,"0")} / ${String(o).padStart(2,"0")}`:"FREE LOOK · DRAG TO ORBIT · SCROLL TO ZOOM",t.jsx("span",{style:{opacity:.5},children:l?`  ·  ${Math.round(a)}s`:""})]}),S&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:q,className:"og-objective"}),t.jsx("div",{ref:V,className:"og-readout"}),t.jsx("div",{ref:te,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:b==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FULL · DRAG LOOK":b==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · F SURFACE · P PERISCOPE · DRAG LOOK":"WASD MOVE · SHIFT RUN · DRAG LOOK"})]}),S&&t.jsx("div",{ref:ue,className:"og-banner"}),m&&t.jsx("div",{ref:O,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Br,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${N?lo:"0px"};
          --og-bottom: ${N?lo:"0px"};
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
          color: ${zt};
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
      `})]})}const co="#d63420",$r=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Vr({onPick:e}){const[s,o]=g.useState(!1),a=g.useRef(),i=620,l=d=>{s||(o(!0),e(d))},[h,c]=g.useState(!1);return g.useEffect(()=>{if(!s)return;const d=setTimeout(()=>c(!0),i);return()=>clearTimeout(d)},[s]),g.useEffect(()=>{const d=m=>{(m.key==="Escape"||m.key==="Enter")&&l("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),h?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:s?0:1,pointerEvents:s?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:$r.map((d,m)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+m*.07}s`},onClick:()=>l(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${co};
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
          border-color: ${co};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${co};
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
      `})]})}const Ns="#d63420",Hs="#4aa9c9",Yr=(e,s,o)=>e<s?s:e>o?o:e;function Bs(e,s,o){const a=g.useRef(s);a.current=s;const i=g.useRef(null),l=g.useRef({x:0,y:0});g.useEffect(()=>{const h=e.current;if(!h||!o)return;const c=x=>{if(i.current===null){i.current=x.pointerId,l.current={x:x.clientX,y:x.clientY};try{h.setPointerCapture?.(x.pointerId)}catch{}a.current.onMove(0,0,x.clientX,x.clientY),x.preventDefault()}},d=x=>{if(x.pointerId!==i.current)return;const r=l.current;a.current.onMove(x.clientX-r.x,x.clientY-r.y,r.x,r.y),x.preventDefault()},m=x=>{x.pointerId===i.current&&(i.current=null,a.current.onEnd(),x.preventDefault())};return h.addEventListener("pointerdown",c),h.addEventListener("pointermove",d),h.addEventListener("pointerup",m),h.addEventListener("pointercancel",m),()=>{h.removeEventListener("pointerdown",c),h.removeEventListener("pointermove",d),h.removeEventListener("pointerup",m),h.removeEventListener("pointercancel",m)}},[e,o])}function ho({label:e,sub:s,onDown:o,onUp:a,tone:i="plain",wide:l=!1}){const[h,c]=g.useState(!1),d=g.useRef();g.useEffect(()=>{const x=d.current;if(!x)return;let r=null;const n=u=>{r=u.pointerId;try{x.setPointerCapture?.(r)}catch{}c(!0),o(),u.preventDefault(),u.stopPropagation()},p=u=>{u.pointerId===r&&(r=null,c(!1),a(),u.preventDefault(),u.stopPropagation())};return x.addEventListener("pointerdown",n),x.addEventListener("pointerup",p),x.addEventListener("pointercancel",p),x.addEventListener("pointerleave",p),()=>{x.removeEventListener("pointerdown",n),x.removeEventListener("pointerup",p),x.removeEventListener("pointercancel",p),x.removeEventListener("pointerleave",p)}},[o,a]);const m=i==="hot"?Ns:i==="cool"?Hs:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${h?m:"rgba(255,255,255,0.18)"}`,background:h?`color-mix(in srgb, ${m} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:h?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),s&&t.jsx("span",{className:"og-btn-sub",children:s})]})}function Xr({active:e}){const s=g.useRef(),o=g.useRef(),a=78;return Bs(s,{onMove:(i,l,h,c)=>{const d=s.current;if(!d)return;const m=d.getBoundingClientRect(),x=m.top+m.height/2,r=Yr((c+l-x)/a,-1,1),n=Math.abs(r)<.1?0:r;K.active=!0,K.planes=-n;const p=o.current;p&&(p.style.transform=`translate(-50%, calc(-50% + ${r*a}px))`,p.style.borderColor=Hs,p.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{K.planes=0;const i=o.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:s,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsx("div",{ref:o,className:"og-planes-knob",children:"⇕"})]})}function Kr({mode:e}){const s=g.useRef(),o=g.useRef(),a=g.useRef(),i=g.useRef(),l=62,h=7,c=g.useRef(e);if(c.current=e,Bs(s,{onMove:(x,r,n,p)=>{const u=Math.hypot(x,r),f=u>l?l/u:1,w=x*f,b=r*f,T=o.current,R=a.current;T&&(T.style.transform=`translate(${n-l}px, ${p-l}px)`,T.style.opacity="1"),R&&(R.style.transform=`translate(${n+w-26}px, ${p+b-26}px)`,R.style.opacity="1"),i.current&&(i.current.style.opacity="0");const L=Math.abs(w)<h?0:w/l,S=Math.abs(b)<h?0:b/l;K.active=!0,c.current==="foot"?(K.walk.x=L,K.walk.z=-S):(K.throttle=-S,K.rudder=-L)},onEnd:()=>{o.current&&(o.current.style.opacity="0"),a.current&&(a.current.style.opacity="0"),i.current&&(i.current.style.opacity=""),K.throttle=0,K.rudder=0,K.walk.x=0,K.walk.z=0}},e!=="off"),g.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),g.useEffect(()=>()=>{K.throttle=0,K.rudder=0,K.planes=0,K.boost=!1,K.walk.x=0,K.walk.z=0},[e]),e==="off")return null;const d=e==="sub",m=e==="foot";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:s,style:{position:"fixed",left:0,bottom:0,width:"50vw",height:"62vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:o,style:{position:"fixed",left:0,top:0,width:l*2,height:l*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:a,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${Ns}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:i,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:m?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsxs("div",{className:"og-right",children:[d&&t.jsx(Xr,{active:!0}),t.jsxs("div",{className:"og-actions",children:[d&&t.jsx(ho,{label:"SURFACE",sub:"blow all",onDown:()=>Z.surfaceQueued=!0,onUp:()=>{}}),d&&t.jsx(ho,{label:"PERISCOPE",sub:"6m",tone:"cool",wide:!0,onDown:()=>Z.periscopeQueued=!0,onUp:()=>{}}),t.jsx(ho,{label:m?"RUN":"FLANK",sub:m?"»":"full",tone:"hot",onDown:()=>K.boost=!0,onUp:()=>K.boost=!1})]})]}),t.jsx("style",{children:`
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
      `})]})}const xs={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function Zr(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,s=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||s!==null&&s<=2?"low":"mobile":e<=2||s!==null&&s<=2?"low":"high"}const qr=null;function oi(){const e=g.useMemo(()=>!1,[]),[s]=g.useState(Zr),[o,a]=g.useState("auto"),i=o==="auto"?s:o,l=xs[i]??xs.high;g.useEffect(()=>{Un(l.scene!=="low")},[l.scene]),g.useEffect(()=>or(),[]);const h=g.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[c,d]=g.useState(0),[m,x]=g.useState(!0),[r,n]=g.useState(!0),[p,u]=g.useState(1),[f,w]=g.useState(Jo[0]),[b,T]=g.useState(0),[R,L]=g.useState(jr),[S,G]=g.useState("off");g.useEffect(()=>{if(!R)return;const C=()=>{ro(),ao(!0)};for(const X of["pointerdown","keydown","touchstart"])window.addEventListener(X,C,{once:!0,passive:!0});return()=>{for(const X of["pointerdown","keydown","touchstart"])window.removeEventListener(X,C)}},[R]);const A=g.useCallback(()=>{L(C=>{const X=!C;return X&&ro(),ao(X),X})},[]),[j,M]=g.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),z=g.useCallback(C=>{R&&(ro(),ao(!0)),C==="off"?(y.jumpTo=0,x(!0),n(!0)):G(C),M(!0)},[R]),[O,V]=g.useState(!1),q=g.useRef(!0);g.useEffect(()=>{if(q.current){q.current=!1;return}V(!0);const C=setTimeout(()=>V(!1),210);return()=>clearTimeout(C)},[S]);const te=g.useCallback((C,X)=>{T(C),w(X)},[]),ue=g.useCallback(()=>{Tn(),d(C=>C+1),x(!0),n(!0)},[]),N=g.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(g.Suspense,{fallback:null,children:t.jsx(qr,{})}):t.jsxs(t.Fragment,{children:[t.jsx(Vs,{shadows:l.shadows,dpr:l.dpr,gl:{antialias:l.aa,powerPreference:"high-performance",toneMapping:en,toneMappingExposure:tn,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:6e3,position:[-190,26,880]},frameloop:"always",children:t.jsx(g.Suspense,{fallback:null,children:t.jsx(Hr,{quality:l.scene,budget:l,onRails:r,playing:m,speed:p,onShot:te,mode:S,onMode:G},c)})}),h&&j&&t.jsx(Kr,{mode:S}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:O?1:0,transition:O?"opacity .2s ease-in":"opacity .42s ease-out"}}),!j&&t.jsx(Vr,{onPick:z}),t.jsx(Wr,{veiled:!j,shot:f,shotIndex:b,shotCount:Jo.length,total:yo,playing:m,onRails:r,speed:p,tier:i,override:o,dev:N,onPlay:()=>x(C=>!C),onRailsToggle:()=>n(C=>!C),onSpeed:u,onQuality:a,onRestart:ue,audio:R,onAudio:A,mode:S,onMode:G,stage:y})]})}export{oi as default};
