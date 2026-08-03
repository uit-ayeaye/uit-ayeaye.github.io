var Qr=Object.defineProperty;var Xr=(e,o,n)=>o in e?Qr(e,o,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[o]=n;var ka=(e,o,n)=>Xr(e,typeof o!="symbol"?o+"":o,n);import{r as w,u as ae,j as t,d as Zs,f as xe,h as Zr,i as qr}from"./vendor-C2HIMx-P.js";import{t as ze,c as z,aD as On,au as aa,d as sa,a5 as Be,aJ as Jr,f as ei,Y as ja,a0 as Sa,ag as R,h as ee,aK as ti,ay as oi,az as fo,aA as mo,aq as qs,R as ni,M as pt,o as kt,at as $t,ax as it,aL as Xt,aM as go,a4 as ai,a8 as Lt,ar as Zt,av as Js,aI as si,aC as ri,A as ii}from"./three-Zo_RlN_K.js";import{f as ho,m as Io,w as $e,a as eo,e as Ft,P as li,G as ci,S as hi,I as di}from"./index-2KCKzcEN.js";const X={skyHigh:"#140f2b",skyLow:"#3a2a5c",cloud:"#2a2244",cloudLit:"#6b3f5e",seaDeep:"#080d1c",seaShallow:"#16294a",foam:"#c8d6e8",rock:"#2b2f3f",rockLit:"#4c5468",snow:"#aebdd4",pine:"#16202c",bolt:"#e9a8ff",boltGlow:"#a855f7",haze:"#1d1936",abyss:"#03121f",underGlow:"#7cbfe4",underHaze:"#0b2b40"},A={furnace:"#fff1c4",ember:"#ff9c2e",emberDeep:"#c9411a",lantern:"#ff7a3c",lanternFar:"#ffb066",vermilion:"#d63420",vermilionDeep:"#7e1c14",rockWarm:"#6d3a2c",gilt:"#e8a33d",sakura:"#f2a8c4",timber:"#6b4b34"},en={dir:[.72,.52,-.44],col:"#f2e9cf"},Bt={sea:.00105,bay:48e-5,deepGrade:210},ui=1.15;function ie(e){const o=new ze(e);return[o.r,o.g,o.b]}const pi=`
  varying vec3 vDir;
  void main() {
    vDir = position;
    // Kill translation so the dome is always centred on the camera: the sky
    // must not parallax, or a 4km sail visibly slides the clouds sideways.
    vec4 p = projectionMatrix * mat4(mat3(modelViewMatrix)) * vec4(position, 1.0);
    // Force to the far plane so nothing can ever be behind it.
    gl_Position = p.xyww;
  }
`,fi=`
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
`;function mi({storm:e}){const o=w.useRef(),n=w.useMemo(()=>({uTime:{value:0},uHigh:{value:new z(...ie(X.skyHigh))},uLow:{value:new z(...ie(X.skyLow))},uCloud:{value:new z(...ie(X.cloud))},uCloudLit:{value:new z(...ie(X.cloudLit))},uEmber:{value:new z(...ie(A.ember))},uFlash:{value:0},uFlashColor:{value:new z(...ie(X.boltGlow))},uFlashDir:{value:new z(0,.4,-1)},uGlow:{value:1},uMoonDir:{value:new z(...en.dir).normalize()},uMoonCol:{value:new z(...ie(en.col))},uUnder:{value:0},uUnderCol:{value:new z(...ie(X.underHaze))}}),[]);return ae((a,s)=>{const i=o.current?.uniforms;i&&(i.uTime.value+=s,i.uFlash.value=e?.flash??0,e?.flashDir&&i.uFlashDir.value.copy(e.flashDir),i.uUnder.value=e?.underwater??0)}),t.jsxs("mesh",{frustumCulled:!1,renderOrder:-1,children:[t.jsx("sphereGeometry",{args:[1,32,20]}),t.jsx("shaderMaterial",{ref:o,vertexShader:pi,fragmentShader:fi,uniforms:n,side:On,depthWrite:!1,depthTest:!1,fog:!1})]})}const H=1.9,U=e=>e*H,pe={x:0,z:U(-60)},Mt=U(300),Qo=U(175),gi=118,F={x:0,z:U(-402),r:U(215),baseY:300,squash:[1.18,1.04,.98]},Ro=[[-.361,.301,.883],[.361,.301,.883]],ra=[0,.02,.9998],ia=[0,-.419,.908];function la(e,o=1){const[n,a,s]=F.squash;return{x:F.x+e[0]*F.r*n*o,y:F.baseY+e[1]*F.r*a*o,z:F.z+e[2]*F.r*s*o}}const Pe=Ro.map(e=>la(e)),de={...la(ia),halfWidth:74,height:62};la(ra,.94);const Q={x:U(-152),y:4.5,z:U(-104),r:U(78)},za=2.35,Yt=[Math.sin(za),Math.cos(za)],Y=(()=>{const e=Mt+Qo*.35,o=pe.x+Yt[0]*e,n=pe.z+Yt[1]*e;return{x:o,z:n,pool:U(46),benchY:3.6,reach:U(560),gate:{x:o-Yt[0]*U(44),z:n-Yt[1]*U(44)},berth:{x:o+Yt[0]*U(12),z:n+Yt[1]*U(12)},dir:Yt}})(),xi=[{rank:1,role:"east-flank",ang:1.05,dist:U(700),r:U(150),depth:38,dir:-1,speed:46},{rank:2,role:"west-flank",ang:-1.05,dist:U(700),r:U(148),depth:37,dir:1,speed:46},{rank:3,role:"back-door",ang:2.18,dist:U(770),r:U(142),depth:40,dir:1,speed:48},{rank:4,role:"east",ang:1.58,dist:U(716),r:U(158),depth:42,dir:1,speed:50},{rank:5,role:"west",ang:-1.58,dist:U(716),r:U(154),depth:41,dir:-1,speed:50},{rank:6,role:"east-outer",ang:1.32,dist:U(950),r:U(144),depth:36,dir:1,speed:44},{rank:7,role:"west-outer",ang:-1.32,dist:U(950),r:U(142),depth:36,dir:-1,speed:44},{rank:8,role:"east-north",ang:1.86,dist:U(950),r:U(152),depth:41,dir:-1,speed:46},{rank:9,role:"west-north",ang:-1.86,dist:U(950),r:U(150),depth:42,dir:1,speed:46}],Ue=[];function er(e){const o=e==="low"?3:e==="mid"?6:9;Ue.length=0;for(const n of xi)n.rank>o||Ue.push({role:n.role,x:pe.x+Math.sin(n.ang)*n.dist,z:pe.z+Math.cos(n.ang)*n.dist,r:n.r,depth:n.depth,dir:n.dir,speed:n.speed});return Ue}const bi=e=>Ue.find(o=>o.role===e)??Ue[0];er("high");function tr(e,o,n=0){let a=0,s=0;const c=Math.max(.22*(1-Ke(180,620,n)),1-Ke(10,46,n));if(c<=0)return{vx:a,vz:s,danger:0};let h=0;for(const l of Ue){const u=e-l.x,b=o-l.z,m=Math.hypot(u,b);if(m>l.r*2.05||m<.001)continue;const g=m/l.r,x=1-Ke(1.15,1.95,g),f=l.speed*(g/.3)*Math.exp(1-g/.3)*.68*x,p=l.speed*.58*Math.exp(-g*g*2.6)*x+l.speed*.13*x,d=1/m;a+=(-b*d*f*l.dir-u*d*p)*c,s+=(u*d*f*l.dir-b*d*p)*c,h=Math.max(h,(1-Ke(.15,1.35,g))*c)}return{vx:a,vz:s,danger:h}}const tn={x:0,halfWidth:U(96)},Ut=U(258),uo=U(624),on={safe:260,range:640},wi=0,Xo=U(1500),nn=e=>e<0?0:e>1?1:e;function yi(e,o,n=4){let a=0,s=1,i=1,c=0;for(let h=0;h<n;h++){const l=1-Math.abs(ho(e*i,o*i,1)*2-1);a+=l*l*s,c+=s,s*=.52,i*=2.07}return a/c}const Ke=(e,o,n)=>{const a=nn((n-e)/(o-e));return a*a*(3-2*a)};function vi(e){if(e>U(430))return 1e4;const o=1-Ke(U(430),U(205),e),n=Ke(U(150),U(-30),e);return tn.halfWidth+o*U(620)+n*U(300)}function Mi(e){const o=(1-Math.cos(e))*.5,n=Math.sin(e);let a=gi;return a+=o*190,a+=Math.max(0,n)*46,a-=Math.max(0,-n)*26,a}function le(e,o){const n=e-pe.x,a=o-pe.z,s=Math.hypot(n,a),i=Math.atan2(n,a),c=(s-Mt)/Qo,h=Math.exp(-c*c*1.35)*Mi(i),l=Math.max(0,s-Mt-Qo*.55),u=-Math.pow(l/210,1.6)*175,b=Math.max(0,Mt-Qo*.5-s),m=-Ke(0,150,b)*46,g=nn(h/60),x=(yi(e*.0052/H+13,o*.0052/H-21,4)-.42)*168*g,f=(ho(e*.0042/H+31,o*.0042/H-17,4)-.5)*84*g,p=(ho(e*.021-5,o*.021+9,3)-.5)*17*g;let d=h+u+m+x+f+p;const v=vi(o),j=1-Ke(v,v+U(105),Math.abs(e-tn.x)),S=1-Ke(U(-40),U(-190),o),k=j*S;d=d*(1-k)+Math.min(d,-34)*k;const E=Math.hypot(e-F.x,o-F.z);d+=Math.exp(-Math.pow(E/(F.r*1.55),2))*62;const r=(e-Q.x)/U(76),T=(o-Q.z)/U(58),C=(1-Ke(.72,1.18,Math.hypot(r,T)))*nn((d+34)/34);d=d*(1-C)+Q.y*C;const P=e-Y.x,M=o-Y.z;if(Math.abs(P)+Math.abs(M)<Y.reach+U(140)){const G=Math.max(0,Math.min(Y.reach,P*Y.dir[0]+M*Y.dir[1])),L=P-Y.dir[0]*G,W=M-Y.dir[1]*G,K=Math.hypot(L,W),fe=U(30)+G/Y.reach*U(48),O=1-Ke(fe,fe+U(62),K);d=d*(1-O)+Math.min(d,-26)*O;const $=Math.hypot(P,M),te=1-Ke(Y.pool*.55,Y.pool,$);d=d*(1-te)+Math.min(d,-14)*te;const se=(e-Y.gate.x)/U(30),me=(o-Y.gate.z)/U(24),ue=1-Ke(.72,1.18,Math.hypot(se,me));d=d*(1-ue)+Y.benchY*ue}return d}function ca(e,o,n=3){const a=le(e+n,o)-le(e-n,o),s=le(e,o+n)-le(e,o-n),i=-a,c=2*n,h=-s,l=Math.hypot(i,c,h)||1;return[i/l,c/l,h/l]}function ki(e,o,n=3){return Math.acos(ca(e,o,n)[1])}function Co(e,o){const n=Ke(U(250),U(40),o),a=1-Ke(Mt-U(40),Mt+U(90),Math.hypot(e-pe.x,o-pe.z)),s=(1-Ke(U(60),U(170),Math.hypot(e-Y.x,o-Y.z)))*.85;return nn(Math.max(Math.min(n,a),s))}const or=[{dir:[.1,-1],amp:9.4,len:187},{dir:[-.42,-.91],amp:4.3,len:97},{dir:[.71,-.7],amp:2.1,len:61},{dir:[-.86,-.51],amp:1.15,len:37}],ji=Math.PI*2;function Si(e,o,n){let a=0,s=0,i=0;for(const c of Ue){const h=e-c.x,l=o-c.z,u=Math.max(1,Math.hypot(h,l));if(u>c.r*1.75)continue;const b=u/c.r,m=Math.exp(-3*b*b);a-=c.depth*m;const g=c.depth*6*b*m/c.r;s+=g*(h/u),i+=g*(l/u);const x=Math.atan2(l,h),f=Math.sin(x*3*c.dir+b*14-n*2.2),p=b*Math.exp(1-b)*(1-zi(b));a+=f*p*1.6}return{y:a,dx:s,dz:i}}function zi(e){const o=Math.min(1,Math.max(0,(e-1)/.6));return o*o*(3-2*o)}function ut(e,o,n,a=1){let s=0,i=0,c=0;for(const l of or){const u=ji/l.len,b=Math.sqrt(9.81/u),m=Math.hypot(l.dir[0],l.dir[1]),g=l.dir[0]/m,x=l.dir[1]/m,f=u*(g*e+x*o-b*n),p=l.amp*a;s+=p*Math.sin(f);const d=p*u*Math.cos(f);i+=d*g,c+=d*x}const h=Si(e,o,n);return s+=h.y,i+=h.dx,c+=h.dz,{y:s,dx:i,dz:c}}const Ti=or.map(e=>`    gerstner(p, vec2(${e.dir[0].toFixed(3)}, ${e.dir[1].toFixed(3)}), ${e.amp.toFixed(2)} * amp, ${e.len.toFixed(1)}, uTime, disp, tangent, binormal, total);`).join(`
`),Ei=()=>Ue.map(e=>`    whirl(p, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.depth.toFixed(1)}, ${e.dir.toFixed(1)}, uTime, disp, tangent, binormal);`).join(`
`),Ri=()=>Ue.map(e=>`    wm += whirlMark(vWorld.xz, vec2(${e.x.toFixed(1)}, ${e.z.toFixed(1)}), ${e.r.toFixed(1)}, ${e.dir.toFixed(1)}, uTime);`).join(`
`),Ai=`
  /* The BAY's shelter: the front door, where the lanterns are. This is the
     only shelter that carries the gold — the rear cove is calm water too,
     but canon draws the back door COLD, so its pocket joins the total (for
     wave damping) and never the gilt. */
  float bayShelterAt(vec2 p) {
    float gate  = 1.0 - smoothstep(${(40*H).toFixed(1)}, ${(250*H).toFixed(1)}, p.y);
    float walls = 1.0 - smoothstep(${(Mt-40*H).toFixed(1)}, ${(Mt+90*H).toFixed(1)},
      length(p - vec2(${pe.x.toFixed(1)}, ${pe.z.toFixed(1)})));
    return clamp(min(gate, walls), 0.0, 1.0);
  }
  float shelterAt(vec2 p) {
    float rear  = (1.0 - smoothstep(${(60*H).toFixed(1)}, ${(170*H).toFixed(1)},
      length(p - vec2(${Y.x.toFixed(1)}, ${Y.z.toFixed(1)})))) * 0.85;
    return clamp(max(bayShelterAt(p), rear), 0.0, 1.0);
  }
`,Ii=()=>`
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
${Ai}

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
${Ti}

    /* The maelstroms. NOT scaled by amp: shelter and shoaling kill wind
       swell, but a whirlpool is the water itself moving — and both live in
       deep open sea anyway. */
${Ei()}

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
`,Ci=()=>`
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
${Ri()}
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

      /**
       * THE RIPPLE WAS A GRID, AND IT RENDERED AS ONE.
       *
       * NO BACKTICKS IN HERE — this comment is inside the shader's template
       * literal, so one of them ends the string and the file stops parsing.
       *
       * It used to be sin(x * 0.11) times sin(z * 0.13), and a product of two
       * one-dimensional sines is SEPARABLE: its zero lines are the lines
       * x = const and z = const, so it tiles the whole ceiling in a regular
       * eggbox about fifty metres on a side. Looking up from any depth, that
       * is a lattice of dots marching to the horizon — which is exactly what
       * it looked like, and nothing about water looks like that.
       *
       * Three waves running in NON-PERPENDICULAR, incommensurate directions
       * instead. Their interference never repeats on any lattice the eye can
       * lock onto, for the cost of one extra sine per fragment. Same trick,
       * and the same reason, as the swell itself using several components with
       * dissimilar headings.
       */
      float rip =
          sin(dot(vWorld.xz, vec2(0.104, 0.041)) + uTime * 1.9)
        + sin(dot(vWorld.xz, vec2(-0.049, 0.117)) - uTime * 1.6)
        + sin(dot(vWorld.xz, vec2(0.079, -0.073)) + uTime * 2.4);
      float ripple = 0.78 + 0.073 * rip;

      /* SNELL'S WINDOW, at its real angle. The cone is about 48.6° from
         vertical, so its edge sits at cos(48.6°) ≈ 0.66 — the old
         0.42 → 0.95 ramp started the window far too wide and finished it
         past anything the geometry ever reaches, which washed the whole
         ceiling instead of drawing a disc of sky in a dark mirror. */
      float window = smoothstep(0.54, 0.80, up) * ripple;
      /* The ripple is applied ONCE now. It used to multiply the window AND
         then the final colour, squaring the pattern and doubling its
         contrast — half of why the lattice was so hard. */
      col = mix(uUnderDeep, uUnderGlow, clamp(foam * 0.55 + window * 0.95, 0.0, 1.0));
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
`;function Pi(e,o){const n=new Uint8Array(e*e*4);for(let s=0;s<e;s++)for(let i=0;i<e;i++){const c=pe.x+((i+.5)/e-.5)*o,h=pe.z+((s+.5)/e-.5)*o,l=le(c,h),u=R.clamp(-l/46,0,1),b=(s*e+i)*4;n[b]=Math.round(u*255),n[b+1]=n[b],n[b+2]=n[b],n[b+3]=255}const a=new Jr(n,e,e,ei);return a.minFilter=ja,a.magFilter=ja,a.wrapS=Sa,a.wrapT=Sa,a.needsUpdate=!0,a}const an={low:112,mid:190,high:286},Nn=6400;function Li(e){const o=w.useRef(),n=Nn/(an[e]??an.high);return ae(a=>{const s=o.current;s&&(s.position.x=Math.round((a.camera.position.x-pe.x)/n)*n,s.position.z=Math.round((a.camera.position.z-pe.z)/n)*n)}),o}function Fi({quality:e="high",storm:o}){const n=w.useRef(),a=Li(e),{geometry:s,uniforms:i,landTex:c,vert:h,frag:l}=w.useMemo(()=>{const u=an[e]??an.high,b=new aa(Nn,Nn,u,u);b.rotateX(-Math.PI/2),b.translate(pe.x,0,pe.z);const m=Xo*1.05,g=Pi(e==="low"?160:256,m),x={uTime:{value:0},uLand:{value:g},uSpan:{value:m},uCentre:{value:new sa(pe.x,pe.z)},uDeep:{value:new z(...ie(X.seaDeep))},uShallow:{value:new z(...ie(X.seaShallow))},uFoam:{value:new z(...ie(X.foam))},uSkyLow:{value:new z(...ie(X.skyLow))},uGilt:{value:new z(...ie(A.gilt))},uEmber:{value:new z(...ie(A.ember))},uFogColor:{value:new z(...ie(X.haze))},uFogDensity:{value:.0011},uUnderDeep:{value:new z(...ie(X.abyss))},uUnderGlow:{value:new z(...ie(X.underGlow))},uDepthFade:{value:0},uMoonDir:{value:Gi.clone()},uMoonCol:{value:new z(...ie(Oi))},uEyeA:{value:new z(Pe[0].x,Pe[0].y,Pe[0].z)},uEyeB:{value:new z(Pe[1].x,Pe[1].y,Pe[1].z)},uFlash:{value:0},uFlashColor:{value:new z(...ie(X.boltGlow))},uCameraPos:{value:new z}};return{geometry:b,uniforms:x,landTex:g,vert:Ii(),frag:Ci()}},[e]);return ae((u,b)=>{const m=n.current?.uniforms;if(!m)return;m.uTime.value+=b,m.uCameraPos.value.copy(u.camera.position),m.uFlash.value=o?.flash??0,m.uFogDensity.value=o?.fog??.0011;const g=Math.min(1,Math.max(0,(o?.depthBelow??0)/Bt.deepGrade));m.uDepthFade.value=g,Ta.copy(Di).lerp(Hi,g*.8),m.uFogColor.value.lerpVectors(Ni,Ta,o?.underwater??0)}),t.jsx("mesh",{ref:a,geometry:s,frustumCulled:!1,renderOrder:1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:h,fragmentShader:l,uniforms:i,transparent:!1,side:Be},c.uuid)})}const Gi=new z(...en.dir).normalize(),Oi=en.col,Ni=new z(...ie(X.haze)),Di=new z(...ie(X.underHaze)),Hi=new z(...ie(X.abyss)),Ta=new z;function _i({quality:e="high",segments:o=200}){const n=w.useMemo(()=>{const a=o,s=new aa(Xo,Xo,a,a);s.rotateX(-Math.PI/2);const i=s.attributes.position,c=i.count,h=new Float32Array(c*3),l=new ze(X.rock),u=new ze(X.rockLit),b=new ze("#0b0e18"),m=new ze(X.snow),g=new ze(A.rockWarm),x=new ze;for(let f=0;f<c;f++){const p=i.getX(f)+pe.x,d=i.getZ(f)+pe.z,v=le(p,d);i.setX(f,p),i.setY(f,v),i.setZ(f,d);const j=ca(p,d,Xo/a)[1],S=Math.max(0,(j-.55)/.45);x.copy(l).lerp(u,R.clamp(v/190,0,1));const k=1-R.clamp((v-wi)/13,0,1);x.lerp(b,k*.85);const E=R.clamp((p-pe.x)/260,0,1),r=96-E*42,T=R.clamp((v-r)/60,0,1)*S;x.lerp(m,T*(.45+E*.5));const C=Math.hypot(p-F.x,d-F.z),P=Math.exp(-Math.pow(C/330,2)),M=R.clamp((d-F.z)/260,0,1);x.lerp(g,P*M*.6*(1-T)),h[f*3]=x.r,h[f*3+1]=x.g,h[f*3+2]=x.b}return s.setAttribute("color",new ee(h,3)),s.computeVertexNormals(),s.computeBoundingSphere(),s},[o]);return t.jsx("mesh",{geometry:n,receiveShadow:e!=="low",castShadow:!1,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.86,metalness:.02,flatShading:e==="low"})})}const ha=-30,da=330,Bi=150,ge={x:de.x,y:de.y-40,z:de.z-Bi-(ha+da)},Fe={centre:[0,96,ha],radii:[350,235,da]},Rt={x:ge.x+Fe.centre[0],y:ge.y+Fe.centre[1],z:ge.z+Fe.centre[2]};function Ui(e,o,n){const a=(e-Rt.x)/Fe.radii[0],s=(o-Rt.y)/Fe.radii[1],i=(n-Rt.z)/Fe.radii[2];return Math.sqrt(a*a+s*s+i*i)}function Dn(e,o=.06){const n=(e.x-Rt.x)/Fe.radii[0],a=(e.y-Rt.y)/Fe.radii[1],s=(e.z-Rt.z)/Fe.radii[2],i=Math.sqrt(n*n+a*a+s*s),c=1+o;if(i>=c)return null;const h=i<1e-4?0:c/i;return e.x=Rt.x+(h?n*h:0)*Fe.radii[0],e.y=Rt.y+(h?a*h:c)*Fe.radii[1],e.z=Rt.z+(h?s*h:0)*Fe.radii[2],e}const ce={y:0,halfX:290,zFront:228,zBack:-240},He={y:40,z:ha+da-40,halfX:96,depth:120},xt={zTop:He.z-54,zBottom:140,halfX:74,steps:16},N={z:-290,baseY:0,halfX:130,halfZ:76,plinth:34,storey:36,storeys:6,taper:.11},Ce={y:74,z:N.z+N.halfZ+26,halfX:96,depth:40},Ht=Ce.y+3.5,ot={y:-95,halfX:220,halfZ:175,ceiling:-34},Ae={x:0,z:84,halfX:52,halfZ:40},ke={y:52,halfZ:205,x:252,tiers:3,tierRise:46},Fo=[[96,46,340,40],[140,-64,300,34],[70,-150,240,26],[196,-8,220,28]],we={x:74,halfW:14,zFoot:N.z+N.halfZ+158,zTop:Ce.z+Ce.depth/2-6},nr=[{kind:"rampZ",x0:-74-we.halfW,x1:-74+we.halfW,z0:we.zFoot,z1:we.zTop,y0:0,y1:Ht},{kind:"rampZ",x0:we.x-we.halfW,x1:we.x+we.halfW,z0:we.zFoot,z1:we.zTop,y0:0,y1:Ht},{kind:"flat",x0:-96,x1:Ce.halfX,z0:Ce.z-Ce.depth/2-2,z1:we.zTop,y:Ht},{kind:"rampZ",x0:-290,x1:-214,z0:45,z1:-45,y0:0,y1:ke.y-.5},{kind:"flat",x0:-290,x1:-214,z0:-225,z1:-45,y:ke.y-.5},{kind:"flat",x0:ke.x-38,x1:ke.x+38,z0:-225,z1:ke.halfZ+20,y:ke.y-.5}],Wi=e=>e<=0?0:e>=1?1:e*e*(3-2*e),ar=(()=>{const e=[],o=[],n=[],a=N.halfX+6,s=[a,a+9],i=[a+11,a+20],c=[a,a+20],h=[-212,-200],l=[-264,-252],u=[Ht];for(let m=2;m<=N.storeys;m++)u.push(N.plinth+m*N.storey+1.5);e.push({kind:"flat",x0:Ce.halfX-6,x1:a+20,z0:-212,z1:-196,y:Ht}),o.push([(Ce.halfX-6+a+20)/2,Ht,-204,a+26-Ce.halfX,16]);for(let m=0;m<u.length-1;m++){const g=u[m],x=u[m+1],f=(g+x)/2;e.push({kind:"rampZ",x0:s[0],x1:s[1],z0:h[0],z1:l[1],y0:g,y1:f}),n.push({x0:s[0],x1:s[1],z0:h[0],z1:l[1],y0:g,y1:f}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:l[0],z1:l[1],y:f}),o.push([(c[0]+c[1])/2,f,(l[0]+l[1])/2,c[1]-c[0],l[1]-l[0]]),e.push({kind:"rampZ",x0:i[0],x1:i[1],z0:l[1],z1:h[0],y0:f,y1:x}),n.push({x0:i[0],x1:i[1],z0:l[1],z1:h[0],y0:f,y1:x}),e.push({kind:"flat",x0:c[0],x1:c[1],z0:h[0],z1:h[1],y:x}),o.push([(c[0]+c[1])/2,x,(h[0]+h[1])/2,c[1]-c[0],h[1]-h[0]])}for(let m=1;m<u.length-1;m++){const x=1-Math.min(N.storeys,m+2)*N.taper,f=N.halfX*x,p=N.z+N.halfZ*x,d=u[m];e.push({kind:"flat",x0:f-4,x1:a,z0:-224,z1:-212,y:d}),o.push([(f-4+a)/2,d,-218,a-f+4,12]),e.push({kind:"flat",x0:-f-6,x1:f+6,z0:p,z1:-212,y:d}),o.push([0,d,(p-212)/2,f*2+12,-212-p])}const b=u[u.length-1];return e.push({kind:"flat",x0:58,x1:a,z0:-248,z1:-212,y:b}),o.push([(a+58)/2,b,-230,a-58,36]),{walks:e,slabs:o,flights:n,tower:{x:[a,a+20],z:[l[0],h[1]]}}})();nr.push(...ar.walks);const Yi=1.1;function Vi(e,o,n=1/0){const a=n+Yi;let s=-1/0;for(const i of nr){if(e<i.x0||e>i.x1)continue;const c=Math.min(i.z0,i.z1),h=Math.max(i.z0,i.z1);if(o<c||o>h)continue;const l=i.kind==="flat"?i.y:i.y0+(i.y1-i.y0)*Wi((o-i.z0)/(i.z1-i.z0));l<=a&&l>s&&(s=l)}return s===-1/0?0:Math.max(0,s)}function $i(e,o,n=1/0){const a=o>xt.zTop?He.y:o>xt.zBottom?He.y*(o-xt.zBottom)/(xt.zTop-xt.zBottom):0,s=Vi(e,o,n);return Math.max(a,s)}function Ki(e,o,n){const a=N.plinth+N.storeys*N.storey;if(n>a)return!1;const i=1-(n<=N.plinth?0:Math.min(N.storeys,Math.ceil((n-N.plinth)/N.storey)))*N.taper;return Math.abs(e)<N.halfX*i&&Math.abs(o-N.z)<N.halfZ*i}const y={t:0,flash:0,flashDir:new z(0,.4,-1),fog:Bt.sea,rain:1,progress:0,shelter:0,inside:0,shot:0,underwater:0,depthBelow:0,whirlNear:0,subActive:!1,subPos:new z(0,0,0),helmActive:!1,helmPos:new z(0,0,0),helmSpeed:0,ship:{x:0,y:0,z:0,heading:Math.PI,loa:64,deckY:8.3,mastY:42},subThrottle:0,vessel:"sunny",footSpawn:"hall",splash:0,onRails:!0,orbit:{yaw:0,pitch:.12,dist:120,target:new z(0,60,-200)}};function Qi(){y.t=0,y.progress=0,y.flash=0,y.fog=Bt.sea,y.rain=1,y.shot=0,y.underwater=0,y.depthBelow=0,y.whirlNear=0,y.subActive=!1,y.subThrottle=0}const yn=new Map;let sr=!0;function Xi(e){sr=!!e}function Zi(e){const o=Io(e);return yn.has(o)||yn.set(o,fetch(o,{method:"HEAD"}).then(n=>n.ok?!(n.headers.get("content-type")||"").includes("text/html"):!1).catch(()=>!1)),yn.get(o)}function rt(e){const[o,n]=w.useState(!1);return w.useEffect(()=>{let a=!0;return Zi(e).then(s=>{a&&n(s&&sr)}),()=>{a=!1}},[e]),o}const At=Ro.map(e=>new z(...e).normalize()),rr=new z(...ra).normalize(),Hn=new z(...ia).normalize();function qi(e){let o=1;o+=Math.max(0,e.y)*.1,o-=Math.pow(Math.max(0,e.y),4)*.2;const n=Math.exp(-Math.pow((e.y-.52)/.16,2))*Math.max(0,e.z);o+=n*.13;for(const l of At){const u=e.dot(l),b=Math.pow(Math.max(0,u),46);o-=b*.3}const a=Math.max(0,e.dot(rr)),s=Math.pow(a,150)*(1-Math.max(0,e.y)*.5);o-=s*.19;for(const l of At){const u=new z(l.x*1.5,l.y-.55,l.z*.7).normalize().dot(e);o+=Math.pow(Math.max(0,u),26)*.075}const i=Math.max(0,e.dot(Hn));o-=Math.pow(i,30)*.11,o-=Math.pow(Math.max(0,-e.y),3)*.28;const c=Math.pow(Math.max(0,e.dot(At[0])),30)+Math.pow(Math.max(0,e.dot(At[1])),30),h=1-Math.min(1,c);return o+=(ho(e.x*3.1+7,e.z*3.1-3,3)-.5)*.085*h,o+=(ho(e.x*9.4-2,e.y*9.4+5,2)-.5)*.032*h,o}const Ji=178*1.9,at=F.r/Ji;function Ea(e,o){const n=e*at,a=[new z(n*74,96*at,-20*at),new z(n*142,176*at,-58*at),new z(n*196,268*at,-76*at),new z(n*222,356*at,-52*at),new z(n*206,424*at,8*at),new z(n*154,462*at,72*at)],s=new z;for(const b of a)s.set(F.x+b.x,F.baseY+b.y,F.z+b.z),Dn(s,.12)&&b.set(s.x-F.x,s.y-F.baseY,s.z-F.z);const i=new fo(a),c=o==="low"?14:o==="mid"?22:34,h=o==="low"?6:10,l=new mo(i,c,1,h,!1),u=l.attributes.position;for(let b=0;b<=c;b++){const m=b/c,g=34*at*Math.pow(1-m,.72)*(1+Math.sin(m*Math.PI)*.16),x=i.getPoint(m);for(let f=0;f<=h;f++){const p=b*(h+1)+f;if(p>=u.count)continue;const d=u.getX(p)-x.x,v=u.getY(p)-x.y,j=u.getZ(p)-x.z;u.setXYZ(p,x.x+d*g,x.y+v*g,x.z+j*g)}}return u.needsUpdate=!0,l.computeVertexNormals(),l}const el={low:4,mid:6,high:7},ir="skull-island.opt.glb",yo={height:1,yaw:0,lift:.02},vn=new ni,Ra=new z,Go=new z;function tl(e,o,n){Go.set(o[0],o[1],o[2]).normalize(),Ra.copy(Go).multiplyScalar(F.r*4),vn.set(Ra,Go.clone().negate()),vn.far=F.r*8;const a=vn.intersectObject(e,!0)[0];return a?a.point.clone().addScaledVector(Go,-n):null}function ol({shadows:e}){const{scene:o}=Zs(Io(ir)),{object:n,eyes:a,nose:s,mouth:i}=w.useMemo(()=>{const c=o.clone(!0),h=new qs().setFromObject(c),l=new z,u=new z;h.getSize(l),h.getCenter(u);const b=F.r*F.squash[1]*1.62,m=l.y>1e-4?b*yo.height/l.y:1,g=F.r*F.squash[1]*yo.lift;c.scale.setScalar(m),c.rotation.set(0,yo.yaw,0),c.position.set(0,-u.y*m+g,0);const x=u.x*m,f=u.z*m,p=Math.cos(yo.yaw),d=Math.sin(yo.yaw);c.position.x=-(x*p+f*d),c.position.z=-(-x*d+f*p),c.updateMatrixWorld(!0);let v=0,j=0;const S={x:0,y:0,z:0},k=new z,E=[];c.traverse(L=>{L.isMesh&&E.push(L)});for(const L of E){const W=L.geometry.clone();for(const O of["position","normal"]){const $=W.attributes[O];if(!$||$.array instanceof Float32Array)continue;const te=new Float32Array($.count*3);for(let se=0;se<$.count;se++)k.fromBufferAttribute($,se),te[se*3]=k.x,te[se*3+1]=k.y,te[se*3+2]=k.z;W.setAttribute(O,new ee(te,3))}W.applyMatrix4(L.matrixWorld);const K=W.attributes.position;j+=K.count;for(let O=0;O<K.count;O++)S.x=K.getX(O)+F.x,S.y=K.getY(O)+F.baseY,S.z=K.getZ(O)+F.z,Dn(S,.05)&&(K.setXYZ(O,S.x-F.x,S.y-F.baseY,S.z-F.z),v++);v&&W.computeVertexNormals(),K.needsUpdate=!0,W.computeBoundingSphere(),W.computeBoundingBox(),L.geometry=W,L.castShadow=e,L.receiveShadow=!1;const fe=Array.isArray(L.material)?L.material:[L.material];for(const O of fe)O.color?.multiply(nl),O.roughness=.94,O.metalness=.02}for(const L of[c,...E])L.position.set(0,0,0),L.quaternion.identity(),L.scale.set(1,1,1),L.updateMatrix();c.updateMatrixWorld(!0);const r=(L,W=1)=>{const[K,fe,O]=F.squash;return new z(L[0]*F.r*K*W,L[1]*F.r*fe*W,L[2]*F.r*O*W)},T=Ro.map(L=>tl(c,L,F.r*.1)??r(L,.82)),C=new z().addVectors(T[0],T[1]).multiplyScalar(.5),P=new z().addVectors(r(Ro[0],.82),r(Ro[1],.82)).multiplyScalar(.5),M=C.clone().sub(P),G=L=>{const W={x:L.x+F.x,y:L.y+F.baseY,z:L.z+F.z};return Dn(W,.22)&&L.set(W.x-F.x,W.y-F.baseY,W.z-F.z),L};return{object:c,eyes:T.map(G),nose:G(r(ra,.87).add(M)),mouth:G(r(ia,.9).add(M))}},[o,e]);return t.jsxs(t.Fragment,{children:[t.jsx("primitive",{object:n}),t.jsx(lr,{eyes:a,nose:s,mouth:i,teeth:null,cast:e})]})}const nl=new ze("#8f8a84");function lr({eyes:e,nose:o,mouth:n,teeth:a,cast:s}){const i=w.useRef(),c=w.useRef(),h=w.useRef();return ae(()=>{const l=y.t,u=.82+.18*Math.sin(l*2.3)*Math.sin(l*.71),b=.82+.18*Math.sin(l*1.9+2.1)*Math.sin(l*.63),m=.86+.14*Math.sin(l*1.4+.8);i.current&&(i.current.emissiveIntensity=5.2*u+y.flash*2),c.current&&(c.current.emissiveIntensity=5.2*b+y.flash*2),h.current&&(h.current.emissiveIntensity=3.4*m)}),t.jsxs(t.Fragment,{children:[e.map((l,u)=>t.jsxs("mesh",{position:l,rotation:[-.24,0,0],children:[t.jsx("sphereGeometry",{args:[F.r*.108,20,14,0,Math.PI*2,0,Math.PI*.5]}),t.jsx("meshStandardMaterial",{ref:u===0?i:c,color:A.furnace,emissive:A.ember,emissiveIntensity:5.2,toneMapped:!1,side:Be,roughness:1})]},u)),t.jsxs("mesh",{position:o,rotation:[Math.PI*.54,0,0],children:[t.jsx("coneGeometry",{args:[F.r*.046,F.r*.083,3]}),t.jsx("meshStandardMaterial",{color:A.emberDeep,emissive:A.emberDeep,emissiveIntensity:2.4,toneMapped:!1})]}),t.jsxs("group",{position:n,children:[t.jsxs("mesh",{position:[0,F.r*.05,-F.r*.16],children:[t.jsx("planeGeometry",{args:[F.r*.62,F.r*.34]}),t.jsx("meshStandardMaterial",{ref:h,color:A.ember,emissive:A.emberDeep,emissiveIntensity:3.4,toneMapped:!1,side:Be})]}),a?.map((l,u)=>t.jsxs("mesh",{position:l.pos,scale:l.scale,rotation:[0,0,l.rot],castShadow:s,children:[t.jsx("boxGeometry",{args:[1,1,1]}),t.jsx("meshStandardMaterial",{color:"#e6d9bc",emissive:A.emberDeep,emissiveIntensity:.42,roughness:.78})]},u))]})]})}const al=typeof location<"u"?new URLSearchParams(location.search).get("skull"):null;function sl({quality:e="high",shadows:o=!0}){const a=rt(ir)&&e!=="low"&&al!=="proc",{dome:s,hornL:i,hornR:c,teeth:h}=w.useMemo(()=>{const x=new ti(F.r,el[e]??7),f=x.attributes.position,p=new Float32Array(f.count*3),d=new ze(X.rock),v=new ze(A.rockWarm),j=new ze("#120b10"),S=new ze,k=new z;for(let C=0;C<f.count;C++){k.set(f.getX(C),f.getY(C),f.getZ(C)).normalize();const P=F.r*qi(k),[M,G,L]=F.squash;f.setXYZ(C,k.x*P*M,k.y*P*G,k.z*P*L);const W=Math.max(Math.pow(Math.max(0,k.dot(At[0])),5),Math.pow(Math.max(0,k.dot(At[1])),5),Math.pow(Math.max(0,k.dot(Hn)),6)*.9);S.copy(d).lerp(v,Math.min(1,W*1.5+Math.max(0,k.z)*.22));const K=Math.max(Math.pow(Math.max(0,k.dot(At[0])),40),Math.pow(Math.max(0,k.dot(At[1])),40));S.lerp(j,K),p[C*3]=S.r,p[C*3+1]=S.g,p[C*3+2]=S.b}x.setAttribute("color",new ee(p,3)),x.computeVertexNormals();const E=new oi(1,1,1),r=[],T=9;for(let C=0;C<T;C++){const P=C/(T-1)*2-1,M=de.halfWidth*2.1,G=P*M*.5,L=Math.pow(Math.abs(P),1.7)*14,W=46-Math.abs(P)*13+C%2*7;r.push({pos:[G,de.height*.5-L-W*.5,6],scale:[M/T*.76,W,52],rot:P*.13})}return E.dispose?.(),{dome:x,hornL:Ea(-1,e),hornR:Ea(1,e),teeth:r}},[e]),l=o,[u,b,m]=F.squash,g=(x,f)=>[x.x*F.r*u*f,x.y*F.r*b*f,x.z*F.r*m*f];return t.jsx("group",{position:[F.x,F.baseY,F.z],children:a?t.jsx(w.Suspense,{fallback:t.jsx(Aa,{dome:s,hornL:i,hornR:c,cast:l}),children:t.jsx(ol,{shadows:l})}):t.jsxs(t.Fragment,{children:[t.jsx(Aa,{dome:s,hornL:i,hornR:c,cast:l}),t.jsx(lr,{eyes:At.map(x=>g(x,.82)),nose:g(rr,.87),mouth:g(Hn,.96),teeth:h,cast:l})]})})}function Aa({dome:e,hornL:o,hornR:n,cast:a}){return t.jsxs(t.Fragment,{children:[t.jsx("mesh",{geometry:e,castShadow:a,receiveShadow:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,roughness:.92,metalness:.03})}),t.jsx("mesh",{geometry:o,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})}),t.jsx("mesh",{geometry:n,castShadow:a,children:t.jsx("meshStandardMaterial",{color:"#241d28",roughness:.55,metalness:.12})})]})}function vt({matrices:e,target:o}){const n=w.useRef(!1);return ae(()=>{if(n.current||!o.current)return;const a=Math.min(e.length,o.current.count);for(let s=0;s<a;s++)o.current.setMatrixAt(s,e[s]);o.current.instanceMatrix.needsUpdate=!0,o.current.computeBoundingSphere(),n.current=!0}),null}const to=190,St=130,Oo=9.5;function Ia(e,o,n,a=24){const s=new fo(e),i=new mo(s,a,1,4,!1),c=i.attributes.position,h=new z(0,1,0),l=new z,u=new z,b=new z,m=new z,g=new z;for(let x=0;x<=a;x++){const f=x/a;s.getPointAt(f,u),s.getTangentAt(f,l),m.crossVectors(l,h).normalize(),b.crossVectors(m,l).normalize();for(let p=0;p<=4;p++){const d=x*5+p;if(d>=c.count)continue;const v=p/4*Math.PI*2+Math.PI/4,j=Math.cos(v)*o*.7071,S=Math.sin(v)*n*.7071;g.copy(u).addScaledVector(m,j).addScaledVector(b,S),c.setXYZ(d,g.x,g.y,g.z)}}return c.needsUpdate=!0,i.computeVertexNormals(),i}function rl(e,o,n,a=40){const s=[];for(let l=0;l<=10;l++){const u=l/10*2-1;s.push(new z(u*e,-30*(1-u*u),0))}const i=new fo(s),c=new mo(i,a,n,8,!1),h=c.attributes.position;for(let l=0;l<=a;l++){const u=l/a*2-1,b=1+(1-u*u)*.85,m=i.getPointAt(l/a);for(let g=0;g<=8;g++){const x=l*9+g;x>=h.count||h.setXYZ(x,m.x+(h.getX(x)-m.x)*b,m.y+(h.getY(x)-m.y)*b,m.z+(h.getZ(x)-m.z)*b)}}return h.needsUpdate=!0,c.computeVertexNormals(),c}const cr=.76;function Ca({quality:e="high",shadows:o=!0,z:n=Ut,k:a=H*cr}){const s=w.useRef(),i=w.useRef(),c=w.useRef(),h=w.useRef(),l=w.useMemo(()=>{const p=to/2,d=St,v=Ia([new z(-p-40,d+6,0),new z(-p-22,d+15.5,0),new z(0,d+20,0),new z(p+22,d+15.5,0),new z(p+40,d+6,0)],16,9,30),j=Ia([new z(-p-30,d+2,0),new z(0,d+8,0),new z(p+30,d+2,0)],11,5,18);return{kasagi:v,shimaki:j,rope:rl(p-6,30,6.4,44)}},[]),{tileM:u,merlonM:b,cannonM:m,lanternM:g}=w.useMemo(()=>{const p=new pt,d=new kt,v=new z,j=new z,S=[],k=e==="low"?26:54;for(let P=0;P<k;P++){const M=P/(k-1)*2-1,G=M*(to/2+40),L=St+20-Math.pow(Math.abs(M),1.9)*14+5,W=-Math.sign(M)*Math.pow(Math.abs(M),3)*.5;j.set(G,L,0),d.setFromEuler(new $t(0,0,W)),v.set(1,1,1),S.push(p.clone().compose(j,d,v))}const E=[];for(const P of[-1,1])for(let M=0;M<7;M++)j.set(P*(58+M*12),26,0),d.identity(),v.set(1,1,1),E.push(p.clone().compose(j,d,v));const r=[];for(const P of[-1,1])for(let M=0;M<2;M++)for(let G=0;G<4-M;G++)j.set(P*(64+G*13+M*6),32+M*10,8),d.setFromEuler(new $t(Math.PI/2-.16,0,0)),v.set(1,1,1),r.push(p.clone().compose(j,d,v));const T=[],C=e==="low"?10:22;for(let P=0;P<C;P++){const M=P/(C-1)*2-1,G=M*(to/2-12),L=30*(1-M*M);j.set(G,St-34-L-7.5,0),d.identity(),v.set(1,1,1),T.push(p.clone().compose(j,d,v))}return{tileM:S,merlonM:E,cannonM:r,lanternM:T}},[e]);ae(()=>{const p=y.t;s.current&&(s.current.material.emissiveIntensity=2.6+Math.sin(p*3.1)*.22+Math.sin(p*7.7)*.1+y.flash*1.4)});const x=to/2,f=o;return t.jsxs("group",{position:[0,0,n],scale:a,children:[[-1,1].map(p=>t.jsxs("group",{position:[p*x,0,0],children:[t.jsxs("mesh",{position:[0,St/2-30,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[Oo*.86,Oo,St+60,14]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsxs("mesh",{position:[0,6,0],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[Oo*1.5,Oo*1.85,20,14]}),t.jsx("meshStandardMaterial",{color:"#3b3547",roughness:.94})]})]},p)),t.jsxs("mesh",{position:[0,St-26,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[to+56,12,13]}),t.jsx("meshStandardMaterial",{color:"#6d4d86",roughness:.72})]}),t.jsx("mesh",{geometry:l.shimaki,castShadow:f,children:t.jsx("meshStandardMaterial",{color:"#5c3f72",roughness:.76})}),t.jsx("mesh",{geometry:l.kasagi,castShadow:f,children:t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.68})}),t.jsxs("instancedMesh",{ref:i,args:[null,null,u.length],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,9.5,6,1,!1,0,Math.PI]}),t.jsx("meshStandardMaterial",{color:"#8c2a1c",roughness:.6}),t.jsx(vt,{matrices:u,target:i})]}),t.jsxs("mesh",{position:[0,St-6,0],castShadow:f,children:[t.jsx("boxGeometry",{args:[13,30,9]}),t.jsx("meshStandardMaterial",{color:"#4b3560",roughness:.8})]}),t.jsxs("mesh",{position:[0,St-6,5.2],children:[t.jsx("planeGeometry",{args:[17,24]}),t.jsx("meshStandardMaterial",{color:"#2f4438",emissive:"#1d3326",emissiveIntensity:.5,roughness:.9})]}),t.jsx("mesh",{geometry:l.rope,position:[0,St-34,2],castShadow:f,children:t.jsx("meshStandardMaterial",{color:"#cdc5b2",emissive:"#6a6053",emissiveIntensity:.55,roughness:.97})}),[-52,-18,18,52].map(p=>{const d=30*(1-(p/(to/2-6))**2);return t.jsx("group",{position:[p,St-34-d-4,2],children:[0,1,2].map(v=>t.jsxs("mesh",{position:[v%2?1.1:-1.1,-2.4-v*3.6,0],children:[t.jsx("boxGeometry",{args:[3.4,3.4,.35]}),t.jsx("meshStandardMaterial",{color:"#efece2",emissive:"#cfc9b8",emissiveIntensity:.5,roughness:1,side:Be})]},v))},p)}),[-1,1].map(p=>t.jsxs("group",{children:[t.jsxs("mesh",{position:[p*108,6,0],castShadow:f,receiveShadow:f,children:[t.jsx("boxGeometry",{args:[126,44,62]}),t.jsx("meshStandardMaterial",{color:"#39404f",roughness:.95})]}),t.jsxs("mesh",{position:[p*108,30,6],castShadow:f,children:[t.jsx("boxGeometry",{args:[118,12,44]}),t.jsx("meshStandardMaterial",{color:A.timber,roughness:.88})]}),t.jsxs("mesh",{position:[p*162,44,10],children:[t.jsx("boxGeometry",{args:[9,13,9]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.4,toneMapped:!1})]})]},p)),t.jsxs("instancedMesh",{ref:h,args:[null,null,b.length],castShadow:f,children:[t.jsx("boxGeometry",{args:[8,11,44]}),t.jsx("meshStandardMaterial",{color:"#2f3542",roughness:.95}),t.jsx(vt,{matrices:b,target:h})]}),t.jsxs("instancedMesh",{ref:c,args:[null,null,m.length],castShadow:f,children:[t.jsx("cylinderGeometry",{args:[3.4,4.4,30,10]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.42,metalness:.75}),t.jsx(vt,{matrices:m,target:c})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,g.length],children:[t.jsx("cylinderGeometry",{args:[3.6,3.6,6.4,8]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(vt,{matrices:g,target:s})]})]})}const il=(()=>{if(typeof document>"u")return null;const e=128,o=document.createElement("canvas");o.width=o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,0,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.12,"rgba(255,255,255,0.55)"),a.addColorStop(.4,"rgba(255,255,255,0.06)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e),n.translate(e/2,e/2);for(let i=0;i<4;i++){const c=n.createLinearGradient(0,0,e/2,0);c.addColorStop(0,"rgba(255,255,255,0.95)"),c.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=c,n.beginPath(),n.moveTo(0,-2.5),n.lineTo(e/2,0),n.lineTo(0,2.5),n.closePath(),n.fill(),n.rotate(Math.PI/2)}const s=new Xt(o);return s.colorSpace=go,s})();function ll(e,o,n,a){const s=[];for(let i=0;i<=a;i++){const c=i/a,h=c*2-1;s.push(new z(e[0]+(o[0]-e[0])*c,e[1]+(o[1]-e[1])*c-n*(1-h*h),e[2]+(o[2]-e[2])*c))}return s}const cl=[[[-62,34,26],[-6,42,-12],14],[[-6,42,-12],[52,32,18],13],[[-46,28,-30],[18,36,-40],11],[[18,36,-40],[68,26,-20],11],[[-70,22,-4],[-16,30,36],10],[[16,30,40],[72,22,12],10],[[-36,48,-62],[34,50,-66],14]];function hl({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useRef(),i=w.useRef(),{lanternM:c,lampM:h,pilingM:l,katanaY:u,ground:b}=w.useMemo(()=>{const x=new pt,f=new kt,p=new z(1,1,1),d=new z,v=[],j=e==="low"?.42:e==="mid"?.72:1;for(const[r,T,C]of cl){const P=Math.max(4,Math.round(C*j)),M=ll(r,T,14,P);for(let G=1;G<M.length-1;G++){const L=.78+G*37%11/22;d.copy(M[G]).add(new z(0,-4.2*L,0)),f.setFromEuler(new $t(0,G*1.7%Math.PI,(G%3-1)*.06)),v.push(x.clone().compose(d,f,p.clone().multiplyScalar(L)))}}const S=[],k=e==="low"?6:11;for(let r=0;r<k;r++){const T=r/(k-1);for(const C of[-1,1]){const P=R.lerp(Q.x+46,de.x-6,T)+C*(26-T*9),M=R.lerp(Q.z-26,de.z+32,T);d.set(P,le(P,M)+5,M),f.identity(),S.push(x.clone().compose(d,f,p))}}const E=[];for(let r=0;r<16;r++){const T=r%2,C=Math.floor(r/2);d.set(Q.x+30+C*17,-2,Q.z+34+T*26),f.setFromEuler(new $t(0,0,(r%3-1)*.035)),E.push(x.clone().compose(d,f,p))}return{lanternM:v,lampM:S,pilingM:E,katanaY:le(Q.x+118,Q.z-58),ground:Q.y}},[e]);ae(()=>{const x=y.t;if(n.current&&(n.current.material.emissiveIntensity=2.4+Math.sin(x*2.7)*.2+Math.sin(x*6.1+1.3)*.12+y.flash*1.6),i.current){const f=46*(1+Math.sin(x*1.3)*.13);i.current.scale.set(f,f,1),i.current.material.rotation=x*.07}});const m=o,g=(x,f)=>le(Q.x+x,Q.z+f);return t.jsxs("group",{children:[t.jsxs("group",{position:[Q.x,0,Q.z],children:[t.jsxs("mesh",{position:[85,7.5,47],castShadow:m,receiveShadow:m,children:[t.jsx("boxGeometry",{args:[128,3,60]}),t.jsx("meshStandardMaterial",{color:A.timber,roughness:.92})]}),t.jsxs("mesh",{position:[18,7,4],receiveShadow:m,children:[t.jsx("boxGeometry",{args:[96,2.4,82]}),t.jsx("meshStandardMaterial",{color:"#5a4230",roughness:.94})]}),[0,1,2,3].map(x=>t.jsxs("group",{position:[52+x*26,1.5,92+x%2*13],rotation:[0,.4+x*.3,0],children:[t.jsxs("mesh",{castShadow:m,children:[t.jsx("boxGeometry",{args:[18,5,6.5]}),t.jsx("meshStandardMaterial",{color:"#4a3524",roughness:.9})]}),t.jsxs("mesh",{position:[0,9,0],children:[t.jsx("boxGeometry",{args:[.7,14,.7]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[1.5,12,0],children:[t.jsx("planeGeometry",{args:[9,11]}),t.jsx("meshStandardMaterial",{color:"#cbbfa4",roughness:1,side:Be})]})]},x))]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,l.length],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[1.8,2.1,22,7]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.95}),t.jsx(vt,{matrices:l,target:s})]}),t.jsxs("group",{position:[Q.x+118,u,Q.z-58],rotation:[0,.5,.34],scale:.6,children:[t.jsxs("mesh",{position:[0,52,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[7,132,2.1]}),t.jsx("meshStandardMaterial",{color:"#cfd8e2",roughness:.16,metalness:.92})]}),t.jsxs("mesh",{position:[0,116,0],rotation:[Math.PI/2,0,0],castShadow:m,children:[t.jsx("torusGeometry",{args:[9,2.4,6,18]}),t.jsx("meshStandardMaterial",{color:"#2a2118",roughness:.4,metalness:.75})]}),t.jsxs("mesh",{position:[0,138,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[4.4,4.9,42,10]}),t.jsx("meshStandardMaterial",{color:"#20232b",roughness:.85})]}),t.jsxs("mesh",{position:[0,161,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[5.2,5.2,5,10]}),t.jsx("meshStandardMaterial",{color:"#8a7a4e",roughness:.5,metalness:.6})]}),t.jsx("sprite",{ref:i,position:[0,116,0],scale:[46,46,1],children:t.jsx("spriteMaterial",{map:il,color:A.furnace,transparent:!0,opacity:.75,blending:it,depthWrite:!1,toneMapped:!1})})]}),[-1,1].map(x=>{const f=96+x*4,p=88*x;return t.jsxs("group",{position:[Q.x+f,g(f,p),Q.z+p],rotation:[0,-x*.5,0],children:[t.jsxs("mesh",{position:[0,7,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[13,14,13]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,21,1],rotation:[.22,0,0],castShadow:m,children:[t.jsx("capsuleGeometry",{args:[5,12,4,8]}),t.jsx("meshStandardMaterial",{color:"#c9c4b4",roughness:.86})]}),t.jsxs("mesh",{position:[0,32,5],castShadow:m,children:[t.jsx("sphereGeometry",{args:[5.4,12,10]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*3,37,4],rotation:[0,0,d*.3],castShadow:m,children:[t.jsx("coneGeometry",{args:[2.1,6.5,4]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]},d)),t.jsxs("mesh",{position:[0,26,-8],rotation:[-.7,0,0],castShadow:m,children:[t.jsx("coneGeometry",{args:[4,20,6]}),t.jsx("meshStandardMaterial",{color:"#cfcabb",roughness:.86})]}),t.jsxs("mesh",{position:[0,26,6.4],rotation:[.3,0,0],children:[t.jsx("planeGeometry",{args:[9,8]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.9,side:Be})]})]},x)}),[-1,1].map(x=>{const f=40+x*34,p=-18+x*46;return t.jsxs("group",{position:[Q.x+f,g(f,p)+12,Q.z+p],rotation:[0,x*.8,0],children:[t.jsxs("mesh",{castShadow:m,children:[t.jsx("sphereGeometry",{args:[9,12,10]}),t.jsx("meshStandardMaterial",{color:"#7c6a52",roughness:.9})]}),[-1,1].map(d=>t.jsxs("mesh",{position:[d*5,7,-1],rotation:[0,0,d*-.5],castShadow:m,children:[t.jsx("coneGeometry",{args:[1.8,8,5]}),t.jsx("meshStandardMaterial",{color:"#4c4038",roughness:.85})]},d)),t.jsxs("mesh",{position:[0,-1,8],children:[t.jsx("sphereGeometry",{args:[4.2,10,8]}),t.jsx("meshStandardMaterial",{color:A.ember,emissive:A.ember,emissiveIntensity:2.2,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,-8,13],rotation:[.4,0,0],children:[t.jsx("cylinderGeometry",{args:[1.5,2.6,20,6,1,!0]}),t.jsx("meshStandardMaterial",{color:"#cfe4ee",transparent:!0,opacity:.42,roughness:.25,side:Be})]})]},x)}),t.jsxs("group",{position:[Q.x-34,g(-34,30)+2,Q.z+30],children:[t.jsxs("mesh",{position:[0,30,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[1.1,1.4,60,8]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.92})]}),t.jsxs("mesh",{position:[0,58,0],castShadow:m,children:[t.jsx("coneGeometry",{args:[34,17,20,1,!0]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.88,side:Be,emissive:A.vermilionDeep,emissiveIntensity:.4})]}),Array.from({length:10},(x,f)=>{const p=f/10*Math.PI*2;return t.jsxs("mesh",{position:[Math.cos(p)*26,55.5,Math.sin(p)*26],rotation:[0,-p,-.42],children:[t.jsx("boxGeometry",{args:[34,.6,.6]}),t.jsx("meshStandardMaterial",{color:"#2a1c12",roughness:.9})]},f)}),Array.from({length:10},(x,f)=>{const p=f/10*Math.PI*2+.31;return t.jsxs("mesh",{position:[Math.cos(p)*32,44,Math.sin(p)*32],children:[t.jsx("cylinderGeometry",{args:[2.6,2.6,4.6,8]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.5,toneMapped:!1})]},f)})]}),[0,1,2,3].map(x=>{const f=8+x*30,p=-70-x%2*14;return t.jsxs("group",{position:[Q.x+f,g(f,p),Q.z+p],children:[t.jsxs("mesh",{position:[0,26,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[.6,.6,52,6]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.9})]}),t.jsxs("mesh",{position:[5,34,0],children:[t.jsx("planeGeometry",{args:[10,34]}),t.jsx("meshStandardMaterial",{color:x%2?"#e8dcc4":A.vermilion,roughness:.95,side:Be})]})]},x)}),[0,1,2].map(x=>{const f=.28+x*.24,p=R.lerp(Q.x+46,de.x,f),d=R.lerp(Q.z-26,de.z+26,f),v=le(p,d),j=1-x*.1;return t.jsxs("group",{position:[p,v,d],scale:j,children:[[-1,1].map(S=>t.jsxs("mesh",{position:[S*15,17,0],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[1.7,2.1,34,10]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.7})]},S)),t.jsxs("mesh",{position:[0,36,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[44,3.4,4]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.68})]}),t.jsxs("mesh",{position:[0,29,0],castShadow:m,children:[t.jsx("boxGeometry",{args:[36,2.4,3]}),t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.75})]})]},x)}),t.jsx("group",{position:[Q.x,b,Q.z],children:t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("cylinderGeometry",{args:[3.1,3.1,5.6,8]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.4,toneMapped:!1}),t.jsx(vt,{matrices:c,target:n})]})}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:m,children:[t.jsx("boxGeometry",{args:[6,12,6]}),t.jsx("meshStandardMaterial",{color:"#6c6458",emissive:A.lanternFar,emissiveIntensity:1.1,roughness:.95}),t.jsx(vt,{matrices:h,target:a})]})]})}const Pa={low:{pine:150,sakura:90,rock:60},mid:{pine:340,sakura:190,rock:130},high:{pine:620,sakura:340,rock:240}};function dl(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function ul({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useRef(),i=w.useRef(),{pineTrunkM:c,pineCanopyM:h,sakuraM:l,rockM:u}=w.useMemo(()=>{const m=Pa[e]??Pa.high,g=dl(20250801),x=new pt,f=new kt,p=new z,d=new z,v=new z(0,1,0),j=new z,S=[],k=[],E=[],r=m.pine+m.sakura+m.rock;let T=0,C=0;for(;T<r&&C<r*60;){C++;const P=g()*Math.PI*2,M=Mt*(.55+g()*.62),G=pe.x+Math.sin(P)*M,L=pe.z+Math.cos(P)*M,W=le(G,L);if(W<5||W>300||ki(G,L,6)>.72||Math.hypot(G-F.x,L-F.z)<F.r*1.35)continue;const K=G>pe.x+(g()-.5)*90,fe=T;if(T++,d.set(G,W,L),fe<m.rock){const O=ca(G,L,5);j.set(O[0],O[1],O[2]),f.setFromUnitVectors(v,j),f.multiply(new kt().setFromEuler(new $t(g()*.5,g()*6.28,g()*.5)));const $=2.5+g()*7;p.set($*(.7+g()*.6),$*(.5+g()*.5),$*(.7+g()*.6)),d.y-=$*.25,E.push(x.clone().compose(d,f,p))}else if(K){if(S.length>=m.pine)continue;f.setFromEuler(new $t(0,g()*6.28,(g()-.5)*.09));const O=.72+g()*.7;p.set(O,O*(.85+g()*.45),O),S.push(x.clone().compose(d,f,p))}else{if(k.length>=m.sakura)continue;f.setFromEuler(new $t(0,g()*6.28,(g()-.5)*.13));const O=.7+g()*.75;p.set(O,O*(.8+g()*.5),O),k.push(x.clone().compose(d,f,p))}}return{pineTrunkM:S.map(P=>P.clone().multiply(pl)).concat(k.map(P=>P.clone().multiply(gl))),pineCanopyM:S.map(P=>P.clone().multiply(fl)),sakuraM:k.map(P=>P.clone().multiply(ml)),rockM:E}},[e]),b=o;return t.jsxs(t.Fragment,{children:[t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],castShadow:b,children:[t.jsx("cylinderGeometry",{args:[.9,1.7,14,5]}),t.jsx("meshStandardMaterial",{color:"#1d1a1c",roughness:.96}),t.jsx(vt,{matrices:c,target:n})]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,h.length],castShadow:b,children:[t.jsx("coneGeometry",{args:[8.5,30,7]}),t.jsx("meshStandardMaterial",{color:X.pine,roughness:.93,flatShading:!0}),t.jsx(vt,{matrices:h,target:a})]}),t.jsxs("instancedMesh",{ref:s,args:[null,null,l.length],castShadow:b,children:[t.jsx("sphereGeometry",{args:[7.5,8,6]}),t.jsx("meshStandardMaterial",{color:A.sakura,roughness:.95,flatShading:!0,emissive:A.sakura,emissiveIntensity:.1}),t.jsx(vt,{matrices:l,target:s})]}),t.jsxs("instancedMesh",{ref:i,args:[null,null,u.length],castShadow:b,receiveShadow:b,children:[t.jsx("dodecahedronGeometry",{args:[1,0]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.97,flatShading:!0}),t.jsx(vt,{matrices:u,target:i})]})]})}const pl=new pt().makeTranslation(0,7,0),fl=new pt().makeTranslation(0,26,0),ml=new pt().compose(new z(0,13,0),new kt,new z(1,.72,1)),gl=new pt().compose(new z(0,5,0),new kt,new z(.75,.62,.75)),Et=Math.PI,La={"ship-sunny.opt.glb":Et/2,"ship-tang.opt.glb":Et/2,"ship-punk.opt.glb":Et/2,"ship-lion.opt.glb":Et/2,"ship-bone.opt.glb":Et/2,"ship-junk.opt.glb":Et/2,"ship-warjunk.opt.glb":Et/2,"ship-sub.opt.glb":-Et/2},gn=e=>e&&La[e]!==void 0?La[e]:Et/2,xl={"ship-sunny.opt.glb":40,"ship-lion.opt.glb":40,"ship-punk.opt.glb":52,"ship-tang.opt.glb":32,"ship-sub.opt.glb":32,"ship-bone.opt.glb":50,"ship-junk.opt.glb":38,"ship-warjunk.opt.glb":60},xo=1.9,Fa=Object.fromEntries(Object.entries(xl).map(([e,o])=>[e,Math.round(o*xo)])),Ga={"ship-sunny.opt.glb":.6,"ship-lion.opt.glb":.8,"ship-punk.opt.glb":.62,"ship-tang.opt.glb":.62,"ship-sub.opt.glb":.72,"ship-bone.opt.glb":.72,"ship-junk.opt.glb":.53,"ship-warjunk.opt.glb":.6},xn=2,Oa={"ship-sunny.opt.glb":.513,"ship-lion.opt.glb":.274,"ship-punk.opt.glb":.264,"ship-tang.opt.glb":.208,"ship-sub.opt.glb":.261,"ship-bone.opt.glb":.353,"ship-junk.opt.glb":.313,"ship-warjunk.opt.glb":.415},Na={"ship-sunny.opt.glb":1.044,"ship-lion.opt.glb":.824,"ship-punk.opt.glb":.673,"ship-tang.opt.glb":1,"ship-sub.opt.glb":.641,"ship-bone.opt.glb":.771,"ship-junk.opt.glb":.915,"ship-warjunk.opt.glb":.702},Da={"ship-sunny.opt.glb":.165,"ship-lion.opt.glb":.095,"ship-punk.opt.glb":.115,"ship-bone.opt.glb":.105,"ship-junk.opt.glb":.1,"ship-warjunk.opt.glb":.115,"ship-tang.opt.glb":.035,"ship-sub.opt.glb":.035},Ha={"ship-sunny.opt.glb":.28,"ship-lion.opt.glb":.144,"ship-punk.opt.glb":.148,"ship-tang.opt.glb":.41,"ship-sub.opt.glb":.214,"ship-bone.opt.glb":.158,"ship-junk.opt.glb":.21,"ship-warjunk.opt.glb":.244},hr=(e,o)=>(e&&Ha[e]!==void 0?Ha[e]:.2)*o/2,dr={"ship-sunny.opt.glb":[.047,.057,.057,.107,.154,.154,.113,.079,.079],"ship-lion.opt.glb":[.076,.109,.104,.098,.103,.082,.051,.017,.017],"ship-punk.opt.glb":[.073,.073,.078,.078,.079,.081,.066,.057,.057],"ship-tang.opt.glb":[.069,.089,.097,.108,.227,.227,.155,.157,.157],"ship-sub.opt.glb":[.105,.12,.16,.161,.171,.179,.145,.144,.144],"ship-bone.opt.glb":[.087,.134,.116,.116,.12,.12,.107,.107,.107],"ship-junk.opt.glb":[.065,.086,.108,.124,.141,.141,.086,.043,.043],"ship-warjunk.opt.glb":[.071,.071,.071,.123,.064,.117,.108,.018,.018]},ur=(e,o,n)=>{const a=e&&dr[e]||null;if(!a)return hr(e,o);const s=Math.min(.9999,Math.max(0,n+.5))*(a.length-1),i=Math.floor(s);return(a[i]+(a[i+1]-a[i])*(s-i))*o},_a={"ship-sunny.opt.glb":-.061,"ship-lion.opt.glb":-.206,"ship-punk.opt.glb":-.09,"ship-tang.opt.glb":.192,"ship-sub.opt.glb":-.05,"ship-bone.opt.glb":-.064,"ship-junk.opt.glb":.093,"ship-warjunk.opt.glb":-.044},bl=(e,o)=>(e&&_a[e]!==void 0?_a[e]:0)*o,pr=(e,o)=>{const n=e&&dr[e]||null;if(!n)return o;const a=Math.max(...n)*.35,s=n.length,i=h=>-.5+h/(s-1),c=Math.round((o+.5)*(s-1));for(let h=0;h<s;h++)for(const l of[c-h,c+h])if(!(l<0||l>=s||n[l]<a))return h===0?o:i(l);return 0},Zo=[[0,.25,0],[-.5,0,.7],[.5,-.125,-.9],[0,-.25,Math.PI*.85]],ua=(e,o,[n,a])=>{const s=pr(e,a);return[n*ur(e,o,s),s*o]},fr=e=>e==="low"?Zo.slice(0,1):e==="mid"?Zo.slice(0,2):Zo,dt=["ship-tang.opt.glb","ship-sub.opt.glb"],mr=[{what:"flag",mast:.9,onMast:!0,r:.03,deep:.5},{what:"lantern port",kind:"lantern",except:dt,beam:-.6,deck:!0,up:.012,z:-.125,r:.008},{what:"lantern stbd",kind:"lantern",except:dt,beam:.6,deck:!0,up:.012,z:-.125,r:.008},{what:"lantern bow",kind:"lantern",close:!0,except:dt,beam:0,deck:!0,up:.014,z:.25,r:.008},{what:"lantern waist port",kind:"lantern",close:!0,except:dt,beam:-.62,deck:!0,up:.012,z:0,r:.008},{what:"lantern waist stbd",kind:"lantern",close:!0,except:dt,beam:.62,deck:!0,up:.012,z:0,r:.008},{what:"casing lamp fwd",kind:"lantern",only:dt,beam:0,deck:!0,up:.03,z:.32,r:.008},{what:"casing lamp port fwd",kind:"lantern",only:dt,beam:-.88,deck:!0,up:.006,z:.12,r:.008},{what:"casing lamp stbd fwd",kind:"lantern",only:dt,beam:.88,deck:!0,up:.006,z:.12,r:.008},{what:"casing lamp port aft",kind:"lantern",only:dt,beam:-.88,deck:!0,up:.006,z:-.16,r:.008},{what:"casing lamp stbd aft",kind:"lantern",only:dt,beam:.88,deck:!0,up:.006,z:-.16,r:.008},{what:"headlamp",only:dt,beam:0,deck:!0,up:-.012,z:.4,r:.028,snap:!1},{what:"stern lamp",only:dt,beam:0,deck:!0,up:.016,z:-.3,r:.016,snap:!1},{what:"screw",only:dt,beam:0,deck:!0,up:-.012,z:-.39,r:.022,snap:!1,deep:.12}],wl=e=>mr.filter(o=>(!o.only||o.only.includes(e))&&!(o.except&&o.except.includes(e))),pa=(e,o=!1)=>wl(e).filter(n=>n.kind==="lantern"&&(o||!n.close)),Ct=(e,o,n)=>{const a=n.onMast?bl(e,o)/o:n.snap===!1?n.z??0:pr(e,n.z??0);return[(n.beam??0)*ur(e,o,a),n.deck?Qt(e,o)+(n.up??0)*o:(n.mast??0)*yr(e,o),a*o]},io=e=>mr.find(o=>o.what===e),yl={"ship-sunny.opt.glb":!0,"ship-punk.opt.glb":!0,"ship-tang.opt.glb":!0},gr=e=>!!(e&&yl[e]),vl=2.8,xr=vl*xo,sn=e=>xr*(.72+.28*(e/(40*xo))),br=.28*xo,rn=5.2*xo,Ba={"ship-sunny.opt.glb":"#e6ded0","ship-punk.opt.glb":"#c9bfae","ship-tang.opt.glb":"#ece3cd","ship-lion.opt.glb":"#9a9188","ship-sub.opt.glb":"#9a9188","ship-bone.opt.glb":"#9a9188"},fa=(e,o="#9a9188")=>e&&Ba[e]!==void 0?Ba[e]:o,Ml={"ship-tang.opt.glb":["#e8c34a",1.15],"ship-sub.opt.glb":["#e8c34a",1.15],"ship-sunny.opt.glb":["#c9a06a",.28],"ship-punk.opt.glb":["#b06a5a",.28]},ln=e=>e&&Ml[e]||null,bn=(e,o=34)=>e&&Fa[e]!==void 0?Fa[e]:o,wn=e=>e&&Ga[e]!==void 0?Ga[e]:1,kl=e=>e&&Oa[e]!==void 0?Oa[e]:.2,wr=e=>e&&Da[e]!==void 0?Da[e]:.13,Po=e=>Math.max(0,kl(e)-wr(e)),Qt=(e,o)=>wr(e)*o,yr=(e,o)=>((e&&Na[e]!==void 0?Na[e]:.8)-Po(e))*o,Ua={sunny:{id:"sunny",name:"THOUSAND SUNNY",crewName:"STRAW HAT",hulls:["ship-sunny.opt.glb","ship-lion.opt.glb"],flag:"straw",crew:"crew-straw.opt.glb",fleetId:"straw-hats",tint:"#c98a52",burst:{push:76,charge:9,label:"BURST",sub:"coup de"},topSpeed:84,accel:21,turn:1.05},punk:{id:"punk",name:"VICTORIA PUNK",crewName:"KID",hulls:["ship-punk.opt.glb","ship-bone.opt.glb"],flag:"kid",crew:"crew-punk.opt.glb",fleetId:"kid",tint:"#9a6a4e",burst:{push:95,charge:13,label:"RAM",sub:"full ahead"},topSpeed:78,accel:16,turn:.86}},cn=e=>Ua[e]??Ua.sunny,lo=[{id:"sunny",mode:"helm",vessel:"sunny",name:"THOUSAND SUNNY",who:"LUFFY"},{id:"punk",mode:"helm",vessel:"punk",name:"VICTORIA PUNK",who:"KID"},{id:"tang",mode:"sub",vessel:"tang",name:"POLAR TANG",who:"LAW"}],jl=(e,o)=>e==="sub"?lo[2]:lo.find(n=>n.vessel===o)??lo[0],ma=(e,o)=>{const n=lo.indexOf(jl(e,o));return lo[(n+1)%lo.length]},vr=210,Wa={off:1,lead:.98*xo*.77},Mn={SPREAD:28,SWEEP:14,RANK:118},_n=(e,o=0,n=0)=>({off:(e+(n?.5*Math.sign(e||1):0))*Mn.SPREAD,lead:o-Math.abs(e)*Mn.SWEEP-n*Mn.RANK}),Ya={kozuki:{side:-1,from:2},yakuza:{side:1,from:2},mink:{side:0,from:9}};function Sl(e){const o={},n={};for(const a of e){const s=Mr[a.id];if(s){Object.assign(a,_n(s[0],s[1]));continue}const i=Ya[a.faction]?a.faction:"kozuki",c=Ya[i],h=a.rank??0,l=`${i}:${h}`;o[l]===void 0&&(o[l]=c.from,n[l]=-1);const u=c.side||n[l];Object.assign(a,_n(u*o[l],0,h)),c.side===0?(n[l]>0&&(o[l]+=1),n[l]=-n[l]):o[l]+=1}}const Mr={scabbards:[0,vr],"straw-hats":[-1,150],kid:[1,150],heart:[0,60]},kr=680*H,kn={z:1100},Bn={sunny:{x:0*H,z:kn.z*H},punk:{x:96*H,z:(kn.z-18)*H},tang:{x:-104*H,z:(kn.z-30)*H}};function zl(e,o=0){const n=(820+-670*e)*H+o;return[(Math.sin(e*2.4)*54-e*26)*H,n]}function jr(e,o,n,a){const[s,i]=zl(n,a);return[s+o*H*Wa.off,i-e*H*Wa.lead]}function Va(e){const o=Mr[e];if(!o)return null;const{lead:n,off:a}=_n(o[0],o[1]),[s,i]=jr(n,a,0,kr);return{x:s,z:i}}const Tl=[{x:-300*H,z:100*H,yaw:.35},{x:330*H,z:360*H,yaw:-.55},{x:-390*H,z:470*H,yaw:.12},{x:420*H,z:830*H,yaw:-.28},{x:-455*H,z:930*H,yaw:.48},{x:400*H,z:1120*H,yaw:-.16},{x:-520*H,z:690*H,yaw:.22},{x:540*H,z:1290*H,yaw:-.42}],El=[{x:Q.x+132*H*.72,z:Q.z+96*H*.72,yaw:2.3},{x:Q.x+168*H*.72,z:Q.z+40*H*.72,yaw:1.9},{x:Q.x+96*H*.72,z:Q.z+150*H*.72,yaw:2.7}];function Rl({url:e,height:o,loa:n,slim:a=1,sink:s=0,rotation:i,tint:c,emissive:h,emissiveIntensity:l,glow:u,onMaterials:b}){const{scene:m}=Zs(e),g=w.useMemo(()=>m.clone(!0),[m]),x=w.useMemo(()=>{const f=new qs().setFromObject(g),p=new z;f.getSize(p);const d=new z;if(f.getCenter(d),n){const j=p.x>=p.z,S=Math.max(j?p.x:p.z,1e-4),k=n/S,E=j?[k,k,k*a]:[k*a,k,k];return{scale:E,offset:[-d.x*E[0],-f.min.y*E[1]-n*s,-d.z*E[2]]}}const v=p.y>1e-4?o/p.y:1;return{scale:[v,v,v],offset:[-d.x*v,-f.min.y*v,-d.z*v]}},[g,o,n,a,s]);return w.useEffect(()=>{const f=[];g.traverse(p=>{if(!p.isMesh)return;p.castShadow=!0,p.receiveShadow=!0;const d=p.material?Array.isArray(p.material)?p.material:[p.material]:[];for(const v of d)f.push(v),c&&(v.color?.multiply(new ze(c)),h&&v.emissive&&(v.emissive.set(h),v.emissiveIntensity=l??.2)),u&&v.emissive&&(v.emissive.set(u[0]),v.emissiveIntensity=u[1],v.map&&!v.emissiveMap&&(v.emissiveMap=v.map),v.needsUpdate=!0)}),b?.(f)},[g,c,h,l,u,b]),t.jsx("group",{rotation:[0,i,0],scale:x.scale,position:x.offset,children:t.jsx("primitive",{object:g})})}class Al extends w.Component{constructor(){super(...arguments);ka(this,"state",{failed:!1})}static getDerivedStateFromError(){return{failed:!0}}componentDidCatch(n){}render(){return this.state.failed?this.props.fallback:this.props.children}}function ye({name:e,height:o,loa:n=null,slim:a=1,sink:s=0,rotation:i=0,position:c=[0,0,0],tint:h=null,emissive:l=null,emissiveIntensity:u=.2,glow:b=null,onMaterials:m=null,fallback:g=null}){const x=Io(e);return rt(e)?t.jsx("group",{position:c,children:t.jsx(Al,{url:x,fallback:g,children:t.jsx(w.Suspense,{fallback:g,children:t.jsx(Rl,{url:x,height:o,loa:n,slim:a,sink:s,rotation:i,tint:h,emissive:l,emissiveIntensity:u,glow:b,onMaterials:m})})})}):t.jsx("group",{position:c,children:g})}const Un=(()=>{if(typeof document>"u")return null;const e=64,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),s=a.createImageData(e,o);for(let c=0;c<o;c++){const h=c/(o-1),l=Math.pow(1-h,1.7);for(let u=0;u<e;u++){const b=u/(e-1)*2-1,m=Math.max(0,1-Math.abs(b)/(.35+h*.65)),g=.45+.55*Math.pow(Math.abs(b)/(.35+h*.65),1.5),x=l*Math.pow(m,1.4)*g,f=(c*e+u)*4;s.data[f]=255,s.data[f+1]=255,s.data[f+2]=255,s.data[f+3]=Math.round(Math.min(1,x)*255)}}a.putImageData(s,0,0);const i=new Xt(n);return i.colorSpace=go,i})(),Il=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createImageData(e,e);for(let i=0;i<e;i++){const c=i/(e-1),h=Math.pow(1-c,1.5);for(let l=0;l<e;l++){const u=l/(e-1)*2-1,b=Math.max(0,1-Math.abs(u)),m=h*Math.pow(b,1.3),g=(i*e+l)*4;a.data[g]=255,a.data[g+1]=255,a.data[g+2]=255,a.data[g+3]=Math.round(Math.min(1,m)*255)}}n.putImageData(a,0,0);const s=new Xt(o);return s.colorSpace=go,s})(),hn=(()=>{if(typeof document>"u")return null;const e=64,o=document.createElement("canvas");o.width=e,o.height=e;const n=o.getContext("2d"),a=n.createRadialGradient(e/2,e/2,2,e/2,e/2,e/2);a.addColorStop(0,"rgba(255,255,255,0.9)"),a.addColorStop(.4,"rgba(255,255,255,0.28)"),a.addColorStop(1,"rgba(255,255,255,0)"),n.fillStyle=a,n.fillRect(0,0,e,e);const s=new Xt(o);return s.colorSpace=go,s})(),qo=160,ro=112,Dt="#e6dfcf",Sr="#0c0a15",Vt=Sr;typeof CanvasRenderingContext2D<"u"&&!CanvasRenderingContext2D.prototype.roundRect&&(CanvasRenderingContext2D.prototype.roundRect=function(e,o,n,a,s){const i=Math.min(s??0,Math.abs(n)/2,Math.abs(a)/2);return this.moveTo(e+i,o),this.arcTo(e+n,o,e+n,o+a,i),this.arcTo(e+n,o+a,e,o+a,i),this.arcTo(e,o+a,e,o,i),this.arcTo(e,o,e+n,o,i),this.closePath(),this});function Gt(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=qo,o.height=ro;const n=o.getContext("2d"),a=n.createLinearGradient(0,0,0,ro);a.addColorStop(0,"#14101f"),a.addColorStop(.5,Sr),a.addColorStop(1,"#08060f"),n.fillStyle=a,n.fillRect(0,0,qo,ro),n.fillStyle="rgba(255,255,255,0.07)",n.fillRect(0,0,5,ro),n.save(),n.translate(qo/2+4,ro/2);try{e(n)}catch(i){console.warn("[onigashima] flag emblem skipped",i)}n.restore();const s=new Xt(o);return s.colorSpace=go,s.anisotropy=4,s}function jn(e,o,n=Dt){e.fillStyle=n,e.beginPath(),e.ellipse(0,-o*.12,o,o*.92,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-o*.52,o*.6,o*1.04,o*.5,o*.16),e.fill()}function Sn(e,o,n=1){e.save(),e.fillStyle=Vt,e.beginPath(),e.ellipse(-o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.ellipse(o*.38,-o*.2,o*.27*n,o*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(0,o*.06),e.lineTo(-o*.14,o*.34),e.lineTo(o*.14,o*.34),e.closePath(),e.fill(),e.restore()}function $a(e,o,n=4){e.save(),e.fillStyle=Vt;for(let a=1;a<n;a++){const s=-o*.5+a*o/n;e.fillRect(s-o*.035,o*.6,o*.07,o*.5)}e.fillRect(-o*.52,o*.78,o*1.04,o*.05),e.restore()}function zn(e,o,n=Dt){e.save(),e.strokeStyle=n,e.lineWidth=o*.17,e.lineCap="round";for(const a of[1,-1]){e.save(),e.rotate(a*Math.PI/4.4),e.beginPath(),e.moveTo(-o*1.55,o*.55),e.lineTo(o*1.55,o*.55),e.stroke(),e.fillStyle=n;for(const s of[-1,1])for(const i of[-.16,.16])e.beginPath(),e.arc(s*o*1.55,o*.55+i*o,o*.15,0,Math.PI*2),e.fill();e.restore()}e.restore()}const Cl={straw:Gt(e=>{zn(e,26),jn(e,26),Sn(e,26),$a(e,26),e.fillStyle="#e8c86a",e.beginPath(),e.ellipse(0,-26*.86,26*1.5,26*.3,0,0,Math.PI*2),e.fill(),e.beginPath(),e.roundRect(-26*.78,-26*1.5,26*1.56,26*.7,26*.22),e.fill(),e.fillStyle="#d63420",e.fillRect(-26*.8,-26*1.06,26*1.6,26*.22)}),heart:Gt(e=>{const n="#a8e8d4";e.fillStyle=n,e.beginPath(),e.ellipse(0,0,27*1.02,27*1,0,0,Math.PI*2),e.fill(),e.save(),e.fillStyle=Vt;for(const a of[-1,1])e.beginPath(),e.arc(a*27*.36,-27*.2,27*.2,0,Math.PI*2),e.fill();e.lineWidth=27*.13,e.strokeStyle=Vt,e.beginPath(),e.arc(0,27*.12,27*.52,.24*Math.PI,.76*Math.PI),e.stroke(),e.restore(),e.fillStyle="#d63420",e.beginPath(),e.moveTo(0,-27*1.34),e.bezierCurveTo(27*.5,-27*1.9,27*.9,-27*1.2,0,-27*.78),e.bezierCurveTo(-27*.9,-27*1.2,-27*.5,-27*1.9,0,-27*1.34),e.fill()}),kid:Gt(e=>{zn(e,26,"#d8cfc0"),e.fillStyle=Dt,e.beginPath(),e.moveTo(-26*1.05,-26*.5),e.lineTo(-26*.7,-26*1.05),e.lineTo(26*.7,-26*1.05),e.lineTo(26*1.05,-26*.5),e.lineTo(26*.72,26*.5),e.lineTo(-26*.72,26*.5),e.closePath(),e.fill(),e.beginPath(),e.roundRect(-26*.62,26*.42,26*1.24,26*.62,26*.1),e.fill(),e.save(),e.fillStyle=Vt;for(const n of[-1,1])e.save(),e.translate(n*26*.4,-26*.3),e.rotate(n*.35),e.beginPath(),e.roundRect(-26*.28,-26*.2,26*.56,26*.4,26*.1),e.fill(),e.restore();for(let n=0;n<6;n++){const a=-15.6+n*26*1.2/5;e.beginPath(),e.moveTo(a,26*.42),e.lineTo(a+26*.1,26*1.04),e.lineTo(a-26*.1,26*1.04),e.closePath(),e.fill()}e.restore()}),kozuki:Gt(e=>{e.strokeStyle="#e8b06a",e.lineWidth=30*.1,e.beginPath(),e.arc(0,0,30*1.06,0,Math.PI*2),e.stroke(),e.fillStyle="#d63420";for(let n=0;n<5;n++){const a=n/5*Math.PI*2-Math.PI/2;e.save(),e.rotate(a),e.beginPath(),e.ellipse(0,-30*.52,30*.26,30*.42,0,0,Math.PI*2),e.fill(),e.restore()}e.fillStyle="#e8c86a",e.beginPath(),e.arc(0,0,30*.24,0,Math.PI*2),e.fill()}),alliance:Gt(e=>{zn(e,27,"#dcd4c4"),e.fillStyle=Dt,e.beginPath();for(let n=0;n<16;n++){const a=n/16*Math.PI*2;e.moveTo(Math.cos(a)*27*1.02+27*.17,Math.sin(a)*27*1.02),e.arc(Math.cos(a)*27*1.02,Math.sin(a)*27*1.02,27*.17,0,Math.PI*2)}e.fill(),e.beginPath(),e.arc(0,0,27*1.02,0,Math.PI*2),e.fill(),e.fillStyle=Vt,e.beginPath(),e.arc(0,0,27*.9,0,Math.PI*2),e.fill(),e.fillStyle=Dt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*27*.1,27*.42),e.quadraticCurveTo(n*27*.92,27*.1,n*27*.62,-27*.78),e.quadraticCurveTo(n*27*.5,-27*.2,n*27*.06,27*.3),e.closePath(),e.fill();e.beginPath(),e.ellipse(27*.02,-27*.02,27*.15,27*.19,0,0,Math.PI*2),e.fill(),e.beginPath(),e.moveTo(-27*.08,-27*.02),e.lineTo(-27*.36,27*.04),e.lineTo(-27*.08,27*.1),e.closePath(),e.fill(),e.beginPath(),e.arc(0,27*.52,27*.12,0,Math.PI*2),e.fill();for(let n=0;n<8;n++){const a=n/8*Math.PI*2;e.beginPath(),e.arc(Math.cos(a)*27*.26,27*.52+Math.sin(a)*27*.26,27*.055,0,Math.PI*2),e.fill()}}),yakuza:Gt(e=>{e.strokeStyle="#e8c86a",e.lineWidth=28*.12,e.beginPath(),e.roundRect(-28*.86,-28*.86,28*1.72,28*1.72,28*.14),e.stroke(),e.fillStyle=Dt;for(const n of[-.42,0,.42])e.fillRect(-28*.52,n*28-28*.07,28*1.04,28*.15);e.fillRect(-28*.09,-28*.55,28*.18,28*1.1),e.fillStyle="#d63420",e.beginPath(),e.arc(0,-28*1.32,28*.2,0,Math.PI*2),e.fill()}),mink:Gt(e=>{e.fillStyle=Dt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.5,-25*.85),e.lineTo(n*25*1.02,-25*1.72),e.lineTo(n*25*1.06,-25*.6),e.closePath(),e.fill();jn(e,25),e.beginPath(),e.roundRect(-25*.34,25*.42,25*.68,25*.78,25*.2),e.fill(),Sn(e,25,.85),e.save(),e.fillStyle=Vt,e.fillRect(-25*.32,25*.72,25*.64,25*.06),e.restore(),e.fillStyle=Dt;for(const n of[-1,1])e.beginPath(),e.moveTo(n*25*.3,25*.7),e.lineTo(n*25*.42,25*1.42),e.lineTo(n*25*.16,25*.78),e.closePath(),e.fill()}),beasts:Gt(e=>{e.fillStyle="#cfd8e4";for(const n of[-1,1])e.beginPath(),e.moveTo(n*26*.62,-26*.78),e.quadraticCurveTo(n*26*1.5,-26*1.5,n*26*1.18,-26*2),e.quadraticCurveTo(n*26*1.42,-26*1.35,n*26*.86,-26*.5),e.closePath(),e.fill();jn(e,26,"#cfd8e4"),Sn(e,26),$a(e,26,5),e.fillStyle="#c9411a",e.beginPath(),e.roundRect(-26*.74,26*.34,26*1.48,26*.2,26*.1),e.fill()})},zr={value:0},Ka=new Map;function Pl(e){const o=Ka.get(e);if(o)return o;const n=Cl[e],a=new ai({map:n,emissiveMap:n,emissive:new ze("#9fb4d8"),emissiveIntensity:.95,roughness:.94,metalness:0,side:Be,transparent:!1});return a.onBeforeCompile=s=>{s.uniforms.uTime=zr,s.vertexShader=`uniform float uTime;
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
      `)},a.customProgramCacheKey=()=>"onigashima-flag",Ka.set(e,a),a}function Ll(){return ae((e,o)=>{zr.value+=Math.min(o,.05)}),null}const Fl=(()=>{const e=new aa(1,1,14,5);return e.translate(.5,0,0),e})();function dn({crew:e="straw",width:o=xr,position:n=[0,0,0],rotation:a=Math.PI/2,staff:s=!0}){const i=w.useMemo(()=>Pl(e)??null,[e]),c=o*(ro/qo);return i?t.jsxs("group",{position:n,rotation:[0,a,0],children:[s&&t.jsxs("mesh",{position:[0,c*.1,0],children:[t.jsx("cylinderGeometry",{args:[o*.028,o*.028,c*1.5,4]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{position:[-o*.02,-c*1.1,0],rotation:[0,0,-.06],children:[t.jsx("cylinderGeometry",{args:[o*.012,o*.012,c*2.4,3]}),t.jsx("meshStandardMaterial",{color:"#6b5f4a",emissive:"#6b5f4a",emissiveIntensity:.35,roughness:.9})]}),t.jsx("mesh",{geometry:Fl,material:i,scale:[o,c,o]})]}):null}const Jo=[{id:"scabbards",flag:"kozuki",lead:vr,off:-14,scale:.62,sail:null,hull:"#3d2a1c",lamp:A.lantern,open:!0},{id:"straw-hats",flag:"straw",lead:118,off:-88,scale:1.15,sail:"#f0e6cf",hull:"#c9762e",lamp:A.lantern,figurehead:!0,model2:"ship-sunny.opt.glb",model:"ship-lion.opt.glb",tint:"#c98a52",crew:"crew-straw.opt.glb",sailedBy:"helm"},{id:"kid",flag:"kid",lead:112,off:88,scale:1.1,sail:"#2a2233",hull:"#5b2233",lamp:"#ff5a3c",model2:"ship-punk.opt.glb",model:"ship-bone.opt.glb",tint:"#9a6a4e",crew:"crew-punk.opt.glb",sailedBy:"helm"},{id:"heart",flag:"heart",lead:156,off:2,scale:.8,sail:null,hull:"#c9b03a",lamp:"#ffe08a",sub:!0,model2:"ship-tang.opt.glb",model:"ship-sub.opt.glb",tint:"#c9b445",crew:"crew-heart.opt.glb",sailedBy:"sub"},{id:"kozuki-0",faction:"kozuki",flag:"kozuki",rank:0,scale:.86,sail:"#cfc4ac",hull:"#4a3728",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1",faction:"kozuki",flag:"alliance",rank:0,scale:.848,sail:"#c6bba4",hull:"#453322",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2",faction:"kozuki",flag:"kozuki",rank:0,scale:.836,sail:"#c2b79f",hull:"#3a2d20",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3",faction:"kozuki",flag:"kozuki",rank:0,scale:.824,sail:"#bdb29a",hull:"#37291d",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4",faction:"kozuki",flag:"alliance",rank:0,scale:.812,sail:"#c8bda6",hull:"#3c2e21",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"kozuki-5",faction:"kozuki",flag:"kozuki",rank:0,scale:.8,sail:"#beb39b",hull:"#382a1e",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6a5c47",crew:"crew-samurai.opt.glb"},{id:"kozuki-6",faction:"kozuki",flag:"kozuki",rank:0,scale:.788,sail:"#bcb199",hull:"#362820",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6d5f4a",crew:"crew-samurai.opt.glb"},{id:"kozuki-7",faction:"kozuki",flag:"alliance",rank:0,scale:.776,sail:"#c4b9a1",hull:"#382b1f",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7b6c53",crew:"crew-samurai.opt.glb"},{id:"kozuki-8",faction:"kozuki",flag:"kozuki",rank:0,scale:.764,sail:"#c9bea7",hull:"#392c20",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#81725a",crew:"crew-samurai.opt.glb"},{id:"yakuza-0",faction:"yakuza",flag:"yakuza",rank:0,scale:.84,sail:"#b8a894",hull:"#4d3026",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1",faction:"yakuza",flag:"alliance",rank:0,scale:.828,sail:"#b2a28e",hull:"#472b22",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2",faction:"yakuza",flag:"yakuza",rank:0,scale:.816,sail:"#ad9d89",hull:"#42271f",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3",faction:"yakuza",flag:"yakuza",rank:0,scale:.804,sail:"#bfae99",hull:"#4a2e24",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4",faction:"yakuza",flag:"alliance",rank:0,scale:.792,sail:"#a89884",hull:"#3d241d",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"yakuza-5",faction:"yakuza",flag:"yakuza",rank:0,scale:.78,sail:"#b5a591",hull:"#452a21",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#83654f",crew:"crew-samurai.opt.glb"},{id:"yakuza-6",faction:"yakuza",flag:"yakuza",rank:0,scale:.768,sail:"#aa9a86",hull:"#402620",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#755949",crew:"crew-samurai.opt.glb"},{id:"yakuza-7",faction:"yakuza",flag:"alliance",rank:0,scale:.756,sail:"#bcac97",hull:"#482c23",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#886851",crew:"crew-samurai.opt.glb"},{id:"yakuza-8",faction:"yakuza",flag:"yakuza",rank:0,scale:.744,sail:"#a5957f",hull:"#3a221b",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6d5142",crew:"crew-samurai.opt.glb"},{id:"mink-0",faction:"mink",flag:"mink",rank:0,scale:.9,sail:"#d2c7ae",hull:"#3f3a2c",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6e6a54",crew:"crew-samurai.opt.glb"},{id:"mink-1",faction:"mink",flag:"alliance",rank:0,scale:.886,sail:"#cdc2aa",hull:"#42392b",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#68644e",crew:"crew-samurai.opt.glb"},{id:"mink-2",faction:"mink",flag:"mink",rank:0,scale:.872,sail:"#cbc0a8",hull:"#403729",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6c684f",crew:"crew-samurai.opt.glb"},{id:"mink-3",faction:"mink",flag:"mink",rank:0,scale:.858,sail:"#c6bba3",hull:"#3d352a",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#666249",crew:"crew-samurai.opt.glb"},{id:"kozuki-0b",faction:"kozuki",flag:"kozuki",rank:1,scale:.8,sail:"#cfc4ac",hull:"#4a3728",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8a7a62",crew:"crew-samurai.opt.glb"},{id:"kozuki-1b",faction:"kozuki",flag:"alliance",rank:1,scale:.788,sail:"#c6bba4",hull:"#453322",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7e6f58",crew:"crew-samurai.opt.glb"},{id:"kozuki-2b",faction:"kozuki",flag:"kozuki",rank:1,scale:.776,sail:"#c2b79f",hull:"#3a2d20",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7a6c56",crew:"crew-samurai.opt.glb"},{id:"kozuki-3b",faction:"kozuki",flag:"kozuki",rank:1,scale:.764,sail:"#bdb29a",hull:"#37291d",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6f6250",crew:"crew-samurai.opt.glb"},{id:"kozuki-4b",faction:"kozuki",flag:"alliance",rank:1,scale:.752,sail:"#c8bda6",hull:"#3c2e21",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#837458",crew:"crew-samurai.opt.glb"},{id:"yakuza-0b",faction:"yakuza",flag:"yakuza",rank:1,scale:.78,sail:"#b8a894",hull:"#4d3026",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8a6a55",crew:"crew-samurai.opt.glb"},{id:"yakuza-1b",faction:"yakuza",flag:"alliance",rank:1,scale:.768,sail:"#b2a28e",hull:"#472b22",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#7f6150",crew:"crew-samurai.opt.glb"},{id:"yakuza-2b",faction:"yakuza",flag:"yakuza",rank:1,scale:.756,sail:"#ad9d89",hull:"#42271f",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#78594a",crew:"crew-samurai.opt.glb"},{id:"yakuza-3b",faction:"yakuza",flag:"yakuza",rank:1,scale:.744,sail:"#bfae99",hull:"#4a2e24",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#8d6d57",crew:"crew-samurai.opt.glb"},{id:"yakuza-4b",faction:"yakuza",flag:"alliance",rank:1,scale:.732,sail:"#a89884",hull:"#3d241d",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#715446",crew:"crew-samurai.opt.glb"},{id:"mink-0b",faction:"mink",flag:"mink",rank:1,scale:.84,sail:"#cec3ab",hull:"#42392c",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6a6650",crew:"crew-samurai.opt.glb"},{id:"mink-1b",faction:"mink",flag:"alliance",rank:1,scale:.826,sail:"#cabfa7",hull:"#40372a",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#6b674e",crew:"crew-samurai.opt.glb"},{id:"mink-2b",faction:"mink",flag:"mink",rank:1,scale:.812,sail:"#ccc1a9",hull:"#413828",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#69654d",crew:"crew-samurai.opt.glb"},{id:"mink-3b",faction:"mink",flag:"mink",rank:1,scale:.798,sail:"#c8bda5",hull:"#3f3629",lamp:A.lantern,model:"ship-junk.opt.glb",tint:"#676349",crew:"crew-samurai.opt.glb"}];Sl(Jo);function Qa({color:e,position:o,scale:n=1}){return t.jsxs("group",{position:o,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[br*n,7,5]}),t.jsx("meshStandardMaterial",{color:e,emissive:e,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[rn*n,rn*n,1],children:t.jsx("spriteMaterial",{map:hn,color:e,transparent:!0,opacity:.5,depthWrite:!1,blending:it,toneMapped:!1})})]})}function Gl({spec:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=w.useRef();ae(()=>{const x=n.current;if(!x)return;const f=y.mode&&y.mode!=="off",p=cn(y.vessel).fleetId;if(x.visible=!(e.sailedBy==="sub"?y.mode==="sub":e.sailedBy==="helm"&&(y.mode==="helm"||y.mode==="foot")&&p===e.id),!x.visible)return;const d=f?0:R.clamp(y.progress*.82+.04,0,1),[v,j]=jr(e.lead,e.off,d,f?kr:0),S=Co(v,j),k=R.clamp(-le(v,j)/46,0,1),E=R.lerp(1,.055,S)*R.smoothstep(k,0,.28),r=ut(v,j,y.t,E),T=e.sub?R.smoothstep(y.progress,.42,.6):0;x.position.set(v,r.y-T*40,j);const C=e.sub?.35:1;x.rotation.x=R.clamp(r.dz*1.35*C,-.32,.32),x.rotation.z=R.clamp(-r.dx*1.15*C,-.28,.28),x.rotation.y=Math.PI+Math.sin(y.t*.31+e.lead)*.05,a.current&&(a.current.scale.z=1+Math.sin(y.t*1.6+e.off)*.09,a.current.rotation.y=Math.sin(y.t*.9+e.lead*.1)*.05),s.current&&(s.current.material.opacity=.36*(.25+(1-S)*.75)*(1-T))});const i=e.scale,c=o==="low"?6:10,h=rt(e.model2??""),l=rt(e.model??""),u=h?e.model2:l?e.model:null,b=u==="ship-junk.opt.glb",m=bn(u,34)*(b?e.scale??1:1),g=rt(e.crew??"");return u?t.jsxs("group",{ref:n,children:[t.jsx(ye,{name:u,loa:m,slim:wn(u),sink:Po(u),rotation:gn(u),tint:h?fa(u):e.tint,emissive:"#3a2a18",emissiveIntensity:.16,glow:ln(u)}),g&&fr(o).map((x,f)=>{const[p,d]=ua(u,m,x);return t.jsx(ye,{name:e.crew,height:xn,rotation:x[2],position:[p,Qt(u,m),d]},`crew-${f}`)}),e.flag&&!gr(u)&&t.jsx(dn,{crew:e.flag,width:sn(m),position:Ct(u,m,io("flag")),staff:!!e.sub}),pa(u).map(x=>t.jsx(Qa,{color:e.lamp,position:Ct(u,m,x)},x.what)),t.jsxs("mesh",{ref:s,position:[0,.6,-m*1.1],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[m*.55,m*2.3]}),t.jsx("meshBasicMaterial",{map:Un,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]}):t.jsxs("group",{ref:n,children:[t.jsxs("group",{scale:i*1.7,children:[t.jsxs("mesh",{position:[0,1.6,0],scale:[1,.72,2.6],castShadow:!0,children:[t.jsx("capsuleGeometry",{args:[4.2,8,4,c]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.86})]}),t.jsxs("mesh",{position:[0,4.4,0],children:[t.jsx("boxGeometry",{args:[7.4,.7,21]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,5.4,11.4],rotation:[.5,0,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[3.4,9,2.4]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),!e.open&&t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:[0,7.6,-7.4],castShadow:!0,children:[t.jsx("boxGeometry",{args:[7,6.4,6.6]}),t.jsx("meshStandardMaterial",{color:e.hull,roughness:.88})]}),t.jsxs("mesh",{position:[0,13,1],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.95,1.3,24,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,21.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.55,.55,17,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:a,position:[0,14.5,1.4],children:[t.jsx("planeGeometry",{args:[15,13]}),t.jsx("meshStandardMaterial",{color:e.sail,roughness:1,side:Be,emissive:e.sail,emissiveIntensity:.3})]})]}),e.open&&[-1,1].map(x=>[0,1,2,3].map(f=>t.jsxs("mesh",{position:[x*5.6,3.4,-6+f*4],rotation:[0,0,x*.55],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.28,.28,12,4]}),t.jsx("meshStandardMaterial",{color:"#33251a",roughness:.94})]},`${x}-${f}`))),e.flag&&t.jsx(dn,{crew:e.flag,width:sn(m)/(i*1.7),position:e.open?[0,9,-4]:[0,25.5,1],staff:!!e.open}),e.figurehead&&t.jsxs("group",{position:[0,6.2,12.6],children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.1,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.1,1.5,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),t.jsx(Qa,{color:e.lamp,scale:1/(i*1.7),position:[0,e.open?5.6:9.4,e.open?7:-7.4]})]}),t.jsxs("mesh",{ref:s,position:[0,.6,-34*i],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[17*i,74*i]}),t.jsx("meshBasicMaterial",{map:Un,color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1})]})]})}function Xa({x:e,z:o,yaw:n,name:a,loa:s,tint:i,flag:c=null,crew:h=null,quality:l="high"}){const u=bn(a,s),b=w.useRef(),m=rt(a),g=rt(h??"");return ae(()=>{const x=b.current;if(!x)return;const f=Co(e,o),p=R.clamp(-le(e,o)/46,0,1),d=R.lerp(1,.055,f)*R.smoothstep(p,0,.28),v=ut(e,o,y.t,d);x.position.set(e,v.y,o),x.rotation.set(R.clamp(v.dz*1.1,-.25,.25),n+Math.sin(y.t*.22+e)*.04,R.clamp(-v.dx,-.22,.22))}),t.jsxs("group",{ref:b,children:[t.jsx(ye,{name:a,loa:u,slim:wn(a),sink:Po(a),rotation:gn(a),tint:i,emissive:"#26180e",emissiveIntensity:.18,fallback:null}),h&&g&&m&&fr(l).slice(0,2).map((x,f)=>{const[p,d]=ua(a,u,x);return t.jsx(ye,{name:h,height:xn,rotation:x[2],position:[p,Qt(a,u),d]},`watch-${f}`)}),c&&m&&t.jsx(dn,{crew:c,width:sn(u),position:Ct(a,u,io("flag"))})]})}function Ol({quality:e="high"}){const o=w.useMemo(()=>e==="low"?Jo.slice(0,7):e==="mid"?Jo.slice(0,22):Jo,[e]);return t.jsxs(t.Fragment,{children:[t.jsx(Ll,{}),o.map(n=>t.jsx(Gl,{spec:n,quality:e},n.id)),e!=="low"&&Tl.map((n,a)=>t.jsx(Xa,{quality:e,...n,name:"ship-warjunk.opt.glb",loa:62,tint:"#8a8560",flag:"beasts",crew:"crew-samurai.opt.glb"},`picket-${a}`)),e!=="low"&&El.map((n,a)=>t.jsx(Xa,{quality:e,...n,name:"ship-junk.opt.glb",loa:40,tint:"#7e7058",flag:"kozuki",crew:"crew-samurai.opt.glb"},`moored-${a}`))]})}const Nl=2,Za={"powder-keg.opt.glb":2.4,"war-cannon.opt.glb":4.2,"bomb-sphere.opt.glb":3.6,"sake-tower.opt.glb":5,"wisteria-trellis.opt.glb":8,"banquet-table.opt.glb":2.4,"stone-lantern.opt.glb":4,"oni-daiko.opt.glb":6,"oni-guardian.opt.glb":13,"oni-throne.opt.glb":12,"kagura-stage.opt.glb":40,"treasure-kura.opt.glb":16,"rear-gatehouse.opt.glb":18,"keep-tier.opt.glb":56,"arch-bridge.opt.glb":14},he=(e,o=6)=>e&&Za[e]!==void 0?Za[e]:o,Ot=30,Dl="#2e2a33",Wn="#3a4152",Yn=X.snow,un="#cfe0f4";function qa({position:e}){const o=he("stone-lantern.opt.glb")/7.8;return t.jsx("group",{position:e,children:t.jsx(ye,{name:"stone-lantern.opt.glb",height:he("stone-lantern.opt.glb"),tint:"#8a93a8",fallback:t.jsxs("group",{scale:o,children:[t.jsxs("mesh",{position:[0,1,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.4,2,2.4]}),t.jsx("meshStandardMaterial",{color:Wn,roughness:.95})]}),t.jsxs("mesh",{position:[0,3.4,0],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[.7,.9,3,6]}),t.jsx("meshStandardMaterial",{color:Wn,roughness:.95})]}),t.jsxs("mesh",{position:[0,5.6,0],castShadow:!0,children:[t.jsx("boxGeometry",{args:[2.2,1.8,2.2]}),t.jsx("meshStandardMaterial",{color:un,emissive:un,emissiveIntensity:.9,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,7,0],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.2,1.6,4]}),t.jsx("meshStandardMaterial",{color:Yn,roughness:.9})]})]})})})}function Hl({shadows:e=!0}){const o=w.useMemo(()=>Math.atan2(Y.dir[0],Y.dir[1]),[]);return t.jsxs("group",{position:[Y.gate.x,Y.benchY,Y.gate.z],rotation:[0,o,0],children:[[0,1,2,3].map(n=>t.jsxs("mesh",{position:[0,.7+n*1.3,6-n*2.1],receiveShadow:!0,castShadow:e,children:[t.jsx("boxGeometry",{args:[26-n*2,1.4,2.4]}),t.jsx("meshStandardMaterial",{color:Wn,roughness:.92})]},n)),t.jsx(ye,{name:"rear-gatehouse.opt.glb",height:he("rear-gatehouse.opt.glb"),rotation:Math.PI,position:[0,5,-6],tint:"#9aa0b5",emissive:"#1c2233",emissiveIntensity:.12,fallback:t.jsxs("group",{position:[0,0,0],children:[t.jsxs("mesh",{position:[0,8,0],castShadow:e,receiveShadow:!0,children:[t.jsx("boxGeometry",{args:[24,16,10]}),t.jsx("meshStandardMaterial",{color:Dl,roughness:.9})]}),t.jsxs("mesh",{position:[0,6,5.2],children:[t.jsx("boxGeometry",{args:[8,12,.6]}),t.jsx("meshStandardMaterial",{color:"#1d1a22",roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,2.9],rotation:[.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Yn,roughness:.85})]}),t.jsxs("mesh",{position:[0,17.4,-2.9],rotation:[-.6,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[28,.9,8.4]}),t.jsx("meshStandardMaterial",{color:Yn,roughness:.85})]}),t.jsxs("group",{position:[0,19.6,0],children:[[-3.2,3.2].map(n=>t.jsxs("mesh",{position:[n,2.2,0],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.5,.6,4.4,6]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]},n)),t.jsxs("mesh",{position:[0,4.6,0],rotation:[0,0,0],castShadow:e,children:[t.jsx("boxGeometry",{args:[9.6,.9,1.1]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]}),t.jsxs("mesh",{position:[0,3.4,0],children:[t.jsx("boxGeometry",{args:[7.6,.6,.9]}),t.jsx("meshStandardMaterial",{color:"#5e2430",roughness:.8})]})]}),t.jsxs("mesh",{position:[0,12.6,5.4],rotation:[0,0,Math.PI/2+.04],children:[t.jsx("cylinderGeometry",{args:[.5,.5,20,5]}),t.jsx("meshStandardMaterial",{color:"#c9b98a",roughness:1})]}),[-5,5].map(n=>t.jsxs("mesh",{position:[n,11.2,5.5],children:[t.jsx("boxGeometry",{args:[1.4,2.6,.1]}),t.jsx("meshStandardMaterial",{color:"#e8e4da",roughness:1,side:Be})]},n)),[-9,9].map(n=>t.jsxs("mesh",{position:[n,10.5,5.6],children:[t.jsx("sphereGeometry",{args:[1.5,8,6]}),t.jsx("meshStandardMaterial",{color:un,emissive:un,emissiveIntensity:1.4,toneMapped:!1})]},n))]})}),t.jsx(qa,{position:[-14,0,10]}),t.jsx(qa,{position:[14,0,10]}),[-8,0,8].map(n=>t.jsxs("mesh",{position:[n+20,1.2,26],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[.9,1.1,2.4,6]}),t.jsx("meshStandardMaterial",{color:"#262b38",roughness:.9})]},n))]})}const oo=new ze,Ja=new z,To={color:"#cfeaff",intensity:21e3,distance:300},Nt={color:"#ffc48a",intensity:17e3,distance:280},es=new ze(To.color),_l={low:1,mid:2,high:4},no=[{pos:[Q.x,40,Q.z],color:A.lantern,intensity:16e3,distance:460*H*.65},{pos:[0,78,Ut],color:A.lantern,intensity:15e3,distance:430},{pos:[de.x,de.y+6,de.z-30],color:A.emberDeep,intensity:3e4,distance:640},{pos:[Y.gate.x,30,Y.gate.z],color:"#9fc4e8",intensity:7e3,distance:340}];function Bl({quality:e="high",shadowMap:o=2048,shadows:n=!0}){const a=w.useRef(),s=w.useRef(),i=w.useRef(),c=w.useRef(),h=w.useRef(),l=w.useRef(),u=w.useRef(),b=xe(x=>x.camera),m=_l[e]??5,g=m>=2;return ae(()=>{if(a.current){a.current.intensity=y.flash*9e3;const p=y.flashDir;a.current.position.set(p.x*700,260+p.y*500,pe.z+p.z*700)}const x=y.t;s.current&&(s.current.intensity=62e3*(.86+.14*Math.sin(x*2.3)*Math.sin(x*.71))),i.current&&(i.current.intensity=62e3*(.86+.14*Math.sin(x*1.9+2.1)*Math.sin(x*.63)));const f=y.inside;if(l.current&&(l.current.intensity=.16+f*.3),u.current&&(u.current.intensity=.34+f*.26),c.current){const p=c.current,d=.06;let v=no[0],j=1/0;for(const S of no){const k=(b.position.x-S.pos[0])**2+(b.position.z-S.pos[2])**2;k<j&&(j=k,v=S)}if(!g&&y.subActive&&j>550*550){const S=y.subPos,k=Math.min(1,y.underwater/.35),E=Ja.set(b.position.x-S.x,0,b.position.z-S.z),r=Math.hypot(E.x,E.z)||1,T=26;p.position.x+=(S.x+E.x/r*T-p.position.x)*.3,p.position.y+=(S.y+7-p.position.y)*.3,p.position.z+=(S.z+E.z/r*T-p.position.z)*.3,oo.set(Nt.color).lerp(es,k),p.color.lerp(oo,d),p.intensity+=(R.lerp(Nt.intensity,To.intensity,k)-p.intensity)*d,p.distance=R.lerp(Nt.distance,To.distance,k)}else if(!g&&y.helmActive&&j>550*550){const S=y.helmPos;p.position.x+=(S.x-p.position.x)*.25,p.position.y+=(S.y+16-p.position.y)*.25,p.position.z+=(S.z-p.position.z)*.25,p.color.lerp(oo.set(A.lantern),d),p.intensity+=(11e3-p.intensity)*d,p.distance=300}else p.position.x+=(v.pos[0]-p.position.x)*d,p.position.y+=(v.pos[1]-p.position.y)*d,p.position.z+=(v.pos[2]-p.position.z)*d,p.color.lerp(oo.set(v.color),d),p.intensity+=(v.intensity-p.intensity)*d,p.distance=v.distance}if(h.current){const p=h.current,d=y.subActive,v=d||y.helmActive,j=d?y.subPos:y.helmPos;if(v&&j){const k=d?Math.min(1,y.underwater/.35):0,E=Ja.set(b.position.x-j.x,0,b.position.z-j.z),r=Math.hypot(E.x,E.z)||1,T=30,C=.28;p.position.x+=(j.x+E.x/r*T-p.position.x)*C,p.position.y+=(j.y+9-p.position.y)*C,p.position.z+=(j.z+E.z/r*T-p.position.z)*C,oo.set(Nt.color).lerp(es,k),p.color.lerp(oo,.08),p.distance=R.lerp(Nt.distance,To.distance,k)}const S=v?R.lerp(Nt.intensity,To.intensity,d?Math.min(1,y.underwater/.35):0):0;p.intensity+=(S-p.intensity)*.08}}),t.jsxs(t.Fragment,{children:[t.jsx("ambientLight",{ref:l,intensity:.16,color:X.skyLow}),t.jsx("hemisphereLight",{ref:u,args:[X.skyLow,"#2a1810",.34]}),t.jsx("directionalLight",{position:[380,620,760],intensity:.62,color:"#9db4de",castShadow:n,"shadow-mapSize":[o,o],"shadow-camera-left":-520*(H/1.55),"shadow-camera-right":520*(H/1.55),"shadow-camera-top":520*(H/1.55),"shadow-camera-bottom":-520*(H/1.55),"shadow-camera-near":80,"shadow-camera-far":2600,"shadow-bias":-.0012,"shadow-normalBias":1.4}),t.jsx("pointLight",{ref:s,position:m>=2?[Pe[0].x,Pe[0].y,Pe[0].z]:[(Pe[0].x+Pe[1].x)/2,Pe[0].y,Pe[0].z],color:A.ember,intensity:62e3,distance:1250,decay:2}),m>=2&&t.jsx("pointLight",{ref:i,position:[Pe[1].x,Pe[1].y,Pe[1].z],color:A.ember,intensity:62e3,distance:1250,decay:2}),t.jsx("pointLight",{ref:c,position:no[0].pos,color:no[0].color,intensity:no[0].intensity,distance:no[0].distance,decay:2}),g&&t.jsx("pointLight",{ref:h,position:[0,-400,0],color:Nt.color,intensity:0,distance:Nt.distance,decay:2}),m>=3&&t.jsx("pointLight",{position:[de.x,de.y+4,de.z-34],color:A.emberDeep,intensity:3e4,distance:640,decay:2}),m>=4&&t.jsx("pointLight",{position:[0,78,Ut],color:A.lantern,intensity:15e3,distance:430,decay:2}),t.jsx("pointLight",{ref:a,position:[0,700,-700],color:X.boltGlow,intensity:0,distance:4200,decay:1.4})]})}function Tn(e,o){let n=e>>>0;const a=()=>(n=Math.imul(n,1664525)+1013904223>>>0,n/4294967296),s=[],i=o==="low"?3:5,c=(f,p,d,v,j)=>{const S=[f.clone()],k=f.clone();for(let r=0;r<v;r++)k.add(new z((a()-.5)*d*.55,-d/v,(a()-.5)*d*.42)).add(p.clone().multiplyScalar(d/v*.3)),S.push(k.clone());const E=new mo(new fo(S),v*2,j,i,!1);return s.push(E),S},h=c(new z(0,620,0),new z(0,0,0),620,9,3.4),l=o==="low"?1:3;for(let f=0;f<l;f++){const p=h[2+Math.floor(a()*(h.length-3))];c(p.clone(),new z(a()-.5,0,a()-.5).multiplyScalar(2),190+a()*130,4,1.5)}let u=0;for(const f of s)u+=f.attributes.position.count;const b=new Float32Array(u*3),m=new Float32Array(u*3);let g=0;for(const f of s)b.set(f.attributes.position.array,g*3),m.set(f.attributes.normal.array,g*3),g+=f.attributes.position.count,f.dispose();const x=new Lt;return x.setAttribute("position",new ee(b,3)),x.setAttribute("normal",new ee(m,3)),x}function Ul({quality:e}){const o=[w.useRef(),w.useRef(),w.useRef()],n=w.useRef(2.5),a=w.useRef({i:0,t:-1,dur:0,flicker:0}),s=w.useMemo(()=>[Tn(40503,e),Tn(20973,e),Tn(10196,e)],[e]);return ae((i,c)=>{const h=Math.min(c,.05),l=a.current;if(n.current-=h,n.current<=0&&l.t<0){l.i=(l.i+1)%3,l.t=0,l.dur=.16+Math.random()*.26,l.flicker=2+Math.floor(Math.random()*3);const u=o[l.i].current;if(u){const b=(Math.random()-.5)*2.4-Math.PI*.5,m=620+Math.random()*760;u.position.set(pe.x+Math.cos(b)*m,40+Math.random()*120,pe.z+Math.sin(b)*m*.7-240),u.rotation.y=Math.random()*Math.PI*2;const g=.7+Math.random()*.8;u.scale.set(g,g,g),y.flashDir.set(u.position.x,u.position.y+400,u.position.z).normalize()}n.current=R.lerp(6.5,2.2,y.progress)*(.45+Math.random())}if(l.t>=0){l.t+=h;const u=l.t/l.dur,b=Math.abs(Math.sin(u*Math.PI*l.flicker)),m=Math.max(0,1-u);y.flash=m*m*b;const g=o[l.i].current;g&&(g.material.opacity=Math.min(1,y.flash*2.2)),u>=1&&(l.t=-1,y.flash=0,g&&(g.material.opacity=0))}else y.flash*=Math.pow(1e-4,h)}),t.jsx(t.Fragment,{children:s.map((i,c)=>t.jsx("mesh",{ref:o[c],geometry:i,frustumCulled:!1,renderOrder:4,children:t.jsx("meshBasicMaterial",{color:X.bolt,transparent:!0,opacity:0,blending:it,depthWrite:!1,toneMapped:!1})},c))})}const Wl=`
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
`,Yl=`
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
`,ts={low:1600,mid:3800,high:7e3},No=460;function Vl({quality:e}){const o=w.useRef(),n=xe(i=>i.camera),a=w.useMemo(()=>{const i=ts[e]??ts.high,c=new Float32Array(i*3),h=new Float32Array(i),l=new Float32Array(i);for(let b=0;b<i;b++)c[b*3]=Math.random()*No,c[b*3+1]=Math.random()*No,c[b*3+2]=Math.random()*No,h[b]=.7+Math.random()*.6,l[b]=.55+Math.random()*.85;const u=new Lt;return u.setAttribute("position",new ee(c,3)),u.setAttribute("aSpeed",new ee(h,1)),u.setAttribute("aLen",new ee(l,1)),u.boundingSphere=new Zt(new z,1e6),u},[e]),s=w.useMemo(()=>({uTime:{value:0},uCam:{value:new z},uBox:{value:No},uFall:{value:118},uSize:{value:2.4},uColor:{value:new z(...ie("#b9c8e4"))},uOpacity:{value:.5}}),[]);return ae((i,c)=>{const h=o.current?.uniforms;h&&(h.uTime.value+=c,h.uCam.value.copy(n.position),h.uOpacity.value=.5*y.rain*y.rain+y.flash*.3)}),t.jsx("points",{geometry:a,frustumCulled:!1,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:Wl,fragmentShader:Yl,uniforms:s,transparent:!0,depthWrite:!1,fog:!1})})}const $l=`
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
`,Kl=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.05, d);
    if (a * vFade < 0.01) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.9);
  }
`,os={low:120,mid:340,high:700};function Ql({quality:e}){const o=w.useRef(),n=w.useMemo(()=>{const s=os[e]??os.high,i=[Pe[0],Pe[1],de,de],c=new Float32Array(s*3),h=new Float32Array(s),l=new Float32Array(s),u=new Float32Array(s);for(let m=0;m<s;m++){const g=i[m%i.length];c[m*3]=g.x+(Math.random()-.5)*74,c[m*3+1]=g.y+(Math.random()-.5)*30,c[m*3+2]=g.z+(Math.random()-.5)*26,h[m]=Math.random(),l[m]=.045+Math.random()*.055,u[m]=2+Math.random()*4}const b=new Lt;return b.setAttribute("position",new ee(c,3)),b.setAttribute("aPhase",new ee(h,1)),b.setAttribute("aRise",new ee(l,1)),b.setAttribute("aSize",new ee(u,1)),b.boundingSphere=new Zt(new z(0,300,-260),700),b},[e]),a=w.useMemo(()=>({uTime:{value:0},uColor:{value:new z(...ie(A.ember))}}),[]);return ae((s,i)=>{o.current&&(o.current.uniforms.uTime.value+=i)}),t.jsx("points",{geometry:n,renderOrder:3,children:t.jsx("shaderMaterial",{ref:o,vertexShader:$l,fragmentShader:Kl,uniforms:a,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function Xl({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(Ul,{quality:e}),t.jsx(Vl,{quality:e}),t.jsx(Ql,{quality:e})]})}const Zl=`
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
`,ql=`
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
`,ns={low:150,mid:380,high:620};function Jl({whirl:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=w.useMemo(()=>{const c=ns[o]??ns.high,h=new Float32Array(c*3),l=new Float32Array(c),u=new Float32Array(c),b=new Float32Array(c),m=new Float32Array(c),g=new Float32Array(c);for(let f=0;f<c;f++)l[f]=Math.random()*Math.PI*2,u[f]=Math.random(),b[f]=.05+Math.random()*.05,m[f]=3+Math.random()*6,g[f]=Math.random();const x=new Lt;return x.setAttribute("position",new ee(h,3)),x.setAttribute("aAngle",new ee(l,1)),x.setAttribute("aPhase",new ee(u,1)),x.setAttribute("aRate",new ee(b,1)),x.setAttribute("aSize",new ee(m,1)),x.setAttribute("aJitter",new ee(g,1)),x.boundingSphere=new Zt(new z(e.x,0,e.z),e.r*1.6+40),x},[o,e]),i=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new sa(e.x,e.z)},uR:{value:e.r},uDepth:{value:e.depth},uDir:{value:e.dir},uColor:{value:new z(...ie(X.foam))},uGain:{value:1}}),[e]);return ae((c,h)=>{const l=n.current?.uniforms;if(!l)return;l.uTime.value+=h;const u=Math.hypot(c.camera.position.x-e.x,c.camera.position.z-e.z);l.uGain.value=1-R.smoothstep(u,1600,2400),a.current&&(a.current.visible=l.uGain.value>.02)}),t.jsx("points",{ref:a,geometry:s,renderOrder:2,children:t.jsx("shaderMaterial",{ref:n,vertexShader:Zl,fragmentShader:ql,uniforms:i,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function ec({quality:e="high"}){const o=xe(n=>n.camera);return ae(()=>{let n=0;for(const a of Ue){const s=Math.hypot(o.position.x-a.x,o.position.z-a.z);n=Math.max(n,1-R.smoothstep(s,a.r*.3,a.r*2.2))}y.whirlNear+=(n-y.whirlNear)*.05}),t.jsx(t.Fragment,{children:Ue.map((n,a)=>t.jsx(Jl,{whirl:n,quality:e},a))})}const V={rev:0,chain:null,step:0,hull:1,grip:0,clock:0,banner:null,done:!1,hits:0},po={helm:[{text:"PASS THE OUTER GATE",hint:"The island’s marker, alone in open water. Straight through it.",test:e=>e.z<uo-60},{text:"HOLD THE FAIRWAY",hint:"Whirlpools both flanks — the middle is the only clean water.",test:e=>e.toGate<420*H},{text:"RUN THE TORII",hint:"Between the columns — the batteries cannot depress that far.",test:e=>e.z<Ut-40},{text:"THREAD THE NECK",hint:"The walls close to a hundred metres. Mind your helm.",test:e=>e.z<120*H},{text:"MOOR AT THE PORT",hint:"Under the burning face. Come in slow.",test:e=>e.moored}],sub:[{text:"FORM UP WITH THE CAPTAINS",hint:"Surface between the Thousand Sunny and the Victoria Punk.",test:e=>{if(e.depth>12)return!1;const o=Va("straw-hats"),n=Va("kid");if(!o||!n)return!0;const a=(o.x+n.x)/2,s=(o.z+n.z)/2,i=Math.hypot(o.x-n.x,o.z-n.z);return Math.hypot(e.x-a,e.z-s)<Math.max(160,i*.75)}},{text:"TAKE HER DOWN",hint:"Below thirty-five metres the maelstroms cannot reach you.",test:e=>e.depth>35},{text:"RUN UNDER THE BACK-DOOR MAELSTROM",hint:"Straight through where the surface is turning. Stay deep.",test:e=>{const o=bi("back-door");return Math.hypot(e.x-o.x,e.z-o.z)<o.r*1.1&&e.depth>30}},{text:"FIND THE FJORD",hint:"North-east flank, a crack in the cliffs. It is not on any chart.",test:e=>e.toRear<420},{text:"SURFACE IN THE COVE",hint:"Blow ballast. The back door is above you.",test:e=>e.toRear<Y.pool*1.3&&e.depth<3}],foot:[{text:"GET INSIDE THE SKULL",hint:"The mouth above the port, or the gate at the back of the cove.",test:e=>e.area==="hall"},{text:"CROSS THE LIVE FLOOR",hint:"The stage is at the far end, under the keep.",test:e=>e.area==="hall"&&e.lz!=null&&e.lz<40},{text:"CLIMB TO THE STAGE",hint:"The vermilion ramps either side of the approach.",test:e=>e.fy!=null&&e.fy>60},{text:"TAKE THE ROOF",hint:"The stair tower on the east flank goes all the way up.",test:e=>e.fy!=null&&e.fy>230}]},tc=e=>po[e]?po[e].length:0,oc=()=>V.chain&&po[V.chain]?po[V.chain][V.step]??null:null;function Vn(e){V.chain=po[e]?e:null,V.step=0,V.hull=1,V.grip=0,V.clock=0,V.done=!1,V.banner=null,V.rev++}function pn(e,o,n=3.4){V.banner={text:e,sub:o,until:V.clock+n},V.rev++}function Kt(e,o){V.hull<=0||(V.hull=Math.max(0,V.hull-e),V.hits++,V.hull<=0?pn("HULL BREACHED","She is going down — the raid goes on without you",5):o&&e>.04&&pn(o,null,2.2),V.rev++)}function Tr(e,o){if(V.clock+=e,V.banner&&V.clock>V.banner.until&&(V.banner=null,V.rev++),!V.chain||V.done||!o)return;const n=po[V.chain],a=n[V.step];if(!a)return;let s=!1;try{s=!!a.test(o)}catch{s=!1}s&&(V.step++,V.step>=n.length?(V.done=!0,pn("OBJECTIVE COMPLETE",nc[V.chain]??"",6)):pn(n[V.step].text,n[V.step].hint,3.6),V.rev++)}const nc={helm:"Moored under the face. The alliance is ashore.",sub:"Surfaced at the back door, unseen. Law would approve.",foot:"The roof of the demon castle. The whole bay is below you."};function Er(e,{danger:o,headingX:n,headingZ:a,toCentreX:s,toCentreZ:i,speed:c,throttle:h}){if(o<=.001)return V.grip=Math.max(0,V.grip-e*.5),V.grip;const l=Math.hypot(s,i)||1,u=-s/l,b=-i/l,m=n*u+a*b,g=Math.min(1,Math.abs(c)/22),x=o*.42,f=Math.max(0,m)*g*(.35+.45*Math.min(1,Math.abs(h)));return V.grip=Math.max(0,Math.min(1,V.grip+(x-f)*e)),V.grip}const as=24,En=on.safe,ss=on.range,vo=2.1,ac=1.5,rs=22,sc=[Ut,uo],rc=new pt,Rn=new z,is=new kt,An=new z;function ic({quality:e="high"}){const o=w.useRef(),n=w.useMemo(()=>Array.from({length:as},()=>({live:!1,x:0,z:0,y0:0,t:0})),[]),a=w.useRef(0),s=w.useMemo(()=>{const i=new Js(.55,1,1,e==="low"?6:10,1,!0);return i.translate(0,.5,0),i},[e]);return ae((i,c)=>{const h=o.current;if(!h)return;const l=Math.min(c,.05),u=y.helm;if(y.helmActive&&u&&!u.onFoot&&!u.sub&&!u.moored){let g=null,x=1/0;for(const f of sc){const p=Math.hypot(u.x,u.z-f);p<En||p>ss||p<x&&(x=p,g=f)}if(g!==null&&(a.current-=l,a.current<=0)){const f=1-R.clamp((x-En)/(ss-En),0,1);a.current=R.lerp(4.5,1.9,f);const p=n.find(d=>!d.live);if(p){const d=vo*.55,v=R.lerp(230,105,f);p.x=u.x+Math.sin(u.heading)*u.speed*d+(Math.random()-.5)*v,p.z=u.z+Math.cos(u.heading)*u.speed*d+(Math.random()-.5)*v,p.y0=210+Math.random()*60,p.t=0,p.live=!0}}}let m=0;for(const g of n){if(!g.live)continue;const x=g.t;if(g.t+=l,g.t<vo){const f=g.t/vo;Rn.set(g.x,g.y0*(1-f*f),g.z),An.set(2.2,9,2.2)}else{if(x<vo){const d=Math.hypot(g.x-u.x,g.z-u.z);d<rs&&Kt(.03*(1-d/rs)+.008,"HIT — SHOT THROUGH THE RIGGING"),y.splash+=1}const f=(g.t-vo)/ac;if(f>=1){g.live=!1;continue}const p=Math.min(1,f*4);Rn.set(g.x,ut(g.x,g.z,y.t,1).y-4,g.z),An.set(11+f*9,78*p*(1-f*f*.75),11+f*9)}is.identity(),h.setMatrixAt(m,rc.compose(Rn,is,An)),m++}h.count=m,h.instanceMatrix.needsUpdate=!0,h.visible=m>0}),t.jsx("instancedMesh",{ref:o,args:[s,void 0,as],frustumCulled:!1,renderOrder:2,visible:!1,children:t.jsx("meshBasicMaterial",{color:X.foam,transparent:!0,opacity:.42,depthWrite:!1,toneMapped:!1,blending:it,side:Be})})}const lc=`
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
`,cc=`
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
`,ls={low:700,mid:1800,high:3200},Do=260;function hc({quality:e}){const o=w.useRef(),n=w.useRef(),a=xe(c=>c.camera),s=w.useMemo(()=>{const c=ls[e]??ls.high,h=new Float32Array(c*3),l=new Float32Array(c),u=new Float32Array(c),b=new Float32Array(c);for(let g=0;g<c;g++)h[g*3]=Math.random()*Do,h[g*3+1]=Math.random()*Do,h[g*3+2]=Math.random()*Do,l[g]=.5+Math.random()*1.4,u[g]=1.2+Math.random()*3.2,b[g]=Math.random();const m=new Lt;return m.setAttribute("position",new ee(h,3)),m.setAttribute("aSpeed",new ee(l,1)),m.setAttribute("aSize",new ee(u,1)),m.setAttribute("aPhase",new ee(b,1)),m.boundingSphere=new Zt(new z,1e6),m},[e]),i=w.useMemo(()=>({uTime:{value:0},uCam:{value:new z},uBox:{value:Do},uColor:{value:new z(...ie("#cfeee6"))},uGain:{value:0}}),[]);return ae((c,h)=>{const l=o.current?.uniforms;l&&(l.uTime.value+=h,l.uCam.value.copy(a.position),l.uGain.value=y.underwater,n.current&&(n.current.visible=y.underwater>.02))}),t.jsx("points",{ref:n,geometry:s,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:lc,fragmentShader:cc,uniforms:i,transparent:!0,depthWrite:!1,fog:!1})})}const dc=`
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
`,uc=`
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
`,cs={low:260,mid:700,high:1300},pc=`
  varying vec2 vUv;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`,fc=`
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
`,hs=1100,ds={low:[4,9],mid:[6,13],high:[8,18]};function mc({whirl:e,quality:o="high"}){const n=w.useRef(),a=w.useRef(),s=xe(h=>h.camera),i=w.useMemo(()=>{const h=o==="low"?24:o==="mid"?34:48,l=new Js(e.r*1.02,e.r*.07,hs,h,6,!0);return l.translate(e.x,-hs/2-3,e.z),l.computeBoundingSphere(),l},[e,o]),c=w.useMemo(()=>({uTime:{value:0},uDir:{value:e.dir},uGain:{value:0},uColor:{value:new z(...ie(X.foam))},uDeep:{value:new z(...ie(X.underGlow))},uCameraPos:{value:new z},uFogDensity:{value:.0062},uFogColor:{value:new z(...ie(X.underHaze))}}),[e]);return ae((h,l)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=l,u.uCameraPos.value.copy(h.camera.position),u.uFogDensity.value=h.scene.fog?.density??.0062;const b=h.scene.fog?.color;b&&u.uFogColor.value.set(b.r,b.g,b.b);const m=Math.hypot(s.position.x-e.x,s.position.z-e.z),[g,x]=ds[o]??ds.high,f=1-R.smoothstep(m,e.r*g,e.r*x);u.uGain.value+=(y.underwater*f-u.uGain.value)*Math.min(1,l*4),a.current&&(a.current.visible=u.uGain.value>.012)}),t.jsx("mesh",{ref:a,geometry:i,renderOrder:2,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:pc,fragmentShader:fc,uniforms:c,transparent:!0,depthWrite:!1,side:Be,blending:it,fog:!1})})}function gc({whirl:e,quality:o}){const n=w.useRef(),a=w.useRef(),s=xe(h=>h.camera),i=w.useMemo(()=>{const h=cs[o]??cs.high,l=new Float32Array(h*3),u=new Float32Array(h),b=new Float32Array(h),m=new Float32Array(h),g=new Float32Array(h),x=new Float32Array(h);for(let p=0;p<h;p++)u[p]=Math.random()*Math.PI*2,b[p]=Math.random(),m[p]=.07+Math.random()*.1,g[p]=.12+Math.pow(Math.random(),1.8)*.5,x[p]=2+Math.random()*5;const f=new Lt;return f.setAttribute("position",new ee(l,3)),f.setAttribute("aAngle",new ee(u,1)),f.setAttribute("aPhase",new ee(b,1)),f.setAttribute("aRate",new ee(m,1)),f.setAttribute("aRadius",new ee(g,1)),f.setAttribute("aSize",new ee(x,1)),f.boundingSphere=new Zt(new z(e.x,-180,e.z),e.r+260),f},[o,e]),c=w.useMemo(()=>({uTime:{value:0},uCentre:{value:new sa(e.x,e.z)},uR:{value:e.r},uDir:{value:e.dir},uDepth:{value:340},uColor:{value:new z(...ie(X.underGlow))},uGain:{value:0}}),[e]);return ae((h,l)=>{const u=n.current?.uniforms;if(!u)return;u.uTime.value+=l;const b=Math.hypot(s.position.x-e.x,s.position.z-e.z),m=1-R.smoothstep(b,e.r*1.2,e.r*4);u.uGain.value=y.underwater*m,a.current&&(a.current.visible=u.uGain.value>.015)}),t.jsx("points",{ref:a,geometry:i,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:n,vertexShader:dc,fragmentShader:uc,uniforms:c,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}function Rr(e){if(typeof document>"u")return null;const o=document.createElement("canvas");o.width=o.height=128;const n=o.getContext("2d");n.fillStyle="#fff",e(n);const a=new Xt(o);return a.needsUpdate=!0,a}const us=Rr(e=>{e.beginPath(),e.moveTo(64,16),e.bezierCurveTo(92,22,122,58,116,78),e.bezierCurveTo(104,74,84,62,70,60),e.lineTo(68,120),e.lineTo(60,120),e.lineTo(58,60),e.bezierCurveTo(44,62,24,74,12,78),e.bezierCurveTo(6,58,36,22,64,16),e.closePath(),e.fill()}),xc=Rr(e=>{const o=e.createRadialGradient(64,44,4,64,52,46);o.addColorStop(0,"rgba(255,255,255,1)"),o.addColorStop(.55,"rgba(255,255,255,0.55)"),o.addColorStop(1,"rgba(255,255,255,0)"),e.fillStyle=o,e.beginPath(),e.ellipse(64,46,34,28,0,Math.PI,0),e.bezierCurveTo(96,62,84,70,64,68),e.bezierCurveTo(44,70,32,62,30,46),e.closePath(),e.fill(),e.strokeStyle="rgba(255,255,255,0.5)",e.lineCap="round";for(let n=0;n<7;n++){const a=38+n*9;e.lineWidth=3.2-Math.abs(n-3)*.5,e.beginPath(),e.moveTo(a,64),e.quadraticCurveTo(a+(n%2?7:-7),92,a+(n%2?-4:4),120),e.stroke()}}),ps={low:0,mid:5,high:11},st=420;function bc({quality:e="high"}){const o=w.useRef(),n=xe(h=>h.camera),a=ps[e]??ps.high,s=w.useMemo(()=>Array.from({length:a},(h,l)=>{const u=l%3===2;return{jelly:u,home:[l*97.13%1*st,l*41.77%1*st,l*63.31%1*st],r:u?8+l*29.7%1*18:46+l*29.7%1*90,rate:u?.02+l*17.3%1*.03:.045+l*17.3%1*.055,phase:l*53.9%1*Math.PI*2,size:u?9+l*71.1%1*13:22+l*71.1%1*26}}),[a]),i=w.useRef([]),c=(h,l)=>(h%l+l)%l;return ae((h,l)=>{const u=o.current;if(!u)return;const b=1-R.smoothstep(y.depthBelow,120,330),m=R.smoothstep(y.depthBelow,90,260),g=y.underwater*Math.max(b,m);if(u.visible=g>.02,!u.visible)return;const x=y.t;for(let f=0;f<s.length;f++){const p=s[f],d=i.current[f];if(!d)continue;const v=p.phase+x*p.rate,j=p.home[0]+Math.cos(v)*p.r,S=p.home[1]+Math.sin(v*.7)*p.r*.18,k=p.home[2]+Math.sin(v)*p.r,E=n.position.x+c(j-n.position.x+st/2,st)-st/2,r=n.position.y+c(S-n.position.y+st/2,st)-st/2,T=n.position.z+c(k-n.position.z+st/2,st)-st/2;d.position.set(E,r,T);const C=1+Math.sin(x*(.5+p.rate*4)+p.phase)*.16;d.scale.set(p.size*C,p.size,1);const P=Math.hypot(E-n.position.x,r-n.position.y,T-n.position.z),M=1-R.smoothstep(P,st*.24,st*.5),G=p.jelly?m:b;d.material.opacity=y.underwater*G*M*(p.jelly?.62:.5)}}),!a||!us?null:t.jsx("group",{ref:o,visible:!1,children:s.map((h,l)=>t.jsx("sprite",{ref:u=>i.current[l]=u,renderOrder:2,children:t.jsx("spriteMaterial",{map:h.jelly?xc:us,color:h.jelly?X.underGlow:X.abyss,transparent:!0,opacity:0,depthWrite:!1,blending:h.jelly?it:si,fog:!1})},l))})}function wc({quality:e="high"}){return t.jsxs(t.Fragment,{children:[t.jsx(hc,{quality:e}),t.jsx(Mc,{quality:e}),t.jsx(bc,{quality:e}),Ue.map((o,n)=>t.jsx(gc,{whirl:o,quality:e},n)),Ue.map((o,n)=>t.jsx(mc,{whirl:o,quality:e},`w${n}`))]})}const Ho=260,fs={low:0,mid:90,high:220},yc=`
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
`,vc=`
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
`;function Mc({quality:e}){const o=w.useRef(),n=w.useRef(),a=xe(h=>h.camera),s=fs[e]??fs.high,i=w.useMemo(()=>{const h=new Float32Array(s*3),l=new Float32Array(s),u=new Float32Array(s),b=new Float32Array(s),m=new Float32Array(s),g=Math.max(1,Math.round(s/18));for(let f=0;f<s;f++){const p=f%g,d=p*97.13%1*Ho,v=p*41.77%1*Ho,j=p*63.31%1*Ho;h[f*3]=d+(Math.random()-.5)*26,h[f*3+1]=v+(Math.random()-.5)*14,h[f*3+2]=j+(Math.random()-.5)*26,l[f]=Math.random(),u[f]=.24+p%5*.05+Math.random()*.03,b[f]=2.4+Math.random()*3.4,m[f]=7+Math.random()*12}const x=new Lt;return x.setAttribute("position",new ee(h,3)),x.setAttribute("aPhase",new ee(l,1)),x.setAttribute("aRate",new ee(u,1)),x.setAttribute("aSize",new ee(b,1)),x.setAttribute("aSwing",new ee(m,1)),x.boundingSphere=new Zt(new z,1e6),x},[s]),c=w.useMemo(()=>({uTime:{value:0},uCam:{value:new z},uBox:{value:Ho},uGain:{value:0},uColor:{value:new z(...ie("#9fe0d2"))}}),[]);return ae((h,l)=>{const u=o.current?.uniforms;if(!u)return;u.uTime.value+=l,u.uCam.value.copy(a.position);const b=1-R.smoothstep(y.depthBelow,70,240);u.uGain.value+=(y.underwater*b-u.uGain.value)*Math.min(1,l*3),n.current&&(n.current.visible=u.uGain.value>.02)}),s?t.jsx("points",{ref:n,geometry:i,frustumCulled:!1,renderOrder:3,visible:!1,children:t.jsx("shaderMaterial",{ref:o,vertexShader:yc,fragmentShader:vc,uniforms:c,transparent:!0,depthWrite:!1,fog:!1})}):null}const fn=16/9,Ar=96,Ir=78;function $n(e,o,n=Ar){if(!o||o>=fn)return e;const a=R.degToRad(e)/2,s=2*Math.atan(Math.tan(a)*fn/o);return Math.min(n,R.radToDeg(s))}function Cr(e){return!e||e>=fn?1:R.clamp(.72+.28*(e/fn),.86,1)}function Kn(e,o,n,a=.06,s=Ar){const i=$n(o,e.aspect,s);Math.abs(e.fov-i)<=.05||(e.fov+=(i-e.fov)*(1-Math.pow(a,n)),e.updateProjectionMatrix())}function Pr(e,o,n,a,s=1,i=7,c=5){let h=-1/0;for(let l=0;l<=c;l++){const u=l/c,b=o.x+(n.x-o.x)*u,m=o.z+(n.z-o.z)*u,g=e(b,m,a,s).y;g>h&&(h=g)}return h+i}function Qn(e=1){const o=typeof window<"u"&&window.innerWidth||1280;return e*R.clamp(1280/o,.55,2.2)}const Lr="oni.settings.v1";function kc(){return typeof navigator>"u"?!1:typeof window<"u"&&window.matchMedia?.("(pointer: coarse)")?.matches?!0:navigator.maxTouchPoints>0}const ve={comfort:0,lookSens:1,invertY:!1,freeCam:!1,hud:!0},Xn=new Set;function jc(){for(const e of Xn)e(ve)}function ga(e){return Xn.add(e),()=>Xn.delete(e)}function xa(e,o){e in ve&&(ve[e]=o,Tc(),jc())}function co(e){xa(e,!ve[e])}function Sc(){xa("comfort",ve.comfort<.01?.55:ve.comfort<.9?1:0)}function zc(){const e=[.6,.85,1,1.35,1.8],o=e.findIndex(n=>n>=ve.lookSens-1e-6);xa("lookSens",e[(o+1)%e.length])}function Tc(){try{localStorage.setItem(Lr,JSON.stringify(ve))}catch{}}function Ec(){let e=null;try{e=JSON.parse(localStorage.getItem(Lr)||"null")}catch{e=null}if(e&&typeof e=="object")for(const o of Object.keys(ve))o!=="hud"&&typeof e[o]==typeof ve[o]&&(ve[o]=e[o]);else ve.comfort=kc()?1:0;return ve}const De=(e,o)=>e+(o-e)*ve.comfort,Mo=e=>e<-1?-1:e>1?1:e,I={throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},surfaceQueued:!1,periscopeQueued:!1,burstQueued:!1,recentreQueued:!1,swapQueued:!1,jumpQueued:!1,boardQueued:!1,pistolQueued:!1,bazookaQueued:!1,gigantQueued:!1,rocketQueued:!1,hakiQueued:!1,gear2Queued:!1,gatlingHeld:!1,balloonHeld:!1,zoom:0},Pt={level:0},Zn=new Set;function Rc(e){return Zn.add(e),()=>Zn.delete(e)}function ba(e){if(Pt.level===e)return e;Pt.level=e;for(const o of Zn)o(e);return e}function Fr(){return ba((Pt.level+1)%3)}const oe={active:!1,throttle:0,rudder:0,planes:0,boost:!1,walk:{x:0,z:0},gatling:!1,balloon:!1},Ao=new Set,bt=(...e)=>e.some(o=>Ao.has(o));function qn(){I.throttle=0,I.rudder=0,I.planes=0,I.boost=!1,I.walk.x=0,I.walk.z=0,I.surfaceQueued=!1,I.periscopeQueued=!1,I.burstQueued=!1,I.recentreQueued=!1,I.swapQueued=!1,I.jumpQueued=!1,I.boardQueued=!1,I.zoom=0,I.pistolQueued=!1,I.bazookaQueued=!1,I.gigantQueued=!1,I.rocketQueued=!1,I.hakiQueued=!1,I.gear2Queued=!1,I.gatlingHeld=!1,I.balloonHeld=!1,oe.gatling=!1,oe.balloon=!1,ba(0),oe.throttle=0,oe.rudder=0,oe.planes=0,oe.boost=!1,oe.walk.x=0,oe.walk.z=0,Ao.clear()}function Ac(){const e=s=>!!s&&(s.isContentEditable||/^(input|textarea|select)$/i.test(s.tagName??"")),o=s=>{if(s.metaKey||s.ctrlKey||s.altKey||e(s.target))return;const i=s.key.toLowerCase();Ao.add(i),i==="f"&&(I.surfaceQueued=!0),i==="p"&&(I.periscopeQueued=!0),i==="b"&&!s.repeat&&(I.burstQueued=!0),i==="r"&&!s.repeat&&(I.recentreQueued=!0),i==="v"&&!s.repeat&&co("freeCam"),i==="."&&!s.repeat&&co("hud"),i==="x"&&!s.repeat&&Fr(),i==="y"&&!s.repeat&&(I.swapQueued=!0),i===" "&&!s.repeat&&(I.jumpQueued=!0),i==="t"&&!s.repeat&&(I.boardQueued=!0),i==="j"&&!s.repeat&&(I.pistolQueued=!0),i==="k"&&!s.repeat&&(I.bazookaQueued=!0),i==="l"&&!s.repeat&&(I.gigantQueued=!0),i==="g"&&!s.repeat&&(I.rocketQueued=!0),i==="h"&&!s.repeat&&(I.hakiQueued=!0),i==="n"&&!s.repeat&&(I.gear2Queued=!0),[" ","arrowup","arrowdown","arrowleft","arrowright"].includes(i)&&s.preventDefault()},n=s=>Ao.delete(s.key.toLowerCase()),a=()=>qn();return window.addEventListener("keydown",o,{passive:!1}),window.addEventListener("keyup",n),window.addEventListener("blur",a),()=>{window.removeEventListener("keydown",o),window.removeEventListener("keyup",n),window.removeEventListener("blur",a),Ao.clear()}}function Ic(){const e=bt("w","arrowup")?1:0,o=bt("s","arrowdown")?1:0,n=bt("a","arrowleft")?1:0,a=bt("d","arrowright")?1:0,s=bt("q"," ")?1:0,i=bt("e","c")?1:0,c=Mo(e-o+oe.throttle);c<-.05&&Pt.level&&ba(0),I.throttle=Pt.level>0?Math.max(c,1):c,I.rudder=Mo(n-a+oe.rudder),I.planes=Mo(s-i+oe.planes),I.boost=bt("shift")||oe.boost||Pt.level===2,I.zoom=(bt("]","=","+")?1:0)-(bt("[","-","_")?1:0),I.gatlingHeld=bt("u")||oe.gatling,I.balloonHeld=bt("i")||oe.balloon,I.walk.x=Mo(a-n+oe.walk.x),I.walk.z=Mo(e-o+oe.walk.z)}const Jn=[0,(Pe[0].y+Pe[1].y)/2,Pe[0].z],Gr=[de.x,de.y,de.z],mn=Y.dir,Or=[Y.x+mn[0]*300,-36,Y.z+mn[1]*300],Nr=[Y.x+mn[0]*46,34,Y.z+mn[1]*46],Dr=[Y.gate.x,4,Y.gate.z],Hr=[Y.gate.x,22,Y.gate.z],Cc=1.55,ea=H/Cc,Pc=1+(ea-1)*.35,zt=[{id:"sea",title:"THE SEA IS FOR PIRATES",sub:"Wano Country · night of the Fire Festival",dur:13,fov:52,from:[-294,31,1364],to:[-186,23,1150],lookFrom:[62,140,465],lookTo:[16,108,294],swell:1},{id:"fleet",title:"THE ALLIANCE SAILS",sub:"Nine Red Scabbards · Straw Hats · Heart · Kid · Mink · Yakuza",dur:12,fov:46,from:[304,38,1299],to:[229,31,1150],lookFrom:[121,65,760],lookTo:[62,90,577],swell:1},{id:"torii",title:"THE TORII",sub:"First line of defence — the gate at sea",dur:14,fov:58,from:[53,24,877],to:[9,62,580],lookFrom:[0,115,400],lookTo:[0,205,400],swell:.7},{id:"neck",title:"THROUGH THE GATE",sub:"The channel — the only way in",dur:12,fov:64,from:[0,36,521],to:[-22,89,198],lookFrom:[0,161,186],lookTo:[-31,326,-232],swell:.35},{id:"bay",title:"ONIGASHIMA",sub:"鬼ヶ島 — the island of demons",dur:15,fov:56,from:[-31,134,276],to:[-81,182,68],lookFrom:[0,310,-264],lookTo:Jn,swell:.12},{id:"port",title:"THE PORT",sub:"Lanterns, and a sword in the ground",dur:13,fov:48,from:[143,55,102],to:[53,43,-12],lookFrom:[-149,59,-161],lookTo:[-53,205,-276],swell:.06},{id:"backdoor",title:"THE BACK DOOR",sub:"Heart Pirates — under the maelstroms, up the hidden fjord",dur:12,fov:60,from:Or,to:Nr,lookFrom:Dr,lookTo:Hr,swell:0},{id:"face",title:"KAIDOU OF THE BEASTS",sub:"Skull Dome — the raid begins",dur:17,fov:50,from:[-149,41,40],to:[16,360,189],lookFrom:Gr,lookTo:Jn,swell:0}],Lc=new Set([Jn,Gr,Or,Nr,Dr,Hr]),_o=e=>Lc.has(e)?e:[e[0]*ea,e[1]*Pc,e[2]*ea];for(const e of zt)e.from=_o(e.from),e.to=_o(e.to),e.lookFrom=_o(e.lookFrom),e.lookTo=_o(e.lookTo);const ta=zt.reduce((e,o)=>e+o.dur,0),ms=zt,Fc=e=>e*e*(3-2*e),Gc=e=>1-Math.pow(1-e,2.2),Bo=e=>new z(e[0],e[1],e[2]),_t={dist:[24,3600],pitch:[-.95,1.44],y:[-260,1500],xz:4200};function Oc(e,o){w.useEffect(()=>{if(!e)return;const n=o.domElement,a=new Map;let s=0,i=null;const c=(m,g)=>{const x=y.orbit,f=x.dist*.0016,p=Math.cos(x.yaw),d=-Math.sin(x.yaw);x.target.x-=p*m*f,x.target.z-=d*m*f;const v=Math.cos(x.pitch),j=Math.sin(x.pitch);x.target.y+=g*f*v,x.target.x+=Math.sin(x.yaw)*g*f*j,x.target.z+=Math.cos(x.yaw)*g*f*j,_r()},h=m=>{a.set(m.pointerId,{x:m.clientX,y:m.clientY});try{n.setPointerCapture?.(m.pointerId)}catch{}if(a.size===2){const[g,x]=[...a.values()];s=Math.hypot(g.x-x.x,g.y-x.y),i={x:(g.x+x.x)/2,y:(g.y+x.y)/2}}},l=m=>{const g=a.get(m.pointerId);if(!g)return;const x=m.clientX-g.x,f=m.clientY-g.y;if(g.x=m.clientX,g.y=m.clientY,a.size>=2){const[p,d]=[...a.values()],v=Math.hypot(p.x-d.x,p.y-d.y),j={x:(p.x+d.x)/2,y:(p.y+d.y)/2};if(s>8&&v>8){const S=y.orbit;S.dist=R.clamp(S.dist*(s/v),..._t.dist)}i&&c(j.x-i.x,j.y-i.y),s=v,i=j,m.cancelable&&m.preventDefault();return}if(m.shiftKey||m.buttons===4)c(x,f);else{const p=y.orbit;p.yaw-=x*.005*Qn(),p.pitch=R.clamp(p.pitch+f*.004*Qn(),..._t.pitch)}m.cancelable&&m.preventDefault()},u=m=>{a.delete(m.pointerId)&&a.size<2&&(s=0,i=null)},b=m=>{m.preventDefault();const g=y.orbit;g.dist=R.clamp(g.dist*(1+Math.sign(m.deltaY)*.11),..._t.dist)};return n.addEventListener("pointerdown",h),n.addEventListener("pointermove",l,{passive:!1}),n.addEventListener("pointerup",u),n.addEventListener("pointercancel",u),window.addEventListener("pointerup",u),n.addEventListener("wheel",b,{passive:!1}),()=>{n.removeEventListener("pointerdown",h),n.removeEventListener("pointermove",l),n.removeEventListener("pointerup",u),n.removeEventListener("pointercancel",u),window.removeEventListener("pointerup",u),n.removeEventListener("wheel",b),a.clear()}},[e,o])}function _r(){const e=y.orbit;e.target.x=R.clamp(e.target.x,-4200,_t.xz),e.target.z=R.clamp(e.target.z,-4200,_t.xz),e.target.y=R.clamp(e.target.y,..._t.y)}function Nc({onRails:e,playing:o,speed:n=1,onShot:a,idle:s=!1}){const i=xe(b=>b.camera),c=xe(b=>b.gl),h=w.useRef(0),l=w.useRef(-1),u=w.useRef(new z(0,150,-260));return Oc(!e&&!s,c),w.useEffect(()=>{if(e)return;const b=y.orbit,m=i.position.clone().sub(b.target);b.dist=R.clamp(m.length(),..._t.dist),b.yaw=Math.atan2(m.x,m.z),b.pitch=Math.asin(R.clamp(m.y/(m.length()||1),-1,1))},[e,i]),ae((b,m)=>{if(s)return;const g=Math.min(m,.05);if(y.t+=g,e){if(y.jumpTo!=null){let P=0;for(let M=0;M<y.jumpTo&&M<zt.length;M++)P+=zt[M].dur;h.current=P,y.jumpTo=null}o&&(h.current=(h.current+g*n)%ta);let v=0,j=0;for(;j<zt.length&&!(h.current<v+zt[j].dur);j++)v+=zt[j].dur;const S=zt[Math.min(j,zt.length-1)],k=R.clamp((h.current-v)/S.dur,0,1);l.current!==j&&(l.current=j,y.shot=j,a?.(j,S));const E=Bo(S.from).lerp(Bo(S.to),Gc(k)),r=Bo(S.lookFrom).lerp(Bo(S.lookTo),Fc(k)),T=S.swell??0;if(T>0){const P=y.t;E.y+=Math.sin(P*.62)*3.1*T+Math.sin(P*1.31+1.2)*1.2*T,E.x+=Math.sin(P*.44+.6)*2.2*T}E.x+=Math.sin(y.t*.83)*.35,E.y+=Math.sin(y.t*1.17+2)*.28,i.position.copy(E),u.current.lerp(r,1-Math.pow(1e-4,g)),i.lookAt(u.current),T>0&&i.rotateZ(Math.sin(y.t*.51)*.024*T);const C=$n(S.fov,i.aspect);Math.abs(i.fov-C)>.01&&(i.fov+=(C-i.fov)*(1-Math.pow(.02,g)),i.updateProjectionMatrix()),y.progress=h.current/ta}else{const v=y.orbit;I.recentreQueued&&(I.recentreQueued=!1,v.target.set(F.x,F.baseY*.55,F.z),v.dist=R.clamp(v.dist,260,1400));const j=I.walk.x,S=I.walk.z;if(j||S||I.planes||I.zoom){const r=v.dist*(I.boost?1.9:.7)*g,T=-Math.sin(v.yaw),C=-Math.cos(v.yaw);v.target.x+=(T*S-C*j)*r,v.target.z+=(C*S+T*j)*r,v.target.y+=I.planes*r,v.dist=R.clamp(v.dist*(1-I.zoom*.9*g),..._t.dist),_r()}const k=Math.cos(v.pitch);i.position.set(v.target.x+Math.sin(v.yaw)*k*v.dist,v.target.y+Math.sin(v.pitch)*v.dist,v.target.z+Math.cos(v.yaw)*k*v.dist),i.lookAt(v.target);const E=$n(55,i.aspect);Math.abs(i.fov-E)>.01&&(i.fov+=(E-i.fov)*(1-Math.pow(.02,g)),i.updateProjectionMatrix()),y.t+=0}const x=Co(i.position.x,i.position.z);y.shelter+=(x-y.shelter)*(1-Math.pow(.06,g)),y.fog=R.lerp(Bt.sea,Bt.bay,y.shelter),y.rain=1-y.shelter*.92;const f=ut(i.position.x,i.position.z,y.t,1),p=R.clamp((f.y-i.position.y-1)/3,0,1);y.underwater+=(p-y.underwater)*(1-Math.pow(.002,g)),y.depthBelow=Math.max(0,f.y-i.position.y);const d=R.lerp(8200,1700,y.underwater);Math.abs(i.far-d)>20&&(i.far=d,i.updateProjectionMatrix()),b.camera.updateMatrixWorld()}),null}const gs={low:[24,16],mid:[40,26],high:[56,36]};function Dc({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=w.useMemo(()=>{const[g,x]=gs[e]??gs.high,f=new ri(1,g,x),p=f.attributes.position,d=new Float32Array(p.count*3),[v,j,S]=Fe.centre,[k,E,r]=Fe.radii,T=new ze("#241c22"),C=new ze(A.rockWarm),P=new ze;for(let M=0;M<p.count;M++){const G=p.getX(M),L=p.getY(M),W=p.getZ(M),K=1+(ho(G*2.4+5,W*2.4-9,3)-.5)*.14;p.setXYZ(M,v+G*k*K,j+L*E*K,S+W*r*K);const fe=R.clamp((L+.2)/1.2,0,1);P.copy(T).lerp(C,(1-fe)*.55),d[M*3]=P.r,d[M*3+1]=P.g,d[M*3+2]=P.b}return f.setAttribute("color",new ee(d,3)),f.computeVertexNormals(),f},[e]),{stairM:i,brazierM:c,bayM:h,tableM:l,jarM:u,westStairM:b}=w.useMemo(()=>{const g=new pt,x=new kt,f=new z(1,1,1),p=new z,d=[];for(let O=0;O<xt.steps;O++){const $=O/(xt.steps-1);p.set(0,R.lerp(He.y,ce.y+2,$),R.lerp(xt.zTop,xt.zBottom,$)),x.identity(),d.push(g.clone().compose(p,x,f))}const v=[],j=e==="low"?5:9;for(const O of[-1,1])for(let $=0;$<j;$++){const te=$/(j-1);p.set(O*176,ce.y+9,R.lerp(ce.zFront-40,ce.zBack+40,te)),x.identity(),v.push(g.clone().compose(p,x,f))}for(let O=0;O<6;O++)p.set(-110+O*44,ce.y+9,N.z+N.halfZ+54),x.identity(),v.push(g.clone().compose(p,x,f));const S=[],k=e==="low"?5:9;for(const O of[-1,1])for(let $=0;$<ke.tiers;$++)for(let te=0;te<k;te++){const se=te/(k-1);p.set(O*(ke.x-$*26),ke.y+$*ke.tierRise,R.lerp(-205,ke.halfZ,se)),x.identity(),S.push(g.clone().compose(p,x,f))}const E=[],r=[],T=new kt,C=new z(0,1,0);let P=24301;const M=()=>(P=Math.imul(P,1664525)+1013904223>>>0,P/4294967296),G=e==="low"?1:2,L=e==="low"?5:8;for(const O of[-1,1])for(let $=0;$<G;$++)for(let te=0;te<L;te++){const se=O*(96+$*52+(M()-.5)*14),me=R.lerp(ce.zBack+120,ce.zFront-60,te/(L-1))+(M()-.5)*16;if(!(Math.abs(se)<Ae.halfX+24&&Math.abs(me-Ae.z)<Ae.halfZ+20)&&!(Math.abs(Math.abs(se)-we.x)<26&&me<we.zFoot+16&&me>we.zTop-8)){p.set(se,ce.y+2.4,me),T.setFromAxisAngle(C,(M()-.5)*.5),E.push(g.clone().compose(p,T,f));for(let ue=0;ue<2;ue++)p.set(se+(M()-.5)*30,ce.y+3.5,me+(M()>.5?8:-8)+(M()-.5)*6),T.setFromAxisAngle(C,M()*Math.PI),r.push(g.clone().compose(p,T,f))}}const W=[],K=16,fe=O=>O*O*(3-2*O);for(let O=0;O<=K;O++){const $=O/K;p.set(-252,fe($)*(ke.y-.5)-1.3,R.lerp(45,-45,$)),x.identity(),W.push(g.clone().compose(p,x,f))}return{stairM:d,brazierM:v,bayM:S,tableM:E,jarM:r,westStairM:W}},[e]);ae(()=>{const g=y.t;n.current&&(n.current.material.emissiveIntensity=2.6+Math.sin(g*4.1)*.3+Math.sin(g*9.3)*.15),a.current&&(a.current.material.emissiveIntensity=.85+Math.sin(g*.9)*.12)});const m=o;return t.jsxs("group",{children:[t.jsx("mesh",{geometry:s,side:On,receiveShadow:m,frustumCulled:!1,children:t.jsx("meshStandardMaterial",{vertexColors:!0,side:On,roughness:.97,metalness:.02})}),[[0,(ce.zFront+Ae.z+Ae.halfZ)/2,ce.halfX*2,ce.zFront-Ae.z-Ae.halfZ],[0,(ce.zBack+Ae.z-Ae.halfZ)/2,ce.halfX*2,Ae.z-Ae.halfZ-ce.zBack],[-342/2-20,Ae.z,ce.halfX*2-Ae.halfX*2,Ae.halfZ*2],[(Ae.halfX+ce.halfX)/2+20,Ae.z,ce.halfX*2-Ae.halfX*2,Ae.halfZ*2]].map(([g,x,f,p],d)=>t.jsxs("mesh",{position:[g,ce.y-3,x],receiveShadow:m,children:[t.jsx("boxGeometry",{args:[Math.abs(f),6,Math.abs(p)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},d)),t.jsxs("mesh",{ref:a,position:[Ae.x,ot.ceiling+2,Ae.z],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[Ae.halfX*2,Ae.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#7fd6a0",emissive:"#2f8f5c",emissiveIntensity:.85,toneMapped:!1,side:Be})]}),t.jsxs("mesh",{position:[0,He.y-4,He.z],receiveShadow:m,castShadow:m,children:[t.jsx("boxGeometry",{args:[He.halfX*2.6,8,He.depth]}),t.jsx("meshStandardMaterial",{color:"#3f3126",roughness:.94})]}),t.jsxs("instancedMesh",{ref:null,args:[null,null,i.length],receiveShadow:m,children:[t.jsx("boxGeometry",{args:[xt.halfX*2,3.2,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Hc,{matrices:i})]}),[-1,1].map(g=>Array.from({length:ke.tiers},(x,f)=>t.jsxs("mesh",{position:[g*(ke.x-f*26),ke.y+f*ke.tierRise-4,0],receiveShadow:m,castShadow:m,children:[t.jsx("boxGeometry",{args:[76-f*6,7,ke.halfZ*2+40]}),t.jsx("meshStandardMaterial",{color:A.timber,roughness:.92})]},`${g}-${f}`))),t.jsxs("instancedMesh",{args:[null,null,h.length],children:[t.jsx("boxGeometry",{args:[3,15,22]}),t.jsx("meshStandardMaterial",{color:"#e8c98d",emissive:A.lanternFar,emissiveIntensity:1.05,roughness:.9}),t.jsx(Wc,{matrices:h})]}),t.jsxs("instancedMesh",{args:[null,null,l.length],castShadow:m,receiveShadow:m,children:[t.jsx("boxGeometry",{args:[30,4.4,10]}),t.jsx("meshStandardMaterial",{color:"#5c3f28",roughness:.9}),t.jsx(_c,{matrices:l})]}),t.jsxs("instancedMesh",{args:[null,null,u.length],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[2.6,3.2,7,8]}),t.jsx("meshStandardMaterial",{color:"#b8a06a",roughness:.85}),t.jsx(Bc,{matrices:u})]}),t.jsxs("instancedMesh",{args:[null,null,b.length],castShadow:m,receiveShadow:m,children:[t.jsx("boxGeometry",{args:[74,2.6,6.4]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Uc,{matrices:b})]}),t.jsxs("instancedMesh",{args:[null,null,c.length],castShadow:m,children:[t.jsx("cylinderGeometry",{args:[7,4.5,12,8]}),t.jsx("meshStandardMaterial",{color:"#22201f",roughness:.7,metalness:.5}),t.jsx(Yc,{matrices:c})]}),t.jsxs("instancedMesh",{ref:n,args:[null,null,c.length],children:[t.jsx("sphereGeometry",{args:[5.4,8,6]}),t.jsx("meshStandardMaterial",{color:A.furnace,emissive:A.ember,emissiveIntensity:2.6,toneMapped:!1}),t.jsx(Vc,{matrices:c})]}),t.jsxs("mesh",{position:[0,ot.y-4,0],receiveShadow:m,children:[t.jsx("boxGeometry",{args:[ot.halfX*2,8,ot.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#2a2622",roughness:.96})]}),[-1,1].map(g=>[-1,0,1].map(x=>t.jsxs("mesh",{position:[g*120,(ot.y+ce.y)/2,x*96],castShadow:m,children:[t.jsx("boxGeometry",{args:[26,Math.abs(ce.y-ot.y),26]}),t.jsx("meshStandardMaterial",{color:X.rock,roughness:.95})]},`${g}-${x}`)))]})}function Hc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function _c({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function Bc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function Uc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function Wc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function Yc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o})}function Vc({matrices:e}){const o=w.useRef();return t.jsx(qt,{matrices:e,selfRef:o,offsetY:9})}function qt({matrices:e,offsetY:o=0}){const n=w.useRef(),a=w.useRef(!1);return ae(()=>{if(a.current)return;const s=n.current?.parent;if(!s?.isInstancedMesh)return;const i=new pt,c=new pt().makeTranslation(0,o,0);for(let h=0;h<Math.min(e.length,s.count);h++)i.copy(e[h]).multiply(c),s.setMatrixAt(h,i);s.instanceMatrix.needsUpdate=!0,s.computeBoundingSphere(),a.current=!0}),t.jsx("object3D",{ref:n})}const xs=(()=>{if(typeof document>"u")return null;const e=256,o=128,n=document.createElement("canvas");n.width=e,n.height=o;const a=n.getContext("2d"),s=a.createRadialGradient(e/2,o*.62,8,e/2,o*.62,e*.62);s.addColorStop(0,"#fff3c4"),s.addColorStop(.32,"#ffc95e"),s.addColorStop(.66,"#e06120"),s.addColorStop(1,"#7e1c14"),a.fillStyle=s,a.fillRect(0,0,e,o),a.globalAlpha=.14,a.fillStyle="#fff3c4";for(let c=0;c<12;c++){const h=c/12*Math.PI*2;a.save(),a.translate(e/2,o*.62),a.rotate(h),a.fillRect(-3,0,6,e),a.restore()}a.globalAlpha=.22,a.fillStyle="#5e1610";for(let c=8;c<e;c+=22)a.fillRect(c,0,3,o);a.globalAlpha=1;const i=new Xt(n);return i.colorSpace=go,i})();function $c(e,o,n,a){const s=e+a,i=o+a,c=new Float32Array([-s,0,i,s,0,i,e*.18,n,o*.18,-s,0,i,e*.18,n,o*.18,-e*.18,n,o*.18,s,0,i,s,0,-i,e*.18,n,-o*.18,s,0,i,e*.18,n,-o*.18,e*.18,n,o*.18,s,0,-i,-s,0,-i,-e*.18,n,-o*.18,s,0,-i,-e*.18,n,-o*.18,e*.18,n,-o*.18,-s,0,-i,-s,0,i,-e*.18,n,o*.18,-s,0,-i,-e*.18,n,o*.18,-e*.18,n,-o*.18]),h=new Lt;return h.setAttribute("position",new ee(c,3)),h.computeVertexNormals(),h}function Kc({quality:e="high",shadows:o=!0}){const n=w.useRef(),a=w.useRef(),s=rt("keep-hf.opt.glb"),i=w.useMemo(()=>{const h=[];for(let l=0;l<N.storeys;l++){const u=1-(l+1)*N.taper,b=N.plinth+l*N.storey;h.push({i:l,y:b,halfX:N.halfX*u,halfZ:N.halfZ*u,roof:$c(N.halfX*u,N.halfZ*u,l===N.storeys-1?30:16,11)})}return h},[]);ae(()=>{const h=y.t;n.current&&(n.current.material.emissiveIntensity=2.2+Math.sin(h*2.2)*.3),a.current&&(a.current.material.emissiveIntensity=2.3+Math.sin(h*3.3)*.25)});const c=o;return t.jsxs("group",{position:[0,N.baseY,N.z],children:[t.jsxs("mesh",{position:[0,N.plinth/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[N.halfX*2.2,N.plinth,N.halfZ*2.2]}),t.jsx("meshStandardMaterial",{color:"#4a4640",roughness:.96})]}),s&&t.jsx(ye,{name:"keep-hf.opt.glb",height:N.plinth+N.storeys*N.storey+26,position:[0,N.plinth*.5,0],tint:"#9a8468",emissive:A.emberDeep,emissiveIntensity:.14}),!s&&i.map(h=>t.jsxs("group",{position:[0,h.y,0],children:[t.jsxs("mesh",{position:[0,N.storey/2,0],castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2,N.storey,h.halfZ*2]}),t.jsx("meshStandardMaterial",{color:"#d8cdb6",roughness:.9})]}),t.jsxs("mesh",{position:[0,N.storey*.55,h.halfZ+.6],children:[t.jsx("planeGeometry",{args:[h.halfX*1.75,N.storey*.38]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:1.5,toneMapped:!1})]}),t.jsxs("mesh",{position:[0,N.storey*.02,h.halfZ+8],castShadow:c,children:[t.jsx("boxGeometry",{args:[h.halfX*2+20,3,2.4]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.72})]}),t.jsxs("mesh",{position:[0,N.storey-1.4,0],children:[t.jsx("boxGeometry",{args:[h.halfX*2+3,1.6,h.halfZ*2+3]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.4,metalness:.7})]}),t.jsx("mesh",{geometry:h.roof,position:[0,N.storey,0],castShadow:c,receiveShadow:c,children:t.jsx("meshStandardMaterial",{color:"#2e3038",roughness:.72,metalness:.14,flatShading:!0})})]},h.i)),[-1,1].map(h=>t.jsxs("mesh",{position:[h*14,N.plinth+N.storeys*N.storey+30,0],rotation:[0,0,h*.4],castShadow:c,children:[t.jsx("coneGeometry",{args:[5,15,5]}),t.jsx("meshStandardMaterial",{color:"#c9a227",roughness:.35,metalness:.85})]},h)),t.jsxs("group",{position:[0,Ce.y,Ce.z-N.z],children:[t.jsxs("mesh",{castShadow:c,receiveShadow:c,children:[t.jsx("boxGeometry",{args:[Ce.halfX*2,7,Ce.depth]}),t.jsx("meshStandardMaterial",{color:"#3a2a1e",roughness:.9})]}),t.jsxs("mesh",{ref:n,position:[0,26,-40/2],children:[t.jsx("planeGeometry",{args:[Ce.halfX*2,48]}),t.jsx("meshStandardMaterial",{color:A.furnace,emissive:"#ffffff",emissiveMap:xs,map:xs,emissiveIntensity:2.2,toneMapped:!1,side:Be})]}),t.jsx(ye,{name:"oni-throne.opt.glb",height:he("oni-throne.opt.glb"),position:[0,3.5,-8],rotation:0,tint:"#8a7f78",emissive:"#2a0e0a",emissiveIntensity:.25,fallback:t.jsxs("group",{position:[0,3.5,-8],scale:he("oni-throne.opt.glb")/38,children:[t.jsxs("mesh",{position:[0,6,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[18,12,14]}),t.jsx("meshStandardMaterial",{color:"#1c1a20",roughness:.6,metalness:.5})]}),t.jsxs("mesh",{position:[0,10.5,0],children:[t.jsx("boxGeometry",{args:[14,3,11]}),t.jsx("meshStandardMaterial",{color:"#6e1712",roughness:.9})]}),t.jsxs("mesh",{position:[0,20,-5],castShadow:c,children:[t.jsx("boxGeometry",{args:[16,20,3.4]}),t.jsx("meshStandardMaterial",{color:"#221e26",roughness:.6,metalness:.5})]}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*8,32,-5],rotation:[0,0,h*-.55],castShadow:c,children:[t.jsx("coneGeometry",{args:[2.2,12,6]}),t.jsx("meshStandardMaterial",{color:"#d8cbb2",roughness:.55})]},h))]})}),t.jsx(ye,{name:"kagura-stage.opt.glb",height:he("kagura-stage.opt.glb"),position:[0,3.5,-15],rotation:Math.PI,tint:"#c9743a",emissive:A.emberDeep,emissiveIntensity:.3,fallback:null}),[-1,1].map(h=>t.jsxs("mesh",{position:[h*Ce.halfX*.9,28,Ce.depth/2-4],castShadow:c,children:[t.jsx("cylinderGeometry",{args:[3.4,4,52,8]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.7})]},h)),t.jsxs("mesh",{position:[0,56,0],castShadow:c,children:[t.jsx("boxGeometry",{args:[Ce.halfX*2.3,5,Ce.depth+22]}),t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.72})]}),[-1,1].map(h=>t.jsx(ye,{name:"oni-daiko.opt.glb",height:he("oni-daiko.opt.glb"),position:[h*(Ce.halfX-22),4,4],rotation:h*.4,tint:"#c98a5a",fallback:t.jsx("group",{position:[0,he("oni-daiko.opt.glb")/2,0],rotation:[0,0,Math.PI/2],scale:he("oni-daiko.opt.glb")/22,children:t.jsxs("mesh",{castShadow:c,children:[t.jsx("cylinderGeometry",{args:[11,11,15,14]}),t.jsx("meshStandardMaterial",{color:"#8e2118",roughness:.7})]})})},h))]}),t.jsxs("instancedMesh",{ref:a,args:[null,null,18],children:[t.jsx("cylinderGeometry",{args:[3.4,3.4,6,8]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.3,toneMapped:!1}),t.jsx(Qc,{})]})]})}function Qc(){const e=w.useRef(),o=w.useRef(!1);return ae(()=>{if(o.current)return;const n=e.current?.parent;if(!n?.isInstancedMesh)return;const a=new pt,s=new z,i=new kt,c=new z(1,1,1);for(let h=0;h<n.count;h++){const l=h/(n.count-1)*2-1;s.set(l*(N.halfX+26),Ce.y+74-(1-l*l)*20,N.halfZ+22),n.setMatrixAt(h,a.compose(s,i,c))}n.instanceMatrix.needsUpdate=!0,n.computeBoundingSphere(),o.current=!0}),t.jsx("object3D",{ref:e})}function Xc({shadows:e=!0}){const{slabs:o,flights:n,tower:a}=ar,s=w.useMemo(()=>{const i=[],c=h=>h*h*(3-2*h);for(const h of n)for(let u=0;u<=9;u++){const b=u/9;i.push([(h.x0+h.x1)/2,h.y0+(h.y1-h.y0)*c(b)-1.2,R.lerp(h.z0,h.z1,b)])}return i},[n]);return t.jsxs("group",{children:[[a.x[0]+1,a.x[1]-1].map(i=>[a.z[0]+1,a.z[1]-1].map(c=>t.jsxs("mesh",{position:[i,128,c],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[2.2,3,256,6]}),t.jsx("meshStandardMaterial",{color:"#33261a",roughness:.92})]},`${i}${c}`))),t.jsxs("instancedMesh",{args:[null,null,s.length],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[9,2.4,5.6]}),t.jsx("meshStandardMaterial",{color:"#5a4736",roughness:.92}),t.jsx(Zc,{points:s})]}),o.map(([i,c,h,l,u],b)=>t.jsxs("mesh",{position:[i,c-1.6,h],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[Math.abs(l),3.2,Math.abs(u)]}),t.jsx("meshStandardMaterial",{color:"#4b3a2c",roughness:.93})]},b)),o.map(([i,c,h,l,u],b)=>t.jsxs("mesh",{position:[i,c+5,h+Math.abs(u)/2-1],children:[t.jsx("boxGeometry",{args:[Math.abs(l),1.6,1.2]}),t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.8})]},`r${b}`))]})}function Zc({points:e}){const o=w.useRef(),n=w.useRef(!1);return ae(()=>{if(n.current)return;const a=o.current?.parent;if(!a?.isInstancedMesh)return;const s=new pt,i=new kt,c=new z(1,1,1),h=new z;for(let l=0;l<Math.min(e.length,a.count);l++)h.set(e[l][0],e[l][1],e[l][2]),a.setMatrixAt(l,s.compose(h,i,c));a.instanceMatrix.needsUpdate=!0,a.computeBoundingSphere(),n.current=!0}),t.jsx("object3D",{ref:o})}function qc({shadows:e=!0}){const o=w.useMemo(()=>{const n=[],s=i=>i*i*(3-2*i);for(const i of[-1,1])for(let c=0;c<=20;c++){const h=c/20;n.push({x:i*we.x,y:s(h)*Ht,z:R.lerp(we.zFoot,we.zTop,h)})}return n},[]);return t.jsxs("group",{children:[o.map((n,a)=>t.jsxs("mesh",{position:[n.x,n.y-1.4,n.z],castShadow:e,receiveShadow:e,children:[t.jsx("boxGeometry",{args:[we.halfW*2,2.8,9]}),t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.75})]},a)),[-1,1].map(n=>{const a=i=>i*i*(3-2*i),s=i=>{const c=[];for(let h=0;h<=16;h++){const l=h/16;c.push(new z(n*we.x+i,a(l)*Ht+7,R.lerp(we.zFoot,we.zTop,l)))}return new mo(new fo(c),24,1.1,4,!1)};return t.jsxs("group",{children:[t.jsx("mesh",{geometry:s(-15),castShadow:e,children:t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.8})}),t.jsx("mesh",{geometry:s(we.halfW+1),castShadow:e,children:t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.8})})]},n)})]})}function Jc({shadows:e=!0}){const o=w.useMemo(()=>Fo.map(([,,n,a])=>{const s=[];for(let i=0;i<=12;i++){const c=i/12*2-1;s.push(new z(c*n*.5,a*(1-c*c),0))}return new mo(new fo(s),26,4.6,4,!1)}),[]);return t.jsxs(t.Fragment,{children:[Fo.map(([n,a],s)=>t.jsxs("group",{position:[0,n,a],children:[t.jsx("mesh",{geometry:o[s],castShadow:e,receiveShadow:e,children:t.jsx("meshStandardMaterial",{color:A.vermilion,roughness:.74})}),[-7,7].map(i=>t.jsx("mesh",{geometry:o[s],position:[0,7,i],scale:[1,1,.3],children:t.jsx("meshStandardMaterial",{color:A.vermilionDeep,roughness:.8})},i))]},s)),[-1,0,1].map(n=>t.jsxs("mesh",{position:[n*70,Fo[0][0]-12,Fo[0][1]],children:[t.jsx("cylinderGeometry",{args:[4,4,7,8]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:2.4,toneMapped:!1})]},n)),t.jsx("group",{position:[0,ce.y,0]})]})}function Br(e){let o=e>>>0;return()=>(o=Math.imul(o,1664525)+1013904223>>>0,o/4294967296)}function eh({quality:e,shadows:o}){const n=w.useMemo(()=>{const s=Br(712273),i=[],c=e==="low"?34:e==="mid"?68:108;let h=0;for(;i.length<c&&h<c*40;){h++;const l=(s()*2-1)*(ce.halfX-30),u=R.lerp(ce.zBack+40,ce.zFront-30,s());Math.abs(l)<62&&u>N.z+120||Math.abs(l)<70&&Math.abs(u-84)<58||Math.abs(Math.abs(l)-we.x)<24&&u<we.zFoot+18&&u>we.zTop-10||i.push({x:l,z:u,kind:i.length%4,rot:s()*Math.PI*2,k:.82+s()*.5})}return i},[e]),a=o;return t.jsx(t.Fragment,{children:n.map((s,i)=>{const c=[s.x,ce.y,s.z];if(s.kind===0){const l=he("sake-tower.opt.glb")*s.k,u=l*.24;return t.jsx(ye,{name:"sake-tower.opt.glb",height:l,position:c,rotation:s.rot,tint:"#c9b48a",fallback:t.jsx("group",{position:c,children:[0,1,2].map(b=>t.jsxs("mesh",{position:[0,l*(.17+b*.3),0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[u-b*u*.16,u-b*u*.16,l*.29,10]}),t.jsx("meshStandardMaterial",{color:b%2?"#c9a86a":"#8e6a3c",roughness:.92})]},b))})},i)}if(s.kind===1){const l=he("oni-guardian.opt.glb")*s.k;return t.jsx(ye,{name:"oni-guardian.opt.glb",height:l,position:c,rotation:s.rot,tint:"#9a9488",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,l*.17,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[l*.43,l*.33,l*.43]}),t.jsx("meshStandardMaterial",{color:"#4a4a52",roughness:.95})]}),t.jsxs("mesh",{position:[0,l*.6,0],castShadow:a,children:[t.jsx("capsuleGeometry",{args:[l*.2,l*.33,4,8]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]}),[-1,1].map(u=>t.jsxs("mesh",{position:[u*l*.13,l*.93,0],rotation:[0,0,u*.5],castShadow:a,children:[t.jsx("coneGeometry",{args:[l*.067,l*.27,5]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]},u))]})},i)}if(s.kind===2){const l=he("wisteria-trellis.opt.glb")*s.k;return t.jsx(ye,{name:"wisteria-trellis.opt.glb",height:l,position:c,rotation:s.rot,tint:"#b39ad8",fallback:t.jsxs("group",{position:c,children:[t.jsxs("mesh",{position:[0,l*.94,0],castShadow:a,children:[t.jsx("boxGeometry",{args:[l*.7,l*.07,l*.07]}),t.jsx("meshStandardMaterial",{color:"#3a2a1c",roughness:.94})]}),[-.26,-.09,.09,.26].map(u=>t.jsxs("mesh",{position:[u*l,l*.47,0],children:[t.jsx("coneGeometry",{args:[l*.1,l*.88,6]}),t.jsx("meshStandardMaterial",{color:"#9d7fd0",roughness:.95,emissive:"#6b4fa0",emissiveIntensity:.22})]},u))]})},i)}const h=Nl*4*s.k;return t.jsxs("group",{position:c,rotation:[0,s.rot,0],children:[t.jsxs("mesh",{position:[0,h/2,0],castShadow:a,children:[t.jsx("cylinderGeometry",{args:[h*.021,h*.021,h,6]}),t.jsx("meshStandardMaterial",{color:"#2f2118",roughness:.92})]}),t.jsxs("mesh",{position:[h*.12,h*.65,0],children:[t.jsx("planeGeometry",{args:[h*.235,h*.7]}),t.jsx("meshStandardMaterial",{color:i%2?A.vermilion:"#e8dcc4",roughness:.95,side:Be,emissive:i%2?A.vermilionDeep:"#8a8272",emissiveIntensity:.28})]})]},i)})})}function th({shadows:e}){const o=w.useMemo(()=>{const n=Br(10560325),a=[];for(let s=0;s<52;s++)a.push({x:(n()*2-1)*(ot.halfX-40),z:(n()*2-1)*(ot.halfZ-40),rot:n()*Math.PI*2,keg:s%2===0});return a},[]);return t.jsx(t.Fragment,{children:o.map((n,a)=>n.keg?t.jsx(ye,{name:"powder-keg.opt.glb",height:he("powder-keg.opt.glb"),position:[n.x,ot.y,n.z],rotation:n.rot,tint:"#6a6a72",fallback:t.jsxs("mesh",{position:[n.x,ot.y+he("powder-keg.opt.glb")*.5,n.z],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[he("powder-keg.opt.glb")*.4,he("powder-keg.opt.glb")*.4,he("powder-keg.opt.glb"),10]}),t.jsx("meshStandardMaterial",{color:"#1a1a20",roughness:.6,metalness:.4})]})},a):t.jsx(ye,{name:"war-cannon.opt.glb",height:he("war-cannon.opt.glb"),position:[n.x,ot.y,n.z],rotation:n.rot,tint:"#7a7068",fallback:t.jsxs("mesh",{position:[n.x,ot.y+he("war-cannon.opt.glb")*.42,n.z],rotation:[0,n.rot,Math.PI/2],castShadow:e,children:[t.jsx("cylinderGeometry",{args:[he("war-cannon.opt.glb")*.18,he("war-cannon.opt.glb")*.23,he("war-cannon.opt.glb")*1.9,8]}),t.jsx("meshStandardMaterial",{color:"#15181f",roughness:.45,metalness:.7})]})},a))})}function oh(){const e=xe(o=>o.camera);return ae((o,n)=>{const a=Math.min(n,.05),s=(e.position.x-ge.x-Fe.centre[0])/Fe.radii[0],i=(e.position.y-ge.y-Fe.centre[1])/Fe.radii[1],c=(e.position.z-ge.z-Fe.centre[2])/Fe.radii[2],h=Math.sqrt(s*s+i*i+c*c),l=R.clamp(1-(h-1)/.5,0,1);y.inside+=(l-y.inside)*(1-Math.pow(.02,a))}),null}const bs={low:1,mid:2,high:3};function nh({quality:e="high",shadows:o=!0}){const n=bs[e]??bs.high;return t.jsxs("group",{position:[ge.x,ge.y,ge.z],children:[t.jsx(oh,{}),t.jsx(Dc,{quality:e,shadows:o}),t.jsx(Kc,{quality:e,shadows:o}),t.jsx(Jc,{shadows:o}),t.jsx(qc,{shadows:o}),t.jsx(Xc,{shadows:o}),t.jsx(eh,{quality:e,shadows:o}),t.jsx(th,{shadows:o}),[-1,1].flatMap(a=>[0,1,2,3,4].map(s=>t.jsx(ye,{name:"banquet-table.opt.glb",height:he("banquet-table.opt.glb"),position:[a*(74+s%2*22),ce.y,N.z+186+s*34],rotation:a*.35+Math.PI/2,tint:"#a98c66",fallback:null},`bq-${a}-${s}`))),t.jsx(ye,{name:"treasure-kura.opt.glb",height:he("treasure-kura.opt.glb"),position:[ke.x-74,ce.y,N.z+96],rotation:-.7,tint:"#b8ab98",emissive:"#141018",emissiveIntensity:.1,fallback:t.jsx("group",{position:[ke.x-74,ce.y,N.z+96],rotation:[0,-.7,0],children:(()=>{const a=he("treasure-kura.opt.glb");return t.jsxs(t.Fragment,{children:[[-1,1].map(s=>[-1,1].map(i=>t.jsxs("mesh",{position:[s*a*.3,a*.08,i*a*.22],castShadow:o,children:[t.jsx("boxGeometry",{args:[a*.1,a*.16,a*.1]}),t.jsx("meshStandardMaterial",{color:"#3a2d20",roughness:.92})]},`${s}${i}`))),t.jsxs("mesh",{position:[0,a*.34,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[a*.85,a*.38,a*.65]}),t.jsx("meshStandardMaterial",{color:"#d8d2c2",roughness:.9})]}),t.jsxs("mesh",{position:[0,a*.6,0],castShadow:o,children:[t.jsx("coneGeometry",{args:[a*.65,a*.3,4]}),t.jsx("meshStandardMaterial",{color:"#7e2a1c",roughness:.8,flatShading:!0})]})]})})()})}),[[-120,-70,.4],[60,40,2.2],[150,-100,1.1],[-64,22,1.8],[104,-46,.2],[-176,-118,2.7],[18,-142,1.4],[-30,96,.9]].map(([a,s,i],c)=>t.jsx(ye,{name:"bomb-sphere.opt.glb",height:he("bomb-sphere.opt.glb"),position:[a,ot.y,s],rotation:i,tint:"#5a5a64",fallback:t.jsxs("mesh",{position:[a,ot.y+he("bomb-sphere.opt.glb")*.5,s],castShadow:o,children:[t.jsx("sphereGeometry",{args:[he("bomb-sphere.opt.glb")*.5,12,10]}),t.jsx("meshStandardMaterial",{color:"#14161c",roughness:.5,metalness:.5})]})},`bomb-${c}`)),[-1,1].map(a=>t.jsx(ye,{name:"keep-tier.opt.glb",height:he("keep-tier.opt.glb"),position:[a*(ke.x-40),ke.y+ke.tiers*ke.tierRise-6,N.z+140],rotation:a*.6,tint:"#a08c74",fallback:null},`turret-${a}`)),[-1,1].map(a=>t.jsx(ye,{name:"arch-bridge.opt.glb",height:he("arch-bridge.opt.glb"),position:[a*74,ce.y,84],rotation:Math.PI/2,tint:"#b87a5a",fallback:null},`span-${a}`)),[-1,1].map(a=>t.jsx(ye,{name:"oni-guardian.opt.glb",height:Ot,position:[a*(He.halfX+26),He.y,He.z-26],rotation:-a*.5,tint:"#8e8880",fallback:t.jsxs("group",{position:[a*(He.halfX+26),He.y,He.z-26],children:[t.jsxs("mesh",{position:[0,Ot*.17,0],castShadow:o,children:[t.jsx("boxGeometry",{args:[Ot*.41,Ot*.33,Ot*.41]}),t.jsx("meshStandardMaterial",{color:"#43434c",roughness:.95})]}),t.jsxs("mesh",{position:[0,Ot*.59,0],castShadow:o,children:[t.jsx("capsuleGeometry",{args:[Ot*.185,Ot*.33,4,10]}),t.jsx("meshStandardMaterial",{color:"#8d8778",roughness:.9})]})]})},a)),n>=2&&t.jsx("pointLight",{position:[0,Ce.y+30,Ce.z-N.z+N.z+40],color:A.ember,intensity:42e3,distance:900,decay:2}),n>=3&&t.jsx("pointLight",{position:[0,ke.y+120,60],color:A.lantern,intensity:3e4,distance:820,decay:2}),n>=4&&t.jsx("pointLight",{position:[0,ot.y+40,0],color:"#4fbf86",intensity:14e3,distance:420,decay:2}),t.jsx("pointLight",{position:[0,He.y+132,He.z-40],color:A.lantern,intensity:13e3,distance:620,decay:2})]})}const ah=Math.PI/2-.14,ws=4;function Ur({enabled:e,dom:o,zoomMin:n=.34,zoomMax:a=2.6,zoom0:s=1,pitch0:i=.16,pitchMin:c=-.62,pitchMax:h=ah}){const l=w.useRef({yaw:0,pitch:i,zoom:s,smYaw:0,smPitch:i,smZoom:s,since:99,dragging:!1,recentre:!1,noRecentre:!1,pitchMin:c,pitchMax:h,zoomMin:n,zoomMax:a,pitch0:i}).current;return w.useEffect(()=>{if(!e||!o)return;const u=o,b=new Map;let m=0,g=0,x=null;const f=()=>b.size,p=E=>{b.set(E.pointerId,{x:E.clientX,y:E.clientY});try{u.setPointerCapture?.(E.pointerId)}catch{}if(f()===1)l.dragging=!0,x={x:E.clientX,y:E.clientY,t:E.timeStamp};else if(f()===2){l.dragging=!1;const[r,T]=[...b.values()];m=Math.hypot(r.x-T.x,r.y-T.y),x=null}},d=E=>{const r=b.get(E.pointerId);if(!r)return;const T=E.clientX-r.x,C=E.clientY-r.y;if(r.x=E.clientX,r.y=E.clientY,f()>=2){const[M,G]=[...b.values()],L=Math.hypot(M.x-G.x,M.y-G.y);m>8&&L>8&&(l.zoom=R.clamp(l.zoom*(m/L),l.zoomMin,l.zoomMax),l.since=0),m=L;return}if(!l.dragging)return;x&&Math.hypot(E.clientX-x.x,E.clientY-x.y)>14&&(x=null);const P=Qn()*ve.lookSens;l.yaw-=T*.005*P,l.pitch=R.clamp(l.pitch+C*.004*P*(ve.invertY?-1:1),l.pitchMin,l.pitchMax),l.since=0,E.cancelable&&E.preventDefault()},v=E=>{b.has(E.pointerId)&&(b.delete(E.pointerId),f()<2&&(m=0),f()===0&&(l.dragging=!1,x&&E.timeStamp-x.t<260&&(E.timeStamp-g<340?(l.recentre=!0,g=0):g=E.timeStamp),x=null))},j=E=>{E.preventDefault(),l.zoom=R.clamp(l.zoom*(1+Math.sign(E.deltaY)*.1),l.zoomMin,l.zoomMax),l.since=0};u.addEventListener("pointerdown",p),u.addEventListener("pointermove",d,{passive:!1}),u.addEventListener("pointerup",v),u.addEventListener("pointercancel",v),window.addEventListener("pointerup",v);const S=E=>{b.delete(E.pointerId)&&(b.size<2&&(m=0),b.size===0&&(l.dragging=!1))};u.addEventListener("lostpointercapture",S);const k=()=>{b.clear(),m=0,l.dragging=!1};return window.addEventListener("blur",k),u.addEventListener("wheel",j,{passive:!1}),()=>{u.removeEventListener("pointerdown",p),u.removeEventListener("pointermove",d),u.removeEventListener("pointerup",v),u.removeEventListener("pointercancel",v),u.removeEventListener("lostpointercapture",S),window.removeEventListener("pointerup",v),window.removeEventListener("blur",k),u.removeEventListener("wheel",j),b.clear(),l.dragging=!1}},[e,o,l]),l}function oa(e,o,n=0){if(e.since+=o,I.zoom&&(e.zoom=R.clamp(e.zoom*(1-I.zoom*.9*o),e.zoomMin,e.zoomMax),e.since=0),e.yaw-=n,I.recentreQueued&&(I.recentreQueued=!1,e.recentre=!0),e.recentre&&(e.recentre=!1,e.since=ws+1,e.pitch+=(e.pitch0-e.pitch)*.5,e.noRecentre&&(e.pitch=e.pitch0)),!ve.freeCam&&!e.noRecentre&&!e.dragging&&e.since>ws){for(;e.yaw>Math.PI;)e.yaw-=Math.PI*2;for(;e.yaw<-Math.PI;)e.yaw+=Math.PI*2;e.yaw*=Math.pow(De(.5,.72),o),Math.abs(e.yaw)<.001&&(e.yaw=0)}const a=e.dragging?6e-4:De(.002,.02),s=1-Math.pow(a,o);let i=e.yaw-e.smYaw;for(;i>Math.PI;)i-=Math.PI*2;for(;i<-Math.PI;)i+=Math.PI*2;e.smYaw+=i*s,e.smPitch+=(e.pitch-e.smPitch)*s,e.smZoom+=(e.zoom-e.smZoom)*(1-Math.pow(.004,o))}const ys=[{id:"luffy",modelId:"luffy-wano",name:"Luffy",role:"Captain",capeAxis:"y",capeWiden:.66,capeLength:.78,capeUrl:Io("coat-black.opt.glb"),height:1.74,speed:7,run:15,build:"normal",skin:"#f0c191",hair:{color:"#181410",style:"spiky"},helm:{kind:"none"},top:{color:"#c22d2a",style:"open"},bottom:{color:"#d98b3a"},sash:"#8f63c4",boots:{color:"#6b5238",fur:!1},scar:!0},{id:"zoro",modelId:"zoro-wano",name:"Zoro",role:"Swordsman",capeAxis:"y",capeWiden:.82,capeLength:.56,capeUrl:Io("haori-green.opt.glb"),height:1.81,speed:6.6,run:14,build:"tall",skin:"#e8b481",hair:{color:"#4f7d3a",style:"short"},helm:{kind:"none"},top:{color:"#f2f0ea",style:"open"},bottom:{color:"#f2f0ea"},sash:"#4b3f7a",boots:{color:"#1f2229",fur:!1},weapon:"swords",scar:!0}],sh=e=>ys.find(o=>o.id===e)??ys[0],rh=.22,vs=13,ih=.09,lh=.34,Ms=9,ch=1.1,hh=.55,ks=12,dh=6,uh=70,ph=.55,In=26,fh=8,mh=5,js=.8,gh=12,xh=.3,bh=.13,Ss=3.4,wh=32,zs=.65,yh=1.1,vh=.5,Mh=6,Ts=6,Ve=new z,wt=new z,ko=new z;function kh(e,o,n,a,s,i,c,h){let u=0;for(let b=1;b<=16;b++){const m=b/16*c,g=e+a*m,x=o+s*m,f=n+i*m,p=h??le(g,f);if(x<=p){let d=u,v=m;for(let j=0;j<6;j++){const S=(d+v)/2,k=o+s*S,E=h??le(e+a*S,n+i*S);k<=E?v=S:d=S}return v}u=m}return null}function jh(e,o,n,a){const s=Math.min(e,.05),i=$e.combat,c=Ie.move,h=i.style==="sword";a.x=0,a.y=0,a.z=0,Ve.set(Math.sin(o.yaw)*Math.cos(o.pitch),-Math.sin(o.pitch),Math.cos(o.yaw)*Math.cos(o.pitch)).normalize(),$e.lookYaw=Math.atan2(Ve.x,Ve.z),$e.playerFacing=o.yaw,i.bazookaCd=Math.max(0,i.bazookaCd-s),i.gigantCd=Math.max(0,i.gigantCd-s),i.hakiCd=Math.max(0,i.hakiCd-s),i.gear2Cd=Math.max(0,i.gear2Cd-s),n.gear2Queued&&(n.gear2Queued=!1,!i.gear2&&i.gear2Cd<=0&&!h&&(i.gear2=!0,i.gear2T=fh,eo(.25),wt.set(o.x,o.y+1,o.z),Ft(wt,1.6,"haki"))),i.gear2&&(i.gear2T=Math.max(0,i.gear2T-s),i.gear2T<=0&&(i.gear2=!1,i.gear2Cd=mh));const l=i.gear2;i.balloon=R.damp(i.balloon,n.balloonHeld&&!h?1:0,8,s);const u=o.y+o.height*.9,b=kh(o.x,u,o.z,Ve.x,Ve.y,Ve.z,uh,o.floorY);$e.aim.valid=b!=null,b!=null&&($e.aim.distance=b,$e.aim.point.set(o.x,u,o.z).addScaledVector(Ve,b));const m=!c.kind;if(n.rocketQueued&&(n.rocketQueued=!1,m&&b!=null&&(x(h?"flash":"rocket",ph),c.target.copy($e.aim.point))),n.pistolQueued&&(n.pistolQueued=!1,m&&(x(h?"onigiri":"pistol",h?xh:rh),c.target.set(o.x,u,o.z).addScaledVector(Ve,h?8:16))),n.bazookaQueued&&(n.bazookaQueued=!1,m&&i.bazookaCd<=0))if(h){const f=$e.waves.find(p=>!p.active);f&&(f.active=!0,f.k=0,f.pos.set(o.x,u*.92,o.z),f.dir.set(Ve.x,Ve.y*.35,Ve.z).normalize(),i.bazookaCd=yh,x("wavecast",.22),c.hit=!0,c.target.copy(f.pos).addScaledVector(f.dir,8),eo(.1))}else x("bazooka",lh),c.target.set(o.x,u,o.z).addScaledVector(Ve,b!=null?Math.min(b,Ms):Ms),i.bazookaCd=ch;n.gigantQueued&&(n.gigantQueued=!1,m&&i.gigantCd<=0&&(x(h?"sanzen":"gigant",h?vh:hh),c.target.set(o.x,u,o.z).addScaledVector(Ve,b!=null?Math.min(b+1.5,ks):ks),i.gigantCd=h?Mh:dh));for(const f of $e.waves){if(!f.active)continue;const p=f.k;f.k=Math.min(1,f.k+s/zs),f.pos.addScaledVector(f.dir,wh/zs*s);for(const v of[.35,.68,1])p<v&&f.k>=v&&Ft(f.pos,1.6,"slash");const d=o.floorY==null?le(f.pos.x,f.pos.z):o.floorY;(f.k>=1||f.pos.y<d+.4)&&(f.k<1&&Ft(f.pos,1.6,"slash"),f.active=!1)}if(n.hakiQueued&&(n.hakiQueued=!1,i.hakiCd<=0&&Ie.hakiT<=0&&(Ie.hakiT=js,Ie.hakiFired=!1,i.hakiCd=gh)),Ie.hakiT>0){Ie.hakiT=Math.max(0,Ie.hakiT-s);const f=1-Ie.hakiT/js;if(i.haki=f,!Ie.hakiFired&&f>.35&&(Ie.hakiFired=!0,wt.set(o.x,o.y,o.z),Ft(wt,3,"haki"),eo(.9),h))for(let p=0;p<8;p++){const d=p/8*Math.PI*2;wt.set(o.x+Math.cos(d)*Ts,o.y+.6,o.z+Math.sin(d)*Ts),Ft(wt,1.4,"slash")}}else i.haki=0;const g=n.gatlingHeld&&!c.kind;if(i.gatling=R.damp(i.gatling,g?1:0,14,s),i.gatling>.2&&$e.gatlingAim.copy(Ve),g){if(Ie.gatT-=s,Ie.gatT<=0)if(h)Ie.gatT=bh,Ie.tatsu+=1.9,wt.set(o.x+Math.cos(Ie.tatsu)*Ss,o.y+.6,o.z+Math.sin(Ie.tatsu)*Ss),Ft(wt,.7,"slash"),eo(.04);else{Ie.gatT=ih*(l?.6:1);const f=b!=null?Math.min(b,vs):vs*.85;wt.set(o.x,u,o.z).addScaledVector(Ve,f),Ft(wt,.8,"punch"),eo(.05)}}else Ie.gatT=0;if(c.kind){c.t+=s;const f=Math.min(1,c.t/c.dur);if(!c.hit&&f>.45){c.hit=!0;const p=c.kind==="gigant"||c.kind==="sanzen"?3:1.3;if(Ft(c.target,p,h?"slash":"punch"),eo(c.kind==="gigant"||c.kind==="sanzen"?.7:.18),c.kind==="rocket"||c.kind==="flash"){ko.copy(c.target).sub(wt.set(o.x,o.y,o.z));const d=ko.length()||1;a.x=ko.x/d*In,a.y=Math.max(0,ko.y/d*In*.5),a.z=ko.z/d*In}else(c.kind==="pistol"||c.kind==="onigiri")&&(a.x=Ve.x*6,a.z=Ve.z*6)}c.t>=c.dur&&(c.kind=null,c.t=0),i.move=c.kind,i.moveK=c.kind?Math.min(1,c.t/c.dur):0}else i.move=null,i.moveK=0;return $e.shake=Math.max(0,$e.shake-s*2.4),a;function x(f,p){c.kind=f,c.t=0,c.dur=p,c.hit=!1}}const Ie={move:{kind:null,t:0,dur:0,hit:!1,target:new z},hakiT:0,hakiFired:!1,gatT:0,tatsu:0};function Sh(e="rubber"){const o=$e.combat;o.style=e,o.move=null,o.moveK=0,o.gatling=0,o.gear2=!1,o.gear2T=0,o.gear2Cd=0,o.bazookaCd=0,o.gigantCd=0,o.hakiCd=0,o.balloon=0,o.haki=0,Ie.move.kind=null,Ie.move.t=0,Ie.hakiT=0,Ie.gatT=0,$e.shake=0;for(const n of $e.waves)n.active=!1}const Uo=82,zh=24,Th=21,Eh=1.05,Es=.52,Rs=.3,Rh=.04,Ah=.0016,Ih=.055,Ch=1.9,Ph=21,Lh=62,Fh=9,As={x:-.6,z:-3.2},Is=.075,Wo=new z,Cs=new z;function ao(e,o){return R.clamp(-le(e,o)/26,0,1)}const Yo=e=>Bn[e]??Bn.sunny,Gh=7,Ps=15,Ne=1.85,Ls=1.1,Oh=26,Fs=9.4,Gs=21,Nh=.011;function Dh({mode:e,onMode:o,crew:n="luffy",vessel:a="sunny"}){const s=xe(C=>C.camera),i=xe(C=>C.gl),c=w.useRef(),h=w.useRef(),l=w.useRef({speed:0,grounded:!0,maxSpeed:15}),u=w.useRef({x:0,y:0,z:0,yaw:0,pitch:0,height:1.74,floorY:null}).current,b=w.useRef({x:0,y:0,z:0}).current,m=sh(n),g=w.useRef(),x=w.useRef(),f=w.useRef(),p=cn(a),d=rt(p.hulls[0]),v=rt(p.hulls[1]??""),j=d||v,S=d?p.hulls[0]:v?p.hulls[1]:null,k=S?bn(S,34):30,E=rt(p.crew),r=w.useRef({x:Yo(a).x,z:Yo(a).z,heading:Math.PI,speed:0,vx:0,vz:0,throttle:0,rudder:0,flank:0,deckY:0,aground:0,heel:0,trim:0,spray:0,slam:0,bowY:0,drift:0,burst:1,burstFx:0,swallowed:0,fx:0,fy:0,fz:0,fyaw:Math.PI,fpitch:0,fvx:0,fvz:0,fvy:0,airborne:!1,landing:0,fyaw0:Math.PI,stride:0,area:"hall",dx:0,dz:0,snapCam:!0,boarded:!1}).current,T=Ur({enabled:e==="helm"||e==="foot",dom:i.domElement,zoomMin:.28,zoomMax:4.2,pitch0:.14,pitchMin:-1,pitchMax:1.44});return w.useEffect(()=>{if(e==="helm")return r.x=Yo(a).x,r.z=Yo(a).z,r.heading=Math.PI,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.flank=0,r.deckY=0,r.snapCam=!0,T.yaw=0,T.smYaw=0,T.pitch=.14,T.smPitch=.14,T.pitch0=.14,T.zoom=1,T.smZoom=1,T.noRecentre=!1,T.pitchMin=-1,T.pitchMax=1.44,r.swallowed=0,r.burst=1,r.burstFx=0,r.slam=0,r.drift=0,r.trim=0,r.bowY=ut(r.x,r.z,y.t,1).y,y.helm=null,Vn("helm"),()=>{y.helmActive=!1}},[e,a,r,T]),w.useEffect(()=>{if(e!=="foot")return;r.fvx=0,r.fvz=0,r.snapCam=!0,V.chain!=="foot"&&Vn("foot"),Sh(m.weapon==="swords"?"sword":"rubber");const C=(M,G)=>{T.yaw=M,T.smYaw=M,T.pitch=G,T.smPitch=G,T.pitch0=0,T.noRecentre=!0,T.pitchMin=-1.28,T.pitchMax=1.28};r.fvy=0,r.airborne=!1,r.landing=0;const P=y.footSpawn;if(y.footSpawn="hall",P==="deck"){r.area="deck",r.dx=0,r.dz=-k*.2,r.fy=y.ship.y+y.ship.deckY+Ne,r.fyaw=r.heading,C(r.heading+Math.PI,.44);return}if(P==="port"){r.area="island",r.fx=Q.x+40*H,r.fz=Q.z+40*H,r.fy=le(r.fx,r.fz)+Ne,r.fyaw=Math.atan2(de.x-r.fx,de.z-r.fz),C(r.fyaw+Math.PI,-.06);return}if(P==="rear"){r.area="island",r.fx=Y.gate.x+Y.dir[0]*26,r.fz=Y.gate.z+Y.dir[1]*26,r.fy=le(r.fx,r.fz)+Ne,r.fyaw=Math.atan2(-Y.dir[0],-Y.dir[1]),C(r.fyaw+Math.PI,.02);return}r.area="hall",r.fx=ge.x,r.fy=ge.y+He.y,r.fz=ge.z+xt.zTop,r.fyaw=Math.PI,r.fpitch=-.05,C(0,.05)},[e,r,T]),ae((C,P)=>{if(e!=="helm"&&e!=="foot")return;const M=Math.min(P,.05);y.t+=M;const G=e==="helm",L=e==="foot"&&r.area==="deck";if(G||L){const W=r.heading,K=G?I.throttle:r.order,fe=G?I.rudder:0;G&&(r.order=I.throttle),r.throttle+=(K-r.throttle)*(1-Math.pow(.02,M)),r.rudder+=(fe-r.rudder)*(1-Math.pow(.005,M)),r.flank+=((G&&I.boost?1:0)-r.flank)*(1-Math.pow(Rh,M));const O=(p.topSpeed??Uo)*(1+Rs*r.flank),$=Math.sin(r.heading),te=Math.cos(r.heading),se=Math.cos(r.heading),me=-Math.sin(r.heading);let ue=r.vx*$+r.vz*te,Le=r.vx*se+r.vz*me;const We=1-y.shelter,Z=r.throttle>=0?r.throttle*O:r.throttle*zh,be=p.accel??Th;ue+=R.clamp(Z-ue,-be*2.5,be)*M,r.burst=Math.min(1,r.burst+M/(p.burst?.charge??Fh)),G&&I.burstQueued&&(I.burstQueued=!1,r.burst>=.999&&(r.burst=0,r.burstFx=1,ue+=p.burst?.push??Lh,y.splash+=1)),r.burstFx*=Math.pow(.2,M);const _e=ut(r.x,r.z,y.t,1);ue-=(_e.dx*$+_e.dz*te)*Ph*We*M,ue-=ue*Math.abs(ue)*Ah*M,Le-=(Le*Math.abs(Le)*Ih+Le*Ch)*M;const nt=R.clamp(Math.abs(ue)/16,0,1);ue*=Math.pow(1-.11*Math.abs(r.rudder)*nt,M),r.vx=$*ue+se*Le,r.vz=te*ue+me*Le,r.speed=ue,r.drift+=(R.clamp(Math.abs(Le)/11,0,1)-r.drift)*(1-Math.pow(.1,M)),r.heading+=r.rudder*(p.turn??Eh)*nt*Math.sign(ue||1)*M;const lt=r.x+r.vx*M,jt=r.z+r.vz*M,Qe=k*Es,ft=lt+$*Qe,_=jt+te*Qe;if(ao(ft,_)>.06)r.x=lt,r.z=jt,r.aground+=(0-r.aground)*(1-Math.pow(.05,M));else{r.aground+=(1-r.aground)*(1-Math.pow(.02,M)),Kt(Math.abs(r.speed)*.0012*M*60,"AGROUND — SHE IS TAKING WATER");const Re=Math.pow(.06,M);r.speed*=Re,r.vx*=Re,r.vz*=Re;const ht=6,Jt=ao(r.x+ht,r.z)-ao(r.x-ht,r.z),wo=ao(r.x,r.z+ht)-ao(r.x,r.z-ht),gt=Math.hypot(Jt,wo)||1;r.x+=Jt/gt*26*M,r.z+=wo/gt*26*M}const Ge=tr(r.x,r.z,0);r.x+=Ge.vx*M,r.z+=Ge.vz*M,r.x+=As.x*We*M,r.z+=As.z*We*M;const ct=_e.dx*se+_e.dz*me;r.heading+=R.clamp(ct*.4,-Is,Is)*We*M;let mt=Ue[0],Me=1/0;for(const Re of Ue){const ht=(r.x-Re.x)**2+(r.z-Re.z)**2;ht<Me&&(Me=ht,mt=Re)}if(Er(M,{danger:Ge.danger,headingX:Math.sin(r.heading),headingZ:Math.cos(r.heading),toCentreX:mt.x-r.x,toCentreZ:mt.z-r.z,speed:r.speed,throttle:r.throttle})>=1||Ge.danger>.94){const Re=mt;r.x=Re.x+(Re.x>0?Re.r*1.85:-Re.r*1.85),r.z=Re.z+Re.r*1.5,r.speed=0,r.vx=0,r.vz=0,r.throttle=0,r.heading=Math.PI,r.swallowed+=1,r.aground=1,V.grip=0,Kt(.25,"SWALLOWED — SHE BROACHED AND ROLLED"),y.splash+=1}const re=Co(r.x,r.z),Oe=R.lerp(1,.055,re)*R.smoothstep(ao(r.x,r.z),0,.3),q=ut(r.x,r.z,y.t,Oe);y.helmActive=!0,y.helmPos.set(r.x,q.y+k*.35,r.z),y.helmSpeed=R.clamp(Math.abs(r.speed)/(p.topSpeed??Uo),0,1),y.ship.x=r.x,y.ship.y=q.y,y.ship.z=r.z,y.ship.heading=r.heading,y.ship.loa=k,y.ship.deckY=S?Qt(S,k):k*.16,y.ship.mastY=S?yr(S,k):k*.6;const ne=Ge.vx*Math.cos(r.heading)-Ge.vz*Math.sin(r.heading),J=R.clamp(Math.abs(r.speed)/(p.topSpeed??Uo),0,1),Te=R.clamp(r.rudder*nt*J*.4+ne*.016,-.5,.5);r.heel+=(Te-Le*.012-r.heel)*(1-Math.pow(.15,M));const Ee=k*Es,Xe=ut(r.x+$*Ee,r.z+te*Ee,y.t,Oe).y,Lo=R.clamp((r.bowY-Xe)/Math.max(M,.001),0,60);r.bowY=Xe;const Ze=R.clamp((Lo-10)/24,0,1)*J*We;if(r.slam=Math.max(r.slam*Math.pow(.05,M),Ze),Ze>.25){const Re=Math.pow(1-.3*Ze,M);r.vx*=Re,r.vz*=Re}const qe=J*.1*Math.sign(r.speed>=0?1:-1)+r.slam*.14+r.burstFx*.16;r.trim+=(qe-r.trim)*(1-Math.pow(.1,M));const Ye=R.clamp(J*We*1.15+r.aground*.5+Ge.danger*.8+r.slam*1.3+r.burstFx,0,1);r.spray+=(Ye-r.spray)*(1-Math.pow(.08,M));const Wt=c.current;if(Wt&&(Wt.visible=!0,Wt.position.set(r.x,q.y,r.z),Wt.rotation.set(R.clamp(q.dz*1.2,-.3,.3)-r.trim,r.heading,R.clamp(-q.dx,-.26,.26)+r.heel)),g.current&&(g.current.scale.z=1+Math.sin(y.t*1.6)*.08+r.burstFx*.4,g.current.scale.x=1+We*.06+r.burstFx*.12),x.current&&(x.current.material.opacity=r.spray*.42,x.current.scale.setScalar(.7+r.spray*.55)),f.current&&(f.current.material.opacity=R.clamp(.34*J+r.burstFx*.3,0,.62)*(.28+We*.72),f.current.scale.set(1+J*.75+r.drift*.6,1,1+J*.5)),r.deckY+=(q.y-r.deckY)*(1-Math.pow(De(2e-4,.05),M)),G){oa(T,M,r.heading-W);const Re=r.heading+Math.PI+T.smYaw,ht=Math.cos(T.smPitch),Jt=Math.max(k*1.9,52)*T.smZoom*(1+J*De(.26,.1)+r.burstFx*De(.34,.12))*Cr(s.aspect),wo=R.lerp(q.y,r.deckY,ve.comfort),gt=Wo.set(r.x+Math.sin(Re)*ht*Jt,wo+k*.26+Math.sin(T.smPitch)*Jt,r.z+Math.cos(Re)*ht*Jt),$r=ut(gt.x,gt.z,y.t,Oe);gt.y=Math.max(gt.y,$r.y+6),gt.y=Math.max(gt.y,Pr(ut,gt,{x:r.x,z:r.z},y.t,Oe,8)),r.snapCam?(r.snapCam=!1,s.position.copy(gt)):s.position.lerp(gt,1-Math.pow(De(6e-4,.02),M));const Kr=Math.max(0,Math.cos(T.smYaw)),va=J*De(66,34)*Kr;s.lookAt(Cs.set(r.x+($+se*R.clamp(Le/40,-.4,.4))*va,wo+12-r.trim*26*J*De(1,.35),r.z+(te+me*R.clamp(Le/40,-.4,.4))*va));const Ma=De(1,0);Ma>.001&&s.rotateZ((Math.sin(y.t*2.3)*.012*J+r.heel*.3+r.aground*Math.sin(y.t*21)*.02+r.slam*Math.sin(y.t*34)*.03+Ge.danger*Math.sin(y.t*2.7)*.03)*Ma),Kn(s,60+J*De(7,2)+r.burstFx*De(10,3),M,.06,Ir)}const bo=Math.hypot(r.x-(Q.x+60*H),r.z-(Q.z+60*H));bo<90*H&&Math.abs(r.speed)<24&&(y.footSpawn="port",G?o?.("foot"):r.area==="deck"&&(r.area="island",r.fx=Q.x+40*H,r.fz=Q.z+40*H,r.fy=le(r.fx,r.fz)+Ne,r.fvx=0,r.fvz=0,r.fvy=0,r.fyaw=Math.atan2(de.x-r.fx,de.z-r.fz),T.yaw=T.smYaw=r.fyaw+Math.PI)),I.boardQueued&&(I.boardQueued=!1,G?(y.footSpawn="deck",o?.("foot")):r.area==="deck"&&o?.("helm")),G&&(y.helm={speed:r.speed,heading:r.heading,throttle:r.throttle,aground:r.aground,x:r.x,z:r.z,toGate:Math.min(Math.hypot(r.x,r.z-Ut),Math.hypot(r.x,r.z-uo)),underFire:[Ut,uo].some(Re=>{const ht=Math.hypot(r.x,r.z-Re);return ht>on.safe&&ht<on.range}),moored:bo<180*H,maelstrom:Ge.danger,swallowed:r.swallowed,burst:r.burst,drift:r.drift,maxSpeed:O,cruise:Pt.level,flank:r.flank,freeCam:ve.freeCam},Tr(M,y.helm)),y.shelter+=(re-y.shelter)*(1-Math.pow(.06,M)),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}if(e==="foot"){oa(T,M,0);const W=I.boost?Ps:Gh;r.fpitch+=(-T.smPitch-r.fpitch)*(1-Math.pow(1e-4,M));const K=I.walk.x,fe=I.walk.z,O=Math.hypot(K,fe),$=O>1?O:1,te=-Math.sin(T.smYaw),se=-Math.cos(T.smYaw),me=-se,ue=te,Le=(te*(fe/$)+me*(K/$))*W,We=(se*(fe/$)+ue*(K/$))*W,Z=(1-Math.pow(O>.02?2e-5:4e-7,M))*(r.airborne?.25:1);r.fvx+=(Le-r.fvx)*Z,r.fvz+=(We-r.fvz)*Z;const be=r.fvx*M,_e=r.fvz*M,nt=r.area==="island"?(q,ne)=>le(q,ne):r.area==="deck"?()=>y.ship.y+y.ship.deckY:(q,ne,J)=>ge.y+$i(q-ge.x,ne-ge.z,J-ge.y),lt=r.area==="hall"?(q,ne,J)=>Ki(q-ge.x,ne-ge.z,J-ge.y)||Ui(q,J,ne)>.97:()=>!1;if(r.area==="deck"){const q=Math.cos(-y.ship.heading),ne=Math.sin(-y.ship.heading);r.dx+=be*q+_e*-ne,r.dz+=be*ne+_e*q;const J=y.ship.loa*.14,Te=y.ship.loa*.42;Math.abs(r.dx)>J&&(r.dx=Math.sign(r.dx)*J,r.fvx=0,r.fvz=0),Math.abs(r.dz)>Te&&(r.dz=Math.sign(r.dz)*Te,r.fvx=0,r.fvz=0);const Ee=Math.cos(y.ship.heading),Xe=Math.sin(y.ship.heading);r.fx=y.ship.x+r.dx*Ee+r.dz*Xe,r.fz=y.ship.z-r.dx*Xe+r.dz*Ee}else if(r.area==="island"){const q=r.fx+be,ne=r.fz+_e,J=le(r.fx,r.fz),Te=le(q,ne),Ee=Math.hypot(be,_e)||1e-6,Xe=(Te-J)/Ee;(Te<=.3||Xe>=1.2&&Te>=J)&&(r.fvx=0,r.fvz=0),Te>.3&&(Xe<1.2||Te<J)&&(r.fx=q,r.fz=ne)}else{const q=r.fx+be,ne=r.fz+_e,J=r.fy-Ne,Te=nt(r.fx,r.fz,J),Ee=r.airborne?J:Te;nt(q,ne,Ee)-Ee>Ls||lt(q,ne,J)?(r.fvx=0,r.fvz=0):(r.fx=q,r.fz=ne)}const jt=r.fy-Ne,Qe=nt(r.fx,r.fz,jt);if(r.airborne?(r.fvy-=Oh*M,r.fy+=r.fvy*M,r.fy-Ne<=Qe&&(r.landing=-r.fvy,r.fy=Qe+Ne,r.fvy=0,r.airborne=!1,r.landing>Gs&&(Kt((r.landing-Gs)*Nh,"A LONG WAY DOWN"),$e.roll=0))):r.area==="deck"?(r.fy=Qe+Ne,r.fvy=0,r.landing=Math.max(0,r.landing-M*40),I.jumpQueued&&(I.jumpQueued=!1,r.fvy=Fs,r.airborne=!0)):jt-Qe>Ls?(r.airborne=!0,r.fvy=0):(r.fy+=(Qe+Ne-r.fy)*(1-Math.pow(.002,M)),r.landing=Math.max(0,r.landing-M*40),I.jumpQueued&&(I.jumpQueued=!1,r.fvy=Fs,r.airborne=!0)),I.jumpQueued=!1,r.area==="island"){const q=Math.hypot(r.fx-de.x,r.fz-de.z),ne=Math.hypot(r.fx-Y.gate.x,r.fz-Y.gate.z);q<80?(r.area="hall",r.fx=ge.x,r.fz=ge.z+xt.zTop,r.fy=ge.y+He.y+Ne,r.fvy=0,r.airborne=!1,r.fyaw=Math.PI,T.yaw=T.smYaw=0,T.pitch=T.smPitch=.05):ne<40&&(r.area="hall",r.fx=ge.x+60,r.fz=ge.z+N.z+150,r.fy=ge.y+Ne,r.fvy=0,r.airborne=!1,r.fyaw=0,T.yaw=T.smYaw=Math.PI,T.pitch=T.smPitch=.04),y.helm={onFoot:!0,area:"island",x:r.fx,z:r.fz,fy:r.fy-ge.y,toMouth:q,toRear:ne,nearPort:Math.hypot(r.fx-Q.x,r.fz-Q.z)<Q.r*1.4};const J=Co(r.fx,r.fz);y.shelter+=(J-y.shelter)*(1-Math.pow(.06,M))}else if(r.area==="deck")y.helm={onFoot:!0,area:"deck",x:r.fx,z:r.fz,speed:r.speed,heading:r.heading,throttle:r.throttle,maxSpeed:(p.topSpeed??Uo)*(1+Rs*r.flank),moored:!1};else{const q=r.fz-ge.z;q>He.z+34&&(r.area="island",r.fx=de.x,r.fz=de.z+130,r.fy=le(r.fx,r.fz)+Ne,r.fvy=0,r.airborne=!1,r.fyaw=0,T.yaw=T.smYaw=Math.PI,T.pitch=T.smPitch=-.04),y.helm={onFoot:!0,area:"hall",x:r.fx,z:r.fz,lz:q,fy:r.fy-ge.y},y.shelter+=(1-y.shelter)*(1-Math.pow(.06,M))}const ft=Math.hypot(r.fvx,r.fvz);r.stride+=ft*M;const _=m.height??1.74;if(ft>.4){let ne=Math.atan2(r.fvx,r.fvz)-r.fyaw;for(;ne>Math.PI;)ne-=Math.PI*2;for(;ne<-Math.PI;)ne+=Math.PI*2;r.fyaw+=ne*(1-Math.pow(4e-4,M))}r.fpitch+=(-T.smPitch-r.fpitch)*(1-Math.pow(1e-4,M)),r.pace=ft,l.current.speed=ft,l.current.maxSpeed=Ps,l.current.grounded=!r.airborne,l.current.vy=r.fvy,l.current.landing=r.landing,$e.playerTurn=(r.fyaw-r.fyaw0)/Math.max(M,1e-4),r.fyaw0=r.fyaw,u.x=r.fx,u.y=r.fy-Ne,u.z=r.fz,u.yaw=T.smYaw+Math.PI,u.pitch=T.smPitch,u.height=_,u.floorY=r.area==="hall"?r.fy-Ne:null,jh(M,u,I,b),(b.x||b.z)&&(r.fvx+=b.x,r.fvz+=b.z);const je=(r.area==="deck"?Math.max(_*2.6,y.ship.loa*.75):_*2.6)*T.smZoom,Ge=Math.cos(T.smPitch),ct=r.area==="deck"?R.lerp(r.fy,r.deckY+y.ship.deckY+Ne,ve.comfort):r.fy,mt=ct+Math.sin(r.stride*1.6)*.05*De(1,.3),Me=r.fx+Math.sin(T.smYaw)*Ge*je,D=r.fz+Math.cos(T.smYaw)*Ge*je;let re=mt+_*.28+Math.sin(T.smPitch)*je;const Oe=r.area==="island"?le(Me,D):ct-Ne;re=Math.max(re,Oe+_*.6),r.area==="deck"&&(re=Math.max(re,ct-Ne+y.ship.mastY*1.06)),Wo.set(Me,re,D),r.snapCam?(r.snapCam=!1,s.position.copy(Wo)):s.position.lerp(Wo,1-Math.pow(De(9e-4,.02),M)),s.lookAt(Cs.set(r.fx,mt-_*.1,r.fz)),Kn(s,r.area==="hall"?72:64,M,.02),h.current&&(h.current.position.set(r.fx,r.fy-Ne,r.fz),h.current.rotation.y=r.fyaw),y.underwater+=(0-y.underwater)*(1-Math.pow(.02,M))}y.fog=R.lerp(Bt.sea,Bt.bay,y.shelter),y.rain=1-y.shelter*.92}),t.jsxs(t.Fragment,{children:[t.jsx("group",{ref:h,position:[0,-4e3,0],visible:e==="foot",children:t.jsx(li,{character:m,motion:l})}),t.jsxs("group",{ref:c,position:[0,-4e3,0],visible:e==="helm",children:[j&&t.jsx(ye,{name:S,loa:k,slim:wn(S),sink:Po(S),rotation:gn(S),tint:fa(S,p.tint),emissive:"#3a2a18",emissiveIntensity:.24,glow:ln(S)}),j&&E&&Zo.slice(0,2).map((C,P)=>{const[M,G]=ua(S,k,C);return t.jsx(ye,{name:p.crew,height:xn,rotation:C[2],position:[M,Qt(S,k),G]},`crew-${P}`)}),t.jsxs("mesh",{position:[0,2,0],scale:[1,.74,2.7],castShadow:!0,visible:!j,children:[t.jsx("capsuleGeometry",{args:[5,9,4,12]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.84})]}),t.jsxs("mesh",{position:[0,5.4,0],visible:!j,children:[t.jsx("boxGeometry",{args:[8.6,.8,24]}),t.jsx("meshStandardMaterial",{color:"#6b4b34",roughness:.92})]}),t.jsxs("mesh",{position:[0,6.6,13],rotation:[.5,0,0],castShadow:!0,visible:!j,children:[t.jsx("boxGeometry",{args:[4,10,2.6]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.86})]}),t.jsxs("mesh",{position:[0,9,-8.5],castShadow:!0,visible:!j,children:[t.jsx("boxGeometry",{args:[8,7,7.5]}),t.jsx("meshStandardMaterial",{color:"#a85f24",roughness:.88})]}),t.jsxs("mesh",{position:[0,16,1],castShadow:!0,visible:!j,children:[t.jsx("cylinderGeometry",{args:[1.05,1.4,27,6]}),t.jsx("meshStandardMaterial",{color:"#2f2016",roughness:.9})]}),t.jsxs("mesh",{position:[0,25.5,1.2],rotation:[0,0,Math.PI/2],castShadow:!0,visible:!j,children:[t.jsx("cylinderGeometry",{args:[.6,.6,19,5]}),t.jsx("meshStandardMaterial",{color:"#241a12",roughness:.9})]}),t.jsxs("mesh",{ref:g,position:[0,17.5,1.5],visible:!j,children:[t.jsx("planeGeometry",{args:[17,15]}),t.jsx("meshStandardMaterial",{color:"#f0e6cf",roughness:1,side:Be,emissive:"#f0e6cf",emissiveIntensity:.3})]}),t.jsxs("group",{position:[0,7.4,14.6],visible:!j,children:[t.jsxs("mesh",{castShadow:!0,children:[t.jsx("sphereGeometry",{args:[3.4,10,8]}),t.jsx("meshStandardMaterial",{color:"#e0a33c",roughness:.8})]}),t.jsxs("mesh",{position:[0,0,-1.2],rotation:[Math.PI/2,0,0],children:[t.jsx("torusGeometry",{args:[4.5,1.6,6,14]}),t.jsx("meshStandardMaterial",{color:"#c9762e",roughness:.82})]})]}),pa(S,j).map(C=>{const P=j?Ct(S,k,C):[C.what.endsWith("port")?-3.2:3.2,8,-k*.13];return t.jsxs("group",{position:P,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[br,7,5]}),t.jsx("meshStandardMaterial",{color:A.lantern,emissive:A.lantern,emissiveIntensity:3.2,toneMapped:!1})]}),t.jsx("sprite",{scale:[rn,rn,1],children:t.jsx("spriteMaterial",{map:hn,color:A.lantern,transparent:!0,opacity:.5,depthWrite:!1,blending:it,toneMapped:!1})})]},C.what)}),!gr(S)&&t.jsx(dn,{crew:p.flag,width:sn(k),position:j?Ct(S,k,io("flag")):[0,26,-k*.06]}),t.jsxs("mesh",{ref:f,position:[0,.6,-k*1.05],rotation:[-Math.PI/2,0,0],children:[t.jsx("planeGeometry",{args:[k*.6,k*2.2]}),t.jsx("meshBasicMaterial",{map:Un,color:X.foam,transparent:!0,opacity:.3,depthWrite:!1,toneMapped:!1})]}),t.jsxs("mesh",{ref:x,position:[0,k*.12,k*.56],rotation:[-.5,0,0],children:[t.jsx("planeGeometry",{args:[k*.85,k*.6]}),t.jsx("meshBasicMaterial",{map:Il,color:X.foam,transparent:!0,opacity:0,depthWrite:!1,toneMapped:!1,blending:it})]})]})]})}const Os=100,Hh=30,Ns=30,_h=1.22,Bh=.44,Uh=.05,Wh=.22,Yh=70,Vo=340,Ds=7,Vh=6,Hs=60,$o=185,_s=.42,$h=new z,Bs=new z,Ko=Bn.tang;function Kh({mode:e,onMode:o}){const n=xe(j=>j.camera),a=xe(j=>j.gl),s=w.useRef(),i=w.useRef(),c=w.useRef(),h=w.useRef(),l=w.useRef([]),u=w.useCallback(j=>{l.current=j},[]),b=rt("ship-tang.opt.glb"),m=rt("ship-sub.opt.glb"),g=b||m,x=rt("crew-heart.opt.glb"),f=b?"ship-tang.opt.glb":"ship-sub.opt.glb",p=bn(f,28),d=w.useRef({x:Ko.x,z:Ko.z,heading:Math.PI,speed:0,throttle:0,rudder:0,flank:0,depth:0,orderedDepth:0,pitch:0,surfY:0,heel:0,scrape:0,stress:0,berthing:0,snapCam:!0}).current,v=Ur({enabled:e==="sub",dom:a.domElement,zoomMin:.32,zoomMax:3.4,pitch0:.15,pitchMin:-1.24,pitchMax:1.42});return w.useEffect(()=>{if(e==="sub")return d.x=Ko.x,d.z=Ko.z,d.heading=Math.PI,d.speed=0,d.throttle=0,d.flank=0,d.depth=0,d.orderedDepth=0,d.berthing=0,d.snapCam=!0,v.yaw=0,v.smYaw=0,v.pitch=.15,v.smPitch=.15,v.pitch0=.15,v.zoom=1,v.smZoom=1,v.noRecentre=!1,d.heel=0,y.subActive=!0,y.helm=null,Vn("sub"),()=>{y.subActive=!1,y.subThrottle=0}},[e,d,v]),ae((j,S)=>{if(e!=="sub"){s.current&&s.current.position.set(0,-4e3,0);return}const k=Math.min(S,.05);y.t+=k;const E=d.heading,r=I.boost;d.throttle+=(I.throttle-d.throttle)*(1-Math.pow(.02,k)),d.flank+=((r?1:0)-d.flank)*(1-Math.pow(Uh,k)),y.subThrottle=Math.abs(d.throttle),d.rudder+=(I.rudder-d.rudder)*(1-Math.pow(8e-4,k));const T=R.clamp(d.depth/15,0,1),C=Os*(.7+.3*T)*(1+Bh*d.flank),P=d.throttle>=0?d.throttle*C:d.throttle*Hh;d.speed+=R.clamp(P-d.speed,-Ns*2,Ns)*k,d.speed-=d.speed*Math.abs(d.speed)*.0016*k;const M=R.lerp(Wh,1,R.clamp(Math.abs(d.speed)/7,0,1));d.heading+=d.rudder*_h*M*Math.sign(d.speed>=0?1:-1)*k,d.orderedDepth-=I.planes*Yh*k,d.orderedDepth=R.clamp(d.orderedDepth,0,Vo),I.surfaceQueued&&(I.surfaceQueued=!1,d.orderedDepth=0),I.periscopeQueued&&(I.periscopeQueued=!1,d.orderedDepth=Vh);const G=d.x+Math.sin(d.heading)*d.speed*k,L=d.z+Math.cos(d.heading)*d.speed*k,W=tr(G,L,d.depth);d.x=G+W.vx*k,d.z=L+W.vz*k;const K=W.vx*Math.cos(d.heading)-W.vz*Math.sin(d.heading);d.heading+=K*.008*k;const fe=R.clamp(Math.abs(d.speed)/Os,0,1),O=R.clamp(K*.02+d.rudder*M*fe*.34,-.6,.6);d.heel+=(O-d.heel)*(1-Math.pow(.12,k)),W.danger>.05&&(d.speed*=Math.pow(1-.22*W.danger,k));const $=le(d.x,d.z),te=Math.max(2,-$-Ds),se=d.depth<1.5;d.depth+=(d.orderedDepth-d.depth)*(1-Math.pow(.12,k)),d.depth>te?(d.scrape+=(1-d.scrape)*(1-Math.pow(.02,k)),d.depth=te,d.orderedDepth=Math.min(d.orderedDepth,te-2),Kt(Math.abs(d.speed)*.0016*k*60,"GROUNDED ON THE SHELF"),d.speed*=Math.pow(.3,k)):d.scrape+=(0-d.scrape)*(1-Math.pow(.05,k));const me=(d.depth-$o)/(Vo-$o);d.stress=me>0?Math.min(1,me*me):0,d.stress>0&&Kt(d.stress*.06*k,"HULL UNDER PRESSURE — COME UP");const ue=d.x+Math.sin(d.heading)*26,Le=d.z+Math.cos(d.heading)*26;if(le(ue,Le)>-d.depth+Ds*.5){d.speed*=Math.pow(.1,k);const qe=6,Ye=le(d.x+qe,d.z)-le(d.x-qe,d.z),Wt=le(d.x,d.z+qe)-le(d.x,d.z-qe),bo=Math.hypot(Ye,Wt)||1;d.x-=Ye/bo*20*k,d.z-=Wt/bo*20*k,d.scrape=Math.max(d.scrape,.5)}const Z=Math.hypot(d.x-Y.x,d.z-Y.z);if(Z<Y.pool*1.1&&d.berthing===0&&(d.berthing=1e-4),d.berthing>0){d.berthing=Math.min(1,d.berthing+k*.5),d.x+=(Y.berth.x-d.x)*(1-Math.pow(.1,k)),d.z+=(Y.berth.z-d.z)*(1-Math.pow(.1,k)),d.orderedDepth=0,d.speed*=Math.pow(.1,k);let Ye=Math.atan2(Y.dir[0],Y.dir[1])+Math.PI-d.heading;for(;Ye>Math.PI;)Ye-=Math.PI*2;for(;Ye<-Math.PI;)Ye+=Math.PI*2;d.heading+=Ye*(1-Math.pow(.2,k)),d.berthing>=1&&d.depth<1.2&&(y.footSpawn="rear",y.splash+=1,o?.("foot"))}d.depth<1.5!==se&&(y.splash+=1);const _e=ut(d.x,d.z,y.t,1),nt=1-R.clamp(d.depth/10,0,1),lt=-d.depth+_e.y*nt,jt=R.clamp((d.orderedDepth-d.depth)*.05,-.34,.34)*Math.sign(d.speed>=0?1:-1)+_e.dz*.8*nt;d.pitch+=(jt-d.pitch)*(1-Math.pow(.05,k));const Qe=s.current;Qe&&(Qe.position.set(d.x,lt,d.z),Qe.rotation.set(d.pitch+d.scrape*Math.sin(y.t*23)*.02,d.heading,-_e.dx*.5*nt+d.heel)),i.current&&(i.current.rotation.z+=d.throttle*9*k),c.current&&(c.current.visible=d.depth<2.5),h.current&&(h.current.visible=d.depth<7);const ft=ln(f);if(ft){const qe=ft[1]*(1+y.underwater*1.1+R.clamp(d.depth/260,0,1)*.6);for(const Ye of l.current)Ye.emissiveIntensity=qe}y.subPos.set(d.x,lt,d.z),oa(v,k,d.heading-E);const _=d.heading+Math.PI+_s+v.smYaw,je=Math.cos(v.smPitch),Ge=R.clamp(d.depth/240,0,1),ct=Math.max(p*2,52)*v.smZoom*(1-Ge*.2)*Cr(n.aspect);d.surfY+=(lt-d.surfY)*(1-Math.pow(.06,k));const mt=R.lerp(lt,d.surfY,ve.comfort),Me=$h.set(d.x+Math.sin(_)*je*ct,mt+p*.14+Math.sin(v.smPitch)*ct,d.z+Math.cos(_)*je*ct),D=le(Me.x,Me.z);if(Me.y=Math.max(Me.y,D+5),d.depth<22){const qe=1-R.clamp(d.depth/22,0,1),Ye=Pr(ut,Me,{x:d.x,z:d.z},y.t,1,9);Me.y=Math.max(Me.y,R.lerp(Me.y,Ye,qe))}d.depth>10&&(Me.y=Math.min(Me.y,_e.y-3)),d.snapCam?(d.snapCam=!1,n.position.copy(Me)):n.position.lerp(Me,1-Math.pow(De(8e-4,.02),k));const re=Math.max(0,Math.cos(v.smYaw+_s)),Oe=fe*De(46,26)*re;Bs.set(d.x+Math.sin(d.heading)*Oe,lt+6-d.pitch*30*fe*De(1,.35),d.z+Math.cos(d.heading)*Oe),n.lookAt(Bs);const q=De(1,0);q>.001&&n.rotateZ((d.scrape*Math.sin(y.t*19)*.015+d.heel*.35+W.danger*Math.sin(y.t*3.1)*.02)*q),Kn(n,64+fe*De(6,2)+d.flank*De(2,.6),k,.06,Ir);const ne=ut(n.position.x,n.position.z,y.t,1),J=R.clamp((ne.y-n.position.y-1)/3,0,1);y.underwater+=(J-y.underwater)*(1-Math.pow(.002,k)),y.depthBelow=Math.max(0,ne.y-n.position.y);const Te=R.lerp(8200,1700,y.underwater);Math.abs(n.far-Te)>20&&(n.far=Te,n.updateProjectionMatrix()),y.shelter+=((Z<Y.pool*3?.85:0)-y.shelter)*(1-Math.pow(.06,k));let Ee=Ue[0],Xe=1/0;for(const qe of Ue){const Ye=(d.x-qe.x)**2+(d.z-qe.z)**2;Ye<Xe&&(Xe=Ye,Ee=qe)}Er(k,{danger:W.danger,headingX:Math.sin(d.heading),headingZ:Math.cos(d.heading),toCentreX:Ee.x-d.x,toCentreZ:Ee.z-d.z,speed:d.speed,throttle:d.throttle})>=1&&(Kt(.22,"CAUGHT IN THE VORTEX"),d.x=Ee.x+(d.x>Ee.x?1:-1)*Ee.r*1.9,d.z=Ee.z+Ee.r*1.5,d.speed=0,d.orderedDepth=Math.min(Vo,d.depth+18),V.grip=0,y.splash+=1);let Ze=Math.atan2(Y.x-d.x,Y.z-d.z)-d.heading;for(;Ze>Math.PI;)Ze-=Math.PI*2;for(;Ze<-Math.PI;)Ze+=Math.PI*2;y.helm={sub:!0,speed:d.speed,maxSpeed:C,heading:d.heading,depth:d.depth,orderedDepth:d.orderedDepth,scrape:d.scrape,stress:d.stress,maelstrom:W.danger,toRear:Z,relRear:Ze,berthing:d.berthing>0,x:d.x,z:d.z,maxDepth:Vo,crushDepth:$o,cruise:Pt.level,flank:d.flank,freeCam:ve.freeCam,dark:R.clamp((d.depth-Hs)/($o-Hs),0,1)},Tr(k,y.helm)}),t.jsxs("group",{ref:s,position:[0,-4e3,0],children:[g&&t.jsx(ye,{name:f,loa:p,slim:wn(f),glow:ln(f),onMaterials:u,sink:Po(f),rotation:gn(f),tint:fa(f,"#c9b445"),emissive:"#2a2410",emissiveIntensity:.22}),t.jsx("group",{ref:c,position:[0,Qt(f,p),-p*.07],children:x&&t.jsx(ye,{name:"crew-heart.opt.glb",height:xn,rotation:0})}),g&&[-1,1].map(j=>[0,1,2,3,4,5,6].map(S=>t.jsxs("mesh",{position:[j*hr(f,p)*.55,Qt(f,p)-p*.02,p*(.24-S*.08)],children:[t.jsx("sphereGeometry",{args:[p*.011,6,5]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:2.4,toneMapped:!1})]},`port-${j}-${S}`))),t.jsxs("group",{visible:!g,children:[t.jsxs("mesh",{castShadow:!0,scale:[1,.82,2.9],children:[t.jsx("capsuleGeometry",{args:[5.4,8,6,12]}),t.jsx("meshStandardMaterial",{color:"#c9b03a",roughness:.55,metalness:.18})]}),t.jsxs("mesh",{position:[0,4.6,0],children:[t.jsx("boxGeometry",{args:[7.6,.8,26]}),t.jsx("meshStandardMaterial",{color:"#8a7a3a",roughness:.8})]}),t.jsxs("mesh",{position:[0,8,5],castShadow:!0,children:[t.jsx("cylinderGeometry",{args:[2.6,3,7,8]}),t.jsx("meshStandardMaterial",{color:"#d8cebf",roughness:.6})]}),t.jsxs("mesh",{position:[0,12,5],castShadow:!0,children:[t.jsx("coneGeometry",{args:[2.8,3,8]}),t.jsx("meshStandardMaterial",{color:"#5a6b8a",roughness:.6})]}),t.jsxs("mesh",{position:[0,3,-15],castShadow:!0,children:[t.jsx("boxGeometry",{args:[.9,10,5]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),t.jsxs("mesh",{position:[0,.4,-14],rotation:[0,0,Math.PI/2],children:[t.jsx("boxGeometry",{args:[.8,12,4]}),t.jsx("meshStandardMaterial",{color:"#b09a32",roughness:.6})]}),[-1,1].map(j=>[0,1,2,3].map(S=>t.jsxs("mesh",{position:[j*5.1,1.2,8-S*5],children:[t.jsx("sphereGeometry",{args:[.55,6,5]}),t.jsx("meshStandardMaterial",{color:"#8fe8c9",emissive:"#8fe8c9",emissiveIntensity:2.6,toneMapped:!1})]},`${j}-${S}`)))]}),(()=>{const j=Ct(f,p,io("headlamp")),S=Ct(f,p,io("stern lamp")),k=Ct(f,p,io("screw"));return t.jsxs(t.Fragment,{children:[t.jsxs("mesh",{position:j,children:[t.jsx("sphereGeometry",{args:[p*.028,10,8]}),t.jsx("meshStandardMaterial",{color:"#b8ffe2",emissive:"#8fe8c9",emissiveIntensity:4.2,toneMapped:!1})]}),t.jsx("sprite",{position:[j[0],j[1],j[2]+p*.06],scale:[p*.7,p*.7,1],children:t.jsx("spriteMaterial",{map:hn,color:"#7fe8c9",transparent:!0,opacity:.5,depthWrite:!1,blending:it})}),t.jsxs("mesh",{position:S,children:[t.jsx("sphereGeometry",{args:[p*.016,8,6]}),t.jsx("meshStandardMaterial",{color:"#ffb066",emissive:"#ffb066",emissiveIntensity:3,toneMapped:!1})]}),pa(f,!0).map(E=>{const r=Ct(f,p,E);return t.jsxs("group",{position:r,children:[t.jsxs("mesh",{children:[t.jsx("sphereGeometry",{args:[p*.009,6,5]}),t.jsx("meshStandardMaterial",{color:"#fff0c4",emissive:"#ffd98a",emissiveIntensity:3.6,toneMapped:!1})]}),t.jsx("sprite",{scale:[p*.15,p*.15,1],children:t.jsx("spriteMaterial",{map:hn,color:"#ffd08a",transparent:!0,opacity:.55,depthWrite:!1,blending:it,toneMapped:!1})})]},E.what)}),t.jsxs("group",{ref:i,position:k,children:[t.jsxs("mesh",{children:[t.jsx("torusGeometry",{args:[p*.021,p*.006,6,12]}),t.jsx("meshStandardMaterial",{color:"#6b5a20",roughness:.5,metalness:.45})]}),[0,1,2,3].map(E=>t.jsxs("mesh",{rotation:[0,0,E/4*Math.PI*2],children:[t.jsx("boxGeometry",{args:[p*.036,p*.011,p*.005]}),t.jsx("meshStandardMaterial",{color:"#8a7530",roughness:.42,metalness:.55})]},E))]})]})})(),t.jsx(Zh,{})]})}const Qh=`
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
`,Xh=`
  precision mediump float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.18, d) - smoothstep(0.34, 0.1, d) * 0.55;
    if (a * vFade < 0.02) discard;
    gl_FragColor = vec4(uColor, a * vFade * 0.85);
  }
`;function Zh(){const e=w.useRef(),o=w.useMemo(()=>{const s=new Float32Array(780),i=new Float32Array(260),c=new Float32Array(260),h=new Float32Array(260);for(let u=0;u<260;u++)s[u*3]=(Math.random()-.5)*3.4,s[u*3+1]=(Math.random()-.5)*2.6,s[u*3+2]=-14-Math.random()*4,i[u]=Math.random(),c[u]=.25+Math.random()*.3,h[u]=2+Math.random()*4;const l=new Lt;return l.setAttribute("position",new ee(s,3)),l.setAttribute("aPhase",new ee(i,1)),l.setAttribute("aRate",new ee(c,1)),l.setAttribute("aSize",new ee(h,1)),l.boundingSphere=new Zt(new z(0,0,-30),70),l},[]),n=w.useMemo(()=>({uTime:{value:0},uGain:{value:0},uColor:{value:new z(...ie(X.underGlow))}}),[]);return ae((a,s)=>{const i=e.current?.uniforms;if(!i)return;i.uTime.value+=s;const c=y.subActive?y.subThrottle*y.underwater:0;i.uGain.value+=(c-i.uGain.value)*.06}),t.jsx("points",{geometry:o,renderOrder:3,children:t.jsx("shaderMaterial",{ref:e,vertexShader:Qh,fragmentShader:Xh,uniforms:n,transparent:!0,depthWrite:!1,blending:it,fog:!1})})}const Wr=.42;let B=null,It=null,Se=null,na=!1,Tt=!0;function qh(){try{const e=localStorage.getItem("oni.audio");e!==null&&(Tt=e==="1")}catch{}return Tt}function Cn(e){Tt=e;try{localStorage.setItem("oni.audio",e?"1":"0")}catch{}return It&&B&&It.gain.setTargetAtTime(e?Wr:0,B.currentTime,.12),e&&B?.state==="suspended"&&B.resume(),Tt}function Jh(e){const o=e.sampleRate*2,n=e.createBuffer(1,o,e.sampleRate),a=n.getChannelData(0);for(let s=0;s<o;s++)a[s]=Math.random()*2-1;return n}function jo(e,o,n,a,s,i,c){const h=e.createBufferSource();h.buffer=o,h.loop=!0;const l=e.createBiquadFilter();l.type=n,l.frequency.value=a,l.Q.value=s;const u=e.createGain();return u.gain.value=i,h.connect(l).connect(u).connect(c),h.start(),{src:h,filt:l,gain:u}}function Pn(){if(na){B?.state==="suspended"&&B.resume();return}const e=window.AudioContext||window.webkitAudioContext;if(!e)return;B=new e,na=!0,It=B.createGain(),It.gain.value=Tt?Wr:0;const o=B.createDynamicsCompressor();o.threshold.value=-18,o.knee.value=22,o.ratio.value=3.4,o.attack.value=.006,o.release.value=.26;const n=B.createBiquadFilter();n.type="lowpass",n.frequency.value=18e3,n.Q.value=.4,It.connect(n).connect(o).connect(B.destination);const a=Jh(B),s=B.createGain();s.gain.value=1,s.connect(It);const i=jo(B,a,"bandpass",480,.7,.3,s),c=jo(B,a,"highpass",1900,.5,0,s),h=jo(B,a,"lowpass",220,1.1,.22,s),l=jo(B,a,"lowpass",96,1.6,0,s),u=B.createGain();u.gain.value=1,u.connect(o);const b=B.createOscillator();b.type="sawtooth",b.frequency.value=41;const m=B.createBiquadFilter();m.type="lowpass",m.frequency.value=190,m.Q.value=1.2;const g=B.createGain();g.gain.value=0,b.connect(m).connect(g).connect(u),b.start();const x=B.createOscillator(),f=B.createOscillator(),p=B.createGain();x.frequency.value=.07,f.frequency.value=.113,p.gain.value=260,x.connect(p),f.connect(p),p.connect(i.filt.frequency),x.start(),f.start();const d=B.createGain();d.gain.value=0,d.connect(It);const v=B.createGain();v.gain.value=.16,v.connect(d);for(const[S,k]of[[146.83,1],[220,.5],[293.66,.3]]){const E=B.createOscillator();E.type="sine",E.frequency.value=S;const r=B.createGain();r.gain.value=k;const T=B.createOscillator(),C=B.createGain();T.frequency.value=.21+Math.random()*.1,C.gain.value=S*.004,T.connect(C).connect(E.frequency),T.start(),E.connect(r).connect(v),E.start()}const j=jo(B,a,"bandpass",900,3.2,.05,d);return Se={stormBus:s,festBus:d,wind:i,rain:c,sea:h,roar:l,breath:j,buf:a,comp:o,muffle:n,humGain:g,subBus:u},B}function e0(){if(!B||!Se||!Tt)return;const e=B.currentTime;for(const[o,n]of[[0,.16],[.9,.045]]){const a=B.createOscillator(),s=B.createGain();a.type="sine",a.frequency.setValueAtTime(1420,e+o),a.frequency.exponentialRampToValueAtTime(1180,e+o+.5),s.gain.setValueAtTime(0,e+o),s.gain.linearRampToValueAtTime(n,e+o+.012),s.gain.exponentialRampToValueAtTime(1e-4,e+o+1.4),a.connect(s).connect(Se.subBus),a.start(e+o),a.stop(e+o+1.5)}}function t0(e=1){if(!B||!Se||!Tt)return;const o=B.currentTime,n=B.createBufferSource();n.buffer=Se.buf;const a=B.createBiquadFilter();a.type="bandpass",a.frequency.setValueAtTime(1500,o),a.frequency.exponentialRampToValueAtTime(240,o+.5),a.Q.value=.7;const s=B.createGain();s.gain.setValueAtTime(0,o),s.gain.linearRampToValueAtTime(.5*e,o+.02),s.gain.exponentialRampToValueAtTime(1e-4,o+.8),n.connect(a).connect(s).connect(It),n.start(o),n.stop(o+.9)}function so(e,o=1,n=82){if(!B||!Se)return;const a=B.createOscillator(),s=B.createGain();a.type="sine",a.frequency.setValueAtTime(n*2.1,e),a.frequency.exponentialRampToValueAtTime(n,e+.06),a.frequency.exponentialRampToValueAtTime(n*.7,e+.5),s.gain.setValueAtTime(0,e),s.gain.linearRampToValueAtTime(o,e+.004),s.gain.exponentialRampToValueAtTime(1e-4,e+.62),a.connect(s).connect(Se.festBus),a.start(e),a.stop(e+.7);const i=B.createBufferSource();i.buffer=Se.buf;const c=B.createBiquadFilter();c.type="bandpass",c.frequency.value=1400,c.Q.value=.8;const h=B.createGain();h.gain.setValueAtTime(o*.5,e),h.gain.exponentialRampToValueAtTime(1e-4,e+.09),i.connect(c).connect(h).connect(Se.festBus),i.start(e),i.stop(e+.12)}function o0(e=1,o=0){if(!B||!Se||!Tt)return;const n=B.currentTime+o,a=B.createBufferSource();a.buffer=Se.buf,a.loop=!0;const s=B.createBiquadFilter();s.type="lowpass",s.frequency.setValueAtTime(320,n),s.frequency.exponentialRampToValueAtTime(70,n+2.6),s.Q.value=.9;const i=B.createGain(),c=.5*e;i.gain.setValueAtTime(0,n),i.gain.linearRampToValueAtTime(c,n+.05),i.gain.exponentialRampToValueAtTime(c*.24,n+.7),i.gain.exponentialRampToValueAtTime(c*.42,n+1.35),i.gain.exponentialRampToValueAtTime(1e-4,n+3.4),a.connect(s).connect(i).connect(Se.stormBus),a.start(n),a.stop(n+3.6);const h=B.createOscillator(),l=B.createGain();h.type="sine",h.frequency.setValueAtTime(46,n),h.frequency.exponentialRampToValueAtTime(28,n+2.2),l.gain.setValueAtTime(0,n),l.gain.linearRampToValueAtTime(.32*e,n+.08),l.gain.exponentialRampToValueAtTime(1e-4,n+2.6),h.connect(l).connect(Se.stormBus),h.start(n),h.stop(n+2.8)}function n0(e=.5){if(!B||!Se||!Tt)return;const o=B.currentTime;for(const[n,a,s]of[[1,1,9],[2.76,.5,6],[5.4,.28,3.6],[8.9,.15,2.2]]){const i=B.createOscillator(),c=B.createGain();i.type="sine",i.frequency.value=61*n,c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(e*a,o+.008),c.gain.exponentialRampToValueAtTime(1e-4,o+s),i.connect(c).connect(It),i.start(o),i.stop(o+s+.1)}}let yt=0,Ln=0,Us=0,So=0;function a0(e){if(!na||!B||!Se||!Tt)return;const o=B.currentTime,n=e.shelter,a=e.underwater,s=e.subActive?.12:1,i=Math.sin(n*Math.PI*.5)*s*(1-a*.92);Se.stormBus.gain.setTargetAtTime(Math.cos(n*Math.PI*.5),o,.35),Se.festBus.gain.setTargetAtTime(i,o,.35),Se.rain.gain.gain.setTargetAtTime(.22*e.rain,o,.4),Se.wind.gain.gain.setTargetAtTime(.3*(.25+e.rain*.75),o,.5),Se.sea.gain.gain.setTargetAtTime(.22*(.3+e.rain*.7),o,.5),Se.roar.gain.gain.setTargetAtTime(.55*e.whirlNear*(1-a*.55),o,.3),Se.muffle.frequency.setTargetAtTime(18e3-a*17400,o,.18);const c=e.subActive?a*(.045+e.subThrottle*.11):e.helmActive?.03+e.helmSpeed*.1:0;if(Se.humGain.gain.setTargetAtTime(c,o,.25),e.splash!==Us&&(Us=e.splash,t0(1)),e.subActive&&a>.5?So===0?So=o+1.2:o>=So&&(e0(),So=o+6.5):So=0,n>.06){const l=.9090909090909091;for(yt<o&&(yt=o+.1);yt<o+.35;){const u=Ln%8,b=n*.9;u===0?so(yt,.85*b,74):u===2?so(yt,.45*b,88):u===4?so(yt,.7*b,74):u===6?so(yt,.4*b,92):u===7&&(so(yt,.3*b,96),so(yt+l*.5,.36*b,96)),Ln++,yt+=l}}else yt=0,Ln=0}function s0(){const e=w.useRef(!1),o=w.useRef(-1);return ae(()=>{if(a0(y),y.flash>.55&&!e.current){e.current=!0;const n=y.flashDir,a=500+Math.abs(n.z)*900;o0(Math.min(1,.55+y.flash*.6),a/340)}else y.flash<.08&&(e.current=!1);y.shot!==o.current&&(y.shot===4&&o.current>=0&&n0(.55),o.current=y.shot)}),null}function r0({mode:e,vessel:o}){return y.mode=e,y.vessel=o,ae(()=>Ic(),-100),null}function i0(){const e=xe(s=>s.gl),o=xe(s=>s.camera),n=xe(s=>s.setSize),a=xe(s=>s.size);return w.useEffect(()=>{const s=()=>{const i=window.innerWidth,c=window.innerHeight;i<2||c<2||a.width>i*.5&&a.height>c*.5||(n(i,c),e.setSize(i,c,!1),o.aspect=i/c,o.updateProjectionMatrix())};return s(),window.addEventListener("resize",s),document.addEventListener("visibilitychange",s),()=>{window.removeEventListener("resize",s),document.removeEventListener("visibilitychange",s)}},[e,o,n,a.width,a.height]),null}function l0({every:e=12}){const o=xe(a=>a.gl),n=w.useRef(0);return w.useEffect(()=>(o.shadowMap.autoUpdate=!1,o.shadowMap.needsUpdate=!0,()=>{o.shadowMap.autoUpdate=!0}),[o]),ae(()=>{n.current+=1,n.current%e===0&&(o.shadowMap.needsUpdate=!0)}),null}function c0({budget:e}){const o=xe(a=>a.setDpr),n=w.useRef(e.dpr[1]);return t.jsx(Zr,{bounds:a=>a>90?[50,90]:[46,58],flipflops:3,onDecline:()=>{n.current=Math.max(e.dpr[0],n.current-.25),o(n.current)},onIncline:()=>{n.current=Math.min(e.dpr[1],n.current+.25),o(n.current)},onFallback:()=>{n.current=e.dpr[0],o(e.dpr[0])}})}function h0(){const e=xe(a=>a.gl),o=xe(a=>a.scene),n=xe(a=>a.camera);return w.useEffect(()=>{const a=setTimeout(()=>{try{e.compile(o,n)}catch(s){console.warn("[onigashima] pre-compile skipped",s)}},900);return()=>clearTimeout(a)},[e,o,n]),null}function d0(){const{camera:e,scene:o,gl:n}=xe();return w.useEffect(()=>{},[e,o,n]),null}const u0=new ze(X.haze),p0=new ze(X.underHaze),f0=new ze(X.abyss),Ws=new ze;function m0(){const e=xe(o=>o.scene);return ae(()=>{if(!e.fog)return;const o=R.clamp(y.depthBelow/Bt.deepGrade,0,1),n=R.lerp(.0062,.0142,o);e.fog.density=R.lerp(y.fog,n,y.underwater),Ws.copy(p0).lerp(f0,o*.8),e.fog.color.lerpColors(u0,Ws,y.underwater)}),null}function g0({quality:e,budget:o,onRails:n,playing:a,speed:s,onShot:i,mode:c,onMode:h,crew:l,vessel:u="sunny"}){return t.jsxs(t.Fragment,{children:[t.jsx("color",{attach:"background",args:[X.haze]}),t.jsx("fogExp2",{attach:"fog",args:[X.haze,y.fog]}),t.jsx(mi,{storm:y}),t.jsx(Bl,{quality:e,shadowMap:o.shadowMap,shadows:o.shadows}),t.jsx(_i,{quality:e,segments:o.segments}),t.jsx(Fi,{quality:e,storm:y}),t.jsx(sl,{quality:e,shadows:o.shadows}),t.jsx(Ca,{quality:e,shadows:o.shadows}),e!=="low"&&t.jsx(Ca,{quality:e,shadows:!1,z:uo,k:H*cr*1.5}),t.jsx(hl,{quality:e,shadows:o.shadows}),t.jsx(ul,{quality:e,shadows:o.shadows}),t.jsx(Ol,{quality:e}),t.jsx(Hl,{shadows:o.shadows}),t.jsx(nh,{quality:e,shadows:o.shadows}),t.jsx(Xl,{quality:e}),t.jsx(ec,{quality:e}),t.jsx(ic,{quality:e}),t.jsx(wc,{quality:e}),t.jsx(Nc,{onRails:n&&c==="off",playing:a&&c==="off",speed:s,onShot:i,idle:c!=="off"}),t.jsx(r0,{mode:c,vessel:u}),t.jsx(ci,{}),t.jsx(hi,{}),t.jsx(di,{}),t.jsx(Dh,{mode:c,onMode:h,crew:l,vessel:u}),t.jsx(Kh,{mode:c,onMode:h}),t.jsx(s0,{}),t.jsx(i0,{}),t.jsx(m0,{}),t.jsx(d0,{}),t.jsx(h0,{}),t.jsx(c0,{budget:o}),o.shadows&&t.jsx(l0,{every:o.shadowEvery})]})}const Eo="#d63420",x0="rgba(8,6,16,0.72)",Ys="(max-width: 860px), (max-height: 520px)",Fn="min(7.5vh, 62px)",b0=3e3;function w0(e=2600,o=!0){const[n,a]=w.useState(!1);return w.useEffect(()=>{if(!o){a(!1);return}let s;const i=()=>{a(!1),clearTimeout(s),s=setTimeout(()=>a(!0),e)};i();for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.addEventListener(c,i,{passive:!0});return()=>{clearTimeout(s);for(const c of["pointermove","pointerdown","keydown","touchstart","wheel"])window.removeEventListener(c,i)}},[e,o]),n}function y0(){const[e,o]=w.useState(()=>typeof window<"u"&&window.matchMedia(Ys).matches);return w.useEffect(()=>{const n=window.matchMedia(Ys),a=()=>o(n.matches);return n.addEventListener?n.addEventListener("change",a):n.addListener(a),()=>{n.removeEventListener?n.removeEventListener("change",a):n.removeListener(a)}},[]),e}function Je({on:e,onClick:o,children:n,title:a,wide:s,block:i}){return t.jsx("button",{onClick:o,title:a,style:{appearance:"none",border:`1px solid ${e?Eo:"rgba(255,255,255,0.16)"}`,background:e?"rgba(214,52,32,0.22)":"rgba(8,6,16,0.5)",color:e?"#ffd9cf":"rgba(255,255,255,0.78)",borderRadius:3,padding:s||i?"8px 13px":"8px 10px",font:"600 10px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.13em",cursor:"pointer",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",transition:"border-color .18s, background .18s, color .18s",whiteSpace:"nowrap",width:i?"100%":void 0,textAlign:i?"right":"center",minHeight:32},children:n})}function v0({shot:e,shotIndex:o,shotCount:n,total:a,playing:s,onRails:i,speed:c,tier:h,override:l,dev:u,onPlay:b,onRailsToggle:m,onSpeed:g,onQuality:x,onRestart:f,audio:p,onAudio:d,mode:v,onMode:j,crew:S,onCrew:k,vessel:E,onVessel:r,onSwap:T,stage:C,veiled:P=!1}){const M=v!=="off",G=y0(),[L,W]=w.useState(!1),[K,fe]=w.useState(()=>({...ve}));w.useEffect(()=>ga(_=>fe({..._})),[]);const O=w0(2600,!M&&!L),$=w.useRef(),te=w.useRef(),se=w.useRef(),me=w.useRef(),ue=w.useRef(),Le=w.useRef(),We=i&&!M;w.useEffect(()=>W(!1),[v]),w.useEffect(()=>{let _,je=performance.now(),Ge=0,ct=0;const mt=Me=>{if(_=requestAnimationFrame(mt),$.current&&($.current.style.transform=`scaleX(${C.progress||0})`),se.current&&C.helm){const D=C.helm;if(D.onFoot)se.current.textContent=D.area==="deck"?`ON DECK · ${Math.round(Math.abs(D.speed)*1.94)} KN · BRG ${String(Math.round((D.heading*180/Math.PI+360)%360)).padStart(3,"0")}°   —  nobody is at the wheel`:D.area==="island"?D.toRear<220?"ASHORE · THE REAR COVE  —  the cave gate is in the cliff":D.nearPort?"ASHORE · THE PORT  —  the mouth is up the talus":`ASHORE · ONIGASHIMA   MOUTH ${Math.round(D.toMouth)}m`:"INSIDE THE SKULL DOME  ·  LIVE FLOOR";else if(D.sub){const re=Math.abs(D.speed)*1.94;if(D.berthing)se.current.textContent="BLOWING BALLAST — SURFACING IN THE REAR COVE";else{const Oe=D.maelstrom>.22?D.depth<26?"⚠ MAELSTROM PULL — DIVE":"MAELSTROM OVERHEAD — RUNNING UNDER":D.stress>.02?"⚠ HULL UNDER PRESSURE":D.scrape>.3?"HULL ON THE ROCK":"",q=Math.abs(D.relRear*180/Math.PI),ne=q<6?"· ON COURSE":D.relRear>0?`◀ ${q.toFixed(0)}°`:`${q.toFixed(0)}° ▶`,J=10,Te=Math.round(D.depth/D.maxDepth*J),Ee=Math.round(D.crushDepth/D.maxDepth*J);let Xe="";for(let Ze=0;Ze<J;Ze++)Xe+=Ze<Te?Ze>=Ee?"▓":"█":Ze===Ee?"┃":"·";const Lo=D.cruise===2?" ⟲FLK":D.cruise===1?" ⟲AHD":"";se.current.textContent=`DEPTH ${D.depth.toFixed(0).padStart(3,"0")}/${D.orderedDepth.toFixed(0).padStart(3,"0")}m ${Xe}  ${re.toFixed(0).padStart(2,"0")} KN${Lo}
COVE ${Math.round(D.toRear)}m  ${ne}`+(Oe?`
${Oe}`:"")}}else{const re=Math.abs(D.speed)*1.94,Oe=(D.heading*180/Math.PI+180)%360,q=Math.round((D.burst??0)*5),ne=D.burstLabel??"BURST",J=D.burst>=.999?`${ne} ▶READY`:`${ne} ${"█".repeat(q)}${"·".repeat(5-q)}`,Te=D.cruise===2?"  ⟲FLANK":D.cruise===1?"  ⟲AHEAD":D.flank>.5?"  FLANK":"";se.current.textContent=`${re.toFixed(0).padStart(2,"0")} KN   BRG ${Oe.toFixed(0).padStart(3,"0")}°   ${J}${Te}
`+(D.maelstrom>.2?"⚠ MAELSTROM — HARD OVER, FULL AHEAD":D.moored?"MOORING":D.aground>.3?"AGROUND — HELM OVER":D.underFire?`⚠ UNDER FIRE — STRAIGHT FOR THE ARCH    GATE ${Math.round(D.toGate)}m`:D.drift>.62?`MAKING LEEWAY — EASE THE HELM    GATE ${Math.round(D.toGate)}m`:`GATE ${Math.round(D.toGate)}m`)}}if(me.current){const D=oc(),re=tc(V.chain);me.current.textContent=V.done?"✔ OBJECTIVE COMPLETE":D?`▸ ${V.step+1}/${re}  ${D.text}`:"",me.current.style.color=V.done?"#8fe0a0":"#ffd9cf"}if(ue.current){const D=Math.max(0,Math.min(1,V.hull)),re=Math.max(0,Math.min(1,V.grip)),Oe=J=>{const Te=Math.round(J*12);return"█".repeat(Te)+"·".repeat(12-Te)},q=D>.6?"#8fe0a0":D>.3?"#ffc46b":"#ff6b5a",ne=re>.66?"#ff6b5a":re>.33?"#ffc46b":"rgba(255,255,255,0.45)";ue.current.innerHTML=`<span style="color:${q}">HULL ${Oe(D)}</span>`+(re>.02?`<span style="color:${ne};margin-left:14px">VORTEX ${Oe(re)}</span>`:"")}if(Le.current){const D=V.banner,re=Le.current;D&&re.dataset.text!==D.text&&(re.dataset.text=D.text,re.dataset.until=String(Me+b0),re.innerHTML=`<div class="og-banner-main">${D.text}</div>`+(D.sub?`<div class="og-banner-sub">${D.sub}</div>`:""),re.style.animation="none",re.offsetWidth,re.style.animation=""),D||(re.dataset.text="");const Oe=Number(re.dataset.until||0);re.style.opacity=re.dataset.text&&Me<Oe?"1":"0"}u&&te.current?(ct++,Ge+=Me-je,je=Me,Ge>400&&(te.current.textContent=`${Math.round(ct*1e3/Ge)} fps · shelter ${C.shelter.toFixed(2)} · fog ${(C.fog*1e4).toFixed(1)}e-4 · flash ${C.flash.toFixed(2)}`,Ge=0,ct=0)):je=Me};return _=requestAnimationFrame(mt),()=>cancelAnimationFrame(_)},[C,u]);const Z={opacity:O?.16:1,transform:O?"translateY(6px)":"none",transition:"opacity .5s ease, transform .5s ease"},be=[{key:"rails",on:!i,label:i?"FREE LOOK":"ON RAILS",title:"Take the camera off rails and look around",click:m,cinematicOnly:!0},{key:"helm",on:v==="helm",label:v==="helm"?"LEAVE HELM":"TAKE THE HELM",title:"Take the helm and sail the approach yourself",click:()=>j(v==="helm"?"off":"helm")},{key:"deck",on:!1,label:"WALK THE DECK",title:"Step back from the wheel and walk the deck as your pirate — she sails on",click:()=>{C.footSpawn="deck",j("foot")},helmOnly:!0},{key:"sub",on:v==="sub",label:v==="sub"?"LEAVE THE TANG":"DIVE THE POLAR TANG",title:"Dive under the maelstroms and take the back way in",click:()=>j(v==="sub"?"off":"sub")},{key:"foot",on:v==="foot",label:"LEAVE DOME",title:"Back to the approach",click:()=>j("off"),footOnly:!0}],_e=_=>v==="foot"?t.jsx(Je,{on:!0,wide:!0,block:_,title:"Swap between Luffy and Zoro, in their Wano gear",onClick:()=>k?.(S==="zoro"?"luffy":"zoro"),children:S==="zoro"?"ZORO · 和":"LUFFY · 和"}):null,nt=_=>{if(!M||v==="foot")return null;const je=ma(v,E);return t.jsx(Je,{on:!0,wide:!0,block:_,title:`Take ${je.who}'s ship — the three of them are sailing abreast (Y)`,onClick:()=>T?.(),children:_?`⇄  ${je.name}`:`⇄ ${je.who}`})},lt=(_,je)=>t.jsx(Je,{on:_.on,onClick:_.click,title:_.title,wide:!0,block:je,children:_.label},_.key),jt=_=>M?t.jsxs(t.Fragment,{children:[t.jsx(Je,{on:K.comfort>.01,wide:!0,block:_,title:"Steady the camera: less roll, less shake, less lens movement. The fix if the motion is making you queasy.",onClick:Sc,children:K.comfort>.9?"COMFORT · FULL":K.comfort>.01?"COMFORT · SOME":"COMFORT · OFF"}),t.jsx(Je,{on:K.freeCam,wide:!0,block:_,title:"Free camera: the view stays where you put it instead of swinging back behind the ship (V)",onClick:()=>co("freeCam"),children:K.freeCam?"CAM · FREE":"CAM · CHASE"}),t.jsx(Je,{on:Math.abs(K.lookSens-1)>.01,wide:!0,block:_,title:"How far a drag turns the view",onClick:zc,children:`LOOK ${K.lookSens.toFixed(2).replace(/0$/,"")}×`}),t.jsx(Je,{on:K.invertY,wide:!0,block:_,title:"Invert the vertical look axis",onClick:()=>co("invertY"),children:K.invertY?"Y · INVERTED":"Y · NORMAL"})]}):null,Qe=()=>M?t.jsx(Je,{on:!K.hud,title:"Hide the readouts, the chart and the objective — just the picture (H)",onClick:()=>co("hud"),children:K.hud?"◱":"◰"}):null,ft=_=>t.jsxs(t.Fragment,{children:[!M&&t.jsxs(t.Fragment,{children:[t.jsx(Je,{on:s,onClick:b,title:"Play / pause the cinematic",block:_,children:s?_?"❙❙  PAUSE":"❙❙":_?"▶  PLAY":"▶"}),[.5,1,2].map(je=>t.jsxs(Je,{on:c===je,onClick:()=>g(je),title:`${je}× speed`,block:_,children:[je,"×"]},je))]}),t.jsx(Je,{on:!1,onClick:f,title:"Restart from the open sea",block:_,children:_?"↺  RESTART":"↺"}),t.jsx(Je,{on:p,onClick:d,title:"Storm, taiko and a temple bell — all synthesised",block:_,children:p?_?"♪  SOUND ON":"♪":_?"♪̸  SOUND OFF":"♪̸"}),t.jsx(Je,{on:l!=="auto",wide:!0,block:_,title:"Render tier",onClick:()=>x(l==="auto"?"low":l==="low"?"mobile":l==="mobile"?"high":"auto"),children:l==="auto"?`AUTO · ${h.toUpperCase()}`:l.toUpperCase()})]});return t.jsxs(t.Fragment,{children:[!P&&t.jsxs(t.Fragment,{children:[[0,1].map(_=>t.jsx("div",{style:{position:"fixed",left:0,right:0,[_?"bottom":"top"]:0,height:We?Fn:0,background:"#05040a",zIndex:8,pointerEvents:"none",transition:"height .7s cubic-bezier(.6,0,.2,1)"}},_)),t.jsxs("div",{className:"og-tategaki",style:{opacity:M||L?0:1,transition:"opacity .6s ease"},children:["鬼ヶ島",t.jsx("span",{className:"og-tategaki-sub",children:"ONIGASHIMA"})]}),t.jsx("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 26px)",zIndex:10,pointerEvents:"none",animation:"ogCaption .85s cubic-bezier(.2,.9,.2,1) both",transition:"bottom .7s cubic-bezier(.6,0,.2,1)",maxWidth:"min(70vw, 620px)",display:M?"none":"block"},children:t.jsxs("div",{style:{display:"inline-block",borderLeft:`2px solid ${Eo}`,paddingLeft:12},children:[t.jsx("div",{style:{font:'700 clamp(15px, 2.5vw, 27px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif',letterSpacing:"0.07em",color:"#fff6f0",textShadow:"0 2px 22px rgba(0,0,0,0.95), 0 0 44px rgba(0,0,0,0.7)"},children:e?.title}),t.jsx("div",{style:{marginTop:5,font:"500 clamp(9px, 1.15vw, 12px)/1.5 ui-monospace, Menlo, monospace",letterSpacing:"0.19em",color:"rgba(255,225,215,0.66)",textShadow:"0 1px 12px rgba(0,0,0,0.95)"},children:e?.sub})]})},e?.id),t.jsx("div",{style:{position:"fixed",left:0,right:0,bottom:"var(--og-bottom)",height:2,zIndex:10,background:"rgba(255,255,255,0.08)",pointerEvents:"none",opacity:M?0:1,transition:"bottom .7s cubic-bezier(.6,0,.2,1), opacity .4s ease"},children:t.jsx("div",{ref:$,style:{height:"100%",background:`linear-gradient(90deg, ${Eo}, #ff9c2e)`,transformOrigin:"0 50%",transform:"scaleX(0)",boxShadow:`0 0 14px ${Eo}`}})}),t.jsx("div",{className:`og-chrome${M?"":" og-chrome-bottom"}`,style:{...M?{top:"calc(var(--og-top) + 14px)"}:{bottom:"calc(var(--og-bottom) + 22px)"},...Z},children:G?t.jsxs(t.Fragment,{children:[M&&t.jsx(Je,{on:!0,onClick:()=>j("off"),wide:!0,title:"Back to the cinematic",children:"✕ EXIT"}),Qe(),t.jsx(Je,{on:L,onClick:()=>W(_=>!_),title:"Menu",children:L?"✕":"☰"}),L&&t.jsxs("div",{className:"og-menu",children:[M&&t.jsxs(t.Fragment,{children:[_e(!0),nt(!0),jt(!0),t.jsx("div",{className:"og-menu-rule"})]}),be.filter(_=>!(_.cinematicOnly&&M)&&!(_.helmOnly&&v!=="helm")&&!(_.footOnly&&v!=="foot")).map(_=>lt(_,!0)),t.jsx("div",{className:"og-menu-rule"}),ft(!0)]})]}):t.jsxs(t.Fragment,{children:[Qe(),_e(!1),nt(!1),jt(!1),ft(!1),be.filter(_=>!(_.cinematicOnly&&M)&&!(_.helmOnly&&v!=="helm")&&!(_.footOnly&&v!=="foot")).map(_=>lt(_,!1))]})}),!M&&t.jsxs("div",{style:{position:"fixed",left:"max(20px, 3.2vw)",top:"calc(var(--og-top) + 18px)",zIndex:10,font:"600 10px/1 ui-monospace, Menlo, monospace",letterSpacing:"0.3em",color:"rgba(255,255,255,0.4)",textShadow:"0 1px 10px #000",transition:"top .7s cubic-bezier(.6,0,.2,1)",...Z,pointerEvents:"none"},children:[i?`SHOT ${String(o+1).padStart(2,"0")} / ${String(n).padStart(2,"0")}`:"FREE LOOK · DRAG ORBIT · WASD FLY · 2-FINGER / SHIFT-DRAG PAN · PINCH ZOOM · R HOME",t.jsx("span",{style:{opacity:.5},children:i?`  ·  ${Math.round(a)}s`:""})]}),M&&K.hud&&t.jsxs("div",{className:"og-instruments",children:[t.jsx("div",{ref:me,className:"og-objective"}),t.jsx("div",{ref:se,className:"og-readout"}),t.jsx("div",{ref:ue,className:"og-gauges"}),t.jsx("div",{className:"og-keys",children:v==="helm"?"W/S THROTTLE · A/D RUDDER · SHIFT FLANK · X ENGINE LATCH · B BURST · T WALK THE DECK · DRAG LOOK · R RECENTRE · V FREE CAM · WHEEL ZOOM":v==="sub"?"W/S THROTTLE · A/D RUDDER · SPACE RISE · C DIVE · SHIFT FLANK · X LATCH · F SURFACE · P PERISCOPE · DRAG LOOK · R RECENTRE · V FREE CAM":S==="zoro"?"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J ONIGIRI · U TATSUMAKI · K YAKKODORI · L SANZEN · G FLASH · H ASURA · DRAG ORBIT":"WASD MOVE · SHIFT RUN · SPACE JUMP · T TAKE THE WHEEL · J PISTOL · U GATLING · K BAZOOKA · L GIGANT · G ROCKET · H HAKI · N GEAR 2 · I BALLOON · DRAG ORBIT"})]}),M&&K.hud&&t.jsx("div",{ref:Le,className:"og-banner"}),u&&t.jsx("div",{ref:te,style:{position:"fixed",left:"max(20px, 3.2vw)",bottom:"calc(var(--og-bottom) + 96px)",zIndex:14,font:"500 10px/1 ui-monospace, Menlo, monospace",color:"#7fe0a0",background:x0,padding:"5px 8px",borderRadius:3,pointerEvents:"none"}})]}),t.jsx("style",{children:`
        /* The letterbox's height, as a variable, so every piece of furniture
           that has to clear it agrees with the bars AND with each other. This
           is the fix for the overlap: it was read in three places and set in
           none, so it resolved to its 0px fallback and the instrument panel
           climbed on top of the shot counter. */
        :root {
          --og-top: ${We?Fn:"0px"};
          --og-bottom: ${We?Fn:"0px"};
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
          color: ${Eo};
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
        /**
         * THE KEY LEGEND RETIRES ITSELF.
         *
         * It is a teaching aid — eleven controls listed once so a new player
         * knows they exist — and it was drawn for the entire session. On a
         * narrow window it wraps to six lines down the left of the picture,
         * which is a permanent block of grey text over the sea in exchange for
         * information nobody needs after the first fifteen seconds.
         *
         * A pure CSS fade, filling forwards, with no React state and no timer:
         * the panel is written to on rAF and must not gain a reconcile. It is
         * already hidden outright on touch devices (see the og-touch rule
         * below), which have the thumb kit instead; this is the desktop half
         * of the same idea.
         *
         * NO BACKTICKS IN HERE. This comment lives inside the style block's
         * own template literal, so one backtick ends the literal and the file
         * stops parsing — which is exactly how this edit failed the first
         * time. Same trap as the GLSL strings.
         */
        @keyframes ogKeysRetire {
          0%, 62% { opacity: .42; }
          100% { opacity: 0; }
        }
        .og-keys {
          margin-top: 7px;
          opacity: .42;
          font-size: 10px;
          letter-spacing: 0.16em;
          animation: ogKeysRetire 22s ease-in 1 forwards;
        }

        /* ── the banner ───────────────────────────────────────────────────── */
        /**
         * OUT OF THE MIDDLE OF THE PICTURE.
         *
         * It always expired on its own — the raid state carries an expiry and
         * tickChain clears it after three and a half seconds — so the bug was
         * never that it stayed. It was WHERE it stayed and HOW BIG: at 24% down
         * a portrait phone, three lines of 20px serif land squarely on the boat,
         * which is the one object the player is trying to look at, and three and
         * a half seconds of that is the first three and a half seconds of every
         * objective. It reads as something you have to wait out.
         *
         * So it moves up into the sky (where there is nothing but weather), the
         * type comes down, the measure is capped, and the fade out is slowed to
         * three quarters of a second so it leaves like a title rather than
         * blinking off. It was already transparent to pointer events and stays
         * that way — a look-drag through it has always worked, whatever it
         * looks like.
         *
         * (No backticks anywhere in this block — see the note further down.)
         */
        .og-banner {
          position: fixed;
          left: 50%;
          top: 15%;
          transform: translateX(-50%);
          z-index: 12;
          pointer-events: none;
          text-align: center;
          opacity: 0;
          transition: opacity .75s ease;
          animation: ogBanner .5s cubic-bezier(.2,.9,.2,1) both;
          max-width: min(84vw, 640px);
        }
        .og-banner-main {
          font: 700 clamp(15px, 2.9vw, 30px)/1.15 "Hiragino Mincho ProN", "Yu Mincho", Georgia, serif;
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
      `})]})}const zo="#d63420",M0=[{key:"sub",kanji:"潜",label:"DIVE THE POLAR TANG",sub:"Take Law’s submarine under the maelstroms to the back door",hero:!0,flag:"START HERE"},{key:"helm",kanji:"舵",label:"TAKE THE HELM",sub:"Sail the storm sea and run the gates"},{key:"off",kanji:"航",label:"WATCH THE APPROACH",sub:"Eight shots · 96 seconds · no controls"}];function k0({onPick:e}){const[o,n]=w.useState(!1),a=w.useRef(),s=620,i=l=>{o||(n(!0),e(l))},[c,h]=w.useState(!1);return w.useEffect(()=>{if(!o)return;const l=setTimeout(()=>h(!0),s);return()=>clearTimeout(l)},[o]),w.useEffect(()=>{const l=u=>{(u.key==="Escape"||u.key==="Enter")&&i("off")};return window.addEventListener("keydown",l),()=>window.removeEventListener("keydown",l)}),c?null:t.jsxs("div",{ref:a,className:"og-landing",style:{opacity:o?0:1,pointerEvents:o?"none":"auto",transition:`opacity ${s}ms cubic-bezier(.4,0,.2,1)`},children:[t.jsx("div",{className:"og-landing-veil"}),t.jsxs("div",{className:"og-landing-body",children:[t.jsx("div",{className:"og-landing-eyebrow",style:{animationDelay:".05s"},children:"WANO COUNTRY · NIGHT OF THE FIRE FESTIVAL"}),t.jsx("h1",{className:"og-landing-kanji",style:{animationDelay:".14s"},children:"鬼ヶ島"}),t.jsxs("div",{className:"og-landing-title",style:{animationDelay:".22s"},children:["ONIGASHIMA",t.jsx("span",{children:"THE RAID"})]}),t.jsx("p",{className:"og-landing-blurb",style:{animationDelay:".3s"},children:"A storm sea ringed with whirlpools, a demon’s skull carved into an island, and one channel in. Sail it, or go under it."}),t.jsx("div",{className:"og-landing-grid",children:M0.map((l,u)=>t.jsxs("button",{className:l.hero?"og-entry og-entry-hero":"og-entry",style:{animationDelay:`${.36+u*.07}s`},onClick:()=>i(l.key),children:[t.jsx("span",{className:"og-entry-kanji",children:l.kanji}),t.jsxs("span",{className:"og-entry-text",children:[l.flag&&t.jsx("span",{className:"og-entry-flag",children:l.flag}),t.jsx("span",{className:"og-entry-label",children:l.label}),t.jsx("span",{className:"og-entry-sub",children:l.sub})]}),t.jsx("span",{className:"og-entry-arrow",children:"›"})]},l.key))}),t.jsxs("div",{className:"og-landing-foot",style:{animationDelay:".7s"},children:[t.jsx("span",{children:"SOUND ON · HEADPHONES IF YOU HAVE THEM"}),t.jsx("span",{className:"og-landing-legal",children:"Fan-made and non-commercial. One Piece is Eiichiro Oda’s."})]})]}),t.jsx("style",{children:`
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
          /* Safe-area insets, because this is a full-bleed fixed overlay and
             the phones this link gets opened on have a notch at the top and a
             home indicator at the bottom. Without them the eyebrow sits under
             the clock and the legal line under the gesture bar. */
          padding:
            calc(max(28px, 5vh) + env(safe-area-inset-top, 0px)) 0
            calc(max(28px, 5vh) + env(safe-area-inset-bottom, 0px));
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
          color: ${zo};
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
          /* 14px of padding round two lines of 10px type is a 46px row, which
             is just over the 44px a thumb needs. Stated rather than left to
             the type: this is the only control on the page and a visitor who
             misses it leaves. */
          padding: 14px 14px;
          min-height: 56px;
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
          border-color: ${zo};
          background: rgba(214,52,32,0.16);
          transform: translateX(3px);
          outline: none;
        }
        .og-entry:active { transform: translateX(1px) scale(0.995); }
        .og-entry-kanji {
          flex: 0 0 34px;
          text-align: center;
          font: 700 22px/1 "Hiragino Mincho ProN", "Yu Mincho", "Songti SC", serif;
          color: ${zo};
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

        /* THE HEADLINE ROW. Everything here is doing one job: making it
           obvious, in the first half-second and without reading, which of
           these to press. A red edge, a lit ground, a bigger plate and a flag
           over the label. */
        .og-entry-hero {
          padding: 18px 16px;
          min-height: 74px;
          border-color: rgba(214,52,32,0.6);
          background:
            linear-gradient(100deg, rgba(214,52,32,0.2) 0%, rgba(214,52,32,0.05) 46%, rgba(10,8,18,0.5) 100%);
          box-shadow: 0 0 0 1px rgba(214,52,32,0.16), 0 8px 34px rgba(214,52,32,0.16);
        }
        .og-entry-hero .og-entry-kanji { flex-basis: 42px; font-size: 30px; }
        .og-entry-hero .og-entry-label { font-size: clamp(12px, 2.8vw, 14px); }
        .og-entry-hero .og-entry-arrow { color: ${zo}; }
        .og-entry-flag {
          display: inline-block;
          margin-bottom: 5px;
          padding: 3px 7px;
          border-radius: 3px;
          background: ${zo};
          font: 700 8px/1 ui-monospace, Menlo, monospace;
          letter-spacing: 0.2em;
          text-indent: 0.2em;
          color: #fff6f0;
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
      `})]})}const wa="#d63420",ya="#4aa9c9",j0=(e,o,n)=>e<o?o:e>n?n:e;function Yr(e,o,n){const a=w.useRef(o);a.current=o;const s=w.useRef(null),i=w.useRef({x:0,y:0});w.useEffect(()=>{const c=e.current;if(!c||!n)return;const h=g=>{if(s.current===null){s.current=g.pointerId,i.current={x:g.clientX,y:g.clientY};try{c.setPointerCapture?.(g.pointerId)}catch{}a.current.onMove(0,0,g.clientX,g.clientY),g.preventDefault()}},l=g=>{if(g.pointerId!==s.current)return;const x=i.current;a.current.onMove(g.clientX-x.x,g.clientY-x.y,x.x,x.y),g.preventDefault()},u=g=>{g.pointerId===s.current&&(s.current=null,a.current.onEnd(),g.cancelable&&g.preventDefault())};c.addEventListener("pointerdown",h),c.addEventListener("pointermove",l),c.addEventListener("pointerup",u),c.addEventListener("pointercancel",u),window.addEventListener("pointerup",u),window.addEventListener("pointercancel",u);const b=()=>{s.current!==null&&(s.current=null,a.current.onEnd())};c.addEventListener("lostpointercapture",b),window.addEventListener("blur",b);const m=()=>{document.visibilityState!=="visible"&&b()};return document.addEventListener("visibilitychange",m),()=>{c.removeEventListener("pointerdown",h),c.removeEventListener("pointermove",l),c.removeEventListener("pointerup",u),c.removeEventListener("pointercancel",u),c.removeEventListener("lostpointercapture",b),window.removeEventListener("pointerup",u),window.removeEventListener("pointercancel",u),window.removeEventListener("blur",b),document.removeEventListener("visibilitychange",m)}},[e,n])}function Vs({label:e,sub:o,onDown:n,onUp:a,tone:s="plain",wide:i=!1}){const[c,h]=w.useState(!1),l=w.useRef();w.useEffect(()=>{const b=l.current;if(!b)return;let m=null;const g=f=>{m=f.pointerId;try{b.setPointerCapture?.(m)}catch{}h(!0),n(),f.preventDefault(),f.stopPropagation()},x=f=>{f.pointerId===m&&(m=null,h(!1),a(),f.preventDefault(),f.stopPropagation())};return b.addEventListener("pointerdown",g),b.addEventListener("pointerup",x),b.addEventListener("pointercancel",x),b.addEventListener("pointerleave",x),()=>{b.removeEventListener("pointerdown",g),b.removeEventListener("pointerup",x),b.removeEventListener("pointercancel",x),b.removeEventListener("pointerleave",x)}},[n,a]);const u=s==="hot"?wa:s==="cool"?ya:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:l,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${c?u:"rgba(255,255,255,0.18)"}`,background:c?`color-mix(in srgb, ${u} 34%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:c?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function et({label:e,sub:o,onTap:n,on:a,tone:s="plain",wide:i=!1}){const c=w.useRef(),h=w.useRef(n);h.current=n,w.useEffect(()=>{const u=c.current;if(!u)return;const b=m=>{h.current(),m.preventDefault(),m.stopPropagation()};return u.addEventListener("pointerdown",b),()=>u.removeEventListener("pointerdown",b)},[]);const l=s==="hot"?wa:s==="cool"?ya:"rgba(255,255,255,0.22)";return t.jsxs("div",{ref:c,className:`og-btn${i?" og-btn-wide":""}`,style:{border:`1px solid ${a?l:"rgba(255,255,255,0.18)"}`,background:a?`color-mix(in srgb, ${l} 30%, rgba(8,6,16,0.5))`:"rgba(8,6,16,0.46)",color:a?"#fff6f0":"rgba(255,255,255,0.8)"},children:[t.jsx("span",{style:{fontSize:"1em",letterSpacing:"0.1em"},children:e}),o&&t.jsx("span",{className:"og-btn-sub",children:o})]})}function S0(){const[e,o]=w.useState(Pt.level);return w.useEffect(()=>Rc(o),[]),t.jsx(et,{label:e===2?"FLANK":e===1?"AHEAD":"ENGINE",sub:e?"set · tap":"latch",tone:e===2?"hot":"cool",on:e>0,onTap:Fr})}function z0({simple:e=!1}){const[o,n]=w.useState(ve.freeCam);w.useEffect(()=>ga(s=>n(s.freeCam)),[]);const a=w.useRef(null);return e?t.jsx(et,{label:"LEVEL",sub:"view",onTap:()=>I.recentreQueued=!0}):t.jsx(et,{label:o?"CAM FREE":"RECENTRE",sub:o?"tap×2 chase":"tap×2 free",on:o,onTap:()=>{const s=performance.now();if(a.current&&s-a.current<420){a.current=null,co("freeCam"),I.recentreQueued=!0;return}a.current=s,I.recentreQueued=!0}})}function T0({active:e}){const o=w.useRef(),n=w.useRef(),a=w.useRef(),s=78;return w.useEffect(()=>{if(!e)return;let i;const c=()=>{i=requestAnimationFrame(c);const h=a.current,l=y.helm;h&&(h.textContent=l?.sub?String(Math.round(l.orderedDepth)):"⇕")};return i=requestAnimationFrame(c),()=>cancelAnimationFrame(i)},[e]),Yr(o,{onMove:(i,c,h,l)=>{const u=o.current;if(!u)return;const b=u.getBoundingClientRect(),m=b.top+b.height/2,g=j0((l+c-m)/s,-1,1),x=Math.abs(g)<.1?0:g;oe.active=!0,oe.planes=-x;const f=n.current;f&&(f.style.transform=`translate(-50%, calc(-50% + ${g*s}px))`,f.style.borderColor=ya,f.style.background="rgba(74,169,201,0.34)")},onEnd:()=>{oe.planes=0;const i=n.current;i&&(i.style.transform="translate(-50%, -50%)",i.style.borderColor="rgba(255,255,255,0.3)",i.style.background="rgba(8,6,16,0.55)")}},e),t.jsxs("div",{ref:o,className:"og-planes",children:[t.jsx("div",{className:"og-planes-rail"}),t.jsx("span",{className:"og-planes-cap og-planes-up",children:"RISE"}),t.jsx("span",{className:"og-planes-cap og-planes-dn",children:"DIVE"}),t.jsxs("div",{ref:n,className:"og-planes-knob",children:[t.jsx("span",{ref:a,children:"⇕"}),t.jsx("span",{className:"og-planes-unit",children:"m"})]})]})}function E0({mode:e,crew:o="luffy",vessel:n="sunny",hud:a=!0,onSwap:s}){const[i,c]=w.useState(!1);w.useEffect(()=>{if(e!=="foot"){c(!1);return}const j=setInterval(()=>c(y.helm?.area==="deck"),200);return()=>clearInterval(j)},[e]);const h=w.useRef(),l=w.useRef(),u=w.useRef(),b=w.useRef(),m=62,g=7,x=w.useRef(e);if(x.current=e,Yr(h,{onMove:(j,S,k,E)=>{const r=Math.hypot(j,S),T=r>m?m/r:1,C=j*T,P=S*T,M=l.current,G=u.current;M&&(M.style.transform=`translate(${k-m}px, ${E-m}px)`,M.style.opacity="1"),G&&(G.style.transform=`translate(${k+C-26}px, ${E+P-26}px)`,G.style.opacity="1"),b.current&&(b.current.style.opacity="0");const L=Math.abs(C)<g?0:C/m,W=Math.abs(P)<g?0:P/m;oe.active=!0,x.current==="foot"?(oe.walk.x=L,oe.walk.z=-W):(oe.throttle=-W,oe.rudder=-L)},onEnd:()=>{l.current&&(l.current.style.opacity="0"),u.current&&(u.current.style.opacity="0"),b.current&&(b.current.style.opacity=""),oe.throttle=0,oe.rudder=0,oe.walk.x=0,oe.walk.z=0}},e!=="off"),w.useEffect(()=>(document.documentElement.classList.add("og-touch"),()=>document.documentElement.classList.remove("og-touch")),[]),w.useEffect(()=>()=>{oe.throttle=0,oe.rudder=0,oe.planes=0,oe.boost=!1,oe.walk.x=0,oe.walk.z=0},[e]),e==="off")return null;const f=e==="sub",p=e==="foot",d=i,v=o==="zoro";return t.jsxs(t.Fragment,{children:[t.jsx("div",{ref:h,style:{position:"fixed",left:0,top:0,width:"50vw",height:"100vh",zIndex:12,touchAction:"none",background:"transparent"}}),t.jsx("div",{ref:l,style:{position:"fixed",left:0,top:0,width:m*2,height:m*2,borderRadius:"50%",border:"1.5px solid rgba(255,255,255,0.22)",background:"rgba(8,6,16,0.3)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),t.jsx("div",{ref:u,style:{position:"fixed",left:0,top:0,width:52,height:52,borderRadius:"50%",border:`1.5px solid ${wa}`,background:"rgba(214,52,32,0.3)",boxShadow:"0 0 22px rgba(214,52,32,0.45)",pointerEvents:"none",opacity:0,zIndex:12,transition:"opacity .18s"}}),a&&t.jsxs("div",{ref:b,className:"og-hint",style:{left:"max(26px, 5vw)"},children:[t.jsx("div",{className:"og-ring"}),t.jsx("span",{children:p?"DRAG TO WALK":"DRAG TO STEER"})]}),a&&t.jsx("div",{className:"og-hint og-hint-right",children:t.jsx("span",{children:"LOOK · PINCH TO ZOOM · TAP×2 RECENTRE"})}),t.jsxs("div",{className:"og-right",children:[f&&t.jsx(T0,{active:!0}),t.jsxs("div",{className:"og-actions",children:[f&&t.jsx(et,{label:"SURFACE",sub:"blow all",onTap:()=>I.surfaceQueued=!0}),f&&t.jsx(et,{label:"PERISCOPE",sub:"6m",tone:"cool",onTap:()=>I.periscopeQueued=!0}),e==="helm"&&t.jsx(et,{label:cn(n).burst?.label??"BURST",sub:cn(n).burst?.sub??"coup de",tone:"cool",onTap:()=>I.burstQueued=!0}),(e==="helm"||d)&&t.jsx(et,{label:d?"TAKE WHEEL":"WALK DECK",sub:d?"back to it":"she sails on",onTap:()=>I.boardQueued=!0}),p&&t.jsx(et,{label:"JUMP",sub:"↑",onTap:()=>I.jumpQueued=!0}),p&&t.jsxs(t.Fragment,{children:[t.jsx(et,{label:v?"ONIGIRI":"PISTOL",sub:"strike",tone:"hot",onTap:()=>I.pistolQueued=!0}),t.jsx(et,{label:v?"YAKKO":"BAZOOKA",sub:v?"flying cut":"both fists",tone:"cool",onTap:()=>I.bazookaQueued=!0}),t.jsx(et,{label:v?"SANZEN":"GIGANT",sub:"heavy",tone:"hot",onTap:()=>I.gigantQueued=!0}),t.jsx(et,{label:v?"FLASH":"ROCKET",sub:"dash",tone:"cool",onTap:()=>I.rocketQueued=!0}),t.jsx(et,{label:v?"ASURA":"HAKI",sub:"burst",onTap:()=>I.hakiQueued=!0}),!v&&t.jsx(et,{label:"GEAR 2",sub:"overdrive",onTap:()=>I.gear2Queued=!0}),t.jsx(Vs,{label:v?"TATSUMAKI":"GATLING",sub:"hold",tone:"hot",onDown:()=>oe.gatling=!0,onUp:()=>oe.gatling=!1})]}),!p&&t.jsx(et,{label:"SWAP SHIP",sub:ma(e,n).who,tone:"cool",onTap:()=>s?.()}),!p&&t.jsx(S0,{}),t.jsx(Vs,{label:p?"RUN":"FLANK",sub:p?"»":"over",tone:"hot",onDown:()=>oe.boost=!0,onUp:()=>oe.boost=!1}),t.jsx(z0,{simple:p})]})]}),t.jsx("style",{children:`
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
      `})]})}const R0=168,A0=122,$s="(max-width: 860px), (max-height: 520px)",Gn=1950,Ks={x:0,z:340},tt={paper:"rgba(30,24,26,0.86)",sea:"rgba(16,14,24,0.55)",ring:"#6b5c48",land:"#3a2f28",skull:"#c2a578",skullInk:"#241c18",fairway:"rgba(226,198,150,0.10)",gate:"#d63420",port:"#f0ad50",rear:"#8fd4f2",whirl:"rgba(150,180,225,0.62)",you:"#ffe6a0",grid:"rgba(226,198,150,0.09)"},Vr=e=>({px:o=>(o-Ks.x)/Gn*(e/2)+e/2,pz:o=>(o-Ks.z)/Gn*(e/2)+e/2,pl:o=>o/Gn*(e/2)});function I0(e,o,n){const{px:a,pz:s,pl:i}=Vr(n);e.save(),e.scale(o,o),e.clearRect(0,0,n,n),e.fillStyle=tt.paper,e.fillRect(0,0,n,n),e.fillStyle=tt.sea,e.fillRect(0,0,n,n),e.strokeStyle=tt.grid,e.lineWidth=1;for(let m=1;m<5;m++){const g=m/5*n;e.beginPath(),e.moveTo(g,0),e.lineTo(g,n),e.moveTo(0,g),e.lineTo(n,g),e.stroke()}e.fillStyle=tt.fairway,e.fillRect(a(-tn.halfWidth),0,i(tn.halfWidth*2),n),e.strokeStyle=tt.ring,e.lineWidth=i(Mt*.34),e.beginPath(),e.arc(a(pe.x),s(pe.z),i(Mt),Math.PI*.34,Math.PI*.66,!0),e.stroke();const c=i(F.r*F.squash[0]),h=i(F.r*F.squash[2]),l=a(F.x),u=s(F.z);e.fillStyle=tt.skull;for(const m of[-1,1])e.beginPath(),e.moveTo(l+m*c*.62,u-h*.45),e.quadraticCurveTo(l+m*c*1.28,u-h*1.15,l+m*c*1.5,u-h*1.72),e.quadraticCurveTo(l+m*c*1.02,u-h*1.05,l+m*c*.3,u-h*.62),e.closePath(),e.fill();e.beginPath(),e.ellipse(l,u,c,h,0,0,Math.PI*2),e.fill(),e.fillStyle=tt.skullInk;for(const m of[-1,1])e.beginPath(),e.ellipse(l+m*c*.38,u+h*.22,c*.19,h*.15,0,0,Math.PI*2),e.fill();e.beginPath(),e.ellipse(l,u+h*.66,c*.26,h*.12,0,0,Math.PI*2),e.fill(),e.strokeStyle=tt.gate,e.lineWidth=1.4;for(const[m,g]of[[Ut,1],[uo,1.5]]){const x=i(95*H*g),f=s(m),p=x*.55;e.beginPath(),e.moveTo(a(0)-x*1.15,f-p*.5),e.lineTo(a(0)+x*1.15,f-p*.5),e.moveTo(a(0)-x*.92,f),e.lineTo(a(0)+x*.92,f),e.moveTo(a(0)-x*.86,f-p*.55),e.lineTo(a(0)-x,f+p*.6),e.moveTo(a(0)+x*.86,f-p*.55),e.lineTo(a(0)+x,f+p*.6),e.stroke()}for(const m of Ue){const g=a(m.x),x=s(m.z),f=i(m.r);e.strokeStyle=tt.whirl,e.lineWidth=1,e.beginPath(),e.arc(g,x,f,0,Math.PI*2),e.stroke(),e.lineWidth=1.1;for(const p of[0,Math.PI]){e.beginPath();for(let d=0;d<=22;d++){const v=d/22,j=p+m.dir*v*Math.PI*1.9,S=f*(1-v*.86),k=g+Math.cos(j)*S,E=x+Math.sin(j)*S;d?e.lineTo(k,E):e.moveTo(k,E)}e.stroke()}}const b=(m,g,x,f=2.6)=>{e.fillStyle=x,e.beginPath(),e.arc(a(m),s(g),f,0,Math.PI*2),e.fill()};b(Q.x,Q.z,tt.port),b(de.x,de.z,tt.land,2),b(Y.gate.x,Y.gate.z,tt.rear),e.restore()}function C0({mode:e}){const o=w.useRef(),n=w.useRef(),a=typeof window>"u"?1:Math.min(2,window.devicePixelRatio||1),[s,i]=w.useState(()=>typeof window<"u"&&window.matchMedia($s).matches);w.useEffect(()=>{const b=window.matchMedia($s),m=()=>i(b.matches);return b.addEventListener?b.addEventListener("change",m):b.addListener(m),()=>{b.removeEventListener?b.removeEventListener("change",m):b.removeListener(m)}},[]);const[c,h]=w.useState(!0),l=s?A0:R0,u=w.useMemo(()=>{if(typeof document>"u")return null;const b=document.createElement("canvas");return b.width=l*a,b.height=l*a,I0(b.getContext("2d"),a,l),b},[a,l]);return w.useEffect(()=>{if(!n.current||!u||!c)return;const{px:b,pz:m}=Vr(l),g=n.current.getContext("2d");let x;const f=()=>{x=requestAnimationFrame(f);const p=y.helm;if(g.setTransform(1,0,0,1,0,0),g.clearRect(0,0,l*a,l*a),g.drawImage(u,0,0),!p||p.x===void 0)return;g.save(),g.scale(a,a);const d=b(p.x),v=m(p.z),j=p.sub&&p.depth>4;g.translate(d,v),p.heading!==void 0?(g.rotate(Math.PI-p.heading),g.beginPath(),g.moveTo(0,-5.5),g.lineTo(3.4,4),g.lineTo(0,2),g.lineTo(-3.4,4),g.closePath()):(g.beginPath(),g.arc(0,0,3,0,Math.PI*2)),g.fillStyle=j?"rgba(0,0,0,0)":tt.you,g.strokeStyle=tt.you,g.lineWidth=1.2,g.fill(),g.stroke(),g.restore(),j&&(g.save(),g.scale(a,a),g.fillStyle=tt.rear,g.font="600 9px ui-monospace, SFMono-Regular, Menlo, monospace",g.textAlign="right",g.fillText(`${Math.round(p.depth)}m DOWN`,l-6,l-6),g.restore())};return f(),()=>cancelAnimationFrame(x)},[u,a,e,c,l]),e==="off"?null:c?t.jsxs("div",{className:"og-minimap",style:{position:"fixed",left:14,bottom:14,zIndex:12,width:l,height:l,borderRadius:4,overflow:"hidden",border:"1px solid rgba(255,255,255,0.16)",backdropFilter:"blur(9px)",WebkitBackdropFilter:"blur(9px)",pointerEvents:"none"},children:[t.jsx("canvas",{ref:n,width:l*a,height:l*a,style:{width:l,height:l,display:"block"}}),t.jsx("div",{style:{position:"absolute",top:4,left:6,font:"600 8px/1 ui-monospace, SFMono-Regular, Menlo, monospace",letterSpacing:"0.16em",color:"rgba(255,255,255,0.5)"},children:"鬼ヶ島"}),t.jsx("button",{className:"og-map-close",onClick:()=>h(!1),"aria-label":"Hide the chart",children:"✕"}),t.jsx("canvas",{ref:o,style:{display:"none"}}),t.jsx("style",{children:Qs})]}):t.jsxs(t.Fragment,{children:[t.jsx("button",{className:"og-map-tab",title:"Show the chart",onClick:()=>h(!0),"aria-label":"Show the chart",children:"鬼ヶ島 CHART"}),t.jsx("style",{children:Qs})]})}const Qs=`
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
`,Xs={low:{dpr:[1,1.1],shadows:!1,aa:!1,shadowMap:512,segments:110,shadowEvery:24,scene:"low"},mobile:{dpr:[1,1.5],shadows:!0,aa:!1,shadowMap:1024,segments:168,shadowEvery:16,scene:"mid"},high:{dpr:[1,2],shadows:!0,aa:!0,shadowMap:2048,segments:240,shadowEvery:10,scene:"high"}};function P0(){if(typeof navigator>"u")return"high";const e=navigator.hardwareConcurrency||4,o=typeof navigator.deviceMemory=="number"?navigator.deviceMemory:null;return/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.maxTouchPoints>1&&/Macintosh/.test(navigator.userAgent)?e<=3||o!==null&&o<=2?"low":"mobile":e<=2||o!==null&&o<=2?"low":"high"}const L0=null;function D0(){const e=w.useMemo(()=>!1,[]),[o]=w.useState(P0),[n,a]=w.useState("auto"),s=n==="auto"?o:n,i=Xs[s]??Xs.high;w.useEffect(()=>{Xi(i.scene!=="low")},[i.scene]),w.useMemo(()=>er(i.scene),[i.scene]),w.useMemo(()=>Ec(),[]),w.useEffect(()=>Ac(),[]);const c=w.useMemo(()=>typeof navigator>"u"?!1:typeof location<"u"&&new URLSearchParams(location.search).has("touch")?!0:navigator.maxTouchPoints>0,[]),[h,l]=w.useState(0),[u,b]=w.useState(!0),[m,g]=w.useState(!0),[x,f]=w.useState(1),[p,d]=w.useState(ms[0]),[v,j]=w.useState(0),[S,k]=w.useState(qh),[E,r]=w.useState(()=>{if(typeof location>"u")return"off";const Z=new URLSearchParams(location.search).get("mode");return Z==="helm"||Z==="sub"||Z==="foot"?Z:"off"}),[T,C]=w.useState(()=>typeof location>"u"?"luffy":new URLSearchParams(location.search).get("crew")==="zoro"?"zoro":"luffy"),[P,M]=w.useState(()=>typeof location>"u"?"sunny":new URLSearchParams(location.search).get("ship")==="punk"?"punk":"sunny");w.useEffect(()=>{if(!S)return;const Z=()=>{Pn(),Cn(!0)};for(const be of["pointerdown","keydown","touchstart"])window.addEventListener(be,Z,{once:!0,passive:!0});return()=>{for(const be of["pointerdown","keydown","touchstart"])window.removeEventListener(be,Z)}},[S]);const G=w.useCallback(()=>{k(Z=>{const be=!Z;return be&&Pn(),Cn(be),be})},[]),[L,W]=w.useState(()=>typeof location<"u"&&new URLSearchParams(location.search).has("enter")),K=w.useCallback(Z=>{S&&(Pn(),Cn(!0)),Z==="off"?(y.jumpTo=0,b(!0),g(!0)):r(Z),W(!0)},[S]),[fe,O]=w.useState(()=>ve.hud);w.useEffect(()=>ga(Z=>O(Z.hud)),[]);const[$,te]=w.useState(!1),se=w.useRef(!0);w.useEffect(()=>{if(qn(),se.current){se.current=!1;return}te(!0);const Z=setTimeout(()=>te(!1),210);return()=>clearTimeout(Z)},[E]);const me=w.useCallback(()=>{const Z=ma(E,P);qn(),M(Z.vessel),r(Z.mode)},[E,P]);w.useEffect(()=>{if(E==="off")return;let Z;const be=()=>{Z=requestAnimationFrame(be),I.swapQueued&&(I.swapQueued=!1,me())};return Z=requestAnimationFrame(be),()=>cancelAnimationFrame(Z)},[E,me]);const ue=w.useCallback((Z,be)=>{j(Z),d(be)},[]),Le=w.useCallback(()=>{Qi(),l(Z=>Z+1),b(!0),g(!0)},[]),We=w.useMemo(()=>typeof location<"u"&&new URLSearchParams(location.search).has("dev"),[]);return e?t.jsx(w.Suspense,{fallback:null,children:t.jsx(L0,{})}):t.jsxs(t.Fragment,{children:[t.jsx(qr,{shadows:i.shadows,dpr:i.dpr,gl:{antialias:i.aa,powerPreference:"high-performance",toneMapping:ii,toneMappingExposure:ui,preserveDrawingBuffer:!0},camera:{fov:52,near:1,far:8200,position:[-190,26,880]},frameloop:"always",children:t.jsx(w.Suspense,{fallback:null,children:t.jsx(g0,{quality:i.scene,budget:i,onRails:m,playing:u,speed:x,onShot:ue,mode:E,onMode:r,crew:T,vessel:P},h)})}),c&&L&&t.jsx(E0,{mode:E,crew:T,vessel:P,hud:fe,onSwap:me}),L&&fe&&t.jsx(C0,{mode:E}),t.jsx("div",{"aria-hidden":!0,style:{position:"fixed",inset:0,zIndex:30,background:"#05040a",pointerEvents:"none",opacity:$?1:0,transition:$?"opacity .2s ease-in":"opacity .42s ease-out"}}),!L&&t.jsx(k0,{onPick:K}),t.jsx(v0,{veiled:!L,shot:p,shotIndex:v,shotCount:ms.length,total:ta,playing:u,onRails:m,speed:x,tier:s,override:n,dev:We,onPlay:()=>b(Z=>!Z),onRailsToggle:()=>g(Z=>!Z),onSpeed:f,onQuality:a,onRestart:Le,audio:S,onAudio:G,mode:E,onMode:r,crew:T,onCrew:C,vessel:P,onVessel:M,onSwap:me,stage:y})]})}export{D0 as default};
