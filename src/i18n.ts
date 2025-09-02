import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      magnitude: "Magnitude",
      time: "Time",
      location: "Location"
    }
  },
  hi: {
    translation: {
      magnitude: "तीव्रता",
      time: "समय",
      location: "स्थान"
    }
  },
  te: {
    translation: {
      magnitude: "ప్రబలత",
      time: "సమయం",
      location: "ప్రదేశం"
    }
  }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
