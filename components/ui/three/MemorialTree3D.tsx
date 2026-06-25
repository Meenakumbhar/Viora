'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function MemorialTree3D() {
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
    camera.position.set(0, 1.2, 5.5);
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
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight1.position.set(3, 8, 4);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x8b82c4, 0.6);
    dirLight2.position.set(-3, 3, -3);
    scene.add(dirLight2);

    // 5. Procedural 3D Tree Group
    const treeGroup = new THREE.Group();

    // Materials
    // Matte dark charcoal trunk
    const woodMat = new THREE.MeshStandardMaterial({
      color: 0x2c264a,
      roughness: 0.8,
      metalness: 0.1,
    });

    // Violet-blue leaves
    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x8b82c4,
      roughness: 0.4,
      metalness: 0.2,
    });

    // Gold leaf highlight
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xc6a85c,
      roughness: 0.2,
      metalness: 0.8,
    });

    // Main Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.08, 0.12, 1.5, 16);
    const trunkMesh = new THREE.Mesh(trunkGeo, woodMat);
    trunkMesh.position.y = 0.75;
    treeGroup.add(trunkMesh);

    // Group to hold branches and leaves
    const foliageGroup = new THREE.Group();
    foliageGroup.position.set(0, 1.4, 0);

    // Branch parameters
    const branchGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.7, 16);
    branchGeo.translate(0, 0.35, 0); // Move origin to base

    const leafGeo = new THREE.SphereGeometry(0.25, 16, 16);

    // Store references to scale on hover
    const leaves: THREE.Mesh[] = [];

    const addBranch = (rotX: number, rotZ: number, leafColor: THREE.MeshStandardMaterial) => {
      const branchMesh = new THREE.Mesh(branchGeo, woodMat);
      branchMesh.rotation.set(rotX, 0, rotZ);
      
      const leafMesh = new THREE.Mesh(leafGeo, leafColor);
      leafMesh.position.set(0, 0.7, 0);
      branchMesh.add(leafMesh);
      leaves.push(leafMesh);

      foliageGroup.add(branchMesh);
    };

    // Construct minimalist tree structure
    addBranch(0.4, 0.4, leafMat);
    addBranch(-0.4, -0.4, leafMat);
    addBranch(0.5, -0.3, goldMat); // One unique gold leaf
    addBranch(-0.3, 0.5, leafMat);
    addBranch(0, 0.6, leafMat);
    addBranch(0, -0.6, leafMat);

    // Top center leaf
    const centerLeaf = new THREE.Mesh(leafGeo, leafMat);
    centerLeaf.position.set(0, 0.1, 0);
    foliageGroup.add(centerLeaf);
    leaves.push(centerLeaf);

    treeGroup.add(foliageGroup);
    scene.add(treeGroup);

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

      // Subtle breathing rotation
      foliageGroup.rotation.y = Math.sin(elapsedTime * 0.5) * 0.15;

      const scrollRotation = scrollY * 0.002;
      targetRotationY = scrollRotation;

      // Elastic dynamics for movement and scale
      if (isHovered) {
        treeGroup.rotation.y += (targetRotationY + mouseX * 0.5 - treeGroup.rotation.y) * 0.08;
        treeGroup.rotation.x += (mouseY * 0.3 - treeGroup.rotation.x) * 0.08;

        // Leaves grow slightly on hover
        leaves.forEach((l) => {
          l.scale.setScalar(THREE.MathUtils.lerp(l.scale.x, 1.25, 0.1));
        });
      } else {
        treeGroup.rotation.y += (targetRotationY - treeGroup.rotation.y) * 0.08;
        treeGroup.rotation.x += (0 - treeGroup.rotation.x) * 0.08;

        leaves.forEach((l) => {
          l.scale.setScalar(THREE.MathUtils.lerp(l.scale.x, 1.0, 0.1));
        });
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

      trunkGeo.dispose();
      branchGeo.dispose();
      woodMat.dispose();
      leafMat.dispose();
      goldMat.dispose();
      leafGeo.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[220px] relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />
    </div>
  );
}

export default MemorialTree3D;
