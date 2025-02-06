import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'public', 'uploads', 'output_select.csv');

  try {
    const fileContent = await fs.promises.readFile(filePath, 'utf-8');
    return new NextResponse(fileContent, { status: 200 });
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ error: 'ファイルの読み込み中にエラーが発生しました。' }),
      { status: 500 }
    );
  }
}