export type Language = 'ko' | 'en' | 'fr' | 'de' | 'ja' | 'zh' | 'tr' | 'ar' | 'pt' | 'es' | 'ru' | 'fa' | 'ae' | 'it';

export const SUPPORTED_LANGUAGES = [
    { code: 'ko', name: '한국어', flag: 'kr' },
    { code: 'en', name: 'English', flag: 'us' },
    { code: 'zh', name: '中文', flag: 'cn' },
    { code: 'fr', name: 'Français', flag: 'fr' },
    { code: 'ja', name: '日本語', flag: 'jp' },
    { code: 'de', name: 'Deutsch', flag: 'de' },
    { code: 'es', name: 'Español', flag: 'es' },
    { code: 'ru', name: 'Русский', flag: 'ru' },
    { code: 'fa', name: 'فارسی', flag: 'ir' },
    { code: 'pt', name: 'Português', flag: 'pt' },
    { code: 'ae', name: 'العربية (UAE)', flag: 'ae' },
    { code: 'it', name: 'Italiano', flag: 'it' },
    { code: 'tr', name: 'Türkçe', flag: 'tr' },
    { code: 'ar', name: 'العربية', flag: 'sa' }
] as const;

const EN_TRANSLATIONS = {
    title: 'Find My Perfect Handpan Scale',
    vibeSelector: {
        jamming: 'Beginner',
        meditation: 'Yoga·Meditation·Healing',
        uplift: 'Bright Atmosphere',
        exotic: 'Deep Ethnic'
    },
    scaleList: {
        back: 'Select Again',
        scaleClassification: 'Classification',
        allScales: 'All Scales',
        purchase: 'Buy',
        preparing: 'Coming Soon',
        share: 'Share',
        copied: 'Copied',
        rankRecommendation: 'Recommendation',
        popularScale: 'Popular',
        ding: 'Ding',
        top: 'T',
        bottom: 'B',
        prev: 'Prev',
        next: 'Next',
        mutant: 'Mutant',
        normal: 'Normal',
        viewing: 'Viewing',
        select: 'Select',
        filter: 'Filter',
        selectCategory: 'Select Category',
        selectType: 'Select Type',
        noteCount: 'Note Count',
        selectDing: 'Select Ding',
        mood: 'Mood',
        tone: 'Tone',
        popularity: 'Popularity',
        minor: 'Minor',
        major: 'Major',
        pure: 'Pure',
        spicy: 'Spicy',
        rare: 'Rare',
        popular: 'Popular',
        digiPan: 'DigiPan',
        implementationPending: 'Implementation Pending',
        tryPlaying: 'Try playing it yourself.',
        axes: {
            minorMajor: {
                label: 'Mood',
                description: 'Represents the overall emotional atmosphere of the scale.',
                minLabel: 'Minor',
                maxLabel: 'Major'
            },
            pureSpicy: {
                label: 'Tone',
                description: 'Represents the degree of simplicity vs. complexity of the sound.',
                minLabel: 'Pure',
                maxLabel: 'Spicy'
            },
            rarePopular: {
                label: 'Popularity',
                description: 'Represents the scarcity and popularity in the market.',
                minLabel: 'Rare',
                maxLabel: 'Popular'
            }
        }
    },
    categories: {
        beginner: 'Beginner',
        healing: 'Yoga & Meditation',
        bright: 'Major Scale',
        ethnic: 'Deep Ethnic',
        case: 'Hard Case',
        softCase: 'Soft Case',
        stand: 'Stand'
    },
    shipping: {
        worldwide: 'Worldwide Shipping',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Minor',
        major: 'Major',
        harmonic: 'Harmonic',
        melodic: 'Melodic',
        pentatonic: 'Pentatonic',
        exotic: 'Exotic',
        meditative: 'Meditative',
        bright: 'Bright',
        dark: 'Dark',
        mysterious: 'Mysterious',
        happy: 'Happy',
        sad: 'Sad',
        uplifting: 'Uplifting',
        calm: 'Calm',
        energetic: 'Energetic'
    },
    soldOut: 'Sold Out'
};

