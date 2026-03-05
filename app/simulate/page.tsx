"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";

const BASE = typeof window !== "undefined" ? window.location.origin : "";

type SimStep =
  | { type: "goto"; path: string }
  | { type: "wait"; ms: number }
  | { type: "type"; selector: string; text: string; delay?: number }
  | { type: "click"; selector: string; text?: string }
  | { type: "scroll"; selector: string; y: number };

type ScenarioId = "browsing" | "urgent_replenishment" | "discovery" | "ready_to_pay" | "routine_shop";

type TimeOfDay = "auto" | "morning" | "afternoon" | "evening";
type Season = "auto" | "spring" | "summer" | "autumn" | "winter";
type DayOfWeek = "auto" | "weekday" | "weekend";
type DeviceType = "auto" | "mobile" | "tablet" | "desktop";
type Referrer = "auto" | "direct" | "google" | "social" | "internal";

function buildHolmesQuery(scenario: ScenarioId, context: {
  timeOfDay: TimeOfDay;
  season: Season;
  dayOfWeek: DayOfWeek;
  deviceType: DeviceType;
  referrer: Referrer;
}): string {
  const params = new URLSearchParams();
  params.set("holmes_demo", scenario);
  if (context.timeOfDay !== "auto") params.set("holmes_time", context.timeOfDay);
  if (context.season !== "auto") params.set("holmes_season", context.season);
  if (context.dayOfWeek !== "auto") params.set("holmes_day", context.dayOfWeek);
  if (context.deviceType !== "auto") params.set("holmes_device", context.deviceType);
  if (context.referrer !== "auto") params.set("holmes_referrer", context.referrer);
  return params.toString();
}

const SCENARIOS: { id: ScenarioId; label: string; description: string }[] = [
  { id: "browsing", label: "Browsing", description: "Explore products, expanded recommendations" },
  { id: "urgent_replenishment", label: "Urgent", description: "Fast checkout, hidden extras" },
  { id: "discovery", label: "Discovery", description: "Search-driven exploration" },
  { id: "ready_to_pay", label: "Ready to Pay", description: "Cart full, payment focus" },
  { id: "routine_shop", label: "Routine Shop", description: "Methodical browsing" },
];

function getStepAnnotation(step: SimStep, idx: number, scenarioId: ScenarioId): { title: string; lookFor: string } {
  if (step.type === "goto") {
    const path = step.path;
    if (path === "/catalogue") return { title: "Loading catalogue", lookFor: "Both sides start identical. Right side: Holmes is inferring your mission." };
    if (path === "/cart") return { title: "Viewing cart", lookFor: "RIGHT: Look for Holmes bundle suggestions (e.g. 'Add these items for a quick bundle'). LEFT: None." };
    if (path === "/checkout") return { title: "Checkout", lookFor: "RIGHT: Checkout extras may be hidden for urgency. LEFT: Standard checkout." };
    return { title: `Navigate to ${path}`, lookFor: "" };
  }
  if (step.type === "wait") {
    if (idx === 1) return { title: "Waiting for Holmes to load", lookFor: "Right side: Holmes sends signals and gets mission. Give it ~3s." };
    return { title: `Pausing ${step.ms}ms`, lookFor: "" };
  }
  if (step.type === "click") {
    if (step.text === "Add to cart") return { title: "Adding to cart", lookFor: "Both add the same item. Holmes updates its signals." };
    if (step.selector.includes("basket-bundle")) return { title: "Clicking Holmes bundle", lookFor: "RIGHT ONLY: Holmes suggested a bundle. Adding it. LEFT: This element doesn't exist." };
    if (step.selector.includes("catalogue/")) return { title: "Opening product page", lookFor: "RIGHT: 'You May Also Like' may show Holmes picks. LEFT: Default recommendations." };
    return { title: "Clicking", lookFor: "" };
  }
  if (step.type === "type") return { title: "Typing search", lookFor: "Right: Holmes sees search intent (discovery mode)." };
  if (step.type === "scroll") return { title: "Scrolling", lookFor: "Holmes tracks scroll depth as a signal." };
  return { title: "Step", lookFor: "" };
}

