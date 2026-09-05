/**
 * Terjemahan pesan yang berasal dari logika game (paket @cog/game-*) —
 * paket tetap berbahasa Inggris, antarmuka menampilkannya dalam Bahasa Indonesia.
 */

const MAP: Record<string, string> = {
  "Correct!": "Benar!",
  "Good!": "Bagus!",
  "Good inhibition!": "Tahan diri, tepat!",
  "Hit!": "Tepat sasaran!",
  "Wrong!": "Salah!",
  "Miss!": "Terlewat!",
  "False alarm!": "Alarm palsu!",
  "Should have stopped!": "Seharusnya tidak mengetuk!",
  "Wrong direction!": "Arah salah!",
  "Too slow!": "Terlambat!",
  "Practice round complete!": "Ronde latihan selesai!",
  "Match by COLOR": "Cocokkan WARNA",
  "Match by SHAPE": "Cocokkan BENTUK",
  "Match by SIZE": "Cocokkan UKURAN",
  "Match by FILL": "Cocokkan ISI",
};

/** Hapus penanda (✓ ✗ ⏰ dsb.) lalu terjemahkan bila dikenal. */
export function translate(str: string | null | undefined): string {
  if (!str) return "";
  const clean = str.replace(/^[\u2713\u2717\u23f0\u26a0\ufe0f\s]+/u, "").trim();
  return MAP[clean] ?? MAP[str.trim()] ?? clean;
}
