// Giữ lại những đảng viên đã kết nạp (hoặc được tạo hồ sơ) từ trước hoặc trong năm báo cáo
export function filterMembersByYear(members, reportYear) {
  if (!reportYear) return members;
  return members.filter((m) => {
    const vaoDang = m.NgayVaoDang || m.ngayVaoDang;
    if (vaoDang) {
      return new Date(vaoDang).getFullYear() <= reportYear;
    }
    const created = m.CreatedAt || m.createdAt;
    if (created) {
      return new Date(created).getFullYear() <= reportYear;
    }
    return true;
  });
}

// Hàm tiện ích: đếm số phần tử thỏa điều kiện predicate cho trước
export function countBy(members, predicate) {
  return members.filter(predicate).length;
}

// Tính trung bình cộng cho một trường số liệu, bỏ qua các bản ghi không có giá trị
export function computeAverage(members, extractor) {
  const valid = members.filter((m) => extractor(m) != null);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, m) => acc + extractor(m), 0);
  return Math.round(sum / valid.length);
}

// Tính tỷ lệ phần trăm giữa count và total, làm tròn đến 1 chữ số thập phân
export function pct(count, total) {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10;
}

// So sánh số liệu kỳ này với cùng kỳ năm trước, trả về dạng phần trăm để hiển thị
export function yoyRatio(current, previous) {
  if (previous === 0 && current === 0) return '—';
  if (previous === 0) return '—';
  return ((current / previous) * 100).toFixed(1) + '%';
}

// Tính tuổi đời của đảng viên tại thời điểm năm tham chiếu (dựa vào năm sinh)
export function getAge(member, referenceYear) {
  const dob = member.NgaySinh || member.ngaySinh || member.dob;
  if (!dob) return null;
  return referenceYear - new Date(dob).getFullYear();
}

// Tính số năm tuổi Đảng tại thời điểm năm tham chiếu (dựa vào ngày vào Đảng)
export function getPartyAge(member, referenceYear) {
  const joinDate = member.NgayVaoDang || member.ngayVaoDang;
  if (!joinDate) return null;
  return referenceYear - new Date(joinDate).getFullYear();
}

// Xác định đảng viên còn trong diện dự bị (chưa có ngày chính thức, hoặc ngày chính thức nằm sau năm báo cáo)
export function isDuBi(member, reportYear) {
  const officialDate = member.NgayChinhThuc || member.ngayChinhThuc;
  if (!officialDate) return true;
  return new Date(officialDate).getFullYear() > reportYear;
}

// Đảng viên có được miễn sinh hoạt/công tác hay không (căn cứ vào có ngày miễn công tác)
export function isMienCongTac(member) {
  return !!(member.NgayMienCongTac || member.ngayMienCongTac);
}

// Đảng viên có thuộc dân tộc thiểu số hay không (khác rỗng và khác "Kinh")
export function isEthnicMinority(member) {
  const ethnic = (member.DanToc || member.danToc || member.ethnic || '').toLowerCase().trim();
  return ethnic !== '' && ethnic !== 'kinh';
}

// Đảng viên có theo tôn giáo hay không (khác rỗng và khác "Không")
export function isReligious(member) {
  const religion = (member.TonGiao || member.tonGiao || member.religion || '').toLowerCase().trim();
  return religion !== '' && religion !== 'không';
}

// Quy đổi giá trị trình độ văn hóa nhập tự do (VD "12/12", "THPT") về một trong 3 mức TH/THCS/THPT
export function classifyGDPT(value) {
  if (!value) return null;
  const lower = value.toLowerCase().trim();

  if (lower.includes('trung học phổ thông') || lower.includes('thpt') || lower === '12/12') return 'THPT';
  if (lower.includes('trung học cơ sở') || lower.includes('thcs') || lower === '9/12') return 'THCS';
  if (lower.includes('tiểu học') || lower === '5/12') return 'TH';

  const match = lower.match(/(\d+)\/12/);
  if (match) {
    const level = parseInt(match[1]);
    if (level >= 10) return 'THPT';
    if (level >= 6) return 'THCS';
    return 'TH';
  }
  return null;
}

// Xác định trình độ chuyên môn nghiệp vụ cao nhất của đảng viên, ưu tiên học vị cao hơn trước
export function classifyChuyenMon(member) {
  const hocVi = (member.HocVi || member.hocVi || '').toLowerCase();
  const dhSauDH = (member.GiaoDucDaiHoc || member.giaoDucDaiHoc || member.trinhDoDHSauDH || '').toLowerCase();
  const gdnn = (member.GiaoDucNgheNghiep || member.giaoDucNgheNghiep || member.trinhDoGDNN || '').toLowerCase();

  if (hocVi.includes('tiến sĩ khoa học') || hocVi.includes('tiến sỹ khoa học') || hocVi === 'tskh') return 'TSKH';
  if (hocVi.includes('tiến sĩ') || hocVi.includes('tiến sỹ') || hocVi === 'ts') return 'TS';
  if (hocVi.includes('thạc sĩ') || hocVi.includes('thạc sỹ') || hocVi === 'ths') return 'ThS';
  if (dhSauDH.includes('đại học') || hocVi.includes('cử nhân') || hocVi.includes('kỹ sư') || dhSauDH === 'dh') return 'DH';
  if (dhSauDH.includes('cao đẳng') || gdnn.includes('cao đẳng') || gdnn === 'cd') return 'CD';
  if (gdnn.includes('trung cấp') || gdnn.includes('trung học chuyên nghiệp') || gdnn.includes('trung học cn') || gdnn === 'thcn') return 'THCN';
  if (gdnn.includes('sơ cấp') || gdnn === 'sc') return 'SC';
  return null;
}

