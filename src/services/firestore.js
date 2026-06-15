import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, orderBy, limit as fsLimit, serverTimestamp } from 'firebase/firestore';

const getDB=()=>{
  const cfg={apiKey:import.meta.env.VITE_FIREBASE_API_KEY,authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,storageBucket:import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:import.meta.env.VITE_FIREBASE_APP_ID};
  return getFirestore(getApps().length===0?initializeApp(cfg):getApps()[0]);
};

export const upsertUser=async(uid,data)=>{try{await setDoc(doc(getDB(),'users',uid),{...data,updatedAt:serverTimestamp()},{merge:true});}catch(e){console.error('[FS] upsertUser:',e.message);}};
export const getUser=async(uid)=>{try{const s=await getDoc(doc(getDB(),'users',uid));return s.exists()?{id:s.id,...s.data()}:null;}catch{return null;}};
export const getUsers=async({limitN=100}={})=>{try{const q=query(collection(getDB(),'users'),orderBy('createdAt','desc'),fsLimit(limitN));const s=await getDocs(q);return s.docs.map(d=>({id:d.id,...d.data()}));}catch(e){console.error('[FS] getUsers:',e.message);return[];}};
export const updateUser=async(uid,data)=>{try{await updateDoc(doc(getDB(),'users',uid),{...data,updatedAt:serverTimestamp()});return true;}catch(e){console.error('[FS] updateUser:',e.message);return false;}};
export const getAnalyses=async({limitN=20,accessLevel,sport}={})=>{try{const c=[orderBy('createdAt','desc'),fsLimit(limitN)];if(accessLevel)c.unshift(where('accessLevel','==',accessLevel));if(sport)c.unshift(where('sport','==',sport));const s=await getDocs(query(collection(getDB(),'analyses'),...c));return s.docs.map(d=>({id:d.id,...d.data()}));}catch(e){console.error('[FS] getAnalyses:',e.message);return[];}};
export const saveAnalysis=async(data)=>{try{const{id,...rest}=data;if(id){await setDoc(doc(getDB(),'analyses',id),{...rest,updatedAt:serverTimestamp()},{merge:true});return id;}const r=await addDoc(collection(getDB(),'analyses'),{...rest,createdAt:serverTimestamp()});return r.id;}catch(e){console.error('[FS] saveAnalysis:',e.message);return null;}};
export const updateAnalysis=async(id,data)=>{try{await updateDoc(doc(getDB(),'analyses',id),{...data,updatedAt:serverTimestamp()});return true;}catch(e){console.error('[FS] updateAnalysis:',e.message);return false;}};
export const getCachedOdds=async()=>{try{const s=await getDoc(doc(getDB(),'cache','odds'));return s.exists()?s.data():null;}catch{return null;}};
export const setCachedOdds=async(data)=>{try{await setDoc(doc(getDB(),'cache','odds'),data);}catch(e){console.error('[FS] setCachedOdds:',e.message);}};
export const getCachedNews=async()=>{try{const s=await getDoc(doc(getDB(),'cache','news'));return s.exists()?s.data():null;}catch{return null;}};
export const setCachedNews=async(data)=>{try{await setDoc(doc(getDB(),'cache','news'),data);}catch(e){console.error('[FS] setCachedNews:',e.message);}};
export const getSettings=async()=>{try{const s=await getDoc(doc(getDB(),'settings','site'));return s.exists()?s.data():{};}catch{return{};}};
export const saveSettings=async(data)=>{try{await setDoc(doc(getDB(),'settings','site'),{...data,updatedAt:serverTimestamp()},{merge:true});return true;}catch(e){console.error('[FS] saveSettings:',e.message);return false;}};
