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
    { n: "Konjungsi", s: "☌", a: 0, orb: 8, sifat: "netral" },
    { n: "Sekstil", s: "⚹", a: 60, orb: 5, sifat: "harmonis" },
    { n: "Kuadratur", s: "□", a: 90, orb: 7, sifat: "tegang" },
    { n: "Trigon", s: "△", a: 120, orb: 7, sifat: "harmonis" },
    { n: "Oposisi", s: "☍", a: 180, orb: 8, sifat: "tegang" }
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
    return { planets: planets, angles: ang, ascRasi: ascRasi, aspek: aspek, elemen: el, kualitas: kw, adaJam: adaJam, jd: jd };
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

  function analisa(c) {
    var by = {}; c.planets.forEach(function (p) { by[p.id] = p; });
    var out = { inti: [], planet: [], aspek: [], keseimbangan: [] };
    out.inti.push({ judul: "Matahari di " + by.sun.pos.nama, isi: PLANET_MAKNA.sun + " " + GAYA[by.sun.pos.rasi] + "." + (by.sun.rumah ? " Fokus hidup Anda ada di rumah " + by.sun.rumah + ": " + RUMAH[by.sun.rumah - 1] + "." : "") });
    out.inti.push({ judul: "Bulan di " + by.moon.pos.nama + (c.adaJam ? "" : " (perkiraan)"), isi: BULAN_RASI[by.moon.pos.rasi] });
    if (c.angles) out.inti.push({ judul: "Ascendant " + posisi(c.angles.asc).nama, isi: ASC_RASI[Math.floor(c.angles.asc / 30)] + " MC di " + posisi(c.angles.mc).nama + " menunjukkan arah karier: " + GAYA[Math.floor(c.angles.mc / 30)].replace("dengan ", "") + "." });
    ["mercury", "venus", "mars", "jupiter", "saturn"].forEach(function (id) {
      var p = by[id];
      out.planet.push({ judul: p.n + " di " + p.pos.nama + (p.rumah ? ", rumah " + p.rumah : "") + (p.retro ? " (retrograde)" : ""),
        isi: PLANET_MAKNA[id] + " " + GAYA[p.pos.rasi] + "." + (p.rumah ? " Energi ini paling terasa dalam urusan " + RUMAH[p.rumah - 1] + "." : "") + (p.retro ? " Retrograde membuat energinya lebih ke dalam dan reflektif." : "") });
    });
    c.aspek.filter(function (a) { return ["uranus", "neptune", "pluto"].indexOf(a.p1.id) < 0 || ["uranus", "neptune", "pluto"].indexOf(a.p2.id) < 0; })
      .slice(0, 6).forEach(function (a) {
        out.aspek.push({ judul: a.p1.n + " " + a.jenis.n.toLowerCase() + " " + a.p2.n, sifat: a.jenis.sifat,
          isi: "Unsur " + KATA[a.p1.id] + " dan " + KATA[a.p2.id] + " " + ASPEK_ARTI[a.jenis.n] + " (orb " + a.orb.toFixed(1) + "°)" });
      });
    var maxEl = Object.keys(c.elemen).sort(function (a, b) { return c.elemen[b] - c.elemen[a]; })[0];
    var minEl = Object.keys(c.elemen).sort(function (a, b) { return c.elemen[a] - c.elemen[b]; })[0];
    var maxKw = Object.keys(c.kualitas).sort(function (a, b) { return c.kualitas[b] - c.kualitas[a]; })[0];
    out.keseimbangan.push(ELEMEN_ARTI[maxEl], KUALITAS_ARTI[maxKw]);
    if (c.elemen[minEl] <= 2) out.keseimbangan.push("Elemen " + minEl + " paling sedikit. Kegiatan yang bersifat " + { Api: "aktif dan berani", Tanah: "membumi dan teratur", Udara: "sosial dan intelektual", Air: "emosional dan reflektif" }[minEl] + " membantu menyeimbangkan diri Anda.");
    return out;
  }

  // ---------- Kota lahir ----------
  var KOTA = [
    ["Jakarta", -6.2, 106.82, 7], ["Bandung", -6.91, 107.61, 7], ["Bekasi", -6.24, 106.99, 7], ["Bogor", -6.6, 106.8, 7], ["Tangerang", -6.18, 106.63, 7],
    ["Serang", -6.12, 106.15, 7], ["Cirebon", -6.71, 108.56, 7], ["Semarang", -6.97, 110.42, 7], ["Solo (Surakarta)", -7.57, 110.82, 7], ["Yogyakarta", -7.8, 110.36, 7],
    ["Purwokerto", -7.42, 109.23, 7], ["Surabaya", -7.25, 112.75, 7], ["Malang", -7.98, 112.63, 7], ["Kediri", -7.82, 112.01, 7], ["Jember", -8.17, 113.7, 7],
    ["Banda Aceh", 5.55, 95.32, 7], ["Medan", 3.59, 98.67, 7], ["Pekanbaru", 0.51, 101.45, 7], ["Padang", -0.95, 100.35, 7], ["Batam", 1.13, 104.05, 7],
    ["Jambi", -1.61, 103.61, 7], ["Palembang", -2.98, 104.76, 7], ["Bengkulu", -3.8, 102.27, 7], ["Bandar Lampung", -5.43, 105.26, 7], ["Pangkal Pinang", -2.13, 106.11, 7],
    ["Pontianak", -0.03, 109.33, 7], ["Palangka Raya", -2.21, 113.92, 7],
    ["Denpasar", -8.65, 115.22, 8], ["Mataram", -8.58, 116.12, 8], ["Kupang", -10.18, 123.6, 8], ["Banjarmasin", -3.32, 114.59, 8], ["Balikpapan", -1.27, 116.83, 8],
    ["Samarinda", -0.5, 117.15, 8], ["Makassar", -5.14, 119.42, 8], ["Manado", 1.47, 124.84, 8], ["Palu", -0.9, 119.87, 8], ["Kendari", -3.97, 122.51, 8], ["Gorontalo", 0.54, 123.06, 8],
    ["Ambon", -3.7, 128.18, 9], ["Ternate", 0.79, 127.38, 9], ["Sorong", -0.88, 131.25, 9], ["Jayapura", -2.53, 140.72, 9], ["Merauke", -8.49, 140.4, 9],
    ["Singapura", 1.35, 103.82, 8], ["Kuala Lumpur", 3.14, 101.69, 8], ["Hong Kong", 22.32, 114.17, 8], ["Taipei", 25.03, 121.57, 8], ["Tokyo", 35.68, 139.69, 9]
  ].map(function (k) { return { n: k[0], lat: k[1], lon: k[2], tz: k[3] }; });

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
          isi: t.n + " transit " + TR_TEMA[t.id] + " " + KATA[n.id] + " Anda (" + n.n + " natal di " + n.pos.nama + "). " + NADA[a.jenis.sifat] + " Berlangsung " + TR_LAMA[t.id] + "." });
      });
    });
    natal.angles && ["asc", "mc"].forEach(function (k) {
      now.planets.forEach(function (t) {
        if (["jupiter", "saturn", "uranus", "neptune", "pluto"].indexOf(t.id) < 0) return;
        var a = cariAspek(t.lon, natal.angles[k], 1.5); if (!a) return;
        hasil.push({ t: t, n: { id: k, n: k === "asc" ? "Ascendant" : "MC" }, jenis: a.jenis, orb: a.orb, bobot: 6 - a.orb,
          isi: t.n + " transit " + TR_TEMA[t.id] + " " + (k === "asc" ? "citra diri dan penampilan" : "karier dan reputasi") + " Anda. " + NADA[a.jenis.sifat] + " Berlangsung " + TR_LAMA[t.id] + "." });
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
          isi: teks ? teks[baik ? 0 : 1] : "Unsur " + KATA[p.id] + " Anda dan " + KATA[q.id] + " pasangan " + ASPEK_ARTI[asp.jenis.n] });
      });
    });
    if (a.angles && b.angles) {
      [["asc", a, b], ["asc", b, a]].forEach(function (x) {
        x[2].planets.forEach(function (q) {
          if (["sun", "moon", "venus"].indexOf(q.id) < 0) return;
          var asp = cariAspek(x[1].angles.asc, q.lon, 4); if (!asp || asp.jenis.a !== 0) return;
          skor += 2;
          hasil.push({ p: { n: "Ascendant" }, q: q, jenis: asp.jenis, orb: asp.orb, baik: true, penting: 3, isi: q.n + " satu orang jatuh di Ascendant yang lain: ada rasa langsung cocok sejak pertemuan pertama." });
        });
      });
    }
    hasil.sort(function (x, y) { return (y.penting - y.orb / 6) - (x.penting - x.orb / 6); });
    var el = ["Api", "Tanah", "Udara", "Air"], ea = el[a.planets[0].pos.rasi % 4], eb = el[b.planets[0].pos.rasi % 4];
    var cocokEl = (ea === eb) ? "sama" : ((ea === "Api" && eb === "Udara") || (ea === "Udara" && eb === "Api") || (ea === "Tanah" && eb === "Air") || (ea === "Air" && eb === "Tanah")) ? "saling melengkapi" : "berbeda";
    var persen = Math.max(15, Math.min(96, Math.round(52 + skor * 3)));
    return { aspek: hasil, persen: persen, elemen: { a: ea, b: eb, hubungan: cocokEl } };
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
      { judul: "Ascendant tahunan " + posisi(c.angles.asc).nama, isi: SR_ASC[Math.floor(c.angles.asc / 30)] },
      { judul: "Matahari di rumah " + sun.rumah, isi: "Fokus utama tahun ini ada pada urusan " + RUMAH[sun.rumah - 1] + "." },
      { judul: "Bulan di " + moon.pos.nama + ", rumah " + moon.rumah, isi: "Kebutuhan emosional tahun ini terasa dalam urusan " + RUMAH[moon.rumah - 1] + ". " + BULAN_RASI[moon.pos.rasi] }
    ];
    var jup = c.planets[5], sat = c.planets[6];
    tema.push({ judul: "Jupiter di rumah " + jup.rumah, isi: "Keberuntungan tahun ini paling mudah datang lewat " + RUMAH[jup.rumah - 1] + "." });
    tema.push({ judul: "Saturnus di rumah " + sat.rumah, isi: "Pelajaran dan kerja keras tahun ini ada pada " + RUMAH[sat.rumah - 1] + "." });
    return { chart: c, tema: tema };
  }

  var api = { hitung: hitung, hitungUTC: hitungUTC, transit: transit, sinastri: sinastri, solarReturn: solarReturn, analisa: analisa, posisi: posisi, KOTA: KOTA, RASI: RASI, RASI_SYM: RASI_SYM, ASPEK: ASPEK, PLANETS: PLANETS, _sunLon: sunLon, _moonLon: moonLon, _planetLon: planetLon };
  if (typeof module !== "undefined" && module.exports) module.exports = api; else root.Natal = api;
})(this);
