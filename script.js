// 데이터 상태 객체 (LocalStorage 저장 대상)
let appData = {
  classes: [
    { id: 1, title: '웹프로그래밍', location: '301호', day: 1, start: 1, end: 3 },
    { id: 2, title: '데이터베이스', location: '405호', day: 3, start: 4, end: 6 }
  ],
  tasks: [
    { id: 1, title: '자바스크립트 킥오프 발표자료 작성', subject: '오픈소스', date: '2026-11-15', completed: false }
  ],
  academic: [
    { id: 1, title: '2학기 기말고사', date: '2026-12-10', category: '시험' }
  ],
  clubs: [
    { id: 1, name: '앱 개발동아리 Dev-A', desc: '웹 & 모바일 앱 프로젝트 정기 모임', schedule: '매주 수요일 18:00' }
  ],
  notes: [
    { id: 1, title: 'LocalStorage 활용 팁', content: 'JSON.stringify 및 parse를 활용해 사용자 데이터를 브라우저에 간단히 백업 가능.', date: '2026-11-08' }
  ]
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  loadStoredData();
  renderAll();
  updateCurrentDateBadge();
});

// 날짜 표시
function updateCurrentDateBadge() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}`;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  document.getElementById('current-date-badge').innerText = `${dateStr} (${days[now.getDay()]})`;
  document.getElementById('today-day-name').innerText = `${days[now.getDay()]}요일`;
}

// LocalStorage 로드/저장
function loadStoredData() {
  const saved = localStorage.getItem('cla_app_data');
  if (saved) {
    try {
      appData = JSON.parse(saved);
    } catch (e) {
      console.error('데이터 로드 오류:', e);
    }
  }
}

function saveData() {
  localStorage.setItem('cla_app_data', JSON.stringify(appData));
  renderAll();
}

// 전체 렌더링
function renderAll() {
  renderDashboard();
  renderTimetable();
  renderTasks();
  renderAcademic();
  renderClubs();
  renderNotes();
  loadNoticesApi();
}

// 탭 전환
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`tab-${tabId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('text-indigo-400', 'bg-slate-800');
    btn.classList.add('text-slate-300');
  });

  const activeBtn = document.getElementById(`nav-${tabId}`);
  if (activeBtn) {
    activeBtn.classList.add('text-indigo-400', 'bg-slate-800');
    activeBtn.classList.remove('text-slate-300');
  }
}

// 모달 토글
function toggleModal(modalId, show) {
  const modal = document.getElementById(modalId);
  if (show) modal.classList.remove('hidden');
  else modal.classList.add('hidden');
}

// ---------------- 1. 대시보드 ----------------
function renderDashboard() {
  const todayDay = new Date().getDay(); // 0(일)~6(토)
  
  // 오늘 수업
  const todayClasses = appData.classes.filter(c => Number(c.day) === todayDay);
  const classContainer = document.getElementById('dashboard-today-classes');
  
  if (todayClasses.length === 0) {
    classContainer.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">오늘 예정된 수업이 없습니다.</p>`;
  } else {
    classContainer.innerHTML = todayClasses.map(c => `
      <div class="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex justify-between items-center">
        <div>
          <p class="font-bold text-xs text-indigo-950">${c.title}</p>
          <p class="text-[11px] text-indigo-600">${c.location || '강의실 미정'}</p>
        </div>
        <span class="text-xs font-semibold bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded">${c.start}교시~${c.end}교시</span>
      </div>
    `).join('');
  }

  // 마감 임박 과제 (완료 안 된 과제 중 D-Day 오름차순 3개)
  const urgentTasks = appData.tasks
    .filter(t => !t.completed)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);
    
  const taskContainer = document.getElementById('dashboard-urgent-tasks');
  if (urgentTasks.length === 0) {
    taskContainer.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">임박한 과제가 없습니다.</p>`;
  } else {
    taskContainer.innerHTML = urgentTasks.map(t => {
      const dday = calculateDDay(t.date);
      return `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
          <div>
            <p class="font-medium text-xs text-slate-800">${t.title}</p>
            <p class="text-[11px] text-slate-400">${t.subject || '과목 미지정'}</p>
          </div>
          <span class="text-xs font-bold ${dday.class}">${dday.text}</span>
        </div>
      `;
    }).join('');
  }

  // 학사 일정 요약
  const academicContainer = document.getElementById('dashboard-academic-events');
  if (appData.academic.length === 0) {
    academicContainer.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">등록된 학사일정이 없습니다.</p>`;
  } else {
    academicContainer.innerHTML = appData.academic.slice(0, 3).map(a => `
      <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg flex justify-between items-center">
        <div>
          <p class="font-medium text-xs text-slate-800">${a.title}</p>
          <p class="text-[11px] text-slate-400">${a.date}</p>
        </div>
        <span class="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded">${a.category}</span>
      </div>
    `).join('');
  }
}