const FR_TRANSLATIONS = {
    title: 'Trouver ma gamme de handpan idéale',
    vibeSelector: {
        jamming: 'Débutant',
        meditation: 'Yoga·Méditation·Guérison',
        uplift: 'Atmosphère lumineuse',
        exotic: 'Ethnique profond'
    },
    scaleList: {
        back: 'Choisir à nouveau',
        scaleClassification: 'Classification',
        allScales: 'Toutes les gammes',
        purchase: 'Acheter',
        preparing: 'Bientôt disponible',
        share: 'Partager',
        copied: 'Copié',
        rankRecommendation: 'Recommandation',
        popularScale: 'Populaire',
        ding: 'Ding',
        top: 'Haut',
        bottom: 'Bas',
        prev: 'Préc',
        next: 'Suiv',
        mutant: 'Mutant',
        normal: 'Normal',
        viewing: 'Affichage',
        select: 'Sélectionner',
        filter: 'Filtrer',
        selectCategory: 'Choisir une catégorie',
        selectType: 'Choisir un type',
        noteCount: 'Nombre de notes',
        selectDing: 'Choisir le Ding',
        mood: 'Ambiance',
        tone: 'Timbre',
        popularity: 'Popularité',
        minor: 'Mineur',
        major: 'Majeur',
        pure: 'Pur',
        spicy: 'Épicé',
        rare: 'Rare',
        popular: 'Populaire',
        digiPan: 'DigiPan',
        implementationPending: 'Implémentation en attente',
        tryPlaying: 'Essayez de le jouer vous-même.',
        axes: {
            minorMajor: {
                label: 'Ambiance',
                description: "Représente l'atmosphère émotionnelle globale de la gamme.",
                minLabel: 'Mineur',
                maxLabel: 'Majeur'
            },
            pureSpicy: {
                label: 'Timbre',
                description: 'Représente le degré de simplicité ou de complexité du son.',
                minLabel: 'Pur',
                maxLabel: 'Épicé'
            },
            rarePopular: {
                label: 'Popularité',
                description: 'Représente la rareté et la popularité sur le marché.',
                minLabel: 'Rare',
                maxLabel: 'Populaire'
            }
        }
    },
    categories: {
        beginner: 'Débutant',
        healing: 'Yoga & Méditation',
        bright: 'Gamme Majeure',
        ethnic: 'Ethnique profond',
        case: 'Étui rigide',
        softCase: 'Étui souple',
        stand: 'Support'
    },
    shipping: {
        worldwide: 'Livraison internationale',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Mineur',
        major: 'Majeur',
        harmonic: 'Harmonique',
        melodic: 'Mélodique',
        pentatonic: 'Pentatonique',
        exotic: 'Exotique',
        meditative: 'Méditatif',
        bright: 'Lumineux',
        dark: 'Sombre',
        mysterious: 'Mystérieux',
        happy: 'Joyeux',
        sad: 'Triste',
        uplifting: 'Édifiant',
        calm: 'Calme',
        energetic: 'Énergique'
    },
    soldOut: 'Épuisé'
};

const DE_TRANSLATIONS = {
    title: 'Meine passende Handpan-Tonleiter finden',
    vibeSelector: {
        jamming: 'Anfänger',
        meditation: 'Yoga·Meditation·Heilung',
        uplift: 'Helle Atmosphäre',
        exotic: 'Tiefe Ethnische'
    },
    scaleList: {
        back: 'Erneut auswählen',
        scaleClassification: 'Klassifizierung',
        allScales: 'Alle Skalen',
        purchase: 'Kaufen',
        preparing: 'Demnächst verfügbar',
        share: 'Teilen',
        copied: 'Kopiert',
        rankRecommendation: 'Empfehlung',
        popularScale: 'Beliebt',
        ding: 'Ding',
        top: 'T',
        bottom: 'B',
        prev: 'Zurück',
        next: 'Weiter',
        mutant: 'Mutant',
        normal: 'Normal',
        viewing: 'Anzeigen',
        select: 'Auswählen',
        filter: 'Filter',
        selectCategory: 'Kategorie auswählen',
        selectType: 'Typ auswählen',
        noteCount: 'Anzahl der Noten',
        selectDing: 'Ding auswählen',
        mood: 'Stimmung',
        tone: 'Klangfarbe',
        popularity: 'Beliebtheit',
        minor: 'Moll',
        major: 'Dur',
        pure: 'Rein',
        spicy: 'Würzig',
        rare: 'Selten',
        popular: 'Beliebt',
        digiPan: 'DigiPan',
        implementationPending: 'Implementierung ausstehend',
        tryPlaying: 'Probieren Sie es selbst aus.',
        axes: {
            minorMajor: {
                label: 'Stimmung',
                description: 'Repräsentiert die gesamte emotionale Atmosphäre der Skala.',
                minLabel: 'Moll',
                maxLabel: 'Dur'
            },
            pureSpicy: {
                label: 'Klangfarbe',
                description: 'Repräsentiert den Grad der Einfachheit oder Komplexität des Klangs.',
                minLabel: 'Rein',
                maxLabel: 'Würzig'
            },
            rarePopular: {
                label: 'Beliebtheit',
                description: 'Repräsentiert die Seltenheit und Beliebtheit auf dem Markt.',
                minLabel: 'Selten',
                maxLabel: 'Beliebt'
            }
        }
    },
    categories: {
        beginner: 'Anfänger',
        healing: 'Yoga & Meditation',
        bright: 'Dur-Skala',
        ethnic: 'Tiefe Ethnische',
        case: 'Hartschalenkoffer',
        softCase: 'Weichschalenkoffer',
        stand: 'Ständer'
    },
    shipping: {
        worldwide: 'Weltweiter Versand',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Moll',
        major: 'Dur',
        harmonic: 'Harmonisch',
        melodic: 'Melodisch',
        pentatonic: 'Pentatonisch',
        exotic: 'Exotisch',
        meditative: 'Meditativ',
        bright: 'Hell',
        dark: 'Dunkel',
        mysterious: 'Mysteriös',
        happy: 'Glücklich',
        sad: 'Traurig',
        uplifting: 'Erhebend',
        calm: 'Ruhig',
        energetic: 'Energisch'
    },
    soldOut: 'Ausverkauft'
};

