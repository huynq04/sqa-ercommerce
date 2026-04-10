import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import Container from "../components/Container";
import { forgotPassword, verifyOtp } from "../api/authApi";
import {toast} from "../utils/toast.ts";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 300;

type OtpMode = "reset" | "verify";
type OtpState = {
    email?: string;
    mode?: OtpMode;
};

export default function OtpVerifyPage() {
    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [remaining, setRemaining] = useState(RESEND_SECONDS);
    const [email, setEmail] = useState("");
    const [mode, setMode] = useState<OtpMode>("reset");
    const [resendError, setResendError] = useState("");
    const [confirmError, setConfirmError] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    useEffect(() => {
        const state = location.state as OtpState | null;
        const stateEmail = state?.email;
        const stateMode = state?.mode;
        const cachedEmail = sessionStorage.getItem("otpEmail") || "";
        const cachedMode = (sessionStorage.getItem("otpMode") as OtpMode) || "reset";
        const nextEmail = stateEmail || cachedEmail;
        const nextMode = stateMode || cachedMode;
        setEmail(nextEmail);
        setMode(nextMode);
        if (nextEmail) {
            sessionStorage.setItem("otpEmail", nextEmail);
        }
        sessionStorage.setItem("otpMode", nextMode);
    }, [location.state]);

    useEffect(() => {
        if (remaining <= 0) return;
        const timer = setInterval(() => {
            setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [remaining]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const handleChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, "").slice(-1);
        const next = [...otp];
        next[index] = digit;
        setOtp(next);
        if (digit && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        event.preventDefault();
        const paste = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
        if (!paste) return;
        const next = Array(OTP_LENGTH).fill("");
        paste.split("").forEach((digit, index) => {
            next[index] = digit;
        });
        setOtp(next);
        const lastIndex = Math.min(paste.length, OTP_LENGTH) - 1;
        inputRefs.current[lastIndex]?.focus();
    };

    const handleResend = async () => {
        if (remaining > 0) {
            setResendError("Vui lòng đợi hết thời gian để gửi lại.");
            return;
        }
        if (!email) {
            setResendError("Vui lòng nhập email để gửi lại mã.");
            return;
        }
        setResendError("");
        try {
            setResendLoading(true);
            await forgotPassword(email);
            setRemaining(RESEND_SECONDS);
            toast("Da gui lai ma OTP. Vui lòng kiểm tra email.");
        } catch (err: any) {
            setResendError(err.message || "Gửi lại mã thất bại. Vui lòng thử lại.");
        } finally {
            setResendLoading(false);
        }
    };

    const isComplete = otp.every((digit) => digit !== "");
    const otpCode = otp.join("");

    const handleConfirm = async () => {
        if (!email) {
            setConfirmError("Thiếu email, vui lòng quay lại bước trước.");
            return;
        }
        if (!isComplete) {
            setConfirmError("Vui lòng nhập đầy đủ mã OTP.");
            return;
        }
        setConfirmError("");
        sessionStorage.setItem("otpEmail", email);
        sessionStorage.setItem("otpCode", otpCode);
        if (mode === "verify") {
            try {
                await verifyOtp({ email, otp: otpCode });
                sessionStorage.removeItem("otpCode");
                sessionStorage.removeItem("otpMode");
                navigate("/login", { state: { verified: true } });
            } catch (err: any) {
                setConfirmError(err.message || "Xác nhận OTP thất bại. Vui lòng thử lại.");
            }
            return;
        }
        navigate("/reset-password");
    };

    return (
        <main className="relative py-20 min-h-screen overflow-hidden bg-[radial-gradient(circle_at_bottom,_#fef3c7,_#ffffff)]">
            <div className="pointer-events-none absolute -top-24 right-1/4 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl" />
            <div className="pointer-events-none absolute bottom-10 left-8 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
            <Container>
                <div className="max-w-lg mx-auto">
                    <div className="card p-8 shadow-lg">
                        <div className="text-center mb-8">
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-neutral-900 rounded-full mb-4">
                                <ShieldCheck className="h-8 w-8 text-white" />
                            </div>
                            <h1 className="heading-3 mb-2">Nhập mã OTP</h1>
                            <p className="body-text text-neutral-600">
                                Mã OTP đã được gửi đến email của bạn. Thời gian còn lại:{" "}
                                <span className="font-semibold text-neutral-900">{formatTime(remaining)}</span>
                            </p>
                        </div>

                        {email && (
                            <div className="mb-6 text-center text-sm text-neutral-600">
                                Email: <span className="font-semibold text-neutral-900">{email}</span>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3 mb-8">
                            {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                                <input
                                    key={index}
                                    ref={(el) => {
                                        inputRefs.current[index] = el;
                                    }}
                                    value={otp[index]}
                                    onChange={(event) => handleChange(index, event.target.value)}
                                    onKeyDown={(event) => handleKeyDown(index, event)}
                                    onPaste={handlePaste}
                                    inputMode="numeric"
                                    maxLength={1}
                                    className="h-12 w-12 rounded-lg border border-neutral-300 text-center text-lg font-semibold text-neutral-900 focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900"
                                />
                            ))}
                        </div>

                        {resendError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {resendError}
                            </div>
                        )}
                        {confirmError && (
                            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {confirmError}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                type="button"
                                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                                disabled={!isComplete}
                                onClick={handleConfirm}
                            >
                                Xác nhận OTP
                                <ArrowRight className="h-5 w-5" />
                            </button>
                            <button
                                type="button"
                                onClick={handleResend}
                                className="btn-secondary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                                disabled={resendLoading}
                            >
                                <RefreshCw className="h-4 w-4" />
                                {resendLoading ? "Đang gửi..." : "Gửi lại mã"}
                            </button>
                        </div>

                        

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
