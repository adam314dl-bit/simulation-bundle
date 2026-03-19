import * as React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  forceSimulation,
  forceManyBody,
  forceLink,
  forceCenter,
  forceCollide,
} from 'd3-force';
import type { Simulation } from 'd3-force';
import type { ForceGraphProps, GraphNode, GraphLink } from './types';
import { colorRamps } from './color-ramps';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNodeRadius(
  node: GraphNode,
  nodeRadius: number | ((node: GraphNode) => number),
): number {
  return typeof nodeRadius === 'function' ? nodeRadius(node) : nodeRadius;
}

function getNodeColor(
  node: GraphNode,
  nodeColor: ((node: GraphNode) => string) | undefined,
): string {
  return nodeColor
    ? nodeColor(node)
    : colorRamps.category10((node.group ?? 0) / 10);
}

function getLinkWidth(
  link: GraphLink,
  linkWidth: number | ((link: GraphLink) => number) | undefined,
): number {
  if (typeof linkWidth === 'function') return linkWidth(link);
  return linkWidth ?? 1;
}

function getLinkColor(
  link: GraphLink,
  linkColor: string | ((link: GraphLink) => string) | undefined,
): string {
  if (typeof linkColor === 'function') return linkColor(link);
  return linkColor ?? 'var(--sim-border, #27272a)';
}

function nodeId(n: string | GraphNode): string {
  return typeof n === 'string' ? n : n.id;
}

function buildAdjacency(links: GraphLink[]): Set<string> {
  const set = new Set<string>();
  for (const l of links) {
    const s = nodeId(l.source);
    const t = nodeId(l.target);
    set.add(`${s}-${t}`);
    set.add(`${t}-${s}`);
  }
  return set;
}

// ---------------------------------------------------------------------------
// ForceGraph Component
// ---------------------------------------------------------------------------

