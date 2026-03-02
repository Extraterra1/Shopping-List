const mode = process.argv[2];
const validModes = [
  "seed",
  "clean",
  "reorder-active",
  "seed-priority-insert",
  "seed-priority-rebuild",
  "verify-priority-rules"
];
if (!mode || !validModes.includes(mode)) {
  console.error(
    "Usage: node tests/ui/scripts/firestore-data.mjs <seed|clean|reorder-active|seed-priority-insert|seed-priority-rebuild|verify-priority-rules>"
  );
  process.exit(2);
}

const projectId = process.env.UI_FIREBASE_PROJECT_ID || "demo-shopping-list";
const firestoreHost = process.env.UI_FIRESTORE_EMULATOR_HOST || "localhost";
const firestorePort = Number(process.env.UI_FIRESTORE_EMULATOR_PORT || "8080");
const authHost = process.env.UI_AUTH_EMULATOR_HOST || "localhost";
const authPort = Number(process.env.UI_AUTH_EMULATOR_PORT || "9099");
const email = process.env.UI_TEST_USER_EMAIL || "ui-test@example.com";
const password = process.env.UI_TEST_USER_PASSWORD || "ui-test-password";

const firestoreBase = `http://${firestoreHost}:${firestorePort}/v1/projects/${projectId}/databases/(default)/documents`;
const firestoreClearUrl = `http://${firestoreHost}:${firestorePort}/emulator/v1/projects/${projectId}/databases/(default)/documents`;
const authBase = `http://${authHost}:${authPort}/identitytoolkit.googleapis.com/v1`;
const apiKey = "fake-api-key";

const OWNER_HEADERS = {
  Authorization: "Bearer owner",
  "Content-Type": "application/json"
};

const nowIso = () => new Date().toISOString();

const toFirestoreFields = (payload) => {
  const fields = {};
  Object.entries(payload).forEach(([key, value]) => {
    if (typeof value === "string") {
      fields[key] = { stringValue: value };
      return;
    }

    if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
      return;
    }

    if (typeof value === "number") {
      fields[key] = { integerValue: String(value) };
      return;
    }

    fields[key] = { timestampValue: value };
  });
  return { fields };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const text = await response.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
  }

  if (!response.ok) {
    const message = data?.error?.message || response.statusText;
    throw new Error(message);
  }

  return data;
};

const authCall = async (endpoint, payload) => {
  return fetchJson(`${authBase}/${endpoint}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
};

const ensureAuthUser = async (userEmail, userPassword) => {
  try {
    const signUp = await authCall("accounts:signUp", {
      email: userEmail,
      password: userPassword,
      returnSecureToken: true
    });
    return { uid: signUp.localId, idToken: signUp.idToken };
  } catch (error) {
    if (!String(error.message).includes("EMAIL_EXISTS")) {
      throw error;
    }

    const signIn = await authCall("accounts:signInWithPassword", {
      email: userEmail,
      password: userPassword,
      returnSecureToken: true
    });
    return { uid: signIn.localId, idToken: signIn.idToken };
  }
};

const ensureTestUser = async () => {
  try {
    const signUp = await authCall("accounts:signUp", {
      email,
      password,
      returnSecureToken: true
    });
    return signUp.localId;
  } catch (error) {
    if (!String(error.message).includes("EMAIL_EXISTS")) {
      throw error;
    }

    const signIn = await authCall("accounts:signInWithPassword", {
      email,
      password,
      returnSecureToken: true
    });
    return signIn.localId;
  }
};

const clearDatabase = async () => {
  await fetchJson(firestoreClearUrl, {
    method: "DELETE"
  });
};

const setDocument = async (docPath, payload, headers = OWNER_HEADERS) => {
  await fetchJson(`${firestoreBase}/${docPath}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(toFirestoreFields(payload))
  });
};

