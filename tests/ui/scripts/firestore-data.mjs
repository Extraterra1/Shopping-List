import { initializeApp } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc
} from "firebase/firestore";

const mode = process.argv[2];
if (!mode || !["seed", "clean"].includes(mode)) {
  console.error("Usage: node tests/ui/scripts/firestore-data.mjs <seed|clean>");
  process.exit(2);
}

const projectId = process.env.UI_FIREBASE_PROJECT_ID || "demo-shopping-list";
const host = process.env.UI_FIRESTORE_EMULATOR_HOST || "127.0.0.1";
const port = Number(process.env.UI_FIRESTORE_EMULATOR_PORT || "8080");

const app = initializeApp({
  apiKey: "demo-api-key",
  authDomain: `${projectId}.firebaseapp.com`,
  projectId
});

const db = getFirestore(app);
connectFirestoreEmulator(db, host, port);

const wipeCollection = async (name) => {
  const snapshot = await getDocs(collection(db, name));
  await Promise.all(snapshot.docs.map((entry) => deleteDoc(doc(db, name, entry.id))));
};

const clean = async () => {
  await wipeCollection("groceries");
  await wipeCollection("custom_emojis");
};

const seedBaseline = async () => {
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
      setDoc(doc(db, "groceries", item.id), {
        name: item.name,
        emoji: item.emoji,
        checked: item.checked,
        order: item.order
      })
    )
  );
};

const run = async () => {
  try {
    if (mode === "clean") {
      await clean();
      console.log("[firestore-data] cleaned groceries and custom_emojis");
      return;
    }

    await clean();
    await seedBaseline();
    console.log("[firestore-data] seeded baseline groceries");
  } catch (error) {
    console.error("[firestore-data] failed:", error.message);
    process.exit(1);
  }
};

await run();
