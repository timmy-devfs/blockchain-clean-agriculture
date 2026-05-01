import {
  AppstoreOutlined,
  DashboardOutlined,
  FileTextOutlined,
  GiftOutlined,
  ShopOutlined
} from "@ant-design/icons";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Layout,
  List,
  Menu,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Upload,
  message
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { isAxiosError } from "axios";
import { useEffect, useMemo, useState } from "react";
import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import {
  addSeasonUpdate,
  confirmOrder,
  createMarketplace,
  createSeason,
  downloadQr,
  exportSeasonPdf,
  getAlerts,
  getCurrentPackage,
  getFarmProfile,
  getIotDashboard,
  getMarketplace,
  getMyFarms,
  getOrdersByStatus,
  getPackages,
  getSeasonUpdates,
  getSeasons,
  rejectOrder,
  saveFarmStepOne,
  subscribePackage,
  updateSeason,
  uploadFarmLicense
} from "./services/farmApi";
import { AlertItem, IotDashboard, MarketplaceItem, Order, OrderStatus, PackageInfo, Season, SeasonUpdate } from "./types";
import { fetchMe, logoutFarm, type FarmMeUser } from "./services/authFarm";

const { Header, Content, Sider } = Layout;

type ScreenKey =
  | "onboarding"
  | "dashboard"
  | "seasons"
  | "season-updates"
  | "marketplace"
  | "orders"
  | "packages";

// Sau khi merge vào web-app unified, /login (route group root) quản lý đăng nhập.
// Legacy console chỉ render FarmConsole; nếu token hết hạn, axios interceptor sẽ
// redirect tới /login.
function App() {
  return <FarmConsole />;
}

