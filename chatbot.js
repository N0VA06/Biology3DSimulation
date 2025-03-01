// server.js
import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url'; // Added to convert URL to path
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Get the current directory path using import.meta.url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to read image as base64
async function fileToGenerativePart(filePath, mimeType) {
  const fileBuffer = await fs.promises.readFile(filePath);
  return {
    inlineData: {
      data: fileBuffer.toString('base64'),
      mimeType
    }
  };
}

// API route for chat
app.post('/api/chat', upload.single('image'), async (req, res) => {
  try {
    const messageText = req.body.message || '';
    
    // Always use Gemini 1.5 Flash model for both text and images
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are now activated in Child Safety Mode. Your role is to provide only safe, educational, and positive content. You will avoid any harmful, inappropriate, or sensitive topics. The user is Rahul, a 15-year-old male.'
  });
    
    let result;
    
    if (req.file) {
      // If there's an image, include it in the request
      const imagePath = req.file.path;
      const imagePart = await fileToGenerativePart(
        imagePath, 
        req.file.mimetype
      );
      
      // Create content parts with text and image
      const parts = [];
      if (messageText) {
        parts.push({ text: messageText });
      }
      parts.push(imagePart);
      
      // Generate content
      result = await model.generateContent({
        contents: [{ parts }]
      });
    } else {
      // If there's only text, just send the text to the model
      result = await model.generateContent(messageText);
    }
    
    const response = result.response.text();
    
    // Clean up the uploaded file if it exists
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    res.json({ response });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Send a more descriptive error message
    let errorMessage = 'An error occurred while processing your request';
    if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});