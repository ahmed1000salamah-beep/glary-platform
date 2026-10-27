import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Download, 
  Printer, 
  ExternalLink, 
  FileText, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileCheck,
  Sparkles,
  Info,
  Upload,
  FileUp,
  Loader2
} from 'lucide-react';
import { StudyMaterial } from '../../types';
import { storageService } from '../../services/storage';
import { apiService } from '../../services/api';

interface MaterialPreviewModalProps {
  material: StudyMaterial | null;
  onClose: () => void;
  onSendToast?: (title: string, body: string) => void;
}

export const MaterialPreviewModal: React.FC<MaterialPreviewModalProps> = ({
  material,
  onClose,
  onSendToast
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [isImage, setIsImage] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!material) {
      setBlobUrl(null);
      return;
    }

    setZoomLevel(100);
    setRotation(0);

    let objectUrlToRevoke: string | null = null;

    // Check if we have fileDataUrl (Base64) or fileUrl
    if (material.fileDataUrl && material.fileDataUrl.startsWith('data:')) {
      const mimeMatch = material.fileDataUrl.match(/^data:([^;]+);/);
      const mime = mimeMatch ? mimeMatch[1].toLowerCase() : '';
      const isPdfMime = mime.includes('pdf') || (material.fileName && material.fileName.toLowerCase().endsWith('.pdf'));
      const isImgMime = mime.startsWith('image/') || (material.fileName && /\.(png|jpe?g|webp|gif)$/i.test(material.fileName));

      setIsPdf(!isImgMime);
      setIsImage(Boolean(isImgMime));

      try {
        const base64Data = material.fileDataUrl.split(',')[1];
        const byteChars = atob(base64Data);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mime || 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setBlobUrl(url);
        objectUrlToRevoke = url;
      } catch (err) {
        console.warn('Could not create blob from base64, using raw data url', err);
        setBlobUrl(material.fileDataUrl);
      }
    } else if (material.fileUrl && !material.fileUrl.includes('tracemonkey') && !material.fileUrl.includes('mozilla.github.io')) {
      let url = material.fileUrl.trim();

      // Normalize download URL to inline static upload URL for iframe viewer
      if (url.startsWith('/api/materials/download/')) {
        url = url.replace('/api/materials/download/', '/uploads/');
      }

      let isDrive = false;
      if (url.includes('drive.google.com')) {
        isDrive = true;
        const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
        if (match && match[1]) {
          url = `https://drive.google.com/file/d/${match[1]}/preview`;
        }
      }

      const isImgUrl = /\.(png|jpe?g|webp|gif)$/i.test(url) || (material.fileName && /\.(png|jpe?g|webp|gif)$/i.test(material.fileName));
      const isPdfUrl = isDrive || !isImgUrl;

      setIsPdf(Boolean(isPdfUrl));
      setIsImage(Boolean(isImgUrl));
      setBlobUrl(url);
    } else {
      setIsPdf(false);
      setIsImage(false);
      setBlobUrl(null);
    }

    return () => {
      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    };
  }, [material]);

  const handleUploadFileForMaterial = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !material) return;

    setIsUploadingFile(true);
    const reader = new FileReader();
    reader.onerror = () => {
      setIsUploadingFile(false);
      alert('تعذر قراءة ملف المذكرة.');
    };
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        const res = await fetch('/api/materials/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileBase64: base64Data,
            mimeType: file.type || 'application/pdf'
          })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            const finalUrl = resData.fileUrl || resData.downloadUrl;
            storageService.updateMaterial(material.id, {
              fileUrl: finalUrl,
              fileName: file.name,
              fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            });
            apiService.syncData({ materials: storageService.getMaterials() }).catch(() => {});

            const isImg = /\.(png|jpe?g|webp|gif)$/i.test(file.name);
            setIsPdf(!isImg);
            setIsImage(isImg);
            setBlobUrl(finalUrl);
            onSendToast?.('تم رفع المذكرة بنجاح 📑', `تم إرفاق ملف المذكرة الأصلي (${file.name}) وعرضه مباشرة.`);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
      } finally {
        setIsUploadingFile(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!material) return null;

  // Real download handler
  const handleDownload = () => {
    try {
      const safeFileName = material.fileName || `${material.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

      // 1. External Link (Google Drive / Online PDF)
      if (material.fileUrl && material.fileUrl.startsWith('http')) {
        window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
        onSendToast?.(
          'فتح المذكرة 📥',
          `جاري فتح رابط المذكرة (${safeFileName}) للتحميل والمشاهدة.`
        );
        return;
      }

      // 2. Direct Server URL
      if (material.fileUrl && (material.fileUrl.startsWith('/uploads/') || material.fileUrl.startsWith('/api/'))) {
        const downloadLink = material.fileUrl.startsWith('/uploads/')
          ? `/api/materials/download/${material.fileUrl.replace('/uploads/', '')}`
          : material.fileUrl;

        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        onSendToast?.(
          'جاري تنزيل المذكرة 📥',
          `جاري تنزيل ملف (${safeFileName}) على جهازك مباشرة.`
        );
        return;
      }

      // 2. Blob URL / Base64
      if (blobUrl) {
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        onSendToast?.(
          'تم تنزيل المذكرة بنجاح 📥',
          `تم حفظ ملف (${safeFileName}) على جهازك.`
        );
        return;
      }

      // 3. Fallback: Clean HTML document with actual note text
      const cleanHtml = generateCleanDocumentHtml(material);
      const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${material.title.replace(/[/\\?%*:|"<>]/g, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);

      onSendToast?.(
        'تم حفظ المذكرة 📥',
        `تم حفظ (${material.title}) على جهازك.`
      );
    } catch (e) {
      console.error('Download error:', e);
      onSendToast?.('تنبيه التحميل', 'حدث خطأ أثناء تحميل الملف، يرجى المحاولة ثانية.');
    }
  };

  // Print handler
  const handlePrint = () => {
    if (blobUrl && isPdf) {
      const printWin = window.open(blobUrl, '_blank');
      if (printWin) {
        printWin.focus();
      } else {
        window.print();
      }
    } else {
      const cleanHtml = generateCleanDocumentHtml(material);
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(cleanHtml);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      } else {
        window.print();
      }
    }
  };

  // Open in new tab
  const handleOpenNewTab = () => {
    if (material.fileUrl && material.fileUrl.startsWith('http')) {
      window.open(material.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    } else {
      const cleanHtml = generateCleanDocumentHtml(material);
      const blob = new Blob([cleanHtml], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-5xl h-[94vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-lg bg-blue-950 text-blue-300 border border-blue-800/60 text-[11px] font-bold">
                  {material.category || 'مذكرة معتمدة'}
                </span>
                <span className="text-[11px] text-slate-400 font-latin">
                  {material.gradeLevel}
                </span>
                {material.unit && (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-lg font-bold">
                    {material.unit}
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-extrabold text-white truncate mt-0.5">
                {material.title}
              </h2>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all"
              title="تنزيل الملف الأصلي على جهازك"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل المذكرة الأصلية</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              title="طباعة المذكرة"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden md:inline">طباعة</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all"
              title="فتح في نافذة كاملة"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950/80 hover:text-rose-400 border border-slate-700 text-slate-400 transition-all"
              title="إغلاق المعاينة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY (PREVIEW VIEWER) */}
        <div className="flex-1 bg-slate-950 overflow-hidden relative flex flex-col">
          {blobUrl ? (
            isPdf ? (
              /* REAL PDF EMBED VIEWER */
              <div className="flex-1 w-full h-full bg-slate-950 flex flex-col">
                <iframe
                  src={`${blobUrl}#toolbar=1&navpanes=0&view=FitH`}
                  title={material.title}
                  className="w-full h-full flex-1 border-none bg-slate-900"
                />
              </div>
            ) : isImage ? (
              /* REAL IMAGE VIEWER WITH ZOOM & ROTATE */
              <div className="flex-1 w-full h-full overflow-auto p-4 flex flex-col items-center justify-center bg-slate-950">
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-1.5 backdrop-blur-sm shadow-xl">
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(z + 25, 250))}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-200"
                    title="تكبير"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-300 px-2 font-latin">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(z - 25, 50))}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-200"
                    title="تصغير"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-slate-700 mx-1" />
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-200"
                    title="تدوير الصورة"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <img
                  src={blobUrl}
                  alt={material.title}
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease-out'
                  }}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
                />
              </div>
            ) : (
              /* GENERIC FILE EMBED OR FALLBACK */
              <div className="flex-1 w-full h-full flex flex-col">
                <iframe
                  src={blobUrl}
                  title={material.title}
                  className="w-full h-full flex-1 border-none bg-white"
                />
              </div>
            )
          ) : (
            /* CLEAN AUTHENTIC TEXT / STUDY SHEET PREVIEW (NO FAKE GRAMMAR TABLES) */
            <div className="flex-1 w-full h-full overflow-y-auto p-4 sm:p-8 bg-slate-950">
              <div className="max-w-3xl mx-auto space-y-6">
                
                {/* Official Header Banner */}
                <div className="bg-gradient-to-br from-blue-900/40 via-slate-900 to-indigo-950/40 border border-blue-800/50 rounded-3xl p-6 sm:p-8 text-center shadow-xl relative overflow-hidden">
                  <div className="inline-block bg-amber-500 text-slate-950 font-black text-xs px-3.5 py-1 rounded-full mb-3 shadow-md">
                    المذكرات والملازم المعتمدة 2026
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white mb-2 leading-relaxed">
                    {material.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-300 font-bold">
                    مستر أحمد المعاطي • خبير تدريس اللغة الإنجليزية للثانوية العامة
                  </p>
                </div>

                {/* Material Details Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <Info className="w-4 h-4 text-blue-400" />
                    <h3 className="font-bold text-white text-sm">بيانات وتفاصيل المذكرة</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">المرحلة الدراسية:</span>
                      <span className="font-bold text-white">{material.gradeLevel}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">التصنيف الأكاديمي:</span>
                      <span className="font-bold text-blue-400">{material.category}</span>
                    </div>
                    {material.unit && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">الوحدة المقررة:</span>
                        <span className="font-bold text-emerald-400">{material.unit}</span>
                      </div>
                    )}
                    {material.fileName && (
                      <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400">اسم الملف الأصلي:</span>
                        <span className="font-bold text-slate-200 font-latin truncate max-w-[150px]">{material.fileName}</span>
                      </div>
                    )}
                  </div>

                  {/* File Upload / Attach Section if file is missing */}
                  <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                        <FileUp className="w-4 h-4" />
                        <span>إرفاق / اختيار ملف المذكرة الأصلي (PDF أو صورة):</span>
                      </div>
                      <span className="text-[10px] text-amber-300">لم يتم ربط ملف أصلي بعد</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      اختر ملف المذكرة المعتمد من جهازك ليتم رفعه مباشرة وتفعيله في مشغل المذكرات لجميع الطلاب.
                    </p>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleUploadFileForMaterial}
                      accept="application/pdf,image/*"
                      className="hidden"
                    />

                    <button
                      type="button"
                      disabled={isUploadingFile}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      {isUploadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                          <span>جاري رفع ملف المذكرة وتفعيل العرض المباشر...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-950" />
                          <span>اضغط هنا لاختيار ملف المذكرة (PDF) وعرضه فوراً</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Real Description / Content uploaded by the teacher */}
                  <div className="pt-3">
                    <h4 className="text-xs font-bold text-slate-300 mb-2">محتوى المذكرة وملاحظات المستر:</h4>
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {material.description || 'تم رفع هذه المذكرة لطلاب مستر أحمد المعاطي.'}
                    </div>
                  </div>
                </div>

                {/* Call To Action */}
                <div className="p-5 rounded-2xl bg-blue-950/40 border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xs sm:text-sm">جاهز للتحميل والطباعة</h4>
                      <p className="text-[11px] text-slate-400">يمكنك حفظ نسخة دائمة على هاتفك أو جهاز الكمبيوتر</p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل النسخة الكاملة</span>
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2 font-latin">
            {material.fileName && <span>الملف: {material.fileName}</span>}
            {material.fileSize && <span>• الحجم: {material.fileSize}</span>}
          </div>
          <span className="text-[11px] text-slate-500">منصة مستر أحمد المعاطي التعليمية 2026</span>
        </div>

      </div>
    </div>
  );
};

