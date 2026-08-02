var sa=Object.defineProperty;var aa=(e,o,n)=>o in e?sa(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var An=(e,o,n)=>aa(e,typeof o!="symbol"?o+"":o,n);import{r as g,u as J,j as t,d as js,f as Me,h as ra,i as ia}from"./vendor-C2HIMx-P.js";import{t as fe,c as j,aD as Yo,au as pn,d as mn,a5 as Te,aJ as la,f as ca,Y as Fn,a0 as Cn,ag as S,h as q,aK as ha,ay as da,az as Ot,aA as Dt,aq as Ss,R as ua,M as _e,o as Qe,at as vt,ax as ot,aL as Nt,aM as Ht,a4 as pa,a8 as xt,ar as _t,av as zs,aC as ma,A as fa}from"./three-Zo_RlN_K.js";import{f as Gt,m as fn}from"./index-UrhXD6HK.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#04161f",underGlow:"#7fc9c0",underHaze:"#0a2e35"},T={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},wo={dir:[.72,.52,-.44],col:"#f2e9cf"},ft={sea:.00105,bay:48e-5,deepGrade:210},xa=1.15;function te(e){const o=new fe(e);return[o.r,o.g,o.b]}const ga=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,wa=`
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
`;function ya({storm:e}){const o=g.useRef(),n=g.useMemo(()=>({uTime:{value:0},uHigh:{value:new j(...te(X.skyHigh))},uLow:{value:new j(...te(X.skyLow))},uCloud:{value:new j(...te(X.cloud))},uCloudLit:{value:new j(...te(X.cloudLit))},uEmber:{value:new j(...te(T.ember))},uFlash:{value:0},uFlashColor:{value:new j(...te(X.boltGlow))},uFlashDir:{value:new j(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new j(...wo.dir).normalize()},uMoonCol:{value:new j(...te(wo.col))},uUnder:{value:0},uUnderCol:{value:new j(...te(X.underHaze))}}),[]);return J((a,i)=>{const l=o.current?.uniforms;l&&(l.uTime.value+=i,l.uFlash.value=e?.flash??0,e?.flashDir&&l.uFlashDir.value.copy(e.flashDir),l.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:ga,fragmentShader:wa,uniforms:n,side:Yo,depthWrite:!1,depthTest:!1,fog:!1})]})}const U=1.9,W=e=>e*U,ie={x:0,z:W(-60)},ct=W(300),fo=W(175),ba=118,O={x:0,z:W(-402),r:W(215),baseY:300,squash:[1.18,1.04,.98]},Zt=[[-.361,.301,.883],[.361,.301,.883]],xn=[0,.02,.9998],gn=[0,-.419,.908];function wn(e,o=1){const[n,a,i]=O.squash;return{x:O.x+e[0]*O.r*n*o,y:O.baseY+e[1]*O.r*a*o,z:O.z+e[2]*O.r*i*o}}const be=Zt.map(e=>wn(e)),ce={...wn(gn),halfWidth:74,height:62};wn(xn,.94);const K={x:W(-152),y:4.5,z:W(-104),r:W(78)},In=2.35,yt=[Math.sin(In),Math.cos(In)],$=(()=>{const e=ct+fo*.35,o=ie.x+yt[0]*e,n=ie.z+yt[1]*e;return{x:o,z:n,pool:W(46),benchY:3.6,reach:W(560),gate:{x:o-yt[0]*W(44),z:n-yt[1]*W(44)},berth:{x:o+yt[0]*W(12),z:n+yt[1]*W(12)},dir:yt}})(),va=[{rank:1,role:"east-south",ang:.75,dist:W(730),r:W(146),depth:36,dir:-1,speed:33},{rank:2,role:"west-south",ang:-.75,dist:W(730),r:W(144),depth:35,dir:1,speed:33},{rank:3,role:"back-door",ang:2.18,dist:W(770),r:W(142),depth:40,dir:1,speed:34},{rank:4,role:"east",ang:1.35,dist:W(690),r:W(155),depth:40,dir:1,speed:35},{rank:5,role:"west",ang:-1.35,dist:W(690),r:W(150),depth:38,dir:-1,speed:34},{rank:6,role:"west-north",ang:-2.05,dist:W(765),r:W(150),depth:42,dir:1,speed:35}],Ae=[];function ks(e){const o=e==="low"?3:e==="mid"?5:7;Ae.length=0;for(const n of va)n.rank>o||Ae.push({role:n.role,x:ie.x+Math.sin(n.ang)*n.dist,z:ie.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Ae}const Ma=e=>Ae.find(o=>o.role===e)??Ae[0];ks("high");function Ts(e,o,n=0){let a=0,i=0;const l=1-Fe(8,34,n);if(l<=0)return{vx:a,vz:i,danger:0};let c=0;for(const h of Ae){const d=e-h.x,p=o-h.z,x=Math.hypot(d,p);if(x>h.r*1.7||x<.001)continue;const u=x/h.r,m=1-Fe(1,1.6,u),r=h.speed*(u/.3)*Math.exp(1-u/.3)*.62*m,s=h.speed*.55*Math.exp(-u*u*2.6)*m+h.speed*.1*m,f=1/x;a+=(-p*f*r*h.dir-d*f*s)*l,i+=(d*f*r*h.dir-p*f*s)*l,c=Math.max(c,(1-Fe(.15,1.15,u))*l)}return{vx:a,vz:i,danger:c}}const Es={x:0,halfWidth:W(96)},Mt=W(258),Jt=W(624),yo={safe:260,range:1150},ja=0,xo=W(1500),bo=e=>e<0?0:e>1?1:e;function Sa(e,o,n=4){let a=0,i=1,l=1,c=0;for(let h=0;h<n;h++){const d=1-Math.abs(Gt(e*l,o*l,1)*2-1);a+=d*d*i,c+=i,i*=.52,l*=2.07}return a/c}const Fe=(e,o,n)=>{const a=bo((n-e)/(o-e));return a*a*(3-2*a)};function za(e){if(e>W(430))return 1e4;const o=1-Fe(W(430),W(205),e),n=Fe(W(150),W(-30),e);return Es.halfWidth+o*W(620)+n*W(300)}function ka(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let a=ba;return a+=o*190,a+=Math.max(0,n)*46,a-=Math.max(0,-n)*26,a}function re(e,o){const n=e-ie.x,a=o-ie.z,i=Math.hypot(n,a),l=Math.atan2(n,a),c=(i-ct)/fo,h=Math.exp(-c*c*1.35)*ka(l),d=Math.max(0,i-ct-fo*.55),p=-Math.pow(d/210,1.6)*175,x=Math.max(0,ct-fo*.5-i),u=-Fe(0,150,x)*46,m=bo(h/60),r=(Sa(e*.0052/U+13,o*.0052/U-21,4)-.42)*168*m,s=(Gt(e*.0042/U+31,o*.0042/U-17,4)-.5)*84*m,f=(Gt(e*.021-5,o*.021+9,3)-.5)*17*m;let b=h+p+u+r+s+f;const w=za(o),v=1-Fe(w,w+W(105),Math.abs(e-Es.x)),M=1-Fe(W(-40),W(-190),o),R=v*M;b=b*(1-R)+Math.min(b,-34)*R;const E=Math.hypot(e-O.x,o-O.z);b+=Math.exp(-Math.pow(E/(O.r*1.55),2))*62;const F=(e-K.x)/W(76),A=(o-K.z)/W(58),C=(1-Fe(.72,1.18,Math.hypot(F,A)))*bo((b+34)/34);b=b*(1-C)+K.y*C;const z=e-$.x,k=o-$.z;if(Math.abs(z)+Math.abs(k)<$.reach+W(140)){const N=Math.max(0,Math.min($.reach,z*$.dir[0]+k*$.dir[1])),I=z-$.dir[0]*N,V=k-$.dir[1]*N,Z=Math.hypot(I,V),oe=W(30)+N/$.reach*W(48),G=1-Fe(oe,oe+W(62),Z);b=b*(1-G)+Math.min(b,-26)*G;const L=Math.hypot(z,k),Q=1-Fe($.pool*.55,$.pool,L);b=b*(1-Q)+Math.min(b,-14)*Q;const ae=(e-$.gate.x)/W(30),xe=(o-$.gate.z)/W(24),ne=1-Fe(.72,1.18,Math.hypot(ae,xe));b=b*(1-ne)+$.benchY*ne}return b}function yn(e,o,n=3){const a=re(e+n,o)-re(e-n,o),i=re(e,o+n)-re(e,o-n),l=-a,c=2*n,h=-i,d=Math.hypot(l,c,h)||1;return[l/d,c/d,h/d]}function Ta(e,o,n=3){return Math.acos(yn(e,o,n)[1])}function eo(e,o){const n=Fe(W(250),W(40),o),a=1-Fe(ct-W(40),ct+W(90),Math.hypot(e-ie.x,o-ie.z)),i=(1-Fe(W(60),W(170),Math.hypot(e-$.x,o-$.z)))*.85;return bo(Math.max(Math.min(n,a),i))}const Rs=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],Ea=Math.PI*2;function Ra(e,o,n){let a=0,i=0,l=0;for(const c of Ae){const h=e-c.x,d=o-c.z,p=Math.max(1,Math.hypot(h,d));if(p>c.r*1.75)continue;const x=p/c.r,u=Math.exp(-3*x*x);a-=c.depth*u;const m=c.depth*6*x*u/c.r;i+=m*(h/p),l+=m*(d/p);const r=Math.atan2(d,h),s=Math.sin(r*3*c.dir+x*14-n*2.2),f=x*Math.exp(1-x)*(1-Aa(x));a+=s*f*1.6}return{y:a,dx:i,dz:l}}function Aa(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function Ke(e,o,n,a=1){let i=0,l=0,c=0;for(const d of Rs){const p=Ea/d.len,x=Math.sqrt(9.81/p),u=Math.hypot(d.dir[0],d.dir[1]),m=d.dir[0]/u,r=d.dir[1]/u,s=p*(m*e+r*o-x*n),f=d.amp*a;i+=f*Math.sin(s);const b=f*p*Math.cos(s);l+=b*m,c+=b*r}const h=Ra(e,o,n);return i+=h.y,l+=h.dx,c+=h.dz,{y:i,dx:l,dz:c}}const Fa=Rs.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Ca=()=>Ae.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),Ia=()=>Ae.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),La=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*U).toFixed(1)}, ${(250*U).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(ct-40*U).toFixed(1)}, ${(ct+90*U).toFixed(1)},
      length(p - vec2(${ie.x.toFixed(1)}, ${ie.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*U).toFixed(1)}, ${(170*U).toFixed(1)},
      length(p - vec2(${$.x.toFixed(1)}, ${$.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Ga=()=>`
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
${La}

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
${Fa}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Ca()}

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
`,Pa=()=>`
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
${Ia()}
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
`;function Oa(e,o){const n=new Uint8Array(e*e*4);for(let i=0;i<e;i++)for(let l=0;l<e;l++){const c=ie.x+((l+.5)/e-.5)*o,h=ie.z+((i+.5)/e-.5)*o,d=re(c,h),p=S.clamp(-d/46,0,1),x=(i*e+l)*4;n[x]=Math.round(p*255),n[x+1]=n[x],n[x+2]=n[x],n[x+3]=255}const a=new la(n,e,e,ca);return a.minFilter=Fn,a.magFilter=Fn,a.wrapS=Cn,a.wrapT=Cn,a.needsUpdate=!0,a}const vo={low:112,mid:190,high:286},Xo=6400;function Da(e){const o=g.useRef(),n=Xo/(vo[e]??vo.high);return J(a=>{const i=o.current;i&&(i.position.x=Math.round((a.camera.position.x-ie.x)/n)*n,i.position.z=Math.round((a.camera.position.z-ie.z)/n)*n)}),o}function Na({quality:e="high",storm:o}){const n=g.useRef(),a=Da(e),{geometry:i,uniforms:l,landTex:c,vert:h,frag:d}=g.useMemo(()=>{const p=vo[e]??vo.high,x=new pn(Xo,Xo,p,p);x.rotateX(-Math.PI/2),x.translate(ie.x,0,ie.z);const u=xo*1.05,m=Oa(e==="low"?160:256,u),r={uTime:{value:0},uLand:{value:m},uSpan:{value:u},uCentre:{value:new mn(ie.x,ie.z)},uDeep:{value:new j(...te(X.seaDeep))},uShallow:{value:new j(...te(X.seaShallow))},uFoam:{value:new j(...te(X.foam))},uSkyLow:{value:new j(...te(X.skyLow))},uGilt:{value:new j(...te(T.gilt))},uEmber:{value:new j(...te(T.ember))},uFogColor:{value:new j(...te(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new j(...te(X.abyss))},uUnderGlow:{value:new j(...te(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:Ha.clone()},uMoonCol:{value:new j(...te(_a))},uEyeA:{value:new j(be[0].x,be[0].y,be[0].z)},uEyeB:{value:new j(be[1].x,be[1].y,be[1].z)},uFlash:{value:0},uFlashColor:{value:new j(...te(X.boltGlow))},uCameraPos:{value:new j}};return{geometry:x,uniforms:r,landTex:m,vert:Ga(),frag:Pa()}},[e]);return J((p,x)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=x,u.uCameraPos.value.copy(p.camera.position),u.uFlash.value=o?.flash??0,u.uFogDensity.value=o?.fog??.0011;const m=Math.min(1,Math.max(0,(o?.depthBelow??0)/ft.deepGrade));u.uDepthFade.value=m,Ln.copy(Ua).lerp(Wa,m*.8),u.uFogColor.value.lerpVectors(Ba,Ln,o?.underwater??0)}),t.jsx("mesh",{ref:a,geometry:i,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:d,uniforms:l,transparent:!1,side:Te},c.uuid)})}const Ha=new j(...wo.dir).normalize(),_a=wo.col,Ba=new j(...te(X.haze)),Ua=new j(...te(X.underHaze)),Wa=new j(...te(X.abyss)),Ln=new j;function $a({quality:e="high",segments:o=200}){const n=g.useMemo(()=>{const a=o,i=new pn(xo,xo,a,a);i.rotateX(-Math.PI/2);const l=i.attributes.position,c=l.count,h=new Float32Array(c*3),d=new fe(X.rock),p=new fe(X.rockLit),x=new fe("#0b0e18"),u=new fe(X.snow),m=new fe(T.rockWarm),r=new fe;for(let s=0;s<c;s++){const f=l.getX(s)+ie.x,b=l.getZ(s)+ie.z,w=re(f,b);l.setX(s,f),l.setY(s,w),l.setZ(s,b);const v=yn(f,b,xo/a)[1],M=Math.max(0,(v-.55)/.45);r.copy(d).lerp(p,S.clamp(w/190,0,1));const R=1-S.clamp((w-ja)/13,0,1);r.lerp(x,R*.85);const E=S.clamp((f-ie.x)/260,0,1),F=96-E*42,A=S.clamp((w-F)/60,0,1)*M;r.lerp(u,A*(.45+E*.5));const C=Math.hypot(f-O.x,b-O.z),z=Math.exp(-Math.pow(C/330,2)),k=S.clamp((b-O.z)/260,0,1);r.lerp(m,z*k*.6*(1-A)),h[s*3]=r.r,h[s*3+1]=r.g,h[s*3+2]=r.b}return i.setAttribute("color",new q(h,3)),i.computeVertexNormals(),i.computeBoundingSphere(),i},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const bn=-30,vn=330,Va=150,pe={x:ce.x,y:ce.y-40,z:ce.z-Va-(bn+vn)},Re={centre:[0,96,bn],radii:[350,235,vn]},zt={x:pe.x+Re.centre[0],y:pe.y+Re.centre[1],z:pe.z+Re.centre[2]};function Ko(e,o=.06){const n=(e.x-zt.x)/Re.radii[0],a=(e.y-zt.y)/Re.radii[1],i=(e.z-zt.z)/Re.radii[2],l=Math.sqrt(n*n+a*a+i*i),c=1+o;if(l>=c)return null;const h=l<1e-4?0:c/l;return e.x=zt.x+(h?n*h:0)*Re.radii[0],e.y=zt.y+(h?a*h:c)*Re.radii[1],e.z=zt.z+(h?i*h:0)*Re.radii[2],e}const se={y:0,halfX:290,zFront:228,zBack:-240},ve={y:40,z:bn+vn-40,halfX:96,depth:120},Xe={zTop:ve.z-54,zBottom:140,halfX:74,steps:16},_={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},we={y:74,z:_.z+_.halfZ+26,halfX:96,depth:40},pt=we.y+3.5,Ce={y:-95,halfX:220,halfZ:175,ceiling:-34},ge={x:0,z:84,halfX:52,halfZ:40},de={y:52,halfZ:205,x:252,tiers:3,tierRise:46},oo=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],he={x:74,halfW:14,zFoot:_.z+_.halfZ+158,zTop:we.z+we.depth/2-6},As=[{kind:"rampZ",x0:-74-he.halfW,x1:-74+he.halfW,z0:he.zFoot,z1:he.zTop,y0:0,y1:pt},{kind:"rampZ",x0:he.x-he.halfW,x1:he.x+he.halfW,z0:he.zFoot,z1:he.zTop,y0:0,y1:pt},{kind:"flat",x0:-96,x1:we.halfX,z0:we.z-we.depth/2-2,z1:he.zTop+10,y:pt},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:de.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:de.y-.5},{kind:"flat",x0:de.x-38,x1:de.x+38,z0:-225,z1:de.halfZ+20,y:de.y-.5}],Ya=e=>e<=0?0:e>=1?1:e*e*(3-2*e),Fs=(()=>{const e=[],o=[],n=[],a=_.halfX+6,i=[a,a+9],l=[a+11,a+20],c=[a,a+20],h=[-212,-200],d=[-264,-252],p=[pt];for(let u=2;u<=_.storeys;u++)p.push(_.plinth+u*_.storey+1.5);e.push({kind:"flat",x0:we.halfX-6,x1:a+20,z0:-212,z1:-196,y:pt}),o.push([(we.halfX-6+a+20)/2,pt,-204,a+26-we.halfX,16]);for(let u=0;u<p.length-1;u++){const m=p[u],r=p[u+1],s=(m+r)/2;e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:h[0],z1:d[1],y0:m,y1:s}),n.push({x0:i[0],x1:i[1],z0:h[0],z1:d[1],y0:m,y1:s}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:d[0],z1:d[1],y:s}),o.push([(c[0]+c[1])/2,s,(d[0]+d[1])/2,c[1]-c[0],d[1]-d[0]]),e.push({kind:"rampZ",x0:l[0],x1:l[1],z0:d[1],z1:h[0],y0:s,y1:r}),n.push({x0:l[0],x1:l[1],z0:d[1],z1:h[0],y0:s,y1:r}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:h[0],z1:h[1],y:r}),o.push([(c[0]+c[1])/2,r,(h[0]+h[1])/2,c[1]-c[0],h[1]-h[0]])}for(let u=1;u<p.length-1;u++){const r=1-Math.min(_.storeys,u+2)*_.taper,s=_.halfX*r,f=_.z+_.halfZ*r,b=p[u];e.push({kind:"flat",x0:s-4,x1:a,z0:-224,z1:-212,y:b}),o.push([(s-4+a)/2,b,-218,a-s+4,12]),e.push({kind:"flat",x0:-s-6,x1:s+6,z0:f,z1:-212,y:b}),o.push([0,b,(f-212)/2,s*2+12,-212-f])}const x=p[p.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:x}),o.push([(a+58)/2,x,-230,a-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[a,a+20],z:[d[0],h[1]]}}})();As.push(...Fs.walks);function Xa(e,o){let n=0;for(const a of As){if(e<a.x0||e>a.x1)continue;const i=Math.min(a.z0,a.z1),l=Math.max(a.z0,a.z1);if(!(o<i||o>l))if(a.kind==="flat")a.y>n&&(n=a.y);else{const c=Ya((o-a.z0)/(a.z1-a.z0)),h=a.y0+(a.y1-a.y0)*c;h>n&&(n=h)}}return n}const y={t:0,flash:0,flashDir:new j(0,.4,-1),fog:ft.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new j(0,0,0),helmActive:!1,helmPos:new j(0,0,0),helmSpeed:0,subThrottle:0,footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new j(0,60,-200)}};function Ka(){y.t=0,y.progress=0,y.flash=0,y.fog=ft.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const Fo=new Map;let Cs=!0;function Za(e){Cs=!!e}function Qa(e){const o=fn(e);return Fo.has(o)||Fo.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),Fo.get(o)}function He(e){const[o,n]=g.useState(!1);return g.useEffect(()=>{let a=!0;return Qa(e).then(i=>{a&&n(i&&Cs)}),()=>{a=!1}},[e]),o}const it=Zt.map(e=>new j(...e).normalize()),Is=new j(...xn).normalize(),Zo=new j(...gn).normalize();function qa(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const d of it){const p=e.dot(d),x=Math.pow(Math.max(0,p),46);o-=x*.3}const a=Math.max(0,e.dot(Is)),i=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);o-=i*.19;for(const d of it){const p=new j(d.x*1.5,d.y-.55,d.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,p),26)*.075}const l=Math.max(0,e.dot(Zo));o-=Math.pow(l,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const c=Math.pow(Math.max(0,e.dot(it[0])),30)+Math.pow(Math.max(0,e.dot(it[1])),30),h=1-Math.min(1,c);return o+=(Gt(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(Gt(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const Ja=178*1.9,Oe=O.r/Ja;function Gn(e,o){const n=e*Oe,a=[new j(n*74,96*Oe,-20*Oe),new j(n*142,176*Oe,-58*Oe),new j(n*196,268*Oe,-76*Oe),new j(n*222,356*Oe,-52*Oe),new j(n*206,424*Oe,8*Oe),new j(n*154,462*Oe,72*Oe)],i=new j;for(const x of a)i.set(O.x+x.x,O.baseY+x.y,O.z+x.z),Ko(i,.12)&&x.set(i.x-O.x,i.y-O.baseY,i.z-O.z);const l=new Ot(a),c=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,d=new Dt(l,c,1,h,!1),p=d.attributes.position;for(let x=0;x<=c;x++){const u=x/c,m=34*Oe*Math.pow(1-u,.72)*(1+Math.sin(u*Math.PI)*.16),r=l.getPoint(u);for(let s=0;s<=h;s++){const f=x*(h+1)+s;if(f>=p.count)continue;const b=p.getX(f)-r.x,w=p.getY(f)-r.y,v=p.getZ(f)-r.z;p.setXYZ(f,r.x+b*m,r.y+w*m,r.z+v*m)}}return p.needsUpdate=!0,d.computeVertexNormals(),d}const er={low:4,mid:6,high:7},Ls="skull-island.opt.glb",Wt={height:1,yaw:0,lift:.02},Co=new ua,Pn=new j,no=new j;function tr(e,o,n){no.set(o[0],o[1],o[2]).normalize(),Pn.copy(no).multiplyScalar(O.r*4),Co.set(Pn,no.clone().negate()),Co.far=O.r*8;const a=Co.intersectObject(e,!0)[0];return a?a.point.clone().addScaledVector(no,-n):null}function or({shadows:e}){const{scene:o}=js(fn(Ls)),{object:n,eyes:a,nose:i,mouth:l}=g.useMemo(()=>{const c=o.clone(!0),h=new Ss().setFromObject(c),d=new j,p=new j;h.getSize(d),h.getCenter(p);const x=O.r*O.squash[1]*1.62,u=d.y>1e-4?x*Wt.height/d.y:1,m=O.r*O.squash[1]*Wt.lift;c.scale.setScalar(u),c.rotation.set(0,Wt.yaw,0),c.position.set(0,-p.y*u+m,0);const r=p.x*u,s=p.z*u,f=Math.cos(Wt.yaw),b=Math.sin(Wt.yaw);c.position.x=-(r*f+s*b),c.position.z=-(-r*b+s*f),c.updateMatrixWorld(!0);let w=0,v=0;const M={x:0,y:0,z:0},R=new j,E=[];c.traverse(I=>{I.isMesh&&E.push(I)});for(const I of E){const V=I.geometry.clone();for(const G of["position","normal"]){const L=V.attributes[G];if(!L||L.array instanceof Float32Array)continue;const Q=new Float32Array(L.count*3);for(let ae=0;ae<L.count;ae++)R.fromBufferAttribute(L,ae),Q[ae*3]=R.x,Q[ae*3+1]=R.y,Q[ae*3+2]=R.z;V.setAttribute(G,new q(Q,3))}V.applyMatrix4(I.matrixWorld);const Z=V.attributes.position;v+=Z.count;for(let G=0;G<Z.count;G++)M.x=Z.getX(G)+O.x,M.y=Z.getY(G)+O.baseY,M.z=Z.getZ(G)+O.z,Ko(M,.05)&&(Z.setXYZ(G,M.x-O.x,M.y-O.baseY,M.z-O.z),w++);w&&V.computeVertexNormals(),Z.needsUpdate=!0,V.computeBoundingSphere(),V.computeBoundingBox(),I.geometry=V,I.castShadow=e,I.receiveShadow=!1;const oe=Array.isArray(I.material)?I.material:[I.material];for(const G of oe)G.color?.multiply(nr),G.roughness=.94,G.metalness=.02}for(const I of[c,...E])I.position.set(0,0,0),I.quaternion.identity(),I.scale.set(1,1,1),I.updateMatrix();c.updateMatrixWorld(!0);const F=(I,V=1)=>{const[Z,oe,G]=O.squash;return new j(I[0]*O.r*Z*V,I[1]*O.r*oe*V,I[2]*O.r*G*V)},A=Zt.map(I=>tr(c,I,O.r*.1)??F(I,.82)),C=new j().addVectors(A[0],A[1]).multiplyScalar(.5),z=new j().addVectors(F(Zt[0],.82),F(Zt[1],.82)).multiplyScalar(.5),k=C.clone().sub(z),N=I=>{const V={x:I.x+O.x,y:I.y+O.baseY,z:I.z+O.z};return Ko(V,.22)&&I.set(V.x-O.x,V.y-O.baseY,V.z-O.z),I};return{object:c,eyes:A.map(N),nose:N(F(xn,.87).add(k)),mouth:N(F(gn,.9).add(k))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(Gs,{eyes:a,nose:i,mouth:l,teeth:null,cast:e})]})}const nr=new fe("#8f8a84");function Gs({eyes:e,nose:o,mouth:n,teeth:a,cast:i}){const l=g.useRef(),c=g.useRef(),h=g.useRef();return J(()=>{const d=y.t,p=.82+.18*Math.sin(d*2.3)*Math.sin(d*.71),x=.82+.18*Math.sin(d*1.9+2.1)*Math.sin(d*.63),u=.86+.14*Math.sin(d*1.4+.8);l.current&&(l.current.emissiveIntensity=5.2*p+y.flash*2),c.current&&(c.current.emissiveIntensity=5.2*x+y.flash*2),h.current&&(h.current.emissiveIntensity=3.4*u)}),t.jsxs(t.Fragment,{children:[e.map((d,p)=>t.jsxs("mesh",{position:d,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[O.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:p===0?l:c,color:T.furnace,emissive:T.ember,emissiveIntensity:5.2,toneMapped:!1,side:Te,roughness:1})]},p)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[O.r*.046,O.r*.083,3]}),t.jsx("meshStandardMaterial",{color:T.emberDeep,emissive:T.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,O.r*.05,-O.r*.16],children:[t.jsx("planeGeometry",{args:[O.r*.62,O.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:T.ember,emissive:T.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:Te})]}),a?.map((d,p)=>t.jsxs("mesh",{position:d.pos,scale:d.scale,rotation:[0,0,d.rot],castShadow:i,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:T.emberDeep,emissiveIntensity:.42,roughness:.78})]},p))]})]})}const sr=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function ar({quality:e="high",shadows:o=!0}){const a=He(Ls)&&e!=="low"&&sr!=="proc",{dome:i,hornL:l,hornR:c,teeth:h}=g.useMemo(()=>{const r=new ha(O.r,er[e]??7),s=r.attributes.position,f=new Float32Array(s.count*3),b=new fe(X.rock),w=new fe(T.rockWarm),v=new fe("#120b10"),M=new fe,R=new j;for(let C=0;C<s.count;C++){R.set(s.getX(C),s.getY(C),s.getZ(C)).normalize();const z=O.r*qa(R),[k,N,I]=O.squash;s.setXYZ(C,R.x*z*k,R.y*z*N,R.z*z*I);const V=Math.max(Math.pow(Math.max(0,R.dot(it[0])),5),Math.pow(Math.max(0,R.dot(it[1])),5),Math.pow(Math.max(0,R.dot(Zo)),6)*.9);M.copy(b).lerp(w,Math.min(1,V*1.5+Math.max(0,R.z)*.22));const Z=Math.max(Math.pow(Math.max(0,R.dot(it[0])),40),Math.pow(Math.max(0,R.dot(it[1])),40));M.lerp(v,Z),f[C*3]=M.r,f[C*3+1]=M.g,f[C*3+2]=M.b}r.setAttribute("color",new q(f,3)),r.computeVertexNormals();const E=new da(1,1,1),F=[],A=9;for(let C=0;C<A;C++){const z=C/(A-1)*2-1,k=ce.halfWidth*2.1,N=z*k*.5,I=Math.pow(Math.abs(z),1.7)*14,V=46-Math.abs(z)*13+C%2*7;F.push({pos:[N,ce.height*.5-I-V*.5,6],scale:[k/A*.76,V,52],rot:z*.13})}return E.dispose?.(),{dome:r,hornL:Gn(-1,e),hornR:Gn(1,e),teeth:F}},[e]),d=o,[p,x,u]=O.squash,m=(r,s)=>[r.x*O.r*p*s,r.y*O.r*x*s,r.z*O.r*u*s];return t.jsx("group",{position:[O.x,O.baseY,O.z],children:a?t.jsx(g.Suspense,{fallback:t.jsx(On,{dome:i,hornL:l,hornR:c,cast:d}),children:t.jsx(or,{shadows:d})}):t.jsxs(t.Fragment,{children:[t.jsx(On,{dome:i,hornL:l,hornR:c,cast:d}),t.jsx(Gs,{eyes:it.map(r=>m(r,.82)),nose:m(Is,.87),mouth:m(Zo,.96),teeth:h,cast:d})]})})}function On({dome:e,hornL:o,hornR:n,cast:a}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:a,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function Ze({matrices:e,target:o}){const n=g.useRef(!1);return J(()=>{if(n.current||!o.current)return;const a=Math.min(e.length,o.current.count);for(let i=0;i<a;i++)o.current.setMatrixAt(i,e[i]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const kt=190,Je=130,so=9.5;function Dn(e,o,n,a=24){const i=new Ot(e),l=new Dt(i,a,1,4,!1),c=l.attributes.position,h=new j(0,1,0),d=new j,p=new j,x=new j,u=new j,m=new j;for(let r=0;r<=a;r++){const s=r/a;i.getPointAt(s,p),i.getTangentAt(s,d),u.crossVectors(d,h).normalize(),x.crossVectors(u,d).normalize();for(let f=0;f<=4;f++){const b=r*5+f;if(b>=c.count)continue;const w=f/4*Math.PI*2+Math.PI/4,v=Math.cos(w)*o*.7071,M=Math.sin(w)*n*.7071;m.copy(p).addScaledVector(u,v).addScaledVector(x,M),c.setXYZ(b,m.x,m.y,m.z)}}return c.needsUpdate=!0,l.computeVertexNormals(),l}function rr(e,o,n,a=40){const i=[];for(let d=0;d<=10;d++){const p=d/10*2-1;i.push(new j(p*e,-30*(1-p*p),0))}const l=new Ot(i),c=new Dt(l,a,n,8,!1),h=c.attributes.position;for(let d=0;d<=a;d++){const p=d/a*2-1,x=1+(1-p*p)*.85,u=l.getPointAt(d/a);for(let m=0;m<=8;m++){const r=d*9+m;r>=h.count||h.setXYZ(r,u.x+(h.getX(r)-u.x)*x,u.y+(h.getY(r)-u.y)*x,u.z+(h.getZ(r)-u.z)*x)}}return h.needsUpdate=!0,c.computeVertexNormals(),c}function Nn({quality:e="high",shadows:o=!0,z:n=Mt,k:a=U}){const i=g.useRef(),l=g.useRef(),c=g.useRef(),h=g.useRef(),d=g.useMemo(()=>{const f=kt/2,b=Je,w=Dn([new j(-f-40,b+6,0),new j(-f-22,b+15.5,0),new j(0,b+20,0),new j(f+22,b+15.5,0),new j(f+40,b+6,0)],16,9,30),v=Dn([new j(-f-30,b+2,0),new j(0,b+8,0),new j(f+30,b+2,0)],11,5,18);return{kasagi:w,shimaki:v,rope:rr(f-6,30,6.4,44)}},[]),{tileM:p,merlonM:x,cannonM:u,lanternM:m}=g.useMemo(()=>{const f=new _e,b=new Qe,w=new j,v=new j,M=[],R=e==="low"?26:54;for(let z=0;z<R;z++){const k=z/(R-1)*2-1,N=k*(kt/2+40),I=Je+20-Math.pow(Math.abs(k),1.9)*14+5,V=-Math.sign(k)*Math.pow(Math.abs(k),3)*.5;v.set(N,I,0),b.setFromEuler(new vt(0,0,V)),w.set(1,1,1),M.push(f.clone().compose(v,b,w))}const E=[];for(const z of[-1,1])for(let k=0;k<7;k++)v.set(z*(58+k*12),26,0),b.identity(),w.set(1,1,1),E.push(f.clone().compose(v,b,w));const F=[];for(const z of[-1,1])for(let k=0;k<2;k++)for(let N=0;N<4-k;N++)v.set(z*(64+N*13+k*6),32+k*10,8),b.setFromEuler(new vt(Math.PI/2-.16,0,0)),w.set(1,1,1),F.push(f.clone().compose(v,b,w));const A=[],C=e==="low"?10:22;for(let z=0;z<C;z++){const k=z/(C-1)*2-1,N=k*(kt/2-12),I=30*(1-k*k);v.set(N,Je-34-I-7.5,0),b.identity(),w.set(1,1,1),A.push(f.clone().compose(v,b,w))}return{tileM:M,merlonM:E,cannonM:F,lanternM:A}},[e]);J(()=>{const f=y.t;i.current&&(i.current.material.emissiveIntensity=2.6+Math.sin(f*3.1)*.22+Math.sin(f*7.7)*.1+y.flash*1.4)});const r=kt/2,s=o;return t.jsxs("group",{position:[0,0,n],scale:a,children:[[-1,1].map(f=>t.jsxs("group",{position:[f*r,0,0],children:[t.jsxs("mesh",{position:[0,Je/2-30,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[so*.86,so,Je+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[so*1.5,so*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},f)),t.jsxs("mesh",{position:[0,Je-26,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[kt+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:d.shimaki,castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:d.kasagi,castShadow:s,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:l,args:[null,null,p.length],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(Ze,{matrices:p,target:l})]}),t.jsxs("mesh",{position:[0,Je-6,0],castShadow:s,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,Je-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:d.rope,position:[0,Je-34,2],castShadow:s,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(f=>{const b=30*(1-(f/(kt/2-6))**2);return t.jsx("group",{position:[f,Je-34-b-4,2],children:[0,1,2].map(w=>t.jsxs("mesh",{position:[w%2?1.1:-1.1,-2.4-w*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:Te})]},w))},f)}),[-1,1].map(f=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[f*108,6,0],castShadow:s,receiveShadow:s,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[f*108,30,6],castShadow:s,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.88})]}),t.jsxs("mesh",{position:[f*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},f)),t.jsxs("instancedMesh",{ref:h,args:[null,null,x.length],castShadow:s,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(Ze,{matrices:x,target:h})]}),t.jsxs("instancedMesh",{ref:c,args:[null,null,u.length],castShadow:s,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(Ze,{matrices:u,target:c})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,m.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Ze,{matrices:m,target:i})]})]})}const ir=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let l=0;l<4;l++){const c=n.createLinearGradient(0,0,e/2,0);c.addColorStop(0,"rgba(255,255,255,0.95)"),c.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=c,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const i=new Nt(o);return i.colorSpace=Ht,i})();function lr(e,o,n,a){const i=[];for(let l=0;l<=a;l++){const c=l/a,h=c*2-1;i.push(new j(e[0]+(o[0]-e[0])*c,e[1]+(o[1]-e[1])*c-n*(1-h*h),e[2]+(o[2]-e[2])*c))}return i}const cr=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function hr({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{lanternM:c,lampM:h,pilingM:d,katanaY:p,ground:x}=g.useMemo(()=>{const r=new _e,s=new Qe,f=new j(1,1,1),b=new j,w=[],v=e==="low"?.42:e==="mid"?.72:1;for(const[F,A,C]of cr){const z=Math.max(4,Math.round(C*v)),k=lr(F,A,14,z);for(let N=1;N<k.length-1;N++){const I=.78+N*37%11/22;b.copy(k[N]).add(new j(0,-4.2*I,0)),s.setFromEuler(new vt(0,N*1.7%Math.PI,(N%3-1)*.06)),w.push(r.clone().compose(b,s,f.clone().multiplyScalar(I)))}}const M=[],R=e==="low"?6:11;for(let F=0;F<R;F++){const A=F/(R-1);for(const C of[-1,1]){const z=S.lerp(K.x+46,ce.x-6,A)+C*(26-A*9),k=S.lerp(K.z-26,ce.z+32,A);b.set(z,re(z,k)+5,k),s.identity(),M.push(r.clone().compose(b,s,f))}}const E=[];for(let F=0;F<16;F++){const A=F%2,C=Math.floor(F/2);b.set(K.x+30+C*17,-2,K.z+34+A*26),s.setFromEuler(new vt(0,0,(F%3-1)*.035)),E.push(r.clone().compose(b,s,f))}return{lanternM:w,lampM:M,pilingM:E,katanaY:re(K.x+118,K.z-58),ground:K.y}},[e]);J(()=>{const r=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(r*2.7)*.2+Math.sin(r*6.1+1.3)*.12+y.flash*1.6),l.current){const s=46*(1+Math.sin(r*1.3)*.13);l.current.scale.set(s,s,1),l.current.material.rotation=r*.07}});const u=o,m=(r,s)=>re(K.x+r,K.z+s);return t.jsxs("group",{children:[t.jsxs("group",{position:[K.x,0,K.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(r=>t.jsxs("group",{position:[52+r*26,1.5,92+r%2*13],rotation:[0,.4+r*.3,0],children:[t.jsxs("mesh",{castShadow:u,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:Te})]})]},r))]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(Ze,{matrices:d,target:i})]}),t.jsxs("group",{position:[K.x+118,p,K.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:u,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:l,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:ir,color:T.furnace,transparent:!0,opacity:.75,blending:ot,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(r=>{const s=96+r*4,f=88*r;return t.jsxs("group",{position:[K.x+s,m(s,f),K.z+f],rotation:[0,-r*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:u,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:u,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(b=>t.jsxs("mesh",{position:[b*3,37,4],rotation:[0,0,b*.3],castShadow:u,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},b)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:u,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.9,side:Te})]})]},r)}),[-1,1].map(r=>{const s=40+r*34,f=-18+r*46;return t.jsxs("group",{position:[K.x+s,m(s,f)+12,K.z+f],rotation:[0,r*.8,0],children:[t.jsxs("mesh",{castShadow:u,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(b=>t.jsxs("mesh",{position:[b*5,7,-1],rotation:[0,0,b*-.5],castShadow:u,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},b)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:T.ember,emissive:T.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:Te})]})]},r)}),t.jsxs("group",{position:[K.x-34,m(-34,30)+2,K.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:u,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.88,side:Te,emissive:T.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(r,s)=>{const f=s/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(f)*26,55.5,Math.sin(f)*26],rotation:[0,-f,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},s)}),Array.from({length:10},(r,s)=>{const f=s/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(f)*32,44,Math.sin(f)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.5,toneMapped:!1})]},s)})]}),[0,1,2,3].map(r=>{const s=8+r*30,f=-70-r%2*14;return t.jsxs("group",{position:[K.x+s,m(s,f),K.z+f],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:r%2?"#e8dcc4":T.vermilion,roughness:.95,side:Te})]})]},r)}),[0,1,2].map(r=>{const s=.28+r*.24,f=S.lerp(K.x+46,ce.x,s),b=S.lerp(K.z-26,ce.z+26,s),w=re(f,b),v=1-r*.1;return t.jsxs("group",{position:[f,w,b],scale:v,children:[[-1,1].map(M=>t.jsxs("mesh",{position:[M*15,17,0],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},M)),t.jsxs("mesh",{position:[0,36,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:u,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.75})]})]},r)}),t.jsx("group",{position:[K.x,x,K.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(Ze,{matrices:c,target:n})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:u,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:T.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(Ze,{matrices:h,target:a})]})]})}const Hn={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function dr(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function ur({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useRef(),l=g.useRef(),{pineTrunkM:c,pineCanopyM:h,sakuraM:d,rockM:p}=g.useMemo(()=>{const u=Hn[e]??Hn.high,m=dr(20250801),r=new _e,s=new Qe,f=new j,b=new j,w=new j(0,1,0),v=new j,M=[],R=[],E=[],F=u.pine+u.sakura+u.rock;let A=0,C=0;for(;A<F&&C<F*60;){C++;const z=m()*Math.PI*2,k=ct*(.55+m()*.62),N=ie.x+Math.sin(z)*k,I=ie.z+Math.cos(z)*k,V=re(N,I);if(V<5||V>300||Ta(N,I,6)>.72||Math.hypot(N-O.x,I-O.z)<O.r*1.35)continue;const Z=N>ie.x+(m()-.5)*90,oe=A;if(A++,b.set(N,V,I),oe<u.rock){const G=yn(N,I,5);v.set(G[0],G[1],G[2]),s.setFromUnitVectors(w,v),s.multiply(new Qe().setFromEuler(new vt(m()*.5,m()*6.28,m()*.5)));const L=2.5+m()*7;f.set(L*(.7+m()*.6),L*(.5+m()*.5),L*(.7+m()*.6)),b.y-=L*.25,E.push(r.clone().compose(b,s,f))}else if(Z){if(M.length>=u.pine)continue;s.setFromEuler(new vt(0,m()*6.28,(m()-.5)*.09));const G=.72+m()*.7;f.set(G,G*(.85+m()*.45),G),M.push(r.clone().compose(b,s,f))}else{if(R.length>=u.sakura)continue;s.setFromEuler(new vt(0,m()*6.28,(m()-.5)*.13));const G=.7+m()*.75;f.set(G,G*(.8+m()*.5),G),R.push(r.clone().compose(b,s,f))}}return{pineTrunkM:M.map(z=>z.clone().multiply(pr)).concat(R.map(z=>z.clone().multiply(xr))),pineCanopyM:M.map(z=>z.clone().multiply(mr)),sakuraM:R.map(z=>z.clone().multiply(fr)),rockM:E}},[e]),x=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],castShadow:x,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(Ze,{matrices:c,target:n})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:x,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(Ze,{matrices:h,target:a})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,d.length],castShadow:x,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:T.sakura,roughness:.95,flatShading:!0,emissive:T.sakura,emissiveIntensity:.1}),t.jsx(Ze,{matrices:d,target:i})]}),t.jsxs("instancedMesh",{ref:l,args:[null,null,p.length],castShadow:x,receiveShadow:x,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(Ze,{matrices:p,target:l})]})]})}const pr=new _e().makeTranslation(0,7,0),mr=new _e().makeTranslation(0,26,0),fr=new _e().compose(new j(0,13,0),new Qe,new j(1,.72,1)),xr=new _e().compose(new j(0,5,0),new Qe,new j(.75,.62,.75));function gr({url:e,height:o,loa:n,slim:a=1,sink:i=0,rotation:l,tint:c,emissive:h,emissiveIntensity:d}){const{scene:p}=js(e),x=g.useMemo(()=>p.clone(!0),[p]),u=g.useMemo(()=>{const m=new Ss().setFromObject(x),r=new j;m.getSize(r);const s=new j;if(m.getCenter(s),n){const b=r.x>=r.z,w=Math.max(b?r.x:r.z,1e-4),v=n/w,M=b?[v,v,v*a]:[v*a,v,v];return{scale:M,offset:[-s.x*M[0],-m.min.y*M[1]-n*i,-s.z*M[2]]}}const f=r.y>1e-4?o/r.y:1;return{scale:[f,f,f],offset:[-s.x*f,-m.min.y*f,-s.z*f]}},[x,o,n,a,i]);return g.useEffect(()=>{x.traverse(m=>{if(m.isMesh&&(m.castShadow=!0,m.receiveShadow=!0,c&&m.material)){const r=Array.isArray(m.material)?m.material:[m.material];for(const s of r)s.color?.multiply(new fe(c)),h&&s.emissive&&(s.emissive.set(h),s.emissiveIntensity=d??.2)}})},[x,c,h,d]),t.jsx("group",{rotation:[0,l,0],scale:u.scale,position:u.offset,children:t.jsx("primitive",{object:x})})}class wr extends g.Component{constructor(){super(...arguments);An(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ue({name:e,height:o,loa:n=null,slim:a=1,sink:i=0,rotation:l=0,position:c=[0,0,0],tint:h=null,emissive:d=null,emissiveIntensity:p=.2,fallback:x=null}){const u=fn(e);return He(e)?t.jsx("group",{position:c,children:t.jsx(wr,{url:u,fallback:x,children:t.jsx(g.Suspense,{fallback:x,children:t.jsx(gr,{url:u,height:o,loa:n,slim:a,sink:i,rotation:l,tint:h,emissive:d,emissiveIntensity:p})})})}):t.jsx("group",{position:c,children:x})}const rt=Math.PI,_n={"ship-sunny.opt.glb":rt/2,"ship-tang.opt.glb":rt/2,"ship-punk.opt.glb":rt/2,"ship-lion.opt.glb":rt/2,"ship-bone.opt.glb":rt/2,"ship-junk.opt.glb":rt/2,"ship-warjunk.opt.glb":rt/2,"ship-sub.opt.glb":-rt/2},To=e=>e&&_n[e]!==void 0?_n[e]:rt/2,Bn={"ship-sunny.opt.glb":34,"ship-lion.opt.glb":34,"ship-punk.opt.glb":46,"ship-tang.opt.glb":28,"ship-sub.opt.glb":28,"ship-bone.opt.glb":52,"ship-junk.opt.glb":40,"ship-warjunk.opt.glb":62},Un={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},Eo=(e,o=34)=>e&&Bn[e]!==void 0?Bn[e]:o,Ro=e=>e&&Un[e]!==void 0?Un[e]:1,Qo=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),i=a.createImageData(e,o);for(let c=0;c<o;c++){const h=c/(o-1),d=Math.pow(1-h,1.7);for(let p=0;p<e;p++){const x=p/(e-1)*2-1,u=Math.max(0,1-Math.abs(x)/(.35+h*.65)),m=.45+.55*Math.pow(Math.abs(x)/(.35+h*.65),1.5),r=d*Math.pow(u,1.4)*m,s=(c*e+p)*4;i.data[s]=255,i.data[s+1]=255,i.data[s+2]=255,i.data[s+3]=Math.round(Math.min(1,r)*255)}}a.putImageData(i,0,0);const l=new Nt(n);return l.colorSpace=Ht,l})(),yr=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createImageData(e,e);for(let l=0;l<e;l++){const c=l/(e-1),h=Math.pow(1-c,1.5);for(let d=0;d<e;d++){const p=d/(e-1)*2-1,x=Math.max(0,1-Math.abs(p)),u=h*Math.pow(x,1.3),m=(l*e+d)*4;a.data[m]=255,a.data[m+1]=255,a.data[m+2]=255,a.data[m+3]=Math.round(Math.min(1,u)*255)}}n.putImageData(a,0,0);const i=new Nt(o);return i.colorSpace=Ht,i})(),go=160,Ft=112,Qt="#e6dfcf",Ps="#0c0a15",Ct=Ps;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,a,i){const l=Math.min(i??0,Math.abs(n)/2,Math.abs(a)/2);return this.moveTo(e+l,o),this.arcTo(e+n,o,e+n,o+a,l),this.arcTo(e+n,o+a,e,o+a,l),this.arcTo(e,o+a,e,o,l),this.arcTo(e,o,e+n,o,l),this.closePath(),this});function Tt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=go,o.height=Ft;const n=o.getContext("2d"),a=n.createLinearGradient(0,0,0,Ft);a.addColorStop(0,"#14101f"),a.addColorStop(.5,Ps),a.addColorStop(1,"#08060f"),n.fillStyle=a,n.fillRect(0,0,go,Ft),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,Ft),n.save(),n.translate(go/2+4,Ft/2);try{e(n)}catch(l){console.warn("[onigashima] flag emblem skipped",l)}n.restore();const i=new Nt(o);return i.colorSpace=Ht,i.anisotropy=4,i}function Io(e,o,n=Qt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Lo(e,o,n=1){e.save(),e.fillStyle=Ct,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function Wn(e,o,n=4){e.save(),e.fillStyle=Ct;for(let a=1;a<n;a++){const i=-o*.5+a*o/n;e.fillRect(i-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function $n(e,o,n=Qt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const i of[-1,1])for(const l of[-.16,.16])e.beginPath(),e.arc(i*o*1.55,o*.55+l*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const br={straw:Tt(e=>{$n(e,26),Io(e,26),Lo(e,26),Wn(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Tt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Ct;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Ct,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Tt(e=>{$n(e,26,"#d8cfc0"),e.fillStyle=Qt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Ct;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const a=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Tt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const a=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),mink:Tt(e=>{e.fillStyle=Qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();Io(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Lo(e,25,.85),e.save(),e.fillStyle=Ct,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Qt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Tt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();Io(e,26,"#cfd8e4"),Lo(e,26),Wn(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},Os={value:0},Vn=new Map;function vr(e){const o=Vn.get(e);if(o)return o;const n=br[e],a=new pa({map:n,emissiveMap:n,emissive:new fe("#9fb4d8"),emissiveIntensity:.62,roughness:.94,metalness:0,side:Te,transparent:!1});return a.onBeforeCompile=i=>{i.uniforms.uTime=Os,i.vertexShader=`uniform float uTime;
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
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Vn.set(e,a),a}function Mr(){return J((e,o)=>{Os.value+=Math.min(o,.05)}),null}const jr=(()=>{const e=new pn(1,1,14,5);return e.translate(.5,0,0),e})();function to({crew:e="straw",width:o=16,position:n=[0,0,0],rotation:a=Math.PI/2,staff:i=!0}){const l=g.useMemo(()=>vr(e)??null,[e]),c=o*(Ft/go);return l?t.jsxs("group",{position:n,rotation:[0,a,0],children:[i&&t.jsxs("mesh",{position:[0,c*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.018,o*.018,c*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsx("mesh",{geometry:jr,material:l,scale:[o,c,o]})]}):null}const Go=[{id:"scabbards",flag:"kozuki",lead:210,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:T.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:T.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445"},{id:"yakuza-a",flag:"kozuki",lead:-46,off:-142,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"yakuza-b",flag:"kozuki",lead:-70,off:34,scale:.82,sail:"#c6bba4",hull:"#453322",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58"},{id:"mink",flag:"mink",lead:-132,off:158,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"samurai-a",flag:"kozuki",lead:-186,off:-104,scale:.78,sail:"#c2b79f",hull:"#3a2d20",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56"},{id:"samurai-b",flag:"kozuki",lead:-228,off:96,scale:.75,sail:"#bdb29a",hull:"#37291d",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6f6250"},{id:"samurai-c",flag:"kozuki",lead:-272,off:-52,scale:.8,sail:"#c8bda6",hull:"#3c2e21",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#837458"},{id:"mink-b",flag:"mink",lead:-304,off:178,scale:.84,sail:"#cdc2aa",hull:"#42392b",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#68644e"},{id:"yakuza-c",flag:"kozuki",lead:-324,off:-182,scale:.78,sail:"#c4b9a2",hull:"#413526",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#75664f"},{id:"samurai-d",flag:"kozuki",lead:-354,off:58,scale:.72,sail:"#beb39b",hull:"#382a1e",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47"},{id:"mink-c",flag:"mink",lead:-388,off:-238,scale:.82,sail:"#cbc0a8",hull:"#403729",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6c684f"},{id:"yakuza-d",flag:"kozuki",lead:-412,off:226,scale:.76,sail:"#c1b69e",hull:"#3e3124",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#77694f"},{id:"samurai-e",flag:"kozuki",lead:-450,off:-96,scale:.74,sail:"#bcb199",hull:"#362820",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a"},{id:"samurai-f",flag:"kozuki",lead:-486,off:132,scale:.7,sail:"#b8ad96",hull:"#33261c",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#665945"},{id:"mink-d",flag:"mink",lead:-524,off:-298,scale:.78,sail:"#c6bba3",hull:"#3d352a",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#666249"},{id:"yakuza-e",flag:"kozuki",lead:-560,off:28,scale:.72,sail:"#bab093",hull:"#352920",lamp:T.lantern,model:"ship-junk.opt.glb",tint:"#71634c"}];function Sr(e){const o=S.lerp(820*U,150*U,e);return[(Math.sin(e*2.4)*54-e*26)*U,o]}function zr({spec:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=g.useRef();J(()=>{const r=n.current;if(!r)return;const s=S.clamp(y.progress*.82+.04,0,1),[f,b]=Sr(s),w=f+e.off*U*.94,v=b-e.lead*U*.98,M=eo(w,v),R=S.clamp(-re(w,v)/46,0,1),E=S.lerp(1,.055,M)*S.smoothstep(R,0,.28),F=Ke(w,v,y.t,E),A=e.sub?S.smoothstep(y.progress,.42,.6):0;r.position.set(w,F.y-(e.sub?4.5:1.2)*e.scale-A*40,v);const C=e.sub?.35:1;r.rotation.x=S.clamp(F.dz*1.35*C,-.32,.32),r.rotation.z=S.clamp(-F.dx*1.15*C,-.28,.28),r.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),i.current&&(i.current.material.opacity=.36*(.25+(1-M)*.75)*(1-A))});const l=e.scale,c=o==="low"?6:10,h=He(e.model2??""),d=He(e.model??""),p=h?e.model2:d?e.model:null,x=p==="ship-junk.opt.glb",u=Eo(p,34)*(x?e.scale??1:1),m=He(e.crew??"");return p?t.jsxs("group",{ref:n,children:[t.jsx(ue,{name:p,loa:u,slim:Ro(p),sink:.062,rotation:To(p),tint:h?"#9a9188":e.tint,emissive:"#3a2a18",emissiveIntensity:.16}),m&&t.jsx(ue,{name:e.crew,height:u*.085,rotation:0,position:[0,u*.085,u*.06]}),e.flag&&t.jsx(to,{crew:e.flag,width:u*(e.sub?.3:.22),position:[0,u*(e.sub?.42:.66),-u*.12],staff:!!e.sub}),t.jsxs("mesh",{position:[0,u*.3,-u*.2],children:[t.jsx("sphereGeometry",{args:[u*.03,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-u*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[u*.55,u*2.3]}),t.jsx("meshBasicMaterial",{map:Qo,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:l*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,c]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:Te,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(r=>[0,1,2,3].map(s=>t.jsxs("mesh",{position:[r*5.6,3.4,-6+s*4],rotation:[0,0,r*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${r}-${s}`))),e.flag&&t.jsx(to,{crew:e.flag,width:e.open?8:13,position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsxs("mesh",{position:[0,e.open?5.6:9.4,e.open?7:-7.4],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:e.lamp,emissive:e.lamp,emissiveIntensity:3.4,toneMapped:!1})]})]}),t.jsxs("mesh",{ref:i,position:[0,.6,-34*l],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*l,74*l]}),t.jsx("meshBasicMaterial",{map:Qo,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Yn({x:e,z:o,yaw:n,name:a,loa:i,tint:l,sunk:c=.062,flag:h=null}){const d=Eo(a,i),p=g.useRef(),x=He(a);return J(()=>{const u=p.current;if(!u)return;const m=eo(e,o),r=S.clamp(-re(e,o)/46,0,1),s=S.lerp(1,.055,m)*S.smoothstep(r,0,.28),f=Ke(e,o,y.t,s);u.position.set(e,f.y-1.5,o),u.rotation.set(S.clamp(f.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,S.clamp(-f.dx,-.22,.22))}),t.jsxs("group",{ref:p,children:[t.jsx(ue,{name:a,loa:d,slim:Ro(a),sink:c,rotation:To(a),tint:l,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&x&&t.jsx(to,{crew:h,width:d*.22,position:[0,d*.62,-d*.1]})]})}const kr=[{x:-190*U,z:320*U,yaw:.35},{x:168*U,z:438*U,yaw:-.55},{x:-88*U,z:540*U,yaw:.12},{x:236*U,z:690*U,yaw:-.28},{x:-262*U,z:748*U,yaw:.48},{x:96*U,z:880*U,yaw:-.16}],Tr=[{x:K.x+132*U*.72,z:K.z+96*U*.72,yaw:2.3},{x:K.x+168*U*.72,z:K.z+40*U*.72,yaw:1.9},{x:K.x+96*U*.72,z:K.z+150*U*.72,yaw:2.7}];function Er({quality:e="high"}){const o=g.useMemo(()=>e==="low"?Go.slice(0,5):e==="mid"?Go.slice(0,11):Go,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Mr,{}),o.map(n=>t.jsx(zr,{spec:n,quality:e},n.id)),e!=="low"&&kr.map((n,a)=>t.jsx(Yn,{...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts"},`picket-${a}`)),e!=="low"&&Tr.map((n,a)=>t.jsx(Yn,{...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki"},`moored-${a}`))]})}const Rr="#2e2a33",qo="#3a4152",Jo=X.snow,Mo="#cfe0f4";function Xn({position:e}){return t.jsx("group",{position:e,children:t.jsx(ue,{name:"stone-lantern.opt.glb",height:9,tint:"#8a93a8",fallback:t.jsxs("group",{children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:qo,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:qo,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:Mo,emissive:Mo,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Jo,roughness:.9})]})]})})})}function Ar({shadows:e=!0}){const o=g.useMemo(()=>Math.atan2($.dir[0],$.dir[1]),[]);return t.jsxs("group",{position:[$.gate.x,$.benchY,$.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:qo,roughness:.92})]},n)),t.jsx(ue,{name:"rear-gatehouse.opt.glb",height:30,rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:Rr,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Jo,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Jo,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:Te})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:Mo,emissive:Mo,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(Xn,{position:[-14,0,10]}),t.jsx(Xn,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const ao=new fe,en={color:"#7fd8c8",intensity:9e3,distance:320},Po={color:"#ffc48a",intensity:12e3,distance:300},Fr=new fe(en.color),Cr={low:1,mid:2,high:4},Et=[{pos:[K.x,40,K.z],color:T.lantern,intensity:16e3,distance:460*U*.65},{pos:[0,78,Mt],color:T.lantern,intensity:15e3,distance:430},{pos:[ce.x,ce.y+6,ce.z-30],color:T.emberDeep,intensity:3e4,distance:640},{pos:[$.gate.x,30,$.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function Ir({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const a=g.useRef(),i=g.useRef(),l=g.useRef(),c=g.useRef(),h=g.useRef(),d=g.useRef(),p=Me(u=>u.camera),x=Cr[e]??5;return J(()=>{if(a.current){a.current.intensity=y.flash*9e3;const r=y.flashDir;a.current.position.set(r.x*700,260+r.y*500,ie.z+r.z*700)}const u=y.t;i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(u*2.3)*Math.sin(u*.71))),l.current&&(l.current.intensity=62e3*(.86+.14*Math.sin(u*1.9+2.1)*Math.sin(u*.63)));const m=y.inside;if(h.current&&(h.current.intensity=.16+m*.3),d.current&&(d.current.intensity=.34+m*.26),c.current){const r=c.current,s=.06;let f=Et[0],b=1/0;for(const w of Et){const v=(p.position.x-w.pos[0])**2+(p.position.z-w.pos[2])**2;v<b&&(b=v,f=w)}if(y.subActive&&b>550*550){const w=y.subPos,v=Math.min(1,y.underwater/.35);r.position.x+=(w.x-r.position.x)*.3,r.position.y+=(w.y+14-r.position.y)*.3,r.position.z+=(w.z-r.position.z)*.3,ao.set(Po.color).lerp(Fr,v),r.color.lerp(ao,s),r.intensity+=(S.lerp(Po.intensity,en.intensity,v)-r.intensity)*s,r.distance=S.lerp(Po.distance,en.distance,v)}else if(y.helmActive&&b>550*550){const w=y.helmPos;r.position.x+=(w.x-r.position.x)*.25,r.position.y+=(w.y+16-r.position.y)*.25,r.position.z+=(w.z-r.position.z)*.25,r.color.lerp(ao.set(T.lantern),s),r.intensity+=(11e3-r.intensity)*s,r.distance=300}else r.position.x+=(f.pos[0]-r.position.x)*s,r.position.y+=(f.pos[1]-r.position.y)*s,r.position.z+=(f.pos[2]-r.position.z)*s,r.color.lerp(ao.set(f.color),s),r.intensity+=(f.intensity-r.intensity)*s,r.distance=f.distance}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:h,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:d,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(U/1.55),"shadow-camera-right":520*(U/1.55),"shadow-camera-top":520*(U/1.55),"shadow-camera-bottom":-520*(U/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:i,position:x>=2?[be[0].x,be[0].y,be[0].z]:[(be[0].x+be[1].x)/2,be[0].y,be[0].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),x>=2&&t.jsx("pointLight",{ref:l,position:[be[1].x,be[1].y,be[1].z],color:T.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:c,position:Et[0].pos,color:Et[0].color,intensity:Et[0].intensity,distance:Et[0].distance,decay:2}),x>=3&&t.jsx("pointLight",{position:[ce.x,ce.y+4,ce.z-34],color:T.emberDeep,intensity:3e4,distance:640,decay:2}),x>=4&&t.jsx("pointLight",{position:[0,78,Mt],color:T.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function Oo(e,o){let n=e>>>0;const a=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),i=[],l=o==="low"?3:5,c=(s,f,b,w,v)=>{const M=[s.clone()],R=s.clone();for(let F=0;F<w;F++)R.add(new j((a()-.5)*b*.55,-b/w,(a()-.5)*b*.42)).add(f.clone().multiplyScalar(b/w*.3)),M.push(R.clone());const E=new Dt(new Ot(M),w*2,v,l,!1);return i.push(E),M},h=c(new j(0,620,0),new j(0,0,0),620,9,3.4),d=o==="low"?1:3;for(let s=0;s<d;s++){const f=h[2+Math.floor(a()*(h.length-3))];c(f.clone(),new j(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let p=0;for(const s of i)p+=s.attributes.position.count;const x=new Float32Array(p*3),u=new Float32Array(p*3);let m=0;for(const s of i)x.set(s.attributes.position.array,m*3),u.set(s.attributes.normal.array,m*3),m+=s.attributes.position.count,s.dispose();const r=new xt;return r.setAttribute("position",new q(x,3)),r.setAttribute("normal",new q(u,3)),r}function Lr({quality:e}){const o=[g.useRef(),g.useRef(),g.useRef()],n=g.useRef(2.5),a=g.useRef({i:0,t:-1,dur:0,flicker:0}),i=g.useMemo(()=>[Oo(40503,e),Oo(20973,e),Oo(10196,e)],[e]);return J((l,c)=>{const h=Math.min(c,.05),d=a.current;if(n.current-=h,n.current<=0&&d.t<0){d.i=(d.i+1)%3,d.t=0,d.dur=.16+Math.random()*.26,d.flicker=2+Math.floor(Math.random()*3);const p=o[d.i].current;if(p){const x=(Math.random()-.5)*2.4-Math.PI*.5,u=620+Math.random()*760;p.position.set(ie.x+Math.cos(x)*u,40+Math.random()*120,ie.z+Math.sin(x)*u*.7-240),p.rotation.y=Math.random()*Math.PI*2;const m=.7+Math.random()*.8;p.scale.set(m,m,m),y.flashDir.set(p.position.x,p.position.y+400,p.position.z).normalize()}n.current=S.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(d.t>=0){d.t+=h;const p=d.t/d.dur,x=Math.abs(Math.sin(p*Math.PI*d.flicker)),u=Math.max(0,1-p);y.flash=u*u*x;const m=o[d.i].current;m&&(m.material.opacity=Math.min(1,y.flash*2.2)),p>=1&&(d.t=-1,y.flash=0,m&&(m.material.opacity=0))}else y.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:i.map((l,c)=>t.jsx("mesh",{ref:o[c],geometry:l,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:ot,depthWrite:!1,toneMapped:!1})},c))})}const Gr=`
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
`,Pr=`
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
`,Kn={low:1600,mid:3800,high:7e3},ro=460;function Or({quality:e}){const o=g.useRef(),n=Me(l=>l.camera),a=g.useMemo(()=>{const l=Kn[e]??Kn.high,c=new Float32Array(l*3),h=new Float32Array(l),d=new Float32Array(l);for(let x=0;x<l;x++)c[x*3]=Math.random()*ro,c[x*3+1]=Math.random()*ro,c[x*3+2]=Math.random()*ro,h[x]=.7+Math.random()*.6,d[x]=.55+Math.random()*.85;const p=new xt;return p.setAttribute("position",new q(c,3)),p.setAttribute("aSpeed",new q(h,1)),p.setAttribute("aLen",new q(d,1)),p.boundingSphere=new _t(new j,1e6),p},[e]),i=g.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:ro},uFall:{value:118},uSize:{value:2.4},uColor:{value:new j(...te("#b9c8e4"))},uOpacity:{value:.5}}),[]);return J((l,c)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=c,h.uCam.value.copy(n.position),h.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Gr,fragmentShader:Pr,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const Dr=`
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
`,Nr=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,Zn={low:120,mid:340,high:700};function Hr({quality:e}){const o=g.useRef(),n=g.useMemo(()=>{const i=Zn[e]??Zn.high,l=[be[0],be[1],ce,ce],c=new Float32Array(i*3),h=new Float32Array(i),d=new Float32Array(i),p=new Float32Array(i);for(let u=0;u<i;u++){const m=l[u%l.length];c[u*3]=m.x+(Math.random()-.5)*74,c[u*3+1]=m.y+(Math.random()-.5)*30,c[u*3+2]=m.z+(Math.random()-.5)*26,h[u]=Math.random(),d[u]=.045+Math.random()*.055,p[u]=2+Math.random()*4}const x=new xt;return x.setAttribute("position",new q(c,3)),x.setAttribute("aPhase",new q(h,1)),x.setAttribute("aRise",new q(d,1)),x.setAttribute("aSize",new q(p,1)),x.boundingSphere=new _t(new j(0,300,-260),700),x},[e]),a=g.useMemo(()=>({uTime:{value:0},uColor:{value:new j(...te(T.ember))}}),[]);return J((i,l)=>{o.current&&(o.current.uniforms.uTime.value+=l)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Dr,fragmentShader:Nr,uniforms:a,transparent:!0,depthWrite:!1,blending:ot,fog:!1})})}function _r({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Lr,{quality:e}),t.jsx(Or,{quality:e}),t.jsx(Hr,{quality:e})]})}const Br=`
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
`,Ur=`
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
`,Qn={low:150,mid:380,high:620};function Wr({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const c=Qn[o]??Qn.high,h=new Float32Array(c*3),d=new Float32Array(c),p=new Float32Array(c),x=new Float32Array(c),u=new Float32Array(c),m=new Float32Array(c);for(let s=0;s<c;s++)d[s]=Math.random()*Math.PI*2,p[s]=Math.random(),x[s]=.05+Math.random()*.05,u[s]=3+Math.random()*6,m[s]=Math.random();const r=new xt;return r.setAttribute("position",new q(h,3)),r.setAttribute("aAngle",new q(d,1)),r.setAttribute("aPhase",new q(p,1)),r.setAttribute("aRate",new q(x,1)),r.setAttribute("aSize",new q(u,1)),r.setAttribute("aJitter",new q(m,1)),r.boundingSphere=new _t(new j(e.x,0,e.z),e.r*1.6+40),r},[o,e]),l=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new mn(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new j(...te(X.foam))},uGain:{value:1}}),[e]);return J((c,h)=>{const d=n.current?.uniforms;if(!d)return;d.uTime.value+=h;const p=Math.hypot(c.camera.position.x-e.x,c.camera.position.z-e.z);d.uGain.value=1-S.smoothstep(p,1600,2400),a.current&&(a.current.visible=d.uGain.value>.02)}),t.jsx("points",{ref:a,geometry:i,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Br,fragmentShader:Ur,uniforms:l,transparent:!0,depthWrite:!1,blending:ot,fog:!1})})}function $r({quality:e="high"}){const o=Me(n=>n.camera);return J(()=>{let n=0;for(const a of Ae){const i=Math.hypot(o.position.x-a.x,o.position.z-a.z);n=Math.max(n,1-S.smoothstep(i,a.r*.3,a.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ae.map((n,a)=>t.jsx(Wr,{whirl:n,quality:e},a))})}const B={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},Pt={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<Jt-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*U},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Mt-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*U},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=Ma("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<$.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},Vr=e=>Pt[e]?Pt[e].length:0,Yr=()=>B.chain&&Pt[B.chain]?Pt[B.chain][B.step]??null:null;function tn(e){B.chain=Pt[e]?e:null,B.step=0,B.hull=1,B.grip=0,B.clock=0,B.done=!1,B.banner=null,B.rev++}function jo(e,o,n=3.4){B.banner={text:e,sub:o,until:B.clock+n},B.rev++}function It(e,o){B.hull<=0||(B.hull=Math.max(0,B.hull-e),B.hits++,B.hull<=0?jo("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&jo(o,null,2.2),B.rev++)}function Ds(e,o){if(B.clock+=e,B.banner&&B.clock>B.banner.until&&(B.banner=null,B.rev++),!B.chain||B.done||!o)return;const n=Pt[B.chain],a=n[B.step];if(!a)return;let i=!1;try{i=!!a.test(o)}catch{i=!1}i&&(B.step++,B.step>=n.length?(B.done=!0,jo("OBJECTIVE COMPLETE",Xr[B.chain]??"",6)):jo(n[B.step].text,n[B.step].hint,3.6),B.rev++)}const Xr={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Ns(e,{danger:o,headingX:n,headingZ:a,toCentreX:i,toCentreZ:l,speed:c,throttle:h}){if(o<=.001)return B.grip=Math.max(0,B.grip-e*.5),B.grip;const d=Math.hypot(i,l)||1,p=-i/d,x=-l/d,u=n*p+a*x,m=Math.min(1,Math.abs(c)/22),r=o*.42,s=Math.max(0,u)*m*(.35+.45*Math.min(1,Math.abs(h)));return B.grip=Math.max(0,Math.min(1,B.grip+(r-s)*e)),B.grip}const qn=24,Do=yo.safe,Jn=yo.range,$t=2.1,Kr=1.5,es=22,Zr=[Mt,Jt],Qr=new _e,No=new j,ts=new Qe,Ho=new j;function qr({quality:e="high"}){const o=g.useRef(),n=g.useMemo(()=>Array.from({length:qn},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),a=g.useRef(0),i=g.useMemo(()=>{const l=new zs(.55,1,1,e==="low"?6:10,1,!0);return l.translate(0,.5,0),l},[e]);return J((l,c)=>{const h=o.current;if(!h)return;const d=Math.min(c,.05),p=y.helm;if(y.helmActive&&p&&!p.onFoot&&!p.sub&&!p.moored){let m=null,r=1/0;for(const s of Zr){const f=Math.hypot(p.x,p.z-s);f<Do||f>Jn||f<r&&(r=f,m=s)}if(m!==null&&(a.current-=d,a.current<=0)){const s=1-S.clamp((r-Do)/(Jn-Do),0,1);a.current=S.lerp(4.5,1.9,s);const f=n.find(b=>!b.live);if(f){const b=$t*.55,w=S.lerp(230,105,s);f.x=p.x+Math.sin(p.heading)*p.speed*b+(Math.random()-.5)*w,f.z=p.z+Math.cos(p.heading)*p.speed*b+(Math.random()-.5)*w,f.y0=210+Math.random()*60,f.t=0,f.live=!0}}}let u=0;for(const m of n){if(!m.live)continue;const r=m.t;if(m.t+=d,m.t<$t){const s=m.t/$t;No.set(m.x,m.y0*(1-s*s),m.z),Ho.set(2.2,9,2.2)}else{if(r<$t){const b=Math.hypot(m.x-p.x,m.z-p.z);b<es&&It(.03*(1-b/es)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const s=(m.t-$t)/Kr;if(s>=1){m.live=!1;continue}const f=Math.min(1,s*4);No.set(m.x,Ke(m.x,m.z,y.t,1).y-4,m.z),Ho.set(11+s*9,78*f*(1-s*s*.75),11+s*9)}ts.identity(),h.setMatrixAt(u,Qr.compose(No,ts,Ho)),u++}h.count=u,h.instanceMatrix.needsUpdate=!0,h.visible=u>0}),t.jsx("instancedMesh",{ref:o,args:[i,void 0,qn],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:ot,side:Te})})}const Jr=`
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
`,ei=`
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
`,os={low:700,mid:1800,high:3200},io=260;function ti({quality:e}){const o=g.useRef(),n=g.useRef(),a=Me(c=>c.camera),i=g.useMemo(()=>{const c=os[e]??os.high,h=new Float32Array(c*3),d=new Float32Array(c),p=new Float32Array(c),x=new Float32Array(c);for(let m=0;m<c;m++)h[m*3]=Math.random()*io,h[m*3+1]=Math.random()*io,h[m*3+2]=Math.random()*io,d[m]=.5+Math.random()*1.4,p[m]=1.2+Math.random()*3.2,x[m]=Math.random();const u=new xt;return u.setAttribute("position",new q(h,3)),u.setAttribute("aSpeed",new q(d,1)),u.setAttribute("aSize",new q(p,1)),u.setAttribute("aPhase",new q(x,1)),u.boundingSphere=new _t(new j,1e6),u},[e]),l=g.useMemo(()=>({uTime:{value:0},uCam:{value:new j},uBox:{value:io},uColor:{value:new j(...te("#cfeee6"))},uGain:{value:0}}),[]);return J((c,h)=>{const d=o.current?.uniforms;d&&(d.uTime.value+=h,d.uCam.value.copy(a.position),d.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Jr,fragmentShader:ei,uniforms:l,transparent:!0,depthWrite:!1,fog:!1})})}const oi=`
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
`,ni=`
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
`,ns={low:260,mid:700,high:1300},si=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,ai=`
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
`,ss=1100;function ri({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=Me(h=>h.camera),l=g.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,d=new zs(e.r*1.02,e.r*.07,ss,h,6,!0);return d.translate(e.x,-ss/2-3,e.z),d},[e,o]),c=g.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new j(...te(X.foam))},uDeep:{value:new j(...te(X.underGlow))},uCameraPos:{value:new j},uFogDensity:{value:.0062},uFogColor:{value:new j(...te(X.underHaze))}}),[e]);return J((h,d)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=d,p.uCameraPos.value.copy(h.camera.position),p.uFogDensity.value=h.scene.fog?.density??.0062;const x=h.scene.fog?.color;x&&p.uFogColor.value.set(x.r,x.g,x.b);const u=Math.hypot(i.position.x-e.x,i.position.z-e.z),m=1-S.smoothstep(u,e.r*8,e.r*24);p.uGain.value+=(y.underwater*m-p.uGain.value)*Math.min(1,d*4),a.current&&(a.current.visible=p.uGain.value>.012)}),t.jsx("mesh",{ref:a,geometry:l,frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:si,fragmentShader:ai,uniforms:c,transparent:!0,depthWrite:!1,side:Te,blending:ot,fog:!1})})}function ii({whirl:e,quality:o}){const n=g.useRef(),a=g.useRef(),i=Me(h=>h.camera),l=g.useMemo(()=>{const h=ns[o]??ns.high,d=new Float32Array(h*3),p=new Float32Array(h),x=new Float32Array(h),u=new Float32Array(h),m=new Float32Array(h),r=new Float32Array(h);for(let f=0;f<h;f++)p[f]=Math.random()*Math.PI*2,x[f]=Math.random(),u[f]=.07+Math.random()*.1,m[f]=.12+Math.pow(Math.random(),1.8)*.5,r[f]=2+Math.random()*5;const s=new xt;return s.setAttribute("position",new q(d,3)),s.setAttribute("aAngle",new q(p,1)),s.setAttribute("aPhase",new q(x,1)),s.setAttribute("aRate",new q(u,1)),s.setAttribute("aRadius",new q(m,1)),s.setAttribute("aSize",new q(r,1)),s.boundingSphere=new _t(new j(e.x,-60,e.z),e.r+140),s},[o,e]),c=g.useMemo(()=>({uTime:{value:0},uCentre:{value:new mn(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new j(...te(X.underGlow))},uGain:{value:0}}),[e]);return J((h,d)=>{const p=n.current?.uniforms;if(!p)return;p.uTime.value+=d;const x=Math.hypot(i.position.x-e.x,i.position.z-e.z),u=1-S.smoothstep(x,e.r*1.2,e.r*4);p.uGain.value=y.underwater*u,a.current&&(a.current.visible=p.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:l,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:oi,fragmentShader:ni,uniforms:c,transparent:!0,depthWrite:!1,blending:ot,fog:!1})})}function li({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(ti,{quality:e}),Ae.map((o,n)=>t.jsx(ii,{whirl:o,quality:e},n)),Ae.map((o,n)=>t.jsx(ri,{whirl:o,quality:e},`w${n}`))]})}const So=16/9,Hs=96,_s=78;function on(e,o,n=Hs){if(!o||o>=So)return e;const a=S.degToRad(e)/2,i=2*Math.atan(Math.tan(a)*So/o);return Math.min(n,S.radToDeg(i))}function Bs(e){return!e||e>=So?1:S.clamp(.72+.28*(e/So),.86,1)}function nn(e,o,n,a=.06,i=Hs){const l=on(o,e.aspect,i);Math.abs(e.fov-l)<=.05||(e.fov+=(l-e.fov)*(1-Math.pow(a,n)),e.updateProjectionMatrix())}function sn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*S.clamp(1280/o,.55,2.2)}const Us="oni.settings.v1";function ci(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const ye={comfort:0,lookSens:1,invertY:!1,freeCam:!1},an=new Set;function Ws(){for(const e of an)e(ye)}function $s(e){return an.add(e),()=>an.delete(e)}function Mn(e,o){e in ye&&(ye[e]=o,ui(),Ws())}function zo(e){Mn(e,!ye[e])}function hi(){Mn("comfort",ye.comfort<.01?.55:ye.comfort<.9?1:0)}function di(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=ye.lookSens-1e-6);Mn("lookSens",e[(o+1)%e.length])}function ui(){try{localStorage.setItem(Us,JSON.stringify(ye))}catch{}}function pi(){let e=null;try{e=JSON.parse(localStorage.getItem(Us)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(ye))typeof e[o]==typeof ye[o]&&(ye[o]=e[o]);else ye.comfort=ci()?1:0;return Ws(),ye}const ze=(e,o)=>e+(o-e)*ye.comfort,Vt=e=>e<-1?-1:e>1?1:e,H={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,zoom:0},ht={level:0},rn=new Set;function mi(e){return rn.add(e),()=>rn.delete(e)}function jn(e){if(ht.level===e)return e;ht.level=e;for(const o of rn)o(e);return e}function Vs(){return jn((ht.level+1)%3)}const ee={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0}},qt=new Set,at=(...e)=>e.some(o=>qt.has(o));function Ys(){H.throttle=0,H.rudder=0,H.planes=0,H.boost=!1,H.walk.x=0,H.walk.z=0,H.surfaceQueued=!1,H.periscopeQueued=!1,H.burstQueued=!1,H.recentreQueued=!1,H.zoom=0,jn(0),ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0,qt.clear()}function fi(){const e=i=>!!i&&(i.isContentEditable||/^(input|textarea|select)$/i.test(i.tagName??"")),o=i=>{if(i.metaKey||i.ctrlKey||i.altKey||e(i.target))return;const l=i.key.toLowerCase();qt.add(l),l==="f"&&(H.surfaceQueued=!0),l==="p"&&(H.periscopeQueued=!0),l==="b"&&!i.repeat&&(H.burstQueued=!0),l==="r"&&!i.repeat&&(H.recentreQueued=!0),l==="v"&&!i.repeat&&zo("freeCam"),l==="x"&&!i.repeat&&Vs(),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(l)&&i.preventDefault()},n=i=>qt.delete(i.key.toLowerCase()),a=()=>Ys();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",a),qt.clear()}}function xi(){const e=at("w","arrowup")?1:0,o=at("s","arrowdown")?1:0,n=at("a","arrowleft")?1:0,a=at("d","arrowright")?1:0,i=at("q"," ")?1:0,l=at("e","c")?1:0,c=Vt(e-o+ee.throttle);c<-.05&&ht.level&&jn(0),H.throttle=ht.level>0?Math.max(c,1):c,H.rudder=Vt(n-a+ee.rudder),H.planes=Vt(i-l+ee.planes),H.boost=at("shift")||ee.boost||ht.level===2,H.zoom=(at("]","=","+")?1:0)-(at("[","-","_")?1:0),H.walk.x=Vt(a-n+ee.walk.x),H.walk.z=Vt(e-o+ee.walk.z)}const ln=[0,(be[0].y+be[1].y)/2,be[0].z],Xs=[ce.x,ce.y,ce.z],ko=$.dir,Ks=[$.x+ko[0]*300,-36,$.z+ko[1]*300],Zs=[$.x+ko[0]*46,34,$.z+ko[1]*46],Qs=[$.gate.x,4,$.gate.z],qs=[$.gate.x,22,$.gate.z],gi=1.55,cn=U/gi,wi=1+(cn-1)*.35,et=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:ln,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Ks,to:Zs,lookFrom:Qs,lookTo:qs,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Xs,lookTo:ln,swell:0}],yi=new Set([ln,Xs,Ks,Zs,Qs,qs]),lo=e=>yi.has(e)?e:[e[0]*cn,e[1]*wi,e[2]*cn];for(const e of et)e.from=lo(e.from),e.to=lo(e.to),e.lookFrom=lo(e.lookFrom),e.lookTo=lo(e.lookTo);const hn=et.reduce((e,o)=>e+o.dur,0),as=et,bi=e=>e*e*(3-2*e),vi=e=>1-Math.pow(1-e,2.2),co=e=>new j(e[0],e[1],e[2]),mt={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function Mi(e,o){g.useEffect(()=>{if(!e)return;const n=o.domElement,a=new Map;let i=0,l=null;const c=(u,m)=>{const r=y.orbit,s=r.dist*.0016,f=Math.cos(r.yaw),b=-Math.sin(r.yaw);r.target.x-=f*u*s,r.target.z-=b*u*s;const w=Math.cos(r.pitch),v=Math.sin(r.pitch);r.target.y+=m*s*w,r.target.x+=Math.sin(r.yaw)*m*s*v,r.target.z+=Math.cos(r.yaw)*m*s*v,Js()},h=u=>{a.set(u.pointerId,{x:u.clientX,y:u.clientY});try{n.setPointerCapture?.(u.pointerId)}catch{}if(a.size===2){const[m,r]=[...a.values()];i=Math.hypot(m.x-r.x,m.y-r.y),l={x:(m.x+r.x)/2,y:(m.y+r.y)/2}}},d=u=>{const m=a.get(u.pointerId);if(!m)return;const r=u.clientX-m.x,s=u.clientY-m.y;if(m.x=u.clientX,m.y=u.clientY,a.size>=2){const[f,b]=[...a.values()],w=Math.hypot(f.x-b.x,f.y-b.y),v={x:(f.x+b.x)/2,y:(f.y+b.y)/2};if(i>8&&w>8){const M=y.orbit;M.dist=S.clamp(M.dist*(i/w),...mt.dist)}l&&c(v.x-l.x,v.y-l.y),i=w,l=v,u.cancelable&&u.preventDefault();return}if(u.shiftKey||u.buttons===4)c(r,s);else{const f=y.orbit;f.yaw-=r*.005*sn(),f.pitch=S.clamp(f.pitch+s*.004*sn(),...mt.pitch)}u.cancelable&&u.preventDefault()},p=u=>{a.delete(u.pointerId)&&a.size<2&&(i=0,l=null)},x=u=>{u.preventDefault();const m=y.orbit;m.dist=S.clamp(m.dist*(1+Math.sign(u.deltaY)*.11),...mt.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",d,{passive:!1}),n.addEventListener("pointerup",p),n.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),n.addEventListener("wheel",x,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",d),n.removeEventListener("pointerup",p),n.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),n.removeEventListener("wheel",x),a.clear()}},[e,o])}function Js(){const e=y.orbit;e.target.x=S.clamp(e.target.x,-4200,mt.xz),e.target.z=S.clamp(e.target.z,-4200,mt.xz),e.target.y=S.clamp(e.target.y,...mt.y)}function ji({onRails:e,playing:o,speed:n=1,onShot:a,idle:i=!1}){const l=Me(x=>x.camera),c=Me(x=>x.gl),h=g.useRef(0),d=g.useRef(-1),p=g.useRef(new j(0,150,-260));return Mi(!e&&!i,c),g.useEffect(()=>{if(e)return;const x=y.orbit,u=l.position.clone().sub(x.target);x.dist=S.clamp(u.length(),...mt.dist),x.yaw=Math.atan2(u.x,u.z),x.pitch=Math.asin(S.clamp(u.y/(u.length()||1),-1,1))},[e,l]),J((x,u)=>{if(i)return;const m=Math.min(u,.05);if(y.t+=m,e){if(y.jumpTo!=null){let z=0;for(let k=0;k<y.jumpTo&&k<et.length;k++)z+=et[k].dur;h.current=z,y.jumpTo=null}o&&(h.current=(h.current+m*n)%hn);let w=0,v=0;for(;v<et.length&&!(h.current<w+et[v].dur);v++)w+=et[v].dur;const M=et[Math.min(v,et.length-1)],R=S.clamp((h.current-w)/M.dur,0,1);d.current!==v&&(d.current=v,y.shot=v,a?.(v,M));const E=co(M.from).lerp(co(M.to),vi(R)),F=co(M.lookFrom).lerp(co(M.lookTo),bi(R)),A=M.swell??0;if(A>0){const z=y.t;E.y+=Math.sin(z*.62)*3.1*A+Math.sin(z*1.31+1.2)*1.2*A,E.x+=Math.sin(z*.44+.6)*2.2*A}E.x+=Math.sin(y.t*.83)*.35,E.y+=Math.sin(y.t*1.17+2)*.28,l.position.copy(E),p.current.lerp(F,1-Math.pow(1e-4,m)),l.lookAt(p.current),A>0&&l.rotateZ(Math.sin(y.t*.51)*.024*A);const C=on(M.fov,l.aspect);Math.abs(l.fov-C)>.01&&(l.fov+=(C-l.fov)*(1-Math.pow(.02,m)),l.updateProjectionMatrix()),y.progress=h.current/hn}else{const w=y.orbit;H.recentreQueued&&(H.recentreQueued=!1,w.target.set(O.x,O.baseY*.55,O.z),w.dist=S.clamp(w.dist,260,1400));const v=H.walk.x,M=H.walk.z;if(v||M||H.planes||H.zoom){const F=w.dist*(H.boost?1.9:.7)*m,A=-Math.sin(w.yaw),C=-Math.cos(w.yaw);w.target.x+=(A*M-C*v)*F,w.target.z+=(C*M+A*v)*F,w.target.y+=H.planes*F,w.dist=S.clamp(w.dist*(1-H.zoom*.9*m),...mt.dist),Js()}const R=Math.cos(w.pitch);l.position.set(w.target.x+Math.sin(w.yaw)*R*w.dist,w.target.y+Math.sin(w.pitch)*w.dist,w.target.z+Math.cos(w.yaw)*R*w.dist),l.lookAt(w.target);const E=on(55,l.aspect);Math.abs(l.fov-E)>.01&&(l.fov+=(E-l.fov)*(1-Math.pow(.02,m)),l.updateProjectionMatrix()),y.t+=0}const r=eo(l.position.x,l.position.z);y.shelter+=(r-y.shelter)*(1-Math.pow(.06,m)),y.fog=S.lerp(ft.sea,ft.bay,y.shelter),y.rain=1-y.shelter*.92;const s=Ke(l.position.x,l.position.z,y.t,1),f=S.clamp((s.y-l.position.y-1)/3,0,1);y.underwater+=(f-y.underwater)*(1-Math.pow(.002,m)),y.depthBelow=Math.max(0,s.y-l.position.y);const b=S.lerp(8200,1700,y.underwater);Math.abs(l.far-b)>20&&(l.far=b,l.updateProjectionMatrix()),x.camera.updateMatrixWorld()}),null}const rs={low:[24,16],mid:[40,26],high:[56,36]};function Si({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=g.useMemo(()=>{const[m,r]=rs[e]??rs.high,s=new ma(1,m,r),f=s.attributes.position,b=new Float32Array(f.count*3),[w,v,M]=Re.centre,[R,E,F]=Re.radii,A=new fe("#241c22"),C=new fe(T.rockWarm),z=new fe;for(let k=0;k<f.count;k++){const N=f.getX(k),I=f.getY(k),V=f.getZ(k),Z=1+(Gt(N*2.4+5,V*2.4-9,3)-.5)*.14;f.setXYZ(k,w+N*R*Z,v+I*E*Z,M+V*F*Z);const oe=S.clamp((I+.2)/1.2,0,1);z.copy(A).lerp(C,(1-oe)*.55),b[k*3]=z.r,b[k*3+1]=z.g,b[k*3+2]=z.b}return s.setAttribute("color",new q(b,3)),s.computeVertexNormals(),s},[e]),{stairM:l,brazierM:c,bayM:h,tableM:d,jarM:p,westStairM:x}=g.useMemo(()=>{const m=new _e,r=new Qe,s=new j(1,1,1),f=new j,b=[];for(let G=0;G<Xe.steps;G++){const L=G/(Xe.steps-1);f.set(0,S.lerp(ve.y,se.y+2,L),S.lerp(Xe.zTop,Xe.zBottom,L)),r.identity(),b.push(m.clone().compose(f,r,s))}const w=[],v=e==="low"?5:9;for(const G of[-1,1])for(let L=0;L<v;L++){const Q=L/(v-1);f.set(G*176,se.y+9,S.lerp(se.zFront-40,se.zBack+40,Q)),r.identity(),w.push(m.clone().compose(f,r,s))}for(let G=0;G<6;G++)f.set(-110+G*44,se.y+9,_.z+_.halfZ+54),r.identity(),w.push(m.clone().compose(f,r,s));const M=[],R=e==="low"?5:9;for(const G of[-1,1])for(let L=0;L<de.tiers;L++)for(let Q=0;Q<R;Q++){const ae=Q/(R-1);f.set(G*(de.x-L*26),de.y+L*de.tierRise,S.lerp(-205,de.halfZ,ae)),r.identity(),M.push(m.clone().compose(f,r,s))}const E=[],F=[],A=new Qe,C=new j(0,1,0);let z=24301;const k=()=>(z=Math.imul(z,1664525)+1013904223>>>0,z/4294967296),N=e==="low"?1:2,I=e==="low"?5:8;for(const G of[-1,1])for(let L=0;L<N;L++)for(let Q=0;Q<I;Q++){const ae=G*(96+L*52+(k()-.5)*14),xe=S.lerp(se.zBack+120,se.zFront-60,Q/(I-1))+(k()-.5)*16;if(!(Math.abs(ae)<ge.halfX+24&&Math.abs(xe-ge.z)<ge.halfZ+20)&&!(Math.abs(Math.abs(ae)-he.x)<26&&xe<he.zFoot+16&&xe>he.zTop-8)){f.set(ae,se.y+2.4,xe),A.setFromAxisAngle(C,(k()-.5)*.5),E.push(m.clone().compose(f,A,s));for(let ne=0;ne<2;ne++)f.set(ae+(k()-.5)*30,se.y+3.5,xe+(k()>.5?8:-8)+(k()-.5)*6),A.setFromAxisAngle(C,k()*Math.PI),F.push(m.clone().compose(f,A,s))}}const V=[],Z=16,oe=G=>G*G*(3-2*G);for(let G=0;G<=Z;G++){const L=G/Z;f.set(-252,oe(L)*(de.y-.5)-1.3,S.lerp(45,-45,L)),r.identity(),V.push(m.clone().compose(f,r,s))}return{stairM:b,brazierM:w,bayM:M,tableM:E,jarM:F,westStairM:V}},[e]);J(()=>{const m=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(m*4.1)*.3+Math.sin(m*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(m*.9)*.12)});const u=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i,side:Yo,receiveShadow:u,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:Yo,roughness:.97,metalness:.02})}),[[0,(se.zFront+ge.z+ge.halfZ)/2,se.halfX*2,se.zFront-ge.z-ge.halfZ],[0,(se.zBack+ge.z-ge.halfZ)/2,se.halfX*2,ge.z-ge.halfZ-se.zBack],[-342/2-20,ge.z,se.halfX*2-ge.halfX*2,ge.halfZ*2],[(ge.halfX+se.halfX)/2+20,ge.z,se.halfX*2-ge.halfX*2,ge.halfZ*2]].map(([m,r,s,f],b)=>t.jsxs("mesh",{position:[m,se.y-3,r],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Math.abs(s),6,Math.abs(f)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),t.jsxs("mesh",{ref:a,position:[ge.x,Ce.ceiling+2,ge.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[ge.halfX*2,ge.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:Te})]}),t.jsxs("mesh",{position:[0,ve.y-4,ve.z],receiveShadow:u,castShadow:u,children:[t.jsx("boxGeometry",{args:[ve.halfX*2.6,8,ve.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,l.length],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Xe.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(zi,{matrices:l})]}),[-1,1].map(m=>Array.from({length:de.tiers},(r,s)=>t.jsxs("mesh",{position:[m*(de.x-s*26),de.y+s*de.tierRise-4,0],receiveShadow:u,castShadow:u,children:[t.jsx("boxGeometry",{args:[76-s*6,7,de.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:T.timber,roughness:.92})]},`${m}-${s}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:T.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Ri,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,d.length],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(ki,{matrices:d})]}),t.jsxs("instancedMesh",{args:[null,null,p.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Ti,{matrices:p})]}),t.jsxs("instancedMesh",{args:[null,null,x.length],castShadow:u,receiveShadow:u,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Ei,{matrices:x})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:u,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Ai,{matrices:c})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:T.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Fi,{matrices:c})]}),t.jsxs("mesh",{position:[0,Ce.y-4,0],receiveShadow:u,children:[t.jsx("boxGeometry",{args:[Ce.halfX*2,8,Ce.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(m=>[-1,0,1].map(r=>t.jsxs("mesh",{position:[m*120,(Ce.y+se.y)/2,r*96],castShadow:u,children:[t.jsx("boxGeometry",{args:[26,Math.abs(se.y-Ce.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${m}-${r}`)))]})}function zi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function ki({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Ti({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Ei({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Ri({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Ai({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o})}function Fi({matrices:e}){const o=g.useRef();return t.jsx(jt,{matrices:e,selfRef:o,offsetY:9})}function jt({matrices:e,offsetY:o=0}){const n=g.useRef(),a=g.useRef(!1);return J(()=>{if(a.current)return;const i=n.current?.parent;if(!i?.isInstancedMesh)return;const l=new _e,c=new _e().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,i.count);h++)l.copy(e[h]).multiply(c),i.setMatrixAt(h,l);i.instanceMatrix.needsUpdate=!0,i.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:n})}const is=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),i=a.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);i.addColorStop(0,"#fff3c4"),i.addColorStop(.32,"#ffc95e"),i.addColorStop(.66,"#e06120"),i.addColorStop(1,"#7e1c14"),a.fillStyle=i,a.fillRect(0,0,e,o),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let c=0;c<12;c++){const h=c/12*Math.PI*2;a.save(),a.translate(e/2,o*.62),a.rotate(h),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let c=8;c<e;c+=22)a.fillRect(c,0,3,o);a.globalAlpha=1;const l=new Nt(n);return l.colorSpace=Ht,l})();function Ci(e,o,n,a){const i=e+a,l=o+a,c=new Float32Array([-i,0,l,i,0,l,e*.18,n,o*.18,-i,0,l,e*.18,n,o*.18,-e*.18,n,o*.18,i,0,l,i,0,-l,e*.18,n,-o*.18,i,0,l,e*.18,n,-o*.18,e*.18,n,o*.18,i,0,-l,-i,0,-l,-e*.18,n,-o*.18,i,0,-l,-e*.18,n,-o*.18,e*.18,n,-o*.18,-i,0,-l,-i,0,l,-e*.18,n,o*.18,-i,0,-l,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new xt;return h.setAttribute("position",new q(c,3)),h.computeVertexNormals(),h}function Ii({quality:e="high",shadows:o=!0}){const n=g.useRef(),a=g.useRef(),i=He("keep-hf.opt.glb"),l=g.useMemo(()=>{const h=[];for(let d=0;d<_.storeys;d++){const p=1-(d+1)*_.taper,x=_.plinth+d*_.storey;h.push({i:d,y:x,halfX:_.halfX*p,halfZ:_.halfZ*p,roof:Ci(_.halfX*p,_.halfZ*p,d===_.storeys-1?30:16,11)})}return h},[]);J(()=>{const h=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const c=o;return t.jsxs("group",{position:[0,_.baseY,_.z],children:[t.jsxs("mesh",{position:[0,_.plinth/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[_.halfX*2.2,_.plinth,_.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),i&&t.jsx(ue,{name:"keep-hf.opt.glb",height:_.plinth+_.storeys*_.storey+26,position:[0,_.plinth*.5,0],tint:"#9a8468",emissive:T.emberDeep,emissiveIntensity:.14}),!i&&l.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,_.storey/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2,_.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,_.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,_.storey*.38]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,_.storey*.02,h.halfZ+8],castShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,_.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,_.storey,0],castShadow:c,receiveShadow:c,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,_.plinth+_.storeys*_.storey+30,0],rotation:[0,0,h*.4],castShadow:c,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,we.y,we.z-_.z],children:[t.jsxs("mesh",{castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[we.halfX*2,7,we.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[we.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:T.furnace,emissive:"#ffffff",emissiveMap:is,map:is,emissiveIntensity:2.2,toneMapped:!1,side:Te})]}),t.jsx(ue,{name:"oni-throne.opt.glb",height:34,position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],children:[t.jsxs("mesh",{position:[0,6,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:c,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:c,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(ue,{name:"kagura-stage.opt.glb",height:56,position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:T.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*we.halfX*.9,28,we.depth/2-4],castShadow:c,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[we.halfX*2.3,5,we.depth+22]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(ue,{name:"oni-daiko.opt.glb",height:26,position:[h*(we.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,13,0],rotation:[0,0,Math.PI/2],children:t.jsxs("mesh",{castShadow:c,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Li,{})]})]})}function Li(){const e=g.useRef(),o=g.useRef(!1);return J(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const a=new _e,i=new j,l=new Qe,c=new j(1,1,1);for(let h=0;h<n.count;h++){const d=h/(n.count-1)*2-1;i.set(d*(_.halfX+26),we.y+74-(1-d*d)*20,_.halfZ+22),n.setMatrixAt(h,a.compose(i,l,c))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Gi({shadows:e=!0}){const{slabs:o,flights:n,tower:a}=Fs,i=g.useMemo(()=>{const l=[],c=h=>h*h*(3-2*h);for(const h of n)for(let p=0;p<=9;p++){const x=p/9;l.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*c(x)-1.2,S.lerp(h.z0,h.z1,x)])}return l},[n]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(l=>[a.z[0]+1,a.z[1]-1].map(c=>t.jsxs("mesh",{position:[l,128,c],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${l}${c}`))),t.jsxs("instancedMesh",{args:[null,null,i.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Pi,{points:i})]}),o.map(([l,c,h,d,p],x)=>t.jsxs("mesh",{position:[l,c-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(d),3.2,Math.abs(p)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},x)),o.map(([l,c,h,d,p],x)=>t.jsxs("mesh",{position:[l,c+5,h+Math.abs(p)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(d),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})]},`r${x}`))]})}function Pi({points:e}){const o=g.useRef(),n=g.useRef(!1);return J(()=>{if(n.current)return;const a=o.current?.parent;if(!a?.isInstancedMesh)return;const i=new _e,l=new Qe,c=new j(1,1,1),h=new j;for(let d=0;d<Math.min(e.length,a.count);d++)h.set(e[d][0],e[d][1],e[d][2]),a.setMatrixAt(d,i.compose(h,l,c));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function Oi({shadows:e=!0}){const o=g.useMemo(()=>{const n=[],i=l=>l*l*(3-2*l);for(const l of[-1,1])for(let c=0;c<=20;c++){const h=c/20;n.push({x:l*he.x,y:i(h)*pt,z:S.lerp(he.zFoot,he.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,a)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[he.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.75})]},a)),[-1,1].map(n=>{const a=l=>l*l*(3-2*l),i=l=>{const c=[];for(let h=0;h<=16;h++){const d=h/16;c.push(new j(n*he.x+l,a(d)*pt+7,S.lerp(he.zFoot,he.zTop,d)))}return new Dt(new Ot(c),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:i(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:i(he.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})})]},n)})]})}function Di({shadows:e=!0}){const o=g.useMemo(()=>oo.map(([,,n,a])=>{const i=[];for(let l=0;l<=12;l++){const c=l/12*2-1;i.push(new j(c*n*.5,a*(1-c*c),0))}return new Dt(new Ot(i),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[oo.map(([n,a],i)=>t.jsxs("group",{position:[0,n,a],children:[t.jsx("mesh",{geometry:o[i],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:T.vermilion,roughness:.74})}),[-7,7].map(l=>t.jsx("mesh",{geometry:o[i],position:[0,7,l],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:T.vermilionDeep,roughness:.8})},l))]},i)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,oo[0][0]-12,oo[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,se.y,0]})]})}function ea(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function Ni({quality:e,shadows:o}){const n=g.useMemo(()=>{const i=ea(712273),l=[],c=e==="low"?14:e==="mid"?26:40;let h=0;for(;l.length<c&&h<c*40;){h++;const d=(i()*2-1)*(se.halfX-30),p=S.lerp(se.zBack+40,se.zFront-30,i());Math.abs(d)<62&&p>_.z+120||Math.abs(d)<70&&Math.abs(p-84)<58||Math.abs(Math.abs(d)-he.x)<24&&p<he.zFoot+18&&p>he.zTop-10||l.push({x:d,z:p,kind:l.length%4,rot:i()*Math.PI*2,k:.82+i()*.5})}return l},[e]),a=o;return t.jsx(t.Fragment,{children:n.map((i,l)=>{const c=[i.x,se.y,i.z];return i.kind===0?t.jsx(ue,{name:"sake-tower.opt.glb",height:22*i.k,position:c,rotation:i.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:c,children:[0,1,2].map(h=>t.jsxs("mesh",{position:[0,4+h*7,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[6-h,6-h,7,10]}),t.jsx("meshStandardMaterial",{color:h%2?"#c9a86a":"#8e6a3c",roughness:.92})]},h))})},l):i.kind===1?t.jsx(ue,{name:"oni-guardian.opt.glb",height:30*i.k,position:c,rotation:i.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,5,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[13,10,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,18,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[6,10,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*4,28,0],rotation:[0,0,h*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[2,8,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},h))]})},l):i.kind===2?t.jsx(ue,{name:"wisteria-trellis.opt.glb",height:34*i.k,position:c,rotation:i.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,16,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[24,2.4,2.4]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-9,-3,3,9].map(h=>t.jsxs("mesh",{position:[h,8,0],children:[t.jsx("coneGeometry",{args:[3.4,15,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},h))]})},l):t.jsxs("group",{position:c,rotation:[0,i.rot,0],children:[t.jsxs("mesh",{position:[0,17,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[.7,.7,34,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[4,22,0],children:[t.jsx("planeGeometry",{args:[8,24]}),t.jsx("meshStandardMaterial",{color:l%2?T.vermilion:"#e8dcc4",roughness:.95,side:Te,emissive:l%2?T.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},l)})})}function Hi({shadows:e}){const o=g.useMemo(()=>{const n=ea(10560325),a=[];for(let i=0;i<14;i++)a.push({x:(n()*2-1)*(Ce.halfX-40),z:(n()*2-1)*(Ce.halfZ-40),rot:n()*Math.PI*2,keg:i%2===0});return a},[]);return t.jsx(t.Fragment,{children:o.map((n,a)=>n.keg?t.jsx(ue,{name:"powder-keg.opt.glb",height:13,position:[n.x,Ce.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,Ce.y+6,n.z],castShadow:e,children:[t.jsx("sphereGeometry",{args:[6,10,8]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(ue,{name:"war-cannon.opt.glb",height:12,position:[n.x,Ce.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,Ce.y+5,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,18,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function _i(){const e=Me(o=>o.camera);return J((o,n)=>{const a=Math.min(n,.05),i=(e.position.x-pe.x-Re.centre[0])/Re.radii[0],l=(e.position.y-pe.y-Re.centre[1])/Re.radii[1],c=(e.position.z-pe.z-Re.centre[2])/Re.radii[2],h=Math.sqrt(i*i+l*l+c*c),d=S.clamp(1-(h-1)/.5,0,1);y.inside+=(d-y.inside)*(1-Math.pow(.02,a))}),null}function Bi({quality:e="high",shadows:o=!0}){return t.jsxs("group",{position:[pe.x,pe.y,pe.z],children:[t.jsx(_i,{}),t.jsx(Si,{quality:e,shadows:o}),t.jsx(Ii,{quality:e,shadows:o}),t.jsx(Di,{shadows:o}),t.jsx(Oi,{shadows:o}),t.jsx(Gi,{shadows:o}),t.jsx(Ni,{quality:e,shadows:o}),t.jsx(Hi,{shadows:o}),[-1,1].map(n=>t.jsx(ue,{name:"banquet-table.opt.glb",height:9,position:[n*92,se.y,_.z+210],rotation:n*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${n}`)),t.jsx(ue,{name:"treasure-kura.opt.glb",height:64,position:[de.x-74,se.y,_.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsxs("group",{position:[de.x-74,se.y,_.z+96],rotation:[0,-.7,0],children:[[-1,1].map(n=>[-1,1].map(a=>t.jsxs("mesh",{position:[n*12,5,a*9],castShadow:o,children:[t.jsx("boxGeometry",{args:[4,10,4]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${n}${a}`))),t.jsxs("mesh",{position:[0,22,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[34,24,26]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,38,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[26,12,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1]].map(([n,a,i],l)=>t.jsx(ue,{name:"bomb-sphere.opt.glb",height:22,position:[n,Ce.y,a],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[n,Ce.y+10,a],castShadow:o,children:[t.jsx("sphereGeometry",{args:[10,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${l}`)),[-1,1].map(n=>t.jsx(ue,{name:"keep-tier.opt.glb",height:96,position:[n*(de.x-40),de.y+de.tiers*de.tierRise-6,_.z+140],rotation:n*.6,tint:"#a08c74",fallback:null},`turret-${n}`)),[-1,1].map(n=>t.jsx(ue,{name:"arch-bridge.opt.glb",height:26,position:[n*74,se.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${n}`)),[-1,1].map(n=>t.jsx(ue,{name:"oni-guardian.opt.glb",height:54,position:[n*(ve.halfX+26),ve.y,ve.z-26],rotation:-n*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[n*(ve.halfX+26),ve.y,ve.z-26],children:[t.jsxs("mesh",{position:[0,9,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[22,18,22]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,32,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[10,18,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},n)),t.jsx("pointLight",{position:[0,we.y+30,we.z-_.z+_.z+40],color:T.ember,intensity:42e3,distance:900,decay:2}),t.jsx("pointLight",{position:[0,de.y+120,60],color:T.lantern,intensity:3e4,distance:820,decay:2}),t.jsx("pointLight",{position:[0,Ce.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,ve.y+46,ve.z-40],color:T.lantern,intensity:26e3,distance:620,decay:2})]})}const Ui=Math.PI/2-.14,ls=1.5;function ta({enabled:e,dom:o,zoomMin:n=.34,zoomMax:a=2.6,zoom0:i=1,pitch0:l=.16,pitchMin:c=-.62,pitchMax:h=Ui}){const d=g.useRef({yaw:0,pitch:l,zoom:i,smYaw:0,smPitch:l,smZoom:i,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:c,pitchMax:h,zoomMin:n,zoomMax:a,pitch0:l}).current;return g.useEffect(()=>{if(!e||!o)return;const p=o,x=new Map;let u=0,m=0,r=null;const s=()=>x.size,f=M=>{x.set(M.pointerId,{x:M.clientX,y:M.clientY});try{p.setPointerCapture?.(M.pointerId)}catch{}if(s()===1)d.dragging=!0,r={x:M.clientX,y:M.clientY,t:M.timeStamp};else if(s()===2){d.dragging=!1;const[R,E]=[...x.values()];u=Math.hypot(R.x-E.x,R.y-E.y),r=null}},b=M=>{const R=x.get(M.pointerId);if(!R)return;const E=M.clientX-R.x,F=M.clientY-R.y;if(R.x=M.clientX,R.y=M.clientY,s()>=2){const[C,z]=[...x.values()],k=Math.hypot(C.x-z.x,C.y-z.y);u>8&&k>8&&(d.zoom=S.clamp(d.zoom*(u/k),d.zoomMin,d.zoomMax),d.since=0),u=k;return}if(!d.dragging)return;r&&Math.hypot(M.clientX-r.x,M.clientY-r.y)>14&&(r=null);const A=sn()*ye.lookSens;d.yaw-=E*.005*A,d.pitch=S.clamp(d.pitch+F*.004*A*(ye.invertY?-1:1),d.pitchMin,d.pitchMax),d.since=0,M.cancelable&&M.preventDefault()},w=M=>{x.has(M.pointerId)&&(x.delete(M.pointerId),s()<2&&(u=0),s()===0&&(d.dragging=!1,r&&M.timeStamp-r.t<260&&(M.timeStamp-m<340?(d.recentre=!0,m=0):m=M.timeStamp),r=null))},v=M=>{M.preventDefault(),d.zoom=S.clamp(d.zoom*(1+Math.sign(M.deltaY)*.1),d.zoomMin,d.zoomMax),d.since=0};return p.addEventListener("pointerdown",f),p.addEventListener("pointermove",b,{passive:!1}),p.addEventListener("pointerup",w),p.addEventListener("pointercancel",w),window.addEventListener("pointerup",w),p.addEventListener("wheel",v,{passive:!1}),()=>{p.removeEventListener("pointerdown",f),p.removeEventListener("pointermove",b),p.removeEventListener("pointerup",w),p.removeEventListener("pointercancel",w),window.removeEventListener("pointerup",w),p.removeEventListener("wheel",v),x.clear(),d.dragging=!1}},[e,o,d]),d}function dn(e,o,n=0){if(e.since+=o,H.zoom&&(e.zoom=S.clamp(e.zoom*(1-H.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,H.recentreQueued&&(H.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=ls+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!ye.freeCam&&!e.noRecentre&&!e.dragging&&e.since>ls){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(ze(.22,.48),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const a=e.dragging?6e-4:ze(.002,.02),i=1-Math.pow(a,o);let l=e.yaw-e.smYaw;for(;l>Math.PI;)l-=Math.PI*2;for(;l<-Math.PI;)l+=Math.PI*2;e.smYaw+=l*i,e.smPitch+=(e.pitch-e.smPitch)*i,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const _o=64,Wi=19,cs=16,$i=.92,hs=.52,Vi=.3,Yi=.04,Xi=.0016,Ki=.055,Zi=1.9,Qi=16,qi=62,Ji=9,ds={x:-.45,z:-2.4},us=.075,el=new j,tl=new j;function Rt(e,o){return S.clamp(-re(e,o)/26,0,1)}const ho={x:60*U,z:1050*U},ps=7,ol=15,bt=1.85;function nl({mode:e,onMode:o}){const n=Me(b=>b.camera),a=Me(b=>b.gl),i=g.useRef(),l=g.useRef(),c=g.useRef(),h=g.useRef(),d=He("ship-sunny.opt.glb"),p=He("ship-lion.opt.glb"),x=d||p,u=d?"ship-sunny.opt.glb":p?"ship-lion.opt.glb":null,m=u?Eo(u,34):30,r=He("crew-straw.opt.glb"),s=g.useRef({x:ho.x,z:ho.z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,stride:0,area:"hall",boarded:!1}).current,f=ta({enabled:e==="helm"||e==="foot",dom:a.domElement,zoomMin:.34,zoomMax:3.4,pitch0:.16,pitchMin:-.62,pitchMax:1.44});return g.useEffect(()=>{if(e==="helm")return s.x=ho.x,s.z=ho.z,s.heading=Math.PI,s.speed=0,s.vx=0,s.vz=0,s.throttle=0,s.flank=0,s.deckY=0,f.yaw=0,f.smYaw=0,f.pitch=.16,f.smPitch=.16,f.pitch0=.16,f.zoom=1,f.smZoom=1,f.noRecentre=!1,f.pitchMin=-.62,f.pitchMax=1.44,s.swallowed=0,s.burst=1,s.burstFx=0,s.slam=0,s.drift=0,s.trim=0,s.bowY=Ke(s.x,s.z,y.t,1).y,y.helm=null,tn("helm"),()=>{y.helmActive=!1}},[e,s,f]),g.useEffect(()=>{if(e!=="foot")return;s.fvx=0,s.fvz=0,B.chain!=="foot"&&tn("foot");const b=(v,M)=>{f.yaw=v,f.smYaw=v,f.pitch=M,f.smPitch=M,f.pitch0=0,f.noRecentre=!0,f.pitchMin=-1.28,f.pitchMax=1.28},w=y.footSpawn;if(y.footSpawn="hall",w==="port"){s.area="island",s.fx=K.x+40*U,s.fz=K.z+40*U,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.atan2(-(ce.x-s.fx),-(ce.z-s.fz)),b(s.fyaw,-.06);return}if(w==="rear"){s.area="island",s.fx=$.gate.x+$.dir[0]*26,s.fz=$.gate.z+$.dir[1]*26,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.atan2($.dir[0],$.dir[1]),b(s.fyaw,.02);return}s.area="hall",s.fx=pe.x,s.fy=pe.y+ve.y,s.fz=pe.z+Xe.zTop,s.fyaw=0,s.fpitch=-.05,b(0,.05)},[e,s,f]),J((b,w)=>{if(e!=="helm"&&e!=="foot")return;const v=Math.min(w,.05);if(y.t+=v,e==="helm"){const M=s.heading;s.throttle+=(H.throttle-s.throttle)*(1-Math.pow(.02,v)),s.rudder+=(H.rudder-s.rudder)*(1-Math.pow(.005,v)),s.flank+=((H.boost?1:0)-s.flank)*(1-Math.pow(Yi,v));const R=_o*(1+Vi*s.flank),E=Math.sin(s.heading),F=Math.cos(s.heading),A=Math.cos(s.heading),C=-Math.sin(s.heading);let z=s.vx*E+s.vz*F,k=s.vx*A+s.vz*C;const N=1-y.shelter,I=s.throttle>=0?s.throttle*R:s.throttle*Wi;z+=S.clamp(I-z,-cs*2.5,cs)*v,s.burst=Math.min(1,s.burst+v/Ji),H.burstQueued&&(H.burstQueued=!1,s.burst>=.999&&(s.burst=0,s.burstFx=1,z+=qi,y.splash+=1)),s.burstFx*=Math.pow(.2,v);const V=Ke(s.x,s.z,y.t,1);z-=(V.dx*E+V.dz*F)*Qi*N*v,z-=z*Math.abs(z)*Xi*v,k-=(k*Math.abs(k)*Ki+k*Zi)*v;const Z=S.clamp(Math.abs(z)/16,0,1);z*=Math.pow(1-.11*Math.abs(s.rudder)*Z,v),s.vx=E*z+A*k,s.vz=F*z+C*k,s.speed=z,s.drift+=(S.clamp(Math.abs(k)/11,0,1)-s.drift)*(1-Math.pow(.1,v)),s.heading+=s.rudder*$i*Z*Math.sign(z||1)*v;const oe=s.x+s.vx*v,G=s.z+s.vz*v,L=m*hs,Q=oe+E*L,ae=G+F*L;if(Rt(Q,ae)>.06)s.x=oe,s.z=G,s.aground+=(0-s.aground)*(1-Math.pow(.05,v));else{s.aground+=(1-s.aground)*(1-Math.pow(.02,v)),It(Math.abs(s.speed)*.0012*v*60,"AGROUND — SHE IS TAKING WATER");const Se=Math.pow(.06,v);s.speed*=Se,s.vx*=Se,s.vz*=Se;const qe=6,Tn=Rt(s.x+qe,s.z)-Rt(s.x-qe,s.z),En=Rt(s.x,s.z+qe)-Rt(s.x,s.z-qe),Rn=Math.hypot(Tn,En)||1;s.x+=Tn/Rn*26*v,s.z+=En/Rn*26*v}const ne=Ts(s.x,s.z,0);s.x+=ne.vx*v,s.z+=ne.vz*v,s.x+=ds.x*N*v,s.z+=ds.z*N*v;const We=V.dx*A+V.dz*C;s.heading+=S.clamp(We*.4,-us,us)*N*v;let Ie=Ae[0],Y=1/0;for(const Se of Ae){const qe=(s.x-Se.x)**2+(s.z-Se.z)**2;qe<Y&&(Y=qe,Ie=Se)}if(Ns(v,{danger:ne.danger,headingX:Math.sin(s.heading),headingZ:Math.cos(s.heading),toCentreX:Ie.x-s.x,toCentreZ:Ie.z-s.z,speed:s.speed,throttle:s.throttle})>=1||ne.danger>.94){const Se=Ie;s.x=Se.x+(Se.x>0?Se.r*1.85:-Se.r*1.85),s.z=Se.z+Se.r*1.5,s.speed=0,s.vx=0,s.vz=0,s.throttle=0,s.heading=Math.PI,s.swallowed+=1,s.aground=1,B.grip=0,It(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const Be=eo(s.x,s.z),Le=S.lerp(1,.055,Be)*S.smoothstep(Rt(s.x,s.z),0,.3),Ge=Ke(s.x,s.z,y.t,Le);y.helmActive=!0,y.helmPos.set(s.x,Ge.y+m*.35,s.z),y.helmSpeed=S.clamp(Math.abs(s.speed)/_o,0,1);const dt=ne.vx*Math.cos(s.heading)-ne.vz*Math.sin(s.heading),P=S.clamp(Math.abs(s.speed)/_o,0,1),le=S.clamp(s.rudder*Z*P*.4+dt*.016,-.5,.5);s.heel+=(le-k*.012-s.heel)*(1-Math.pow(.15,v));const ke=m*hs,De=Ke(s.x+E*ke,s.z+F*ke,y.t,Le).y,nt=S.clamp((s.bowY-De)/Math.max(v,.001),0,60);s.bowY=De;const Pe=S.clamp((nt-10)/24,0,1)*P*N;if(s.slam=Math.max(s.slam*Math.pow(.05,v),Pe),Pe>.25){const Se=Math.pow(1-.3*Pe,v);s.vx*=Se,s.vz*=Se}const st=P*.1*Math.sign(s.speed>=0?1:-1)+s.slam*.14+s.burstFx*.16;s.trim+=(st-s.trim)*(1-Math.pow(.1,v));const gt=S.clamp(P*N*1.15+s.aground*.5+ne.danger*.8+s.slam*1.3+s.burstFx,0,1);s.spray+=(gt-s.spray)*(1-Math.pow(.08,v));const ut=i.current;ut&&(ut.position.set(s.x,Ge.y,s.z),ut.rotation.set(S.clamp(Ge.dz*1.2,-.3,.3)-s.trim,s.heading,S.clamp(-Ge.dx,-.26,.26)+s.heel)),l.current&&(l.current.scale.z=1+Math.sin(y.t*1.6)*.08+s.burstFx*.4,l.current.scale.x=1+N*.06+s.burstFx*.12),c.current&&(c.current.material.opacity=s.spray*.42,c.current.scale.setScalar(.7+s.spray*.55)),h.current&&(h.current.material.opacity=S.clamp(.34*P+s.burstFx*.3,0,.62)*(.28+N*.72),h.current.scale.set(1+P*.75+s.drift*.6,1,1+P*.5)),dn(f,v,s.heading-M);const wt=s.heading+Math.PI+f.smYaw,Ee=Math.cos(f.smPitch),St=Math.max(m*3,76)*f.smZoom*(1+P*ze(.26,.1)+s.burstFx*ze(.34,.12))*Bs(n.aspect);s.deckY+=(Ge.y-s.deckY)*(1-Math.pow(ze(2e-4,.05),v));const Ao=S.lerp(Ge.y,s.deckY,ye.comfort),$e=el.set(s.x+Math.sin(wt)*Ee*St,Ao+m*.5+Math.sin(f.smPitch)*St,s.z+Math.cos(wt)*Ee*St),Ve=Ke($e.x,$e.z,y.t,Le);$e.y=Math.max($e.y,Ve.y+6),n.position.lerp($e,1-Math.pow(ze(6e-4,.02),v));const Ne=Math.max(0,Math.cos(f.smYaw)),Bt=P*ze(66,34)*Ne;n.lookAt(tl.set(s.x+(E+A*S.clamp(k/40,-.4,.4))*Bt,Ao+12-s.trim*26*P*ze(1,.35),s.z+(F+C*S.clamp(k/40,-.4,.4))*Bt));const Ut=ze(1,0);Ut>.001&&n.rotateZ((Math.sin(y.t*2.3)*.012*P+s.heel*.3+s.aground*Math.sin(y.t*21)*.02+s.slam*Math.sin(y.t*34)*.03+ne.danger*Math.sin(y.t*2.7)*.03)*Ut),nn(n,60+P*ze(7,2)+s.burstFx*ze(10,3),v,.06,_s);const kn=Math.hypot(s.x-(K.x+60*U),s.z-(K.z+60*U));kn<90*U&&Math.abs(s.speed)<24&&(y.footSpawn="port",o?.("foot")),y.helm={speed:s.speed,heading:s.heading,throttle:s.throttle,aground:s.aground,x:s.x,z:s.z,toGate:Math.min(Math.hypot(s.x,s.z-Mt),Math.hypot(s.x,s.z-Jt)),underFire:[Mt,Jt].some(Se=>{const qe=Math.hypot(s.x,s.z-Se);return qe>yo.safe&&qe<yo.range}),moored:kn<180*U,maelstrom:ne.danger,swallowed:s.swallowed,burst:s.burst,drift:s.drift,maxSpeed:R,cruise:ht.level,flank:s.flank,freeCam:ye.freeCam},Ds(v,y.helm),y.shelter+=(Be-y.shelter)*(1-Math.pow(.06,v)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,v))}else{dn(f,v,0);const M=H.boost?ol:ps;s.fyaw+=(f.smYaw-s.fyaw)*(1-Math.pow(1e-4,v)),s.fpitch+=(-f.smPitch-s.fpitch)*(1-Math.pow(1e-4,v));const R=H.walk.x,E=H.walk.z,F=Math.hypot(R,E),A=F>1?F:1,C=-Math.sin(f.smYaw),z=-Math.cos(f.smYaw),k=-z,N=C,I=(C*(E/A)+k*(R/A))*M,V=(z*(E/A)+N*(R/A))*M,Z=1-Math.pow(F>.02?2e-5:4e-7,v);s.fvx+=(I-s.fvx)*Z,s.fvz+=(V-s.fvz)*Z;const oe=s.fvx*v,G=s.fvz*v;if(s.area==="island"){const ae=s.fx+oe,xe=s.fz+G,ne=re(s.fx,s.fz),We=re(ae,xe),Ie=Math.hypot(oe,G)||1e-6,Y=(We-ne)/Ie;(We<=.3||Y>=1.2&&We>=ne)&&(s.fvx=0,s.fvz=0),We>.3&&(Y<1.2||We<ne)&&(s.fx=ae,s.fz=xe);const je=re(s.fx,s.fz);s.fy+=(je+bt-s.fy)*(1-Math.pow(.002,v));const Be=Math.hypot(s.fx-ce.x,s.fz-ce.z),Le=Math.hypot(s.fx-$.gate.x,s.fz-$.gate.z);Be<80?(s.area="hall",s.fx=pe.x,s.fz=pe.z+Xe.zTop,s.fy=pe.y+ve.y+bt,s.fyaw=0,f.yaw=f.smYaw=0,f.pitch=f.smPitch=.05):Le<40&&(s.area="hall",s.fx=pe.x+60,s.fz=pe.z+_.z+150,s.fy=pe.y+bt,s.fyaw=Math.PI,f.yaw=f.smYaw=Math.PI,f.pitch=f.smPitch=.04),y.helm={onFoot:!0,area:"island",x:s.fx,z:s.fz,fy:s.fy-pe.y,toMouth:Be,toRear:Le,nearPort:Math.hypot(s.fx-K.x,s.fz-K.z)<K.r*1.4};const Ge=eo(s.fx,s.fz);y.shelter+=(Ge-y.shelter)*(1-Math.pow(.06,v))}else{s.fx+=oe,s.fz+=G;const ae=s.fx-pe.x,xe=s.fz-pe.z;let ne=xe>ve.z-70?ve.y:xe>Xe.zBottom?S.lerp(0,ve.y,(xe-Xe.zBottom)/(Xe.zTop-Xe.zBottom)):0;ne=Math.max(ne,Xa(ae,xe)),s.fy+=(pe.y+ne+bt-s.fy)*(1-Math.pow(.005,v)),xe>ve.z+34&&(s.area="island",s.fx=ce.x,s.fz=ce.z+130,s.fy=re(s.fx,s.fz)+bt,s.fyaw=Math.PI,f.yaw=f.smYaw=Math.PI,f.pitch=f.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:s.fx,z:s.fz,lz:xe,fy:s.fy-pe.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,v))}const L=Math.hypot(s.fvx,s.fvz);s.stride+=L*v;const Q=Math.min(1,L/ps)*ze(1,.3);n.position.set(s.fx,s.fy+Math.sin(s.stride*1.6)*.06*Q,s.fz),n.rotation.set(0,0,0),n.rotateY(s.fyaw),n.rotateX(s.fpitch),n.rotateZ(Math.sin(s.stride*.8)*.012*Q*ze(1,0)),nn(n,72,v,.02),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,v))}y.fog=S.lerp(ft.sea,ft.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs("group",{ref:i,position:[0,-4e3,0],visible:e==="helm",children:[x&&t.jsx(ue,{name:u,loa:m,slim:Ro(u),sink:.062,rotation:To(u),tint:d?"#9a9188":"#c98a52",emissive:"#3a2a18",emissiveIntensity:.18}),x&&r&&t.jsx(ue,{name:"crew-straw.opt.glb",height:m*.09,rotation:0,position:[0,m*.1,m*.12]}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!x,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!x,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!x,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!x,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:l,position:[0,17.5,1.5],visible:!x,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:Te,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!x,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),[-1,1].map(b=>t.jsxs("mesh",{position:[b*3.6,10,-8],children:[t.jsx("sphereGeometry",{args:[1.7,8,6]}),t.jsx("meshStandardMaterial",{color:T.lantern,emissive:T.lantern,emissiveIntensity:3.4,toneMapped:!1})]},b)),t.jsx(to,{crew:"straw",width:x?m*.24:14,position:[0,x?m*.78:26,-m*.06]}),t.jsxs("mesh",{ref:h,position:[0,.6,-m*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[m*.6,m*2.2]}),t.jsx("meshBasicMaterial",{map:Qo,color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:c,position:[0,m*.12,m*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[m*.85,m*.6]}),t.jsx("meshBasicMaterial",{map:yr,color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:ot})]})]})}const ms=76,sl=24,fs=26,al=1.15,rl=.44,il=.05,ll=.22,cl=70,uo=340,xs=7,hl=6,gs=60,po=185,dl=new j,ws=new j,mo={x:430*U,z:1e3*U};function ul({mode:e,onMode:o}){const n=Me(f=>f.camera),a=Me(f=>f.gl),i=g.useRef(),l=g.useRef(),c=g.useRef(),h=He("ship-tang.opt.glb"),d=He("ship-sub.opt.glb"),p=h||d,x=He("crew-heart.opt.glb"),u=h?"ship-tang.opt.glb":"ship-sub.opt.glb",m=Eo(u,28),r=g.useRef({x:mo.x,z:mo.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:4,orderedDepth:4,pitch:0,heel:0,scrape:0,stress:0,berthing:0}).current,s=ta({enabled:e==="sub",dom:a.domElement,zoomMin:.42,zoomMax:2.3,pitch0:.22,pitchMin:-1,pitchMax:1.42});return g.useEffect(()=>{if(e==="sub")return r.x=mo.x,r.z=mo.z,r.heading=Math.PI,r.speed=0,r.throttle=0,r.flank=0,r.depth=4,r.orderedDepth=4,r.berthing=0,s.yaw=0,s.smYaw=0,s.pitch=.22,s.smPitch=.22,s.pitch0=.22,s.zoom=1,s.smZoom=1,s.noRecentre=!1,r.heel=0,y.subActive=!0,y.helm=null,tn("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,r,s]),J((f,b)=>{if(e!=="sub"){i.current&&i.current.position.set(0,-4e3,0);return}const w=Math.min(b,.05);y.t+=w;const v=r.heading,M=H.boost;r.throttle+=(H.throttle-r.throttle)*(1-Math.pow(.02,w)),r.flank+=((M?1:0)-r.flank)*(1-Math.pow(il,w)),y.subThrottle=Math.abs(r.throttle),r.rudder+=(H.rudder-r.rudder)*(1-Math.pow(8e-4,w));const R=S.clamp(r.depth/15,0,1),E=ms*(.7+.3*R)*(1+rl*r.flank),F=r.throttle>=0?r.throttle*E:r.throttle*sl;r.speed+=S.clamp(F-r.speed,-fs*2,fs)*w,r.speed-=r.speed*Math.abs(r.speed)*.0016*w;const A=S.lerp(ll,1,S.clamp(Math.abs(r.speed)/7,0,1));r.heading+=r.rudder*al*A*Math.sign(r.speed>=0?1:-1)*w,r.orderedDepth-=H.planes*cl*w,r.orderedDepth=S.clamp(r.orderedDepth,0,uo),H.surfaceQueued&&(H.surfaceQueued=!1,r.orderedDepth=0),H.periscopeQueued&&(H.periscopeQueued=!1,r.orderedDepth=hl);const C=r.x+Math.sin(r.heading)*r.speed*w,z=r.z+Math.cos(r.heading)*r.speed*w,k=Ts(C,z,r.depth);r.x=C+k.vx*w,r.z=z+k.vz*w;const N=k.vx*Math.cos(r.heading)-k.vz*Math.sin(r.heading);r.heading+=N*.008*w;const I=S.clamp(Math.abs(r.speed)/ms,0,1),V=S.clamp(N*.02+r.rudder*A*I*.34,-.6,.6);r.heel+=(V-r.heel)*(1-Math.pow(.12,w)),k.danger>.05&&(r.speed*=Math.pow(1-.22*k.danger,w));const Z=re(r.x,r.z),oe=Math.max(2,-Z-xs),G=r.depth<1.5;r.depth+=(r.orderedDepth-r.depth)*(1-Math.pow(.12,w)),r.depth>oe?(r.scrape+=(1-r.scrape)*(1-Math.pow(.02,w)),r.depth=oe,r.orderedDepth=Math.min(r.orderedDepth,oe-2),It(Math.abs(r.speed)*.0016*w*60,"GROUNDED ON THE SHELF"),r.speed*=Math.pow(.3,w)):r.scrape+=(0-r.scrape)*(1-Math.pow(.05,w));const L=(r.depth-po)/(uo-po);r.stress=L>0?Math.min(1,L*L):0,r.stress>0&&It(r.stress*.06*w,"HULL UNDER PRESSURE — COME UP");const Q=r.x+Math.sin(r.heading)*26,ae=r.z+Math.cos(r.heading)*26;if(re(Q,ae)>-r.depth+xs*.5){r.speed*=Math.pow(.1,w);const Ve=6,Ne=re(r.x+Ve,r.z)-re(r.x-Ve,r.z),Bt=re(r.x,r.z+Ve)-re(r.x,r.z-Ve),Ut=Math.hypot(Ne,Bt)||1;r.x-=Ne/Ut*20*w,r.z-=Bt/Ut*20*w,r.scrape=Math.max(r.scrape,.5)}const ne=Math.hypot(r.x-$.x,r.z-$.z);if(ne<$.pool*1.1&&r.berthing===0&&(r.berthing=1e-4),r.berthing>0){r.berthing=Math.min(1,r.berthing+w*.5),r.x+=($.berth.x-r.x)*(1-Math.pow(.1,w)),r.z+=($.berth.z-r.z)*(1-Math.pow(.1,w)),r.orderedDepth=0,r.speed*=Math.pow(.1,w);let Ne=Math.atan2($.dir[0],$.dir[1])+Math.PI-r.heading;for(;Ne>Math.PI;)Ne-=Math.PI*2;for(;Ne<-Math.PI;)Ne+=Math.PI*2;r.heading+=Ne*(1-Math.pow(.2,w)),r.berthing>=1&&r.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}r.depth<1.5!==G&&(y.splash+=1);const Ie=Ke(r.x,r.z,y.t,1),Y=1-S.clamp(r.depth/10,0,1),je=-r.depth+Ie.y*Y,Be=S.clamp((r.orderedDepth-r.depth)*.05,-.34,.34)*Math.sign(r.speed>=0?1:-1)+Ie.dz*.8*Y;r.pitch+=(Be-r.pitch)*(1-Math.pow(.05,w));const Le=i.current;Le&&(Le.position.set(r.x,je,r.z),Le.rotation.set(r.pitch+r.scrape*Math.sin(y.t*23)*.02,r.heading,-Ie.dx*.5*Y+r.heel)),l.current&&(l.current.rotation.z+=r.throttle*9*w),c.current&&(c.current.visible=r.depth<2.5),y.subPos.set(r.x,je,r.z),dn(s,w,r.heading-v);const Ge=r.heading+Math.PI+s.smYaw,dt=Math.cos(s.smPitch),P=S.clamp(r.depth/240,0,1),le=Math.max(m*4.5,88)*s.smZoom*(1-P*.2)*Bs(n.aspect),ke=dl.set(r.x+Math.sin(Ge)*dt*le,je+10+Math.sin(s.smPitch)*le,r.z+Math.cos(Ge)*dt*le),De=re(ke.x,ke.z);ke.y=Math.max(ke.y,De+5),r.depth>10&&(ke.y=Math.min(ke.y,Ie.y-3)),n.position.lerp(ke,1-Math.pow(ze(8e-4,.02),w));const nt=Math.max(0,Math.cos(s.smYaw)),Pe=I*ze(46,26)*nt;ws.set(r.x+Math.sin(r.heading)*Pe,je+6-r.pitch*30*I*ze(1,.35),r.z+Math.cos(r.heading)*Pe),n.lookAt(ws);const st=ze(1,0);st>.001&&n.rotateZ((r.scrape*Math.sin(y.t*19)*.015+r.heel*.35+k.danger*Math.sin(y.t*3.1)*.02)*st),nn(n,64+I*ze(6,2)+r.flank*ze(2,.6),w,.06,_s);const gt=Ke(n.position.x,n.position.z,y.t,1),ut=S.clamp((gt.y-n.position.y-1)/3,0,1);y.underwater+=(ut-y.underwater)*(1-Math.pow(.002,w)),y.depthBelow=Math.max(0,gt.y-n.position.y);const wt=S.lerp(8200,1700,y.underwater);Math.abs(n.far-wt)>20&&(n.far=wt,n.updateProjectionMatrix()),y.shelter+=((ne<$.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,w));let Ee=Ae[0],St=1/0;for(const Ve of Ae){const Ne=(r.x-Ve.x)**2+(r.z-Ve.z)**2;Ne<St&&(St=Ne,Ee=Ve)}Ns(w,{danger:k.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:Ee.x-r.x,toCentreZ:Ee.z-r.z,speed:r.speed,throttle:r.throttle})>=1&&(It(.22,"CAUGHT IN THE VORTEX"),r.x=Ee.x+(r.x>Ee.x?1:-1)*Ee.r*1.9,r.z=Ee.z+Ee.r*1.5,r.speed=0,r.orderedDepth=Math.min(uo,r.depth+18),B.grip=0,y.splash+=1);let $e=Math.atan2($.x-r.x,$.z-r.z)-r.heading;for(;$e>Math.PI;)$e-=Math.PI*2;for(;$e<-Math.PI;)$e+=Math.PI*2;y.helm={sub:!0,speed:r.speed,maxSpeed:E,heading:r.heading,depth:r.depth,orderedDepth:r.orderedDepth,scrape:r.scrape,stress:r.stress,maelstrom:k.danger,toRear:ne,relRear:$e,berthing:r.berthing>0,x:r.x,z:r.z,maxDepth:uo,crushDepth:po,cruise:ht.level,flank:r.flank,freeCam:ye.freeCam,dark:S.clamp((r.depth-gs)/(po-gs),0,1)},Ds(w,y.helm)}),t.jsxs("group",{ref:i,position:[0,-4e3,0],children:[p&&t.jsx(ue,{name:u,loa:m,slim:Ro(u),sink:.14,rotation:To(u),tint:h?"#a89a80":"#c9b445",emissive:"#2a2410",emissiveIntensity:.22}),t.jsxs("group",{ref:c,position:[0,m*.15,-m*.07],children:[x&&t.jsx(ue,{name:"crew-heart.opt.glb",height:m*.1,rotation:0}),t.jsx(to,{crew:"heart",width:m*.26,position:[0,m*.2,-m*.2]})]}),t.jsxs("group",{visible:!p,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(f=>[0,1,2,3].map(b=>t.jsxs("mesh",{position:[f*5.1,1.2,8-b*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${f}-${b}`)))]}),t.jsxs("mesh",{position:[0,m*.02,m*.5],children:[t.jsx("sphereGeometry",{args:[1.7,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[0,m*.02,m*.6],scale:[m*.9,m*.9,1],children:t.jsx("spriteMaterial",{map:pl,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:ot})}),t.jsxs("mesh",{position:[0,m*.24,-m*.42],children:[t.jsx("sphereGeometry",{args:[.9,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),t.jsxs("mesh",{ref:l,position:[0,m*.012,-m*.52],children:[t.jsx("torusGeometry",{args:[1.6,.5,6,10]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.4})]}),t.jsx(xl,{})]})}const pl=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e);const i=new Nt(o);return i.colorSpace=Ht,i})(),ml=`
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
`,fl=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function xl(){const e=g.useRef(),o=g.useMemo(()=>{const i=new Float32Array(780),l=new Float32Array(260),c=new Float32Array(260),h=new Float32Array(260);for(let p=0;p<260;p++)i[p*3]=(Math.random()-.5)*3.4,i[p*3+1]=(Math.random()-.5)*2.6,i[p*3+2]=-14-Math.random()*4,l[p]=Math.random(),c[p]=.25+Math.random()*.3,h[p]=2+Math.random()*4;const d=new xt;return d.setAttribute("position",new q(i,3)),d.setAttribute("aPhase",new q(l,1)),d.setAttribute("aRate",new q(c,1)),d.setAttribute("aSize",new q(h,1)),d.boundingSphere=new _t(new j(0,0,-30),70),d},[]),n=g.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new j(...te(X.underGlow))}}),[]);return J((a,i)=>{const l=e.current?.uniforms;if(!l)return;l.uTime.value+=i;const c=y.subActive?y.subThrottle*y.underwater:0;l.uGain.value+=(c-l.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:ml,fragmentShader:fl,uniforms:n,transparent:!0,depthWrite:!1,blending:ot,fog:!1})})}const oa=.42;let D=null,lt=null,me=null,un=!1,tt=!0;function gl(){try{const e=localStorage.getItem("oni.audio");e!==null&&(tt=e==="1")}catch{}return tt}function Bo(e){tt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return lt&&D&&lt.gain.setTargetAtTime(e?oa:0,D.currentTime,.12),e&&D?.state==="suspended"&&D.resume(),tt}function wl(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),a=n.getChannelData(0);for(let i=0;i<o;i++)a[i]=Math.random()*2-1;return n}function Yt(e,o,n,a,i,l,c){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const d=e.createBiquadFilter();d.type=n,d.frequency.value=a,d.Q.value=i;const p=e.createGain();return p.gain.value=l,h.connect(d).connect(p).connect(c),h.start(),{src:h,filt:d,gain:p}}function Uo(){if(un){D?.state==="suspended"&&D.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;D=new e,un=!0,lt=D.createGain(),lt.gain.value=tt?oa:0;const o=D.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=D.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,lt.connect(n).connect(o).connect(D.destination);const a=wl(D),i=D.createGain();i.gain.value=1,i.connect(lt);const l=Yt(D,a,"bandpass",480,.7,.3,i),c=Yt(D,a,"highpass",1900,.5,0,i),h=Yt(D,a,"lowpass",220,1.1,.22,i),d=Yt(D,a,"lowpass",96,1.6,0,i),p=D.createGain();p.gain.value=1,p.connect(o);const x=D.createOscillator();x.type="sawtooth",x.frequency.value=41;const u=D.createBiquadFilter();u.type="lowpass",u.frequency.value=190,u.Q.value=1.2;const m=D.createGain();m.gain.value=0,x.connect(u).connect(m).connect(p),x.start();const r=D.createOscillator(),s=D.createOscillator(),f=D.createGain();r.frequency.value=.07,s.frequency.value=.113,f.gain.value=260,r.connect(f),s.connect(f),f.connect(l.filt.frequency),r.start(),s.start();const b=D.createGain();b.gain.value=0,b.connect(lt);const w=D.createGain();w.gain.value=.16,w.connect(b);for(const[M,R]of[[146.83,1],[220,.5],[293.66,.3]]){const E=D.createOscillator();E.type="sine",E.frequency.value=M;const F=D.createGain();F.gain.value=R;const A=D.createOscillator(),C=D.createGain();A.frequency.value=.21+Math.random()*.1,C.gain.value=M*.004,A.connect(C).connect(E.frequency),A.start(),E.connect(F).connect(w),E.start()}const v=Yt(D,a,"bandpass",900,3.2,.05,b);return me={stormBus:i,festBus:b,wind:l,rain:c,sea:h,roar:d,breath:v,buf:a,comp:o,muffle:n,humGain:m,subBus:p},D}function yl(){if(!D||!me||!tt)return;const e=D.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const a=D.createOscillator(),i=D.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+o),a.frequency.exponentialRampToValueAtTime(1180,e+o+.5),i.gain.setValueAtTime(0,e+o),i.gain.linearRampToValueAtTime(n,e+o+.012),i.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),a.connect(i).connect(me.subBus),a.start(e+o),a.stop(e+o+1.5)}}function bl(e=1){if(!D||!me||!tt)return;const o=D.currentTime,n=D.createBufferSource();n.buffer=me.buf;const a=D.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,o),a.frequency.exponentialRampToValueAtTime(240,o+.5),a.Q.value=.7;const i=D.createGain();i.gain.setValueAtTime(0,o),i.gain.linearRampToValueAtTime(.5*e,o+.02),i.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(a).connect(i).connect(lt),n.start(o),n.stop(o+.9)}function At(e,o=1,n=82){if(!D||!me)return;const a=D.createOscillator(),i=D.createGain();a.type="sine",a.frequency.setValueAtTime(n*2.1,e),a.frequency.exponentialRampToValueAtTime(n,e+.06),a.frequency.exponentialRampToValueAtTime(n*.7,e+.5),i.gain.setValueAtTime(0,e),i.gain.linearRampToValueAtTime(o,e+.004),i.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(i).connect(me.festBus),a.start(e),a.stop(e+.7);const l=D.createBufferSource();l.buffer=me.buf;const c=D.createBiquadFilter();c.type="bandpass",c.frequency.value=1400,c.Q.value=.8;const h=D.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),l.connect(c).connect(h).connect(me.festBus),l.start(e),l.stop(e+.12)}function vl(e=1,o=0){if(!D||!me||!tt)return;const n=D.currentTime+o,a=D.createBufferSource();a.buffer=me.buf,a.loop=!0;const i=D.createBiquadFilter();i.type="lowpass",i.frequency.setValueAtTime(320,n),i.frequency.exponentialRampToValueAtTime(70,n+2.6),i.Q.value=.9;const l=D.createGain(),c=.5*e;l.gain.setValueAtTime(0,n),l.gain.linearRampToValueAtTime(c,n+.05),l.gain.exponentialRampToValueAtTime(c*.24,n+.7),l.gain.exponentialRampToValueAtTime(c*.42,n+1.35),l.gain.exponentialRampToValueAtTime(1e-4,n+3.4),a.connect(i).connect(l).connect(me.stormBus),a.start(n),a.stop(n+3.6);const h=D.createOscillator(),d=D.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),d.gain.setValueAtTime(0,n),d.gain.linearRampToValueAtTime(.32*e,n+.08),d.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(d).connect(me.stormBus),h.start(n),h.stop(n+2.8)}function Ml(e=.5){if(!D||!me||!tt)return;const o=D.currentTime;for(const[n,a,i]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const l=D.createOscillator(),c=D.createGain();l.type="sine",l.frequency.value=61*n,c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(e*a,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+i),l.connect(c).connect(lt),l.start(o),l.stop(o+i+.1)}}let Ye=0,Wo=0,ys=0,Xt=0;function jl(e){if(!un||!D||!me||!tt)return;const o=D.currentTime,n=e.shelter,a=e.underwater,i=e.subActive?.12:1,l=Math.sin(n*Math.PI*.5)*i*(1-a*.92);me.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),me.festBus.gain.setTargetAtTime(l,o,.35),me.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),me.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),me.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),me.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),o,.3),me.muffle.frequency.setTargetAtTime(18e3-a*17400,o,.18);const c=e.subActive?a*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(me.humGain.gain.setTargetAtTime(c,o,.25),e.splash!==ys&&(ys=e.splash,bl(1)),e.subActive&&a>.5?Xt===0?Xt=o+1.2:o>=Xt&&(yl(),Xt=o+6.5):Xt=0,n>.06){const d=.9090909090909091;for(Ye<o&&(Ye=o+.1);Ye<o+.35;){const p=Wo%8,x=n*.9;p===0?At(Ye,.85*x,74):p===2?At(Ye,.45*x,88):p===4?At(Ye,.7*x,74):p===6?At(Ye,.4*x,92):p===7&&(At(Ye,.3*x,96),At(Ye+d*.5,.36*x,96)),Wo++,Ye+=d}}else Ye=0,Wo=0}function Sl(){const e=g.useRef(!1),o=g.useRef(-1);return J(()=>{if(jl(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,a=500+Math.abs(n.z)*900;vl(Math.min(1,.55+y.flash*.6),a/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&Ml(.55),o.current=y.shot)}),null}function zl({mode:e}){return y.mode=e,J(()=>xi(),-100),null}function kl({every:e=12}){const o=Me(a=>a.gl),n=g.useRef(0);return g.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),J(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function Tl({budget:e}){const o=Me(a=>a.setDpr),n=g.useRef(e.dpr[1]);return t.jsx(ra,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function El(){const e=Me(a=>a.gl),o=Me(a=>a.scene),n=Me(a=>a.camera);return g.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(o,n)}catch(i){console.warn("[onigashima] pre-compile skipped",i)}},900);return()=>clearTimeout(a)},[e,o,n]),null}function Rl(){const{camera:e,scene:o,gl:n}=Me();return g.useEffect(()=>{},[e,o,n]),null}const Al=new fe(X.haze),Fl=new fe(X.underHaze),Cl=new fe(X.abyss),bs=new fe;function Il(){const e=Me(o=>o.scene);return J(()=>{if(!e.fog)return;const o=S.clamp(y.depthBelow/ft.deepGrade,0,1),n=S.lerp(.0062,.0142,o);e.fog.density=S.lerp(y.fog,n,y.underwater),bs.copy(Fl).lerp(Cl,o*.8),e.fog.color.lerpColors(Al,bs,y.underwater)}),null}function Ll({quality:e,budget:o,onRails:n,playing:a,speed:i,onShot:l,mode:c,onMode:h}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,y.fog]}),t.jsx(ya,{storm:y}),t.jsx(Ir,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx($a,{quality:e,segments:o.segments}),t.jsx(Na,{quality:e,storm:y}),t.jsx(ar,{quality:e,shadows:o.shadows}),t.jsx(Nn,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Nn,{quality:e,shadows:!1,z:Jt,k:U*1.5}),t.jsx(hr,{quality:e,shadows:o.shadows}),t.jsx(ur,{quality:e,shadows:o.shadows}),t.jsx(Er,{quality:e}),t.jsx(Ar,{shadows:o.shadows}),t.jsx(Bi,{quality:e,shadows:o.shadows}),t.jsx(_r,{quality:e}),t.jsx($r,{quality:e}),t.jsx(qr,{quality:e}),t.jsx(li,{quality:e}),t.jsx(ji,{onRails:n&&c==="off",playing:a&&c==="off",speed:i,onShot:l,idle:c!=="off"}),t.jsx(zl,{mode:c}),t.jsx(nl,{mode:c,onMode:h}),t.jsx(ul,{mode:c,onMode:h}),t.jsx(Sl,{}),t.jsx(Il,{}),t.jsx(Rl,{}),t.jsx(El,{}),t.jsx(Tl,{budget:o}),o.shadows&&t.jsx(kl,{every:o.shadowEvery})]})}const Kt="#d63420",Gl="rgba(8,6,16,0.72)",vs="(max-width: 860px), (max-height: 520px)",$o="min(7.5vh, 62px)";function Pl(e=2600,o=!0){const[n,a]=g.useState(!1);return g.useEffect(()=>{if(!o){a(!1);return}let i;const l=()=>{a(!1),clearTimeout(i),i=setTimeout(()=>a(!0),e)};l();for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(c,l,{passive:!0});return()=>{clearTimeout(i);for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(c,l)}},[e,o]),n}function Ol(){const[e,o]=g.useState(()=>typeof window<"u"&&window.matchMedia(vs).matches);return g.useEffect(()=>{const n=window.matchMedia(vs),a=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",a):n.addListener(a),()=>{n.removeEventListener?n.removeEventListener("change",a):n.removeListener(a)}},[]),e}function Ue({on:e,onClick:o,children:n,title:a,wide:i,block:l}){return t.jsx("button",{onClick:o,title:a,style:{appearance:"none",border:`1px solid ${e?Kt:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:i||l?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:l?"100%":void 0,textAlign:l?"right":"center",minHeight:32},children:n})}function Dl({shot:e,shotIndex:o,shotCount:n,total:a,playing:i,onRails:l,speed:c,tier:h,override:d,dev:p,onPlay:x,onRailsToggle:u,onSpeed:m,onQuality:r,onRestart:s,audio:f,onAudio:b,mode:w,onMode:v,stage:M,veiled:R=!1}){const E=w!=="off",F=Ol(),[A,C]=g.useState(!1),[z,k]=g.useState(()=>({...ye}));g.useEffect(()=>$s(Y=>k({...Y})),[]);const N=Pl(2600,!E&&!A),I=g.useRef(),V=g.useRef(),Z=g.useRef(),oe=g.useRef(),G=g.useRef(),L=g.useRef(),Q=l&&!E;g.useEffect(()=>C(!1),[w]),g.useEffect(()=>{let Y,je=performance.now(),Be=0,Le=0;const Ge=dt=>{if(Y=requestAnimationFrame(Ge),I.current&&(I.current.style.transform=`scaleX(${M.progress||0})`),Z.current&&M.helm){const P=M.helm;if(P.onFoot)Z.current.textContent=P.area==="island"?P.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":P.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(P.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(P.sub){const le=Math.abs(P.speed)*1.94;if(P.berthing)Z.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const ke=P.maelstrom>.22?P.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":P.stress>.02?"⚠ HULL UNDER PRESSURE":P.scrape>.3?"HULL ON THE ROCK":"",De=Math.abs(P.relRear*180/Math.PI),nt=De<6?"· ON COURSE":P.relRear>0?`◀ ${De.toFixed(0)}°`:`${De.toFixed(0)}° ▶`,Pe=10,st=Math.round(P.depth/P.maxDepth*Pe),gt=Math.round(P.crushDepth/P.maxDepth*Pe);let ut="";for(let Ee=0;Ee<Pe;Ee++)ut+=Ee<st?Ee>=gt?"▓":"█":Ee===gt?"┃":"·";const wt=P.cruise===2?" ⟲FLK":P.cruise===1?" ⟲AHD":"";Z.current.textContent=`DEPTH ${P.depth.toFixed(0).padStart(3,"0")}/${P.orderedDepth.toFixed(0).padStart(3,"0")}m ${ut}  ${le.toFixed(0).padStart(2,"0")} KN${wt}
COVE ${Math.round(P.toRear)}m  ${nt}`+(ke?`
${ke}`:"")}}else{const le=Math.abs(P.speed)*1.94,ke=(P.heading*180/Math.PI+180)%360,De=Math.round((P.burst??0)*5),nt=P.burst>=.999?"BURST ▶READY":`BURST ${"█".repeat(De)}${"·".repeat(5-De)}`,Pe=P.cruise===2?"  ⟲FLANK":P.cruise===1?"  ⟲AHEAD":P.flank>.5?"  FLANK":"";Z.current.textContent=`${le.toFixed(0).padStart(2,"0")} KN   BRG ${ke.toFixed(0).padStart(3,"0")}°   ${nt}${Pe}
`+(P.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":P.moored?"MOORING":P.aground>.3?"AGROUND — HELM OVER":P.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(P.toGate)}m`:P.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(P.toGate)}m`:`GATE ${Math.round(P.toGate)}m`)}}if(oe.current){const P=Yr(),le=Vr(B.chain);oe.current.textContent=B.done?"✔ OBJECTIVE COMPLETE":P?`▸ ${B.step+1}/${le}  ${P.text}`:"",oe.current.style.color=B.done?"#8fe0a0":"#ffd9cf"}if(G.current){const P=Math.max(0,Math.min(1,B.hull)),le=Math.max(0,Math.min(1,B.grip)),ke=Pe=>{const st=Math.round(Pe*12);return"█".repeat(st)+"·".repeat(12-st)},De=P>.6?"#8fe0a0":P>.3?"#ffc46b":"#ff6b5a",nt=le>.66?"#ff6b5a":le>.33?"#ffc46b":"rgba(255,255,255,0.45)";G.current.innerHTML=`<span style="color:${De}">HULL ${ke(P)}</span>`+(le>.02?`<span style="color:${nt};margin-left:14px">VORTEX ${ke(le)}</span>`:"")}if(L.current){const P=B.banner,le=L.current;P?(le.dataset.text!==P.text&&(le.dataset.text=P.text,le.innerHTML=`<div class="og-banner-main">${P.text}</div>`+(P.sub?`<div class="og-banner-sub">${P.sub}</div>`:""),le.style.animation="none",le.offsetWidth,le.style.animation=""),le.style.opacity="1"):(le.style.opacity="0",le.dataset.text="")}p&&V.current?(Le++,Be+=dt-je,je=dt,Be>400&&(V.current.textContent=`${Math.round(Le*1e3/Be)} fps · shelter ${M.shelter.toFixed(2)} · fog ${(M.fog*1e4).toFixed(1)}e-4 · flash ${M.flash.toFixed(2)}`,Be=0,Le=0)):je=dt};return Y=requestAnimationFrame(Ge),()=>cancelAnimationFrame(Y)},[M,p]);const ae={opacity:N?.16:1,transform:N?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},xe=[{key:"rails",on:!l,label:l?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:u,cinematicOnly:!0},{key:"helm",on:w==="helm",label:w==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>v(w==="helm"?"off":"helm")},{key:"sub",on:w==="sub",label:w==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>v(w==="sub"?"off":"sub")},{key:"foot",on:w==="foot",label:w==="foot"?"LEAVE DOME":"ENTER THE DOME",title:"Walk the Live Floor inside the Skull Dome",click:()=>v(w==="foot"?"off":"foot")}],ne=(Y,je)=>t.jsx(Ue,{on:Y.on,onClick:Y.click,title:Y.title,wide:!0,block:je,children:Y.label},Y.key),We=Y=>E?t.jsxs(t.Fragment,{children:[t.jsx(Ue,{on:z.comfort>.01,wide:!0,block:Y,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:hi,children:z.comfort>.9?"COMFORT · FULL":z.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Ue,{on:z.freeCam,wide:!0,block:Y,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>zo("freeCam"),children:z.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Ue,{on:Math.abs(z.lookSens-1)>.01,wide:!0,block:Y,title:"How far a drag turns the view",onClick:di,children:`LOOK ${z.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Ue,{on:z.invertY,wide:!0,block:Y,title:"Invert the vertical look axis",onClick:()=>zo("invertY"),children:z.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,Ie=Y=>t.jsxs(t.Fragment,{children:[!E&&t.jsxs(t.Fragment,{children:[t.jsx(Ue,{on:i,onClick:x,title:"Play / pause the cinematic",block:Y,children:i?Y?"❙❙  PAUSE":"❙❙":Y?"▶  PLAY":"▶"}),[.5,1,2].map(je=>t.jsxs(Ue,{on:c===je,onClick:()=>m(je),title:`${je}× speed`,block:Y,children:[je,"×"]},je))]}),t.jsx(Ue,{on:!1,onClick:s,title:"Restart from the open sea",block:Y,children:Y?"↺  RESTART":"↺"}),t.jsx(Ue,{on:f,onClick:b,title:"Storm, taiko and a temple bell — all synthesised",block:Y,children:f?Y?"♪  SOUND ON":"♪":Y?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Ue,{on:d!=="auto",wide:!0,block:Y,title:"Render tier",onClick:()=>r(d==="auto"?"low":d==="low"?"mobile":d==="mobile"?"high":"auto"),children:d==="auto"?`AUTO · ${h.toUpperCase()}`:d.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!R&&t.jsxs(t.Fragment,{children:[[0,1].map(Y=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[Y?"bottom":"top"]:0,height:Q?$o:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},Y)),t.jsxs("div",{className:"og-tategaki",style:{opacity:E||A?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:E?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${Kt}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:E?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:I,style:{height:"100%",background:`linear-gradient(90deg, ${Kt}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${Kt}`}})}),t.jsx("div",{className:`og-chrome${E?"":" og-chrome-bottom"}`,style:{...E?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...ae},children:F?t.jsxs(t.Fragment,{children:[E&&t.jsx(Ue,{on:!0,onClick:()=>v("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),t.jsx(Ue,{on:A,onClick:()=>C(Y=>!Y),title:"Menu",children:A?"✕":"☰"}),A&&t.jsxs("div",{className:"og-menu",children:[E&&t.jsxs(t.Fragment,{children:[We(!0),t.jsx("div",{className:"og-menu-rule"})]}),xe.filter(Y=>!(Y.cinematicOnly&&E)).map(Y=>ne(Y,!0)),t.jsx("div",{className:"og-menu-rule"}),Ie(!0)]})]}):t.jsxs(t.Fragment,{children:[We(!1),Ie(!1),xe.filter(Y=>!(Y.cinematicOnly&&E)).map(Y=>ne(Y,!1))]})}),!E&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...ae,pointerEvents:"none"},children:[l?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:l?`  ·  ${Math.round(a)}s`:""})]}),E&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:oe,className:"og-objective"}),t.jsx("div",{ref:Z,className:"og-readout"}),t.jsx("div",{ref:G,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:w==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":w==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":"WASD MOVE · SHIFT RUN · DRAG LOOK · R LEVEL VIEW"})]}),E&&t.jsx("div",{ref:L,className:"og-banner"}),p&&t.jsx("div",{ref:V,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:Gl,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${Q?$o:"0px"};
          --og-bottom: ${Q?$o:"0px"};
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
          color: ${Kt};
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
      `})]})}const Vo="#d63420",Nl=[{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · the fleet, the gate, the face"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea, run the torii, moor under the skull"},{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Under the maelstroms to the back door — the way Law went"},{key:"foot",kanji:"城",label:"ENTER THE DOME",sub:"Walk the Live Floor and climb the demon keep"}];function Hl({onPick:e}){const[o,n]=g.useState(!1),a=g.useRef(),i=620,l=d=>{o||(n(!0),e(d))},[c,h]=g.useState(!1);return g.useEffect(()=>{if(!o)return;const d=setTimeout(()=>h(!0),i);return()=>clearTimeout(d)},[o]),g.useEffect(()=>{const d=p=>{(p.key==="Escape"||p.key==="Enter")&&l("off")};return window.addEventListener("keydown",d),()=>window.removeEventListener("keydown",d)}),c?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${i}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a castle inside a demon’s skull, and one channel in. Sail it, dive under it, or walk it."}),t.jsx("div",{className:"og-landing-grid",children:Nl.map((d,p)=>t.jsxs("button",{className:"og-entry",style:{animationDelay:`${.36+p*.07}s`},onClick:()=>l(d.key),children:[t.jsx("span",{className:"og-entry-kanji",children:d.kanji}),t.jsxs("span",{className:"og-entry-text",children:[t.jsx("span",{className:"og-entry-label",children:d.label}),t.jsx("span",{className:"og-entry-sub",children:d.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},d.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          color: ${Vo};
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
          border-color: ${Vo};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${Vo};
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
      `})]})}const Sn="#d63420",zn="#4aa9c9",_l=(e,o,n)=>e<o?o:e>n?n:e;function na(e,o,n){const a=g.useRef(o);a.current=o;const i=g.useRef(null),l=g.useRef({x:0,y:0});g.useEffect(()=>{const c=e.current;if(!c||!n)return;const h=u=>{if(i.current===null){i.current=u.pointerId,l.current={x:u.clientX,y:u.clientY};try{c.setPointerCapture?.(u.pointerId)}catch{}a.current.onMove(0,0,u.clientX,u.clientY),u.preventDefault()}},d=u=>{if(u.pointerId!==i.current)return;const m=l.current;a.current.onMove(u.clientX-m.x,u.clientY-m.y,m.x,m.y),u.preventDefault()},p=u=>{u.pointerId===i.current&&(i.current=null,a.current.onEnd(),u.cancelable&&u.preventDefault())};c.addEventListener("pointerdown",h),c.addEventListener("pointermove",d),c.addEventListener("pointerup",p),c.addEventListener("pointercancel",p),window.addEventListener("pointerup",p),window.addEventListener("pointercancel",p);const x=()=>{i.current!==null&&(i.current=null,a.current.onEnd())};return window.addEventListener("blur",x),()=>{c.removeEventListener("pointerdown",h),c.removeEventListener("pointermove",d),c.removeEventListener("pointerup",p),c.removeEventListener("pointercancel",p),window.removeEventListener("pointerup",p),window.removeEventListener("pointercancel",p),window.removeEventListener("blur",x)}},[e,n])}function Bl({label:e,sub:o,onDown:n,onUp:a,tone:i="plain",wide:l=!1}){const[c,h]=g.useState(!1),d=g.useRef();g.useEffect(()=>{const x=d.current;if(!x)return;let u=null;const m=s=>{u=s.pointerId;try{x.setPointerCapture?.(u)}catch{}h(!0),n(),s.preventDefault(),s.stopPropagation()},r=s=>{s.pointerId===u&&(u=null,h(!1),a(),s.preventDefault(),s.stopPropagation())};return x.addEventListener("pointerdown",m),x.addEventListener("pointerup",r),x.addEventListener("pointercancel",r),x.addEventListener("pointerleave",r),()=>{x.removeEventListener("pointerdown",m),x.removeEventListener("pointerup",r),x.removeEventListener("pointercancel",r),x.removeEventListener("pointerleave",r)}},[n,a]);const p=i==="hot"?Sn:i==="cool"?zn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:d,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${c?p:"rgba(255,255,255,0.18)"}`,background:c?`color-mix(in srgb, ${p} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:c?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Lt({label:e,sub:o,onTap:n,on:a,tone:i="plain",wide:l=!1}){const c=g.useRef(),h=g.useRef(n);h.current=n,g.useEffect(()=>{const p=c.current;if(!p)return;const x=u=>{h.current(),u.preventDefault(),u.stopPropagation()};return p.addEventListener("pointerdown",x),()=>p.removeEventListener("pointerdown",x)},[]);const d=i==="hot"?Sn:i==="cool"?zn:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${l?" og-btn-wide":""}`,style:{border:`1px solid ${a?d:"rgba(255,255,255,0.18)"}`,background:a?`color-mix(in srgb, ${d} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:a?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function Ul(){const[e,o]=g.useState(ht.level);return g.useEffect(()=>mi(o),[]),t.jsx(Lt,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:Vs})}function Wl({simple:e=!1}){const[o,n]=g.useState(ye.freeCam);g.useEffect(()=>$s(i=>n(i.freeCam)),[]);const a=g.useRef(null);return e?t.jsx(Lt,{label:"LEVEL",sub:"view",onTap:()=>H.recentreQueued=!0}):t.jsx(Lt,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const i=performance.now();if(a.current&&i-a.current<420){a.current=null,zo("freeCam"),H.recentreQueued=!0;return}a.current=i,H.recentreQueued=!0}})}function $l({active:e}){const o=g.useRef(),n=g.useRef(),a=g.useRef(),i=78;return g.useEffect(()=>{if(!e)return;let l;const c=()=>{l=requestAnimationFrame(c);const h=a.current,d=y.helm;h&&(h.textContent=d?.sub?String(Math.round(d.orderedDepth)):"⇕")};return l=requestAnimationFrame(c),()=>cancelAnimationFrame(l)},[e]),na(o,{onMove:(l,c,h,d)=>{const p=o.current;if(!p)return;const x=p.getBoundingClientRect(),u=x.top+x.height/2,m=_l((d+c-u)/i,-1,1),r=Math.abs(m)<.1?0:m;ee.active=!0,ee.planes=-r;const s=n.current;s&&(s.style.transform=`translate(-50%, calc(-50% + ${m*i}px))`,s.style.borderColor=zn,s.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{ee.planes=0;const l=n.current;l&&(l.style.transform="translate(-50%, -50%)",l.style.borderColor="rgba(255,255,255,0.3)",l.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:a,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function Vl({mode:e}){const o=g.useRef(),n=g.useRef(),a=g.useRef(),i=g.useRef(),l=62,c=7,h=g.useRef(e);if(h.current=e,na(o,{onMove:(x,u,m,r)=>{const s=Math.hypot(x,u),f=s>l?l/s:1,b=x*f,w=u*f,v=n.current,M=a.current;v&&(v.style.transform=`translate(${m-l}px, ${r-l}px)`,v.style.opacity="1"),M&&(M.style.transform=`translate(${m+b-26}px, ${r+w-26}px)`,M.style.opacity="1"),i.current&&(i.current.style.opacity="0");const R=Math.abs(b)<c?0:b/l,E=Math.abs(w)<c?0:w/l;ee.active=!0,h.current==="foot"?(ee.walk.x=R,ee.walk.z=-E):(ee.throttle=-E,ee.rudder=-R)},onEnd:()=>{n.current&&(n.current.style.opacity="0"),a.current&&(a.current.style.opacity="0"),i.current&&(i.current.style.opacity=""),ee.throttle=0,ee.rudder=0,ee.walk.x=0,ee.walk.z=0}},e!=="off"),g.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),g.useEffect(()=>()=>{ee.throttle=0,ee.rudder=0,ee.planes=0,ee.boost=!1,ee.walk.x=0,ee.walk.z=0},[e]),e==="off")return null;const d=e==="sub",p=e==="foot";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:o,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:n,style:{position:"fixed",left:0,top:0,width:l*2,height:l*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:a,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${Sn}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsxs("div",{ref:i,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:p?"DRAG TO WALK":"DRAG TO STEER"})]}),t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[d&&t.jsx($l,{active:!0}),t.jsxs("div",{className:"og-actions",children:[d&&t.jsx(Lt,{label:"SURFACE",sub:"blow all",onTap:()=>H.surfaceQueued=!0}),d&&t.jsx(Lt,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>H.periscopeQueued=!0}),e==="helm"&&t.jsx(Lt,{label:"BURST",sub:"coup de",tone:"cool",onTap:()=>H.burstQueued=!0}),!p&&t.jsx(Ul,{}),t.jsx(Bl,{label:p?"RUN":"FLANK",sub:p?"»":"over",tone:"hot",onDown:()=>ee.boost=!0,onUp:()=>ee.boost=!1}),t.jsx(Wl,{simple:p})]})]}),t.jsx("style",{children:`
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
      `})]})}const Ms={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function Yl(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const Xl=null;function Jl(){const e=g.useMemo(()=>!1,[]),[o]=g.useState(Yl),[n,a]=g.useState("auto"),i=n==="auto"?o:n,l=Ms[i]??Ms.high;g.useEffect(()=>{Za(l.scene!=="low")},[l.scene]),g.useMemo(()=>ks(l.scene),[l.scene]),g.useMemo(()=>pi(),[]),g.useEffect(()=>fi(),[]);const c=g.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,d]=g.useState(0),[p,x]=g.useState(!0),[u,m]=g.useState(!0),[r,s]=g.useState(1),[f,b]=g.useState(as[0]),[w,v]=g.useState(0),[M,R]=g.useState(gl),[E,F]=g.useState(()=>{if(typeof location>"u")return"off";const L=new URLSearchParams(location.search).get("mode");return L==="helm"||L==="sub"||L==="foot"?L:"off"});g.useEffect(()=>{if(!M)return;const L=()=>{Uo(),Bo(!0)};for(const Q of["pointerdown","keydown","touchstart"])window.addEventListener(Q,L,{once:!0,passive:!0});return()=>{for(const Q of["pointerdown","keydown","touchstart"])window.removeEventListener(Q,L)}},[M]);const A=g.useCallback(()=>{R(L=>{const Q=!L;return Q&&Uo(),Bo(Q),Q})},[]),[C,z]=g.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),k=g.useCallback(L=>{M&&(Uo(),Bo(!0)),L==="off"?(y.jumpTo=0,x(!0),m(!0)):F(L),z(!0)},[M]),[N,I]=g.useState(!1),V=g.useRef(!0);g.useEffect(()=>{if(Ys(),V.current){V.current=!1;return}I(!0);const L=setTimeout(()=>I(!1),210);return()=>clearTimeout(L)},[E]);const Z=g.useCallback((L,Q)=>{v(L),b(Q)},[]),oe=g.useCallback(()=>{Ka(),d(L=>L+1),x(!0),m(!0)},[]),G=g.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(g.Suspense,{fallback:null,children:t.jsx(Xl,{})}):t.jsxs(t.Fragment,{children:[t.jsx(ia,{shadows:l.shadows,dpr:l.dpr,gl:{antialias:l.aa,powerPreference:"high-performance",toneMapping:fa,toneMappingExposure:xa,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(g.Suspense,{fallback:null,children:t.jsx(Ll,{quality:l.scene,budget:l,onRails:u,playing:p,speed:r,onShot:Z,mode:E,onMode:F},h)})}),c&&C&&t.jsx(Vl,{mode:E}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:N?1:0,transition:N?"opacity .2s ease-in":"opacity .42s ease-out"}}),!C&&t.jsx(Hl,{onPick:k}),t.jsx(Dl,{veiled:!C,shot:f,shotIndex:w,shotCount:as.length,total:hn,playing:p,onRails:u,speed:r,tier:i,override:n,dev:G,onPlay:()=>x(L=>!L),onRailsToggle:()=>m(L=>!L),onSpeed:s,onQuality:a,onRestart:oe,audio:M,onAudio:A,mode:E,onMode:F,stage:y})]})}export{Jl as default};
