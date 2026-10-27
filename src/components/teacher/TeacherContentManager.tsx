import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Video, 
  HelpCircle, 
  FileText, 
  PlusCircle, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Clock, 
  Award, 
  BookOpen, 
  ExternalLink, 
  Sparkles, 
  AlertCircle,
  Film,
  Layers,
  Calendar,
  X,
  MapPin,
  GraduationCap,
  Users,
  Upload,
  Link,
  Send,
  FileCheck,
  Download,
  AlertTriangle,
  Lock,
  ShieldCheck,
  User,
  Eye
} from 'lucide-react';
import { LessonVideo, OnlineQuizSession, StudyMaterial, Student } from '../../types';
import { storageService } from '../../services/storage';
import { StudentFuzzySearchAutocomplete } from '../common/StudentFuzzySearchAutocomplete';
import { MaterialPreviewModal } from '../materials/MaterialPreviewModal';

interface Props {
  onNotify: (title: string, body: string) => void;
  onHomeworkAssigned?: () => void;
}

export const TeacherContentManager: React.FC<Props> = ({ onNotify, onHomeworkAssigned }) => {
  // ==========================================
  // STEP 1: Branch Selection (كفر سعد ولا دمياط)
  // ==========================================
  const [selectedBranch, setSelectedBranch] = useState<'كفر سعد' | 'دمياط' | 'الكل'>('دمياط');

  // ==========================================
  // STEP 2: Grade Level Selection (صف إيه)
  // ==========================================
  const gradeOptions = [
    'الصف الثالث الثانوي',
    'الصف الثاني الثانوي',
    'الصف الأول الثانوي',
    'الشهادة الإعدادية (الصف الثالث الإعدادي)'
  ];
  const [selectedGrade, setSelectedGrade] = useState<string>('الصف الثالث الثانوي');

  // ==========================================
  // STEP 3: Group Selection (مجموعة إيه)
  // ==========================================
  const groupOptionsByGradeAndBranch: Record<string, string[]> = {
    'الصف الثالث الثانوي': [
      'جميع المجموعات (عام للدفعة كلها)',
      'مجموعة النخبة - الأحد والأربعاء (5:00 م)',
      'مجموعة المتفوقين - السبت والثلاثاء (3:00 م)',
      'مجموعة الجمعة المكثفة (9:00 ص)'
    ],
    'الصف الثاني الثانوي': [
      'جميع المجموعات (عام للدفعة كلها)',
      'مجموعة الأحد والأربعاء (3:00 م)',
      'مجموعة السبت والثلاثاء (5:00 م)'
    ],
    'الصف الأول الثانوي': [
      'جميع المجموعات (عام للدفعة كلها)',
      'مجموعة الإثنين والخميس (4:00 م)',
      'مجموعة الجمعة (1:00 م)'
    ],
    'الشهادة الإعدادية (الصف الثالث الإعدادي)': [
      'جميع المجموعات (عام للدفعة كلها)',
      'مجموعة الأوائل - السبت والثلاثاء (6:30 م)'
    ]
  };

  // Load all students for group matching and targeting
  const [allStudents, setAllStudents] = useState<Student[]>(() => storageService.getStudents());
  const [assignedHomeworks, setAssignedHomeworks] = useState(() => storageService.getAllAssignedHomeworks());

  useEffect(() => {
    const handleUpdate = () => {
      setAllStudents(storageService.getStudents());
      setAssignedHomeworks(storageService.getAllAssignedHomeworks());
      setVideos(storageService.getVideos());
      setQuizzes(storageService.getQuizzes());
      setMaterials(storageService.getMaterials());
    };
    window.addEventListener('glary_homework_assigned', handleUpdate);
    window.addEventListener('glary_storage_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('glary_homework_assigned', handleUpdate);
      window.removeEventListener('glary_storage_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Dynamic group options: standard options + actual groups from students of that grade
  const currentGroupOptions = useMemo(() => {
    const clean = (g?: string) => (g ? g.split('(')[0].trim().toLowerCase() : '');
    const baseGroups = groupOptionsByGradeAndBranch[selectedGrade] || ['جميع المجموعات (عام للدفعة كلها)'];
    const stdGroups = allStudents
      .filter((s) => !selectedGrade || clean(s.gradeLevel).includes(clean(selectedGrade)) || clean(selectedGrade).includes(clean(s.gradeLevel)))
      .map((s) => s.groupName)
      .filter(Boolean);
    return Array.from(new Set([...baseGroups, ...stdGroups]));
  }, [allStudents, selectedGrade]);

  const [selectedGroup, setSelectedGroup] = useState<string>('جميع المجموعات (عام للدفعة كلها)');
  const [targetScope, setTargetScope] = useState<'group' | 'student'>('group');
  const [targetStudent, setTargetStudent] = useState<Student | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<StudyMaterial | null>(null);

  // Count of students targeted by current scope
  const targetStudentsCount = useMemo(() => {
    if (targetScope === 'student') return targetStudent ? 1 : 0;
    const clean = (g?: string) => (g ? g.split('(')[0].trim().toLowerCase() : '');
    const targetGrade = clean(selectedGrade);
    const isAllGroups = !selectedGroup || selectedGroup === 'الكل' || selectedGroup.includes('جميع المجموعات');

    return allStudents.filter(st => {
      const matchBranch = !selectedBranch || selectedBranch === 'الكل' || st.branch === selectedBranch;
      const stGrade = clean(st.gradeLevel);
      const matchGrade = !selectedGrade || selectedGrade === 'الكل' || stGrade.includes(targetGrade) || targetGrade.includes(stGrade);
      const stGroup = (st.groupName || '').trim();
      const targetGrp = (selectedGroup || '').trim();
      const matchGroup = isAllGroups || stGroup === targetGrp || stGroup.includes(targetGrp) || targetGrp.includes(stGroup);
      return matchBranch && matchGrade && matchGroup;
    }).length;
  }, [allStudents, targetScope, targetStudent, selectedBranch, selectedGrade, selectedGroup]);

  // When grade changes, reset group to default
  const handleGradeChange = (grade: string) => {
    setSelectedGrade(grade);
    const groups = groupOptionsByGradeAndBranch[grade] || ['جميع المجموعات (عام للدفعة كلها)'];
    setSelectedGroup(groups[0]);
    setTargetStudent(null);
  };

  // ==========================================
  // STEP 4: Content Type to Upload (هيرفع إيه)
  // ==========================================
  // 1. video: من الجهاز أو رابط سحابي للمحاضرات الطويلة
  // 2. homework: نص بيوصل للطالب في خانة تكليفات وواجبات الأسبوع
  // 3. notes: مذكرات وملخصات بتترفع من الجهاز نفسه
  const [uploadType, setUploadType] = useState<'video' | 'homework' | 'notes'>('video');

  // Preview video modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Lists loaded from storage
  const [videos, setVideos] = useState<LessonVideo[]>(() => storageService.getVideos());
  const [materials, setMaterials] = useState<StudyMaterial[]>(() => storageService.getMaterials());

  // Filter mode for uploaded items at the bottom: 'current_group' (default) or 'all'
  const [filterScopeMode, setFilterScopeMode] = useState<'current_group' | 'all'>('current_group');

  // Normalization helper for accurate matching across grades and groups
  const normalize = (str?: string) => (str || '').replace(/[()]/g, '').trim().toLowerCase();

  // Dynamic filter for Videos based on selected group/grade/branch
  const displayedVideos = useMemo(() => {
    if (filterScopeMode === 'all') return videos;

    return videos.filter((vid) => {
      // 1. If target is a specific student
      if (targetScope === 'student' && targetStudent) {
        if (vid.targetStudentId && vid.targetStudentId === targetStudent.id) return true;
        if (vid.targetStudentCode && vid.targetStudentCode === targetStudent.code) return true;
        if (vid.groupName && (vid.groupName.includes(targetStudent.code) || vid.groupName.includes(targetStudent.fullName))) return true;
        return false;
      }

      // 2. Branch check
      if (selectedBranch !== 'الكل' && vid.branch && vid.branch !== 'الكل' && vid.branch !== selectedBranch) {
        return false;
      }

      // 3. Grade check
      if (selectedGrade && vid.gradeLevel) {
        const nSelGrade = normalize(selectedGrade);
        const nVidGrade = normalize(vid.gradeLevel);
        if (!nSelGrade.includes(nVidGrade) && !nVidGrade.includes(nSelGrade)) {
          return false;
        }
      }

      // 4. Group check
      const isAllGroupsSelected = !selectedGroup || selectedGroup === 'الكل' || selectedGroup.includes('جميع المجموعات') || selectedGroup.includes('عام للدفعة');
      if (isAllGroupsSelected) return true;

      const nVidGroup = normalize(vid.groupName);
      const nSelGroup = normalize(selectedGroup);
      const isGeneral = !vid.groupName || nVidGroup.includes('جميع المجموعات') || nVidGroup.includes('عام') || nVidGroup.includes('الكل');
      const isExact = nVidGroup === nSelGroup || nVidGroup.includes(nSelGroup) || nSelGroup.includes(nVidGroup);

      return isExact || isGeneral;
    });
  }, [videos, filterScopeMode, targetScope, targetStudent, selectedBranch, selectedGrade, selectedGroup]);

  // Dynamic filter for Homeworks based on selected group/grade/branch
  const displayedHomeworks = useMemo(() => {
    if (filterScopeMode === 'all') return assignedHomeworks;

    return assignedHomeworks.filter((hw) => {
      if (targetScope === 'student' && targetStudent) {
        return hw.studentNames?.some(name => name.includes(targetStudent.fullName) || targetStudent.fullName.includes(name));
      }

      if (selectedGrade && hw.assignedToGrade) {
        const nSelGrade = normalize(selectedGrade);
        const nHwGrade = normalize(hw.assignedToGrade);
        if (!nSelGrade.includes(nHwGrade) && !nHwGrade.includes(nSelGrade)) {
          return false;
        }
      }

      const isAllGroupsSelected = !selectedGroup || selectedGroup === 'الكل' || selectedGroup.includes('جميع المجموعات') || selectedGroup.includes('عام للدفعة');
      if (isAllGroupsSelected) return true;

      const nHwGroup = normalize(hw.assignedToGroup);
      const nSelGroup = normalize(selectedGroup);
      const isGeneral = !hw.assignedToGroup || nHwGroup.includes('جميع المجموعات') || nHwGroup.includes('عام للدفعة') || nHwGroup.includes('الكل');
      const isExact = nHwGroup === nSelGroup || nHwGroup.includes(nSelGroup) || nSelGroup.includes(nHwGroup);

      return isExact || isGeneral;
    });
  }, [assignedHomeworks, filterScopeMode, targetScope, targetStudent, selectedBranch, selectedGrade, selectedGroup]);

  // Dynamic filter for Materials based on selected group/grade/branch
  const displayedMaterials = useMemo(() => {
    if (filterScopeMode === 'all') return materials;

    return materials.filter((mat) => {
      if (targetScope === 'student' && targetStudent) {
        if (mat.targetStudentId && mat.targetStudentId === targetStudent.id) return true;
        if (mat.targetStudentCode && mat.targetStudentCode === targetStudent.code) return true;
        if (mat.groupName && (mat.groupName.includes(targetStudent.code) || mat.groupName.includes(targetStudent.fullName))) return true;
        return false;
      }

      if (selectedBranch !== 'الكل' && mat.branch && mat.branch !== 'الكل' && mat.branch !== selectedBranch) {
        return false;
      }

      if (selectedGrade && mat.gradeLevel) {
        const nSelGrade = normalize(selectedGrade);
        const nMatGrade = normalize(mat.gradeLevel);
        if (!nSelGrade.includes(nMatGrade) && !nMatGrade.includes(nSelGrade)) {
          return false;
        }
      }

      const isAllGroupsSelected = !selectedGroup || selectedGroup === 'الكل' || selectedGroup.includes('جميع المجموعات') || selectedGroup.includes('عام للدفعة');
      if (isAllGroupsSelected) return true;

      const nMatGroup = normalize(mat.groupName);
      const nSelGroup = normalize(selectedGroup);
      const isGeneral = !mat.groupName || nMatGroup.includes('جميع المجموعات') || nMatGroup.includes('عام') || nMatGroup.includes('الكل');
      const isExact = nMatGroup === nSelGroup || nMatGroup.includes(nSelGroup) || nSelGroup.includes(nMatGroup);

      return isExact || isGeneral;
    });
  }, [materials, filterScopeMode, targetScope, targetStudent, selectedBranch, selectedGrade, selectedGroup]);

  const totalDisplayedCount = displayedVideos.length + displayedHomeworks.length + displayedMaterials.length;
  const totalAllCount = videos.length + assignedHomeworks.length + materials.length;

  // ------------------------------------------
  // FORM 1: VIDEO (رفع من الجهاز أو رابط سحابي للمحاضرات الطويلة)
  // ------------------------------------------
  const [videoSourceMode, setVideoSourceMode] = useState<'upload' | 'cloud_link'>('upload');
  const [videoCloudUrl, setVideoCloudUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoLectureNumber, setVideoLectureNumber] = useState<number>(1);
  const [videoUnit, setVideoUnit] = useState('الوحدة الأولى (Unit 1)');
  const [videoDuration, setVideoDuration] = useState<number>(90);
  const [videoDescription, setVideoDescription] = useState('');
  const [selectedVideoFile, setSelectedVideoFile] = useState<File | null>(null);
  const [videoFilePreview, setVideoFilePreview] = useState<string>('');
  const [videoUploadProgress, setVideoUploadProgress] = useState<number>(0);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideoFile(file);
      const fakeUrl = URL.createObjectURL(file);
      setVideoFilePreview(fakeUrl);
      if (!videoTitle) {
        // Auto-fill title from clean filename
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setVideoTitle(cleanName);
      }
    }
  };

  const handleUploadVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim()) {
      alert('يرجى إدخال عنوان المحاضرة.');
      return;
    }
    if (videoSourceMode === 'upload' && !selectedVideoFile) {
      alert('يرجى اختيار ملف الفيديو من جهازك.');
      return;
    }
    if (videoSourceMode === 'cloud_link' && !videoCloudUrl.trim()) {
      alert('يرجى وضع رابط الفيديو السحابي (Google Drive أو YouTube غير مدرج أو رابط مباشر).');
      return;
    }
    if (targetScope === 'student' && !targetStudent) {
      alert('يرجى تحديد الطالب المستهدف عبر البحث والاقتراحات.');
      return;
    }

    setIsUploadingVideo(true);
    setVideoUploadProgress(20);

    // Simulate upload progress
    const timer = setInterval(() => {
      setVideoUploadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(timer);
          return 90;
        }
        return prev + 25;
      });
    }, 150);

    setTimeout(() => {
      clearInterval(timer);
      setVideoUploadProgress(100);

      const fileSizeMb = videoSourceMode === 'upload' && selectedVideoFile 
        ? (selectedVideoFile.size / (1024 * 1024)).toFixed(1) + ' MB'
        : 'محاضرة سحابية (HD)';
      
      const targetVideoUrl = videoSourceMode === 'cloud_link'
        ? videoCloudUrl.trim()
        : (videoFilePreview || 'https://www.w3schools.com/html/mov_bbb.mp4');

      const newVideo = storageService.addVideo({
        title: videoTitle.trim(),
        lectureNumber: Number(videoLectureNumber) || 1,
        gradeLevel: selectedGrade,
        branch: selectedBranch,
        groupName: targetScope === 'group' ? selectedGroup : `مخصص للطالب: ${targetStudent?.fullName}`,
        targetStudentId: targetScope === 'student' ? targetStudent?.id : undefined,
        targetStudentName: targetScope === 'student' ? targetStudent?.fullName : undefined,
        targetStudentCode: targetScope === 'student' ? targetStudent?.code : undefined,
        unit: videoUnit.trim() || 'الوحدة الأولى',
        durationMinutes: Number(videoDuration) || 90,
        fileName: videoSourceMode === 'upload' && selectedVideoFile ? selectedVideoFile.name : `${videoTitle.trim()} (سحابي)`,
        fileSize: fileSizeMb,
        videoUrl: targetVideoUrl,
        description: videoDescription.trim() || (
          targetScope === 'student' 
            ? `محاضرة فيديو مخصصة حصرياً للطالب ${targetStudent?.fullName} (${targetStudent?.code}).`
            : `محاضرة فيديو مرفوعة لمجموعة ${selectedGroup} - ${selectedGrade}.`
        )
      });

      setVideos(storageService.getVideos());
      setIsUploadingVideo(false);
      setVideoUploadProgress(0);

      // Reset
      setVideoTitle('');
      setSelectedVideoFile(null);
      setVideoFilePreview('');
      setVideoCloudUrl('');
      setVideoDescription('');
      if (videoFileInputRef.current) videoFileInputRef.current.value = '';

      // Notification
      storageService.addNotification({
        title: targetScope === 'student'
          ? `🎥 فيديو خاص لك: ${newVideo.title}`
          : `🎥 محاضرة فيديو جديدة: ${newVideo.title}`,
        body: targetScope === 'student'
          ? `رفع مستر أحمد المعاطي فيديو مخصص لك (${newVideo.title}). متاح في حسابك الآن.`
          : `تم رفع فيديو المحاضرة (${fileSizeMb}) لطلاب ${selectedGrade} - ${selectedGroup}. متاح للمشاهدة الآن.`,
        targetRole: 'all',
        targetGrade: selectedGrade,
        targetGroup: targetScope === 'group' ? selectedGroup : undefined,
        targetBranch: selectedBranch,
        targetStudentId: targetScope === 'student' ? targetStudent?.id : undefined,
        targetStudentCode: targetScope === 'student' ? targetStudent?.code : undefined,
        type: 'announcement'
      });

      onNotify(
        targetScope === 'student' ? 'تم رفع الفيديو للطالب المحدد 🎥' : 'تم رفع المحاضرة للمجموعة بنجاح 🎥',
        targetScope === 'student'
          ? `تم رفع وتشفير الفيديو "${newVideo.title}" حصرياً للطالب (${targetStudent?.fullName}).`
          : `تم رفع الفيديو "${newVideo.title}" (${fileSizeMb}) لمجموعة (${selectedGroup}) بنجاح.`
      );
    }, 600);
  };

  // ------------------------------------------
  // FORM 2: HOMEWORK (نص بيوصل للطالب في خانة تكليفات وواجبات الأسبوع)
  // ------------------------------------------
  const [hwTitle, setHwTitle] = useState('');
  const [hwLectureNum, setHwLectureNum] = useState<number>(1);
  const [hwDeadline, setHwDeadline] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  });
  const [hwInstructions, setHwInstructions] = useState('');

  const handleAssignHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim()) {
      alert('يرجى كتابة عنوان التكليف أو الواجب.');
      return;
    }
    if (!hwInstructions.trim()) {
      alert('يرجى كتابة نص التكليف والواجب الذي سيظهر للطالب في خانة تكليفات الأسبوع.');
      return;
    }

    const res = storageService.assignHomeworkToGroup(
      selectedBranch,
      selectedGrade,
      selectedGroup,
      {
        title: hwTitle.trim(),
        instructions: hwInstructions.trim(),
        deadline: hwDeadline,
        lectureNumber: Number(hwLectureNum) || 1
      },
      targetScope === 'student' ? targetStudent?.id : undefined
    );

    if (onHomeworkAssigned) {
      onHomeworkAssigned();
    }

    setAssignedHomeworks(storageService.getAllAssignedHomeworks());
    setAllStudents(storageService.getStudents());

    // Reset
    setHwTitle('');
    setHwInstructions('');

    const targetDesc = targetScope === 'student'
      ? `الطالب (${targetStudent?.fullName})`
      : selectedGroup && !selectedGroup.includes('جميع المجموعات')
        ? `طلاب (${selectedGroup})`
        : `دفعة (${selectedGrade})`;

    onNotify(
      'تم نشر التكليف والواجب 📚',
      `تم إرسال الواجب بنجاح إلى خانة (تكليفات وواجبات الأسبوع) لـ ${targetDesc} فقط (لدى ${res.affectedStudentsCount} طالب وأولياء أمورهم)!`
    );
  };

  const handleDeleteHomework = (hwId: string, title: string) => {
    if (!window.confirm(`هل أنت متأكد من حذف تكليف الواجب "${title}" من حسابات الطلاب المستهدفين؟`)) return;
    storageService.deleteHomework(hwId);
    setAssignedHomeworks(storageService.getAllAssignedHomeworks());
    setAllStudents(storageService.getStudents());
    if (onHomeworkAssigned) {
      onHomeworkAssigned();
    }
    onNotify('تم حذف التكليف 🗑️', `تم حذف الواجب "${title}" بنجاح.`);
  };

  // ------------------------------------------
  // FORM 4: NOTES & SUMMARIES (مذكرات وملخصات بتترفع من الجهاز نفسه أو رابط مباشر)
  // ------------------------------------------
  const [notesTitle, setNotesTitle] = useState('');
  const [notesCategory, setNotesCategory] = useState<StudyMaterial['category']>('Grammar');
  const [notesUnit, setNotesUnit] = useState('الوحدة الأولى (Unit 1)');
  const [notesDescription, setNotesDescription] = useState('');
  const [notesLink, setNotesLink] = useState('');
  const [selectedNotesFile, setSelectedNotesFile] = useState<File | null>(null);
  const [isUploadingNotes, setIsUploadingNotes] = useState(false);
  const notesFileInputRef = useRef<HTMLInputElement>(null);

  const handleNotesFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedNotesFile(file);
      if (!notesTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setNotesTitle(cleanName);
      }
    }
  };

  const handleUploadNotes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notesTitle.trim()) {
      alert('يرجى إدخال عنوان المذكرة أو الملخص.');
      return;
    }
    if (!selectedNotesFile && !notesLink.trim()) {
      alert('يرجى اختيار ملف المذكرة من جهازك أو إدخال رابط المذكرة المعتمد (Google Drive أو OneDrive أو رابط مباشر).');
      return;
    }

    // Case 1: External Link only (no local file selected)
    if (!selectedNotesFile && notesLink.trim()) {
      const externalUrl = notesLink.trim().startsWith('http') ? notesLink.trim() : `https://${notesLink.trim()}`;
      const newMat = storageService.addMaterial({
        title: notesTitle.trim(),
        gradeLevel: selectedGrade,
        branch: selectedBranch,
        groupName: selectedGroup,
        category: notesCategory,
        unit: notesUnit.trim(),
        fileName: `${notesTitle.trim().replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
        fileSize: 'رابط سحابي مباشر',
        fileUrl: externalUrl,
        description: notesDescription.trim() || `مذكرة وملخص عبر الرابط المباشر من مستر أحمد لطلاب ${selectedGrade}.`
      });

      setMaterials(storageService.getMaterials());
      setNotesTitle('');
      setNotesLink('');
      setNotesDescription('');

      storageService.addNotification({
        title: `📑 مذكرة وملخص جديد: ${newMat.title}`,
        body: `تم نشر رابط مذكرة لطلاب ${selectedGrade} - ${selectedGroup} في قسم المذكرات والملخصات.`,
        targetRole: 'all',
        targetGrade: selectedGrade,
        targetGroup: targetScope === 'group' ? selectedGroup : undefined,
        targetBranch: selectedBranch,
        targetStudentId: targetScope === 'student' ? targetStudent?.id : undefined,
        targetStudentCode: targetScope === 'student' ? targetStudent?.code : undefined,
        type: 'announcement'
      });

      onNotify('تم نشر المذكرة بنجاح 📑', `تمت إضافة المذكرة "${newMat.title}" برابط مباشر بنجاح.`);
      return;
    }

    if (!selectedNotesFile) return;

    const fileSizeMb = (selectedNotesFile.size / (1024 * 1024)).toFixed(1) + ' MB';
    setIsUploadingNotes(true);

    const reader = new FileReader();
    reader.onerror = () => {
      setIsUploadingNotes(false);
      alert('حدث خطأ أثناء قراءة ملف المذكرة من جهازك.');
    };

    reader.onload = async () => {
      const base64Data = reader.result as string;
      let finalFileUrl: string | undefined = notesLink.trim() || undefined;

      try {
        const uploadRes = await fetch('/api/materials/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: selectedNotesFile.name,
            fileBase64: base64Data,
            mimeType: selectedNotesFile.type || 'application/pdf'
          })
        });

        if (uploadRes.ok) {
          const resData = await uploadRes.json();
          if (resData.success) {
            finalFileUrl = resData.fileUrl || resData.downloadUrl;
          }
        }
      } catch (err) {
        console.warn('Server upload fallback to base64 data URL', err);
      }

      const newMat = storageService.addMaterial({
        title: notesTitle.trim(),
        gradeLevel: selectedGrade,
        branch: selectedBranch,
        groupName: selectedGroup,
        category: notesCategory,
        unit: notesUnit.trim(),
        fileName: selectedNotesFile.name,
        fileSize: fileSizeMb,
        fileUrl: finalFileUrl,
        fileDataUrl: !finalFileUrl && base64Data.length < 500000 ? base64Data : undefined,
        description: notesDescription.trim() || `مذكرة وملخص تم رفعها من جهاز مستر أحمد لطلاب ${selectedGrade}.`
      });

      setMaterials(storageService.getMaterials());
      setIsUploadingNotes(false);

      // Reset
      setNotesTitle('');
      setNotesLink('');
      setSelectedNotesFile(null);
      setNotesDescription('');
      if (notesFileInputRef.current) notesFileInputRef.current.value = '';

      // Notification
      storageService.addNotification({
        title: `📑 مذكرة وملخص جديد: ${newMat.title}`,
        body: `تم رفع ملف المذكرة (${fileSizeMb}) لطلاب ${selectedGrade} - ${selectedGroup} في قسم المذكرات والملخصات.`,
        targetRole: 'all',
        targetGrade: selectedGrade,
        targetGroup: targetScope === 'group' ? selectedGroup : undefined,
        targetBranch: selectedBranch,
        targetStudentId: targetScope === 'student' ? targetStudent?.id : undefined,
        targetStudentCode: targetScope === 'student' ? targetStudent?.code : undefined,
        type: 'announcement'
      });

      onNotify('تم رفع المذكرة بنجاح 📑', `تم حفظ المذكرة "${newMat.title}" (${fileSizeMb}) بنجاح وأصبحت متاحة للطلاب للتحميل المباشر.`);
    };

    reader.readAsDataURL(selectedNotesFile);
  };

  const handleDeleteVideo = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف فيديو: "${title}"؟\nسيتم حذفه فورياً ولن يتمكن أي طالب من مشاهدته.`)) {
      storageService.deleteVideo(id);
      setVideos(storageService.getVideos());
      onNotify('حذف المحاضرة 🗑️', `تم حذف فيديو "${title}" بنجاح وإزالته من حسابات الطلاب.`);
    }
  };

  const handleDeleteMaterial = (id: string, title: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مذكرة: "${title}"؟\nسيتم حذفها فورياً ولن تظهر للطلاب للتحميل.`)) {
      storageService.deleteMaterial(id);
      setMaterials(storageService.getMaterials());
      onNotify('حذف المذكرة 🗑️', `تم حذف المذكرة "${title}" بنجاح وإزالتها من حسابات الطلاب.`);
    }
  };

  const handleDownloadMaterial = (mat: StudyMaterial) => {
    try {
      const safeFileName = mat.fileName || `${mat.title.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;

      // 1. External Link (Google Drive, direct PDF link)
      if (mat.fileUrl && mat.fileUrl.startsWith('http')) {
        window.open(mat.fileUrl, '_blank', 'noopener,noreferrer');
        onNotify('فتح المذكرة 📥', `جاري فتح رابط المذكرة (${safeFileName}) للمشاهدة والتحميل.`);
        return;
      }

      // 2. Direct Server URL
      if (mat.fileUrl && (mat.fileUrl.startsWith('/uploads/') || mat.fileUrl.startsWith('/api/'))) {
        const downloadLink = mat.fileUrl.startsWith('/uploads/')
          ? `/api/materials/download/${mat.fileUrl.replace('/uploads/', '')}`
          : mat.fileUrl;

        const a = document.createElement('a');
        a.href = downloadLink;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        onNotify('جاري تنزيل المذكرة 📥', `جاري تنزيل ملف (${safeFileName}) على جهازك.`);
        return;
      }

      if (mat.fileDataUrl && mat.fileDataUrl.startsWith('data:')) {
        const mimeMatch = mat.fileDataUrl.match(/^data:([^;]+);/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'application/pdf';
        const base64 = mat.fileDataUrl.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const blobUrl = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = safeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

        onNotify('تم تنزيل المذكرة 📥', `تم حفظ ملف (${safeFileName}) على جهازك.`);
        return;
      }

      setPreviewMaterial(mat);
    } catch {
      setPreviewMaterial(mat);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* Step Header Flow Banner */}
      <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-500/20 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>رفع ونشر محتوى وتكليف جديد</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                  نظام التوزيع الذكي
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اتبع الخطوات المتتالية: حدد الفرع، ثم الصف، ثم المجموعة، ثم اختر نوع المحتوى المطلوب رفعه
              </p>
            </div>
          </div>
        </div>

        {/* 3 Step Interactive Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5 pt-4 border-t border-slate-800">
          {/* STEP 1: كفر سعد ولا دمياط */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-latin font-bold">1</span>
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>الفرع والسنتر (كفر سعد / دمياط):</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {(['دمياط', 'كفر سعد', 'الكل'] as const).map((branch) => (
                <button
                  key={branch}
                  type="button"
                  onClick={() => setSelectedBranch(branch)}
                  className={`py-2 px-2 rounded-lg text-xs font-bold transition-all text-center border ${
                    selectedBranch === branch
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {branch}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: صف إيه */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <label className="block text-xs font-bold text-blue-300 mb-1.5 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-blue-500 text-white flex items-center justify-center text-[10px] font-latin font-bold">2</span>
              <GraduationCap className="w-3.5 h-3.5 text-blue-400" />
              <span>المرحلة والصف الدراسي:</span>
            </label>
            <select
              value={selectedGrade}
              onChange={(e) => handleGradeChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-bold focus:border-blue-500 focus:outline-none"
            >
              {gradeOptions.map((gr) => (
                <option key={gr} value={gr}>{gr}</option>
              ))}
            </select>
          </div>

          {/* STEP 3: مجموعة إيه أو طالب محدد */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px] font-latin font-bold">3</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>الهدف (مجموعة أو طالب):</span>
              </label>

              {/* Target Scope Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setTargetScope('group')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    targetScope === 'group'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  مجموعة
                </button>
                <button
                  type="button"
                  onClick={() => setTargetScope('student')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                    targetScope === 'student'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  طالب محدد
                </button>
              </div>
            </div>

            {targetScope === 'group' ? (
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-bold focus:border-blue-500 focus:outline-none truncate"
              >
                {currentGroupOptions.map((grp) => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <StudentFuzzySearchAutocomplete
                  students={allStudents.filter(s => !selectedGrade || s.gradeLevel === selectedGrade)}
                  selectedStudentId={targetStudent?.id}
                  onSelectStudent={(st) => setTargetStudent(st)}
                  placeholder="ابحث بالاسم أو الكود لتحديد الطالب المستهدف..."
                />
                {targetStudent && (
                  <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-600/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{targetStudent.fullName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-200">
                        {targetStudent.code}
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      خاص به وحده
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STEP 4: ماذا تريد أن ترفع الآن؟ (4 خيارات واضحة) */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-latin font-bold">4</span>
          <h3 className="text-sm font-bold text-white">اختر نوع ما سيتم رفعه ونشره للطلاب:</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Card 1: فيديوهات الحصص */}
          <button
            type="button"
            onClick={() => setUploadType('video')}
            className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
              uploadType === 'video'
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg ring-1 ring-blue-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Video className="w-5 h-5" />
              </div>
              {uploadType === 'video' && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">🎥 فيديو الحصة</h4>
              <p className="text-[10px] text-blue-300 mt-1">من الجهاز أو رابط سحابي (1-3 ساعات)</p>
            </div>
          </button>

          {/* Card 2: واجبات وتكليفات نصية */}
          <button
            type="button"
            onClick={() => setUploadType('homework')}
            className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
              uploadType === 'homework'
                ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-lg ring-1 ring-emerald-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              {uploadType === 'homework' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">📚 واجب وتكليف الأسبوع</h4>
              <p className="text-[10px] text-emerald-300 mt-1">نص يظهر في خانة واجبات الطالب</p>
            </div>
          </button>

          {/* Card 3: مذكرات وملخصات PDF */}
          <button
            type="button"
            onClick={() => setUploadType('notes')}
            className={`p-4 rounded-2xl border text-right transition-all flex flex-col justify-between ${
              uploadType === 'notes'
                ? 'bg-amber-600/20 border-amber-500 text-white shadow-lg ring-1 ring-amber-500/50'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              {uploadType === 'notes' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-white">📑 مذكرات وملخصات PDF</h4>
              <p className="text-[10px] text-amber-300 mt-1">ملفات PDF وشيتات تدريبات للتحميل</p>
            </div>
          </button>
        </div>
      </div>

      {/* DYNAMIC FORM ACCORDING TO USER'S SELECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
        {/* ========================================================= */}
        {/* 1. VIDEO UPLOAD FORM (من الجهاز مش عبر رابط)               */}
        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* 1. VIDEO UPLOAD FORM (من الجهاز أو رابط سحابي للمحاضرات الطويلة) */}
        {/* ========================================================= */}
        {uploadType === 'video' && (
          <form onSubmit={handleUploadVideo} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">رفع فيديو المحاضرة (يدعم المحاضرات الطويلة حتى 3 ساعات)</h3>
              </div>
              <span className="text-xs text-blue-400 font-bold bg-blue-950/70 border border-blue-800 px-3 py-1 rounded-xl">
                الهدف: {selectedBranch} • {selectedGrade}
              </span>
            </div>

            {/* Video Source Mode Selector: File upload vs Cloud Link */}
            <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setVideoSourceMode('upload')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  videoSourceMode === 'upload'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع ملف فيديو من الجهاز (MP4/WebM/MKV)</span>
              </button>
              <button
                type="button"
                onClick={() => setVideoSourceMode('cloud_link')}
                className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  videoSourceMode === 'cloud_link'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Link className="w-3.5 h-3.5" />
                <span>رابط سحابي مباشر (Google Drive / YouTube غير مدرج / CDN)</span>
              </button>
            </div>

            {/* Option A: File from device */}
            {videoSourceMode === 'upload' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-200">
                  اختر ملف الفيديو من جهازك: <span className="text-rose-400">*</span>
                </label>
                
                <div 
                  onClick={() => videoFileInputRef.current?.click()}
                  className="border-2 border-dashed border-blue-500/40 hover:border-blue-400 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-950"
                >
                  <input 
                    type="file" 
                    ref={videoFileInputRef}
                    onChange={handleVideoFileChange}
                    accept="video/*,.mp4,.webm,.mkv,.mov"
                    className="hidden"
                  />

                  {selectedVideoFile ? (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-white">{selectedVideoFile.name}</div>
                      <div className="text-xs text-slate-400 font-latin">
                        الحجم: {(selectedVideoFile.size / (1024 * 1024)).toFixed(1)} MB • جاهز للرفع
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          videoFileInputRef.current?.click();
                        }}
                        className="text-[11px] text-blue-400 hover:underline pt-1 block mx-auto"
                      >
                        تغيير الملف
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div className="text-sm font-bold text-white">اضغط هنا لاختيار ملف الفيديو من جهازك</div>
                      <p className="text-xs text-slate-400">
                        يدعم جميع أحجام ومحاضرات الساعات الطويلة ومحمي بعلامة مائية متحركة لمنع التسجيل
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Option B: Cloud Video Link (Google Drive / YouTube / Direct) */
              <div className="space-y-2">
                <label className="block text-xs font-bold text-indigo-300">
                  رابط الفيديو السحابي (Google Drive أو YouTube غير مدرج أو رابط مباشر): <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoCloudUrl}
                    onChange={(e) => setVideoCloudUrl(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... أو https://youtu.be/... أو رابط CDN"
                    dir="ltr"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-3 text-xs sm:text-sm text-indigo-200 font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <Link className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-400">
                  💡 مثالي لمحاضرات الساعتين والثلاث ساعات المحفوظة على Google Drive أو YouTube (Unlisted) دون استهلاك مساحة الجهاز.
                </p>
              </div>
            )}

            {/* Video Details Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان الفيديو والمحاضرة:</label>
                <input
                  type="text"
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="مثال: Lecture 4: Past Perfect & Translation Masterclass"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الوحدة (Unit):</label>
                <input
                  type="text"
                  value={videoUnit}
                  onChange={(e) => setVideoUnit(e.target.value)}
                  placeholder="مثال: Unit 1: Read All About It!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">رقم المحاضرة في المنهج:</label>
                <input
                  type="number"
                  min="1"
                  value={videoLectureNumber}
                  onChange={(e) => setVideoLectureNumber(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-latin text-center focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">مدة الفيديو التقديرية (بالدقائق):</label>
                <input
                  type="number"
                  min="10"
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-latin text-center focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">وصف ونقاط المحاضرة:</label>
              <textarea
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                placeholder="اكتب النقاط الرئيسية التي تتناولها المحاضرة والتوجيهات للطلاب أثناء المشاهدة..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Upload Progress Bar if uploading */}
            {isUploadingVideo && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-blue-400 font-bold">جاري رفع وتشفير الفيديو وحفظه في المنصة...</span>
                  <span className="font-mono text-white">{videoUploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-200" 
                    style={{ width: `${videoUploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isUploadingVideo || (videoSourceMode === 'upload' ? !selectedVideoFile : !videoCloudUrl.trim())}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>تأكيد وحفظ فيديو المحاضرة للطلاب</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 2. NOTES & SUMMARIES FORM (مذكرات وملخصات PDF)            */}
        {/* ========================================================= */}
        {uploadType === 'notes' && (
          <form onSubmit={handleUploadNotes} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">رفع ونشر مذكرة / ملخص (PDF) للطلاب</h3>
              </div>
              <span className="text-xs text-amber-400 font-bold bg-amber-950/70 border border-amber-800 px-3 py-1 rounded-xl">
                الهدف: {selectedBranch} • {selectedGrade}
              </span>
            </div>

            {/* Notes File Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                اختر ملف المذكرة من جهازك (PDF أو Word):
              </label>
              
              <div 
                onClick={() => notesFileInputRef.current?.click()}
                className="border-2 border-dashed border-amber-500/40 hover:border-amber-400 bg-slate-950/60 rounded-2xl p-6 text-center cursor-pointer transition-all hover:bg-slate-950"
              >
                <input 
                  type="file" 
                  ref={notesFileInputRef}
                  onChange={handleNotesFileChange}
                  accept=".pdf,.doc,.docx,application/pdf"
                  className="hidden"
                />

                {selectedNotesFile ? (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-white">{selectedNotesFile.name}</div>
                    <div className="text-xs text-slate-400 font-latin">
                      الحجم: {(selectedNotesFile.size / (1024 * 1024)).toFixed(1)} MB • جاهز للرفع
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        notesFileInputRef.current?.click();
                      }}
                      className="text-[11px] text-amber-400 hover:underline pt-1 block mx-auto"
                    >
                      تغيير الملف
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-12 h-12 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mx-auto">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-white">اضغط لاختيار ملف PDF من الجهاز</div>
                    <p className="text-xs text-slate-400">
                      يدعم ملفات PDF والشيتات والملخصات لجميع المجموعات والطلاب
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Or Direct Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                أو ضع رابط المذكرة المباشر (Google Drive / OneDrive / رابط سحابي):
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={notesLink}
                  onChange={(e) => setNotesLink(e.target.value)}
                  placeholder="https://drive.google.com/... أو رابط مباشر للملف"
                  dir="ltr"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2.5 text-xs sm:text-sm text-white font-mono focus:border-amber-500 focus:outline-none"
                />
                <Link className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان المذكرة أو الملخص:</label>
                <input
                  type="text"
                  value={notesTitle}
                  onChange={(e) => setNotesTitle(e.target.value)}
                  placeholder="مثال: مذكرة شرح Unit 1 كاملة + شيت تدريبات"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم الوحدة (Unit):</label>
                <input
                  type="text"
                  value={notesUnit}
                  onChange={(e) => setNotesUnit(e.target.value)}
                  placeholder="مثال: Unit 1: Read All About It!"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUploadingNotes || (!selectedNotesFile && !notesLink.trim())}
              className="w-full py-3.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              <span>نشر المذكرة والملخص للطلاب</span>
            </button>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. HOMEWORK FORM (نص يصل لخانة تكليفات وواجبات الأسبوع)    */}
        {/* ========================================================= */}
        {uploadType === 'homework' && (
          <form onSubmit={handleAssignHomework} className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">تكليف منزلي يصل لخانة "تكليفات وواجبات الأسبوع"</h3>
              </div>
              <span className="text-xs text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800 px-3 py-1 rounded-xl">
                الهدف: {selectedBranch} • {selectedGrade} • {selectedGroup}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان التكليف / الواجب:</label>
                <input
                  type="text"
                  value={hwTitle}
                  onChange={(e) => setHwTitle(e.target.value)}
                  placeholder="مثال: واجب الأسبوع الثاني: تمارين الماضي التام وكتابة المقال"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">آخر موعد للتسليم (Deadline):</label>
                <input
                  type="date"
                  value={hwDeadline}
                  onChange={(e) => setHwDeadline(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white font-latin focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Detailed Instructions Text */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-emerald-300">
                  نص التكليف والواجب المطلوب بالتفصيل: <span className="text-rose-400">*</span>
                </label>
                <span className="text-[11px] text-slate-400">يظهر نصاً في حساب الطالب وولي أمره</span>
              </div>
              <textarea
                value={hwInstructions}
                onChange={(e) => setHwInstructions(e.target.value)}
                placeholder={`اكتب تفاصيل الواجب هنا بوضوح، مثال:
1. حل تمارين صفحة 45 إلى 48 في المذكرة الرئيسية.
2. حفظ جدول تعبيرات وحروف جر Unit 2 كاملاً استعداداً للتسميع في الحصة.
3. كتابة مقال (Essay) من 180 كلمة عن "The Importance of Artificial Intelligence".`}
                rows={6}
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Target Audience Guarantee Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-white">تخصيص الواجب:</span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-900/80 text-emerald-300 font-bold border border-emerald-700/50">
                    {targetScope === 'student' ? `طالب محدد: ${targetStudent?.fullName || 'لم يُحدد'}` : selectedGroup}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-slate-300 font-bold border border-slate-700">
                    {selectedGrade}
                  </span>
                  <span className="text-emerald-400 font-bold font-latin">
                    ({targetStudentsCount} طالب مستهدف)
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  🔒 <strong className="text-emerald-300">أمان التخصيص:</strong> هذا التكليف سيظهر حصرياً في خانة <strong>"تكليفات وواجبات الأسبوع"</strong> عند طلاب هذه المجموعة المحددة فقط وأولياء أمورهم، ولن يظهر لبقية طلاب المنصة أو المجموعات الأخرى.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>
                {targetScope === 'student'
                  ? `إرسال التكليف حصرياً للطالب (${targetStudent?.fullName || 'المحدد'}) فقط`
                  : `نشر التكليف حصرياً لمجموعة (${selectedGroup}) فقط (${targetStudentsCount} طالب)`}
              </span>
            </button>
          </form>
        )}
      </div>

      {/* ========================================================= */}
      {/* PREVIOUSLY UPLOADED CONTENT OVERVIEW (BLUE RECTANGLE)     */}
      {/* ========================================================= */}
      <div className="space-y-4 pt-6 border-t-2 border-slate-800">
        {/* Dynamic Group Filter Bar & Mode Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-black text-white">
                  المحتويات المرفوعة حالياً في المنصة
                </h3>
                {filterScopeMode === 'current_group' ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold truncate max-w-[280px]">
                    {targetScope === 'student' && targetStudent
                      ? `خاص للطالب: ${targetStudent.fullName}`
                      : selectedGroup && !selectedGroup.includes('جميع المجموعات')
                      ? `${selectedGroup}`
                      : `دفعة ${selectedGrade}`}
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                    عرض شامل لكل المحتويات
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-latin">
                {filterScopeMode === 'current_group' ? (
                  <span>
                    محتويات هذه المجموعة: {displayedVideos.length} فيديو • {displayedHomeworks.length} واجب • {displayedMaterials.length} مذكرة
                  </span>
                ) : (
                  <span>
                    إجمالي المنصة: {videos.length} فيديو • {assignedHomeworks.length} واجب • {materials.length} مذكرة
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Scope Toggle: Current Selected Group vs All */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterScopeMode('current_group')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterScopeMode === 'current_group'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>المجموعة المحددة ({totalDisplayedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setFilterScopeMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterScopeMode === 'all'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>عرض الكل ({totalAllCount})</span>
            </button>
          </div>
        </div>

        {/* 3 Columns Grid: Videos, Homeworks, Materials */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Column 1: فيديوهات الحصص */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" />
                <span>فيديوهات الحصص ({displayedVideos.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">من الجهاز أو سحابي</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {displayedVideos.length === 0 ? (
                <div className="text-center py-8 px-2 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <Video className="w-6 h-6 mx-auto mb-1.5 text-slate-600 opacity-60" />
                  <span>لا توجد فيديوهات مرفوعة لهذه المجموعة حالياً</span>
                </div>
              ) : (
                displayedVideos.map((vid) => (
                  <div key={vid.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[170px]" title={vid.title}>{vid.title}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteVideo(vid.id, vid.title)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors p-1.5 rounded-lg"
                        title="حذف هذا الفيديو نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-latin">
                      <span>{vid.durationMinutes} دقيقة</span>
                      <span>{vid.fileSize || 'ملف محلي'}</span>
                      <span className="text-blue-400 font-bold">{vid.branch || 'دمياط'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: تكليفات وواجبات الأسبوع المرفوعة */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>واجبات الأسبوع ({displayedHomeworks.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">نصية للطالب</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {displayedHomeworks.length === 0 ? (
                <div className="text-center py-8 px-2 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <BookOpen className="w-6 h-6 mx-auto mb-1.5 text-slate-600 opacity-60" />
                  <span>لا توجد واجبات منشورة لهذه المجموعة حالياً</span>
                </div>
              ) : (
                displayedHomeworks.map((hw) => (
                  <div key={hw.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[150px]" title={hw.title}>{hw.title}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteHomework(hw.id, hw.title)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors p-1.5 rounded-lg"
                        title="حذف هذا الواجب من حسابات الطلاب نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-latin">
                      <span className="text-emerald-300 font-bold truncate max-w-[110px]" title={hw.assignedToGroup}>
                        {hw.assignedToGroup || hw.assignedToGrade || 'عام للدفعة'}
                      </span>
                      <span className="text-blue-300 font-bold">
                        {hw.studentCount} طالب
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>تسليم: {hw.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: المذكرات والملخصات المرفوعة */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>مذكرات وملخصات ({displayedMaterials.length})</span>
              </span>
              <span className="text-[10px] text-slate-500">PDF وشيتات</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {displayedMaterials.length === 0 ? (
                <div className="text-center py-8 px-2 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  <FileText className="w-6 h-6 mx-auto mb-1.5 text-slate-600 opacity-60" />
                  <span>لا توجد مذكرات مرفوعة لهذه المجموعة حالياً</span>
                </div>
              ) : (
                displayedMaterials.map((mat) => (
                  <div key={mat.id} className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate max-w-[150px]" title={mat.title}>{mat.title}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteMaterial(mat.id, mat.title)}
                        className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors p-1.5 rounded-lg"
                        title="حذف هذه المذكرة نهائياً"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-latin">
                      <span className="text-amber-400 font-bold truncate max-w-[110px]">
                        {mat.unit || 'مذكرة عامة'}
                      </span>
                      <span>{mat.fileSize || 'PDF'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