const RU_TRANSLATIONS = {
    title: 'Найти мою идеальную гамму хэндпана',
    vibeSelector: {
        jamming: 'Новичок',
        meditation: 'Йога·Медитация·Исцеление',
        uplift: 'Яркая атмосфера',
        exotic: 'Глубокий этнический'
    },
    scaleList: {
        back: 'Выбрать снова',
        scaleClassification: 'Классификация',
        allScales: 'Все гаммы',
        purchase: 'Купить',
        preparing: 'Скоро в продаже',
        share: 'Поделиться',
        copied: 'Скопировано',
        rankRecommendation: 'Рекомендация',
        popularScale: 'Популярная',
        ding: 'Ding',
        top: 'Верх',
        bottom: 'Низ',
        prev: 'Назад',
        next: 'Вперёд',
        mutant: 'Мутант',
        normal: 'Обычная',
        viewing: 'Просмотр',
        select: 'Выбрать',
        filter: 'Фильтр',
        selectCategory: 'Выбрать категорию',
        selectType: 'Выбрать тип',
        noteCount: 'Количество нот',
        selectDing: 'Выбрать Ding',
        mood: 'Настроение',
        tone: 'Тон',
        popularity: 'Популярность',
        minor: 'Минор',
        major: 'Мажор',
        pure: 'Чистый',
        spicy: 'Острый',
        rare: 'Редкая',
        popular: 'Популярная',
        digiPan: 'DigiPan',
        implementationPending: 'Реализация ожидается',
        tryPlaying: 'Попробуйте сыграть сами.',
        axes: {
            minorMajor: {
                label: 'Настроение',
                description: 'Представляет общую эмоциональную атмосферу гаммы.',
                minLabel: 'Минор',
                maxLabel: 'Мажор'
            },
            pureSpicy: {
                label: 'Тон',
                description: 'Представляет степень простоты или сложности звука.',
                minLabel: 'Чистый',
                maxLabel: 'Острый'
            },
            rarePopular: {
                label: 'Популярность',
                description: 'Представляет редкость и популярность на рынке.',
                minLabel: 'Редкая',
                maxLabel: 'Популярная'
            }
        }
    },
    categories: {
        beginner: 'Новичок',
        healing: 'Йога & Медитация',
        bright: 'Мажорная гамма',
        ethnic: 'Глубокий этнический',
        case: 'Жёсткий чехол',
        softCase: 'Мягкий чехол',
        stand: 'Подставка'
    },
    shipping: {
        worldwide: 'Доставка по всему миру',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Минор',
        major: 'Мажор',
        harmonic: 'Гармонический',
        melodic: 'Мелодический',
        pentatonic: 'Пентатонический',
        exotic: 'Экзотический',
        meditative: 'Медитативный',
        bright: 'Яркий',
        dark: 'Тёмный',
        mysterious: 'Таинственный',
        happy: 'Радостный',
        sad: 'Грустный',
        uplifting: 'Воодушевляющий',
        calm: 'Спокойный',
        energetic: 'Энергичный'
    },
    soldOut: 'Распродано'
};

