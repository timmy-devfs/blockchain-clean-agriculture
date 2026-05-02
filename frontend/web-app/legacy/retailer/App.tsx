import "./styles.css";
import {
  BellOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  QrcodeOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Alert,
  AutoComplete,
  Badge,
  Button,
  Card,
  Carousel,
  Col,
  Divider,
  Form,
  Image,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Steps,
  Tabs,
  Tag,
  Timeline,
  Upload,
  message
} from "antd";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams
} from "react-router-dom";
import { QrReader } from "react-qr-reader";
import {
  callbackPaymentSuccess,
  confirmDelivery,
  createOrder,
  getKeywordSuggestions,
  getNotifications,
  getOrdersByStatus,
  getProductDetail,
  getShippingTimeline,
  loginRetailer,
  qrScanTrace,
  searchProducts
} from "./services/api";
import { Product, RetailOrder, RetailOrderStatus, SearchFilters } from "./types";

const { Header, Sider, Content } = Layout;

function DashboardHome() {
  return (
    <Card title="Retailer dashboard">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <p className="text-gray-600">Chào mừng đến BIC Retailer Console — truy cập marketplace và đơn hàng từ menu hoặc các nút dưới đây.</p>
        <Space wrap>
          <Link to="/marketplace">
            <Button type="primary">Marketplace</Button>
          </Link>
          <Link to="/orders">
            <Button>Đơn hàng</Button>
          </Link>
          <Link to="/qr-scan">
            <Button>QR Scan</Button>
          </Link>
          <Link to="/onboarding">
            <Button>Onboarding / đăng nhập token</Button>
          </Link>
        </Space>
      </Space>
    </Card>
  );
}

