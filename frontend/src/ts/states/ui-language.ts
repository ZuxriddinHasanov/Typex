import { createSignal } from "solid-js";

export type UILanguage = "uzbek" | "english" | "russian";

const stored = localStorage.getItem("uiLanguage") as UILanguage | null;
const initial: UILanguage =
  stored && ["uzbek", "english", "russian"].includes(stored) ? stored : "uzbek";

export const [getUiLanguage, setUiLanguage] = createSignal<UILanguage>(initial);

export function changeUiLanguage(lang: UILanguage): void {
  setUiLanguage(lang);
  localStorage.setItem("uiLanguage", lang);
}

const dictionary: Record<UILanguage, Record<string, string>> = {
  uzbek: {
    "nav.home": "Bosh sahifa",
    "nav.test": "Test",
    "nav.leaderboard": "Reyting",
    "nav.about": "Loyiha haqida",
    "nav.login": "Kirish",
    "nav.profile": "Profil",

    "landing.title": "TypeX bilan o'z yozish tezligingizni oshiring",
    "landing.subtitle":
      "Sodda, chiroyli va qulay bo'lgan onlayn yozish testi. O'zbekistondagi eng yaxshilar qatoriga qo'shiling.",
    "landing.start": "Testni boshlash",
    "landing.features.ai": "AI tahlili",
    "landing.features.ai.desc":
      "Sizning natijalaringizni sun'iy intellekt orqali tahlil qilib, haftalik xulosalar va maslahatlar beramiz.",
    "landing.features.competitive": "Raqobatbardosh reyting",
    "landing.features.competitive.desc":
      "Kunlik, oylik va umumiy reytinglar orqali boshqa foydalanuvchilar bilan raqobatlashing.",
    "landing.features.stats": "Batafsil statistika",
    "landing.features.stats.desc":
      "Har bir testdan so'ng xatolar, tezlik o'zgarishi va barqarorlikni chuqur tahlil qiling.",

    "about.title": "Loyiha haqida",
    "about.history": "Tarix",
    "about.features": "Xususiyatlar",

    "profile.edit": "Sozlamalar & Tahrirlash",
    "profile.report": "Shikoyat qilish",
    "profile.addFriend": "Do'st qo'shish",
    "profile.copyLink": "Nusxalash",
    "profile.notfound": "Foydalanuvchi topilmadi",
    "profile.allTimeLb": "Barcha Vaqtlar Reytingi",
    "profile.seconds": "soniya",
    "profile.words": "so'z",

    "test.wpm": "tezlik",
    "test.acc": "aniqlik",
    "test.raw": "sof",
    "test.characters": "belgilar",
    "test.consistency": "barqarorlik",
    "test.time": "vaqt",
    "test.errors": "xatolar",
    "test.correct": "to'g'ri",
    "test.incorrect": "xato",
    "test.extra": "ortiqcha",
    "test.missed": "qoldirilgan",
    "test.nextTest": "Keyingi test",
    "test.repeatTest": "Testni qaytarish",
    "test.practiceWords": "So'zlarni mashq qilish",
    "test.history": "So'zlar tarixini ko'rsatish",
    "test.replay": "Qaytadan ko'rish",
    "test.saveScreenshot":
      "Skrinshotni nusxalash\n(yuklab olish uchun shift+click)",
  },
  english: {
    "nav.home": "Home",
    "nav.test": "Test",
    "nav.leaderboard": "Leaderboard",
    "nav.about": "About",
    "nav.login": "Login",
    "nav.profile": "Profile",

    "landing.title": "Improve your typing speed with TypeX",
    "landing.subtitle":
      "A simple, beautiful and convenient online typing test. Join the best in Uzbekistan.",
    "landing.start": "Start Test",
    "landing.features.ai": "AI Analysis",
    "landing.features.ai.desc":
      "We analyze your results using artificial intelligence to provide weekly summaries and advice.",
    "landing.features.competitive": "Competitive Leaderboard",
    "landing.features.competitive.desc":
      "Compete with other users through daily, monthly and overall leaderboards.",
    "landing.features.stats": "Detailed Statistics",
    "landing.features.stats.desc":
      "Deeply analyze your mistakes, speed changes and consistency after every test.",

    "about.title": "About Project",
    "about.history": "History",
    "about.features": "Features",

    "profile.edit": "Settings & Edit",
    "profile.report": "Report User",
    "profile.addFriend": "Add Friend",
    "profile.copyLink": "Copy Link",
    "profile.notfound": "User not found",
    "profile.allTimeLb": "All Time Leaderboard",
    "profile.seconds": "seconds",
    "profile.words": "words",

    "test.wpm": "tezlik",
    "test.acc": "acc",
    "test.raw": "sof",
    "test.characters": "characters",
    "test.consistency": "consistency",
    "test.time": "time",
    "test.errors": "errors",
    "test.correct": "correct",
    "test.incorrect": "incorrect",
    "test.extra": "extra",
    "test.missed": "missed",
    "test.nextTest": "Next test",
    "test.repeatTest": "Repeat test",
    "test.practiceWords": "Practice words",
    "test.history": "Toggle words history",
    "test.replay": "Watch replay",
    "test.saveScreenshot":
      "Copy screenshot to clipboard\n(shift click to download)",
  },
  russian: {
    "nav.home": "Главная",
    "nav.test": "Тест",
    "nav.leaderboard": "Рейтинг",
    "nav.about": "О проекте",
    "nav.login": "Войти",
    "nav.profile": "Профиль",

    "landing.title": "Улучшите скорость печати с TypeX",
    "landing.subtitle":
      "Простой, красивый и удобный онлайн тест скорости печати. Присоединяйтесь к лучшим в Узбекистане.",
    "landing.start": "Начать тест",
    "landing.features.ai": "ИИ Анализ",
    "landing.features.ai.desc":
      "Мы анализируем ваши результаты с помощью искусственного интеллекта и даем еженедельные советы.",
    "landing.features.competitive": "Соревновательный рейтинг",
    "landing.features.competitive.desc":
      "Соревнуйтесь с другими пользователями через ежедневные, ежемесячные и общие рейтинги.",
    "landing.features.stats": "Подробная статистика",
    "landing.features.stats.desc":
      "Глубоко анализируйте свои ошибки, изменения скорости и стабильность после каждого теста.",

    "about.title": "О проекте",
    "about.history": "История",
    "about.features": "Особенности",

    "profile.edit": "Настройки и Редактирование",
    "profile.report": "Пожаловаться",
    "profile.addFriend": "Добавить друга",
    "profile.copyLink": "Копировать ссылку",
    "profile.notfound": "Пользователь не найден",
    "profile.allTimeLb": "Общий рейтинг",
    "profile.seconds": "секунд",
    "profile.words": "слов",

    "test.wpm": "tezlik",
    "test.acc": "точн",
    "test.raw": "sof",
    "test.characters": "символы",
    "test.consistency": "стабильность",
    "test.time": "время",
    "test.errors": "ошибки",
    "test.correct": "правильно",
    "test.incorrect": "неправильно",
    "test.extra": "лишние",
    "test.missed": "пропущенные",
    "test.nextTest": "Следующий тест",
    "test.repeatTest": "Повторить тест",
    "test.practiceWords": "Тренировка слов",
    "test.history": "История слов",
    "test.replay": "Смотреть повтор",
    "test.saveScreenshot": "Копировать скриншот\n(shift+клик для скачивания)",
  },
};

export function t(key: string): string {
  const lang = getUiLanguage();
  return dictionary[lang]?.[key] ?? dictionary["english"]?.[key] ?? key;
}