const seedBaseline = async (uid) => {
  const timestamp = nowIso();

  await setDocument(`users/${uid}`, {
    displayName: "UI Test User",
    email,
    photoURL: "",
    createdAt: timestamp,
    lastLoginAt: timestamp
  });

  const groceries = [
    {
      id: "milk-active",
      name: "Milk",
      emoji: "🥛",
      checked: false,
      order: 0
    },
    {
      id: "bread-active",
      name: "Bread",
      emoji: "🍞",
      checked: false,
      order: 1
    },
    {
      id: "eggs-completed",
      name: "Eggs",
      emoji: "🥚",
      checked: true,
      order: 2
    }
  ];

  await Promise.all(
    groceries.map((item) =>
      setDocument(`users/${uid}/groceries/${item.id}`, {
        name: item.name,
        emoji: item.emoji,
        checked: item.checked,
        order: item.order,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    )
  );
};

const reorderActive = async (uid) => {
  const timestamp = nowIso();

  await setDocument(`users/${uid}/groceries/bread-active`, {
    name: "Bread",
    emoji: "🍞",
    checked: false,
    order: 0,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  await setDocument(`users/${uid}/groceries/milk-active`, {
    name: "Milk",
    emoji: "🥛",
    checked: false,
    order: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  });
};

const seedPriorityInsertData = async (uid) => {
  const timestamp = nowIso();
  await setDocument(`users/${uid}`, {
    displayName: "UI Test User",
    email,
    photoURL: "",
    createdAt: timestamp,
    lastLoginAt: timestamp
  });

  await Promise.all([
    setDocument(`users/${uid}/groceries/deodorant-active`, {
      name: "Deodorant",
      emoji: "🧴",
      checked: false,
      order: 0,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/groceries/cheese-active`, {
      name: "Cheese",
      emoji: "🧀",
      checked: false,
      order: 200,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/deodorant`, {
      canonicalName: "deodorant",
      priorityScore: 0,
      sampleCount: 4,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/milk`, {
      canonicalName: "milk",
      priorityScore: 100,
      sampleCount: 6,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/cheese`, {
      canonicalName: "cheese",
      priorityScore: 200,
      sampleCount: 5,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  ]);
};

const seedPriorityRebuildData = async (uid) => {
  const timestamp = nowIso();
  await setDocument(`users/${uid}`, {
    displayName: "UI Test User",
    email,
    photoURL: "",
    createdAt: timestamp,
    lastLoginAt: timestamp
  });

  await Promise.all([
    setDocument(`users/${uid}/groceries/milk-active`, {
      name: "Milk",
      emoji: "🥛",
      checked: false,
      order: 100,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/groceries/cheese-active`, {
      name: "Cheese",
      emoji: "🧀",
      checked: false,
      order: 200,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/bread`, {
      canonicalName: "bread",
      priorityScore: 0,
      sampleCount: 5,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/milk`, {
      canonicalName: "milk",
      priorityScore: 100,
      sampleCount: 6,
      createdAt: timestamp,
      updatedAt: timestamp
    }),
    setDocument(`users/${uid}/item_priorities/cheese`, {
      canonicalName: "cheese",
      priorityScore: 200,
      sampleCount: 5,
      createdAt: timestamp,
      updatedAt: timestamp
    })
  ]);
};

const expectFailure = async (label, callback) => {
  try {
    await callback();
    throw new Error(`${label} unexpectedly succeeded`);
  } catch (error) {
    const text = String(error.message || "");
    if (text.includes("unexpectedly succeeded")) {
      throw error;
    }
  }
};

const buildTokenHeaders = (idToken) => ({
  Authorization: `Bearer ${idToken}`,
  "Content-Type": "application/json"
});

const verifyPriorityRules = async () => {
  const owner = await ensureAuthUser(email, password);
  const intruder = await ensureAuthUser("priority-intruder@example.com", password);
  const ownerHeaders = buildTokenHeaders(owner.idToken);
  const intruderHeaders = buildTokenHeaders(intruder.idToken);

  const timestamp = nowIso();
  await setDocument(`users/${owner.uid}`, {
    displayName: "UI Test User",
    email,
    photoURL: "",
    createdAt: timestamp,
    lastLoginAt: timestamp
  }, ownerHeaders);

  await setDocument(`users/${owner.uid}/item_priorities/milk`, {
    canonicalName: "milk",
    priorityScore: 100,
    sampleCount: 1,
    createdAt: timestamp,
    updatedAt: timestamp
  }, ownerHeaders);

  await expectFailure("owner createdAt mutation", async () => {
    await setDocument(`users/${owner.uid}/item_priorities/milk`, {
      canonicalName: "milk",
      priorityScore: 120,
      sampleCount: 2,
      createdAt: new Date(Date.now() + 60_000).toISOString(),
      updatedAt: timestamp
    }, ownerHeaders);
  });

  await expectFailure("non-owner write", async () => {
    await setDocument(
      `users/${owner.uid}/item_priorities/nope`,
      {
        canonicalName: "nope",
        priorityScore: 300,
        sampleCount: 2,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      intruderHeaders
    );
  });
};

const run = async () => {
  try {
    if (mode === "verify-priority-rules") {
      await clearDatabase();
      await verifyPriorityRules();
      console.log(`[firestore-data] verified priority rules`);
      return;
    }

    const uid = await ensureTestUser();

    if (mode === "clean") {
      await clearDatabase();
      console.log(`[firestore-data] cleaned user-scoped data for ${uid}`);
      return;
    }

    if (mode === "reorder-active") {
      await reorderActive(uid);
      console.log(`[firestore-data] reordered active items for ${uid}`);
      return;
    }

    if (mode === "seed-priority-insert") {
      await clearDatabase();
      await seedPriorityInsertData(uid);
      console.log(`[firestore-data] seeded priority-insert fixtures for ${uid}`);
      return;
    }

    if (mode === "seed-priority-rebuild") {
      await clearDatabase();
      await seedPriorityRebuildData(uid);
      console.log(`[firestore-data] seeded priority-rebuild fixtures for ${uid}`);
      return;
    }

    await clearDatabase();
    await seedBaseline(uid);
    console.log(`[firestore-data] seeded baseline groceries for ${uid}`);
  } catch (error) {
    console.error("[firestore-data] failed:", error.message);
    process.exit(1);
  }
};

await run();
