import admin from "firebase-admin";

import * as dotenv from "dotenv";
import { getFirestore } from "firebase-admin/firestore";
dotenv.config();
const serviceAccount = {
  type: "service_account",
  project_id: "cladbee-6554e",
  private_key_id: process.env.private_key_id,
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1YEbDzs6MTGyq\nHjabo5wE4qkFQBIbClrXCo+jM9BwAHes+mDOrVZV0rt/vpka/OFPRADO4bUKJejX\nl8Zup5nWgw1euPdb4CD8COG2Jn5eNezFjF7jKEkt2FZ30eSUZK0QHDEaphY9N/tO\n0lMpVu+1U851kZt5BEe/kTXWKPBT9o3/i/YWgdcibVjD48FAMHeuR2ElOAgo+yap\nVffELG6cYvkXbrcl5WJG0kNkwL9rAYX+iv8x/W+8SjsN0fA6AAG4MbI9PCcXisGy\ns/0cAehiCOlAj7it2yezUgQ4hTlqjo3DJxwcUxYztUHerrqx9+t4jW/n+ygppgK+\njRwx+mebAgMBAAECggEAEad0W9zGV/ucXBaixBVxuzwAraUl3gHtA59gicciU7SH\n8YtRXuyaSbJAU9fOeUUB/UAmP/zSLVGxT0LTqrOfkrSg2YZxdTzkmQOYTK2EgVEI\nYdYe6kdikBbNm84PTK5b9gR4dxqRcZYAXRS1yYFPxbuJjgIFOwtCnI/ayKSld9aO\niv/mrFYrOrA2SdkpidczoxBy75vcfsbvFeqj7OG0LK7RvWNydFfr/3uJK3DY48pI\nn/GN3PkxVQch+ev/1trvMhcVHc8n9eh8Sl9ByPfFHoRsWeUW7cx8tpPDALQcYqRl\nml36pRAnsKyWO7OyUcchqoes+0HEuMgd0b/CHIbfKQKBgQDzcXs18HQEsixETPPg\ndMN0DPI9PcB2MM1/de7X0INycDRg36gAXqe19+bGvNab5FPC5TRFeE4HIoINbsTW\nvEOQMtcSBiip8etEr16L+hODXBDtDGEOOnJ2W8JEwHeTrBnomvL41pAVcd7EyOZx\nP8GJ5KqEhb0WWfHGCHpJRJfHhQKBgQC+uzxjCJqKhzth1gfxDD+5+ldY9Lf6NLhG\nAgMAqxOnHjdoF3Z0+IHsYeF3zQkltS8104rniNe6im7YTJTf6HSQyFKXWbLmsNJo\nT4/eCnjYbjWDJ2cZGS0d5UmdVp56pwcJInEEXpI2ddE8Ljmyu44XWP/fv48EGrd2\ntPd/9rJMnwKBgBW/urE79TGCNYA4m8UeyWNx0KZ2AN7OR12uzJLNVyD/Mz7AXIMD\n8dnI9v4kWsv8nxsXXQ8jy1zJ0XKfxcglc6fLUvmSQUnFii5NuJWq1tlyfTSgWX9q\n61T1p6p6w3QW+Q2V4kUm7iJsVOmhxSyy9Hh8TFugkx8PFBGMKlinXyP9AoGAEC/f\nzh/azcrwVTtO7Tw25FfEtf3+5zM2OGrPSm06e8JqvWDQYtj8Xc1ozzwNfK/F0/Gi\nJkhM1r4M7jqBoAcgbXEy4Tlxn3Z+RPALq7KD0wp3bCwZ6d1jINhmyP2i8ZHfXP0Z\nTl+gVRLmsQ7TQsH8KysYfCrLvnNuApsVLj0HoM0CgYEA6nLYCExWEJ+1KK2X/74z\nGs/Em2ghRNbn2ypxQPvRlPTthAyBgbmhG/I1PoXQKH2Tjry+cRRHtA/6mNxBOj3h\ncc8zYiNpIJMIVablkBARzWzSU3q8FO9/Mmmey4Hws9ivFZm6/qk43eeD/QUHZ1GP\nusI7dLD3TFoDmrR1MY9b85Y=\n-----END PRIVATE KEY-----\n",
  client_email: process.env.client_email,
  client_id: process.env.client_id,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: process.env.client_x509_cert_url,
  client_x509_cert_url: process.env.client_x509_cert_url,
  universe_domain: process.env.universe_domain,
};

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  storageBucket: process.env.STORAGE_BUCKET,
  databaseURL: process.env.DATABASE_URL,
});

// Function to get Firestore instance with optional database name
export function getFirestoreRef(databaseName?: string) {
  if (databaseName) {
    return getFirestore(firebaseAdmin, databaseName);
  }
  return admin.firestore(firebaseAdmin);
}

export default firebaseAdmin;