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
  train_n_back: {
    steps: [
      "Perhatikan buah di tiap gerbong kereta 🚂.",
      "Bunyikan lonceng 🔔 kalau buahnya sama dengan gerbong sebelumnya!",
      "Kalau buahnya beda, diam saja — jangan bunyikan lonceng.",
    ],
  },
  dual_garden: {
    steps: [
      "Hewan melintas di jembatan atas, buah jatuh di bawah.",
      "Ketuk Tandai 🚩 hanya kalau keduanya sesuai target di banner.",
      "Kalau salah satunya beda, diam dulu ya!",
    ],
  },
  crystal_tower: {
    steps: [
      "Ketuk menara untuk mengangkat kristal di paling atas.",
      "Ketuk menara lain untuk menaruhnya — kristal besar tak boleh di atas yang kecil.",
      "Antar semua kristal ke menara kanan sebelum langkah habis!",
    ],
  },
  wide_view: {
    steps: [
      "Awasi simbol di kotak tengah layar.",
      "Burung 🐦 akan berkedip sebentar di sekeliling layar — ingat posisinya!",
      "Setelah itu, ketuk posisi burung yang tadi muncul.",
    ],
  }
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
