import i18n from "i18next"
import { initReactI18next } from "react-i18next"

// Language resources
const resources = {
  en: {
    translation: {
      common: {
        welcome: "Welcome to Mahakavya",
        loading: "Loading...",
        error: "An error occurred",
        success: "Success",
        cancel: "Cancel",
        confirm: "Confirm",
        save: "Save",
        delete: "Delete",
        edit: "Edit",
        search: "Search",
        filter: "Filter",
        sortBy: "Sort by",
        viewMore: "View More",
      },
      features: {
        samvaaha: "Social Feed",
        drishya: "Video Reels",
        varta: "Messaging",
        nivedana: "Fundraising",
        sahaya: "Peer Support",
        bhagyachakra: "Lucky Draws",
      },
      nav: {
        home: "Home",
        profile: "Profile",
        settings: "Settings",
        logout: "Logout",
        admin: "Admin Dashboard",
      },
    },
  },
  hi: {
    translation: {
      common: {
        welcome: "महाकाव्य में आपका स्वागत है",
        loading: "लोड हो रहा है...",
        error: "एक त्रुटि हुई",
        success: "सफलता",
        cancel: "रद्द करें",
        confirm: "पुष्टि करें",
        save: "सहेजें",
        delete: "हटाएं",
        edit: "संपादित करें",
        search: "खोजें",
        filter: "फ़िल्टर",
        sortBy: "क्रमबद्ध करें",
        viewMore: "और देखें",
      },
      features: {
        samvaaha: "सामाजिक फ़ीड",
        drishya: "वीडियो रील्स",
        varta: "संदेश",
        nivedana: "धन उगाही",
        sahaya: "सहायता",
        bhagyachakra: "भाग्य चक्र",
      },
      nav: {
        home: "मुख्य पृष्ठ",
        profile: "प्रोफ़ाइल",
        settings: "सेटिंग्स",
        logout: "लॉग आउट",
        admin: "प्रशासन डैशबोर्ड",
      },
    },
  },
  es: {
    translation: {
      common: {
        welcome: "Bienvenido a Mahakavya",
        loading: "Cargando...",
        error: "Ocurrió un error",
        success: "Éxito",
        cancel: "Cancelar",
        confirm: "Confirmar",
        save: "Guardar",
        delete: "Eliminar",
        edit: "Editar",
        search: "Buscar",
        filter: "Filtrar",
        sortBy: "Ordenar por",
        viewMore: "Ver más",
      },
      features: {
        samvaaha: "Feed Social",
        drishya: "Videos Cortos",
        varta: "Mensajería",
        nivedana: "Recaudación de Fondos",
        sahaya: "Apoyo entre Pares",
        bhagyachakra: "Sorteos",
      },
      nav: {
        home: "Inicio",
        profile: "Perfil",
        settings: "Configuración",
        logout: "Cerrar Sesión",
        admin: "Panel de Administración",
      },
    },
  },
  fr: {
    translation: {
      common: {
        welcome: "Bienvenue sur Mahakavya",
        loading: "Chargement...",
        error: "Une erreur s'est produite",
        success: "Succès",
        cancel: "Annuler",
        confirm: "Confirmer",
        save: "Enregistrer",
        delete: "Supprimer",
        edit: "Modifier",
        search: "Rechercher",
        filter: "Filtrer",
        sortBy: "Trier par",
        viewMore: "Voir Plus",
      },
      features: {
        samvaaha: "Fil Social",
        drishya: "Vidéos Courtes",
        varta: "Messagerie",
        nivedana: "Collecte de Fonds",
        sahaya: "Soutien par les Pairs",
        bhagyachakra: "Tirages au Sort",
      },
      nav: {
        home: "Accueil",
        profile: "Profil",
        settings: "Paramètres",
        logout: "Déconnexion",
        admin: "Tableau de Bord Admin",
      },
    },
  },
}

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
