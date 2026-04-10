import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Container from "../components/Container";

type ShipmentHistory = {
	status: string;
	ghnStatus?: string;
	occurredAt?: string;
};

type Shipment = {
	shipmentOrderId: number;
	type: string;
	ghnOrderCode?: string;
	currentStatus?: string;
	histories?: ShipmentHistory[];
};

type TrackingResponse = {
	orderId: number;
	orderStatus: string;
	paymentStatus: string;
	shipmentStatus: string;
	shipments: Shipment[];
};

export default function OrderTrackingPage() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [data, setData] = useState<TrackingResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		if (!id) {
			setError("Không tìm thấy đơn hàng.");
			setLoading(false);
			return;
		}

		const load = async () => {
			try {
				setLoading(true);
				const res = await fetch(`http://localhost:3000/api/v1/orders/${id}/tracking`, {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (!res.ok) throw new Error(await res.text());
				const json = (await res.json()) as TrackingResponse;
				setData(json);
			} catch (err: any) {
				console.error(err);
				setError(err?.message || "Không thể tải theo dõi đơn hàng.");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [id, navigate]);

	if (loading) return <div className="py-20 text-center">Đang tải theo dõi đơn hàng...</div>;
	if (error)
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Theo dõi đơn hàng</h1>
					<p className="text-neutral-600">{error}</p>
				</Container>
			</main>
		);
	if (!data)
		return (
			<main className="py-12">
				<Container>
					<h1 className="heading-3 mb-4">Theo dõi đơn hàng</h1>
					<p className="text-neutral-600">Không có dữ liệu.</p>
				</Container>
			</main>
		);

	const formatTime = (value?: string) => (value ? new Date(value).toLocaleString("vi-VN") : "");

	return (
		<main className="py-12">
			<Container>
				<div className="flex items-center justify-between mb-6">
					<div>
						<h1 className="heading-3">Theo dõi đơn #{data.orderId}</h1>
						<p className="text-neutral-600">
							Trạng thái: {data.orderStatus} · Thanh toán: {data.paymentStatus} · Giao hàng: {data.shipmentStatus}
						</p>
					</div>
					<button className="btn-secondary" onClick={() => navigate(-1)}>
						← Quay lại
					</button>
				</div>

				<div className="space-y-4">
					{data.shipments?.map((ship) => (
						<div key={ship.shipmentOrderId} className="card">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
								<div>
									<p className="font-semibold text-neutral-900">Lô giao #{ship.shipmentOrderId}</p>
									<p className="text-sm text-neutral-600">Loại: {ship.type || "Không có"}</p>
								</div>
								<div className="text-right">
									<p className="text-sm text-neutral-600">Mã GHN: {ship.ghnOrderCode || "Không có"}</p>
									<p className="text-sm font-semibold text-neutral-800">Hiện tại: {ship.currentStatus || "Không có"}</p>
								</div>
							</div>
							<div className="mt-2 space-y-1 text-sm text-neutral-700">
								{ship.histories?.length ? (
									ship.histories.map((h, idx) => (
										<div key={`${h.status}-${idx}`} className="flex items-center justify-between border-b border-neutral-200 py-1">
											<div>
												<p className="font-medium">{h.status}</p>
												<p className="text-xs text-neutral-500">GHN: {h.ghnStatus}</p>
											</div>
											<span className="text-xs text-neutral-500">{formatTime(h.occurredAt)}</span>
										</div>
									))
								) : (
									<p className="text-neutral-500">Chưa có lịch sử.</p>
								)}
							</div>
						</div>
					))}
				</div>
			</Container>
		</main>
	);
}