const FA_TRANSLATIONS = {
    title: 'یافتن گام هنگ‌درام مناسب من',
    vibeSelector: {
        jamming: 'مبتدی',
        meditation: 'یوگا·مدیتیشن·درمان',
        uplift: 'فضای روشن',
        exotic: 'قومی عمیق'
    },
    scaleList: {
        back: 'انتخاب مجدد',
        scaleClassification: 'طبقه‌بندی',
        allScales: 'همهٔ گام‌ها',
        purchase: 'خرید',
        preparing: 'به‌زودی',
        share: 'اشتراک‌گذاری',
        copied: 'کپی شد',
        rankRecommendation: 'توصیه',
        popularScale: 'محبوب',
        ding: 'Ding',
        top: 'بالا',
        bottom: 'پایین',
        prev: 'قبلی',
        next: 'بعدی',
        mutant: 'جهش‌یافته',
        normal: 'عادی',
        viewing: 'در حال مشاهده',
        select: 'انتخاب',
        filter: 'فیلتر',
        selectCategory: 'انتخاب دسته',
        selectType: 'انتخاب نوع',
        noteCount: 'تعداد نت',
        selectDing: 'انتخاب Ding',
        mood: 'حال‌وهوا',
        tone: 'تن',
        popularity: 'محبوبیت',
        minor: 'مینور',
        major: 'ماژور',
        pure: 'خالص',
        spicy: 'تیز',
        rare: 'کمیاب',
        popular: 'محبوب',
        digiPan: 'DigiPan',
        implementationPending: 'پیاده‌سازی در انتظار',
        tryPlaying: 'خودتان بنوازید',
        axes: {
            minorMajor: {
                label: 'حال‌وهوا',
                description: 'نمایان‌گر فضای احساسی کلی گام است.',
                minLabel: 'مینور',
                maxLabel: 'ماژور'
            },
            pureSpicy: {
                label: 'تن',
                description: 'نمایان‌گر درجهٔ سادگی در مقابل پیچیدگی صدا است.',
                minLabel: 'خالص',
                maxLabel: 'تیز'
            },
            rarePopular: {
                label: 'محبوبیت',
                description: 'نمایان‌گر کمیابی و محبوبیت در بازار است.',
                minLabel: 'کمیاب',
                maxLabel: 'محبوب'
            }
        }
    },
    categories: {
        beginner: 'مبتدی',
        healing: 'یوگا & مدیتیشن',
        bright: 'گام ماژور',
        ethnic: 'قومی عمیق',
        case: 'کیف سخت',
        softCase: 'کیف نرم',
        stand: 'پایه'
    },
    shipping: {
        worldwide: 'ارسال به سراسر جهان',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'مینور',
        major: 'ماژور',
        harmonic: 'هارمونیک',
        melodic: 'ملودیک',
        pentatonic: 'پنتاتونیک',
        exotic: 'اگزوتیک',
        meditative: 'مدیتیشنی',
        bright: 'روشن',
        dark: 'تاریک',
        mysterious: 'رازآلود',
        happy: 'شاد',
        sad: 'غمگین',
        uplifting: 'الهام‌بخش',
        calm: 'آرام',
        energetic: 'پرانرژی'
    },
    soldOut: 'تمام شده'
};

const AE_TRANSLATIONS = {
    title: 'اكتشاف سُلَّم الهاندبان المناسب لي',
    vibeSelector: {
        jamming: 'مبتدئ',
        meditation: 'يوغا·تأمل·شفاء',
        uplift: 'جو مشرق',
        exotic: 'إثني عميق'
    },
    scaleList: {
        back: 'اختيار مرة أخرى',
        scaleClassification: 'التصنيف',
        allScales: 'جميع السلالم',
        purchase: 'شراء',
        preparing: 'قريبًا',
        share: 'مشاركة',
        copied: 'تم النسخ',
        rankRecommendation: 'توصية',
        popularScale: 'شائع',
        ding: 'Ding',
        top: 'أعلى',
        bottom: 'أسفل',
        prev: 'السابق',
        next: 'التالي',
        mutant: 'متطوّر',
        normal: 'عادي',
        viewing: 'عرض',
        select: 'اختيار',
        filter: 'تصفية',
        selectCategory: 'اختيار الفئة',
        selectType: 'اختيار النوع',
        noteCount: 'عدد النغمات',
        selectDing: 'اختيار Ding',
        mood: 'المزاج',
        tone: 'النغمة',
        popularity: 'الشعبية',
        minor: 'مينور',
        major: 'ماجور',
        pure: 'نقي',
        spicy: 'حار',
        rare: 'نادر',
        popular: 'شائع',
        digiPan: 'DigiPan',
        implementationPending: 'قيد التنفيذ',
        tryPlaying: 'جرّب العزف بنفسك.',
        axes: {
            minorMajor: {
                label: 'المزاج',
                description: 'يمثّل الجو العاطفي العام للسُلَّم.',
                minLabel: 'مينور',
                maxLabel: 'ماجور'
            },
            pureSpicy: {
                label: 'النغمة',
                description: 'يمثّل درجة البساطة مقابل التعقيد في الصوت.',
                minLabel: 'نقي',
                maxLabel: 'حار'
            },
            rarePopular: {
                label: 'الشعبية',
                description: 'يمثّل الندرة والشعبية في السوق.',
                minLabel: 'نادر',
                maxLabel: 'شائع'
            }
        }
    },
    categories: {
        beginner: 'مبتدئ',
        healing: 'يوغا & تأمل',
        bright: 'سُلَّم ماجور',
        ethnic: 'إثني عميق',
        case: 'حقيبة صلبة',
        softCase: 'حقيبة ناعمة',
        stand: 'حامل'
    },
    shipping: {
        worldwide: 'شحن عالمي',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'مينور',
        major: 'ماجور',
        harmonic: 'هارموني',
        melodic: 'لحني',
        pentatonic: 'بنتاتوني',
        exotic: 'أجنبي',
        meditative: 'تأملي',
        bright: 'مشرق',
        dark: 'داكن',
        mysterious: 'غامض',
        happy: 'سعيد',
        sad: 'حزين',
        uplifting: 'ملهِم',
        calm: 'هادئ',
        energetic: 'نشط'
    },
    soldOut: 'نفدت الكمية'
};

