import { useEffect, useMemo, useState } from "react";
import Container from "../components/Container";
import { uploadFile } from "../api/uploadApi";

const API_BASE = "http://localhost:3000/api/v1";

type Profile = {
	sub: number;
	email: string;
	role: string;
	name: string;
	phone?: string | null;
	address?: string | null;
	avatar?: string | null;
	avatarUrl?: string | null;
	iat?: number;
	exp?: number;
};

type ProfileForm = {
	name: string;
	phone: string;
	address: string;
};

export default function ProfilePage() {
	const [profile, setProfile] = useState<Profile | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState<ProfileForm>({
		name: "",
		phone: "",
		address: "",
	});
	const [avatarFile, setAvatarFile] = useState<File | null>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [formError, setFormError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			setError("Vui lòng đăng nhập để xem hồ sơ.");
			setLoading(false);
			return;
		}

		fetch(`${API_BASE}/auth/profile`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => {
				if (!res.ok) throw new Error("Không thể tải thông tin hồ sơ.");
				return res.json();
			})
			.then((data) => setProfile(data))
			.catch((err: Error) => setError(err.message))
			.finally(() => setLoading(false));
	}, []);

	useEffect(() => {
		if (!avatarFile) {
			setAvatarPreview(null);
			return;
		}
		const previewUrl = URL.createObjectURL(avatarFile);
		setAvatarPreview(previewUrl);
		return () => URL.revokeObjectURL(previewUrl);
	}, [avatarFile]);

	const initials = useMemo(() => {
		if (!profile) return "";
		const base = profile.name || profile.email || "";
		return base
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0])
			.join("")
			.toUpperCase();
	}, [profile]);

	const avatarSrc = useMemo(() => {
		if (avatarPreview) return avatarPreview;
		return profile?.avatar || profile?.avatarUrl || null;
	}, [avatarPreview, profile]);

	const startEdit = () => {
		if (!profile) return;
		setIsEditing(true);
		setFormError("");
		setSuccess("");
		setFormData({
			name: profile.name || "",
			phone: profile.phone || "",
			address: profile.address || "",
		});
		setAvatarFile(null);
	};

	const cancelEdit = () => {
		setIsEditing(false);
		setFormError("");
		setAvatarFile(null);
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!profile) return;
		const token = localStorage.getItem("token");
		if (!token) {
			setFormError("Vui lòng đăng nhập lại.");
			return;
		}
		setSaving(true);
		setFormError("");
		setSuccess("");

		try {
			let avatarUrl = profile.avatarUrl || profile.avatar || "";
			if (avatarFile) {
				const upload = await uploadFile(token, avatarFile);
				avatarUrl = upload.url;
			}

			const res = await fetch(`${API_BASE}/users/me`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: formData.name,
					phone: formData.phone,
					address: formData.address,
					avatarUrl: avatarUrl || null,
				}),
			});

			if (!res.ok) throw new Error("Cập nhật hồ sơ thất bại.");
			const updated = await res.json();
			setProfile({
				...profile,
				...updated,
				avatar: updated.avatarUrl || updated.avatar || profile.avatar,
				avatarUrl: updated.avatarUrl || profile.avatarUrl,
			});
			setIsEditing(false);
			setAvatarFile(null);
			setSuccess("Cập nhật hồ sơ thành công.");
		} catch (err: any) {
			setFormError(err?.message || "Cập nhật hồ sơ thất bại.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="py-20 text-center">Đang tải hồ sơ...</div>;
	}

	if (error || !profile) {
		return (
			<main className="py-12">
				<Container>
					<div className="max-w-2xl mx-auto card text-center">
						<h1 className="heading-3 mb-2">Hồ sơ</h1>
						<p className="text-neutral-600">{error || "Không có dữ liệu."}</p>
					</div>
				</Container>
			</main>
		);
	}

	return (
		<main className="py-12">
			<Container>
				<div className="flex flex-col gap-8">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<h1 className="heading-3 mb-2">Hồ sơ cá nhân</h1>
							<p className="body-text">Thông tin tài khoản và liên hệ của bạn.</p>
						</div>
						<div className="flex items-center gap-3">
							<span className="inline-flex items-center rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white uppercase tracking-wide">
								{profile.role || "user"}
							</span>
							{!isEditing && (
								<button
									className="btn-secondary"
									onClick={startEdit}
								>
									Chỉnh sửa
								</button>
							)}
						</div>
					</div>

					{success && (
						<div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
							{success}
						</div>
					)}

					<div className="grid gap-6 lg:grid-cols-[320px_1fr]">
						<div className="card p-6 flex flex-col items-center text-center gap-4">
							<div className="relative h-24 w-24 rounded-full bg-neutral-900 text-white flex items-center justify-center text-2xl font-semibold overflow-hidden">
								{avatarSrc ? (
									<img
										src={avatarSrc}
										alt={profile.name || "Avatar"}
										className="h-full w-full object-cover"
									/>
								) : (
									initials || "U"
								)}
							</div>
							<div>
								<p className="text-lg font-semibold text-neutral-900">
									{profile.name || "Chưa cập nhật"}
								</p>
								<p className="text-sm text-neutral-500">{profile.email}</p>
							</div>
							<div className="w-full rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
								ID tai khoan: <span className="font-semibold">{profile.sub}</span>
							</div>
							{isEditing && (
								<div className="w-full">
									<label className="block text-sm font-medium text-neutral-700 mb-2">
										Ảnh đại diện
									</label>
									<input
										type="file"
										accept="image/*"
										className="block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-neutral-800"
										onChange={(event) => {
											const file = event.target.files?.[0];
											if (file) setAvatarFile(file);
										}}
									/>
								</div>
							)}
						</div>

						<div className="card p-6">
							<h2 className="heading-4 mb-4">Chi tiết tài khoản</h2>
							{formError && (
								<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
									{formError}
								</div>
							)}
							{isEditing ? (
								<form onSubmit={handleSave} className="space-y-4">
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-2">
											Họ và tên
										</label>
										<input
											type="text"
											className="input"
											value={formData.name}
											onChange={(event) =>
												setFormData({ ...formData, name: event.target.value })
											}
											required
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-2">
											Số điện thoại
										</label>
										<input
											type="text"
											className="input"
											value={formData.phone}
											onChange={(event) =>
												setFormData({ ...formData, phone: event.target.value })
											}
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-neutral-700 mb-2">
											Địa chỉ
										</label>
										<textarea
											className="input min-h-[90px]"
											value={formData.address}
											onChange={(event) =>
												setFormData({ ...formData, address: event.target.value })
											}
										/>
									</div>

									<div className="flex flex-wrap gap-3">
										<button
											type="submit"
											disabled={saving}
											className="btn-primary"
										>
											{saving ? "Đang lưu..." : "Lưu thay đổi"}
										</button>
										<button
											type="button"
											className="btn-secondary"
											onClick={cancelEdit}
										>
											Hủy
										</button>
									</div>
								</form>
							) : (
								<div className="grid gap-4 sm:grid-cols-2">
									<div className="rounded-lg border border-neutral-200 p-4">
										<p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
											Họ và tên
										</p>
										<p className="text-sm font-semibold text-neutral-900">
											{profile.name || "Chưa cập nhật"}
										</p>
									</div>
									<div className="rounded-lg border border-neutral-200 p-4">
										<p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
											Email
										</p>
										<p className="text-sm font-semibold text-neutral-900">
											{profile.email}
										</p>
									</div>
									<div className="rounded-lg border border-neutral-200 p-4">
										<p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
											Số điện thoại
										</p>
										<p className="text-sm font-semibold text-neutral-900">
											{profile.phone || "Chưa cập nhật"}
										</p>
									</div>
									<div className="rounded-lg border border-neutral-200 p-4">
										<p className="text-xs uppercase tracking-wide text-neutral-500 mb-2">
											Địa chỉ
										</p>
										<p className="text-sm font-semibold text-neutral-900">
											{profile.address || "Chưa cập nhật"}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</Container>
		</main>
	);
}