function FarmConsole() {
  const [screen, setScreen] = useState<ScreenKey>("dashboard");
  const [me, setMe] = useState<FarmMeUser | null>(null);

  useEffect(() => {
    void fetchMe()
      .then((user) => {
        if (user.role !== "FARM_MANAGER") {
          message.error("Tài khoản này không có quyền vào farm console. Vui lòng dùng FARM_MANAGER.");
          logoutFarm();
          return;
        }
        setMe(user);
      })
      .catch((err) => {
        // 401: gateway interceptor đã clear token + redirect /login — không gọi logoutFarm (tránh double redirect).
        if (isAxiosError(err) && err.response?.status === 401) {
          return;
        }
        message.error(
          isAxiosError(err) && err.response?.status === 404
            ? "Không gọi được API (404). Kiểm tra NEXT_PUBLIC_API_URL / Gateway."
            : "Không tải được hồ sơ người dùng. Thử đăng nhập lại."
        );
      });
  }, []);

  return (
    <Layout className="app-layout">
      <Sider width={240} theme="light" className="sider">
        <div className="logo">BICAP Farm Console</div>
        <Menu
          mode="inline"
          selectedKeys={[screen]}
          onClick={(item) => setScreen(item.key as ScreenKey)}
          items={[
            { key: "onboarding", icon: <FileTextOutlined />, label: "Onboarding" },
            { key: "dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "seasons", icon: <AppstoreOutlined />, label: "Vụ mùa" },
            { key: "season-updates", icon: <FileTextOutlined />, label: "Season Updates" },
            { key: "marketplace", icon: <ShopOutlined />, label: "Marketplace" },
            { key: "orders", icon: <FileTextOutlined />, label: "Orders" },
            { key: "packages", icon: <GiftOutlined />, label: "Packages" }
          ]}
        />
      </Sider>
      <Layout>
        <Header className="header flex items-center justify-between px-4">
          <span>Web Farm — Gateway</span>
          <Space>
            <span className="text-sm font-normal opacity-90">{me?.fullName ?? "…"}</span>
            <Button size="small" onClick={() => logoutFarm()}>
              Đăng xuất
            </Button>
          </Space>
        </Header>
        <Content className="content">
          {screen === "onboarding" && <OnboardingPage />}
          {screen === "dashboard" && <DashboardPage user={me} />}
          {screen === "seasons" && <SeasonsPage />}
          {screen === "season-updates" && <SeasonUpdatesPage />}
          {screen === "marketplace" && <MarketplacePage />}
          {screen === "orders" && <OrdersPage />}
          {screen === "packages" && <PackagesPage />}
        </Content>
      </Layout>
    </Layout>
  );
}

function OnboardingPage( ) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState("PRO");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [form] = Form.useForm();

  const submitStepOne = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await saveFarmStepOne(values);
      message.success("Luu thong tin nong trai thanh cong");
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const submitStepTwo = async () => {
    if (!file) {
      message.error("Vui long chon file PDF");
      return;
    }
    setLoading(true);
    try {
      await uploadFarmLicense(file);
      message.success("Upload giay phep thanh cong");
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const submitStepThree = async () => {
    setLoading(true);
    try {
      const result = await subscribePackage(selectedPackage);
      message.success("Dang chuyen den cong thanh toan");
      window.open(result.paymentUrl, "_blank");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Register + Onboarding 3 buoc">
      <Steps
        current={step}
        items={[
          { title: "Farm Info" },
          { title: "License PDF" },
          { title: "Package" }
        ]}
      />
      <div className="section-gap">
        {step === 0 && (
          <Card>
            <Form layout="vertical" form={form}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="name" label="Farm Name" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="province" label="Province" rules={[{ required: true }]}>
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="address" label="Address" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="area" label="Area (ha)" rules={[{ required: true }]}>
                <InputNumber min={0.1} style={{ width: "100%" }} />
              </Form.Item>
              <Button type="primary" onClick={submitStepOne} loading={loading}>
                Tiep tuc
              </Button>
            </Form>
          </Card>
        )}

        {step === 1 && (
          <Card>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Upload
                accept=".pdf"
                maxCount={1}
                beforeUpload={(f) => {
                  setFile(f);
                  const url = URL.createObjectURL(f);
                  setPreviewUrl(url);
                  return false;
                }}
              >
                <Button>Upload PDF</Button>
              </Upload>
              {previewUrl && (
                <iframe src={previewUrl} title="preview-license" className="pdf-preview" />
              )}
              <Button type="primary" onClick={submitStepTwo} loading={loading}>
                Preview xong, POST API
              </Button>
            </Space>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <Select
              value={selectedPackage}
              options={[
                { value: "BASIC", label: "Basic - 30 ngay" },
                { value: "PRO", label: "Pro - 90 ngay" },
                { value: "ENTERPRISE", label: "Enterprise - 365 ngay" }
              ]}
              onChange={setSelectedPackage}
              style={{ width: 280 }}
            />
            <div className="section-gap">
              <Button type="primary" onClick={submitStepThree} loading={loading}>
                Dang ky goi va thanh toan VNPay
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Card>
  );
}

function DashboardPage({ user }: { user: FarmMeUser | null }) {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<IotDashboard | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [recentSeasons, setRecentSeasons] = useState<Season[]>([]);

  const refresh = async () => {
    const [d, a, seasons] = await Promise.all([getIotDashboard(), getAlerts(), getSeasons()]);
    setDashboard(d);
    setAlerts(a);
    setRecentSeasons(seasons.slice(0, 3));
  };

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
    const timer = window.setInterval(refresh, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const chartData = useMemo(
    () =>
      (dashboard?.latest ?? []).map((item) => ({
        name: item.type,
        value: item.type === "TEMP" ? (item.value / 50) * 100 : item.type === "PH" ? (item.value / 14) * 100 : item.value
      })),
    [dashboard]
  );

  return (
    <Spin spinning={loading}>
      {user ? (
        <Card className="mb-4" title="Tài khoản (demo)">
          <Space align="start" size="large">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-700 text-lg font-bold text-white">
                {(user.fullName || user.email || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold">{user.fullName}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
              <Tag color="blue" className="mt-1">
                {user.role}
              </Tag>
            </div>
          </Space>
        </Card>
      ) : null}
      <Row gutter={[16, 16]}>
        <Col span={16}>
          <Card title="IoT Radial Gauge (polling 10s)">
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer>
                <RadialBarChart data={chartData} innerRadius="20%" outerRadius="95%" barSize={22}>
                  <RadialBar dataKey="value" />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <Row gutter={16}>
              {(dashboard?.latest ?? []).map((item) => (
                <Col span={8} key={item.type}>
                  <Statistic
                    title={item.type}
                    value={item.value}
                    suffix={item.unit}
                    valueStyle={{ color: item.isAlert ? "#b91c1c" : "#166534" }}
                  />
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Alert List">
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={2}>
                    <Tag color={item.level === "error" ? "red" : "gold"}>{item.level.toUpperCase()}</Tag>
                    <span>{item.title}</span>
                    <small>{dayjs(item.createdAt).format("DD/MM HH:mm")}</small>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
          <Card title="Recent Seasons" style={{ marginTop: 16 }}>
            <List
              dataSource={recentSeasons}
              renderItem={(item) => (
                <List.Item>
                  <Space>
                    <strong>{item.cropType}</strong>
                    <Tag>{item.status}</Tag>
                    {item.txHash ? <Tag color="green">On-chain</Tag> : <Tag color="orange">Pending chain</Tag>}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}

function SeasonsPage() {
  const [loading, setLoading] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      setSeasons(await getSeasons());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    void (async () => {
      const list = await getMyFarms();
      setFarms(list);
    })();
  }, []);

  const save = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (editing) {
        await updateSeason(editing.id, values);
        message.success("Cập nhật vụ mùa thành công");
      } else {
        const created = await createSeason({
          farmId: values.farmId,
          cropType: values.cropType,
          startDate: values.startDate,
          estimatedEndDate: values.estimatedEndDate || undefined
        });
        message.success(
          created.txHash
            ? `Tạo vụ mùa thành công. TxHash: ${created.txHash}`
            : "Tạo vụ mùa thành công. Mùa vụ đã gửi sang luồng chờ admin duyệt ghi chain."
        );
      }
      setModalOpen(false);
      setEditing(null);
      form.resetFields();
      await load();
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Không thể tạo/cập nhật vụ mùa";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const cols: ColumnsType<Season> = [
    { title: "Crop", dataIndex: "cropType" },
    { title: "Status", dataIndex: "status", render: (value: string) => <Tag>{value}</Tag> },
    {
      title: "Blockchain",
      dataIndex: "txHash",
      render: (value: string | null) =>
        value ? <Tag color="green">{value}</Tag> : <Tag color="orange">Chờ admin duyệt ghi chain</Tag>
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => {
            setEditing(row);
            setModalOpen(true);
            form.setFieldsValue(row);
          }}>
            Edit
          </Button>
          <Button size="small" onClick={() => void downloadQr(row.id)}>
            Generate QR
          </Button>
          <Button size="small" onClick={() => exportSeasonPdf(row)}>
            Export PDF
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Card title="Seasons - DataTable CRUD + blockchain timeline">
      <Space style={{ marginBottom: 12 }}>
        <Button
          type="primary"
          onClick={() => {
            setEditing(null);
            form.resetFields();
            if (farms[0]) {
              form.setFieldsValue({ farmId: farms[0].id });
            }
            setModalOpen(true);
          }}
        >
          Tạo vụ mùa
        </Button>
      </Space>
      <Table rowKey="id" loading={loading} columns={cols} dataSource={seasons} pagination={{ pageSize: 6 }} />
      <List
        size="small"
        header="Blockchain timeline"
        dataSource={seasons}
        renderItem={(item) => (
          <List.Item>
            {item.cropType}:{" "}
            {item.txHash ? <Tag color="green">txHash {item.txHash}</Tag> : <Tag color="orange">Chờ admin duyệt ghi chain</Tag>}
          </List.Item>
        )}
      />
      <Modal
        title={editing ? "Sửa vụ mùa" : "Tạo vụ mùa"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => void save()}
      >
        <Form layout="vertical" form={form}>
          {!editing ? (
            <Form.Item name="farmId" label="Trang trại" rules={[{ required: true }]}>
              <Select
                placeholder="Chọn farm"
                options={farms.map((f) => ({ value: f.id, label: f.name }))}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>
          ) : null}
          <Form.Item name="cropType" label="Loại cây / vụ" rules={[{ required: true }]}>
            <Input placeholder="VD: Cà chua" />
          </Form.Item>
          {editing ? (
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select
                options={[
                  { value: "PREPARING" },
                  { value: "ACTIVE" },
                  { value: "HARVESTED" },
                  { value: "EXPORTED" }
                ]}
              />
            </Form.Item>
          ) : null}
          <Form.Item name="startDate" label="Ngày bắt đầu" rules={[{ required: true }]}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          {!editing ? (
            <Form.Item name="estimatedEndDate" label="Ngày dự kiến kết thúc (tuỳ chọn)">
              <Input placeholder="YYYY-MM-DD" />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </Card>
  );
}

function SeasonUpdatesPage( ) {
  const [seasonId, setSeasonId] = useState<string>("");
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [updates, setUpdates] = useState<SeasonUpdate[]>([]);
  const [note, setNote] = useState("");

  useEffect(() => {
    void (async () => {
      const list = await getSeasons();
      setSeasons(list);
      if (list[0]) {
        setSeasonId(list[0].id);
      }
    })();
  }, []);

  useEffect(() => {
    if (!seasonId) {
      return;
    }
    void (async () => setUpdates(await getSeasonUpdates(seasonId)))();
  }, [seasonId]);

  const submit = async () => {
    if (!seasonId || !note.trim()) {
      return;
    }
    await addSeasonUpdate(seasonId, note.trim());
    setNote("");
    setUpdates(await getSeasonUpdates(seasonId));
    message.success("Them nhat ky thanh cong");
  };

  return (
    <Card title="Seasons/[id] - SeasonUpdates list + form them nhat ky">
      <Space direction="vertical" style={{ width: "100%" }}>
        <Select
          value={seasonId}
          onChange={setSeasonId}
          options={seasons.map((item) => ({ value: item.id, label: `${item.cropType} (${item.id})` }))}
          style={{ width: 360 }}
        />
        <List
          bordered
          dataSource={updates}
          renderItem={(item) => (
            <List.Item>
              <Space direction="vertical" size={2}>
                <Tag>{item.status}</Tag>
                <span>{item.note}</span>
                <small>{dayjs(item.createdAt).format("DD/MM/YYYY HH:mm")}</small>
              </Space>
            </List.Item>
          )}
        />
        <Input.TextArea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nhap nhat ky moi..." />
        <Button type="primary" onClick={() => void submit()}>
          Them nhat ky
        </Button>
      </Space>
    </Card>
  );
}

function MarketplacePage( ) {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [farms, setFarms] = useState<{ id: string; name: string }[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const selectedFarmId = Form.useWatch("farmId", form);

  const load = async () => setItems(await getMarketplace());

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [farmsList, seasonsList] = await Promise.all([getMyFarms(), getSeasons()]);
        setFarms(farmsList);
        setSeasons(seasonsList);
        const firstFarm = farmsList[0]?.id;
        if (firstFarm) {
          form.setFieldsValue({ farmId: firstFarm, seasonId: undefined });
        }
      } catch (e) {
        message.error(e instanceof Error ? e.message : "Khong tai duoc trang trai / vu mua");
      }
    })();
  }, [open, form]);

  const seasonsForFarm = useMemo(
    () => (selectedFarmId ? seasons.filter((s) => s.farmId === selectedFarmId) : []),
    [seasons, selectedFarmId]
  );

  const submit = async () => {
    try {
      const values = await form.validateFields();
      const desc = typeof values.description === "string" ? values.description.trim() : "";
      await createMarketplace({
        farmId: values.farmId,
        seasonId: values.seasonId,
        title: values.title,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        ...(desc ? { description: desc } : {})
      });
      message.success("Da tao tin dang");
      setOpen(false);
      form.resetFields();
      await load();
    } catch (e) {
      if (e && typeof e === "object" && "errorFields" in e) return;
      message.error(e instanceof Error ? e.message : "Tao tin dang that bai");
    }
  };

  return (
    <Card
      title="Marketplace"
      extra={<Button type="primary" onClick={() => setOpen(true)}>Create Listing</Button>}
    >
      <Row gutter={[12, 12]}>
        {items.map((item) => (
          <Col span={8} key={item.id}>
            <Card
              cover={
                <div className="market-image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span>No image</span>}
                </div>
              }
            >
              <Card.Meta title={item.title} description={item.description} />
              <div className="section-gap">
                <Tag color="blue">Qty: {item.quantity}</Tag>
                <Tag color="green">{item.unitPrice.toLocaleString()} VND</Tag>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Modal title="Create Listing" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="farmId" label="Trang trai" rules={[{ required: true, message: "Chon trang trai" }]}>
            <Select
              options={farms.map((f) => ({ value: f.id, label: f.name }))}
              placeholder="Chon farm"
              onChange={() => form.setFieldsValue({ seasonId: undefined })}
            />
          </Form.Item>
          <Form.Item name="seasonId" label="Vu mua" rules={[{ required: true, message: "Chon vu mua" }]}>
            <Select
              options={seasonsForFarm.map((s) => ({
                value: s.id,
                label: `${s.cropType} (${s.status})`
              }))}
              placeholder={selectedFarmId ? "Chon vu mua" : "Chon trang trai truoc"}
              disabled={!selectedFarmId || seasonsForFarm.length === 0}
            />
          </Form.Item>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={1} />
          </Form.Item>
          <Form.Item name="unitPrice" label="Unit Price" rules={[{ required: true }]}>
            <InputNumber style={{ width: "100%" }} min={1000} />
          </Form.Item>
          <Form.Item name="imageUrl" label="Image URL (hien chua luu DB)">
            <Input placeholder="https://..." />
          </Form.Item>
          <Upload beforeUpload={() => false}>
            <Button>Upload anh (UI only)</Button>
          </Upload>
        </Form>
      </Modal>
    </Card>
  );
}

function OrdersPage( ) {
  const [activeTab, setActiveTab] = useState<OrderStatus>("PENDING");
  const [orders, setOrders] = useState<Order[]>([]);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [rejectReason, setRejectReason] = useState("");

  const load = async (status: OrderStatus) => {
    setOrders(await getOrdersByStatus(status));
  };

  useEffect(() => {
    void load(activeTab);
  }, [activeTab]);

  const confirm = async (id: string) => {
    try {
      await confirmOrder(id);
      message.success("Da xac nhan don");
      setActiveTab("CONFIRMED");
      await load("CONFIRMED");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Xac nhan don that bai");
    }
  };

  const submitReject = async () => {
    try {
      await rejectOrder(selectedId, rejectReason);
      setRejectOpen(false);
      setRejectReason("");
      setActiveTab("REJECTED");
      message.success("Da tu choi don");
      await load("REJECTED");
    } catch (e) {
      message.error(e instanceof Error ? e.message : "Tu choi don that bai");
    }
  };

  const cols: ColumnsType<Order> = [
    { title: "Order", dataIndex: "externalOrderId" },
    { title: "Retailer", dataIndex: "retailerId" },
    { title: "Crop", dataIndex: "cropType" },
    { title: "Qty", dataIndex: "quantity" },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      render: (value: number) => `${value.toLocaleString()} VND`
    },
    { title: "Status", dataIndex: "status", render: (value: string) => <Badge status={value === "PENDING" ? "processing" : "success"} text={value} /> },
    {
      title: "Actions",
      render: (_, row) =>
        row.status === "PENDING" ? (
          <Space>
            <Button size="small" type="primary" onClick={() => void confirm(row.id)}>
              Confirm
            </Button>
            <Button
              size="small"
              danger
              onClick={() => {
                setSelectedId(row.id);
                setRejectOpen(true);
              }}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <span>-</span>
        )
    }
  ];

  return (
    <Card title="Orders">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as OrderStatus)}
        items={[
          { key: "PENDING", label: "Pending" },
          { key: "CONFIRMED", label: "Da xac nhan" },
          { key: "REJECTED", label: "Da tu choi" }
        ]}
      />
      <Table rowKey="id" columns={cols} dataSource={orders} />
      <Modal open={rejectOpen} title="Reject Order" onCancel={() => setRejectOpen(false)} onOk={() => void submitReject()}>
        <Input.TextArea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhap ly do tu choi" />
      </Modal>
    </Card>
  );
}

function PackagesPage( ) {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [current, setCurrent] = useState<{ packageName: string; expiryDate: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [pkg, currentPkg] = await Promise.all([getPackages(), getCurrentPackage()]);
      setPackages(pkg);
      setCurrent(currentPkg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const countdownDays = useMemo(() => {
    if (!current) {
      return 0;
    }
    const diff = dayjs(current.expiryDate).diff(dayjs(), "day");
    return Math.max(0, diff);
  }, [current]);

  const renew = async (packageId: string) => {
    const result = await subscribePackage(packageId);
    window.open(result.paymentUrl, "_blank");
    await load();
  };

  return (
    <Spin spinning={loading}>
      <Card title="Packages - cards + countdown + renew -> VNPay">
        {current && (
          <Alert
            type="info"
            showIcon
            message={`Goi hien tai: ${current.packageName} | Con ${countdownDays} ngay (expiryDate: ${dayjs(current.expiryDate).format("DD/MM/YYYY")})`}
          />
        )}
        <Row gutter={[12, 12]} style={{ marginTop: 12 }}>
          {packages.map((item) => (
            <Col span={8} key={item.id}>
              <Card>
                <Descriptions column={1} size="small" title={item.name}>
                  <Descriptions.Item label="Duration">{item.durationDays} ngay</Descriptions.Item>
                  <Descriptions.Item label="Price">{item.price.toLocaleString()} VND</Descriptions.Item>
                </Descriptions>
                <Progress percent={Math.min(100, (item.durationDays / 365) * 100)} />
                <Button type="primary" onClick={() => void renew(item.id)}>
                  Renew (VNPay)
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </Spin>
  );
}

export default App;

