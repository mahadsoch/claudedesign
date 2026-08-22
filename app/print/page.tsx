"use client";

import { useEffect, useState } from "react";
import type { Deck } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";
import "../../styles/print.css";

// Images arrive inlined as data URLs, so resolveImage is identity.
const ctx: BaseRenderCtx = { resolveImage: (r) => r };

export default function PrintPage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) return;
    fetch(`/api/pdf-data?token=${token}`)
      .then((r) => r.json())
      .then((d) => setDeck(d.deck))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!deck) return;
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      setReady(true);
    };
    Promise.all([
      (document as Document).fonts?.ready ?? Promise.resolve(),
      // give layout + images a beat to settle
      new Promise((res) => setTimeout(res, 350)),
    ]).then(finish);
  }, [deck]);

  if (!deck) return null;

  return (
    <div data-print-root {...(ready ? { "data-print-ready": "1" } : {})}>
      {deck.slides.map((slide, i) => (
        <div
          key={slide.id}
          className="print-slide"
          data-slide-index={i}
          style={{ width: STAGE_W, height: STAGE_H }}
        >
          <SlideRenderer
            slide={slide}
            ctx={ctx}
            slideNumber={i + 1}
            slideCount={deck.slides.length}
          />
        </div>
      ))}
    </div>
  );
}