// ---------------- 2. 시간표 관리 ----------------
function renderTimetable() {
  const grid = document.getElementById('timetable-grid');
  grid.innerHTML = '';

  const colors = [
    'bg-indigo-100 border-indigo-300 text-indigo-900',
    'bg-emerald-100 border-emerald-300 text-emerald-900',
    'bg-amber-100 border-amber-300 text-amber-900',
    'bg-rose-100 border-rose-300 text-rose-900',
    'bg-sky-100 border-sky-300 text-sky-900'
  ];

  for (let period = 1; period <= 8; period++) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-6 gap-2 py-1 items-stretch';
    
    // 교시 라벨
    const periodLabel = document.createElement('div');
    periodLabel.className = 'text-center flex flex-col justify-center text-xs text-slate-400 font-medium py-2';
    periodLabel.innerHTML = `<span>${period}교시</span><span class="text-[10px] text-slate-300">${8+period}:00</span>`;
    row.appendChild(periodLabel);

    // 월~금 (1~5)
    for (let day = 1; day <= 5; day++) {
      const cell = document.createElement('div');
      cell.className = 'timetable-cell rounded-lg p-2 border border-slate-100 flex flex-col justify-center items-center text-center relative bg-slate-50/50';

      const match = appData.classes.find(c => Number(c.day) === day && period >= Number(c.start) && period <= Number(c.end));
      if (match) {
        const colorClass = colors[match.id % colors.length];
        cell.className = `timetable-cell rounded-lg p-2 border flex flex-col justify-center items-center text-center relative ${colorClass}`;
        cell.innerHTML = `
          <p class="font-bold text-xs leading-tight">${match.title}</p>
          <p class="text-[10px] opacity-75">${match.location}</p>
          <button onclick="removeClass(${match.id})" class="absolute top-1 right-1 opacity-40 hover:opacity-100 text-[10px]">
            <i class="fa-solid fa-xmark"></i>
          </button>
        `;
      }
      row.appendChild(cell);
    }
    grid.appendChild(row);
  }
}

function addClass(e) {
  e.preventDefault();
  const title = document.getElementById('class-title').value;
  const location = document.getElementById('class-location').value;
  const day = Number(document.getElementById('class-day').value);
  const start = Number(document.getElementById('class-start').value);
  const end = Number(document.getElementById('class-end').value);

  if (start > end) {
    alert('시작 교시는 종료 교시보다 작거나 같아야 합니다.');
    return;
  }

  // 겹침 검사
  const conflict = appData.classes.some(c => {
    if (Number(c.day) === day) {
      return (start <= Number(c.end) && end >= Number(c.start));
    }
    return false;
  });

  if (conflict) {
    alert('선택한 시간에 이미 다른 수업이 존재합니다!');
    return;
  }

  appData.classes.push({ id: Date.now(), title, location, day, start, end });
  saveData();
  toggleModal('class-modal', false);
  document.getElementById('class-form').reset();
}

