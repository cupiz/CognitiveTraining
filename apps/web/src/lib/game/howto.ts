/**
 * Per-game "how to play" steps, shown in the arena before the game starts.
 * Kid-facing, short imperative sentences (7–12yo audience).
 */

export const GAME_HOWTO: Record<string, { steps: string[] }> = {
  memory_matrix: {
    steps: [
      "Perhatikan ubin yang menyala satu per satu.",
      "Ingat urutannya baik-baik.",
      "Setelah berhenti, ketuk ubin lagi dengan urutan yang sama.",
    ],
  },
  target_watch: {
    steps: [
      "Lihat simbol target yang ditunjukkan.",
      "Ketuk hanya saat simbol target muncul.",
      "Simbol lain biarkan saja — jangan ikut diketuk!",
    ],
  },
  quick_match: {
    steps: [
      "Hafalkan simbol target di bagian atas.",
      "Cari pasangannya di antara pilihan.",
      "Ketuk sebelum waktunya habis — semakin cepat semakin baik!",
    ],
  },
  stop_signal: {
    steps: [
      "Ketuk arah panah yang muncul secepat mungkin.",
      "Kalau tanda berhenti muncul, jangan ketuk apa pun!",
      "Tahan gerakanmu sampai tanda itu hilang.",
    ],
  },
  rule_switch: {
    steps: [
      "Ikuti aturan yang sedang aktif: warna, bentuk, atau ukuran.",
      "Ketuk kartu yang cocok dengan aturan itu.",
      "Hati-hati — aturannya bisa berubah mendadak!",
    ],
  },
  spice_stall: {
    steps: [
      "Dengarkan dan perhatikan pesanan pelanggan.",
      "Ingat urutan bahannya baik-baik.",
      "Racik dengan urutan yang sama sebelum waktunya habis.",
    ],
  },
  red_light: {
    steps: [
      "Lari terus saat lampu hijau.",
      "Begitu lampu merah, berhenti total!",
      "Kalau masih bergerak saat merah, ronde diulang.",
    ],
  },
  courier_map: {
    steps: [
      "Antarkan paket ke bendera 🏁.",
      "Ketuk titik jalan untuk menggerakkan kurir.",
      "Ikuti aturan jalan yang aktif — jangan lewat air, pos biru, atau tol!",
      "Hati-hati, aturannya bisa berubah di tengah jalan.",
    ],
  },
  lighthouse_keeper: {
    steps: [
      "Perhatikan urutan warna yang menyala di mercusuar.",
      "Ingat baik-baik urutannya.",
      "Ulangi dengan mengetuk kaca pelita dengan warna yang sama.",
    ],
  },
  sushi_express: {
    steps: [
      "Lihat pesanan sushi di atas.",
      "Ketuk piring yang cocok saat lewat di ban berjalan.",
      "Jangan ketuk piring yang salah, dan jangan sampai pesanan lewat!",
    ],
  },
  crystal_palace: {
    steps: [
      "Lihat contoh kristal di tengah halaman.",
      "Ketuk kristal di taman yang warnanya sama.",
      "Kristal yang beda jangan diketuk — kumpulkan semua yang cocok!",
    ],
  },
};

export const HOWTO_FALLBACK: { steps: string[] } = {
  steps: [
    "Ikuti petunjuk di layar.",
    "Ketuk jawaban yang benar.",
    "Kumpulkan poin sebanyak-banyaknya!",
  ],
};

export function howToFor(gameKey: string): { steps: string[] } {
  return GAME_HOWTO[gameKey] ?? HOWTO_FALLBACK;
}
