'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function WeddingCake3D() {
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
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 1.0, 0);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0xc6a85c, 0.5);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // 5. Procedural 3D Cake Group
    const cakeGroup = new THREE.Group();

    // Materials
    const frostingMat = new THREE.MeshStandardMaterial({
      color: 0xfdfdfa,
      roughness: 0.5,
      metalness: 0.05,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc6a85c,
      roughness: 0.15,
      metalness: 0.85,
    });

    // Base Tier (Bottom)
    const baseGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.9, 32);
    const baseMesh = new THREE.Mesh(baseGeo, frostingMat);
    baseMesh.position.y = 0.45;
    cakeGroup.add(baseMesh);

    // Base Gold Trim
    const baseTrimGeo = new THREE.CylinderGeometry(1.54, 1.54, 0.06, 32);
    const baseTrimMesh = new THREE.Mesh(baseTrimGeo, goldMat);
    baseTrimMesh.position.y = 0.03;
    cakeGroup.add(baseTrimMesh);

    // Middle Tier
    const midGeo = new THREE.CylinderGeometry(1.05, 1.05, 0.75, 32);
    const midMesh = new THREE.Mesh(midGeo, frostingMat);
    midMesh.position.y = 1.275;
    cakeGroup.add(midMesh);

    // Middle Gold Trim
    const midTrimGeo = new THREE.CylinderGeometry(1.09, 1.09, 0.06, 32);
    const midTrimMesh = new THREE.Mesh(midTrimGeo, goldMat);
    midTrimMesh.position.y = 0.93;
    cakeGroup.add(midTrimMesh);

    // Top Tier
    const topGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.65, 32);
    const topMesh = new THREE.Mesh(topGeo, frostingMat);
    topMesh.position.y = 1.975;
    cakeGroup.add(topMesh);

    // Top Gold Trim
    const topTrimGeo = new THREE.CylinderGeometry(0.69, 0.69, 0.06, 32);
    const topTrimMesh = new THREE.Mesh(topTrimGeo, goldMat);
    topTrimMesh.position.y = 1.67;
    cakeGroup.add(topTrimMesh);

    // Star Topper
    const topperGroup = new THREE.Group();
    topperGroup.position.set(0, 2.4, 0);

    const starGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
    const starHalf1 = new THREE.Mesh(starGeo, goldMat);
    const starHalf2 = starHalf1.clone();
    starHalf2.rotation.z = Math.PI;
    topperGroup.add(starHalf1);
    topperGroup.add(starHalf2);

    cakeGroup.add(topperGroup);
    scene.add(cakeGroup);

    cakeGroup.rotation.y = 0.5;

    // 6. Interaction and Animation Loop variables
    let scrollY = 0;
    let targetRotationY = 0.5;
    let mouseX = 0;
    let mouseY = 0;
    let isHovered = false;

    // 7. Handlers
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

      // Spin cake topper star
      topperGroup.rotation.y = elapsedTime * 2.5;

      const scrollRotation = scrollY * 0.0025;
      targetRotationY = 0.5 + scrollRotation;

      if (isHovered) {
        cakeGroup.rotation.y += (targetRotationY + mouseX * 0.6 - cakeGroup.rotation.y) * 0.08;
        cakeGroup.rotation.x += (mouseY * 0.4 - cakeGroup.rotation.x) * 0.08;
      } else {
        cakeGroup.rotation.y += (targetRotationY - cakeGroup.rotation.y) * 0.08;
        cakeGroup.rotation.x += (0.15 - cakeGroup.rotation.x) * 0.08; // Slight default downward angle
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

      baseGeo.dispose();
      baseTrimGeo.dispose();
      midGeo.dispose();
      midTrimGeo.dispose();
      topGeo.dispose();
      topTrimGeo.dispose();
      starGeo.dispose();
      frostingMat.dispose();
      goldMat.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[220px] relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default WeddingCake3D;
