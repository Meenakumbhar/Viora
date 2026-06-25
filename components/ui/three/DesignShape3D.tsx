'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function DesignShape3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // 1. Scene setup
    const scene = new THREE.Scene();

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 0, 5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x2d5fa8, 0.8);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0xc6a85c, 1, 10);
    pointLight.position.set(0, 2, 2);
    scene.add(pointLight);

    // 5. Procedural 3D Shape
    // TorusKnot represents abstract structure and graphic flow
    const knotGeo = new THREE.TorusKnotGeometry(0.75, 0.22, 100, 16);

    // Highly reflective blue metallic material
    const knotMat = new THREE.MeshStandardMaterial({
      color: 0x2d5fa8,
      metalness: 0.9,
      roughness: 0.15,
    });

    const knotMesh = new THREE.Mesh(knotGeo, knotMat);
    scene.add(knotMesh);

    // 6. Interaction variables
    let scrollY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let isHovered = false;

    // 7. Event listeners
    const handleScroll = () => {
      scrollY = window.scrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouseX = (x / container.clientWidth) * 2 - 1;
      mouseY = -(y / container.clientHeight) * 2 + 1;
    };

    const handleMouseEnter = () => {
      isHovered = true;
    };

    const handleMouseLeave = () => {
      isHovered = false;
      mouseX = 0;
      mouseY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
      }
    });
    resizeObserver.observe(container);

    let animationFrameId = 0;
    const timer = new THREE.Timer();
    const startTime = performance.now() / 1000;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      timer.update();

      const elapsedTime = performance.now() / 1000 - startTime;

      // Continuous baseline rotating morph
      const baseRotationX = elapsedTime * 0.2;
      const baseRotationY = elapsedTime * 0.3;

      const scrollRotationX = scrollY * 0.0015;
      const scrollRotationY = scrollY * 0.0025;

      targetRotationX = baseRotationX + scrollRotationX;
      targetRotationY = baseRotationY + scrollRotationY;

      // Elastic dynamics
      if (isHovered) {
        knotMesh.rotation.y += (targetRotationY + mouseX * 1.5 - knotMesh.rotation.y) * 0.08;
        knotMesh.rotation.x += (targetRotationX + mouseY * 1.5 - knotMesh.rotation.x) * 0.08;
        
        // Pulse scale on hover
        const pulse = 1.0 + Math.sin(elapsedTime * 8) * 0.03;
        knotMesh.scale.setScalar(THREE.MathUtils.lerp(knotMesh.scale.x, pulse * 1.15, 0.1));
      } else {
        knotMesh.rotation.y += (targetRotationY - knotMesh.rotation.y) * 0.08;
        knotMesh.rotation.x += (targetRotationX - knotMesh.rotation.x) * 0.08;
        knotMesh.scale.setScalar(THREE.MathUtils.lerp(knotMesh.scale.x, 1.0, 0.1));
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('scroll', handleScroll);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
      renderer.dispose();

      knotGeo.dispose();
      knotMat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[220px] relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default DesignShape3D;
