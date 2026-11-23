import { OceanEngine } from "./vendor/ascii-sharks/src/engine";
import type { SharkSpec } from "./vendor/ascii-sharks/src/world";

const canvas = document.querySelector<HTMLCanvasElement>("#shark-ocean");

const portfolioSharks: SharkSpec[] = [
  { kind: "whale", size: 1.05 },
  { kind: "greathammer", size: 0.95 },
  { kind: "whale", size: 0.88 },
  { kind: "thresher", size: 0.85 },
  { kind: "hammerhead", size: 0.85 },
  { kind: "tiger", size: 0.78 },
  { kind: "hammerhead", size: 0.76 },
];

if (canvas) {
  new OceanEngine(canvas, portfolioSharks, {
    theme: "light",
    stage: "full",
    pointer: true,
    clearCentre: true,
    contain: true,
  });
}
