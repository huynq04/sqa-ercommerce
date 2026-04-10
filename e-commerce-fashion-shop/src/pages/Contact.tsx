import Container from '../components/Container'

export default function Contact() {
	return (
		<main className="py-12">
			<Container>
				<div className="max-w-2xl">
					<h1 className="heading-3">Liên hệ</h1>
					<p className="mt-4 body-text">Có câu hỏi? Hãy gửi tin nhắn, chúng tôi sẽ phản hồi sớm nhất.</p>
					<form className="mt-8 space-y-5">
						<input className="input" type="text" placeholder="Họ và tên" required />
						<input className="input" type="email" placeholder="Địa chỉ email" required />
						<textarea className="input min-h-[120px] resize-none" rows={5} placeholder="Tin nhắn" required />
						<button className="btn-primary px-8 py-3">Gửi tin nhắn</button>
					</form>
				</div>
			</Container>
		</main>
	)
}

