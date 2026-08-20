export function getCommitteeRole(member) {
  if (!member) return null;

  // Ưu tiên 1: đọc trực tiếp trường chức vụ Đảng hiện tại của đảng viên
  const cvDang = (member.ChucVuDang || "").toLowerCase().trim();
  if (cvDang) {
    if (cvDang.includes("bí thư Đảng bộ") || cvDang.includes("btđu")) {
      return { roleName: "Bí thư Đảng bộ", level: 1, title: member.ChucVuDang };
    }
    if (cvDang.includes("phó bí thư Đảng bộ") || cvDang.includes("pbtđu")) {
      return {
        roleName: "Phó Bí thư Đảng bộ",
        level: 2,
        title: member.ChucVuDang,
      };
    }
    if (cvDang.includes("Đảng bộ viên") || cvDang.includes("đuv")) {
      return { roleName: "Đảng bộ viên", level: 3, title: member.ChucVuDang };
    }
    if (
      cvDang.includes("bí thư chi bộ") ||
      cvDang.includes("btcb") ||
      cvDang.includes("bí thư")
    ) {
      return { roleName: "Bí thư Chi bộ", level: 4, title: member.ChucVuDang };
    }
    if (
      cvDang.includes("phó bí thư chi bộ") ||
      cvDang.includes("pbtcb") ||
      cvDang.includes("phó bí thư")
    ) {
      return {
        roleName: "Phó Bí thư Chi bộ",
        level: 5,
        title: member.ChucVuDang,
      };
    }
    if (
      cvDang.includes("chi ủy viên") ||
      cvDang.includes("cuv") ||
      cvDang.includes("cấp ủy viên") ||
      cvDang.includes("ủy viên ban chấp hành")
    ) {
      return { roleName: "Chi ủy viên", level: 6, title: member.ChucVuDang };
    }
  }

  // Ưu tiên 2: chưa có chức vụ Đảng ghi trực tiếp thì dò trong lịch sử công tác, lấy bản ghi mới nhất
  const employments = member.QuaTrinhCongTac || [];
  if (employments.length > 0) {
    const sortedEmployments = [...employments].sort(
      (a, b) => new Date(b.TuThangNam) - new Date(a.TuThangNam),
    );
    const latestPos = (
      sortedEmployments[0].LamGiChucVuDonVi || ""
    ).toLowerCase();
    const posTitle = sortedEmployments[0].LamGiChucVuDonVi;

    if (latestPos.includes("bí thư Đảng bộ") || latestPos.includes("btđu")) {
      return { roleName: "Bí thư Đảng bộ", level: 1, title: posTitle };
    }
    if (
      latestPos.includes("phó bí thư Đảng bộ") ||
      latestPos.includes("pbtđu")
    ) {
      return { roleName: "Phó Bí thư Đảng bộ", level: 2, title: posTitle };
    }
    if (latestPos.includes("Đảng bộ viên") || latestPos.includes("đuv")) {
      return { roleName: "Đảng bộ viên", level: 3, title: posTitle };
    }
    if (
      latestPos.includes("bí thư chi bộ") ||
      latestPos.includes("btcb") ||
      latestPos.includes("bí thư")
    ) {
      return { roleName: "Bí thư Chi bộ", level: 4, title: posTitle };
    }
    if (
      latestPos.includes("phó bí thư chi bộ") ||
      latestPos.includes("pbtcb") ||
      latestPos.includes("phó bí thư")
    ) {
      return { roleName: "Phó Bí thư Chi bộ", level: 5, title: posTitle };
    }
    if (
      latestPos.includes("chi ủy viên") ||
      latestPos.includes("cuv") ||
      latestPos.includes("cấp ủy viên") ||
      latestPos.includes("ủy viên ban chấp hành")
    ) {
      return { roleName: "Chi ủy viên", level: 6, title: posTitle };
    }
  }

  // Ưu tiên 3: vẫn không xác định được thì thử suy ra từ trường nghề nghiệp hiện nay
  const occLower = member.NgheNghiepHienNay?.toLowerCase() || "";
  if (occLower.includes("bí thư Đảng bộ") || occLower.includes("btđu")) {
    return { roleName: "Bí thư Đảng bộ", level: 1, title: "Bí thư Đảng bộ" };
  }
  if (occLower.includes("phó bí thư Đảng bộ") || occLower.includes("pbtđu")) {
    return {
      roleName: "Phó Bí thư Đảng bộ",
      level: 2,
      title: "Phó Bí thư Đảng bộ",
    };
  }
  if (occLower.includes("Đảng bộ viên") || occLower.includes("đuv")) {
    return { roleName: "Đảng bộ viên", level: 3, title: "Đảng bộ viên" };
  }
  if (
    occLower.includes("bí thư chi bộ") ||
    occLower.includes("btcb") ||
    occLower.includes("bí thư")
  ) {
    return { roleName: "Bí thư Chi bộ", level: 4, title: "Bí thư Chi bộ" };
  }
  if (
    occLower.includes("phó bí thư chi bộ") ||
    occLower.includes("pbtcb") ||
    occLower.includes("phó bí thư")
  ) {
    return {
      roleName: "Phó Bí thư Chi bộ",
      level: 5,
      title: "Phó Bí thư Chi bộ",
    };
  }
  if (occLower.includes("chi ủy viên") || occLower.includes("cuv")) {
    return { roleName: "Chi ủy viên", level: 6, title: "Chi ủy viên" };
  }

  // Trường hợp đặc biệt cho tài khoản demo dùng khi giới thiệu hệ thống
  if (member.HoTenDangDung === "Nguyễn Thế Anh") {
    return { roleName: "Chi ủy viên", level: 6, title: "Chi ủy viên (CUV)" };
  }

  return null;
}

