/**
 * Shared game metadata + per-game identity hues.
 * Each game owns one hue so every surface stays consistent and calm.
 * The 5 classic games hold the original hue spread; flagship families
 * (starting with Spice Stall) get their own distinct hues.
 */

export interface GameMeta {
  key: string;
  name: string;
  domain: string;
  domainKey: string;
  /** classic = measurement anchor, flagship = kid-friendly wrap */
  family: "classic" | "flagship";
  /** identity hue */
  color: string;
  /** soft tint of the identity hue (backgrounds, chips) */
  tint: string;
  /** slightly deeper tone for text on tint */
  deep: string;
  description: string;
  defaultDifficulty: number;
  /** Trials per round for this game (defaults to 20 when absent) */
  roundTrials?: number;
}

export const GAMES: GameMeta[] = [
  {
    key: "memory_matrix",
    name: "Memory Matrix",
    domain: "Memori Kerja",
    domainKey: "working_memory",
    family: "classic",
    color: "#3b63c9",
    tint: "#e8edfa",
    deep: "#2c4aa8",
    description: "Ingat posisi ubin yang menyala, lalu tirukan polanya.",
    defaultDifficulty: 4,
  },
  {
    key: "target_watch",
    name: "Target Watch",
    domain: "Atensi Berkelanjutan",
    domainKey: "sustained_attention",
    family: "classic",
    color: "#7a52c8",
    tint: "#f1ebfa",
    deep: "#5d36ab",
    description: "Perhatikan aliran simbol — ketuk hanya saat target muncul.",
    defaultDifficulty: 4,
  },
  {
    key: "quick_match",
    name: "Quick Match",
    domain: "Kecepatan Proses",
    domainKey: "processing_speed",
    family: "classic",
    color: "#d9821b",
    tint: "#fbf0e1",
    deep: "#b5680f",
    description: "Ingat simbolnya lalu temukan pasangannya — sebelum waktu habis.",
    defaultDifficulty: 4,
  },
  {
    key: "stop_signal",
    name: "Stop Signal",
    domain: "Kontrol Inhibisi",
    domainKey: "inhibitory_control",
    family: "classic",
    color: "#d64545",
    tint: "#fbeae8",
    deep: "#b03030",
    description: "Ketuk arah panah dengan cepat — tapi jangan gerak saat sinyal berhenti.",
    defaultDifficulty: 4,
  },
  {
    key: "rule_switch",
    name: "Rule Switch",
    domain: "Fleksibilitas Kognitif",
    domainKey: "cognitive_flexibility",
    family: "classic",
    color: "#0f9d6e",
    tint: "#e3f3ec",
    deep: "#0b7d57",
    description: "Aturannya terus berganti — cocokkan berdasarkan warna, bentuk, atau ukuran.",
    defaultDifficulty: 4,
  },
  {
    key: "spice_stall",
    name: "Spice Stall",
    domain: "Memori Kerja",
    domainKey: "working_memory",
    family: "flagship",
    color: "#c2437f",
    tint: "#fae9f1",
    deep: "#a02f64",
    description: "Ingat pesanan pelanggan, lalu racik dengan urutan yang sama.",
    defaultDifficulty: 4,
  },
  {
    key: "red_light",
    name: "Lampu Merah",
    domain: "Kontrol Inhibisi",
    domainKey: "inhibitory_control",
    family: "flagship",
    color: "#2f80ed",
    tint: "#e9f1fd",
    deep: "#1f5fb8",
    description: "Lari kencang saat lampu hijau — tapi membeku total saat lampu merah!",
    defaultDifficulty: 4,
  },
  {
    key: "courier_map",
    name: "Kurir Peta",
    domain: "Fleksibilitas Kognitif",
    domainKey: "cognitive_flexibility",
    family: "flagship",
    color: "#2fa05a",
    tint: "#e3f4e8",
    deep: "#1d6e3e",
    description: "Antar paket ke bendera mengikuti aturan yang aktif.",
    defaultDifficulty: 4,
  },
  {
    key: "lighthouse_keeper",
    name: "Penjaga Mercusuar",
    domain: "Memori Kerja",
    domainKey: "working_memory",
    family: "flagship",
    color: "#0e9aa7",
    tint: "#e1f4f5",
    deep: "#0b7d88",
    description: "Lihat pancaran cahaya mercusuar, lalu ulangi urutannya di kaca pelita.",
    defaultDifficulty: 4,
  },
  {
    key: "sushi_express",
    name: "Sushi Express",
    domain: "Kecepatan Proses",
    domainKey: "processing_speed",
    family: "flagship",
    color: "#e0a126",
    tint: "#fbf2dd",
    deep: "#b57f14",
    description: "Tangkap piring sushi yang dipesan dari ban berjalan — jangan sampai lewat!",
    defaultDifficulty: 4,
  },
  {
    key: "crystal_palace",
    name: "Istana Kristal",
    domain: "Spatial Visual",
    domainKey: "visual_spatial",
    family: "flagship",
    color: "#4cc3d9",
    tint: "#e3f6fa",
    deep: "#2a9cb3",
    description: "Temukan semua kristal yang cocok dengan contoh di halaman istana.",
    defaultDifficulty: 4,
  },
    {
      key: "train_n_back",
      roundTrials: 20,
      name: "Kereta N-Back",
      domain: "Memori Kerja",
      domainKey: "working_memory",
      family: "flagship",
      color: "#c95d2f",
      tint: "#fbeadd",
      deep: "#8f3f16",
      description: "Gerbong lewat satu per satu — bunyikan lonceng saat buahnya sama dengan gerbong sebelumnya!",
      defaultDifficulty: 4,
    },
    {
      key: "dual_garden",
      roundTrials: 16,
      name: "Kebun Dua Arus",
      domain: "Atensi Terbagi",
      domainKey: "sustained_attention",
      family: "flagship",
      color: "#3f9d4e",
      tint: "#e6f5e9",
      deep: "#226b30",
      description: "Hewan melintas di atas, buah jatuh di bawah — tandai hanya saat keduanya sesuai target!",
      defaultDifficulty: 4,
    },
    {
      key: "crystal_tower",
      roundTrials: 3,
      name: "Menara Kristal",
      domain: "Fleksibilitas Kognitif",
      domainKey: "cognitive_flexibility",
      family: "flagship",
      color: "#7a52c8",
      tint: "#efe9fb",
      deep: "#4f2f96",
      description: "Pindahkan kristal ke menara tujuan — rencanakan langkahmu sebelum waktu habis.",
      defaultDifficulty: 4,
    },
    {
      key: "wide_view",
      roundTrials: 12,
      name: "Binocular",
      domain: "Atensi Terbagi",
      domainKey: "sustained_attention",
      family: "flagship",
      color: "#2f7fc9",
      tint: "#e7f1fb",
      deep: "#1c5490",
      description: "Sambil mengawasi simbol di tengah, tangkap posisi burung yang berkedip di tepi layar.",
      defaultDifficulty: 4,
    }
];

export function gameMeta(key: string): GameMeta {
  return GAMES.find((g) => g.key === key) ?? GAMES[0];
}
