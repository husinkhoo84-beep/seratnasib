/* Ramalan engine: perhitungan murni tanpa DOM.
   Semua fungsi menerima tanggal sebagai {y, m, d} (bulan 1-12) dan jam opsional (0-23). */
(function (root) {
  "use strict";

  // ---------- Utilitas tanggal ----------
  function jdn(y, m, d) { // Julian Day Number (kalender Gregorian)
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function mod(n, m) { return ((n % m) + m) % m; }
  function digitSum(n) { return String(n).split("").reduce(function (s, c) { return s + (+c || 0); }, 0); }
  function reduceNum(n, keepMaster) {
    while (n > 9) {
      if (keepMaster && (n === 11 || n === 22 || n === 33)) return n;
      n = digitSum(n);
    }
    return n;
  }

  // ---------- Kalimat yang diterjemahkan ----------
  var S = {
    el: { Kayu: "Kayu", Api: "Api", Tanah: "Tanah", Logam: "Logam", Air: "Air" },
    pilar: { y: "Tahun", m: "Bulan", d: "Hari", h: "Jam" },
    benMing: "Tahun shio Anda sendiri (Ben Ming Nian). Tradisi menganjurkan lebih berhati-hati dan memakai warna merah.",
    selaras: "Tahun ini selaras dengan shio Anda. Saat yang baik untuk mengambil langkah penting.",
    ciong: "Tahun ini berbenturan (ciong) dengan shio Anda. Hindari keputusan terburu-buru.",
    netral: "Tahun ini netral untuk shio Anda. Hasil sangat bergantung pada usaha sendiri."
  };
  function elT(e) { return S.el[e] || e; }
  function salin(o, ubah) { var r = {}; Object.keys(o).forEach(function (k) { r[k] = o[k]; }); Object.keys(ubah).forEach(function (k) { r[k] = ubah[k]; }); return r; }

  // ---------- 1. Zodiak barat ----------
  var ZODIAK = [
    // [nama, simbol, mulai bulan, mulai hari, elemen, planet, sifat, cinta, karier, angka keberuntungan, warna]
    { id: "Capricorn", n: "Capricorn", s: "♑", m: 12, d: 22, el: "Tanah", pl: "Saturnus", sifat: "Disiplin, sabar, dan ambisius. Anda membangun sesuatu pelan-pelan tapi kokoh, dan jarang menyerah sebelum tujuan tercapai.", cinta: "Setia dan serius. Butuh waktu untuk membuka diri, tetapi sekali berkomitmen Anda menjadi pasangan yang bisa diandalkan.", karier: "Cocok di manajemen, keuangan, hukum, atau bisnis keluarga. Kemajuan karier biasanya stabil dan menanjak seiring usia.", cocok: "Taurus, Virgo, Scorpio, Pisces", warna: "Cokelat tua, abu-abu" },
    { id: "Aquarius", n: "Aquarius", s: "♒", m: 1, d: 20, el: "Udara", pl: "Uranus", sifat: "Mandiri, orisinal, dan berpikiran maju. Anda suka ide baru dan peduli pada kepentingan banyak orang.", cinta: "Butuh pasangan yang juga sahabat dan memberi ruang kebebasan. Hubungan yang terlalu mengekang membuat Anda menjauh.", karier: "Cocok di teknologi, riset, kegiatan sosial, dan bidang kreatif yang tidak biasa.", cocok: "Gemini, Libra, Aries, Sagitarius", warna: "Biru elektrik, perak" },
    { id: "Pisces", n: "Pisces", s: "♓", m: 2, d: 19, el: "Air", pl: "Neptunus", sifat: "Peka, imajinatif, dan penuh empati. Intuisi Anda kuat dan mudah merasakan suasana hati orang lain.", cinta: "Romantis dan rela berkorban. Perlu belajar menjaga batas agar tidak kehilangan diri sendiri.", karier: "Cocok di seni, musik, kesehatan, konseling, dan pekerjaan spiritual atau sosial.", cocok: "Cancer, Scorpio, Taurus, Capricorn", warna: "Hijau laut, ungu muda" },
    { id: "Aries", n: "Aries", s: "♈", m: 3, d: 21, el: "Api", pl: "Mars", sifat: "Berani, energik, dan suka memimpin. Anda cepat bertindak dan senang tantangan baru.", cinta: "Bergairah dan terus terang. Perlu pasangan yang bisa mengimbangi energi dan tidak mudah tersinggung.", karier: "Cocok sebagai wirausaha, pemimpin tim, atlet, atau pekerjaan yang menuntut keputusan cepat.", cocok: "Leo, Sagitarius, Gemini, Aquarius", warna: "Merah" },
    { id: "Taurus", n: "Taurus", s: "♉", m: 4, d: 20, el: "Tanah", pl: "Venus", sifat: "Tenang, setia, dan menyukai kenyamanan. Anda praktis, tekun, dan tidak suka terburu-buru.", cinta: "Sangat setia dan penuh perhatian lewat tindakan nyata. Rasa aman adalah hal utama dalam hubungan.", karier: "Cocok di keuangan, properti, kuliner, pertanian, dan seni yang menghasilkan karya nyata.", cocok: "Virgo, Capricorn, Cancer, Pisces", warna: "Hijau, merah muda" },
    { id: "Gemini", n: "Gemini", s: "♊", m: 5, d: 21, el: "Udara", pl: "Merkurius", sifat: "Cerdas, komunikatif, dan serba ingin tahu. Anda mudah beradaptasi dan pandai bergaul.", cinta: "Butuh pasangan yang enak diajak ngobrol dan tidak membosankan.", karier: "Cocok di media, pemasaran, penjualan, pendidikan, dan penulisan.", cocok: "Libra, Aquarius, Aries, Leo", warna: "Kuning" },
    { id: "Cancer", n: "Cancer", s: "♋", m: 6, d: 21, el: "Air", pl: "Bulan", sifat: "Penyayang, protektif, dan sangat menghargai keluarga. Perasaan Anda dalam dan ingatan Anda kuat.", cinta: "Hangat dan mengayomi. Anda mencari hubungan yang terasa seperti rumah.", karier: "Cocok di bidang perawatan, pendidikan, kuliner, properti, dan layanan pelanggan.", cocok: "Scorpio, Pisces, Taurus, Virgo", warna: "Putih, perak" },
    { id: "Leo", n: "Leo", s: "♌", m: 7, d: 23, el: "Api", pl: "Matahari", sifat: "Percaya diri, murah hati, dan karismatik. Anda suka tampil dan memberi semangat pada orang lain.", cinta: "Setia dan dermawan. Anda ingin dihargai dan dibanggakan pasangan.", karier: "Cocok di hiburan, kepemimpinan, politik, dan pekerjaan yang membuat Anda tampil di depan.", cocok: "Aries, Sagitarius, Gemini, Libra", warna: "Emas, oranye" },
    { id: "Virgo", n: "Virgo", s: "♍", m: 8, d: 23, el: "Tanah", pl: "Merkurius", sifat: "Teliti, analitis, dan suka membantu. Anda rapi, praktis, dan berstandar tinggi.", cinta: "Menunjukkan cinta lewat perhatian kecil dan bantuan nyata. Kadang terlalu kritis.", karier: "Cocok di kesehatan, analisis data, akuntansi, editing, dan riset.", cocok: "Taurus, Capricorn, Cancer, Scorpio", warna: "Hijau zaitun, krem" },
    { id: "Libra", n: "Libra", s: "♎", m: 9, d: 23, el: "Udara", pl: "Venus", sifat: "Adil, diplomatis, dan menyukai keindahan. Anda pandai menjaga harmoni.", cinta: "Romantis dan ingin hubungan yang seimbang. Sulit memutuskan sendiri tanpa pertimbangan pasangan.", karier: "Cocok di hukum, desain, diplomasi, HR, dan seni.", cocok: "Gemini, Aquarius, Leo, Sagitarius", warna: "Biru muda, merah muda" },
    { id: "Scorpio", n: "Scorpio", s: "♏", m: 10, d: 23, el: "Air", pl: "Pluto", sifat: "Intens, tegas, dan penuh rahasia. Anda punya tekad besar dan intuisi tajam.", cinta: "Sangat setia dan mendalam, tetapi bisa cemburu. Kepercayaan adalah segalanya.", karier: "Cocok di investigasi, psikologi, kedokteran, keuangan, dan riset.", cocok: "Cancer, Pisces, Virgo, Capricorn", warna: "Merah marun, hitam" },
    { id: "Sagitarius", n: "Sagitarius", s: "♐", m: 11, d: 22, el: "Api", pl: "Jupiter", sifat: "Optimis, jujur, dan suka petualangan. Anda haus ilmu dan senang menjelajah.", cinta: "Butuh pasangan yang mau diajak berpetualang dan menghargai kebebasan.", karier: "Cocok di pendidikan, perjalanan, penerbitan, hukum, dan bisnis internasional.", cocok: "Aries, Leo, Libra, Aquarius", warna: "Ungu, biru tua" }
  ];
  function zodiak(dt) {
    var md = dt.m * 100 + dt.d, pick = ZODIAK[0];
    // urutkan berdasar tanggal mulai dalam setahun (Jan..Des)
    var sorted = ZODIAK.slice(1).concat([ZODIAK[0]]); // Aquarius(1/20) ... Capricorn(12/22)
    pick = ZODIAK[0];
    for (var i = 0; i < sorted.length; i++) if (md >= sorted[i].m * 100 + sorted[i].d) pick = sorted[i];
    if (md < 120) pick = ZODIAK[0];
    return pick;
  }

  // ---------- 2. Power of number (angka jalan hidup) ----------
  var ANGKA = {
    1: { judul: "Sang Pemimpin", isi: "Mandiri, berani memulai, dan punya visi. Tantangan Anda adalah belajar bekerja sama dan tidak keras kepala." },
    2: { judul: "Sang Penengah", isi: "Peka, sabar, dan diplomatis. Anda kuat dalam kerja sama dan menjaga keharmonisan, tetapi perlu lebih percaya diri." },
    3: { judul: "Sang Komunikator", isi: "Kreatif, ceria, dan ekspresif. Bakat Anda ada pada kata, seni, dan menghibur orang. Jaga fokus agar bakat tidak tercecer." },
    4: { judul: "Sang Pembangun", isi: "Pekerja keras, teratur, dan dapat dipercaya. Anda membangun fondasi yang kuat. Belajarlah lebih fleksibel terhadap perubahan." },
    5: { judul: "Sang Petualang", isi: "Bebas, serba bisa, dan suka hal baru. Hidup Anda penuh perubahan dan pengalaman. Disiplin adalah kunci keberhasilan Anda." },
    6: { judul: "Sang Pengasuh", isi: "Penuh tanggung jawab, penyayang, dan peduli keluarga. Anda sering menjadi tempat bersandar. Jangan lupa merawat diri sendiri." },
    7: { judul: "Sang Pencari", isi: "Analitis, introspektif, dan spiritual. Anda mencari kebenaran di balik segala hal. Butuh waktu menyendiri untuk mengisi energi." },
    8: { judul: "Sang Penguasa", isi: "Ambisius, berwibawa, dan berbakat mengelola uang serta kekuasaan. Keseimbangan antara materi dan batin adalah pelajaran Anda." },
    9: { judul: "Sang Humanis", isi: "Murah hati, bijak, dan berjiwa besar. Anda terpanggil membantu sesama. Belajarlah melepaskan masa lalu." },
    11: { judul: "Angka Master 11 · Sang Pencerah", isi: "Intuisi sangat tajam dan berbakat menginspirasi orang lain. Energinya besar, sehingga Anda perlu menjaga ketenangan batin." },
    22: { judul: "Angka Master 22 · Sang Arsitek", isi: "Mampu mewujudkan mimpi besar menjadi kenyataan. Visi luas dipadu kemampuan praktis. Tekanannya juga besar." },
    33: { judul: "Angka Master 33 · Sang Guru", isi: "Kasih sayang dan pengabdian tingkat tinggi. Anda dipanggil untuk menyembuhkan dan membimbing orang lain." }
  };
  function lifePath(dt) {
    // reduksi masing-masing bagian dulu, lalu jumlahkan (metode umum)
    var a = reduceNum(digitSum(dt.d), true), b = reduceNum(digitSum(dt.m), true), c = reduceNum(digitSum(dt.y), true);
    var total = a + b + c, lp = reduceNum(total, true);
    var now = new Date();
    var personalYear = reduceNum(reduceNum(dt.d) + reduceNum(dt.m) + reduceNum(digitSum(now.getFullYear())));
    var bulanP = reduceNum(personalYear + now.getMonth() + 1), hariP = reduceNum(bulanP + now.getDate());
    // puncak & tantangan (komponen direduksi ke satu digit)
    var md = reduceNum(dt.m), dd = reduceNum(dt.d), yd = reduceNum(digitSum(dt.y)), lpBase = reduceNum(lp);
    var p1 = reduceNum(md + dd, true), p2 = reduceNum(dd + yd, true), p3 = reduceNum(reduceNum(p1) + reduceNum(p2), true), p4 = reduceNum(md + yd, true);
    var akhir1 = 36 - lpBase;
    var puncak = [
      { n: p1, dari: 0, sampai: akhir1, tahun: dt.y }, { n: p2, dari: akhir1 + 1, sampai: akhir1 + 9 },
      { n: p3, dari: akhir1 + 10, sampai: akhir1 + 18 }, { n: p4, dari: akhir1 + 19, sampai: null }
    ];
    var usia = now.getFullYear() - dt.y - ((now.getMonth() + 1) * 100 + now.getDate() < dt.m * 100 + dt.d ? 1 : 0);
    puncak.forEach(function (p, i) { p.aktif = usia >= p.dari && (p.sampai === null || usia <= p.sampai); p.isi = PUNCAK[p.n]; p.ke = i + 1; });
    var c1 = Math.abs(md - dd), c2 = Math.abs(dd - yd), c3 = Math.abs(c1 - c2), c4 = Math.abs(md - yd);
    var tantangan = [c1, c2, c3, c4].map(function (n, i) { return { n: n, ke: i + 1, isi: TANTANGAN[n] }; });
    var sikap = reduceNum(dt.d + dt.m);
    return { angka: lp, rumus: a + " + " + b + " + " + c + " = " + total + (total !== lp ? " → " + lp : ""), info: ANGKA[lp], detail: LP_DETAIL[lp],
      tahunPersonal: personalYear, tahunIni: now.getFullYear(), hariLahir: reduceNum(dt.d, true),
      bulanPersonal: bulanP, bulanIsi: BULAN_PERSONAL[bulanP], bulanIni: now.getMonth() + 1, hariPersonal: hariP, hariKunci: KATA_KUNCI[hariP],
      usia: usia, puncak: puncak, tantangan: tantangan, sikap: sikap, sikapIsi: SIKAP[sikap] };
  }
  // Analisa mendalam angka jalan hidup
  var LP_DETAIL = {
    1: { kekuatan: "Berani mengambil keputusan, mandiri, kreatif dalam mencari jalan baru, dan punya daya dorong yang kuat. Anda sering menjadi orang pertama yang mencoba sesuatu.",
      kelemahan: "Mudah tidak sabar, sulit menerima bantuan, dan bisa terkesan egois atau keras kepala. Saat tertekan, Anda cenderung memikul semuanya sendirian.",
      cinta: "Anda butuh pasangan yang menghargai kemandirian Anda dan tidak merasa tersaingi. Anda setia dan protektif, tetapi perlu belajar mendengarkan dan berbagi kendali.",
      karier: "Paling bersinar saat memimpin atau bekerja dengan kebebasan penuh: wirausaha, manajer, perintis bisnis, desainer, konsultan, atau bidang yang menuntut inovasi.",
      uang: "Rezeki datang lewat inisiatif sendiri. Anda pandai menghasilkan uang tetapi kadang boros untuk ide baru. Sisihkan dana cadangan sebelum memulai proyek berikutnya.",
      kesehatan: "Energi tinggi membuat Anda lupa istirahat. Waspadai stres, sakit kepala, dan tekanan darah. Olahraga kompetitif menjadi penyaluran yang sehat.",
      misi: "Belajar memimpin dengan teladan, bukan dengan paksaan, dan membuka jalan agar orang lain ikut maju.",
      cocok: "1, 3, 5", sulit: "6, 8", hari: "Minggu", warna: "Merah, emas" },
    2: { kekuatan: "Peka, sabar, diplomatis, dan pandai membaca perasaan orang. Anda perekat dalam keluarga dan tim, serta penengah yang dipercaya.",
      kelemahan: "Mudah ragu, terlalu memikirkan pendapat orang, dan sulit berkata tidak. Perasaan yang dipendam bisa berubah menjadi kecewa.",
      cinta: "Anda pasangan yang lembut, romantis, dan penuh perhatian. Hubungan adalah pusat hidup Anda, jadi pilih pasangan yang juga mau memberi, bukan hanya menerima.",
      karier: "Cocok sebagai mediator, konselor, HRD, guru, perawat, diplomat, asisten pimpinan, musisi, atau dalam kemitraan bisnis yang saling melengkapi.",
      uang: "Keuangan paling stabil lewat kerja sama dan kemitraan. Anda hemat dan teliti, tetapi jangan mudah meminjamkan uang karena sungkan.",
      kesehatan: "Emosi sangat memengaruhi tubuh Anda. Jaga pencernaan dan kualitas tidur, dan cari waktu tenang untuk memulihkan diri dari keramaian.",
      misi: "Menjadi jembatan perdamaian dan belajar percaya bahwa kelembutan Anda juga sebuah kekuatan.",
      cocok: "2, 4, 8", sulit: "1, 5", hari: "Senin", warna: "Putih, perak, hijau muda" },
    3: { kekuatan: "Ekspresif, ceria, kreatif, dan pandai berkomunikasi. Anda membawa semangat ke mana pun dan mudah membuat orang tertawa.",
      kelemahan: "Mudah bosan, kurang fokus, dan kadang menghindari masalah dengan bercanda. Bakat yang banyak bisa tercecer jika tidak dikelola.",
      cinta: "Anda pasangan yang menyenangkan dan penuh kejutan. Anda butuh hubungan yang hidup, penuh obrolan, dan saling memuji. Kecemburuan membuat Anda menjauh.",
      karier: "Bersinar di dunia kata dan panggung: penulis, konten kreator, MC, pemasaran, desain, seni, mengajar, public relations, atau penjualan.",
      uang: "Uang mudah datang dan mudah pergi. Penghasilan dari kreativitas bisa besar, asalkan Anda membuat anggaran dan tidak belanja karena suasana hati.",
      kesehatan: "Jaga tenggorokan, kulit, dan pola makan. Suasana hati sangat berpengaruh, jadi tetap berkarya agar pikiran tidak murung.",
      misi: "Menginspirasi dan menghibur lewat karya, serta belajar menyelesaikan apa yang sudah dimulai.",
      cocok: "1, 5, 9", sulit: "4, 7", hari: "Kamis", warna: "Kuning, oranye" },
    4: { kekuatan: "Disiplin, jujur, teratur, dan pekerja keras. Anda membangun sesuatu dengan pondasi kuat, dan orang mempercayakan tanggung jawab besar kepada Anda.",
      kelemahan: "Kaku, terlalu serius, dan sulit menerima perubahan mendadak. Anda bisa terlalu keras pada diri sendiri dan orang lain.",
      cinta: "Anda setia, bisa diandalkan, dan menunjukkan cinta lewat tindakan nyata. Anda butuh pasangan yang menghargai komitmen dan rencana masa depan yang jelas.",
      karier: "Cocok di bidang yang butuh ketelitian dan sistem: teknik, arsitektur, akuntansi, perbankan, properti, IT, manajemen proyek, atau pemerintahan.",
      uang: "Anda penabung alami dan membangun kekayaan pelan tetapi pasti. Investasi jangka panjang seperti properti sangat cocok untuk Anda.",
      kesehatan: "Waspadai pegal, punggung, dan sendi karena terlalu lama bekerja. Selingi dengan liburan dan aktivitas yang membuat Anda rileks.",
      misi: "Membangun sesuatu yang bertahan lama dan belajar bahwa kelenturan tidak sama dengan kelemahan.",
      cocok: "2, 6, 8", sulit: "3, 5", hari: "Sabtu", warna: "Hijau tua, cokelat, biru" },
    5: { kekuatan: "Serba bisa, cepat beradaptasi, berani, dan pandai bergaul. Anda menyukai kebebasan dan selalu membawa ide segar.",
      kelemahan: "Gelisah, mudah bosan, impulsif, dan sulit berkomitmen. Godaan kesenangan sesaat bisa mengganggu tujuan jangka panjang.",
      cinta: "Anda pasangan yang seru dan penuh petualangan. Anda butuh ruang pribadi dan pasangan yang mau diajak menjelajah, bukan yang terlalu mengekang.",
      karier: "Cocok di pekerjaan dinamis: penjualan, pemasaran, pariwisata, jurnalistik, media, perdagangan, event organizer, atau usaha yang sering berganti suasana.",
      uang: "Penghasilan bisa naik turun. Anda pandai mencari peluang baru, jadi buat pos tabungan otomatis agar tidak habis untuk hal spontan.",
      kesehatan: "Jaga saraf dan pola tidur. Hindari kebiasaan berlebihan seperti begadang, kopi, atau makanan tidak teratur.",
      misi: "Mengalami hidup sepenuhnya dan membagikan pelajarannya, sambil belajar bahwa disiplin justru memberi kebebasan sejati.",
      cocok: "1, 3, 7", sulit: "2, 4", hari: "Rabu", warna: "Biru muda, abu-abu" },
    6: { kekuatan: "Penyayang, bertanggung jawab, setia, dan murah hati. Anda pelindung keluarga dan tempat orang bercerita.",
      kelemahan: "Terlalu ikut campur, sulit melepaskan, dan cenderung mengorbankan diri sampai lelah. Standar tinggi bisa membuat Anda kecewa pada orang lain.",
      cinta: "Anda pasangan yang hangat dan berbakti, dan cinta serta keluarga adalah prioritas utama. Pastikan Anda juga menerima perhatian, bukan hanya memberi.",
      karier: "Cocok di bidang pelayanan dan keindahan: guru, dokter, perawat, psikolog, desain interior, kuliner, kecantikan, atau usaha keluarga.",
      uang: "Rezeki datang lewat kepercayaan orang. Anda dermawan, jadi atur batas bantuan untuk keluarga agar keuangan sendiri tetap sehat.",
      kesehatan: "Jaga jantung, tenggorokan, dan berat badan. Beri waktu khusus untuk diri sendiri agar tidak kehabisan tenaga.",
      misi: "Merawat dan menyembuhkan dengan cinta, sambil belajar bahwa merawat diri sendiri juga bentuk tanggung jawab.",
      cocok: "2, 4, 9", sulit: "1, 5", hari: "Jumat", warna: "Biru, merah muda" },
    7: { kekuatan: "Cerdas, analitis, intuitif, dan berpikir mendalam. Anda pencari kebenaran yang tidak puas dengan jawaban dangkal.",
      kelemahan: "Mudah menarik diri, curiga, dan sulit terbuka. Perfeksionis yang terlalu banyak berpikir bisa membuat Anda kesepian.",
      cinta: "Anda butuh pasangan yang setara secara pikiran dan menghargai waktu sendiri Anda. Sekali percaya, Anda sangat setia dan dalam.",
      karier: "Cocok sebagai peneliti, ilmuwan, analis, programmer, dokter, penulis, ahli keuangan, rohaniwan, atau spesialis di bidang tertentu.",
      uang: "Uang datang lewat keahlian khusus. Anda berhati-hati dalam investasi, dan itu bagus, asalkan tidak terlalu ragu sampai peluang lewat.",
      kesehatan: "Pikiran yang terus bekerja bisa mengganggu tidur. Meditasi, alam terbuka, dan menulis jurnal sangat membantu Anda.",
      misi: "Mencari makna hidup dan membagikan kebijaksanaan, serta belajar mempercayai orang lain.",
      cocok: "4, 5, 7", sulit: "3, 8", hari: "Senin", warna: "Ungu, hijau laut" },
    8: { kekuatan: "Ambisius, berwibawa, tegas, dan pandai mengelola uang serta orang. Anda punya naluri bisnis dan daya tahan luar biasa.",
      kelemahan: "Bisa gila kerja, terlalu mengukur segalanya dengan materi, dan mendominasi. Kegagalan terasa sangat berat bagi Anda.",
      cinta: "Anda pasangan yang melindungi dan memberi rasa aman. Jangan biarkan pekerjaan menggeser waktu untuk orang tersayang.",
      karier: "Cocok sebagai pengusaha, direktur, bankir, investor, pengacara, properti, politik, atau posisi pimpinan di organisasi besar.",
      uang: "Angka ini paling erat dengan kemakmuran. Kekayaan bisa besar, tetapi naik turunnya juga tajam. Kelola risiko dan bersedekahlah agar aliran rezeki lancar.",
      kesehatan: "Waspadai stres, tekanan darah, dan kelelahan. Jadwalkan istirahat seperti Anda menjadwalkan rapat penting.",
      misi: "Menggunakan kekuatan dan materi untuk kebaikan banyak orang, serta menyeimbangkan dunia luar dan dunia batin.",
      cocok: "2, 4, 6", sulit: "1, 7", hari: "Sabtu", warna: "Hitam, biru tua, emas" },
    9: { kekuatan: "Murah hati, bijak, penuh kasih, dan berwawasan luas. Anda peduli pada sesama dan mudah memaafkan.",
      kelemahan: "Sulit melepaskan masa lalu, mudah kecewa pada dunia, dan kadang lupa pada kebutuhan sendiri. Emosi bisa meledak setelah lama dipendam.",
      cinta: "Anda mencintai dengan tulus dan luas. Anda butuh pasangan yang punya nilai hidup sama dan mendukung panggilan Anda untuk membantu orang lain.",
      karier: "Cocok di bidang kemanusiaan dan seni: aktivis, guru, dokter, pekerja sosial, seniman, penulis, hukum, atau organisasi internasional.",
      uang: "Uang mengalir ketika Anda bekerja dengan tujuan. Anda cenderung memberi terlalu banyak, jadi pastikan masa depan Anda sendiri terjamin.",
      kesehatan: "Jaga daya tahan tubuh dan kesehatan emosi. Kegiatan seni dan pelayanan memberi Anda energi baru.",
      misi: "Melayani kemanusiaan dan menutup siklus lama dengan ikhlas.",
      cocok: "3, 6, 9", sulit: "4, 8", hari: "Selasa", warna: "Merah tua, ungu" },
    11: { kekuatan: "Intuisi sangat tajam, visioner, inspiratif, dan peka secara spiritual. Kehadiran Anda bisa membangkitkan semangat orang lain.",
      kelemahan: "Gugup, mudah cemas, dan terbebani harapan tinggi. Energi besar ini kadang terasa seperti tekanan, sehingga Anda bisa ragu pada diri sendiri.",
      cinta: "Anda pasangan yang penuh pengertian dan idealis. Anda butuh pasangan yang tenang, membumi, dan memahami kepekaan Anda.",
      karier: "Cocok sebagai pembicara, motivator, guru spiritual, seniman, penasihat, terapis, inovator, atau pemimpin gerakan sosial.",
      uang: "Uang datang ketika Anda bekerja sesuai panggilan jiwa. Libatkan mitra yang praktis untuk urusan keuangan.",
      kesehatan: "Sistem saraf Anda sensitif. Batasi kafein, jaga tidur, dan beri ruang hening setiap hari.",
      misi: "Menjadi pembawa terang dan inspirasi. Saat lelah, Anda bisa hidup dengan energi angka 2 yang lebih lembut.",
      cocok: "2, 4, 22", sulit: "8", hari: "Senin", warna: "Perak, putih, ungu muda" },
    22: { kekuatan: "Visi besar dipadu kemampuan praktis. Anda mampu mengubah mimpi menjadi sistem, bangunan, atau organisasi yang nyata.",
      kelemahan: "Tekanan dan tuntutan pada diri sendiri sangat tinggi. Anda bisa menjadi perfeksionis atau malah takut memulai karena tujuannya terlalu besar.",
      cinta: "Anda pasangan yang bisa diandalkan dan membangun masa depan bersama. Jangan sampai proyek besar membuat pasangan merasa nomor dua.",
      karier: "Cocok sebagai arsitek, insinyur, pendiri perusahaan, pemimpin organisasi, perencana kota, diplomat, atau penggerak proyek berskala besar.",
      uang: "Potensi kekayaan besar lewat proyek jangka panjang. Bangun tim yang kuat, karena Anda tidak harus melakukan semuanya sendiri.",
      kesehatan: "Waspadai kelelahan dan ketegangan otot. Rutinitas olahraga ringan dan liburan berkala menjaga stamina Anda.",
      misi: "Membangun warisan yang bermanfaat bagi banyak orang. Saat lelah, Anda bisa hidup dengan energi angka 4 yang lebih sederhana.",
      cocok: "4, 6, 11", sulit: "5", hari: "Sabtu", warna: "Hijau, krem, emas" },
    33: { kekuatan: "Kasih sayang tanpa syarat, kebijaksanaan, dan kemampuan menyembuhkan. Anda guru alami yang membimbing dengan hati.",
      kelemahan: "Mudah memikul beban orang lain sampai lupa diri. Rasa tanggung jawab yang besar bisa berubah menjadi rasa bersalah.",
      cinta: "Anda pasangan yang sangat setia, penuh pengorbanan, dan mengayomi. Pilih pasangan yang juga menjaga dan merawat Anda.",
      karier: "Cocok sebagai guru, penyembuh, dokter, psikolog, pemuka agama, seniman, atau pemimpin lembaga sosial dan pendidikan.",
      uang: "Rezeki datang lewat pelayanan dan ketulusan. Tetapkan batas yang jelas agar kebaikan Anda tidak dimanfaatkan.",
      kesehatan: "Jaga jantung dan kesehatan emosi. Anda perlu waktu untuk diri sendiri agar bisa terus memberi.",
      misi: "Mengangkat orang lain dengan cinta. Saat lelah, Anda bisa hidup dengan energi angka 6 yang lebih membumi.",
      cocok: "6, 9, 22", sulit: "1", hari: "Jumat", warna: "Biru langit, merah muda" }
  };
  // Empat puncak hidup (pinnacle) dan empat tantangan
  var PUNCAK = {
    1: "Masa membangun kemandirian dan keberanian. Anda didorong berdiri di atas kaki sendiri dan memimpin.",
    2: "Masa kerja sama, kesabaran, dan hubungan. Kemitraan dan pasangan memegang peran besar.",
    3: "Masa ekspresi diri, kreativitas, dan pergaulan. Bakat bicara dan berkarya mendapat panggung.",
    4: "Masa kerja keras dan membangun pondasi: karier, rumah, dan keuangan yang stabil.",
    5: "Masa perubahan, perjalanan, dan kebebasan. Banyak pengalaman baru yang memperluas wawasan.",
    6: "Masa keluarga dan tanggung jawab. Rumah tangga, anak, dan komunitas menjadi pusat hidup.",
    7: "Masa belajar, merenung, dan mendalami spiritualitas. Kebijaksanaan tumbuh dari dalam.",
    8: "Masa pencapaian materi, karier, dan pengaruh. Kesempatan memegang kendali dan mengelola kekayaan.",
    9: "Masa memberi dan melepas. Wawasan luas, kepedulian sosial, dan penyelesaian bab lama.",
    11: "Masa pencerahan dan inspirasi. Intuisi tajam membawa Anda tampil sebagai panutan.",
    22: "Masa membangun hal besar yang bermanfaat bagi banyak orang.",
    33: "Masa pelayanan dan penyembuhan. Anda menjadi tempat bersandar bagi banyak orang."
  };
  var TANTANGAN = {
    0: "Tantangan pilihan: semua jalan terbuka, sehingga Anda perlu menentukan sendiri arah yang paling bermakna.",
    1: "Belajar percaya diri dan berani bersikap tanpa menjadi keras kepala.",
    2: "Belajar tidak terlalu sensitif dan tidak bergantung pada persetujuan orang lain.",
    3: "Belajar mengekspresikan diri dengan jujur dan tidak menghamburkan bakat.",
    4: "Belajar disiplin dan sabar, tanpa menjadi kaku terhadap perubahan.",
    5: "Belajar mengendalikan keinginan dan menggunakan kebebasan secara bertanggung jawab.",
    6: "Belajar menerima orang apa adanya dan tidak memikul tanggung jawab yang bukan milik Anda.",
    7: "Belajar membuka diri, percaya pada orang lain, dan tidak tenggelam dalam keraguan.",
    8: "Belajar menyeimbangkan uang, kekuasaan, dan nilai batin."
  };
  var BULAN_PERSONAL = {
    1: "Bulan untuk memulai. Ajukan ide, lamar pekerjaan, atau mulai kebiasaan baru.",
    2: "Bulan untuk bersabar dan bekerja sama. Hal-hal bergerak pelan, jadi rawat hubungan.",
    3: "Bulan sosial dan kreatif. Bagus untuk promosi, acara, dan menyampaikan pendapat.",
    4: "Bulan kerja keras. Rapikan urusan, buat jadwal, dan selesaikan tugas tertunda.",
    5: "Bulan perubahan. Terbuka pada kejutan, perjalanan, dan peluang mendadak.",
    6: "Bulan keluarga dan rumah. Perhatikan orang terdekat dan urusan rumah tangga.",
    7: "Bulan untuk merenung. Kurangi keramaian, perbanyak belajar dan istirahat.",
    8: "Bulan bisnis dan keuangan. Waktu tepat untuk negosiasi dan keputusan besar.",
    9: "Bulan penutupan. Selesaikan, bersihkan, dan lepaskan yang tidak diperlukan."
  };
  var KATA_KUNCI = { 1: "memulai", 2: "kerja sama", 3: "berekspresi", 4: "merapikan", 5: "perubahan", 6: "keluarga", 7: "merenung", 8: "keuangan", 9: "menyelesaikan" };
  var SIKAP = {
    1: "Kesan pertama Anda tegas, percaya diri, dan siap memimpin.",
    2: "Kesan pertama Anda ramah, lembut, dan mudah didekati.",
    3: "Kesan pertama Anda ceria, lucu, dan menyenangkan.",
    4: "Kesan pertama Anda serius, rapi, dan bisa dipercaya.",
    5: "Kesan pertama Anda energik, bebas, dan penuh rasa ingin tahu.",
    6: "Kesan pertama Anda hangat, peduli, dan mengayomi.",
    7: "Kesan pertama Anda tenang, cerdas, dan agak misterius.",
    8: "Kesan pertama Anda berwibawa, mapan, dan berkelas.",
    9: "Kesan pertama Anda bijak, murah hati, dan terbuka."
  };

  var TAHUN_PERSONAL = {
    1: "Tahun awal baru. Saat tepat memulai usaha, proyek, atau kebiasaan baru.",
    2: "Tahun kesabaran dan kerja sama. Hubungan dan kemitraan menjadi sorotan.",
    3: "Tahun ekspresi diri. Banyak peluang sosial dan kreatif.",
    4: "Tahun kerja keras dan menata fondasi. Fokus pada disiplin dan kesehatan.",
    5: "Tahun perubahan. Perjalanan, pindah, atau pengalaman baru sangat mungkin terjadi.",
    6: "Tahun keluarga dan tanggung jawab. Rumah tangga dan cinta menjadi pusat perhatian.",
    7: "Tahun refleksi. Waktu yang baik untuk belajar, merenung, dan memperdalam spiritualitas.",
    8: "Tahun panen. Karier dan keuangan berpeluang meningkat jika dikelola dengan bijak.",
    9: "Tahun penutupan. Selesaikan urusan lama dan lepaskan yang tidak lagi berguna."
  };

  // ---------- 3. Numerologi nama lengkap (Pythagoras) ----------
  function letterVal(ch) { return ((ch.charCodeAt(0) - 65) % 9) + 1; }
  function isVowel(ch, word, i) {
    if ("AIUEO".indexOf(ch) >= 0) return true;
    if (ch === "Y") { // Y dihitung vokal bila tidak diapit vokal
      var p = word[i - 1], n = word[i + 1];
      var pv = p && "AIUEO".indexOf(p) >= 0, nv = n && "AIUEO".indexOf(n) >= 0;
      return !pv && !nv;
    }
    return false;
  }
  function namaNumerologi(nama) {
    var clean = nama.toUpperCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Z ]/g, "").trim().replace(/\s+/g, " ");
    var all = 0, vow = 0, con = 0, rincian = [];
    clean.split(" ").forEach(function (w) {
      for (var i = 0; i < w.length; i++) {
        var v = letterVal(w[i]);
        all += v;
        if (isVowel(w[i], w, i)) vow += v; else con += v;
        rincian.push({ h: w[i], v: v });
      }
      rincian.push({ h: " ", v: 0 });
    });
    rincian.pop();
    return {
      bersih: clean, rincian: rincian,
      ekspresi: reduceNum(all, true), jumlah: all,
      jiwa: reduceNum(vow, true),
      kepribadian: reduceNum(con, true)
    };
  }
  var EKSPRESI_BAKAT = {
    1: "Bakat memimpin dan merintis. Nama ini mendorong Anda tampil sebagai pelopor.",
    2: "Bakat merangkul dan menjadi penengah. Nama ini memancarkan kelembutan dan kepekaan.",
    3: "Bakat berbicara, menulis, dan berkesenian. Nama ini memancarkan keceriaan.",
    4: "Bakat mengatur dan membangun sistem. Nama ini memberi kesan dapat dipercaya.",
    5: "Bakat beradaptasi dan memasarkan. Nama ini memancarkan energi bebas dan dinamis.",
    6: "Bakat merawat, mengajar, dan melayani. Nama ini memberi kesan hangat dan bertanggung jawab.",
    7: "Bakat meneliti dan berpikir mendalam. Nama ini memancarkan kesan bijak dan misterius.",
    8: "Bakat bisnis dan manajemen. Nama ini memancarkan wibawa dan kesan mapan.",
    9: "Bakat menolong dan menginspirasi banyak orang. Nama ini memancarkan kemurahan hati.",
    11: "Bakat menginspirasi dan membaca situasi secara intuitif.",
    22: "Bakat mewujudkan proyek besar yang bermanfaat bagi banyak orang.",
    33: "Bakat membimbing dan menyembuhkan dengan kasih sayang."
  };
  var JIWA = {
    1: "Dalam hati Anda ingin mandiri dan diakui atas usaha sendiri.", 2: "Dalam hati Anda mendambakan kedamaian, cinta, dan kebersamaan.",
    3: "Dalam hati Anda ingin berekspresi dan membuat orang lain bahagia.", 4: "Dalam hati Anda mendambakan keteraturan dan rasa aman.",
    5: "Dalam hati Anda haus kebebasan dan pengalaman baru.", 6: "Dalam hati Anda ingin dibutuhkan dan menjaga orang yang Anda cintai.",
    7: "Dalam hati Anda mencari makna, ilmu, dan ketenangan batin.", 8: "Dalam hati Anda ingin sukses, berpengaruh, dan mapan.",
    9: "Dalam hati Anda ingin berbuat baik untuk dunia yang lebih luas.", 11: "Dalam hati Anda mencari pencerahan dan ingin menjadi teladan.",
    22: "Dalam hati Anda ingin meninggalkan warisan besar.", 33: "Dalam hati Anda ingin mengabdi dengan cinta tanpa syarat."
  };
  var KEPRIBADIAN = {
    1: "Orang melihat Anda tegas, percaya diri, dan mandiri.", 2: "Orang melihat Anda ramah, lembut, dan mudah didekati.",
    3: "Orang melihat Anda menyenangkan, lucu, dan menarik.", 4: "Orang melihat Anda serius, rapi, dan bisa diandalkan.",
    5: "Orang melihat Anda dinamis, modis, dan penuh semangat.", 6: "Orang melihat Anda hangat, peduli, dan bertanggung jawab.",
    7: "Orang melihat Anda tenang, cerdas, dan agak menjaga jarak.", 8: "Orang melihat Anda berwibawa, sukses, dan berkelas.",
    9: "Orang melihat Anda bijak, murah hati, dan berwawasan luas.", 11: "Orang melihat Anda unik dan memancarkan aura inspiratif.",
    22: "Orang melihat Anda kuat, kompeten, dan visioner.", 33: "Orang melihat Anda penuh kasih dan menenangkan."
  };

  // ---------- 4. Ba Zi (Empat Pilar) ----------
  var GAN = [
    { h: "甲", n: "Jia", el: "Kayu", yy: "Yang" }, { h: "乙", n: "Yi", el: "Kayu", yy: "Yin" },
    { h: "丙", n: "Bing", el: "Api", yy: "Yang" }, { h: "丁", n: "Ding", el: "Api", yy: "Yin" },
    { h: "戊", n: "Wu", el: "Tanah", yy: "Yang" }, { h: "己", n: "Ji", el: "Tanah", yy: "Yin" },
    { h: "庚", n: "Geng", el: "Logam", yy: "Yang" }, { h: "辛", n: "Xin", el: "Logam", yy: "Yin" },
    { h: "壬", n: "Ren", el: "Air", yy: "Yang" }, { h: "癸", n: "Gui", el: "Air", yy: "Yin" }
  ];
  var ZHI = [
    { h: "子", n: "Zi", shio: "Tikus", el: "Air" }, { h: "丑", n: "Chou", shio: "Kerbau", el: "Tanah" },
    { h: "寅", n: "Yin", shio: "Macan", el: "Kayu" }, { h: "卯", n: "Mao", shio: "Kelinci", el: "Kayu" },
    { h: "辰", n: "Chen", shio: "Naga", el: "Tanah" }, { h: "巳", n: "Si", shio: "Ular", el: "Api" },
    { h: "午", n: "Wu", shio: "Kuda", el: "Api" }, { h: "未", n: "Wei", shio: "Kambing", el: "Tanah" },
    { h: "申", n: "Shen", shio: "Monyet", el: "Logam" }, { h: "酉", n: "You", shio: "Ayam", el: "Logam" },
    { h: "戌", n: "Xu", shio: "Anjing", el: "Tanah" }, { h: "亥", n: "Hai", shio: "Babi", el: "Air" }
  ];
  // Perkiraan tanggal awal 12 "jie" (batas bulan Ba Zi); bisa meleset ±1 hari tergantung tahun.
  // index 0 = bulan Yin (寅) mulai ~4 Feb
  var JIE = [[2, 4], [3, 6], [4, 5], [5, 6], [6, 6], [7, 7], [8, 8], [9, 8], [10, 8], [11, 7], [12, 7], [1, 6]];
  var DAY_MASTER = {
    "Jia": "Kayu Yang, seperti pohon besar: lurus, teguh, berjiwa pemimpin, dan suka melindungi.",
    "Yi": "Kayu Yin, seperti tanaman merambat: luwes, ramah, pandai beradaptasi, dan gigih.",
    "Bing": "Api Yang, seperti matahari: hangat, murah hati, bersemangat, dan suka menjadi pusat perhatian.",
    "Ding": "Api Yin, seperti lilin: lembut, perhatian, teliti, dan menerangi orang di sekitarnya.",
    "Wu": "Tanah Yang, seperti gunung: kokoh, dapat dipercaya, tenang, dan protektif.",
    "Ji": "Tanah Yin, seperti tanah kebun: sabar, mengayomi, praktis, dan suka menumbuhkan orang lain.",
    "Geng": "Logam Yang, seperti pedang atau besi: tegas, berani, adil, dan setia kawan.",
    "Xin": "Logam Yin, seperti perhiasan: halus, elegan, perfeksionis, dan peka terhadap kualitas.",
    "Ren": "Air Yang, seperti samudra: cerdas, bebas, berwawasan luas, dan penuh ide.",
    "Gui": "Air Yin, seperti embun atau hujan: intuitif, imajinatif, lembut, dan bijak."
  };
  var EL_SARAN = {
    "Kayu": "warna hijau, arah timur, kegiatan belajar dan bertumbuh",
    "Api": "warna merah atau oranye, arah selatan, kegiatan sosial dan tampil",
    "Tanah": "warna kuning atau cokelat, arah tengah, rutinitas yang stabil",
    "Logam": "warna putih atau emas, arah barat, keteraturan dan ketegasan",
    "Air": "warna biru atau hitam, arah utara, istirahat, refleksi, dan perjalanan"
  };
  function baziYearIndex(dt) { // tahun Ba Zi berganti saat Li Chun (~4 Feb)
    var y = dt.y;
    if (dt.m < 2 || (dt.m === 2 && dt.d < 4)) y--;
    return y;
  }
  function bazi(dt, jam) {
    var by = baziYearIndex(dt);
    var ys = mod(by - 4, 10), yb = mod(by - 4, 12);
    // bulan
    var md = dt.m * 100 + dt.d, mi = 11; // default Chou (Jan sebelum Xiao Han dianggap Zi -> ditangani di bawah)
    var found = -1;
    for (var i = 0; i < 11; i++) { // Yin..Zi (Feb..Des)
      var s = JIE[i][0] * 100 + JIE[i][1], e = i < 10 ? JIE[i + 1][0] * 100 + JIE[i + 1][1] : 1232;
      if (md >= s && md < e) { found = i; break; }
    }
    if (found < 0) found = md >= 106 ? 11 : 10; // Jan 6 - Feb 3 = Chou; 1-5 Jan = Zi (bulan ke-11)
    mi = found;
    var mb = mod(mi + 2, 12);
    var ms = mod((ys % 5) * 2 + 2 + mi, 10);
    // hari
    var dIdx = mod(jdn(dt.y, dt.m, dt.d) + 49, 60);
    var ds = dIdx % 10, db = dIdx % 12;
    var pillars = [
      { key: "y", g: GAN[ys], z: ZHI[yb] },
      { key: "m", g: GAN[ms], z: ZHI[mb] },
      { key: "d", g: GAN[ds], z: ZHI[db] }
    ];
    if (jam !== null && jam !== undefined && jam !== "") {
      var hb = Math.floor(((+jam + 1) % 24) / 2);
      var hs = mod((ds % 5) * 2 + hb, 10);
      pillars.push({ key: "h", g: GAN[hs], z: ZHI[hb] });
    }
    var count = { Kayu: 0, Api: 0, Tanah: 0, Logam: 0, Air: 0 };
    pillars.forEach(function (p) { count[p.g.el]++; count[p.z.el]++; });
    var els = Object.keys(count);
    var lemah = els.filter(function (e) { return count[e] === Math.min.apply(null, els.map(function (k) { return count[k]; })); });
    var kuat = els.filter(function (e) { return count[e] === Math.max.apply(null, els.map(function (k) { return count[k]; })); });
    var dm = GAN[ds], hitungT = {};
    els.forEach(function (e) { hitungT[elT(e)] = count[e]; });
    var out = pillars.map(function (p) { return { key: p.key, label: S.pilar[p.key], g: salin(p.g, { el: elT(p.g.el) }), z: salin(p.z, { el: elT(p.z.el) }) }; });
    return { pilar: out, dayMaster: salin(dm, { el: elT(dm.el) }), dmInfo: DAY_MASTER[dm.n], elemen: hitungT, lemah: lemah.map(elT), kuat: kuat.map(elT), saran: lemah.map(function (e) { return elT(e) + ": " + EL_SARAN[e]; }) };
  }

  // ---------- 5. Weton Jawa ----------
  var HARI = [ // index sesuai Date.getDay(): 0 = Minggu
    { id: "Minggu", n: "Minggu", neptu: 5 }, { id: "Senin", n: "Senin", neptu: 4 }, { id: "Selasa", n: "Selasa", neptu: 3 }, { id: "Rabu", n: "Rabu", neptu: 7 },
    { id: "Kamis", n: "Kamis", neptu: 8 }, { id: "Jumat", n: "Jumat", neptu: 6 }, { id: "Sabtu", n: "Sabtu", neptu: 9 }
  ];
  var PASARAN = [
    { n: "Legi", neptu: 5, watak: "Murah hati, suka menolong, dan pandai bergaul, tetapi kadang kurang hati-hati dalam berbicara." },
    { n: "Pahing", neptu: 9, watak: "Tekun, ambisius, dan ingin memiliki. Teliti dalam urusan materi, kadang mudah tersinggung." },
    { n: "Pon", neptu: 7, watak: "Bicaranya mudah diterima orang, suka di rumah, dan berwibawa. Kadang ingin menang sendiri." },
    { n: "Wage", neptu: 4, watak: "Setia, rajin, dan teguh pendirian. Kadang kaku dan sulit menerima pendapat orang lain." },
    { n: "Kliwon", neptu: 8, watak: "Pandai bicara, intuitif, dan punya daya tarik kuat. Kadang sulit ditebak suasana hatinya." }
  ];
  var WATAK_HARI = {
    "Minggu": "Hangat, mandiri, dan berwibawa. Suka menjadi panutan.",
    "Senin": "Lembut, peka, dan berwajah ramah. Pandai menyesuaikan diri.",
    "Selasa": "Berani, tegas, dan bersemangat. Bisa cepat marah tetapi cepat reda.",
    "Rabu": "Pandai bicara, cerdas, dan luwes. Mudah mendapat teman.",
    "Kamis": "Bijaksana, berpendirian, dan dihormati. Senang berbagi ilmu.",
    "Jumat": "Tenang, sabar, dan religius. Disukai banyak orang.",
    "Sabtu": "Pekerja keras, tangguh, dan ulet. Matang dalam menghadapi masalah."
  };
  // Lakuning (watak berdasarkan jumlah neptu) — ringkasan dari primbon
  var LAKU = {
    7: "Lakuning Lebu katiup angin: hidupnya banyak berpindah dan cita-citanya sering berubah.",
    8: "Lakuning Geni: wataknya panas dan berani, mudah tersulut emosi.",
    9: "Lakuning Angin: pendiriannya mudah berubah, tetapi luwes bergaul.",
    10: "Lakuning Pandito mbangun teki: bijak, suka menasihati, dan hidupnya teratur.",
    11: "Lakuning Setan: lincah, cerdik, dan suka hal baru, perlu menjaga perilaku.",
    12: "Lakuning Kembang: menyenangkan, disukai banyak orang, dan dermawan.",
    13: "Lakuning Lintang: menarik, pendiam, dan disukai orang.",
    14: "Lakuning Rembulan: sabar dan suka menolong, menjadi penerang bagi orang lain.",
    15: "Lakuning Srengenge: berwawasan luas, cerdas, dan penuh semangat.",
    16: "Lakuning Banyu: tenang, sabar, dan terbuka, tetapi kadang mudah terbawa arus.",
    17: "Lakuning Bumi: setia, sabar, dan bisa menampung banyak hal, dicintai banyak orang.",
    18: "Lakuning Paripurna: luhur, berwibawa, dan menjadi teladan."
  };
  function weton(dt) {
    var j = jdn(dt.y, dt.m, dt.d);
    var hari = HARI[mod(j + 1, 7)];
    var pas = PASARAN[mod(j, 5)]; // dikalibrasi: 17 Agustus 1945 = Jumat Legi
    var total = hari.neptu + pas.neptu;
    return { hari: hari, pasaran: pas, neptu: total, wetonLabel: hari.n + " " + pas.n, wetonId: hari.id + " " + ASLI.PASARAN[mod(j, 5)].n, watakHari: WATAK_HARI[hari.id], laku: LAKU[total] };
  }
  var JODOH = [ // sisa (neptu A + neptu B) mod 8, metode "Pegat-Ratu-Jodoh-Topo-Tinari-Padu-Sujanan-Pesthi"
    { k: "Pesthi", b: "Rukun, tenteram, dan damai sampai tua. Ujian datang tetapi tidak merusak hubungan.", skor: 5 },
    { k: "Pegat", b: "Rawan masalah yang bisa membuat berpisah, misalnya soal ekonomi atau pihak ketiga. Perlu ekstra komunikasi.", skor: 1 },
    { k: "Ratu", b: "Pasangan yang dihormati dan dikagumi lingkungan. Sangat harmonis.", skor: 5 },
    { k: "Jodoh", b: "Benar-benar berjodoh, saling menerima kelebihan dan kekurangan.", skor: 5 },
    { k: "Topo", b: "Awalnya penuh perjuangan, terutama soal ekonomi, tetapi akan bahagia di kemudian hari.", skor: 3 },
    { k: "Tinari", b: "Mudah mendapat rezeki dan kebahagiaan. Hidup berkecukupan.", skor: 4 },
    { k: "Padu", b: "Sering bertengkar karena hal kecil, tetapi tidak sampai berpisah.", skor: 2 },
    { k: "Sujanan", b: "Rawan pertengkaran dan godaan perselingkuhan. Perlu saling menjaga kepercayaan.", skor: 1 }
  ];
  function jodohWeton(a, b) {
    var wa = weton(a), wb = weton(b), sum = wa.neptu + wb.neptu;
    return { a: wa, b: wb, total: sum, hasil: JODOH[sum % 8] };
  }

  // ---------- 6. Shio (berdasar Imlek) ----------
  // Fase bulan baru (Meeus, bab 49) untuk mencari Tahun Baru Imlek: bulan baru (waktu Beijing) antara 21 Jan dan 20 Feb.
  function newMoonJDE(k) {
    var T = k / 1236.85, rad = Math.PI / 180;
    var jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var M = (2.5534 + 29.1053567 * k) * rad;
    var Mp = (201.5643 + 385.81693528 * k + 0.0107582 * T * T) * rad;
    var F = (160.7108 + 390.67050284 * k - 0.0016118 * T * T) * rad;
    var Om = (124.7746 - 1.56375588 * k + 0.0020672 * T * T) * rad;
    jde += -0.4072 * Math.sin(Mp) + 0.17241 * E * Math.sin(M) + 0.01608 * Math.sin(2 * Mp) + 0.01039 * Math.sin(2 * F)
      + 0.00739 * E * Math.sin(Mp - M) - 0.00514 * E * Math.sin(Mp + M) + 0.00208 * E * E * Math.sin(2 * M)
      - 0.00111 * Math.sin(Mp - 2 * F) - 0.00057 * Math.sin(Mp + 2 * F) + 0.00056 * E * Math.sin(2 * Mp + M)
      - 0.00042 * Math.sin(3 * Mp) + 0.00042 * E * Math.sin(M + 2 * F) + 0.00038 * E * Math.sin(M - 2 * F)
      - 0.00024 * E * Math.sin(2 * Mp - M) - 0.00017 * Math.sin(Om);
    return jde;
  }
  function jdToYMD(jd) {
    var Z = Math.floor(jd + 0.5), A = Z;
    if (Z >= 2299161) { var al = Math.floor((Z - 1867216.25) / 36524.25); A = Z + 1 + al - Math.floor(al / 4); }
    var B = A + 1524, C = Math.floor((B - 122.1) / 365.25), D = Math.floor(365.25 * C), Ee = Math.floor((B - D) / 30.6001);
    var day = B - D - Math.floor(30.6001 * Ee), m = Ee < 14 ? Ee - 1 : Ee - 13, y = m > 2 ? C - 4716 : C - 4715;
    return { y: y, m: m, d: day };
  }
  function decSolsticeJDE(year) { // Meeus bab 27, rumus rata-rata titik balik matahari Desember
    var Y = (year - 2000) / 1000;
    return 2451900.05952 + 365242.74049 * Y - 0.06223 * Y * Y - 0.00823 * Y * Y * Y + 0.00032 * Y * Y * Y * Y;
  }
  function bjDay(jde) { return Math.floor(jde + 8 / 24 + 0.5); } // nomor hari (JDN) dalam waktu Beijing
  // Imlek = awal bulan ke-1: dua bulan setelah bulan yang memuat titik balik Desember.
  // Bila hasilnya sebelum 21 Jan (kasus bulan kabisat, mis. 2033/2034), ambil bulan berikutnya.
  function imlek(year) {
    var sol = bjDay(decSolsticeJDE(year - 1));
    var k = Math.floor((year - 1 + 11.8 / 12 - 2000) * 12.3685) - 2;
    while (bjDay(newMoonJDE(k + 1)) <= sol) k++;
    var c = k + 2;
    if (bjDay(newMoonJDE(c)) < jdn(year, 1, 21)) c++;
    return jdToYMD(bjDay(newMoonJDE(c)));
  }
  var SHIO = [
    { id: "Tikus", n: "Tikus", sifat: "Cerdik, hemat, dan pandai membaca peluang. Mudah beradaptasi di lingkungan baru.", cocok: "Naga, Monyet, Kerbau", hindari: "Kuda" },
    { id: "Kerbau", n: "Kerbau", sifat: "Rajin, sabar, dan dapat diandalkan. Bekerja tekun tanpa banyak bicara.", cocok: "Ular, Ayam, Tikus", hindari: "Kambing" },
    { id: "Macan", n: "Macan", sifat: "Berani, karismatik, dan penuh semangat. Suka tantangan dan melindungi yang lemah.", cocok: "Kuda, Anjing, Babi", hindari: "Monyet" },
    { id: "Kelinci", n: "Kelinci", sifat: "Lembut, sopan, dan berselera tinggi. Menghindari konflik dan pandai berdiplomasi.", cocok: "Kambing, Babi, Anjing", hindari: "Ayam" },
    { id: "Naga", n: "Naga", sifat: "Percaya diri, bersemangat, dan beruntung. Pemimpin alami yang berpikir besar.", cocok: "Tikus, Monyet, Ayam", hindari: "Anjing" },
    { id: "Ular", n: "Ular", sifat: "Bijak, tenang, dan intuitif. Pandai menyimpan rahasia dan berpikir strategis.", cocok: "Kerbau, Ayam, Monyet", hindari: "Babi" },
    { id: "Kuda", n: "Kuda", sifat: "Energik, mandiri, dan suka kebebasan. Ceria dan pandai bergaul.", cocok: "Macan, Kambing, Anjing", hindari: "Tikus" },
    { id: "Kambing", n: "Kambing", sifat: "Lembut, kreatif, dan penuh kasih. Menyukai keindahan dan suasana damai.", cocok: "Kelinci, Kuda, Babi", hindari: "Kerbau" },
    { id: "Monyet", n: "Monyet", sifat: "Cerdas, jenaka, dan banyak akal. Cepat belajar dan pandai memecahkan masalah.", cocok: "Tikus, Naga, Ular", hindari: "Macan" },
    { id: "Ayam", n: "Ayam", sifat: "Teliti, jujur, dan pekerja keras. Tampil rapi dan percaya diri.", cocok: "Kerbau, Ular, Naga", hindari: "Kelinci" },
    { id: "Anjing", n: "Anjing", sifat: "Setia, jujur, dan adil. Teman yang bisa dipercaya dan suka melindungi.", cocok: "Macan, Kelinci, Kuda", hindari: "Naga" },
    { id: "Babi", n: "Babi", sifat: "Tulus, murah hati, dan menikmati hidup. Rezeki biasanya lancar.", cocok: "Kelinci, Kambing, Macan", hindari: "Ular" }
  ];
  var EL_TAHUN = ["Logam", "Logam", "Air", "Air", "Kayu", "Kayu", "Api", "Api", "Tanah", "Tanah"]; // berdasar digit terakhir tahun
  function shio(dt) {
    var cny = imlek(dt.y), y = dt.y;
    var before = dt.m * 100 + dt.d < cny.m * 100 + cny.d;
    if (before) y--;
    var idx = mod(y - 4, 12);
    var nowY = new Date().getFullYear(), nowIdx = mod(nowY - 4, 12);
    var rel, s = SHIO[idx], a = ASLI.SHIO[idx], kini = ASLI.SHIO[nowIdx].n;
    if (nowIdx === idx) rel = S.benMing;
    else if (a.cocok.indexOf(kini) >= 0) rel = S.selaras;
    else if (a.hindari === kini) rel = S.ciong;
    else rel = S.netral;
    return { shio: s, tahunImlek: y, elemen: EL_TAHUN[mod(y, 10)], imlekTanggal: imlek(dt.y), sebelumImlek: before, tahunIni: nowY, shioTahunIni: SHIO[nowIdx].n, ramalanTahunIni: rel };
  }

  // ---------- Bahasa ----------
  var TABEL = { ZODIAK: ZODIAK, ANGKA: ANGKA, TAHUN_PERSONAL: TAHUN_PERSONAL, EKSPRESI_BAKAT: EKSPRESI_BAKAT, JIWA: JIWA, KEPRIBADIAN: KEPRIBADIAN,
    GAN: GAN, ZHI: ZHI, DAY_MASTER: DAY_MASTER, EL_SARAN: EL_SARAN, HARI: HARI, PASARAN: PASARAN, WATAK_HARI: WATAK_HARI, LAKU: LAKU,
    JODOH: JODOH, SHIO: SHIO, EL_TAHUN: EL_TAHUN, S: S,
    LP_DETAIL: LP_DETAIL, PUNCAK: PUNCAK, TANTANGAN: TANTANGAN, BULAN_PERSONAL: BULAN_PERSONAL, SIKAP: SIKAP, KATA_KUNCI: KATA_KUNCI };
  var ASLI = JSON.parse(JSON.stringify(TABEL));
  function tumpang(t, src) { Object.keys(src).forEach(function (k) { var v = src[k]; if (v && typeof v === "object" && t[k] && typeof t[k] === "object") tumpang(t[k], v); else t[k] = v; }); }
  function setLang(lang, en) { tumpang(TABEL, JSON.parse(JSON.stringify(ASLI))); if (lang === "en" && en) tumpang(TABEL, en); }

  var api = { setLang: setLang,
    jdn: jdn, reduceNum: reduceNum, zodiak: zodiak, lifePath: lifePath, TAHUN_PERSONAL: TAHUN_PERSONAL,
    namaNumerologi: namaNumerologi, EKSPRESI_BAKAT: EKSPRESI_BAKAT, JIWA: JIWA, KEPRIBADIAN: KEPRIBADIAN, ANGKA: ANGKA,
    bazi: bazi, weton: weton, jodohWeton: jodohWeton, imlek: imlek, shio: shio, EL_SARAN: EL_SARAN
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Ramalan = api;
})(this);
