import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import type { RenderParameters } from 'pdfjs-dist/types/src/display/api';
import type { BankReceiptData } from '../types/expense';

// Configure PDF.js worker for Vite
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Custom error types for PDF/OCR operations
 */
export class PDFLoadError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PDFLoadError';
    this.cause = cause;
  }
}

export class PDFExtractionError extends Error {
  cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PDFExtractionError';
    this.cause = cause;
  }
}

/**
 * Convert PDF first page to canvas image data URL
 */
async function pdfToImageDataURL(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  // Get first page
  const page = await pdf.getPage(1);

  // Create canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Failed to get canvas context');
  }

  // Set scale for better OCR quality
  const scale = 2.0;
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // Render PDF page to canvas
  await page.render({
    canvasContext: context,
    viewport: viewport,
  } as RenderParameters).promise;

  // Clean up
  await pdf.destroy();

  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Extract text from image or PDF using Tesseract OCR
 */
async function extractTextWithOCR(file: File): Promise<string> {
  const worker = await createWorker('eng');

  try {
    let imageSource: string | File = file;

    // If it's a PDF, convert to image first
    if (file.type === 'application/pdf') {
      imageSource = await pdfToImageDataURL(file);
    }

    const { data: { text } } = await worker.recognize(imageSource);
    return text;
  } finally {
    await worker.terminate();
  }
}

/**
 * Extract a field from text using a regex pattern
 */
function extractField(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match?.[1]?.trim();
}

/**
 * Parse bank receipt data from extracted text
 */
function parseBankReceiptText(text: string): BankReceiptData {
  // Common patterns for bank receipt fields (English and Swedish)
  const receiptData: BankReceiptData = {
    from: extractField(text, /FROM[:\s]+([^\n]+)/i) ||
          extractField(text, /Sender[:\s]+([^\n]+)/i) ||
          extractField(text, /Payer[:\s]+([^\n]+)/i) ||
          extractField(text, /Från[:\s]+([^\n]+)/i), // Swedish

    to: extractField(text, /TO[:\s]+([^\n]+)/i) ||
        extractField(text, /Recipient[:\s]+([^\n]+)/i) ||
        extractField(text, /Payee[:\s]+([^\n]+)/i) ||
        extractField(text, /Merchant[:\s]+([^\n]+)/i) ||
        extractField(text, /Till[:\s]+([^\n]+)/i) || // Swedish
        extractField(text, /Mottagare[:\s]+([^\n]+)/i), // Swedish

    amount: extractField(text, /AMOUNT[:\s]+\$?([0-9,\s]+\.?[0-9]*)/i) ||
            extractField(text, /Total[:\s]+\$?([0-9,\s]+\.?[0-9]*)/i) ||
            extractField(text, /Belopp[:\s]+([0-9,\s]+[.,]?[0-9]*)/i) || // Swedish
            extractField(text, /([0-9\s]+[.,][0-9]{2})\s*kr/i) || // Swedish currency format
            extractField(text, /\$?\s*([0-9,\s]+\.[0-9]{2})/),

    transactionType: extractField(text, /TRANSACTION TYPE[:\s]+([^\n]+)/i) ||
                     extractField(text, /Type[:\s]+([^\n]+)/i) ||
                     extractField(text, /Payment Method[:\s]+([^\n]+)/i) ||
                     extractField(text, /Transaktionstyp[:\s]+([^\n]+)/i) || // Swedish
                     extractField(text, /Typ[:\s]+([^\n]+)/i), // Swedish

    date: extractField(text, /DATE[:\s]+([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i) ||
          extractField(text, /Transaction Date[:\s]+([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i) ||
          extractField(text, /Datum[:\s]+([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/i) || // Swedish
          extractField(text, /([0-9]{4}[-\/][0-9]{1,2}[-\/][0-9]{1,2})/) || // YYYY-MM-DD
          extractField(text, /([0-9]{1,2}[-\/][0-9]{1,2}[-\/][0-9]{2,4})/),
  };

  return receiptData;
}

/**
 * Extract text and parse bank receipt data from a PDF/image file using OCR
 */
export async function parseBankReceiptPDF(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  data?: BankReceiptData;
  rawText?: string;
  error?: string;
}> {
  try {
    // Validate file type
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      throw new PDFLoadError('Invalid file type. Please upload a PDF or image file.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new PDFLoadError('File size exceeds 10MB limit.');
    }

    // Validate file is not empty
    if (file.size === 0) {
      throw new PDFLoadError('File is empty.');
    }

    // Extract text using OCR
    onProgress?.(10);
    const fullText = await extractTextWithOCR(file);
    onProgress?.(90);

    // Validate extracted text
    if (fullText.trim().length === 0) {
      throw new PDFExtractionError(
        'No text content found. The image might be too blurry or low quality.'
      );
    }

    // Parse bank receipt data
    const data = parseBankReceiptText(fullText);
    onProgress?.(100);

    return {
      success: true,
      data,
      rawText: fullText,
    };

  } catch (err) {
    // Handle different error types
    if (err instanceof PDFLoadError || err instanceof PDFExtractionError) {
      return {
        success: false,
        error: err.message,
      };
    }

    // Handle unknown errors
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    console.error('PDF/OCR processing error:', err);
    return {
      success: false,
      error: `Failed to process file: ${errorMessage}`,
    };
  }
}

/**
 * Simple text extraction from PDF/image using OCR
 */
export async function extractPDFText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{
  success: boolean;
  text?: string;
  error?: string;
}> {
  try {
    // Validate file
    if (!file.type.includes('pdf') && !file.type.includes('image')) {
      throw new PDFLoadError('Invalid file type. Please upload a PDF or image file.');
    }

    if (file.size > 10 * 1024 * 1024) {
      throw new PDFLoadError('File size exceeds 10MB limit.');
    }

    // Extract text using OCR
    onProgress?.(10);
    const text = await extractTextWithOCR(file);
    onProgress?.(100);

    if (text.trim().length === 0) {
      throw new PDFExtractionError('No text content found.');
    }

    return {
      success: true,
      text,
    };

  } catch (err) {
    if (err instanceof PDFLoadError || err instanceof PDFExtractionError) {
      return { success: false, error: err.message };
    }

    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return { success: false, error: `Failed to extract text: ${errorMessage}` };
  }
}
