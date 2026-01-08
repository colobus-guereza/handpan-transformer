// Updated: 2024-12-11 (Force Rebuild)
export interface LocalizedContent {
    name: string;
    description?: string;
    tags?: string[];
}

export interface NoteData {
    id: number;
    label: string; // e.g., "C4", "Ding"
    frequency?: number;
    visualFrequency?: number;
    subLabel?: string;
    cx?: number;
    cy?: number;
    scale?: number;
    rotate?: number;
    scaleX?: number;
    scaleY?: number;
    labelX?: number;
    labelY?: number;
    labelOffset?: number;
    offset?: number | [number, number, number];
    position?: string; // Used for some layout logic?
    hideGuide?: boolean;
    textColor?: string;
    outlineColor?: string;
}

export interface Scale {
    id: string;
    name: string;
    nameEn?: string;
    notes: {
        ding: string;
        top: string[];
        bottom: string[];
    };
    vector: {
        minorMajor: number; // -1.0 (Dark) ~ 1.0 (Bright)
        pureSpicy: number;  // 0.0 (Pure) ~ 1.0 (Spicy)
        rarePopular: number; // 0.0 (Rare) ~ 1.0 (Popular)
    };
    tags: string[];
    tagsEn?: string[];
    description: string;
    descriptionEn?: string;
    videoUrl?: string;
    productUrl?: string;
    ownUrl?: string;
    ownUrlEn?: string;
    i18n?: Record<string, LocalizedContent>;
}

export const VECTOR_AXES = {
    minorMajor: {
        id: 'minorMajor',
        label: '조성 (Mood)',
        labelEn: 'Mood',
        description: '스케일이 주는 전체적인 감정적 분위기를 나타냅니다.',
        descriptionEn: 'Represents the overall emotional atmosphere of the scale.',
        minLabel: 'Minor (단조)',
        minLabelEn: 'Minor',
        maxLabel: 'Major (장조)',
        maxLabelEn: 'Major',
        range: '-1.0 ~ +1.0'
    },
    pureSpicy: {
        id: 'pureSpicy',
        label: '음향 질감 (Tone)',
        labelEn: 'Tone',
        description: '소리의 담백함과 화려함의 정도를 나타냅니다.',
        descriptionEn: 'Represents the degree of simplicity vs. complexity of the sound.',
        minLabel: 'Pure (담백함)',
        minLabelEn: 'Pure',
        maxLabel: 'Spicy (화려함)',
        maxLabelEn: 'Spicy',
        range: '0.0 ~ 1.0'
    },
    rarePopular: {
        id: 'rarePopular',
        label: '대중성 (Popularity)',
        labelEn: 'Popularity',
        description: '시장에서의 희소성과 대중적인 인기를 나타냅니다.',
        descriptionEn: 'Represents market rarity and popular demand.',
        minLabel: 'Rare (희소함)',
        minLabelEn: 'Rare',
        maxLabel: 'Popular (대중적)',
        maxLabelEn: 'Popular',
        range: '0.0 ~ 1.0'
    }
} as const;

