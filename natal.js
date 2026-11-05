/* Bagan kelahiran (natal chart) untuk Serat Nasib.
   Posisi planet dihitung sendiri tanpa pustaka luar:
   - Matahari & Bulan: rumus Meeus (Astronomical Algorithms, bab 25 & 47), ketelitian sekitar 0,01–0,02°.
   - Merkurius s.d. Pluto: elemen Kepler JPL (Standish, berlaku 1800–2050), ketelitian umumnya di bawah 0,1°.
   - Ascendant & MC dari waktu sidereal; sistem rumah Whole Sign. */
(function (root) {
  "use strict";
  var RAD = Math.PI / 180;
  function norm(x) { x %= 360; return x < 0 ? x + 360 : x; }
  function sind(x) { return Math.sin(x * RAD); }
  function cosd(x) { return Math.cos(x * RAD); }

  function julianDay(ms) { return ms / 86400000 + 2440587.5; }

  // ---------- Matahari (bujur ekliptika sejati, ekuinoks tanggal) ----------
  function sunLon(T) {
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    var C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M) + (0.019993 - 0.000101 * T) * sind(2 * M) + 0.000289 * sind(3 * M);
    var om = 125.04 - 1934.136 * T;
    return norm(L0 + C - 0.00569 - 0.00478 * sind(om));
  }

  // ---------- Bulan (suku utama Meeus bab 47) ----------
  var MOON_TERMS = [ // [D, M, M', F, koefisien 1e-6 derajat]
    [0,0,1,0,6288774],[2,0,-1,0,1274027],[2,0,0,0,658314],[0,0,2,0,213618],[0,1,0,0,-185116],[0,0,0,2,-114332],
    [2,0,-2,0,58793],[2,-1,-1,0,57066],[2,0,1,0,53322],[2,-1,0,0,45758],[0,1,-1,0,-40923],[1,0,0,0,-34720],
    [0,1,1,0,-30383],[2,0,0,-2,15327],[0,0,1,2,-12528],[0,0,1,-2,10980],[4,0,-1,0,10675],[0,0,3,0,10034],
    [4,0,-2,0,8548],[2,1,-1,0,-7888],[2,1,0,0,-6766],[1,0,-1,0,-5163],[1,1,0,0,4987],[2,-1,1,0,4036],
    [2,0,2,0,3994],[4,0,0,0,3861],[2,0,-3,0,3665],[0,1,-2,0,-2689],[2,0,-1,2,-2602],[2,-1,-2,0,2390],
    [1,0,1,0,-2348],[2,-2,0,0,2236],[0,1,2,0,-2120],[0,2,0,0,-2069],[2,-2,-1,0,2048],[2,0,1,-2,-1773],
    [2,0,0,2,-1595],[4,-1,-1,0,1215],[0,0,2,2,-1110],[3,0,-1,0,-892],[2,1,1,0,-810],[4,-1,-2,0,759],
    [0,2,-1,0,-713],[2,2,-1,0,-700],[2,1,-2,0,691],[2,-1,0,-2,596],[4,0,1,0,549],[0,0,4,0,537],[4,-1,0,0,520]
  ];
  function moonLon(T) {
    var Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
    var D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
    var M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
    var Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
    var F = 93.272095 + 483202.0175233 * T - 0.0036539 * T * T;
    var E = 1 - 0.002516 * T - 0.0000074 * T * T;
    var A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T;
    var s = 0;
    MOON_TERMS.forEach(function (t) {
      var c = t[4], m = Math.abs(t[1]);
      if (m === 1) c *= E; else if (m === 2) c *= E * E;
      s += c * sind(t[0] * D + t[1] * M + t[2] * Mp + t[3] * F);
    });
    s += 3958 * sind(A1) + 1962 * sind(Lp - F) + 318 * sind(A2);
    var om = 125.04452 - 1934.136261 * T;
    return norm(Lp + s / 1e6 - 0.00478 * sind(om)); // + nutasi bujur (suku utama)
  }

  // ---------- Planet: elemen Kepler JPL (J2000, per abad) ----------
  var EL = {
    mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.2503235, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
    venus:   [0.72333566, 0.0000039, 0.00677672, -0.00004107, 3.39467605, -0.0007889, 181.9790995, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
    earth:   [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
    mars:    [1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
    jupiter: [5.202887, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
    saturn:  [9.53667594, -0.0012506, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
    uranus:  [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.9542763, 0.40805281, 74.01692503, 0.04240589],
    neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
    pluto:   [39.48211675, -0.00031596, 0.2488273, 0.0000517, 17.14001206, 0.00004818, 238.92903833, 145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482]
  };
  function helio(name, T) {
    var e0 = EL[name];
    var a = e0[0] + e0[1] * T, e = e0[2] + e0[3] * T, I = e0[4] + e0[5] * T,
        L = e0[6] + e0[7] * T, w = e0[8] + e0[9] * T, O = e0[10] + e0[11] * T;
    var omega = w - O, M = norm(L - w);
    if (M > 180) M -= 360;
    var E = M + (e / RAD) * sind(M);
    for (var i = 0; i < 12; i++) {
      var dM = M - (E - (e / RAD) * sind(E));
      var dE = dM / (1 - e * cosd(E));
      E += dE;
      if (Math.abs(dE) < 1e-7) break;
    }
    var xp = a * (cosd(E) - e), yp = a * Math.sqrt(1 - e * e) * sind(E);
    var co = cosd(omega), so = sind(omega), cO = cosd(O), sO = sind(O), cI = cosd(I), sI = sind(I);
    return {
      x: (co * cO - so * sO * cI) * xp + (-so * cO - co * sO * cI) * yp,
      y: (co * sO + so * cO * cI) * xp + (-so * sO + co * cO * cI) * yp,
      z: (so * sI) * xp + (co * sI) * yp
    };
  }
  function planetLon(name, T) {
    var p = helio(name, T), g = helio("earth", T);
    var lon = Math.atan2(p.y - g.y, p.x - g.x) / RAD;
    return norm(lon + 1.3969713 * T); // presesi J2000 -> ekuinoks tanggal
  }

  function lonAt(id, T) {
    if (id === "sun") return sunLon(T);
    if (id === "moon") return moonLon(T);
    return planetLon(id, T);
  }

  // ---------- Sudut: Ascendant & MC ----------
  function angles(jd, T, lat, lonEast) {
    var gmst = norm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
    var ramc = norm(gmst + lonEast);
    var eps = 23.4392911 - 0.0130042 * T;
    var asc = norm(Math.atan2(cosd(ramc), -(sind(ramc) * cosd(eps) + Math.tan(lat * RAD) * sind(eps))) / RAD);
    var mc = norm(Math.atan2(sind(ramc), cosd(ramc) * cosd(eps)) / RAD);
    return { asc: asc, mc: mc };
  }

  var RASI = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagitarius", "Capricorn", "Aquarius", "Pisces"];
  var RASI_SYM = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
  var ELEMEN = ["Api", "Tanah", "Udara", "Air"]; // Aries=Api, Taurus=Tanah, Gemini=Udara, Cancer=Air, berulang
  var KUALITAS = ["Kardinal", "Tetap", "Mutabel"];
  var PLANETS = [
    { id: "sun", n: "Matahari", s: "☉" }, { id: "moon", n: "Bulan", s: "☽" }, { id: "mercury", n: "Merkurius", s: "☿" },
    { id: "venus", n: "Venus", s: "♀" }, { id: "mars", n: "Mars", s: "♂" }, { id: "jupiter", n: "Jupiter", s: "♃" },
    { id: "saturn", n: "Saturnus", s: "♄" }, { id: "uranus", n: "Uranus", s: "♅" }, { id: "neptune", n: "Neptunus", s: "♆" },
    { id: "pluto", n: "Pluto", s: "♇" }
  ];
  var ASPEK = [
    { k: "Konjungsi", n: "Konjungsi", s: "☌", a: 0, orb: 8, sifat: "netral" },
    { k: "Sekstil", n: "Sekstil", s: "⚹", a: 60, orb: 5, sifat: "harmonis" },
    { k: "Kuadratur", n: "Kuadratur", s: "□", a: 90, orb: 7, sifat: "tegang" },
    { k: "Trigon", n: "Trigon", s: "△", a: 120, orb: 7, sifat: "harmonis" },
    { k: "Oposisi", n: "Oposisi", s: "☍", a: 180, orb: 8, sifat: "tegang" }
  ];
  function posisi(lon) {
    var r = Math.floor(lon / 30), deg = lon - r * 30, d = Math.floor(deg), m = Math.floor((deg - d) * 60);
    return { rasi: r, nama: RASI[r], sym: RASI_SYM[r], derajat: d, menit: m, teks: d + "°" + String(m).padStart(2, "0") + "′ " + RASI[r] };
  }

  /* input: { y, m, d, jam (0-23 atau null), menit, tz (jam, mis. 7), lat, lon } */
  function hitung(inp) {
    var adaJam = inp.jam !== null && inp.jam !== undefined;
    var h = adaJam ? inp.jam : 12, mi = adaJam ? (inp.menit || 0) : 0;
    var ms = Date.UTC(inp.y, inp.m - 1, inp.d, h, mi) - (inp.tz || 0) * 3600000;
    var c = hitungUTC(ms, inp.lat, inp.lon, adaJam);
    c.ms = ms; c.tz = inp.tz || 0;
    return c;
  }
  // bagan untuk satu momen UTC (milidetik)
  function hitungUTC(ms, lat, lonEast, adaJam) {
    var inp = { lat: lat, lon: lonEast };
    var jd = julianDay(ms), T = (jd - 2451545) / 36525, dT = 1 / 36525;
    var planets = PLANETS.map(function (p) {
      var lon = lonAt(p.id, T);
      var a = lonAt(p.id, T - dT / 2), b = lonAt(p.id, T + dT / 2);
      var speed = ((b - a + 540) % 360) - 180; // derajat per hari
      return { id: p.id, n: p.n, s: p.s, lon: lon, retro: speed < 0 && p.id !== "sun" && p.id !== "moon", pos: posisi(lon) };
    });
    var ang = null, ascRasi = null;
    if (adaJam && inp.lat !== undefined) {
      ang = angles(jd, T, inp.lat, inp.lon);
      ascRasi = Math.floor(ang.asc / 30);
      planets.forEach(function (p) { p.rumah = ((p.pos.rasi - ascRasi + 12) % 12) + 1; });
    }
    // aspek
    var aspek = [];
    for (var i = 0; i < planets.length; i++) for (var j = i + 1; j < planets.length; j++) {
      var diff = Math.abs(planets[i].lon - planets[j].lon); if (diff > 180) diff = 360 - diff;
      for (var k = 0; k < ASPEK.length; k++) {
        var A = ASPEK[k], orb = A.orb + ((planets[i].id === "sun" || planets[i].id === "moon") ? 1 : 0);
        if (Math.abs(diff - A.a) <= orb) { aspek.push({ p1: planets[i], p2: planets[j], jenis: A, orb: Math.abs(diff - A.a) }); break; }
      }
    }
    aspek.sort(function (x, y) { return x.orb - y.orb; });
    // keseimbangan elemen & kualitas (planet pribadi diberi bobot lebih)
    var bobot = { sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1, saturn: 1, uranus: 0.5, neptune: 0.5, pluto: 0.5 };
    var el = { Api: 0, Tanah: 0, Udara: 0, Air: 0 }, kw = { Kardinal: 0, Tetap: 0, Mutabel: 0 };
    planets.forEach(function (p) { el[ELEMEN[p.pos.rasi % 4]] += bobot[p.id]; kw[KUALITAS[p.pos.rasi % 3]] += bobot[p.id]; });
    if (ang) { el[ELEMEN[ascRasi % 4]] += 2; kw[KUALITAS[ascRasi % 3]] += 2; }
    return { planets: planets, angles: ang, ascRasi: ascRasi, aspek: aspek, elemen: el, kualitas: kw, adaJam: adaJam, jd: jd, lat: lat, lon: lonEast };
  }

  // ---------- Teks analisa ----------
  var GAYA = ["dengan berani dan spontan", "dengan tenang, sabar, dan stabil", "dengan lincah dan penuh rasa ingin tahu", "dengan perasaan dan naluri melindungi",
    "dengan percaya diri dan murah hati", "dengan teliti, praktis, dan rapi", "dengan seimbang, sopan, dan diplomatis", "dengan intens, setia, dan mendalam",
    "dengan optimis, jujur, dan bebas", "dengan disiplin, serius, dan ambisius", "dengan orisinal, mandiri, dan berpikiran maju", "dengan intuitif, lembut, dan penuh empati"];
  var BULAN_RASI = [
    "Emosi Anda cepat menyala dan cepat reda. Anda butuh tindakan dan tantangan agar merasa hidup, dan tidak suka menunggu.",
    "Anda merasa aman lewat kenyamanan, rutinitas, dan kestabilan materi. Perasaan Anda tenang, setia, dan tidak mudah goyah.",
    "Anda mengolah perasaan lewat obrolan dan pikiran. Suasana hati mudah berubah, dan Anda butuh teman bicara.",
    "Perasaan Anda sangat dalam dan peka. Keluarga dan rumah adalah sumber kekuatan batin Anda.",
    "Anda butuh dihargai dan diperhatikan. Hati Anda hangat, dramatis, dan murah hati kepada orang tersayang.",
    "Anda merasa tenang saat semuanya teratur. Anda menunjukkan sayang lewat bantuan nyata dan perhatian pada detail.",
    "Anda butuh keharmonisan dan teman. Konflik membuat Anda gelisah, dan Anda mudah menyesuaikan diri dengan orang lain.",
    "Emosi Anda intens dan tersimpan rapat. Anda sangat setia, tetapi sulit melupakan luka.",
    "Anda butuh kebebasan dan petualangan. Suasana hati Anda optimis dan cepat bangkit dari kesedihan.",
    "Anda menahan emosi dan tampak tegar. Rasa aman datang dari pencapaian dan kendali atas hidup sendiri.",
    "Anda mengolah perasaan dengan logika dan butuh ruang pribadi. Persahabatan sangat penting bagi Anda.",
    "Anda sangat peka, mudah tersentuh, dan berempati. Anda butuh waktu menyendiri untuk memulihkan energi."
  ];
  var ASC_RASI = [
    "Anda tampak energik, tegas, dan berani. Orang melihat Anda sebagai pemula yang siap bertindak.",
    "Anda tampak tenang, ramah, dan bisa diandalkan, dengan selera yang baik soal penampilan.",
    "Anda tampak ramah, cerdas, dan banyak bicara. Kesan awal Anda muda dan lincah.",
    "Anda tampak lembut, hangat, dan mengayomi. Orang merasa nyaman bercerita kepada Anda.",
    "Anda tampak percaya diri dan berkarisma. Kehadiran Anda mudah menarik perhatian.",
    "Anda tampak rapi, sopan, dan teliti. Orang melihat Anda sebagai pribadi yang cakap.",
    "Anda tampak menawan, anggun, dan menyenangkan. Anda pandai menjaga suasana.",
    "Anda tampak misterius, tajam, dan kuat. Orang merasakan kedalaman di balik ketenangan Anda.",
    "Anda tampak ceria, terbuka, dan penuh semangat. Kesan awal Anda bersahabat.",
    "Anda tampak serius, dewasa, dan berwibawa. Orang mempercayakan tanggung jawab kepada Anda.",
    "Anda tampak unik, ramah, dan sedikit berjarak. Orang melihat Anda berbeda dari yang lain.",
    "Anda tampak lembut, melamun, dan penuh pengertian. Aura Anda tenang dan artistik."
  ];
  var PLANET_MAKNA = {
    sun: "Jati diri dan tujuan hidup Anda diekspresikan",
    moon: "Perasaan dan kebutuhan batin Anda bergerak",
    mercury: "Anda berpikir dan berkomunikasi",
    venus: "Anda mencintai dan menikmati keindahan",
    mars: "Anda mengejar keinginan dan menghadapi tantangan",
    jupiter: "Keberuntungan dan pertumbuhan datang saat Anda bertindak",
    saturn: "Pelajaran hidup dan tanggung jawab hadir",
    uranus: "Generasi Anda membawa perubahan",
    neptune: "Generasi Anda bermimpi",
    pluto: "Generasi Anda mengalami transformasi"
  };
  var RUMAH = [
    "diri sendiri, penampilan, dan cara memulai sesuatu", "uang, harta, dan nilai diri", "komunikasi, saudara, dan belajar", "rumah, keluarga, dan akar",
    "cinta, kreativitas, dan anak", "pekerjaan harian dan kesehatan", "pasangan dan kerja sama", "transformasi, keuangan bersama, dan rahasia",
    "perjalanan jauh, pendidikan tinggi, dan keyakinan", "karier, reputasi, dan pencapaian", "teman, komunitas, dan harapan", "batin, spiritualitas, dan hal tersembunyi"
  ];
  var KATA = { sun: "jati diri", moon: "perasaan", mercury: "pikiran", venus: "cinta", mars: "energi", jupiter: "keberuntungan", saturn: "tanggung jawab", uranus: "kebebasan", neptune: "imajinasi", pluto: "kekuatan batin" };
  var ASPEK_ARTI = {
    "Konjungsi": "menyatu dan saling memperkuat. Kedua energi ini sangat menonjol dalam diri Anda.",
    "Sekstil": "bekerja sama dengan mudah. Ada peluang yang terbuka bila Anda mau memanfaatkannya.",
    "Kuadratur": "saling menekan. Ketegangan ini menjadi pendorong untuk tumbuh lewat usaha.",
    "Trigon": "mengalir harmonis. Ini adalah bakat alami yang terasa mudah bagi Anda.",
    "Oposisi": "saling tarik-menarik. Anda belajar menyeimbangkan dua kebutuhan yang berlawanan."
  };
  var ELEMEN_ARTI = {
    Api: "Elemen Api dominan: Anda bersemangat, spontan, dan suka memimpin.",
    Tanah: "Elemen Tanah dominan: Anda praktis, tekun, dan berpijak pada kenyataan.",
    Udara: "Elemen Udara dominan: Anda berpikir cepat, komunikatif, dan suka ide baru.",
    Air: "Elemen Air dominan: Anda peka, intuitif, dan digerakkan oleh perasaan."
  };
  var KUALITAS_ARTI = {
    Kardinal: "Kualitas Kardinal kuat: Anda suka memulai dan mengambil inisiatif.",
    Tetap: "Kualitas Tetap kuat: Anda teguh, setia, dan tuntas menyelesaikan sesuatu.",
    Mutabel: "Kualitas Mutabel kuat: Anda luwes dan mudah beradaptasi dengan perubahan."
  };

  var VENUS_RASI = [
    "Anda jatuh cinta dengan cepat dan terus terang. Anda suka mengejar, menyukai pasangan yang berani, dan bosan bila hubungan terlalu datar.",
    "Cinta bagi Anda adalah kesetiaan dan kenyamanan. Anda romantis lewat sentuhan, hadiah, dan makanan enak, serta sangat setia.",
    "Anda butuh pasangan yang enak diajak ngobrol. Rayuan lewat kata dan humor paling ampuh untuk Anda, dan Anda suka variasi.",
    "Anda mencintai dengan lembut dan melindungi. Rasa aman, keluarga, dan kehangatan rumah adalah bahasa cinta Anda.",
    "Anda mencintai dengan murah hati dan penuh drama manis. Anda ingin dipuja, dan Anda juga suka memanjakan pasangan.",
    "Anda menunjukkan cinta lewat perhatian kecil dan bantuan nyata. Anda pemilih, tetapi sangat setia setelah yakin.",
    "Anda mencintai keindahan, keseimbangan, dan sopan santun. Hubungan adalah pusat hidup Anda, dan Anda ingin pasangan yang setara.",
    "Cinta Anda dalam, intens, dan total. Anda sangat setia, tetapi butuh kejujuran penuh. Cemburu bisa muncul bila merasa terancam.",
    "Anda mencintai dengan riang dan bebas. Pasangan ideal adalah teman berpetualang yang juga sahabat diskusi.",
    "Anda serius dalam cinta dan mencari hubungan jangka panjang. Anda menunjukkan sayang lewat tanggung jawab dan komitmen.",
    "Anda butuh cinta yang juga persahabatan dan memberi ruang. Anda tertarik pada orang yang unik dan berpikiran terbuka.",
    "Anda romantis, penuh empati, dan rela berkorban. Anda mencari cinta yang terasa seperti takdir. Jaga batas agar tidak terluka."
  ];
  var MARS_RASI = [
    "Anda bertindak cepat dan langsung. Gairah dan keberanian besar, tetapi kesabaran perlu dilatih.",
    "Anda bergerak pelan tetapi tidak bisa dihentikan. Ketekunan adalah senjata utama Anda.",
    "Anda bertindak lewat kata dan ide. Energi Anda tersebar ke banyak hal sekaligus.",
    "Anda bertindak untuk melindungi orang tersayang. Emosi menjadi bahan bakar sekaligus titik lemah Anda.",
    "Anda bertindak dengan percaya diri dan ingin diakui. Semangat Anda menular ke orang lain.",
    "Anda bekerja rapi, efisien, dan detail. Anda mengubah energi menjadi hasil kerja yang nyata.",
    "Anda bertindak dengan menimbang dulu dan suka bekerja bersama. Anda menghindari konflik terbuka.",
    "Tekad Anda sangat kuat dan strategis. Anda jarang menyerah dan tahu kapan harus menyerang.",
    "Anda bertindak dengan optimis dan spontan. Petualangan dan tujuan besar membuat Anda bergairah.",
    "Anda ambisius, disiplin, dan sangat efektif. Anda membangun karier selangkah demi selangkah.",
    "Anda bergerak demi ide dan kebebasan. Anda suka cara baru dan tidak mau diatur secara kaku.",
    "Energi Anda bekerja lewat intuisi dan empati. Anda lebih kuat saat berjuang untuk orang lain atau untuk karya seni."
  ];
  var R7_RASI = [
    "Anda tertarik pada pasangan yang berani, mandiri, dan bersemangat.", "Anda tertarik pada pasangan yang tenang, setia, dan mapan.",
    "Anda tertarik pada pasangan yang cerdas, lucu, dan komunikatif.", "Anda tertarik pada pasangan yang penyayang dan berorientasi keluarga.",
    "Anda tertarik pada pasangan yang percaya diri dan berkarisma.", "Anda tertarik pada pasangan yang rapi, perhatian, dan bisa diandalkan.",
    "Anda tertarik pada pasangan yang menawan, adil, dan berselera baik.", "Anda tertarik pada pasangan yang intens, setia, dan penuh misteri.",
    "Anda tertarik pada pasangan yang optimis, jujur, dan suka berpetualang.", "Anda tertarik pada pasangan yang dewasa, ambisius, dan bertanggung jawab.",
    "Anda tertarik pada pasangan yang unik, bebas, dan berwawasan luas.", "Anda tertarik pada pasangan yang lembut, artistik, dan penuh empati."
  ];
  var MC_RASI = [
    "Karier terbaik Anda menuntut keberanian dan kepemimpinan: wirausaha, olahraga, militer, atau merintis bidang baru.",
    "Karier terbaik Anda membangun nilai nyata: keuangan, properti, kuliner, seni, desain, atau kecantikan.",
    "Karier terbaik Anda di dunia informasi: media, penulisan, pemasaran, penjualan, mengajar, atau transportasi.",
    "Karier terbaik Anda memberi rasa aman bagi orang lain: perawatan, properti, kuliner, pendidikan, atau usaha keluarga.",
    "Karier terbaik Anda membuat Anda tampil: hiburan, kepemimpinan, seni, politik, atau pekerjaan yang dikenal publik.",
    "Karier terbaik Anda menuntut keahlian dan ketelitian: kesehatan, analisis, administrasi, teknologi, atau editing.",
    "Karier terbaik Anda melibatkan kerja sama dan estetika: hukum, desain, diplomasi, konsultasi, atau hubungan masyarakat.",
    "Karier terbaik Anda menyentuh hal yang dalam: riset, psikologi, investigasi, keuangan, kedokteran, atau manajemen krisis.",
    "Karier terbaik Anda memperluas wawasan: pendidikan tinggi, penerbitan, hukum, pariwisata, atau bisnis internasional.",
    "Karier terbaik Anda membangun reputasi jangka panjang: manajemen, pemerintahan, teknik, atau korporasi besar.",
    "Karier terbaik Anda mengubah keadaan: teknologi, sains, kegiatan sosial, inovasi, atau organisasi komunitas.",
    "Karier terbaik Anda melayani dan menginspirasi: seni, musik, film, penyembuhan, spiritual, atau kerja kemanusiaan."
  ];
  var SAT_RASI = [
    "Pelajaran Anda: sabar memimpin dan tidak bertindak gegabah. Kesuksesan datang setelah belajar mengendalikan diri.",
    "Pelajaran Anda: membangun rasa aman finansial dengan disiplin, bukan dengan rasa takut kekurangan.",
    "Pelajaran Anda: berbicara dengan yakin dan fokus mendalami satu keahlian.",
    "Pelajaran Anda: menyeimbangkan tanggung jawab keluarga dan ambisi pribadi.",
    "Pelajaran Anda: berani tampil dan berkarya tanpa takut dinilai orang.",
    "Pelajaran Anda: bekerja teliti tanpa menjadi perfeksionis yang menyiksa diri.",
    "Pelajaran Anda: membangun hubungan dan kerja sama yang adil dan berkomitmen.",
    "Pelajaran Anda: mempercayai orang lain dan mengelola keuangan bersama dengan bijak.",
    "Pelajaran Anda: membangun keyakinan dan ilmu yang matang, bukan sekadar pendapat.",
    "Pelajaran Anda: memegang tanggung jawab besar. Karier Anda kuat bila dibangun dengan sabar.",
    "Pelajaran Anda: mewujudkan ide besar menjadi sesuatu yang nyata dan berguna bagi banyak orang.",
    "Pelajaran Anda: memberi bentuk pada intuisi dan menjaga batas diri saat menolong orang."
  ];
  var JUP_RASI = [
    "Keberuntungan datang saat Anda berani memulai dan mengambil inisiatif.", "Keberuntungan datang lewat kesabaran, tabungan, dan aset nyata.",
    "Keberuntungan datang lewat jaringan, komunikasi, dan belajar hal baru.", "Keberuntungan datang lewat keluarga, rumah, dan rasa peduli.",
    "Keberuntungan datang saat Anda tampil, berkarya, dan bermurah hati.", "Keberuntungan datang lewat kerja yang rapi dan pelayanan yang tulus.",
    "Keberuntungan datang lewat pasangan, mitra, dan kerja sama.", "Keberuntungan datang lewat keuangan bersama, riset, dan keberanian berubah.",
    "Keberuntungan datang lewat perjalanan, pendidikan, dan keyakinan.", "Keberuntungan datang lewat kerja keras dan reputasi yang baik.",
    "Keberuntungan datang lewat komunitas, teman, dan ide inovatif.", "Keberuntungan datang lewat intuisi, kebaikan hati, dan kegiatan spiritual."
  ];
  // potongan kalimat (diterjemahkan lewat setLang)
  var S = {
    diRasi: "{p} di {r}", diRumah: "{p} di rumah {n}", rumahN: ", rumah {n}", perkiraan: " (perkiraan)", retroTag: " (retrograde)",
    fokusHidup: " Fokus hidup Anda ada di rumah {n}: {u}.", ascJudul: "Ascendant {r}", mcArah: " MC di {r} menunjukkan arah karier: {g}.", gayaPrefix: "dengan ",
    energiRumah: " Energi ini paling terasa dalam urusan {u}.", retroIsi: " Retrograde membuat energinya lebih ke dalam dan reflektif.",
    aspJudul: "{a} {j} {b}", aspIsi: "Unsur {a} dan {b} {arti} (orb {o}°)",
    elKurang: "Elemen {e} paling sedikit. Kegiatan yang bersifat {k} membantu menyeimbangkan diri Anda.",
    elNama: { Api: "Api", Tanah: "Tanah", Udara: "Udara", Air: "Air" },
    elKegiatan: { Api: "aktif dan berani", Tanah: "membumi dan teratur", Udara: "sosial dan intelektual", Air: "emosional dan reflektif" },
    trIsi: "{t} transit {tema} {k} Anda ({n} natal di {r}). {nada} Berlangsung {lama}.",
    trSudut: "{t} transit {tema} {k} Anda. {nada} Berlangsung {lama}.",
    citraDiri: "citra diri dan penampilan", karierRep: "karier dan reputasi", ascNama: "Ascendant", mcNama: "MC",
    sinGenerik: "Unsur {a} Anda dan {b} pasangan {arti}",
    sinAsc: "{q} satu orang jatuh di Ascendant yang lain: ada rasa langsung cocok sejak pertemuan pertama.",
    hub: { sama: "sama", lengkap: "saling melengkapi", beda: "berbeda" },
    srAsc: "Ascendant tahunan {r}", srSun: "Fokus utama tahun ini ada pada urusan {u}.", srMoon: "Kebutuhan emosional tahun ini terasa dalam urusan {u}. ",
    srJup: "Keberuntungan tahun ini paling mudah datang lewat {u}.", srSat: "Pelajaran dan kerja keras tahun ini ada pada {u}.",
    rumah7: "Rumah 7 (pasangan) di {r}", mcJudul: "MC (puncak karier) di {r}",
    r10: "Planet di rumah karier: {p}", r10Isi: "Planet di rumah 10 membuat karier dan nama baik menjadi bagian penting hidup Anda. Anda berpeluang dikenal luas lewat pekerjaan.",
    r2: "Planet di rumah uang: {p}", r2Isi: "Planet di rumah 2 membuat urusan penghasilan dan harta sangat menonjol. Anda punya bakat menghasilkan uang dari keahlian sendiri.",
    prSunJ: "Matahari progresi di {r}", prMoonJ: "Bulan progresi di {r}", prFaseJ: "Fase Bulan progresi: {f}", prAscJ: "Ascendant progresi di {r}", prMcJ: "MC progresi di {r}", prVenJ: "Venus progresi di {r}",
    prPindah: "Matahari progresi Anda sudah pindah dari {a} ke {b} sekitar usia {u}.", prSunBerikut: "Matahari progresi masuk {r} sekitar usia {u}.",
    prSorot: "Bab ini paling terasa dalam urusan {u}.", prMoonRumah: "Selama sekitar dua setengah tahun, perasaan Anda banyak tertuju pada {u}.",
    prMoonPindah: "Berikutnya Bulan progresi masuk {r}, dan suasana hati Anda ikut berganti.",
    prAscIsi: "Cara Anda tampil dan memulai sesuatu sedang bergeser.", prMcIsi: "Arah karier yang sedang berkembang:",
    prRetroVen: "Venus progresi yang retrograde membuat Anda menilai ulang cinta dan nilai-nilai lama.",
    prAspIsi: "{p} progresi {tema} {k} Anda ({n} natal). {nada} Pengaruhnya terasa {lama}.", prLama: "sekitar satu sampai dua tahun", prLamaMoon: "sekitar dua bulan",
    kpSunJ: "Matahari komposit di {r}", kpMoonJ: "Bulan komposit di {r}", kpVenJ: "Venus komposit di {r}", kpMarJ: "Mars komposit di {r}", kpAscJ: "Ascendant komposit di {r}", kpElJ: "Elemen hubungan",
    kpRumah: "Hubungan ini paling hidup dalam urusan {u}.", kpMarIsi: "Kalian mengejar tujuan bersama {g}. Cara kalian berselisih juga mengikuti gaya ini.",
    kpAspIsi: "Unsur {a} dan {b} {arti} (orb {o}°)",
    lrAscJ: "Ascendant bulanan {r}", lrSun: "Energi dan perhatian utama bulan ini mengarah ke urusan {u}.", lrVen: "Kesenangan, cinta, dan rezeki kecil bulan ini datang lewat {u}.",
    lrMar: "Dorongan dan potensi gesekan bulan ini ada pada {u}. Salurkan energi ini dengan sadar.",
    lrAspIsi: "Bulan menyentuh {k} Anda bulan ini. {nada}",
    pfRumahJ: "Tahun rumah {n} ({r})", pfTuanJ: "Penguasa tahun: {p}", pfTuanPos: "Dalam bagan lahir, {p} ada di {r} rumah {n}, jadi peristiwa tahun ini banyak datang lewat {u}.",
    pfRetro: "Karena planet ini lahir dalam keadaan retrograde, tahun ini lebih banyak berisi peninjauan ulang daripada langkah baru.",
    pfAktifJ: "Planet yang aktif: {p}", pfAktifIsi: "{p} ada di rumah ini sejak lahir, jadi urusan {k} ikut menonjol tahun ini.",
    pfKosongJ: "Tidak ada planet lahir di rumah ini", pfKosongIsi: "Rumah yang kosong bukan berarti tahun yang sepi. Pengaruh tahun ini dibawa terutama oleh penguasa tahun di atas."
  };
  function F(tpl, v) { return tpl.replace(/\{(\w+)\}/g, function (_, k) { return v[k] !== undefined ? v[k] : ""; }); }

  function analisa(c) {
    var by = {}; c.planets.forEach(function (p) { by[p.id] = p; });
    var out = { inti: [], planet: [], aspek: [], keseimbangan: [] };
    out.inti.push({ judul: F(S.diRasi, { p: by.sun.n, r: by.sun.pos.nama }), isi: PLANET_MAKNA.sun + " " + GAYA[by.sun.pos.rasi] + "." + (by.sun.rumah ? F(S.fokusHidup, { n: by.sun.rumah, u: RUMAH[by.sun.rumah - 1] }) : "") });
    out.inti.push({ judul: F(S.diRasi, { p: by.moon.n, r: by.moon.pos.nama }) + (c.adaJam ? "" : S.perkiraan), isi: BULAN_RASI[by.moon.pos.rasi] });
    if (c.angles) out.inti.push({ judul: F(S.ascJudul, { r: posisi(c.angles.asc).nama }), isi: ASC_RASI[Math.floor(c.angles.asc / 30)] + F(S.mcArah, { r: posisi(c.angles.mc).nama, g: GAYA[Math.floor(c.angles.mc / 30)].replace(S.gayaPrefix, "") }) });
    ["mercury", "venus", "mars", "jupiter", "saturn"].forEach(function (id) {
      var p = by[id];
      out.planet.push({ judul: F(S.diRasi, { p: p.n, r: p.pos.nama }) + (p.rumah ? F(S.rumahN, { n: p.rumah }) : "") + (p.retro ? S.retroTag : ""),
        isi: PLANET_MAKNA[id] + " " + GAYA[p.pos.rasi] + "." + (p.rumah ? F(S.energiRumah, { u: RUMAH[p.rumah - 1] }) : "") + (p.retro ? S.retroIsi : "") });
    });
    c.aspek.filter(function (a) { return ["uranus", "neptune", "pluto"].indexOf(a.p1.id) < 0 || ["uranus", "neptune", "pluto"].indexOf(a.p2.id) < 0; })
      .slice(0, 6).forEach(function (a) {
        out.aspek.push({ judul: F(S.aspJudul, { a: a.p1.n, j: a.jenis.n.toLowerCase(), b: a.p2.n }), sifat: a.jenis.sifat,
          isi: F(S.aspIsi, { a: KATA[a.p1.id], b: KATA[a.p2.id], arti: ASPEK_ARTI[a.jenis.k], o: a.orb.toFixed(1) }) });
      });
    var maxEl = Object.keys(c.elemen).sort(function (a, b) { return c.elemen[b] - c.elemen[a]; })[0];
    var minEl = Object.keys(c.elemen).sort(function (a, b) { return c.elemen[a] - c.elemen[b]; })[0];
    var maxKw = Object.keys(c.kualitas).sort(function (a, b) { return c.kualitas[b] - c.kualitas[a]; })[0];
    out.keseimbangan.push(ELEMEN_ARTI[maxEl], KUALITAS_ARTI[maxKw]);
    if (c.elemen[minEl] <= 2) out.keseimbangan.push(F(S.elKurang, { e: S.elNama[minEl], k: S.elKegiatan[minEl] }));
    // cinta & karier
    out.cinta = [
      { judul: F(S.diRasi, { p: by.venus.n, r: by.venus.pos.nama }), isi: VENUS_RASI[by.venus.pos.rasi] },
      { judul: F(S.diRasi, { p: by.mars.n, r: by.mars.pos.nama }), isi: MARS_RASI[by.mars.pos.rasi] }
    ];
    if (c.angles) out.cinta.push({ judul: F(S.rumah7, { r: RASI[(c.ascRasi + 6) % 12] }), isi: R7_RASI[(c.ascRasi + 6) % 12] });
    out.karier = [];
    if (c.angles) out.karier.push({ judul: F(S.mcJudul, { r: posisi(c.angles.mc).nama }), isi: MC_RASI[Math.floor(c.angles.mc / 30)] });
    out.karier.push({ judul: F(S.diRasi, { p: by.saturn.n, r: by.saturn.pos.nama }), isi: SAT_RASI[by.saturn.pos.rasi] });
    out.karier.push({ judul: F(S.diRasi, { p: by.jupiter.n, r: by.jupiter.pos.nama }), isi: JUP_RASI[by.jupiter.pos.rasi] });
    if (c.angles) {
      var r10 = c.planets.filter(function (p) { return p.rumah === 10; }), r2 = c.planets.filter(function (p) { return p.rumah === 2; });
      if (r10.length) out.karier.push({ judul: F(S.r10, { p: r10.map(function (p) { return p.n; }).join(", ") }), isi: S.r10Isi });
      if (r2.length) out.karier.push({ judul: F(S.r2, { p: r2.map(function (p) { return p.n; }).join(", ") }), isi: S.r2Isi });
    }
    return out;
  }

  // ---------- Kota lahir (daftar cadangan; pencarian seluruh dunia ada di halaman) ----------
  // [nama, wilayah, negara, lintang, bujur, zona waktu IANA]
  var J = "Asia/Jakarta", M = "Asia/Makassar", P = "Asia/Jayapura";
  var KOTA = [
    ["Jakarta", "DKI Jakarta", "Indonesia", -6.2, 106.82, J], ["Bandung", "Jawa Barat", "Indonesia", -6.91, 107.61, J], ["Bekasi", "Jawa Barat", "Indonesia", -6.24, 106.99, J],
    ["Bogor", "Jawa Barat", "Indonesia", -6.6, 106.8, J], ["Depok", "Jawa Barat", "Indonesia", -6.4, 106.82, J], ["Cirebon", "Jawa Barat", "Indonesia", -6.71, 108.56, J],
    ["Sukabumi", "Jawa Barat", "Indonesia", -6.92, 106.93, J], ["Tasikmalaya", "Jawa Barat", "Indonesia", -7.33, 108.22, J], ["Karawang", "Jawa Barat", "Indonesia", -6.31, 107.3, J],
    ["Tangerang", "Banten", "Indonesia", -6.18, 106.63, J], ["Serang", "Banten", "Indonesia", -6.12, 106.15, J], ["Cilegon", "Banten", "Indonesia", -6.02, 106.06, J],
    ["Semarang", "Jawa Tengah", "Indonesia", -6.97, 110.42, J], ["Surakarta (Solo)", "Jawa Tengah", "Indonesia", -7.57, 110.82, J], ["Magelang", "Jawa Tengah", "Indonesia", -7.47, 110.22, J],
    ["Purwokerto", "Jawa Tengah", "Indonesia", -7.42, 109.23, J], ["Tegal", "Jawa Tengah", "Indonesia", -6.87, 109.14, J], ["Pekalongan", "Jawa Tengah", "Indonesia", -6.89, 109.67, J],
    ["Kudus", "Jawa Tengah", "Indonesia", -6.8, 110.84, J], ["Salatiga", "Jawa Tengah", "Indonesia", -7.33, 110.5, J], ["Yogyakarta", "DI Yogyakarta", "Indonesia", -7.8, 110.36, J],
    ["Surabaya", "Jawa Timur", "Indonesia", -7.25, 112.75, J], ["Malang", "Jawa Timur", "Indonesia", -7.98, 112.63, J], ["Kediri", "Jawa Timur", "Indonesia", -7.82, 112.01, J],
    ["Madiun", "Jawa Timur", "Indonesia", -7.63, 111.52, J], ["Jember", "Jawa Timur", "Indonesia", -8.17, 113.7, J], ["Sidoarjo", "Jawa Timur", "Indonesia", -7.45, 112.72, J],
    ["Blitar", "Jawa Timur", "Indonesia", -8.1, 112.17, J], ["Probolinggo", "Jawa Timur", "Indonesia", -7.75, 113.22, J], ["Banyuwangi", "Jawa Timur", "Indonesia", -8.22, 114.37, J],
    ["Banda Aceh", "Aceh", "Indonesia", 5.55, 95.32, J], ["Lhokseumawe", "Aceh", "Indonesia", 5.18, 97.15, J], ["Medan", "Sumatera Utara", "Indonesia", 3.59, 98.67, J],
    ["Pematangsiantar", "Sumatera Utara", "Indonesia", 2.96, 99.06, J], ["Binjai", "Sumatera Utara", "Indonesia", 3.6, 98.49, J], ["Padang", "Sumatera Barat", "Indonesia", -0.95, 100.35, J],
    ["Bukittinggi", "Sumatera Barat", "Indonesia", -0.31, 100.37, J], ["Pekanbaru", "Riau", "Indonesia", 0.51, 101.45, J], ["Dumai", "Riau", "Indonesia", 1.67, 101.45, J],
    ["Batam", "Kepulauan Riau", "Indonesia", 1.13, 104.05, J], ["Tanjung Pinang", "Kepulauan Riau", "Indonesia", 0.92, 104.45, J], ["Jambi", "Jambi", "Indonesia", -1.61, 103.61, J],
    ["Palembang", "Sumatera Selatan", "Indonesia", -2.98, 104.76, J], ["Bengkulu", "Bengkulu", "Indonesia", -3.8, 102.27, J], ["Bandar Lampung", "Lampung", "Indonesia", -5.43, 105.26, J],
    ["Pangkal Pinang", "Bangka Belitung", "Indonesia", -2.13, 106.11, J], ["Pontianak", "Kalimantan Barat", "Indonesia", -0.03, 109.33, J], ["Singkawang", "Kalimantan Barat", "Indonesia", 0.91, 108.98, J],
    ["Palangka Raya", "Kalimantan Tengah", "Indonesia", -2.21, 113.92, J], ["Sampit", "Kalimantan Tengah", "Indonesia", -2.54, 112.95, J],
    ["Denpasar", "Bali", "Indonesia", -8.65, 115.22, M], ["Singaraja", "Bali", "Indonesia", -8.11, 115.09, M], ["Mataram", "NTB", "Indonesia", -8.58, 116.12, M],
    ["Bima", "NTB", "Indonesia", -8.46, 118.73, M], ["Kupang", "NTT", "Indonesia", -10.18, 123.6, M], ["Maumere", "NTT", "Indonesia", -8.62, 122.21, M],
    ["Banjarmasin", "Kalimantan Selatan", "Indonesia", -3.32, 114.59, M], ["Balikpapan", "Kalimantan Timur", "Indonesia", -1.27, 116.83, M], ["Samarinda", "Kalimantan Timur", "Indonesia", -0.5, 117.15, M],
    ["Tarakan", "Kalimantan Utara", "Indonesia", 3.3, 117.63, M], ["Makassar", "Sulawesi Selatan", "Indonesia", -5.14, 119.42, M], ["Parepare", "Sulawesi Selatan", "Indonesia", -4.01, 119.62, M],
    ["Manado", "Sulawesi Utara", "Indonesia", 1.47, 124.84, M], ["Bitung", "Sulawesi Utara", "Indonesia", 1.44, 125.19, M], ["Palu", "Sulawesi Tengah", "Indonesia", -0.9, 119.87, M],
    ["Kendari", "Sulawesi Tenggara", "Indonesia", -3.97, 122.51, M], ["Gorontalo", "Gorontalo", "Indonesia", 0.54, 123.06, M], ["Mamuju", "Sulawesi Barat", "Indonesia", -2.68, 118.89, M],
    ["Ambon", "Maluku", "Indonesia", -3.7, 128.18, P], ["Ternate", "Maluku Utara", "Indonesia", 0.79, 127.38, P], ["Sorong", "Papua Barat Daya", "Indonesia", -0.88, 131.25, P],
    ["Manokwari", "Papua Barat", "Indonesia", -0.86, 134.06, P], ["Jayapura", "Papua", "Indonesia", -2.53, 140.72, P], ["Merauke", "Papua Selatan", "Indonesia", -8.49, 140.4, P],
    ["Timika", "Papua Tengah", "Indonesia", -4.55, 136.89, P],
    ["Singapura", "", "Singapura", 1.35, 103.82, "Asia/Singapore"], ["Kuala Lumpur", "", "Malaysia", 3.14, 101.69, "Asia/Kuala_Lumpur"], ["Johor Bahru", "Johor", "Malaysia", 1.49, 103.74, "Asia/Kuala_Lumpur"],
    ["Penang", "Pulau Pinang", "Malaysia", 5.41, 100.33, "Asia/Kuala_Lumpur"], ["Kuching", "Sarawak", "Malaysia", 1.55, 110.35, "Asia/Kuching"], ["Bandar Seri Begawan", "", "Brunei", 4.9, 114.94, "Asia/Brunei"],
    ["Dili", "", "Timor Leste", -8.56, 125.57, "Asia/Dili"], ["Bangkok", "", "Thailand", 13.76, 100.5, "Asia/Bangkok"], ["Manila", "", "Filipina", 14.6, 120.98, "Asia/Manila"],
    ["Ho Chi Minh", "", "Vietnam", 10.82, 106.63, "Asia/Ho_Chi_Minh"], ["Hanoi", "", "Vietnam", 21.03, 105.85, "Asia/Bangkok"], ["Phnom Penh", "", "Kamboja", 11.56, 104.92, "Asia/Phnom_Penh"],
    ["Yangon", "", "Myanmar", 16.87, 96.2, "Asia/Yangon"], ["Hong Kong", "", "Hong Kong", 22.32, 114.17, "Asia/Hong_Kong"], ["Taipei", "", "Taiwan", 25.03, 121.57, "Asia/Taipei"],
    ["Beijing", "", "Tiongkok", 39.9, 116.4, "Asia/Shanghai"], ["Shanghai", "", "Tiongkok", 31.23, 121.47, "Asia/Shanghai"], ["Guangzhou", "", "Tiongkok", 23.13, 113.26, "Asia/Shanghai"],
    ["Xiamen", "Fujian", "Tiongkok", 24.48, 118.09, "Asia/Shanghai"], ["Tokyo", "", "Jepang", 35.68, 139.69, "Asia/Tokyo"], ["Osaka", "", "Jepang", 34.69, 135.5, "Asia/Tokyo"],
    ["Seoul", "", "Korea Selatan", 37.57, 126.98, "Asia/Seoul"], ["New Delhi", "", "India", 28.61, 77.21, "Asia/Kolkata"], ["Mumbai", "", "India", 19.08, 72.88, "Asia/Kolkata"],
    ["Dubai", "", "Uni Emirat Arab", 25.2, 55.27, "Asia/Dubai"], ["Riyadh", "", "Arab Saudi", 24.71, 46.68, "Asia/Riyadh"], ["Mekkah", "", "Arab Saudi", 21.39, 39.86, "Asia/Riyadh"],
    ["Jeddah", "", "Arab Saudi", 21.49, 39.19, "Asia/Riyadh"], ["Doha", "", "Qatar", 25.29, 51.53, "Asia/Qatar"], ["Istanbul", "", "Turki", 41.01, 28.98, "Europe/Istanbul"],
    ["Kairo", "", "Mesir", 30.04, 31.24, "Africa/Cairo"], ["Sydney", "NSW", "Australia", -33.87, 151.21, "Australia/Sydney"], ["Melbourne", "Victoria", "Australia", -37.81, 144.96, "Australia/Melbourne"],
    ["Perth", "WA", "Australia", -31.95, 115.86, "Australia/Perth"], ["Brisbane", "Queensland", "Australia", -27.47, 153.03, "Australia/Brisbane"], ["Darwin", "NT", "Australia", -12.46, 130.84, "Australia/Darwin"],
    ["Auckland", "", "Selandia Baru", -36.85, 174.76, "Pacific/Auckland"], ["London", "Inggris", "Britania Raya", 51.51, -0.13, "Europe/London"], ["Amsterdam", "", "Belanda", 52.37, 4.9, "Europe/Amsterdam"],
    ["Den Haag", "", "Belanda", 52.08, 4.3, "Europe/Amsterdam"], ["Paris", "", "Prancis", 48.86, 2.35, "Europe/Paris"], ["Berlin", "", "Jerman", 52.52, 13.4, "Europe/Berlin"],
    ["Frankfurt", "", "Jerman", 50.11, 8.68, "Europe/Berlin"], ["Madrid", "", "Spanyol", 40.42, -3.7, "Europe/Madrid"], ["Roma", "", "Italia", 41.9, 12.5, "Europe/Rome"],
    ["Zurich", "", "Swiss", 47.38, 8.54, "Europe/Zurich"], ["Moskwa", "", "Rusia", 55.76, 37.62, "Europe/Moscow"], ["New York", "New York", "Amerika Serikat", 40.71, -74.01, "America/New_York"],
    ["Los Angeles", "California", "Amerika Serikat", 34.05, -118.24, "America/Los_Angeles"], ["San Francisco", "California", "Amerika Serikat", 37.77, -122.42, "America/Los_Angeles"],
    ["Chicago", "Illinois", "Amerika Serikat", 41.88, -87.63, "America/Chicago"], ["Houston", "Texas", "Amerika Serikat", 29.76, -95.37, "America/Chicago"],
    ["Toronto", "Ontario", "Kanada", 43.65, -79.38, "America/Toronto"], ["Vancouver", "British Columbia", "Kanada", 49.28, -123.12, "America/Vancouver"],
    ["Mexico City", "", "Meksiko", 19.43, -99.13, "America/Mexico_City"], ["Sao Paulo", "", "Brasil", -23.55, -46.63, "America/Sao_Paulo"], ["Buenos Aires", "", "Argentina", -34.6, -58.38, "America/Argentina/Buenos_Aires"],
    ["Johannesburg", "", "Afrika Selatan", -26.2, 28.05, "Africa/Johannesburg"], ["Lagos", "", "Nigeria", 6.52, 3.38, "Africa/Lagos"]
  ].map(function (k) { return { n: k[0], wil: k[1], neg: k[2], lat: k[3], lon: k[4], zona: k[5] }; });

  function bedaSudut(a, b) { var d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; }
  function cariAspek(l1, l2, orbMax) {
    var diff = bedaSudut(l1, l2);
    for (var k = 0; k < ASPEK.length; k++) { var o = Math.abs(diff - ASPEK[k].a); if (o <= orbMax) return { jenis: ASPEK[k], orb: o }; }
    return null;
  }

  // ---------- Transit: planet hari ini terhadap bagan kelahiran ----------
  var TR_ORB = { sun: 2, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 2, saturn: 2, uranus: 1.5, neptune: 1.5, pluto: 1.5 };
  var TR_TEMA = {
    sun: "menyorot", moon: "menyentuh suasana hati soal", mercury: "membawa banyak pikiran dan obrolan soal", venus: "membawa suasana manis pada",
    mars: "memberi dorongan energi pada", jupiter: "membuka peluang dan pertumbuhan pada", saturn: "menguji dan mematangkan",
    uranus: "membawa perubahan mendadak pada", neptune: "membawa inspirasi sekaligus kebingungan pada", pluto: "mengubah secara mendalam"
  };
  var TR_LAMA = { sun: "sekitar 2–3 hari", moon: "beberapa jam", mercury: "2–4 hari", venus: "2–4 hari", mars: "sekitar seminggu", jupiter: "beberapa minggu", saturn: "1–3 bulan", uranus: "beberapa bulan", neptune: "beberapa bulan", pluto: "berbulan-bulan" };
  var NADA = { harmonis: "Pengaruhnya mendukung, manfaatkan untuk melangkah.", tegang: "Pengaruhnya menantang, jalani dengan sabar dan jangan terburu-buru.", netral: "Pengaruhnya sangat terasa, arahkan ke hal yang positif." };
  function transit(natal, ms, lat, lonEast) {
    var now = hitungUTC(ms, lat, lonEast, false), hasil = [];
    now.planets.forEach(function (t) {
      if (natal.ascRasi !== null) t.rumahNatal = ((t.pos.rasi - natal.ascRasi + 12) % 12) + 1;
      natal.planets.forEach(function (n) {
        var a = cariAspek(t.lon, n.lon, TR_ORB[t.id]); if (!a) return;
        hasil.push({ t: t, n: n, jenis: a.jenis, orb: a.orb, bobot: ({ pluto: 6, neptune: 5, uranus: 5, saturn: 5, jupiter: 4, mars: 3, sun: 2, venus: 2, mercury: 2, moon: 1 })[t.id] * (a.jenis.a === 0 ? 1.2 : 1) - a.orb,
          isi: F(S.trIsi, { t: t.n, tema: TR_TEMA[t.id], k: KATA[n.id], n: n.n, r: n.pos.nama, nada: NADA[a.jenis.sifat], lama: TR_LAMA[t.id] }) });
      });
    });
    natal.angles && ["asc", "mc"].forEach(function (k) {
      now.planets.forEach(function (t) {
        if (["jupiter", "saturn", "uranus", "neptune", "pluto"].indexOf(t.id) < 0) return;
        var a = cariAspek(t.lon, natal.angles[k], 1.5); if (!a) return;
        hasil.push({ t: t, n: { id: k, n: k === "asc" ? S.ascNama : S.mcNama }, jenis: a.jenis, orb: a.orb, bobot: 6 - a.orb,
          isi: F(S.trSudut, { t: t.n, tema: TR_TEMA[t.id], k: k === "asc" ? S.citraDiri : S.karierRep, nada: NADA[a.jenis.sifat], lama: TR_LAMA[t.id] }) });
      });
    });
    hasil.sort(function (a, b) { return b.bobot - a.bobot; });
    return { planets: now.planets, aspek: hasil };
  }

  // ---------- Sinastri: kecocokan dua bagan ----------
  var PASANGAN = {
    "sun-moon": ["Matahari dan Bulan saling bertemu: tanda klasik pasangan yang saling memahami secara alami.", "Matahari dan Bulan saling menekan: kebutuhan hati satu orang sering berbenturan dengan ego yang lain."],
    "venus-mars": ["Venus dan Mars bertemu: ketertarikan romantis dan fisik yang kuat.", "Venus dan Mars bergesekan: ketertarikannya kuat, tetapi mudah memicu pertengkaran."],
    "moon-moon": ["Bulan dan Bulan selaras: suasana hati kalian mudah nyambung dan nyaman bersama.", "Bulan dan Bulan bertentangan: cara kalian mengolah perasaan berbeda, perlu saling memahami."],
    "mercury-mercury": ["Merkurius dan Merkurius selaras: obrolan kalian mengalir dan mudah sepakat.", "Merkurius dan Merkurius bertentangan: sering salah paham, biasakan bicara pelan dan jelas."],
    "sun-sun": ["Matahari dan Matahari selaras: tujuan hidup dan semangat kalian searah.", "Matahari dan Matahari bertentangan: dua ego kuat yang perlu saling memberi ruang."],
    "venus-venus": ["Venus dan Venus selaras: selera, cara menyayangi, dan hobi kalian mirip.", "Venus dan Venus bertentangan: cara menunjukkan sayang berbeda, perlu dibicarakan."],
    "moon-venus": ["Bulan dan Venus bertemu: hubungan yang lembut, hangat, dan penuh perhatian.", "Bulan dan Venus bergesekan: kasih sayang ada, tetapi harapan sering tidak terucap."],
    "saturn-sun": ["Saturnus menyentuh Matahari: hubungan serius yang membangun komitmen jangka panjang.", "Saturnus menekan Matahari: satu pihak bisa merasa dikekang atau terlalu diatur."],
    "saturn-moon": ["Saturnus menyentuh Bulan: rasa aman dan kesetiaan yang tumbuh perlahan.", "Saturnus menekan Bulan: perasaan bisa terasa dingin, perlu kehangatan ekstra."],
    "saturn-venus": ["Saturnus menyentuh Venus: cinta yang setia dan tahan lama.", "Saturnus menekan Venus: cinta diuji oleh tanggung jawab dan jarak emosional."],
    "jupiter-sun": ["Jupiter menyentuh Matahari: saling membawa keberuntungan dan optimisme.", "Jupiter menekan Matahari: saling memanjakan, hati-hati berlebihan."],
    "jupiter-venus": ["Jupiter menyentuh Venus: hubungan yang murah hati dan menyenangkan.", "Jupiter menekan Venus: senang-senang berlebihan, jaga keuangan bersama."],
    "mars-mars": ["Mars dan Mars selaras: semangat kalian cocok untuk bekerja dan bergerak bersama.", "Mars dan Mars bertentangan: sama-sama keras, rawan adu argumen."],
    "mars-sun": ["Mars dan Matahari bertemu: saling memacu semangat dan keberanian.", "Mars dan Matahari bergesekan: persaingan dan emosi mudah tersulut."],
    "mars-moon": ["Mars dan Bulan bertemu: hubungan yang bergairah dan protektif.", "Mars dan Bulan bergesekan: satu pihak bisa merasa disakiti oleh sikap yang terlalu langsung."]
  };
  var PRIBADI = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn"];
  function sinastri(a, b) {
    var hasil = [], skor = 0;
    a.planets.forEach(function (p) {
      if (PRIBADI.indexOf(p.id) < 0) return;
      b.planets.forEach(function (q) {
        if (PRIBADI.indexOf(q.id) < 0) return;
        var asp = cariAspek(p.lon, q.lon, 6); if (!asp) return;
        var key = [p.id, q.id].sort().join("-"), teks = PASANGAN[key];
        var baik = asp.jenis.sifat === "harmonis" || (asp.jenis.a === 0 && !/saturn|mars-mars/.test(key));
        var penting = teks ? 3 : 1;
        skor += (baik ? 1 : -0.8) * penting * (1 - asp.orb / 8);
        hasil.push({ p: p, q: q, jenis: asp.jenis, orb: asp.orb, baik: baik, penting: penting,
          isi: teks ? teks[baik ? 0 : 1] : F(S.sinGenerik, { a: KATA[p.id], b: KATA[q.id], arti: ASPEK_ARTI[asp.jenis.k] }) });
      });
    });
    if (a.angles && b.angles) {
      [["asc", a, b], ["asc", b, a]].forEach(function (x) {
        x[2].planets.forEach(function (q) {
          if (["sun", "moon", "venus"].indexOf(q.id) < 0) return;
          var asp = cariAspek(x[1].angles.asc, q.lon, 4); if (!asp || asp.jenis.a !== 0) return;
          skor += 2;
          hasil.push({ p: { n: S.ascNama }, q: q, jenis: asp.jenis, orb: asp.orb, baik: true, penting: 3, isi: F(S.sinAsc, { q: q.n }) });
        });
      });
    }
    hasil.sort(function (x, y) { return (y.penting - y.orb / 6) - (x.penting - x.orb / 6); });
    var el = ["Api", "Tanah", "Udara", "Air"], ea = el[a.planets[0].pos.rasi % 4], eb = el[b.planets[0].pos.rasi % 4];
    var cocokEl = (ea === eb) ? S.hub.sama : ((ea === "Api" && eb === "Udara") || (ea === "Udara" && eb === "Api") || (ea === "Tanah" && eb === "Air") || (ea === "Air" && eb === "Tanah")) ? S.hub.lengkap : S.hub.beda;
    var persen = Math.max(15, Math.min(96, Math.round(52 + skor * 3)));
    return { aspek: hasil, persen: persen, elemen: { a: S.elNama[ea], b: S.elNama[eb], hubungan: cocokEl } };
  }

  // ---------- Solar return: saat Matahari kembali ke posisi lahirnya ----------
  var SR_ASC = [
    "Tahun yang penuh inisiatif dan awal baru. Anda lebih berani mengambil langkah sendiri.",
    "Tahun untuk membangun kestabilan, terutama keuangan dan kenyamanan hidup.",
    "Tahun yang sibuk dengan belajar, perjalanan pendek, dan banyak relasi baru.",
    "Tahun yang berpusat pada keluarga, rumah, dan kebutuhan emosional.",
    "Tahun untuk tampil, berkreasi, dan menikmati cinta. Anda lebih mudah dikenal orang.",
    "Tahun untuk merapikan rutinitas, pekerjaan, dan kesehatan.",
    "Tahun yang menyorot hubungan dan kerja sama. Pasangan dan mitra berperan besar.",
    "Tahun perubahan mendalam. Ada hal lama yang berakhir dan memberi ruang bagi yang baru.",
    "Tahun untuk memperluas wawasan: studi, perjalanan jauh, dan keyakinan.",
    "Tahun karier. Kerja keras membuahkan pengakuan, tetapi tuntutannya juga besar.",
    "Tahun pertemanan dan komunitas. Harapan dan rencana jangka panjang menguat.",
    "Tahun reflektif. Waktu yang baik untuk istirahat batin, spiritualitas, dan menutup bab lama."
  ];
  function solarReturn(natal, tahun, lat, lonEast) {
    var sun0 = natal.planets[0].lon, d0 = new Date(natal.ms);
    var ms = Date.UTC(tahun, d0.getUTCMonth(), d0.getUTCDate(), d0.getUTCHours(), d0.getUTCMinutes());
    for (var i = 0; i < 8; i++) {
      var T = (julianDay(ms) - 2451545) / 36525;
      var diff = ((sun0 - sunLon(T) + 540) % 360) - 180;
      ms += diff / 0.98565 * 86400000;
      if (Math.abs(diff) < 1e-5) break;
    }
    var c = hitungUTC(ms, lat, lonEast, true); c.ms = ms;
    var sun = c.planets[0], moon = c.planets[1];
    var tema = [
      { judul: F(S.srAsc, { r: posisi(c.angles.asc).nama }), isi: SR_ASC[Math.floor(c.angles.asc / 30)] },
      { judul: F(S.diRumah, { p: sun.n, n: sun.rumah }), isi: F(S.srSun, { u: RUMAH[sun.rumah - 1] }) },
      { judul: F(S.diRasi, { p: moon.n, r: moon.pos.nama }) + F(S.rumahN, { n: moon.rumah }), isi: F(S.srMoon, { u: RUMAH[moon.rumah - 1] }) + BULAN_RASI[moon.pos.rasi] }
    ];
    var jup = c.planets[5], sat = c.planets[6];
    tema.push({ judul: F(S.diRumah, { p: jup.n, n: jup.rumah }), isi: F(S.srJup, { u: RUMAH[jup.rumah - 1] }) });
    tema.push({ judul: F(S.diRumah, { p: sat.n, n: sat.rumah }), isi: F(S.srSat, { u: RUMAH[sat.rumah - 1] }) });
    return { chart: c, tema: tema };
  }

  // ---------- Alat bantu bersama ----------
  var TAHUN_MS = 365.2422 * 86400000;
  function selisih(a, b) { return ((a - b + 540) % 360) - 180; } // a - b, -180..180
  function tengah(a, b) { return norm(b + selisih(a, b) / 2); }
  function ascDariMC(mc, lat, jd) {
    var T = (jd - 2451545) / 36525, eps = 23.4392911 - 0.0130042 * T;
    var ramc = norm(Math.atan2(sind(mc) * cosd(eps), cosd(mc)) / RAD);
    return norm(Math.atan2(cosd(ramc), -(sind(ramc) * cosd(eps) + Math.tan(lat * RAD) * sind(eps))) / RAD);
  }
  function rumahDari(lon, ascRasi) { return ((Math.floor(lon / 30) - ascRasi + 12) % 12) + 1; }
  var PENGUASA = ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "mars", "jupiter", "saturn", "saturn", "jupiter"];
  function planetById(c, id) { return c.planets.filter(function (p) { return p.id === id; })[0]; }

  // ---------- Progresi sekunder: satu hari setelah lahir = satu tahun hidup ----------
  var PR_SUN = [
    "Bab hidup yang menuntut keberanian dan kemandirian. Anda terdorong memulai hal baru, mengambil keputusan sendiri, dan berhenti menunggu izin orang lain.",
    "Bab hidup untuk membangun kestabilan. Uang, aset, tubuh, dan rasa aman menjadi prioritas, dan Anda lebih menghargai hal yang pelan tetapi pasti.",
    "Bab hidup yang penuh rasa ingin tahu. Belajar, menulis, berjejaring, dan berpindah-pindah membuat Anda merasa hidup.",
    "Bab hidup yang berpusat pada akar. Rumah, keluarga, dan rasa memiliki menjadi tema utama, dan Anda ingin tempat yang benar-benar terasa milik sendiri.",
    "Bab hidup untuk bersinar. Anda ingin berkarya, dikenal, dan menikmati hidup. Cinta, anak, dan kreativitas mengambil panggung.",
    "Bab hidup untuk merapikan diri. Pekerjaan, kesehatan, dan keahlian diasah, dan Anda belajar melayani tanpa kehilangan diri.",
    "Bab hidup yang menyorot hubungan. Pasangan, mitra, dan kerja sama menjadi cermin bagi pertumbuhan Anda.",
    "Bab hidup yang dalam dan mengubah. Ada hal lama yang dilepas, dan Anda menemukan kekuatan batin yang sebelumnya tersembunyi.",
    "Bab hidup untuk memperluas cakrawala. Perjalanan, studi, dan pencarian makna hidup membuat Anda tumbuh.",
    "Bab hidup untuk membangun pencapaian. Anda lebih serius, ambisius, dan siap memikul tanggung jawab besar.",
    "Bab hidup untuk menjadi diri yang unik. Anda ingin bebas, bergaul dengan komunitas yang sepaham, dan mencoba cara baru.",
    "Bab hidup yang lembut dan spiritual. Intuisi, seni, dan kepedulian kepada sesama menguat, dan Anda belajar melepaskan kendali."
  ];
  var PR_MOON = [
    "Hati Anda sedang gelisah ingin bergerak. Ini masa yang baik untuk memulai proyek pribadi dan berani mengatakan apa yang Anda mau.",
    "Hati Anda mencari ketenangan. Anda butuh rutinitas yang nyaman, keuangan yang tertata, dan waktu untuk menikmati hal sederhana.",
    "Hati Anda haus informasi dan obrolan. Banyak ide baru datang, dan hubungan dengan saudara atau tetangga lebih aktif.",
    "Hati Anda ingin pulang. Keluarga, rumah, dan orang terdekat menjadi pusat perhatian, dan perasaan lebih peka dari biasanya.",
    "Hati Anda ingin bersenang-senang dan dihargai. Romansa, hobi, dan kegiatan kreatif terasa menggembirakan.",
    "Hati Anda ingin semuanya teratur. Ini masa yang baik untuk memperbaiki pola makan, kebiasaan kerja, dan kesehatan.",
    "Hati Anda mencari teman sejalan. Hubungan dekat, pernikahan, atau kemitraan menjadi pusat perasaan Anda.",
    "Hati Anda sedang menyelam ke dalam. Emosi lebih intens, dan Anda siap menghadapi hal yang selama ini dihindari.",
    "Hati Anda ingin bebas dan belajar. Perjalanan, kursus, atau keyakinan baru memberi semangat.",
    "Hati Anda fokus pada tujuan. Anda lebih serius soal karier dan ingin hasil yang nyata.",
    "Hati Anda butuh ruang dan teman. Komunitas, persahabatan, dan rencana masa depan sedang menguat.",
    "Hati Anda butuh istirahat batin. Masa yang reflektif: tutup bab lama, perbanyak waktu tenang, dan dengarkan intuisi."
  ];
  var FASE = [
    { n: "Bulan baru", isi: "Awal siklus 30 tahun yang baru. Anda menanam benih arah hidup berikutnya, meski bentuknya belum jelas." },
    { n: "Bulan sabit awal", isi: "Benih baru mulai tumbuh. Anda berjuang melepaskan kebiasaan lama agar rencana baru bisa berjalan." },
    { n: "Kuartal pertama", isi: "Masa krisis tindakan. Anda harus mengambil keputusan tegas dan membangun struktur untuk rencana Anda." },
    { n: "Bulan cembung awal", isi: "Masa menyempurnakan. Anda memperbaiki, belajar, dan menyiapkan diri untuk hasil yang lebih besar." },
    { n: "Purnama", isi: "Puncak siklus. Hasil usaha mulai terlihat, hubungan menjadi sorotan, dan Anda melihat diri dengan lebih jernih." },
    { n: "Bulan cembung akhir", isi: "Masa berbagi. Anda membagikan pengalaman dan ilmu, dan sering berperan sebagai pembimbing." },
    { n: "Kuartal akhir", isi: "Krisis keyakinan. Anda menilai ulang apa yang masih berarti dan mulai melepaskan yang tidak lagi cocok." },
    { n: "Bulan sabit akhir", isi: "Masa menutup siklus. Waktu untuk melepaskan, beristirahat, dan bersiap bagi awal baru." }
  ];
  var PR_TEMA = {
    sun: "menyorot dan memberi arah baru pada", moon: "membuat perasaan Anda sibuk dengan", mercury: "mengubah cara Anda memikirkan",
    venus: "membawa cinta dan keindahan pada", mars: "menyalakan semangat dan dorongan pada"
  };
  function progresi(natal, msTarget) {
    var umur = (msTarget - natal.ms) / TAHUN_MS;
    var msP = natal.ms + umur * 86400000;
    var c = hitungUTC(msP, natal.lat, natal.lon, false); c.ms = msP;
    var sunN = natal.planets[0], sun = c.planets[0], moon = c.planets[1];
    var arc = norm(sun.lon - sunN.lon);
    if (natal.angles) {
      var mc = norm(natal.angles.mc + arc), asc = ascDariMC(mc, natal.lat, natal.jd);
      c.angles = { asc: asc, mc: mc };
      c.planets.forEach(function (p) { p.rumahNatal = rumahDari(p.lon, natal.ascRasi); });
    }
    // fase bulan progresi
    var fi = Math.floor(norm(moon.lon - sun.lon) / 45), fase = FASE[fi];
    // kapan Bulan progresi pindah rasi berikutnya (bergerak sekitar 1° per bulan)
    var T0 = (julianDay(msP) - 2451545) / 36525, r0 = Math.floor(moon.lon / 30), pindah = null;
    for (var b = 1; b <= 40; b++) {
      var lon = moonLon(T0 + (b / 12) / 36525);
      if (Math.floor(lon / 30) !== r0) { pindah = { ms: msTarget + b / 12 * TAHUN_MS, rasi: Math.floor(lon / 30) }; break; }
    }
    var sisaSun = 30 - sun.lon % 30, umurSun = Math.floor(umur + sisaSun / 0.9856);
    var tema = [];
    var tSun = PR_SUN[sun.pos.rasi];
    if (sun.pos.rasi !== sunN.pos.rasi) tSun = F(S.prPindah, { a: sunN.pos.nama, b: sun.pos.nama, u: Math.round(umur - (sun.lon % 30) / 0.9856) }) + " " + tSun;
    tSun += " " + F(S.prSunBerikut, { r: RASI[(sun.pos.rasi + 1) % 12], u: umurSun });
    tema.push({ judul: F(S.prSunJ, { r: sun.pos.nama }) + (sun.rumahNatal ? F(S.rumahN, { n: sun.rumahNatal }) : ""), isi: tSun + (sun.rumahNatal ? " " + F(S.prSorot, { u: RUMAH[sun.rumahNatal - 1] }) : "") });
    tema.push({ judul: F(S.prMoonJ, { r: moon.pos.nama }) + (moon.rumahNatal ? F(S.rumahN, { n: moon.rumahNatal }) : ""),
      isi: PR_MOON[moon.pos.rasi] + (moon.rumahNatal ? " " + F(S.prMoonRumah, { u: RUMAH[moon.rumahNatal - 1] }) : "") + (pindah ? " " + F(S.prMoonPindah, { r: RASI[pindah.rasi] }) : "") });
    tema.push({ judul: F(S.prFaseJ, { f: fase.n }), isi: fase.isi });
    if (c.angles) {
      var ra = Math.floor(c.angles.asc / 30), rm = Math.floor(c.angles.mc / 30);
      tema.push({ judul: F(S.prAscJ, { r: RASI[ra] }), isi: S.prAscIsi + " " + ASC_RASI[ra] });
      tema.push({ judul: F(S.prMcJ, { r: RASI[rm] }), isi: S.prMcIsi + " " + MC_RASI[rm] });
    }
    var ven = c.planets[3], venN = natal.planets[3];
    if (ven.retro !== venN.retro || ven.pos.rasi !== venN.pos.rasi)
      tema.push({ judul: F(S.prVenJ, { r: ven.pos.nama }) + (ven.retro ? S.retroTag : ""), isi: VENUS_RASI[ven.pos.rasi] + (ven.retro ? " " + S.prRetroVen : "") });
    // aspek progresi ke natal (orb 1°)
    var aspek = [];
    ["sun", "moon", "mercury", "venus", "mars"].forEach(function (id) {
      var p = planetById(c, id);
      natal.planets.forEach(function (n) {
        if (n.id === id) return;
        var a = cariAspek(p.lon, n.lon, 1); if (!a) return;
        aspek.push({ p: p, n: n, jenis: a.jenis, orb: a.orb, bobot: (id === "sun" ? 4 : id === "moon" ? 2 : 3) - a.orb + (a.jenis.a === 0 ? 0.5 : 0),
          isi: F(S.prAspIsi, { p: p.n, tema: PR_TEMA[id], k: KATA[n.id], n: n.n, nada: NADA[a.jenis.sifat], lama: id === "moon" ? S.prLamaMoon : S.prLama }) });
      });
      if (natal.angles) ["asc", "mc"].forEach(function (k) {
        var a = cariAspek(p.lon, natal.angles[k], 1); if (!a) return;
        aspek.push({ p: p, n: { id: k, n: k === "asc" ? S.ascNama : S.mcNama }, jenis: a.jenis, orb: a.orb, bobot: 4 - a.orb,
          isi: F(S.prAspIsi, { p: p.n, tema: PR_TEMA[id], k: k === "asc" ? S.citraDiri : S.karierRep, n: k === "asc" ? S.ascNama : S.mcNama, nada: NADA[a.jenis.sifat], lama: id === "moon" ? S.prLamaMoon : S.prLama }) });
      });
    });
    aspek.sort(function (a, b) { return b.bobot - a.bobot; });
    return { chart: c, umur: umur, tema: tema, aspek: aspek, fase: fi, pindah: pindah };
  }

  // ---------- Bagan komposit: titik tengah dua bagan ----------
  var KOMP_SUN = [
    "Hubungan ini lahir untuk bergerak dan memulai. Bersama, kalian lebih berani mencoba hal baru, tetapi perlu belajar agar tidak saling berebut memimpin.",
    "Hubungan ini dibangun untuk bertahan. Tujuan bersamanya adalah rasa aman, rumah yang nyaman, dan kesejahteraan yang tumbuh pelan-pelan.",
    "Hubungan ini hidup lewat obrolan. Kalian saling mengasah pikiran, banyak bertukar ide, dan senang melakukan banyak hal bersama.",
    "Hubungan ini terasa seperti keluarga. Tujuannya saling menjaga, membangun rumah, dan memberi tempat pulang bagi satu sama lain.",
    "Hubungan ini ingin bersinar. Kalian tampak serasi di mata orang, saling membanggakan, dan menikmati hidup dengan penuh gaya.",
    "Hubungan ini bekerja lewat kepedulian nyata. Kalian saling membantu, membangun kebiasaan sehat, dan menjadi tim yang rapi.",
    "Hubungan ini berpusat pada kemitraan. Keadilan, keseimbangan, dan keindahan menjadi nilai utama yang kalian jaga bersama.",
    "Hubungan ini dalam dan mengubah hidup. Ikatannya kuat dan intens, dan kalian saling membawa ke versi diri yang lebih jujur.",
    "Hubungan ini adalah petualangan. Bersama, kalian ingin belajar, bepergian, dan menemukan makna hidup yang lebih luas.",
    "Hubungan ini serius dan berorientasi masa depan. Kalian membangun sesuatu yang nyata, dari karier sampai keluarga, dengan komitmen tinggi.",
    "Hubungan ini seperti sahabat dekat. Kalian saling memberi ruang, punya cita-cita bersama, dan sering terlibat dalam komunitas.",
    "Hubungan ini terasa seperti takdir. Ada ikatan batin dan rasa saling memahami tanpa kata, tetapi kalian perlu tetap berpijak pada kenyataan."
  ];
  var KOMP_MOON = [
    "Secara emosional kalian cepat panas dan cepat baikan. Hubungan butuh kegiatan bersama agar tidak terasa membosankan.",
    "Secara emosional hubungan ini tenang dan stabil. Rasa nyaman tumbuh lewat kebersamaan sederhana dan rutinitas.",
    "Secara emosional kalian butuh banyak bicara. Perasaan diolah lewat obrolan, pesan, dan candaan.",
    "Secara emosional hubungan ini sangat hangat dan protektif. Kalian saling mengasuh, kadang sampai terlalu sensitif.",
    "Secara emosional kalian butuh saling memuji dan merasa istimewa. Kehangatan dan kemesraan perlu diungkapkan terang-terangan.",
    "Secara emosional kalian menunjukkan sayang lewat perhatian kecil. Hati-hati agar tidak saling mengkritik.",
    "Secara emosional hubungan ini mencari harmoni. Kalian menghindari konflik, jadi biasakan membicarakan masalah sebelum menumpuk.",
    "Secara emosional ikatan kalian sangat dalam. Kesetiaan tinggi, tetapi cemburu dan rahasia perlu dikelola dengan jujur.",
    "Secara emosional kalian butuh kebebasan dan tawa. Hubungan terasa paling baik saat ada rencana dan petualangan baru.",
    "Secara emosional hubungan ini dewasa dan bertanggung jawab. Kehangatan kadang perlu ditunjukkan lebih sering.",
    "Secara emosional kalian butuh ruang pribadi. Persahabatan adalah fondasi, dan kalian tidak suka saling mengekang.",
    "Secara emosional kalian sangat peka satu sama lain. Ada empati besar, tetapi jaga agar tidak larut dalam perasaan pasangan."
  ];
  var KOMP_VENUS = [
    "Cinta kalian spontan dan bergairah. Romantisme muncul lewat kejutan dan keberanian menyatakan perasaan.",
    "Cinta kalian sensual dan setia. Makan enak, sentuhan, dan kenyamanan fisik adalah bahasa cinta bersama.",
    "Cinta kalian ringan dan menyenangkan. Kalian saling menggoda lewat kata dan suka melakukan hal baru bersama.",
    "Cinta kalian lembut dan mengayomi. Kebersamaan di rumah dan perhatian sehari-hari membuat hubungan kuat.",
    "Cinta kalian hangat dan penuh perayaan. Kalian suka memanjakan satu sama lain dan tampil mesra.",
    "Cinta kalian tulus dan praktis. Sayang ditunjukkan lewat tindakan nyata dan saling menolong.",
    "Cinta kalian manis dan seimbang. Kalian menghargai sopan santun, keindahan, dan keadilan dalam hubungan.",
    "Cinta kalian intens dan total. Daya tarik sangat kuat, dan hubungan menuntut kejujuran penuh.",
    "Cinta kalian riang dan bebas. Kalian paling dekat saat belajar atau bepergian bersama.",
    "Cinta kalian serius dan setia. Komitmen dan rencana jangka panjang adalah bentuk kasih sayang kalian.",
    "Cinta kalian bersahabat dan unik. Kalian tidak mengikuti aturan umum dan saling memberi kebebasan.",
    "Cinta kalian romantis dan penuh pengorbanan. Kalian saling menginspirasi, tetapi perlu batas yang sehat."
  ];
  var KOMP_ASC = [
    "Di mata orang, kalian pasangan yang energik dan berani.", "Di mata orang, kalian pasangan yang tenang, mapan, dan bisa diandalkan.",
    "Di mata orang, kalian pasangan yang ramah, lucu, dan selalu punya cerita.", "Di mata orang, kalian pasangan yang hangat dan kekeluargaan.",
    "Di mata orang, kalian pasangan yang mencolok dan berkarisma.", "Di mata orang, kalian pasangan yang rapi, sopan, dan cakap.",
    "Di mata orang, kalian pasangan yang serasi dan menawan.", "Di mata orang, kalian pasangan yang misterius dan kuat.",
    "Di mata orang, kalian pasangan yang ceria dan suka bertualang.", "Di mata orang, kalian pasangan yang serius dan terhormat.",
    "Di mata orang, kalian pasangan yang unik dan tidak biasa.", "Di mata orang, kalian pasangan yang lembut dan penuh pengertian."
  ];
  var KOMP_ARTI = {
    "Konjungsi": "menyatu dalam hubungan ini, sehingga menjadi ciri khas yang sangat terasa bagi kalian berdua.",
    "Sekstil": "bekerja sama dengan mudah. Ada peluang yang terbuka bila kalian mau mengusahakannya bersama.",
    "Kuadratur": "saling menekan. Ketegangan ini menjadi bahan pertengkaran sekaligus pendorong hubungan untuk tumbuh.",
    "Trigon": "mengalir harmonis. Bagian ini terasa mudah dan menjadi kekuatan alami hubungan kalian.",
    "Oposisi": "saling tarik-menarik. Kalian belajar menyeimbangkan dua kebutuhan yang berbeda."
  };
  var KOMP_EL = {
    Api: "Hubungan ini didominasi elemen Api: penuh semangat, spontan, dan suka tantangan.",
    Tanah: "Hubungan ini didominasi elemen Tanah: praktis, setia, dan fokus membangun hal nyata.",
    Udara: "Hubungan ini didominasi elemen Udara: komunikatif, sosial, dan kaya ide.",
    Air: "Hubungan ini didominasi elemen Air: emosional, intuitif, dan sangat dekat secara batin."
  };
  function hitungAspek(planets) {
    var aspek = [];
    for (var i = 0; i < planets.length; i++) for (var j = i + 1; j < planets.length; j++) {
      var diff = bedaSudut(planets[i].lon, planets[j].lon);
      for (var k = 0; k < ASPEK.length; k++) {
        var A = ASPEK[k], orb = A.orb + ((planets[i].id === "sun" || planets[i].id === "moon") ? 1 : 0);
        if (Math.abs(diff - A.a) <= orb) { aspek.push({ p1: planets[i], p2: planets[j], jenis: A, orb: Math.abs(diff - A.a) }); break; }
      }
    }
    return aspek.sort(function (x, y) { return x.orb - y.orb; });
  }
  function komposit(a, b) {
    var planets = a.planets.map(function (p, i) {
      var lon = tengah(p.lon, b.planets[i].lon);
      return { id: p.id, n: p.n, s: p.s, lon: lon, retro: false, pos: posisi(lon) };
    });
    var c = { planets: planets, angles: null, ascRasi: null };
    if (a.angles && b.angles) {
      var mc = tengah(a.angles.mc, b.angles.mc), asc = ascDariMC(mc, (a.lat + b.lat) / 2, (a.jd + b.jd) / 2);
      c.angles = { asc: asc, mc: mc }; c.ascRasi = Math.floor(asc / 30);
      planets.forEach(function (p) { p.rumah = rumahDari(p.lon, c.ascRasi); });
    }
    c.aspek = hitungAspek(planets);
    var bobot = { sun: 3, moon: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1, saturn: 1, uranus: 0.5, neptune: 0.5, pluto: 0.5 };
    var el = { Api: 0, Tanah: 0, Udara: 0, Air: 0 };
    planets.forEach(function (p) { el[ELEMEN[p.pos.rasi % 4]] += bobot[p.id]; });
    var maxEl = Object.keys(el).sort(function (x, y) { return el[y] - el[x]; })[0];
    var sun = planets[0], moon = planets[1], ven = planets[3], mar = planets[4];
    var tema = [
      { judul: F(S.kpSunJ, { r: sun.pos.nama }) + (sun.rumah ? F(S.rumahN, { n: sun.rumah }) : ""), isi: KOMP_SUN[sun.pos.rasi] + (sun.rumah ? " " + F(S.kpRumah, { u: RUMAH[sun.rumah - 1] }) : "") },
      { judul: F(S.kpMoonJ, { r: moon.pos.nama }), isi: KOMP_MOON[moon.pos.rasi] },
      { judul: F(S.kpVenJ, { r: ven.pos.nama }), isi: KOMP_VENUS[ven.pos.rasi] },
      { judul: F(S.kpMarJ, { r: mar.pos.nama }), isi: F(S.kpMarIsi, { g: GAYA[mar.pos.rasi] }) }
    ];
    if (c.angles) tema.splice(1, 0, { judul: F(S.kpAscJ, { r: RASI[c.ascRasi] }), isi: KOMP_ASC[c.ascRasi] });
    tema.push({ judul: S.kpElJ, isi: KOMP_EL[maxEl] });
    var aspek = c.aspek.filter(function (x) { return PRIBADI.indexOf(x.p1.id) >= 0 && PRIBADI.indexOf(x.p2.id) >= 0; }).slice(0, 8).map(function (x) {
      return { p1: x.p1, p2: x.p2, jenis: x.jenis, orb: x.orb, isi: F(S.kpAspIsi, { a: KATA[x.p1.id], b: KATA[x.p2.id], arti: KOMP_ARTI[x.jenis.k], o: x.orb.toFixed(1) }) };
    });
    return { chart: c, tema: tema, aspek: aspek };
  }

  // ---------- Lunar return: Bulan kembali ke posisi lahirnya (sekitar tiap 27,3 hari) ----------
  var LR_ASC = [
    "Bulan yang cepat dan penuh inisiatif. Anda lebih berani, tidak sabar, dan ingin segera bertindak.",
    "Bulan yang pelan dan membumi. Fokus pada uang, kenyamanan, dan menikmati hal sederhana.",
    "Bulan yang sibuk. Banyak pesan, janji temu, perjalanan pendek, dan hal baru untuk dipelajari.",
    "Bulan yang emosional dan dekat dengan keluarga. Rumah menjadi pusat perhatian Anda.",
    "Bulan untuk tampil. Anda lebih percaya diri, ingin diperhatikan, dan mudah menikmati romansa.",
    "Bulan untuk beres-beres. Pekerjaan, kesehatan, dan detail kecil menuntut perhatian.",
    "Bulan yang sosial. Hubungan dan kerja sama menjadi tema utama, dan orang lain banyak memengaruhi suasana hati.",
    "Bulan yang intens. Perasaan dalam muncul ke permukaan, dan ada hal yang ingin Anda ubah sampai tuntas.",
    "Bulan yang optimis. Anda ingin belajar, bepergian, atau mencari pengalaman yang memperluas wawasan.",
    "Bulan yang serius dan produktif. Tanggung jawab bertambah, tetapi kerja keras terlihat hasilnya.",
    "Bulan untuk teman dan komunitas. Anda ingin bebas, mencoba hal baru, dan bertemu orang yang sepaham.",
    "Bulan yang tenang dan reflektif. Perbanyak istirahat, dengarkan intuisi, dan jaga batas energi Anda."
  ];
  var LR_RUMAH = [
    "Perasaan bulan ini berpusat pada diri sendiri. Waktu yang tepat untuk merawat diri dan memulai kebiasaan baru.",
    "Perasaan bulan ini terkait uang dan rasa aman. Perhatikan pengeluaran dan hargai apa yang sudah Anda punya.",
    "Pikiran bulan ini sangat aktif. Banyak obrolan, urusan saudara, dan keinginan belajar hal baru.",
    "Hati bulan ini ingin di rumah. Keluarga, orang tua, atau urusan tempat tinggal paling menyita perasaan.",
    "Hati bulan ini ingin bersenang-senang. Cinta, anak, hobi, dan kreativitas membawa kebahagiaan.",
    "Perasaan bulan ini tertuju pada pekerjaan dan kesehatan. Atur ritme harian agar tidak kelelahan.",
    "Perasaan bulan ini tertuju pada pasangan dan mitra. Hubungan dekat membutuhkan perhatian lebih.",
    "Perasaan bulan ini dalam dan intens. Urusan keuangan bersama, kepercayaan, dan perubahan batin muncul.",
    "Hati bulan ini ingin menjelajah. Perjalanan, studi, atau pencarian makna membuat Anda bersemangat.",
    "Perasaan bulan ini tertuju pada karier dan nama baik. Anda lebih terlihat oleh atasan atau publik.",
    "Perasaan bulan ini tertuju pada teman dan harapan. Lingkaran sosial memberi dukungan dan peluang.",
    "Perasaan bulan ini lebih ke dalam. Butuh waktu menyendiri, tidur cukup, dan menutup urusan yang menggantung."
  ];
  function cariBulanKembali(lon0, msMulai) {
    var ms = msMulai;
    var T = (julianDay(ms) - 2451545) / 36525;
    ms += norm(lon0 - moonLon(T)) / 13.176 * 86400000;
    for (var i = 0; i < 8; i++) {
      T = (julianDay(ms) - 2451545) / 36525;
      var d = selisih(lon0, moonLon(T));
      ms += d / 13.176 * 86400000;
      if (Math.abs(d) < 1e-4) break;
    }
    return ms;
  }
  function lunarReturn(natal, msMulai, lat, lonEast) {
    var lon0 = natal.planets[1].lon, ms = cariBulanKembali(lon0, msMulai);
    var c = hitungUTC(ms, lat, lonEast, true); c.ms = ms;
    var by = {}; c.planets.forEach(function (p) { by[p.id] = p; });
    var ra = Math.floor(c.angles.asc / 30), moon = by.moon;
    var tema = [
      { judul: F(S.lrAscJ, { r: RASI[ra] }), isi: LR_ASC[ra] },
      { judul: F(S.diRumah, { p: moon.n, n: moon.rumah }), isi: LR_RUMAH[moon.rumah - 1] },
      { judul: F(S.diRumah, { p: by.sun.n, n: by.sun.rumah }), isi: F(S.lrSun, { u: RUMAH[by.sun.rumah - 1] }) },
      { judul: F(S.diRumah, { p: by.venus.n, n: by.venus.rumah }), isi: F(S.lrVen, { u: RUMAH[by.venus.rumah - 1] }) },
      { judul: F(S.diRumah, { p: by.mars.n, n: by.mars.rumah }), isi: F(S.lrMar, { u: RUMAH[by.mars.rumah - 1] }) }
    ];
    var aspek = [];
    c.planets.forEach(function (p) {
      if (p.id === "moon") return;
      var a = cariAspek(moon.lon, p.lon, 6); if (!a) return;
      aspek.push({ p: moon, n: p, jenis: a.jenis, orb: a.orb, isi: F(S.lrAspIsi, { k: KATA[p.id], nada: NADA[a.jenis.sifat] }) });
    });
    aspek.sort(function (x, y) { return x.orb - y.orb; });
    // jadwal beberapa lunar return berikutnya
    var jadwal = [], m = ms;
    for (var i = 0; i < 6; i++) {
      m = cariBulanKembali(lon0, m + 20 * 86400000);
      var ci = hitungUTC(m, lat, lonEast, true);
      jadwal.push({ ms: m, asc: Math.floor(ci.angles.asc / 30) });
    }
    return { chart: c, tema: tema, aspek: aspek.slice(0, 5), jadwal: jadwal };
  }

  // ---------- Profeksi tahunan: satu rumah per tahun usia ----------
  var PROF_RUMAH = [
    "Tahun diri sendiri. Siklus 12 tahun baru dimulai. Tubuh, penampilan, dan arah hidup pribadi menjadi sorotan. Bagus untuk memulai hal besar atas nama diri sendiri.",
    "Tahun uang dan nilai diri. Penghasilan, tabungan, dan apa yang benar-benar Anda hargai menjadi tema utama. Waktu yang baik untuk menata keuangan.",
    "Tahun belajar dan berkomunikasi. Saudara, tetangga, kursus, tulisan, dan perjalanan pendek mengisi tahun ini. Pikiran Anda sangat aktif.",
    "Tahun rumah dan keluarga. Urusan tempat tinggal, orang tua, dan akar keluarga menonjol. Ada keinginan membangun fondasi yang kokoh.",
    "Tahun kesenangan dan kreativitas. Cinta, anak, hobi, dan karya pribadi membawa kebahagiaan. Beri diri izin untuk menikmati hidup.",
    "Tahun kerja dan kesehatan. Rutinitas, pekerjaan harian, dan kondisi tubuh menuntut perhatian. Tahun untuk memperbaiki kebiasaan.",
    "Tahun hubungan. Pasangan, pernikahan, mitra bisnis, atau bahkan lawan menjadi tema besar. Banyak pelajaran datang lewat orang lain.",
    "Tahun perubahan mendalam. Keuangan bersama, utang, warisan, dan hal yang tersembunyi muncul. Tahun untuk melepaskan dan bertransformasi.",
    "Tahun memperluas wawasan. Perjalanan jauh, pendidikan tinggi, keyakinan, dan urusan hukum atau luar negeri terbuka lebar.",
    "Tahun karier dan pencapaian. Reputasi, jabatan, dan tujuan hidup sedang disorot. Kerja keras tahun ini paling mudah terlihat orang.",
    "Tahun teman dan harapan. Jaringan, komunitas, dan rencana masa depan membawa peluang. Dukungan datang dari lingkaran sosial.",
    "Tahun batin dan penutupan. Waktu untuk refleksi, istirahat, dan menyelesaikan siklus lama sebelum siklus baru dimulai tahun depan."
  ];
  var PROF_TUAN = {
    sun: "Matahari sebagai penguasa tahun membuat jati diri, kepemimpinan, dan pengakuan menjadi tema utama. Anda ingin bersinar dan diakui.",
    moon: "Bulan sebagai penguasa tahun membuat perasaan, keluarga, dan kebutuhan batin sangat menonjol. Suasana hati menjadi kompas Anda.",
    mercury: "Merkurius sebagai penguasa tahun membuat pikiran, komunikasi, belajar, dan perdagangan menjadi kunci. Tahun yang sibuk dan penuh informasi.",
    venus: "Venus sebagai penguasa tahun membawa cinta, keindahan, kesenangan, dan uang. Hubungan dan kenyamanan menjadi fokus.",
    mars: "Mars sebagai penguasa tahun membawa energi, keberanian, dan persaingan. Tahun untuk berjuang, tetapi jaga emosi dan keselamatan.",
    jupiter: "Jupiter sebagai penguasa tahun membawa pertumbuhan, keberuntungan, dan perluasan. Tahun yang murah hati bila Anda berani melangkah.",
    saturn: "Saturnus sebagai penguasa tahun membawa disiplin, tanggung jawab, dan ujian kesabaran. Yang dibangun dengan sungguh-sungguh tahun ini akan bertahan lama."
  };
  function profeksi(natal, msTarget) {
    var umur = Math.floor((msTarget - natal.ms) / TAHUN_MS);
    var adaAsc = !!natal.angles, dasar = adaAsc ? natal.ascRasi : natal.planets[0].pos.rasi;
    function satu(u) { var n = ((u % 12) + 12) % 12, r = (dasar + n) % 12; return { umur: u, rumah: n + 1, rasi: r, tuan: PENGUASA[r] }; }
    var ini = satu(umur), tuan = planetById(natal, ini.tuan);
    var rumahTuan = adaAsc ? tuan.rumah : rumahDari(tuan.lon, dasar);
    var tema = [
      { judul: F(S.pfRumahJ, { n: ini.rumah, r: RASI[ini.rasi] }), isi: PROF_RUMAH[ini.rumah - 1] },
      { judul: F(S.pfTuanJ, { p: tuan.n }), isi: PROF_TUAN[ini.tuan] + " " + F(S.pfTuanPos, { p: tuan.n, r: tuan.pos.nama, n: rumahTuan, u: RUMAH[rumahTuan - 1] }) + (tuan.retro ? " " + S.pfRetro : "") }
    ];
    var aktif = natal.planets.filter(function (p) { return p.pos.rasi === ini.rasi; });
    if (aktif.length) tema.push({ judul: F(S.pfAktifJ, { p: aktif.map(function (p) { return p.n; }).join(", ") }), isi: aktif.map(function (p) { return F(S.pfAktifIsi, { p: p.n, k: KATA[p.id] }); }).join(" ") });
    else tema.push({ judul: S.pfKosongJ, isi: S.pfKosongIsi });
    var tahun = []; for (var u = umur; u < umur + 12; u++) tahun.push(satu(u));
    var bulan = []; for (var k = 0; k < 12; k++) { var r = (ini.rasi + k) % 12; bulan.push({ ke: k, rasi: r, tuan: PENGUASA[r] }); }
    return { umur: umur, ini: ini, tema: tema, tahun: tahun, bulan: bulan, adaAsc: adaAsc };
  }

  // ---------- Bahasa ----------
  var TABEL = { RASI: RASI, PLANETS: PLANETS, ASPEK: ASPEK, GAYA: GAYA, BULAN_RASI: BULAN_RASI, ASC_RASI: ASC_RASI, PLANET_MAKNA: PLANET_MAKNA, RUMAH: RUMAH,
    KATA: KATA, ASPEK_ARTI: ASPEK_ARTI, ELEMEN_ARTI: ELEMEN_ARTI, KUALITAS_ARTI: KUALITAS_ARTI, TR_TEMA: TR_TEMA, TR_LAMA: TR_LAMA, NADA: NADA,
    PASANGAN: PASANGAN, SR_ASC: SR_ASC, S: S,
    VENUS_RASI: VENUS_RASI, MARS_RASI: MARS_RASI, R7_RASI: R7_RASI, MC_RASI: MC_RASI, SAT_RASI: SAT_RASI, JUP_RASI: JUP_RASI,
    PR_SUN: PR_SUN, PR_MOON: PR_MOON, FASE: FASE, PR_TEMA: PR_TEMA, KOMP_SUN: KOMP_SUN, KOMP_MOON: KOMP_MOON, KOMP_VENUS: KOMP_VENUS, KOMP_ASC: KOMP_ASC, KOMP_ARTI: KOMP_ARTI, KOMP_EL: KOMP_EL,
    LR_ASC: LR_ASC, LR_RUMAH: LR_RUMAH, PROF_RUMAH: PROF_RUMAH, PROF_TUAN: PROF_TUAN };
  var ASLI = JSON.parse(JSON.stringify(TABEL));
  function tumpang(t, src) { Object.keys(src).forEach(function (k) { var v = src[k]; if (v && typeof v === "object" && t[k] && typeof t[k] === "object") tumpang(t[k], v); else t[k] = v; }); }
  function setLang(lang, en) { tumpang(TABEL, JSON.parse(JSON.stringify(ASLI))); if (lang === "en" && en) tumpang(TABEL, en); }

  var api = { setLang: setLang, S: S, hitung: hitung, hitungUTC: hitungUTC, transit: transit, sinastri: sinastri, solarReturn: solarReturn, progresi: progresi, komposit: komposit, lunarReturn: lunarReturn, profeksi: profeksi, PENGUASA: PENGUASA, analisa: analisa, posisi: posisi, KOTA: KOTA, RASI: RASI, RASI_SYM: RASI_SYM, ASPEK: ASPEK, PLANETS: PLANETS, _sunLon: sunLon, _moonLon: moonLon, _planetLon: planetLon };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Natal = api;
})(this);
