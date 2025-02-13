"use client"
import { useState, ChangeEvent, FormEvent } from 'react';

interface FileMergerProps {}

const FileMerger: React.FC<FileMergerProps> = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mergedFile, setMergedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      
      const invalidFiles = files.filter(file => file.type !== 'text/csv');
      if (invalidFiles.length > 0) {
        setError('Please select only CSV files.');
        return;
      }
      
      setSelectedFiles(files);
      setError(null);
    }
  };

  const handleMerge = async (event: FormEvent) => {
    event.preventDefault();

    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const response = await fetch('/api/merge', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error merging files.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      setMergedFile(url);

    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during merging.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <form onSubmit={handleMerge} className="space-y-4">
        <div>
          <label 
            htmlFor="file-upload" 
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Select CSV Files
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <button
          type="submit"
          disabled={selectedFiles.length === 0 || isLoading}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md
            hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Merging...' : 'Merge Files'}
        </button>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}
        
        {mergedFile && (
          <a
            href={mergedFile}
            download="merged.csv"
            className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-green-600 
              rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
              focus:ring-green-500 transition-colors"
          >
            Download Merged File
          </a>
        )}
      </form>
    </div>
  );
};

export default FileMerger;