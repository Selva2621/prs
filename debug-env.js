require('dotenv').config();

console.log('Environment variables check:');
console.log('FIREBASE_PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
console.log('FIREBASE_CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
console.log('FIREBASE_PRIVATE_KEY length:', process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.length : 'undefined');

if (process.env.FIREBASE_PRIVATE_KEY) {
    console.log('\n=== PRIVATE KEY CONTENT ===');
    console.log(process.env.FIREBASE_PRIVATE_KEY);
    console.log('=== END PRIVATE KEY ===\n');

    // Check if it starts and ends with quotes
    const startsWithQuote = process.env.FIREBASE_PRIVATE_KEY.startsWith('"');
    const endsWithQuote = process.env.FIREBASE_PRIVATE_KEY.endsWith('"');
    console.log('Starts with quote:', startsWithQuote);
    console.log('Ends with quote:', endsWithQuote);

    // Check for newlines
    const hasNewlines = process.env.FIREBASE_PRIVATE_KEY.includes('\n');
    console.log('Contains newlines:', hasNewlines);

    // Count newlines
    const newlineCount = (process.env.FIREBASE_PRIVATE_KEY.match(/\n/g) || []).length;
    console.log('Number of newlines:', newlineCount);

    // Show first and last lines
    const lines = process.env.FIREBASE_PRIVATE_KEY.split('\n');
    console.log('First line:', lines[0]);
    console.log('Last line:', lines[lines.length - 1]);
} 