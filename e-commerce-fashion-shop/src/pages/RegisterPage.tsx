import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api/authApi";
import Container from "../components/Container";
import { UserPlus, User, Mail, Lock, Phone, MapPin, ArrowRight } from "lucide-react";


export default function RegisterPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		phone: "",
		address: "",
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			await register(formData);
            sessionStorage.setItem("otpEmail", formData.email);
            sessionStorage.setItem("otpMode", "verify");
            navigate("/verify-otp", { state: { email: formData.email, mode: "verify" } });
		} catch (err: any) {
			setError(err.message || "Đăng ký thất bại! Vui lòng thử lại.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="py-20 min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
			<Container>
				<div className="max-w-2xl mx-auto">
					<div className="card p-8 shadow-lg">
						{/* Header */}
						<div className="text-center mb-8">
							<div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
								<UserPlus className="h-8 w-8 text-white" />
							</div>
							<h1 className="heading-3 mb-2">Tạo tài khoản mới</h1>
							<p className="body-text text-neutral-600">
								Điền thông tin để tạo tài khoản và bắt đầu mua sắm
							</p>
						</div>

						{/* Error Message */}
						{error && (
							<div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
								<p className="text-sm text-red-600">{error}</p>
							</div>
						)}

						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-5">
							{/* Name */}
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-2">
									Họ và tên
								</label>
								<div className="relative">
									<User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
									<input
										type="text"
										placeholder="Nguyễn Văn A"
										className="input pl-10 w-full"
										value={formData.name}
										onChange={(e) =>
											setFormData({ ...formData, name: e.target.value })
										}
										required
									/>
								</div>
							</div>

							{/* Email */}
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-2">
									Địa chỉ email
								</label>
								<div className="relative">
									<Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
									<input
										type="email"
										placeholder="ban@email.com"
										className="input pl-10 w-full"
										value={formData.email}
										onChange={(e) =>
											setFormData({ ...formData, email: e.target.value })
										}
										required
									/>
								</div>
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-2">
									Mật khẩu
								</label>
								<div className="relative">
									<Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
									<input
										type="password"
										placeholder="••••••••"
										className="input pl-10 w-full"
										value={formData.password}
										onChange={(e) =>
											setFormData({ ...formData, password: e.target.value })
										}
										required
										minLength={6}
									/>
								</div>
								<p className="mt-1 text-xs text-neutral-500">
									Mật khẩu tối thiểu 6 ký tự
								</p>
							</div>

							{/* Phone */}
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-2">
									Số điện thoại
								</label>
								<div className="relative">
									<Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
									<input
										type="tel"
										placeholder="0901234567"
										className="input pl-10 w-full"
										value={formData.phone}
										onChange={(e) =>
											setFormData({ ...formData, phone: e.target.value })
										}
										required
									/>
								</div>
							</div>

							{/* Address */}
							<div>
								<label className="block text-sm font-medium text-neutral-700 mb-2">
									Địa chỉ
								</label>
								<div className="relative">
									<MapPin className="absolute left-3 top-3 h-5 w-5 text-neutral-400" />
									<textarea
										placeholder="Nhập địa chỉ đầy đủ..."
										className="input pl-10 w-full min-h-[80px] resize-none"
										value={formData.address}
										onChange={(e) =>
											setFormData({ ...formData, address: e.target.value })
										}
										required
									/>
								</div>
							</div>

							{/* Submit Button */}
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full py-3 flex items-center justify-center gap-2"
							>
								{loading ? (
									<>
										<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
										Đang tạo tài khoản...
									</>
								) : (
									<>
										Tạo tài khoản
										<ArrowRight className="h-5 w-5" />
									</>
								)}
							</button>
						</form>

						{/* Divider */}
						<div className="my-6 flex items-center">
							<div className="flex-1 border-t border-neutral-200"></div>
							<span className="px-4 text-sm text-neutral-500">hoặc</span>
							<div className="flex-1 border-t border-neutral-200"></div>
						</div>

						{/* Login Link */}
						<div className="text-center">
							<p className="body-text text-neutral-600">
								Đã có tài khoản?{" "}
								<Link
									to="/login"
									className="font-semibold text-neutral-900 hover:underline"
								>
									Đăng nhập ngay
								</Link>
							</p>
						</div>
					</div>
				</div>
			</Container>
		</main>
	);
}