function getStepsForScenario(scenarioId: ScenarioId): SimStep[] {
  const base = [
    { type: "goto" as const, path: "/catalogue" },
    { type: "wait" as const, ms: 4500 },
  ];
  switch (scenarioId) {
    case "urgent_replenishment":
      return [
        ...base,
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 800 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 500 },
        { type: "goto" as const, path: "/checkout" },
        { type: "wait" as const, ms: 2000 },
      ];
    case "discovery":
      return [
        ...base,
        { type: "click" as const, selector: 'input[placeholder*="Search"], input[type="search"]' },
        { type: "wait" as const, ms: 300 },
        { type: "type" as const, selector: 'input[placeholder*="Search"], input[type="search"]', text: "milk", delay: 80 },
        { type: "wait" as const, ms: 1000 },
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 1500 },
        { type: "scroll" as const, selector: "main", y: 300 },
        { type: "wait" as const, ms: 500 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 600 },
      ];
    case "ready_to_pay":
      return [
        ...base,
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 600 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 400 },
        { type: "goto" as const, path: "/catalogue" },
        { type: "wait" as const, ms: 600 },
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 500 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 400 },
        { type: "goto" as const, path: "/checkout" },
        { type: "wait" as const, ms: 2000 },
      ];
    case "routine_shop":
      return [
        ...base,
        { type: "scroll" as const, selector: "main", y: 200 },
        { type: "wait" as const, ms: 800 },
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 1200 },
        { type: "scroll" as const, selector: "main", y: 300 },
        { type: "wait" as const, ms: 500 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 600 },
        { type: "goto" as const, path: "/catalogue" },
        { type: "wait" as const, ms: 1000 },
      ];
    case "browsing":
    default:
      return [
        ...base,
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 1500 },
        { type: "scroll" as const, selector: "main", y: 300 },
        { type: "wait" as const, ms: 500 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 600 },
        { type: "goto" as const, path: "/catalogue" },
        { type: "wait" as const, ms: 1500 },
        { type: "click" as const, selector: 'a[href^="/catalogue/"]' },
        { type: "wait" as const, ms: 1000 },
        { type: "click" as const, selector: "button", text: "Add to cart" },
        { type: "wait" as const, ms: 500 },
        { type: "goto" as const, path: "/cart" },
        { type: "wait" as const, ms: 4000 },
        { type: "click" as const, selector: '[data-holmes="basket-bundle"] button, [data-holmes="basket-bundle"] a' },
        { type: "wait" as const, ms: 1200 },
        { type: "goto" as const, path: "/checkout" },
        { type: "wait" as const, ms: 4000 },
      ];
  }
}

