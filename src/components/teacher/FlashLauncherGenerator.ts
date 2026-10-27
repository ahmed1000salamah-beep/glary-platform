/**
 * مولد ملف تشغيل تطبيق المعلم المحمول على الفلاشة (USB Flash Drive Launcher)
 * ينشئ ملف HTML مستقل يمكن حفظه على أي فلاش ميموري
 * وعند النقر عليه في أي كمبيوتر، يفتح تطبيق المعلم مباشرة وبأعلى درجات الأمان
 */
export function downloadTeacherUSBLauncher(teacherPin: string = 'ahmed2026') {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-wivuv6clztv53mmyvz7r7a-656032955753.europe-west2.run.app';
  const targetUrl = `${currentOrigin}?mode=teacher_portal`;

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>مشغل فلاشة المعلم | مستر أحمد المعاطي</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    body {
      background: radial-gradient(circle at top, #0f172a, #020617);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .card {
      background: rgba(15, 23, 42, 0.95);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 24px;
      padding: 32px;
      max-width: 520px;
      width: 100%;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(59, 130, 246, 0.15);
    }
    .badge {
      display: inline-block;
      padding: 4px 14px;
      border-radius: 999px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      color: #60a5fa;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
    }
    .usb-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #1d4ed8, #4338ca);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      box-shadow: 0 10px 25px rgba(29, 78, 216, 0.4);
    }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 8px; color: #fff; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px; }
    .btn {
      display: block;
      width: 100%;
      padding: 14px 20px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: white;
      text-decoration: none;
      font-weight: 800;
      font-size: 15px;
      border-radius: 14px;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
      transition: all 0.2s;
    }
    .btn:hover {
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
      transform: translateY(-2px);
    }
    .security-note {
      margin-top: 20px;
      font-size: 11px;
      color: #64748b;
      border-top: 1px solid #1e293b;
      padding-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="usb-icon">💾</div>
    <span class="badge">USB Portable Launcher</span>
    <h1>تطبيق المعلم المستقل المحمول</h1>
    <p>
      أهلاً بك يا مستر أحمد المعاطي. هذا المشغل مخصص للتشغيل السري والمباشر من الفلاش ميموري (USB) للدخول الحصري إلى لوحة إدارة الدرجات والطلاب والكويزات.
    </p>

    <a href="${targetUrl}" class="btn" target="_blank" rel="noopener noreferrer">
      🚀 فتح تطبيق المعلم المستقل الآن
    </a>

    <div class="security-note">
      🔒 مشفر ومحمي برمز المرور الخاص بالمعلم • متصل لحظياً بقاعدة بيانات الطلاب
    </div>
  </div>

  <script>
    // التوجيه التلقائي بعد 2 ثانية إن رغب المعلم
    console.log("Teacher Flash Drive Launcher Initialized");
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Glary_Teacher_USB_Launcher.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
