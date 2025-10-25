import { useState, useCallback, useRef } from 'react';
import { parseBankReceiptPDF } from '../services/pdfParser';
import type { BankReceiptData } from '../types/expense';
import { parseDate, parseAmount } from '../utils/dateHelpers';

interface UsePDFUploadResult {
  uploading: boolean;
  error: string | null;
  parsedData: BankReceiptData | null;
  rawText: string | null;
  uploadPDF: (file: File) => Promise<void>;
  triggerFileInput: () => void;
  reset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

/**
 * Custom hook for handling PDF file upload and parsing
 */
export function usePDFUpload(): UsePDFUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<BankReceiptData | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPDF = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setParsedData(null);
    setRawText(null);

    try {
      const result = await parseBankReceiptPDF(file);

      if (result.success && result.data) {
        setParsedData(result.data);
        setRawText(result.rawText || null);
      } else {
        setError(result.error || 'Failed to parse PDF');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('PDF upload error:', err);
    } finally {
      setUploading(false);
    }
  }, []);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const reset = useCallback(() => {
    setUploading(false);
    setError(null);
    setParsedData(null);
    setRawText(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return {
    uploading,
    error,
    parsedData,
    rawText,
    uploadPDF,
    triggerFileInput,
    reset,
    fileInputRef,
  };
}

/**
 * Helper to convert parsed bank receipt data to expense format
 */
export function receiptDataToExpense(data: BankReceiptData) {
  const amount = data.amount ? parseAmount(data.amount) : null;
  const date = data.date ? parseDate(data.date) : null;

  return {
    amount: amount || 0,
    description: data.to || 'Unknown transaction',
    category: 'Other', // Default category, user should update
    date: date || new Date(),
    from: data.from,
    to: data.to,
    transactionType: data.transactionType,
  };
}