const ES_TRANSLATIONS = {
    title: 'Encontrar mi escala de handpan perfecta',
    vibeSelector: {
        jamming: 'Principiante',
        meditation: 'Yoga·Meditación·Sanación',
        uplift: 'Atmósfera brillante',
        exotic: 'Étnico profundo'
    },
    scaleList: {
        back: 'Seleccionar de nuevo',
        scaleClassification: 'Clasificación',
        allScales: 'Todas las escalas',
        purchase: 'Comprar',
        preparing: 'Próximamente',
        share: 'Compartir',
        copied: 'Copiado',
        rankRecommendation: 'Recomendación',
        popularScale: 'Popular',
        ding: 'Ding',
        top: 'Arriba',
        bottom: 'Abajo',
        prev: 'Anterior',
        next: 'Siguiente',
        mutant: 'Mutante',
        normal: 'Normal',
        viewing: 'Viendo',
        select: 'Seleccionar',
        filter: 'Filtrar',
        selectCategory: 'Seleccionar categoría',
        selectType: 'Seleccionar tipo',
        noteCount: 'Número de notas',
        selectDing: 'Seleccionar Ding',
        mood: 'Estado de ánimo',
        tone: 'Tono',
        popularity: 'Popularidad',
        minor: 'Menor',
        major: 'Mayor',
        pure: 'Puro',
        spicy: 'Picante',
        rare: 'Raro',
        popular: 'Popular',
        digiPan: 'DigiPan',
        implementationPending: 'Implementación pendiente',
        tryPlaying: 'Prueba a tocarlo tú mismo.',
        axes: {
            minorMajor: {
                label: 'Estado de ánimo',
                description: 'Representa la atmósfera emocional general de la escala.',
                minLabel: 'Menor',
                maxLabel: 'Mayor'
            },
            pureSpicy: {
                label: 'Tono',
                description: 'Representa el grado de simplicidad o complejidad del sonido.',
                minLabel: 'Puro',
                maxLabel: 'Picante'
            },
            rarePopular: {
                label: 'Popularidad',
                description: 'Representa la rareza y popularidad en el mercado.',
                minLabel: 'Raro',
                maxLabel: 'Popular'
            }
        }
    },
    categories: {
        beginner: 'Principiante',
        healing: 'Yoga & Meditación',
        bright: 'Escala Mayor',
        ethnic: 'Étnico profundo',
        case: 'Estuche rígido',
        softCase: 'Estuche blando',
        stand: 'Soporte'
    },
    shipping: {
        worldwide: 'Envío mundial',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Menor',
        major: 'Mayor',
        harmonic: 'Harmónico',
        melodic: 'Melódico',
        pentatonic: 'Pentatónico',
        exotic: 'Exótico',
        meditative: 'Meditativo',
        bright: 'Brillante',
        dark: 'Oscuro',
        mysterious: 'Misterioso',
        happy: 'Feliz',
        sad: 'Triste',
        uplifting: 'Elevador',
        calm: 'Tranquilo',
        energetic: 'Energético'
    },
    soldOut: 'Agotado'
};

