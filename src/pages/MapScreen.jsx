import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { Plus } from "lucide-react";
import { ATTRS } from "../constants";
import { activityStats, nodeRadius } from "../utils/helpers";

const BUTTON_RADIUS = 44;
const BOTTOM_MARGIN = 24;
const TOP_MARGIN = 24;

const FRICTION = 0.96;
const MAGNETIC_THRESHOLD = 3;
const MAGNETIC_STRENGTH = 0.06;
const MIN_VELOCITY = 0.08;
const SNAP_THRESHOLD = 1.5;

function angleFromHub(clientX, clientY, containerRect, hubX, hubY) {
  const x = clientX - containerRect.left - hubX;
  const y = clientY - containerRect.top - hubY;
  return (Math.atan2(y, x) * 180) / Math.PI;
}

function snapRotation(rotation) {
  return Math.round(rotation / 60) * 60;
}

function getAngleDiffFromTop(attrAngle, rotation) {
  const effective = ((attrAngle + rotation) % 360 + 360) % 360;
  const target = 270;
  let diff = Math.abs(effective - target);
  if (diff > 180) diff = 360 - diff;
  return diff;
}

function getFocusedAttribute(rotation) {
  let best = ATTRS[0];
  let bestDiff = Infinity;
  for (const attr of ATTRS) {
    const diff = getAngleDiffFromTop(attr.angle, rotation);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = attr;
    }
  }
  return best;
}

function getShortestAngleDiff(a, b) {
  let diff = ((a - b) % 360 + 360) % 360;
  if (diff > 180) diff -= 360;
  return diff;
}