export const SCALES: Scale[] = [
    // 1. D Kurd 9 (The Standard Minor)
    {
        id: "d_kurd_9",
        name: "D Kurd 9",
        nameEn: "D Kurd 9",
        notes: {
            ding: "D3",
            top: ["A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4"],
            bottom: []
        },
        vector: { minorMajor: -0.8, pureSpicy: 0.1, rarePopular: 1.0 },
        tags: ["마이너", "대중적", "스테디셀러", "감성적"],
        tagsEn: ["Minor", "Popular", "Steady Seller", "Emotional"],
        description: "가장 대중적인 마이너 스케일입니다. 깊고 감성적인 울림으로 완벽한 균형을 이룹니다.",
        descriptionEn: "The most popular minor scale. It achieves perfect balance with a deep and emotional resonance.",
        videoUrl: "https://youtu.be/IvdeC_YuSIg",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/9206864886",
        ownUrl: "https://handpan.co.kr/shop/?idx=75",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=75",
        i18n: {
            fr: {
                name: "D Kurd 9",
                description: "L'une des gammes mineures les plus populaires. Avec ses 9 notes, elle offre une profondeur émotionnelle et une ambiance intime, tout en gardant un excellent équilibre pour l'improvisation et la composition."
            },
            ja: {
                name: "D Kurd 9",
                description: "最もポピュラーなマイナースケールです。深く感情的な響きが特徴で、バランスの取れたサウンドを生み出します。"
            },
            zh: {
                name: "D Kurd 9",
                description: "最受欢迎的小调音阶之一。拥有深沉而富有情感的共鸣，在明暗之间取得了非常好的平衡，是寻找典型\"handpan 小调氛围\"的玩家的理想选择。"
            },
            de: {
                name: "D Kurd 9",
                description: "Eine der beliebtesten Moll-Skalen überhaupt. Sie bietet einen tiefen, emotionalen Klang und erreicht eine sehr ausgewogene Balance zwischen Wärme und Ausdruck."
            },
            es: {
                name: "D Kurd 9",
                description: "Una de las escalas menores más populares. Ofrece una resonancia profunda y emocional, con un equilibrio perfecto entre claridad y calidez."
            },
            ru: {
                name: "D Kurd 9",
                description: "Одна из самых популярных минорных гамм. Обладает глубоким, эмоциональным звучанием и создаёт по-настоящему сбалансированное настроение."
            },
            fa: {
                name: "D Kurd 9",
                description: "یکی از محبوب‌ترین گام‌های مینور است. صدایی عمیق و احساسی دارد و تعادلی بسیار خوب بین گرما و شفافیت ایجاد می‌کند."
            },
            pt: {
                name: "D Kurd 9",
                description: "Uma das escalas menores mais populares. Oferece uma ressonância profunda e emocional, com um equilíbrio perfeito entre clareza e calor."
            },
            ae: {
                name: "D Kurd 9",
                description: "من أكثر السلالم المينور انتشارًا. يتميّز برنين عميق وعاطفي ويقدّم توازنًا جميلًا بين الوضوح والدفء."
            },
            it: {
                name: "D Kurd 9",
                description: "È una delle scale minori più diffuse. Il suo suono profondo e ricco di emozione crea un equilibrio perfetto tra chiarezza e sensibilità."
            }
        }
    },

    // 2. D Kurd 10 (The Standard Minor Extended)
    {
        id: "d_kurd_10",
        name: "D Kurd 10",
        nameEn: "D Kurd 10",
        notes: {
            ding: "D3",
            top: ["A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "C5"],
            bottom: []
        },
        vector: { minorMajor: -0.8, pureSpicy: 0.1, rarePopular: 0.98 },
        tags: ["마이너", "대중적", "연습곡 제일많음", "유튜브교재도 많음"],
        tagsEn: ["Minor", "Popular", "Most Practice Songs", "Youtube Tutorials"],
        description: "대중적인 D minor와 같은 음계인 D Kurd 10으로, 유튜브에 악보와 연습곡이 가장 많은 입문용에 적합한 모델입니다. 대중적인 음계이기 때문에 다양한 음악분야에서의 활용도가 매우 높습니다.",
        descriptionEn: "D Kurd 10, the same scale as the popular D minor. It is the best model for beginners with the most sheet music and practice songs available on YouTube. Due to its popularity, it has very high versatility across various music genres.",
        videoUrl: "https://youtu.be/uL40C1bqKik?si=DpqHwPB_RLpcA5mc",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/7514024868",
        ownUrl: "https://handpan.co.kr/shop/?idx=74",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=74",
        i18n: {
            fr: {
                name: "D Kurd 10",
                description: "Gamme équivalente à un D mineur classique, idéale pour débuter. D'innombrables partitions et morceaux d'exercice sont disponibles sur YouTube, ce qui en fait un modèle parfait pour apprendre et progresser rapidement. En raison de sa popularité, cette gamme offre une très grande polyvalence dans divers genres musicaux."
            },
            ja: {
                name: "D Kurd 10",
                description: "一般的な D マイナーと同じ音構成を持つスケールで、YouTube 上に楽譜や練習曲が最も多く公開されている入門向けモデルです。初めてのハンドパンにも安心してお選びいただけます。"
            },
            zh: {
                name: "D Kurd 10",
                description: "与常见的 D 小调拥有相同音阶。YouTube 上有大量相关乐谱和练习曲，是学习资料最丰富的入门型号，非常适合作为第一台手碟。"
            },
            de: {
                name: "D Kurd 10",
                description: "Diese Skala entspricht der bekannten D-Moll-Tonleiter und ist eines der beliebtesten Einsteigermodelle. Auf YouTube gibt es besonders viele Noten und Übungsstücke – ideal als erstes Handpan."
            },
            es: {
                name: "D Kurd 10",
                description: "Tiene la misma estructura que la escala de Re menor tradicional, por lo que resulta muy familiar al oído. Es un modelo ideal para principiantes, ya que en YouTube se pueden encontrar muchísimas partituras y ejercicios para esta escala."
            },
            ru: {
                name: "D Kurd 10",
                description: "Имеет ту же структуру, что и привычная гамма D minor, поэтому очень естественно воспринимается на слух. Для этой гаммы на YouTube больше всего нот и учебных материалов, поэтому это один из лучших вариантов для начинающих."
            },
            fa: {
                name: "D Kurd 10",
                description: "این گام از نظر ساختار با گامِ شناخته‌شدهٔ ر مینور (D minor) یکسان است و برای گوش بسیار آشناست. به خاطر تعداد زیاد نت‌ها و تمرین‌ها در یوتیوب، برای هنرجویان مبتدی انتخابی عالی است."
            },
            pt: {
                name: "D Kurd 10",
                description: "Possui a mesma estrutura da escala tradicional de D minor (Ré menor), por isso soa muito familiar ao ouvido. É um modelo ideal para iniciantes, pois há muitas partituras e estudos disponíveis no YouTube para essa escala."
            },
            ae: {
                name: "D Kurd 10",
                description: "له البنية نفسها لسلم ري مينور (D minor) التقليدي، لذلك يبدو مألوفًا جدًّا للأذن. بفضل كثرة النوتات والدروس المتاحة له على يوتيوب فهو خيار ممتاز للمبتدئين."
            },
            it: {
                name: "D Kurd 10",
                description: "Ha la stessa struttura della classica scala di D minor, quindi risulta molto familiare all'orecchio. È il modello ideale per principianti, perché su YouTube si trovano moltissime partiture ed esercizi dedicati a questa scala."
            }
        }
    },

    // 3. E Equinox 14 (Normal)
    {
        id: "e_equinox_14",
        name: "E Equinox 14",
        nameEn: "E Equinox 14",
        notes: {
            ding: "E3",
            top: ["G3", "B3", "C4", "D4", "E4", "F#4", "G4", "B4", "C5"],
            bottom: ["C3", "D3", "D5", "E5"]
        },
        vector: { minorMajor: -0.4, pureSpicy: 0.4, rarePopular: 0.5 },
        tags: ["메이저+마이너", "하이브리드", "상급자용", "달콤씁쓸한"],
        tagsEn: ["Major+Minor", "Hybrid", "Advanced", "Bittersweet"],
        description: "메이저와 마이너의 경계에 있는 하이브리드 스케일입니다. 시네마틱한 감성과 달콤씁쓸한 매력이 특징이며, 묵직한 저음을 포함한 14개의 노트로 풍성함을 자랑합니다. 상급자용 모델로 복잡하고 감성적인 연주에 적합합니다.",
        descriptionEn: "A hybrid scale on the border of major and minor. Featuring cinematic emotion and bittersweet charm, it boasts richness with 14 notes including heavy bass. Suitable for advanced players for complex and emotional performance.",
        videoUrl: "https://youtu.be/v9pXYwhylPg?si=Em_dHnMGyeU19YkE",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12351119980",
        ownUrl: "https://handpan.co.kr/shop/?idx=78",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=78",
        i18n: {
            fr: {
                name: "E Equinox 14",
                description: "Gamme hybride entre majeur et mineur, à la fois cinématique et doux-amer. Les 14 notes, incluant des basses puissantes, offrent une grande richesse harmonique, idéale pour des jeux complexes et très expressifs, plutôt destinés aux joueurs avancés."
            },
            ja: {
                name: "E Equinox 14",
                description: "メジャーとマイナーの境界に位置するハイブリッドスケールです。シネマティックな雰囲気とほろ苦い感性が魅力で、重厚な低音を含む 14 音により非常に豊かなサウンドを奏でます。複雑で感情豊かな演奏を楽しみたい上級者向けモデルです。"
            },
            zh: {
                name: "E Equinox 14",
                description: "介于大调与小调之间的混合型音阶，带有电影配乐般的氛围及微妙的苦甜感。包括厚重低音在内的 14 个音，让声音层次极其丰富，非常适合擅长细腻、复杂表达的高级玩家。"
            },
            de: {
                name: "E Equinox 14",
                description: "Eine hybride Skala an der Grenze zwischen Dur und Moll. Sie vereint einen cineastischen Charakter mit bittersüßer Stimmung und bietet dank 14 Tönen inklusive kräftiger Bässe einen sehr vollen Klang. Perfekt für komplexe, emotional gefärbte Spielweisen fortgeschrittener Spieler."
            },
            es: {
                name: "E Equinox 14",
                description: "Escala híbrida situada entre el modo mayor y menor. Destaca por su carácter cinematográfico y su encanto agridulce. Sus 14 notas, incluyendo graves potentes, crean un sonido rico y lleno de matices, perfecto para intérpretes avanzados que buscan composiciones complejas y cargadas de emoción."
            },
            ru: {
                name: "E Equinox 14",
                description: "Гибридная гамма на границе между мажором и минором. Отличается кинематографичной атмосферой и приятной «горько-сладкой» окраской. 14 нот с мощными низами создают насыщенное звучание, идеально подходящее для сложной и очень эмоциональной игры продвинутых исполнителей."
            },
            fa: {
                name: "E Equinox 14",
                description: "یک گام هیبریدی در مرز بین ماژور و مینور است. حال‌وهوایی سینمایی و طعم تلخ‌وشیرینِ خاصی دارد و با ۱۴ نت، از جمله بیس‌های پرقدرت، صدایی بسیار پُر و غنی ایجاد می‌کند که برای نوازندگی احساسی و پیچیدهٔ هنرمندان پیشرفته بسیار مناسب است."
            },
            pt: {
                name: "E Equinox 14",
                description: "Escala híbrida situada na fronteira entre maior e menor. Destaca-se pelo caráter cinematográfico e pelo charme agridoce. As 14 notas, incluindo graves encorpados, criam um som rico e cheio de nuances, perfeito para músicos avançados que buscam interpretações complexas e emocionais."
            },
            ae: {
                name: "E Equinox 14",
                description: "سُلَّم هجين يقع على الحدود بين الماجور والمينور. يقدّم إحساسًا سينمائيًا مع نكهة حلوة مرّة، ومع 14 نغمة تشمل بيسات قوية يخلق صوتًا غنيًا ومليئًا بالتفاصيل، مناسبًا لعزف معقد وعاطفي لعازفين متقدّمين."
            },
            it: {
                name: "E Equinox 14",
                description: "Scala ibrida al confine tra maggiore e minore. Ha un carattere cinematografico, con un fascino dolce-amaro. Le 14 note, inclusi bassi corposi, creano un suono molto ricco: perfetta per esecuzioni complesse e fortemente espressive, pensata per musicisti avanzati."
            }
        }
    },

    // 4. F# Low Pygmy 14 (The Global Bestseller) - Mutant
    {
        id: "fs_low_pygmy_14_mutant",
        name: "F# Low Pygmy 14",
        nameEn: "F# Low Pygmy 14",
        notes: {
            ding: "F#3",
            top: ["G#3", "A3", "C#4", "E4", "F#4", "G#4", "A4", "B4", "C#5", "D3", "E3"], // F#5 -> E3
            bottom: ["E5", "F#5"] // E3 -> F#5
        },
        vector: { minorMajor: -0.6, pureSpicy: 0.25, rarePopular: 0.95 },
        tags: ["피그미", "Malte Marten 스타일", "웰니스감성", "유튜브트렌드", "요가강사인기"],
        tagsEn: ["Pygmy", "Malte Marten Style", "Wellness Emotion", "Youtube Trend"],
        description: "전 세계적으로 가장 인기 있는 베스트셀러 스케일입니다. 낮은 저음 노트들이 조화로운 이야기를 만들어내는 스토리텔링이 특징이며, 깊은 울림을 자랑합니다. Malte Marten 같은 연주자들에 의해 널리 알려진 스타일입니다.",
        descriptionEn: "The world's most popular bestseller scale. Characterized by storytelling where low bass notes create harmonious stories, it boasts deep resonance. A style widely known by players like Malte Marten.",
        videoUrl: "https://youtu.be/SthKlH686Pc?si=_YG050uZwcbIoP0X",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12070387231",
        ownUrl: "https://handpan.co.kr/shop/?idx=97",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=97",
        i18n: {
            fr: {
                name: "F# Low Pygmy 14",
                description: "L'un des Pygmy les plus appréciés au monde, véritable best-seller. Les notes graves tissent une véritable histoire sonore, profonde et envoûtante. Un choix parfait si vous aimez les ambiances racontées par des basses chaleureuses, dans l'esprit de joueurs comme Malte Marten."
            },
            ja: {
                name: "F# Low Pygmy 14",
                description: "世界的に最も人気のあるベストセラースケールの一つです。低音ノートたちが物語を紡ぐように溶け合い、深い共鳴を生み出します。Malte Marten などの奏者によって広く知られるスタイルです。"
            },
            zh: {
                name: "F# Low Pygmy 14",
                description: "全球范围内最受欢迎的畅销 Pygmy 音阶之一。低音区讲述般连贯的故事感是其最大特色，泛起深邃而饱满的共鸣。因 Malte Marten 等演奏家的使用而广为人知。"
            },
            de: {
                name: "F# Low Pygmy 14",
                description: "Eine der weltweit beliebtesten und meistverkauften Pygmy-Skalen. Die tiefen Töne erzählen eine zusammenhängende \"Klanggeschichte\" und sorgen für eine beeindruckend tiefe Resonanz. Dieser Stil ist durch Spieler wie Malte Marten weithin bekannt geworden."
            },
            es: {
                name: "F# Low Pygmy 14",
                description: "Una de las escalas más populares y superventas del mundo. Los graves cuentan una historia sonora coherente y envolvente, con una profundidad de resonancia muy característica. Es un estilo ampliamente conocido gracias a intérpretes como Malte Marten."
            },
            ru: {
                name: "F# Low Pygmy 14",
                description: "Одна из самых популярных и востребованных гамм Pygmy в мире. Глубокие низкие ноты выстраивают цельный музыкальный рассказ и дают очень плотную, объёмную резонансу. Стиль широко известен благодаря таким исполнителям, как Мальте Мартен."
            },
            fa: {
                name: "F# Low Pygmy 14",
                description: "یکی از پرفروش‌ترین و محبوب‌ترین گام‌های Pygmy در جهان است. نت‌های بمِ پایین، داستانی موسیقایی و پیوسته می‌سازند و رزونانسی عمیق و فراگیر ایجاد می‌کنند. این استایل به‌واسطهٔ نوازندگانی مانند Malte Marten به‌خوبی شناخته شده است."
            },
            pt: {
                name: "F# Low Pygmy 14",
                description: "Uma das escalas Pygmy mais populares e best-sellers do mundo. Os graves constroem uma narrativa sonora coerente e envolvente, com uma ressonância profunda muito característica. Estilo amplamente conhecido graças a intérpretes como Malte Marten."
            },
            ae: {
                name: "F# Low Pygmy 14",
                description: "واحد من أكثر سلالم Pygmy مبيعًا وشعبية في العالم. النغمات المنخفضة تحكي قصة موسيقية متماسكة وتمنح رنينًا عميقًا ومحيطًا. هذا الأسلوب معروف على نطاق واسع بفضل عازفين مثل Malte Marten."
            },
            it: {
                name: "F# Low Pygmy 14",
                description: "Una delle scale Pygmy più popolari e vendute al mondo. Le note gravi costruiscono una narrazione musicale naturale e offrono una risonanza profonda. Questo stile è diventato famoso grazie a interpreti come Malte Marten."
            }
        }
    },

    // 5. F Aeolian 10 (Domestic Steady Seller)
    {
        id: "f_aeolian_10",
        name: "F Aeolian 10",
        nameEn: "F Aeolian 10",
        notes: {
            ding: "F3",
            top: ["Ab3", "Bb3", "C4", "Db4", "Eb4", "F4", "G4", "Ab4", "C5"],
            bottom: []
        },
        vector: { minorMajor: -0.8, pureSpicy: 0.15, rarePopular: 0.7 },
        tags: ["한국감성", "마이너", "바텀업그레이드최적", "가성비최고"],
        tagsEn: ["Minor", "Bottom Upgrade Best", "Korean emotion"],
        description: "F minor와 동일한 음계이지만, Aeolian 모드의 관점에서 접근하는 자연 단조 스케일입니다. 안정적이고 우울한 감성이 특징이며, 바텀 업그레이드를 통해 다양한 분위기로 변신이 가능합니다. 가성비 최고의 모델로 추천됩니다.",
        descriptionEn: "A steady seller consistently loved in the domestic market. Characterized by stable and melancholic emotion, it can transform into various atmospheres through bottom upgrades. Recommended as the best value model.",
        videoUrl: "https://youtu.be/BH45TEboAgE?si=SLlNpG-5vTLSWAsx",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/9561986680",
        ownUrl: "https://handpan.co.kr/shop/?idx=71",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=71",
        i18n: {
            fr: {
                name: "F Aeolian 10",
                description: "Même contenu de notes qu'un F mineur, vu depuis le mode éolien (gamme mineure naturelle). Son caractère stable, légèrement mélancolique, en fait un instrument très musical. Peut être enrichi plus tard par des notes supplémentaires en bas, ce qui en fait un modèle au rapport qualité-prix exceptionnel."
            },
            ja: {
                name: "F Aeolian 10",
                description: "F マイナーと同じ音構成を持ちながら、エオリアンモード（自然短音階）の視点でアプローチするスケールです。安定感のある少し憂いを帯びた雰囲気が特徴で、ボトム側のアップグレードによってさまざまなムードに発展させることができます。コストパフォーマンスに優れたおすすめモデルです。"
            },
            zh: {
                name: "F Aeolian 10",
                description: "与 F 小调相同的音阶结构，从 Aeolian（自然小调）角度切入。音色稳定、略带忧郁，通过后期增加底部音可扩展出更多氛围，是性价比极高的推荐型号。"
            },
            de: {
                name: "F Aeolian 10",
                description: "Hat die gleiche Tonstruktur wie F-Moll, wird aber aus der Perspektive der äolischen Tonleiter (natürliche Mollskala) betrachtet. Sie klingt stabil und leicht melancholisch; durch ein späteres Bottom-Upgrade lässt sich die Klangpalette flexibel erweitern. Ein Modell mit ausgezeichnetem Preis-Leistungs-Verhältnis."
            },
            es: {
                name: "F Aeolian 10",
                description: "Comparte la misma estructura que Fa menor, pero enfocada desde el modo eólico (escala menor natural). Se caracteriza por una sensación estable y ligeramente melancólica. Con una futura ampliación de notas graves (bottom upgrade) puede transformarse en una escala muy versátil. Es uno de los modelos con mejor relación calidad-precio."
            },
            ru: {
                name: "F Aeolian 10",
                description: "По звуковому составу совпадает с гаммой F minor, но рассматривается с позиции эолийского лада (натуральный минор). Отличается стабильным, немного меланхоличным характером. При дальнейшей доработке нижних нот (bottom-upgrade) легко раскрывается в разные настроения. Один из лучших вариантов по соотношению цены и возможностей."
            },
            fa: {
                name: "F Aeolian 10",
                description: "از نظر فواصل با فا مینور (F minor) یکسان است، اما از دیدگاه مُدِ Aeolian (مینور طبیعی) به آن نگاه می‌شود. شخصیتی پایدار و کمی غمگین دارد و با ارتقای بخش پایین (bottom upgrade) می‌تواند طیف‌های متنوع‌تری از فضا و حس را ارائه دهد. از نظر ارزش خرید، یکی از بهترین مدل‌ها برای پیشنهاد است."
            },
            pt: {
                name: "F Aeolian 10",
                description: "Tem o mesmo desenho de F minor (Fá menor), mas é abordada a partir do modo eólio (menor natural). Apresenta um caráter estável e levemente melancólico. Com um futuro upgrade de notas graves (bottom upgrade) pode se transformar numa escala muito versátil. É um dos modelos com melhor custo-benefício."
            },
            ae: {
                name: "F Aeolian 10",
                description: "يطابق في تركيبه سلم فا مينور (F minor) لكنه يُقدَّم من منظور طور Aeolian (المينور الطبيعي). يتميّز بطابع ثابت يميل قليلًا إلى الحزن. ومع ترقية النغمات المنخفضة لاحقًا يمكن أن يتحوّل إلى سُلَّم شديد التنوع. من أفضل النماذج من حيث القيمة مقابل السعر."
            },
            it: {
                name: "F Aeolian 10",
                description: "Ha la stessa struttura di F minor, ma viene interpretata nella modalità eolia (minore naturale). Si distingue per un carattere stabile e leggermente malinconico. Con un futuro upgrade del bottom può trasformarsi in molte atmosfere diverse. È uno dei modelli più consigliati per rapporto qualità-prezzo."
            }
        }
    },

    // 6. E Romanian Hijaz 10 (The Exotic Individualist)
    {
        id: "e_romanian_hijaz_10",
        name: "E Romanian Hijaz 10",
        nameEn: "E Romanian Hijaz 10",
        notes: {
            ding: "E3",
            top: ["A3", "B3", "C4", "D#4", "E4", "F#4", "G4", "A4", "B4"],
            bottom: []
        },
        vector: { minorMajor: -0.5, pureSpicy: 0.75, rarePopular: 0.35 },
        tags: ["이국적", "집시", "독특함", "보헤미안"],
        tagsEn: ["Exotic", "Gypsy", "Unique", "Bohemian"],
        description: "남들과 다른 독특함을 추구하는 분들을 위한 이국적인 스케일입니다. 집시와 보헤미안 음악을 연상시키는 강렬하고 신비로운 분위기를 자아냅니다.",
        descriptionEn: "An exotic scale for those seeking uniqueness. It creates an intense and mysterious atmosphere reminiscent of Gypsy and Bohemian music.",
        videoUrl: "https://youtu.be/gTEsQG3dfKQ?si=IJcS8SYJe9468WgP",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8681747137",
        ownUrl: "https://handpan.co.kr/shop/?idx=72",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=72",
        i18n: {
            fr: {
                name: "E Romanian Hijaz 10",
                description: "Pour celles et ceux qui recherchent la différence. Cette gamme au parfum gitan et bohème dégage une énergie forte, mystérieuse et exotique, parfaite pour un jeu expressif et théâtral."
            },
            ja: {
                name: "E Romanian Hijaz 10",
                description: "人と違う個性を求める方のためのエキゾチックスケールです。ジプシー音楽やボヘミアンミュージックを思わせる、強くミステリアスな雰囲気を生み出します。"
            },
            zh: {
                name: "E Romanian Hijaz 10",
                description: "为追求与众不同的玩家打造的异国风情音阶。带有吉普赛与波希米亚音乐的强烈色彩，营造出神秘而又充满张力的气氛。"
            },
            de: {
                name: "E Romanian Hijaz 10",
                description: "Eine exotische Skala für alle, die nach einem besonders individuellen Klang suchen. Sie erinnert an Zigeuner- und Bohemian-Musik und erzeugt eine intensive, mystische Atmosphäre."
            },
            es: {
                name: "E Romanian Hijaz 10",
                description: "Escala exótica pensada para quienes buscan algo diferente. Evoca la energía de la música gitana y bohemia, generando una atmósfera intensa y misteriosa."
            },
            ru: {
                name: "E Romanian Hijaz 10",
                description: "Экзотическая гамма для тех, кто ищет что-то по-настоящему особенное. Напоминает цыганскую и богемную музыку, создавая яркую и таинственную атмосферу."
            },
            fa: {
                name: "E Romanian Hijaz 10",
                description: "یک گام کاملاً اگزوتیک برای کسانی که به‌دنبال تمایز و صدایی متفاوت هستند. یادآور موسیقی کولی و بوهِمی است و فضایی پرانرژی، قوی و رمزآلود ایجاد می‌کند."
            },
            pt: {
                name: "E Romanian Hijaz 10",
                description: "Escala exótica pensada para quem procura algo realmente diferente. Evoca a energia da música cigana e boêmia, criando uma atmosfera intensa e misteriosa."
            },
            ae: {
                name: "E Romanian Hijaz 10",
                description: "سُلَّم أجنبي مخصّص لمن يبحثون عن شيء مختلف حقًا. يذكّر بالموسيقى الغجرية والبوهيمية ويخلق جوًا قويًا وغامضًا."
            },
            it: {
                name: "E Romanian Hijaz 10",
                description: "Scala esotica dedicata a chi cerca qualcosa di davvero diverso. Ricorda la musica gitana e bohemienne, creando un'atmosfera intensa e misteriosa."
            }
        }
    },

    // 7. D Saladin 9 (The Extreme Niche)
    {
        id: "d_saladin_9",
        name: "D Saladin 9",
        nameEn: "D Saladin 9",
        notes: {
            ding: "D3",
            top: ["G3", "A3", "C4", "D4", "Eb4", "F#4", "G4", "A4"],
            bottom: []
        },
        vector: { minorMajor: -0.2, pureSpicy: 0.85, rarePopular: 0.1 },
        tags: ["아라비안", "희귀함", "매운맛", "프리지안"],
        tagsEn: ["Arabian", "Rare", "Spicy", "Phrygian"],
        description: "아라비안 나이트를 연상시키는 매우 이국적이고 강렬한 프리지안 스케일입니다. 희귀함과 매운맛이 특징이며, 희소성이 높아 독보적인 개성을 표현하기 좋습니다.",
        descriptionEn: "A very exotic and intense Phrygian scale reminiscent of Arabian Nights. Characterized by rarity and spiciness, it's great for expressing unique individuality.",
        videoUrl: "https://youtu.be/OJWGyT1OxIg?si=RM_0FkjjEuxaWPJu",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8669289024",
        ownUrl: "https://handpan.co.kr/shop/?idx=85",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=85",
        i18n: {
            fr: {
                name: "D Saladin 9",
                description: "Gamme très exotique de type phrygien, rappelant les nuits orientales et l'ambiance des contes arabes. Son caractère intense, « épicé » et rare en fait un choix idéal pour affirmer une personnalité sonore unique."
            },
            ja: {
                name: "D Saladin 9",
                description: "アラビアンナイトを連想させる、とてもエキゾチックでパワフルなフリジアンスケールです。希少性が高く、スパイシーなサウンドが特徴で、唯一無二の個性を表現したい方に最適です。"
            },
            zh: {
                name: "D Saladin 9",
                description: "令人联想到《一千零一夜》的极其异域、强烈的弗里吉亚（Phrygian）音阶。音色辛辣而独特，稀有度高，非常适合想展现强烈个人风格的玩家。"
            },
            de: {
                name: "D Saladin 9",
                description: "Eine sehr exotische und kraftvolle phrygische Skala, die an \"Arabian Nights\" und orientalische Märchen erinnert. Ihre Seltenheit und \"scharfe Würze\" machen sie ideal, um eine unverwechselbare, charakterstarke Klangsignatur zu schaffen."
            },
            es: {
                name: "D Saladin 9",
                description: "Escala de tipo frigio, muy exótica y poderosa, que recuerda a los cuentos de \"Las mil y una noches\". Su rareza y su carácter \"picante\" la convierten en una opción excelente para expresar una personalidad única y muy marcada."
            },
            ru: {
                name: "D Saladin 9",
                description: "Очень экзотическая и насыщенная фригийская гамма, пробуждающая ассоциации с «арабскими ночами» и восточными сказками. Её редкость и «острый» характер помогут подчеркнуть яркую индивидуальность исполнителя."
            },
            fa: {
                name: "D Saladin 9",
                description: "یک گام فریجیَن بسیار اگزوتیک و قدرتمند است که فضا و حس «شب‌های عربی» را تداعی می‌کند. کمیاب بودن و «تیزی» این گام، آن را برای بیان فردیت قوی و منحصربه‌فرد بسیار مناسب می‌سازد."
            },
            pt: {
                name: "D Saladin 9",
                description: "Escala de caráter frígio, muito exótica e poderosa, que lembra as histórias de \"Noites Árabes\". Sua raridade e o tempero \"picante\" tornam essa escala ideal para expressar uma personalidade forte e única."
            },
            ae: {
                name: "D Saladin 9",
                description: "سُلَّم فريجي قوي وأجنبي جدًّا يثير أجواء «ليالي ألف ليلة وليلة». ندرته وحدّته تجعله مثاليًا للتعبير عن شخصية موسيقية فريدة وواضحة."
            },
            it: {
                name: "D Saladin 9",
                description: "Scala di tipo frigio molto forte ed esotica, che rimanda alle atmosfere delle \"Mille e una notte\". La sua rarità e il carattere piccante la rendono ideale per esprimere una personalità musicale unica."
            }
        }
    },

    // 8. D Asha 9 (The Gentle Major / Sabye)
    {
        id: "d_asha_9",
        name: "D Asha 9",
        nameEn: "D Asha 9",
        notes: {
            ding: "D3",
            top: ["G3", "A3", "B3", "C#4", "D4", "E4", "F#4", "A4"],
            bottom: []
        },
        vector: { minorMajor: 0.9, pureSpicy: 0.1, rarePopular: 0.9 },
        tags: ["D메이저", "세컨팬인기", "젠틀소프트", "Sabye", "Ashakiran"],
        tagsEn: ["D Major", "Popular Second Pan", "Gentle Soft", "Sabye", "Ashakiran"],
        description: "Sabye 또는 Ashakiran이라고도 불리는 부드럽고 온화한 D 메이저 스케일입니다. 젠틀하고 소프트한 음색으로 순수한 빛과 희망을 담고 있으며, 마이너 스케일과 함께 연주하기 좋은 최고의 세컨드 핸드팬으로 인기가 높습니다.",
        descriptionEn: "A soft and gentle D Major scale, also known as Sabye or Ashakiran. It embodies pure light and hope with a gentle tone, and is highly popular as a second handpan to play alongside minor scales.",
        videoUrl: "https://youtu.be/4tgdyOhT-RI?si=9SQ66sdPiwvgxoP7",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8497384066",
        ownUrl: "https://handpan.co.kr/shop/?idx=87",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=87",
        i18n: {
            fr: {
                name: "D Asha 9",
                description: "Aussi connue sous les noms Sabye ou Ashakiran, cette gamme de D majeur est douce et lumineuse. Son timbre gentil et apaisant évoque la pureté, la lumière et l'espoir. C'est un deuxième handpan parfait pour accompagner un modèle mineur."
            },
            ja: {
                name: "D Asha 9",
                description: "Sabye や Ashakiran とも呼ばれる、柔らかく穏やかな D メジャースケールです。ジェントルでソフトなトーンに、純粋な光と希望のイメージを込めました。マイナースケールのハンドパンと一緒に演奏するセカンド楽器として非常に人気があります。"
            },
            zh: {
                name: "D Asha 9",
                description: "也被称为 Sabye 或 Ashakiran 的柔和 D 大调音阶。音色温暖、绅士而柔软，承载着纯净的光与希望。作为与小调手碟搭配的第二台手碟非常受欢迎。"
            },
            de: {
                name: "D Asha 9",
                description: "Eine sanfte, warme D-Dur-Skala, auch bekannt als Sabye oder Ashakiran. Der weiche, \"gentle\" Klang trägt Licht und Hoffnung in sich. Besonders beliebt als zweites Handpan, das sich hervorragend mit einer Moll-Skala kombinieren lässt."
            },
            es: {
                name: "D Asha 9",
                description: "Escala de Re mayor suave y cálida, también conocida como Sabye o Ashakiran. Su timbre gentil y blando contiene una sensación de luz y esperanza. Es un segundo handpan muy popular para combinar con escalas menores."
            },
            ru: {
                name: "D Asha 9",
                description: "Мягкая и тёплая гамма D major, также известная как Sabye или Ashakiran. Её нежное звучание несёт в себе чистый свет и надежду. Один из самых популярных вариантов второй Handpan-гаммы для сочетания с минорными инструментами."
            },
            fa: {
                name: "D Asha 9",
                description: "گامِ رِ ماژورِ نرم و ملایمی است که با نام‌های Sabye و Ashakiran نیز شناخته می‌شود. رنگ صدایی لطیف و جنتل دارد و نوری از پاکی و امید را در خود حمل می‌کند. به‌عنوان دومین هنگ‌درام در کنار یک گام مینور، بسیار محبوب و پرطرفدار است."
            },
            pt: {
                name: "D Asha 9",
                description: "Escala suave e acolhedora de Ré maior, também conhecida como Sabye ou Ashakiran. O timbre gentil carrega uma sensação de luz e esperança. É um segundo handpan muito popular para combinar com escalas menores."
            },
            ae: {
                name: "D Asha 9",
                description: "سُلَّم ري ماجور ناعم ودافئ، يُعرَف أيضًا باسم Sabye أو Ashakiran. يحمل طابعًا لطيفًا وصوتًا رقيقًا يعبّر عن النور والأمل، وهو خيار شائع جدًّا كثاني هاندبان إلى جانب سلالم المينور."
            },
            it: {
                name: "D Asha 9",
                description: "Scala D maggiore dolce e delicata, conosciuta anche come Sabye o Ashakiran. Il suo timbro gentile e morbido racchiude luce e speranza. È molto apprezzata come secondo handpan da affiancare a scale minori."
            }
        }
    },

    // 9. E La Sirena 10 (The Siren / Dorian)
    {
        id: "e_la_sirena_10",
        name: "E La Sirena 10",
        nameEn: "E La Sirena 10",
        notes: {
            ding: "E3",
            top: ["G3", "B3", "C#4", "D4", "E4", "F#4", "G4", "B4", "E5"],
            bottom: []
        },
        vector: { minorMajor: -0.3, pureSpicy: 0.6, rarePopular: 0.4 },
        tags: ["도리안", "중급자용", "세이렌", "C#4활용이포인트"],
        tagsEn: ["Dorian", "Intermediate", "Siren", "C#4 Point"],
        description: "'세이렌'이라는 이름처럼 신비롭고 깊은 물속을 유영하는 듯한 느낌을 주는 도리안 스케일입니다. 메이저와 마이너를 오가는 묘한 매력이 있으며, C#4 노트의 활용이 포인트입니다. 중급자용 모델로 추천됩니다.",
        descriptionEn: "A Dorian scale that gives the feeling of swimming in mysterious deep water, like its name 'Siren'. It has a subtle charm shifting between major and minor, with the use of the C#4 note being a key point. Recommended for intermediate players.",
        videoUrl: "https://youtu.be/B-7jukbN3hw?si=ci_6mlElCZvu_WGH",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8490886007",
        ownUrl: "https://handpan.co.kr/shop/?idx=73",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=73",
        i18n: {
            fr: {
                name: "E La Sirena 10",
                description: "Gamme en mode dorien, comme une sirène qui vous entraîne dans les profondeurs de l'eau. Elle oscille subtilement entre majeur et mineur, avec un charme mystérieux. La note C#4 y joue un rôle clé. Recommandée aux joueurs de niveau intermédiaire."
            },
            ja: {
                name: "E La Sirena 10",
                description: "名の通り「セイレーン」のように、深い水の中を遊泳している感覚を与えるドリアンスケールです。メジャーとマイナーの間を行き来する不思議な魅力があり、C#4 ノートの使い方がポイントになります。中級者の方におすすめです。"
            },
            zh: {
                name: "E La Sirena 10",
                description: "正如\"塞壬\"之名，这是一种仿佛在深海中游弋的多利亚（Dorian）音阶。徘徊于大调与小调之间的微妙魅力令人着迷，其中 C#4 的运用是关键，推荐给具有一定经验的中级玩家。"
            },
            de: {
                name: "E La Sirena 10",
                description: "Eine dorische Skala, die – wie der Name \"Sirena\" (Meerjungfrau) andeutet – das Gefühl vermittelt, in geheimnisvollen Tiefen unter Wasser zu schweben. Sie bewegt sich zwischen Dur und Moll hin und her; die kreative Nutzung des Tons C#4 ist dabei ein wichtiger Punkt. Empfohlen für Spieler auf mittlerem Niveau."
            },
            es: {
                name: "E La Sirena 10",
                description: "Escala en modo dórico que, como su nombre sugiere, produce la sensación de estar nadando en aguas profundas y misteriosas. Tiene un encanto especial que oscila entre mayor y menor, y el uso creativo de la nota C#4 es la clave. Recomendado para intérpretes de nivel intermedio."
            },
            ru: {
                name: "E La Sirena 10",
                description: "Дорийская гамма, которая, как и имя «Сирена», создаёт ощущение плавания в глубоких таинственных водах. В ней по-особому переплетаются мажорные и минорные оттенки, а ключевую роль играет нота C#4. Рекомендуется исполнителям среднего уровня."
            },
            fa: {
                name: "E La Sirena 10",
                description: "گامی در مُد دوریَن است که همان‌طور که از نام «سیرنا» برمی‌آید، حسی شبیه شناور بودن در آب‌های عمیق و مرموز دریا می‌دهد. جذابیت خاصی میان ماژور و مینور در آن در جریان است و استفادهٔ خلاقانه از نت C#4 نقطهٔ کلیدی این گام است. برای نوازندگان در سطح متوسط توصیه می‌شود."
            },
            pt: {
                name: "E La Sirena 10",
                description: "Escala em modo dórico que, como o nome \"La Sirena\" sugere, transmite a sensação de nadar em águas profundas e misteriosas. Traz um charme especial que oscila entre maior e menor, e o uso criativo da nota C#4 é o ponto-chave. Recomendada para músicos de nível intermediário."
            },
            ae: {
                name: "E La Sirena 10",
                description: "سُلَّم في طور Dorian يعطي، كما يوحي الاسم «La Sirena»، إحساس السباحة في مياه عميقة وغامضة. يجمع بطريقة جذابة بين ألوان الماجور والمينور، والاستخدام الإبداعي للنغمة دو دييز 4 (C#4) هو نقطة الارتكاز في هذا السُلَّم. يُنصَح به للعازفين في المستوى المتوسط."
            },
            it: {
                name: "E La Sirena 10",
                description: "Scala in modalità dorica che, come suggerisce il nome \"La Sirena\", evoca la sensazione di nuotare in acque profonde e misteriose. Il suo fascino sta nel passare tra colore maggiore e minore; l'uso creativo della nota C#4 è il punto chiave. Consigliata per musicisti di livello intermedio."
            }
        }
    },

    // 10. C# Pygmy 9 (The Original Trance Classic)
    {
        id: "cs_pygmy_9",
        name: "C# Pygmy 9",
        nameEn: "C# Pygmy 9",
        notes: {
            ding: "C#3",
            top: ["F#3", "G#3", "A3", "C#4", "E4", "F#4", "G#4", "A4"],
            bottom: []
        },
        vector: { minorMajor: -0.7, pureSpicy: 0.05, rarePopular: 0.85 },
        tags: ["피그미", "트랜스", "깊음", "클래식"],
        tagsEn: ["Pygmy", "Trance", "Deep", "Classic"],
        description: "핸드팬의 고전이자 명작인 클래식 피그미 스케일입니다. 특유의 공허하고 몽환적인 깊은 울림은 깊은 명상과 트랜스 상태로 인도합니다.",
        descriptionEn: "A classic Pygmy scale, a masterpiece of handpans. Its unique hollow and dreamy deep resonance leads to deep meditation and trance states.",
        videoUrl: "https://youtu.be/WcREkpJ5I_0?si=YUyV1CEIOLyXWesW",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8521877785",
        ownUrl: "https://handpan.co.kr/shop/?idx=88",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=88",
        i18n: {
            fr: {
                name: "C# Pygmy 9",
                description: "La version « classique » de la gamme Pygmy, un grand standard du handpan. Son ambiance à la fois vide et onirique favorise les états de méditation profonde et de transe douce."
            },
            ja: {
                name: "C# Pygmy 9",
                description: "ハンドパンの古典にして名作といえるクラシック・ピグミースケールです。独特の空虚感と夢のように深い響きが、深い瞑想やトランス状態へと誘います。"
            },
            zh: {
                name: "C# Pygmy 9",
                description: "手碟世界的经典名作——传统 Pygmy 音阶。其独有的空灵与梦幻般的深沉共鸣，能够引导听者进入深度冥想与恍惚状态。"
            },
            de: {
                name: "C# Pygmy 9",
                description: "Eine klassische Pygmy-Skala und echter Handpan-Klassiker. Ihr charakteristisch leerer, zugleich traumhaft tiefer Klang führt den Hörer leicht in Zustände von tiefer Meditation und Trance."
            },
            es: {
                name: "C# Pygmy 9",
                description: "Clásico absoluto del mundo del handpan: la escala Pygmy tradicional. Su resonancia profunda, vacía y onírica conduce fácilmente a estados de meditación y trance."
            },
            ru: {
                name: "C# Pygmy 9",
                description: "Классика и настоящая «визитная карточка» Handpan-мира — традиционная гамма Pygmy. Её характерное пустое и одновременно глубоко мечтательное звучание легко вводит в состояние глубокой медитации и транса."
            },
            fa: {
                name: "C# Pygmy 9",
                description: "یک کلاسیک حقیقی در دنیای هنگ‌درام؛ گام Pygmy سنتی. رزونانس عمیق، خالی و رؤیاییِ آن به‌راحتی شنونده را به حالت‌های مدیتیشن عمیق و ترنس هدایت می‌کند."
            },
            pt: {
                name: "C# Pygmy 9",
                description: "Clássico absoluto no universo do handpan: a escala Pygmy tradicional. A ressonância profunda, vazia e onírica conduz facilmente a estados de meditação e transe."
            },
            ae: {
                name: "C# Pygmy 9",
                description: "كلاسيك حقيقي في عالم الهاندبان: سُلَّم Pygmy التقليدي. رنينه العميق والفارغ والحالم يقود بسهولة إلى حالات تأمل عميقة وترانس."
            },
            it: {
                name: "C# Pygmy 9",
                description: "Un vero classico tra le scale di handpan: la scala Pygmy tradizionale. La sua risonanza profonda, un po' vuota e onirica, conduce facilmente a stati di meditazione e trance."
            }
        }
    },

    // 11. D Asha 15 (2-Octave Major) - Mutant
    {
        id: "d_asha_15_mutant",
        name: "D Asha 15",
        nameEn: "D Asha 15",
        notes: {
            ding: "D3",
            top: ["A3", "B3", "C#4", "D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5"],
            bottom: ["E3", "F#3", "G3"]
        },
        vector: { minorMajor: 0.9, pureSpicy: 0.1, rarePopular: 0.8 },
        tags: ["D메이저", "2옥타브", "범용성", "협연추천"],
        tagsEn: ["D Major", "2 Octaves", "Versatile", "Great for Jamming"],
        description: "2옥타브 음역을 완벽하게 커버하는 D 메이저 스케일입니다. 범용성이 뛰어나 메이저 조성이 대다수인 일반 대중음악에서의 활용도가 매우 높으며, 다른 악기와의 협연에서도 강력한 강점을 발휘하는 협연 추천 모델입니다.",
        descriptionEn: "A D Major scale that perfectly covers a 2-octave range. With excellent versatility, it is highly useful in popular music where major keys are dominant, and is strongly recommended for jamming with other instruments.",
        videoUrl: "https://youtu.be/aGKx4zLFvRo",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12655523545",
        ownUrl: "https://handpan.co.kr/shop/?idx=77",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=77",
        i18n: {
            fr: {
                name: "D Asha 15",
                description: "Gamme de D majeur couvrant parfaitement deux octaves complètes. Sa polyvalence est remarquable, notamment pour la plupart des morceaux de musique populaire en mode majeur. Un modèle idéal pour jouer avec d'autres instruments et pour la scène."
            },
            ja: {
                name: "D Asha 15",
                description: "2 オクターブの音域を完全にカバーする D メジャースケールです。汎用性が非常に高く、メジャーキーが多い一般的なポップスでの活用度も抜群です。他の楽器とのアンサンブルでも大きな強みを発揮する、共演に特におすすめのモデルです。"
            },
            zh: {
                name: "D Asha 15",
                description: "完整覆盖两个八度音域的 D 大调音阶。通用性极强，特别适合大多数以大调为主的流行音乐。同时在与其他乐器合奏时拥有很强的优势，是舞台协奏强烈推荐的型号。"
            },
            de: {
                name: "D Asha 15",
                description: "Eine D-Dur-Skala, die einen vollständigen Umfang von zwei Oktaven abdeckt. Ihre Vielseitigkeit macht sie besonders geeignet für populäre Musik, die überwiegend in Dur steht. Durch die große Bandbreite eignet sie sich hervorragend für Ensemble- und Bühnenauftritte mit anderen Instrumenten."
            },
            es: {
                name: "D Asha 15",
                description: "Escala de Re mayor que cubre de forma completa dos octavas. Su gran polivalencia la hace muy útil para la mayoría de estilos de música popular en tonalidad mayor. Destaca especialmente en conjuntos y colaboraciones con otros instrumentos, por lo que es un modelo muy recomendado para actuaciones y acompañamientos."
            },
            ru: {
                name: "D Asha 15",
                description: "Гамма D major, полностью покрывающая диапазон двух октав. Обладает выдающейся универсальностью, особенно в популярной музыке, где преобладают мажорные тональности. Благодаря широкому диапазону отлично подходит для ансамблей и сотрудничества с другими инструментами — один из лучших вариантов для совместных выступлений."
            },
            fa: {
                name: "D Asha 15",
                description: "گام رِ ماژور که به‌طور کامل دو اکتاو را پوشش می‌دهد. به‌شدت چندکاره است و برای بیشتر موسیقی‌های پاپ که در فضای ماژور نوشته می‌شوند، کاربرد بسیار بالایی دارد. در آنسامبل و همکاری با سایر سازها نیز قدرت و برتری چشمگیری نشان می‌دهد و برای اجرای گروهی به‌شدت توصیه می‌شود."
            },
            pt: {
                name: "D Asha 15",
                description: "Escala de Ré maior que cobre completamente duas oitavas. Extremamente versátil, é muito útil para grande parte da música popular em tonalidade maior. Funciona de forma excelente em conjuntos e colaborações com outros instrumentos, sendo altamente recomendada para performances em grupo."
            },
            ae: {
                name: "D Asha 15",
                description: "سُلَّم ري ماجور يغطي نطاقًا كاملًا من درجتين صوتيتين (أوكتافَين). يتميّز بمرونة عالية جدًّا، خاصة في موسيقى البوب ذات الطباع الماجور. يبرز بشكل قوي في العزف الجماعي والتعاون مع آلات أخرى، لذلك هو نموذج موصى به جدًّا للعروض المشتركة."
            },
            it: {
                name: "D Asha 15",
                description: "Scala D maggiore che copre in modo completo due ottave di estensione. È estremamente versatile e si adatta molto bene alla maggior parte del pop moderno in tonalità maggiore. Brilla anche nelle collaborazioni con altri strumenti, per questo è un modello altamente raccomandato per ensemble e concerti."
            }
        }
    },

    // 12. E Equinox 12 (Normal, Bass 2 Dings)
    {
        id: "e_equinox_12",
        name: "E Equinox 12",
        nameEn: "E Equinox 12",
        notes: {
            ding: "E3",
            top: ["G3", "B3", "C4", "D4", "E4", "F#4", "G4", "B4", "C5"],
            bottom: ["D3", "C3"]
        },
        vector: { minorMajor: -0.3, pureSpicy: 0.3, rarePopular: 0.6 },
        tags: ["에퀴녹스", "메이저+마이너", "저음보강", "미묘한감성", "중급자용"],
        tagsEn: ["Equinox", "Major+Minor", "Bass Boost", "Subtle Feeling", "Intermediate"],
        description: "하이브리드 스케일인 기존 Equinox에 저음(C3, D3)을 보강하여 더욱 풍성한 울림을 제공합니다. 감성적인 연주에 최적화된 완벽한 밸런스를 자랑합니다.",
        descriptionEn: "Adds bass notes (C3, D3) to the hybrid Equinox scale for a richer resonance. Boasts perfect balance optimized for emotional performance.",
        videoUrl: "https://youtu.be/OcQ64DyA9xM?si=40_8I1KnB_rxCNQO",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12320335441",
        ownUrl: "https://handpan.co.kr/shop/?idx=79",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=79",
        i18n: {
            fr: {
                name: "E Equinox 12",
                description: "Version enrichie de l'Equinox, avec des basses supplémentaires (C3, D3). Le résultat est un son plus ample et plus profond, tout en conservant le caractère émotionnel et équilibré typique de cette gamme hybride."
            },
            ja: {
                name: "E Equinox 12",
                description: "既存のハイブリッドスケール Equinox に低音（C3, D3）を追加し、さらに豊かな響きを実現したモデルです。感性的な演奏に最適化された、完璧なバランスが魅力です。"
            },
            zh: {
                name: "E Equinox 12",
                description: "在原有混合型 Equinox 的基础上强化低音（加入 C3、D3），使整体共鸣更加饱满。为感性演奏量身打造，兼具厚度与平衡感。"
            },
            de: {
                name: "E Equinox 12",
                description: "Eine erweiterte Version der hybriden Equinox-Skala, bei der zusätzliche tiefe Töne (C3, D3) für noch mehr Klangfülle sorgen. Sie bietet eine perfekt ausbalancierte Basis für emotionales, ausdrucksstarkes Spiel."
            },
            es: {
                name: "E Equinox 12",
                description: "Versión ampliada de la escala híbrida Equinox, reforzada con graves adicionales (Do3, Re3) para ofrecer una resonancia aún más rica. Presume de un equilibrio perfecto, optimizado para interpretaciones muy emotivas."
            },
            ru: {
                name: "E Equinox 12",
                description: "Расширенная версия гибридной гаммы Equinox с усиленными низами (добавлены C3 и D3), что делает звук ещё более насыщенным. Отличается идеально выверенным балансом и особенно хорошо раскрывается в эмоциональной, выразительной игре."
            },
            fa: {
                name: "E Equinox 12",
                description: "نسخهٔ گسترش‌یافتهٔ گام هیبریدی Equinox که با افزودن نت‌های بم (C3 و D3) رزونانس آن غنی‌تر شده است. تعادل صوتی بسیار دقیقی دارد و برای اجراهای عمیقاً احساسی به‌خوبی بهینه شده است."
            },
            pt: {
                name: "E Equinox 12",
                description: "Versão expandida da escala híbrida Equinox, reforçada com graves adicionais (Dó3, Ré3), o que torna a ressonância ainda mais rica. Apresenta um equilíbrio sonoro impecável, otimizado para interpretações muito emotivas."
            },
            ae: {
                name: "E Equinox 12",
                description: "نسخة موسَّعة من سُلَّم Equinox الهجين مع تعزيز النغمات المنخفضة (C3 و D3)، ما يمنح رنينًا أكثر غنى. يتميّز بتوازن صوتي مثالي ومناسب جدًّا للعزف العاطفي المعبّر."
            },
            it: {
                name: "E Equinox 12",
                description: "Versione estesa della scala ibrida Equinox con l'aggiunta dei bassi C3 e D3. Offre una risonanza ancora più piena e un equilibrio sonoro perfetto, ideale per esecuzioni altamente espressive e sensibili."
            }
        }
    },

    // 13. E Equinox 10 (Normal)
    {
        id: "e_equinox_10",
        name: "E Equinox 10",
        nameEn: "E Equinox 10",
        notes: {
            ding: "E3",
            top: ["G3", "B3", "C4", "D4", "E4", "F#4", "G4", "B4", "C5"],
            bottom: []
        },
        vector: { minorMajor: -0.3, pureSpicy: 0.3, rarePopular: 0.7 },
        tags: ["에퀴녹스", "메이저+마이너", "그사이어딘가", "미묘한느낌", "색다른감성추천"],
        tagsEn: ["Equinox", "Major+Minor", "Somewhere In Between", "Subtle Feeling", "Unique Emotion"],
        description: "Equinox 스케일의 표준 모델로, 메이저와 마이너 그 사이 어딘가의 미묘한 느낌이 특징입니다. 색다른 감성을 추구하는 분들에게 추천되며, 적절한 음역대와 감성적인 멜로디 라인으로 입문자부터 숙련자까지 모두에게 적합합니다.",
        descriptionEn: "The standard model of the Equinox scale, characterized by a subtle feeling somewhere between major and minor. Recommended for those seeking unique emotions, it is suitable for everyone from beginners to experts with its appropriate range and emotional melody lines.",
        videoUrl: "https://youtu.be/8t8MqTelD9k?si=4gbYwCubpVxb_URT",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12320275460",
        ownUrl: "https://handpan.co.kr/shop/?idx=80",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=80",
        i18n: {
            fr: {
                name: "E Equinox 10",
                description: "Modèle standard de la gamme Equinox. Elle se situe exactement entre majeur et mineur, avec une couleur subtile et nuancée. Parfaite pour celles et ceux qui recherchent une émotion différente, accessible aussi bien aux débutants qu'aux joueurs confirmés."
            },
            ja: {
                name: "E Equinox 10",
                description: "Equinox スケールの標準モデルです。メジャーとマイナーのちょうど中間に位置するような微妙なニュアンスが特徴で、新しい感性を求める方におすすめです。扱いやすい音域とエモーショナルなメロディラインにより、初心者から上級者まで幅広くお楽しみいただけます。"
            },
            zh: {
                name: "E Equinox 10",
                description: "Equinox 系列的标准型号。介于大调和小调之间的微妙色彩，是其最大特色。推荐给追求独特情感表达的玩家，适中的音域与抒情的旋律线，使从入门到熟练者都能轻松驾驭。"
            },
            de: {
                name: "E Equinox 10",
                description: "Das Standardmodell der Equinox-Skala. Es bewegt sich gefühlvoll \"irgendwo zwischen Dur und Moll\" und eignet sich für Spieler, die eine besondere, fein nuancierte Stimmung suchen. Der passende Tonumfang und melodische Ausdruck machen sie sowohl für Einsteiger als auch für Fortgeschrittene attraktiv."
            },
            es: {
                name: "E Equinox 10",
                description: "Modelo estándar de la escala Equinox. Su carácter se sitúa \"en algún lugar\" entre mayor y menor, con una sonoridad sutil y matizada. Recomendado para quienes buscan una sensibilidad diferente. Su registro cómodo y sus líneas melódicas expresivas la hacen adecuada tanto para principiantes como para músicos experimentados."
            },
            ru: {
                name: "E Equinox 10",
                description: "Стандартная модель гаммы Equinox. Её характер лежит «где-то между мажором и минором», с тонкой и утончённой окраской. Рекомендуется тем, кто ищет необычную эмоциональность. Удобный диапазон и выразительные мелодические линии делают её подходящей как для начинающих, так и для опытных музыкантов."
            },
            fa: {
                name: "E Equinox 10",
                description: "مدل استاندارد گام Equinox است. شخصیت آن «جایی بین ماژور و مینور» قرار می‌گیرد و رنگ صوتی ظریف و چندلایه‌ای دارد. برای کسانی که به‌دنبال احساسی متفاوت و خاص هستند مناسب است، و به‌واسطهٔ محدودهٔ راحت و ملودی‌های احساسی، از مبتدی تا نوازندهٔ حرفه‌ای همگی می‌توانند از آن لذت ببرند."
            },
            pt: {
                name: "E Equinox 10",
                description: "Modelo padrão da escala Equinox. Seu caráter se situa \"em algum lugar\" entre maior e menor, com uma sonoridade sutil e cheia de nuances. Indicada para quem busca uma sensibilidade diferente; o registro confortável e as linhas melódicas expressivas a tornam adequada tanto para iniciantes quanto para músicos experientes."
            },
            ae: {
                name: "E Equinox 10",
                description: "النموذج القياسي لسُلَّم Equinox. شخصيته تقع «بين الماجور والمينور» مع لون صوتي دقيق ومتعدّد الطبقات. مناسب لمن يبحثون عن إحساس مختلف؛ وبفضل مجاله المريح وخطوطه اللحنية العاطفية، يلائم المبتدئين والمحترفين على حد سواء."
            },
            it: {
                name: "E Equinox 10",
                description: "Modello standard della scala Equinox. Il suo carattere si colloca \"fra maggiore e minore\", con un colore sottile e ricco di sfumature. Raccomandata a chi cerca un'emozione diversa; grazie all'estensione comoda e alle linee melodiche emozionali è adatta sia a principianti sia a musicisti esperti."
            }
        }
    },

    // 14. F# Low Pygmy 18 (Mutant)
    {
        id: "fs_low_pygmy_18_mutant",
        name: "F# Low Pygmy 18",
        nameEn: "F# Low Pygmy 18",
        notes: {
            ding: "F#3",
            top: ["G#3", "A3", "D4", "E4", "F#4", "G#4", "A4", "D5", "E5", "F#5", "G#5"],
            bottom: ["D3", "E3", "B3", "C#4", "B4", "C#5"]
        },
        vector: { minorMajor: -0.6, pureSpicy: 0.25, rarePopular: 0.9 },
        tags: ["Malte Marten 스타일", "뮤턴트", "고음역", "피그미", "전문가용"],
        tagsEn: ["Malte Marten Style", "Mutant", "High Range", "Pygmy", "Professional"],
        description: "Malte Marten 스타일의 뮤턴트 피그미 스케일로, Low Pygmy의 확장판입니다. 18개의 노트를 통해 광활한 음역대와 초고음역을 제공하며, 섬세한 고음 표현과 깊은 저음이 어우러진 전문가용 모델입니다.",
        descriptionEn: "A mutant Pygmy scale in the Malte Marten style, an extension of the Low Pygmy. With 18 notes providing a vast range including ultra-highs, it is a professional model combining delicate high notes with deep bass.",
        videoUrl: "https://youtu.be/UxsvhXeDok0?si=GnSeCzBk0qe8snYr",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12689630331",
        ownUrl: "https://handpan.co.kr/shop/?idx=76",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=76",
        i18n: {
            fr: {
                name: "F# Low Pygmy 18",
                description: "Version « mutante » du Low Pygmy, inspirée du style de Malte Marten. Ses 18 notes ouvrent un registre extrêmement large, incluant un suraigu très expressif. Les nuances fines dans les aigus se combinent à des graves profonds, pour un instrument clairement orienté professionnel."
            },
            ja: {
                name: "F# Low Pygmy 18",
                description: "Malte Marten スタイルの「ミュータント・ピグミー」スケールであり、Low Pygmy の拡張版です。18 ノートがもたらす広大な音域と超高音域により、繊細な高音表現と深い低音が共存するプロフェッショナル向けモデルです。"
            },
            zh: {
                name: "F# Low Pygmy 18",
                description: "受 Malte Marten 风格启发的\"变异 Pygmy\"音阶，是 Low Pygmy 的扩展版。18 个音带来极为宽广的音域与超高音区，细腻高音与深沉低音并存，是专业演奏者向的旗舰型号。"
            },
            de: {
                name: "F# Low Pygmy 18",
                description: "Eine \"mutierte\" Pygmy-Skala im Stil von Malte Marten – die erweiterte Version der Low Pygmy. Mit 18 Tönen bietet sie einen enorm weiten Tonumfang bis in höchste Lagen. Feine Höhen und tiefe Bässe verbinden sich zu einem professionellen Spitzeninstrument."
            },
            es: {
                name: "F# Low Pygmy 18",
                description: "Escala \"mutante\" de estilo Malte Marten, versión extendida de la Low Pygmy. Sus 18 notas ofrecen un rango enorme, desde graves muy profundos hasta agudos extremos. Combina una gran delicadeza en el registro alto con un grave poderoso, convirtiéndola en un modelo claramente orientado a profesionales."
            },
            ru: {
                name: "F# Low Pygmy 18",
                description: "«Мутировавшая» Pygmy-гамма в стиле Мальте Мартена — расширенная версия Low Pygmy. 18 нот дают по-настоящему огромный диапазон: от очень глубоких басов до экстремально высоких нот. Тонкая работа в верхнем регистре сочетается с мощным низом, что делает этот инструмент профессиональной флагманской моделью."
            },
            fa: {
                name: "F# Low Pygmy 18",
                description: "گام Pygmy «جهش‌یافته» در سبک Malte Marten و نسخهٔ گسترش‌یافتهٔ Low Pygmy است. با ۱۸ نت، گسترهٔ صوتی بسیار وسیعی از بیس‌های بسیار عمیق تا نت‌های فوق‌العاده زیر را در اختیار می‌گذارد. ظرافت در رجیستر بالا با عمق در رجیستر پایین ترکیب شده و این مدل را به گزینه‌ای حرفه‌ای و پرچم‌دار تبدیل می‌کند."
            },
            pt: {
                name: "F# Low Pygmy 18",
                description: "Escala Pygmy \"mutante\" no estilo Malte Marten, versão estendida da Low Pygmy. As 18 notas oferecem um alcance enorme, de graves muito profundos a agudos extremos. Combina delicadeza no registro alto com graves poderosos, sendo um modelo claramente voltado para profissionais."
            },
            ae: {
                name: "F# Low Pygmy 18",
                description: "سُلَّم Pygmy «متطوّر» على طريقة Malte Marten، وهو نسخة موسَّعة من Low Pygmy. بـ 18 نغمة يوفّر مدى واسعًا جدًّا من البيسات العميقة إلى النغمات العالية جدًّا. يجمع بين دقة العُليا وقوّة المنخفضة، ما يجعله نموذجًا احترافيًا رائدًا."
            },
            it: {
                name: "F# Low Pygmy 18",
                description: "Scala Pygmy \"mutante\" nello stile di Malte Marten, versione estesa della Low Pygmy. Con 18 note offre un'ampiezza enorme, dai bassi profondi fino ai registri altissimi. Unisce finezza negli acuti e potenza nei gravi: modello professionale di riferimento."
            }
        }
    },

    // 15. C# Pygmy 11 (Normal, Bass 2 Dings)
    {
        id: "cs_pygmy_11",
        name: "C# Pygmy 11",
        nameEn: "C# Pygmy 11",
        notes: {
            ding: "C#3",
            top: ["F#3", "G#3", "A3", "C#4", "E4", "F#4", "G#4", "A4"],
            bottom: ["D3", "E3"]
        },
        vector: { minorMajor: -0.7, pureSpicy: 0.05, rarePopular: 0.8 },
        tags: ["피그미", "저음보강", "트랜스", "깊은울림"],
        tagsEn: ["Pygmy", "Bass Boost", "Trance", "Deep Resonance"],
        description: "클래식 피그미 스케일인 C# Pygmy에 저음(D3, E3)을 보강하여 더욱 깊고 웅장한 깊은 울림을 만들어냅니다. 트랜스와 명상, 힐링 연주에 탁월합니다.",
        descriptionEn: "Adds bass notes (D3, E3) to the classic C# Pygmy scale for a deeper and more majestic resonance. Excellent for trance, meditation, and healing performances.",
        videoUrl: "https://youtu.be/QoUbOkhGGR8?si=TIKXYdCKX4RiuaLY",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12276307998",
        ownUrl: "https://handpan.co.kr/shop/?idx=81",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=81",
        i18n: {
            fr: {
                name: "C# Pygmy 11",
                description: "Extension du C# Pygmy classique avec des graves ajoutés (D3, E3). Cette configuration renforce la profondeur et la majesté du son, idéale pour la transe, la méditation, le soin sonore et les voyages intérieurs."
            },
            ja: {
                name: "C# Pygmy 11",
                description: "クラシックな C# Pygmy に低音（D3, E3）を追加し、より深く荘厳な響きを実現したモデルです。トランス、瞑想、ヒーリング演奏に非常に優れています。"
            },
            zh: {
                name: "C# Pygmy 11",
                description: "在经典 C# Pygmy 上加入低音（D3、E3），打造出更加深邃、宏伟的共鸣。非常适合恍惚、冥想以及疗愈类演奏。"
            },
            de: {
                name: "C# Pygmy 11",
                description: "Eine erweiterte Version der klassischen C# Pygmy-Skala mit zusätzlichen tiefen Tönen (D3, E3). Dadurch entsteht ein noch tieferer, majestätischer Klang, der sich hervorragend für Trance, Meditation und Healing-Sessions eignet."
            },
            es: {
                name: "C# Pygmy 11",
                description: "Versión extendida de la clásica C# Pygmy, con graves añadidos (Re3, Mi3) que aportan aún más profundidad y majestuosidad. Es una escala excelente para trance, meditación y sesiones de sanación sonora."
            },
            ru: {
                name: "C# Pygmy 11",
                description: "Расширенная версия классической C# Pygmy с добавлением низких нот (D3, E3), что придаёт звучанию ещё более глубокую и величественную резонансу. Прекрасный выбор для трансовых, медитативных и целительных (healing) сессий."
            },
            fa: {
                name: "C# Pygmy 11",
                description: "نسخهٔ توسعه‌یافتهٔ گام کلاسیک C# Pygmy با نت‌های بمِ افزوده‌شده (D3 و E3)، که رزونانس را عمیق‌تر و باشکوه‌تر می‌کند. گزینه‌ای عالی برای اجراهای ترنس، مدیتیشن و هیلینگ (درمان صوتی) است."
            },
            pt: {
                name: "C# Pygmy 11",
                description: "Versão estendida da clássica C# Pygmy, com graves adicionais (Ré3, Mi3) que trazem ainda mais profundidade e majestade à ressonância. Excelente escolha para sessões de transe, meditação e healing (cura sonora)."
            },
            ae: {
                name: "C# Pygmy 11",
                description: "نسخة مطوَّرة من C# Pygmy الكلاسيكي مع إضافة النغمات المنخفضة (D3 و E3)، ما يمنح رنينًا أكثر عمقًا وفخامة. خيار ممتاز لعروض الترانس، والتأمل، والعلاج بالصوت."
            },
            it: {
                name: "C# Pygmy 11",
                description: "Versione potenziata della classica C# Pygmy, con l'aggiunta dei bassi D3 ed E3. Il risultato è una risonanza ancora più profonda e maestosa. Ottima scelta per trance, meditazione e performance di sound healing."
            }
        }
    },

    // 16. F Low Pygmy 12 (Normal, Bass 2 Dings)
    {
        id: "f_low_pygmy_12",
        name: "F Low Pygmy 12",
        nameEn: "F Low Pygmy 12",
        notes: {
            ding: "F3",
            top: ["G3", "Ab3", "C4", "Eb4", "F4", "G4", "Ab4", "C5", "Eb5"],
            bottom: ["Eb3", "Db3"]
        },
        vector: { minorMajor: -0.6, pureSpicy: 0.1, rarePopular: 0.75 },
        tags: ["피그미", "저음보강", "웰니스감성", "몽환적"],
        tagsEn: ["Pygmy", "Bass Boost", "Wellness Emotion", "Dreamy"],
        description: "피그미 스케일인 F Pygmy의 부드러움에 저음을 보강하여 깊이를 더했습니다. 따뜻하고 몽환적인 분위기를 연출하기에 좋습니다.",
        descriptionEn: "Adds bass notes to the softness of the F Pygmy scale for added depth. Great for creating a warm and dreamy atmosphere.",
        videoUrl: "https://youtu.be/_3jpTdVfOBc?si=W9bAL_AqZ5e25Rj8",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8611436986",
        ownUrl: "https://handpan.co.kr/shop/?idx=82",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=82",
        i18n: {
            fr: {
                name: "F Low Pygmy 12",
                description: "Une version élargie du F Pygmy, qui conserve sa douceur tout en gagnant en profondeur grâce aux basses renforcées. Parfait pour créer des ambiances chaleureuses, flottantes et légèrement rêveuses."
            },
            ja: {
                name: "F Low Pygmy 12",
                description: "ピグミースケール F Pygmy の柔らかさに、低音を補強してさらに深みを加えたモデルです。あたたかく、どこか夢見心地な雰囲気を作り出すのに最適です。"
            },
            zh: {
                name: "F Low Pygmy 12",
                description: "保留 F Pygmy 原本的柔和质感，同时通过加强低音增加整体深度。非常适合营造温暖、梦幻般的氛围。"
            },
            de: {
                name: "F Low Pygmy 12",
                description: "Bewahrt die weiche Klangfarbe der F Pygmy-Skala und ergänzt sie um verstärkte Bässe für mehr Tiefe. Ideal, um eine warme, leicht traumartige Atmosphäre zu erschaffen."
            },
            es: {
                name: "F Low Pygmy 12",
                description: "Mantiene la suavidad característica de la F Pygmy, pero con graves reforzados que añaden más profundidad al conjunto. Ideal para crear atmósferas cálidas, envolventes y ligeramente oníricas."
            },
            ru: {
                name: "F Low Pygmy 12",
                description: "Сохраняет мягкость и нежность гаммы F Pygmy, но усиленные басы добавляют звучанию глубину и объём. Отлично подходит для создания тёплой, окутывающей и чуть мечтательной атмосферы."
            },
            fa: {
                name: "F Low Pygmy 12",
                description: "نرمی و لطافت گام F Pygmy را حفظ می‌کند، اما با تقویت بخش بم، عمق بیشتری به صدا می‌دهد. برای خلق فضاهای گرم، شناور و کمی رؤیایی بسیار مناسب است."
            },
            pt: {
                name: "F Low Pygmy 12",
                description: "Mantém a suavidade típica da F Pygmy, mas com graves reforçados que adicionam mais profundidade ao conjunto. Ideal para criar atmosferas quentes, envolventes e ligeiramente oníricas."
            },
            ae: {
                name: "F Low Pygmy 12",
                description: "يحافظ على نعومة ودفء سُلَّم F Pygmy، لكن مع تعزيز البيسات ليضيف عمقًا أكبر للصوت. مثالي لخلق أجواء دافئة، محيطة وقليلة الحلمية."
            },
            it: {
                name: "F Low Pygmy 12",
                description: "Mantiene la morbidezza e il calore della scala F Pygmy, ma con bassi rinforzati che aggiungono ulteriore profondità. Perfetta per creare atmosfere calde, avvolgenti e leggermente sognanti."
            }
        }
    },

    // 17. D Kurd 12 (Normal, Bass 2 Dings)
    {
        id: "d_kurd_12",
        name: "D Kurd 12",
        nameEn: "D Kurd 12",
        notes: {
            ding: "D3",
            top: ["A3", "Bb3", "C4", "D4", "E4", "F4", "G4", "A4", "C5"],
            bottom: ["F3", "G3"]
        },
        vector: { minorMajor: -0.8, pureSpicy: 0.1, rarePopular: 0.95 },
        tags: ["대중적", "마이너", "저음보강", "화음반주강화", "모던감성"],
        tagsEn: ["Popular", "Minor", "Bass Boost", "Harmonic Play Boost", "Modern Emotion"],
        description: "마이너 스케일인 D Kurd 10 악기에 바텀 업그레이드 한 표준확장형으로, 저음을 보강하여 하단 두개의 딩 베이스로 화성 연주가 가능한 모델입니다.",
        descriptionEn: "A standard extended version of the D Kurd 10 minor scale with bottom upgrades. Reinforced with bass notes, it allows for harmonic play with two bottom ding basses.",
        videoUrl: "https://youtu.be/KXDSbCdPjTM?si=3GD2eOil-5WsmVHa",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12070396728",
        ownUrl: "https://handpan.co.kr/shop/?idx=83",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=83",
        i18n: {
            fr: {
                name: "D Kurd 12",
                description: "Extension du D Kurd 10 avec un « bottom upgrade » pour des graves supplémentaires. Les deux basses sur la coque inférieure permettent un jeu plus harmonique et plus complet, sans perdre le caractère mineur expressif du Kurd."
            },
            ja: {
                name: "D Kurd 12",
                description: "マイナースケール D Kurd 10 にボトム側のアップグレードを施した標準拡張版です。低音が強化され、ボトムの 2 つのディングベースによって和声的な演奏が可能になります。"
            },
            zh: {
                name: "D Kurd 12",
                description: "以 D Kurd 10 小调为基础，通过底部升级扩展而成的标准加强版。强化的低音加上下壳两个 Ding bass，使和声演奏更加立体、丰富。"
            },
            de: {
                name: "D Kurd 12",
                description: "Die Standard-Erweiterung der D Kurd 10 Moll-Skala mit Bottom-Upgrade. Durch die verstärkten Bässe und zwei Ding-Bässe auf der Unterseite wird harmonisches und akkordisches Spiel deutlich vielfältiger."
            },
            es: {
                name: "D Kurd 12",
                description: "Versión estándar ampliada de la escala menor D Kurd 10, con un \"bottom upgrade\". Los graves reforzados y los dos bajos tipo ding en la parte inferior permiten un acompañamiento armónico mucho más rico."
            },
            ru: {
                name: "D Kurd 12",
                description: "Стандартная расширенная версия минорной гаммы D Kurd 10 с bottom-upgrade. Усиленные низы и два баса-ding на нижней части корпуса дают возможность исполнять более богатые гармонии и аккорды."
            },
            fa: {
                name: "D Kurd 12",
                description: "نسخهٔ استانداردِ گسترش‌یافتهٔ گام مینور D Kurd 10 با bottom upgrade. بیس‌های تقویت‌شده و دو نت Ding باس در قسمت زیرین، امکان اجرای هارمونی‌ها و آکوردهای غنی‌تر را فراهم می‌کند."
            },
            pt: {
                name: "D Kurd 12",
                description: "Versão padrão estendida da escala menor D Kurd 10 com bottom upgrade. Os graves reforçados e os dois baixos tipo ding na parte inferior permitem um acompanhamento harmônico muito mais rico."
            },
            ae: {
                name: "D Kurd 12",
                description: "النسخة القياسية الموسَّعة من سلم D Kurd 10 المينور مع ترقية في الجزء السفلي. البيسات الأقوى ووجود اثنين من نغمات ding في الأسفل يسمحان بعزف هارمونيات وأوتار أكثر غنى."
            },
            it: {
                name: "D Kurd 12",
                description: "Versione standard estesa della scala D Kurd 10 in modalità minore, con upgrade del bottom. I bassi potenziati e le due note ding nella parte inferiore permettono armonie e accordi più ricchi."
            }
        }
    },

    // 18. F Low Pygmy 9 (Normal)
    {
        id: "f_low_pygmy_9",
        name: "F Low Pygmy 9",
        nameEn: "F Low Pygmy 9",
        notes: {
            ding: "F3",
            top: ["G3", "G#3", "C4", "D#4", "F4", "G4", "G#4", "C5"],
            bottom: []
        },
        vector: { minorMajor: -0.6, pureSpicy: 0.1, rarePopular: 0.7 },
        tags: ["피그미", "기본", "차분함", "명상"],
        tagsEn: ["Pygmy", "Basic", "Calm", "Meditation"],
        description: "차분하고 안정적인 Pygmy 스케일의 기본형입니다. 명상과 힐링 연주에 적합한 부드러운 음색을 가졌습니다.",
        descriptionEn: "The basic form of the calm and stable Pygmy scale. It has a soft tone suitable for meditation and healing performances.",
        videoUrl: "https://youtu.be/61g8qreUeJk?si=NgBTdfaU51SV__5O",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12085324936",
        ownUrl: "https://handpan.co.kr/shop/?idx=86",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=86",
        i18n: {
            fr: {
                name: "F Low Pygmy 9",
                description: "Version de base du F Low Pygmy, au caractère posé et stable. Son timbre doux en fait un excellent choix pour la méditation, le yoga, la relaxation et toutes les pratiques de guérison sonore."
            },
            ja: {
                name: "F Low Pygmy 9",
                description: "落ち着きと安定感のある Pygmy スケールの基本モデルです。瞑想やヒーリング演奏に適した、柔らかくやさしい音色を持っています。"
            },
            zh: {
                name: "F Low Pygmy 9",
                description: "沉稳而安定的 Pygmy 基本款。音色柔和细腻，非常适合冥想、瑜伽、身心疗愈等用途。"
            },
            de: {
                name: "F Low Pygmy 9",
                description: "Das Grundmodell der F Low Pygmy mit ruhigem, stabilem Charakter. Der sanfte, milde Klang eignet sich hervorragend für Meditation, Entspannung und Healing-Musik."
            },
            es: {
                name: "F Low Pygmy 9",
                description: "Modelo básico de la escala F Low Pygmy, con un carácter sereno y estable. Su timbre suave y delicado es perfecto para meditación, relajación y música de sanación."
            },
            ru: {
                name: "F Low Pygmy 9",
                description: "Базовая версия гаммы F Low Pygmy с спокойным и устойчивым характером. Мягкий, нежный тембр делает её отличным выбором для медитации, расслабления и лечебной (healing) музыки."
            },
            fa: {
                name: "F Low Pygmy 9",
                description: "مدل پایهٔ گام F Low Pygmy با شخصیتی آرام و پایدار. رنگ صوتی نرم و ملایم آن برای مدیتیشن، ریلکسیشن و موسیقی هیلینگ بسیار مناسب است."
            },
            pt: {
                name: "F Low Pygmy 9",
                description: "Modelo básico da escala F Low Pygmy, com caráter calmo e estável. O timbre suave e delicado é perfeito para meditação, relaxamento e música de cura."
            },
            ae: {
                name: "F Low Pygmy 9",
                description: "النموذج الأساسي لسُلَّم F Low Pygmy بطابع هادئ ومستقر. صوته الناعم واللطيف مثالي للتأمل، والاسترخاء، وموسيقى الشفاء."
            },
            it: {
                name: "F Low Pygmy 9",
                description: "Modello base della F Low Pygmy, dal carattere calmo e stabile. Il timbro dolce e delicato la rende ideale per meditazione, rilassamento e musica di guarigione."
            }
        }
    },

    // 19. C# Annapurna 9 (Normal)
    {
        id: "cs_annapurna_9",
        name: "C# Annapurna 9",
        nameEn: "C# Annapurna 9",
        notes: {
            ding: "C#3",
            top: ["G#3", "C4", "C#4", "D#4", "F4", "F#4", "G#4", "C#5"],
            bottom: []
        },
        vector: { minorMajor: 0.8, pureSpicy: 0.35, rarePopular: 0.5 },
        tags: ["메이저", "안나푸르나", "상쾌함", "청량함"],
        tagsEn: ["Major", "Annapurna", "Refreshing", "Cooling"],
        description: "Yisha Savita와 동일한 구성으로, 안나푸르나의 웅장함과 상쾌함, 에너지를 담은 메이저 스케일입니다.",
        descriptionEn: "A major scale with the same composition as Yisha Savita, embodying the majesty, freshness, and energy of Annapurna.",
        videoUrl: "https://youtu.be/HSHDfm9PEM4?si=930q4Eu3DT2URi50",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8513450652",
        ownUrl: "https://handpan.co.kr/shop/?idx=89",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=89",
        i18n: {
            fr: {
                name: "C# Annapurna 9",
                description: "Gamme identique à Yisha Savita, inspirée par la montagne Annapurna. Elle combine grandeur, fraîcheur et énergie dans un cadre majeur lumineux, idéale pour des mélodies puissantes et inspirantes."
            },
            ja: {
                name: "C# Annapurna 9",
                description: "Yisha Savita と同じ構成を持ち、アンナプルナの雄大さと爽快感、エネルギーを込めたメジャースケールです。力強くポジティブなメロディにぴったりです。"
            },
            zh: {
                name: "C# Annapurna 9",
                description: "与 Yisha Savita 具有相同构成的 C# 大调音阶，将安纳普尔纳山的雄伟、清爽与能量凝聚其中，适合演奏充满力量与正能量的旋律。"
            },
            de: {
                name: "C# Annapurna 9",
                description: "Gleiche Struktur wie Yisha Savita; eine C#-Dur-Skala, die die Majestät, Frische und Energie des Annapurna-Gebirges in sich trägt. Hervorragend für kraftvolle, inspirierende Melodien geeignet."
            },
            es: {
                name: "C# Annapurna 9",
                description: "Comparte la misma estructura que Yisha Savita. Es una escala mayor que encarna la grandeza, frescura y energía de Annapurna, perfecta para melodías potentes e inspiradoras."
            },
            ru: {
                name: "C# Annapurna 9",
                description: "Имеет ту же структуру, что и Yisha Savita. Мажорная гамма, вобравшая в себя величие, свежесть и энергию Аннапурны. Подходит для мощных, вдохновляющих мелодий."
            },
            pt: {
                name: "C# Annapurna 9",
                description: "Possui a mesma estrutura da escala Yisha Savita. É uma escala maior que incorpora a grandeza, o frescor e a energia de Annapurna, ideal para melodias poderosas e inspiradoras."
            },
            ae: {
                name: "C# Annapurna 9",
                description: "له التركيب نفسه لسُلَّم Yisha Savita. سُلَّم ماجور يجسّد عظمة وانتعاش وطاقة جبال أنابورنا، مناسب للألحان القوية والملهمة."
            },
            it: {
                name: "C# Annapurna 9",
                description: "Ha la stessa struttura della scala Yisha Savita. È una scala maggiore che racchiude la grandiosità, la freschezza e l'energia dell'Annapurna: perfetta per melodie forti e ispiranti."
            }
        }
    },

    // 20. C Major 10
    {
        id: "c_major_10",
        name: "C Major 10",
        nameEn: "C Major 10",
        notes: {
            ding: "C3",
            top: ["G3", "A3", "B3", "C4", "D4", "E4", "F4", "G4", "A4"],
            bottom: []
        },
        vector: { minorMajor: 1.0, pureSpicy: 0.0, rarePopular: 0.6 },
        tags: ["메이저", "쉬운음계", "밝음", "동요"],
        tagsEn: ["Major", "Easy Scale", "Bright", "Nursery Rhymes"],
        description: "가장 기본적이고 순수한 메이저 스케일인 C Major입니다. 밝고 명랑하며, 동요와 같이 누구나 아는 멜로디를 연주하기에 좋습니다.",
        descriptionEn: "C Major, the most basic and pure major scale. It is bright and cheerful, great for playing familiar melodies like nursery rhymes.",
        videoUrl: "https://youtu.be/2peCXnJP2U0?si=bVePs8DvAlPEwI7v",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12751985321",
        ownUrl: "https://handpan.co.kr/shop/?idx=91",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=91",
        i18n: {
            fr: {
                name: "C Major 10",
                description: "La gamme majeure la plus simple et la plus pure : C majeur. Son caractère clair et joyeux convient très bien aux mélodies connues de tous, aux chansons enfantines et à l'initiation musicale."
            },
            ja: {
                name: "C Major 10",
                description: "もっとも基本的で純粋なメジャースケールである C メジャーです。明るく朗らかなキャラクターで、童謡のような誰もが知っているメロディを弾くのに最適です。"
            },
            zh: {
                name: "C Major 10",
                description: "最基础、最纯粹的 C 大调音阶。明亮而欢快，非常适合演奏儿歌或所有人耳熟能详的简单旋律，是初学者的经典选择。"
            },
            de: {
                name: "C Major 10",
                description: "Die grundlegendste und reinste Dur-Skala: C-Dur. Sie klingt hell und fröhlich und ist ideal, um bekannte Kinderlieder und einfache Melodien zu spielen – eine klassische Wahl für Einsteiger."
            },
            es: {
                name: "C Major 10",
                description: "La escala mayor más básica y pura: Do mayor. Su carácter brillante y alegre es ideal para tocar canciones infantiles y melodías sencillas que todo el mundo conoce. Excelente elección como primer instrumento."
            },
            ru: {
                name: "C Major 10",
                description: "Самая базовая и чистая мажорная гамма — C major. Звучит ярко и жизнерадостно, идеально подходит для исполнения детских песен и простых, знакомых всем мелодий. Классический выбор для первого инструмента."
            },
            fa: {
                name: "C Major 10",
                description: "پایه‌ای‌ترین و خالص‌ترین گام ماژور: دو ماژور (C major). صدایی روشن و شاد دارد و برای نواختن ترانه‌های کودکانه و ملودی‌های ساده و آشنا بسیار ایده‌آل است. یک انتخاب کلاسیک برای اولین ساز و اولین گام است."
            },
            pt: {
                name: "C Major 10",
                description: "A escala maior mais simples e pura: Dó maior (C major). De caráter brilhante e alegre, é perfeita para tocar canções infantis e melodias fáceis que todos conhecem. Uma escolha clássica como primeiro instrumento/primeira escala."
            },
            ae: {
                name: "C Major 10",
                description: "أبسط وأصفى سُلَّم ماجور: دو ماجور (C major). يتميّز بصوت مشرق ومبهج، مثالي لعزف أغاني الأطفال والأنغام السهلة المعروفة للجميع. خيار كلاسيكي كأول سُلَّم وأول هاندبان."
            },
            it: {
                name: "C Major 10",
                description: "La scala maggiore più semplice e pura: C major (Do maggiore). Ha un suono chiaro e gioioso, ideale per melodie familiari come canzoni per bambini. Una scelta classica come primo handpan e prima scala."
            }
        }
    },

    // 21. C Rasavali 10
    {
        id: "c_rasavali_10",
        name: "C Rasavali 10",
        nameEn: "C Rasavali 10",
        notes: {
            ding: "C3",
            top: ["G3", "Ab3", "C4", "D4", "E4", "F4", "G4", "Ab4", "C5"],
            bottom: []
        },
        vector: { minorMajor: -0.2, pureSpicy: 0.6, rarePopular: 0.3 },
        tags: ["라사발리", "인도풍", "이국적감성", "독특함"],
        tagsEn: ["Rasavali", "Indian Style", "Exotic Emotion", "Unique"],
        description: "라사발리 스케일로, 인도풍의 색채를 지닌 신비로운 스케일입니다. 독특한 음계가 만들어내는 묘한 분위기가 매력적입니다.",
        descriptionEn: "A Rasavali scale with Indian-style colors. The mysterious atmosphere created by its unique scale is attractive.",
        videoUrl: "https://youtu.be/u9dsmUSd_SY?si=rMBMQOFvj5Yec7vs",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12751991029",
        ownUrl: "https://handpan.co.kr/shop/?idx=92",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=92",
        i18n: {
            fr: {
                name: "C Rasavali 10",
                description: "Gamme Rasavali à la couleur résolument indienne. Elle dégage une aura mystérieuse et envoûtante, idéale pour les ambiances spirituelles, rituelles ou cinématiques."
            },
            ja: {
                name: "C Rasavali 10",
                description: "ラサヴァリ（Rasavali）スケールで、インド風の色彩を帯びたミステリアスなスケールです。独特な音階が生み出す、どこか妖しい雰囲気が魅力です。"
            },
            zh: {
                name: "C Rasavali 10",
                description: "Rasavali 音阶，带有浓厚印度风情的神秘音阶。独特的音程组合营造出耐人寻味的氛围，极具个性。"
            },
            de: {
                name: "C Rasavali 10",
                description: "Die Rasavali-Skala mit deutlich indisch gefärbter Klangwelt. Die besondere Tonleiter erzeugt eine geheimnisvolle, leicht rätselhafte Atmosphäre und verleiht dem Spiel eine starke eigene Note."
            },
            es: {
                name: "C Rasavali 10",
                description: "Escala Rasavali, con una fuerte coloración de música india. Sus intervalos crean una atmósfera misteriosa y sugerente, muy atractiva para quienes buscan un sonido distintivo."
            },
            ru: {
                name: "C Rasavali 10",
                description: "Гамма Rasavali с ярко выраженной индийской окраской. Необычные интервалы создают загадочную и притягательную атмосферу, идеально подходящую тем, кто ищет по-настоящему уникальное звучание."
            },
            fa: {
                name: "C Rasavali 10",
                description: "گام Rasavali با رنگ‌وبوی قوی موسیقی هندوستان. فواصل خاص آن فضایی رازآلود و جذاب می‌آفریند و برای نوازندگانی که به‌دنبال صدایی متمایز هستند بسیار دل‌انگیز است."
            },
            pt: {
                name: "C Rasavali 10",
                description: "Escala Rasavali com forte coloração de música indiana. Seus intervalos criam uma atmosfera misteriosa e envolvente, muito atraente para quem busca um som verdadeiramente distinto."
            },
            ae: {
                name: "C Rasavali 10",
                description: "سُلَّم Rasavali ذو لون قوي من الموسيقى الهندية. فواصله غير المألوفة تخلق جوًا غامضًا وجذابًا، مناسبًا جدًّا لمن يبحث عن صوت مميّز حقًا."
            },
            it: {
                name: "C Rasavali 10",
                description: "Scala Rasavali dal forte colore della musica indiana. Gli intervalli particolari creano un'atmosfera misteriosa e affascinante, perfetta per chi cerca un suono veramente originale."
            }
        }
    },

    // 22. C# Deepasia 14 (Normal)
    {
        id: "cs_deepasia_14",
        name: "C# Deepasia 14",
        nameEn: "C# Deepasia 14",
        notes: {
            ding: "C#3",
            top: ["G#3", "Bb3", "C#4", "F4", "F#4", "G#4", "C#5", "D#5", "F5"],
            bottom: ["D#3", "F3"]
        },
        vector: { minorMajor: -0.5, pureSpicy: 0.5, rarePopular: 0.4 },
        tags: ["확장형메이저", "동양감성", "청량함"],
        tagsEn: ["Extended Major", "Asian Feeling", "Refreshing"],
        description: "딥아시아 스케일로, 동양적인 깊은 울림을 가진 확장형 모델입니다. 14개의 노트로 확장되어 더욱 풍성하고 명상적인 연주가 가능합니다.",
        descriptionEn: "A Deep Asia scale, an extended model with deep oriental resonance. Expanded to 14 notes, it allows for richer and more meditative performances.",
        videoUrl: "https://youtu.be/pMKoFUicrFw?si=5HPgyOp8NM0qXMNU",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12689651421",
        ownUrl: "https://handpan.co.kr/shop/?idx=84",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=84",
        i18n: {
            fr: {
                name: "C# Deepasia 14",
                description: "Gamme Deepasia, à la résonance profondément asiatique. Ses 14 notes créent un paysage sonore riche, idéal pour la méditation longue, les voyages sonores et les compositions contemplatives."
            },
            ja: {
                name: "C# Deepasia 14",
                description: "ディープアジア（Deepasia）スケールで、東洋的な深い響きを持つ拡張モデルです。14 ノートに拡張されたことで、より豊かで瞑想的な演奏が可能になりました。"
            },
            zh: {
                name: "C# Deepasia 14",
                description: "Deepasia 音阶，充满东方气息的深沉共鸣，是一款扩展型型号。14 个音带来更宽广的表现力，尤其适合长时间冥想与内观式演奏。"
            },
            de: {
                name: "C# Deepasia 14",
                description: "Die Deepasia-Skala – ein erweitertes Modell mit tief asiatisch anmutender Resonanz. Dank 14 Tönen bietet sie einen großen, dichten Klangraum und eignet sich hervorragend für lange, meditative Klangreisen."
            },
            es: {
                name: "C# Deepasia 14",
                description: "Escala Deepasia, un modelo extendido con una profunda resonancia de sabor oriental. Sus 14 notas permiten un paisaje sonoro amplio y denso, ideal para largas sesiones meditativas y viajes sonoros introspectivos."
            },
            ru: {
                name: "C# Deepasia 14",
                description: "Гамма Deepasia — расширенная модель с глубокой восточной резонансой. 14 нот открывают широкий и плотный звуковой ландшафт, особенно подходящий для длительных медитативных и созерцательных звуковых путешествий."
            },
            fa: {
                name: "C# Deepasia 14",
                description: "گام Deepasia یک مدل گسترش‌یافته با رزونانس عمیق و حال‌وهوای شرقی است. ۱۴ نت آن چشم‌اندازی صوتی گسترده و متراکم ایجاد می‌کند و برای سفرهای صوتی طولانی و مدیتیشن‌های درون‌نگر بسیار مناسب است."
            },
            pt: {
                name: "C# Deepasia 14",
                description: "Escala Deepasia, modelo expandido com ressonância profunda e sabor oriental. As 14 notas proporcionam uma paisagem sonora ampla e densa, ideal para longas sessões meditativas e viagens sonoras introspectivas."
            },
            ae: {
                name: "C# Deepasia 14",
                description: "سُلَّم Deepasia الموسَّع برنين عميق ونكهة شرقية واضحة. تمنح 14 نغمة منه مشهدًا صوتيًا واسعًا وكثيفًا، مثاليًا للرحلات الصوتية الطويلة والتأمل الداخلي."
            },
            it: {
                name: "C# Deepasia 14",
                description: "Scala Deepasia estesa, con risonanza profonda e marcato sapore orientale. Le 14 note permettono paesaggi sonori larghi e densi, ideali per viaggi sonori lunghi e meditazioni profonde."
            }
        }
    },

    // 23. C# Blues 9 (Normal)
    {
        id: "cs_blues_9",
        name: "C# Blues 9",
        nameEn: "C# Blues 9",
        notes: {
            ding: "C#3",
            top: ["G#3", "B3", "C#4", "E4", "F#4", "G4", "G#4", "B4"],
            bottom: []
        },
        vector: { minorMajor: -0.1, pureSpicy: 0.6, rarePopular: 0.4 },
        tags: ["블루스감성", "재즈", "증4도활용", "중급자용"],
        tagsEn: ["Blues Emotion", "Jazz", "Tritone Use", "Intermediate"],
        description: "블루스 스케일로, 블루지한 감성을 담은 스케일입니다. 재즈나 소울풀한 연주에 적합하며, 특유의 그루브가 살아있는 감성적인 모델입니다.",
        descriptionEn: "A Blues scale capturing bluesy emotions. Suitable for jazz or soulful playing, it is an emotional model with a distinct groove.",
        videoUrl: "https://youtu.be/mY-Uvw-VKO4?si=Ail972LckjNWKp8S",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12689712335",
        ownUrl: "https://handpan.co.kr/shop/?idx=90",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=90",
        i18n: {
            fr: {
                name: "C# Blues 9",
                description: "Gamme blues en C#, chargée d'une forte expressivité. Parfaite pour le jazz, le groove et les ambiances soul, elle met en avant le côté « blue notes » et les phrases pleines de feeling."
            },
            ja: {
                name: "C# Blues 9",
                description: "ブルーススケールで、ブルージーな感性が詰まったモデルです。ジャズやソウルフルな演奏に適しており、独特のグルーヴ感が生きたエモーショナルなサウンドを奏でます。"
            },
            zh: {
                name: "C# Blues 9",
                description: "C# 调的蓝调音阶，蕴含强烈\"blues\"情感。非常适合爵士、灵魂乐风格的演奏，独特的律动感让情绪表达更为鲜明。"
            },
            de: {
                name: "C# Blues 9",
                description: "Eine Blues-Skala in C#, die voller \"bluesiger\" Emotion steckt. Ideal für Jazz, Soul und groovige Improvisationen; der charakteristische Groove dieser Skala lässt emotionale Phrasen besonders lebendig wirken."
            },
            es: {
                name: "C# Blues 9",
                description: "Escala blues en Do#, cargada de emoción \"bluesy\". Muy adecuada para jazz, soul y estilos con mucho groove; sus notas características dan vida a frases melódicas intensas y expresivas."
            },
            ru: {
                name: "C# Blues 9",
                description: "Блюзовая гамма в тональности C#, наполненная ярко выраженной «blues-эмоцией». Отлично подходит для джаза, соула и стилей с выраженным грувом; характерные ноты придают фразам особую выразительность и драйв."
            },
            fa: {
                name: "C# Blues 9",
                description: "گام بلوز در دو دیِز (C#) که سرشار از احساسات بلوزی است. برای جَز، سول و سبک‌های مبتنی بر گروو بسیار مناسب است و فواصل شاخص آن، جمله‌های ملودیک را به‌شدت احساسی و زنده می‌کند."
            },
            pt: {
                name: "C# Blues 9",
                description: "Escala blues em Dó#, carregada de emoção \"bluesy\". Muito adequada para jazz, soul e estilos com bastante groove; as notas características dão vida a frases melódicas intensas e expressivas."
            },
            ae: {
                name: "C# Blues 9",
                description: "سُلَّم بلوز في دو دييز (C#) مليء بالروح البلوزية. مناسب جدًّا للجَاز، والسول، والأنماط القائمة على الـ groove؛ ففواصله المميّزة تعطي الجُمل اللحنية تعبيرًا قويًا وحركة حية."
            },
            it: {
                name: "C# Blues 9",
                description: "Scala blues in C#, piena di sensibilità blues. Si adatta bene a jazz, soul e musica basata sul groove; le sue blue note caratteristiche conferiscono grande espressività e movimento alle frasi melodiche."
            }
        }
    },

    // 24. Eb MUJU 10 (Normal)
    {
        id: "eb_muju_10",
        name: "Eb MUJU 10",
        nameEn: "Eb MUJU 10",
        notes: {
            ding: "Eb3",
            top: ["G3", "Ab3", "Bb3", "C4", "Eb4", "F4", "G4", "Ab4", "C5"],
            bottom: []
        },
        vector: { minorMajor: 0.5, pureSpicy: 0.2, rarePopular: 0.3 },
        tags: ["Eb메이저", "국악평조", "아리랑음계", "무주자연"],
        tagsEn: ["Eb Major", "Korean Traditional", "Arirang Scale", "Muju Nature"],
        description: "Eb 메이저 스케일로, 국악 평조와 아리랑 음계를 담고 있습니다. 무주의 자연을 닮은 평화로운 스케일이며, 부드럽고 따뜻한 음색으로 마음을 치유하는 힘이 있습니다.",
        descriptionEn: "Eb Major scale containing Korean traditional Pyeongjo and Arirang scales. A peaceful scale resembling the nature of Muju, it has the power to heal the mind with its soft and warm tone.",
        videoUrl: "https://youtu.be/0IGtmQlb1X4?si=y9oZiE4w-_Zkyih6",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/8513504905",
        ownUrl: "https://handpan.co.kr/shop/?idx=96",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=96",
        i18n: {
            fr: {
                name: "Eb MUJU 10",
                description: "Gamme en Eb majeur intégrant les couleurs du pyeongjo et de l'air traditionnel « Arirang ». Elle s'inspire des paysages paisibles de Muju et propose un son doux, chaleureux, capable d'apaiser et de réconforter l'auditeur."
            },
            ja: {
                name: "Eb MUJU 10",
                description: "Eb メジャースケールで、韓国伝統音楽の平調と「アリラン」の音階を取り入れています。ムジュ（茂朱）の自然を思わせる穏やかなスケールで、柔らかくあたたかな音色が心を癒してくれます。"
            },
            zh: {
                name: "Eb MUJU 10",
                description: "Eb 大调音阶，融合了韩国传统音阶\"平调\"和《阿里郎》的旋律色彩。仿佛描绘出茂朱自然风光般的宁静，是以柔和、温暖音色抚慰人心的疗愈型音阶。"
            },
            de: {
                name: "Eb MUJU 10",
                description: "Eine Eb-Dur-Skala, die Elemente der koreanischen Pyeongjo-Tonleiter und der \"Arirang\"-Melodie aufgreift. Sie erinnert an die friedliche Natur von Muju und entfaltet mit ihrem weichen, warmen Klang eine starke, heilsame Wirkung."
            },
            es: {
                name: "Eb MUJU 10",
                description: "Escala de Mi♭ mayor que incorpora elementos del modo coreano Pyeongjo y de la melodía de \"Arirang\". Evoca la naturaleza pacífica de Muju, con un sonido suave y cálido que tiene un fuerte efecto sanador sobre el oyente."
            },
            ru: {
                name: "Eb MUJU 10",
                description: "Мажорная гамма в тональности E♭, сочетающая элементы корейского традиционного лада пхёнโจ и мелодии «Ариран». Напоминает мирную природу Муджу: мягкий, тёплый звук обладает сильным успокаивающим и целительным эффектом."
            },
            fa: {
                name: "Eb MUJU 10",
                description: "گام می بمل ماژور (Eb major) که عناصری از مُد سنتی کره‌ای «پینگجو» و ملودی «آریرانگ» را در خود دارد. طبیعت آرام منطقهٔ Muju را به خاطر می‌آورد؛ با صدایی نرم و گرم که تأثیر آرام‌بخش و شفابخش قدرتمندی بر شنونده دارد."
            },
            pt: {
                name: "Eb MUJU 10",
                description: "Escala de Mi♭ maior que incorpora elementos do modo tradicional coreano Pyeongjo e da melodia \"Arirang\". Evoca a natureza pacífica de Muju, com som suave e quente que exerce forte efeito relaxante e restaurador sobre o ouvinte."
            },
            ae: {
                name: "Eb MUJU 10",
                description: "سُلَّم مي بيمول ماجور (Eb major) يدمج عناصر من الطور الكوري التقليدي Pyeongjo ولحن «آريرانغ». يستحضر طبيعة منطقة Muju الهادئة؛ صوته الناعم والدافئ له تأثير مهدّئ وشفائي قوي على المستمع."
            },
            it: {
                name: "Eb MUJU 10",
                description: "Scala Eb maggiore che integra elementi del modo coreano tradizionale Pyeongjo e della melodia di \"Arirang\". Richiama la natura pacifica di Muju; il suo suono morbido e caldo ha un forte effetto calmante e terapeutico sull'ascoltatore."
            }
        }
    },

    // 25. C Yunsl 9 (Normal)
    {
        id: "c_yunsl_9",
        name: "C Yunsl 9",
        nameEn: "C Yunsl 9",
        notes: {
            ding: "C3",
            top: ["C4", "D4", "E4", "F4", "G4", "B4", "C5", "D5"],
            bottom: []
        },
        vector: { minorMajor: 0.8, pureSpicy: 0.1, rarePopular: 0.5 },
        tags: ["메이저", "윤슬", "반짝임", "맑음"],
        tagsEn: ["Major", "Yunsl", "Sparkling", "Clear"],
        description: "윤슬 스케일로, 물결에 비치는 햇살처럼 맑고 반짝이는 소리를 가졌습니다. 서정적이고 아름다운 멜로디 연주에 좋습니다.",
        descriptionEn: "Yunsl scale, possessing a clear and sparkling sound like sunlight reflecting on ripples. Good for playing lyrical and beautiful melodies.",
        videoUrl: "https://youtu.be/_fB5VHpE1f0?si=v6RDSBTJJUsiAZXK",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12752009418",
        ownUrl: "https://handpan.co.kr/shop/?idx=102",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=102",
        i18n: {
            fr: {
                name: "C Yunsl 9",
                description: "Gamme Yunsl, dont le nom évoque les reflets de la lumière sur les vagues. Elle offre un son clair, scintillant et poétique, idéal pour des mélodies lyriques et émouvantes."
            },
            ja: {
                name: "C Yunsl 9",
                description: "ユンスル（Yunsl）スケールで、水面にきらめく陽光のように澄んで輝くサウンドが特徴です。抒情的で美しいメロディを奏でるのに最適です。"
            },
            zh: {
                name: "C Yunsl 9",
                description: "Yunsl（\"윤슬\"）音阶，声音如同阳光洒在水面上闪耀般清澈明亮。非常适合演奏抒情而唯美的旋律线条。"
            },
            de: {
                name: "C Yunsl 9",
                description: "Die Yunsl-Skala, deren Klang wie Sonnenlicht wirkt, das auf den Wellen glitzert: klar, hell und funkelnd. Besonders geeignet für lyrische, poetische Melodien."
            },
            es: {
                name: "C Yunsl 9",
                description: "Escala Yunsl, cuyo sonido recuerda al reflejo del sol sobre las olas: claro, brillante y chispeante. Ideal para melodías líricas y hermosas, llenas de sensibilidad."
            },
            ru: {
                name: "C Yunsl 9",
                description: "Гамма Yunsl, чей звук напоминает солнечные блики на водной глади: чистый, яркий и мерцающий. Отлично подходит для лиричных, красивых мелодий, наполненных чувствами."
            },
            fa: {
                name: "C Yunsl 9",
                description: "گام Yunsl که صدای آن مانند بازتاب نور خورشید بر سطح موج‌های آب، شفاف، درخشان و چشمک‌زن است. برای ملودی‌های شاعرانه و زیبا که سرشار از احساس هستند، بسیار مناسب است."
            },
            pt: {
                name: "C Yunsl 9",
                description: "Escala Yunsl, cujo som lembra o brilho do sol refletido nas ondas do mar: claro, cintilante e reluzente. Excelente para melodias líricas e belas, cheias de sensibilidade."
            },
            ae: {
                name: "C Yunsl 9",
                description: "سُلَّم Yunsl الذي يشبه صوته انعكاس ضوء الشمس على سطح الماء: صافٍ، لامع ومتألّق. مناسب جدًّا للألحان الشاعرية والجميلة المليئة بالإحساس."
            },
            it: {
                name: "C Yunsl 9",
                description: "Scala Yunsl dal suono limpido e scintillante, come i riflessi del sole sulle onde. Molto adatta a melodie liriche e poetiche, piene di sensibilità."
            }
        }
    },

    // 26. C# Sapphire 9 (Normal)
    {
        id: "cs_sapphire_9",
        name: "C# Sapphire 9",
        nameEn: "C# Sapphire 9",
        notes: {
            ding: "C#3",
            top: ["G#3", "B3", "C#4", "F4", "F#4", "G#4", "B4", "C#5"],
            bottom: []
        },
        vector: { minorMajor: -0.2, pureSpicy: 0.4, rarePopular: 0.4 },
        tags: ["사파이어", "장3도/단7도", "믹솔리디안", "뻔하지않은재미"],
        tagsEn: ["Sapphire", "Major 3rd/Minor 7th", "Mixolydian", "Uncommon"],
        description: "사파이어 스케일로, 사파이어 보석처럼 청량하고 세련된 울림을 줍니다. 깔끔하고 모던한 느낌의 연주를 선호하는 분들께 추천합니다.",
        descriptionEn: "Sapphire scale, giving a refreshing and sophisticated resonance like a sapphire gem. Recommended for those who prefer clean and modern performances.",
        videoUrl: "https://youtu.be/V1bfHlVl9VY?si=yREB5-6dey1kvC_4",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12752029521",
        ownUrl: "https://handpan.co.kr/shop/?idx=93",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=93",
        i18n: {
            fr: {
                name: "C# Sapphire 9",
                description: "Gamme Sapphire, aussi raffinée et brillante que la pierre précieuse du même nom. Elle se distingue par une résonance fraîche, propre et moderne, recommandée à ceux qui aiment les sonorités élégantes et épurées."
            },
            ja: {
                name: "C# Sapphire 9",
                description: "サファイアスケールで、その名の通りサファイアのように清涼感があり、洗練された響きを持ちます。すっきりとモダンなサウンドを好む方におすすめです。"
            },
            zh: {
                name: "C# Sapphire 9",
                description: "Sapphire 音阶，犹如蓝宝石般清凉而洗练的共鸣。推荐给喜欢干净、现代感音色的玩家。"
            },
            de: {
                name: "C# Sapphire 9",
                description: "Die Sapphire-Skala mit einem kühlen, eleganten Klang – wie ein Saphir in Klangform. Sie eignet sich ideal für Spieler, die einen klaren, modernen und aufgeräumten Sound bevorzugen."
            },
            es: {
                name: "C# Sapphire 9",
                description: "Escala Sapphire, con una resonancia fresca y refinada, como un zafiro sonoro. Recomendable para quienes prefieren un sonido limpio, moderno y elegante."
            },
            ru: {
                name: "C# Sapphire 9",
                description: "Гамма Sapphire с чистой и изысканной резонансой, подобной звучанию сапфира. Рекомендуется тем, кто предпочитает современное, аккуратное и «минималистичное» звучание."
            },
            fa: {
                name: "C# Sapphire 9",
                description: "گام Sapphire با رزونانسی خنک و شیک، همچون صدای یک یاقوت کبود. برای نوازندگانی که صدایی تمیز، مدرن و مینیمال را ترجیح می‌دهند انتخابی عالی است."
            },
            pt: {
                name: "C# Sapphire 9",
                description: "Escala Sapphire, com ressonância fresca e sofisticada, como um \"safira sonora\". Recomendada para quem prefere um som limpo, moderno e elegante."
            },
            ae: {
                name: "C# Sapphire 9",
                description: "سُلَّم Sapphire برنين بارد وأنيق، مثل «ياقوتة زرقاء صوتية». يُوصى به لمن يفضّلون صوتًا نظيفًا، حديثًا وبسيطًا في الوقت نفسه."
            },
            it: {
                name: "C# Sapphire 9",
                description: "Scala Sapphire dal timbro fresco ed elegante, come un \"zaffiro sonoro\". Consigliata a chi preferisce un suono pulito, moderno e lineare."
            }
        }
    },

    // 27. C# Annaziska 9 (Normal)
    {
        id: "cs_annaziska_9",
        name: "C# Annaziska 9",
        nameEn: "C# Annaziska 9",
        notes: {
            ding: "C#3",
            top: ["G#3", "A3", "B3", "C#4", "D#4", "E4", "F#4", "G#4"],
            bottom: []
        },
        vector: { minorMajor: -0.4, pureSpicy: 0.5, rarePopular: 0.2 },
        tags: ["이국적", "긴장감", "신비", "매니아"],
        tagsEn: ["Exotic", "Tension", "Mysterious", "Mania"],
        description: "신비롭고 약간의 긴장감을 주는 이국적인 스케일입니다. 독특한 분위기를 연출하고 싶은 매니아 연주자에게 적합합니다.",
        descriptionEn: "An exotic scale that is mysterious and gives a slight sense of tension. Suitable for mania players who want to create a unique atmosphere.",
        videoUrl: "https://youtu.be/Z3bVZYykphA?si=zJAD4lmQPxMQ0xq8",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12085316070",
        ownUrl: "https://handpan.co.kr/shop/?idx=94",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=94",
        i18n: {
            fr: {
                name: "C# Annaziska 9",
                description: "Gamme mystérieuse et légèrement tendue, avec une forte couleur exotique. Elle convient parfaitement aux joueurs en quête de sonorités rares et de climats dramatiques ou cinématiques."
            },
            ja: {
                name: "C# Annaziska 9",
                description: "ミステリアスで、わずかな緊張感を含んだエキゾチックスケールです。独特の雰囲気を演出したいマニアックなプレイヤーに適しています。"
            },
            zh: {
                name: "C# Annaziska 9",
                description: "带有神秘感与轻微紧张感的异域音阶。非常适合想要塑造独特氛围、偏爱个性化声音的玩家。"
            },
            de: {
                name: "C# Annaziska 9",
                description: "Eine exotische Skala mit geheimnisvollem Charakter und leichter Spannung. Perfekt für Spieler, die eine besondere, dramatische Atmosphäre und einen individuellen Klang suchen."
            },
            es: {
                name: "C# Annaziska 9",
                description: "Escala exótica, misteriosa y con un ligero toque de tensión. Es perfecta para intérpretes que desean crear atmósferas únicas y dramáticas, con un carácter muy especial."
            },
            ru: {
                name: "C# Annaziska 9",
                description: "Экзотическая гамма с таинственным характером и лёгким напряжением. Подходит для музыкантов, которые хотят создавать необычные, драматичные и атмосферные звуковые миры."
            },
            fa: {
                name: "C# Annaziska 9",
                description: "گامی اگزوتیک با شخصیتی رازآلود و کمی پُرتنش. برای نوازندگانی که می‌خواهند فضاهایی خاص، دراماتیک و متمایز خلق کنند، گزینه‌ای بسیار جذاب است."
            },
            pt: {
                name: "C# Annaziska 9",
                description: "Escala exótica, misteriosa e com um leve toque de tensão. Perfeita para músicos que desejam criar atmosferas únicas e dramáticas, com um caráter muito especial."
            },
            ae: {
                name: "C# Annaziska 9",
                description: "سُلَّم أجنبي ذو شخصية غامضة ولمسة خفيفة من التوتر. مثالي للعازفين الذين يريدون خلق أجواء خاصة ودرامية بصوت مختلف وواضح."
            },
            it: {
                name: "C# Annaziska 9",
                description: "Scala esotica dal carattere misterioso e con una leggera tensione. Ideale per musicisti appassionati che vogliono creare atmosfere particolari e drammatiche con un suono unico."
            }
        }
    },

    // 28. E Hijaz 9 (Normal)
    {
        id: "e_hijaz_9",
        name: "E Hijaz 9",
        nameEn: "E Hijaz 9",
        notes: {
            ding: "E3",
            top: ["A3", "B3", "C4", "D#4", "E4", "F#4", "G4", "B4"],
            bottom: []
        },
        vector: { minorMajor: -0.3, pureSpicy: 0.7, rarePopular: 0.5 },
        tags: ["이국적", "중동풍", "정열적", "스파이시"],
        tagsEn: ["Exotic", "Middle Eastern", "Passionate", "Spicy"],
        description: "E 키의 히자즈 스케일로, 이국적이고 중동풍의 정열적이며 스파이시한 느낌을 강하게 전달합니다.",
        descriptionEn: "E key Hijaz scale, strongly conveying an exotic, Middle Eastern, passionate, and spicy feeling.",
        videoUrl: "https://youtu.be/MRyGVe5k4Y8?si=VEoopVqXSO9gJ6Rd",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12085332035",
        ownUrl: "https://handpan.co.kr/shop/?idx=95",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=95",
        i18n: {
            fr: {
                name: "E Hijaz 9",
                description: "Gamme Hijaz en E, immédiatement reconnaissable par sa couleur orientale et enflammée. Sa dynamique intense, épicée et passionnée est idéale pour les improvisations expressives et les paysages sonores moyen-orientaux."
            },
            ja: {
                name: "E Hijaz 9",
                description: "E キーのヒジャーズスケールで、中東風のエキゾチックさと情熱的でスパイシーな雰囲気を強く伝えます。ドラマチックな即興演奏にぴったりです。"
            },
            zh: {
                name: "E Hijaz 9",
                description: "E 调 Hijaz 音阶，充满异国情调与中东风格的热情与辛香气息。非常适合需要强烈情绪与戏剧张力的即兴演奏。"
            },
            de: {
                name: "E Hijaz 9",
                description: "Eine Hijaz-Skala in E mit stark orientalischem, nahöstlichem Flair. Sie vermittelt eine leidenschaftliche, \"würzige\" Stimmung und eignet sich hervorragend für dramatische, ausdrucksstarke Improvisationen."
            },
            es: {
                name: "E Hijaz 9",
                description: "Escala Hijaz en Mi, de fuerte carácter exótico y sabor mediooriental. Transmite una sensación intensa, apasionada y \"picante\", ideal para improvisaciones dramáticas y muy expresivas."
            },
            ru: {
                name: "E Hijaz 9",
                description: "Гамма Hijaz в тональности E с ярко выраженным восточным и ближневосточным оттенком. Передаёт страстное, «пряное» настроение и идеально подходит для драматичных и очень выразительных импровизаций."
            },
            fa: {
                name: "E Hijaz 9",
                description: "گام Hijaz در تونالیتهٔ می (E) با رنگ‌وبوی قوی خاورمیانه‌ای و شرقی. حسی پرشور و «تند و ادویه‌دار» منتقل می‌کند و برای بداهه‌نوازی‌های دراماتیک و بسیار احساسی فوق‌العاده است."
            },
            pt: {
                name: "E Hijaz 9",
                description: "Escala Hijaz em Mi, de forte caráter exótico e sabor médio-oriental. Transmite uma sensação intensa, apaixonada e \"picante\", ideal para improvisações dramáticas e altamente expressivas."
            },
            ae: {
                name: "E Hijaz 9",
                description: "سُلَّم Hijaz في مي (E) بطابع شرقي وشرق أوسطي قوي. ينقل إحساسًا حادًا، عاطفيًا و«متبَّلًا»، وهو رائع للارتجالات الدرامية شديدة التعبير."
            },
            it: {
                name: "E Hijaz 9",
                description: "Scala Hijaz in tonalità di E, dal forte sapore mediorientale. Trasmette un sentimento intenso, passionale e speziato: perfetta per improvvisazioni drammatiche e molto espressive."
            }
        }
    },

    // 29. C# Amara 9 (Added)
    {
        id: "cs_amara_9",
        name: "C# Amara 9",
        nameEn: "C# Amara 9",
        notes: {
            ding: "C#3",
            top: ["G#3", "B3", "C#4", "D#4", "E4", "F#4", "G#4", "B4"],
            bottom: []
        },
        vector: { minorMajor: -0.7, pureSpicy: 0.2, rarePopular: 0.9 },
        tags: ["아마라", "켈틱마이너", "클래식", "입문추천"],
        tagsEn: ["Amara", "Celtic Minor", "Classic", "Beginners"],
        description: "웰니스 3대장(Pygmy, Aegean, Amara)의 일원이자 ‘Celtic Minor’로도 불리는 C# Amara 9는, Malte Marten의 명연주로 유명세를 타며 전 세계 요가, 명상, 힐링 커뮤니티에서 독보적인 위치를 차지하고 있습니다. 많은 사랑을 받는 E Amara 18의 입문용 버전이기도 한 이 스케일은, 특유의 신비롭고 스피리추얼한 울림 덕분에 동서양을 막론하고 내면의 평화를 찾는 이들에게 깊은 사랑을 받고 있습니다.",
        descriptionEn: "C# Amara 9, also known as 'Celtic Minor' and a member of the Wellness Trio (Pygmy, Aegean, Amara), holds a unique position in the global yoga, meditation, and healing communities, made famous by Malte Marten's renowned performances. Also an introductory version of the beloved E Amara 18, this scale is deeply loved by those seeking inner peace in both East and West, thanks to its unique mysterious and spiritual resonance.",
        videoUrl: "https://youtu.be/W9QAtyTDrTM?si=Cy7YMKhp-MY2Bv7r",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12800221630",
        ownUrl: "https://handpan.co.kr/shop/?idx=103",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=103",
        i18n: {
            fr: {
                name: "C# Amara 9",
                description: "Le C# Amara 9, également connu sous le nom de « Celtic Minor » et membre du trio Wellness (Pygmy, Aegean, Amara), occupe une place unique dans les communautés mondiales de yoga, de méditation et de guérison, rendu célèbre par les performances renommées de Malte Marten. Également version d'introduction du bien-aimé E Amara 18, cette gamme est profondément appréciée par ceux qui recherchent la paix intérieure en Orient et en Occident, grâce à sa résonance mystérieuse et spirituelle unique."
            },
            ja: {
                name: "C# Amara 9",
                description: "ウェルネス三大スケール（Pygmy・Aegean・Amara）の一つで、「Celtic Minor」としても知られる C# Amara 9 は、Malte Marten の名演によって世界的に注目され、ヨガ・瞑想・ヒーリングコミュニティで独自の地位を確立しています。人気モデル E Amara 18 の入門版でもあり、特有の神秘的でスピリチュアルな響きによって、東西を問わず内なる平和を求める多くの人々に愛されています。"
            },
            zh: {
                name: "C# Amara 9",
                description: "作为\"身心疗愈三巨头\"（Pygmy、Aegean、Amara）之一，同时也被称为\"Celtic Minor\"的 C# Amara 9，因 Malte Marten 的精彩演奏而享誉全球，在瑜伽、冥想与疗愈社区中占据独特地位。它也是广受欢迎的 E Amara 18 的入门版本，凭借独特而灵性的共鸣，深受东西方所有追求内在平静之人的喜爱。"
            },
            de: {
                name: "C# Amara 9",
                description: "Mitglied der \"Wellness-Top-3\" (Pygmy, Aegean, Amara) und auch als \"Celtic Minor\" bekannt. Die C# Amara 9 wurde durch die virtuosen Interpretationen von Malte Marten berühmt und nimmt weltweit in Yoga-, Meditations- und Healing-Communities eine herausragende Stellung ein. Als Einsteigerversion der beliebten E Amara 18 ist sie dank ihres mystischen, spirituellen Klanges bei Menschen in Ost und West gleichermaßen geschätzt, die auf der Suche nach innerem Frieden sind."
            },
            es: {
                name: "C# Amara 9",
                description: "Miembro del \"trío del bienestar\" (Pygmy, Aegean, Amara) y también conocida como \"Celtic Minor\". La C# Amara 9 se hizo famosa gracias a las interpretaciones de Malte Marten y hoy ocupa una posición destacada en comunidades de yoga, meditación y sanación en todo el mundo. Es la versión de iniciación de la muy apreciada E Amara 18 y, gracias a su resonancia misteriosa y espiritual, es muy querida por quienes buscan la paz interior, tanto en Oriente como en Occidente."
            },
            ru: {
                name: "C# Amara 9",
                description: "Представитель «великий троицы wellness-гамм» (Pygmy, Aegean, Amara), также известна как Celtic Minor. C# Amara 9 стала популярной благодаря выдающимся выступлениям Мальте Мартена и сегодня занимает особое место в сообществах йоги, медитации и звукового исцеления по всему миру. Это также «входная» версия любимой многими гаммы E Amara 18. За счёт своего мистического и духовного звучания она особенно любима теми, кто ищет внутренний покой — как на Востоке, так и на Западе."
            },
            fa: {
                name: "C# Amara 9",
                description: "عضوی از «سه‌گانهٔ بزرگ Wellness» (Pygmy, Aegean, Amara) و همچنین با نام Celtic Minor شناخته می‌شود. C# Amara 9 با اجراهای درخشان Malte Marten به شهرت جهانی رسیده و در جوامع یوگا، مدیتیشن و هیلینگ جایگاهی ویژه دارد. این گام، نسخهٔ ورودی محبوبِ E Amara 18 نیز به‌شمار می‌آید و به لطف رزونانس اسرارآمیز و معنوی خود، در شرق و غرب جهان نزد همهٔ کسانی که در جستجوی صلح درونی هستند، بسیار محبوب است."
            },
            pt: {
                name: "C# Amara 9",
                description: "Membro da \"trindade do bem-estar\" (Pygmy, Aegean, Amara) e também conhecida como Celtic Minor. A C# Amara 9 tornou-se famosa graças às performances de Malte Marten e hoje ocupa uma posição de destaque em comunidades de yoga, meditação e healing em todo o mundo. É também a versão de entrada da muito apreciada E Amara 18 e, graças à sua ressonância misteriosa e espiritual, é extremamente querida por todos que buscam paz interior, tanto no Oriente quanto no Ocidente."
            },
            ae: {
                name: "C# Amara 9",
                description: "عضو في «ثالوث العافية» (Pygmy, Aegean, Amara) ويُعرَف أيضًا باسم Celtic Minor. أصبحت C# Amara 9 مشهورة بفضل عروض Malte Marten، وتشغل اليوم مكانة خاصة في مجتمعات اليوغا، والتأمل، والعلاج بالصوت حول العالم. كما تُعتبَر النسخة المدخلية المحبوبة لسُلَّم E Amara 18، وبفضل رنينها الروحاني والغامض تحظى بمحبة كبيرة لدى كل من يبحث عن السلام الداخلي في الشرق والغرب على حد سواء."
            },
            it: {
                name: "C# Amara 9",
                description: "Fa parte del \"triangolo del benessere\" (Pygmy, Aegean, Amara) ed è conosciuta anche come Celtic Minor. È diventata famosa grazie alle interpretazioni di Malte Marten e oggi occupa una posizione speciale nelle comunità di yoga, meditazione e healing in tutto il mondo. È anche la versione introduttiva molto amata della scala E Amara 18. Grazie alla sua risonanza misteriosa e spirituale, è profondamente apprezzata da chi cerca pace interiore, sia in Oriente che in Occidente."
            }
        }
    },

    // 29. F# Low Pygmy 12
    {
        id: "fs_low_pygmy_12",
        name: "F# Low Pygmy 12",
        nameEn: "F# Low Pygmy 12",
        notes: {
            ding: "F#3",
            top: ["G#3", "A3", "C#4", "E4", "F#4", "G#4", "A4", "C#5", "E5"],
            bottom: ["D3", "E3"]
        },
        vector: { minorMajor: -0.7, pureSpicy: 0.2, rarePopular: 0.7 },
        tags: ["피그미", "저음보강", "몽환적", "치유"],
        tagsEn: ["Pygmy", "Bass Boost", "Dreamy", "Healing"],
        description: "깊고 풍성한 저음이 특징인 F# Low Pygmy 스케일의 12노트 버전입니다. 몽환적이고 신비로운 울림으로 내면의 평화와 치유를 선사하며, 확장된 음역대로 더욱 다채로운 연주가 가능합니다.",
        descriptionEn: "A 12-note version of the F# Low Pygmy scale, characterized by deep and rich bass. Its dreamy and mysterious resonance offers inner peace and healing, while the extended range allows for more diverse performance.",
        videoUrl: "https://youtu.be/pRuQQDSMUY0?si=9TJIit8W9P9VZnqi",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12705260873",
        ownUrl: "https://handpan.co.kr/shop/?idx=104",
        ownUrlEn: "https://handpanen.imweb.me/21/?idx=104"
    },

    // 30. E Amara 18
    {
        id: "e_amara_18",
        name: "E Amara 18",
        nameEn: "E Amara 18",
        notes: {
            ding: "E3",
            top: ["B3", "C4", "E4", "F#4", "G4", "A4", "B4", "C5", "E5", "F#5", "G5", "A5"],
            bottom: ["C3", "D3", "G3", "A3", "D5"]
        },
        vector: { minorMajor: -0.6, pureSpicy: 0.8, rarePopular: 0.5 },
        tags: ["아마라", "켈틱마이너", "뮤턴트", "전문가용"],
        tagsEn: ["Amara", "Celtic Minor", "Mutant", "Professional"],
        description: "압도적인 18개 노트로 구성된 E Amara 스케일입니다. 켈틱 마이너의 신비로움에 광범위한 음역이 더해져, 솔로 연주만으로도 오케스트라와 같은 웅장하고 섬세한 표현이 가능한 전문가용 모델입니다.",
        descriptionEn: "An E Amara scale consisting of an overwhelming 18 notes. Adding a wide range to the mystery of Celtic Minor, it is a professional model capable of magnificent and delicate expression like an orchestra with just a solo performance.",
        videoUrl: "https://youtu.be/o42OZ6uhqDU?si=2QnyvwhFr0ETWlSc",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12070371584",
        ownUrl: "https://handpan.co.kr/shop/?idx=105",
        ownUrlEn: "https://handpanen.imweb.me/21/?idx=105"
    },
    // 31. C# Amara 10 (Added)
    {
        id: "cs_amara_10",
        name: "C# Amara 10",
        nameEn: "C# Amara 10",
        notes: {
            ding: "C#3",
            top: ["G#3", "B3", "C#4", "D#4", "E4", "F#4", "G#4", "B4", "C#5"],
            bottom: []
        },
        vector: { minorMajor: -0.7, pureSpicy: 0.15, rarePopular: 0.95 },
        tags: ["마이너", "대중적", "입문추천", "Amara"],
        tagsEn: ["Minor", "Popular", "Beginner Recommended", "Amara"],
        description: "C# Amara 9의 확장형 모델로, 총 10개의 노트를 통해 더욱 풍성한 표현이 가능합니다. 입문자에게 가장 추천하는 모델 중 하나로, 켈틱 마이너 특유의 신비로운 감성을 담고 있습니다.",
        descriptionEn: "An extended model of C# Amara 9, allowing for richer expression with a total of 10 notes. It is one of the most recommended models for beginners, containing the unique mysterious sensibility of Celtic Minor.",
        videoUrl: "https://youtu.be/W9QAtyTDrTM?si=Cy7YMKhp-MY2Bv7r",
        productUrl: "https://smartstore.naver.com/sndhandpan/products/12800221630",
        ownUrl: "https://handpan.co.kr/shop/?idx=103",
        ownUrlEn: "https://handpanen.imweb.me/shop/?idx=103",
        i18n: {
            ja: {
                name: "C# Amara 10",
                description: "C# Amara 9 の拡張モデルで、10 音の構成によりさらに豊かな表現が可能です。入門者に最もおすすめのモデルの一つで、ケルティック・マイナー特有の神秘的な感性を備えています。"
            },
            zh: {
                name: "C# Amara 10",
                description: "C# Amara 9 的扩展型号，通过 10 个音符实现更丰富的表达。是初学者最推荐的型号之一，蕴含着凯尔特小调特有的神秘感。"
            }
        }
    }
];