const PT_TRANSLATIONS = {
    title: 'Encontrar minha escala de handpan ideal',
    vibeSelector: {
        jamming: 'Iniciante',
        meditation: 'Yoga·Meditação·Cura',
        uplift: 'Atmosfera brilhante',
        exotic: 'Étnico profundo'
    },
    scaleList: {
        back: 'Selecionar novamente',
        scaleClassification: 'Classificação',
        allScales: 'Todas as escalas',
        purchase: 'Comprar',
        preparing: 'Em breve',
        share: 'Compartilhar',
        copied: 'Copiado',
        rankRecommendation: 'Recomendação',
        popularScale: 'Popular',
        ding: 'Ding',
        top: 'Superior',
        bottom: 'Inferior',
        prev: 'Anterior',
        next: 'Próximo',
        mutant: 'Mutante',
        normal: 'Normal',
        viewing: 'Visualizando',
        select: 'Selecionar',
        filter: 'Filtro',
        selectCategory: 'Selecionar categoria',
        selectType: 'Selecionar tipo',
        noteCount: 'Número de notas',
        selectDing: 'Selecionar Ding',
        mood: 'Humor',
        tone: 'Tom',
        popularity: 'Popularidade',
        minor: 'Menor',
        major: 'Maior',
        pure: 'Puro',
        spicy: 'Picante',
        rare: 'Raro',
        popular: 'Popular',
        digiPan: 'DigiPan',
        implementationPending: 'Implementação pendente',
        tryPlaying: 'Toque você mesmo.',
        axes: {
            minorMajor: {
                label: 'Humor',
                description: 'Representa a atmosfera emocional geral da escala.',
                minLabel: 'Menor',
                maxLabel: 'Maior'
            },
            pureSpicy: {
                label: 'Tom',
                description: 'Representa o grau de simplicidade versus complexidade do som.',
                minLabel: 'Puro',
                maxLabel: 'Picante'
            },
            rarePopular: {
                label: 'Popularidade',
                description: 'Representa a raridade e popularidade no mercado.',
                minLabel: 'Raro',
                maxLabel: 'Popular'
            }
        }
    },
    categories: {
        beginner: 'Iniciante',
        healing: 'Yoga & Meditação',
        bright: 'Escala Maior',
        ethnic: 'Étnico profundo',
        case: 'Estojo rígido',
        softCase: 'Estojo macio',
        stand: 'Suporte'
    },
    shipping: {
        worldwide: 'Envio mundial',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Menor',
        major: 'Maior',
        harmonic: 'Harmônico',
        melodic: 'Melódico',
        pentatonic: 'Pentatônico',
        exotic: 'Exótico',
        meditative: 'Meditativo',
        bright: 'Brilhante',
        dark: 'Escuro',
        mysterious: 'Misterioso',
        happy: 'Feliz',
        sad: 'Triste',
        uplifting: 'Inspirador',
        calm: 'Calmo',
        energetic: 'Energético'
    },
    soldOut: 'Esgotado'
};

const IT_TRANSLATIONS = {
    title: 'Trovare la mia scala di handpan ideale',
    vibeSelector: {
        jamming: 'Principiante',
        meditation: 'Yoga·Meditazione·Guarigione',
        uplift: 'Atmosfera luminosa',
        exotic: 'Etnico profondo'
    },
    scaleList: {
        back: 'Seleziona di nuovo',
        scaleClassification: 'Classificazione',
        allScales: 'Tutte le scale',
        purchase: 'Acquista',
        preparing: 'Prossimamente',
        share: 'Condividi',
        copied: 'Copiato',
        rankRecommendation: 'Raccomandazione',
        popularScale: 'Popolare',
        ding: 'Ding',
        top: 'Superiore',
        bottom: 'Inferiore',
        prev: 'Precedente',
        next: 'Successivo',
        mutant: 'Mutante',
        normal: 'Normale',
        viewing: 'Visualizzazione',
        select: 'Seleziona',
        filter: 'Filtro',
        selectCategory: 'Seleziona categoria',
        selectType: 'Seleziona tipo',
        noteCount: 'Numero di note',
        selectDing: 'Seleziona Ding',
        mood: 'Umore',
        tone: 'Tono',
        popularity: 'Popolarità',
        minor: 'Minore',
        major: 'Maggiore',
        pure: 'Puro',
        spicy: 'Piccante',
        rare: 'Raro',
        popular: 'Popolare',
        digiPan: 'DigiPan',
        implementationPending: 'Implementazione in sospeso',
        tryPlaying: 'Prova a suonarlo tu stesso.',
        axes: {
            minorMajor: {
                label: 'Umore',
                description: 'Rappresenta l\'atmosfera emotiva complessiva della scala.',
                minLabel: 'Minore',
                maxLabel: 'Maggiore'
            },
            pureSpicy: {
                label: 'Tono',
                description: 'Rappresenta il grado di semplicità o complessità del suono.',
                minLabel: 'Puro',
                maxLabel: 'Piccante'
            },
            rarePopular: {
                label: 'Popolarità',
                description: 'Rappresenta la rarità e la popolarità sul mercato.',
                minLabel: 'Raro',
                maxLabel: 'Popolare'
            }
        }
    },
    categories: {
        beginner: 'Principiante',
        healing: 'Yoga & Meditazione',
        bright: 'Scala Maggiore',
        ethnic: 'Etnico profondo',
        case: 'Custodia rigida',
        softCase: 'Custodia morbida',
        stand: 'Supporto'
    },
    shipping: {
        worldwide: 'Spedizione mondiale',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'Minore',
        major: 'Maggiore',
        harmonic: 'Armonico',
        melodic: 'Melodico',
        pentatonic: 'Pentatonico',
        exotic: 'Esotico',
        meditative: 'Meditativo',
        bright: 'Luminoso',
        dark: 'Scuro',
        mysterious: 'Misterioso',
        happy: 'Felice',
        sad: 'Triste',
        uplifting: 'Elevante',
        calm: 'Calmo',
        energetic: 'Energetico'
    },
    soldOut: 'Esaurito'
};

