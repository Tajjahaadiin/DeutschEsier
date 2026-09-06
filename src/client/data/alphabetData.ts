export type AlphabetCategory = 'vowel' | 'consonant' | 'special'

export interface AlphabetAnchor {
  word: string
  analogy: string
  highlightLetter: string
}

export interface AlphabetExample {
  word: string
  article?: 'der' | 'die' | 'das'
  meaningId: string
  isCognate: boolean
  ipa: string
}

export interface AlphabetPhoneticTip {
  mouthPosition: string
  commonMistakeId: string
  secretTrick: string
}

export interface AlphabetAudioText {
  letterOnly: string
  exampleWord: string
}

export interface GermanAlphabetItem {
  id: string
  letter: string
  lowercase: string
  name: string
  ipa: string
  category: AlphabetCategory
  isCriticalForId: boolean
  anchor: AlphabetAnchor
  example: AlphabetExample
  phoneticTip: AlphabetPhoneticTip
  audioText: AlphabetAudioText
}

export const GERMAN_ALPHABET: GermanAlphabetItem[] = [
  {
    id: 'a',
    letter: 'A',
    lowercase: 'a',
    name: 'Ah',
    ipa: '[aː]',
    category: 'vowel',
    isCriticalForId: false,
    anchor: {
      word: 'Apel / Ayam',
      analogy: 'Seperti vokal A terbuka pada Apel',
      highlightLetter: 'A'
    },
    example: {
      word: 'Auto',
      article: 'das',
      meaningId: 'Mobil',
      isCognate: true,
      ipa: '[ˈaʊ̯to]'
    },
    phoneticTip: {
      mouthPosition: 'Mulut dibuka lebar secara santai, lidah beristirahat di dasar mulut.',
      commonMistakeId: 'Tidak ada kesulitan berarti, bunyi vokal [aː] mirip dengan vokal "a" terbuka bahasa Indonesia.',
      secretTrick: 'Buka rongga mulut seperti dokter sedang memeriksa tenggorokan ("Aaa").'
    },
    audioText: {
      letterOnly: 'A',
      exampleWord: 'das Auto'
    }
  },
  {
    id: 'b',
    letter: 'B',
    lowercase: 'b',
    name: 'Be',
    ipa: '[beː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Buku / Bebek',
      analogy: 'Konsonan letup bibir bersuara',
      highlightLetter: 'B'
    },
    example: {
      word: 'Buch',
      article: 'das',
      meaningId: 'Buku',
      isCognate: false,
      ipa: '[buːx]'
    },
    phoneticTip: {
      mouthPosition: 'Kedua bibir terkatup rapat, lalu dilepaskan bersama hembusan suara.',
      commonMistakeId: 'Di akhir kata (Auslautverhärtung), B mengeras mirip bunyi "P" (misal: "ab" diucapkan [ap]).',
      secretTrick: 'Di awal kata sama persis dengan B Indonesia; waspadai pengerasan bunyi jika berada di akhir kata.'
    },
    audioText: {
      letterOnly: 'Be',
      exampleWord: 'das Buch'
    }
  },
  {
    id: 'c',
    letter: 'C',
    lowercase: 'c',
    name: 'Tse',
    ipa: '[tseː]',
    category: 'consonant',
    isCriticalForId: true,
    anchor: {
      word: 'Tsunami / Pizza',
      analogy: 'Letupan konsonan ganda TS, BUKAN cacing',
      highlightLetter: 'C'
    },
    example: {
      word: 'Café',
      article: 'das',
      meaningId: 'Kafe',
      isCognate: true,
      ipa: '[kaˈfeː]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menempel di pangkal gigi seri atas, letupkan suara desis [ts] tajam seketika.',
      commonMistakeId: 'Lidah Indonesia refleks melafalkannya "Ce" seperti "cacing". Dalam alfabet Jerman namanya murni "Tse".',
      secretTrick: 'Ingat kata "pizza" (pi-TSA) atau "tsunami". Nama huruf ini adalah [tseː].'
    },
    audioText: {
      letterOnly: 'Tse',
      exampleWord: 'das Café'
    }
  },
  {
    id: 'd',
    letter: 'D',
    lowercase: 'd',
    name: 'De',
    ipa: '[deː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Danau / Dinding',
      analogy: 'Konsonan letup dental bersuara',
      highlightLetter: 'D'
    },
    example: {
      word: 'Danke',
      meaningId: 'Terima kasih',
      isCognate: false,
      ipa: '[ˈdaŋkə]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menyentuh gusi di belakang gigi seri atas.',
      commonMistakeId: 'Di akhir suku kata/kata mengalami pengerasan (Auslautverhärtung) menjadi bunyi "T" (misal: "und" dibaca [ʊnt]).',
      secretTrick: 'Ucapkan D tegas dengan ujung lidah lebih ke depan.'
    },
    audioText: {
      letterOnly: 'De',
      exampleWord: 'Danke'
    }
  },
  {
    id: 'e',
    letter: 'E',
    lowercase: 'e',
    name: 'E',
    ipa: '[eː]',
    category: 'vowel',
    isCriticalForId: false,
    anchor: {
      word: 'Sate / Tempe',
      analogy: 'Vokal E tegang tertutup, bukan ember',
      highlightLetter: 'E'
    },
    example: {
      word: 'Elefant',
      article: 'der',
      meaningId: 'Gajah',
      isCognate: true,
      ipa: '[eleˈfant]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir sedikit melebar tersenyum, lidah terangkat ke langit-langit depan.',
      commonMistakeId: 'Sering tertukar dengan E terbuka ("ember"). Huruf E panjang Jerman tertutup tegang seperti pada "sate".',
      secretTrick: 'Tersenyumlah sedikit saat membunyikan nama huruf "E" agar suaranya jernih dan tegang.'
    },
    audioText: {
      letterOnly: 'E',
      exampleWord: 'der Elefant'
    }
  },
  {
    id: 'f',
    letter: 'F',
    lowercase: 'f',
    name: 'Ef',
    ipa: '[ɛf]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Foto / Fajar',
      analogy: 'Gesekan labiodental tak bersuara',
      highlightLetter: 'F'
    },
    example: {
      word: 'Familie',
      article: 'die',
      meaningId: 'Keluarga',
      isCognate: true,
      ipa: '[faˈmiːli̯ə]'
    },
    phoneticTip: {
      mouthPosition: 'Gigi seri atas bersandar lembut di bibir bawah, hembuskan udara.',
      commonMistakeId: 'Jangan menempelkan kedua bibir (bukan bunyi "P").',
      secretTrick: 'Tiup udara di celah gigi atas dan bibir bawah seperti meniup lilin.'
    },
    audioText: {
      letterOnly: 'Ef',
      exampleWord: 'die Familie'
    }
  },
  {
    id: 'g',
    letter: 'G',
    lowercase: 'g',
    name: 'Ge',
    ipa: '[geː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Gitar / Gelas',
      analogy: 'Keras murni, bukan J Inggris',
      highlightLetter: 'G'
    },
    example: {
      word: 'Gitarre',
      article: 'die',
      meaningId: 'Gitar',
      isCognate: true,
      ipa: '[ɡiˈtaʁə]'
    },
    phoneticTip: {
      mouthPosition: 'Pangkal lidah menekan langit-langit lunak belakang, letupkan dengan suara vokal.',
      commonMistakeId: 'Jangan pernah diucapkan empuk seperti "J" Inggris (bukan "Ji"). Selalu "Ge" keras.',
      secretTrick: 'Ingat suara awal "Gelas" atau "Gitar". Selalu keras dan mantap.'
    },
    audioText: {
      letterOnly: 'Ge',
      exampleWord: 'die Gitarre'
    }
  },
  {
    id: 'h',
    letter: 'H',
    lowercase: 'h',
    name: 'Ha',
    ipa: '[haː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Hotel / Hari',
      analogy: 'Hembusan glotal lembut',
      highlightLetter: 'H'
    },
    example: {
      word: 'Hotel',
      article: 'das',
      meaningId: 'Hotel',
      isCognate: true,
      ipa: '[hoˈtɛl]'
    },
    phoneticTip: {
      mouthPosition: 'Buka tenggorokan santai, hembuskan napas hangat dari glotis.',
      commonMistakeId: 'Di awal kata H dibaca jelas. Namun di tengah kata setelah vokal (Dehnungs-h), H membisu dan memperpanjang vokal (misal "gehen").',
      secretTrick: 'Nama hurufnya "Ha" seperti hembusan napas lega.'
    },
    audioText: {
      letterOnly: 'Ha',
      exampleWord: 'das Hotel'
    }
  },
  {
    id: 'i',
    letter: 'I',
    lowercase: 'i',
    name: 'I',
    ipa: '[iː]',
    category: 'vowel',
    isCriticalForId: false,
    anchor: {
      word: 'Ide / Ibu',
      analogy: 'Vokal tinggi depan tertutup',
      highlightLetter: 'I'
    },
    example: {
      word: 'Idee',
      article: 'die',
      meaningId: 'Ide / Gagasan',
      isCognate: true,
      ipa: '[iˈdeː]'
    },
    phoneticTip: {
      mouthPosition: 'Lidah diangkat tinggi ke depan mendekati langit-langit keras, sudut bibir ditarik ke samping.',
      commonMistakeId: 'Tidak ada kesulitan, sama seperti "i" panjang pada "Ide".',
      secretTrick: 'Tarik sudut bibir ke samping kanan dan kiri secara simetris.'
    },
    audioText: {
      letterOnly: 'I',
      exampleWord: 'die Idee'
    }
  },
  {
    id: 'j',
    letter: 'J',
    lowercase: 'j',
    name: 'Jot',
    ipa: '[jɔt]',
    category: 'consonant',
    isCriticalForId: true,
    anchor: {
      word: 'Yoyo / Yakin',
      analogy: 'SELALU berbunyi Y, BUKAN J jeruk!',
      highlightLetter: 'J'
    },
    example: {
      word: 'Jacke',
      article: 'die',
      meaningId: 'Jaket',
      isCognate: true,
      ipa: '[ˈjakə]'
    },
    phoneticTip: {
      mouthPosition: 'Punggung lidah naik mendekati langit-langit keras, persis posisi bunyi "Y" bahasa Indonesia.',
      commonMistakeId: 'JEBAKAN UTAMA: Penutur RI sering melafalkan "J" seperti "jeruk" atau "Jakarta". Dalam bahasa Jerman huruf J SELALU dibaca Y!',
      secretTrick: 'Tiap kali melihat huruf J, langsung bayangkan huruf Y di kepala Anda. "Ja" dibaca "Ya", "Jacke" dibaca "Yake".'
    },
    audioText: {
      letterOnly: 'Jot',
      exampleWord: 'die Jacke'
    }
  },
  {
    id: 'k',
    letter: 'K',
    lowercase: 'k',
    name: 'Ka',
    ipa: '[kaː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Kopi / Kamera',
      analogy: 'Letupan velar tak bersuara dengan aspirasi',
      highlightLetter: 'K'
    },
    example: {
      word: 'Kaffee',
      article: 'der',
      meaningId: 'Kopi',
      isCognate: true,
      ipa: '[ˈkafe]'
    },
    phoneticTip: {
      mouthPosition: 'Pangkal lidah menutup langit-langit lunak lalu meletupkan udara dengan sedikit letupan napas (aspirasi).',
      commonMistakeId: 'K Jerman memiliki letupan hembusan napas lembut (kʰ) di awal kata.',
      secretTrick: 'Letakkan telapak tangan di depan mulut; Anda harus merasakan hembusan udara hangat saat mengucap "Ka".'
    },
    audioText: {
      letterOnly: 'Ka',
      exampleWord: 'der Kaffee'
    }
  },
  {
    id: 'l',
    letter: 'L',
    lowercase: 'l',
    name: 'El',
    ipa: '[ɛl]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Lampu / Lemon',
      analogy: 'Konsonan lateral alveolar ringan',
      highlightLetter: 'L'
    },
    example: {
      word: 'Lampe',
      article: 'die',
      meaningId: 'Lampu',
      isCognate: true,
      ipa: '[ˈlampə]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menempel tepat di balik gigi seri atas, aliran udara mengalir lewat sisi samping lidah.',
      commonMistakeId: 'Jangan melafalkannya dengan "L gelap/tebal" (dark L Inggris). L Jerman selalu ringan dan bersih (light L).',
      secretTrick: 'Sentuh ringan batas gigi dan gusi atas dengan ujung lidah Anda.'
    },
    audioText: {
      letterOnly: 'El',
      exampleWord: 'die Lampe'
    }
  },
  {
    id: 'm',
    letter: 'M',
    lowercase: 'm',
    name: 'Em',
    ipa: '[ɛm]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Musik / Mama',
      analogy: 'Konsonan sengau bilabial',
      highlightLetter: 'M'
    },
    example: {
      word: 'Musik',
      article: 'die',
      meaningId: 'Musik',
      isCognate: true,
      ipa: '[muˈziːk]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir terkatup rapat, suara beresonansi keluar melalui rongga hidung.',
      commonMistakeId: 'Identik dengan M Indonesia, sangat mudah diucapkan.',
      secretTrick: 'Rapatkan kedua bibir dan dengungkan suara di hidung.'
    },
    audioText: {
      letterOnly: 'Em',
      exampleWord: 'die Musik'
    }
  },
  {
    id: 'n',
    letter: 'N',
    lowercase: 'n',
    name: 'En',
    ipa: '[ɛn]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Nama / Nasi',
      analogy: 'Konsonan sengau alveolar',
      highlightLetter: 'N'
    },
    example: {
      word: 'Name',
      article: 'der',
      meaningId: 'Nama',
      isCognate: true,
      ipa: '[ˈnaːmə]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menyentuh gusi atas, udara mengalir keluar melalui hidung.',
      commonMistakeId: 'Tidak ada kesulitan, sama seperti N bahasa Indonesia.',
      secretTrick: 'Ucapkan "En" secara santai dan jelas.'
    },
    audioText: {
      letterOnly: 'En',
      exampleWord: 'der Name'
    }
  },
  {
    id: 'o',
    letter: 'O',
    lowercase: 'o',
    name: 'O',
    ipa: '[oː]',
    category: 'vowel',
    isCriticalForId: false,
    anchor: {
      word: 'Toko / Foto',
      analogy: 'Vokal belakang bulat tertutup',
      highlightLetter: 'O'
    },
    example: {
      word: 'Orange',
      article: 'die',
      meaningId: 'Jeruk',
      isCognate: true,
      ipa: '[oˈʁaŋʒə]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir membulat sempurna ke depan, pangkal lidah tertarik ke belakang.',
      commonMistakeId: 'Jangan dibuat diftong "ou" seperti bahasa Inggris. O Jerman adalah monoftong murni.',
      secretTrick: 'Bentuk bibir melingkar kencang seperti meniup lilin dari kejauhan.'
    },
    audioText: {
      letterOnly: 'O',
      exampleWord: 'die Orange'
    }
  },
  {
    id: 'p',
    letter: 'P',
    lowercase: 'p',
    name: 'Pe',
    ipa: '[peː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Pos / Paspor',
      analogy: 'Letupan bilabial tak bersuara beraspirasi',
      highlightLetter: 'P'
    },
    example: {
      word: 'Pass',
      article: 'der',
      meaningId: 'Paspor',
      isCognate: true,
      ipa: '[pas]'
    },
    phoneticTip: {
      mouthPosition: 'Kedua bibir terkatup erat, lalu dibuka mendadak disertai letupan udara.',
      commonMistakeId: 'Di awal kata selalu dihembuskan dengan letupan nafas kecil (aspirasi pʰ).',
      secretTrick: 'Letupkan udara seperti membuka sumbat botol gabus.'
    },
    audioText: {
      letterOnly: 'Pe',
      exampleWord: 'der Pass'
    }
  },
  {
    id: 'q',
    letter: 'Q',
    lowercase: 'q',
    name: 'Ku',
    ipa: '[kuː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Kualitas / Kwitansi',
      analogy: 'Kombinasi bunyi [kv] dalam kata',
      highlightLetter: 'Q'
    },
    example: {
      word: 'Quittung',
      article: 'die',
      meaningId: 'Kwitansi',
      isCognate: true,
      ipa: '[ˈkvɪtʊŋ]'
    },
    phoneticTip: {
      mouthPosition: 'Nama huruf dieja "Ku" [kuː]. Namun dalam kata hampir selalu muncul berpasangan dengan "u" ("qu-") dan dibaca [kv].',
      commonMistakeId: 'Dalam bahasa Inggris "qu" berbunyi [kw] ("kwi"), tetapi dalam bahasa Jerman berbunyi [kv] ("kvi").',
      secretTrick: 'Ingat: dalam kata Jerman "Quittung" dibaca "Kvi-tung", bukan "Kwi-tung".'
    },
    audioText: {
      letterOnly: 'Ku',
      exampleWord: 'die Quittung'
    }
  },
  {
    id: 'r',
    letter: 'R',
    lowercase: 'r',
    name: 'Er',
    ipa: '[ɛʁ]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Gargle (Berkumur)',
      analogy: 'Getaran tekak kerongkongan',
      highlightLetter: 'R'
    },
    example: {
      word: 'Radio',
      article: 'das',
      meaningId: 'Radio',
      isCognate: true,
      ipa: '[ˈʁaːdi̯o]'
    },
    phoneticTip: {
      mouthPosition: 'Getaran diproduksi di kerongkongan belakang (uvular [ʁ]), bukan ujung lidah di gigi depan.',
      commonMistakeId: 'Orang Indonesia sering menggetarkan ujung lidah seperti R bahasa Indonesia. Jerman standar menggunakan R tenggorokan.',
      secretTrick: 'Bayangkan Anda sedang berkumur-kumur air (gargling) di pangkal tenggorokan.'
    },
    audioText: {
      letterOnly: 'Er',
      exampleWord: 'das Radio'
    }
  },
  {
    id: 's',
    letter: 'S',
    lowercase: 's',
    name: 'Es',
    ipa: '[ɛs]' ,
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Zebra (awal) / Susu (akhir)',
      analogy: 'Bersuara [z] di depan vokal, desis [s] di akhir',
      highlightLetter: 'S'
    },
    example: {
      word: 'Sonne',
      article: 'die',
      meaningId: 'Matahari',
      isCognate: false,
      ipa: '[ˈzɔnə]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah di dekat gigi depan. Jika diikuti vokal, pita suara bergetar menghasilkan dengungan [z].',
      commonMistakeId: 'Di awal kata sebelum vokal (misal "Sonne", "sie"), huruf S dibaca bergetar seperti Z ("Zonne", "zii").',
      secretTrick: 'Awal kata sebelum vokal = berbunyi Z lebah mendengung; akhir kata / konsonan = berbunyi S desis murni.'
    },
    audioText: {
      letterOnly: 'Es',
      exampleWord: 'die Sonne'
    }
  },
  {
    id: 't',
    letter: 'T',
    lowercase: 't',
    name: 'Te',
    ipa: '[teː]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Teh / Tomat',
      analogy: 'Letupan alveolar tajam beraspirasi',
      highlightLetter: 'T'
    },
    example: {
      word: 'Tee',
      article: 'der',
      meaningId: 'Teh',
      isCognate: true,
      ipa: '[teː]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menempel di gusi atas, lepas dengan letupan udara tajam [tʰ].',
      commonMistakeId: 'Lebih berhembus daripada T bahasa Indonesia.',
      secretTrick: 'Ucapkan seperti kata "Teh" panas dengan letupan nafas kecil.'
    },
    audioText: {
      letterOnly: 'Te',
      exampleWord: 'der Tee'
    }
  },
  {
    id: 'u',
    letter: 'U',
    lowercase: 'u',
    name: 'U',
    ipa: '[uː]',
    category: 'vowel',
    isCriticalForId: false,
    anchor: {
      word: 'Udang / Universitas',
      analogy: 'Vokal belakang tinggi bulat',
      highlightLetter: 'U'
    },
    example: {
      word: 'Uhr',
      article: 'die',
      meaningId: 'Jam',
      isCognate: false,
      ipa: '[uːɐ̯]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir monyong membulat rapat ke depan, pangkal lidah terangkat ke langit-langit lunak.',
      commonMistakeId: 'Mirip U bahasa Indonesia, namun bibir ditarik lebih maju dan membulat kecil.',
      secretTrick: 'Monyongkan bibir seperti hendak meniup seruling.'
    },
    audioText: {
      letterOnly: 'U',
      exampleWord: 'die Uhr'
    }
  },
  {
    id: 'v',
    letter: 'V',
    lowercase: 'v',
    name: 'Vau',
    ipa: '[faʊ̯]',
    category: 'consonant',
    isCriticalForId: true,
    anchor: {
      word: 'Foto / Fajar',
      analogy: 'Kata Jerman asli SELALU berbunyi F murni!',
      highlightLetter: 'V'
    },
    example: {
      word: 'Vater',
      article: 'der',
      meaningId: 'Ayah',
      isCognate: false,
      ipa: '[ˈfaːtɐ]'
    },
    phoneticTip: {
      mouthPosition: 'Gigi seri atas diletakkan di bibir bawah bagian dalam, hembuskan udara tanpa getaran pita suara [f].',
      commonMistakeId: 'JEBAKAN UTAMA: Orang Indonesia sering membaca huruf V sebagai [v] atau [w]. Pada kata asli Jerman ("Vater", "vier", "viel"), V SELALU dibaca F!',
      secretTrick: 'Ingat singkatan Volkswagen (VW) = "Fau-We". Bunyinya persis huruf F pada "Foto". "Vater" dibaca "Fater"!'
    },
    audioText: {
      letterOnly: 'Vau',
      exampleWord: 'der Vater'
    }
  },
  {
    id: 'w',
    letter: 'W',
    lowercase: 'w',
    name: 'We',
    ipa: '[veː]',
    category: 'consonant',
    isCriticalForId: true,
    anchor: {
      word: 'Variasi / Wesel',
      analogy: 'Konsonan V gigi-bibir, bukan W warung!',
      highlightLetter: 'W'
    },
    example: {
      word: 'Wasser',
      article: 'das',
      meaningId: 'Air',
      isCognate: false,
      ipa: '[ˈvasɐ]'
    },
    phoneticTip: {
      mouthPosition: 'Gigi seri atas menyentuh bibir bawah dengan getaran suara berdesir [v] (labiodental bersuara).',
      commonMistakeId: 'JEBAKAN UTAMA: Lidah RI refleks membulatkan bibir menjadi "W" seperti "warung" atau "wajah". Di Jerman huruf W SELALU berbunyi V!',
      secretTrick: 'Gigi seri atas HARUS menggigit ringan bibir bawah. "Wasser" berbunyi "Vasser", "Wo" berbunyi "Vo".'
    },
    audioText: {
      letterOnly: 'We',
      exampleWord: 'das Wasser'
    }
  },
  {
    id: 'x',
    letter: 'X',
    lowercase: 'x',
    name: 'Ix',
    ipa: '[ɪks]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Taksi / Ekstra',
      analogy: 'Kombinasi letupan [ks]',
      highlightLetter: 'X'
    },
    example: {
      word: 'Xylofon',
      article: 'das',
      meaningId: 'Silofon',
      isCognate: true,
      ipa: '[ksyloˈfoːn]'
    },
    phoneticTip: {
      mouthPosition: 'Letupan K di belakang langsung disusul desis S di depan gigi.',
      commonMistakeId: 'Tidak ada kendala, sama seperti bunyi "ks" pada kata "taksi".',
      secretTrick: 'Ucapkan "Iks" dengan tegas.'
    },
    audioText: {
      letterOnly: 'Ix',
      exampleWord: 'das Xylofon'
    }
  },
  {
    id: 'y',
    letter: 'Y',
    lowercase: 'y',
    name: 'Ypsilon',
    ipa: '[ˈʏpsilɔn]',
    category: 'consonant',
    isCriticalForId: false,
    anchor: {
      word: 'Ypsilon / Yoga / Ü',
      analogy: 'Dalam kata pinjaman dibaca seperti Ü atau Y',
      highlightLetter: 'Y'
    },
    example: {
      word: 'Yoga',
      article: 'das',
      meaningId: 'Yoga',
      isCognate: true,
      ipa: '[ˈjoːɡa]'
    },
    phoneticTip: {
      mouthPosition: 'Nama huruf dieja "Ypsilon". Di dalam kata asal Yunani dibaca seperti [y] (Ü), di kata serapan modern berbunyi [j] (Y).',
      commonMistakeId: 'Nama huruf ini unik dan berirama: "Ypsilon".',
      secretTrick: 'Hafalkan bunyinya dengan tiga ketukan ritmis: "Yp - si - lon".'
    },
    audioText: {
      letterOnly: 'Ypsilon',
      exampleWord: 'das Yoga'
    }
  },
  {
    id: 'z',
    letter: 'Z',
    lowercase: 'z',
    name: 'Zett',
    ipa: '[tsɛt]',
    category: 'consonant',
    isCriticalForId: true,
    anchor: {
      word: 'Pizza / Tsunami',
      analogy: 'SELALU letupan TS tajam, BUKAN Z zaman!',
      highlightLetter: 'Z'
    },
    example: {
      word: 'Zug',
      article: 'der',
      meaningId: 'Kereta api',
      isCognate: false,
      ipa: '[tsuːk]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah menempel di belakang gigi atas, lepaskan seketika dengan semburan desis [ts] tajam tak bersuara.',
      commonMistakeId: 'JEBAKAN FATAL: Orang Indonesia hampir selalu membaca Z mendengung seperti "zaman" atau "zebra". Huruf Z Jerman SELALU "TS"!',
      secretTrick: 'Bayangkan suara cipratan minyak panas saat menggoreng: "TSST!". "Zug" dibaca "Tsuuk", "Zimmer" dibaca "Tsimer".'
    },
    audioText: {
      letterOnly: 'Zett',
      exampleWord: 'der Zug'
    }
  },
  {
    id: 'ae',
    letter: 'Ä',
    lowercase: 'ä',
    name: 'Ä (A-Umlaut)',
    ipa: '[ɛː]',
    category: 'special',
    isCriticalForId: false,
    anchor: {
      word: 'Ember / Bebek',
      analogy: 'Vokal E terbuka lebar',
      highlightLetter: 'Ä'
    },
    example: {
      word: 'Äpfel',
      article: 'die',
      meaningId: 'Apel-apel (jamak)',
      isCognate: true,
      ipa: '[ˈɛpfl̩]'
    },
    phoneticTip: {
      mouthPosition: 'Rahang bawah diturunkan lebih lebar daripada huruf E biasa, lidah berada di tengah bawah mulut.',
      commonMistakeId: 'Sering dibaca "A" biasa karena melihat bentuk fisiknya. Huruf ini adalah varian vokal E terbuka.',
      secretTrick: 'Buka mulut lebar-lebar dan bunyikan "E" seperti kata "Ember" atau "Bebek".'
    },
    audioText: {
      letterOnly: 'Ä',
      exampleWord: 'die Äpfel'
    }
  },
  {
    id: 'oe',
    letter: 'Ö',
    lowercase: 'ö',
    name: 'Ö (O-Umlaut)',
    ipa: '[øː]',
    category: 'special',
    isCriticalForId: true,
    anchor: {
      word: 'Sopir (Bibir O Lidah E)',
      analogy: 'Bibir bulat O, tapi bunyikan E',
      highlightLetter: 'Ö'
    },
    example: {
      word: 'Öl',
      article: 'das',
      meaningId: 'Minyak',
      isCognate: false,
      ipa: '[øːl]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir dimonyongkan membulat erat membentuk lubang huruf O, namun posisi lidah di dalam mulut tetap mengucapkan vokal E.',
      commonMistakeId: 'Orang Indonesia sering melafalkannya O biasa atau E biasa. Vokal bulat depan ini tidak ada padanan alaminya di alfabet Indonesia.',
      secretTrick: 'TRIK SENSOMOTORIK: Ucapkan "Eeeee..." tahan lidah Anda di posisi itu, lalu tanpa menggeser lidah, bulatkan bibir Anda membentuk lingkaran "O". Suara yang keluar otomatis adalah Ö murni!'
    },
    audioText: {
      letterOnly: 'Ö',
      exampleWord: 'das Öl'
    }
  },
  {
    id: 'ue',
    letter: 'Ü',
    lowercase: 'ü',
    name: 'Ü (U-Umlaut)',
    ipa: '[yː]',
    category: 'special',
    isCriticalForId: true,
    anchor: {
      word: 'Siul (Bibir U Lidah I)',
      analogy: 'Bibir monyong bulat U, tapi bunyikan I',
      highlightLetter: 'Ü'
    },
    example: {
      word: 'Übung',
      article: 'die',
      meaningId: 'Latihan',
      isCognate: false,
      ipa: '[ˈyːbʊŋ]'
    },
    phoneticTip: {
      mouthPosition: 'Bibir dimonyongkan maju ke depan membentuk lubang kecil seperti hendak bersiul, sementara ujung lidah menekan gigi seri bawah mengucapkan vokal I.',
      commonMistakeId: 'Orang Indonesia sering mengucapkannya U biasa. Padahal posisi lidahnya berada di vokal I!',
      secretTrick: 'TRIK SENSOMOTORIK: Ucapkan "Iiiii..." panjang-panjang, tahan lidah Anda tetap di depan, lalu perlahan monyongkan bibir sekencang mungkin seperti hendak bersiul. Anda akan langsung menghasilkan bunyi Ü sempurna!'
    },
    audioText: {
      letterOnly: 'Ü',
      exampleWord: 'die Übung'
    }
  },
  {
    id: 'ss',
    letter: 'ß',
    lowercase: 'ß',
    name: 'Eszett (ß)',
    ipa: '[ɛsˈtsɛt]',
    category: 'special',
    isCriticalForId: false,
    anchor: {
      word: 'Massa / Es',
      analogy: 'Desis S tajam panjang rangkap',
      highlightLetter: 'ß'
    },
    example: {
      word: 'Straße',
      article: 'die',
      meaningId: 'Jalan raya',
      isCognate: false,
      ipa: '[ˈʃtʁaːsə]'
    },
    phoneticTip: {
      mouthPosition: 'Ujung lidah di dekat gigi depan, hembuskan desisan tajam tak bersuara [s].',
      commonMistakeId: 'Bentuknya sering disangka huruf B kapital atau huruf Beta Yunani. Ini adalah ligatur huruf S rangkap (Eszett / scharfes S).',
      secretTrick: 'Selalu diucapkan sebagai bunyi "S" tajam (tidak pernah bergetar Z), dan menandakan vokal sebelumnya dibaca panjang atau berupa diftong.'
    },
    audioText: {
      letterOnly: 'Eszett',
      exampleWord: 'die Straße'
    }
  }
]
