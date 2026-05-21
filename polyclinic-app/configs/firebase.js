import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
    apiKey:            'AIzaSyBwTZGXz35oi_S8jnIppXnKwz-dbvXWWwk',
    authDomain:        'polyclinic-app-abb80.firebaseapp.com',
    databaseURL:       'https://polyclinic-app-abb80-default-rtdb.asia-southeast1.firebasedatabase.app',
    projectId:         'polyclinic-app-abb80',
    storageBucket:     'polyclinic-app-abb80.firebasestorage.app',
    messagingSenderId: '746405622649',
    appId:             '1:746405622649:web:4b177b6f8e4b3fce7bf5a8',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);