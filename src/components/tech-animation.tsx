import { useEffect, useRef } from "react";

export function TechAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match container
    function resizeCanvas() {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    }

    // Handle visibility change to pause animation when tab is not visible
    let visibilityChangeHandler: () => void;
    let isHidden = false;

    function handleVisibilityChange() {
      if (document.hidden) {
        isHidden = true;
        cancelAnimationFrame(animationFrameRef.current);
      } else {
        isHidden = false;
        requestAnimationFrame(animate);
      }
    }

    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    resizeCanvas();

    // Animation variables
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) * 0.3;
    const nodeCount = 8;
    const nodes: {
      x: number;
      y: number;
      angle: number;
      speed: number;
      distance: number;
    }[] = [];

    // Initialize nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: centerX,
        y: centerY,
        angle: (i / nodeCount) * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03, // Different speeds for each node
        distance: radius * (0.8 + Math.random() * 0.2), // Varying distances
      });
    }

    // Connections between nodes (some random connections)
    const connections: { i: number; j: number }[] = [];
    for (let i = 0; i < nodeCount; i++) {
      // Connect each node to 1-2 other nodes
      const connectionsCount = 1 + Math.floor(Math.random() * 2);
      for (let c = 0; c < connectionsCount; c++) {
        let j: number;
        do {
          j = Math.floor(Math.random() * nodeCount);
        } while (j === i); // Don't connect to self
        connections.push({ i, j });
      }
    }

    let lastTime = 0;

    function animate(time: number) {
      if (!canvas || !ctx || isHidden) {
        if (!isHidden) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update node positions
      nodes.forEach((node) => {
        node.angle += node.speed * (deltaTime / 16); // Adjust speed based on time delta
        node.x = centerX + Math.cos(node.angle) * node.distance;
        node.y = centerY + Math.sin(node.angle) * node.distance;
      });

      // Draw connections
      ctx.strokeStyle = "rgba(40, 100, 232, 0.15)"; // Soft blue with low opacity
      ctx.lineWidth = 1;
      connections.forEach(({ i, j }) => {
        const nodeA = nodes[i];
        const nodeB = nodes[j];
        ctx.beginPath();
        ctx.moveTo(nodeA.x, nodeA.y);
        ctx.lineTo(nodeB.x, nodeB.y);
        ctx.stroke();
      });

      // Draw central circle
      ctx.fillStyle = "rgba(40, 100, 232, 0.1)";
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.05, 0, Math.PI * 2);
      ctx.fill();

      // Draw nodes
      nodes.forEach((node) => {
        // Outer glow
        ctx.shadowColor = "rgba(40, 100, 232, 0.3)";
        ctx.shadowBlur = 8;

        // Node fill
        ctx.fillStyle = "rgba(40, 100, 232, 0.8)";
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Node border
        ctx.strokeStyle = "rgba(40, 100, 232, 0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.stroke();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    }

    // Start animation
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div
      className="relative w-full h-full bg-[oklch(0.24_0.055_265)] overflow-hidden"
      aria-label="Technology network animation"
      role="img"
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}