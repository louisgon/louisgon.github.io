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
