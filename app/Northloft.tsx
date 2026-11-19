"use client";

import { useEffect } from "react";

const VARIANTS = [
  { name: "Ember", img: "/img/ember.webp", bg: ["#f58a25", "#b5420a"], ink: "#fff8f2", shell: ["#ffb067", "#f4741b", "#a8400a"], price: 139, was: 189 },
  { name: "Graphite", img: "/img/graphite.webp", bg: ["#3b3a3c", "#141315"], ink: "#f4f2ee", shell: ["#6f6d72", "#2f2e33", "#121115"], price: 149, was: 199 },
  { name: "Glacier", img: "/img/glacier.webp", bg: ["#d9dee4", "#98a1ab"], ink: "#1d2229", shell: ["#ffffff", "#e6e9ee", "#a9b0ba"], price: 149, was: 199 },
  { name: "Ruby", img: "/img/ruby.webp", bg: ["#d82a33", "#7d0b14"], ink: "#fff5f5", shell: ["#ff7b83", "#e0263a", "#8a0a18"], price: 139, was: 189 },
  { name: "Rosewood", img: "/img/rosewood.webp", bg: ["#c98b8f", "#8b5157"], ink: "#fff7f6", shell: ["#fbeaea", "#ead2d2", "#b98d90"], price: 129, was: 179 },
];