// Helper to generate a clean, official HTML sheet for print/download without any dummy/fake tables
function generateCleanDocumentHtml(mat: StudyMaterial): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${mat.title} - مستر أحمد المعاطي</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body {
      font-family: 'Cairo', Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #0f172a;
      background: #f8fafc;
      line-height: 1.8;
    }
    .header {
      background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
      color: white;
      padding: 30px;
      border-radius: 16px;
      margin-bottom: 25px;
      text-align: center;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
    }
    .badge {
      display: inline-block;
      background: #f59e0b;
      color: #0f172a;
      padding: 4px 14px;
      border-radius: 20px;
      font-weight: 800;
      font-size: 13px;
      margin-bottom: 12px;
    }
    h1 { margin: 0 0 10px; font-size: 24px; }
    .teacher { font-size: 15px; color: #93c5fd; font-weight: 600; }
    .card {
      background: white;
      padding: 24px;
      border-radius: 14px;
      margin-bottom: 20px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .card h2 {
      color: #1e3a8a;
      font-size: 18px;
      border-bottom: 2px solid #3b82f6;
      padding-bottom: 8px;
      margin-top: 0;
    }
    .callout {
      background: #eff6ff;
      border-right: 4px solid #3b82f6;
      padding: 14px;
      border-radius: 8px;
      margin: 15px 0;
      font-weight: 600;
      color: #1e3a8a;
    }
    .content-box {
      font-size: 15px;
      line-height: 2;
      color: #1e293b;
      white-space: pre-wrap;
      background: #f8fafc;
      padding: 16px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .footer {
      text-align: center;
      font-size: 12px;
      color: #64748b;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #cbd5e1;
    }
    @media print {
      body { padding: 10px; background: white; }
      .header { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="badge">المذكرات والملازم المعتمدة 2026</div>
    <h1>${mat.title}</h1>
    <div class="teacher">مستر أحمد المعاطي • خبير تدريس اللغة الإنجليزية للثانوية العامة</div>
  </div>

  <div class="card">
    <h2>📌 بيانات المذكرة والمحتوى الأكاديمي</h2>
    <div class="callout">
      المرحلة: <strong>${mat.gradeLevel}</strong> | التصنيف الأكاديمي: <strong>${mat.category}</strong> ${mat.unit ? `| الوحدة: <strong>${mat.unit}</strong>` : ''}
    </div>
    <h2>📖 محتوى المذكرة وملاحظات الشرح</h2>
    <div class="content-box">${mat.description || 'مذكرة دراسية معتمدة من منصة مستر أحمد المعاطي.'}</div>
  </div>

  <div class="footer">
    تم استخراج هذه النسخة الإلكترونية رسمياً من منصة مستر أحمد المعاطي التعليمية • جميع الحقوق محفوظة 2026
  </div>
</body>
</html>`;
}
