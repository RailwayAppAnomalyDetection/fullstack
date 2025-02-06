import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'ファイルがありません。' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filePath = path.join(process.cwd(), 'public', 'uploads', file.name);

  try {
    await fs.promises.writeFile(filePath, buffer);
    return NextResponse.json({ message: 'ファイルのアップロードに成功しました。' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'ファイルの保存中にエラーが発生しました。' }, { status: 500 });
  }
}