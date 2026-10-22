export const STAR_VERT = `attribute float aSize; attribute float aTail; uniform float uZ, uStretch, uDepth, uTime, uPR; varying float vA, vT; varying vec3 vC;
  void main(){ vec3 p = position; p.z = mod(p.z + uZ, uDepth) - uDepth; float d = clamp(1.0 + p.z / uDepth, 0.0, 1.0);
  float seed = fract(sin(dot(position.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vA = pow(d, 1.6) * smoothstep(0.0, 0.05, 1.0 - d) * (0.72 + 0.28 * sin(uTime * (0.5 + seed * 1.6) + seed * 40.0)); vT = aTail;
  vC = mix(vec3(0.74, 0.87, 1.0), vec3(1.0, 0.88, 0.74), step(0.88, seed));
  p.z -= aTail * uStretch * (0.3 + d); vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = aSize * (1.1 + d * 2.4) * uPR; gl_Position = projectionMatrix * mv; }`;
export const STAR_POINT_FRAG = 'uniform float uFade; uniform vec3 uDisc; varying float vA, vT; varying vec3 vC; void main(){ if (distance(gl_FragCoord.xy, uDisc.xy) < uDisc.z) discard; vec2 q = gl_PointCoord - 0.5; float r2 = dot(q, q) * 4.0; if (r2 > 1.0) discard; gl_FragColor = vec4(vC, (exp(-r2 * 3.5) - 0.03) * vA * uFade); }';
export const STAR_LINE_FRAG = 'uniform float uFade, uStretch; uniform vec3 uDisc; varying float vA, vT; varying vec3 vC; void main(){ if (distance(gl_FragCoord.xy, uDisc.xy) < uDisc.z) discard; gl_FragColor = vec4(vC, vA * uFade * smoothstep(0.0, 8.0, uStretch) * (1.0 - vT) * (1.0 - vT)); }';
export const NOISE = `vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}vec4 pm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 ti(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float sn(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;i=m289(i);vec4 p=pm(pm(pm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 norm=ti(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm(vec3 p){float f=0.,a=.5;for(int i=0;i<5;i++){f+=a*sn(p);p*=2.03;a*=.5;}return f;}`;
export const QUAD_VERT = 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }';
export const NEBULA_FRAG = `uniform vec2 uRes; uniform float uT, uNeb, uDim; uniform vec3 uHue; ${NOISE}
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main(){ vec2 f = gl_FragCoord.xy, uv = f / uRes; vec2 p = (f - 0.5 * uRes) / uRes.y; float t = uT;
      vec3 col = vec3(0.010, 0.016, 0.036) + vec3(0.02, 0.035, 0.08) * (1.0 - uv.y);
      float n = fbm(vec3(p * 1.25 + vec2(t * 0.006, 0.0), t * 0.012)); float n2 = fbm(vec3(p * 2.4 + n * 0.9, 3.7 + t * 0.01));
      float neb = smoothstep(-0.15, 0.85, n) * smoothstep(-0.35, 0.75, n2); float dust = smoothstep(0.1, 0.7, fbm(vec3(p * 4.0 + n2, 9.0)));
      col += uHue * neb * 0.42 * uNeb * (1.0 - dust * 0.55) + vec3(0.55, 0.32, 0.85) * pow(neb, 3.0) * 0.22 * uNeb;
      vec2 c = uv - 0.5; col *= 1.0 - dot(c, c) * 1.1;
      col *= 1.0 - uDim;
      gl_FragColor = vec4(col, 1.0); }`;
