import formidable from 'formidable';
import * as fs from 'fs';
import { NextApiRequest, NextApiResponse } from 'next';
import { Readable } from 'stream';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Define proper types for the form parsing result
interface FormidableResult {
  fields: formidable.Fields;
  files: {
    files: formidable.File | formidable.File[];
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
      maxTotalFileSize: 200 * 1024 * 1024, // 200MB limit
      filter: (part) => {
        return part.mimetype === 'text/csv';
      },
    });

    // Properly type the form.parse result
    const { files } = await new Promise<FormidableResult>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files: files as FormidableResult['files'] });
      });
    });

    if (!files || !files.files) {
      return res.status(400).json({ message: "No files provided." });
    }

    const fileArray: formidable.File[] = Array.isArray(files.files)
      ? files.files
      : [files.files];

    if (fileArray.length === 0) {
      return res.status(400).json({ message: "No files provided." });
    }

    const mergedStream = new Readable({
      read() {}
    });

    let isFirstFile = true;
    let headerLine: string | null = null;

    for (const file of fileArray) {
      // Validate file extension
      if (path.extname(file.originalFilename || '') !== '.csv') {
        return res.status(400).json({ message: "Only CSV files are allowed." });
      }

      const fileStream = fs.createReadStream(file.filepath, { encoding: 'utf8' });

      for await (const chunk of fileStream) {
        const lines = chunk.split('\n');
        
        if (isFirstFile) {
          headerLine = lines[0];
          mergedStream.push(headerLine + '\n');
          isFirstFile = false;
        } else if (headerLine) {
          // Validate that all files have the same header structure
          if (lines[0] !== headerLine) {
            return res.status(400).json({ 
              message: "All CSV files must have the same header structure." 
            });
          }
        }

        mergedStream.push(lines.slice(1).join('\n') + '\n');
      }

      // Cleanup: Delete the temporary file after processing
      fs.unlink(file.filepath, (err) => {
        if (err) console.error('Error deleting temporary file:', err);
      });
    }

    mergedStream.push(null);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="merged.csv"');

    mergedStream.pipe(res);

  } catch (error) {
    console.error("Error merging files:", error);
    res.status(500).json({ message: 'An error occurred during merging.' });
  }
}