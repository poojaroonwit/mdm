
import { storeUploadedImage } from '../src/lib/upload-storage';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testUpload() {
  const filename = `test-final-${Date.now()}.png`;
  const buffer = Buffer.from('fake-image-content-final');
  const mimeType = 'image/png';

  console.log('Testing storeUploadedImage with bucket configured in .env');

  try {
    const url = await storeUploadedImage('widget-avatars', filename, buffer, mimeType);
    console.log('Success! Final test upload worked.');
    console.log('Public URL:', url);
  } catch (error) {
    console.error('Final test upload failed:', error);
  }
}

testUpload();