export const BLIT_VERT = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
export const BLIT_FRAG = 'uniform sampler2D uTex; uniform float uA, uT; varying vec2 vUv; float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); } void main(){ vec3 c = texture2D(uTex, vUv).rgb + (h(gl_FragCoord.xy + fract(uT) * 91.0) - 0.5) * 0.012; gl_FragColor = vec4(c * uA, uA); }';
export const LAYV = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
export const LAYF = `uniform sampler2D uTex; uniform float uT, uA, uG, uB, uF; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  float lumOf(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  float satOf(vec3 c){ return max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)); }
  void main(){ vec2 px = vec2(vUv.x * 3200.0, (1.0 - vUv.y) * 1800.0), uv = vUv; float glint = 0.0;
  #ifdef DRIFT
    uv = (uv - 0.5) / 1.025 + 0.5 + vec2(sin(uT * 0.16) * 0.01, sin(uT * 0.12 + 1.0) * 0.005);
  #endif
  #ifdef GIANT
    const float ca = 0.925, sa = 0.379; vec2 q = (px - vec2(1902.0, 616.0)) / 583.0, rd = px - vec2(1100.0, 35.0); float r2 = dot(q, q);
    float s = ca * rd.x + sa * rd.y, band = 1.0 - smoothstep(110.0, 170.0, abs(-sa * rd.x + ca * rd.y));
    if (r2 < 1.0) { float lat = -sa * q.x + ca * q.y, flow = (vn(vec2(lat * 14.0, uT * 0.35)) - 0.5) * 2.0 + sin(lat * 21.0 + uT * 0.5) * 0.4;
      uv += vec2(ca / 3200.0, -sa / 1800.0) * flow * 10.0 * sqrt(1.0 - r2) * smoothstep(1.0, 0.86, r2) * (1.0 - band); }
    glint = band * (exp(-pow((s - mod(uT * 240.0, 3400.0) + 600.0) / 140.0, 2.0)) * 0.9 + vn(vec2(s / 50.0 - uT * 1.5, 0.5)) * 0.16);
  #endif
  #ifdef FLOW
    float X = px.x - 3375.0, hzY = 5518.0 - sqrt(5372.0 * 5372.0 - X * X), below = (px.y - hzY) / 1800.0, near = smoothstep(0.0, 0.05, below);
    #ifdef CURVE
    uv.y += (hzY - 1036.0) / 1800.0 * CURVE;
    #endif
    vec4 base = texture2D(uTex, uv);
    float dist = 1.0 / max(below, 0.012); vec2 g = vec2((vUv.x - 0.5) * dist * 0.32, dist * 0.06);
    vec4 moved = texture2D(uTex, uv + (vec2(vn(g * 2.5 + vec2(uT * 0.06, 0.0)), vn(g * 2.5 + vec2(9.2, -uT * 0.05))) - 0.5) * FLOW * clamp(below * 5.0, 0.0, 1.0));
    float cloudy = smoothstep(0.55, 0.85, lumOf(base.rgb)) * (1.0 - smoothstep(0.18, 0.38, satOf(base.rgb))) * smoothstep(0.97, 1.0, base.a) * smoothstep(0.97, 1.0, moved.a) * near;
    vec4 col = vec4(mix(base.rgb, moved.rgb, cloudy), base.a);
  #else
    vec4 col = texture2D(uTex, uv);
  #endif
  #ifdef GIANT
    col.rgb += vec3(1.0, 0.95, 0.86) * glint * smoothstep(0.3, 0.6, lumOf(col.rgb)) * (1.0 - smoothstep(0.25, 0.45, satOf(col.rgb)));
  #endif
  #ifdef HAZE
    float lum = lumOf(col.rgb); col.rgb = mix(vec3(lum), col.rgb, 0.84) * 0.96;
    vec3 air = mix(vec3(0.58, 0.7, 0.88), vec3(1.0, 0.84, 0.66), exp(-pow((vUv.x - 0.878) * 3.0, 2.0)));
    col.rgb = mix(col.rgb, air * (0.55 + 0.45 * lum), (1.0 - smoothstep(0.0, 0.32, below)) * HAZE);
  #endif
  #ifdef HORIZON
    float sun = exp(-pow((vUv.x - 0.878) * 4.0, 2.0)) * smoothstep(0.02, 0.08, below) * (1.0 - smoothstep(0.16, 0.32, below));
    col.rgb += vec3(1.0, 0.86, 0.62) * pow(vn(vUv * vec2(260.0, 150.0) + vec2(uT * 0.6, uT * 0.2)), 10.0) * sun * smoothstep(0.6, 0.92, lumOf(col.rgb)) * 0.3;
  #endif
  #ifdef CITY
    vec2 o = vec2(6.0 / 3200.0, 6.0 / 1800.0);
    float nb = (lumOf(texture2D(uTex, uv + vec2(o.x, 0.0)).rgb) + lumOf(texture2D(uTex, uv - vec2(o.x, 0.0)).rgb) + lumOf(texture2D(uTex, uv + vec2(0.0, o.y)).rgb) + lumOf(texture2D(uTex, uv - vec2(0.0, o.y)).rgb)) * 0.25;
    float cl = smoothstep(0.42, 0.78, lumOf(col.rgb)) * smoothstep(0.16, 0.4, col.r - col.b) * smoothstep(0.08, 0.22, lumOf(col.rgb) - nb);
    col.rgb *= 1.0 + cl * ((vn(px / 7.0 + vec2(uT * 1.3, -uT * 0.9)) - 0.5) * 1.1 + 0.15 * sin(uT * 2.3 + px.x * 0.05));
  #endif
  #ifdef ENGINE
    float jet = smoothstep(0.45, 0.85, col.g) * smoothstep(0.55, 0.92, col.b) * (1.0 - smoothstep(0.35, 0.65, col.r));
    col.rgb += vec3(0.35, 0.85, 1.0) * jet * (0.5 + 0.18 * sin(uT * 3.1) + 0.07 * sin(uT * 7.3));
  #endif
  #ifdef RIM
    col.a *= 0.82 + 0.18 * sin(uT * 1.1) + 0.1 * sin(uT * 0.37 + vUv.x * 6.0);
  #endif
  #ifdef FEATHER
    col.a *= smoothstep(0.0, uF, vUv.y);
  #endif
  col.rgb = mix(col.rgb, vec3(lumOf(col.rgb)) * vec3(0.78, 0.9, 1.14), uG) * uB;
  gl_FragColor = vec4(col.rgb * col.a, col.a) * uA; }`;
