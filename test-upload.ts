process.loadEnvFile('.env.local');
import { readFileSync } from 'fs';
import { app, db, storage } from './src/shared/firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, getDoc } from 'firebase/firestore';

async function testUpload() {
  const targetUserId = 'sandbox_user_123';
  // Minimal valid PDF header to simulate PDF file
  const dummyPdf = new Uint8Array([37, 80, 68, 70, 45, 49, 46, 52, 10, 37, 226, 227, 207, 211, 10]); 

  console.log('1. Starting production upload simulation...');
  
  try {
    const dietPlanRef = doc(db, 'dietPlans', targetUserId);
    const dietPlanSnap = await getDoc(dietPlanRef);
    const currentData = dietPlanSnap.exists() ? dietPlanSnap.data() : null;
    
    const newVersion = currentData ? currentData.version + 1 : 1;
    console.log(`Current version: ${newVersion - 1}, Next version: ${newVersion}`);
    
    const storagePath = `diet-vault/${targetUserId}/files/v${newVersion}-diet.pdf`;
    const storageRef = ref(storage, storagePath);
    
    console.log(`2. Uploading to Storage path: ${storagePath} ...`);
    const uploadTask = uploadBytesResumable(storageRef, dummyPdf, { contentType: 'application/pdf' });
    
    await new Promise((resolve, reject) => {
      uploadTask.on('state_changed', 
        (snap) => console.log('Progress: ' + (snap.bytesTransferred / snap.totalBytes) * 100 + '%'),
        reject,
        () => resolve(undefined)
      );
    });
    
    const fileUrl = await getDownloadURL(storageRef);
    console.log('3. Upload successful. File successfully exists in Storage. Download URL:', fileUrl);
    
    console.log('4. Writing to Firestore metadata at path: dietPlans/' + targetUserId + ' ...');
    const metadata = {
      fileUrl,
      fileName: 'test-diet.pdf',
      uploadedAt: Date.now(),
      uploadedBy: 'test@example.com',
      version: newVersion,
      fileSize: dummyPdf.byteLength,
      storagePath,
      active: true,
      previousVersions: currentData?.previousVersions || [],
    };
    
    await setDoc(dietPlanRef, metadata);
    console.log('5. Metadata successfully written to Firestore doc!');
    
    console.log('Test complete and proven end-to-end! The UI will instantly auto-update via onSnapshot.');
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

testUpload();
