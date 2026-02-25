const messages = {
  "en-US": {
    app: {
      title: "Groceries",
      subtitle: "Your mobile shopping list",
      loadingSession: "Loading your session..."
    },
    onboarding: {
      eyebrow: "Private by Default",
      title: "Groceries That Stay Organized Without the Mess.",
      description:
        "Build your list fast, keep custom emojis per item, and sync instantly between devices. Every account has its own private list and preferences.",
      tagFastAdd: "Fast Add",
      tagLiveSync: "Live Sync",
      tagPerUserLists: "Per-User Lists",
      ctaKicker: "Get started",
      ctaTitle: "Continue With Your Google Account",
      ctaDescription: "Sign in now and start tracking what you need to buy, edit, and complete in one place.",
      continueWithGoogle: "Continue With Google",
      testSignIn: "Sign In Test User",
      languageMenuAria: "Change language"
    },
    menu: {
      openAccount: "Open account menu",
      language: "Language",
      signOut: "Sign Out",
      languageSaveFailed: "Couldn't save language preference. We'll keep it on this device."
    },
    addItem: {
      placeholder: "Add item (e.g., Milk)",
      inputAria: "Add item",
      submitAria: "Add item to list",
      error: "Error adding item. Check console."
    },
    productList: {
      loading: "Loading...",
      empty: "Your list is empty. Add something!",
      completed: "Completed",
      aria: {
        groceryItem: "Grocery item {name}",
        editEmoji: "Edit emoji for {name}",
        editName: "Edit name for {name}",
        save: "Save {name}",
        cancelEditing: "Cancel editing {name}",
        reorder: "Reorder {name}",
        toggle: "Toggle {name}",
        edit: "Edit {name}",
        delete: "Delete {name}"
      }
    },
    errors: {
      redirectFailed: "We couldn't complete sign-in{code}. Please try again.",
      googleSignInFailed: "Google sign-in failed. Please try again.",
      testSignInFailed: "Test sign-in failed.",
      signOutFailed: "Sign-out failed. Please try again."
    },
    language: {
      englishUs: "English (US)",
      portuguesePt: "Português (PT)",
      spanishEs: "Español (ES)"
    }
  },
  "pt-PT": {
    app: {
      title: "Lista de Compras",
      subtitle: "A tua lista de compras móvel",
      loadingSession: "A carregar a tua sessão..."
    },
    onboarding: {
      eyebrow: "Privado por definição",
      title: "Compras organizadas sem confusão.",
      description:
        "Cria a tua lista rapidamente, guarda emojis personalizados por item e sincroniza entre dispositivos. Cada conta tem a sua própria lista e preferências.",
      tagFastAdd: "Adição Rápida",
      tagLiveSync: "Sincronização",
      tagPerUserLists: "Listas por Utilizador",
      ctaKicker: "Começar",
      ctaTitle: "Continuar com a tua conta Google",
      ctaDescription: "Inicia sessão agora e acompanha o que tens de comprar, editar e concluir num só lugar.",
      continueWithGoogle: "Continuar com Google",
      testSignIn: "Entrar com utilizador de teste",
      languageMenuAria: "Mudar idioma"
    },
    menu: {
      openAccount: "Abrir menu da conta",
      language: "Idioma",
      signOut: "Terminar sessão",
      languageSaveFailed: "Não foi possível guardar o idioma. Vamos manter esta escolha neste dispositivo."
    },
    addItem: {
      placeholder: "Adicionar item (ex.: Leite)",
      inputAria: "Adicionar item",
      submitAria: "Adicionar item à lista",
      error: "Erro ao adicionar item. Verifica a consola."
    },
    productList: {
      loading: "A carregar...",
      empty: "A tua lista está vazia. Adiciona algo!",
      completed: "Concluídos",
      aria: {
        groceryItem: "Item de compras {name}",
        editEmoji: "Editar emoji de {name}",
        editName: "Editar nome de {name}",
        save: "Guardar {name}",
        cancelEditing: "Cancelar edição de {name}",
        reorder: "Reordenar {name}",
        toggle: "Alternar {name}",
        edit: "Editar {name}",
        delete: "Eliminar {name}"
      }
    },
    errors: {
      redirectFailed: "Não foi possível concluir a autenticação{code}. Tenta novamente.",
      googleSignInFailed: "Falha no início de sessão com Google. Tenta novamente.",
      testSignInFailed: "Falha no início de sessão de teste.",
      signOutFailed: "Falha ao terminar sessão. Tenta novamente."
    },
    language: {
      englishUs: "Inglês (EUA)",
      portuguesePt: "Português (PT)",
      spanishEs: "Espanhol (ES)"
    }
  },
  "es-ES": {
    app: {
      title: "Lista de Compras",
      subtitle: "Tu lista de compras móvil",
      loadingSession: "Cargando tu sesión..."
    },
    onboarding: {
      eyebrow: "Privado por defecto",
      title: "Compras organizadas sin complicaciones.",
      description:
        "Crea tu lista rápido, guarda emojis personalizados por producto y sincroniza entre dispositivos. Cada cuenta tiene su lista y preferencias.",
      tagFastAdd: "Añadir Rápido",
      tagLiveSync: "Sincronización",
      tagPerUserLists: "Listas por Usuario",
      ctaKicker: "Empieza ahora",
      ctaTitle: "Continúa con tu cuenta de Google",
      ctaDescription: "Inicia sesión y controla lo que necesitas comprar, editar y completar en un solo lugar.",
      continueWithGoogle: "Continuar con Google",
      testSignIn: "Iniciar con usuario de prueba",
      languageMenuAria: "Cambiar idioma"
    },
    menu: {
      openAccount: "Abrir menú de cuenta",
      language: "Idioma",
      signOut: "Cerrar sesión",
      languageSaveFailed: "No se pudo guardar el idioma. Mantendremos esta preferencia en este dispositivo."
    },
    addItem: {
      placeholder: "Añadir producto (ej.: Leche)",
      inputAria: "Añadir producto",
      submitAria: "Añadir producto a la lista",
      error: "Error al añadir el producto. Revisa la consola."
    },
    productList: {
      loading: "Cargando...",
      empty: "Tu lista está vacía. Añade algo.",
      completed: "Completados",
      aria: {
        groceryItem: "Producto {name}",
        editEmoji: "Editar emoji de {name}",
        editName: "Editar nombre de {name}",
        save: "Guardar {name}",
        cancelEditing: "Cancelar edición de {name}",
        reorder: "Reordenar {name}",
        toggle: "Cambiar estado de {name}",
        edit: "Editar {name}",
        delete: "Eliminar {name}"
      }
    },
    errors: {
      redirectFailed: "No pudimos completar el inicio de sesión{code}. Inténtalo de nuevo.",
      googleSignInFailed: "Falló el inicio de sesión con Google. Inténtalo de nuevo.",
      testSignInFailed: "Falló el inicio de sesión de prueba.",
      signOutFailed: "Falló el cierre de sesión. Inténtalo de nuevo."
    },
    language: {
      englishUs: "Inglés (EE. UU.)",
      portuguesePt: "Portugués (PT)",
      spanishEs: "Español (ES)"
    }
  }
};

export default messages;
