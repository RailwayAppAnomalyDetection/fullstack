"use client";

import { useState } from 'react';

const UploadPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setUploadStatus('ファイルを選択してください。');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadStatus('ファイルのアップロードに成功しました。');
      } else {
        setUploadStatus('ファイルのアップロードに失敗しました。');
      }
    } catch (error) {
      setUploadStatus('ファイルのアップロード中にエラーが発生しました。');
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">データアップロード</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
      <button onClick={handleUpload} className="bg-blue-500 text-white px-4 py-2 rounded">
        アップロード
      </button>
      {uploadStatus && <p className="mt-4">{uploadStatus}</p>}
    </div>
  );
};

export default UploadPage;