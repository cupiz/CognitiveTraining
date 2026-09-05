"use client";

import { useState } from "react";
import { getSoundSettings, toggleSound, resumeAudio } from "@/lib/game/sound-effects";
import { Icon } from "@/components/ui/icons";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(getSoundSettings().enabled);

  const handleToggle = () => {
    resumeAudio();
    const next = toggleSound();
    setEnabled(next);
  };

  return (
    <button
      onClick={handleToggle}
      className="icon-btn border border-line bg-white"
      title={enabled ? "Matikan suara" : "Nyalakan suara"}
      aria-label={enabled ? "Matikan suara" : "Nyalakan suara"}
      aria-pressed={!enabled}
    >
      <Icon name={enabled ? "sound-on" : "sound-off"} className="size-4.5" />
    </button>
  );
}
