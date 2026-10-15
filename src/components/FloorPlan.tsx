"use client";

import Image from "next/image";
import { useRef, useState, type TouchEvent } from "react";
import { floors } from "@/data/house";
import { buzz } from "@/lib/haptics";
import styles from "./FloorPlan.module.css";

const SWIPE_DISTANCE = 60;

export default function FloorPlan() {
  const [floorIndex, setFloorIndex] = useState(0);
  const [roomId, setRoomId] = useState(floors[0].rooms[0].id);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const floor = floors[floorIndex];
  const room = floor.rooms.find((r) => r.id === roomId) ?? floor.rooms[0];

  const goToFloor = (index: number) => {
    if (index < 0 || index >= floors.length || index === floorIndex) return;
    setFloorIndex(index);
    setRoomId(floors[index].rooms[0].id);
    buzz();
  };

  const selectRoom = (id: string) => {
    setRoomId(id);
    buzz();
  };

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    // only a clear horizontal swipe counts, vertical scroll stays native
    if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToFloor(dx < 0 ? floorIndex + 1 : floorIndex - 1);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist" aria-label="Floors">
        {floors.map((f, i) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={i === floorIndex}
            className={styles.tab}
            onClick={() => goToFloor(i)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className={styles.layout}>
        <div className={`paper ${styles.mapCard}`}>
          <div
            key={floor.id}
            className={styles.plan}
            style={{ aspectRatio: `${floor.width} / ${floor.height}` }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={floor.image}
              alt={`${floor.label} plan of Stars House Club`}
              fill
              priority={floorIndex === 0}
              sizes="(min-width: 1100px) 700px, 100vw"
              className={styles.planImg}
            />

            {/* highlight zones */}
            <svg
              className={styles.overlay}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              {floor.rooms.map((r) => (
                <polygon
                  key={r.id}
                  className={styles.zone}
                  data-active={r.id === room.id}
                  points={r.zone.map(([x, y]) => `${x},${y}`).join(" ")}
                  onClick={() => selectRoom(r.id)}
                />
              ))}
            </svg>

            {/* number pins (the accessible buttons) */}
            {floor.rooms.map((r) => (
              <button
                key={r.id}
                type="button"
                className={styles.pin}
                style={{ left: `${r.pin.x}%`, top: `${r.pin.y}%` }}
                aria-pressed={r.id === room.id}
                aria-label={`${r.number}. ${r.name}`}
                onClick={() => selectRoom(r.id)}
              >
                {r.number}
              </button>
            ))}
          </div>

          <p className={`script ${styles.hint}`}>
            tap a number · swipe to change floor
          </p>

          <ul className={styles.chips}>
            {floor.rooms.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={styles.chip}
                  aria-pressed={r.id === room.id}
                  onClick={() => selectRoom(r.id)}
                >
                  <span className={styles.chipNum}>{r.number}</span>
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <article
          key={room.id}
          className={`paper ${styles.detail}`}
          aria-live="polite"
        >
          <div className={styles.head}>
            <span className={styles.bigNum}>{room.number}</span>
            <div>
              <p className={styles.floorTag}>{floor.label}</p>
              <h3 className={styles.name}>{room.name}</h3>
            </div>
          </div>

          <p>{room.text}</p>

          <p className={styles.find}>
            <strong>How to find it</strong>
            <span className="script">{room.find}</span>
          </p>

          <ul className={styles.tags}>
            {room.tags.map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </ul>
        </article>
      </div>
    </div>
  );
}