const JA_TRANSLATIONS = {
    title: '自分に合ったハンドパン・スケールを見つける',
    vibeSelector: {
        jamming: '初心者',
        meditation: 'ヨガ・瞑想・ヒーリング',
        uplift: '明るい雰囲気',
        exotic: 'ディープエスニック'
    },
    scaleList: {
        back: '再選択',
        scaleClassification: '分類基準',
        allScales: '全スケール',
        purchase: '購入',
        preparing: '準備中',
        share: '共有',
        copied: 'コピーしました',
        rankRecommendation: 'おすすめ',
        popularScale: '人気スケール',
        ding: 'Ding',
        top: 'T',
        bottom: 'B',
        prev: '前へ',
        next: '次へ',
        mutant: 'ミュータント',
        normal: '通常',
        viewing: '閲覧中',
        select: '選択',
        filter: 'フィルター',
        selectCategory: 'カテゴリー選択',
        selectType: 'タイプ選択',
        noteCount: 'ノート数',
        selectDing: 'Ding選択',
        mood: '調性',
        tone: '音色',
        popularity: '人気度',
        minor: 'マイナー',
        major: 'メジャー',
        pure: 'シンプル',
        spicy: '華やか',
        rare: '希少',
        popular: '人気',
        digiPan: 'DigiPan',
        implementationPending: '実装予定',
        tryPlaying: 'ご自身で演奏してみてください。',
        axes: {
            minorMajor: {
                label: '調性',
                description: 'スケールが与える全体的な感情的な雰囲気を表します。',
                minLabel: 'マイナー',
                maxLabel: 'メジャー'
            },
            pureSpicy: {
                label: '音色',
                description: '音のシンプルさと華やかさの程度を表します。',
                minLabel: 'シンプル',
                maxLabel: '華やか'
            },
            rarePopular: {
                label: '人気度',
                description: '市場での希少性と人気を表します。',
                minLabel: '希少',
                maxLabel: '人気'
            }
        }
    },
    categories: {
        beginner: '初心者',
        healing: 'ヨガ・瞑想・ヒーリング',
        bright: 'メジャースケール',
        ethnic: 'ディープエスニック',
        case: 'ハードケース',
        softCase: 'ソフトケース',
        stand: 'スタンド'
    },
    shipping: {
        worldwide: '全世界配送可能',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: 'マイナー',
        major: 'メジャー',
        harmonic: 'ハーモニック',
        melodic: 'メロディック',
        pentatonic: 'ペンタトニック',
        exotic: 'エキゾチック',
        meditative: '瞑想的',
        bright: '明るい',
        dark: '暗い',
        mysterious: '神秘的',
        happy: '幸せ',
        sad: '悲しい',
        uplifting: '高揚感',
        calm: '穏やか',
        energetic: 'エネルギッシュ'
    },
    soldOut: '売り切れ'
};

const ZH_TRANSLATIONS = {
    title: '找到适合我的手碟音阶',
    vibeSelector: {
        jamming: '初学者',
        meditation: '瑜伽·冥想·疗愈',
        uplift: '明亮氛围',
        exotic: '深度民族风'
    },
    scaleList: {
        back: '重新选择',
        scaleClassification: '分类标准',
        allScales: '所有音阶',
        purchase: '购买',
        preparing: '准备中',
        share: '分享',
        copied: '已复制',
        rankRecommendation: '推荐',
        popularScale: '热门音阶',
        ding: 'Ding',
        top: 'T',
        bottom: 'B',
        prev: '上一个',
        next: '下一个',
        mutant: '变异型',
        normal: '标准型',
        viewing: '查看中',
        select: '选择',
        filter: '筛选',
        selectCategory: '选择类别',
        selectType: '选择类型',
        noteCount: '音符数量',
        selectDing: '选择Ding',
        mood: '调性',
        tone: '音色',
        popularity: '受欢迎度',
        minor: '小调',
        major: '大调',
        pure: '纯净',
        spicy: '丰富',
        rare: '稀有',
        popular: '流行',
        digiPan: 'DigiPan',
        implementationPending: '待实现',
        tryPlaying: '自己试着演奏一下。',
        axes: {
            minorMajor: {
                label: '调性',
                description: '代表音阶的整体情感氛围。',
                minLabel: '小调',
                maxLabel: '大调'
            },
            pureSpicy: {
                label: '音色',
                description: '代表声音的简洁与丰富程度。',
                minLabel: '纯净',
                maxLabel: '丰富'
            },
            rarePopular: {
                label: '受欢迎度',
                description: '代表市场上的稀有性和受欢迎程度。',
                minLabel: '稀有',
                maxLabel: '流行'
            }
        }
    },
    categories: {
        beginner: '初学者',
        healing: '瑜伽·冥想·疗愈',
        bright: '大调音阶',
        ethnic: '深度民族风',
        case: '硬壳',
        softCase: '软壳',
        stand: '支架'
    },
    shipping: {
        worldwide: '全球配送',
        worldwideEn: 'Worldwide Shipping'
    },
    tags: {
        minor: '小调',
        major: '大调',
        harmonic: '和声',
        melodic: '旋律',
        pentatonic: '五声音阶',
        exotic: '异域风情',
        meditative: '冥想',
        bright: '明亮',
        dark: '深沉',
        mysterious: '神秘',
        happy: '快乐',
        sad: '悲伤',
        uplifting: '振奋',
        calm: '平静',
        energetic: '充满活力'
    },
    soldOut: '已售罄'
};

