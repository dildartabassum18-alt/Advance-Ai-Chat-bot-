// This file depends on global libraries loaded from CDN in index.html
// pdfjsLib, mammoth, XLSX

declare const pdfjsLib: any;
declare const mammoth: any;
declare const XLSX: any;

function readFileWithProgress(file: File, method: 'readAsText' | 'readAsArrayBuffer', onProgress: (percent: number) => void): Promise<string | ArrayBuffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentLoaded = Math.round((event.loaded / event.total) * 100);
                onProgress(percentLoaded);
            }
        };
        reader.onload = () => {
            onProgress(100); // Ensure it completes at 100%
            resolve(reader.result!);
        };
        reader.onerror = reject;
        
        if (method === 'readAsText') {
            reader.readAsText(file);
        } else {
            reader.readAsArrayBuffer(file);
        }
    });
}


export async function parseFile(file: File, onProgress: (percent: number) => void): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    switch (extension) {
        case 'txt':
            return parseTxt(file, onProgress);
        case 'pdf':
            return parsePdf(file, onProgress);
        case 'docx':
            return parseDocx(file, onProgress);
        case 'xlsx':
            return parseXlsx(file, onProgress);
        default:
            throw new Error(`Unsupported file type: .${extension}`);
    }
}

async function parseTxt(file: File, onProgress: (percent: number) => void): Promise<string> {
    return await readFileWithProgress(file, 'readAsText', onProgress) as string;
}

async function parsePdf(file: File, onProgress: (percent: number) => void): Promise<string> {
    const arrayBuffer = await readFileWithProgress(file, 'readAsArrayBuffer', onProgress) as ArrayBuffer;
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let textContent = '';
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map((s: any) => s.str).join(' ');
    }
    return textContent;
}

async function parseDocx(file: File, onProgress: (percent: number) => void): Promise<string> {
    const arrayBuffer = await readFileWithProgress(file, 'readAsArrayBuffer', onProgress) as ArrayBuffer;
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
}

async function parseXlsx(file: File, onProgress: (percent: number) => void): Promise<string> {
    const arrayBuffer = await readFileWithProgress(file, 'readAsArrayBuffer', onProgress) as ArrayBuffer;
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let content = '';
    workbook.SheetNames.forEach((sheetName: string) => {
        content += `Sheet: ${sheetName}\n`;
        const worksheet = workbook.Sheets[sheetName];
        const json: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        json.forEach(row => {
            content += row.join(', ') + '\n';
        });
        content += '\n';
    });
    return content;
}
