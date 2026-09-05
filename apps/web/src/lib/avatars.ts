/**
 * Kid avatars. Picked by the child on their home screen and stored per child
 * profile in `accessibilityJson.avatar` (the flexible JSON blob the profile
 * API already round-trips — no schema migration needed).
 *
 * Each avatar is drawn as deterministic SVG by `components/kid/AvatarFace`.
 */

export interface AvatarDef {
  id: string;
  /** Indonesian label shown in the picker */
  label: string;
  /** main body hue */
  color: string;
  /** darker tone for outlines / ears */
  deep: string;
  /** soft tone for belly, inner ears, blush */
  soft: string;
}

export const AVATARS: AvatarDef[] = [
  { id: "bintang", label: "Bintang", color: "#f2b13a", deep: "#c98818", soft: "#ffedc4" },
  { id: "rubah", label: "Rubah", color: "#ec8a4a", deep: "#c05f1e", soft: "#ffe0c9" },
  { id: "kucing", label: "Kucing", color: "#93a0d6", deep: "#5f6cb0", soft: "#e3e8fb" },
  { id: "kelinci", label: "Kelinci", color: "#f0a3b8", deep: "#cd6c88", soft: "#fde2ea" },
  { id: "robot", label: "Robot", color: "#5f93ef", deep: "#3763c8", soft: "#dbe6ff" },
  { id: "beruang", label: "Beruang", color: "#bd8f63", deep: "#92653a", soft: "#f2e2d0" },
  { id: "dino", label: "Dino", color: "#67bd83", deep: "#3d9359", soft: "#dbf1e2" },
  { id: "paus", label: "Paus", color: "#5cbcd0", deep: "#2f92a8", soft: "#d8eff5" },
];

export function avatarDef(id?: string | null): AvatarDef {
  return AVATARS.find((a) => a.id === id) ?? AVATARS[0];
}

/** Read the stored avatar id from a child profile's accessibilityJson. */
export function avatarIdFromChild(accessibilityJson: unknown): string | null {
  if (accessibilityJson && typeof accessibilityJson === "object") {
    const value = (accessibilityJson as Record<string, unknown>).avatar;
    if (typeof value === "string" && value) return value;
  }
  return null;
}