import JSZip from 'jszip';
import type { SarvamAI } from 'sarvamai';
import { createSarvamClient } from './sarvamClient';
import { SarvamDocumentProcessingError, SarvamUnsupportedDocumentError } from './sarvamErrors';

export type SarvamDocumentDigitizationResult = {
  jobId: string;
  extractedText: string;
  status: SarvamAI.DocDigitizationJobStatusResponse;
};

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'application/zip',
]);

const inferMimeType = (input: File | Blob | string): string => {
  if (typeof input === 'string') {
    const mimeMatch = input.match(/^data:([^;]+);base64,/i);
    return mimeMatch?.[1]?.toLowerCase() || '';
  }

  return (input as File).type?.toLowerCase() || '';
};

const isSupportedDocument = (input: File | Blob | string): boolean => {
  const mime = inferMimeType(input);
  if (SUPPORTED_MIME_TYPES.has(mime)) return true;

  // TODO: Sarvam document digitization currently exposes official SDK jobs for PDF/ZIP inputs.
  // TODO: Add a preprocessing pipeline if image or DOC/DOCX support is required.
  return false;
};

const toBlob = async (input: File | Blob | string): Promise<Blob> => {
  if (input instanceof Blob) return input;

  if (typeof input === 'string') {
    const response = await fetch(input);
    return await response.blob();
  }

  return input;
};

const readZipPayloadText = async (payload: ArrayBuffer): Promise<string> => {
  try {
    const zip = await JSZip.loadAsync(payload);
    const fileNames = Object.keys(zip.files).filter((name) => !zip.files[name].dir);

    const orderedFiles = fileNames.sort((left, right) => {
      const leftScore = left.toLowerCase().endsWith('.json') ? 0 : left.toLowerCase().endsWith('.md') ? 1 : left.toLowerCase().endsWith('.html') ? 2 : 3;
      const rightScore = right.toLowerCase().endsWith('.json') ? 0 : right.toLowerCase().endsWith('.md') ? 1 : right.toLowerCase().endsWith('.html') ? 2 : 3;
      return leftScore - rightScore;
    });

    const chunks: string[] = [];

    for (const fileName of orderedFiles) {
      const file = zip.files[fileName];
      const text = await file.async('string');

      if (fileName.toLowerCase().endsWith('.json')) {
        try {
          const parsed = JSON.parse(text);
          chunks.push(JSON.stringify(parsed, null, 2));
          continue;
        } catch {
          // fall through to raw content
        }
      }

      chunks.push(text);
    }

    return chunks.join('\n\n');
  } catch {
    return new TextDecoder().decode(payload);
  }
};

export class SarvamDocumentService {
  static async digitizeDocument(input: File | Blob | string, language?: SarvamAI.DocDigitizationSupportedLanguage): Promise<SarvamDocumentDigitizationResult> {
    if (!isSupportedDocument(input)) {
      throw new SarvamUnsupportedDocumentError(
        'Sarvam document digitization supports PDF/ZIP inputs in the official SDK. TODO: add a preprocessing pipeline for image and DOC/DOCX uploads.'
      );
    }

    const client = createSarvamClient();
    const job = await client.documentIntelligence.createJob({
      language,
      outputFormat: 'md',
    });

    const blob = await toBlob(input);
    await job.uploadFile(blob);
    const started = await job.start();
    const completed = await job.waitUntilComplete();

    if (completed.job_state !== 'Completed' && completed.job_state !== 'PartiallyCompleted') {
      throw new SarvamDocumentProcessingError(
        completed.error_message || `Document digitization failed with job state: ${completed.job_state}`
      );
    }

    const downloadLinks = await job.getDownloadLinks();
    const firstDownload = Object.values(downloadLinks.download_urls)[0];

    if (!firstDownload?.file_url) {
      throw new SarvamDocumentProcessingError('Sarvam document digitization completed, but no output file was returned.');
    }

    const downloadResponse = await fetch(firstDownload.file_url);
    if (!downloadResponse.ok) {
      throw new SarvamDocumentProcessingError(`Failed to download digitized output: ${downloadResponse.status}`);
    }

    const contentType = downloadResponse.headers.get('content-type') || '';
    const bytes = await downloadResponse.arrayBuffer();
    const extractedText = contentType.includes('zip') || firstDownload.file_url.toLowerCase().endsWith('.zip')
      ? await readZipPayloadText(bytes)
      : new TextDecoder().decode(bytes);

    return {
      jobId: started.job_id,
      extractedText,
      status: completed,
    };
  }

  static async extractTextFromSource(input: File | Blob | string, language?: SarvamAI.DocDigitizationSupportedLanguage): Promise<string> {
    const result = await this.digitizeDocument(input, language);
    return result.extractedText;
  }
}