function executeInFrame(
  frame: HTMLIFrameElement | null,
  step: SimStep,
  basePathLeft: string,
  basePathRight: string
): Promise<void> {
  if (!frame?.contentDocument) return Promise.resolve();

  const doc = frame.contentDocument;
  const win = frame.contentWindow;
  if (!win) return Promise.resolve();

  const q = (sel: string) => {
    try {
      const el = doc.querySelector(sel);
      return el as HTMLElement | null;
    } catch {
      return null;
    }
  };

  const qAll = (sel: string) => {
    try {
      return Array.from(doc.querySelectorAll(sel)) as HTMLElement[];
    } catch {
      return [];
    }
  };

  const resolveSelector = (sel: string): HTMLElement | null => {
    if (sel.includes(",")) {
      for (const part of sel.split(",").map((s) => s.trim())) {
        const el = q(part);
        if (el) return el;
      }
      return null;
    }
    return q(sel);
  };

  const resolveSelectorAll = (sel: string): HTMLElement[] => {
    if (sel.includes(",")) {
      for (const part of sel.split(",").map((s) => s.trim())) {
        const els = qAll(part);
        if (els.length) return els;
      }
      return [];
    }
    return qAll(sel);
  };

  switch (step.type) {
    case "goto": {
      const isLeft = frame.dataset.simulatePanel === "left";
      const holmesDemo = frame.dataset.holmesDemo ?? "browsing";
      const url = isLeft ? `${BASE}${step.path}?holmes_disabled=1` : `${BASE}${step.path}?holmes_demo=${holmesDemo}`;
      frame.src = url;
      return new Promise((r) => {
        frame.onload = () => {
          frame.onload = null;
          r();
        };
        if (frame.contentWindow?.location.href === url) r();
      });
    }
    case "wait":
      return new Promise((r) => setTimeout(r, step.ms));
    case "click": {
      let els = resolveSelectorAll(step.selector);
      if ("text" in step && step.text) {
        els = els.filter((e) => e.textContent?.toLowerCase().includes(step.text!.toLowerCase()));
      }
      const el = els[0];
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        return new Promise((r) => setTimeout(r, 400)).then(() => {
          el.focus?.();
          el.click();
        });
      }
      return Promise.resolve();
    }
    case "type": {
      const el = resolveSelector(step.selector);
      const input = el as HTMLInputElement;
      if (!el || typeof input?.value === "undefined") return Promise.resolve();
      const typeDelay = step.delay ?? 60;
      input.focus();
      input.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return Array.from(step.text).reduce(
        (p, char) =>
          p.then(() => {
            input.value += char;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
            input.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
            return new Promise((r) => setTimeout(r, typeDelay));
          }),
        Promise.resolve()
      );
    }
    case "scroll": {
      const el = resolveSelector(step.selector) ?? doc.scrollingElement ?? doc.body;
      if (el) el.scrollBy({ top: step.y, behavior: "smooth" });
      return new Promise((r) => setTimeout(r, 500));
    }
    default:
      return Promise.resolve();
  }
}

