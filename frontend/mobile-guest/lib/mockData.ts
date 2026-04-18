export const MOCK_ANNOUNCEMENTS = [
    {
        id: "A1",
        title: "Chương trình khuyến mãi mùa hè",
        content: "Giảm giá 10% cho tất cả các sản phẩm rau củ quả đạt chuẩn VietGAP khu vực Hà Nội.",
        startAt: "2024-05-01T00:00:00Z",
        endAt: "2024-06-01T00:00:00Z"
    },
    {
        id: "A2",
        title: "BICAP ra mắt hệ thống truy xuất mới",
        content: "Khách hàng nay có thể quét mã QR để xem trực tiếp lịch sử canh tác trên VeChain.",
        startAt: "2024-05-15T00:00:00Z",
        endAt: "2024-12-31T00:00:00Z"
    }
];

export const MOCK_PRODUCTS = [
    {
        id: "P1",
        name: "Dưa lưới Taki Nhật Bản",
        price: 85000,
        unit: "kg",
        province: "Lâm Đồng",
        farmName: "Nông trại Rạng Đông",
        imageUrl: "https://images.unsplash.com/photo-1598030304671-5aa1d6f21128?w=500&q=80",
        description: "Dưa lưới Taki được trồng theo phương pháp thủy canh nhà màng, đảm bảo độ ngọt tự nhiên và an toàn tuyệt đối.",
        inStock: true
    },
    {
        id: "P2",
        name: "Cà chua Cherry Organic",
        price: 45000,
        unit: "hộp 500g",
        province: "Hà Nội",
        farmName: "Trang trại Xanh Sóc Sơn",
        imageUrl: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&q=80",
        description: "Cà chua Cherry mọng nước, giàu vitamin C, đạt chứng nhận hữu cơ quốc tế.",
        inStock: true
    },
    {
        id: "P3",
        name: "Rau cải bó xôi (Spinach)",
        price: 30000,
        unit: "kg",
        province: "Hòa Bình",
        farmName: "Hợp tác xã Nông nghiệp Sạch",
        imageUrl: "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=500&q=80",
        description: "Cải bó xôi tươi xanh, cắt sương sớm lúc 5h sáng và vận chuyển thẳng đến siêu thị.",
        inStock: true
    }
];

export const MOCK_ARTICLES = [
    {
        id: "ART1",
        title: "Ứng dụng Blockchain trong truy xuất nguồn gốc nông sản",
        content: "Blockchain giúp tạo ra một cuốn sổ cái điện tử bất biến. Mọi thao tác gieo hạt, phun thuốc, bón phân đều được ghi nhận và không thể chỉnh sửa, mang lại niềm tin tuyệt đối cho người tiêu dùng...",
        category: "Công nghệ",
        imageUrl: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=500&q=80",
        publishedAt: "2024-05-18T08:30:00Z",
        viewCount: 1250
    },
    {
        id: "ART2",
        title: "Thế nào là tiêu chuẩn VietGAP?",
        content: "VietGAP (Vietnamese Good Agricultural Practices) là những nguyên tắc, trình tự, thủ tục hướng dẫn sản xuất, thu hoạch, xử lý sau thu hoạch nhằm đảm bảo an toàn...",
        category: "An toàn thực phẩm",
        imageUrl: "https://images.unsplash.com/photo-1592424001806-b333a9ceeb3c?w=500&q=80",
        publishedAt: "2024-05-10T09:00:00Z",
        viewCount: 842
    }
];

export const MOCK_TRACE_RESULT = {
    seasonId: "SS-2024-001",
    verified: true,
    farmInfo: {
        farmId: "FARM-01",
        farmName: "Nông trại Rạng Đông",
        province: "Lâm Đồng"
    },
    seasonInfo: {
        seasonId: "SS-2024-001",
        cropType: "Dưa lưới Taki",
        status: "EXPORTED"
    },
    timeline: [
        {
            status: "SOWING",
            note: "Tiến hành gieo hạt giống Dưa lưới Taki lô A1.",
            timestamp: "2024-02-01T07:00:00Z"
        },
        {
            status: "GROWING",
            note: "Bón phân hữu cơ đợt 1, kiểm tra độ ẩm đất.",
            timestamp: "2024-02-15T08:30:00Z"
        },
        {
            status: "HARVESTING",
            note: "Thu hoạch đợt 1. Tổng sản lượng đạt 5 tấn.",
            timestamp: "2024-04-20T06:00:00Z"
        },
        {
            status: "EXPORTED",
            note: "Đóng gói và xuất xưởng giao cho nhà bán lẻ.",
            timestamp: "2024-04-22T09:00:00Z"
        }
    ],
    explorerUrl: "https://explore-testnet.vechain.org"
};