function removeClass(id) {
  if (confirm('이 수업을 삭제하시겠습니까?')) {
    appData.classes = appData.classes.filter(c => c.id !== id);
    saveData();
  }
}

// ---------------- 3. 과제 관리 ----------------
function renderTasks() {
  const container = document.getElementById('task-list');
  document.getElementById('task-count').innerText = `총 ${appData.tasks.length}개`;

  if (appData.tasks.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center">등록된 과제가 없습니다.</p>`;
    return;
  }

  container.innerHTML = appData.tasks.map(t => {
    const dday = calculateDDay(t.date);
    return `
      <div class="p-4 flex items-center justify-between hover:bg-slate-50 transition">
        <div class="flex items-center gap-3">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete(${t.id})" class="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer">
          <div>
            <p class="font-medium text-sm ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}">${t.title}</p>
            <p class="text-xs text-slate-400">${t.subject} · 마감일: ${t.date}</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-xs font-bold ${dday.class}">${t.completed ? '완료' : dday.text}</span>
          <button onclick="removeTask(${t.id})" class="text-slate-400 hover:text-rose-500 text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function calculateDDay(targetDateStr) {
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { text: 'D-Day', class: 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded' };
  if (diffDays > 0) return { text: `D-${diffDays}`, class: diffDays <= 3 ? 'text-amber-600 bg-amber-50 px-2 py-0.5 rounded' : 'text-indigo-600' };
  return { text: `D+${Math.abs(diffDays)} (지남)`, class: 'text-slate-400' };
}

function addTask(e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const subject = document.getElementById('task-subject').value;
  const date = document.getElementById('task-date').value;

  appData.tasks.push({ id: Date.now(), title, subject, date, completed: false });
  saveData();
  toggleModal('task-modal', false);
  document.getElementById('task-form').reset();
}

function toggleTaskComplete(id) {
  const task = appData.tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveData();
  }
}

function removeTask(id) {
  appData.tasks = appData.tasks.filter(t => t.id !== id);
  saveData();
}

// ---------------- 4. 학사 일정 ----------------
function renderAcademic() {
  const container = document.getElementById('academic-list');
  if (appData.academic.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center col-span-2">등록된 학사 일정이 없습니다.</p>`;
    return;
  }

  container.innerHTML = appData.academic.map(a => `
    <div class="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
      <div>
        <span class="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded mb-1 inline-block">${a.category}</span>
        <h4 class="font-bold text-sm text-slate-800">${a.title}</h4>
        <p class="text-xs text-slate-400 mt-1"><i class="fa-regular fa-calendar me-1"></i>${a.date}</p>
      </div>
      <button onclick="removeAcademic(${a.id})" class="text-slate-300 hover:text-rose-500 text-xs p-2">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function addAcademicEvent(e) {
  e.preventDefault();
  const title = document.getElementById('academic-title').value;
  const date = document.getElementById('academic-date').value;
  const category = document.getElementById('academic-category').value;

  appData.academic.push({ id: Date.now(), title, date, category });
  saveData();
  toggleModal('academic-modal', false);
  document.getElementById('academic-form').reset();
}

function removeAcademic(id) {
  appData.academic = appData.academic.filter(a => a.id !== id);
  saveData();
}

// ---------------- 5. 동아리 정보 ----------------
function renderClubs() {
  const container = document.getElementById('club-list');
  if (appData.clubs.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center col-span-3">등록된 동아리 정보가 없습니다.</p>`;
    return;
  }

  container.innerHTML = appData.clubs.map(c => `
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-base text-slate-900">${c.name}</h4>
          <button onclick="removeClub(${c.id})" class="text-slate-300 hover:text-rose-500 text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <p class="text-xs text-slate-600 mb-4 leading-relaxed">${c.desc}</p>
      </div>
      <div class="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-indigo-600 font-medium">
        <i class="fa-solid fa-clock"></i> ${c.schedule}
      </div>
    </div>
  `).join('');
}

function addClub(e) {
  e.preventDefault();
  const name = document.getElementById('club-name').value;
  const desc = document.getElementById('club-desc').value;
  const schedule = document.getElementById('club-schedule').value;

  appData.clubs.push({ id: Date.now(), name, desc, schedule });
  saveData();
  toggleModal('club-modal', false);
  document.getElementById('club-form').reset();
}

function removeClub(id) {
  appData.clubs = appData.clubs.filter(c => c.id !== id);
  saveData();
}

// ---------------- 6. 강의노트 / 메모 ----------------
function renderNotes() {
  const container = document.getElementById('note-list');
  if (appData.notes.length === 0) {
    container.innerHTML = `<p class="text-xs text-slate-400 py-8 text-center col-span-3">작성된 강의노트가 없습니다.</p>`;
    return;
  }

  container.innerHTML = appData.notes.map(n => `
    <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div>
        <div class="flex justify-between items-start mb-2">
          <h4 class="font-bold text-sm text-slate-900">${n.title}</h4>
          <button onclick="removeNote(${n.id})" class="text-slate-300 hover:text-rose-500 text-xs">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <p class="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">${n.content}</p>
      </div>
      <div class="mt-4 pt-2 text-[10px] text-slate-400">
        작성일: ${n.date}
      </div>
    </div>
  `).join('');
}

function addNote(e) {
  e.preventDefault();
  const title = document.getElementById('note-title').value;
  const content = document.getElementById('note-content').value;
  const date = new Date().toISOString().split('T')[0];

  appData.notes.push({ id: Date.now(), title, content, date });
  saveData();
  toggleModal('note-modal', false);
  document.getElementById('note-form').reset();
}

function removeNote(id) {
  appData.notes = appData.notes.filter(n => n.id !== id);
  saveData();
}

// ---------------- 7. 공지사항 (API 연동 프레임) ----------------
async function fetchNoticesFromAPI() {
  // 사용자가 외부 API (학교 공지 API 또는 백엔드 라우터)를 추가할 영역
  // 예시: const res = await fetch('https://api.your-university.ac.kr/notices');
  // return await res.json();
  
  // API 미구현 시 반환할 Mock 데이터
  return [
    { id: 1, title: '[소프트웨어과] 2026학년도 2학기 캡스톤 디자인 킥오프 안내', date: '2026-11-05', author: '학과사무실' },
    { id: 2, title: '[학사] 2026학년도 동계 계절학기 수강신청 일정 안내', date: '2026-11-02', author: '교무처' },
    { id: 3, title: '[장학] 2학기 국가장학금 2차 신청 및 가구원 동의 안내', date: '2026-10-28', author: '학생지원팀' }
  ];
}

async function loadNoticesApi() {
  const container = document.getElementById('notice-list');
  container.innerHTML = `<p class="text-xs text-slate-400 py-4 text-center">공지사항 불러오는 중...</p>`;

  try {
    const notices = await fetchNoticesFromAPI();
    container.innerHTML = notices.map(n => `
      <div class="py-3 flex justify-between items-center hover:bg-slate-50 px-2 transition rounded">
        <div>
          <p class="text-xs font-medium text-slate-800">${n.title}</p>
          <p class="text-[11px] text-slate-400 mt-0.5">${n.author} · ${n.date}</p>
        </div>
        <i class="fa-solid fa-chevron-right text-slate-300 text-xs"></i>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="text-xs text-rose-500 py-4 text-center">공지사항을 불러오는 도중 오류가 발생했습니다.</p>`;
  }
}

// ---------------- 8. 데이터 백업 / 복원 ----------------
function exportData() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appData, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `campus_life_data_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const imported = JSON.parse(e.target.result);
      if (imported.classes && imported.tasks) {
        appData = imported;
        saveData();
        alert('데이터가 정상적으로 복원되었습니다.');
      } else {
        alert('올바르지 않은 데이터 형식입니다.');
      }
    } catch (err) {
      alert('파일을 읽는 중 오류가 발생했습니다.');
    }
  };
  reader.readAsText(file);
}