export default function SimulatePage() {
  const leftRef = useRef<HTMLIFrameElement>(null);
  const rightRef = useRef<HTMLIFrameElement>(null);
  const [playing, setPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(-1);
  const [scenario, setScenario] = useState<ScenarioId>("browsing");
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>("auto");
  const [season, setSeason] = useState<Season>("auto");
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>("auto");
  const [deviceType, setDeviceType] = useState<DeviceType>("auto");
  const [referrer, setReferrer] = useState<Referrer>("auto");
  const [speed, setSpeed] = useState(1);
  const [holmesInitMs, setHolmesInitMs] = useState(4500);
  const [typingDelayMs, setTypingDelayMs] = useState(80);
  const [stepPauseMs, setStepPauseMs] = useState(300);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [iframeZoom, setIframeZoom] = useState(0.8);

  const simulationSteps = getStepsForScenario(scenario);
  const zoomScale = 1 / iframeZoom;
  const holmesQuery = buildHolmesQuery(scenario, { timeOfDay, season, dayOfWeek, deviceType, referrer });

  const runStep = useCallback(
    async (idx: number) => {
      if (idx >= simulationSteps.length) {
        setPlaying(false);
        setStepIndex(simulationSteps.length - 1);
        return;
      }
      let step = simulationSteps[idx];
      if (step.type === "wait" && idx === 1) step = { ...step, ms: holmesInitMs };
      if (step.type === "type" && "delay" in step) step = { ...step, delay: typingDelayMs };
      setStepIndex(idx);

      const leftFrame = leftRef.current;
      const rightFrame = rightRef.current;

      if (step.type === "goto") {
        const sim = Date.now();
        const leftUrl = `${BASE}${step.path}?holmes_disabled=1&_sim=${sim}`;
        const rightUrl = `${BASE}${step.path}?${holmesQuery}&_sim=${sim}`;
        if (leftFrame) {
          leftFrame.dataset.simulatePanel = "left";
          leftFrame.src = leftUrl;
        }
        if (rightFrame) {
          rightFrame.dataset.simulatePanel = "right";
          rightFrame.src = rightUrl;
        }
        await Promise.all([
          new Promise<void>((r) => {
            if (leftFrame) leftFrame.onload = () => r();
            else r();
          }),
          new Promise<void>((r) => {
            if (rightFrame) rightFrame.onload = () => r();
            else r();
          }),
        ]);
      } else {
        await Promise.all([
          executeInFrame(leftFrame, step, "", ""),
          executeInFrame(rightFrame, step, "", ""),
        ]);
      }

      const delay = step.type === "wait" ? Math.min(step.ms / speed, 8000) : stepPauseMs / speed;
      await new Promise((r) => setTimeout(r, Math.round(delay)));

      runStep(idx + 1);
    },
    [speed, holmesInitMs, typingDelayMs, stepPauseMs, simulationSteps, holmesQuery]
  );

  const handlePlay = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    if (stepIndex >= simulationSteps.length - 1) {
      setStepIndex(-1);
      const left = leftRef.current;
      const right = rightRef.current;
      const sim = Date.now();
      if (left) left.src = `${BASE}/catalogue?holmes_disabled=1&_sim=${sim}`;
      if (right) right.src = `${BASE}/catalogue?${holmesQuery}&_sim=${sim}`;
    }
    runStep(stepIndex < 0 ? 0 : stepIndex + 1);
  }, [playing, stepIndex, runStep, simulationSteps.length, holmesQuery]);

  const handleReset = useCallback(() => {
    setPlaying(false);
    setStepIndex(-1);
    const sim = Date.now();
    if (leftRef.current) leftRef.current.src = `${BASE}/catalogue?holmes_disabled=1&_sim=${sim}`;
    if (rightRef.current) rightRef.current.src = `${BASE}/catalogue?${holmesQuery}&_sim=${sim}`;
  }, [holmesQuery]);

  return (
    <div className="fixed inset-0 z-50 min-h-screen bg-slate-900 text-white flex flex-col">
      <header className="border-b border-slate-700 shrink-0">
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="text-sm text-slate-400 hover:text-white shrink-0">
              ← Store
            </Link>
            <h1 className="font-semibold text-lg shrink-0">Holmes Simulation</h1>
            <label className="flex items-center gap-2 text-sm min-w-0 shrink">
              <span className="text-slate-400 shrink-0">Scenario:</span>
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value as ScenarioId)}
                disabled={playing}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm max-w-[160px]"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSettingsOpen((o) => !o)}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium"
            >
              {settingsOpen ? "Hide settings" : "Settings"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded bg-slate-700 hover:bg-slate-600 text-sm font-medium"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handlePlay}
              disabled={playing}
              className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm font-semibold"
            >
              {playing ? "Playing…" : "Play"}
            </button>
          </div>
        </div>
        {settingsOpen && (
        <>
        <div className="px-4 pb-3 flex flex-wrap gap-6 items-end">
          <label className="flex flex-col gap-1 text-sm min-w-[120px]">
            <span className="text-slate-400">Iframe zoom: {Math.round(iframeZoom * 100)}%</span>
            <select
              value={iframeZoom}
              onChange={(e) => setIframeZoom(Number(e.target.value))}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value={0.6}>60%</option>
              <option value={0.7}>70%</option>
              <option value={0.8}>80%</option>
              <option value={0.9}>90%</option>
              <option value={1}>100%</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm min-w-[140px]">
            <span className="text-slate-400">Speed: {speed}×</span>
            <input
              type="range"
              min={0.25}
              max={2}
              step={0.25}
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              disabled={playing}
              className="w-full accent-green-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm min-w-[160px]">
            <span className="text-slate-400">Holmes init: {holmesInitMs}ms</span>
            <input
              type="range"
              min={1500}
              max={6000}
              step={250}
              value={holmesInitMs}
              onChange={(e) => setHolmesInitMs(Number(e.target.value))}
              disabled={playing}
              className="w-full accent-green-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm min-w-[140px]">
            <span className="text-slate-400">Typing: {typingDelayMs}ms/char</span>
            <input
              type="range"
              min={20}
              max={150}
              step={10}
              value={typingDelayMs}
              onChange={(e) => setTypingDelayMs(Number(e.target.value))}
              disabled={playing}
              className="w-full accent-green-500"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm min-w-[140px]">
            <span className="text-slate-400">Step pause: {stepPauseMs}ms</span>
            <input
              type="range"
              min={100}
              max={800}
              step={50}
              value={stepPauseMs}
              onChange={(e) => setStepPauseMs(Number(e.target.value))}
              disabled={playing}
              className="w-full accent-green-500"
            />
          </label>
        </div>
        <div className="px-4 pb-3 flex flex-wrap gap-4 items-center border-t border-slate-700/50 pt-3">
          <span className="text-slate-500 text-sm shrink-0">Context (Holmes ON):</span>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Time:</span>
            <select
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Season:</span>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value as Season)}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="spring">Spring</option>
              <option value="summer">Summer</option>
              <option value="autumn">Autumn</option>
              <option value="winter">Winter</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Day:</span>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="weekday">Weekday</option>
              <option value="weekend">Weekend</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Device:</span>
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as DeviceType)}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="mobile">Mobile</option>
              <option value="tablet">Tablet</option>
              <option value="desktop">Desktop</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Referrer:</span>
            <select
              value={referrer}
              onChange={(e) => setReferrer(e.target.value as Referrer)}
              disabled={playing}
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="auto">Auto</option>
              <option value="direct">Direct</option>
              <option value="google">Google</option>
              <option value="social">Social</option>
              <option value="internal">Internal</option>
            </select>
          </label>
        </div>
        </>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col border-r border-slate-700">
          <div className="px-3 py-2 bg-slate-800/50 border-b border-slate-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-500" />
            <span className="font-medium text-sm">Holmes OFF</span>
            <span className="text-slate-500 text-xs">No AI personalization</span>
          </div>
          <div className="flex-1 min-h-0 p-2 overflow-hidden relative">
            <div className="absolute inset-0 rounded-lg border border-slate-600 overflow-hidden" style={{ width: `${zoomScale * 100}%`, height: `${zoomScale * 100}%`, transform: `scale(${iframeZoom})`, transformOrigin: "0 0" }}>
              <iframe
                ref={leftRef}
                data-simulate-panel="left"
                src={`${BASE}/catalogue?holmes_disabled=1`}
                className="w-full h-full rounded-lg border-0 bg-white"
                title="Holmes OFF"
              />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="px-3 py-2 bg-green-900/30 border-b border-slate-700 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-500" />
            <span className="font-medium text-sm">Holmes ON</span>
            <span className="text-slate-500 text-xs">{SCENARIOS.find((s) => s.id === scenario)?.label ?? scenario}</span>
          </div>
          <div className="flex-1 min-h-0 p-2 overflow-hidden relative">
            <div className="absolute inset-0 rounded-lg border border-slate-600 overflow-hidden" style={{ width: `${zoomScale * 100}%`, height: `${zoomScale * 100}%`, transform: `scale(${iframeZoom})`, transformOrigin: "0 0" }}>
              <iframe
                ref={rightRef}
                src={`${BASE}/catalogue?${holmesQuery}`}
                className="w-full h-full rounded-lg border-0 bg-white"
                title="Holmes ON"
              />
            </div>
          </div>
        </div>
      </div>

      <footer className="px-4 py-3 bg-slate-800/90 border-t border-slate-700 shrink-0">
        {stepIndex >= 0 ? (
          <div className="space-y-1">
            <div className="text-sm font-medium text-white">
              Step {stepIndex + 1} of {simulationSteps.length} — {getStepAnnotation(simulationSteps[stepIndex]!, stepIndex, scenario).title}
            </div>
            {getStepAnnotation(simulationSteps[stepIndex]!, stepIndex, scenario).lookFor && (
              <div className="text-xs text-green-300">
                👀 {getStepAnnotation(simulationSteps[stepIndex]!, stepIndex, scenario).lookFor}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-slate-400">
            {playing ? "Starting…" : "Click Play to run the simulation. Watch the right side for Holmes differences (bundles, recommendations, checkout changes)."}
          </div>
        )}
      </footer>
    </div>
  );
}