export type TranslationType = typeof EN_TRANSLATIONS;

export const TRANSLATIONS: Record<Language, TranslationType> = {
    ko: {
        title: '나에게 맞는 핸드팬 스케일 찾기',
        vibeSelector: {
            jamming: '입문용',
            meditation: '요가·명상·힐링',
            uplift: '밝은 분위기',
            exotic: '딥 에스닉'
        },
        scaleList: {
            back: '다시 선택',
            scaleClassification: '분류기준',
            allScales: '전체스케일',
            purchase: '구매',
            preparing: '준비중',
            share: '공유',
            copied: '복사됨',
            rankRecommendation: '위 추천',
            popularScale: '인기 스케일',
            ding: 'Ding',
            top: 'T',
            bottom: 'B',
            prev: '이전',
            next: '다음',
            mutant: '뮤턴트',
            normal: '일반',
            viewing: '보고있음',
            select: '선택',
            filter: '필터',
            selectCategory: '카테고리 선택',
            selectType: '타입 선택',
            noteCount: '노트 개수',
            selectDing: '딩 선택',
            mood: '조성',
            tone: '음향질감',
            popularity: '대중성',
            minor: '마이너',
            major: '메이저',
            pure: '담백함',
            spicy: '화려함',
            rare: '희소함',
            popular: '대중적',
            digiPan: '디지팬',
            implementationPending: '구현 예정',
            tryPlaying: '직접 연주해보세요.',
            axes: {
                minorMajor: {
                    label: '조성 (Mood)',
                    description: '스케일이 주는 전체적인 감정적 분위기를 나타냅니다.',
                    minLabel: 'Minor (단조)',
                    maxLabel: 'Major (장조)'
                },
                pureSpicy: {
                    label: '음향 질감 (Tone)',
                    description: '소리의 담백함과 화려함의 정도를 나타냅니다.',
                    minLabel: 'Pure (담백함)',
                    maxLabel: 'Spicy (화려함)'
                },
                rarePopular: {
                    label: '대중성 (Popularity)',
                    description: '시장에서의 희소성과 대중적인 인기를 나타냅니다.',
                    minLabel: 'Rare (희소함)',
                    maxLabel: 'Popular (대중적)'
                }
            }
        },
        categories: {
            beginner: '입문용',
            healing: '요가명상힐링',
            bright: '메이저 스케일',
            ethnic: '딥 에스닉',
            case: '하드케이스',
            softCase: '소프트케이스',
            stand: '스탠드'
        },
        shipping: {
            worldwide: '전세계 배송 가능',
            worldwideEn: 'Worldwide Shipping'
        },
        tags: {
            minor: '마이너',
            major: '메이저',
            harmonic: '하모닉',
            melodic: '멜로딕',
            pentatonic: '펜타토닉',
            exotic: '이국적',
            meditative: '명상적',
            bright: '밝은',
            dark: '어두운',
            mysterious: '신비로운',
            happy: '행복한',
            sad: '슬픈',
            uplifting: '고양되는',
            calm: '차분한',
            energetic: '에너지 넘치는'
        },
        soldOut: '품절'
    },
    en: EN_TRANSLATIONS,
    fr: FR_TRANSLATIONS,
    de: DE_TRANSLATIONS,
    ja: JA_TRANSLATIONS,
    zh: ZH_TRANSLATIONS,
    tr: EN_TRANSLATIONS,
    ar: EN_TRANSLATIONS,
    pt: PT_TRANSLATIONS,
    es: ES_TRANSLATIONS,
    ru: RU_TRANSLATIONS,
    fa: FA_TRANSLATIONS,
    ae: AE_TRANSLATIONS,
    it: IT_TRANSLATIONS
} as const;

