import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, ArrowRight, KeyRound } from "lucide-react";
import Container from "../components/Container";
import { forgotPassword } from "../api/authApi";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await forgotPassword(email);
            setSubmitted(true);
            sessionStorage.setItem("otpEmail", email);
            navigate("/verify-otp", { state: { email, mode: "reset" } });
        } catch (err: any) {
            setError(err.message || "Gửi mã OTP thất bại. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="relative py-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_#f3f4f6,_#ffffff)]">
            <div className="pointer-events-none absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="pointer-events-none absolute bottom-12 right-6 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
            <Container>
                <div className="max-w-md mx-auto">
                    <div className="card p-8 shadow-lg relative">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
                                <KeyRound className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="heading-3 mb-2">Quên mật khẩu</h1>
                            <p className="body-text text-neutral-600">
                                Nhập email để nhận mã OTP đặt lại mật khẩu.
                            </p>
                        </div>

                        {submitted && (
                            <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                Nếu email tồn tại, chúng tôi đã gửi mã OTP. Kiểm tra hộp thư và mục spam.
                            </div>
                        )}
                        {error && (
                            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Đang gửi...
                                    </>
                                ) : (
                                    <>
                                        Gửi mã OTP
                                        <ArrowRight className="h-5 w-5" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-4 text-center text-sm text-neutral-600">
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
