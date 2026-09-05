"use client";

import type { LandingContent } from "./types";

const CONTENT: Record<"en" | "id", LandingContent> = {
  en: {
    navBrand: "Cognitive Training",
    navHowItWorks: "How it works",
    navGames: "Games",
    navParents: "For parents",
    navFaq: "FAQ",
    langToggle: "Bahasa Indonesia",
    langToggleLabel: "Switch language",
    heroBadge: "For kids ages 7–12 · Plays right in the browser",
    heroTitle: "Screen time you can finally feel good about",
    heroTitleHighlight: "feel good about",
    heroSubtitle:
      "Six adaptive 10-minute games that train your child's focus, memory, and thinking speed — plus progress reports in plain language. No psychology degree required.",
    ctaStart: "Create a free account",
    ctaHow: "See how it works",
    ctaDashboard: "Go to dashboard",
    ctaSignIn: "Sign in",
    trustItems: ["No app install", "No ads", "Your child's data stays yours"],
    stats: [
      { value: "6", label: "Adaptive games" },
      { value: "5", label: "Core skills" },
      { value: "D1–D10", label: "Difficulty levels" },
      { value: "±10 min", label: "Per session" },
    ],
    parentsEyebrow: "For parents",
    parentsTitle: "Understand your child without becoming a psychologist",
    parentsSubtitle:
      "Every session is logged neatly and summarized in human language.",
    parentsBullets: [
      {
        icon: "chart",
        title: "Reports you'll actually read",
        body: "Trend charts per skill — going up, steady, or needs attention. No IQ scores, no scary labels.",
      },
      {
        icon: "calendar",
        title: "Just 10 minutes a day",
        body: "Short sessions that fit before school or after dinner. Easy habit, zero nagging.",
      },
      {
        icon: "shield",
        title: "You're in control",
        body: "Consent stays with parents. Download or permanently delete your child's data anytime.",
      },
      {
        icon: "users",
        title: "Honest boundaries",
        body: "This is practice, not a diagnosis. If something worries you, we point you to a professional.",
      },
    ],
    reportMockTitle: "Report · Nadia",
    reportMockWeek: "This week",
    reportMockRows: [
      { label: "Working memory", value: 72, color: "#3b63c9" },
      { label: "Attention", value: 58, color: "#7a52c8" },
      { label: "Processing speed", value: 81, color: "#d9821b" },
    ],
    reportMockNote: "Sample view — not a diagnosis.",
    kidsEyebrow: "For kids",
    kidsTitle: "Feels like playing, not testing",
    kidsSubtitle:
      "No answer sheets, no red marks. Just colorful games that level up with them.",
    kidsCards: [
      {
        icon: "play",
        title: "Games, not questions",
        body: "Tap, remember, react — everything happens through playful games, never worksheets.",
      },
      {
        icon: "palette",
        title: "Their own style",
        body: "Pick a theme, turn on sounds, choose a favorite mascot to keep the streak alive.",
      },
      {
        icon: "clock",
        title: "Tired? Take a break",
        body: "Sessions can pause anytime. No punishment, no failing grades — progress is always saved.",
      },
    ],
    howEyebrow: "Up and running in 5 minutes",
    howTitle: "From signup to training plan",
    howIntro:
      "One browser-based journey from your first visit to a personalized plan.",
    steps: [
      {
        title: "Sign up as a parent",
        body: "One account for the whole family. Just an email and a password.",
      },
      {
        title: "Add your child",
        body: "Name and birth month is enough. Each child gets their own progress.",
      },
      {
        title: "Play a short baseline",
        body: "Your child plays a few quick games so the system learns their starting point.",
      },
      {
        title: "Get an automatic plan",
        body: "Games and levels are picked to match your child's skill and play habits.",
      },
      {
        title: "Follow the dashboard",
        body: "Check weekly trends and celebrate small wins together.",
      },
    ],
    gamesEyebrow: "Game collection",
    gamesTitle: "Six games, five core skills",
    gamesIntro:
      "Each game has 10 levels (D1–D10) that move up and down with your child's ability.",
    gamesLevelLabel: "Levels D1–D10",
    gamesAdaptiveLabel: "Adaptive",
    gamesHowToPlay: "How to play",
    gameHints: {
      memory_matrix:
        "Watch the glowing tiles, wait for the pause, then tap them back in the same order.",
      target_watch:
        "Keep your eyes on the stream of symbols — tap only when the target appears.",
      quick_match:
        "Memorize the target symbol, then find its match as fast as you can before time runs out.",
      stop_signal:
        "Tap along with the arrow as fast as you can — but cancel the move when the stop signal flashes.",
      rule_switch:
        "Match cards by the active rule — careful, the rule can switch without warning!",
      spice_stall:
        "Memorize the customer's order, then rebuild it in the same order before time runs out.",
      red_light:
        "Run as fast as you can on green — but freeze completely when the light turns red!",
      courier_map:
        "Tap the map to deliver the package, following the active dispatch rules to the flag.",
      lighthouse_keeper:
        "Watch the lighthouse flash its colours, then repeat the exact sequence on the lantern panes.",
      sushi_express:
        "Tap the sushi plates that match the customer's order as they ride past on the belt.",
      crystal_palace:
        "Spot every crystal in the courtyard that matches the target's colour and cut.",
    },
    faqEyebrow: "Questions?",
    faqTitle: "Parents usually ask",
    faqSubtitle: "Straight answers, no fine print.",
    faqs: [
      {
        q: "Is this an IQ test or a diagnostic tool?",
        a: "No. This is practice media. Scores here describe how your child performs in the games — not their intelligence or any medical condition. If you're concerned about their development, talk to a psychologist or pediatrician.",
      },
      {
        q: "How long is each daily session?",
        a: "Around 10 minutes per session. Your child can stop anytime — progress is always saved.",
      },
      {
        q: "Does it work on phones?",
        a: "Yes. Everything runs in a modern browser — phones, tablets, or laptops. Nothing to install.",
      },
      {
        q: "Should I sit with my child?",
        a: "For the first session, it's a good idea — you'll both learn the ropes. Once they're comfortable, they can play on their own.",
      },
      {
        q: "How is my child's data protected?",
        a: "We only store what's needed to run the training. The data is yours: download it or delete it permanently from the dashboard at any time.",
      },
      {
        q: "Any violence, ads, or addictive tricks?",
        a: "None. No ads, no chats with strangers, and no mechanics designed to keep kids hooked. Sessions end on their own.",
      },
    ],
    safetyTitle: "Safe for kids, peace of mind for parents",
    safetyIntro: "Our language and design follow clear boundaries for children.",
    safetyItems: [
      "Performance first — training is not a diagnosis.",
      "No shame, fear, or manipulative mechanics.",
      "Parent-run consent and full data control.",
      "Minimal data collection, versioned and audited.",
    ],
    disclaimerTitle: "Important disclaimer",
    disclaimerBody:
      "This platform provides training and practice, not medical or psychological diagnosis. Scores are estimates of task performance and vary with motivation, devices, and practice. Progress reports may reflect practice effects. If you have health or learning concerns, consult a qualified professional.",
    ctaBottomTitle: "Ready to turn screen time into quality time?",
    ctaBottomBody:
      "Create a free account, add your child's profile, and start the baseline today.",
    footerRights: "© 2026 Cognitive Training Platform",
    footerPrivacy: "Privacy",
    footerTagline: "Made with care for families.",
  },
  id: {
    navBrand: "Pelatihan Kognitif",
    navHowItWorks: "Cara main",
    navGames: "Permainan",
    navParents: "Untuk Ortu",
    navFaq: "Tanya jawab",
    langToggle: "English",
    langToggleLabel: "Ganti bahasa",
    heroBadge: "Untuk anak usia 7–12 · Langsung main di browser",
    heroTitle: "Screen time yang akhirnya bikin orang tua tenang",
    heroTitleHighlight: "bikin orang tua tenang",
    heroSubtitle:
      "6 game adaptif berdurasi 10 menit untuk melatih fokus, daya ingat, dan kecepatan berpikir anak — plus laporan perkembangan yang gampang dipahami. Tanpa istilah psikologi yang bikin pusing.",
    ctaStart: "Buat akun gratis",
    ctaHow: "Lihat cara kerja",
    ctaDashboard: "Ke dashboard",
    ctaSignIn: "Masuk",
    trustItems: ["Tanpa instal aplikasi", "Tanpa iklan", "Data anak tetap milikmu"],
    stats: [
      { value: "6", label: "Game adaptif" },
      { value: "5", label: "Kemampuan inti" },
      { value: "D1–D10", label: "Level kesulitan" },
      { value: "±10 mnt", label: "Per sesi" },
    ],
    parentsEyebrow: "Untuk orang tua",
    parentsTitle: "Paham perkembangan anak tanpa perlu jadi psikolog",
    parentsSubtitle:
      "Setiap sesi tercatat rapi dan diringkas pakai bahasa manusia.",
    parentsBullets: [
      {
        icon: "chart",
        title: "Laporan yang benar-benar dibaca",
        body: "Grafik tren per kemampuan — lagi naik, stabil, atau perlu perhatian. Tanpa skor IQ, tanpa label menakutkan.",
      },
      {
        icon: "calendar",
        title: "Cukup 10 menit sehari",
        body: "Sesi singkat yang gampang diselipkan sebelum sekolah atau setelah makan malam. Jadi kebiasaan, tanpa drama.",
      },
      {
        icon: "shield",
        title: "Kamu yang pegang kendali",
        body: "Persetujuan selalu di tangan orang tua. Unduh atau hapus permanen data anak kapan saja.",
      },
      {
        icon: "users",
        title: "Jujur soal batasan",
        body: "Ini media latihan, bukan alat diagnosis. Kalau ada yang mengkhawatirkan, kami arahkan ke profesional.",
      },
    ],
    reportMockTitle: "Laporan · Nadia",
    reportMockWeek: "Minggu ini",
    reportMockRows: [
      { label: "Memori kerja", value: 72, color: "#3b63c9" },
      { label: "Atensi", value: 58, color: "#7a52c8" },
      { label: "Kecepatan proses", value: 81, color: "#d9821b" },
    ],
    reportMockNote: "Contoh tampilan — bukan diagnosis.",
    kidsEyebrow: "Untuk anak",
    kidsTitle: "Rasanya main, bukan ujian",
    kidsSubtitle:
      "Tanpa lembar soal, tanpa nilai merah. Cuma game warna-warni yang naik level bareng mereka.",
    kidsCards: [
      {
        icon: "play",
        title: "Game, bukan soal",
        body: "Ketuk, ingat, bereaksi — semuanya lewat permainan yang seru, bukan lembar jawaban.",
      },
      {
        icon: "palette",
        title: "Bisa pilih gaya sendiri",
        body: "Ganti tema, nyalakan suara, pilih maskot favorit biar makin semangat beruntun.",
      },
      {
        icon: "clock",
        title: "Capek? Istirahat dulu",
        body: "Sesi bisa dijeda kapan saja. Tanpa hukuman, tanpa nilai jelek — progres selalu tersimpan.",
      },
    ],
    howEyebrow: "Siap dalam 5 menit",
    howTitle: "Dari daftar sampai rencana latihan",
    howIntro:
      "Satu perjalanan berbasis browser dari kunjungan pertama sampai rencana personal.",
    steps: [
      {
        title: "Daftar sebagai orang tua",
        body: "Satu akun untuk seluruh keluarga. Cukup email dan kata sandi.",
      },
      {
        title: "Buatkan profil anak",
        body: "Nama dan bulan lahir saja cukup. Tiap anak punya progres sendiri-sendiri.",
      },
      {
        title: "Ikut asesmen awal yang singkat",
        body: "Anak main beberapa game pendek biar sistem tahu titik awalnya.",
      },
      {
        title: "Dapat rencana latihan otomatis",
        body: "Game dan level dipilihkan sesuai kemampuan dan kebiasaan main anak.",
      },
      {
        title: "Pantau dari dashboard",
        body: "Lihat tren tiap minggu dan rayakan pencapaian kecil bareng anak.",
      },
    ],
    gamesEyebrow: "Koleksi permainan",
    gamesTitle: "6 game, 5 kemampuan inti",
    gamesIntro:
      "Tiap game punya 10 level (D1–D10) yang naik-turun mengikuti kemampuan anak.",
    gamesLevelLabel: "Level D1–D10",
    gamesAdaptiveLabel: "Adaptif",
    gamesHowToPlay: "Cara main",
    gameHints: {
      memory_matrix:
        "Perhatikan ubin yang menyala, tunggu jeda sebentar, lalu ketuk lagi dengan urutan yang sama.",
      target_watch:
        "Tetap perhatikan aliran simbol — ketuk hanya saat simbol target muncul.",
      quick_match:
        "Hafalkan simbol target, lalu temukan pasangannya secepat mungkin sebelum waktu habis.",
      stop_signal:
        "Ketuk mengikuti arah panah secepat mungkin — tapi batalkan gerakanmu saat sinyal berhenti muncul.",
      rule_switch:
        "Cocokkan kartu mengikuti aturan yang aktif — hati-hati, aturannya bisa berganti tiba-tiba!",
      spice_stall:
        "Ingat pesanan pelanggan, lalu racik dengan urutan yang sama sebelum waktunya habis.",
      red_light:
        "Lari sekencang mungkin saat lampu hijau — tapi membeku total saat lampu berubah merah!",
      courier_map:
        "Ketuk peta untuk mengantar paket ke bendera, mengikuti aturan yang sedang aktif.",
      lighthouse_keeper:
        "Perhatikan pancaran warna mercusuar, lalu ulangi urutannya di kaca pelita.",
      sushi_express:
        "Ketuk piring sushi yang sesuai pesanan saat lewat di ban berjalan.",
      crystal_palace:
        "Temukan semua kristal di taman yang cocok dengan warna dan potongan contohnya.",
    },
    faqEyebrow: "Masih ragu?",
    faqTitle: "Yang sering ditanyakan orang tua",
    faqSubtitle: "Jawaban jujur, tanpa bahasa berbelit.",
    faqs: [
      {
        q: "Apakah ini tes IQ atau alat diagnosis?",
        a: "Bukan. Ini media latihan. Skor di sini menggambarkan performa anak dalam game — bukan kecerdasan atau kondisi medisnya. Kalau kamu khawatir soal tumbuh kembang anak, konsultasikan ke psikolog atau dokter anak.",
      },
      {
        q: "Berapa lama durasi main tiap hari?",
        a: "Sekitar 10 menit per sesi. Anak boleh berhenti kapan saja — progres selalu tersimpan.",
      },
      {
        q: "Bisa dimainkan di HP?",
        a: "Bisa. Semua jalan di browser modern — HP, tablet, maupun laptop. Tanpa instal aplikasi apa pun.",
      },
      {
        q: "Apakah anak harus didampingi?",
        a: "Untuk sesi pertama, sebaiknya iya — biar sama-sama paham cara mainnya. Setelah terbiasa, anak bisa main mandiri.",
      },
      {
        q: "Bagaimana data anak saya dilindungi?",
        a: "Kami hanya menyimpan yang benar-benar perlu untuk menjalankan latihan. Datanya milikmu: bisa diunduh atau dihapus permanen dari dashboard kapan saja.",
      },
      {
        q: "Ada unsur kekerasan, iklan, atau trik bikin ketagihan?",
        a: "Tidak ada. Tanpa iklan, tanpa chat dengan orang asing, dan tanpa mekanik yang dirancang bikin anak terus-terusan nempel. Sesi berakhir dengan sendirinya.",
      },
    ],
    safetyTitle: "Aman untuk anak, tenang untuk orang tua",
    safetyIntro: "Bahasa dan desain kami mengikuti batas yang jelas untuk anak.",
    safetyItems: [
      "Performa dulu — pelatihan bukan diagnosis.",
      "Tanpa rasa malu, takut, atau mekanik manipulatif.",
      "Persetujuan di tangan orang tua dan kendali data penuh.",
      "Pengumpulan data minimal, berversi dan teraudit.",
    ],
    disclaimerTitle: "Pernyataan penting",
    disclaimerBody:
      "Platform ini menyediakan pelatihan dan latihan, bukan diagnosis medis atau psikologis. Skor adalah estimasi performa tugas dan bervariasi sesuai motivasi, perangkat, dan latihan. Laporan perkembangan dapat mencerminkan efek latihan. Jika ada kekhawatiran kesehatan atau pembelajaran, konsultasikan dengan tenaga profesional.",
    ctaBottomTitle: "Siap mengubah screen time jadi waktu berkualitas?",
    ctaBottomBody:
      "Buat akun gratis, tambahkan profil anak, dan mulai asesmen awal hari ini.",
    footerRights: "© 2026 Platform Pelatihan Kognitif",
    footerPrivacy: "Privasi",
    footerTagline: "Dibuat dengan hati untuk keluarga.",
  },
};

export default CONTENT;
