
import { Client } from 'minio';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testMinio() {
  const endpoint = process.env.MINIO_ENDPOINT;
  const port = parseInt(process.env.MINIO_PORT || '9000', 10);
  const useSSL = port === 443 || process.env.MINIO_USE_SSL === 'true';
  const accessKey = process.env.MINIO_ACCESS_KEY || '';
  const secretKey = process.env.MINIO_SECRET_KEY || '';

  console.log('Testing MinIO connection to:', endpoint, port, 'SSL:', useSSL);

  const client = new Client({
    endPoint: endpoint || '',
    port,
    useSSL,
    accessKey,
    secretKey,
  });

  try {
    const buckets = await client.listBuckets();
    console.log('Success! Buckets found:', buckets.map(b => b.name));
  } catch (error) {
    console.error('MinIO connection failed:', error);
  }
}

testMinio();
