import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSave, FiArrowLeft } from '../../components/icons';
import toast from 'react-hot-toast';
import { formatDateForInput } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';
import memberApi from '../../api/memberApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { ROLES } from '../../utils/constants';

// Các section con ghép thành form hồ sơ đảng viên
import PersonalInfoSection from '../../components/members/PersonalInfoSection';
import PartyMembershipSection from '../../components/members/PartyMembershipSection';
import MilitarySection from '../../components/members/MilitarySection';
import EducationSection from '../../components/members/EducationSection';
import HealthDocsSection from '../../components/members/HealthDocsSection';
import WorkHistorySection from '../../components/members/WorkHistorySection';
import TrainingSection from '../../components/members/TrainingSection';
import EvaluationsSection from '../../components/members/EvaluationsSection';
import RankHistorySection from '../../components/members/RankHistorySection';
import FamilySection from '../../components/members/FamilySection';
import EconomicSection from '../../components/members/EconomicSection';

const initialFormData = {
  fullName: '',
  birthName: '',
  gender: '',
  dob: '',
  placeOfBirth: '',
  hometown: '',
  residence: '',
  temporaryResidence: '',
  ethnic: '',
  religion: '',
  familyBackground: '',
  occupation: '',
  ngheNghiepKhiVaoDang: '',
  rank: '',
  congViecChinhDangLam: '',
  soLyLich: '',
  soTheDangVien: '',
  trangThai: 'HOAT_DONG', // Trạng thái sinh hoạt của đảng viên, mặc định đang hoạt động
  ngayVaoDang: '',
  chiBoVaoDang: '',
  nguoiGioiThieu1: '',
  chucVuNGT1: '',
  nguoiGioiThieu2: '',
  chucVuNGT2: '',
  ngayQuyetDinhKetNap: '',
  ngayChinhThuc: '',
  chiBoChinhThuc: '',
  noiSinhHoatDang: '', // Nơi sinh hoạt Đảng hiện nay (Mục 14)
  chucVuDang: '', // Chức vụ Đảng hiện nay (Mục 14)
  ngayTuyenDung: '',
  coQuanTuyenDung: '',
  ngayVaoDoan: '',
  toChucXaHoi: '',
  ngayNhapNgu: '',
  ngayXuatNgu: '',
  ngayTaiNgu: '', // Ngày tái ngũ, nếu có (Mục 18)
  trinhDoGDPT: '',
  trinhDoGDNN: '',
  trinhDoDHSauDH: '',
  hocVi: '',
  hocHam: '',
  lyLuanChinhTri: '',
  ngoaiNgu: '',
  tinHoc: '',
  sucKhoe: '',
  thuongBinhLoai: '',
  giadinhLietSy: false,
  giadinhCoCong: false,
  soCMND: '',
  soCMTQD: '',
  ngayMienCongTac: '',
  khenThuong: '',
  huyhieuDang: '',
  danhHieu: '',
  kyLuat: '',
  soQuyetDinhKhenThuong: '',

  // Nhóm trường lịch sử bản thân (Mục 27/31)
  bixoaten: '',
  ngayVaoDang2: '',
  chiBoVaoDang2: '',
  nguoiGioiThieu1_2: '',
  chucVuNGT1_2: '',
  nguoiGioiThieu2_2: '',
  chucVuNGT2_2: '',
  ngayChinhThuc2: '',
  chiBoChinhThuc2: '',
  ngayKhoiPhuc: '',
  chiBoKhoiPhuc: '',
  xuLyPhapLuat: '',
  cheDocU: '',
  
  // Nhóm trường quan hệ nước ngoài (Mục 28/32)
  foreignTravel: '',
  foreignOrgs: '',
  foreignRelatives: '',
  
  // Nhóm trường hoàn cảnh kinh tế (Mục 30/34)
  totalIncome: '',
  perCapitaIncome: '',
  houseRent: '',
  houseRentArea: '',
  houseOwned: '',
  houseOwnedArea: '',
  landAllocated: '',
  landOwned: '',
  economicActivity: '',
  farmArea: '',
  hiredLabor: '',
  valuableAssets: '',
  assetValue: '',
  
  // Danh sách quan hệ gia đình và các mảng dữ liệu con khác (Mục 29/33)
  quanHeGiaDinh: [],
  employments: [],
  trainings: [],
  rankHistories: [],
  evaluations: [],
};