export const SUNF = `uniform float uT, uA; varying vec2 vUv; void main(){ vec2 q = (vUv - 0.5) * 2.0; float r = length(q), b = 1.0 + sin(uT / 2.1) * 0.08;
  #if defined(JET)
    float a = (exp(-r * r * 16.0) * 0.85 + exp(-r * 5.5) * 0.22) * (0.8 + 0.14 * sin(uT * 3.1) + 0.06 * sin(uT * 7.3)); vec3 c = vec3(0.45, 0.88, 1.0);
  #elif defined(PLUME)
    float u = vUv.x, w = mix(0.3, 1.0, u), core = exp(-pow(q.y / (0.16 * w), 2.0)), glow = exp(-pow(q.y / (0.5 * w), 2.0));
    float a = (core * 0.95 + glow * 0.3) * pow(1.0 - u, 1.5) * smoothstep(0.0, 0.05, u) * (0.92 + 0.08 * sin(uT * 31.0 + u * 9.0)); vec3 c = mix(vec3(0.3, 0.7, 1.0), vec3(0.94, 0.99, 1.0), core * (1.0 - u));
  #elif defined(CORE)
    float a = exp(-pow(r / (0.05 * b), 2.0)) + exp(-r / 0.07) * 0.32 + exp(-abs(q.y) / 0.004) * exp(-abs(q.x) / (0.32 * b)) * (0.5 + 0.15 * sin(uT / 2.9)); vec3 c = mix(vec3(1.0, 0.8, 0.58), vec3(1.0, 0.99, 0.95), exp(-r / 0.05));
  #else
    float a = (exp(-r * r * 5.0) * 0.5 + exp(-r * 6.0) * 0.22) * (1.0 - smoothstep(0.75, 1.0, r)) * (0.85 + sin(uT / 3.3) * 0.15); vec3 c = vec3(1.0, 0.66, 0.36);
  #endif
  gl_FragColor = vec4(c, a * uA); }`;