export default function MapScreen({ state, onOpenNew, onOpenActivity }) {
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [velocity, setVelocity] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== "undefined" ? window.innerHeight : 800
  );
  const [containerRect, setContainerRect] = useState(null);

  const lastPointerAngleRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const animationRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!animating) return;

    const step = (timestamp) => {
      if (lastTimestampRef.current === 0) {
        lastTimestampRef.current = timestamp;
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      const dt = (timestamp - lastTimestampRef.current) / 16.67;
      lastTimestampRef.current = timestamp;

      let newVelocity = velocity * Math.pow(FRICTION, dt);

      const targetSnap = snapRotation(rotation);
      const distToSnap = getShortestAngleDiff(rotation, targetSnap);
      const absDist = Math.abs(distToSnap);

      if (Math.abs(newVelocity) < MAGNETIC_THRESHOLD && absDist > 0.5) {
        const pull = Math.sign(distToSnap) * MAGNETIC_STRENGTH * Math.min(absDist, 30);
        // Only apply pull if it reduces distance (don't fight existing velocity direction)
        const pullDirection = Math.sign(pull);
        const velocityDirection = Math.sign(newVelocity);
        if (velocityDirection === 0 || velocityDirection === pullDirection || Math.abs(newVelocity) < 0.5) {
          newVelocity -= pull * dt;
        }
      }

      const newRotation = rotation + newVelocity * dt;

      // Check if we crossed the snap target
      const newDistToSnap = getShortestAngleDiff(newRotation, targetSnap);
      const crossedTarget = Math.sign(distToSnap) !== Math.sign(newDistToSnap) && absDist > 0.1;

      if (Math.abs(newVelocity) < MIN_VELOCITY && Math.abs(newDistToSnap) < SNAP_THRESHOLD) {
        setRotation(targetSnap);
        setVelocity(0);
        setAnimating(false);
        lastTimestampRef.current = 0;
        return;
      }

      // If we crossed the target with low velocity, snap immediately
      if (crossedTarget && Math.abs(newVelocity) < MAGNETIC_THRESHOLD) {
        setRotation(targetSnap);
        setVelocity(0);
        setAnimating(false);
        lastTimestampRef.current = 0;
        return;
      }

      setRotation(newRotation);
      setVelocity(newVelocity);
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      lastTimestampRef.current = 0;
    };
  }, [animating, rotation, velocity]);

  const isMobile = viewportWidth < 640;
  const visibleHalfArc = isMobile ? 30 : 90;

  const nodesByAttr = useMemo(() => {
    const grouped = {};
    for (const a of ATTRS) grouped[a.key] = [];
    for (const activity of state.activities) {
      const stats = activityStats(activity, state.sessions);
      if (stats.sessionCount > 0) {
        grouped[activity.attribute]?.push({ activity, stats });
      }
    }
    return grouped;
  }, [state.activities, state.sessions]);

  const containerRef = useCallback((el) => {
    if (el) setContainerRect(el.getBoundingClientRect());
  }, []);

  const handlePointerDown = useCallback(
    (e) => {
      e.preventDefault();
      if (!containerRect) return;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setAnimating(false);
      lastTimestampRef.current = 0;

      const startPointerAngle = angleFromHub(
        e.clientX,
        e.clientY,
        containerRect,
        containerRect.width / 2,
        containerRect.height - BUTTON_RADIUS - BOTTOM_MARGIN
      );
      e.target.setPointerCapture(e.pointerId);
      setDragging(true);
      setVelocity(0);
      lastPointerAngleRef.current = startPointerAngle;
      lastTimestampRef.current = performance.now();
      e.currentTarget.dataset.startPointerAngle = startPointerAngle;
      e.currentTarget.dataset.startRotation = rotation;
    },
    [containerRect, rotation]
  );

  const handlePointerMove = useCallback(
    (e) => {
      if (!dragging || !containerRect) return;
      const now = performance.now();
      const dt = (now - lastTimestampRef.current) / 16.67;
      lastTimestampRef.current = now;

      const currentPointerAngle = angleFromHub(
        e.clientX,
        e.clientY,
        containerRect,
        containerRect.width / 2,
        containerRect.height - BUTTON_RADIUS - BOTTOM_MARGIN
      );

      const rawDelta = currentPointerAngle - lastPointerAngleRef.current;
      const delta = ((rawDelta + 180) % 360) - 180;

      lastPointerAngleRef.current = currentPointerAngle;

      const startPointerAngle = Number(e.currentTarget.dataset.startPointerAngle);
      const startRotation = Number(e.currentTarget.dataset.startRotation);
      const totalDelta = ((currentPointerAngle - startPointerAngle + 180) % 360) - 180;

      const newRotation = startRotation + totalDelta;
      setRotation(newRotation);

      const frameVelocity = dt > 0 ? delta / dt : 0;
      setVelocity(frameVelocity * 0.7 + velocity * 0.3);
    },
    [dragging, containerRect, velocity]
  );

  const handlePointerUp = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setAnimating(true);
    lastTimestampRef.current = 0;
  }, [dragging]);

  const handlePointerLeave = useCallback(() => {
    if (!dragging) return;
    setDragging(false);
    setAnimating(true);
    lastTimestampRef.current = 0;
  }, [dragging]);

  const focused = getFocusedAttribute(rotation);

  const containerWidth = containerRect ? containerRect.width : 340;
  const containerHeight = containerRect ? containerRect.height : Math.max(420, viewportHeight - 152);
  const hubX = containerWidth / 2;
  const hubY = containerHeight - BUTTON_RADIUS - BOTTOM_MARGIN;
  const dialRadius = hubY - TOP_MARGIN;

  return (
    <div className="px-4 pt-6">
      <div className="text-center mb-4">
        <div className="text-xs uppercase tracking-widest text-neutral-500">Better Role</div>
        <div className="text-lg font-semibold">{state.user.name}</div>
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden select-none touch-none"
        style={{ width: "100%", height: `calc(100vh - 152px)`, minHeight: `calc(100vh - 152px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerUp}
      >
        {ATTRS.map((attr) => {
          const effectiveAngle = attr.angle + rotation;
          const diff = getAngleDiffFromTop(attr.angle, rotation);
          const isFocused = attr.key === focused.key;
          const isVisible = diff <= visibleHalfArc;

          if (!isVisible) return null;

          const rad = (effectiveAngle * Math.PI) / 180;
          const labelRadius = dialRadius + 34;
          const lx = hubX + Math.cos(rad) * labelRadius;
          const ly = hubY + Math.sin(rad) * labelRadius;
          const attrVal = state.attributes[attr.key] || 0;

          const iconColor = isFocused ? attr.color : "#525252";
          const valueColor = isFocused ? attr.color : "#525252";

          return (
            <div key={attr.key}>
              <div
                className="absolute flex flex-col items-center text-center"
                style={{ left: lx, top: ly, transform: "translate(-50%,-50%)", width: 70 }}
              >
                <attr.icon size={14} color={iconColor} />
                <div className="text-[10px] uppercase tracking-wide text-neutral-400 mt-0.5">{attr.label}</div>
                <div className="text-[11px] font-semibold" style={{ color: valueColor }}>{attrVal}</div>
              </div>
            </div>
          );
        })}

        {ATTRS.map((attr) => {
          const effectiveAngle = attr.angle + rotation;
          const diff = getAngleDiffFromTop(attr.angle, rotation);
          const isFocused = attr.key === focused.key;
          const isVisible = diff <= visibleHalfArc;

          if (!isVisible) return null;

          const nodes = nodesByAttr[attr.key];
          const spread = 26;
          return nodes.map((n, i) => {
            const offset =
              nodes.length > 1
                ? (i - (nodes.length - 1) / 2) * (spread / Math.max(nodes.length - 1, 1))
                : 0;
            const nodeAngle = ((attr.angle + offset + rotation) * Math.PI) / 180;
            const dist = dialRadius * 0.68;
            const nx = hubX + Math.cos(nodeAngle) * dist;
            const ny = hubY + Math.sin(nodeAngle) * dist;
            const r = nodeRadius(n.stats.sessionCount);

            const bgColor = isFocused ? `${attr.color}33` : "#26262633";
            const borderColor = isFocused ? attr.color : "#525252";
            const textColor = isFocused ? "#f5f5f5" : "#737373";

            return (
              <button
                key={n.activity.id}
                onClick={() => onOpenActivity(n.activity)}
                className="absolute flex items-center justify-center rounded-full text-[10px] font-medium leading-tight text-center px-1"
                style={{
                  left: nx,
                  top: ny,
                  width: r * 2,
                  height: r * 2,
                  transform: "translate(-50%,-50%)",
                  background: bgColor,
                  border: `1.5px solid ${borderColor}`,
                  color: textColor,
                }}
              >
                {isFocused && (n.activity.name.length > 10 ? n.activity.name.slice(0, 9) + "…" : n.activity.name)}
              </button>
            );
          });
        })}

        <svg
          className="absolute top-0 left-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {ATTRS.map((attr, idx) => {
            const dividerAngle = attr.angle + 30 + rotation;
            const rad = (dividerAngle * Math.PI) / 180;
            const x2 = hubX + Math.cos(rad) * dialRadius;
            const y2 = hubY + Math.sin(rad) * dialRadius;

            const prevAttr = attr;
            const nextAttr = ATTRS[(idx + 1) % ATTRS.length];
            const prevDiff = getAngleDiffFromTop(prevAttr.angle, rotation);
            const nextDiff = getAngleDiffFromTop(nextAttr.angle, rotation);
            const prevVisible = prevDiff <= visibleHalfArc;
            const nextVisible = nextDiff <= visibleHalfArc;

            if (!prevVisible && !nextVisible) return null;

            const isFlankingFocused =
              (prevAttr.key === focused.key || nextAttr.key === focused.key) &&
              (prevVisible || nextVisible);

            const strokeColor = isFlankingFocused ? `${focused.color}80` : "#262626";

            return (
              <line
                key={attr.key}
                x1={hubX}
                y1={hubY}
                x2={x2}
                y2={y2}
                stroke={strokeColor}
                strokeWidth="1.5"
              />
            );
          })}
        </svg>

        <button
          onClick={onOpenNew}
          className="absolute rounded-full bg-white text-neutral-950 flex flex-col items-center justify-center font-semibold shadow-lg z-10"
          style={{
            left: hubX,
            top: hubY,
            width: BUTTON_RADIUS * 2,
            height: BUTTON_RADIUS * 2,
            transform: "translate(-50%,-50%)",
          }}
        >
          <Plus size={22} />
          <span className="text-[10px] mt-0.5">New</span>
        </button>
      </div>

      {!state.activities.some((a) => activityStats(a, state.sessions).sessionCount > 0) && (
        <div className="text-center text-neutral-500 text-sm mt-10 px-6">
          Nothing on the map yet. Tap the button at the bottom to log your first activity.
        </div>
      )}
    </div>
  );
}