// Xác định chức danh khoa học (Giáo sư/Phó giáo sư) nếu có
export function classifyChucDanhKH(member) {
  const hocHam = (member.HocHam || member.hocHam || '').toLowerCase();
  if (!hocHam) return null;
  if (hocHam.includes('phó giáo sư') || hocHam.includes('pgs')) return 'PGS';
  if (hocHam.includes('giáo sư') || hocHam.includes('gs')) return 'GS';
  return null;
}

// Quy đổi trình độ lý luận chính trị về các mức chuẩn: cử nhân/cao cấp, trung cấp, sơ cấp, cơ sở
export function classifyLLCT(member) {
  const llct = (member.LyLuanChinhTri || member.lyLuanChinhTri || '').toLowerCase();
  if (!llct) return null;
  if (llct.includes('cử nhân') || llct.includes('cao cấp') || llct === 'cn_cc') return 'CN_CC';
  if (llct.includes('trung cấp') || llct === 'tc') return 'TC';
  if (llct.includes('sơ cấp') || llct === 'sc') return 'SC';
  if (llct.includes('cơ sở') || llct === 'cs') return 'CS';
  return null;
}

// Xếp đảng viên vào một trong các giai đoạn kết nạp Đảng theo mốc lịch sử
export function classifyJoinPeriod(member) {
  const dateStr = member.NgayVaoDang || member.ngayVaoDang;
  if (!dateStr) return null;
  const joinDate = new Date(dateStr);

  if (joinDate <= new Date('1975-04-30')) return 'BEFORE_1975';
  if (joinDate <= new Date('1985-12-31')) return '1975_1985';
  if (joinDate <= new Date('1996-12-31')) return '1986_1996';
  if (joinDate <= new Date('2010-12-31')) return '1997_2010';
  return '2011_NOW';
}

// Đếm số lượng đảng viên theo từng giá trị của một thuộc tính (hoặc hàm trích xuất), sắp xếp giảm dần
export function getDistribution(members, accessor, defaultValue = 'Chưa cập nhật') {
  const dist = {};
  members.forEach((m) => {
    const val = typeof accessor === 'function' ? accessor(m) : (m[accessor] !== undefined ? m[accessor] : (typeof accessor === 'string' ? m[accessor.charAt(0).toUpperCase() + accessor.slice(1)] : undefined));
    const key = val || defaultValue;
    dist[key] = (dist[key] || 0) + 1;
  });
  return Object.entries(dist).sort((a, b) => b[1] - a[1]);
}

export const CHUYEN_MON_LABELS = {
  SC: 'Sơ cấp',
  THCN: 'Trung học CN',
  CD: 'Cao đẳng',
  DH: 'Đại học',
  ThS: 'Thạc sĩ',
  TS: 'Tiến sĩ',
  TSKH: 'Tiến sĩ khoa học',
};

export const LLCT_LABELS = {
  CN_CC: 'Cử nhân, cao cấp',
  TC: 'Trung cấp',
  SC: 'Sơ cấp',
  CS: 'Cơ sở',
};

export const GDPT_LABELS = {
  TH: 'Tiểu học',
  THCS: 'Trung học cơ sở',
  THPT: 'Trung học phổ thông',
};