export default function Northloft() {
  useEffect(() => {
    // PWA: register the service worker for offline app-shell support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // every colour: page background (centre, edge), text, and the jacket's shell tones
    const stage = document.getElementById("stage")!;
    const orbit = document.getElementById("orbit")!;
    const swatches = document.getElementById("swatches")!;
    const timebar = document.getElementById("timebar")!;
    const pad = (n: number) => String(n).padStart(2, "0");
    const tsh = (n: number) => "TSh " + (n * 1000).toLocaleString("en-US");
    document.getElementById("countAll")!.textContent = pad(VARIANTS.length);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let idx = 0,
      busy = false,
      timer = 0,
      raf = 0;

    const onSwatchClick = VARIANTS.map((v, i) => {
      const b = document.createElement("button");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-label", v.name);
      b.style.setProperty("--sw", v.shell[1]);
      const click = () => {
        go(i);
        restart();
      };
      b.addEventListener("click", click);
      swatches.appendChild(b);
      return { b, click };
    });

    const paint = (i: number) => {
      const v = VARIANTS[i];
      stage.style.setProperty("--bg-a", v.bg[0]);
      stage.style.setProperty("--bg-b", v.bg[1]);
      stage.style.setProperty("--ink", v.ink);
      document.getElementById("price")!.textContent = tsh(v.price);
      document.getElementById("was")!.textContent = tsh(v.was);
      document.getElementById("save")!.textContent = "Save " + Math.round((1 - v.price / v.was) * 100) + "%";
      document.getElementById("colourName")!.textContent = v.name;
      [...swatches.children].forEach((d, j) => d.setAttribute("aria-checked", String(j === i)));
      document.getElementById("countName")!.textContent = v.name;
      document.getElementById("countNow")!.textContent = pad(i + 1);
    };

    // orbit carousel: all colours stand on one ring that turns around the centre.
    // The front of the ring is the chosen colour; the next colour waits at the back left, the previous at the back right.
    const STEP = 360 / VARIANTS.length;
    const orbs = VARIANTS.map((v, j) => {
      const el = document.createElement("div");
      el.className = "orb";
      el.innerHTML = `<div class="orb-in"><img class="jacket" src="${v.img}" alt="${v.name} cropped puffer jacket" width="900" height="900" draggable="false" decoding="async"></div>`;
      if (j) el.setAttribute("aria-hidden", "true");
      orbit.appendChild(el);
      return el;
    });
    let pos = 0; // ring position in "colours", animated between whole numbers
    const place = () => {
      const w = orbit.clientWidth,
        h = orbit.clientHeight;
      // a tighter ring on narrow screens and mid-size laptops so the back jackets never touch the text
      const vw = window.innerWidth;
      const radius = w * (vw <= 1000 ? 0.4 : vw < 1400 ? 0.37 : vw < 1600 ? 0.42 : 0.4);
      orbs.forEach((el, j) => {
        let a = ((j - pos) * -STEP) % 360;
        if (a > 180) a -= 360;
        if (a < -180) a += 360;
        const r = (a * Math.PI) / 180;
        const z = (Math.cos(r) + 1) / 2; // 1 at the front, 0 at the very back
        const scale = 0.24 + 0.76 * Math.pow(z, 3.2);
        const x = Math.sin(r) * radius;
        const y = (1 - z) * h * 0.22; // smaller jackets sit a little lower, like standing further away
        el.style.transform = `translate(${x.toFixed(1)}px, calc(-50% + ${y.toFixed(1)}px)) scale(${scale.toFixed(3)})`;
        el.style.zIndex = String(Math.round(z * 100));
        // the two at the very back stay hidden; they only appear while the ring turns
        el.style.opacity = String(Math.min(1, Math.max(0, (z - 0.12) * 3)).toFixed(3));
        el.style.filter = `brightness(${(0.78 + 0.22 * z).toFixed(3)}) drop-shadow(0 ${Math.round(10 + 20 * z)}px ${Math.round(14 + 26 * z)}px rgba(0,0,0,${(0.18 + 0.12 * z).toFixed(2)}))`;
      });
    };
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const go = (i: number, dir?: number) => {
      const n = VARIANTS.length;
      i = ((i % n) + n) % n;
      if (i === idx || busy) return;
      // how far round the ring to turn: arrows always go one way, swatches take the short way
      let delta = dir
        ? dir * ((((dir > 0 ? i - idx : idx - i) % n) + n) % n)
        : (((i - idx + n + Math.floor(n / 2)) % n) - Math.floor(n / 2));
      if (!delta) delta = i - idx;
      const from = pos,
        to = pos + delta;
      idx = i;
      paint(i);
      if (reduce) {
        pos = to;
        place();
        return;
      }
      busy = true;
      const t0 = performance.now(),
        dur = 1000 + 180 * (Math.abs(delta) - 1);
      const frame = (t: number) => {
        const k = Math.min(1, (t - t0) / dur);
        pos = from + (to - from) * ease(k);
        place();
        if (k < 1) raf = requestAnimationFrame(frame);
        else busy = false;
      };
      raf = requestAnimationFrame(frame);
    };
    const ro = new ResizeObserver(place);
    ro.observe(orbit);

    // auto-advance every 5 s; the line next to the counter fills up until the next colour
    const stop = () => {
      clearTimeout(timer);
      timebar.classList.remove("run");
    };
    const restart = () => {
      stop();
      if (reduce) return;
      void timebar.offsetWidth; // restart the fill animation
      timebar.classList.add("run");
      timer = window.setTimeout(() => {
        go(idx + 1, 1);
        restart();
      }, 5000);
    };
    const user = (fn: () => void) => () => {
      fn();
      restart();
    };
    const onNext = user(() => go(idx + 1, 1));
    const onPrev = user(() => go(idx - 1, -1));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        go(idx + 1, 1);
        restart();
      }
      if (e.key === "ArrowLeft") {
        go(idx - 1, -1);
        restart();
      }
    };
    const onEnter = stop;
    const onLeave = restart;
    const onVis = () => (document.hidden ? stop() : restart());
    const onSize = (e: Event) => {
      const b = (e.target as HTMLElement).closest("button");
      if (!b) return;
      [...document.getElementById("sizes")!.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    };

    document.getElementById("nextBtn")!.addEventListener("click", onNext);
    document.getElementById("prev")!.addEventListener("click", onPrev);
    addEventListener("keydown", onKey);
    stage.addEventListener("pointerenter", onEnter);
    stage.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVis);
    document.getElementById("sizes")!.addEventListener("click", onSize);

    place();
    paint(0);
    restart();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      document.getElementById("nextBtn")!.removeEventListener("click", onNext);
      document.getElementById("prev")!.removeEventListener("click", onPrev);
      removeEventListener("keydown", onKey);
      stage.removeEventListener("pointerenter", onEnter);
      stage.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVis);
      document.getElementById("sizes")!.removeEventListener("click", onSize);
      onSwatchClick.forEach(({ b, click }) => {
        b.removeEventListener("click", click);
        b.remove();
      });
      orbs.forEach((el) => el.remove());
      timebar.classList.remove("run");
    };
  }, []);

  return (
    <div className="stage" id="stage">
      <div className="grain"></div>

      <header className="nav">
        <a href="#" className="logo rise" aria-label="Materu home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="logo-mark" src="/brand/logo-symbol.svg" alt="" width="30" height="30" />
          Materu
        </a>
        <nav className="links rise d1" aria-label="Main">
          <a href="#" aria-current="page">Puffers</a>
          <a href="#">Collection</a>
          <a href="#">Our story</a>
          <a href="#">Contact</a>
        </nav>
        <div className="tools rise d2">
          <button className="icon-btn" aria-label="Search">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="9" cy="9" r="6" /><path d="m13.5 13.5 4 4" /></svg>
          </button>
          <button className="icon-btn bag" aria-label="Bag, 2 items">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d="M4 7h12l-1 10H5z" /><path d="M7.5 7V5.5a2.5 2.5 0 0 1 5 0V7" strokeLinecap="round" /></svg>
            <b>2</b>
          </button>
        </div>
      </header>

      <main className="main">
        <section className="left" aria-live="polite">
          <span className="tag rise d2">Cropped puffer · Winter 26</span>
          <h1 className="rise d3">
            <span>Warmth that</span>
            <span>turns heads</span>
          </h1>
          <p className="lede rise d4">Light as a breath, warm as a fireplace. Recycled down baffles, a water-shedding shell and a cropped cut that sits right over everything you already own.</p>
          <ul className="feats rise d4" aria-label="Features">
            <li>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 1.5v11M2.2 4.2l9.6 5.6M2.2 9.8l9.6-5.6" /></svg>
              700 fill power
            </li>
            <li>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M7 1.8C5 4.6 3.6 6.6 3.6 8.4a3.4 3.4 0 0 0 6.8 0C10.4 6.6 9 4.6 7 1.8z" /></svg>
              Water-shedding
            </li>
            <li>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 9.5c1.8-4.6 5-7 9-7-.3 4.4-3 7.6-7.4 8.2M2.5 11.5l3.6-3.6" /></svg>
              Recycled down
            </li>
          </ul>
          <a href="#" className="cta rise d5">
            Shop the look{" "}
            <span>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h8M7.5 3.5 11 7l-3.5 3.5" /></svg>
            </span>
          </a>
        </section>

        <div className="product rise d2">
          <div className="orbit" id="orbit"></div>
          <div className="shadow"></div>
        </div>

        <aside className="right rise d4" aria-label="Price and size">
          <div className="price-row">
            <span className="price" id="price">TSh 139,000</span>
            <span className="was" id="was">TSh 189,000</span>
            <span className="save" id="save">Save 26%</span>
          </div>
          <div className="pick pick-size">
            <span className="size-label">Pick your size</span>
            <div className="sizes" id="sizes">
              <button aria-pressed="false">S</button>
              <button aria-pressed="true">M</button>
              <button aria-pressed="false">L</button>
              <button aria-pressed="false">XL</button>
            </div>
          </div>
          <div className="pick pick-colour">
            <span className="size-label">
              Colour · <b id="colourName">Ember</b>
            </span>
            <div className="swatches" id="swatches" role="radiogroup" aria-label="Colour"></div>
          </div>
        </aside>
      </main>

      <footer className="bottom">
        <div className="arrows rise d5">
          <button id="prev" aria-label="Previous colour">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 3 4.5 7l4 4" /></svg>
          </button>
          <button id="nextBtn" aria-label="Next colour">
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5.5 3l4 4-4 4" /></svg>
          </button>
        </div>
        <p className="motto rise d5">
          Made for cold mornings,
          <br />
          worn for every moment after.
        </p>
        <div className="count rise d5" aria-live="polite">
          <span className="count-name" id="countName">Ember</span>
          <div className="count-row">
            <b id="countNow">01</b>
            <span className="timebar" aria-hidden="true">
              <i id="timebar"></i>
            </span>
            <span id="countAll">05</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
