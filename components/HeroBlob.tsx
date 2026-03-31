"use client";

import { useEffect, useRef } from "react";
import { isMobile, isLowEnd, prefersReducedMotion } from "@/lib/device";

export default function HeroBlob() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isMobile() || isLowEnd() || prefersReducedMotion()) return;

    let animationId: number;
    let destroyed = false;

    async function init() {
      const OGL = await import("ogl");
      if (destroyed) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const renderer = new OGL.Renderer({
        canvas,
        alpha: true,
        antialias: true,
        dpr: Math.min(window.devicePixelRatio, 2),
      });
      const gl = renderer.gl;

      const camera = new OGL.Camera(gl, { fov: 45 });
      camera.position.set(0, 0, 4);

      const scene = new OGL.Transform();

      function resize() {
        renderer.setSize(canvas!.clientWidth, canvas!.clientHeight);
        camera.perspective({
          aspect: canvas!.clientWidth / canvas!.clientHeight,
        });
      }
      resize();
      window.addEventListener("resize", resize);

      const geometry = new OGL.Sphere(gl, {
        radius: 1,
        widthSegments: 64,
        heightSegments: 64,
      });

      const program = new OGL.Program(gl, {
        vertex: `
          attribute vec3 position;
          attribute vec3 normal;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPosition;

          // Simplex noise helper
          vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
          vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
          vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
          vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

          float snoise(vec3 v) {
            const vec2 C = vec2(1.0/6.0, 1.0/3.0);
            const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
            vec3 i  = floor(v + dot(v, C.yyy));
            vec3 x0 = v - i + dot(i, C.xxx);
            vec3 g = step(x0.yzx, x0.xyz);
            vec3 l = 1.0 - g;
            vec3 i1 = min(g.xyz, l.zxy);
            vec3 i2 = max(g.xyz, l.zxy);
            vec3 x1 = x0 - i1 + C.xxx;
            vec3 x2 = x0 - i2 + C.yyy;
            vec3 x3 = x0 - D.yyy;
            i = mod289(i);
            vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
              + i.y + vec4(0.0, i1.y, i2.y, 1.0))
              + i.x + vec4(0.0, i1.x, i2.x, 1.0));
            float n_ = 0.142857142857;
            vec3 ns = n_ * D.wyz - D.xzx;
            vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
            vec4 x_ = floor(j * ns.z);
            vec4 y_ = floor(j - 7.0 * x_);
            vec4 x = x_ * ns.x + ns.yyyy;
            vec4 y = y_ * ns.x + ns.yyyy;
            vec4 h = 1.0 - abs(x) - abs(y);
            vec4 b0 = vec4(x.xy, y.xy);
            vec4 b1 = vec4(x.zw, y.zw);
            vec4 s0 = floor(b0)*2.0 + 1.0;
            vec4 s1 = floor(b1)*2.0 + 1.0;
            vec4 sh = -step(h, vec4(0.0));
            vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
            vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
            vec3 p0 = vec3(a0.xy, h.x);
            vec3 p1 = vec3(a0.zw, h.y);
            vec3 p2 = vec3(a1.xy, h.z);
            vec3 p3 = vec3(a1.zw, h.w);
            vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
            p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
            vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
            m = m * m;
            return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
          }

          void main() {
            vNormal = normal;
            vPosition = position;
            float noise = snoise(position * 1.5 + uTime * 0.3) * 0.25;
            vec3 displaced = position + normal * noise;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
          }
        `,
        fragment: `
          precision highp float;
          varying vec3 vNormal;
          varying vec3 vPosition;
          uniform float uTime;

          void main() {
            float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
            vec3 blue = vec3(0.0, 0.482, 1.0);
            vec3 purple = vec3(0.541, 0.169, 0.886);
            vec3 color = mix(blue, purple, vPosition.y * 0.5 + 0.5 + sin(uTime * 0.5) * 0.2);
            float alpha = fresnel * 0.6 + 0.1;
            gl_FragColor = vec4(color, alpha);
          }
        `,
        uniforms: {
          uTime: { value: 0 },
        },
        transparent: true,
        depthWrite: false,
      });

      const mesh = new OGL.Mesh(gl, { geometry, program });
      mesh.setParent(scene);

      // Mouse parallax
      const mouse = { x: 0, y: 0 };
      function onMouseMove(e: MouseEvent) {
        mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }
      window.addEventListener("mousemove", onMouseMove);

      // IntersectionObserver to pause when off-screen
      let visible = true;
      const observer = new IntersectionObserver(
        ([entry]) => { visible = entry.isIntersecting; },
        { threshold: 0 }
      );
      observer.observe(canvas);

      function animate(t: number) {
        if (destroyed) return;
        animationId = requestAnimationFrame(animate);
        if (!visible) return;

        program.uniforms.uTime.value = t * 0.001;
        mesh.rotation.x += 0.002;
        mesh.rotation.y += 0.003;

        // Subtle mouse tilt
        mesh.rotation.x += (mouse.y * 0.3 - mesh.rotation.x) * 0.02;
        mesh.rotation.y += (mouse.x * 0.3 - mesh.rotation.y) * 0.02;

        renderer.render({ scene, camera });
      }
      animationId = requestAnimationFrame(animate);

      return () => {
        window.removeEventListener("resize", resize);
        window.removeEventListener("mousemove", onMouseMove);
        observer.disconnect();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    }

    let cleanup: (() => void) | undefined;
    init().then((c) => { cleanup = c; });

    return () => {
      destroyed = true;
      cancelAnimationFrame(animationId);
      cleanup?.();
    };
  }, []);

  // CSS fallback for mobile
  if (typeof window !== "undefined" && (isMobile() || isLowEnd())) {
    return (
      <div className="absolute inset-0 z-[5] opacity-20 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 blur-[80px]" />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[5] w-full h-full opacity-20 pointer-events-none"
    />
  );
}