// Hàm tổng hợp chính: gom toàn bộ số liệu thống kê cần thiết để render các biểu đồ trên trang thống kê
export function buildChartData(members, reportYear) {
  const total = members.length;

  const femaleCount = countBy(members, (m) => m.GioiTinh === 'Nữ');
  const maleCount = total - femaleCount;

  // Chia đảng viên vào các khoảng tuổi đời cố định
  const ageGroups = [
    { label: 'Dưới 30 tuổi', min: 0, max: 30 },
    { label: '31–40 tuổi', min: 31, max: 40 },
    { label: '41–50 tuổi', min: 41, max: 50 },
    { label: '51–60 tuổi', min: 51, max: 60 },
    { label: 'Trên 60 tuổi', min: 61, max: 999 },
  ].map((g) => {
    const count = countBy(members, (m) => {
      const a = getAge(m, reportYear);
      return a != null && a >= g.min && a <= g.max;
    });
    return { label: g.label, count, pct: pct(count, total) };
  });

  // Chia đảng viên vào các khoảng tuổi Đảng cố định
  const partyAgeGroups = [
    { label: 'Dưới 30 năm', min: 0, max: 29 },
    { label: '30–39 năm', min: 30, max: 39 },
    { label: '40–49 năm', min: 40, max: 49 },
    { label: '50 năm trở lên', min: 50, max: 999 },
  ].map((g) => {
    const count = countBy(members, (m) => {
      const pa = getPartyAge(m, reportYear);
      return pa != null && pa >= g.min && pa <= g.max;
    });
    return { label: g.label, count, pct: pct(count, total) };
  });

  // Thống kê số lượng theo từng cấp bậc quân hàm
  const rankDist = getDistribution(members, 'CapBac', 'Không có cấp bậc');
  const rankChart = rankDist.map(([label, count]) => ({
    label,
    count,
    pct: pct(count, total),
  }));

  // Thống kê số lượng theo trình độ chuyên môn đã quy đổi
  const eduDist = {};
  members.forEach((m) => {
    const code = classifyChuyenMon(m);
    const label = code ? CHUYEN_MON_LABELS[code] : 'Chưa cập nhật';
    eduDist[label] = (eduDist[label] || 0) + 1;
  });
  const educationChart = Object.entries(eduDist)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }));

  // Thống kê số lượng theo trình độ lý luận chính trị đã quy đổi
  const polDist = {};
  members.forEach((m) => {
    const code = classifyLLCT(m);
    const label = code ? LLCT_LABELS[code] : 'Chưa cập nhật';
    polDist[label] = (polDist[label] || 0) + 1;
  });
  const politicalChart = Object.entries(polDist)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }));

  // Thống kê số lượng theo thành phần dân tộc
  const ethnicDist = getDistribution(members, 'ethnic', 'Chưa cập nhật');
  const ethnicChart = ethnicDist.map(([label, count]) => ({
    label,
    count,
    pct: pct(count, total),
  }));

  // Chia đảng viên thành 2 nhóm: đang sinh hoạt bình thường và được miễn sinh hoạt
  const exemptCount = countBy(members, (m) => m.TrangThai === 'MIEN_SINH_HOAT' || !!m.NgayMienCongTac);
  const activeCount = total - exemptCount;
  const activityChart = [
    { label: 'Đang hoạt động', count: activeCount, pct: pct(activeCount, total) },
    { label: 'Miễn sinh hoạt', count: exemptCount, pct: pct(exemptCount, total) },
  ];

  // Thống kê số lượng theo kết quả xếp loại đánh giá đã được duyệt trong năm báo cáo
  const evalDist = {};
  members.forEach((m) => {
    const ev = m.DanhGiaDangVien?.find(e => e.Nam === reportYear && e.TrangThai === 'APPROVED');
    const key = ev ? ev.XepLoai : 'Chưa xếp loại';
    evalDist[key] = (evalDist[key] || 0) + 1;
  });
  const evaluationChart = Object.entries(evalDist)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ label, count, pct: pct(count, total) }));

  // Đếm các sự kiện phát sinh trong đúng năm báo cáo: kết nạp mới, khen thưởng, kỷ luật, đào tạo
  const newAdmittedCount = countBy(members, (m) => m.NgayVaoDang && new Date(m.NgayVaoDang).getFullYear() === reportYear);

  const rewardedCount = countBy(members, (m) => {
    const raw = m.KhenThuong;
    if (!raw || String(raw).trim() === '') return false;
    const rewards = String(raw).split(';').map(r => r.trim()).filter(Boolean);
    return rewards.some((reward) => {
      const years = (reward.match(/\b\d{4}\b/g) || []).map(Number);
      return years.some((y) => y === reportYear);
    });
  });

  const disciplinedCount = countBy(members, (m) => {
    const raw = m.KyLuat;
    if (!raw || String(raw).trim() === '') return false;
    const disciplines = String(raw).split(';').map(d => d.trim()).filter(Boolean);
    return disciplines.some((disc) => {
      const years = (disc.match(/\b\d{4}\b/g) || []).map(Number);
      return years.some((y) => y === reportYear);
    });
  });

  const trainingCount = countBy(members, (m) => {
    const trainings = m.QuaTrinhDaoTao || [];
    return trainings.some((t) => {
      const startYear = t.TuNgay ? new Date(t.TuNgay).getFullYear() : null;
      const endYear = t.DenNgay ? new Date(t.DenNgay).getFullYear() : null;
      return startYear === reportYear || endYear === reportYear;
    });
  });

  return {
    gender: {
      male: maleCount,
      female: femaleCount,
      malePct: pct(maleCount, total),
      femalePct: pct(femaleCount, total),
    },
    ageGroups,
    partyAgeGroups,
    rankChart,
    educationChart,
    politicalChart,
    ethnicChart,
    activityChart,
    evaluationChart,
    newAdmittedCount,
    rewardedCount,
    disciplinedCount,
    exemptCount,
    trainingCount,
  };
}
