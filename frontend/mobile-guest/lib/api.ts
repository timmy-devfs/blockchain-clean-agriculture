import axios from "axios";
// Import file dữ liệu giả vừa tạo
import { MOCK_ANNOUNCEMENTS, MOCK_PRODUCTS, MOCK_ARTICLES, MOCK_TRACE_RESULT } from "./mockData";

const API_URL = process.env.EXPO_PUBLIC_API_URL;

//  Hàm tiện ích: Chuyển tiếng Việt có dấu thành không dấu
const removeVietnameseTones = (str: string) => {
    if (!str) return "";
    return str
        .normalize("NFD") // Tách các dấu thanh ra khỏi chữ cái
        .replace(/[\u0300-\u036f]/g, "") // Loại bỏ các dấu thanh đó
        .replace(/đ/g, "d") // Xử lý riêng chữ đ thường
        .replace(/Đ/g, "D") // Xử lý riêng chữ Đ hoa
        .toLowerCase(); // Đưa tất cả về chữ thường
};

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Đổi thành false khi Backend của em đã bật và có data
const USE_MOCK = true;

// Giả lập thời gian delay của mạng (0.5 giây) để test các hiệu ứng Loading
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const guestApi = {
    // 1. Truy xuất nguồn gốc
    traceProduct: async (qrCode: string) => {
        if (USE_MOCK) {
            await delay(500);
            return MOCK_TRACE_RESULT;
        }
        return api.get(`/api/public/trace/${qrCode}`).then((res) => res.data.data ?? res.data);
    },

    // 2. Tìm kiếm sản phẩm
    getProducts: async (params?: any) => {
        if (USE_MOCK) {
            await delay(500);
            let filteredProducts = [...MOCK_PRODUCTS];

            // Lọc theo từ khóa thông minh (Hỗ trợ gõ không dấu)
            if (params?.keyword) {
                // Chuyển từ khóa người dùng gõ thành không dấu
                const searchKey = removeVietnameseTones(params.keyword);

                filteredProducts = filteredProducts.filter(p => {
                    // Chuyển tên sản phẩm và tên nông trại thành không dấu để so sánh
                    const normalizedName = removeVietnameseTones(p.name);
                    const normalizedFarm = removeVietnameseTones(p.farmName);

                    return normalizedName.includes(searchKey) || normalizedFarm.includes(searchKey);
                });
            }

            // Lọc theo tỉnh thành...
            if (params?.province && params.province !== "Tất cả") {
                filteredProducts = filteredProducts.filter(p => p.province === params.province);
            }

            return {
                content: filteredProducts,
                last: true,
                number: 0
            };
        }
        return api.get("/api/public/products", { params }).then((res) => res.data.data ?? res.data);
    },

    // 3. Chi tiết 1 sản phẩm
    getProductDetail: async (id: string) => {
        if (USE_MOCK) {
            await delay(500);
            return MOCK_PRODUCTS.find(p => p.id === id) || MOCK_PRODUCTS[0];
        }
        return api.get(`/api/public/products/${id}`).then((res) => res.data.data ?? res.data);
    },

    // 4. Sản phẩm nổi bật
    getFeaturedProducts: async () => {
        if (USE_MOCK) {
            await delay(500);
            return MOCK_PRODUCTS;
        }
        return api.get("/api/public/products/featured").then((res) => res.data.data ?? res.data);
    },

    // 5. Danh sách bài viết
    getArticles: async (params?: any) => {
        if (USE_MOCK) {
            await delay(500);

            // Biến đổi (Map) các Thông báo thành chuẩn cấu trúc của Bài viết
            const mappedAnnouncements = MOCK_ANNOUNCEMENTS.map(a => ({
                id: a.id,
                title: a.title,
                content: a.content,
                category: "Thông báo",
                publishedAt: a.startAt,
                viewCount: 0,
                imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=500&q=80"
            }));

            // Trộn chung Bài viết và Thông báo lại với nhau
            let allItems = [...MOCK_ARTICLES, ...mappedAnnouncements];

            // Lọc theo Category
            if (params?.category && params.category !== "Tất cả") {
                allItems = allItems.filter(item => item.category === params.category);
            }

            // Sắp xếp bài mới nhất lên đầu
            allItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

            return {
                content: allItems,
                last: true,
                number: 0
            };
        }
        return api.get("/api/public/articles", { params }).then((res) => res.data.data ?? res.data);
    },

    // 6. Chi tiết bài viết 
    getArticleDetail: async (id: string) => {
        if (USE_MOCK) {
            await delay(500);

            // 1. Tìm xem có phải là Bài viết thông thường không?
            const foundArticle = MOCK_ARTICLES.find(a => a.id === id);
            if (foundArticle) return foundArticle;

            // 2. 🚀 Nếu không thấy, tìm xem có phải là Thông báo/Khuyến mãi không?
            const foundAnnouncement = MOCK_ANNOUNCEMENTS.find(a => a.id === id);
            if (foundAnnouncement) {
                // Ánh xạ (Map) dữ liệu Thông báo thành cấu trúc của một Bài viết
                return {
                    id: foundAnnouncement.id,
                    title: foundAnnouncement.title,
                    content: foundAnnouncement.content,
                    category: "Thông báo", // Đặt category cứng là Thông báo
                    publishedAt: foundAnnouncement.startAt,
                    viewCount: 0,
                    imageUrl: "https://images.unsplash.com/photo-1607083206968-13611e3d76db?w=500&q=80" // Ảnh minh họa khuyến mãi
                };
            }

            return MOCK_ARTICLES[0]; // Fallback an toàn
        }
        return api.get(`/api/public/articles/${id}`).then((res) => res.data.data ?? res.data);
    },

    // 7. Thông báo chung
    getAnnouncements: async () => {
        if (USE_MOCK) {
            await delay(500);
            return MOCK_ANNOUNCEMENTS;
        }
        return api.get("/api/public/announcements").then((res) => res.data.data ?? res.data);
    },
};

export default api;