function App() {
  return (
    <Layout className="app">
      <Sider width={240} theme="light" className="sider">
        <div className="logo">Web Retailer</div>
        <Menu
          mode="inline"
          items={[
            { key: "dashboard", icon: <UserOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
            { key: "onboarding", icon: <KeyOutlined />, label: <Link to="/onboarding">Onboarding</Link> },
            { key: "search", icon: <SearchOutlined />, label: <Link to="/marketplace">Marketplace</Link> },
            { key: "orders", icon: <ShoppingCartOutlined />, label: <Link to="/orders">Orders</Link> },
            { key: "qr", icon: <QrcodeOutlined />, label: <Link to="/qr-scan">QR Scan</Link> },
            { key: "delivery", icon: <CheckCircleOutlined />, label: <Link to="/confirm-delivery">Confirm Delivery</Link> }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="header">
          <div className="title">BIC Retailer Console</div>
          <NotificationBell />
        </Header>
        <Content className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardHome />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/marketplace" element={<SearchPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/callback" element={<OrderCallbackPage />} />
            <Route path="/orders/success" element={<OrderSuccessPage />} />
            <Route path="/qr-scan" element={<QrScanPage />} />
            <Route path="/confirm-delivery" element={<ConfirmDeliveryPage />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
}

function NotificationBell() {
  const { data, isError } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30_000,
    retry: false
  });

  if (isError) {
    return (
      <span title="Tính năng đang được phát triển">
        <BellOutlined style={{ fontSize: 20, opacity: 0.45 }} />
      </span>
    );
  }

  const unread = (data ?? []).filter((item) => !item.read).length;
  return (
    <Badge count={unread} color="#ef4444">
      <BellOutlined style={{ fontSize: 20 }} />
    </Badge>
  );
}

function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [form] = Form.useForm();
  const [signEmail, setSignEmail] = useState("retailer@bicap.io");
  const [signPassword, setSignPassword] = useState("password");
  const [authBusy, setAuthBusy] = useState(false);

  const next = async () => {
    if (step === 0) {
      await form.validateFields();
    }
    setStep((v) => Math.min(v + 1, 2));
  };

  const onDemoLogin = async () => {
    setAuthBusy(true);
    try {
      await loginRetailer(signEmail.trim(), signPassword);
      message.success("Đăng nhập thành công — có thể dùng Search / Orders qua Gateway.");
    } catch {
      message.error("Đăng nhập thất bại. Kiểm tra Gateway (port 80/8080) và tài khoản demo.");
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <Card title="Đăng nhập & Onboarding">
      <Alert
        type="info"
        showIcon
        className="mb-4"
        message="Demo E2E: đăng nhập retailer@bicap.io / password (seed V4). Cần Gateway + identity-service."
      />
      <Space direction="vertical" size="middle" className="mb-6" style={{ width: "100%", maxWidth: 360 }}>
        <Input value={signEmail} onChange={(e) => setSignEmail(e.target.value)} placeholder="Email" />
        <Input.Password value={signPassword} onChange={(e) => setSignPassword(e.target.value)} placeholder="Mật khẩu" />
        <Button type="primary" loading={authBusy} onClick={() => void onDemoLogin()}>
          Đăng nhập hệ thống
        </Button>
      </Space>
      <Divider />
      <Steps current={step} items={[{ title: "Info" }, { title: "Address" }, { title: "Finish" }]} />
      <div className="section-gap">
        {step < 2 ? (
          <Form layout="vertical" form={form}>
            <Form.Item label="Retailer name" name="name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Button type="primary" onClick={() => void next()}>
              Next
            </Button>
          </Form>
        ) : (
          <Alert type="success" showIcon message="Onboarding completed" />
        )}
      </div>
    </Card>
  );
}

function SearchPage() {
  const [filters, setFilters] = useState<SearchFilters>({});
  const [keyword, setKeyword] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const query = useInfiniteQuery({
    queryKey: ["search-products", filters],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => searchProducts(filters, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    retry: false
  });

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting && query.hasNextPage && !query.isFetchingNextPage) {
        void query.fetchNextPage();
      }
    });
    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }
    return () => observer.disconnect();
  }, [query]);

  const products = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);

  if (query.isError) {
    return (
      <div className="text-center py-10 text-gray-400">
        Tính năng đang được phát triển
        {query.error instanceof Error ? (
          <p className="mt-2 text-xs text-gray-500">{query.error.message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <Row gutter={16}>
      <Col span={6}>
        <Card title="Filters sidebar">
          <Space direction="vertical" style={{ width: "100%" }}>
            <Select
              placeholder="Province"
              allowClear
              options={["Lam Dong", "Can Tho", "Dong Nai"].map((value) => ({ value }))}
              onChange={(value) => setFilters((prev) => ({ ...prev, province: value }))}
            />
            <Select
              placeholder="Category"
              allowClear
              options={["Vegetable", "Leafy"].map((value) => ({ value }))}
              onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
            />
            <InputNumber
              placeholder="Price min"
              style={{ width: "100%" }}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMin: typeof value === "number" ? value : undefined
                }))
              }
            />
            <InputNumber
              placeholder="Price max"
              style={{ width: "100%" }}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  priceMax: typeof value === "number" ? value : undefined
                }))
              }
            />
            <Select
              placeholder="Certification"
              allowClear
              options={[
                { value: "certified", label: "Certified" },
                { value: "uncertified", label: "Uncertified" }
              ]}
              onChange={(value) =>
                setFilters((prev) => ({
                  ...prev,
                  certified: value ? value === "certified" : undefined
                }))
              }
            />
          </Space>
        </Card>
      </Col>

      <Col span={18}>
        <Card title="Search: autocomplete + infinite scroll">
          <AutoComplete
            style={{ width: "100%" }}
            value={keyword}
            options={suggestions.map((s) => ({ value: s }))}
            onSearch={(value) => {
              setKeyword(value);
              void getKeywordSuggestions(value)
                .then((items) => setSuggestions(items))
                .catch(() => {
                  message.warning("Không tải được gợi ý từ máy chủ.");
                  setSuggestions([]);
                });
            }}
            onSelect={(value) => {
              setKeyword(value);
              setFilters((prev) => ({ ...prev, keyword: value }));
            }}
          >
            <Input.Search
              enterButton="Search"
              placeholder="Search product..."
              onSearch={(value) => setFilters((prev) => ({ ...prev, keyword: value.trim() || undefined }))}
            />
          </AutoComplete>

          <div className="section-gap">
            <Row gutter={[12, 12]}>
              {products.map((item) => (
                <Col span={8} key={item.id}>
                  <Card
                    cover={<Image preview={false} src={item.imageUrls?.[0]} className="card-image" />}
                    extra={<Tag color={item.certified ? "green" : "default"}>{item.certified ? "CERT" : "RAW"}</Tag>}
                  >
                    <Card.Meta title={item.title} description={`${item.province} · ${item.category}`} />
                    <div className="section-gap">
                      <Tag color="blue">{item.price.toLocaleString()} VND/kg</Tag>
                      <Button size="small" type="primary">
                        <Link to={`/products/${item.id}`}>Detail</Link>
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
            <div ref={sentinelRef} style={{ height: 28, marginTop: 12 }}>
              {query.isFetchingNextPage && <Spin />}
              {!query.hasNextPage && <small>End of list</small>}
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}

function ProductDetailPage() {
  const { id = "" } = useParams();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["product-detail", id],
    queryFn: () => getProductDetail(id),
    retry: false
  });

  const submitOrder = async () => {
    const values = await form.validateFields();
    try {
      const result = await createOrder({
        product: data as Product,
        quantity: values.quantity,
        address: values.address,
        gateway: values.gateway
      });
      if (result.skipPayment || !result.paymentUrl) {
        message.success("Đặt hàng thành công — đã bỏ qua thanh toán, đơn chuyển sang vận chuyển.");
        navigate(`/orders?tab=confirmed`);
        setOpen(false);
        return;
      }
      message.success("Order created, redirecting payment...");
      window.location.href = result.paymentUrl;
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Đặt hàng thất bại — kiểm tra API.");
    }
  };

  if (isError) {
    return (
      <div className="text-center py-10 text-gray-400">
        Tính năng đang được phát triển
        {error instanceof Error ? <p className="mt-2 text-xs text-gray-500">{error.message}</p> : null}
      </div>
    );
  }

  if (isLoading || !data) {
    return <Spin />;
  }

  return (
    <Card title="Product detail: carousel + farm card + season summary + txHash + OrderModal">
      <Row gutter={16}>
        <Col span={14}>
          <Carousel autoplay>
            {(data.imageUrls ?? []).map((url) => (
              <Image key={url} src={url} preview={false} className="carousel-image" />
            ))}
          </Carousel>
        </Col>
        <Col span={10}>
          <Card size="small" title="Farm card">
            <List
              size="small"
              dataSource={[
                `Product: ${data.title}`,
                `Province: ${data.province}`,
                `Category: ${data.category}`,
                `Farm: ${data.farmId}`
              ]}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          </Card>
          <Card size="small" title="Season summary" style={{ marginTop: 12 }}>
            <p>seasonId: {data.seasonId}</p>
            <p>
              txHash:{" "}
              {data.txHash ? <Tag color="green">{data.txHash}</Tag> : <Tag color="orange">Pending blockchain</Tag>}
            </p>
          </Card>
          <Space style={{ marginTop: 12 }}>
            <Button type="primary" onClick={() => setOpen(true)}>
              Place Order
            </Button>
            <Button onClick={() => navigate("/marketplace")}>Back</Button>
          </Space>
        </Col>
      </Row>

      <Modal title="Order flow: quantity -> address -> VNPay/MoMo" open={open} onCancel={() => setOpen(false)} onOk={() => void submitOrder()}>
        <Form form={form} layout="vertical">
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="address" label="Delivery address" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gateway" label="Payment gateway" rules={[{ required: true }]}>
            <Select options={[{ value: "VNPAY" }, { value: "MOMO" }]} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}

function OrderCallbackPage() {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const status = search.get("status");
  const orderId = search.get("orderId") ?? "";
  const gateway = (search.get("gateway") ?? "VNPAY") as "VNPAY" | "MOMO";

  useEffect(() => {
    if (status === "success" && orderId) {
      void callbackPaymentSuccess(orderId, gateway).then(() => {
        navigate(`/orders/success?orderId=${orderId}`, { replace: true });
      });
    }
  }, [gateway, navigate, orderId, status]);

  return <Spin tip="Processing callback..." />;
}

function OrderSuccessPage() {
  const [search] = useSearchParams();
  const orderId = search.get("orderId");
  return (
    <Card>
      <Alert type="success" showIcon message={`Payment success, order ${orderId} -> status PLACED`} />
      <div className="section-gap">
        <Button type="primary">
          <Link to="/orders">Go to Orders</Link>
        </Button>
      </div>
    </Card>
  );
}

function OrdersPage() {
  const location = useLocation();
  const [active, setActive] = useState<RetailOrderStatus>("PENDING_PAYMENT");
  const [timelines, setTimelines] = useState<Record<string, RetailOrder["shipmentTimeline"]>>({});

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["orders", active],
    queryFn: () => getOrdersByStatus(active),
    retry: false
  });

  useEffect(() => {
    if (location.search.includes("tab=shipping")) {
      setActive("SHIPPING");
    }
    if (location.search.includes("tab=confirmed")) {
      setActive("CONFIRMED");
    }
  }, [location.search]);

  const tabs: Array<{ key: RetailOrderStatus; label: string }> = [
    { key: "PENDING_PAYMENT", label: "Chờ thanh toán" },
    { key: "PLACED", label: "Đã đặt" },
    { key: "CONFIRMED", label: "Đã xác nhận" },
    { key: "SHIPPING", label: "Đang giao" },
    { key: "DELIVERED", label: "Hoàn tất" }
  ];

  if (isError) {
    return (
      <Card title="Đơn hàng">
        <Alert
          type="warning"
          showIcon
          message="Không tải được danh sách đơn hàng"
          description={error instanceof Error ? error.message : "Lỗi máy chủ hoặc mạng."}
        />
        <div className="text-center py-10 text-gray-400">Tính năng đang được phát triển</div>
      </Card>
    );
  }

  return (
    <Card title="Order list: 5 tabs + ShipmentTimeline">
      <Tabs activeKey={active} onChange={(key) => setActive(key as RetailOrderStatus)} items={tabs.map((tab) => ({ key: tab.key, label: tab.label }))} />
      {isLoading && <Spin />}
      <List
        dataSource={data ?? []}
        renderItem={(order) => (
          <List.Item>
            <Card style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space>
                  <strong>{order.productName}</strong>
                  <Tag>{order.status}</Tag>
                  <Tag color="blue">{order.paymentGateway}</Tag>
                  <span>{order.totalAmount.toLocaleString()} VND</span>
                </Space>
                {order.status === "SHIPPING" && (
                  <>
                    <Button
                      size="small"
                      onClick={() =>
                        void getShippingTimeline(order.id).then((items) =>
                          setTimelines((prev) => ({ ...prev, [order.id]: items }))
                        )
                      }
                    >
                      Load ShipmentTimeline
                    </Button>
                    {(timelines[order.id] ?? order.shipmentTimeline ?? []).length > 0 && (
                      <Timeline
                        items={(timelines[order.id] ?? order.shipmentTimeline ?? []).map((item) => ({
                          color: item.status === "DELIVERED" ? "green" : "blue",
                          children: `${item.status} - ${dayjs(item.at).format("DD/MM HH:mm")} ${item.note ?? ""}`
                        }))}
                      />
                    )}
                  </>
                )}
              </Space>
            </Card>
          </List.Item>
        )}
      />
    </Card>
  );
}