export function ForceGraph(props: ForceGraphProps): React.JSX.Element {
  const {
    nodes,
    links,
    width = 600,
    height = 400,
    nodeRadius = 8,
    nodeColor,
    nodeLabel,
    labelSize = 10,
    linkWidth,
    linkColor,
    linkOpacity = 0.4,
    linkCurvature = 0,
    charge = -30,
    linkDistance = 30,
    centerStrength = 1,
    collisionRadius = 0,
    alphaDecay = 0.0228,
    alphaMin = 0.001,
    canvasThreshold = 500,
    onStabilize,
    onNodeHover,
    onNodeClick,
    tooltipContent,
    className,
  } = props;

  const useCanvas = nodes.length > canvasThreshold;

  // --------------- State & Refs ---------------
  const [tick, setTick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null);
  const adjacencyRef = useRef<Set<string>>(new Set());
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragNodeRef = useRef<GraphNode | null>(null);
  const dragMovedRef = useRef(false);
  const onStabilizeRef = useRef(onStabilize);
  onStabilizeRef.current = onStabilize;

  // --------------- Simulation setup ---------------
  useEffect(() => {
    // Deep-clone input data to avoid mutating caller's objects
    const clonedNodes = structuredClone(nodes);
    const clonedLinks = structuredClone(links);
    nodesRef.current = clonedNodes;
    linksRef.current = clonedLinks;
    adjacencyRef.current = buildAdjacency(links);

    const sim = forceSimulation<GraphNode>(clonedNodes)
      .force('charge', forceManyBody<GraphNode>().strength(charge))
      .force(
        'link',
        forceLink<GraphNode, GraphLink>(clonedLinks)
          .id((d) => d.id)
          .distance(linkDistance),
      )
      .force(
        'center',
        forceCenter(width / 2, height / 2).strength(centerStrength),
      )
      .force(
        'collide',
        collisionRadius > 0 ? forceCollide<GraphNode>(collisionRadius) : null,
      )
      .alphaDecay(alphaDecay)
      .alphaMin(alphaMin);

    // Run one synchronous tick so nodes get initial positions before first render
    sim.tick();

    let frameId = 0;
    sim.on('tick', () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => setTick((t) => t + 1));
    });
    sim.on('end', () => onStabilizeRef.current?.());

    simulationRef.current = sim;

    // Trigger initial render with positions from the synchronous tick
    setTick((t) => t + 1);

    // If simulation already converged (alpha < alphaMin), fire onStabilize immediately
    if (sim.alpha() < alphaMin) {
      onStabilizeRef.current?.();
    }

    return () => {
      sim.stop();
      cancelAnimationFrame(frameId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, links]);

  // --------------- Force parameter hot-update ---------------
  useEffect(() => {
    const sim = simulationRef.current;
    if (!sim) return;
    sim.force('charge', forceManyBody<GraphNode>().strength(charge));
    const existingLink = sim.force('link') as ReturnType<
      typeof forceLink<GraphNode, GraphLink>
    > | null;
    if (existingLink) existingLink.distance(linkDistance);
    sim.force(
      'center',
      forceCenter(width / 2, height / 2).strength(centerStrength),
    );
    sim.force(
      'collide',
      collisionRadius > 0 ? forceCollide<GraphNode>(collisionRadius) : null,
    );
    sim.alpha(0.3).restart();
  }, [charge, linkDistance, centerStrength, collisionRadius, width, height]);

  // --------------- Adjacency check ---------------
  const isConnected = useCallback(
    (a: GraphNode, b: GraphNode): boolean =>
      adjacencyRef.current.has(`${a.id}-${b.id}`),
    [],
  );

  // --------------- Drag handlers ---------------
  const handlePointerDown = useCallback(
    (node: GraphNode, e: React.PointerEvent) => {
      e.preventDefault();
      (e.target as Element).setPointerCapture(e.pointerId);
      dragNodeRef.current = node;
      dragMovedRef.current = false;
      node.fx = node.x ?? null;
      node.fy = node.y ?? null;
      simulationRef.current?.alphaTarget(0.3).restart();
    },
    [],
  );

  const handlePointerMoveSvg = useCallback(
    (e: React.PointerEvent) => {
      if (!dragNodeRef.current) return;
      dragMovedRef.current = true;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      dragNodeRef.current.fx = e.clientX - rect.left;
      dragNodeRef.current.fy = e.clientY - rect.top;
    },
    [],
  );

  const handlePointerUpSvg = useCallback(
    (e: React.PointerEvent) => {
      const node = dragNodeRef.current;
      if (!node) return;
      simulationRef.current?.alphaTarget(0);

      // If shift is held, keep pinned (fx/fy stay). Otherwise unpin.
      if (!e.shiftKey) {
        node.fx = null;
        node.fy = null;
      }
      dragNodeRef.current = null;
    },
    [],
  );

  // --------------- Hover handlers ---------------
  const handleNodeEnter = useCallback(
    (node: GraphNode) => {
      setHoveredNode(node);
      onNodeHover?.(node);
    },
    [onNodeHover],
  );

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
    onNodeHover?.(null);
  }, [onNodeHover]);

  // --------------- Canvas2D rendering ---------------
  useEffect(() => {
    if (!useCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Resolve CSS custom property for border
    const computedStyle = getComputedStyle(canvas);
    const borderColor =
      computedStyle.getPropertyValue('--sim-border').trim() || '#27272a';
    const textColor =
      computedStyle.getPropertyValue('--sim-text-muted').trim() || '#a1a1aa';

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const nodeArr = nodesRef.current;
      const linkArr = linksRef.current;
      const hNode = hoveredNode;

      // Draw links
      for (const link of linkArr) {
        const src = link.source as GraphNode;
        const tgt = link.target as GraphNode;
        if (src.x == null || src.y == null || tgt.x == null || tgt.y == null) continue;

        const connected =
          hNode != null &&
          (nodeId(link.source) === hNode.id || nodeId(link.target) === hNode.id);
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = getLinkColor(link, linkColor);
        ctx.lineWidth =
          connected && hNode
            ? getLinkWidth(link, linkWidth) * 1.5
            : getLinkWidth(link, linkWidth);
        ctx.globalAlpha =
          hNode && !connected ? 0.2 * linkOpacity : linkOpacity;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodeArr) {
        if (node.x == null || node.y == null) continue;
        const r = getNodeRadius(node, nodeRadius);
        const isHovered = hNode != null && node.id === hNode.id;
        const connected =
          hNode != null && (node.id === hNode.id || isConnected(node, hNode));

        ctx.globalAlpha = hNode && !connected ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(
          node.x,
          node.y,
          isHovered ? r * 1.2 : r,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = getNodeColor(node, nodeColor);
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // Hover-only label in Canvas2D
      if (hNode && hNode.x != null && hNode.y != null) {
        ctx.globalAlpha = 1;
        const r = getNodeRadius(hNode, nodeRadius);
        const label = nodeLabel ? nodeLabel(hNode) : hNode.label;
        if (label) {
          ctx.font = `${labelSize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillStyle = textColor;
          ctx.fillText(label, hNode.x, hNode.y + r + labelSize + 2);
        }
      }

      ctx.globalAlpha = 1;
    };

    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useCanvas, tick, hoveredNode, width, height]);

  // Canvas pointer events for hit-testing
  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragNodeRef.current) {
        dragMovedRef.current = true;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        dragNodeRef.current.fx = e.clientX - rect.left;
        dragNodeRef.current.fy = e.clientY - rect.top;
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxR = typeof nodeRadius === 'function' ? 20 : nodeRadius;
      const found = simulationRef.current?.find(x, y, maxR + 4) ?? null;
      if (found !== hoveredNode) {
        setHoveredNode(found);
        onNodeHover?.(found);
      }
    },
    [hoveredNode, nodeRadius, onNodeHover],
  );

  const handleCanvasPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const maxR = typeof nodeRadius === 'function' ? 20 : nodeRadius;
      const found = simulationRef.current?.find(x, y, maxR + 4);
      if (found) {
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);
        dragNodeRef.current = found;
        dragMovedRef.current = false;
        found.fx = found.x ?? null;
        found.fy = found.y ?? null;
        simulationRef.current?.alphaTarget(0.3).restart();
      }
    },
    [nodeRadius],
  );

  const handleCanvasPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const node = dragNodeRef.current;
      if (!node) {
        // Click without drag -- check if clicking a node
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const maxR = typeof nodeRadius === 'function' ? 20 : nodeRadius;
        const found = simulationRef.current?.find(x, y, maxR + 4);
        if (found) onNodeClick?.(found);
        return;
      }
      simulationRef.current?.alphaTarget(0);
      if (!e.shiftKey) {
        node.fx = null;
        node.fy = null;
      }
      if (!dragMovedRef.current && onNodeClick) {
        onNodeClick(node);
      }
      dragNodeRef.current = null;
    },
    [nodeRadius, onNodeClick],
  );

  const handleCanvasPointerLeave = useCallback(() => {
    if (hoveredNode) {
      setHoveredNode(null);
      onNodeHover?.(null);
    }
  }, [hoveredNode, onNodeHover]);

  // --------------- SVG Mode ---------------
  if (!useCanvas) {
    const nodeArr = nodesRef.current;
    const linkArr = linksRef.current;

    return (
      <div style={{ position: 'relative', display: 'inline-block' }} className={className}>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          onPointerMove={handlePointerMoveSvg}
          onPointerUp={handlePointerUpSvg}
          style={{ cursor: dragNodeRef.current ? 'grabbing' : 'default' }}
        >
          {/* Links */}
          {linkArr.map((link) => {
            const src = link.source as GraphNode;
            const tgt = link.target as GraphNode;
            if (src.x == null || src.y == null || tgt.x == null || tgt.y == null)
              return null;

            const connected =
              hoveredNode != null &&
              (nodeId(link.source) === hoveredNode.id ||
                nodeId(link.target) === hoveredNode.id);
            const opacity =
              hoveredNode && !connected ? 0.2 * linkOpacity : linkOpacity;
            const w = connected && hoveredNode
              ? getLinkWidth(link, linkWidth) * 1.5
              : getLinkWidth(link, linkWidth);
            const color = getLinkColor(link, linkColor);
            const key = `${nodeId(link.source)}-${nodeId(link.target)}`;

            if (linkCurvature > 0) {
              const mx = (src.x + tgt.x) / 2;
              const my = (src.y + tgt.y) / 2;
              const dx = tgt.x - src.x;
              const dy = tgt.y - src.y;
              const len = Math.sqrt(dx * dx + dy * dy);
              const offset = linkCurvature * len;
              // Perpendicular offset
              const cx = mx + (-dy / (len || 1)) * offset;
              const cy = my + (dx / (len || 1)) * offset;
              return (
                <path
                  key={key}
                  d={`M ${src.x},${src.y} Q ${cx},${cy} ${tgt.x},${tgt.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={w}
                  opacity={opacity}
                />
              );
            }

            return (
              <line
                key={key}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={color}
                strokeWidth={w}
                opacity={opacity}
              />
            );
          })}

          {/* Nodes */}
          {nodeArr.map((node) => {
            if (node.x == null || node.y == null) return null;
            const r = getNodeRadius(node, nodeRadius);
            const isHovered = hoveredNode != null && node.id === hoveredNode.id;
            const connected =
              hoveredNode != null &&
              (node.id === hoveredNode.id || isConnected(node, hoveredNode));
            const opacity = hoveredNode && !connected ? 0.2 : 1;

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={r}
                  fill={getNodeColor(node, nodeColor)}
                  stroke="var(--sim-border, #27272a)"
                  strokeWidth={1.5}
                  opacity={opacity}
                  transform={
                    isHovered
                      ? `translate(${node.x},${node.y}) scale(1.2) translate(${-node.x},${-node.y})`
                      : undefined
                  }
                  style={{ cursor: 'grab' }}
                  data-node-id={node.id}
                  onPointerDown={(e) => handlePointerDown(node, e)}
                  onPointerEnter={() => handleNodeEnter(node)}
                  onPointerLeave={handleNodeLeave}
                  onClick={() => onNodeClick?.(node)}
                />
                {nodeLabel && (
                  <text
                    x={node.x}
                    y={node.y + r + labelSize + 2}
                    textAnchor="middle"
                    fontSize={labelSize}
                    fill="var(--sim-text-muted, #a1a1aa)"
                    opacity={opacity}
                    style={{ pointerEvents: 'none' }}
                  >
                    {nodeLabel(node)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltipContent && hoveredNode && hoveredNode.x != null && hoveredNode.y != null && (
          <div
            style={{
              position: 'absolute',
              left: Math.min(
                hoveredNode.x + getNodeRadius(hoveredNode, nodeRadius) + 8,
                width - 120,
              ),
              top: Math.max(0, hoveredNode.y - 10),
              pointerEvents: 'none',
              background: 'var(--sim-surface, #18181b)',
              border: '1px solid var(--sim-border, #27272a)',
              borderRadius: 'var(--sim-radius, 6px)',
              padding: '8px 12px',
              color: 'var(--sim-text, #fafafa)',
              zIndex: 10,
            }}
          >
            {tooltipContent(hoveredNode)}
          </div>
        )}
      </div>
    );
  }

  // --------------- Canvas2D Mode ---------------
  return (
    <div style={{ position: 'relative', display: 'inline-block' }} className={className}>
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          touchAction: 'none',
          cursor: dragNodeRef.current ? 'grabbing' : 'default',
        }}
        onPointerMove={handleCanvasPointerMove}
        onPointerDown={handleCanvasPointerDown}
        onPointerUp={handleCanvasPointerUp}
        onPointerLeave={handleCanvasPointerLeave}
      />

      {/* Tooltip for Canvas mode */}
      {tooltipContent && hoveredNode && hoveredNode.x != null && hoveredNode.y != null && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(
              hoveredNode.x + getNodeRadius(hoveredNode, nodeRadius) + 8,
              width - 120,
            ),
            top: Math.max(0, hoveredNode.y - 10),
            pointerEvents: 'none',
            background: 'var(--sim-surface, #18181b)',
            border: '1px solid var(--sim-border, #27272a)',
            borderRadius: 'var(--sim-radius, 6px)',
            padding: '8px 12px',
            color: 'var(--sim-text, #fafafa)',
            zIndex: 10,
          }}
        >
          {tooltipContent(hoveredNode)}
        </div>
      )}
    </div>
  );
}
