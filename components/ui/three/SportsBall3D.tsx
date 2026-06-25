'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function SportsBall3D() {
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3d7a3a, 0.6);
    dirLight2.position.set(-5, -5, 3);
    scene.add(dirLight2);

    // 5. Procedural 3D Ball Group
    const ballGroup = new THREE.Group();

    // Materials
    // Matte athletic green leather texture
    const leatherMat = new THREE.MeshStandardMaterial({
      color: 0x3d7a3a,
      roughness: 0.7,
      metalness: 0.1,
    });

    // Dark charcoal seams
    const seamMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a,
      roughness: 0.9,
      metalness: 0.05,
    });

    // Sphere core
    const sphereGeo = new THREE.SphereGeometry(1.25, 32, 32);
    const sphereMesh = new THREE.Mesh(sphereGeo, leatherMat);
    ballGroup.add(sphereMesh);

    // Seam 1 (Vertical loop)
    const seamGeo1 = new THREE.TorusGeometry(1.255, 0.02, 16, 100);
    const seamMesh1 = new THREE.Mesh(seamGeo1, seamMat);
    seamMesh1.rotation.y = Math.PI / 2;
    ballGroup.add(seamMesh1);

    // Seam 2 (Horizontal loop)
    const seamMesh2 = new THREE.Mesh(seamGeo1, seamMat);
    seamMesh2.rotation.x = Math.PI / 2;
    ballGroup.add(seamMesh2);

    // Seam 3 (Contour wave)
    const seamMesh3 = new THREE.Mesh(seamGeo1, seamMat);
    seamMesh3.rotation.z = Math.PI / 4;
    ballGroup.add(seamMesh3);

    scene.add(ballGroup);

    // 6. Interaction variables
    let scrollY = 0;
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

      // Slow baseline rotation
      ballGroup.rotation.y = elapsedTime * 0.15;
      
      const scrollRotation = scrollY * 0.003;
      targetRotationY = scrollRotation;

      // Elastic physics
      if (isHovered) {
        // Bouncing animation on hover
        ballGroup.position.y = Math.sin(elapsedTime * 4) * 0.15;
        
        ballGroup.rotation.y += (targetRotationY + mouseX * 1.5 - ballGroup.rotation.y) * 0.07;
        ballGroup.rotation.x += (mouseY * 1.5 - ballGroup.rotation.x) * 0.07;
      } else {
        ballGroup.position.y += (0 - ballGroup.position.y) * 0.07;
        ballGroup.rotation.y += (targetRotationY - ballGroup.rotation.y) * 0.07;
        ballGroup.rotation.x += (0 - ballGroup.rotation.x) * 0.07;
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

      sphereGeo.dispose();
      seamGeo1.dispose();
      leatherMat.dispose();
      seamMat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[220px] relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default SportsBall3D;
