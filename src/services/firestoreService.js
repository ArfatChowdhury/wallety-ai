import {
    collection,
    doc,
    setDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    getDoc
} from 'firebase/firestore';
import { db, auth } from './firebase';

const getUserRef = (uid) => {
    return doc(db, 'users', uid);
};

// ── Expenses ────────────────────────────────────────────────────────────────

export const saveExpenseToCloud = async (uid, expense) => {
    const expenseRef = doc(collection(getUserRef(uid), 'expenses'), expense.id);
    await setDoc(expenseRef, expense);
};

export const updateExpenseInCloud = async (uid, expense) => {
    const expenseRef = doc(collection(getUserRef(uid), 'expenses'), expense.id);
    await updateDoc(expenseRef, expense);
};

export const deleteExpenseFromCloud = async (uid, expenseId) => {
    const expenseRef = doc(collection(getUserRef(uid), 'expenses'), expenseId);
    await deleteDoc(expenseRef);
};

export const subscribeToExpenses = (uid, onChange) => {
    const q = query(
        collection(getUserRef(uid), 'expenses'),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onChange(data);
    });

    return unsubscribe;
};

// ── Income ──────────────────────────────────────────────────────────────────

export const saveIncomeToCloud = async (uid, income) => {
    const incomeRef = doc(collection(getUserRef(uid), 'incomes'), income.id);
    await setDoc(incomeRef, income);
};

export const deleteIncomeFromCloud = async (uid, incomeId) => {
    const incomeRef = doc(collection(getUserRef(uid), 'incomes'), incomeId);
    await deleteDoc(incomeRef);
};

export const subscribeToIncomes = (uid, onChange) => {
    const q = query(
        collection(getUserRef(uid), 'incomes'),
        orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onChange(data);
    });

    return unsubscribe;
};

// ── Budgets & Settings ───────────────────────────────────────────────────────

export const saveBudgetsToCloud = async (uid, budgets) => {
    const settingsRef = doc(collection(getUserRef(uid), 'settings'), 'budgets');
    await setDoc(settingsRef, budgets);
};

export const saveSettingsToCloud = async (uid, settings) => {
    const settingsRef = doc(collection(getUserRef(uid), 'settings'), 'preferences');
    await setDoc(settingsRef, settings, { merge: true });
};

export const loadSettingsFromCloud = async (uid) => {
    const settingsRef = doc(collection(getUserRef(uid), 'settings'), 'preferences');
    const docSnap = await getDoc(settingsRef);
    return docSnap.exists() ? docSnap.data() : {};
};

// ── Auth helpers ─────────────────────────────────────────────────────────────

export const signOut = async () => {
    await auth.signOut();
};

export const getCurrentUser = () => {
    return auth.currentUser;
};

export const onAuthStateChanged = (callback) => {
    return auth.onAuthStateChanged(callback);
};
