import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { KeyRound, ArrowRight, Lock } from "lucide-react";
import Container from "../components/Container";
import { resetPassword } from "../api/authApi";

type ResetState = {
    email?: string;
    otp?: string;
};

export default function ResetPasswordPage() {
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const state = location.state as ResetState | null;
        const cachedEmail = sessionStorage.getItem("otpEmail") || "";
        const cachedOtp = sessionStorage.getItem("otpCode") || "";
        setEmail(state?.email || cachedEmail);
        setOtp(state?.otp || cachedOtp);
    }, [location.state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!email || !otp) {
            setError("Thiếu email hoặc OTP. Vui lòng quay lại bước nhập mã.");
            return;
        }
        if (newPassword.length < 5) {
            setError("Mật khẩu mới tối thiểu 5 ký tự.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Xác nhận mật khẩu không khớp.");
            return;
        }
        setLoading(true);
        try {
            await resetPassword({ email, otp, newPassword });
            sessionStorage.removeItem("otpCode");
            sessionStorage.removeItem("otpEmail");
            navigate("/login", { state: { resetSuccess: true } });
        } catch (err: any) {
            setError(err.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative py-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#ecfeff,_#ffffff)]">
            <div className="pointer-events-none absolute -top-20 left-10 h-64 w-64 rounded-full bg-sky-200/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 right-10 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
            <Container>
                <div className="max-w-md mx-auto">
                    <div className="card p-8 shadow-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
                                <KeyRound className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="heading-3 mb-2">Đổi mật khẩu</h1>
                            <p className="body-text text-neutral-600">
                                Tạo mật khẩu mới cho tài khoản của bạn.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                {success}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="input w-full"
                                    value={email}
                                    readOnly
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="password"
                                        className="input pl-10 w-full"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Xác nhận mật khẩu
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                                    <input
                                        type="password"
                                        className="input pl-10 w-full"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    <>
                                        Đổi mật khẩu
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm text-neutral-600">
                            Quay lại{" "}
                            <Link to="/login" className="font-semibold text-neutral-900 hover:underline">
                                Đăng nhập
                            </Link>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
