import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "../api/authApi";
import Container from "../components/Container";
import { LogIn, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const state = location.state as { verified?: boolean; resetSuccess?: boolean } | null;
        if (state?.verified) {
            setSuccess("Xác thực thành công, hãy đăng nhập lại.");
            navigate("/login", { replace: true });
            return;
        }
        if (state?.resetSuccess) {
            setSuccess("Đổi mật khẩu thành công, hãy đăng nhập lại.");
            navigate("/login", { replace: true });
        }
    }, [location.state, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const res = await login({ email, password });
            localStorage.setItem("token", res.access_token);
            navigate("/");
            window.location.reload();
        } catch (err: any) {
            const rawMessage = (err?.message || "").toString();
            let message = rawMessage;
            let statusCode = err?.status;
            try {
                const parsed = JSON.parse(rawMessage);
                message = parsed?.message || rawMessage;
                statusCode = parsed?.statusCode || statusCode;
            } catch {
                // ignore JSON parse errors
            }
            const normalized = message.toLowerCase();
            const isUnverified =
                statusCode === 403 &&
                (normalized.includes("xac thuc") || normalized.includes("xác thực") || normalized.includes("xac thực"));
            if (isUnverified) {
                sessionStorage.setItem("otpEmail", email);
                sessionStorage.setItem("otpMode", "verify");
                navigate("/verify-otp", { state: { email, mode: "verify" } });
                return;
            }
            setError(message || "Đăng nhập thất bại! Vui lòng kiểm tra thông tin.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="py-20 min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
            <Container>
                <div className="max-w-md mx-auto">
                    <div className="card p-8 shadow-lg">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
                                <LogIn className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="heading-3 mb-2">Đăng nhập</h1>
                            <p className="body-text text-neutral-600">
                                Chào mừng trở lại! Vui lòng đăng nhập tài khoản.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-600">{error}</p>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleLogin} className="space-y-5">
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
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>

                            {success && (
                                <div className="text-sm text-emerald-600 font-medium">
                                    {success}
                                </div>
                            )}

                            <div className="flex items-center justify-end">
                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-semibold text-neutral-900 hover:underline"
                                >
                                    Quên mật khẩu?
                                </Link>
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
                                        Đang đăng nhập...
                                </>
                            ) : (
                                <>
                                    Đăng nhập
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

                        {/* Register Link */}
                        <div className="text-center">
                            <p className="body-text text-neutral-600">
                                Chưa có tài khoản?{" "}
                                <Link
                                    to="/register"
                                    className="font-semibold text-neutral-900 hover:underline"
                                >
                                    Đăng ký ngay
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