export function computeCommitteeStats(members, organizations, selectedOrgId) {
  // Duyệt đệ quy để gom toàn bộ id của một tổ chức và mọi tổ chức con cháu của nó
  const getSubOrgIds = (orgId) => {
    const ids = [orgId];
    const visited = new Set([orgId]);
    const findChildren = (id) => {
      organizations.forEach((o) => {
        if (o.parentId === id && !visited.has(o.id)) {
          visited.add(o.id);
          ids.push(o.id);
          findChildren(o.id);
        }
      });
    };
    findChildren(orgId);
    return ids;
  };

  // Nếu có chọn một tổ chức cụ thể thì chỉ giữ đảng viên thuộc tổ chức đó hoặc các tổ chức con của nó
  const filteredMembers = selectedOrgId
    ? members.filter((m) =>
        getSubOrgIds(selectedOrgId).includes(m.ToChucDangId),
      )
    : members;

  // Chỉ giữ những người xác định được là thành viên cấp ủy, sắp theo thứ bậc từ cao xuống thấp
  const committeeMembers = filteredMembers
    .map((m) => {
      const commInfo = getCommitteeRole(m);
      if (!commInfo) return null;
      return {
        ...m,
        committeeRole: commInfo.roleName,
        committeeLevel: commInfo.level,
        committeeTitle: commInfo.title,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.committeeLevel - b.committeeLevel);

  const committeeCount = committeeMembers.length;

  const currentYear = new Date().getFullYear();
  let totalAge = 0;
  let totalPartyAge = 0;
  let advancedTheoryCount = 0;
  let postgraduateCount = 0;

  committeeMembers.forEach((m) => {
    // Cộng dồn tuổi đời để sau tính trung bình
    if (m.NgaySinh) {
      const birthYear = new Date(m.NgaySinh).getFullYear();
      if (!isNaN(birthYear)) {
        totalAge += currentYear - birthYear;
      }
    }

    // Cộng dồn tuổi Đảng để sau tính trung bình
    if (m.NgayVaoDang) {
      const joinYear = new Date(m.NgayVaoDang).getFullYear();
      if (!isNaN(joinYear)) {
        totalPartyAge += currentYear - joinYear;
      }
    }

    // Đếm những người có trình độ lý luận chính trị cao cấp hoặc cử nhân
    const theory = m.LyLuanChinhTri?.toLowerCase() || "";
    if (theory.includes("cao cấp") || theory.includes("cử nhân")) {
      advancedTheoryCount++;
    }

    // Đếm những người có trình độ sau đại học (thạc sĩ, tiến sĩ)
    const edu = m.GiaoDucDaiHoc?.toLowerCase() || "";
    const degree = m.HocVi?.toLowerCase() || "";
    if (
      edu.includes("thạc sĩ") ||
      edu.includes("tiến sĩ") ||
      degree.includes("thạc sĩ") ||
      degree.includes("tiến sĩ") ||
      degree.includes("tiến sỹ")
    ) {
      postgraduateCount++;
    }
  });

  const avgAge = committeeCount > 0 ? Math.round(totalAge / committeeCount) : 0;
  const avgPartyAge =
    committeeCount > 0 ? Math.round(totalPartyAge / committeeCount) : 0;
  const theoryPct =
    committeeCount > 0
      ? Math.round((advancedTheoryCount / committeeCount) * 100)
      : 0;
  const postgraduatePct =
    committeeCount > 0
      ? Math.round((postgraduateCount / committeeCount) * 100)
      : 0;

  // Đếm số lượng theo từng cấp bậc quân hàm trong tập thể cấp ủy
  const rankDist = {};
  committeeMembers.forEach((m) => {
    const key = m.CapBac || "Không có";
    rankDist[key] = (rankDist[key] || 0) + 1;
  });
  const rankList = Object.entries(rankDist).sort((a, b) => b[1] - a[1]);

  return {
    committeeMembers,
    committeeCount,
    avgAge,
    avgPartyAge,
    theoryPct,
    postgraduatePct,
    advancedTheoryCount,
    postgraduateCount,
    rankList,
  };
}
