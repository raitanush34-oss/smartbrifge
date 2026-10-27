import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock3, GraduationCap, Plus, Search, Users } from 'lucide-react';
import api from '../api/axiosClient';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';

const formats = {
  self_paced: 'Self-paced',
  instructor_led: 'Instructor-led',
  workshop: 'Workshop',
};

const progressSteps = [0, 25, 50, 75, 100];

const Training = () => {
  const { hasRole } = useAuth();
  const isManager = hasRole('admin', 'manager');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [teamEnrollments, setTeamEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('catalog');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: '', description: '', category: 'Leadership', skills: '', provider: 'Internal Learning',
    durationHours: 2, format: 'self_paced', courseUrl: '',
  });

  const loadTraining = useCallback(async () => {
    try {
      const requests = [api.get('/training/courses'), api.get('/training/my')];
      if (isManager) requests.push(api.get('/training/team'));
      const [courseResponse, myResponse, teamResponse] = await Promise.all(requests);
      setCourses(courseResponse.data?.data || []);
      setEnrollments(myResponse.data?.data || []);
      setTeamEnrollments(teamResponse?.data?.data || []);
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not load training data' });
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    Promise.resolve().then(loadTraining);
  }, [loadTraining]);

  const enrollmentByCourse = useMemo(
    () => new Map(enrollments.map((enrollment) => [enrollment.course?._id, enrollment])),
    [enrollments]
  );
  const categories = useMemo(
    () => ['All', ...new Set(courses.map((course) => course.category).filter(Boolean))],
    [courses]
  );
  const visibleCourses = courses.filter((course) => {
    const matchesSearch = `${course.title} ${course.description} ${course.skills.join(' ')}`
      .toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (category === 'All' || course.category === category);
  });
  const completedCount = enrollments.filter((enrollment) => enrollment.status === 'completed').length;
  const inProgressCount = enrollments.filter((enrollment) => enrollment.status === 'in_progress').length;

  const enroll = async (course) => {
    setSaving(true);
    try {
      await api.post(`/training/courses/${course._id}/enroll`);
      setToast({ type: 'success', message: `Enrolled in ${course.title}` });
      await loadTraining();
      setActiveTab('learning');
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not enroll in this course' });
    } finally {
      setSaving(false);
    }
  };

  const updateProgress = async (enrollment, progress) => {
    setSaving(true);
    try {
      await api.patch(`/training/enrollments/${enrollment._id}/progress`, { progress: Number(progress) });
      setToast({ type: 'success', message: progress === 100 ? 'Course marked complete' : 'Progress updated' });
      await loadTraining();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not update progress' });
    } finally {
      setSaving(false);
    }
  };

  const createCourse = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.post('/training/courses', {
        ...courseForm,
        durationHours: Number(courseForm.durationHours),
        skills: courseForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      });
      setToast({ type: 'success', message: 'Course added to the learning catalog' });
      setIsCreateOpen(false);
      setCourseForm({ title: '', description: '', category: 'Leadership', skills: '', provider: 'Internal Learning', durationHours: 2, format: 'self_paced', courseUrl: '' });
      await loadTraining();
    } catch (error) {
      setToast({ type: 'error', message: error.response?.data?.message || 'Could not create course' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'catalog', label: 'Course catalog', icon: BookOpen },
    { id: 'learning', label: 'My learning', icon: GraduationCap },
    ...(isManager ? [{ id: 'team', label: 'Team progress', icon: Users }] : []),
  ];

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Learning & growth</p>
          <h1 className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            <GraduationCap className="h-6 w-6 text-teal-700 dark:text-teal-300" /> Training & Skills
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Build capabilities, track progress, and keep team learning visible.</p>
        </div>
        {isManager && <button onClick={() => setIsCreateOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-800"><Plus className="h-4 w-4" /> Add course</button>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Available courses</p><p className="mt-1 text-2xl font-black text-slate-900 dark:text-white">{courses.length}</p></div>
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 dark:border-teal-900 dark:bg-teal-950/20"><p className="text-[11px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">In progress</p><p className="mt-1 text-2xl font-black text-teal-900 dark:text-teal-200">{inProgressCount}</p></div>
        <div className="col-span-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900 dark:bg-emerald-950/20 sm:col-span-1"><p className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Completed</p><p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-200">{completedCount}</p></div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-xs font-bold transition ${activeTab === id ? 'border-teal-700 text-teal-800 dark:border-teal-400 dark:text-teal-300' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'}`}><Icon className="h-4 w-4" />{label}</button>)}
        </div>
      </div>

      {activeTab === 'catalog' && <>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses and skills" className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs dark:border-slate-800 dark:bg-slate-900 dark:text-white" /></label>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">{categories.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading courses...</div> : visibleCourses.length === 0 ? <EmptyState title="No courses found" detail="Try a different search or add the first course to this catalog." /> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleCourses.map((course) => {
            const enrollment = enrollmentByCourse.get(course._id);
            return <CourseCard key={course._id} course={course} enrollment={enrollment} saving={saving} onEnroll={enroll} />;
          })}
        </div>}
      </>}

      {activeTab === 'learning' && <>
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading your learning...</div> : enrollments.length === 0 ? <EmptyState title="Your learning list is empty" detail="Enroll in a course from the catalog to start tracking progress." /> : <div className="space-y-3">
          {enrollments.map((enrollment) => <EnrollmentRow key={enrollment._id} enrollment={enrollment} saving={saving} onProgress={updateProgress} />)}
        </div>}
      </>}

      {activeTab === 'team' && isManager && <>
        {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading team progress...</div> : teamEnrollments.length === 0 ? <EmptyState title="No team enrollments yet" detail="Employee enrollments will appear here as they join courses." /> : <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/70"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Course</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{teamEnrollments.map((enrollment) => <tr key={enrollment._id}><td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{enrollment.employee?.firstName} {enrollment.employee?.lastName}<span className="block text-[10px] font-normal text-slate-400">{enrollment.employee?.employeeCode}</span></td><td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{enrollment.course?.title}<span className="block text-[10px] text-slate-400">{enrollment.course?.category}</span></td><td className="px-4 py-3 text-slate-500">{enrollment.employee?.department}</td><td className="px-4 py-3"><div className="flex items-center gap-2"><div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600" style={{ width: `${enrollment.progress}%` }} /></div><span className="font-semibold text-slate-600 dark:text-slate-300">{enrollment.progress}%</span></div></td><td className="px-4 py-3"><StatusBadge status={enrollment.status} /></td></tr>)}</tbody></table></div>
        </div>}
      </>}

      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Add a learning course">
        <form onSubmit={createCourse} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Course title *<input required value={courseForm.title} onChange={(event) => setCourseForm((current) => ({ ...current, title: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Category *<input required value={courseForm.category} onChange={(event) => setCourseForm((current) => ({ ...current, category: event.target.value }))} placeholder="Leadership, Data, Safety..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Provider<input value={courseForm.provider} onChange={(event) => setCourseForm((current) => ({ ...current, provider: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Duration (hours) *<input required type="number" min="0.25" step="0.25" value={courseForm.durationHours} onChange={(event) => setCourseForm((current) => ({ ...current, durationHours: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Format<select value={courseForm.format} onChange={(event) => setCourseForm((current) => ({ ...current, format: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white"><option value="self_paced">Self-paced</option><option value="instructor_led">Instructor-led</option><option value="workshop">Workshop</option></select></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Skills (comma-separated)<input value={courseForm.skills} onChange={(event) => setCourseForm((current) => ({ ...current, skills: event.target.value }))} placeholder="Communication, SQL, Project planning" className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Course link<input type="url" value={courseForm.courseUrl} onChange={(event) => setCourseForm((current) => ({ ...current, courseUrl: event.target.value }))} placeholder="https://..." className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 sm:col-span-2">Description *<textarea required rows="3" value={courseForm.description} onChange={(event) => setCourseForm((current) => ({ ...current, description: event.target.value }))} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-800"><button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Cancel</button><button disabled={saving} className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">{saving ? 'Saving…' : 'Publish course'}</button></div>
        </form>
      </Modal>
    </div>
  );
};

const CourseCard = ({ course, enrollment, saving, onEnroll }) => (
  <article className="flex min-h-64 flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
    <div className="flex items-start justify-between gap-3"><span className="rounded-md bg-teal-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-800 dark:bg-teal-950/50 dark:text-teal-300">{course.category}</span><span className="flex items-center gap-1.5 text-[11px] text-slate-500"><Clock3 className="h-3.5 w-3.5" />{course.durationHours}h</span></div>
    <h2 className="mt-4 text-base font-extrabold text-slate-900 dark:text-white">{course.title}</h2>
    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{course.description}</p>
    <p className="mt-3 text-[11px] text-slate-500">{formats[course.format] || formats.self_paced} <span className="mx-1 text-slate-300">·</span> {course.provider}</p>
    {course.skills.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{course.skills.map((skill) => <span key={skill} className="rounded-md border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">{skill}</span>)}</div>}
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
      {enrollment ? <div className="min-w-0 flex-1"><div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold text-slate-500"><span>{enrollment.status === 'completed' ? 'Completed' : `${enrollment.progress}% complete`}</span><StatusBadge status={enrollment.status} /></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${enrollment.progress}%` }} /></div></div> : <span className="text-[11px] text-slate-400">Not enrolled</span>}
      {course.courseUrl && <a href={course.courseUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-teal-800 hover:underline dark:text-teal-300">Open course</a>}
      {!enrollment && <button disabled={saving} onClick={() => onEnroll(course)} className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Enroll</button>}
    </div>
  </article>
);

const EnrollmentRow = ({ enrollment, saving, onProgress }) => (
  <article className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
    <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-bold text-slate-900 dark:text-white">{enrollment.course?.title || 'Archived course'}</h2><StatusBadge status={enrollment.status} /></div><p className="mt-1 text-xs text-slate-500">{enrollment.course?.category} <span className="mx-1 text-slate-300">·</span> {enrollment.course?.durationHours} hours</p><div className="mt-3 h-2 max-w-xl overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${enrollment.progress}%` }} /></div></div>
    <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Progress<select disabled={saving || enrollment.status === 'completed'} value={enrollment.progress} onChange={(event) => onProgress(enrollment, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white">{progressSteps.map((progress) => <option key={progress} value={progress}>{progress}%</option>)}</select></label>
  </article>
);

const StatusBadge = ({ status }) => {
  const styles = status === 'completed'
    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
    : status === 'in_progress'
      ? 'bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300'
      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  const labels = { enrolled: 'Enrolled', in_progress: 'In progress', completed: 'Completed' };
  return <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-bold ${styles}`}>{status === 'completed' && <CheckCircle2 className="h-3 w-3" />}{labels[status] || status}</span>;
};

const EmptyState = ({ title, detail }) => <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900"><BookOpen className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h2><p className="mt-1 text-xs text-slate-500">{detail}</p></div>;

export default Training;
