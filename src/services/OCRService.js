import { Platform } from 'react-native';
import Groq from 'groq-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

// --- SCAN LIMITS ---
const FREE_DAILY_LIMIT = 3;
const PREMIUM_DAILY_LIMIT = 10;

/**
 * Get current scan count for today
 */
export async function getDailyScanCount() {
    try {
        const key = `scanCount_${new Date().toISOString().split('T')[0]}`;
        const raw = await AsyncStorage.getItem(key);
        return raw ? parseInt(raw, 10) : 0;
    } catch (e) {
        return 0;
    }
}

/**
 * Increment today's scan count
 */
export async function incrementScanCount() {
    try {
        const key = `scanCount_${new Date().toISOString().split('T')[0]}`;
        const current = await getDailyScanCount();
        await AsyncStorage.setItem(key, String(current + 1));
    } catch (e) {
        console.error('Failed to increment scan count:', e);
    }
}

/**
 * Get the daily limit based on premium status
 */
export function getDailyLimit(isPremium) {
    return isPremium ? PREMIUM_DAILY_LIMIT : FREE_DAILY_LIMIT;
}

// Initialize Groq client
const groq = new Groq({
    apiKey: GROQ_API_KEY,
    dangerouslyAllowBrowser: true, // Required for React Native / Expo
    maxRetries: 2,
});

/**
 * Call Groq Llama Vision API for text detection and parsing
 * @param {string} base64Image - The base64 string directly from expo-image-picker
 */
export async function scanReceipt(base64Image) {
    if (!base64Image) {
        throw new Error("No image data provided for scanning.");
    }

    try {
        console.log('📤 Sending image to Groq Vision Model (meta-llama/llama-4-scout-17b-16e-instruct)...');

        const prompt = `
        You are an expert receipt parser. Analyze the provided receipt image and extract the following information.
        Return ONLY a valid JSON object. Do not include any markdown formatting like \`\`\`json.
        
        Required JSON format:
        {
          "merchant": "Store Name (or 'Unknown Merchant' if not found)",
          "date": "YYYY-MM-DD (or null if not found)",
          "total": 123.45 (extract the final total amount as a number, or null),
          "items": [
            {"name": "Item Description", "price": 12.34}
          ]
        }
        
        Rules:
        - Identify the total amount strictly (look for 'Total', 'Amount Due', 'Balance').
        - Exclude taxes from item prices if possible, or include them as separate items.
        - Ensure the response is pure JSON, parseable by JSON.parse().
        `;

        const chatCompletion = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            response_format: { type: "json_object" }, // Force JSON output
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: prompt },
                        {
                            type: "image_url",
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_completion_tokens: 1024,
        });

        const responseText = chatCompletion.choices[0].message.content;
        console.log('✅ Groq response received:', responseText);

        // Clean the response (Groq might still return markdown blocks despite instructions)
        const cleanedJson = responseText.replace(/```json\n?|\n?```/gi, '').trim();

        // Find the first { and last } to ensure valid JSON parsing
        const startIndex = cleanedJson.indexOf('{');
        const endIndex = cleanedJson.lastIndexOf('}');

        if (startIndex === -1 || endIndex === -1) {
            throw new Error("Groq did not return a valid JSON object.");
        }

        const jsonString = cleanedJson.substring(startIndex, endIndex + 1);
        const parsedData = JSON.parse(jsonString);

        return {
            rawText: Object.keys(parsedData).length > 0 ? 'Groq Vision parsed successfully.' : '',
            merchant: parsedData.merchant || 'Unknown Merchant',
            total: typeof parsedData.total === 'number' ? parsedData.total : parseFloat(parsedData.total) || 0,
            date: parsedData.date || null,
            items: parsedData.items || [],
        };

    } catch (error) {
        console.error('❌ Groq Vision Error:', error);

        // Provide friendly error messages for common API errors
        if (error.status === 429) {
            throw new Error("Rate limit exceeded. Please try again in a moment.");
        } else if (error.status === 401) {
            throw new Error("Invalid Groq API Key.");
        }

        throw new Error(error.message || "Failed to parse image with Groq.");
    }
}