function QrScanPage() {
  const [result, setResult] = useState("");
  const [trace, setTrace] = useState<Awaited<ReturnType<typeof qrScanTrace>> | null>(null);
  const [loading, setLoading] = useState(false);

  const scan = async (value: string) => {
    if (!value) {
      return;
    }
    setResult(value);
    setLoading(true);
    try {
      const data = await qrScanTrace(value);
      setTrace(data);
    } catch (err) {
      message.error(err instanceof Error ? err.message : "Quét QR thất bại.");
      setTrace(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="QR scan: react-qr-reader + TraceResult + blockchain verified badge">
      <Row gutter={16}>
        <Col span={12}>
          <QrReader
            constraints={{ facingMode: "environment" }}
            onResult={(qrResult) => {
              const text = qrResult?.getText();
              if (text) {
                void scan(text);
              }
            }}
          />
          <Divider />
          <Input.Search placeholder="Paste QR value manually" enterButton="Trace" onSearch={(value) => void scan(value)} />
          {result && <p>QR value: {result}</p>}
        </Col>
        <Col span={12}>
          {loading && <Spin />}
          {trace && (
            <Card>
              <Space direction="vertical">
                <Tag color="green">Blockchain verified</Tag>
                <p>seasonId: {trace.seasonId}</p>
                <p>cropType: {trace.cropType}</p>
                <p>txHash: {trace.txHash}</p>
                <Timeline
                  items={trace.history.map((item) => ({
                    children: `${item.status} - ${dayjs(item.at).format("DD/MM/YYYY HH:mm")}`
                  }))}
                />
              </Space>
            </Card>
          )}
        </Col>
      </Row>
    </Card>
  );
}

function ConfirmDeliveryPage() {
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [shippingOrders, setShippingOrders] = useState<RetailOrder[]>([]);

  useEffect(() => {
    void getOrdersByStatus("SHIPPING")
      .then((items) => {
        setShippingOrders(items);
        if (items[0]) {
          setOrderId(items[0].id);
        }
      })
      .catch(() => {
        message.warning("Không tải được đơn đang giao.");
      });
  }, []);

  const submit = async () => {
    if (!orderId) {
      message.error("Chọn đơn hàng");
      return;
    }
    try {
      await confirmDelivery(orderId, note, files);
      message.success("Xác nhận giao hàng thành công");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Xác nhận giao hàng thất bại.");
    }
  };

  return (
    <Card title="Confirm delivery: camera/upload ảnh">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          value={orderId}
          onChange={setOrderId}
          options={shippingOrders.map((item) => ({ value: item.id, label: `${item.id} - ${item.productName}` }))}
          placeholder="Select order"
        />
        <Input.TextArea rows={3} placeholder="recipient note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Upload
          multiple
          beforeUpload={(file) => {
            setFiles((prev) => [...prev, file]);
            return false;
          }}
          fileList={files.map((f, idx) => ({ uid: `${idx}`, name: f.name }))}
          onRemove={(target) => {
            setFiles((prev) => prev.filter((item) => item.name !== target.name));
          }}
        >
          <Button>Upload chứng từ (camera/file)</Button>
        </Upload>
        <Button type="primary" onClick={() => void submit()}>
          Confirm Delivery
        </Button>
      </Space>
    </Card>
  );
}

export default App;