export default function MemberFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEdit) {
      fetchMember();
    }
  }, [id]);

  // Tự động giãn chiều cao cho toàn bộ ô textarea theo nội dung nhập
  useEffect(() => {
    const handleInput = (e) => {
      if (e.target.tagName === 'TEXTAREA' && e.target.classList.contains('form-input')) {
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
      }
    };

    document.addEventListener('input', handleInput);

    // Chỉnh chiều cao ngay lần đầu render hoặc khi dữ liệu được nạp lại
    const textareas = document.querySelectorAll('textarea.form-input');
    textareas.forEach((ta) => {
      setTimeout(() => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      }, 50);
    });

    return () => {
      document.removeEventListener('input', handleInput);
    };
  }, [
    formData.quanHeGiaDinh,
    formData.bixoaten,
    formData.xuLyPhapLuat,
    formData.cheDocU,
    formData.foreignTravel,
    formData.foreignOrgs,
    formData.foreignRelatives,
    formData.economicActivity,
    formData.valuableAssets
  ]);

  const fetchMember = async () => {
    setLoading(true);
    try {
      const res = await memberApi.getById(id);
      const m = res.data;
      
      const isBiThu = user?.role === ROLES.BI_THU;
      const isCanBo = user?.role === ROLES.CAN_BO_CHINH_TRI;
      
      const canEdit =
        (isBiThu && m.ToChucDangId === user?.orgId) ||
        (isCanBo && m.ToChucDang?.ParentId === null);
        
      if (!canEdit) {
        toast.error("Bạn không có quyền chỉnh sửa hồ sơ này!");
        navigate('/members');
        return;
      }

      // API trả về theo tên field của DB (PascalCase), còn state form dùng key camelCase nội bộ,
      // nên đoạn này đóng vai trò lớp chuyển đổi DB sang form (chiều ngược lại nằm ở handleSubmit).
      setFormData({
        fullName: m.HoTenDangDung || '',
        birthName: m.HoTenKhaiSinh || '',
        gender: m.GioiTinh || '',
        dob: formatDateForInput(m.NgaySinh),
        placeOfBirth: m.NoiSinh || '',
        hometown: m.QueQuan || '',
        residence: m.NoiThuongTru || '',
        temporaryResidence: m.NoiTamTru || '',
        ethnic: m.DanToc || '',
        religion: m.TonGiao || '',
        familyBackground: m.ThanhPhanGiaDinh || '',
        occupation: m.NgheNghiepHienNay || '',
        ngheNghiepKhiVaoDang: m.NgheNghiepKhiVaoDang || '',
        rank: m.CapBac || '',
        congViecChinhDangLam: m.CongViecChinh || '',
        soLyLich: m.SoLyLich || '',
        soTheDangVien: m.SoTheDangVien || '',
        trangThai: m.TrangThai || 'HOAT_DONG',
        ngayVaoDang: formatDateForInput(m.NgayVaoDang),
        chiBoVaoDang: m.ChiBoVaoDang || '',
        nguoiGioiThieu1: m.NguoiGioiThieu1 || '',
        chucVuNGT1: m.ChucVuNGT1 || '',
        nguoiGioiThieu2: m.NguoiGioiThieu2 || '',
        chucVuNGT2: m.ChucVuNGT2 || '',
        ngayQuyetDinhKetNap: formatDateForInput(m.NgayQuyetDinhKetNap),
        ngayChinhThuc: formatDateForInput(m.NgayChinhThuc),
        chiBoChinhThuc: m.ChiBoChinhThuc || '',
        noiSinhHoatDang: m.NoiSinhHoatDang || '',
        chucVuDang: m.ChucVuDang || '',
        ngayTuyenDung: formatDateForInput(m.NgayTuyenDung),
        coQuanTuyenDung: m.CoQuanTuyenDung || '',
        ngayVaoDoan: formatDateForInput(m.NgayVaoDoan),
        toChucXaHoi: m.ToChucXaHoi || '',
        ngayNhapNgu: formatDateForInput(m.NgayNhapNgu),
        ngayXuatNgu: formatDateForInput(m.NgayXuatNgu),
        ngayTaiNgu: formatDateForInput(m.NgayTaiNgu),
        trinhDoGDPT: m.GiaoDucPhoThong || '',
        trinhDoGDNN: m.GiaoDucNgheNghiep || '',
        trinhDoDHSauDH: m.GiaoDucDaiHoc || '',
        hocVi: m.HocVi || '',
        hocHam: m.HocHam || '',
        lyLuanChinhTri: m.LyLuanChinhTri || '',
        ngoaiNgu: m.NgoaiNgu || '',
        tinHoc: m.TinHoc || '',
        sucKhoe: m.TinhTrangSucKhoe || '',
        thuongBinhLoai: m.ThuongBinhLoai || '',
        giadinhLietSy: m.GiaDinhLietSy || false,
        giadinhCoCong: m.GiaDinhCoCong || false,
        soCMND: m.SoCMND || '',
        soCMTQD: m.SoCMTQD || '',
        ngayMienCongTac: formatDateForInput(m.NgayMienCongTac),
        khenThuong: m.KhenThuong || '',
        huyhieuDang: m.HuyHieuDang || '',
        danhHieu: m.DanhHieuPhongTang || '',
        kyLuat: m.KyLuat || '',
        soQuyetDinhKhenThuong: m.QuyetDinhKhenThuong?.SoQuyetDinh || '',

        // Các trường lịch sử bản thân, lấy từ cột Json LichSuBanThan (giữ nguyên tên key nội bộ)
        bixoaten: m.LichSuBanThan?.bixoaten || '',
        ngayVaoDang2: formatDateForInput(m.LichSuBanThan?.ngayVaoDang2),
        chiBoVaoDang2: m.LichSuBanThan?.chiBoVaoDang2 || '',
        nguoiGioiThieu1_2: m.LichSuBanThan?.nguoiGioiThieu1_2 || '',
        chucVuNGT1_2: m.LichSuBanThan?.chucVuNGT1_2 || '',
        nguoiGioiThieu2_2: m.LichSuBanThan?.nguoiGioiThieu2_2 || '',
        chucVuNGT2_2: m.LichSuBanThan?.chucVuNGT2_2 || '',
        ngayChinhThuc2: formatDateForInput(m.LichSuBanThan?.ngayChinhThuc2),
        chiBoChinhThuc2: m.LichSuBanThan?.chiBoChinhThuc2 || '',
        ngayKhoiPhuc: formatDateForInput(m.LichSuBanThan?.ngayKhoiPhuc),
        chiBoKhoiPhuc: m.LichSuBanThan?.chiBoKhoiPhuc || '',
        xuLyPhapLuat: m.LichSuBanThan?.xuLyPhapLuat || '',
        cheDocU: m.LichSuBanThan?.cheDocU || '',

        // Quan hệ nước ngoài, lấy từ cột Json QuanHeNuocNgoai
        foreignTravel: m.QuanHeNuocNgoai?.foreignTravel || '',
        foreignOrgs: m.QuanHeNuocNgoai?.foreignOrgs || '',
        foreignRelatives: m.QuanHeNuocNgoai?.foreignRelatives || '',

        // Hoàn cảnh kinh tế, lấy từ cột Json HoanCanhKinhTe
        totalIncome: m.HoanCanhKinhTe?.totalIncome || '',
        perCapitaIncome: m.HoanCanhKinhTe?.perCapitaIncome || '',
        houseRent: m.HoanCanhKinhTe?.houseRent || '',
        houseRentArea: m.HoanCanhKinhTe?.houseRentArea || '',
        houseOwned: m.HoanCanhKinhTe?.houseOwned || '',
        houseOwnedArea: m.HoanCanhKinhTe?.houseOwnedArea || '',
        landAllocated: m.HoanCanhKinhTe?.landAllocated || '',
        landOwned: m.HoanCanhKinhTe?.landOwned || '',
        economicActivity: m.HoanCanhKinhTe?.economicActivity || '',
        farmArea: m.HoanCanhKinhTe?.farmArea || '',
        hiredLabor: m.HoanCanhKinhTe?.hiredLabor || '',
        valuableAssets: m.HoanCanhKinhTe?.valuableAssets || '',
        assetValue: m.HoanCanhKinhTe?.assetValue || '',

        // Danh sách quan hệ gia đình, chuyển từ cấu trúc DB sang cấu trúc form
        quanHeGiaDinh: (m.QuanHeGiaDinh || []).map(qh => ({
          id: qh.Id, quanHe: qh.QuanHe || '', hoTen: qh.HoTen || '', namSinh: qh.NamSinh || '', thongTin: qh.ThongTin || ''
        })),
        employments: m.QuaTrinhCongTac?.map(emp => ({
          startDate: emp.TuThangNam ? formatDateForInput(emp.TuThangNam).substring(0, 7) : '',
          endDate: emp.DenThangNam ? formatDateForInput(emp.DenThangNam).substring(0, 7) : '',
          capBacChucVuDonVi: emp.LamGiChucVuDonVi || ''
        })) || [],
        trainings: m.QuaTrinhDaoTao?.map(t => ({
          schoolName: t.TenTruong || '',
          courseName: t.NganhHoc || '',
          fromDate: t.TuNgay ? formatDateForInput(t.TuNgay).substring(0, 7) : '',
          toDate: t.DenNgay ? formatDateForInput(t.DenNgay).substring(0, 7) : '',
          type: t.HinhThuc || '',
          certificate: t.VanBangCert || '',
          taiLieuUrl: t.TaiLieuUrl || '',
          taiLieuName: t.TaiLieuName || ''
        })) || [],
        rankHistories: m.LichSuQuanHam?.map(r => ({
          id: r.Id,
          rank: r.CapBac || '',
          chucVu: r.ChucVu || '',
          unit: r.DonVi || '',
          effectiveDate: r.NgayHieuLuc ? formatDateForInput(r.NgayHieuLuc) : '',
          decisionNumber: r.SoQuyetDinh || r.QuyetDinh?.SoQuyetDinh || '',
          quyetDinhId: r.QuyetDinhId || r.QuyetDinh?.Id || ''
        })) || [],
        evaluations: m.DanhGiaDangVien?.map(ev => ({
          id: ev.Id,
          year: ev.Nam,
          rank: ev.XepLoai || '',
          comment: ev.NhanXet || '',
          status: ev.TrangThai || 'APPROVED',
          soQuyetDinh: ev.SoQuyetDinh || ev.QuyetDinh?.SoQuyetDinh || '',
          quyetDinhId: ev.QuyetDinhId || ev.QuyetDinh?.Id || ''
        })) || [],
      });
    } catch {
      toast.error('Không thể tải thông tin đảng viên.');
      navigate('/members');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAddFamilyMember = () => {
    setFormData(prev => ({
      ...prev,
      quanHeGiaDinh: [...prev.quanHeGiaDinh, { quanHe: '', hoTen: '', namSinh: '', thongTin: '' }]
    }));
  };

  const handleRemoveFamilyMember = (index) => {
    setFormData(prev => ({
      ...prev,
      quanHeGiaDinh: prev.quanHeGiaDinh.filter((_, idx) => idx !== index)
    }));
  };

  const handleFamilyMemberChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.quanHeGiaDinh];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, quanHeGiaDinh: newList };
    });
  };

  const handleAddEmployment = () => {
    setFormData(prev => ({
      ...prev,
      employments: [...prev.employments, { startDate: '', endDate: '', capBacChucVuDonVi: '' }]
    }));
  };

  const handleRemoveEmployment = (index) => {
    setFormData(prev => ({
      ...prev,
      employments: prev.employments.filter((_, idx) => idx !== index)
    }));
  };

  const handleEmploymentChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.employments];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, employments: newList };
    });
  };

  const handleAddTraining = () => {
    setFormData(prev => ({
      ...prev,
      trainings: [...prev.trainings, { schoolName: '', courseName: '', fromDate: '', toDate: '', type: 'Chính quy', certificate: '', taiLieuUrl: '', taiLieuName: '' }]
    }));
  };

  const handleRemoveTraining = (index) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.filter((_, idx) => idx !== index)
    }));
  };

  const handleTrainingChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.trainings];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, trainings: newList };
    });
  };

  const handleAddRankHistory = () => {
    setFormData(prev => ({
      ...prev,
      rankHistories: [...prev.rankHistories, { rank: '', chucVu: '', unit: '', effectiveDate: '', decisionNumber: '', quyetDinhId: '' }]
    }));
  };

  const handleRemoveRankHistory = (index) => {
    setFormData(prev => ({
      ...prev,
      rankHistories: prev.rankHistories.filter((_, idx) => idx !== index)
    }));
  };

  const handleRankHistoryChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.rankHistories];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, rankHistories: newList };
    });
  };

  const handleAddEvaluation = () => {
    setFormData(prev => ({
      ...prev,
      evaluations: [...prev.evaluations, { year: new Date().getFullYear() - 1, rank: 'Tốt', comment: '', status: 'APPROVED', soQuyetDinh: '', quyetDinhId: '' }]
    }));
  };

  const handleRemoveEvaluation = (index) => {
    setFormData(prev => ({
      ...prev,
      evaluations: prev.evaluations.filter((_, idx) => idx !== index)
    }));
  };

  const handleEvaluationChange = (index, field, value) => {
    setFormData(prev => {
      const newList = [...prev.evaluations];
      newList[index] = { ...newList[index], [field]: value };
      return { ...prev, evaluations: newList };
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName || !formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên đang dùng là bắt buộc.';
    }
    if (!formData.gender) {
      newErrors.gender = 'Giới tính là bắt buộc.';
    }
    
    // Ngày sinh là trường bắt buộc
    if (!formData.dob) {
      newErrors.dob = 'Ngày sinh là bắt buộc.';
    } else {
      const dobDate = new Date(formData.dob);
      if (dobDate > new Date()) {
        newErrors.dob = 'Ngày sinh không thể ở tương lai.';
      }
      
      // Kiểm tra ngày vào Đảng phải hợp lý so với ngày sinh
      if (formData.ngayVaoDang) {
        const ngayVaoDangDate = new Date(formData.ngayVaoDang);
        if (ngayVaoDangDate <= dobDate) {
          newErrors.ngayVaoDang = 'Ngày vào Đảng phải sau ngày sinh.';
        } else {
          // Điều kiện kết nạp Đảng: phải đủ 18 tuổi trở lên
          let age = ngayVaoDangDate.getFullYear() - dobDate.getFullYear();
          const monthDiff = ngayVaoDangDate.getMonth() - dobDate.getMonth();
          const dayDiff = ngayVaoDangDate.getDate() - dobDate.getDate();
          if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
            age--;
          }
          if (age < 18) {
            newErrors.ngayVaoDang = 'Đảng viên phải từ đủ 18 tuổi trở lên tại thời điểm vào Đảng.';
          }
        }
        
        // Kiểm tra ngày trở thành đảng viên chính thức
        if (formData.ngayChinhThuc) {
          const ngayChinhThucDate = new Date(formData.ngayChinhThuc);
          if (ngayChinhThucDate < ngayVaoDangDate) {
            newErrors.ngayChinhThuc = 'Ngày chính thức phải sau ngày vào Đảng dự bị.';
          } else {
            // Thời gian dự bị tối thiểu là 12 tháng theo Điều lệ Đảng
            const diffTime = Math.abs(ngayChinhThucDate - ngayVaoDangDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < 365) {
              newErrors.ngayChinhThuc = 'Ngày chính thức phải cách ngày dự bị ít nhất 1 năm (12 tháng).';
            }
          }
        }
      }
    }

    // Ngày xuất ngũ phải nằm sau ngày nhập ngũ
    if (formData.ngayNhapNgu && formData.ngayXuatNgu) {
      if (new Date(formData.ngayXuatNgu) < new Date(formData.ngayNhapNgu)) {
        newErrors.ngayXuatNgu = 'Ngày xuất ngũ phải sau ngày nhập ngũ.';
      }
    }

    // Kiểm tra định dạng số thẻ đảng viên
    if (formData.soTheDangVien && formData.soTheDangVien.trim() !== "") {
      const cardNo = formData.soTheDangVien.trim();
      const regex = /^\d{2}\.\d{6}$/;
      if (!regex.test(cardNo)) {
        newErrors.soTheDangVien = 'Số thẻ Đảng viên phải gồm 8 chữ số chia làm 2 nhóm, ngăn cách bằng dấu chấm (VD: 30.000010)';
      } else {
        const parts = cardNo.split('.');
        const suffixNum = parseInt(parts[1], 10);
        if (suffixNum < 1 || suffixNum > 999999) {
          newErrors.soTheDangVien = 'Cụm số thứ hai phải nằm trong khoảng từ 000001 đến 999999';
        }
      }
    }

    // Kiểm tra định dạng số lý lịch
    if (formData.soLyLich && formData.soLyLich.trim() !== "") {
      const resumeNo = formData.soLyLich.trim().toUpperCase();
      const match = resumeNo.match(/^([A-Z]{2,3})[-/. ]?(\d{6}|\d{8})$/) || 
                    resumeNo.match(/^(\d{6}|\d{8})[-/. ]?([A-Z]{2,3})$/);
                    
      if (!match) {
        newErrors.soLyLich = 'Định dạng chuẩn: 6 hoặc 8 chữ số kèm 2-3 chữ ký hiệu (VD: 000001-HN hoặc HN-000001)';
      } else {
        let numStr, abbr;
        if (isNaN(Number(match[1]))) {
          abbr = match[1];
          numStr = match[2];
        } else {
          numStr = match[1];
          abbr = match[2];
        }
        
        const num = parseInt(numStr, 10);
        const numLen = numStr.length;
        
        if (numLen === 8) {
          if (num < 72000001 || num > 72009999) {
            newErrors.soLyLich = 'Cụm số lý lịch 8 chữ số (Đảng bộ Ngoài nước) phải nằm trong khoảng từ 72000001 đến 72009999';
          }
        } else if (numLen === 6) {
          const isCentralOrPolice = ['CATW', 'CA', 'CCQ', 'TW', 'CCQTW'].includes(abbr);
          if (isCentralOrPolice) {
            if (num < 1 || num > 99999) {
              newErrors.soLyLich = `Cụm số lý lịch của Đảng bộ ${abbr} phải nằm trong khoảng từ 000001 đến 099999`;
            }
          } else {
            if (num < 1 || num > 999999) {
              newErrors.soLyLich = 'Cụm số lý lịch 6 chữ số phải nằm trong khoảng từ 000001 đến 999999';
            }
          }
        }
      }
    }

    // Validate năm của các xếp loại thêm mới
    if (Array.isArray(formData.evaluations)) {
      const currentYear = new Date().getFullYear();
      for (let i = 0; i < formData.evaluations.length; i++) {
        const ev = formData.evaluations[i];
        if (!ev.id) { // Chỉ validate bản ghi thêm mới (chưa lưu DB)
          if (!ev.year) {
            newErrors.evaluations = 'Năm xếp loại là bắt buộc.';
            break;
          }
          if (ev.year >= currentYear) {
            newErrors.evaluations = `Chỉ được phép thêm các xếp loại còn thiếu từ những năm trước năm hiện tại (trước năm ${currentYear}).`;
            break;
          }
        }
      }
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    if (!isValid) {
      toast.error('Vui lòng kiểm tra và sửa lại các thông tin lỗi hiển thị trên biểu mẫu!');
    }
    return isValid;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // Chuyển ngược lại từ state form (camelCase nội bộ) sang payload đúng tên field DB (PascalCase)
      const payload = {
        HoTenDangDung: formData.fullName,
        HoTenKhaiSinh: formData.birthName,
        GioiTinh: formData.gender,
        NgaySinh: formData.dob,
        NoiSinh: formData.placeOfBirth,
        QueQuan: formData.hometown,
        NoiThuongTru: formData.residence,
        NoiTamTru: formData.temporaryResidence,
        DanToc: formData.ethnic,
        TonGiao: formData.religion,
        ThanhPhanGiaDinh: formData.familyBackground,
        NgheNghiepHienNay: formData.occupation,
        NgheNghiepKhiVaoDang: formData.ngheNghiepKhiVaoDang,
        CapBac: formData.rank,
        CongViecChinh: formData.congViecChinhDangLam,
        SoLyLich: formData.soLyLich,
        SoTheDangVien: formData.soTheDangVien,
        TrangThai: formData.trangThai,
        NgayVaoDang: formData.ngayVaoDang,
        ChiBoVaoDang: formData.chiBoVaoDang,
        NguoiGioiThieu1: formData.nguoiGioiThieu1,
        ChucVuNGT1: formData.chucVuNGT1,
        NguoiGioiThieu2: formData.nguoiGioiThieu2,
        ChucVuNGT2: formData.chucVuNGT2,
        NgayQuyetDinhKetNap: formData.ngayQuyetDinhKetNap,
        NgayChinhThuc: formData.ngayChinhThuc,
        ChiBoChinhThuc: formData.chiBoChinhThuc,
        NoiSinhHoatDang: formData.noiSinhHoatDang,
        ChucVuDang: formData.chucVuDang,
        NgayTuyenDung: formData.ngayTuyenDung,
        CoQuanTuyenDung: formData.coQuanTuyenDung,
        NgayVaoDoan: formData.ngayVaoDoan,
        ToChucXaHoi: formData.toChucXaHoi,
        NgayNhapNgu: formData.ngayNhapNgu,
        NgayXuatNgu: formData.ngayXuatNgu,
        NgayTaiNgu: formData.ngayTaiNgu,
        GiaoDucPhoThong: formData.trinhDoGDPT,
        GiaoDucNgheNghiep: formData.trinhDoGDNN,
        GiaoDucDaiHoc: formData.trinhDoDHSauDH,
        HocVi: formData.hocVi,
        HocHam: formData.hocHam,
        LyLuanChinhTri: formData.lyLuanChinhTri,
        NgoaiNgu: formData.ngoaiNgu,
        TinHoc: formData.tinHoc,
        TinhTrangSucKhoe: formData.sucKhoe,
        ThuongBinhLoai: formData.thuongBinhLoai,
        GiaDinhLietSy: formData.giadinhLietSy,
        GiaDinhCoCong: formData.giadinhCoCong,
        SoCMND: formData.soCMND,
        SoCMTQD: formData.soCMTQD,
        NgayMienCongTac: formData.ngayMienCongTac,
        KhenThuong: formData.khenThuong,
        HuyHieuDang: formData.huyhieuDang,
        DanhHieuPhongTang: formData.danhHieu,
        KyLuat: formData.kyLuat,
        SoQuyetDinhKhenThuong: formData.soQuyetDinhKhenThuong,
      };

      // Các cột kiểu Json tự do: giữ nguyên key camelCase bên trong, chỉ cần đúng tên cột DB bao ngoài
      payload.LichSuBanThan = {
        bixoaten: formData.bixoaten || '',
        ngayVaoDang2: formData.ngayVaoDang2 ? new Date(formData.ngayVaoDang2) : null,
        chiBoVaoDang2: formData.chiBoVaoDang2 || '',
        nguoiGioiThieu1_2: formData.nguoiGioiThieu1_2 || '',
        chucVuNGT1_2: formData.chucVuNGT1_2 || '',
        nguoiGioiThieu2_2: formData.nguoiGioiThieu2_2 || '',
        chucVuNGT2_2: formData.chucVuNGT2_2 || '',
        ngayChinhThuc2: formData.ngayChinhThuc2 ? new Date(formData.ngayChinhThuc2) : null,
        chiBoChinhThuc2: formData.chiBoChinhThuc2 || '',
        ngayKhoiPhuc: formData.ngayKhoiPhuc ? new Date(formData.ngayKhoiPhuc) : null,
        chiBoKhoiPhuc: formData.chiBoKhoiPhuc || '',
        xuLyPhapLuat: formData.xuLyPhapLuat || '',
        cheDocU: formData.cheDocU || '',
      };
      payload.QuanHeNuocNgoai = {
        foreignTravel: formData.foreignTravel || '',
        foreignOrgs: formData.foreignOrgs || '',
        foreignRelatives: formData.foreignRelatives || '',
      };
      payload.HoanCanhKinhTe = {
        totalIncome: formData.totalIncome || '',
        perCapitaIncome: formData.perCapitaIncome || '',
        houseRent: formData.houseRent || '',
        houseRentArea: formData.houseRentArea || '',
        houseOwned: formData.houseOwned || '',
        houseOwnedArea: formData.houseOwnedArea || '',
        landAllocated: formData.landAllocated || '',
        landOwned: formData.landOwned || '',
        economicActivity: formData.economicActivity || '',
        farmArea: formData.farmArea || '',
        hiredLabor: formData.hiredLabor || '',
        valuableAssets: formData.valuableAssets || '',
        assetValue: formData.assetValue || '',
      };

      payload.QuanHeGiaDinh = formData.quanHeGiaDinh.map(qh => ({
        Id: qh.id,
        QuanHe: qh.quanHe || '',
        HoTen: qh.hoTen || '',
        NamSinh: String(qh.namSinh || ''),
        ThongTin: qh.thongTin || ''
      }));

      payload.QuaTrinhCongTac = formData.employments.map(emp => ({
        TuThangNam: emp.startDate ? new Date(emp.startDate + "-01") : new Date(),
        DenThangNam: emp.endDate ? new Date(emp.endDate + "-01") : null,
        LamGiChucVuDonVi: emp.capBacChucVuDonVi
      }));

      payload.QuaTrinhDaoTao = formData.trainings.map(t => ({
        TenTruong: t.schoolName,
        NganhHoc: t.courseName,
        TuNgay: t.fromDate ? new Date(t.fromDate + "-01") : new Date(),
        DenNgay: t.toDate ? new Date(t.toDate + "-01") : new Date(),
        HinhThuc: t.type,
        VanBangCert: t.certificate,
        TaiLieuUrl: t.taiLieuUrl || null,
        TaiLieuName: t.taiLieuName || null
      }));

      payload.LichSuQuanHam = formData.rankHistories.map(r => ({
        Id: r.id,
        CapBac: r.rank,
        ChucVu: r.chucVu,
        DonVi: r.unit,
        NgayHieuLuc: r.effectiveDate ? new Date(r.effectiveDate) : new Date(),
        SoQuyetDinh: r.decisionNumber,
        QuyetDinhId: r.quyetDinhId || null
      }));

      payload.DanhGiaDangVien = formData.evaluations.map(ev => ({
        Id: ev.id,
        Nam: parseInt(ev.year, 10) || new Date().getFullYear(),
        XepLoai: ev.rank,
        NhanXet: ev.comment || '',
        TrangThai: ev.status || 'APPROVED',
        SoQuyetDinh: ev.soQuyetDinh || null,
        QuyetDinhId: ev.quyetDinhId || null
      }));

      // Chuyển các trường chuỗi rỗng thành undefined để tránh ghi đè dữ liệu cũ khi cập nhật, các trường boolean thì giữ nguyên
      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') payload[key] = undefined;
      });

      if (isEdit) {
        await memberApi.update(id, payload);
        toast.success('Cập nhật đảng viên thành công.');
        navigate('/members');
      } else {
        await memberApi.create(payload);
        toast.success('Thêm đảng viên thành công.');
        navigate('/members');
      }
    } catch (err) {
      console.error('Lỗi khi lưu hồ sơ đảng viên:', err);
      toast.error(err.message || 'Có lỗi xảy ra.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page">
      <button
        className="btn btn-outline btn-sm"
        onClick={() => navigate('/members')}
        style={{ marginBottom: 'var(--spacing-lg)' }}
      >
        <span>Quay lại danh sách</span>
        <FiArrowLeft />
      </button>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            {isEdit ? 'Chỉnh sửa hồ sơ đảng viên' : 'Thêm đảng viên mới'}
          </h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Phần 1 - Lý lịch cơ bản (Mục 01-12) */}
          <PersonalInfoSection
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />

          {/* Phần 2 - Kết nạp Đảng và sinh hoạt hiện nay (Mục 13-14) */}
          <PartyMembershipSection
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />

          {/* Phần 3 - Tuyển dụng, Đoàn thanh niên và quân ngũ (Mục 15-18) */}
          <MilitarySection
            formData={formData}
            handleChange={handleChange}
            errors={errors}
          />

          {/* Phần 4 - Trình độ học vấn và chuyên môn (Mục 19) */}
          <EducationSection
            formData={formData}
            handleChange={handleChange}
          />

          {/* Phần 5 - Sức khỏe, giấy tờ tùy thân và miễn sinh hoạt (Mục 20-22) */}
          <HealthDocsSection
            formData={formData}
            handleChange={handleChange}
          />

          {/* Phần 6 - Tóm tắt quá trình công tác (Mục 23) */}
          <WorkHistorySection
            formData={formData}
            handleAddEmployment={handleAddEmployment}
            handleRemoveEmployment={handleRemoveEmployment}
            handleEmploymentChange={handleEmploymentChange}
          />

          {/* Phần 7 - Quá trình đào tạo, bồi dưỡng (Mục 24) */}
          <TrainingSection
            formData={formData}
            handleAddTraining={handleAddTraining}
            handleRemoveTraining={handleRemoveTraining}
            handleTrainingChange={handleTrainingChange}
            isEdit={isEdit}
            id={id}
          />

          {/* Phần 8 - Khen thưởng, kỷ luật và đánh giá xếp loại (Mục 25-29) */}
          <EvaluationsSection
            formData={formData}
            handleChange={handleChange}
            handleAddEvaluation={handleAddEvaluation}
            handleRemoveEvaluation={handleRemoveEvaluation}
            handleEvaluationChange={handleEvaluationChange}
            isEdit={isEdit}
            id={id}
            setFormData={setFormData}
            errors={errors}
          />

          {/* Phần 9 - Lịch sử phong, thăng quân hàm (Mục 30) */}
          <RankHistorySection
            formData={formData}
            handleAddRankHistory={handleAddRankHistory}
            handleRemoveRankHistory={handleRemoveRankHistory}
            handleRankHistoryChange={handleRankHistoryChange}
            isEdit={isEdit}
            id={id}
          />

          {/* Phần 10 - Lịch sử bản thân, quan hệ nước ngoài và thân nhân (Mục 31-33) */}
          <FamilySection
            formData={formData}
            handleChange={handleChange}
            handleAddFamilyMember={handleAddFamilyMember}
            handleRemoveFamilyMember={handleRemoveFamilyMember}
            handleFamilyMemberChange={handleFamilyMemberChange}
          />

          {/* Phần 11 - Hoàn cảnh kinh tế (Mục 34) */}
          <EconomicSection
            formData={formData}
            handleChange={handleChange}
          />

          {/* Các nút Lưu / Hủy ở cuối form */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-xl)',
              paddingTop: 'var(--spacing-lg)',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <button type="submit" className="btn btn-accent" disabled={submitting}>
              <span>{submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm đảng viên'}</span>
              <FiSave />
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/members')}
              disabled={submitting}
            >
              Hủy bỏ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
